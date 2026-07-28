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
