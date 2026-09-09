import type {
  CompletionItem,
  CompletionList,
  Command,
} from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext, TsudoiConfig } from "@atusy/tsudoi-language-server/types";
import process from "node:process";

export const completionPartial: CompletionItem[] = [{ label: "途中" }];
export const completionFinal: CompletionItem[] = [{ label: "最後" }];
export const actionPartial: Command[] = [{ title: "途中", command: "test.partial" }];
export const actionFinal: Command[] = [{ title: "最後", command: "test.final" }];

export const completionList: CompletionList = {
  isIncomplete: true,
  itemDefaults: { data: { source: "final" }, insertTextFormat: 2 },
  items: completionFinal,
};
Object.freeze(completionList.items);
Object.freeze(completionList);

export const parkedMarker = "stream-final-results: parked";
export const cleanupMarker = "stream-final-results: released";

async function* batches<T>(context: RequestContext, uri: string, partial: T[], final: T[]) {
  const mode = uri.slice(uri.lastIndexOf("/") + 1);
  if (mode.startsWith("yield-")) {
    yield mode === "yield-empty" ? [] : partial;
  }
  if (mode === "yield-cancel") {
    try {
      process.stderr.write(`${parkedMarker}\n`);
      if (!context.signal.aborted) {
        await new Promise<void>((resolve) => {
          context.signal.addEventListener("abort", () => resolve(), { once: true });
        });
      }
      return final;
    } finally {
      process.stderr.write(`${cleanupMarker}\n`);
    }
  }
  if (mode.endsWith("invalid")) {
    return 42 as unknown as T[];
  }
  if (mode.endsWith("wrong-list")) {
    return completionList as unknown as T[];
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
    // COMPLETENESS RULING: array cases are complete; list cases model a truncated search.
    "textDocument/completion": async function* (context, params) {
      const mode = params.textDocument.uri.slice(params.textDocument.uri.lastIndexOf("/") + 1);
      if (mode.endsWith("list")) {
        if (mode.startsWith("yield-")) {
          yield completionPartial;
        }
        if (mode === "yield-invalid-list") {
          return { items: [] } as unknown as CompletionList;
        }
        return mode.includes("empty")
          ? { ...completionList, items: [] }
          : mode.includes("complete")
            ? { ...completionList, isIncomplete: false }
            : completionList;
      }
      return yield* batches(context, params.textDocument.uri, completionPartial, completionFinal);
    },
    "textDocument/codeAction": async function* (context, params) {
      return yield* batches(context, params.textDocument.uri, actionPartial, actionFinal);
    },
  },
});
