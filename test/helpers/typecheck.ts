import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { frameworkRoot, repoRoot } from "./spawn.ts";

export interface TypeCheckResult {
  code: number | null;
  /** stdout and stderr merged; tsc prints `path(line,col): error TSxxxx: ...`. */
  output: string;
}

/**
 * The repo's package.json parsed, for a probe to perturb before it is written
 * into the throwaway project. Mutate in place; the return value is ignored.
 */
export type PackageEdit = (packageJson: Record<string, unknown>) => void;

/**
 * The consumer's compiler options, deliberately NOT a copy of the repo's
 * tsconfig.json: that one also sets `bun`, which a project outside this repo
 * has no reason to carry, and its absence would fail the probe for a reason
 * unrelated to the specifier under test.
 *
 * `node` IS carried rather than left `[]`. MEASURED: a source that imports
 * `node:fs/promises` or `node:process` is reported TS2591 without both
 * @types/node installed AND `node` named here -- neither half alone is enough.
 * The example config completes paths, so it reads the filesystem, and a
 * config author who does that installs @types/node exactly as this does. The
 * probe would otherwise fail for a reason unrelated to the specifier, which is
 * the same standard the `bun` exclusion above is held to.
 *
 * `files` is set to the probe sources alone, and WHAT IT KEEPS OUT IS THE
 * SYMLINKED src/: left to its default `include`, tsc walks that too, and any
 * diagnostic in the framework's own source becomes a red on a probe whose subject
 * is a specifier. MEASURED with one type error planted in a COPIED src/ -- with
 * `files` the probe is exit 0, without it exit 1 naming that file.
 *
 * `skipLibCheck` IS ON, AND EVERY PROBE THAT TAKES THESE OPTIONS IS THEREFORE
 * BLIND TO ONE THING: whether src/types.ts re-exports from the BARE
 * `vscode-languageserver-protocol` or from `/node`. With it on, both exit 0.
 * The property that needs it OFF -- that the published subpath type-checks for
 * a consumer with no Node typings reachable -- is measured by
 * test/installed-without-node-types.test.ts, which passes its own value through
 * installConsumer's `typeCheck` rather than moving this line.
 *
 * WHY IT IS NOT SIMPLY TURNED OFF HERE, MEASURED rather than argued: setting it
 * `false` reddens NOTHING -- the whole of `bun test` stays green -- and it would
 * also SEE nothing, because `types: ["node"]` above is the other half of the
 * pair and cancels it. Only skipLibCheck OFF TOGETHER WITH `types: []`
 * discriminates, and `types: []` is what these options must not have: the
 * example config reads the filesystem, so the paragraph above would stop
 * holding. That is why the probe carries its own tsconfig instead.
 */
export const consumerCompilerOptions = {
  target: "esnext",
  module: "esnext",
  moduleResolution: "bundler",
  allowImportingTsExtensions: true,
  noEmit: true,
  strict: true,
  skipLibCheck: true,
  types: ["node"],
};

/**
 * A FLAG THAT CHANGES WHAT IS REPORTED RATHER THAN WHAT IS CHECKED, named as a
 * closed class because that is the only kind `runTsc` may be handed.
 * `--traceResolution` names the file each specifier reached, which no exit code
 * distinguishes from any other exit code; `--listFiles` names the program's
 * members without saying which specifier reached them, and the resolution
 * helper in test/package-shape.test.ts records why that makes it the weaker
 * reading rather than the cheaper one.
 */
export type TscReportFlag = "--traceResolution" | "--listFiles";

