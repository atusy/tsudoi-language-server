import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  beforeGate,
  cleanupEntered,
  cleanupFinished,
  gateOpen,
} from "./fixtures/completion-cleanup-yields.ts";
import {
  beforeGate as foreverBeforeGate,
  cleanupEntered as foreverCleanupEntered,
  returnedItems as foreverReturnedItems,
} from "./fixtures/completion-cleanup-yields-forever.ts";
import {
  cleanupEntered as throwsCleanupEntered,
  cleanupThrowMessage,
  returnedItems as throwsReturnedItems,
} from "./fixtures/completion-cleanup-yields-then-throws.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const cleanupYields = fixture("completion-cleanup-yields.ts");
const cleanupYieldsForever = fixture("completion-cleanup-yields-forever.ts");
const cleanupYieldsThenThrows = fixture("completion-cleanup-yields-then-throws.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * LSP's RequestCancelled. Written out rather than imported so that the wire
 * value is pinned here: an implementation that swapped the constant for
 * another of the library's error codes would still compile.
 */
const requestCancelled = -32800;

/**
 * The line a config author is meant to act on -- the PREFIX tsudoi composes,
 * never its wording. It names the method and the phase, which is everything
 * that distinguishes this from the handler-failure line beside it.
 */
const cleanupFailureLine = "tsudoi: textDocument/completion cleanup failed:";

/** A client that wants partial results names a token; one that does not omits it. */
const streamingToken = "drain-partial-1";

function completionParams(): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    partialResultToken: streamingToken,
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

/**
 * A test's own timeout, below the deadline this file's own
 * `applySuiteDeadline()` sets, so a park fails by name.
 *
 * IT SAID `BELOW bun test's DEFAULT` AND THAT WAS FALSE: 6000 is ABOVE bun's
 * 5000, so a park died at the ambient deadline first and this constant never
 * fired. True again only because the suite now sets 25_000.
 */
const gatedTimeoutMs = 6000;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * A `finally` MAY YIELD, AND ONE `.return()` IS NOT ENOUGH TO RUN IT.
     *
     * `.return()` resolves at that yield with `done: false` -- measured on both
     * runtimes -- because the RETURN COMPLETION is suspended by it. A drive that
     * takes that result as `closed` leaves the generator parked inside its own
     * `finally` and every statement below the yield never runs: on a real config
     * that is the second half of the author's cleanup, silently skipped on every
     * superseded keystroke.
     *
     * `done: false` IS NOT AN OBSTACLE BUT THE SIGNAL, which is the whole of the
     * fix: it says the cleanup has more to do, and `.next()` is how it is let do
     * it. A consumer writing `for await (...) { break }` leaves the same
     * generator in the same state -- but that consumer CHOSE to stop, where this
     * drive is holding the evidence that it should not have.
     *
     * BOTH MARKERS ARE ASSERTED AND NEITHER ALONE WOULD DO. `entered` says the
     * generator really was closed, so the second marker is evidence about a
     * DRAINED cleanup rather than one that simply ran; `finished` is the claim.
     * A test asserting only `entered` passes against the defect.
     */
    test(
      "a cleanup that yields is drained to the end, so the statements after that yield run",
      async () => {
        const session = LspSession.start(runtime, cleanupYields);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          // Provably mid-stream: one chunk has already left as $/progress.
          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({ token: streamingToken, value: beforeGate });
          // The PAIR for the record asserted below: absent while the handler is
          // still running, so `it ran` is a claim about the cancellation.
          expect(session.stderr).not.toContain(cleanupFinished);

          session.cancel(inFlight.id);
          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);

          // The control: cleanup provably STARTED, so the headline below is
          // about a cleanup that stalled rather than one never entered.
          await session.waitForStderr(cleanupEntered, 1000);
          // THE HEADLINE: the statement AFTER the `finally`'s own yield.
          await session.waitForStderr(cleanupFinished, 1000);
          // THE PERMANENT PAIR for the two tests below, which assert this line
          // PRESENT. A cleanup that finished is not a cleanup that failed, so a
          // drain reporting on every close would satisfy both of those and only
          // this absence tells the two apart.
          expect(session.stderr).not.toContain(cleanupFailureLine);

          // THE CLEANUP'S YIELD IS DISCARDED, WHICH IS THE OTHER HALF. Draining
          // pulls batches out of the generator, and a drive that forwarded them
          // would send `$/progress` for a request the client was told -32800
          // about -- trading a silent leak for a louder protocol violation.
          expect(session.progressCount).toBe(1);

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          // Re-read after exit: a chunk sent late is still a chunk sent.
          expect(session.progressCount).toBe(1);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    /**
     * WHY THE DRAIN IS BOUNDED, MADE CHECKABLE.
     *
     * Each cleanup yield is answered by a `next()` that settles as a MICROTASK,
     * so an unbounded drain over a `finally` that yields forever never hands the
     * event loop back: the session stops answering anything at all, which is the
     * orphaned server this project treats as a correctness failure rather than
     * an untidiness. The bound converts that into a truncated cleanup tsudoi
     * REPORTS.
     *
     * THIS TEST IS RED THREE WAYS, which is what makes it worth its runtime:
     * without a drain the report never appears, without a bound it never
     * terminates, and without a stderr line the truncation is silent.
     */
    test(
      "a cleanup that yields forever is abandoned at the bound, reported, and the session goes on serving",
      async () => {
        const session = LspSession.start(runtime, cleanupYieldsForever);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({ token: streamingToken, value: foreverBeforeGate });
          // The PAIR: nothing is reported while nothing has gone wrong.
          expect(session.stderr).not.toContain(cleanupFailureLine);

          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);

          await session.waitForStderr(foreverCleanupEntered, 1000);
          // Reported, not silent: a cleanup tsudoi gave up on is the one thing
          // the author cannot otherwise discover, since the client already has
          // its -32800 and nothing else changes.
          await session.waitForStderr(cleanupFailureLine, 2000);
          // Not one of the drained batches went out to a client that has
          // stopped listening.
          expect(session.progressCount).toBe(1);

          // THE SESSION IS STILL THERE, which is the claim the bound exists to
          // make. A drain that spun would starve the event loop and this request
          // would never be answered -- the test would fail as a timeout.
          openGate(session);
          const next = await session.request<null>("textDocument/completion", completionParams());
          // Under a token the response is `null` for every completion, so the
          // last literal is what says this one was answered at all.
          expect(session.progress.at(-1)).toEqual({
            token: streamingToken,
            value: foreverReturnedItems,
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

    /**
     * THE DRAIN MUST NOT BE THE THING THAT KILLS THE PROCESS.
     *
     * It is fired and never awaited, so a rejection from ANY of its pulls --
     * `.return()`'s or a later `.next()`'s -- is unhandled unless one handler
     * covers the whole drain. Unhandled, that takes the session down, which is
     * strictly worse than the leak the drain exists to fix.
     *
     * The measurement is the session's OWN EXIT CODE, because an unhandled
     * rejection leaves no trace for another test to find -- it destroys the
     * session that caused it. test/cleanup.test.ts holds the permanent proof
     * that this measurement can see a death when there is one.
     */
    test(
      "a cleanup that throws AFTER yielding is reported, and the session still exits 0",
      async () => {
        const session = LspSession.start(runtime, cleanupYieldsThenThrows);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          await session.waitForProgress(1);
          // The PAIR: nothing is reported while nothing has failed.
          expect(session.stderr).not.toContain(cleanupFailureLine);

          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);

          await session.waitForStderr(throwsCleanupEntered, 1000);
          await session.waitForStderr(cleanupFailureLine, 2000);
          // The config author's OWN message, not tsudoi's prose: a report
          // without it names a method and nothing to act on, and a path that
          // mangled non-ASCII would say this in replacement characters.
          expect(session.stderr).toContain(cleanupThrowMessage);
          expect(session.progressCount).toBe(1);

          // SURVIVAL, PROVEN BY SERVING. An unhandled rejection out of the
          // drain leaves no trace of its own -- it destroys the session -- so
          // the next answer and the exit code are the whole measurement.
          openGate(session);
          const next = await session.request<null>("textDocument/completion", completionParams());
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
  });
}
