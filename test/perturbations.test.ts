import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  type ThrowawayPath,
  throwawayOnly,
  type Weakening,
  writeInThrowaway,
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
 * ARRANGEMENT OF ITS PROBE. A probe in which the named arm stays green while
 * another reddens separates `the named arm reddened` from `the run reddened` --
 * but only while it does, and nothing announces the day an edit makes every arm
 * in it redden. So the pair is written down, and it re-runs with the suite.
 */

const staged: string[] = [];

afterEach(() => {
  for (const root of staged.splice(0)) {
    rmSync(throwawayOnly(root), { recursive: true, force: true });
  }
});

/** The probe's arms, by tag, so a record can name one without spelling it twice. */
const probeArms = {
  alpha: "alpha requires the limit to be exactly 2",
  beta: "beta requires the limit to be at least 1",
  broken: "broken is red before anything is weakened",
  entities: `entities <requires> the "limit" & it's exactly 2`,
} as const;

type ProbeTag = keyof typeof probeArms;

const probeBodies: Record<ProbeTag, string> = {
  alpha: "expect(limit).toBe(2);",
  beta: "expect(limit >= 1).toBe(true);",
  broken: "expect(limit).toBe(99);",
  entities: "expect(limit).toBe(2);",
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
function stageProbe(tags: readonly ProbeTag[]): ThrowawayPath {
  const root = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-probe-")));
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

/**
 * Every FILE under a directory, relative and sorted.
 *
 * A SYMLINK IS NEITHER DESCENDED NOR COUNTED, which is not tidiness: the stage
 * borrows node_modules by symlink, and a walk that followed it would enumerate
 * the real checkout's dependencies as if the stage held them. It rests on no
 * tracked path here being a symlink -- the day one is committed, the set
 * comparison that reads this reddens naming the file.
 */
function filesUnder(root: string, prefix = ""): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      found.push(...filesUnder(root, relative));
    } else if (entry.isFile()) {
      found.push(relative);
    }
  }
  return found.sort();
}

/** Baseline, weakening, second run -- the sequence every arm below reads. */
async function bothRuns(
  root: ThrowawayPath,
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
  // THE DISCRIMINATION, WRITTEN DOWN RATHER THAN ARRANGED: something in this run
  // IS red, and the arm the record names is not it. Delete either line and an
  // edit making every probe arm redden leaves this arm green while the instrument
  // reads a colour that belongs to `alpha`.
  expect(after.exit).not.toBe(0);
  expect(reading.after).toBe("passed");
  expect(reading.verdict).toBe("gone quiet");
  expect(reading.detail).toContain(probeArms.beta);
});

test("a named arm already red WITHOUT its weakening reads DISARMED", async () => {
  const root = stageProbe(["alpha", "broken"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const reading = read(recordOver("broken", weakenToOne, [probeArms.alpha]), before, after);
  // BOTH HALVES, because the first alone is satisfied by an arm that reddens for
  // its own reason: the required red IS present, and the same red was there
  // BEFORE the weakening.
  expect(reading.after).toBe("failed");
  expect(reading.before).toBe("failed");
  expect(reading.verdict).toBe("disarmed");
  expect(reading.detail).toContain("already red");
});

test("a red nobody recorded, beside the named arm's own, is not the named arm's", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToZero);
  const unaccounted = read(recordOver("alpha", weakenToZero), before, after);
  // BOTH DIRECTIONS OVER ONE RUN: `disarmed when something else reddened` is
  // satisfied by an instrument that never says held, and `held when the reds are
  // the recorded ones` by one that never says disarmed. The two readings differ
  // in the record alone.
  //
  // ONLY THE DIRECTION WHERE THE RECORDED SET IS SHORT OF WHAT REDDENED IS
  // READABLE HERE: under this weakening every probe arm is red, so no record over
  // it can be longer than the observation.
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
  // THE HALF THE ARM ABOVE CANNOT REACH: there the recorded set is SHORT of what
  // reddened, here it is LONGER, which is what a rename or a typo in a record
  // leaves behind. THE PAIR: the same two runs, read WITHOUT the stale name, are
  // held.
  expect(stale.reddened).not.toContain(probeArms.beta);
  expect(stale.verdict).toBe("disarmed");
  expect(stale.detail).toContain(probeArms.beta);
  expect(read(recordOver("alpha", weakenToOne), before, after).verdict).toBe("held");
});

