// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type {
  CompletionItem,
  CompletionParams,
  Hover,
  HoverParams,
} from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

export const hoverEntered = "throws-on-cancel: hover entered";
export const completionEntered = "throws-on-cancel: completion entered";

/** Non-ASCII so a leaked stack is recognisable as this fixture's and no other. */
export const throwMessage = "中断された取得に失敗しました";

/** Resolves the moment the signal aborts, however late the listener is added. */
function aborted(context: RequestContext): Promise<void> {
  return new Promise((resolve) => {
    if (context.signal.aborted) {
      resolve();
      return;
    }
    context.signal.addEventListener("abort", () => resolve(), { once: true });
  });
}

/**
 * Both handlers fail the way an aborted fetch fails: they reject BECAUSE they
 * were cancelled. Reporting that as a handler failure is what this fixture
 * exists to forbid.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": async (
        context: RequestContext,
        _params: HoverParams,
      ): Promise<Hover> => {
        process.stderr.write(`${hoverEntered}\n`);
        await aborted(context);
        throw new Error(throwMessage);
      },
      "textDocument/completion": async function* (
        context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        process.stderr.write(`${completionEntered}\n`);
        await aborted(context);
        throw new Error(throwMessage);
      },
    },
  });
};
