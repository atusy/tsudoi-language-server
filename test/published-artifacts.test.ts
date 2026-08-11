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
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT THIS FILE ADDS THAT `tsc --noEmit` DOES NOT: the root check reads only the
 * subpaths THIS CHECKOUT'S OWN FILES import, under the ROOT'S options, out of a
 * workspace link. What a stranger receives is a TARBALL, type-checked under their
 * own options from a project that never saw this checkout.
 *
 * IT IS NOT THE ONLY READER OF THAT TARBALL -- test/installed-specifier.test.ts
 * and test/installed-without-node-types.test.ts type-check against the same
 * packed artifact. WHAT IS THIS FILE'S ALONE IS WHERE ITS PROBE COMES FROM: the
 * config compiled below is README.md's OWN BYTES, read at test time, so a README
 * edit lands in this type check, where installed-specifier writes the documented
 * shape out by hand.
 *
 * EVERYTHING HERE IS THEREFORE BORN GREEN BY DESIGN -- the snippet and the
 * example already compile -- so what this file supplies is the CHECK and not a
 * fix, and all of its value is in its controls. Every control that CAN fail is a
 * test below; exactly one is a comment instead, because the staging design
 * forecloses it rather than leaving it unwritten (the stays-green note).
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
 * THE CONTROL THAT MAKES THIS FILE MORE THAN A SECOND TYPE CHECK, and the pair is
 * the whole point: without the stays-green half this file is `checked again`
 * wearing the words `checked through the published arm`.
 */
