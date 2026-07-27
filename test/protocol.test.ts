import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type { Hover } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
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

const uri = "file:///workspace/a.txt";

/** The example config answers hover from the live buffer, so it needs one. */
function didOpen(session: LspSession, text: string): void {
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text },
  });
}

function hoverParams(line: number, character: number): unknown {
  return { textDocument: { uri }, position: { line, character } };
}

/** What the example config answers over `こんにちは` at the first character. */
const exampleHover = "**こんにちは** はカーソル位置の語です。";

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

    // The boundary the pre-initialize gate must not swallow. `not initialized`
    // and `no such method` are different diagnoses, and a gate answering
    // ServerNotInitialized for everything tsudoi did not register would tell a
    // client its request was mistimed when it was actually unsupported.
    test("after initialize an unregistered method is answered -32601, and hover still answers", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});
        didOpen(session, "こんにちは");

        const error = await session.requestError("textDocument/definition", hoverParams(0, 0));
        expect(error.code).toBe(-32601);

        // The connection survives the unknown method and still serves: an
        // absence of catastrophe would be satisfied by a dead server too.
        const hover = await session.request<Hover | null>("textDocument/hover", hoverParams(0, 0));
        expect(hover?.contents).toEqual({ kind: "markdown", value: exampleHover });

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
