import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import {
  applyWeakening,
  type ArmFileRun,
  line,
  type PerturbationRecord,
  read,
  reRun,
  runArmFile,
  stageCheckout,
  takeBaseline,
  throwawayOnly,
  type Weakening,
} from "./helpers/perturbation.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE ARMS OVER THE RE-RUNNER, driven against a throwaway probe whose arms this
 * file writes.
 *
 * WHY A THROWAWAY AND NOT THIS SUITE'S OWN ARMS: the states this instrument
 * exists for -- an arm that stays green under its own weakening, an arm already
 * red before it, a weakening that stops the file being read at all -- are states
 * no arm in this repository is in. An instrument whose witness cannot fail
 * measures nothing, so the witnesses are built.
 *
 * EVERY ARM BELOW CARRIES ITS DISCRIMINATION AS AN ASSERTION AND NOT AS THE
 * ARRANGEMENT OF ITS PROBE, which is the whole of what this sprint's reading
 * bought. A probe in which the named arm stays green while another reddens
 * separates `the named arm reddened` from `the run reddened` -- but only while
 * it does, and nothing announces the day an edit makes every arm in it redden.
 * So the pair is written down: the run's own exit is non-zero AND the named
 * arm's own result is a pass. That pair IS the recorded perturbation for these
 * arms, and it re-runs with the suite.
 */

const staged: string[] = [];

afterEach(() => {
  for (const root of staged.splice(0)) {
    // THE SWEEP REFUSES A PATH IT WAS NOT BUILT FOR RATHER THAN DELETING IT.
    // Written after the deletion this repository actually suffered: a hand-run
    // perturbation made a staging function hand back the CHECKOUT ROOT, and this
    // loop -- three lines away from anything that knew what the value was --
    // removed the working tree and its `.git`. A recursive delete whose argument
    // arrives from somewhere else is a hazard whatever produced it.
    rmSync(throwawayOnly(root), { recursive: true, force: true });
  }
});

/** The probe's arms, by tag, so a record can name one without spelling it twice. */
const probeArms = {
  alpha: "alpha requires the limit to be exactly 2",
  beta: "beta requires the limit to be at least 1",
  broken: "broken is red before anything is weakened",
} as const;

type ProbeTag = keyof typeof probeArms;

const probeBodies: Record<ProbeTag, string> = {
  alpha: "expect(limit).toBe(2);",
  beta: "expect(limit >= 1).toBe(true);",
  broken: "expect(limit).toBe(99);",
};

/** The file a weakening edits in the probe, and the arm file that reads it. */
const probeTarget = "target.ts";
const probeFile = "probe.test.ts";

/**
 * A throwaway holding one value and the arms that read it.
 *
 * OUTSIDE THE REPOSITORY, for the reason test/suite-deadline.test.ts already
 * records: a tree under test/ would be swept by this suite's own enumerations
 * and would put a second [test] section where the build lives.
 */
function stageProbe(tags: readonly ProbeTag[]): string {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-probe-"));
  staged.push(root);
  writeFileSync(join(root, probeTarget), "export const limit = 2;\n");
  writeFileSync(
    join(root, probeFile),
    [
      'import { expect, test } from "bun:test";',
      'import { limit } from "./target.ts";',
      ...tags.map(
        (tag) => `test(${JSON.stringify(probeArms[tag])}, () => { ${probeBodies[tag]} });`,
      ),
      "",
    ].join("\n"),
  );
  return root;
}

/** One step weaker: the value every probe arm reads, moved by one. */
const weakenToOne: Weakening = {
  file: probeTarget,
  from: "export const limit = 2;",
  to: "export const limit = 1;",
};

/** Two steps, which is what makes a SECOND arm redden beside the named one. */
const weakenToZero: Weakening = { ...weakenToOne, to: "export const limit = 0;" };

/** A weakening that stops the probe file being read at all. */
const weakenToNothing: Weakening = { ...weakenToOne, to: "export const limit = ;" };

