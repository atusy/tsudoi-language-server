// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "失敗前", detail: "yielded before the gate" },
];
export const afterGate: CompletionItem[] = [{ label: "失敗後", detail: "yielded after the gate" }];
export const returnedItems: CompletionItem[] = [{ label: "二度目", detail: "answered later" }];

/** Written once tsudoi has taken the first chunk and asked for another. */
export const parkedMarker = "completion-cleanup-throws: parked";

/**
 * Written before the failure, so a test can wait for cleanup to have RUN
 * without asserting anything about how tsudoi reported it -- that report is a
 * separate claim, and bundling the two would leave one of them undefended.
 */
export const cleanupMarker = "completion-cleanup-throws: releasing";

/** Non-ASCII so a line carrying it is recognisably this fixture's and no other. */
export const cleanupThrowMessage = "後始末に失敗しました: 解放できません";

/** Spelled through a named function because a bare `throw` inside `finally`
 * trips no-unsafe-finally -- a rule that is right in general and describes
 * exactly the case under test here, so the intent is named rather than
 * silenced. */
function failCleanup(): never {
  throw new Error(cleanupThrowMessage);
}

/**
 * Cleanup that fails, but only for a request that was ABANDONED: tsudoi closes
 * a generator from its abort path alone, so `context.signal.aborted` is what
 * tells the two apart. A finally that always threw could not answer a later
 * completion, and `the server survived` would be unsayable in the one session
 * that had the failure.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE on the path that answers, NO CLAIM on the
      // cancelled one. `returnedItems` is a module constant and the params are
      // read only to poll the gate, so nothing the user typed can change it --
      // and `a session whose cleanup threw answers a later completion normally`
      // is a claim about that constant ARRIVING, never about the set being
      // partial.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        // The `try` opens before the FIRST yield since Sprint 43: every batch is
        // inside the generator now, so the author's cleanup covers all of it
        // rather than everything after the answer.
        try {
          yield beforeGate;

          process.stderr.write(`${parkedMarker}\n`);

          // Awaited polling, not a busy loop: awaiting hands the event loop back
          // so the server can process what opens this gate or cancels it.
          while (
            context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen &&
            !context.signal.aborted
          ) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }

          // Yielded whether or not it was cancelled: this is what leaves the
          // generator SUSPENDED AT A YIELD for tsudoi to close, rather than
          // finishing on its own and never reaching the abort branch at all.
          yield afterGate;
          yield returnedItems;
        } finally {
          if (context.signal.aborted) {
            process.stderr.write(`${cleanupMarker}\n`);
            failCleanup();
          }
        }
      },
    },
  });
};
