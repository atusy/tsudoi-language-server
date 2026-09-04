import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as Record<string, unknown>;

test("the package publishes one built entry point", () => {
  expect(manifest.exports).toEqual({
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
  });
  expect(manifest.files).toEqual(["dist"]);
});

test("tsudoi is the required peer from this alpha set", () => {
  expect(manifest.peerDependencies).toEqual({
    "@atusy/tsudoi-language-server": "0.1.0-alpha.0",
  });
  expect(manifest.peerDependenciesMeta).toBeUndefined();
  expect(manifest.dependencies).toBeUndefined();
});

test("packing clears stale output before compiling", () => {
  expect(manifest.scripts).toEqual({ prepack: "rm -rf dist && tsc -p tsconfig.build.json" });
});
