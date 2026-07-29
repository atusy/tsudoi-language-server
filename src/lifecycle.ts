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
 * What the lifecycle answers about a message arriving right now. Each caller --
 * a request handler, the notification router, `exit` -- gets the answer for its
 * own kind of message rather than the raw state to interpret for itself.
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
    // The spec says the server should exit 0 "if the shutdown request has been
    // received before", and `received` is a real reading gap that this project
    // closes one way for all callers -- restating it elsewhere is how two sites
    // end up disagreeing.
    //
    // A PRE-INITIALIZE `shutdown` IS REFUSED, so shutDown() never runs and that
    // session exits 1. Reading `received` as bare arrival on the wire would have
    // a conforming server say two contradictory things about one request -- "I am
    // not initialized, I did not do this", then "success" -- and would need a
    // second flag beside the phase. vscode-languageserver 10.1.0 exits 0 for the
    // same sequence, but only because it never refuses: it has no
    // ServerNotInitialized at all, so its 0 answers a different question.
    //
    // THE BOUNDARY: this governs the `exit` NOTIFICATION. A session ending
    // without one -- stdin at EOF because the editor died -- never reaches here
    // and exits 0, which is correct: 1 is this protocol's word for `error`, and a
    // server terminating because its client is gone has not failed. Why a new
    // handle in src/ would destroy that exit is recorded at startServer.
    //
    // WHY NOT, so that nobody `fixes` it: the PIPELINED shutdown-then-exit is
    // DELIBERATELY UNDEFENDED. A client writing both in ONE write lets `exit` be
    // dispatched before the shutdown response is written, so the response is
    // never flushed and the editor hangs. LSP tells the client to await that
    // response first, and a server is not obliged to serve one that does not.
    // Unproven in either direction rather than known-good; pacing the exit behind
    // the in-flight response would also be acceptable.
    exitCode(): number {
      return phase === "shutdown" ? 0 : 1;
    },
  };
}
