import { describe, expect, test } from "bun:test";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type CompletionItem,
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
  change: TextDocumentSyncKind.Full,
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
    // buffered every yield and flushed them immediately before responding
    // produces the same two $/progress, and is the exact opposite of what
    // this story is for.
    test(
      "each yield reaches the client as one $/progress while the handler is still running",
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

          expect(await response).toEqual(gateReturned);
          // One $/progress per yield: no repeat of a chunk on the way out.
          expect(session.progressCount).toBe(2);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    // The yields already left as $/progress. A client that appends this
    // response to what it collected must see each item exactly once, so a
    // server concatenating here would hand it 一番目 twice.
    test("with a partialResultToken the response carries the returned array alone", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );

        expect(result).toEqual(chunksReturned);
        expect(session.progress).toEqual([
          { token: partialResultToken, value: firstChunk },
          { token: partialResultToken, value: secondChunk },
        ]);
      } finally {
        session.dispose();
      }
    });

    // The same handler, driven the way a client that cannot take partial
    // results drives it: no token. That absence is the ONE observable trigger
    // -- LSP has no capability declaring partial-result support, so the second
    // trigger the brief describes collapses into this one.
    test("without a partialResultToken the yields and the return arrive as one response, and nothing streams", async () => {
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

    // Both halves in one run against one build. A dispatch answering [] for
    // every null passes the first and fails the second; one answering null for
    // every null does the reverse. Neither is satisfiable by a constant.
    test("a null return is [] after a partial result and null when there was none", async () => {
      const afterYield = LspSession.start(runtime, nullAfterYield);
      const immediate = LspSession.start(runtime, nullOnly);
      try {
        await afterYield.request<InitializeResult>("initialize", initializeParams);
        await immediate.request<InitializeResult>("initialize", initializeParams);

        const afterYieldResult = await afterYield.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        // The chunk did leave, so the client already has it: [] says `nothing
        // further`, and repeating the chunk here would double it.
        expect(afterYield.progress).toEqual([{ token: partialResultToken, value: partialChunk }]);
        expect(afterYieldResult).toEqual([]);

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

    // THE THIRD MODE, and until Sprint 13 its only home was the example config.
    // `emitted ? collected : null` in src/methods.ts answers all three, which
    // is why one expression needs three cases to be pinned:
    //
    //   streamed, yields then null -> []   (the test above)
    //   streamed, nothing at all    -> null (the test above)
    //   AGGREGATED, yields then null -> THE COLLECTED YIELDS, never []
    //
    // The third is the one a client that cannot take partial results sees, and
    // [] there does not merely lose the shape -- it loses the CANDIDATES, and
    // the user is told there are none.
    //
    // A PURPOSE-BUILT FIXTURE rather than the example, per amended standing
    // item 6: this property is stable, the example is not, and a property whose
    // home moves whenever the example changes is a property that can be lost by
    // a change unrelated to it. The example is still driven -- see the tests
    // below -- it is simply no longer the only thing carrying this.
    test("without a partialResultToken a yields-then-null handler answers the yields, not []", async () => {
      const session = LspSession.start(runtime, nullAfterYield);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(),
        );

        expect(result).toEqual(partialChunk);
        // The pair: nothing streamed, because nothing asked it to. Without it
        // `the response carries the chunk` is satisfied by a server that also
        // sent it as progress, which would double it for a client that appends.
        expect(session.progressCount).toBe(0);
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

        const result = await session.request<CompletionItem[] | null>("textDocument/completion", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: "aggreg".length },
        });

        expect(result?.map((item) => item.insertText)).toEqual(["aggregated.txt"]);
        expect(session.progressCount).toBe(0);

        // THE PAIR, and it is what keeps the assertion above from being
        // satisfiable by a server that answers [] for everything: a request
        // that yields NOTHING is answered null -- `nothing to say at all` --
        // rather than the [] that means `nothing further to add`. The example
        // reaching BOTH outcomes is what makes `it is really being driven`
        // evidence rather than a single lucky call.
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
        const second = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionParams(partialResultToken),
        );
        expect(second).toEqual(recoveredItems);

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
