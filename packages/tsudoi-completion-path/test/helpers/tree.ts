import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A throwaway directory tree, WITH NO DOTFILE IN IT THAT A CALLER DID NOT ASK
 * FOR.
 *
 * THE BLANKET REFUSAL IS NARROWED RATHER THAN DROPPED, AND THE REASON IT STOOD
 * HAS EXPIRED RATHER THAN BEEN OVERRULED. It said hidden-entry behaviour was
 * UNRULED, so a fixture that HAPPENED to hold one would pin a decision nobody
 * made. It is ruled now -- a resolved directory's listing SHOWS them,
 * unfiltered, AFTER the ordinary entries -- and a ruling whose witness no
 * fixture may hold is a ruling nothing can falsify. So a caller that names a
 * dotfile is asserting something, and bulk staging here adds none. The `./x`
 * and `../x` rule is untouched.
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
 * would decide whether this package compiles. That independence costs one small
 * file, NAMED RATHER THAN COUNTED because a line count falsifies itself the day
 * a line is added, and the two are free to diverge: nothing here is shared with
 * the root's copy but the idea.
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
