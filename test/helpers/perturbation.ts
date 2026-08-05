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
import { dirname, join, resolve, sep } from "node:path";
import { repoRoot } from "./spawn.ts";

/**
 * RE-RUNNING A RECORDED PERTURBATION, so that an arm which has stopped noticing
 * its own predicate being weakened reddens on the next run instead of at the
 * next review.
 *
 * WHAT IT IS SILENT ABOUT, NAMED RATHER THAN LEFT TO BE ASSUMED: an arm carrying
 * no record at all, and a record whose weakening is arbitrary rather than one
 * step weaker. Nothing here may be read as a statement about either.
 */

/** The one-step weakening, as the source edit that produces it. */
export interface Weakening {
  /** The file it edits, relative to the checkout root. */
  readonly file: string;
  /** The text it replaces. */
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
 * IT DELIBERATELY DOES NOT ATTACH TO THE ACT OF CLOSING A SUBTASK: a field
 * required of every completed subtask forces a record to be INVENTED AT PLANNING
 * TIME, before any arm exists, and reddens every historical completed subtask on
 * the day it lands.
 */
export interface PerturbationRecord {
  /** The arm whose predicate this weakens. */
  readonly arm: Arm;
  readonly weakening: Weakening;
  /** Arms other than `arm.name`, in the SAME file, measured to redden with it. */
  readonly alsoReddens: readonly string[];
}

/** A `<testcase>`'s own result, which is what a record's required red is about. */
export type ArmResult = "passed" | "failed";

/** One run of one arm file, as the results of every arm in it. */
export interface ArmFileRun {
  /** The process's own exit, kept so an arm can assert the two readings DISAGREE. */
  readonly exit: number | null;
  /** Every arm the run reported, by name; `null` when no report was written. */
  readonly arms: ReadonlyMap<string, ArmResult> | null;
}

/**
 * The four things this can say about a record, and only two of them are colours
 * a caller should tolerate.
 *
 * `disarmed` HAS TWO SPELLINGS AND ONE MEANING, which is why they share a name:
 * the required red is present and BELONGS TO SOMETHING ELSE -- either the arm was
 * already red before the weakening, or reds nobody recorded stand beside it.
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
 * CHUNKED ON THE OPENING TAG so it never has to ask where one ends. That reason
 * is unwitnessed by construction -- the state it is for, a reporter that stops
 * escaping so a name can carry a tag's end, cannot be reached from a name at all
 * while the reporter escapes -- and the trade is a weaker bet of the same kind:
 * that `<testcase ` never occurs INSIDE a name.
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
    // BOUNDED AT ITS OWN SUITE'S END, AND NOTHING REDDENS IF THE BOUND GOES: a
    // report carrying more than one `<testsuite>` lets the last chunk of one run
    // into the next, and a `<failure` over there is not this arm's.
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

/** Runs one arm file in a staged checkout and reads every arm's own result. */
export function runArmFile(stage: ThrowawayPath, file: string): Promise<ArmFileRun> {
  const report = throwawayTarget(stage, "perturbation-report.xml");
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

declare const throwawayBrand: unique symbol;

/** A PATH THIS MODULE MADE, WHICH IS THE ONLY KIND ANYTHING HERE MAY MUTATE. */
export type ThrowawayPath = string & { readonly [throwawayBrand]: true };

/**
 * A REFUSAL RATHER THAN A FILTER: a caller handing this a path this module could
 * not have made gets an exception, never a silent skip.
 *
 * THE ACCIDENT IT EXISTS AFTER: a hand-run perturbation made a staging function
 * return the CHECKOUT ROOT, and the recursive delete at the far end of that
 * value -- written by a different hand, in a different file, validating nothing
 * -- removed the working tree and its `.git`. So the guard is on the MUTATION
 * and not on the perturbation, and it is re-asked at each mutating end rather
 * than left to `ThrowawayPath`, because a hand-written degenerate CAN CAST.
 */
export function throwawayOnly(path: string): ThrowawayPath {
  const resolved = realpathSync(path);
  const checkout = realpathSync(repoRoot);
  if (resolved === checkout || resolved.startsWith(checkout + sep)) {
    throw new Error(
      `${resolved} is inside the checkout ${checkout}, so nothing here will stage into it, write to it or delete it`,
    );
  }
  const throwaway = realpathSync(tmpdir());
  if (resolved !== throwaway && !resolved.startsWith(throwaway + sep)) {
    throw new Error(
      `${resolved} is not under ${throwaway}, so nothing here will stage into it or delete it`,
    );
  }
  return path as ThrowawayPath;
}

/**
 * The path one mutating end is about to touch, refused unless it is inside a
 * throwaway this module made.
 *
 * WHAT IT DOES NOT CATCH, NAMED RATHER THAN FIXED: the stage borrows
 * `node_modules` BY SYMLINK into the real checkout, so a target under it is
 * lexically inside the stage and physically inside the repository. Nothing a
 * record weakens lives there -- what a record names is a tracked file.
 */
function throwawayTarget(stage: ThrowawayPath, target: string): string {
  const root = realpathSync(throwawayOnly(stage));
  const path = resolve(root, target);
  if (path !== root && !path.startsWith(root + sep)) {
    throw new Error(`${path} is outside the throwaway ${root}, so nothing here will write to it`);
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
 * WHAT NO BUILD RUNNING INSIDE THE RUN COSTS, NAMED RATHER THAN DISCOVERED: a
 * record whose arm needs a freshly built dist/ fails in this stage FOR A REASON
 * THAT IS NOT ITS WEAKENING.
 */
export function stageCheckout(): { readonly root: ThrowawayPath; dispose: () => void } {
  const root = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-perturbation-")));
  const listed = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  if (listed.status !== 0) {
    throw new Error(`git ls-files failed in ${repoRoot}, so no stage could be built`);
  }
  for (const tracked of listed.stdout.split("\0").filter((entry) => entry !== "")) {
    const destination = throwawayTarget(root, tracked);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(repoRoot, tracked), destination);
  }
  rmSync(throwawayTarget(root, "bunfig.toml"), { force: true });
  symlinkSync(join(repoRoot, "node_modules"), throwawayTarget(root, "node_modules"), "dir");
  return {
    root,
    dispose: (): void => rmSync(throwawayOnly(root), { recursive: true, force: true }),
  };
}

/**
 * Plants a file inside a staged tree, THROUGH THE SAME GUARD EVERY OTHER WRITE
 * HERE GOES THROUGH, so an arm with a file to plant has somewhere to put it that
 * is not `writeFileSync(join(stage, ...))`.
 */
export function writeInThrowaway(stage: ThrowawayPath, file: string, contents: string): void {
  const path = throwawayTarget(stage, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

/** Applies one weakening to a staged tree. */
export function applyWeakening(stage: ThrowawayPath, weakening: Weakening): void {
  const path = throwawayTarget(stage, weakening.file);
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
 * THE NAMES ARE THE REPORT AND A COUNT IS NOT, and nothing reddens if a count is
 * added: a green here must never be readable as a statement about arms outside
 * the registry.
 */
export function line(reading: Reading): string {
  const held = reading.verdict === "held";
  return `  [${reading.verdict.toUpperCase()}] ${reading.record.arm.name} -- ${reading.record.arm.file}${held ? "" : ` -- ${reading.detail}`}`;
}

/**
 * The run every record over one arm file is read against: the same stage, with
 * no weakening in it.
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
 * a file that stages a tree and runs a file that stages a tree. THE REFUSAL IS
 * ON WHAT THE ARM FILE IMPORTS RATHER THAN ON ITS NAME, and nothing reddens if
 * it reads the name instead -- so it survives the registry moving or being
 * split.
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
