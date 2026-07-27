import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { type InstalledConsumer, installConsumer } from "./helpers/install.ts";

/** What a config author outside this repo writes: no relative path into src/. */
const consumerConfig = [
  'import type { Tsudoi, TsudoiConfig } from "@atusy/tsudoi/types";',
  "export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => Promise.resolve({});",
  "",
].join("\n");

let consumer: InstalledConsumer;

beforeAll(async () => {
  consumer = await installConsumer();
});

afterAll(() => {
  consumer.dispose();
});

// The story is `a stranger imports our types`. Self-reference proves it from
// inside the repo, where the package.json is already on the resolution path;
// only a packed-and-installed copy proves it from outside.
test("a config in an installed consumer type-checks against @atusy/tsudoi/types", async () => {
  const result = await consumer.typeCheck({ "tsudoi.config.ts": consumerConfig });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

// Proves the check above ran over the probe at all: a tsc that resolved
// nothing and a tsc that compiled nothing both exit 0.
test("a deliberate type error in the installed consumer is reported", async () => {
  const result = await consumer.typeCheck({
    "tsudoi.config.ts": `${consumerConfig}export const wrong: number = "not a number";\n`,
  });

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2322");
  expect(result.output).not.toContain("TS2307");
});

// SCOPE, and it is deliberate: this asserts what the tarball CONTAINS, never
// that the installed copy RUNS. An installed copy cannot run under Deno today
// (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), which is its own backlog item;
// asserting it here would import that defect into this one.
test("the tarball ships the module the exports entry points at, and no test tree", () => {
  expect(existsSync(join(consumer.packageDir, "src", "types.ts"))).toBe(true);
  expect(existsSync(join(consumer.packageDir, "test"))).toBe(false);
});

// The paired control for the installed case, perturbing what gets PACKED rather
// than what got installed -- the claim under test is about what this repo
// publishes, not about a directory on this machine.
test("dropping ./types from the packed exports makes the consumer fail with TS2307", async () => {
  const perturbed = await installConsumer((packageJson) => {
    packageJson.exports = {};
  });
  try {
    const result = await perturbed.typeCheck({ "tsudoi.config.ts": consumerConfig });

    expect(result.code).toBe(1);
    expect(result.output).toContain("error TS2307");
    expect(result.output).toContain("@atusy/tsudoi/types");
  } finally {
    perturbed.dispose();
  }
});
