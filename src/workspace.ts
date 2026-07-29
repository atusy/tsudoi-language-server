import { isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  InitializeParams,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from "vscode-languageserver-protocol";

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
 * are read there rather than at config load, which has already happened by
 * then. The config factory is handed nothing at all since PBI-44, so this is
 * now a statement about WHEN rather than about what the factory receives.
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
   * caller -- see `initialWorkspaceFolders`, which reads the three fields a
   * client may name a root in and reduces them by the protocol's own
   * precedence.
   *
   * A FOLDER SYNTHESISED FROM rootUri OR rootPath ARRIVES HERE AS AN ORDINARY
   * MEMBER, carrying no mark of where it came from. That is the whole of its
   * design: `change` below writes through this list without knowing which
   * entries the client spelled as folders, so deltas apply to a synthesised
   * entry exactly as they apply to any other, and nothing downstream needs a
   * provenance flag to behave correctly.
   */
  initialize(folders: readonly WorkspaceFolder[]): void;
  /**
   * What `workspace/didChangeWorkspaceFolders` reported. WHEN this may be
   * called is not this module's business -- the notification table decides
   * that, once, at the entry.
   */
  change(event: WorkspaceFoldersChangeEvent): void;
}

/**
 * The folder a `rootUri` names, or undefined when the client named none.
 *
 * `uri` IS THE CLIENT'S OWN BYTES, unaltered: `change` below matches URIs as
 * exact strings, so a round trip through the URL parser here would leave a
 * later `removed` naming this folder unable to find it.
 *
 * `name` IS THE FULL PATH, and its justification is that it is DERIVABLE FROM
 * WHAT THE CLIENT SENT WITH NOTHING INVENTED. Every other candidate -- a
 * basename, a label, `"root"` -- adds a decision the client never made.
 *
 * A URI THAT NAMES NO LOCAL PATH IS NOT A ROOT HERE, and this is a deviation
 * worth reading twice: the alternative is `fileURLToPath` THROWING inside the
 * initialize handler, which answers the handshake with an error and leaves the
 * author no server at all. Falling to the rung below is the smaller loss.
 *
 * WHAT THE LIST HOLDS IS NOT PINNED, and that is a split rather than an
 * oversight: `initialize is still answered` admits exactly ONE outcome and IS
 * pinned; what a non-file root leaves in the list admits more than one, so the
 * test asserts the handshake and deliberately nothing about the list. THE
 * ALTERNATIVE CONSIDERED AND REJECTED: hold the folder with a `name` that is
 * not derived from the uri. It loses because it would introduce a THIRD naming
 * convention beside the two below -- the very thing one convention for both
 * synthesis sites exists to prevent.
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
 * The folder a `rootPath` names, or undefined when the client named none.
 *
 * THE SAME CONVENTION AS THE RUNG ABOVE, so the second synthesis site does not
 * invent its own: `name` is the full path -- here VERBATIM, since rootPath
 * already is one -- and the uri is derived from it.
 *
 * ABSOLUTE OR NOTHING, and this is where cwd would otherwise walk back in:
 * `pathToFileURL` RESOLVES A RELATIVE PATH AGAINST cwd, so `""` or `"."` would
 * synthesise a root out of the directory this process happens to have been
 * launched in. That is the fabrication PBI-19's negative control exists against,
 * arriving through a door `??` does not cover, because `""` is neither null nor
 * undefined.
 */
function rootPathFolder(rootPath: string | null | undefined): WorkspaceFolder | undefined {
  if (rootPath === null || rootPath === undefined || isAbsolute(rootPath) === false) {
    return undefined;
  }
  return { uri: pathToFileURL(rootPath).href, name: rootPath };
}