/**
 * Type-checks the project at `cwd` and collects its exit code and diagnostics,
 * with the requested reporting flags placed BEFORE `--noEmit`.
 *
 * `--noEmit` IS APPENDED RATHER THAN PREFIXED, AND THE ORDER IS THE WHOLE
 * GUARD: tsc takes the LAST occurrence of a flag, so a prefixed one is undone
 * by an argument that merely follows it. MEASURED on a one-file project --
 * `tsc --noEmit --noEmit false` WRITES ok.js; `tsc --noEmit false --noEmit`
 * writes nothing. A probe that emitted would leave a built artifact in the tree
 * it is reading, which is the one thing a probe about resolution must not do.
 *
 * THE TWO GUARANTEES HAVE DIFFERENT SCOPES AND NEITHER SUBSUMES THE OTHER,
 * which is why both are here and why the difference is spelled out rather than
 * collapsed into one sentence.
 *
 * THE ORDER IS UNCONDITIONAL AND IT IS ABOUT EMISSION ALONE: whatever argv
 * arrives, nothing is written -- `--listFiles` on its own emits ok.js,
 * measured, and `--listFiles --noEmit` does not.
 *
 * THE TYPE IS ABOUT WHAT IS CHECKED AND IT HOLDS ONLY AT THE CALL SITE, so WHAT
 * A CALLER WHO CASTS PAST `TscReportFlag` CAN STILL DO is grade a different
 * program at exit 0 while writing nothing: MEASURED on a file that fails
 * `--noEmit` with TS7006, both `--strict false --noEmit` and `--project
 * elsewhere --noEmit` exit 0 and leave the directory as they found it. That
 * bypass is left to the compiler rather than refused again at run time: a
 * run-time allowlist is a branch, a branch needs its own test, and every caller
 * of this helper is inside this repository and under `bunx tsc --noEmit`.
 */
export function runTsc(cwd: string, args: readonly TscReportFlag[] = []): Promise<TypeCheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("tsc", [...args, "--noEmit"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, output });
    });
  });
}

/**
 * Whether an entry is one of the packages this repository INSTALLED, rather than
 * one of the packages it merely CONTAINS.
 *
 * READ OFF `realpath` AND NOT OFF A LIST OF NAMES, which is what makes the
 * exclusion survive the next workspace member: the entry the day's `bun install`
 * writes is dropped here with no edit anywhere. A list would have to be kept in
 * step with `workspaces` by whoever remembered, and the failure of remembering
 * is a probe that goes green measuring nothing.
 *
 * THE BOUNDARY IS node_modules AND NOT THE CHECKOUT, because everything a
 * package manager put here IS inside the checkout: the installed packages
 * resolve into node_modules/.bun, and only a workspace link leaves it. Landing
 * outside the checkout altogether is somebody's install too and is carried.
 *
 * AN ENTRY THAT RESOLVES TO NOTHING IS DROPPED AND DOES NOT RAISE, and it is the
 * one state the wholesale symlink this replaced was immune to -- it resolved
 * nothing, so nothing could dangle. MEASURED: `realpathSync` on a dangling link
 * THROWS ENOENT naming the link, so without this the FIRST failure of every
 * probe-using test would be an error about node_modules rather than about the
 * probe. THE STATE IS THIS REPOSITORY'S ROUTINE ONE: the root's workspace links
 * are RELATIVE and dangle the instant a member directory is renamed or moved,
 * until `bun install` runs again -- which is precisely the next sprint's work.
 * Dropped rather than reported, on this repository's existing ruling that an
 * entry resolving to nothing PROVIDES nothing; a package a probe actually needs
 * going missing is caught by the green half of the pair in
 * test/probe-routes.test.ts.
 */
function isInstalledDependency(entry: string): boolean {
  if (!existsSync(entry)) {
    return false;
  }
  const at = realpathSync(entry);
  const checkout = realpathSync(repoRoot);
  const installed = realpathSync(join(repoRoot, "node_modules"));
  return at.startsWith(installed + sep) || !at.startsWith(checkout + sep);
}

