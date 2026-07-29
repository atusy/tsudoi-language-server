import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { exampleSources, type InstalledConsumer, installConsumer } from "./helpers/install.ts";
import { initializeParams } from "./helpers/lsp.ts";
import { importsAndUses, publicProtocolNames } from "./helpers/published-names.ts";
import { extractQuickstart, QUICKSTART_STEPS, readReadme } from "./helpers/readme.ts";
import { runCommand } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

/**
 * WHAT THIS FILE ADDS THAT `tsc --noEmit` DOES NOT.
 *
 * The repo's own type check resolves `@atusy/tsudoi/types` through the exports
 * map's IN-REPO arm -- straight at src/types.ts. What a stranger receives is
 * the COMPILED dist/types.d.ts, and nothing checked the artifacts against that
 * until this file. Everything here is therefore BORN GREEN by design: the
 * snippet and the example already compile, measured twice before the sprint
 * began. What was missing is the CHECK, not a fix, so all of this file's value
 * is in its controls.
 *
 * Every control that CAN fail is a test below. Exactly one is a comment
 * instead, and only because the property it records is FORECLOSED by the
 * staging design rather than assertable -- see the stays-green note further
 * down, and the test that used to stand there and could not fail.
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
  expect(result.output).not.toContain("completion-path.ts");
});

test("a type error in the example reddens the example, not the snippet", async () => {
  const sources = exampleSources();
  const result = await consumer.typeCheck({
    "readme-snippet.ts": readmeSnippet(),
    ...sources,
    "completion-path.ts": withTypeError(sources["completion-path.ts"] ?? ""),
  });

  expect(result.code).not.toBe(0);
  expect(result.output).toContain("completion-path.ts");
  expect(result.output).not.toContain("readme-snippet.ts");
});

/**
 * THE CONTROL THAT PROVES THIS SPRINT DID ITS JOB, and the pair is the whole
 * point. Perturbing the PUBLISHED types must redden the probe WHILE the repo's
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
    expect(result.output).toContain("@atusy/tsudoi/types");
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
 * Object.keys of the namespace object is therefore the assertion, and an ES
 * module namespace carries exactly the runtime exports, so a type-only
 * re-export is invisible here BY CONSTRUCTION rather than by our filtering it
 * out.
 *
 * THE SET IS DERIVED, NOT LISTED, which is the whole point of this test after
 * the surface stopped being curated. It must be EXACTLY what
 * vscode-languageserver-types exports at run time, minus `TextDocument`. So a
 * name upstream adds is MISSING here until someone re-exports it -- the failure
 * a hand-picked list could never produce, because a hand-picked list is complete
 * by definition.
 *
 * `TextDocument` IS THE ONE SUBTRACTION, and it is a ruling rather than an
 * oversight: this package publishes the one from
 * vscode-languageserver-textdocument, TYPE-ONLY, and the types package ships a
 * deprecated namespace under the same name. Re-exporting that one as a value
 * would shadow the good type with the wrong thing.
 */
