import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

/**
 * THE HELPER ITSELF UNDER TEST, driven through the real server like everything
 * else. Sprint 5 ruled that a helper terminating a subprocess must settle every
 * promise it owns, and that cross-test misattribution is a suite-integrity
 * failure rather than a single-test bug -- but the rule was only ever kept by
 * hand. A helper that hangs or swallows makes every OTHER file's evidence worth
 * less, so these two properties are pinned where they can fail.
 */
const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * WELL BELOW `bun test`'s default, and load-bearing. The failure this test
 * defends against IS a hang: with the settle-on-registration removed, the
 * request below waits forever. It has to fail as a timeout naming THIS test
 * rather than as a stall that the next file is blamed for.
 */
const hangTimeoutMs = 4000;

const hoverParams = {
  textDocument: { uri: "file:///workspace/a.txt" },
  position: { line: 0, character: 0 },
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test(
      "a request issued after the server has exited is answered, naming the exit",
      async () => {
        const session = LspSession.start(runtime, demoConfig);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          // No shutdown first, so the server exits 1 -- a code the message must
          // carry, since `the server is gone` and `the server refused` are
          // different diagnoses for whoever reads the failure.
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(1);

          const error = await session.requestError("textDocument/hover", hoverParams);

          expect(error.message).toContain("server exited with code 1");
          // BOTH SURFACES, because a test using only the first would leave
          // `rejects` -- the word the acceptance criterion uses -- unchecked.
          // requestError RESOLVES with the wire-shaped error, which is how a
          // criterion about an error CODE must read it; `request` rejects,
          // which is what a caller awaiting a result actually experiences.
          await expect(session.request("textDocument/hover", hoverParams)).rejects.toThrow(
            "server exited with code 1",
          );
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );

    test(
      "a write to a dead session's stdin is reported, in a run where a live one reports nothing",
      async () => {
        const dead = LspSession.start(runtime, demoConfig);
        // THE PAIR, permanent: the same list read on a session that is serving
        // normally. `no write failures` measured by a list nothing ever pushes
        // to is satisfied by a helper that lost every one of them.
        const live = LspSession.start(runtime, demoConfig);
        try {
          await dead.request<InitializeResult>("initialize", initializeParams);
          dead.dispose();
          await dead.waitForExit();
          // A NOTIFICATION, deliberately: nothing awaits it, so this write is
          // the case where a swallowed error leaves no trace at all. A request
          // would at least be answered by the dead-server settle above.
          dead.notify("initialized", {});

          // It NAMES the message that was lost. `something failed` would not
          // tell whoever reads it which notification the server never saw.
          expect(await dead.waitForWriteFailure()).toContain("initialized");

          await live.request<InitializeResult>("initialize", initializeParams);
          live.notify("initialized", {});
          expect(await live.request<null>("shutdown", null)).toBeNull();
          live.notify("exit", null);
          expect(await live.waitForExit()).toBe(0);

          expect(live.writeFailures).toEqual([]);
        } finally {
          dead.dispose();
          live.dispose();
        }
      },
      hangTimeoutMs,
    );
  });
}
