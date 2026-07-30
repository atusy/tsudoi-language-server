import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot, runCommand } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";

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
    symlinkSync(join(repoRoot, "node_modules"), join(dir, "node_modules"), "dir");
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
 * it. THE CONSEQUENCE IS A RULE ABOUT WHERE REASONS LIVE: Sprint 40's `put the
 * decision at the site where the violating edit is made` is UNAVAILABLE for
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

/**
 * WHICH OF THE TWO TSCONFIGS MAY CARRY THE MAPPING, and why it is exactly one.
 *
 * `tsc --noEmit` is a DoD check, and without a mapping it resolves the
 * examples' `@atusy/tsudoi/*` imports through package.json's exports map to
 * dist/ -- THE BUILT ARTIFACT, which only `bun test`'s preload rebuilds. The two
 * therefore disagreed exactly when the published surface had moved: measured in
 * both directions, a false GREEN beside 43 test failures and a false RED against
 * a type the tree no longer contained. The mapping makes this repository's own
 * check read source, so a stale dist/ cannot reach it at all.
 *
 * tsconfig.build.json GETS NONE, and that is the half this pair exists for.
 * It `include`s src alone, which never imports the bare specifier, so a mapping
 * there would resolve nothing -- and it is the one of the two configs that
 * TRAVELS INTO THE PACKING STAGE, where inheriting it would type-check what we
 * publish against sources we do not ship. What the stage copies is pinned in
 * test/installed-specifier.test.ts; this is the other half of the same guard.
 *
 * ONE PATTERN COVERS ALL FOUR EXPORTS ARMS, and every one was measured rather
 * than assumed: breaking each name in src/ gives TS2305 at the in-repo importer
 * with no TS2307 anywhere, so the subpath resolves to source rather than to
 * nothing and the examples are still in the program.
 */
test("the repo's type check resolves the published subpaths to source, and the build config does not", () => {
  const repoOptions = repoTsconfig.compilerOptions as Record<string, unknown>;
  const buildOptions = buildTsconfig.compilerOptions as Record<string, unknown>;

  expect(repoOptions.paths).toEqual({ "@atusy/tsudoi/*": ["./src/*.ts"] });
  expect(buildOptions.paths).toBeUndefined();
});

/** The shipped manifest's own bytes, read at test time. */
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as Record<
  string,
  unknown
>;

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
 *   fall-through NO LONGER serves `tsc --noEmit`: since PBI-48 a `paths`
 *   mapping intercepts the subpath before the exports map is consulted, so
 *   this arm's tsc consumer is gone. MEASURED that it still has others --
 *   removing every `default` arm leaves tsc at exit 0 and reddens FOUR tests.
 *   Repointing this subpath at dist/ unconditionally was
 *   measured to break examples/tsudoi.config.ts and
 *   test/fixtures/published-specifier.ts with TS2307.
 *
 * NOT ASSERTED, and named rather than left to be found: in the tarball the
 * `default` arm points at a path that is not shipped, so a resolver matching
 * NEITHER `types` nor `import` -- a CommonJS `require` is the only one -- gets
 * ERR_MODULE_NOT_FOUND rather than a module.
 *
 * ITS PREMISE MOVED TWICE INSIDE PBI-49 AND ITS CONCLUSION NEVER DID, which is
 * the half worth writing down. It rested on `the subpath carries no runtime
 * value at all`; the sprint's first increment falsified that by exporting a
 * reduction from `./types`, and this paragraph was re-taken on the premise that
 * the resolver now missed SOMETHING; the stakeholder then ruled that a types
 * module may not export a runtime function, and the premise is TRUE AGAIN.
 * Asserted rather than asserted-about: `tsudoi's own subpath exports nothing at
 * run time` is now a test in test/published-artifacts.test.ts, taken over the
 * INSTALLED package's module namespace, so this sentence has an owner that
 * reddens instead of a comment that goes quietly false.
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
// examples/completion-path.ts takes CompletionItemKind -- a VALUE -- from
// `@atusy/tsudoi/types`, and from inside this repository package
// self-reference resolves that subpath through the exports map's `import` arm
// to ./dist/types.js (MEASURED under bun 1.3.13 and deno 2.9.2, discriminated
// against the `default` arm by writing a marker export into dist/types.js and
// seeing it appear). So this repo's dist/ is load-bearing for `bun test` --
// and SINCE SPRINT 40 IT IS BUILT BY THE SUITE'S OWN PRELOAD rather than by
// nothing, which is the clause this block used to carry and which a diff of
// that sprint's changed lines would never have reached, since the sprint
// edited no line in this file's neighbourhood for any other reason.
//
// REQUIRED PRESENT WITH THIS VALUE, not `scripts equals exactly this`. The
// equality also forbade every OTHER script, which is not a promise this project
// ever made: adding one is a legitimate change, and a test that reddens for it
// resists change without defending a requirement. Unlike `exports` above, where
// an unlisted entry is unreachable and the whole map IS the public surface, a
// second script takes nothing away from this one.
test("packing builds, so a stale dist cannot be published", () => {
  expect(scripts?.prepack).toBe("tsc -p tsconfig.build.json");
});

