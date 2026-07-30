import process from "node:process";
import {
  type CancellationToken,
  type CompletionItem,
  CompletionRequest,
  CompletionResolveRequest,
  DocumentDiagnosticRequest,
  DocumentFormattingRequest,
  ErrorCodes,
  HoverRequest,
  LSPErrorCodes,
  type PartialResultParams,
  type ProgressToken,
  ProgressType,
  type RequestType,
  ResponseError,
  type ServerCapabilities,
} from "vscode-languageserver-protocol/node";
import type { RequestOnlyConnection } from "./notifications.ts";
import type { Method, MethodMap, RequestContext, Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * How a config author's handler is RUN to the answer the client receives.
 *
 * TWO KINDS, NAMED, AND THE CHOICE IS NOT FREE: it is DERIVED from what
 * `MethodMap` says the handler returns, so a method declared with the wrong
 * drive does not compile -- writing `stream-driven` on hover's entry fails
 * TS2322 naming the two strings, and completion's entry requires the `progress`
 * member that only a stream-driven entry declares.
 *
 * A DERIVATION THAT STOPS MATCHING FAILS SILENTLY, BY ROUTING COMPLETION TO THE
 * AWAITED-ONCE ENTRY WITH NOTHING OBJECTING, which is why the question is asked
 * of THE ONE THING THE DRIVE ACTUALLY NEEDS: does the declared result YIELD
 * BATCHES this drive must pull. Questions that were true of the result rather
 * than of the need -- `does it extend AsyncGenerator`, `does it carry a stream
 * slot` -- have each stopped matching when the declared result moved.
 *
 * DECLARING `partialResult` IS NECESSARY AND NOT SUFFICIENT, which is the trap
 * `textDocument/diagnostic` sits in: it declares one and is AWAITED ONCE. See
 * `driveStream`, which states both of that drive's requirements and which that
 * method fails on the second.
 */
type DriveKind<M extends Method> = [StreamChunk<M>] extends [never]
  ? "awaited-once"
  : "stream-driven";

/**
 * WHAT THE CLIENT RECEIVES AS THE RESPONSE for a method this drive AWAITS ONCE,
 * which is every method except completion. Nothing about hover, formatting,
 * diagnostic or resolve is derived through a conditional at all: their handler's
 * awaited result IS what goes on the wire.
 *
 * COMPLETION IS ABSENT FROM THIS ON PURPOSE, and the reason is at
 * `StreamDrivenEntry` where its consequence lands.
 */
type WireResult<M extends Method> = Awaited<MethodMap[M]["result"]>;

/**
 * What one method adds to `ServerCapabilities` when the config can answer it.
 *
 * A FUNCTION, NOT A KEY AND A VALUE, and that is a requirement rather than a
 * taste. No mechanical `methods[k] !== undefined -> capabilities[flag] = true`
 * expresses what these five have to say: `completionProvider` is an OBJECT and
 * `completionItem/resolve` contributes `completionProvider.resolveProvider` --
 * A KEY INSIDE ANOTHER METHOD'S -- while `diagnosticProvider` is an object with
 * TWO REQUIRED BOOLEANS, so for that one neither `true` nor `{}` would
 * type-check and copying completion's shape would not either. A function is
 * immune to the next shape arriving; a key/value pair has to be widened for each
 * one.
 *
 * IT MUTATES, AND IT IS NOT ORDER-DEPENDENT. Reaching inside another method's
 * key is what would make it so -- A CONTRIBUTOR THAT WRITES INTO A KEY ANOTHER
 * METHOD OWNS MUST RUN AFTER THAT METHOD'S -- and what removes the constraint is
 * that THE ONE KEY TWO METHODS SHARE IS MERGED INTO RATHER THAN ASSIGNED OVER,
 * so what another contributor already wrote survives and the order they run in
 * decides nothing. The table is still iterated in DECLARATION ORDER, because
 * string keys on an object literal preserve it, and nothing depends on that.
 *
 * WHAT IS NOT DEFENDED, NAMED RATHER THAN LEFT TO BE FOUND: nothing stops a
 * FUTURE contributor from assigning over a key another method owns. The merge
 * is a property of the two lines that write `completionProvider` and not of
 * this type, and no test can see the difference while `textDocument/completion`
 * contributes no key of its own.
 */
export type CapabilityContributor = (capabilities: ServerCapabilities) => void;

/**
 * What a table entry accepts in a request type's ERROR position: ANYTHING,
 * because that payload is THE PROTOCOL'S AND NOT TSUDOI'S.
 *
 * ONE HOME FOR THE REASON, and the alias exists for that rather than for
 * brevity: three entry interfaces sit at this position and a reader narrowing
 * one back to `void` would find nothing at the other two.
 *
 * NOT `void`, AND THAT IS NOT A TASTE: hover, completion and formatting each
 * declare `void` there, but `DocumentDiagnosticRequest` declares
 * `DiagnosticServerCancellationData`, so pinning `void` REFUSES THE REAL REQUEST
 * TYPE with TS2322 at position 2 of `RequestType`'s phantom tuple.
 *
 * TSUDOI STILL NAMES NO METHOD-SPECIFIC ERROR TYPE, which is the criterion this
 * has to be read against: `MethodMap` gains nothing, no handler's return type
 * mixes an error shape in, and `retriggerRequest` remains foreclosed -- it is a
 * server telling a client its analysis is TRANSIENTLY unavailable, and that
 * needs a config author who can know that. None has asked to be.
 *
 * BOOKED AS A DEBIT so the ledger carries costs and not only gains: an entry may
 * name a request type whose error payload disagrees with every other entry's and
 * NOTHING OBJECTS. Nothing exercises that today and nothing checks it.
 */
type EntryErrorPayload = unknown;

/**
 * The batch a stream-driven method yields, read off `MethodMap` rather than
 * fixed here: the drive is shared, so the payload type may not be one method's.
 * `never` for a method whose result is not something to pull at all, which is
 * what `DriveKind` above turns on.
 */
type StreamChunk<M extends Method> =
  MethodMap[M]["result"] extends AsyncGenerator<infer C, unknown, unknown> ? C : never;

/**
 * A method whose handler is AWAITED ONCE.
 *
 * ITS `type` IS FULLY DISCRIMINATING, which is the property the whole table
 * rests on: the result is pinned to `MethodMap`'s own, so
 * `CompletionRequest.type` written into hover's slot fails TS2322.
 */
interface AwaitedOnceEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<MethodMap[M]["params"], WireResult<M>, EntryErrorPayload>;
  readonly capability: CapabilityContributor;
}

