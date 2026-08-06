import { fileURLToPath } from "node:url";
import { prepareWorkspace } from "../../scripts/workspaces.ts";

// import.meta.dir is Bun-only; the URL form works under both runtimes.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * THE BUILD, RUN BEFORE ANY TEST FILE IS LOADED. bunfig.toml preloads this
 * module, and the reason it must run HERE rather than in a script is written
 * beside that preload.
 *
 * TWO SUITES MUST NOT RUN AT ONCE ON ONE CHECKOUT, and it is written here
 * because this preload is the mechanism: every run REBUILDS every dist/ in
 * place, so a second run's pack or import reads a dist/ this one is midway
 * through replacing. MEASURED sprint 81, two full suites started together:
 * `bun pm pack (@atusy/tsudoi-hover-wordnet) failed with exit code 2 while
 * building the installed consumer`, TS2307 on both published subpaths, and
 * three arms down with it -- while the twin run beside it went green, which is
 * what makes the failure read as the tree's rather than the runner's. Alone on
 * the same commit: green, and in two thirds of the wall time.
 *
 * IT DOES NOT ALWAYS LOOK LIKE THAT, WHICH IS THE HALF THAT WILL COST SOMEONE
 * AN AFTERNOON. Three overlapping pairs were run and NO TWO FAILED ALIKE: the
 * pack above; a lone `the root type check resolves the published subpaths
 * through the exports map, to the built artifact`; and three spawn arms across
 * BOTH runtimes reporting `the server never answered initialize within 8000ms`
 * with the fake editor having read nothing. Only the first names dist/ out
 * loud. The shared tell is a SECOND RUN, not a symptom -- so check for one
 * before reading any red here as the tree's.
 *
 * AND IT IS NOT THE DEADLINE even though an arm times out among the casualties;
 * raising it would buy a slower version of the same corruption. Use a `git
 * worktree` for a concurrent run -- each gets its own dist/.
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
 * AND `WHAT EVERY TEST READS` IS NOT WHAT THIS PRELOAD WROTE, FOR TWO OF THE
 * ARTIFACTS IT WRITES. test/packed-members.test.ts performs a TOP-LEVEL AWAIT
 * over `packPackage` for each handler, so `bun pm pack` runs in the REAL member
 * during module load -- and a handler's `prepack` opens `rm -rf dist`. Both
 * handlers' dist/ is therefore deleted and recompiled BEFORE ANY TEST BODY RUNS,
 * and whatever this preload left in them is gone. MEASURED at base 488787c: a
 * rewrite of the emitted declarations added HERE leaves the full suite 938 pass /
 * 0 fail and the checkout's handler dist/ carrying the unrewritten text, while
 * the same rewrite in a handler's `prepack` is 933 pass / 5 fail. What it costs
 * the one arm that depends on the assumption is at
 * test/handler-declaration-specifier.test.ts.
 *
 * THAT PACK IS NOT THE ONLY ONE, IT IS THE ONE NOTHING CAN RUN BEFORE. Each
 * HANDLER's README carries its own `bun pm pack` and test/readme.test.ts
 * executes the pack command it carries, and `installConsumer` in
 * test/helpers/install.ts packs every handler root it is not asked to withhold,
 * from where it lives -- so the handlers are packed again from test bodies, by
 * more than one route. THE THIRD ROUTE ARRIVED FROM AN ENUMERATION RATHER THAN
 * FROM A RE-READ: the pair that stood here was written from memory and read as
 * the whole set. `EACH MEMBER'S` WAS THE SAME DEFECT ONE WORD WIDE -- THREE
 * MEMBERS, TWO READMEs: the framework member ships no README at all, and the
 * pack line a reader follows for IT lives in the checkout root's README, which
 * is not a member's document.
 * THE FRAMEWORK'S OWN dist/ IS A DIFFERENT CASE and not a third instance: its
 * `prepack` is `tsc -p tsconfig.build.json` with no clear in front of it, so a
 * pack of it REWRITES IN PLACE rather than replacing the directory.
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
 * fourth check is still the command with the hole -- and `nothing owns its
 * invocation` is qualified rather than repeated, because one thing does:
 * scripts/definition-of-done.ts spawns `tsc --noEmit` from the dashboard's list,
 * AFTER the first check has built. The invocation nobody owns is the BARE,
 * PRE-BUILD one, which is the only one the hole is about.
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
 * the prediction is written first. The BUILDING routes are covered -- this
 * throw stops the suite, `bun pm pack` builds in its own stage -- so what
 * stays exposed is HAND-RUN PROBE SEQUENCES: break src, run something, revert,
 * then read dist/.
 *
 * THE tsc CLAUSE THAT USED TO STAND IN THAT LIST IS FALSE AND IS SUPERSEDED
 * HERE, because the refusal below rests on it. It read `tsc --noEmit` reads
 * THIS package's source RATHER THAN its dist/ -- true while the deleted `paths`
 * mapping answered every subpath at ./src/*.ts, and false since the move.
 * MEASURED at sprint 63 on the real tree: root `tsc --noEmit --listFiles` lists
 * FOUR of this package's dist/*.d.ts -- the four published subpaths -- beside
 * nine of its src/*.ts, which arrive by relative import from this suite. THE
 * COMPILER READS THE ARTIFACT. What spares it is `skipLibCheck`, measured both
 * ways: a SYNTAX error injected into dist/types.d.ts fails the root check with
 * TS1110, while a TYPE error in the same file leaves it at exit 0.
 *
 * SO THE CONCLUSION SURVIVES ON A MECHANISM NOBODY HAD WRITTEN DOWN, which is
 * a narrower warrant than the sentence it replaces and is stated as such. AND
 * WHAT THE TWO READINGS LEAVE OPEN IS NAMED RATHER THAN CLAIMED: those four
 * files are the subpaths the root check RESOLVES there, which
 * test/package-shape.test.ts asserts off `--traceResolution` over EVERY arm of
 * the exports map. So a freshly wrong dist/ that still parses is what the root
 * check grades this checkout's importers AGAINST. Whether that can move a red
 * to a green here is unread.
 *
 * REMOVING dist/ BEFORE RETHROWING IS AUTHORISED AND NOT DONE, which turns a
 * silently wrong artifact into a loudly missing one and is this repository's
 * stated preference. NOTHING PREVENTS IT; it is declined here because the
 * exposure the throw leaves is a manual sequence, and because no automated
 * route BUILDS on the wrong artifact -- not because none reads it, which the
 * paragraph above measures it doing.
 */
prepareWorkspace(repoRoot);
