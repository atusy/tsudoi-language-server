import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

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
 * WHY THE EXIT CODE HERE IS 0 while `exit` without a prior `shutdown` is 1 is
 * ruled at exitCode() in src/lifecycle.ts, which is the ONE place this project's
 * reading of the specification's exit-code sentence lives. It is not restated
 * here on purpose: two copies of one reading is how a project ends up holding
 * two rulings that disagree.
 */

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

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
  });
}
