/**
 * WHERE ONE LINE'S WORDS COME FROM, and the one thing in this package an author
 * is most likely to want to replace.
 *
 * IT IS A CALLBACK AND NOT A PATTERN, WHICH IS A DELIBERATE NARROWING OF WHAT
 * THIS PACKAGE DECIDES. A `RegExp` option could only ever offer what a character
 * class can express, and a character class cannot find a word boundary in a
 * language that writes none -- so the option that used to be `wordPattern` is now
 * a function, and the two scanners below are the answers this package happens to
 * ship rather than the range of answers it allows.
 */

/**
 * A scanner: one line in, its candidate words out, in the order they appear.
 *
 * PER LINE AND NOT PER WINDOW, which is what lets a handler apply its column
 * bound BEFORE paying for a scan -- and what keeps a scanner writable without
 * knowing whether it is being driven over a window or over a whole document.
 *
 * AN `Iterable` RATHER THAN AN ARRAY so a generator is a scanner, and so a
 * scanner that finds nothing costs no allocation.
 */
export type Scanner = (line: string) => Iterable<string>;

/**
 * Scripts written WITHOUT SPACES BETWEEN WORDS, which `defaultWordPattern` gives
 * up on and `segmentScanner` does not.
 *
 * WHY GIVING UP BEATS TRYING IN A PATTERN, MEASURED ON A REAL POPUP: a run of
 * letters is a WORD only where the writing system separates them, and Japanese
 * does not. With these included,
 * `[NeovimのLSPで誰にどうして怒られたのかを確認するための設定]` matched as ONE
 * candidate -- thirty characters of prose offered as a completion, and `Neovim`
 * and `LSP` NOT offered at all, because they were swallowed by it. Splitting these
 * out recovers both.
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
 * What this package calls a word when the author names no scanner of their own.
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
 * EXPORTED SO IT CAN BE WIDENED RATHER THAN REWRITTEN --
 * `regexScanner(new RegExp(`${defaultWordPattern.source}|\\p{scx=Han}+`, "gu"))`
 * puts Han back for somebody who wants single characters. WHOEVER WANTS JAPANESE
 * PROPERLY WANTS `segmentScanner` INSTEAD, which is what this pattern cannot be
 * widened into.
 */
export const defaultWordPattern: RegExp = new RegExp(
  `(?:[^\\P{L}${unsegmentedScripts.map((script) => `\\p{scx=${script}}`).join("")}]|[\\p{N}\\p{M}_])+`,
  "gu",
);

/**
 * A scanner offering every match of `pattern`.
 *
 * THE PATTERN IS REBUILT ONCE, HERE, AND THE CALLER'S OBJECT IS NEVER USED --
 * MEASURED, because it looks like defensiveness and is not: `matchAll` COPIES
 * `lastIndex` off the regex it is handed, so `/ab./gu` carrying `lastIndex = 5`
 * finds NOTHING in `abc abd`. A scanner built from a regex its author had used
 * elsewhere would answer about a suffix of every line. Rebuilding once is enough
 * rather than once per line, because `matchAll` does not write back to its
 * argument.
 *
 * THE GLOBAL FLAG IS ADDED IF IT IS MISSING, AND THE SENTENCE THIS REPLACES WAS
 * FALSE: the option's own documentation used to say a pattern without `g`
 * `matches once per line`. MEASURED, `matchAll` THROWS
 * `argument must not be a non-global regular expression` -- and a throw inside a
 * completion handler reaches the user as an empty popup with nothing to read, so
 * the flag is supplied for them instead.
 */
export function regexScanner(pattern: RegExp = defaultWordPattern): Scanner {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const own = new RegExp(pattern.source, flags);
  return function* (line: string): Iterable<string> {
    for (const match of line.matchAll(own)) {
      yield match[0];
    }
  };
}

