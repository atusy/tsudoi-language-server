import { spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * TAKING THE WHOLE DEFINITION OF DONE IN ONE COMMAND, so that a check that
 * failed cannot be missed by reading the part of the output that happened to be
 * on screen.
 *
 * WHY IT EXISTS AT ALL, MEASURED RATHER THAN ASSUMED: this project has five
 * recorded occurrences of a commit taken while a check was red, across two
 * people, one of them persisting nine sprints -- every one of them a reader
 * taking the LAST command's status, or a grep's, for the run's. A skill
 * forbidding exactly that exists, is specific, carries its own recidivism count
 * and matched on description, AND THE DEFECT HAPPENED ANYWAY. What is left after
 * that is not another sentence: it is an exit code.
 *
 * IT IS NOT A SIXTH CHECK AND DOES NOT REPLACE THE FIVE. A check that runs every
 * check would run itself, unbounded; and the five are the list this reads. The
 * dashboard's `run` stays an executable shell command, which is what keeps
 * `bun test` a thing a maintainer can still type when debugging one of them.
 *
 * THE LIST IS OBTAINED BY EXECUTING THE DASHBOARD AND PARSING THE JSON IT
 * PRINTS, AND THAT IS THE LOAD-BEARING DECISION HERE. A copy of the five in this
 * file would satisfy every arm about failing loudly and would still permit the
 * one failure the product owner refused: a GREEN RUN THAT NEVER EXECUTED A CHECK
 * THE DASHBOARD LISTS, silently, because a sixth entry was added over there and
 * nobody remembered to edit this. There is no second list to drift. THE COST,
 * stated rather than discovered: this cannot report anything at all when the
 * dashboard does not run, so a type error in scrum.ts stops the run instead of
 * failing one check -- which is the trade taken, since a dashboard that does not
 * execute has no checks to report.
 *
 * THE CHECKS RUN SEQUENTIALLY IN THE DECLARED ORDER, WHICH IS NOT COSMETIC: the
 * first builds every artifact the fourth reads. Nothing here parallelises them,
 * and the order is the dashboard's, never this file's.
 *
 * UNRUNNABLE IS NOT PASSED, AND IT IS ITS OWN VERDICT. A command naming a binary
 * that is not installed is spawned DIRECTLY rather than through a shell, so it
 * arrives as a spawn error and can be reported as one; run through `sh -c` it
 * would arrive as exit 127, indistinguishable from a check that ran and said no.
 * The machine this was written on is the witness: two of the five tools were
 * absent from PATH, and a runner treating that as anything but non-green would
 * have shipped green over two checks that never ran.
 *
 * NOTHING HERE TOUCHES THE ENVIRONMENT OR RESOLVES A BINARY ITSELF. The
 * dashboard says `tsc --noEmit`, so `tsc` is what is spawned, found the way the
 * reader's own shell would find it -- measured at planning: running the checks
 * through one script does not change what any of them sees.
 *
 * THE ROOT COMES FROM THE ARGUMENT OR FROM THIS FILE'S OWN LOCATION, NEVER FROM
 * THE WORKING DIRECTORY. That is a hazard and not a detail: the first check
 * finds its configuration only in the directory it is run from, so a runner
 * inheriting a subdirectory would report five greens over a suite that built
 * nothing. The argument is also what lets test/definition-of-done.test.ts drive
 * this against throwaway dashboards -- an instrument whose only subject is a
 * five-green repository can be measured in exactly one state.
 */

/** A dashboard entry: the two fields `definition_of_done.checks` carries. */
interface Check {
  name: string;
  run: string;
}

type Outcome = "passed" | "failed" | "unrunnable";

interface CheckResult {
  check: Check;
  outcome: Outcome;
  /** The check's own exit code, and null when it never started. */
  exit: number | null;
  /** Why it never started, and null when it did. */
  reason: string | null;
  warnings: number;
}

/**
 * A diagnostic line the linter marked as a warning.
 *
 * MEASURED on oxlint 0.61.0, in a pipe and under a terminal alike: one line per
 * diagnostic, `path:line:col: <severity> <plugin>(<rule>): ...`, and no summary
 * line -- so the count comes from lines. Over all five checks of this repository
 * at the sprint's base it counts exactly ONE, the deliberate fixture warning,
 * and the looser reading of the bare word `warning` counted one there too; the
 * shape is taken because it cannot be tripped by a test that merely prints the
 * word. RE-MEASURING ON A VERSION BUMP IS THE MAINTENANCE THIS BUYS, and it is
 * the price of the count being a parse.
 */
const warningLine = /^.+:\d+:\d+: warning\b/;

/**
 * Reads the checks by RUNNING the dashboard, refusing anything it cannot use.
 *
 * AN EMPTY LIST IS REFUSED RATHER THAN SATISFIED, which is the one degenerate
 * this cannot report honestly: zero failures out of zero checks is green by
 * every rule below, and it is precisely the state a mangled dashboard produces.
 */
function readChecks(root: string): Check[] {
  const dashboard = join(root, "scrum.ts");
  const printed = spawnSync("bun", ["run", dashboard], { cwd: root, encoding: "utf8" });
  if (printed.error !== undefined) {
    throw new Error(`the dashboard at ${dashboard} could not be run: ${printed.error.message}`);
  }
  if (printed.status !== 0) {
    throw new Error(
      `the dashboard at ${dashboard} exited ${printed.status}, so its checks could not be read:\n${printed.stderr}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(printed.stdout);
  } catch (cause) {
    throw new Error(
      `the dashboard at ${dashboard} printed something other than JSON: ${String(cause)}`,
    );
  }
  const checks = (parsed as { definition_of_done?: { checks?: unknown } })?.definition_of_done
    ?.checks;
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error(
      `the dashboard at ${dashboard} lists no checks, so a green run here would mean nothing was verified.`,
    );
  }
  return checks.map((entry: unknown) => {
    const check = entry as { name?: unknown; run?: unknown };
    if (typeof check.name !== "string" || typeof check.run !== "string") {
      throw new Error(
        `the dashboard at ${dashboard} lists a check that is not a { name, run } pair: ${JSON.stringify(entry)}`,
      );
    }
    return { name: check.name, run: check.run };
  });
}

/**
 * Runs one check to completion, echoing every byte it writes as it arrives.
 *
 * ECHOED LIVE AND COLLECTED AT ONCE: the reader of a seventy-second suite needs
 * its output while it runs, and the warning count needs the same bytes. Reading
 * them twice would be two measurements of one run.
 */
function runCheck(root: string, check: Check): Promise<CheckResult> {
  return new Promise((settle) => {
    const [program, ...args] = check.run.split(" ").filter((word) => word !== "");
    if (program === undefined) {
      settle({
        check,
        outcome: "unrunnable",
        exit: null,
        reason: "the command is empty",
        warnings: 0,
      });
      return;
    }
    const child = spawn(program, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
      process.stderr.write(chunk);
    });
    let started = true;
    child.on("error", (cause: Error) => {
      started = false;
      settle({
        check,
        outcome: "unrunnable",
        exit: null,
        reason: cause.message,
        warnings: 0,
      });
    });
    child.on("close", (code) => {
      if (!started) {
        return;
      }
      const warnings = output.split("\n").filter((line) => warningLine.test(line)).length;
      settle({
        check,
        outcome: code === 0 ? "passed" : "failed",
        exit: code,
        reason: null,
        warnings,
      });
    });
  });
}

/**
 * One line per check, whatever the verdict.
 *
 * EVERY CHECK IS REPORTED AND NOT ONLY THE FAILURES, because `reports every
 * check's status` is satisfied at the exit-code level by a runner that exits
 * inside the loop -- moving the exit earlier changes no value. What separates
 * them is the text of a FAILING run: the checks after the first red have their
 * own statuses in it.
 *
 * THE COMMAND AS RUN IS PART OF THE LINE. A report carrying only an exit code
 * cannot be audited by its reader, which is the same rule this project applies
 * to a hand-run measurement.
 */
function line(result: CheckResult): string {
  const status =
    result.outcome === "passed"
      ? `[PASSED] ${result.check.name} -- exit ${result.exit}`
      : result.outcome === "failed"
        ? `[FAILED] ${result.check.name} -- exit ${result.exit}`
        : `[UNRUNNABLE] ${result.check.name} -- never started: ${result.reason}`;
  return `  ${status} -- $ ${result.check.run}`;
}

const root = resolve(process.argv[2] ?? fileURLToPath(new URL("../", import.meta.url)));
let checks: Check[];
try {
  checks = readChecks(root);
} catch (cause) {
  process.stderr.write(`tsudoi: ${cause instanceof Error ? cause.message : String(cause)}\n`);
  process.exit(1);
}
process.stdout.write(`tsudoi: taking the Definition of Done in ${root}\n`);
const results: CheckResult[] = [];
for (const check of checks) {
  process.stdout.write(`\n--- ${check.name} -- $ ${check.run}\n`);
  results.push(await runCheck(root, check));
}
const failed = results.filter((result) => result.outcome !== "passed");
const warnings = results.reduce((total, result) => total + result.warnings, 0);
process.stdout.write(`\n=== Definition of Done: ${failed.length === 0 ? "PASSED" : "FAILED"}\n`);
for (const result of results) {
  process.stdout.write(`${line(result)}\n`);
}
// REPORTED AND NOT GATING, RULED: this tree carries one deliberate warning whose
// fixture records a refusal to silence it, so failing on warnings would overturn
// a decision by way of a tooling change -- and an instrument red on every green
// tree retires itself. It is printed because the linter's exit code does not
// move on warnings, so five exit codes is not the whole reading.
process.stdout.write(`warnings: ${warnings} (reported, not gating)\n`);
if (failed.length !== 0) {
  process.exitCode = 1;
}
