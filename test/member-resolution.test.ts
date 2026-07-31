import { expect, test } from "bun:test";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";

/**
 * EVERY MEMBER REACHES tsudoi BY ITS OWN ROUTE, PROVEN BY BREAKING THAT ROUTE
 * AND NOTHING ELSE.
 *
 * WHY THIS IS NOT test/workspace-members.test.ts's JOB. That file builds
 * throwaway workspaces because its claims are about states this repository must
 * never be in. THIS claim is about the state it IS in: the members here declare
 * tsudoi as a PEER and reach it through a symlink scripts/workspaces.ts writes
 * into each member's own node_modules, and a synthetic workspace would be a
 * second arrangement that agrees with this one only until it does not.
 *
 * THE ROOT IS NEVER OBSERVED, and that is the correction this file carries. The
 * obvious perturbation -- remove the root's `paths` mapping and watch the ROOT
 * check redden on a member -- DOES NOT WORK AND THIS REPOSITORY HAD ALREADY
 * MEASURED WHY: `name` and `paths` are redundant covers, so a specifier the
 * mapping stops answering falls through to the `exports` map and lands in dist/
 * at exit 0. The reading below is the member's own check, and the root appears
 * only as the thing whose removal must change NOTHING.
 *
 * THREE ARMS, AND NO TWO OF THEM SAY THE SAME THING: the member resolves
 * (positive), it resolves WITHOUT the parent's help (negative), and what it
 * resolves TO is a real declaration rather than `any` (reach). Any one alone is
 * satisfied by a tree the other two refuse.
 *
 * PERTURBED IN PLACE AND RESTORED, which is a hazard this file owns rather than
 * hides: what is moved is a node_modules entry the shared builder REWRITES, so
 * a run that died between the two would be repaired by the next `bun test` or
 * fifth check rather than leaving a broken checkout. Nothing under version
 * control is touched.
 */

/** The subpath every member imports, and the one a broken route must name. */
const subpath = "@atusy/tsudoi-language-server";

/** Where the apparatus puts the root package inside one member. */
function linkIn(member: string): string {
  return join(member, "node_modules", ...subpath.split("/"));
}

/**
 * Runs `body` with one member's link to the root package removed, and puts the
 * link back whatever happens.
 *
 * THE LINK IS READ BEFORE IT IS REMOVED AND WRITTEN BACK AS IT WAS, rather than
 * left to the builder: the builder runs at the START of the fifth check and of
 * `bun test`, so a repair deferred to it would leave every test file loaded
 * after this one reading a member that cannot resolve.
 */
async function withRouteBroken<T>(member: string, body: () => Promise<T>): Promise<T> {
  const link = linkIn(member);
  // REFUSED RATHER THAN REMOVED IF IT IS NOT A LINK, and the case is a real
  // future rather than a defensive habit: scripts/workspaces.ts leaves alone an
  // entry that RESOLVES, so the day tsudoi is published a member may hold a real
  // installed copy there. Deleting that and putting a symlink back in its place
  // would substitute this checkout for the version the member declared -- and
  // `readlinkSync` alone would throw EINVAL naming neither the member nor the
  // reason.
  if (!lstatSync(link).isSymbolicLink()) {
    throw new Error(
      `${relative(repoRoot, member)} resolves tsudoi through a real install rather than the apparatus link, so this perturbation would replace somebody's package`,
    );
  }
  const target = readlinkSync(link);
  rmSync(link, { recursive: true, force: true });
  try {
    return await body();
  } finally {
    mkdirSync(join(link, ".."), { recursive: true });
    rmSync(link, { recursive: true, force: true });
    symlinkSync(target, link, "dir");
  }
}

const members = declaredMembers(repoRoot);

// The pair for every loop below: an empty member list would satisfy each of them
// without a compiler ever running.
test("there are members to make these claims about", () => {
  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    expect(lstatSync(linkIn(member)).isSymbolicLink()).toBe(true);
  }
});

/**
 * THE POSITIVE ARM. The member's own check, with the member's OWN route broken,
 * must fail AT THE SPECIFIER -- so what the check was answering is that route
 * and not some other one.
 *
 * TS2307 AND THE SPECIFIER TOGETHER, because neither alone says it: a diagnostic
 * code with no specifier is any unresolved module, and a specifier with no code
 * is any diagnostic that happens to quote one.
 *
 * AND THE GREEN AFTERWARDS IS PART OF THE MEASUREMENT rather than tidiness: a
 * red that does not go away when the route is restored was never about the
 * route.
 */
