import { describe, expect, test } from "bun:test";
import { pathFragments } from "../examples/path-completion.ts";

// WHAT THIS FILE DRIVES: examples/path-completion.ts itself, the artifact a
// config author reads, with no fixture copy of it in existence. The rule is
// Sprint 5's, and it is why the assertions below import the example directly
// rather than a duplicate that would drift away from it.
describe("path fragments", () => {
  // The candidates are shortest-first: a fragment widens across a space ONLY
  // when the narrower one names nothing, which is a property of
  // pathCompletion, not of this function. Here only the LIST is asserted.
  test("the fragment under the cursor carries its directory part and its filter", () => {
    expect(pathFragments("foo/ba", 6)).toEqual([
      { text: "foo/ba", start: 0, directory: "foo/", name: "ba" },
    ]);
    expect(pathFragments("/usr/lo", 7)).toEqual([
      { text: "/usr/lo", start: 0, directory: "/usr/", name: "lo" },
    ]);
  });

  // A lone "/" is a fragment with an EMPTY filter, not an absent fragment:
  // typing it is what asks for the filesystem root's children.
  test("a trailing separator is a directory part with an empty filter", () => {
    expect(pathFragments("/", 1)).toEqual([{ text: "/", start: 0, directory: "/", name: "" }]);
  });

  // ABSENCE, with its permanent pair one test above and one below: the same
  // function observes a fragment when there is one, so `no candidates` is
  // evidence rather than a measurement that never measures anything.
  test("a cursor with no path characters before it yields no fragment at all", () => {
    expect(pathFragments("", 0)).toEqual([]);
    expect(pathFragments("こんにちは", 0)).toEqual([]);
    // Immediately after whitespace: everything to the left belongs to another
    // word, and an EMPTY fragment would list every entry of every root.
    expect(pathFragments("see ", 4)).toEqual([]);
  });

  // The spaced-filename case, at the extraction layer: `foo (1).png` must be
  // REACHABLE as a candidate, which a whitespace split forecloses. Which
  // candidate wins is decided against the filesystem, not here.
  test("a word boundary to the left of a space is a candidate, so a spaced filename is reachable", () => {
    expect(pathFragments("see foo (1).png", 13)).toEqual([
      { text: "(1).p", start: 8, directory: "", name: "(1).p" },
      { text: "foo (1).p", start: 4, directory: "", name: "foo (1).p" },
      { text: "see foo (1).p", start: 0, directory: "", name: "see foo (1).p" },
    ]);
  });
});
