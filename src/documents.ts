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
      // that moves under them. `set` is kept anyway, because the return value is
      // what the contract promises and an upstream that replaced instead of
      // mutating would otherwise leave a stale entry here.
      byUri.set(uri, TextDocument.update(current, params.contentChanges, version));
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
