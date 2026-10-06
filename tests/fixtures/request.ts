// Relative with .ts, and Bun-free: deno executes this file too.
import { ResponseError } from "../../packages/tsudoi-language-server/src/deps/error.ts";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** The custom request that makes the handler ask the client. */
export const asking = "test/ask";

/** What the editor sends to `asking`: the request the handler is to forward. */
export interface Ask {
  readonly method: string;
  readonly params?: object;
}

/**
 * A HANDLER THAT ASKS THE CLIENT WHAT IT WAS TOLD TO AND ANSWERS WITH WHAT CAME
 * BACK, rejection included -- so the outcome the author's `await` met is what
 * the editor reads, and an arm can assert on it without a second channel.
 *
 * THE REJECTION IS DESCRIBED RATHER THAN RETHROWN, because a rethrow becomes
 * tsudoi's own -32603 and would erase exactly what the arm asserts: that the
 * value was upstream's `ResponseError`, carrying the client's code and data.
 *
 * IT PASSES ITS OWN `signal`, which is what the documentation tells an author
 * to do and what the cancellation arm needs: the outer request's cancellation
 * is the only way an editor can withdraw the inner one.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    customMethods: {
      [asking]: async (context: RequestContext, params: unknown) => {
        const ask = params as Ask;
        try {
          const answered = await context.tsudoi.request(ask.method, ask.params, {
            signal: context.signal,
          });
          return { result: { answered } };
        } catch (error) {
          return {
            result: {
              rejected:
                error instanceof ResponseError
                  ? { code: error.code, message: error.message, data: error.data }
                  : String(error),
            },
          };
        }
      },
    },
  });
};
