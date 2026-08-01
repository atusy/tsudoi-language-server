import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { beforeGate, cleanupMarker, parkedMarker } from "./fixtures/completion-ignores-signal.ts";
import {
  cleanupMarker as rejectsCleanupMarker,
  gateOpen,
  parkedMarker as rejectsParkedMarker,
  rejectDelayMs,
  returnedItems as rejectsReturnedItems,
} from "./fixtures/completion-ignores-signal-rejects.ts";
import {
  asciiHalf as hoverAsciiHalf,
  label as hoverLabel,
  parkedMarker as hoverParkedMarker,
} from "./fixtures/hover-parks-forever.ts";
import {
  answeredValue as hoverAnsweredValue,
  failedMarker as hoverFailedMarker,
  gateOpen as hoverGateOpen,
  parkedMarker as hoverRejectsParkedMarker,
  rejectDelayMs as hoverRejectDelayMs,
} from "./fixtures/hover-parks-forever-rejects.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const ignoresSignal = fixture("completion-ignores-signal.ts");
const ignoresSignalRejects = fixture("completion-ignores-signal-rejects.ts");
const hoverParksForever = fixture("hover-parks-forever.ts");
const hoverParksForeverRejects = fixture("hover-parks-forever-rejects.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * LSP's RequestCancelled. Written out rather than imported so that the wire
 * value is pinned here: an implementation that swapped the constant for
 * another of the library's error codes would still compile.
 */
const requestCancelled = -32800;

/** A client that wants partial results names a token; one that does not omits it. */
const streamingToken = "parked-partial-1";

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
 * A test's own timeout, below `bun test`'s default, so a request that is never
 * answered fails BY NAME rather than stalling the suite with no diagnostic.
 * That is the failure this whole file is about, so the margin matters.
 */
const gatedTimeoutMs = 6000;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * A HANDLER PARKED INSIDE `next()` IS STILL A REQUEST THAT MUST BE ANSWERED.
     *
     * Every other cancellation fixture in this suite is suspended AT A YIELD,
     * where the drive is between pulls and free to notice an abort. This one is
     * suspended INSIDE a pull, awaiting something that never settles and never
     * looking at its `AbortSignal` -- so a drive that awaits `next()` and asks
     * about cancellation only afterwards has nowhere to ask from. Neither the
     * -32800 nor the epilogue is ever reached: the client waits forever for a
     * request it has already given up on.
     *
     * WHAT THE GENERATOR DOES IS A SEPARATE QUESTION FROM WHAT THE CLIENT GETS,
     * and conflating the two is what left this open. `.return()` is queued
     * behind a pending `.next()` by the language, so the author's `finally`
     * genuinely cannot run until their await settles -- asserted below as an
     * ABSENCE, because it remains true and tsudoi cannot change it. It never
     * followed that the RESPONSE had to wait too.
     *
     * THE PAIR FOR THAT ABSENCE IS THE NEXT TEST, over a fixture whose await
     * DOES settle: the same marker, measured the same way, appears there. Without
     * it `no cleanup ran` would be equally true of a fixture with no `finally`.
     */
    test(
      "a completion parked inside a pull is answered -32800, though its generator cannot be",
      async () => {
        const session = LspSession.start(runtime, ignoresSignal);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          // Provably mid-stream, then provably PARKED: tsudoi has taken the
          // first chunk and asked for another, and that second pull is the one
          // that never settles.
          await session.waitForProgress(1);
          expect(session.progress[0]).toEqual({ token: streamingToken, value: beforeGate });
          await session.waitForStderr(parkedMarker, 1000);

          session.cancel(inFlight.id);

          // THE HEADLINE. Without the race this await never returns and the
          // test fails as a timeout -- which is exactly what the client sees.
          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);
          expect(answered.result).toBeUndefined();

          // The generator is STILL PARKED, and its cleanup is still queued
          // behind a pull that will not settle. tsudoi answered the client
          // without pretending otherwise.
          expect(session.stderr).not.toContain(cleanupMarker);

          // Nothing further reached the wire for a request the client has been
          // told is cancelled.
          expect(session.progressCount).toBe(1);

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          expect(session.progressCount).toBe(1);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    /**
     * THE PULL THE DRIVE WALKED AWAY FROM IS STILL A PROMISE, AND IT CAN REJECT.
     *
     * Racing `next()` against the abort means the losing pull is abandoned while
     * still pending. A handler whose ignored wait later FAILS rejects exactly
     * that promise -- and an unhandled rejection does not produce a diagnostic
     * for another test to find, it destroys the session. So the cure for a
     * parked request would be strictly worse than the disease unless a handler
     * stays attached to the loser.
     *
     * THE MEASUREMENT IS THE SESSION'S OWN EXIT CODE, for that reason.
     * test/cleanup.test.ts holds the permanent control that this measurement can
     * observe a death when there is one: a session that drops an unhandled
     * rejection exits 1 there.
     *
     * IT IS ALSO THE PAIR for the absence asserted above -- the same cleanup
     * marker, measured the same way, DOES appear once the await settles.
     */
    test(
      "the abandoned pull's later rejection is handled: the session survives and goes on serving",
      async () => {
        const session = LspSession.start(runtime, ignoresSignalRejects);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/completion", completionParams());
          await session.waitForProgress(1);
          await session.waitForStderr(rejectsParkedMarker, 1000);
          // The PAIR for the absence the previous test asserts: nothing has run
          // yet here either, because the wait is still pending.
          expect(session.stderr).not.toContain(rejectsCleanupMarker);

          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);

          // ...and the response provably OVERTOOK the wait, which is what makes
          // `promptly` a claim about ORDER rather than about this machine's
          // speed: the marker below cannot exist until the wait fails, and the
          // -32800 was already in hand above.
          await session.waitForStderr(rejectsCleanupMarker, rejectDelayMs + 2000);

          // THE SESSION IS STILL THERE. An unhandled rejection out of the
          // abandoned pull would have taken it down before this line.
          openGate(session);
          const next = await session.request<null>("textDocument/completion", completionParams());
          // Under a token the response is `null` for every completion, so the
          // last literal is what says this one was answered at all.
          expect(session.progress.at(-1)).toEqual({
            token: streamingToken,
            value: rejectsReturnedItems,
          });
          expect(next).toBeNull();

          const shutdown = session.issue("shutdown", noParams);
          await shutdown.response;
          session.notify("exit", null);
          // The whole claim, in one number: 1 is what a session killed by an
          // unhandled rejection exits with.
          expect(await session.waitForExit()).toBe(0);
          expect((await shutdown.response).error).toBeUndefined();
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    /**
     * THE SAME DEFECT ON THE OTHER DRIVE, AND THE REASON THIS FILE IS NOT ABOUT
     * COMPLETION.
     *
     * A hover handler that ignores its `AbortSignal` and awaits something that
     * never settles is suspended inside the ONE call the awaited-once drive
     * makes -- exactly as the completion handler above is suspended inside a
     * pull. The drive has the same nowhere to ask from, and the client is
     * answered the same nothing. Nothing about the streaming machinery was ever
     * what made that possible; awaiting the config author's promise
     * unconditionally was.
     *
     * THE FIXTURE'S WAIT NEVER SETTLES, WHICH IS WHAT SEPARATES THIS FROM
     * `a hover cancelled mid-flight ...` in test/cancellation.test.ts. That one's
     * handler RETURNS, so the epilogue is reached a moment late and suppresses
     * the answer; it would go on passing against a drive with no race at all.
     * This one has no later to reach.
     *
     * THE ANSWER IS ASSERTED, AND SO IS THE ABSENCE OF THE HOVER. Both halves:
     * -32800 with no result says the client was answered, and neither half of
     * the label appearing on the wire says it was not answered with the very
     * value the handler was still on its way to producing.
     */
    test(
      "a hover parked inside its own await is answered -32800, and none of its answer reaches the wire",
      async () => {
        const session = LspSession.start(runtime, hoverParksForever);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/hover", {
            textDocument: { uri },
            position: { line: 0, character: 0 },
          });
          // Provably PARKED before the cancel, so this measures a handler that
          // is running rather than one that has not been dispatched.
          await session.waitForStderr(hoverParkedMarker, 1000);

          session.cancel(inFlight.id);

          // THE HEADLINE. Without the race this await never returns and the test
          // fails as a timeout -- which is exactly what the client sees.
          const answered = await inFlight.response;
          expect(answered.error?.code).toBe(requestCancelled);
          expect(answered.result).toBeUndefined();

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          // NEITHER HALF OF THE LABEL, and the ASCII half is what makes the
          // absence honest: an encoder escaping the Japanese would walk straight
          // past a search for the raw characters.
          expect(session.stdout).not.toContain(hoverAsciiHalf);
          expect(session.stdout).not.toContain(hoverLabel);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );

    /**
     * THE ABANDONED CALL IS A PROMISE ON THIS DRIVE TOO, AND IT CAN REJECT.
     *
     * The claim is the one the completion test above makes, and it is NOT
     * covered by it: the two drives race at TWO call sites, only one of which is
     * a pull. A hand-rolled race written at either -- forwarding fulfilments and
     * dropping the rejection -- kills the session, and the fixture standing over
     * the other site would never see it. So each site owes its own exit code.
     *
     * THE MEASUREMENT IS THE SESSION'S OWN EXIT CODE, for that reason.
     * test/cleanup.test.ts holds the permanent control that this measurement can
     * observe a death when there is one: a session that drops an unhandled
     * rejection exits 1 there.
     *
     * AND THE RUNTIMES DISAGREE ABOUT WHETHER IT IS OBSERVABLE AT ALL -- a
     * hand-rolled race dies under deno with `Uncaught (in promise)` and survives
     * under bun -- which is why this runs on both and why the reason is recorded
     * at the site in src/methods.ts rather than left to this test to imply.
     */
    test(
      "a parked hover's later rejection is handled: the session survives and goes on serving",
      async () => {
        const session = LspSession.start(runtime, hoverParksForeverRejects);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "hold");

          const inFlight = session.issue("textDocument/hover", {
            textDocument: { uri },
            position: { line: 0, character: 0 },
          });
          await session.waitForStderr(hoverRejectsParkedMarker, 1000);

          session.cancel(inFlight.id);
          expect((await inFlight.response).error?.code).toBe(requestCancelled);

          // ...and the response provably OVERTOOK the wait, which makes this a
          // claim about ORDER rather than about this machine's speed: the marker
          // below cannot exist until the wait fails, and the -32800 was already
          // in hand above.
          await session.waitForStderr(hoverFailedMarker, hoverRejectDelayMs + 2000);

          // THE SESSION IS STILL THERE. An unhandled rejection out of the
          // abandoned call would have taken it down before this line.
          session.notify("textDocument/didChange", {
            textDocument: { uri, version: 2 },
            contentChanges: [{ text: hoverGateOpen }],
          });
          const next = await session.request<{ contents: { value: string } }>(
            "textDocument/hover",
            { textDocument: { uri }, position: { line: 0, character: 0 } },
          );
          expect(next.contents.value).toBe(hoverAnsweredValue);

          const shutdown = session.issue("shutdown", noParams);
          await shutdown.response;
          session.notify("exit", null);
          // The whole claim, in one number: 1 is what a session killed by an
          // unhandled rejection exits with.
          expect(await session.waitForExit()).toBe(0);
          expect((await shutdown.response).error).toBeUndefined();
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      gatedTimeoutMs,
    );
  });
}
