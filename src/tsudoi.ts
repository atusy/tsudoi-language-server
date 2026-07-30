import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { Tsudoi } from "./types.ts";
import { createWorkspaceFolders, type WorkspaceFoldersHandle } from "./workspace.ts";

export interface TsudoiRuntime {
  /** What every `RequestContext` carries as its `tsudoi`, and the only route a
   * config has to the session. */
  readonly tsudoi: Tsudoi;
  /** The server's end of the document store. Never reachable from `tsudoi`. */
  readonly documents: DocumentStoreHandle;
  /** The server's end of the folder mirror. Never reachable from `tsudoi`. */
  readonly workspaceFolders: WorkspaceFoldersHandle;
}

/**
 * Builds the one server-lifetime `Tsudoi` and the handles that write what it
 * reads: the read-only view a config author meets through `RequestContext`, and
 * the writers the server feeds `initialize` and its notifications into.
 *
 * ONE OBJECT FOR THE WHOLE SESSION, AND THAT IS WHAT `Tsudoi` PROMISES. Nothing
 * assembles a second one per request, so the liveness the type documents is a
 * fact about this function rather than a claim made elsewhere: a handler reading
 * `tsudoi.workspaceFolders` twice is reading the same object twice.
 *
 * EVERY MEMBER THAT IS NOT THE STORE IS A GETTER, AND THAT IS A CORRECTNESS
 * REQUIREMENT RATHER THAN A STYLE. THIS RUNS BEFORE `initialize` DOES -- before
 * the config is even loaded -- so every one of these fields is at its
 * pre-handshake value on this line: no folders and no roots. Writing
 * `...workspaceFolders.roots()` here would capture THAT and hand it to every
 * handler for the life of the session, silently, however completely the client
 * named its project a moment later. A getter cannot be captured, which is why
 * the handles publish READERS and not values -- the same trap src/cli.ts records
 * for the config factory, one layer in.
 *
 * THE ANNOTATION IS WHAT KEEPS THIS IN STEP: a member added to `Tsudoi` and
 * forgotten here does not compile, and the handles' own readers are typed as the
 * slice of `Tsudoi` they answer for, so a rename cannot pass through either.
 */
export function createTsudoi(): TsudoiRuntime {
  const documents = createDocumentStore();
  const workspaceFolders = createWorkspaceFolders();
  const tsudoi: Tsudoi = {
    documents: documents.documents,
    get workspaceFolders(): readonly WorkspaceFolder[] {
      return workspaceFolders.current();
    },
    get rootUri(): string | null {
      return workspaceFolders.roots().rootUri;
    },
    get rootPath(): string | null {
      return workspaceFolders.roots().rootPath;
    },
  };
  return { tsudoi, documents, workspaceFolders };
}
