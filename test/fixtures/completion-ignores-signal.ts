// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

export const beforeGate: CompletionItem[] = [
  { label: "停止前", detail: "yielded before the wait" },
];
export const afterWait: CompletionItem[] = [{ label: "停止後", detail: "never reached" }];

/** Written once tsudoi has taken the first chunk and asked for another. */
export const parkedMarker = "completion-ignores-signal: parked";

/**
 * The config author's cleanup, and the thing that must NOT appear while the
 * generator is parked.
 *
 * `.return()` CANNOT PREEMPT A PENDING `.next()` -- it is queued behind it by
 * the language -- so a generator suspended inside its own `await` runs no
 * cleanup until that await settles, and this one never does. That is a fact
 * about async generators and tsudoi cannot change it. What it does not decide
 * is the RESPONSE, which is the whole point of the fixture.
 */
export const cleanupMarker = "completion-ignores-signal: released";

/**
 * A handler that IGNORES ITS SIGNAL and awaits something that never settles --
 * the shape a config author reaches with one fetch that has no timeout and no
 * `signal` passed to it.
 *
 * IT IS PARKED INSIDE `next()`, WHICH IS WHAT MAKES IT DIFFERENT from every
 * other cancellation fixture here. The others are suspended AT A YIELD, where
 * the drive is between pulls and free to notice an abort. This one is suspended
 * INSIDE a pull, so a drive that awaits `next()` and only then asks about
 * cancellation has nowhere to ask from: the request and the generator both stay
 * parked, and the client is never answered at all.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM. Every request this fixture serves is
      // answered -32800 with no result, and the path that would answer is
      // unreachable -- the handler never returns -- so there is no candidate set
      // for `isIncomplete` to be about.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        try {
          yield beforeGate;

          process.stderr.write(`${parkedMarker}\n`);

          // NO SIGNAL, NO TIMEOUT, NO GATE. A cooperative handler would race
          // this against `context.signal`; this one is the handler that did not,
          // which is the only case that can measure what tsudoi does alone.
          await new Promise(() => {});

          yield afterWait;
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
