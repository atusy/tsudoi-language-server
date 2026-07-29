import { describe, expect, test } from "bun:test";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type CompletionItem,
  type CompletionList,
  type InitializeResult,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  firstChunk,
  returnedItems as chunksReturned,
  secondChunk,
} from "./fixtures/completion-chunks.ts";
import {
  afterGate,
  beforeGate,
  gateOpen,
  returnedItems as gateReturned,
} from "./fixtures/completion-gate.ts";
import { partialChunk } from "./fixtures/completion-null-after-yield.ts";
import { recoveredItems, sentBeforeThrow, throwMessage } from "./fixtures/completion-throws.ts";
import {
  answered as listAnswered,
  firstChunk as listFirst,
  secondChunk as listSecond,
} from "./fixtures/completion-list.ts";
import {
  answered as finalAnswered,
  streamed as finalStreamed,
} from "./fixtures/completion-list-final.ts";

const completionChunks = fixture("completion-chunks.ts");
const completionList = fixture("completion-list.ts");
const completionListFinal = fixture("completion-list-final.ts");
const completionGate = fixture("completion-gate.ts");
const nullAfterYield = fixture("completion-null-after-yield.ts");
const nullOnly = fixture("completion-null-only.ts");
const completionThrows = fixture("completion-throws.ts");
const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));
// Supplies hover and NOT completion: a stronger negative than an empty
// `methods`, because a server advertising from `methods` being non-empty
// passes the empty fixture and fails this one.
const completionAbsent = fixture("hover-fixed.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

const uri = "file:///workspace/a.txt";

/** A client that wants partial results names a token; one that does not omits it. */
const partialResultToken = "completion-partial-1";

function completionParams(token?: string): unknown {
  const params = { textDocument: { uri }, position: { line: 0, character: 0 } };
  return token === undefined ? params : { ...params, partialResultToken: token };
}

function didOpen(session: LspSession, text: string): void {
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text },
  });
}

/**
 * A test's own timeout, below `bun test`'s default: a gate that never opens
 * must fail this one test by name rather than stall the suite.
 */
