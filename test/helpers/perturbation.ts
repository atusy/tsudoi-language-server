import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { repoRoot } from "./spawn.ts";

/**
 * RE-RUNNING A RECORDED PERTURBATION, so that an arm which has stopped noticing
 * its own predicate being weakened reddens on the next run instead of at the
 * next review.
 *
 * WHAT THIS DECIDES AND WHAT IT DELIBERATELY CANNOT. It decides FIDELITY: a
 * perturbation, once recorded, is a weakening, a named arm and a required red,
 * and applying it and reading THAT ARM'S OWN RESULT needs no heuristic. It is
 * SILENT about arms carrying no record at all, and that silence is honest --
 * a check deciding whether an arm HAS a perturbation is an approximate
 * detector, and its failure mode is a GREEN CERTIFYING A CLASS AS WATCHED.
 * Nothing here may be read as a statement about an arm nobody recorded.
 *
 * AND `THE ADJACENT WEAKER READING` IS A SEMANTIC JUDGEMENT NOTHING BELOW
 * VERIFIES. A record whose weakening is arbitrary, or trivially detectable
 * rather than one step weaker, runs green here. That residue is named rather
 * than fixed.
 */

/** The one-step weakening, as the source edit that produces it. */
export interface Weakening {
  /** The file it edits, relative to the checkout root. */
  readonly file: string;
  /** The text it replaces. Required to occur EXACTLY ONCE, or the record is refused. */
  readonly from: string;
  /** The adjacent weaker reading, as the text that replaces it. */
  readonly to: string;
}

/** An arm, as the two things needed to run it and find its own result. */
export interface Arm {
  /** Its file, relative to the checkout root. */
  readonly file: string;
  /** Its name, exactly as `test()` spells it. */
  readonly name: string;
}

/**
 * A perturbation recorded as something the suite RE-RUNS.
 *
 * THE OBLIGATION SITS ON THE CLAIM AND NOWHERE ELSE. This type refuses a record
 * that names an arm and a required red while carrying no weakening -- that is
 * the whole of the exactness a compiler can add here. It deliberately does NOT
 * attach to the act of closing a subtask: a field required of every completed
 * subtask forces a record to be INVENTED AT PLANNING TIME, before any arm
 * exists, and reddens every historical completed subtask on the day it lands.
 * Both are the shackle the stakeholder named, and neither buys any exactness
 * this does not already have.
 */
export interface PerturbationRecord {
  /** The arm whose predicate this weakens. */
  readonly arm: Arm;
  readonly weakening: Weakening;
  /**
   * Arms other than `arm.name`, in the SAME file, MEASURED to redden under this
   * weakening too.
   *
   * IT IS A MEASUREMENT AND NOT A TOLERANCE, which is why the reading below
   * requires the failing set to EQUAL this one rather than to be contained in
   * it. A weakening that reddens something nobody recorded is a red whose cause
   * is not the weakening; a name here that STOPS reddening is a measurement
   * that has gone stale. Both are worth a red, and a subset test would let the
   * second one through.
   */
  readonly alsoReddens: readonly string[];
}

/** A `<testcase>`'s own result, which is what a record's required red is about. */
export type ArmResult = "passed" | "failed";

/** One run of one arm file, as the results of every arm in it. */
export interface ArmFileRun {
  /** The process's own exit, kept so an arm can assert the two readings DISAGREE. */
  readonly exit: number | null;
  /**
   * Every arm the run reported, by name.
   *
   * `null` MEANS NO REPORT WAS WRITTEN AT ALL, which is a different state from
   * an empty one and must never collapse into it. MEASURED on bun 1.3.13: a
   * file that fails to LOAD -- the state a weakening breaking compilation
   * produces -- exits non-zero, prints `1 error`, and WRITES NO REPORT FILE.
   * A reader taking the exit code alone calls that `the named arm reddened`.
   */
  readonly arms: ReadonlyMap<string, ArmResult> | null;
}

/**
 * The four things this can say about a record, and only two of them are colours
 * a caller should tolerate.
 *
 * `held` and `refused` are not one verdict: a refusal means the record could not
 * be APPLIED -- its `from` is gone, its arm is gone, its tree would not load --
 * and telling the caller that is the whole reason the exit code is not read.
 *
 * `disarmed` HAS TWO SPELLINGS AND ONE MEANING, which is why they share a name:
 * the required red is present and BELONGS TO SOMETHING ELSE. Either the arm was
 * already red before the weakening was applied, or reds nobody recorded stand
 * beside it. This project's vocabulary calls that DISARMED -- something else
 * removed the control's ability to fire -- and both spellings are that.
 */
