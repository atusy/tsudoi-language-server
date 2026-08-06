import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
  globSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { declaredMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline, suiteDeadlineMs } from "./helpers/deadline.ts";
import { handshakeTimeoutMs } from "./helpers/readme.ts";

applySuiteDeadline();

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * THE REAL MODULE, NOT A RE-IMPLEMENTATION: a throwaway tree calling a copy of
 * the policy shares no subject with the suite, so deleting `setDefaultTimeout`
 * from the module this repository actually calls would leave every arm green.
 */
const deadlineModule = fileURLToPath(new URL("./helpers/deadline.ts", import.meta.url));

/**
 * The directory names bunfig.toml tells bun not to discover under.
 *
 * SPELLED AS SEGMENTS HERE AND AS GLOBS THERE, with an arm below refusing a
 * disagreement, because the two consumers cannot share one spelling: a TOML file
 * holds no TypeScript and a walk takes no glob. What the arm buys is that
 * deleting the key leaves this constant grading files bun still runs, LOUDLY.
 */
const ignoredSegments = ["__ignored", "dist"];

test("what bunfig takes out of the run is what these sweeps take out of the walk", () => {
  const declared = /pathIgnorePatterns\s*=\s*\[([^\]]*)\]/.exec(
    readFileSync(join(repoRoot, "bunfig.toml"), "utf8"),
  )?.[1];
  // A missing key and a key naming nothing are one reading without this, and
  // `[...undefined]` is not a failure a reader can act on.
  expect(declared).toBeDefined();

  expect(
    [...(declared ?? "").matchAll(/"\*\*\/([^/"*]+)\/\*\*"/g)].map((hit) => hit[1]).sort(),
  ).toEqual([...ignoredSegments].sort());
});

/**
 * A tree bun will run `bun test` in. Every file is written by the caller, and
 * the tags below are the only naming this file does.
 *
 * THREE FILES AND NOT ONE: the defect these arms exist for reaches only the
 * FIRST file of a real suite, which a one-file throwaway spares.
 *
 * AND `PUT THE ARM IN THE SECOND FILE` IS NOT A THING A TEST CAN DO HERE: bun
 * evaluates test files in the DIRECTORY'S own order, not in name order. So the
 * arms below nominate no file; they put THE SAME DISCRIMINATING PAIR IN EVERY
 * ONE, so whichever bun reaches first, the others answer.
 *
 * OUTSIDE THE REPOSITORY, because bun discovers bunfig.toml relative to the
 * current working directory: a tree under test/ would put a second [test]
 * section where the suite's own build lives, and its files would be swept.
 *
 * THE FILENAMES SHARE `deadline` SO THE NAME-FILTER FORM SELECTS ALL THREE. A
 * filter matching only one file would run it alone, which is the single-file
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
  /** Every line these arms read -- the failure, the value, the counts. */
  readonly stderr: string;
}

/**
 * `bun test` in `cwd`, with the override PINNED EXPLICITLY -- set to a value, or
 * `null` for REMOVED FROM THE CHILD'S ENVIRONMENT.
 *
 * EVERY ARM PINS IT, INCLUDING THE ONES THAT WOULD BE HAPPY WITH THE DEFAULT:
 * an arm relying on the variable's ABSENCE agrees silently with a developer who
 * left it set in their shell, and this process's environment is inherited.
 *
 * `null` IS NOT THAT ABSENCE. The key is DELETED from the inherited copy, so the
 * child meets the unset state whatever the shell holds; omitting the key from
 * the object below would not do it, `process.env` being spread in first.
 */
