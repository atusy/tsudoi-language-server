// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  CompletionItem,
  CompletionParams,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

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
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE, and it is the ONE fixture where the
      // question needed thinking about rather than reading off a constant. The
      // candidate set is the CLIENT'S OWN workspace folder list, which is
      // mutable -- but it is snapshotted at request start, it is NOT filtered by
      // anything the user typed, and no further keystroke can add a folder to
      // it. Ruling it INCOMPLETE would contradict what this fixture exists to
      // assert: that the list a handler sees does not move mid-request.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        // THE READ IS INSIDE THE GENERATOR AT EACH YIELD, never hoisted into a
        // local above them. Both reads are now in one body -- until Sprint 43
        // the first was at the handler's call site and the second in a separate
        // generator -- and the property they defend is unchanged: a fixture that
        // captured `context.workspaceFolders` ONCE would go on passing under a
        // RequestContext that read the folders lazily.
        yield itemsFor(context.workspaceFolders);

        // Awaited polling, not a busy loop, exactly as completion-gate.ts does:
        // awaiting hands the event loop back so the server can process the
        // notifications that open this gate -- a busy loop would starve them.
        while (context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        yield itemsFor(context.workspaceFolders);
      },
    },
  });
};
