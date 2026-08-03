import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type ThrowawayPath, throwawayOnly } from "./helpers/perturbation.ts";
import { frameworkRoot, runCommand } from "./helpers/spawn.ts";
import { runTsc, typeCheckProbe } from "./helpers/typecheck.ts";

applySuiteDeadline();

/**
 * WHAT READS A PUBLISHED SUBPATH WHEN THE ARTIFACT IS NOT ALL THERE, taken as
 * WHICH FILE ANSWERED and never as an exit code.
 *
 * PARTIAL IS A PER-SUBPATH STATE VECTOR AND NOT A TREE-WIDE COLOUR, which is the
 * whole reason this file stages rather than describes. The compiler emits file
 * by file, so the window `rm -rf dist && tsc` passes through holds SOME subpaths
 * complete, some carrying their module and not their declaration, and some
 * entirely missing -- all at once. A uniform artifact-only tree would measure a
 * state no build ever passes through, and the criterion this answers names the
 * pack window because that is the window a person actually stands in.
 *
 * SO PARTIAL IS A WRITTEN STATE RATHER THAN A WINDOW ANYBODY HAS TO HIT: the
 * files here are created or omitted by hand, no compiler runs, and the race
 * question is answered by construction rather than by timing. Nothing here
 * copies this repository's own dist/ either -- a probe that read it would report
 * on whatever the last compiler run left there, and tsc WRITES dist/ before it
 * exits non-zero.
 *
 * WHY THIS IS NOT THE TEST PBI-60 REFUSES, said here because a reviewer will
 * reach for that refusal first. The refused test asserts THE RESIDUE and passes
 * for as long as the residue persists. THE STAGED TREE IS WRITTEN FROM THE
 * FRAMEWORK MANIFEST'S OWN ARMS, so the day that manifest stops naming a source
 * file for a subpath, this stager writes none, the compiler answers nothing
 * where it now answers source, and the disagreement arm below REDDENS. It stops
 * holding the moment the blocker does, which is the opposite failure direction.
 *
 * AND THE READERS DISAGREE IN ONE TREE, ASSERTED RATHER THAN ARRANGED. The
 * compiler-versus-runtime split is the finding, so it is written as the two
 * readings being DIFFERENT -- the day they agree, this reddens instead of
 * quietly measuring one of them.
 */

/** The framework's own manifest, read at test time -- never a copy that drifts. */
const manifest = JSON.parse(readFileSync(join(frameworkRoot, "package.json"), "utf8")) as {
  name: string;
  files: string[];
  exports: Record<string, Record<string, string>>;
};

/**
 * A subpath's state as the three things a build can leave behind.
 *
 * `artifact-only` IS THE MODULE WITHOUT ITS DECLARATION and not `dist without
 * src`: declaration emit writes the two separately, so this is the state the
 * compiler is IN partway through, and it is the one where the two readers give
 * different answers about the same subpath.
 */
type SubpathState = "complete" | "artifact-only" | "absent";

/** Whether a file this manifest names travels in the tarball, read off `files`. */
function isArtifact(file: string): boolean {
  return manifest.files.some((entry) => file.startsWith(`./${entry}/`));
}

/** The specifier a consumer writes for one of this manifest's subpaths. */
function specifierOf(subpath: string): string {
  return `${manifest.name}${subpath.slice(1)}`;
}

interface Staged {
  readonly probe: string;
  /**
   * The staged package, RESOLVED.
   *
   * A COMPILER REPORTS THE PATH IT WALKED AND NOT THE ONE IT WAS SENT DOWN: the
   * probe reaches this package through a link, and on macOS the temporary
   * directory is itself behind one, so an expectation built from the link's own
   * spelling differs from every answer by two prefixes and by nothing that
   * matters.
   */
  readonly pkg: string;
  dispose(): void;
}

/**
 * A package tree written FROM THE MANIFEST'S OWN ARMS, beside a probe that
 * reaches it the way a stranger does.
 *
 * NODE_MODULES AND A LINK, NOT A MAPPING AND NOT A PROJECT REFERENCE. An error
 * manufactured by either of those would grade a resolution nobody performs --
 * there is no mapping anywhere in this repository and a refusal enforces it --
 * so the probe declares nothing and the package is reachable only through an
 * entry under its own declared name.
 *
 * EVERY FILE IS EMPTY. The subject is WHICH ONE ANSWERS, so there is nothing
 * here for a compiler to have got wrong, and no build has to be waited for.
 */
