// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  CompletionItem,
  CompletionParams,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

export const gateOpen = "release";

/**
 * Exported so the test's expectation is built by the same function the fixture
 * answers with: the two cannot drift into disagreeing about the shape of an
 * item, which would make a mismatch look like a workspace failure.
 */
export function itemsFor(folders: Iterable<WorkspaceFolder>): CompletionItem[] {
  return Array.from(folders, (folder) => ({ label: folder.uri, detail: folder.name }));
}

/**
 * `tsudoi.workspaceFolders` IS A LIVE READ, so the second yield is the one that
 * must differ from the first once the test has changed the folders underneath.
 * THE READS ARE INSIDE THE GENERATOR AT EACH YIELD, never hoisted into a local
 * above them, which is the whole reason this fixture exists rather than reusing
 * completion-gate.ts: a fixture that read once and yielded the same local twice
 * would pass whether the surface were live or frozen, and would prove neither.
 *
 * THE THIRD YIELD IS THE OTHER HALF, AND IT IS DELIBERATELY THE SAME ITERABLE
 * THE FIRST ONE CAME FROM. What a handler can do about liveness is TAKE THE
 * VALUE BEFORE ITS FIRST `await`, and that is worth nothing unless what it took
 * stays as it was. `change()` in
 * packages/tsudoi-language-server/src/workspace.ts builds a new array rather
 * than writing into the live one; make it `push` into the old one instead and
 * this yield reddens while the second one goes on passing, which is what makes
 * the two halves separable rather than one assertion in two spellings.
 *
 * TAKEN AS `values()` AND NOT AS `Array.from(values())`, which is the whole of
 * what this third yield can measure: a copy is unmoved by a mirror written in
 * place, so a fixture that copied would pass under that very `push` and this
 * guard would be measuring its own snapshot.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        // TAKEN BEFORE THE FIRST `await`, which is the one move the published
        // surface offers a handler that needs the folders it started with.
        const started = context.tsudoi.workspaceFolders.values();
        yield itemsFor(started);

        // Awaited polling, not a busy loop, exactly as completion-gate.ts does:
        // awaiting hands the event loop back so the server can process the
        // notifications that open this gate -- a busy loop would starve them.
        while (context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        // READ AGAIN, AND FROM THE SERVER RATHER THAN FROM `started`: this is
        // the live read, and it is the batch that must carry the folder the test
        // added while this generator was parked.
        yield itemsFor(context.tsudoi.workspaceFolders.values());

        // AND THE ARRAY THIS REQUEST BEGAN WITH, UNMOVED.
        yield itemsFor(started);
      },
    },
  });
};