/**
 * A method whose handler is DRIVEN A CHUNK AT A TIME.
 *
 * ITS `type` LEAVES THE RESULT OPEN, AND THAT IS A MEASURED WEAKNESS RATHER
 * THAN A SHRUG -- stated here because the natural reading of the entry above is
 * that both are equally safe, and they are not. The protocol declares
 * `CompletionRequest`'s result as `CompletionItem[] | CompletionList | null`,
 * WIDER than the `CompletionItem[] | null` this drive can produce, so pinning
 * the result to what tsudoi's own types describe REFUSES THE REAL REQUEST TYPE.
 * With the result open, any request type whose params are assignable is
 * accepted -- and `HoverParams` IS assignable to `CompletionParams`, since they
 * differ only in OPTIONAL members -- so `HoverRequest.type` in completion's slot
 * COMPILES.
 *
 * PINNING IT BACK IS NOT AVAILABLE: a handler that yields `CompletionItem[]`
 * and nothing else cannot say `CompletionList`, so `StreamChunk<M> | null` gives
 * TS2322 AT THE TABLE ENTRY. And WIDENING THE DECLARED RESULT TO KEEP THE PIN IS
 * REFUSED: declaring that a completion answer may be a `CompletionList` when
 * nothing in this drive can produce one is a slot whose meaning does not match
 * its contents.
 *
 * SO THE MIS-KEYING HAZARD IS CLOSED BY A TEST RATHER THAN BY THE COMPILER, and
 * that test is THE ONLY thing standing between this entry and a mis-keying:
 * every entry's key is asserted equal to its own `type.method` in
 * test/methods-table.test.ts. It makes a second, different claim too --
 * `type.method` is a RUNTIME STRING, and a dependency that renamed the method a
 * request constant carries while leaving its types alone would satisfy every
 * compile-time check and reach the wrong handler.
 */
interface StreamDrivenEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<MethodMap[M]["params"], unknown, EntryErrorPayload>;
  /**
   * What the streamed chunks travel as. On the entry rather than in the drive
   * so the drive names no single method's payload -- `ProgressType` carries no
   * state, so one instance per method is the whole cost.
   */
  readonly progress: ProgressType<StreamChunk<M>>;
  readonly capability: CapabilityContributor;
}

/**
 * One method tsudoi serves: what it is on the wire, how its handler is driven,
 * and what it entitles a client to ask for.
 */
export type RequestEntry<M extends Method> = [StreamChunk<M>] extends [never]
  ? AwaitedOnceEntry<M>
  : StreamDrivenEntry<M>;

