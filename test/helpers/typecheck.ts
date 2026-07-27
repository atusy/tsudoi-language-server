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
 * tsconfig.json: that one sets `types: ["node", "bun"]`, which a project
 * outside this repo has no reason to carry, and its absence would fail the
 * probe for a reason unrelated to the specifier under test.
 *
 * `files` is set to the probe sources alone. Left to its default `include`,
 * tsc would walk the symlinked src/ and report TS2591 for every `node:` import
 * in cli.ts and config.ts -- a red that looks like a resolution failure and is
 * not one.
 */
const compilerOptions = {
  target: "esnext",
  module: "esnext",
  moduleResolution: "bundler",
  allowImportingTsExtensions: true,
  noEmit: true,
  strict: true,
  skipLibCheck: true,
  types: [],
};

function runTsc(cwd: string): Promise<TypeCheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("tsc", ["--noEmit"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
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
 * to DELETE keys: the paired control for `@atusy/tsudoi/types` resolves is
 * that removing the exports entry makes the same check fail, and that half can
 * only be observed against a package.json nobody ships.
 *
 * package.json is COPIED from the repo and src/ is SYMLINKED to it, so these
 * tests track the identity and the module that actually ship. Only
 * node_modules is borrowed for convenience -- src/types.ts imports
 * vscode-languageserver-protocol, and installing it per probe would cost a
 * network fetch to prove nothing.
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
      JSON.stringify({ compilerOptions, files: Object.keys(files) }, null, 2),
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
