// Relative with .ts, and Bun-free: deno executes this file too.
import type { MethodHandler, TsudoiConfig } from "../../src/types.ts";

/**
 * What the SECOND read throws, exported so the test can search stderr and the
 * handshake's error for it -- a test asserting merely that something failed
 * would pass on a server that broke for any other reason.
 */
export const secondReadFailure = "the hover handler is gone on the second read";

/** What the FIRST read answers with, so a served hover is distinguishable. */
export const hoverText = "one read is all this config affords";

/**
 * A `methods` WHOSE HANDLER IS A FUNCTION ONCE AND A THROW AFTERWARDS, which is
 * what a `Proxy` is FOR rather than a contrivance built to break tsudoi. An
 * author wrapping their handlers to log, to memoise, or to build one lazily from
 * a resource that can be exhausted writes a `get` trap, and a trap answers per
 * ACCESS -- so `read it once at load` proves nothing about the read that
 * dispatch makes later.
 *
 * THE COUNT IS PER PROPERTY AND THE OTHER KEYS ARE ABSENT, so this config
 * declares exactly one method and the read that fails is the read of the handler
 * tsudoi kept.
 */
export default (): Promise<TsudoiConfig> => {
  const hover: MethodHandler<"textDocument/hover"> = () => {
    return Promise.resolve({ contents: hoverText });
  };
  let reads = 0;
  const methods = new Proxy({} as Record<string, unknown>, {
    get(_target, key): unknown {
      if (key !== "textDocument/hover") {
        return undefined;
      }
      reads += 1;
      if (reads > 1) {
        throw new Error(secondReadFailure);
      }
      return hover;
    },
  });
  return Promise.resolve({ methods } as TsudoiConfig);
};
