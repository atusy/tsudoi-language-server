import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE ONE FORM FOR TAKING THE DEFINITION OF DONE, driven against throwaway
 * dashboards rather than against this repository's own.
 *
 * WHY NOT AGAINST THIS REPOSITORY: every arm below hands it a checkout whose
 * checks are shell scripts that report a chosen exit code, which is what
 * produces the states this is built for -- the real five are green, and an
 * instrument whose witness cannot fail measures nothing.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED HERE: that the five real checks are those
 * five. The dashboard is where that list lives, and an arm pinning it here would
 * be the second enumeration this runner exists to refuse.
 */

/** A dashboard entry, spelled as the dashboard spells one. */
interface Check {
  name: string;
  run: string;
}

/** A throwaway checkout carrying its own dashboard, and the runner's view of it. */
interface Tree {
  root: string;
  /**
   * A command that records its own invocation and then exits with `exit`,
   * optionally pausing that many seconds BEFORE it records itself.
   *
   * THE PAUSE IS AN INSTRUMENT AND NOT A DELAY, and the arm that uses it says
   * what it buys.
   */
  logged: (name: string, exit: number, pauseSeconds?: number) => string;
  /**
   * A command that records its own invocation under `name` and then BECOMES the
   * program given, whose exit code and output bytes are then its own.
   *
   * IT EXISTS SO A REAL PROGRAM'S RUN HAS AN IDENTITY. Two readings taken off
   * one check -- its exit code and its warning count -- are not one reading
   * unless the run they came from can be counted, and a deterministic program
   * cannot tell one invocation from two.
   */
  wrapping: (name: string, program: string) => string;
  /** A command that records the directory it was RUN IN rather than its name. */
  cwdProbe: () => string;
  /** A command naming a binary this machine does not have. */
  missingBinary: () => string;
  /** Writes the dashboard this tree's run will read its checks out of. */
  declare: (checks: readonly Check[]) => void;
  /** What actually ran, in the order it ran, as the checks themselves recorded it. */
  invocations: () => string[];
  /**
   * Runs the Definition of Done over this tree.
   *
   * `standalone` runs the tree's own copy of the runner with NO ARGUMENT, which
   * is the only way to measure the other half of the root rule -- a runner
   * invoked with a root can never show where it would have looked without one.
   * It takes no other argument BY CONSTRUCTION: the moment it carried one it
   * would stop being the no-argument reading it exists to take.
   *
   * `only` is passed as the shipped option, and `optionFirst` puts it BEFORE the
   * root -- an order a reader will type and one a parser reading `argv[2]` gets
   * wrong while every other arm here stays green.
   *
   * `args` hands the whole argument list over verbatim, and it exists for the
   * malformed ones: an option with its value MISSING is not a value `only` can
   * express, and it is the argument most likely to be typed by accident.
   */
  run: (options?: {
    cwd?: string;
    standalone?: boolean;
    only?: string;
    optionFirst?: boolean;
    args?: readonly string[];
  }) => Promise<CliResult>;
}

const staged: string[] = [];

