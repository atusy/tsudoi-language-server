/**
 * How a config author's handler is RUN to the answer the client receives: the
 * request table, the cancellation every answer passes through, and the two
 * drives -- one that awaits a handler once, one that pulls a generator a batch
 * at a time.
 */
import process from "node:process";
import {
  type CancellationToken,
  type CodeAction,
  CodeActionRequest,
  type Command,
  type CompletionItem,
  CompletionRequest,
  CompletionResolveRequest,
  DocumentDiagnosticRequest,
  DocumentFormattingRequest,
  ErrorCodes,
  ExecuteCommandRequest,
  HoverRequest,
  integer,
  LSPErrorCodes,
  type PartialResultParams,
  type ProgressToken,
  ProgressType,
  type RequestType,
  ResponseError,
  type ServerCapabilities,
} from "vscode-languageserver-protocol/node";
import type { RequestOnlyConnection } from "./notifications.ts";
import type {
  ConfigMethod,
  Method,
  MethodMap,
  RequestContext,
  Tsudoi,
  TsudoiConfig,
} from "./types.ts";

/** Which drive a method needs, derived from whether its result yields batches. */
type DriveKind<M extends Method> = [StreamChunk<M>] extends [never]
  ? "awaited-once"
  : "stream-driven";

/** What the client receives as the response for a method this drive awaits once. */
type WireResult<M extends Method> = Awaited<MethodMap[M]["result"]>;

/** What one method adds to `ServerCapabilities` when the config can answer it. */
export type CapabilityContributor = (capabilities: ServerCapabilities) => void;

/**
 * What a table entry accepts in a request type's ERROR position: anything,
 * because that payload is the protocol's and not tsudoi's.
 */
type EntryErrorPayload = unknown;

/** The batch a stream-driven method yields, or `never` for one that yields none. */
type StreamChunk<M extends Method> =
  MethodMap[M]["result"] extends AsyncGenerator<infer C, unknown, unknown> ? C : never;

interface AwaitedOnceEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<MethodMap[M]["params"], WireResult<M>, EntryErrorPayload>;
  readonly capability: CapabilityContributor;
}

/**
 * A method whose handler is DRIVEN A CHUNK AT A TIME. Its `type` leaves the
 * result open, so a request type whose params merely fit is accepted here; the
 * key and the request type are held together by test rather than by the
 * compiler.
 */
interface StreamDrivenEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<MethodMap[M]["params"], unknown, EntryErrorPayload>;
  /** What the streamed chunks travel as. */
  readonly progress: ProgressType<StreamChunk<M>>;
  readonly capability: CapabilityContributor;
}

export type RequestEntry<M extends Method> = [StreamChunk<M>] extends [never]
  ? AwaitedOnceEntry<M>
  : StreamDrivenEntry<M>;

