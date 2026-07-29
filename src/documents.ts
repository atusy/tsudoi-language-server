import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentStore } from "./types.ts";

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

/**
 * EVERY ENTRY IS BUILT BY `TextDocument.create`, AND THAT IS AN INVARIANT RATHER
 * THAN A HABIT: upstream's `update` documents itself as accepting `only
 * documents created by TextDocument.create`, and it throws on anything else. An
 * object literal put into this map -- by a future shortcut in `open`, or by a
 * test reaching in -- would survive every read and fail at the first edit.
 */
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
      byUri.set(uri, TextDocument.create(uri, languageId, version, text));
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
      // MUTATED IN PLACE, and this replaces a note that said the opposite:
      // upstream's `update` documents its return as `the same document instance
      // passed in as first parameter`, so the entry already in the map is the
      // one that changes. `set` is kept because the return value is what the
      // CONTRACT promises -- a future upstream that replaced instead of mutating
      // would leave a stale entry here otherwise.
      //
      // WHAT THAT COSTS, said out loud because nothing asserts it: a config
      // author who held a document from an earlier `get()` used to hold a
      // snapshot and now holds a handle that moves under them. Re-reading from
      // the store at the top of a handler is the only thing that was ever safe,
      // and it is now the only thing that works.
      byUri.set(uri, TextDocument.update(current, [{ text }], version));
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
