import process from "node:process";
import {
  createProtocolConnection,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ErrorCodes,
  ExitNotification,
  InitializedNotification,
  InitializeRequest,
  type InitializeResult,
  type Logger,
  ResponseError,
  type ServerCapabilities,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import { registerMethods } from "./methods.ts";
import type { Tsudoi, TsudoiConfig } from "./types.ts";

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
  let initialized = false;

  /**
   * The error a request must be answered with at this moment in the lifecycle,
   * or undefined when it may be served.
   *
   * Consulted by the handlers tsudoi REGISTERED, never by the dispatch as a
   * whole -- that is what leaves a method nobody registered falling through to
   * vscode-jsonrpc's MethodNotFound. `not initialized yet` and `no such method`
   * are different diagnoses, and a client is entitled to both.
   */
  function requestRejection(): ResponseError<void> | undefined {
    if (initialized === false) {
      return new ResponseError<void>(
        ErrorCodes.ServerNotInitialized,
        "The server has not been initialized; send initialize first.",
      );
    }
    // A separate state and a separate code. `not ready yet` and `already done`
    // are not the same refusal, and a client told ServerNotInitialized after
    // shutdown would reasonably retry the handshake.
    if (hasShutdown === true) {
      return new ResponseError<void>(
        ErrorCodes.InvalidRequest,
        "The server has shut down; only exit is accepted now.",
      );
    }
    return undefined;
  }

  connection.onRequest(InitializeRequest.type, (): InitializeResult => {
    // initialize is the one request the gate may never refuse -- refusing it
    // would make the state it guards unreachable.
    initialized = true;
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

  /**
   * Whether a notification arriving now may be acted on.
   *
   * Outside the serving window LSP says to DROP one, silently: a notification
   * has no response, so there is nothing a client could be told and nothing it
   * could act on -- the same ruling PBI-2 made for an unopened URI. `exit` is
   * deliberately not routed through here; it is the one notification that must
   * be obeyed at every moment of the lifecycle, and a gate written without
   * that exception leaves the process alive forever.
   */
  function notificationAccepted(): boolean {
    return initialized === true && hasShutdown === false;
  }

  connection.onNotification(InitializedNotification.type, () => {
    // The client is ready. Registered rather than left unhandled so that
    // vscode-jsonrpc does not log it as unanswered on every session.
  });

  // The three sync notifications are pure delegation: what a full-sync buffer
  // means is documents.ts's business, and none of them answers the client.
  connection.onNotification(DidOpenTextDocumentNotification.type, (params) => {
    if (notificationAccepted() === false) {
      return;
    }
    documents.open(params);
  });

  connection.onNotification(DidChangeTextDocumentNotification.type, (params) => {
    if (notificationAccepted() === false) {
      return;
    }
    documents.change(params);
  });

  connection.onNotification(DidCloseTextDocumentNotification.type, (params) => {
    if (notificationAccepted() === false) {
      return;
    }
    documents.close(params);
  });

  // What the config can answer lives in its own module: lifecycle and document
  // sync are tsudoi's own business, whereas these hand control to code the
  // config author wrote and have a failure path of their own.
  registerMethods(connection, config, tsudoi, requestRejection);

  // ShutdownRequest's declared result is void; vscode-jsonrpc puts null on the
  // wire for it, which is what the LSP specification requires.
  connection.onRequest(ShutdownRequest.type, (): void => {
    const rejection = requestRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    hasShutdown = true;
  });

  // LSP exit-code semantics: 0 only when shutdown came first, otherwise 1.
  connection.onNotification(ExitNotification.type, () => {
    process.exit(hasShutdown ? 0 : 1);
  });

  connection.listen();
}