function runBunTest(cwd: string, args: readonly string[], overrideMs: string | null): Promise<Run> {
  const env = { ...process.env };
  if (overrideMs === null) {
    delete env["TSUDOI_TEST_TIMEOUT_MS"];
  } else {
    env["TSUDOI_TEST_TIMEOUT_MS"] = overrideMs;
  }
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["test", ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env,
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
 * THE FOUR FORMS THE PRELOAD CONTRACT NAMES, with the counts each form's
 * SELECTION produces.
 *
 * ONE OF THEM RUNS A SINGLE FILE AND THAT IS THE FORM'S OWN DOING RATHER THAN A
 * WEAKENING -- `bun test <path>` names one file, so under it every file in the
 * run is the first file. It is the one form under which a policy reaching only
 * the first file cannot be told from a correct one; the other three carry that.
 */
const invocationForms = [
  { name: "the bare form", args: [], passes: 3, fails: 3 },
  { name: "a file path", args: [fileName("b")], passes: 1, fails: 1 },
  { name: "a name filter", args: ["deadline"], passes: 3, fails: 3 },
  { name: "the -t filter", args: ["-t", "the deadline"], passes: 3, fails: 3 },
] as const;

/**
 * A tree holding ONE FAILING TEST under each ignored segment and nothing else,
 * so `did bun run it` is read off the run's own colour rather than off a count.
 *
 * THE bunfig BODY IS THE CALLER'S, because the negative control is the same tree
 * WITHOUT the key: an arm that only ever writes the real body asserts bun's
 * default discovery and calls it this repository's choice.
 */
function scratchTree(bunfigBody: string): { readonly root: string; dispose(): void } {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-ignored-")));
  writeFileSync(join(root, "bunfig.toml"), bunfigBody);
  for (const segment of ignoredSegments) {
    mkdirSync(join(root, segment), { recursive: true });
    writeFileSync(
      join(root, segment, "scratch.test.ts"),
      `import { expect, test } from "bun:test";\ntest("${segment} scratch", () => { expect(1).toBe(2); });\n`,
    );
  }
  return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
}

const ignorePatternsLine = `pathIgnorePatterns = [${ignoredSegments
  .map((segment) => JSON.stringify(`**/${segment}/**`))
  .join(", ")}]`;

/**
 * THE HALF THE TEXT ARM ABOVE CANNOT REACH: that one says this repository's
 * bunfig NAMES the segments, and a key bun stopped honouring would satisfy it
 * for ever. This spawns and reads what bun did.
 *
 * IT STAGES A TREE OF ITS OWN, which puts it in the class the perturbation
 * registry cannot re-run -- filed against PBI-72 rather than left to be
 * rediscovered.
 */
test("bun runs no test file under an ignored segment, and runs them without the key", async () => {
  const ignoring = scratchTree(`[test]\n${ignorePatternsLine}\n`);
  try {
    const run = await runBunTest(ignoring.root, [], null);
    expect(run.stderr).not.toContain(" 1 fail");
    expect(run.code).not.toBe(0);
    // bun's own words for the state being asserted. An exit code alone does not
    // say it: a run that found the files and failed on them exits non-zero too.
    expect(run.stderr).toContain("0 test files matching");
  } finally {
    ignoring.dispose();
  }

  // THE NEGATIVE CONTROL, and it is what makes the arm about this repository:
  // the same tree with the key gone runs both scratch files and fails on them.
  const running = scratchTree("[test]\n");
  try {
    const run = await runBunTest(running.root, [], null);
    expect(run.stderr).toContain(` ${String(ignoredSegments.length)} fail`);
    expect(run.code).toBe(1);
  } finally {
    running.dispose();
  }
});

/**
 * THE VALUE IS WHAT DISCRIMINATES AND THE TWO NUMBERS ARE CHOSEN FOR IT: bun
 * names the deadline it applied, so 500 separates OUR override from bun's own
 * 5000ms default and from a module that set nothing, and 1500 straddles both.
 *
 * WHAT THE `UNDER` HALF DOES NOT RULE OUT: at 100ms it passes under any deadline
 * anyone could set, so it witnesses the criterion's other direction and nothing
 * more. The two arms after this loop are the ones that make a PASS impossible
 * for an ambient default to have produced.
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
 * THE CHEAP DETERMINISTIC READING OF `THE POLICY REACHES EVERY FILE`: three
 * calling files at 1500ms against a `--timeout 100` child, where straddling
 * bun's own 5000ms three times would cost 16.5s of every run.
 *
 * THE PAIR RIDES IN THE SAME SPAWN, permanent and free: without a fourth file
 * that does NOT call the module, `3 pass` is satisfied by a run in which the
 * flag was never applied to anything.
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
 * THE ONE ARM WHOSE PASS BUN'S OWN DEFAULT COULD NOT HAVE PRODUCED. Every other
 * arm here proves the module LOWERS a deadline, which is the cheap direction and
 * which the preload could already do.
 *
 * IT COSTS 5.5 SECONDS OF WALL CLOCK ON EVERY RUN AND THAT IS DELIBERATE: with
 * no flag in the child there is nothing to straddle but 5000ms itself.
 *
 * WHAT IT DOES NOT RULE OUT, and the arm above is what does: ONE slow test
 * cannot tell a module that reached every file from one that reached only the
 * file bun evaluated first. Buying that here would mean straddling 5000ms in all
 * three files, 16.5s on every run.
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
 * The values that reach `setDefaultTimeout` as NaN, as zero or as a fraction.
 *
 * NOT DEFENSIVE CODING: a NaN or non-positive default DISABLES THE DEADLINE
 * ENTIRELY rather than falling back, and `Number("") === 0`, so a set-but-empty
 * variable switches every deadline in this suite off while the run reports
 * green. A fraction fails the other way, truncating to 1ms so EVERYTHING dies --
 * one rule, a positive integer, covers both, which is why this is one loop.
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
 * THE TREE THESE ARMS NEVER GET TO RUN, and 6000ms is the whole point: a module
 * that ACCEPTED the malformed value reports three passes at exit 0 -- three
 * tests bun's own 5000ms default could not have passed, green, with the deadline
 * switched off. Shorten the sleep and the refusal is asserted against nothing.
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
 * refuses EVERYTHING, which would fail the suite it is meant to protect.
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

/**
 * THE ARM WITHOUT WHICH THE PIN BELOW PINS NOTHING. Every other arm in this file
 * PINS THE OVERRIDE, for the reason written at `runBunTest`, so the no-override
 * branch is executed by nothing -- and the pin below reads the EXPORTED
 * constant, which a branch handing bun some other literal does not touch.
 *
 * SO THE SUBJECT HERE IS THE ARGUMENT `setDefaultTimeout` RECEIVES, not a
 * constant beside it. Nothing in JavaScript short of intercepting the callee can
 * see that: a returned value, a recorded copy, an exported resolution are all
 * defeated by the same one-token edit, each being a SECOND expression that the
 * edit leaves alone. The spy CALLS THROUGH, so this reads the argument without
 * disabling the effect.
 *
 * THE COUNTS ACCUMULATE ACROSS FILES AND THE ASSERTION IS WRITTEN FOR IT: bun
 * hands back THE SAME SPY on a second `spyOn` of a property already spied, so
 * the file bun evaluates last sees three calls and the first sees one, and
 * asserting `[[suiteDeadlineMs]]` would redden on two of three in a correct
 * tree. What is asserted instead is that NO recorded call carried anything else.
 *
 * AND THE NON-EMPTY PAIR IS WHAT MAKES THE INSTRUMENT SAFE RATHER THAN TIDY: if
 * the interception ever stops working, `args` is EMPTY and an empty offender
 * list passes.
 *
 * WHAT A FILTER OVER VALUES CANNOT SAY IS *WHEN*, WHICH IS WHY THE LAST TWO
 * ASSERTIONS ARE ABOUT ORDER: THE ONE CALL MOVED BELOW THE REGISTRATION leaves
 * every recorded value the constant while the test registered above it captured
 * bun's own 5000ms. That reading is possible off a shared spy only because bun
 * INTERLEAVES -- a file is evaluated, ITS TESTS RUN, and only then is the next
 * evaluated -- so at the moment a file's body runs the last recorded call is
 * that file's own. The day that stops being true, the count assertion reddens
 * rather than going quiet.
 */
test("with no override in the environment, bun is handed the exported constant", async () => {
  const tree = throwawayTree(
    (tag) => `import { expect, spyOn, test } from "bun:test";
import * as bunTest from "bun:test";
import { applySuiteDeadline, suiteDeadlineMs } from ${JSON.stringify(deadlineModule)};

const spy = spyOn(bunTest, "setDefaultTimeout");
applySuiteDeadline();

test("${tag} hands bun the exported constant", () => {
  const args = spy.mock.calls.map((call) => call[0]);

  expect(args.filter((ms) => ms !== suiteDeadlineMs)).toEqual([]);
  expect(args.length).toBeGreaterThan(0);
  expect(args[args.length - 1]).toBe(suiteDeadlineMs);
  expect(spy.mock.calls.length).toBe(callsWhenRegistered);
});

// BELOW THE REGISTRATION ON PURPOSE: this is the count as the test above saw
// the world, so anything setting a deadline after this line is a call the
// registered test never got.
const callsWhenRegistered = spy.mock.calls.length;
`,
  );
  try {
    const run = await runBunTest(tree.root, [], null);

    expect(run.stderr).toContain(" 3 pass");
    expect(run.stderr).toContain(" 0 fail");
    expect(run.code).toBe(0);
  } finally {
    tree.dispose();
  }
});

/**
 * NO OTHER ARM IN THIS FILE CAN ASK THIS. Every one of them pins the variable in
 * the CHILD'S ENVIRONMENT before that process starts, so an import-time read and
 * a call-time read produce the same reading everywhere else here; the seam is
 * exercised constantly and its TIMING by nothing.
 *
 * THE MUTATION IS REACHABLE ONLY BECAUSE ESM HOISTS: the assignment below runs
 * after the imports, so the module has already been evaluated -- and evaluated
 * ONCE for the whole child, since the registry is per process. That is what
 * makes `300 in all three files` discriminating rather than an accident of which
 * file bun reached first.
 *
 * IT ALSO GUARDS THE REFUSAL RATHER THAN ONLY THE VALUE: the malformed-value
 * check runs at that module's scope, so a per-call read would accept anything
 * assigned afterwards -- the silent-disable class by the one route its own
 * subtask cannot see.
 */
test("the override is read once at import, not again at every call", async () => {
  const frozenMs = 300;
  const mutatedMs = 777;
  const tree = throwawayTree(
    (tag) => `import { expect, spyOn, test } from "bun:test";
import * as bunTest from "bun:test";
import { applySuiteDeadline } from ${JSON.stringify(deadlineModule)};

const spy = spyOn(bunTest, "setDefaultTimeout");
process.env["TSUDOI_TEST_TIMEOUT_MS"] = "${mutatedMs}";
applySuiteDeadline();

test("${tag} is handed the value the import saw", () => {
  const args = spy.mock.calls.map((call) => call[0]);

  expect(args.filter((ms) => ms !== ${frozenMs})).toEqual([]);
  expect(args.length).toBeGreaterThan(0);
});
`,
  );
  try {
    const run = await runBunTest(tree.root, [], String(frozenMs));

    expect(run.stderr).toContain(" 3 pass");
    expect(run.stderr).toContain(" 0 fail");
    expect(run.code).toBe(0);
  } finally {
    tree.dispose();
  }
});

/**
 * A RELATION BETWEEN TWO IMPORTED CONSTANTS RATHER THAN AN EQUALITY AGAINST A
 * LITERAL. `expect(suiteDeadlineMs).toBe(25_000)` would be green against ANY
 * tree, including one where a helper's deadline had since been raised past it --
 * it would pin the typing rather than the property. The alternative it also
 * refuses is asserting a DURATION, which is asserting a property of the machine.
 *
 * WHAT IT DEFENDS: under bun's 5000ms default the quickstart test dies before
 * `shakeHands` can speak, so a broken documented command reports `this test
 * timed out` instead of naming the command that never answered.
 */
test("the suite's deadline outlives the largest helper deadline an ungated test can reach", () => {
  expect(suiteDeadlineMs).toBeGreaterThan(handshakeTimeoutMs);
});

/**
 * EVERY NUMERAL OF FOUR DIGITS OR MORE WRITTEN IN A HELPER -- NOT `every deadline
 * a helper holds`, which is a claim the matcher cannot make.
 *
 * IT IS NOTATION-BOUND IN ONE DIRECTION AND OVER-WIDE IN THE OTHER. A deadline
 * written `26 * 1000`, read from a constant in another module, or spelled in
 * seconds is invisible here whatever its size; and a 4+-digit numeral in a
 * helper's PROSE reddens the arm below on a tree whose deadlines never moved.
 *
 * BOTH ARE KEPT RATHER THAN ENGINEERED AWAY, and the false positive is the
 * reason: it fails LOUD and names the file, where narrowing the scan to
 * non-comment text buys silence in exchange for a heuristic nobody has measured.
 * A rot detector, not a barrier -- the ruling `.oxlintrc.json` carries too.
 */
function numeralsIn(source: string): readonly number[] {
  return [...source.matchAll(/(?<![\w.])(\d[\d_]{3,})(?![\w.])/g)].map((match) =>
    Number(match[1]!.replaceAll("_", "")),
  );
}

const helperDeadlines = readdirSync(join(repoRoot, "test", "helpers"))
  .filter((name) => name.endsWith(".ts") && name !== "deadline.ts")
  .flatMap((name) =>
    numeralsIn(readFileSync(join(repoRoot, "test", "helpers", name), "utf8")).map((ms) => ({
      file: name,
      ms,
    })),
  );

/**
 * THE PAIR THE PIN CANNOT DO WITHOUT: `25_000 > 20_000` is true of a tree where
 * nothing reaches that helper at all, and true of a tree where a BIGGER helper
 * deadline was added last week. THE NAME SAYS `NUMBER` AND NOT `DEADLINE`
 * BECAUSE THE INSTRUMENT READS NUMERALS, with the two costs of that named where
 * the scan is built.
 *
 * TWO EXCLUSIONS, EACH WITH ITS REASON RATHER THAN FILTERED SILENTLY.
 * test/helpers/fake-editor.ts, because its timer is not a deadline a test
 * carrying no explicit one can reach -- the only tests that start that rig set
 * one for themselves and so fire first, and it is a leak bound on a spawned
 * child rather than a diagnostic. THE DAY SOMETHING ELSE REACHES IT, that has to
 * be argued again, and the number it turns on has an arm of its own below.
 * `deadline.ts`, because it DECLARES the number under test, so including it
 * would compare the constant with itself.
 */
test("the pinned floor is the largest number any helper writes", () => {
  const reachable = helperDeadlines.filter((found) => found.file !== "fake-editor.ts");
  const larger = reachable.filter((found) => found.ms > handshakeTimeoutMs);

  expect(larger).toEqual([]);
  // THE PAIR FOR THAT EMPTY LIST: a reader that opened nothing and a tree with
  // no helper deadlines are the same observation without it.
  expect(reachable.map((found) => found.ms)).toContain(handshakeTimeoutMs);
  // AND THE NAMED EXCEPTION IS ASSERTED TO STILL BE THERE, so the filter above
  // cannot quietly become a filter over nothing.
  expect(helperDeadlines.filter((found) => found.file === "fake-editor.ts")).not.toEqual([]);
});

/**
 * THE NAMING FORMS bun ACTUALLY RUNS, which is WIDER than `.test.ts` -- all this
 * tree happens to hold today. A file named any of the other four ways would be
 * RUN by the suite, so narrowing this to what the tree has sweeps none of them.
 */
const testFileNames = /(?:\.|_)(?:test|spec)\.[cm]?[jt]sx?$/;

/**
 * EVERY TEST FILE THE ROOT `bun test` REACHES, WALKED RATHER THAN LISTED,
 * BECAUSE BUN DISCOVERS RECURSIVELY: a `.test.ts` under test/fixtures/, under
 * scripts/, or under a package's src/ is RUN by the suite, and a single
 * `readdirSync` of one directory saw none of them.
 *
 * THE PRUNE IS bun'S OWN RATHER THAN CHOSEN, AND HALF OF IT IS NOW THIS
 * REPOSITORY'S CHOICE. `node_modules/` and DOT-DIRECTORIES bun skips by itself.
 * `dist/` and `__ignored/` it once walked -- GITIGNORED IS NOT A THING BUN'S
 * WALK KNOWS -- and bunfig.toml's `pathIgnorePatterns` now takes them out, so
 * they are pruned here to keep this walk equal to what runs. Sweeping a file bun
 * never reaches would demand `applySuiteDeadline()` of a scratch file for
 * nothing.
 */
function discoverTestFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        ignoredSegments.includes(entry.name)
      ) {
        return [];
      }
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        return discoverTestFiles(full);
      }
      return testFileNames.test(entry.name) ? [relative(repoRoot, full)] : [];
    })
    .sort();
}

