// Relative with .ts, and Bun-free: deno executes this file too.
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";
import { sharedMethods } from "./initialize-absent.ts";

/**
 * The key the report travels under, ON THE SERVED RESULT ITSELF.
 *
 * A TOP-LEVEL CUSTOM KEY AND NOT A FIELD OF `capabilities`, which is read from
 * upstream rather than inferred: `InitializeResult` declares `[custom: string]:
 * LSPAny | ServerCapabilities | undefined`, so this is legal and typed -- and it
 * keeps the report out of the object the neighbouring arms compare whole.
 *
 * A HANDSHAKE HAS NO LATER REQUEST TO REPORT THROUGH, which is the one way this
 * fixture differs from test/fixtures/capabilities-mutation.ts, whose register it
 * otherwise copies.
 */
export const reportKey = "tsudoiPreparedMutationReport";

/** What the handler tries to write over the prepared value. */
export const forgedResolveProvider = false;

/** What a handler reports of its own attempt, as the served result carries it. */
export interface PreparedMutationReport {
  readonly nestedTargetPresent: boolean;
  readonly nestedRefused: boolean;
  readonly topRefused: boolean;
  readonly resolveProviderAfter: boolean | undefined;
  readonly textDocumentSyncAfter: boolean;
}

/**
 * A HANDLER THAT TRIES TO EDIT THE PREPARED RESULT IN PLACE, through a cast --
 * which is not a contrivance but the ONLY thing a compile-time `readonly` leaves
 * open, and exactly what the JavaScript a config author ships does by default.
 *
 * BOTH DEPTHS, because a SHALLOW freeze is the plausible wrong implementation and
 * the worst outcome available: the top-level write throws, so a single-depth arm
 * reports `refused` and goes green, while the nested write LANDS and the result
 * the author returns disagrees with the object they inspected.
 *
 * NESTED FIRST: a successful top-level write REPLACES the object the nested write
 * would have gone through, so the other order hides whether the nested one was
 * ever possible.
 *
 * AND THE TARGET'S PRESENCE IS REPORTED BESIDE THE REFUSALS. Without it a run
 * where `completionProvider` was absent skips the nested write entirely and
 * reports `nestedRefused: false` -- byte for byte what a shallow freeze produces,
 * green and measuring nothing.
 */
const initialize: MethodHandler<"initialize"> = (context) => {
  const prepared = context.preparedResult as unknown as {
    capabilities: { completionProvider?: { resolveProvider?: boolean } };
  };
  const nestedTargetPresent = prepared.capabilities.completionProvider !== undefined;
  let nestedRefused = false;
  let topRefused = false;
  try {
    const completionProvider = prepared.capabilities.completionProvider;
    if (completionProvider !== undefined) {
      completionProvider.resolveProvider = forgedResolveProvider;
    }
  } catch {
    nestedRefused = true;
  }
  try {
    prepared.capabilities = {};
  } catch {
    topRefused = true;
  }
  // READ BACK THROUGH THE PUBLISHED SURFACE, not through the cast above: what
  // tsudoi is about to send is the claim, and it reaches these fields the
  // documented way.
  const report: PreparedMutationReport = {
    nestedTargetPresent,
    nestedRefused,
    topRefused,
    resolveProviderAfter: context.preparedResult.capabilities.completionProvider?.resolveProvider,
    textDocumentSyncAfter: context.preparedResult.capabilities.textDocumentSync !== undefined,
  };
  return Promise.resolve({ ...context.preparedResult, [reportKey]: report });
};

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({ methods: { ...sharedMethods, initialize } });
};
