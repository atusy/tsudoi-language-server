// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** The name the handler answers with, which tsudoi would never write itself. */
export const awaitedServerName = "awaited-by-the-config";

/**
 * A HANDSHAKE HANDLER THAT SUSPENDS BEFORE IT ANSWERS, which is the realistic
 * shape -- an author reading a file, loading a grammar, asking a subprocess what
 * it supports -- and the one the site's synchronous predecessor refused.
 *
 * A TIMER AND NOT `await Promise.resolve()`: a microtask resumes before the
 * handler ever yields to the loop, so it would not distinguish an implementation
 * that awaited from one that did not.
 *
 * WHAT IT COSTS IS RECORDED AT THE CALL SITE IN src/server.ts, not here: the
 * notification-drop window is now this handler's duration.
 */
const initialize: MethodHandler<"initialize"> = async (context) => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 1);
  });
  return { ...context.preparedResult, serverInfo: { name: awaitedServerName } };
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
