// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

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

/** Everything after the answer, and the `finally` is the whole user story. */
async function* rest(
  context: RequestContext,
  params: CompletionParams,
): AsyncGenerator<CompletionItem[], undefined, null> {
  try {
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
    yield returnedItems;
    return undefined;
  } finally {
    process.stderr.write(`${cleanupMarker}\n`);
  }
}

/**
 * Answers, parks, then streams AGAIN -- and it yields that second
 * chunk whether or not it was cancelled, which is what leaves the generator
 * suspended at a `yield` when tsudoi decides to abandon it. That shape is the
 * one an early close can reach: a generator parked inside its own `await`
 * queues `return()` behind the pending `next()` instead.
 *
 * The `finally` is the whole user story. A config author cannot watch it run --
 * the request is answered -32800 either way -- so nothing but this record says
 * whether the resources the request held were released or leaked.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE on the path that answers, NO CLAIM on the
      // cancelled one. `returnedItems` is a module constant and the params are
      // read only to poll the gate. The subject of this fixture is the
      // `finally` -- whether a config author's cleanup RUNS -- and that is
      // orthogonal to whether the set it was building was final, which is why
      // the ruling can be made here without weakening anything the tests say.
      "textDocument/completion": (context: RequestContext, params: CompletionParams) =>
        Promise.resolve([beforeGate, rest(context, params)] as const),
    },
  });
};
