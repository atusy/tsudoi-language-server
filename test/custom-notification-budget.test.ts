import { describe, expect, test } from "bun:test";
import { type InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  answering,
  counter,
  rejecting,
  rejectionMessage,
} from "./fixtures/custom-notification-budget.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * HOW OFTEN EACH NOTIFICATION IS DRIVEN. More than one, because ONCE PER METHOD
 * PER SESSION and ONCE PER MESSAGE are the same reading at one.
 */
const rounds = 3;

/**
 * EVERY ARM HERE CARRIES ITS RUNTIME IN ITS OWN NAME, WHICH MOST SIBLING FILES DO
 * NOT AND WHICH IS NOT A STYLE. MEASURED at bun 1.3.13 on this very file: a
 * `<testcase>` in bun's JUnit report carries the `describe` in `classname` and
 * ONLY the `test()` string in `name`, and the re-running registry builds a run
 * into a Map KEYED BY `name`. So two arms differing only by their describe
 * collapse to ONE result, last write winning, and a record naming such an arm
 * reports whichever runtime bun wrote last while saying nothing about the other.
 *
 * IT IS DONE HERE BECAUSE THIS FILE IS POINTED AT BY A RECORD, which is the
 * condition test/code-action.test.ts states for its own copy of this line: every
 * other file in this shape is graded by no record, so the collapse costs them
 * nothing today.
 */
function named(runtime: { name: string }, what: string): string {
  return `${what} (${runtime.name})`;
}

/** Every `tsudoi: ` line the session has written, in arrival order. */
function reportedLines(session: LspSession): readonly string[] {
  return session.stderr.split("\n").filter((line) => line.startsWith("tsudoi: "));
}

/**
 * Drives both notifications `rounds` times, fencing each round behind a REQUEST
 * so the server has demonstrably reached the messages before the next round.
 *
 * AND THEN WAITS FOR THE REPORTS, which the fence does NOT buy: upstream's
 * message pump re-enters unconditionally rather than waiting for an awaited
 * notification handler, so a report can land after the response to a request
 * that was sent later. Waiting for the marker is what makes `exactly one` a
 * reading of a settled session rather than of a race -- and it fails by NAME
 * rather than by hanging, which is what a bare sleep here would do.
 */
async function driveBoth(session: LspSession): Promise<void> {
  for (let round = 0; round < rounds; round += 1) {
    session.notify(answering, { round });
    session.notify(rejecting, { round });
    await session.request(counter, {});
  }
  await session.waitForStderr(`tsudoi: ${answering}`);
  await session.waitForStderr(`tsudoi: ${rejecting}`);
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * ONE LINE PER METHOD PER SESSION, AND BOTH METHODS PRESENT. The pair is the
     * whole assertion: a session-wide flag satisfies `at most one line` and loses
     * the SECOND method's diagnostic for good, and an unconditional report
     * satisfies `both methods present` and floods the one channel a config author
     * reads -- a hook on a notification the editor sends per keystroke writes a
     * line per keystroke.
     *
     * TWO FAULTS AND NOT ONE. A handler that ANSWERED produced a value nothing
     * can carry, and one that REJECTED failed with nobody waiting; the author's
     * fix differs, so the report names which.
     *
     * AND THIS IS THE ONLY ENFORCEMENT THERE IS, which is what makes it worth the
     * code rather than belt-and-braces. MEASURED, with tsudoi's catch left in
     * place and the report deleted: stderr is EMPTY, the session goes on serving,
     * and a rejecting handler is observable by nothing at all -- the rejection is
     * caught by the awaiting frame rather than reaching either runtime's
     * unhandled-rejection path.
     */
    test(
      named(
        runtime,
        "a handler that answered and one that rejected are each named on stderr exactly once",
      ),
      async () => {
        const session = LspSession.start(runtime, fixture("custom-notification-budget.ts"));
        try {
          await session.request<InitializeResult>("initialize", initializeParams);

          await driveBoth(session);

          const lines = reportedLines(session);
          expect(lines.filter((line) => line.includes(answering))).toHaveLength(1);
          expect(lines.filter((line) => line.includes(rejecting))).toHaveLength(1);
          expect(lines).toHaveLength(2);
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE AUTHOR'S OWN WORDS REACH THEM, which the count above cannot say: a
     * report naming only the method tells them a handler failed and not what it
     * failed with, and there is no response anywhere carrying the reason.
     *
     * THE PAYLOAD IS JAPANESE for the reason test/cli.test.ts gives at its own
     * Japanese arm: an ASCII message survives a reader that decodes each pipe
     * chunk on its own, and this does not.
     */
    test(
      named(runtime, "the reason a notification handler rejected reaches the author's stderr"),
      async () => {
        const session = LspSession.start(runtime, fixture("custom-notification-budget.ts"));
        try {
          await session.request<InitializeResult>("initialize", initializeParams);

          await driveBoth(session);

          expect(session.stderr).toContain(rejectionMessage);
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE SESSION IS STILL SERVING AFTERWARDS, and the count is what says every
     * message reached its handler rather than the router having stopped at the
     * first failure. A rejection swallowed is not a session abandoned.
     *
     * AND STDOUT IS UNTOUCHED. The whole reason the report is on stderr is that
     * stdout belongs to LSP, so a report that reached it would be a framing
     * failure wearing a diagnostic -- and a client would see a protocol error,
     * not a message.
     */
    test(
      named(
        runtime,
        "the session answers a request after both faults, with nothing but LSP on stdout",
      ),
      async () => {
        const session = LspSession.start(runtime, fixture("custom-notification-budget.ts"));
        try {
          await session.request<InitializeResult>("initialize", initializeParams);

          await driveBoth(session);
          const ran = await session.request<Record<string, number>>(counter, {});

          expect(ran).toEqual({ [answering]: rounds, [rejecting]: rounds });
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
    );
  });
}
