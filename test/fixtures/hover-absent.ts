// Relative with .ts, and Bun-free: deno executes this file too.
import type { Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * A config that supplies `methods` and no hover handler in it. Empty rather
 * than absent on purpose: advertisement must be decided by the hover key, and a
 * server that read `methods !== undefined` instead would pass an `{}` fixture.
 */
export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: {} });
};
