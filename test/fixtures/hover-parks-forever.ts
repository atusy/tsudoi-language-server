// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** Written once the handler is provably inside the wait that never settles. */
export const parkedMarker = "hover-parks-forever: parked";

/**
 * What this handler would have answered if its wait had ever settled. The client
 * must see NONE of it: mixed script for the reason
 * test/fixtures/hover-ignores-signal.ts gives, since an encoder escaping the
 * Japanese as \uXXXX would walk past a search for the raw characters.
 */
export const asciiHalf = "never-answered";
export const label = `決して届かない / ${asciiHalf}`;

/**
 * A HOVER HANDLER PARKED INSIDE ITS OWN `await`, which is the awaited-once
 * drive's version of test/fixtures/completion-ignores-signal.ts.
 *
 * IT IS NOT THE SAME FIXTURE AS hover-ignores-signal.ts, AND THE DIFFERENCE IS
 * THE WHOLE POINT: that one's wait SETTLES, so a drive that simply awaits the
 * handler reaches its epilogue a moment late and suppresses the answer there.
 * This one's never settles, so there is no later to reach -- a drive with no
 * moment to ask about cancellation in answers the client NOTHING AT ALL, which
 * is worse than any answer it could have given.
 *
 * ONE FETCH WITHOUT A TIMEOUT IS ALL IT TAKES, which is why the shape is worth a
 * fixture: nothing here is contrived beyond making the wait explicit.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": async (
        _context: RequestContext,
        _params: HoverParams,
      ): Promise<Hover> => {
        process.stderr.write(`${parkedMarker}\n`);
        // NO SIGNAL, NO TIMEOUT, NO GATE. A cooperative handler would race this
        // against `context.signal`; this one is the handler that did not, which
        // is the only case that can measure what tsudoi does alone.
        await new Promise(() => {});
        return { contents: { kind: "markdown", value: label } };
      },
    },
  });
};