afterEach(() => {
  for (const root of staged.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE SHIPPED RUNNER, RUN AS A COMMAND AND NOT IMPORTED AS A FUNCTION. What a
 * maintainer is told to type is one command, so what these arms read is that
 * command's exit code and the bytes it prints -- a function call would leave the
 * argument handling and the exit code, which are half of this, unmeasured.
 */
const runner = join(repoRoot, "scripts", "definition-of-done.ts");

function stageTree(): Tree {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dod-"));
  staged.push(root);
  const log = join(root, "invocations.log");
  const logger = join(root, "logged-check");
  // A FILE WITH A SHEBANG AND NOT A SHELL ONE-LINER, forced by the runner's own
  // shape: it spawns the program named in `run` directly, so that a command
  // naming no binary arrives as a spawn error rather than as a shell's 127.
  // Quoting a one-liner into that has nowhere to go.
  writeFileSync(
    logger,
    `#!/bin/sh\n[ -n "$3" ] && sleep "$3"\nprintf '%s\\n' "$1" >> ${log}\nexit "$2"\n`,
  );
  chmodSync(logger, 0o755);
  // THE DIRECTORY A CHECK IS RUN IN IS RECORDED THE SAME WAY ITS NAME IS,
  // because that is the half of "the same reading" no exit code carries: the
  // first real check finds its configuration only in the directory it runs in,
  // so a runner handing its checks the wrong one reports five greens over a
  // suite that built nothing, with every exit code unchanged.
  const wherever = join(root, "cwd-probe");
  writeFileSync(wherever, `#!/bin/sh\nprintf 'ran in %s\\n' "$(pwd -P)" >> ${log}\n`);
  chmodSync(wherever, 0o755);
  // A BYTE COPY OF THE RUNNER INSIDE THE TREE, so that "its own location" is
  // this throwaway and the code path is still the shipped one. Running the
  // repository's own copy with no argument would take the Definition of Done of
  // this repository -- `bun test` inside `bun test`.
  mkdirSync(join(root, "scripts"));
  const standalone = join(root, "scripts", "definition-of-done.ts");
  copyFileSync(runner, standalone);
  return {
    root,
    logged: (name, exit, pauseSeconds) =>
      `${logger} ${name} ${exit}${pauseSeconds === undefined ? "" : ` ${pauseSeconds}`}`,
    wrapping: (name, program) => {
      const wrapper = join(root, `wrapping-${name}`);
      // `exec`, SO THE WRAPPER STOPS EXISTING THE MOMENT THE REAL PROGRAM STARTS:
      // the exit code the runner reads and every byte it parses are the wrapped
      // program's own, and no arm's subject is quietly this shell.
      writeFileSync(wrapper, `#!/bin/sh\nprintf '%s\\n' "${name}" >> ${log}\nexec ${program}\n`);
      chmodSync(wrapper, 0o755);
      return wrapper;
    },
    cwdProbe: () => wherever,
    missingBinary: () => "tsudoi-no-such-binary-anywhere --check",
    declare: (checks) => {
      // THE DASHBOARD IS EXECUTED AND ITS JSON PARSED, so a throwaway one need
      // only print the same shape -- which is the whole reason the runner cannot
      // hold a list of its own.
      //
      // IT COMPUTES THE SHAPE INSTEAD OF SPELLING IT, AND THAT IS WHAT MAKES
      // `EXECUTED` MEASURABLE HERE. A fixture that wrote the object out inline
      // has its OUTPUT SITTING IN ITS TEXT, so every arm in this file would be
      // satisfied by a runner that sliced the file from its first brace to its
      // last and never ran it -- while dying on the real dashboard, which is a
      // TypeScript program. The pairs below are declared FLAT and the
      // `{ definition_of_done: { checks } }` shape is assembled at run time, so
      // NO SUBSTRING OF THIS FILE IS THE JSON IT PRINTS.
      const pairs = checks.map((check) => [check.name, check.run]);
      writeFileSync(
        join(root, "scrum.ts"),
        [
          `const declared = ${JSON.stringify(pairs)};`,
          "const checks = [];",
          "for (const [name, run] of declared) checks.push({ name, run });",
          "console.log(JSON.stringify({ definition_of_done: { checks } }));",
          "",
        ].join("\n"),
      );
    },
    invocations: () =>
      readFileSync(log, "utf8")
        .split("\n")
        .filter((line) => line !== ""),
    run: (options) => {
      if (options?.standalone === true) {
        return runCommand(`bun run ${standalone}`, options.cwd ?? root);
      }
      const filter = options?.only === undefined ? [] : ["--only", options.only];
      const composed = options?.optionFirst === true ? [...filter, root] : [root, ...filter];
      return runCommand(`bun run ${runner}`, options?.cwd ?? root, options?.args ?? composed);
    },
  };
}

/** The report is read off both streams, because a reader of one command reads both. */
function report(result: CliResult): string {
  return `${result.stdout}${result.stderr}`;
}

/**
 * What a filtered run wears where an unfiltered one wears nothing.
 *
 * SPELLED HERE AND NOT IMPORTED FROM THE RUNNER, deliberately against this
 * project's rule about two producers, for the reason that rule already carries
 * an exception for: the second producer IS the specification. A marker read out
 * of the runner moves with it, so the day it stops saying anything the arms
 * below move with it and stay green.
 */
function filterMark(only: string): string {
  return ` (FILTERED to the checks matching \`${only}\`, so NOT the whole)`;
}

test("a run in which every check passes is the only green", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).toBe(0);
  expect(report(result)).toContain("Definition of Done: PASSED");
});

test("the VERDICT WORD is the run's own, in BOTH directions", async () => {
  // BOTH DIRECTIONS IN ONE ARM, AND THE PAIR IS THE POINT: `contains PASSED on a
  // green run` is satisfied by a constant, and so is `contains FAILED on a red
  // one`. Only the two together make the word a function of the run. Two trees
  // rather than two dashboards, so neither run can influence the other's report.
  //
  // THE EXIT CODE IS DELIBERATELY NOT READ HERE: it is what every other arm in
  // this file reads, and it is exactly the reading this hazard slips past.
  const green = stageTree();
  green.declare([
    { name: "alpha", run: green.logged("alpha", 0) },
    { name: "beta", run: green.logged("beta", 0) },
  ]);
  const passing = await green.run();
  const red = stageTree();
  red.declare([
    { name: "alpha", run: red.logged("alpha", 1) },
    { name: "beta", run: red.logged("beta", 0) },
  ]);
  const failing = await red.run();
  expect(report(passing)).toContain("Definition of Done: PASSED");
  expect(report(passing)).not.toContain("Definition of Done: FAILED");
  // THE WHOLE STRING AND NEVER THE BARE WORD: a failing report carries
  // `[FAILED] alpha` on a per-check line, so `FAILED` alone is present in it
  // whatever the summary says.
  expect(report(failing)).toContain("Definition of Done: FAILED");
  expect(report(failing)).not.toContain("Definition of Done: PASSED");
});

test("a failure in the FIRST check survives a passing LAST one", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 1) },
    { name: "beta", run: tree.logged("beta", 0) },
    { name: "gamma", run: tree.logged("gamma", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  expect(report(result)).toContain("[FAILED] alpha");
  // THE HALF A LAST-STATUS RUNNER GETS RIGHT, kept so the arm cannot be
  // satisfied by stopping at the first red either: the later checks ran and
  // their own passes are in the report.
  expect(report(result)).toContain("[PASSED] gamma");
  expect(tree.invocations()).toEqual(["alpha", "beta", "gamma"]);
});

