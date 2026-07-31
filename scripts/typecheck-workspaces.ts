import { spawnSync } from "node:child_process";
import { existsSync, globSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * THE FIFTH DEFINITION-OF-DONE CHECK: every workspace member type-checks under
 * ITS OWN tsconfig, because the root check must not and now cannot.
 *
 * WHY THE ROOT CHECK IS WITHDRAWN RATHER THAN KEPT AS A SECOND OPINION, and it
 * is worse than a gap: root `tsc --noEmit` answers a member's
 * `@atusy/tsudoi-language-server/*` import THROUGH THE ROOT'S OWN `paths`
 * MAPPING and REPORTS SUCCESS -- so a member whose own dependency resolution is
 * broken type-checks green at the root, and the greener the root the less it
 * means. tsconfig.json therefore excludes the members and this script takes the
 * coverage over. NEITHER HALF WORKS ALONE: without the exclusion this check is
 * shadowed by a root green, and without this check the exclusion means nothing
 * type-checks a member at all. The exclusion's reason is asserted in
 * test/package-shape.test.ts, since a tsconfig cannot carry one.
 *
 * ENUMERATED FROM `workspaces`, AND NEVER FROM A LIST WRITTEN HERE. With the
 * members outside the root program, a member a list here forgot would be checked
 * by NOTHING AT ALL while every command in the Definition of Done exits 0 --
 * a failure with no symptom, which is the shape this file exists to make
 * impossible. Adding a package under `packages/` must therefore cost no edit to
 * this file, and test/workspace-members.test.ts drives that by construction.
 *
 * WHAT IS RUN IS `tsc`, NOT A REIMPLEMENTATION OF ONE, and the binary is reached
 * through node_modules/.bin rather than by bare name: nothing here is a package
 * script and PATH is not this repo's to choose. test/package-shape.test.ts pins
 * that the binary there is the version this repo declares.
 *
 * A ROOT TO CHECK MAY BE PASSED AS THE ONE ARGUMENT, defaulting to the working
 * directory. That is what lets the assertions about this file build throwaway
 * workspaces instead of asserting against the repo it is running in -- a check
 * whose only subject is its own repository can be measured in exactly one state.
 */

/** The checkout this script ships in, which is where its compiler is found. */
const toolRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * Every directory the workspace configuration declares a member, expanded from
 * the `workspaces` patterns themselves.
 *
 * AN ABSENT OR EMPTY `workspaces` IS A FAILURE RATHER THAN AN EMPTY ANSWER, and
 * that asymmetry is the point: this check is the only thing looking at the paths
 * the root tsconfig gave up, so `I found no members` and `I was given no way to
 * find them` must not produce the same green.
 */
function declaredMembers(root: string): readonly string[] {
  const manifestPath = join(root, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  const patterns = manifest.workspaces;
  if (!Array.isArray(patterns) || patterns.length === 0) {
    throw new Error(
      `${manifestPath} declares no \`workspaces\`, so nothing enumerates the members the root type check has stopped covering.`,
    );
  }
  const members = new Set<string>();
  for (const pattern of patterns) {
    if (typeof pattern !== "string") {
      throw new Error(`\`workspaces\` in ${manifestPath} holds a non-string pattern.`);
    }
    for (const match of globSync(pattern, { cwd: root })) {
      const dir = join(root, match);
      if (statSync(dir).isDirectory() && existsSync(join(dir, "package.json"))) {
        members.add(dir);
      }
    }
  }
  return [...members].sort();
}

/**
 * Every directory holding a package.json underneath `dir`, which is how a
 * package that the root program cannot see is recognised without knowing its
 * name.
 *
 * node_modules IS SKIPPED because it is full of other people's packages and none
 * of them is ours to type-check.
 */
function packagesUnder(dir: string): readonly string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return [];
  }
  const found: string[] = [];
  if (existsSync(join(dir, "package.json"))) {
    found.push(dir);
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== "node_modules") {
      found.push(...packagesUnder(join(dir, entry.name)));
    }
  }
  return found;
}

/**
 * Fails when a package sits somewhere the root type check excludes and the
 * workspace configuration does not declare -- the one state in which a package
 * is covered by nothing and every check still exits 0.
 *
 * IT READS THE EXCLUSION RATHER THAN RESTATING IT, so narrowing `workspaces`
 * while leaving `packages` excluded is caught here instead of going quiet. The
 * cheap alternative -- trusting that the two keys agree -- is what makes the
 * gap silent, since they are edited in different files for different reasons.
 */
function refuseUncoveredPackages(root: string, members: readonly string[]): void {
  const tsconfigPath = join(root, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as Record<string, unknown>;
  const excluded = Array.isArray(tsconfig.exclude) ? tsconfig.exclude : [];
  const declared = new Set(members);
  for (const entry of excluded) {
    if (typeof entry !== "string") {
      continue;
    }
    for (const found of packagesUnder(join(root, entry))) {
      if (!declared.has(found)) {
        throw new Error(
          `${relative(root, found)} holds a package.json, is excluded from ${tsconfigPath}, and is not declared by \`workspaces\` -- nothing type-checks it.`,
        );
      }
    }
  }
}

/**
 * Type-checks one member under its own tsconfig, reporting whether it passed.
 *
 * RUN FROM THE ROOT AND NOT FROM THE MEMBER, which is what puts the member's
 * name in tsc's own diagnostics: tsc prints paths relative to the working
 * directory, so a run from inside the member reports `src/index.ts` and a reader
 * of a two-member failure cannot tell whose it is.
 */
function typeCheckMember(root: string, member: string): boolean {
  const config = join(member, "tsconfig.json");
  if (!existsSync(config)) {
    throw new Error(
      `${relative(root, member)} is a workspace member with no tsconfig.json, so this check has nothing to type-check it with.`,
    );
  }
  const result = spawnSync(join(toolRoot, "node_modules", ".bin", "tsc"), ["-p", config], {
    cwd: root,
    stdio: "inherit",
  });
  return result.status === 0;
}

const root = resolve(process.argv[2] ?? process.cwd());
const members = declaredMembers(root);
refuseUncoveredPackages(root, members);
let failed = false;
for (const member of members) {
  if (!typeCheckMember(root, member)) {
    failed = true;
  }
}
if (failed) {
  process.exitCode = 1;
}
