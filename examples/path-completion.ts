/**
 * Path completion for a config author's own `textDocument/completion` handler.
 *
 * WHAT THIS IS: an EXAMPLE, in examples/, and not a line of it lives in
 * tsudoi. Everything below is written with what a config handler is already
 * given -- the live document, the cursor, and the config author's own
 * judgement about what a path looks like in their language. tsudoi contributes
 * the streaming and nothing else.
 *
 * MEASURED, and it is why this file can exist at all: CompletionParams carries
 * `textDocument`, `position` and `context` only -- never the typed prefix --
 * and `context.triggerCharacter` is null on an invoked completion. The current
 * line read out of the document is therefore the ONLY source of what the user
 * has typed, and reading it needs no new tsudoi API.
 */
import { opendir, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  CompletionItemKind,
  type CompletionItem,
  type CompletionParams,
  type Position,
} from "vscode-languageserver-protocol";
import type { RequestContext } from "@atusy/tsudoi/types";

/** One candidate for the path the user is typing. */
export interface PathFragment {
  /** The whole candidate, exactly as the line carries it -- e.g. `src/fo`. */
  readonly text: string;
  /** Where `text` begins on the line, in UTF-16 code units, as LSP counts. */
  readonly start: number;
  /** Up to and including the last separator -- e.g. `src/`, or `` for none. */
  readonly directory: string;
  /** What follows it -- e.g. `fo`. The filter, and possibly empty. */
  readonly name: string;
}

/**
 * Every candidate path fragment ending at `character`, SHORTEST FIRST.
 *
 * A fragment begins at a word boundary: the start of the line, or just after
 * whitespace. More than one candidate exists because A PATH MAY CONTAIN
 * SPACES: on the line `see foo (1).png`, `foo (1).png` is a real filename and
 * `(1).png` is not, and no rule reading the line alone can tell which. The
 * choice is made against the filesystem by the caller, which takes the first
 * candidate that names something -- so the common case, a path with no space
 * in it, costs exactly one candidate.
 *
 * NOTHING is produced when the cursor sits at the start of a line or straight
 * after whitespace. A candidate must not be empty -- the empty string would
 * list every entry of every root on a keystroke that asked for nothing -- and
 * a candidate ending IN whitespace is the same keystroke with a space in front
 * of it. The cost is that `foo ` does not offer `foo bar.txt` until the `b` is
 * typed; the alternative is a completion popup on the space bar.
 *
 * `character` and JavaScript string indices both count UTF-16 code units, so
 * plain slicing is correct here; iterating code points would drift on the
 * first character outside the BMP.
 */
export function pathFragments(line: string, character: number): PathFragment[] {
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  // Also covers `character === 0`, where index -1 reads as whitespace.
  if (isBoundary(character - 1)) {
    return [];
  }
  const fragments: PathFragment[] = [];
  // Downwards from the cursor, so the list comes out shortest-first with no
  // reversal to keep in step with the caller's preference order.
  for (let start = character - 1; start >= 0; start--) {
    // A fragment never BEGINS with whitespace, whatever precedes it.
    if (isBoundary(start)) {
      continue;
    }
    if (start === 0 || isBoundary(start - 1)) {
      fragments.push(fragmentAt(line, start, character));
    }
  }
  return fragments;
}

function fragmentAt(line: string, start: number, character: number): PathFragment {
  const text = line.slice(start, character);
  // Everything after the last separator is the FILTER for ONE directory
  // listing. That split is what makes this completion per segment.
  const cut = text.lastIndexOf("/") + 1;
  return { text, start, directory: text.slice(0, cut), name: text.slice(cut) };
}

/**
 * How many items leave in one message.
 *
 * WHY THIS SURVIVES THE PER-SEGMENT FORECLOSURE, which removed every reason to
 * walk anything: no walk is needed for a listing to be too large to hand over
 * in one piece. A single directory can hold a hundred thousand entries, and a
 * client that has to wait for the last one before seeing the first has the
 * latency this generator exists to avoid.
 *
 * The value itself is a judgement, not a measurement: small enough that the
 * first batch arrives while the rest is still being read, large enough that an
 * ordinary directory is one or two messages.
 */
export const batchSize = 100;

/** Where one class of item comes from, and how the user is told which. */
export interface PathSource {
  /** `document`, `cwd` or `absolute` -- what produced the item. */
  readonly name: string;
  /** The absolute directory the item's inserted text is read against. */
  readonly root: string;
}

/** What the caller may override; everything else is read from the request. */
export interface PathCompletionOptions {
  /**
   * The directory a bare relative path is read against. Defaults to the
   * server's own, read LAZILY inside the handler -- reading it at import time
   * would turn a permission a runtime withholds into a failure of the
   * HANDSHAKE, in a file the config author has not reached yet.
   */
  readonly cwd?: string;
}

