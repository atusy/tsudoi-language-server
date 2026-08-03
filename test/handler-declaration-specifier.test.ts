import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { handlerMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * THE ONE STRUCTURAL FACT A RETIREMENT RESTS ON, AND NOTHING SAID SO UNTIL THIS
 * FILE.
 *
 * WHAT WAS RETIRED. This repository carried, at three sites in
 * scripts/workspaces.ts, the reading that a handler built while the framework's
 * artifact is absent has its declarations `graded against a file no consumer
 * receives`. True of WHICH FILE ANSWERED, and it implied a harm that is not
 * there: the emitted declarations are the same either way. That reading, its
 * conditions and what it cannot separate are at `prepareWorkspace` in
 * scripts/workspaces.ts, and are deliberately not re-derived here.
 *
 * WHY THAT CONCLUSION NEEDS AN ARM AT ALL. It is not a property of the compiler
 * being generous, and a reader who takes it as one will keep it after it stops
 * holding. It holds because A HANDLER'S EMITTED DECLARATION NAMES THE FRAMEWORK
 * BY SPECIFIER AND NEVER BY STRUCTURE -- `import type { MethodHandler } from
 * "@atusy/tsudoi-language-server/types"` travels into the artifact verbatim -- so
 * which file answered the specifier CANNOT APPEAR in what is emitted while both
 * files declare the same names. The indirection is the whole of it.
 *
 * WHAT WOULD REDDEN THIS, NAMED SO THE ARM IS NOT READ AS WIDER THAN IT IS:
 * declaration bundling, or any post-build transform that INLINES the framework's
 * types into a handler's declarations rather than leaving the import standing.
 * The day either lands, the conclusion above stops holding, and this is the arm
 * whose SUBJECT that is.
 *
 * `AND NOTHING ELSE WOULD SAY SO` STOOD HERE FOR A COMMIT AND WAS WITHDRAWN AS A
 * COVERAGE CLAIM NOBODY HAD READ. THE READING HAS SINCE BEEN TAKEN AND BOTH ITS
 * HALVES ARE FALSE, which is stronger than the withdrawal and is why the
 * withdrawal is not what stands here now. OTHERS DO SAY SO. MEASURED at base
 * 488787c on bun test v1.3.13, full suite from the repository root, with BOTH
 * handlers' `prepack` extended to rewrite the specifier out of every emitted
 * declaration: 933 pass / 5 fail across 67 files, and TWO of the five are
 * independent readings of the EMITTED ARTIFACT. `no member ships a module naming
 * a directory-qualified repository file its reader does not have` in
 * test/packed-members.test.ts finds the relative path in the tarball. `the root
 * type check resolves the published subpaths through the exports map, to the
 * built artifact` in test/package-shape.test.ts reddens because
 * `@atusy/tsudoi-language-server/deps/protocol` is then named by nothing in the
 * root program and answers with an EMPTY set -- a witness rather than a
 * diagnosis, since its message sends a reader to the exports map and not to
 * whatever rewrote a declaration.
 *
 * TWO OF THE FIVE ARE DISQUALIFIED AS WITNESSES, AND SAYING SO IS WORTH AS MUCH
 * AS THE LIST: both `packing this package builds it first, into a cleared
 * directory` arms fire on the EDITED `scripts.prepack` STRING in a member's
 * manifest, so they would fire for a perturbation that changed no declaration at
 * all. The fifth is this arm.
 *
 * AND THOSE FIVE BELONG TO THEIR SPELLING, which is this file's own rule below
 * applied to itself. The rewrite measured put
 * `"../../tsudoi-language-server/dist/<subpath>.d.ts"` where the specifier had
 * been: path-shaped, so the tarball reading finds it. WHAT IS MEASURED IS THAT
 * THE TWO `to their real types rather than any` ARMS IN
 * test/published-artifacts.test.ts STAYED GREEN under it. WHY THEY DID IS
 * OFFERED AS AN INFERENCE AND LABELLED ONE: `../../` out of a scoped package's
 * dist/ lands on its scoped sibling, and test/helpers/install.ts installs both
 * tarballs into one node_modules with the framework at
 * @atusy/tsudoi-language-server -- so the rewritten target should still reach the
 * framework's real declarations. NOT OBSERVED: no resolution trace was taken
 * inside that consumer. Either way a spelling whose target resolved to nothing
 * would redden those arms too, for a reason about the probe rather than about
 * this one.
 *
 * AND ITS BOUND, WHICH IS WHOLESALE RATHER THAN PER FILE: it asks each handler
 * for ONE emitted declaration naming the framework, so a single file inlined
 * while a sibling keeps its import leaves this green. The offender-list spelling
 * that would close that -- no emitted declaration LACKS the specifier -- is
 * unavailable and would be red today: each handler's `index.d.ts` re-exports its
 * own modules and names the framework nowhere, correctly.
 *
 * TWO CHEAPER-LOOKING SUBJECTS ARE REFUSED, EACH FOR ITS OWN REASON, because
 * both are the obvious next edit to this file. An arm COMPARING THE TWO BUILDS'
 * OUTPUTS pays a second build per run to re-derive what the `bun test` preload
 * already forces. An arm asserting that the framework's src/ and dist/ AGREE is
 * structurally green under that same preload, and can only redden in a state
 * where the build already failed loudly. Both are the check whose cost
 * re-derives a guarantee.
 *
 * NO SECOND BUILD HAPPENS HERE, AND THAT IS THE HALF OF THE OLD SENTENCE THAT
 * SURVIVED BEING MEASURED: this file spawns nothing and compiles nothing, it
 * opens files. WHAT STOOD BESIDE IT WAS PROVENANCE AND WAS FALSE -- `this reads
 * the artifact test/helpers/build.ts already wrote before any test file loaded`.
 * IT READS THE ARTIFACT AS THE RUN LAST LEFT IT, and under a full `bun test` a
 * PACK left it. The one that cannot be got behind is the TOP-LEVEL AWAIT in
 * test/packed-members.test.ts: `packPackage` per handler, resolved AT MODULE
 * LOAD, running `bun pm pack` with cwd set to the REAL member, whose `prepack`
 * opens `rm -rf dist`. Both handlers' dist/ is deleted and recompiled before any
 * test body runs, so the preload's output is already gone by the time anything
 * here opens a file. IT IS NOT THE ONLY REBUILDER AND THAT DOES NOT WEAKEN THE
 * POINT: each member's README carries its own `bun pm pack`, and
 * test/readme.test.ts executes every README command -- so which pack this reads
 * depends on order, and every candidate is a PACK rather than the preload.
 *
 * SO THE COVERAGE IS NARROWER THAN THE TRANSFORM NAMED ABOVE, AND THE LINE IS
 * WHICH BUILD WROTE THE FILE. A transform living in a HANDLER'S OWN `prepack`
 * travels into what this reads and IS CAUGHT. A transform in the SHARED BUILD
 * PATH -- `prepareWorkspace` in scripts/workspaces.ts, which is what the preload
 * runs -- is ERASED by that pack before this looks, and this arm goes green over
 * the very thing it is the subject of. MEASURED IN BOTH DIRECTIONS at the base
 * and version above, one rewrite moved between the two sites: from a handler's
 * `prepack`, 933 pass / 5 fail with this arm among them, naming BOTH handlers on
 * the `silent` list, and the checkout's dist/ left carrying the relative path.
 * From `prepareWorkspace`, 938 pass / 0 fail -- NOTHING fires, this arm
 * included -- and the same dist/ is left carrying the SPECIFIER, which is the
 * pack having rebuilt over the preload's output rather than an inference about
 * it.
 *
 * THE RESIDUE IS NAMED AND NOT CLOSED. Closing it takes a second build, or a
 * detector for whether a rebuild happened between the preload and this read; the
 * first is refused in the paragraph above, and the second buys a fact about the
 * suite's own machinery rather than about a handler's declarations.
 *
 * AND IT WAS BELIEVED ON DEGENERATES RATHER THAN ON ITS OWN GREEN. MEASURED in
 * sprint 62 on bun test v1.3.13, AT BASE 0ddae74 AND RUN ALONE -- the base is
 * named because `this file as it stands` was written here first and the file's
 * executable code moved twice afterwards, so the phrase pinned nothing a reader
 * could return to. Unperturbed it reads 3 pass / 0 fail.
 *
 * EACH NUMBER BELONGS TO ITS SPELLING AND NOT TO ITS DESCRIPTION, which a
 * re-take at this base demonstrated rather than argued: the same three
 * degenerates spelled WIDER -- the shared reader disabled outright instead of
 * the two checkout-facing readings redirected, and every read answered empty
 * instead of one staged file -- give 0 pass / 3 fail and 1 pass / 2 fail, since
 * the wider spelling also reaches the last arm. Only the third reproduced
 * identically. So a spelling is part of a degenerate's record here, not
 * decoration on it. With the two readings of this checkout
 * pointed at an EMPTY DIRECTORY: 1 pass / 2 fail, both naming both handlers.
 * Pointed at a directory holding one ZERO-BYTE `.d.ts`: 2 pass / 1 fail, the
 * subject alone, which is the discrimination the second arm claims. With
 * `handlerMembers` returning nothing: 2 pass / 1 fail, the subject alone again,
 * and there it is its PAIR that fires while the second arm goes green over an
 * enumeration that found no handler at all -- which is why that pair is where it
 * is. THE SURVIVING PASS IN ALL THREE IS THE LAST ARM, which builds its own
 * directories and is not aimed at this checkout; that is the point of it.
 */

/** The framework's published name, which is the whole of what travels. */
const PUBLISHED_NAME = "@atusy/tsudoi-language-server";

/**
 * The directories a handler's own `exports` map promises declarations in, which
 * is what a consumer's compiler enters through.
 *
 * READ OFF THE MAP RATHER THAN SPELLED `dist`, so a member that moved its output
 * is followed rather than reported silent -- and the two failures a hardcoded
 * name would merge are exactly the two this file exists to keep apart.
 */
function declarationDirectories(member: string): string[] {
  const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
    exports?: unknown;
  };
  const directories = new Set<string>();
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== "object") {
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "types" && typeof value === "string") {
        directories.add(join(member, dirname(value)));
      } else {
        visit(value);
      }
    }
  };
  visit(manifest.exports);
  return [...directories];
}

