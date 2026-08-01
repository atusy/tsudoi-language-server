import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
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
import { handlerMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * EVERY MEMBER REACHES tsudoi BY ITS OWN ROUTE, PROVEN BY BREAKING THAT ROUTE
 * AND NOTHING ELSE.
 *
 * WHY THIS IS NOT test/workspace-members.test.ts's JOB. That file builds
 * throwaway workspaces because its claims are about states this repository must
 * never be in. THIS claim is about the state it IS in: the members here declare
 * tsudoi as a PEER and reach it through a symlink `bun install` writes into each
 * member's own node_modules, and a synthetic workspace would be a second
 * arrangement that agrees with this one only until it does not.
 *
 * AND THERE IS A SECOND ROUTE, WHICH IS WHY THE PERTURBATION ENUMERATES RATHER
 * THAN BREAKS ONE THING. The workspace root declares tsudoi too, so its
 * node_modules answers a member walking up -- and the first run of this file
 * after the framework became a member measured exactly that: the member's own
 * entry removed, the check EXIT 0 AND SILENT. A control that cannot fail is
 * worse than no control, so both readings are arms here.
 *
 * THE ROOT'S CHECK IS NEVER THE SUBJECT, and the reason this file recorded for
 * that has itself been overtaken. It used to be `name and paths are redundant
 * covers`: the root carried a mapping, and a specifier the mapping stopped
 * answering fell through to the `exports` map and landed in dist/ at exit 0.
 * THAT READING HAS NO SUBJECT ANY MORE -- there is no mapping in this repository
 * at all, which is what the framework becoming a member bought. The conclusion
 * stands on a different footing and is the stronger one: the root check now
 * resolves these subpaths the way a stranger's project does, so it is not a
 * second opinion about a member and never was.
 *
 * AND THE ROOT'S INDEPENDENCE IS READ RATHER THAN PERTURBED, which is the
 * difference between a reading that can fail and one that cannot. Each member's
 * tsconfig.json declares its whole compiler configuration and `extends` NOTHING,
 * so the root's file is not in the program a member's check reads -- asserted
 * below, together with the `paths` the compiler reports for each member under
 * `--showConfig`. That reading survived the mapping's removal unchanged, and
 * that is the point of taking it from the compiler: it now says NO MAPPING
 * REACHES A MEMBER FROM ANYWHERE, which is a wider claim than the one it was
 * written for and needed no edit to make it.
 *
 * THREE ARMS, AND NO TWO OF THEM SAY THE SAME THING: the member resolves
 * (positive), its configuration reaches nothing of the root's (independence),
 * and what it resolves TO is a real declaration rather than `any` (reach). Any
 * one alone is satisfied by a tree the other two refuse.
 *
 * PERTURBED IN PLACE AND RESTORED, which is a hazard this file owns rather than
 * hides: what is moved is a node_modules entry the shared builder REWRITES, so
 * a run that died between the two would be repaired by the next `bun test` or
 * fifth check rather than leaving a broken checkout.
 *
 * NO TRACKED FILE IS MODIFIED, stated at exactly its true width. The reach arm
 * does WRITE one, a probe under a member's src/, because the member's `include`
 * covers that directory and a file outside it is not in the program -- but it is
 * a new path this repository does not track, removed in a `finally` and asserted
 * gone afterwards. Nothing version-controlled is edited, so a run that dies
 * leaves at worst an untracked file `git status` names.
 */

/** The subpath every member imports, and the one a broken route must name. */
const subpath = "@atusy/tsudoi-language-server";

/**
 * EVERY ROUTE FROM ONE MEMBER TO tsudoi, ENUMERATED -- because breaking one of
 * them measures NOTHING while another answers.
 *
 * THERE ARE TWO AND THE SECOND IS A RULING'S PRICE, NOT AN ACCIDENT. `bun
 * install` writes the member's own entry, and the workspace root DECLARES tsudoi
 * in devDependencies -- which is what lets examples/ and the consumer-shaped
 * fixtures resolve it by name with no `paths` mapping anywhere -- so the root's
 * node_modules holds one too, and a member walking up finds it.
 *
 * WHAT A CONTROL THAT BROKE ONLY THE FIRST WOULD PRINT, STATED BEFORE IT WAS
 * RUN AND THEN MEASURED: exit 0 and an EMPTY diagnostic, because the root's
 * entry answers. That is exactly what the arm below found on the first run after
 * the move, which is why this enumeration exists and why the disarming is
 * asserted rather than remembered.
 *
 * A `paths` MAPPING IS NOT ON THIS LIST AND ITS ABSENCE IS ASSERTED SEPARATELY,
 * by the independence arm below, which reads the compiler's own resolved
 * configuration for each member.
 */
function routesTo(member: string): readonly string[] {
  return [
    // The member's own, which `bun install` writes RELATIVE.
    join(member, "node_modules", ...subpath.split("/")),
    // The workspace root's, which every member reaches by walking up.
    join(repoRoot, "node_modules", ...subpath.split("/")),
  ];
}

/** Where `bun install` puts tsudoi inside one member. */
function linkIn(member: string): string {
  return routesTo(member)[0] as string;
}

/**
 * Runs `body` with the named routes to tsudoi removed, and puts every one of
 * them back whatever happens.
 *
 * EACH LINK IS READ BEFORE IT IS REMOVED AND WRITTEN BACK AS IT WAS, rather than
 * left to a later `bun install`: nothing in the suite re-installs, so a repair
 * deferred would leave every test file loaded after this one reading a workspace
 * that cannot resolve.
 */
async function withRoutesBroken<T>(routes: readonly string[], body: () => Promise<T>): Promise<T> {
  const saved: { path: string; target: string }[] = [];
  for (const route of routes) {
    // REFUSED RATHER THAN REMOVED IF IT IS NOT A LINK, and the case is a real
    // future rather than a defensive habit: the day tsudoi is published, a
    // member may hold a real installed copy there. Deleting that and putting a
    // symlink back in its place would substitute this checkout for the version
    // the member declared -- and `readlinkSync` alone would throw EINVAL naming
    // neither the path nor the reason.
    if (!lstatSync(route).isSymbolicLink()) {
      throw new Error(
        `${relative(repoRoot, route)} is a real install rather than a workspace link, so this perturbation would replace somebody's package`,
      );
    }
    saved.push({ path: route, target: readlinkSync(route) });
    rmSync(route, { recursive: true, force: true });
  }
  try {
    return await body();
  } finally {
    for (const { path, target } of saved) {
      mkdirSync(join(path, ".."), { recursive: true });
      rmSync(path, { recursive: true, force: true });
      symlinkSync(target, path, "dir");
    }
  }
}

// HANDLERS AND NOT MEMBERS, because every claim below perturbs A MEMBER'S OWN
// ROUTE TO TSUDOI and the framework has no route to itself. Handed the
// framework, `linkIn` would name an entry nothing writes, the loop would break
// what is already absent, and the arm would redden about apparatus.
const members = handlerMembers(repoRoot);

// The pair for every loop below: an empty member list would satisfy each of them
// without a compiler ever running.
test("there are members to make these claims about", () => {
  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    expect(lstatSync(linkIn(member)).isSymbolicLink()).toBe(true);
  }
});

