import process from "node:process";
import {
  type CompletionItem,
  type CompletionParams,
  CompletionRequest,
  type Hover,
  type HoverParams,
  HoverRequest,
  ProgressType,
  type ProtocolConnection,
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
 * A controller nobody aborts: the signal is part of the context a handler is
 * entitled to read from day one, and wiring it to the connection's cancellation
 * token is PBI-5's job, not something to half-do here.
 */
function requestContext(tsudoi: Tsudoi): RequestContext {
  return { signal: new AbortController().signal, tsudoi };
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
  connection.onRequest(HoverRequest.type, async (params: HoverParams): Promise<Hover | null> => {
    const handler = config.methods?.["textDocument/hover"];
    const context = requestContext(tsudoi);
    try {
      return (await handler?.(context, params)) ?? null;
    } catch (error) {
      reportHandlerFailure("textDocument/hover", error);
    }
  });

  // This handler is the whole of the streaming API. A config author writes
  // `yield` and `return`; whether that leaves as $/progress or as one
  // aggregated response is decided here, from the one thing the protocol
  // actually offers -- the presence of partialResultToken. There is no client
  // capability declaring partial-result support, so a client that cannot take
  // partial results simply omits the token, and the two triggers the brief
  // describes are one trigger.
  connection.onRequest(
    CompletionRequest.type,
    async (params: CompletionParams): Promise<CompletionItem[] | null> => {
      const handler = config.methods?.["textDocument/completion"];
      if (handler === undefined) {
        return null;
      }
      const context = requestContext(tsudoi);
      const token = params.partialResultToken;
      // What the author yielded, kept only when there is no token to stream it
      // under. In streaming mode this stays empty, which is what lets one
      // expression below answer for both modes.
      const collected: CompletionItem[] = [];
      let emitted = false;
      try {
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
    },
  );
}
