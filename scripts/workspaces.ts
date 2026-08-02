import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, globSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
 *
 * THE SORT STAYS HERE AND IS NOT THE BUILD ORDER, which is worth saying at this
 * site because `buildOrder` below sorts too and a reader who noticed both could
 * reasonably conclude one of them is redundant. A STABLE LIST AND A BUILD ORDER
 * ARE DIFFERENT QUESTIONS: this one's callers -- the fifth check, the guards it
 * runs -- want the same sequence twice running so a diagnostic naming `the
 * first offender` means something, and they ask nothing about what needs what.
 * Moving this sort into the orderer would leave those callers reading an order
 * derived from declarations they do not care about, and would make the
 * tie-break look like the answer rather than the fallback.
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
 * The members that CONSUME another package of this workspace -- the handler
 * packages -- recognised by what they DECLARE rather than by a name written
 * here.
 *
 * WHY THE ENUMERATION SPLITS AT ALL, AND IT IS FORCED RATHER THAN CHOSEN. Once
 * the framework is a member like any other, every caller asking `who are the
 * members` gets it too -- and several of this repository's callers ask questions
 * THE FRAMEWORK CANNOT ANSWER ABOUT ITSELF: that it declares a peer on tsudoi,
 * that its README tells a stranger it needs tsudoi at run time, that its src/
 * holds a handler for an LSP method, that a consumer installs it BESIDE tsudoi.
 * Handed the framework, each of those goes green over a package its question
 * does not apply to, which is the for-want-of-a-subject shape this record keeps
 * catching.
 *
 * NO PACKAGE NAME IS SPELLED HERE, DELIBERATELY. A filter naming the framework
 * would be a second home for the published name, and it would quietly answer
 * `there are no handlers` the day that name changed -- every loop below it green
 * and empty. What is read instead is the SAME DECLARATION `buildOrder` reads an
 * edge out of, intersected with the packages this workspace holds: a handler is
 * exactly a member that needs something built here.
 *
 * THE ROOT COUNTS AS A PACKAGE OF THIS WORKSPACE THOUGH IT IS NOT A MEMBER,
 * which is what makes this return the same set before and after the framework
 * moves under packages/ -- the answer follows the declarations rather than the
 * layout.
 *
 * APPLIED PER SITE AND NEVER WHOLESALE. A caller whose question the framework
 * CAN answer -- what it publishes, which licence it ships, what order it is
 * built in, whether it type-checks -- keeps `declaredMembers` and carries the
 * reason at its own call.
 */
