// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * A CONFIG WHOSE ONLY HANDLER IS THE HANDSHAKE, and it returns what it was
 * handed -- so what this server advertises must be, key for key, what
 * test/fixtures/no-methods.ts advertises.
 *
 * WHAT THAT PAIR SAYS: an `initialize` handler CONTRIBUTES NO CAPABILITY. An
 * implementation that gave the key a row of the request table would have given it
 * a capability contributor too, and this is where that reddens.
 */
const initialize: MethodHandler<"initialize"> = (context) => {
  return Promise.resolve(context.preparedResult);
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