/**
 * Gives a throwaway project the dependencies this repository INSTALLED, and
 * nothing this repository merely CONTAINS.
 *
 * A NAMED STEP RATHER THAN A LINE INSIDE THE PROBE BUILDER, because what a probe
 * can reach is a property of THE HARNESS: every probe gets whatever this hands
 * out, so a route added here is added to every control ever written against it,
 * and nothing at the probe's own site would say so.
 *
 * PER PACKAGE AND NOT THE WHOLE DIRECTORY, WHICH IS THE WHOLE POINT OF THE
 * FUNCTION. MEASURED with the wholesale symlink in place: a probe reached
 * packages/tsudoi-hover-wordnet and packages/tsudoi-completion-path by name --
 * packages it never installed, whose manifests it never copied and cannot
 * perturb. A probe that deleted `exports` from its own copy of a manifest
 * resolved anyway and reported EXIT 0, so the control written to prove the
 * exports map load-bearing measured nothing at all. That is a control LYING
 * rather than a control missing, which is the failure mode with no colour.
 *
 * SCOPE DIRECTORIES ARE WALKED INTO rather than linked whole: a scope holds
 * packages from different places, and this repository's `@atusy` holds exactly
 * the two the exclusion is for. Linking the scope would re-import wholesale
 * precisely what the per-package mirror is here to drop.
 *
 * THE ROUTE IT LEAVES IS THE PROBE'S OWN. A probe copies the manifest it is
 * about and writes its own sources; whatever it wants to be reachable, it
 * declares or symlinks for itself, where a reader of that probe can see it.
 */
export function mirrorInstalledDependencies(into: string): void {
  const installed = join(repoRoot, "node_modules");
  const modules = join(into, "node_modules");
  mkdirSync(modules, { recursive: true });
  for (const entry of readdirSync(installed)) {
    const source = join(installed, entry);
    if (!entry.startsWith("@")) {
      if (isInstalledDependency(source)) {
        symlinkSync(source, join(modules, entry), "dir");
      }
      continue;
    }
    for (const scoped of readdirSync(source)) {
      if (!isInstalledDependency(join(source, scoped))) {
        continue;
      }
      mkdirSync(join(modules, entry), { recursive: true });
      symlinkSync(join(source, scoped), join(modules, entry, scoped), "dir");
    }
  }
}

/**
 * Type-checks probe sources, keyed by their path relative to a throwaway
 * project root, against the repo's OWN package.json, and resolves with tsc's
 * exit code and diagnostics.
 *
 * The project is generated rather than committed because `editPackage` exists
 * to DELETE keys: the paired control for `@atusy/tsudoi-language-server/types` resolves is
 * that removing the exports entry makes the same check fail, and that half can
 * only be observed against a package.json nobody ships.
 *
 * package.json is COPIED from the repo and src/ is SYMLINKED to it, so these
 * tests track the identity and the module that actually ship. The installed
 * dependencies are MIRRORED rather than installed -- src/types.ts imports
 * tsudoi's own declared dependencies, and installing them per probe would cost a
 * network fetch to prove nothing. Named that way rather than listed: the set of
 * declared dependencies grows, and a comment that spells it out goes stale at
 * the next one.
 *
 * MIRRORED AND NOT BORROWED, which is the difference this probe's controls rest
 * on: the whole directory used to be handed over, and it carried entries leading
 * back into this checkout that answered the very specifiers a probe had
 * perturbed.
 */
export async function typeCheckProbe(
  files: Record<string, string>,
  editPackage: PackageEdit = () => {},
): Promise<TypeCheckResult> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-tsc-"));
  try {
    // THE FRAMEWORK'S MANIFEST AND ITS SOURCE, WHICH ARE NO LONGER THE CHECKOUT
    // ROOT'S. This probe stages a copy of THE PACKAGE -- its `exports` map is
    // what answers the specifiers the probes write, and the workspace root's
    // manifest carries none.
    const packageJson: Record<string, unknown> = JSON.parse(
      readFileSync(join(frameworkRoot, "package.json"), "utf8"),
    ) as Record<string, unknown>;
    editPackage(packageJson);
    writeFileSync(join(dir, "package.json"), JSON.stringify(packageJson, null, 2));
    symlinkSync(join(frameworkRoot, "src"), join(dir, "src"), "dir");
    mirrorInstalledDependencies(dir);
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify(
        { compilerOptions: consumerCompilerOptions, files: Object.keys(files) },
        null,
        2,
      ),
    );
    for (const [path, source] of Object.entries(files)) {
      const target = join(dir, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source);
    }
    return await runTsc(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
