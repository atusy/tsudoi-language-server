import { expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { declaredMembers, handlerMembers } from "../scripts/workspaces.ts";
import { frameworkRoot, repoRoot, runCommand } from "./helpers/spawn.ts";
import {
  extractExamplesInstall,
  extractFailureContract,
  extractHandlerPack,
  type RunStep,
  extractQuickstart,
  installedPath,
  invocationOf,
  type ReadmeFact,
  startStep,
  statesFact,
  reword,
  sectionsStating,
  type QuickstartStep,
  QUICKSTART_STEPS,
  readMemberReadme,
  readReadme,
  runQuickstart,
  runQuickstartWithBrokenConfig,
  sequenceFor,
  UNPUBLISHED,
} from "./helpers/readme.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

await requireRuntime(denoRuntime);

const readme = readReadme();

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
 * THE PAIRED POSITIVE CONTROL, permanent rather than a one-time perturbation: an
 * extractor that finds nothing makes `every extracted command succeeds`
 * VACUOUSLY TRUE, and the README then rots as if the tests held their own copy.
 *
 * The probe is THIS README with its markers deleted, not a hand-written string:
 * that is the actual way the mechanism breaks -- someone edits the document and
 * the markers go with the edit -- where a hand-written probe would prove only
 * that the regex fails on prose it was never pointed at.
 */
test("a README whose markers are gone extracts nothing, and says so", () => {
  const unmarked = readme.replaceAll("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(unmarked, QUICKSTART_STEPS)).toThrow(
    `README quickstart: expected ${String(QUICKSTART_STEPS)} marked blocks, found 0`,
  );
});

test("a README missing one marked step extracts fewer, and says so", () => {
  const short = readme.replace("<!-- quickstart", "<!-- was-quickstart");

  expect(() => extractQuickstart(short, QUICKSTART_STEPS)).toThrow(
    `found ${String(QUICKSTART_STEPS - 1)}`,
  );
});

/**
 * The working directory is stated TWICE -- once in the marker the test obeys,
 * once in the prose the reader obeys -- which is the duplication this whole file
 * exists against, reintroduced by the extraction mechanism itself.
 */
test("a directory named only in a marker is refused", () => {
  const hidden = readme.replaceAll("in=tsudoi-language-server", "in=elsewhere");

  expect(() => extractQuickstart(hidden, QUICKSTART_STEPS)).toThrow("elsewhere");
  // WHICH REFUSAL FIRED, read rather than inferred from the token being echoed:
  // the arm below perturbs the same attribute and must produce a DIFFERENT
  // message, and neither is worth anything if both are satisfied by any throw
  // mentioning the string that was substituted in.
  expect(() => extractQuickstart(hidden, QUICKSTART_STEPS)).toThrow("no prose a reader sees");
});

/**
 * THE TWO MARKER FAMILIES SPEAK DIFFERENT LANGUAGES: a `handler-pack` token is
 * relative to the CHECKOUT, a `quickstart` token names a directory beside the
 * reader's own project in a staged parent. So a quickstart token equal to a
 * member's directory name is read one way by the harness and the other way by a
 * human -- AND EVERY OTHER ASSERTION IN THIS FILE STAYS GREEN, the harness
 * staging the sibling and running the command there successfully. The prose
 * check cannot see it either: a colliding name is IN the prose, which is what
 * makes the collision plausible.
 *
 * THE MEMBER IS ENUMERATED AND NOT NAMED, so this arm keeps its subject through
 * every rename and every package added under packages/.
 */
test("a quickstart marker naming a workspace member's directory is refused, naming both", () => {
  const [member] = declaredMembers(repoRoot);
  if (member === undefined) {
    throw new Error("no workspace member for this collision to be about");
  }
  const colliding = basename(member);
  const perturbed = readme.replaceAll("in=my-language-server", `in=${colliding}`);

  expect(() => extractQuickstart(perturbed, QUICKSTART_STEPS)).toThrow(`in=${colliding}`);
  expect(() => extractQuickstart(perturbed, QUICKSTART_STEPS)).toThrow(
    "sibling of the reader's own project",
  );
  expect(() => extractQuickstart(perturbed, QUICKSTART_STEPS)).toThrow(relative(repoRoot, member));
});

/**
 * EVERY HANDLER PACKAGE'S OWN README, ENUMERATED FROM THE WORKSPACE
 * CONFIGURATION -- the document a registry page shows, and the only one a
 * stranger who installed that package can read.
 *
 * HANDLERS AND NOT MEMBERS: the framework ships no README of its own, ruled
 * rather than overlooked -- the sole documented route to its tarball IS the root
 * README's quickstart, and two of the facts demanded below are unstatable by the
 * framework about itself.
 */
const memberReadmes = handlerMembers(repoRoot).map((member) => ({
  name: basename(member),
  markdown: readMemberReadme(member),
}));

// The pair for every loop below: a loop over an empty list is green.
test("there are handler packages whose own READMEs these claims are about", () => {
  expect(memberReadmes.length).toBeGreaterThan(0);
});

/**
 * A DUPLICATE WOULD FAIL NOTHING ELSE: the per-member loops below read the
 * member's own file, so a second copy in the root README is found by none of
 * them. What a returning copy costs is that the two diverge silently, which is
 * the whole reason the route lives in the member's document.
 */
test("the root README states no handler pack or install command of its own", () => {
  expect(readme).not.toContain("<!-- handler-pack");
  expect(readme).not.toContain("<!-- examples-install -->");
  // The pair: a document that had lost its markers altogether satisfies the two
  // absences above and tells a reader nothing about the packages at all.
  for (const member of memberReadmes) {
    expect(readme).toContain(`packages/${member.name}/README.md`);
  }
});

/**
 * A SOURCE-TEXT ASSERTION AND NOT A RUN, the block being declared `read` in
 * `consumers`. What stands in for running it is test/helpers/install.ts, which
 * packs and installs every member's own tarball into every consumer -- so that
 * harness observes whether the config works when the handlers are INSTALLED, and
 * never whether this line names the right thing to install. Telling a reader to
 * install a package they do not need leaves every other assertion in this suite
 * green.
 *
 * ITS OWN TEST, not a second assertion on the one below, because the two hazards
 * are different and either can hide the other: naming a package the config does
 * not need, and naming none of the ones it does.
 */
test("no member's install command names a protocol package", () => {
  for (const member of memberReadmes) {
    expect(`${member.name}: ${extractExamplesInstall(member.markdown)}`).not.toMatch(
      /vscode-languageserver-protocol/,
    );
  }
});

/**
 * THE PAIR for the absence above: without it, deleting the command's arguments
 * altogether satisfies that one.
 *
 * DERIVED FROM THE DIRECTORY rather than spelled: a needle written here would be
 * a third place the package is named, and the one that goes stale at a rename.
 * What the command must NOT have to name is a runtime dependency of that package
 * -- a README telling a reader to install one by hand is true today and wrong
 * the moment the handler changes what it reads from.
 */
test("each member's install command names that member's own tarball", () => {
  for (const member of memberReadmes) {
    expect(`${member.name}: ${extractExamplesInstall(member.markdown)}`).toContain(
      `${member.name}.tgz`,
    );
  }
});

// The extractor's own vacuity guard, permanent: both assertions above are
// satisfied by a command nobody found, one of them trivially.
test("a README with no examples-install marker states no install command, and says so", () => {
  for (const member of memberReadmes) {
    const unmarked = member.markdown.replace("<!-- examples-install -->", "");

    expect(() => extractExamplesInstall(unmarked)).toThrow("expected 1 marked block, found 0");
  }
});

/**
 * WHY IT IS WORTH RUNNING RATHER THAN MATCHING: the pack COMPILES the package, so
 * a wrong directory, a wrong subcommand, a wrong flag and a build that cannot
 * resolve are all one failure here.
 *
 * IN THE REAL MEMBER DIRECTORY AND NOT A STAGED COPY, deliberately: the
 * prerequisite this command needs is a link INSIDE the checkout, and a staged
 * tree would have to reproduce it -- which is supplying the very thing being
 * asked about.
 *
 * AND THE FILE IT PRODUCES IS THE ONE THE NEXT COMMAND NAMES: the pack and the
 * install are two commands in two directories joined by a PATH, and nothing but
 * this compares them.
 */
/**
 * NO TWO DOCUMENTED PACK ROUTES LAND ON ONE PATH.
 *
 * WHAT THIS DOES NOT SEE, measured rather than reasoned: a route naming another
 * package's default filename with --filename, beside a bare route in that
 * package's own directory. Both land on one path and this stays GREEN, because
 * the bare route's landing place is modelled by a placeholder rather than read.
 *
 * WHAT A COLLISION COSTS, and it is why this is worth an arm rather than a note:
 * the root artifact is every tracked file including this suite, with NO dist/ at
 * all, and the READMEs' install line reads the path a member pack writes. A
 * reader who packed the root last installs the workspace and gets no framework.
 *
 * READ FROM THE DOCUMENTS rather than spelled here: the commands come from the
 * same extractors the arms above use, so a document that changes its filename
 * changes what this compares.
 */
test("no two documented pack routes write to the same path", () => {
  // The quickstart's steps are relative to the PARENT of the checkout, so its
  // pack step's directory is stripped back to this repository before joining.
  const packs = extractQuickstart(readReadme(), QUICKSTART_STEPS)
    .filter((step): step is RunStep => step.kind === "run" && step.command.includes("pm pack"))
    .map((step) => ({ where: step.dir.split("/").slice(1).join("/"), command: step.command }));
  const routes = [
    ...packs,
    ...memberReadmes.map((member) => {
      const pack = extractHandlerPack(member.markdown);
      return { where: pack.dir, command: pack.command };
    }),
  ];
  expect(routes.length).toBeGreaterThan(1);

  const landings = routes.map(({ where, command }) => {
    const named = /--filename\s+(\S+)/.exec(command)?.[1];
    // Without --filename bun writes beside the manifest it packed; with it, at
    // the workspace root. MEASURED, and it is the whole reason the READMEs'
    // install path resolves.
    // A bare pack writes `<name>-<version>.tgz` beside the manifest it packed --
    // MEASURED -- but the name is the manifest's, not the directory's, so this
    // models it by directory alone. TWO BARE ROUTES IN ONE DIRECTORY COLLIDE AND
    // ARE SEEN; a bare route colliding with a --filename that spells its name is
    // NOT, and that gap is the arm's own residue.
    return named === undefined ? join(repoRoot, where, "<bare pack>") : join(repoRoot, named);
  });

  expect(landings.length).toBe(new Set(landings).size);
});

test("each member's pack command runs, and writes the file its own install names", async () => {
  for (const member of memberReadmes) {
    const pack = extractHandlerPack(member.markdown);
    // A READER'S PATH -- relative to their own project, which sits beside the
    // checkout -- so it is resolved the way they would resolve it, through the
    // checkout's own directory name.
    //
    // THE SAME EXPRESSION THE ACCOUNT'S PROJECTION IS, AND NOT A SECOND SPELLING
    // OF IT: `consumers` names this as the part of the install block its reading
    // is about, and two spellings could disagree about the subject.
    const installed = installedPath(extractExamplesInstall(member.markdown));
    const prefix = `../${basename(repoRoot)}/`;
    if (!installed.startsWith(prefix)) {
      throw new Error(
        `${member.name} install: ${installed} does not reach the checkout at ${prefix}`,
      );
    }
    const tarball = join(repoRoot, installed.slice(prefix.length));
    const alsoRemoved = join(repoRoot, pack.dir, basename(tarball));
    // REFUSED BEFORE THE COMMAND RUNS, which is what makes the existence check
    // below a reading of THIS run rather than of the directory: a tarball left
    // by a hand-run pack, or by an earlier run that died before its cleanup,
    // satisfies `the pack wrote the file the install names` with the pack having
    // written nothing. AND THE COST IS NOT ONLY A FALSE GREEN: the cleanup below
    // then deletes a file this run did not create.
    //
    // BOTH PATHS, because both are removed, and the undocumented one is the one
    // the cleanup reaches when the document is wrong.
    for (const stale of [tarball, alsoRemoved]) {
      if (existsSync(stale)) {
        throw new Error(
          `${stale} exists before ${member.name}'s pack runs: this reading would pass on a file it did not write, and the cleanup would delete it. Remove it and run again.`,
        );
      }
    }
    try {
      const result = await runCommand(pack.command, join(repoRoot, pack.dir));

      // THE EXIT CODE AND NOT AN EMPTY STREAM: bun echoes the `prepack` line it
      // is about to run on stderr even when everything works. The whole stream
      // rides on the assertion anyway, so a failure explains itself instead of
      // reporting a number that moved.
      expect(`${member.name} exit ${String(result.code)} | ${result.stderr}`).toContain(
        `${member.name} exit 0 |`,
      );
      // The pair that keeps the line above from passing on a compiler that
      // reported and continued.
      expect(result.stderr).not.toContain("error TS");
      // NAMED rather than asserted as a boolean, so the failure says which path
      // was looked for instead of `expected true`.
      expect(existsSync(tarball) ? tarball : `${tarball} was never written`).toBe(tarball);
      // AND NOT IN THE MEMBER, which is the half these documents state and
      // nothing graded: each says the tarball does not land in the directory the
      // command runs in. Asserting only that it IS at the root passes unchanged
      // if bun wrote both places, and the document's whole point is that the
      // install line one directory up can find it.
      const inMember = join(repoRoot, pack.dir, basename(tarball));
      expect(existsSync(inMember) ? `${inMember} was written too` : "only at the root").toBe(
        "only at the root",
      );
    } finally {
      // BOTH CANDIDATE LOCATIONS, and the second is not belt-and-braces: when
      // the README names the wrong path this test is RED, and a cleanup that
      // followed the document would leave the real tarball behind -- an
      // untracked file arriving with a failure.
      rmSync(tarball, { force: true });
      rmSync(join(repoRoot, pack.dir, basename(tarball)), { force: true });
    }
  }
}, 120_000);

// The vacuity guard, permanent: an extractor that found nothing would make the
// run above a test of no command.
test("a README with no handler-pack marker states no pack command, and says so", () => {
  for (const member of memberReadmes) {
    const unmarked = member.markdown.replace(/<!--\s*handler-pack\b[^>]*-->/, "");

    expect(() => extractHandlerPack(unmarked)).toThrow("expected 1 marked block, found 0");
  }
});

test("a README whose pack marker names a directory the prose does not says so", () => {
  for (const member of memberReadmes) {
    const moved = member.markdown.replace(
      /<!--\s*handler-pack\s+in=\S+\s*-->/,
      "<!-- handler-pack in=packages/elsewhere -->",
    );

    expect(() => extractHandlerPack(moved)).toThrow("packages/elsewhere");
  }
});

/**
 * The commands are not mirrored here: they are the README's own bytes, run in
 * order, in a staged environment that supplies NOTHING the README asks the
 * reader to do. A checkout with its dependencies installed is the one thing
 * staged, and the README names it as a prerequisite rather than a step.
 *
 * Both runtimes, because a route only bun can take looks healthy from bun.
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
 * THE COMPLETENESS SWEEP, AND ITS REAL FUNCTION IS NOT WHAT IT LOOKS LIKE. It
 * reads as a check that no documented step is USELESS. What it proves is that
 * THE ENVIRONMENT IS BARE: an omitted step whose absence still produced a server
 * would mean something other than the documented command was supplying it, and
 * the intact run above would then be a test of the harness. Extraction catches a
 * STALE instruction; only this catches a MISSING one.
 *
 * ONE RUNTIME, and the licence is that both runtimes take one artifact, one
 * install and one file path -- not that two would be expensive. If that route
 * ever diverges, this basis is void and the sweep owes both runtimes.
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
 * COMPARED TWO-SIDEDLY. The README's flags are read out of its own bytes; the
 * suite's come from `denoRuntime` IMPORTED from the helper every other test
 * spawns with, not from parsing that helper's source -- so the compared value is
 * the one that really runs, and no second parsing mechanism enters needing a
 * vacuity guard of its own.
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
 * env read rather than tsudoi wanting their network.
 *
 * `--allow-read --allow-env` completing the handshake is required to be a
 * HISTORICAL claim on a named version: the suite spawns `-A` and nothing keeps a
 * narrower set working, so a present-tense promise is one the suite cannot
 * defend, and `untested` is the token that holds the document to it.
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
 * THE READER IS STIPULATED: someone who was not here. Every prerequisite that
 * reader is assumed to have is named below, because an unnamed prerequisite
 * cannot be perturbed and is therefore not defended.
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
    // WHAT THE ANNOTATION BUYS, not merely that the quickstart carries one:
    // nothing type-checks an author's own config against `TsudoiConfigFactory`,
    // packages/tsudoi-language-server/src/config.ts reaching the type through a
    // cast from `unknown`, so the annotation is the whole of the defence on the
    // documented route.
    name: "annotating the factory const is what reports a config shape change",
    tokens: [/TsudoiConfigFactory/, /annotat/i, /shape changes/i],
  },
  {
    name: "deno must be on PATH or `bun test` fails",
    tokens: [/deno/i, /PATH/, /bun test/, /fails/i],
  },
  {
    // AN ARTIFACT PRECONDITION RATHER THAN AN ENVIRONMENT ONE, which is what
    // puts it in its own entry: deno-on-PATH and `bun install` are things a
    // reader's MACHINE must have, where this is about a file the repository
    // generates.
    //
    // `repository root` IS THE TOKEN THAT MATTERS, because the automatic build
    // is NOT total: bun discovers bunfig.toml relative to the CURRENT WORKING
    // DIRECTORY and does not search upward, so `bun test` started anywhere else
    // runs the whole suite with no build.
    //
    // NO TOKEN HERE ASKS THE README FOR A NUMBER, deliberately: the suite grows,
    // and any count the document carried would go false on its own.
    name: "`bun test` builds dist/ itself, and only from the repository root",
    tokens: [/dist\//, /not committed/i, /automatic/i, /repository root/i],
  },
  {
    // THE ENTRY ABOVE IS ABOUT WHAT THE BUILD COVERS; THIS ONE IS ABOUT WHAT IT
    // DOES NOT, and they are separate because a reader who takes the first at
    // its word runs a Definition-of-Done command and gets a failure the document
    // never mentioned.
    //
    // THE REMEDY IS A TOKEN AND THE DIAGNOSTIC IS A TOKEN, both, because either
    // alone leaves a reader somewhere they cannot act: a document naming the
    // failure and no command tells them they are stuck, and a document naming a
    // command they have no reason to run is not read until after they are.
    //
    // `paths` IS A TOKEN BECAUSE THE REFUSAL IS OWED TO THE PERSON HOLDING THE
    // ERROR MESSAGE: a mapping would resolve a member's imports through the
    // ROOT'S map and report success for a member whose own resolution is broken,
    // which is the false green the members' exclusion exists to make
    // unconstructible.
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
    // THE ONE PLACE A CONSUMER-FACING FALSEHOOD CAN BE CORRECTED:
    // `peerDependenciesMeta.optional` is in the handler's manifest, which SHIPS,
    // and the account of why it is there is in that package's own test, which
    // `files: ["dist"]` keeps out of the tarball.
    //
    // THE PEER AND THE FLAG ARE ONE ENTRY BECAUSE THEY ARE ONE READING. `peer`
    // alone tells a reader to install tsudoi; `optional` alone tells them not
    // to bother. A document carrying either without the other is worse than one
    // carrying neither.
    //
    // THE FAILURE TEXT IS A TOKEN so the correction is findable by someone who
    // already hit it and is searching for the string in front of them: the
    // install itself exits 0 with no warning, and the throw arrives at load.
    name: "tsudoi is a peer the handler does not install, and `optional` does not mean otherwise",
    tokens: [/peer/i, /optional/, /Cannot find module/, /unpublished/i],
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
    // have to BUILD.
    //
    // `receive` IS DELIBERATELY NOT A TOKEN, though the word is available: it
    // sits in this section's own heading, so it would be matched by a section
    // that had lost the paragraph entirely.
    //
    // `TextDocument\.create` is in the tokens because the remedy is the half a
    // reader needs: a named gap with no named remedy is a warning rather than
    // documentation.
    name: "a hand-written mock must implement the whole TextDocument, and TextDocument.create builds one",
    tokens: [/TextDocument/, /implement/i, /mock/i, /TextDocument\.create/],
  },
  {
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
    // WHY A FALSE HALF OF THIS SURVIVED A READING ONCE: the parenthetical about
    // `CompletionItemKind` being used as a VALUE was true, and a reader who
    // checks that nods past the sentence carrying it. That is why the value
    // token is in this list -- it is the true half, and it must stay attached to
    // the corrected one rather than drift back into a claim about `./types`.
    //
    // ALL THREE `deps/` SUBPATHS, INCLUDING THE ONE NO EXAMPLE IMPORTS:
    // `deps/textdocument` is published, and a reader following a document that
    // never named it could not learn the type of the thing every handler is
    // handed.
    name: "protocol names come from the deps subpaths, and tsudoi's own from ./types",
    tokens: [/deps\/protocol/, /deps\/types/, /deps\/textdocument/, /CompletionItemKind/, /value/i],
  },
  // SHARED WITH test/optional-peer-premise.test.ts RATHER THAN SPELLED TWICE:
  // two spellings of one premise would let the two disagree about which section
  // states it.
  UNPUBLISHED,
  {
    // WHAT THIS DOCUMENT PROMISES ABOUT ITSELF, owed because the promise is the
    // reason a reader trusts a command here over one in a blog post. A promise
    // that covers more than it does is worse than none, since it is the thing
    // that stops a reader checking.
    //
    // `never run` IS THE LOAD-BEARING TOKEN: `these are executed` is the
    // sentence that was false once already, and it goes false again the moment a
    // block is accounted for rather than run. The document owes the exception,
    // not the rule.
    name: "every block here is executed or accounted for, the exception is named, and the handler routes live elsewhere",
    tokens: [
      /extracted from this README/i,
      /executed/i,
      /never run/i,
      /packages\/[a-z-]+\/README\.md/,
    ],
  },
  {
    // THE RIGHT BOUNDARY IS WHAT MAKES THESE TOKENS A CONTROL RATHER THAN A
    // SHAPE. Every other command this file matches is also EXECUTED, so a wrong
    // spelling fails by running; these two cannot be, the package being
    // unpublished. This fact is their only spelling control, and an unbounded
    // pattern gives it away: this package's name is a PREFIX of every name that
    // extends it, so a README telling a reader to install
    // `...-language-server-wrong` satisfies all three tokens.
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
    // cleanup COMPLETES: a `finally` awaiting something that never settles never
    // finishes, and promising completion would document what the language
    // forbids.
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

/**
 * WHAT EVERY HANDLER PACKAGE'S OWN README OWES, IN THE SAME SHAPE AND FOR A
 * DIFFERENT READER: the root document's facts are about this REPOSITORY, these
 * about a PACKAGE, and the reader is a stranger who has installed one and can
 * see nothing else.
 *
 * OVER MEMBERS AS A CLASS, so a package added under packages/ owes the same
 * things with no list edited.
 */
const memberFacts: ReadmeFact[] = [
  {
    // THE REMEDY AND THE DIAGNOSTIC ARE BOTH TOKENS: a document naming the
    // failure and no command leaves a reader stuck, and a command they have no
    // reason to run is not read until after they are.
    //
    // WHY THE EXECUTING TEST DOES NOT COVER THIS: it runs the pack in a checkout
    // where the link is already there, that being the state of any tree the
    // suite has touched. The prerequisite is prose nothing runs, which is
    // exactly the case a fact exists for.
    name: "packing this package needs a link `bun install` does not create",
    tokens: [/TS2307/, /scripts\/typecheck-workspaces\.ts/, /bun pm pack/, /link/i],
  },
  {
    // `never run` IS THE LOAD-BEARING TOKEN and the reason this is one entry
    // rather than two: `these are executed` alone is the sentence that was false
    // once already, and it goes false again the moment a command is added
    // outside the extraction. The document owes the exception, not the rule.
    //
    // THE THIRD TOKEN NAMES THE RESIDUE. Everything a subject leaves out is
    // unchecked BY DECLARATION, declared where the reader is; the install row's
    // subject is the PATH, and a member document saying `what is checked is its
    // text` -- the whole command -- satisfies `executed` and `never run` both.
    // Neither caught it, which is why a third token is what does.
    name: "which of this package's commands are run and which are only read",
    tokens: [/executed/i, /never run/i, /not the command/i],
  },
  {
    // THE FALSEHOOD THE MANIFEST SHIPS, CORRECTED WHERE ITS READER IS: the same
    // reading the root document owes a maintainer, owed again because a stranger
    // who installed the package sees only this file.
    //
    // THE PEER AND THE FLAG ARE ONE ENTRY BECAUSE THEY ARE ONE READING. `peer`
    // alone tells a reader to install tsudoi; `optional` alone tells them not to
    // bother. `unpublished` is here because it is the PREMISE: the day it stops
    // holding, the flag is a lie with nothing bought by it.
    name: "tsudoi is a peer this package does not install, and `optional` does not mean otherwise",
    tokens: [/peer/i, /optional/, /Cannot find module/, /unpublished/i],
  },
  {
    // THE TOKEN IS DELIBERATELY GENERIC WHERE THE SENTENCE IS NOT: each
    // package's bound is its own, so a shared needle would be satisfied by
    // whichever member happened to carry it. What this asks is that the document
    // has a section for it at all, in exactly one place; the per-member
    // sentences are pinned off the TARBALL elsewhere.
    name: "the package states what bounds it",
    tokens: [/What bounds it/i, /rather than/i],
  },
];

for (const fact of memberFacts) {
  for (const member of memberReadmes) {
    test(`${member.name}'s README states: ${fact.name}`, () => {
      expect(statesFact(member.markdown, fact)).toBe(true);
    });

    test(`«${fact.name}» has exactly one home in ${member.name}'s README`, () => {
      expect(
        sectionsStating(member.markdown, fact).map((home) => home.split("\n")[0]),
      ).toHaveLength(1);
    });

    test(`«${fact.name}» survives ${member.name}'s README being reworded`, () => {
      expect(statesFact(reword(member.markdown), fact)).toBe(true);
    });
  }
}

for (const fact of facts) {
  test(`the README states: ${fact.name}`, () => {
    expect(statesFact(readme, fact)).toBe(true);
  });

  /**
   * THE REMOVAL HALF, AND THE ONLY FORM OF IT THAT CAN FAIL. `delete a token,
   * the fact goes` is true of every conjunction ever written. What CAN fail is
   * uniqueness, and it fails exactly when a fact is satisfied incidentally by
   * tokens scattered through a section that does not state it.
   */
  test(`«${fact.name}» is stated in exactly one section, so deleting it loses it`, () => {
    const homes = sectionsStating(readme, fact);

    expect(homes.map((home) => home.split("\n")[0])).toHaveLength(1);
  });

  /**
   * THE REWORDING HALF: a fact that dies here was matched on sentence structure
   * rather than on tokens, and punishes the next person to improve the prose.
   */
  test(`«${fact.name}» survives having its section reworded`, () => {
    expect(statesFact(reword(readme), fact)).toBe(true);
  });
}

/**
 * THE SUBJECT IS THE MANIFEST CARRYING THE PUBLISHED SURFACE, WHICH IS NOT THE
 * CHECKOUT ROOT'S -- and reading the wrong one breaks this file by THROWING AT
 * MODULE LOAD rather than by failing an assertion. `Object.keys(undefined)` on a
 * root that has no `exports` takes the comparison below AND its permanent pair
 * down with it, so the file reports one error where two tests should speak.
 */
const publishedExports = Object.keys(
  (
    JSON.parse(readFileSync(join(frameworkRoot, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    }
  ).exports,
).sort();

/**
 * THE CLI PATH IS NOT A SUBPATH, and the lookbehind is what says so:
 * `node_modules/@atusy/tsudoi-language-server/dist/cli.js` is a path INTO the
 * installed package that the quickstart tells a reader to run, reached by
 * walking the tree rather than through the exports map.
 */
function subpathsNamed(markdown: string): string[] {
  return [
    ...new Set(
      [...markdown.matchAll(/(?<!node_modules\/)@atusy\/tsudoi-language-server\/([\w/-]+)/g)].map(
        (match) => `./${match[1] ?? ""}`,
      ),
    ),
  ].sort();
}

/**
 * THE HALF NO `facts` ENTRY CAN DO: a fact reddens when someone edits the README,
 * never when someone edits the PACKAGE. This document's claim about the surface
 * went false once because the exports map was split by origin and the prose was
 * not touched -- an edit no amount of token matching over prose can catch.
 *
 * BOTH DIRECTIONS BY ONE EQUALITY: a subpath added to package.json that the
 * README never mentions reddens here, and so does a README naming a subpath that
 * is not published.
 */
test("the published subpaths the README names are exactly the ones package.json exports", () => {
  expect(subpathsNamed(readme)).toEqual(publishedExports);
});

/**
 * THE PERMANENT PAIR: without it, an extractor that had quietly stopped matching
 * anything satisfies the equality above by reporting that two empty lists agree.
 */
test("a README that stopped naming one of them no longer matches the exports map", () => {
  const narrowed = readme.replaceAll(
    "@atusy/tsudoi-language-server/deps/textdocument",
    "@atusy/tsudoi-language-server/types",
  );

  expect(subpathsNamed(narrowed)).not.toEqual(publishedExports);
});

/**
 * THE README IS THE SOURCE OF THE EXPECTATION: every value asserted below comes
 * out of the table a reader reads, because a test holding its own `1` passes
 * against a README that promised `2`.
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
    // them. Without it, an apparatus that counted nothing satisfies `zero bytes
    // on stdout` on every run forever.
    expect(outcome.stdoutBytesSeenElsewhere).toBeGreaterThan(0);
  });
}

// The failure contract's own vacuity guard, permanent: a contract of no values
// is satisfied by anything.
test("a README with no failure-contract table states no contract, and says so", () => {
  const unmarked = readme.replace("<!-- failure-contract -->", "");

  expect(() => extractFailureContract(unmarked)).toThrow("no <!-- failure-contract --> marker");
});

test("a failure contract missing a row says which one", () => {
  const rowless = readme.replaceAll(/^\| exit code.*$/gm, "");

  expect(() => extractFailureContract(rowless)).toThrow("exit code");
});
