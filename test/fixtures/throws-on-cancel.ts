// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionParams, Hover, HoverParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

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
export default (): Promise<TsudoiConfig> => {
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
      // COMPLETENESS RULING: NO CLAIM IS MADE, BY CONSTRUCTION RATHER THAN BY
      // CHOICE. This handler yields nothing and never returns -- it parks until
      // the abort and then throws -- so no result of any shape reaches the wire
      // and the specification's array equivalence has nothing to apply to. The
      // ruling is recorded so the enumeration covers every completion handler
      // rather than only the ones that answer.
      //
      // IT DRAWS `eslint(require-yield)` AND THAT IS THE FIXTURE WORKING, said
      // here so the warning is not read as an oversight and silenced. A
      // generator that never yields is exactly what this file is for. THE
      // WARNING COUNT IS UNCHANGED AT ONE: it used to be raised by
      // completion-throws.ts, whose throwing generator merged into a handler
      // that does yield when the shape moved at Sprint 43.
      "textDocument/completion": async function* (
        context: RequestContext,
        _params: CompletionParams,
      ) {
        process.stderr.write(`${completionEntered}\n`);
        await aborted(context);
        throw new Error(throwMessage);
      },
    },
  });
};
