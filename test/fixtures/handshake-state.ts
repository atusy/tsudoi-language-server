// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/**
 * A config that answers hover with BOTH HALVES OF THE SESSION AT ONCE: the
 * folder mirror `initialize` writes, and the document store `textDocument/didOpen`
 * writes.
 *
 * ONE OBSERVATION AND NOT TWO, which is the whole reason this exists beside
 * test/fixtures/workspace-folders.ts. That fixture reports the mirror alone, and
 * a mirror seen to move says nothing about TEARING -- a session whose documents
 * were dropped along with it would have been reset rather than torn. The claim
 * is about the two halves DISAGREEING, so they must be read from one request.
 *
 * URIS RATHER THAN DOCUMENTS: the store hands out a live implementation whose
 * members do not survive JSON, and the caller knows which uri it opened.
 */
export function stateOf(context: RequestContext): string {
  return JSON.stringify({
    workspaceFolders: [...context.tsudoi.workspaceFolders.values()],
    rootUri: context.tsudoi.rootUri,
    rootPath: context.tsudoi.rootPath,
    documents: [...context.tsudoi.documents.values()].map((document) => document.uri),
  });
}

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (context: RequestContext, _params: HoverParams): Promise<Hover> => {
        return Promise.resolve({
          contents: { kind: "plaintext", value: stateOf(context) },
        });
      },
    },
  });
};
