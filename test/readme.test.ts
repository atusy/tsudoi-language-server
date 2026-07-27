import { expect, test } from "bun:test";
import { denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import {
  extractQuickstart,
  QUICKSTART_STEPS,
  readReadme,
  runQuickstart,
  sequenceFor,
} from "./helpers/readme.ts";

await requireRuntime(denoRuntime);

const readme = readReadme();

// The extractor is what makes every criterion in PBI-8 non-vacuous, so its own
// count guard is asserted before anything reads what it found.
test("the README's quickstart yields the expected number of marked steps", () => {
  const steps = extractQuickstart(readme, QUICKSTART_STEPS);

  expect(steps).toHaveLength(QUICKSTART_STEPS);
  // Named rather than counted: `5 steps` would still hold if the write step and
  // a run step swapped kinds, and the sequence a reader follows would not.
  expect(steps.map((step) => step.kind)).toEqual(["run", "run", "write", "run", "run"]);
  expect(
    steps.flatMap((step) => (step.kind === "run" && step.starts ? [step.starts] : [])),
  ).toEqual(["bun", "deno"]);
});

/**
 * THE PAIRED POSITIVE CONTROL, permanent rather than a one-time perturbation:
 * an extractor that finds nothing would make `every extracted command succeeds`
 * VACUOUSLY TRUE, and the README could then rot exactly as if the tests held
 * their own copy of it.
 *
 * The probe is THIS README with its markers deleted, not a hand-written string:
 * that is the actual way the mechanism would break -- someone edits the
 * document and the markers go with the edit -- and a hand-written probe would
 * prove only that the regex fails on prose it was never pointed at.
 */
test("a README whose markers are gone extracts nothing, and says so", () => {
  const unmarked = readme.replaceAll("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(unmarked, QUICKSTART_STEPS)).toThrow(
    `README quickstart: expected ${String(QUICKSTART_STEPS)} marked blocks, found 0`,
  );
});

// The other end of the same guard: finding SOME of them is not finding them.
test("a README missing one marked step extracts fewer, and says so", () => {
  const short = readme.replace("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(short, QUICKSTART_STEPS)).toThrow(
    `found ${String(QUICKSTART_STEPS - 1)}`,
  );
});

/**
 * The working directory a step runs in is stated TWICE -- once in the marker
 * the test obeys, once in the prose the reader obeys -- and two copies is the
 * defect this whole PBI exists to prevent, reintroduced by the extraction
 * mechanism itself. The extractor refuses a marker whose directory the reader
 * is never shown; this asserts that the refusal works.
 */
test("a directory named only in a marker is refused", () => {
  const hidden = readme.replaceAll("in=tsudoi-language-server", "in=elsewhere");

  expect(() => extractQuickstart(hidden, QUICKSTART_STEPS)).toThrow("elsewhere");
});

/**
 * CRITERION 1. The commands are not mirrored here: they are the README's own
 * bytes, run in order, in a staged environment that supplies NOTHING the README
 * asks the reader to do -- no tarball, no node_modules, no config file. A
 * checkout of this repository with its dependencies installed is the one thing
 * staged, and the README names it as a prerequisite rather than a step.
 *
 * Both runtimes, because "starts under bun and deno" is the product goal's own
 * metric and a route only bun can take looks healthy from bun.
 */
for (const runtime of ["bun", "deno"] as const) {
  test(`the README's quickstart brings up a server under ${runtime}`, async () => {
    const outcome = await runQuickstart(
      sequenceFor(extractQuickstart(readme, QUICKSTART_STEPS), runtime),
    );

    // Falls back to the diagnosis rather than to undefined so a broken step
    // reports WHICH command failed and with what, on the assertion line.
    expect(outcome.serverName ?? outcome.diagnosis).toBe("tsudoi");
    // Counted, not eyeballed: one stray byte on stdout desyncs a real editor.
    expect(outcome.unframedStdoutBytes).toBe(0);
  });
}
