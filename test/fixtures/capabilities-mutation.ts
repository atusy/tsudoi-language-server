// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * What the client DECLARED, so the test and the fixture cannot drift into
 * measuring different values.
 */
export const declaredSupport = false;

export const forgedSupport = true;

export interface MutationReport {
  readonly nestedRefused: boolean;
  readonly topRefused: boolean;
  readonly insertReplaceSupport: boolean | undefined;
}

/**
 * A HANDLER THAT TRIES TO REWRITE THE CLIENT'S OWN STATEMENT, through a cast --
 * which is not a contrivance but the ONLY thing a compile-time `readonly` leaves
 * open, and exactly what the JavaScript a config author ships does by default.
 *
 * BOTH DEPTHS, because they fail differently: the top-level property is what a
 * one-level `readonly` already covers in a type, and the NESTED one is the field
 * `@atusy/tsudoi-completion-path` actually reads to choose its edit shape. A defence
 * that reached only the first would leave the lie that matters.
 *
 * NESTED FIRST: a successful top-level write REPLACES the object the nested
 * write would have gone through, so the other order hides whether the nested one
 * was ever possible.
 */
export default (): Promise<TsudoiConfig> => {
  const hover: MethodHandler<"textDocument/hover"> = (context) => {
    const capabilities = context.tsudoi.clientCapabilities as unknown as {
      textDocument?: { completion?: { completionItem?: { insertReplaceSupport?: boolean } } };
    };
    let nestedRefused = false;
    let topRefused = false;
    try {
      const completionItem = capabilities.textDocument?.completion?.completionItem;
      if (completionItem !== undefined) {
        completionItem.insertReplaceSupport = forgedSupport;
      }
    } catch {
      nestedRefused = true;
    }
    try {
      capabilities.textDocument = {};
    } catch {
      topRefused = true;
    }
    // READ BACK THROUGH THE PUBLISHED SURFACE, not through the cast above: what
    // the NEXT handler would see is the claim, and it reaches this field the
    // documented way.
    const report: MutationReport = {
      nestedRefused,
      topRefused,
      insertReplaceSupport:
        context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem
          ?.insertReplaceSupport,
    };
    // A MarkupContent rather than a bare string, which is what the neighbouring
    // reporting fixtures send: the test reads `contents.value`, and a plain
    // string would arrive as a shape it parses to nothing -- a red that looks
    // like the claim failing and is not.
    return Promise.resolve({ contents: { kind: "plaintext", value: JSON.stringify(report) } });
  };
  return Promise.resolve({ methods: { "textDocument/hover": hover } });
};