function recordOver(
  tag: ProbeTag,
  weakening: Weakening,
  alsoReddens: readonly string[] = [],
): PerturbationRecord {
  return { arm: { file: probeFile, name: probeArms[tag] }, weakening, alsoReddens };
}

/** Baseline, weakening, second run -- the sequence every arm below reads. */
async function bothRuns(
  root: string,
  weakening: Weakening,
): Promise<{ before: ArmFileRun; after: ArmFileRun }> {
  const before = await runArmFile(root, probeFile);
  applyWeakening(root, weakening);
  return { before, after: await runArmFile(root, probeFile) };
}

test("a named arm that stays GREEN under its weakening reads GONE QUIET", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const reading = read(recordOver("beta", weakenToOne), before, after);
  // THE DISCRIMINATION, WRITTEN DOWN RATHER THAN ARRANGED. The weaker reading of
  // `the named arm reddened` is `the run reddened`, and these two lines are what
  // make the probe separate them: something in this run IS red, and the arm the
  // record names is not it. Delete either line and an edit that makes every
  // probe arm redden leaves this arm green while the instrument reads a colour
  // that belongs to `alpha`.
  expect(after.exit).not.toBe(0);
  expect(reading.after).toBe("passed");
  expect(reading.verdict).toBe("gone quiet");
  expect(reading.detail).toContain(probeArms.beta);
});

test("a named arm already red WITHOUT its weakening reads DISARMED", async () => {
  const root = stageProbe(["alpha", "broken"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const reading = read(recordOver("broken", weakenToOne, [probeArms.alpha]), before, after);
  // THE PAIR HERE IS THE OTHER DIRECTION: the required red IS present, so every
  // reading that looks only at the mutated run calls this record held. What
  // separates them is that the same red was there BEFORE the weakening, and both
  // halves are asserted because the first alone is satisfied by an arm that
  // reddens for its own reason.
  expect(reading.after).toBe("failed");
  expect(reading.before).toBe("failed");
  expect(reading.verdict).toBe("disarmed");
  expect(reading.detail).toContain("already red");
});

test("a red nobody recorded, beside the named arm's own, is not the named arm's", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToZero);
  const unaccounted = read(recordOver("alpha", weakenToZero), before, after);
  // BOTH DIRECTIONS OVER ONE RUN, AND THE PAIR IS THE POINT: `disarmed when
  // something else reddened` is satisfied by an instrument that never says held,
  // and `held when the reds are the recorded ones` by one that never says
  // disarmed. The two readings differ in the record alone -- same probe, same
  // weakening, same two runs.
  //
  // THE SET IS COMPARED FOR EQUALITY AND NEVER FOR CONTAINMENT, and only the
  // direction where the recorded set is SHORT of what reddened is readable here:
  // under this weakening every probe arm is red, so no record over it can be
  // longer than the observation. The other direction has its own arm below.
  const accounted = read(recordOver("alpha", weakenToZero, [probeArms.beta]), before, after);
  expect(unaccounted.after).toBe("failed");
  expect(unaccounted.reddened).toContain(probeArms.beta);
  expect(unaccounted.verdict).toBe("disarmed");
  expect(unaccounted.detail).toContain(probeArms.beta);
  expect(accounted.verdict).toBe("held");
});

test("a recorded collateral name that STOPPED reddening is disarmed, never held", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const stale = read(recordOver("alpha", weakenToOne, [probeArms.beta]), before, after);
  // THE HALF OF THE EQUALITY THE ARM ABOVE CANNOT REACH, AND IT IS WHY THE
  // COMPARISON IS NOT A SUBSET TEST. There the recorded set is SHORT of what
  // reddened; here it is LONGER -- `beta` is recorded as MEASURED to redden and
  // does not, which is what a rename or a typo in a record leaves behind. A
  // comparison relaxed to `every observed name is required` reads HELD for that,
  // so the stale measurement outlives the arm it was taken for with nothing red.
  // The pair: the same two runs, read WITHOUT the stale name, are held.
  expect(stale.reddened).not.toContain(probeArms.beta);
  expect(stale.verdict).toBe("disarmed");
  expect(stale.detail).toContain(probeArms.beta);
  expect(read(recordOver("alpha", weakenToOne), before, after).verdict).toBe("held");
});

