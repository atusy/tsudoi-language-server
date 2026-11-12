// A transparent stdio proxy around a language server that records every
// message in both directions, so the harness can read what kakehashi actually
// sent downstream (the prepared text) and what the server answered.
//
//   tee.ts <log.jsonl> <server command...>
//
// Bytes are forwarded untouched; parsing happens on a copy.
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import process from "node:process";
import { FrameReader } from "./lsp.ts";

const [log, program, ...args] = process.argv.slice(2);
if (log === undefined || program === undefined) {
  process.stderr.write("usage: tee.ts <log.jsonl> <server command...>\n");
  process.exit(2);
}

const child = spawn(program, args, { stdio: ["pipe", "pipe", "inherit"] });

function record(direction: "in" | "out", reader: FrameReader, chunk: Buffer): void {
  try {
    for (const message of reader.push(chunk)) {
      appendFileSync(log as string, `${JSON.stringify({ at: Date.now(), direction, message })}\n`);
    }
  } catch (error) {
    appendFileSync(
      log as string,
      `${JSON.stringify({ at: Date.now(), direction, unparsed: String(error) })}\n`,
    );
  }
}

const toServer = new FrameReader();
const fromServer = new FrameReader();

process.stdin.on("data", (chunk: Buffer) => {
  child.stdin.write(chunk);
  record("in", toServer, Buffer.from(chunk));
});
process.stdin.on("end", () => {
  child.stdin.end();
});
child.stdout.on("data", (chunk: Buffer) => {
  process.stdout.write(chunk);
  record("out", fromServer, Buffer.from(chunk));
});
child.stdin.on("error", () => {
  // The server closed its stdin; its exit below ends the proxy.
});
child.on("exit", (code, signal) => {
  appendFileSync(log, `${JSON.stringify({ at: Date.now(), exit: { code, signal } })}\n`);
  process.exit(code ?? 1);
});
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
