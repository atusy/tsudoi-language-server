import type { Range } from "@atusy/tsudoi-language-server/deps/protocol";
import type { DocumentView, RequestContext } from "@atusy/tsudoi-language-server/types";

/**
 * A DOCUMENT STORE A TEST DRIVES, FAITHFUL TO TSUDOI'S OWN IN THE ONE RESPECT
 * THESE ARMS TURN ON: `open` builds a FRESH view object and `change` keeps the
 * one it already built.
 *
 * WHY THAT IS THE PROPERTY TO COPY RATHER THAN A DETAIL TO SIMPLIFY AWAY: a
 * handler that memoises per document has to tell `the same buffer, edited` from
 * `a different buffer at the same uri`, and tsudoi's answer to the second is a
 * NEW view -- src/documents.ts builds one per `open` and mutates the TextDocument
 * underneath it on `change`. A fake handing back one object per uri for ever
 * would make a cache keyed on identity look sound when it is not, and a fake
 * building one per ACCESS would make it look useless when it works.
 *
 * IT IS BUILT BY HAND RATHER THAN BY SPAWNING A SERVER because these arms are
 * about THIS PACKAGE; that a handler is routed at all is tsudoi's claim, asserted
 * in tsudoi's own suite.
 */
export interface FakeDocuments {
  /** The context a handler is handed, reading this store live. */
  readonly context: RequestContext;
  /** A `didOpen`: a new buffer at `uri`, and a new view over it. */
  open(uri: string, text: string, version?: number): void;
  /** A `didChange`: the SAME view, answering from new text at a new version. */
  change(uri: string, text: string, version: number): void;
  /** A `didClose`. */
  close(uri: string): void;
  /**
   * How many times a handler has read `uri` WHOLE since it was opened -- a scan.
   *
   * THE READING A MEMO ARM TAKES, and it counts what the handler actually did
   * rather than what a cache reports about itself: a memo that stores an entry
   * and consults it wrongly still shows a second read here.
   */
  reads(uri: string): number;
}

interface Entry {
  text: string;
  version: number;
  reads: number;
  readonly view: DocumentView;
}

export function fakeDocuments(): FakeDocuments {
  const byUri = new Map<string, Entry>();

  const entryFor = (uri: string): Entry => {
    const entry = byUri.get(uri);
    if (entry === undefined) {
      throw new Error(`this fake holds no document at ${uri}`);
    }
    return entry;
  };

  return {
    context: {
      signal: new AbortController().signal,
      tsudoi: {
        documents: {
          get: (uri: string): DocumentView | undefined => byUri.get(uri)?.view,
          values: (): Iterable<DocumentView> =>
            [...byUri.values()].map((entry): DocumentView => entry.view),
        },
        workspaceFolders: { get: () => [], values: () => [] },
        rootUri: null,
        rootPath: null,
        clientCapabilities: {},
        // PRESENT AND REFUSING, which is what a hand-built context owes a member
        // this package never exercises: nothing here notifies, and a stub that
        // RESOLVED would let it start doing so silently.
        notify: () => Promise.reject(new Error("this context sends no notifications")),
      },
    },

    open(uri: string, text: string, version = 1): void {
      // SELF-REFERENTIAL, the same shape src/documents.ts uses: the view reads
      // whatever the entry holds AT THE MOMENT IT IS ASKED, so `change` below
      // needs to replace no getter.
      const entry: Entry = {
        text,
        version,
        reads: 0,
        view: Object.freeze({
          uri,
          languageId: "plaintext",
          get version(): number {
            return entry.version;
          },
          get lineCount(): number {
            return entry.text.split("\n").length;
          },
          getText: (range?: Range): string => {
            if (range === undefined) {
              // COUNTED ONLY FOR A WHOLE READ, because that is what a SCAN costs.
              // A handler asking for one line -- the cursor's, to find the word
              // being typed -- has not rescanned anything, and counting it would
              // make the memo arms redden over work the memo never claimed to save.
              entry.reads += 1;
              return entry.text;
            }
            const lines = entry.text.split(/\r?\n/);
            const line = lines[range.start.line] ?? "";
            return range.start.line === range.end.line
              ? line.slice(range.start.character, range.end.character)
              : line.slice(range.start.character);
          },
          positionAt: () => ({ line: 0, character: 0 }),
          offsetAt: () => 0,
        }),
      };
      byUri.set(uri, entry);
    },

    change(uri: string, text: string, version: number): void {
      const entry = entryFor(uri);
      entry.text = text;
      entry.version = version;
    },

    close(uri: string): void {
      byUri.delete(uri);
    },

    reads(uri: string): number {
      return entryFor(uri).reads;
    },
  };
}
