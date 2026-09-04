import { Buffer } from "node:buffer";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { repoRoot } from "./spawn.ts";

/**
 * Where the entry point sits RELATIVE TO THE DIRECTORY A SESSION STARTS IN, kept
 * relative so sessions run the acceptance criterion's own command form.
 *
 * THE PREFIX IS THERE BECAUSE THE DEFAULT CWD IS THE CHECKOUT, with the entry
 * point down inside it.
 *
 * AND THE PREFIX IS OVERRIDABLE FOR ONE STAGED SHAPE THAT DELIBERATELY IS NOT
 * THE CHECKOUT'S. test/helpers/checkout.ts stages a copy of the PACKAGE ALONE,
 * with its manifest at the copy's root, and that is not tidiness either: the
 * examples there reach tsudoi by PACKAGE SELF-REFERENCE, needing no
 * node_modules, which is exactly what lets those probes hold node_modules away
 * and read what deno then cannot find. Nesting the copy the way the checkout
 * nests it would give those examples no route but node_modules and the probes
 * would stop discriminating.
 */
export const CLI_IN_A_CHECKOUT = "packages/tsudoi-language-server/src/cli.ts";
export const CLI_BESIDE_ITS_MANIFEST = "src/cli.ts";

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
   * be reported against whichever test ran next -- a misattribution that is a
   * suite-integrity failure rather than a nuisance.
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

