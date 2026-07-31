// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** The buffer text the test writes to let a LATER completion past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "失敗前", detail: "yielded before the wait" },
];
export const returnedItems: CompletionItem[] = [{ label: "二度目", detail: "answered later" }];

/** Written once tsudoi has taken the first chunk and asked for another. */
export const parkedMarker = "completion-ignores-signal-rejects: parked";

/** The config author's cleanup, which runs only once the await below settles. */
export const cleanupMarker = "completion-ignores-signal-rejects: released";

/**
 * How long the wait runs before it FAILS. Long enough that the -32800 provably
 * overtakes it -- the response is asserted while this is still pending -- and
 * short enough that the test does not sit on it.
 */
export const rejectDelayMs = 300;

/**
 * A handler that ignores its signal and whose wait REJECTS -- the case that
 * decides whether the abandoned pull's rejection is handled.
 *
 * WHY IT CANNOT BE THE SAME FIXTURE AS THE ONE THAT NEVER SETTLES: a promise
 * that never settles never rejects, so it can prove the -32800 and NOTHING about
 * what happens to the pull the drive walked away from. Only a rejection can. If
 * that pull is left unhandled, the runtime destroys the whole session -- and the
 * cure would be worse than the disease it was written for.
 *
 * THE GATE IS FOR A LATER REQUEST, not this one: this handler is not
 * releasable, and the gate is what lets a SECOND completion answer normally so
 * `the session survived` is a claim about it serving rather than about it merely
 * not printing anything.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE on the path that answers, NO CLAIM on the
      // cancelled one. `returnedItems` is a module constant and the params are
      // read only to poll the gate, so an answer that arrives is final. The
      // cancelled path -- the one this fixture exists for -- is answered -32800
      // with no result, so no completeness claim is reachable there.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        const gateClosed = (): boolean =>
          context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen;

        try {
          yield beforeGate;

          // The gate decides WHICH request this is. Closed, this is the request
          // the test cancels, and it parks in a wait it will not survive; open,
          // it is the later one that must answer normally.
          if (gateClosed()) {
            process.stderr.write(`${parkedMarker}\n`);

            // IGNORES THE SIGNAL, then FAILS. A config author writes this with
            // one un-aborted request that times out at its own layer.
            await new Promise((_resolve, reject) => {
              setTimeout(() => {
                reject(new Error("completion-ignores-signal-rejects: the wait failed"));
              }, rejectDelayMs);
            });
          }

          yield returnedItems;
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
