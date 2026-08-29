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
 * ONE THING HERE IS NOT AN OPTION: `applyFilters` ALWAYS DEDUPLICATES. A popup
 * offering one word twice is not a behaviour anybody would choose, so it is not one
 * to opt into.
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
 * The pipeline both handlers use when an author names none.
 *
 * THE PREFIX FILTER AND NOTHING ELSE. Deduplication is NOT in this list and is not
 * a filter at all -- `applyFilters` always does it, so no pipeline an author writes
 * can offer the same word twice.
 *
 * ONE VALUE FOR THE LIFE OF THE MODULE, for the reason `defaultScanner` is: a
 * handler called with no options must not look different from one call to the next.
 */
export const defaultFilters: readonly Filter[] = Object.freeze([prefixFilter]);

/**
 * Drives the pipeline, DEDUPLICATES, and applies the item bound -- in that order.
 *
 * DEDUPLICATION IS UNCONDITIONAL AND IS NOT A FILTER, WHICH IS A RULING RATHER THAN
 * A CONVENIENCE. A popup with one word in it twice is never what anybody wanted, so
 * no pipeline an author writes can produce one -- including one whose own stages
 * introduce a duplicate.
 *
 * IT RUNS AFTER THE AUTHOR'S FILTERS AND NOT BEFORE, AND THE ORDER IS LOAD-BEARING
 * IN BOTH DIRECTIONS. After, so a stage that REWRITES words -- lowercasing them,
 * stripping a sigil -- cannot smuggle a duplicate past it. After, also, so a stage
 * that wants to WEIGHT a popup by frequency can still see the repeats `wordsIn`
 * yields; deduplicating first would take that information away from every filter
 * before any of them ran.
 *
 * FIRST-SEEN AND NOT LAST-SEEN: the same SET in another order is another popup, and
 * the earlier occurrence is the one nearer where the user is looking.
 *
 * THE BOUND IS APPLIED LAST OF ALL, AND THAT ORDERING IS THE WHOLE OF ITS
 * USEFULNESS: bounding the SCAN would spend the budget on words the prefix was
 * about to reject, so a popup could be empty while the buffer held matches, and
 * bounding before the dedup would spend it on repeats. Bounding what SURVIVED
 * means the bound only ever removes candidates the user could have seen.
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
  if (maxItems !== undefined && (!Number.isSafeInteger(maxItems) || maxItems < 0)) {
    throw new RangeError("maxItems must be a non-negative safe integer");
  }
  let flowing: Iterable<string> = words;
  for (const filter of filters) {
    flowing = filter(flowing, input);
  }
  const kept: string[] = [];
  const seen = new Set<string>();
  for (const word of flowing) {
    if (seen.has(word)) {
      continue;
    }
    if (maxItems !== undefined && kept.length >= maxItems) {
      break;
    }
    seen.add(word);
    kept.push(word);
  }
  return kept;
}
