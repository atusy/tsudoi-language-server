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
  { label: "掃除前", detail: "yielded before the gate" },
];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "yielded last" }];

/**
 * A batch yielded FROM INSIDE THE `finally`. It is not an answer to anything --
 * the request it belongs to is already answered -32800 -- so tsudoi must
 * DISCARD it rather than forward it, and the test asserts exactly that by
 * counting `$/progress`.
 */
export const cleanupYield: CompletionItem[] = [{ label: "後始末中", detail: "yielded in cleanup" }];

/** Written once tsudoi has taken the first chunk and asked for another. */
export const parkedMarker = "completion-cleanup-yields: parked";

/** Cleanup has STARTED -- the generator was closed rather than left suspended. */
export const cleanupEntered = "completion-cleanup-yields: entered cleanup";

/**
 * Cleanup has FINISHED, and it sits AFTER the `finally`'s own yield. That
 * position is the whole fixture: a single `.return()` resolves at that yield
 * with `done: false`, so a drive that stops there leaves every statement below
 * it permanently suspended and this line is never written.
 */
export const cleanupFinished = "completion-cleanup-yields: finished cleanup";

/**
 * Cleanup that YIELDS, which a language server author reaches by flushing
 * records rather than by being clever: a `finally` that empties a buffer through
 * the same channel the body used is an ordinary shape, and it is legal.
 *
 * ONLY ON THE ABORTED PATH, deliberately. On the answering path a batch yielded
 * from the `finally` is an ordinary batch and reaches the client as one, which
 * is correct and is not what this fixture is about; confining the yield to the
 * cancelled path keeps `the request was answered normally` free of it.
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

          process.stderr.write(`${parkedMarker}\n`);

          // Awaited polling, not a busy loop: awaiting hands the event loop back
          // so the server can process what opens this gate or cancels it.
          while (gateClosed() && !context.signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }

          yield returnedItems;
        } finally {
          if (context.signal.aborted) {
            process.stderr.write(`${cleanupEntered}\n`);
            yield cleanupYield;
            process.stderr.write(`${cleanupFinished}\n`);
          }
        }
      },
    },
  });
};
