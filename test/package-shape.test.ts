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
import { frameworkRoot, repoRoot, runCommand } from "./helpers/spawn.ts";
import { mirrorInstalledDependencies, runTsc } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * Decisions that have to live in package.json and tsconfig.json, asserted here
 * because THOSE FILES CANNOT CARRY THEIR OWN REASONS: JSON has no comments, and
 * oxfmt sorts an unknown key like `//exports` to the tail of the file where a
 * reader meets it last. A prose note elsewhere would drift; this fails when
 * someone violates the reason.
 */

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
 * the site where the violating edit is made` is UNAVAILABLE for either config,
 * exactly as it is for package.json, so a TEST holds their reasons and the file
 * holds only the setting.
 *
 * AND A MISSPELLED KEY IN EITHER CONFIG IS LOUD -- the compiler refuses an
 * unknown compiler option rather than silently applying nothing -- WHICH IS WHY
 * NOTHING HERE GUARDS AGAINST ONE. The keys worth pinning are the ones whose
 * failure to match would be SILENT, so what is asserted below is an EFFECT and
 * not a spelling.
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

// NOTHING AT THE CHECKOUT ROOT WRITES A dist/, AND THE ENTRY IS KEPT ANYWAY. The
// root manifest declares no `scripts` and the root has no tsconfig.build.json;
// what writes a dist/ in this repository is `build()` plus each member's
// `prepack`, every one of them under packages/, and `tsc --noEmit --listFiles`
// taken with the entry and without it gives identical file lists. It is a STALE
// VALUE, KEPT: an unmatched pattern is legitimate configuration, and the
// generalisation -- a guard that every `exclude` entry match something on disk --
// is refused by name, since it would redden correct files.
//
// AND THE TWO ARMS BELOW OBSERVE A dist/ THIS FIXTURE MANUFACTURES, NOT THE
// ENTRY, which is the reading a maintainer will otherwise take from their titles.
// `typeCheckWith` mkdirs dist/ and writes brokenDeclaration into it, so the exit
// 0 asserted here and the exit 1 asserted in the pair are both readings of the
// throwaway tree; both would read the same in a world where the root could never
// hold a dist/ at all, which is the world we are in. What holds the entry's VALUE
// is a LITERAL further down -- `the members are outside the root type check, and
// the workspace patterns are what finds them` -- which reddens on deletion
// whether or not the entry does any work.
test("the repo's tsconfig keeps dist out of the program", async () => {
  expect(await typeCheckWith(repoTsconfig, brokenDeclaration)).toBe(0);
});

// The pair, and it is not decoration: without `exclude` this same tree fails,
// which is what makes the green above evidence rather than a coincidence --
// evidence about THE EXCLUSION MECHANISM over the fixture's own dist/, not about
// the root's `dist` entry, per the note above.
//
// IT STRIPS THE WHOLE ARRAY AND SO CANNOT SPEAK FOR ONE ENTRY: destructuring
// `exclude` away removes `packages` with `dist`, and deleting only `"dist"` from
// the real config leaves this arm GREEN.
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
  readFileSync(join(frameworkRoot, "tsconfig.build.json"), "utf8"),
) as Record<string, unknown>;

const repoOptions = repoTsconfig.compilerOptions as Record<string, unknown>;
const buildOptions = buildTsconfig.compilerOptions as Record<string, unknown>;

/**
 * TWO MANIFESTS, ASSIGNED PER SITE, because one of them is the workspace and the
 * other is the package.
 *
 * THE WHOLE-FILE REPOINT IS THE EDIT THIS SPLIT EXISTS TO REFUSE. Some claims
 * below are about the PUBLISHED SURFACE (the exports map, `files`, `prepack`, the
 * refusal of `main` and `bin`) and some about the WORKSPACE (its `workspaces`
 * patterns, its devDependency on every member and the refusal to put one a field
 * up). Moving the reader wholesale onto either manifest would carry the other set
 * with it, silently asserting one package's shape against another's -- green
 * either way, in a file no refusal names.
 */
const workspaceJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as Record<
  string,
  unknown
>;
const packageJson = JSON.parse(readFileSync(join(frameworkRoot, "package.json"), "utf8")) as Record<
  string,
  unknown
>;

/**
 * What a compiler run at `cwd` RESOLVED and what it MATCHED: every specifier
 * against the files that answered it, beside the `paths` patterns that took any
 * specifier at all.
 *
 * `--traceResolution` IS WHAT MAKES A READING OF THIS POSITIVE, and the two
 * cheaper instruments are named because both fail here. AN EXIT CODE CANNOT
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
 * WHERE THE ROOT TYPE CHECK LANDS NOW THAT NO MAPPING EXISTS ANYWHERE, AND THE
 * WEAKENING IS DECLARED RATHER THAN QUIETLY ABSORBED: the root resolves these
 * subpaths the way a stranger's project does -- through node_modules, to the
 * framework's manifest, to the BUILT ARTIFACT its `types` arm names. SO THIS
 * REPOSITORY'S OWN TYPE CHECK NO LONGER READS ITS OWN SOURCE, AND NOTHING
 * REPLACES THAT. What still grades that source is the fifth check, under the
 * member's own tsconfig, plus the build the preload runs.
 *
 * AND THE RESIDUE THAT COMES WITH IT IS NAMED HERE AND DELIBERATELY NOT PINNED.
 * The `types` arm answers only while dist/ EXISTS. With dist/ absent -- or
 * half-written, which is the window `rm -rf dist && tsc` passes through -- tsc
 * alone probes for the file, falls through the map's `default: ./src/*.ts` arm,
 * READS A DIFFERENT FILE AND EXITS 0, with no diagnostic, while both runtimes
 * fail loudly. NO TEST HERE MAY PIN THAT: an assertion pinning it would PASS
 * while the residue persisted, specifying it rather than finding it. The arm
 * below reads the state the suite's own preload guarantees, and says nothing
 * about the other one.
 *
 * AND THAT REFUSAL IS ENFORCED BY NOTHING, WHICH IS SAID OUT LOUD BECAUSE IT SITS
 * THIRD IN A LIST OF THREE AND THE OTHER TWO ARE ENFORCED -- deleting the source
 * arms reddens, a `paths` mapping is refused by `refuseMemberMappings`, and a
 * check deciding whether some other test pins a residue would be a matcher for a
 * defect that is a property of matching, which this repository refuses by name. A
 * reader who met two enforced refusals and inferred the third would be reading a
 * silence as a mechanism.
 *
 * DELETING THE `default` ARMS WAS TAKEN, MEASURED AND REFUSED: it leaves every
 * reader answering from the file it answers from today and turns the absent state
 * into TS2307, but three arms in this suite reach the framework through
 * `typeCheckProbe`, whose tree has the manifest and a symlinked src/ AND NO
 * dist/, so the deletion converts graded resolutions into missing files. WHAT
 * STANDS IN ITS PLACE IS A DETECTOR RATHER THAN A PIN:
 * `refuseSubpathsAnsweringFromSource` refuses, on the fifth check and after the
 * build, a published subpath answering from anywhere but the artifact -- narrower
 * than this residue, and it says so at its own site.
 *
 * tsconfig.build.json GETS NO MAPPING EITHER. It `include`s src alone, which
 * never imports the bare specifier, so a mapping there would resolve nothing --
 * and it is the config that TRAVELS INTO THE PACKING STAGE, where inheriting one
 * would type-check what we publish against sources we do not ship.
 */
