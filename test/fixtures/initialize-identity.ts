// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import { sharedMethods } from "./initialize-absent.ts";

/**
 * A HANDSHAKE HANDLER THAT CHANGES NOTHING, which is what makes `preparedResult`
 * readable as TSUDOI'S OWN ANSWER rather than as something assembled for the
 * handler: what this session is served must equal what
 * test/fixtures/initialize-absent.ts -- the same methods, no handler -- is
 * served.
 *
 * IT RETURNS THE VALUE IT WAS HANDED AND DOES NOT REBUILD IT, deliberately. A
 * hand-written literal here would green whatever tsudoi happens to prepare and
 * would leave the claim asserted by nobody.
 */
const initialize: MethodHandler<"initialize"> = (context) => {
  return Promise.resolve(context.preparedResult);
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { ...sharedMethods, initialize } });
};
