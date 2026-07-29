import { describe, expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import {
  bunRuntime,
  denoRuntime,
  initializeParams,
  LspSession,
  type Runtime,
} from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { repoRoot } from "./helpers/spawn.ts";

/**
 * What happens to tsudoi when the editor that spawned it goes away.
 *
 * IT ALREADY WORKS, AND THAT IS WHY THIS FILE EXISTS. Nothing in src/ handles
 * stdin closing; the process ends because THE EVENT LOOP EMPTIES once the reader
 * has nothing left to wait on. A property held by an ABSENCE is the most fragile
 * kind there is -- it breaks by someone ADDING something rather than by anyone
 * changing what is written, so no reviewer reading a diff can see it go. These
 * tests are what would go red instead.
 *
 * WHAT FOLLOWS FROM THAT FOR ANYONE EDITING src/ -- that a long-lived handle must
 * be unref()'d, and why that is correctness rather than tidiness -- is recorded
 * at startServer in src/server.ts, WHERE SUCH AN EDIT WOULD BE MADE, and is not
 * repeated here. This file is only what turns it red.
 *
 * WHY THE EXIT CODE HERE IS 0 while `exit` without a prior `shutdown` is 1 is
 * ruled at exitCode() in src/lifecycle.ts, which is the ONE place this project's
 * reading of the specification's exit-code sentence lives. It is not restated
 * here on purpose: two copies of one reading is how a project ends up holding
 * two rulings that disagree.
 */

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));
const fakeEditor = fileURLToPath(new URL("./helpers/fake-editor.ts", import.meta.url));

/**
 * Whether a pid is running, asked the only way an ORPHAN can be asked about --
 * signal 0, from a process that is no longer its parent.
 *
 * `catch` is total here on purpose, and the reason it is safe is worth stating
 * because it does not generalise: the only errors this can raise are ESRCH (gone)
 * and EPERM (alive but not ours), and the server runs as the same user. THE
 * PORTABLE WAY TO TELL THEM APART IS `code === "ESRCH"` AND NOT THE ERRNO NUMBER;
 * that trap is recorded at startServer in src/server.ts, where anyone tempted to
 * write this check into the product would be writing it.
 */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** The first line the fake editor prints, or an error SAYING WHAT IT SAW instead. */
