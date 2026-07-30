/**
 * Path completion for a config author's own `textDocument/completion` handler.
 *
 * WHAT THIS DOES ON WINDOWS, BECAUSE THIS FILE IS COPIED AND THE ANSWER TRAVELS
 * WITH IT. Every separator decision here is asked of `node:path` rather than
 * spelled out, so the module reads `C:\Users\fo` on Windows and `a\b` as an
 * ordinary filename on posix WITHOUT a branch on the platform: the flavour is a
 * parameter, defaulting to the host's own. That default is the right answer in
 * every deployment; it is a parameter so the Windows reading can be MEASURED on
 * a CI machine that has no Windows, which is the only way this file's Windows
 * behaviour is defended at all.
 *
 * FORWARD SLASHES ARE ACCEPTED ON WINDOWS, and not as a courtesy: editors and
 * users both produce them there, and node's win32 flavour already reads them as
 * separators. test/completion-path.test.ts asserts that rather than trusting it.
 *
 * TWO WINDOWS SPELLINGS ARE OUT OF SCOPE, stated here rather than left to be
 * discovered, with the decision written where it is taken:
 *
 *   - DRIVE-RELATIVE paths (`C:foo`, meaning `relative to the current directory
 *     ON DRIVE C`) contribute NO SOURCE at all -- see `sourcesFor`.
 *   - A UNC SHARE NAME STILL BEING TYPED (`\\server\sh`) completes nothing; a
 *     COMPLETE share (`\\server\share\fo`) is served like any other root -- see
 *     `sourcesFor` again.
 */

import type { Dirent } from "node:fs";
import { opendir, stat } from "node:fs/promises";
import nodePath, { basename, dirname, type PlatformPath } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { RequestContext } from "@atusy/tsudoi/types";
import { type CompletionParams } from "@atusy/tsudoi/deps/protocol";
import {
  type CompletionItem,
  CompletionItemKind,
  type InsertReplaceEdit,
  type MarkupContent,
  MarkupKind,
  type Position,
  type TextEdit,
  type WorkspaceFolder,
} from "@atusy/tsudoi/deps/types";

