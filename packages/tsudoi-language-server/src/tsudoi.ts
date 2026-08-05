import type { ClientCapabilities, InitializeParams } from "vscode-languageserver-protocol";
import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { DeepReadonly, Tsudoi } from "./types.ts";
import { createWorkspaceFolders, type WorkspaceFoldersHandle } from "./workspace.ts";

export interface TsudoiRuntime {
  /** What every `RequestContext` carries as its `tsudoi`, and the only route a
   * config has to the session. */
  readonly tsudoi: Tsudoi;
  /** The server's end of the document store. Never reachable from `tsudoi`. */
  readonly documents: DocumentStoreHandle;
  /**
   * The server's end of the folder mirror, for the ONE message that writes it
   * after the handshake. Never reachable from `tsudoi`.
   *
   * NARROWED TO `change` ALONE, WHICH FORECLOSES THE HALF-MIRROR RATHER THAN
   * MERELY DESCRIBING IT: a runtime handing out the WHOLE handle would leave
   * `initialize` callable beside `handshake` below -- an argument for the seam
   * and an open route around it in the same object.
   */
  readonly workspaceFolders: Pick<WorkspaceFoldersHandle, "change">;
  /**
   * EVERYTHING `Tsudoi` TAKES FROM `initialize`, WRITTEN BY ONE CALL.
   *
   * ONE SEAM RATHER THAN ONE CALL PER FIELD: the folder mirror and the client's
   * capabilities are read out of the same message and are meaningless apart from
   * each other, so two calls at the handshake would be two things to remember
   * and a HALF-MIRRORED SESSION would be the cost of forgetting either -- a
   * server answering from folders the client named while believing it declared
   * no capabilities at all.
   */
  readonly handshake: (
    params: Pick<
      InitializeParams,
      "workspaceFolders" | "rootUri" | "rootPath" | "capabilities"
    > | null,
  ) => void;
}

/**
 * The client's own statement, AS A VALUE NOTHING CAN REWRITE: a clone of what
 * arrived, frozen at every depth.
 *
 * ITERATIVE AND NOT RECURSIVE, AND THAT IS A CORRECTNESS REQUIREMENT RATHER THAN
 * A STYLE -- and nothing reddens if you make it recursive, since no test builds
 * the input: this runs inside the `initialize` handler, so a recursive walk over
 * deeply nested capabilities from a non-conforming client would exhaust the
 * stack THERE, answering the handshake -32603 out of a defence.
 *
 * `Object.isFrozen` IS THE TERMINATION GUARD as well as the skip, and nothing
 * reddens if you drop it either: a value already frozen has already had its
 * members queued, so a cycle -- which JSON.parse cannot build, and which
 * structuredClone would faithfully preserve if one ever arrived -- cannot loop
 * here.
 */
function frozenCapabilities(capabilities: ClientCapabilities): ClientCapabilities {
  const clone = structuredClone(capabilities);
  const pending: unknown[] = [clone];
  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current !== "object" || current === null || Object.isFrozen(current)) {
      continue;
    }
    Object.freeze(current);
    pending.push(...Object.values(current));
  }
  return clone;
}

/**
 * Builds the one server-lifetime `Tsudoi` and the handles that write what it
 * reads: the read-only view a config author meets through `RequestContext`, and
 * the writers the server feeds `initialize` and its notifications into.
 *
 * EVERY MEMBER THAT IS NOT A STORE IS A GETTER, AND THAT IS A CORRECTNESS
 * REQUIREMENT RATHER THAN A STYLE. A store is exempt because it is an OBJECT
 * THAT ANSWERS WHEN ASKED. Everything else here is a plain value the moment it
 * is read, and THIS RUNS BEFORE `initialize` DOES -- before the config is even
 * loaded -- so `...workspaceFolders.roots()` written here would capture the
 * pre-handshake `null` and hand it to every handler for the life of the session.
 *
 * THE ANNOTATION IS WHAT KEEPS THIS IN STEP: a member added to `Tsudoi` and
 * forgotten here does not compile, and the handles' own readers are typed as the
 * slice of `Tsudoi` they answer for, so a rename cannot pass through either.
 */
export function createTsudoi(): TsudoiRuntime {
  const documents = createDocumentStore();
  const workspaceFolders = createWorkspaceFolders();
  let clientCapabilities: ClientCapabilities = {};
  const tsudoi: Tsudoi = Object.freeze({
    documents: documents.documents,
    workspaceFolders: workspaceFolders.folders,
    get rootUri(): string | null {
      return workspaceFolders.roots().rootUri;
    },
    get rootPath(): string | null {
      return workspaceFolders.roots().rootPath;
    },
    get clientCapabilities(): DeepReadonly<ClientCapabilities> {
      return clientCapabilities;
    },
  });
  return {
    tsudoi,
    documents,
    workspaceFolders,
    handshake(params): void {
      workspaceFolders.initialize(params);
      clientCapabilities = frozenCapabilities(params?.capabilities ?? {});
    },
  };
}
