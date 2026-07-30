import { isAbsolute } from "node:path";
import type {
  InitializeParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver-protocol";
import type { Tsudoi, WorkspaceFolderStore } from "./types.ts";

/**
 * The workspace folder list, plus the handle that writes it. The same shape
 * documents.ts uses, and for the same reason: this is state a message WRITES and
 * a request READS, so the writers live on the handle while everything downstream
 * holds only the value.
 */
export interface WorkspaceFoldersHandle {
  /**
   * The folders as of NOW, as the store `Tsudoi` publishes them.
   *
   * A VALUE WHERE `roots` BELOW IS A READER, and what makes that safe is what
   * the value IS: this object answers from the mirror at the moment it is ASKED,
   * so holding it from before `initialize` holds nothing stale. A bare array
   * here would have to be a reader for exactly the reason `roots` is one --
   * whoever wires a handler holds it before the handshake, and what they took
   * would be the pre-initialize list for the life of the session.
   */
  readonly folders: WorkspaceFolderStore;
  /**
   * The two deprecated root fields, `rootUri` as the client spelled it and
   * `rootPath` only where it is absolute.
   *
   * `null` IS `THE CLIENT NAMED NONE`, and it is what an OMITTED field arrives
   * as too, because the protocol offers no third state a reader could act on
   * differently. IT IS ALSO WHAT A REFUSED `rootPath` ARRIVES AS -- whether it
   * was refused for being relative or for not being a string at all; see the
   * reason at `initialize` below, and the cost, which is that these states are
   * not distinguishable downstream.
   *
   * A SECOND READER RATHER THAN A WIDER `folders`, and that is a decision about
   * what a change to this file may cost: `folders` answers the question
   * `workspace/didChangeWorkspaceFolders` writes to, and hanging these off that
   * store would move every assertion that reads the folder list -- turning a
   * sprint that adds two fields into a diff that looks like a change to the
   * removal predicate. These two never move after `initialize` anyway.
   *
   * A READER WHERE `folders` ABOVE IS A VALUE, and the asymmetry is the whole
   * point rather than an inconsistency: a store answers WHEN ASKED, while these
   * two are read out on the spot. The fact that they never move after
   * `initialize` does NOT make a value safe -- they are both `null` UNTIL it
   * runs, and whoever wires this handle holds it before then, so something read
   * off here at construction would be that `null` for the life of the session.
   *
   * TYPED AS THE SLICE OF `Tsudoi` IT ANSWERS FOR, so that a field added here
   * and forgotten on that surface, or the reverse, does not compile.
   */
  readonly roots: () => Pick<Tsudoi, "rootUri" | "rootPath">;
  /**
   * What the client sent at `initialize`, MIRRORED AND NOT INTERPRETED.
   *
   * TAKES THE PARAMS RATHER THAN A LIST because the mirror is this module's
   * business and there is nothing left for a caller to reduce: `workspaceFolders`
   * omitted, `null` and `[]` all mean an empty list, and the two root fields are
   * stored as bytes.
   *
   * `| null` IS THE WIRE SHAPE AND NOT A CONVENIENCE. JSON-RPC lets any client
   * send `"params": null`, vscode-jsonrpc hands it through unchanged, and the
   * declared `InitializeParams` is a description of a CONFORMING client rather
   * than a guarantee about the bytes. MEASURED, both runtimes: reading a field
   * off it without this throws inside the `initialize` handler, and the cost is
   * the one recorded at `rootPath` below -- the handshake is answered -32603 and
   * the author has no server. A client that named nothing is mirrored as having
   * named nothing, which is what the three states above already say.
   */
  initialize(
    params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath"> | null,
  ): void;
  /** What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is the notification table's business, decided once at the entry. */
  change(event: WorkspaceFoldersChangeEvent): void;
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];
  let roots: Pick<Tsudoi, "rootUri" | "rootPath"> = { rootUri: null, rootPath: null };

  return {
    // THE MIRROR ITSELF AND NOT A COPY OF IT, which is what makes taking this
    // worth anything: `change()` below replaces this array rather than writing
    // into it, so what one call hands back is the list as of that call and can
    // be iterated again later. Copying here would answer the same question at
    // the cost of saying nothing about the moment.
    folders: { values: (): Iterable<WorkspaceFolder> => folders },

    roots: (): Pick<Tsudoi, "rootUri" | "rootPath"> => roots,

    initialize(
      params: Pick<InitializeParams, "workspaceFolders" | "rootUri" | "rootPath"> | null,
    ): void {
      // MIRRORED, WITH NOTHING SYNTHESISED AND NOTHING PREFERRED. Omitted, `null`
      // and `[]` are one state here -- an empty list -- and `rootUri` travels as
      // the client's own bytes whatever scheme it names.
      //
      // NO ROOT IS BUILT FROM EITHER FIELD, HERE OR ANYWHERE: a folder needs a
      // `name`, the protocol makes `name` a UI label the client owns, and a
      // server that invents one is stating something no client said. tsudoi
      // ships no reduction over these fields either -- an author who wants a
      // root out of them writes it themselves, and what that reading costs is
      // recorded at `rootUri` and `rootPath` in src/types.ts, which is where the
      // author meets the fields.
      //
      // AND A NON-ABSOLUTE `rootPath` IS REFUSED HERE RATHER THAN FORWARDED,
      // which is the one place this handle declines to pass something on. A
      // RELATIVE PATH IS NOT A ROOT: it resolves only against a working
      // directory THE CLIENT DOES NOT SHARE, so forwarding it hands the author a
      // value that means one thing to the editor and another to this process --
      // and `pathToFileURL` turns it into `file://` plus WHATEVER DIRECTORY THIS
      // SERVER WAS LAUNCHED IN, a root no client named. `""` and `"."` are the
      // spellings that arrive, and `??` does not cover either.
      //
      // NOT A BREACH OF THE MIRROR, and the distinction is the whole reason this
      // is defensible: the mirror refuses to NORMALISE what a client meant --
      // two spellings of one directory stay two folders -- and that does not
      // oblige us to forward a value the author cannot correctly use. THE
      // INVARIANT RUNS THE OTHER WAY TOO: `absence must never become a root`
      // bounds the dangerous direction, and this turns a root into absence.
      //
      // `isAbsolute` AND NOT TRUTHINESS, which is not a style preference: `"."`
      // is truthy and is exactly the value the guard exists for.
      //
      // AND `typeof === "string"` RATHER THAN `!== null`, which is a SECOND job
      // in the same expression and the reason the null check is gone rather than
      // kept beside it. `isAbsolute` does not merely answer `false` for a
      // non-string -- it RAISES `ERR_INVALID_ARG_TYPE` (measured, both
      // runtimes), and the throw lands in the `initialize` handler, where the
      // whole handshake is answered -32603 and NOTHING REACHES STDERR: the
      // author sees an editor with no server and an LSP log with no reason. A
      // `"rootPath": 5` is a client that named no path, and it is refused the
      // same way `"."` is. The typeof test subsumes the null one, so writing
      // both would suggest a state the first does not already cover.
      //
      // WHAT IT COSTS, stated rather than glossed: the author cannot tell `the
      // client sent no rootPath` from `the client sent one we refused`. Both
      // arrive as `null`.
      //
      // NOT EXTENDED TO `rootUri`, deliberately: a `vscode-remote://` or `ssh://`
      // root is a VALID URI that merely names no LOCAL path, and refusing it
      // would hide a legitimate value from an author who handles that scheme.
      // `Array.isArray` AND NOT `?? []`, which is the same sweep as the typeof
      // test below and NOT the same failure. A non-array does not throw HERE --
      // it is written down whole and read back whole -- so the first sweep of
      // this field reported it clean. IT THROWS ONE MESSAGE LATER: `change()`
      // opens with `[...folders]`, and `[...5]` is a TypeError in the
      // `workspace/didChangeWorkspaceFolders` handler (measured, both runtimes).
      // A notification has NO RESPONSE, so the client is never told; the folder
      // the user added is silently missing from every handler for the rest of
      // the session, with one line on stderr as the only trace.
      //
      // AN EMPTY LIST is what this handle already reads omitted and `null` as,
      // and a client that sent no usable list named no folders. The predicate
      // subsumes `?? []`, since neither `undefined` nor `null` is an array.
      //
      // ELEMENTS ARE NOT INSPECTED, and that is the mirror holding: `[5]` passes
      // and reaches a handler as it arrived. Nothing downstream throws on it --
      // `held.uri` on a number is `undefined` -- so there is no exit to close,
      // and closing one would be tsudoi deciding what a client meant.
      folders = Array.isArray(params?.workspaceFolders) ? params.workspaceFolders : [];
      const rootPath = params?.rootPath ?? null;
      roots = {
        rootUri: params?.rootUri ?? null,
        rootPath: typeof rootPath === "string" && isAbsolute(rootPath) ? rootPath : null,
      };
    },

    change(event: WorkspaceFoldersChangeEvent): void {
      // A NEW ARRAY, NEVER A `push` INTO THE OLD ONE, AND THAT IS THE WHOLE OF
      // WHAT A HANDLER'S OWN COPY IS WORTH. `Tsudoi.workspaceFolders` is LIVE --
      // a handler reading it after an `await` reads whatever this line last
      // wrote -- so the one defence a handler has is to READ IT ONCE and hold
      // the array. Mutating in place would take that defence away: the array it
      // is already holding would change under it, and there would be no way at
      // all to answer about the folders a request began with. `readonly` on the
      // field does not stop that -- it is a view, not a frozen array -- so the
      // copy is what buys it. The local below is spliced for the same reason.
      //
      // APPENDED WITH NO DUPLICATE GUARD, deliberately, on two grounds worth
      // keeping apart.
      //
      // NO OBSERVED CLIENT SENDS THE DUPLICATE AT ALL: nvim's
      // `Client:_add_workspace_folder` RETURNS WITHOUT NOTIFYING when the folder
      // is already held, so it never leaves the client.
      //
      // AND THIS LIST IS CLIENT STATE WE MIRROR, NOT FILESYSTEM STATE WE
      // INTERPRET, so an `includes` guard would decide on tsudoi's own authority
      // that a client did not mean what it sent.
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
      // holding nothing, which is silent. SWAPPING THESE TWO LINES IS NOT A
      // SILENT CHANGE: `one event removing and adding the same URI ends holding
      // the folder` in test/workspace.test.ts sends that shape from a list that
      // does NOT already hold the URI, which is the only construction the two
      // orders disagree on, and it reddens under the flip.
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