/**
 * The list this session opens with, read from the THREE FIELDS a client may
 * name a root in, in the protocol's own order.
 *
 * WHY THERE ARE THREE, MEASURED FROM THE INSTALLED PROTOCOL TYPES: rootPath is
 * deprecated in favour of rootUri, rootUri in favour of workspaceFolders, and
 * workspaceFolders `is only available if the client supports workspace
 * folders`. So a client without that capability sends NO folders and may still
 * say which project the editor opened -- and reading only the newest field
 * hands that author an empty list, from which they conclude the editor opened
 * nothing when it opened something and said so in the older field.
 *
 * THE ORDER IS THE PROTOCOL'S, NOT OURS: `If both rootPath and rootUri are set
 * rootUri wins` is the specification's own sentence.
 *
 * COMPUTED ONCE, HERE, AND STORED -- never recomputed when the list is read.
 * The tempting shape is a read-time `folders.length > 0 ? folders :
 * synthesise(rootUri)`, which passes the rootUri-only case perfectly and is
 * wrong twice over: the first `added` the client sends would REPLACE the root
 * instead of joining it, and a `removed` that empties the list would make the
 * root REAPPEAR -- a folder the client explicitly removed coming back.
 *
 * WHAT ABSENCE MUST NEVER BECOME IS A ROOT. A client that names none of the
 * three gets an EMPTY list, never cwd and never anything else this process
 * could invent -- see rootPathFolder for the one door that is not obvious.
 *
 * AN EMPTY `workspaceFolders` FALLS THROUGH TO THE RUNGS BELOW, and the three
 * spellings of `no folders here` -- omitted, null and `[]` -- are treated
 * ALIKE.
 *
 * ON HARM ASYMMETRY, which is the reason that holds, rather than on a config
 * author being unable to see which spelling arrived -- that is observability,
 * and they do not need to see the spelling, they need the right answer. A
 * client that supports workspace folders, has NONE CONFIGURED, and still sends
 * `rootUri` is most plausibly saying `I do not do multi-root` rather than
 * `there is no project`; belt-and-braces compatibility is a real client
 * behaviour. Falling through hands that author the root, where stopping hands
 * them SILENT ABSENCE of a root the editor did name.
 *
 * THE COUNTER-ARGUMENT, recorded as considered because it is grounded in this
 * same chain: the installed types call `null` a client that `supports workspace
 * folders but none are configured` -- a STATEMENT of emptiness, where omission
 * is the absence of one -- and workspaceFolders supersedes rootUri. It loses on
 * the asymmetry above, not on being wrong.
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
      // REMOVED FIRST, THEN ADDED, and LSP specifies no order for the two arms.
      // DECIDED BY THE VISIBLE-OVER-SILENT PRINCIPLE, not by which order the
      // code happened to take: a client spelling a rename as one event -- the
      // same URI in both arms -- ends HOLDING the folder, which is a phantom if
      // it is wrong and therefore visible. The other order ends holding
      // NOTHING, which is a gap and therefore silent.
      //
      // NOTHING ASSERTS THIS ORDER. MEASURED, not assumed, and measured against
      // BOTH implementations so it is not read as something PBI-20 broke:
      // applying `added` before `removed` reddens NOTHING -- 321 tests here,
      // 317 before this sprint's two arrived. No test sends the same URI in
      // both arms of ONE event, which is the only shape that can tell the two
      // orders apart. Swapping these two lines is therefore a silent change.
      //
      // ONE COPY PER `removed` ENTRY, which is why this is a loop taking the
      // FIRST match each time rather than a filter over a Set of URIs. A URI
      // held TWICE and removed ONCE keeps one copy; removed twice in ONE event
      // it keeps none.
      //
      // WHY IT IS CORRECT rather than merely defensible, which is how it was
      // first recorded: REMOVING ALL COPIES DISCARDS WHAT THE EVENT CARRIED. A
      // client removing two copies sends two `removed` entries and one removing
      // a single copy sends one, so N entries remove N copies -- an exact
      // mirror. Remove-all wipes an unknown number whatever the client said.
      // This list honours multiplicity on ADD, and symmetry honours it on
      // REMOVE.
      //
      // ASSERTED, NOT ASSUMED, and the two halves are pinned SEPARATELY in
      // test/workspace.test.ts because their hazards differ: `a URI held twice
      // loses one copy per removal, not both to one` reddens if this becomes a
      // filter over every match, and `one event removing a URI twice takes both
      // copies of it` reddens if the `removed` entries are deduplicated before
      // this loop. Neither of those two mistakes reddens the other's test.
      //
      // WHICH copy an entry takes is deliberately NOT pinned -- both tests hold
      // BYTE-IDENTICAL copies, so first-match and last-match are indis-
      // tinguishable there. Nothing downstream may rely on it, and that is
      // MEASURED rather than intended: `findLastIndex` here leaves all 321
      // tests green. Swapping it is therefore free, which is the point.
      //
      // A LOCAL COPY spliced, never `folders` itself, for the same reason the
      // rebind above is a new array: an in-flight handler is holding the old
      // one.
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
