// TSUDOI'S OWN TYPES. package.json maps `@atusy/tsudoi-language-server/types` here, so every
// exported name is public API and renaming one breaks configs we cannot see.
// What ships is the compiled dist/types.d.ts, not this file.
//
// WHAT IS NOT HERE IS DELIBERATE: every LSP name a config author might want --
// the protocol's types and the data values a handler reads or builds -- is
// published from `@atusy/tsudoi-language-server/deps/protocol`, `@atusy/tsudoi-language-server/deps/types` and
// `@atusy/tsudoi-language-server/deps/textdocument` instead. The line this module draws is OURS
// versus THEIRS; the line BETWEEN the three deps subpaths is upstream's own
// packaging, which an author reaches past rather than reasons about.
import type {
  ClientCapabilities,
  CompletionItem,
  CompletionParams,
  DocumentDiagnosticParams,
  DocumentDiagnosticReport,
  DocumentFormattingParams,
  Hover,
  HoverParams,
  InitializeParams,
  InitializeResult,
  Position,
  Range,
  TextEdit,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";

/**
 * THE DOCUMENT A CONFIG AUTHOR IS HANDED: a LIVE, SEALED FACADE over one open
 * buffer, carrying the seven members upstream's `TextDocument` declares for
 * READING it and forwarding each one to that buffer AT THE MOMENT IT IS ASKED.
 *
 * THE LINE BETWEEN UPSTREAM'S HELPERS RUNS BETWEEN READING AND NEEDING THE
 * INSTANCE: `TextDocument.applyEdits` only reads the members and answers from
 * this document exactly as from upstream's own, while `TextDocument.update`
 * needs an instance `TextDocument.create` built and THROWS on this one -- after
 * type-checking, since the two interfaces are mutually assignable. AN AUTHOR WHO
 * NEEDS ONE TAKES A COPY THEY OWN: `TextDocument.create(document.uri,
 * document.languageId, document.version, document.getText())` is a real
 * instance, detached from the buffer, and theirs to update.
 */
export interface DocumentView {
  readonly uri: string;
  readonly languageId: string;
  readonly version: number;
  readonly lineCount: number;
  readonly getText: (range?: Range) => string;
  readonly positionAt: (offset: number) => Position;
  readonly offsetAt: (position: Position) => number;
}

/**
 * The store a config author reads, and WHAT IT HANDS BACK IS LIVE: a document
 * answers from the buffer as it stands AT THE MOMENT IT IS ASKED, so a reference
 * kept across an `await` reflects every change that arrived meanwhile. BOUNDED
 * BY THE OPEN/CLOSE CYCLE: the view belongs to one open, so a reference carried
 * across a close is a detached snapshot that silently stops moving -- and its
 * version is no warning, since the reopened document numbers from whatever the
 * client sent at `didOpen`.
 *
 * A handler that needs the text it STARTED with must take a copy -- `getText()`
 * returns a string, and a string does not move. That is the general rule stated
 * at `Tsudoi` below, spelled out here for the one member on which HOLDING THE
 * REFERENCE IS NOT TAKING THE VALUE.
 */
export interface DocumentStore {
  readonly get: (uri: string) => DocumentView | undefined;
  readonly values: () => Iterable<DocumentView>;
}

/**
 * The workspace folders a config author reads, as a STORE and not an array --
 * the same `get` + `values` shape `DocumentStore` has.
 *
 * THE TWO `get`s ANSWER DIFFERENT QUESTIONS ALL THE SAME, and reading this one
 * as a lookup by key is the mistake to avoid: a document is stored UNDER its
 * uri, while a folder is asked about a uri it CONTAINS. Which is also why their
 * return shapes differ -- one buffer either is open or is not, where a uri may
 * be covered by NO folder or by SEVERAL the client spelled differently.
 *
 * AN `Iterable` AND NEVER A `Set`, which is the shape that looks right and is
 * not: the mirror MAY HOLD ONE URI TWICE, deliberately, and a set of OBJECTS
 * keys on identity, so it would drop nothing and promise otherwise.
 */
export interface WorkspaceFolderStore {
  /**
   * EVERY FOLDER THE CLIENT HOLDS AT THE INNERMOST LOCATION COVERING `uri`, in
   * the order the client sent them -- or an EMPTY LIST where it holds none.
   *
   * NOT `EVERY ANCESTOR'S FOLDERS`, and that is the reading to guard against:
   * the walk climbs from `uri` and STOPS at the first location that holds
   * anything, so a document inside `file:///w/inner` inside `file:///w` answers
   * with `inner` ALONE. The list is longer than one only when SEVERAL FOLDERS
   * NAME ONE LOCATION -- a uri the client sent twice, `…/plain` beside
   * `…/plain/`, `file://LOCALHOST/a` beside `file:///a` -- and you are handed all
   * of them, because returning ONE would be tsudoi deciding on its own authority
   * which of two things the client said it did not mean.
   *
   * MATCHED BY LOCATION AND NOT BY BYTES: both sides go through the SAME parse
   * before they are compared, so spellings that differ where the URL Standard
   * says they name one thing MEET, and a trailing slash is a thing neither side
   * has to get right. THE PATH'S CASE IS NOT AMONG THEM. NORMALISING IS NOT
   * LOOSENING either: `file:///home/me/proj` CANNOT ANSWER FOR a document in
   * `file:///home/me/project`, since nothing here matches on prefixes.
   *
   * NOTHING YOU CAN PASS THROWS, and the answer is an EMPTY LIST rather than
   * `undefined`, so `for (const folder of tsudoi.workspaceFolders.get(uri))`
   * needs nothing in front of it. A FOLDER whose uri no parser accepts is
   * unreachable HERE while `values()` still hands it over.
   *
   * WHAT IT DOES NOT ASK IS THE FILESYSTEM. This answers about the LIST the
   * client sent, so a folder that does not exist on disk answers for the
   * documents under it, and a symlink is not followed.
   */
  readonly get: (uri: string) => readonly Readonly<WorkspaceFolder>[];
  /**
   * EXACTLY WHAT THE CLIENT SENT, IN MIRROR ORDER, with nothing dropped, nothing
   * synthesised and nothing reordered.
   *
   * WHAT ONE CALL HANDED BACK IS THE LIST AS OF THAT CALL, FOR GOOD, and that is
   * the one defence a handler has against the liveness rule at `Tsudoi`: the
   * mirror is REPLACED on every change and never written into, so what you took
   * can be iterated again later and still answers about the moment you took it.
   */
  readonly values: () => Iterable<Readonly<WorkspaceFolder>>;
}

/**
 * `T` with every property, at every depth, `readonly` -- and every array a
 * `readonly` one.
 *
 * A TYPE AND NOT A GUARANTEE. `readonly` is erased at run time, so this stops
 * the mistake in a config that is TYPE-CHECKED and stops nothing in the
 * JavaScript an author actually ships; the freeze in src/tsudoi.ts is the half
 * that runs.
 *
 * `any` IS REDUCED TO `unknown` BY THE FIRST ARM. NOTHING CAN MAKE `any`
 * READONLY -- a mapped type over it yields members that are `any` again -- so
 * without that arm the promise above is FALSE exactly where a client's own data
 * lives: `ClientCapabilities.experimental` is `LSPAny`, which is `any`. REDUCED
 * RATHER THAN OVERRIDDEN WITH A JSON VALUE TYPE OF OUR OWN, which would have
 * tsudoi INVENT A SHAPE for data the client defines; what that costs an author
 * is narrowing `experimental` themselves.
 */
export type DeepReadonly<T> = 0 extends 1 & T
  ? unknown
  : T extends readonly (infer E)[]
    ? readonly DeepReadonly<E>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * THE SERVER'S CONTEXT: what a config author can reach that is not about ONE
 * request, reached through `RequestContext.tsudoi`. What the SESSION is -- the
 * open documents, the client's roots, what the client said it can do -- rather
 * than what this MESSAGE asked.
 *
 * EVERYTHING REACHED THROUGH HERE IS LIVE, AND THAT IS ONE RULE RATHER THAN A
 * NOTE PER MEMBER. This is a SINGLE OBJECT LIVING AS LONG AS THE SERVER DOES,
 * not something assembled per request, so a handler that reads a member, awaits,
 * and reads it again may read two different things. THE HAZARD IS THE
 * HANDLER'S: a completion handler streams over time, and one that re-reads the
 * folder list mid-request can attribute items to a root the user has already
 * removed. A surface that took that decision would be wrong for the handler that
 * WANTS the latest folders.
 *
 * SO A HANDLER THAT NEEDS THE VALUE IT STARTED WITH TAKES IT BEFORE ITS FIRST
 * `await`, and what `taking` costs differs by member: for the FOLDERS, taking
 * `values()` is enough, since the mirror is replaced rather than written into.
 * For a DOCUMENT, holding the reference is not, because what it reads is the
 * buffer as it stands when it is asked.
 */
export interface Tsudoi {
  readonly documents: DocumentStore;
  /**
   * The workspace folders the client is holding NOW, or a store that yields
   * NOTHING when it named none.
   *
   * ABSENCE IS NEVER DEFAULTED -- not to the working directory, not to `/`, not
   * to anything this process could invent. An empty list means the editor opened
   * no workspace, and answering from a root nobody named is the failure this
   * shape refuses. Both of the protocol's absent states, the field omitted and
   * the field sent as null, arrive here as the same empty list.
   *
   * THE ONE MEMBER HERE THAT ACTUALLY MOVES:
   * `workspace/didChangeWorkspaceFolders` REPLACES what this store answers with
   * mid-session, and a request already in flight sees the replacement on its next
   * call.
   *
   * MIRRORED, NOT INTERPRETED: two spellings of one directory are TWO folders,
   * and a URI added twice is held twice, because this is the CLIENT's state
   * rather than the filesystem's. Nothing is synthesised into it either -- the
   * protocol makes `name` the label the CLIENT uses in its UI, so a folder tsudoi
   * built out of `rootUri` would carry a name no client ever said.
   *
   * WHICH MEANS AN EMPTY LIST BESIDE A POPULATED `rootUri` IS A REAL STATE, and
   * it is the one to think about: a client without the workspace-folders
   * capability names its project in `rootUri` or `rootPath` and sends no folders
   * at all. TSUDOI SHIPS NO REDUCTION OVER THE THREE -- any reduction has to put
   * a `name` there that no client said -- so an author who wants one writes it.
   */
  readonly workspaceFolders: WorkspaceFolderStore;
  /**
   * The project root a client named in `initialize`'s DEPRECATED `rootUri`, or
   * `null` where it named none -- the client's own bytes, with no round trip
   * through a URL parser and no filesystem question asked of it.
   *
   * DEPRECATED BY THE PROTOCOL, NOT BY tsudoi, and carried for exactly that
   * reason: `workspaceFolders` supersedes it and is available only from a client
   * that declares the capability, so this is where everyone else says which
   * project the editor opened. A URI naming no local path reaches you as the
   * client spelled it rather than being dropped for being unusable.
   */
  readonly rootUri: string | null;
  /**
   * The ABSOLUTE project root a client named in `initialize`'s DEPRECATED
   * `rootPath`, or `null` -- a PATH rather than a URI, and the one field on this
   * surface that is not a pure mirror.
   *
   * `rootUri` WINS WHERE BOTH ARE SET. That is the protocol's own rule and
   * NOTHING HERE APPLIES IT: precedence is a reading, and both fields reach you
   * unread.
   *
   * A NON-ABSOLUTE `rootPath` IS REFUSED AND ARRIVES AS `null`. A relative path
   * is not a root: it resolves only against a working directory THE CLIENT DOES
   * NOT SHARE, so it means one thing to your editor and another to the process
   * answering you. `""` and `"."` are the spellings clients send, neither is
   * absence, and `??` covers neither. That failure is invisible in testing
   * because an editor launches the server FROM the project: cwd and the project
   * coincide in every session that HAS one and diverge only for the user who has
   * none.
   *
   * WHAT THE REFUSAL COSTS YOU, stated rather than glossed: YOU CANNOT TELL `the
   * client sent no rootPath` FROM `the client sent one we refused`. What you are
   * spared in exchange is a value you could not have used correctly.
   */
  readonly rootPath: string | null;
  /**
   * WHAT THE CLIENT SAID IT CAN DO, exactly as it sent it, or an EMPTY OBJECT
   * where it said nothing.
   *
   * UPSTREAM'S OWN TYPE, published through `@atusy/tsudoi-language-server/deps/protocol`, so
   * tsudoi's surface does not widen by one name for this: every capability LSP
   * defines is already reachable, and one tsudoi has never heard of arrives the
   * day the dependency does.
   *
   * `{}` WHEN THE CLIENT SENT NONE, AND NEVER `null` OR `undefined`. A HANDLER
   * NEED NOT DEFEND AGAINST IT: `clientCapabilities.textDocument?.completion
   * ?.completionItem?.insertReplaceSupport` answers `undefined` on an empty
   * object and throws on neither, so absence reads as `the client did not declare
   * it`. A nullable field would have made every reader open with a guard, and the
   * reader that forgot it would fail on exactly the old client the capability
   * check exists to serve.
   *
   * NOT NORMALISED AND NOT INTERPRETED, the same mirror the folder list is, and
   * FROZEN AT EVERY DEPTH so that a handler wanting a modified copy takes one and
   * owns it. WHAT THAT PROTECTS IS NOT YOUR HANDLER BUT THE NEXT ONE.
   *
   * AND TAKING ONE COSTS A CAST, said here because the obvious spelling does not
   * compile and the reader would meet TS2540 with no route out: MEASURED,
   * `structuredClone<T>(v: T): T` hands back the `readonly` it was given, so
   * `structuredClone(clientCapabilities)` is another `DeepReadonly` and every
   * write to it is refused. `as ClientCapabilities` on the clone is the route; a
   * spread unfreezes the top level and nothing under it.
   *
   * WHAT IT IS NOT IS A ROUTE TO THE REST OF `InitializeParams` ON THIS SURFACE.
   * This is one field, opened because one reader needed it; the others are
   * unread HERE, and the reason is the `FOUR FIELDS` refusal in src/server.ts,
   * which is about what the SESSION retains. It is NOT a statement about what
   * the message reaches: a config's own `initialize` handler is handed the whole
   * of `InitializeParams`, which is a different question with a different
   * answer.
   */
  readonly clientCapabilities: DeepReadonly<ClientCapabilities>;
}

export interface MethodMap {
  /**
   * BATCHES OF ITEMS, AND NOTHING ELSE. ONE SLOT WITH ONE MEANING: every `yield`
   * is CONTENT, the return carries NOTHING, and no part of what an author writes
   * selects how their items reach the client. A handler with nothing to say
   * yields nothing.
   *
   * WHAT THE DRIVE DOES, and it is the whole of the streaming API:
   *
   *   partialResultToken present -> EVERY yield leaves as its own `$/progress`
   *                                 and the response is `null`. ALWAYS --
   *                                 including for a stream that yielded once.
   *   partialResultToken absent  -> every yield is aggregated and the whole list
   *                                 is the response; a stream that yielded
   *                                 NOTHING is answered `null`.
   *
   * THE TOKEN DECIDES, AND NOTHING ELSE DOES. THE COST IS ACCEPTED KNOWINGLY: a
   * one-batch answer under a token spends a `$/progress` and a `null` response
   * where a single response would have done. The look-ahead that would have saved
   * it makes the FIRST batch wait on the SECOND pull -- a delay landing exactly
   * when the first chunk is slow and streaming matters most.
   *
   * `null` FOR A STREAM THAT YIELDED NOTHING IS A VALUE DECISION AND NOT A
   * CHANNEL ONE. `[]` is not available to mean this, because the specification
   * treats a supplied `CompletionItem[]` as `{ isIncomplete: false, items }` --
   * so `[]` tells the user there are NO CANDIDATES, which is a stronger statement
   * than `this server has no answer for that position`.
   *
   * AND `return` CARRIES NO CONTENT, WHICH WAS DECLINED RATHER THAN OVERLOOKED.
   * A content-bearing return makes a single-batch answer detectable in ONE pull,
   * which is real. What it costs is TWO ENTRANCES FOR CONTENT -- `yield` and
   * `return` -- with the author choosing between them per call, which is the
   * weaker form of the very defect this shape exists to remove.
   *
   * WHAT THIS SHAPE CANNOT SAY, NAMED RATHER THAN LEFT TO BE REDISCOVERED:
   * `isIncomplete`. EVERY completion tsudoi answers claims its candidate set is
   * final, and two configs in this repository rule that claim FALSE at their own
   * sites. THE FUTURE PATH IS TO WIDEN THE YIELD TO `CompletionItem[] |
   * CompletionList` AND NORMALISE A MID-STREAM `CompletionList` INTO ITEMS -- not
   * a tuple, which would make one slot's meaning depend on its neighbour. It is
   * NOT BUILT, and this is the line that would change.
   */
  "textDocument/completion": {
    params: CompletionParams;
    result: AsyncGenerator<CompletionItem[], void, void>;
  };

  "textDocument/hover": {
    params: HoverParams;
    result: Promise<Hover | null>;
  };

  /**
   * Awaited once: a formatter has one answer for the whole document, and the
   * protocol gives it no partialResultToken to stream under.
   */
  "textDocument/formatting": {
    params: DocumentFormattingParams;
    result: Promise<TextEdit[] | null>;
  };

  /**
   * Awaited once. Not stream-driven despite `DocumentDiagnosticRequest`
   * declaring `partialResult`: that drive concatenates chunks and requires
   * arrays, while `DocumentDiagnosticReportProgress` is a union of two object
   * types -- and the stream carries RELATED DOCUMENTS, which are out of scope,
   * so the partial channel would carry nothing at all.
   *
   * NO `| null`, which is the protocol's shape rather than a strictness chosen
   * here. `nothing to say` is `{ kind: "full", items: [] }` -- a report saying
   * the file is CLEAN -- and the distinction matters, because a client that
   * receives no report leaves the previous one on screen.
   *
   * FULL REPORTS ONLY: `UnchangedDocumentDiagnosticReport` REQUIRES a
   * `resultId`, so declining result ids makes `unchanged` unreachable by
   * construction. `previousResultId` arrives in the params and is ignored,
   * which is conforming.
   */
  "textDocument/diagnostic": {
    params: DocumentDiagnosticParams;
    result: Promise<DocumentDiagnosticReport>;
  };

  /**
   * Awaited once; the protocol declares no `partialResult` for it. The only one
   * of the five whose params name no document at all, and it never touches the
   * document store.
   *
   * WHAT TO DO WITH AN ITEM YOU DO NOT RECOGNISE: RETURN IT UNCHANGED. A client
   * may send any item, and the response REPLACES that item in its list, so
   * answering with anything else drops the entry the user is looking at. tsudoi
   * cannot do the recognising for you: it keeps no record of what a completion
   * handler produced, so the item arrives exactly as the client sent it -- extra
   * members included. Matching incoming items against remembered ones would mean
   * holding per-request state whose lifetime nothing on this surface could
   * describe.
   *
   * RESOLVE REQUIRES COMPLETION, and that is not expressed in this type:
   * `methods` stays a `Partial`, so supplying resolve alone type-checks. It is
   * refused when the config LOADS; the reason for enforcing it there is at the
   * check itself in src/config.ts.
   */
  "completionItem/resolve": {
    params: CompletionItem;
    result: Promise<CompletionItem>;
  };
}

export type Method = keyof MethodMap;

/**
 * EVERY KEY A CONFIG MAY DECLARE A HANDLER FOR: the request table above, PLUS
 * `initialize`. Two enumerations rather than one, and this type is what keeps
 * them apart -- a row of `MethodMap` contributes a capability and routes through
 * `registerMethods`, and `initialize` does neither. It is wired directly in
 * src/server.ts, beside the lifecycle's own refusal of a second handshake, so a
 * row up there would have src/methods.ts advertise a capability nobody can ask
 * for and src/config.ts refuse it with a sentence that is false of it.
 *
 * `Promise`, LIKE THE FIVE, and not `InitializeResult | Promise<…>`: one shape
 * per row is what keeps `MethodHandler` readable, and an author whose answer is
 * ready writes `Promise.resolve` here exactly as they do for hover.
 *
 * `DeepReadonly` ON THE RESULT IS WHAT LETS A HANDLER RETURN WHAT IT WAS HANDED,
 * and the mutable spelling was MEASURED before being refused:
 * `DeepReadonly<InitializeResult>` is NOT assignable to `InitializeResult` --
 * `capabilities.notebookDocumentSync.notebookSelector` is a readonly array -- so
 * `InitializeResult` here would refuse `return context.preparedResult` and every
 * spread of it, leaving a cast as the only route to the thing this key exists
 * for. Nothing is refused in the other direction: a bare literal, a spread of the
 * prepared result, the prepared result itself and a custom top-level key all
 * satisfy it.
 */
export interface ConfigMethodMap extends MethodMap {
  initialize: {
    params: InitializeParams;
    result: Promise<DeepReadonly<InitializeResult>>;
  };
}

export type ConfigMethod = keyof ConfigMethodMap;

/**
 * WHAT THIS ONE REQUEST IS, and nothing that outlives it -- WHATEVER THE METHOD.
 * Two members, and the line between them is the whole of what this type says:
 * the SIGNAL is about this message and dies with it, while `tsudoi` is the
 * SERVER -- the same object every request is handed.
 *
 * A FIELD THAT DOES NOT CHANGE PER REQUEST DOES NOT BELONG HERE, and that is the
 * rule rather than a description of today's two members. The folder list, the
 * client's roots and its capabilities are facts about the SESSION; carried here
 * they would say, by their position alone, that a request could see something
 * different from its neighbour.
 *
 * A FIELD ONLY ONE METHOD HAS DOES NOT BELONG HERE EITHER, which is the OTHER
 * rule and the one that made this type gain a name: it goes on that method's own
 * context below, so a handler reading it in the wrong place is refused in the
 * author's file rather than handed `undefined` at run time.
 */
export interface BaseRequestContext {
  readonly signal: AbortSignal;
  readonly tsudoi: Tsudoi;
}

/**
 * THE BASE PLUS THE ONE FIELD ONLY THE HANDSHAKE HAS.
 *
 * IT EXTENDS THE BASE RATHER THAN STANDING BESIDE IT, which is what makes `Base`
 * an honest name: `signal` is here too, so a handshake handler reads
 * cancellation exactly as every other handler does.
 *
 * AND THE FIELD BELOW IS A SESSION FACT ON A REQUEST CONTEXT, WHICH THE FIRST
 * RULE AT `BaseRequestContext` READ LITERALLY REFUSES. That rule's harm is a
 * field whose POSITION says a request could see something different from its
 * neighbour -- and the handshake happens once, so there is no neighbour for it to
 * mislead. What decides the placement is the OTHER rule, `a field only one method
 * has`. A reader applying the first alone concludes this belongs on `Tsudoi`,
 * where it would be a second answer tsudoi owed for the whole session.
 */
export interface InitializeRequestContext extends BaseRequestContext {
  /**
   * THE ANSWER TSUDOI WOULD HAVE SENT HAD YOU SUPPLIED NO HANDLER: every
   * capability contributor already run, the client's handshake already mirrored
   * into `tsudoi`.
   *
   * WHAT YOU RETURN IS WHAT THE CLIENT IS TOLD. tsudoi does not merge this back
   * over your answer and does not restore a key you dropped -- withdrawing a
   * capability tsudoi would have claimed is the point of the handler, and a
   * merge would make it impossible.
   *
   * SO THE HAZARD IS WIDER THAN THE CAPABILITY YOU MEANT TO CHANGE, and it is
   * silent. `completionProvider.resolveProvider` is the cheapest one to notice:
   * `completionItem/resolve` writes into the same key `textDocument/completion`
   * owns, so replacing `completionProvider` wholesale deletes it. The one that
   * costs more is `textDocumentSync` -- tsudoi writes it and
   * `workspace.workspaceFolders` UNCONDITIONALLY, because it delivers both
   * whatever the config says, so an author who replaces `capabilities` and omits
   * `textDocumentSync` gets a client that sends no didOpen and no didChange,
   * `tsudoi.documents` empty for the whole session, and every document-reading
   * handler answering about nothing with no error anywhere. SPREAD WHAT YOU WERE
   * GIVEN rather than building a `capabilities` from scratch.
   *
   * DEEP-FROZEN, so an in-place edit fails loudly instead of half-landing. The
   * spread above is what a handler wanting a modified copy writes, and
   * `structuredClone` IS DELIBERATELY NOT OFFERED BESIDE IT: MEASURED, the clone
   * comes back `DeepReadonly<InitializeResult>` -- `structuredClone<T>(v: T): T`
   * hands back exactly what it was given -- so writing to its `capabilities` is
   * TS2540, and the annotation that would fix that is TS2322 for the reason
   * `ConfigMethodMap.initialize` records. The same freeze is on
   * `clientCapabilities`, where the clone IS the route and costs a cast.
   */
  readonly preparedResult: DeepReadonly<InitializeResult>;
}

/**
 * THE CONTEXT ONE METHOD'S HANDLER RECEIVES, DERIVED FROM THE METHOD AND NEVER
 * CHOSEN BY THE AUTHOR. `MethodHandler` resolves it, so nothing an author writes
 * selects the shape they are handed.
 *
 * IT DEFAULTS, AND WHAT THE DEFAULT BUYS IS THAT `RequestContext` STAYS WRITABLE
 * BARE: the name is published, and sites outside src/ write it with no argument
 * -- including the hand-built context literals in both handler packages, which
 * Definition of Done check 5 compiles. Dropping the default breaks all of them
 * by arity.
 *
 * `= Method` AND NOT `= ConfigMethod`, AND THE DIFFERENCE WAS MEASURED RATHER
 * THAN ASSUMED -- it is NARROWER THAN IT LOOKS. A naked type parameter
 * distributes, so `= Method` collapses over the five to exactly
 * `BaseRequestContext` while `= ConfigMethod` yields `BaseRequestContext |
 * InitializeRequestContext`. NOTHING ASSIGNABILITY CAN SEE TELLS THEM APART: the
 * two are mutually assignable, so every bare literal outside src/ satisfies both,
 * and a bare-typed READ of `preparedResult` is TS2339 under both -- only the type
 * named in the message moves. WHAT THE WIDER SPELLING COSTS IS IDENTITY: this
 * published name stops BEING `BaseRequestContext`, which is why the arm that
 * catches it had to be a type-identity test and why the cast-based one written
 * first was vacuous.
 */
export type RequestContext<M extends ConfigMethod = Method> = M extends "initialize"
  ? InitializeRequestContext
  : BaseRequestContext;

/**
 * ONE TYPE PARAMETER, AND A SECOND IS REFUSED RATHER THAN DEFAULTED. A defaulted
 * context parameter would let an author write `MethodHandler<"textDocument/
 * hover", MyCtx>`: a shape tsudoi never supplies and cannot be made to supply,
 * so the surface would type-check a handler that can only fail at run time.
 */
export type MethodHandler<M extends ConfigMethod> = (
  context: RequestContext<M>,
  params: ConfigMethodMap[M]["params"],
) => ConfigMethodMap[M]["result"];

export type TsudoiConfig = {
  methods?: Partial<{
    [M in ConfigMethod]: MethodHandler<M>;
  }>;
};

/**
 * The config's default export, and it takes nothing. The store is reached
 * through `RequestContext.tsudoi` instead, where it is live.
 *
 * A PARAMETER ADDED BACK HERE RE-CREATES A FORECLOSED FAILURE, and this is the
 * site where that edit would be made. loadConfig calls this factory BEFORE the
 * connection exists, therefore strictly before `initialize` -- so anything read
 * from a parameter here would capture the pre-initialize value forever,
 * silently, however complete the thing handed in became. Adding a parameter to a
 * callback type is non-breaking, so this is reversible the day something
 * concrete needs it -- but whoever opens it owns this paragraph.
 *
 * NOTHING TYPE-CHECKS AN AUTHOR'S OWN CONFIG AGAINST THIS TYPE. src/config.ts
 * reaches it only through a cast from `unknown`, so an author who writes the old
 * shape gets `undefined` and no diagnostic at all. The documented route
 * annotates a const with this type, which is what makes a shape change a compile
 * error in their file. An author who omits the annotation is not caught and
 * cannot be.
 */
export type TsudoiConfigFactory = () => Promise<TsudoiConfig>;
