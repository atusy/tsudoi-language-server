import type { ClientCapabilities, InitializeParams } from "vscode-languageserver-protocol";
import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { DeepReadonly, Tsudoi } from "./types.ts";
import { createWorkspaceFolders, type WorkspaceFoldersHandle } from "./workspace.ts";

export interface TsudoiRuntime {
  /** What every `RequestContext` carries as its `tsudoi`, and the only route a
   * config has to the session. */
  readonly tsudoi: Tsudoi;
  /**
   * Hands the runtime the connection `tsudoi.notify` speaks on.
   *
   * A SEAM AND NOT A CONSTRUCTOR ARGUMENT, forced by the order things exist in:
   * `createTsudoi()` runs in src/cli.ts BEFORE the config is loaded, and the
   * connection is created inside `startServer` -- so there is no moment at which
   * both are in hand except this one.
   *
   * NARROWED TO `sendNotification`, for the reason the folder handle above is
   * narrowed to `change`: a runtime holding the whole connection would leave
   * every request-side member callable from the object whose job is to expose
   * one write, which is an argument for the seam and an open route around it in
   * the same value.
   */
  readonly connect: (send: (method: string, params?: unknown) => Promise<void>) => void;
  /** The server's end of the document store. Never reachable from `tsudoi`. */
  readonly documents: DocumentStoreHandle;
  /**
   * The server's end of the folder mirror, for the ONE message that writes it
   * after the handshake. Never reachable from `tsudoi`.
   *
   * `NEVER REACHABLE` IS ABOUT THE MIRRORS AND NOT ABOUT WRITING AS SUCH, which
   * `Tsudoi.notify` is what makes worth saying: this handle and the store's
   * write state tsudoi MIRRORS FROM THE CLIENT, so a second writer would make
   * the mirror disagree with the thing it mirrors. Sending a notification
   * rewrites nothing the client said.
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
   *
   * WHAT IT FORECLOSES IS FORGETTING A CALL AND NOT A THROW BETWEEN THE TWO
   * WRITES, which the body still has: the folders go in first, so anything
   * raised while freezing the capabilities leaves exactly the half-mirror above.
   * UNOBSERVABLE TODAY and recorded anyway, because the reason it is
   * unobservable is elsewhere -- the phase never moves on that path, and both
   * writers overwrite unconditionally, so the client's retry repairs it.
   */
  readonly handshake: (
    params: Pick<
      InitializeParams,
      "workspaceFolders" | "rootUri" | "rootPath" | "capabilities"
    > | null,
  ) => void;
}

/**
 * A VALUE NOTHING CAN REWRITE: a clone of what came in, frozen at every depth.
 *
 * A CLONE AND NOT A FREEZE IN PLACE, AND WHAT IT BUYS IS ABOUT THE INPUT RATHER
 * THAN THE OUTPUT. Neither caller keeps its input to work on afterwards, so
 * `tsudoi may still edit its own copy` is the reason to strike rather than the
 * one to give. What the capabilities caller DOES with its input is HAND IT ON:
 * the same `InitializeParams` reaches the config's own `initialize` handler as
 * `params`, so freezing in place would freeze a member of the object THEY are
 * given -- a `readonly` tsudoi never declared on that surface, arriving in their
 * file as a throw rather than a diagnostic.
 *
 * ITERATIVE AND NOT RECURSIVE, AND THAT IS A CORRECTNESS REQUIREMENT RATHER THAN
 * A STYLE -- and nothing reddens if you make it recursive, since no test builds a
 * DEEP input: this runs inside the `initialize` handler, so a recursive walk over
 * deeply nested capabilities from a non-conforming client would exhaust the
 * stack THERE, answering the handshake -32603 out of a defence.
 *
 * ON BUN. MEASURED, and the requirement is a runtime's and not the language's: a
 * recursive freeze died at 30k of nesting where `structuredClone` still returned,
 * and structuredClone itself died at 44k -- so bun has a real window this buys.
 * DENO HAS NONE. There the clone one line down throws first, fine at 2200 and
 * RangeError by 2400, so no depth exists at which the iterative walk is what
 * saves the handshake. It is kept for the runtime that has the window, and the
 * sentence is qualified because an unqualified one sends a reader looking for a
 * defence that is doing nothing where they are standing.
 *
 * AND THE CLONE IS INSIDE THE CALLER'S `try` AT THE HANDSHAKE HANDLER, WHICH
 * MISATTRIBUTES ITS OWN FAILURES: put a function or a symbol into
 * `preparedResult` and `structuredClone` raises DataCloneError into that catch,
 * where tsudoi reports its OWN bug to a config author as `initialize handler
 * failed`.
 *
 * `Object.isFrozen` IS THE TERMINATION GUARD as well as the skip, and nothing
 * reddens if you drop it either: a value already frozen has already had its
 * members queued, so a cycle -- which JSON.parse cannot build, and which
 * structuredClone would faithfully preserve if one ever arrived -- cannot loop
 * here.
 */
export function deepFrozen<T>(value: T): T {
  const clone = structuredClone(value);
  const pending: unknown[] = [clone];
  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current !== "object" || current === null || Object.isFrozen(current)) {
      continue;
    }
    Object.freeze(current);
    // A LOOP AND NOT `push(...values)`, which is the SAME BUG THE WALK ITSELF
    // AVOIDS, reintroduced one line down: a spread is an argument list, and an
    // argument list is a stack frame. MEASURED, and the runtimes are far apart:
    // deno threw RangeError at a 150k-element array where bun held to 500k and
    // threw at 1M. Reachable from the WIRE -- this walks client-supplied
    // capabilities -- and measured end to end, a client sending 200k elements
    // inside `capabilities` was answered -32603 on deno, served on bun, with
    // NOTHING on stderr either way, the throw escaping at `handshake()` outside
    // the try below.
    for (const member of Object.values(current)) {
      pending.push(member);
    }
  }
  return clone;
}

/**
 * Builds the one server-lifetime `Tsudoi` and the handles that write what it
 * reads.
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
  let send: ((method: string, params?: unknown) => Promise<void>) | undefined;
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
    /**
     * READ AT CALL TIME AND NOT CAPTURED, which is the same requirement every
     * getter above is under: this object is built before the connection exists,
     * so a `send` bound here would be the `undefined` of that moment for the life
     * of the session.
     *
     * THE REFUSAL NAMES THE STATE RATHER THAN THE SYMPTOM, and it is UNREACHABLE
     * FROM A HANDLER: `startServer` connects before it registers anything, and a
     * config factory is handed no `tsudoi` at all. It is kept because the
     * alternative to a sentence is a `TypeError` about `undefined`, which sends
     * a reader looking at their own handler.
     */
    notify(method: string, params?: unknown): Promise<void> {
      if (send === undefined) {
        return Promise.reject(
          new Error(
            `tsudoi.notify("${method}") was called before this server had a connection to send on`,
          ),
        );
      }
      return send(method, params);
    },
  });
  return {
    tsudoi,
    documents,
    workspaceFolders,
    connect(connected): void {
      send = connected;
    },
    handshake(params): void {
      workspaceFolders.initialize(params);
      clientCapabilities = deepFrozen(params?.capabilities ?? {});
    },
  };
}
