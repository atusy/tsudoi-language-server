import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Decisions that have to live in this package's package.json, asserted here
 * because THAT FILE CANNOT CARRY ITS OWN REASONS: JSON has no comments. A file
 * that carries a decision and a test that carries its reason is the arrangement
 * this project settled on; a prose note elsewhere would drift, and this fails
 * when someone violates it.
 */

/** This package's own manifest, read at test time -- never a copy that drifts. */
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as Record<string, unknown>;

/**
 * THE EXPORTS MAP HAS TWO ARMS AND DELIBERATELY NO SOURCE ARM, which is the one
 * decision here that protects something outside this package.
 *
 * tsudoi's own map carries a third arm, `default`, pointing into ./src -- and
 * copying that shape here would be actively harmful. The root tsconfig excludes
 * packages/, and `exclude` filters the root FILE GLOB ONLY: it does not stop a
 * file being pulled into the program by MODULE RESOLUTION.
 * examples/tsudoi.config.ts is in the root program and imports this package, so
 * a source arm here would give root tsc a route straight into src/hover.ts --
 * graded by a program that excludes this package on purpose, reporting success
 * for a member whose own resolution nobody checked.
 *
 * WHAT IT COSTS, so the next reader does not undo it looking for a quick fix:
 * everything resolves this package through dist/, so a checkout nothing has
 * built fails at `tsc --noEmit` naming it. Loud, and any other check clears it,
 * because both the test preload and the fifth Definition-of-Done check run one
 * shared builder in scripts/workspaces.ts. THAT LOUDNESS IS EXACTLY WHAT
 * TSUDOI'S THIRD ARM COSTS IT, MEASURED at sprint 58: with every dist/ removed,
 * the root check names THIS package and the other handler and says nothing at
 * all about tsudoi, whose subpaths the same run answers from source at exit 0.
 *
 * ASSERTED WHOLE RATHER THAN KEY BY KEY, as tsudoi's own map is: `exports` makes
 * every path not listed unreachable by bare specifier, so adding an entry is a
 * decision about what strangers may depend on and not a detail.
 */
test("the package publishes one entry point, built, with no arm reaching source", () => {
  expect(manifest.exports).toEqual({
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
  });
});

/**
 * `files` IS THE INSTRUCTION THAT KEEPS THE AMBIENT DECLARATION OUT, and the
 * argument written at src/wordnet.d.ts rests on it.
 *
 * `declare module "wordnet"` is a statement about a name in the GLOBAL type
 * space. Shipped, it would declare a third party's module on behalf of everyone
 * who installs this one -- including a project with its own declaration, or a
 * future `@types/wordnet` it would then collide with. Adding `src` here is the
 * obvious way to make a source map or a debugger work, and it is the edit this
 * line refuses.
 *
 * IT IS AN INSTRUCTION AND NOT A MEASUREMENT, which is the whole of what this
 * test can and cannot say: `files` describes what SHOULD be collected, and a
 * file the instruction happens to admit is collected whether anyone meant it to
 * be. MEASURED with a `dist/wordnet.d.ts` copied in by hand and prepack's clear
 * removed: the tarball carries the ambient statement and THIS TEST STAYS GREEN.
 * What reads the artifact is test/packed-members.test.ts at the repository root
 * -- the exact packed file list, and every packed declaration searched for the
 * statement -- and it lives there rather than beside this file because a member
 * test reaching root helpers becomes a new input to the fifth Definition-of-Done
 * check.
 */
test("only the built output ships, which is what keeps the ambient declaration internal", () => {
  expect(manifest.files).toEqual(["dist"]);
});

