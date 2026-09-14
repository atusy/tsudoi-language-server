import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { repoRoot } from "./spawn.ts";

export interface LintResult {
  code: number | null;
  /** stdout and stderr merged in oxlint's stable, one-diagnostic-per-line Unix format. */
  output: string;
}

function runOxlint(cwd: string): Promise<LintResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("oxlint", ["--format", "unix", "."], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
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
 * Lints probe sources, keyed by their path relative to a throwaway project
 * root, under the repo's own .oxlintrc.json, and resolves with oxlint's exit
 * code and diagnostics.
 *
 * The probes live in a temp dir because they deliberately contain violations:
 * committed under the repo, plain `oxlint` would flag them and Definition of
 * Done check #2 could never pass. The config is COPIED rather than re-declared
 * here, so these tests track the file that actually ships.
 */
export async function lintProbe(files: Record<string, string>): Promise<LintResult> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-lint-"));
  try {
    copyFileSync(join(repoRoot, ".oxlintrc.json"), join(dir, ".oxlintrc.json"));
    for (const [path, source] of Object.entries(files)) {
      const target = join(dir, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source);
    }
    return await runOxlint(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