test("the root type check resolves the published subpaths through the exports map, to the built artifact", async () => {
  const declarations = publishedArm("types");
  const { answers } = await traceResolutions(repoRoot);
  // BOTH SIDES RESOLVED, for the reason the compiler-pinning test below states
  // about its own two: a checkout reached through a link is answered by the path
  // the compiler walked, and an expectation built from the path this file was
  // loaded by is a claim about the same file under another name.
  const answered = Object.fromEntries(
    Object.keys(declarations).map((specifier) => [
      specifier,
      [...(answers.get(specifier) ?? [])].map((file) => realpathSync(file)).sort(),
    ]),
  );

  expect(answered).toEqual(
    Object.fromEntries(
      Object.entries(declarations).map(([specifier, file]) => [
        specifier,
        [realpathSync(join(frameworkRoot, file))],
      ]),
    ),
  );
  expect(buildOptions.paths).toBeUndefined();
});

/**
 * NO SPECIFIER IN THE ROOT CHECK IS ANSWERED BY A MAPPING AT ALL: the framework
 * is acquired the way a stranger acquires it, and the one edit that would
 * silently take that back is a `paths` key in this config -- which resolves
 * without node_modules and without the exports map, and leaves every check in
 * this repository green over a resolution nobody looked at. The MEMBERS are
 * refused one by `refuseMemberMappings`; nothing refuses the ROOT one but this.
 *
 * READ OFF A REAL COMPILER RUN AND NOT OFF THE CONFIG'S BYTES, deliberately: a
 * mapping can arrive through `extends`, and a key read out of this file would be
 * silent about it. `matched` is what tsc itself reports having used.
 */
test("no specifier the root check resolves is answered by a mapping", async () => {
  const { matched } = await traceResolutions(repoRoot);

  expect([...matched].sort()).toEqual([]);
  // The pair, and without it the emptiness above is satisfied by a trace that
  // resolved nothing at all: the same run answered every published subpath.
  expect(Object.keys((repoOptions.paths ?? {}) as object)).toEqual([]);
});

/**
 * THE PAIR, AND IT IS WHAT MAKES THE GREEN ABOVE EVIDENCE: source-versus-artifact
 * is only a distinction while the artifact is REACHABLE, and this is the reading
 * where the same manifest, the same settings and the same specifiers answer from
 * dist/ because one key is absent.
 *
 * IT IS NOT A STAND-IN FOR THE BUILD CONFIG, which is the substitution a reader
 * makes unprompted: these are the REPOSITORY's settings with one key removed, and
 * they carry no `rootDir` or `outDir` -- the two that move the answer, since
 * under the build config's own options the same four subpaths resolve to
 * ./src/*.ts. What is read here is `no mapping`, and it says nothing about that
 * config.
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
 * WHAT `exclude` BUYS: no handler source file is in the root program at all, so
 * for two of the three members the root check is silent rather than wrong.
 * Without it every member's source is swept in and graded under the ROOT'S
 * options and the ROOT'S resolution, which is a grade no consumer's build ever
 * takes, and a green arriving that way is worse than no check because it is read
 * as one.
 *
 * WHAT THE EXCLUSION DOES NOT REACH, named here because it is the half a reader
 * would otherwise assume away: `exclude` stops files being SWEPT IN and not files
 * being IMPORTED. The framework's own `src/` is in the root program today,
 * entering through RELATIVE imports from this suite's own `test/*.test.ts`, so
 * the root check does grade that member's source, by a route no consumer writes.
 * That is this suite testing its own subject and not a second opinion on the
 * package.
 *
 * SO THE COVERAGE IS TRANSFERRED RATHER THAN DROPPED, AND THE TWO KEYS ARE
 * ASSERTED TOGETHER BECAUSE THEY MUST AGREE while living in different files:
 * `exclude` makes the wrong answer unconstructible, and `workspaces` is what
 * scripts/typecheck-workspaces.ts enumerates the members from. NEITHER HALF WORKS
 * ALONE -- without the exclusion the fifth check is shadowed by a root green, and
 * without the fifth check the exclusion leaves the members checked by nothing
 * while every command exits 0. What the script does when they DISAGREE is driven
 * in test/workspace-members.test.ts against workspaces built for it, since this
 * repository can only ever be in the state where they agree.
 */
