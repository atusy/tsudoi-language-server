/**
 * Path completion for a config author's own `textDocument/completion` handler.
 */

import type { Dirent } from "node:fs";
import { opendir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { RequestContext } from "@atusy/tsudoi/types";
import {
  type CompletionItem,
  CompletionItemKind,
  type CompletionParams,
  type MarkupContent,
  type Position,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol";

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
  /**
   * Where the word under the cursor ends, at or past it. `text` stops at the
   * cursor because that is what a completion filters on; this edge is the
   * FLOOR of the REPLACE range -- `as far as this word goes` -- which
   * `replaceEnd` reaches past for a candidate the line already carries.
   */
  readonly end: number;
}

/**
 * Every candidate path fragment ending at `character`, shortest first.
 *
 * Several candidates, because A PATH MAY CONTAIN SPACES: on `see foo (1).png`
 * both `(1).png` and `foo (1).png` are readings and no rule over the line
 * alone can tell which. The caller decides against the filesystem, taking the
 * first that names something -- so a path without spaces costs one candidate.
 *
 * Nothing is produced at the start of a line or straight after whitespace: an
 * empty candidate would list every root on a keystroke that asked for nothing.
 * The cost is that `foo ` offers no `foo bar.txt` until `b` is typed; the
 * alternative is a popup on the space bar.
 *
 * Slicing is by UTF-16 code unit, as LSP counts -- iterating code points would
 * drift on the first character outside the BMP.
 */
export function pathFragments(line: string, character: number): PathFragment[] {
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  // Also covers `character === 0`, where index -1 reads as whitespace.
  if (isBoundary(character - 1)) {
    return [];
  }
  // Scanned once: every candidate ends here, differing only in where it begins.
  //
  // THE FLOOR OF THE REPLACE RANGE, not the whole of it. A filename with a
  // further space -- `spaced (1).txt` completed at `spa` -- stops here at the
  // first space, and `replaceEnd` reaches past it PER CANDIDATE when the line
  // already carries that candidate verbatim. The decision cannot be made here:
  // this function has no candidate to compare the line against.
  let end = character;
  while (!isBoundary(end)) {
    end += 1;
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
      fragments.push(fragmentAt(line, start, character, end));
    }
  }
  return fragments;
}

function fragmentAt(line: string, start: number, character: number, end: number): PathFragment {
  const text = line.slice(start, character);
  // Everything after the last separator is the FILTER for ONE directory
  // listing. That split is what makes this completion per segment.
  const cut = text.lastIndexOf("/") + 1;
  return {
    text,
    start,
    end,
    directory: text.slice(0, cut),
    name: text.slice(cut),
  };
}

/**
 * How many items leave in one message. Batching survives the per-segment rule
 * because no walk is needed for one directory to be too large to hand over at
 * once. The value is a judgement: small enough that the first batch arrives
 * while the rest is still being read.
 */
export const batchSize = 100;

/**
 * What produced an item. A CLOSED set: a free `string` lets a fifth kind of
 * root be invented at one call site and spelled differently at the next.
 * Adding a source is a decision made here.
 */
export type PathSourceName = "document" | "cwd" | "workspace" | "absolute";

/** Where one class of item comes from, and how the user is told which. */
export interface PathSource {
  /** What produced the item, as the label spells it. */
  readonly name: PathSourceName;
  /** The absolute directory the item's inserted text is read against. */
  readonly root: string;
}

/** What the caller may override; everything else is read from the request. */
export interface PathCompletionOptions {
  /**
   * The directory a bare relative path is read against. Defaults to the
   * server's own, read LAZILY inside the handler: reading it at import time
   * would turn a permission a runtime withholds into a failed HANDSHAKE.
   */
  readonly cwd?: string;
}

/**
 * The roots that make sense for THIS fragment.
 *
 * A fragment beginning at `/` is answered by the absolute source ALONE. The
 * negative half is the rule: without it, typing `/` offers the current
 * directory's children beside the filesystem root's.
 *
 * ONE SOURCE PER WORKSPACE FOLDER, since the field is an array on the wire --
 * keeping only the first answers from whichever the editor happened to list
 * first. A folder is converted from its URI and NEVER guessed from cwd: an
 * editor started without a project root leaves cwd as its own launch
 * directory, so the guess looks right in every test and wrong in real use.
 *
 * Order is most-local-first, which decides attribution rather than content:
 * items dedup by inserted text, so the survivor names the root asked first.
 */
