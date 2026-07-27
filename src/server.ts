import process from "node:process";
import {
  createProtocolConnection,
  ExitNotification,
  InitializedNotification,
  InitializeRequest,
  type InitializeResult,
  ShutdownRequest,
  StreamMessageReader,
  StreamMessageWriter,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol/node";
import type { DocumentStoreHandle } from "./documents.ts";
import type { TsudoiConfig } from "./types.ts";

/**
 * Starts serving LSP over stdio. Called only after the config has loaded, so
 * that no failure path can put bytes on stdout.
 *
 * `capabilities` carries only textDocumentSync until PBI-3/4 declare their own.
 */
export function startServer(_config: TsudoiConfig, _documents: DocumentStoreHandle): void {
  const connection = createProtocolConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
  );

  let hasShutdown = false;

  connection.onRequest(InitializeRequest.type, (): InitializeResult => {
    return {
      capabilities: {
        // openClose is not optional: advertising only `change` entitles a
        // conforming client to withhold didOpen/didClose, and then the store
        // never sees a document however correct its own code is.
        // Full, not Incremental: the client resends the whole buffer, so no
        // position/offset machinery is needed to answer getText().
        textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Full },
      },
      serverInfo: { name: "tsudoi" },
    };
  });

  connection.onNotification(InitializedNotification.type, () => {
    // The client is ready. Nothing to do until PBI-3/4 add capabilities.
  });

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
