// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

/** Distinctive enough that finding it on stderr cannot be a coincidence. */
export const throwMessage = "hover-throws fixture: 意図的な失敗";

/**
 * What the handler answers from its second call on. Failing only once is what
 * turns `a subsequent hover is answered normally` into a positive observation:
 * a handler that always threw could only show that the server had survived.
 */
export const recoveredHover: Hover = {
  contents: { kind: "markdown", value: "二度目は答えます。" },
};

export default (): Promise<TsudoiConfig> => {
  let calls = 0;
  return Promise.resolve({
    methods: {
      // Throws synchronously, before any promise exists to reject.
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        calls += 1;
        if (calls === 1) {
          throw new Error(throwMessage);
        }
        return Promise.resolve(recoveredHover);
      },
    },
  });
};