test("two failing checks are both named", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 1) },
    { name: "beta", run: tree.logged("beta", 0) },
    { name: "gamma", run: tree.logged("gamma", 3) },
  ]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  expect(report(result)).toContain("[FAILED] alpha");
  expect(report(result)).toContain("[FAILED] gamma");
});

test("what ran is the dashboard's list, as a SEQUENCE and not as a set", async () => {
  const tree = stageTree();
  // DECLARED OUT OF ALPHABETICAL ORDER ON PURPOSE. Order here is load-bearing --
  // the first real check builds every artifact the fourth reads -- and `all of
  // them ran` is MEMBERSHIP where the property is ORDER: a runner sorting the
  // list, or reversing it, changes no value and would pass a set-shaped arm.
  //
  // AND THE PAUSE IS ON THE FIRST CHECK, which is what makes the log an ORDER
  // rather than a coincidence: under a runner starting every check at once,
  // three millisecond-long commands still tend to finish in the order they were
  // STARTED, and a pause on the FIRST puts its entry LAST instead.
  tree.declare([
    { name: "gamma", run: tree.logged("gamma", 0, 0.3) },
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).toBe(0);
  // WHOLE-VALUE, WHICH IS ALSO THE ARITY ASSERTION: a check run twice, or one
  // skipped, is a different value and not a different subset.
  expect(tree.invocations()).toEqual(["gamma", "alpha", "beta"]);
});

test("a FAILING run reports each check's name, its command as run, and its own exit", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 3) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  // THE WHOLE LINE AND NOT THE VERDICT WORD: the check's OWN exit is what
  // separates `it failed` from `the run failed`.
  expect(report(result)).toContain(`[FAILED] alpha -- exit 3 -- $ ${tree.logged("alpha", 3)}`);
  // AND THE CHECK AFTER THE RED, which is what a runner exiting inside its loop
  // loses: moving its exit earlier changes no value, so nothing but the report
  // text of a failing run can see it.
  expect(report(result)).toContain(`[PASSED] beta -- exit 0 -- $ ${tree.logged("beta", 0)}`);
});

test("a SIXTH check on the dashboard runs, with no edit to the runner", async () => {
  const tree = stageTree();
  // SIX, BECAUSE FIVE IS THE NUMBER A RUNNER HOLDING ITS OWN COPY WOULD HOLD: a
  // green run that never executed a check the dashboard lists is green and
  // silent, and lets the Definition of Done shrink unnoticed.
  const names = ["one", "two", "three", "four", "five", "six"];
  tree.declare(names.map((name) => ({ name, run: tree.logged(name, 0) })));
  const result = await tree.run();
  expect(result.code).toBe(0);
  expect(tree.invocations()).toEqual(names);
  for (const name of names) {
    expect(report(result)).toContain(`[PASSED] ${name} -- exit 0`);
  }
});

