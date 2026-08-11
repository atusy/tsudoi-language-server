/**
 * WHAT REACHES THE CLIENT OUT OF WHAT WAS SCANNED.
 *
 * WHY A SERVER FILTERS AT ALL, WHICH REVERSES A RULING THIS PACKAGE USED TO
 * CARRY. Both handlers said `NOTHING IS FILTERED AGAINST WHAT THE USER TYPED --
 * the client narrows the list`, and that was right about WHOSE JOB IT IS and
 * wrong about what it costs. MEASURED in a real editor: `completeCorpus` over five
 * open files sent 3341 items and 155 KiB ON EVERY KEYSTROKE, to a client whose own
 * cap is 500 items -- so 85% of it was received, parsed and thrown away, per
 * keystroke, and the editor's completion stopped answering while the language
 * server stayed healthy at 3-28ms per request. THE SERVER WAS FINE AND THE PIPE
 * WAS NOT.
 *
 * SO THE CLIENT STILL DECIDES WHAT TO SHOW; THIS DECIDES WHAT IS WORTH SENDING.
 * The two are different questions and only the second is about bandwidth.
 *
 * WHAT IT COSTS, NAMED BECAUSE IT IS A REAL LOSS: a client with a FUZZY matcher
 * can no longer offer what a prefix rejected -- `cmpl` will not reach
 * `completion` through this. That is why `filters` is a LIST an author replaces
 * rather than a flag: a fuzzy pipeline wants a fuzzy filter here, or none and a
 * `maxItems` instead.
 */

/** What a filter is told about the request, beside the words. */
export interface FilterInput {
  /**
   * The word being typed at the cursor, or `""` when the cursor is not in one.
   *
   * IT IS THE SCANNER'S NOTION OF A WORD AND NOT THE CLIENT'S, which is what
   * makes it consistent with the candidates being filtered -- and also what makes
   * it differ from the editor's own idea. `typedWord` in words.ts is where that is
   * decided.
   */
  readonly typed: string;
}

/**
 * One stage of the pipeline: words in, words out, in the order they should reach
 * the client.
 *
 * IT MAY REORDER, DROP AND REWRITE, which is why it is not called a matcher. What
 * it must not do is depend on being the first or the last stage, because an author
 * chooses the order.
 */
export type Filter = (words: Iterable<string>, input: FilterInput) => Iterable<string>;

/**
 * Keeps the words that start with what was typed, IGNORING CASE.
 *
 * CASE IS IGNORED DELIBERATELY, AND THE DIRECTION OF THE CHOICE IS THE POINT: this
 * runs BEFORE a client that filters again with rules of its own, so being stricter
 * than the client hides candidates the user would have been shown and gives them
 * nothing to read. Permissive here, decisive there.
 *
 * AN EMPTY `typed` KEEPS EVERYTHING, which is the cursor sitting where no word is.
 */
export const prefixFilter: Filter = function* (words, input) {
  if (input.typed === "") {
    yield* words;
    return;
  }
  const typed = input.typed.toLowerCase();
  for (const word of words) {
    if (word.toLowerCase().startsWith(typed)) {
      yield word;
    }
  }
};

/**
 * Drops repeats, keeping each word where it was FIRST seen.
 *
 * IT IS WHERE UNIQUENESS IS DECIDED, AND `wordsIn` DELIBERATELY DOES NOT: a scan
 * yields every occurrence in order, so this filter is load-bearing rather than a
 * safety net, and an author who wants repeats -- to weight a popup by frequency,
 * say -- takes it out of the list instead of fighting it.
 *
 * FIRST-SEEN AND NOT LAST-SEEN: the same SET in another order is another popup,
 * and the earlier occurrence is the one nearer where the user is looking.
 */
export const dedupFilter: Filter = function* (words) {
  const seen = new Set<string>();
  for (const word of words) {
    if (!seen.has(word)) {
      seen.add(word);
      yield word;
    }
  }
};

/**
 * The pipeline both handlers use when an author names none.
 *
 * PREFIX THEN DEDUP, AND THE ORDER IS FOR COST RATHER THAN FOR THE ANSWER: either
 * order offers the same words, and this one hashes only what survived the prefix.
 *
 * ONE VALUE FOR THE LIFE OF THE MODULE, for the reason `defaultScanner` is: a
 * handler called with no options must not look different from one call to the next.
 */
export const defaultFilters: readonly Filter[] = Object.freeze([prefixFilter, dedupFilter]);

/**
 * Drives the pipeline and applies the item bound.
 *
 * THE BOUND IS APPLIED LAST, AND THAT ORDERING IS THE WHOLE OF ITS USEFULNESS:
 * bounding the SCAN would spend the budget on words the prefix was about to
 * reject, so a popup could be empty while the buffer held matches. Bounding what
 * SURVIVED means the bound only ever removes candidates the user could have seen.
 *
 * IT IS A BACKSTOP RATHER THAN THE DESIGN. The prefix filter is what makes an
 * answer small; this is what keeps a pathological buffer -- a generated table, a
 * blob whose lines all sit under the column bound -- from reaching the client at
 * all. AN AUTHOR WHO SETS ONLY THIS AND NO FILTERS GETS AN ARBITRARY SLICE of
 * their corpus, in the order documents were opened, which is worse than a prefix
 * and better than a stall.
 */
export function applyFilters(
  words: Iterable<string>,
  filters: readonly Filter[],
  input: FilterInput,
  maxItems?: number,
): string[] {
  let flowing: Iterable<string> = words;
  for (const filter of filters) {
    flowing = filter(flowing, input);
  }
  if (maxItems === undefined) {
    return [...flowing];
  }
  const kept: string[] = [];
  for (const word of flowing) {
    if (kept.length >= maxItems) {
      break;
    }
    kept.push(word);
  }
  return kept;
}
