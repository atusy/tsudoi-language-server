// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * Returns null having yielded nothing at all. A generator with no `yield` is
 * the point, not an oversight: `nothing to say about this position` has to stay
 * distinguishable from `nothing further to add`, and only the absence of any
 * emitted chunk tells them apart.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM IS MADE, AND THIS IS THE ONLY CONFIG IN
      // THE REPOSITORY OF WHICH THAT IS TRUE. It yields nothing and returns
      // null, so the drive answers `null` on the wire -- and the specification's
      // equivalence is stated for a SUPPLIED `CompletionItem[]`, which `null` is
      // not. RULED RATHER THAN SKIPPED: `no claim` is the answer here, not an
      // omission, and recording it is what stops the next reader converting this
      // to `{ isIncomplete: false, items: [] }` and thereby asserting something
      // this fixture spent a whole doc comment refusing to say.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        return null;
      },
    },
  });
};
