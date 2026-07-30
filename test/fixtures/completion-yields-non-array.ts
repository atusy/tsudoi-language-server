// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem } from "vscode-languageserver-protocol";
import type { TsudoiConfig } from "../../src/types.ts";

/** The config author's cleanup, and the only evidence that it ran at all. */
export const cleanupMarker = "completion-yields-non-array: released";

/**
 * A handler whose batch IS NOT AN ARRAY, which is the mistake this fixture
 * exists to be: aggregating spreads what was yielded, so `collected.push(...42)`
 * raises a TypeError WHILE THE GENERATOR IS SUSPENDED AT ITS YIELD.
 *
 * NOTHING VALIDATES THIS ANYWHERE, which is why the case is reachable at all:
 * src/config.ts checks the resolve/completion pair and nothing about payloads,
 * and both runtimes STRIP the types rather than checking them. The cast below is
 * the whole of what a config author has to get past, and in a config written in
 * plain JavaScript there is not even that.
 *
 * ITS SUBJECT IS THE `finally` AND NOT THE TYPEERROR. The exception leaves the
 * drive's loop from a point where the generator is still parked and still
 * holding whatever the author's cleanup would release -- in a real config a
 * child process or a lock file -- and the same held handle is what keeps the
 * event loop alive after the session should have gone.
 *
 * AGGREGATING RATHER THAN STREAMING, deliberately: this is the arm a client
 * reaches by sending no `partialResultToken`, which is every client that cannot
 * take partial results. The streaming arm's twin exit -- a `sendProgress` that
 * rejects because the editor died mid-stream -- needs a dead connection to
 * provoke and leaves the drive at the same point.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM. This handler never produces a candidate
      // set at all -- its one batch is a type error -- so `isIncomplete` has
      // nothing to be about.
      "textDocument/completion": async function* () {
        try {
          yield 42 as unknown as CompletionItem[];
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
