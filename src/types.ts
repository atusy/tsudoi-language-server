// THE PUBLISHED SURFACE. package.json maps `@atusy/tsudoi/types` here, and this
// is the only path a config author outside the repo can reach by bare specifier,
// so every exported name below is public API and renaming one breaks configs we
// cannot see. The reasoning for keeping the package types-only lives on the
// `//exports` key in package.json -- oxfmt sorts unknown keys to the tail of the
// file, so it sits at the bottom rather than beside `exports`.
import type {
  CompletionItem,
  CompletionParams,
  Hover,
  HoverParams,
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
