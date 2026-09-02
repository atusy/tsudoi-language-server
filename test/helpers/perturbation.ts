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
  /**
   * Arms allowed, but not required, to redden beside the named arm.
   *
   * Like `alsoReddens`, every name is an arm in the SAME file as `arm`.
   *
   * This is for collateral governed by an external ordering the arm deliberately
   * leaves real, such as filesystem directory enumeration. Reds outside the
   * required and optional sets still disarm the record.
   */
  readonly mayAlsoRedden?: readonly string[];
  /**
   * A fragment of the ASSERTION the red was measured falling at, or absent when
   * the record says nothing about where in its arm the red lands.
   *
   * A FRAGMENT OF THE SOURCE LINE AND NEVER A LINE NUMBER: this repository has
   * measured line numbers going stale inside the sprint that wrote them, and a
   * record pinned to one would report a moved assertion as a moved subject.
   *
   * WHAT IT BUYS, WHICH `alsoReddens` DOES NOT: in a file whose arms compare a
   * block WHOLE, one weakening reddens most of the file, and a record that named
   * only WHICH arms went red cannot tell an arm reddening at its own subject
   * from the same arm reddening at a premise three assertions earlier.
   */
  readonly redAt?: string;
}

/** A `<testcase>`'s own result, which is what a record's required red is about. */
export type ArmResult = "passed" | "failed";

/** One run of one arm file, as the results of every arm in it. */
export interface ArmFileRun {
  /** The process's own exit, kept so an arm can assert the two readings DISAGREE. */
  readonly exit: number | null;
  /** Every arm the run reported, by name; `null` when no report was written. */
  readonly arms: ReadonlyMap<string, ArmResult> | null;
  /**
   * bun's own failure text for each arm that reddened, keyed as `arms` keys it.
   *
   * OPTIONAL RATHER THAN REQUIRED, so that a hand-built run -- the arms that
   * drive `reRun` past its refusals pass `{ exit, arms }` literals -- does not
   * have to carry a field it has nothing to say about.
   *
   * READ OFF THE CONSOLE AND NOT OFF THE REPORT, which is not a preference:
   * MEASURED at bun 1.3.13, a `<testcase>` bun failed carries `<failure
   * type="AssertionError" />` and NO message, so the report can say THAT an arm
   * reddened and never where.
   */
  readonly failures?: ReadonlyMap<string, string>;
}

/**
 * What this can say about a record, and only two of them are colours a caller
 * should tolerate.
 *
 * `disarmed` HAS TWO SPELLINGS AND ONE MEANING, which is why they share a name:
 * the required red is present and BELONGS TO SOMETHING ELSE -- either the arm was
 * already red before the weakening, or reds nobody recorded stand beside it.
 */
export type Verdict = "held" | "gone quiet" | "disarmed" | "refused";

/**
 * WHERE bun SAYS THE RED FELL: the source line its caret sits under, and the
 * matcher's own report of what it expected and got.
 *
 * THE CARET AND NOT THE FRAME AROUND IT, which is one of the two differences a
 * `redAt` depends on: bun prints the two lines before the failing one and the
 * one after, so a fragment matched against the whole block is satisfied by an
 * assertion a line away from the one that failed. The first record this was
 * declared on has FOUR CONSECUTIVE assertion lines, two of them about a
 * directory and two about a file, so a frame reading would certify the file half
 * on a red at the directory half.
 *
 * AND THE VALUES ARE KEPT, WHICH IS THE OTHER: an arm that SWEEPS -- the prefix
 * relation runs over two formats and four source names -- spends one source line
 * on every cell, so a line alone cannot say which cell reddened. What separates
 * them is the value, and only for an arm that put the cell INTO the value it
 * asserts, which is why the two go together and neither is enough.
 *
 * THE STACK TRACE IS CUT OFF, so that no record can be written against the
 * `file.ts:4:21` at the end of it -- the line number this field exists to avoid.
 *
 * A BLOCK WITH NO CARET ANSWERS WITH WHAT IS LEFT rather than with nothing: a
 * red that is not an assertion -- a throw, a timeout -- still carries text a
 * record can name, and answering "" would refuse every record over one.
 */
function siteOf(failure: string): string {
  const lines = failure.split("\n");
  const caret = lines.findIndex((line) => /^ *\^ *$/u.test(line));
  const trace = lines.findIndex((line) => /^\s+at /u.test(line));
  const end = trace === -1 ? lines.length : trace;
  if (caret < 1) {
    return lines.slice(0, end).join("\n").trim();
  }
  const framed = /^\s*\d+ \| (.*)$/u.exec(lines[caret - 1] ?? "");
  return [framed?.[1]?.trim() ?? "", ...lines.slice(caret + 1, end)].join("\n").trim();
}

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
  /** Where the NAMED arm's red fell, as `siteOf` reads it; "" when it did not redden. */
  readonly redFellAt: string;
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

