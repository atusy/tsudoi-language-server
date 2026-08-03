import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { handlerMembers, trackedReadmes } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type CoverageReading, readmeCoverage } from "./helpers/readme.ts";
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

/** One way of opening a fence: the character run, and the tag it carries. */
interface FenceForm {
  /** What an assertion line says about this form, so a red names the tag. */
  readonly name: string;
  /** The fence character run the block opens and closes on. */
  readonly fence: string;
  /** The info string. It is RECORDED by the sweep and consulted by nothing. */
  readonly info: string;
}

/**
 * THE FORMS EVERY PLANT IS TAKEN IN, AND WHY EACH ONE IS IN THE LIST.
 *
 * `THE INFO STRING DECIDES NOTHING` IS THE RULING THIS SWEEP SHIPS, AND UNTIL
 * THIS LIST IT WAS ARMED AT EXACTLY ONE TAG. Both planted arms below planted
 * ```sh, so the block-level refusal was witnessed for `sh` and for nothing else
 * -- while `text` and `ts` are the tags of the five real blocks this sweep was
 * written against. MEASURED rather than argued, with
 * `if (block.info === "text" || block.info === "ts") { continue; }` added to the
 * sweep's UNREACHED branch alone, the whole suite read 934 pass / 0 fail across
 * 65 files WITH THE ONE-TAG ARMS -- the same reading as the unweakened tree, so
 * the skip was invisible to every arm in this repository. With the list, the
 * same weakening reads 932 pass / 2 fail, THE TWO PLANTED ARMS ALONE, on bun
 * 1.3.13. A ruling written in three places and armed at the one tag it was never
 * in danger over is a claim in prose, which is the defect this item exists to
 * refuse -- reproduced, here, by this item's own fix.
 *
 * NO REGISTRY ROW CAN CARRY THAT WEAKENING, WHICH IS WHY IT IS A LIST AND NOT A
 * RECORD: `reRun` refuses any arm file that imports helpers/perturbation.ts, and
 * every arm over this sweep must import it -- they stage. So the weakening is
 * carried where the dashboard header permits it, beside the arms it reddens,
 * exactly as the untracked-file arm further down carries its own.
 */
const fenceForms: readonly FenceForm[] = [
  // THE TAG EVERY EXTRACTOR HERE ALREADY ROUTES ON, and the only one these arms
  // planted before this list existed. It is kept first so the list reads as a
  // widening of the arm rather than as a replacement of it.
  { name: "sh", fence: "```", info: "sh" },
  // TWO OF THE FIVE BLOCKS THIS SWEEP FOUND UNCONSUMED ARE ```ts, and the
  // quickstart's `write=` step is a ```ts block that IS executed -- which is the
  // refutation the exempt-tag list died on. It belongs in an arm and not only in
  // the prose that records the reversal.
  { name: "ts", fence: "```", info: "ts" },
  // THE DRAWING'S TAG, AND THE THIRD OF THE FIVE. `text` is what a writer
  // reaches for when the block is not a program, which is the moment an
  // exemption looks harmless and is therefore the moment one gets written.
  { name: "text", fence: "```", info: "text" },
  // A TILDE FENCE, because the reader was widened to see one on the ground that
  // missing `~~~sh` fails toward PERMITTING -- the one direction this sweep
  // cannot accept -- and no arm planted one until now, so the widening was
  // carried by the reader's own docstring alone. WHAT ARMS IT IS THE PLANTED
  // TEXT AND NOT THE ECHOED TAG, which this entry's `info` deliberately shares
  // with the first: MEASURED with `~{3,}` struck from `fencedBlocks`'s needle,
  // the two planted arms read 8 pass / 2 fail in this file, because a reader
  // blind to tildes reports no block and the text goes missing from the refusal.
  { name: "a tilde fence", fence: "~~~", info: "sh" },
  // NO INFO STRING AT ALL: what a tag-keyed skip reads as the empty string, and
  // what a writer produces without deciding anything. A list of exempt tags and
  // a list of required ones both have to say something about this state, and
  // neither this sweep nor these arms may.
  { name: "no info string", fence: "```", info: "" },
];

/** The one line a planted block carries -- what its refusal must echo back. */
function plantedText(form: FenceForm): string {
  return `echo this-block-is-reached-by-nothing-${form.name.replaceAll(" ", "-")}`;
}

