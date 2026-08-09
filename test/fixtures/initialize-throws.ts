// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * What the handler throws, exported so the test asserts the AUTHOR'S OWN words
 * reached stderr rather than merely that something failed.
 */
export const handshakeFailure = "the handshake handler had nothing to answer with";

/**
 * A HANDSHAKE HANDLER THAT FAILS, WHICH IS THE ONE FAILURE THAT MUST NOT TAKE THE
 * PROCESS WITH IT. `exit 1, stderr, zero bytes on stdout` is the CONFIG LOAD
 * contract and belongs to a moment before any connection exists; by the time this
 * runs stdout is LSP's, so the answer is an error RESPONSE and a session left
 * exactly where it was.
 */
const initialize: MethodHandler<"initialize"> = () => {
  throw new Error(handshakeFailure);
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
