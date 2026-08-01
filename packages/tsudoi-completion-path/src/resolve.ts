/**
 * Filesystem detail for a config author's own `completionItem/resolve` handler.
 *
 * THE SECOND HALF OF THIS PACKAGE, AND THE REASON IT HAS TWO. Work too
 * expensive to do for every item is done for the ONE ITEM THE USER HIGHLIGHTS.
 *
 * THE ARITHMETIC IS THE ARGUMENT, AND IT IS ABOUT THE KEYSTROKE RATHER THAN
 * ABOUT ONE CALL. The completion beside this file lists one directory and offers
 * what is in it -- and a directory of a few thousand entries is ordinary. One
 * `stat` per entry to show a size would put a few thousand syscalls on the
 * keystroke that opened the popup; what this file does per HIGHLIGHT is a stat
 * and, for a directory, one listing -- two reads on an idle moment.
 *
 * AND WHAT IT ANSWERS IS NO LONGER ONLY `THE SAME INFORMATION, FETCHED LATER`.
 * A file's size and date are exactly that. A DIRECTORY'S CONTENTS ARE NOT: the
 * completion never asked what was inside the entries it offered, so this is a
 * question that gets asked here or nowhere. The syscall argument does not settle
 * it either -- one `opendir` is the same order as one `stat` -- and what the
 * bound below is really about is the PAYLOAD: bytes in one response and lines in
 * one popup.
 *
 * IT IS PAIRED WITH THE COMPLETION MODULE AND THE IMPORT BELOW IS THE PAIRING.
 * tsudoi keeps NO record of what a completion handler produced -- it is ruled at
 * the method map tsudoi's own types declare -- so this handler cannot ask tsudoi
 * whether an item is one of this package's own. It can only read what the
 * completion module WROTE ONTO THE ITEM, which is why the mark and its reader
 * are defined THERE and imported here rather than spelled out twice. Two modules
 * agreeing about a key by convention drift the first time either is edited, and
 * nothing in an editor says so: the details simply stop appearing.
 *
 * THAT IMPORT IS WHY THE TWO HALVES SHIP AS ONE PACKAGE. The mark is unpublished
 * on purpose; split across two packages it would have to be published, and every
 * change to how an item is marked would become a compatibility question. And the
 * split could not be undone by a config author either: tsudoi REFUSES a config
 * supplying `completionItem/resolve` with no completion handler beside it, so
 * this handler is unusable without the one beside it.
 *
 * WHAT A MAINTAINER MUST NOT CLOSE, and it is a property of any resolve handler
 * rather than of this one: THE ITEM ARRIVES FROM THE CLIENT.
 * `data` is whatever the client sent back, so a mark can be forged, and this
 * handler will then read a path nobody's completion chose.
 *
 * WHAT A FORGED MARK NOW COSTS, RE-STATED BECAUSE IT MOVED: a stat revealed a
 * size and a date; a listing reveals THE NAMES INSIDE A DIRECTORY, to the user
 * who asked for it, on a machine they are already running the server on. That is
 * one step nearer `answered with its contents` than a stat was, and it is worth
 * saying out loud rather than leaving the old sentence to cover a bigger answer.
 * THE LINE THIS HANDLER WILL NOT CROSS IS READING A FILE'S BYTES -- and running a
 * command, or writing anything, is further still.
 *
 * AND A MARK THAT COLLIDES COSTS MORE THAN IT DID, WHICH IS A CHANGE IN BLAST
 * RADIUS RATHER THAN IN LIKELIHOOD. An item ANOTHER server produced, whose `data`
 * happens to carry this key, used to lose its one-line `detail` to a size and a
 * date it did not ask for; now its multi-line block is REPLACED, so that
 * server's user is shown documentation about a path nobody's completion offered
 * them. RECORDED RATHER THAN GUARDED, and the gate stays the path alone:
 * `pathCompletion` is an identity that collides with nothing observed anywhere,
 * while requiring the SOURCE to check out as well would rest a second
 * coincidence on the one key demonstrably shared -- a fixture in this
 * repository's own suite stands in for another server by writing `source` under
 * `data`. The wider gate would also answer an item with a valid path and an
 * invalid source by handing it straight back, which is exactly the arm that
 * shows the attribution being DROPPED rather than echoed.
 *
 * Nothing is validated below, deliberately: a check would suggest this boundary
 * can be closed, and it cannot be. What decides it is what the handler DOES with
 * the path. The one thing that IS checked -- the source name on the mark -- is
 * not a repair of this boundary and does not pretend to be: it exists because
 * the ANSWER is composed here, and a name arriving from a client may not become
 * text this handler states.
 */