/**
 * THE POSITIVE ARM. With EVERY route to tsudoi removed, the member's own check
 * must fail AT THE SPECIFIER -- so what the check was answering is a route this
 * perturbation reached, and not one nobody enumerated.
 *
 * TS2307 AND THE SPECIFIER TOGETHER, because neither alone says it: a diagnostic
 * code with no specifier is any unresolved module, and a specifier with no code
 * is any diagnostic that happens to quote one.
 *
 * AND THE GREEN AFTERWARDS IS PART OF THE MEASUREMENT rather than tidiness: a
 * red that does not go away when the routes are restored was never about them.
 */
test("breaking every route to tsudoi reddens a member's own check, naming the subpath", async () => {
  for (const member of members) {
    const broken = await withRoutesBroken(routesTo(member), () => runTsc(member));
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
 * THE DISARMED CONTROL, KEPT AS AN ARM BECAUSE IT IS THE THING THAT WENT WRONG.
 *
 * Breaking the member's OWN entry and nothing else leaves the check GREEN AND
 * SILENT -- the root's entry answers, and every assertion in the arm above would
 * have been read as `the member's route is what resolves` while measuring the
 * root's. MEASURED: exit 0, empty output, on the first run after the framework
 * became a member.
 *
 * WHY IT IS ASSERTED RATHER THAN WRITTEN IN A COMMENT: a comment goes stale the
 * moment the second route changes, and the direction it can change in is the one
 * that matters -- if the root ever stops declaring tsudoi this arm reddens and
 * SAYS SO, where a comment would go on describing a hazard nobody has.
 *
 * IT IS NOT A CLAIM THAT THE SECOND ROUTE IS GOOD. It is the price of the ruling
 * that the workspace root declares tsudoi, which is what makes examples/ and the
 * consumer-shaped fixtures resolve it by name with no mapping anywhere.
 */
test("breaking only the member's own entry measures nothing, because the root's answers", async () => {
  for (const member of members) {
    const [own] = routesTo(member);
    const broken = await withRoutesBroken([own as string], () => runTsc(member));

    expect(`${relative(repoRoot, member)}: ${broken.output}`).toBe(
      `${relative(repoRoot, member)}: `,
    );
    expect(broken.code).toBe(0);
  }
}, 120_000);

/**
 * THE MEMBER'S CONFIGURATION STANDS ALONE, WHICH IS WHY NO ARM PERTURBS THE
 * ROOT'S.
 *
 * READ RATHER THAN PERTURBED, deliberately, and the two are not
 * interchangeable here. Deleting the root's `paths` and watching a member stay
 * green cannot settle anything, because that reading is green whether the
 * dependence exists or not. These readings can each fail.
 *
 * BOTH HALVES, BECAUSE NEITHER ALONE IS THE CLAIM. `extends` is the mechanism --
 * the one way a member's tsconfig could pull the root's in -- and its absence is
 * read off the file. The RESOLVED configuration is the outcome, taken from the
 * compiler itself rather than deduced from the source: `--showConfig` reports the
 * options tsc will actually use, so a mapping arriving by any route this file
 * did not think of is still named here. The first says how it cannot happen; the
 * second says it has not.
 *
 * `--showConfig` AND NOT A TYPE CHECK, which is what keeps this cheap: it prints
 * the merged configuration and compiles nothing, so the reading costs no program.
 */
async function resolvedConfig(member: string): Promise<{ compilerOptions?: { paths?: unknown } }> {
  const output = await new Promise<string>((done, fail) => {
    const child = spawn("tsc", ["-p", member, "--showConfig"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let text = "";
    child.stdout.on("data", (chunk: Buffer) => {
      text += chunk.toString("utf8");
    });
    child.on("error", fail);
    child.on("close", () => {
      done(text);
    });
  });
  return JSON.parse(output) as { compilerOptions?: { paths?: unknown } };
}

test("no member's tsconfig extends another, and none resolves the root's paths mapping", async () => {
  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    const declared = JSON.parse(readFileSync(join(member, "tsconfig.json"), "utf8")) as {
      extends?: unknown;
    };
    const resolved = await resolvedConfig(member);
    const name = relative(repoRoot, member);

    expect(`${name}: extends ${JSON.stringify(declared.extends)}`).toBe(
      `${name}: extends undefined`,
    );
    expect(`${name}: paths ${JSON.stringify(resolved.compilerOptions?.paths)}`).toBe(
      `${name}: paths undefined`,
    );
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
