import { expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { lintProbe } from "./helpers/lint.ts";

const lib = 'export const hello = () => "hi";\n';

function importer(specifier: string): string {
  return `import { hello } from "${specifier}";\nexport const greet = () => hello();\n`;
}

function importsBunModule(specifier: string): string {
  return `import { Database } from "${specifier}";\nexport const db = Database;\n`;
}

/** A shape a .ts file can take in this repo, and what the guard owes it. */
interface PathShape {
  /**
   * A probe file at that shape. RULES 1 TO 3 are exercised at every path here;
   * RULE 4 IS NOT, and the reason is given at rule 4 rather than assumed.
   */
  readonly path: string;
  /**
   * Whether `bun:*` imports are exempt there. TRUE only where `bun test` itself
   * needs them -- the exemption's WIDTH is a claim in its own right, since
   * fixture configs execute under deno and must stay Bun-free.
   */
  readonly bunModulesExempt: boolean;
}

/**
 * THE SIX SHAPES, and ONE list drives rules 1 to 3.
 *
 * They used to be three lists that had drifted apart: import/extensions was
 * pinned at three paths, the Bun global at four, bun:* at four again but not
 * the same four, and examples/ appeared in none of them. The config is
 * default-deny, so examples/ was COVERED and merely unasserted -- which is the
 * shape a coverage gap takes right up until someone adds an override.
 *
 * Adding a shape here now costs three rules' worth of assertions at once, and
 * that is the point: a path that lints differently from the others has to be
 * declared different, in the one place that says what the guard is for.
 */
const pathShapes: readonly PathShape[] = [
  { path: "src/server.ts", bunModulesExempt: false },
  { path: "src/notifications.ts", bunModulesExempt: false },
  { path: "test/probe.test.ts", bunModulesExempt: true },
  { path: "test/helpers/probe.ts", bunModulesExempt: true },
  { path: "test/fixtures/probe.ts", bunModulesExempt: false },
  { path: "examples/probe.config.ts", bunModulesExempt: false },
];

/** The `./lib.ts` a probe at `path` imports, beside it in the same directory. */
function siblingLib(path: string): string {
  return join(dirname(path), "lib.ts");
}

// RULE 1, import/extensions. Deno resolves no extensions, so a relative import
// that omits .ts runs under bun and dies under deno -- the single most likely
// way this codebase loses its second runtime.
//
// The two shapes inside the `overrides` entry carry a second claim: `plugins`
// is declared only at the top level, so these assert the PLUGIN rule still
// reaches into a scope where another rule is switched off. Without them
// import/extensions could be silently dead across every test file and helper,
// half the repo's TypeScript.
for (const { path } of pathShapes) {
  test(`a relative import without .ts is flagged in ${path}`, async () => {
    const result = await lintProbe({ [siblingLib(path)]: lib, [path]: importer("./lib") });

    expect(result.code).toBe(1);
    expect(result.output).toContain("import(extensions)");
    expect(result.output).toContain(path);
  });

  // The pair: the rule is about the EXTENSION, not about relative imports.
  test(`the same relative import carrying .ts is not flagged in ${path}`, async () => {
    const result = await lintProbe({ [siblingLib(path)]: lib, [path]: importer("./lib.ts") });

    expect(result.code).toBe(0);
  });
}

// RULE 2, the Bun global. Not exempted at any shape, deliberately: @types/bun
// declares it, so `tsc --noEmit` ACCEPTS Bun.file() in src/ and this rule is
// the only check that rejects it. Each shape is named so a leak reports which
// one leaked.
for (const { path } of pathShapes) {
  test(`the Bun global is flagged in ${path}`, async () => {
    const result = await lintProbe({ [path]: 'export const read = () => Bun.file("x").text();\n' });

    expect(result.code).toBe(1);
    expect(result.output).toContain("no-restricted-globals");
    expect(result.output).toContain(path);
  });

  test(`removing the Bun global from ${path} leaves it unflagged`, async () => {
    const result = await lintProbe({ [path]: 'export const read = () => fetch("x").text();\n' });

    expect(result.code).toBe(0);
  });
}

// RULE 3, bun:* imports. BOTH halves are under test at every shape: that the
// exemption exists where `bun test` needs it, and that it is no wider.
for (const { path, bunModulesExempt } of pathShapes) {
  const verb = bunModulesExempt ? "is exempt" : "is flagged";
  test(`a bun:sqlite import ${verb} in ${path}`, async () => {
    const result = await lintProbe({ [path]: importsBunModule("bun:sqlite") });

    if (bunModulesExempt) {
      expect(result.code).toBe(0);
      return;
    }
    expect(result.code).toBe(1);
    expect(result.output).toContain("no-restricted-imports");
    expect(result.output).toContain(path);
  });
}

// node:url is a runtime builtin; vscode-languageserver-protocol/node is a package
// subpath. Both are bare specifiers that import/extensions must leave alone.
const bareSpecifiers = [
  'import { fileURLToPath } from "node:url";',
  'import { createConnection } from "vscode-languageserver-protocol/node";',
].join("\n");
const bareUsage = "export const used = [fileURLToPath, createConnection];\n";

test("node:url and a package subpath import are not flagged", async () => {
  const result = await lintProbe({ "src/bare.ts": `${bareSpecifiers}\n${bareUsage}` });

  expect(result.code).toBe(0);
});

test("node:url and a package subpath stay unflagged in a file that is itself flagged", async () => {
  // Proves oxlint really linted this file rather than skipping it: line 3 is
  // reported, so lines 1 and 2 were seen and approved.
  const result = await lintProbe({
    "src/lib.ts": lib,
    "src/bare.ts": `${bareSpecifiers}\n${importer("./lib")}${bareUsage}`,
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("src/bare.ts:3:1:");
  expect(result.output).not.toContain("src/bare.ts:1:");
  expect(result.output).not.toContain("src/bare.ts:2:");
});

test('a bare "bun" import is flagged, not only the bun: namespace', async () => {
  const result = await lintProbe({ "src/server.ts": importsBunModule("bun") });

  expect(result.code).toBe(1);
  expect(result.output).toContain("no-restricted-imports");
});

/** A probe importing `name` from the module the connection factory lives in. */
function importsProtocolExport(name: string): string {
  return `import { ${name} } from "vscode-languageserver-protocol/node";\nexport const used = ${name};\n`;
}

/**
 * The diagnostic the factory ban produces, BOUND TO ONE FILE AND NAMING THE
 * IMPORT, on one line rather than as independent substrings: in a multi-file run
 * `toContain("no-restricted-imports")` is satisfied by a diagnostic in the OTHER
 * probe file and records nothing.
 *
 * The NAME form is what discriminates the rule this repo wants from a module-wide
 * ban: banning the specifier reports `'vscode-languageserver-protocol/node'
 * import is restricted` and never mentions createProtocolConnection, so this
 * regex fails against it.
 */
function factoryBanAt(path: string): RegExp {
  return new RegExp(
    `${path.replaceAll(".", "\\.")}:\\d+:\\d+: error eslint\\(no-restricted-imports\\): ` +
      `'createProtocolConnection' import from 'vscode-languageserver-protocol/node' is restricted`,
  );
}

/**
 * A diagnostic REPORTED AGAINST `path`, matched at the start of a line.
 *
 * Not the bare path: the rule's own help text names src/notifications.ts as the
 * one module that may create a connection, so a substring check reads that text
 * out of ANOTHER file's diagnostic and reports the file as flagged while it is
 * perfectly clean. Two outcomes, one observation -- caught by running it.
 */
function reportedAgainst(path: string): RegExp {
  return new RegExp(`^${path.replaceAll(".", "\\.")}:`, "m");
}

// RULE 4, the connection factory. THREE HALVES, and none of them is a one-off
// probe: the first says the ban FIRES, the second that the router is EXEMPT, the
// third that the exemption is scoped to a NAME rather than to the specifier.
//
// IT DOES NOT LOOP OVER pathShapes, and that is a decision rather than an
// omission -- do not add the loop for symmetry. At the two shapes where the
// whole rule is switched off, the assertion would be a bare `code === 0`, which
// is equally true of a rule that does not exist, is misconfigured, or never
// matched. That is the degeneracy this file caught twice while rule 4 was being
// written, so the three paths are named here instead, each absence sharing its
// run with a file the ban really flags.
//
// Why a lint at all, when PBI-22 already made src/server.ts unable to CALL
// onNotification: it can still IMPORT the factory, build its own wide connection
// and register beside the table. Measured before this rule existed -- 331 tests
// green, tsc 0, oxlint 0, with nothing objecting.
test("importing createProtocolConnection is flagged in src/server.ts", async () => {
  const result = await lintProbe({
    "src/server.ts": importsProtocolExport("createProtocolConnection"),
  });

  expect(result.output).toMatch(factoryBanAt("src/server.ts"));
  expect(result.code).toBe(1);
});

// THE EXEMPTION, and the router's own import is what needs it: it is the one
// place a connection may be created, because the module that owns the gate owns
// the thing being gated.
//
// TWO FILES IN ONE RUN, deliberately. `src/notifications.ts is unflagged` is
// equally true of a rule that does not exist, is misconfigured, or never
// matched -- and each lintProbe is its own temp dir and its own oxlint, so half
// 1 firing in a DIFFERENT run proves nothing about liveness here. The server.ts
// diagnostic is the presence pair, read off the same measurement.
test("the same import is exempt in src/notifications.ts, in a run where src/server.ts is flagged", async () => {
  const result = await lintProbe({
    "src/notifications.ts": importsProtocolExport("createProtocolConnection"),
    "src/server.ts": importsProtocolExport("createProtocolConnection"),
  });

  expect(result.output).not.toMatch(reportedAgainst("src/notifications.ts"));
  expect(result.output).toMatch(factoryBanAt("src/server.ts"));
  expect(result.code).toBe(1);
});

// THE HALF THAT LOOKS REDUNDANT, AND WHAT IT ACTUALLY BUYS -- corrected against
// the perturbation rather than left as first written. Dropping `importNames`
// reddens ALL THREE halves, MEASURED, so this is NOT the only one that catches a
// module-wide ban. What it is, is the only one that NAMES THE CAUSE: the other
// two fail because an expected diagnostic WORDING is absent, which is equally
// what an oxlint message-format change looks like. This one fails with
// src/reader.ts flagged -- an import nothing ever meant to ban. It is also the
// only half asserting the PERMITTED direction, so it survives any later
// loosening of those two regexes.
//
// The ban is on ONE NAME because three src modules import OTHER names from this
// exact specifier: dropping it takes `oxlint` over the repo to exit 1 with
// diagnostics in src/server.ts, src/methods.ts and src/lifecycle.ts, and reddens
// the two bare-specifier tests above, which import createConnection from it.
//
// Same two-files-in-one-run design as above, for the same reason.
test("a different export from the same module is unflagged, in a run where the factory is flagged", async () => {
  const result = await lintProbe({
    "src/reader.ts": importsProtocolExport("StreamMessageReader"),
    "src/server.ts": importsProtocolExport("createProtocolConnection"),
  });

  expect(result.output).not.toMatch(reportedAgainst("src/reader.ts"));
  expect(result.output).toMatch(factoryBanAt("src/server.ts"));
  expect(result.code).toBe(1);
});
