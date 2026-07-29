// THE PUBLISHED TYPE SURFACE. package.json maps `@atusy/tsudoi/types` here, and
// this is the only path a config author outside the repo can reach by bare
// specifier, so every exported name below is public API and renaming one breaks
// configs we cannot see.
//
// What ships is the COMPILED dist/types.d.ts, not this file: since sprint 10 the
// package publishes dist/ alone, so that a deno user can run the CLI from
// node_modules at all. The shape of that surface and the reason for every arm of
// the exports map are asserted in test/package-shape.test.ts, which is where a
// decision about a file that cannot carry comments lives.
import type {
  CompletionItem,
  CompletionParams,
  Hover,
  HoverParams,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";

/**
 * THE PROTOCOL NAMES A CONFIG AUTHOR GETS FROM HERE, so that standing up a
 * server needs ONE package and a config never names one its author did not
 * install.
 *
 * WHY EXACTLY THESE, measured against examples/ rather than chosen for
 * convenience: they are the protocol names the examples actually use.
 * completion-path.ts uses CompletionItem, CompletionItemKind, CompletionParams,
 * MarkupContent, Position and WorkspaceFolder; hover-wordnet.ts adds Hover and
 * HoverParams; tsudoi.config.ts adds none of its own. This is the minimum that
 * lets the examples import no protocol package, not a convenience dump.
 *
 * THE RULE FOR A NINTH: adding one is a deliberate act with a reason, because
 * every name exported from this file is public API and renaming or dropping one
 * breaks configs we cannot see. The reason belongs here, beside the name. What
 * a ninth name must NOT be is `a config author might want it` -- that argument
 * has no end, and the set it produces is the dependency's whole surface
 * re-published under names this project would then have to keep.
 *
 * CompletionItemKind IS RE-EXPORTED AS A VALUE, and the distinction is not
 * stylistic: it is an enum, so a handler reads CompletionItemKind.File at RUN
 * TIME. `export type` here would emit a perfect dist/types.d.ts beside a
 * dist/types.js that exports nothing, and every type-check in this repo would
 * stay green while a config author got `undefined` at their first completion.
 * test/published-artifacts.test.ts asserts the runtime namespace of the
 * PUBLISHED module, which is the only arm that can see that difference --
 * measured: making this line `export type` reddens that one assertion and
 * leaves every other test in that file green.
 *
 * WHY THE BARE SPECIFIER AND NOT `/node`, recorded here because this is where
 * the edit that undoes it would be made, and because an unrecorded specifier
 * decision is the defect that produced this work in the first place.
 *
 * MEASURED at vscode-languageserver-protocol 3.18.2, which pins vscode-jsonrpc
 * 9.0.1 and vscode-languageserver-types 3.18.0 exactly. In a project with
 * `types: []` and no @types/node reachable at all, importing CompletionItemKind
 * from the BARE specifier exits 0, while importing it from
 * `vscode-languageserver-protocol/node` exits 1 with eleven diagnostics: TS2591
 * for `child_process`, `net` and `worker_threads` out of
 * vscode-jsonrpc/lib/node/main.d.ts, and TS2503 for namespace `NodeJS` out of
 * that file AND vscode-languageserver-protocol/lib/node/main.d.ts. So the bare
 * specifier is what keeps this subpath usable by a config author who never
 * installed node's types.
 *
 * THE CONDITION THAT MEASUREMENT DEPENDS ON, and it is the half that is easy to
 * drop: `skipLibCheck` must be OFF. It is tsc's default, so a config author who
 * writes no tsconfig of their own is protected by this line -- but with
 * skipLibCheck ON, both specifiers exit 0 and the difference vanishes entirely.
 *
 * NOTHING IN THE SUITE ASSERTS ANY OF THIS, stated plainly rather than left to
 * be assumed from the paragraphs above: the consumer probes in
 * test/helpers/typecheck.ts set skipLibCheck: true, which is exactly the
 * condition under which the two specifiers are indistinguishable. No existing
 * probe could redden if this line were changed to `/node`. Until one with
 * skipLibCheck OFF exists, this paragraph is the whole of the defence.
 */
export { CompletionItemKind } from "vscode-languageserver-protocol";
export type {
  CompletionItem,
  CompletionParams,
  Hover,
  HoverParams,
  MarkupContent,
  Position,
  WorkspaceFolder,
} from "vscode-languageserver-protocol";

export interface TextDocument {
  readonly uri: string;
  readonly languageId: string;
  readonly version: number;

  getText(): string;
}

// will expose a function to subscribe/unsubscribe events such as receiving notifications, requests, and responses from the client or submitting them to the client
export interface DocumentStore {
  get(uri: string): TextDocument | undefined;
  values(): Iterable<TextDocument>;
}

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
}

