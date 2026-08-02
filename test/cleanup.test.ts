import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
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

import {
  cleanupEntered,
  cleanupFinished,
  returnedItems as hangsReturnedItems,
} from "./fixtures/completion-cleanup-hangs.ts";
import { cleanupMarker as nonArrayCleanupMarker } from "./fixtures/completion-yields-non-array.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const completionCleanup = fixture("completion-cleanup.ts");
const cleanupThrows = fixture("completion-cleanup-throws.ts");
const cleanupHangs = fixture("completion-cleanup-hangs.ts");
const unhandledRejection = fixture("completion-unhandled-rejection.ts");
const yieldsNonArray = fixture("completion-yields-non-array.ts");

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

/**
 * JSON-RPC's InternalError, which is what vscode-jsonrpc answers a request whose
 * handler threw. Written out for the same reason as the constant above.
 */
const internalError = -32603;

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

/**
 * A test's own timeout, below the deadline this file's own
 * `applySuiteDeadline()` sets, so a park fails by name.
 *
 * IT SAID `BELOW bun test's DEFAULT` AND THAT WAS FALSE: 6000 is ABOVE bun's
 * 5000, so a park died at the ambient deadline first and this constant never
 * fired. True again only because the suite now sets 25_000 -- WHICH THE
 * eighteen-second CONSTANT BELOW ALSO NEEDED, having been above bun's default
 * by more than three times.
 */
const gatedTimeoutMs = 6000;

