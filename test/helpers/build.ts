import { fileURLToPath } from "node:url";
import { prepareWorkspace } from "../../scripts/workspaces.ts";

// import.meta.dir is Bun-only; the URL form is what every other helper uses.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * THE BUILD, RUN BEFORE ANY TEST FILE IS LOADED. bunfig.toml preloads this
 * module, and the reason it must run HERE rather than in a script is written
 * beside that preload.
 *
 * SYNCHRONOUS ON PURPOSE, AND THE REASON IS A MEMBER'S TEST RATHER THAN A ROOT
 * ONE. The workspace members' own test files statically import
 * `@atusy/tsudoi-language-server/deps/types` for its VALUES, and from inside a
 * member that specifier is answered through the exports map at
 * ./dist/deps/types.js. A build that had not finished when the module graph was
 * resolved would be no build at all.
 *
 * WHICH ARM NEEDS THIS PACKAGE'S dist/ IS NOT THE ONE THE SUBPATH SUGGESTS, and
 * the difference decides whether this preload can be deleted. tsconfig's `paths`
 * intercepts a self-referencing subpath BEFORE the exports map -- BUT ONLY WHERE
 * THAT tsconfig IS THE ONE NEAREST THE IMPORTING FILE, which is the half that
 * makes the paragraph above true. MEASURED, both from the repository root: a
 * probe under test/ resolves that subpath to ./src/deps/types.ts, and the same
 * probe inside a member's own test directory resolves it to
 * ./dist/deps/types.js, because a member's own tsconfig carries no mapping and
 * is forbidden one. So bun's ROOT
 * loads reach ./src and never ./dist; its MEMBER loads reach ./dist. What also
 * reaches ./dist/deps/types.js is the arms that SPAWN DENO -- deno has no
 * `paths` and takes the exports map -- so removing dist/ fails deno at config
 * load with ERR_MODULE_NOT_FOUND. A marker written into dist/ cannot
 * discriminate this under `bun test`: the preload rebuilds over it before any
 * test module loads.
 *
 * A WORKSPACE MEMBER'S dist/ IS NEEDED BY EVERYTHING INSTEAD, which is the half
 * that argument does not reach: a member ships dist/ and not src/, its `exports`
 * map names no source arm, and no `paths` mapping stands in for one -- so bun,
 * deno and tsc alike resolve a member ONLY through what this build writes. The
 * reasoning lives with the builder, in scripts/workspaces.ts, because the fifth
 * Definition-of-Done check runs the same one.
 *
 * WHAT THIS PRELOAD THEREFORE DOES NOT COVER, stated because it is a real hole
 * rather than a theoretical one: `tsc --noEmit` run on a checkout NOTHING HAS
 * BUILT reports TS2307 at examples/tsudoi.config.ts, naming the member. That is
 * LOUD and it names its own remedy, which is why it is accepted rather than
 * papered over with a mapping that would defeat the members' exclusion from that
 * very check. Any other Definition-of-Done command clears it.
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
 * throw stops the suite, `tsc --noEmit` reads THIS package's source rather than
 * its dist/, `bun pm pack` builds in its own stage -- so what stays exposed is
 * HAND-RUN PROBE SEQUENCES: break src, run something, revert, then read dist/.
 *
 * REMOVING dist/ BEFORE RETHROWING IS AUTHORISED AND NOT DONE, which turns a
 * silently wrong artifact into a loudly missing one and is this repository's
 * stated preference. NOTHING PREVENTS IT; it is declined here only because the
 * exposure is a manual sequence rather than any route the suite takes, and that
 * sentence is the whole of the reason.
 */
prepareWorkspace(repoRoot);
