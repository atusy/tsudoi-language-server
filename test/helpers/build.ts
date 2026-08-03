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
 * WHO NEEDS THE FRAMEWORK'S dist/, RE-MEASURED AFTER IT BECAME A WORKSPACE
 * MEMBER -- AND THE ANSWER IS NOW `EVERYTHING`, WHERE IT USED TO BE `THE ARMS
 * THAT SPAWN DENO`. This paragraph used to record a split: the root tsconfig's
 * `paths` intercepted a self-referencing subpath before the exports map, so
 * bun's root-level loads reached ./src and only deno took the map to ./dist.
 * THAT MECHANISM IS GONE WITH THE MAPPING. MEASURED on this tree with dist/
 * present: a root-level import of `@atusy/tsudoi-language-server/deps/types`
 * resolves to packages/tsudoi-language-server/dist/deps/types.js under BUN and
 * under DENO alike, read off `import.meta.resolve` rather than inferred, and
 * tsc answers from dist/ too.
 *
 * SO REMOVING THIS PRELOAD NO LONGER COSTS ONLY THE DENO ARMS, which is the
 * half that decides whether it can ever be deleted: every route into this
 * package now goes through an artifact nothing else in the suite builds.
 *
 * A MARKER WRITTEN INTO dist/ STILL CANNOT DISCRIMINATE THIS UNDER `bun test`:
 * this preload rebuilds over it before any test module loads.
 *
 * A HANDLER PACKAGE'S dist/ IS NEEDED EVEN MORE ABSOLUTELY, and the difference
 * between the two is the whole of what the residue above turns on: a handler
 * ships dist/ and not src/ -- deno refuses to type-strip under node_modules --
 * so its `exports` map names NO SOURCE ARM at all, and nothing falls through.
 * The framework's map does end in one, which is why an absent dist/ is loud for
 * a handler and silent for it. The reasoning lives with the builder, in
 * scripts/workspaces.ts, because the fifth Definition-of-Done check runs the
 * same one.
 *
 * WHAT THIS PRELOAD THEREFORE DOES NOT COVER, stated because it is a real hole
 * rather than a theoretical one, AND RE-MEASURED because the move narrowed it:
 * `tsc --noEmit` on a checkout nothing has built reports TS2307 at
 * examples/tsudoi.config.ts -- naming THE TWO HANDLER PACKAGES AND NOT tsudoi.
 * A handler's exports map has no source arm, so it fails loudly; the framework's
 * map ends in `default: ./src/*.ts`, so the same run resolves ITS subpaths to
 * source and says nothing. The red is still loud and still names its own remedy,
 * and any other Definition-of-Done command clears it -- but half of what it used
 * to cover is now a silent fall-through this preload hides rather than fixes.
 *
 * AND THAT HALF IS STILL NOT COVERED HERE, WHICH IS THE OUTCOME OF SPRINT 58
 * RATHER THAN AN OMISSION LEFT STANDING. Deleting the framework's source arms
 * was measured and refused -- three arms in this suite reach the framework
 * through a probe whose tree carries no dist/ at all -- so what landed is a
 * refusal on the FIFTH check, `refuseSubpathsAnsweringFromSource` in
 * scripts/workspaces.ts, which runs AFTER a build and therefore covers an
 * artifact that survived one rather than a checkout nobody has built. The bare
 * fourth check is still the command with the hole, and nothing in this
 * repository owns its invocation.
 *
 * WHICH ARRANGEMENT OF dist/ THIS PRELOAD STANDS IN FRONT OF, TAKEN AS CELLS
 * BECAUSE THE COLOUR OF THAT CHECK REPORTS THE HANDLERS' ARTIFACTS AND NEVER
 * THIS PACKAGE'S. Root `tsc --noEmit`, tsc 7.0.2, base 6d1c85d -- read in the
 * real checkout with every dist/ MOVED ASIDE and restored, and in a staged copy
 * for the mixed states. Everything built: exit 0, silent. Nothing built: exit 1
 * naming THE TWO HANDLER PACKAGES at examples/tsudoi.config.ts. This package
 * built and the handlers not, which is what an interrupted build order leaves:
 * exit 1 with the same two. One handler missing: exit 1 with one. AND THIS
 * PACKAGE ABSENT WITH BOTH HANDLERS BUILT: EXIT 0 AND SILENT, every one of its
 * subpaths TRACED to packages/tsudoi-language-server/src/*.ts while each
 * handler answers from its own dist/. So a green fourth check is evidence about
 * the handlers, and about this package it is evidence of nothing.
 *
 * AND THAT SILENT CELL IS NOT HAND-MADE, which is the half this comment used to
 * leave a reader to assume: two documented commands in an order nothing forbids
 * leave the tree in it. The route is written beside the residue it belongs to,
 * in bunfig.toml, and what writes and what removes a dist/ is enumerated at
 * `prepareWorkspace` in scripts/workspaces.ts.
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
