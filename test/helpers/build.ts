import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// import.meta.dir is Bun-only; the URL form is what every other helper uses.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * THE BUILD, RUN BEFORE ANY TEST FILE IS LOADED. bunfig.toml preloads this
 * module, and the reason it must run HERE rather than in a script is written
 * beside that preload.
 *
 * SYNCHRONOUS ON PURPOSE. `examples/completion-path.ts` imports
 * `@atusy/tsudoi/types`, which from inside this package resolves through the
 * exports map to ./dist/types.js, and test/completion-path.test.ts imports that
 * example STATICALLY. A build that had not finished when the module graph was
 * resolved would be no build at all.
 *
 * The compiler is reached through node_modules/.bin rather than by bare name,
 * because nothing here is a package script and PATH is not this repo's to
 * choose; test/package-shape.test.ts pins that the binary there is the version
 * this repo declares.
 *
 * stdio is inherited so a broken src/ prints tsc's own diagnostics, and the
 * throw on a non-zero exit is deliberate: a suite that ran on the previous
 * dist/ after a failed build is exactly the staleness this file removes.
 */
execFileSync(join(repoRoot, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.build.json"], {
  cwd: repoRoot,
  stdio: "inherit",
});
