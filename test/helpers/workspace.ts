import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * A throwaway workspace: manifests, configs and sources written out as CONTENT,
 * for the scripts that read a workspace to be driven against a state this
 * repository must never be in.
 *
 * NOT test/helpers/tree.ts, WHICH IS THE OTHER THROWAWAY BUILDER IN THIS
 * DIRECTORY AND ANSWERS A DIFFERENT QUESTION. That one builds a tree of EMPTY
 * entries because its subject is the SHAPE OF A PATH -- what a directory, a
 * file, or a link resolves to. This one's subject is what a package DECLARES,
 * so every entry has to carry bytes somebody parses. Merging them would give
 * one helper two reasons to change, and the first caller wanting an empty file
 * with a manifest's name would settle it in whichever direction that caller
 * happened to need.
 *
 * THE CALLER DISPOSES, WHICH IS WHY THIS RETURNS A BARE PATH. Two callers pass
 * the root to a spawned command and one passes it to a script that mutates it,
 * and each already owns a `finally` for the temp directory it made -- a
 * disposer here would be a second lifetime for them to keep in step with the
 * first.
 */
export function workspace(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-workspace-"));
  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  return root;
}