// `Stats` is declared by node:fs and only the promise-shaped `stat` by
// node:fs/promises, so the two lines are the runtimes' shape rather than a
// preference -- measured, TS2724 names it.
import type { Stats } from "node:fs";
// `opendir` TAKES NO OPTIONS ARGUMENT HERE, and that is a compatibility reading
// rather than a style: deno's node:fs rejects `opendir(path, {})` outright --
// `The "options.bufferSize" property must be of type number. Received undefined`
// -- where bun accepts it. MEASURED on deno 2.8.3, and a larger bufferSize was
// measured to buy nothing worth the divergence anyway (5000 entries, deno: 127
// ms at the default against 92 ms at 1024, against 45 ms for the shape this
// module gave up; bun: within noise of each other).
import { opendir, stat } from "node:fs/promises";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import {
  completedPath,
  completedSource,
  documentationFor,
  preferredFormat,
  type DirectoryListing,
} from "./completion.ts";

/**
 * What one line of `detail` says about a path.
 *
 * `detail` AND NOT `documentation`, and it is the counterpart of that module's
 * opposite choice: the documentation is a multi-line block with a rule in it,
 * while this is one line a client can show inline beside the label -- which is
 * where a size and a date want to be read.
 *
 * NO SIZE FOR A DIRECTORY, which is a decision rather than an omission. A
 * directory's `size` is the size of its directory ENTRY -- 64 units on one
 * filesystem and 4096 on the next for the same two children -- so it is the
 * filesystem's business and says nothing about what is inside. Showing it would
 * put a number in front of a user that invites exactly the wrong reading.
 *
 * MTIME AS ISO 8601 IN UTC, because this string is generated by a server and
 * read by a person who may be anywhere: a locale-formatted date would be
 * formatted for the machine the server happens to run on.
 */
function detailFor(stats: Stats): string {
  const modified = `modified ${stats.mtime.toISOString()}`;
  return stats.isDirectory()
    ? `directory · ${modified}`
    : `file · ${String(stats.size)} bytes · ${modified}`;
}