/** One candidate for the path the user is typing. */
export interface PathFragment {
  /** The whole candidate, exactly as the line carries it -- e.g. `src/fo`. */
  readonly text: string;
  /** Where `text` begins on the line, in UTF-16 code units, as LSP counts. */
  readonly start: number;
  /**
   * Up to and including the last separator -- e.g. `src/`, `C:\Users\`, or ``
   * for none. WHICH CHARACTERS COUNT AS SEPARATORS IS THE FLAVOUR'S, never this
   * file's: a backslash cuts on Windows and is a legal filename character on
   * posix, and the two readings must not be merged.
   */
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
 *
 * `flavour` IS WHAT MAKES THE WINDOWS READING TESTABLE, and it defaults to the
 * host's own so no caller has to know it exists. Pass `path.win32` to read a
 * line the way Windows would on a machine that is not Windows.
 */
export function pathFragments(
  line: string,
  character: number,
  flavour: PlatformPath = nodePath,
): PathFragment[] {
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
  // ASKED OF THE FLAVOUR ONCE, above the loop: the answer cannot change between
  // candidates, and every candidate needs it.
  const cutters = separatorsOf(flavour);
  // Downwards from the cursor, so the list comes out shortest-first with no
  // reversal to keep in step with the caller's preference order.
  for (let start = character - 1; start >= 0; start--) {
    // A fragment never BEGINS with whitespace, whatever precedes it.
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
 * Which characters this flavour reads as separators, ASKED OF THE FLAVOUR
 * rather than written down.
 *
 * The list of two is the whole alphabet there is to ask about; which of them
 * ANSWERS is the flavour's, and asking is what makes `Windows accepts a forward
 * slash` a measurement in every run rather than a claim in a comment that would
 * outlive the day someone checked it. `parse` is the reader because it is the
 * one that already knows: a character it cuts `a?b` at is a separator, and one
 * it leaves alone is a filename character.
 *
 * NOT `flavour.sep` ALONE, which is exactly the fix that ships the defect back:
 * win32's `sep` is the backslash, and a module cutting on `sep` would stop
 * reading the forward slashes Windows editors actually emit.
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
  // Everything after the last separator is the FILTER for ONE directory
  // listing. That split is what makes this completion per segment.
  //
  // A SCAN FOR THE LAST SEPARATOR, AND NOT `parse(text).base`, WHICH IS WRONG ON
  // THE CENTRAL CASE -- measured: `parse("notes/").base` is `notes`, because
  // parse discards a trailing separator. Deriving the cut from its length would
  // split `notes/` into `n` and `otes/`, and every item built from it would
  // insert a mangled path over a range that is otherwise correct. The scan also
  // keeps the separator THE USER TYPED, which `parse` normalises away: a
  // `C:/Users/` fragment must complete to `C:/Users/foo.txt` and not to
  // `C:\Users\foo.txt` over the top of what they wrote.
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
  /**
   * How a path is spelled: `path.win32`, `path.posix`, or the host's own, which
   * is the default and what a config author wants.
   *
   * IT IS HERE FOR THE TESTS AND SAID SO PLAINLY. Every Windows claim this file
   * makes is measured by handing `path.win32` in from a macOS or Linux runner,
   * and without a seam the Windows half would be defended by nothing but the
   * comments describing it -- which is the state the platform defect was found
   * in. A config author on Windows changes nothing: the default IS win32 there.
   */
  readonly flavour?: PlatformPath;
}

/**
 * The roots that make sense for THIS fragment.
 *
 * A fragment the flavour calls ABSOLUTE is answered by the absolute source
 * ALONE, rooted at THE FRAGMENT'S OWN ROOT -- `/` on posix, `C:\` or `C:/` or
 * `\\server\share\` on Windows. The negative half is the rule: without it,
 * typing `/` offers the current directory's children beside the filesystem
 * root's.
 *
 * ASKED OF THE FLAVOUR, NEVER OF THE TEXT. `startsWith("/")` is the reading that
 * makes this file's Windows behaviour an empty popup: `C:\Users\fo` is not
 * absolute by that test, so it is read against the working directory as ONE
 * FILENAME and nothing matches it -- no error, no diagnostic, nothing to
 * diagnose. `isAbsolute` and `parse().root` answer for both platforms, and the
 * root is TAKEN FROM THE FRAGMENT rather than hardcoded because there is no one
 * filesystem root on Windows to hardcode.
 *
 * DRIVE-RELATIVE PATHS ARE OUT OF SCOPE AND ANSWER WITH NO SOURCE AT ALL.
 * `C:foo` means `relative to the current directory ON DRIVE C`, which is a
 * per-drive cursor Windows keeps and node exposes nothing for -- `process.cwd()`
 * is one directory on one drive. So there is no root this file could name, and
 * the honest answer is to name none: an empty source list yields no items, where
 * GUESSING a root would offer candidates from a directory the user's shell is
 * not in and insert paths that resolve somewhere else. The test is
 * `parse().root` NAMING SOMETHING THE FLAVOUR STILL CALLS RELATIVE, which is
 * that case and only that case -- on posix `parse("C:foo").root` is `""`, so
 * this arm cannot fire there and take a legitimate filename with it.
 *
 * A UNC SHARE IS SERVED BY THE SAME ARM, WITH ONE ASYMMETRY WORTH KNOWING
 * BEFORE YOU TURN THIS ON. A COMPLETE share -- `\\server\share\fo` -- parses to
 * the root `\\server\share\` and completes like any other directory. A share
 * name STILL BEING TYPED -- `\\server\sh` -- parses to the root `\\server\sh`,
 * because parse cannot tell an incomplete share from a complete one, so the
 * listing is asked of a share that does not exist and yields nothing. Completing
 * the SERVER and SHARE segments themselves would need network enumeration, which
 * is not something a keystroke should do.
 *
 * ONE SOURCE PER WORKSPACE FOLDER, since a client may hold several -- keeping
 * only the first answers from whichever the editor happened to list first.
 *
 * AND NOT `workspaceFolders.get()`, WHICH ANSWERS A DIFFERENT QUESTION: which
 * folders sit at the INNERMOST location covering a uri. EVERY folder is a
 * completion root here, and the document's own directory is already a source of
 * its own, so narrowing to the folders holding the document would DELETE the
 * candidates the other roots contribute rather than sharpen the reading -- and
 * that lookup answers nothing at all for the unsaved buffer, which still wants
 * every root. A folder is converted from its URI and NEVER guessed from cwd: an
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
 *
 * THE FLAVOUR IS NOT THREADED HERE, and that is a decision rather than a spot
 * missed: this path came out of `fileURLToPath`, which is bound to the host it
 * runs on, so reading it with any other flavour would take a path in one dialect
 * apart with the rules of another.
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
 * WHICH EDIT ONE ITEM CARRIES, AND OVER WHAT SPAN. Pure, and separated from the
 * listing so the span can be measured for a fragment no host filesystem holds.
 *
 * BOTH RANGES WHERE THE CLIENT SAID IT CAN TAKE THEM, so its own
 * insert-versus-replace preference decides what happens to the tail when the
 * cursor sits mid-path. A plain `TextEdit` makes that setting inert and chooses
 * for them.
 *
 * AND ONLY WHERE IT SAID SO. `InsertReplaceEdit` is permitted to a client that
 * declared `insertReplaceSupport` and to no other -- so sending it
 * unconditionally is a SPECIFICATION VIOLATION rather than a generosity, and a
 * client entitled to receive a `TextEdit` is entitled to make nothing of an
 * object carrying no `range` at all. That is the whole reason this handler reads
 * a capability.
 *
 * THE PLAIN EDIT TAKES THE INSERT RANGE, AND THAT IS A CHOICE MADE FOR A CLIENT
 * THAT CANNOT MAKE IT, so it is made on which mistake the user can see. The
 * insert range ends AT THE CURSOR: completing `spa` on a line already reading
 * `spaced (1).txt` leaves the tail standing, and the user reads
 * `spaced (1).txtced (1).txt` and deletes what they did not want. The replace
 * range reaches PAST the cursor -- `replaceEnd` extends it to the end of a
 * candidate the line already carries -- so choosing it would delete text to the
 * right of the cursor for a client that never asked for replace semantics and
 * cannot decline it. One mistake is visible and reversible by typing; the other
 * is text vanishing.
 *
 * NOT THE SAME QUESTION AS `replaceEnd`, which stays exactly as it is: that rule
 * decides how far REPLACE reaches for a client that opted into replacing,
 * measured in the stakeholder's own editor. This decides which of the two ranges
 * a client with no such setting is given.
 *
 * EVERY SPAN IS ANCHORED AT `fragment.start`, WHICH IS WHERE THE SEPARATOR RULE
 * AND THIS ONE MEET. `newText` is the fragment's OWN directory part with an
 * entry name after it, so the text written back reconstructs exactly the span it
 * is written over: `fragment.directory + fragment.name === fragment.text`, and
 * `fragment.text` is the line from `start` to the cursor. A cut that broke that
 * identity -- deriving it from `parse().base` rather than from a separator, say
 * -- would leave every range here correct and every `newText` wrong at the same
 * anchor, which writes a mangled line rather than nothing.
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

/**
 * The one directory a source's listing is read from for this fragment.
 *
 * `resolve` AND NOT `join`, WHICH IS THE DEFECT'S SUBTLEST HALF -- and posix
 * hides it by coincidence. The absolute source's root IS the fragment's own
 * root, so the fragment's directory part ALREADY CARRIES IT. Concatenating the
 * two is harmless on posix, where `join("/", "/usr/")` is `/usr/`, and doubles
 * the root on Windows: `join("C:\\", "C:\\Users\\")` is `C:\C:\Users\`,
 * MEASURED, which names no directory and so completes nothing. `resolve` drops a
 * root that is stated twice and reads a relative directory beneath its root
 * exactly as `join` did, which is the half that must not be lost.
 *
 * NO cwd CAN ENTER IT, though `resolve` is the function that would reach for
 * one: every `PathSource.root` is absolute -- `sourcesFor` builds them from a
 * parsed root, a converted URI, or the caller's own `cwd` -- so the first
 * argument always terminates the resolution.
 */
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
  /**
   * Which markup the client said it can render in an item's `documentation`,
   * already chosen out of `textDocument.completion.completionItem.
   * documentationFormat` by `preferredFormat`.
   *
   * REQUIRED FOR THE SAME REASON AS THE FLAG ABOVE, and the defaults fail the
   * same way round: markdown re-creates the defect -- syntax sent to a client
   * that never said it renders any -- and plaintext costs every caller who
   * forgot it the formatting on the clients that do.
   */
  documentationFormat: MarkupKind,
  /**
   * How this platform spells a path. DEFAULTED, unlike the two above, and the
   * reason is the one that decides every default in this file: getting it wrong
   * is not possible by omission. The host's own flavour is the correct answer on
   * the host, so a caller who never learns this parameter exists is served by
   * it; it is a parameter at all so a suite on a machine that is not Windows can
   * still measure the Windows reading.
   */
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
      // COMPUTED ONCE AND USED TWICE: what the documentation shows the user is
      // what the resolve handler goes back to disk for, so the two cannot name
      // different files.
      const absolutePath = flavour.join(directory, entry.name);
      items.push({
        label: insertText,
        documentation: documentationFor(absolutePath, source, documentationFormat),
        kind: await entryKind(absolutePath, entry),
        insertText,
        // WHAT MAKES THIS ITEM RESOLVABLE. Nothing is stat'd here -- one stat per
        // entry is exactly what a directory of any size cannot afford -- so the
        // item carries the path and the detail is fetched for the ONE item the
        // user highlights. See `PathItemData` above.
        data: { pathCompletion: absolutePath } satisfies PathItemData,
        // WHICH EDIT, AND OVER WHAT SPAN, is `editFor` above.
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
 * The ABSOLUTE PATH first, because it is the answer to the question the
 * inserted text raises -- two roots can offer the same relative path, and only
 * this says which file is which. The source name is the shorter answer to the
 * same question and sits below the rule.
 *
 * `documentation` rather than `detail`: this is a MULTI-LINE block, and `detail`
 * is the protocol's one-line field. A client showing `detail` inline would run
 * the parts together.
 *
 * THE RULE IS THE ONLY MARKDOWN IN IT, AND IT IS DROPPED RATHER THAN DOWNGRADED
 * for a client that takes plaintext: `---` reaches such a client as three
 * literal hyphens on a line of their own, which is a stray line of punctuation
 * rather than a separator. The blank line between the two parts already
 * separates them, so plaintext loses the rule and nothing else.
 */
function documentationFor(
  absolutePath: string,
  source: PathSource,
  format: MarkupKind,
): MarkupContent {
  const attribution = `source: ${source.name}`;
  return {
    kind: format,
    value:
      format === MarkupKind.Markdown
        ? `${absolutePath}\n\n---\n\n${attribution}`
        : `${absolutePath}\n\n${attribution}`,
  };
}

/**
 * Which markup this handler will send, out of what the client said it can
 * render: the FIRST format the client named that this module can produce, and
 * plaintext when it named none this module knows.
 *
 * THE ORDER IS THE CLIENT'S AND THE FILTER IS OURS, which is what makes this a
 * negotiation rather than a guess. LSP defines `documentationFormat` as the
 * client's PREFERENCE ORDER, so scanning the client's list and stopping at the
 * first producible entry honours a client that would rather have plaintext, and
 * skips one that names a kind nothing here can build.
 *
 * PLAINTEXT IS THE FALLBACK BECAUSE IT IS THE ONE FORMAT A CLIENT CANNOT REFUSE.
 * A client that declares nothing has declared no markdown support, and markdown
 * sent there arrives as its own syntax -- asterisks and rules the user reads as
 * text. The reverse mistake costs formatting and nothing else.
 *
 * READ THROUGH A GUARD RATHER THAN TRUSTED, for the reason the
 * `insertReplaceSupport` read is written `=== true`: the declared type describes
 * a CONFORMING client, and a client that sends something else must be answered
 * rather than crashed at. A non-array declares nothing, and an unknown kind
 * inside the array is skipped by the same filter that skips one this module
 * cannot build.
 *
 * NOT SHARED WITH examples/hover-wordnet.ts, WHICH MAKES THE SAME CHOICE FOR
 * `contentFormat`: each example is copied on its own, and a reader who took this
 * file would find an import of a file they do not have.
 */
function preferredFormat(declared: readonly MarkupKind[] | undefined): MarkupKind {
  const preference = Array.isArray(declared) ? declared : [];
  return preference.find((kind) => producible.includes(kind)) ?? MarkupKind.PlainText;
}

/** Every markup kind `documentationFor` above knows how to build. */
const producible: readonly MarkupKind[] = [MarkupKind.Markdown, MarkupKind.PlainText];

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
 * fragment the flavour calls absolute is answered by its own root alone -- and
 * `itemsFrom` filters ONE directory listing by the fragment's trailing name.
 * Every one of those three depends on the character the user is about to type.
 * Typing a separator does not narrow the previous answer; it replaces the
 * directory being listed. There is no keystroke after which the previous set is still the
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
  const flavour = options.flavour ?? nodePath;
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
  // READ HERE FOR THE SAME REASON, AND ONCE FOR THE WHOLE REQUEST: this runs
  // before the first `await`, so every item of this completion is built for the
  // client that asked for it, and nothing re-reads the session from inside the
  // listing loop where the answer cannot change but the cost repeats.
  const documentationFormat = preferredFormat(
    context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem?.documentationFormat,
  );
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
    for (const fragment of pathFragments(line, params.position.character, flavour)) {
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
        flavour,
      )) {
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
