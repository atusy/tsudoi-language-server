// TSUDOI'S OWN TYPES. package.json maps `@atusy/tsudoi/types` here, so every
// exported name is public API and renaming one breaks configs we cannot see.
// What ships is the compiled dist/types.d.ts, not this file.
//
// WHAT IS NOT HERE IS DELIBERATE: every LSP name a config author might want --
// the protocol's types and the data values a handler reads or builds -- is
// published from `@atusy/tsudoi/deps/protocol`, `@atusy/tsudoi/deps/types` and
// `@atusy/tsudoi/deps/textdocument` instead. The line this module draws is OURS
// versus THEIRS; the line BETWEEN the three deps subpaths is upstream's own
// packaging, which an author reaches past rather than reasons about.
import type {
  CompletionItem,
  CompletionParams,
  DocumentDiagnosticParams,
  DocumentDiagnosticReport,
  DocumentFormattingParams,
  Hover,
  HoverParams,
  TextEdit,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";
import type { TextDocument } from "./deps/textdocument.ts";

/**
 * The store a config author reads, and WHAT IT HANDS BACK IS LIVE: upstream's
 * `TextDocument.update` mutates the instance it was handed, so a reference kept
 * across an `await` reflects every change that arrived meanwhile.
 *
 * A handler that needs the text it STARTED with must take a copy -- `getText()`
 * returns a string, and a string does not move. This is the opposite of
 * `RequestContext.workspaceFolders`, which IS a snapshot, and the asymmetry is
 * deliberate: a folder list that shifted mid-request would let one response
 * carry items attributed to a root that no longer exists, while a document that
 * did not shift would let a handler answer about text the user has replaced.
 */
export interface DocumentStore {
  get(uri: string): TextDocument | undefined;
  values(): Iterable<TextDocument>;
}

/**
 * What a config author can reach that is not per-request, reached through
 * `RequestContext.tsudoi`.
 *
 * It stays published even though no example names it, because `RequestContext`
 * declares `readonly tsudoi: Tsudoi` and every extracted handler names that.
 * Withholding it would leave a member no author could write the type of.
 */
export interface Tsudoi {
  readonly documents: DocumentStore;
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
   * THE TOKEN DECIDES, AND NOTHING ELSE DOES. There is no look-ahead and no
   * special case, so the drive never has to hold a batch back to find out what
   * comes after it. THE COST IS ACCEPTED KNOWINGLY rather than discovered: a
   * one-batch answer under a token spends a `$/progress` and a `null` response
   * where a single response would have done. The look-ahead that would have
   * saved it makes the FIRST batch wait on the SECOND pull -- a delay landing
   * exactly when the first chunk is slow and streaming matters most.
   *
   * `null` FOR A STREAM THAT YIELDED NOTHING IS A VALUE DECISION AND NOT A
   * CHANNEL ONE, which is why it is not a special case in the sense above: the
   * token still decides where anything that WAS yielded travels. `[]` is not
   * available to mean this, because the specification treats a supplied
   * `CompletionItem[]` as `{ isIncomplete: false, items }` -- so `[]` tells the
   * user there are NO CANDIDATES, which is a stronger statement than `this
   * server has no answer for that position`.
   *
   * `void` RATHER THAN `null` IN THE RETURN POSITION IS MEASURED, NOT
   * STYLISTIC. With `null` there, a generator that falls off its own end is
   * TS2355 at compile time and `{ done: true }` with an UNDEFINED value at run
   * time, so every handler in this repository would carry a ceremonial
   * `return null;` that says nothing.
   *
   * AND `return` CARRIES NO CONTENT, WHICH WAS DECLINED RATHER THAN OVERLOOKED.
   * A content-bearing return makes a single-batch answer detectable in ONE pull,
   * which is real. What it costs is TWO ENTRANCES FOR CONTENT -- `yield` and
   * `return` -- with the author choosing between them per call, which is the
   * weaker form of the very defect this shape exists to remove.
   *
   * WHAT THIS SHAPE CANNOT SAY, NAMED RATHER THAN LEFT TO BE REDISCOVERED:
   * `isIncomplete`. The specification treats a supplied `CompletionItem[]` as
   * `{ isIncomplete: false, items }`, so EVERY completion tsudoi answers claims
   * its candidate set is final -- and two configs in this repository rule that
   * claim FALSE at their own sites, examples/completion-path.ts and
   * examples/tsudoi.config.ts. THIS IS A KNOWN GAP, NOT AN OVERSIGHT: a real
   * client DOES act on `isIncomplete`, measured with its numbers at
   * examples/completion-path.ts, so what is missing is not the demand but a
   * shape to carry the flag that does not make one slot mean two things.
   *
   * THE FUTURE PATH IS TO WIDEN THE YIELD TO `CompletionItem[] | CompletionList`
   * AND NORMALISE A MID-STREAM `CompletionList` INTO ITEMS. It is NOT BUILT, and
   * this is the line that would change. WHY THAT SHAPE AND NOT A TUPLE:
   * the yield slot keeps ONE meaning -- CONTENT -- and merely admits a second
   * spelling of it, so no slot's meaning depends on its neighbour and the author
   * still chooses no channel. The drive would take `isIncomplete` from whichever
   * yield carried it and append every other yield's items, which is what the
   * specification's own positional rule already describes. WHAT IT WOULD COST is
   * a normalisation the drive does not have today, and that cost is the reason
   * it is recorded here rather than done now.
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
   * of the five whose params are not a document and a position, and it never
   * touches the document store.
   *
   * NO `| null`, as for diagnostic: a config author MUST answer with an item.
   *
   * WHAT TO DO WITH AN ITEM YOU DO NOT RECOGNISE: RETURN IT UNCHANGED. A client
   * may send any item, and the response REPLACES that item in its list, so
   * answering with anything else drops the entry the user is looking at. tsudoi
   * cannot do the recognising for you: it keeps no record of what a completion
   * handler produced, so the item arrives exactly as the client sent it -- extra
   * members included, since nothing here inspects or rewrites it. Matching
   * incoming items against remembered ones would mean holding per-request state
   * whose lifetime nothing on this surface could describe.
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

export interface RequestContext {
  readonly signal: AbortSignal;
  readonly tsudoi: Tsudoi;
  /**
   * The workspace folders this request started on, or an EMPTY LIST when the
   * client named none.
   *
   * ABSENCE IS NEVER DEFAULTED -- not to the working directory, not to `/`, not
   * to anything this process could invent. An empty list means the editor opened
   * no workspace, and answering from a root nobody named is the failure this
   * shape refuses. Both of the protocol's absent states, the field omitted and
   * the field sent as null, arrive here as the same empty list.
   *
   * A SNAPSHOT OF REQUEST START, not of `initialize`: a folder the user adds or
   * removes mid-session reaches the NEXT request, while a request already in
   * flight keeps the list it began with. That stops one response carrying items
   * attributed to a root that no longer exists, which matters because a
   * completion handler may stream over time. It is the only snapshot on this
   * surface -- the documents reached through `tsudoi` are live.
   *
   * MIRRORED, NOT INTERPRETED: two spellings of one directory are TWO folders,
   * and a URI added twice is held twice, because this is the CLIENT's state
   * rather than the filesystem's. Measured against nvim, which accepts `…/plain`
   * and `…/plain/` as different folders and removes them separately, so a
   * normalising implementation would delete a folder the client still holds. The
   * mirror holds on remove too: a URI held twice and removed once still appears
   * once.
   *
   * NOTHING IS SYNTHESISED INTO IT, and that is a promise about `name` rather
   * than about lists. The protocol defines `WorkspaceFolder.name` as the label
   * `used to refer to this workspace folder in the user interface`, so it is the
   * CLIENT'S and a server cannot know it -- and a folder tsudoi built out of
   * `rootUri` would carry a name no client ever said, indistinguishable here
   * from one that did. So every entry you read was sent by the client.
   *
   * WHICH MEANS AN EMPTY LIST BESIDE A POPULATED `rootUri` IS A REAL STATE, and
   * it is the one to think about: a client without the workspace-folders
   * capability names its project in `rootUri` or `rootPath` and sends no folders
   * at all. Reading this field alone in that session is not wrong, it is a
   * choice to answer from no root, and the absence is VISIBLE beside the field
   * the client did fill -- which is the whole trade, since the failure it
   * replaced was an author reading an empty list with no way to know the editor
   * had opened anything.
   *
   * TSUDOI SHIPS NO REDUCTION OVER THE THREE, and that is a decision rather than
   * an omission: a folder carries a `name`, and any reduction has to put
   * something there that no client said. An author who wants one writes it, from
   * the two fields below -- `rootPath` has already been refused unless absolute,
   * and `rootUri` is the client's bytes, unread.
   *
   * The name is deliberately not `initialWorkspaceFolders`: every exported name
   * here is public API, so a name that became false would have had to stay.
   */
  readonly workspaceFolders: readonly WorkspaceFolder[];
  /**
   * The project root a client named in `initialize`'s DEPRECATED `rootUri`, or
   * `null` where it named none -- the client's own bytes, with no round trip
   * through a URL parser and no filesystem question asked of it.
   *
   * DEPRECATED BY THE PROTOCOL, NOT BY tsudoi, and carried for exactly that
   * reason: `workspaceFolders` supersedes it and is available only from a client
   * that declares the capability, so this is where everyone else says which
   * project the editor opened. An omitted field and an explicit `null` arrive
   * alike; nothing else is normalised, so a URI naming no local path reaches you
   * as the client spelled it rather than being dropped for being unusable.
   */
  readonly rootUri: string | null;
  /**
   * The ABSOLUTE project root a client named in `initialize`'s DEPRECATED
   * `rootPath`, or `null` -- a PATH rather than a URI, and the one field on this
   * surface that is not a pure mirror.
   *
   * `rootUri` WINS WHERE BOTH ARE SET. That is the protocol's own rule and
   * NOTHING HERE APPLIES IT: precedence is a reading, and both fields reach you
   * unread. An empty `workspaceFolders` beside a filled `rootUri` beside a
   * filled `rootPath` is three statements, and which one answers your question
   * is yours to decide.
   *
   * A NON-ABSOLUTE `rootPath` IS REFUSED AND ARRIVES AS `null`. A relative path
   * is not a root: it resolves only against a working directory THE CLIENT DOES
   * NOT SHARE, so it means one thing to your editor and another to the process
   * answering you. `""` and `"."` are the spellings clients send, neither is
   * absence, and `??` covers neither -- and `pathToFileURL` turns either into
   * `file://` plus WHATEVER DIRECTORY YOUR SERVER WAS LAUNCHED IN, a root no
   * client named and spelled exactly like one that was. That failure is
   * invisible in testing because an editor launches the server FROM the project:
   * nvim spawns it with cwd = root_dir whenever it found a root, so cwd and the
   * project coincide in every session that HAS one and diverge only for the user
   * who has none.
   *
   * WHAT THE REFUSAL COSTS YOU, stated rather than glossed: YOU CANNOT TELL `the
   * client sent no rootPath` FROM `the client sent one we refused`. Both are
   * `null` here, and nothing else on this surface records the difference. What
   * you are spared in exchange is a value you could not have used correctly.
   *
   * THE CHECK IS `isAbsolute`, named because the near misses are the whole
   * point: a null check is not it, and neither is truthiness, since `"."` is
   * truthy and is exactly the value the guard exists for. If you reduce these
   * fields yourself you inherit that check for any path you take from elsewhere
   * -- but not for this one, which has already passed it.
   */
  readonly rootPath: string | null;
}

export type MethodHandler<M extends Method> = (
  context: RequestContext,
  params: MethodMap[M]["params"],
) => MethodMap[M]["result"];

export type TsudoiConfig = {
  methods?: Partial<{
    [M in Method]: MethodHandler<M>;
  }>;
};

/**
 * The config's default export, and it takes nothing. The store is reached
 * through `RequestContext.tsudoi` instead, where it is per-request and live.
 *
 * A PARAMETER ADDED BACK HERE RE-CREATES A FORECLOSED FAILURE, and this is the
 * site where that edit would be made. loadConfig calls this factory BEFORE the
 * connection exists, therefore strictly before `initialize` -- so anything read
 * from a parameter here would capture the pre-initialize value forever,
 * silently, however complete the thing handed in became. With no parameter that
 * is unrepresentable rather than merely documented. Adding a parameter to a
 * callback type is non-breaking, so this is reversible the day something
 * concrete needs it -- but whoever opens it owns this paragraph.
 *
 * NOTHING TYPE-CHECKS AN AUTHOR'S OWN CONFIG AGAINST THIS TYPE. src/config.ts
 * reaches it only through a cast from `unknown`, so an author who writes the old
 * shape gets `undefined` and no diagnostic at all. The documented route -- the
 * README quickstart and examples/tsudoi.config.ts -- annotates a const with this
 * type, which is what makes a shape change a compile error in their file. An
 * author who omits the annotation is not caught and cannot be.
 */
export type TsudoiConfigFactory = () => Promise<TsudoiConfig>;
