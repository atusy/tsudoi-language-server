import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { declaredMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * THE REAL MODULE, NOT A RE-IMPLEMENTATION, AND THAT IS THE WHOLE REASON THE
 * OVERRIDE SEAM EXISTS. A throwaway tree calling a copy of the policy would
 * share no subject with the suite: deleting `setDefaultTimeout` from the module
 * this repository actually calls would leave every arm here green.
 */
const deadlineModule = fileURLToPath(new URL("./helpers/deadline.ts", import.meta.url));

/**
 * A tree bun will run `bun test` in. Every file is written by the caller, and
 * the tags below are the only naming this file does.
 *
 * THREE FILES AND NOT ONE, AND THE RULE IS PAID FOR IN THIS PROJECT'S OWN
 * BLOOD: the first version of these arms used a one-file tree and read 5 pass
 * while the mechanism they were verifying reached only the first file of a real
 * suite. A single-file throwaway is exactly the case that defect spares.
 *
 * AND `PUT THE ARM IN THE SECOND FILE` IS NOT A THING A TEST CAN DO HERE,
 * MEASURED: bun evaluates test files IN THE DIRECTORY'S OWN ORDER, NOT IN NAME
 * ORDER. Five files written a-x, b-x, a-fast, b-slow, c-zzz evaluated as b-x,
 * a-fast, a-x, c-zzz, b-slow -- stable across runs, and it cost this session an
 * hour: two trees differing in NOTHING BUT FILENAMES read 2 pass and 1 pass / 1
 * fail against the same module. So the arms below do not nominate a
 * non-first file; they put THE SAME DISCRIMINATING PAIR IN EVERY FILE, so
 * whichever one bun reaches first, the others answer.
 *
 * OUTSIDE THE REPOSITORY, because bun discovers bunfig.toml relative to the
 * current working directory: a tree under test/ would put a second [test]
 * section where the suite's own build lives, and its files would be swept.
 *
 * THE FILENAMES SHARE `deadline` SO THE NAME-FILTER FORM SELECTS ALL THREE.
 * A filter matching only one file would run it alone, which is the single-file
 * case again wearing an invocation form's clothes.
 */
const treeTags = ["a", "b", "c"] as const;

function fileName(tag: string): string {
  return `${tag}-arm-deadline.test.ts`;
}

function throwawayTree(sourceFor: (tag: string) => string): {
  readonly root: string;
  dispose(): void;
} {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-deadline-")));
  writeFileSync(join(root, "bunfig.toml"), "[test]\n");
  for (const tag of treeTags) {
    writeFileSync(join(root, fileName(tag)), sourceFor(tag));
  }
  return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
}

/** A file that calls the real module and then straddles the deadline both ways. */
function callingPair(tag: string, pastMs: number): string {
  return `import { expect, test } from "bun:test";
import { applySuiteDeadline } from ${JSON.stringify(deadlineModule)};

applySuiteDeadline();

test("${tag} sleeps PAST the deadline", async () => {
  await new Promise((resolve) => setTimeout(resolve, ${pastMs}));
  expect(1).toBe(1);
});

test("${tag} sleeps UNDER the deadline", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(1).toBe(1);
});
`;
}

interface Run {
  readonly code: number | null;
  /**
   * THE REPORTER'S STREAM, MEASURED RATHER THAN GUESSED: on bun 1.3.13 stdout
   * carries the version banner and NOTHING ELSE, and every line these arms read
   * -- the failure, the timeout value, the counts -- arrives on stderr.
   */
  readonly stderr: string;
}

/**
 * `bun test` in `cwd`, with the override SET EXPLICITLY.
 *
 * EVERY ARM SETS IT, INCLUDING THE ONES THAT WOULD BE HAPPY WITH THE DEFAULT.
 * An arm relying on the variable's ABSENCE agrees silently with a developer who
 * left it set in their shell, and this process's own environment is inherited
 * by the child.
 */
function runBunTest(cwd: string, args: readonly string[], overrideMs: string): Promise<Run> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["test", ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, TSUDOI_TEST_TIMEOUT_MS: overrideMs },
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", () => {});
    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stderr: Buffer.concat(chunks).toString("utf8") });
    });
  });
}

