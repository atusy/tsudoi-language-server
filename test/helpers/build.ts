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
 * `@atusy/tsudoi-language-server/deps/types` for its VALUES, and
 * test/completion-path.test.ts imports that example STATICALLY. A build that
 * had not finished when the module graph was resolved would be no build at all.
 *
 * WHICH ARM NEEDS dist/ IS NOT THE ONE THE SUBPATH SUGGESTS, and the difference
 * decides whether this preload can be deleted. tsconfig's `paths` intercepts a
 * self-referencing subpath BEFORE the exports map, so bun's own loads reach
 * ./src and never ./dist. What reaches ./dist/deps/types.js is the arms that
 * SPAWN DENO -- deno has no `paths` and takes the exports map -- so removing
 * dist/ leaves bun green and fails deno at config load with ERR_MODULE_NOT_FOUND.
 * A marker written into dist/ cannot discriminate this under `bun test`: the
 * preload rebuilds over it before any test module loads.
 *
 * The compiler is reached through node_modules/.bin rather than by bare name,
 * because nothing here is a package script and PATH is not this repo's to
 * choose; test/package-shape.test.ts pins that the binary there is the version
 * this repo declares.
 *
 * stdio is inherited so a broken src/ prints tsc's own diagnostics, and the
 * throw on a non-zero exit is deliberate: a suite that ran on the previous
 * dist/ after a failed build is exactly the staleness this file removes.
 *
 * WHAT THE THROW DOES NOT RULE OUT, and it is not staleness: TSC WRITES dist/
 * AND THEN EXITS NON-ZERO, so a failed build leaves dist/ BUILT FROM BROKEN
 * SOURCE. The artifact is not stale -- it is fresh, newly written and wrong --
 * so `rebuild before believing it` is no remedy at all, because the rebuild is
 * what produced it. The throw protects the SUITE and says nothing about what is
 * left on disk.
 *
 * MEASURED, AND IT POISONS PROBES: a construction built on a freshly wrong
 * dist/ reads exit 0 against a prediction of 1, and that is caught only when
 * the prediction is written first. Every AUTOMATED route is covered -- this
 * throw stops the suite, `tsc --noEmit` reads source rather than dist/, `bun pm
 * pack` builds in its own stage -- so what stays exposed is HAND-RUN PROBE
 * SEQUENCES: break src, run something, revert, then read dist/.
 *
 * REMOVING dist/ BEFORE RETHROWING IS AUTHORISED AND NOT DONE, which turns a
 * silently wrong artifact into a loudly missing one and is this repository's
 * stated preference. NOTHING PREVENTS IT; it is declined here only because the
 * exposure is a manual sequence rather than any route the suite takes, and that
 * sentence is the whole of the reason.
 */
execFileSync(join(repoRoot, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.build.json"], {
  cwd: repoRoot,
  stdio: "inherit",
});
