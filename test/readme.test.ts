import { expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import {
  extractExamplesInstall,
  extractFailureContract,
  extractQuickstart,
  invocationOf,
  type ReadmeFact,
  startStep,
  statesFact,
  reword,
  sectionsStating,
  type QuickstartStep,
  QUICKSTART_STEPS,
  readReadme,
  runQuickstart,
  runQuickstartWithBrokenConfig,
  sequenceFor,
} from "./helpers/readme.ts";

await requireRuntime(denoRuntime);

const readme = readReadme();

// The extractor is what makes every criterion in PBI-8 non-vacuous, so its own
// count guard is asserted before anything reads what it found.
test("the README's quickstart yields the expected number of marked steps", () => {
  const steps = extractQuickstart(readme, QUICKSTART_STEPS);

  expect(steps).toHaveLength(QUICKSTART_STEPS);
  // Named rather than counted: `5 steps` would still hold if the write step and
  // a run step swapped kinds, and the sequence a reader follows would not.
  expect(steps.map((step) => step.kind)).toEqual(["run", "run", "write", "run", "run"]);
  expect(
    steps.flatMap((step) => (step.kind === "run" && step.starts ? [step.starts] : [])),
  ).toEqual(["bun", "deno"]);
});

/**
 * THE PAIRED POSITIVE CONTROL, permanent rather than a one-time perturbation:
 * an extractor that finds nothing would make `every extracted command succeeds`
 * VACUOUSLY TRUE, and the README could then rot exactly as if the tests held
 * their own copy of it.
 *
 * The probe is THIS README with its markers deleted, not a hand-written string:
 * that is the actual way the mechanism would break -- someone edits the
 * document and the markers go with the edit -- and a hand-written probe would
 * prove only that the regex fails on prose it was never pointed at.
 */
test("a README whose markers are gone extracts nothing, and says so", () => {
  const unmarked = readme.replaceAll("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(unmarked, QUICKSTART_STEPS)).toThrow(
    `README quickstart: expected ${String(QUICKSTART_STEPS)} marked blocks, found 0`,
  );
});

// The other end of the same guard: finding SOME of them is not finding them.
test("a README missing one marked step extracts fewer, and says so", () => {
  const short = readme.replace("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(short, QUICKSTART_STEPS)).toThrow(
    `found ${String(QUICKSTART_STEPS - 1)}`,
  );
});

/**
 * The working directory a step runs in is stated TWICE -- once in the marker
 * the test obeys, once in the prose the reader obeys -- and two copies is the
 * defect this whole PBI exists to prevent, reintroduced by the extraction
 * mechanism itself. The extractor refuses a marker whose directory the reader
 * is never shown; this asserts that the refusal works.
 */
test("a directory named only in a marker is refused", () => {
  const hidden = readme.replaceAll("in=tsudoi-language-server", "in=elsewhere");

  expect(() => extractQuickstart(hidden, QUICKSTART_STEPS)).toThrow("elsewhere");
});

/**
 * THE OVER-INSTALLATION DIRECTION, and a SOURCE-TEXT assertion because nothing
 * anywhere runs this command.
 *
 * The asymmetry, stated rather than hidden. Every other README command in this
 * file is EXECUTED, so a stale one fails by running. This one is not: MEASURED
 * at Sprint 25, the extraction harness executes the five `quickstart` blocks
 * and this is not one of them, so no run reaches it. What stands in for it is
 * test/helpers/install.ts, which SYMLINKS `wordnet` into every consumer instead
 * of running any install line -- so that harness observes whether the examples
 * work when their dependency is PRESENT, and never whether this line names the
 * right set. Telling a reader to install a package they do not need would leave
 * every other assertion in this suite green.
 *
 * ITS OWN TEST, not a second assertion on the one below, because the two
 * hazards are different and either can hide the other: naming a package the
 * examples do not need, and naming none of the ones they do.
 */
test("the README's examples install names no protocol package", () => {
  expect(extractExamplesInstall(readme)).not.toMatch(/vscode-languageserver-protocol/);
});

/**
 * THE PAIR for the absence above, and it is what stops the absence being
 * satisfied by deleting the command's arguments altogether. `wordnet` is the
 * one package examples/hover-wordnet.ts imports that a reader's project does
 * not already have from tsudoi.
 */
test("the README's examples install names the package the examples do need", () => {
  expect(extractExamplesInstall(readme)).toMatch(/\bwordnet\b/);
});

// The extractor's own vacuity guard, permanent: both assertions above are
// satisfied by a command nobody found -- one of them trivially -- so the throw
// is what makes them mean anything at all.
test("a README with no examples-install marker states no install command, and says so", () => {
  const unmarked = readme.replace("<!-- examples-install -->", "");

  expect(() => extractExamplesInstall(unmarked)).toThrow("expected 1 marked block, found 0");
});

/**
 * CRITERION 1. The commands are not mirrored here: they are the README's own
 * bytes, run in order, in a staged environment that supplies NOTHING the README
 * asks the reader to do -- no tarball, no node_modules, no config file. A
 * checkout of this repository with its dependencies installed is the one thing
 * staged, and the README names it as a prerequisite rather than a step.
 *
 * Both runtimes, because "starts under bun and deno" is the product goal's own
 * metric and a route only bun can take looks healthy from bun.
 */
for (const runtime of ["bun", "deno"] as const) {
  test(`the README's quickstart brings up a server under ${runtime}`, async () => {
    const outcome = await runQuickstart(
      sequenceFor(extractQuickstart(readme, QUICKSTART_STEPS), runtime),
    );

    // Falls back to the diagnosis rather than to undefined so a broken step
    // reports WHICH command failed and with what, on the assertion line.
    expect(outcome.serverName ?? outcome.diagnosis).toBe("tsudoi");
    // Counted, not eyeballed: one stray byte on stdout desyncs a real editor.
    expect(outcome.unframedStdoutBytes).toBe(0);
  });
}

/** How a step reads in a test name: the command, or the file it writes. */
function label(step: QuickstartStep): string {
  return step.kind === "run" ? step.command : `write ${step.path}`;
}

/**
 * THE COMPLETENESS SWEEP, and its real function is not what it looks like.
 *
 * It reads as a check that no documented step is USELESS. What it actually
 * proves is that THE ENVIRONMENT IS BARE: an omitted step whose absence still
 * produced a server would mean something other than the documented command was
 * supplying it, and the intact run above would then be a test of the harness
 * rather than evidence about the README. Extraction catches a STALE
 * instruction; only this catches a MISSING one -- and a README that omits a
 * required step is worse than no README, because a reader follows it, fails,
 * and concludes the product is broken.
 *
 * ONE RUNTIME, and the licence is Sprint 10's MEASUREMENT that both runtimes
 * take one artifact, one install and one file path -- not that two would be
 * expensive. If that route ever diverges, this basis is void and the sweep owes
 * both runtimes.
 *
 * The last step's omission looks degenerate -- run no server, get no server --
 * and is the strongest bareness assertion here: if anything OTHER than the
 * documented command were starting a server, this is where it would show.
 */
const bunSequence = sequenceFor(extractQuickstart(readme, QUICKSTART_STEPS), "bun");

for (const [index, omitted] of bunSequence.entries()) {
  test(`omitting «${label(omitted)}» leaves the quickstart with no server`, async () => {
    const outcome = await runQuickstart(bunSequence.filter((_, position) => position !== index));

    // The whole diagnosis on the failure line, so a step that turned out to be
    // unnecessary says what did run instead of merely that something did.
    expect(outcome.serverName === undefined ? "no server" : outcome.diagnosis).toBe("no server");
  });
}

/**
 * CRITERION 2, COMPARED TWO-SIDEDLY. The README's flags are read out of its own
 * bytes; the suite's come from `denoRuntime` IMPORTED from the helper every
 * other test spawns with -- not from parsing that helper's source. The compared
 * value is therefore the one that really runs, and no second parsing mechanism
 * enters needing a vacuity guard of its own.
 *
 * Both directions matter and neither alone is enough: narrowing the README
 * alone must redden, and narrowing `denoRuntime.runArgs` alone must redden. A
 * one-sided test passes when the two drift TOGETHER, which is the drift this
 * criterion exists to catch.
 */
test("the deno permissions the README documents are the ones the suite spawns", () => {
  const invocation = invocationOf(
    startStep(extractQuickstart(readme, QUICKSTART_STEPS), "deno").command,
  );

  expect(invocation.program).toBe(denoRuntime.command);
  expect(invocation.runArgs).toEqual([...denoRuntime.runArgs]);
});

/**
 * The reason is OWED, not optional: a deno user handing every permission to a
 * server that reads their source needs to know it is a third-party module-load
 * env read rather than tsudoi wanting their network -- and that narrower sets
 * are untested, whatever one measurement of one of them found.
 *
 * `--allow-read --allow-env` completing the handshake is a HISTORICAL claim,
 * pinned to deno 2.9.2, and that is deliberate: the suite spawns `-A` and
 * nothing here keeps a narrower set working, so a present-tense promise about
 * it would be a claim the suite cannot defend. A claim about what a measurement
 * found on a named version cannot go stale.
 */
const permissionsFact: ReadmeFact = {
  name: "why -A, what one narrower set measured, and that narrower is untested",
  tokens: [
    /-A/,
    /vscode-jsonrpc/,
    /XDG_RUNTIME_DIR/,
    /module load/i,
    /untested/i,
    /--allow-read --allow-env/,
  ],
};

/**
 * CRITERION 3, and the reader is STIPULATED: someone who was not here. Every
 * prerequisite that reader is assumed to have is named below, because an
 * unnamed prerequisite cannot be perturbed and is therefore not defended.
 *
 * Matched on DISCRIMINATING TOKENS rather than on sentences, in both
 * directions: rewording must still find the fact, and removing it must lose it.
 * A test matching a sentence fails on an improvement to the prose, which is how
 * a test teaches the next person to delete it.
 */
const facts: readonly ReadmeFact[] = [
  permissionsFact,
  {
    name: "--config has no default and is required",
    tokens: [/--config/, /no default/i, /required/i],
  },
  {
    name: "the config's default export is a factory",
    tokens: [/default export/i, /factory/i],
  },
  {
    name: "deno must be on PATH or `bun test` fails",
    tokens: [/deno/i, /PATH/, /bun test/, /fails/i],
  },
  {
    // RETARGETED AT SPRINT 40 RATHER THAN REMOVED, and the reason it survived
    // is that only ONE of its three tokens went false. `dist/` is still
    // gitignored and still generated; what stopped being true is that a reader
    // must run `bun run prepack` themselves, because bunfig.toml now builds it
    // before any test file loads. Sprint 25 called this an ARTIFACT
    // precondition rather than an environment one -- deno-on-PATH and `bun
    // install` are things a reader's MACHINE must have -- and that distinction
    // is what this entry now records the END of.
    //
    // THE SECOND TOKEN PAIR IS THE ONE THAT MATTERS NOW, and it is here because
    // the fix is NOT total: bun discovers bunfig.toml relative to the CURRENT
    // WORKING DIRECTORY and does not search upward, so `bun test` started
    // anywhere but the repository root runs the whole suite with no build.
    // MEASURED at Sprint 40 on that route, with dist/ deliberately stale: 442
    // pass / 2 fail, and the ONLY staleness-specific failure is the comparison
    // in package-shape.test.ts. That is why PBI-35's pre-authorised deletion of
    // that comparison was WITHDRAWN BY ITS OWN GATE, and why the README must
    // keep saying where to stand.
    //
    // THE NUMBER SPRINT 25 RECORDED HERE IS GONE RATHER THAN CORRECTED IN
    // PLACE, because it was a measurement with provenance and re-running it
    // gave a different answer for a reason that has nothing to do with this
    // sprint: at 9501c68 a dist/-less `bun test` gave 30 fail / 299 pass, and
    // at Sprint 40 the same shape gives 47 fail / 362 pass with 35 tests not
    // running at all. The suite grew; the sentence did not. It lives in
    // bunfig.toml now, beside the mechanism that makes it historical.
    name: "`bun test` builds dist/ itself, and only from the repository root",
    tokens: [/dist\//, /not committed/i, /automatic/i, /repository root/i],
  },
  {
    // Named because it is ASSUMED: the install step fetches tsudoi's own
    // dependency on a cold cache, and a reader without a network gets a failure
    // the README would otherwise have told them nothing about.
    name: "the first install needs a network unless bun's cache is warm",
    tokens: [/network/i, /cache/i, /vscode-languageserver-protocol/],
  },
  {
    // Named because it is the ONLY breaking change this package has shipped to
    // its published type surface, and because its blast radius is the part a
    // reader will otherwise guess wrong. Upstream's TextDocument is a SUPERSET
    // of the four-member shape it replaced, so receiving code is untouched and
    // only an IMPLEMENTOR -- someone's own hand-written mock -- has anything to
    // do. A reader who assumes the opposite rewrites handlers for nothing.
    //
    // `TextDocument\.create` is in the tokens because the remedy is the half a
    // reader needs: a break with no named remedy is an announcement, not a
    // migration note.
    name: "the document type change breaks implementors, not the code that receives a document",
    tokens: [/TextDocument/, /implement/i, /receive/i, /TextDocument\.create/],
  },
  {
    name: "the package is not published",
    tokens: [/not published/i, /registry/i],
  },
  {
    name: "the registry route is intended and unverified",
    tokens: [/bun add @atusy\/tsudoi/, /deno add npm:@atusy\/tsudoi/, /unverified/i],
  },
  {
    // The claim is that tsudoi CLOSES the generator, never that the author's
    // cleanup COMPLETES: a `finally` that awaits something which never settles
    // never finishes, measured in Sprint 8 and recorded at src/methods.ts.
    // Promising completion would document something the language forbids.
    name: "cleanup runs because tsudoi closes the generator, and completion is not promised",
    tokens: [/closes the generator/i, /finally/, /does not promise/i, /completes/i],
  },
];

for (const fact of facts) {
  test(`the README states: ${fact.name}`, () => {
    expect(statesFact(readme, fact)).toBe(true);
  });

  /**
   * THE REMOVAL HALF, and the only form of it that can fail.
   *
   * `delete a token, the fact goes` is true of every conjunction ever written
   * -- a test that cannot fail, which is the vacuity this whole sprint is
   * about. What CAN fail is this: the fact must have exactly ONE home in the
   * document. Then deleting that section is what loses it, and a fact
   * satisfied incidentally by tokens scattered through some other section
   * fails here instead of passing quietly.
   */
  test(`«${fact.name}» is stated in exactly one section, so deleting it loses it`, () => {
    const homes = sectionsStating(readme, fact);

    expect(homes.map((home) => home.split("\n")[0])).toHaveLength(1);
  });

  /**
   * THE REWORDING HALF: the sentences of every section reordered and the
   * paragraphs reflowed onto one line -- the edit a writer actually makes.
   * The fact must survive it, or the next person to improve the prose is
   * punished for it.
   */
  test(`«${fact.name}» survives having its section reworded`, () => {
    expect(statesFact(reword(readme), fact)).toBe(true);
  });
}

/**
 * CRITERION 4, and the whole of it is that THE README IS THE SOURCE OF THE
 * EXPECTATION. Every value asserted below comes out of the table a reader
 * reads: the exit code, the prefix on stderr, the byte count on stdout. A test
 * holding its own `1` would pass against a README that promised `2`, which is
 * the failure this criterion exists to catch.
 */
for (const runtime of ["bun", "deno"] as const) {
  test(`the documented failure behaviour is what happens under ${runtime}`, async () => {
    const contract = extractFailureContract(readme);
    const outcome = await runQuickstartWithBrokenConfig(
      sequenceFor(extractQuickstart(readme, QUICKSTART_STEPS), runtime),
    );

    expect(outcome.code).toBe(contract.exitCode);
    expect(outcome.stderr.slice(0, contract.stderrPrefix.length)).toBe(contract.stderrPrefix);
    expect(Buffer.byteLength(outcome.stdout, "utf8")).toBe(contract.stdoutBytes);
    // THE PAIR for that absence, permanent: the same counting, on the same
    // stream, through the same helper, DOES see bytes when a command produces
    // them. Without it, an apparatus that counted nothing would satisfy `zero
    // bytes on stdout` on every run forever.
    expect(outcome.stdoutBytesSeenElsewhere).toBeGreaterThan(0);
  });
}

// The failure contract's own vacuity guard, permanent: a table nothing points
// at yields no values, and a contract of no values is satisfied by anything.
test("a README with no failure-contract table states no contract, and says so", () => {
  const unmarked = readme.replace("<!-- failure-contract -->", "");

  expect(() => extractFailureContract(unmarked)).toThrow("no <!-- failure-contract --> marker");
});

test("a failure contract missing a row says which one", () => {
  const rowless = readme.replaceAll(/^\| exit code.*$/gm, "");

  expect(() => extractFailureContract(rowless)).toThrow("exit code");
});
