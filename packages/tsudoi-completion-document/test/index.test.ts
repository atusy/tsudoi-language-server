import { expect, test } from "bun:test";
import * as surface from "../src/index.ts";

/**
 * WHAT THE README TELLS A STRANGER TO IMPORT, AND IT IS HERE BECAUSE NOTHING ELSE
 * ASKED.
 *
 * MEASURED, WHICH IS WHY THIS FILE EXISTS: with `export { completeCorpus }`
 * deleted from src/index.ts and everything rebuilt, the whole suite read 1173
 * pass / 0 fail. The handler was unreachable by the bare specifier its own README
 * instructs -- `has no exported member` in a stranger's editor -- and every check
 * this repository owns was green. The arms in test/corpus.test.ts cannot see it:
 * they import the handler by RELATIVE PATH, which is the route no consumer takes.
 *
 * WHAT THIS DOES NOT COVER, SAID PLAINLY BECAUSE IT IS THE LARGER HALF: this
 * imports src/index.ts, so it grades THE DECISION and not THE ARTIFACT. A name
 * that survives here and is lost between `tsc` and the tarball is invisible to it,
 * and so is one lost from the `exports` map. Grading the published route is
 * PBI-99, which is drafted over exactly this hole and not yet refined -- this arm
 * is deliberately narrower than that item rather than a substitute for it.
 *
 * A LIST AND NOT A SHAPE CHECK. `expect(Object.keys(surface))` would pin the
 * surface closed, and a package that grows a handler would then redden here for
 * having grown -- so what is asserted is that each name a document promises is
 * PRESENT, and a surplus export is the published-surface question `exports` and
 * src/index.ts's own docblock answer.
 */
test("every value the README tells a reader to import is exported by name", () => {
  const promised = [
    "applyFilters",
    "completeAround",
    "completeCorpus",
    "defaultFilters",
    "defaultScanner",
    "defaultWordPattern",
    "prefixFilter",
    "regexScanner",
    "segmentScanner",
    "typedWord",
    "wordsIn",
    "windowAround",
  ];

  expect(promised.filter((name) => !(name in surface))).toEqual([]);
  // THE PAIR, and without it the line above is satisfied by an empty list of
  // promises read out of nothing.
  expect(promised.length).toBeGreaterThan(0);
});

/**
 * THE TWO HANDLERS ARE CALLABLE AND NOT MERELY PRESENT, which the arm above
 * cannot say: a name re-exported as a type, or as an object that happens to carry
 * it, satisfies `in`.
 */
test("both handlers are functions", () => {
  expect(typeof surface.completeAround).toBe("function");
  expect(typeof surface.completeCorpus).toBe("function");
});
