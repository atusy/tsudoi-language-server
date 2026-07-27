import { describe, expect, test } from "bun:test";
import type { CompletionItem, Hover, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  abortedMarker,
  enteredMarker,
  gateOpen,
  hoverFor,
  tagOf,
} from "./fixtures/hover-cancellable.ts";
import {
  abortedMarker as completionAborted,
  beforeGate,
  returnedItems,
} from "./fixtures/completion-cancel.ts";

const hoverCancellable = fixture("hover-cancellable.ts");
const completionCancel = fixture("completion-cancel.ts");

/**
 * LSP's RequestCancelled. Written out rather than imported so that the wire
 * value is pinned here: an implementation that swapped the constant for
 * another of the library's error codes would still compile.
 */
const requestCancelled = -32800;

/** A client that wants partial results names a token; one that does not omits it. */
const partialResultToken = "cancel-partial-1";

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

function hoverParams(line: number): unknown {
  return { textDocument: { uri }, position: { line, character: 0 } };
}

function completionParams(): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    partialResultToken,
  };
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
    // Two in flight at once is the discriminator: ONE shared AbortController
    // satisfies every single-request cancellation criterion there is, and
    // fails only here.
    test(
      "cancelling one of two concurrent requests aborts that signal and no other",
      async () => {
        const session = LspSession.start(runtime, hoverCancellable);
        const cancelledTag = tagOf(1);
        const survivorTag = tagOf(2);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const cancelled = session.issue("textDocument/hover", hoverParams(1));
          const survivor = session.issue("textDocument/hover", hoverParams(2));

          // Both handlers are provably RUNNING, and both report a signal that
          // has not aborted -- the `false` half of the transition.
          await session.waitForStderr(enteredMarker(cancelledTag, false));
          await session.waitForStderr(enteredMarker(survivorTag, false));
          // The pause is load-bearing, not politeness: without it `neither has
          // aborted yet` is equally true of a server that has done nothing at
          // all, and the assertion below would pass for the wrong reason.
          await new Promise((resolve) => setTimeout(resolve, 50));
          expect(session.stderr).not.toContain(abortedMarker(cancelledTag));
          expect(session.stderr).not.toContain(abortedMarker(survivorTag));

          session.cancel(cancelled.id);

          // The `true` half, for the targeted request only.
          await session.waitForStderr(abortedMarker(cancelledTag));
          expect(session.stderr).not.toContain(abortedMarker(survivorTag));

          openGate(session);
          const answered = await survivor.response;
          expect(answered.error).toBeUndefined();
          expect(answered.result).toEqual(hoverFor(survivorTag));

          // Re-read once the survivor has finished: an abort arriving late, at
          // settle or teardown, is still an abort it never asked for.
          expect(session.stderr).not.toContain(abortedMarker(survivorTag));

          await cancelled.response;
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    // The path a subscribe-only bridge cannot see: vscode-jsonrpc cancels the
    // token source BEFORE calling the handler, which installs
    // CancellationToken.Cancelled, whose onCancellationRequested is Event.None
    // and never fires. Only reading the flag at entry catches this.
    test("a request cancelled before it is dispatched enters with its signal already aborted", async () => {
      const session = LspSession.start(runtime, hoverCancellable);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        // Gate open from the start: this handler must not park, so the marker
        // is written and the request settles without anything releasing it.
        didOpen(session, gateOpen);

        const inFlight = session.issueThenCancel("textDocument/hover", hoverParams(3));
        await inFlight.response;

        await session.waitForStderr(enteredMarker(tagOf(3), true), 500);
      } finally {
        session.dispose();
      }
    });

    // The response shape is PINNED, for both methods, rather than left to
    // whatever the handler happened to produce. LSP 3.17 permits answering a
    // cancelled request normally; tsudoi does not, because the client has
    // already discarded the request's context.
    test(
      "a cancelled hover is answered -32800 and the next hover is answered normally",
      async () => {
        const session = LspSession.start(runtime, hoverCancellable);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const cancelled = session.issue("textDocument/hover", hoverParams(1));
          await session.waitForStderr(enteredMarker(tagOf(1), false));
          session.cancel(cancelled.id);

          const answered = await cancelled.response;
          expect(answered.error?.code).toBe(requestCancelled);
          // The handler's Hover is DISCARDED, not delivered alongside: a stale
          // answer to a request the client has forgotten is the desync this
          // choice exists to prevent.
          expect(answered.result).toBeUndefined();

          openGate(session);
          const next = await session.request<Hover>("textDocument/hover", hoverParams(4));
          expect(next).toEqual(hoverFor(tagOf(4)));

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

    test(
      "a cancelled completion is answered -32800 and the next completion is answered normally",
      async () => {
        const session = LspSession.start(runtime, completionCancel);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const cancelled = session.issue("textDocument/completion", completionParams());
          // Cancelled while provably mid-stream: one chunk has already left.
          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({ token: partialResultToken, value: beforeGate });
          session.cancel(cancelled.id);
          await session.waitForStderr(completionAborted);

          const answered = await cancelled.response;
          expect(answered.error?.code).toBe(requestCancelled);
          expect(answered.result).toBeUndefined();

          openGate(session);
          const next = await session.request<CompletionItem[]>(
            "textDocument/completion",
            completionParams(),
          );
          expect(next).toEqual(returnedItems);

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
