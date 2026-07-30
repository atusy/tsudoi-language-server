// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let a LATER hover past its gate. */
export const gateOpen = "release";

/** What the hover that DOES answer says, so the session is seen serving. */
export const answeredValue = "hover-parks-forever-rejects: answered";

/** Written once the handler is provably inside the wait that will fail. */
export const parkedMarker = "hover-parks-forever-rejects: parked";

/** Written after the wait fails, which is the only evidence it ever did. */
export const failedMarker = "hover-parks-forever-rejects: the wait failed";

/**
 * How long the wait runs before it FAILS. Long enough that the -32800 provably
 * overtakes it -- the response is asserted while this is still pending -- and
 * short enough that the test does not sit on it.
 */
export const rejectDelayMs = 300;

/**
 * A HOVER HANDLER THAT IGNORES ITS SIGNAL AND WHOSE WAIT REJECTS, which is the
 * awaited-once drive's counterpart to
 * test/fixtures/completion-ignores-signal-rejects.ts.
 *
 * WHY IT CANNOT BE THE FIXTURE THAT NEVER SETTLES. A promise that never settles
 * never rejects, so it proves the -32800 and NOTHING about the call the drive
 * walked away from. Racing the handler against the abort leaves that call
 * pending, and it is still the config author's -- when their ignored wait fails
 * it rejects exactly that promise. Unhandled, the runtime destroys the session,
 * and the cure for a parked request would be strictly worse than the disease.
 *
 * WHY THE COMPLETION FIXTURE DOES NOT COVER IT: the two drives race at two
 * different call sites, and only one of them is a pull. A hand-rolled race
 * written at either site forwards fulfilments and drops the rejection, and the
 * fixture standing over the other site would not notice.
 *
 * THE GATE IS FOR A LATER REQUEST, not this one: this handler is not releasable,
 * and the gate is what lets a SECOND hover answer normally, so `the session
 * survived` is a claim about it serving rather than about it merely not printing
 * anything.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": async (
        context: RequestContext,
        params: HoverParams,
      ): Promise<Hover> => {
        const gateClosed =
          context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen;

        // The gate decides WHICH request this is. Closed, this is the request
        // the test cancels, and it parks in a wait it will not survive; open, it
        // is the later one that must answer normally.
        if (gateClosed) {
          process.stderr.write(`${parkedMarker}\n`);
          try {
            // IGNORES THE SIGNAL, then FAILS. A config author writes this with
            // one un-aborted request that times out at its own layer.
            await new Promise((_resolve, reject) => {
              setTimeout(() => {
                reject(new Error(failedMarker));
              }, rejectDelayMs);
            });
          } finally {
            // WRITTEN BY THE HANDLER RATHER THAN READ OFF THE FAILURE REPORT,
            // because there is no report to read: a CANCELLED handler's failure
            // is deliberately not reported on stderr, which is this drive's
            // existing ruling. Without this line the test would have no moment
            // it could name as `after the rejection landed`.
            process.stderr.write(`${failedMarker}\n`);
          }
        }

        return { contents: { kind: "markdown", value: answeredValue } };
      },
    },
  });
};
