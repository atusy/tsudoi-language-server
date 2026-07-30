import { describe, expect, test } from "bun:test";
import {
  type DocumentDiagnosticReport,
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { message } from "./fixtures/diagnostic-offsets.ts";

const diagnosticOffsets = fixture("diagnostic-offsets.ts");
// Supplies hover and NOT diagnostic: a stronger negative than an empty
// `methods`, because a server advertising from `methods` being non-empty passes
// the empty fixture and fails this one.
const diagnosticAbsent = fixture("hover-fixed.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * Advertised for EVERY config, so it stands in every exact-equality pin below
 * and is not evidence about the fixture any one of them drives. Why tsudoi
 * claims it unconditionally -- it mirrors folders whatever the config supplies --
 * is at the capabilities literal in src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
};

const uri = "file:///workspace/a.txt";

/**
 * The buffer the fixture analyses. Counted here once, in UTF-16 units, because
 * the expected ranges below are read off these numbers BY HAND: `第一行`
 * occupies 0-2, the first `、` sits at 3, the newline at 10, and line 1 opens at
 * 11 -- so the second `、` is at whole-buffer offset 14 and at line 1, character
 * 3. Those two answers differ, which is the point of the second line.
 */
const analysedText = "第一行、こんにちは。\n第二行、さようなら。";

/**
 * What a client sends. `textDocument` is the only member
 * `DocumentDiagnosticParams` requires; `identifier` and `previousResultId` are
 * optional and are deliberately absent, since tsudoi registers no identifier and
 * ignores previous result ids.
 */
function diagnosticParams(): unknown {
  return { textDocument: { uri } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * EXACT EQUALITY ON THE WHOLE OBJECT, AND THAT IS WHAT PINS THE RULING
     * RATHER THAN MERELY THE FEATURE. `diagnosticProvider is present` is
     * satisfied by a server that advertises it always, and by one that
     * advertises it with either boolean flipped.
     *
     * BOTH BOOLEANS ARE REQUIRED BY THE PROTOCOL AND ARE DECIDED DIFFERENTLY,
     * which is why they are asserted together and why the reasons live at the
     * contributor in src/methods.ts: `workspaceDiagnostics: false` is FORCED by
     * tsudoi not serving `workspace/diagnostic`, while `interFileDependencies:
     * true` is CHOSEN on harm asymmetry -- a stale diagnostic in another file
     * that never clears is silent and wrong, where a redundant pull is visible
     * and merely costs. Flipping either reddens this and this alone.
     */
    test("a config supplying a diagnostic handler advertises diagnosticProvider with both booleans decided", async () => {
      const session = LspSession.start(runtime, diagnosticOffsets);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: false },
        });
      } finally {
        session.dispose();
      }
    });

    // THE NEGATIVE CONTROL, and it is not optional: a client is entitled to
    // send whatever it was told about, so a capability claimed where the config
    // cannot answer it makes the server lie about itself.
    test("a config supplying no diagnostic handler advertises exactly what it can answer", async () => {
      const session = LspSession.start(runtime, diagnosticAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          hoverProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE AFFORDABILITY CLAIM, MEASURED A SECOND TIME AND ON A DIFFERENT METHOD.
     * A handler emits Positions from whatever OFFSETS its analysis produced,
     * which is `positionAt` -- a member this project's document has only
     * because upstream's TextDocument sits behind it.
     *
     * THE EXPECTED RANGES ARE WRITTEN OUT BY HAND AND ARE NEVER COMPUTED BY
     * CALLING positionAt. Both sides would otherwise run one function, and two
     * outcomes -- a correct conversion and a consistently broken one -- would
     * produce the SAME observation.
     *
     * JAPANESE, AND TWO LINES, for two different reasons. Every ASCII buffer
     * satisfies a byte reading and a UTF-16 reading at once, so a handler
     * counting bytes is invisible unless the text is multibyte: `第一行` is
     * three UTF-16 units and nine UTF-8 bytes, so the first item alone separates
     * them. And the SECOND item is on the second line, which is what a
     * whole-buffer offset that never learned where the lines are gets wrong --
     * it would report character 14 rather than line 1, character 3.
     *
     * DEEP EQUALITY ON THE WHOLE REPORT, `kind` included: the config author's
     * report is the answer, and anything tsudoi rewrote on the way out -- a
     * dropped severity, an added resultId, a re-encoded message -- shows up here
     * rather than as a response that merely looks reasonable.
     */
    test("a handler that knows only offsets emits the Positions the client receives", async () => {
      const session = LspSession.start(runtime, diagnosticOffsets);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: analysedText },
        });

        const result = await session.request<DocumentDiagnosticReport>(
          "textDocument/diagnostic",
          diagnosticParams(),
        );

        expect(result).toEqual({
          kind: "full",
          items: [
            {
              range: { start: { line: 0, character: 3 }, end: { line: 0, character: 4 } },
              severity: 2,
              message,
            },
            {
              range: { start: { line: 1, character: 3 }, end: { line: 1, character: 4 } },
              severity: 2,
              message,
            },
          ],
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * A CONFORMING CLIENT NEVER SENDS THIS, because `diagnosticProvider` was not
     * advertised. The server answers it anyway, because a server that fails when
     * a client misbehaves is a server that takes the editor down with it.
     *
     * `null` IS THE ANSWER AND IT IS THE ONE PLACE TSUDOI SENDS SOMETHING THIS
     * REQUEST'S RESULT TYPE DOES NOT DECLARE -- the protocol gives
     * `textDocument/diagnostic` no null arm, unlike hover's and formatting's.
     * ASSERTED RATHER THAN QUIETLY TRUE: it is the router's shared no-handler
     * answer, not this method's, and changing it for one method would mean a
     * per-method no-handler answer, which is the convention the table exists to
     * retire. What keeps it unreachable for a conforming client is the test
     * above -- no handler, no capability, no request.
     */
    test("a diagnostic request with no handler configured is answered null, twice over", async () => {
      const session = LspSession.start(runtime, diagnosticAbsent);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(
          await session.request<DocumentDiagnosticReport | null>(
            "textDocument/diagnostic",
            diagnosticParams(),
          ),
        ).toBe(null);
        // The second one is the point: null must be an answer the session
        // survives, not an error the connection happens to have absorbed once.
        expect(
          await session.request<DocumentDiagnosticReport | null>(
            "textDocument/diagnostic",
            diagnosticParams(),
          ),
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
