// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  CompletionItem,
  CompletionParams,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

/**
 * The folders as items, so that WHAT A HANDLER COULD SEE arrives at the client
 * on the wire and in order.
 *
 * Exported so the test's expectation is built by the same function the fixture
 * answers with: the two cannot drift into disagreeing about the shape of an
 * item, which would make a mismatch look like a workspace failure.
 */
export function itemsFor(folders: readonly WorkspaceFolder[]): CompletionItem[] {
  return folders.map((folder) => ({ label: folder.uri, detail: folder.name }));
}

/**
 * Yields what its RequestContext says the workspace is, parks until the test
 * changes the document, then yields that again.
 *
 * THE READ IS INSIDE THE HANDLER AT EACH YIELD, never hoisted into a local
 * above them, and that is the whole reason this fixture exists rather than
 * reusing completion-gate.ts. The perturbation it is written for makes
 * RequestContext hold the thunk and read the folders LAZILY; a fixture that
 * captured `context.workspaceFolders` once would go on passing under that
 * change, which is a test that proves nothing about where the snapshot is
 * taken.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        yield itemsFor(context.workspaceFolders);

        // Awaited polling, not a busy loop, exactly as completion-gate.ts does:
        // awaiting hands the event loop back so the server can process the
        // notifications that open this gate -- a busy loop would starve them.
        while (context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        yield itemsFor(context.workspaceFolders);
        return null;
      },
    },
  });
};
