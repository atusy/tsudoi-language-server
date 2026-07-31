import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot, runCommand } from "./helpers/spawn.ts";
import { mirrorInstalledDependencies, runTsc } from "./helpers/typecheck.ts";

/**
 * Decisions that have to live in package.json and tsconfig.json, asserted
 * here because THOSE FILES CANNOT CARRY THEIR OWN REASONS: JSON has no
 * comments, and oxfmt sorts an unknown key like `//exports` to the tail of
 * the file where a reader meets it last. A file that carries a decision and a
 * test that carries its reason is the arrangement this project settled on; a
 * prose note would drift, and this fails when someone violates it.
 */

/** The repo's tsconfig.json, with the given keys replaced, in a throwaway tree. */
async function typeCheckWith(
  config: Record<string, unknown>,
  dist: string,
): Promise<number | null> {
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-tsconfig-"));
  try {
    mirrorInstalledDependencies(dir);
    mkdirSync(join(dir, "src"));
    mkdirSync(join(dir, "dist"));
    writeFileSync(join(dir, "src", "ok.ts"), "export const ok = 1;\n");
    writeFileSync(join(dir, "dist", "broken.d.ts"), dist);
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify(config));
    const result = await runTsc(dir);
    return result.code;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The repo's own bytes, read at test time -- never a copy that could drift.
 *
 * AND THIS LINE IS WHY NEITHER TSCONFIG MAY CARRY A COMMENT. `JSON.parse`
 * REJECTS JSONC, so a `//` in tsconfig.json or tsconfig.build.json fails this
 * file at load rather than at an assertion -- however happily tsc itself reads
 * it. THE CONSEQUENCE IS A RULE ABOUT WHERE REASONS LIVE: `put the decision at
 * the site where the violating edit is made` is UNAVAILABLE for
 * either config, exactly as it is for package.json, so a TEST holds their
 * reasons and the file holds only the setting. The next person to reach for a
 * comment there should read this instead of discovering it as a red.
 *
 * REPLACING THE READER WOULD LIFT THE CONSTRAINT and is not proposed: a JSONC
 * parser here would let the two configs carry their own reasons, and it would
 * also make this file's readings differ from what any other JSON consumer of
 * those files sees. It is recorded as a choice rather than a limit.
 */
const repoTsconfig = JSON.parse(readFileSync(join(repoRoot, "tsconfig.json"), "utf8")) as Record<
  string,
  unknown
>;

// A SYNTAX error, and it took measuring to learn why: the repo sets
// skipLibCheck, which suppresses TYPE errors inside a .d.ts even when the file
// is in the program. A broken type here would make both halves below exit 0
// and the pair would prove nothing.
const brokenDeclaration = "export declare const broken: = ;\n";

// `tsc --noEmit` is a DoD check and dist/ is generated, so the DoD must not
// grade the compiler's own output: a build artifact failing the typecheck of
// the sources that produced it is a puzzle with no useful answer.
test("the repo's tsconfig keeps dist out of the program", async () => {
  expect(await typeCheckWith(repoTsconfig, brokenDeclaration)).toBe(0);
});

// The pair, and it is not decoration: without `exclude` this same tree fails,
// which is what makes the green above evidence rather than a coincidence.
// (Measured separately with --listFiles: 8 emitted files enter the program.)
test("the same tree fails once the dist exclusion is removed", async () => {
  const { exclude: _removed, ...withoutExclude } = repoTsconfig;

  expect(await typeCheckWith(withoutExclude, brokenDeclaration)).toBe(1);
});

/**
 * The build config's own bytes, read at test time like the one above it -- and
 * under the same constraint, which is stated there: this reader is `JSON.parse`,
 * so tsconfig.build.json may not carry a comment either.
 */
const buildTsconfig = JSON.parse(
  readFileSync(join(repoRoot, "tsconfig.build.json"), "utf8"),
) as Record<string, unknown>;

/** The settings half of each, which is where every claim below reads from. */
const repoOptions = repoTsconfig.compilerOptions as Record<string, unknown>;
const buildOptions = buildTsconfig.compilerOptions as Record<string, unknown>;

/** The shipped manifest's own bytes, read at test time. */
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as Record<
  string,
  unknown
>;

/**
 * What a compiler run at `cwd` RESOLVED and what it MATCHED: every specifier
 * against the files that answered it, beside the `paths` patterns that took any
 * specifier at all.
 *
 * `--traceResolution` IS WHAT MAKES A READING OF THIS POSITIVE, and the two
 * cheaper instruments are named because both were tried. AN EXIT CODE CANNOT
 * SEPARATE SOURCE FROM ARTIFACT: each answers at 0 with nothing printed, so the
 * absence of an error says only that SOMETHING answered. `--listFiles` names
 * files without saying which specifier reached them, and src/ is in the program
 * by glob whether or not a specifier resolved there at all.
 */
async function traceResolutions(cwd: string): Promise<{
  answers: Map<string, Set<string>>;
  matched: Set<string>;
}> {
  const { output } = await runTsc(cwd, ["--traceResolution"]);
  const answers = new Map<string, Set<string>>();
  for (const [, specifier, file] of output.matchAll(
    /Module name '(.+?)' was successfully resolved to '(.+?)'/g,
  )) {
    const answered = answers.get(specifier) ?? new Set<string>();
    answered.add(file);
    answers.set(specifier, answered);
  }

  return {
    answers,
    matched: new Set(
      [...output.matchAll(/matched pattern '(.+?)'/g)].map(([, pattern]) => pattern),
    ),
  };
}

/**
 * The specifier a consumer writes for each published subpath, against the file
 * this manifest's own `condition` arm names for it -- `default` for source and
 * `types` for the built declaration.
 *
 * BOTH SIDES OF EVERY COMPARISON BELOW COME FROM `exports`, AND NEITHER FROM THE
 * MAPPING THEY GRADE, which is what keeps an expectation from following the
 * fault: a key that has stopped matching still names ./src/*.ts, so a file
 * derived from the mapping would be exactly as wrong as the resolution and the
 * two would agree.
 *
 * THROWS where an arm is missing, for the reason every extractor in this project
 * does: `undefined` on both sides compares equal, and a subpath that names no
 * source is the state this is read for.
 */
function publishedArm(condition: string): Record<string, string> {
  const name = packageJson.name;
  const map = packageJson.exports;
  if (typeof name !== "string" || typeof map !== "object" || map === null) {
    throw new Error("this manifest carries no name and exports map to read a subpath out of");
  }
  const files: Record<string, string> = {};
  for (const [subpath, arm] of Object.entries(map as Record<string, unknown>)) {
    const file = (arm as Record<string, unknown>)[condition];
    if (typeof file !== "string") {
      throw new Error(`${subpath} carries no \`${condition}\` arm for this comparison to expect`);
    }
    // Joined rather than kept as written: the map spells a relative import and
    // a compiler reports a path, and `./src/types.ts` is not that path.
    files[`${name}${subpath.slice(1)}`] = join(file);
  }
  return files;
}

/**
 * WHICH OF THE TWO TSCONFIGS MAY CARRY THE MAPPING, and why it is exactly one.
 *
 * `tsc --noEmit` is a DoD check, and without a mapping it resolves the
 * examples' `@atusy/tsudoi-language-server/*` imports through package.json's exports map to
 * dist/ -- THE BUILT ARTIFACT, which only `bun test`'s preload rebuilds. The two
 * therefore disagree exactly when the published surface has moved: MEASURED in
 * both directions -- a false GREEN beside failures spread BROADLY across the
 * suite, and a false RED against a type the tree does not contain. A mapping
 * THAT MATCHES makes this repository's own check read source, and a stale dist/
 * cannot reach it for as long as one does -- which is a precondition rather than
 * a foreclosure, and is why the assertions below watch it.
 *
 * tsconfig.build.json GETS NONE, and that is the half this pair exists for.
 * It `include`s src alone, which never imports the bare specifier, so a mapping
 * there would resolve nothing -- and it is the one of the two configs that
 * TRAVELS INTO THE PACKING STAGE, where inheriting it would type-check what we
 * publish against sources we do not ship. What the stage copies is pinned in
 * test/installed-specifier.test.ts; this is the other half of the same guard.
 *
 * WHAT IS ASSERTED OF THAT CONFIG IS THE ABSENT KEY AND NOT A RESOLUTION, and
 * the stronger-looking probe is DECLINED ON A MEASUREMENT rather than on cost:
 * run its compilerOptions verbatim over a probe under src/ importing all four
 * subpaths and every one answers from ./src/*.ts. `rootDir` TOGETHER WITH
 * `outDir` MAKES tsc REDIRECT A DECLARATION TARGET BACK TO THE INPUT THAT EMITS
 * IT -- the trace reads `Matched 'exports' condition 'types'` naming
 * ./dist/types.d.ts and then answers src/types.ts -- and it fires with dist/
 * ABSENT, which is every clone that has only run `bun install`. Drop either key
 * and the same probe answers ./dist/types.d.ts, measured, which is what pins the
 * cause. So a build config that resolved these subpaths would resolve them TO
 * SOURCE, and the property that actually holds there is about the program's
 * CONTENTS -- src imports no bare specifier, so nothing resolves at all --
 * rather than about its resolver. The name below says the key because the key is
 * what a build config can be held to.
 *
 * WHAT IS ASSERTED IS WHICH FILE ANSWERED, AND NOT HOW THE MAPPING IS SPELLED,
 * because a key that has stopped matching DOES NOT FAIL: the specifier falls
 * through to the exports map and lands in dist/ AT EXIT 0, so the check grades a
 * built artifact against sources nobody compiled it from. MEASURED on this
 * config with the key misspelled, at 38b8709: `tsc --noEmit` exits 0 and prints
 * nothing, and all four subpaths are answered by dist/*.d.ts.
 *
 * AN EQUALITY ON THE MAPPING'S LITERAL CONTENT IS THE CHEAPER ASSERTION AND IT
 * IS NARROWER THAN THE NAME OF THIS TEST: it catches the key being deleted --
 * which is covered anyway, since a deleted key sends the same subpaths to the
 * same artifact -- and it is silent about a key that is present, well-formed and
 * matching nothing. It also spells today's key a second time, so the day the
 * package is renamed there are two places to carry it and one test to tell you
 * which. Both sides here come from `exports` instead, and an arm added there is
 * covered with nothing edited.
 *
 * WHAT AN ARM NOTHING IMPORTS COSTS, named so the next person to add one does
 * not meet it as a mystery: a subpath no file in this program asks for is
 * answered by nothing, which reads here as an empty list against its source and
 * REDDENS. That is the honest colour -- this check verifies the arms it
 * resolves and can say nothing about one it never sees -- and it does not arrive
 * alone. MEASURED, on a fifth arm added to the map: TWO tests redden, this one
 * and the published-surface equality, which is where adding an arm is already a
 * decision rather than a convenience.
 */
test("the repo's type check resolves the published subpaths to source, and the build config declares no paths mapping", async () => {
  const sources = publishedArm("default");
  const { answers } = await traceResolutions(repoRoot);
  // BOTH SIDES RESOLVED, for the reason the compiler-pinning test below states
  // about its own two: a checkout reached through a link is answered by the path
  // the compiler walked, and an expectation built from the path this file was
  // loaded by is a claim about the same file under another name.
  const answered = Object.fromEntries(
    Object.keys(sources).map((specifier) => [
      specifier,
      [...(answers.get(specifier) ?? [])].map((file) => realpathSync(file)).sort(),
    ]),
  );

  expect(answered).toEqual(
    Object.fromEntries(
      Object.entries(sources).map(([specifier, file]) => [
        specifier,
        [realpathSync(join(repoRoot, file))],
      ]),
    ),
  );
  expect(buildOptions.paths).toBeUndefined();
});

/**
 * A KEY THAT MATCHES NOTHING IS THE ONE EDIT TO THIS CONFIG NOTHING MAKES A
 * NOISE ABOUT, and this is the half of the pair that names the KEY rather than
 * the file that answered -- a reader of this failure is sent to the spelling,
 * where the fault is, instead of to dist/, where its symptom is.
 *
 * OVER THE DECLARED MAPPING AS A CLASS: the expected set IS what the config
 * declares, so a second mapping added tomorrow is covered by this line and a key
 * that reaches nothing is refused whatever it is spelled. MEASURED, at 38b8709:
 * one pattern is declared and thirteen resolutions match it; with that same key
 * misspelled, NOTHING matches any pattern while resolution stays at exit 0.
 *
 * DELETING THE MAPPING LEAVES THIS GREEN -- an empty set matches an empty set --
 * and that is a division of labour rather than a hole: the resolution assertion
 * above reddens for it, naming dist/. Neither line covers the other, and the
 * failure a reader gets first is the one that names their edit.
 */
test("every specifier mapping this config declares is one the check really matches", async () => {
  const { matched } = await traceResolutions(repoRoot);

  expect([...matched].sort()).toEqual(Object.keys((repoOptions.paths ?? {}) as object).sort());
});

/**
 * THE PAIR, AND IT IS WHAT MAKES THE GREEN ABOVE EVIDENCE: source-versus-
 * artifact is only a distinction while the artifact is REACHABLE, and this is
 * the reading where the same manifest, the same settings and the same specifiers
 * answer from dist/ because one key is absent.
 *
 * IT IS NOT A STAND-IN FOR THE BUILD CONFIG, and the correction belongs here
 * because the substitution is the one a reader makes unprompted: these are the
 * REPOSITORY's settings with one key removed, and they carry no `rootDir` or
 * `outDir`. Those two are exactly what move the answer -- under the build
 * config's own options the same four subpaths resolve to ./src/*.ts, measured,
 * for the reason recorded above it. What is read here is `no mapping`, and it
 * says nothing about that config.
 *
 * THE TREE IS WRITTEN FROM THE MANIFEST'S OWN ARMS AND NOTHING IN IT IS BUILT,
 * which is deliberate: a probe that read this repository's dist/ would report on
 * whatever the last compiler run left there, and a build that fails writes dist/
 * before it exits non-zero. Every file here is empty and this test is about
 * WHICH ONE ANSWERS, so there is nothing for a compiler to have got wrong.
 */
test("with no mapping the same subpaths answer from the built artifact", async () => {
  // The symlink resolved once, up front: tsc reports the path it walked, and on
  // macOS a temp directory is reached through a link that would make every
  // answer look like it came from somewhere else.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-mapping-")));
  try {
    const declarations = publishedArm("types");
    const { paths: _dropped, ...withoutMapping } = repoOptions;
    // MIRRORED AND NOT THE WHOLE DIRECTORY, because the subject here IS a route
    // to this package: the manifest written below is what must answer
    // `@atusy/tsudoi-language-server/*`, and an installed entry for this package
    // reachable from the probe would answer it INSTEAD, silently, with the
    // reading still printing a file. Perturbed by removing that manifest's
    // `exports`, this arm reddens and nothing else answers -- measured.
    mirrorInstalledDependencies(dir);
    writeFileSync(join(dir, "package.json"), JSON.stringify(packageJson));
    for (const arm of Object.values(
      packageJson.exports as Record<string, Record<string, string>>,
    )) {
      for (const file of Object.values(arm)) {
        mkdirSync(dirname(join(dir, file)), { recursive: true });
        writeFileSync(join(dir, file), "export {};\n");
      }
    }
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: withoutMapping, files: ["probe.ts"] }),
    );
    writeFileSync(
      join(dir, "probe.ts"),
      Object.keys(declarations)
        .map((specifier) => `import "${specifier}";\n`)
        .join(""),
    );
    const { answers } = await traceResolutions(dir);
    const answered = Object.fromEntries(
      Object.keys(declarations).map((specifier) => [
        specifier,
        [...(answers.get(specifier) ?? [])].map((file) => relative(dir, file)).sort(),
      ]),
    );

    expect(answered).toEqual(
      Object.fromEntries(
        Object.entries(declarations).map(([specifier, file]) => [specifier, [file]]),
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * WHY THE MEMBERS ARE EXCLUDED FROM THE CHECK ABOVE, which is the one exclusion
 * in this repository that REMOVES coverage rather than declining to grade a
 * build artifact.
 *
 * ROOT `tsc --noEmit` DOES NOT MERELY MISS A MEMBER -- IT ANSWERS FOR ONE AND
 * REPORTS SUCCESS. The mapping asserted above resolves
 * `@atusy/tsudoi-language-server/*` for EVERY file in the root program, a
 * member's files included, so a member that declares no dependency on tsudoi at
 * all still type-checks green at the root through a route no consumer of that
 * member has. MEASURED, on a member planted for it: with the mapping in place
 * its subpath import produces NO error, and deleting the mapping turns that
 * exact line into TS2307. A green that arrives that way is worse than no check,
 * because it is read as one.
 *
 * SO THE COVERAGE IS TRANSFERRED RATHER THAN DROPPED, and the two keys asserted
 * here are the two halves of that transfer: `exclude` makes the wrong answer
 * unconstructible, and `workspaces` is what scripts/typecheck-workspaces.ts
 * enumerates the members from so that nothing has to remember them. NEITHER HALF
 * WORKS ALONE -- without the exclusion the fifth check is shadowed by a root
 * green, and without the fifth check the exclusion leaves the members checked by
 * nothing while every command exits 0.
 *
 * THE TWO KEYS ARE ASSERTED TOGETHER BECAUSE THEY MUST AGREE, and they live in
 * different files edited for different reasons. What the script does when they
 * DISAGREE -- a package under an excluded path that the patterns do not declare
 * -- is driven in test/workspace-members.test.ts against workspaces built for
 * it, since this repository can only ever be in the state where they agree.
 */
test("the members are outside the root type check, and the workspace patterns are what finds them", () => {
  expect(repoTsconfig.exclude).toEqual(["dist", "packages"]);
  expect(packageJson.workspaces).toEqual(["packages/*"]);
});

/**
 * WHY EACH HANDLER PACKAGE IS DECLARED AT AN EXACT VERSION AND NOT AS
 * `workspace:*`, which is the spelling anyone reaching for this line will try
 * first and which this repository cannot use.
 *
 * OVER MEMBERS AS A CLASS, ENUMERATED FROM THE WORKSPACE CONFIGURATION, because
 * a test naming one package leaves the second unchecked in BOTH directions --
 * undeclared where the demo config needs it, or declared one field up where it
 * would reach a consumer -- and nothing would say so.
 *
 * IT IS DEVDEPENDENCIES BY RIGHT: examples/tsudoi.config.ts imports the handlers
 * by package specifier, so the repo's own demo config depends on them, and
 * nothing this package PUBLISHES does -- which is why they may not appear one
 * field up.
 *
 * `workspace:*` BREAKS EVERY DETACHED COPY OF THIS MANIFEST, MEASURED, and both
 * copies are things this suite makes: the pack stage in test/helpers/install.ts
 * and the README checkout in test/helpers/readme.ts each write package.json into
 * a temp directory with no workspace around it, and `bun pm pack` there refuses
 * with `Failed to resolve workspace version`. AND THE EXACT VERSION IS NOT A
 * WORKAROUND WEARING A SPEC'S CLOTHES: `bun pm pack` run at the repo root
 * REWRITES `workspace:*` to exactly this string before it seals the tarball, so
 * the two spellings publish identically and only one of them survives being
 * copied.
 *
 * WHAT IT COSTS, named because nothing detects it: the two versions are now kept
 * equal by hand, and bumping the member's alone would send bun to a registry
 * that has never heard of it. The failure is loud -- a 404 at `bun install` --
 * which is why it is accepted rather than guarded.
 */
test("the repo depends on every member package for its own examples, at the version each member carries", () => {
  const devDependencies = packageJson.devDependencies as Record<string, string>;
  // MEMBERS AND NOT HANDLERS. examples/tsudoi.config.ts imports the framework by
  // specifier too, so the day the framework is a member this loop is what pins
  // the ROOT'S OWN DECLARATION OF IT -- present in devDependencies, at the
  // version that member carries, and NOT one field up. That last assertion is
  // the ruling `devDependencies creates no build edge` made executable, and
  // narrowing this site to handlers would delete it.
  const members = declaredMembers(repoRoot).map(
    (dir) =>
      JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
        name?: unknown;
        version?: unknown;
      },
  );
  // The pair for the loop: an empty member list would satisfy every assertion
  // inside it without reading a manifest at all.
  expect(members.length).toBeGreaterThan(0);

  for (const member of members) {
    // Narrowed rather than coerced: an equality against `undefined` would pass
    // the day a member loses its version, which is the day the declaration above
    // stops meaning anything.
    if (typeof member.name !== "string" || typeof member.version !== "string") {
      throw new Error("a handler package carries no name or version for this declaration to match");
    }

    expect(devDependencies[member.name]).toBe(member.version);
    expect(packageJson.dependencies).not.toHaveProperty(member.name);
  }
});

/**
 * THE DICTIONARY IS NOT THIS PACKAGE'S BUSINESS IN EITHER DIRECTION.
 *
 * `wordnet` is a RUNTIME dependency of @atusy/tsudoi-hover-wordnet and nothing
 * this package knows about. It is asserted rather than left absent because the
 * absence is exactly what a well-meaning edit undoes: the repo's own suite drives
 * a hover, the dictionary is what answers it, and reaching for a devDependency
 * here is the obvious way to make that work from a fresh checkout. It already
 * works -- the handler declares it, and a workspace install puts it where the
 * handler can see it -- so an entry here would be a second, silently divergent
 * declaration of one dependency.
 *
 * BOTH FIELDS, because the argument differs by field and only one half is
 * obvious: in `dependencies` it would ship a 27MB dictionary to every consumer
 * of a language-server framework that does not read one; in `devDependencies` it
 * would ship nothing and still be the second declaration.
 */
test("the dictionary belongs to the handler package, and this manifest declares it nowhere", () => {
  const dependencies = (packageJson.dependencies ?? {}) as Record<string, string>;
  const devDependencies = (packageJson.devDependencies ?? {}) as Record<string, string>;

  expect(Object.keys(dependencies)).not.toContain("wordnet");
  expect(Object.keys(devDependencies)).not.toContain("wordnet");
  // The pair: these are the real fields, not two empty objects a rename left
  // behind, so the absences above are absences from something.
  expect(Object.keys(dependencies)).toContain("vscode-languageserver-protocol");
  expect(Object.keys(devDependencies)).toContain("typescript");
});

/**
 * THE PUBLISHED SHAPE, asserted whole rather than key by key: `exports` makes
 * every path not listed unreachable by bare specifier, so adding an entry is a
 * decision about the public surface and never a convenience, and an equality
 * assertion is the only kind that notices one appearing.
 *
 * Each arm, measured under tsc 7.0.2, deno 2.9.2 and bun 1.3.13:
 *
 * - `types` -> dist/types.d.ts wins whenever dist/ exists, so a consumer type-
 *   checks against the DECLARATIONS, not against sources they were not sent.
 * - `import` -> dist/types.js is what a runtime import of the subpath actually
 *   resolves to, and it names a file the tarball contains. Pinned by
 *   test/installed-runtime.test.ts, with the pair that drops it.
 * - `default` -> src/types.ts is the IN-REPO FALLBACK and is reached only
 *   because tsc falls through a condition whose target file is missing. That
 *   fall-through does NOT serve `tsc --noEmit`: a `paths` mapping intercepts
 *   the subpath before the exports map is consulted, so tsc never reaches this
 *   arm. MEASURED that it has other consumers -- removing every `default` arm
 *   leaves tsc at exit 0 and reddens FOUR tests -- and MEASURED that it is
 *   needed here: repointing this subpath at dist/ unconditionally breaks
 *   examples/tsudoi.config.ts and test/fixtures/published-specifier.ts with
 *   TS2307.
 *
 * NOT ASSERTED, and named rather than left to be found: in the tarball the
 * `default` arm points at a path that is not shipped, so a resolver matching
 * NEITHER `types` nor `import` -- a CommonJS `require` is the only one -- gets
 * ERR_MODULE_NOT_FOUND rather than a module.
 *
 * ITS PREMISE HAS AN OWNER THAT REDDENS, which is the half worth writing down.
 * The paragraph rests on `the subpath carries no runtime value at all`, and
 * that is ASSERTED rather than merely asserted-about: `tsudoi's own subpath
 * exports nothing at run time` is a test in test/published-artifacts.test.ts,
 * taken over the INSTALLED package's module namespace. Carried by a comment
 * alone, the premise would go quietly false the day the subpath grew a value
 * and this paragraph would go with it.
 *
 * The judgement is what survived both moves: the package is type: module, the
 * two verified runtimes both take `import`, and the alternative is shipping src/
 * purely so an arm nobody takes can land somewhere -- which would put .ts files
 * back under node_modules for a deno user to trip over. A CommonJS `require`
 * therefore reaches no module here, and it would find nothing to import if it
 * did; adding a `require` arm is a decision about the published surface and
 * belongs to whoever names a consumer that needs one.
 *
 * No `main` and no `.` export: the package name alone still must not resolve,
 * which test/published-specifier.test.ts asserts.
 *
 * NO `bin`, and this is a deliberate refusal rather than an omission. A bin is
 * executed through a shim that obeys the file's shebang, so declaring one means
 * naming an interpreter in src/cli.ts. This project verifies exactly two
 * runtimes and neither of them reaches a package this way: deno does not use
 * node_modules/.bin at all, and the stated route is a file path both runtimes
 * take identically. A shebang naming node would be a third runtime's claim
 * that nothing here tests.
 *
 * JSR WAS MEASURED AND DECLINED, recorded here so the next person does not
 * re-derive it: it type-checks this package with no slow-types errors, but it
 * flags tsudoi's CORE MECHANISM -- the `await import(pathToFileURL(...))` in
 * src/config.ts that loads the user's config -- as unanalyzable-dynamic-
 * import; it REQUIRES a deno.json, which the assertion below forbids; and its
 * bun half cannot be verified without an irreversible publish needing an
 * account. Compiled .js on npm serves both runtimes from one artifact, which
 * is what criterion 2 asks for.
 */
test("the published surface is tsudoi's types beside the dependency subpaths, and nothing else", () => {
  const arm = (name: string): Record<string, string> => ({
    types: `./dist/${name}.d.ts`,
    import: `./dist/${name}.js`,
    default: `./src/${name}.ts`,
  });

  // FOUR ARMS, AND THE SPLIT IS OURS-VERSUS-THEIRS. `./types` carries tsudoi's
  // own names; the three under `./deps/` carry upstream's, one per dependency,
  // because a single module re-exporting all three is TS2308 under declaration
  // emit -- ambiguous re-export, which `--noEmit` does not reproduce.
  expect(packageJson.exports).toEqual({
    "./deps/protocol": arm("deps/protocol"),
    "./deps/textdocument": arm("deps/textdocument"),
    "./deps/types": arm("deps/types"),
    "./types": arm("types"),
  });
  expect(packageJson.files).toEqual(["dist"]);
  expect(packageJson.main).toBeUndefined();
  expect(packageJson.bin).toBeUndefined();
});

/** The scripts the manifest declares, read at test time like everything else. */
const scripts = packageJson.scripts as Record<string, string> | undefined;

// A PUBLISH-TIME STEP. THE DEVELOP-TIME HALF THIS NOTE ONCE CARRIED HAS MOVED
// OUT, to bunfig.toml, which is where the develop-time build now lives.
//
// WHAT THIS TEST ASSERTS, and it never changed: prepack runs inside `bun pm
// pack` and `npm pack` alike (measured), so the dist/ that is PUBLISHED is
// compiled from whatever src/ is present at that moment and can never be
// stale. A `build` script a human is trusted to remember would be exactly the
// staleness that avoids -- the same argument that put the develop-time build
// in a preload rather than in a script.
//
// THE REPO'S OWN dist/, which is a different artifact from the tarball's:
// examples/diagnostic-trailing-whitespace.ts takes DiagnosticSeverity -- a
// VALUE -- from
// `@atusy/tsudoi-language-server/deps/types`, and THE TWO RUNTIMES ANSWER THAT
// SUBPATH FROM DIFFERENT FILES. Deno takes the exports map's `import` arm to
// ./dist/deps/types.js. Bun never reaches the map: the `paths` mapping above
// intercepts the subpath into ./src/deps/types.ts. MEASURED under bun 1.3.13
// and deno 2.9.2, in the two arms that discriminate it -- deleting `paths`
// moves BUN's own resolution onto ./dist/deps/types.js, and removing
// ./dist/deps/types.js leaves bun loading the example while deno fails NAMING
// that file. So this repo's dist/ is load-bearing for `bun test` THROUGH ITS
// DENO-SPAWNING ARMS -- AND IT IS BUILT BY THE SUITE'S OWN PRELOAD rather than
// by nothing, which is what keeps that dependency from being a trap for whoever
// runs the suite.
//
// A MARKER WRITTEN INTO dist/ CANNOT DISCRIMINATE THIS UNDER `bun test`, which
// is why neither arm above uses one: the preload recompiles dist/ before any
// test module is loaded, so a marker put there by hand is overwritten before
// anything can observe it, and its absence reads as `bun did not use dist/`
// whether or not that is true.
//
// REQUIRED PRESENT WITH THIS VALUE, not `scripts equals exactly this`. The
// equality would also forbid every OTHER script, which is not a promise this
// project makes: adding one is a legitimate change, and a test that reddens for
// it
// resists change without defending a requirement. Unlike `exports` above, where
// an unlisted entry is unreachable and the whole map IS the public surface, a
// second script takes nothing away from this one.
test("packing builds, so a stale dist cannot be published", () => {
  expect(scripts?.prepack).toBe("tsc -p tsconfig.build.json");
});

/**
 * WHY THIS TEST IS NOT REDUNDANT UNDER AN AUTOMATIC BUILD, which is the
 * obvious argument for deleting it and the one to answer first: it would hold
 * only if the staleness this watches CANNOT ARISE, and that turns entirely on
 * whether the build is SKIPPABLE. MEASURED: it is.
 *
 * WHAT IT GUARDS IS ONE ROUTE, AND SAYING SO NARROWLY IS THE POINT: bun
 * discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and never
 * searches upward, so `bun test` run from anywhere but the repository root
 * executes the whole suite with no build. Every form run FROM the root --
 * bare, a file path, a name filter, `-t` -- preloads the build exactly once,
 * measured; the single-file bypass is not reachable here.
 *
 * WHAT IT WATCHES ON THAT ROUTE IS dist/deps/types.js AND ONLY THAT FILE, which
 * is narrower than `dist/ is stale` and is the reading to hold it to. MEASURED
 * from a non-root cwd with that one file replaced by `export {}`: this REDDENS,
 * printing its remedy beside an empty list. MEASURED on the same route with a
 * value added to src/types.ts instead: this stays GREEN, because neither side of
 * the comparison below reads that file -- the single failure there is
 * published-artifacts.test.ts's runtime-key list, and that one reddens
 * identically when the build DOES run, so it detects a new published name rather
 * than a stale dist/.
 *
 * IT IS ONE FAILURE AMONG MANY AND EARNS ITS PLACE BY NAMING ITS OWN CAUSE.
 * MEASURED on the stale-dist route: the suite from a non-root cwd gives 85 fail
 * / 596 pass, because every file that spawns a server loads dist/ too -- and
 * those arrive as `initialize failed: server exited with code 1` carrying
 * tsudoi's own `failed to load config` and a `SyntaxError: Export named
 * 'MarkupKind' not found in module .../dist/deps/types.js` on the child's
 * stderr (test/hover.test.ts: 12 pass, 4 fail). That text sends a reader to the
 * config; the remedy string below sends them to the build.
 *
 * IT DETECTS AND DOES NOT BUILD. Whether the suite builds is settled in
 * bunfig.toml, by ruling; what keeps the build OUT of THIS test is narrower and
 * permanent -- a test that repaired the condition it asserts could never fail.
 */
test("the repo's own dist/ is built, and carries every LSP data value", async () => {
  // THE SOURCE SIDE IS THE DEPENDENCY ITSELF, because src/deps/types.ts is a
  // star and there is no list here to read.
  //
  // WHAT IT CANNOT SEE, so its green is not read as more than it is: a STALE
  // dist/ is unreachable here, because bunfig.toml's preload rebuilds before any
  // test loads -- sabotaging dist/deps/types.js and re-running leaves this GREEN,
  // measured. What it DOES catch is the star being narrowed at the source:
  // replacing it with `export { Position }` reddens this, measured, naming the
  // 84 names that went.
  const declared = Object.keys(await import("vscode-languageserver-types")).sort();
  const built = await import(pathToFileURL(join(repoRoot, "dist", "deps", "types.js")).href).then(
    (module) => Object.keys(module as Record<string, unknown>).sort(),
    (cause: unknown) => [`dist/deps/types.js could not be loaded: ${String(cause)}`],
  );

  // The remedy rides on BOTH sides so it shows up in the diff: bun:test has no
  // message argument, and anyone reading this failure is by construction
  // standing somewhere the build did not run.
  const remedy = "run `bun test` from the repository root --";
  expect(`${remedy} ${JSON.stringify(built)}`).toBe(`${remedy} ${JSON.stringify(declared)}`);
});
/**
 * THE COMPILER THAT BUILDS THE PUBLISHED ARTIFACT IS THE REPO'S, NOT THE
 * MACHINE'S -- the property, in four steps, each of which can fail alone.
 *
 * It could not be asserted by running prepack and checking that it worked: a
 * tsc on PATH builds this package perfectly well, so `the build succeeds` is
 * true whether the compiler was pinned or merely present. That is why nothing
 * below runs a build. What the steps establish instead is that the tsc a
 * package manager REACHES FIRST is the one this repo declares, at the version
 * it declares, and that prepack names it in the way that takes that resolution.
 *
 * MEASURED, and the step that would otherwise be an assumption: in a throwaway
 * project holding node_modules/.bin/tsc as a marker-printing shim, with a real
 * tsc on PATH, both `bun run` and `npm run` execute the shim. Script resolution
 * puts node_modules/.bin ahead of PATH, which is what makes step 2 apply to the
 * bare `tsc` in step 4.
 *
 * The version is declared EXACTLY, not as a range. A range declares a set, and
 * the artifact under test and the artifact published have to come from one
 * compiler rather than from whatever a later install resolved.
 */
test("the compiler prepack builds with is pinned by this repo, at a version it declares", async () => {
  const devDependencies = packageJson.devDependencies as Record<string, string> | undefined;
  const declared = devDependencies?.typescript;
  const installed = JSON.parse(
    readFileSync(join(repoRoot, "node_modules", "typescript", "package.json"), "utf8"),
  ) as { version?: string };

  // 1. The repo DECLARES the compiler, and what is installed under it is that
  //    version -- not merely something satisfying a range.
  expect(declared).toBe(installed.version);

  // 2. The executable a package manager reaches first belongs to that package,
  //    resolved through the link rather than trusted by name.
  //
  //    BOTH SIDES ARE REALPATHED, and only one of them used to be. A workspace
  //    install makes node_modules/typescript ITSELF a link into node_modules/
  //    .bun, so the fully-resolved binary sits under a directory the unresolved
  //    package path is not a prefix of -- and the claim, that the two are the
  //    same package on disk, is a claim about resolved paths on both sides.
  const binary = join(repoRoot, "node_modules", ".bin", "tsc");
  const packageDirectory = realpathSync(join(repoRoot, "node_modules", "typescript")) + sep;
  expect(realpathSync(binary).startsWith(packageDirectory)).toBe(true);

  // 3. And it really is that compiler when run, rather than a stale link.
  const version = await runCommand(`${binary} --version`, repoRoot);
  expect(version.stdout.trim()).toBe(`Version ${declared}`);

  // 4. prepack names it by BARE NAME. An absolute path would be someone's
  //    machine, and `npx tsc` would be the network's choice rather than this
  //    repo's; only the bare name takes the resolution steps 2 and 3 pin.
  expect(scripts?.prepack.split(" ")[0]).toBe("tsc");
});

// PBI-13 criterion 3, and one of the two reasons JSR was declined: it REQUIRES
// a deno.json, which this project does without.
//
// ITS PAIR is not a probe that writes a deno.json to prove existsSync works --
// that would assert the function, not the guarantee. The guarantee is `deno
// runs tsudoi with no deno.json anywhere`, and what pairs with this absence is
// test/installed-runtime.test.ts, where deno completes the handshake in a
// consumer project that has none either. test/resolution.test.ts measures the
// other side: what a deno.json with an npm import map does and does not buy.
test("no deno.json is needed at the repo root", () => {
  expect(existsSync(join(repoRoot, "deno.json"))).toBe(false);
  expect(existsSync(join(repoRoot, "deno.jsonc"))).toBe(false);
});

/**
 * A PACKAGE THAT DECLARES A LICENCE SHIPS ITS TEXT, AND THAT IS A CLAIM ABOUT
 * EVERY PACKAGE THIS WORKSPACE PUBLISHES RATHER THAN ABOUT THIS ONE.
 *
 * `license: "MIT"` in a manifest is a POINTER, not a grant: MIT's own terms
 * require the notice and the permission paragraph to travel with the copy, and a
 * registry page rendering the SPDX id supplies neither. A tarball carrying the
 * field and no text tells a stranger which licence they were meant to get while
 * withholding the thing that gives it to them.
 *
 * OVER MEMBERS AS A CLASS, AND THE ROOT WITH THEM, on the reasoning the fifth
 * Definition-of-Done check and the deno guard's member shape already use: the
 * names come from the workspace configuration, so a package added under
 * packages/ is covered here with nothing edited, and a claim naming the one
 * member that exists would go quietly narrow at the second.
 *
 * BESIDE THE MANIFEST AND NOT INSIDE `files`, because that is where the packer
 * looks: MEASURED, `bun pm pack` carries LICENSE and README.md into the tarball
 * of a package whose `files` names `dist` alone -- read off the main package's
 * own tarball, which lists `package/LICENSE` under exactly that field. So the
 * remedy is a FILE and never an entry, and an entry added here in its place
 * would be the edit this test exists to keep unnecessary.
 *
 * NOT THE TEXT'S CONTENTS, deliberately: this asserts that the grant travels,
 * not which grant it is. Comparing bytes against the root's would forbid a
 * member from ever carrying a different licence, which is a decision no test of
 * packaging is entitled to make.
 */
test("every package this workspace publishes ships the licence it declares", () => {
  // MEMBERS AND NOT HANDLERS: `every package this workspace publishes` is the
  // claim, and the framework publishes more than either handler does. A
  // narrowing here would leave the one package a stranger actually installs
  // unchecked for the licence it declares.
  const publishers = [repoRoot, ...declaredMembers(repoRoot)];
  const missing = publishers.filter((dir) => {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      license?: unknown;
    };
    return typeof manifest.license === "string" && !existsSync(join(dir, "LICENSE"));
  });

  // NAMED rather than counted: a violating package appears in the failure text,
  // where `0` would only say a number moved.
  expect(missing.map((dir) => relative(repoRoot, dir))).toEqual([]);
  // The pair, and it is what stops the green above being a walk that found no
  // publishers at all: the members are real, and so is the field being read.
  expect(declaredMembers(repoRoot).length).toBeGreaterThan(0);
  expect(packageJson.license).toBe("MIT");
});