/**
 * THE FOUR FORMS THE PRELOAD CONTRACT NAMES, spelled the way bunfig.toml's own
 * paragraph spells them, with the counts each form's SELECTION produces.
 *
 * ONE OF THEM RUNS A SINGLE FILE AND THAT IS THE FORM'S OWN DOING RATHER THAN A
 * WEAKENING -- `bun test <path>` names one file, so under it every file in the
 * run is the first file. It is the one form under which the module-scope
 * degenerate below cannot be told from a correct module, said here rather than
 * left to be discovered; the other three carry that reading.
 */
const invocationForms = [
  { name: "the bare form", args: [], passes: 3, fails: 3 },
  { name: "a file path", args: [fileName("b")], passes: 1, fails: 1 },
  { name: "a name filter", args: ["deadline"], passes: 3, fails: 3 },
  { name: "the -t filter", args: ["-t", "the deadline"], passes: 3, fails: 3 },
] as const;

/**
 * WHAT DISCRIMINATES HERE IS THE PRINTED VALUE AND THE COUNTS, not the mere
 * presence of a failure: bun names the deadline it applied, so `500ms` separates
 * OUR override from bun's own 5000ms default and from a module that set nothing
 * -- and requiring EVERY file's over-arm to have died separates a policy that
 * reached all three files from one that reached whichever bun evaluated first.
 *
 * THREE DEGENERATES, STATED IN ADVANCE AND RUN, WITH WHAT EACH READ IN THIS
 * FILE. (1) `applySuiteDeadline` with an empty body: the 1500ms sleeps pass
 * under bun's 5000ms default and the fail count collapses -- 2 pass / 6 fail,
 * every arm in this file except the two sweeps. (2) The module reading a
 * MISSPELT variable: 25_000 applies, the sleeps pass, 4 pass / 4 fail, the four
 * arms below -- which is what makes the spelling something every run of this
 * suite exercises rather than something a reader must check. (3) THE ONE THIS
 * SPRINT EARNED: the call moved OUT of the function back to module scope, which
 * is the preload defect wearing different clothes -- the registry evaluates it
 * once, so exactly ONE file gets the deadline and the other two revert. 3 pass /
 * 5 fail, AND THE ONE FORM THAT STAYED GREEN IS THE FILE-PATH FORM, for the
 * reason written above it rather than by luck.
 *
 * WHAT THE `UNDER` HALF DOES NOT RULE OUT, said plainly: at 100ms it passes
 * under any deadline anyone could set, so it witnesses the criterion's other
 * direction and nothing more. The two arms after this loop are the ones that
 * make a PASS impossible for an ambient default to have produced.
 */
for (const form of invocationForms) {
  test(`the deadline applies under ${form.name}, and bun names it`, async () => {
    const tree = throwawayTree((tag) => callingPair(tag, 1500));
    try {
      const run = await runBunTest(tree.root, form.args, "500");

      expect(run.stderr).toContain("this test timed out after 500ms.");
      expect(run.stderr).toContain(` ${form.passes} pass`);
      expect(run.stderr).toContain(` ${form.fails} fail`);
      expect(run.code).toBe(1);
    } finally {
      tree.dispose();
    }
  });
}

/**
 * THE FLAG THIS SPRINT SET OUT TO RETIRE, MEASURED AS A LIVE PROPERTY OF THE
 * SUITE RATHER THAN INHERITED BY ANALOGY. The record's `a preload beats
 * --timeout` has already been shown narrower than it read, so the same claim is
 * not extended to this call site without a reading: the child runs with
 * `--timeout 100`, which is the ambient deadline every file that does NOT call
 * the module gets, and a 1500ms test passing under it is impossible without the
 * call.
 *
 * IT IS ALSO THE CHEAP DETERMINISTIC READING OF `THE POLICY REACHES EVERY FILE`:
 * three calling files at 1500ms cost 4.5s where straddling bun's own 5000ms
 * three times would cost 16.5s, and under the module-scope degenerate exactly
 * one of the three survives.
 *
 * THE PAIR RIDES IN THE SAME SPAWN, permanent and free: a FOURTH file that does
 * not call the module, sleeping the same 1500ms, must die -- and must die naming
 * 100ms. Without it, `3 pass` is satisfied by a run in which the flag was never
 * applied to anything.
 */