const gatedTimeoutMs = 4000;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // Exact equality on both halves: `completionProvider is present` would be
    // satisfied by advertising it always, and `absent` by advertising nothing.
    test("a config supplying a completion handler advertises completionProvider", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, completionProvider: {} });
      } finally {
        session.dispose();
      }
    });

    test("a config supplying no completion handler advertises exactly what it can answer", async () => {
      const session = LspSession.start(runtime, completionAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, hoverProvider: true });
      } finally {
        session.dispose();
      }
    });

    // Ordering against an outstanding response, not counting: a server that
    // buffered the answer and every yield and flushed them immediately before
    // responding produces the same three $/progress, and is the exact opposite
    // of what this story is for.
    //
    // THE FIRST LITERAL IS THE HANDLER'S ANSWER AND THE REST ARE ITS STREAM,
    // which is the specification's position rather than tsudoi's arrangement.
    // The property this test defends did not move with it: what leaves early
    // has to leave WHILE THE HANDLER IS STILL RUNNING.
    test(
      "the answer and each chunk reach the client as one $/progress while the handler is still running",
      async () => {
        const session = LspSession.start(runtime, completionGate);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          let settled = false;
          const response = session
            .request<CompletionItem[] | null>(
              "textDocument/completion",
              completionParams(partialResultToken),
            )
            .then((result) => {
              settled = true;
              return result;
            });
          // `await response` below still rejects; this only marks the rejection
          // handled. Without it a failure BEFORE the await leaves the request
          // outstanding, dispose kills the child, and the resulting unhandled
          // rejection is reported against whichever test runs next -- observed
          // while perturbing, where it blamed a passing test in the other
          // runtime for a failure that was not its own.
          response.catch(() => undefined);

          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({
            token: partialResultToken,
            value: beforeGate,
          });

          // The pause is load-bearing, not politeness: without it a server that
          // never blocked would not have settled yet either, and the assertion
          // below would pass for the wrong reason.
          await new Promise((resolve) => setTimeout(resolve, 50));
          expect(settled).toBe(false);
          expect(session.progressCount).toBe(1);

          session.notify("textDocument/didChange", {
            textDocument: { uri, version: 2 },
            contentChanges: [{ text: gateOpen }],
          });

          await session.waitForProgress(2);
          expect(session.progress[1]).toEqual({ token: partialResultToken, value: afterGate });

          await session.waitForProgress(3);
          // THE PAIR FOR THE `toBeNull()` BELOW. `gateReturned` used to be
          // asserted AS the response; it is now the stream's last chunk, and
          // without this line the assertion under it would be satisfied by a
          // server that answered null having sent nothing after the gate.
          expect(session.progress[2]).toEqual({ token: partialResultToken, value: gateReturned });

          expect(await response).toBeNull();
          // One $/progress per literal -- the answer and the two chunks -- and
          // no repeat of any of them on the way out.
          expect(session.progressCount).toBe(3);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    /**
     * DOUBLE DELIVERY, GUARDED AT ITS NEW MECHANISM. This replaces
     * `with a partialResultToken the response carries the returned array
     * alone`, whose property -- do not concatenate the yields into the response
     * -- was foreclosed at Sprint 42 by making the response `null` in every
     * streaming case. THE HAZARD IS NOT GONE, IT MOVED: the handler's ANSWER is
     * now the FIRST `$/progress` literal, so a drive that also merged it into
     * what it sent afterwards, or sent it twice, would hand a client that
     * appends 一番目 twice. Same defect, different door.
     *
     * THE EXACTLY-ONCE CLAIM IS THE FIRST ASSERTION, per Sprint 18: it is what
     * this test exists for, and a test whose first assertion was the null
     * response would stop there and never observe it.
     *
     * READ AS A CLIENT THAT APPENDS READS, which is why it is a flat count
     * rather than a comparison against three literals: a client concatenates
     * every literal's items in arrival order and then appends the response.
     * Counting labels over that whole view is the only thing that sees a
     * duplicate WHEREVER it was introduced.
     */
    test("a client that appends sees each item exactly once", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );

        const appended = [
          ...session.progress.flatMap((progress) => progress.value as CompletionItem[]),
          ...(result ?? []),
        ];
        expect(appended.map((item) => item.label)).toEqual(
          [...firstChunk, ...secondChunk, ...chunksReturned].map((item) => item.label),
        );
        // The response adds nothing, which is where the duplicate used to be
        // introduced and is the half the assertion above cannot localise.
        expect(result).toBeNull();
      } finally {
        session.dispose();
      }
    });

    // The same handler, driven the way a client that cannot take partial
    // results drives it: no token. That absence is the ONE observable trigger
    // -- LSP has no capability declaring partial-result support, so the second
    // trigger the brief describes collapses into this one.
    test("without a partialResultToken the answer and every chunk arrive as one response, and nothing streams", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(),
        );

        expect(result).toEqual([...firstChunk, ...secondChunk, ...chunksReturned]);
        // ZERO, not `none under the token I sent`: a server that streamed
        // anyway under a token it invented answers this response correctly and
        // still floods a client that never asked for partial results.
        expect(session.progressCount).toBe(0);

        expect(await session.request<null>("shutdown", null)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        // Re-read after exit: progress sent AFTER the response is still
        // progress nobody asked for.
        expect(session.progressCount).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * RETARGETED AT SPRINT 42 RATHER THAN DELETED, and what it used to say is
     * worth one paragraph because the deletion looked obvious. It asserted `[]`
     * after a partial result against `null` when there was none -- two
     * different empty answers, told apart by request-local state. THAT
     * DISTINCTION IS GONE BY CONSTRUCTION: under a token EVERY response is
     * `null`, because the answer has already left as the first literal and the
     * specification requires what follows to be empty in terms of result
     * values. Measured: both arms answer `null` now.
     *
     * WHAT SURVIVED IS THE TEST'S SHAPE, AND IT GUARDS THE REPLACEMENT HAZARD.
     * The two sessions still discriminate, on the question the new shape makes
     * decidable: an answer with NO stream must still STREAM ITS ANSWER, and
     * `return;` must stream NOTHING -- while both answer `null`. A drive that
     * skipped the literal when there was no generator would pass the response
     * half of both arms and fail here; so would one that emitted a literal for
     * a handler that said nothing at all.
     *
     * Both halves in one run against one build, as before. Neither is
     * satisfiable by a constant.
     */
    test("an answer with no stream still streams its answer, where `return;` streams nothing", async () => {
      const afterYield = LspSession.start(runtime, nullAfterYield);
      const immediate = LspSession.start(runtime, nullOnly);
      try {
        await afterYield.request<InitializeResult>("initialize", initializeParams);
        await immediate.request<InitializeResult>("initialize", initializeParams);

        const afterYieldResult = await afterYield.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        // The answer did leave, so the client already has it, and repeating it
        // in the response would double it for a client that appends.
        expect(afterYield.progress).toEqual([{ token: partialResultToken, value: partialChunk }]);
        expect(afterYieldResult).toBeNull();

        const immediateResult = await immediate.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        // Nothing left, so null says `nothing to say` -- which [] would have
        // reported to the client as an answered request with no candidates.
        expect(immediate.progressCount).toBe(0);
        expect(immediateResult).toBeNull();
      } finally {
        afterYield.dispose();
        immediate.dispose();
      }
    });

    // THE NO-TOKEN MODE, and until Sprint 13 its only home was the example
    // config. The three-case enumeration that stood here named
    // `emitted ? collected : null` in src/methods.ts -- AN EXPRESSION THAT NO
    // LONGER EXISTS, and the enumeration went with it. THE MODE TABLE THAT
    // REPLACES IT LIVES AT `MethodMap` IN src/types.ts, which is where the
    // violating edit would be made: five rows over `return;`, `[answer]` and
    // `[answer, chunks]`, each with and without a token. It is not restated
    // here, because a table in two places is a table that disagrees with itself.
    //
    // WHAT THIS TEST STILL CARRIES is the row a client that cannot take partial
    // results sees: with no token the answer is IN THE RESPONSE, and `null`
    // there would not merely lose the shape -- it would lose the CANDIDATES,
    // and the user would be told there are none.
    //
    // A PURPOSE-BUILT FIXTURE rather than the example, per amended standing
    // item 6: this property is stable, the example is not, and a property whose
    // home moves whenever the example changes is a property that can be lost by
    // a change unrelated to it. The example is still driven -- see the tests
    // below -- it is simply no longer the only thing carrying this.
    test("without a partialResultToken the answer is the response, and nothing streams", async () => {
      const session = LspSession.start(runtime, nullAfterYield);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(),
        );

        expect(result).toEqual(partialChunk);
        // The pair: nothing streamed, because nothing asked it to. Without it
        // `the response carries the answer` is satisfied by a server that also
        // sent it as progress, which would double it for a client that appends.
        expect(session.progressCount).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE MERGE IS CONFORMANCE, NOT A TSUDOI RULING, so what is cited here is
     * the specification and not an argument of ours: subsequent partial results
     * of `CompletionItem[]` ADD TO THE `items` PROPERTY of the `CompletionList`
     * provided first -- `_specifications/lsp/3.18/language/completion.md`, in
     * `textDocument/completion`'s own Partial Result line.
     *
     * NO TOKEN, so the merge happens locally and its RESULT is observable in one
     * response. Under a token the same rule is the client's to apply and tsudoi
     * has nothing to be right or wrong about.
     *
     * `isIncomplete` FIRST, per Sprint 18: it is the hazard this test owns. A
     * drive that rewrote it on drain would still concatenate the items
     * correctly, so a test whose first assertion was the items would go green on
     * exactly the defect this one exists to catch.
     */
    test("isIncomplete survives a merge untouched", async () => {
      const session = LspSession.start(runtime, completionList);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const result = await session.request<CompletionList | null>(
          "textDocument/completion",
          completionParams(),
        );

        expect(result?.isIncomplete).toBe(true);
        expect(result?.items).toEqual([...listAnswered, ...listFirst, ...listSecond]);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE AUTHOR'S LAST WORD, AND IT IS THE ONLY THING THAT MAY MOVE
     * `isIncomplete` AFTER THE ANSWER. The generator's return exists for the
     * case a handler cannot decide up front -- it answers INCOMPLETE, drains its
     * own source, and only then knows the set was final.
     *
     * THE VERDICT FIRST AND THE ITEMS SECOND, and the second assertion is not
     * decoration: the returned value is EMPTY by its own type, so a drive that
     * took its `items` rather than applying its other members over the merged
     * list would answer `isIncomplete: false` with NO CANDIDATES AT ALL -- and
     * would pass the first assertion while losing everything the request found.
     */
    test("a generator's return updates isIncomplete after the stream ended", async () => {
      const session = LspSession.start(runtime, completionListFinal);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const result = await session.request<CompletionList | null>(
          "textDocument/completion",
          completionParams(),
        );

        expect(result?.isIncomplete).toBe(false);
        expect(result?.items).toEqual([...finalAnswered, ...finalStreamed]);
      } finally {
        session.dispose();
      }
    });

    // THE EXAMPLE IS EXECUTED, which is what amended standing item 6 requires
    // of it: the config a reader copies is loaded and DRIVEN, end to end,
    // through the same server everything else here goes through. A change that
    // breaks it -- its import, or what its handler does -- reddens THIS.
    //
    // What it is no longer is the home of PBI-4's aggregation rule. That
    // property now lives on a purpose-built fixture above, because it is
    // stable and the example is not: the example lost its static demo item at
    // the stakeholder's request mid-sprint, and a property whose only home
    // moves with the example can be lost by a change that had nothing to do
    // with it. Item 6 was bundling `the example is executed` with `the example
    // is the sole subject`; only the first was ever load-bearing.
    //
    // The document lives in a throwaway directory so the fixture is the test's
    // own: the example answers from the document's parent, and the session's
    // cwd is the repo, which holds nothing matching this fragment.
    test("the example config is driven end to end and answers from the document's own directory", async () => {
      const documents = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-aggregate-")));
      writeFileSync(join(documents, "aggregated.txt"), "");
      const documentUri = pathToFileURL(join(documents, "doc.txt")).href;
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: "aggreg" },
        });

        const result = await session.request<CompletionList | null>("textDocument/completion", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: "aggreg".length },
        });

        expect(result?.items.map((item) => item.insertText)).toEqual(["aggregated.txt"]);
        // THE SPRINT'S USER-FACING HALF, ASSERTED AT THE ARTIFACT A READER
        // COPIES. The example completes a path, so the candidate set changes
        // with the next keystroke and a client must re-query rather than filter
        // what it holds. Before Sprint 42 this same request answered a bare
        // array, which the specification reads as `{ isIncomplete: false }` --
        // the opposite claim, made by nobody's decision.
        expect(result?.isIncomplete).toBe(true);
        expect(session.progressCount).toBe(0);

        // THE PAIR, and it is what keeps the assertion above from being
        // satisfiable by a server that answers a list for everything: a request
        // the example has NOTHING for is answered null -- `no answer at all` --
        // rather than an empty list, which would tell the user there are no
        // candidates. The example reaching BOTH outcomes is what makes `it is
        // really being driven` evidence rather than a single lucky call.
        //
        // DO NOT DROP THIS HALF TO SIMPLIFY THE TEST. It is not a second nice
        // assertion -- it is the ONLY half that carries amended standing item
        // 6's `breaking a handler's return must redden` control. A handler that
        // produced an empty list instead is INDISTINGUISHABLE at the populated
        // call above; the empty call is where the difference becomes visible.
        //
        // THE CONTROL SURVIVED SPRINT 42 IN PLACE, RE-MEASURED RATHER THAN
        // ASSUMED: the example's `null` is now spelled `return;` and the
        // perturbation is spelled `return [{ isIncomplete: true, items: [] }]`,
        // and it still reddens exactly here and nowhere else.
        const nothing = await session.request<CompletionList | null>("textDocument/completion", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: 0 },
        });
        expect(nothing).toBeNull();
      } finally {
        session.dispose();
        rmSync(documents, { recursive: true, force: true });
      }
    });

    test("a completion handler that throws after yielding keeps the chunk it already sent", async () => {
      const session = LspSession.start(runtime, completionThrows);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // -32603 InternalError: the client learns this request failed, which a
        // plausible [] would have hidden from it entirely. Issued rather than
        // awaited by name so the id below is THE ONE THIS REQUEST GOT, instead
        // of a 2 that is only correct while nothing above it changes.
        const completion = session.issue(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        const answered = await completion.response;
        expect(answered.error?.code).toBe(-32603);

        // The chunk was already on the wire, and nothing retracts what has been
        // written. `arrived and stayed` and `never arrived` are the same
        // silence unless the content AND the order against the failure are
        // asserted -- cleaning up by not emitting chunks on failure is a
        // plausible thing to do deliberately, and it would lose this.
        //
        // Every $/progress and THIS request's response, in wire order. What is
        // no longer required is that nothing else exists: a server that also
        // logged to the client would have broken this test while breaking no
        // promise it ever made.
        expect(session.arrivalsFor(completion.id)).toEqual([
          { kind: "progress", token: partialResultToken, value: sentBeforeThrow },
          { kind: "response", id: completion.id },
        ]);

        // The PREFIX only: error.stack's first line differs between JSC and V8.
        expect(session.stderr).toContain("tsudoi: textDocument/completion handler failed:");
        expect(session.stderr).toContain(throwMessage);

        // The handler fails once only, so this is `answered normally` as an
        // observation rather than as an absence of catastrophe.
        //
        // PRESENCE FIRST, ABSENCE SECOND. Under a token the recovered items
        // leave as the first `$/progress` literal of the SECOND request and the
        // response is `null` -- and a bare `toBeNull()` would be satisfied by a
        // server that answered nothing at all, which is exactly the failure
        // mode a throwing handler makes plausible.
        const second = await session.request<null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        expect(session.progress.at(-1)).toEqual({
          token: partialResultToken,
          value: recoveredItems,
        });
        expect(second).toBeNull();

        expect(await session.request<null>("shutdown", null)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        // The diagnosis went to stderr and stayed there.
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
