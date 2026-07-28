import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { exampleSources, type InstalledConsumer, installConsumer } from "./helpers/install.ts";

/**
 * The stakeholder-facing example's own bytes, read at test time. Not a fixture
 * copy: the artifact under test is examples/ itself, and a committed duplicate
 * would drift away from the files a config author reads. Both of them, since
 * the config imports its path-completion module by relative specifier and tsc
 * follows that import whether or not the file is listed.
 */
const example = exampleSources();

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

// THE STORY, end to end: a config author copies the example into their own
// project and it type-checks there. This is what defends the example's switch
// to the published specifier -- and it is the ONLY thing that can. Reverting it
// to `../src/types.ts` leaves the DoD's tsc green (that path resolves in-repo)
// and leaves both runtimes green (the import is type-only and erased before
// either resolves anything, measured). Only a consumer with no ../src above it
// can tell the two spellings apart.
test("the example itself, copied into an installed consumer, type-checks unchanged", async () => {
  const result = await consumer.typeCheck(example);

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

// The pair for the assertion above: proves it is really discriminating on the
// specifier, and not passing for any consumer config at all.
test("the same example spelled with a relative path into src fails in a consumer", async () => {
  const config = example["tsudoi.config.ts"] ?? "";
  const relative = config.replace('"@atusy/tsudoi/types"', '"../src/types.ts"');
  expect(relative).not.toBe(config);

  const result = await consumer.typeCheck({ ...example, "tsudoi.config.ts": relative });

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2307");
  expect(result.output).toContain("../src/types.ts");
});

// SCOPE: this file asserts what the tarball CONTAINS and what type-checks
// against it. That the installed copy RUNS is asserted in
// test/installed-runtime.test.ts -- it now does, under both runtimes, which is
// what sprint 10 changed. The note this comment used to carry, that an
// installed copy cannot run under deno, was true until the package started
// shipping compiled .js and is retained nowhere.
//
// `src/types.ts` is deliberately absent: dist/ is the whole published tree, so
// a user cannot aim a runtime at a .ts file under node_modules even by
// mistake. What deno does when they can is pinned in installed-runtime.
test("the tarball ships the compiled module the exports entry points at, and nothing else", () => {
  expect(existsSync(join(consumer.packageDir, "dist", "types.d.ts"))).toBe(true);
  expect(existsSync(join(consumer.packageDir, "dist", "cli.js"))).toBe(true);
  expect(existsSync(join(consumer.packageDir, "src"))).toBe(false);
  expect(existsSync(join(consumer.packageDir, "test"))).toBe(false);
  // The build needs node_modules in the staging directory to resolve
  // vscode-languageserver-protocol's types; `files` is what keeps it out of
  // the tarball, and only this says so.
  expect(existsSync(join(consumer.packageDir, "node_modules"))).toBe(false);
});

// The paired control for the installed case, perturbing what gets PACKED rather
// than what got installed -- the claim under test is about what this repo
// publishes, not about a directory on this machine.
test("dropping ./types from the packed exports makes the consumer fail with TS2307", async () => {
  const perturbed = await installConsumer({
    editPackage: (packageJson) => {
      packageJson.exports = {};
    },
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
