import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { exampleSources, type InstalledConsumer, installConsumer } from "./helpers/install.ts";
import { initializeParams } from "./helpers/lsp.ts";
import { importsAndUses, publicProtocolNames } from "./helpers/published-names.ts";
import { extractQuickstart, QUICKSTART_STEPS, readReadme } from "./helpers/readme.ts";
import { declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot, runCommand } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

/**
 * WHAT THIS FILE ADDS THAT `tsc --noEmit` DOES NOT.
 *
 * The repo's own type check never reaches the exports map: tsconfig's `paths`
 * intercepts `@atusy/tsudoi-language-server/types` and answers it straight at
 * src/types.ts, which is the same ruling test/package-shape.test.ts records
 * from the map's side. What a stranger receives is the COMPILED
 * dist/types.d.ts, and nothing checked the artifacts against that until this
 * file. Everything here is therefore BORN GREEN by design: the
 * snippet and the example already compile, MEASURED. What this file supplies is
 * the CHECK and not a fix, so all of its value is in its controls.
 *
 * Every control that CAN fail is a test below. Exactly one is a comment
 * instead, and only because the property it records is FORECLOSED by the
 * staging design rather than assertable -- see the stays-green note further
 * down.
 *
 * THE DIVERGENCE THIS FILE WATCHES FOR HAS NO SUBJECT AT PRESENT, noted so the
 * next reader does not go hunting for one: src/types.ts re-exports nothing at
 * all, so neither built file carries a relative specifier. THE HAZARD IS REAL
 * ANYWAY -- declaration emit does not rewrite such a specifier, so a runtime
 * re-export from ./workspace.ts would put `./workspace.js` in dist/types.js
 * beside `./workspace.ts` in dist/types.d.ts, naming a file the tarball does
 * not ship. MEASURED on the built artifact rather than reasoned from the source.
 */

/** The config the README tells a reader to write, read out of the README. */
function readmeSnippet(): string {
  // The count is enforced inside extractQuickstart and it throws before
  // returning: an extractor that finds nothing would satisfy every assertion
  // in this file vacuously.
  const steps = extractQuickstart(readReadme(), QUICKSTART_STEPS);
  const written = steps.find((step) => step.kind === "write");
  if (written === undefined) {
    throw new Error("README quickstart: no step writes a config file");
  }
  return written.contents;
}

/** A type error that names itself, for asserting WHICH artifact reddened. */
function withTypeError(source: string): string {
  return `${source}\nconst __probe: number = "not a number";\n`;
}

let consumer: InstalledConsumer;

beforeAll(async () => {
  consumer = await installConsumer();
});

afterAll(() => {
  consumer.dispose();
});

