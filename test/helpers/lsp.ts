import { Buffer } from "node:buffer";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { cliPath, repoRoot } from "./spawn.ts";

/** How to invoke the CLI under one runtime. `-A` must precede the script path. */
export interface Runtime {
  readonly name: string;
  readonly command: string;
  readonly runArgs: readonly string[];
  readonly installUrl: string;
}

export const bunRuntime: Runtime = {
  name: "bun",
  command: "bun",
  runArgs: ["run"],
  installUrl: "https://bun.sh/docs/installation",
};

export const denoRuntime: Runtime = {
  name: "deno",
  command: "deno",
  runArgs: ["run", "-A"],
  installUrl: "https://docs.deno.com/runtime/getting_started/installation/",
};

interface ResponseMessage {
  id?: number;
  result?: unknown;
  error?: unknown;
}

/**
 * A minimal LSP client over the CLI's stdio, framing messages with
 * Content-Length. Requests are awaited one at a time, which is what keeps the
 * shutdown response from racing the exit notification.
 */
export class LspSession {
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #pending = new Map<number, (message: ResponseMessage) => void>();
  /** Captured at construction so waitForExit cannot miss an early close. */
  readonly #exited: Promise<number | null>;
  #buffer = Buffer.alloc(0);
  #nextId = 1;
  stderr = "";

  private constructor(child: ChildProcessWithoutNullStreams) {
    this.#child = child;
    this.#exited = new Promise((resolve) => {
      child.on("close", (code) => {
        resolve(code);
      });
    });
    child.stdout.on("data", (chunk: Buffer) => {
      this.#buffer = Buffer.concat([this.#buffer, chunk]);
      this.#drain();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      this.stderr += chunk.toString("utf8");
    });
  }

  static start(runtime: Runtime, configPath: string): LspSession {
    const child = spawn(runtime.command, [...runtime.runArgs, cliPath, "--config", configPath], {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return new LspSession(child);
  }

  request<T>(method: string, params: unknown): Promise<T> {
    const id = this.#nextId++;
    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, (message) => {
        if (message.error !== undefined) {
          reject(new Error(`${method} failed: ${JSON.stringify(message.error)}`));
          return;
        }
        resolve(message.result as T);
      });
      this.#send({ jsonrpc: "2.0", id, method, params });
    });
  }

  notify(method: string, params: unknown): void {
    this.#send({ jsonrpc: "2.0", method, params });
  }

  waitForExit(): Promise<number | null> {
    return this.#exited;
  }

  dispose(): void {
    this.#child.kill("SIGKILL");
  }

  #send(message: unknown): void {
    const json = JSON.stringify(message);
    this.#child.stdin.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
  }

  #drain(): void {
    for (;;) {
      const headerEnd = this.#buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }
      const header = this.#buffer.subarray(0, headerEnd).toString("ascii");
      const match = /content-length:\s*(\d+)/i.exec(header);
      if (match === null) {
        throw new Error(`no Content-Length in header: ${header}`);
      }
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + Number(match[1]);
      if (this.#buffer.length < bodyEnd) {
        return;
      }
      const body = this.#buffer.subarray(bodyStart, bodyEnd).toString("utf8");
      this.#buffer = this.#buffer.subarray(bodyEnd);
      this.#deliver(JSON.parse(body) as ResponseMessage);
    }
  }

  #deliver(message: ResponseMessage): void {
    if (message.id === undefined) {
      return; // A server-initiated notification; nothing awaits it here.
    }
    const settle = this.#pending.get(message.id);
    if (settle !== undefined) {
      this.#pending.delete(message.id);
      settle(message);
    }
  }
}

/** The smallest InitializeParams a conforming client can send. */
export const initializeParams = {
  processId: null,
  rootUri: null,
  capabilities: {},
} as const;
