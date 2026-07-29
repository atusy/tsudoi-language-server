// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * THE INCOHERENT CONFIG, and it is a fixture rather than something that cannot
 * be written: `completionItem/resolve` fills in an item that only
 * `textDocument/completion` can have produced, and this config supplies no way
 * to produce one.
 *
 * IT TYPE-CHECKS, WHICH IS THE POINT AND IS WHY THIS FILE CAN SIT IN THE REPO AT
 * ALL. `TsudoiConfig.methods` is a `Partial`, so nothing here is a compile
 * error; the requirement is enforced when the config LOADS, and the reason for
 * choosing that stage over the type system is written at the check itself in
 * src/config.ts. A fixture that failed `tsc --noEmit` would break the DoD rather
 * than demonstrate anything.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "completionItem/resolve": (_context: RequestContext, item: CompletionItem) => {
        return Promise.resolve(item);
      },
    },
  });
};