export function handlerMembers(root: string): readonly string[] {
  const members = declaredMembers(root);
  const named = new Set(
    [root, ...members].flatMap((dir) => {
      const name = orderedPackage(dir).name;
      return name === undefined ? [] : [name];
    }),
  );
  return members.filter((member) => {
    const node = orderedPackage(member);
    // `producer !== node.name` is not defensive: a package that declared itself
    // would otherwise be its own consumer, and the one member this split exists
    // to exclude is the one every other package names.
    return node.needs.some((need) => need.producer !== node.name && named.has(need.producer));
  });
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
  // EVERY MEMBER AND NOT ONLY THE HANDLERS. A package left out of the order is a
  // package never built, and the framework is the one every other package here
  // compiles against -- narrowing this to the consumers would leave the producer
  // unbuilt and hand every one of them a TS2307 for a subpath that is fine.
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
 * A MATCH THAT STARTS INSIDE node_modules IS NO LONGER DROPPED HERE, AND THAT IS
 * A CONSEQUENCE THAT MOVED RATHER THAN A GUARD DELETED. `packages/**` matches
 * straight into a member's installed dependencies, and a match beginning there
 * hands `packagesUnder` a directory whose package.json belongs to a stranger --
 * which used to be a permanent red about somebody else's file, because this
 * reader REPORTED what it found. It no longer reports anything: it refines a
 * fault the compilers' file lists found, and no file under an installed
 * dependency can be one of those. So a stranger's directory in this list is
 * scanned for an offender, never holds one, and is never named. The subtraction
 * that keeps that true lives beside the candidates, where an arm in
 * test/workspace-members.test.ts measures it; a second copy here would be an
 * unobservable branch carrying the reason its own removal made false.
 */
function excludedDirectories(root: string, entry: string): readonly string[] {
  const found: string[] = [];
  for (const match of globSync(entry, { cwd: root })) {
    found.push(...packagesUnder(join(root, match)));
  }
  return found;
}

/** The checkout these scripts ship in, which is where their compiler is found. */
const toolRoot = fileURLToPath(new URL("../", import.meta.url));

/** The compiler this repository declares, reached without asking PATH. */
const compiler = join(toolRoot, "node_modules", ".bin", "tsc");

/**
 * Compiles one package's published artifact, where one is configured.
 *
 * RUN FROM THE WORKSPACE ROOT WITH THE CONFIG NAMED RELATIVELY, which is the
 * same reason `typeCheckMember` in scripts/typecheck-workspaces.ts already
 * carries for its own half: tsc prints paths relative to the working directory,
 * so a build started inside the member reports `src/index.ts` -- and this
 * repository holds more than one `src/`, so that string identifies none of them.
 * THE COMPILER'S OWN DIAGNOSTIC CARRIES THE MEMBER, rather than a wrapper
 * printing the member on another line and leaving the joining to the reader.
 *
 * IT IS THIS CALL AND NOT THE PER-MEMBER CHECK THAT SPEAKS FIRST, which is why
 * the invocation is worth changing at all: `execFileSync` throws on a non-zero
 * exit, so a type error in a member's own source arrives HERE and the check
 * never runs -- and this function is reached by two Definition-of-Done checks,
 * the `bun test` preload as well as the fifth.
 *
 * NOT AN ARTIFACT CHANGE, and that is a property of the configs rather than of
 * tsc: no build config in this repository uses `extends`, so `rootDir`, `outDir`
 * and `include` resolve against the config file and not against the working
 * directory. Measured on the emitted bytes in test/build-diagnostics.test.ts,
 * because a config that gained an `extends` would move the artifact with every
 * check still green.
 */
function build(root: string, dir: string): void {
  const config = join(dir, "tsconfig.build.json");
  if (!existsSync(config)) {
    return;
  }
  execFileSync(compiler, ["-p", relative(root, config)], {
    cwd: root,
    stdio: "inherit",
  });
}

/**
 * The state every tool in this repository needs before it can believe what it
 * reads: the root package reachable by name, and every published artifact built
 * from current source.
 *
 * THE HANDLERS' dist/ IS NOT OPTIONAL AND NOT A CONVENIENCE. A handler publishes
 * dist/ and NOT src/ -- deno refuses to type-strip under node_modules -- so its
 * `exports` map names no source arm, and nothing resolves a handler by any other
 * route. NO `paths` MAPPING STANDS IN FOR THAT BUILD ANYWHERE, and since the
 * framework moved under packages/ there is not one in this repository at all:
 * the members are EXCLUDED from the root type check precisely so it cannot
 * answer for them, and a mapping added to spare this build would pull member
 * source back into the root program through module resolution, which `exclude`
 * does not stop.
 *
 * THE FRAMEWORK IS BUILT BEFORE THE HANDLERS AND IT IS NOT THIS FUNCTION SAYING
 * SO. A handler resolves `@atusy/tsudoi-language-server/types` through the
 * exports map to dist/types.d.ts, so a handler compiled against an unbuilt
 * framework fails at TS2307 -- an apparatus failure wearing a resolution
 * failure's clothes. What orders it is that BOTH HANDLERS DECLARE IT, read out
 * of their manifests by `buildOrder`. The loop knows nothing about which package
 * is which, which is what let the framework become a member with no edit here.
 *
 * NO PACKAGE IS LINKED INTO ANOTHER ANY MORE, AND THAT ABSENCE IS THE STORY THIS
 * FILE WAS THE LAST HOLDER OF. A `linkRootPackage` stood here writing an entry
 * bun would not, for one reason: the framework was the WORKSPACE ROOT and the
 * `workspaces` globs never match it. With the framework a member, `bun install`
 * writes those entries itself -- MEASURED, into each depending member's own
 * node_modules and RELATIVE, where the hand-written one was absolute. The
 * function's whole measured record is kept in the sprint 52 dashboard entry
 * rather than here: it is the evidence the move was worth making, and it is
 * about a route this repository no longer has.
 *
 * WHAT IT DOES NOT MAKE SAFE, unchanged from what the preload already records:
 * tsc writes dist/ and THEN exits non-zero, so a failed build leaves a fresh,
 * wrong artifact behind. Callers throw; nothing here cleans up.
 */
export function prepareWorkspace(root: string): void {
  for (const dir of buildOrder(root)) {
    build(root, dir);
  }
}

/**
 * The PACKAGE-SHAPED reading of an uncovered file: the sentence to print when
 * what is really wrong is that a package sits somewhere the root type check
 * excludes and the workspace configuration does not declare.
 *
 * IT SPEAKS FOR THE FILES INSIDE SUCH A PACKAGE AND FOR NO OTHERS, which is why
 * it hands back WHICH offenders it accounted for instead of a bare sentence. The
 * first spelling returned as soon as one offender sat inside one undeclared
 * package and the caller then threw the rest away -- MEASURED, a tree holding
 * `packages/forgotten/src/index.ts` AND `tools/elsewhere.ts` printed the package
 * sentence alone and never named the second file. That is the outcome the file
 * list exists to prevent one line below: a reader told about one offender fixes
 * it and meets the next on the following run.
 *
 * IT DOES NOT REQUIRE THAT EVERY OFFENDER BE IN A PACKAGE, and that refusal is
 * what keeps the demotion's promise: gating on all of them would answer ONE
 * missing `workspaces` entry with a wall of file sentences the moment anything
 * else were uncovered too, which is the regression the message was kept for.
 *
 * IT REFINES A FAULT AND NO LONGER DECIDES ONE, which is the ruling and not a
 * tidy-up. Deciding coverage by walking directories that hold a manifest is the
 * UNFAITHFUL reading -- it is why a file planted one level inside a declared
 * member ran under it and it said nothing -- and leaving it deciding alongside
 * the compilers' own file lists would give this repository TWO ANSWERS TO ONE
 * QUESTION that can disagree with every check green. So the file lists decide,
 * and this says the actionable thing about what they found: a reader told to
 * widen an `include` would be applying the wrong repair to a package that should
 * have been declared.
 *
 * THE NARROWING IS DISCLOSED RATHER THAN DISCOVERED: an undeclared package
 * holding NO TypeScript is no longer refused, because nothing about it is
 * unchecked. Pinned as a decision in test/workspace-members.test.ts.
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
function packageShapedFaults(
  root: string,
  members: readonly string[],
  offenders: readonly string[],
): { readonly sentences: readonly string[]; readonly explained: ReadonlySet<string> } {
  const tsconfigPath = join(root, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as Record<string, unknown>;
  const excluded = Array.isArray(tsconfig.exclude) ? tsconfig.exclude : [];
  const declared = new Set(members);
  const seen = new Set<string>();
  const sentences: string[] = [];
  const explained = new Set<string>();
  for (const entry of excluded) {
    if (typeof entry !== "string") {
      continue;
    }
    for (const found of excludedDirectories(root, entry)) {
      if (declared.has(found) || seen.has(found)) {
        continue;
      }
      seen.add(found);
      // ONE OF THE UNCOVERED FILES MUST BE INSIDE IT. An undeclared package the
      // file lists had nothing to say about is not a fault this reader is
      // allowed to invent -- that is exactly the second opinion the ruling
      // withdrew.
      const inside = offenders.filter((offender) => join(root, offender).startsWith(found + sep));
      if (inside.length === 0) {
        continue;
      }
      for (const offender of inside) {
        explained.add(offender);
      }
      sentences.push(
        `${relative(root, found)} holds a package.json, is excluded from ${tsconfigPath}, and is not declared by \`workspaces\` -- nothing type-checks it.`,
      );
    }
  }
  return { sentences, explained };
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
    const shown = execFileSync(compiler, ["-p", config, "--showConfig"]).toString("utf8");
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

/**
 * What one enumeration of the checkout reports, as paths relative to the root.
 *
 * A FAILED ENUMERATION IS NOT AN EMPTY ONE, which is the same asymmetry
 * `declaredMembers` keeps for `workspaces` and matters more here: this is the
 * only thing that can tell a source somebody wrote from an installed stranger or
 * a built artifact, so a root where it cannot run is a root where the refusal
 * below inspects nothing AND SAYS NOTHING. `I found no files` and `I was given
 * no way to find them` would then be the same exit 0.
 *
 * THE SEPARATOR IS A NUL BECAUSE THE ALTERNATIVE IS SILENT: git QUOTES a path
 * holding a newline or a non-ASCII byte when it writes newline-separated output,
 * and a quoted path matches no file on disk -- so such a file would be enumerated
 * as a candidate, matched against nothing, and reported as uncovered forever.
 */
function checkoutPaths(root: string, args: readonly string[]): readonly string[] {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.error !== undefined || result.status !== 0) {
    throw new Error(
      `${root} could not be enumerated as a checkout -- \`git ${args.join(" ")}\` did not answer (${result.error?.message ?? result.stderr.trim()}). Nothing here can say which TypeScript files this tree owns, which is not the same as its owning none.`,
    );
  }
  return result.stdout.split("\0").filter((one) => one.length > 0);
}

