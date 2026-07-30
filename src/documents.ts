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

  // SEALED WHERE IT IS BUILT, which is the half of the read-only surface that
  // runs. `DocumentStore` declares its operations `readonly` and that is erased
  // at run time, so the JavaScript a config author ships could otherwise put its
  // own `get` here -- and this object serves EVERY request for the life of the
  // session, so one write leaves every later handler asking a store that answers
  // about nothing. SHALLOW is the whole of what this needs: the two members are
  // the operations, and what they hand back is sealed where IT is built -- the
  // the documents this module builds, the mirror's lists in src/workspace.ts.
  const documents: DocumentStore = Object.freeze({
    get: (uri: string): TextDocument | undefined => byUri.get(uri),
    values: (): Iterable<TextDocument> => byUri.values(),
  });

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
        // An empty contentChanges says nothing changed, and returning early is
        // deliberate: upstream's `update` called with an empty change array
        // RAISES THE VERSION and leaves the text alone, which describes a buffer
        // state no client ever sent.
        return;
      }
      // HANDED STRAIGHT THROUGH: every entry is applied to the document as the
      // entries BEFORE IT left it, so ranges within one notification compose.
      // Reading only the last entry silently DROPS EDITS under Incremental sync,
      // since an earlier entry moves the text a later one addresses.
      //
      // MUTATED IN PLACE -- upstream's `update` returns the same instance -- so a
      // config author holding a document from an earlier `get()` holds a handle
      // that moves under them WHILE THE URI STAYS OPEN, AND NO FURTHER. `close`
      // drops the entry and the next `open` builds a new document, so a reference
      // carried across a close is a detached snapshot that silently stops moving.
      // ITS VERSION IS NO WARNING EITHER: the reopened document numbers from
      // whatever the client sent at `didOpen`, so the two can report the same
      // version while their texts differ, and a handler checking versions to see
      // whether its reference is current is told everything is fine. An author
      // who must survive a close re-reads `get()`; the store is live, a
      // reference is not. Pinned by `a reference captured before a close stops
      // tracking the reopened document` in test/documents.test.ts.
      //
      // `set` is kept anyway, because the return value is what the contract
      // promises and an upstream that replaced instead of mutating would
      // otherwise leave a stale entry here.
      byUri.set(uri, TextDocument.update(current, params.contentChanges, version));
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
