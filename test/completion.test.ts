import { describe, expect, test } from "bun:test";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type CompletionItem,
  type InitializeResult,
  type ServerCapabilities,
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
const completionChunks = fixture("completion-chunks.ts");
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

/**
 * Advertised for EVERY config, so it stands in every exact-equality pin below
 * and is not evidence about the fixture any one of them drives. Why tsudoi
 * claims it unconditionally -- it mirrors folders whatever the config supplies --
 * is at the capabilities literal in src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
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

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          completionProvider: {},
        });
      } finally {
        session.dispose();
      }
    });

    test("a config supplying no completion handler advertises exactly what it can answer", async () => {
      const session = LspSession.start(runtime, completionAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          hoverProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    // TOKEN PRESENT, SEVERAL BATCHES -- and this arm asserts the thing a count
    // alone cannot: ORDERING AGAINST AN OUTSTANDING RESPONSE. A server that
    // buffered every yield and flushed them immediately before responding
    // produces the same three $/progress and is the exact opposite of what this
    // story is for, so what is measured is that a batch leaves WHILE THE HANDLER
    // IS STILL RUNNING.
    //
    // THE PROPERTY SURVIVED TWO SHAPE CHANGES UNTOUCHED, which is worth the
    // sentence: these three literals were three yields, then an answer plus two
    // chunks, and are three yields again. What has to leave early has never
    // depended on which of them the handler called what.
    test(
      "each batch reaches the client as its own $/progress while the handler is still running",
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
          // asserted AS the response; it is now the last batch, and without this
          // line the assertion under it would be satisfied by a server that
          // answered null having sent nothing after the gate.
          expect(session.progress[2]).toEqual({ token: partialResultToken, value: gateReturned });

          expect(await response).toBeNull();
          // One $/progress per batch, and no repeat of any of them on the way
          // out -- the response half of this arm's channel claim.
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
     * streaming case. THE HAZARD IS NOT GONE AND IT HAS NOW OUTLIVED TWO
     * MECHANISMS: a drive that streamed a batch AND aggregated it into the
     * response, or sent one twice, hands a client that appends 一番目 twice.
     * Sprint 42's door -- the answer both leaving as the first literal and being
     * merged into what followed -- is closed with the tuple; this one is the
     * general form and does not depend on any shape.
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

    // TOKEN ABSENT, SEVERAL BATCHES: the same handler, driven the way a client
    // that cannot take partial results drives it. That absence is the ONE
    // observable trigger -- LSP has no capability declaring partial-result
    // support, so the second trigger the brief describes collapses into this
    // one. The PAIRED PRESENCE for its zero, per Sprint 6, is the same counter
    // reading three in the arm above and one in the one-batch arm below.
    test("without a partialResultToken every batch arrives as one response, and nothing streams", async () => {
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
     * TOKEN PRESENT, ONE BATCH -- THE ARM THE WHOLE RULE TURNS ON. The other
     * three arms of `the token decides the channel` are satisfied by any drive
     * that happens to agree today; this is the one that separates `the token
     * decides` from `the drive decides, and the token usually agrees`. A stream
     * that yielded EXACTLY ONCE under a token spends one `$/progress` and a
     * `null` response, knowingly, where a look-ahead would have answered with
     * the batch and sent nothing.
     *
     * THE PROGRESS COUNT IS THE FIRST ASSERTION, per Sprint 18 and on purpose.
     * The perturbation this arm exists for -- make the drive skip `$/progress`
     * when only one batch was produced -- flips BOTH assertions, and bun stops
     * at the first: with the response first, the failure would name a list where
     * `null` was expected and say nothing about the channel. Reading only the
     * response cannot tell this arm from the no-token one at all.
     *
     * ITS FIXTURE MUST YIELD EXACTLY ONE BATCH or the perturbation is not
     * reached and this green records nothing; completion-null-after-yield.ts
     * says so at its own site.
     *
     * AND THE SECOND SESSION IS THE PAIRED ABSENCE, per Sprint 6: zero yields
     * must produce ZERO `$/progress`, measured by the same counter that saw one
     * above. Both halves in one run against one build. Neither is satisfiable by
     * a constant, and `null` is the response in both -- which is why the counter
     * is what discriminates them.
     */
    test("with a token, a stream that yields once still streams it, where one that yields nothing streams nothing", async () => {
      const afterYield = LspSession.start(runtime, nullAfterYield);
      const immediate = LspSession.start(runtime, nullOnly);
      try {
        await afterYield.request<InitializeResult>("initialize", initializeParams);
        await immediate.request<InitializeResult>("initialize", initializeParams);

        const afterYieldResult = await afterYield.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        // ONE, and it is the channel claim: the batch left as $/progress rather
        // than as the response, even though this stream produced only one.
        expect(afterYield.progressCount).toBe(1);
        // ...carrying what the handler produced, so `one message` cannot be
        // satisfied by a server that sent an empty one.
        expect(afterYield.progress).toEqual([{ token: partialResultToken, value: partialChunk }]);
        // The batch already left, so repeating it in the response would double
        // it for a client that appends.
        expect(afterYieldResult).toBeNull();

        const immediateResult = await immediate.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        // Nothing was yielded, so null says `nothing to say` -- which [] would
        // have reported to the client as an answered request with no candidates.
        expect(immediate.progressCount).toBe(0);
        expect(immediateResult).toBeNull();
      } finally {
        afterYield.dispose();
        immediate.dispose();
      }
    });

    // TOKEN ABSENT, ONE BATCH -- the fourth arm, and it is the SAME FIXTURE the
    // token-present one-batch arm above drives. That is what makes the pair
    // discriminating: one handler, one build, and the ONLY difference between
    // the two runs is whether the client sent a token.
    //
    // THE MODE TABLE IS AT `MethodMap` IN src/types.ts, which is where the
    // violating edit would be made, and it is not restated here because a table
    // in two places is a table that disagrees with itself.
    //
    // WHAT THIS TEST CARRIES is the row a client that cannot take partial
    // results sees: with no token the batch is IN THE RESPONSE, and `null` there
    // would not merely lose the shape -- it would lose the CANDIDATES, and the
    // user would be told there are none.
    //
    // A PURPOSE-BUILT FIXTURE rather than the example, per amended standing
    // item 6: this property is stable, the example is not, and a property whose
    // home moves whenever the example changes is a property that can be lost by
    // a change unrelated to it. The example is still driven -- see the tests
    // below -- it is simply no longer the only thing carrying this.
    test("without a partialResultToken one batch is the whole response, and nothing streams", async () => {
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

    /*
     * TWO TESTS STOOD HERE AND DIED AT SPRINT 43 -- `isIncomplete survives a
     * merge untouched` and `a generator's return updates isIncomplete after the
     * stream ended` -- WITH THEIR FIXTURES. TARGET DELIBERATELY REMOVED per
     * Sprint 38 and not a defence that went quiet: a completion handler yields
     * `CompletionItem[]` and nothing else, so neither the `CompletionList`
     * answer they asserted about nor the content-bearing generator return that
     * updated it can be written at all. Their subject is gone, not undefended.
     *
     * AND THE QUESTION A DELETION SKIPS, ASKED: DOES THE NEW SHAPE CREATE AN
     * ANALOGOUS HAZARD? The first test guarded tsudoi REWRITING a property the
     * author set while merging. Nothing this drive concatenates carries a
     * property any more -- it appends arrays of items -- so there is no member
     * for a merge to touch and the hazard has no new door. The SECOND hazard
     * they shared, a merge that lost or doubled items, is not gone and is
     * guarded above by `a client that appends sees each item exactly once`.
     *
     * WHERE THE CAPABILITY IS RECORDED AS LOST rather than forgotten: at the two
     * configs still ruled NOT COMPLETE, examples/completion-path.ts and
     * examples/tsudoi.config.ts, which now say the claim is still wrong and why
     * it cannot be stated. The nvim measurement that showed a client acting on
     * `isIncomplete` is in Sprint 42's record, which is where a future attempt
     * starts.
     */

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

        const result = await session.request<CompletionItem[] | null>("textDocument/completion", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: "aggreg".length },
        });

        expect(result?.map((item) => item.insertText)).toEqual(["aggregated.txt"]);
        // A BARE ARRAY AGAIN SINCE SPRINT 43, AND THE ASSERTION THAT STOOD HERE
        // DIED WITH THE CAPABILITY. An assertion that the response claimed
        // `isIncomplete: true` was this sprint's user-facing half one sprint
        // ago; a handler can no longer say it in any spelling, so what this
        // request now sends is what the specification reads as
        // `{ isIncomplete: false, items }` -- a claim
        // examples/completion-path.ts rules FALSE at its own site and can no
        // longer contradict on the wire.
        //
        // THE DEAD ASSERTION IS DESCRIBED RATHER THAN QUOTED, and that is not
        // fastidiousness: this project measures `none weakened` by grepping
        // every source line that opens an assertion call, so a comment quoting
        // one INFLATES THE INSTRUMENT BY ONE. Measured here -- a first draft of
        // this very comment put the predicted 708 at 709, while the runtime
        // count and the test count both landed exactly.
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
        // THE CONTROL HAS NOW SURVIVED TWO SHAPE CHANGES IN PLACE, RE-MEASURED
        // EACH TIME RATHER THAN ASSUMED. At Sprint 43 the example's `null` is
        // what tsudoi answers for a generator that YIELDED NOTHING, and the
        // perturbation is spelled `yield []` at that generator's own exit in
        // examples/completion-path.ts: it reddens EXACTLY here, `Received: []`,
        // and nowhere else -- two tests, one per runtime.
        //
        // AND THE FIRST ATTEMPT AT THAT RE-MEASUREMENT WAS DEGENERATE, recorded
        // because the green looked like success. Perturbing the `if (!document)`
        // arm in examples/tsudoi.config.ts left the whole file GREEN -- not
        // because the control is quiet, but because THIS REQUEST NEVER REACHES
        // THAT ARM: the document IS in the store, and the `null` comes from
        // there being no path fragment at character 0. Sprint 42's retro asks
        // exactly this before reading a green -- whether what you perturbed is
        // reached by what you measured.
        const nothing = await session.request<CompletionItem[] | null>("textDocument/completion", {
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
