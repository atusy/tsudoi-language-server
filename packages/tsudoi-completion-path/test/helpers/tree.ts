import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The modification time every entry a fixture builds carries, so an assertion
 * over a rendered stat line is a value rather than a reading of the clock.
 *
 * A WHOLE SECOND, which is not fussiness: filesystems disagree about sub-second
 * precision, so a fractional stamp is a value the disk may legally hand back
 * rounded -- and an assertion comparing a rendered ISO string would then be
 * right on the machine it was written on.
 */
export const fixtureStamp = new Date("2001-02-03T04:05:06.000Z");

/**
 * A throwaway directory tree, WITH NO DOTFILE IN IT THAT A CALLER DID NOT ASK
 * FOR.
 *
 * NOTHING HERE STAGES A DOTFILE OF ITS OWN, so a caller that names one is
 * asserting something: a resolved directory's listing SHOWS hidden entries,
 * unfiltered, AFTER the ordinary ones, and an arm about that ruling must be able
 * to say which dotfiles its fixture holds.
 *
 * realpathSync is not cosmetic: on macOS the system temp directory lives under
 * /var, which IS a symlink to /private/var, and a child process started with
 * cwd there reports the resolved path. Comparing the two spellings is a
 * failure that looks like a logic error and is not one.
 *
 * THE SAME BUILDER EXISTS AT THE REPOSITORY ROOT AND THIS IS NOT A COPY MADE BY
 * OVERSIGHT. A member that reached up into the root's test helpers would stop
 * being checkable out on its own, and the file it reached for would become an
 * input to the type check that covers this package -- so a root helper's edit
 * would decide whether this package compiles. The two are free to diverge:
 * nothing here is shared with the root's copy but the idea.
 */
export interface Tree {
  readonly root: string;
  dispose(): void;
}

export function tree(
  entries: readonly string[],
  links: readonly (readonly [string, string])[] = [],
): Tree {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-paths-")));
  for (const entry of entries) {
    if (entry.endsWith("/")) {
      mkdirSync(join(root, entry), { recursive: true });
    } else {
      mkdirSync(join(root, entry, ".."), { recursive: true });
      writeFileSync(join(root, entry), "");
    }
  }
  for (const [name, target] of links) {
    symlinkSync(target, join(root, name));
  }
  // LAST, AND THE ORDER IS THE WHOLE OF IT: writing into a directory bumps that
  // directory's own mtime, so a stamp set as each entry is created is overwritten
  // by the next sibling and the tree ends up carrying the clock again -- SILENTLY,
  // since every file still carries the fixed value and only the directories lie.
  stampAll(root);
  return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
}

/**
 * The fixed stamp on every real entry beneath `directory`, and on it.
 *
 * A SYMLINK IS NEITHER STAMPED NOR DESCENDED. Stamping one FOLLOWS it, which
 * throws on the dangling link a caller stages deliberately; descending one
 * recurses forever on the `mirror -> .` link another stages. Nothing is lost:
 * what reads a stat here reads it THROUGH the link, and the target is stamped
 * wherever it really lives.
 */
function stampAll(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      stampAll(path);
    } else {
      utimesSync(path, fixtureStamp, fixtureStamp);
    }
  }
  utimesSync(directory, fixtureStamp, fixtureStamp);
}
