import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { handlerMembers, trackedReadmes } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { readmeCoverage } from "./helpers/readme.ts";
import {
  stageCheckout,
  type ThrowawayPath,
  throwawayOnly,
  writeInThrowaway,
} from "./helpers/perturbation.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE ARMS OVER THE SWEEP, AND NOT ONE OF THEM EDITS A TRACKED README.
 *
 * An arm that mutated a version-controlled file in order to fire has a recorded
 * history in this repository of measuring nothing, and here it would also race
 * every other file in the suite -- test/readme.test.ts reads the same document
 * in the same run. `readReadme()`'s hardcoded path is exactly how this sprint
 * would have fallen into it, which is why the sweep takes a ROOT.
 *
 * THE STAGE IS `stageCheckout()`, WHOSE RETURN IS BRANDED. Every mutating end
 * reached from here demands that brand and re-asks the guard behind it, because
 * this repository lost a working tree to a staging function that handed back the
 * checkout root and a recursive delete that asked nothing.
 *
 * IT GETS A `.git` OF ITS OWN RATHER THAN A COPY OF THIS ONE. The sweep's class
 * is TRACKED READMEs, which is a question only an index can answer, and the
 * foreclosure this repository already paid for is on copying the real `.git` in
 * or pointing a stager at the checkout -- neither of which is `git init` in a
 * directory this module made.
 */

const staged: (() => void)[] = [];

afterEach(() => {
  for (const dispose of staged.splice(0)) {
    dispose();
  }
});

/** A staged checkout with an index of its own, so `git ls-files` can answer in it. */
function stageWithIndex(): ThrowawayPath {
  const stage = stageCheckout();
  staged.push(stage.dispose);
  indexEverything(stage.root);
  return stage.root;
}

/** A stage with every tracked file copied and NO index -- the not-a-checkout state. */
function stageWithoutIndex(): ThrowawayPath {
  const stage = stageCheckout();
  staged.push(stage.dispose);
  return stage.root;
}

