import { cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "./spawn.ts";

/**
 * A copy of everything a runtime needs to start the server -- and nothing it
 * needs to RESOLVE the dependency. node_modules is added and removed by the
 * caller, which is the only way to observe where a dependency actually came
 * from: inside the repo, node_modules is always present, so a green handshake
 * there is equally consistent with resolution via node_modules, via a global
 * cache, or via an import map.
 *
 * A copy rather than symlinks, deliberately: a runtime resolves a symlinked
 * source to its real path and would then walk up into the repo's own
 * node_modules, which is precisely the thing being held away.
 */
export interface IsolatedCheckout {
  readonly dir: string;
  /** Points node_modules at the repo's, so the checkout can resolve again. */
  linkNodeModules(): void;
  /** Writes a file relative to the checkout root, e.g. a deno.json. */
  write(path: string, contents: string): void;
  dispose(): void;
}

export function isolatedCheckout(): IsolatedCheckout {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-checkout-"));
  cpSync(join(repoRoot, "package.json"), join(dir, "package.json"));
  cpSync(join(repoRoot, "src"), join(dir, "src"), { recursive: true });
  // The WHOLE examples directory, not the config alone: the config imports its
  // path-completion module by relative specifier, so a checkout carrying one
  // file fails at import with a message about a missing module -- which reads
  // exactly like the dependency-resolution failure these tests exist to
  // observe, and would be the wrong diagnosis.
  cpSync(join(repoRoot, "examples"), join(dir, "examples"), { recursive: true });
  const nodeModules = join(dir, "node_modules");
  return {
    dir,
    linkNodeModules: (): void => {
      symlinkSync(join(repoRoot, "node_modules"), nodeModules, "dir");
    },
    write: (path: string, contents: string): void => {
      writeFileSync(join(dir, path), contents);
    },
    dispose: (): void => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
