import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
// TYPE-ONLY, and it has to stay that way: lsp.ts imports repoRoot from here, so
// a value import would close the cycle. A type import erases at emit.
import type { Runtime } from "./lsp.ts";

// import.meta.dir is Bun-only; the URL form works under both runtimes.
export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const cliPath = fileURLToPath(new URL("../../src/cli.ts", import.meta.url));

/** Absolute path of a committed fixture config under test/fixtures. */
export function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
}

export interface CliResult {
  code: number | null;
  /** Every byte stdout carried, decoded ONCE over the whole stream. */
  stdout: string;
  /** Every byte stderr carried, decoded ONCE over the whole stream. */
  stderr: string;
  /**
   * The same stderr bytes decoded CHUNK BY CHUNK -- the defect's own view of
   * them, kept deliberately.
   *
   * It exists so a test can assert that its payload REALLY DID straddle a pipe
   * chunk boundary on the run that just happened, instead of hoping it did. A
   * Japanese payload short enough to arrive whole is decoded identically both
   * ways, and a test written against one would be born green by accident and
   * pass with the defect present. Comparing the two decodings turns that hope
   * into an assertion that fails when the payload is too small, and fails again
   * if the single decode is ever reverted to a per-chunk one.
   *
   * stdout has no counterpart because nothing puts a non-ASCII payload on it
   * through this helper: stdout carries framed protocol, and LspSession is
   * where that is measured.
   */
  stderrPerChunk: string;
}

/**
 * Runs the CLI to completion under the GIVEN runtime and collects its exit code
 * and streams.
 *
 * The runtime is a parameter for the same reason LspSession.start has taken one
 * since Sprint 1: every claim this project makes about failing is a claim about
 * both runtimes, and a helper hardcoding `bun` made the deno half of the
 * config-failure contract unrunnable rather than merely unrun.
 */
export function runCli(runtime: Runtime, args: readonly string[]): Promise<CliResult> {
  return runCommand(`${runtime.command} ${runtime.runArgs.join(" ")} ${cliPath}`, repoRoot, args);
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
    // Kept whole and undecoded until close. Decoding each chunk as it arrives
    // turns any multi-byte character the pipe split into two U+FFFD -- silent
    // for ASCII of any length, and wrong for exactly the Japanese messages a
    // config author writes. This is the same rule LspSession.stderr follows.
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
        stderrPerChunk: stderrChunks.map((chunk) => chunk.toString("utf8")).join(""),
      });
    });
    child.stdin.end();
  });
}