export type Method = keyof MethodMap;

export interface RequestContext {
  readonly signal: AbortSignal;
  readonly tsudoi: Tsudoi;
  /**
   * The workspace folders this request started on -- what the client stated at
   * `initialize`, plus every change it has notified since -- or an EMPTY LIST
   * when it has named none.
   *
   * Absence is a state a config author must be able to SEE: it is never
   * defaulted to the working directory, to `/`, or to anything else this
   * process could invent. An empty list means the editor opened no workspace,
   * and answering from a root nobody named is the failure this shape refuses.
   *
   * Both of the protocol's absent states -- the field omitted and the field
   * sent as null -- arrive here as the same empty list, so a config author
   * never has to know there were two.
   *
   * WHAT IT IS A SNAPSHOT OF, stated at the type because the answer CHANGED
   * and `snapshot` alone would let a reader assume the old one: it is a
   * snapshot of REQUEST START, not of `initialize`. tsudoi handles
   * `workspace/didChangeWorkspaceFolders`, so a folder the user adds or removes
   * mid-session reaches the NEXT request -- while a request already in flight
   * keeps the list it began with. That is what stops one response carrying
   * items attributed to a root that no longer exists beside items from one that
   * just appeared, and it matters because a completion handler may stream over
   * time rather than answer at once.
   *
   * MIRRORED, NOT INTERPRETED. What arrives is what the client said, and
   * nothing here normalises it: two spellings of one directory are TWO folders,
   * and a URI added twice is held twice, because this list is the CLIENT's
   * state rather than the filesystem's. MEASURED against nvim, which accepts
   * `…/plain` and `…/plain/` as different folders and removes them separately
   * -- so a normalising implementation would delete a folder the client still
   * holds.
   *
   * THE MIRROR HOLDS ON REMOVE TOO, which is the half that is easy to assume
   * rather than read: a URI held twice and removed ONCE still appears here
   * ONCE. N removals take N copies, whether they arrive in N events or in one
   * event carrying N entries. Pinned by two tests in test/workspace.test.ts,
   * one per arrival shape; see src/workspace.ts for which mistake each catches.
   *
   * WHICH FIELD THE CLIENT SAID IT IN IS NOT VISIBLE HERE, and that is the one
   * place this list is more than a mirror. A client may name its project in
   * `workspaceFolders`, in `rootUri` or in `rootPath`, the last two being the
   * deprecated spellings a client without the workspace-folders capability
   * still has -- and only the first is a list. So when a session opens with no
   * `workspaceFolders`, ONE FOLDER IS SYNTHESISED from `rootUri`, or failing
   * that from `rootPath`, and it appears here as an ORDINARY MEMBER: nothing
   * marks it, and a later add or remove applies to it like any other. Its
   * `name` is THE FULL PATH, since that is what can be derived from what the
   * client sent without inventing anything -- so a `name` here is not
   * guaranteed to be a label the user would recognise.
   *
   * WHAT IS NEVER SYNTHESISED IS A ROOT THE CLIENT DID NOT NAME. A client
   * naming none of the three leaves this EMPTY -- never cwd, never `/`.
   *
   * The name is deliberately not `initialWorkspaceFolders`. It was refused
   * BEFORE tracking landed, and tracking is why: every exported name here is
   * public API, so a name that became false would have had to stay.
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

export type TsudoiConfigFactory = (tsudoi: Tsudoi) => Promise<TsudoiConfig>;
