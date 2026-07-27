import { describe, expect, test } from "bun:test";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  beforeGate,
  cleanupMarker,
  gateOpen,
  parkedMarker,
} from "./fixtures/completion-cleanup.ts";
import {
  cleanupMarker as throwsCleanupMarker,
  cleanupThrowMessage,
  returnedItems as throwsReturnedItems,
} from "./fixtures/completion-cleanup-throws.ts";

const completionCleanup = fixture("completion-cleanup.ts");
const cleanupThrows = fixture("completion-cleanup-throws.ts");

/**
 * The line a config author is meant to act on -- the PREFIX tsudoi composes,
 * never its wording. It names the method and the phase, which is everything
 * that distinguishes this from the handler-failure line beside it.
 */
const cleanupFailureLine = "tsudoi: textDocument/completion cleanup failed:";

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

    // The discriminator the PO wrote a whole criterion for: the abort check
    // sits ABOVE the mode split, so a close applied one branch lower runs the
    // config author's cleanup for clients that asked for partial results and
    // silently skips it for every client that did not.
    test(
      "a cancelled AGGREGATING completion is closed too, though nothing streamed",
      async () => {
        const session = LspSession.start(runtime, completionCleanup);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          // No partialResultToken, so there is no $/progress to wait for: the
          // handler's own marker is what makes `mid-stream` sayable here.
          const inFlight = session.issue("textDocument/completion", completionParams(undefined));
          await session.waitForStderr(parkedMarker);
          // The mode is asserted, not assumed. Its permanent PAIR is the
          // streaming test above, where the same measurement over the same
          // fixture observes a chunk arriving.
          expect(session.progressCount).toBe(0);
          expect(session.stderr).not.toContain(cleanupMarker);

          session.cancel(inFlight.id);
          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);

          await session.waitForStderr(cleanupMarker, 1000);

          expect(await session.request<null>("shutdown", null)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          // Re-read after exit: a chunk sent late is still a chunk sent, and an
          // aggregating request must never have produced one.
          expect(session.progressCount).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    // Reporting and surviving are SEPARATE claims, so they are separate tests:
    // one perturbation cannot flip an assertion that is not there, and bundling
    // them would leave whichever came second defended by nothing.
    test(
      "cleanup that throws is named on stderr with tsudoi's own prefix",
      async () => {
        const session = LspSession.start(runtime, cleanupThrows);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          await session.waitForProgress(1);
          // The PAIR: nothing is reported while nothing has failed, so the
          // presence below is a claim about this failure and not about a server
          // that writes that line whenever it starts a completion.
          expect(session.stderr).not.toContain(cleanupFailureLine);

          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);

          await session.waitForStderr(cleanupFailureLine, 1000);
          // The config author's OWN message, not tsudoi's prose: a failure
          // reported without it names a method and nothing to act on, and a
          // path that mangles non-ASCII would say `後始末に失敗しました` in
          // replacement characters instead.
          expect(session.stderr).toContain(cleanupThrowMessage);

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

    // The other half of the PO's checklist item: survival, proven by the server
    // going on to answer. A cleanup failure has no response left to correct --
    // the client already has its -32800 -- so it must not be rethrown into a
    // path that takes the session down with it.
    test(
      "a session whose cleanup threw answers a later completion normally",
      async () => {
        const session = LspSession.start(runtime, cleanupThrows);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          await session.waitForProgress(1);
          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);
          // The FIXTURE's own marker, not tsudoi's report: this test must not
          // assert the report it is not defending.
          await session.waitForStderr(throwsCleanupMarker, 1000);

          openGate(session);
          const next = await session.request<CompletionItem[]>(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          expect(next).toEqual(throwsReturnedItems);

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
