import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * EVERY RUNTIME VERSION THIS TREE CITES, IN ONE PLACE.
 *
 * NOTHING HERE DECLARES A RUNTIME VERSION -- no `engines`, no `.tool-versions`,
 * no `deno.json`. So a check comparing a cited version against the machine has
 * NO SECOND SIDE that belongs to this repository, and its red would be a
 * property of whoever's laptop ran it. The compiler is the contrast and the
 * reason the asymmetry is real: `tsc --version` IS compared, at
 * test/package-shape.test.ts, because the root manifest declares the version it
 * is checked against.
 *
 * SO THE SUBJECT IS COMPLETENESS OF DISCLOSURE, NOT TRUTH. IT NEVER REDDENS WHEN
 * THE MACHINE CHANGES, which is the whole discriminator between it and the
 * comparison this project refused. It reddens when the PROSE moves: a citation
 * added, deleted, or rewritten to another version. The last of those is wanted
 * rather than tolerated -- overwriting a recorded reading with today's runtime
 * manufactures a reading nobody took, and that edit is now loud.
 *
 * AND IT CAN NEVER SAY A CITATION IS TRUE. A version beside a false sentence is
 * accounted for here exactly as a true one is. Read as coverage, this becomes
 * the disclosed-versus-covered confusion the item it comes from is about.
 *
 * NO CITATION CARRIES A LABEL, AND THAT IS A MEASURED REFUSAL RATHER THAN A
 * SIMPLIFICATION. The two repairs are real and different -- a reading STAMPED
 * with a version is re-taken and recorded afresh, a claim ABOUT a release is
 * widened by re-running on another -- but sorting the sites into them was tried
 * and the boundary would not hold: bunfig.toml's `setDefaultTimeout` reading and
 * wordnet.d.ts's 127ms are the same shape, and either label survives an argument
 * for both. A label nothing asserts, over a boundary nobody can state, is prose
 * with a type annotation on it.
 *
 * scrum.ts IS OUT OF SUBJECT BY RULING RATHER THAN BY OVERSIGHT: a dated sprint
 * note citing the runtime of its day is correct by construction, and rewriting
 * one edits a result.
 */
// `[\s*]+` rather than `\s+` because this tree wraps prose inside JSDoc, and a
// citation split as `bun\n * 1.3.13` is the shape it actually writes --
// test/readme-coverage.test.ts carries one, which a `\s+` reader did not see.
//
// `.json` IS IN because package.json cannot carry comments, so this repository
// puts its reasons in `//name`-style keys, and two of them cite a runtime.
//
// THE WORD `version` IS ALLOWED BETWEEN THE TWO because English writes it there.
// The second review stage planted a runtime name, that word and a number in a
// tracked README, and the arm stayed green. WHAT IS STILL MISSED IS ANY OTHER
// WORD IN THAT GAP: this reads a shape, not every sentence a person could write.
// (Spelled without an example, for the reason the entry list is split in two.)
const CITATION = /(bun|deno)[\s*]+(?:v|version[\s*]+)?(\d+\.\d+\.\d+)/gi;

/**
 * THE RUNTIME AND THE VERSION ARE SEPARATE FIELDS BECAUSE THE SCAN READS THIS
 * FILE TOO. Spelled as one string, every entry below would be a citation this
 * file makes, and the list would be its own subject. A quote and a comma between
 * the two fields match nothing; a space between them matches itself, which is
 * how the sentence that first explained this reddened the arm.
 */
const accounted: ReadonlyArray<readonly [path: string, runtime: string, version: string]> = [
  ["README.md", "deno", "2.9.2"],
  ["bunfig.toml", "bun", "1.3.13"],
  ["bunfig.toml", "bun", "1.3.13"],
  ["package.json", "bun", "1.3.13"],
  ["packages/tsudoi-completion-path/test/package-shape.test.ts", "bun", "1.3.13"],
  ["packages/tsudoi-completion-path/test/package-shape.test.ts", "bun", "1.3.13"],
  ["packages/tsudoi-hover-wordnet/src/hover.ts", "bun", "1.3.13"],
  ["packages/tsudoi-hover-wordnet/src/hover.ts", "deno", "2.9.2"],
  ["packages/tsudoi-hover-wordnet/src/wordnet.d.ts", "bun", "1.3.13"],
  ["packages/tsudoi-hover-wordnet/src/wordnet.d.ts", "deno", "2.9.2"],
  ["packages/tsudoi-hover-wordnet/test/package-shape.test.ts", "bun", "1.3.13"],
  ["packages/tsudoi-hover-wordnet/test/package-shape.test.ts", "bun", "1.3.13"],
  ["packages/tsudoi-language-server/package.json", "bun", "1.3.13"],
  ["test/code-action.test.ts", "bun", "1.3.13"],
  ["test/helpers/deadline.ts", "bun", "1.3.13"],
  ["test/helpers/deadline.ts", "bun", "1.3.13"],
  ["test/helpers/lsp.ts", "bun", "1.3.13"],
  ["test/helpers/perturbation.ts", "bun", "1.3.13"],
  ["test/helpers/spawn.ts", "bun", "1.3.13"],
  ["test/installed-runtime.test.ts", "deno", "2.8.3"],
  ["test/readme-coverage.test.ts", "bun", "1.3.13"],
  ["test/resolution.test.ts", "bun", "1.3.13"],
  ["test/resolution.test.ts", "deno", "2.8.3"],
  ["test/resolution.test.ts", "deno", "2.8.3"],
  ["test/resolution.test.ts", "DENO", "2.9.2"],
  ["test/resolution.test.ts", "deno", "2.8.3"],
  ["test/stale-framework-artifact.test.ts", "bun", "1.3.13"],
  ["test/uncovered-files.test.ts", "bun", "1.3.13"],
];

function citations(): string[] {
  // The index rather than a walk: a scratch file a person dropped in is not a
  // claim this repository makes, and NUL separators because git quotes a path
  // with odd characters and a quoted path matches no file.
  const tracked = execFileSync("git", ["-C", repoRoot, "ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((path: string) => /\.(ts|md|toml|json)$/.test(path) && path !== "scrum.ts");
  const found: string[] = [];
  for (const path of tracked) {
    const text = readFileSync(join(repoRoot, path), "utf8");
    for (const match of text.matchAll(CITATION)) {
      found.push(`${path}\t${match[1]} ${match[2]}`);
    }
  }
  return found.sort();
}

test("every runtime version this tree cites is accounted for, and every account is cited", () => {
  const cited = citations();
  // A scan that went blind alone reddens below. What this refuses is the state
  // where the list is emptied to match it -- measured green without this line.
  expect(cited.length).toBeGreaterThan(0);

  expect(cited).toEqual(
    accounted.map(([path, runtime, version]) => `${path}\t${runtime} ${version}`).sort(),
  );
});
