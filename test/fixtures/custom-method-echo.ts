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
 *
 * THE CONTEXT IS ANNOTATED BECAUSE NOTHING ELSE CAN SAY WHICH KIND THIS IS. A
 * custom method's name resolves no context, so a bare arrow here is TS7006 --
 * the cost this surface takes knowingly, and the thing this fixture would be the
 * first to report if it ever stopped being true.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        return Promise.resolve({ contents: { kind: "plaintext", value: echoMark } });
      },
    },
    customMethod: {
      "textDocument/didFocus": (context: RequestContext, params: unknown) => {
        return Promise.resolve({
          result: { mark: echoMark, rootUri: context.tsudoi.rootUri, params },
        });
      },
    },
  });
};
