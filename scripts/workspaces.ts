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
 * WHO THE WORKSPACE MEMBERS ARE, ANSWERED ONCE FOR EVERY TOOL THAT ASKS: the
 * fifth Definition-of-Done check, the guards it runs, and the `bun test`
 * preload's build.
 *
 * READ FROM `workspaces`, NEVER FROM A LIST HERE. With the members outside the
 * root type check's program, a member a list forgot is covered by nothing at
 * all, and both commands exit 0 having each done their half.
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

/** The manifest fields a build edge is read out of. */
const dependencyFields = ["dependencies", "peerDependencies"] as const;

interface OrderedPackage {
  readonly dir: string;
  readonly name: string | undefined;
  readonly needs: readonly { readonly producer: string; readonly field: string }[];
}

/** Reads one package as a node, with a missing `name` carried rather than refused. */
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
 * NO PACKAGE NAME IS SPELLED HERE, DELIBERATELY. A filter naming the framework
 * answers the same today and would quietly answer `there are no handlers` the
 * day that name changed -- every loop below it green and empty.
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
    // A package that declared itself would otherwise be its own consumer.
    return node.needs.some((need) => need.producer !== node.name && named.has(need.producer));
  });
}

/** Reports the packages that need each other, naming the declarations and not only the packages. */
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
 * THE TIE-BREAK IS NOT THE ORDER, and it is the one thing here a later reader
 * could mistake for the whole answer. Packages nothing separates are emitted by
 * path so two runs agree; packages a declaration separates are emitted by the
 * DECLARATION, which on this repository's own graph happens to agree with the
 * path order -- an accident of the names, pinned as an accident by an arm in
 * test/build-order.test.ts built on a tree where the two disagree.
 *
 * THE CYCLE THROW LANDS IN THE `bun test` PRELOAD, so it must stay reachable
 * only from a state this repository can never be in.
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
 * THE INVOCATION IS NOT AN ARTIFACT CHANGE ONLY WHILE NO BUILD CONFIG USES
 * `extends`: `rootDir`, `outDir` and `include` then resolve against the config
 * file rather than against the working directory, and a config that gained one
 * would move the artifact with every check still green.
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
 * reads: every published artifact built from current source, in the order
 * `buildOrder` derives from the manifests.
 *
 * A HANDLER'S dist/ IS NOT OPTIONAL. A handler publishes dist/ and NOT src/ --
 * deno refuses to type-strip under node_modules -- so its `exports` map names no
 * source arm and nothing resolves it by any other route. The framework's map
 * does end in one, which is why an absent dist/ is loud for a handler and silent
 * for it.
 *
 * WHAT THE ORDER IS FOR IS THE RUNTIMES AND CURRENCY, NOT THE COMPILER. A
 * handler's own build falls through the framework's source arm and exits 0
 * emitting the same declarations either way -- they name the framework BY
 * SPECIFIER and never by structure, so which file answered cannot appear in them
 * (test/handler-declaration-specifier.test.ts is the arm whose subject that
 * indirection is). What source buys is the framework AS IT IS NOW; an artifact
 * grades against whatever was last built.
 *
 * WHAT WRITES A dist/ AND WHAT REMOVES ONE, because a reader who finds an
 * artifact missing asks here first: WRITERS are this function and each member's
 * own `prepack`; NOTHING REMOVES A dist/ IT DOES NOT REWRITE ON THE SAME LINE --
 * and `rm -rf dist && tsc` is a conditional rather than an atomic swap, so a
 * `prepack` whose clear ran and whose compiler did not leaves the directory
 * gone.
 *
 * WHAT IT DOES NOT MAKE SAFE: tsc writes dist/ and THEN exits non-zero, so a
 * failed build leaves a fresh, wrong artifact behind. Callers throw; nothing
 * here cleans up.
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
 * A SUBPATH WITHOUT A `types` ARM IS SKIPPED RATHER THAN GUESSED AT: what is
 * being graded is where a TYPE CHECK lands, and a map that names no declaration
 * makes no promise for one to break.
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
 * and the working tree went with it. NO ARM CAN HOLD THIS, because an arm
 * proving it would have to point a recursive delete at the tree it runs in.
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
 * Where a published subpath actually lands, asked of the compiler itself: the
 * probe declares nothing and reaches each package only through an entry under
 * that package's own declared name.
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
 * NAMING THE FILE.
 *
 * WHAT BOUNDS IT IS THE ORDER AT ITS ONE CALL SITE AND NOTHING IN THE FUNCTION.
 * scripts/typecheck-workspaces.ts runs `prepareWorkspace` first, so what this
 * catches is an artifact that SURVIVED a build and still does not answer. A bare
 * pre-build `tsc --noEmit`, and a pack on an unbuilt tree, both pass under it
 * entirely -- and so does a framework artifact that answers WHILE STALE. A
 * second caller placed before a build would reach a state this has never been
 * pointed at.
 */
