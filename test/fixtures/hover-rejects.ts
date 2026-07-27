// Relative with .ts, and Bun-free: deno executes this file too.
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/** Distinctive enough that finding it on stderr cannot be a coincidence. */
export const rejectMessage = "hover-rejects fixture: 意図的な失敗";

/** As in hover-throws: the handler recovers, so the second answer is an answer. */
export const recoveredHover: Hover = {
  contents: { kind: "markdown", value: "二度目は答えます。" },
};

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  let calls = 0;
  return Promise.resolve({
    methods: {
      // Rejects rather than throwing: the failure arrives one turn of the event
      // loop later, which is a different code path through the dispatch.
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        calls += 1;
        return calls === 1
          ? Promise.reject(new Error(rejectMessage))
          : Promise.resolve(recoveredHover);
      },
    },
  });
};
