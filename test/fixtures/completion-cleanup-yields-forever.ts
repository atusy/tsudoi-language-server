// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "無限前", detail: "yielded before the gate" },
];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "yielded last" }];

export const cleanupYield: CompletionItem[] = [{ label: "永久", detail: "yielded in cleanup" }];

export const cleanupEntered = "completion-cleanup-yields-forever: entered cleanup";

/**
 * Cleanup that NEVER STOPS YIELDING -- the case that decides whether draining a
 * cleanup may be unbounded.
 *
 * A CONFIG AUTHOR REACHES THIS BY ACCIDENT: a `finally` that flushes a buffer
 * through a loop, over a buffer that refills or a cursor that never advances, is
 * one wrong condition away from every correct version of the same code.
 *
 * WHAT IT COSTS IF NOTHING BOUNDS IT: every one of these yields is answered by
 * a `next()` that settles as a microtask, so an unbounded drain never hands the
 * event loop back and the session stops answering ANYTHING -- not a slow
 * server, a silent one, holding whatever the request held. The reverse error is
 * far cheaper: a bound reached is a truncated cleanup that tsudoi REPORTS, so
 * the author is told rather than left to wonder.
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
          // finish, or every OTHER assertion in the test -- that the session
          // goes on serving -- would be measuring this loop instead.
          if (context.signal.aborted) {
            process.stderr.write(`${cleanupEntered}\n`);
            for (;;) {
              yield cleanupYield;
            }
          }
        }
      },
    },
  });
};
