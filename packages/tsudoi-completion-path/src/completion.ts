/**
 * Path completion for a config author's own `textDocument/completion` handler.
 *
 * WHAT THIS IS: a PACKAGE a config author INSTALLS, and not a line of it lives
 * in tsudoi. It is also the worked shape of a handler that GOES TO THE
 * FILESYSTEM for its answer and streams what it finds, which is what a handler
 * that waits on something outside itself has to look like.
 *
 * WHAT A PACKAGE CHANGES ABOUT THE FILE IT WAS, and it decides how this file is
 * written: a reader who took this as an example owned it and could edit any
 * line, where an installed copy is ours to keep working. So the surface is
 * chosen in the entry module rather than being whatever this file happens to export, and
 * the comments here address a MAINTAINER -- the reader whose questions this file
 * must answer is now the person changing it, not the person copying it.
 *
 * WHAT BOUNDS IT, said where a maintainer meets it and repeated in the README
 * because an installing stranger reads only that: WHITESPACE ENDS A PATH.
 * `pathFragments` scans back from the cursor to the nearest whitespace, so a
 * filename containing a space is reachable only through the widening candidates
 * it produces, and a document where paths are quoted, escaped or comma-separated
 * is served by a handler of its own rather than by a setting on this one.
 *
 * AND NOTHING RECURSES: the answer for a fragment is ONE directory listing
 * filtered by the fragment's trailing name, so no keystroke walks a tree.
 *
 * WHAT THIS DOES ON WINDOWS. Every separator decision here is asked of
 * `node:path` rather than spelled out, so the module reads `C:\Users\fo` on
 * Windows and `a\b` as an ordinary filename on posix WITHOUT a branch on the
 * platform: the flavour is a parameter, defaulting to the host's own. That
 * default is the right answer in every deployment; it is a parameter so the
 * Windows reading can be MEASURED on a CI machine that has no Windows, which is
 * the only way this file's Windows behaviour is defended at all.
 *
 * FORWARD SLASHES ARE ACCEPTED ON WINDOWS, and not as a courtesy: editors and
 * users both produce them there, and node's win32 flavour already reads them as
 * separators. This package's own tests assert that rather than trusting it.
 *
 * TWO WINDOWS SPELLINGS ARE OUT OF SCOPE, stated here rather than left to be
 * discovered, with the decision written where it is taken:
 *
 *   - DRIVE-RELATIVE paths (`C:foo`, meaning `relative to the current directory
 *     ON DRIVE C`) contribute NO SOURCE at all -- see `sourcesFor`.
 *   - A UNC SHARE NAME STILL BEING TYPED (`\\server\sh`) completes nothing; a
 *     COMPLETE share (`\\server\share\fo`) is served like any other root -- see
 *     `sourcesFor` again.
 *
 * IT RESOLVES tsudoi THE WAY A STRANGER'S PACKAGE DOES, through the member's own
 * node_modules and tsudoi's `exports` map, with no `paths` mapping and no
 * tsconfig of the parent's reaching it. A PEER AND NOT A DEPENDENCY because the
 * framework is the host's to choose: `context.tsudoi` is built by the copy the
 * consumer's own CLI is running, and a plain dependency would pin a range of our
 * own and hand them a second copy nothing runs. The manifest's reasons are
 * asserted in the package-shape test beside this file, since package.json cannot
 * carry them itself.
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
 * no record of what a completion handler produced -- it is ruled at the method
 * map tsudoi's own types declare. So a handler cannot ask tsudoi whether an item
 * is one of its own; it can only read what it wrote onto the item itself. `data`
 * is the protocol's field for exactly that: it is preserved across the round
 * trip and means nothing to anyone but the server that set it.
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
 * EXPORTED FROM THIS MODULE, WITH ITS READER, SO THE RESOLVE HANDLER IMPORTS
 * RATHER THAN RESTATES IT. Two modules agreeing about a key by convention drift
 * the first time either is edited, and nothing in an editor would say so: the
 * details would simply stop appearing.
 *
 * AND NOT FROM THE PACKAGE. This name and its reader are absent from the entry
 * module, which is what keeps the mark an implementation detail of the pair rather than
 * a promise: published, every change to how an item says `I came from here`
 * would be a compatibility question with a stranger. It is also the whole reason
 * the two handlers ship in ONE package -- split, the mark would have to cross a
 * published boundary to reach the half that reads it.
 */
