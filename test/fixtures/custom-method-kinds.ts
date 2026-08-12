/**
 * BOTH KINDS AND BOTH GATES IN ONE CONFIG, plus a request that reads back what
 * the notifications did -- a notification has no response, so its effect is
 * observable only through a LATER message.
 *
 * NO TYPE ANNOTATION, AND THE REASON IS THE PERTURBATION THIS FIXTURE EXISTS TO
 * PERMIT rather than the ones the other unannotated fixtures give: AC1's control
 * FLIPS `textDocument/didFocus` from `request` to `notification` in one line, and
 * an annotated config refuses that -- the two kinds resolve different returns, so
 * the shared recorder below type-checks under exactly one of them. That refusal
 * is asserted in test/custom-method-types.test.ts; what is measured here is the
 * RUNTIME, which needs the flip to be one line.
 *
 * ONE RECORDER FOR EVERY ENTRY, which is what makes the flip a change of KIND and
 * of nothing else: a control that also rewrote the handler would grade the
 * rewrite.
 */
const seen: unknown[] = [];

/** Declared a REQUEST today. AC1's control flips this entry and nothing else. */
export const flippable = "textDocument/didFocus";
/** A notification tsudoi may run only inside the initialized window. */
export const gatedNotification = "textDocument/didBlur";
/** A notification its author says a client may send at any moment. */
export const ungatedNotification = "tsudoi/ping";
/** The request that reads back what the notifications recorded. */
export const seenReader = "tsudoi/seen";
/** A name this config declares NOWHERE, for the arm neither form may reach. */
export const undeclared = "textDocument/didNothing";

const record = (method: string) => {
  return (_context: unknown, params: unknown): Promise<{ result: unknown }> => {
    seen.push({ method, params });
    return Promise.resolve({ result: seen.length });
  };
};

export default () => ({
  customMethod: {
    "textDocument/didFocus": { kind: "request", handler: record("textDocument/didFocus") },
    "textDocument/didBlur": {
      kind: "notification",
      gate: "lifecycle",
      handler: record("textDocument/didBlur"),
    },
    "tsudoi/ping": { kind: "notification", gate: "always", handler: record("tsudoi/ping") },
    "tsudoi/seen": { kind: "request", handler: () => Promise.resolve({ result: seen }) },
  },
});
