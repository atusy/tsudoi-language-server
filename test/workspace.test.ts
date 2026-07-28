import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult, WorkspaceFolder } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const echoConfig = fixture("workspace-folders.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * TWO folders, not one: the field is an array on the wire, so an
 * implementation keeping only the first satisfies a single-folder assertion
 * while losing everything a client sent after it.
 *
 * Paths that need not exist: what a folder MEANS is the config author's
 * business, and tsudoi's claim is only that it hands over what arrived.
 */
const sentFolders: WorkspaceFolder[] = [
  { uri: "file:///home/me/project", name: "project" },
  { uri: "file:///home/me/notes", name: "notes" },
];

/**
 * What the handler observed ON ITS OWN RequestContext, read back through the
 * fixture's hover.
 *
 * `undefined` when the field was absent, which is the state the normalisation
 * criteria exist to rule out -- so this deliberately does NOT default it away.
 */
async function observedFolders(session: LspSession): Promise<unknown> {
  const hover = await session.request<Hover>("textDocument/hover", {
    textDocument: { uri },
    position: { line: 0, character: 0 },
  });
  const contents = hover.contents as { value?: string };
  const observation = JSON.parse(contents.value ?? "{}") as { workspaceFolders?: unknown };
  return observation.workspaceFolders;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // CRITERION 1's positive half, and the PERMANENT PAIR for every absence
    // assertion below: the same fixture, the same hover, the same reader. A
    // `the handler observed an empty list` claim measured by a path that can
    // never observe anything is satisfied by a broken measurement.
    test("a handler observes the workspace folders the client sent at initialize", async () => {
      const session = LspSession.start(runtime, echoConfig);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          workspaceFolders: sentFolders,
        });
        session.notify("initialized", {});

        expect(await observedFolders(session)).toEqual(sentFolders);
      } finally {
        session.dispose();
      }
    });
  });
}
