// The smallest downstream server: it completes the handshake and answers
// every request with `null`. Behind the recording proxy it shows what text
// kakehashi sends for a document without the cost (or the opinions) of a real
// language server -- which is all the contract scenarios need.
import process from "node:process";
import { FrameReader, frame } from "./lsp.ts";

const reader = new FrameReader();

process.stdin.on("data", (chunk: Buffer) => {
  for (const message of reader.push(chunk)) {
    if (message.method === "exit") process.exit(0);
    if (message.id === undefined || message.id === null || message.method === undefined) continue;
    const result =
      message.method === "initialize"
        ? { capabilities: { textDocumentSync: { openClose: true, change: 1 } } }
        : null;
    process.stdout.write(frame({ jsonrpc: "2.0", id: message.id, result }));
  }
});
process.stdin.on("end", () => {
  process.exit(0);
});
