import { describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import process from "node:process";
import { bunRuntime, CLI_IN_A_CHECKOUT, denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture, repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/** Whether a pid still names something alive, asked the way the watchdog asks. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Waits for a pid to go, or gives up -- the caller asserts which happened. */
async function waitForExit(pid: number, withinMs: number): Promise<boolean> {
  const until = Date.now() + withinMs;
  while (Date.now() < until) {
    if (!alive(pid)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

function frame(message: unknown): string {
  const body = JSON.stringify(message);
  return `Content-Length: ${String(Buffer.byteLength(body))}\r\n\r\n${body}`;
}

/**
 * NO RECORD IN THE PERTURBATION REGISTRY NAMES THESE ARMS, AND THAT IS A
 * MEASUREMENT RATHER THAN AN OMISSION -- said here because this repository's own
 * rule is that a weakening relied on later must be one the suite RE-RUNS.
 *
 * THE WEAKENING WAS TAKEN BY HAND AND IS DECISIVE: `watchEditor(null, ...)` in
 * src/server.ts -- the state tsudoi shipped in for its whole life, `processId`
 * read nowhere -- reddens the parent-dies arm on BOTH runtimes and leaves the
 * other four green.
 *
 * WHY IT IS NOT REGISTERED: the registry re-runs an arm file TWICE inside a
 * 25s budget, and this file alone takes about that on its own -- a weakened run
 * spends the whole `waitForExit` bound on each runtime, by construction, because
 * the server it is waiting for never leaves. Registering it would put a timing
 * arm into the instrument this project has ALREADY filed as timing out under
 * load (PBI-93), which is the one change guaranteed to make that worse. WHAT
 * THAT COSTS is stated rather than hidden: if these arms ever stop
 * discriminating, nothing here will say so.
 */
for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE STATE A FIVE-DAY ZOMBIE WAS FOUND IN, BUILT ON PURPOSE: the process the
     * editor named in `processId` is GONE, and stdin NEVER REACHES EOF because
     * this test still holds the write end.
     *
     * THAT SECOND HALF IS THE WHOLE FIXTURE. Without it the server exits for the
     * ordinary reason -- EOF, the loop empties -- and the arm would pass against
     * a tsudoi that reads `processId` nowhere, which is the tsudoi this was
     * written against. MEASURED: it was the shape a multiplexer produces, one
     * process spawning the server and another holding the pipe.
     *
     * THE NAMED PARENT IS A REAL PROCESS THAT REALLY DIES, and not an invented
     * pid: a number nobody ever used would let a watchdog that fires
     * unconditionally pass, where this one is ALIVE while the handshake is
     * answered and gone afterwards.
     */
    test(`a server whose named parent dies exits, though its stdin never ends (${runtime.name})`, async () => {
      // A process that exists, does nothing, and can be killed on cue.
      const parent = spawn(process.execPath, ["-e", "setTimeout(() => undefined, 600000)"], {
        stdio: "ignore",
      });
      const child = spawn(
        runtime.command,
        [...runtime.runArgs, CLI_IN_A_CHECKOUT, "--config", fixture("hover-fixed.ts")],
        {
          cwd: repoRoot,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      try {
        child.stdin.write(
          frame({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { processId: parent.pid, rootUri: null, capabilities: {} },
          }),
        );
        // The handshake has to LAND before the parent goes, or the watchdog was
        // never told which process to watch and the arm proves nothing.
        await new Promise<void>((resolve) => {
          child.stdout.once("data", () => {
            resolve();
          });
        });

        parent.kill("SIGKILL");

        // GENEROUS AGAINST THE POLL AND NOT AGAINST THE MACHINE: the watchdog
        // asks every three seconds, so anything under that is a race with the
        // interval rather than a claim about the server.
        expect(await waitForExit(child.pid ?? 0, 20000)).toBe(true);
        // AND IT SAYS WHY, because a server that vanished silently is
        // indistinguishable from one that crashed -- which is the state a
        // developer would be diagnosing.
        expect(stderr).toContain("its editor's process is gone");
      } finally {
        parent.kill("SIGKILL");
        child.kill("SIGKILL");
      }
    });

    /**
     * THE PAIRED DIRECTION, and without it the arm above is satisfied by a server
     * that exits for ANY reason a few seconds in: the same session, the same
     * fixture, a parent that STAYS ALIVE -- and the server is still there.
     */
    test(`a server whose named parent is alive stays up (${runtime.name})`, async () => {
      const parent = spawn(process.execPath, ["-e", "setTimeout(() => undefined, 600000)"], {
        stdio: "ignore",
      });
      const child = spawn(
        runtime.command,
        [...runtime.runArgs, CLI_IN_A_CHECKOUT, "--config", fixture("hover-fixed.ts")],
        {
          cwd: repoRoot,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      try {
        child.stdin.write(
          frame({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { processId: parent.pid, rootUri: null, capabilities: {} },
          }),
        );
        await new Promise<void>((resolve) => {
          child.stdout.once("data", () => {
            resolve();
          });
        });

        // LONGER THAN THE POLL, so a watchdog firing on a LIVE parent has had
        // several chances to be wrong.
        expect(await waitForExit(child.pid ?? 0, 8000)).toBe(false);
      } finally {
        parent.kill("SIGKILL");
        child.kill("SIGKILL");
      }
    });

    /**
     * AND THE END OF STDIN ENDS THE SESSION ON ITS OWN, with NO `processId` named
     * at all -- which is the other net and the one that does not depend on the
     * client having told tsudoi anything. `null` is what the protocol defines as
     * `not started by another process`, so nothing is watched and only the pipe
     * is left to say the session is over.
     */
    test(`a server whose stdin ends exits, with no processId named (${runtime.name})`, async () => {
      const child = spawn(
        runtime.command,
        [...runtime.runArgs, CLI_IN_A_CHECKOUT, "--config", fixture("hover-fixed.ts")],
        {
          cwd: repoRoot,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      try {
        child.stdin.write(
          frame({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { processId: null, rootUri: null, capabilities: {} },
          }),
        );
        await new Promise<void>((resolve) => {
          child.stdout.once("data", () => {
            resolve();
          });
        });

        child.stdin.end();

        expect(await waitForExit(child.pid ?? 0, 10000)).toBe(true);
      } finally {
        child.kill("SIGKILL");
      }
    });
  });
}
