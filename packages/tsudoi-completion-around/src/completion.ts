import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/protocol";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import { type AroundOptions, windowAround, wordsIn } from "./around.ts";

/**
 * A `textDocument/completion` handler offering the words around the cursor.
 *
 * IT YIELDS ONCE, AND THAT IS A RULING RATHER THAN A SHORTCUT. tsudoi's
 * completion drive lets a handler stream, and streaming exists for an answer
 * that ARRIVES OVER TIME -- a directory being walked, an index being consulted.
 * This one reads a bounded slice of a buffer already in memory: there is no
 * moment at which a partial answer is more useful than no answer, and yielding
 * per line would spend a `$/progress` per line to say the same thing.
 *
 * NOTHING IS FILTERED AGAINST WHAT THE USER TYPED, which is the LSP half of the
 * ruling at `AroundOptions`: the client narrows the list, and a handler that
 * narrowed it first would be guessing at a rule the editor already has -- and
 * would be wrong about `filterText`, fuzzy matching and case, none of which it
 * can see.
 *
 * A DOCUMENT THE STORE DOES NOT HOLD YIELDS NOTHING rather than answering
 * emptily, and the difference reaches the client: a stream that yields nothing
 * is answered `null` -- `this server has no answer here` -- where an empty batch
 * would say `there are no candidates`, which is a stronger claim than tsudoi can
 * make about a buffer it was never sent.
 */
export function completionAround(
  options: AroundOptions = {},
): MethodHandler<"textDocument/completion"> {
  const maxSize = options.maxSize ?? 200;
  const minLength = options.minLength ?? 2;
  const maxColumns = options.maxColumns ?? 200;
  const pattern = options.wordPattern ?? /[\p{L}\p{N}_]+/gu;

  return async function* (context, params) {
    const document = context.tsudoi.documents.get(params.textDocument.uri);
    if (document === undefined) {
      return;
    }
    // TAKEN AS A STRING BEFORE ANYTHING ELSE, on the liveness rule tsudoi's own
    // surface states: a document answers from the buffer AS IT STANDS WHEN
    // ASKED, so reading it twice across the work below could scan two different
    // buffers. A string does not move.
    const lines = document.getText().split("\n");
    const { from, to } = windowAround(params.position.line, lines.length, maxSize);
    const words = wordsIn(lines.slice(from, to), { pattern, minLength, maxColumns });
    if (words.length === 0) {
      return;
    }
    yield words.map(
      (word) =>
        ({
          label: word,
          // `Text` AND NOT `Keyword` OR `Variable`: this package knows nothing
          // about the language and cannot tell one from the other, so any
          // narrower kind would be an icon in the user's popup asserting
          // something nobody checked.
          kind: 1,
          // WHERE IT CAME FROM, because a user looking at a popup fed by several
          // sources has no other way to tell this one's guesses from a real
          // analysis's answers.
          detail: "around",
        }) satisfies CompletionItem,
    );
  };
}
