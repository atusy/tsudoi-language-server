// Relative with .ts, and Bun-free: deno executes this file too.
//
// ZERO PROTOCOL IMPORTS, AND THAT IS THE SECOND THING THIS FILE MEASURES. No
// `DocumentFormattingParams`, no `TextEdit`, no `Position`, and no annotation
// on the handler: `MethodHandler` supplies all of it by contextual typing, so
// `tsc --noEmit` type-checking this file is the standing evidence for the
// ruling at src/types.ts that neither name joins the published surface. Add an
// annotation here and that evidence is gone.
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";

/** What this formatter rewrites, and what it rewrites it to. */
export const target = "、";
export const replacement = ", ";

/**
 * THE AFFORDABILITY CLAIM, WRITTEN AS A CONFIG AUTHOR WOULD HIT IT.
 *
 * A real analysis -- a parser, a regex sweep, a formatter's own lexer -- knows
 * OFFSETS into a buffer. The protocol wants Positions. Everything in this file
 * exists to make that conversion the visible step: `scan` returns numbers and
 * nothing else, and the handler below turns each one into a Position with
 * `document.positionAt`, which comes from upstream's TextDocument and is not
 * something this project wrote.
 */
function scan(text: string): number[] {
  const offsets: number[] = [];
  for (let at = text.indexOf(target); at !== -1; at = text.indexOf(target, at + 1)) {
    offsets.push(at);
  }
  return offsets;
}

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/formatting": (context, params) => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (document === undefined) {
          return Promise.resolve(null);
        }
        return Promise.resolve(
          scan(document.getText()).map((offset) => ({
            range: {
              start: document.positionAt(offset),
              end: document.positionAt(offset + target.length),
            },
            newText: replacement,
          })),
        );
      },
    },
  });
};