/**
 * What a handler emitted and which of it names the framework.
 *
 * THE DIRECTORY IS TAKEN AS AN ARGUMENT rather than derived inside, because the
 * degenerate readings this file was believed on point it somewhere else, and a
 * reader that could only ever be aimed at this checkout could not be aimed at an
 * empty one.
 */
function frameworkReferences(directories: readonly string[]): {
  read: string[];
  naming: string[];
} {
  const read: string[] = [];
  const naming: string[] = [];
  for (const directory of directories) {
    if (!existsSync(directory)) {
      continue;
    }
    for (const entry of readdirSync(directory, { recursive: true })) {
      const path = join(directory, String(entry));
      if (!path.endsWith(".d.ts")) {
        continue;
      }
      read.push(relative(repoRoot, path));
      if (readFileSync(path, "utf8").includes(PUBLISHED_NAME)) {
        naming.push(relative(repoRoot, path));
      }
    }
  }
  return { read, naming };
}

/**
 * THE SUBJECT, AND IT IS THE INDIRECTION RATHER THAN THE AGREEMENT.
 *
 * THE PAIR THAT IS DETECTION IS THE ENUMERATION AND NOT THE FILE LIST: an
 * enumerator that returned nothing would satisfy an empty offender list for a
 * reason that has nothing to do with any handler, which is why it is asserted
 * first and here rather than left to the sibling below.
 */
