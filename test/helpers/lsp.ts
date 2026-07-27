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

export interface ResponseMessage {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: JsonRpcError;
}

/** A request that has been sent and not yet answered. */
export interface InFlightRequest {
  /** The id `$/cancelRequest` names -- exposed because cancellation needs it. */
  readonly id: number;
  /**
   * How it settled, result and error alike, RESOLVED either way. A rejection
   * here would go unhandled whenever an assertion fails before the await, and
   * be reported against whichever test ran next -- the misattribution Sprint 5
   * recorded as a suite-integrity failure.
   */
  readonly response: Promise<ResponseMessage>;
}

/** One `$/progress` as it arrived, token included and unfiltered. */
export interface ProgressNotification {
  readonly token: number | string;
  readonly value: unknown;
}

/**
 * A framed message in arrival order. Responses carry only their id: what the
 * result was is already asserted by the awaiting request, whereas the ORDER of
 * a response relative to the progress around it is not observable anywhere
 * else -- and progress-then-error is a criterion in its own right.
 */
type Arrival =
  | ({ readonly kind: "progress" } & ProgressNotification)
  | {
      readonly kind: "response";
      readonly id: number;
    };

interface ProgressWaiter {
  readonly count: number;
  readonly release: () => void;
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
  /** Kept whole and undecoded so a suppressed value can be searched for. */
  readonly #stdoutChunks: Buffer[] = [];
  #buffer = Buffer.alloc(0);
  #strayBytes = 0;
  #nextId = 1;
  /** Every message framed off stdout, including any nothing awaits. */
  messagesReceived = 0;
  /**
   * Responses and `$/progress` interleaved exactly as stdout carried them.
   *
   * Server-initiated notifications used to be dropped here on the grounds that
   * nothing awaited them, which made `zero $/progress` an assertion that could
   * not fail: a server streaming furiously satisfied it.
   */
  readonly arrivals: Arrival[] = [];
  readonly #progressWaiters: ProgressWaiter[] = [];

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
      this.#stdoutChunks.push(chunk);
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
   * Sends a request without awaiting it, exposing the id so it can be
   * cancelled while it is still running.
   */
  issue(method: string, params: unknown): InFlightRequest {
    const id = this.#nextId++;
    // The executor runs synchronously, so the frame is on the wire before this
    // returns and the caller can cancel the id it was handed.
    const response = new Promise<ResponseMessage>((resolve) => {
      this.#pending.set(id, resolve);
      this.#send({ jsonrpc: "2.0", id, method, params });
    });
    return { id, response };
  }

  /**
   * Sends a request and its cancellation in ONE write, so both are framed
   * before the server's message queue turns.
   *
   * That is the pre-dispatch path, and it is not a nicety: vscode-jsonrpc then
   * hands the handler CancellationToken.Cancelled, whose
   * onCancellationRequested is Event.None and NEVER fires. A bridge that only
   * subscribes sees no cancellation at all here.
   */
  issueThenCancel(method: string, params: unknown): InFlightRequest {
    const id = this.#nextId++;
    const response = new Promise<ResponseMessage>((resolve) => {
      this.#pending.set(id, resolve);
      this.#child.stdin.write(
        this.#frame({ jsonrpc: "2.0", id, method, params }) +
          this.#frame({ jsonrpc: "2.0", method: "$/cancelRequest", params: { id } }),
      );
    });
    return { id, response };
  }

  /** Asks the server to cancel a request by id, as a client's `$/cancelRequest` does. */
  cancel(id: number): void {
    this.notify("$/cancelRequest", { id });
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

  /**
   * Every byte stdout carried, headers included, decoded once over the whole
   * thing for the same reason stderr is. `unframedStdoutBytes` says whether
   * anything unaccounted-for arrived; this says WHAT arrived, which is the
   * only way to assert that a value the client must never see never left.
   */
  get stdout(): string {
    return Buffer.concat(this.#stdoutChunks).toString("utf8");
  }

  /**
   * Resolves once stderr contains `text`, and REJECTS on timeout quoting what
   * stderr did say -- a marker that never arrives must name itself rather than
   * stall the suite.
   */
  async waitForStderr(text: string, timeoutMs = 2000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!this.stderr.includes(text)) {
      if (Date.now() > deadline) {
        throw new Error(
          `timed out after ${timeoutMs}ms waiting for stderr ${text}; saw: ${this.stderr}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  /**
   * Every `$/progress` so far, in arrival order. Deliberately NOT filtered by
   * token: a server that streamed under a token it invented is the cheat the
   * zero-progress criterion exists to catch, and filtering would hide it.
   */
  get progress(): ProgressNotification[] {
    return this.arrivals.flatMap((arrival) =>
      arrival.kind === "progress" ? [{ token: arrival.token, value: arrival.value }] : [],
    );
  }

  get progressCount(): number {
    return this.progress.length;
  }

  /**
   * Resolves once `count` `$/progress` have arrived, and REJECTS on timeout
   * rather than hanging -- a server that buffers its yields must fail here by
   * name, saying how many it did send, instead of stalling the suite.
   */
  waitForProgress(count: number, timeoutMs = 2000): Promise<void> {
    if (this.progressCount >= count) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#dropWaiter(waiter);
        reject(
          new Error(
            `timed out after ${timeoutMs}ms waiting for ${count} $/progress; saw ${this.progressCount}`,
          ),
        );
      }, timeoutMs);
      const waiter: ProgressWaiter = {
        count,
        release: () => {
          clearTimeout(timer);
          resolve();
        },
      };
      this.#progressWaiters.push(waiter);
    });
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

  #frame(message: unknown): string {
    const json = JSON.stringify(message);
    return `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  }

  #send(message: unknown): void {
    this.#child.stdin.write(this.#frame(message));
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
      if (message.method === "$/progress") {
        const { token, value } = message.params as ProgressNotification;
        this.arrivals.push({ kind: "progress", token, value });
        for (const waiter of [...this.#progressWaiters]) {
          if (this.progressCount >= waiter.count) {
            this.#dropWaiter(waiter);
            waiter.release();
          }
        }
      }
      return; // Any other server-initiated notification; nothing awaits it.
    }
    this.arrivals.push({ kind: "response", id: message.id });
    const settle = this.#pending.get(message.id);
    if (settle !== undefined) {
      this.#pending.delete(message.id);
      settle(message);
    }
  }

  #dropWaiter(waiter: ProgressWaiter): void {
    const index = this.#progressWaiters.indexOf(waiter);
    if (index !== -1) {
      this.#progressWaiters.splice(index, 1);
    }
  }
}

/** The smallest InitializeParams a conforming client can send. */
export const initializeParams = {
  processId: null,
  rootUri: null,
  capabilities: {},
} as const;
