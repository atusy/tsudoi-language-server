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
  // THE GUARD IS WHAT MAKES THIS A `ThrowawayPath` AND THERE IS NO OTHER ROUTE
  // TO ONE, which is the compiler's half of the property: every mutating end
  // below demands the type, so a probe stager edited to hand back anything else
  // stops compiling here rather than reddening after it has written.
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
 * the real checkout's dependencies as if the stage held them. MEASURED TODAY AND
 * NOT ASSUMED FOREVER: no tracked path in this repository is a symlink, so the
 * rule loses no tracked file -- and the day one is committed the set comparison
 * that reads this reddens, naming the file, which is the loud direction.
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
  // AND `TRACKED` AS THE SET, WHICH IS THE WORD IN THIS ARM'S NAME AND WAS THE
  // ONE THING IT DID NOT READ. A copied file, an unchanged working tree, an
  // absent config and a present directory are all true of a stager that copies
  // the whole checkout, so the property was carried by the implementation alone.
  //
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
  // THE CONCRETE INSTANCE BESIDE THE SET, because `dist/` is the untracked tree
  // this repository always has on disk while the suite runs -- the preload built
  // it -- and it is IGNORED, so a stager widened with `--others
  // --exclude-standard` would not carry it while a wholesale copy would. The set
  // above catches both; this line says which file the reader is looking at.
  const built = "packages/tsudoi-language-server/dist/types.js";
  expect(existsSync(join(repoRoot, built))).toBe(true);
  expect(existsSync(join(stage.root, built))).toBe(false);
  // AND `NO WRITE CAN LEAVE THE STAGE` AS ITS OWN DIRECTION, WHICH EVERYTHING
  // ABOVE WITNESSES FOR EXACTLY ONE RECORD'S DATA. `no write can leave the
  // stage` and `this record's file happens to be relative and clean` have
  // identical truth values over the whole fixture -- so the property was carried
  // by the record, in the arm standing over the destructive side, in the sprint
  // whose accident WAS a destructive side. MEASURED IN A COPY OF THIS CHECKOUT
  // rather than reasoned: with `stageCheckout` returning the checkout root, the
  // write above landed in the working tree, `dispose` refused, and nothing put
  // the file back.
  //
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
  // AND THE STAGE ITSELF IS NOT THE ONLY WAY OUT OF THE STAGE, which is the
  // refusal that would otherwise ship with nothing exercising it -- one `if`
  // away from being deleted as unreachable by whoever reads it next. The stage
  // here is a GENUINE throwaway and the record's own file is what leaves it, so
  // this reads the second half of the guard: a path is refused for where it
  // LANDS and not only for which root it was joined onto.
  expect(() => applyWeakening(stage.root, { ...unwritable, file: "../escaped.ts" })).toThrow(
    /outside the throwaway/,
  );
  // `""` AND `"."` ARE IN THAT LIST BECAUSE THEY ARE CHEAPER THAN THE ACCIDENT
  // THIS TREE SUFFERED, NOT BECAUSE THEY ARE EXOTIC: every join under them goes
  // relative, and this project mandates the checkout root as the working
  // directory, so a stager with an early return added later lands there.
  //
  // AND THE OTHER WRITE, WHICH IS THE ONE THE ACCIDENT'S REPLAY LEFT BEHIND: the
  // run's report file. Its guard throws SYNCHRONOUSLY, before the promise, so
  // this reads as a throw and not as a rejection. WHAT ITS DEGENERATE COSTS,
  // STATED BECAUSE IT IS NOT SAFE BY CONSTRUCTION THE WAY THE THREE ABOVE ARE:
  // with the guard deleted this spawns one run over a file the checkout does not
  // have and may leave an UNTRACKED report at the root -- bounded, tracked
  // nothing, and the reason that degenerate is taken in a copy.
  expect(() => runArmFile(repoRoot as ThrowawayPath, probeFile)).toThrow(/inside the checkout/);
});

