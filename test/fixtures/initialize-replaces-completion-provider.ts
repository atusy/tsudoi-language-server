// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import { sharedMethods } from "./initialize-absent.ts";

/** What the handler writes in place of the prepared completion provider. */
export const replacedTriggerCharacters = ["/"];

/**
 * THE AUTHOR EXERCISING THE WHOLE POINT OF THE HANDLER: they want trigger
 * characters, which handler presence alone cannot express, so they spread the
 * prepared result and write their own `completionProvider`.
 *
 * AND THE TRAP FIRES, WHICH IS WHY THIS FIXTURE IS WORTH ONE:
 * `completionItem/resolve` had written `resolveProvider: true` into that same
 * key, so this replacement DELETES it -- the config still declares a resolve
 * handler, and the client is no longer told about it. TSUDOI WILL NOT GUARD IT.
 * Restoring the key would be tsudoi overruling a withdrawal the author is
 * entitled to make, which is the capability this whole item exists to give them;
 * the test asserts the deletion HAPPENS rather than that it is prevented.
 *
 * THE SPREAD OF `capabilities` IS THE SAFE HALF AND IT IS NOT THE BOUNDARY:
 * `textDocumentSync` survives here only because this author spread. One who
 * builds `capabilities` from scratch loses it, and then no client sends didOpen
 * or didChange for the rest of the session with nothing anywhere saying so.
 */
const initialize: MethodHandler<"initialize"> = (context) => {
  return Promise.resolve({
    ...context.preparedResult,
    capabilities: {
      ...context.preparedResult.capabilities,
      completionProvider: { triggerCharacters: replacedTriggerCharacters },
    },
  });
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { ...sharedMethods, initialize } });
};
