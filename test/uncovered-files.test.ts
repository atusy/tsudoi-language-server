import { expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

applySuiteDeadline();

/**
 * EVERY TYPESCRIPT FILE THIS CHECKOUT OWNS IS IN SOME COMPILER'S PROGRAM, driven
 * against checkouts built here rather than against this one.
 *
 * WHY THIS IS NOT IN test/workspace-members.test.ts, WHICH SPAWNS THE SAME
 * COMMAND: that file's subject is WHICH PACKAGES the fifth check reaches and
 * what it says about each -- a member's own type error, a directory no list
 * names, a mapping one directory down. This one's subject is a FILE, and the
 * question is asked of the whole checkout rather than per member: the offender
 * the arms below plant is usually in no member at all. Sharing a file would mean
 * one header trying to say both, and the fixtures differ in the one respect that
 * matters here -- these trees are built so that something is uncovered, which
 * every tree over there is written to avoid.
 *
 * THE PROPERTY IS A `WHERE` PROPERTY END TO END, and that decides the shape of
 * every arm below: each violation is a MOVE with no value changed -- a file
 * dragged out of an included directory, an `include` narrowed, a file added
 * under a path no glob reaches. So no arm reads a tsconfig's `include` array or
 * pins that a member includes `src`; an arm doing that would assert WHAT where
 * the property is WHERE, and would stay green through the move it exists to
 * catch.
 *
 * AND EVERY ARM SPAWNS THE CHECK RATHER THAN CALLING THE FUNCTION. The refusal's
 * two readers are private to scripts/workspaces.ts on purpose, so what is
 * measured here is the exit code and the bytes a reader actually gets. The
 * consequence is taken deliberately: on a GREEN run the guard says nothing at
 * all, so no arm can read which programs it found -- that is asserted instead by
 * a tree where a narrower reader must go red.
 */

/** A source file that type-checks, so a red from an arm is never its compiler's. */
const typeChecks = "export const fine: number = 1;\n";

/** What gets planted: it type-checks too, so only its LOCATION can be the fault. */
const probe = "export const probe = 1;\n";

/** A member's source that does NOT type-check, for the one arm about ordering. */
const typeError = 'export const wrong: number = "no";\n';

/**
 * A program's options, carrying NO `paths`, NO `types` -- and NO `skipLibCheck`.
 *
 * THE LAST ABSENCE IS LOAD-BEARING RATHER THAN COPIED. Declaration files leave
 * the subject only where the programs themselves report that they skip checking
 * them, so a tree built from these options is one in which a `.d.ts` IS in the
 * subject -- which is what gives the emitted-declaration arm a subject and what
 * the pair further down flips on purpose.
 */
const programOptions = {
  target: "esnext",
  module: "esnext",
  moduleResolution: "bundler",
  noEmit: true,
  strict: true,
  types: [],
};

/** A member's own check config: its source directory and nothing else. */
const memberTsconfig = JSON.stringify({ compilerOptions: programOptions, include: ["src"] });

/**
 * A member's BUILD config, which emits a declaration beside a JavaScript file.
 *
 * ITS OUTPUT DIRECTORY IS DELIBERATELY NOT CALLED `dist`, and that is the arms'
 * only defence against a reader that knows the WORD rather than the SETTING.
 * MEASURED while it was: with the subtraction replaced by `any path segment
 * equal to dist`, this file and the whole suite stayed green, because the one
 * fixture that emitted anything spelled its `outDir` `dist` and no tree held a
 * `dist` that no program wrote. `out` is a name nothing in the check knows, so
 * a reader not reading the reported configuration cannot find it.
 */
const memberBuildTsconfig = JSON.stringify({
  compilerOptions: {
    ...programOptions,
    declaration: true,
    outDir: "out",
    rootDir: "src",
    noEmit: false,
  },
  include: ["src"],
});

/** Runs the fifth Definition-of-Done check over a root that already exists. */
function check(root: string): Promise<CliResult> {
  return runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);
}