/**
 * EVERY REQUEST TSUDOI SERVES, AND THE SHAPE IS THE POINT: a mapped type over
 * `Method`, so a method `MethodMap` declares and this table omits IS A COMPILE
 * ERROR NAMING THE MISSING KEY (measured: TS2741). That is the whole of the
 * user story -- a method that decides nothing does not compile, instead of
 * joining a convention whoever writes it must remember.
 *
 * THE KEY IS THE METHOD NAME AND NOTHING ELSE CARRIES IT. There is no `method`
 * field to disagree with the key, because the router looks the config's handler
 * up BY THE KEY and reports failures BY THE KEY.
 */
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
    // EMPTY OPTIONS, NOT triggerCharacters: TsudoiConfig has no surface for a
    // config author to declare them, and claiming trigger characters nobody
    // configured would have the client ask at moments the handler knows nothing
    // about.
    //
    // IT MERGES RATHER THAN ASSIGNS, AND THAT IS WHAT MAKES THIS TABLE
    // ORDER-INDEPENDENT. `= {}` here would mean a contributor writing into a key
    // THIS method owns had to run after this one, and `completionItem/resolve`
    // is that contributor. The spread is the whole fix: what is already there
    // survives, so the two entries produce the same `completionProvider` in
    // either order.
    //
    // `{ ...undefined }` IS `{}`, which is why the no-resolve case is
    // unchanged: for a config supplying completion alone this key is absent
    // when this runs and the spread contributes nothing.
    capability: (capabilities) => {
      capabilities.completionProvider = { ...capabilities.completionProvider };
    },
  },
  // THE ONLY ENTRY WHOSE CAPABILITY WRITES INTO A KEY ANOTHER METHOD OWNS. Its
  // POSITION IS NOT LOAD-BEARING: completion merges rather than assigns, so both
  // orders produce the same `completionProvider`, and this sits below completion
  // because that is the order the pair reads in.
  "completionItem/resolve": {
    drive: "awaited-once",
    type: CompletionResolveRequest.type,
    // THE ONE SHAPE THIS TABLE HOLDS THAT IS NOT A KEY OF ITS OWN:
    // `resolveProvider` lives inside `CompletionOptions`, which is
    // `completionProvider`'s value -- so this is the line that makes
    // `CapabilityContributor` a FUNCTION rather than a flag.
    //
    // THE EXISTING VALUE IS PRESERVED RATHER THAN REPLACED, and both lines that
    // write `completionProvider` merge into it, which is exactly what makes the
    // pair order-independent. IT IS NOT DEFENDED: `textDocument/completion`
    // contributes no key of its own, so deleting this spread produces an
    // identical result for every config and reddens nothing. What it buys is a
    // FUTURE `triggerCharacters` on completion's line not being deleted by this
    // one, silently, at a distance.
    //
    // THIS LINE WOULD BRING A `completionProvider` INTO BEING FOR A CONFIG THAT
    // CANNOT ANSWER COMPLETION, and what stops it is NOT here. That state --
    // resolveProvider on a completion provider whose handler does not exist,
    // inviting completion requests tsudoi can only answer `null` -- is reachable
    // for the first time through this contributor, because it is the first that
    // writes into a key it does not own.
    //
    // IT IS FORECLOSED ONE STAGE EARLIER: a config supplying
    // `completionItem/resolve` without `textDocument/completion` is REJECTED AT
    // CONFIG LOAD, in src/config.ts, where the reason for rejecting there rather
    // than here is written out. So by the time any contributor runs, the pair is
    // known to hold, and this line is not defending itself against a state that
    // has already been refused.
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
    // `true`, NOT AN OPTIONS OBJECT, and the difference from completion's line
    // is not a style drift: DocumentFormattingOptions extends
    // WorkDoneProgressOptions and declares NOTHING ELSE, so the only thing an
    // options object could say here is `workDoneProgress`, which tsudoi does
    // not implement for this method. `true` is the protocol's own way to say
    // `provided, with nothing to configure`, and
    // `documentFormattingProvider?: boolean | DocumentFormattingOptions` sits at
    // the TOP LEVEL of ServerCapabilities -- it is nobody else's key, which is
    // why this reads like hover's and not like resolve's, which reaches inside
    // completion's.
    capability: (capabilities) => {
      capabilities.documentFormattingProvider = true;
    },
  },
  "textDocument/diagnostic": {
    // AWAITED ONCE DESPITE DECLARING `partialResult` -- see `driveStream`:
    // declaring it is NECESSARY AND NOT SUFFICIENT, because that drive
    // concatenates chunks and this method's chunks are objects. Nothing here
    // chooses the drive anyway; `DriveKind` DERIVES it from `MethodMap`, so
    // writing `stream-driven` on this line would not compile.
    drive: "awaited-once",
    type: DocumentDiagnosticRequest.type,
    // AN OBJECT WITH TWO REQUIRED BOOLEANS, WHICH IS WHY NEITHER `true` NOR `{}`
    // WOULD DO: `DiagnosticOptions` requires BOTH.
    //
    // NO `identifier`, AND ITS ABSENCE IS A DECISION RATHER THAN AN OMISSION,
    // written here because this is the line that would gain one.
    // `DiagnosticOptions` declares it optional, and `DocumentDiagnosticParams`
    // carries the matching optional `identifier` a client echoes back -- so
    // registering one would create a value tsudoi must then MATCH incoming
    // params against, and `TsudoiConfig` has no surface for an author to name
    // it. A client sending `identifier` today is answered from the same handler
    // regardless, which is correct while tsudoi registers exactly one diagnostic
    // source.
    //
    // `workspaceDiagnostics: false` IS FORCED, NOT CHOSEN. tsudoi does not serve
    // `workspace/diagnostic` -- a SEPARATE request with its own params and
    // result, not a variant of this one -- and the protocol makes this field the
    // switch for exactly that: `WorkspaceDiagnosticRequest.capabilities` is
    // `CM<"workspace.diagnostics", "diagnosticProvider.workspaceDiagnostics">`.
    // It becomes `true` in the same change that adds that entry, never before.
    //
    // `interFileDependencies: true` IS CHOSEN BY TSUDOI, ON HARM ASYMMETRY AND
    // EXPLICITLY NOT ON WHAT IS TYPICAL. The config author has NO SURFACE to
    // answer this on, so tsudoi must answer it for them, and the two errors are
    // not symmetric: `true` for a language with no inter-file dependencies costs
    // REDUNDANT PULLS -- visible, a performance cost, borne by the client --
    // while `false` for a language that has them leaves A STALE DIAGNOSTIC IN
    // ANOTHER FILE THAT NEVER CLEARS, which is SILENT AND WRONG.
    //
    // THE PROTOCOL'S OWN COMMENT SAYS `typically uncommon for linters` AND THAT
    // IS DELIBERATELY NOT THE REASON, written here because it is the obvious
    // wrong path back to this line: it describes LANGUAGES, which is the one
    // thing only a config author knows and the exact thing they cannot tell us.
    //
    // THE COST IS NAMED RATHER THAN HIDDEN: tsudoi's likely audience is
    // linter-shaped, so MOST CONFIGS WILL PAY PULLS THEY DO NOT NEED. NOT A
    // PUBLISHED SURFACE, on one-way reversibility -- tsudoi picking now makes a
    // later surface ADDITIVE, where a surface now would make removal BREAKING.
    // REVERSAL IS EVIDENCE-SHAPED rather than predictive: a config author who
    // reports redundant pulls, or asks for `false`.
    capability: (capabilities) => {
      capabilities.diagnosticProvider = {
        interFileDependencies: true,
        workspaceDiagnostics: false,
      };
    },
  },
};

/**
 * One entry with its per-method types gone.
 *
 * THE ONE ERASURE, and it is confined to the two places that ITERATE the table
 * -- exactly as src/notifications.ts's router does, and for the same reason.
 * Each entry's own params, result and chunk types are checked where the entry is
 * WRITTEN, against the mapped type above; here the entries are a heterogeneous
 * list and no single element type describes them without this. `drive` is
 * deliberately outside it: it is a string on every entry, so the discrimination
 * the router does survives the cast.
 */
