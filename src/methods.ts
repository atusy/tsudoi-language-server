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
  ProgressType,
  type ProtocolConnection,
  ResponseError,
} from "vscode-languageserver-protocol/node";
import type { Method, RequestContext, Tsudoi, TsudoiConfig } from "./types.ts";

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
): void {
  connection.onRequest(
    HoverRequest.type,
    async (params: HoverParams, cancellation: CancellationToken): Promise<Hover | null> => {
      const handler = config.methods?.["textDocument/hover"];
      const context = requestContext(tsudoi, cancellation);
      let hover: Hover | null;
      try {
        hover = (await handler?.(context, params)) ?? null;
      } catch (error) {
        reportHandlerFailure("textDocument/hover", error);
      }
      // Checked at SETTLE time, after the handler has had its say: a handler
      // that ignores the signal entirely still has its answer suppressed.
      if (context.signal.aborted) {
        requestCancelled();
      }
      return hover;
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
      const handler = config.methods?.["textDocument/completion"];
      if (handler === undefined) {
        return null;
      }
      const context = requestContext(tsudoi, cancellation);
      const token = params.partialResultToken;
      // What the author yielded, kept only when there is no token to stream it
      // under. In streaming mode this stays empty, which is what lets one
      // expression below answer for both modes.
      const collected: CompletionItem[] = [];
      let emitted = false;
      let items: CompletionItem[] | null;
      try {
        const chunks = handler(context, params);
        for (;;) {
          const next = await chunks.next();
          if (next.done === true) {
            // The RETURNED array alone in streaming mode: the yields have
            // already left as $/progress, so concatenating them here would
            // make a client that appends the response see every item twice.
            if (next.value !== null) {
              items = [...collected, ...next.value];
              break;
            }
            // [] versus null turns on whether THIS request produced a chunk.
            // `nothing further to add` and `nothing to say at all` are
            // different answers, and only request-local state tells them apart.
            items = emitted ? collected : null;
            break;
          }
          emitted = true;
          if (token === undefined) {
            collected.push(...next.value);
          } else {
            await connection.sendProgress(completionProgress, token, next.value);
          }
        }
      } catch (error) {
        reportHandlerFailure("textDocument/completion", error);
      }
      if (context.signal.aborted) {
        requestCancelled();
      }
      return items;
    },
  );
}
