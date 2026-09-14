// Relative with .ts, and Bun-free: deno executes this file too.
//
// ONE PROTOCOL NAME, AND IT COMES FROM TSUDOI'S OWN SURFACE, which is the
// second thing this file measures. `DiagnosticSeverity` is imported from
// ../../src/types.ts rather than from vscode-languageserver-protocol, so this
// fixture is the standing evidence that THAT NAME is REACHABLE AND USABLE AS A
// VALUE by a config that installed one package. (NAMED RATHER THAN COUNTED: the
// published surface grows, and an ordinal into it falsifies itself silently.)
//
// THERE IS NO ANNOTATION ON THE HANDLER, AND THAT IS WHAT THIS FILE IS FOR --
// no `DocumentDiagnosticParams`, no `DocumentDiagnosticReport`, no
// `Diagnostic`. TWO OF THOSE NAMES ARE THEMSELVES ON THE SURFACE, for
// examples/diagnostic-trailing-whitespace.ts, which is an EXTRACTED handler and
// gets no contextual typing. So what this file proves is the half that decides
// which side of that line each name falls on: A HANDLER WRITTEN INLINE IN A
// CONFIG NEEDS NONE OF THEM, because
// `MethodHandler` supplies them. Add an annotation here and that evidence is
// gone, and with it the argument that publication is about EXTRACTION rather
// than about the method.
import { type TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";
import { DiagnosticSeverity } from "../../packages/tsudoi-language-server/src/deps/types.ts";

export const target = "、";
export const message = "読点が使われています";

/**
 * THE AFFORDABILITY CLAIM, SECOND MEASUREMENT, WRITTEN AS A CONFIG AUTHOR WOULD
 * HIT IT.
 *
 * A real analysis -- a parser, a linter's own lexer -- knows OFFSETS into a
 * buffer. `Diagnostic.range` wants Positions (MEASURED at
 * vscode-languageserver-types 3.18.0: `range: Range` is REQUIRED). So the
 * conversion is the visible step here exactly as it is in the formatting
 * fixture: `scan` returns numbers and nothing else, and the handler turns each
 * into a Position with `document.positionAt`, which comes from upstream's
 * TextDocument and is not something this project wrote.
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
      "textDocument/diagnostic": (context, params) => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        // A FULL REPORT WITH NO ITEMS, NOT `null`, AND THAT IS THE PROTOCOL'S
        // SHAPE RATHER THAN A HOUSE STYLE: this result declares no null arm, and
        // an empty full report is a REPORT SAYING THE FILE IS CLEAN -- which is
        // what makes a client clear the diagnostics it is already showing.
        if (document === undefined) {
          return Promise.resolve({ kind: "full" as const, items: [] });
        }
        return Promise.resolve({
          kind: "full" as const,
          items: scan(document.getText()).map((offset) => ({
            range: {
              start: document.positionAt(offset),
              end: document.positionAt(offset + target.length),
            },
            severity: DiagnosticSeverity.Warning,
            message,
          })),
        });
      },
    },
  });
};