export function refuseSubpathsAnsweringFromSource(root: string, members: readonly string[]): void {
  const subpaths = publishedSubpaths(root, members);
  if (subpaths.length === 0) {
    return;
  }
  const { answered, attempted } = whereSubpathsLand(root, subpaths);
  // THE PAIR IS ABOUT THE DIAGNOSIS AND NOT ABOUT DETECTION: a specifier the
  // compiler never reached has no answer, so it is already an offender with this
  // pair or without it. What it buys is the reader's next move -- `never reached
  // the resolver` sends them to this probe, `answers from NOTHING` to the
  // artifact. WHAT MAKES IT FIRE IS A SUBPATH KEY CARRYING A CHARACTER THAT DOES
  // NOT SURVIVE A DOUBLE-QUOTED `import`, and no map in this workspace has one --
  // so nothing exercises this, and it is kept for the diagnosis rather than for a
  // red.
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
      // The trailer prints for every offender and describes two of the three: a
      // subpath that resolved to NO FILE graded no artifact at all, so its own
      // line above is the whole of what that state is.
      "A published subpath answering from anywhere but the artifact means the artifact is missing or half written, and every check below this one would have graded a file no consumer receives. Build the package, or repair its `exports` map.",
    ].join("\n"),
  );
}

/**
 * The PACKAGE-SHAPED reading of an uncovered file: the sentence to print when
 * what is really wrong is that a package sits somewhere the root type check
 * excludes and the workspace configuration does not declare.
 *
 * IT REFINES A FAULT AND NEVER DECIDES ONE. Deciding coverage by walking
 * directories that hold a manifest is the UNFAITHFUL reading -- it runs straight
 * over a file planted one level inside a declared member -- so the compilers'
 * file lists decide and this only says the actionable thing about what they
 * found.
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
      // ONE OF THE UNCOVERED FILES MUST BE INSIDE IT: an undeclared package the
      // file lists had nothing to say about is not a fault this reader may
      // invent, which is exactly the second opinion the ruling above withdrew.
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

/** A package name with any `@scope/` dropped, which is the whole of the relation below. */
function unscopedName(name: string): string {
  return name.slice(name.indexOf("/") + 1);
}

/**
 * Throws when a workspace member's directory is not its declared name with the
 * scope dropped -- one package spelled two ways, with nothing keeping the two
 * equal but whoever last edited one of them.
 *
 * OVER MEMBERS AS A CLASS, AND IT MUST NOT SPELL THE CONTAINER: a guard naming
 * `packages/` would be invalidated by the next move of that directory, and one
 * naming a member would leave every other member unpinned with nothing saying
 * so.
 */
