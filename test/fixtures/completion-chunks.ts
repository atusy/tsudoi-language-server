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

/**
 * Everything after the answer. The three payloads reach the wire in the same
 * order they always did -- the first as the answer, the other two as chunks --
 * so what moved is WHICH MESSAGE carries the last of them, not the order.
 */
async function* rest(): AsyncGenerator<CompletionItem[], undefined, null> {
  yield secondChunk;
  yield returnedItems;
  return undefined;
}

/** Supplies completion and NOT hover, so advertisement cannot cross over. */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE. Both parameters are unused -- they are
      // spelled underscore-prefixed above -- so nothing about the request
      // reaches this answer and the three constants ARE the whole candidate set
      // at every position in every document. The tests here assert ORDER and
      // IDENTITY of chunks, which is a claim about the transport rather than
      // about whether more items exist.
      "textDocument/completion": (_context: RequestContext, _params: CompletionParams) =>
        Promise.resolve([firstChunk, rest()] as const),
    },
  });
};