/**
 * TSUDOI IS A PEER, AND THE DICTIONARY IS NOT.
 *
 * A PEER BECAUSE THE FRAMEWORK IS THE HOST'S TO CHOOSE: this handler is loaded
 * into a server the consumer's own tsudoi is running, and a plain dependency
 * would let this package pin a range of its own and hand the consumer a second
 * copy their CLI never runs.
 *
 * NOT BECAUSE TWO COPIES WOULD BE INCOMPATIBLE, and the correction is kept here
 * because it is the reason a reader supplies for themselves: `MethodHandler` is a
 * plain function type alias, compared STRUCTURALLY. MEASURED with two copies of
 * tsudoi's dist/ installed at different versions -- the same version measures
 * nothing, tsc redirects the second by package id -- a handler typed against one
 * assigns to the other's `MethodHandler` and into `TsudoiConfig.methods`, exit 0.
 * The error naming two identical-looking types is what a VERSION SKEW produces,
 * and refusing to name a version is exactly what `peer` does about it.
 *
 * `wordnet` IS A REAL DEPENDENCY AND THE ASYMMETRY IS THE POINT: nothing shares
 * the dictionary with anyone, a consumer has no opinion about which copy is
 * used, and it is what makes this package installable ALONE. It is also why
 * tsudoi's own manifest may declare it nowhere, and why the suite stopped
 * symlinking it into every throwaway consumer -- an install now fetches it by
 * the route under test.
 *
 * `peerDependenciesMeta.optional` IS THE RESIDUAL AND IT IS NOT COMFORTABLE. It
 * reads as `this package works without tsudoi`, WHICH IS FALSE -- the handler
 * imports a value from it, so a consumer without tsudoi fails at load. What it
 * actually buys is that no installer goes looking in a registry for a package
 * NOTHING HAS PUBLISHED: MEASURED, without it `bun install` in this workspace
 * exits 1 on a 404 for @atusy/tsudoi-language-server, and so does a consumer's.
 * IT SHOULD BE DELETED THE DAY TSUDOI IS PUBLISHED, and this test is where that
 * sentence can be found, because package.json cannot hold it.
 */
test("tsudoi is a peer this package cannot install, and the dictionary is its own", () => {
  expect(manifest.peerDependencies).toEqual({ "@atusy/tsudoi-language-server": "*" });
  expect(manifest.peerDependenciesMeta).toEqual({
    "@atusy/tsudoi-language-server": { optional: true },
  });
  expect(manifest.dependencies).toEqual({ wordnet: "^2.0.0" });
});

