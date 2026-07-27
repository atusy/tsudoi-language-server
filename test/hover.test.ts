import { describe, expect, test } from "bun:test";
import {
  type Hover,
  type InitializeResult,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixedHover } from "./fixtures/hover-fixed.ts";
import { fixture } from "./helpers/spawn.ts";

const hoverFixed = fixture("hover-fixed.ts");
const hoverAbsent = fixture("hover-absent.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Full,
};

const uri = "file:///workspace/a.txt";

function hoverParams(line: number, character: number): unknown {
  return { textDocument: { uri }, position: { line, character } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("a config supplying a hover handler advertises hoverProvider", async () => {
      const session = LspSession.start(runtime, hoverFixed);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, hoverProvider: true });
      } finally {
        session.dispose();
      }
    });

    // Exact equality, not `hoverProvider is absent`: a server that advertised
    // some other unasked-for capability would satisfy an absence check, and a
    // client trusts every capability it is told about.
    test("a config supplying no hover handler advertises exactly textDocumentSync", async () => {
      const session = LspSession.start(runtime, hoverAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync });
      } finally {
        session.dispose();
      }
    });

    // Deep equality against the literal the fixture exports, range included:
    // the config author's Hover is the answer, and anything tsudoi rewrote on
    // the way out -- a dropped range, a re-encoded string -- shows up here
    // rather than as a response that merely looks reasonable.
    test("the hover handler's return value reaches the client unchanged", async () => {
      const session = LspSession.start(runtime, hoverFixed);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<Hover | null>("textDocument/hover", hoverParams(1, 3));

        expect(result).toEqual(fixedHover);
      } finally {
        session.dispose();
      }
    });
  });
}