test("every handler's emitted declarations still name the framework by specifier", () => {
  expect(handlerMembers(repoRoot).length).toBeGreaterThan(0);

  const silent = handlerMembers(repoRoot).filter(
    (member) => frameworkReferences(declarationDirectories(member)).naming.length === 0,
  );

  expect(silent.map((member) => relative(repoRoot, member))).toEqual([]);
});

/**
 * THE SECOND PAIR IS DIAGNOSIS AND NOT DETECTION, WHICH IS WEAKER THAN IT LOOKS
 * AND IS WHAT IS TRUE. An artifact nobody opened makes the arm above red on its
 * own -- a handler with no declarations names the framework in none of them --
 * so this does not close a hole in it. The empty-directory reading in the header
 * is where that is measured -- the arm above reddens there and this reddens
 * beside it, rather than instead of it.
 *
 * WHAT IT BUYS IS THE READER'S NEXT MOVE, and sending them to the wrong one
 * costs a search: `opened nothing` sends them to the build, `opened and named the
 * framework nowhere` sends them to whatever now rewrites a declaration's imports.
 *
 * PER MEMBER AND NOT OVER THE HEAP, because a heap that is non-empty because ONE
 * handler emitted is the same shape as a green counting almost nothing.
 */
test("the same read opens declarations in every handler, so a silent artifact is not an unread one", () => {
  const unread = handlerMembers(repoRoot).filter(
    (member) => frameworkReferences(declarationDirectories(member)).read.length === 0,
  );

  expect(unread.map((member) => relative(repoRoot, member))).toEqual([]);
});

