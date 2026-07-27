// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, Tsudoi, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "掃除前", detail: "yielded before the gate" },
];
export const afterGate: CompletionItem[] = [{ label: "掃除後", detail: "yielded after the gate" }];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "returned" }];

/**
 * Written once tsudoi has TAKEN the first chunk and asked for another. A test
 * cancelling mid-stream in aggregation mode has no `$/progress` to wait for, so
 * this is what makes `provably mid-stream` sayable in both dispatch modes.
 */
export const parkedMarker = "completion-cleanup: parked";

/** The config author's cleanup, and the only evidence that it ran at all. */
export const cleanupMarker = "completion-cleanup: released";

/**
 * Yields, parks, then yields AGAIN and returns -- and it yields that second
 * chunk whether or not it was cancelled, which is what leaves the generator
 * suspended at a `yield` when tsudoi decides to abandon it. That shape is the
 * one an early close can reach: a generator parked inside its own `await`
 * queues `return()` behind the pending `next()` instead.
 *
 * The `finally` is the whole user story. A config author cannot watch it run --
 * the request is answered -32800 either way -- so nothing but this record says
 * whether the resources the request held were released or leaked.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
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

          yield afterGate;
          return returnedItems;
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
