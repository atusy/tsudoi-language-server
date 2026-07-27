import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
} from "vscode-languageserver-protocol";
import type { DocumentStore, TextDocument } from "./types.ts";

/**
 * The store plus the handle that feeds it. The mutators live HERE and not on
 * DocumentStore, so the `documents` a config author holds cannot write to the
 * buffer -- the Tsudoi shape stays read-only by construction, not by discipline.
 */
export interface DocumentStoreHandle {
  readonly documents: DocumentStore;
  open(params: DidOpenTextDocumentParams): void;
  change(params: DidChangeTextDocumentParams): void;
  close(params: DidCloseTextDocumentParams): void;
}

export function createDocumentStore(): DocumentStoreHandle {
  const byUri = new Map<string, TextDocument>();

  const documents: DocumentStore = {
    get(uri: string): TextDocument | undefined {
      return byUri.get(uri);
    },
    values(): Iterable<TextDocument> {
      return byUri.values();
    },
  };

  return {
    documents,

    open(params: DidOpenTextDocumentParams): void {
      const { uri, languageId, version, text } = params.textDocument;
      byUri.set(uri, { uri, languageId, version, getText: () => text });
    },

    change(params: DidChangeTextDocumentParams): void {
      const { uri, version } = params.textDocument;
      const current = byUri.get(uri);
      if (current === undefined) {
        return;
      }
      // Full sync: a conforming client sends exactly one change carrying the
      // whole buffer, so the last one IS the document. Taking the last rather
      // than the first is the defensive read of the same contract.
      const text = params.contentChanges.at(-1)?.text;
      if (text === undefined) {
        return; // An empty contentChanges says nothing changed.
      }
      // Replaced, not mutated: `version` is readonly, and replacement is what
      // makes a shrinking edit shrink.
      byUri.set(uri, { uri, languageId: current.languageId, version, getText: () => text });
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