/**
 * A `completionItem/resolve` handler that fills in a path item's file detail.
 *
 * THE ITEM COMES BACK UNCHANGED IN TWO CASES, and neither is an error path.
 *
 * AN ITEM THIS PACKAGE DID NOT PRODUCE carries no mark, and the protocol's
 * answer REPLACES the item in the client's list -- so anything other than the
 * item itself DROPS THE ENTRY THE USER IS LOOKING AT. tsudoi rules it at the same
 * method map, and a client may legitimately send one: resolve asks about an item
 * the client holds, not about one tsudoi remembers.
 *
 * A PATH THAT IS GONE by the time the user highlights the item is ordinary
 * rather than exceptional -- a popup outlives a `git checkout` in another window
 * -- so the rejection is swallowed for the reason an unlistable directory
 * contributes nothing to completion instead of failing it: an escaped rejection
 * is answered -32603 and takes away the popup the user is reading. Nothing is
 * written to stderr either, or every stale item a user scrolls past would put a
 * line in the editor's log.
 *
 * A COPY RATHER THAN A MUTATION, because the item is the request's params and a
 * handler that edits them in place is writing into somebody else's object.
 *
 * THE MULTI-LINE BLOCK IS REBUILT AND NEVER APPENDED TO, FOR EITHER KIND. What
 * comes back is the CLIENT'S text -- as forgeable as the mark, one field over --
 * so an answer built by appending to it would be an answer built out of a string
 * a client can put anything in.
 *
 * WHAT REBUILDING BUYS IS NOT THAT NOTHING IN THE ANSWER CAME FROM THE CLIENT,
 * AND THE SENTENCE THAT SAID SO WAS FALSE. The absolute path at the top of the
 * block comes off the MARK -- the item's own `data`, which arrives from the
 * client -- and it is the string a directory's name reaches the block through as
 * well. What rebuilding buys is that every part of the answer is one this
 * handler DECIDED to state: the source goes through a closed set, the format is
 * re-read from THE SESSION rather than from anything the item carried, and no
 * name -- the path's or an entry's -- may render as a line the block's grammar
 * assigns meaning to, which is what the composer flattens for. A FILE'S BLOCK IS
 * REBUILT TOO, which is why this
 * runs on every path item and not only on directories -- rebuilding for
 * directories alone would leave a file answered with the client's own text --
 * and for a file the rebuild reproduces exactly what the completion wrote.
 *
 * THE TWO READS FAIL SEPARATELY, AND ONE `try` AROUND BOTH IS THE MISTAKE THIS
 * SHAPE EXISTS TO REFUSE: a path that can be stat-ed and NOT listed -- an
 * ordinary posix permission, MEASURED biting under both runtimes -- would then be
 * answered with the bare item, throwing away a detail that was already in hand.
 * A failed listing costs the user the listing and nothing else.
 *
 * THE SIGNAL IS READ BETWEEN THE TWO READS, AND WHAT THAT BUYS IS THAT THE WORK
 * IS NOT DONE -- NOT THAT THE ANSWER IS RIGHT. Which of the two it buys was READ
 * off tsudoi rather than assumed, because only one of them was ever available:
 * tsudoi re-reads the abort AFTER a handler settles and answers a cancelled
 * request -32800 whatever the handler produced, so an answer composed after a
 * cancellation is DISCARDED with or without this check, and nothing a config
 * author writes here can change what that client is told. What nothing can take
 * back afterwards is work already done. A user arrowing through a popup
 * supersedes their own highlight by the keystroke, and every superseded one used
 * to go on to open the directory and read it to the end.
 *
 * IT IS READ ONCE, HERE, AND NOT AGAIN INSIDE THE LISTING, which looks like the
 * cheaper half of the same idea and is refused on a measurement written at
 * `listingOf`: on one of the two runtimes a directory abandoned mid-drain never
 * gives its descriptor back. So the seam that pays is the one BEFORE the handle
 * is opened -- where what is skipped is the whole read rather than the tail of
 * it -- and a cancellation arriving after the drain has begun costs what it
 * always did.
 *
 * THE UNTOUCHED ITEM IS WHAT A CANCELLED RESOLVE ANSWERS, for the reason the
 * gone-path case answers it: nothing this handler decided to state was finished,
 * and the item the client holds is the one thing that is certainly not wrong.
 */
export const resolvePathStat: MethodHandler<"completionItem/resolve"> = async (context, item) => {
  const path = completedPath(item);
  if (path === undefined) {
    return item;
  }
  let stats: Stats;
  try {
    stats = await stat(path);
  } catch {
    // NOTHING WAS READ, so there is nothing to answer out of and the item goes
    // back as it came -- which is what the untouched-item cases require.
    return item;
  }
  if (context.signal.aborted) {
    // THE STAT IS SPENT AND THE LISTING IS THE UNBOUNDED READ, so this is the
    // seam where a cancellation is worth anything at all -- the whole reason
    // the two reads are not one expression.
    return item;
  }
  return {
    ...item,
    detail: detailFor(stats),
    documentation: documentationFor(
      path,
      completedSource(item),
      // READ FROM THE SESSION THE HANDLER WAS HANDED, per request, for the
      // reason the completion half reads it per request: the block is composed
      // here, so it is composed for the client that asked for it.
      preferredFormat(
        context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem
          ?.documentationFormat,
      ),
      stats.isDirectory() ? await listingOf(path) : undefined,
    ),
  };
};

