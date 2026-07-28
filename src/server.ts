import process from "node:process";
import {
  createProtocolConnection,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentNotification,
  ExitNotification,
  InitializedNotification,
  type InitializeParams,
  InitializeRequest,
  type InitializeResult,
  type Logger,
  type ServerCapabilities,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import { createLifecycle } from "./lifecycle.ts";
import { registerMethods } from "./methods.ts";
import type { Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * Where vscode-jsonrpc reports what it cannot answer for -- above all a
 * notification handler that threw, which it catches and would otherwise discard
 * in silence, since a notification has no response to carry the failure.
 *
 * Every level goes to stderr. stdout carries the protocol and nothing else, so
 * console.log here would corrupt the very stream the client is framing.
 *
 * WHAT THIS LOGGER DOES NOT COVER, recorded because the natural inference from
 * the paragraph above is WRONG and would manufacture a defect that does not
 * exist: a notification with NO REGISTERED HANDLER never reaches this logger at
 * all. MEASURED on both runtimes -- `workspace/didChangeWorkspaceFolders`,
 * `$/setTrace` and an invented `totally/madeUp` each produced ZERO BYTES here,
 * with a throwing hover in the SAME session through the SAME reader writing its
 * line, so the silence is real and not a reader that cannot see stderr. The
 * session stayed functional and exited 0: inert, not merely quiet.
 *
 * So the reach is `a handler that threw`, never `anything the client sent that
 * we do not answer`. Someone reasoning from the throwing case to the
 * unregistered one would predict noise and size a defect against it.
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

  // Every question about WHEN a message is allowed goes to this one object.
  // The gate it backs is consulted by the handlers tsudoi REGISTERED, never by
  // the dispatch as a whole -- that is what leaves a method nobody registered
  // falling through to vscode-jsonrpc's MethodNotFound, since `not initialized
  // yet` and `no such method` are different diagnoses.
  const lifecycle = createLifecycle();

  /**
   * The workspace folders this session was opened with, for the handlers that
   * run afterwards. Empty until `initialize` arrives, which is the only moment
   * a client states them -- and the reason they are read here rather than
   * handed to the config factory, which has already run by now.
   */
  let workspaceFolders: readonly WorkspaceFolder[] = [];

  connection.onRequest(InitializeRequest.type, (params: InitializeParams): InitializeResult => {
    // initialize is the one request the gate may never refuse -- refusing it
    // would make the state it guards unreachable.
    lifecycle.initialize();
    // ONE FIELD, DELIBERATELY. `params` carries the client's capabilities too,
    // and a config author cannot see them -- LSP 3.16's
    // `completion.completionItem.insertReplaceSupport` is the known case, and
    // examples/path-completion.ts sends that shape unconditionally because of
    // it. That is a SECOND consumer of this argument, not a reason to widen
    // this line: retaining `params` wholesale would put the whole of
    // InitializeParams on tsudoi's surface as a side effect of needing one
    // field of it. Whoever needs capabilities opens a seam for capabilities.
    workspaceFolders = params.workspaceFolders as readonly WorkspaceFolder[];
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
    // The client is ready. Registered rather than left unhandled so that
    // vscode-jsonrpc does not log it as unanswered on every session.
  });

  // The three sync notifications are pure delegation: what a full-sync buffer
  // means is documents.ts's business, and none of them answers the client.
  connection.onNotification(DidOpenTextDocumentNotification.type, (params) => {
    if (lifecycle.acceptsNotification() === false) {
      return;
    }
    documents.open(params);
  });

  connection.onNotification(DidChangeTextDocumentNotification.type, (params) => {
    if (lifecycle.acceptsNotification() === false) {
      return;
    }
    documents.change(params);
  });

  connection.onNotification(DidCloseTextDocumentNotification.type, (params) => {
    if (lifecycle.acceptsNotification() === false) {
      return;
    }
    documents.close(params);
  });

  // What the config can answer lives in its own module: lifecycle and document
  // sync are tsudoi's own business, whereas these hand control to code the
  // config author wrote and have a failure path of their own.
  registerMethods(
    connection,
    config,
    tsudoi,
    () => lifecycle.requestRejection(),
    () => workspaceFolders,
  );

  // ShutdownRequest's declared result is void; vscode-jsonrpc puts null on the
  // wire for it, which is what the LSP specification requires.
  connection.onRequest(ShutdownRequest.type, (): void => {
    const rejection = lifecycle.requestRejection();
    if (rejection !== undefined) {
      throw rejection;
    }
    lifecycle.shutDown();
  });

  // `exit` is the one notification NOT routed through acceptsNotification: it
  // must be obeyed at every moment of the lifecycle, and a gate written
  // without that exception leaves the process alive forever.
  connection.onNotification(ExitNotification.type, () => {
    process.exit(lifecycle.exitCode());
  });

  connection.listen();
}
