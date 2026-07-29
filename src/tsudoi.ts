import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { Tsudoi } from "./types.ts";

export interface TsudoiRuntime {
  /**
   * What every `RequestContext` carries as its `tsudoi`: exactly the Tsudoi
   * shape, nothing more.
   *
   * IT USED TO SAY `what the config factory is handed`, and that stopped being
   * true at PBI-44 -- the factory is now handed nothing, and a config reaches
   * this only per request. The distinction is not cosmetic: it is the whole
   * reason a load-time capture of client state is no longer expressible.
   */
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
