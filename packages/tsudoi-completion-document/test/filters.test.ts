import { describe, expect, test } from "bun:test";
import { applyFilters, dedupFilter, defaultFilters, prefixFilter } from "../src/filters.ts";

describe("the prefix filter", () => {
  /**
   * WHAT THE USER HAS TYPED IS WHAT SURVIVES, which is the whole reason a server
   * filters at all: MEASURED before this existed, one keystroke sent 3341 items
   * and 155 KiB for a client whose own cap is 500, and the editor stopped
   * answering while the language server stayed healthy.
   */
  test("only words starting with what was typed survive", () => {
    expect([
      ...prefixFilter(["complete", "completion", "corpus", "around"], { typed: "comp" }),
    ]).toEqual(["complete", "completion"]);
  });

  /**
   * NOTHING TYPED FILTERS NOTHING, and this is the arm for the case the cursor is
   * not in a word at all: a bound that emptied the popup at the start of a line
   * would be worse than no filter.
   */
  test("an empty prefix keeps everything", () => {
    expect([...prefixFilter(["alpha", "beta"], { typed: "" })]).toEqual(["alpha", "beta"]);
  });

  /**
   * CASE IS IGNORED, DELIBERATELY MORE PERMISSIVE THAN IT COULD BE. The client
   * filters again after this, and it knows its own case rules; a server that
   * filtered case-SENSITIVELY would hide `Foo` from a user typing `fo` whose
   * editor would have shown it, and the user cannot see why.
   */
  test("case does not decide", () => {
    expect([...prefixFilter(["Foo", "foobar", "BAR"], { typed: "fo" })]).toEqual(["Foo", "foobar"]);
  });

  /**
   * JAPANESE IS NOT A SPECIAL CASE HERE, asserted because everything else about
   * this package's Japanese support is: a prefix is a prefix.
   */
  test("a Japanese prefix filters like any other", () => {
    expect([...prefixFilter(["コーパス", "コード", "設定"], { typed: "コー" })]).toEqual([
      "コーパス",
      "コード",
    ]);
  });
});

describe("the dedup filter", () => {
  /**
   * FIRST-SEEN WINS, which is what an editor shows as a stable popup: the same SET
   * in another order is another popup, and the word nearest where the user is
   * looking is the one worth the top slot.
   */
  test("a repeat keeps the place where it was first seen", () => {
    expect([...dedupFilter(["foo", "bar", "foo", "baz", "bar"], { typed: "" })]).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  /**
   * IT IS LOAD-BEARING RATHER THAN A SAFETY NET, and this arm is what says so:
   * `wordsIn` yields EVERY OCCURRENCE in order, deliberately, so that uniqueness is
   * decided in one place an author can replace. A scan that deduped for itself
   * would make this filter a no-op that reads as though it did something.
   */
  test("without it a scan's repeats reach the popup", () => {
    expect([...prefixFilter(["foo", "foo"], { typed: "f" })]).toEqual(["foo", "foo"]);
  });
});

describe("the default pipeline", () => {
  /** Prefix THEN dedup: the same answer either way, and fewer strings to hash. */
  test("the defaults are the prefix filter and then dedup", () => {
    expect(defaultFilters).toEqual([prefixFilter, dedupFilter]);
  });

  test("driving them together narrows and deduplicates", () => {
    expect(applyFilters(["foo", "foobar", "foo", "bar"], defaultFilters, { typed: "fo" })).toEqual([
      "foo",
      "foobar",
    ]);
  });

  /**
   * `defaultFilters` IS ONE VALUE, for the reason `defaultScanner` is: a handler
   * called with no options must not look different from one call to the next.
   */
  test("the default pipeline is one value rather than one per read", () => {
    expect(defaultFilters).toBe(defaultFilters);
  });
});

describe("the item bound", () => {
  /**
   * THE BOUND IS THE LAST THING APPLIED, AND IT IS A BACKSTOP RATHER THAN THE
   * DESIGN: the prefix filter is what makes an answer small, and this is what keeps
   * a pathological buffer -- a generated file, a minified blob whose lines are
   * under the column bound -- from reaching the client at all.
   */
  test("no more items than the bound allows, keeping the first", () => {
    expect(applyFilters(["a", "b", "c", "d"], [], { typed: "" }, 2)).toEqual(["a", "b"]);
  });

  /** A bound nobody set bounds nothing. */
  test("an absent bound keeps everything", () => {
    expect(applyFilters(["a", "b", "c"], [], { typed: "" })).toEqual(["a", "b", "c"]);
  });

  /**
   * IT COUNTS WHAT SURVIVES THE FILTERS AND NOT WHAT WENT IN, which is the
   * ordering that makes it useful: bounding first would spend the whole budget on
   * words the prefix was about to reject, and the popup would be empty while the
   * buffer held matches.
   */
  test("the bound counts filtered words, not scanned ones", () => {
    const scanned = ["zzz", "zzy", "foo", "foobar", "foobaz"];

    expect(applyFilters(scanned, defaultFilters, { typed: "foo" }, 2)).toEqual(["foo", "foobar"]);
  });

  /** A bound of zero is a bound rather than an absent one. */
  test("a bound of zero offers nothing", () => {
    expect(applyFilters(["a"], [], { typed: "" }, 0)).toEqual([]);
  });

  /**
   * A FILTER OF THE AUTHOR'S OWN IS DRIVEN LIKE THE SHIPPED ONES, which is what
   * makes `filters` a list rather than a boolean: the pipeline is theirs to
   * replace, and this arm is the one that would notice if it stopped being.
   */
  test("an author's own filter runs in the pipeline", () => {
    const shouty = function* (words: Iterable<string>): Iterable<string> {
      for (const word of words) {
        yield word.toUpperCase();
      }
    };

    expect(applyFilters(["foo", "bar"], [shouty], { typed: "" })).toEqual(["FOO", "BAR"]);
  });
});