test("a weakening that stops the file being READ is refused, never read as the arm reddening", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToNothing);
  const reading = read(recordOver("alpha", weakenToNothing), before, after);
  // THE PAIR THAT SEPARATES THE READINGS: the run IS red, and NO arm has a result
  // of its own in it. A reader taking the process exit code alone has `the named
  // arm reddened` satisfied by every record it will ever hold.
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
  // THE PAIR: the same two runs, read with a name that IS registered, is not
  // refused -- so the reading is a function of the name rather than a refusal
  // that refuses everything.
  expect(gone.verdict).toBe("refused");
  expect(gone.detail).toContain("delta, which nothing registers");
  expect(read(recordOver("alpha", weakenToOne), before, after).verdict).toBe("held");
});

test("a weakening whose `from` is not there exactly once is refused, never applied", () => {
  const root = stageProbe(["alpha"]);
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
  // THE PAIR: `the working tree is unchanged` is satisfied by a stager that
  // copies nothing and by one that applies nothing, so it is asserted BESIDE the
  // staged file having changed.
  expect(readFileSync(join(stage.root, weakening.file), "utf8")).toContain(weakening.to);
  expect(readFileSync(join(repoRoot, weakening.file), "utf8")).toBe(trackedBefore);
  expect(existsSync(join(stage.root, "bunfig.toml"))).toBe(false);
  expect(existsSync(join(stage.root, "node_modules"))).toBe(true);
  // THE ENUMERATION IS SPELLED AGAIN HERE RATHER THAN BORROWED FROM THE STAGER,
  // AND THAT IS DELIBERATE AGAINST THIS PROJECT'S OWN RULE ABOUT TWO PRODUCERS:
  // a stager widened to take untracked files moves ITS enumeration, and an arm
  // reading the same one moves with it and stays green. Two producers is the
  // point when the second one is the specification.
  const listed = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  const tracked = listed.stdout
    .split("\0")
    .filter((entry) => entry !== "" && entry !== "bunfig.toml")
    .sort();
  expect(filesUnder(stage.root)).toEqual(tracked);
  // THE CONCRETE INSTANCE BESIDE THE SET, because `dist/` is IGNORED: a stager
  // widened with `--others --exclude-standard` would not carry it while a
  // wholesale copy would, and this line says which file the reader is looking at.
  const built = "packages/tsudoi-language-server/dist/types.js";
  expect(existsSync(join(repoRoot, built))).toBe(true);
  expect(existsSync(join(stage.root, built))).toBe(false);
  // SAFE UNDER ITS OWN DEGENERATE BY CONSTRUCTION, WHICH IS WHY IT CAN BE RUN AT
  // ALL AGAINST THE REAL CHECKOUT: the `from` below occurs in no file, so with
  // the guard deleted `applyWeakening` reads, counts zero and refuses on the
  // ARITY -- there is no ordering that reaches `writeFileSync`. What separates
  // the readings is therefore the MESSAGE and not the throw, and the cast is the
  // degenerate's own shape: a hand-written one can always cast, which is what
  // the guard call buys over the type.
  const unwritable: Weakening = { ...weakening, from: "no source line reads like this one" };
  for (const outside of [repoRoot, "", "."]) {
    expect(() => applyWeakening(outside as ThrowawayPath, unwritable)).toThrow(
      /inside the checkout/,
    );
  }
  // THE STAGE HERE IS A GENUINE THROWAWAY and the record's own file is what
  // leaves it, so this reads the second half of the guard: a path is refused for
  // where it LANDS and not only for which root it was joined onto.
  expect(() => applyWeakening(stage.root, { ...unwritable, file: "../escaped.ts" })).toThrow(
    /outside the throwaway/,
  );
  // `""` AND `"."` ARE IN THAT LIST BECAUSE EVERY JOIN UNDER THEM GOES RELATIVE,
  // and this project mandates the checkout root as the working directory, so a
  // stager with an early return added later lands there.
  //
  // THE REPORT FILE'S GUARD THROWS SYNCHRONOUSLY, before the promise, so this
  // reads as a throw and not as a rejection. WHAT ITS DEGENERATE COSTS, STATED
  // BECAUSE IT IS NOT SAFE BY CONSTRUCTION THE WAY THE THREE ABOVE ARE: with the
  // guard deleted this spawns one run over a file the checkout does not have and
  // may leave an UNTRACKED report at the root.
  expect(() => runArmFile(repoRoot as ThrowawayPath, probeFile)).toThrow(/inside the checkout/);
  // BOTH HALVES OF THE PLANTING WRITE, for the reason the two above are split: a
  // root outside the throwaway, and a FILE that climbs out of a genuine one.
  expect(() => writeInThrowaway(repoRoot as ThrowawayPath, "planted.md", "# planted\n")).toThrow(
    /inside the checkout/,
  );
  expect(() => writeInThrowaway(stage.root, "../planted.md", "# planted\n")).toThrow(
    /outside the throwaway/,
  );
  // THE POSITIVE CONTROL, WITHOUT WHICH A REFUSAL THAT REFUSED EVERYTHING SHIPS
  // GREEN: the same call, at a path this module made, writes.
  writeInThrowaway(stage.root, "planted/README.md", "# planted\n");
  expect(existsSync(join(stage.root, "planted", "README.md"))).toBe(true);
});

