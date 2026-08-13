import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as Record<string, unknown>;

test("the package publishes its built entry point, capture scripts, and notices", () => {
  expect(manifest.exports).toEqual({
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
  });
  expect(manifest.files).toEqual(["capture", "dist", "THIRD_PARTY_NOTICES.md"]);
});

test("tsudoi is an optional peer while it is unpublished", () => {
  expect(manifest.peerDependencies).toEqual({ "@atusy/tsudoi-language-server": "*" });
  expect(manifest.peerDependenciesMeta).toEqual({
    "@atusy/tsudoi-language-server": { optional: true },
  });
  expect(manifest.dependencies).toBeUndefined();
});

test("packing clears stale output before compiling", () => {
  expect(manifest.scripts).toEqual({ prepack: "rm -rf dist && tsc -p tsconfig.build.json" });
});