/** Runs it over a throwaway checkout built from CONTENT, and disposes of it. */
async function checkWorkspace(files: Record<string, string>): Promise<CliResult> {
  const root = workspace(files);
  try {
    return await check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * THE ASYMMETRY THIS REPOSITORY LIVES WITH, STAGED AS A THROWAWAY: a member
 * whose config reaches its source directory and nothing else, so anything
 * dropped BESIDE that directory is run by whatever runs it and graded by
 * nobody.
 */
function memberIncludingOnlyItsSource(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": typeChecks,
    ...extra,
  };
}

/** Where the arms below plant, inside the member and outside its source. */
const besideTheSource = join("packages", "late", "probe.ts");

test("a file beside a member whose config includes only its source is reported", async () => {
  const result = await checkWorkspace(memberIncludingOnlyItsSource({ [besideTheSource]: probe }));

  expect(result.stderr).toContain(besideTheSource);
  expect(result.code).not.toBe(0);
});

// THE PAIR FOR THE TWO ARMS ABOVE AND BELOW, and it carries what a bare `exit 1`
// cannot: a check that failed for an apparatus reason -- no compiler, no
// enumerator, a root it could not read -- reddens identically. Only the same
// tree with the plant removed going green says the red came from the location of
// one file.
test("the same member with nothing beside its source passes", async () => {
  const result = await checkWorkspace(memberIncludingOnlyItsSource());

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE ORDERING CLAIM'S SUBJECT, WHICH IT DID NOT HAVE: the refusal runs BEFORE
 * ANY MEMBER IS CHECKED, and until this arm no tree anywhere paired an uncovered
 * file with a member type error -- so moving the call below the type-check loop
 * left every arm in this file and the whole suite green.
 *
 * WHY THE ORDER IS WORTH AN ARM RATHER THAN A COMMENT: a member that type-checks
 * says nothing about the files its config never looked at, so a run that prints
 * member diagnostics first invites a reader to believe the compiler's verdict
 * and disbelieve the refusal underneath it. Here the member's verdict is a
 * FAILURE, which is the harder half -- exit 1 either way, and only WHOSE bytes
 * come back tells the two runs apart.
 *
 * THE TWO STREAMS ARE THE INSTRUMENT AND THEY DO NOT MIX: the refusal is thrown,
 * so it lands on stderr, while `tsc` prints its diagnostics on stdout through
 * the inherited handles. An empty stdout is therefore `no member was reached`,
 * and the pair below proves that stdout is not empty for want of a diagnostic.
 */
test("no member's diagnostics are printed before an uncovered file is refused", async () => {
  const source = join("packages", "late", "src", "index.ts");
  const planted = await checkWorkspace(
    memberIncludingOnlyItsSource({ [source]: typeError, [besideTheSource]: probe }),
  );
  const unplanted = await checkWorkspace(memberIncludingOnlyItsSource({ [source]: typeError }));

  expect(planted.stdout).toBe("");
  expect(planted.stderr).toContain(besideTheSource);
  expect(planted.code).not.toBe(0);
  // THE PAIR, WITHOUT WHICH THE EMPTY STDOUT ABOVE IS UNREADABLE: a member whose
  // error never prints and a member with no error are the same silence.
  expect(unplanted.stdout).toContain("TS2322");
  expect(unplanted.stdout).toContain(source);
  expect(unplanted.code).not.toBe(0);
});

// THE STORY'S OWN MOMENT, WHICH IS A FILE THAT HAS JUST BEEN ADDED: it is
// written after the throwaway is staged, so no index anywhere mentions it. A
// candidate enumeration reading tracked files alone reddens ONE RUN AFTER the
// commit that introduced the hazard, which is the shape this arm exists to
// foreclose -- and the arm above cannot catch it, because everything the
// workspace helper writes is staged.
test("a file that has only just been added, and no index mentions, is reported", async () => {
  const root = workspace(memberIncludingOnlyItsSource());
  try {
    writeFileSync(join(root, besideTheSource), probe);

    const result = await check(root);

    expect(result.stderr).toContain(besideTheSource);
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A CANDIDATE SET THAT HONOURS A PERSON'S IGNORE FILE DIFFERS PER DEVELOPER, and
 * this is the arm that would otherwise measure nothing: an implementation that
 * simply fails to consult the personal ignore file passes it, and so does the
 * one that consults it -- unless the file is PROVED to be in effect on the run
 * that just happened.
 *
 * SO THE CONTROL IS RUN FIRST AND IN THE SAME ENVIRONMENT: git's own enumeration
 * of untracked files, asked exactly as the guard's would ask it WITHOUT the
 * override, must not mention the plant. Only then does the guard reporting it
 * mean the override did the work.
 *
 * MEASURED ON THIS MACHINE, which is why this arm exists at all rather than
 * being a hypothetical: the personal ignore file here hides a file that is
 * tracked and visible in every other checkout of this repository.
 *
 * THE CONFIGURATION IS HANDED TO BOTH CHILDREN EXPLICITLY, not left in this
 * process for them to inherit -- MEASURED on bun 1.3.13: a child spawned after
 * `process.env` is written does not see the change. Inheriting would have left
 * this arm asserting against an environment the check never received, which is
 * the same green as an arm with no subject at all.
 */
test("a personal ignore file does not shrink the subject", async () => {
  const root = workspace(memberIncludingOnlyItsSource());
  try {
    writeFileSync(join(root, besideTheSource), probe);
    writeFileSync(join(root, "personal-ignore"), "probe.ts\n");
    writeFileSync(
      join(root, "personal-gitconfig"),
      `[core]\n\texcludesFile = ${join(root, "personal-ignore")}\n`,
    );
    const env = { ...process.env, GIT_CONFIG_GLOBAL: join(root, "personal-gitconfig") };
    const honoured = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      env,
    });

    const result = await runCommand(
      "bun run scripts/typecheck-workspaces.ts",
      repoRoot,
      [root],
      env,
    );

    expect(honoured.stdout).not.toContain("probe.ts");
    expect(result.stderr).toContain(besideTheSource);
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE FIRST OF THE TWO SUBTRACTIONS' BOUNDARIES: a directory whose name merely
 * BEGINS with `node_modules`, which nobody installed and this checkout owns.
 *
 * BOTH SUBTRACTIONS ARE MATCHES AGAINST A PATH AND SO BOTH CAN BE WIDENED BY ONE
 * TOKEN, which is the class this arm and the one below the emitter cover -- and
 * MEASURED, both widenings applied AT ONCE left this file and the suite green,
 * so neither had a subject anywhere. Here the segment split becomes a substring
 * test and the stranger filter starts swallowing a directory somebody wrote.
 *
 * IT PAIRS WITH THE UNPLANTED MEMBER TREE ABOVE, which is the same fixture with
 * nothing dropped into it and is silent.
 */
test("a directory whose name merely begins with node_modules is not read as installed", async () => {
  const ours = join("packages", "late", "node_modules_local", "x.ts");
  const result = await checkWorkspace(memberIncludingOnlyItsSource({ [ours]: probe }));

  expect(result.stderr).toContain(ours);
  expect(result.code).not.toBe(0);
});

/**
 * A ROOT WHOSE CONFIG DECLARES NO `include` AT ALL, which is the arm that
 * decides WHICH READER answers `is this file in the program`.
 *
 * MEASURED, AND IT IS WHY THE JSON GLOBS ARE NOT THE READER: the default include
 * a compiler applies to a config with no `include` does NOT reach a directory
 * whose name begins with a dot. A hand-written expansion of that wildcard says
 * the opposite, calls the plant covered, and this arm is the only one that
 * notices.
 */
function rootDeclaringNoInclude(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ compilerOptions: programOptions }),
    "src/root.ts": typeChecks,
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": typeChecks,
    ...extra,
  };
}

/** Where that arm plants: a directory the default include cannot see. */
const underADotDirectory = join(".tooling", "probe.ts");

test("a file under a dot directory is reported, where the default include does not reach", async () => {
  const result = await checkWorkspace(rootDeclaringNoInclude({ [underADotDirectory]: probe }));

  expect(result.stderr).toContain(underADotDirectory);
  expect(result.code).not.toBe(0);
});

// THE PAIR, and it is what makes the arm above about the DOT rather than about
// the tree: the same root, the same member, the same absence of an `include` --
// and the check is silent. A guard reporting everything it enumerated would fail
// here and pass above.
test("the same root with nothing under a dot directory passes", async () => {
  const result = await checkWorkspace(rootDeclaringNoInclude());

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

/**
 * A FILE NO `include` REACHES AND AN IMPORT DOES, which is the arm the
 * closure-reading implementation fails.
 *
 * WHY BEING IMPORTED IS NOT COVERAGE, STATED AS A REFUSAL RATHER THAN AN
 * OVERSIGHT: such a file is checked for exactly as long as somebody imports it,
 * and the day that import is deleted it stops being checked with nothing said.
 * The durable property is that a program's own inputs reach the file, so the
 * reader takes the program's ROOT FILES and not what resolution dragged in
 * behind them. The cost is named: this arm reports a file that tsc really is
 * checking today.
 */
function memberImporting(directory: string, specifier: string): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": `import { probe } from "${specifier}";\nexport const used: number = probe;\n`,
    [join("packages", "late", directory, "probe.ts")]: "export const probe: number = 1;\n",
  };
}

test("a file reached only by an import is reported", async () => {
  const result = await checkWorkspace(memberImporting("unreached", "../unreached/probe"));

  expect(result.stderr).toContain(join("packages", "late", "unreached", "probe.ts"));
  expect(result.code).not.toBe(0);
});

// THE PAIR IS THE SAME FILE MOVED UNDER THE INCLUDED PATH, which is the whole
// property in one edit: nothing about the file's CONTENT changes between these
// two runs, and the colour follows where it sits.
test("the same file moved under the included path passes", async () => {
  const result = await checkWorkspace(memberImporting(join("src", "reached"), "./reached/probe"));

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

/**
 * A MEMBER SPLIT ACROSS TWO CONFIGS, WHICH MUST STAY GREEN -- and it is here for
 * ONE degenerate implementation, the one that is green on this repository and on
 * every other arm in this file: A READER THAT FINDS PROGRAMS BY THE LITERAL NAME
 * `tsconfig.json`.
 *
 * NO TRACKED FILE IN THIS CHECKOUT IS COVERED ONLY BY A BUILD CONFIG, so nothing
 * that exists gives that implementation a subject; this tree is built to be the
 * subject. `src/only-in-build.ts` is reached by the BUILD config alone, and a
 * reader that skipped it would report a file that is compiled and published.
 *
 * THE EMITTED ARTIFACT IS IGNORED HERE, deliberately and by a `.gitignore` this
 * tree carries: that is the shape of a real checkout, and it keeps this arm's
 * red owned by the split rather than shared with the emitted-declaration arm
 * below, whose tree carries no such file.
 */
function memberSplitAcrossTwoConfigs(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    ".gitignore": "out/\n",
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": JSON.stringify({
      compilerOptions: programOptions,
      include: ["test"],
    }),
    "packages/late/tsconfig.build.json": memberBuildTsconfig,
    "packages/late/src/only-in-build.ts": typeChecks,
    "packages/late/test/thing.ts": typeChecks,
    ...extra,
  };
}

test("a member split across a check config and a build config passes", async () => {
  const result = await checkWorkspace(memberSplitAcrossTwoConfigs());

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

// THE PLANTED PAIR FOR THE ARM ABOVE, without which that green is satisfied by a
// guard that reports nothing at all on a tree holding two configs.
test("the same split member with a file outside both configs is reported", async () => {
  const result = await checkWorkspace(memberSplitAcrossTwoConfigs({ [besideTheSource]: probe }));

  expect(result.stderr).toContain(besideTheSource);
  expect(result.code).not.toBe(0);
});

/**
 * A MEMBER THAT EMITS A DECLARATION, AND NO `.gitignore` TO HIDE IT -- so the
 * emitted `out/index.d.ts` is untracked, unignored, and in no program's inputs.
 *
 * A FILE THE COMPILER WROTE IS NOT A FILE THE COMPILER MUST INCLUDE, which is
 * the whole of the subtraction this arm defends: the check BUILDS before it
 * reads, so without it every throwaway tree that builds would redden -- and the
 * emitted declaration would be reported to a reader who cannot act on it.
 * MEASURED with the subtraction removed: this arm reports
 * packages/emitter/out/index.d.ts.
 *
 * ON THIS REPOSITORY THE SUBTRACTION IS A NO-OP, since every `dist/` here is
 * ignored -- which is exactly why it is defended by a throwaway rather than by a
 * comment.
 */
function memberEmittingItsDeclaration(): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/emitter/package.json": JSON.stringify({ name: "emitter" }),
    "packages/emitter/tsconfig.json": memberTsconfig,
    "packages/emitter/tsconfig.build.json": memberBuildTsconfig,
    "packages/emitter/src/index.ts": typeChecks,
  };
}

test("a member's emitted declaration is not reported as uncovered", async () => {
  const result = await checkWorkspace(memberEmittingItsDeclaration());

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE OTHER HALF OF THAT SUBTRACTION, WITHOUT WHICH IT IS AN EXEMPTION LIST: a
 * file somebody WROTE and committed under the same output directory.
 *
 * `THE COMPILER WROTE IT` IS THE CLAIM, AND THE INDEX IS WHAT CHECKS IT. Excusing
 * every path under a declared `outDir` excuses a directory rather than an
 * artifact -- for a program that need not emit at all, and for a hand-written
 * file the compiler has never touched. MEASURED on the shipped subtraction, in a
 * tree whose member check config carried `noEmit` beside `outDir: "../../vendor"`
 * and a committed `vendor/probe.ts` in no program's list: exit 0 and zero bytes,
 * and exit 1 naming that file the moment the `outDir` was deleted. One config
 * key, one silenced directory, in a check whose message says there is no list to
 * exempt a file from it.
 *
 * BOTH READINGS COME OFF ONE RUN, which is what makes this a discriminator and
 * not a second copy of the arm above: the emitted declaration in the same
 * directory must STAY unreported, so an implementation that repairs this by
 * dropping the subtraction reddens on the second assertion.
 */
test("a committed file under a program's output directory is reported, the emitted one not", async () => {
  const result = await checkWorkspace({
    ...memberEmittingItsDeclaration(),
    [join("packages", "emitter", "out", "shim.ts")]: probe,
  });

  expect(result.stderr).toContain(join("packages", "emitter", "out", "shim.ts"));
  expect(result.stderr).not.toContain(join("packages", "emitter", "out", "index.d.ts"));
  expect(result.code).not.toBe(0);
});

/**
 * A DIRECTORY MERELY CALLED `dist`, WHICH NO PROGRAM IN THIS TREE WRITES -- the
 * other side of the same question, and the one that says the subtraction reads a
 * SETTING rather than a name everyone happens to use.
 *
 * THE PLANT IS UNTRACKED ON PURPOSE, which is what keeps this arm's subject its
 * own: a committed file under an output directory is already refused one arm
 * above, for the index rather than for the path, so a tracked plant here would
 * be reported whatever the directory is called and would measure nothing new.
 * Untracked, it is exempt exactly when a reader thinks `dist` means output.
 *
 * IT IS A `WHERE` PROPERTY LIKE THE REST: nothing about the file changes between
 * this arm and the emitted declaration beside it -- both untracked, both in no
 * program's roots -- and the only difference is that one directory is in a
 * program's reported configuration and the other is a name.
 */
/**
 * THE SECOND BOUNDARY, AND IT IS THE SAME ONE-TOKEN WIDENING: a SIBLING whose
 * name begins with the output directory's, which the prefix reaches the moment
 * the separator comes off. `out` and `outbox` share five characters and nothing
 * else -- one is a program's reported output, the other is somebody's source.
 *
 * UNTRACKED FOR THE REASON THE `dist` ARM BELOW IS: a committed file under an
 * output directory is refused for the index rather than for the path, so a
 * tracked plant here could not tell the two boundaries apart.
 */
test("a sibling of the output directory whose name merely extends it is reported", async () => {
  const root = workspace(memberEmittingItsDeclaration());
  const sibling = join("packages", "emitter", "outbox", "y.ts");
  try {
    mkdirSync(join(root, "packages", "emitter", "outbox"), { recursive: true });
    writeFileSync(join(root, sibling), probe);

    const result = await check(root);

    expect(result.stderr).toContain(sibling);
    expect(result.stderr).not.toContain(join("packages", "emitter", "out", "index.d.ts"));
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a file under a directory merely named dist, which no program writes, is reported", async () => {
  const root = workspace(memberEmittingItsDeclaration());
  const decoy = join("packages", "emitter", "dist", "decoy.ts");
  try {
    mkdirSync(join(root, "packages", "emitter", "dist"), { recursive: true });
    writeFileSync(join(root, decoy), probe);

    const result = await check(root);

    expect(result.stderr).toContain(decoy);
    expect(result.stderr).not.toContain(join("packages", "emitter", "out", "index.d.ts"));
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * WHETHER A DECLARATION FILE IS IN THE SUBJECT AT ALL, READ FROM THE PROGRAMS'
 * OWN REPORTED SETTING AND NOT FROM ITS NAME.
 *
 * WHY `.d.ts` IS THE ONE EXCLUSION: with library checking skipped -- which every
 * config in this repository sets -- a declaration file is IN a program's inputs
 * and its body is checked by nothing, so membership is the wrong question to ask
 * about it. MEASURED: a local `.d.ts` carrying two errors gives exit 0 with the
 * setting on and exit 1 naming both with it off.
 *
 * SO THE EXCLUSION IS CONDITIONAL, AND THE PAIR IS THE POINT: flip the setting
 * off and the same file RE-ENTERS the subject. A guard that simply never
 * mentions a `.d.ts` has a NAME in it where this has a property.
 *
 * THE TWO PROGRAMS ARE SET SEPARATELY, AND THAT IS WHAT MAKES THE PAIR MEAN
 * `ONCE ONE OF THEM STOPS`. One options object fed to both builds only all-on
 * and all-off trees, and on those `every program skips` and `some program skips`
 * are the same reading -- MEASURED: with the condition weakened to `some`,
 * nothing in this file or in the suite reddened. The tree below is therefore
 * MIXED, with the ROOT the one that stops skipping, so the two runs differ by
 * exactly one flag on exactly one config and the weaker reading goes silent.
 */
function declarationNoProgramIncludes(skipping: {
  readonly root: boolean;
  readonly member: boolean;
}): Record<string, string> {
  const optionsFor = (skips: boolean) =>
    skips ? { ...programOptions, skipLibCheck: true } : programOptions;
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: optionsFor(skipping.root),
      exclude: ["packages"],
    }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": JSON.stringify({
      compilerOptions: optionsFor(skipping.member),
      include: ["src"],
    }),
    "packages/late/src/index.ts": typeChecks,
    [join("packages", "late", "types", "legacy.d.ts")]: "declare const legacy: number;\n",
  };
}

test("a declaration file no program includes is left alone while lib checking is skipped", async () => {
  const result = await checkWorkspace(declarationNoProgramIncludes({ root: true, member: true }));

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

test("the same declaration file is reported once a program stops skipping lib checking", async () => {
  const result = await checkWorkspace(declarationNoProgramIncludes({ root: false, member: true }));

  expect(result.stderr).toContain(join("packages", "late", "types", "legacy.d.ts"));
  expect(result.code).not.toBe(0);
});

/**
 * A CONFIG THAT IS NEITHER THE ROOT'S NOR ANY MEMBER'S, which is what makes
 * `every tracked config is a program` a property rather than a description of
 * this repository's layout.
 *
 * AND THE OTHER HALF THE PAIR MEASURES: the root program in this tree matches
 * NOTHING -- it excludes both directories that hold TypeScript -- and the
 * compiler answers that with a diagnostic and a NON-ZERO EXIT. A reader that
 * treated a failed run as a reason to abort would redden here and in about
 * twenty existing arms; one that treated it as `this config covers everything`
 * would go green with the plant. It contributes zero.
 */
function configOutsideEveryMember(): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages", "tools"] }),
    "tools/tsconfig.json": JSON.stringify({ compilerOptions: programOptions, include: ["src"] }),
    "tools/src/only-here.ts": typeChecks,
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": typeChecks,
  };
}

test("a config outside the root and outside every member still covers its own files", async () => {
  const result = await checkWorkspace(configOutsideEveryMember());

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE SAME TREE WITH THAT CONFIG GONE FROM THE WORKTREE AND STILL IN THE INDEX,
 * which is the one shape where `the compiler could not read this` and `this
 * program covers nothing` are the same observation.
 *
 * IT MUST BE REFUSED BY NAME. Swallowing the failure and calling the program
 * empty is not merely quieter -- it is LOUDER AND WRONG: every file that config
 * covered becomes an offender, and the run answers a broken config with a list
 * of innocent sources. So the second assertion is the load-bearing one.
 *
 * THE NAME NO LONGER SAYS `TRACKED`, AND THAT IS THE REPAIR RATHER THAN A LOSS.
 * Being in the index is how this tree REACHES the state and is not what the arm
 * measures: unlinking the file leaves the entry, so nothing here separates an
 * unreadable TRACKED config from an unreadable untracked one, and the arm is
 * green under a reader that never asked. What defends the tracked-only
 * enumeration is the stray-config arm below, where an unstaged config is the
 * whole subject.
 */
test("a config the compiler cannot read is refused by name, not read as covering nothing", async () => {
  const root = workspace(configOutsideEveryMember());
  try {
    unlinkSync(join(root, "tools", "tsconfig.json"));

    const result = await check(root);

    expect(result.stderr).toContain(join("tools", "tsconfig.json"));
    expect(result.stderr).not.toContain("only-here.ts");
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE HAZARD THE TRACKED-ONLY PROGRAM ENUMERATION EXISTS FOR, WHICH NOTHING
 * PLANTED UNTIL NOW: a stray uncommitted config claiming the whole tree. Taking
 * untracked configs as programs would let one mark every file covered -- a
 * silent, permanent green that nobody has to write down and nobody can see.
 *
 * TWO RUNS OVER ONE TREE, AND THE SECOND IS WHAT MAKES THE FIRST MEAN ANYTHING.
 * `the plant is reported` is satisfied by a config that could never have covered
 * it -- a typo in the include, a config the compiler could not read -- so the
 * same config is then STAGED and nothing else moves. It goes green, which is the
 * proof that what the first run refused was the config's not being committed and
 * not the config's contents.
 *
 * THE PLANT STAYS UNTRACKED THROUGHOUT, so the second run is also the asymmetry
 * itself in one reading: an untracked CANDIDATE is a hazard the moment it exists,
 * where an untracked PROGRAM counts for nothing until somebody commits it.
 */
test("a config that is not staged does not mark the tree covered", async () => {
  const root = workspace(memberIncludingOnlyItsSource());
  try {
    writeFileSync(join(root, besideTheSource), probe);
    writeFileSync(
      join(root, "tsconfig.stray.json"),
      JSON.stringify({ compilerOptions: programOptions, include: ["**/*"] }),
    );

    const stray = await check(root);
    // THE SAME OVERRIDE THE HELPER STAGES UNDER, for the same reason: a personal
    // ignore file matching this name would leave the control silently unstaged
    // and the run below green for the reason it is meant to refute.
    execFileSync("git", ["-c", "core.excludesFile=/dev/null", "add", "tsconfig.stray.json"], {
      cwd: root,
      stdio: "pipe",
    });
    const committed = await check(root);

    expect(stray.stderr).toContain(besideTheSource);
    expect(stray.code).not.toBe(0);
    expect(committed.stderr).toBe("");
    expect(committed.code).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A ROOT THAT IS NOT A CHECKOUT AT ALL.
 *
 * `I FOUND NO FILES` AND `I WAS GIVEN NO WAY TO FIND THEM` MUST NOT PRINT THE
 * SAME THING -- the asymmetry `declaredMembers` already keeps for `workspaces`,
 * applied to the enumerator this refusal depends on. An implementation that read
 * a failed enumeration as an empty one would exit 0 over a tree where nothing
 * was inspected, which is the quietest possible way for this check to stop
 * meaning anything.
 */
test("a root that is not a checkout is refused rather than read as holding nothing", async () => {
  const root = workspace(memberIncludingOnlyItsSource());
  try {
    rmSync(join(root, ".git"), { recursive: true, force: true });

    const result = await check(root);

    expect(result.stderr).toContain(root);
    expect(result.stderr).toContain("git");
    // NOT A FILE REPORT: the same tree with its repository intact is green, so
    // anything named here would be a file this guard invented.
    expect(result.stderr).not.toContain(join("src", "index.ts"));
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * The allowance this one arm needs, MEASURED rather than guessed: it is the only
 * arm whose root is THIS repository, so it pays for a full build of three
 * packages before the refusal it is about can speak.
 *
 * A CONTROL THAT REPORTS THE MACHINE IS WORSE THAN A SLOW ONE, which
 * test/workspace-members.test.ts already records at length: were this to time
 * out under load, it would read as `the guard refused this repository`, the one
 * conclusion it exists to make unavailable.
 */
const oneArmBuildsThisWholeRepository = 120_000;

/**
 * THIS REPOSITORY HAS NO SUCH FILE, and this is the weakest arm here -- kept for
 * what it pairs with rather than for its own colour.
 *
 * WHAT IT CANNOT SAY, stated because an empty answer and a reader that opened
 * nothing are the same observation: nothing in a green run reports how many
 * files were examined. What stands behind it is the SAME MEASUREMENT reddening
 * on other roots -- every planted arm above is this command reading a checkout
 * with one file out of place -- and the arm below it, which makes a failure to
 * enumerate loud instead of empty. The reading on THIS root, taken by hand and
 * recorded in the sprint: two files planted at two sites uncovered by different
 * mechanisms, both reported, both green when removed.
 *
 * BY SPRINT 9'S RULE ITS EMPTINESS CAN NEVER BE THE FIRST THING TO FAIL: were a
 * file here uncovered, this arm and the fifth check itself would redden
 * together, and the check names the file.
 */
test(
  "this repository holds no TypeScript file that no program includes",
  async () => {
    const result = await check(repoRoot);

    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
  },
  oneArmBuildsThisWholeRepository,
);