function indexEverything(stage: ThrowawayPath): void {
  // THE GUARD IS RE-ASKED AT THE CALL AND NOT TRUSTED FROM THE TYPE, for the
  // reason the module it comes from records: `stage as ThrowawayPath` is one
  // token, and `git init` in the wrong directory writes.
  const cwd = throwawayOnly(stage);
  for (const args of [
    ["init", "-q"],
    ["add", "-A"],
  ]) {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed in the stage: ${result.stderr}`);
    }
  }
}

/** A fenced block no marker names, appended to a document IN THE STAGE. */
const plantedText = "echo this-block-is-reached-by-nothing";
const plantedBlock = `\n## A section nobody wrote a marker for\n\n\`\`\`sh\n${plantedText}\n\`\`\`\n`;

function plantInto(stage: ThrowawayPath, document: string): void {
  const before = readFileSync(join(stage, document), "utf8");
  writeInThrowaway(stage, document, `${before}${plantedBlock}`);
}

/** One handler package's README, as a path relative to the root, enumerated. */
function aHandlersReadme(root: string): string {
  const [member] = handlerMembers(root);
  if (member === undefined) {
    throw new Error("no handler package for this arm to plant into");
  }
  return join("packages", basename(member), "README.md");
}

/**
 * THE PLANT IS STAGED BECAUSE THE PREMISE THE CRITERION WAS WRITTEN ON TURNED
 * OUT FALSE.
 *
 * It assumed every block in this tree today is reached or declared, so an
 * instrument had to be given a witness before it could be believed. MEASURED
 * while planning and confirmed by running the shipped sweep: FIVE blocks had no
 * consumer at all -- the root layout drawing, both root `ts` blocks and each
 * handler's `ts` config -- so the sweep was red at five real sites before
 * anything was planted. The plant survives anyway, and for the reason it was
 * asked for: those five are now consumed, and a witness that cannot fail
 * measures nothing.
 */
test("a fenced block the root README nobody marked is refused, naming the document and its text", () => {
  const stage = stageWithIndex();
  plantInto(stage, "README.md");
  indexEverything(stage);

  const reading = readmeCoverage(stage);

  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain("README.md:");
  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(plantedText);
});

// THE SECOND DOCUMENT, AND IT IS NOT THE SAME ARM TWICE: the root README is
// reached through one pairing spelled here, a member's through an ENUMERATION,
// and a sweep that only ever opened the document it was pointed at satisfies the
// arm above and not this one.
test("a fenced block nobody marked in a MEMBER's README is refused, naming that document", () => {
  const stage = stageWithIndex();
  const document = aHandlersReadme(stage);
  plantInto(stage, document);
  indexEverything(stage);

  const reading = readmeCoverage(stage);

  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(`${document}:`);
  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(plantedText);
});

/**
 * THE UNPLANTED PAIR, WITH ITS PRESENCE HALF, and the presence half is what
 * makes the absence mean anything: an empty offender list and a reader that
 * opened nothing are the same observation without it.
 */
test("the same tree unplanted has no block anything failed to reach", () => {
  const stage = stageWithIndex();

  const reading = readmeCoverage(stage);

  expect(reading.offenders.map((offence) => offence.report)).toEqual([]);
  expect(reading.documentsRead).toBeGreaterThan(0);
  expect(reading.blocksRead).toBeGreaterThan(0);
});

/**
 * A README AT A PATH NO ENUMERATION IN THIS REPOSITORY KNOWS, REFUSED BY NAME.
 *
 * `packages/` IS WHERE IT IS PLANTED BECAUSE THAT IS WHERE IT IS PLAUSIBLE: a
 * directory under `packages/` carrying a README and no manifest is what a
 * half-finished package looks like, and every member enumeration here answers
 * `not a member` about it. A sweep built on those enumerations would call it
 * covered; this one calls it unpaired.
 */
test("a tracked README no pairing names is refused, naming its path", () => {
  const stage = stageWithIndex();
  const orphan = "packages/tsudoi-nowhere/README.md";
  writeInThrowaway(stage, orphan, "# nowhere\n\nA package that is not one yet.\n");
  indexEverything(stage);

  const reading = readmeCoverage(stage);

  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(orphan);
  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(
    "no consumer is paired with",
  );
});

/**
 * A KNOWN, WELL-FORMED MARKER DOES NOT CLEAR A DOCUMENT NOBODY OPENS, AND THIS
 * IS THE ARM THAT ENFORCES `THE SWEEP MAY NOT BE ITS OWN CALLER`.
 *
 * A sweep that ran the extractors over each tracked README and cleared whatever
 * matched would certify a document nothing in this suite ever reads -- the
 * author's-intention failure with the marker swapped for the sweep's own run.
 * The marker planted here is one this repository really uses, spelled exactly as
 * the working documents spell it, above a block it really would match.
 */
test("a marker no test opens does not clear the document that carries it", () => {
  const stage = stageWithIndex();
  const orphan = "packages/tsudoi-nowhere/README.md";
  writeInThrowaway(
    stage,
    orphan,
    "# nowhere\n\n<!-- examples-install -->\n\n```sh\nbun install ../tsudoi-language-server/tsudoi-nowhere.tgz\n```\n",
  );
  indexEverything(stage);

  const reading = readmeCoverage(stage);

  // THE DOCUMENT'S OWN REFUSAL AND NOT THE BLOCK'S, read rather than inferred
  // from the path being echoed: a sweep that had cleared the document and then
  // refused its block would print that path too, and the two readings are only
  // separable by WHICH sentence arrives.
  expect(reading.offenders.map((offence) => offence.report).join("\n")).toContain(
    `${orphan} is a tracked README that no consumer is paired with`,
  );
});

/**
 * AN UNTRACKED FILE IS NOT SWEPT, AND THE SAME FILE TRACKED IS -- ONE ARM,
 * BECAUSE THE FIRST HALF ALONE IS SATISFIED BY A SWEEP THAT LOOKS AT NOTHING.
 *
 * THE ADJACENT WEAKER READING THIS ARM IS THE RED FOR: a `readdirSync` walk for
 * files named README.md. It answers identically on every document this
 * repository ships and differs on exactly one thing -- a file the index has
 * never heard of -- so this pair is where it fails. It is recorded HERE, beside
 * the arm, rather than as a row in the perturbation registry: `reRun` refuses
 * any arm file that imports helpers/perturbation.ts, and this one must, so a row
 * naming an arm here could never be applied.
 */
test("a README the index has never heard of is not swept, and is the moment it is added", () => {
  const stage = stageWithIndex();
  const orphan = "packages/tsudoi-nowhere/README.md";
  writeInThrowaway(stage, orphan, "# nowhere\n");

  const untracked = readmeCoverage(stage);

  expect(untracked.offenders.map((offence) => offence.report)).toEqual([]);
  expect(trackedReadmes(stage)).not.toContain(orphan);
  // AND THE PRESENCE HALF ON THE SAME FILE, IN THE SAME TREE, THROUGH THE SAME
  // MEASUREMENT: everything above is also true of a sweep that enumerates
  // nothing at all.
  indexEverything(stage);

  expect(trackedReadmes(stage)).toContain(orphan);
  expect(
    readmeCoverage(stage)
      .offenders.map((offence) => offence.report)
      .join("\n"),
  ).toContain(orphan);
});

/**
 * A DIRECTORY THAT IS NOT A CHECKOUT THROWS, AND IS NOT REPORTED AS A TREE WITH
 * NOTHING IN IT.
 *
 * `I found no README` and `I was given no way to find them` are the same exit 0
 * without this, which is the asymmetry `checkoutPaths` already keeps and the
 * reason `trackedReadmes` was built on it rather than beside it. The subject is
 * as narrow as it can be made: a stage holding EVERY tracked file, whose only
 * unusual property is that no `git init` has run in it.
 */
test("the enumeration refuses a directory that is not a checkout, rather than answering empty", () => {
  const stage = stageWithoutIndex();

  expect(() => trackedReadmes(stage)).toThrow(/could not be enumerated as a checkout/);
  expect(() => readmeCoverage(stage)).toThrow(/could not be enumerated as a checkout/);
  // THE PAIR: the same directory, one `git init` later, answers.
  indexEverything(stage);

  expect(trackedReadmes(stage)).toContain("README.md");
  expect(readmeCoverage(stage).documentsRead).toBeGreaterThan(0);
});

/**
 * THE SWEEP OVER THIS REPOSITORY ITSELF, which is the reading the whole item is
 * for and the one no staged plant can stand in for.
 */
test("every fenced block in every tracked README of this checkout is reached or accounted for", () => {
  const reading = readmeCoverage(repoRoot);

  expect(reading.offenders.map((offence) => offence.report)).toEqual([]);
  expect(reading.documentsRead).toBeGreaterThan(0);
  expect(reading.blocksRead).toBeGreaterThan(0);
});
