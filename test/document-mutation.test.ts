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
 * THERE IS NO COMPILE-TIME HALF HERE, AND THAT IS MEASURED RATHER THAN ASSUMED.
 * The document a config author receives is UPSTREAM'S OWN TYPE, published
 * unchanged through `@atusy/tsudoi/deps/textdocument` and held to that identity
 * by the probe in test/published-artifacts.test.ts -- and upstream declares its
 * members as METHODS, which are writable properties. So the assignment below
 * type-checks, and closing it would mean publishing a type that is not
 * upstream's, which is a ruling this project has already made the other way.
 *
 * ASSERTED AS A GREEN rather than left unsaid, because the neighbouring findings
 * each close both halves: a reader comparing them is owed the reason this one
 * closes only the half that runs, and a claim that stopped holding -- upstream
 * marking those members `readonly` -- would show up here as a failure to
 * compile.
 */
test("forging a document member type-checks, which is why the seal is the whole defence", async () => {
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
