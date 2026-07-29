import process from "node:process";
import {
  type CancellationToken,
  type CompletionItem,
  CompletionRequest,
  CompletionResolveRequest,
  DocumentDiagnosticRequest,
  DocumentFormattingRequest,
  HoverRequest,
  LSPErrorCodes,
  type PartialResultParams,
  type ProgressToken,
  ProgressType,
  type RequestType,
  ResponseError,
  type ServerCapabilities,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol/node";
import type { RequestOnlyConnection } from "./notifications.ts";
import type { Method, MethodMap, RequestContext, Tsudoi, TsudoiConfig } from "./types.ts";

/**
 * How a config author's handler is RUN to the answer the client receives.
 *
 * TWO KINDS, NAMED, AND THE CHOICE IS NOT FREE: it is DERIVED from what
 * `MethodMap` says the handler returns, so a method declared with the wrong
 * drive does not compile. MEASURED at vscode-languageserver-protocol 3.18.2 --
 * writing `generator-driven` on hover's entry fails TS2322 naming the two
 * strings.
 *
 * THIS IS WHERE THE RECORDED DECISION AGAINST A TABLE IS HONOURED RATHER THAN
 * OVERTURNED, and the distinction matters enough to state at the type itself.
 * What stood at `reportHandlerFailure` was `there is no shape both fit into
 * that is not an invention`, and IT IS STILL TRUE AND STILL LOAD-BEARING. No
 * single shape is invented here. A method picks ONE OF TWO, each with its own
 * body below, and the router applies only the prologue and epilogue they
 * genuinely share. What changed is that the difference now has a NAME and one
 * home, instead of being open-coded once per method and legible only by
 * reading two handlers side by side.
 *
 * MEASURED that two kinds cover all five of the stakeholder's methods. THE
 * HEADLINE HELD AND THE REASON GIVEN FOR ONE METHOD DID NOT, corrected here
 * because it was labelled MEASURED and was an inference: this block said
 * `textDocument/diagnostic` declares `partialResult`, SO it is generator-shaped
 * like completion. DECLARING `partialResult` IS NECESSARY AND NOT SUFFICIENT --
 * see `driveGenerator`, which states both of that drive's requirements and which
 * this method fails on the second. `textDocument/diagnostic` is AWAITED ONCE.
 *
 * BOTH REMAINING METHODS MEASURED AT SPRINT 33 rather than one measured and one
 * carried over, protocol 3.18.2: `CompletionResolveRequest` (protocol.d.ts:2301)
 * declares NO `partialResult` member at all and its `type` is
 * `ProtocolRequestType<CompletionItem, CompletionItem, never, void, void>` --
 * `never` in the progress position -- so it is awaited once, and it needs
 * nothing of the error position either.
 */
type DriveKind<M extends Method> =
  MethodMap[M]["result"] extends AsyncGenerator<unknown, unknown, unknown>
    ? "generator-driven"
    : "awaited-once";

/**
 * What one method adds to `ServerCapabilities` when the config can answer it.
 *
 * A FUNCTION, NOT A KEY AND A VALUE, and that is a requirement rather than a
 * taste. No mechanical `methods[k] !== undefined -> capabilities[flag] = true`
 * expresses what these five have to say: `completionProvider` is an OBJECT, and
 * `completionItem/resolve` contributes `completionProvider.resolveProvider` --
 * A KEY INSIDE ANOTHER METHOD'S. A function is immune to the next shape
 * arriving; a key/value pair has to be widened for each one.
 *
 * AND `immune to the next shape arriving` STOPPED BEING A PREDICTION THIS
 * SPRINT. `diagnosticProvider`'s value shape had been flagged UNMEASURED twice
 * on PBI-37, with the PO noting that even a corrected count might not survive
 * contact with it. IT DOES NOT. MEASURED at vscode-languageserver-protocol
 * 3.18.2, ServerCapabilities line 1106: `diagnosticProvider?: DiagnosticOptions
 * | DiagnosticRegistrationOptions`, and `DiagnosticOptions` (protocol.diagnostic
 * .d.ts:50-67) carries TWO REQUIRED MEMBERS -- `interFileDependencies: boolean`
 * and `workspaceDiagnostics: boolean` -- beside an optional `identifier`.
 *
 * SO IT IS A FOURTH VALUE SHAPE, and the sharpest one: `true` would not
 * type-check and neither would `{}`. A flag mechanism could not express it, and
 * NEITHER COULD COPYING COMPLETION'S. That is measurement arriving where the
 * criterion predicted it would, which is why the PO ruled the count REMOVED
 * rather than corrected -- an enumeration would have been wrong again here.
 *
 * IT MUTATES, AND IT IS NO LONGER ORDER-DEPENDENT. That WAS the price of
 * reaching inside another method's key -- A CONTRIBUTOR THAT WRITES INTO A KEY
 * ANOTHER METHOD OWNS MUST RUN AFTER THAT METHOD'S -- and for two methods it
 * was held by nothing but the order two entries happened to be declared in.
 * SINCE SPRINT 38 THE ONE KEY TWO METHODS SHARE IS MERGED INTO RATHER THAN
 * ASSIGNED OVER, so what another contributor already wrote survives and the
 * order they run in decides nothing.
 *
 * THE TABLE IS STILL ITERATED IN DECLARATION ORDER -- string keys on an object
 * literal preserve it -- AND NOTHING DEPENDS ON THAT ANY MORE.
 * `completionItem/resolve` is still declared below `textDocument/completion`,
 * which is now a reading convenience and not a requirement.
 *
 * MEASURED AT SPRINT 38 RATHER THAN ARGUED, over ALL 32 configs the five
 * methods can form and ALL 120 ORDERS their contributors can run in: the
 * capabilities emitted are IDENTICAL to what the assignment emitted, for every
 * config, and no config's result differs across orders. NEGATIVE CONTROL, taken
 * before the merge existed: 8 of those 32 -- exactly the ones supplying BOTH
 * handlers -- disagreed across orders.
 *
 * WHAT WAS REMOVED IS A HAZARD AND NOT A CHECK, which is why no assertion
 * replaced it. The property is still watched where it was: a config supplying
 * BOTH handlers is asserted in test/resolve.test.ts to advertise
 * `completionProvider: { resolveProvider: true }` by exact equality, and that
 * assertion is UNCHANGED. What changed is that declaring the two entries the
 * other way round now reddens NOTHING -- measured at Sprint 38, whole suite
 * green, the same number of tests running -- because there is nothing left for
 * that edit to break.
 *
 * AND THE MEASUREMENT THIS BLOCK CARRIED HAD GONE STALE BEFORE IT WAS REMOVED,
 * written down because the stale number is the part that would have been
 * quietly inherited: it said the swap reddens ALONE, which was true when Sprint
 * 34 measured it and FALSE ONCE SPRINT 37 GAVE THE DEMO CONFIG A RESOLVE
 * HANDLER. Re-measured on the way past with the assignment restored: FOUR tests
 * on both runtimes -- the resolve capability assertion AND the demo config's
 * pinned capabilities in test/lifecycle.test.ts.
 *
 * SO THERE IS STILL NO INDEX COMPARISON ANYWHERE, and the ground is stronger
 * than when it was a refusal: a test asserting resolve's entry sits after
 * completion's would restate a mechanism that now protects nothing.
 *
 * WHAT IS NOT DEFENDED, NAMED RATHER THAN LEFT TO BE FOUND: nothing stops a
 * FUTURE contributor from assigning over a key another method owns. The merge
 * is a property of the two lines that write `completionProvider` and not of
 * this type, and no test can see the difference while `textDocument/completion`
 * contributes no key of its own -- MEASURED at Sprint 38, restoring the
 * assignment with the entries in their declared order leaves the whole suite
 * green. THE COST OF CLOSING IT is the check refused above, and it is refused
 * on the same ground twice over.
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
 * IT WAS `void` UNTIL SPRINT 33 AND THAT WAS NOT A CHOICE, it was three methods
 * that happened to agree. MEASURED at vscode-languageserver-protocol 3.18.2:
 * hover, completion and formatting each declare `void` there, and
 * `DocumentDiagnosticRequest` declares `DiagnosticServerCancellationData` -- so
 * pinning `void` REFUSED THE REAL REQUEST TYPE with TS2322, `Type
 * 'DiagnosticServerCancellationData' is not assignable to type 'void'`, at
 * position 2 of `RequestType`'s phantom tuple.
 *
 * TSUDOI STILL NAMES NO METHOD-SPECIFIC ERROR TYPE, which is the criterion this
 * has to be read against: `MethodMap` gains nothing, no handler's return type
 * mixes an error shape in, and `retriggerRequest` remains foreclosed -- it is a
 * server telling a client its analysis is TRANSIENTLY unavailable, and that
 * needs a config author who can know that. None has asked to be.
 *
 * BOOKED AS A DEBIT, THE TABLE'S SECOND, so the ledger carries costs and not
 * only gains: after this an entry may name a request type whose error payload
 * disagrees with every other entry's and NOTHING OBJECTS. Nothing exercises that
 * today and nothing checks it.
 *
 * WHAT MADE THE WIDENING SAFE TO MAKE WAS A PROBE RUN BEFORE THE METHOD LANDED,
 * because a widening found unworkable after the rest is a rethink wearing a
 * patch: `connection.onRequest` still accepts the erased type, `tsc --noEmit`
 * exit 0. THE PROBE AND ITS CONTROL WERE THROWAWAY AND ARE NOT KEPT, said
 * plainly because that means they cannot be re-run from the tree -- the control
 * substituted `ProgressType<unknown>` for `ErasedEntry`'s `type` and failed
 * TS2769 `No overload matches this call` AT THE `connection.onRequest(` LINE,
 * which is what shows the call site is checked at all.
 */
type EntryErrorPayload = unknown;

/**
 * The chunk a generator-driven method streams, read off `MethodMap` rather than
 * fixed here: the drive is shared, so the payload type may not be one method's.
 */
type GeneratorChunk<M extends Method> =
  MethodMap[M]["result"] extends AsyncGenerator<infer C, unknown, unknown> ? C : never;

/**
 * A method whose handler is AWAITED ONCE.
 *
 * ITS `type` IS FULLY DISCRIMINATING, and this is measured rather than assumed
 * because it is the property the whole table rests on: the result is pinned to
 * `MethodMap`'s own, so `CompletionRequest.type` written into hover's slot
 * fails TS2322. MEASURED at protocol 3.18.2, with the correct pairings
 * compiling as the control.
 */
interface AwaitedOnceEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<
    MethodMap[M]["params"],
    Awaited<MethodMap[M]["result"]>,
    EntryErrorPayload
  >;
  readonly capability: CapabilityContributor;
}

