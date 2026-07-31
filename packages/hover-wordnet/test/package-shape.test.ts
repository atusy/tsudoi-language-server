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
 * copying that shape here would be actively harmful. The root tsconfig EXCLUDES
 * packages/ so that its `paths` mapping cannot answer for a member, but
 * `exclude` filters the root FILE GLOB ONLY: it does not stop a file being
 * pulled into the program by MODULE RESOLUTION. examples/tsudoi.config.ts is in
 * the root program and imports this package, so a source arm would give root tsc
 * a route straight into src/hover.ts -- whose own tsudoi import the root's
 * mapping would then answer, reporting success for a member whose resolution
 * nobody checked. That is precisely the hazard the exclusion exists to make
 * unconstructible.
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
 * `files` IS WHAT KEEPS THE AMBIENT DECLARATION OUT OF THE TARBALL, and the
 * argument written at src/wordnet.d.ts rests entirely on this line.
 *
 * `declare module "wordnet"` is a statement about a name in the GLOBAL type
 * space. Shipped, it would declare a third party's module on behalf of everyone
 * who installs this one -- including a project with its own declaration, or a
 * future `@types/wordnet` it would then collide with. Declaration emit does not
 * copy a `.d.ts` INPUT into the output, so dist/ never grows one; this is the
 * other half, and it is the half an edit would reach for first, since adding
 * `src` here is the obvious way to make a source map or a debugger work.
 */
test("only the built output ships, which is what keeps the ambient declaration internal", () => {
  expect(manifest.files).toEqual(["dist"]);
});

/**
 * TSUDOI IS A PEER, AND THE DICTIONARY IS NOT.
 *
 * A PEER BECAUSE THE CONFIG AND THE HANDLER MUST SHARE ONE TSUDOI: two installed
 * copies are two `MethodHandler` declarations, and a config annotated against one
 * cannot be given a handler typed against the other. A plain dependency would
 * permit exactly that, silently, and the error it produced would name two types
 * that look identical.
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
 * BY BARE NAME, which is what takes the node_modules/.bin resolution: script
 * resolution puts node_modules/.bin ahead of PATH, so the compiler is the one
 * this workspace declares rather than whatever a machine happens to have. An
 * absolute path here would be someone's laptop.
 */
test("packing this package builds it first", () => {
  expect(manifest.scripts).toEqual({ prepack: "tsc -p tsconfig.build.json" });
});