/** One `window/logMessage` as it arrived: the level, and the sentence. */
export interface LoggedMessage {
  readonly type: number;
  readonly message: string;
}

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
   * rule is that a helper settles every promise it owns; it applies just as
   * much when the process died BEFORE the request as after it.
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
   * Complete on purpose, and read through `arrivalsFor` on purpose: what a
   * claim is about is the CALLER's business, and a list that leaves things out
   * takes that decision away from them.
   */
  readonly arrivals: Arrival[] = [];
  /** Every message stdout carried, as it was framed. */
  readonly frames: Frame[] = [];
  /**
   * Every `window/logMessage`, WITH ITS PARAMS, where `arrivals` keeps the
   * method name alone.
   *
   * A claim about a failure REPORTED TO THE CLIENT is a claim about the LEVEL
   * and the SENTENCE -- an editor shows an Error and buries an Info -- and a
   * list of method names cannot tell those apart. Read after the process has
   * exited, for the reason `unframedStdoutBytes` gives.
   */
  readonly logMessages: LoggedMessage[] = [];
  /**
   * Every server-initiated notification WITH ITS PARAMS, where `arrivals` keeps
   * the method name alone.
   *
   * BESIDE `arrivals` RATHER THAN INSTEAD OF ITS `method`, which is a decision
   * about the ARMS that already exist: two of them compare `arrivals` WHOLE, so
   * a params member added there would redden a claim about ORDER for a reason
   * that has nothing to do with order. This list is what a claim about CONTENT
   * reads, and `logMessages` above stays as it is -- a typed projection of one
   * method, whose readers want the level and the sentence rather than a shape to
   * narrow.
   */
  readonly notifications: { readonly method: string; readonly params: unknown }[] = [];
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
    // RECORDED rather than ignored, and the argument for ignoring does not
    // hold: `a write that went nowhere shows up as a response that never
    // arrives` is true of REQUESTS alone, and even there it describes a HANG. A
    // `notify` awaits nothing at all, so a notification whose write fails leaves
    // no trace anywhere unless this records it -- the one piece of evidence that
    // the client never spoke.
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
   *
   * `cliArg` travels with `cwd` and is defaulted rather than derived: the two
   * staged shapes put the entry point in different places, and a helper that
   * guessed from the cwd would silently pick the wrong one in the copy whose
   * whole purpose is to be laid out differently.
   */
  static start(
    runtime: Runtime,
    configPath: string,
    cwd: string = repoRoot,
    cliArg: string = CLI_IN_A_CHECKOUT,
  ): LspSession {
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
  static startCommand(command: string, cwd: string, env?: NodeJS.ProcessEnv): LspSession {
    const [program, ...args] = command.split(" ");
    if (program === undefined) {
      throw new Error(`not a command: ${command}`);
    }
    return new LspSession(spawn(program, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] }));
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
   * A response that never arrives would otherwise park with no message of its
   * own -- these promises only ever resolve, so the failure would be bun's
   * anonymous `timed out after Nms`, naming neither the method nor the id.
   *
   * INSIDE THE TIGHTEST TEST CONSTANT (4000) so this speaks first. A test that
   * means to leave a request unanswered does not await it.
   */
  #named(id: number, method: string, response: Promise<ResponseMessage>): Promise<ResponseMessage> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const parked = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error(`no response to ${method} (id ${String(id)}) within 3000ms`)),
        3000,
      );
    });
    return Promise.race([response, parked]).finally(() => {
      clearTimeout(timer);
    });
  }

  issue(method: string, params: unknown): InFlightRequest {
    const id = this.#nextId++;
    // The executor runs synchronously, so the frame is on the wire before this
    // returns and the caller can cancel the id it was handed.
    const response = new Promise<ResponseMessage>((resolve) => {
      this.#pend(id, resolve);
      this.#send({ jsonrpc: "2.0", id, method, params });
    });
    return { id, response: this.#named(id, method, response) };
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
   * The first is why a `window/logMessage` would break tests about
   * cancellation; the second is hardcoded-id brittleness.
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

  /**
   * Ends the server's input, leaving the process itself alone.
   *
   * This is the EOF a dying editor produces, reached from the one process that
   * can produce it deliberately -- the holder of the write end. `dispose` is not
   * a substitute and measures something else entirely: it SIGKILLs the child, so
   * the exit code it produces is the signal's, not the server's own.
   *
   * Nothing else in this helper closes stdin, which is why every other session
   * in the suite ends by `exit` or by being killed.
   */
  endInput(): void {
    this.#child.stdin.end();
  }

  /**
   * A PARK HERE WITH NO DEADLINE OF ITS OWN FAILS AS bun's ANONYMOUS `timed out
   * after Nms` and names nothing.
   *
   * THE DEFAULT SITS INSIDE THE TIGHTEST TEST CONSTANT IN THE TREE (4000), so
   * this speaks first and the constant goes back to being a backstop.
   */
  async waitForExit(timeoutMs = 3000): Promise<number | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const parked = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error(`the server did not exit within ${timeoutMs}ms`)),
        timeoutMs,
      );
    });
    try {
      return await Promise.race([this.#exited, parked]);
    } finally {
      clearTimeout(timer);
    }
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
      if (message.method === "window/logMessage") {
        this.logMessages.push(message.params as LoggedMessage);
      }
      // EVERY server-initiated message is recorded and none is dropped, which
      // costs both claims if it stops: with `$/progress` left out, `zero
      // $/progress` is an assertion a server streaming furiously satisfies, and
      // with the other notifications left out `tolerates an unexpected
      // notification` is unfalsifiable -- a test that means to tolerate one must
      // be able to SEE it.
      this.notifications.push({ method: message.method ?? "", params: message.params });
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

/**
 * WHAT A CLIENT SENDS TO A METHOD WHOSE SIGNATURE TAKES NO PARAMS: no `params`
 * member at all.
 *
 * `JSON.stringify` DROPS AN `undefined` MEMBER, so a message framed from this
 * carries no `params` key -- which is what JSON-RPC's `params MAY be omitted`
 * means. `null` is a DIFFERENT message and not a shorthand for this one: the
 * specification requires a present `params` to be a Structured value, so `null`
 * is malformed and tsudoi answers it -32602.
 *
 * NAMED RATHER THAN WRITTEN AS A BARE `undefined` AT EACH SITE, because the two
 * spellings are visually one keystroke apart from `null` and are answered
 * differently. A site reading `noParams` says which message it meant to send.
 */
export const noParams = undefined;

/** The smallest InitializeParams a conforming client can send. */
export const initializeParams = {
  processId: null,
  rootUri: null,
  capabilities: {},
} as const;