/**
 * A method whose handler is DRIVEN A CHUNK AT A TIME.
 *
 * ITS `type` LEAVES THE RESULT OPEN, AND THAT IS A MEASURED WEAKNESS RATHER
 * THAN A SHRUG -- stated here because the natural reading of the entry above is
 * that both are equally safe, and they are not. The protocol declares
 * `CompletionRequest`'s result as `CompletionItem[] | CompletionList | null`,
 * WIDER than the `CompletionItem[] | null` a tsudoi generator returns, so
 * pinning the result to `MethodMap`'s own REFUSES THE REAL REQUEST TYPE
 * (measured: TS2322). With the result open, a request type whose params are
 * assignable to this one's is accepted -- and `HoverParams` IS assignable to
 * `CompletionParams`, since they differ only in OPTIONAL members, so
 * `HoverRequest.type` in completion's slot COMPILES. Both directions measured
 * at protocol 3.18.2.
 *
 * WHAT CLOSES IT IS A TEST RATHER THAN THE COMPILER: every entry's key is
 * asserted equal to its own `type.method` in test/methods-table.test.ts. One
 * assertion, every entry, and it is the reason this paragraph is a disclosure
 * and not a defect.
 */
interface GeneratorDrivenEntry<M extends Method> {
  readonly drive: DriveKind<M>;
  readonly type: RequestType<MethodMap[M]["params"], unknown, EntryErrorPayload>;
  /**
   * What the streamed chunks travel as. On the entry rather than in the drive
   * so the drive names no single method's payload -- `ProgressType` carries no
   * state, so one instance per method is the whole cost.
   */
  readonly progress: ProgressType<GeneratorChunk<M>>;
  readonly capability: CapabilityContributor;
}

