// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * What the getter throws, exported so the arm asserts the AUTHOR'S OWN words
 * reached the client rather than merely that something failed.
 */
export const unserializableFailure = "this capability cannot describe itself";

/**
 * A HANDSHAKE HANDLER WHOSE ANSWER CANNOT BE SERIALISED, which is the failure the
 * stakeholder ruled must be reported rather than recorded.
 *
 * A THROWING GETTER AND NOT A BigInt OR A CYCLE, and the class is the same three:
 * those two fail with the ENGINE'S OWN sentence and the engines disagree --
 * MEASURED, bun answers `JSON.stringify cannot serialize BigInt.` where deno
 * answers `Do not know how to serialize a BigInt`, and their cycle wordings share
 * no words at all. An arm reading the reported detail would then hold for one
 * runtime and be rewritten for the other, where what this getter throws is the
 * AUTHOR'S sentence and is the same under both.
 *
 * A CUSTOM TOP-LEVEL KEY, for the reason test/fixtures/initialize-mutates-prepared-result.ts
 * gives at its own: `InitializeResult` declares an index signature, so this is
 * legal and typed, and it keeps the failure out of `capabilities`.
 */
const initialize: MethodHandler<"initialize"> = (context) => {
  return Promise.resolve({
    ...context.preparedResult,
    get tsudoiUnserializable(): never {
      throw new Error(unserializableFailure);
    },
  });
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { initialize } });
};