test("perturbing the published types reddens the probe while tsc --noEmit stays green", async () => {
  // THE LEVER IS THE `types` CONDITION, not an edit to
  // packages/tsudoi-language-server/src/types.ts: that file is consumed in full
  // by src/, so any change to it fails the build instead of shipping a
  // different surface. Dropping the condition leaves tsc to fall back to
  // `default` -> ./src/types.ts, WHICH THE PACKAGE DOES NOT SHIP (`files` is
  // dist/ alone) -- so a consumer loses the types while this repo, which does
  // have src/, is unaffected. That asymmetry IS the pair.
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
 * A RULING RATHER THAN AN OBSERVATION: a types module exporting a runtime
 * function is incoherent, so this subpath may not GROW one. It is read off the
 * artifact a stranger receives rather than grepped over src/, which can see
 * neither an interface MEMBER nor a RE-EXPORT line.
 *
 * ITS PAIR IS IN THE SAME MEASUREMENT, because this asserts an ABSENCE: `[]`
 * alone cannot tell `type-only` from `the module failed to load` from `I read the
 * wrong module`. The sibling subpath goes through the SAME reader in the same
 * test and must show keys.
 *
 * PER SUBPATH AND NEVER PER PACKAGE: `deps/types` re-exports the dependency's
 * data values ON PURPOSE, so `this package exports no values` would be false. The
 * pair is also what stops the claim being quietly widened.
 *
 * THE SIBLING IS ASSERTED NON-EMPTY AND NOT BY SET, which is the next test's job:
 * the same set pinned twice is two instruments that can disagree.
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
 * THE VALUE ARM, and no type check can stand in for it: dist/types.d.ts and
 * dist/types.js are separate files emitted from one source, and an `export type`
 * re-export produces a perfect declaration beside a module that exports nothing
 * -- every type-check assertion in this file would stay green while a config
 * author got `undefined` at their first completion.
 *
 * THE SET IS DERIVED FROM THE DEPENDENCY, NOT LISTED HERE.
 * packages/tsudoi-language-server/src/deps/types.ts satisfies it with a star,
 * so incompleteness is structural rather than checked -- what this test defends
 * is the star itself: replace it with an explicit list and this reddens the day
 * upstream adds a name.
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
 * THROUGH THE INSTALLED CONSUMER, NOT typeCheckProbe, and the two are not
 * interchangeable: the in-repo arm resolves this subpath against sources a
 * stranger never receives.
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
 * A NAME ON THE SUBPATH THAT IS NOT A PROTOCOL NAME AT ALL -- and this test
 * exists because that distinction leaves it otherwise UNDEFENDED. `TextDocument`
 * is not in `publicProtocolNames` and must not be: that list holds the PROTOCOL
 * names the subpath re-exports, and this one comes from
 * vscode-languageserver-textdocument. So the published-names probe above and the
 * value probe below both skip it.
 *
 * WHAT IT DOES NOT SEE IS WHICH TextDocument ARRIVED, which is the reason the
 * identity test exists: pointed at vscode-languageserver-protocol's DEPRECATED
 * twin, this arm is green.
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
 * THE SURFACE IS UPSTREAM'S TYPE SET, and the probe names a type NO example
 * uses and NO line of packages/tsudoi-language-server/src/types.ts mentions, so
 * it passes only because `export type *` carries it. The boundary runs between
 * TYPES and VALUES rather than between chosen names and withheld ones, and the
 * test below is where the restraint lives.
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
 * WHAT `export type *` MUST NOT CARRY, and the reason the star is type-only: the
 * dependency exports its Request and Notification constants as VALUES, for
 * methods tsudoi does not implement -- plus `createProtocolConnection`, which
 * would let a config build its own connection and bypass tsudoi entirely. A
 * surface carrying them would advertise capabilities the server does not have.
 *
 * WHAT IS READ BELOW IS THE NAME AND NOT THE DIAGNOSTIC CODE, so the red does not
 * by itself separate `exported as a type` from `not exported at all` -- the
 * diagnostic tsc produces here is TS1362, which is the first of those.
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
 * name nobody ever had. Its own test rather than a second assertion, because a
 * renamed-away protocol symbol and a broken re-export are different mistakes and
 * must not share a first failure.
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
 * A PROBE THAT OBSERVES DECLARATION IDENTITY RATHER THAN SHAPE, which is the one
 * thing an assignability check cannot do. It AUGMENTS upstream's own
 * `TextDocument` interface with a marker member and then reads that member off
 * whatever `from` calls `TextDocument`. Declaration merging reaches ONE
 * declaration, so the member is visible through the subject only if the subject
 * IS that declaration; a structural twin -- however exact -- never sees it.
 *
 * THE FIRST IMPORT IS LOAD-BEARING AND IS NOT DECORATION. A module augmentation
 * whose target is not already in the program fails with TS2664 `module cannot be
 * found` INSTEAD OF the marker diagnostic, and that failure looks like a missing
 * dependency rather than like a wrong type. Anchoring the module in the program
 * leaves TS2339 on the marker as the way this fails.
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
 * TSUDOI'S OWN INTERFACE, WIDENED BY HAND to every structural promise the
 * published one makes -- the increment someone would ship who stopped at shape.
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
 * vscode-languageserver-textdocument package` -- with the same seven members
 * and no `update`. packages/tsudoi-language-server/src/types.ts already imports
 * from that specifier, so this is the edit a future tidy-up would make while
 * believing it removed a dependency.
 */
const deprecatedProtocolTwin =
  'export type { TextDocument } from "vscode-languageserver-protocol";';

/**
 * WHAT IT CATCHES THAT THE READINGS BESIDE IT DO NOT: with
 * packages/tsudoi-language-server/src/types.ts re-exporting
 * `vscode-languageserver-protocol`'s DEPRECATED TextDocument instead -- a
 * one-line edit that adds no dependency -- `tsc --noEmit` exits 0, the type arm
 * above exits 0, the value arm is unchanged, and this arm is the only red.
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
 * check reads exactly like coverage and sees none of this. Both subjects satisfy
 * every structural promise the interface makes: both pass a `getText(range) is
 * callable` test, an `assignable to upstream` test and a strict-superset
 * comparison, while one is code this project would own forever and the other a
 * type its own authors deprecated.
 *
 * Its own test rather than assertions appended to the one above, because `tsudoi
 * adopted upstream` and `this probe can tell adoption from resemblance` are
 * different hazards and must not share a first failure.
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
 * THE STAYS-GREEN HALF IS GUARANTEED BY CONSTRUCTION, and it is a comment rather
 * than a test because no test could carry it: the perturbation is applied to the
 * copy that gets PACKED, so this repository is untouched and running tsc under it
 * would be trivially green rather than informative. What would un-foreclose it is
 * perturbing the repo itself, which the two tests above exist to avoid.
 *
 * NO TEST HERE MAY CALL runTsc(repoRoot), and this is the trap to refuse: that IS
 * the `tsc --noEmit` the Definition of Done already runs, so it cannot fail
 * unless the DoD has already failed. A control that cannot fail is not one.
 */

/**
 * THE NON-HOISTING LAYOUT: a consumer's tree with tsudoi's own dependency moved
 * out of the top level and under node_modules/@atusy/tsudoi-language-server/node_modules/,
 * which is where a package manager that does not hoist puts it.
 *
 * It DISCRIMINATES `the consumer declared this package` from `it happened to be
 * lying around at the top level`, which the hoisted default cannot. Under the
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
 * WHY THIS IS THE INVERSE ASSERTION RATHER THAN THE OBVIOUS ONE, said here so the
 * absent half is read as a decision and not as a gap.
 *
 * `without the documented install the example reddens, and tsudoi itself does
 * not` is UNCONSTRUCTIBLE rather than merely unwritten. It needs an undeclared
 * BARE SPECIFIER inside the examples to withhold -- a package the consumer never
 * declares, which the non-hoisting layout would then fail to resolve -- and the
 * examples take every protocol name through this package's own `deps/protocol`
 * and `deps/types` subpaths, so there is nothing left in them to withhold. A
 * control that cannot be built out of anything is a different thing from a
 * control that could be built and was not.
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
 * THE RUNTIME HALF, and no type check can stand in for it, for the reason
 * recorded at the value arm above: a declaration and the module beside it are
 * separate files emitted from one source.
 *
 * A NON-EMPTY result is the assertion. An empty list is what a handler returns
 * when it silently fails to find anything, so `it answered` would be satisfied by
 * a completion handler that had given up.
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
 * `withhold wordnet and the examples must still fail` is FALSE OF THE TYPE CHECK.
 * The ambient `declare module "wordnet"` that types the dictionary lives inside
 * `@atusy/tsudoi-hover-wordnet` and is deliberately NOT published, and no name it
 * declares appears in what that package publishes -- so a consumer's type space
 * never mentions the dictionary and tsc has nothing to miss. Taken on trust, the
 * detection would be asserted at the one arm that cannot see it.
 *
 * THAT MAKES THIS THE CONTROL FOR THAT DECISION TOO, in the direction that
 * matters: if the handler ever published a type reaching into `wordnet`, the
 * consumer would need a declaration it does not have and this type check would
 * redden.
 *
 * REMOVED RATHER THAN UNLINKED, and RECURSIVELY: the dictionary arrives as the
 * handler package's declared dependency, which bun installs as a real directory.
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
 * SCOPED TO `dependencies` DELIBERATELY. A workspace member in devDependencies is
 * normal, reaches no consumer, and is exactly what the repo's own demo config
 * needs; a claim written over both fields would force that config out of this
 * package as a side effect nobody asked for.
 *
 * TWO GUARDS AGAINST A VACUOUS GREEN, both needed and for different reasons: an
 * empty member list would make the filter trivially empty, and an empty
 * dependency map would make it empty for the wrong reason -- a tarball whose
 * manifest failed to parse looks exactly like a package that depends on nothing.
 *
 * AND IT CANNOT CURRENTLY BE THE FIRST THING TO CATCH ITS OWN SUBJECT: moving a
 * handler from devDependencies into dependencies never reaches this assertion,
 * because `bun install` of the tarball 404s on an unpublished package and
 * installConsumer throws before any test runs. THE FORECLOSURE IS DATED RATHER
 * THAN GENERAL -- it lasts exactly as long as both packages stay unpublished, and
 * then this becomes what says a framework must not drag a handler along with it.
 */
test("the published package depends on no package from this workspace", () => {
  const published = JSON.parse(readFileSync(join(consumer.packageDir, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  // MEMBERS AND NOT HANDLERS, and it is the sentence being asserted that decides
  // it: `no package FROM THIS WORKSPACE`. The framework's own name in the list can
  // never match its own dependencies, so the wider reading costs nothing and the
  // narrower one would quietly stop asking about a package this claim covers.
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
 * WHAT THIS CANNOT SEE, because a control believed to catch something it cannot
 * is worse than none: it does NOT detect the handler SHIPPING its ambient
 * `declare module "wordnet"`. tsc loads only the files in the PROGRAM, and an
 * unreferenced `.d.ts` sitting in node_modules is not one of them -- so a stray
 * declaration in the tarball leaves this GREEN. `an ambient declaration that
 * ships lands in every consumer's global type space` is FALSE AS STATED: it lands
 * there only where something puts the file in the program.
 *
 * SO THE ARTIFACT-SIDE GUARD IS NOT REDUNDANT WITH THIS ONE AND CANNOT BE
 * REPLACED BY IT: test/packed-members.test.ts reads the tarball, which is where a
 * stray IS visible. What remains here is the reading that file cannot take --
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

const pathPackage = "@atusy/tsudoi-completion-path";

/**
 * BOTH HANDLERS OR NEITHER. `resolvePathStat` reads a mark `completePath`
 * writes onto its items, and tsudoi refuses a config that supplies the resolve
 * method with no completion handler beside it, so a consumer who received only
 * one of these names has received half an artifact. They are asserted in ONE
 * probe because that is the claim: the package answers two methods.
 *
 * AND TO THEIR REAL TYPES RATHER THAN `any`, for the reason recorded at the
 * hover-handler probe above. BOTH assignments to `number` are asserted rejected
 * because the two names come from different modules inside the package -- one
 * green and one red would say the re-export reaches only one of them.
 */
test("the path package publishes both handlers, and to their real types rather than any", async () => {
  const resolves = await consumer.typeCheck({
    "path-probe.ts": `import { completePath, resolvePathStat } from "${pathPackage}";\nexport const handlers = { completePath, resolvePathStat };\n`,
  });
  const completionNotAny = await consumer.typeCheck({
    "path-completion-any-probe.ts": `import { completePath } from "${pathPackage}";\nexport const wrong: number = completePath;\n`,
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
 * THE WHOLE OF WHAT A CONSUMER MAY NAME, AS A VALUE, AND IT IS WHOLE RATHER THAN
 * NAME-BY-NAME FOR THE REASON THE EXPORTS MAP IS ASSERTED WHOLE: what the entry
 * module re-exports is a decision about what strangers may depend on, so a name
 * ARRIVING there is the event worth reddening on, and a probe that asks about
 * one name at a time can only ever refuse the names somebody thought to list.
 *
 * THE SHARED NAMES ARE WHAT IT IS FOR: `documentationFor`, `preferredFormat` and
 * `statLine` are exported from the completion module so the resolve half can
 * rebuild one block rather than spelling a second, and publishing any of them
 * would make how the two agree a compatibility question with a stranger, exactly
 * as the mark would. A name-by-name probe would have to be edited for each.
 *
 * WHAT IT CANNOT SEE IS A TYPE, BY CONSTRUCTION -- a module namespace object
 * carries runtime exports alone -- which is why the type-only member of the same
 * shared surface has the test below rather than an assertion here.
 */
test("the path package's published values are exactly its two handlers", async () => {
  const published = await runtimeKeysOf(pathPackage, "path-surface.js");

  expect(published.sort()).toEqual(["completePath", "resolvePathStat"]);
});

/**
 * THE TYPE-ONLY MEMBER OF THE SHARED SURFACE, AND IT NEEDS ITS OWN INSTRUMENT
 * RATHER THAN ITS OWN ASSERTION.
 *
 * `DirectoryListing` is what the resolve half hands the composer -- the names to
 * render and how many entries there really are -- and it is as much an agreement
 * between two modules as the mark is. It leaves NO runtime trace, so the
 * whole-value reading above is blind to it: `export type { DirectoryListing }`
 * appended to the entry module leaves that test green and reddens this one,
 * which is the pair that says the two are not redundant.
 *
 * THE ENTRY-POINT ROUTE ALONE, deliberately. The other route -- naming the file
 * inside dist/ directly -- is refused by the `exports` map for every internal
 * name at once, and that hazard already owns the test above it; asserting it
 * again here would give two tests one first failure.
 */
test("the listing type the two handlers share cannot be named by a consumer", async () => {
  const throughEntryPoint = await consumer.typeCheck({
    "listing-probe.ts": `import type { DirectoryListing } from "${pathPackage}";\nexport type Listing = DirectoryListing;\n`,
  });

  expect(throughEntryPoint.code).not.toBe(0);
  expect(throughEntryPoint.output).toContain("DirectoryListing");
});

/**
 * THE OPTION BAG IS INTERNAL AND A CONSUMER LOSES NOTHING BY IT, MEASURED RATHER
 * THAN ARGUED -- because this is the one classification where withholding a name
 * could have taken a capability away with it.
 *
 * `CompletePathOptions` is the third parameter of `completePath`, so a
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
    "options-name-probe.ts": `import type { CompletePathOptions } from "${pathPackage}";\nexport type Options = CompletePathOptions;\n`,
  });
  const passed = await consumer.typeCheck({
    "options-probe.ts": `import { completePath } from "${pathPackage}";\nconst options: Parameters<typeof completePath>[2] = { cwd: "/somewhere" };\nexport const chosen = options;\n`,
  });
  const misspelled = await consumer.typeCheck({
    "options-misspelled-probe.ts": `import { completePath } from "${pathPackage}";\nconst options: Parameters<typeof completePath>[2] = { cdw: "/somewhere" };\nexport const chosen = options;\n`,
  });

  expect(notNamed.code).not.toBe(0);
  expect(notNamed.output).toContain("CompletePathOptions");
  expect(passed.output).toBe("");
  expect(passed.code).toBe(0);
  expect(misspelled.code).not.toBe(0);
  expect(misspelled.output).toContain("cdw");
});
