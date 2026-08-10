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
 * AND IT TAKES `--only <substring>` FOR THAT SAME REASON, WHICH MAKES THE OPTION
 * A CORRECTION AND NOT A CONVENIENCE. Twice in one session a maintainer re-ran a
 * single check BY HAND and read it through `tail`, which showed a summary line
 * and hid the verdict above it, and a red check went out as the next sprint's
 * baseline. The habit is not inattention: the sanctioned route had no answer for
 * `I only want that one check again`, so the unsanctioned one was the only one.
 * A FILTERED RUN THEREFORE REPORTS WHOLE -- every part an unfiltered one prints,
 * in the same shape -- so that nothing about it invites a pipe. What it must
 * never be is mistakable for the whole, and the marker below is where that is
 * paid for.
 *
 * IT IS NOT A SIXTH CHECK AND DOES NOT REPLACE THE FIVE. A check that runs every
 * check would run itself, unbounded; and the five are the list this reads. Every
 * `run` stays a line a maintainer can type at a prompt when debugging one of
 * them, which is what keeps that list honest as documentation.
 *
 * THE LIST IS OBTAINED BY EXECUTING THE DASHBOARD AND PARSING THE JSON IT
 * PRINTS, AND THAT IS THE LOAD-BEARING DECISION HERE. A copy of the five in this
 * file would satisfy every arm about failing loudly and would still permit the
 * one failure the product owner refused: a GREEN RUN THAT NEVER EXECUTED A CHECK
 * THE DASHBOARD LISTS, silently, because a sixth entry was added over there and
 * nobody remembered to edit this. There is no second list to drift. THE COST,
 * stated rather than discovered: this cannot report anything at all when the
 * dashboard does not RUN -- and A TYPE ERROR IN scrum.ts IS NOT THAT CASE.
 * MEASURED on a throwaway whose dashboard's only unusual property is a type
 * error: `tsc --noEmit` there is exit 1, `bun run scrum.ts` is exit 0 and prints
 * its JSON, and this runner pointed at that tree reads the checks, runs them and
 * prints PASSED at exit 0. The runtime strips types without checking them, so
 * that failure is one the fourth check catches AFTERWARDS and this runner never
 * sees. NOT BY THIS RUNNER AND NOT BY THE ARMS THAT GRADE IT, which is the
 * widest claim this file may make -- `and by nothing else` is MEASURED FALSE, a
 * planted type error reddening `bun test` too, through
 * test/unbuilt-checkout.test.ts comparing a staged tsc's output against `exit 0`
 * exactly. The order is what makes the gap safe rather than a hole: the fourth
 * check runs in the same invocation, so nothing reaches a reader as green.
 *
 * THE CHECKS RUN SEQUENTIALLY IN THE DECLARED ORDER, WHICH IS NOT COSMETIC: the
 * first builds every artifact the fourth reads. Nothing here parallelises them,
 * and the order is the dashboard's, never this file's.
 *
 * AND THAT ORDER IS WHAT LETS A READER DECIDE, IN ONE STEP, WHAT A GREEN FOURTH
 * CHECK MEANT. The framework's `exports` map ends in a source arm, so
 * `tsc --noEmit` answers its published subpaths from dist/ when the artifact is
 * there and FROM src/ AT EXIT 0 WHEN IT IS NOT.
 * A GREEN FOURTH CHECK PRINTED BY THIS RUNNER WAS READ FROM dist/ -- PROVIDED
 * THE FIRST CHECK WAS GREEN TOO, and that condition is the step rather than a
 * nicety. Unconditioned, `a green printed by this runner` reads two ways: the
 * RUN was green, or THAT CELL printed green. They come apart in exactly the
 * state this procedure exists for -- the first check red because its preload
 * build threw, so no artifact was written, and the fourth green because the
 * compiler fell through to src/ and raised nothing, which is the silent cell
 * measured below -- and that reader is sent to `dist/`. WITH BOTH GREEN the
 * step holds: the first check builds every artifact before
 * the fourth reads, and the fifth then refuses any published subpath answering
 * from anywhere but its `types` artifact. A GREEN FROM A BARE `tsc --noEmit` SAYS
 * NOTHING ABOUT WHICH FILE ANSWERED, and if it was src/ that is the half NOTHING
 * covers -- as against an artifact that survived a build, which is the fifth
 * check's half.
 *
 * MEASURED AT SPRINT 61, base 6d1c85d, tsc 7.0.2, each cell taken with dist/
 * MOVED ASIDE rather than deleted: with nothing built the fourth check is exit 1
 * naming THE TWO HANDLER PACKAGES at examples/tsudoi.config.ts and the framework
 * silent; with the framework's dist/ ALONE absent it is EXIT 0 AND SILENT, every
 * framework subpath traced to packages/tsudoi-language-server/src/*.ts. That
 * state is producible by two documented commands -- `bun pm pack` in each
 * handler on a tree nobody has built, each exiting 0 -- and by nothing this
 * repository runs. The route is written in bunfig.toml, the cells at
 * test/helpers/build.ts.
 *
 * UNRUNNABLE IS NOT PASSED, AND IT IS ITS OWN VERDICT. A command naming a binary
 * that is not installed is spawned DIRECTLY rather than through a shell, so it
 * arrives as a spawn error and can be reported as one; run through `sh -c` it
 * would arrive as exit 127, indistinguishable from a check that ran and said no.
 * The machine this was written on is the witness: two of the five tools were
 * absent from PATH, and a runner treating that as anything but non-green would
 * have shipped green over two checks that never ran.
 *
 * SO `run` IS A COMMAND LINE THIS RUNNER SPAWNS -- A PROGRAM AND ITS
 * SPACE-SEPARATED ARGUMENTS -- AND NOT A SHELL COMMAND, AND ONE IT CANNOT
 * EXECUTE FAITHFULLY IS REFUSED RATHER THAN MISREAD. That is the price of the
 * paragraph above, and it was being paid silently: MEASURED, `true && false`
 * split on spaces ran `true` with the arguments `&&` and `false` and WAS
 * REPORTED PASSED, where the shell every reader has in mind runs `false` and
 * fails. Redirections, quoted arguments and globs were misread the same way. Of
 * the three available answers -- run it through a shell and lose the missing
 * binary; keep spawning and misread; refuse -- only refusing gives up neither
 * reading, and a silently misread command is the worst outcome an instrument
 * that exists to make failure loud can produce. WHAT IT COSTS, STATED RATHER
 * THAN DISCOVERED: a Definition of Done wanting a pipeline puts it in a script
 * and names the script, which is also a thing a maintainer can run by hand. The
 * five declared today carry no shell syntax at all.
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

/**
 * The four states a check can be in, and they are four rather than two because
 * WHAT A READER MUST DO NEXT DIFFERS: fix the code, install a tool, or fix the
 * dashboard. `refused` is this runner's own decision and the other three are
 * the machine's.
 */
