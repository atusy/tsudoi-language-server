/**
 * A CUSTOM METHOD NAME TSUDOI ALREADY SERVES. The handler is perfectly good and
 * the name is not the author's to take: tsudoi registers `textDocument/hover`
 * from its own table, and upstream's registration is a MAP SET rather than a
 * chain, so whichever ran second would silently evict the other.
 *
 * NO TYPE ANNOTATION, deliberately and for the reason
 * test/fixtures/handler-not-a-function.ts gives: `TsudoiConfig` refuses this at
 * compile time -- which is the point of the reserved half of `CustomMethodMap`
 * -- and what this fixture measures is the run-time refusal every author gets
 * whether or not they annotate.
 */
export default () => ({
  customMethod: {
    "textDocument/hover": (_context: unknown, _params: unknown) =>
      Promise.resolve({ result: null }),
  },
});
