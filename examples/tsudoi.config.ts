import {
  CompletionItemKind,
  type CompletionItem,
  type CompletionParams,
  type Hover,
  type HoverParams,
} from "vscode-languageserver-protocol";

// The published specifier "@atusy/tsudoi/types" is PBI-7; until then, relative.
import type { RequestContext, Tsudoi, TsudoiConfig } from "../src/types.ts";

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return [];
        }

        // Example: Return a static completion item
        yield [
          {
            label: "HelloWorld",
            kind: CompletionItemKind.Text,
            detail: "Example completion item",
            documentation: "This is a sample completion item.",
          },
        ];

        // Deliberate divergence from the brief's example, which falls off the end here.
        // The declared AsyncGenerator return type requires an explicit return, and per the
        // brief's own MethodMap comment a null result after partial responses is delivered
        // to the client as an empty CompletionItem[].
        return null;
      },

      "textDocument/hover": async (
        context: RequestContext,
        params: HoverParams,
      ): Promise<Hover | null> => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return null;
        }

        // Example: Return a static hover response
        return {
          contents: {
            kind: "markdown",
            value: "This is a sample hover response.",
          },
          range: undefined,
        };
      },
    },
  });
};