/** TypeScript somebody wrote, which is what this refusal is about. */
const typeScriptFile = /\.(?:[cm]?ts|tsx)$/;

/** The one shape excluded from that, and only while the programs say to. */
const declarationFile = /\.d\.[cm]?ts$/;

/** A tsconfig, wherever it sits and whatever suffix its author gave it. */
const configFile = /^tsconfig[^/]*\.json$/;

/** One compiler program as this refusal reads it. */
interface Program {
  /** Its config, relative to the root, which is what a message can name. */
  readonly config: string;
  /** The files its own `files`, `include` or default include matched. */
  readonly roots: readonly string[];
  /** Where it WRITES, if it writes. */
  readonly outDir: string | undefined;
  /** Whether it reports that it skips checking declaration bodies. */
  readonly skipsLibCheck: boolean;
}

/**
 * Reads one program the way the compiler reads it.
 *
 * `--noResolve` IS THE WHOLE READING AND NOT AN OPTIMISATION: without it the
 * list is the IMPORT CLOSURE, and a file that no `include` reaches is reported
 * as covered for exactly as long as somebody imports it. The day that import
 * goes, the file stops being checked and nothing says so. What is durable is
 * that a program's own inputs reach the file, so the roots are the answer.
 *
 * AND THE FILE LIST RATHER THAN THE JSON GLOBS, MEASURED: the default include
 * does NOT reach a directory or a file whose name begins with a dot, so a
 * hand-written expansion of that wildcard says the opposite of what the compiler
 * does -- for a file nothing else in this repository would notice either.
 *
 * THE EXIT CODE IS DELIBERATELY NOT THE DISCRIMINATOR, and each half of that is
 * measured on tsc 7.0.2 -- BUT THE TWO HALVES DO NOT PRINT THE SAME THING, which
 * the first spelling of this paragraph claimed and a re-measurement refuted. A
 * config whose include matches NOTHING exits 1 with ONE LINE on stdout: the
 * TS18003 diagnostic, and no file at all -- not its own roots, which it has none
 * of, and not the default library either. A config with an unresolvable `extends`
 * exits 1 AND STILL LISTS the default library and its own roots, which the type
 * check right after this one refuses by name. So the two failures cost different
 * things to a reader keyed to the exit: the first has nothing to lose and both
 * files that spawn this check stage it in about twenty trees, while the second
 * would have its real roots thrown away. Aborting on either would abort on a
 * config the compiler read fine. What decides instead is whether the compiler
 * could READ THE CONFIG AT ALL, asked of the reader that answers it:
 * `--showConfig` exits 1 with TS5058 for a config it cannot open, and exits 0 --
 * MEASURED -- even for one whose JSON is malformed, which it recovers from as an
 * empty configuration.
 */
