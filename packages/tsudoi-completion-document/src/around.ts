/**
 * Buffer-local completion for a config author's own `textDocument/completion`
 * handler: the words already written AROUND the cursor.
 *
 * THE NARROWER OF THIS PACKAGE'S TWO HANDLERS, and the pair is the point: this
 * one answers FROM THE BUFFER UNDER THE CURSOR and reads a bounded slice of it,
 * where `completeCorpus` answers from every document the client has opened. An
 * author installs whichever question they have, or both.
 *
 * MODELLED ON ddc-source-around, AND READ FROM ITS SOURCE RATHER THAN ITS
 * README. The two disagree: the README documents `maxSize: 500` where `params()`
 * returns 200. Every default below is the code's, because a default taken from
 * the prose would be a claim nobody could check against the thing this was
 * modelled on.
 *
 * WHAT DOES NOT TRANSLATE, NAMED SO IT IS NOT MISTAKEN FOR AN OMISSION: ddc
 * NARROWS the candidates itself against what the user has typed. LSP gives that
 * job to the CLIENT, so this hands over the window's words and the editor
 * filters them -- which is also why the word under the cursor is among them
 * rather than being excluded. Excluding it would be this package deciding what
 * the editor already decides, and would be wrong for the user who is retyping a
 * word that appears elsewhere.
 */
import type { CompletionItem, CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { defaultWordPattern, type WordOptions, wordsIn } from "./words.ts";

/**
 * How the window is chosen, on top of what counts as a word.
 *
 * NAMED FOR THE HANDLER IT BELONGS TO, matching `CompletePathOptions` in the
 * sibling package: an author installing both reads one convention.
 *
 * THE WINDOW IS THE ONLY FIELD THIS TYPE ADDS, and that is the layering rather
 * than a small type: `WordOptions` carries what any scan in this package asks,
 * and `maxSize` is the one question that only a handler reading AROUND a cursor
 * has to answer.
 */
export interface CompleteAroundOptions extends WordOptions {
  /**
   * How many lines above AND below the cursor are read. Clamped to the buffer.
   *
   * 200 IS THE REFERENCE'S `params()` VALUE AND NOT ITS README'S 500. The window
   * is what makes this cheap enough to run on every keystroke of a file of any
   * size, so it is the option most worth an author's attention.
   */
  readonly maxSize?: number;
}

/**
 * The lines a cursor on `line` can see, as HALF-OPEN bounds into the buffer.
 *
 * INCLUSIVE OF THE CURSOR'S OWN LINE AND `maxSize` EITHER SIDE, which is the
 * reference's arithmetic with its one-based lines translated: it clamps to
 * `[1, $]`, this clamps to `[0, lines.length]`.
 */
export function windowAround(
  line: number,
  lineCount: number,
  maxSize: number,
): { readonly from: number; readonly to: number } {
  return {
    from: Math.max(0, line - maxSize),
    to: Math.min(lineCount, line + maxSize + 1),
  };
}

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