test("the members are outside the root type check, and the workspace patterns are what finds them", () => {
  expect(repoTsconfig.exclude).toEqual(["dist", "packages"]);
  expect(workspaceJson.workspaces).toEqual(["packages/*"]);
});

/**
 * WHY EACH MEMBER PACKAGE IS DECLARED AT AN EXACT VERSION AND NOT AS
 * `workspace:*`, which is the spelling anyone reaching for this line will try
 * first and which this repository cannot use.
 *
 * IT IS DEVDEPENDENCIES BY RIGHT: examples/tsudoi.config.ts imports the handlers
 * by package specifier, so the repo's own demo config depends on them, and
 * nothing this package PUBLISHES does -- which is why they may not appear one
 * field up.
 *
 * `workspace:*` BREAKS EVERY DETACHED COPY OF THIS MANIFEST, and both copies are
 * things this suite makes: the pack stage in test/helpers/install.ts and the
 * README checkout in test/helpers/readme.ts each write package.json into a temp
 * directory with no workspace around it, and `bun pm pack` there refuses with
 * `Failed to resolve workspace version`. AND THE EXACT VERSION IS NOT A
 * WORKAROUND WEARING A SPEC'S CLOTHES: `bun pm pack` run at the repo root
 * REWRITES `workspace:*` to exactly this string before it seals the tarball, so
 * the two spellings publish identically and only one of them survives being
 * copied.
 *
 * WHAT IT COSTS, named because nothing detects it: the two versions are kept
 * equal by hand, and bumping the member's alone would send bun to a registry that
 * has never heard of it. The failure is loud -- a 404 at `bun install` -- which is
 * why it is accepted rather than guarded.
 */
test("the repo depends on every member package for its own examples, at the version each member carries", () => {
  // THE WORKSPACE'S MANIFEST, because the subject is what THE ROOT declares.
  const devDependencies = workspaceJson.devDependencies as Record<string, string>;
  // MEMBERS AND NOT HANDLERS: the framework is imported by specifier too, so this
  // loop is also what pins the ROOT'S OWN DECLARATION OF IT -- present in
  // devDependencies, at the version that member carries, and NOT one field up,
  // which is the ruling `devDependencies creates no build edge` made executable.
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
    expect(workspaceJson.dependencies).not.toHaveProperty(member.name);
  }
});

/**
 * THE DICTIONARY IS NOT THIS PACKAGE'S BUSINESS IN EITHER DIRECTION.
 *
 * `wordnet` is a RUNTIME dependency of @atusy/tsudoi-hover-wordnet. It is
 * asserted rather than left absent because the absence is exactly what a
 * well-meaning edit undoes: the repo's own suite drives a hover, the dictionary
 * is what answers it, and reaching for a devDependency here is the obvious way to
 * make that work from a fresh checkout. It already works -- the handler declares
 * it, and a workspace install puts it where the handler can see it -- so an entry
 * here would be a second, silently divergent declaration of one dependency.
 *
 * BOTH FIELDS, because the argument differs by field and only one half is
 * obvious: in `dependencies` it would ship a large dictionary to every consumer
 * of a language-server framework that does not read one; in `devDependencies` it
 * would ship nothing and still be the second declaration.
 */
