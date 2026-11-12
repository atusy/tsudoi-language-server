// A scripted stdio LSP client: enough of an editor to drive kakehashi.
// Node APIs only, so the harness runs under bun or deno alike.
import { Buffer } from "node:buffer";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import process from "node:process";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface RpcMessage {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class RpcError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export class TimeoutError extends Error {}

export interface Received {
  readonly at: number;
  readonly method: string;
  readonly params: unknown;
}

/** Splits a byte stream into `Content-Length` framed JSON-RPC messages. */
export class FrameReader {
  #buffer: Buffer = Buffer.alloc(0);

  push(chunk: Buffer): RpcMessage[] {
    this.#buffer = this.#buffer.length === 0 ? chunk : Buffer.concat([this.#buffer, chunk]);
    const messages: RpcMessage[] = [];
    for (;;) {
      const headerEnd = this.#buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) break;
      const header = this.#buffer.subarray(0, headerEnd).toString("ascii");
      const length = Number(/content-length:\s*(\d+)/i.exec(header)?.[1] ?? Number.NaN);
      if (!Number.isFinite(length)) {
        throw new Error(`frame without Content-Length: ${JSON.stringify(header)}`);
      }
      const bodyStart = headerEnd + 4;
      if (this.#buffer.length < bodyStart + length) break;
      const body = this.#buffer.subarray(bodyStart, bodyStart + length).toString("utf8");
      this.#buffer = this.#buffer.subarray(bodyStart + length);
      messages.push(JSON.parse(body) as RpcMessage);
    }
    return messages;
  }
}

export function frame(message: RpcMessage): Buffer {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  return Buffer.concat([
    Buffer.from(`Content-Length: ${String(body.length)}\r\n\r\n`, "ascii"),
    body,
  ]);
}

export interface ClientOptions {
  readonly cwd: string;
  readonly env: Record<string, string | undefined>;
  /** File the server's stderr is appended to. */
  readonly stderrLog?: string;
  readonly defaultTimeoutMs?: number;
}

type ServerRequestHandler = (params: unknown) => unknown;

export class LspClient {
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #pending = new Map<number, { resolve: (message: RpcMessage) => void; method: string }>();
  readonly #handlers = new Map<string, ServerRequestHandler>();
  readonly #waiters = new Set<() => void>();
  readonly #defaultTimeoutMs: number;
  #nextId = 1;
  #exit: { code: number | null; signal: string | null } | null = null;

  /** Every notification the server sent, in arrival order. */
  readonly notifications: Received[] = [];
  /** Every request the server sent (the answers are the handlers'). */
  readonly serverRequests: Received[] = [];

  constructor(command: readonly string[], options: ClientOptions) {
    const [program, ...args] = command;
    if (program === undefined) throw new Error("empty command");
    this.#defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000;
    this.#child = spawn(program, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["pipe", "pipe", "pipe"],
    });
    const reader = new FrameReader();
    this.#child.stdout.on("data", (chunk: Buffer) => {
      for (const message of reader.push(chunk)) this.#receive(message);
    });
    this.#child.stderr.on("data", (chunk: Buffer) => {
      if (options.stderrLog !== undefined) appendFileSync(options.stderrLog, chunk);
    });
    this.#child.stdin.on("error", () => {
      // The server went away; requests in flight time out and say so.
    });
    this.#child.on("error", (error) => {
      // The command could not be started at all.
      this.#exit = { code: null, signal: String(error) };
      this.#wake();
    });
    this.#child.on("exit", (code, signal) => {
      this.#exit = { code, signal };
      this.#wake();
    });
  }

  get exited(): { code: number | null; signal: string | null } | null {
    return this.#exit;
  }

  /** Answers a request the server sends; unhandled ones answer `null`. */
  onRequest(method: string, handler: ServerRequestHandler): void {
    this.#handlers.set(method, handler);
  }

  #wake(): void {
    for (const waiter of this.#waiters) waiter();
  }

  #receive(message: RpcMessage): void {
    const at = Date.now();
    if (message.method !== undefined && message.id !== undefined && message.id !== null) {
      this.serverRequests.push({ at, method: message.method, params: message.params });
      const handler = this.#handlers.get(message.method);
      let result: unknown = null;
      try {
        result = handler ? handler(message.params) : null;
      } catch (error) {
        this.#send({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32603, message: String(error) },
        });
        this.#wake();
        return;
      }
      this.#send({ jsonrpc: "2.0", id: message.id, result: result ?? null });
    } else if (message.method !== undefined) {
      this.notifications.push({ at, method: message.method, params: message.params });
    } else if (typeof message.id === "number") {
      const pending = this.#pending.get(message.id);
      this.#pending.delete(message.id);
      pending?.resolve(message);
    }
    this.#wake();
  }

  #send(message: RpcMessage): void {
    if (this.#exit !== null || this.#child.stdin.destroyed) return;
    this.#child.stdin.write(frame(message));
  }

  notify(method: string, params: unknown): void {
    this.#send({ jsonrpc: "2.0", method, params });
  }

  /** Sends a request and returns its id beside the raw response. */
  issue(method: string, params: unknown): { id: number; response: Promise<RpcMessage> } {
    const id = this.#nextId++;
    const response = new Promise<RpcMessage>((resolve) => {
      this.#pending.set(id, { resolve, method });
    });
    this.#send({ jsonrpc: "2.0", id, method, params });
    return { id, response };
  }

  /** The raw response: `result` or `error`, never thrown. Times out loudly. */
  async respond(method: string, params: unknown, timeoutMs?: number): Promise<RpcMessage> {
    const { id, response } = this.issue(method, params);
    const limit = timeoutMs ?? this.#defaultTimeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new TimeoutError(`${method} was not answered within ${String(limit)} ms`));
      }, limit);
    });
    const gone = this.waitFor(() => (this.#exit === null ? undefined : this.#exit), limit).then(
      (exit) => {
        if (exit === undefined) return new Promise<never>(() => {});
        throw new Error(`the server exited (${JSON.stringify(exit)}) before answering ${method}`);
      },
    );
    try {
      return await Promise.race([response, timeout, gone]);
    } finally {
      clearTimeout(timer);
    }
  }

  async request<T = unknown>(method: string, params: unknown, timeoutMs?: number): Promise<T> {
    const message = await this.respond(method, params, timeoutMs);
    if (message.error) throw new RpcError(message.error.code, message.error.message);
    return message.result as T;
  }

  cancel(id: number): void {
    this.notify("$/cancelRequest", { id });
  }

  /**
   * Waits until `probe` returns something other than `undefined`, re-running
   * it whenever a message arrives. Resolves `undefined` at the deadline.
   */
  async waitFor<T>(probe: () => T | undefined, timeoutMs: number): Promise<T | undefined> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = probe();
      if (found !== undefined) return found;
      const left = deadline - Date.now();
      if (left <= 0) return undefined;
      await new Promise<void>((resolve) => {
        const done = (): void => {
          clearTimeout(timer);
          this.#waiters.delete(done);
          resolve();
        };
        const timer = setTimeout(done, Math.min(left, 250));
        this.#waiters.add(done);
      });
    }
  }

  async close(): Promise<void> {
    if (this.#exit === null) {
      try {
        await this.respond("shutdown", null, 5_000);
        this.notify("exit", null);
      } catch {
        // Fall through to the kill below.
      }
      await this.waitFor(() => (this.#exit === null ? undefined : true), 3_000);
    }
    if (this.#exit === null) {
      this.#child.kill("SIGKILL");
      await this.waitFor(() => (this.#exit === null ? undefined : true), 3_000);
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
