// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "失敗前", detail: "yielded before the gate" },
];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "yielded last" }];

/** The batch the `finally` yields before it fails. */
export const cleanupYield: CompletionItem[] = [{ label: "後始末中", detail: "yielded in cleanup" }];

/** Cleanup has STARTED -- the generator was closed rather than left suspended. */
export const cleanupEntered = "completion-cleanup-yields-then-throws: entered cleanup";

/**
 * The config author's OWN message. Non-ASCII on purpose: a report that mangled
 * it would say this in replacement characters, which no assertion on tsudoi's
 * own prefix could see.
 */
export const cleanupThrowMessage = "後始末に失敗しました (yields-then-throws)";

/** Spelled through a named function because a bare `throw` inside `finally`
 * trips no-unsafe-finally -- a rule that is right in general and describes
 * exactly the case under test here, so the intent is named rather than
 * silenced. */
function failCleanup(): never {
  throw new Error(cleanupThrowMessage);
}

/**
 * Cleanup that fails AFTER yielding -- the one rejection only a DRAIN can meet.
 *
 * A `finally` that throws before yielding rejects the `.return()` itself, which
 * is a case tsudoi already handles. This one throws from a
 * statement that is only ever reached by a `.next()` PULLED DURING CLEANUP, so
 * its rejection arrives on a promise that did not exist until the drain created
 * it. Unhandled, that rejection kills the process -- strictly worse than the
 * unfinished cleanup the drain exists to fix -- and no other fixture can reach
 * it.
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

          // Awaited polling, not a busy loop: awaiting hands the event loop back
          // so the server can process what opens this gate or cancels it.
          while (gateClosed() && !context.signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }

          yield returnedItems;
        } finally {
          // ONLY ON THE ABORTED PATH: on the answering path this generator must
          // finish normally, or the assertion that the session goes on serving
          // would be measuring this failure instead.
          if (context.signal.aborted) {
            process.stderr.write(`${cleanupEntered}\n`);
            yield cleanupYield;
            failCleanup();
          }
        }
      },
    },
  });
};
