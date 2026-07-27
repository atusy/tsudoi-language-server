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
