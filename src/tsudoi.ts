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
   * MERELY DESCRIBING IT. `handshake` below exists so the two things `initialize`
   * writes cannot be written apart, and a runtime handing out the WHOLE handle
   * would leave `initialize` callable beside it -- an argument for the seam and
   * an open route around it in the same object. This project prefers foreclosing
   * a failure to detecting one, and here the type does it.
   */
  readonly workspaceFolders: Pick<WorkspaceFoldersHandle, "change">;
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
   * `| null` IS UNREACHABLE AND IS KEPT ANYWAY, WHICH IS A SCOPE FACT AND NOT A
   * READING OF THE PROTOCOL. It is NOT that a client may send `"params": null`:
   * JSON-RPC 2.0 makes `params` a `Structured value` -- `an Array` or `an
   * Object` where present -- so `null` is malformed, and the `initialize`
   * boundary in src/server.ts refuses it -32602 before anything reaches here.
   * What the arm survives on is that `WorkspaceFoldersHandle.initialize`
   * declares it too: narrowing this alone would contradict a module this one
   * does not own, and the two must be narrowed together or not at all.
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
 * THE FREEZE IS WHAT BUYS THE PROPERTY. `readonly` on the published field is
 * erased at run time, and the members of `ClientCapabilities` are ordinary
 * writable properties, so one handler rewriting `insertReplaceSupport` leaves
 * the NEXT one reading a capability the client never declared -- and choosing
 * its edit shape from it, which examples/completion-path.ts does exactly. A
 * clone alone would not touch that: every handler reads the same clone.
 *
 * THE CLONE IS WHAT KEEPS THE FREEZE INSIDE WHAT THIS MODULE OWNS, which is the
 * half worth spelling out. Freezing `params.capabilities` in place would freeze
 * an object that is still part of the message -- and the same message's
 * `workspaceFolders` entries are STORED BY THE MIRROR in src/workspace.ts, so a
 * freeze applied one field over would silently change another module's state
 * under it.
 *
 * ITERATIVE AND NOT RECURSIVE, AND THAT IS A CORRECTNESS REQUIREMENT RATHER THAN
 * A STYLE: this runs inside the `initialize` handler, and a recursive walk over
 * deeply nested capabilities from a non-conforming client would exhaust the
 * stack THERE -- answering the handshake -32603 out of a defence. A worklist has
 * no such depth.
 *
 * `Object.isFrozen` IS THE TERMINATION GUARD as well as the skip: a value
 * already frozen has already had its members queued, so a cycle -- which
 * JSON.parse cannot build, and which structuredClone would faithfully preserve
 * if one ever arrived -- cannot loop here.
 *
 * WHAT IT COSTS: one walk of a small object, ONCE PER SESSION. The alternative
 * of freezing lazily on each read would run per request to defend against an
 * edit that happens once.
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
 * ONE OBJECT FOR THE WHOLE SESSION, AND THAT IS WHAT `Tsudoi` PROMISES. Nothing
 * assembles a second one per request, so the liveness the type documents is a
 * fact about this function rather than a claim made elsewhere: a handler reading
 * `tsudoi.workspaceFolders` twice is reading the same object twice.
 *
 * EVERY MEMBER THAT IS NOT A STORE IS A GETTER, AND THAT IS A CORRECTNESS
 * REQUIREMENT RATHER THAN A STYLE. A store is exempt because it is an OBJECT
 * THAT ANSWERS WHEN ASKED -- the folders and the documents it reports are read
 * inside its own methods, so the thing captured on this line holds no answer at
 * all. Everything else here is a plain value the moment it is read.
 * THIS RUNS BEFORE `initialize` DOES -- before
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
  // SEALED, AND THE GETTERS SURVIVE IT -- MEASURED under bun 1.3.13 and deno
  // 2.9.2 rather than assumed, since the whole shape below rests on it: freezing
  // an ACCESSOR property makes it non-configurable and leaves the getter
  // callable, so `rootUri` still answers about the handshake that has not
  // happened on this line. A seal that had read the members out would hand every
  // handler the pre-handshake `null` for the life of the session, which is the
  // trap the paragraph above exists for.
  //
  // WHAT IT CLOSES is the half `readonly` on the interface cannot: `readonly` is
  // erased, so shipped JavaScript could replace `documents` with a store of its
  // own, or ADD a member no type declares -- and this is ONE OBJECT FOR THE
  // WHOLE SESSION, so either lands on every later handler rather than on the one
  // that wrote it. The stores it names seal themselves, each where it is built.
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
      // MIRRORED WHOLE AND NOT READ, exactly as `rootUri` is: what a client can
      // do is the client's statement, and a server that rewrote it would be
      // answering about capabilities nobody declared. CLONING IS NOT REWRITING
      // -- what a handler reads is what the client sent, member for member --
      // and what the clone buys is at `frozenCapabilities` above.
      //
      // `??` AND NOT A TYPE TEST, because the type is decided ONE FILE UP: a
      // `capabilities` that is present and not an object is refused -32602 at
      // the `initialize` boundary in src/server.ts, so the only two shapes
      // reaching this line are the two `??` covers -- an OMITTED field, which a
      // non-conforming client sends despite the type declaring it required, and
      // an explicit `null`. Both are a client that declared nothing, and `{}` is
      // what a handler is promised for that.
      clientCapabilities = frozenCapabilities(params?.capabilities ?? {});
    },
  };
}
