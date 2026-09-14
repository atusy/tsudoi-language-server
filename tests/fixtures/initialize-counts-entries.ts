// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * The key the entry count travels under, ON THE SERVED RESULT ITSELF -- the same
 * route and the same reason as tests/fixtures/initialize-mutates-prepared-result.ts:
 * a handshake has no later request to report through, and `InitializeResult`
 * declares `[custom: string]: LSPAny | ServerCapabilities | undefined`, so a
 * top-level key of our own is legal and typed.
 */
export const entryCountKey = "tsudoiInitializeEntryCount";

/**
 * HOW LONG THIS HANDSHAKE STAYS IN FLIGHT, and it is generous rather than minimal
 * ON PURPOSE. The arm reading this fixture sends a SECOND `initialize` WITHOUT
 * awaiting the first, so the whole measurement depends on the second frame
 * arriving while the first handler is still suspended. A suspension the size of
 * frame-arrival jitter -- tests/fixtures/initialize-async.ts's 1ms -- lets the
 * second land after the first has already returned, where the phase is `serving`
 * and the refusal comes from the branch that was never in doubt: the arm would
 * then be GREEN under the regression it exists to catch.
 */
export const suspensionMs = 250;

/**
 * HOW MANY TIMES THE AUTHOR'S HANDLER HAS BEEN ENTERED, at module scope because
 * that is where a config author's own state lives and the whole question is
 * whether tsudoi ran their handler twice.
 */
let entries = 0;

/**
 * A HANDSHAKE HANDLER THAT COUNTS ITS OWN ENTRIES AND SUSPENDS BETWEEN THEM.
 *
 * COUNTED ON ENTRY AND REPORTED ON RETURN, which is the whole of what separates a
 * repair that REFUSES the second handshake from one that merely SERIALISES it:
 * both answer the second `initialize` late, and only the refusing one leaves this
 * at 1. A count read at entry and reported there would say nothing -- the first
 * invocation reports 1 either way.
 *
 * No other methods are needed to observe the handshake entry count.
 */
const initialize: MethodHandler<"initialize"> = async (context) => {
  entries += 1;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, suspensionMs);
  });
  return { ...context.preparedResult, [entryCountKey]: entries };
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
