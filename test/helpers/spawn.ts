import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// import.meta.dir is Bun-only; the URL form works under both runtimes.
export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
export const cliPath = fileURLToPath(new URL("../../src/cli.ts", import.meta.url));

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** Runs the CLI to completion under bun and collects its exit code and streams. */
export function runCli(args: readonly string[]): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", cliPath, ...args], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
    child.stdin.end();
  });
}