/** Every request tsudoi serves, keyed by the method name the router looks up. */
export const requestEntries: { [M in Method]: RequestEntry<M> } = {
  "textDocument/hover": {
    drive: "awaited-once",
    type: HoverRequest.type,
    capability: (capabilities) => {
      capabilities.hoverProvider = true;
    },
  },
  "textDocument/completion": {
    drive: "stream-driven",
    type: CompletionRequest.type,
    progress: new ProgressType<CompletionItem[]>(),
    // MERGED AND NEVER ASSIGNED, and nothing reddens if you write `= {}`:
    // `completionItem/resolve` writes into this same key, so an assignment here
    // would delete its `resolveProvider` on the day the two run in the other
    // order.
    capability: (capabilities) => {
      capabilities.completionProvider = { ...capabilities.completionProvider };
    },
  },
  "completionItem/resolve": {
    drive: "awaited-once",
    type: CompletionResolveRequest.type,
    // The spread keeps what completion's own contributor wrote, and dropping it
    // reddens nothing while completion contributes no key of its own -- it is
    // the first key completion gains that this line would silently delete.
    capability: (capabilities) => {
      capabilities.completionProvider = {
        ...capabilities.completionProvider,
        resolveProvider: true,
      };
    },
  },
  "textDocument/formatting": {
    drive: "awaited-once",
    type: DocumentFormattingRequest.type,
    capability: (capabilities) => {
      capabilities.documentFormattingProvider = true;
    },
  },
  "textDocument/diagnostic": {
    drive: "awaited-once",
    type: DocumentDiagnosticRequest.type,
    // `workspaceDiagnostics` is FORCED by tsudoi not serving
    // `workspace/diagnostic`; `interFileDependencies` is CHOSEN, on the two
    // errors not being symmetric -- a redundant pull is visible and costs, where
    // a stale diagnostic in another file that never clears is silent and wrong.
    capability: (capabilities) => {
      capabilities.diagnosticProvider = {
        interFileDependencies: true,
        workspaceDiagnostics: false,
      };
    },
  },
  "workspace/executeCommand": {
    drive: "awaited-once",
    type: ExecuteCommandRequest.type,
    // EMPTY, AND TSUDOI HAS NOTHING TO PUT IN IT. `commands` is REQUIRED, so
    // this contributor must write a list; every name it could invent would be a
    // claim to a client that no config made, and handler presence -- all this
    // runs on -- cannot say which commands a handler serves. NOT A REASON TO
    // CONTRIBUTE NOTHING: a config that declares this handler and no initialize
    // handler would otherwise advertise no command support at all, and that a
    // server executes commands is the one thing handler presence can say. What
    // the author must then do about the empty list is at
    // `MethodMap["workspace/executeCommand"]`; their own handler needs nothing
    // from here, src/server.ts sending their InitializeResult verbatim.
    capability: (capabilities) => {
      capabilities.executeCommandProvider = { commands: [] };
    },
  },
  "textDocument/codeAction": {
    drive: "stream-driven",
    type: CodeActionRequest.type,
    progress: new ProgressType<(Command | CodeAction)[]>(),
    // `true` AND NOT AN OPTIONS OBJECT, WHICH IS THE CONTRAST WITH THE ROW
    // ABOVE AND NOT AN ECONOMY. `ExecuteCommandOptions.commands` is REQUIRED, so
    // that contributor had to write a list it could not know and wrote an empty
    // one; `CodeActionOptions.codeActionKinds` is OPTIONAL, so handler presence
    // can decline to name kinds instead of naming wrong ones. `{ codeActionKinds:
    // [] }` reads like a harmless spelling of this and is not: it tells a
    // conforming client this server produces NO kinds, which is the promise the
    // row above could not avoid making and this one can.
    capability: (capabilities) => {
      capabilities.codeActionProvider = true;
    },
  },
};

/**
 * One entry with its per-method types gone, for the two places that ITERATE the
 * table: each entry's own types are checked where the entry is WRITTEN.
 */
interface ErasedEntry {
  readonly drive: "awaited-once" | "stream-driven";
  readonly type: RequestType<unknown, unknown, EntryErrorPayload>;
  readonly progress: ProgressType<unknown>;
  readonly capability: CapabilityContributor;
}

type ErasedAwaitedOnceHandler = (context: RequestContext, params: unknown) => Promise<unknown>;

type ErasedStreamHandler = (
  context: RequestContext,
  params: unknown,
) => AsyncGenerator<unknown[], void, void>;

function erasedEntries(): readonly (readonly [Method, ErasedEntry])[] {
  return Object.entries(requestEntries) as unknown as readonly (readonly [Method, ErasedEntry])[];
}

/** Claims each capability the config can actually answer for. */
export function contributeCapabilities(
  config: TsudoiConfig,
  capabilities: ServerCapabilities,
): void {
  for (const [method, entry] of erasedEntries()) {
    if (config.methods?.[method] !== undefined) {
      entry.capability(capabilities);
    }
  }
}

/**
 * Asks the lifecycle what a request arriving NOW must be answered with, or
 * undefined when it may be served. Owned by server.ts, which knows the
 * lifecycle; consulted here, where the config author's handlers are called.
 */
export type RequestRejection = () => ResponseError<void> | undefined;

/**
 * What a config author is told their handler did, as a SENTENCE and not as a
 * report -- because the handshake's failure in src/server.ts has the same words
 * and a different disposition: it cannot rethrow, it ends the process. Spelling
 * the sentence twice is how the two come to disagree about a failure that is one
 * thing.
 *
 * `ConfigMethod` AND NOT `Method`: the handshake handler is one, and every
 * caller of this is reporting a config author's own code.
 */
export function handlerFailure(method: ConfigMethod, error: unknown): string {
  return `${method} handler failed: ${failureDetail(error)}`;
}

/**
 * Reports a config handler's failure and rethrows it. vscode-jsonrpc consults
 * the connection's logger for NOTIFICATION handlers only, so without this line a
 * config author's handler fails where they cannot see it.
 */
