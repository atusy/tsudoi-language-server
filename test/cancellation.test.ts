import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
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

import {
  asciiHalf,
  enteredMarker as ignoresEntered,
  ignoredHover,
  label as ignoredLabel,
} from "./fixtures/hover-ignores-signal.ts";

import { pullMarker } from "./fixtures/completion-counts-pulls.ts";

import {
  completionEntered,
  hoverEntered,
  throwMessage as cancelledThrowMessage,
} from "./fixtures/throws-on-cancel.ts";
import { throwMessage as uncancelledThrowMessage } from "./fixtures/hover-throws.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const hoverCancellable = fixture("hover-cancellable.ts");
const completionCancel = fixture("completion-cancel.ts");
const completionCountsPulls = fixture("completion-counts-pulls.ts");
const hoverIgnoresSignal = fixture("hover-ignores-signal.ts");
const throwsOnCancel = fixture("throws-on-cancel.ts");
const hoverThrows = fixture("hover-throws.ts");

/** The line a config author is meant to act on -- the PREFIX, never the stack. */
const failureLine = "tsudoi: textDocument/hover handler failed:";

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

/**
 * A test's own timeout, below the deadline this file's own
 * `applySuiteDeadline()` sets, so a park fails by name.
 *
 * IT MUST STAY BELOW THE AMBIENT DEADLINE: at 6000 against an ambient 5000, a
 * park died at the ambient one first and this constant never fired at all.
 */
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
    // and never fires. Only reading the flag at entry catches this, and the
    // -32800 below is what says the flag WAS read: a bridge that merely
    // subscribed would see no cancellation here at all and answer this hover
    // normally.
    //
    // THE HANDLER IS NOT ENTERED, and that is the second claim rather than a
    // detail of the first. Entering it would start work for a request already
    // answered -- a timer, a child process, a lock -- with nothing left to stop
    // it, since a stream's cleanup queues behind a pull that may never settle.
    //
    // THE CONTROL IS IN THE SAME SESSION AND AGAINST THE SAME MARKERS. `absent`
    // on its own is equally true of a server that died, of a fixture that never
    // loaded and of a marker string nobody writes.
    test("a request cancelled before it is dispatched is answered -32800 and never entered", async () => {
      const session = LspSession.start(runtime, hoverCancellable);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        // Gate open from the start: a handler entered here would ANSWER rather
        // than park, so nothing in this test waits on a release.
        didOpen(session, gateOpen);

        const inFlight = session.issueThenCancel("textDocument/hover", hoverParams(3));
        expect((await inFlight.response).error?.code).toBe(requestCancelled);

        const answered = await session.request<Hover>("textDocument/hover", hoverParams(4));
        expect(answered).toEqual(hoverFor(tagOf(4)));

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        // Read after exit: a marker written late is still a marker.
        expect(session.stderr).toContain(enteredMarker(tagOf(4), false));
        // BOTH STATES OF THE ENTRY MARKER, because the claim is that the
        // handler never ran -- not that it ran and read a particular flag.
        expect(session.stderr).not.toContain(enteredMarker(tagOf(3), true));
        expect(session.stderr).not.toContain(enteredMarker(tagOf(3), false));
      } finally {
        session.dispose();
      }
    });

    /**
     * The other half of the same rule, one pull further in: an abort that lands
     * while a batch is being SENT must not buy the generator another turn.
     *
     * WHY THE MOMENT IS FORCED RATHER THAN HOPED FOR: the fixture's body awaits
     * nothing between yields, so every pull and every race around it settles as
     * a microtask and the event loop is handed back at exactly one point in the
     * loop -- the awaited `sendProgress`. An incoming `$/cancelRequest` can
     * therefore be read THERE and nowhere else, whatever the machine's speed.
     *
     * COUNTED, NOT TIMED, and the two counts are what make the claim
     * falsifiable: every pull writes a line before it yields, and every batch
     * the drive accepts leaves as one `$/progress`. A drive that pulls once more
     * after the abort has one line it cannot account for.
     */
    test("cancelling while a batch is being sent starts no further pull", async () => {
      const session = LspSession.start(runtime, completionCountsPulls);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const inFlight = session.issue("textDocument/completion", completionParams());
        // Cancelled while provably mid-stream, which is what puts the abort
        // inside a send rather than before the first pull.
        await session.waitForProgress(1);
        session.cancel(inFlight.id);

        // A response that is not -32800 says the abort never landed -- the
        // generator ran out of batches first -- and the counts below would then
        // be a claim about nothing.
        expect((await inFlight.response).error?.code).toBe(requestCancelled);

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        // WITHOUT THIS, `equal counts` is satisfied by zero and zero -- a server
        // that streamed nothing and pulled nothing.
        expect(session.progressCount).toBeGreaterThan(0);
        expect(session.stderr.split(pullMarker).length - 1).toBe(session.progressCount);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // The same pre-dispatch path on the streaming side, where a MESSAGE is at
    // stake rather than just a return value. The generator is never pulled, so
    // the first batch is never produced -- and that batch is the EARLIEST thing
    // this drive could misdeliver, since it leaves as a `$/progress` literal
    // rather than as a response the epilogue still holds. Zero progress is what
    // says it stayed unproduced.
    test("a completion cancelled before it is dispatched answers -32800 and streams nothing", async () => {
      const session = LspSession.start(runtime, completionCancel);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        // Gate open from the start: nothing releases this handler but itself.
        didOpen(session, gateOpen);

        const inFlight = session.issueThenCancel("textDocument/completion", completionParams());
        expect((await inFlight.response).error?.code).toBe(requestCancelled);

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.progressCount).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // The response shape is PINNED, for both methods THIS FILE DRIVES, rather
    // than left to whatever the handler happened to produce. LSP 3.17 permits
    // answering a cancelled request normally; tsudoi does not, because the
    // client has already discarded the request's context.
    //
    // `both` NAMES THE METHODS THIS FILE DRIVES AND IS NOT AN ENUMERATION OF
    // TSUDOI'S. Every other row of the request table is cancellable too, both
    // drives answering through the same `answerUnlessCancelled`.
    //
    // THE REST IS COVERED ELSEWHERE AND BY CONSTRUCTION, said here so this file
    // is not read as the whole of it: test/methods-table.test.ts asserts that
    // EVERY method in the request table is answered -32800 when cancelled, so a
    // method joining it is covered the moment it is declared.
    //
    // WHAT IS PER-METHOD HERE AND NOT THERE, said precisely so the division of
    // labour does not blur: those table tests cancel BEFORE DISPATCH, where no
    // handler is entered at all. The two tests in this file cancel a handler
    // that is PARKED AND RUNNING, which is what measures that a result produced
    // after the cancellation is discarded. That is asserted for hover and
    // completion and for no other method.
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

    // Two sessions, one build. The cancelled one must not carry the label; the
    // control must -- otherwise `nowhere on stdout` is a claim about a broken
    // accumulator rather than about the server.
    test("a handler that never reads its signal still has its result suppressed", async () => {
      const cancelled = LspSession.start(runtime, hoverIgnoresSignal);
      const control = LspSession.start(runtime, hoverIgnoresSignal);
      try {
        await cancelled.request<InitializeResult>("initialize", initializeParams);
        await control.request<InitializeResult>("initialize", initializeParams);

        const inFlight = cancelled.issue("textDocument/hover", hoverParams(0));
        await cancelled.waitForStderr(ignoresEntered);
        cancelled.cancel(inFlight.id);

        const answered = await inFlight.response;
        expect(answered.error?.code).toBe(requestCancelled);
        expect(answered.result).toBeUndefined();

        // Read after exit: a value delivered LATE is still delivered.
        expect(await cancelled.request<null>("shutdown", noParams)).toBeNull();
        cancelled.notify("exit", null);
        expect(await cancelled.waitForExit()).toBe(0);
        expect(cancelled.stdout).not.toContain(ignoredLabel);
        // The load-bearing half: an escaped 破棄される候補 would defeat the
        // check above, and cannot defeat this one.
        expect(cancelled.stdout).not.toContain(asciiHalf);
        expect(cancelled.unframedStdoutBytes).toBe(0);

        const uncancelled = await control.request<Hover>("textDocument/hover", hoverParams(0));
        expect(uncancelled).toEqual(ignoredHover);
        expect(control.stdout).toContain(ignoredLabel);
        expect(control.stdout).toContain(asciiHalf);
      } finally {
        cancelled.dispose();
        control.dispose();
      }
    });

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
          const next = await session.request<null>("textDocument/completion", completionParams());
          // ANSWERED NORMALLY, PRESENCE FIRST. `completionParams()` here always
          // carries a partialResultToken, so the items leave as $/progress and
          // the response is `null` -- and a `null` on its own would also be
          // what a server that had died with the cancelled request produced.
          expect(session.progress.at(-1)).toEqual({
            token: partialResultToken,
            value: returnedItems,
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

    // Both halves in one run, against two sessions of one build: a server that
    // reported nothing at all would satisfy the absence and fail the contrast.
    test("a cancelled handler's throw is not reported, while an uncancelled one still is", async () => {
      const session = LspSession.start(runtime, throwsOnCancel);
      const uncancelled = LspSession.start(runtime, hoverThrows);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const hover = session.issue("textDocument/hover", hoverParams(0));
        await session.waitForStderr(hoverEntered);
        session.cancel(hover.id);
        expect((await hover.response).error?.code).toBe(requestCancelled);

        // The same claim for the streaming path, where the throw arrives out
        // of a generator rather than out of an awaited promise.
        const completion = session.issue("textDocument/completion", completionParams());
        await session.waitForStderr(completionEntered);
        session.cancel(completion.id);
        expect((await completion.response).error?.code).toBe(requestCancelled);

        // Read after exit, so nothing written late is missed.
        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.stderr).not.toContain("handler failed:");
        // Not one line of the stack either: the message is what a leak would
        // carry, and this fixture's is unmistakable.
        expect(session.stderr).not.toContain(cancelledThrowMessage);
        // And the suppressed diagnosis did not go to stdout instead.
        expect(session.unframedStdoutBytes).toBe(0);

        await uncancelled.request<InitializeResult>("initialize", initializeParams);
        const error = await uncancelled.requestError("textDocument/hover", hoverParams(0));
        expect(error.code).toBe(-32603);
        expect(uncancelled.stderr).toContain(failureLine);
        expect(uncancelled.stderr).toContain(uncancelledThrowMessage);
      } finally {
        session.dispose();
        uncancelled.dispose();
      }
    });

    // A client races: it cancels an id that has just been answered, or one it
    // has already given up on. Neither may produce a response, a diagnostic,
    // or a server that stops working.
    test("cancelling an unknown or already-answered id is ignored", async () => {
      const session = LspSession.start(runtime, hoverCancellable);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        // Gate open from the start, so these hovers answer without a release.
        didOpen(session, gateOpen);

        const answered = session.issue("textDocument/hover", hoverParams(5));
        expect((await answered.response).result).toEqual(hoverFor(tagOf(5)));

        const framedBefore = session.messagesReceived;
        // An id this session never issued, and one it issued and had answered.
        session.cancel(4242);
        session.cancel(answered.id);
        // Load-bearing: without it `nothing came back` is equally true of a
        // server that has not yet read either notification.
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(session.messagesReceived).toBe(framedBefore);

        const next = await session.request<Hover>("textDocument/hover", hoverParams(6));
        expect(next).toEqual(hoverFor(tagOf(6)));

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        // Every line tsudoi itself writes carries this prefix, whether it came
        // from a handler failure or from the connection's own logger.
        expect(session.stderr).not.toContain("tsudoi:");
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // Where cancellation earns its keep: bounding the streaming API. The
    // fixture yields AGAIN after the abort releases its gate, so `exactly one`
    // is a claim about what tsudoi refuses to forward, not about a cooperative
    // handler.
    test(
      "cancelling mid-stream leaves the chunk already sent and sends none after",
      async () => {
        const session = LspSession.start(runtime, completionCancel);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          await session.waitForProgress(1);
          session.cancel(inFlight.id);
          await session.waitForStderr(completionAborted);

          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);

          // The handler's second yield has had time to arrive if anything
          // would forward it; without this pause `none after` would be true of
          // a server that simply had not got there yet.
          await new Promise((resolve) => setTimeout(resolve, 50));
          // Content AND order: nothing retracts a chunk already on the wire,
          // and `arrived and stayed` reads the same as `never arrived` unless
          // the error's position after it is asserted too.
          //
          // Every $/progress and THIS request's response, by the id the helper
          // handed back. The full arrival list would additionally require that
          // the initialize response is #1 and that the server never speaks
          // unprompted -- neither of which is what cancellation promises.
          expect(session.arrivalsFor(inFlight.id)).toEqual([
            { kind: "progress", token: partialResultToken, value: beforeGate },
            { kind: "response", id: inFlight.id },
          ]);

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
  });
}
