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
  /** A probe file at that shape; every rule below is exercised at this path. */
  readonly path: string;
  /**
   * Whether `bun:*` imports are exempt there. TRUE only where `bun test` itself
   * needs them -- the exemption's WIDTH is a claim in its own right, since
   * fixture configs execute under deno and must stay Bun-free.
   */
  readonly bunModulesExempt: boolean;
}

/**
 * THE SIX SHAPES, and ONE list drives all three rules.
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
