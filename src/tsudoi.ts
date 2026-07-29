import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { Tsudoi } from "./types.ts";

export interface TsudoiRuntime {
  /** What every `RequestContext` carries as its `tsudoi`, and the only route a
   * config has to the store. */
  readonly tsudoi: Tsudoi;
  /** The server's end of the same store. Never reachable from `tsudoi`. */
  readonly documents: DocumentStoreHandle;
}

/**
 * Builds the pair that share one document store: the read-only view a config
 * author reaches through `RequestContext`, and the handle the server feeds
 * notifications into.
 */
export function createTsudoi(): TsudoiRuntime {
  const documents = createDocumentStore();
  return { tsudoi: { documents: documents.documents }, documents };
}
