// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * What the getter throws, exported so the test asserts the AUTHOR'S OWN words
 * reached stderr rather than merely that something failed.
 */
export const getterFailure = "the hover handler could not be built";

/**
 * A METHOD KEY THAT IS AN ACCESSOR, AND IT TYPE-CHECKS -- which is the whole
 * reason this arm is worth a fixture rather than a paragraph. A getter is a
 * legal way to spell a property, its declared return type is the handler's own,
 * and a body that only throws is assignable to any return type at all. Nothing
 * about this file is a mistake tsc can see.
 *
 * WHAT MAKES IT THE SHARP CASE IS WHEN IT IS FIRST READ. `loadConfig` returning
 * without touching `methods` leaves the throw to whoever dereferences first, and
 * that is capability assembly INSIDE the `initialize` handler -- which runs after
 * the lifecycle has already gone to `serving`. The handshake is then answered
 * -32603 with ZERO BYTES on stderr, and the session goes on treating every later
 * request as initialized despite a handshake that failed.
 *
 * A REALISTIC SPELLING AND NOT A CONTRIVANCE: an author building a handler
 * lazily -- from a file read, a dictionary load, a compiled grammar -- writes
 * exactly this, and the throw is whatever that construction does when the
 * resource is missing.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      get "textDocument/hover"(): MethodHandler<"textDocument/hover"> {
        throw new Error(getterFailure);
      },
    },
  });
};
