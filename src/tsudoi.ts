import type {
  ClientCapabilities,
  InitializeParams,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { Tsudoi } from "./types.ts";
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
   * `initialize` IS NOT WRITTEN THROUGH HERE, deliberately -- see `handshake`.
   */
  readonly workspaceFolders: WorkspaceFoldersHandle;
  /**
   * EVERYTHING `Tsudoi` TAKES FROM `initialize`, WRITTEN BY ONE CALL.
   *
   * ONE SEAM RATHER THAN ONE CALL PER FIELD, and that is what it buys: the
   * folder mirror and the client's capabilities are read out of the same message
   * and are meaningless apart from each other, so two calls at the handshake
   * would be two things to remember and a HALF-MIRRORED SESSION would be the
   * cost of forgetting either -- a server answering from folders the client
   * named while believing it declared no capabilities at all. Here that is
   * unrepresentable rather than merely unlikely.
   *
   * `| null` IS THE WIRE SHAPE, for the reason `WorkspaceFoldersHandle`
   * describes at length: JSON-RPC lets any client send `"params": null`, and the
   * declared `InitializeParams` describes a CONFORMING client rather than the
   * bytes that arrive.
   */
  readonly handshake: (
    params: Pick<
      InitializeParams,
      "workspaceFolders" | "rootUri" | "rootPath" | "capabilities"
    > | null,
  ) => void;
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
  // `{}` BEFORE THE HANDSHAKE AND `{}` FOR A CLIENT THAT DECLARED NOTHING, one
  // value for both, which is what lets a handler read a capability without
  // asking whether there are any. No request can observe the pre-handshake
  // state -- the lifecycle refuses everything until `initialize` has run -- so
  // the two states are indistinguishable BY CONSTRUCTION rather than by
  // coincidence, and nothing downstream has a reason to tell them apart.
  let clientCapabilities: ClientCapabilities = {};
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
    get clientCapabilities(): ClientCapabilities {
      return clientCapabilities;
    },
  };
  return {
    tsudoi,
    documents,
    workspaceFolders,
    handshake(params): void {
      workspaceFolders.initialize(params);
      // MIRRORED WHOLE AND NOT READ, exactly as `rootUri` is: what a client can
      // do is the client's statement, and a server that rewrote it would be
      // answering about capabilities nobody declared.
      //
      // `??` AND NOT A TYPE TEST, and the asymmetry with the folder list beside
      // it is measured rather than stylistic. A non-array `workspaceFolders`
      // survives being stored and THROWS ONE MESSAGE LATER, inside a
      // notification that has no response to carry the failure, which is why
      // that field is checked. Nothing here spreads, iterates or indexes this
      // value: a handler reads a member off it, and a member read off a number
      // or a string is `undefined` on both runtimes. So the only two values that
      // would break a reader are the two `??` covers -- an OMITTED field, which
      // a non-conforming client sends despite the type declaring it required,
      // and an explicit `null`.
      clientCapabilities = params?.capabilities ?? {};
    },
  };
}