export function reportHandlerFailure(method: ConfigMethod, error: unknown): never {
  process.stderr.write(`tsudoi: ${handlerFailure(method, error)}\n`);
  throw error;
}

/**
 * Reports a config handler's CLEANUP failure -- and stops there. Cleanup fails
 * only once the client already holds its -32800, so there is no response left to
 * correct and a rethrow could only take down a session still able to serve.
 */
function reportCleanupFailure(method: Method, error: unknown): void {
  process.stderr.write(`tsudoi: ${method} cleanup failed: ${failureDetail(error)}\n`);
}

/**
 * What a config author is shown of a failure: the stack when there is one, since
 * that is what locates the line in THEIR file.
 */
function failureDetail(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

/**
 * How a cancelled request is answered, whatever its handler produced. LSP 3.17
 * permits answering normally instead, so this is a CHOICE: the client has
 * already discarded the request's context.
 */
function requestCancelled(): never {
  throw new ResponseError(LSPErrorCodes.RequestCancelled, "Request cancelled");
}

/**
 * Bridges the connection's CancellationToken onto the AbortSignal a config author
 * already has, one controller per request.
 *
 * EXPORTED FOR THE ONE HANDLER THAT IS NOT A ROW OF THE TABLE: the handshake's
 * context extends this one, and duplicating the bridge there would put its only
 * record beside a second copy of it.
 */
export function requestContext(tsudoi: Tsudoi, cancellation: CancellationToken): RequestContext {
  const controller = new AbortController();
  if (cancellation.isCancellationRequested) {
    controller.abort();
  }
  cancellation.onCancellationRequested(() => controller.abort());
  return { signal: controller.signal, tsudoi };
}

/**
 * Runs one config handler to the answer the client receives, under that
 * request's cancellation. Everything cancellation changes about a TABLE request
 * is here and nowhere else, which is why every drive answers through it --
 * including for a request it has no handler for.
 *
 * `TABLE` IS THE WORD THAT MAKES IT TRUE. The handshake handler is bounded by
 * none of this: src/server.ts calls it directly and records there that it runs
 * through nothing, so a `signal` is handed over and no deadline, no
 * short-circuit and no -32800 follow it.
 */
async function answerUnlessCancelled<T>(
  method: Method,
  signal: AbortSignal,
  produce: () => Promise<T>,
): Promise<T> {
  if (signal.aborted) {
    requestCancelled();
  }
  let value: T;
  try {
    value = await produce();
  } catch (error) {
    // A cancelled handler is EXPECTED to fail -- an aborted fetch rejects by
    // design -- and nothing reddens if this check goes: a stack per cancellation
    // would train the config author to ignore the one stderr channel that means
    // something.
    if (signal.aborted) {
      requestCancelled();
    }
    reportHandlerFailure(method, error);
  }
  if (signal.aborted) {
    requestCancelled();
  }
  return value;
}

/**
 * Whether a value is a ProgressToken. `integer.is` is not used in its place: it
 * tests the two bounds and `typeof`, so `integer.is(1.5)` is `true`, and a token
 * of 1.5 survives JSON.
 */
function isProgressToken(value: unknown): value is ProgressToken {
  return (
    typeof value === "string" ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= integer.MIN_VALUE &&
      value <= integer.MAX_VALUE)
  );
}

/**
 * The token this request may stream under, or undefined when it must be
 * aggregated into one response instead.
 */
function streamingToken(
  requested: unknown,
  report: (requested: unknown) => void,
): ProgressToken | undefined {
  // ABSENCE AND NOT FALSINESS, and nothing reddens if you write `if (!token)`:
  // LSP defines a ProgressToken as `integer | string`, so `0` and `""` are both
  // legitimate AND falsy, and that spelling silently aggregates for every client
  // that numbers its tokens from zero.
  if (requested === undefined) {
    return undefined;
  }
  if (isProgressToken(requested)) {
    return requested;
  }
  report(requested);
  return undefined;
}

/**
 * Registers the request handlers a config can answer -- every one of them,
 * whether or not the config supplies a handler: a client that sends a request it
 * was never told about is answered emptily rather than MethodNotFound, since a
 * server must not fail because a client misbehaves.
 *
 * The parameter is the NARROWED connection: an `onNotification` reachable from
 * here would be a second door out of the notification router.
 */
