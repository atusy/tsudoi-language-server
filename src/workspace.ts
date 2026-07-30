import type {
  InitializeParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver-protocol";
import type { RequestContext } from "./types.ts";

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
   * The two deprecated root fields as the client spelled them.
   *
   * `null` IS `THE CLIENT NAMED NONE`, and it is what an OMITTED field arrives
   * as too -- the one collapse this mirror makes, because the protocol offers no
   * third state a reader could act on differently. Nothing else is normalised:
   * `""` and `"."` are values a client can send and they travel as sent.
   *
   * A SECOND READER RATHER THAN A WIDER `current`, and that is a decision about
   * what a change to this file may cost: `current` answers the question
   * `workspace/didChangeWorkspaceFolders` writes to, and widening its return
   * type would move every assertion that reads the folder list back -- turning
   * a sprint that adds two fields into a diff that looks like a change to the
   * removal predicate. These two never move after `initialize` anyway.
   *
   * TYPED AS THE SLICE OF `RequestContext` IT BECOMES, so that a field added
   * here and forgotten at the context, or the reverse, does not compile. It is
   * the only reason this module names a type from src/types.ts at all.
   */
  readonly roots: () => Pick<RequestContext, "rootUri" | "rootPath">;
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

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];
  let roots: Pick<RequestContext, "rootUri" | "rootPath"> = { rootUri: null, rootPath: null };

  return {
    current: (): readonly WorkspaceFolder[] => folders,

    roots: (): Pick<RequestContext, "rootUri" | "rootPath"> => roots,

    initialize(params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath">): void {
      // MIRRORED, WITH NOTHING SYNTHESISED AND NOTHING PREFERRED. Omitted, `null`
      // and `[]` are one state here -- an empty list -- and the two root fields
      // travel as the client's own bytes, including `""`, which `??` leaves
      // alone because it is neither null nor undefined.
      //
      // NO ROOT IS BUILT FROM EITHER OF THEM, HERE OR ANYWHERE: a folder needs a
      // `name`, the protocol makes `name` a UI label the client owns, and a
      // server that invents one is stating something no client said. tsudoi
      // ships no reduction over these fields either -- an author who wants a
      // root out of them writes it themselves, and the two hazards that reading
      // carries are recorded at `rootUri` and `rootPath` in src/types.ts, which
      // is where the author meets the fields.
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
