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
import { basename, dirname, join, relative, sep } from "node:path";
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
 * The manifest fields a build edge is read out of.
 *
 * `devDependencies` IS ABSENT AND THAT IS A RULING RATHER THAN AN OVERSIGHT.
 * The root devDepends on both handler packages and both handler packages depend
 * back on the root, so an edge per devDependency would make this repository's
 * own graph hold two cycles -- and the refusal below runs inside the `bun test`
 * preload, so nothing would load. Substantively: the root's published artifact
 * is not compiled against either handler, so such an edge would order a build
 * against a dependency that build does not have. THE PRICE IS ACCEPTED AND
 * NAMED: a package that devDepends on another package for its TESTS gets no
 * ordering guarantee from here.
 *
 * `peerDependencies` IS PRESENT EVEN WHERE IT IS DECLARED OPTIONAL, and that is
 * the landmine rather than a detail: `peerDependenciesMeta.optional` buys
 * INSTALLABILITY while the peer is unpublished and says nothing about
 * compilation -- each of this repository's handlers imports values from the peer
 * it calls optional. Dropping optional peers leaves this graph with NO EDGES AT
 * ALL, and the order silently degenerates to the tie-break, which is the
 * alphabet wearing a topological sort's clothes.
 */
const dependencyFields = ["dependencies", "peerDependencies"] as const;

/** A package as the ordering sees it: where it is, what it is called, what it needs. */
interface OrderedPackage {
  readonly dir: string;
  readonly name: string | undefined;
  readonly needs: readonly { readonly producer: string; readonly field: string }[];
}

/**
 * Reads one package as a node, WITH A MISSING `name` CARRIED RATHER THAN
 * REFUSED.
 *
 * A NAMELESS PACKAGE IS TOLERATED HERE AND REFUSED ELSEWHERE, which is an
 * ordering constraint between two guards and not a disagreement about the state:
 * `refuseMemberDirectoriesUnlikeTheUnscopedName` is the one that refuses it, and
 * it runs in the fifth check. This function runs in the `bun test` PRELOAD, so a
 * throw here would abort the suite before that guard could speak -- and the arm
 * that pins the refusal would go red still containing the word `name`, now
 * reddened by the wrong function.
 *
 * Nothing depends on a package that has no name, since an edge is a name found
 * in another package's declaration; such a node is ordered by the tie-break
 * alone.
 */
function orderedPackage(dir: string): OrderedPackage {
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  const name = manifest.name;
  const needs: { producer: string; field: string }[] = [];
  for (const field of dependencyFields) {
    const declared = manifest[field];
    if (typeof declared !== "object" || declared === null) {
      continue;
    }
    for (const producer of Object.keys(declared as Record<string, unknown>)) {
      needs.push({ producer, field });
    }
  }
  return { dir, name: typeof name === "string" ? name : undefined, needs };
}

/**
 * Reports the packages that need each other, NAMING THE DECLARATIONS AND NOT
 * ONLY THE PACKAGES.
 *
 * `these form a cycle` LEAVES THE READER OPENING EVERY MANIFEST IN IT to find
 * which line to delete, and on a workspace holding more than two declarations
 * per package, which of the many. The line to delete is what the reader came
 * for, so it is what the message carries.
 *
 * ONLY THE PACKAGES IN THE CYCLE, WHICH IS WHY THE WALK IS TRIMMED rather than
 * the whole unplaced set reported: everything downstream of a cycle is unplaced
 * too, and naming those sends a reader to inspect manifests that are correct.
 */
function refuseCycle(
  root: string,
  pending: readonly OrderedPackage[],
  dirsByName: ReadonlyMap<string, string>,
): never {
  const unplaced = new Map(pending.map((node) => [node.dir, node]));
  const blocking = new Map<string, { producer: string; field: string }>();
  for (const node of pending) {
    const need = node.needs.find((one) => {
      const producer = dirsByName.get(one.producer);
      return producer !== undefined && unplaced.has(producer);
    });
    if (need !== undefined) {
      blocking.set(node.dir, need);
    }
  }
  const walked: string[] = [];
  let at: string | undefined = pending[0]?.dir;
  while (at !== undefined && !walked.includes(at)) {
    walked.push(at);
    const need = blocking.get(at);
    at = need === undefined ? undefined : dirsByName.get(need.producer);
  }
  const cycle = walked.slice(at === undefined ? 0 : walked.indexOf(at));
  const named = cycle.map((dir) => unplaced.get(dir)?.name ?? relative(root, dir));
  const links = cycle.flatMap((dir) => {
    const need = blocking.get(dir);
    return need === undefined
      ? []
      : [
          `${join(relative(root, dir), "package.json")} names \`${need.producer}\` in \`${need.field}\``,
        ];
  });
  throw new Error(
    `${named.join(" and ")} need each other, so no order builds either one against something that exists: ${links.join("; ")}. Delete one of those declarations, or move it to \`devDependencies\`, which is deliberately not a build edge.`,
  );
}