/**
 * What one directory holds, ready to be rendered.
 *
 * THE WHOLE DIRECTORY IS READ, ON PURPOSE, and the cost was MEASURED rather than
 * feared: one directory of five thousand entries, names only, drains in 51 ms on
 * bun 1.3.13 and 135 ms on deno 2.8.3 (macOS/APFS, mean of 5), against the ~1.1 s
 * of per-entry stats this package exists to refuse and against a completion half
 * that ALREADY drains an entire directory on every keystroke to filter it. A
 * drain once per HIGHLIGHT cannot be the expensive thing here. THOSE TWO NUMBERS
 * ARE THE RULING'S PROVENANCE AND NOT THIS SHAPE'S COST -- they were read off the
 * `readdir` this function no longer uses, and what the shape below measures is
 * further down.
 *
 * WHAT DOES NOT SHRINK WITH IT IS THE PAYLOAD -- those five thousand names are
 * eighty-five thousand characters in one response and five thousand lines in one
 * popup -- so the bound this listing is rendered under is on entries SHOWN and
 * never on entries read.
 *
 * AND THE BOUND ON WHAT IS SHOWN IS NOW ALSO A BOUND ON WHAT IS HELD, WHICH IT
 * WAS NOT. The shape this replaced read every name into ONE ARRAY and SORTED it
 * to keep twenty, so the working set grew with the directory while the payload
 * did not -- and the sentence that stood here calling that cost LINEAR was
 * FALSE: a sort is N log N. MEASURED at a hundred thousand entries, which the
 * old sentence admitted it had never read: the array shape took 888 ms on bun
 * 1.3.13 and 1289 ms on deno 2.8.3, of which the SORT ALONE was 515 ms and 386
 * ms -- against 315 ms and 1977 ms for the streaming shape below (macOS/APFS,
 * mean of 5, machine under load). Only the names still standing in the first
 * twenty are kept, so what this function holds is twenty strings and one dirent
 * whatever the directory holds.
 *
 * A DIRECTORY IS STILL UNBOUNDED AND THE READ IS STILL NOT GUARDED, which is
 * unchanged and is still ACCEPTED rather than solved: the only guard available
 * would bound the read by TIME, and a highlight that answers differently
 * depending on how busy the machine was is a defect of its own.
 *
 * WHAT THE STREAMING SHAPE COSTS, MEASURED AND ACCEPTED RATHER THAN OMITTED:
 * deno pays per entry for iterating the handle, so the ordinary large directory
 * -- five thousand entries -- drains in about 127 ms where the array shape took
 * about 45 ms (bun: about 24 ms against about 18 ms, and at two hundred entries
 * neither runtime tells the two apart at all). That reading lands on the SAME
 * ORDER as the 135 ms this module's ruling was made on, so it is inside the
 * envelope already accepted, and what it buys is the working set above plus the
 * disappearance of a superlinear term at the tail.
 *
 * `opendir` RATHER THAN `readdir`, AND THE REASON IS THE WORKING SET. It was
 * `readdir` one commit ago on the ground that nothing here then iterated a
 * handle -- true of that implementation and no longer a reason, because the
 * handle is exactly what lets every name be COUNTED without every name being
 * KEPT. THE HANDLE IS RELEASED BY EXHAUSTING THE ITERATION, which is the release
 * the completion half beside this file already relies on for its own listing on
 * both runtimes. READ RATHER THAN TRUSTED TO COMPATIBILITY, because a descriptor
 * leaked once per highlight is a session that dies at the ulimit: 2000 resolves
 * of one directory leave the process's own open descriptor count unmoved, bun 7
 * -> 7 and deno 21 -> 21.
 *
 * THIS LOOP DOES NOT READ THE REQUEST'S ABORT, AND THAT IS A REFUSAL ON A
 * MEASUREMENT RATHER THAN AN OVERSIGHT -- it is the obvious next edit, so the
 * reading that forecloses it is written here. ON DENO A DIRECTORY THAT HAS BEEN
 * READ FROM AND NOT DRAINED NEVER GIVES ITS DESCRIPTOR BACK, and an explicit
 * `close()` does not change that: 500 listings abandoned after ONE entry take
 * the process from 21 open descriptors to 521, whether the loop is left by
 * `return`, by `break`, or by `break` followed by an awaited `close()`. Opening
 * and closing WITHOUT READING leaks nothing, and draining to the end leaks
 * nothing, so it is the partial read alone. Bun releases in every one of those
 * shapes, 5 -> 5. A highlight that stops a drain would therefore cost one
 * descriptor per cancelled highlight on one runtime, and a user arrowing through
 * a popup makes them by the keystroke: the session dies at the ulimit, which is
 * a worse failure than the drain this would have saved. WHAT IS SAVED INSTEAD is
 * the whole listing, at the seam BEFORE the handle is opened, which is where the
 * handler reads the signal.
 *
 * WHAT WOULD RETIRE THAT REFUSAL: deno releasing the descriptor of a partially
 * read directory. The reading above is the one to take again -- it is 500
 * iterations and a count of the process's own open descriptors -- and it is the
 * whole of what stands between this loop and a cancellation it could honour.
 *
 * SORTED BY CODE UNIT AND NEVER BY LOCALE, and the first reason is testability
 * rather than taste: a directory's own order is the filesystem's bookkeeping,
 * promised by nothing, so an unsorted block reads differently on two machines
 * and no whole-value assertion can be written against it at all. `localeCompare`
 * is refused for the reason the ISO date beside it is: this string is built by a
 * server and read by a person who may be anywhere.
 *
 * ORDINARY ENTRIES BEFORE HIDDEN ONES, WHICH IS THE BOUND'S DOING AND NOT
 * TASTE'S EITHER. `.` sorts before every alphanumeric, so under one flat
 * code-unit sort a directory holding as many dotfiles as the bound renders
 * NOTHING BUT DOTFILES -- MEASURED, and the directory it happens to is a project
 * root, which is the one a user is likeliest to highlight. The order key is
 * therefore (hidden, name) and the locale refusal is untouched: still code
 * units, still the same answer on every machine.
 *
 * MEMBERSHIP IS EXACTLY WHERE IT WAS. Hidden entries are still SHOWN and still
 * COUNTED -- the ruling they were shown under is about whether `.env` is in a
 * directory, which the completion half beside this file answers `yes` to, and
 * only the rendering order moved.
 *
 * THE COST IS THE MIRROR OF THE DEFECT AND IS ACCEPTED RATHER THAN SOLVED:
 * DOTFILES ARE NOW THE SYSTEMATICALLY TRUNCATED CLASS where ordinary entries
 * were, so a directory of thirty ordinary entries and five dotfiles renders no
 * dotfile at all. A user asking what is in a directory is asking about the
 * ordinary entries first, and the total still says the rest are there. RAISING
 * THE BOUND INSTEAD IS REFUSED: it starves at twenty-five dotfiles rather than
 * twenty, and it is paid for out of the payload this bound exists for.
 */