test("a weakening that stops the file being READ is refused, never read as the arm reddening", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToNothing);
  const reading = read(recordOver("alpha", weakenToNothing), before, after);
  // THE REQUIRED DEGENERATE'S OWN WITNESS. A weakening that breaks compilation
  // reddens everything, and a reader taking the process exit code then has `the
  // named arm reddened` satisfied for the wrong reason -- by every record it
  // will ever hold. These two lines are the pair that separates the readings:
  // the run IS red, and NO arm has a result of its own in it.
  expect(after.exit).not.toBe(0);
  expect(reading.after).toBe(null);
  expect(reading.verdict).toBe("refused");
  expect(reading.detail).toContain("did not run to a report");
});

test("a record naming an arm that no longer runs is refused, not read as gone quiet", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const gone = read(
    {
      arm: { file: probeFile, name: "delta, which nothing registers" },
      weakening: weakenToOne,
      alsoReddens: [],
    },
    before,
    after,
  );
  // AN ARM THAT IS GONE AND AN ARM THAT STOPPED NOTICING ARE TWO STATES, and
  // they print the same word to anyone reading `it did not redden`. The repairs
  // are opposite -- re-home the record, or repair the arm -- so the reading that
  // collapses them is the one that costs a reader the sprint. The pair: the same
  // two runs, read with a name that IS registered, is not refused.
  expect(gone.verdict).toBe("refused");
  expect(gone.detail).toContain("delta, which nothing registers");
  expect(read(recordOver("alpha", weakenToOne), before, after).verdict).toBe("held");
});

test("a weakening whose `from` is not there exactly once is refused, never applied", () => {
  const root = stageProbe(["alpha"]);
  // A RECORD THAT NO LONGER MATCHES ITS TREE MUST NOT RUN, because the run that
  // follows would be over the UNWEAKENED tree: the arm passes, the instrument
  // reads `gone quiet`, and the repair a reader is sent to make is to an arm
  // that is fine. Both arities are refused -- none says the code moved, two says
  // the record does not name which site it weakens.
  expect(() => applyWeakening(root, { ...weakenToOne, from: "export const limit = 7;" })).toThrow(
    /0 occurrences/,
  );
  writeFileSync(join(root, probeTarget), "export const limit = 2;\nexport const other = 2;\n");
  expect(() => applyWeakening(root, { ...weakenToOne, from: "= 2;" })).toThrow(/2 occurrences/);
  // THE CONTROL WITHOUT WHICH AN OVER-BROAD REFUSAL SHIPS GREEN: the same
  // weakening, over the occurrence that IS unique, applies.
  expect(() => applyWeakening(root, weakenToOne)).not.toThrow();
});

test("the stage is the tracked tree, and the weakening never reaches the working one", () => {
  const stage = stageCheckout();
  staged.push(stage.root);
  const weakening: Weakening = {
    file: "scripts/definition-of-done.ts",
    from: "const failed = results.filter",
    to: "const failed = results.slice(0, 0).filter",
  };
  const trackedBefore = readFileSync(join(repoRoot, weakening.file), "utf8");
  applyWeakening(stage.root, weakening);
  // THE PAIR, AND THE SECOND HALF IS THE ONE THAT MATTERS. `the working tree is
  // unchanged` is satisfied by a stager that copies nothing and by one that
  // applies nothing, so it is asserted BESIDE the staged file having changed --
  // an arm that mutates a version-controlled file in order to observe something
  // has a recorded history here of measuring nothing, and this is the arm that
  // says this one does not.
  expect(readFileSync(join(stage.root, weakening.file), "utf8")).toContain(weakening.to);
  expect(readFileSync(join(repoRoot, weakening.file), "utf8")).toBe(trackedBefore);
  // NO BUILD RUNS INSIDE A RUN, which is not a detail: the preload compiles every
  // package before any test file loads, so a stage carrying it would build the
  // WEAKENED source once per record.
  expect(existsSync(join(stage.root, "bunfig.toml"))).toBe(false);
  expect(existsSync(join(stage.root, "node_modules"))).toBe(true);
});