function stage(states: Record<string, SubpathState>): Staged {
  const root: ThrowawayPath = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-unbuilt-")));
  const pkg = join(root, "package");
  const probe = join(root, "probe");
  const write = (path: string): void => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "export {};\n");
  };

  for (const [subpath, arm] of Object.entries(manifest.exports)) {
    const state = states[subpath] ?? "complete";
    for (const [condition, file] of Object.entries(arm)) {
      const artifact = isArtifact(file);
      // THE DECLARATION IS WHAT `artifact-only` WITHHOLDS, named by the
      // condition the manifest itself uses for it rather than by a suffix.
      const withheld =
        (state === "absent" && artifact) || (state === "artifact-only" && condition === "types");
      if (!withheld) {
        write(join(pkg, file));
      }
    }
  }
  writeFileSync(join(pkg, "package.json"), JSON.stringify(manifest));

  const specifiers = Object.keys(manifest.exports).map(specifierOf);
  mkdirSync(join(probe, "node_modules", dirname(manifest.name)), { recursive: true });
  symlinkSync(pkg, join(probe, "node_modules", manifest.name), "dir");
  writeFileSync(
    join(probe, "package.json"),
    JSON.stringify({ name: "unbuilt-artifact-probe", private: true, type: "module" }),
  );
  writeFileSync(
    join(probe, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        noEmit: true,
        strict: true,
        types: [],
      },
      files: ["probe.ts"],
    }),
  );
  writeFileSync(
    join(probe, "probe.ts"),
    specifiers.map((specifier) => `import "${specifier}";\n`).join(""),
  );
  writeFileSync(
    join(probe, "resolve.mjs"),
    `const specifiers = ${JSON.stringify(specifiers)};
const rows = {};
for (const specifier of specifiers) {
  let resolved = null;
  try {
    resolved = await import.meta.resolve(specifier);
  } catch (cause) {
    resolved = null;
  }
  let loaded = "ok";
  try {
    await import(specifier);
  } catch (cause) {
    loaded = String(cause);
  }
  rows[specifier] = { resolved, loaded };
}
console.log(JSON.stringify(rows));
`,
  );

  return {
    probe,
    pkg: realpathSync(pkg),
    dispose: (): void => rmSync(throwawayOnly(root), { recursive: true, force: true }),
  };
}

/** What one subpath's staged files actually are, asserted beside every reading. */
function onDisk(staged: Staged, subpath: string): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(manifest.exports[subpath] ?? {}).map(([condition, file]) => [
      condition,
      existsSync(join(staged.pkg, file)),
    ]),
  );
}

/**
 * WHICH FILE THE COMPILER SAYS ANSWERED, off its own trace.
 *
 * AN EXIT CODE CANNOT ANSWER THIS: source and artifact both answer at 0. And a
 * specifier that was NEVER ATTEMPTED produces the same empty answer as one the
 * compiler could not resolve, so the attempt is read separately -- without that
 * pair, `nothing asked` reads as `resolution failed`.
 */
async function compilerAnswers(staged: Staged): Promise<{
  exit: number | null;
  answered: Record<string, string | null>;
  attempted: string[];
  output: string;
}> {
  const { code, output } = await runTsc(staged.probe, ["--traceResolution"]);
  const answered: Record<string, string | null> = {};
  for (const [, specifier, file] of output.matchAll(
    /Module name '(.+?)' was successfully resolved to '(.+?)'/g,
  )) {
    answered[specifier] = file;
  }
  const attempted = [
    ...new Set([...output.matchAll(/======== Resolving module '(.+?)' from/g)].map(([, s]) => s)),
  ];
  return { exit: code, answered, attempted, output };
}

/** What a runtime says, as the URL it resolved and what a real import did. */
async function runtimeAnswers(
  staged: Staged,
  command: string,
): Promise<Record<string, { resolved: string | null; loaded: string }>> {
  const result = await runCommand(command, staged.probe);
  // The whole failure rides the assertion line: a runtime that could not start
  // produces no rows, and an empty object is not a reading.
  expect(`${command}: ${String(result.code)} ${result.stderr}`).toBe(`${command}: 0 `);
  return JSON.parse(result.stdout.trim()) as Record<
    string,
    { resolved: string | null; loaded: string }
  >;
}

const bun = "bun run ./resolve.mjs";
const deno = "deno run -A ./resolve.mjs";

/** The file a subpath's named condition points at, as the probe would find it. */
function fileFor(staged: Staged, subpath: string, condition: string): string {
  const file = manifest.exports[subpath]?.[condition];
  if (file === undefined) {
    throw new Error(`${subpath} carries no \`${condition}\` arm for this reading to expect`);
  }
  return join(staged.pkg, file);
}

/**
 * The file a runtime's own resolution landed on, as a path.
 *
 * RESOLVED ON BOTH SIDES for the reason the compiler's answers already are, and
 * only ever called where the import SUCCEEDED -- a URL for a file that does not
 * exist is exactly what `import.meta.resolve` hands back, and resolving one
 * would throw where the reading wants a comparison.
 */
