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
  // trailing-whitespace modules by relative specifier, so a checkout carrying
  // one file fails at import with a message about a missing module -- which
  // reads exactly like the dependency-resolution failure these tests exist to
  // observe, and would be the wrong diagnosis.
  //
  // THE HANDLERS THE CONFIG NAMES BY PACKAGE SPECIFIER ARE NOT COPIED AND MUST
  // NOT BE, which is a different absence from a missing entry: they resolve out
  // of node_modules, which is the thing this helper HOLDS AWAY on purpose. A
  // checkout with no node_modules therefore fails at those specifiers, and that
  // failure IS what the probes here read.
  cpSync(join(repoRoot, "examples"), join(dir, "examples"), { recursive: true });
  // dist/ IS PART OF `what a runtime needs to start`, which is not obvious from
  // the staging above and is why the witness is named. THE WITNESS IS A
  // DEPENDENCY VALUE ON A SIBLING SUBPATH:
  // examples/diagnostic-trailing-whitespace.ts takes
  // `DiagnosticSeverity` -- a VALUE -- from `@atusy/tsudoi-language-server/deps/types`, and
  // package self-reference resolves that subpath through the exports map's
  // `import` arm to ./dist/deps/types.js. A checkout without dist/ fails while
  // loading the config, with a resolve error NAMING `@atusy/tsudoi-language-server/deps/types`.
  //
  // MEASURED rather than reasoned, because the conclusion and the reason move
  // independently here and only running tells you which is which. Staging no
  // dist/ at all reddens two tests in test/resolution.test.ts. Deleting
  // dist/deps/types.js from an otherwise complete dist/ reproduces the failure
  // above by name, under both runtimes.
  //
  // AND THE TWO RUNTIMES DISAGREE ABOUT dist/types.js, WHICH A ONE-RUNTIME
  // MEASUREMENT REPORTS AS `NOT NEEDED`. With
  // dist/types.js deleted and the rest of dist/ present, bun starts the server
  // at EXIT 0 and silent; deno EXITS 1 with ERR_MODULE_NOT_FOUND naming
  // dist/types.js, imported from examples/diagnostic-trailing-whitespace.ts:17.
  // THE MECHANISM IS IMPORT ELISION AND NOT RESOLUTION: that line reads
  // `import { type MethodHandler } from "@atusy/tsudoi-language-server/types"`, whose bindings
  // are all type-only, and bun drops the statement while deno keeps and loads
  // it. So a source line that looks type-only is a real runtime dependency on
  // one of the two runtimes this project verifies -- which is exactly why this
  // helper stages dist/ WHOLE rather than the parts one runtime happens to
  // reach.
  //
  // AND THE WITNESS IS ON `@atusy/tsudoi-language-server/deps/types`, NEVER ON
  // `@atusy/tsudoi-language-server/types`: tsudoi's own subpath is TYPE-ONLY, so it carries no
  // value an example could call, and naming it here would put a real conclusion
  // on a witness that does not exist.
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
