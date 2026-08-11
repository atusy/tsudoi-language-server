import { describe, expect, test } from "bun:test";
import { applyFilters, defaultFilters, prefixFilter } from "../src/filters.ts";

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

describe("deduplication, which is not a filter", () => {
  /**
   * IT HAPPENS WITH NO FILTERS AT ALL, which is the whole of the stakeholder's
   * ruling made checkable: a popup with one word in it twice is not a behaviour
   * anybody would choose, so it is not one to opt into. A `dedupFilter` was written
   * and thrown away, and this arm is what a reader gets instead of it.
   */
  test("an empty pipeline still offers each word once", () => {
    expect(applyFilters(["foo", "bar", "foo", "baz", "bar"], [], { typed: "" })).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  /**
   * AND IT HAPPENS AFTER THE AUTHOR'S FILTERS, WHICH IS THE ARM THE ORDER TURNS ON:
   * a stage that REWRITES words can make two of them equal, and dedup running first
   * would let that pair through. Lower-casing is the realistic instance.
   */
  test("a filter that rewrites words cannot smuggle a duplicate past it", () => {
    const lower = function* (words: Iterable<string>): Iterable<string> {
      for (const word of words) {
        yield word.toLowerCase();
      }
    };

    expect(applyFilters(["Foo", "foo"], [lower], { typed: "" })).toEqual(["foo"]);
  });

  /**
   * THE OTHER HALF OF THAT ORDER: a filter still SEES the repeats `wordsIn` yields,
   * so one weighting a popup by frequency has the counts to weight it by.
   * Deduplicating first would take that away from every stage before any ran.
   */
  test("a filter sees the repeats, and only the answer is deduplicated", () => {
    const counted: string[] = [];
    const spy = function* (words: Iterable<string>): Iterable<string> {
      for (const word of words) {
        counted.push(word);
        yield word;
      }
    };

    expect(applyFilters(["foo", "foo", "bar"], [spy], { typed: "" })).toEqual(["foo", "bar"]);
    expect(counted).toEqual(["foo", "foo", "bar"]);
  });

  /** FIRST-SEEN AND NOT LAST-SEEN: the same set in another order is another popup. */
  test("the surviving occurrence is the first one", () => {
    expect(applyFilters(["b", "a", "b"], [], { typed: "" })).toEqual(["b", "a"]);
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

  /**
   * AND IT COUNTS DISTINCT WORDS, because the bound is applied after the dedup:
   * spending it on repeats would offer a user two candidates where they had asked
   * for two and could have had two DIFFERENT ones.
   */
  test("the bound counts distinct words rather than occurrences", () => {
    expect(applyFilters(["foo", "foo", "bar"], [], { typed: "" }, 2)).toEqual(["foo", "bar"]);
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