/**
 * The roots that make sense for THIS fragment.
 *
 * A fragment beginning at the filesystem root is answered by the absolute
 * source ALONE. The negative half is the whole rule: without it, every source
 * answers every keystroke and typing `/` offers the current directory's
 * children beside the filesystem root's.
 *
 * workspaceFolder-relative is a FOURTH source that is deliberately absent: the
 * client sends workspace folders at initialize, tsudoi does not expose them
 * yet, and inventing one from cwd would be silently wrong exactly when it
 * matters. It is PBI-15, and a public API addition rather than a config
 * author's business.
 */
export function sourcesFor(fragment: PathFragment, uri: string, cwd: string): PathSource[] {
  if (fragment.text.startsWith("/")) {
    return [{ name: "absolute", root: "/" }];
  }
  const parent = documentParent(uri);
  const relative: PathSource[] = [{ name: "cwd", root: cwd }];
  // The document first, so a collision between the two is attributed to the
  // more local root.
  return parent === undefined ? relative : [{ name: "document", root: parent }, ...relative];
}

/**
 * The document's parent directory, or undefined when it HAS NO NAME.
 *
 * THE GUARD IS `AN UNNAMED DOCUMENT HAS NO PARENT`, AND NEVER `REJECT / AS A
 * ROOT`. `/` is the legitimate root of a document that really does sit at the
 * filesystem root, and it is the only root the absolute source ever has -- so
 * a guard spelled the other way deletes the feature this file exists for while
 * passing every test about unnamed documents.
 *
 * MEASURED under bun 1.3.13 and deno 2.9.2, identically, and the two
 * degenerate URIs fail in OPPOSITE directions:
 *
 *   fileURLToPath("file://")             -> "/", silently; basename is ""
 *   fileURLToPath("untitled:Untitled-1") -> throws TypeError
 *
 * so the value check and the catch are both load-bearing and neither implies
 * the other. An editor sends the second for a buffer the user has not saved,
 * which is a scratch buffer rather than an exotic case.
 */
function documentParent(uri: string): string | undefined {
  let path: string;
  try {
    path = fileURLToPath(uri);
  } catch {
    return undefined;
  }
  return basename(path) === "" ? undefined : dirname(path);
}

/**
 * The completion items for one fragment under one root, in batches.
 *
 * THE HAZARD THIS FORECLOSES, and the reason nothing here recurses: the
 * listing is ONE directory -- the fragment's own directory part -- filtered by
 * the fragment's trailing name. Completion is per SEGMENT, so unbounded walks,
 * recursion depth and symlink CYCLES are not merely unhandled, they are
 * UNREPRESENTABLE: a cycle requires traversal, and one readdir cannot
 * traverse. Someone adding recursion here brings all three back at once.
 *
 * A directory that does not exist, is not a directory, or cannot be read
 * contributes NOTHING and does not fail the request. A user types `/nonexi`
 * constantly, and answering -32603 for it would kill the completion they are
 * in the middle of.
 */
