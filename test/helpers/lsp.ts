import { Buffer } from "node:buffer";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { repoRoot } from "./spawn.ts";

/** Kept relative so sessions run the acceptance criterion's own command form. */
const cliArg = "src/cli.ts";

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

/** The `error` member of a JSON-RPC response, as it arrives on the wire. */
export interface JsonRpcError {
  code: number;
  message: string;
}

interface ResponseMessage {
  id?: number;
  result?: unknown;
  error?: JsonRpcError;
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
  readonly #stderrChunks: Buffer[] = [];
  #buffer = Buffer.alloc(0);
  #strayBytes = 0;
  #nextId = 1;
  /** Every message framed off stdout, including any nothing awaits. */
  messagesReceived = 0;

  private constructor(child: ChildProcessWithoutNullStreams) {
    this.#child = child;
    this.#exited = new Promise((resolve) => {
      child.on("close", (code) => {
        // Without this, a server that dies mid-request leaves the caller to
        // time out with no diagnostic at all.
        for (const [id, settle] of this.#pending) {
          this.#pending.delete(id);
          settle({
            id,
            // Shaped like a wire error so that requestError reports a dead
            // server as a dead server rather than as a missing field.
            error: { code: 0, message: `server exited with code ${code}; stderr: ${this.stderr}` },
          });
        }
        resolve(code);
      });
    });
    child.stdout.on("data", (chunk: Buffer) => {
      this.#buffer = Buffer.concat([this.#buffer, chunk]);
      this.#drain();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      this.#stderrChunks.push(chunk);
    });
  }

  static start(runtime: Runtime, configPath: string): LspSession {
    const child = spawn(runtime.command, [...runtime.runArgs, cliArg, "--config", configPath], {
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

  /**
   * The error a request was answered with. Separate from `request` because a
   * criterion about failure has to assert on the failure's code, not on the
   * wording of a rejection the helper composed.
   */
  requestError(method: string, params: unknown): Promise<JsonRpcError> {
    const id = this.#nextId++;
    return new Promise<JsonRpcError>((resolve, reject) => {
      this.#pending.set(id, (message) => {
        if (message.error === undefined) {
          reject(
            new Error(`${method} succeeded with ${JSON.stringify(message.result)}; expected error`),
          );
          return;
        }
        resolve(message.error);
      });
      this.#send({ jsonrpc: "2.0", id, method, params });
    });
  }

  notify(method: string, params: unknown): void {
    this.#send({ jsonrpc: "2.0", method, params });
  }

  /**
   * Everything the child wrote to stderr, decoded once over the whole thing.
   * Decoding chunk by chunk instead would turn any multi-byte character the
   * pipe happened to split into two U+FFFD -- invisible in ASCII, and silently
   * wrong for exactly the Japanese payloads this suite exists to check.
   */
  get stderr(): string {
    return Buffer.concat(this.#stderrChunks).toString("utf8");
  }

  waitForExit(): Promise<number | null> {
    return this.#exited;
  }

  /**
   * Bytes stdout produced that no framed message accounts for: whatever
   * preceded a header, plus whatever trails the last complete message. Read
   * after the process has exited, anything but 0 means something wrote to
   * stdout that is not JSON-RPC -- which desyncs a real editor rather than
   * failing loudly.
   *
   * The leading half is not hypothetical: a stray write lands in front of the
   * next header, where an unanchored Content-Length search reads straight past
   * it and frames the message correctly anyway.
   */
  get unframedStdoutBytes(): number {
    return this.#strayBytes + this.#buffer.length;
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
      // Bytes ahead of the header field itself belong to no message. Counted
      // only once the frame is complete: a frame split across chunks re-enters
      // this loop over the same header, and counting above would double it.
      this.#strayBytes += match.index;
      const body = this.#buffer.subarray(bodyStart, bodyEnd).toString("utf8");
      this.#buffer = this.#buffer.subarray(bodyEnd);
      this.#deliver(JSON.parse(body) as ResponseMessage);
    }
  }

  #deliver(message: ResponseMessage): void {
    this.messagesReceived++;
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
