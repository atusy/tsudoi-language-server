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
 * question that gets asked here or nowhere. THE SYSCALL ARGUMENT DOES NOT SETTLE
 * IT EITHER, AND NOT FOR THE REASON WRITTEN HERE BEFORE: `one opendir is the
 * same order as one stat` is false where it matters. MEASURED on five thousand
 * entries -- deno 2.8.3 pays 37 ms for the OPEN ALONE, before an entry is read,
 * against 0.088 ms for a stat, because its `opendir` reads the whole directory
 * synchronously (see the listing below); bun 1.3.13's open is lazy and costs
 * 0.004 ms against 0.053 ms. What settles it is the arithmetic per HIGHLIGHT
 * rather than per keystroke, below, and what the bound is really about is the
 * PAYLOAD: bytes in one response and lines in one popup.
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
 * tsudoi re-reads the abort and answers a cancelled request -32800 whatever the
 * handler produced, so an answer composed after a cancellation is DISCARDED with
 * or without this check, and nothing a config author writes here can change what
 * that client is told. AND IT IS NOT `AFTER THE HANDLER SETTLES`, WHICH IS WHAT
 * STOOD HERE AND IS WEAKER THAN THE PROPERTY: tsudoi RACES the handler against
 * the abort, so a handler that never settles at all is answered -32800 too. The
 * re-read happens after that race settles, and this handler cannot postpone it
 * by not returning. What nothing can take back afterwards is work already done.
 * A user arrowing through a popup supersedes their own highlight by the
 * keystroke, and every superseded one used to go on to open the directory and
 * read it to the end.
 *
 * IT IS READ HERE AND ONCE MORE INSIDE THE LISTING, AT TWO SEAMS AND NOT THREE,
 * and which third seam is refused is written at `listingOf` with the measurement
 * that refuses it. This one skips the open; the one below it skips the read of a
 * handle already open, where NO ENTRY HAS BEEN TAKEN YET. A cancellation
 * arriving after the drain has begun costs what it always did, because
 * abandoning a directory mid-read never gives its descriptor back on one of the
 * two runtimes -- and that is a property of the PARTIAL READ, which is exactly
 * what makes the two seams above safe.
 *
 * THE UNTOUCHED ITEM IS WHAT A RESOLVE CANCELLED AT THE FIRST OF THOSE TWO
 * SEAMS ANSWERS, AND ONLY THAT ONE -- the sentence that said `a cancelled
 * resolve` covered both and was false at the second. At the checkpoint above,
 * nothing this handler decided to state was finished, so the item the client
 * holds goes back exactly as it came, for the reason the gone-path case answers
 * it. At the seam inside the listing the stat is already SPENT: the answer
 * carries the directory's own `detail` line and a rebuilt block, and what it
 * lacks is the listing alone. Which is the same answer a directory that could
 * not be LISTED gets, and deliberately so -- the split between the two reads
 * exists precisely so that a listing that does not happen costs the listing and
 * nothing else, whether the reason is a permission, an ENOTDIR or a
 * cancellation.
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
      stats.isDirectory() ? await listingOf(path, context.signal) : undefined,
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
 * AND THE BOUND ON WHAT IS SHOWN IS NOW ALSO A BOUND ON WHAT THIS FUNCTION
 * HOLDS, WHICH IT WAS NOT -- ON WHAT THIS FUNCTION HOLDS AND NOTHING WIDER, per
 * the paragraph after this one. The shape this replaced read every name into ONE
 * ARRAY and SORTED it
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
 * THE PROCESS ALLOCATES A WHOLE DIRECTORY EITHER WAY, AND A SENTENCE THAT
 * STOPPED AT `twenty strings and one dirent` SAID OTHERWISE. But `MATERIALISE
 * BEHIND THE HANDLE` IS BUN'S SHAPE AND ONLY BUN'S, and the sentence that
 * claimed it of both was reading a resident set that cannot tell allocation
 * from retention -- which it said in its own parenthesis and then ignored.
 *
 * BUN RETAINS. Its `Dir` is a facade over `readdir` with file types and
 * materialises on the FIRST read: 30 MB at the open and 61 MB once ONE entry has
 * been taken, at a hundred thousand entries (macOS/APFS, warmed).
 *
 * DENO DOES NOT, AND THE ALLOCATION AT ITS OPEN IS TRANSIENT. Its `opendir`
 * calls `Deno.readDirSync(path)` and DISCARDS THE RESULT -- the source's own
 * comment on the line is `Throws if path is invalid` -- then builds `new
 * Dir(path)`, which stores the path and nothing else; the entries come later
 * from a SEPARATE async op the first `read()` starts. So the whole directory is
 * read and thrown away at the open, which is where the 37 ms and the 57 -> 119
 * MB come from and why they are real, and the handle holds none of it. READ IN
 * DENO'S OWN SOURCE and then measured two ways rather than argued: sixteen
 * unread handles on one hundred-thousand-entry directory leave `heapUsed`
 * unmoved at 6 MB after a forced collection, and their resident set plateaus at
 * 206 MB where sixteen retained copies would be near 600.
 *
 * (Resident set says where the ALLOCATION happens and never what stays, which is
 * exactly the distinction that made the earlier sentence wrong; `heapUsed` after
 * a forced collection, with the handles still alive, is what separates them.)
 *
 * SO WHAT THE STREAMING SHAPE RETIRED IS THIS FUNCTION'S OWN ARRAY AND THE
 * O(N log N) SORT OVER IT, AND NOTHING ELSE. IT DID NOT RETIRE THE PAYLOAD, and
 * a sentence here said it did: the array shape already rendered the first twenty
 * names and no more -- the bound on what is SHOWN is a commit older than the
 * streaming, and the two are separate decisions that this paragraph ran
 * together. What streaming changed is what is HELD while the names are counted.
 * NOR DID IT RETIRE THE RUNTIME'S OWN FULL READ, which no shape reachable from
 * here avoids: bun retains it behind the handle and deno pays for it and throws
 * it away, and neither is this function's to decline. `bufferSize` is
 * not the edit that would, though it is the one a reader reaches for: deno's
 * `opendir` defaults it to 32 and validates it, and its `Dir` then never uses it
 * for anything at all. THAT DEFAULT IS WHAT A CALL PASSING NO OPTIONS GETS,
 * WHICH IS THIS MODULE'S CALL, and it is the same validation the import comment
 * above measures REJECTING an explicit `{}` -- one rule, seen from its two
 * sides, rather than two readings that disagree.
 *
 * A DIRECTORY IS STILL UNBOUNDED AND THE READ IS STILL NOT GUARDED, which is
 * unchanged and is still ACCEPTED rather than solved: the only guard available
 * would bound the read by TIME, and a highlight that answers differently
 * depending on how busy the machine was is a defect of its own.
 *
 * WHAT THE STREAMING SHAPE COSTS, RE-TAKEN AT THIS BASE RATHER THAN INHERITED --
 * AND WHAT STOOD HERE CONTRADICTED ITSELF ABOUT BUN. It priced the ordinary
 * directory -- five thousand entries -- at `about 24 ms against about 18 ms` on
 * that runtime, which reads STREAMING SLOWER there, nine lines above a sentence
 * saying bun gains on both counts. BOTH COULD NOT STAND, AND THE ONE RETIRED BY
 * NAME IS THE PARENTHESIS: measured on bun 1.3.13 at five thousand entries by
 * `listing-shapes.ts`, the instrument this workspace tracks beside its other
 * scripts -- IN THE REPOSITORY AND NOT IN THIS PACKAGE, so a reader holding only
 * the installed artifact cannot re-run it, and a shipped comment may not name its
 * directory either. Streaming is 2.080 ms against 2.528 ms for the array shape it
 * replaced -- FASTER there by 0.460 ms, paired round by round
 * (0.356-0.659) against an instrument noise of 0.030 ms read off the same shape
 * run twice under two labels.
 *
 * DENO'S HALF IS RE-TAKEN IN THE SAME SESSION AND NOT CARRIED FORWARD, because
 * new numbers for one runtime beside inherited ones for the other is how a pair
 * like that one comes to disagree: 9.619 ms against 6.374 ms, so streaming costs
 * that runtime 3.261 ms at the ordinary size (2.266-4.532 paired, noise 0.069).
 * THE OTHER HALF OF THE OLD CLAUSE DOES NOT SURVIVE WHOLE EITHER -- `at two
 * hundred entries neither runtime tells the two apart` is true of BUN ALONE
 * here, where the difference is inside the instrument's noise; deno's is not
 * (0.195 ms against a noise of 0.002).
 *
 * WHAT THOSE NUMBERS ARE OF, since none of them means anything without it:
 * macOS/APFS, one volume, a warm cache, empty entries whose names are twelve
 * characters with one in thirty-seven hidden, arriving in the order that
 * filesystem hands them back; medians over fifteen rounds INTERLEAVED in one
 * process. The instrument cannot separate a runtime's cost from this
 * filesystem's, and says nothing about a cold cache or a network mount.
 *
 * WHAT IT BUYS IS NOT THE SAME TRADE ON THE TWO RUNTIMES, AND THE SENTENCE THAT
 * STOOD HERE NAMED ONLY THE BETTER HALF. On bun it buys both: this function's
 * working set, and a superlinear term gone at the tail -- 888 ms down to 315 ms
 * at a hundred thousand entries. ON DENO IT BUYS THE WORKING SET AND THE TAIL
 * GETS WORSE: 1289 ms up to 1977 ms at the same size, on top of the 45 -> 127 ms
 * at five thousand. Streaming is slower on deno at EVERY size these readings
 * cover, including the one this shape was adopted for, and the sort disappearing
 * does not buy it back there. What is bought on that runtime is that a highlight
 * on a directory of any size makes THIS function hold twenty names, and the
 * price is paid in time at the tail rather than saved there.
 *
 * `opendir` RATHER THAN `readdir`, AND THE REASON IS THIS FUNCTION'S WORKING
 * SET. It was `readdir` one commit ago on the ground that nothing here then
 * iterated a handle -- true of that implementation and no longer a reason,
 * because the handle is what lets every name be COUNTED without THIS FUNCTION
 * keeping every name. It does not stop the runtime beneath it from READING them
 * all -- nor, on bun, from keeping them -- which is measured above and is why
 * the reason is written this narrowly. THE HANDLE IS RELEASED BY EXHAUSTING THE ITERATION, which is the release
 * the completion half beside this file already relies on for its own listing on
 * both runtimes. READ RATHER THAN TRUSTED TO COMPATIBILITY, because a descriptor
 * leaked once per highlight is a session that dies at the ulimit: 2000 resolves
 * of one directory leave the process's own open descriptor count unmoved, bun 7
 * -> 7 and deno 21 -> 21.
 *
 * THE ABORT IS READ ONCE HERE AND NEVER INSIDE THE LOOP, AND THE LINE BETWEEN
 * THE TWO IS A MEASUREMENT RATHER THAN A JUDGEMENT: it is whether ANY ENTRY HAS
 * BEEN READ YET.
 *
 * THE SEAM ABOVE IS SAFE. Opening and closing a directory WITHOUT READING FROM
 * IT releases everything: 500 rounds leave the process's own open descriptor
 * count unmoved, bun 1.3.13 7 -> 7 and deno 2.8.3 21 -> 21. RE-READ FOR THIS
 * SHAPE rather than inherited from the reading below it, because the shape below
 * is the one that leaks and the two differ by one `read()`.
 *
 * THE SEAM INSIDE THE LOOP IS NOT. ON DENO A DIRECTORY THAT HAS BEEN READ FROM
 * AND NOT DRAINED NEVER GIVES ITS DESCRIPTOR BACK, and an explicit `close()`
 * does not change that: 500 listings abandoned after ONE entry take the process
 * from 21 to 521, whether the loop is left by `return`, by `break`, or by
 * `break` followed by an awaited `close()`. Draining to the end leaks nothing,
 * so it is the partial read alone; bun releases in every shape, 7 -> 7. One
 * descriptor per cancelled highlight, on a user arrowing through a popup, is a
 * session that dies at the ulimit -- a worse failure than the drain it saves.
 *
 * WHY THE TWO DIFFER, READ OFF DENO'S OWN `Dir` RATHER THAN INFERRED FROM THE
 * COUNTS: the descriptor is opened LAZILY, by the first `read()` and not by
 * `opendir`, so a handle nothing has read from has nothing to give back. Once it
 * exists, `Dir.close()` only marks the facade closed -- its comment says
 * directories need no closing -- and the inner iterator holding the descriptor
 * is dropped without being finished, so nothing closes it. That is also what
 * would RETIRE the refusal: deno closing that iterator. The reading to take
 * again is the one above, 500 abandoned listings against a count of the
 * process's own descriptors.
 *
 * WHAT THE SEAM ABOVE BUYS IS NOT THE SAME ON BOTH RUNTIMES, and the smaller
 * half is worth saying because a reader would assume the larger. On bun the
 * whole read is skipped: bun's `Dir` is a facade over `readdir` and materialises
 * the directory on the FIRST read, so a handle read from never costs anything.
 * On deno the directory has ALREADY been read once by then -- `opendir` calls
 * `Deno.readDirSync` to fail early on a path that is not a directory -- so what
 * is skipped there is the async drain, which is the expensive half on that
 * runtime anyway (about 127 ms at five thousand entries, above).
 *
 * AND WHAT CAN REACH THAT SEAM IS NARROWER THAN `a cancellation arriving while
 * the directory opens`, MEASURED AT A HUNDRED THOUSAND ENTRIES so a lazy open
 * and an eager one differ by most of a second: `await opendir` yields exactly
 * ONE MICROTASK turn and NO macrotask turn on either runtime -- deno spends
 * 777-859 ms INSIDE the call and a `setTimeout(0)` queued before it has still
 * not fired when the continuation runs; bun spends 0-5 ms and reads the same.
 * The promise is already fulfilled when it is awaited. So a cancellation the
 * EVENT LOOP delivers cannot land between the check above and this one at all;
 * what this check catches is an abort that becomes true inside that microtask
 * window, which is what the arm covering it constructs. KEPT RATHER THAN
 * REMOVED because it is one boolean read against a drain, and because the
 * measurement that makes it narrow is the runtimes' current shape rather than
 * anything the protocol promises.
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
async function listingOf(
  path: string,
  /**
   * The request's own abort, READ ONCE INSIDE HERE at the seam described above:
   * after the handle is in hand and before a single entry has been taken off it.
   */
  signal: AbortSignal,
): Promise<DirectoryListing | undefined> {
  try {
    const handle = await opendir(path);
    if (signal.aborted) {
      // CLOSED EXPLICITLY BECAUSE NOTHING ELSE WILL: the release this module
      // relies on is EXHAUSTING the iteration, and this handle is never
      // iterated. The close is inside the try for the reason the open is -- a
      // rejection here would cost the caller the `detail` it already holds.
      await handle.close();
      return undefined;
    }
    return await listingFrom(handle);
  } catch {
    // SWALLOWED HERE AND NOT AT THE HANDLER, which is the whole shape of this
    // subtask: the caller has a `stat` that succeeded, and a rejection reaching
    // it would cost the user that line as well as this listing. Every reason a
    // listing rejects lands here -- a directory the process may not read, and
    // the path that STOPPED BEING A DIRECTORY between the two syscalls, which
    // rejects ENOTDIR. BOTH ARE CONSTRUCTED BY TESTS NOW, AND THE SENTENCE THAT
    // STOOD HERE WAS WRONG ABOUT WHY THE SECOND COULD NOT BE: it said there was
    // no seam between the two calls. The SIGNAL READ between them is one -- it
    // is the caller's own object, so a getter runs arbitrary code at exactly
    // that point and swaps the directory for a file with no race and no timer.
    // WHERE THE REJECTION LANDS DIFFERS BY RUNTIME, MEASURED: deno 2.8.3 rejects
    // AT THE OPEN (`not a directory, opendir`), since it reads the directory
    // synchronously to fail early; bun 1.3.13's open is lazy and resolves, so
    // its rejection arrives at the FIRST READ (`not a directory, scandir`). It
    // is the same catch either way, which is what makes that difference cost
    // this module nothing.
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
 * The drain: every entry counted, and only the ones that would be rendered kept.
 *
 * A FUNCTION OF ITS OWN, AND WHAT SEPARATES IT FROM `listingOf` IS WHO CHOOSES
 * THE ORDER. Above this, the sequence is the FILESYSTEM'S, promised by nothing;
 * here it is a parameter. THE RETAIN GATE -- `is this name better than the worst
 * one I kept` -- IS ONLY REACHED ONCE THE KEPT LIST IS FULL, so what it decides
 * depends on the order names ARRIVE in, and an arm driving the handler could
 * only ever assert the premise it needed and hope the filesystem met it.
 * MEASURED, and it is why this seam exists rather than a preference: the arm
 * that did so passed its own premise on this machine and would have gone vacuous
 * on any runner whose directory order differed, while the mutant it was written
 * to catch -- the gate's comparison changed to `localeCompare` -- left the whole
 * package green before it was added.
 *
 * EXPORTED FOR THAT ARM AND FOR NOTHING ELSE, which the package index lists
 * beside the other names kept out of the published surface. It carries no bound
 * of its own and takes no options: `entriesShown` stays private below, so a test
 * driving this reads the count off what it gets back and still spells no number.
 *
 * `AsyncIterable` AND NOT `Dir`, because a `Dir` is the one thing a test cannot
 * construct without a directory -- which is the whole of what this parameter is
 * for. The entry shape is narrowed to the one field read.
 */
export async function listingFrom(
  entries: AsyncIterable<{ name: string }>,
): Promise<DirectoryListing> {
  const names: string[] = [];
  let total = 0;
  for await (const entry of entries) {
    total += 1;
    retain(names, entry.name);
  }
  return { names, total };
}

/**
 * Keeps `names` the entries that would be rendered FIRST, and no others.
 *
 * WHY THE ORDER IS MAINTAINED AS THE DIRECTORY IS READ rather than sorted at the
 * end: the sort is what made THIS MODULE'S working set the whole directory --
 * the runtime's own is the listing's business and is measured there. Holding the
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
