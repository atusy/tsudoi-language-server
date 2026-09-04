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
 * a source arm here would give root tsc a route straight into src/completion.ts
 * -- graded by a program that excludes this package on purpose, reporting
 * success for a member whose own resolution nobody checked.
 *
 * WHAT TSUDOI'S THIRD ARM COSTS IT, MEASURED at sprint 58: with every dist/
 * removed, the root check names THIS package and the other handler and says
 * nothing at all about tsudoi, whose subpaths the same run answers from source
 * at exit 0.
 *
 * ONE ENTRY AND NOT ONE PER HANDLER, which is the shape decision worth the
 * sentence: `.` alone means every name a consumer may use is chosen in
 * src/index.ts, so making something public is an edit to a file that carries
 * reasons rather than to a JSON map that cannot. A `./resolve` arm would also
 * suggest the two halves are separable, and they are not -- the resolve handler
 * reads a mark the completion handler writes, and tsudoi refuses a config that
 * supplies the resolve method with no completion handler beside it.
 *
 * WHAT IT COSTS, so the next reader does not undo it looking for a quick fix:
 * everything resolves this package through dist/, so a checkout nothing has
 * built fails at `tsc --noEmit` naming it. Loud, and any other check clears it,
 * because both the test preload and the fifth Definition-of-Done check run one
 * shared builder in scripts/workspaces.ts.
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
 * `files` IS WHAT KEEPS src/ OUT, AND THE REASON IS NOT TIDINESS.
 *
 * deno refuses to type-strip under node_modules, so a `.ts` file shipped here
 * could not be run by half this project's supported runtimes even if something
 * reached it. Shipping source would also make every internal name in
 * src/completion.ts readable as though it were a promise, when the promise is
 * exactly the two names src/index.ts re-exports.
 *
 * IT IS AN INSTRUCTION AND NOT A MEASUREMENT, which is the whole of what this
 * test can and cannot say: `files` describes what SHOULD be collected, and a
 * file the instruction happens to admit is collected whether anyone meant it to
 * be. What reads the artifact is test/packed-members.test.ts at the repository
 * root -- the exact packed file list, off the tarball -- and it lives there
 * rather than beside this file because a member test reaching root helpers
 * becomes a new input to the fifth Definition-of-Done check.
 */
test("only the built output ships, so no consumer receives a line of source", () => {
  expect(manifest.files).toEqual(["dist"]);
});

/**
 * TSUDOI IS A PEER, AND NOTHING ELSE IS A DEPENDENCY AT ALL.
 *
 * A PEER BECAUSE THE FRAMEWORK IS THE HOST'S TO CHOOSE: these handlers are
 * loaded into a server the consumer's own tsudoi is running, and a plain
 * dependency would let this package pin a range of its own and hand the consumer
 * a second copy their CLI never runs.
 *
 * NOT BECAUSE TWO COPIES WOULD BE INCOMPATIBLE, and the correction is kept here
 * because it is the reason a reader supplies for themselves: `MethodHandler` is a
 * plain function type alias, compared STRUCTURALLY. The error naming two
 * identical-looking types is what a VERSION SKEW produces, and refusing to name
 * a version is exactly what `peer` does about it.
 *
 * NO RUNTIME DEPENDENCY OF ITS OWN, AND THAT IS A PROPERTY WORTH PINNING RATHER
 * THAN AN ABSENCE. Everything these handlers reach for is a `node:` builtin --
 * `node:fs/promises` to list a directory and to stat one entry, `node:path` to
 * split a fragment, `node:url` to read a document's uri, `node:process` for a
 * default working directory. So installing this package adds NOTHING to a
 * consumer's tree beyond itself, which is the opposite of the sibling handler
 * that brings a 27MB dictionary. An entry appearing here is a real change to
 * what a stranger downloads and must be a decision.
 *
 * `@types/node` IS A DEVDEPENDENCY AND THE ASYMMETRY IS DELIBERATE. The build
 * needs it for the implementation's `node:` imports, but the public declarations
 * express the small structural path and stat surfaces they expose. A consumer
 * therefore does not need a Node ambient type package merely to use this handler.
 *
 * THE VERSION IS EXACT DURING ALPHA. One number identifies the package set the
 * repository tested together; a later alpha updates the framework, handler and
 * workspace declaration in one release change.
 */
test("tsudoi is a peer this package cannot install, and nothing else is a dependency", () => {
  expect(manifest.peerDependencies).toEqual({
    "@atusy/tsudoi-language-server": "0.1.0-alpha.0",
  });
  expect(manifest.peerDependenciesMeta).toBeUndefined();
  expect(manifest.dependencies).toBeUndefined();
  expect(manifest.devDependencies).toEqual({
    "@types/node": "^24.0.0",
    "vscode-languageserver-textdocument": "^1.0.12",
  });
});

/**
 * THE BUILD RUNS BEFORE THE TARBALL IS COLLECTED, so what ships is compiled from
 * the source in the checkout at that moment rather than from whatever dist/
 * happened to be lying there.
 *
 * INTO A CLEARED DIRECTORY, AND THAT IS NOT TIDINESS. `tsc` writes its outputs
 * and removes nothing, so a source file RENAMED OR DELETED leaves the artifact
 * it used to emit sitting in dist/ -- and `files: ["dist"]` collects it. A
 * stray here would publish a module this package no longer has, under a name
 * src/index.ts no longer mentions, and the packed file list at the repository
 * root is what would see it.
 *
 * `rm -rf` AND NOT A BUILD FLAG, because tsc has none that clears an output
 * directory outside build mode, and a script in another file would lose the bare
 * -name resolution the next paragraph is about. It is run by bun, which is the
 * toolchain this repository documents.
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
 * test/stale-framework-artifact.test.ts stages that pair.
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
