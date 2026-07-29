import { describe, expect, test } from "bun:test";
import {
  type InitializeResult,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
  type TextEdit,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { fixedEdits } from "./fixtures/formatting-fixed.ts";

const formattingFixed = fixture("formatting-fixed.ts");
// Supplies hover and NOT formatting: a stronger negative than an empty
// `methods`, because a server advertising from `methods` being non-empty
// passes the empty fixture and fails this one.
const formattingAbsent = fixture("hover-fixed.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

const uri = "file:///workspace/a.txt";

/**
 * What a client sends. `options` is REQUIRED by DocumentFormattingParams and is
 * passed through to the config author untouched -- tsudoi reads no field of it.
 */
function formattingParams(): unknown {
  return { textDocument: { uri }, options: { tabSize: 2, insertSpaces: true } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // Exact equality on both halves: `documentFormattingProvider is present`
    // is satisfied by a server that advertises it always, and `absent` by one
    // that advertises nothing. Only equality says the capability tracks what
    // the config can answer.
    test("a config supplying a formatting handler advertises documentFormattingProvider", async () => {
      const session = LspSession.start(runtime, formattingFixed);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          documentFormattingProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    // THE NEGATIVE CONTROL, and it is not optional: a client is entitled to
    // send whatever it was told about, so a capability claimed where the config
    // cannot answer it makes the server lie about itself.
    test("a config supplying no formatting handler advertises exactly what it can answer", async () => {
      const session = LspSession.start(runtime, formattingAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, hoverProvider: true });
      } finally {
        session.dispose();
      }
    });

    // Deep equality against the literal the fixture exports, every range
    // included: the config author's TextEdit[] is the answer, and anything
    // tsudoi rewrote on the way out -- a collapsed empty range, a re-encoded
    // string -- shows up here rather than as a response that merely looks
    // reasonable.
    test("the formatting handler's TextEdit[] reaches the client unchanged", async () => {
      const session = LspSession.start(runtime, formattingFixed);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<TextEdit[] | null>(
          "textDocument/formatting",
          formattingParams(),
        );

        expect(result).toEqual(fixedEdits);
      } finally {
        session.dispose();
      }
    });

    // A conforming client never sends this: documentFormattingProvider was not
    // advertised. The server answers it anyway, because a server that fails
    // when a client misbehaves is a server that takes the editor down with it.
    test("a formatting request with no handler configured is answered null, twice over", async () => {
      const session = LspSession.start(runtime, formattingAbsent);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(
          await session.request<TextEdit[] | null>("textDocument/formatting", formattingParams()),
        ).toBe(null);
        // The second one is the point: null must be an answer the session
        // survives, not an error the connection happens to have absorbed once.
        expect(
          await session.request<TextEdit[] | null>("textDocument/formatting", formattingParams()),
        ).toBe(null);
        expect(await session.request<null>("shutdown", null)).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        // The answers went out as JSON-RPC responses and nothing besides:
        // stdout carries the protocol and not one byte more.
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
