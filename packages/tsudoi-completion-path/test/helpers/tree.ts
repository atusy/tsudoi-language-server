import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A throwaway directory tree, WITH NO DOTFILES IN IT.
 *
 * Hidden-entry behaviour is UNRULED -- the stakeholder did not ask -- and a
 * fixture that happened to contain one would pin a decision nobody made. The
 * same rule is why nothing here is named `./x` or `../x`.
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
 * would decide whether this package compiles. Thirty-nine lines is what that
 * independence costs, and the two are free to diverge: nothing here is shared
 * with the root's copy but the idea.
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
