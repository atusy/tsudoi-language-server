import { completePath, resolvePathStat } from "@atusy/tsudoi-completion-path";
import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";
import type { TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import { trailingWhitespaceDiagnostics } from "./diagnostic-trailing-whitespace.ts";
import { removeTrailingWhitespace } from "./formatting-trailing-whitespace.ts";

// The factory annotation checks the config and supplies handler parameter types.
const config: TsudoiConfigFactory = () => {
  return Promise.resolve({
    methods: {
      // The final CompletionList requests a fresh listing when further typing can
      // reach a directory the answer did not list.
      // A missing document yields nothing, so the response is null rather than [].
      "textDocument/completion": async function* (context, params) {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return;
        }

        {
          // return yield* forwards batches, the final result and cancellation.
          // The client controls popup triggers, insertion/replacement and cross-source
          // deduplication. Workspace paths require workspaceFolders from the client.
          return yield* completePath(context, params);
        }
      },

      "textDocument/hover": hoverWordnet,

      "textDocument/diagnostic": trailingWhitespaceDiagnostics,

      // Formatting removes the whitespace reported by the diagnostic handler.
      "textDocument/formatting": removeTrailingWhitespace,

      // Load file metadata only when the client resolves an item. This requires
      // the completion handler above.
      "completionItem/resolve": resolvePathStat,
    },
  });
};

export default config;