const everyTestFile = discoverTestFiles(repoRoot);

/**
 * THE PAIR NEITHER SWEEP CAN SUPPLY FOR ITSELF: a non-empty subject list is
 * satisfied by an enumeration that found ONE file, so `toEqual([])` beside
 * `length > 0` cannot see a walk whose filter quietly stopped matching.
 *
 * A SECOND MECHANISM AND NOT A SECOND READING OF THE FIRST -- `the count is
 * asserted against the listing that produced it` is `list.length ===
 * list.length`, which no edit to the filter can falsify. `globSync` walks by
 * PATTERN where `discoverTestFiles` walks by hand, and the two prunes are
 * spelled separately BELOW AND ABOVE ON PURPOSE: one edit cannot narrow both.
 *
 * `node:fs` AND NOT `Bun.Glob`: `.oxlintrc.json` bans the `Bun` global with no
 * exemption anywhere, and a test file is not where that is spent.
 *
 * WHAT IT STILL CANNOT SEE, THE PATTERN BEING NARROWER THAN THE WALK: the four
 * other naming forms bun runs. The day a `*.spec.ts` lands, the walk finds it
 * and this arm does not -- it reddens on the disagreement rather than passing,
 * which is the direction that costs nothing to be wrong in.
 */
test("the walk both sweeps read agrees with a second enumeration", () => {
  const globbed = globSync("**/*.test.ts", { cwd: repoRoot })
    .filter(
      (path) =>
        !path
          .split(sep)
          .some(
            (segment) =>
              segment === "node_modules" ||
              segment.startsWith(".") ||
              ignoredSegments.includes(segment),
          ),
    )
    .sort();

  expect(everyTestFile.filter((path) => path.endsWith(".test.ts"))).toEqual(globbed);
  // THE PAIR FOR AN EQUALITY OF TWO LISTS: two enumerations that both found
  // nothing agree perfectly.
  expect(globbed.length).toBeGreaterThan(0);
});

