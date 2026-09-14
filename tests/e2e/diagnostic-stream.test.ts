import { expect, test } from "bun:test";
import { applySuiteDeadline } from "../helpers/deadline.ts";
import { bunRuntime, initializeParams, LspSession } from "../helpers/lsp.ts";
import { fixture } from "../helpers/spawn.ts";
import { report, partial } from "../fixtures/diagnostic-stream.ts";

applySuiteDeadline();

test("diagnostics stream the initial report and related documents under the requested token", async () => {
  const session = LspSession.start(bunRuntime, fixture("diagnostic-stream.ts"));
  try {
    await session.request("initialize", {
      ...initializeParams,
      capabilities: { textDocument: { diagnostic: { relatedDocumentSupport: true } } },
    });
    session.notify("initialized", {});
    const result = await session.request("textDocument/diagnostic", {
      textDocument: { uri: "file:///current.ts" },
      partialResultToken: "diagnostic",
    });
    expect(session.progress).toEqual([
      { token: "diagnostic", value: report },
      { token: "diagnostic", value: partial },
    ]);
    expect(result).toBeNull();
  } finally {
    session.dispose();
  }
});
