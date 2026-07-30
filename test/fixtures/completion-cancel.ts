// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/** The buffer text the test writes to let the handler past its gate. */
export const gateOpen = "release";

export const beforeGate: CompletionItem[] = [
  { label: "取消前", detail: "yielded before the gate" },
];
export const afterGate: CompletionItem[] = [{ label: "取消後", detail: "yielded after the gate" }];
export const returnedItems: CompletionItem[] = [{ label: "戻り値", detail: "returned" }];

/** Written from the signal's own abort event -- a standard Web API, so Deno-safe. */
export const abortedMarker = "completion-cancel: aborted";

/**
 * Yields, parks, then yields again -- and it yields that second batch whether or
 * not it was cancelled. Stopping AFTER an abort is tsudoi's job here, not the
 * handler's: a fixture that returned early on abort would prove nothing about
 * what tsudoi suppresses.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: COMPLETE. The three payloads are module constants;
      // `params` is read ONLY to find the gate document, never to filter, so the
      // answer does not depend on what the user typed and a re-query would
      // return the same list. THE CANCELLED PATH MAKES NO CLAIM EITHER WAY --
      // that request is answered -32800 and carries no result -- which is the
      // path this fixture actually exists for.
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ) {
        // SUBSCRIBED BEFORE THE FIRST YIELD, WHICH IS WHERE IT HAS TO BE NOW.
        // Until Sprint 43 the handler was awaited and this ran before any
        // generator body did; a generator body does not start until its first
        // `next()`, so a listener written after the first `yield` would miss an
        // abort that arrived while the drive was still sending that batch.
        context.signal.addEventListener("abort", () => {
          process.stderr.write(`${abortedMarker}\n`);
        });

        yield beforeGate;

        // Awaited polling, not a busy loop: awaiting hands the event loop back
        // so the server can process what opens this gate.
        while (
          context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen &&
          !context.signal.aborted
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        yield afterGate;
        yield returnedItems;
      },
    },
  });
};
