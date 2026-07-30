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

/**
 * THE LOCATION a uri names, as the one string BOTH SIDES of the lookup are put
 * into, or `undefined` where no parser accepts it.
 *
 * THE TRAILING-SLASH FORM IS THE FORM, and that choice is what makes one
 * function serve both sides: `new URL(".", document)` hands back a directory,
 * which always ends in `/`, so a folder put into the same form meets it without
 * either side being probed twice. `file:///` is the one location that CANNOT be
 * written without its slash -- stripped, it is `file://`, which says empty
 * authority -- so normalising the other way would need a special case for the
 * root that this needs for nothing.
 *
 * NORMALISING BOTH SIDES IS THE WHOLE OF WHY THIS IS SAFE, and normalising ONE
 * would be the bug it looks like. The parse rewrites bytes -- it drops a
 * `localhost` authority, lowercases the scheme, resolves dot segments, reconciles
 * percent-encoding -- so a rewritten document uri compared against a folder's raw
 * bytes MISSES the folder. Compared against a folder put through the same
 * rewrite, it matches, and every rewrite becomes a real client mismatch that now
 * resolves rather than a folder lost. Measured identical under bun 1.3.13 and
 * deno 2.9.2, folder against document:
 *
 *   file://LOCALHOST/a/b  file://LOCALHOST/a/b/c.ts  both file:///a/b/
 *   FILE:///Home/proj     FILE:///Home/proj/a.ts     both file:///Home/proj/
 *   file:///a/../a/b      file:///a/b/c.ts           both file:///a/b/
 *   file:///p%20q         file:///p q/a.ts           both file:///p%20q/
 *
 * WHAT IT DOES NOT RECONCILE, stated rather than glossed: the parse lowercases
 * the scheme and the authority and leaves THE PATH'S CASE alone, so `…/Home` and
 * `…/home` stay two locations. That is the URL Standard's own line and not one
 * drawn here.
 *
 * APPENDED TO A NON-HIERARCHICAL URI TOO, DELIBERATELY. `untitled:Untitled-1/`
 * is a string no client ever sends, and it is nonetheless the right key for it:
 * both sides are built the same way, so the only pair that can collide is a pair
 * that already named one thing. The alternative -- comparing those uris raw --
 * would leave a folder held as `…/plain/` unfindable by its own bare uri, since
 * the walk below cannot reach a location it is standing on.
 *
 * `undefined` RATHER THAN A THROW, and `unknown` rather than `string`, because
 * BOTH CALLERS CAN BE HANDED A NON-URI. The mirror passes a non-conforming entry
 * through, so `folder.uri` may be anything at all, and `get` takes whatever a
 * config author passes.
 */
function locationOf(uri: unknown): string | undefined {
  if (typeof uri !== "string") {
    return undefined;
  }
  try {
    return new URL(uri.endsWith("/") ? uri : `${uri}/`).href;
  } catch {
    return undefined;
  }
}

/**
 * Every location a folder could be HELD AT for `uri`, innermost first: the
 * location `uri` itself names, then each directory above it, ending at the root
 * of its own authority.
 *
 * THE WALK TERMINATES BECAUSE A ROOT IS ITS OWN PARENT, which is the parse's
 * property and not a bound computed here: `new URL("..", "file:///")` is
 * `file:///` and `new URL("..", "file://host/")` is `file://host/`, so the pass
 * that would climb out of the authority hands back what it was given and stops.
 * Measured on both runtimes, and measured NEVER TO LENGTHEN in between. A
 * hand-derived `<scheme>://<authority>` boundary would have to answer the same
 * question the parse already answers, and answer it from bytes the parse has
 * already rewritten.
 *
 * THE URI'S OWN LOCATION IS YIELDED SEPARATELY FROM THE WALK, and the two cannot
 * be folded together: `new URL(".", uri)` on a uri that names a directory hands
 * back its PARENT, so a folder asked about by its own uri would be answered by
 * whatever holds it. It is also the only level a non-hierarchical uri has --
 * `new URL(".", "untitled:Untitled-1")` THROWS on both runtimes, where
 * `new URL("untitled:Untitled-1")` does not -- so the walk simply does not
 * proceed for one, and the unsaved buffer every editor sends is answered rather
 * than defended against.
 */
function* locations(uri: string): Generator<string> {
  const self = locationOf(uri);
  if (self !== undefined) {
    yield self;
  }
  try {
    let current = new URL(".", uri).href;
    for (;;) {
      yield current;
      const parent = new URL("..", current).href;
      if (parent === current) {
        return;
      }
      current = parent;
    }
  } catch {
    // NOTHING THIS FUNCTION IS ASKED MAY THROW OUT OF IT, and a uri no parser
    // accepts is a uri with no directories above it rather than an error: the
    // empty string, `not a uri`, and the non-hierarchical schemes above all end
    // the walk here. What the caller sees is a uri no folder covers, which is
    // the answer it already has a shape for.
  }
}