test("a file's own call beats --timeout, and a file without one does not", async () => {
  const tree = throwawayTree((tag) => callingPair(tag, 1500));
  try {
    writeFileSync(
      join(tree.root, "d-nocall-deadline.test.ts"),
      `import { expect, test } from "bun:test";

test("d sleeps 1500 WITHOUT the call", async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  expect(1).toBe(1);
});
`,
    );

    const run = await runBunTest(tree.root, ["--timeout", "100"], "20000");

    expect(run.stderr).toContain("(fail) d sleeps 1500 WITHOUT the call");
    expect(run.stderr).toContain("this test timed out after 100ms.");
    expect(run.stderr).toContain(" 6 pass");
    expect(run.stderr).toContain(" 1 fail");
    expect(run.code).toBe(1);
  } finally {
    tree.dispose();
  }
});

/**
 * THE ONE ARM WHOSE PASS BUN'S OWN DEFAULT COULD NOT HAVE PRODUCED, and it is
 * the product property rather than a control: raising the limit ABOVE 5000ms in
 * a file that is not the first one is the whole of what this sprint buys. Every
 * other arm here proves the module LOWERS a deadline, which is the cheap
 * direction and which the preload could already do.
 *
 * IT COSTS 5.5 SECONDS OF WALL CLOCK ON EVERY RUN OF THE SUITE AND THAT IS
 * DELIBERATE: with no flag in the child there is nothing to straddle but 5000ms
 * itself, and a pass that says nothing is what this file exists not to ship. It
 * is run ONCE rather than per form, because what a form decides is which tests
 * are SELECTED, and the four arms above already read that.
 *
 * WHAT IT DOES NOT RULE OUT, and the arm above is what does: ONE slow test
 * cannot tell a module that reached every file from one that reached only the
 * file bun evaluated first, since that order is the directory's rather than the
 * name's. Making it deterministic here would mean straddling 5000ms in all three
 * files, which is 16.5s on every run of the suite; the `--timeout 100` arm buys
 * the same reading for 4.5s and this one keeps the no-flag path honest.
 */
test("the deadline is raised past bun's own default, with no flag in the run", async () => {
  const tree = throwawayTree((tag) =>
    tag === "b"
      ? `import { expect, test } from "bun:test";
import { applySuiteDeadline } from ${JSON.stringify(deadlineModule)};

applySuiteDeadline();

test("b sleeps past bun's own default", async () => {
  await new Promise((resolve) => setTimeout(resolve, 5500));
  expect(1).toBe(1);
});
`
      : `import { expect, test } from "bun:test";
import { applySuiteDeadline } from ${JSON.stringify(deadlineModule)};

applySuiteDeadline();

test("${tag} runs beside it", () => {
  expect(1).toBe(1);
});
`,
  );
  try {
    const run = await runBunTest(tree.root, [], "20000");

    expect(run.stderr).toContain(" 3 pass");
    expect(run.stderr).toContain(" 0 fail");
    expect(run.code).toBe(0);
  } finally {
    tree.dispose();
  }
});