export function sourcesFor(
  fragment: PathFragment,
  uri: string,
  cwd: string,
  folders: readonly WorkspaceFolder[] = [],
): PathSource[] {
  if (fragment.text.startsWith("/")) {
    return [{ name: "absolute", root: "/" }];
  }
  const parent = documentParent(uri);
  const relative: PathSource[] = [{ name: "cwd", root: cwd }];
  for (const folder of folders) {
    // A folder whose URI names no local path is skipped, not thrown over: one
    // unusable folder must not take the usable ones down with it. Skipped
    // SILENTLY, which is a known gap -- it looks exactly like a folder holding
    // no matches.
    const root = folderPath(folder);
    if (root !== undefined) {
      relative.push({ name: "workspace", root });
    }
  }
  // The document first, so a collision between the two is attributed to the
  // more local root.
  return parent === undefined ? relative : [{ name: "document", root: parent }, ...relative];
}

/** A workspace folder's directory, or undefined when its URI names no local path. */
function folderPath(folder: WorkspaceFolder): string | undefined {
  try {
    return fileURLToPath(folder.uri);
  } catch {
    return undefined;
  }
}

/**
 * The document's parent directory, or undefined when it HAS NO NAME.
 *
 * The guard is `an unnamed document has no parent`, NEVER `reject / as a
 * root`: `/` is the legitimate root of the absolute source, so the other
 * spelling deletes this file's feature while passing every unnamed-document
 * test.
 *
 * The value check and the catch are both load-bearing -- measured identically
 * under bun 1.3.13 and deno 2.9.2, the two degenerate URIs fail in OPPOSITE
 * directions:
 *
 *   fileURLToPath("file://")             -> "/", silently; basename is ""
 *   fileURLToPath("untitled:Untitled-1") -> throws TypeError
 *
 * An editor sends the second for any buffer the user has not saved.
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
 * How far the REPLACE range reaches for ONE candidate.
 *
 * The fragment's end stops at the first whitespace, so completing `spa` on a
 * line already reading `spaced (1).txt` would delete `spaced` alone and insert
 * the whole filename over it -- leaving ` (1).txt` behind, a line NEITHER
 * insert nor replace would have written. The end reaches to the end of the
 * candidate WHEN THE LINE ALREADY CARRIES IT VERBATIM from the fragment's
 * start. Per candidate, which the protocol permits because each item carries
 * its own `textEdit`, and off disk entirely.
 *
 * MEASURED IN THE STAKEHOLDER'S OWN EDITOR, and this rule rests on it: nvim
 * with ddc and ddc-source-lsp under `confirmBehavior: replace` HONOURS an
 * extended replace end at confirm, and the same harness with the whitespace
 * end reproduces the mangled line. That measurement needs their editor, so it
 * is not in this suite; it is recorded on Sprint 20.
 *
 * EXACT, AND ANCHORED AT `fragment.start`, and both halves are asserted by
 * their own test in test/completion-path.test.ts because each relaxation
 * writes a DIFFERENT wrong line. The three lines below are MEASURED -- each
 * relaxation was built and the line it leaves was read -- rather than derived
 * from what the rule looks like it would do:
 *
 *   - a PREFIX match extends `spa|ced (1).txt` completing to `spaced (2).txt`
 *     as far as the common prefix, end 8, and writes `spaced (2).txt1).txt`:
 *     worse than the defect it set out to fix;
 *   - a match ANYWHERE on the line swallows a word the user never typed over
 *     -- `sp| spaced (1).txt` reaches end 17 and writes `spaced (1).txt`, the
 *     filename beside the cursor gone.
 *
 * EXTENSION ONLY, never a shrink, which is the third assertion: a candidate
 * SHORTER than the word under the cursor -- completing `fo` to `foo` where the
 * line reads `foo.txt` -- pulls the end back to 3 without the guard and leaves
 * `foo.txt`, the `.txt` standing behind the completion.
 *
 * NEVER PAST THE END OF THE LINE, by construction rather than by a check:
 * `slice` truncates, so the equality below cannot hold unless the line really
 * carries that many code units.
 *
 * WHAT REMAINS UNFIXED IS DECLINED RATHER THAN MISSED. A PARTIALLY-TYPED tail
 * (`spa|ced (1).tx`) and a tail belonging to a DIFFERENT candidate keep the
 * whitespace end, so replace still takes the first word alone and leaves the
 * rest -- exactly today's outcome, since this rule fires only on an exact
 * match. Deciding those needs FORWARD DISK PROBING, one stat per extension
 * step on a path where a huge directory is already the pathological case, and
 * it cannot terminate honestly: `a b c` is one filename on one machine and
 * three words on another.
 */
