// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { CompletionItem } from "vscode-languageserver-protocol";
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

export const cleanupMarker = "completion-yields-bare-number: released";

/**
 * A batch that is a NUMBER.
 *
 * THE SECOND SHAPE, AND IT IS NOT A DUPLICATE OF THE ITEM FIXTURE BESIDE IT.
 * `Array.isArray` is the one check both are driven against, and a guard written
 * as `typeof value !== "object"` would refuse this and pass the bare item --
 * while a guard written as `value === null || typeof value !== "object"` would
 * do the reverse. One shape on each side of that line is what makes the pair a
 * measurement rather than two runs of the same case.
 *
 * A STRING WOULD PROVE NOTHING AND IS DELIBERATELY ABSENT: strings are
 * ITERABLE, so aggregation's spread accepts one and produces an array of
 * characters. That is a real hole and a different one; a probe using it cannot
 * separate `the guard fired` from `the spread happened to work`.
 */
export const bareNumber = 42;

/**
 * A handler whose batch is a bare number -- the shape aggregation rejects
 * INCIDENTALLY, by spreading something that is not iterable, and which streaming
 * would have sent out as a `$/progress` value with no complaint at all.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NO CLAIM. This handler never produces a candidate
      // set at all -- its one batch is a type error -- so `isIncomplete` has
      // nothing to be about.
      "textDocument/completion": async function* () {
        try {
          yield bareNumber as unknown as CompletionItem[];
        } finally {
          process.stderr.write(`${cleanupMarker}\n`);
        }
      },
    },
  });
};