/**
 * One method tsudoi serves: what it is on the wire, how its handler is driven,
 * and what it entitles a client to ask for.
 */
export type RequestEntry<M extends Method> =
  MethodMap[M]["result"] extends AsyncGenerator<unknown, unknown, unknown>
    ? GeneratorDrivenEntry<M>
    : AwaitedOnceEntry<M>;

/**
 * EVERY REQUEST TSUDOI SERVES, AND THE SHAPE IS THE POINT: a mapped type over
 * `Method`, so a method `MethodMap` declares and this table omits IS A COMPILE
 * ERROR NAMING THE MISSING KEY (measured: TS2741). That is the whole of the
 * user story -- a method that decides nothing does not compile, instead of
 * joining a convention whoever writes it must remember.
 *
 * WHAT THE READINESS GATE MEASURED BEFORE THIS WAS BUILT, recorded here because
 * it is the honest half and the PBI was argued from its opposite: the
 * capability `if`s this replaces WERE DEFENDED, all three, each by a test whose
 * title names per-method capability correctness. THE REJECTION CHECKS WERE NOT
 * -- deleting formatting's and deleting completion's each left ALL 399 TESTS
 * GREEN, and only hover's reddened anything. So this table's gain on the
 * capability half is COLOCATION AND REQUIREDNESS, NOT the removal of an
 * undefended convention, and ANYONE CITING IT AS A SMALLER src/server.ts IS
 * CITING THE WRONG THING: it is about the same number of lines, in a place
 * where forgetting them is a type error.
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
    drive: "generator-driven",
    type: CompletionRequest.type,
    progress: new ProgressType<CompletionItem[]>(),
    // EMPTY OPTIONS, NOT triggerCharacters: TsudoiConfig has no surface for a
    // config author to declare them, and claiming trigger characters nobody
    // configured would have the client ask at moments the handler knows nothing
    // about. Moved here from src/server.ts, where it sat above the `if`.
    //
    // IT MERGES RATHER THAN ASSIGNS, AND THAT IS WHAT MAKES THIS TABLE
    // ORDER-INDEPENDENT. This line used to read `= {}`, which meant a
    // contributor writing into a key THIS method owns had to run after this
    // one -- `completionItem/resolve` is that contributor, and until Sprint 38
    // nothing but declaration order held it. The spread is the whole fix: what
    // is already there survives, so the two entries produce the same
    // `completionProvider` in either order.
    //
    // `{ ...undefined }` IS `{}`, which is why the no-resolve case is
    // unchanged: for a config supplying completion alone this key is absent
    // when this runs and the spread contributes nothing. MEASURED at Sprint 38
    // over ALL 32 configs the five methods can form -- the capabilities emitted
    // are identical to what the assignment emitted, for every one of them.
    capability: (capabilities) => {
      capabilities.completionProvider = { ...capabilities.completionProvider };
    },
  },
  // DECLARED HERE, AND THE POSITION STOPPED BEING LOAD-BEARING AT SPRINT 38.
  // This is still the only entry whose capability writes into a key ANOTHER
  // METHOD OWNS, and it used to be true that moving it above
  // `textDocument/completion` would have the line below overwritten by
  // completion's `{}` before the client ever saw it. COMPLETION NOW MERGES, so
  // both orders produce the same `completionProvider` and this entry sits here
  // because that is the order the pair reads in.
  //
  // MEASURED AT SPRINT 38 rather than inherited: with this entry moved above
  // completion's, the whole suite is green and the same number of tests run.
  // The exact-equality capability assertion in test/resolve.test.ts still
  // watches WHAT A CLIENT IS TOLD -- it is what a merge that dropped
  // `resolveProvider` would redden -- and it no longer watches the ordering,
  // because the ordering no longer decides anything.
  "completionItem/resolve": {
    drive: "awaited-once",
    type: CompletionResolveRequest.type,
    // THE FOURTH SHAPE THIS TABLE HOLDS AND THE ONLY ONE THAT IS NOT A KEY OF
    // ITS OWN: `resolveProvider` lives inside `CompletionOptions` (protocol
    // 3.18.2, protocol.d.ts:2265), which is `completionProvider`'s value -- so
    // this is the line that makes `CapabilityContributor` a FUNCTION rather
    // than a flag, and reading it beside hover's `true`, completion's empty
    // options and diagnostic's two required booleans is what the table is for.
    //
    // THE EXISTING VALUE IS PRESERVED RATHER THAN REPLACED, AND SINCE SPRINT 38
    // THAT IS THE MECHANISM RATHER THAN A HEDGE AT THIS ONE SITE: both lines
    // that write `completionProvider` merge into it, which is exactly what
    // makes the pair order-independent, so this spread is no longer a defensive
    // gesture one contributor makes about another's key.
    //
    // IT IS STILL NOT DEFENDED, AND THAT HALF IS UNCHANGED AND RE-MEASURED
    // RATHER THAN CARRIED: `textDocument/completion` contributes no key of its
    // own, so writing `{ resolveProvider: true }` outright still produces an
    // identical result for every config -- MEASURED at Sprint 38, the whole
    // suite green with this spread deleted, exactly as Sprint 34 measured it
    // before the merge. What the spread buys remains a FUTURE
    // `triggerCharacters` on completion's line not being deleted by this one,
    // silently, at a distance.
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
    // not implement for this method.
    // `true` is the protocol's own way to say `provided, with nothing to
    // configure`. MEASURED at vscode-languageserver-protocol 3.18.2:
    // `documentFormattingProvider?: boolean | DocumentFormattingOptions` sits at
    // the TOP LEVEL of ServerCapabilities -- it is nobody else's key, which is
    // why this reads like hover's and not like resolve's, which reaches inside
    // completion's. Moved here from src/server.ts, where it sat above the `if`.
    //
    // READING THEM SIDE BY SIDE IS THE POINT, and it is what a table flattening
    // them to booleans would have destroyed silently: `true` here, completion's
    // EMPTY OPTIONS MERGED INTO WHATEVER IS ALREADY THERE, diagnostic's object
    // with two REQUIRED booleans, and resolve's key NESTED INSIDE COMPLETION'S
    // are each a different kind of contribution, and
    // this is the one place the difference is visible at a glance. NAMED AND
    // DELIBERATELY NOT COUNTED: the PO ruled a count out of this comparison at
    // Sprint 31 because any enumeration invites the same staleness again, and
    // the entry named last here is the one that was still a prediction then.
    capability: (capabilities) => {
      capabilities.documentFormattingProvider = true;
    },
  },
  "textDocument/diagnostic": {
    // AWAITED ONCE, AND IT WAS PLANNED AS GENERATOR-DRIVEN UNTIL IT WAS
    // MEASURED. `DocumentDiagnosticRequest` declares `partialResult`, which is
    // where the expectation came from -- and see `driveGenerator`: declaring it
    // is NECESSARY AND NOT SUFFICIENT, because that drive concatenates chunks
    // and this method's chunks are objects. Nothing here chooses the drive
    // anyway; `DriveKind` DERIVES it from `MethodMap`, so writing
    // `generator-driven` on this line would not compile.
    drive: "awaited-once",
    type: DocumentDiagnosticRequest.type,
    // AN OBJECT WITH TWO REQUIRED BOOLEANS, WHICH IS WHY NEITHER `true` NOR `{}`
    // WOULD DO: `DiagnosticOptions` (protocol.diagnostic.d.ts:50-67, protocol
    // 3.18.2) requires BOTH, so this is a fourth kind of contribution beside
    // hover's `true`, completion's `{}` and resolve's nested key -- and reading
    // the four side by side is what this table is for.
    //
    // THE TWO VALUES ARE DECIDED DIFFERENTLY AND THAT DISTINCTION IS THE POINT
    // OF WRITING THEM OUT RATHER THAN INLINING A LITERAL.
    //
    // NO `identifier`, AND ITS ABSENCE IS A DECISION RATHER THAN AN OMISSION,
    // written here because this is the line that would gain one. `DiagnosticOptions`
    // declares it optional, and `DocumentDiagnosticParams` carries the matching
    // optional `identifier` a client echoes back -- so registering one would
    // create a value tsudoi must then MATCH incoming params against, and
    // `TsudoiConfig` has no surface for an author to name it. Exactly the
    // reasoning that leaves completion's options empty rather than claiming
    // triggerCharacters nobody configured. A client sending `identifier` today
    // is answered from the same handler regardless, which is correct while
    // tsudoi registers exactly one diagnostic source.
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
    // ANOTHER FILE THAT NEVER CLEARS, which is SILENT AND WRONG. The same
    // preference refuses to synthesise a workspace root from cwd.
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
  readonly drive: "awaited-once" | "generator-driven";
  readonly type: RequestType<unknown, unknown, EntryErrorPayload>;
  readonly progress: ProgressType<unknown[]>;
  readonly capability: CapabilityContributor;
}

/** A handler awaited once, with the method's own params and result erased. */
type ErasedAwaitedOnceHandler = (context: RequestContext, params: unknown) => Promise<unknown>;