function plantedBlock(form: FenceForm): string {
  return [
    `\n## A section nobody wrote a marker for (${form.name})\n`,
    `\n${form.fence}${form.info}\n${plantedText(form)}\n${form.fence}\n`,
  ].join("");
}

/** Every form, planted into one document IN THE STAGE, in one write. */
function plantInto(stage: ThrowawayPath, document: string): void {
  const before = readFileSync(join(stage, document), "utf8");
  writeInThrowaway(stage, document, `${before}${fenceForms.map(plantedBlock).join("")}`);
}

/**
 * Every planted form refused, NAMED ON THE ASSERTION LINE so a tag that stopped
 * being refused says WHICH ONE rather than `expected true`.
 *
 * THE SECOND ASSERTION IS WHAT KEEPS THE TAG RECORDED WITHOUT LETTING IT DECIDE:
 * the refusal echoes the info string back -- the whole of what the sweep does
 * with it -- so a reader looking for where the tag is used finds a message and
 * never a branch.
 */
function expectEveryFormRefused(reading: CoverageReading): void {
  const reported = reading.offenders.map((offence) => offence.report).join("\n");
  // THE PRESENCE HALF, WHICH THE REFUSING DIRECTION NEEDS AS MUCH AS THE EMPTY
  // ONE: a sweep that answered five offences out of a table lookup, having
  // opened nothing, satisfies every line below. The count is over the plant's
  // own forms because each document already carried blocks before it.
  expect(reading.blocksRead).toBeGreaterThan(fenceForms.length);
  for (const form of fenceForms) {
    expect(`${form.name}: ${String(reported.includes(plantedText(form)))}`).toBe(
      `${form.name}: true`,
    );
    expect(reported).toContain(`\`${form.info}\` block no consumer reaches`);
  }
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
  expectEveryFormRefused(reading);
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
  expectEveryFormRefused(reading);
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
 * A MARKER IS NOT AN ACCOUNT, AND A ROW WHOSE PROJECTION COMES BACK EMPTY DOES
 * NOT COVER THE BLOCK IT WAS POINTED AT.
 *
 * THIS ARM EXISTS BECAUSE THE CLAIM WAS ALREADY WRITTEN DOWN IN THREE PLACES --
 * the table's own docstring, this sprint's record, and the skill -- and asserted
 * by nothing, which is the exact defect this item was filed for: a coverage
 * claim taken on recollection. The subject is a marked `ts` block with no
 * import, which the snippet row's projection answers `[]` about.
 *
 * THE TWO REFUSALS MUST NOT PRINT ALIKE, and that is what the second assertion
 * reads: a block nothing REACHES and a block that is reached by a row which then
 * accounts for none of it are different states, and a sweep printing one
 * sentence for both would be one red wearing two names.
 */
test("a marked block whose account projects nothing is refused, and not as an unreached one", () => {
  const stage = stageWithIndex();
  const before = readFileSync(join(stage, "README.md"), "utf8");
  const unaccountable =
    "\n## Marked, and about nothing\n\n<!-- snippet -->\n\n```ts\nconst nothing = 1;\n```\n";
  writeInThrowaway(stage, "README.md", `${before}${unaccountable}`);
  indexEverything(stage);

  const reported = readmeCoverage(stage)
    .offenders.map((offence) => offence.report)
    .join("\n");

  expect(reported).toContain("whose projection answers nothing at all");
  expect(reported).not.toContain("no consumer reaches");
});

/**
 * THE PRESENCE HALF OF THE ARM ABOVE, and it is what stops that refusal being
 * satisfied by a sweep that refuses every marked block: the SAME block, one
 * import later, is accounted for and reported by nothing.
 */
test("the same block with one import to name is accounted for, and goes unreported", () => {
  const stage = stageWithIndex();
  const before = readFileSync(join(stage, "README.md"), "utf8");
  const accounted =
    '\n## Marked, and about something\n\n<!-- snippet -->\n\n```ts\nimport { TextDocument } from "vscode-languageserver-textdocument";\n\nconst nothing = TextDocument;\n```\n';
  writeInThrowaway(stage, "README.md", `${before}${accounted}`);
  indexEverything(stage);

  const reading = readmeCoverage(stage);

  expect(reading.offenders.map((offence) => offence.report)).toEqual([]);
  expect(reading.blocksRead).toBeGreaterThan(0);
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
