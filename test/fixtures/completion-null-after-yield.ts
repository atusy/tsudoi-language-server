// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

export const partialChunk: CompletionItem[] = [
  { label: "途中経過", detail: "sent as a partial result" },
];

/**
 * YIELDS EXACTLY ONE BATCH AND NOTHING ELSE, which is what this fixture is for
 * and is a property the tests depend on rather than an incidental size. It is
 * the ONE-BATCH arm of `the token decides the channel`: under a token that batch
 * must still leave as a `$/progress` with a `null` response, and a drive that
 * looked ahead and answered with it instead would agree with every other arm.
 * A SECOND YIELD HERE WOULD MAKE THAT PERTURBATION UNREACHABLE and its green
 * would record nothing.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE, AND THE CLAIM IS MADE IN ONE MODE ONLY.
      // WITH a partialResultToken the response is `null` and the
      // specification's array equivalence never applies; WITHOUT one the drive
      // aggregates and answers `partialChunk` as a bare array, which DOES
      // assert a final set. It is true either way: the chunk is a module
      // constant and both parameters are unused.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        yield partialChunk;
      },
    },
  });
};