type Outcome = "passed" | "failed" | "unrunnable" | "refused";

interface CheckResult {
  check: Check;
  outcome: Outcome;
  /** The check's own exit code, and null when it never ran. */
  exit: number | null;
  /** Why it never ran -- absent binary or refusal -- and null when it did. */
  reason: string | null;
  warnings: number;
}

/**
 * A character that means something to a shell and nothing to this runner.
 *
 * WHY REFUSING IS RIGHT HERE AND NOT MERELY SAFE: everything on this list is
 * SILENTLY MISREAD by a runner that splits on spaces, and a misreading has no
 * colour of its own -- `true && false` reported PASSED. The list is deliberately
 * wide, because the failure it prevents is invisible and the failure it causes
 * is a named red naming the character. `*` and `?` are on it although this
 * runner never expands them: a `run` carrying either means its author expected
 * an expansion, and handing the glob through unexpanded is the same misreading
 * one character smaller.
 */
const shellSyntax = /[|&;<>()$`\\"'*?[\]{}~#!\n\r\t]/;

/** A command this runner can spawn, or the reason it will not try. */
type Command = { words: [string, ...string[]]; refusal: null } | { words: null; refusal: string };

function readCommand(run: string): Command {
  const syntax = shellSyntax.exec(run);
  if (syntax !== null) {
    return {
      words: null,
      refusal: `it carries the shell syntax \`${syntax[0] === "\n" ? "\\n" : syntax[0]}\`, and this runner spawns the program directly instead of through a shell, so it would be misread rather than executed -- put it in a script and name the script`,
    };
  }
  const [program, ...args] = run.split(" ").filter((word) => word !== "");
  if (program === undefined) {
    return { words: null, refusal: "it names no program at all" };
  }
  return { words: [program, ...args], refusal: null };
}

