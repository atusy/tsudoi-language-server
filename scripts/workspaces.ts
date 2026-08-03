import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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

/** One published subpath, as the specifier a stranger writes and the file we promise them. */
interface PublishedSubpath {
  readonly specifier: string;
  /** The package that declares it, for the message to send a reader somewhere. */
  readonly dir: string;
  /** The file its `types` arm names -- the artifact, and the only right answer. */
  readonly declaration: string;
}

/**
 * Every published subpath this workspace declares, with the file each promises.
 *
 * THE `types` ARM IS THE SUBJECT AND A SUBPATH WITHOUT ONE IS SKIPPED RATHER
 * THAN GUESSED AT: what is being graded is where a TYPE CHECK lands, and a map
 * that names no declaration makes no promise for one to break.
 */
function publishedSubpaths(root: string, members: readonly string[]): PublishedSubpath[] {
  const found: PublishedSubpath[] = [];
  for (const dir of [root, ...members]) {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
    const name = manifest.name;
    const map = manifest.exports;
    if (typeof name !== "string" || typeof map !== "object" || map === null) {
      continue;
    }
    for (const [subpath, arm] of Object.entries(map as Record<string, unknown>)) {
      const declaration = (arm as Record<string, unknown> | null)?.types;
      if (typeof declaration !== "string") {
        continue;
      }
      found.push({
        specifier: `${name}${subpath.slice(1)}`,
        dir,
        declaration: join(dir, declaration),
      });
    }
  }
  return found;
}

/**
 * A temporary directory this function made, refused unless it is one.
 *
 * THE GUARD IS ON THE MUTATION AND NOT ON THE CALLER, which is this
 * repository's own finding paid for the worst way: a staging function that
 * returned the checkout root reached a recursive delete that validated nothing,
 * and the working tree went with it. The destructive end read the right
 * QUANTITY -- a path -- against a subject that could not tell a throwaway from
 * the repository, because nothing asked. The same shape as
 * test/helpers/perturbation.ts's `throwawayOnly`, written again here because a
 * script may not import out of the suite.
 */
function throwawayDirectory(path: string, root: string): string {
  const resolved = realpathSync(path);
  const checkout = realpathSync(root);
  if (resolved === checkout || resolved.startsWith(checkout + sep)) {
    throw new Error(
      `${resolved} is inside ${checkout}, so nothing here will write to or delete it`,
    );
  }
  const throwaway = realpathSync(tmpdir());
  if (resolved !== throwaway && !resolved.startsWith(throwaway + sep)) {
    throw new Error(`${resolved} is not under ${throwaway}, so nothing here will delete it`);
  }
  return resolved;
}

/**
 * WHERE A PUBLISHED SUBPATH ACTUALLY LANDS, ASKED OF THE COMPILER ITSELF.
 *
 * THE ROUTE IS node_modules AND THE EXPORTS MAP AND NOTHING ELSE. No `paths`
 * mapping, no project reference: there is none anywhere in this repository, a
 * refusal keeps it that way, and a diagnostic manufactured by either would grade
 * a resolution no stranger performs. The probe declares nothing and reaches each
 * package only through an entry under that package's own declared name.
 *
 * `--traceResolution` AND NOT AN EXIT CODE, which is the whole reason this
 * function exists: source and artifact both answer at 0 with nothing printed, so
 * the compiler's colour cannot separate the file we publish from the file we
 * happen to have. The trace names the file, which is the only reading that can.
 *
 * THE PROBE'S OWN DIAGNOSTICS ARE IGNORED ON PURPOSE. It carries no dependency
 * of any package it links, so a declaration re-exporting an upstream name
 * reports TS2307 -- about the probe's tree and never about the subpath under
 * reading, which the trace has already answered by then.
 */