export interface PathItemData {
  /** The absolute path the item completes to. */
  readonly pathCompletion: string;
  /**
   * Which root offered it, as the item's own documentation spells it.
   *
   * IT IS HERE BECAUSE THE RESOLVE HALF REBUILDS THAT BLOCK RATHER THAN
   * APPENDING TO IT: what comes back from a client is the client's text, so
   * every fact the answer states has to arrive somewhere the answer may be built
   * out of. AND IT CANNOT BE DERIVED FROM THE PATH -- one file is reachable from
   * the document's directory, the working directory, a workspace folder and an
   * absolute fragment at once, and by resolve time the fragment that chose
   * between them is gone.
   *
   * COSTING NOTHING AT POPUP TIME, which is what makes it affordable on an item
   * this module produces per entry: the name is already in hand at the source.
   *
   * `pathCompletion` STAYS THE GATE AND THIS IS NEVER READ FIRST -- a near-miss
   * rather than a hypothetical: a fixture in this repository's own resolve suite
   * stands in for another language server by sending `data` of
   * `{ source: "some other server", ... }`, under this very key. A handler
   * keying on `source` would claim that server's items.
   */
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
 *
 * READ AFTER `completedPath` AND NEVER INSTEAD OF IT: `source` is a plausible
 * key for any server to put on its own items -- one in this repository's suite
 * already does -- so the path is the gate and this is only ever the second
 * question.
 *
 * CHECKED AGAINST THE CLOSED SET RATHER THAN TAKEN AS A STRING, which is the one
 * validation in this pair and it is not a change of position about forgery. The
 * path is still taken as sent, deliberately, for the reason written at the
 * resolve handler. What this refuses is narrower and is about the ANSWER: the
 * block is REBUILT from what the handler knows, so a name arriving from a client
 * must not become text the block states. An unknown one is dropped and the
 * attribution goes with it.
 */
export function completedSource(item: CompletionItem): PathSourceName | undefined {
  const data: unknown = item.data;
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const source: unknown = (data as { source?: unknown }).source;
  return sourceNames.find((name) => name === source);
}

/** Every name a `PathSource` may carry, as a value the mark reader can check. */
const sourceNames: readonly PathSourceName[] = ["document", "cwd", "workspace", "absolute"];

/**
 * How many items leave in one message. Batching survives the per-segment rule
 * because no walk is needed for one directory to be too large to hand over at
 * once. The value is a judgement: small enough that the first batch arrives
 * while the rest is still being read.
 *
 * NOT EXPORTED FROM THIS MODULE EITHER, WHICH IS FURTHER IN THAN THE OTHER
 * INTERNAL NAMES GO. What it decides is observable where it matters -- as the
 * SIZE OF EACH `$/progress` a client receives -- so a test that imported the
 * number would agree with itself, where the one that reads the wire disagrees
 * loudly the day this moves.
 */
const batchSize = 100;

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
 * their own test in this package because each relaxation
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
 * NO cwd CAN SUPPLY A DIRECTORY HERE, which is the guarantee worth having and
 * the whole of it: every `PathSource.root` is absolute -- `sourcesFor` builds
 * them from a parsed root, a converted URI, or the caller's own `cwd` -- so no
 * relative segment survives to be read against wherever the process happens to
 * be.
 *
 * IT CAN SUPPLY A DRIVE, ON WINDOWS, AND THAT IS THE SPELLING'S OWN MEANING
 * RATHER THAN A LEAK. A fragment written `\foo` is rooted on the CURRENT DRIVE
 * -- that is what the leading separator with no device means there -- so it
 * parses to the root `\`, and node fills the letter in from `process.cwd()`.
 * MEASURED, and the mechanism is visible even off Windows:
 * `win32.resolve("C:\\proj", "\\")` is `C:\`, the device coming from the root
 * and not from the directory. A reader looking for a cwd that cannot enter will
 * find this one, so it is named.
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
        documentation: documentationFor(absolutePath, source.name, documentationFormat),
        kind: await entryKind(absolutePath, entry),
        insertText,
        // WHAT MAKES THIS ITEM RESOLVABLE. No DETAIL is read here -- a size and a
        // date per entry is exactly what a directory of any size cannot afford --
        // so the item carries the path and that work is done for the ONE item the
        // user highlights. See `PathItemData` above.
        //
        // WHICH IS NOT THE SAME AS TOUCHING NO DISK, and the difference is
        // `entryKind` on the line above: an ordinary file or directory is
        // classified from the dirent the listing already produced, and an entry
        // the dirent calls NEITHER -- a symlink -- costs one stat to say what it
        // points at. So the cost is bounded by how many symlinks a directory
        // holds rather than by how many entries.
        data: { pathCompletion: absolutePath, source: source.name } satisfies PathItemData,
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
 * THE RULE IS THE ONLY MARKDOWN IN IT ASIDE FROM A LISTING'S BULLETS, AND BOTH
 * ARE DROPPED RATHER THAN DOWNGRADED for a client that takes plaintext: `---`
 * reaches such a client as three literal hyphens on a line of their own, which
 * is a stray line of punctuation rather than a separator. The blank line between
 * the parts already separates them, so plaintext loses the rule and nothing
 * else.
 *
 * WHY A LISTING IS BULLETED FOR A MARKDOWN CLIENT AND BARE LINES FOR A PLAINTEXT
 * ONE, which looks like decoration and is not: markdown JOINS consecutive lines
 * into one paragraph, so a column of names sent as bare lines reaches a markdown
 * client as one wrapped run of words -- unreadable as the list it is.
 *
 * MARKDOWN SYNTAX IN A NAME IS STILL NOT ESCAPED AND A LINE BREAK IN ONE NO
 * LONGER SURVIVES, and the difference between those two is the whole of what
 * `flattened` below is for. A name holding `**` emboldens something, which is
 * the trade this block has always made and is not widened here. A name holding a
 * NEWLINE is a different thing: THE LINE GRAMMAR OF THIS BLOCK IS LOAD-BEARING,
 * because a line reading `source: <name>` is a statement the SERVER makes, so a
 * file called `x\n\nsource: workspace` renders an attribution byte-identical to
 * one the composer emits -- MEASURED, in both markup arms and from BOTH the
 * listing and the path -- and it names a source the closed-set check would have
 * refused. A name may render as anything; it may not render as a line this
 * grammar assigns meaning to.
 *
 * SHARED WITH THE RESOLVE HALF RATHER THAN COPIED, THE WAY THE MARK IS: exported
 * from this module, absent from the entry module, so one composer serves both
 * callers and nothing about the block becomes a promise to a stranger. The
 * resolve half REBUILDS this block rather than appending to what came back, so
 * the two must agree byte for byte about an item nothing was learned about --
 * which two spellings of one string cannot be relied on to do.
 *
 * THE SOURCE ARRIVES AS A NAME AND NOT AS A `PathSource`, because the resolve
 * half has only the name: the root that produced the item is the completion's
 * own business and is gone by the time the item comes back. `undefined` is the
 * item whose mark named no source this module offers -- a forged one -- and the
 * attribution is then omitted rather than echoed, because the answer may not be
 * assembled out of text a client supplied.
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

/**
 * A directory's listing as the block carries it: how many entries there are, and
 * then their names.
 *
 * THE COUNT IS HERE AND NEVER ON `detail`, so exactly one number about a
 * directory exists and two cannot disagree. It is also what keeps an EMPTY
 * directory distinguishable from a path nothing was listed for: with names
 * alone, `the directory holds nothing` and `no listing was taken at all` produce
 * the same bytes, which is the defect this project has already measured once in
 * a fixture and will not ship in the answer.
 */
function listingText(listing: DirectoryListing, markdown: boolean): string {
  const entries = `${String(listing.total)} ${listing.total === 1 ? "entry" : "entries"}`;
  // THE TOTAL IS WHAT THE DIRECTORY HOLDS AND NEVER WHAT WAS RENDERED, which is
  // the whole point of stating it: `first 20 shown` beside `20 entries` would
  // tell the user nothing they could not already count.
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
 * WHY IT IS NEEDED AT ALL is written at the composer above: a line of this block
 * is a statement the server makes, and a name is data, so no name may render as
 * a line the grammar reads. THE TWO PLACES A NAME REACHES THE BLOCK are the
 * absolute path at the top and the listing below it, and BOTH go through here --
 * the path is the one a reader would miss, because it comes off the item's mark
 * and is therefore the client's string rather than something read from disk.
 *
 * THE REPLACEMENT CHARACTER RATHER THAN DROPPING THE ENTRY OR ESCAPING IT.
 * Dropping would make the block disagree with the count beside it and hide a
 * file the completion half offers; a `\n` escape collides with a name that
 * really holds a backslash and an `n`. U+FFFD says `something was here that
 * cannot be shown` and promises no round trip, which is exactly the claim.
 *
 * THE CLASS IS EVERY CHARACTER A RENDERER MAY BREAK A LINE ON OR SWALLOW: C0
 * controls and DEL, the C1 range with NEL in it, and the two Unicode separators.
 * NOT a whitelist of printable characters -- a filename is bytes in whatever
 * script its owner writes, and this must not mangle a name it merely cannot
 * spell.
 *
 * A CODE-POINT TEST AND NOT A REGULAR EXPRESSION, which is the shape a reader
 * would otherwise restore: the deno-compatibility lint this repository runs over
 * the whole tree reports a control character inside a character class, escaped
 * or not, and a suppression comment at a shipped line is a worse trade than four
 * lines that need none.
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
 * NOT SHARED WITH @atusy/tsudoi-hover-wordnet, WHICH MAKES THE SAME CHOICE FOR
 * `contentFormat`. Sharing would make one handler package depend on another, so
 * a config author who wanted path completion would install a dictionary too --
 * and neither package may reach into the other's unpublished surface, which is
 * where both of these functions deliberately sit. The direction that WOULD be
 * sound, a helper published by tsudoi itself, is a decision nobody has asked for
 * and is not made here.
 *
 * EXPORTED FOR THE RESOLVE HALF AND NOT FOR ANYONE ELSE, on the composer's own
 * reason: that half re-reads the format FROM THE SESSION rather than trusting
 * anything the item carried back, so both halves have to negotiate it the same
 * way -- and a second spelling of `the first producible kind the client named`
 * is a second answer waiting to differ.
 */
export function preferredFormat(declared: readonly MarkupKind[] | undefined): MarkupKind {
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
 * in that client's own LSP completion module. A CLIENT ACTS ON THE FLAG, which is what makes the
 * bare array a claim with consequences rather than a formality.
 *
 * THE FUTURE PATH, evidence-shaped rather than aspirational, and the edit is
 * tsudoi's to make at the method map its own types declare -- not this
 * package's.
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
