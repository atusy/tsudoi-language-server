import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  beforeGate,
  cleanupMarker,
  gateOpen,
  parkedMarker,
} from "./fixtures/completion-cleanup.ts";

const completionCleanup = fixture("completion-cleanup.ts");

/**
 * LSP's RequestCancelled. Written out rather than imported so that the wire
 * value is pinned here: an implementation that swapped the constant for
 * another of the library's error codes would still compile.
 */
const requestCancelled = -32800;

/** A client that wants partial results names a token; one that does not omits it. */
const streamingToken = "cleanup-partial-1";

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * The one difference between the two dispatch modes, and the reason this PBI
 * needed two criteria: with a token the chunks stream as `$/progress`, without
 * one they are aggregated, and the close under test sits above that split.
 */
function completionParams(token: string | undefined): unknown {
  return token === undefined
    ? { textDocument: { uri }, position: { line: 0, character: 0 } }
    : { textDocument: { uri }, position: { line: 0, character: 0 }, partialResultToken: token };
}

function didOpen(session: LspSession, text: string): void {
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text },
  });
}

function openGate(session: LspSession): void {
  session.notify("textDocument/didChange", {
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: gateOpen }],
  });
}

/** A test's own timeout, below `bun test`'s default, so a park fails by name. */
const gatedTimeoutMs = 6000;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test(
      "a cancelled STREAMING completion is closed, so the handler's finally runs",
      async () => {
        const session = LspSession.start(runtime, completionCleanup);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          // Provably mid-stream: one chunk has already left as $/progress.
          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({ token: streamingToken, value: beforeGate });
          // The PAIR for the record asserted below: absent while the handler is
          // still running, so `it ran` is a claim about the cancellation rather
          // than about a generator that had already finished on its own.
          expect(session.stderr).not.toContain(cleanupMarker);

          session.cancel(inFlight.id);
          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);

          // The headline: cleanup a config author can never watch succeed.
          await session.waitForStderr(cleanupMarker, 1000);

          expect(await session.request<null>("shutdown", null)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );
  });
}
