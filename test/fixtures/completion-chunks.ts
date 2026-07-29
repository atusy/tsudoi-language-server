// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

// Three distinguishable payloads, so a response that repeated a yield, dropped
// one, or reordered them cannot be mistaken for the right answer. Japanese
// because a completion label is text a human reads, and because $/progress and
// the response body are two different serialisation paths out of the server.
export const firstChunk: CompletionItem[] = [{ label: "一番目", detail: "yielded first" }];
export const secondChunk: CompletionItem[] = [{ label: "二番目", detail: "yielded second" }];
export const returnedItems: CompletionItem[] = [{ label: "最後", detail: "returned" }];

/** Supplies completion and NOT hover, so advertisement cannot cross over. */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        yield firstChunk;
        yield secondChunk;
        return returnedItems;
      },
    },
  });
};
