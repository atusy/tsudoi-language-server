import { afterEach, expect, test } from "bun:test";
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
 * WHY NOT AGAINST THIS REPOSITORY: the runner's subject IS the five checks, so
 * an arm running it here would run `bun test` inside `bun test`. Every arm below
 * hands it a checkout whose checks are shell scripts that report a chosen exit
 * code, which is also the only way to get the states this is built for -- the
 * five here are green, and an instrument whose witness cannot fail measures
 * nothing.
 *
 * THE HEADLINE ARM IS THE RECORDED DEFECT VERBATIM AND NOT A GENERIC FAILURE:
 * this project has five occurrences of a red going unread because the FIRST
 * check failed and the LAST one passed, so the arm that matters puts the failure
 * first and requires both the red and the later check's own pass in the report.
 * A runner reading only the last status passes an all-fail arm and passes an
 * all-pass arm; it is that pair of positions that separates it.
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
  /** A command that records its own invocation and then exits with `exit`. */
  logged: (name: string, exit: number) => string;
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
   * `standalone` runs a COPY of the runner that lives inside the tree and is
   * given no argument, which is the only way to measure the other half of the
   * root rule -- a runner invoked with a root can never show where it would have
   * looked without one. It is a byte copy, so the code path is the shipped one.
   */
  run: (options?: { cwd?: string; standalone?: boolean }) => Promise<CliResult>;
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
  writeFileSync(logger, `#!/bin/sh\nprintf '%s\\n' "$1" >> ${log}\nexit "$2"\n`);
  chmodSync(logger, 0o755);
  // THE DIRECTORY A CHECK IS RUN IN IS RECORDED THE SAME WAY ITS NAME IS,
  // because that is the half of "the same reading" no exit code carries: the
  // first real check finds its configuration only in the directory it runs in,
  // so a runner handing its checks the wrong one reports five greens over a
  // suite that built nothing, with every exit code unchanged.
  const wherever = join(root, "cwd-probe");
  writeFileSync(wherever, `#!/bin/sh\nprintf 'ran in %s\\n' "$(pwd -P)" >> ${log}\n`);
  chmodSync(wherever, 0o755);
  // A COPY OF THE RUNNER INSIDE THE TREE, so that "its own location" is this
  // throwaway. Running the repository's own copy with no argument would take the
  // Definition of Done of this repository -- `bun test` inside `bun test`.
  mkdirSync(join(root, "scripts"));
  const standalone = join(root, "scripts", "definition-of-done.ts");
  copyFileSync(runner, standalone);
  return {
    root,
    logged: (name, exit) => `${logger} ${name} ${exit}`,
    cwdProbe: () => wherever,
    missingBinary: () => "tsudoi-no-such-binary-anywhere --check",
    declare: (checks) => {
      // THE DASHBOARD IS EXECUTED AND ITS JSON PARSED, so a throwaway one need
      // only print the same shape -- which is the whole reason the runner cannot
      // hold a list of its own.
      writeFileSync(
        join(root, "scrum.ts"),
        `console.log(JSON.stringify(${JSON.stringify({ definition_of_done: { checks } })}));\n`,
      );
    },
    invocations: () =>
      readFileSync(log, "utf8")
        .split("\n")
        .filter((line) => line !== ""),
    run: (options) =>
      options?.standalone === true
        ? runCommand(`bun run ${standalone}`, options.cwd ?? root)
        : runCommand(`bun run ${runner}`, options?.cwd ?? root, [root]),
  };
}

/** The report is read off both streams, because a reader of one command reads both. */
function report(result: CliResult): string {
  return `${result.stdout}${result.stderr}`;
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
  tree.declare([
    { name: "gamma", run: tree.logged("gamma", 0) },
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
  // THE WHOLE LINE AND NOT THE VERDICT WORD. A report carrying only a colour
  // cannot be audited by its reader, which is the rule this project already
  // applies to a hand-run exit code; and the check's OWN exit is what separates
  // `it failed` from `the run failed`.
  expect(report(result)).toContain(`[FAILED] alpha -- exit 3 -- $ ${tree.logged("alpha", 3)}`);
  // AND THE CHECK AFTER THE RED, which is what a runner exiting inside its loop
  // loses: moving its exit earlier changes no value, so nothing but the report
  // text of a failing run can see it.
  expect(report(result)).toContain(`[PASSED] beta -- exit 0 -- $ ${tree.logged("beta", 0)}`);
});

test("a SIXTH check on the dashboard runs, with no edit to the runner", async () => {
  const tree = stageTree();
  // SIX, BECAUSE FIVE IS THE NUMBER A RUNNER HOLDING ITS OWN COPY WOULD HOLD.
  // This is the product owner's refusal made measurable: a green run that never
  // executed a check the dashboard lists is green and silent, and lets the
  // Definition of Done shrink unnoticed. Nothing in the runner is edited between
  // this arm and the three-check arms above -- only the dashboard differs.
  const names = ["one", "two", "three", "four", "five", "six"];
  tree.declare(names.map((name) => ({ name, run: tree.logged(name, 0) })));
  const result = await tree.run();
  expect(result.code).toBe(0);
  expect(tree.invocations()).toEqual(names);
  for (const name of names) {
    expect(report(result)).toContain(`[PASSED] ${name} -- exit 0`);
  }
});

test("a check that never started is non-green and is not a check that ran and failed", async () => {
  const tree = stageTree();
  tree.declare([
    { name: "absent", run: tree.missingBinary() },
    { name: "beta", run: tree.logged("beta", 1) },
    { name: "gamma", run: tree.logged("gamma", 0) },
  ]);
  const result = await tree.run();
  // THIS MACHINE IS THE WITNESS AND NOT A HYPOTHETICAL: two of the five tools
  // were absent from PATH where this was written, so a runner treating a spawn
  // error as anything but non-green would have shipped green over two checks
  // that never ran.
  expect(result.code).not.toBe(0);
  // TWO STATES THAT PRINT THE SAME TEXT ARE ONE RED, so what is asserted is the
  // DIFFERENCE: the one that never started carries no exit code of its own and
  // says why, and the one that ran carries its own number.
  expect(report(result)).toContain("[UNRUNNABLE] absent -- never started:");
  expect(report(result)).toContain(`[FAILED] beta -- exit 1 -- $ ${tree.logged("beta", 1)}`);
  expect(report(result)).not.toContain("[FAILED] absent");
  expect(report(result)).not.toContain("[PASSED] absent");
  // AND IT DID NOT SILENTLY RUN SOMETHING ELSE: the checks after it still ran,
  // which is what distinguishes a reported non-start from an aborted run.
  expect(tree.invocations()).toEqual(["beta", "gamma"]);
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
