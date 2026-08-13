/**
 * FOUR CUSTOM METHODS AND NOT ONE OF THEM SAYS WHICH KIND IT IS, plus a request
 * that reads back what the notifications did -- a notification has no response,
 * so its effect is observable only through a LATER message.
 *
 * NO TYPE ANNOTATION, for the reason test/fixtures/custom-method-collides.ts
 * gives: src/config.ts reaches an author's config through a cast from `unknown`,
 * so what this measures is the runtime every author gets whether or not they
 * annotated.
 *
 * ONE RECORDER FOR EVERY HANDLER, so a name driven in two forms differs from its
 * neighbour in the FORM and in nothing else: a fixture that also rewrote the
 * handler would grade the rewrite.
 */
const seen: unknown[] = [];

/** The name driven in BOTH forms, whose handler answers either way. */
export const bothForms = "textDocument/didFocus";
/** A notification whose params an arm reads back. */
export const noted = "textDocument/didBlur";
/** A notification an arm sends carrying no params at all. */
export const pinged = "tsudoi/ping";
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
 * THE SAME RECORDER RETURNING NOTHING -- which is not tidiness: a notification
 * handler that ANSWERS is named on stderr once per method, so a fixture whose
 * notifications all answered would put a `tsudoi: ` line into every session here
 * and no arm could then read stderr for anything else. `bothForms` keeps the
 * answering one, that being the whole of what a name driven in both forms has to
 * do.
 */
const note = (method: string) => {
  return (_context: unknown, params: unknown): Promise<void> => {
    seen.push({ method, params });
    return Promise.resolve();
  };
};

export default () => ({
  customMethods: {
    "textDocument/didFocus": record("textDocument/didFocus"),
    "textDocument/didBlur": note("textDocument/didBlur"),
    "tsudoi/ping": note("tsudoi/ping"),
    "tsudoi/seen": () => Promise.resolve({ result: seen }),
  },
});
