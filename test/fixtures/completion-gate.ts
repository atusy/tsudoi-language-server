// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

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
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE. `beforeGate`, `afterGate` and
      // `returnedItems` are module constants; the document is read to find the
      // gate text and never to filter candidates. THE PARK IS NOT INCOMPLETENESS
      // AND THE DISTINCTION IS THE INTERESTING PART: this handler is slow, not
      // partial. `isIncomplete` says THE SET MAY GROW AS THE USER TYPES, where
      // streaming says THE SET ARRIVES IN PIECES -- the two are independent, and
      // this fixture exercises the second while claiming nothing about the
      // first. IT CANNOT SAY THE FIRST IN ANY SPELLING, and that does not change
      // this ruling either way: the answer here is COMPLETE on its own grounds.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        yield beforeGate;

        // Awaited polling, not a busy loop. Awaiting hands the event loop back
        // so the server can process the didChange that opens this gate; a busy
        // loop would starve the very notification it is waiting for.
        while (context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        yield afterGate;
        yield returnedItems;
      },
    },
  });
};