export async function* itemsFrom(
  source: PathSource,
  fragment: PathFragment,
  /**
   * The cursor. REQUIRED, and it was briefly defaulted: a default assuming
   * line 0 is dead on every call this module makes and silently wrong for a
   * cursor anywhere else -- it would build a range on a line other than the
   * cursor's, which is MEASURED to make the item vanish from the target client
   * with no error and no fallback. A convenience for one caller is not worth a
   * default that can only be wrong.
   */
  position: Position,
): AsyncGenerator<CompletionItem[], void, void> {
  const directory = join(source.root, fragment.directory);
  let items: CompletionItem[] = [];
  try {
    // opendir, never readdir: readdir BUILDS THE WHOLE ARRAY before returning,
    // so a directory of a hundred thousand entries would be collected in full
    // no matter how it was handed on afterwards. This iterates.
    //
    // A CONSEQUENCE, stated because it looks like an omission: nothing here
    // sorts. Sorting is exactly the operation that requires the whole listing
    // first, so it would undo this. Clients order a completion list by their
    // own rules anyway.
    const listing = await opendir(directory);
    for await (const entry of listing) {
      if (!entry.name.startsWith(fragment.name)) {
        continue;
      }
      if (items.length === batchSize) {
        yield items;
        items = [];
      }
      const insertText = fragment.directory + entry.name;
      items.push({
        // THE LABEL NAMES THE SOURCE AND ITS ROOT, and both halves earn their
        // place. Four roots make `src/foo.ts` and `../src/foo.ts` look
        // unrelated, so the root is what makes the list comprehensible; and the
        // NAME is what keeps a document-relative source that lost its parent --
        // rooted at `/`, which file:// silently produces -- distinguishable
        // from the absolute source's legitimate output.
        //
        // MEASURED against the target completion plugin, and it is why this is
        // not in `detail`: that field is displayed only when an option which
        // DEFAULTS OFF is set. A root named there is a criterion satisfied on
        // the wire and a feature the user never sees.
        //
        // THE ORDER IS LOAD-BEARING. The inserted text comes FIRST because a
        // client with no filterText filters on the label, and a label starting
        // with anything else would filter these items away as the user types.
        //
        // AN UNRESOLVABLE TENSION, recorded rather than managed, because the
        // choice is revisitable and the next person should know what it costs:
        // a completion plugin can be configured to require the inserted word to
        // CONTAIN the item's label, and `src/foo.ts` does not contain
        // `src/foo.ts (cwd: /home/me)`. Under that setting these items are
        // DROPPED ENTIRELY -- worse than an invisible root. A visible root and
        // match-label safety cannot both hold in `label`, and no other carrier
        // has been measured to display: `detail` is measured NOT to, and
        // `labelDetails` is unmeasured. The setting is off by default and this
        // stakeholder does not set it, which is the whole basis for the choice.
        label: `${insertText} (${source.name}: ${source.root})`,
        kind: await entryKind(directory, entry),
        // BOTH FIELDS, carrying the SAME text, because two client classes read
        // different ones. A client that honours textEdit uses `newText`; the
        // one measured for this stakeholder builds its word from `insertText`
        // and consults the textEdit ONLY to move the offset -- which is the
        // sole mechanism by which an item can replace characters to the LEFT
        // of that client's own word boundary. For a path that is the whole
        // problem: the text contains `/`, and the boundary sits after the last
        // one, so without the range `src/foo.ts` is inserted AFTER the `src/`
        // already typed and the line doubles.
        insertText,
        // A PLAIN TextEdit, never an InsertReplaceEdit, and the range is
        // constrained rather than merely present. MEASURED: an item whose
        // range spans more than one line, or begins on a line other than the
        // cursor's, or whose label is empty, is DISCARDED by that client with
        // no error and no fallback -- it does not arrive wrong, it vanishes.
        // The plain form also leaves a user's insert-versus-replace setting
        // inert, which the example's prose says out loud.
        //
        // THE RANGE ENDS AT THE CURSOR AND NEVER PAST IT -- insert semantics,
        // chosen rather than inherited. Completing in the MIDDLE of an
        // existing path then leaves the tail alone: on `foo (1).p|ng` the
        // result is `foo (1).pngng`, which is ugly. The alternative deletes
        // whatever the user has to the right of their cursor, which is worse,
        // and no criterion rules on it.
        textEdit: {
          range: { start: { line: position.line, character: fragment.start }, end: position },
          newText: insertText,
        },
      });
    }
  } catch (error) {
    // BY CODE, never a bare catch: absorbing everything would answer the
    // client a plausible `nothing here` for a defect in this file, which is
    // the shape src/methods.ts refuses one layer up. Anything else is rethrown
    // and reaches the config author as -32603 plus a stack, which is correct.
    if (!isUnopenable(error)) {
      throw error;
    }
  }
  if (items.length > 0) {
    yield items;
  }
}

/**
 * Whether a listing failed because THAT DIRECTORY cannot be listed -- which
 * for a path being typed is ordinary, not exceptional.
 *
 * A cross-runtime difference that a catch around `opendir` alone would get
 * wrong, MEASURED under bun 1.3.13 and deno 2.9.2: deno REJECTS `opendir` for
 * a missing directory, and bun RESOLVES it and defers the scandir to the first
 * iteration. So both the open and the loop have to be inside the same try, and
 * a test written under one runtime cannot see the other's behaviour.
 */
function isUnopenable(error: unknown): boolean {
  const code: unknown = (error as { code?: unknown }).code;
  return (
    typeof code === "string" && ["ENOENT", "ENOTDIR", "EACCES", "EPERM", "ELOOP"].includes(code)
  );
}

