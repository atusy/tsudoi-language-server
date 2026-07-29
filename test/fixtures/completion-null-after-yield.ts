// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

export const partialChunk: CompletionItem[] = [
  { label: "途中経過", detail: "sent as a partial result" },
];

/**
 * Says everything it has to say through partial results, then returns null.
 * The shape the brief's own example config has, and the reason `[]` and `null`
 * cannot both be spelled `?? something`.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE, AND THE CLAIM IS MADE IN ONE MODE ONLY,
      // which is worth writing down because the `return null` makes it look
      // like no claim is made at all. WITH a partialResultToken the response is
      // `null` and the specification's array equivalence never applies; WITHOUT
      // one the drive aggregates and answers `partialChunk` as a bare array,
      // which DOES assert a final set. It is true either way: the chunk is a
      // module constant and both parameters are unused.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        yield partialChunk;
        return null;
      },
    },
  });
};