async function listingOf(path: string): Promise<DirectoryListing | undefined> {
  try {
    const names: string[] = [];
    let total = 0;
    for await (const entry of await opendir(path)) {
      total += 1;
      retain(names, entry.name);
    }
    return { names, total };
  } catch {
    // SWALLOWED HERE AND NOT AT THE HANDLER, which is the whole shape of this
    // subtask: the caller has a `stat` that succeeded, and a rejection reaching
    // it would cost the user that line as well as this listing. Every reason a
    // listing rejects lands here -- a directory the process may not read, and
    // the path that STOPPED BEING A DIRECTORY between the two syscalls, which
    // rejects ENOTDIR. THE SECOND IS NOT CONSTRUCTED BY ANY TEST: it needs a
    // race between two calls this handler makes back to back, and there is no
    // seam to open between them. It is the same catch either way.
    //
    // AND IT COVERS THE ITERATION AS WELL AS THE OPEN, which is new with the
    // handle: a directory removed while its entries are being read rejects
    // MID-DRAIN rather than at the call. A partial listing is thrown away rather
    // than rendered -- the count beside the names would otherwise be the count
    // of what was read before the failure, which is a number about nothing.
    return undefined;
  }
}

/**
 * Keeps `names` the entries that would be rendered FIRST, and no others.
 *
 * WHY THE ORDER IS MAINTAINED AS THE DIRECTORY IS READ rather than sorted at the
 * end: the sort is what made the working set the whole directory. Holding the
 * best `entriesShown` costs a comparison against the worst one KEPT for every
 * entry that does not beat it -- the ordinary case -- and at most that many
 * comparisons for one that does, so the cost really is linear in the entries, in
 * the sense the sentence this replaced claimed falsely of a sort.
 *
 * THE COMPARATOR IS THE ONE BELOW AND NOT A SECOND SPELLING OF THE ORDER: a
 * retention rule that disagreed with the render order would drop an entry that
 * belongs on the wire, and the disagreement would show only on directories big
 * enough to truncate.
 *
 * THE FULL LIST'S LAST NAME IS READ AS THE GATE, and it is `undefined` for
 * exactly as long as the list is short of the bound -- which is why that read is
 * the test for both `is it full` and `does this name beat the worst kept one`.
 */
