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
 * copying that shape here would be actively harmful. THE REASON THIS PARAGRAPH
 * USED TO GIVE NAMED A MECHANISM THAT NO LONGER EXISTS: it said the root
 * tsconfig excludes packages/ so that its `paths` mapping cannot answer for a
 * member, and there is no mapping anywhere in that repository now -- the
 * framework is a workspace member like this one, and a refusal in
 * scripts/workspaces.ts keeps members from writing one. The exclusion is still
 * right and its reason is now the plain one: `exclude` filters the root FILE
 * GLOB ONLY and does not stop a file being pulled into the program by MODULE
 * RESOLUTION. examples/tsudoi.config.ts is in the root program and imports this
 * package, so a source arm here would give root tsc a route straight into
 * src/completion.ts -- graded by a program that excludes this package on
 * purpose, reporting success for a member whose own resolution nobody checked.
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
 * needs it -- `types: ["node"]` in tsconfig.build.json, without which every
 * `node:` specifier is TS2591 -- and a consumer does not receive types from us
 * at all: what ships is a declaration that imports `node:path`, which their own
 * toolchain answers or skips. Declaring it a runtime dependency would install a
 * types package into projects that never type-check.
 *
 * `peerDependenciesMeta.optional` IS THE RESIDUAL AND IT IS NOT COMFORTABLE. It
 * reads as `this package works without tsudoi`, WHICH IS FALSE -- both handlers
 * are typed against it and one imports a value from it, so a consumer without
 * tsudoi fails at config load. What it actually buys is that no installer goes
 * looking in a registry for a package NOTHING HAS PUBLISHED: without it
 * `bun install` in this workspace exits 1 on a 404 for
 * @atusy/tsudoi-language-server, and so does a consumer's. IT SHOULD BE DELETED
 * THE DAY TSUDOI IS PUBLISHED, and what makes that unmissable is a root test
 * tying the reversal to the README section that states the premise.
 */
test("tsudoi is a peer this package cannot install, and nothing else is a dependency", () => {
  expect(manifest.peerDependencies).toEqual({ "@atusy/tsudoi-language-server": "*" });
  expect(manifest.peerDependenciesMeta).toEqual({
    "@atusy/tsudoi-language-server": { optional: true },
  });
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
 * root is the only thing that would see it.
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
 */
test("packing this package builds it first, into a cleared directory", () => {
  expect(manifest.scripts).toEqual({ prepack: "rm -rf dist && tsc -p tsconfig.build.json" });
});
