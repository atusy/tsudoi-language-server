/**
 * BOTH KINDS AND BOTH GATES IN ONE CONFIG, plus a request that reads back what
 * the notifications did -- a notification has no response, so its effect is
 * observable only through a LATER message.
 *
 * NO TYPE ANNOTATION, for the reason test/fixtures/custom-method-collides.ts
 * gives: src/config.ts reaches an author's config through a cast from `unknown`,
 * so what this measures is the runtime every author gets whether or not they
 * annotated.
 *
 * ONE RECORDER FOR EVERY ENTRY, so a name driven in two forms differs from its
 * neighbour in the FORM and in nothing else: a fixture that also rewrote the
 * handler would grade the rewrite.
 */
const seen: unknown[] = [];

/** The name driven in BOTH forms, whose handler answers either way. */
export const bothForms = "textDocument/didFocus";
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

/**
 * THE SAME RECORDER FOR A NOTIFICATION, RETURNING NOTHING -- which is not
 * tidiness: a notification handler that ANSWERS is named on stderr once per
 * method, so a fixture whose notifications all answered would put a `tsudoi: `
 * line into every session here and no arm could then read stderr for anything
 * else. `bothForms` keeps the answering one, that being the whole of what a name
 * driven in both forms has to do.
 */
const note = (method: string) => {
  return (_context: unknown, params: unknown): Promise<void> => {
    seen.push({ method, params });
    return Promise.resolve();
  };
};

export default () => ({
  customMethod: {
    "textDocument/didFocus": { kind: "request", handler: record("textDocument/didFocus") },
    "textDocument/didBlur": {
      kind: "notification",
      gate: "lifecycle",
      handler: note("textDocument/didBlur"),
    },
    "tsudoi/ping": { kind: "notification", gate: "always", handler: note("tsudoi/ping") },
    "tsudoi/seen": { kind: "request", handler: () => Promise.resolve({ result: seen }) },
  },
});
