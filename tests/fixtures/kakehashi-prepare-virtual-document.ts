// By package specifier, as a config author writes it; Bun-free: deno executes this file too.
import {
  advertiseVirtualDocumentPrepare,
  prepareVirtualDocument,
} from "@atusy/tsudoi-kakehashi-prepare-virtual-document";
import type { RequestContext, TsudoiConfig } from "@atusy/tsudoi-language-server/types";

/** The method kakehashi sends, and the only custom method this config declares. */
export const prepareMethod = "kakehashi/virtualDocument/prepare";

/** What fills a Python gap in this config; every other language keeps its gaps. */
export const pythonPlaceholder = "None";

/**
 * A prepare peer as a config author assembles one: the capability in the
 * handshake, the handler under its wire name, and a rule for one language.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      initialize: (context) =>
        Promise.resolve(advertiseVirtualDocumentPrepare(context.preparedResult)),
    },
    customMethods: {
      [prepareMethod]: (context: RequestContext, params: unknown) =>
        prepareVirtualDocument(context, params, {
          languages: { python: { gap: pythonPlaceholder } },
        }),
    },
  });
};
