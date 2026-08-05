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
   */
  requestRejection(): ResponseError<void> | undefined;
  /**
   * The error an `initialize` arriving NOW must be answered with, or undefined
   * when the handshake may proceed. Its own question and not a narrowing of
   * requestRejection: one phase answers OPPOSITELY, since this is the request
   * that ENDS the uninitialized phase.
   */
  initializeRejection(): ResponseError<void> | undefined;
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

    // ONE CODE AND TWO MESSAGES, because -32600 is what the specification names
    // for both while `already serving` and `already shut down` are different
    // things for a human reading their editor's LSP log to have done.
    initializeRejection(): ResponseError<void> | undefined {
      if (phase === "uninitialized") {
        return undefined;
      }
      return new ResponseError<void>(
        ErrorCodes.InvalidRequest,
        phase === "serving"
          ? "The server is already initialized; a second initialize is not accepted."
          : "The server has shut down; initialize is not accepted now.",
      );
    },

    acceptsNotification(): boolean {
      return phase === "serving";
    },

    // The one place this project's reading of the specification's `if the
    // shutdown request has been received before` lives -- restating it elsewhere
    // is how two sites end up disagreeing. `received` is read as `accepted`: a
    // pre-initialize `shutdown` is refused, so shutDown() never runs and that
    // session exits 1, where bare arrival on the wire would have a conforming
    // server say `I am not initialized, I did not do this` and then `success`
    // about one request.
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
