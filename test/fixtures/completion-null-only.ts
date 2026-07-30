// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * Says nothing at all: a generator that yields NOTHING.
 *
 * THE EMPTY BODY IS THE POINT, NOT AN OVERSIGHT, and there is exactly one
 * spelling of it because there is exactly one entrance for content.
 * `no answer` is `no yields`; it cannot be confused with an empty answer paired
 * with a stream, because no such pair exists to write. What this fixture is for
 * is that `nothing to say about this position` stays distinguishable from an
 * EMPTY LIST, which tells a user there are no candidates -- a stronger
 * statement, and one this server has no grounds for.
 *
 * IT IS ALSO THE PAIRED ABSENCE for the token-present arms: under a token, zero
 * yields must produce ZERO `$/progress`, measured by the same counter that sees
 * one when a batch exists.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM IS MADE, AND ONE IS UNWRITEABLE HERE BY
      // ACCIDENT. It yields NOTHING, so the drive answers
      // `null` on the wire -- and the specification's equivalence is stated for
      // a SUPPLIED `CompletionItem[]`, which `null` is not. RULED RATHER THAN
      // SKIPPED: `no claim` is the answer here, not an omission, and recording
      // it is what stops the next reader converting this to a `yield []` and
      // thereby asserting something this fixture spent a whole doc comment
      // refusing to say.
      //
      // AND THE DRIVE IS WHAT KEEPS THIS TRUE, which is why the ruling is worth
      // re-reading beside it: aggregating zero yields into `[]` would turn this
      // fixture's refusal into `the candidate set is complete and empty`
      // WITHOUT ONE CHARACTER OF THIS FILE CHANGING. src/methods.ts answers
      // `null` for a stream that yielded nothing, and says so at the site.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        // Intentionally empty.
      },
    },
  });
};
