import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// import.meta.dir is Bun-only; the URL form works under both runtimes.
export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const cliPath = fileURLToPath(new URL("../../src/cli.ts", import.meta.url));

/** Absolute path of a committed fixture config under test/fixtures. */
export function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
}

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** Runs the CLI to completion under bun and collects its exit code and streams. */
export function runCli(args: readonly string[]): Promise<CliResult> {
  return runCommand(`bun run ${cliPath}`, repoRoot, args);
}

/**
 * Runs a COMMAND LINE VERBATIM to completion in `cwd`, appending `args`.
 *
 * The command is the whole string, runtime included, split on spaces, for the
 * same reason LspSession.startCommand takes one: a route a reader is told to
 * follow and a route a test executes must be the same bytes, not two things
 * kept equal by hand.
 */
export function runCommand(
  command: string,
  cwd: string,
  args: readonly string[] = [],
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const [program, ...commandArgs] = command.split(" ");
    if (program === undefined) {
      reject(new Error(`not a command: ${command}`));
      return;
    }
    const child = spawn(program, [...commandArgs, ...args], {
      cwd,
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