export function refuseMemberDirectoriesUnlikeTheUnscopedName(
  root: string,
  members: readonly string[],
): void {
  for (const member of members) {
    const manifestPath = join(member, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    const name = manifest.name;
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
 * exclusion from the root type check exists to foreclose. A mapping answers the
 * same specifier without the member's node_modules and without the framework's
 * `exports` map, so every check stays green while the resolution a stranger will
 * actually take is the one nothing looked at.
 */
export function refuseMemberMappings(root: string, members: readonly string[]): void {
  for (const member of members) {
    const config = join(member, "tsconfig.json");
    // Absent is `typeCheckMember`'s to report, by name.
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
 * THE SEPARATOR IS A NUL BECAUSE THE ALTERNATIVE IS SILENT: git QUOTES a path
 * holding a newline or a non-ASCII byte when it writes newline-separated output,
 * and a quoted path matches no file on disk -- so such a file would be
 * enumerated as a candidate, matched against nothing, and reported as uncovered
 * forever.
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
 * EVERY TRACKED README, AS THE CLASS A DOCUMENTATION SWEEP IS ABOUT.
 *
 * NOT `declaredMembers` AND NOT `handlerMembers`: those answer WHICH PACKAGES,
 * and a README under `examples/`, `docs/` or the checkout root is neither. And
 * TRACKED is what makes a build's output, a scratch copy or a vendored
 * stranger's README not one of these.
 */
export function trackedReadmes(root: string): readonly string[] {
  return checkoutPaths(root, ["ls-files", "-z"]).filter((path) => basename(path) === "README.md");
}

/**
 * The submodules this checkout mounts, read as the MODE and not as a directory
 * that looks odd: a submodule is one index entry at mode 160000, which is the
 * only reading a tracked symlink or a name cannot fool.
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
 * THE FILE LISTING'S EXIT CODE IS DELIBERATELY NOT THE DISCRIMINATOR, and both
 * of its failures are ordinary here: a config whose include matches nothing
 * exits 1 with the TS18003 diagnostic alone, and one with an unresolvable
 * `extends` exits 1 while still listing its own roots -- which the type check
 * right after this refuses by name. What decides instead is whether the compiler
 * could READ THE CONFIG AT ALL, which `--showConfig` answers below.
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
  const references = Array.isArray(effective.references) ? effective.references : [];
  const listed = spawnSync(compiler, ["-p", absolute, "--listFilesOnly", "--noResolve"], {
    cwd: root,
    encoding: "utf8",
  });
  return {
    config,
    roots: listed.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => isAbsolute(line) && typeScriptFile.test(line)),
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
 * BEING GRADED rather than read off the platform's name, and probed read-only so
 * no candidate set measures this check's own footprint.
 *
 * FOLDING UNCONDITIONALLY IS THE FIX THAT BREAKS THE OTHER FILESYSTEM, WHICH NO
 * ARM ON A FOLDING MACHINE CAN REDDEN: where case IS significant those two
 * spellings are TWO FILES, one of them covered by nothing, and a fold would turn
 * a correct red green -- silently, and only on the machines where it matters.
 */
function foldsCase(root: string): boolean {
  return existsSync(join(root, "PACKAGE.JSON"));
}

/**
 * Throws when a TypeScript file this checkout owns is in no compiler's program
 * -- the state in which a file is edited, run, and graded by nothing, while
 * every command in the Definition of Done exits 0.
 *
 * THE COMPILERS' OWN FILE LISTS ARE THE ONE DECIDER, because two readers
 * answering `is this file covered` is two answers to one question that can
 * disagree with everything green.
 *
 * IT STOPS AT A SUBMODULE, AND THAT IS A RULING RATHER THAN THE ENUMERATOR'S
 * ACCIDENT: `--recurse-submodules` works for tracked files and is REFUSED with
 * `--others`, so recursing could only ever reach a submodule's committed half --
 * and a file JUST ADDED is the moment this whole refusal exists for.
 * Substantively, a submodule is somebody else's history at a commit this
 * checkout pins, and no `include` here can be widened to reach it.
 *
 * WHAT IT DOES NOT DEFEND, DISCLOSED: a file covered by TWO programs stays green
 * when one stops covering it. The property is `some program includes it`, not
 * per-program coverage.
 */
export function refuseUncoveredFiles(root: string, members: readonly string[]): void {
  const tracked = checkoutPaths(root, ["ls-files", "-z"]);
  const visible = checkoutPaths(root, [
    "-c",
    "core.excludesFile=/dev/null",
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  const installed = (path: string): boolean => path.split("/").includes("node_modules");
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
    if (!existsSync(absolute)) {
      return false;
    }
    if (declarationsAreCheckedByNothing && declarationFile.test(path)) {
      return false;
    }
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
  const rest = offenders.filter((offender) => !explained.has(offender));
  const message = [...sentences];
  if (rest.length > 0) {
    message.push(
      `${rest.join(", ")} ${rest.length === 1 ? "is a TypeScript file" : "are TypeScript files"} in this checkout that no tsconfig includes, so nothing type-checks ${rest.length === 1 ? "it" : "them"}. Widen the \`include\` of the program that ought to hold what is named here -- there is deliberately no list to exempt a file from this check.`,
    );
  }
  const enumerated = new Set(programs.map((program) => spelling(join(root, program.config))));
  const unreachable = [
    ...new Set(
      programs
        .flatMap((program) => program.references)
        .filter((reference) => !enumerated.has(spelling(reference))),
    ),
  ];
  // Asked here rather than beside the enumeration so a green run pays no spawn
  // for a sentence it would not print.
  const mounted = submodules(root);
  if (mounted.length > 0) {
    const one = mounted.length === 1;
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
