import process from "node:process";
import {
  createProtocolConnection,
  InitializeRequest,
  type InitializeResult,
  StreamMessageReader,
  StreamMessageWriter,
} from "vscode-languageserver-protocol/node";
import type { TsudoiConfig } from "./types.ts";

/**
 * Starts serving LSP over stdio. Called only after the config has loaded, so
 * that no failure path can put bytes on stdout.
 *
 * `capabilities` stays empty until PBI-2/3/4 declare their own.
 */
export function startServer(_config: TsudoiConfig): void {
  const connection = createProtocolConnection(
    new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout),
  );

  connection.onRequest(InitializeRequest.type, (): InitializeResult => {
    return { capabilities: {}, serverInfo: { name: "tsudoi" } };
  });

  connection.listen();
}
