// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/** What the custom request answers with, beside whatever it was sent. */
export const echoMark = "didFocus";

/**
 * A CONFIG THAT DECLARES BOTH HALVES OF THE SURFACE, which is what makes it able
 * to say that reading one did not drop the other: `customMethod` is read beside
 * `methods` rather than inside it, and a read written into the wrong object
 * leaves one of them empty.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        return Promise.resolve({ contents: { kind: "plaintext", value: echoMark } });
      },
    },
    customMethod: {
      "textDocument/didFocus": {
        kind: "request",
        handler: (context, params) => {
          return Promise.resolve({
            result: { mark: echoMark, rootUri: context.tsudoi.rootUri, params },
          });
        },
      },
    },
  });
};
