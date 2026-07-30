// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * One line per PULL, written immediately before the yield it feeds, so the
 * count of these lines is the number of times the drive asked this generator
 * for a batch. Counting them against the `$/progress` that arrived is what
 * tells a pull whose batch was sent from a pull whose batch was thrown away.
 */
export const pullMarker = "completion-counts-pulls: pulled";

/**
 * NOTHING BETWEEN THE YIELDS AWAITS, AND THAT IS WHAT MAKES THE COUNT A
 * MEASUREMENT. An async generator's `next()` settles as a MICROTASK when its
 * body reaches the next yield without awaiting, so the drive's own pull and the
 * race around it never hand the event loop back. The only point in a streaming
 * request where an incoming `$/cancelRequest` can be read is therefore the
 * awaited `sendProgress` -- which is exactly the moment this fixture exists to
 * put the abort in, with no timing assumption written into the test.
 *
 * THE BATCH IS PADDED so one `$/progress` is a kilobyte rather than a few bytes:
 * the stream stops when the cancellation lands, so the pad is what keeps the
 * number of batches sent in that round trip small enough to be cheap.
 */
const padding = "実".repeat(300);

/**
 * How many batches this generator has at all. A BOUND AND NOT A LIMIT ANYONE
 * SHOULD REACH: the cancellation arrives within a round trip, so exhausting it
 * means the abort never landed -- and that is a failure the test reads as a
 * response that is not -32800, rather than as a hang.
 */
export const batchCount = 2000;

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM. Every request this fixture serves is
      // cancelled mid-stream and answered -32800 with no result, so there is no
      // candidate set for `isIncomplete` to be about.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        for (let index = 0; index < batchCount; index += 1) {
          // BEFORE THE YIELD, so a pull that is resumed and then discarded is
          // still counted. Written after it, the one pull this test is about --
          // the one whose batch never goes out -- would be invisible.
          process.stderr.write(`${pullMarker} ${index}\n`);
          const item: CompletionItem = { label: `候補${index}`, detail: padding };
          yield [item];
        }
      },
    },
  });
};