/**
 * THE DISCRIMINATION THE TWO ARMS ABOVE CLAIM, ASSERTED RATHER THAN LEFT AS THE
 * PROSE READING IN THE HEADER. This dashboard's rule is that a perturbation
 * relied on later is written as something the suite RE-RUNS, or as an assertion
 * beside the arm whose behaviour it reads -- and this reader is cheap enough
 * that the second is available: no build, no spawn, three directories written
 * where temporary files go.
 *
 * THE YES-WITNESS IS HALF OF IT: a reader that never reports a reference would
 * satisfy both offender lists above for ever, and only a directory whose
 * declaration DOES carry the specifier tells that apart from the property they
 * are named for.
 */
test("the reader tells an unread directory, a silent declaration and a naming one apart", () => {
  const stage = mkdtempSync(join(tmpdir(), "tsudoi-declarations-"));
  // THE REFUSAL SITS BEFORE THE `try` AND NOT IN THE `finally`: a throw from a
  // finally block overwrites whatever the arm was already saying, which is a
  // failure that reports the cleanup and hides the test. A recursive delete whose
  // path could ever come from elsewhere is the hazard this repository has already
  // paid for once, so the check is kept even over this function's own mkdtemp.
  if (!stage.startsWith(tmpdir())) {
    throw new Error(`refusing to remove ${stage}, which is not under ${tmpdir()}`);
  }
  try {
    const silent = join(stage, "silent");
    const naming = join(stage, "naming");
    mkdirSync(silent);
    mkdirSync(naming);
    writeFileSync(join(silent, "index.d.ts"), "");
    writeFileSync(
      join(naming, "index.d.ts"),
      `import type { X } from "${PUBLISHED_NAME}/types";\n`,
    );

    // NEVER WRITTEN, so `absent` and `empty` are separated too: the first is
    // what an unbuilt member looks like, the second what a cleared one does.
    const missing = frameworkReferences([join(stage, "unbuilt")]);
    expect([missing.read, missing.naming]).toEqual([[], []]);

    expect(frameworkReferences([silent]).naming).toEqual([]);
    expect(frameworkReferences([silent]).read.length).toBe(1);
    expect(frameworkReferences([naming]).naming.length).toBe(1);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
});