async function firstLine(child: ChildProcess, timeoutMs: number): Promise<string> {
  let seen = "";
  let stderr = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    seen += chunk.toString("utf8");
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const end = seen.indexOf("\n");
    if (end !== -1) {
      return seen.slice(0, end);
    }
    if (Date.now() > deadline) {
      throw new Error(
        `the server never answered initialize within ${timeoutMs}ms -- ` +
          `fake editor said ${JSON.stringify(seen)}, stderr ${JSON.stringify(stderr)}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const initializeFrame = (() => {
  const json = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: initializeParams,
  });
  return { json, length: Buffer.byteLength(json, "utf8") };
})();

interface Rig {
  /** The SERVER'S own pid, reported by the fake editor after it answered. */
  readonly serverPid: number;
  readonly killEditor: () => void;
  readonly dispose: () => void;
}

/**
 * Stands up editor-spawns-server and returns the server's pid once IT HAS
 * ANSWERED an initialize -- so every assertion below starts from a serving
 * server rather than from a pid that exists.
 *
 * `stdin: "own"` gives the write end to the fake editor; `"third-party"` puts it
 * in a FIFO held by a process this rig does not kill. That single difference is
 * the whole of what the two tests below disagree about.
 */
async function startRig(runtime: Runtime, stdin: "own" | "third-party"): Promise<Rig> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-editor-death-"));
  const fifo = join(dir, "stdin");
  let holder: ChildProcess | undefined;
  if (stdin === "third-party") {
    spawnSync("mkfifo", [fifo]);
    // Holds the write end open FOREVER, and sends the initialize the fake editor
    // cannot -- it has no writable handle on this FIFO, which is the point.
    // `exec 3>` blocks until a reader opens, so this and the editor unblock each
    // other; that is why the holder is a process rather than an fd in this one.
    holder = spawn(
      "sh",
      [
        "-c",
        `exec 3>"${fifo}"; ` +
          `printf 'Content-Length: ${initializeFrame.length}\\r\\n\\r\\n%s' '${initializeFrame.json}' >&3; ` +
          `while :; do sleep 1; done`,
      ],
      { stdio: ["ignore", "ignore", "ignore"] },
    );
  }
  const editor = spawn(
    "bun",
    [
      "run",
      fakeEditor,
      stdin === "own" ? "own" : fifo,
      runtime.command,
      ...runtime.runArgs,
      "src/cli.ts",
      "--config",
      demoConfig,
    ],
    { cwd: repoRoot, stdio: ["pipe", "pipe", "pipe"] },
  );
  try {
    const line = await firstLine(editor, 8000);
    const serverPid = Number(line.replace("pid ", ""));
    return {
      serverPid,
      killEditor: () => editor.kill("SIGKILL"),
      dispose: () => {
        editor.kill("SIGKILL");
        holder?.kill("SIGKILL");
        if (alive(serverPid)) {
          process.kill(serverPid, "SIGKILL");
        }
        rmSync(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    editor.kill("SIGKILL");
    holder?.kill("SIGKILL");
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

/** Resolves once the pid is gone, or reports how long it outlived its editor. */
async function waitUntilGone(pid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (alive(pid)) {
    if (Date.now() > deadline) {
      throw new Error(`the server outlived its editor by more than ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

const runtimes = [bunRuntime, denoRuntime];

// Both runtimes for real, exactly as the rest of the cross-runtime suite: an
// absent one fails this file rather than quietly halving its coverage.
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // THE PARENT IS ALIVE AND ONLY THE INPUT ENDS -- which is what makes this
    // about EOF rather than about bereavement. The rigs below vary who dies; this
    // varies nothing except the stream, so the two cannot be confused.
    //
    // THE INITIALIZE ROUND TRIP IS A PRESENCE ASSERTION AND NOT A SETUP STEP:
    // without it, `the process ended at 0` is satisfied by a server that never
    // started -- and this suite has seen a launch fail silently, which is why
    // that possibility is treated as live rather than theoretical.
    test("stdin reaching EOF ends the session at code 0, with no exit notification sent", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);
        expect(result.serverInfo?.name).toBe("tsudoi");

        session.endInput();

        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // THE ONE AN UN-UNREF'D TIMER REDDENS. Nothing in src/ makes this happen, so
    // what this defends is an ABSENCE: add a timer, a socket or a watcher that
    // is not unref()'d anywhere in src/ and the server outlives the editor
    // forever, with every other test in the suite still green.
    //
    // OBSERVED ON THE SERVER'S OWN PID, because the question is whether THAT
    // process is gone -- not whether a wrapper returned, and not whether a pipe
    // closed.
    //
    // THE ALIVE ASSERTION EXISTS BECAUSE `gone after the kill` IS SATISFIED
    // PERFECTLY BY `never started`, and this project has already watched a launch
    // fail and log nothing -- AND WHAT IT ACTUALLY BUYS IS NARROWER THAN THAT,
    // measured rather than assumed, because a control credited with a catch it
    // does not make is worse than none. Break the launch and THE RIG FAILS FIRST,
    // at the handshake, saying `the server never answered initialize`: the pid is
    // reported only after the server ANSWERED, so this line is never reached.
    // Make the server answer and then die of its own accord and this line is not
    // reached either -- it dies AFTER the check, and the test below is what
    // catches that. So this assertion caught neither failure that could be built.
    // IT STAYS, AND FOR A STATED REASON RATHER THAN BECAUSE IT IS CHEAP: it is
    // the whole of the presence pair the moment anyone SIMPLIFIES the rig to
    // report a pid without waiting for an answer, which is exactly the tidy-up
    // this shape invites.
    //
    // MEASURED: gone 11ms after the kill on both runtimes. The 3s budget is for
    // a loaded machine, not for the behaviour.
    test("the server exits when the editor that spawned it is SIGKILLed", async () => {
      const rig = await startRig(runtime, "own");
      try {
        expect(alive(rig.serverPid)).toBe(true);

        rig.killEditor();

        await waitUntilGone(rig.serverPid, 3000);
        expect(alive(rig.serverPid)).toBe(false);
      } finally {
        rig.dispose();
      }
    }, 20_000);

    // THE OPPOSITE DIRECTION, AND NEITHER TEST SUBSTITUTES FOR THE OTHER. The one
    // above claims `exits when the parent dies` and observes `is not running`,
    // which are different propositions: a server that crashed on startup, or one
    // that quit for a reason of its own, satisfies it identically. This one
    // changes ONE THING -- who holds the write end of stdin -- and requires the
    // opposite outcome, which is what makes the mechanism EOF rather than
    // bereavement. Together with the EOF test above they are a 2x2 with three
    // cells filled: stdin closes with the parent alive (exits), stdin closes
    // because the parent died (exits), parent dies with stdin OPEN (lives).
    //
    // WHAT IT CATCHES that the test above cannot: an exit for the WRONG REASON.
    // A parent-pid poll added to src/ would keep the test above green and redden
    // this one -- measured, and the mirror of the timer case, which reddens that
    // one and leaves this green.
    //
    // MEASURED: alive at +6s on both runtimes with its editor dead. The hold
    // below is 1.5s, which is 136 times the 11ms the same rig takes to die when
    // the write end goes with the editor.
    test("the server SURVIVES its editor's death when a third party holds its stdin open", async () => {
      const rig = await startRig(runtime, "third-party");
      try {
        expect(alive(rig.serverPid)).toBe(true);

        rig.killEditor();
        await new Promise((resolve) => setTimeout(resolve, 1500));

        expect(alive(rig.serverPid)).toBe(true);
      } finally {
        rig.dispose();
      }
    }, 20_000);
  });
}
