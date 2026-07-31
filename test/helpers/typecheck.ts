import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { repoRoot } from "./spawn.ts";

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
 * `files` is set to the probe sources alone. Left to its default `include`,
 * tsc would walk the symlinked src/ and report TS2591 for every `node:` import
 * in cli.ts and config.ts -- a red that looks like a resolution failure and is
 * not one.
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
 * Type-checks the project at `cwd` and collects its exit code and diagnostics,
 * with any further flags appended.
 *
 * `--noEmit` IS NOT ONE OF THEM, so no caller can drop it: a probe that emitted
 * would leave a built artifact in the tree it is reading, which is the one
 * thing a probe about resolution must not do.
 *
 * A FLAG THAT CHANGES WHAT IS REPORTED RATHER THAN WHAT IS CHECKED is what this
 * parameter is for -- `--traceResolution` names the file each specifier reached,
 * which no exit code distinguishes from any other exit code.
 */
export function runTsc(cwd: string, args: readonly string[] = []): Promise<TypeCheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("tsc", ["--noEmit", ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
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
 * tests track the identity and the module that actually ship. Only
 * node_modules is borrowed for convenience -- src/types.ts imports tsudoi's own
 * declared dependencies, and installing them per probe would cost a network
 * fetch to prove nothing. Named that way rather than listed: the set of
 * declared dependencies grows, and a comment that spells it out goes stale at
 * the next one.
 */
export async function typeCheckProbe(
  files: Record<string, string>,
  editPackage: PackageEdit = () => {},
): Promise<TypeCheckResult> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-tsc-"));
  try {
    const packageJson: Record<string, unknown> = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as Record<string, unknown>;
    editPackage(packageJson);
    writeFileSync(join(dir, "package.json"), JSON.stringify(packageJson, null, 2));
    symlinkSync(join(repoRoot, "src"), join(dir, "src"), "dir");
    symlinkSync(join(repoRoot, "node_modules"), join(dir, "node_modules"), "dir");
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
