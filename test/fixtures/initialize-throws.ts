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
 * A HANDSHAKE HANDLER THAT FAILS, WHICH TAKES THE PROCESS WITH IT. It is NOT the
 * config-load contract wearing a second hat: `exit 1, stderr, zero bytes on
 * stdout` belongs to a moment before any connection exists, and by the time this
 * runs stdout is LSP's -- so the failure is ALSO answered and ALSO logged to the
 * client, and it is the death rather than the exit code that this fixture is
 * spawned to show.
 */
const initialize: MethodHandler<"initialize"> = () => {
  throw new Error(handshakeFailure);
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