function readProgram(root: string, config: string): Program {
  const absolute = join(root, config);
  const shown = spawnSync(compiler, ["-p", absolute, "--showConfig"], {
    cwd: root,
    encoding: "utf8",
  });
  if (shown.status !== 0) {
    // BY NAME, AND THE ALTERNATIVE IS LOUDER AND WRONG: a program treated as
    // covering nothing turns every file it did cover into an offender, so a run
    // answers one broken config with a list of innocent sources.
    throw new Error(
      `${config} is tracked here and the compiler cannot read it, so nothing can say which files it covers:\n${shown.stdout}${shown.stderr}`,
    );
  }
  const effective = JSON.parse(shown.stdout) as {
    compilerOptions?: { outDir?: unknown; skipLibCheck?: unknown };
  };
  const outDir = effective.compilerOptions?.outDir;
  const listed = spawnSync(compiler, ["-p", absolute, "--listFilesOnly", "--noResolve"], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    config,
    // A DIAGNOSTIC IS NOT A PATH: the same stream carries both, so what is taken
    // is what looks like an absolute path to a TypeScript file. A diagnostic
    // about a config carries the config's name and a position, so it ends in
    // neither.
    roots: listed.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => isAbsolute(line) && typeScriptFile.test(line)),
    // RESOLVED AGAINST THE CONFIG AND NOT THE ROOT, which is what `outDir` means
    // and what `prepareWorkspace` already relies on: no build config here uses
    // `extends`, so a relative output directory is relative to the file holding
    // it.
    outDir: typeof outDir === "string" ? resolve(dirname(absolute), outDir) : undefined,
    skipsLibCheck: effective.compilerOptions?.skipLibCheck === true,
  };
}

