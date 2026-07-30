import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  InitializeParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver-protocol";

/**
 * The workspace folder list, plus the handle that writes it. The same shape
 * documents.ts uses, and for the same reason: this is state a message WRITES and
 * a request READS, so the writers live on the handle while everything downstream
 * holds only the value.
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
   * The two deprecated root fields as the client spelled them, or `null` each
   * where it named none.
   *
   * A SECOND READER RATHER THAN A WIDER `current`, and that is a decision about
   * what a change to this file may cost: `current` answers the question
   * `workspace/didChangeWorkspaceFolders` writes to, and widening its return
   * type would move every assertion that reads the folder list back -- turning
   * a sprint that adds two fields into a diff that looks like a change to the
   * removal predicate. These two never move after `initialize` anyway.
   */
  readonly roots: () => ClientRoots;
  /**
   * What the client sent at `initialize`, MIRRORED AND NOT INTERPRETED.
   *
   * TAKES THE PARAMS RATHER THAN A LIST because the mirror is this module's
   * business and there is nothing left for a caller to reduce: `workspaceFolders`
   * omitted, `null` and `[]` all mean an empty list, and the two root fields are
   * stored as bytes.
   */
  initialize(params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath">): void;
  /** What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is the notification table's business, decided once at the entry. */
  change(event: WorkspaceFoldersChangeEvent): void;
}

/**
 * The two deprecated fields a client may still name a project root in, as the
 * client spelled them. `null` is `the client named none`, and it is what an
 * OMITTED field arrives as too -- the one collapse this mirror makes, because
 * the protocol offers no third state a reader could act on differently.
 */
export interface ClientRoots {
  readonly rootUri: string | null;
  readonly rootPath: string | null;
}

/**
 * THE FOLDERS THE CLIENT SENT, OR FAILING THAT THE ROOT IT NAMED IN A DEPRECATED
 * FIELD. The reduction tsudoi itself no longer performs, offered to the config
 * author who wants it and never applied behind their back.
 *
 * WHY IT IS THE AUTHOR'S CALL AND NOT tsudoi's: `WorkspaceFolder.name` is
 * defined by the protocol as the label `used to refer to this workspace folder
 * in the user interface`, so it is the CLIENT'S to choose and a server cannot
 * know it. What this function puts there is THE FULL PATH -- derived from what
 * the client sent with nothing invented, and still NOT a label any user would
 * recognise. `RequestContext.workspaceFolders` may not carry such a thing,
 * because nothing there tells an author which entries the client named; a folder
 * that arrives BECAUSE YOU CALLED THIS is a different matter.
 *
 * THE ORDER IS THE PROTOCOL'S OWN: `rootPath` is deprecated in favour of
 * `rootUri`, `rootUri` in favour of `workspaceFolders`, and `workspaceFolders`
 * exists only if the client supports workspace folders -- so a client without
 * that capability sends no folders and may still say which project the editor
 * opened. AN EMPTY LIST FALLS THROUGH, so a client that supports folders, has
 * none configured and still sends `rootUri` is read as `I do not do multi-root`
 * rather than `there is no project`.
 *
 * ABSOLUTE OR NOTHING FOR `rootPath`, AND THIS IS THE GUARD THAT WOULD OTHERWISE
 * HAVE DIED WITH THE SYNTHESIS: `pathToFileURL` RESOLVES A RELATIVE PATH AGAINST
 * cwd, so `""` or `"."` would hand you a root made of whatever directory YOUR
 * SERVER WAS LAUNCHED IN -- through a door `??` does not cover, since `""` is
 * neither null nor undefined. That is the failure this refuses on your behalf,
 * and it is worth naming because a cwd root looks correct in every test an
 * editor runs from the project directory and is wrong for the user who has no
 * project at all.
 *
 * A URI NAMING NO LOCAL PATH YIELDS NO FOLDER RATHER THAN THROWING, and the
 * reason MOVED WITH THE CODE rather than surviving unchanged. It used to be that
 * `fileURLToPath` throwing inside the initialize handler would answer the
 * handshake with an error and leave the author no server at all. Nothing calls
 * this at `initialize` any more: the throw would land in YOUR OWN HANDLER, so a
 * completion handler that called it would fail once per keystroke against an
 * editor connected over `vscode-remote://` or `ssh://`. Smaller than losing the
 * handshake, still not yours to debug.
 *
 * A SESSION'S ROOTS DO NOT CHANGE, but the folder list does, so call this per
 * request -- `context` is a snapshot of request start and so is this answer.
 */