test("a check that never started is REPORTED APART from one that ran and failed", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "absent", run: tree.missingBinary() },
    { name: "beta", run: tree.logged("beta", 1) },
    { name: "gamma", run: tree.logged("gamma", 0) },
  ]);
  const result = await tree.run();
  // THE COLOUR HERE IS NOT THIS ARM'S EVIDENCE AND THE NEXT ARM HOLDS THAT HALF:
  // `beta` ran and failed in this same tree, so the run is red whether or not a
  // check that never started gates anything. What this arm measures is the
  // DIFFERENCE between the two, which is why both are present.
  expect(result.code).not.toBe(0);
  expect(report(result)).toContain("[UNRUNNABLE] absent -- never started:");
  expect(report(result)).toContain(`[FAILED] beta -- exit 1 -- $ ${tree.logged("beta", 1)}`);
  expect(report(result)).not.toContain("[FAILED] absent");
  expect(report(result)).not.toContain("[PASSED] absent");
  // AND IT DID NOT SILENTLY RUN SOMETHING ELSE: the checks after it still ran,
  // which is what distinguishes a reported non-start from an aborted run.
  expect(tree.invocations()).toEqual(["beta", "gamma"]);
});

test("a check that never started GATES the run, with every other check green", async () => {
  const tree = stageTree();
  // THE SOLE NON-PASS IN THIS TREE IS THE BINARY THAT IS NOT THERE, and that is
  // the whole design: the arm above cannot say it, because a check that RAN AND
  // FAILED sits beside the missing one and reddens the run on its own. A gate
  // narrowed to `the outcome is failed` leaves outcome, reason and every byte of
  // the report unchanged and moves only the exit code, so nothing but a tree of
  // passes around one missing binary can detect it.
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "absent", run: tree.missingBinary() },
    { name: "gamma", run: tree.logged("gamma", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  expect(report(result)).toContain("Definition of Done: FAILED");
  expect(report(result)).toContain("[UNRUNNABLE] absent -- never started:");
  // THE CONTROL THAT MAKES THE COLOUR ATTRIBUTABLE: every other check in the
  // tree reported a pass, so the one thing left holding the run red is the check
  // that never started.
  expect(report(result)).toContain("[PASSED] alpha -- exit 0");
  expect(report(result)).toContain("[PASSED] gamma -- exit 0");
  expect(tree.invocations()).toEqual(["alpha", "gamma"]);
});

test("a `run` this runner cannot execute FAITHFULLY is refused, never misread", async () => {
  const tree = stageTree();
  tree.declare([
    // THE VALUE IS CHOSEN, NOT ILLUSTRATIVE: split on spaces, this spawns `true`
    // WITH THE ARGUMENTS `&&` AND `false`, which exits 0 -- reported PASSED,
    // where the shell every reader has in mind runs `false` and fails. A wrong
    // colour on a check nobody can see is worse than a red.
    { name: "conjunction", run: "true && false" },
    // THE OTHER THREE MISREADINGS, ONE EACH: a redirection becomes two
    // arguments, a quoted argument becomes two, and a glob is never expanded.
    { name: "redirection", run: `true > ${join(tree.root, "written")}` },
    { name: "quoted", run: `${tree.logged("q", 0)} "one two"` },
    // A COMMAND THAT NAMES NO PROGRAM: refused for the same reason and reported
    // the same way.
    { name: "empty", run: "   " },
    // THE POSITIVE CONTROL, AND WITHOUT IT AN OVER-BROAD REFUSAL SHIPS GREEN:
    // every other `run` in this file is a bare path or `path name exit`, so a
    // predicate that also refused flags or a `.` argument would redden
    // `oxfmt --check .` in the real Definition of Done AND NOTHING HERE. This one
    // carries both and must still run.
    { name: "flagged", run: `${tree.logged("flagged", 0)} --check .` },
    { name: "alpha", run: tree.logged("alpha", 0) },
  ]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  expect(report(result)).toContain("Definition of Done: FAILED");
  // THE REASON AND NOT ONLY THE WORD: a refusal a reader cannot act on sends
  // them back to running the check by hand, which is the habit this replaces.
  expect(report(result)).toMatch(/\[REFUSED] conjunction -- not run: [^\n]*shell/);
  expect(report(result)).toContain("[REFUSED] redirection -- not run:");
  expect(report(result)).toContain("[REFUSED] quoted -- not run:");
  expect(report(result)).toContain("[REFUSED] empty -- not run:");
  expect(report(result)).not.toContain("[PASSED] conjunction");
  expect(report(result)).toContain("[PASSED] flagged -- exit 0");
  expect(report(result)).toContain("[PASSED] alpha -- exit 0");
  // AND NOTHING WAS RUN ON THEIR ACCOUNT. Whole-value: the refused four left no
  // trace, the control ran with its flag, and the checks after them still ran --
  // a refusal is reported, not an abort.
  expect(tree.invocations()).toEqual(["flagged", "alpha"]);
});

test("the same run taken from a SUBDIRECTORY reads the same, checks included", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "where", run: tree.cwdProbe() },
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "beta", run: tree.logged("beta", 1) },
  ]);
  const fromRoot = await tree.run({ standalone: true });
  const afterRoot = tree.invocations();
  const subdirectory = join(tree.root, "somewhere", "deeper");
  mkdirSync(subdirectory, { recursive: true });
  const fromSubdirectory = await tree.run({ standalone: true, cwd: subdirectory });
  // WHOLE-VALUE ON BOTH HALVES OF THE READING. The exit codes alone cannot see
  // this: a runner handing its checks the wrong working directory changes no
  // exit code here, and only what a check RECORDS ABOUT WHERE IT RAN separates
  // them -- which is why one of these checks records that and not its name.
  expect(fromSubdirectory.code).toBe(fromRoot.code);
  expect(fromSubdirectory.code).not.toBe(0);
  expect(report(fromSubdirectory)).toBe(report(fromRoot));
  expect(tree.invocations()).toEqual([...afterRoot, ...afterRoot]);
});

