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
import { replacement } from "./fixtures/formatting-offsets.ts";

const formattingFixed = fixture("formatting-fixed.ts");
const formattingOffsets = fixture("formatting-offsets.ts");
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
 * The buffer the offset fixture formats. Counted here once, in UTF-16 units,
 * because the expected ranges below are read off these numbers by hand:
 * `第一行` occupies 0-2, the first `、` sits at 3, the newline at 10, and line 1
 * opens at 11 -- so the second `、` is at whole-buffer offset 14 and at line 1,
 * character 3. Those two answers differ, which is the point of the second line.
 */
const formattableText = "第一行、こんにちは。\n第二行、さようなら。";

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

    /**
     * THE AFFORDABILITY CLAIM, MEASURED HERE RATHER THAN ASSERTED FOR THE
     * REMAINING FOUR METHODS. A handler emits Positions from whatever OFFSETS
     * its analysis produced, which is `positionAt` -- a member that did not
     * exist on this project's document before Sprint 28 put upstream's
     * TextDocument behind it.
     *
     * THE EXPECTED RANGES ARE WRITTEN OUT BY HAND AND ARE NEVER COMPUTED BY
     * CALLING positionAt. Both sides would otherwise run one function, and two
     * outcomes -- a correct conversion and a consistently broken one -- would
     * produce the SAME observation.
     *
     * JAPANESE, AND TWO LINES, for two different reasons. Every ASCII buffer
     * satisfies a byte reading and a UTF-16 reading at once, so a handler
     * counting bytes is invisible unless the text is multibyte: `第一行` is
     * three UTF-16 units and nine UTF-8 bytes, so the first edit alone
     * separates them. And the SECOND edit is on the second line, which is what
     * a whole-buffer offset that never learned where the lines are gets wrong
     * -- it would report character 14 rather than line 1, character 3.
     */
    test("a handler that knows only offsets emits the Positions the client receives", async () => {
      const session = LspSession.start(runtime, formattingOffsets);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: formattableText },
        });

        const result = await session.request<TextEdit[] | null>(
          "textDocument/formatting",
          formattingParams(),
        );

        expect(result).toEqual([
          {
            range: { start: { line: 0, character: 3 }, end: { line: 0, character: 4 } },
            newText: replacement,
          },
          {
            range: { start: { line: 1, character: 3 }, end: { line: 1, character: 4 } },
            newText: replacement,
          },
        ]);
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