test("the published module re-exports every LSP data value, and nothing else", async () => {
  consumer.write(
    "value-surface.js",
    'import * as values from "@atusy/tsudoi/deps/types";\nconsole.log(JSON.stringify(Object.keys(values)));\n',
  );

  const result = await runCommand("bun run ./value-surface.js", consumer.dir);

  // The whole failure on the assertion line: a module that throws at load
  // otherwise reports only that stdout did not parse.
  expect(`${String(result.code)} ${result.stderr}`).toBe("0 ");

  const upstream = Object.keys(await import("vscode-languageserver-types"))
    .filter((name) => name !== "TextDocument" && name !== "default")
    .sort();
  expect((JSON.parse(result.stdout.trim()) as string[]).sort()).toEqual(upstream);
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
    "published-names.ts": importsAndUses(publicProtocolNames, "@atusy/tsudoi/deps/protocol"),
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
 * BORN GREEN, DECLARED: the name was reachable from this subpath before PBI-31
 * too, because tsudoi declared a TextDocument of its own. What is new is the
 * CHECK, not the property -- the same honesty this file states about itself at
 * the top. Its evidence is the perturbation, RUN: removing the export from
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
    "text-document.ts": importsAndUses(["TextDocument"], "@atusy/tsudoi/deps/textdocument"),
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
    "unpublished-name.ts": importsAndUses(["DefinitionParams"], "@atusy/tsudoi/deps/protocol"),
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
      'import { CodeActionRequest } from "@atusy/tsudoi/deps/protocol";\nconsole.log(CodeActionRequest);\n',
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
 * rather than counted on purpose: the count was true when first written and
 * false three tests later, in this same sprint.
 */
test("the TextDocument the published subpath exports is upstream's own declaration", async () => {
  const result = await consumer.typeCheck({
    "identity.ts": identityProbe("@atusy/tsudoi/deps/textdocument"),
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
 * THE STAYS-GREEN HALF IS GUARANTEED BY CONSTRUCTION, NOT MEASURED, and this
 * comment is here because a test asserting it was DELETED at Sprint 15's
 * Review rather than kept as a signpost.
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
 * The deleted test called runTsc(repoRoot), which IS the `tsc --noEmit` the
 * Definition of Done already runs -- so it could not fail unless the DoD had
 * already failed. A control that cannot fail is not one, and an inert test is
 * how a suite's green stops meaning what it says.
 */

/**
 * THE NON-HOISTING LAYOUT: a consumer's tree with tsudoi's own dependency moved
 * out of the top level and under node_modules/@atusy/tsudoi/node_modules/,
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
  const nested = join(dir, "node_modules", "@atusy", "tsudoi", "node_modules");
  mkdirSync(nested, { recursive: true });
  renameSync(hoisted, join(nested, "vscode-languageserver-protocol"));
}

/**
 * WHAT STOOD HERE BEFORE, AND WHY IT IS GONE. This is the record of a
 * withdrawal, kept beside the test that replaced it so the two are never read
 * apart.
 *
 * Until PBI-26 this file asserted `without the documented install the example
 * reddens, and tsudoi itself does not`. Its premise was that the example
 * imports `vscode-languageserver-protocol` by BARE SPECIFIER -- a package the
 * consumer never declares -- so the non-hoisting layout made the example fail,
 * and the README's install step is what repaired it.
 *
 * THAT PREMISE WAS WITHDRAWN DELIBERATELY, not broken by accident: PBI-26 moved
 * the examples onto `@atusy/tsudoi/types` for every protocol name, so there is
 * no undeclared specifier left in them to withhold. The old assertion is
 * therefore UNCONSTRUCTIBLE rather than failing -- there is nothing to build it
 * out of -- and that is a different thing from a control that could be built and
 * was not. It was not deleted as a convenience either: deleting a test that
 * defends an accepted criterion is a scope decision, and the Product Owner
 * ruled it REPLACED BY ITS INVERSE, which is the test immediately below.
 *
 * WHAT SURVIVES of its job is the harness's ability to notice a package that is
 * GENUINELY MISSING, and `wordnet` is now the only case of it. That is asserted
 * further down rather than assumed -- and measuring it turned up something the
 * plan for this sprint had wrong, recorded there.
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
 * `CompletionItemKind` is an enum, so the example needs `@atusy/tsudoi/types`
 * to resolve TO A VALUE at run time. A criterion checked only by tsc would go
 * green against a dist/types.d.ts that declares every published name beside a
 * dist/types.js that re-exports none -- the two are separate files emitted from
 * one source, and only one of them can be observed by running.
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
      "bun run node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts",
    );
    try {
      await session.request<InitializeResult>("initialize", initializeParams);
      const documentUri = pathToFileURL(join(strict.dir, "probe.txt")).href;
      session.notify("textDocument/didOpen", {
        textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: "./" },
      });

      const items = await session.request<CompletionItem[]>("textDocument/completion", {
        textDocument: { uri: documentUri },
        // Just past `./`, so the example completes the consumer's own directory
        // -- which exists and is not empty, since the install put node_modules
        // and the example's own files in it.
        position: { line: 0, character: 2 },
      });

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
 * THE LAST GENUINELY-MISSING-PACKAGE CASE, and the plan for this sprint had its
 * ARM WRONG -- recorded here rather than quietly built the other way.
 *
 * The plan said `withhold wordnet and the examples must still fail`, meaning the
 * type check. MEASURED: they do NOT. Removing `wordnet` from a consumer entirely
 * leaves `consumer.typeCheck(exampleSources())` at exit 0 with empty output,
 * because examples/wordnet.d.ts carries `declare module "wordnet"` -- an AMBIENT
 * declaration -- and that file is deliberately part of the example a reader
 * copies. tsc needs nothing on disk once a module is declared.
 *
 * SO THE CONTROL MOVED ARM RATHER THAN BEING LOST: what still detects the
 * missing package is RUNNING, where the config's import of `wordnet` is a real
 * resolution. Exit 1, and stderr names the package. Had this been taken on
 * trust, the surviving detection would have been asserted at the one arm that
 * cannot see it -- a test that passes because it measures nothing.
 */
test("withholding wordnet is still detected, at the runtime arm rather than the type arm", async () => {
  const strict = await installConsumer();
  try {
    for (const [path, source] of Object.entries(exampleSources())) {
      strict.write(path, source);
    }
    unlinkSync(join(strict.dir, "node_modules", "wordnet"));

    const typeChecked = await strict.typeCheck(exampleSources());
    // The half that does NOT discriminate, asserted so the claim above stays
    // measured rather than becoming folklore: if a future tsc starts reporting
    // this, the comment is wrong and this is where it says so.
    expect(typeChecked.code).toBe(0);

    const started = await runCommand(
      "bun run node_modules/@atusy/tsudoi/dist/cli.js --config ./tsudoi.config.ts",
      strict.dir,
    );

    expect(started.code).toBe(1);
    expect(started.stderr).toContain("wordnet");
  } finally {
    strict.dispose();
  }
});