test("the README's snippet type-checks against what ships", async () => {
  const result = await consumer.typeCheck({ "readme-snippet.ts": readmeSnippet() });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

test("the example type-checks against what ships", async () => {
  const result = await consumer.typeCheck(exampleSources());

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

// ONE typeCheck() call over several sources means a single failure may not
// identify its source. Both directions are asserted because masking is
// directional: an error in the file tsc reaches first can hide the second.
test("a type error in the snippet reddens the snippet, not the example", async () => {
  const result = await consumer.typeCheck({
    "readme-snippet.ts": withTypeError(readmeSnippet()),
    ...exampleSources(),
  });

  expect(result.code).not.toBe(0);
  expect(result.output).toContain("readme-snippet.ts");
  expect(result.output).not.toContain("diagnostic-trailing-whitespace.ts");
});

test("a type error in the example reddens the example, not the snippet", async () => {
  const sources = exampleSources();
  const result = await consumer.typeCheck({
    "readme-snippet.ts": readmeSnippet(),
    ...sources,
    "diagnostic-trailing-whitespace.ts": withTypeError(
      sources["diagnostic-trailing-whitespace.ts"] ?? "",
    ),
  });

  expect(result.code).not.toBe(0);
  expect(result.output).toContain("diagnostic-trailing-whitespace.ts");
  expect(result.output).not.toContain("readme-snippet.ts");
});

/**
 * THE CONTROL THAT MAKES THIS FILE MORE THAN A SECOND TYPE CHECK, and the pair
 * is the whole point. Perturbing the PUBLISHED types must redden the probe WHILE the repo's
 * own `tsc --noEmit` stays green -- without the stays-green half this file is
 * `checked again` wearing the words `checked through the published arm`.
 */
test("perturbing the published types reddens the probe while tsc --noEmit stays green", async () => {
  // THE LEVER IS THE `types` CONDITION, not an edit to src/types.ts: that file
  // is consumed in full by src/, so any change to it fails the build instead of
  // shipping a different surface. Dropping the condition leaves tsc to fall
  // back to `default` -> ./src/types.ts, WHICH THE PACKAGE DOES NOT SHIP
  // (`files` is dist/ alone) -- so a consumer loses the types while this repo,
  // which does have src/, is unaffected. That asymmetry IS the pair.
  const perturbed = await installConsumer({
    editPackage: (packageJson) => {
      const exports = packageJson.exports as Record<string, Record<string, string>>;
      // BOTH published arms, measured: dropping `types` alone still resolves,
      // because tsc follows `import` -> dist/types.js and picks up the sibling
      // dist/types.d.ts. Only `default` is left, and it points into src/.
      delete exports["./types"]?.types;
      delete exports["./types"]?.import;
    },
  });
  try {
    const result = await perturbed.typeCheck({ "readme-snippet.ts": readmeSnippet() });

    expect(result.code).not.toBe(0);
    expect(result.output).toContain("@atusy/tsudoi-language-server/types");
  } finally {
    perturbed.dispose();
  }
});

/**
 * The converse: a check pointed at IN-REPO sources cannot observe a change to
 * what ships, so satisfying it proves nothing this file is for.
 */
test("the in-repo arm cannot observe what the published arm checks", async () => {
  const viaRepoSources = await typeCheckProbe({ "probe.ts": readmeSnippet() });

  expect(viaRepoSources.code).toBe(0);
});

/**
 * WHAT A SUBPATH EXPORTS AT RUN TIME, READ OFF THE INSTALLED PACKAGE.
 *
 * An ES module namespace object carries EXACTLY the runtime exports, so a
 * type-only export is invisible here BY CONSTRUCTION rather than by our
 * filtering it out -- which is what makes this the one instrument that can tell
 * a declaration file from the module beside it. The two subpath tests below
 * SHARE this reader rather than each carrying their own: a second mechanism over
 * the same subject is how a suite grows two instruments that can disagree.
 *
 * THE LOAD CHECK IS IN HERE AND NOT IN A CALLER, and it is what makes an EMPTY
 * result mean something: a module that throws at load also produces no keys, and
 * without this the caller would report only that stdout did not parse. The whole
 * failure goes on the assertion line for the same reason.
 */
async function runtimeKeysOf(specifier: string, probe: string): Promise<string[]> {
  consumer.write(
    probe,
    `import * as values from "${specifier}";\nconsole.log(JSON.stringify(Object.keys(values)));\n`,
  );

  const result = await runCommand(`bun run ./${probe}`, consumer.dir);

  expect(`${specifier}: ${String(result.code)} ${result.stderr}`).toBe(`${specifier}: 0 `);

  return JSON.parse(result.stdout.trim()) as string[];
}

/**
 * TSUDOI'S OWN SUBPATH CARRIES NO RUNTIME VALUE, AND THIS IS THE GUARANTEE
 * RATHER THAN A CONFIRMATION TAKEN ONCE.
 *
 * `@atusy/tsudoi-language-server/types` IS TYPES, AND THAT IS A RULING RATHER THAN AN
 * OBSERVATION: a types module exporting a runtime function is incoherent, so
 * this subpath may not grow one. IT IS A TEST AND NOT A COMMENT because a
 * comment cannot redden -- the same claim written as prose in
 * test/package-shape.test.ts and in test/installed-runtime.test.ts goes false
 * with nothing anywhere to say so.
 *
 * MEASURED ON THE ARTIFACT A STRANGER RECEIVES, not grepped over src/. A name
 * grep is what missed this class before: it cannot see interface MEMBERS and it
 * cannot see a RE-EXPORT line, so it reports an empty diff over a surface that
 * grew both.
 *
 * ITS PAIR IS IN THE SAME MEASUREMENT, per the absence-pairing rule, because
 * this asserts an ABSENCE: `[]` alone cannot tell `type-only` from `the module
 * failed to load` from `I read the wrong module`. The sibling subpath goes
 * through the SAME reader in the same test and must show keys.
 *
 * PER SUBPATH AND NEVER PER PACKAGE: `@atusy/tsudoi-language-server/deps/types` re-exports the
 * dependency's data values ON PURPOSE, so `this package exports no values` would
 * be false. Only tsudoi's OWN subpath makes this claim, and the pair below is
 * also what stops the claim being quietly widened.
 *
 * THE SIBLING IS ASSERTED NON-EMPTY AND NOT BY SET, which is the test above's
 * job: the same set pinned twice is two instruments that can disagree, where
 * `this reader sees keys when there are keys` is the only thing this test needs
 * from it.
 */
test("tsudoi's own subpath exports nothing at run time, where its dependency subpath exports values", async () => {
  const ours = await runtimeKeysOf("@atusy/tsudoi-language-server/types", "own-surface.js");
  const dependency = await runtimeKeysOf(
    "@atusy/tsudoi-language-server/deps/types",
    "sibling-surface.js",
  );

  expect(ours).toEqual([]);
  expect(dependency.length).toBeGreaterThan(0);
});

/**
 * THE VALUE ARM, and no type check can stand in for it.
 *
 * `CompletionItemKind` and `DiagnosticSeverity` are namespaces of const members
 * -- VALUES -- so a config that reaches for either needs the published
 * dist/types.js to really re-export it at runtime.
 * dist/types.d.ts and dist/types.js are separate files emitted from one source,
 * and a `export type` re-export produces a perfect declaration beside a module
 * that exports nothing: every type-check assertion in this file would stay
 * green while a config author got `undefined` at their first completion.
 *
 * Object.keys of the namespace object is therefore the assertion, and the reader
 * that takes it is shared with the type-only test above -- INCLUDING ITS LOAD
 * CHECK, which written out again here would be the same claim in the same words
 * in two places.
 *
 * THE SET IS DERIVED FROM THE DEPENDENCY, NOT LISTED HERE, and it must be
 * EXACTLY what vscode-languageserver-types exports at run time. src/deps/types.ts
 * satisfies that with a star, so incompleteness is structural rather than
 * checked -- what this test now defends is the star itself: replace it with an
 * explicit list and this reddens the day upstream adds a name.
 */
test("the published module re-exports every LSP data value, and nothing else", async () => {
  const published = await runtimeKeysOf(
    "@atusy/tsudoi-language-server/deps/types",
    "value-surface.js",
  );

  const upstream = Object.keys(await import("vscode-languageserver-types")).sort();
  expect(published.sort()).toEqual(upstream);
});

/**
 * THE TYPE ARM, which the value arm above cannot give: all but CompletionItemKind
 * and DiagnosticSeverity are types and leave no runtime trace at all.
 *
 * THROUGH THE INSTALLED CONSUMER, NOT typeCheckProbe, and that is not
 * interchangeable: the in-repo arm resolves this subpath against sources a
 * stranger never receives, which the test above at
 * `the in-repo arm cannot observe what the published arm checks` measures
 * directly.
 *
 * The list and the source it builds live in test/helpers/published-names.ts,
 * which carries the reason for each -- including why every name is USED rather
 * than merely imported.
 */
test("every published protocol name type-checks from the installed copy", async () => {
  const result = await consumer.typeCheck({
    "published-names.ts": importsAndUses(
      publicProtocolNames,
      "@atusy/tsudoi-language-server/deps/protocol",
    ),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * A NAME ON THE SUBPATH THAT IS NOT A PROTOCOL NAME AT ALL -- and this
 * test exists because that distinction leaves it otherwise UNDEFENDED.
 *
 * `TextDocument` is not in `publicProtocolNames` and must not be: that list's
 * doc block says it holds the PROTOCOL names the subpath re-exports, and this
 * one comes from vscode-languageserver-textdocument. So the published-names probe
 * above and the value probe below both skip it, and without this it would ship
 * with no published-surface coverage at all.
 *
 * BORN GREEN, DECLARED: what this test supplies is the CHECK and not the
 * property -- the name is reachable from this subpath either way -- which is
 * the same honesty this file states about itself at the top. Its evidence is
 * the perturbation, RUN: removing the export from
 * src/types.ts reddens THIS and the identity test below, and leaves the
 * published-names probe and the value probe green.
 *
 * WHAT IT DOES NOT SEE is WHICH TextDocument arrived -- MEASURED, and it is the
 * reason the identity test exists: pointing src/types.ts at
 * vscode-languageserver-protocol's DEPRECATED twin leaves this test green,
 * `tsc --noEmit` at 0, and every test in the suite passing except that one.
 */
test("TextDocument type-checks from the installed copy, though it is not one of the protocol names", async () => {
  const result = await consumer.typeCheck({
    "text-document.ts": importsAndUses(
      ["TextDocument"],
      "@atusy/tsudoi-language-server/deps/textdocument",
    ),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE SURFACE IS UPSTREAM'S TYPE SET, and this is the test that says so. It
 * names a type NO example uses and NO line of src/types.ts mentions, so it
 * passes only because `export type *` carries it.
 *
 * It replaces an assertion that the same name was NOT reachable, which was the
 * negative control for a curated surface. That boundary moved: it now runs
 * between TYPES and VALUES rather than between chosen names and withheld ones,
 * and the test below is where the restraint lives.
 */
test("a protocol type no example names is reachable from the subpath", async () => {
  const result = await consumer.typeCheck({
    "unpublished-name.ts": importsAndUses(
      ["DefinitionParams"],
      "@atusy/tsudoi-language-server/deps/protocol",
    ),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * WHAT `export type *` MUST NOT CARRY, and the reason the star is type-only.
 *
 * The dependency exports 93 Request and Notification constants as VALUES, for
 * methods tsudoi does not implement -- plus `createProtocolConnection`, which
 * would let a config build its own connection and bypass tsudoi entirely. A
 * surface carrying them would advertise capabilities the server does not have.
 *
 * TS1362 is the diagnostic that says a name arrived through `export type`, so
 * asserting on it distinguishes `not exported at all` from `exported as a type`.
 * Turning the star into a plain `export *` reddens this and nothing else.
 */
test("a protocol request constant is not reachable as a value from the subpath", async () => {
  const result = await consumer.typeCheck({
    "request-constant.ts":
      'import { CodeActionRequest } from "@atusy/tsudoi-language-server/deps/protocol";\nconsole.log(CodeActionRequest);\n',
  });

  expect(result.code).not.toBe(0);
  expect(result.output).toContain("CodeActionRequest");
});

/**
 * THE CONTROL FOR THE NAME ITSELF: `DefinitionParams` has to be a real export of
 * the dependency, or the reachability asserted above is the reachability of a
 * name nobody ever had.
 *
 * Its own test rather than a second assertion, because it is a different hazard:
 * a renamed-away protocol symbol and a broken re-export are not the same mistake
 * and must not share a first failure.
 */
test("the unpublished name the probe asks for is one the dependency really exports", async () => {
  const result = await consumer.typeCheck({
    "unpublished-name-exists.ts": importsAndUses(
      ["DefinitionParams"],
      "vscode-languageserver-protocol",
    ),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * A PROBE THAT OBSERVES DECLARATION IDENTITY RATHER THAN SHAPE, which is the
 * one thing an assignability check cannot do.
 *
 * It AUGMENTS upstream's own `TextDocument` interface with a marker member and
 * then reads that member off whatever `from` calls `TextDocument`. Declaration
 * merging reaches ONE declaration, so the member is visible through the subject
 * only if the subject IS that declaration. A structural twin -- however exact --
 * never sees it.
 *
 * THE FIRST IMPORT IS LOAD-BEARING AND IS NOT DECORATION. A module augmentation
 * whose target is not already in the program fails with TS2664 `module cannot be
 * found` INSTEAD OF the marker diagnostic -- measured, on a subject that did not
 * import the package -- and that failure looks like a missing dependency rather
 * than like a wrong type. Anchoring the module in the program leaves TS2339 on
 * the marker as the only way this can fail.
 *
 * WHAT IT WOULD ALSO REDDEN FOR, disclosed because it is a different fault: a
 * tree holding TWO copies of vscode-languageserver-textdocument, where the
 * augmentation lands on one and the subject resolves the other. The consumers
 * here install a single tarball into an empty project, so there is one copy.
 */
function identityProbe(from: string): string {
  return [
    'import type { TextDocument as Anchored } from "vscode-languageserver-textdocument";',
    `import type { TextDocument } from "${from}";`,
    'declare module "vscode-languageserver-textdocument" {',
    "  interface TextDocument {",
    '    readonly __tsudoiUpstreamMarker: "upstream";',
    "  }",
    "}",
    "export type Anchor = Anchored;",
    "declare const document: TextDocument;",
    'export const marker: "upstream" = document.__tsudoiUpstreamMarker;',
  ].join("\n");
}

/** The weaker instrument, for showing what it fails to see. */
function assignabilityProbe(from: string): string {
  return [
    `import type { TextDocument as Subject } from "${from}";`,
    'import type { TextDocument as Upstream } from "vscode-languageserver-textdocument";',
    "declare const subject: Subject;",
    "declare const upstream: Upstream;",
    "export const asUpstream: Upstream = subject;",
    "export const asSubject: Subject = upstream;",
  ].join("\n");
}

/**
 * TSUDOI'S OWN INTERFACE, WIDENED BY HAND to everything PBI-31 promises -- the
 * increment someone would ship if they read criterion 1 and stopped there.
 */
const handWrittenSuperset = [
  'import type { Position, Range } from "vscode-languageserver-textdocument";',
  "export interface TextDocument {",
  "  readonly uri: string;",
  "  readonly languageId: string;",
  "  readonly version: number;",
  "  getText(range?: Range): string;",
  "  positionAt(offset: number): Position;",
  "  offsetAt(position: Position): number;",
  "  readonly lineCount: number;",
  "}",
].join("\n");

/**
 * THE OTHER WRONG ANSWER, AND THE ONE NOBODY WOULD SUSPECT: it is REAL, it is
 * one line, it adds NO dependency, and it is deprecated.
 * `vscode-languageserver-protocol` re-exports `vscode-languageserver-types`
 * WHOLE, and that package still carries a `TextDocument` whose own doc comment
 * reads `@deprecated Use the text document from the new
 * vscode-languageserver-textdocument package` -- with the same seven members and
 * no `update`. src/types.ts already imports from that specifier, so this is the
 * edit a future tidy-up would make while believing it removed a dependency.
 */
const deprecatedProtocolTwin =
  'export type { TextDocument } from "vscode-languageserver-protocol";';

/**
 * CRITERION 2, and it is IDENTITY rather than assignability for a reason the
 * test below MEASURES rather than states.
 *
 * WHAT IT CATCHES THAT NOTHING ELSE DOES, measured on this tree rather than
 * argued: with src/types.ts re-exporting `vscode-languageserver-protocol`'s
 * DEPRECATED TextDocument instead -- a one-line edit that adds no dependency --
 * `tsc --noEmit` exits 0, the type arm above exits 0, the value arm is
 * unchanged, and THIS IS THE ONLY TEST IN THE WHOLE SUITE THAT FAILS. Named
 * rather than counted on purpose: a count of what fails is true when it is
 * written and false as soon as a test joins this file.
 */
test("the TextDocument the published subpath exports is upstream's own declaration", async () => {
  const result = await consumer.typeCheck({
    "identity.ts": identityProbe("@atusy/tsudoi-language-server/deps/textdocument"),
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * WHAT MAKES THE TEST ABOVE WORTH RUNNING, and it FAILS FIRST if the instrument
 * is ever weakened to a shape check -- which is the whole hazard, since a shape
 * check reads exactly like coverage and sees none of this.
 *
 * Both subjects satisfy every structural promise PBI-31 makes. Both would pass
 * a `getText(range) is callable` test, an `assignable to upstream` test, and a
 * strict-superset comparison. Neither delivers the maintenance the PBI exists
 * for: one is code this project would then own forever, the other is a type its
 * own authors deprecated in favour of the package tsudoi now depends on.
 *
 * Its own test rather than assertions appended to the one above, because
 * `tsudoi adopted upstream` and `this probe can tell adoption from resemblance`
 * are different hazards and must not share a first failure.
 */
test("the identity probe reddens on both near-misses where mutual assignability sees nothing", async () => {
  const clonedIdentity = await consumer.typeCheck({
    "clone.ts": handWrittenSuperset,
    "clone-identity.ts": identityProbe("./clone.ts"),
  });
  expect(clonedIdentity.code).not.toBe(0);
  expect(clonedIdentity.output).toContain("__tsudoiUpstreamMarker");

  const clonedAssignability = await consumer.typeCheck({
    "clone.ts": handWrittenSuperset,
    "clone-assignability.ts": assignabilityProbe("./clone.ts"),
  });
  expect(clonedAssignability.output).toBe("");
  expect(clonedAssignability.code).toBe(0);

  const deprecatedIdentity = await consumer.typeCheck({
    "deprecated.ts": deprecatedProtocolTwin,
    "deprecated-identity.ts": identityProbe("./deprecated.ts"),
  });
  expect(deprecatedIdentity.code).not.toBe(0);
  expect(deprecatedIdentity.output).toContain("__tsudoiUpstreamMarker");

  const deprecatedAssignability = await consumer.typeCheck({
    "deprecated.ts": deprecatedProtocolTwin,
    "deprecated-assignability.ts": assignabilityProbe("./deprecated.ts"),
  });
  expect(deprecatedAssignability.output).toBe("");
  expect(deprecatedAssignability.code).toBe(0);
});

/*
 * THE STAYS-GREEN HALF IS GUARANTEED BY CONSTRUCTION, NOT MEASURED, and it is a
 * comment rather than a test because no test could carry it.
 *
 * The pair the criterion asks for is `perturbing the published types reddens
 * the probe WHILE tsc --noEmit stays green`. It cannot be tied by one
 * measurement, and that is the STAGING DESIGN rather than a gap: the
 * perturbation is applied to the copy that gets PACKED, so this repository is
 * untouched, and running tsc under the perturbation would be trivially green
 * rather than informative. FORECLOSED, and what would un-foreclose it is
 * perturbing the repo itself -- which the two tests above exist to avoid.
 *
 * The evidence lives in those two: the probe reddens when the published arm
 * breaks, and an in-repo check cannot observe that break at all.
 *
 * NO TEST HERE MAY CALL runTsc(repoRoot), and this is the trap to refuse: that
 * IS the `tsc --noEmit` the Definition of Done already runs, so it cannot fail
 * unless the DoD has already failed. A control that cannot fail is not one, and
 * an inert test is how a suite's green stops meaning what it says.
 */

/**
 * THE NON-HOISTING LAYOUT: a consumer's tree with tsudoi's own dependency moved
 * out of the top level and under node_modules/@atusy/tsudoi-language-server/node_modules/,
 * which is where a package manager that does not hoist puts it.
 *
 * It is the only arrangement that DISCRIMINATES `the consumer declared this
 * package` from `it happened to be lying around at the top level`. Under the
 * hoisted default a bare specifier in a consumer's own file resolves whether or
 * not they ever asked for the package, so nothing measured there can tell the
 * two apart.
 */
function useNonHoistingLayout(dir: string): void {
  const hoisted = join(dir, "node_modules", "vscode-languageserver-protocol");
  const nested = join(dir, "node_modules", "@atusy", "tsudoi-language-server", "node_modules");
  mkdirSync(nested, { recursive: true });
  renameSync(hoisted, join(nested, "vscode-languageserver-protocol"));
}

/**
 * WHY THIS IS THE INVERSE ASSERTION RATHER THAN THE OBVIOUS ONE, said here so
 * the absent half is read as a decision and not as a gap.
 *
 * `without the documented install the example reddens, and tsudoi itself does
 * not` is UNCONSTRUCTIBLE rather than merely unwritten. It needs an undeclared
 * BARE SPECIFIER inside the examples to withhold -- a package the consumer
 * never declares, which the non-hoisting layout would then fail to resolve --
 * and the examples take every protocol name through this package's own
 * `deps/protocol` and `deps/types` subpaths rather than through a bare
 * `vscode-*` specifier, so there is nothing left in them to withhold. A control
 * that cannot be built out of anything is a different thing from a control that
 * could be built and was not.
 *
 * WHAT CAN BE BUILT IS THE INVERSE, and it is the test immediately below: the
 * examples type-check under that layout, and a bare protocol import does not.
 *
 * WHAT THE HARNESS MUST STILL BE ABLE TO DO is notice a package that is
 * GENUINELY MISSING, and `wordnet` is the only case of it -- no longer as a
 * package the harness withholds by hand, but as the handler package's own
 * declared dependency, which a consumer's install fetches and this suite can
 * delete. That is asserted further down rather than assumed.
 */
test("under the non-hoisting layout the examples type-check, and a bare protocol import does not", async () => {
  const strict = await installConsumer();
  try {
    useNonHoistingLayout(strict.dir);

    const example = await strict.typeCheck(exampleSources());
    expect(example.output).toBe("");
    expect(example.code).toBe(0);

    // THE NEGATIVE CONTROL, in the same run and LOAD-BEARING rather than
    // decorative. `code === 0` above is produced just as well by a harness that
    // stopped applying the layout at all -- and the layout is applied by a
    // renameSync, which is exactly the kind of step that goes quietly wrong
    // when a path moves. If the layout is in force, a bare protocol import from
    // a consumer's own file must STILL fail; if it is not, this goes green and
    // the assertion above was measuring the hoisted default.
    const bare = await strict.typeCheck({
      "bare-protocol.ts": importsAndUses(["CompletionItem"], "vscode-languageserver-protocol"),
    });
    expect(bare.code).not.toBe(0);
    expect(bare.output).toContain("vscode-languageserver-protocol");
  } finally {
    strict.dispose();
  }
});

/**
 * THE RUNTIME HALF, and no type check can stand in for it.
 *
 * `CompletionItemKind` is an enum, so the example needs
 * `@atusy/tsudoi-language-server/deps/types` to resolve TO A VALUE at run time.
 * Tsudoi's own `/types` subpath cannot stand in for it and is not what the
 * example imports: it exports nothing at run time, asserted above. A criterion
 * checked only by tsc would go green against a dist/deps/types.d.ts that
 * declares every published name beside a dist/deps/types.js that re-exports
 * none -- the two are separate files emitted from one source, and only one of
 * them can be observed by running.
 *
 * IN THE NON-HOISTING LAYOUT, so this is not merely `the example runs`: it is
 * the example running in a tree where the protocol package is NOT reachable
 * from the consumer's own files, which is the tree criterion 1 is about.
 *
 * A NON-EMPTY result is the assertion. An empty list is what a handler returns
 * when it silently fails to find anything, so `it answered` would be satisfied
 * by a completion handler that had given up.
 */
test("the example serves a completion from a consumer that declares no protocol package", async () => {
  const strict = await installConsumer();
  try {
    for (const [path, source] of Object.entries(exampleSources())) {
      strict.write(path, source);
    }
    useNonHoistingLayout(strict.dir);

    const session = strict.start(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
    );
    try {
      await session.request<InitializeResult>("initialize", initializeParams);
      const documentUri = pathToFileURL(join(strict.dir, "probe.txt")).href;
      session.notify("textDocument/didOpen", {
        textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: "./" },
      });

      // A BARE ARRAY, and with no partialResultToken sent the whole aggregated
      // list is in the response -- so this is every candidate this request
      // produced.
      const answer = await session.request<CompletionItem[]>("textDocument/completion", {
        textDocument: { uri: documentUri },
        // Just past `./`, so the example completes the consumer's own directory
        // -- which exists and is not empty, since the install put node_modules
        // and the example's own files in it.
        position: { line: 0, character: 2 },
      });
      const items = answer;

      expect(`${String(items.length)} items, stderr: ${session.stderr}`).toBe(
        `${String(items.length)} items, stderr: `,
      );
      expect(items.length).toBeGreaterThan(0);
    } finally {
      session.dispose();
    }
  } finally {
    strict.dispose();
  }
});

/**
 * THE LAST GENUINELY-MISSING-PACKAGE CASE, AND IT IS NOT AT THE ARM ANYONE
 * REACHES FOR FIRST -- measured rather than assumed, because that arm sees
 * nothing at all.
 *
 * `withhold wordnet and the examples must still fail` is FALSE of the type
 * check, AND THE REASON IS NOW THE HANDLER PACKAGE'S PUBLISHED SURFACE RATHER
 * THAN A FILE THE READER COPIED. `wordnet` is a dependency of
 * `@atusy/tsudoi-hover-wordnet`; the ambient `declare module "wordnet"` that
 * types it lives inside that package and is deliberately NOT published, and no
 * name it declares appears in what the package publishes. So a consumer's type
 * space never mentions the dictionary at all, and tsc has nothing to miss.
 *
 * THAT MAKES THIS TEST THE CONTROL FOR THAT DECISION AS WELL, in the direction
 * that matters: if the handler ever published a type reaching into `wordnet`,
 * the consumer would need a declaration it does not have and this type check
 * would redden -- which is the loud failure the decision is worth having.
 *
 * SO THE DETECTION LIVES AT THE OTHER ARM: what notices the missing package is
 * RUNNING, where the handler's own import of `wordnet` is a real resolution.
 * Exit 1, and stderr names the package. Taken on trust, the detection would be
 * asserted at the one arm that cannot see it -- a test that passes because it
 * measures nothing.
 *
 * REMOVED RATHER THAN UNLINKED, and RECURSIVELY: the dictionary now arrives as
 * the handler package's declared dependency, which bun installs as a real
 * directory, where it used to be a symlink this suite put there by hand.
 */
test("withholding wordnet is still detected, at the runtime arm rather than the type arm", async () => {
  const strict = await installConsumer();
  try {
    for (const [path, source] of Object.entries(exampleSources())) {
      strict.write(path, source);
    }
    rmSync(join(strict.dir, "node_modules", "wordnet"), { recursive: true, force: true });

    const typeChecked = await strict.typeCheck(exampleSources());
    // The half that does NOT discriminate, asserted so the claim above stays
    // measured rather than becoming folklore: if a future tsc starts reporting
    // this, the comment is wrong and this is where it says so.
    expect(typeChecked.code).toBe(0);

    const started = await runCommand(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
      strict.dir,
    );

    expect(started.code).toBe(1);
    expect(started.stderr).toContain("wordnet");
  } finally {
    strict.dispose();
  }
});

/**
 * WHAT THE MAIN PACKAGE MAKES A STRANGER INSTALL, READ OFF THE TARBALL.
 *
 * FROM THE UNPACKED TARBALL AND NOT FROM THE REPOSITORY, because those are
 * different files the moment a pack stage edits one -- and this repository's
 * stage does write its own package.json. A reading taken at the repo root would
 * be a claim about what we intend to publish rather than about what we do.
 *
 * SCOPED TO `dependencies` DELIBERATELY. A workspace member in devDependencies
 * is normal, reaches no consumer, and is exactly what the repo's own demo config
 * needs; `files: ["dist"]` keeps examples/ out of the tarball anyway. A claim
 * written over both fields would force the demo config out of this package as a
 * side effect nobody asked for.
 *
 * OVER MEMBERS AS A CLASS rather than over the one handler that exists, on the
 * same reasoning as the fifth Definition-of-Done check and the deno guard's
 * member shape: the names come from the workspace configuration, so a package
 * added under packages/ is covered here with nothing edited, and a claim naming
 * one package would go quietly narrow at the second.
 *
 * TWO GUARDS AGAINST A VACUOUS GREEN, both needed and for different reasons: an
 * empty member list would make the filter trivially empty, and an empty
 * dependency map would make it empty for the wrong reason -- a tarball whose
 * manifest failed to parse looks exactly like a package that depends on nothing.
 *
 * AND WHAT THIS CANNOT CURRENTLY BE THE FIRST THING TO CATCH, MEASURED rather
 * than assumed, because a control that never fires first is not a control.
 * Moving the handler from devDependencies into dependencies does NOT reach this
 * assertion: `bun install` of the tarball 404s on `@atusy/tsudoi-hover-wordnet`
 * -- nothing here is published -- and installConsumer throws before any test
 * runs. So the property is FORECLOSED BY THE REGISTRY TODAY and this reading is
 * shadowed by a louder failure.
 *
 * IT IS KEPT ANYWAY, AND THE REASON IS DATED RATHER THAN GENERAL: the
 * foreclosure lasts exactly as long as both packages stay unpublished. Publish
 * either and the 404 goes away, the dependency installs cleanly, and this
 * becomes the only thing that says a framework must not drag a handler along
 * with it. The 404 also names a registry rather than the rule it happens to
 * enforce, which is the case S9 admits for a control that would fail first.
 */
test("the published package depends on no package from this workspace", () => {
  const published = JSON.parse(readFileSync(join(consumer.packageDir, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  const members = declaredMembers(repoRoot).map(
    (dir) => (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name: string }).name,
  );
  const declared = Object.keys(published.dependencies ?? {});

  expect(members.length).toBeGreaterThan(0);
  expect(declared).toContain("vscode-languageserver-protocol");
  expect(declared.filter((name) => members.includes(name))).toEqual([]);
});

/**
 * THE CONSUMER'S TYPE SPACE DOES NOT MENTION THE DICTIONARY, measured in the one
 * place the claim is about: a project that installed the handler.
 *
 * `wordnet` IS INSTALLED IN THIS CONSUMER AND THAT IS THE POINT. It arrives as
 * the handler's declared dependency, so the module RESOLVES and the only thing
 * missing is a declaration. A probe run where the package was absent would redden
 * for the other reason and say nothing about the type space.
 *
 * WHAT THIS CANNOT SEE, AND THE PREMISE IT REFUTES, because a control believed to
 * catch something it cannot is worse than none. It does NOT detect the handler
 * SHIPPING its ambient `declare module "wordnet"`. MEASURED, all three routes:
 * a stray `dist/wordnet.d.ts` collected into the tarball leaves this GREEN;
 * `files` grown to `["dist", "src"]`, which packs the declaration itself, leaves
 * this GREEN; and moving the declaration into a `.ts` input so declaration emit
 * would carry it does not compile at all -- a string-named ambient module is not
 * parseable outside a `.d.ts`, so emit can never produce one. tsc loads only the
 * files in the PROGRAM, and an unreferenced `.d.ts` sitting in node_modules is
 * not one of them. `an ambient declaration that ships lands in every consumer's
 * global type space` is therefore FALSE AS STATED: it lands there only where
 * something puts the file in the program.
 *
 * SO THE ARTIFACT-SIDE GUARD IS NOT REDUNDANT WITH THIS ONE AND CANNOT BE
 * REPLACED BY IT: test/packed-members.test.ts reads the tarball, which is where
 * a stray IS visible. What remains here is the reading that file cannot take --
 * that nothing else in a real install, hoisted or transitive, supplies the
 * declaration either.
 *
 * THE PAIR IS THE TEST BELOW, and it is separate because the failure above is
 * satisfied by a consumer where nothing type-checks at all.
 */
test("a consumer that installed the handler is still told nothing about wordnet", async () => {
  const undeclared = await consumer.typeCheck({
    "wordnet-probe.ts": 'import { lookup } from "wordnet";\nexport const found = lookup;\n',
  });

  expect(undeclared.code).not.toBe(0);
  expect(undeclared.output).toContain("wordnet");
});

/**
 * THE PAIR, and the `any` half is the one that is easy to leave out: a consumer
 * where `hoverWordnet` resolved to `any` type-checks exactly as green as one
 * where it resolves to `MethodHandler<"textDocument/hover">`, so the assignment
 * to `number` is asserted to be REJECTED. A green there would say the probe
 * measured nothing.
 */
test("the same consumer resolves the handler, and to its real type rather than any", async () => {
  const resolves = await consumer.typeCheck({
    "handler-probe.ts":
      'import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";\nexport const handler = hoverWordnet;\n',
  });
  const notAny = await consumer.typeCheck({
    "handler-any-probe.ts":
      'import { hoverWordnet } from "@atusy/tsudoi-hover-wordnet";\nexport const wrong: number = hoverWordnet;\n',
  });

  expect(resolves.output).toBe("");
  expect(resolves.code).toBe(0);
  expect(notAny.code).not.toBe(0);
  expect(notAny.output).toContain("TS2322");
});

/** The path package's specifier, spelled once for the probes that follow. */
const pathPackage = "@atusy/tsudoi-completion-path";

/**
 * WHAT THE PATH PACKAGE PROMISES, READ FROM AN INSTALLED COPY IN BOTH
 * DIRECTIONS -- and the second direction is the one this file exists for.
 *
 * BOTH HANDLERS OR NEITHER. `resolvePathStat` reads a mark `pathCompletion`
 * writes onto its items, and tsudoi refuses a config that supplies the resolve
 * method with no completion handler beside it, so a consumer who received only
 * one of these names has received half an artifact. They are asserted in ONE
 * probe because that is the claim: the package answers two methods.
 *
 * AND TO THEIR REAL TYPES RATHER THAN `any`, which is the pair that keeps the
 * green above honest: a consumer where the specifier resolved to nothing
 * type-checks exactly as green as one where it resolved to a `MethodHandler`.
 * The assignments to `number` must be REJECTED, and both are asserted because
 * the two names come from different modules inside the package -- one green and
 * one red would say the re-export reaches one of them.
 */
test("the path package publishes both handlers, and to their real types rather than any", async () => {
  const resolves = await consumer.typeCheck({
    "path-probe.ts": `import { pathCompletion, resolvePathStat } from "${pathPackage}";\nexport const handlers = { pathCompletion, resolvePathStat };\n`,
  });
  const completionNotAny = await consumer.typeCheck({
    "path-completion-any-probe.ts": `import { pathCompletion } from "${pathPackage}";\nexport const wrong: number = pathCompletion;\n`,
  });
  const resolveNotAny = await consumer.typeCheck({
    "path-resolve-any-probe.ts": `import { resolvePathStat } from "${pathPackage}";\nexport const wrong: number = resolvePathStat;\n`,
  });

  expect(resolves.output).toBe("");
  expect(resolves.code).toBe(0);
  expect(completionNotAny.code).not.toBe(0);
  expect(completionNotAny.output).toContain("TS2322");
  expect(resolveNotAny.code).not.toBe(0);
  expect(resolveNotAny.output).toContain("TS2322");
});

/**
 * THE MARK IS NOT PUBLISHED, AND THE TARBALL IS WHERE THAT IS DECIDED RATHER
 * THAN THE SOURCE.
 *
 * `completedPath` and `PathItemData` describe how a completed item says which
 * file it came from. The two handlers agree about it by importing one
 * definition; a consumer who could import it would make every change to that
 * agreement a compatibility question with a stranger.
 *
 * WHAT THIS IS NOT: an assertion that the name is absent from the tarball. IT IS
 * IN THERE -- `dist/completion.d.ts` declares it, because the module must export
 * it for the sibling module to import it, and `files: ["dist"]` ships the whole
 * directory. What makes it internal is the `exports` map naming `.` alone, so
 * this reads the thing that map decides: WHETHER A CONSUMER CAN NAME IT.
 *
 * THE DEEP PATH IS THE OTHER HALF AND IT IS NOT REDUNDANT, because the two
 * failures have different causes: the first is `the entry point does not
 * re-export this`, the second is `the package does not expose this file at all`.
 * Drop the `exports` map and the first stays red while the second goes GREEN,
 * which is exactly the edit that would publish the mark by accident.
 *
 * ITS PAIR IS THE TEST ABOVE, in the same consumer: an install that failed, or a
 * specifier nothing answers, produces these same two reds while publishing
 * nothing at all.
 */
test("the mark the two handlers share cannot be named by a consumer, by either route", async () => {
  const throughEntryPoint = await consumer.typeCheck({
    "mark-probe.ts": `import { completedPath } from "${pathPackage}";\nexport const reader = completedPath;\n`,
  });
  const throughDeepPath = await consumer.typeCheck({
    "mark-deep-probe.ts": `import { completedPath } from "${pathPackage}/dist/completion.js";\nexport const reader = completedPath;\n`,
  });

  expect(throughEntryPoint.code).not.toBe(0);
  expect(throughEntryPoint.output).toContain("completedPath");
  expect(throughDeepPath.code).not.toBe(0);
  expect(throughDeepPath.output).toContain(`${pathPackage}/dist/completion.js`);
});

/**
 * THE OPTION BAG IS INTERNAL AND A CONSUMER LOSES NOTHING BY IT, MEASURED RATHER
 * THAN ARGUED -- because this is the one classification where withholding a name
 * could have taken a capability away with it.
 *
 * `PathCompletionOptions` is the third parameter of `pathCompletion`, so a
 * config author who wants to name the directory a bare relative path is read
 * against must be able to PASS one. They can: the value is an object literal,
 * and the parameter's type is reached through the declaration's own relative
 * import whether or not the name is re-exported. What they cannot do is annotate
 * a variable with it, which is the cost this classification accepts.
 *
 * WHY IT IS WITHHELD AT ALL: its second member is `flavour`, a seam that exists
 * so this repository can measure the Windows reading on a machine that is not
 * Windows. Publishing the type would promise that seam to strangers.
 *
 * THE EXCESS-PROPERTY ARM IS THE ONE THAT DISCRIMINATES, and without it the
 * green above is equally what `any` produces: a misspelled member must be
 * REJECTED, which only happens if the parameter really has that type.
 */
test("a consumer can pass options without naming their type, and a misspelled member is refused", async () => {
  const notNamed = await consumer.typeCheck({
    "options-name-probe.ts": `import type { PathCompletionOptions } from "${pathPackage}";\nexport type Options = PathCompletionOptions;\n`,
  });
  const passed = await consumer.typeCheck({
    "options-probe.ts": `import { pathCompletion } from "${pathPackage}";\nconst options: Parameters<typeof pathCompletion>[2] = { cwd: "/somewhere" };\nexport const chosen = options;\n`,
  });
  const misspelled = await consumer.typeCheck({
    "options-misspelled-probe.ts": `import { pathCompletion } from "${pathPackage}";\nconst options: Parameters<typeof pathCompletion>[2] = { cdw: "/somewhere" };\nexport const chosen = options;\n`,
  });

  expect(notNamed.code).not.toBe(0);
  expect(notNamed.output).toContain("PathCompletionOptions");
  expect(passed.output).toBe("");
  expect(passed.code).toBe(0);
  expect(misspelled.code).not.toBe(0);
  expect(misspelled.output).toContain("cdw");
});
