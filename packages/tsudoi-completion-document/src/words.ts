/**
 * Scripts written WITHOUT SPACES BETWEEN WORDS, which this package gives up on.
 *
 * WHY GIVING UP BEATS TRYING, MEASURED ON A REAL POPUP: a run of letters is a
 * WORD only where the writing system separates them, and Japanese does not. With
 * these included, `[NeovimのLSPで誰にどうして怒られたのかを確認するための設定]`
 * matched as ONE candidate -- thirty characters of prose offered as a completion,
 * and `Neovim` and `LSP` NOT offered at all, because they were swallowed by it.
 * Splitting these out recovers both.
 *
 * WHAT IS NOT HERE IS AS DELIBERATE: Korean, Greek, Cyrillic, Hebrew, Arabic and
 * the Indic scripts all put spaces between words, so their words survive. This
 * list is about SEGMENTATION and not about being non-Latin.
 *
 * `scx` AND NOT `sc`, MEASURED: `ー` (U+30FC, the prolonged sound mark) is
 * Script=Common, so `\p{sc=Katakana}` does not cover it and it leaks out of
 * カタカナ words as a candidate of its own. Its Script_EXTENSIONS include
 * Katakana, so `scx` catches it.
 */
const unsegmentedScripts = ["Han", "Hiragana", "Katakana", "Thai", "Lao", "Khmer", "Myanmar"];

/**
 * What this package calls a word when the author names no pattern of their own.
 *
 * READ IT AS THREE DECISIONS RATHER THAN AS A REGEX. A letter counts unless its
 * script is one nobody writes with spaces; a digit or an underscore counts
 * anywhere; and a COMBINING MARK counts, which is what keeps `हिन्दी` and a
 * pointed `שָׁלוֹם` whole -- MEASURED, without `\p{M}` the first breaks into
 * `शब`, `और`, `वन`, `गर` and the second into fragments, because the marks are
 * not `\p{L}` and each split the run.
 *
 * THE DOUBLE NEGATION IS FORCED BY THE LANGUAGE and is not cleverness for its
 * own sake: `[^\P{L}…]` is `a letter AND none of these`, which is set
 * subtraction -- and JavaScript has no subtraction in a `u`-mode class. The `v`
 * flag does, and is declined: it is newer than the runtimes this package
 * promises, and a pattern that throws on one of them is worse than a long one.
 *
 * EXPORTED so an author can widen it rather than rewrite it -- `new
 * RegExp(`${defaultWordPattern.source}|\\p{scx=Han}+`, "gu")` puts Han back for
 * somebody who wants single characters.
 */
export const defaultWordPattern: RegExp = new RegExp(
  `(?:[^\\P{L}${unsegmentedScripts.map((script) => `\\p{scx=${script}}`).join("")}]|[\\p{N}\\p{M}_])+`,
  "gu",
);

/**
 * WHICH MATCHES SURVIVE, and what counts as a match -- the part of a handler's
 * options that is about WORDS rather than about which lines it reads.
 *
 * IT LIVES WITH THE SCANNER AND NOT WITH EITHER HANDLER, so that a handler's own
 * options type is exactly the question that handler answers on its own. The
 * defaults are the ddc-source-around reference's, taken from its code; a handler
 * that chose its own would be a second set of numbers an author has to learn.
 *
 * EVERY FIELD IS OPTIONAL HERE AND RESOLVED AT THE HANDLER: `wordsIn` takes the
 * resolved triple, so the defaults are written once, at the site that applies
 * them, rather than a second time beside this documentation.
 */
export interface WordOptions {
  /**
   * The shortest match worth offering.
   *
   * TWO IS THE REFERENCE'S DEFAULT, and the reason is what a one-character
   * candidate costs: it matches nearly everything the user has typed so far, so
   * it fills the popup while telling them nothing.
   */
  readonly minLength?: number;
  /**
   * A line AT OR OVER this many characters is skipped WHOLE -- not truncated.
   *
   * 200 IS THE REFERENCE'S `COLUMNS_MAX`, and the bound is on the LINE rather
   * than on the scan because of what a very long line is: minified output, a
   * base64 blob, a generated table. Its "words" are not words anyone will want,
   * and it is exactly the line whose scan costs the most.
   */
  readonly maxColumns?: number;
  /**
   * What counts as a word. Defaults to `defaultWordPattern`.
   *
   * SUPPLY YOUR OWN AND IT IS USED AS GIVEN: the flags are yours too, and a
   * pattern without `g` matches once per line, which is almost certainly not
   * what you meant.
   */
  readonly wordPattern?: RegExp;
}

/**
 * Every distinct word in `lines`, in the order each was first seen.
 *
 * EXPORTED so the arms can drive the filters directly. What the handler adds is
 * the WINDOW, and that is asserted through the handler.
 *
 * ITS FILTERS ARRIVE RESOLVED, with no defaults reachable from here: a handler
 * has already defaulted them against its own options, and a second set beside
 * this signature is how the two come to disagree.
 *
 * FIRST-SEEN AND NOT LAST-SEEN, which is what a `Set` gives and what the
 * reference relies on: the word nearest the top of the window wins its place,
 * and an implementation that rebuilt the list from the end would offer the same
 * SET in a different order, which an editor shows as a different popup.
 */
export function wordsIn(
  lines: readonly string[],
  options: { pattern: RegExp; minLength: number; maxColumns: number },
): string[] {
  const found = new Set<string>();
  // REBUILT PER CALL, NOT PER LINE, and never the caller's own instance: a `g`
  // regex is stateful through `lastIndex`, so reusing the object a caller handed
  // in would make this function's answer depend on what they did with it last.
  const pattern = new RegExp(options.pattern.source, options.pattern.flags);
  for (const line of lines) {
    if (line.length >= options.maxColumns) {
      continue;
    }
    for (const match of line.matchAll(pattern)) {
      const word = match[0];
      if (word.length >= options.minLength) {
        found.add(word);
      }
    }
  }
  return [...found];
}
