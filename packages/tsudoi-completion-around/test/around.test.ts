import { describe, expect, test } from "bun:test";
import { windowAround, wordsIn } from "../src/around.ts";

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
   * THE DEFAULT PATTERN IS NOT ASCII-ONLY, which is this package's one departure
   * from the reference and the one a Japanese buffer would otherwise discover as
   * an empty popup. THE ASCII PATTERN IS DRIVEN BESIDE IT so the arm reads as a
   * property of the DEFAULT rather than of the fixture.
   */
  test("the default pattern finds words the ASCII one cannot", () => {
    const line = ["こんにちは world Ελλάδа"];
    const byDefault = { pattern: /[\p{L}\p{N}_]+/gu, minLength: 1, maxColumns: 200 };

    expect(wordsIn(line, byDefault)).toContain("こんにちは");
    expect(wordsIn(line, ascii)).not.toContain("こんにちは");
    // AND THE PAIR: the ASCII pattern is not simply broken -- it still finds the
    // Latin word, so the difference above is about the alphabet and not about
    // the fixture failing to parse.
    expect(wordsIn(line, ascii)).toContain("world");
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

describe("the window a cursor sees", () => {
  /**
   * `maxSize` EITHER SIDE AND THE CURSOR'S OWN LINE, which is three bounds in
   * one arm because they are one arithmetic: the cursor at line 10 with a window
   * of 2 sees 8 through 12, and the half-open end is 13.
   */
  test("the cursor's line and maxSize either side", () => {
    expect(windowAround(10, 100, 2)).toEqual({ from: 8, to: 13 });
  });

  /**
   * CLAMPED AT BOTH ENDS, and the two are separate mistakes: a negative `from`
   * makes `slice` count from the END of the buffer -- a window at the top of the
   * file silently reading the bottom of it -- where a `to` past the end is
   * merely harmless.
   */
  test("a window wider than the buffer is clamped to it", () => {
    expect(windowAround(0, 5, 200)).toEqual({ from: 0, to: 5 });
    expect(windowAround(4, 5, 200)).toEqual({ from: 0, to: 5 });
  });
});
