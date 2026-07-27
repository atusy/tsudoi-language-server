import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { bunRuntime, denoRuntime, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * Below `bun test`'s default, so a lifecycle gate that swallowed the message it
 * was supposed to let through fails THIS test by name as a timeout rather than
 * stalling the whole suite with no diagnostic.
 */
const hangTimeoutMs = 4000;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // The carve-out this sprint's pre-initialize gate must keep. LSP drops
    // notifications sent before initialize -- except `exit`, which a client is
    // entitled to send at any moment and which must still terminate the
    // process. A gate written without that exception turns this measured
    // exit=1 into a hang, and nothing else in the suite sends `exit` first.
    test(
      "exit as the very first message, with no initialize, exits 1 rather than hanging",
      async () => {
        const session = LspSession.start(runtime, demoConfig);
        try {
          session.notify("exit", null);

          expect(await session.waitForExit()).toBe(1);
          // Nothing was asked, so nothing may be answered.
          expect(session.messagesReceived).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );
  });
}
