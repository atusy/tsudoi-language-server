// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
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
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ) {
        // Intentionally empty.
      },
    },
  });
};