function whereSubpathsLand(
  root: string,
  subpaths: readonly PublishedSubpath[],
): { answered: Map<string, string>; attempted: Set<string> } {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-subpath-probe-"));
  try {
    const probe = throwawayDirectory(dir, root);
    for (const { specifier, dir: packageDir } of subpaths) {
      const name = specifier
        .split("/")
        .slice(0, specifier.startsWith("@") ? 2 : 1)
        .join("/");
      const entry = join(probe, "node_modules", name);
      if (!existsSync(entry)) {
        mkdirSync(dirname(entry), { recursive: true });
        symlinkSync(packageDir, entry, "dir");
      }
    }
    writeFileSync(
      join(probe, "package.json"),
      JSON.stringify({ name: "tsudoi-subpath-probe", private: true, type: "module" }),
    );
    writeFileSync(
      join(probe, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "esnext",
          module: "esnext",
          moduleResolution: "bundler",
          noEmit: true,
          types: [],
        },
        files: ["probe.ts"],
      }),
    );
    writeFileSync(
      join(probe, "probe.ts"),
      subpaths.map(({ specifier }) => `import "${specifier}";\n`).join(""),
    );
    const run = spawnSync(compiler, ["--traceResolution"], {
      cwd: probe,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
    const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
    const answered = new Map<string, string>();
    for (const [, specifier, file] of output.matchAll(
      /Module name '(.+?)' was successfully resolved to '(.+?)'/g,
    )) {
      answered.set(specifier, file);
    }
    return {
      answered,
      attempted: new Set(
        [...output.matchAll(/======== Resolving module '(.+?)' from/g)].map(([, name]) => name),
      ),
    };
  } finally {
    rmSync(throwawayDirectory(dir, root), { recursive: true, force: true });
  }
}

/**
 * REFUSES A PUBLISHED SUBPATH THAT ANSWERS FROM ANYTHING BUT THE ARTIFACT,
 * NAMING THE FILE -- which is the state this repository has carried in prose and
 * pinned by nothing.
 *
 * WHAT IT IS FOR. tsudoi's `exports` map ends in a source arm, so with the
 * artifact missing or half written the compiler PROBES FOR THE FILE, FALLS
 * THROUGH AND READS A DIFFERENT ONE AT EXIT 0 -- while both runtimes fail
 * loudly. Two readers, one tree, different files, and no colour anywhere says
 * so. test/unbuilt-artifact.test.ts stages that disagreement; this is the thing
 * that ends it for a workspace this check is pointed at.
 *
 * WHAT IT DOES NOT RULE OUT, AND IT IS THE LARGER HALF. It runs AFTER the build,
 * so the state it catches is an artifact that SURVIVED one and still does not
 * answer -- a partial emit, a build skipped for a package with no build config,
 * a dist/ removed by hand between the build and the check. IT DOES NOTHING FOR A
 * BARE `tsc --noEmit` ON A CHECKOUT NOBODY HAS BUILT: that command is the fourth
 * Definition-of-Done check and nothing in this repository owns its invocation.
 * Reaching it would take a `paths` mapping or a project reference, which is the
 * one manufacture this workspace refuses by name.
 *
 * IT NAMES THE FILE AND NEVER A COUNT: what a reader needs is which subpath,
 * which file answered, and which file was promised.
 */
