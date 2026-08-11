import type { Scanner } from "./scanners.ts";

/**
 * WHICH MATCHES SURVIVE A SCAN, and where the scan comes from -- the part of a
 * handler's options that is about WORDS rather than about which lines it reads.
 *
 * IT LIVES WITH `wordsIn` AND NOT WITH EITHER HANDLER, so that a handler's own
 * options type is exactly the question that handler answers on its own. The two
 * numeric defaults are the ddc-source-around reference's, taken from its code; a
 * handler that chose its own would be a second set of numbers an author has to
 * learn.
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
   *
   * IT IS MEASURED IN CODE UNITS AND THAT BITES A SEGMENTED LANGUAGE, said here
   * because `segmentScanner` makes it reachable: Japanese words of one character
   * are ordinary -- `誰`, `本`, `人` -- so a config segmenting Japanese and wanting
   * them needs `minLength: 1`, and pays for it in one-letter Latin candidates.
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
   * Where one line's words come from. Defaults to `defaultScanner`.
   *
   * THIS REPLACED A `wordPattern` OPTION AND THE CHANGE IS NOT COSMETIC: a regex
   * can only offer what a character class expresses, and no character class finds
   * a word boundary in a language that writes none. `regexScanner(yours)` is the
   * old option spelled through the new one; `segmentScanner()` is the thing the
   * old one could not be widened into.
   *
   * SUPPLY IT FROM OUTSIDE YOUR HANDLER, NOT INSIDE. The corpus memo keys on this
   * value's IDENTITY -- a callback cannot be compared any other way -- so a
   * scanner built inside the arrow that calls a handler is a new key on every
   * keystroke, and every document is rescanned every time with nothing to say so.
   */
  readonly scanner?: Scanner;
}

/**
 * Every distinct word in `lines`, in the order each was first seen.
 *
 * EXPORTED so the arms can drive the filters directly. WHAT A HANDLER ADDS IS
 * WHICH LINES REACH THIS -- a window either side of the cursor, or every open
 * document -- and each handler's own arms assert its own choice.
 *
 * ITS OPTIONS ARRIVE RESOLVED, with no defaults reachable from here: a handler
 * has already defaulted them against its own options, and a second set beside
 * this signature is how the two come to disagree.
 *
 * FIRST-SEEN AND NOT LAST-SEEN, which is what a `Set` gives and what the
 * reference relies on: of two occurrences the earlier in `lines` wins its place,
 * and an implementation that rebuilt the list from the end would offer the same
 * SET in a different order, which an editor shows as a different popup.
 *
 * THE COLUMN BOUND IS APPLIED BEFORE THE SCANNER RUNS, which is the one ordering
 * decision here: a scanner is the expensive part -- a segmenter above all -- and
 * the line this bound exists to refuse is the most expensive line in the file.
 */
export function wordsIn(
  lines: readonly string[],
  options: { scanner: Scanner; minLength: number; maxColumns: number },
): string[] {
  const found = new Set<string>();
  for (const line of lines) {
    if (line.length >= options.maxColumns) {
      continue;
    }
    for (const word of options.scanner(line)) {
      if (word.length >= options.minLength) {
        found.add(word);
      }
    }
  }
  return [...found];
}
