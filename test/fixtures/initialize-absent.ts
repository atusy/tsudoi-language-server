// Relative with .ts, and Bun-free: deno executes this file too.
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * THE METHODS ITS TWO SIBLINGS SHARE, EXPORTED SO THAT `the same config with the
 * handler removed` IS LITERALLY THE SAME CONFIG. Spelled out once per file
 * instead, one copy could drift, and the identity arm would then be comparing two
 * CONFIGS where it means to compare two ANSWERS.
 *
 * COMPLETION BESIDE RESOLVE, WHICH IS THE PAIR THE REPLACEMENT ARM NEEDS:
 * `completionItem/resolve` writes `resolveProvider` INTO the key
 * `textDocument/completion` owns, so this is a config that has something to lose
 * when an author replaces `completionProvider` wholesale.
 */
export const sharedMethods: NonNullable<TsudoiConfig["methods"]> = {
  // COMPLETENESS RULING: COMPLETE. The handler takes no parameters at all, so
  // nothing about the request reaches its answer and the one item IS the whole
  // candidate set at every position in every document. WHAT THIS CONFIG IS FOR
  // does not change that: it exists so `completionProvider.resolveProvider` has
  // somewhere to be contributed, and no arm reads what this yields -- but a
  // handler that yields is a handler that claims, whether or not anybody looks.
  "textDocument/completion": async function* () {
    yield [{ label: "one" }];
  },
  "completionItem/resolve": (_context, item) => Promise.resolve(item),
};

/**
 * THE PAIRED DIRECTION FOR EVERY ARM IN test/initialize-handler.test.ts: this
 * config declares no `initialize` handler at all, so what it is served is what
 * tsudoi answers on its own authority.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: sharedMethods });
};