/**
 * The partition, BY PATH rather than by two separate walks. `declaredMembers` AND
 * NOT A GLOB, so a package added under packages/ moves to the right side with no
 * edit here -- and NOT `handlerMembers`, because the question is `which suites
 * are outside the root sweep`, true of every member whatever it declares.
 */
const memberDirectories = declaredMembers(repoRoot).map(
  (member) => `${relative(repoRoot, member)}/`,
);

function insideAMember(path: string): boolean {
  return memberDirectories.some((dir) => path.startsWith(dir));
}

/** The ROOT suite, which is what spawns. */
const rootTestFiles = everyTestFile.filter((path) => !insideAMember(path));

/**
 * TEXT AND NOT BEHAVIOUR, WITH THE LIMITS NAMED: bun exposes no way to read the
 * deadline currently in force, and the honest behavioural instrument -- spawning
 * `bun test <file>` once per file at a tiny override -- costs a spawn per file
 * on every run. So this reads source, and what it CANNOT see is a file that
 * imports the function under another name. A rot detector, not a barrier, which
 * is the same ruling `.oxlintrc.json` carries for its own guards.
 *
 * THE IMPORT NEEDLE CARRIES NO LEADING `./`: a swept file one directory down
 * spells the same import `../helpers/deadline.ts`, and a needle anchored to the
 * root suite's depth would quietly excuse it.
 *
 * THE CALL IS MATCHED AS A WHOLE LINE, WHICH THE SUBSTRING FORM WAS NOT:
 * `// applySuiteDeadline();` satisfies a substring search perfectly, and so does
 * a call inside a function body, where it would run too late. WHAT THE ANCHOR
 * COSTS IS NAMED INSTEAD OF DENIED: a file that WRAPPED the call across lines
 * would be reported as missing it -- the loud direction.
 *
 * AND COLUMN 0 IS A CLAIM ABOUT TYPOGRAPHY WHERE THE PROPERTY IS ABOUT ORDER: a
 * call at the BOTTOM of a file is still on its own line at column 0, and the
 * deadline it sets reaches none of the tests registered above it. So the sweep
 * asks where the call is RELATIVE TO the first registration, with the anchor
 * KEPT under the new rule rather than replaced by it.
 *
 * A FILE WITH NO REGISTRATION AT ALL IS AN OFFENDER AND NOT A PASS, deliberately:
 * an ordering rule whose anchor is missing decides nothing. The registration
 * needle carries no column anchor of its own, where the call's needle does,
 * because `describe(runtime.name, ...)` inside a loop over the two runtimes is
 * this suite's commonest shape and is INDENTED.
 *
 * THE LEFTOVER IMPORT IS FLAGGED BY NOTHING AND THAT IS LEFT STANDING: oxlint's
 * rule set here is a deno-compatibility guard and carries no unused-binding
 * rule. The import was never the subject -- the call is.
 *
 * AND THE ONE FILE THIS CANNOT READ IS THIS ONE, NAMED RATHER THAN PATCHED: the
 * child sources generated here put the call at column 0 INSIDE TEMPLATE
 * LITERALS, above a generated `test(` in the same template, and the module path
 * appears in the import needle's shape too -- so both halves and the ordering
 * rule match text belonging to a child suite that does not exist yet. With the
 * call at the top of this file commented out the sweep stays GREEN. IT IS
 * TOLERABLE ONLY BECAUSE THIS FILE ANNOUNCES ITSELF LOUDLY: the same run fails
 * on `the deadline is raised past bun's own default`, which waits 5.5s on a
 * child and cannot survive bun's own default. A test-only heuristic for `not
 * inside a template literal` would buy the reading back at the price of a
 * matcher nobody has measured.
 *
 * THE PAIR BELOW IS `THE LIST IS NON-EMPTY` AND THAT IS ALL IT IS: a sweep over
 * ONE file satisfies it as well as a sweep over all of them, and what makes the
 * subject list trustworthy is the cross-check arm above.
 */
