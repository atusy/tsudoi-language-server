/**
 * Filesystem detail for a config author's own `completionItem/resolve` handler,
 * paired with the completion half beside it: work too expensive to do for every
 * item on every keystroke -- a stat, and for a directory one listing -- is done
 * for the one item the user highlights.
 *
 * The item arrives FROM THE CLIENT, so the mark below it can be forged and the
 * path can be one nobody's completion offered. Nothing here validates it, and a
 * check would suggest the boundary can be closed; what keeps it safe is what
 * this handler DOES with the path. The line it will not cross is reading a
 * file's bytes -- running a command, or writing anything, is further still.
 */
import type { Stats } from "node:fs";
// `opendir` takes no options argument here: deno's node:fs rejects
// `opendir(path, {})` outright -- `The "options.bufferSize" property must be of
// type number. Received undefined` -- where bun accepts it.
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
 * No size for a directory: a directory's `size` is the size of its directory
 * ENTRY, which differs between filesystems for the same children and says
 * nothing about what is inside.
 *
 * The date is ISO 8601 in UTC and never a locale format: this string is built
 * by a server and read by a person who may be anywhere.
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
 * The answer REPLACES the item in the client's list, so returning anything but
 * the item itself drops the entry the user is looking at -- which is why an
 * item this package did not mark comes straight back.
 *
 * A copy rather than a mutation: the item is the request's params.
 *
 * The block is rebuilt and never appended to, for a file as well as for a
 * directory: what comes back is the client's own text, as forgeable as the mark
 * one field over.
 *
 * The two reads are separate on purpose: a path can be stat-ed and not listed
 * -- an ordinary posix permission -- and one `try` around both would answer the
 * bare item.
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
    // A path gone by the time the user highlights it is ordinary -- a popup
    // outlives a `git checkout` in another window -- and an escaped rejection
    // is answered -32603, taking away the popup being read. Nothing on stderr
    // either, or every stale item scrolled past would log a line.
    return item;
  }
  if (context.signal.aborted) {
    // The stat is spent and the listing is the unbounded read, so this is the
    // seam where a cancellation is worth anything at all. What it buys is the
    // work not being done, not a better answer: tsudoi answers a cancelled
    // request -32800 whatever this handler produced.
    return item;
  }
  return {
    ...item,
    detail: detailFor(stats),
    documentation: documentationFor(
      path,
      completedSource(item),
      // Read from the session per request, as the completion half reads it: the
      // block is composed here, so it is composed for the client that asked.
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
 * THE HANDLE IS ITERATED, AND COLLAPSING THIS INTO `(await readdir(path)).sort()`
 * IS THE EDIT TO REFUSE. It would make the whole directory this function's own
 * working set, and it would leave the cancellation check below nowhere to
 * stand: `readdir` has no point between the open and the first entry. What the
 * runtime beneath does with the directory is not this function's to decline --
 * bun keeps it behind the handle, deno reads it at the open and throws it away.
 *
 * THE ABORT IS READ ONCE HERE AND NEVER INSIDE THE DRAIN, and the line between
 * the two is whether any entry has been read yet. Opening and closing without
 * reading releases everything on both runtimes. On deno a directory that HAS
 * been read from and not drained never gives its descriptor back, and an
 * explicit `close()` does not change that -- `Dir.close()` marks the facade
 * closed and drops the inner iterator holding the descriptor. One descriptor
 * per cancelled highlight, on a user arrowing through a popup, is a session
 * that dies at the ulimit: a worse failure than the drain it saves.
 */
async function listingOf(path: string, signal: AbortSignal): Promise<DirectoryListing | undefined> {
  try {
    const handle = await opendir(path);
    if (signal.aborted) {
      // Closed explicitly because nothing else will: the release this module
      // relies on is exhausting the iteration, and this handle is never
      // iterated. The close is inside the try for the reason the open is -- a
      // rejection here would cost the caller the `detail` it already holds.
      await handle.close();
      return undefined;
    }
    return await listingFrom(handle);
  } catch {
    // Swallowed here and not at the caller, which holds a `stat` that
    // succeeded: a rejection reaching it would cost the user that line as well
    // as this listing. Every reason a listing fails lands here -- a directory
    // the process may not read; a path that stopped being a directory between
    // the two syscalls, which rejects at the OPEN on deno, where the directory
    // is read synchronously, and at the FIRST READ on bun, whose open is lazy;
    // and a directory removed mid-drain. A partial listing is thrown away
    // rather than rendered, since the count beside the names would otherwise be
    // the count of what was read before the failure.
    return undefined;
  }
}

/**
 * The drain: every entry counted, and only the ones that would be rendered kept.
 *
 * Exported for the arms that drive the retain gate directly, and kept out of
 * the published surface. It takes the sequence as a parameter because the
 * retain gate only fires once the kept list is full --
 * so what it decides depends on the order names ARRIVE in, and a directory's
 * order is the filesystem's, promised by nothing. `AsyncIterable` and not
 * `Dir`, because a `Dir` is the one thing a test cannot construct without a
 * directory.
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
 * The gate uses the render order's own comparator and not a second spelling of
 * it: a retention rule that disagreed with the render order would drop an entry
 * that belongs on the wire, and the disagreement would show only on directories
 * big enough to truncate.
 *
 * The order is maintained as the directory is read rather than sorted at the
 * end, which is what keeps this module's working set the bound rather than the
 * whole directory.
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
 * `localeCompare` and a collator are refused for the reason the ISO date is:
 * this string is built by a server and read by a person who may be anywhere.
 * `<` on two strings IS the code-unit comparison the default sort performs.
 *
 * ORDINARY BEFORE HIDDEN IS THE BOUND'S DOING. `.` sorts before
 * every alphanumeric, so under one flat code-unit sort a directory holding as
 * many dotfiles as the bound renders nothing but dotfiles -- and the directory
 * that happens to is a project root, the one a user is likeliest to highlight.
 * The mirror cost is accepted: dotfiles are the truncated class instead, and
 * the total still says the rest are there.
 *
 * Hidden is a leading `.` and nothing else. The other reading is a platform
 * attribute -- Windows' FILE_ATTRIBUTE_HIDDEN -- and reading it is a stat PER
 * ENTRY, which is the exact cost this package exists to refuse.
 */
function byGroupThenName(left: string, right: string): number {
  const leftHidden = left.startsWith(".");
  if (leftHidden !== right.startsWith(".")) {
    return leftHidden ? 1 : -1;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * How many of a directory's entries one answer RENDERS. A bound on the
 * rendering and never on the read: the answer states how many entries there
 * really are, and it can only do that by having counted them.
 *
 * The read itself is unbounded and that is accepted rather than solved. The
 * only guard available would bound it by TIME, and a highlight that answers
 * differently depending on how busy the machine was is a defect of its own.
 */
const entriesShown = 20;
