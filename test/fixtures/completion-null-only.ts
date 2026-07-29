// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * Says nothing at all: `return;`, with no answer and therefore no stream.
 *
 * THE EMPTY BODY IS THE POINT, NOT AN OVERSIGHT, and since Sprint 42 the TYPE
 * is what carries it: `void` sits OUTSIDE the pair, so `no answer` cannot be
 * paired with a stream and there is exactly one spelling of it. What this
 * fixture is for is that `nothing to say about this position` stays
 * distinguishable from an EMPTY LIST, which tells a user there are no
 * candidates -- a stronger statement, and one this server has no grounds for.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM IS MADE, AND IT IS NOW UNWRITEABLE TO
      // MAKE ONE HERE BY ACCIDENT. It returns NOTHING, so the drive answers
      // `null` on the wire -- and the specification's equivalence is stated for
      // a SUPPLIED `CompletionItem[]`, which `null` is not. RULED RATHER THAN
      // SKIPPED: `no claim` is the answer here, not an omission, and recording
      // it is what stops the next reader converting this to
      // `{ isIncomplete: false, items: [] }` and thereby asserting something
      // this fixture spent a whole doc comment refusing to say.
      "textDocument/completion": (_context: RequestContext, _params: CompletionParams) =>
        Promise.resolve(undefined),
    },
  });
};
