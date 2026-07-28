import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync, mkdirSync, renameSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { exampleSources, type InstalledConsumer, installConsumer } from "./helpers/install.ts";
import { extractQuickstart, QUICKSTART_STEPS, readReadme } from "./helpers/readme.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

/**
 * WHAT THIS FILE ADDS THAT `tsc --noEmit` DOES NOT.
 *
 * The repo's own type check resolves `@atusy/tsudoi/types` through the exports
 * map's IN-REPO arm -- straight at src/types.ts. What a stranger receives is
 * the COMPILED dist/types.d.ts, and nothing checked the artifacts against that
 * until this file. Everything here is therefore BORN GREEN by design: the
 * snippet and the example already compile, measured twice before the sprint
 * began. What was missing is the CHECK, not a fix, so all of this file's value
 * is in its controls.
 *
 * Every control that CAN fail is a test below. Exactly one is a comment
 * instead, and only because the property it records is FORECLOSED by the
 * staging design rather than assertable -- see the stays-green note further
 * down, and the test that used to stand there and could not fail.
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
  expect(result.output).not.toContain("completion-path.ts");
});

test("a type error in the example reddens the example, not the snippet", async () => {
  const sources = exampleSources();
  const result = await consumer.typeCheck({
    "readme-snippet.ts": readmeSnippet(),
    ...sources,
    "completion-path.ts": withTypeError(sources["completion-path.ts"] ?? ""),
  });

  expect(result.code).not.toBe(0);
  expect(result.output).toContain("completion-path.ts");
  expect(result.output).not.toContain("readme-snippet.ts");
});

/**
 * THE CONTROL THAT PROVES THIS SPRINT DID ITS JOB, and the pair is the whole
 * point. Perturbing the PUBLISHED types must redden the probe WHILE the repo's
 * own `tsc --noEmit` stays green -- without the stays-green half this file is
 * `checked again` wearing the words `checked through the published arm`.
 */
test("perturbing the published types reddens the probe while tsc --noEmit stays green", async () => {
  // THE LEVER IS THE `types` CONDITION, not an edit to src/types.ts: that file
  // is consumed in full by src/, so any change to it fails the build instead of
  // shipping a different surface. Dropping the condition leaves tsc to fall
  // back to `default` -> ./src/types.ts, WHICH THE PACKAGE DOES NOT SHIP
  // (`files` is dist/ alone) -- so a consumer loses the types while this repo,
  // which does have src/, is unaffected. That asymmetry IS the pair.
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
    expect(result.output).toContain("@atusy/tsudoi/types");
  } finally {
    perturbed.dispose();
  }
});

/**
 * The converse: a check pointed at IN-REPO sources cannot observe a change to
 * what ships, so satisfying it proves nothing this file is for.
 */
test("the in-repo arm cannot observe what the published arm checks", async () => {
  const viaRepoSources = await typeCheckProbe({ "probe.ts": readmeSnippet() });

  expect(viaRepoSources.code).toBe(0);
});

/*
 * THE STAYS-GREEN HALF IS GUARANTEED BY CONSTRUCTION, NOT MEASURED, and this
 * comment is here because a test asserting it was DELETED at Sprint 15's
 * Review rather than kept as a signpost.
 *
 * The pair the criterion asks for is `perturbing the published types reddens
 * the probe WHILE tsc --noEmit stays green`. It cannot be tied by one
 * measurement, and that is the STAGING DESIGN rather than a gap: the
 * perturbation is applied to the copy that gets PACKED, so this repository is
 * untouched, and running tsc under the perturbation would be trivially green
 * rather than informative. FORECLOSED, and what would un-foreclose it is
 * perturbing the repo itself -- which the two tests above exist to avoid.
 *
 * The evidence lives in those two: the probe reddens when the published arm
 * breaks, and an in-repo check cannot observe that break at all.
 *
 * The deleted test called runTsc(repoRoot), which IS the `tsc --noEmit` the
 * Definition of Done already runs -- so it could not fail unless the DoD had
 * already failed. A control that cannot fail is not one, and an inert test is
 * how a suite's green stops meaning what it says.
 */

/**
 * THE HOISTING PRECONDITION, asserted rather than assumed.
 *
 * The example imports `vscode-languageserver-protocol` as a bare specifier the
 * consumer never declares, and `CompletionItemKind` is a VALUE import -- so the
 * example needs that package AT RUNTIME, not merely to type-check. It resolves
 * today only because bun HOISTS it as a transitive dependency of @atusy/tsudoi.
 *
 * MEASURED: under a non-hoisting layout tsudoi's own dist/ still resolves it
 * (it is a DECLARED dependency), so a config importing nothing runs fine; only
 * the consumer's own copy of the example fails. That is why the README tells a
 * reader to install the package, and why these probes install it too: the
 * documented route and the verified route are the same route.
 */
function useNonHoistingLayout(dir: string): void {
  const hoisted = join(dir, "node_modules", "vscode-languageserver-protocol");
  const nested = join(dir, "node_modules", "@atusy", "tsudoi", "node_modules");
  mkdirSync(nested, { recursive: true });
  renameSync(hoisted, join(nested, "vscode-languageserver-protocol"));
}

function installProtocolPackage(dir: string): void {
  const nested = join(
    dir,
    "node_modules",
    "@atusy",
    "tsudoi",
    "node_modules",
    "vscode-languageserver-protocol",
  );
  const target = join(dir, "node_modules", "vscode-languageserver-protocol");
  if (!existsSync(target)) {
    symlinkSync(nested, target, "dir");
  }
}

test("without the documented install the example reddens, and tsudoi itself does not", async () => {
  const strict = await installConsumer();
  try {
    useNonHoistingLayout(strict.dir);

    const example = await strict.typeCheck(exampleSources());
    expect(example.code).not.toBe(0);
    expect(example.output).toContain("vscode-languageserver-protocol");

    // The negative case is bounded: a config importing nothing still checks,
    // because tsudoi DECLARES the dependency its own dist/ needs.
    const bare = await strict.typeCheck({
      "bare.config.ts": "export default () => Promise.resolve({ methods: {} });\n",
    });
    expect(bare.code).toBe(0);

    // And the documented step is what repairs it.
    installProtocolPackage(strict.dir);
    const repaired = await strict.typeCheck(exampleSources());
    expect(repaired.code).toBe(0);
  } finally {
    strict.dispose();
  }
});
