// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/** Non-ASCII, so a diagnostic carrying it is recognisably this fixture's. */
export const rejectionMessage = "誰も受け取らない拒否";

export const items: CompletionItem[] = [{ label: "届かない", detail: "never answered" }];

/**
 * THE POSITIVE CONTROL for the exit-code measurement, and nothing else.
 *
 * A floating rejection with no handler attached kills the process on both
 * runtimes -- which is why tsudoi may never produce one, and why a session's own
 * exit code is where an unhandled rejection can be asserted without it being
 * laundered into whichever test happens to run next. Without this fixture,
 * `exit code 0` would be a measurement never shown capable of observing a death.
 *
 * Deliberately unhandled. This is the defect, written on purpose.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        Promise.reject(new Error(rejectionMessage));
        yield items;
        return null;
      },
    },
  });
};