test("nothing here stages into, or deletes, a path outside the throwaway directory", () => {
  // THE ARM THIS REPOSITORY PAID FOR IN ITS OWN HISTORY. A hand-run perturbation
  // made the stager hand back the CHECKOUT ROOT, and the recursive delete at the
  // far end of that value removed the working tree and its `.git`; recovery was
  // from `origin`, which is not a control this repository has any right to
  // assume. What was missing is not a warning: it is that the destructive end
  // read a PATH -- the right quantity -- against a subject that could not tell a
  // throwaway from the repository, because nothing asked it to.
  //
  // BOTH DIRECTIONS, because a refusal that refuses everything is satisfied by
  // the first line alone and would take every arm above with it.
  expect(() => throwawayOnly(repoRoot)).toThrow(/is not under/);
  expect(() => throwawayOnly(join(repoRoot, ".git"))).toThrow(/is not under/);
  const throwaway = stageProbe(["alpha"]);
  expect(throwawayOnly(throwaway)).toBe(throwaway);
  // AND A PATH UNDER NEITHER, WHICH IS THE ONE THE OTHER THREE DO NOT REACH.
  // Sampling the checkout and a throwaway leaves `not under the checkout` and
  // `under the throwaway` extensionally equal over everything asserted, so the
  // guard narrowed to the first -- same message, same arity -- keeps this arm
  // green while a sibling repository, a home directory or a mounted volume
  // becomes a legal argument to the recursive delete three lines up. The home
  // directory is the sample because it is the largest such subject on this
  // machine and it exists on every machine that can run this suite.
  expect(() => throwawayOnly(homedir())).toThrow(/is not under/);
});

test("the report names the arm each record weakened, and no other", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const held = line(read(recordOver("alpha", weakenToOne), before, after));
  const quiet = line(read(recordOver("beta", weakenToOne), before, after));
  // BOTH DIRECTIONS, BECAUSE ONE IS SATISFIED BY A CONSTANT. A line that always
  // names `alpha` passes `the held line names alpha`, and a line that names
  // every arm passes it too. What makes the report a function of the record is
  // that each line names its OWN arm and not the other's.
  //
  // AND NAMES ARE THE WHOLE REPORT: nothing here counts records, because a green
  // carrying a number invites the reading this instrument is refused for --
  // a statement about the arms nobody recorded.
  expect(held).toContain(probeArms.alpha);
  expect(held).not.toContain(probeArms.beta);
  expect(quiet).toContain(probeArms.beta);
  expect(quiet).not.toContain(probeArms.alpha);
  expect(held).toContain("[HELD]");
  expect(quiet).toContain("[GONE QUIET]");
});

/**
 * THE REGISTRY: perturbations this repository has already run once and written
 * up as prose, recorded here as something the suite RE-RUNS.
 *
 * NOTHING HERE CLAIMS TO BE COMPLETE, AND A GREEN BELOW SAYS NOTHING ABOUT ANY
 * ARM NOT NAMED IN IT. That is the product owner's refusal made structural: the
 * arms are named, whoever wants a number counts the lines, and no sentence in
 * this tree asserts that the arms with records are the arms that need them.
 *
 * THE SEEDS STAND OVER ARMS ELSEWHERE IN THE SUITE AND NOT OVER THIS FILE'S
 * OWN, which is the condition that keeps the instrument's evidence from being
 * self-referential. HOW MANY OF THEM THERE ARE IS NOT WRITTEN HERE: a number in
 * the prose immediately above the rows it counts is false the day a row lands,
 * and this is the one place a reader would trust it. The arms THIS sprint wrote carry their perturbation as an
 * assertion instead -- their weakenings are readings of a result the arm already
 * holds, so a record here would be a slower spelling of a line already above.
 *
 * AN ARM FILE THAT IS NOT TRACKED CANNOT BE RE-RUN HERE: the stage is built from
 * `git ls-files`, so a record naming a file that has never been committed fails
 * at the read, loudly, rather than reporting a colour.
 */