export function refuseSubpathsAnsweringFromSource(root: string, members: readonly string[]): void {
  const subpaths = publishedSubpaths(root, members);
  if (subpaths.length === 0) {
    return;
  }
  const { answered, attempted } = whereSubpathsLand(root, subpaths);
  // THE PAIR, AND WITHOUT IT AN EMPTY OFFENDER LIST IS SATISFIED BY A PROBE THAT
  // RESOLVED NOTHING AT ALL: every specifier this reads about was one the
  // compiler was asked, and a specifier it never reached is a fault in the probe
  // rather than a subpath that answered correctly.
  const unasked = subpaths.filter(({ specifier }) => !attempted.has(specifier));
  if (unasked.length > 0) {
    throw new Error(
      `${unasked.map(({ specifier }) => specifier).join(", ")} never reached the resolver, so nothing here read where ${unasked.length === 1 ? "it lands" : "they land"}.`,
    );
  }
  const offenders = subpaths.filter(({ specifier, declaration }) => {
    const landed = answered.get(specifier);
    return (
      landed === undefined ||
      !existsSync(declaration) ||
      realpathSync(landed) !== realpathSync(declaration)
    );
  });
  if (offenders.length === 0) {
    return;
  }
  throw new Error(
    [
      ...offenders.map(({ specifier, declaration }) => {
        const landed = answered.get(specifier);
        return `${specifier} answers from ${landed === undefined ? "NOTHING" : relative(root, landed)}, where its \`types\` arm promises ${relative(root, declaration)}.`;
      }),
      "A published subpath answering from anywhere but the artifact means the artifact is missing or half written, and every check below this one would have graded a file no consumer receives. Build the package, or repair its `exports` map.",
    ].join("\n"),
  );
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

/**
 * The submodules this checkout mounts, which is where its subject STOPS.
 *
 * READ AS THE MODE AND NOT AS A DIRECTORY THAT LOOKS ODD: a submodule is one
 * index entry at mode 160000, and asking git for the mode is the only reading
 * that cannot be fooled by a tracked symlink or by a name.
 *
 * IT IS ASKED ONLY WHEN SOMETHING IS ALREADY BEING REPORTED, at the one call
 * below: a green run pays no spawn for a sentence it would not print.
 */
function submodules(root: string): readonly string[] {
  return checkoutPaths(root, ["ls-files", "--stage", "-z"])
    .filter((entry) => entry.startsWith("160000 "))
    .flatMap((entry) => {
      const at = entry.indexOf("\t");
      return at === -1 ? [] : [entry.slice(at + 1)];
    });
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
  /** The configs it declares as project references, as absolute paths. */
  readonly references: readonly string[];
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
    references?: unknown;
  };
  const outDir = effective.compilerOptions?.outDir;
  // REPORTED RATHER THAN RE-READ FROM THE FILE, MEASURED: `--showConfig` echoes
  // `references` with the path as the author wrote it, so the same reader that
  // answers every other question here answers this one.
  //
  // A REFERENCE MAY NAME A DIRECTORY, which tsconfig defines as the
  // `tsconfig.json` inside it. Both spellings are resolved to the config a
  // reader would have to open, because what the caller compares them against is
  // the list of configs this check enumerated.
  const references = Array.isArray(effective.references) ? effective.references : [];
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
    references: references.flatMap((reference) => {
      const path = (reference as { path?: unknown }).path;
      if (typeof path !== "string") {
        return [];
      }
      const target = resolve(dirname(absolute), path);
      return [target.endsWith(".json") ? target : join(target, "tsconfig.json")];
    }),
  };
}

/**
 * Whether this filesystem tells `Foo.ts` and `foo.ts` apart, ASKED OF THE TREE
 * BEING GRADED rather than read off the platform's name.
 *
 * WHY IT IS ASKED AT ALL: the compiler answers with the spelling ITS CONFIG
 * used and git answers with the spelling THE INDEX holds, and where the
 * filesystem folds case those two strings can denote ONE FILE and compare
 * unequal. MEASURED on this machine, whose checkout and whose temporary
 * directory both fold: a tracked `src/Foo.ts` under a config naming
 * `src/foo.ts` is compiled -- tsc exits 0 and lists `src/foo.ts` -- and was
 * reported as covered by nothing, with the repair named being to widen an
 * `include` that is already reaching the file. A FALSE RED, and the one thing
 * this check must never produce.
 *
 * FOLDING UNCONDITIONALLY IS THE FIX THAT BREAKS THE OTHER FILESYSTEM: where
 * case IS significant those two spellings are TWO FILES, one of them covered by
 * nothing, and a fold would turn a correct red green -- silently, and only on
 * the machines where it matters. So the fold is gated on the answer here.
 *
 * A READ-ONLY PROBE, AND IT WRITES NOTHING INTO THE TREE IT IS GRADING: a
 * candidate set that depended on a file this check had just created would be
 * measuring its own footprint. What is probed is the root's `package.json`,
 * asked for in a spelling no repository ships -- the fifth check has already
 * refused a root without one, so there is no case where this asks about a file
 * that is not there. THE ONE FALSE ANSWER IT CAN GIVE IS NAMED: a case-sensitive
 * checkout that really does hold a file called `PACKAGE.JSON` beside its
 * manifest would be read as folding, which costs this check the ability to
 * separate two spellings of one name in that tree alone.
 */