test("an arm whose name carries XML's own characters is read as ITSELF", async () => {
  const root = stageProbe(["entities", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  // THE SUBJECT IS ORDINARY HERE: this suite's arm names are English sentences,
  // and `a `run` this runner cannot execute` is one apostrophe away from the
  // state below. What a reader that does not unescape costs is not a wrong colour
  // but a REFUSED -- the record's own arm is not found in a report that contains
  // it -- which reads to the author as `the registry is stale`.
  expect(before.arms?.has(probeArms.entities)).toBe(true);
  expect(read(recordOver("entities", weakenToOne), before, after).verdict).toBe("held");
});

test("a record naming an UNTRACKED arm file fails at the read, not with a colour", async () => {
  // THE FILE NAMED IS ON DISK IN THE WORKING TREE AND UNTRACKED, so what is being
  // observed is the STAGE and not the file's absence from the machine. LOUDLY
  // MEANS AN EXCEPTION: a verdict would be read as a measurement of an arm that
  // was never run.
  const untracked = "packages/tsudoi-language-server/dist/types.js";
  expect(existsSync(join(repoRoot, untracked))).toBe(true);
  const record: PerturbationRecord = {
    arm: { file: untracked, name: "no arm, because nothing here is a test file" },
    weakening: { file: untracked, from: "export", to: "export" },
    alsoReddens: [],
  };
  await expect(reRun(record, { exit: 0, arms: new Map() })).rejects.toThrow(/ENOENT/);
});

test("nothing here stages into, or deletes, a path outside the throwaway directory", () => {
  // BOTH DIRECTIONS, because a refusal that refuses everything is satisfied by
  // the first line alone and would take every arm above with it.
  expect(() => throwawayOnly(repoRoot)).toThrow(/inside the checkout/);
  expect(() => throwawayOnly(join(repoRoot, ".git"))).toThrow(/inside the checkout/);
  const throwaway = stageProbe(["alpha"]);
  expect(throwawayOnly(throwaway)).toBe(throwaway);
  // AND A PATH UNDER NEITHER, WHICH IS THE ONE THE OTHER THREE DO NOT REACH:
  // sampling the checkout and a throwaway leaves `not under the checkout` and
  // `under the throwaway` extensionally equal, so the guard narrowed to the first
  // keeps this arm green while a sibling repository or a mounted volume becomes a
  // legal argument to the recursive delete three lines up. The home directory is
  // the sample because it exists on every machine that can run this suite.
  expect(() => throwawayOnly(homedir())).toThrow(/is not under/);
});

test("a TMPDIR that resolves INTO the checkout does not license the delete", () => {
  // ITS OWN ARM AND NOT A LINE IN THE ONE ABOVE, BECAUSE IT COULD NEVER BE THE
  // FIRST THING TO FAIL THERE: with the checkout clause deleted, that arm reddens
  // on its own first line and this reading is never taken.
  //
  // WHAT IT SEPARATES: `under the temporary directory` and `under it AND outside
  // the checkout` are ONE predicate over every path on an ordinary machine, so
  // the conjunction is unwitnessed until TMPDIR RESOLVES INTO THE CHECKOUT.
  //
  // NO DIRECTORY IS CREATED AND NOTHING IS DELETED: an existing tracked directory
  // is borrowed as the temporary root, so this arm's own setup writes nothing
  // anywhere, and `os.tmpdir()` re-reads `TMPDIR` on every call so the move takes
  // effect inside the guard.
  const priorTmpdir = process.env.TMPDIR;
  process.env.TMPDIR = join(repoRoot, "scripts");
  try {
    // THE OTHER DIRECTION IS NOT WRITTEN HERE AND CANNOT BE: under a TMPDIR that
    // resolves into the checkout, `under the temporary directory AND outside the
    // checkout` is the EMPTY SET, and constructing a positive control by staging
    // a probe would create a directory INSIDE the repository -- which is the
    // write this arm is about. It is carried instead by every other arm in this
    // file, each of which stages through the same guard.
    expect(() => throwawayOnly(join(repoRoot, "scripts", "workspaces.ts"))).toThrow(
      /inside the checkout/,
    );
  } finally {
    if (priorTmpdir === undefined) {
      delete process.env.TMPDIR;
    } else {
      process.env.TMPDIR = priorTmpdir;
    }
  }
});

test("a record naming an arm in a file that RE-RUNS perturbations is refused, never spawned", async () => {
  // THE SHAPE IS A SUBSTRING TEST OVER THE ARM FILE'S TEXT, AND IT IS KEPT AS
  // ONE: deciding what a file transitively imports is a program, and the cheap
  // test is wrong in two directions that are named here rather than fixed. A
  // future helper that imports this module while the arm file names only the
  // helper is NOT refused, and that is the direction that still recurses. A file
  // mentioning the path in a comment IS refused, and that direction costs a
  // record nobody can run until the comment moves.
  const record: PerturbationRecord = {
    arm: {
      file: "test/perturbations.test.ts",
      name: "the report names the arm each record weakened, and no other",
    },
    weakening: {
      file: "scripts/definition-of-done.ts",
      from: "const failed = results.filter",
      to: "const failed = results.slice(0, 0).filter",
    },
    alsoReddens: [],
  };
  // THE WEAKENING IS APPLICABLE AND IS NEVER APPLIED: the refusal is read off
  // the arm file before the stage is touched, so what this asserts is the order
  // as much as the message.
  //
  // THE SECOND DIRECTION IS CARRIED ELSEWHERE: a refusal that refused everything
  // would take the registry's own records with it, and they read HELD below.
  await expect(reRun(record, { exit: 0, arms: new Map() })).rejects.toThrow(/spawn without bound/);
});

test("the report names the arm each record weakened, and no other", async () => {
  const root = stageProbe(["alpha", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  const held = line(read(recordOver("alpha", weakenToOne), before, after));
  const quiet = line(read(recordOver("beta", weakenToOne), before, after));
  // BOTH DIRECTIONS, BECAUSE ONE IS SATISFIED BY A CONSTANT: a line that always
  // names `alpha` passes `the held line names alpha`, and a line that names every
  // arm passes it too.
  expect(held).toContain(probeArms.alpha);
  expect(held).not.toContain(probeArms.beta);
  expect(quiet).toContain(probeArms.beta);
  expect(quiet).not.toContain(probeArms.alpha);
  expect(held).toContain("[HELD]");
  expect(quiet).toContain("[GONE QUIET]");
  // AND ALL FOUR LABELS, BECAUSE OVER TWO `the verdict's own word` and `held or
  // not held` are the same function: the non-held branch printing ONE constant
  // word keeps every line above true. What that costs is the distinction the
  // verdict type exists for -- REFUSED is repaired in the registry, DISARMED in
  // the tree -- and the detail text that still separates them is not what a
  // reader scans.
  const disarmed = line(read(recordOver("alpha", weakenToOne, [probeArms.beta]), before, after));
  const refused = line(
    read(
      {
        arm: { file: probeFile, name: "delta, which nothing registers" },
        weakening: weakenToOne,
        alsoReddens: [],
      },
      before,
      after,
    ),
  );
  expect(disarmed).toContain("[DISARMED]");
  expect(refused).toContain("[REFUSED]");
  expect(refused).not.toContain("[DISARMED]");
});

/**
 * THE REGISTRY: perturbations this repository has already run once and written
 * up as prose, recorded here as something the suite RE-RUNS.
 *
 * NOTHING HERE CLAIMS TO BE COMPLETE, AND A GREEN BELOW SAYS NOTHING ABOUT ANY
 * ARM NOT NAMED IN IT: the arms are named, whoever wants a number counts the
 * lines, and no sentence in this tree asserts that the arms with records are the
 * arms that need them.
 *
 * THE ROWS STAND OVER ARMS ELSEWHERE IN THE SUITE AND NOT OVER THIS FILE'S OWN,
 * which is the condition that keeps the instrument's evidence from being
 * self-referential. The arms above carry their perturbation as an assertion
 * instead, so a record here would be a slower spelling of a line already there.
 *
 * AN ARM FILE THAT IS NOT TRACKED CANNOT BE RE-RUN HERE: the stage is built from
 * `git ls-files`, so a record naming a file that has never been committed fails
 * at the read, loudly, rather than reporting a colour.
 *
 * WHAT THIS REGISTRY CANNOT HOLD, AS A CLASS AND IN ONE PLACE, so that an arm
 * file does not have to carry its own exemption and the class is not
 * discoverable only by reading every file that has one. A record is applied by
 * staging every TRACKED file and running the arm file inside that stage, so a
 * weakening whose reading depends on something the stage does not reproduce is
 * unrecordable. THREE MECHANISMS, AND ONLY THE FIRST IS DECIDABLE FROM THE ARM
 * FILE:
 *
 * - IT IMPORTS helpers/perturbation.ts. `reRun` refuses that by name and throws,
 *   because such a record runs a file that stages a tree and runs a file that
 *   stages a tree. This is the half a reader can check without running anything.
 * - WHAT THE STAGE LACKS: no `.git`, no build output, and a directory NAME that
 *   is not this repository's. An arm reading any of the three is red AT THE
 *   BASELINE rather than at its weakening, which is a colour about the stage.
 * - WHAT THE STAGE GAINS: `mirrorInstalledDependencies` treats the real
 *   framework as an INSTALLED dependency, its realpath being outside the stage,
 *   and hands a probe a SECOND ROUTE -- so a weakening that removes the first
 *   reads DISARMED.
 *
 * AND `THE ARM FILE STAGES A TREE OF ITS OWN` IS NOT THE PREDICATE, measured
 * because it is the one a reader reaches for: it holds of seventeen root test
 * files, and test/definition-of-done.test.ts is one of them while its records
 * re-run and report HELD below.
 */
const dodArms = "test/definition-of-done.test.ts";
const dodRunner = "scripts/definition-of-done.ts";

const records: readonly PerturbationRecord[] = [
  {
    // THE GATE NARROWED BY ONE WORD: `not passed` to `failed` leaves outcome,
    // reason and every byte of the report unchanged and moves only the exit
    // code, so nothing but a tree of passes around one missing binary sees it.
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
    // aggregate and its first element are one value.
    arm: { file: dodArms, name: "a warning is counted and reported, and does NOT gate the run" },
    weakening: {
      file: dodRunner,
      from: "const warnings = results.reduce((total, result) => total + result.warnings, 0);",
      to: "const warnings = results[0]?.warnings ?? 0;",
    },
    alsoReddens: [],
  },
  {
    // THE ADJACENT WEAKER READING IS THE ONE A REVIEWER WOULD ACCEPT WITHOUT
    // NOTICING: read THAT the subpath resolved rather than WHICH FILE answered.
    // Source and artifact both resolve, so the weakened detector is silent over
    // exactly the states it exists for.
    arm: {
      file: "test/artifact-detector.test.ts",
      name: "a published subpath with no artifact at all is refused, naming the file it promised",
    },
    weakening: {
      file: "scripts/workspaces.ts",
      from: `    return (
      landed === undefined ||
      !existsSync(declaration) ||
      realpathSync(landed) !== realpathSync(declaration)
    );`,
      to: "    return landed === undefined;",
    },
    alsoReddens: [
      "a published subpath whose map answers source BEFORE its artifact is refused, though the artifact is complete",
      "a published subpath whose module is written and whose declaration is not is refused, naming the declaration",
      "the refusal arrives before any member is type-checked against the artifact",
    ],
  },
  {
    // TWO SPELLINGS OF ONE ORDER: the early return compares the arriving name
    // against the worst KEPT one flat, while the insertion point below it stays
    // grouped, so a retention rule and a render order disagree. The disagreement
    // is only visible on a directory big enough to truncate AND holding both
    // groups.
    arm: {
      file: "packages/tsudoi-completion-path/test/resolve.test.ts",
      name: "a hidden name already kept is displaced by an ordinary name arriving after it",
    },
    weakening: {
      file: "packages/tsudoi-completion-path/src/resolve.ts",
      from: "  if (worstKept !== undefined && byGroupThenName(name, worstKept) >= 0) {",
      to: "  if (worstKept !== undefined && (name < worstKept ? -1 : 1) >= 0) {",
    },
    alsoReddens: [],
  },
  {
    // THE ONE FACT A DIRECTORY'S STAT HAS AND MUST NOT REPORT: its own directory
    // ENTRY's size, 64 on one machine and 4096 on the next for the same children.
    // The claim it falsifies is stated over the wire at the repository root, on
    // two runtimes; the arm named here is the cheap statement of it, and the
    // registry grades that one so no record spawns a server.
    //
    // IT REDDENS EIGHT ARMS BESIDE THE ONE IT IS ABOUT, and they are here rather
    // than filtered out: nearly every arm in that file compares a block WHOLE, so
    // a stat line that gained a number moves all of them. A red beside the arm is
    // the failure this instrument exists to refuse reading as a red AT it.
    arm: {
      file: "packages/tsudoi-completion-path/test/resolve.test.ts",
      name: "a directory's stat line carries no byte count, where a file's carries one",
    },
    weakening: {
      file: "packages/tsudoi-completion-path/src/completion.ts",
      from: "    ? `directory · ${modified}`",
      to: "    ? `directory · ${String(stats.size)} bytes · ${modified}`",
    },
    alsoReddens: [
      "the markup a block is built in follows the session, not the item",
      "a name that would forge an attribution line renders as one that cannot",
      "a path whose own name would forge an attribution line renders as one that cannot",
      "a source name no completion of ours produced is left out of the answer",
      "a resolve cancelled while its stat is pending answers without listing the directory",
      "a resolve cancelled between the open and the first entry answers without reading it",
      "a directory replaced by a file after the stat keeps the stat it took and renders no listing",
      "a directory whose item claims to be a file still comes back with its listing",
    ],
  },
  {
    // THE ARRAY READ AS A SINGLETON: a client may hold several workspace folders,
    // and keeping the first answers from whichever the editor happened to list
    // first. WHAT THIS RECORD DOES NOT GRADE, SAID HERE BECAUSE THE SENTENCE
    // THAT STOOD IN ITS PLACE CLAIMED THE OPPOSITE: the arm asserts the four
    // source names before it reads any item, so a first-folder-only `sourcesFor`
    // reddens THERE and never reaches the discriminator. So this weakening
    // grades `the second folder was asked`, which is worth re-running and is not
    // what the item was about. The reading that isolates the discriminator --
    // both folders' items rendered with the identical `source: workspace`, told
    // apart only by `detail` -- has no record, because nothing weaker than
    // rewriting the write produces it.
    arm: {
      file: "packages/tsudoi-completion-path/test/completion.test.ts",
      name: "two workspace folders each contribute a source, and each item's detail names its own root",
    },
    weakening: {
      file: "packages/tsudoi-completion-path/src/completion.ts",
      from: "  for (const folder of folders) {",
      to: "  for (const folder of folders.slice(0, 1)) {",
    },
    alsoReddens: [],
  },
  {
    // THE ORDER OF TWO PARTS THAT ARE EACH CORRECT. Nothing about the CONTENT of
    // either block changes, which is exactly why a prefix relation over two
    // values that are both right today says nothing until this is run. NOT
    // `every whole-value assertion over one answer at a time stays green`, which
    // stood here and is false unscoped: the member's resolve arms spell the
    // order literally and go red. It holds of the arm named below, whose file is
    // the only one this record's reading is taken over. What it breaks is
    // what a user watching a popup re-render sees: the line they were reading
    // moves down.
    arm: {
      file: "packages/tsudoi-completion-path/test/completion.test.ts",
      name: "what completion sent is a strict prefix of what resolve answers, for both kinds",
    },
    weakening: {
      file: "packages/tsudoi-completion-path/src/completion.ts",
      from: `  if (source !== undefined) {
    parts.push(\`source: \${source}\`);
  }
  if (stat !== undefined) {
    parts.push(stat);
  }
`,
      to: `  if (stat !== undefined) {
    parts.push(stat);
  }
  if (source !== undefined) {
    parts.push(\`source: \${source}\`);
  }
`,
    },
    alsoReddens: [],
  },
  {
    // THE DRAWING READ AS A LIST INSTEAD OF AS A TREE: every line still yields a
    // directory, the projection is unchanged, and only the NESTING is dropped --
    // the reading that cannot tell a README picturing `packages/` inside the
    // checkout from one picturing it beside.
    arm: { file: "test/readme-layout.test.ts", name: "the layout holds over README.md block 1" },
    weakening: {
      file: "test/helpers/readme.ts",
      from: '    const path = parent === undefined ? (at[2] ?? "") : `${parent}/${at[2] ?? ""}`;',
      to: '    const path = at[2] ?? "";',
    },
    alsoReddens: ["corrupting README.md block 1 OUTSIDE the layout's subject leaves it saying yes"],
  },
  {
    // THE CONJUNCTION READ AS A DISJUNCTION, one directory being enough. It
    // leaves the account TRUE on this tree, so nothing that merely asks whether
    // the layout holds can see it -- what sees it is the arm that requires
    // corrupting the projection to be NOTICED, which is the half a `read` row
    // is worth anything for.
    arm: {
      file: "test/readme-layout.test.ts",
      name: "corrupting README.md block 1 INSIDE the layout's subject makes it say no",
    },
    weakening: {
      file: "test/helpers/readme.ts",
      from: "        return against.length > 0 && against.every((dir) => drawn.has(dir));",
      to: "        return against.length > 0 && against.some((dir) => drawn.has(dir));",
    },
    alsoReddens: [],
  },
];

/**
 * The unweakened run each record is read against, taken once per arm file.
 *
 * KEYED BY FILE, AND THE KEY IS WHAT MAKES `every arm in <file> passes before any
 * weakening` MEAN ITS OWN FILE: with one baseline for the whole registry, that
 * arm passes having read another file's run.
 *
 * WHY THAT READING IS NOT A ROW IN THE REGISTRY BELOW: the weakening is a source
 * mutation in THIS file, and `reRun` refuses any arm file that imports
 * helpers/perturbation.ts -- which this one does. It is the instrument's own
 * blind spot rather than an omission.
 */
const baselines = new Map<string, Promise<ArmFileRun>>();

function unweakened(file: string): Promise<ArmFileRun> {
  const taken = baselines.get(file) ?? takeBaseline(file);
  baselines.set(file, taken);
  return taken;
}

// OVER THE FILES THE REGISTRY NAMES AND NOT OVER ONE SPELLED HERE: a file
// entering the registry without a baseline would have its records read against
// no unweakened run at all.
for (const file of new Set(records.map((record) => record.arm.file))) {
  test(`every arm in ${file} passes before any weakening`, async () => {
    const before = await unweakened(file);
    // THE HALF THAT MAKES EVERY RED BELOW ATTRIBUTABLE: each record requires the
    // arms it does NOT name to stay green under its weakening, which means
    // nothing unless they were green to begin with.
    expect([...(before.arms ?? [])].filter(([, result]) => result === "failed")).toEqual([]);
    // AND THE PAIR: an empty list of failures and a reader that opened nothing are
    // the same observation without it.
    expect(before.arms?.size ?? 0).toBeGreaterThan(0);
  });
}

for (const record of records) {
  test(`the recorded weakening still reddens: ${record.arm.name}`, async () => {
    const reading = await reRun(record, await unweakened(record.arm.file));
    // THE REPORT, AND IT IS PRINTED RATHER THAN COUNTED: a green run of this
    // suite prints nothing per arm, so without this line the only naming a reader
    // gets is on a failure -- and a green with no names reads as a statement
    // about arms nobody recorded.
    process.stdout.write(`${line(reading)}\n`);
    expect(reading.verdict).toBe("held");
  });
}
