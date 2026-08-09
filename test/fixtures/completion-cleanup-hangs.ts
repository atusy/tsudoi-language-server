// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * The buffer text that releases BOTH gates: the handler's own park, and the
 * cleanup below. One text, because the test needs to hold cleanup open across
 * the moment the response arrives and then release it on demand -- which is
 * what turns `cleanup did not delay the response` into a claim about ORDER
 * rather than about how fast this machine happens to be.
 */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "停止前", detail: "yielded before the gate" },
];
export const afterGate: CompletionItem[] = [{ label: "停止後", detail: "yielded after the gate" }];
export const returnedItems: CompletionItem[] = [{ label: "二度目", detail: "answered later" }];

export const parkedMarker = "completion-cleanup-hangs: parked";

export const cleanupEntered = "completion-cleanup-hangs: entered cleanup";

export const cleanupFinished = "completion-cleanup-hangs: finished cleanup";

/**
 * Cleanup that never settles until the test says so. A config author can write
 * this by accident with one await on something that never resolves, and tsudoi
 * must still answer the client: awaiting `return()` here would mean the -32800
 * is never sent at all.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE on the path that answers, NO CLAIM on the
      // cancelled one -- `returnedItems` is a module constant and the params are
      // read only to poll the gate, and a cancelled request carries no result.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        const gateClosed = (): boolean =>
          context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen;

        // The `try` opens before the FIRST yield, deliberately: every batch is
        // inside the generator, so the author's cleanup covers all of it rather
        // than only what follows an answer.
        try {
          yield beforeGate;

          process.stderr.write(`${parkedMarker}\n`);

          // Awaited polling, not a busy loop: awaiting hands the event loop back
          // so the server can process what opens this gate or cancels it.
          while (gateClosed() && !context.signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }

          yield afterGate;
          yield returnedItems;
        } finally {
          if (context.signal.aborted) {
            process.stderr.write(`${cleanupEntered}\n`);
            while (gateClosed()) {
              await new Promise((resolve) => setTimeout(resolve, 5));
            }
            process.stderr.write(`${cleanupFinished}\n`);
          }
        }
      },
    },
  });
};