export function registerMethods(
  connection: RequestOnlyConnection,
  config: TsudoiConfig,
  tsudoi: Tsudoi,
  requestRejection: RequestRejection,
): void {
  // PER METHOD AND NOT PER SESSION, and a single boolean here is the spelling
  // that looks right and silently loses a diagnostic: one flag for the whole
  // session means the first refusal on ANY stream-driven row permanently
  // silences every other row, so an author who saw the line once for completion
  // never learns their code actions were aggregated too. Harmless while
  // completion was the only such row; wrong the moment there were two.
  const invalidTokenReported = new Set<Method>();

  /** Names a refused token on stderr ONCE per method per session. */
  function reportInvalidToken(method: Method, requested: unknown): void {
    if (invalidTokenReported.has(method)) {
      return;
    }
    invalidTokenReported.add(method);
    process.stderr.write(
      `tsudoi: ignoring an invalid partialResultToken ${JSON.stringify(requested)}; ` +
        `a ProgressToken is an integer or a string, so this ${method} is answered ` +
        `as one aggregated response.\n`,
    );
  }

  for (const [method, entry] of erasedEntries()) {
    connection.onRequest(
      entry.type,
      async (params: unknown, cancellation: CancellationToken): Promise<unknown> => {
        const rejection = requestRejection();
        if (rejection !== undefined) {
          throw rejection;
        }
        if (typeof params !== "object" || params === null) {
          throw new ResponseError(
            ErrorCodes.InvalidParams,
            `${method} params must be an object; received ${JSON.stringify(params)}`,
          );
        }
        const handler = config.methods?.[method];
        if (entry.drive === "stream-driven") {
          return driveStream({
            method,
            handler: handler as ErasedStreamHandler | undefined,
            params,
            cancellation,
            entry,
            connection,
            tsudoi,
            reportInvalidToken,
          });
        }
        return driveAwaitedOnce({
          method,
          handler: handler as ErasedAwaitedOnceHandler | undefined,
          params,
          cancellation,
          tsudoi,
        });
      },
    );
  }
}

async function driveAwaitedOnce(run: {
  method: Method;
  handler: ErasedAwaitedOnceHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  tsudoi: Tsudoi;
}): Promise<unknown> {
  const context = requestContext(run.tsudoi, run.cancellation);
  return answerUnlessCancelled(run.method, context.signal, async () => {
    const settled: unknown = await Promise.race([
      Promise.resolve(run.handler?.(context, run.params)),
      abortedRace(context.signal),
    ]);
    return settled === abortWon ? null : (settled ?? null);
  });
}

/**
 * How many batches a config author's `finally` may yield before tsudoi stops
 * draining it and says so.
 *
 * A COUNT AND NOT A DEADLINE, and nothing reddens if you make it one: a timer
 * would measure the machine rather than the generator, so the same config would
 * be truncated on a loaded laptop and drained on a fast one. The number itself
 * is guarded by nothing either -- only the existence of a bound is.
 */
const maxCleanupYields = 1000;

/**
 * What the abort resolves as when it beats a pending pull.
 *
 * A SYMBOL SO IT CANNOT BE A HANDLER'S OWN VALUE, and nothing reddens if you make
 * it a string: the race is told apart from what the config author produced by
 * identity alone, so a sentinel an author could return would let a handler fake
 * its own cancellation.
 */
const abortWon = Symbol("tsudoi.abortWon");

/**
 * The abort as something a pending promise can be RACED against, so that a
 * handler suspended inside its own await still leaves a moment to answer in.
 *
 * THE FLAG IS READ BEFORE SUBSCRIBING, and nothing reddens if you drop that read:
 * a request cancelled before dispatch is handed `CancellationToken.Cancelled`,
 * whose event never fires at all, so a subscribe-only bridge waits here forever.
 */
function abortedRace(signal: AbortSignal): Promise<typeof abortWon> {
  return new Promise<typeof abortWon>((resolve) => {
    if (signal.aborted) {
      resolve(abortWon);
      return;
    }
    signal.addEventListener("abort", () => resolve(abortWon), { once: true });
  });
}