const dodArms = "test/definition-of-done.test.ts";
const dodRunner = "scripts/definition-of-done.ts";

const records: readonly PerturbationRecord[] = [
  {
    // THE GATE NARROWED BY ONE WORD. `not passed` to `failed` leaves outcome,
    // reason and every byte of the report unchanged and moves only the exit
    // code, so nothing but a tree of passes around one missing binary sees it.
    // ITS SECOND NAME IS A MEASUREMENT AND NOT A TOLERANCE: the same word gates
    // a REFUSED check too, so the refusal arm reddens with it, and the day it
    // stops doing so this record fails rather than passing quietly.
    arm: {
      file: dodArms,
      name: "a check that never started GATES the run, with every other check green",
    },
    weakening: {
      file: dodRunner,
      from: 'const failed = results.filter((result) => result.outcome !== "passed");',
      to: 'const failed = results.filter((result) => result.outcome === "failed");',
    },
    alsoReddens: ["a `run` this runner cannot execute FAITHFULLY is refused, never misread"],
  },
  {
    // THE TOTAL TAKEN FROM THE FIRST ELEMENT, which is invisible wherever the
    // aggregate and its first element are one value. This one reddens ITS ARM
    // AND NOTHING ELSE, so it is the seed to point at when this instrument's
    // attribution is being described.
    arm: { file: dodArms, name: "a warning is counted and reported, and does NOT gate the run" },
    weakening: {
      file: dodRunner,
      from: "const warnings = results.reduce((total, result) => total + result.warnings, 0);",
      to: "const warnings = results[0]?.warnings ?? 0;",
    },
    alsoReddens: [],
  },
];

/**
 * The unweakened run each record is read against, taken once per arm file.
 *
 * SHARED, BECAUSE IT IS ONE SUBJECT AND NOT ONE PER RECORD: two baselines of the
 * same file in the same tree are the same reading bought twice.
 */
const baselines = new Map<string, Promise<ArmFileRun>>();

function unweakened(file: string): Promise<ArmFileRun> {
  const taken = baselines.get(file) ?? takeBaseline(file);
  baselines.set(file, taken);
  return taken;
}

test(`every arm in ${dodArms} passes before any weakening`, async () => {
  const before = await unweakened(dodArms);
  // THE HALF THAT MAKES EVERY RED BELOW ATTRIBUTABLE. Each record requires the
  // arms it does NOT name to stay green under its weakening; that requirement
  // means nothing unless they were green to begin with, and this stage is not
  // this repository -- it carries no bunfig.toml, so no build ran in it.
  expect([...(before.arms ?? [])].filter(([, result]) => result === "failed")).toEqual([]);
  // AND THE PAIR: an empty list of failures and a reader that opened nothing are
  // the same observation without it.
  expect(before.arms?.size ?? 0).toBeGreaterThan(0);
});

for (const record of records) {
  test(`the recorded weakening still reddens: ${record.arm.name}`, async () => {
    const reading = await reRun(record, await unweakened(record.arm.file));
    // THE REPORT, AND IT IS PRINTED RATHER THAN COUNTED. A green run of this
    // suite prints nothing per arm, so without this line the only naming a
    // reader gets is on a failure -- and the one outcome refused with every
    // check green is a green that reads as a statement about arms nobody
    // recorded.
    process.stdout.write(`${line(reading)}\n`);
    expect(reading.verdict).toBe("held");
  });
}