function landedOn(url: string): string {
  return realpathSync(fileURLToPath(url));
}

test("with the artifact complete every subpath answers from it, for the compiler and both runtimes", async () => {
  const staged = stage({});
  try {
    // The staged tree's own state, beside the reading rather than assumed: every
    // arm of every subpath is on disk, so `answered from the artifact` is a
    // choice the resolver made and not the only file there was.
    for (const subpath of Object.keys(manifest.exports)) {
      expect(`${subpath}: ${JSON.stringify(onDisk(staged, subpath))}`).toBe(
        `${subpath}: {"types":true,"import":true,"default":true}`,
      );
    }

    const compiler = await compilerAnswers(staged);
    const fromBun = await runtimeAnswers(staged, bun);
    const fromDeno = await runtimeAnswers(staged, deno);

    // THE DEGENERATE THIS FILE IS BUILT AGAINST, MEASURED HERE RATHER THAN RUN
    // ONCE AND WRITTEN UP: a reading asserting only the compiler's exit is GREEN
    // IN ALL THREE STAGED STATES -- this one, the partial vector and the wholly
    // absent tree each assert `exit 0` below. So an exit code separates none of
    // them, and every arm here has to say which file answered or it says nothing.
    expect(compiler.exit).toBe(0);

    for (const subpath of Object.keys(manifest.exports)) {
      const specifier = specifierOf(subpath);
      expect(compiler.answered[specifier]).toBe(fileFor(staged, subpath, "types"));
      for (const runtime of [fromBun, fromDeno]) {
        expect(runtime[specifier]?.loaded).toBe("ok");
        expect(landedOn(runtime[specifier]?.resolved ?? "")).toBe(
          fileFor(staged, subpath, "import"),
        );
      }
    }
  } finally {
    staged.dispose();
  }
});

/**
 * THE PARTIAL VECTOR, IN ONE TREE: one subpath carrying its module and not its
 * declaration, one wholly missing from the artifact, and the rest complete.
 *
 * THE DISAGREEMENT IS THE PROPERTY. On the artifact-only subpath the compiler
 * falls through to source while both runtimes load the module that IS there --
 * two readers, one tree, one subpath, different files. That is the state an exit
 * code cannot see and the reason the compiler is read separately at all.
 */
test("with one subpath artifact-only and one absent, the compiler and the runtimes answer differently in the same tree", async () => {
  const [partial, missing, ...complete] = Object.keys(manifest.exports);
  if (partial === undefined || missing === undefined || complete.length === 0) {
    throw new Error("this manifest has too few subpaths to hold a partial vector at all");
  }
  const staged = stage({ [partial]: "artifact-only", [missing]: "absent" });
  try {
    // THE VECTOR ITSELF, ASSERTED: without this the readings below are equally
    // consistent with a stager that put every subpath in one state, which is the
    // degenerate this file is built against.
    expect(onDisk(staged, partial)).toEqual({ types: false, import: true, default: true });
    expect(onDisk(staged, missing)).toEqual({ types: false, import: false, default: true });
    for (const subpath of complete) {
      expect(onDisk(staged, subpath)).toEqual({ types: true, import: true, default: true });
    }

    const compiler = await compilerAnswers(staged);
    const fromBun = await runtimeAnswers(staged, bun);
    const fromDeno = await runtimeAnswers(staged, deno);

    // THE ARTIFACT-ONLY SUBPATH: the compiler reads SOURCE and the runtimes read
    // the MODULE, and the two answers are asserted to differ rather than each
    // being asserted alone.
    const partialSpecifier = specifierOf(partial);
    expect(compiler.answered[partialSpecifier]).toBe(fileFor(staged, partial, "default"));
    expect(fromBun[partialSpecifier]?.loaded).toBe("ok");
    expect(fromDeno[partialSpecifier]?.loaded).toBe("ok");
    expect(landedOn(fromDeno[partialSpecifier]?.resolved ?? "")).not.toBe(
      compiler.answered[partialSpecifier],
    );
    expect(landedOn(fromDeno[partialSpecifier]?.resolved ?? "")).toBe(
      fileFor(staged, partial, "import"),
    );

    // THE ABSENT SUBPATH: each runtime's own output names what it could not
    // read -- deno the FILE, bun the SPECIFIER -- and the compiler names
    // neither, because it answered.
    const missingSpecifier = specifierOf(missing);
    expect(compiler.answered[missingSpecifier]).toBe(fileFor(staged, missing, "default"));
    expect(compiler.attempted).toContain(missingSpecifier);
    expect(compiler.output).not.toContain(fileFor(staged, missing, "import"));
    expect(fromDeno[missingSpecifier]?.loaded).toContain(fileFor(staged, missing, "import"));
    expect(fromBun[missingSpecifier]?.loaded).toContain(missingSpecifier);

    // THE COMPLETE SUBPATHS IN THE SAME TREE, which is what makes the vector a
    // vector: a tree-wide colour would have moved these too.
    for (const subpath of complete) {
      expect(compiler.answered[specifierOf(subpath)]).toBe(fileFor(staged, subpath, "types"));
    }
    // AND THE COMPILER'S OWN COLOUR, recorded as a reading and not as a target:
    // it exits 0 over a package whose artifact is half written.
    expect(compiler.exit).toBe(0);
  } finally {
    staged.dispose();
  }
});

