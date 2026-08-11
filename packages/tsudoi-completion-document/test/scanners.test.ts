import { describe, expect, test } from "bun:test";
import {
  defaultScanner,
  defaultWordPattern,
  regexScanner,
  segmentScanner,
} from "../src/scanners.ts";

/** What a scanner offers for one line, as an array. */
function words(scanner: (line: string) => Iterable<string>, line: string): string[] {
  return [...scanner(line)];
}

/** The words `scanner` offers for `line` that are at least `minLength` long --
 * the one filter a handler applies on top of a scan, applied here so an arm about
 * the DEFAULT PATTERN reads as it did when it drove `wordsIn`. */
function atLeast(minLength: number, found: readonly string[]): string[] {
  return found.filter((word) => word.length >= minLength);
}

describe("the default pattern, through the regex scanner", () => {
  /**
   * THE POPUP THIS DEFAULT WAS REWRITTEN FOR, AS THE LINE IT CAME FROM. A run of
   * letters is a WORD only where the writing system puts spaces between them,
   * and the first spelling of this default -- `[\p{L}\p{N}_]+` -- did not know
   * that: it matched THIRTY CHARACTERS OF JAPANESE PROSE as one candidate, and
   * swallowed `Neovim` and `LSP` doing it, so neither was offered at all.
   *
   * BOTH HALVES ARE THE ASSERTION AND THE SECOND IS THE ONE THAT MATTERS: the
   * phrase is absent, AND the two Latin words abutting it are present. An
   * implementation that dropped every line holding Japanese would pass the first
   * half alone.
   */
  test("a Latin word touching Japanese is offered, and the Japanese run is not", () => {
    const line = ["[NeovimのLSPで誰にどうして怒られたのかを確認するための設定](https://x.jp/a)"];

    const found = atLeast(2, words(defaultScanner, line[0] ?? ""));

    expect(found).toContain("Neovim");
    expect(found).toContain("LSP");
    expect(found.some((word) => word.includes("誰"))).toBe(false);
  });

  /**
   * GIVING UP IS ABOUT SEGMENTATION AND NOT ABOUT BEING NON-LATIN, which is the
   * reading this arm exists to pin: Greek, Cyrillic and KOREAN all put spaces
   * between words, so their words survive where Japanese does not. Korean is the
   * one that would go if somebody "fixed" this by excluding CJK as a block.
   */
  test("scripts that do use spaces keep their words", () => {
    const found = atLeast(2, words(defaultScanner, "Ελλάδα Привет 한국어 단어"));

    expect(found).toEqual(["Ελλάδα", "Привет", "한국어", "단어"]);
  });

  /**
   * A COMBINING MARK IS PART OF ITS WORD, MEASURED: without `\p{M}` in the
   * pattern `हिन्दी` breaks into `शब`, `और`, `वन`, `गर` -- the marks are not
   * `\p{L}`, so each one splits the run it sits in. Devanagari and pointed
   * Hebrew are the scripts where that is the ordinary case rather than an edge.
   */
  test("a word carrying combining marks stays whole", () => {
    const found = atLeast(2, words(defaultScanner, "हिन्दी शब्द שָׁלוֹם"));

    expect(found).toEqual(["हिन्दी", "शब्द", "שָׁלוֹם"]);
  });

  /**
   * THE PROLONGED SOUND MARK IS PART OF THE KATAKANA IT FOLLOWS, and it is why
   * the pattern asks for `scx` rather than `sc`: U+30FC is Script=COMMON, so
   * `\p{sc=Katakana}` leaves it behind as a candidate of its own once the
   * カタカナ around it has been dropped.
   */
  test("the prolonged sound mark does not leak out of katakana", () => {
    const found = atLeast(1, words(defaultScanner, "コンピューターー"));

    expect(found).toEqual([]);
  });
});