/**
 * Folder or File -- and the two measurements that decide how.
 *
 * MEASURED under bun 1.3.13 and deno 2.9.2, identically:
 *
 *  1. `readdir`/`opendir` with file types report a SYMLINK TO A DIRECTORY as
 *     a symlink and NOT as a directory, so `dirent.isDirectory()` alone labels
 *     it File. On macOS /tmp is itself a symlink, so a user meets this on the
 *     first keystroke.
 *  2. The obvious fix -- `stat` every entry -- THROWS ENOENT on a DANGLING
 *     symlink. Under tsudoi's dispatch a throwing handler is answered -32603
 *     with a stack on stderr, so one broken link in the directory would kill
 *     the entire completion rather than one item of it.
 *
 * Hence: consult the dirent first, and `stat` only what it could not decide,
 * inside a catch that DEGRADES the entry rather than dropping the request. The
 * `isFile` arm is not redundant with the `isDirectory` one -- a filesystem
 * that reports an unknown type answers false to both, and that entry needs the
 * stat as much as a symlink does.
 *
 * Anyone simplifying this to `dirent.isDirectory()` reintroduces (1); anyone
 * lifting the stat out of the catch reintroduces (2).
 */
async function entryKind(directory: string, entry: Dirent): Promise<CompletionItemKind> {
  if (entry.isDirectory()) {
    return CompletionItemKind.Folder;
  }
  if (entry.isFile()) {
    return CompletionItemKind.File;
  }
  try {
    const target = await stat(join(directory, entry.name));
    return target.isDirectory() ? CompletionItemKind.Folder : CompletionItemKind.File;
  } catch {
    return CompletionItemKind.File;
  }
}

/**
 * A `textDocument/completion` handler that completes paths.
 *
 * Written as the config author's own generator: every `yield` reaches the
 * client as one `$/progress` when it asked for partial results, and is
 * aggregated into the response when it did not. That is tsudoi's half.
 */
export async function* pathCompletion(
  context: RequestContext,
  params: CompletionParams,
  options: PathCompletionOptions = {},
): AsyncGenerator<CompletionItem[], null, void> {
  const document = context.tsudoi.documents.get(params.textDocument.uri);
  if (document === undefined) {
    return null;
  }
  const line = document.getText().split(/\r?\n/)[params.position.line];
  if (line === undefined) {
    return null;
  }
  const cwd = options.cwd ?? process.cwd();
  // DEDUP BY INSERTED TEXT, NEVER BY RESOLVED FILE. Two roots that hold the
  // same relative path produce the same string, and the same string is the
  // same edit whichever root it came from. Deduplicating by the file each one
  // resolves to would instead collapse `src/foo.ts` with `../src/foo.ts` --
  // two DIFFERENT edits -- and force an arbitrary choice of which root to
  // attribute the survivor to, contradicting the label above.
  //
  // A CONSEQUENCE, AND A REAL LOSS, stated because it is the cost of the rule
  // rather than an oversight: when the document's parent and cwd are different
  // directories that BOTH hold `src/foo.ts`, one item survives and it names
  // the root asked first. The user sees one truth out of two -- but the text
  // inserted is the same either way, so what is lost is the attribution, not
  // the edit.
  const seen = new Set<string>();
  // THE CANDIDATES ARE TRIED SHORTEST FIRST AND THE FIRST THAT NAMES SOMETHING
  // WINS. That is how a filename containing a space is completed at all: `see
  // foo (1).png` offers `(1).p` first, which matches nothing, and only then
  // widens to `foo (1).p`, which does.
  //
  // Two things follow, and both are the cost of the criterion rather than
  // oversights:
  //
  //  * THE CHOSEN FRAGMENT DEPENDS ON WHAT IS ON DISK. The same line can
  //    produce a different range on a different machine. No rule reading the
  //    line alone can do better -- a space is a legal character in a filename
  //    and a separator between words, and only the filesystem knows which one
  //    it is here.
  //  * EACH candidate costs a listing attempt, so a prose line of many words
  //    over a huge directory is the pathological case. The common case, a path
  //    with no space in it, stops at the first candidate.
  //
  // Stopping is what keeps ONE response from carrying items that replace
  // DIFFERENT spans of the line, where which item the user picks would decide
  // how much of their line disappears. Someone simplifying this to a
  // whitespace split loses the spaced filename; someone dropping the stop
  // loses that.
  for (const fragment of pathFragments(line, params.position.character)) {
    let named = false;
    for (const source of sourcesFor(fragment, params.textDocument.uri, cwd)) {
      for await (const batch of itemsFrom(source, fragment, params.position)) {
        const fresh = batch.filter((item) => {
          const text = item.insertText ?? "";
          if (seen.has(text)) {
            return false;
          }
          seen.add(text);
          return true;
        });
        // An emptied batch is not yielded: a `$/progress` carrying nothing is
        // noise a client has to parse to learn there was nothing in it.
        if (fresh.length > 0) {
          named = true;
          yield fresh;
        }
      }
    }
    if (named) {
      return null;
    }
  }
  return null;
}
