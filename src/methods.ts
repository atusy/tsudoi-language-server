import process from "node:process";
import {
  type CancellationToken,
  type CompletionItem,
  type CompletionParams,
  CompletionRequest,
  type Hover,
  type HoverParams,
  HoverRequest,
  LSPErrorCodes,
  type ProgressToken,
  ProgressType,
  type ProtocolConnection,
  ResponseError,
} from "vscode-languageserver-protocol/node";
import type { Method, RequestContext, Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * Asks the lifecycle what a request arriving NOW must be answered with, or
 * undefined when it may be served. Owned by server.ts, which knows the
 * lifecycle; consulted here, where the config author's handlers are called.
 */
export type RequestRejection = () => ResponseError<void> | undefined;

/**
 * Types the `value` of the `$/progress` notifications completion streams. A
 * single instance because ProgressType carries no state: it exists so that the
 * payload is a CompletionItem[] and nothing else.
 */
const completionProgress = new ProgressType<CompletionItem[]>();

/**
 * Reports a config handler's failure and rethrows it.
 *
 * vscode-jsonrpc answers the client -32603 for a throwing REQUEST handler, so
 * the client knows the request failed -- but it consults the connection's
 * logger for NOTIFICATION handlers only, leaving stderr empty and the config
 * author debugging a handler they cannot see fail. Hence tsudoi's own line.
 *
 * The rethrow is the load-bearing half. Absorbing the failure here would answer
 * the client null or [], which reads as `nothing to say` and hides a broken
 * handler behind a plausible answer -- and on the streaming path it would do so
 * after the client had already been sent partial results.
 *
 * Only the REPORTING is shared. The calls stay separate: a hover handler is
 * awaited once and a completion handler is driven a chunk at a time, and there
 * is no shape both fit into that is not an invention.
 */
function reportHandlerFailure(method: Method, error: unknown): never {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`tsudoi: ${method} handler failed: ${detail}\n`);
  throw error;
}

/**
 * How a cancelled request is answered, whatever its handler produced.
 *
 * LSP 3.17 permits answering normally instead, so this is a CHOICE: the client
 * has already discarded the request's context, and a stale result invites the
 * desync that partial results are careful to avoid.
 *
 * Thrown rather than returned because vscode-jsonrpc replies a thrown
 * ResponseError verbatim -- which keeps every handler's return type the config
 * author's own, with no error shape mixed into it.
 */
function requestCancelled(): never {
  throw new ResponseError(LSPErrorCodes.RequestCancelled, "Request cancelled");
}

/**
 * Bridges the connection's CancellationToken onto the AbortSignal a config
 * author already has, ONE controller per request: a shared one would abort
 * every handler in flight when the client cancelled any single request.
 *
 * tsudoi bridges rather than tracking `$/cancelRequest` itself. It could not
 * track it if it wanted to -- vscode-jsonrpc consumes that notification before
 * consulting any handler, and a request handler is never told its own id.
 */
function requestContext(tsudoi: Tsudoi, cancellation: CancellationToken): RequestContext {
  const controller = new AbortController();
  // Read BEFORE subscribing, and not merely to save a turn: when the client
  // cancels before the request is dispatched, vscode-jsonrpc cancels the token
  // source ahead of the handler, which installs CancellationToken.Cancelled --
  // whose onCancellationRequested is Event.None and never fires at all. The
  // flag is the only evidence of that cancellation.
  if (cancellation.isCancellationRequested) {
    controller.abort();
  }
  cancellation.onCancellationRequested(() => controller.abort());
  return { signal: controller.signal, tsudoi };
}

/**
 * Runs one config handler to the answer the client receives, under that
 * request's cancellation.
 *
 * Everything cancellation changes about a request is here and nowhere else: a
 * cancelled request answers -32800 whatever its handler produced, and a
 * cancelled handler's failure is not reported, because being aborted is why it
 * failed. The abort is re-read AFTER the handler settles, so a handler that
 * never looks at its signal is suppressed exactly like one that does.
 *
 * Only the ANSWER is shared. The CALLS stay separate: a hover handler is
 * awaited once and a completion handler is driven a chunk at a time, and
 * `produce` is where that difference lives.
 */
async function answerUnlessCancelled<T>(
  method: Method,
  signal: AbortSignal,
  produce: () => Promise<T>,
): Promise<T> {
  let value: T;
  try {
    value = await produce();
  } catch (error) {
    // A cancelled handler is EXPECTED to fail: an aborted fetch rejects by
    // design. A failure line plus a stack for every cancellation would train
    // the config author to ignore the one stderr channel that means something.
    if (signal.aborted) {
      requestCancelled();
    }
    reportHandlerFailure(method, error);
  }
  if (signal.aborted) {
    requestCancelled();
  }
  return value;
}

/**
 * Whether a value is a ProgressToken: LSP defines the type as `integer |
 * string`, so `0` and `""` are both legitimate AND falsy. That is why this is a
 * type test rather than a truthiness test -- `if (!token)` would fix the null
 * case and break every client that numbers its tokens from zero.
 */
function isProgressToken(value: unknown): value is ProgressToken {
  return typeof value === "string" || (typeof value === "number" && Number.isInteger(value));
}