/**
 * A tree whose one check is THE LINTER ITSELF, over one planted source file.
 *
 * THE REAL LINTER AND NOT A SCRIPT PRINTING A WARNING-SHAPED LINE, because the
 * count is a PARSE and its subject is that program's output format. An arm
 * echoing the shape this repository's runner looks for would assert the runner
 * against itself and would survive the linter changing its mind about how a
 * diagnostic is printed -- which is the day this needs to fail.
 *
 * The configuration is COPIED rather than re-declared, so these arms track the
 * file that actually ships, exactly as test/helpers/lint.ts does for its probes.
 */
function stageLinted(source: string): Tree {
  const tree = stageTree();
  copyFileSync(join(repoRoot, ".oxlintrc.json"), join(tree.root, ".oxlintrc.json"));
  writeFileSync(join(tree.root, "planted.ts"), source);
  // THE LINTER IS SANDWICHED BETWEEN TWO CHECKS THAT SAY NOTHING, AND THE COUNT
  // IS STILL ONE -- which is what makes the count readable as a SUM. A
  // tree declaring the linter ALONE makes the first result, the last result and
  // the total extensionally equal, so every weaker reading passes there.
  //
  // AND THE LINTER RUNS THROUGH A WRAPPER THAT RECORDS ITS INVOCATION, so that
  // the two readings taken off it -- an exit code and a warning count -- can be
  // shown to come from ONE run. A deterministic program prints the same bytes on
  // its second run, so a runner spawning each check twice and taking one reading
  // from each invocation is invisible to any assertion over the report: the
  // fixture, not the assertion, is what has to carry the identity.
  tree.declare([
    { name: "before", run: tree.logged("before", 0) },
    { name: "Lint passes", run: tree.wrapping("lint", "oxlint") },
    { name: "after", run: tree.logged("after", 0) },
  ]);
  return tree;
}

/**
 * What a linted tree's log reads when every check ran EXACTLY ONCE, in order.
 *
 * WHOLE-VALUE, AND THE ARITY IS THE POINT HERE rather than the order: one entry
 * for the linter means one invocation of it in the whole run, so the exit code
 * and the count the arms read cannot be two different runs of it.
 */
const linterRanOnce = ["before", "lint", "after"];

/** A generator with no `yield`: warning severity, and the exit code does not move. */
const warns = "export function* nothing() {\n  return 1;\n}\n";

/** A bare specifier where the guard requires an extension: error severity. */
const errors = 'import { thing } from "./other";\nexport const used = thing;\n';

test("a warning is counted and reported, and does NOT gate the run", async () => {
  const tree = stageLinted(warns);
  const result = await tree.run();
  // GREEN BESIDE A COUNT, WHICH IS THE RUNNER'S BOUNDARY: this planted linter
  // exits 0, so the runner reports its warning without inventing a second
  // severity policy after the check has finished.
  expect(result.code).toBe(0);
  expect(report(result)).toContain("warnings: 1");
  expect(report(result)).toContain("Definition of Done: PASSED");
  // ONE INVOCATION OF THE LINTER, SO THE EXIT ABOVE AND THE COUNT ABOVE ARE ONE
  // READING. Nothing else in this arm can say that.
  expect(tree.invocations()).toEqual(linterRanOnce);
});

test("an error is not a warning: the count is 0 beside the failure", async () => {
  const tree = stageLinted(errors);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  // THE PAIR THAT SEPARATES A COUNT FROM A DIAGNOSTIC COUNT. A runner counting
  // every line the linter prints reports one here and passes the arm above, so
  // this is the arm that reads the severity rather than the volume.
  expect(report(result)).toContain("warnings: 0");
  expect(report(result)).toContain("[FAILED] Lint passes -- exit 1");
  // AND THE DIAGNOSTIC ITSELF REACHES THE READER, which every other arm in this
  // file would survive the loss of: they read the summary and the count, both
  // written by the runner, so a runner that swallowed each check's own output
  // would satisfy all of them.
  expect(report(result)).toContain("planted.ts:1:1: error");
  expect(tree.invocations()).toEqual(linterRanOnce);
});

