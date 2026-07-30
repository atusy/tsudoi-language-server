import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  exampleSources,
  type InstalledConsumer,
  installConsumer,
  stageEntries,
} from "./helpers/install.ts";

/**
 * The stakeholder-facing example's own bytes, read at test time. Not a fixture
 * copy: the artifact under test is examples/ itself, and a committed duplicate
 * would drift away from the files a config author reads. Both of them, since
 * the config imports its path-completion module by relative specifier and tsc
 * follows that import whether or not the file is listed.
 */
const example = exampleSources();

/**
 * What a config author outside this repo writes: no relative path into src/.
 *
 * THE DOCUMENTED SHAPE, letter for letter -- the annotated const the README
 * quickstart teaches, type-checked here against the INSTALLED package rather
 * than against this repository's own sources.
 */
const consumerConfig = [
  'import type { TsudoiConfigFactory } from "@atusy/tsudoi/types";',
  "const config: TsudoiConfigFactory = () => Promise.resolve({});",
  "export default config;",
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
// test/installed-runtime.test.ts -- it does, under BOTH runtimes, because the
// package ships compiled .js rather than the sources.
//
// `src/types.ts` is deliberately absent: dist/ is the whole published tree, so
// a user cannot aim a runtime at a .ts file under node_modules even by
// mistake. What deno does when they can is pinned in installed-runtime.
test("the tarball ships the compiled module the exports entry points at, and nothing else", () => {
  expect(existsSync(join(consumer.packageDir, "dist", "types.d.ts"))).toBe(true);
  expect(existsSync(join(consumer.packageDir, "dist", "cli.js"))).toBe(true);
  expect(existsSync(join(consumer.packageDir, "src"))).toBe(false);
  expect(existsSync(join(consumer.packageDir, "test"))).toBe(false);
  // The build needs node_modules in the staging directory to resolve the types
  // of tsudoi's own declared dependencies; `files` is what keeps it out of the
  // tarball, and only this says so.
  expect(existsSync(join(consumer.packageDir, "node_modules"))).toBe(false);
});

/**
 * EVERYTHING THAT TRAVELS FROM THIS REPOSITORY INTO THE THING WE PUBLISH, and
 * the reason it is pinned is what is NOT here.
 *
 * tsconfig.json carries a `paths` mapping resolving `@atusy/tsudoi/*` to src/,
 * so that this repository's own `tsc --noEmit` reads source instead of a built
 * dist/. That mapping is safe ONLY BECAUSE IT CANNOT REACH THE PACKING STAGE:
 * the build here runs under tsconfig.build.json, which carries no mapping (and
 * test/package-shape.test.ts is where that absence is asserted), and the
 * consumer's own type check runs under options that carry none either. Nothing
 * else stopped a fourth path being copied in.
 *
 * node_modules IS ONE OF THE FOUR, MEASURED RATHER THAN TAKEN FROM THE PBI,
 * whose text says three: it is symlinked in because the build must resolve the
 * types of tsudoi's own declared dependencies, and `files` is what keeps it out
 * of the tarball.
 */
const stagedPaths = ["node_modules", "package.json", "src", "tsconfig.build.json"];

test("the pack stage receives package.json, src/ and tsconfig.build.json, and nothing else", () => {
  expect(consumer.stagedEntries).toEqual(stagedPaths);
});

// THE PERMANENT PAIR for the absence above, per the standing rule that an
// assertion that something is NOT there ships with one showing the same
// measurement observes it when it IS. It also answers the narrower question the
// pin cannot: whether a violating entry is REPORTED BY NAME or merely counted.
test("the same reader names a fifth staged path when one is there", () => {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-stage-pair-"));
  try {
    for (const path of [...stagedPaths, "tsconfig.json"]) {
      writeFileSync(join(dir, path), "");
    }

    expect(stageEntries(dir)).toEqual([...stagedPaths, "tsconfig.json"].sort());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
