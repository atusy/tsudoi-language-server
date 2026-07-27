import type { DocumentStore, TextDocument, Tsudoi } from "./types.ts";

/** Read-only and always empty. PBI-2 replaces this implementation, not its shape. */
const emptyDocuments: DocumentStore = {
  get(): TextDocument | undefined {
    return undefined;
  },
  values(): Iterable<TextDocument> {
    return [];
  },
};

export function createTsudoi(): Tsudoi {
  return { documents: emptyDocuments };
}
