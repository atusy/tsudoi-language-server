// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/** Written at entry, so a test can cancel a handler that is provably running. */
export const enteredMarker = "hover-ignores-signal: entered";

/**
 * Mixed script on purpose. The client must see NEITHER half, and the ASCII
 * half is what makes the absence honest: an encoder that escaped the Japanese
 * as \uXXXX would walk straight past a search for the raw characters.
 */
export const asciiHalf = "discarded-candidate";
export const label = `破棄される候補 / ${asciiHalf}`;

export const ignoredHover: Hover = { contents: { kind: "markdown", value: label } };

/** Long enough that the cancellation lands while the handler is still working. */
const workMs = 300;

/**
 * Never mentions context.signal, and runs to completion regardless. Suppressing
 * this answer cannot be done by asking the handler, which is the point.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": async (
        _context: RequestContext,
        _params: HoverParams,
      ): Promise<Hover> => {
        process.stderr.write(`${enteredMarker}\n`);
        await new Promise((resolve) => setTimeout(resolve, workMs));
        return ignoredHover;
      },
    },
  });
};
