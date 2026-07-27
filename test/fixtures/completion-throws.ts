// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/** Distinctive enough that finding it on stderr cannot be a coincidence. */
export const throwMessage = "completion-throws fixture: 意図的な失敗";

/**
 * Distinguishable content, because `the chunk arrived and stayed` and `the
 * chunk was never sent` look identical from an error response onwards unless
 * the payload itself is asserted.
 */
export const sentBeforeThrow: CompletionItem[] = [
  { label: "送信済み", detail: "yielded before the throw" },
];

/** What the handler answers from its second call on, so recovery is positive. */
export const recoveredItems: CompletionItem[] = [
  { label: "二度目", detail: "returned on the second call" },
];

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  let calls = 0;
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        calls += 1;
        if (calls === 1) {
          yield sentBeforeThrow;
          throw new Error(throwMessage);
        }
        return recoveredItems;
      },
    },
  });
};
