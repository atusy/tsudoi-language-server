// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

export const answered: CompletionItem[] = [{ label: "答え", detail: "in the answer" }];
export const streamed: CompletionItem[] = [{ label: "続き", detail: "streamed after it" }];

/**
 * Everything after the answer, ending with THE AUTHOR'S LAST WORD.
 *
 * IT CARRIES NO ITEMS AND THE TYPE IS WHAT GUARANTEES THAT: the return position
 * is `EmptyCompletionResponse`, so `{ isIncomplete: false, items: [streamed] }`
 * does not compile here. That is the specification's `empty in terms of result
 * values` turned from prose a fixture author must remember into a property the
 * compiler enforces.
 */
async function* rest(): AsyncGenerator<CompletionItem[], { isIncomplete: false; items: [] }, null> {
  yield streamed;
  return { isIncomplete: false, items: [] };
}

/** Answers INCOMPLETE, streams, then says the set was complete after all. */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE, AND ONLY AFTER THE STREAM ENDED -- which
      // is a distinct answer from every other fixture here and is what this one
      // exists to demonstrate. The ANSWER claims incompleteness because at that
      // moment the handler does not yet know; the generator's RETURN withdraws
      // the claim once it does. THE TWO ARE NOT A CONTRADICTION: they are claims
      // about different moments, which is the only reason a post-stream word is
      // worth having at all.
      //
      // A HANDLER COULD NOT SAY THIS BEFORE SPRINT 42 in any spelling, and the
      // nearest thing available -- draining the iterator and calling the answer
      // complete -- is exactly the merge rule this PBI forbids, because a stream
      // ending says nothing about a candidate set.
      "textDocument/completion": (_context: RequestContext, _params: CompletionParams) =>
        Promise.resolve([{ isIncomplete: true, items: answered }, rest()] as const),
    },
  });
};
