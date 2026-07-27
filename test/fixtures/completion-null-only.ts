// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * Returns null having yielded nothing at all. A generator with no `yield` is
 * the point, not an oversight: `nothing to say about this position` has to stay
 * distinguishable from `nothing further to add`, and only the absence of any
 * emitted chunk tells them apart.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        return null;
      },
    },
  });
};