/**
 * The STREAM-DRIVEN drive. Whether batches leave as `$/progress` or are
 * aggregated into one response is decided HERE, from the presence of
 * `partialResultToken` and from nothing else -- what an author may rely on is
 * stated at `MethodMap["textDocument/completion"]`. There is no client capability
 * declaring partial-result support, so a client that cannot take them simply
 * omits the token.
 *
 * A LOOK-AHEAD IS REFUSED HERE, and this is the loop that would grow one: it
 * would spare a one-batch answer under a token its `$/progress` and its `null`
 * response, and it can only tell a one-batch answer apart by pulling the SECOND
 * batch before sending the FIRST -- a delay landing exactly when the first chunk
 * is slow and streaming matters most.
 *
 * What a method picking this drive must satisfy: its params carry a
 * `partialResultToken`, and what it yields is ARRAYS, since aggregating
 * concatenates them. The second is what excludes `textDocument/diagnostic`, whose
 * partial results are objects carrying OTHER documents' reports rather than more
 * of the one that was asked for.
 *
 * THE CONDITIONS DO NOT SAY WHY A ROW THAT MEETS THEM IS HERE, which is the
 * reading to carry away rather than the conditions themselves.
 * `textDocument/completion` predates the split and no ruling anywhere records an
 * alternative being weighed for it; `textDocument/codeAction` could have been
 * awaited once and was RULED into this drive, its reason at
 * `MethodMap["textDocument/codeAction"]`. So a reader arriving here to learn what
 * forced a row will not find it here for either of them.
 */
async function driveStream(run: {
  method: Method;
  handler: ErasedStreamHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  entry: ErasedEntry;
  connection: RequestOnlyConnection;
  tsudoi: Tsudoi;
  reportInvalidToken: (method: Method, requested: unknown) => void;
}): Promise<unknown> {
  const handler = run.handler;
  const context = requestContext(run.tsudoi, run.cancellation);
  if (handler === undefined) {
    return answerUnlessCancelled(run.method, context.signal, () => Promise.resolve(null));
  }
  // BELOW THE NO-HANDLER RETURN, and nothing reddens if you lift it above: a
  // config that cannot answer this method at all has no business reporting the
  // client's token on stderr, since that line exists to say the items were
  // aggregated rather than streamed and here there are none.
  const requestedToken: unknown = (run.params as PartialResultParams).partialResultToken;
  const token = streamingToken(requestedToken, (requested) => {
    run.reportInvalidToken(run.method, requested);
  });
  const progress = run.entry.progress;
  return answerUnlessCancelled(run.method, context.signal, async () => {
    const collected: unknown[] = [];
    let yielded = false;
    const batches = handler(context, run.params);
    // Closing the generator is what runs the config author's `finally`.
    const drainCleanup = async (): Promise<void> => {
      let result = await batches.return();
      for (let pulled = 0; result.done !== true; pulled += 1) {
        if (pulled >= maxCleanupYields) {
          reportCleanupFailure(
            run.method,
            `cleanup yielded more than ${maxCleanupYields} batches without finishing, ` +
              `so the rest of it was abandoned`,
          );
          return;
        }
        result = await batches.next();
      }
    };
    const close = (): void => {
      drainCleanup().then(undefined, (error: unknown) => {
        reportCleanupFailure(run.method, error);
      });
    };
    let completed = false;
    // BUILT ONCE, ABOVE THE LOOP RATHER THAN PER PULL, and nothing reddens if you
    // move it in: one race is one subscription, so a race taken per pull leaves a
    // listener per batch on a signal that outlives them all.
    const aborted = abortedRace(context.signal);
    try {
      for (;;) {
        if (context.signal.aborted) {
          return null;
        }
        const pull = batches.next();
        const settled = await Promise.race([pull, aborted]);
        if (settled === abortWon) {
          return null;
        }
        const next = settled;
        if (next.done === true) {
          completed = true;
          return yielded && token === undefined ? collected : null;
        }
        // NOT MADE REDUNDANT BY EITHER CHECK AROUND IT, and nothing reddens if
        // you drop it: this is the seam where the pull and the abort BOTH settled
        // and `Promise.race` reported the pull, so the batch is in hand and must
        // not go out to a client that has stopped listening.
        if (context.signal.aborted) {
          return null;
        }
        if (!Array.isArray(next.value)) {
          throw new TypeError(
            `${run.method} handler yielded a batch that is not an array: ` +
              `${JSON.stringify(next.value)}`,
          );
        }
        yielded = true;
        if (token === undefined) {
          collected.push(...next.value);
        } else {
          await run.connection.sendProgress(progress, token, next.value);
        }
      }
    } finally {
      if (!completed) {
        close();
      }
    }
  });
}