function foldsCase(root: string): boolean {
  return existsSync(join(root, "PACKAGE.JSON"));
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
 * edited elsewhere for its own reasons. AND IT IS WHAT IS ON DISK: an index
 * entry outlives the file, so a candidate set that did not ask would name a path
 * that is not there. That arm and its reason sit beside the filter.
 *
 * AND IT STOPS AT A SUBMODULE, WHICH IS A RULING AND NOT THE ENUMERATOR'S
 * ACCIDENT. MEASURED on a checkout with a real submodule at `vendor/pkg` holding
 * `vendor/pkg/probe.ts`: both calls below report the GITLINK PATH ALONE, and
 * `--others` does not descend either, so a file inside a submodule -- tracked
 * there or just written -- is invisible to this refusal and this check exits 0
 * over it.
 *
 * IT IS RULED THAT WAY RATHER THAN REPAIRED, AND THE DECIDING FACT IS THE
 * ENUMERATOR'S: `git ls-files --recurse-submodules` WORKS, and the same flag
 * WITH `--others` IS REFUSED -- measured, exit 128, `unsupported mode`. So
 * recursing could only ever reach a submodule's TRACKED files, leaving one
 * subject with two rules: tracked-and-untracked outside a submodule, tracked
 * only inside it. The moment this whole refusal exists for is a file JUST ADDED,
 * and that is exactly the half a recursing subject would silently lose.
 * SUBSTANTIVELY: a submodule is somebody else's history at a commit this
 * checkout pins. No `include` here can be widened to cover it and no commit here
 * can move it, so a report about it would be a permanent red on a file no edit
 * in this tree repairs -- the reason already recorded beside the installed
 * strangers, arriving for a second class of file. Its own checkout grades it.
 *
 * SO THE REFUSAL SAYS SO WHEN IT SPEAKS AT ALL, because a subject that silently
 * excludes a whole class of file is the shape this refusal was built to close: a
 * run that reports anything, in a tree that mounts a submodule, names the
 * submodule and says its files were never candidates. It can also say that
 * nothing it named is inside one, which follows from the measurement above
 * rather than from a filter.
 *
 * A LINKED WORKTREE USED AS THE ROOT IS ENUMERATED NORMALLY and needs no arm:
 * its `.git` is a file rather than a directory, which changes nothing about what
 * `ls-files` answers.
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
 * program's own output directory is left alone, because this check BUILDS
 * before it reads: without that, every throwaway tree that builds reddens,
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
 * was deleted -- so one config key silently excused a directory.
 *
 * AND THE INDEX BUYS ONE DIRECTION RATHER THAN AN IDENTITY, which the repair's
 * own first spelling asserted and this one does not. A compiler-written artifact
 * is never committed, so BEING IN THE INDEX rules that reading out -- and
 * nothing here reads the other way, because nothing in a tree can: an untracked
 * HAND-WRITTEN file under a declared output directory is subtracted exactly like
 * an emitted one. WHAT THE SUBTRACTION ACTUALLY BUYS is therefore that no
 * COMMITTED file is ever excused by an `outDir`, which is the half that was
 * going wrong; the residue is a file somebody wrote there and has not committed,
 * and it self-corrects the moment they do. Asserting the converse would be the
 * same overclaim, one sentence smaller, that this repair was written to retire.
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
 * PROJECT REFERENCES ARE NOT FOLLOWED, AND THAT IS A RULING WITH A MEASUREMENT
 * UNDER IT. Programs are read ONE AT A TIME and never as a build graph, so a
 * referenced project's files do not enter its parent's list -- a root config
 * referencing `lib/project.json` leaves `lib/x.ts` reported, and that config's
 * own name fails the `tsconfig*.json` filter, so nothing enumerates it either.
 * WHAT DECIDES IT IS WHO ACTUALLY CHECKS THE FILE: MEASURED, `tsc -p` on the
 * PARENT -- which is the form the root check and every member check take --
 * reports NOTHING about a type error in the referenced project's source, where
 * `-p` on the referenced config and `tsc -b` on the parent each name it. So
 * following the reference would mark covered a file NO COMMAND IN THE DEFINITION
 * OF DONE READS, which is a false green about the exact state this refusal
 * exists for; and it would admit as a coverage source a config that need not be
 * tracked, which is the stray-config hazard arriving by another door.
 *
 * SO A REFERENCED CONFIG MUST BE ENUMERATED IN ITS OWN RIGHT -- tracked, and
 * named `tsconfig*.json`. One already named that way is covered today because it
 * is independently enumerated, which was luck and is hereby the rule. AND THE
 * REFUSAL SAYS SO WHERE IT WOULD OTHERWISE MISLEAD: a run that names files while
 * some enumerated program declares a reference nothing here reaches names that
 * reference too, and the RENAME, because `widen an include` is the wrong repair
 * for a file another project already holds.
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
  // BOTH SIDES THROUGH ONE FUNCTION, WHICH IS THE HALF A FIX HERE GETS WRONG:
  // the compiler's strings and the joined index paths agree today only because
  // both are built from the same root, so canonicalising the candidate alone
  // would move every prefix and redden the whole file.
  //
  // AND IT REACHES EVERY COMPARISON WITH TWO PRODUCERS, WHICH IS THE LINE AND
  // NOT `the coverage one`. Two spellings can only disagree where two things
  // produced them: the compiler's file list against the index, and the
  // compiler's reported `outDir` against the index. MEASURED on the second,
  // which the first spelling of this reason left out -- a build config carrying
  // `outDir: "Out"` over a directory already on disk as `out` emits into `out`,
  // and its declaration was reported as covered by nothing: the same false red,
  // in the same function. What is left spelling-exact is every comparison with
  // ONE producer -- the installed filter and the suffix tests match a git path
  // against a literal written here, and a literal cannot be spelled two ways.
  const spelling: (path: string) => string = foldsCase(root)
    ? (path) => path.toLowerCase()
    : (path) => path;
  const inTheIndex = new Set(tracked);
  const programs = tracked
    .filter((path) => configFile.test(basename(path)) && !installed(path))
    .map((config) => readProgram(root, config));
  const covered = new Set(programs.flatMap((program) => program.roots).map(spelling));
  const written = programs.flatMap((program) =>
    program.outDir === undefined ? [] : [program.outDir],
  );
  const declarationsAreCheckedByNothing = programs.every((program) => program.skipsLibCheck);
  const offenders = visible.filter((path) => {
    if (!typeScriptFile.test(path) || installed(path)) {
      return false;
    }
    const absolute = join(root, path);
    // GONE FROM THE WORKTREE AND STILL IN THE INDEX, WHICH IS A FALSE RED AND NOT
    // A MISSED ONE. `--cached` reports a path whose file has been deleted, and no
    // compiler's list can hold a file that is not on disk -- so the deletion
    // alone made an offender, and the run names a path that does not exist and
    // sends its reader to widen an `include` for it. Nothing here is unchecked:
    // a file that is not there is run by nothing and graded by nothing, and the
    // index agrees again the moment the deletion is committed.
    //
    // ITS OWN ARM AND NOT THE CONFIG ONE, which is the neighbouring state and a
    // different answer: a tracked config gone from the worktree is refused BY
    // NAME, because a program nobody can read turns every file it covered into
    // an offender. There the absence is the fault; here it is the repair.
    //
    // A DANGLING SYMLINK GOES WITH THEM, disclosed rather than branched on:
    // `existsSync` follows the link, so a `.ts` link pointing at nothing is
    // dropped too. It is not a file any compiler could read either.
    if (!existsSync(absolute)) {
      return false;
    }
    if (declarationsAreCheckedByNothing && declarationFile.test(path)) {
      return false;
    }
    // ONLY WHILE NOBODY COMMITTED IT, which is the difference between a
    // subtraction and an exemption list: a compiler-written artifact is never in
    // the index, so a path that IS in the index is somebody's file whatever
    // directory it sits in, and excusing it would let one `outDir` -- on a
    // program that need not even emit -- silence a whole directory with no name
    // written anywhere. THE TEST READS ONLY THAT WAY: untracked here does not
    // make a file one the compiler wrote, and a hand-written one nobody has
    // committed is subtracted with the artifacts.
    if (
      !inTheIndex.has(path) &&
      written.some((outDir) => spelling(absolute).startsWith(spelling(outDir) + sep))
    ) {
      return false;
    }
    return !covered.has(spelling(absolute));
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
  // AND THE ONE QUALIFICATION THIS CHECK OWES ITS OWN REPAIR. Everything above
  // tells a reader to widen an `include`, which is the WRONG edit for a file
  // some other project already covers -- and a project this enumeration cannot
  // see is exactly what a reference to a config named anything else is. Named
  // here rather than followed, for the ruling recorded above.
  const enumerated = new Set(programs.map((program) => spelling(join(root, program.config))));
  const unreachable = [
    ...new Set(
      programs
        .flatMap((program) => program.references)
        .filter((reference) => !enumerated.has(spelling(reference))),
    ),
  ];
  // AND THE OTHER BOUNDARY OF THE SUBJECT, SAID ONLY WHERE THERE IS ONE TO SAY
  // IT ABOUT. A reader handed a file list reasonably takes it for the whole
  // answer, and inside a submodule it is not the answer at all -- nothing there
  // was ever a candidate. Asked here rather than beside the enumeration so a
  // green run pays no spawn for it.
  const mounted = submodules(root);
  if (mounted.length > 0) {
    const one = mounted.length === 1;
    // THE LAST CLAUSE IS DERIVED AND NOT ASSERTED, which is the difference
    // between a sentence that is true and one that was true when it was
    // measured. `nothing named above is inside one` is a claim about what git
    // does at a gitlink, and it holds on git 2.54 for an INITIALISED submodule
    // and for a DEINITIALISED one alike -- measured, `--others` descends into
    // neither. Reading it off the offenders instead costs one pass and cannot go
    // stale behind a version of git nobody here has run.
    const named = offenders.some((offender) =>
      mounted.some((at) => offender === at || offender.startsWith(`${at}/`)),
    );
    message.push(
      `${mounted.join(", ")} ${one ? "is a submodule" : "are submodules"} of this checkout and ${one ? "its files were" : "their files were"} never candidates here -- a submodule is somebody else's history at a commit this tree pins, graded by its own checkout, and no \`include\` here could be widened to reach it.${named ? "" : ` Nothing named above is inside ${one ? "it" : "them"}.`}`,
    );
  }
  if (unreachable.length > 0) {
    const one = unreachable.length === 1;
    message.push(
      `${unreachable.map((reference) => relative(root, reference)).join(", ")} ${one ? "is declared as a project reference and is" : "are declared as project references and are"} enumerated here by nothing -- a program counts only while it is TRACKED and named \`tsconfig*.json\`, and a referenced project's files never enter its parent's list. If anything named above is covered only by ${one ? "that project" : "one of those projects"}, RENAME the config so this enumeration finds it, or COMMIT it if the name is already right -- either way, not by widening an \`include\`.`,
    );
  }
  throw new Error(message.join("\n"));
}