test("a tree with nothing to say counts no warnings", async () => {
  const tree = stageLinted("export const fine = 1;\n");
  const result = await tree.run();
  expect(result.code).toBe(0);
  expect(report(result)).toContain("warnings: 0");
});

test("a dashboard listing no checks is refused rather than reported green", async () => {
  const tree = stageTree();
  tree.declare([]);
  const result = await tree.run();
  expect(result.code).not.toBe(0);
  // THE TEXT AND NOT ONLY THE COLOUR, because everything that goes wrong here
  // exits non-zero -- a runner that does not exist at all exits non-zero, and
  // this arm would then pass while measuring nothing.
  expect(report(result)).toContain("lists no checks");
});

/**
 * THE FILTERED RUN, WHICH EXISTS SO THAT `I ONLY WANT ONE CHECK AGAIN` IS A
 * ROUTE THIS RUNNER OWNS. Twice in one session a maintainer ran a check by hand
 * and read it through `tail`, which showed a summary and hid the verdict above
 * it, and a red check shipped as a baseline. The habit is not inattention: the
 * sanctioned route had no answer for re-running one check, so people left it.
 * The arms below grade the two halves that make the filtered route safe -- it
 * still reports WHOLE, and it cannot be mistaken for the whole Definition.
 */

test("a filtered run runs ONLY the matching checks and still reports WHOLE", async () => {
  const tree = stageTree();
  // THE MATCHING NAME IS CAPITALISED AND THE FILTER IS NOT, which is the only
  // arrangement in which the case fold is graded: with both spelled alike, a
  // runner comparing bytes passes every assertion below.
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "Lint passes", run: tree.logged("lint", 0) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  const result = await tree.run({ only: "lint" });
  expect(result.code).toBe(0);
  // WHOLE-VALUE, BECAUSE `ONLY` IS WHAT IS BEING ASSERTED: `contains lint` is
  // satisfied by a runner that ignored the option and ran all three.
  expect(tree.invocations()).toEqual(["lint"]);
  // AND THE REPORT IS STILL THE WHOLE REPORT, which is the half that makes the
  // filter a replacement for the pipe rather than another way to lose a verdict.
  // Every part a reader of an unfiltered run gets, named one by one: where it
  // ran, the check's own banner, its output's place, the summary, the per-check
  // line with the command as run, and the warnings count.
  expect(report(result)).toContain("tsudoi: taking the Definition of Done");
  expect(report(result)).toContain(tree.root);
  // THE SUMMARY LINE, READ WITHOUT ITS MARKER: what the marker says is the next
  // arm's subject, and asserting it here would make this arm redden for two
  // unrelated reasons. What this needs is that a filtered run HAS a summary at
  // all -- the one line a reader who scrolls to the bottom is looking for.
  expect(report(result)).toContain(": PASSED\n");
  expect(report(result)).toContain(`--- Lint passes -- $ ${tree.logged("lint", 0)}`);
  expect(report(result)).toContain(`[PASSED] Lint passes -- exit 0 -- $ ${tree.logged("lint", 0)}`);
  expect(report(result)).toContain("warnings: 0 (reported; check exit codes decide the verdict)");
  // AND THE CHECKS IT LEFT OUT ARE NOT REPORTED AS ANYTHING. A runner printing
  // a line for every declared check and running only the matching ones would
  // hand its reader four greens over one run.
  expect(report(result)).not.toContain("alpha");
  expect(report(result)).not.toContain("beta");
});

test("a filter matching NO check is refused, where the same tree unfiltered is green", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  // THE CONTROL FIRST, AND ITS ORDER IS FORCED: what a check records is read out
  // of a log file that does not exist until a check has run, so a refusal taken
  // first would leave the reading below to fail on the file's absence and read
  // like a broken fixture.
  const unfiltered = await tree.run();
  expect(unfiltered.code).toBe(0);
  expect(report(unfiltered)).toContain("Definition of Done: PASSED");
  const ran = tree.invocations();
  const result = await tree.run({ only: "gamma" });
  // THE COLOUR IS ATTRIBUTABLE TO THE FILTER AND TO NOTHING ELSE, which is what
  // the control above buys: the same dashboard, the same checks, the same tree.
  expect(result.code).not.toBe(0);
  // THE TEXT AND NOT ONLY THE COLOUR, for the reason the empty-dashboard arm
  // above gives: everything that goes wrong here exits non-zero, a runner that
  // does not exist at all included.
  expect(report(result)).toContain("gamma");
  // AND THE NAMES A READER CAN ACTUALLY TYPE. A refusal that does not say what
  // there was to match sends them back to running the check by hand, which is
  // the habit this option exists to replace.
  expect(report(result)).toContain("alpha");
  expect(report(result)).toContain("beta");
  expect(report(result)).not.toContain("Definition of Done: PASSED");
  // AND NOTHING RAN ON ITS ACCOUNT. A runner that selected nothing and reported
  // green over zero checks leaves this log untouched too, so the pair is the
  // exit code beside the log rather than either alone.
  expect(tree.invocations()).toEqual(ran);
});

