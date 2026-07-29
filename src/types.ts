// The published type surface: package.json maps `@atusy/tsudoi/types` here, so
// every exported name below is public API and renaming one breaks configs we
// cannot see. What ships is the compiled dist/types.d.ts, not this file.
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
// Imported as well as re-exported because `export ... from` publishes a name
// without binding it here, and DocumentStore below needs to NAME it.
import type { TextDocument } from "vscode-languageserver-textdocument";

/**
 * EVERY LSP TYPE, so a config author never has to install the protocol package
 * to name something tsudoi's own surface did not think to publish. The set is
 * upstream's rather than curated here, so it grows with the dependency and no
 * name has to be argued for one at a time.
 *
 * TYPES ONLY, AND THAT IS THE WHOLE OF THE RESTRAINT. `export *` would publish
 * 287 runtime names, among them `createProtocolConnection` -- which would let a
 * config build its own connection and bypass tsudoi entirely -- and 93 Request
 * and Notification constants for methods tsudoi does not implement, so the
 * surface would advertise capabilities the server does not have. `export type *`
 * publishes none of them: naming one as a value is TS1362.
 *
 * VALUES STAY EXPLICIT for the same reason, and these two are values rather than
 * types because each is a namespace of const members read at run time. Writing
 * them as types would emit a perfect dist/types.d.ts beside a dist/types.js
 * exporting nothing, every type-check would stay green, and a config author would
 * get `undefined` at their first completion. test/published-artifacts.test.ts is
 * the only thing that sees the difference.
 *
 * THE BARE SPECIFIER, NOT `/node`: with `/node`, vscode-jsonrpc's node entry
 * needs @types/node (TS2591 for child_process, net, worker_threads; TS2503 for
 * namespace NodeJS), which a config author may never have installed. Measured to
 * survive the star: `export type *` from the bare specifier type-checks with
 * `types: []` and `skipLibCheck` OFF, which is what
 * test/installed-without-node-types.test.ts sets.
 */
export type * from "vscode-languageserver-protocol";
export { CompletionItemKind, DiagnosticSeverity } from "vscode-languageserver-protocol";

/**
 * The document a config author receives, and it is upstream's: `getText(range)`,
 * `positionAt`, `offsetAt` and `lineCount` come with it.
 *
 * THE SPECIFIER IS THE POINT, AND THE OBVIOUS SIMPLIFICATION IS THE BUG.
 * `vscode-languageserver-protocol` re-exports a `TextDocument` of its own --
 * same seven members, no `update`, marked `@deprecated` upstream. Re-exporting
 * that one instead would be one line, would add no dependency, and would
 * compile. It is the wrong type; the identity probe in
 * test/published-artifacts.test.ts is what catches the substitution.
 *
 * TYPE-ONLY IS A RULING. Upstream's `TextDocument` is a namespace carrying
 * `create`, `update` and `applyEdits`, so `export {` would work -- but tsudoi
 * constructs documents and an author only ever receives one. Publishing the
 * namespace would publish three entry points this project must then keep.
 * The cost: an author unit-testing a handler must build a document, so they
 * install vscode-languageserver-textdocument themselves. Reverse this on
 * evidence that authors are doing so, not on the prediction that they might.
 *
 * `Range` is deliberately not exported beside it: `getText` takes a structural
 * `{ start, end }`, so an author writes an object literal and imports nothing.
 */
export type { TextDocument } from "vscode-languageserver-textdocument";

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
  // yield結果はpartial responseとしてクライアントに返す
  // returnしたらpartial response終了とみなす。partial responseが存在していてかつ、resultがnullの場合は、空のCompletionItem[]をクライアントに返す
  // クライアントがparital responseをサポートしない場合やpartialResultTokenがない場合は、yieldやreturnを1つのCompletionItem[]にまとめて返す
  "textDocument/completion": {
    params: CompletionParams;
    result: AsyncGenerator<CompletionItem[], CompletionItem[] | null, void>;
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
   * Awaited once. Not generator-driven despite `DocumentDiagnosticRequest`
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
   * ONE FOLDER IS SYNTHESISED when a session opens with no `workspaceFolders`,
   * from `rootUri` or failing that `rootPath` -- the deprecated spellings a
   * client without the workspace-folders capability still has. It appears as an
   * ordinary member: nothing marks it, and a later add or remove applies to it
   * like any other. Its `name` is THE FULL PATH, since that is what can be
   * derived without inventing anything, so a `name` here is not guaranteed to be
   * a label the user would recognise. A client naming none of the three leaves
   * this empty; a root the client did not name is never synthesised.
   *
   * The name is deliberately not `initialWorkspaceFolders`: every exported name
   * here is public API, so a name that became false would have had to stay.
   */
  readonly workspaceFolders: readonly WorkspaceFolder[];
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
