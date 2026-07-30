// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

// Three distinguishable payloads, so a response that repeated a yield, dropped
// one, or reordered them cannot be mistaken for the right answer. Japanese
// because a completion label is text a human reads, and because $/progress and
// the response body are two different serialisation paths out of the server.
export const firstChunk: CompletionItem[] = [{ label: "一番目", detail: "yielded first" }];
export const secondChunk: CompletionItem[] = [{ label: "二番目", detail: "yielded second" }];
/**
 * THE NAME IS STALE AND IS LEFT ALONE DELIBERATELY, flagged here rather than
 * fixed: nothing is RETURNED any more -- a completion generator's return carries
 * no content, so this is the third YIELD. It went stale at Sprint 42, when this
 * payload became the last chunk rather than the generator's return value, so it
 * is not this sprint's to correct and the rename would touch five test files.
 * Surfaced to the Scrum Master instead, per the Sprint-42 precedent that
 * correcting prose outside the criteria is how scope grows.
 */
export const returnedItems: CompletionItem[] = [{ label: "最後", detail: "yielded last" }];

/** Supplies completion and NOT hover, so advertisement cannot cross over. */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE. Both parameters are unused -- they are
      // spelled underscore-prefixed below -- so nothing about the request
      // reaches this answer and the three constants ARE the whole candidate set
      // at every position in every document. The tests here assert ORDER and
      // IDENTITY of chunks, which is a claim about the transport rather than
      // about whether more items exist.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        // THREE YIELDS AND NO RETURN VALUE, WHICH IS THE WHOLE SHAPE. The three
        // payloads reach the wire in the order they always did; what moved at
        // Sprint 43 is that all three travel through ONE entrance instead of the
        // first being an answer and the other two a stream beside it.
        yield firstChunk;
        yield secondChunk;
        yield returnedItems;
      },
    },
  });
};