test("a filtered green cannot be read as the Definition of Done's own green", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "Lint passes", run: tree.logged("lint", 0) },
  ]);
  const filtered = await tree.run({ only: "lint" });
  const whole = await tree.run();
  expect(filtered.code).toBe(0);
  expect(whole.code).toBe(0);
  // THE VERDICT LINE IS WHERE THIS HAS TO LAND, AND THE HEADER IS NOT ENOUGH:
  // the reader this sprint is about is the one who took the LAST lines of a run,
  // and a marker at the top is exactly what that reading loses. So the filtered
  // run's summary is not a superstring of the whole run's -- the bytes a reader
  // greps for, `Definition of Done: PASSED`, are absent from it.
  expect(report(filtered)).not.toContain("Definition of Done: PASSED");
  expect(report(filtered)).toContain(`${filterMark("lint")}: PASSED`);
  // AND THE HEADER CARRIES IT TOO, for the reader who starts at the top and
  // never reaches the end -- a long red check's output sits between them.
  expect(report(filtered)).toContain(`taking the Definition of Done${filterMark("lint")} in `);
  // BOTH DIRECTIONS, OR THE THREE ABOVE ARE SATISFIED BY A RUNNER THAT MARKS
  // EVERY RUN FILTERED: the same tree, unfiltered, says the plain thing and says
  // nothing about a filter.
  expect(report(whole)).toContain("Definition of Done: PASSED");
  expect(report(whole)).not.toContain("FILTERED");
});

test("`--only` and the root compose in EITHER order, and read the same", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "Lint passes", run: tree.logged("lint", 0) },
  ]);
  const rootFirst = await tree.run({ only: "lint" });
  const afterRootFirst = tree.invocations();
  const optionFirst = await tree.run({ only: "lint", optionFirst: true });
  expect(rootFirst.code).toBe(0);
  expect(afterRootFirst).toEqual(["lint"]);
  // WHOLE-VALUE ON THE REPORT, WHICH IS THE ONLY READING THAT SAYS `THE SAME`:
  // the root is printed in it, so a parser that took `--only` for a path and the
  // path for a filter differs here even where both runs exit 0.
  expect(optionFirst.code).toBe(rootFirst.code);
  expect(report(optionFirst)).toBe(report(rootFirst));
  expect(report(rootFirst)).toContain(`${filterMark("lint")}: PASSED`);
  // AND THE SECOND ORDER RAN THE SAME ONE CHECK, which the report comparison
  // above cannot say on its own: a runner printing a report and running nothing
  // prints two identical ones.
  expect(tree.invocations()).toEqual([...afterRootFirst, ...afterRootFirst]);
});

test("an argument this runner cannot read is refused, never guessed at", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "alpha", run: tree.logged("alpha", 0) },
    { name: "beta", run: tree.logged("beta", 0) },
  ]);
  // THE POSITIVE CONTROL FIRST, AND IT IS ALSO THE LOG THE READING BELOW NEEDS:
  // without it a parser refusing every argument list would ship green here and
  // take `bun run scripts/definition-of-done.ts <root>` with it.
  const control = await tree.run();
  expect(control.code).toBe(0);
  const ran = tree.invocations();
  const malformed: readonly { args: readonly string[]; mentions: string }[] = [
    // A VALUE THAT IS NOT THERE. Read as `no filter`, this is the whole
    // Definition of Done answering a request for one check -- slow, and honest
    // only by accident. Read as `the next argument`, `--only <root>` filters on
    // a path and matches nothing.
    { args: [tree.root, "--only"], mentions: "--only" },
    // A FILTER MATCHING EVERY CHECK, WHICH IS THE HAZARD OF THIS OPTION
    // INVERTED: the empty substring is in every name, so the whole run goes out
    // wearing a marker that says a subset of it was taken.
    { args: [tree.root, "--only", ""], mentions: "--only" },
    // AN OPTION NOBODY SHIPPED, `--only=lint` AMONG THEM: guessed at, it is a
    // positional root, and the reader is told there is no dashboard at
    // `--only=lint` -- a message about the tree for a mistake in the argument.
    { args: [tree.root, "--only=lint"], mentions: "--only=lint" },
    // A SECOND ROOT. Taking the last silently runs the Definition of Done of a
    // tree the reader named first and stopped meaning.
    { args: [tree.root, tree.root], mentions: tree.root },
  ];
  for (const { args, mentions } of malformed) {
    const result = await tree.run({ args });
    expect(result.code).not.toBe(0);
    // THE OFFENDING ARGUMENT IS NAMED, so the reader repairs the command line
    // rather than going looking at the tree. A refusal saying only `bad
    // arguments` over four different mistakes is one state printed four times.
    expect(report(result)).toContain(mentions);
    // AND THE FORM THAT WOULD HAVE WORKED, which is the whole repair for three
    // of the four and is what keeps `--only` discoverable at the one moment a
    // reader is looking for it.
    expect(report(result)).toContain("--only <substring>");
    expect(report(result)).not.toContain("PASSED");
  }
  // AND NOT ONE CHECK RAN ON ANY OF THEIR ACCOUNT. The refusal is read before
  // the dashboard is, so this is the order as much as the colour.
  expect(tree.invocations()).toEqual(ran);
});

