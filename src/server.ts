import process from "node:process";
import {
  type CompletionItem,
  type CompletionParams,
  CompletionRequest,
  createProtocolConnection,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ExitNotification,
  type Hover,
  type HoverParams,
  HoverRequest,
  InitializedNotification,
  InitializeRequest,
  type InitializeResult,
  type Logger,
  ProgressType,
  type ServerCapabilities,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import type { Method, RequestContext, Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * Where vscode-jsonrpc reports what it cannot answer for -- above all a
 * notification handler that threw, which it catches and would otherwise discard
 * in silence, since a notification has no response to carry the failure.
 *
 * Every level goes to stderr. stdout carries the protocol and nothing else, so
 * console.log here would corrupt the very stream the client is framing.
 */
const stderrLogger: Logger = {
  error: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  warn: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  info: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
  log: (message: string) => process.stderr.write(`tsudoi: ${message}\n`),
};

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
 * the client null, which reads as `nothing to say about this position` and
 * hides a broken handler behind a plausible answer.
 *
 * Only the reporting is shared: PBI-4's completion handler is an async
 * generator, so the CALL differs while this failure path does not.
 */
function reportHandlerFailure(method: Method, error: unknown): never {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`tsudoi: ${method} handler failed: ${detail}\n`);
  throw error;
}

/**
 * Starts serving LSP over stdio. Called only after the config has loaded, so
 * that no failure path can put bytes on stdout.
 *
 * `capabilities` is assembled per method from what the config actually
 * supplies, so tsudoi never claims something the config cannot answer.
 */
export function startServer(
  config: TsudoiConfig,
  documents: DocumentStoreHandle,
  tsudoi: Tsudoi,
): void {
  const connection = createProtocolConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
    stderrLogger,
  );

  let hasShutdown = false;

  connection.onRequest(InitializeRequest.type, (): InitializeResult => {
    const capabilities: ServerCapabilities = {
      // openClose is not optional: advertising only `change` entitles a
      // conforming client to withhold didOpen/didClose, and then the store
      // never sees a document however correct its own code is.
      // Full, not Incremental: the client resends the whole buffer, so no
      // position/offset machinery is needed to answer getText().
      textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Full },
    };
    // Per-method and spelled out, not derived from the shape of `methods`: a
    // client is entitled to send whatever it was told about, so each capability
    // is claimed only where the config can actually answer it.
    if (config.methods?.["textDocument/hover"] !== undefined) {
      capabilities.hoverProvider = true;
    }
    // Empty options, not triggerCharacters: TsudoiConfig has no surface for a
    // config author to declare them, and claiming trigger characters nobody
    // configured would have the client ask at moments the handler knows
    // nothing about.
    if (config.methods?.["textDocument/completion"] !== undefined) {
      capabilities.completionProvider = {};
    }
    return { capabilities, serverInfo: { name: "tsudoi" } };
  });

  connection.onNotification(InitializedNotification.type, () => {
    // The client is ready. Nothing to do until PBI-4 adds completion.
  });

  // The three sync notifications are pure delegation: what a full-sync buffer
  // means is documents.ts's business, and none of them answers the client.
  connection.onNotification(DidOpenTextDocumentNotification.type, (params) => {
    documents.open(params);
  });

  connection.onNotification(DidChangeTextDocumentNotification.type, (params) => {
    documents.change(params);
  });

  connection.onNotification(DidCloseTextDocumentNotification.type, (params) => {
    documents.close(params);
  });

  // Registered whether or not the config supplies a handler: registration and
  // advertisement are independent questions, and a client that sends hover
  // without being told about it is answered null rather than MethodNotFound --
  // a server must not fail because a client misbehaves.
  connection.onRequest(HoverRequest.type, async (params: HoverParams): Promise<Hover | null> => {
    const handler = config.methods?.["textDocument/hover"];
    // A controller nobody aborts: the signal is part of the context a handler
    // is entitled to read from day one, and wiring it to the connection's
    // cancellation token is PBI-5's job, not something to half-do here.
    const context: RequestContext = { signal: new AbortController().signal, tsudoi };
    try {
      return (await handler?.(context, params)) ?? null;
    } catch (error) {
      reportHandlerFailure("textDocument/hover", error);
    }
  });

  // Registered unconditionally, for the same reason hover is: what the server
  // advertised and what it will answer are separate questions.
  //
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
      const context: RequestContext = { signal: new AbortController().signal, tsudoi };
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

  // ShutdownRequest's declared result is void; vscode-jsonrpc puts null on the
  // wire for it, which is what the LSP specification requires.
  connection.onRequest(ShutdownRequest.type, (): void => {
    hasShutdown = true;
  });

  // LSP exit-code semantics: 0 only when shutdown came first, otherwise 1.
  connection.onNotification(ExitNotification.type, () => {
    process.exit(hasShutdown ? 0 : 1);
  });

  connection.listen();
}