/** Three sessions in one test, so the same margin per session as the others. */
const exitTimeoutMs = 18000;

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

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
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

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
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

    /**
     * CANCELLATION IS NOT THE ONLY WAY OUT OF THAT LOOP, and it was the only one
     * that closed the generator.
     *
     * The drive's loop has exits the two tests above do not reach, and two of
     * them are EXCEPTIONS THROWN WHILE THE GENERATOR IS PARKED AT ITS YIELD:
     * the drive's own `Array.isArray` guard refusing a batch that is not one,
     * and a `sendProgress` that rejects once the connection is Closed -- the
     * editor died mid-stream. Either
     * propagates out of the drive, and with the close reachable only from the
     * abort branch the generator was never touched again: the author's `finally`
     * NEVER RAN, on a path where the handler is holding whatever it opened.
     *
     * THE EDITOR-DEATH ARM IS THE ONE THAT COSTS, and this test is not it: it
     * needs a dead connection to provoke, and it leaves the drive at the same
     * point this does. What makes THIS arm the one worth a fixture is that a
     * plain client reaches it with no editor death at all -- no
     * `partialResultToken`, one mistyped batch, and nothing BEFORE that guard,
     * in tsudoi or in either runtime, checks the payload.
     *
     * BOTH HALVES ARE ASSERTED AND NEITHER ALONE WOULD DO. The error response
     * says the handler really did throw with the generator suspended, so the
     * marker is evidence about an ABANDONED generator rather than one that ran
     * to completion; the marker says the abandonment closed it. A test asserting
     * only the marker would pass against a fixture that simply finished.
     */
    test(
      "a completion abandoned by a THROW is closed too, so the handler's finally runs",
      async () => {
        const session = LspSession.start(runtime, yieldsNonArray);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const failure = await session.requestError(
            "textDocument/completion",
            completionParams(undefined),
          );
          expect(failure.code).toBe(internalError);

          await session.waitForStderr(nonArrayCleanupMarker, 1000);

          // The session goes on to shut down cleanly: a close fired on this path
          // must no more take the process down than one fired on the abort path.
          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
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

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
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
          const next = await session.request<null>(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          // ANSWERED NORMALLY, AND THE PRESENCE IS ASSERTED FIRST. Under a
          // token the items leave as $/progress and the response is `null`, so
          // `next` alone cannot tell `answered normally` from `answered
          // nothing` -- a session killed by the cleanup failure would produce
          // no last literal at all.
          expect(session.progress.at(-1)).toEqual({
            token: streamingToken,
            value: throwsReturnedItems,
          });
          expect(next).toBeNull();

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    // Proven by ORDER, never by a stopwatch. A timeout would only say the
    // machine was fast enough; here cleanup is held open by a gate only this
    // test can release, so the -32800 provably overtakes it -- and the record
    // that could not have existed yet appears the moment the gate is opened.
    test(
      "cleanup that never settles does not delay the -32800",
      async () => {
        const session = LspSession.start(runtime, cleanupHangs);
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

          // The response arrives while cleanup is still parked...
          expect((await inFlight.response).error?.code).toBe(requestCancelled);
          expect(session.stderr).not.toContain(cleanupFinished);
          // ...and cleanup provably STARTS, so the absence above says the
          // response overtook cleanup rather than that nothing was closed.
          //
          // AWAITED RATHER THAN READ, because the response does not wait on
          // this handler at all: the abort is raced against the pending pull, so
          // the -32800 is sent while the generator is still inside it, and the
          // close cannot reach the author's `finally` until that pull settles --
          // `.return()` is queued behind it by the language. A synchronous read
          // here would be asserting that cleanup starts BEFORE the answer, which
          // is the very coupling cancellation was freed from.
          await session.waitForStderr(cleanupEntered, 1000);

          // Release it, and the same measurement observes the record: the
          // permanent pair for the absence asserted above.
          openGate(session);
          await session.waitForStderr(cleanupFinished, 1000);

          const next = await session.request<null>(
            "textDocument/completion",
            completionParams(streamingToken),
          );
          // The same presence-first pairing as the test above, and for the same
          // reason: `null` is what EVERY streaming response is, so the last
          // literal is the only thing that says this request was answered.
          expect(session.progress.at(-1)).toEqual({
            token: streamingToken,
            value: hangsReturnedItems,
          });
          expect(next).toBeNull();

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    // Where the rejection is asserted so it CANNOT be laundered. An unhandled
    // rejection does not leave a trace for another test to find -- it destroys
    // the session that caused it -- so the session's OWN exit code is the
    // measurement, and the third session is the permanent proof that this
    // measurement can observe a death when there is one.
    //
    // Exit codes, never diagnostic text: bun prints a source frame here and
    // deno prints `error: Uncaught (in promise)`, and a suite that asserted
    // either would be pinning a runtime's wording.
    test(
      "cleanup that threw or is still parked leaves the session exiting 0, where an unhandled rejection exits 1",
      async () => {
        const threw = LspSession.start(runtime, cleanupThrows);
        const parked = LspSession.start(runtime, cleanupHangs);
        const control = LspSession.start(runtime, unhandledRejection);
        try {
          for (const session of [threw, parked, control]) {
            await session.request<InitializeResult>("initialize", initializeParams);
            session.notify("initialized", {});
            didOpen(session, "hold");
          }

          for (const [session, marker] of [
            [threw, throwsCleanupMarker],
            [parked, cleanupEntered],
          ] as const) {
            const inFlight = session.issue(
              "textDocument/completion",
              completionParams(streamingToken),
            );
            await session.waitForProgress(1);
            session.cancel(inFlight.id);
            expect((await inFlight.response).error?.code).toBe(requestCancelled);
            // Cleanup has provably run -- and for `parked`, is still running:
            // its gate is never opened, so this session shuts down with cleanup
            // outstanding, which is exactly the state that must not hold it up.
            await session.waitForStderr(marker, 1000);
          }

          // The control is not cancelled at all: its handler simply drops a
          // rejection nothing handles, the way tsudoi would if the close were
          // fired with `void` instead of a handler.
          control.issue("textDocument/completion", completionParams(streamingToken));
          expect(await control.waitForExit()).toBe(1);
          // The runtime's own crash diagnostic went to stderr, not into the
          // stream a client is framing.
          expect(control.unframedStdoutBytes).toBe(0);

          for (const session of [threw, parked]) {
            // `issue`, not `request`: a session that died settles this with a
            // wire-shaped error, so the assertion that flips is the EXIT CODE
            // rather than an await that rejects one line earlier.
            const shutdown = session.issue("shutdown", noParams);
            await shutdown.response;
            session.notify("exit", null);
            expect(await session.waitForExit()).toBe(0);
            expect((await shutdown.response).error).toBeUndefined();
            expect(session.unframedStdoutBytes).toBe(0);
          }
        } finally {
          threw.dispose();
          parked.dispose();
          control.dispose();
        }
      },
      exitTimeoutMs,
    );
  });
}