/**
 * The order the packages of this workspace can be built in: every package after
 * everything it declares it needs.
 *
 * THE ROOT IS A NODE BECAUSE IT IS A BUILDABLE PACKAGE AND NOT BECAUSE IT IS THE
 * ROOT. That phrasing is what makes this survive the day the main package moves
 * under `packages/`: it stops being special with no edit here.
 *
 * A SEQUENCE IS RETURNED RATHER THAN A BUILD PERFORMED, and the reason is what
 * the callers cannot check for themselves: `build everything twice` and `build
 * in any order and retry until it goes green` leave exactly the artifacts a
 * correct order leaves. They differ from it only as a SEQUENCE, so the sequence
 * has to be a value somebody can read.
 *
 * THE TIE-BREAK IS NOT THE ORDER, and it is the one thing here a later reader
 * could mistake for the whole answer. Packages nothing separates are emitted by
 * path so two runs agree; packages a declaration separates are emitted by the
 * DECLARATION, which on this repository's own graph happens to agree with the
 * path order -- an accident of the names, pinned as an accident by an arm in
 * test/build-order.test.ts built on a tree where the two disagree. The member
 * enumeration above sorts for a different reason and keeps its own sort: its
 * callers want a stable LIST, and a stable list is not a build order.
 *
 * EDGES ARE INTERSECTED WITH THE NODES, so a dependency on a package outside
 * this workspace -- which is most of them -- constrains nothing here. It is
 * installed rather than built.
 *
 * A CYCLE THROWS RATHER THAN FALLING BACK TO THE TIE-BREAK. A cycle is
 * unbuildable, and the fallback picks one of its members and lets the rest
 * compile against an artifact that is absent or stale -- which under the
 * `default: ./src/*.ts` arm exits 0 reading a different file, the exact class
 * this derivation exists to end. THE THROW LANDS IN THE `bun test` PRELOAD, so
 * it must be reachable only from a state this repository can never be in: what
 * establishes that is the ruling above that dev edges are not build edges,
 * together with the arm asserting this workspace's order byte for byte.
 */