/**
 * A diagnostic line the linter marked as a warning.
 *
 * MEASURED on oxlint 0.61.0, in a pipe and under a terminal alike: one line per
 * diagnostic, `path:line:col: <severity> <plugin>(<rule>): ...`, and no summary
 * line -- so the count comes from lines. The SHAPE is matched rather than the
 * bare word `warning`, which agreed with it over this repository and can be
 * tripped by a test that merely prints the word. RE-MEASURING ON A VERSION BUMP
 * IS THE MAINTENANCE THIS BUYS, and it is the price of the count being a parse.
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
 * The checks a `--only` keeps, matched on the name and case-insensitively.
 *
 * A FILTER MATCHING NOTHING IS REFUSED: it arrives at the degenerate `readChecks`
 * refuses one screen up -- zero failures out of zero checks, which every rule
 * below calls green -- and a reader who typed a filter has MORE reason to read
 * the verdict as their check's, so the silent green would be worse rather than
 * milder. The declared names are printed because the repair is to type one of
 * them.
 */
function selection(checks: readonly Check[], only: string, dashboard: string): Check[] {
  const wanted = only.toLowerCase();
  const matching = checks.filter((check) => check.name.toLowerCase().includes(wanted));
  if (matching.length === 0) {
    throw new Error(
      `no check declared by the dashboard at ${dashboard} has \`${only}\` in its name, so a green run here would mean nothing was verified. It declares: ${checks.map((check) => check.name).join(", ")}`,
    );
  }
  return matching;
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
    const command = readCommand(check.run);
    if (command.words === null) {
      settle({
        check,
        outcome: "refused",
        exit: null,
        reason: command.refusal,
        warnings: 0,
      });
      return;
    }
    const [program, ...args] = command.words;
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
function verdict(result: CheckResult): string {
  switch (result.outcome) {
    case "passed":
      return `[PASSED] ${result.check.name} -- exit ${result.exit}`;
    case "failed":
      return `[FAILED] ${result.check.name} -- exit ${result.exit}`;
    // NEVER STARTED AND NOT RUN ARE PRINTED DIFFERENTLY BECAUSE THE READER'S
    // NEXT MOVE DIFFERS: one is a tool to install, the other is a dashboard
    // entry to rewrite. Two states printing the same text are one state.
    case "unrunnable":
      return `[UNRUNNABLE] ${result.check.name} -- never started: ${result.reason}`;
    case "refused":
      return `[REFUSED] ${result.check.name} -- not run: ${result.reason}`;
  }
}

function line(result: CheckResult): string {
  return `  ${verdict(result)} -- $ ${result.check.run}`;
}

/** Printed with every argument refusal, because the repair is a command line. */
const usage = "usage: bun run scripts/definition-of-done.ts [<root>] [--only <substring>]";

/**
 * The root to take the Definition of Done in, and the filter to take part of it.
 *
 * WALKED RATHER THAN INDEXED, because a reader types the two in whichever order
 * they think of them, and a runner reading the root at a FIXED POSITION takes
 * `--only` for a directory in one of those orders -- failing as `no dashboard
 * there`, a message about the tree for a mistake in the argument.
 *
 * EVERY ARGUMENT IT CANNOT READ IS REFUSED RATHER THAN GUESSED AT, and the three
 * it refuses are the three whose guess is a wrong reading nobody would see. An
 * `--only` WITH NO SUBSTRING read as `no filter` runs the whole Definition of
 * Done for a reader who asked for one check. An EMPTY substring is in every
 * name, so it selects everything and the whole run goes out wearing a marker
 * saying a subset of it was taken -- this option's own hazard, inverted. A
 * SECOND ROOT taken as the later one runs the checks of a tree the reader named
 * first and stopped meaning. An unknown `-…`, `--only=lint` among them, would
 * become a positional root and produce the message this walk exists to avoid.
 */
function readArguments(argv: readonly string[]): { root: string | null; only: string | null } {
  let root: string | null = null;
  let only: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? "";
    if (argument === "--only") {
      const substring = argv[index + 1];
      if (substring === undefined || substring === "") {
        throw new Error(
          `\`--only\` was given no substring to match, and an empty one is in every name, so it would take the whole Definition of Done and report it as a part -- ${usage}`,
        );
      }
      only = substring;
      index += 1;
      continue;
    }
    if (argument.startsWith("-")) {
      throw new Error(`\`${argument}\` is not an option this runner has -- ${usage}`);
    }
    if (root !== null) {
      throw new Error(
        `two roots were named, \`${root}\` and \`${argument}\`, and this takes the Definition of Done in one tree -- ${usage}`,
      );
    }
    root = argument;
  }
  return { root, only };
}

