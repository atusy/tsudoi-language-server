import { ErrorCodes, ResponseError } from "vscode-languageserver-protocol/node";

/**
 * The three states an LSP session passes through, in order.
 *
 * ONE value rather than two booleans: `initialized && !hasShutdown` spreads a
 * single fact across two flags that are free to disagree, and leaves every
 * reader to work out which of the four combinations are reachable. Naming the
 * phase makes the unreachable ones unrepresentable.
 */
type Phase = "uninitialized" | "serving" | "shutdown";

/**
 * What the lifecycle answers about a message arriving right now. The three
 * questions are asked at three different places -- a request handler, the
 * NOTIFICATION ROUTER, and `exit` -- and each gets the answer for its own kind
 * of message rather than the raw state to interpret for itself.
 *
 * The middle arm used to read `a notification handler`, and that is now false:
 * no notification body consults this at all. notifications.ts asks ONCE, on
 * behalf of every entry that declared `gate: "lifecycle"`, which is what makes
 * forgetting the question impossible rather than merely unlikely.
 */
export interface Lifecycle {
  /** Records the client's initialize request. */
  initialize(): void;
  /** Records the client's shutdown request. */
  shutDown(): void;
  /**
   * The error a request arriving NOW must be answered with, or undefined when
   * it may be served.
   *
   * Two states, two codes: `not ready yet` and `already done` are different
   * diagnoses, and a client told ServerNotInitialized after shutdown would
   * reasonably retry the handshake it has just completed.
   */
  requestRejection(): ResponseError<void> | undefined;
  /**
   * Whether a notification arriving NOW may be acted on. Outside the serving
   * window LSP says to drop one, SILENTLY: a notification has no response, so
   * there is nothing a client could be told and nothing it could act on.
   */
  acceptsNotification(): boolean;
  /** The code `exit` must terminate the process with at this moment. */
  exitCode(): number;
}

export function createLifecycle(): Lifecycle {
  let phase: Phase = "uninitialized";

  return {
    initialize(): void {
      phase = "serving";
    },

    shutDown(): void {
      phase = "shutdown";
    },

    requestRejection(): ResponseError<void> | undefined {
      if (phase === "uninitialized") {
        return new ResponseError<void>(
          ErrorCodes.ServerNotInitialized,
          "The server has not been initialized; send initialize first.",
        );
      }
      if (phase === "shutdown") {
        return new ResponseError<void>(
          ErrorCodes.InvalidRequest,
          "The server has shut down; only exit is accepted now.",
        );
      }
      return undefined;
    },

    acceptsNotification(): boolean {
      return phase === "serving";
    },

    // LSP exit-code semantics: 0 only when shutdown came first, otherwise 1.
    // Compared against the phase by name -- there is no boolean here to read
    // for truth rather than for value.
    //
    // THIS BLOCK IS THE ONE PLACE THIS PROJECT'S READING OF THAT SENTENCE
    // LIVES. Two lifecycle questions turn on it -- the code after a REFUSED
    // shutdown, and the code when the editor simply dies -- and read months
    // apart by different people they can reach DIFFERENT CONCLUSIONS FROM THE
    // SAME TEXT, which would leave tsudoi with two rulings that disagree. Every
    // other site POINTS HERE instead of restating it; a second copy is the
    // duplication that makes the disagreement possible.
    //
    // THE SENTENCE, as the specification writes it, read at
    // microsoft/language-server-protocol on gh-pages (its DEFAULT branch --
    // `main` does not exist, which is worth knowing before re-reading it),
    // _includes/messages/3.17/exit.md:
    //
    //   The server should exit with `success` code 0 if the shutdown request
    //   has been received before; otherwise with `error` code 1.
    //
    // WHAT `RECEIVED` MEANS IS A REAL READING GAP, not a pedantry, and what
    // closes it is a rule in a DIFFERENT file:
    // _specifications/lsp/3.17/general/initialize.md says a REQUEST arriving
    // before `initialize` should be answered `code: -32002`, and that
    // notifications are dropped EXCEPT `exit` -- which exists so a server can
    // be shut down without ever being initialized. tsudoi does exactly that, so
    // a pre-initialize `shutdown` is REFUSED: shutDown() never runs and the
    // phase stays uninitialized. RULED: that session exits 1. Reading
    // `received` as bare arrival on the wire would make a conforming server say
    // two contradictory things about one request -- `I am not initialized, I
    // did not do this`, and then `success` -- and would need a second flag
    // beside the phase, which is the two-booleans-free-to-disagree design the
    // block at the top of this file exists to refuse. MEASURED end to end at
    // bun 1.3.13 and deno 2.9.2: -32002 on the wire, then exit code 1.
    //
    // THE REFERENCE IMPLEMENTATION DISAGREES, AND IT DOES NOT DECIDE THIS.
    // READ, NOT MEASURED, at vscode-languageserver 10.1.0 installed out of
    // tree, lib/common/server.js:766-788: `watchDog.shutdownReceived = true` is
    // the FIRST statement of its shutdown handler and its exit handler branches
    // on that flag, so the same sequence exits 0 there. But `ServerNotInitial-
    // ized` and `32002` appear NOWHERE in that package -- grepped over the
    // whole of it, because a claim that something is absent is a coverage claim
    // -- so it reaches 0 by NEVER REFUSING. Its 0 is the answer for a server
    // that SERVED the shutdown, and says nothing about one that refused it.
    //
    // AND THE BOUNDARY, which is the half a reader would otherwise invent: THE
    // SENTENCE GOVERNS THE `exit` NOTIFICATION. A session that ends WITHOUT one
    // -- stdin reaching EOF because the editor that spawned tsudoi died -- is
    // ruled by NOTHING above, and exits 0 because nothing calls this function
    // on that path at all. That 0 is correct rather than merely current, on a
    // ground worth stating because it is REASONED and not quoted: 1 is this
    // protocol's own word for `error`, and a server terminating because the
    // client it serves is gone has not failed -- it is doing what the same
    // initialize.md asks of it, in the `processId` doc: `If the parent process
    // is not alive then the server should exit (see exit notification) its
    // process.` WHY A NEW HANDLE IN src/ WOULD DESTROY THAT EXIT is recorded at
    // startServer in src/server.ts, which is where such an edit would be made.
    //
    // WHY NOT, so that nobody `fixes` it: the PIPELINED shutdown-then-exit is
    // DELIBERATELY UNDEFENDED. A client that writes `shutdown` and `exit` in ONE
    // write lets `exit` be dispatched before the shutdown RESPONSE has been
    // written, so server.ts calls process.exit(this) and the response the client
    // is waiting for is never flushed -- an editor hanging on shutdown. That is
    // spec-defensible: LSP tells the client to await the shutdown response
    // before sending exit, and a server is not obliged to serve a client that
    // does not. Ruled at Sprint 3 and never revisited; no test sends that
    // sequence, so it is unproven in either direction rather than known-good.
    // Pacing the exit behind the in-flight response would ALSO be acceptable,
    // which is why this is recorded here instead of pinned by a test.
    exitCode(): number {
      return phase === "shutdown" ? 0 : 1;
    },
  };
}
