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
 *
 * EVERY server-initiated notification is recorded, not only `$/progress`.
 * Dropping the rest made `nothing else arrived` unfalsifiable here: a server
 * that logged on every keystroke was indistinguishable from one that said
 * nothing, and a test claiming not to care about message shape could not be
 * shown to mean it.
 */
export type Arrival =
  | ({ readonly kind: "progress" } & ProgressNotification)
  | {
      readonly kind: "response";
      readonly id: number;
    }
  | {
      readonly kind: "notification";
      readonly method: string;
    };

interface ProgressWaiter {
  readonly count: number;
  readonly release: () => void;
}

/**
 * One message as it was FRAMED on the wire: the length its header declared,
 * beside the body that header introduced.
 *
 * Kept because the framing is otherwise unobservable from a test. The reader
 * below consumes exactly `declaredLength` bytes, so a header that lied about a
 * multi-byte body desynchronises the stream and the symptom is a test that
 * hangs -- a failure whose shape depends on how much the OS pipe happened to
 * buffer. With the pair recorded, the same defect is an equality that fails.
 */
interface Frame {
  readonly declaredLength: number;
  readonly body: string;
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
  /**
   * How the child closed, or undefined while it is still running. Pending
   * requests are flushed ONCE, at the close event, so a request registered
   * afterwards would wait forever for a settle that has already happened. The
   * rule from Sprint 5 is that a helper settles every promise it owns; it
   * applies just as much when the process died BEFORE the request as after it.
   */
  #closed: { readonly code: number | null } | undefined = undefined;
  #buffer = Buffer.alloc(0);
  #strayBytes = 0;
  #nextId = 1;
  /** Every message framed off stdout, including any nothing awaits. */
  messagesReceived = 0;
  /**
   * EVERY framed message, exactly as stdout carried it -- responses,
   * `$/progress` and any other server-initiated notification alike.
   *
   * Notifications were dropped here on the grounds that nothing awaited them,
   * twice over: first for `$/progress`, which made `zero $/progress` an
   * assertion a server streaming furiously satisfied, and then for the rest,
   * which made `tolerates an unexpected notification` unfalsifiable.
   *
   * Complete on purpose, and read through `arrivalsFor` on purpose: what a
   * claim is about is the CALLER's business, and a list that leaves things out
   * takes that decision away from them.
   */
  readonly arrivals: Arrival[] = [];
  /** Every message stdout carried, as it was framed. */
  readonly frames: Frame[] = [];
  /**
   * Every failure the child's stdin reported, in order. Empty for the whole
   * life of a healthy session, which is what makes a non-empty one evidence.
   */
  readonly writeFailures: string[] = [];
  readonly #progressWaiters: ProgressWaiter[] = [];