test("breaking a member's own link to tsudoi reddens that member's check, naming the subpath", async () => {
  for (const member of members) {
    const broken = await withRouteBroken(member, () => runTsc(member));
    const restored = await runTsc(member);

    expect(`${relative(repoRoot, member)}: ${broken.output}`).toContain("TS2307");
    expect(broken.output).toContain(subpath);
    expect(broken.code).not.toBe(0);
    expect(`${relative(repoRoot, member)}: ${restored.output}`).toBe(
      `${relative(repoRoot, member)}: `,
    );
    expect(restored.code).toBe(0);
  }
}, 120_000);

/**
 * THE NEGATIVE ARM: the parent's mapping is not what answers a member, and the
 * way to show that is to take the mapping away and watch NOTHING move.
 *
 * WITHOUT THE ROOT'S OWN CHECK BEING RUN AT ALL, which is the difference from
 * the refuted mechanism this file's header records: the claim is not `the root
 * notices` but `the member does not depend on the root's tsconfig`, and the only
 * reading that can say so is the member's.
 *
 * THE MAPPING IS REMOVED FROM THE FILE AND NOT FROM A COPY, because a copy would
 * be a config the member was never able to reach anyway -- the perturbation has
 * to be one that WOULD change the answer if the dependence existed.
 */
test("removing the root's paths mapping leaves every member's own check unchanged", async () => {
  const tsconfigPath = join(repoRoot, "tsconfig.json");
  const original = readFileSync(tsconfigPath, "utf8");
  const parsed = JSON.parse(original) as { compilerOptions?: Record<string, unknown> };
  // Narrowed rather than assumed: a perturbation that removed a key which was
  // not there measures the tree as it stands and calls it a control.
  expect(parsed.compilerOptions?.paths).toBeDefined();
  delete parsed.compilerOptions?.paths;

  try {
    writeFileSync(tsconfigPath, `${JSON.stringify(parsed, null, 2)}\n`);
    for (const member of members) {
      const result = await runTsc(member);

      expect(`${relative(repoRoot, member)}: ${result.output}`).toBe(
        `${relative(repoRoot, member)}: `,
      );
      expect(result.code).toBe(0);
    }
  } finally {
    writeFileSync(tsconfigPath, original);
  }
}, 120_000);

/**
 * THE REACH ARM: what the subpath resolves TO is a real declaration, not `any`
 * and not a file that happens to exist.
 *
 * A NAME THE SUBPATH DOES NOT EXPORT IS THE PROBE, and TS2305 is the answer that
 * discriminates: an unresolved module answers TS2307 instead, and a module
 * arriving as `any` answers nothing at all. So ZERO TS2307 is asserted beside
 * it -- without that half, a probe that failed to resolve would produce a red
 * and be read as a pass.
 *
 * A PERTURBATION OF tsudoi's OWN SOURCE WOULD NOT REACH THIS, AND THAT IS A
 * DEDUCTION RATHER THAN A READING TAKEN HERE. The distinction is written down
 * because it decides what a later editor may lean on: nothing below perturbs
 * this package's source, so nothing below can report what such an edit does.
 *
 * WHAT IS MEASURED IS ONE STEP AWAY, in test/package-shape.test.ts, and the
 * deduction is its consequence: `with no mapping the same subpaths answer from
 * the built artifact` reads these specifiers resolving through the `exports` map
 * to dist/, and a member declares no `paths` of its own -- so an edit to this
 * package's src/ changes nothing a member sees until something rebuilds, and a
 * rebuild that failed would leave dist/ fresh and wrong.
 *
 * THE ISOLATED SOURCE-ONLY PERTURBATION IS REFUSED RATHER THAN OVERLOOKED: the
 * only way to take that reading directly is to edit a tracked source file of
 * this package and put it back, and a suite that mutates version-controlled
 * files is a hazard this repository declines to carry for a fact already
 * established elsewhere. The probe below needs no build of anyone's.
 *
 * WRITTEN INTO THE MEMBER AND REMOVED AGAIN, because the member's `include`
 * covers src/ and test/: a probe anywhere else is not in the program its own
 * check reads.
 */
test("a name the subpath does not export is TS2305 in every member, with no TS2307 anywhere", async () => {
  for (const member of members) {
    const probe = join(member, "src", "__reach-probe.ts");
    try {
      writeFileSync(
        probe,
        `import type { NoSuchNameIsExportedHere } from "${subpath}/types";\nexport type Probe = NoSuchNameIsExportedHere;\n`,
      );
      const result = await runTsc(member);

      expect(`${relative(repoRoot, member)}: ${result.output}`).toContain("TS2305");
      expect(result.output).not.toContain("TS2307");
      expect(result.code).not.toBe(0);
    } finally {
      rmSync(probe, { force: true });
    }
  }
  // The tree is left as it was found, asserted rather than trusted: a probe left
  // behind would fail the fifth Definition-of-Done check for every later run.
  for (const member of members) {
    expect(existsSync(join(member, "src", "__reach-probe.ts"))).toBe(false);
  }
}, 120_000);