export type Verdict = "held" | "gone quiet" | "disarmed" | "refused";

/** What one record read, in enough detail for an arm to assert the discrimination. */
export interface Reading {
  readonly record: PerturbationRecord;
  readonly verdict: Verdict;
  /** The named arm's own result before the weakening, `null` when it was not reported. */
  readonly before: ArmResult | null;
  /** The named arm's own result under the weakening, `null` when it was not reported. */
  readonly after: ArmResult | null;
  /** The mutated run's own process exit. */
  readonly exit: number | null;
  /** Every arm that failed under the weakening, the named one included, in report order. */
  readonly reddened: readonly string[];
  /** Why, when the verdict is not `held`. Empty otherwise. */
  readonly detail: string;
}

/**
 * Reads bun's JUnit report into one result per arm.
 *
 * CHUNKED ON THE OPENING TAG RATHER THAN MATCHED AS AN ELEMENT, and the reason
 * this was first written down is FALSE ON THE BUN THIS RUNS UNDER, which is
 * recorded rather than quietly repaired: it said bun does not escape `>` inside
 * an attribute value. MEASURED on bun 1.3.13 -- the version this module already
 * cites -- a name carrying `<`, `>`, `&`, `"` and `'` comes back with all five
 * written as entities, so an element regex would find the tag's end correctly
 * today.
 *
 * THE CHUNKING IS KEPT ANYWAY, AND ITS HONEST REASON IS THAT IT NEVER HAS TO ASK
 * WHERE A TAG ENDS: that is a property of the REPORTER's escaping, nothing here
 * pins it, and the failure if it changes is silent misattribution rather than a
 * crash. That reason is unwitnessed by construction -- the state it is for
 * cannot be produced on a bun that escapes -- and it is named rather than
 * armed. The unescaping below is the half that IS armed, in
 * test/perturbations.test.ts.
 *
 * AND THE TRADE IS NOT AN ESCAPE FROM THE DEPENDENCY, ONE STEP OVER: splitting
 * on `<testcase ` assumes that literal never occurs INSIDE a name, which is the
 * same bet on the reporter's escaping wearing different clothes. It is a weaker
 * bet -- an arm would have to be named with that exact prefix, where the
 * element form breaks on any `>` -- and it is written here rather than tested,
 * because on a bun that escapes `<` the state cannot be reached from a name at
 * all.
 */
function readReport(xml: string): Map<string, ArmResult> {
  const arms = new Map<string, ArmResult>();
  const chunks = xml.split("<testcase ");
  for (const chunk of chunks.slice(1)) {
    const named = /name="([^"]*)"/.exec(chunk);
    if (named === null) {
      throw new Error(
        "a <testcase> in bun's report carries no name, so no arm's result can be read",
      );
    }
    // BOUNDED AT ITS OWN SUITE'S END, AND NOT SPLIT ON `<testcase ` A SECOND
    // TIME: this chunk is what splitting on that delimiter produced, so it holds
    // none, and the second split returned its input -- an expression that could
    // not have been false, which is the shape this module exists to catch. The
    // suite bound is live and stays: a report carrying more than one
    // `<testsuite>` lets the last chunk of one run into the next, and a
    // `<failure` over there is not this arm's.
    const own = chunk.split("</testsuite")[0] ?? chunk;
    arms.set(unescapeXml(named[1] ?? ""), own.includes("<failure") ? "failed" : "passed");
  }
  return arms;
}

