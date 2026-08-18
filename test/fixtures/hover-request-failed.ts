import { LSPErrorCodes, ResponseError } from "@atusy/tsudoi-language-server/deps/error";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";

export const requestFailedMessage = "hover request could not be completed";

export default (): Promise<TsudoiConfig> =>
  Promise.resolve({
    methods: {
      "textDocument/hover": (_context: RequestContext, _params: HoverParams): Promise<Hover> => {
        throw new ResponseError(LSPErrorCodes.RequestFailed, requestFailedMessage);
      },
    },
  });
