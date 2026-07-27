import type { DidOpenTextDocumentParams } from "vscode-languageserver-protocol";
import type { DocumentStore, TextDocument } from "./types.ts";

/**
 * The store plus the handle that feeds it. The mutators live HERE and not on
 * DocumentStore, so the `documents` a config author holds cannot write to the
 * buffer -- the Tsudoi shape stays read-only by construction, not by discipline.
 */
export interface DocumentStoreHandle {
  readonly documents: DocumentStore;
  open(params: DidOpenTextDocumentParams): void;
}

export function createDocumentStore(): DocumentStoreHandle {
  let document: TextDocument | undefined;

  const documents: DocumentStore = {
    get(uri: string): TextDocument | undefined {
      return document?.uri === uri ? document : undefined;
    },
    values(): Iterable<TextDocument> {
      return document === undefined ? [] : [document];
    },
  };

  return {
    documents,
    open(params: DidOpenTextDocumentParams): void {
      const { uri, languageId, version, text } = params.textDocument;
      document = { uri, languageId, version, getText: () => text };
    },
  };
}
