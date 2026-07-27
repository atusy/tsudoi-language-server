import { createDocumentStore, type DocumentStoreHandle } from "./documents.ts";
import type { Tsudoi } from "./types.ts";

export interface TsudoiRuntime {
  /** What the config factory is handed: exactly the Tsudoi shape, nothing more. */
  readonly tsudoi: Tsudoi;
  /** The server's end of the same store. Never reachable from `tsudoi`. */
  readonly documents: DocumentStoreHandle;
}

/**
 * Builds the pair that share one document store: the read-only view the config
 * author sees, and the handle the server feeds notifications into.
 */
export function createTsudoi(): TsudoiRuntime {
  const documents = createDocumentStore();
  return { tsudoi: { documents: documents.documents }, documents };
}
