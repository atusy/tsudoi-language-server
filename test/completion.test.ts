import { describe, expect, test } from "bun:test";
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

const completionChunks = fixture("completion-chunks.ts");
const completionGate = fixture("completion-gate.ts");
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
  });
}