/**
 * The token this completion may stream under, or undefined when it must be
 * aggregated into one response instead.
 *
 * NORMALISE AND REPORT, chosen on harm-proportionality. Answering -32602 would
 * cost an editor user every completion for their client's serialisation quirk;
 * normalising in silence is the invisible-client-bug failure mode. Streaming
 * under the invalid token is worse than either: null survives sendProgress, so
 * the items leave addressed to a `$/progress` no client can correlate and the
 * user simply sees fewer candidates than the handler produced.
 *
 * Validation lives here and nowhere else. One call site, no seam: the story is
 * protocol-violation handling, the implementation is one concrete case. HOW
 * OFTEN the refusal is reported is the caller's business, not this function's.
 */
function streamingToken(
  requested: unknown,
  report: (requested: unknown) => void,
): ProgressToken | undefined {
  if (requested === undefined) {
    return undefined;
  }
  if (isProgressToken(requested)) {
    return requested;
  }
  report(requested);
  return undefined;
}

/**
 * Registers the request handlers a config can answer.
 *
 * Every one is registered whether or not the config supplies a handler:
 * registration and advertisement are independent questions, and a client that
 * sends a request it was never told about is answered emptily rather than
 * MethodNotFound -- a server must not fail because a client misbehaves.
 */
export function registerMethods(
  connection: ProtocolConnection,
  config: TsudoiConfig,
  tsudoi: Tsudoi,
  requestRejection: RequestRejection,
): void {
  /**
   * Whether this SESSION has already been told about an invalid token. One
   * process serves one client, so the flag's lifetime is the session's.
   */
  let invalidTokenReported = false;

  /**
   * Names a refused token on stderr ONCE. A client whose serialisation
   * produces a bad token produces it on every keystroke, and a line per
   * completion buries everything else in the LSP log -- the one channel a
   * config author has for a handler that failed. Once is diagnosable; a
   * thousand times is noise that makes the log useless for anything else.
   */
  function reportInvalidToken(requested: unknown): void {
    if (invalidTokenReported === true) {
      return;
    }
    invalidTokenReported = true;
    // JSON.stringify, not String(): a token is client data of any shape, and
    // `[object Object]` would name nothing the config author could act on.
    process.stderr.write(
      `tsudoi: ignoring an invalid partialResultToken ${JSON.stringify(requested)}; ` +
        `a ProgressToken is an integer or a string, so this completion is answered ` +
        `as one aggregated response.\n`,
    );
  }

  connection.onRequest(
    HoverRequest.type,
    async (params: HoverParams, cancellation: CancellationToken): Promise<Hover | null> => {
      const rejection = requestRejection();
      if (rejection !== undefined) {
        throw rejection;
      }
      const handler = config.methods?.["textDocument/hover"];
      const context = requestContext(tsudoi, cancellation);
      return answerUnlessCancelled("textDocument/hover", context.signal, async () => {
        return (await handler?.(context, params)) ?? null;
      });
    },
  );

  // This handler is the whole of the streaming API. A config author writes
  // `yield` and `return`; whether that leaves as $/progress or as one
  // aggregated response is decided here, from the one thing the protocol
  // actually offers -- the presence of partialResultToken. There is no client
  // capability declaring partial-result support, so a client that cannot take
  // partial results simply omits the token, and the two triggers the brief
  // describes are one trigger.
  connection.onRequest(
    CompletionRequest.type,
    async (
      params: CompletionParams,
      cancellation: CancellationToken,
    ): Promise<CompletionItem[] | null> => {
      const rejection = requestRejection();
      if (rejection !== undefined) {
        throw rejection;
      }
      const handler = config.methods?.["textDocument/completion"];
      if (handler === undefined) {
        return null;
      }
      const context = requestContext(tsudoi, cancellation);
      // Read through `unknown` on purpose: the declared ProgressToken type
      // describes what a CONFORMING client sends, and this path exists for the
      // one that does not.
      const requestedToken: unknown = params.partialResultToken;
      const token = streamingToken(requestedToken, reportInvalidToken);
      return answerUnlessCancelled("textDocument/completion", context.signal, async () => {
        // What the author yielded, kept only when there is no token to stream
        // it under. In streaming mode this stays empty, which is what lets one
        // expression below answer for both modes.
        const collected: CompletionItem[] = [];
        let emitted = false;
        const chunks = handler(context, params);
        for (;;) {
          const next = await chunks.next();
          if (next.done === true) {
            // The RETURNED array alone in streaming mode: the yields have
            // already left as $/progress, so concatenating them here would
            // make a client that appends the response see every item twice.
            if (next.value !== null) {
              return [...collected, ...next.value];
            }
            // [] versus null turns on whether THIS request produced a chunk.
            // `nothing further to add` and `nothing to say at all` are
            // different answers, and only request-local state tells them apart.
            return emitted ? collected : null;
          }
          // Checked HERE, between pulling a chunk and sending it: the abort
          // typically lands while `next()` is parked, so a check at the top of
          // the loop would already have passed and this chunk would go out to
          // a client that has stopped listening. Returning also stops driving
          // the generator, which is the point of cancelling at all. The value
          // is discarded either way -- the answer is already -32800.
          if (context.signal.aborted) {
            // Returning stops DRIVING the generator; closing it is what runs
            // the config author's `finally`. Without this the generator is left
            // suspended at its yield forever, and cleanup nobody can watch
            // succeed is silently skipped on every superseded keystroke.
            //
            // Above the mode split, where the abort check already is: whether
            // this request streamed or aggregated says what the CLIENT can take
            // and nothing about what the HANDLER holds open.
            await chunks.return(null);
            return null;
          }
          emitted = true;
          if (token === undefined) {
            collected.push(...next.value);
          } else {
            await connection.sendProgress(completionProgress, token, next.value);
          }
        }
      });
    },
  );
}
