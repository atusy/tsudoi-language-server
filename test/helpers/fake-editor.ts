import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import process from "node:process";
import { repoRoot } from "./spawn.ts";

/**
 * A stand-in for the editor that spawns tsudoi. RUN AS A SCRIPT, never imported:
 * its whole purpose is to be a SEPARATE PROCESS that can be killed.
 *
 * WHY A THIRD LEVEL EXISTS AT ALL. The property under test is what happens to
 * the server when THE PROCESS THAT SPAWNED IT DIES, and a test cannot be that
 * process without dying itself. So `bun test` spawns this, this spawns the
 * server, and the test kills this and watches the server's own pid. The middle
 * level also makes the observation clean rather than a corpse: once this process
 * is gone the server is orphaned and reaped by init, so `kill(pid, 0)` reports
 * it gone rather than reporting a zombie its parent never collected.
 *
 * ONE ARGUMENT IS THE WHOLE EXPERIMENT -- WHERE THE SERVER'S STDIN COMES FROM:
 *
 *   own          -- this process makes the pipe, so THE ONLY WRITE END dies with
 *                   this process. The server sees EOF.
 *   <fifo path>  -- the server reads a FIFO whose write end is held by SOMEONE
 *                   ELSE ENTIRELY. Killing this closes nothing the server reads
 *                   from, so nothing about its input changes.
 *
 * Everything else is identical between the two runs: the only difference is the
 * variable under test, and the two answers are opposite.
 *
 * A FIFO RATHER THAN AN INHERITED fd 0, AND THE REASON IS MEASURED, NOT
 * STYLISTIC. Handing the server this process's own fd 0 LOOKS like leaving the
 * write end with the test -- `lsof` confirms both processes hold the very same
 * socket endpoint -- and it silently does not: `node:child_process` DESTROYS a
 * dead child's stdin stream, so the test's own runtime closes the write end the
 * moment this process is killed. The server then sees EOF and dies for the C1
 * reason, and the rig quietly measures the thing it was built to distinguish
 * itself from. A FIFO's write end is held by a process nobody is bookkeeping.
 *
 * IN BOTH MODES THIS REPORTS ONLY AFTER THE SERVER HAS ANSWERED, so a caller can
 * assert THE SERVER WAS SERVING and not merely that a pid existed. `gone after
 * the kill` is satisfied perfectly by `never started`, and a launch failing
 * silently is something this project has actually seen. In `own` mode the
 * `initialize` is written here; in FIFO mode whoever holds the write end sends
 * it, because this process deliberately has no way to write there.
 */

const usage = "usage: fake-editor.ts <own|fifo-path> <command> [args...]";

const [stdinSource, command, ...args] = process.argv.slice(2);
if (stdinSource === undefined || command === undefined) {
  process.stderr.write(`fake-editor: ${usage}\n`);
  process.exit(2);
}

const own = stdinSource === "own";
const server = spawn(command, args, {
  cwd: repoRoot,
  // stderr is dropped rather than piped: nothing here drains it, and a pipe
  // nobody reads is a place for a server to block once it fills.
  stdio: [own ? "pipe" : openSync(stdinSource, "r"), "pipe", "ignore"],
});

// A bound on the leak if the caller dies before killing this. It is ALSO what
// keeps this process alive: with nothing else pending the event loop would
// empty and this would exit -- which is the very property being measured one
// level down.
setTimeout(() => process.exit(0), 30_000);

let reported = false;

/** Once, whatever the stream does: the caller reads ONE line and waits for it. */
function report(): void {
  if (reported) {
    return;
  }
  reported = true;
  process.stdout.write(`pid ${server.pid}\n`);
}

const { stdin, stdout } = server;
if (stdout === null) {
  // Unreachable while stdout is spawned as a pipe, and stated rather than cast
  // away: reading the server's answer IS how this process knows it is serving.
  throw new Error("fake-editor: the server's stdout must be piped");
}
stdout.on("data", (chunk: Buffer) => {
  if (chunk.includes("Content-Length")) {
    report();
  }
});

if (own && stdin !== null) {
  const json = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { processId: null, rootUri: null, capabilities: {} },
  });
  stdin.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}
