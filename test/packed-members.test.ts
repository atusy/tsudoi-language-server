import { afterAll, expect, test } from "bun:test";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { declaredMembers } from "../scripts/workspaces.ts";
import { packPackage } from "./helpers/install.ts";
import { repoRoot } from "./helpers/spawn.ts";

/**
 * WHAT A WORKSPACE MEMBER ACTUALLY SHIPS, READ OFF ITS TARBALL.
 *
 * WHY THE MANIFEST IS NOT THE SUBJECT, and this file exists because it was: a
 * member's `files` field is an INSTRUCTION, and the tarball is what the
 * instruction produced. The two part company the moment anything writes a file
 * the instruction happens to admit, and a `tsc` that removes nothing writes one
 * every time a source file is renamed or deleted. A test reading `files` reports
 * the intent of an edit nobody made.
 *
 * MEASURED, WHICH IS WHY THIS IS A FILE AND NOT A SCRUPLE: with prepack's clear
 * removed and a `dist/wordnet.d.ts` copied in by hand, the tarball grows the file,
 * the packed declarations carry `declare module "wordnet"`, and `files` toEqual
 * `["dist"]` in the member's own package-shape test STAYS GREEN. That green is
 * what this file was written against.
 *
 * WHAT A SHIPPED AMBIENT DECLARATION COSTS, stated at its measured size rather
 * than at the size it is usually given. `declare module "wordnet"` is a statement
 * about a name in the GLOBAL type space, but tsc reads only the files in the
 * PROGRAM -- so a consumer who installs a package carrying an unreferenced
 * `.d.ts` is told nothing by it. MEASURED both ways in
 * test/published-artifacts.test.ts, which stays green through the leak. The
 * exposure is real and CONDITIONAL: it costs one `types` entry, one triple-slash
 * reference, or one consumer whose `include` reaches the file. So this reads the
 * artifact, and the consumer-side reading over there says what it does and does
 * not discriminate.
 *
 * THE OTHER HALF OF THE ANSWER IS IN THE MANIFEST rather than here: `prepack`
 * clears dist/ before it compiles, so a stray has to appear between the clear and
 * the collection to survive at all. That is the fix; this is what says so when it
 * fails, and the member's package-shape test carries the reason for the clear.
 */

/**
 * Every declared member, packed ONCE for the whole file.
 *
 * A pack per test would run the member's build three times over for one reading,
 * and each run rewrites the dist/ the rest of this repository resolves through.
 */
const packed = await Promise.all(
  declaredMembers(repoRoot).map(async (member) => await packPackage(member)),
);

afterAll(() => {
  for (const one of packed) {
    one.dispose();
  }
});

/**
 * What each member publishes, WRITTEN DOWN, keyed by the name in its manifest.
 *
 * A LIST AND NOT A DERIVATION, which is the whole instrument: an expectation
 * computed from the member's dist/ agrees with a stray sitting in it, and would
 * be green in exactly the state this file exists to redden. It costs an edit
 * whenever the published surface changes on purpose, and that is the price of
 * noticing when it changes by accident.
 *
 * KEYED BY NAME so a member added under packages/ has to be written down here
 * before it can pass -- the pair below is what enforces that, and it is the
 * difference between a claim about members and a claim about one of them.
 */
const publishedFiles: Record<string, readonly string[]> = {
  "@atusy/tsudoi-hover-wordnet": [
    "LICENSE",
    "dist/hover.d.ts",
    "dist/hover.js",
    "dist/index.d.ts",
    "dist/index.js",
    "package.json",
  ],
};

// The pair for the table, and without it the per-member assertions below are a
// claim about whichever members someone remembered. A member with no entry is
// not silently skipped: it fails here, naming itself.
test("every workspace member's published file list is written down", () => {
  expect(packed.length).toBeGreaterThan(0);
  expect(
    packed.map((one) => one.name).filter((name) => publishedFiles[name] === undefined),
  ).toEqual([]);
});

for (const one of packed) {
  test(`${one.name} packs exactly the files this repository says it does`, () => {
    expect(one.entries).toEqual([...(publishedFiles[one.name] ?? ["NOT WRITTEN DOWN"])]);
  });
}

/**
 * NO MEMBER MAY SHIP AN AMBIENT MODULE DECLARATION, over members as a class
 * rather than over the one package that has an ambient declaration to leak.
 *
 * A claim naming packages/hover-wordnet would go quietly narrow at the second
 * member, on the same reasoning the fifth Definition-of-Done check reads
 * `workspaces` rather than a list. The hazard is not this package's: any member
 * that types an untyped dependency writes the same `declare module`, and the day
 * it does, nothing here needs editing.
 */
const ambient = /declare\s+module\s+["']/;

test("no member ships a declaration that names a module in the global type space", () => {
  const offenders: string[] = [];
  let read = 0;
  for (const one of packed) {
    for (const entry of one.entries) {
      const path = join(one.dir, entry);
      if (!statSync(path).isFile()) {
        continue;
      }
      read += 1;
      if (ambient.test(readFileSync(path, "utf8"))) {
        offenders.push(`${one.name}: ${entry}`);
      }
    }
  }

  // NAMED rather than counted, so a violating file appears in the failure text.
  expect(offenders).toEqual([]);
  // The pair for the absence: an empty tarball, or a reader that opened nothing,
  // satisfies the line above on every repository ever written.
  expect(read).toBeGreaterThan(0);
});

/**
 * THE INSTRUMENT, PROVED ON THE FILE IT IS LOOKING FOR.
 *
 * The absence above is worth nothing unless this pattern finds the statement
 * when it IS there, and the one place it is there is the unshipped source
 * declaration the whole arrangement exists to keep unshipped. So the negative
 * result names its instrument rather than asserting that nothing was found by
 * something nobody checked.
 */
test("the pattern that found nothing in the tarballs finds the declaration in source", () => {
  const source = readFileSync(
    join(repoRoot, "packages", "hover-wordnet", "src", "wordnet.d.ts"),
    "utf8",
  );

  expect(ambient.test(source)).toBe(true);
});