/**
 * WHAT COUNTS AS A WORD ONCE `Intl.Segmenter` HAS DECIDED WHERE ONE ENDS.
 *
 * `isWordLike` IS NOT CONSULTED, AND THAT IS THE DECISION THIS CONSTANT CARRIES.
 * MEASURED at bun 1.3.13 and deno 2.9.4, IN TWO READINGS RATHER THAN ONE, because
 * a single sentence covering both would claim more than either took:
 *
 * ONE, THE FLAG. On a short fixture, under each of `undefined`, `en-US`, `ja` and
 * `ja-JP`, bun reports `isWordLike: false` for EVERY segment containing a digit --
 * `sha256`, `utf8`, `v2`, `a1b2`, `123`, `42.5` -- where deno reports true for all
 * of them. The locale changed neither runtime's answer.
 *
 * TWO, THE BOUNDARIES. On a wider fixture -- Japanese, Thai, Korean, Devanagari,
 * pointed Hebrew, halfwidth katakana, identifiers and punctuation -- at locale
 * `ja` ALONE, the two runtimes segmented IDENTICALLY and disagreed only on the
 * flag. That is what makes reading the boundaries and ignoring the flag a repair
 * rather than a guess, and it is a reading at ONE locale rather than four.
 *
 * SO A FILTER ON THE FLAG WOULD DROP THE COMMONEST IDENTIFIERS IN A CODEBASE
 * UNDER ONE OF THE TWO RUNTIMES THIS PROJECT PROMISES, and the popup would differ
 * by runtime for one config. THAT IS AN ENGINE BUG AND MAY BE FIXED, which is why
 * the versions are written down; the class below admits everything the flag admits,
 * over the fixture measured, so a fixed engine changes nothing here.
 *
 * IT IS ALSO WHY THE FLAG IS NOT KEPT AS A REDUNDANT FIRST CLAUSE: no segment in
 * that fixture was `isWordLike` WITHOUT matching the class, on either runtime, so
 * `isWordLike ||` would decide nothing while reading as though it did.
 */
const wordish = /[\p{L}\p{N}\p{M}_]/u;

/**
 * A scanner that asks `Intl.Segmenter` where the words are.
 *
 * WHAT IT BUYS OVER `regexScanner` IS BOUNDARIES IN A LANGUAGE THAT WRITES NONE:
 * `こんにちは世界` becomes `こんにちは` and `世界`, which no character class can
 * do. So this REVERSES the ruling `defaultWordPattern` carries for the scripts it
 * subtracts -- not by widening that pattern, which cannot express it, but by asking
 * something that already knows. ARMED FOR JAPANESE AND THAI AND NOT FOR THE REST OF
 * THAT LIST: what the arms read is that those two are segmented, and Lao, Khmer and
 * Myanmar are covered by the same mechanism and by no assertion.
 *
 * `locales` IS WORTH SUPPLYING. MEASURED, the default resolved differently per
 * RUNTIME on one machine -- `en-US` under bun, `ja-JP` under deno -- because each
 * picks its own fallback. Segmentation of the fixture measured did not change with
 * it, but a language whose segmentation is dictionary-driven is exactly where it
 * would, so a config that names its locale does not depend on either.
 *
 * ONE SEGMENTER FOR THE SCANNER'S WHOLE LIFE, which is what makes this a factory
 * rather than a bare function -- a scanner is called once per line of every
 * document read, and this way the segmenter is built once per config instead.
 * NOTHING HERE MEASURES WHAT THAT SAVES, and a per-line segmenter would be
 * CORRECT, so the arm beside it can only say that reuse does not corrupt the
 * answer.
 */
export function segmentScanner(locales?: Intl.LocalesArgument): Scanner {
  const segmenter = new Intl.Segmenter(locales, { granularity: "word" });
  return function* (line: string): Iterable<string> {
    for (const { segment } of segmenter.segment(line)) {
      if (wordish.test(segment)) {
        yield segment;
      }
    }
  };
}

/**
 * The scanner every handler here uses when an author names none.
 *
 * ONE VALUE FOR THE LIFE OF THE MODULE, AND THAT IS LOAD-BEARING RATHER THAN
 * TIDY: the corpus memo keys on scanner IDENTITY, because a callback cannot be
 * compared any other way. A default built per call would make
 * `completeCorpus(context, params)` -- the form with no options -- rescan every
 * open document on every keystroke, with every arm in this package still green.
 *
 * IT IS THE REGEX SCANNER AND NOT THE SEGMENTING ONE, DELIBERATELY. Segmentation
 * is better for the languages the pattern gives up on, and it is also a behaviour
 * change for every config that already exists, resting on an engine feature this
 * package has measured disagreeing across runtimes. So it is opted into by name.
 */
export const defaultScanner: Scanner = regexScanner(defaultWordPattern);
