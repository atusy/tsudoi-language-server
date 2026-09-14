import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type {
  DocumentDiagnosticReport,
  InitializeResult,
  TextEdit,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "../helpers/lsp.ts";
import { requireRuntime } from "../helpers/preflight.ts";
import { warning } from "../../examples/diagnostic-trailing-whitespace.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

const demoConfig = fileURLToPath(new URL("../../examples/tsudoi.config.ts", import.meta.url));
const runtimes = [bunRuntime, denoRuntime];
await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

// Separate space and tab runs with a clean line. Japanese text distinguishes
// UTF-16 positions from byte offsets; expected ranges are counted independently
// of the position conversion used by the handlers.
const messyText = "第一行に余分な空白がある   \n第二行はきれいです\n第三行にはタブがある\t";
const expectedRanges = [
  { start: { line: 0, character: 12 }, end: { line: 0, character: 15 } },
  { start: { line: 2, character: 10 }, end: { line: 2, character: 11 } },
];

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("diagnostics and formatting target only trailing whitespace", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: messyText },
        });

        const report = await session.request<DocumentDiagnosticReport>("textDocument/diagnostic", {
          textDocument: { uri },
        });
        expect(report).toEqual({
          kind: "full",
          items: expectedRanges.map((range) => ({ range, severity: 2, message: warning })),
        });

        const edits = await session.request<TextEdit[] | null>("textDocument/formatting", {
          textDocument: { uri },
          options: { tabSize: 2, insertSpaces: true },
        });
        expect(edits).toEqual(expectedRanges.map((range) => ({ range, newText: "" })));
        expect(session.stderr).toBe("");
      } finally {
        session.dispose();
      }
    });
  });
}