/** The five entities an XML attribute value may carry, and no other rewriting. */
function unescapeXml(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/**
 * Runs one arm file in a staged checkout and reads every arm's own result.
 *
 * THE FILE UNFILTERED AND NEVER `-t <name>`. MEASURED: a filter matching exactly
 * one arm reads `1 pass / 0 fail`, so the RUN'S AGGREGATE and THE ARM'S OWN
 * RESULT become extensionally equal -- which is the very class of defect this
 * module exists to catch, arriving in the cheapest implementation of it. It also
 * throws away every other arm's result, which is what makes a red attributable.
 */
export function runArmFile(stage: string, file: string): Promise<ArmFileRun> {
  const report = join(stage, "perturbation-report.xml");
  rmSync(report, { force: true });
  return new Promise((settle) => {
    const child = spawn("bun", ["test", file, "--reporter=junit", `--reporter-outfile=${report}`], {
      cwd: stage,
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.on("close", (exit) => {
      settle({
        exit,
        arms: existsSync(report) ? readReport(readFileSync(report, "utf8")) : null,
      });
    });
  });
}

/**
 * THE ONE PLACE A PATH IS ALLOWED TO BE DELETED, AND IT IS A REFUSAL RATHER THAN
 * A FILTER: a caller handing this something outside the system temporary
 * directory gets an exception, never a silent skip.
 *
 * IT IS THIS SPRINT'S OWN FINDING, MEASURED THE WORST WAY: a hand-run
 * perturbation made a staging function return the CHECKOUT ROOT, and the
 * recursive delete standing at the far end of that value -- written by a
 * different hand, in a different file, validating nothing -- removed the working
 * tree and its `.git`. The instrument that produced the value was doing its job.
 * WHAT WAS MISSING IS EXACTLY WHAT THIS ITEM IS ABOUT: the destructive end read
 * the RIGHT QUANTITY -- a path -- against a subject that could not discriminate a
 * throwaway from the repository, because nothing asked.
 *
 * SO THE GUARD IS ON THE DELETE AND NOT ON THE PERTURBATION. A note saying `do
 * not point a stager at the checkout` foreclose nothing: a `TMPDIR` that
 * resolves oddly, an early return added later, or a caller passing its own root
 * all reach the same `rmSync` with the same silence.
 *
 * realpathSync ON BOTH SIDES, because on macOS the temporary directory lives
 * under a symlink and a prefix test between the two spellings passes nothing.
 */
export function throwawayOnly(path: string): string {
  const resolved = realpathSync(path);
  const throwaway = realpathSync(tmpdir());
  if (resolved !== throwaway && !resolved.startsWith(throwaway + sep)) {
    throw new Error(
      `${resolved} is not under ${throwaway}, so nothing here will stage into it or delete it`,
    );
  }
  return path;
}

/**
 * A throwaway checkout of every TRACKED file, which the weakening is applied to.
 *
 * THE WORKING TREE IS NEVER EDITED. An arm that mutates a version-controlled
 * file in order to observe something has a recorded history in this repository
 * of measuring nothing, and here it would also race every other file in the
 * suite.
 *
 * bunfig.toml IS REMOVED, SO NO BUILD RUNS INSIDE THE RUN. The preload compiles
 * every package before any test file loads, and running it here would be an
 * inner build per record -- and would compile the WEAKENED source, which is
 * right for a weakening in a package's src/ and wrong for one in scripts/.
 * WHAT THAT COSTS, NAMED RATHER THAN DISCOVERED: a record whose arm needs a
 * freshly built dist/ fails in this stage FOR A REASON THAT IS NOT ITS
 * WEAKENING. No dist/ is copied either, for the same reason it is not needed:
 * MEASURED, test/definition-of-done.test.ts reads 15 pass / 0 fail in a stage
 * holding tracked files and a borrowed node_modules and nothing else.
 *
 * node_modules IS BORROWED BY SYMLINK because it is neither tracked nor cheap,
 * and nothing a record weakens lives in it.
 */
export function stageCheckout(): { readonly root: string; dispose: () => void } {
  const root = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-perturbation-")));
  const listed = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  if (listed.status !== 0) {
    throw new Error(`git ls-files failed in ${repoRoot}, so no stage could be built`);
  }
  for (const tracked of listed.stdout.split("\0").filter((entry) => entry !== "")) {
    const destination = join(root, tracked);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(repoRoot, tracked), destination);
  }
  rmSync(join(root, "bunfig.toml"), { force: true });
  symlinkSync(join(repoRoot, "node_modules"), join(root, "node_modules"), "dir");
  return {
    root,
    dispose: (): void => rmSync(throwawayOnly(root), { recursive: true, force: true }),
  };
}

/**
 * Applies one weakening to a staged tree.
 *
 * EXACTLY ONE OCCURRENCE, OR THE RECORD IS REFUSED. A `from` that no longer
 * appears means the code moved under the record and the run that follows would
 * measure the UNWEAKENED tree -- a green saying nothing. A `from` appearing
 * twice means the record does not say which site it weakens.
 */
export function applyWeakening(stage: string, weakening: Weakening): void {
  const path = join(stage, weakening.file);
  const before = readFileSync(path, "utf8");
  const occurrences = before.split(weakening.from).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `${weakening.file} holds ${occurrences} occurrences of this record's \`from\`, so the weakening it names cannot be applied`,
    );
  }
  writeFileSync(path, before.replace(weakening.from, weakening.to));
}

/** The arms that failed in a run, in the order the report listed them. */
function reddenedIn(run: ArmFileRun): readonly string[] {
  return [...(run.arms ?? new Map())]
    .filter(([, result]) => result === "failed")
    .map(([name]) => name);
}