/**
 * Throws when a TypeScript file this checkout owns is in no compiler's program
 * -- the state in which a file is edited, run, and graded by nothing, while
 * every command in the Definition of Done exits 0.
 *
 * THE COMPILERS' OWN FILE LISTS ARE THE ONE DECIDER. Two readers answering `is
 * this file covered` is two answers to one question that can disagree with
 * everything green, and the JSON-glob reader is the unfaithful one: it walks
 * directories holding a manifest, so it ran straight over the file this refusal
 * was filed for and said nothing.
 *
 * THE SUBJECT IS TRACKED AND UNTRACKED BUT NOT IGNORED, because the moment this
 * exists for is a file JUST ADDED: reading the index alone would leave the
 * refusal reddening one run AFTER the commit that introduced the hazard. The two
 * standing exclusions come free and are READ rather than restated -- the ignore
 * file already names the installed strangers and every built artifact, in a file
 * edited elsewhere for its own reasons.
 *
 * A PERSONAL IGNORE FILE MUST NOT SHRINK IT, measured: a global ignore can hide
 * a file that is tracked and visible in every other checkout, so a subject that
 * honoured one would differ per developer. RESIDUE, NAMED RATHER THAN FIXED: a
 * per-checkout `info/exclude` cannot be neutralised the same way, and a file
 * under an ignored directory is not seen at all -- which this repository has one
 * of, deliberately, to hold what it does not account for.
 *
 * PROGRAMS ARE ENUMERATED FROM TRACKED FILES ALONE AND THE ASYMMETRY IS THE
 * POINT: a program is part of the declared verification surface and must be
 * COMMITTED to count, where a candidate is a hazard the moment it exists. Taking
 * untracked configs too would let a stray `tsconfig.tmp.json` claiming the whole
 * tree mark everything covered -- a silent, permanent green. Tracked-only fails
 * the other way, reddening until the new config is added, which is loud and
 * self-correcting.
 *
 * TWO SUBTRACTIONS, EACH FORCED BY A MEASUREMENT. An UNTRACKED path under a
 * program's own output directory is a file the compiler WROTE, and this check
 * BUILDS before it reads: without it every throwaway tree that builds reddens,
 * since a throwaway carries no ignore file and its emitted declaration is
 * untracked and in no program's roots. A path under an installed-dependency
 * directory will never be ours to check, for the reason already recorded beside
 * the package walker.
 *
 * `UNTRACKED` IS THE WHOLE OF THE FIRST ONE'S CLAIM AND IT SHIPPED WITHOUT IT,
 * which made this an exemption list with no name in it -- any path under any
 * DECLARED output directory, whether or not that program emits and whether or
 * not a compiler wrote the file. MEASURED, with a member check config carrying
 * `noEmit` and `outDir: "../../vendor"`: a tracked `vendor/probe.ts` in no
 * program's list went unreported, and reporting resumed the moment the `outDir`
 * was deleted -- so one config key silently excused a directory. A compiler-
 * written artifact is never in the index, so the index is what separates the two
 * and no reader has to trust the key.
 *
 * DECLARATION FILES ARE THE ONE EXCLUSION AND IT IS READ, NOT NAMED. With
 * library checking skipped -- which every config here sets -- a `.d.ts` is in a
 * program's inputs and its body is checked by NOTHING, so membership is the
 * wrong question to ask about it; MEASURED, one carrying two errors exits 0 with
 * the setting on and exits 1 naming both with it off. So the exclusion is read
 * from the programs' own reported setting and lapses the moment any of them
 * stops skipping. WHAT THIS CANNOT SEPARATE, and the guard is named for the half
 * it has: `included in a program` is not `type-checked`.
 *
 * NO EXEMPTION LIST, AND SHIPPING WITHOUT ONE IS A DECISION. MEASURED: every
 * candidate in this checkout is matched by an include of at least one program,
 * so a list would ship with no member -- and a facility with no user is where a
 * name is appended later with no review. The day a file genuinely needs to be
 * uncovered, the repair is to widen the program that ought to hold it, and this
 * refusal is what forces that conversation.
 *
 * WHAT IT DOES NOT DEFEND, DISCLOSED: a file covered by TWO programs stays green
 * when one stops covering it. The framework's source is in both its check config
 * and its build config, so narrowing one alone reddens nothing here. The
 * property is `some program includes it`, not per-program coverage.
 *
 * AND THE FAULT IT REPORTS IS NOT ALWAYS THE FAULT TO FIX: an uncovered file
 * inside a package the root excludes and `workspaces` does not declare is
 * answered by the package-shaped sentence instead of its own. Widening an
 * `include` is the wrong repair for a member nobody declared, and a missing
 * workspace entry answered with a wall of file sentences is a regression on the
 * message this check used to give. THE SUBSTITUTION IS PER FILE AND NOT PER RUN:
 * an offender that no `workspaces` entry would have covered is still named
 * beside the package sentence, because fixing the package would not have fixed
 * it.
 */
