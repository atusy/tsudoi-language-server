// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import type { DocumentFormattingParams, TextEdit } from "vscode-languageserver-protocol";

/**
 * The edits this config answers with, whatever is asked. Written here as the
 * literal the test compares against, so anything tsudoi does to a range or to
 * newText on the way out shows up as an inequality rather than as a plausible
 * looking response.
 *
 * TWO EDITS, AND THE SECOND IS AN INSERT: upstream's TextEdit doc says an
 * insertion is a range whose start equals its end, so a serialisation that
 * collapsed or dropped an empty range would answer something that still looks
 * like a formatting result. One edit could not tell them apart.
 *
 * The newText is Japanese because an edit is text a human reads, and a payload
 * that survives ASCII proves nothing about the byte counting between the
 * handler and the screen.
 */
export const fixedEdits: TextEdit[] = [
  {
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } },
    newText: "整形済み",
  },
  {
    range: { start: { line: 1, character: 2 }, end: { line: 1, character: 2 } },
    newText: "、",
  },
];

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/formatting": (
        _context: RequestContext,
        _params: DocumentFormattingParams,
      ): Promise<TextEdit[]> => {
        return Promise.resolve(fixedEdits);
      },
    },
  });
};
