// Relative with .ts, and Bun-free: deno executes this file too.
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * A CUSTOM REQUEST WHOSE ANSWER IS `null`, AND THE ONLY THING THIS CONFIG
 * DECLARES. Nothing under `methods`, so the InitializeResult it produces is what
 * tsudoi advertises for a config that answers nothing at all -- which is the
 * whole claim: a custom method advertises nothing.
 *
 * `{ result: null }` IS AN ANSWER. A typed row says `Hover | null` and tells the
 * two apart by its own type; a custom result is `unknown` and cannot, so the
 * wrapper is what carries the difference between answering null and answering
 * nothing.
 */
export const nullAnswering = "textDocument/didFocus";

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    customMethod: {
      "textDocument/didFocus": {
        kind: "request",
        handler: () => Promise.resolve({ result: null }),
      },
    },
  });
};
