import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import {
  documentText,
  documentUri,
  folderUri,
  type StoreMutationReport,
} from "./fixtures/store-mutation.ts";
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

async function reportFrom(session: LspSession): Promise<StoreMutationReport> {
  const hover = await session.request<Hover>("textDocument/hover", hoverParams);
  const contents = hover.contents as { value?: string };
  return JSON.parse(contents.value ?? "{}") as StoreMutationReport;
}

/**
 * A probe project's source, with `body` spliced in under a bound `Tsudoi`.
 *
 * The binding is `null as unknown as` because nothing here RUNS -- the claim is
 * about what tsc accepts, and a probe that had to build a real session would be
 * measuring the construction as well.
 */
function tsudoiProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * THE COMPILE-TIME HALF, WHICH IS HALF AND SAYS SO. `readonly` is erased at run
 * time, so this pair speaks only about a config that is type-checked -- the
 * runtime test below is what holds for the JavaScript an author ships, and
 * neither half substitutes for the other: the type says nothing about the
 * JavaScript a config author ships, and the freeze gives no warning before it
 * throws.
 *
 * WHAT IT MEASURES IS THE DECLARATION FORM AND NOTHING ELSE. A store published
 * with METHOD declarations accepts every assignment below -- a method is a
 * writable property, and `readonly` on the FIELD holding the store protects the
 * binding alone. Function properties declared `readonly` are what make these
 * TS2540, which is the code for `assigned to a read-only property` and nothing
 * else; the exit code alone would also be earned by a probe that failed to
 * resolve its import.
 */
test("a handler assigning over a document store operation does not type-check", async () => {
  const result = await typeCheckProbe(tsudoiProbe("tsudoi.documents.get = () => undefined;"));

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("get");
});

/**
 * THE OTHER STORE, and it is not the same claim: the two are separate objects
 * built by separate modules, so a fix applied to one leaves the other open.
 */
test("a handler assigning over a workspace folder store operation does not type-check", async () => {
  const result = await typeCheckProbe(tsudoiProbe("tsudoi.workspaceFolders.values = () => [];"));

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("values");
});

/**
 * THE PAIRED CONTROL, without which the two above are satisfied by a surface
 * nobody can CALL at all: a store whose operations had become non-callable
 * fields, a broken import, a type that resolves to nothing would refuse every
 * assignment AND every call.
 */
test("calling the same store operations type-checks", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      [
        'export const document = tsudoi.documents.get("file:///a.txt");',
        "export const open = [...tsudoi.documents.values()];",
        'export const covering = tsudoi.workspaceFolders.get("file:///a.txt");',
        "export const folders = [...tsudoi.workspaceFolders.values()];",
      ].join("\n"),
    ),
  );

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE RUNTIME HALF, AND THE ONE THAT HOLDS FOR SHIPPED JAVASCRIPT. A config
     * author writes JavaScript, or casts, or reaches the object through a helper
     * tsc never saw -- and `readonly` is gone by then.
     *
     * TWO REQUESTS, BECAUSE THE FINDING IS ABOUT THE SECOND ONE. The `Tsudoi` and
     * its stores are ONE OBJECT FOR THE WHOLE SESSION, so a write that lands
     * corrupts every later handler's view for the life of the session -- and one
     * request alone cannot show that at all.
     *
     * THE STORES ARE NON-EMPTY ON PURPOSE, which is what makes the second report
     * discriminating: `documents.get = () => undefined` and a session that opened
     * nothing answer identically, as `workspaceFolders.get = () => []` and a
     * client that named no folder do. A document is opened and a folder is named
     * over it, so the genuine answers are a text, a folder and a cover.
     *
     * THE REFUSALS ARE ASSERTED BESIDE THE VALUES, and the pair is the whole
     * claim: unchanged values alone are equally true of a handler that never
     * reached the stores, and a throw alone says nothing about what survived it.
     *
     * `rootUri` IS READ THROUGH THE SEAL, and it is the one field here written
     * AFTER the object was built: `Tsudoi`'s members are getters deliberately,
     * because the object exists before `initialize` does, so a seal that had
     * turned them into values would report the pre-handshake `null` forever.
     */
    test("a handler cannot replace the stores, and the next one reads the genuine session", async () => {
      const session = LspSession.start(runtime, fixture("store-mutation.ts"));
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: folderUri,
          workspaceFolders: [{ uri: folderUri, name: "workspace" }],
        });
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri: documentUri,
            languageId: "plaintext",
            version: 1,
            text: documentText,
          },
        });

        const untouched = {
          text: documentText,
          folders: 1,
          covering: 1,
          rootUri: folderUri,
        };

        expect(await reportFrom(session)).toEqual({
          attempted: true,
          documentsGetRefused: true,
          foldersGetRefused: true,
          replaceStoreRefused: true,
          addMemberRefused: true,
          ...untouched,
        });
        expect(await reportFrom(session)).toEqual({
          attempted: false,
          documentsGetRefused: false,
          foldersGetRefused: false,
          replaceStoreRefused: false,
          addMemberRefused: false,
          ...untouched,
        });
      } finally {
        session.dispose();
      }
    });
  });
}
