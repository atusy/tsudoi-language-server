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
   * What the client named at `initialize`, already reduced to a list by the
   * caller -- see `initialWorkspaceFolders`.
   *
   * A FOLDER SYNTHESISED FROM rootUri OR rootPath ARRIVES AS AN ORDINARY MEMBER,
   * carrying no mark of where it came from, so `change` writes through this list
   * without needing a provenance flag to behave correctly.
   */
  initialize(folders: readonly WorkspaceFolder[]): void;
  /** What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is the notification table's business, decided once at the entry. */
  change(event: WorkspaceFoldersChangeEvent): void;
}

/**
 * The folder a `rootUri` names, or undefined when the client named none.
 *
 * `uri` IS THE CLIENT'S OWN BYTES, unaltered: `change` below matches URIs as
 * exact strings, so a round trip through the URL parser here would leave a later
 * `removed` naming this folder unable to find it.
 *
 * `name` IS THE FULL PATH, because that is derivable from what the client sent
 * with nothing invented. A basename, a label or "root" each add a decision the
 * client never made.
 *
 * A URI THAT NAMES NO LOCAL PATH IS NOT A ROOT HERE: the alternative is
 * `fileURLToPath` throwing inside the initialize handler, which answers the
 * handshake with an error and leaves the author no server at all.
 */
function rootUriFolder(rootUri: string | null | undefined): WorkspaceFolder | undefined {
  if (rootUri === null || rootUri === undefined) {
    return undefined;
  }
  try {
    return { uri: rootUri, name: fileURLToPath(rootUri) };
  } catch {
    return undefined;
  }
}

/**
 * The folder a `rootPath` names, or undefined when the client named none. Same
 * convention as the rung above, so the second synthesis site does not invent its
 * own.
 *
 * ABSOLUTE OR NOTHING, and this is where cwd would otherwise walk back in:
 * `pathToFileURL` RESOLVES A RELATIVE PATH AGAINST cwd, so `""` or `"."` would
 * synthesise a root out of whatever directory this process was launched in --
 * through a door `??` does not cover, since `""` is neither null nor undefined.
 */
function rootPathFolder(rootPath: string | null | undefined): WorkspaceFolder | undefined {
  if (rootPath === null || rootPath === undefined || isAbsolute(rootPath) === false) {
    return undefined;
  }
  return { uri: pathToFileURL(rootPath).href, name: rootPath };
}

/**
 * The list this session opens with, read from the THREE FIELDS a client may name
 * a root in, in the protocol's own order: rootPath is deprecated in favour of
 * rootUri, rootUri in favour of workspaceFolders, and workspaceFolders exists
 * only if the client supports workspace folders. So a client without that
 * capability sends no folders and may still say which project the editor opened;
 * reading only the newest field hands that author an empty list.
 *
 * COMPUTED ONCE AND STORED, never recomputed at read time. The tempting shape is
 * `folders.length > 0 ? folders : synthesise(rootUri)`, which passes the
 * rootUri-only case and is wrong twice: the first `added` would REPLACE the root
 * instead of joining it, and a `removed` that empties the list would make the
 * root REAPPEAR after the client removed it.
 *
 * WHAT ABSENCE MUST NEVER BECOME IS A ROOT. A client naming none of the three
 * gets an empty list -- never cwd. An empty `workspaceFolders` falls through to
 * the rungs below, so omitted, null and `[]` are treated alike: a client that
 * supports folders, has none configured and still sends `rootUri` is most
 * plausibly saying `I do not do multi-root` rather than `there is no project`,
 * and falling through hands that author the root where stopping hands them
 * silent absence of a root the editor did name.
 */
export function initialWorkspaceFolders(
  params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath">,
): readonly WorkspaceFolder[] {
  const stated = params.workspaceFolders ?? [];
  if (stated.length > 0) {
    return stated;
  }
  const synthesised = rootUriFolder(params.rootUri) ?? rootPathFolder(params.rootPath);
  return synthesised === undefined ? [] : [synthesised];
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];

  return {
    current: (): readonly WorkspaceFolder[] => folders,

    initialize(next: readonly WorkspaceFolder[]): void {
      folders = next;
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
