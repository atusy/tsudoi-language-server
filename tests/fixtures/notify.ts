// Relative with .ts, and Bun-free: deno executes this file too.
import type { ShowMessageParams } from "vscode-languageserver-protocol";
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * What the handler tells the client, exported so the arm cannot drift from it.
 *
 * ANNOTATED WITH UPSTREAM'S OWN TYPE, which is the route `Tsudoi.notify`'s
 * docblock sends an author down and is worth demonstrating here BECAUSE THE BARE
 * LITERAL DOES NOT COMPILE: `{ type: 1 }` widens to `number`, and
 * `ShowMessageParams.type` is `MessageType`. That refusal is the typing doing
 * its job, and a fixture that dodged it with a cast would hide the one thing
 * this surface buys an author.
 */
export const shown: ShowMessageParams = { type: 1, message: "こんにちは" };

/**
 * A CONFIG WHOSE HANDLER SPEAKS TO THE CLIENT BEFORE IT ANSWERS, which is the
 * whole subject: a notification is not the response, so an arm that read only
 * the response could not tell a server that sent one from a server that did not.
 *
 * IT AWAITS THE SEND, deliberately. `notify` hands back a promise, and a handler
 * that dropped it would answer first and send afterwards -- so awaiting is what
 * makes the ORDER the arm asserts a property of tsudoi rather than of the
 * scheduler.
 */
export default (): Promise<TsudoiConfig> => {
  const hover: MethodHandler<"textDocument/hover"> = async (context) => {
    await context.tsudoi.notify("window/showMessage", shown);
    return { contents: { kind: "plaintext", value: "答え" } };
  };
  return Promise.resolve({ methods: { "textDocument/hover": hover } });
};