/**
 * The values that reach `setDefaultTimeout` as NaN, as zero or as a fraction,
 * and what each is called in the failure this file produces.
 *
 * EVERY ONE OF THEM WAS MEASURED AGAINST A 6000ms SLEEP -- one bun's own 5000ms
 * default fails -- BEFORE THE REFUSAL EXISTED, and that is why this is not
 * defensive coding: `""`, `"abc"`, `"0"` and `"-5"` each ran 1 pass at exit 0,
 * because a NaN or non-positive default DISABLES THE DEADLINE ENTIRELY rather
 * than falling back. `Number("") === 0`, so a set-but-empty variable switches
 * every deadline in this suite off while the run reports green.
 *
 * `"1.5"` IS THE ONE THE RECORD DID NOT ANTICIPATE and it fails the other way,
 * truncating to 1ms so that EVERYTHING dies. One rule -- a positive integer --
 * covers both directions, which is why the arms below are one loop and not two.
 */
const malformedOverrides = [
  { label: "the empty string", value: "" },
  { label: "a blank", value: " " },
  { label: "a word", value: "abc" },
  { label: "zero", value: "0" },
  { label: "a negative", value: "-5" },
  { label: "a fraction", value: "1.5" },
] as const;

/**
 * THE TREE THESE ARMS NEVER GET TO RUN, and its shape is the assertion's whole
 * point: three files whose tests sleep 6000ms, so that a module which ACCEPTED
 * the malformed value would report three passes at exit 0 -- three tests that
 * bun's own default could not have passed, green, with the deadline switched
 * off. That is the silent green the refusal exists to make impossible, and it is
 * what the degenerate below actually printed.
 *
 * DEGENERATE, STATED IN ADVANCE AND RUN: the validation deleted, so the module
 * takes `Number(raw)` as it comes. Every arm below reddens -- exit 0 where 1 is
 * required, no message, and ` 3 pass` where nothing should have run.
 */
function refusalTree(): { readonly root: string; dispose(): void } {
  return throwawayTree(
    (tag) => `import { expect, test } from "bun:test";
import { applySuiteDeadline } from ${JSON.stringify(deadlineModule)};

applySuiteDeadline();

test("${tag} sleeps past bun's own default", async () => {
  await new Promise((resolve) => setTimeout(resolve, 6000));
  expect(1).toBe(1);
});
`,
  );
}

for (const malformed of malformedOverrides) {
  test(`${malformed.label} in the override refuses the run rather than disabling it`, async () => {
    const tree = refusalTree();
    try {
      const run = await runBunTest(tree.root, [], malformed.value);

      expect(run.stderr).toContain(
        `tsudoi: TSUDOI_TEST_TIMEOUT_MS must be a positive integer of milliseconds; got ${JSON.stringify(
          malformed.value,
        )}`,
      );
      // NO TEST RAN, which is the half a `refuses` assertion is usually missing:
      // an exit 1 is also what a suite that ran and failed produces.
      expect(run.stderr).not.toContain(" pass");
      expect(run.code).toBe(1);
    } finally {
      tree.dispose();
    }
  });
}

/**
 * THE PAIR, PERMANENT: without it every arm above is satisfied by a module that
 * refuses EVERYTHING, which would fail the suite it is meant to protect and
 * would look identical in this file.
 */
test("a well-formed override runs the suite normally", async () => {
  const tree = throwawayTree((tag) => callingPair(tag, 100));
  try {
    const run = await runBunTest(tree.root, [], "20000");

    expect(run.stderr).toContain(" 6 pass");
    expect(run.stderr).toContain(" 0 fail");
    expect(run.code).toBe(0);
  } finally {
    tree.dispose();
  }
});

/** Every test file the sweep is about: the ROOT suite, which is what spawns. */
const rootTestFiles = readdirSync(join(repoRoot, "test"))
  .filter((name) => name.endsWith(".test.ts"))
  .sort();

