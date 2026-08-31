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
 * modelled on. THE REFERENCE'S NAME FOR IT IS `maxSize`, WHICH THIS PACKAGE DOES
 * NOT USE: `maxItems` arrived beside it and the two were read as one bound, so the
 * option says its UNIT instead. The provenance of the NUMBER is unaffected.
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
import {
  applyFilters,
  defaultFilters,
  nonNegativeSafeInteger,
  validateMaxItems,
} from "./filters.ts";
import { defaultScanner } from "./scanners.ts";
import { type WordOptions, typedWord, wordsIn } from "./words.ts";

/**
 * How the window is chosen, on top of what counts as a word.
 *
 * NAMED FOR THE HANDLER IT BELONGS TO, matching `CompletePathOptions` in the
 * sibling package: an author installing both reads one convention.
 *
 * THE WINDOW IS THE ONLY FIELD THIS TYPE ADDS, and that is the layering rather
 * than a small type: `WordOptions` carries what any scan in this package asks,
 * and `maxLines` is the one question that only a handler reading AROUND a cursor
 * has to answer.
 */
export interface CompleteAroundOptions extends WordOptions {
  /**
   * How many lines are read EITHER SIDE of the cursor -- so `maxLines: 50` reads
   * up to 101 lines, not 50. Clamped to the buffer.
   *
   * IT IS A LINE COUNT AND `maxItems` IS A CANDIDATE COUNT, and they are named
   * apart because they were read as one bound: this decides WHAT IS SCANNED and
   * that decides WHAT IS SENT. MEASURED on one five-line buffer, cursor in the
   * middle: `maxLines: 1` offers the words of the three nearest lines, where
   * `maxItems: 3` offers three words FROM THE FARTHEST -- it scans everything and
   * then cuts. Setting both is meaningful.
   *
   * 200 IS THE REFERENCE'S `params()` VALUE AND NOT ITS README'S 500. The window
   * is what makes this cheap enough to run on every keystroke of a file of any
   * size, so it is the option most worth an author's attention.
   */
  readonly maxLines?: number;
}

/**
 * The lines a cursor on `line` can see, as HALF-OPEN bounds into the buffer.
 *
 * INCLUSIVE OF THE CURSOR'S OWN LINE AND `maxLines` EITHER SIDE, which is the
 * reference's arithmetic with its one-based lines translated: it clamps to
 * `[1, $]`, this clamps to `[0, lines.length]`.
 */
export function windowAround(
  line: number,
  lineCount: number,
  maxLines: number,
): { readonly from: number; readonly to: number } {
  return {
    from: Math.max(0, line - maxLines),
    to: Math.min(lineCount, line + maxLines + 1),
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
 * WHAT THE USER TYPED IS FILTERED AGAINST, WHICH REVERSES WHAT THIS DOCBLOCK USED
 * TO SAY. It said the client narrows the list and a handler must not -- right about
 * whose JOB it is, wrong about what sending everything costs. The reading that
 * overturned it is at `filters`, and it was taken on the corpus handler, whose
 * answer is bigger; the window keeps the same pipeline so that an author composing
 * both learns one behaviour.
 *
 * COMPLETENESS RULING: COMPLETE FOR A CLIENT THAT NARROWS BY PREFIX, AND THAT IS
 * NARROWER THAN THE RULING IT REPLACES. The specification treats a supplied
 * `CompletionItem[]` as `{ isIncomplete: false, items }` -- do not re-query, filter
 * what you were given -- and under `prefixFilter` that stays TRUE AS THE USER
 * TYPES: the words matching a LONGER prefix are a SUBSET of the ones sent for the
 * shorter one. A DELETION is an edit, so `didChange` and a fresh request restore
 * the wider set.
 *
 * WHAT IT IS NOT TRUE FOR IS A FUZZY CLIENT: `cmpl` reaching `completion` needs a
 * candidate the prefix rejected, and it was never sent -- while the answer still
 * claims to be final, because tsudoi's completion row cannot express
 * `isIncomplete`. `filters` is where an author says otherwise.
 *
 * AND AN EDIT OVERTURNS THE ANSWER WHATEVER THE PIPELINE DOES: typing changes the
 * buffer's words, the client sends `didChange` and asks again, and that is the
 * route every source is refreshed by.
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
  validateMaxItems(options.maxItems);
  const minQueryLength = nonNegativeSafeInteger(
    options.minQueryLength === undefined ? 0 : options.minQueryLength,
    "minQueryLength",
  );
  if (options.maxItems === 0) {
    return;
  }
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
  const scanner = options.scanner ?? defaultScanner;
  const typed = typedWord(
    scanner,
    (lines[params.position.line] ?? "").slice(0, params.position.character),
  );
  if (typed.length < minQueryLength) {
    return;
  }
  const { from, to } = windowAround(params.position.line, lines.length, options.maxLines ?? 200);
  const scanned = wordsIn(lines.slice(from, to), {
    scanner,
    minLength: options.minLength ?? 2,
    maxColumns: options.maxColumns ?? 200,
  });
  // THE CURSOR'S OWN LINE OUT OF THE STRING TAKEN ABOVE, and not a second
  // `getText`: the liveness rule means a second read could be of a later buffer,
  // and then the prefix would be from one buffer and the candidates from another.
  const words = applyFilters(
    scanned,
    options.filters ?? defaultFilters,
    { typed },
    options.maxItems,
  );
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
