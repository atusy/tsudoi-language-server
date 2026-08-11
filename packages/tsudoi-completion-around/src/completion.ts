import type { CompletionItem, CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { type CompleteAroundOptions, defaultWordPattern, windowAround, wordsIn } from "./around.ts";

/**
 * A `textDocument/completion` handler offering the words around the cursor.
 *
 * THE SAME SHAPE AS `completePath` IN THE SIBLING PACKAGE, and that is a
 * decision rather than a coincidence: `(context, params, options)`, an async
 * generator, options LAST and defaulted. A factory returning a handler was the
 * first spelling and is refused -- two handler packages an author installs side
 * by side would then be called two different ways for no reason either of them
 * could give, and the options argument buys the same thing a closure would.
 *
 * IT IS USABLE WITH NO WRAPPER: `"textDocument/completion": completeAround`
 * type-checks, the third parameter being optional, and an author who wants
 * options writes the arrow that supplies them.
 *
 * IT YIELDS ONCE, AND THAT IS A RULING RATHER THAN A SHORTCUT. tsudoi's
 * completion drive lets a handler stream, and streaming exists for an answer
 * that ARRIVES OVER TIME -- a directory being walked, an index being consulted.
 * This one reads a bounded slice of a buffer already in memory: there is no
 * moment at which a partial answer is more useful than no answer, and yielding
 * per line would spend a `$/progress` per line to say the same thing.
 *
 * NOTHING IS FILTERED AGAINST WHAT THE USER TYPED, which is the LSP half of the
 * ruling at `CompleteAroundOptions`: the client narrows the list, and a handler
 * that narrowed it first would be guessing at a rule the editor already has --
 * and would be wrong about `filterText`, fuzzy matching and case, none of which
 * it can see.
 *
 * COMPLETENESS RULING: COMPLETE, and it follows from what this handler READS
 * rather than from a preference. The specification treats a supplied
 * `CompletionItem[]` as `{ isIncomplete: false, items }` -- do not re-query,
 * filter what you were given -- and that is TRUE HERE because THIS HANDLER NEVER
 * LOOKS AT WHAT WAS TYPED: the window is chosen by the cursor's LINE alone, and
 * every word in it is offered. A narrower prefix cannot produce a candidate this
 * answer did not already carry, which is exactly what `do not re-query` promises.
 *
 * WHAT WOULD OVERTURN IT IS AN EDIT AND NOT A KEYSTROKE, said because the two
 * look alike from a popup: typing inserts text, so the buffer's words really do
 * change -- and the client sends `didChange` and asks again, which is the route
 * every source is refreshed by. `isIncomplete` is about the PREFIX, and the
 * prefix is what this ignores.
 *
 * A DOCUMENT THE STORE DOES NOT HOLD YIELDS NOTHING rather than answering
 * emptily, and the difference reaches the client: a stream that yields nothing
 * is answered `null` -- `this server has no answer here` -- where an empty batch
 * would say `there are no candidates`, which is a stronger claim than tsudoi can
 * make about a buffer it was never sent.
 */
export async function* completeAround(
  context: RequestContext,
  params: CompletionParams,
  options: CompleteAroundOptions = {},
): AsyncGenerator<CompletionItem[], void, void> {
  const document = context.tsudoi.documents.get(params.textDocument.uri);
  if (document === undefined) {
    return;
  }
  // TAKEN AS A STRING BEFORE ANYTHING ELSE, on the liveness rule tsudoi's own
  // surface states: a document answers from the buffer AS IT STANDS WHEN ASKED,
  // so reading it twice across the work below could scan two different buffers.
  // A string does not move.
  //
  // SPLIT ON `\r?\n` AND NOT `\n`, the same reading the sibling package takes: a
  // CRLF document otherwise leaves a `\r` at the end of every line, which the
  // word pattern does not match but which counts toward the column bound.
  const lines = document.getText().split(/\r?\n/);
  const { from, to } = windowAround(params.position.line, lines.length, options.maxSize ?? 200);
  const words = wordsIn(lines.slice(from, to), {
    pattern: options.wordPattern ?? defaultWordPattern,
    minLength: options.minLength ?? 2,
    maxColumns: options.maxColumns ?? 200,
  });
  if (words.length === 0) {
    return;
  }
  yield words.map(
    (word) =>
      ({
        label: word,
        // `Text` AND NOT `Keyword` OR `Variable`: this package knows nothing
        // about the language and cannot tell one from the other, so any narrower
        // kind would be an icon in the user's popup asserting something nobody
        // checked.
        kind: 1,
        // WHERE IT CAME FROM, because a user looking at a popup fed by several
        // sources has no other way to tell this one's guesses from a real
        // analysis's answers.
        detail: "around",
      }) satisfies CompletionItem,
  );
}
