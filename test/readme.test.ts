import { expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { repoRoot } from "./helpers/spawn.ts";
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
 * -- the extraction harness executes the five `quickstart` blocks and this is
 * not one of them, so no run reaches it. What stands in for it is
 * test/helpers/install.ts, which packs and installs the handler package's own
 * tarball into every consumer -- so that harness observes whether the config
 * works when the handler is INSTALLED, and never whether this line names the
 * right thing to install. Telling a reader to install a package they do not
 * need would leave every other assertion in this suite green.
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
 * satisfied by deleting the command's arguments altogether.
 *
 * THE HANDLER PACKAGE IS WHAT IT MUST NAME, and `wordnet` is what it must NOT
 * have to: the config imports `@atusy/tsudoi-hover-wordnet` by specifier, and
 * that package declares the dictionary itself, so a reader who installs the
 * handler is done. A README that still named the dictionary here would be
 * telling them to install a transitive dependency by hand -- true today, wrong
 * the moment the handler changes what it reads from.
 */
test("the README's examples install names the handler package the config imports", () => {
  expect(extractExamplesInstall(readme)).toMatch(/hover-wordnet/);
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
 * ONE RUNTIME, and the licence is the MEASUREMENT that both runtimes take one
 * artifact, one install and one file path -- not that two would be
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
    // WHAT THE ANNOTATION BUYS, not merely that the quickstart carries one. A
    // token the document carries without explaining is a lateral move on the
    // parameter authors would otherwise have to name and then ignore -- so the
    // README owes the REASON, and this entry is what holds it to that.
    //
    // Nothing type-checks an author's own config against `TsudoiConfigFactory`
    // -- src/config.ts reaches the type through a cast from `unknown` -- so the
    // annotation is the whole of the defence on the documented route, and the
    // sentence explaining it is load-bearing rather than decorative.
    name: "annotating the factory const is what reports a config shape change",
    tokens: [/TsudoiConfigFactory/, /annotat/i, /shape changes/i],
  },
  {
    name: "deno must be on PATH or `bun test` fails",
    tokens: [/deno/i, /PATH/, /bun test/, /fails/i],
  },
  {
    // AN ARTIFACT PRECONDITION RATHER THAN AN ENVIRONMENT ONE, which is the
    // distinction that puts it in its own entry: deno-on-PATH and `bun install`
    // are things a reader's MACHINE must have, where this is about a file the
    // repository generates. `dist/` is gitignored and generated, and
    // bunfig.toml builds it before any test file loads, so a reader runs no
    // `bun run prepack` of their own.
    //
    // THE SECOND TOKEN PAIR IS THE ONE THAT MATTERS, and it is here because the
    // automatic build is NOT total: bun discovers bunfig.toml relative to the
    // CURRENT WORKING DIRECTORY and does not search upward, so `bun test`
    // started anywhere but the repository root runs the whole suite with no
    // build. MEASURED on that route, with dist/ deliberately stale: the suite
    // gives TWO failures, and the ONLY staleness-specific one is the comparison
    // in package-shape.test.ts. That is why that comparison stands rather than
    // being deleted as redundant, and why the README must keep saying where to
    // stand.
    //
    // NO TOKEN BELOW ASKS THE README FOR A NUMBER, deliberately: the suite
    // grows and any count the document carried would go false on its own. The
    // reading belongs in a comment, and even here as a SHAPE rather than a
    // size, for exactly that reason -- MEASURED on a dist/-less `bun test`:
    // failures spread BROADLY across the suite rather than at one assertion,
    // and tests that never run at all.
    name: "`bun test` builds dist/ itself, and only from the repository root",
    tokens: [/dist\//, /not committed/i, /automatic/i, /repository root/i],
  },
  {
    // THE ENTRY ABOVE IS ABOUT WHAT THE BUILD COVERS; THIS ONE IS ABOUT WHAT IT
    // DOES NOT, and they are separate because a reader who takes the first at
    // its word runs a Definition-of-Done command and gets a failure the document
    // never mentioned. MEASURED on a clone with `bun install` run and nothing
    // built: `tsc --noEmit` reports TS2307 at examples/tsudoi.config.ts naming
    // `@atusy/tsudoi-hover-wordnet`, because the config reaches the handler by
    // PACKAGE SPECIFIER and a workspace member publishes dist/ with no source
    // arm.
    //
    // THE REMEDY IS A TOKEN AND THE DIAGNOSTIC IS A TOKEN, both, because either
    // alone leaves a reader somewhere they cannot act: a document naming the
    // failure and no command tells them they are stuck, and a document naming a
    // command they have no reason to run is not read until after they are.
    //
    // WHY NO `paths` MAPPING IS ALSO OWED, and it is the sentence that stops the
    // next reader from supplying one: a mapping would resolve a member's imports
    // through the ROOT'S map and report success for a member whose own
    // resolution is broken, which is the false green the members' exclusion from
    // the root check exists to make unconstructible. That reason is asserted
    // from the code's side in test/package-shape.test.ts and driven by
    // test/workspace-members.test.ts; here it is owed to the person holding the
    // error message.
    name: "`tsc --noEmit` on an unbuilt checkout fails, which command clears it, and why no mapping",
    tokens: [
      /tsc --noEmit/,
      /TS2307/,
      /@atusy\/tsudoi-hover-wordnet(?![A-Za-z0-9._-])/,
      /scripts\/typecheck-workspaces\.ts/,
      /paths/,
    ],
  },
  {
    // Named because it is ASSUMED: the install step fetches tsudoi's own
    // dependency on a cold cache, and a reader without a network gets a failure
    // the README would otherwise have told them nothing about.
    name: "the first install needs a network unless bun's cache is warm",
    tokens: [/network/i, /cache/i, /vscode-languageserver-protocol/],
  },
  {
    // Named because a reader meets this type as something they RECEIVE and
    // finds out only in their own test suite that it is also something they may
    // have to BUILD. The four obvious members are the shape everyone reaches
    // for, and stopping there type-errors at a site nothing else in this
    // document prepares them for.
    //
    // `receive` IS DELIBERATELY NOT A TOKEN, though the word is available: it
    // sits in this section's own heading, so it would be matched by a section
    // that had lost the paragraph entirely and would assert nothing about the
    // prose this entry exists to defend.
    //
    // `TextDocument\.create` is in the tokens because the remedy is the half a
    // reader needs: a named gap with no named remedy is a warning rather than
    // documentation.
    name: "a hand-written mock must implement the whole TextDocument, and TextDocument.create builds one",
    tokens: [/TextDocument/, /implement/i, /mock/i, /TextDocument\.create/],
  },
  {
    // NAMED BECAUSE THE CLAIM IT REPLACES WENT FALSE AND NOTHING NOTICED. The
    // document said tsudoi hands a reader `the real thing`, and it had not been
    // true since the store began publishing a sealed forwarder: upstream's
    // `update` refuses anything its own `create` did not build, so a reader who
    // took that sentence at its word met a throw inside a live handler.
    //
    // THE COMPILE TOKEN IS THE HALF A READER CANNOT INFER. `DocumentView` and
    // upstream's interface carry the same seven members, so tsc accepts the call
    // -- and a warning about a runtime throw that omits `nothing stops you at
    // compile time` reads as a mistake the compiler would have caught.
    //
    // `applyEdits` IS IN THE TOKENS BECAUSE THE LINE HAS TWO SIDES: a reader told
    // only what fails learns to avoid the package, which is the opposite of what
    // this section is for.
    name: "an upstream helper that only reads works, TextDocument.update throws, and neither is a compile error",
    tokens: [/TextDocument\.update/, /applyEdits/, /throws/i, /type-check/i],
  },
  {
    // NAMED BECAUSE IT WENT FALSE AND NOTHING NOTICED. The document said every
    // protocol name the examples use comes from `@atusy/tsudoi-language-server/types`, and it
    // had not been true since the surface was split by origin: `CompletionParams`
    // comes from `deps/protocol` and `CompletionItem`, `CompletionItemKind`,
    // `MarkupContent`, `Position`, `WorkspaceFolder` and `DiagnosticSeverity`
    // from `deps/types`. src/types.ts says the opposite of what the README said,
    // in so many words, and neither file was reading the other.
    //
    // WHY THE FALSE HALF SURVIVED A READING: the parenthetical about
    // `CompletionItemKind` being used as a VALUE was true, and a reader who
    // checks that nods past the sentence carrying it. That is why the value
    // token is in this list -- it is the true half, and it must stay attached to
    // the corrected one rather than drift back into a claim about `./types`.
    //
    // ALL THREE `deps/` SUBPATHS, INCLUDING THE ONE NO EXAMPLE IMPORTS:
    // `deps/textdocument` is published and was named nowhere in the document, so
    // a reader following the README could not learn the type of the thing every
    // handler is handed.
    name: "protocol names come from the deps subpaths, and tsudoi's own from ./types",
    tokens: [/deps\/protocol/, /deps\/types/, /deps\/textdocument/, /CompletionItemKind/, /value/i],
  },
  {
    name: "the package is not published",
    tokens: [/not published/i, /registry/i],
  },
  {
    // THE RIGHT BOUNDARY IS WHAT MAKES THESE TOKENS A CONTROL RATHER THAN A
    // SHAPE. Every other command this file matches is also EXECUTED, so a wrong
    // spelling fails by running; these two cannot be, because the package is
    // unpublished and running them is the thing that does not work yet. This
    // fact is their only spelling control, and an unbounded pattern gives that
    // control away: this package's name is a PREFIX of every name that extends
    // it, so a README telling a reader to install `...-language-server-wrong`
    // satisfies all three tokens -- MEASURED.
    //
    // THE COMPLETE INLINE COMMAND WOULD BE STRICTER AND IS DECLINED: the
    // subject here is the NAME, and a token carrying the backticks and the
    // words around them reddens for a rewording that left the name exactly
    // right -- which is the punishment `survives having its section reworded`
    // exists to refuse.
    name: "the registry route is intended and unverified",
    tokens: [
      /bun add @atusy\/tsudoi-language-server(?![A-Za-z0-9._-])/,
      /deno add npm:@atusy\/tsudoi-language-server(?![A-Za-z0-9._-])/,
      /unverified/i,
    ],
  },
  {
    // The claim is that tsudoi CLOSES the generator, never that the author's
    // cleanup COMPLETES: a `finally` that awaits something which never settles
    // never finishes -- MEASURED, and recorded at src/methods.ts. Promising
    // completion would document something the language forbids.
    //
    // WHERE THE `finally` GOES IS DELIBERATELY NOT A TOKEN HERE. A completion
    // handler IS the generator -- one body, and no level to be one above it --
    // so a `finally` cannot be written outside the work it cleans up after. A
    // token demanding that warning would force the README to caution a reader
    // against a mistake nobody can make, and A TOKEN NOTHING IN THE DOCUMENT
    // SHOULD SAY IS A TEST THAT FORCES FALSE PROSE.
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
   * -- a test that cannot fail, which is the vacuity this file exists against.
   * What CAN fail is this: the fact must have exactly ONE home in the
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
 * THE HALF NO `facts` ENTRY CAN DO, and it is worth saying which is which: a
 * fact reddens when someone edits the README, never when someone edits the
 * PACKAGE. The claim that went false above went false because the exports map
 * was split by origin and this document was not touched -- an edit that no
 * amount of token matching over prose could have caught, because the prose did
 * not change.
 *
 * SO THE TWO DOCUMENTS ARE COMPARED DIRECTLY, and in BOTH directions by one
 * equality: a subpath added to package.json that the README never mentions
 * reddens here, and so does a README naming a subpath that is not published.
 * test/package-shape.test.ts already pins the map's shape; nothing else
 * connects it to what a reader is told.
 *
 * THE CLI PATH IS NOT A SUBPATH, and the lookbehind is what says so:
 * `node_modules/@atusy/tsudoi-language-server/dist/cli.js` is a path INTO the installed package
 * that the quickstart tells a reader to run, reached by walking the tree rather
 * than through the exports map -- which is precisely why it must not be
 * expected to appear there.
 */
const publishedExports = Object.keys(
  (
    JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    }
  ).exports,
).sort();

function subpathsNamed(markdown: string): string[] {
  return [
    ...new Set(
      [...markdown.matchAll(/(?<!node_modules\/)@atusy\/tsudoi-language-server\/([\w/-]+)/g)].map(
        (match) => `./${match[1] ?? ""}`,
      ),
    ),
  ].sort();
}

test("the published subpaths the README names are exactly the ones package.json exports", () => {
  expect(subpathsNamed(readme)).toEqual(publishedExports);
});

/**
 * THE PERMANENT PAIR, and the direction it probes is the one that actually
 * happened: a README that stops naming a published subpath. Without it, an
 * extractor that had quietly stopped matching anything would satisfy the
 * equality above only by accident -- and the assertion would be reporting that
 * two empty lists agree.
 */
test("a README that stopped naming one of them no longer matches the exports map", () => {
  const narrowed = readme.replaceAll(
    "@atusy/tsudoi-language-server/deps/textdocument",
    "@atusy/tsudoi-language-server/types",
  );

  expect(subpathsNamed(narrowed)).not.toEqual(publishedExports);
});

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
