import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { LSPErrorCodes } from "vscode-languageserver-protocol";
import { requestFailedMessage } from "./fixtures/hover-request-failed.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("a ResponseError from a method handler preserves its LSP error code", async () => {
      const session = LspSession.start(runtime, fixture("hover-request-failed.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const error = await session.requestError("textDocument/hover", {
          textDocument: { uri: "file:///workspace/a.txt" },
          position: { line: 0, character: 0 },
        });

        expect(error.code).toBe(LSPErrorCodes.RequestFailed);
        expect(error.message).toContain(requestFailedMessage);
      } finally {
        session.dispose();
      }
    });
  });
}