  private constructor(child: ChildProcessWithoutNullStreams) {
    this.#child = child;
    this.#exited = new Promise((resolve) => {
      child.on("close", (code) => {
        this.#closed = { code };
        // Without this, a server that dies mid-request leaves the caller to
        // time out with no diagnostic at all.
        for (const [id, settle] of this.#pending) {
          this.#pending.delete(id);
          settle(this.#deadServer(id));
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
    // A session that DIED leaves stdin broken, and a test that then writes to
    // it must fail on its own assertion -- `the exit code was 1` -- rather than
    // on an uncaught EPIPE from a stream nothing is listening to.
    //
    // RECORDED rather than ignored, which is the correction: the previous
    // reasoning here was that ignoring hid nothing, since a write that went
    // nowhere shows up as a response that never arrives. That is only true of
    // REQUESTS, and it describes a HANG. A `notify` awaits nothing at all, so a
    // notification whose write failed left no trace anywhere -- the helper
    // swallowed the one piece of evidence that the client never spoke.
    child.stdin.on("error", (error: Error) => {
      this.writeFailures.push(error.message);
    });
  }

  /**
   * `cwd` defaults to the repo, which is where every criterion about THIS
   * checkout is driven from. It is overridable so a test can drive an isolated
   * copy of the sources and observe what changes -- module resolution is a
   * property of the directory a runtime starts in, and no assertion made
   * inside the repo can tell where a dependency was found.
   */
  static start(runtime: Runtime, configPath: string, cwd: string = repoRoot): LspSession {
    const child = spawn(runtime.command, [...runtime.runArgs, cliArg, "--config", configPath], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return new LspSession(child);
  }

  /**
   * Starts a session by running a COMMAND LINE VERBATIM -- the whole string,
   * runtime included, split on spaces.
   *
   * This exists so a documented route cannot drift from what is executed. A
   * route stated in prose beside independently assembled spawn arguments is
   * two things that must be kept equal by hand; here the stated string IS the
   * argv, so there is nothing to keep equal.
   */
  static startCommand(command: string, cwd: string): LspSession {
    const [program, ...args] = command.split(" ");
    if (program === undefined) {
      throw new Error(`not a command: ${command}`);
    }
    return new LspSession(spawn(program, args, { cwd, stdio: ["pipe", "pipe", "pipe"] }));
  }

  request<T>(method: string, params: unknown): Promise<T> {
    const id = this.#nextId++;
    return new Promise<T>((resolve, reject) => {
      this.#pend(id, (message) => {
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
      this.#pend(id, (message) => {
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
      this.#pend(id, resolve);
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
      this.#pend(id, resolve);
      this.#write(
        this.#frame({ jsonrpc: "2.0", id, method, params }) +
          this.#frame({ jsonrpc: "2.0", method: "$/cancelRequest", params: { id } }),
        `${method} #${id} with its cancellation`,
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
   * Resolves with the first stdin failure, and REJECTS on timeout saying none
   * arrived -- the stream reports its error on a later turn, so a test that
   * merely read `writeFailures` would be racing it.
   */
  async waitForWriteFailure(timeoutMs = 2000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const [first] = this.writeFailures;
      if (first !== undefined) {
        return first;
      }
      if (Date.now() > deadline) {
        throw new Error(`timed out after ${timeoutMs}ms waiting for a stdin write to fail`);
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
   * The arrivals ONE claim is about: every `$/progress`, whatever token it came
   * under, plus the response to `id` -- in the order stdout carried them.
   *
   * This is what an ordering assertion should be made against. Comparing the
   * WHOLE arrival list instead pins three things a claim about ordering never
   * meant to require: that no other message exists, that the ids of unrelated
   * requests are what they are, and that the server never speaks unprompted.
   * The first is why a `window/logMessage` would have broken tests about
   * cancellation; the second is the hardcoded-id brittleness recorded at
   * Sprint 7.
   *
   * Progress is deliberately NOT filtered by token: a server that streamed
   * under a token it invented is exactly the cheat these tests exist to catch.
   */
  arrivalsFor(id: number): Arrival[] {
    return this.arrivals.filter(
      (arrival) =>
        arrival.kind === "progress" || (arrival.kind === "response" && arrival.id === id),
    );
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

  /**
   * Registers what settles a request, or settles it AT ONCE when the server is
   * already gone -- so `the session died` is reported as an assertion failure
   * naming the death, never as a test that hangs to its timeout.
   */
  #pend(id: number, settle: (message: ResponseMessage) => void): void {
    if (this.#closed === undefined) {
      this.#pending.set(id, settle);
      return;
    }
    settle(this.#deadServer(id));
  }

  /**
   * Shaped like a wire error so that requestError reports a dead server as a
   * dead server rather than as a missing field.
   */
  #deadServer(id: number): ResponseMessage {
    const code = this.#closed?.code;
    return {
      id,
      error: { code: 0, message: `server exited with code ${code}; stderr: ${this.stderr}` },
    };
  }

  #frame(message: unknown): string {
    const json = JSON.stringify(message);
    return `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
  }

  #send(message: unknown): void {
    const { method, id } = message as { method?: string; id?: number };
    this.#write(this.#frame(message), `${method ?? "message"}${id === undefined ? "" : ` #${id}`}`);
  }

  /**
   * Writes to the child's stdin, and records it when the bytes went nowhere.
   *
   * MEASURED under bun 1.3.13, and it is why the stream's own reporting is not
   * enough: once the child has died, `write()` RETURNS TRUE and its callback is
   * invoked with NO ERROR, while `writable` is false and `destroyed` is true.
   * node would report ERR_STREAM_DESTROYED; here the stream state is the only
   * evidence there is. The callback is still consulted for the case the stream
   * does report -- an EPIPE while it is still open.
   *
   * A `notify` awaits nothing, so without this a notification written to a dead
   * session left no trace whatsoever: not a rejected promise, not a missing
   * response, nothing.
   */
  #write(payload: string, what: string): void {
    if (this.#child.stdin.writable === false) {
      this.writeFailures.push(`${what} was not written: stdin is closed`);
      return;
    }
    this.#child.stdin.write(payload, (error?: Error | null) => {
      if (error !== undefined && error !== null) {
        this.writeFailures.push(`${what} failed to write: ${error.message}`);
      }
    });
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
      this.frames.push({ declaredLength: Number(match[1]), body });
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
      // Recorded rather than dropped: nothing awaits it, but a test that means
      // to tolerate it must be able to SEE it, or tolerance is not a property
      // anyone can check.
      this.arrivals.push({ kind: "notification", method: message.method ?? "" });
      return;
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
