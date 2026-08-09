import { ErrorCodes, ResponseError } from "vscode-languageserver-protocol/node";

/**
 * The states an LSP session passes through, in order -- except `initializing`,
 * which is the one a session can leave BACKWARDS.
 *
 * ONE value rather than two booleans: `initialized && !hasShutdown` spreads a
 * single fact across two flags that are free to disagree, and leaves every
 * reader to work out which of the four combinations are reachable. Naming the
 * phase makes the unreachable ones unrepresentable.
 *
 * `initializing` EXISTS BECAUSE THE HANDSHAKE CAN YIELD, on a MEASURED
 * regression rather than for symmetry: once a config's own `initialize` handler
 * is awaited, admission and the transition to `serving` are separated by that
 * handler's whole duration. What a second `initialize` arriving in the gap did
 * before this phase existed is recorded where `beginInitialize` is CALLED, in
 * src/server.ts. It answers requests and notifications exactly as
 * `uninitialized` does; the ONLY question it answers differently is a second
 * `initialize`.
 */
type Phase = "uninitialized" | "initializing" | "serving" | "shutdown";

/**
 * What the lifecycle answers about a message arriving right now. Each caller --
 * a request handler, the notification router, `exit` -- gets the answer for its
 * own kind of message rather than the raw state to interpret for itself.
 */
export interface Lifecycle {
  /**
   * Records that a handshake has been ADMITTED and is now in flight -- which is
   * a different moment from the one below whenever a config supplies an
   * `initialize` handler, because that handler is awaited between the two.
   */
  beginInitialize(): void;
  /**
   * Records that an admitted handshake did NOT complete, returning the session
   * to `uninitialized` so the client may try again. The ONLY backwards edge, and
   * it exists because a failed handshake must not consume the one `initialize`
   * LSP permits -- `InitializeError.retry` is unimplementable otherwise.
   */
  abandonInitialize(): void;
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
   * that ADMITS a handshake.
   *
   * `ADMITS` AND NOT `ENDS THE UNINITIALIZED PHASE`: a config `initialize`
   * handler separates the two by its whole duration, and that gap is precisely
   * what `initializing` exists to answer for.
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
    beginInitialize(): void {
      phase = "initializing";
    },

    abandonInitialize(): void {
      phase = "uninitialized";
    },

    initialize(): void {
      phase = "serving";
    },

    shutDown(): void {
      phase = "shutdown";
    },

    requestRejection(): ResponseError<void> | undefined {
      // `initializing` ANSWERS WITH `uninitialized`'S ERROR AND NOT ONE OF ITS
      // OWN: a client that reaches here has sent a request before it holds the
      // InitializeResult, and which side of the await tsudoi happens to be on is
      // nothing it did or can act on.
      if (phase === "uninitialized" || phase === "initializing") {
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

    // ONE CODE AND THREE MESSAGES, because -32600 is what the specification
    // names for all of them while `already running one`, `already serving` and
    // `already shut down` are different things for a human reading their
    // editor's LSP log to have done. THE FIRST IS THE ONE `initializing` EXISTS
    // FOR, and answering it `undefined` was the measured regression.
    initializeRejection(): ResponseError<void> | undefined {
      if (phase === "uninitialized") {
        return undefined;
      }
      return new ResponseError<void>(
        ErrorCodes.InvalidRequest,
        phase === "initializing"
          ? "The server is already handling an initialize; a second one is not accepted."
          : phase === "serving"
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
