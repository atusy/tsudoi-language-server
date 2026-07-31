import { execFileSync } from "node:child_process";
import {
  existsSync,
  globSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
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
 * Every package directory one `exclude` entry covers, the entry read as the
 * PATTERN tsconfig defines it to be.
 *
 * node_modules IS DROPPED FROM THE MATCHES AND NOT ONLY FROM THE WALK, which
 * `packages/**` is what makes necessary: that pattern matches straight INTO a
 * member's installed dependencies, and a match that starts there hands
 * `packagesUnder` a directory whose own package.json belongs to a stranger. Such
 * a package is uncovered by this repository's type checking and always will be,
 * so reporting it would be a permanent red about somebody else's file.
 */
function excludedDirectories(root: string, entry: string): readonly string[] {
  const found: string[] = [];
  for (const match of globSync(entry, { cwd: root })) {
    if (match.split(sep).includes("node_modules")) {
      continue;
    }
    found.push(...packagesUnder(join(root, match)));
  }
  return found;
}

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
 *
 * AN ENTRY THAT RESOLVES TO NOTHING IS REPLACED, AND AN ENTRY THAT RESOLVES IS
 * NOT. The link written here is ABSOLUTE, so MOVING OR RENAMING THIS CHECKOUT
 * leaves one dangling in every member -- and `lstatSync` succeeds on a dangling
 * link, so `something is there` is the wrong question to ask. MEASURED with one
 * redirected at a path that does not exist: the fifth check reports
 * `src/hover.ts(31,36): error TS2307` and EVERY RERUN REPORTS IT AGAIN, because
 * the builder that would fix it is the one skipping. The diagnostic names the
 * member's SOURCE for a fault that lives in node_modules, so the reader is sent
 * to the one file that is not wrong.
 *
 * A DIRECTORY THAT RESOLVES IS SOMEBODY'S INSTALL and is left alone: the day
 * tsudoi is published a member may legitimately have a real copy there, and a
 * builder that overwrote it would substitute this checkout for the version that
 * member declared, silently.
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
  // `existsSync` FOLLOWS THE LINK, which is the whole distinction: it is false
  // both for nothing at all and for an entry that resolves to nothing, and those
  // two want the same treatment. `force` is what makes the second cost no
  // branch -- there is nothing to remove in the first case and it says so.
  if (existsSync(target)) {
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  rmSync(target, { force: true });
  symlinkSync(root, target, "dir");
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
 *
 * AN ENTRY IS A PATTERN AND NOT A DIRECTORY NAME, which is what tsconfig means
 * by `exclude` and the one reading that does not lose a package quietly:
 * `packages/*` names nothing on disk, so joining it to the root and walking
 * finds nothing, reports nothing, and exits 0 -- with the uncovered package
 * missed by the only thing looking for it. EXPANDED RATHER THAN REFUSED, since a
 * glob there is legal tsconfig a reader writes the moment they want the children
 * excluded and the parent kept, and refusing it would trade a silent miss for a
 * red on a correct file. THE SAME ENUMERATOR `workspaces` IS READ WITH, so the
 * two keys this function compares cannot be interpreted differently.
 */
export function refuseUncoveredPackages(root: string, members: readonly string[]): void {
  const tsconfigPath = join(root, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as Record<string, unknown>;
  const excluded = Array.isArray(tsconfig.exclude) ? tsconfig.exclude : [];
  const declared = new Set(members);
  for (const entry of excluded) {
    if (typeof entry !== "string") {
      continue;
    }
    for (const found of excludedDirectories(root, entry)) {
      if (!declared.has(found)) {
        throw new Error(
          `${relative(root, found)} holds a package.json, is excluded from ${tsconfigPath}, and is not declared by \`workspaces\` -- nothing type-checks it.`,
        );
      }
    }
  }
}

/**
 * Throws when a workspace member's own tsconfig maps a specifier to a file --
 * the one edit that rebuilds, one directory down, the false green the members'
 * exclusion from the root type check exists to foreclose.
 *
 * WHY `paths` IS THE SUBJECT AND NOT A STYLE PREFERENCE: the root check answered
 * a member's `@atusy/tsudoi-language-server/*` import THROUGH THE ROOT'S OWN
 * MAPPING and reported success, so a member whose dependency resolution was
 * broken type-checked green. The members were excluded and this script took the
 * coverage over. A mapping in the MEMBER'S tsconfig answers the same specifier
 * the same way -- without the member's node_modules and without the framework's
 * `exports` map -- and every check in this repository stays green while the
 * resolution a stranger will actually take is the one nothing looked at.
 *
 * OVER MEMBERS AS A CLASS, ENUMERATED FROM THE WORKSPACE CONFIGURATION. A guard
 * naming packages/hover-wordnet would leave the second member unpinned and
 * NOTHING WOULD SAY SO -- the same reason the fifth check reads `workspaces`
 * rather than a list, applied to the shape of the member rather than to its
 * existence.
 *
 * THE EFFECTIVE CONFIGURATION AND NOT THE BYTES OF ONE FILE, which is the half a
 * reader of `tsconfig.json` alone would miss: `extends` puts the mapping in a
 * document whose name nobody greps for, and a member whose own file holds no
 * `paths` key still compiles with one. THE CHAIN IS RESOLVED BY UPSTREAM RATHER
 * THAN HERE -- `tsc --showConfig` flattens it, MEASURED, including `paths`
 * inherited from a base -- so a spelling of `extends` this repository has never
 * seen (an array, a bare package specifier, a directory) is handled by the
 * compiler that will read it rather than by a second implementation that agrees
 * with the compiler only until it does not.
 *
 * A CONFIG tsc CANNOT READ IS LOUD RATHER THAN SKIPPED: `execFileSync` throws on
 * a non-zero exit and the parse below throws on output that is not a
 * configuration, because a guard that answers `no mapping found` for a file it
 * failed to read reports the safe colour for the wrong reason.
 */
export function refuseMemberMappings(root: string, members: readonly string[]): void {
  for (const member of members) {
    const config = join(member, "tsconfig.json");
    // Absent is NOT this function's to report: `typeCheckMember` refuses a
    // member with no tsconfig by name, and a second message about the same
    // directory would send a reader looking for two faults.
    if (!existsSync(config)) {
      continue;
    }
    const shown = execFileSync(join(toolRoot, "node_modules", ".bin", "tsc"), [
      "-p",
      config,
      "--showConfig",
    ]).toString("utf8");
    let effective: { compilerOptions?: Record<string, unknown> };
    try {
      effective = JSON.parse(shown) as { compilerOptions?: Record<string, unknown> };
    } catch {
      throw new Error(
        `${relative(root, config)} could not be read back as a configuration, so nothing here can say whether it maps a specifier:\n${shown}`,
      );
    }
    const paths = effective.compilerOptions?.paths;
    if (paths !== undefined) {
      throw new Error(
        `${relative(root, member)} resolves through a \`paths\` mapping (${JSON.stringify(paths)}), which answers a specifier without its own node_modules and without the framework's \`exports\` map -- the false green this check exists to foreclose. Remove it, from ${relative(root, config)} or from whatever it \`extends\`.`,
      );
    }
  }
}