export function buildOrder(root: string): readonly string[] {
  const nodes = [root, ...declaredMembers(root)].map(orderedPackage);
  const dirsByName = new Map<string, string>();
  for (const node of nodes) {
    if (node.name !== undefined) {
      dirsByName.set(node.name, node.dir);
    }
  }
  const pending = [...nodes].sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
  const placed = new Set<string>();
  const order: string[] = [];
  while (pending.length > 0) {
    const index = pending.findIndex((node) =>
      node.needs.every((need) => {
        const producer = dirsByName.get(need.producer);
        return producer === undefined || placed.has(producer);
      }),
    );
    if (index === -1) {
      refuseCycle(root, pending, dirsByName);
    }
    for (const next of pending.splice(index, 1)) {
      placed.add(next.dir);
      order.push(next.dir);
    }
  }
  return order;
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
 * the node_modules ENTRY and nothing else, so the specifier is answered the way
 * a stranger's is -- by walking the MEMBER'S OWN node_modules, and then by the
 * FRAMEWORK'S manifest, whose `exports` map decides which file a subpath
 * reaches. THE MEMBER'S MANIFEST ANSWERS NOTHING HERE, worth saying because the
 * dependency is declared there and the reading is therefore available: MEASURED
 * with `tsc --traceResolution` on this member, its own package.json is read for
 * the module format and the specifier is never looked up in it. A `paths`
 * mapping would answer WITHOUT either, which `refuseMemberMappings` below
 * refuses rather than leaving merely absent.
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
 * THE ROOT IS STILL BUILT FIRST AND THAT ORDER IS STILL LOAD-BEARING -- BUT IT
 * IS NO LONGER THIS FUNCTION SAYING SO, AND THE INVERSION IS THE POINT. A member
 * resolves `@atusy/tsudoi-language-server/types` through the exports map to
 * dist/types.d.ts, so a member compiled against an unbuilt root fails at
 * TS2307 -- an apparatus failure wearing a resolution failure's clothes. What
 * puts the root first is that BOTH MEMBERS DECLARE IT, read out of their
 * manifests by `buildOrder`. The loop below no longer knows which package is the
 * root, which is what makes it survive the day the main package becomes a member
 * like any other.
 *
 * WHAT IT DOES NOT MAKE SAFE, unchanged from what the preload already records:
 * tsc writes dist/ and THEN exits non-zero, so a failed build leaves a fresh,
 * wrong artifact behind. Callers throw; nothing here cleans up.
 */
export function prepareWorkspace(root: string): void {
  for (const dir of buildOrder(root)) {
    // THE ROOT IS NOT LINKED INTO ITSELF, which is the one asymmetry left here
    // and is a fact about the ROOT PACKAGE rather than about the order: it is
    // reached by walking up, so an entry for it under its own node_modules would
    // answer nothing that is not already answered.
    if (dir !== root) {
      linkRootPackage(root, dir);
    }
    build(dir);
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
 * A package name with any `@scope/` dropped, which is the whole of the relation
 * below.
 *
 * NO BRANCH FOR HAVING A SCOPE, and that is not brevity: an unscoped name holds
 * no separator, so `indexOf` answers -1 and the slice starts at 0 -- the same
 * expression reads both shapes. A branch here would be a second place for the
 * two shapes to be treated differently, which is what the relation is against.
 */
function unscopedName(name: string): string {
  return name.slice(name.indexOf("/") + 1);
}

/**
 * Throws when a workspace member's directory is not its declared name with the
 * scope dropped -- one package spelled two ways, with nothing keeping the two
 * equal but whoever last edited one of them.
 *
 * THE RELATION IS `UNSCOPED` AND THE NAME SAYS SO. `packages/tsudoi-hover-wordnet`
 * and `@atusy/tsudoi-hover-wordnet` are not the same string and never can be, so
 * a guard called `member names agree` would state a class wider than anything it
 * could check -- and Sprint 49's remedy for that is to narrow the NAME rather
 * than to widen the matcher.
 *
 * ONE PREDICATE AND NOT TWO BRANCHES, which is a statement about the fault and
 * not about the code: `the manifest was edited` and `the directory was moved`
 * ARE THE SAME STATE ON DISK. Nothing here records which side moved, so a guard
 * with an arm per direction would be inventing that distinction and then
 * asserting it. The message therefore names BOTH spellings and offers BOTH
 * repairs, and the reader is the one who knows which they meant.
 *
 * THE VACUOUS IMPLEMENTATION IS THE ONE THAT SKIPS SCOPED NAMES, and it is worth
 * naming because it is the shape a guard drifts into and because probes do not
 * catch it: MEASURED with the predicate replaced by `pass anything holding a
 * scope`, the arms staged from unscoped throwaway members stay GREEN and the
 * fifth check on this repository -- where BOTH members are scoped -- reported
 * nothing at all, on the checkout where the two spellings still disagreed. That
 * is why the arms in test/workspace-members.test.ts include a SCOPED member
 * whose unscoped segment mismatches, which is the only one of them such an
 * implementation reddens.
 *
 * OVER MEMBERS AS A CLASS, ENUMERATED FROM THE WORKSPACE CONFIGURATION, and it
 * MUST NOT SPELL THE CONTAINER: a guard naming `packages/` would be invalidated
 * by the next move of the directory it names, and a guard naming a member would
 * leave every other member unpinned with nothing saying so.
 */
export function refuseMemberDirectoriesUnlikeTheUnscopedName(
  root: string,
  members: readonly string[],
): void {
  for (const member of members) {
    const manifestPath = join(member, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    const name = manifest.name;
    // A MEMBER DECLARING NO `name` IS REFUSED AND NOT PASSED OVER. `there is no
    // second spelling to disagree with` is a defensible reading of it, and it is
    // the reading that leaves `delete the name` as an edit which silences this
    // guard rather than tripping it. Refusing costs one message and forecloses
    // that.
    if (typeof name !== "string") {
      throw new Error(
        `${relative(root, manifestPath)} declares no \`name\`, so nothing says what the directory ${relative(root, member)} is the unscoped spelling of.`,
      );
    }
    const unscoped = unscopedName(name);
    if (unscoped !== basename(member)) {
      throw new Error(
        `${relative(root, member)} is declared \`${name}\`, whose unscoped name is \`${unscoped}\` -- one package spelled two ways. Rename the directory to \`${unscoped}\`, or change the \`name\` in ${relative(root, manifestPath)} to match the directory.`,
      );
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
 * naming packages/tsudoi-hover-wordnet would leave the second member unpinned and
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
 * A CONFIG tsc CANNOT READ IS LOUD, BUT NOT ALWAYS HERE, and the distinction is
 * measured rather than assumed because a guard that answers `no mapping found`
 * for a file it failed to read reports the safe colour for the wrong reason.
 * `execFileSync` throws on a non-zero exit and the parse below throws on output
 * that is not a configuration -- but `--showConfig` on an UNRESOLVABLE `extends`
 * EXITS 0 and simply omits what it could not read, MEASURED, so this function
 * passes it. What refuses it is `typeCheckMember` immediately after: TS5083
 * naming the file, exit 1, pinned in test/workspace-members.test.ts. The
 * loudness is the pair's and not this function's, which is why it is written
 * here rather than assumed by whoever moves one of them.
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