interface ErasedEntry {
  readonly drive: "awaited-once" | "stream-driven";
  readonly type: RequestType<unknown, unknown, EntryErrorPayload>;
  /**
   * WIDER THAN THE ENTRY'S OWN FOR THE SAME REASON `type` IS: this is the
   * erasure, and the per-method payload is checked where the entry is WRITTEN.
   */
  readonly progress: ProgressType<unknown>;
  readonly capability: CapabilityContributor;
}

/** A handler awaited once, with the method's own params and result erased. */
type ErasedAwaitedOnceHandler = (context: RequestContext, params: unknown) => Promise<unknown>;

/** A handler driven a batch at a time, with the method's own types erased. */
type ErasedStreamHandler = (
  context: RequestContext,
  params: unknown,
) => AsyncGenerator<unknown[], void, void>;

/**
 * The table as a list, in DECLARATION ORDER -- which holds because these are
 * ordinary string keys, and which NOTHING DEPENDS ON: the one shared capability
 * key is merged into rather than assigned over, so the order is a fact about
 * `Object.entries` and not a requirement anything here rests on.
 */
function erasedEntries(): readonly (readonly [Method, ErasedEntry])[] {
  return Object.entries(requestEntries) as unknown as readonly (readonly [Method, ErasedEntry])[];
}

/**
 * Claims each capability the config can actually answer for.
 *
 * THE POLICY IS THE STAKEHOLDER'S: a client is entitled to send whatever it was
 * told about, so a capability is claimed ONLY where the config can answer it.
 */
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
 * WHAT THE CLIENT SAID ABOUT ITS ROOTS, as of NOW: the folder list, which moves
 * mid-session, beside the two deprecated fields, which do not.
 *
 * A function rather than a value because registration happens before
 * `initialize` does: none of the three exists yet when the handlers below are
 * wired, and a value captured here would be the pre-initialize one forever --
 * the same ordering trap src/cli.ts records for the config factory, one layer
 * in.
 *
 * TYPED AS THE SLICE OF `RequestContext` IT BECOMES, so that a field added to
 * this thunk and forgotten at the context, or the reverse, does not compile.
 *
 * NAMED FOR THE REQUEST RATHER THAN THE CLIENT, because a reader meeting
 * `roots` would otherwise expect the two deprecated fields alone: this slice is
 * the whole thing a request reads, folder list included.
 */
export type RequestRoots = () => Pick<RequestContext, "workspaceFolders" | "rootUri" | "rootPath">;

/**
 * Reports a config handler's failure and rethrows it.
 *
 * vscode-jsonrpc answers the client -32603 for a throwing REQUEST handler, so
 * the client knows the request failed -- but it consults the connection's
 * logger for NOTIFICATION handlers only, leaving stderr empty and the config
 * author debugging a handler they cannot see fail. Hence tsudoi's own line.
 *
 * The rethrow is the load-bearing half. Absorbing the failure here would answer
 * the client null or [], which reads as `nothing to say` and hides a broken
 * handler behind a plausible answer -- and on the streaming path it would do so
 * after the client had already been sent partial results.
 *
 * Only the REPORTING is shared. THE CALLS STAY SEPARATE, at `driveAwaitedOnce`
 * and `driveStream`, with a method picking one of them BY NAME: a hover handler
 * is awaited once and a completion handler is driven a chunk at a time, and
 * there is no shape both fit into that is not an invention.
 */
function reportHandlerFailure(method: Method, error: unknown): never {
  process.stderr.write(`tsudoi: ${method} handler failed: ${failureDetail(error)}\n`);
  throw error;
}

/**
 * Reports a config handler's CLEANUP failure -- and stops there.
 *
 * Shares the `tsudoi:` convention above, because one prefix is what makes the
 * LSP log greppable, and deliberately NOT its rethrow. The asymmetry is the
 * point: a handler failure still has a response to decide, so absorbing it
 * would answer the client a plausible `nothing to say`, whereas cleanup fails
 * only after the client already holds its -32800 and there is no response left
 * to correct. Rethrowing could only take down a session otherwise able to
 * answer the next completion -- and on the floating call this is attached to it
 * would do that by way of an unhandled rejection, which kills the process.
 *
 * SCOPE, stated here because this is the file where the opposite would be
 * assumed: cleanup runs for CLIENT CANCELLATION only. tsudoi does not wire
 * shutdown to cancellation, so an in-flight completion finishes across
 * shutdown. That is correct by specification -- LSP constrains the client, not
 * the server -- and it is left unpinned on purpose, since cancelling in-flight
 * requests at shutdown would be equally acceptable and a test would pin an
 * arbitrary choice rather than a requirement.
 */
function reportCleanupFailure(method: Method, error: unknown): void {
  process.stderr.write(`tsudoi: ${method} cleanup failed: ${failureDetail(error)}\n`);
}

/**
 * What a config author is shown of a failure: the stack when there is one,
 * since that is what locates the line in THEIR file, and the value itself when
 * something other than an Error was thrown. Shared so the two reports above
 * cannot drift into saying different amounts about the same kind of failure.
 */