/**
 * THE TREE A READING WAS TAKEN ON, PRINTED, AND THE THREE STATES IT HAS.
 *
 * WHY THE RUNNER SAYS THIS AT ALL: this project requires a sprint's closing
 * reading to name the commit it graded, and sprint 87 measured that rule failing
 * TWICE IN ONE SPRINT -- each reading named a tree the repairs after it
 * overtook, and a reviewer caught it both times. The rule was never missing; the
 * hash was not to hand when the sentence was written.
 *
 * THE DIRTY ARM IS THE ONE THAT EARNS THE FEATURE. A hash alone is WORSE than
 * nothing on a tree that does not match it: it reads as provenance for a green
 * that belongs to a state no commit holds. `git init` with a commit and then one
 * byte written is exactly that state.
 *
 * AND THE THIRD IS SILENCE, over a directory that is no checkout: this runner
 * grades a DIRECTORY, and inventing a fault for a tree outside git would fail
 * every other arm in this file -- which is where that arm lives, by being every
 * other arm in this file.
 */
test("the report names the tree it graded, and says so when the tree is not the commit", async () => {
  const tree = stageTree();
  tree.declare([{ name: "Lint passes", run: tree.logged("lint", 0) }]);

  // NO CHECKOUT: silent, and the whole report otherwise intact.
  const outside = await tree.run({});
  expect(outside.code).toBe(0);
  expect(report(outside)).not.toContain("tree: ");
  expect(report(outside)).toContain(": PASSED\n");

  /**
   * THE STAGE IS ISOLATED FROM THE MACHINE'S OWN GIT, AND THAT IS NOT TIDINESS.
   * MEASURED: without `core.hooksPath`, a `git init` here inherits the developer's
   * GLOBAL hooks, and this repository's own commit hook refused the stage's
   * commit -- an arm failing on a rule about a file the stage does not contain.
   * The identity is supplied for the same reason: a machine with no `user.email`
   * cannot commit at all, and an arm may not require one.
   */
  const git = (...args: string[]): void => {
    const run = spawnSync(
      "git",
      [
        "-C",
        tree.root,
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "user.email=stage@example.invalid",
        "-c",
        "user.name=stage",
        ...args,
      ],
      { encoding: "utf8" },
    );
    if (run.status !== 0) {
      throw new Error(`git ${args.join(" ")} in the stage: ${run.stderr}`);
    }
  };
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "staged");
  const head = spawnSync("git", ["-C", tree.root, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();

  // DIRTY FIRST, because `git init` leaves every staged file untracked -- so the
  // clean arm below has to be MADE clean, and taking the dirty reading first is
  // what says the marker is not simply always printed.
  const dirty = await tree.run({});
  expect(report(dirty)).toContain(`tree: ${head} (WORKING TREE DIRTY`);
  expect(report(dirty)).toContain("names no commit");

  // THE RUN ITSELF WRITES INTO THE TREE, so `clean` here means clean APART FROM
  // what a check produced -- which is the faithful parallel and not a dodge: the
  // real repository's own first check writes every `dist/`, and every one of them
  // is gitignored there for the same reason.
  writeFileSync(join(tree.root, ".gitignore"), "invocations.log\n");
  git("add", "-A");
  git("commit", "-q", "-m", "everything");
  const clean = spawnSync("git", ["-C", tree.root, "rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();

  const settled = await tree.run({});
  // WHOLE LINE, so a runner that printed the hash AND the warning on a clean
  // tree reddens: the marker's absence is the assertion, and `toContain` on the
  // hash alone is satisfied by both states.
  expect(report(settled)).toContain(`\ntree: ${clean}\n`);
});
