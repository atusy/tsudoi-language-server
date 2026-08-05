import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
  Position,
  Range,
} from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentStore, DocumentView } from "./types.ts";

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
 * -- `update` writes its content, its version and its line offsets -- so sealing
 * it against a handler's forgery would stop synchronisation dead, where sealing
 * a view over it costs synchronisation nothing.
 */
interface OpenDocument {
  document: TextDocument;
  /**
   * What `DocumentStore` hands back: sealed, and forwarding every read to
   * `document` AT THE MOMENT IT IS ASKED.
   */
  readonly published: DocumentView;
}

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
 * The published document of each entry, LAZILY, and nothing reddens if you
 * return an array instead: `values()` hands back upstream's map iterator, so a
 * materialised list would answer about the moment of the CALL where the store
 * answers about the moment of the READ.
 */
function* publishedOf(entries: Iterable<OpenDocument>): Iterable<DocumentView> {
  for (const entry of entries) {
    yield entry.published;
  }
}

export function createDocumentStore(): DocumentStoreHandle {
  const byUri = new Map<string, OpenDocument>();

  const documents: DocumentStore = Object.freeze({
    get: (uri: string): DocumentView | undefined => byUri.get(uri)?.published,
    values: (): Iterable<DocumentView> => publishedOf(byUri.values()),
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
        return;
      }
      // ASSIGNED RATHER THAN LEFT TO THE MUTATION, and nothing reddens if you
      // drop the assignment: upstream's `update` returns the same instance it
      // was handed today, so this is a no-op today. One that REPLACED instead
      // would leave the published document forwarding to a buffer no client
      // writes to any more -- liveness lost with nothing to say so.
      current.document = TextDocument.update(current.document, params.contentChanges, version);
    },

    close(params: DidCloseTextDocumentParams): void {
      byUri.delete(params.textDocument.uri);
    },
  };
}