test("the dictionary belongs to the handler package, and neither manifest here declares it", () => {
  // BOTH MANIFESTS, because the two fields the argument is about live in
  // DIFFERENT FILES, so a reading of either alone leaves the other route open.
  const dependencies = (packageJson.dependencies ?? {}) as Record<string, string>;
  const devDependencies = (workspaceJson.devDependencies ?? {}) as Record<string, string>;

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
 * assertion refuses one appearing. NOT ALONE, MEASURED: a planted subpath
 * reddens this, the README's own list, and the root check's traced resolution --
 * three arms with three different reasons, which is worth knowing before
 * anybody trades one of them for the others.
 *
 * Each arm:
 *
 * - `types` -> dist/types.d.ts wins whenever dist/ exists, so a consumer type-
 *   checks against the DECLARATIONS, not against sources they were not sent.
 * - `import` -> dist/types.js is what a runtime import of the subpath actually
 *   resolves to, and it names a file the tarball contains. Pinned by
 *   test/installed-runtime.test.ts, with the pair that drops it.
 * - `default` -> packages/tsudoi-language-server/src/types.ts is the IN-REPO
 *   FALLBACK, reached only because tsc falls through a condition whose target
 *   file is missing: root `tsc --noEmit` answers every subpath from dist/ while
 *   the artifact is there and falls through to THIS ARM the moment it is not --
 *   exit 0, no diagnostic, reading a file no consumer receives. DELETING IT IS
 *   BLOCKED BY `typeCheckProbe`, which stages this manifest with src/ SYMLINKED
 *   AND NO dist/, so three arms of this suite take this arm in every state of
 *   this repository. The blocker is asserted rather than described in
 *   test/unbuilt-artifact.test.ts.
 *
 * THE FIRING CONDITION IS THIS TEST, AND IT IS NAMED SO A READER DOES NOT INFER
 * IT: the literal below spells `default` for every subpath, so the day someone
 * deletes or retargets a source arm THIS equality reddens BY NAME, where the
 * others redden as COLLATERAL through `typeCheckProbe`. That is a KIND and not an
 * order -- `bun test` pins no file order -- and it is what makes the refusal
 * terminate rather than persist by being forgotten: a reader meeting this red is
 * told which literal to edit.
 *
 * NOT ASSERTED, and named rather than left to be found: in the tarball the
 * `default` arm points at a path that is not shipped, so a resolver matching
 * NEITHER `types` nor `import` -- a CommonJS `require` is the only one -- gets
 * ERR_MODULE_NOT_FOUND rather than a module. ITS PREMISE HAS AN OWNER THAT
 * REDDENS: `tsudoi's own subpath exports nothing at run time` is a test in
 * test/published-artifacts.test.ts, taken over the INSTALLED package's module
 * namespace, so the premise cannot go quietly false. The judgement is that the
 * package is type: module, both verified runtimes take `import`, and the
 * alternative is shipping src/ purely so an arm nobody takes can land somewhere
 * -- putting .ts files back under node_modules for a deno user to trip over.
 *
 * No `main` and no `.` export: the package name alone still must not resolve,
 * which test/published-specifier.test.ts asserts.
 *
 * NO `bin`, and this is a deliberate refusal rather than an omission. A bin is
 * executed through a shim that obeys the file's shebang, so declaring one means
 * naming an interpreter in packages/tsudoi-language-server/src/cli.ts. This
 * project verifies exactly two runtimes and neither of them reaches a package
 * this way: deno does not use node_modules/.bin at all, and the stated route is
 * a file path both runtimes take identically. A shebang naming node would be a
 * third runtime's claim that nothing here tests.
 *
 * JSR WAS MEASURED AND DECLINED, recorded so the next person does not re-derive
 * it: it type-checks this package with no slow-types errors, but it flags
 * tsudoi's CORE MECHANISM -- the `await import(pathToFileURL(...))` in
 * packages/tsudoi-language-server/src/config.ts that loads the user's config --
 * as unanalyzable-dynamic-import; it REQUIRES a deno.json, which the assertion
 * below forbids; and its bun half cannot be verified without an irreversible
 * publish needing an account. Compiled .js on npm serves both runtimes from one
 * artifact.
 */
test("the published surface is tsudoi's types beside the dependency subpaths, and nothing else", () => {
  const arm = (name: string): Record<string, string> => ({
    types: `./dist/${name}.d.ts`,
    import: `./dist/${name}.js`,
    default: `./src/${name}.ts`,
  });

  // FIVE ARMS, AND THE SPLIT IS OURS-VERSUS-THEIRS. `./types` carries tsudoi's
  // own names; the four under `./deps/` carry upstream's,
  // because a single module re-exporting all three is TS2308 under declaration
  // emit -- ambiguous re-export, which `--noEmit` does not reproduce.
  expect(packageJson.exports).toEqual({
    "./deps/protocol": arm("deps/protocol"),
    "./deps/textdocument": arm("deps/textdocument"),
    "./deps/types": arm("deps/types"),
    "./deps/error": arm("deps/error"),
    "./types": arm("types"),
  });
  expect(packageJson.files).toEqual(["dist"]);
  expect(packageJson.main).toBeUndefined();
  expect(packageJson.bin).toBeUndefined();
});

const scripts = packageJson.scripts as Record<string, string> | undefined;

// A PUBLISH-TIME STEP, and the develop-time half lives in bunfig.toml. prepack
// runs inside `bun pm pack` and `npm pack` alike, so the dist/ that is PUBLISHED
// is compiled from whatever src/ is present at that moment and can never be
// stale. A `build` script a human is trusted to remember would be exactly that
// staleness -- the same argument that put the develop-time build in a preload.
//
// A MARKER WRITTEN INTO dist/ CANNOT DISCRIMINATE ANY OF THIS UNDER `bun test`,
// which is why no arm here uses one: the preload recompiles dist/ before any test
// module is loaded, so a marker put there by hand is overwritten before anything
// can observe it, and its absence reads as `bun did not use dist/` whether or not
// that is true.
//
// REQUIRED PRESENT WITH THIS VALUE, not `scripts equals exactly this`. The
// equality would also forbid every OTHER script, which is not a promise this
// project makes -- unlike `exports` above, where an unlisted entry is unreachable
// and the whole map IS the public surface, a second script takes nothing away
// from this one.
test("packing builds, so a stale dist cannot be published", () => {
  expect(scripts?.prepack).toBe("rm -rf dist && tsc -p tsconfig.build.json");
});

/**
 * WHY THIS TEST IS NOT REDUNDANT UNDER AN AUTOMATIC BUILD, which is the obvious
 * argument for deleting it: it would hold only if the staleness this watches
 * CANNOT ARISE, and that turns entirely on whether the build is SKIPPABLE. It is.
 * bun discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and never
 * searches upward, so `bun test` run from anywhere but the repository root
 * executes the whole suite with no build. Every form run FROM the root -- bare, a
 * file path, a name filter, `-t` -- preloads the build exactly once.
 *
 * WHAT IT WATCHES ON THAT ROUTE IS dist/deps/types.js AND ONLY THAT FILE, which
 * is narrower than `dist/ is stale` and is the reading to hold it to: a value
 * added to packages/tsudoi-language-server/src/types.ts leaves this GREEN,
 * because neither side of the comparison below reads that file. It is one
 * failure among many on that route and earns its place by NAMING ITS OWN CAUSE
 * -- the others arrive as `initialize failed` and send a reader to the config,
 * where the remedy string below sends them to the build.
 *
 * IT DETECTS AND DOES NOT BUILD. Whether the suite builds is settled in
 * bunfig.toml; what keeps the build OUT of THIS test is that a test which
 * repaired the condition it asserts could never fail.
 */
test("the framework's own dist/ is built, and carries every LSP data value", async () => {
  // THE SOURCE SIDE IS THE DEPENDENCY ITSELF, because
  // packages/tsudoi-language-server/src/deps/types.ts is a star and there is no
  // list here to read.
  //
  // WHAT IT CANNOT SEE, so its green is not read as more than it is: a STALE
  // dist/ is unreachable from a root `bun test`, because the preload rebuilds
  // before any test loads. What it DOES catch is the star being narrowed at the
  // source, which reddens this naming every name that went.
  const declared = Object.keys(await import("vscode-languageserver-types")).sort();
  const built = await import(
    pathToFileURL(join(frameworkRoot, "dist", "deps", "types.js")).href
  ).then(
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
 * It could not be asserted by running prepack and checking that it worked: a tsc
 * on PATH builds this package perfectly well, so `the build succeeds` is true
 * whether the compiler was pinned or merely present. That is why nothing below
 * runs a build.
 *
 * WHAT MAKES STEP 2 APPLY TO THE BARE `tsc` IN STEP 4 is that script resolution
 * puts node_modules/.bin ahead of PATH -- with a shim there and a real tsc on
 * PATH, both `bun run` and `npm run` execute the shim.
 *
 * The version is declared EXACTLY, not as a range. A range declares a set, and
 * the artifact under test and the artifact published have to come from one
 * compiler rather than from whatever a later install resolved.
 */
test("the compiler prepack builds with is pinned by this repo, at a version it declares", async () => {
  // THE WORKSPACE DECLARES THE COMPILER, and prepack -- which is the FRAMEWORK's
  // script -- reaches it by walking up to the root node_modules/.bin. The two
  // manifests are read together here on purpose: a pin asserted on the manifest
  // that does not carry it would be green and empty.
  const devDependencies = workspaceJson.devDependencies as Record<string, string> | undefined;
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
  //    BOTH SIDES ARE REALPATHED. A workspace install makes node_modules/
  //    typescript ITSELF a link into node_modules/.bun, so the fully-resolved
  //    binary sits under a directory the unresolved package path is not a prefix
  //    of -- and the claim, that the two are the same package on disk, is a claim
  //    about resolved paths on both sides.
  const binary = join(repoRoot, "node_modules", ".bin", "tsc");
  const packageDirectory = realpathSync(join(repoRoot, "node_modules", "typescript")) + sep;
  expect(realpathSync(binary).startsWith(packageDirectory)).toBe(true);

  // 3. And it really is that compiler when run, rather than a stale link.
  const version = await runCommand(`${binary} --version`, repoRoot);
  expect(version.stdout.trim()).toBe(`Version ${declared}`);

  // 4. prepack names it by BARE NAME. An absolute path would be someone's
  //    machine, and `npx tsc` would be the network's choice rather than this
  //    repo's; only the bare name takes the resolution steps 2 and 3 pin.
  expect(scripts?.prepack.split(" && ").at(-1)?.split(" ")[0]).toBe("tsc");
});

// ITS PAIR is not a probe that writes a deno.json to prove existsSync works --
// that would assert the function, not the guarantee. The guarantee is `deno runs
// tsudoi with no deno.json anywhere`, and what pairs with this absence is
// test/installed-runtime.test.ts, where deno completes the handshake in a
// consumer project that has none either.
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
 * OVER MEMBERS AS A CLASS, AND THE ROOT WITH THEM: the names come from the
 * workspace configuration, so a package added under packages/ is covered with
 * nothing edited, and a claim naming the one member that exists would go quietly
 * narrow at the second.
 *
 * BESIDE THE MANIFEST AND NOT INSIDE `files`, because that is where the packer
 * looks: `bun pm pack` carries LICENSE and README.md into the tarball of a
 * package whose `files` names `dist` alone. So the remedy is a FILE and never an
 * entry, and an entry added here in its place would be the edit this test exists
 * to keep unnecessary.
 *
 * NOT THE TEXT'S CONTENTS, deliberately: this asserts that the grant travels,
 * not which grant it is. Comparing bytes against the root's would forbid a
 * member from ever carrying a different licence, which is a decision no test of
 * packaging is entitled to make.
 */
test("every package this workspace publishes ships the licence it declares", () => {
  // MEMBERS AND NOT HANDLERS: a narrowing here would leave the one package a
  // stranger actually installs unchecked for the licence it declares.
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
  expect(workspaceJson.license).toBe("MIT");
});