/**
 * THE SWEEP THAT CLOSES THE HOLE THE PER-FILE CALL OPENS, and it is the reason
 * a per-file mechanism is acceptable at all: a new test file that forgets the
 * call runs at bun's 5000ms with nothing anywhere saying so. MEASURED that the
 * hole is silent -- three calling files plus one that does not call read 3 pass
 * / 1 fail, the fourth dying at 5000ms while nothing else moved.
 *
 * TEXT AND NOT BEHAVIOUR, WITH THE LIMIT NAMED: bun exposes no way to read the
 * deadline currently in force, and the honest behavioural instrument -- spawning
 * `bun test <file>` once per file at a tiny override -- costs a spawn per file
 * on every run. So this reads source, and what it CANNOT see is a file that
 * imports the function under another name, or calls it inside a function body
 * where it would run too late. A rot detector, not a barrier, which is the same
 * ruling `.oxlintrc.json` carries for its own guards.
 *
 * THE PAIR IS PERMANENT AND IT IS NOT `THE LIST IS NON-EMPTY` ALONE: an
 * enumeration that found nothing and an enumeration where everything passes look
 * identical in a green. The count is asserted against the directory listing that
 * produced it, so a filter that stopped matching reddens here rather than
 * reporting success.
 */
test("every root test file sets the suite's deadline", () => {
  const missing = rootTestFiles.filter((name) => {
    const source = readFileSync(join(repoRoot, "test", name), "utf8");
    return !(
      source.includes('from "./helpers/deadline.ts"') && source.includes("applySuiteDeadline();")
    );
  });

  expect(missing).toEqual([]);
  expect(rootTestFiles.length).toBeGreaterThan(0);
});

/**
 * The members' own suites, which the sweep above deliberately does not reach.
 *
 * `declaredMembers` AND NOT A GLOB, so a package added under packages/ is
 * covered with no edit here -- and NOT `handlerMembers`, because the question is
 * `which suites are outside the root walk`, which is true of every member
 * whatever it declares. tsudoi's own member directory holds no test/ today; the
 * pair below is what keeps that from reading as a clean result.
 */
const memberTestFiles = declaredMembers(repoRoot)
  .flatMap((member) => {
    const dir = join(member, "test");
    return existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
          .map((entry) => relative(repoRoot, join(dir, entry.name)))
      : [];
  })
  .sort();

/**
 * The routes by which a test in this repository starts a process. Read as text,
 * so a member's file never enters a member's compiler program.
 */
const spawningRoutes = [
  "node:child_process",
  "Bun.spawn",
  "execFile",
  "execSync",
  "helpers/lsp.ts",
];

function spawnsIn(source: string): string[] {
  return spawningRoutes.filter((route) => source.includes(route));
}

/**
 * WHY THE MEMBERS ARE OUT OF THE SWEEP, ASSERTED RATHER THAN ASSUMED. The
 * exposure this whole item exists for is a test that SPAWNS -- a compiler, a
 * server, a package manager -- and then waits on a machine that is busy. No
 * member test spawns anything: each builds its context in process, which their
 * own comments say in as many words. So the deadline they run under is bun's,
 * and it binds nothing they do.
 *
 * IT REDDENS THE DAY THAT STOPS BEING TRUE, which is the whole point of writing
 * it as a test rather than as a paragraph: the first member test to reach for a
 * child process fails here, naming the file and the route, and whoever wrote it
 * is told to extend the sweep rather than left to discover the exclusion years
 * later.
 *
 * THE PAIR IS THE SAME MATCHER ON A FILE THAT DOES SPAWN, because `no member
 * matched` and `the matcher matches nothing` are the same observation otherwise
 * -- and this project has shipped a probe whose needles no longer occurred.
 *
 * READ AS TEXT AND NOT IMPORTED, deliberately: importing a member's test from
 * here would pull it into the root program, which is the containment the root
 * tsconfig's `exclude` maintains and which this file may not spend.
 */
test("no member's own test spawns, which is why the sweep stops at the root", () => {
  const spawners = memberTestFiles.filter(
    (path) => spawnsIn(readFileSync(join(repoRoot, path), "utf8")).length > 0,
  );

  expect(spawners).toEqual([]);
  expect(memberTestFiles.length).toBeGreaterThan(0);
  // THE PAIR: the same needles, on a root file that really does spawn a server.
  expect(spawnsIn(readFileSync(join(repoRoot, "test", "cli.test.ts"), "utf8"))).not.toEqual([]);
});
