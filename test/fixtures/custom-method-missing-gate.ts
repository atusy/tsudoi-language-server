/**
 * A CUSTOM NOTIFICATION THAT DECIDES NOTHING ABOUT WHEN IT MAY RUN. The type
 * refuses this, and an author who never annotated their config reaches the same
 * refusal here -- which is the whole reason the check exists at run time as well.
 *
 * WHAT A DEFAULT WOULD COST INSTEAD OF THIS: the handler running before the
 * handshake, against a session whose documents are empty and whose roots are
 * null, with nothing anywhere saying so.
 *
 * NO TYPE ANNOTATION, for the reason test/fixtures/custom-method-collides.ts
 * gives.
 */
export default () => ({
  customMethod: {
    "textDocument/didBlur": { kind: "notification", handler: () => Promise.resolve() },
  },
});
