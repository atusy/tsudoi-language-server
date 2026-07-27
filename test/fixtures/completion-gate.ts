// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [{ label: "門前", detail: "yielded before the gate" }];
export const afterGate: CompletionItem[] = [{ label: "門後", detail: "yielded after the gate" }];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "returned" }];

/**
 * Yields, then parks until the test changes the document, then yields again.
 * The park is what makes incrementality observable: the first chunk has to
 * reach the client while this handler is provably still running.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        yield beforeGate;

        // Awaited polling, not a busy loop. Awaiting hands the event loop back
        // so the server can process the didChange that opens this gate; a busy
        // loop would starve the very notification it is waiting for.
        while (context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        yield afterGate;
        return returnedItems;
      },
    },
  });
};
