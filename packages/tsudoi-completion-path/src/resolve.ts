/**
 * Filesystem detail for a config author's own `completionItem/resolve` handler,
 * paired with the completion half beside it: work too expensive to do for every
 * item on every keystroke -- a stat, and for a directory one listing -- is done
 * for the one item the user highlights.
 *
 * The path comes off the item's `data`, which arrives from the client and can
 * be forged. That is why this handler stats and lists and nothing more: it will
 * not read a file's bytes, and running a command or writing anything is further
 * still.
 */
import type { Stats } from "node:fs";
import { opendir, stat } from "node:fs/promises";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import {
  completedPath,
  completedSource,
  documentationFor,
  preferredFormat,
  type DirectoryListing,
} from "./completion.ts";

function detailFor(stats: Stats): string {
  const modified = `modified ${stats.mtime.toISOString()}`;
  return stats.isDirectory()
    ? `directory · ${modified}`
    : `file · ${String(stats.size)} bytes · ${modified}`;
}

/** A `completionItem/resolve` handler that fills in a path item's file detail. */
export const resolvePathStat: MethodHandler<"completionItem/resolve"> = async (context, item) => {
  const path = completedPath(item);
  if (path === undefined) {
    return item;
  }
  let stats: Stats;
  try {
    stats = await stat(path);
  } catch {
    return item;
  }
  if (context.signal.aborted) {
    return item;
  }
  // A copy: `item` is the request's params, so enriching it in place writes
  // into somebody else's object.
  return {
    ...item,
    detail: detailFor(stats),
    documentation: documentationFor(
      path,
      completedSource(item),
      preferredFormat(
        context.tsudoi.clientCapabilities.textDocument?.completion?.completionItem
          ?.documentationFormat,
      ),
      stats.isDirectory() ? await listingOf(path, context.signal) : undefined,
    ),
  };
};

/**
 * COLLAPSING THIS INTO `(await readdir(path)).sort()` IS THE EDIT TO REFUSE, and
 * nothing reddens if you make it: the answer is identical. It would make the
 * whole directory this function's own working set, and it would leave the
 * cancellation check below nowhere to stand, `readdir` having no point between
 * the open and the first entry.
 */
async function listingOf(path: string, signal: AbortSignal): Promise<DirectoryListing | undefined> {
  try {
    const handle = await opendir(path);
    if (signal.aborted) {
      // Read here and never inside the drain: on deno a directory that HAS been
      // read from and not drained never gives its descriptor back, and
      // `close()` does not change that -- it marks the facade closed and drops
      // the iterator holding the descriptor. Closed explicitly because nothing
      // else will: the release the drain below relies on is exhausting the
      // iteration, and this handle is never iterated.
      await handle.close();
      return undefined;
    }
    return await listingFrom(handle);
  } catch {
    return undefined;
  }
}

/** The drain: every entry counted, and only the ones that would be rendered kept. */
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

/** Keeps `names` the entries that would be rendered FIRST, and no others. */
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
 * Hidden is a leading `.` and nothing else. The other reading is a platform
 * attribute -- Windows' FILE_ATTRIBUTE_HIDDEN -- and reading it is a stat per
 * entry, the cost this package exists to refuse.
 */
function byGroupThenName(left: string, right: string): number {
  const leftHidden = left.startsWith(".");
  if (leftHidden !== right.startsWith(".")) {
    return leftHidden ? 1 : -1;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

const entriesShown = 20;
