import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { type InitializeResult, TextDocumentSyncKind } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

// PBI-1 is accepted only by spawning both runtimes for real, so an absent one
// fails this file rather than quietly reducing its coverage.
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // Widened from `toEqual({})` by PBI-2, PBI-3 and PBI-4, deliberately still
    // exact: openClose is what entitles a conforming client to send
    // didOpen/didClose at all, so an equality assertion is the only kind that
    // catches its loss. hoverProvider and completionProvider are here because
    // this file drives examples/tsudoi.config.ts, which supplies both handlers.
    //
    // THE SYNC KIND IS WHAT AN EDITOR READS TO DECIDE WHAT TO SEND, so this
    // value is the whole of the editor-user-facing half of incremental sync:
    // announce Full and a conforming client keeps putting the whole buffer on
    // stdio at every keystroke however well the store applies ranges.
    test("initialize returns a result naming tsudoi, advertising incremental textDocumentSync, hoverProvider and completionProvider", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.serverInfo?.name).toBe("tsudoi");
        expect(result.capabilities).toEqual({
          textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental },
          hoverProvider: true,
          completionProvider: {},
        });
      } finally {
        session.dispose();
      }
    });

    test("a --config path relative to the working directory resolves", async () => {
      // Exactly the acceptance criterion's command form, run from the repo root:
      //   <runtime> src/cli.ts --config examples/tsudoi.config.ts
      const session = LspSession.start(runtime, "examples/tsudoi.config.ts");
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.serverInfo?.name).toBe("tsudoi");
      } finally {
        session.dispose();
      }
    });

    test("initialize, initialized, shutdown, exit yields a null shutdown result and exit code 0", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // Awaiting the shutdown response before notifying exit is what keeps
        // the response from racing the server's process.exit.
        const shutdownResult = await session.request<null>("shutdown", null);
        expect(shutdownResult).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("exit sent after initialize with no shutdown in between exits with code 1", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
      } finally {
        session.dispose();
      }
    });
  });
}
