import { describe, expect, test } from "bun:test";
import { regexScanner } from "../src/scanners.ts";
import { wordsIn } from "../src/words.ts";

const ascii = { scanner: regexScanner(/[A-Za-z0-9_]+/gu), minLength: 1, maxColumns: 200 };

describe("the words a set of lines holds", () => {
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
  test("a repeat is yielded again, because uniqueness is not decided here", () => {
    expect(wordsIn(["foo bar foo", "bar baz"], ascii)).toEqual(["foo", "bar", "foo", "bar", "baz"]);
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

  /** An empty window is not an error, and yields nothing to offer. */
  test("no lines yield no words", () => {
    expect(wordsIn([], ascii)).toEqual([]);
  });
});
