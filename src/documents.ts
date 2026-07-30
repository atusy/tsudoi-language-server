import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
} from "vscode-languageserver-protocol";
import type { Position, Range } from "vscode-languageserver-textdocument";
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
 * ONE OPEN URI: the buffer synchronisation writes, and the document a config
 * author is handed for it.
 *
 * TWO OBJECTS BECAUSE ONE CANNOT BE BOTH. Upstream's instance MUST stay writable
 * -- `update` writes its content, its version and its line offsets -- and what
 * leaves this store MUST NOT be, since upstream declares its members as METHODS,
 * which are writable properties, so a handler shipping `document.getText = () =>
 * "forged"` would answer every later request from its own string with the buffer
 * itself untouched and the version still rising. Sealing the instance refuses
 * that and stops synchronisation dead; sealing a view over it refuses it and
 * costs synchronisation nothing.
 */
interface OpenDocument {
  /**
   * UPSTREAM'S OWN, AND IT NEVER LEAVES THIS MODULE. Reassigned rather than
   * merely mutated at `change` below, for the reason recorded there.
   */
  document: TextDocument;
  /**
   * WHAT `DocumentStore` HANDS BACK: sealed, and forwarding every read to
   * `document` AT THE MOMENT IT IS ASKED, which is what keeps the published
   * liveness exactly as it was -- a reference kept across an `await` reflects
   * every change that arrived meanwhile, and the boundary is that this object
   * belongs to ONE open, so a reference carried across a close goes on
   * forwarding to a buffer nothing writes any more.
   */
  readonly published: TextDocument;
}

/**
 * EVERY BUFFER IS BUILT BY `TextDocument.create`, AND THAT IS AN INVARIANT
 * RATHER THAN A HABIT: upstream's `update` documents itself as accepting `only
 * documents created by TextDocument.create`, and it throws on anything else. An
 * object literal put into an entry -- by a future shortcut in `open`, or by a
 * test reaching in -- would survive every read and fail at the first edit.
 */
function openDocument(
  uri: string,
  languageId: string,
  version: number,
  text: string,
): OpenDocument {
  // SELF-REFERENTIAL AND SAFE: nothing below READS `entry` while the binding is
  // still uninitialised -- the getters and the forwarders are called by a
  // handler, long afterwards -- so the view reads whatever `document` holds AT
  // THE MOMENT OF THE CALL rather than what it held on this line.
  //
  // BUILT ONCE PER OPEN AND NEVER PER CALL, which is a decision about IDENTITY
  // and not an economy: `documents.get(uri) === documents.get(uri)` holds within
  // one open/close cycle, `values()` yields the same object `get` does, and a
  // reopened uri is a DIFFERENT one. Pinned by `one document is handed back for
  // the life of an open, and another after a reopen` in test/documents.test.ts.
  //
  // EVERY MEMBER UPSTREAM DECLARES, and forgetting one is not a compile error to
  // rely on -- an object literal missing `lineCount` would fail the annotation,
  // but one forwarding it to the wrong place would not. What measures the
  // forwarding is test/document-members.test.ts, which reads `lineCount`,
  // `offsetAt`, `positionAt` and a ranged `getText` off a CHANGED document
  // through a real session.
  const entry: OpenDocument = {
    document: TextDocument.create(uri, languageId, version, text),
    published: Object.freeze({
      get uri(): string {
        return entry.document.uri;
      },
      get languageId(): string {
        return entry.document.languageId;
      },
      get version(): number {
        return entry.document.version;
      },
      get lineCount(): number {
        return entry.document.lineCount;
      },
      getText: (range?: Range): string => entry.document.getText(range),
      positionAt: (offset: number): Position => entry.document.positionAt(offset),
      offsetAt: (position: Position): number => entry.document.offsetAt(position),
    }),
  };
  return entry;
}

/**
 * The published document of each entry, LAZILY, because `values()` hands back
 * upstream's map iterator: building an array here would turn a live iteration
 * into a snapshot taken at the call.
 */
function* publishedOf(entries: Iterable<OpenDocument>): Iterable<TextDocument> {
  for (const entry of entries) {
    yield entry.published;
  }
}

export function createDocumentStore(): DocumentStoreHandle {
  const byUri = new Map<string, OpenDocument>();

  // SEALED WHERE IT IS BUILT, which is the half of the read-only surface that
  // runs. `DocumentStore` declares its operations `readonly` and that is erased
  // at run time, so the JavaScript a config author ships could otherwise put its
  // own `get` here -- and this object serves EVERY request for the life of the
  // session, so one write leaves every later handler asking a store that answers
  // about nothing. SHALLOW is the whole of what this needs: the two members are
  // the operations, and what they hand back is sealed where IT is built -- the
  // published document at `openDocument` above, the mirror's lists in
  // src/workspace.ts.
  const documents: DocumentStore = Object.freeze({
    get: (uri: string): TextDocument | undefined => byUri.get(uri)?.published,
    values: (): Iterable<TextDocument> => publishedOf(byUri.values()),
  });

  return {
    documents,

    open(params: DidOpenTextDocumentParams): void {
      const { uri, languageId, version, text } = params.textDocument;
      byUri.set(uri, openDocument(uri, languageId, version, text));
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
      // WRITTEN INTO THE ENTRY, WHICH IS WHAT THE PUBLISHED DOCUMENT READS, so a
      // config author holding a document from an earlier `get()` holds a handle
      // that moves under them WHILE THE URI STAYS OPEN, AND NO FURTHER. `close`
      // drops the entry and the next `open` builds another one, so a reference
      // carried across a close goes on reading a buffer nothing writes again --
      // a detached snapshot that silently stops moving. ITS VERSION IS NO
      // WARNING EITHER: the reopened document numbers from whatever the client
      // sent at `didOpen`, so the two can report the same version while their
      // texts differ, and a handler checking versions to see whether its
      // reference is current is told everything is fine. An author who must
      // survive a close re-reads `get()`; the store is live, a reference is not.
      // Pinned by `a reference captured before a close stops tracking the
      // reopened document` in test/documents.test.ts.
      //
      // ASSIGNED RATHER THAN LEFT TO THE MUTATION, AND THAT IS WHAT THE ENTRY IS
      // FOR. Upstream's `update` returns the same instance it was handed today,
      // so the assignment is a no-op today; one that REPLACED instead would
      // leave the published document forwarding to a buffer no client writes to
      // any more -- liveness lost with nothing to say so. The return value is
      // what the contract promises, and this is the line that believes it.
      current.document = TextDocument.update(current.document, params.contentChanges, version);
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
