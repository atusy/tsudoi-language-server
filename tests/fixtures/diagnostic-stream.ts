import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

export const report = { kind: "full" as const, resultId: "current-1", items: [] };
export const partial = {
  relatedDocuments: { "file:///related.ts": { kind: "full" as const, items: [] } },
};

export default (): TsudoiConfig => ({
  methods: {
    "textDocument/diagnostic": async function* () {
      yield report;
      yield partial;
    },
  },
});
