import { expect, test } from "bun:test";
import { lintProbe } from "./helpers/lint.ts";

const lib = 'export const hello = () => "hi";\n';

function importer(specifier: string): string {
  return `import { hello } from "${specifier}";\nexport const greet = () => hello();\n`;
}

// node:url is a runtime builtin; vscode-languageserver-protocol/node is a package
// subpath. Both are bare specifiers that import/extensions must leave alone.
const bareSpecifiers = [
  'import { fileURLToPath } from "node:url";',
  'import { createConnection } from "vscode-languageserver-protocol/node";',
].join("\n");
const bareUsage = "export const used = [fileURLToPath, createConnection];\n";

test("a relative import without .ts is flagged, naming the file it is in", async () => {
  const result = await lintProbe({ "src/lib.ts": lib, "src/main.ts": importer("./lib") });

  expect(result.code).toBe(1);
  expect(result.output).toContain("import(extensions)");
  expect(result.output).toContain("src/main.ts");
});

test("the same relative import carrying .ts is not flagged", async () => {
  const result = await lintProbe({ "src/lib.ts": lib, "src/main.ts": importer("./lib.ts") });

  expect(result.code).toBe(0);
});

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

// The overrides entry turns one rule off for these paths. `plugins` is declared
// only at the top level, so this asserts the plugin rule still reaches inside
// that scope -- otherwise import/extensions would be silently dead across every
// test file and helper, half the repo's TypeScript.
for (const path of ["test/probe.test.ts", "test/helpers/probe.ts"]) {
  test(`a relative import without .ts is still flagged in ${path}`, async () => {
    const result = await lintProbe({
      "test/lib.ts": lib,
      "test/helpers/lib.ts": lib,
      [path]: importer("./lib"),
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("import(extensions)");
    expect(result.output).toContain(path);
  });
}

// The four shapes a .ts file can take in this repo. The Bun global is banned at
// every one of them, so the ABSENCE of an exemption is what these assert; each
// path is named so a leak reports which shape leaked.
const pathShapes = [
  "src/server.ts",
  "test/probe.test.ts",
  "test/helpers/probe.ts",
  "test/fixtures/probe.ts",
];

for (const path of pathShapes) {
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

function importsBunModule(specifier: string): string {
  return `import { Database } from "${specifier}";\nexport const db = Database;\n`;
}

// bun:* imports are exempted only where `bun test` needs them. Both halves are
// under test: that the exemption exists, and that it is no wider -- fixture
// configs execute under deno, so test/fixtures/ must stay Bun-free.
for (const path of ["src/server.ts", "test/fixtures/probe.ts"]) {
  test(`a bun:sqlite import is flagged in ${path}`, async () => {
    const result = await lintProbe({ [path]: importsBunModule("bun:sqlite") });

    expect(result.code).toBe(1);
    expect(result.output).toContain("no-restricted-imports");
    expect(result.output).toContain(path);
  });
}

for (const path of ["test/probe.test.ts", "test/helpers/probe.ts"]) {
  test(`a bun:sqlite import is exempt in ${path}`, async () => {
    const result = await lintProbe({ [path]: importsBunModule("bun:sqlite") });

    expect(result.code).toBe(0);
  });
}

test('a bare "bun" import is flagged, not only the bun: namespace', async () => {
  const result = await lintProbe({ "src/server.ts": importsBunModule("bun") });

  expect(result.code).toBe(1);
  expect(result.output).toContain("no-restricted-imports");
});
