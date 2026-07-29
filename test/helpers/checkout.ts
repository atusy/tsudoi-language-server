import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
  // dist/ IS PART OF `what a runtime needs to start`, and it became so at
  // Sprint 25 rather than always having been: examples/completion-path.ts now
  // takes CompletionItemKind -- a VALUE -- from `@atusy/tsudoi/types`, and
  // package self-reference resolves that subpath through the exports map's
  // `import` arm to ./dist/types.js under both runtimes (measured, bun 1.3.13
  // and deno 2.9.2). A checkout without it fails at ERR_MODULE_NOT_FOUND on
  // dist/types.js while loading the config.
  //
  // IT IS NOT THE THING BEING HELD AWAY, which is what keeps these probes
  // honest: node_modules is, and it still is. Carrying dist/ here removes a
  // failure whose cause is this helper's staging from tests whose whole subject
  // is where a DEPENDENCY was resolved from -- two causes producing one
  // observation is the degeneracy that would make them measure nothing.
  //
  // Copied only when it exists, so a checkout that has never run a build is
  // staged as a checkout that has never run a build. The test that names that
  // condition and what to do about it is in test/package-shape.test.ts.
  const builtTypes = join(repoRoot, "dist");
  if (existsSync(builtTypes)) {
    cpSync(builtTypes, join(dir, "dist"), { recursive: true });
  }
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
