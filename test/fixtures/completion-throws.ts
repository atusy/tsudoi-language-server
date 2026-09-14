// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** Distinctive enough that finding it on stderr cannot be a coincidence. */
export const throwMessage = "completion-throws fixture: 意図的な失敗";

export const sentBeforeThrow: CompletionItem[] = [
  { label: "送信済み", detail: "yielded before the throw" },
];

/** What the handler answers from its second call on, so recovery is positive. */
export const recoveredItems: CompletionItem[] = [
  { label: "二度目", detail: "returned on the second call" },
];

export default (): Promise<TsudoiConfig> => {
  let calls = 0;
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        calls += 1;
        if (calls !== 1) {
          yield recoveredItems;
          return;
        }
        // THE BATCH LEAVES BEFORE THE FAILURE, WHICH IS THE POINT: the throw is
        // AFTER a yield, so the first chunk is provably on the wire when the
        // request fails. A handler that threw before yielding anything would
        // exercise `the request failed` and say nothing about `the chunk
        // stayed`.
        yield sentBeforeThrow;
        await Promise.resolve();
        throw new Error(throwMessage);
      },
    },
  });
};