function replaceEnd(line: string, fragment: PathFragment, candidate: string): number {
  const whole = fragment.start + candidate.length;
  if (whole <= fragment.end) {
    return fragment.end;
  }
  return line.slice(fragment.start, whole) === candidate ? whole : fragment.end;
}

/**
 * The completion items for one fragment under one root, in batches.
 *
 * NOTHING HERE RECURSES, and that is the design: the listing is ONE directory
 * filtered by the fragment's trailing name. Unbounded walks, recursion depth
 * and symlink CYCLES are not unhandled but unrepresentable -- a cycle needs
 * traversal, and one readdir cannot traverse. Adding recursion brings all
 * three back at once.
 *
 * A directory that does not exist, is not one, or cannot be read contributes
 * nothing and does NOT fail the request: a user types `/nonexi` constantly,
 * and -32603 would kill the completion they are in the middle of.
 */
export async function* itemsFrom(
  source: PathSource,
  fragment: PathFragment,
  /**
   * The cursor. REQUIRED and never defaulted: a default could only assume line
   * 0, and a range on a line other than the cursor's is measured to make the
   * item vanish from the client with no error.
   */
  position: Position,
  /**
   * The cursor's whole line. REQUIRED for the same reason as `position`: the
   * replace end is decided by what the line already reads, and a default could
   * only be the fragment's own text -- which is the line up to the cursor and
   * says nothing about the tail this rule exists to cover.
   */
  line: string,
): AsyncGenerator<CompletionItem[], void, void> {
  const directory = join(source.root, fragment.directory);
  let items: CompletionItem[] = [];
  try {
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
        label: insertText,
        documentation: documentationFor(join(directory, entry.name), source),
        kind: await entryKind(directory, entry),
        insertText,
        // BOTH RANGES, so the client's own insert-versus-replace preference
        // decides what happens to the tail when the cursor sits mid-path. A
        // plain `TextEdit` would make that setting inert and choose for them.
        textEdit: {
          newText: insertText,
          insert: {
            start: { line: position.line, character: fragment.start },
            end: position,
          },
          replace: {
            start: { line: position.line, character: fragment.start },
            end: { line: position.line, character: replaceEnd(line, fragment, insertText) },
          },
        },
      });
    }
  } catch (error) {
    if (!isUnopenable(error)) {
      throw error;
    }
  }
  if (items.length > 0) {
    yield items;
  }
}

/**
 * What the user is told about an item beyond the text it inserts: where the
 * file actually is, and which root offered it.
 *
 * The ABSOLUTE PATH first, because it is the answer to the question the
 * inserted text raises -- two roots can offer the same relative path, and only
 * this says which file is which. The source name is the shorter answer to the
 * same question and sits below the rule.
 *
 * `documentation` rather than `detail`: this is a MULTI-LINE block with a
 * markdown rule in it, and `detail` is the protocol's one-line field. A client
 * showing `detail` inline would run the three parts together.
 */
function documentationFor(absolutePath: string, source: PathSource): MarkupContent {
  return {
    kind: "markdown",
    value: `${absolutePath}\n\n---\n\nsource: ${source.name}`,
  };
}

/**
 * Whether a listing failed because THAT DIRECTORY cannot be listed -- which
 * for a path being typed is ordinary, not exceptional.
 */
function isUnopenable(error: unknown): boolean {
  const code: unknown = (error as { code?: unknown }).code;
  return (
    typeof code === "string" && ["ENOENT", "ENOTDIR", "EACCES", "EPERM", "ELOOP"].includes(code)
  );
}

/**
 * Folder or File. `stat` is the fallback because a Dirent reports a symlink as
 * neither, and a symlink to a directory should complete as one.
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
  // WHEN THE CLIENT SENT NO FOLDERS THIS SAYS NOTHING, and that is a CHOICE
  // rather than an oversight -- recorded here because someone would otherwise
  // re-add the report believing it was required.
  //
  // An earlier version wrote one line to stderr per session: with no workspace
  // the workspace source contributes nothing, and nothing looks exactly like a
  // working source in a project that holds no matches. The stakeholder removed
  // it as noise. THE COST STANDS: a config author whose editor opened no
  // workspace now gets no items from that source and no explanation of why.
  const seen = new Set<string>();
  for (const fragment of pathFragments(line, params.position.character)) {
    let named = false;
    for (const source of sourcesFor(
      fragment,
      params.textDocument.uri,
      cwd,
      context.workspaceFolders,
    )) {
      for await (const batch of itemsFrom(source, fragment, params.position, line)) {
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
