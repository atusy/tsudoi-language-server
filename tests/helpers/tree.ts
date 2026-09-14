import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A throwaway directory tree, WITH NO DOTFILE IN IT THAT A CALLER DID NOT ASK
 * FOR.
 *
 * A RULING WHOSE WITNESS NO FIXTURE MAY HOLD IS A RULING NOTHING CAN FALSIFY:
 * hidden entries are ruled -- a resolved directory's listing SHOWS them,
 * unfiltered -- so a caller that names a dotfile is asserting something, and
 * nothing here adds one. The `./x` and `../x` rule is untouched.
 *
 * realpathSync is not cosmetic: on macOS the system temp directory lives under
 * /var, which IS a symlink to /private/var, and a child process started with
 * cwd there reports the resolved path. Comparing the two spellings is a
 * failure that looks like a logic error and is not one.
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
  return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
}