/**
 * THE BUILD RUNS BEFORE THE TARBALL IS COLLECTED, so what ships is compiled from
 * the source in the checkout at that moment rather than from whatever dist/
 * happened to be lying there.
 *
 * INTO A CLEARED DIRECTORY, AND THAT IS NOT TIDINESS. `tsc` writes its outputs
 * and removes nothing, so a source file RENAMED OR DELETED leaves the artifact
 * it used to emit sitting in dist/ -- and `files: ["dist"]` collects it. What
 * that ships is not merely stale: a stray `dist/wordnet.d.ts` puts
 * `declare module "wordnet"` into the GLOBAL TYPE SPACE of every project that
 * installs this package. MEASURED both ways, with such a file copied in by hand:
 * without the clear the tarball carries it, with the clear the pack removes it
 * first, and the `files` assertion above is green in both.
 *
 * `rm -rf` AND NOT A BUILD FLAG, because tsc has none that clears an output
 * directory outside build mode, and a script in another file would lose the bare
 * -name resolution the next paragraph is about. It is run by bun, which is the
 * toolchain this repository documents.
 *
 * THE FRAMEWORK'S OWN prepack DOES NOT CLEAR, and the asymmetry holds ON THE
 * ROUTE UNDER TEST rather than everywhere: the suite's own installer packs it
 * from a FRESH staging directory, pinned entry by entry in
 * test/installed-specifier.test.ts. WHAT MATTERS HERE IS WHICH ENTRY IS ABSENT:
 * no dist/ is staged, so the framework's dist/ is built into an empty tree every
 * time. This package is packed FROM WHERE IT LIVES -- deliberately, so no probe
 * has to perturb a copy -- so its dist/ is the one that persists between packs.
 *
 * WHAT THAT LEAVES UNCOVERED, AND IT IS NOT A PACK AT THE REPOSITORY ROOT --
 * that root is private, declares no `files` and has no build of its own, so
 * packing there collects tracked files and reaches no dist/ at all. It is that
 * the framework is packed by hand from ITS OWN directory -- the command the
 * workspace's README gives for a manual runtime test -- and that pack carries
 * whatever dist/ is lying there, with the same staleness this clear removes
 * here. NOTHING IN THE SUITE
 * PACKS IT FROM A DIRECTORY WHERE A dist/ PERSISTS, which is the narrow thing
 * and not `the command is never run`: the README's pack step IS executed, as
 * every command block in that file is, but in a staged copy holding the
 * framework's package.json, src/, tsconfig.build.json and NO dist/ -- so a stale
 * artifact is never there to be carried, and the executed run cannot observe
 * this. Its src/ holds no `.d.ts` input to leak, which bounds the consequence to
 * a stale artifact rather than to a global declaration.
 *
 * BY BARE NAME, which is what takes the node_modules/.bin resolution: script
 * resolution puts node_modules/.bin ahead of PATH, so the compiler is the one
 * this workspace declares rather than whatever a machine happens to have. An
 * absolute path here would be someone's laptop.
 *
 * AND WHAT THIS SCRIPT MAY NOT GROW, REFUSED BY NAME IN BOTH SHAPES THE
 * PRECONDITION ARRIVES IN -- because `prepack` is where that edit would be made,
 * and package.json cannot hold the reason. The precondition is the obvious first
 * move once someone notices that this build reads the framework's SOURCE when
 * its artifact is absent.
 *
 * REFUSING THIS BUILD WHILE THE FRAMEWORK'S ARTIFACT IS ABSENT IS REFUSED ON A
 * POSITIVE MEASUREMENT AND NOT FOR WANT OF A SHOWN COST. It would force this
 * build onto the artifact and away from the framework's source -- and the source
 * is the CURRENT grade: with a framework type renamed in src/ alone, a handler
 * built against the stale artifact exits 0 while the same build against src/
 * exits 2 naming the missing member at TS2305. The precondition would therefore
 * SELECT THE GRADE THAT HIDES A DISAGREEMENT, which makes the product measurably
 * worse, and a precondition that does that is the strongest refusal this project
 * recognises. NOT `the source is the stricter grade`: the reverse edit -- a
 * signature this handler violates under the stale artifact and satisfies under
 * current source -- would put the strictness on the artifact's side. What is
 * measured is CURRENCY, and the reading with its conditions and its bounds is at
 * `prepareWorkspace` in scripts/workspaces.ts.
 *
 * `prepack` BUILDING THE FRAMEWORK FIRST IS REFUSED ON A GROUND INDEPENDENT OF
 * THAT MEASUREMENT, which is what keeps it refused if that record ever moves:
 * THIS MANIFEST TRAVELS TO A REGISTRY WITH ITS SCRIPTS. MEASURED on bun 1.3.13,
 * `bun pm pack --destination` run in this package at sprint 62's base: the
 * packed package.json carries `scripts.prepack` verbatim. So the edit would put
 * a CROSS-PACKAGE BUILD IN A PUBLISHED MANIFEST whose subject exists only in
 * this workspace, and a stranger packing an installed copy would have prepack
 * try to build a package that is not there -- the knowingly-false optional
 * peer's class one step worse, because it FAILS rather than merely misleads. It
 * would also encode this workspace's build order in a member's published
 * manifest, where `buildOrder` in scripts/workspaces.ts already derives it from
 * what the manifests declare.
 *
 * A DETECTOR IN `prepack` TAKES THAT SAME GROUND AS A BUILDER DOES, NAMED HERE
 * SO IT IS NOT PROPOSED AS THE CHEAP VERSION OF THE REFUSAL ABOVE: a script that
 * merely REFUSED to pack while the framework's artifact disagreed with the
 * framework's source still travels to a registry, and still names a package that
 * exists only in this workspace. It buys a stranger a pack that fails instead of
 * one that builds the wrong thing, which is the same import with a politer
 * message.
 *
 * SO THE STATE THAT LEAVES IS WRITTEN DOWN RATHER THAN CLOSED, AND THIS
 * PARAGRAPH IS WHERE PBI-76 ENDED. `bun pm pack` here runs THIS package's
 * prepack, which freshens THIS package's dist/ and NEVER the framework's -- so a
 * maintainer who edits the framework's src/ and then packs this package grades
 * its declarations against whatever was last built. MEASURED at base d2d6519,
 * bun 1.3.13 / tsc 7.0.2, with the handler type's RETURN narrowed in the
 * framework's src/ ALONE and its NAME kept: this build EXITS 0 against the
 * artifact that predates that edit and EXITS 2, TS2322 naming its own handler
 * function, against one rebuilt after it. AND IN THE STALE CELL `bun pm pack`
 * HERE EXITS 0 AND PRODUCES ITS TARBALL -- READ IN THIS PACKAGE AND NOT
 * INHERITED FROM THE OTHER HANDLER'S CELL, in a staged tree at base 1d37757 on
 * the same versions, because a pack cell taken in one package is a claim about
 * that package. So two green commands in an order nothing forbids ship
 * declarations graded against a shape the framework no longer has.
 * test/stale-framework-artifact.test.ts stages that disagreement over the OTHER
 * handler and not this one -- it names a single consumer and says so -- so the
 * arm is what keeps the SHAPE of this claim honest and is not a witness for this
 * package. THE BUILD CELL WAS READ HERE TOO, exit 0 against the stale artifact
 * and exit 2 with TS2322 at this package's own handler against a rebuilt one;
 * what is inherited from the other handler is nothing, and what is uncovered by
 * an arm is this package's half.
 *
 * AT ONE SHAPE IN ONE DIRECTION, WHICH BOUNDS THE SENTENCE ABOVE RATHER THAN
 * HEDGING IT: a widened return, a changed parameter type, a renamed property
 * inside an object type and a changed generic constraint are UNMEASURED, and the
 * EMITTED content of the green cell, any consumer-side compile of it and the
 * resolution trace are UNREAD. What is held is a narrowed return type, not `a
 * stale artifact hides a changed shape`.
 *
 * WHAT WOULD CLOSE THE ROUTE AND IS DECLINED ANYWAY, named so it is not
 * re-proposed as new: freshening from the WORKSPACE side -- a root-resident
 * wrapper, or a documented build-then-pack order -- ships nothing, since that
 * root is permanently private, and STILL LEAVES THE ROUTE OPEN: it adds a safe
 * way BESIDE the unsafe one, and a maintainer typing bare `bun pm pack` in this
 * directory bypasses it. The prerequisite this package's README already carries
 * is about the LINK a build needs, not about CURRENCY, and it stays that way --
 * it addresses an installing stranger, and the state above belongs to whoever is
 * editing the framework.
 *
 * AND NO ROUTE THIS SPRINT COULD NAME FIRES ON IT -- said at that width rather
 * than as `nothing fires`, because the warrant is two routes and not a census.
 * THE TWO ARE RULED OUT BY THEIR OWN ORDER: an arm under `bun test` runs after a
 * preload that has just rebuilt every package, and the fifth Definition-of-Done
 * check calls `prepareWorkspace` before it reads anything. Both stand after a
 * build; this state is before one. The thing that meets whoever produces it is
 * this paragraph.
 */
test("packing this package builds it first, into a cleared directory", () => {
  expect(manifest.scripts).toEqual({ prepack: "rm -rf dist && tsc -p tsconfig.build.json" });
});
