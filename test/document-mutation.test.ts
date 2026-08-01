import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import {
  changedText,
  type DocumentMutationReport,
  documentUri,
  openedText,
} from "./fixtures/document-mutation.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const hoverParams = {
  textDocument: { uri: documentUri },
  position: { line: 0, character: 0 },
};

async function reportFrom(session: LspSession): Promise<DocumentMutationReport> {
  const hover = await session.request<Hover>("textDocument/hover", hoverParams);
  const contents = hover.contents as { value?: string };
  return JSON.parse(contents.value ?? "{}") as DocumentMutationReport;
}

/**
 * THE COMPILE-TIME HALF, AND IT EXISTS BECAUSE THE DECLARATION IS TSUDOI'S OWN.
 * `DocumentView` declares its seven members as `readonly` function properties,
 * so the forgery below is TS2540 -- the code for `assigned to a read-only
 * property` and nothing else, which the exit code alone would also be earned by
 * a probe that failed to resolve its import.
 *
 * WHAT A METHOD DECLARATION WOULD COST is exactly this test: upstream declares
 * the same members as METHODS, which are writable properties, so a view typed
 * as upstream's interface accepts the assignment and the seal below is the whole
 * defence. Publishing our own declaration is what makes both halves closeable,
 * and this is the half that reports the mistake at the point of the edit.
 *
 * NEITHER HALF SUBSTITUTES FOR THE OTHER, which is why the session below stays:
 * `readonly` is erased at run time and says nothing about the JavaScript a
 * config author actually ships.
 */
test("forging a document member does not type-check", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      'const document = tsudoi.documents.get("file:///a.txt");',
      "if (document !== undefined) {",
      '  document.getText = () => "forged";',
      "}",
      "",
    ].join("\n"),
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("getText");
});

/**
 * THE PAIRED CONTROL, without which the probe above is satisfied by a document
 * nobody can READ at all: members that had become non-callable, a broken import
 * or a type resolving to nothing would refuse the assignment AND every call.
 */
test("reading the same document members type-checks", async () => {
  const result = await typeCheckProbe({
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      'const document = tsudoi.documents.get("file:///a.txt");',
      "export const read = document?.getText({",
      "  start: { line: 0, character: 0 },",
      "  end: document.positionAt(document.offsetAt({ line: 0, character: 0 })),",
      "});",
      "export const about = [document?.uri, document?.languageId];",
      "export const numbers = [document?.version, document?.lineCount];",
      "",
    ].join("\n"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * TWO REQUESTS WITH AN EDIT BETWEEN THEM, and each part of that carries a
     * claim the others cannot.
     *
     * THE SECOND REQUEST IS THE FINDING: the document stays in the store for as
     * long as the uri is open, so a forged `getText` that landed would answer
     * every later handler, and nothing self-heals -- a later edit advances the
     * version and leaves the shadow in place.
     *
     * THE EDIT IS WHAT SEPARATES A SEAL FROM A BREAK: freezing upstream's own
     * instance refuses the forgery just as well and stops synchronisation dead,
     * since `update` writes the content, the version and the line offsets. A test
     * that only asserted the refusal would pass for that.
     *
     * THE TEXT AND THE VERSION TOGETHER, because either alone is satisfied by a
     * store that is half-updating: a version that moved over a text that did not
     * is exactly what a shadowed `getText` looks like.
     */
    test("a handler cannot forge the buffer, and the next one reads what the client last sent", async () => {
      const session = LspSession.start(runtime, fixture("document-mutation.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: openedText },
        });

        expect(await reportFrom(session)).toEqual({
          attempted: true,
          getTextRefused: true,
          addMemberRefused: true,
          text: openedText,
          version: 1,
        });

        session.notify("textDocument/didChange", {
          textDocument: { uri: documentUri, version: 2 },
          contentChanges: [{ text: changedText }],
        });

        expect(await reportFrom(session)).toEqual({
          attempted: false,
          getTextRefused: false,
          addMemberRefused: false,
          text: changedText,
          version: 2,
        });
      } finally {
        session.dispose();
      }
    });
  });
}
