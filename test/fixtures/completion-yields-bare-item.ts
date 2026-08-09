// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem } from "vscode-languageserver-protocol";
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

export const cleanupMarker = "completion-yields-bare-item: released";

/**
 * ONE ITEM WHERE A BATCH BELONGS -- the mistake this fixture exists to be, and
 * the likeliest one a config author actually makes: the streaming API takes
 * BATCHES, so an author thinking in items writes `yield item` and the missing
 * brackets are the whole defect.
 *
 * ITS CONTENT IS DISTINCTIVE ON PURPOSE. A test asserting that tsudoi's report
 * NAMES the offending value needs a serialisation that cannot collide with a
 * stack frame's line numbers, which is what a bare number would risk.
 */
export const bareItem: CompletionItem = { label: "裸の候補", detail: "yielded without brackets" };

/**
 * A handler yielding a single ITEM rather than an array of them.
 *
 * NOTHING BUT TSUDOI STANDS BETWEEN THIS AND THE WIRE, which is why the case is
 * reachable at all: packages/tsudoi-language-server/src/config.ts checks the
 * resolve/completion pair and nothing about payloads, and both runtimes STRIP
 * the annotation rather than checking it. The cast below is the whole of what
 * an annotated config has to get past, and a config written in plain JavaScript
 * has not even that.
 *
 * ITS SUBJECT IS BOTH DISPATCH MODES, which is what separates it from a fixture
 * about cleanup. Aggregation rejects this incidentally -- spreading a
 * non-iterable throws -- while streaming would send it straight out as a
 * `$/progress` whose value is not the array the protocol declares, and then
 * answer `null` successfully. One mode is a loud failure and the other is a
 * silent wire-protocol violation, from the same one-character mistake.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM. This handler never produces a candidate
      // set at all -- its one batch is malformed -- so `isIncomplete` has
      // nothing to be about.
      "textDocument/completion": async function* () {
        try {
          yield bareItem as unknown as CompletionItem[];
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
