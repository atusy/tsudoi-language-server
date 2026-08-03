import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE TIMING INSTRUMENT'S COPY OF THE GATE IS THE SHIPPED GATE, CHARACTER FOR
 * CHARACTER -- WHICH NOTHING ELSE ASKS.
 *
 * WHY THE COPY EXISTS AT ALL, so nobody deletes it instead: two of the three
 * shapes that instrument times do not exist in the package -- one is the shape
 * it replaced, one is the shape it never took -- so the gate they are timed
 * under has to be written somewhere, and writing them against an imported third
 * would time two spellings of one gate against each other.
 *
 * WHY THE COPY NEEDS A PIN, AND IT IS THE CIRCULARITY RATHER THAN THE
 * DUPLICATION: that instrument does guard its rows -- every timed call asserts
 * the total it counted and the twenty it rendered -- but it asserts them against
 * a rendering ITS OWN COMPARATOR computed. So the guard binds the three shapes
 * to ONE answer and never to the PACKAGE'S. MEASURED, with the hidden-group
 * branch dropped from the instrument's copy alone: it exits 0 and prints a
 * complete, publishable reading whose rendered names are dotfiles FIRST -- the
 * inverse of what this package renders -- because the answer it checked against
 * moved with the shape it was checking.
 *
 * WHY THE BINDING IS TEXTUAL AND NOT AN IMPORT. Importing the package's source
 * from a root script is foreclosed: the root tsconfig EXCLUDES `packages/`
 * precisely so the root check cannot green-light a member, and an import there
 * would drag a member's source into it. The instrument's own docstring already
 * conceded that it cannot catch the package's gate changing while the copy does
 * not; a concession is not a control, and this file is the control.
 *
 * WHAT THIS CANNOT CHECK, said rather than left to be discovered. It pins BYTES,
 * not behaviour: two files reading identically is what it decides, and it says
 * nothing about whether either is right. It says nothing about the two shapes
 * the package does not have -- which are the copy's whole reason for existing --
 * and nothing about the instrument's numbers, which no check in this repository
 * re-takes. And it is silent about a gate that moves in BOTH files at once,
 * which is what a maintainer editing them together should do.
 */
const instrument = "scripts/listing-shapes.ts";
const shipped = "packages/tsudoi-completion-path/src/resolve.ts";

/**
 * WHAT IS PINNED, EACH SPELLED AS THE WHOLE OF ITS DECLARATION. The two
 * functions are the order and the retention that decide a row; the constant is
 * pinned with them because the functions READ it, so a bound that moved in one
 * file alone would leave two identical functions timing two different gates.
 *
 * The docstrings above them are deliberately NOT pinned: they answer different
 * questions in the two files -- one explains a shipped decision, the other
 * explains a copy -- and a pin over them would be a pin against saying so.
 */
const pinned = [
  "const entriesShown = 20;",
  "function retain(names: string[], name: string): void {",
  "function byGroupThenName(left: string, right: string): number {",
];

/**
 * A declaration as it reads in one file: from its first character to the closing
 * brace at column 0, or to the end of the line for a one-liner.
 *
 * THE OCCURRENCE COUNT IS ASSERTED AND NOT ASSUMED, for the reason the
 * perturbation stager gives about its own `from`: a signature that stopped
 * matching would make this file compare nothing to nothing and report a pass.
 */
function declarationIn(source: string, file: string, signature: string): string {
  const occurrences = source.split(signature).length - 1;
  expect(`${file} spells this declaration ${String(occurrences)} time(s)`).toBe(
    `${file} spells this declaration 1 time(s)`,
  );
  const from = source.indexOf(signature);
  const to = signature.endsWith("{")
    ? source.indexOf("\n}\n", from) + 2
    : source.indexOf("\n", from);
  expect(to).toBeGreaterThan(from);
  return source.slice(from, to);
}

test("the timing instrument's copy of the gate reads exactly as the shipped gate", () => {
  const copy = readFileSync(join(repoRoot, instrument), "utf8");
  const original = readFileSync(join(repoRoot, shipped), "utf8");
  for (const signature of pinned) {
    expect(declarationIn(copy, instrument, signature)).toBe(
      declarationIn(original, shipped, signature),
    );
  }
});
