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
      if (params.contentChanges.length === 0) {
        // An empty contentChanges says nothing changed, and the early return is
        // deliberate: MEASURED, `TextDocument.update(document, [], version)`
        // RAISES THE VERSION with the text untouched, and a version that moved
        // without an edit describes a buffer state no client ever sent.
        return;
      }
      // HANDED STRAIGHT THROUGH, WHICH IS THE POINT OF THE STORE BEING
      // UPSTREAM'S. Every entry is applied to the document as the entries
      // BEFORE IT left it, so the ranges within one notification compose --
      // arithmetic this file would otherwise have to write, and the wheel that
      // adopting TextDocument exists to retire.
      //
      // READING ONLY THE LAST ENTRY IS WITHDRAWN, NOT OUTGROWN, and it is
      // recorded because it was a deliberate decision rather than an accident:
      // while tsudoi advertised Full, a conforming client sent exactly one
      // change carrying the whole buffer, and taking the last was the defensive
      // read of that contract. Under Incremental the same line SILENTLY DROPS
      // EDITS, since an earlier entry moves the text a later one addresses.
      //
      // MUTATED IN PLACE: upstream's `update` documents its return as `the same
      // document instance passed in as first parameter`, so the entry already in
      // the map is the one that changes. `set` is kept because the return value
      // is what the CONTRACT promises -- a future upstream that replaced instead
      // of mutating would leave a stale entry here otherwise.
      //
      // WHAT THAT COSTS, and it is now ASSERTED rather than merely disclosed: a
      // config author who held a document from an earlier `get()` used to hold a
      // snapshot and now holds a handle that moves under them. That is pinned by
      // `a reference taken before a change reflects that change afterwards` in
      // test/documents.test.ts, and stated for authors at `DocumentStore` in
      // src/types.ts.
      byUri.set(uri, TextDocument.update(current, params.contentChanges, version));
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
