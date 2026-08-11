import type { Filter } from "./filters.ts";
import type { Scanner } from "./scanners.ts";

/**
 * WHICH WORDS A SCAN PRODUCES AND WHICH OF THEM REACH THE CLIENT -- the part of a
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
 *
 * THE SCAN FIELDS AND THE PIPELINE FIELDS ARE NOT THE SAME KIND OF OPTION, and the
 * corpus memo is where the difference shows: `scanner`, `minLength` and
 * `maxColumns` decide what is SCANNED, so changing one invalidates a remembered
 * scan. `filters` and `maxItems` run AFTER, on what was remembered, so changing
 * them costs nothing and re-reads no document.
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
  /**
   * What reaches the client out of what was scanned. Defaults to
   * `defaultFilters` -- the prefix filter, then dedup.
   *
   * A LIST RATHER THAN A FLAG BECAUSE THE DEFAULT COSTS SOMETHING: a prefix filter
   * defeats a FUZZY client, which can no longer be offered what the prefix
   * rejected. A fuzzy pipeline wants its own filter here, or none of them and a
   * `maxItems` instead.
   *
   * AN EMPTY LIST IS THE OLD BEHAVIOUR AND IS WHAT MEASURED BADLY: unfiltered,
   * `completeCorpus` over five open files sent 3341 items and 155 KiB PER
   * KEYSTROKE, and the editor stopped completing while the server stayed healthy.
   */
  readonly filters?: readonly Filter[];
  /**
   * At most this many items, counted AFTER the filters. Unbounded by default.
   *
   * A BACKSTOP AND NOT THE DESIGN: the filters are what make an answer small, and
   * this is what keeps a pathological buffer from reaching the client at all. Set
   * it alone, with no filters, and what an author gets is an arbitrary slice of
   * their corpus in the order documents were opened.
   */
  readonly maxItems?: number;
}

/**
 * The word being typed at the end of `before` -- the cursor's line UP TO the
 * cursor -- or `""` when the cursor is not in a word. What `prefixFilter` tests
 * against.
 *
 * IT TAKES THE TEXT RATHER THAN A LINE AND A COLUMN so that a caller holding a
 * whole document can slice, and one holding none can ask its store for that range
 * alone. `completeCorpus` does the second: reading the whole document again, only
 * to look at one line, would undo the memo it just consulted.
 *
 * IT ASKS THE SCANNER RATHER THAN A RULE OF ITS OWN, which is the whole point: the
 * prefix and the candidates then agree about what a word is, so a config that
 * segments Japanese finds `コー` where the default pattern finds nothing there.
 *
 * ONLY THE TEXT BEFORE THE CURSOR IS SCANNED, AND THE LAST WORD IS KEPT ONLY IF IT
 * REACHES THE END OF IT. Scanning past the cursor would let a scanner join what the
 * user has typed to what follows it; the `endsWith` is what tells `alpha|` from
 * `alpha |`, where the second is not in a word at all and must filter nothing.
 *
 * IT IS NOT THE EDITOR'S NOTION OF A WORD AND CANNOT BE. A client computes its own
 * prefix from its own rules -- Vim's `iskeyword`, say -- and MEASURED, ddc's
 * default finds NO word before a Japanese cursor at all. Where the two disagree the
 * client may filter what this kept, or show what this dropped; the second is the
 * direction that loses candidates, which is why `prefixFilter` ignores case.
 */
export function typedWord(scanner: Scanner, before: string): string {
  let last = "";
  for (const word of scanner(before)) {
    last = word;
  }
  return last !== "" && before.endsWith(last) ? last : "";
}

/**
 * Every word in `lines`, IN ORDER AND WITH REPEATS, one scan per line.
 *
 * IT DOES NOT DEDUPLICATE, AND THAT IS A DECISION RATHER THAN AN OMISSION.
 * Uniqueness is `dedupFilter`'s, so that it is decided in ONE place an author can
 * reorder or remove -- to weight a popup by frequency, say. A scan that deduped for
 * itself would leave that filter a no-op reading as though it did something.
 *
 * EXPORTED so the arms can drive the filters directly. WHAT A HANDLER ADDS IS
 * WHICH LINES REACH THIS -- a window either side of the cursor, or every open
 * document -- and each handler's own arms assert its own choice.
 *
 * ITS OPTIONS ARRIVE RESOLVED, with no defaults reachable from here: a handler
 * has already defaulted them against its own options, and a second set beside
 * this signature is how the two come to disagree.
 *
 * THE COLUMN BOUND IS APPLIED BEFORE THE SCANNER RUNS, which is the one ordering
 * decision here: a scanner is the expensive part -- a segmenter above all -- and
 * the line this bound exists to refuse is the most expensive line in the file.
 */
export function wordsIn(
  lines: readonly string[],
  options: { scanner: Scanner; minLength: number; maxColumns: number },
): string[] {
  const found: string[] = [];
  for (const line of lines) {
    if (line.length >= options.maxColumns) {
      continue;
    }
    for (const word of options.scanner(line)) {
      if (word.length >= options.minLength) {
        found.push(word);
      }
    }
  }
  return found;
}
