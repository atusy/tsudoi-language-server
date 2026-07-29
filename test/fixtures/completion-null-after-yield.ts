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
