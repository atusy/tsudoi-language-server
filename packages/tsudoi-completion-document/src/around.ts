/** Buffer-local word completion, with a bounded window around the cursor. */
import type {
  CompletionItem,
  CompletionList,
  CompletionParams,
} from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  applyFilters,
  defaultFilters,
  prefixFilter,
  nonNegativeSafeInteger,
  validateMaxItems,
} from "./filters.ts";
import { defaultScanner, narrowsAsTyped } from "./scanners.ts";
import { type WordOptions, typedWord, scanWords, wordsExceptInput } from "./words.ts";

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
 * Offers words around the cursor in one batch from the in-memory buffer.
 * Omits the word occurrence ending at the cursor, retaining occurrences elsewhere.
 * A missing document yields no result; an empty search returns a CompletionList.
 *
 * The default prefix filter reduces the payload; fuzzy clients should customize
 * `filters` or disable them and set `maxItems`. This handler can establish
 * completeness only when all matches fit and the scanner and filters are known.
 * The final CompletionList requests recomputation for truncation or custom callbacks.
 */
export async function* completeAround(
  context: RequestContext,
  params: CompletionParams,
  options: CompleteAroundOptions = {},
): AsyncGenerator<CompletionItem[], CompletionList | void, void> {
  validateMaxItems(options.maxItems);
  const minQueryLength = nonNegativeSafeInteger(
    options.minQueryLength === undefined ? 0 : options.minQueryLength,
    "minQueryLength",
  );
  if (options.maxItems === 0) {
    return { isIncomplete: false, items: [] };
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
    return { isIncomplete: true, items: [] };
  }
  const { from, to } = windowAround(params.position.line, lines.length, options.maxLines ?? 200);
  const scanned = scanWords(lines.slice(from, to), {
    scanner,
    minLength: options.minLength ?? 2,
    maxColumns: options.maxColumns ?? 200,
  });
  // THE CURSOR'S OWN LINE OUT OF THE STRING TAKEN ABOVE, and not a second
  // `getText`: the liveness rule means a second read could be of a later buffer,
  // and then the prefix would be from one buffer and the candidates from another.
  const filters = options.filters ?? defaultFilters;
  const words = applyFilters(
    wordsExceptInput(scanned, {
      line: params.position.line - from,
      character: params.position.character,
    }),
    filters,
    { typed },
    options.maxItems === undefined
      ? undefined
      : Math.min(Number.MAX_SAFE_INTEGER, options.maxItems + 1),
  );
  // An extra distinct filtered word proves truncation; an exact fit is complete.
  // Unknown callbacks may reveal or rewrite candidates as the query grows.
  const isIncomplete =
    (options.maxItems !== undefined && words.length > options.maxItems) ||
    !narrowsAsTyped(scanner, typed) ||
    filters.some((filter) => filter !== prefixFilter);
  if (options.maxItems !== undefined && words.length > options.maxItems) {
    words.length = options.maxItems;
  }
  if (words.length === 0) {
    return { isIncomplete, items: [] };
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
  return { isIncomplete, items: [] };
}