/**
 * Reads one record against a run taken WITHOUT its weakening and one taken WITH
 * it.
 *
 * BOTH RUNS, ALWAYS. The baseline is not a courtesy: an arm already red before
 * the weakening is applied reddens under it too, and every reading that looks
 * only at the mutated run calls that a held record.
 */
export function read(record: PerturbationRecord, before: ArmFileRun, after: ArmFileRun): Reading {
  const armBefore = before.arms?.get(record.arm.name) ?? null;
  const armAfter = after.arms?.get(record.arm.name) ?? null;
  const reddened = reddenedIn(after);
  const base = { record, before: armBefore, after: armAfter, exit: after.exit, reddened };
  if (before.arms === null || after.arms === null) {
    return {
      ...base,
      verdict: "refused",
      detail: "the arm file did not run to a report, so no arm has a result of its own here",
    };
  }
  if (armBefore === null || armAfter === null) {
    return {
      ...base,
      verdict: "refused",
      detail: `no arm named ${record.arm.name} ran in ${record.arm.file}`,
    };
  }
  if (armAfter === "passed") {
    return {
      ...base,
      verdict: "gone quiet",
      detail: `${record.arm.name} no longer reddens on the weakening recorded against it`,
    };
  }
  if (armBefore === "failed") {
    return {
      ...base,
      verdict: "disarmed",
      detail: `${record.arm.name} is already red WITHOUT the weakening, so its red belongs to something else`,
    };
  }
  const required = [record.arm.name, ...record.alsoReddens].sort();
  const observed = [...reddened].sort();
  if (required.join("\n") !== observed.join("\n")) {
    return {
      ...base,
      verdict: "disarmed",
      detail: `the weakening reddens ${observed.join(", ")} where this record measured ${required.join(", ")}, so the red beside the named arm belongs to something else`,
    };
  }
  return { ...base, verdict: "held", detail: "" };
}

/**
 * One line per record, NAMING THE ARM IT WEAKENED.
 *
 * THE NAMES ARE THE REPORT AND A COUNT IS NOT. A green here must never be
 * readable as a statement about arms outside the registry, so what is printed is
 * exactly which arms were weakened; how many there are is computed by whoever
 * counts the lines and is written down nowhere.
 */
export function line(reading: Reading): string {
  const held = reading.verdict === "held";
  return `  [${held ? "HELD" : reading.verdict.toUpperCase()}] ${reading.record.arm.name} -- ${reading.record.arm.file}${held ? "" : ` -- ${reading.detail}`}`;
}

/**
 * The run every record over one arm file is read against: the same stage, with
 * no weakening in it.
 *
 * TAKEN ONCE PER FILE AND SHARED, so several records over one file pay for it
 * once. It is a full run of the file and not a filtered one, which buys the
 * second half of the attribution reading: the arms a weakening is measured NOT
 * to touch are green here, so the ones it reddens are its own.
 */
export async function takeBaseline(file: string): Promise<ArmFileRun> {
  const stage = stageCheckout();
  try {
    return await runArmFile(stage.root, file);
  } finally {
    stage.dispose();
  }
}

/**
 * Stages, weakens, runs, and reads -- the whole of one record.
 *
 * IT REFUSES A RECORD WHOSE ARM IS ONE OF THIS MODULE'S OWN: such a record runs
 * a file that stages a tree and runs a file that stages a tree. The refusal is
 * on what the arm file IMPORTS rather than on its name, so it survives the
 * registry moving or being split.
 *
 * WHAT THAT RECURSION ACTUALLY DOES WAS MEASURED WITH THE REFUSAL DELETED, AND
 * IT IS LESS THAN THIS COMMENT ONCE CLAIMED: it stops at the SECOND level, where
 * `repoRoot` is the stage, the stage holds no `.git`, and `git ls-files` exits
 * 128 -- 264 ms, and no third process. So the refusal is not standing between
 * this suite and a machine to restart; it stands between a reader and a red
 * reading `git ls-files failed in /var/folders/...`, which names neither the
 * record nor the recursion. AND THE BOTTOM IS AN ACCIDENT OF THE STAGER: copy a
 * `.git` in for any reason and it is gone, while this refusal is not.
 */
export async function reRun(record: PerturbationRecord, before: ArmFileRun): Promise<Reading> {
  const stage = stageCheckout();
  try {
    const armFile = readFileSync(join(stage.root, record.arm.file), "utf8");
    if (armFile.includes("helpers/perturbation.ts")) {
      throw new Error(
        `${record.arm.file} re-runs perturbations itself, so a record naming an arm in it would spawn without bound`,
      );
    }
    applyWeakening(stage.root, record.weakening);
    return read(record, before, await runArmFile(stage.root, record.arm.file));
  } finally {
    stage.dispose();
  }
}
