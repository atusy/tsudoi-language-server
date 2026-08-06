/**
 * Path completion for a config author's own `textDocument/completion` handler,
 * paired with the resolve half beside it: the entries of the ONE directory the
 * fragment under the cursor names, yielded in batches.
 */

import type { Dirent } from "node:fs";
import { opendir, stat } from "node:fs/promises";
import nodePath, { basename, dirname, type PlatformPath } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { type CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import {
  type CompletionItem,
  CompletionItemKind,
  type InsertReplaceEdit,
  type MarkupContent,
  MarkupKind,
  type Position,
  type TextEdit,
  type WorkspaceFolder,
} from "@atusy/tsudoi-language-server/deps/types";

/** One candidate for the path the user is typing. */
export interface PathFragment {
  /** The whole candidate, exactly as the line carries it -- e.g. `src/fo`. */
  readonly text: string;
  /** Where `text` begins on the line, in UTF-16 code units, as LSP counts. */
  readonly start: number;
  /** Up to and including the last separator -- e.g. `src/`, `C:\Users\`, or `` for none. */
  readonly directory: string;
  /** The filter, and possibly empty -- e.g. `fo`. */
  readonly name: string;
  /** Where the word under the cursor ends, at or past it. */
  readonly end: number;
}

/**
 * Every candidate path fragment ending at `character`, shortest first.
 *
 * Several, because A PATH MAY CONTAIN SPACES: on `see foo (1).png` both
 * `(1).png` and `foo (1).png` are readings and no rule over the line alone can
 * tell which. The caller decides against the filesystem.
 */
export function pathFragments(
  line: string,
  character: number,
  flavour: PlatformPath = nodePath,
): PathFragment[] {
  // A read past either end reads as WHITESPACE, which is what stops the scan
  // below and what makes `character === 0` an empty answer. `?? ""` instead
  // matches no whitespace and the scan runs off the line forever.
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  if (isBoundary(character - 1)) {
    return [];
  }
  let end = character;
  while (!isBoundary(end)) {
    end += 1;
  }
  const fragments: PathFragment[] = [];
  const cutters = separatorsOf(flavour);
  for (let start = character - 1; start >= 0; start--) {
    if (isBoundary(start)) {
      continue;
    }
    if (start === 0 || isBoundary(start - 1)) {
      fragments.push(fragmentAt(line, start, character, end, cutters));
    }
  }
  return fragments;
}

/**
 * Which characters this flavour reads as separators, ASKED OF THE FLAVOUR rather
 * than written down, so `Windows accepts a forward slash` is measured in every
 * run rather than claimed.
 */
function separatorsOf(flavour: PlatformPath): readonly string[] {
  return ["/", "\\"].filter((candidate) => flavour.parse(`a${candidate}b`).base === "b");
}

function fragmentAt(
  line: string,
  start: number,
  character: number,
  end: number,
  cutters: readonly string[],
): PathFragment {
  const text = line.slice(start, character);
  let cut = 0;
  for (const cutter of cutters) {
    cut = Math.max(cut, text.lastIndexOf(cutter) + 1);
  }
  return {
    text,
    start,
    end,
    directory: text.slice(0, cut),
    name: text.slice(cut),
  };
}

/**
 * What this module writes onto every item it produces, and the only thing the
 * resolve half can key off: tsudoi keeps no record of what a completion handler
 * produced, so a handler can only read what it wrote onto the item itself.
 */
export interface PathItemData {
  /** The absolute path the item completes to. */
  readonly pathCompletion: string;
  /** Which root offered it, as the item's own documentation spells it. */
  readonly source: PathSourceName;
}

/**
 * The absolute path THIS MODULE recorded on an item, or undefined for an item it
 * did not produce.
 *
 * EVERY ARM RETURNS undefined RATHER THAN THROWING, because what arrives is
 * whatever the client sent -- `data` may be absent, may be a number, may be an
 * object from another server -- and a resolve handler that throws answers -32603
 * and takes away the popup the user is reading.
 */
export function completedPath(item: CompletionItem): string | undefined {
  const data: unknown = item.data;
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const path: unknown = (data as { pathCompletion?: unknown }).pathCompletion;
  return typeof path === "string" ? path : undefined;
}

/**
 * The source THIS MODULE recorded on an item, or undefined when the mark names
 * none this module offers.
 */
export function completedSource(item: CompletionItem): PathSourceName | undefined {
  const data: unknown = item.data;
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const source: unknown = (data as { source?: unknown }).source;
  return sourceNames.find((name) => name === source);
}

/**
 * Every name a `PathSource` may carry, as a value the mark reader can check.
 *
 * The union below is DERIVED from this list and never spelled beside it: spelled
 * twice, this list annotates as a SUBSET of the union, so dropping a member
 * type-checks everywhere while every item marked with the dropped name silently
 * loses its attribution at resolve time.
 */
const sourceNames = ["document", "cwd", "workspace", "absolute"] as const;

const batchSize = 100;

export type PathSourceName = (typeof sourceNames)[number];

/** Where one class of item comes from, and how the user is told which. */
export interface PathSource {
  readonly name: PathSourceName;
  /** The absolute directory the item's inserted text is read against. */
  readonly root: string;
}

/** What the caller may override; everything else is read from the request. */
export interface PathCompletionOptions {
  /**
   * The directory a bare relative path is read against. Defaults to the server's
   * own, read LAZILY inside the handler: reading it at import time would turn a
   * permission a runtime withholds into a failed HANDSHAKE.
   */
  readonly cwd?: string;
  /** How a path is spelled: `path.win32`, `path.posix`, or the host's own. */
  readonly flavour?: PlatformPath;
}

/**
 * The roots that make sense for THIS fragment.
 *
 * ONE SOURCE PER WORKSPACE FOLDER, since a client may hold several -- keeping
 * only the first answers from whichever the editor happened to list first. AND
 * NOT `workspaceFolders.get()`, WHICH ANSWERS A DIFFERENT QUESTION: which folders
 * sit at the INNERMOST location covering a uri. Every folder is a completion root
 * here, and that lookup answers nothing at all for the unsaved buffer.
 */
export function sourcesFor(
  fragment: PathFragment,
  uri: string,
  cwd: string,
  folders: readonly WorkspaceFolder[] = [],
  flavour: PlatformPath = nodePath,
): PathSource[] {
  const root = flavour.parse(fragment.text).root;
  if (flavour.isAbsolute(fragment.text)) {
    return [{ name: "absolute", root }];
  }
  if (root !== "") {
    return [];
  }
  const parent = documentParent(uri);
  const relative: PathSource[] = [{ name: "cwd", root: cwd }];
  for (const folder of folders) {
    // A folder whose URI names no local path is skipped, not thrown over: one
    // unusable folder must not take the usable ones down with it. SILENTLY,
    // which is a known gap -- it looks like a folder holding no matches.
    const root = folderPath(folder);
    if (root !== undefined) {
      relative.push({ name: "workspace", root });
    }
  }
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
 * THE FLAVOUR IS NOT THREADED HERE, and that is a decision rather than a spot
 * missed: this path came out of `fileURLToPath`, which is bound to the host, so
 * any other flavour would take a path in one dialect apart with another's rules.
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
 * How far the REPLACE range reaches for ONE candidate: to the end of the
 * candidate when the line already carries it VERBATIM from the fragment's start,
 * and to the fragment's whitespace end otherwise.
 *
 * WHAT REMAINS UNFIXED IS DECLINED RATHER THAN MISSED. A partially-typed tail
 * (`spa|ced (1).tx`) keeps the whitespace end. Deciding it needs FORWARD DISK
 * PROBING, one stat per extension step where a huge directory is already the
 * pathological case, and it cannot terminate honestly: `a b c` is one filename on
 * one machine and three words on another.
 */
function replaceEnd(line: string, fragment: PathFragment, candidate: string): number {
  const whole = fragment.start + candidate.length;
  if (whole <= fragment.end) {
    return fragment.end;
  }
  return line.slice(fragment.start, whole) === candidate ? whole : fragment.end;
}

/**
 * Pure, and separated from the listing so an item's span can be measured for a
 * fragment no host filesystem holds.
 */
export function editFor(
  fragment: PathFragment,
  position: Position,
  line: string,
  newText: string,
  insertReplaceSupport: boolean,
): TextEdit | InsertReplaceEdit {
  const start = { line: position.line, character: fragment.start };
  if (!insertReplaceSupport) {
    return { newText, range: { start, end: position } };
  }
  return {
    newText,
    insert: { start, end: position },
    replace: {
      start,
      end: { line: position.line, character: replaceEnd(line, fragment, newText) },
    },
  };
}

/** The one directory a source's listing is read from for this fragment. */
export function listingDirectory(
  source: PathSource,
  fragment: PathFragment,
  flavour: PlatformPath = nodePath,
): string {
  return flavour.resolve(source.root, fragment.directory);
}

/**
 * The completion items for one fragment under one root, in batches.
 *
 * NOTHING HERE RECURSES, and that is the design: the listing is ONE directory
 * filtered by the fragment's trailing name. Unbounded walks, recursion depth and
 * symlink CYCLES are not unhandled but unrepresentable -- a cycle needs
 * traversal, and one readdir cannot traverse.
 *
 * THE FOUR PARAMETERS BETWEEN THE FRAGMENT AND THE FLAVOUR ARE REQUIRED AND
 * NEVER DEFAULTED, unlike the flavour, whose host default is right wherever it
 * runs. A defaulted position could only assume line 0, and a range on another
 * line makes the item vanish with no error; either capability defaults badly BOTH
 * WAYS -- `true` sends a client what the specification forbids it, `false`
 * silently costs a caller who forgot it the feature on the clients that have
 * it.
 */
export async function* itemsFrom(
  source: PathSource,
  fragment: PathFragment,
  position: Position,
  line: string,
  insertReplaceSupport: boolean,
  documentationFormat: MarkupKind,
  flavour: PlatformPath = nodePath,
): AsyncGenerator<CompletionItem[], void, void> {
  const directory = listingDirectory(source, fragment, flavour);
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
      const absolutePath = flavour.join(directory, entry.name);
      items.push({
        label: insertText,
        documentation: documentationFor(absolutePath, source.name, documentationFormat),
        kind: await entryKind(absolutePath, entry),
        insertText,
        // NO DETAIL IS READ HERE -- a size and a date per entry is a stat per
        // entry, refused on no figure -- so the item carries the path and that
        // work is done for the ONE item the user highlights.
        data: { pathCompletion: absolutePath, source: source.name } satisfies PathItemData,
        textEdit: editFor(fragment, position, line, insertText, insertReplaceSupport),
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
 * SHARED WITH THE RESOLVE HALF RATHER THAN COPIED: that half REBUILDS this block
 * rather than appending to what came back from the client, so the two must agree
 * byte for byte about an item nothing was learned about -- which two spellings of
 * one string cannot be relied on to do. THE SOURCE ARRIVES AS A NAME AND NOT AS A
 * `PathSource` because that half has only the name: the root is the completion's
 * own business and is gone by the time the item comes back.
 */
export function documentationFor(
  absolutePath: string,
  source: PathSourceName | undefined,
  format: MarkupKind,
  listing?: DirectoryListing,
): MarkupContent {
  const markdown = format === MarkupKind.Markdown;
  const parts = [flattened(absolutePath)];
  if (source !== undefined) {
    parts.push(`source: ${source}`);
  }
  if (listing !== undefined) {
    parts.push(listingText(listing, markdown));
  }
  return { kind: format, value: parts.join(markdown ? "\n\n---\n\n" : "\n\n") };
}

/** What one resolved directory's entries look like in the block. */
export interface DirectoryListing {
  /** The names to render, in the order they are rendered. */
  readonly names: readonly string[];
  /** How many entries the directory holds, which may exceed `names`. */
  readonly total: number;
}

function listingText(listing: DirectoryListing, markdown: boolean): string {
  const entries = `${String(listing.total)} ${listing.total === 1 ? "entry" : "entries"}`;
  const header =
    listing.names.length < listing.total
      ? `${entries}, first ${String(listing.names.length)} shown`
      : entries;
  if (listing.names.length === 0) {
    return header;
  }
  return `${header}\n\n${listing.names
    .map((name) => (markdown ? `- ${flattened(name)}` : flattened(name)))
    .join("\n")}`;
}

/**
 * One line's worth of a name, whatever the name is.
 *
 * THE CLASS IS EVERY CHARACTER A RENDERER MAY BREAK A LINE ON OR SWALLOW: C0
 * controls and DEL, the C1 range with NEL in it, and the two Unicode separators.
 * NOT a whitelist of printable characters -- a filename is bytes in whatever
 * script its owner writes, and this must not mangle a name it merely cannot
 * spell.
 *
 * A CODE-POINT TEST AND NOT A REGULAR EXPRESSION, which is the shape a reader
 * would otherwise restore: the deno-compatibility lint this repository runs over
 * the whole tree reports a control character inside a character class, escaped or
 * not, and a suppression at a shipped line is a worse trade than four lines that
 * need none.
 */
function flattened(name: string): string {
  return [...name]
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      const control = code < 0x20 || (code >= 0x7f && code <= 0x9f);
      return control || code === 0x2028 || code === 0x2029 ? "\uFFFD" : character;
    })
    .join("");
}

/**
 * Which markup this handler will send, out of what the client said it can
 * render: the FIRST format the client named that this module can produce.
 *
 * READ THROUGH A GUARD RATHER THAN TRUSTED, for the reason the
 * `insertReplaceSupport` read is written `=== true`: the declared type describes
 * a CONFORMING client, and one that sends something else must be answered rather
 * than crashed at.
 */
export function preferredFormat(declared: readonly MarkupKind[] | undefined): MarkupKind {
  const preference = Array.isArray(declared) ? declared : [];
  return preference.find((kind) => producible.includes(kind)) ?? MarkupKind.PlainText;
}

/** Every markup kind `documentationFor` above knows how to build. */
const producible: readonly MarkupKind[] = [MarkupKind.Markdown, MarkupKind.PlainText];

/**
 * Whether a listing failed because THAT DIRECTORY cannot be listed -- which for
 * a path being typed is ordinary, not exceptional. Widened to `catch everything`
 * it would swallow the faults that are nobody's keystroke.
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
 *
 * TAKES THE PATH THE CALLER ALREADY BUILT rather than rebuilding it from a
 * directory and the entry: the item's `data` and its documentation name that
 * same path, and a second join here is a second chance for the three to differ.
 */
async function entryKind(absolutePath: string, entry: Dirent): Promise<CompletionItemKind> {
  if (entry.isDirectory()) {
    return CompletionItemKind.Folder;
  }
  if (entry.isFile()) {
    return CompletionItemKind.File;
  }
  try {
    const target = await stat(absolutePath);
    return target.isDirectory() ? CompletionItemKind.Folder : CompletionItemKind.File;
  } catch {
    return CompletionItemKind.File;
  }
}

/**
 * A `textDocument/completion` handler that completes paths.
 *
 * COMPLETENESS RULING: NOT COMPLETE, AND IT CANNOT SAY SO ON THE WIRE. A
 * completion handler yields `CompletionItem[]` and nothing else, so every batch
 * is aggregated into a bare array, which the specification treats as
 * `{ isIncomplete: false, items }` -- a client told the set is FINAL filters what
 * it already holds instead of asking again, and after the next keystroke shows
 * candidates for a prefix the user has already left. The set really does change:
 * typing a separator does not narrow the previous answer, it replaces the
 * directory being listed.
 *
 * IT CANNOT BE FIXED HERE, which is the whole reason this paragraph is at the
 * site: every spelling available -- yielding fewer items, yielding none, batching
 * differently -- produces the same aggregated array, and an array IS the claim.
 * The edit is tsudoi's to make at the method map its own types declare.
 */
export async function* pathCompletion(
  context: RequestContext,
  params: CompletionParams,
  options: PathCompletionOptions = {},
): AsyncGenerator<CompletionItem[], void, void> {
  const document = context.tsudoi.documents.get(params.textDocument.uri);
  if (document === undefined) {
    return;
  }
  const line = document.getText().split(/\r?\n/)[params.position.line];
  if (line === undefined) {
    return;
  }
  const cwd = options.cwd ?? process.cwd();
  const flavour = options.flavour ?? nodePath;
  // TAKEN ONCE, ABOVE THE LOOP AND ABOVE EVERY `await` IN IT. The store is a LIVE
  // read off the server, so asking it again per fragment would let one response
  // attribute items to a root the user removed while an earlier directory was
  // being listed.
  const folders = Array.from(context.tsudoi.workspaceFolders.values());
  // `=== true` RATHER THAN A TRUTHINESS TEST: a client that omits the flag has
  // NOT declared support, and the explicit comparison is what keeps a
  // non-conforming client's `"yes"` from being read as a declaration it never
  // made.
  const insertReplaceSupport =
    context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem
      ?.insertReplaceSupport === true;
  const documentationFormat = preferredFormat(
    context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem?.documentationFormat,
  );
  const seen = new Set<string>();
  try {
    for (const fragment of pathFragments(line, params.position.character, flavour)) {
      let named = false;
      for (const source of sourcesFor(fragment, params.textDocument.uri, cwd, folders, flavour)) {
        for await (const batch of itemsFrom(
          source,
          fragment,
          params.position,
          line,
          insertReplaceSupport,
          documentationFormat,
          flavour,
        )) {
          const fresh = batch.filter((item) => {
            const text = item.insertText ?? "";
            if (seen.has(text)) {
              return false;
            }
            seen.add(text);
            return true;
          });
          if (fresh.length > 0) {
            named = true;
            yield fresh;
          }
        }
      }
      if (named) {
        return;
      }
    }
    return;
  } finally {
    // WHERE A HANDLER RELEASES WHAT IT HELD: an index reader, a child process, a
    // temporary file. There is nothing to release here, and the block is kept
    // anyway because WHEN it runs is the part worth knowing -- on the ordinary
    // path, and also when the editor gives up on this request, which it does on
    // every keystroke that supersedes the last one.
    //
    // THERE IS NOWHERE ELSE IT COULD GO, and that is a REAL TRAP RATHER THAN A
    // STYLE PREFERENCE: split this handler into a plain function that RETURNS a
    // generator, and a `finally` in that outer body runs the moment the generator
    // is handed back -- before any of the work, releasing nothing.
  }
}
