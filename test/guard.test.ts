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
