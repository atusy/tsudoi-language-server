import { execFileSync } from "node:child_process";
import {
  existsSync,
  globSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WHO THE WORKSPACE MEMBERS ARE, ANSWERED ONCE FOR EVERY TOOL THAT ASKS.
 *
 * TWO CALLERS AND THEY MUST NOT DISAGREE: scripts/typecheck-workspaces.ts, the
 * fifth Definition-of-Done check, and test/helpers/build.ts, which compiles what
 * `bun test` then loads. A member one of them found and the other did not would
 * be a member type-checked but never built, or built and never checked, and
 * either way NOTHING SAYS SO -- both commands exit 0 having each done their half.
 *
 * READ FROM `workspaces`, NEVER FROM A LIST HERE, for the reason the check
 * itself carries: with members outside the root type check's program, a member a
 * list forgot is covered by nothing at all.
 */

/**
 * Every directory the workspace configuration declares a member, expanded from
 * the `workspaces` patterns themselves.
 *
 * AN ABSENT OR EMPTY `workspaces` IS A FAILURE RATHER THAN AN EMPTY ANSWER, and
 * that asymmetry is the point: the callers are the only things looking at the
 * paths the root type check gave up, so `I found no members` and `I was given no
 * way to find them` must not produce the same silence.
 */
export function declaredMembers(root: string): readonly string[] {
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
 * package the root program cannot see is recognised without knowing its name.
 *
 * node_modules IS SKIPPED because it is full of other people's packages and none
 * of them is ours to check or to build.
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
 * Throws when a package sits somewhere the root type check excludes and the
 * workspace configuration does not declare -- the one state in which a package
 * is covered by nothing while every command still exits 0.
 *
 * IT READS THE EXCLUSION RATHER THAN RESTATING IT, so narrowing `workspaces`
 * while leaving `packages` excluded is caught here instead of going quiet.
 * `workspaces` IS ITSELF A LIST, merely one kept in another file, and the
 * criterion this closes is about a member no list names -- so trusting the two
 * keys to agree would leave exactly the gap the enumeration was chosen to avoid.
 * They are edited in different files for different reasons.
 */
/** The checkout these scripts ship in, which is where their compiler is found. */
const toolRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * Puts the root package under the MEMBER'S OWN node_modules, so the member
 * reaches it by walking up exactly as a stranger's project does.
 *
 * WHY IT HAS TO BE DONE BY HAND, AND IT IS APPARATUS RATHER THAN DESIGN: bun's
 * workspace protocol resolves a member's dependency against the `workspaces`
 * globs, AND THE MAIN PACKAGE IS THE WORKSPACE ROOT, which those globs never
 * match. MEASURED, every spelling: `workspace:*` and `workspace:.` report
 * `Workspace dependency not found`, a plain range and `link:` reach the registry
 * and 404 because nothing here is published, and `file:` -- as a dependency or
 * as a root `override` -- HARDLINKS THE WHOLE CHECKOUT into node_modules/.bun,
 * which is worse than useless: the next `tsc` writes a new inode and the copy
 * silently goes stale.
 *
 * A SYMLINK AND NOT A COPY, for exactly that reason -- the member must resolve
 * the dist/ this repository is building, not a snapshot of it.
 *
 * IN THE MEMBER'S node_modules AND NOT THE ROOT'S, AND THAT IS NOT TIDINESS.
 * MEASURED at the root: test/helpers/typecheck.ts symlinks the repo's whole
 * node_modules into every throwaway probe, so an entry there hands each probe a
 * SECOND route to this package -- one that reaches the repository's real
 * package.json. The probe that DELETES `exports` from its own copy then resolves
 * anyway and reports EXIT 0, and a control written to prove the exports map is
 * load-bearing measures nothing. A member's own node_modules is reached by
 * nothing but that member.
 *
 * WHAT THIS IS NOT: a shortcut around the member's own resolution. It creates
 * the node_modules ENTRY and nothing else, so the member still resolves through
 * its own manifest and tsudoi's `exports` map, and a `paths` mapping -- which
 * would resolve the specifier WITHOUT either -- is still refused everywhere.
 *
 * Skipped where the member has no node_modules to put it in, which is what lets
 * a throwaway workspace built by a test run through here untouched.
 */
function linkRootPackage(root: string, member: string): void {
  const modules = join(member, "node_modules");
  if (!existsSync(modules)) {
    return;
  }
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  const name = manifest.name;
  if (typeof name !== "string") {
    return;
  }
  const target = join(modules, ...name.split("/"));
  try {
    lstatSync(target);
  } catch {
    mkdirSync(dirname(target), { recursive: true });
    symlinkSync(root, target, "dir");
  }
}

/** Compiles one package's published artifact, where one is configured. */
function build(dir: string): void {
  if (!existsSync(join(dir, "tsconfig.build.json"))) {
    return;
  }
  execFileSync(join(toolRoot, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.build.json"], {
    cwd: dir,
    stdio: "inherit",
  });
}

/**
 * The state every tool in this repository needs before it can believe what it
 * reads: the root package reachable by name, and every published artifact built
 * from current source.
 *
 * THE MEMBERS' dist/ IS NOT OPTIONAL AND NOT A CONVENIENCE. A member publishes
 * dist/ and NOT src/ -- deno refuses to type-strip under node_modules -- so its
 * `exports` map names no source arm, and nothing resolves a member by any other
 * route. The root tsconfig deliberately holds no `paths` mapping standing in for
 * one either: the members are EXCLUDED from it precisely so it cannot answer for
 * them, and a mapping added to spare this build would pull member source back
 * into the root program through module resolution, which `exclude` does not
 * stop.
 *
 * THE ROOT IS BUILT FIRST AND THAT ORDER IS LOAD-BEARING: a member resolves
 * `@atusy/tsudoi-language-server/types` through the exports map to
 * dist/types.d.ts, so a member compiled against an unbuilt root fails at
 * TS2307 -- an apparatus failure wearing a resolution failure's clothes.
 *
 * WHAT IT DOES NOT MAKE SAFE, unchanged from what the preload already records:
 * tsc writes dist/ and THEN exits non-zero, so a failed build leaves a fresh,
 * wrong artifact behind. Callers throw; nothing here cleans up.
 */
export function prepareWorkspace(root: string): void {
  build(root);
  for (const member of declaredMembers(root)) {
    linkRootPackage(root, member);
    build(member);
  }
}

export function refuseUncoveredPackages(root: string, members: readonly string[]): void {
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
