/**
 * Path completion for a config author's own `textDocument/completion` handler.
 */

import type { Dirent } from "node:fs";
import { opendir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { RequestContext } from "@atusy/tsudoi/types";
import { type CompletionParams } from "@atusy/tsudoi/deps/protocol";
import {
  type CompletionItem,
  CompletionItemKind,
  type MarkupContent,
  type Position,
  type WorkspaceFolder,
} from "@atusy/tsudoi/deps/types";

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
 * WHAT THIS MODULE PUTS ON EVERY ITEM IT PRODUCES, AND THE ONLY THING A RESOLVE
 * HANDLER CAN KEY OFF.
 *
 * `completionItem/resolve` asks about an item THE CLIENT HOLDS, and tsudoi keeps
 * no record of what a completion handler produced -- the ruling is at
 * `MethodMap` in src/types.ts. So a handler cannot ask tsudoi whether an item is
 * one of its own; it can only read what it wrote onto the item itself. `data` is
 * the protocol's field for exactly that: it is preserved across the round trip
 * and means nothing to anyone but the server that set it.
 *
 * A NAMED KEY RATHER THAN A BARE STRING, because `data` is one field and every
 * source in a client's list writes to its own copy of it. A handler that treated
 * any string it found there as a path would stat whatever another server put on
 * its items.
 *
 * THE ABSOLUTE PATH AND NOT THE INSERTED TEXT: two roots can offer the same
 * relative path, and by resolve time the fragment that produced it is gone. It
 * is the same value the documentation shows, computed once at the item.
 *
 * EXPORTED, WITH ITS READER, SO THE RESOLVE HANDLER IMPORTS RATHER THAN RESTATES
 * IT -- the pairing examples/formatting-trailing-whitespace.ts has with its
 * scanner. Two modules agreeing about a key by convention drift the first time
 * either is edited, and nothing in an editor would say so: the details would
 * simply stop appearing.
 */
export interface PathItemData {
  /** The absolute path the item completes to. */
  readonly pathCompletion: string;
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
 * THAT SECOND HALF IS HELD UP HERE ALONE. `folders` arrives from
 * `context.tsudoi.workspaceFolders` -- the client's own list, which no cwd can
 * enter -- so this function taking URIs as given IS the whole guarantee. NOTHING
 * ELSE HAS TO HOLD IT: tsudoi refuses a relative `rootPath`
 * at its own boundary, so a config reducing the deprecated root fields never
 * meets the value that could have produced a cwd root.
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
 * is not in this suite and no red here will catch a regression in it.
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
  /**
   * Whether the client declared
   * `textDocument.completion.completionItem.insertReplaceSupport`.
   *
   * REQUIRED AND NEVER DEFAULTED, for a reason neither default survives. `true`
   * re-creates the defect this parameter exists to close -- an
   * `InsertReplaceEdit` sent to a client the specification does not let receive
   * one. `false` is worse in the way that lasts: it costs every caller who
   * forgot it the whole insert-versus-replace feature, silently, on the clients
   * that DO support it, which is the majority. A caller that has to answer the
   * question cannot get it wrong by omission.
   */
  insertReplaceSupport: boolean,
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
      // COMPUTED ONCE AND USED TWICE: what the documentation shows the user is
      // what the resolve handler goes back to disk for, so the two cannot name
      // different files.
      const absolutePath = join(directory, entry.name);
      items.push({
        label: insertText,
        documentation: documentationFor(absolutePath, source),
        kind: await entryKind(directory, entry),
        insertText,
        // WHAT MAKES THIS ITEM RESOLVABLE. Nothing is stat'd here -- one stat per
        // entry is exactly what a directory of any size cannot afford -- so the
        // item carries the path and the detail is fetched for the ONE item the
        // user highlights. See `PathItemData` above.
        data: { pathCompletion: absolutePath } satisfies PathItemData,
        // BOTH RANGES WHERE THE CLIENT SAID IT CAN TAKE THEM, so its own
        // insert-versus-replace preference decides what happens to the tail when
        // the cursor sits mid-path. A plain `TextEdit` makes that setting inert
        // and chooses for them.
        //
        // AND ONLY WHERE IT SAID SO. `InsertReplaceEdit` is permitted to a
        // client that declared `insertReplaceSupport` and to no other -- so
        // sending it unconditionally is a SPECIFICATION VIOLATION rather than a
        // generosity, and a client entitled to receive a `TextEdit` is entitled
        // to make nothing of an object carrying no `range` at all. That is the
        // whole reason this handler reads a capability.
        //
        // THE PLAIN EDIT TAKES THE INSERT RANGE, AND THAT IS A CHOICE MADE FOR
        // A CLIENT THAT CANNOT MAKE IT, so it is made on which mistake the user
        // can see. The insert range ends AT THE CURSOR: completing `spa` on a
        // line already reading `spaced (1).txt` leaves the tail standing, and
        // the user reads `spaced (1).txtced (1).txt` and deletes what they did
        // not want. The replace range reaches PAST the cursor -- `replaceEnd`
        // extends it to the end of a candidate the line already carries -- so
        // choosing it would delete text to the right of the cursor for a client
        // that never asked for replace semantics and cannot decline it. One
        // mistake is visible and reversible by typing; the other is text
        // vanishing.
        //
        // NOT THE SAME QUESTION AS `replaceEnd`, which stays exactly as it is:
        // that rule decides how far REPLACE reaches for a client that opted into
        // replacing, measured in the stakeholder's own editor. This decides
        // which of the two ranges a client with no such setting is given.
        textEdit: insertReplaceSupport
          ? {
              newText: insertText,
              insert: {
                start: { line: position.line, character: fragment.start },
                end: position,
              },
              replace: {
                start: { line: position.line, character: fragment.start },
                end: { line: position.line, character: replaceEnd(line, fragment, insertText) },
              },
            }
          : {
              newText: insertText,
              range: {
                start: { line: position.line, character: fragment.start },
                end: position,
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
 *
 * COMPLETENESS RULING: NOT COMPLETE, AND IT CANNOT SAY SO ON THE WIRE. A
 * completion handler yields `CompletionItem[]` and nothing else, so every batch
 * this generator yields is aggregated into a bare `CompletionItem[]`, which the
 * specification treats as identical to `{ isIncomplete: false, items }`. THE
 * VERDICT AND WHAT LEAVES THIS PROCESS DISAGREE.
 *
 * SO THE CLAIM THIS HANDLER MAKES ON THE WIRE IS WRONG, AND IT CANNOT BE FIXED
 * HERE. Nothing this module can write changes it: the wrongness is in the TYPE,
 * not in this file. Every spelling available -- yielding fewer items, yielding
 * none, batching differently -- produces the same aggregated array, and an array
 * IS the completeness claim. A reader looking for the bug in this function will
 * not find it, which is the whole reason this paragraph is here rather than in a
 * commit message.
 *
 * WHAT IT COSTS AN EDITOR USER, so the entry is not merely bookkeeping: a client
 * told the set is FINAL filters what it already holds instead of asking again,
 * so after the next keystroke it shows candidates for a prefix the user has
 * already left -- and for `/`, candidates from a directory they are no longer
 * in. MEASURED AGAINST A REAL CLIENT, so the cost is not inferred from the
 * specification: nvim 0.13.0-nightly+6ecf226 re-queried 3 times against an
 * `isIncomplete: true` answer and ONCE against the paired `false`, corroborated
 * at completion.lua:1086. A CLIENT ACTS ON THE FLAG, which is what makes the
 * bare array a claim with consequences rather than a formality.
 *
 * THE FUTURE PATH, evidence-shaped rather than aspirational, and it is at
 * `MethodMap` in src/types.ts where the edit would be made.
 *
 * WHY IT IS FALSE, measured against what this module actually does rather than
 * argued: `pathFragments` re-derives the fragment from the line AT THE CURSOR
 * on every request, `sourcesFor` picks the roots FROM THAT FRAGMENT -- a
 * fragment beginning `/` is answered by the filesystem root alone -- and
 * `itemsFrom` filters ONE directory listing by the fragment's trailing name.
 * Every one of those three depends on the character the user is about to type.
 * Typing `/` does not narrow the previous answer; it replaces the directory
 * being listed. There is no keystroke after which the previous set is still the
 * right set, which is the strongest form of `re-query`.
 *
 * AND ONE THING IT IS NOT: the BATCHING at `batchSize` is not incompleteness.
 * Batches are the same final set arriving in pieces; `isIncomplete` is about
 * the set CHANGING as the user types. A reader who conflates them would
 * conclude that draining the iterator makes the answer complete -- and batching
 * being ALL this generator can express makes that conflation EASIER to fall
 * into rather than harder, which is the whole reason the paragraph is here.
 *
 * NOTHING TO SAY IS YIELDING NOTHING, AND THAT IS NOT THE SAME AS AN EMPTY
 * LIST. No document, no line, or a listing that produced no batch at all means
 * this server has NO ANSWER for that position -- where `[]` would tell the user
 * there are no candidates, which is a different and stronger statement. tsudoi
 * answers `null` for a generator that yielded nothing, which is what keeps the
 * two apart.
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
  const folders = Array.from(context.tsudoi.workspaceFolders.values());
  // READ ONCE, FROM THE SESSION, AND `=== true` RATHER THAN A TRUTHINESS TEST.
  // The chain is optional at every step because a client may declare nothing at
  // all -- `clientCapabilities` is `{}` then, never null, so nothing here has to
  // be defended -- and a client that omits the flag has NOT declared support.
  // The explicit comparison is what keeps a non-conforming client's `"yes"` from
  // being read as a declaration it did not make.
  const insertReplaceSupport =
    context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem
      ?.insertReplaceSupport === true;
  // WHEN THE CLIENT SENT NO FOLDERS THIS SAYS NOTHING, and that is a CHOICE
  // rather than an oversight -- recorded here because someone would otherwise
  // add the report believing it was required.
  //
  // WHY NOT ONE LINE ON STDERR PER SESSION: the stakeholder reads that as noise
  // in the LSP log, which is the one channel a config author has for a handler
  // that failed. THE COST STANDS AND IS NOT ARGUED AWAY: with no workspace the
  // workspace source contributes nothing, and nothing looks exactly like a
  // working source in a project that holds no matches, so a config author whose
  // editor opened no workspace gets no items from that source and no
  // explanation of why.
  //
  // AND `NO FOLDERS` IS THE WHOLE OF IT, WHICH IS WIDER THAN IT LOOKS: a client
  // without the workspace-folders capability names its project in `rootUri` or
  // `rootPath` and sends no folders, so it lands here too, silently, however
  // clearly it named a project. The line below says what this file does about
  // that and why -- nothing.
  const seen = new Set<string>();
  try {
    for (const fragment of pathFragments(line, params.position.character)) {
      let named = false;
      for (const source of sourcesFor(
        fragment,
        params.textDocument.uri,
        cwd,
        // WHAT THE CLIENT SENT, AND NOTHING ELSE. A client without the
        // workspace-folders capability names its project in `rootUri` or
        // `rootPath` instead, and THIS SOURCE THEN CONTRIBUTES NOTHING -- the
        // document's own directory, the working directory and an absolute
        // fragment still answer, so the handler is narrower rather than empty.
        // Reducing over the deprecated fields is a decision this file DOES NOT
        // TAKE: `context.tsudoi.rootUri` and `context.tsudoi.rootPath` are
        // there for a config that wants it. A `rootPath` that arrives is already
        // absolute, since tsudoi refuses a relative one at its boundary; a
        // `rootUri` is whatever the client said, and converting one that names
        // no local path throws in the handler that converts it.
        //
        // TAKEN ONCE, ABOVE THE LOOP AND ABOVE EVERY `await` IN IT. The store
        // is a LIVE read off the server, so asking it again per fragment would
        // let one response attribute items to a root the user removed while an
        // earlier directory was being listed. `Array.from` is that taking, and
        // it is all it takes -- tsudoi replaces the list rather than writing
        // into it, so what this holds is the workspace the request began with.
        folders,
      )) {
        for await (const batch of itemsFrom(
          source,
          fragment,
          params.position,
          line,
          insertReplaceSupport,
        )) {
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
        return;
      }
    }
    return;
  } finally {
    // WHERE A HANDLER RELEASES WHAT IT HELD: an index reader, a child process,
    // a temporary file. There is nothing to release here, and the block is kept
    // anyway because WHEN it runs is the part worth knowing.
    //
    // It runs on the ordinary path, and it also runs when the editor gives up
    // on this request -- which it does on every keystroke that supersedes the
    // last one. tsudoi closes THIS GENERATOR then, so cleanup written here
    // happens even though the request is answered `RequestCancelled` and
    // nothing here can be watched succeeding.
    //
    // THERE IS NOWHERE ELSE IT COULD GO, and the shape that would move it is
    // worth naming because it is a REAL TRAP RATHER THAN A STYLE PREFERENCE:
    // split this handler into a plain function that RETURNS a generator, and a
    // `finally` written in that outer body runs the moment the generator is
    // handed back -- before any of the work, releasing nothing. THE HANDLER IS
    // THE GENERATOR, so there is one body and the trap has no site.
  }
}