/**
 * The folders the client holds, filed under the location each one names, in
 * mirror order within each entry.
 *
 * KEYED BY THE `href` STRING AND NEVER BY A `URL`. A `Map` compares keys by
 * SAMEVALUEZERO, so a `URL` key is compared BY REFERENCE: a lookup built from an
 * equal uri constructs a different object and misses every time, which is a total
 * miss that no single row of a table reads differently from `this folder is not
 * held`. The `href` is the parse's own answer as a string, and two strings that
 * are equal are equal.
 *
 * AN ENTRY WITH NO LOCATION IS SKIPPED AND THE MIRROR KEEPS IT, which is the one
 * thing that can happen to a folder here and is worth naming: a uri no parser
 * accepts has no location to be filed under, so it is UNREACHABLE THROUGH `get`
 * while `values()` still hands it over. Dropping it from the mirror instead would
 * be tsudoi deciding a client did not send what it sent.
 *
 * AND THE BUILD MUST NOT THROW, for a reason that is about WHERE IT RUNS rather
 * than about uris: this is called from `initialize`, whose handler answers the
 * whole handshake -32603 on a throw and leaves the author an editor with no
 * server and an LSP log with no reason. `[5]` and `[null]` both reach here --
 * `Array.isArray` is all that guards the mirror -- so `uri` is read off through
 * `locationOf`, which is total.
 */
function locationIndex(
  folders: readonly WorkspaceFolder[],
): ReadonlyMap<string, WorkspaceFolder[]> {
  const index = new Map<string, WorkspaceFolder[]>();
  for (const folder of folders) {
    const location = locationOf((folder as { readonly uri?: unknown } | null | undefined)?.uri);
    if (location === undefined) {
      continue;
    }
    const held = index.get(location);
    if (held === undefined) {
      index.set(location, [folder]);
    } else {
      held.push(folder);
    }
  }
  return index;
}

export function createWorkspaceFolders(): WorkspaceFoldersHandle {
  let folders: readonly WorkspaceFolder[] = [];
  let index: ReadonlyMap<string, WorkspaceFolder[]> = new Map();
  let roots: Pick<Tsudoi, "rootUri" | "rootPath"> = { rootUri: null, rootPath: null };

  /**
   * THE ONE PLACE THE MIRROR IS WRITTEN, so that the index cannot be left
   * answering about a list that is gone. Both writers below go through it.
   *
   * EAGER, AND THE COST IS ON THE RIGHT SIDE: the mirror is replaced twice a
   * session in the ordinary case -- once at `initialize`, once per folder the
   * user adds -- while `get` runs per request, and a config author calling it
   * per completion item is doing nothing unreasonable. A lazy build would move
   * the work to the same place but add an INVALIDATION OBLIGATION to both
   * writers, where forgetting either is a folder that goes on answering after
   * the user removed it -- silent, and invisible to any test that only ever adds.
   */
  function mirror(next: readonly WorkspaceFolder[]): void {
    folders = next;
    index = locationIndex(next);
  }

  return {
    // THE MIRROR ITSELF AND NOT A COPY OF IT, which is what makes taking this
    // worth anything: `change()` below replaces this array rather than writing
    // into it, so what one call hands back is the list as of that call and can
    // be iterated again later. Copying here would answer the same question at
    // the cost of saying nothing about the moment.
    folders: {
      get(uri: string): readonly WorkspaceFolder[] {
        // THE FIRST LEVEL THAT ANSWERS, AND EVERY FOLDER AT IT. The walk is
        // innermost-first, so stopping at the first level that holds anything is
        // what makes a nested folder resolve to the inner one -- this is NOT
        // every ancestor's folders, and a document under `…/w/inner` inside
        // `…/w` answers with `inner` alone.
        //
        // SEVERAL FOLDERS AT ONE LEVEL ARE ALL RETURNED, and that is the whole
        // reason this hands back a list. Two folders reach one level only by
        // NAMING ONE LOCATION -- a uri the client sent twice, `…/plain` beside
        // `…/plain/`, `file://LOCALHOST/a` beside `file:///a` -- and returning
        // one of them would be tsudoi deciding on its OWN AUTHORITY which of two
        // things the client said it did not mean. This mirror does not interpret
        // client state, and one folder out of two is an interpretation. Handing
        // back both removes the tie-break rule rather than choosing a better one,
        // and mirror order survives as the order they are PRESENTED in.
        //
        // AN EMPTY LIST AND NEVER `undefined`, so a handler writes
        // `for (const folder of tsudoi.workspaceFolders.get(uri))` with nothing
        // in front of it. `no folder covers this` and `matched nothing` are one
        // state here, so the empty list loses no answer the caller could have
        // told apart.
        //
        // THE INDEX'S OWN LIST AND NOT A COPY OF IT, which is what `values()`
        // does with the mirror and for the same reason: `mirror()` REBUILDS the
        // index rather than writing into it, so a list a handler took before an
        // `await` still answers about the moment it was taken.
        for (const location of locations(uri)) {
          const held = index.get(location);
          if (held !== undefined) {
            return held;
          }
        }
        return [];
      },
      values: (): Iterable<WorkspaceFolder> => folders,
    },

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
      // and reaches a handler as it arrived. The one thing that READS an element
      // before a handler does is the lookup's index, built below by `mirror()`,
      // and it reads `uri` off whatever it is handed without throwing on it --
      // so there is no exit to close here, and closing one would be tsudoi
      // deciding what a client meant.
      mirror(Array.isArray(params?.workspaceFolders) ? params.workspaceFolders : []);
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
      mirror([...remaining, ...event.added]);
    },
  };
}
