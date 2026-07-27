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
