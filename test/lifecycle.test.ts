import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

test("initialize returns a result naming tsudoi, with capabilities present and empty", async () => {
  const session = LspSession.start(bunRuntime, demoConfig);
  try {
    const result = await session.request<InitializeResult>("initialize", initializeParams);

    expect(result.serverInfo?.name).toBe("tsudoi");
    expect(result.capabilities).toEqual({});
  } finally {
    session.dispose();
  }
});

test("initialize, initialized, shutdown, exit yields a null shutdown result and exit code 0", async () => {
  const session = LspSession.start(bunRuntime, demoConfig);
  try {
    await session.request<InitializeResult>("initialize", initializeParams);
    session.notify("initialized", {});

    // Awaiting the shutdown response before notifying exit is what keeps the
    // response from racing the server's process.exit.
    const shutdownResult = await session.request<null>("shutdown", null);
    expect(shutdownResult).toBeNull();

    session.notify("exit", null);
    expect(await session.waitForExit()).toBe(0);
  } finally {
    session.dispose();
  }
});
