import type { WorkspaceFolder, WorkspaceFoldersChangeEvent } from "vscode-languageserver-protocol";

/**
 * The workspace folder list, plus the handle that writes it.
 *
 * THE SAME SHAPE documents.ts USES, and for the same reason: this is state a
 * message WRITES and a request READS, so the writers live on the handle while
 * everything downstream holds only the value. A `let` in startServer served the
 * one writer it had; a second writer arriving from a notification is what this
 * shape is the answer to -- an entry in the notification table can be handed
 * this handle instead of reaching back into startServer's locals.
 *
 * The folders this session was opened with are EMPTY until `initialize`
 * arrives, which is the only moment a client states them -- and the reason they
 * are read there rather than handed to the config factory, which has already
 * run by then.
 */
export interface WorkspaceFoldersHandle {
  /**
   * The folders as of NOW.
   *
   * A function rather than a value because registration happens before
   * `initialize` does: whoever wires a handler holds nothing yet, and a value
   * captured at that moment would be the pre-initialize one forever.
   */
  readonly current: () => readonly WorkspaceFolder[];
  /**
   * What the client stated at `initialize`, already normalised to a list by the
   * caller -- which is where the protocol's two absent states are read, since
   * that is where `InitializeParams` is in hand.
   */
  initialize(folders: readonly WorkspaceFolder[]): void;
  /**
   * What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is not this module's business -- the notification table decides
   * that, once, at the entry.
   */
  change(event: WorkspaceFoldersChangeEvent): void;
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];

  return {
    current: (): readonly WorkspaceFolder[] => folders,

    initialize(next: readonly WorkspaceFolder[]): void {
      folders = next;
    },

    change(event: WorkspaceFoldersChangeEvent): void {
      // A NEW ARRAY, NEVER A `push` INTO THE OLD ONE, and this is the line that
      // makes per-request capture true rather than accidental: methods.ts hands
      // each request the array it read AT REQUEST START, so mutating in place
      // would rewrite what an in-flight handler is already holding. `readonly`
      // on the field does not stop that -- it is a view, not a frozen array --
      // so the rule lives here, where the edit would be made.
      //
      // APPENDED WITH NO DUPLICATE GUARD, deliberately. THIS LIST IS CLIENT
      // STATE WE MIRROR, NOT FILESYSTEM STATE WE INTERPRET: a client that adds
      // a URI it already holds holds it twice, and an `includes` guard here
      // would pass every other requirement while silently disagreeing with the
      // client about what is open. Decided on OBSERVABILITY -- a phantom entry
      // shows up as visibly wrong items, a missing one is silent absence.
      //
      // MATCHED AS A STRING, EXACTLY. DO NOT NORMALISE, DO NOT RESOLVE, DO NOT
      // DECODE. MEASURED against nvim over four folders added and three
      // removed: `…/plain` and `…/plain/` are accepted as TWO DIFFERENT
      // FOLDERS, removing one leaves the other, percent-encoding arrives with
      // LOWERCASE hex, and every `removed` URI is BYTE-IDENTICAL to the `added`
      // one it refers to. A normalising filter would delete a folder the client
      // still holds -- silently, and only for the users whose paths collide
      // under whatever rule it applied.
      //
      // BY URI AND NOT BY NAME: LSP has no rename event, so a client that wants
      // one sends `removed` then `added`, and a name that differs is a
      // different statement about the same folder rather than a mismatch.
      //
      // REMOVED FIRST, THEN ADDED, and LSP specifies no order for the two arms:
      // this way a client that spells a rename as one event -- the same URI in
      // both arms -- ends with the folder it named last, where the other order
      // would leave it holding nothing.
      //
      // WHAT IS UNSPECIFIED AND WENT THIS WAY BY DEFAULT, recorded rather than
      // pinned by a test, since nobody has chosen an outcome: a URI held TWICE
      // and removed ONCE loses BOTH copies, because this filter matches every
      // entry. The alternative -- removing one copy per `removed` entry -- is
      // equally defensible and no client observed here produces the case.
      const removed = new Set(event.removed.map((folder) => folder.uri));
      folders = [...folders.filter((folder) => removed.has(folder.uri) === false), ...event.added];
    },
  };
}