let root: string;
let only: string | null;
let checks: Check[];
try {
  const given = readArguments(process.argv.slice(2));
  only = given.only;
  root = resolve(given.root ?? fileURLToPath(new URL("../", import.meta.url)));
  checks = readChecks(root);
  if (only !== null) {
    checks = selection(checks, only, join(root, "scrum.ts"));
  }
} catch (cause) {
  process.stderr.write(`tsudoi: ${cause instanceof Error ? cause.message : String(cause)}\n`);
  process.exit(1);
}
/**
 * WHAT A FILTERED RUN WEARS SO THAT IT CANNOT PASS FOR THE WHOLE ONE, and the
 * claim is not decoration: the declared ORDER is load-bearing -- the first check
 * builds the artifacts the fourth reads -- so a subset's green is not this
 * Definition of Done's green whatever the subset is.
 *
 * IN THE SUMMARY AND NOT ONLY IN THE HEADER, WHICH IS THE WHOLE POINT OF THE
 * OPTION EXISTING. The reader it is built for is the one who took the LAST lines
 * of a run, and a marker at the top is exactly what that reading loses. It goes
 * in the header too, for the reader who starts there and never reaches the end
 * because a check's own output stands between them.
 *
 * AND IT BREAKS THE BYTES A READER GREPS FOR: `Definition of Done: PASSED` does
 * not occur in a filtered report at all, so a habit built on the unfiltered line
 * finds nothing rather than finding a subset's answer.
 */
const filtering =
  only === null ? "" : ` (FILTERED to the checks matching \`${only}\`, so NOT the whole)`;
process.stdout.write(`tsudoi: taking the Definition of Done${filtering} in ${root}\n`);
const results: CheckResult[] = [];
for (const check of checks) {
  process.stdout.write(`\n--- ${check.name} -- $ ${check.run}\n`);
  results.push(await runCheck(root, check));
}
const failed = results.filter((result) => result.outcome !== "passed");
const warnings = results.reduce((total, result) => total + result.warnings, 0);
process.stdout.write(
  `\n=== Definition of Done${filtering}: ${failed.length === 0 ? "PASSED" : "FAILED"}\n`,
);
for (const result of results) {
  process.stdout.write(`${line(result)}\n`);
}
// REPORTED AND NOT GATING, RULED: this tree carries one deliberate warning whose
// fixture records a refusal to silence it, so failing on warnings would overturn
// a decision by way of a tooling change -- and an instrument red on every green
// tree retires itself. It is printed because the linter's exit code does not
// move on warnings, so five exit codes is not the whole reading.
process.stdout.write(`warnings: ${warnings} (reported, not gating)\n`);
/**
 * THE TREE THIS READING WAS TAKEN ON, PRINTED SO A RECORD OF IT CANNOT BE
 * WRITTEN FROM MEMORY. This project requires a sprint's closing reading to name
 * the commit it graded, and MEASURED IN SPRINT 87 that rule failed TWICE IN ONE
 * SPRINT -- each reading named a tree the repairs that followed it overtook, and
 * a REVIEWER caught it both times. What was missing was never the rule; it was
 * the hash being to hand at the moment the sentence is written.
 *
 * DIRTY IS PART OF THE READING AND NOT A WARNING ABOUT IT: a green taken on a
 * working tree that does not match its commit is a green for a state no commit
 * holds, which is the harder error to notice afterwards.
 *
 * IT PRINTS BELOW THE VERDICT SO IT CANNOT DISPLACE IT, and it is silent about a
 * tree that is no checkout at all -- this runner grades a directory, and being
 * outside git is not a fault it may invent.
 */
const head = spawnSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf8" });
if (head.status === 0) {
  const dirty = spawnSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8" });
  const clean = dirty.status === 0 && dirty.stdout.trim() === "";
  process.stdout.write(
    `tree: ${head.stdout.trim()}${clean ? "" : " (WORKING TREE DIRTY, so this reading names no commit)"}\n`,
  );
}
if (failed.length !== 0) {
  process.exitCode = 1;
}