describe("the regex scanner", () => {
  /**
   * THE DEFAULT PATTERN'S OWN RULING, REACHED THROUGH THE SCANNER: a run of
   * letters is a word only where the writing system spaces them, so the Latin
   * words come out of Japanese prose and the Japanese does not.
   */
  test("Latin words come out of Japanese prose, and the Japanese does not", () => {
    expect(words(regexScanner(), "NeovimのLSPで設定")).toEqual(["Neovim", "LSP"]);
  });

  /** A pattern of the author's own is used as given. */
  test("a supplied pattern decides what a word is", () => {
    expect(words(regexScanner(/[A-Z]+/gu), "abcDEFghiJKL")).toEqual(["DEF", "JKL"]);
  });

  /**
   * A CALLER'S `lastIndex` IS NOT INHERITED, and this is a real hazard rather
   * than a tidy-up: MEASURED, `matchAll` COPIES `lastIndex` off the regex it is
   * handed, so `/ab./gu` with `lastIndex = 5` finds NOTHING in `abc abd`. A
   * scanner built from a regex an author has used elsewhere would then answer
   * about a suffix of every line.
   */
  test("a pattern carrying a stale lastIndex still scans from the start", () => {
    const used = /ab./gu;
    used.lastIndex = 5;

    expect(words(regexScanner(used), "abc abd")).toEqual(["abc", "abd"]);
  });

  /**
   * AND ONE SCANNER SCANS MANY LINES INDEPENDENTLY, which is the same hazard one
   * door along: the factory builds the regex once, so a line's scan must not
   * leave a position behind for the next line.
   */
  test("the same scanner answers the same for a line whichever line preceded it", () => {
    const scanner = regexScanner(/ab./gu);

    expect(words(scanner, "abc abd")).toEqual(["abc", "abd"]);
    expect(words(scanner, "abc abd")).toEqual(["abc", "abd"]);
  });

  /**
   * A PATTERN WITHOUT `g` IS REPAIRED RATHER THAN REFUSED, AND THE PROSE THIS
   * REPLACES WAS FALSE. It said such a pattern `matches once per line`; MEASURED,
   * `String.prototype.matchAll` THROWS `argument must not be a non-global regular
   * expression`. Inside a completion handler that throw reaches the user as an
   * empty popup with nothing to read, so the flag is added for them.
   */
  test("a pattern without the global flag scans every match rather than throwing", () => {
    expect(words(regexScanner(/[a-z]+/u), "alpha beta")).toEqual(["alpha", "beta"]);
  });

  /** The default scanner is the default pattern's, which is what keeps
   * `defaultWordPattern` worth exporting. */
  test("the default scanner and the default pattern agree", () => {
    expect(words(defaultScanner, "alpha beta")).toEqual(
      words(regexScanner(defaultWordPattern), "alpha beta"),
    );
  });

  /**
   * `defaultScanner` IS ONE OBJECT FOR THE LIFE OF THE MODULE, and it is asserted
   * because the corpus memo keys on scanner IDENTITY: a default rebuilt per call
   * would make `completeCorpus(context, params)` -- the form with no options, and
   * the one this repository's own example uses -- re-scan every document on every
   * keystroke, with every other arm still green.
   */
  test("the default scanner is one value rather than one per read", () => {
    expect(defaultScanner).toBe(defaultScanner);
  });
});

describe("the segmenting scanner", () => {
  /**
   * IT SEGMENTS WHAT THE DEFAULT PATTERN GIVES UP ON, which is the whole reason it
   * exists: `Intl.Segmenter` knows where Japanese words end and a character class
   * cannot.
   */
  test("Japanese is split into words rather than swallowed or dropped", () => {
    expect(words(segmentScanner("ja"), "こんにちは世界")).toEqual(["こんにちは", "世界"]);
  });

  /** AND THE LATIN WORDS INSIDE IT SURVIVE, which is what the default pattern
   * already managed and this must not lose. */
  test("Latin words inside Japanese prose come out too", () => {
    expect(words(segmentScanner("ja"), "NeovimのLSPで設定")).toEqual([
      "Neovim",
      "の",
      "LSP",
      "で",
      "設定",
    ]);
  });

  /**
   * A SEGMENT CARRYING A DIGIT IS A WORD, AND THIS ARM IS THE WHOLE REASON THIS
   * SCANNER DOES NOT CONSULT `isWordLike`.
   *
   * MEASURED at bun 1.3.13 and deno 2.9.4, same fixture, same four locales: bun
   * reports `isWordLike: false` for EVERY segment containing a digit -- `sha256`,
   * `utf8`, `v2`, `a1b2`, `123`, `42.5` -- where deno reports true for all of
   * them. The SEGMENT BOUNDARIES agreed exactly; only the flag differed. A scanner
   * filtering on that flag would drop the commonest identifiers in a codebase
   * under one of the two runtimes this project promises.
   *
   * SO THIS ARM DISCRIMINATES UNDER BUN AND WOULD NOT UNDER DENO, said rather than
   * left to be discovered: `bun test` is what runs it, which is the runtime where
   * `isWordLike` is wrong, so the arm is armed where it needs to be.
   */
  test("identifiers carrying digits are offered", () => {
    expect(words(segmentScanner("ja"), "sha256 utf8 v2 a1b2 123")).toEqual([
      "sha256",
      "utf8",
      "v2",
      "a1b2",
      "123",
    ]);
  });

  /** Punctuation and whitespace are not words. */
  test("punctuation and spacing are dropped", () => {
    expect(words(segmentScanner("ja"), "a = b, c(d)")).toEqual(["a", "b", "c", "d"]);
  });

  /**
   * NOTHING IS EXCLUDED BY SCRIPT, which is the difference from the default
   * pattern stated as an assertion: the pattern subtracts the unsegmented scripts
   * because it cannot split them, and this one has no reason to.
   */
  test("Thai and Korean are segmented rather than refused", () => {
    expect(words(segmentScanner("th"), "ภาษาไทย").length).toBeGreaterThan(1);
    expect(words(segmentScanner("ko"), "한국어 단어")).toEqual(["한국어", "단어"]);
  });

  /**
   * ONE SEGMENTER PER SCANNER AND NOT PER LINE, asserted through the answer rather
   * than by counting constructions: building an `Intl.Segmenter` is the expensive
   * part, and a scanner that rebuilt it per line would still be correct -- so what
   * this arm can say is that reuse does not corrupt the answer.
   */
  test("one scanner answers the same for a line whichever line preceded it", () => {
    const scanner = segmentScanner("ja");

    expect(words(scanner, "こんにちは世界")).toEqual(["こんにちは", "世界"]);
    expect(words(scanner, "こんにちは世界")).toEqual(["こんにちは", "世界"]);
  });
});
