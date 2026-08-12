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
import type {
  CustomNotificationEntry,
  KeyedOperationQueue,
  RequestOnlyConnection,
} from "./notifications.ts";
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
  readonly queue?: (params: MethodMap[M]["params"]) => string;
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
  readonly queue?: (params: MethodMap[M]["params"]) => string;
}

export type RequestEntry<M extends Method> = [StreamChunk<M>] extends [never]
  ? AwaitedOnceEntry<M>
  : StreamDrivenEntry<M>;

/** Every request tsudoi serves, keyed by the method name the router looks up. */
export const requestEntries: { [M in Method]: RequestEntry<M> } = {
  "textDocument/hover": {
    drive: "awaited-once",
    type: HoverRequest.type,
    queue: (params) => params.textDocument.uri,
    capability: (capabilities) => {
      capabilities.hoverProvider = true;
    },
  },
  "textDocument/completion": {
    drive: "stream-driven",
    type: CompletionRequest.type,
    queue: (params) => params.textDocument.uri,
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
    queue: (params) => params.textDocument.uri,
    capability: (capabilities) => {
      capabilities.documentFormattingProvider = true;
    },
  },
  "textDocument/diagnostic": {
    drive: "awaited-once",
    type: DocumentDiagnosticRequest.type,
    queue: (params) => params.textDocument.uri,
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
    queue: (params) => params.textDocument.uri,
    progress: new ProgressType<(Command | CodeAction)[]>(),
    // NAMES NO KINDS, WHICH IS THE CONTRAST WITH THE ROW ABOVE AND NOT AN
    // ECONOMY. `ExecuteCommandOptions.commands` is REQUIRED, so that contributor
    // had to write a list it could not know and wrote an empty one;
    // `CodeActionOptions.codeActionKinds` is OPTIONAL, so handler presence can
    // decline to name kinds instead of naming wrong ones.
    //
    // WHAT IS REFUSED IS `{ codeActionKinds: [] }` AND NOT AN OPTIONS OBJECT AS
    // SUCH: `{}` is a legal `CodeActionOptions` that says exactly what `true`
    // says, so the boolean is a spelling and carries no claim of its own. The
    // empty LIST is the one that reads like a harmless spelling and is not --
    // it tells a conforming client this server produces NO kinds, which is the
    // promise the row above could not avoid making and this one can.
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
  readonly queue?: (params: unknown) => string;
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
 * THE NAME A FAILURE, A CANCELLATION OR A REFUSAL IS REPORTED UNDER, and it is
 * ONE SPELLING for the whole module rather than one per site: a config may
 * declare a method tsudoi never enumerated, so a name reaching these paths is
 * not always a key of anything. What each of them still assumes is that the name
 * came from a REGISTRATION -- tsudoi's own table or a config's own declaration --
 * and never off the wire, which is what keeps a client's own bytes out of stderr.
 */
type ReportedMethod = ConfigMethod | (string & {});

/**
 * What a config author is told their handler did, as a SENTENCE and not as a
 * report -- because the handshake's failure in src/server.ts has the same words
 * and a different disposition: it cannot rethrow, it ends the process. Spelling
 * the sentence twice is how the two come to disagree about a failure that is one
 * thing.
 *
 * EVERY CALLER OF THIS IS REPORTING A CONFIG AUTHOR'S OWN CODE, the handshake
 * handler included.
 */
export function handlerFailure(method: ReportedMethod, error: unknown): string {
  return `${method} handler failed: ${failureDetail(error)}`;
}

/**
 * Reports a config handler's failure and rethrows it. vscode-jsonrpc consults
 * the connection's logger for NOTIFICATION handlers only, so without this line a
 * config author's handler fails where they cannot see it.
 */
export function reportHandlerFailure(method: ReportedMethod, error: unknown): never {
  process.stderr.write(`tsudoi: ${handlerFailure(method, error)}\n`);
  throw error;
}

/**
 * Reports a config handler's CLEANUP failure -- and stops there. Cleanup fails
 * only once the client already holds its -32800, so there is no response left to
 * correct and a rethrow could only take down a session still able to serve.
 */
function reportCleanupFailure(method: ReportedMethod, error: unknown): void {
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

/** Waits for admitted document work without making cancellation wait for it. */
async function waitUnlessCancelled(
  waiting: Promise<void>,
  cancellation: CancellationToken,
): Promise<void> {
  if (cancellation.isCancellationRequested) {
    requestCancelled();
  }
  let subscription: { dispose(): void } | undefined;
  const cancelled = new Promise<never>((_resolve, reject) => {
    subscription = cancellation.onCancellationRequested(() => {
      reject(new ResponseError(LSPErrorCodes.RequestCancelled, "Request cancelled"));
    });
  });
  try {
    await Promise.race([waiting, cancelled]);
  } finally {
    subscription?.dispose();
  }
  if (cancellation.isCancellationRequested) {
    requestCancelled();
  }
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
 * request's cancellation. Everything cancellation changes about a REQUEST is
 * here and nowhere else, which is why every drive answers through it -- both
 * table drives, the custom-request registration below, and the table's answer
 * for a request it has no handler for.
 *
 * `REQUEST` IS THE WORD THAT MAKES IT TRUE. The handshake handler is bounded by
 * none of this: src/server.ts calls it directly and records there that it runs
 * through nothing, so a `signal` is handed over and no deadline, no
 * short-circuit and no -32800 follow it.
 */
async function answerUnlessCancelled<T>(
  method: ReportedMethod,
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
  documentQueue?: KeyedOperationQueue,
): void {
  // PER METHOD AND NOT PER SESSION, and a single boolean here is the spelling
  // that looks right and silently loses a diagnostic: one flag for the whole
  // session means the first refusal on ANY stream-driven row permanently
  // silences every other row, so an author who saw the line once for completion
  // never learns their code actions were aggregated too. Harmless while
  // completion was the only such row; wrong the moment there were two.
  const invalidTokenReported = new Set<ReportedMethod>();

  /** Names a refused token on stderr ONCE per method per session. */
  function reportInvalidToken(method: ReportedMethod, requested: unknown): void {
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
        if (entry.queue !== undefined && documentQueue !== undefined) {
          const textDocument = (params as { textDocument?: unknown }).textDocument;
          if (
            typeof textDocument !== "object" ||
            textDocument === null ||
            typeof (textDocument as { uri?: unknown }).uri !== "string"
          ) {
            throw new ResponseError(
              ErrorCodes.InvalidParams,
              `${method} params must contain textDocument.uri as a string`,
            );
          }
          const pending = documentQueue.wait(entry.queue(params));
          if (pending !== undefined) {
            await waitUnlessCancelled(pending, cancellation);
          }
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

  registerCustomRequests(connection, config, tsudoi, requestRejection);
}

/**
 * Every custom method the config declared, with the two handler types collapsed
 * into one -- the same erasure the table takes, for the same reason: a handler's
 * own types are checked where it is WRITTEN, which for these is the author's
 * file.
 *
 * AND THE ERASURE IS WHAT THE RUNTIME ACTUALLY KNOWS. Which of the two an author
 * annotated cannot be read off the value, and nothing here needs it: the name is
 * registered on both sides, so what a handler answered is judged against the form
 * the message ARRIVED in rather than against the form it was written for.
 */
type ErasedCustomHandler = (context: unknown, params: unknown) => Promise<unknown>;

function erasedCustomEntries(
  config: TsudoiConfig,
): readonly (readonly [string, ErasedCustomHandler])[] {
  return Object.entries(config.customMethod ?? {}) as unknown as readonly (readonly [
    string,
    ErasedCustomHandler,
  ])[];
}

/**
 * The config's custom NOTIFICATIONS, each already bound to the session its
 * handler receives, for src/notifications.ts to gate and register.
 *
 * BUILT HERE AND REGISTERED THERE, which is the routing this feature has to take
 * rather than the one that would be convenient: only the router may register a
 * notification -- `RequestOnlyConnection` removes `onNotification` from the type
 * every other module sees -- so what crosses is DATA. This module knows what a
 * handler is handed; that one knows when a message may run.
 *
 * EVERY NAME THE CONFIG DECLARED, AND NEVER THE ONES THAT SAID `notification`:
 * a name carries no kind, and asking it for one is what sprint 96 was cancelled
 * for. Upstream keeps its request and notification handlers in SEPARATE MAPS, so
 * the same name on both collides with nothing and the JSON-RPC id decides which
 * one a message reaches -- beneath tsudoi, which therefore never asks.
 */
export function customNotifications(
  config: TsudoiConfig,
  tsudoi: Tsudoi,
): readonly CustomNotificationEntry[] {
  // PER METHOD AND NOT PER SESSION, which is the spelling that looks right and
  // silently loses a diagnostic: one flag for the whole session means the first
  // report on ANY custom notification permanently silences every other, so an
  // author who saw the line once never learns a second handler is broken too.
  // The same reading the table's own token report records one screen up.
  const reported = new Set<string>();
  const entries: CustomNotificationEntry[] = [];
  for (const [method, handler] of erasedCustomEntries(config)) {
    entries.push({
      method,
      // TSUDOI'S RULING AND NOT THE AUTHOR'S, which is what the gate stopped
      // being when a custom method became a bare function: a notification
      // outside the initialized window is dropped exactly as a built-in one is.
      // `always` here instead would run a config author's handler before the
      // handshake, against a session whose documents are empty and whose roots
      // are null -- the state the gate exists to prevent, and the perturbation
      // this line is the site of.
      gate: "lifecycle",
      run: async (params: unknown): Promise<void> => {
        let answered: unknown;
        try {
          answered = await handler({ tsudoi }, params);
        } catch (error) {
          // CAUGHT HERE RATHER THAN LET THROUGH, and it is the report's cadence
          // that forces it: MEASURED, upstream's own notification handling wraps
          // the awaited handler in a try/catch calling `logger.error`
          // UNCONDITIONALLY -- three messages, three lines naming the method --
          // and tsudoi's logger writes stderr. A hook on a notification the
          // editor sends per keystroke would be one line per keystroke.
          reportNotificationOnce(
            reported,
            method,
            `notification handler rejected, and a notification has no response to carry it: ` +
              failureDetail(error),
          );
          return;
        }
        if (answered !== undefined) {
          reportNotificationOnce(
            reported,
            method,
            `notification handler answered with ${answered === null ? "null" : typeof answered}; a ` +
              `notification has no response, so the value was discarded`,
          );
        }
      },
    });
  }
  return entries;
}

/**
 * Names on stderr, ONCE PER METHOD PER SESSION, what a custom notification's
 * handler did that a notification cannot carry.
 *
 * AND IT IS THE ONLY ENFORCEMENT THERE IS, which is what makes it worth the code
 * rather than belt-and-braces: `Promise<void>` constrains a real config NOWHERE,
 * src/config.ts reaching it through a cast from `unknown`, so an author whose
 * handler answers gets no diagnostic from anything else. MEASURED with this
 * report deleted and the catch above left in place: a rejecting handler is
 * observable by NOTHING -- stderr empty, the session still serving, the
 * rejection caught by the awaiting frame rather than reaching either runtime's
 * unhandled-rejection path.
 *
 * STDERR IS NOT A CHOICE AMONG CHANNELS: src/cli.ts owes zero bytes on stdout,
 * which belongs to LSP.
 */
function reportNotificationOnce(reported: Set<string>, method: string, what: string): void {
  if (reported.has(method)) {
    return;
  }
  reported.add(method);
  process.stderr.write(`tsudoi: ${method} ${what}; further reports for this method are silent.\n`);
}

/**
 * WHAT THE CLIENT SENT, out of the arguments upstream hands a handler registered
 * BY NAME. There is no `RequestType` beside a bare name to say how many params
 * the method takes, so upstream spreads instead of checking: absent params call
 * the handler with THE TOKEN ALONE, a by-name object arrives as one argument
 * before it, and a by-position array arrives spread across several.
 *
 * THE RESIDUE IS UPSTREAM'S SPREAD AND NOT THIS READING: a client sending a
 * ONE-ELEMENT positional array is indistinguishable here from one sending that
 * element by name, the array having been taken apart before tsudoi saw it. A
 * method whose params matter that much sends them by name, as every message of
 * this protocol does.
 */
function customParams(args: readonly unknown[]): unknown {
  if (args.length < 2) {
    return undefined;
  }
  if (args.length === 2) {
    return args[0];
  }
  return args.slice(0, -1);
}

/**
 * Registers every custom method the config declared on the REQUEST side -- by
 * NAME, which is all upstream needs and all tsudoi has.
 *
 * EVERY NAME AND NOT THE ONES THAT CALLED THEMSELVES REQUESTS, for the reason
 * `customNotifications` records at the other half of the same pair: the two
 * registrations are separate maps, so a name lands on both and the id a message
 * carries decides which is reached.
 *
 * NOT REGISTERED FOR A NAME THE CONFIG DID NOT DECLARE, which is the opposite of
 * what the table above does and is forced rather than chosen: the table
 * registers every row whether or not a handler exists, so a client sending one it
 * was never told about is answered emptily instead of MethodNotFound. There is no
 * such list here. A name nobody declared is answered MethodNotFound by
 * src/server.ts's fallback, which is the correct answer for a method this server
 * genuinely does not have.
 *
 * NOTHING CHECKS THAT PARAMS ARE AN OBJECT, unlike the table's own prologue, and
 * the reason is that there is no shape to check against: a custom method's params
 * are whatever its author and their client agreed on, absence included.
 */
function registerCustomRequests(
  connection: RequestOnlyConnection,
  config: TsudoiConfig,
  tsudoi: Tsudoi,
  requestRejection: RequestRejection,
): void {
  for (const [method, handler] of erasedCustomEntries(config)) {
    connection.onRequest(method, async (...args: readonly unknown[]): Promise<unknown> => {
      const rejection = requestRejection();
      if (rejection !== undefined) {
        throw rejection;
      }
      const context = requestContext(tsudoi, args[args.length - 1] as CancellationToken);
      return answerUnlessCancelled(method, context.signal, async () => {
        const answered: unknown = await handler(context, customParams(args));
        // A HANDLER FAILURE AND NOT A NULL ANSWER, which is the whole of what the
        // wrapper buys: a typed row says `Hover | null` and tells the two apart by
        // its own type, and `unknown` cannot. A missing case silently becoming
        // null would hand back the very conflation the wrapper was added to
        // remove.
        //
        // THROWN RATHER THAN REPORTED HERE, so it takes the route a throwing
        // handler already takes -- the frame above names the method on stderr and
        // rethrows, and upstream turns the throw into an error response. WHAT THE
        // STACK ON THAT LINE POINTS AT IS THIS FILE and not the author's, because
        // an omission has no frame of its own; the sentence is what locates it.
        if (typeof answered !== "object" || answered === null || !("result" in answered)) {
          throw new Error(
            `it answered ${answered === null ? "null" : typeof answered} where a custom request ` +
              `answers { result }; returning { result: null } IS an answer, and falling off the ` +
              `end is not`,
          );
        }
        return (answered as { readonly result: unknown }).result;
      });
    });
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
  reportInvalidToken: (method: ReportedMethod, requested: unknown) => void;
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