test("an arm whose name carries XML's own characters is read as ITSELF", async () => {
  const root = stageProbe(["entities", "beta"]);
  const { before, after } = await bothRuns(root, weakenToOne);
  // THE UNESCAPING KEPT AND ARMED, BECAUSE ITS SUBJECT IS ORDINARY HERE: this
  // suite's arm names are English sentences, and `a `run` this runner cannot
  // execute` is one apostrophe away from the state below. MEASURED on bun
  // 1.3.13, the version this module already cites: a name carrying < > & " '
  // comes back through `--reporter=junit` with all five WRITTEN AS ENTITIES, so
  // a reader that does not unescape holds a key no record can spell. What it
  // costs is not a wrong colour but a REFUSED -- the record's own arm is not
  // found in a report that contains it -- which reads to the author as `the
  // registry is stale` and sends them to edit a record that is right.
  expect(before.arms?.has(probeArms.entities)).toBe(true);
  expect(read(recordOver("entities", weakenToOne), before, after).verdict).toBe("held");
});

test("a record naming an UNTRACKED arm file fails at the read, not with a colour", async () => {
  // THE REGISTRY SAYS THIS IN PROSE -- an arm file that has never been committed
  // `fails at the read, loudly, rather than reporting a colour` -- and a claim
  // about a failure mode is worth exactly the arm that takes it. LOUDLY MEANS AN
  // EXCEPTION: a verdict would be read as a measurement of an arm that was never
  // run, which is the one reading this instrument is refused for. The file named
  // is on disk in the working tree and untracked, so what is being observed is
  // the STAGE and not the file's absence from the machine.
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
  expect(() => throwawayOnly(repoRoot)).toThrow(/inside the checkout/);
  expect(() => throwawayOnly(join(repoRoot, ".git"))).toThrow(/inside the checkout/);
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

test("a TMPDIR that resolves INTO the checkout does not license the delete", () => {
  // ITS OWN ARM AND NOT A LINE IN THE ONE ABOVE, BECAUSE IT COULD NEVER BE THE
  // FIRST THING TO FAIL THERE. MEASURED: with the checkout clause deleted, that
  // arm reddens on its own first line -- the one about the checkout root -- and
  // this reading is never taken, so a hazard sharing a test with another hazard
  // is a hazard nothing observes.
  //
  // WHAT THIS SEPARATES AND THE ARM ABOVE CANNOT. `under the temporary
  // directory` and `under it AND outside the checkout` are ONE predicate over
  // every path on an ordinary machine, so the conjunction is unwitnessed until
  // TMPDIR RESOLVES INTO THE CHECKOUT -- which is the scenario the guard's own
  // docstring names as its motivation and, until this arm, the one it did not
  // stop: such a path passed, and the recursive delete at the far end of it was
  // licensed over the repository.
  //
  // NO DIRECTORY IS CREATED AND NOTHING IS DELETED: an existing tracked
  // directory is borrowed as the temporary root, so this arm's own setup writes
  // nothing anywhere. MEASURED on bun 1.3.13: `os.tmpdir()` re-reads `TMPDIR` on
  // every call, so the move takes effect inside the guard.
  const priorTmpdir = process.env.TMPDIR;
  process.env.TMPDIR = join(repoRoot, "scripts");
  try {
    // THE OTHER DIRECTION IS NOT WRITTEN HERE AND CANNOT BE: under a TMPDIR that
    // resolves into the checkout, `under the temporary directory AND outside the
    // checkout` is the EMPTY SET, so a positive control would have to leave the
    // state this arm exists to put the guard in. Constructing one by staging a
    // probe would create a directory INSIDE the repository, which is the write
    // this arm is about. It is carried instead by every other arm in this file:
    // each stages through the same guard, so a refusal that refused everything
    // takes all of them.
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
  // KEPT AND ARMED RATHER THAN LEFT TO ITS FIRST OCCURRENCE, and the reason is
  // the failure it forecloses: a record over an arm in THIS file stages a tree
  // and runs a file that stages a tree and runs a file. It was written with no
  // arm, and a refusal nobody exercises is one `if` away from being deleted as
  // unreachable by whoever reads it next.
  //
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
  // as much as the message. A rename of this file reddens this arm at the read,
  // which is the loud failure and not a false green.
  //
  // HOW FAR THE SPAWN ACTUALLY GETS, MEASURED RATHER THAN FEARED, AND THE FIRST
  // WRITING OF THIS COMMENT HAD IT WRONG: with the detection deleted, the chain
  // STOPS AT THE SECOND LEVEL. `repoRoot` is module-relative, so inside the
  // stage it is the STAGE, and `stageCheckout` there runs `git ls-files` in a
  // tree holding no `.git` under a temporary directory whose parents hold none
  // either -- exit 128, and the stager throws `git ls-files failed`. The whole
  // degenerate is 15 pass / 1 fail, this arm alone, and the level-2 run is over
  // in 264 ms.
  //
  // SO THE REFUSAL IS KEPT FOR WHAT IT BUYS AND NOT FOR A CATASTROPHE: the
  // bottom of that recursion is an ACCIDENT of how the stage is built -- copy a
  // `.git` in for any reason and it is gone -- and what arrives without the
  // refusal is a red that says `git ls-files failed in /var/folders/...`, which
  // names neither the record nor the recursion. THE SECOND DIRECTION IS CARRIED
  // ELSEWHERE: a refusal that refused everything would take the registry's own
  // records with it, and they read HELD below.
  await expect(reRun(record, { exit: 0, arms: new Map() })).rejects.toThrow(/spawn without bound/);
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
  // AND ALL FOUR LABELS, BECAUSE TWO OF THEM READ THE SAME TO A SCANNER
  // OTHERWISE. Over two labels, `the verdict's own word` and `held or not held`
  // are the same function: the non-held branch printing ONE constant word keeps
  // every line above true. What that costs is exactly the distinction the
  // verdict type exists for -- REFUSED means the record could not be applied and
  // is repaired in the registry, DISARMED means it was applied and the red
  // belongs to something else and is repaired in the tree -- and the detail
  // text that still separates them is not what a reader scans.
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
  {
    // THE PERTURBATION THIS SPRINT'S OWN DELIVERABLE CARRIES, and its adjacent
    // weaker reading is the one a reviewer would accept without noticing: read
    // THAT the subpath resolved rather than WHICH FILE answered. Source and
    // artifact both resolve, so the weakened detector is silent over exactly the
    // states it exists for.
    //
    // ITS COLLATERAL NAMES ARE A MEASUREMENT AND NOT A TOLERANCE: the
    // complete-tree arm stays green under it -- the detector was never going to
    // fire there -- and so does the arm whose subpath answers from NO FILE,
    // which this weakening still catches. What goes red is every arm requiring a
    // refusal where something DID answer, the ordering arm included, since it
    // cannot observe a refusal that never happened.
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
];

/**
 * The unweakened run each record is read against, taken once per arm file.
 *
 * SHARED, BECAUSE IT IS ONE SUBJECT AND NOT ONE PER RECORD: two baselines of the
 * same file in the same tree are the same reading bought twice.
 *
 * KEYED BY FILE, AND THAT KEY IS DELIBERATELY LEFT UNWITNESSED. Every record
 * today names one arm file, and over one file `by file` and `by nothing` are the
 * same function -- no probe here can separate them, and a probe that could would
 * have to put a second record in the registry, which is a perturbation invented
 * to exercise a Map rather than one this repository ran. WHAT MAKES IT FIRE, so
 * nobody has to rediscover it: the day a SECOND arm file enters the registry, a
 * baseline taken from the wrong file reports arms that do not include the
 * record's, the reading is REFUSED naming that arm, and the run is red on the
 * first pass. That is the loud failure, which is this project's own condition
 * for leaving a guard alone; deleting the key instead would be deleting a
 * correctness the second record needs, to remove a line no red covers.
 */
const baselines = new Map<string, Promise<ArmFileRun>>();

function unweakened(file: string): Promise<ArmFileRun> {
  const taken = baselines.get(file) ?? takeBaseline(file);
  baselines.set(file, taken);
  return taken;
}

// OVER THE FILES THE REGISTRY NAMES AND NOT OVER ONE SPELLED HERE, which the
// second arm file made necessary rather than tidier: a baseline is what every
// red below is attributed against, and a file entering the registry without one
// would have its records read against no unweakened run at all.
for (const file of new Set(records.map((record) => record.arm.file))) {
  test(`every arm in ${file} passes before any weakening`, async () => {
    const before = await unweakened(file);
    // THE HALF THAT MAKES EVERY RED BELOW ATTRIBUTABLE. Each record requires the
    // arms it does NOT name to stay green under its weakening; that requirement
    // means nothing unless they were green to begin with, and this stage is not
    // this repository -- it carries no bunfig.toml, so no build ran in it.
    expect([...(before.arms ?? [])].filter(([, result]) => result === "failed")).toEqual([]);
    // AND THE PAIR: an empty list of failures and a reader that opened nothing are
    // the same observation without it.
    expect(before.arms?.size ?? 0).toBeGreaterThan(0);
  });
}

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
