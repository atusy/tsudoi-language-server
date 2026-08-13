/**
 * A CUSTOM REQUEST HANDLER THAT FALLS OFF THE END. Indistinguishable on the wire
 * from the one that answers `null` unless tsudoi treats it as a failure, which
 * is what the result wrapper exists for.
 *
 * NO TYPE ANNOTATION, deliberately and for the reason
 * test/fixtures/custom-method-collides.ts gives: `CustomRequestHandler` refuses
 * this at compile time -- it is a notification handler as written -- and an
 * author who never annotated their config is told by nothing but the run time.
 */
export const answersNothing = "textDocument/didFocus";

export default () => ({
  customMethods: {
    "textDocument/didFocus": (_context: unknown, _params: unknown) => Promise.resolve(),
  },
});
