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
 * questions are asked at three different places -- a request handler, a
 * notification handler, and `exit` -- and each gets the answer for its own kind
 * of message rather than the raw state to interpret for itself.
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
    exitCode(): number {
      return phase === "shutdown" ? 0 : 1;
    },
  };
}