export function refuseUncoveredFiles(root: string, members: readonly string[]): void {
  const tracked = checkoutPaths(root, ["ls-files", "-z"]);
  const visible = checkoutPaths(root, [
    // NOT DECORATION: this machine's own global ignore hides a file that is
    // tracked in every checkout of this repository, and `--exclude-standard`
    // would honour it.
    "-c",
    "core.excludesFile=/dev/null",
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  const installed = (path: string): boolean => path.split("/").includes("node_modules");
  const inTheIndex = new Set(tracked);
  const programs = tracked
    .filter((path) => configFile.test(basename(path)) && !installed(path))
    .map((config) => readProgram(root, config));
  const covered = new Set(programs.flatMap((program) => program.roots));
  const written = programs.flatMap((program) =>
    program.outDir === undefined ? [] : [program.outDir],
  );
  const declarationsAreCheckedByNothing = programs.every((program) => program.skipsLibCheck);
  const offenders = visible.filter((path) => {
    if (!typeScriptFile.test(path) || installed(path)) {
      return false;
    }
    if (declarationsAreCheckedByNothing && declarationFile.test(path)) {
      return false;
    }
    const absolute = join(root, path);
    // ONLY WHILE NOBODY COMMITTED IT, which is the difference between a
    // subtraction and an exemption list: what this excuses is a file the
    // COMPILER WROTE, and a compiler-written artifact is never in the index. A
    // path that IS in the index is somebody's file whatever directory it sits
    // in, and excusing it would let one `outDir` -- on a program that need not
    // even emit -- silence a whole directory with no name written anywhere.
    if (!inTheIndex.has(path) && written.some((outDir) => absolute.startsWith(outDir + sep))) {
      return false;
    }
    return !covered.has(absolute);
  });
  if (offenders.length === 0) {
    return;
  }
  const { sentences, explained } = packageShapedFaults(root, members, offenders);
  // EVERY OFFENDER AND NOT THE FIRST, which is the opposite of the choice
  // `refuseMemberDirectoriesUnlikeTheUnscopedName` makes and for the reason that
  // separates them: there the fault is one manifest and the rest are correct,
  // where a directory nothing includes usually holds several files and a reader
  // told about one of them would fix it and meet the next on the following run.
  //
  // AND THAT IS WHY A PACKAGE SENTENCE DOES NOT END THE MESSAGE. It replaces the
  // files it SPEAKS FOR and nothing else; an offender somewhere no `workspaces`
  // entry would have covered is still named, in the same run, because fixing the
  // package would not have fixed it.
  const rest = offenders.filter((offender) => !explained.has(offender));
  const message = [...sentences];
  if (rest.length > 0) {
    message.push(
      `${rest.join(", ")} ${rest.length === 1 ? "is a TypeScript file" : "are TypeScript files"} in this checkout that no tsconfig includes, so nothing type-checks ${rest.length === 1 ? "it" : "them"}. Widen the \`include\` of the program that ought to hold what is named here -- there is deliberately no list to exempt a file from this check.`,
    );
  }
  throw new Error(message.join("\n"));
}