/**
 * bun's console output split into one failure block per arm that reddened.
 *
 * THE ARM IS THE REPORTED NAME THE CONSOLE LABEL ENDS WITH, and the two spelling
 * differently is the reason this is a lookup rather than a key: MEASURED, an arm
 * inside a `describe` is `outer group > its own name` on the console and its own
 * name alone in the report, and the duration suffix is printed for some arms and
 * omitted for others. Matching the report's own names keeps the two readers from
 * disagreeing about which arm a block belongs to.
 *
 * A LABEL MATCHING NOTHING IS DROPPED RATHER THAN THROWN OVER: the console is
 * not this module's contract, and an unattributable block costs a record its
 * `redAt` reading -- which is a REFUSED -- where a throw would cost every record
 * over that file its verdict.
 */
function readFailures(stderr: string, failed: readonly string[]): Map<string, string> {
  const texts = new Map<string, string>();
  let block: string[] = [];
  for (const line of stderr.split("\n")) {
    const marked = /^\(fail\) (.*?)(?: \[[\d.]+\s*[a-z]+\])?$/u.exec(line);
    if (marked === null) {
      block.push(line);
      continue;
    }
    const label = marked[1] ?? "";
    const arm = failed
      .filter((name) => label === name || label.endsWith(` > ${name}`))
      .sort((left, right) => right.length - left.length)[0];
    // Bun repeats each `(fail)` label in the final summary. The first label is
    // preceded by that arm's assertion block; the repeated label is preceded by
    // whatever tests ran after it. Keep the first attribution so a late summary
    // cannot replace the failure site with unrelated `(pass)` lines.
    if (arm !== undefined && !texts.has(arm)) {
      texts.set(arm, block.join("\n"));
    }
    block = [];
  }
  return texts;
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
    // STDERR IS PIPED AND STDOUT IS NOT, because the failure text a record's
    // `redAt` is read from is written there and the report carries none of it.
    // `close` rather than `exit`, so the pipe is drained before it is parsed.
    const child = spawn("bun", ["test", file, "--reporter=junit", `--reporter-outfile=${report}`], {
      cwd: stage,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("close", (exit) => {
      const arms = existsSync(report) ? readReport(readFileSync(report, "utf8")) : null;
      settle({
        exit,
        arms,
        failures: readFailures(
          stderr,
          [...(arms ?? new Map())]
            .filter(([, result]) => result === "failed")
            .map(([name]) => name),
        ),
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
  const base = {
    record,
    before: armBefore,
    after: armAfter,
    exit: after.exit,
    reddened,
    redFellAt: siteOf(after.failures?.get(record.arm.name) ?? ""),
  };
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
  const beforeArms = before.arms;
  const afterArms = after.arms;
  const optional = record.mayAlsoRedden ?? [];
  const staleOptional = optional.filter((name) => !beforeArms.has(name) || !afterArms.has(name));
  if (staleOptional.length > 0) {
    return {
      ...base,
      verdict: "refused",
      detail: `the optional collateral ${staleOptional.sort().join(", ")} did not run in both arm reports, so this record cannot show that it still names an arm`,
    };
  }
  const required = [record.arm.name, ...record.alsoReddens].sort();
  const allowed = new Set([...required, ...optional]);
  const observed = [...reddened].sort();
  const observedSet = new Set(observed);
  const missing = required.filter((name) => !observedSet.has(name));
  const unexpected = observed.filter((name) => !allowed.has(name));
  if (missing.length > 0 || unexpected.length > 0) {
    return {
      ...base,
      verdict: "disarmed",
      detail: `the weakening reddens ${observed.join(", ")} where this record requires ${required.join(", ")} and optionally allows ${[...optional].sort().join(", ") || "nothing"}, so the red beside the named arm belongs to something else`,
    };
  }
  // REFUSED AND NOT DISARMED, and the two are told apart by what the reader is
  // being asked to do: an arm reddening at an assertion the record did not name
  // is a record that describes its own arm wrongly, which is repaired HERE --
  // where DISARMED sends a reader to the tree.
  if (record.redAt !== undefined && !base.redFellAt.includes(record.redAt)) {
    return {
      ...base,
      verdict: "refused",
      detail: `${record.arm.name} reddened at \`${base.redFellAt}\` where this record names \`${record.redAt}\`, so the red it reports is not the one it measured`,
    };
  }
  return { ...base, verdict: "held", detail: "" };
}

/**
 * One line per record, NAMING THE ARM IT WEAKENED -- and, where the record says
 * so, WHERE the red was required to fall.
 *
 * THE SITE IS PART OF THE NAME AND NOT DECORATION: more than one record weakens
 * ONE arm, so a report naming the arm alone prints the same line twice over and
 * a reader cannot tell which of them held.
 *
 * THE NAMES ARE THE REPORT AND A COUNT IS NOT, and nothing reddens if a count is
 * added: a green here must never be readable as a statement about arms outside
 * the registry.
 */
export function line(reading: Reading): string {
  const held = reading.verdict === "held";
  return `  [${reading.verdict.toUpperCase()}] ${named(reading.record)} -- ${reading.record.arm.file}${held ? "" : ` -- ${reading.detail}`}`;
}

/** A record as the arm it weakens, and the site when it names one. */
export function named(record: PerturbationRecord): string {
  return record.redAt === undefined ? record.arm.name : `${record.arm.name} @ ${record.redAt}`;
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