/**
 * The VALUE names src/types.ts re-exports, read out of that file rather than
 * copied: a list held here would agree with a src/types.ts that had dropped one.
 *
 * `export type { ... }` is deliberately not matched. Type re-exports leave no
 * runtime trace, so a declaration-only name has nothing to compare against in
 * the emitted .js and including it would make the assertion below fail forever.
 *
 * THROWS on finding none, for the reason every extractor in this project does:
 * an empty expectation is satisfied by an empty dist/, which is the exact state
 * this is here to catch.
 */

/**
 * THIS TEST WAS AUTHORISED FOR DELETION AND ITS OWN GATE WITHDREW THE
 * AUTHORISATION. PBI-35 pre-authorised removing it, on the ground that under an
 * automatic build the staleness it watches CANNOT ARISE -- target deliberately
 * removed rather than coverage lost. The gate attached to that authorisation
 * was `is the build SKIPPABLE`, and Sprint 40 measured that it is, so the
 * comparison stayed and the PBI went back to the Product Owner.
 *
 * WHAT IT GUARDS NOW IS ONE ROUTE, AND SAYING SO NARROWLY IS THE POINT: bun
 * discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and never
 * searches upward, so `bun test` run from anywhere but the repository root
 * executes the whole suite with no build. Every form run FROM the root --
 * bare, a file path, a name filter, `-t` -- preloads the build exactly once,
 * measured; the single-file bypass the PBI feared does not exist here.
 *
 * MEASURED ON THE ROUTE IT GUARDS, Sprint 40, with a value re-export added to
 * src/types.ts and no build: from a non-root cwd the suite gives 442 pass /
 * 2 fail, and THIS IS THE ONLY STALENESS-SPECIFIC FAILURE OF THE TWO. The
 * other -- published-artifacts.test.ts's exact runtime-key list -- was
 * attributed away by a control: it reddens identically when the same edit is
 * made and the build DOES run, so it detects a new published name rather than
 * a stale dist/. Without that control this test would have been reported as
 * one of a redundant pair.
 *
 * HISTORICAL, TO SPRINT 25, AND KEPT BECAUSE THEY DESCRIBE THE FAILURE A
 * READER ON THAT ROUTE STILL MEETS -- not present-tense claims about `bun
 * test` from the root, where dist/ can no longer be missing at all.
 * test/completion-path.test.ts STATICALLY IMPORTS the example, so with a stale
 * dist/ the whole file died at module load reporting 0 pass, as `SyntaxError:
 * Export named 'CompletionItemKind' not found in module .../dist/types.js`;
 * and the files that SPAWN a server surfaced the same cause as `initialize
 * failed: server exited with code 1` carrying tsudoi's own `failed to load
 * config` on the child's stderr, with only the server-needing assertions
 * failing (test/hover.test.ts: 12 pass, 2 fail at that tree).
 *
 * IT DETECTS AND DOES NOT BUILD, and the reason is now the opposite of the one
 * it used to give. It used to say a helper that quietly ran tsc would settle an
 * open question by default; that question is settled, in bunfig.toml, by
 * ruling. What keeps the build OUT of this test is that a test which repaired
 * the condition it asserts could never fail.
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
  const binary = join(repoRoot, "node_modules", ".bin", "tsc");
  const packageDirectory = join(repoRoot, "node_modules", "typescript") + sep;
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
// a deno.json, which this project has done without for ten sprints.
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
