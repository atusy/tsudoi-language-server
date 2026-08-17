import { completePath, resolvePathStat } from "@atusy/tsudoi-completion-path";
import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";

const config: TsudoiConfigFactory = async () => ({
  methods: {
    "textDocument/completion": async function* (context, params) {
      yield* completePath(context, params);
    },
    "completionItem/resolve": resolvePathStat,
    "textDocument/hover": hoverWordnet,
  },
});

export default config;