function failureDetail(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

/**
 * How a cancelled request is answered, whatever its handler produced and
 * whatever drive its method uses. UNQUALIFIED: every request that reaches a
 * drive reaches `answerUnlessCancelled`, so there is no path to a cancelled
 * answer that goes around this one.
 *
 * LSP 3.17 permits answering normally instead, so this is a CHOICE: the client
 * has already discarded the request's context, and a stale result invites the
 * desync that partial results are careful to avoid.
 *
 * Thrown rather than returned because vscode-jsonrpc replies a thrown
 * ResponseError verbatim -- which keeps every handler's return type the config
 * author's own, with no error shape mixed into it.
 */
function requestCancelled(): never {
  throw new ResponseError(LSPErrorCodes.RequestCancelled, "Request cancelled");
}

/**
 * Bridges the connection's CancellationToken onto the AbortSignal a config
 * author already has, ONE controller per request: a shared one would abort
 * every handler in flight when the client cancelled any single request.
 *
 * tsudoi bridges rather than tracking `$/cancelRequest` itself. It could not
 * track it if it wanted to -- vscode-jsonrpc consumes that notification before
 * consulting any handler, and a request handler is never told its own id.
 */
function requestContext(
  tsudoi: Tsudoi,
  cancellation: CancellationToken,
  roots: Pick<RequestContext, "workspaceFolders" | "rootUri" | "rootPath">,
): RequestContext {
  const controller = new AbortController();
  // Read BEFORE subscribing, and not merely to save a turn: when the client
  // cancels before the request is dispatched, vscode-jsonrpc cancels the token
  // source ahead of the handler, which installs CancellationToken.Cancelled --
  // whose onCancellationRequested is Event.None and never fires at all. The
  // flag is the only evidence of that cancellation.
  if (cancellation.isCancellationRequested) {
    controller.abort();
  }
  cancellation.onCancellationRequested(() => controller.abort());
  // SPREAD, so the three roots reach the context by ONE statement: a field added
  // to the slice above and forgotten here would not compile.
  return { signal: controller.signal, tsudoi, ...roots };
}

/**
 * Runs one config handler to the answer the client receives, under that
 * request's cancellation.
 *
 * Everything cancellation changes about a request is here and nowhere else: a
 * cancelled request answers -32800 whatever its handler produced, and a
 * cancelled handler's failure is not reported, because being aborted is why it
 * failed. The abort is re-read AFTER the handler settles, so a handler that
 * never looks at its signal is suppressed exactly like one that does.
 *
 * WHAT WOULD FALSIFY THAT, written here because that is the edit: any drive
 * answering a request before it reaches this function -- a stream drive that
 * returned early for a config with no handler would answer such a request `null`
 * where the awaited-once drive answers -32800. LSP permits either, so nothing is
 * breached; what would go is the claim above, and THAT CLAIM IS THE ASSET. Both
 * drives build the request context whether or not a handler exists, and both
 * answer through here, which is the property test/methods-table.test.ts pins for
 * EVERY entry in the table with no handler configured.
 *
 * Only the ANSWER is shared. The CALLS stay separate: a hover handler is
 * awaited once and a completion handler is driven a chunk at a time, and
 * `produce` is where that difference lives -- supplied by one of the two named
 * drives rather than by a handler written out per method.
 */
async function answerUnlessCancelled<T>(
  method: Method,
  signal: AbortSignal,
  produce: () => Promise<T>,
): Promise<T> {
  let value: T;
  try {
    value = await produce();
  } catch (error) {
    // A cancelled handler is EXPECTED to fail: an aborted fetch rejects by
    // design. A failure line plus a stack for every cancellation would train
    // the config author to ignore the one stderr channel that means something.
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
 * Whether a value is a ProgressToken: LSP defines the type as `integer |
 * string`, so `0` and `""` are both legitimate AND falsy. That is why this is a
 * type test rather than a truthiness test -- `if (!token)` would fix the null
 * case and break every client that numbers its tokens from zero.
 */
function isProgressToken(value: unknown): value is ProgressToken {
  return typeof value === "string" || (typeof value === "number" && Number.isInteger(value));
}

/**
 * The token this completion may stream under, or undefined when it must be
 * aggregated into one response instead.
 *
 * NORMALISE AND REPORT, chosen on harm-proportionality. Answering -32602 would
 * cost an editor user every completion for their client's serialisation quirk;
 * normalising in silence is the invisible-client-bug failure mode. Streaming
 * under the invalid token is worse than either: null survives sendProgress, so
 * the items leave addressed to a `$/progress` no client can correlate and the
 * user simply sees fewer candidates than the handler produced.
 *
 * Validation lives here and nowhere else. One call site, no seam: the story is
 * protocol-violation handling, the implementation is one concrete case. HOW
 * OFTEN the refusal is reported is the caller's business, not this function's.
 */
function streamingToken(
  requested: unknown,
  report: (requested: unknown) => void,
): ProgressToken | undefined {
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
 * Registers the request handlers a config can answer.
 *
 * Every one is registered whether or not the config supplies a handler:
 * registration and advertisement are independent questions, and a client that
 * sends a request it was never told about is answered emptily rather than
 * MethodNotFound -- a server must not fail because a client misbehaves.
 *
 * TAKES THE NARROWED CONNECTION, and that is not merely what the caller happens
 * to hold: this module registers REQUESTS, so an `onNotification` on its
 * parameter would be a second door out of the router in the one other file that
 * is handed the connection at all. `onRequest` and `sendProgress` are all it
 * uses, and both survive the narrowing.
 */
export function registerMethods(
  connection: RequestOnlyConnection,
  config: TsudoiConfig,
  tsudoi: Tsudoi,
  requestRejection: RequestRejection,
  clientRoots: RequestRoots,
): void {
  /**
   * Whether this SESSION has already been told about an invalid token. One
   * process serves one client, so the flag's lifetime is the session's.
   */
  let invalidTokenReported = false;

  /**
   * Names a refused token on stderr ONCE. A client whose serialisation
   * produces a bad token produces it on every keystroke, and a line per
   * completion buries everything else in the LSP log -- the one channel a
   * config author has for a handler that failed. Once is diagnosable; a
   * thousand times is noise that makes the log useless for anything else.
   */
  function reportInvalidToken(requested: unknown): void {
    if (invalidTokenReported === true) {
      return;
    }
    invalidTokenReported = true;
    // JSON.stringify, not String(): a token is client data of any shape, and
    // `[object Object]` would name nothing the config author could act on.
    process.stderr.write(
      `tsudoi: ignoring an invalid partialResultToken ${JSON.stringify(requested)}; ` +
        `a ProgressToken is an integer or a string, so this completion is answered ` +
        `as one aggregated response.\n`,
    );
  }

  for (const [method, entry] of erasedEntries()) {
    connection.onRequest(
      entry.type,
      async (params: unknown, cancellation: CancellationToken): Promise<unknown> => {
        // THE PROLOGUE, AND IT IS THE WHOLE REASON THE ROUTER EXISTS. A refused
        // request is answered before anything else happens, because a server
        // outside its serving window has no client state to answer FROM. Running
        // it once here is what stops it being a per-method convention a new
        // method joins only if whoever writes it remembers.
        const rejection = requestRejection();
        if (rejection !== undefined) {
          throw rejection;
        }
        // THE PROLOGUE'S SECOND STEP, AND IT MAKES `MethodMap[M]["params"]`
        // TRUE. Every method in the table declares an OBJECT there, so a
        // handler is entitled to read a member off what it is handed -- and
        // only this line entitles it, because nothing between the wire and here
        // inspects the value.
        //
        // `"params": null` IS THE WHOLE OF WHAT ARRIVES MALFORMED, measured
        // rather than defended against in general: vscode-jsonrpc answers
        // -32602 itself when params are OMITTED and when they arrive BY
        // POSITION, so those two shapes never reach this line. `null` and a
        // primitive are what it lets through -- a member read off `null` throws
        // a TypeError, which vscode-jsonrpc turns into -32603, telling a client
        // its own malformed request was OUR internal error.
        //
        // -32602 IS THE SAME CODE THE LIBRARY ANSWERS the two shapes it does
        // catch, which is the point: one wrong-params answer rather than one
        // per shape, and a client that reads it learns the request was theirs
        // to fix.
        //
        // THROWN IN THE ROUTER RATHER THAN IN A DRIVE, so a method added to the
        // table joins this the moment it is declared, and NOT LEFT TO A
        // PER-METHOD GUARD for the reason the whole prologue exists.
        //
        // NOT REPORTED ON STDERR: the client is told, in the response, and the
        // one stderr channel a config author has means THEIR handler failed.
        if (typeof params !== "object" || params === null) {
          throw new ResponseError(
            ErrorCodes.InvalidParams,
            `${method} params must be an object; received ${JSON.stringify(params)}`,
          );
        }
        const handler = config.methods?.[method];
        // THE DRIVE, AND THE NO-HANDLER CASE COMES WITH IT RATHER THAN BEING A
        // SECOND AXIS. The awaited-once drive calls `handler?.(...) ?? null`,
        // while the stream drive answers with a return of its own, because no
        // single expression both drives a generator and answers for a missing
        // one. They are NOT independent: each drive has exactly one of them, so
        // choosing the drive chooses it, and nothing third is invented.
        //
        // WHAT IS NOT A DIFFERENCE BETWEEN THEM is WHERE that answer is
        // produced. Both drives build the request context whether or not a
        // handler exists and answer through `answerUnlessCancelled`, so a
        // cancelled request is -32800 either way.
        if (entry.drive === "stream-driven") {
          return driveStream({
            method,
            handler: handler as ErasedStreamHandler | undefined,
            params,
            cancellation,
            entry,
            connection,
            tsudoi,
            clientRoots,
            reportInvalidToken,
          });
        }
        return driveAwaitedOnce({
          method,
          handler: handler as ErasedAwaitedOnceHandler | undefined,
          params,
          cancellation,
          tsudoi,
          clientRoots,
        });
      },
    );
  }
}

/**
 * The AWAITED-ONCE drive: call the handler once, answer what it produced.
 *
 * `?? null` answers the NO-HANDLER case in the same expression that answers the
 * handler's own null. That is hover's original shape, kept because it is the one
 * this drive needs: there is nothing to drive, so nothing has to know whether a
 * handler exists before the call is written.
 *
 * THE CONTEXT IS BUILT EITHER WAY, exactly as on the other drive: the epilogue
 * reads the abort off the context, so a drive that skipped building one for a
 * request it answers `null` would be deciding that request's cancellation
 * itself.
 */
async function driveAwaitedOnce(run: {
  method: Method;
  handler: ErasedAwaitedOnceHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  tsudoi: Tsudoi;
  clientRoots: RequestRoots;
}): Promise<unknown> {
  const context = requestContext(run.tsudoi, run.cancellation, run.clientRoots());
  return answerUnlessCancelled(run.method, context.signal, async () => {
    return (await run.handler?.(context, run.params)) ?? null;
  });
}

/**
 * The STREAM-DRIVEN drive, and it is the whole of the streaming API. A config
 * author yields BATCHES OF ITEMS and says nothing at all about how they travel;
 * whether they leave as `$/progress` or as one aggregated response is decided
 * here, from the one thing the protocol actually offers -- the presence of
 * `partialResultToken`. There is no client capability declaring partial-result
 * support, so a client that cannot take partial results simply omits the token,
 * and the two triggers the brief describes are one trigger.
 *
 * THE TOKEN DECIDES AND NOTHING ELSE DOES, INCLUDING THE STREAM ITSELF. There is
 * no look-ahead here and no arm for a stream that happened to yield once: under
 * a token that stream spends one `$/progress` and a `null` response, knowingly.
 * WHAT A LOOK-AHEAD WOULD COST IS WHY IT IS ABSENT -- to know a stream yielded
 * exactly once you must pull TWICE, so the first batch would wait on the second
 * pull, which delays delivery exactly when the first chunk is slow and streaming
 * matters most. THE EDIT THAT WOULD RE-INTRODUCE IT IS MADE HERE, which is why
 * the reason is here.
 *
 * `null` FOR A STREAM THAT YIELDED NOTHING IS THE ONE THING THE TOKEN DOES NOT
 * DECIDE, and it decides a VALUE rather than a channel. `[]` is not available to
 * mean it: the specification treats a supplied `CompletionItem[]` as
 * `{ isIncomplete: false, items }`, so `[]` says THERE ARE NO CANDIDATES where
 * `null` says THIS SERVER HAS NO ANSWER FOR THAT POSITION. Only request-local
 * state tells the two apart, which is what `yielded` below is for.
 *
 * A RETURN OF ITS OWN IS THIS DRIVE'S NO-HANDLER SHAPE and not an oversight
 * beside the `?? null` above: nothing here both drives a stream and answers
 * for a missing one, so the two cases are two statements. WHAT THEY ARE NOT is
 * two answers about cancellation -- that return goes through
 * `answerUnlessCancelled` like every other answer this file produces.
 *
 * WHAT THIS DRIVE REQUIRES OF A METHOD THAT PICKS IT: its params must carry a
 * `partialResultToken`, and what it yields must be ARRAYS, since aggregating
 * concatenates them. Both requirements are about the ONE payload shape this
 * drive handles, and the second is the one that excludes
 * `textDocument/diagnostic`: `DocumentDiagnosticParams` DOES declare
 * `PartialResultParams`, but `DocumentDiagnosticRequest.partialResult` is
 * `ProgressType<DocumentDiagnosticReportProgress>`, a union of two OBJECT types
 * and not an array.
 *
 * THE PROTOCOL'S OWN COMMENT SAYS WHY, and it is the half a type check would
 * miss: those chunks carry RELATED DOCUMENTS rather than more diagnostics for
 * the requested one, where completion's chunks are more items of a single list.
 * `textDocument/diagnostic` is served awaited-once.
 */
async function driveStream(run: {
  method: Method;
  handler: ErasedStreamHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  entry: ErasedEntry;
  connection: RequestOnlyConnection;
  tsudoi: Tsudoi;
  clientRoots: RequestRoots;
  reportInvalidToken: (requested: unknown) => void;
}): Promise<unknown> {
  const handler = run.handler;
  const context = requestContext(run.tsudoi, run.cancellation, run.clientRoots());
  if (handler === undefined) {
    // THIS DRIVE'S NO-HANDLER ANSWER, AND IT GOES THROUGH THE EPILOGUE LIKE
    // EVERY OTHER ANSWER THIS FILE PRODUCES. Nothing pulls a generator or reads
    // a token, but the `null` is produced INSIDE `answerUnlessCancelled` rather
    // than ahead of it, so a CANCELLED request with no handler is answered
    // -32800 here exactly as it is on the awaited-once drive.
    //
    // WHY THE CONTEXT IS BUILT FOR A REQUEST NOTHING WILL ANSWER: the epilogue
    // reads the abort off it. That is the same trade the awaited-once drive
    // makes -- one AbortController and one subscription for a request that
    // answers `null` -- and it is what makes the cancellation decision one
    // decision rather than one per drive.
    return answerUnlessCancelled(run.method, context.signal, () => Promise.resolve(null));
  }
  // BELOW THE NO-HANDLER RETURN, AND THAT SIDE OF THE POSITION IS DELIBERATE: a
  // config that cannot answer completion at all has no business reporting the
  // client's token on stderr -- that line exists to tell a config author their
  // items were aggregated rather than streamed, and here there are no items.
  //
  // THE READ ITSELF CANNOT THROW, and that is the router's doing rather than
  // this line's: the prologue refuses params that are not an object with
  // -32602, so `params` is one by the time any drive runs. Whether the read
  // sits inside `answerUnlessCancelled` or above it therefore decides nothing
  // any more.
  //
  // Read through `unknown` on purpose: the declared ProgressToken type
  // describes what a CONFORMING client sends, and this path exists for the
  // one that does not.
  const requestedToken: unknown = (run.params as PartialResultParams).partialResultToken;
  const token = streamingToken(requestedToken, run.reportInvalidToken);
  const progress = run.entry.progress;
  return answerUnlessCancelled(run.method, context.signal, async () => {
    // What the author yielded, kept only when there is no token to stream it
    // under. In streaming mode this stays empty, which is what lets one
    // expression below answer for both modes.
    const collected: unknown[] = [];
    // WHETHER THIS REQUEST PRODUCED ANYTHING AT ALL, and the ONE piece of
    // request-local state this drive keeps. `[]` and `null` are different
    // answers -- `no candidates` versus `no answer` -- and nothing but this
    // tells them apart once the loop has ended.
    //
    // DEFENDED AT EXACTLY ONE SITE, and said here because this is where the
    // deleting edit would be made. Dropping this flag -- `token === undefined ?
    // collected : null` -- reddens `the example config is driven end to end ...`
    // in test/completion.test.ts, at its assertion that a position the example
    // has nothing for is answered null, AND NOTHING ELSE in the suite. That
    // assertion is DESCRIBED rather than quoted, and must stay that way: this
    // project measures `none weakened` by grepping source lines that open an
    // assertion call, and a comment quoting one inflates that count. WHY ONE
    // SITE IS ALL THERE IS: under a token the response is `null` whatever this
    // flag says, so the zero-yield fixture cannot see it; and the helpers that
    // read completions elsewhere spell `result ?? []`, which erases the very
    // distinction. NOT A GAP TO CLOSE BY ADDING A TEST FOR ITS OWN SAKE, but a
    // reader deleting this flag should know a single assertion stands between
    // them and telling every user there are no candidates.
    let yielded = false;
    const batches = handler(context, run.params);
    // CLOSING THE GENERATOR IS WHAT RUNS THE CONFIG AUTHOR'S `finally`, and it
    // is a local rather than an inline call because the loop below has SEVERAL
    // ways out and all but one of them owe it. It is fired from the `finally`
    // around that loop, so this is the one statement of how, and the branches
    // are statements of when.
    //
    // FIRED, NEVER AWAITED, and the rejection handler is not optional.
    // Measured on both runtimes: a `finally` that never settles leaves this
    // promise pending forever, so awaiting it would mean the answer the client
    // is waiting for is never sent at all -- and a `finally` that throws
    // rejects it, which unhandled kills the process. That one handler does both
    // jobs: it is how a throwing cleanup gets reported, and it is what stops
    // the same rejection being fatal. Drop it and both halves fail together.
    //
    // What no arrangement of this can do: a generator parked inside its own
    // `await` queues return() behind the pending next(), so its cleanup runs
    // only when that settles. A limit of async generators, not a defect here.
    //
    // THE ITERATOR RESULT IS DISCARDED ON PURPOSE, and this is the one record
    // of why. When the author's `finally` itself yields, the `return()` below
    // resolves `{ value, done: false }` on both runtimes -- the return
    // completion is suspended by that yield. CONSEQUENCE: the generator stays
    // parked INSIDE its own finally and every statement after that yield -- the
    // rest of their cleanup -- never runs, silently, on every superseded
    // keystroke. `done === false` right here is the evidence tsudoi could
    // report.
    //
    // NOT HANDLED, and NOT because it is invisible: it is LANGUAGE SEMANTICS
    // rather than tsudoi doing something wrong. `for await (...) { break }` over
    // the same generator leaves it in exactly this state. tsudoi calls
    // .return() correctly; the author's own cleanup defers itself, so reporting
    // it would be reporting JavaScript.
    //
    // NO NARROWING AND NO GUARD, AND THAT IS A RULING RATHER THAN AN OVERSIGHT.
    // THE PUBLISHED TYPE IS AN `AsyncGenerator`, which REQUIRES `return`, so
    // narrowing to `AsyncIterator` -- whose `return` is OPTIONAL -- would widen
    // a guarantee away by hand and then guard against the absence it had just
    // manufactured. This repository prefers FORECLOSING a failure to DETECTING
    // one, and the type forecloses this one.
    const close = (): void => {
      batches.return().then(undefined, (error: unknown) => {
        reportCleanupFailure(run.method, error);
      });
    };
    // WHETHER THE GENERATOR ENDED ON ITS OWN, and the only thing the `finally`
    // below reads. `.return()` on a COMPLETED generator is a no-op that runs no
    // cleanup, so this skip is an OPTIMISATION AND NOT A REQUIREMENT: an edit
    // that dropped the flag and closed unconditionally would be correct, merely
    // wasteful. Nothing may come to depend on the skip.
    let completed = false;
    // A `finally` AROUND THE WHOLE LOOP, because ABORT IS NOT THE ONLY WAY OUT
    // OF IT and until Sprint 46 the close was reachable from that branch alone.
    // The other exits are EXCEPTIONS THROWN WHILE THE GENERATOR IS SUSPENDED AT
    // ITS YIELD: `collected.push(...next.value)` raises a TypeError when a batch
    // is not iterable -- NOTHING VALIDATES THAT ANYWHERE, since config.ts checks
    // only the resolve/completion pair and both runtimes strip types without
    // checking them -- and `sendProgress` rejects once the connection is Closed,
    // which is what an editor dying mid-stream looks like from here. Both
    // propagate out of this closure, and with no `finally` the generator was
    // never touched again: the author's cleanup NEVER RAN.
    //
    // THE EDITOR-DEATH ARM IS THE ONE THAT COSTS. A handler holding a child
    // process or a lock file loses exactly the release that mattered, and THE
    // SAME UNRELEASED HANDLE KEEPS THE EVENT LOOP ALIVE -- which is the orphaned
    // server src/server.ts treats as a correctness requirement rather than an
    // untidiness.
    //
    // A `finally` AND NOT A `catch`: this drive has nothing to say about the
    // exception, which belongs to answerUnlessCancelled's own reporting one
    // level up. Catching here would either swallow a handler failure or oblige
    // this code to rethrow it in the right shape.
    try {
      for (;;) {
        const next = await batches.next();
        if (next.done === true) {
          // THE RETURN CARRIES NOTHING AND IS NOT READ. `next.value` is `void`
          // here by the published type, so a handler has no second entrance for
          // content and this drive has no second thing to interpret.
          completed = true;
          return yielded && token === undefined ? collected : null;
        }
        // Checked HERE, between pulling a batch and sending it: the abort
        // typically lands while `next()` is parked, so a check at the top of
        // the loop would already have passed and this batch would go out to
        // a client that has stopped listening. Returning also stops driving
        // the generator, which is the point of cancelling at all. The value
        // is discarded either way -- the answer is already -32800.
        //
        // AND IT COVERS THE FIRST BATCH TOO, which is not incidental:
        // vscode-jsonrpc calls the handler even for a request cancelled BEFORE
        // dispatch, so a first batch sent without passing this check goes out to
        // a client that never wanted it. The first batch is an ordinary
        // iteration of this loop, and `a completion cancelled before it is
        // dispatched ... streams nothing` in test/cancellation.test.ts is what
        // watches it.
        if (context.signal.aborted) {
          // Returning stops DRIVING the generator; the `finally` below is what
          // closes it, and closing it is what runs the config author's
          // `finally`. Without that close the generator is left suspended at its
          // yield forever, and cleanup nobody can watch succeed is silently
          // skipped on every superseded keystroke.
          //
          // NOTHING IS CLOSED ON THIS LINE ANY MORE, and the reason is that this
          // branch turned out not to be the only exit that owed a close -- see
          // the `try` above. A close fired here AND from the `finally` would
          // report one throwing cleanup twice.
          //
          // The close stays above the mode split, where this check already is:
          // whether the request streamed or aggregated says what the CLIENT can
          // take and nothing about what the HANDLER holds open.
          return null;
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