const callsTheModule = /^applySuiteDeadline\(\);$/m;
const registersATest = /(?<![\w$.])(?:test|describe)\s*\(/;

function callPrecedesEveryRegistration(source: string): boolean {
  const call = source.search(callsTheModule);
  const firstRegistration = source.search(registersATest);
  return call >= 0 && firstRegistration >= 0 && call < firstRegistration;
}

test("every root test file sets the suite's deadline before it registers a test", () => {
  const missing = rootTestFiles.filter((path) => {
    const source = readFileSync(join(repoRoot, path), "utf8");
    return !(source.includes('helpers/deadline.ts"') && callPrecedesEveryRegistration(source));
  });

  expect(missing).toEqual([]);
  expect(rootTestFiles.length).toBeGreaterThan(0);
});

/**
 * WRITTEN AS A PAIR RATHER THAN AS A COMMENT, because `no file is missing the
 * call` is what a needle matching everything also says, and `no file calls late`
 * is what a needle finding no registration says.
 */
test("the sweep's needle takes the call, and refuses one that is commented out, buried or late", () => {
  const importLine = 'import { applySuiteDeadline } from "./helpers/deadline.ts";\n\n';

  expect(
    callPrecedesEveryRegistration(`${importLine}applySuiteDeadline();\n\ntest("t", () => {});\n`),
  ).toBe(true);
  expect(
    callPrecedesEveryRegistration(
      `${importLine}// applySuiteDeadline();\n\ntest("t", () => {});\n`,
    ),
  ).toBe(false);
  expect(
    callPrecedesEveryRegistration(`${importLine}test("t", () => {\n  applySuiteDeadline();\n});\n`),
  ).toBe(false);
  expect(
    callPrecedesEveryRegistration(`${importLine}test("t", () => {});\n\napplySuiteDeadline();\n`),
  ).toBe(false);
  expect(callPrecedesEveryRegistration(`${importLine}applySuiteDeadline();\n`)).toBe(false);
  // AND THE ENGLISH THAT IS NOT A REGISTRATION, both halves of it: a sentence
  // ending in the word, which a codebase with headers this long writes often,
  // and the `regex.test(source)` this very file makes. Either one counted as a
  // registration reports a compliant file as late.
  expect(
    callPrecedesEveryRegistration(
      `${importLine}// a claim about this test.\nconst hit = /x/.test(source);\n\napplySuiteDeadline();\n\ndescribe("d", () => {});\n`,
    ),
  ).toBe(true);
});

/**
 * The files that start the fake editor, read with the needle a reference to it
 * must carry. A rot detector like every text arm here: prose ending in that same
 * quoted path counts as a reacher, which is the loud direction.
 *
 * THIS FILE IS EXCLUDED because the file that SPELLS the needle contains it --
 * the same shape as the helper scan dropping deadline.ts, and safe for the same
 * reason: this file starts no rig.
 */
const thisFile = relative(repoRoot, fileURLToPath(import.meta.url));

const rigReachers = rootTestFiles.filter(
  (path) =>
    path !== thisFile &&
    readFileSync(join(repoRoot, path), "utf8").includes('helpers/fake-editor.ts"'),
);

/**
 * THE NUMBER THE HELPER ARM'S EXCLUSION IS MADE OF. Without this the exclusion
 * goes on standing with its premise inverted: shrink the rig's self-exit and the
 * scan above still drops it, while the timer now fires FIRST and kills the rig's
 * tests with a message about a child process.
 *
 * AGAINST THE SUITE'S OWN DEADLINE FIRST, which is the half that survives the
 * reaching file dropping its own: an ungated test that reached this rig would
 * run at `suiteDeadlineMs`.
 *
 * AND AGAINST THE REACHING FILE'S LARGEST NUMERAL SECOND, which is a PROXY and
 * says so: the same numeral scan, so what it compares is the biggest number that
 * file writes rather than the deadline it sets.
 */
test("the excluded rig timer outlives every deadline that can reach it", () => {
  const rig = helperDeadlines
    .filter((found) => found.file === "fake-editor.ts")
    .map((found) => found.ms);
  const reacherNumerals = rigReachers.flatMap((path) =>
    numeralsIn(readFileSync(join(repoRoot, path), "utf8")),
  );

  // THE PAIR FOR BOTH COMPARISONS: `Math.min()` of nothing is Infinity, which
  // outlives everything and measures nothing.
  expect(rig).not.toEqual([]);
  expect(reacherNumerals).not.toEqual([]);
  expect(Math.min(...rig)).toBeGreaterThan(suiteDeadlineMs);
  expect(Math.min(...rig)).toBeGreaterThan(Math.max(...reacherNumerals));
});

/**
 * THE EXCLUSION'S OTHER HALF, ITS OWN ARM BECAUSE IT IS ITS OWN HAZARD: `only`
 * is a claim about the whole root suite, and it is written as a test so that
 * whoever adds a second reacher is told rather than left to find the exception.
 */
test("only the rig's own file reaches the fake editor", () => {
  expect(rigReachers).toEqual(["test/editor-death.test.ts"]);
});

/**
 * The members' own suites, which the sweep above deliberately does not reach.
 *
 * ANYWHERE UNDER THE MEMBER AND NOT `<member>/test` ALONE: that directory is a
 * convention and bun's walk is not bound by it, so a test file beside a
 * package's `src/` satisfies neither enumeration while the root `bun test` runs
 * it.
 */
const memberTestFiles = everyTestFile.filter(insideAMember);

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
 * exposure this file exists for is a test that SPAWNS -- a compiler, a server, a
 * package manager -- and then waits on a machine that is busy. No member test
 * spawns anything: each builds its context in process, so the deadline they run
 * under is bun's and it binds nothing they do.
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
