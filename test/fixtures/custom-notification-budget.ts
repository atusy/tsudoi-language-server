/**
 * TWO CUSTOM NOTIFICATIONS THAT EACH BREAK THE CONTRACT A DIFFERENT WAY, plus a
 * request that counts how often each ran.
 *
 * ONE ANSWERS AND ONE REJECTS, and they are two faults rather than one: a
 * notification has no response, so a handler that ANSWERS has produced a value
 * nothing can carry -- an author who wrote a request handler by mistake -- where
 * one that REJECTS has failed and nobody is waiting to be told.
 *
 * BOTH ARE `always`-GATED so a test may drive them before and after the
 * handshake without the gate deciding anything.
 *
 * NO TYPE ANNOTATION, deliberately and for the reason
 * test/fixtures/custom-method-collides.ts gives: `CustomMethodHandler<
 * "notification">` refuses the answering half at compile time, and src/config.ts
 * reaches an author's config through a cast from `unknown` -- so what a run-time
 * report says is the ONLY thing an unannotated author ever hears.
 */
const ran: Record<string, number> = {};

export const answering = "tsudoi/answers";
export const rejecting = "tsudoi/rejects";
export const counter = "tsudoi/ran";
/** What the rejecting handler fails with, for an arm asserting the author's own words. */
export const rejectionMessage = "この通知ハンドラは拒否します";

const count = (method: string): void => {
  ran[method] = (ran[method] ?? 0) + 1;
};

export default () => ({
  customMethod: {
    "tsudoi/answers": {
      kind: "notification",
      gate: "always",
      handler: (): Promise<number> => {
        count("tsudoi/answers");
        return Promise.resolve(ran["tsudoi/answers"] ?? 0);
      },
    },
    "tsudoi/rejects": {
      kind: "notification",
      gate: "always",
      handler: (): Promise<void> => {
        count("tsudoi/rejects");
        return Promise.reject(new Error(rejectionMessage));
      },
    },
    "tsudoi/ran": {
      kind: "request",
      handler: (): Promise<{ result: Record<string, number> }> => {
        return Promise.resolve({ result: ran });
      },
    },
  },
});