export function foldersWithRootFallback(
  client: ClientRoots & { readonly workspaceFolders: readonly WorkspaceFolder[] },
): readonly WorkspaceFolder[] {
  if (client.workspaceFolders.length > 0) {
    return client.workspaceFolders;
  }
  const rootUri = client.rootUri;
  if (rootUri !== null) {
    try {
      // THE CLIENT'S OWN BYTES for `uri`, never a round trip through the URL
      // parser: `change` matches URIs as exact strings, so a folder holding a
      // reparsed URI is one the client can never remove -- it would send back
      // the spelling it sent, and nothing would match.
      return [{ uri: rootUri, name: fileURLToPath(rootUri) }];
    } catch {
      // AND FALLS THROUGH TO `rootPath`, which is what the rung it replaces did:
      // a client naming a remote root in one field and a local one in the other
      // has named a local project, and the unusable field should not take the
      // usable one down with it.
    }
  }
  const rootPath = client.rootPath;
  if (rootPath === null || isAbsolute(rootPath) === false) {
    return [];
  }
  return [{ uri: pathToFileURL(rootPath).href, name: rootPath }];
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];
  let roots: ClientRoots = { rootUri: null, rootPath: null };

  return {
    current: (): readonly WorkspaceFolder[] => folders,

    roots: (): ClientRoots => roots,

    initialize(params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath">): void {
      // MIRRORED, WITH NOTHING SYNTHESISED AND NOTHING PREFERRED. Omitted, `null`
      // and `[]` are one state here -- an empty list -- and the two root fields
      // travel as the client's own bytes, including `""`, which `??` leaves
      // alone because it is neither null nor undefined.
      //
      // NO ROOT IS BUILT FROM EITHER OF THEM, and that is this sprint's whole
      // subject: a folder needs a `name`, the protocol makes `name` a UI label
      // the client owns, and a server that invents one is stating something no
      // client said. An author who wants the reduction calls
      // `foldersWithRootFallback` and gets a derived name knowingly.
      folders = params.workspaceFolders ?? [];
      roots = { rootUri: params.rootUri ?? null, rootPath: params.rootPath ?? null };
    },

    change(event: WorkspaceFoldersChangeEvent): void {
      // A NEW ARRAY, NEVER A `push` INTO THE OLD ONE: methods.ts hands each
      // request the array it read AT REQUEST START, so mutating in place would
      // rewrite what an in-flight handler is already holding. `readonly` on the
      // field does not stop that -- it is a view, not a frozen array. The local
      // copy below is spliced for the same reason.
      //
      // APPENDED WITH NO DUPLICATE GUARD, deliberately -- AND THE REASON THIS
      // COMMENT USED TO GIVE IS FALSE. It said `a client that adds a URI it
      // already holds holds it twice`, and NO OBSERVED CLIENT CAN PRODUCE THAT:
      // nvim's `Client:_add_workspace_folder` RETURNS WITHOUT NOTIFYING when the
      // folder is already held, so the duplicate never leaves the client. The
      // sentence was carrying the `MEASURED against nvim` label that belongs to
      // its NEIGHBOURS below.
      //
      // WHAT STANDS IS THE WEAKER HALF, WHICH IS TRUE: THIS LIST IS CLIENT STATE
      // WE MIRROR, NOT FILESYSTEM STATE WE INTERPRET, so an `includes` guard
      // would decide on tsudoi's own authority that a client did not mean what
      // it sent.
      //
      // WHAT THAT DOES NOT RULE OUT, stated rather than glossed: should some
      // client send the duplicate, this list holds it twice and the config
      // author is handed both. A guard is UNMOTIVATED rather than refused -- it
      // waits for someone to name a client that sends it, or to show what
      // holding it costs an author.
      //
      // MATCHED AS A STRING, EXACTLY. DO NOT NORMALISE, DO NOT RESOLVE, DO NOT
      // DECODE. Measured against nvim: `…/plain` and `…/plain/` are accepted as
      // two different folders, and every `removed` URI is byte-identical to the
      // `added` one it refers to. A normalising filter would delete a folder the
      // client still holds. By URI and not by name, because LSP has no rename
      // event -- a client sends `removed` then `added`, so a differing name is a
      // different statement about the same folder rather than a mismatch.
      //
      // REMOVED FIRST, THEN ADDED, where LSP specifies no order. A client
      // spelling a rename as one event -- the same URI in both arms -- ends
      // HOLDING the folder, which is visible if wrong; the other order ends
      // holding nothing, which is silent. NOTHING ASSERTS THIS ORDER: no test
      // sends the same URI in both arms, so swapping these two lines is a silent
      // change.
      //
      // ONE COPY PER `removed` ENTRY -- a loop taking the first match, not a
      // filter over a Set. N entries remove N copies, mirroring what the client
      // sent; removing all copies would discard an unknown number whatever the
      // client said. WHICH copy is deliberately not pinned and nothing may rely
      // on it.
      const remaining = [...folders];
      for (const folder of event.removed) {
        const index = remaining.findIndex((held) => held.uri === folder.uri);
        if (index !== -1) {
          remaining.splice(index, 1);
        }
      }
      folders = [...remaining, ...event.added];
    },
  };
}
