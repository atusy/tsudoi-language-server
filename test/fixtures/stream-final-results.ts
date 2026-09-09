import type { CompletionItem, Command } from "@atusy/tsudoi-language-server/deps/protocol";
import type { TsudoiConfig } from "@atusy/tsudoi-language-server/types";

export const completionPartial: CompletionItem[] = [{ label: "途中" }];
export const completionFinal: CompletionItem[] = [{ label: "最後" }];
export const actionPartial: Command[] = [{ title: "途中", command: "test.partial" }];
export const actionFinal: Command[] = [{ title: "最後", command: "test.final" }];

async function* batches<T>(uri: string, partial: T[], final: T[]) {
  const mode = uri.slice(uri.lastIndexOf("/") + 1);
  if (mode.startsWith("yield-")) {
    yield mode === "yield-empty" ? [] : partial;
  }
  if (mode.endsWith("null")) {
    return null;
  }
  if (mode.endsWith("void") || mode === "yield-empty") {
    return;
  }
  if (mode.endsWith("empty")) {
    return [];
  }
  return final;
}

export default (): TsudoiConfig => ({
  methods: {
    // COMPLETENESS RULING: complete; these two constants are the entire candidate set.
    "textDocument/completion": async function* (_context, params) {
      return yield* batches(params.textDocument.uri, completionPartial, completionFinal);
    },
    "textDocument/codeAction": async function* (_context, params) {
      return yield* batches(params.textDocument.uri, actionPartial, actionFinal);
    },
  },
});