function retain(names: string[], name: string): void {
  const worstKept = names[entriesShown - 1];
  if (worstKept !== undefined && byGroupThenName(name, worstKept) >= 0) {
    return;
  }
  const at = names.findIndex((kept) => byGroupThenName(name, kept) < 0);
  names.splice(at === -1 ? names.length : at, 0, name);
  if (names.length > entriesShown) {
    names.pop();
  }
}

/**
 * The render order: the ordinary entries, then the hidden ones, each group by
 * code unit.
 *
 * WRITTEN OUT RATHER THAN `localeCompare` OR A COLLATOR, per the refusal at the
 * caller, and `<` on two strings IS the code-unit comparison the default sort
 * performs -- so the second key is what the default sort was, not a spelling of
 * it that could differ.
 *
 * HIDDEN IS A LEADING `.` AND NOTHING ELSE, WHICH IS A DECISION AND NOT AN
 * APPROXIMATION. The other reading of hidden is a platform attribute -- Windows'
 * FILE_ATTRIBUTE_HIDDEN -- and reading it is a stat PER ENTRY, which is the
 * exact cost this package exists to refuse and refuses at popup time already. So
 * this stays decidable from the name a listing already handed back.
 *
 * ON THE NAME AS THE FILESYSTEM RETURNED IT, AND NEVER ON THE NAME AS IT
 * RENDERS, which is a live distinction rather than a hypothetical one: the
 * composer FLATTENS the characters a name may not render with, so a file called
 * `\n.env` renders with a leading replacement character and would read to a
 * person as hidden while being grouped as ordinary. Grouping on the rendered
 * string is refused anyway -- it would let an escaping decision made for the
 * BLOCK decide the ORDER, and the two answer different questions.
 */
function byGroupThenName(left: string, right: string): number {
  const leftHidden = left.startsWith(".");
  if (leftHidden !== right.startsWith(".")) {
    return leftHidden ? 1 : -1;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * How many of a directory's entries one answer RENDERS. A judgement value, and
 * the payload is what it is about: five thousand names are eighty-five thousand
 * characters in one response where the first twenty are three hundred, and a
 * popup is read by a person rather than parsed.
 *
 * A BOUND ON THE RENDERING AND NEVER ON THE READ, which is the distinction the
 * whole directory being drained rests on: the answer states how many entries
 * there really are, and it can only do that by having counted them.
 *
 * NOT EXPORTED, AS THE BATCH SIZE BESIDE IT IS NOT: what it decides is visible on
 * the wire -- as the number of names one resolved directory carries -- so a test
 * importing it would agree only with itself.
 */
const entriesShown = 20;
