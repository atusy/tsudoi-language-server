import { describe, expect, test } from "bun:test";
import { defaultWordPattern, wordsIn } from "../src/words.ts";

const ascii = { pattern: /[A-Za-z0-9_]+/gu, minLength: 1, maxColumns: 200 };

describe("the words a window holds", () => {
  /**
   * THE REFERENCE'S OWN UNIT TEST, TRANSLATED, so that a reader can hold the two
   * side by side: `allWords(["asdf _w2er", "223r wawer"], "[a-zA-Z0-9_]+", 1)`.
   * Its answer is the value asserted here.
   */
  test("every match on every line, in document order", () => {
    expect(wordsIn(["asdf _w2er", "223r wawer"], ascii)).toEqual([
      "asdf",
      "_w2er",
      "223r",
      "wawer",
    ]);
  });

  /**
   * FIRST-SEEN AND NOT MERELY DISTINCT, WHICH NEEDS A REPEAT THAT COMES LATER.
   * `foo` appears on both lines and `baz` only on the second, so a list built
   * from the END would answer `bar baz foo` -- the same SET, a different popup.
   * A fixture whose repeats were adjacent could not tell the two apart.
   */
  test("a repeat keeps the place where it was first seen", () => {
    expect(wordsIn(["foo bar foo", "bar baz foo"], ascii)).toEqual(["foo", "bar", "baz"]);
  });

  /**
   * THE LENGTH FILTER, AT ITS BOUNDARY ON BOTH SIDES: `ab` is dropped and `abc`
   * is kept at `minLength: 3`, so an off-by-one in either direction reddens. A
   * fixture whose words were all far from the bound would grade nothing.
   */
  test("a match shorter than the bound is dropped, and one exactly at it is kept", () => {
    expect(wordsIn(["a ab abc abcd"], { ...ascii, minLength: 3 })).toEqual(["abc", "abcd"]);
  });

  /**
   * THE LINE BOUND IS `>=` AND THE LINE IS SKIPPED WHOLE. Both halves are the
   * assertion: the 199-character line survives ENTIRE, and the 200-character one
   * contributes NOTHING rather than a truncated prefix -- which is what a reader
   * who assumed a scan bound would expect instead.
   */
  test("a line at the column bound is skipped whole, and one under it is kept", () => {
    const kept = "a".repeat(199);
    const skipped = "b".repeat(200);

    expect(wordsIn([kept, skipped], ascii)).toEqual([kept]);
  });

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

    const words = wordsIn(line, { pattern: defaultWordPattern, minLength: 2, maxColumns: 200 });

    expect(words).toContain("Neovim");
    expect(words).toContain("LSP");
    expect(words.some((word) => word.includes("誰"))).toBe(false);
  });

  /**
   * GIVING UP IS ABOUT SEGMENTATION AND NOT ABOUT BEING NON-LATIN, which is the
   * reading this arm exists to pin: Greek, Cyrillic and KOREAN all put spaces
   * between words, so their words survive where Japanese does not. Korean is the
   * one that would go if somebody "fixed" this by excluding CJK as a block.
   */
  test("scripts that do use spaces keep their words", () => {
    const words = wordsIn(["Ελλάδα Привет 한국어 단어"], {
      pattern: defaultWordPattern,
      minLength: 2,
      maxColumns: 200,
    });

    expect(words).toEqual(["Ελλάδα", "Привет", "한국어", "단어"]);
  });

  /**
   * A COMBINING MARK IS PART OF ITS WORD, MEASURED: without `\p{M}` in the
   * pattern `हिन्दी` breaks into `शब`, `और`, `वन`, `गर` -- the marks are not
   * `\p{L}`, so each one splits the run it sits in. Devanagari and pointed
   * Hebrew are the scripts where that is the ordinary case rather than an edge.
   */
  test("a word carrying combining marks stays whole", () => {
    const words = wordsIn(["हिन्दी शब्द שָׁלוֹם"], {
      pattern: defaultWordPattern,
      minLength: 2,
      maxColumns: 200,
    });

    expect(words).toEqual(["हिन्दी", "शब्द", "שָׁלוֹם"]);
  });

  /**
   * THE PROLONGED SOUND MARK IS PART OF THE KATAKANA IT FOLLOWS, and it is why
   * the pattern asks for `scx` rather than `sc`: U+30FC is Script=COMMON, so
   * `\p{sc=Katakana}` leaves it behind as a candidate of its own once the
   * カタカナ around it has been dropped.
   */
  test("the prolonged sound mark does not leak out of katakana", () => {
    const words = wordsIn(["コンピューターー"], {
      pattern: defaultWordPattern,
      minLength: 1,
      maxColumns: 200,
    });

    expect(words).toEqual([]);
  });

  /**
   * A CALLER'S OWN REGEX IS NOT CONSUMED, and this is the arm for a defect that
   * is invisible on a single call: a `g` regex carries `lastIndex`, so passing
   * one instance twice would make the SECOND answer depend on where the first
   * stopped. The same object is deliberately reused here.
   */
  test("the same pattern object answers the same twice", () => {
    const shared = { pattern: /[A-Za-z]+/gu, minLength: 1, maxColumns: 200 };

    expect(wordsIn(["alpha beta"], shared)).toEqual(wordsIn(["alpha beta"], shared));
  });

  /** An empty window is not an error, and yields nothing to offer. */
  test("no lines yield no words", () => {
    expect(wordsIn([], ascii)).toEqual([]);
  });
});
