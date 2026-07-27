// Relative with .ts, and Bun-free: deno executes this file too.
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/**
 * The Hover this config answers with, whatever is asked. Written here as the
 * literal the test compares against, so anything tsudoi does to contents or
 * range on the way out shows up as an inequality rather than as a plausible
 * looking response.
 *
 * The value is Japanese because hover contents are markdown a human reads, and
 * a payload that survives ASCII proves nothing about the byte counting between
 * the handler and the screen.
 */
export const fixedHover: Hover = {
  contents: { kind: "markdown", value: "**識別子** の説明です。\n\n二行目も日本語。" },
  range: { start: { line: 1, character: 2 }, end: { line: 1, character: 5 } },
};

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        return Promise.resolve(fixedHover);
      },
    },
  });
};