/** A handler driven a chunk at a time, with the method's own types erased. */
type ErasedGeneratorHandler = (
  context: RequestContext,
  params: unknown,
) => AsyncGenerator<unknown[], unknown[] | null, void>;

/**
 * The table as a list, in DECLARATION ORDER -- which holds because these are
 * ordinary string keys.
 *
 * NOTHING DEPENDS ON THAT ORDER SINCE SPRINT 38, and this sentence said the
 * opposite until then: it named the contributor-ordering constraint at
 * `CapabilityContributor` as what declaration order was FOR. That constraint no
 * longer exists -- the one shared capability key is merged into rather than
 * assigned over -- so the order is a fact about `Object.entries` and not a
 * requirement anything here rests on.
 */
function erasedEntries(): readonly (readonly [Method, ErasedEntry])[] {
  return Object.entries(requestEntries) as unknown as readonly (readonly [Method, ErasedEntry])[];
}

/**
 * Claims each capability the config can actually answer for.
 *
 * THE POLICY IS THE STAKEHOLDER'S AND IS UNCHANGED: a client is entitled to send
 * whatever it was told about, so a capability is claimed ONLY where the config
 * can answer it. What moved is where the per-method answer is written, not what
 * it is.
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
 * The workspace folders as of NOW. A function rather than a value because
 * registration happens before `initialize` does: the folders do not exist yet
 * when the handlers below are wired, and a value captured here would be the
 * pre-initialize one forever -- the same ordering trap src/cli.ts records for
 * the config factory, one layer in.
 */
