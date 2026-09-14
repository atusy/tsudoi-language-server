// Relative with .ts, and Bun-free: deno executes this file too.
import type { Hover, HoverParams } from "vscode-languageserver-protocol";
import type {
  NotificationContext,
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

export const releaseLifecycle = "test/releaseDocumentLifecycle";
export const documentUri = "file:///queued-request.ts";
export const openedText = "before change";
export const changedText = "after change";

export default (): Promise<TsudoiConfig> => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });

  return Promise.resolve({
    methods: {
      "textDocument/hover": (context: RequestContext, params: HoverParams): Promise<Hover> => {
        const text = context.tsudoi.documents.get(params.textDocument.uri)?.getText() ?? "missing";
        return Promise.resolve({ contents: { kind: "plaintext", value: text } });
      },
    },
    customMethods: {
      "textDocument/didOpen": async (
        _context: NotificationContext,
        _params: unknown,
      ): Promise<void> => {
        await held;
      },
      [releaseLifecycle]: (_context: NotificationContext, _params: unknown): Promise<void> => {
        release();
        return Promise.resolve();
      },
    },
  });
};
