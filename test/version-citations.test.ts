import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * WHICH VERSION-WARRANTED CLAIMS THIS TREE CANNOT SEE AGE, IN ONE PLACE.
 *
 * NOTHING HERE DECLARES A RUNTIME VERSION -- no `engines`, no `.tool-versions`,
 * no `deno.json`. So a check comparing a cited version against the machine has
 * NO SECOND SIDE that belongs to this repository, and its red would be a
 * property of whoever's laptop ran it. The compiler is the contrast and the
 * reason the asymmetry is real: `tsc --version` IS compared, at
 * test/package-shape.test.ts, because the root manifest declares the version it
 * is checked against.
 *
 * SO THE SUBJECT IS COMPLETENESS OF DISCLOSURE, NOT TRUTH. This reddens when a
 * new runtime citation is added and not accounted for. IT NEVER REDDENS WHEN THE
 * MACHINE CHANGES, which is the whole discriminator between it and the
 * comparison this project refused.
 *
 * AND IT CAN NEVER SAY A CITATION IS TRUE. `bun 1.3.13` beside a false sentence
 * is accounted for here exactly as a true one is. Read as coverage, this becomes
 * the disclosed-versus-covered confusion the item it comes from is about.
 *
 * scrum.ts IS OUT OF SUBJECT BY RULING RATHER THAN BY OVERSIGHT: a dated sprint
 * note citing the runtime of its day is correct by construction, and rewriting
 * one edits a result.
 */
const CITATION = /(bun|deno)\s+v?\d+\.\d+\.\d+/gi;

/**
 * What a citation is FOR, which is what decides whether it may be widened.
 *
 * PROVENANCE records WHEN a reading was taken and cannot go stale -- rewriting
 * one to today's runtime manufactures a reading nobody took. WARRANT carries the
 * claim: the sentence is about that release, so it is widened only by re-running
 * the arm on another and saying so.
 */
const accounted = new Map<string, "provenance" | "warrant">([
  ["README.md", "provenance"],
  ["bunfig.toml", "provenance"],
  ["packages/tsudoi-completion-path/test/package-shape.test.ts", "provenance"],
  ["packages/tsudoi-hover-wordnet/src/hover.ts", "provenance"],
  ["packages/tsudoi-hover-wordnet/src/wordnet.d.ts", "provenance"],
  ["packages/tsudoi-hover-wordnet/test/package-shape.test.ts", "provenance"],
  ["test/helpers/deadline.ts", "provenance"],
  ["test/helpers/lsp.ts", "provenance"],
  ["test/helpers/spawn.ts", "provenance"],
  ["test/installed-runtime.test.ts", "warrant"],
  ["test/resolution.test.ts", "warrant"],
  ["test/stale-framework-artifact.test.ts", "provenance"],
  ["test/uncovered-files.test.ts", "provenance"],
]);

function citingFiles(): string[] {
  // The index rather than a walk: a scratch file a person dropped in is not a
  // claim this repository makes, and NUL separators because git quotes a path
  // with odd characters and a quoted path matches no file.
  const tracked = execFileSync("git", ["-C", repoRoot, "ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((path: string) => /\.(ts|md|toml)$/.test(path) && path !== "scrum.ts");
  return tracked
    .filter((path: string) => {
      CITATION.lastIndex = 0;
      return CITATION.test(readFileSync(join(repoRoot, path), "utf8"));
    })
    .sort();
}

test("every file citing a runtime version is accounted for, and every account has a file", () => {
  const citing = citingFiles();
  // The pair: an empty scan and a scan that read nothing are the same
  // observation without it, and this file's whole subject is a set.
  expect(citing.length).toBeGreaterThan(0);

  expect(citing.filter((path: string) => !accounted.has(path))).toEqual([]);
  expect([...accounted.keys()].filter((path: string) => !citing.includes(path)).sort()).toEqual([]);
});