export type WorkspaceFolders = () => readonly WorkspaceFolder[];

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
 * Only the REPORTING is shared. THE CALLS STAY SEPARATE: a hover handler is
 * awaited once and a completion handler is driven a chunk at a time, and there
 * is no shape both fit into that is not an invention.
 *
 * THAT SENTENCE IS UNCHANGED AND IS NOT A LEFTOVER. A table now exists, and it
 * did NOT overturn this: the two calls are still two, at `driveAwaitedOnce` and
 * `driveGenerator`, and a method picks one of them BY NAME. What the table
 * carries is what they genuinely share -- the rejection, the context and the
 * cancelled answer -- and nothing was invented to make one shape out of two.
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
 * whatever drive its method uses. UNQUALIFIED SINCE SPRINT 35, and it forwards
 * the qualifier `answerUnlessCancelled` no longer carries either: every request
 * that reaches a drive reaches that function, so there is no path to a cancelled
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
  workspaceFolders: readonly WorkspaceFolder[],
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
  return { signal: controller.signal, tsudoi, workspaceFolders };
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
 * THAT SENTENCE CARRIED A QUALIFIER FOR THREE SPRINTS AND IT IS GONE RATHER THAN
 * FORGOTTEN. The generator drive used to return early when the config supplied
 * no handler, AHEAD of this function, so a cancelled request to a
 * generator-driven method with NO handler was answered `null` and an
 * awaited-once one -32800 -- pre-existing, revealed rather than introduced, and
 * invisible until the two drives sat side by side. MEASURED at Sprint 32 by P-D
 * and RE-MEASURED at Sprint 35 by restoring that return, which reddens the
 * table-wide no-handler test naming `textDocument/completion` and no other
 * method.
 *
 * THE DIVERGENCE WAS CLOSED AT -32800 FOR BOTH, and the ground was the sentence
 * above rather than the behaviour: LSP permits either answer, so no requirement
 * was breached, and what was at stake was that THIS CLAIM IS THE ASSET.
 * Preserving the divergence would have meant qualifying a stated principle to
 * accommodate an ordering nobody chose.
 *
 * WHAT WOULD FALSIFY IT AGAIN, written here because that is the edit: any drive
 * answering a request before it reaches this function. Both build the request
 * context whether or not a handler exists, and both answer through here, which
 * is the property test/methods-table.test.ts pins for EVERY entry in the table
 * with no handler configured.
 *
 * Only the ANSWER is shared. The CALLS stay separate: a hover handler is
 * awaited once and a completion handler is driven a chunk at a time, and
 * `produce` is where that difference lives -- supplied now by one of the two
 * named drives rather than by a handler written out per method.
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
  workspaceFolders: WorkspaceFolders,
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
        // outside its serving window has no client state to answer FROM. It ran
        // three times by hand before this loop; the readiness gate measured that
        // TWO OF THOSE THREE COPIES WERE DEFENDED BY NOTHING AT ALL -- deleting
        // formatting's and deleting completion's each left all 399 tests green.
        // That is the finding this loop answers.
        const rejection = requestRejection();
        if (rejection !== undefined) {
          throw rejection;
        }
        const handler = config.methods?.[method];
        // THE DRIVE, AND THE NO-HANDLER CASE COMES WITH IT RATHER THAN BEING A
        // SECOND AXIS. Sprint 31 named the two shapes separately -- hover and
        // formatting call `handler?.(...) ?? null`, while completion answers
        // with a return of its own, because no single expression both drives a
        // generator and answers for a missing one. They are NOT independent:
        // each drive has exactly one of them, so choosing the drive chooses it,
        // and nothing third is invented.
        //
        // WHAT IS NO LONGER A DIFFERENCE BETWEEN THEM is WHERE that answer is
        // produced. Both drives build the request context whether or not a
        // handler exists and answer through `answerUnlessCancelled`, so a
        // cancelled request is -32800 either way; until Sprint 35 completion's
        // return sat ahead of that function and answered `null`.
        if (entry.drive === "generator-driven") {
          return driveGenerator({
            method,
            handler: handler as ErasedGeneratorHandler | undefined,
            params,
            cancellation,
            entry,
            connection,
            tsudoi,
            workspaceFolders,
            reportInvalidToken,
          });
        }
        return driveAwaitedOnce({
          method,
          handler: handler as ErasedAwaitedOnceHandler | undefined,
          params,
          cancellation,
          tsudoi,
          workspaceFolders,
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
 * THE CONTEXT IS BUILT EITHER WAY, WHICH IS NO LONGER A DIFFERENCE FROM THE
 * OTHER DRIVE and was one until Sprint 35: the epilogue reads the abort off the
 * context, so a drive that skipped building one for a request it answers `null`
 * would be deciding that request's cancellation itself.
 */
async function driveAwaitedOnce(run: {
  method: Method;
  handler: ErasedAwaitedOnceHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  tsudoi: Tsudoi;
  workspaceFolders: WorkspaceFolders;
}): Promise<unknown> {
  const context = requestContext(run.tsudoi, run.cancellation, run.workspaceFolders());
  return answerUnlessCancelled(run.method, context.signal, async () => {
    return (await run.handler?.(context, run.params)) ?? null;
  });
}

/**
 * The GENERATOR-DRIVEN drive, and it is the whole of the streaming API. A config
 * author writes `yield` and `return`; whether that leaves as $/progress or as
 * one aggregated response is decided here, from the one thing the protocol
 * actually offers -- the presence of partialResultToken. There is no client
 * capability declaring partial-result support, so a client that cannot take
 * partial results simply omits the token, and the two triggers the brief
 * describes are one trigger.
 *
 * A RETURN OF ITS OWN IS THIS DRIVE'S NO-HANDLER SHAPE and not an oversight
 * beside the `?? null` above: nothing here both drives a generator and answers
 * for a missing one, so the two cases are two statements. WHAT THEY ARE NOT is
 * two answers about cancellation -- that return goes through
 * `answerUnlessCancelled` like every other answer this file produces, and it
 * sat ahead of it until Sprint 35.
 *
 * WHAT THIS DRIVE REQUIRES OF A METHOD THAT PICKS IT: its params must carry a
 * `partialResultToken`, and its chunks must be ARRAYS, since aggregation
 * concatenates them.
 *
 * IT WAS WRITTEN EXPECTING TO BE MET AT PBI-38 AND IT EXCLUDED THAT METHOD
 * INSTEAD, which is the strongest evidence it was worth writing down and is why
 * the outcome is recorded rather than the prediction. MEASURED at Sprint 33,
 * vscode-languageserver-protocol 3.18.2: `DocumentDiagnosticParams` DOES declare
 * `PartialResultParams`, so the first requirement holds -- and
 * `DocumentDiagnosticRequest.partialResult` is
 * `ProgressType<DocumentDiagnosticReportProgress>`, a union of two OBJECT types
 * and not an array, so the second fails and this drive cannot carry that method.
 *
 * THE PROTOCOL'S OWN COMMENT SAYS WHY, and it is the half a type check would
 * miss: those chunks carry RELATED DOCUMENTS rather than more diagnostics for
 * the requested one, where completion's chunks are more items of a single list.
 * `textDocument/diagnostic` is served awaited-once.
 */
async function driveGenerator(run: {
  method: Method;
  handler: ErasedGeneratorHandler | undefined;
  params: unknown;
  cancellation: CancellationToken;
  entry: ErasedEntry;
  connection: RequestOnlyConnection;
  tsudoi: Tsudoi;
  workspaceFolders: WorkspaceFolders;
  reportInvalidToken: (requested: unknown) => void;
}): Promise<unknown> {
  const handler = run.handler;
  const context = requestContext(run.tsudoi, run.cancellation, run.workspaceFolders());
  if (handler === undefined) {
    // THIS DRIVE'S NO-HANDLER ANSWER, AND IT GOES THROUGH THE EPILOGUE LIKE
    // EVERY OTHER ANSWER THIS FILE PRODUCES. There is still nothing to drive,
    // so nothing pulls a generator or reads a token -- what changed at Sprint
    // 35 is that the `null` is produced INSIDE `answerUnlessCancelled` instead
    // of ahead of it, so a CANCELLED request with no handler is answered -32800
    // here exactly as it is on the awaited-once drive.
    //
    // WHY THE CONTEXT IS BUILT FOR A REQUEST NOTHING WILL ANSWER: the epilogue
    // reads the abort off it. That is the same trade the awaited-once drive has
    // always made -- one AbortController and one subscription for a request
    // that answers `null` -- and it is what makes the cancellation decision one
    // decision rather than one per drive.
    //
    // NOT AN ORDERING THIS DRIVE PREFERRED. LSP 3.17 permits answering a
    // cancelled request normally, so the `null` violated nothing; what it did
    // was falsify `answerUnlessCancelled`'s own statement that everything
    // cancellation changes is decided there, and THAT CLAIM IS THE ASSET.
    return answerUnlessCancelled(run.method, context.signal, () => Promise.resolve(null));
  }
  // BELOW THE NO-HANDLER RETURN, AND BOTH SIDES OF THAT POSITION ARE
  // DELIBERATE. Below it, because a config that cannot answer completion at all
  // has no business reporting the client's token on stderr -- that line exists
  // to tell a config author their items were aggregated rather than streamed,
  // and here there are no items. Above `answerUnlessCancelled` rather than
  // inside it, because a client sending `params: null` makes the read below
  // throw a TypeError that is NOT a handler failure: inside the epilogue it
  // would be reported as one, under a `tsudoi:` prefix naming a handler that
  // was never called.
  //
  // Read through `unknown` on purpose: the declared ProgressToken type
  // describes what a CONFORMING client sends, and this path exists for the
  // one that does not.
  const requestedToken: unknown = (run.params as PartialResultParams).partialResultToken;
  const token = streamingToken(requestedToken, run.reportInvalidToken);
  const progress = run.entry.progress;
  return answerUnlessCancelled(run.method, context.signal, async () => {
    // What the author yielded, kept only when there is no token to stream
    // it under. In streaming mode this stays empty, which is what lets one
    // expression below answer for both modes.
    const collected: unknown[] = [];
    let emitted = false;
    const chunks = handler(context, run.params);
    for (;;) {
      const next = await chunks.next();
      if (next.done === true) {
        // The RETURNED array alone in streaming mode: the yields have
        // already left as $/progress, so concatenating them here would
        // make a client that appends the response see every item twice.
        if (next.value !== null) {
          return [...collected, ...next.value];
        }
        // [] versus null turns on whether THIS request produced a chunk.
        // `nothing further to add` and `nothing to say at all` are
        // different answers, and only request-local state tells them apart.
        return emitted ? collected : null;
      }
      // Checked HERE, between pulling a chunk and sending it: the abort
      // typically lands while `next()` is parked, so a check at the top of
      // the loop would already have passed and this chunk would go out to
      // a client that has stopped listening. Returning also stops driving
      // the generator, which is the point of cancelling at all. The value
      // is discarded either way -- the answer is already -32800.
      if (context.signal.aborted) {
        // Returning stops DRIVING the generator; closing it is what runs
        // the config author's `finally`. Without this the generator is left
        // suspended at its yield forever, and cleanup nobody can watch
        // succeed is silently skipped on every superseded keystroke.
        //
        // Above the mode split, where the abort check already is: whether
        // this request streamed or aggregated says what the CLIENT can take
        // and nothing about what the HANDLER holds open.
        //
        // FIRED, NEVER AWAITED, and the rejection handler is not optional.
        // Measured on both runtimes: a `finally` that never settles leaves
        // this promise pending forever, so awaiting it would mean the
        // -32800 the client is waiting for is never sent at all -- and a
        // `finally` that throws rejects it, which unhandled kills the
        // process. That one handler does both jobs: it is how a throwing
        // cleanup gets reported, and it is what stops the same rejection
        // being fatal. Drop it and both halves fail together.
        //
        // What no arrangement of this can do: a generator parked inside its
        // own `await` queues return() behind the pending next(), so its
        // cleanup runs only when that settles. A limit of async generators,
        // not a defect here.
        //
        // THE ITERATOR RESULT IS DISCARDED ON PURPOSE, and this is the one
        // record of why. MEASURED under bun 1.3.13 and deno 2.9.2: when the
        // author's `finally` itself yields, the `return(null)` below resolves
        // `{ value, done: false }` -- the return completion is suspended by
        // that yield. CONSEQUENCE: the generator stays parked INSIDE its own
        // finally and every statement after that yield -- the rest of their
        // cleanup -- never runs, silently, on every superseded keystroke.
        // `done === false` right here is the evidence tsudoi could report.
        //
        // NOT HANDLED, and NOT because it is invisible: it is LANGUAGE
        // SEMANTICS rather than tsudoi doing something wrong. Measured on
        // both runtimes, `for await (...) { break }` over the same generator
        // leaves it in exactly this state -- one chunk seen, the code after
        // the yield unrun. tsudoi calls .return() correctly; the author's
        // own cleanup defers itself. Reporting it would be reporting
        // JavaScript, so PBI-12 was dropped on culpability, not on defect.
        //
        // NO NARROWING AND NO GUARD, AND THAT IS A RULING RATHER THAN AN
        // OVERSIGHT. A local narrowed to `AsyncIterator` stood here for exactly
        // one sprint, on the reasoning that the iterator contract is what this
        // drive actually needs and that `AsyncIterable` -- the shape the stream
        // was about to be published as -- makes `return` OPTIONAL. THAT SHAPE
        // WAS THEN RULED OUT, so the guard would have widened a guarantee away
        // by hand and then defended against the absence it had just
        // manufactured. This repository prefers FORECLOSING a failure to
        // DETECTING one, and an `AsyncGenerator` forecloses this one.
        chunks.return(null).then(undefined, (error: unknown) => {
          reportCleanupFailure(run.method, error);
        });
        return null;
      }
      emitted = true;
      if (token === undefined) {
        collected.push(...next.value);
      } else {
        await run.connection.sendProgress(progress, token, next.value);
      }
    }
  });
}