/**
 * THE ABSENT STATE, WHICH IS THE OTHER HALF THE CRITERION NAMES. Absent-only is
 * the shortcut a green tree cannot catch, so it is measured beside the partial
 * vector rather than instead of it.
 */
test("with no artifact at all the compiler answers from source and says nothing, while both runtimes name what they could not read", async () => {
  const states = Object.fromEntries(
    Object.keys(manifest.exports).map((subpath) => [subpath, "absent" as SubpathState]),
  );
  const staged = stage(states);
  try {
    const compiler = await compilerAnswers(staged);
    const fromBun = await runtimeAnswers(staged, bun);
    const fromDeno = await runtimeAnswers(staged, deno);

    for (const subpath of Object.keys(manifest.exports)) {
      expect(onDisk(staged, subpath)).toEqual({ types: false, import: false, default: true });
      const specifier = specifierOf(subpath);
      expect(compiler.answered[specifier]).toBe(fileFor(staged, subpath, "default"));
      expect(fromDeno[specifier]?.loaded).toContain(fileFor(staged, subpath, "import"));
      expect(fromBun[specifier]?.loaded).toContain(specifier);
    }
    // THE SILENCE, STATED AS THE READING IT IS: no diagnostic, exit 0, over a
    // package whose published artifact does not exist.
    expect(compiler.exit).toBe(0);
  } finally {
    staged.dispose();
  }
});

/**
 * THE BLOCKER, ASSERTED BESIDE THE STAGED STATES IT EXPLAINS -- and it is
 * this sprint's measured reason for refusing the deletion rather than a second
 * copy of a resolution test.
 *
 * PBI-60's fix was to DELETE the framework's source arms, so that with the
 * artifact absent the compiler names the file instead of quietly reading
 * another. It was taken and measured and REFUSED, and this is the cost that
 * refused it: THE HARNESS THIS SUITE GRADES CONSUMERS WITH HAS NO ARTIFACT AT
 * ALL. `typeCheckProbe` stages the framework's manifest with src/ symlinked and
 * no dist/, so `@atusy/tsudoi-language-server/types` resolves there through the
 * `default` arm in EVERY state of this repository -- and deleting that arm turns
 * this and two arms beside it from graded resolutions into TS2307.
 *
 * IT IS NOT THE TEST PBI-60 REFUSES, and the difference is the failure
 * direction. That one would assert THE RESIDUE and pass for as long as the
 * residue persists. This asserts THE BLOCKER: the day the harness stages a
 * dist/, or gains any route that does not end in source, this arm stops
 * depending on the arm -- the recorded weakening in test/perturbations.test.ts
 * goes GONE QUIET, and the refusal reopens itself with nobody having to
 * remember it.
 *
 * THE PAIR IS THE BLOCKER ITSELF AND NOT A SECOND OBSERVATION OF THE TREE: the
 * same probe, with the source arm removed from ITS OWN copy of the manifest,
 * cannot resolve the specifier at all. So the green above is that arm answering
 * and not some other route, and the reading holds in any tree -- including a
 * staged checkout with nothing built, where a `dist/ exists here` pair would be
 * red for a reason that is not the blocker.
 */
test("the harness that grades a consumer's type check reaches the framework through its source arm", async () => {
  const consumer = {
    "consumer.ts": [
      'import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";',
      "export type Factory = TsudoiConfigFactory;",
      "",
    ].join("\n"),
  };

  const asItStands = await typeCheckProbe(consumer);
  expect(asItStands.output).toBe("");
  expect(asItStands.code).toBe(0);

  const withoutTheSourceArm = await typeCheckProbe(consumer, (packageJson) => {
    for (const arm of Object.values(
      packageJson.exports as Record<string, Record<string, string>>,
    )) {
      delete arm.default;
    }
  });
  expect(withoutTheSourceArm.code).toBe(1);
  expect(withoutTheSourceArm.output).toContain("@atusy/tsudoi-language-server/types");
});
