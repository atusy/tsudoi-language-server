import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

applySuiteDeadline();

/**
 * WHAT THE FIFTH CHECK OWES ABOUT THE ARTIFACT IT JUST BUILT, driven against
 * workspaces built here rather than against this one.
 *
 * WHY IT CANNOT BE ASSERTED AGAINST THIS REPOSITORY: the check builds every
 * package before it reads one, so on this tree the artifact is always there and
 * the refusal can never fire. An instrument whose witness cannot fail measures
 * nothing, so the witnesses are built -- a member with NO build config, whose
 * artifact is therefore exactly what the fixture wrote and whatever the check
 * does not create.
 *
 * THE REAL COMMAND IS SPAWNED AND ITS OUTPUT IS READ, never the function called
 * directly, and that is the whole of what makes the ordering assertion below
 * mean anything: the property is WHEN the reading is taken, and calling the
 * function proves only that it works when called.
 */

/** A member's own tsconfig: no `paths`, no `types`, so no install is needed. */
const memberTsconfig = JSON.stringify({
  compilerOptions: {
    target: "esnext",
    module: "esnext",
    moduleResolution: "bundler",
    noEmit: true,
    strict: true,
    types: [],
  },
  include: ["src"],
});

/** A source file that type-checks, so a member built from it cannot be the red. */
const typeChecks = "export const fine: number = 1;\n";

/**
 * A source file that cannot type-check.
 *
 * WHAT THE DIAGNOSTIC ACTUALLY NAMES IS THE FILE AND THE CODE, MEASURED: this
 * compiler reports `packages/producer/src/index.ts(1,14): error TS2322` and
 * never the identifier, so an arm looking for `broken` in the output is looking
 * for a word no run prints -- true whether the member was checked or not.
 */
const typeError = 'export const broken: number = "not a number";\n';

/** The member's own source, which is what its diagnostic is printed against. */
const memberSource = "packages/producer/src/index.ts";

/**
 * The map a package WITH SOURCE IN THE TREE publishes: the artifact first, the
 * source last, which is the shape tsudoi's own map has and the only shape under
 * which the compiler can fall through to a file the package does not ship.
 */
const artifactThenSource = {
  "./thing": {
    types: "./dist/thing.d.ts",
    import: "./dist/thing.js",
    default: "./src/thing.ts",
  },
};

/**
 * The map with NO SOURCE ARM, which is the shape BOTH handler packages in this
 * repository have -- deno refuses to type-strip under node_modules, so a handler
 * publishes dist/ and names no other route. Under it a missing artifact is not a
 * fall-through: there is nothing to fall through TO, and the subpath resolves to
 * no file at all.
 */
const artifactOnly = {
  "./thing": {
    types: "./dist/thing.d.ts",
    import: "./dist/thing.js",
  },
};

/**
 * THE SAME TWO FILES IN THE OTHER ORDER: source first, artifact after it.
 *
 * `exports` CONDITIONS ARE MATCHED IN DECLARATION ORDER, so this map promises
 * one file in its `types` arm and hands every reader another -- with the
 * artifact built, complete and untouched. It is the one staged shape where `the
 * declaration exists` and `the declaration answers` disagree.
 */
const sourceBeforeArtifact = {
  "./thing": {
    default: "./src/thing.ts",
    types: "./dist/thing.d.ts",
    import: "./dist/thing.js",
  },
};

/**
 * A WILDCARD SUBPATH, whose arms carry the star its key does.
 *
 * NO MAP IN THIS WORKSPACE HAS ONE, WHICH IS WHY IT IS STAGED HERE: the
 * enumeration reads a subpath literally, and what that produces was written down
 * in prose from reasoning and was wrong. This is the shape that measures it.
 */
const wildcard = {
  "./*": {
    types: "./dist/*.d.ts",
    import: "./dist/*.js",
    default: "./src/*.ts",
  },
};

/**
 * A workspace whose one member PUBLISHES a subpath, in whichever state its
 * artifact is left in.
 *
 * THE MAP IS A PARAMETER BECAUSE THE MAP IS A STATE, and it is the axis every
 * arm here used to hold fixed: with one map in the fixture, `does this package
 * declare a source arm` was never varied, and the branch that reads a subpath
 * answering from NOTHING was reachable by no arm at all.
 *
 * NO tsconfig.build.json, DELIBERATELY: the check builds every package that has
 * one, so a member with a build config would have its artifact written by the
 * very command under test and every state below would collapse into `complete`.
 *
 * `.gitignore` NAMES dist FOR THE SAME REASON A REAL CHECKOUT DOES. The staging
 * helper commits what it writes, and a tracked artifact no program includes is
 * refused by a DIFFERENT guard -- which would make every arm here red for a
 * reason that is not the artifact.
 */
function publishingMember(
  artifact: Record<string, string>,
  source = typeChecks,
  exports: Record<string, Record<string, string>> = artifactThenSource,
): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    ".gitignore": "dist\n",
    "packages/producer/package.json": JSON.stringify({
      name: "@staged/producer",
      version: "0.0.0",
      files: ["dist"],
      exports,
    }),
    "packages/producer/tsconfig.json": memberTsconfig,
    [memberSource]: source,
    [sourceFile]: "export type Thing = string;\n",
    ...artifact,
  };
}

const declaration = "packages/producer/dist/thing.d.ts";
const module_ = "packages/producer/dist/thing.js";
/** The file the map's LAST arm names -- what the compiler answers when the artifact does not. */
const sourceFile = "packages/producer/src/thing.ts";

/** The complete artifact: the declaration a consumer type-checks against, and the module. */
const complete = {
  [declaration]: "export type Thing = string;\n",
  [module_]: "export {};\n",
};

/** Runs the fifth Definition-of-Done check over a throwaway workspace. */
async function checkWorkspace(files: Record<string, string>): Promise<CliResult> {
  const root = workspace(files);
  try {
    return await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a published subpath answering from its own artifact is not refused", async () => {
  const result = await checkWorkspace(publishingMember(complete));

  // THE GREEN HALF, AND WITHOUT IT EVERY RED BELOW IS SATISFIED BY A CHECK THAT
  // REFUSES EVERY WORKSPACE: the same fixture, complete, passes.
  expect(`${String(result.code)} ${result.stdout}${result.stderr}`).toBe("0 ");
});

test("a published subpath with no artifact at all is refused, naming the file it promised", async () => {
  const result = await checkWorkspace(publishingMember({}));

  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("@staged/producer/thing");
  expect(result.stderr).toContain(declaration);
});

/**
 * NO ANSWER IS NOT AN ANSWER FROM THE ARTIFACT, and until this arm nothing in
 * this suite said so. Every fixture above carries a source arm, so every
 * specifier the probe asked about resolved to SOMETHING -- and a detector
 * treating an unresolved subpath as satisfactory kept the whole suite green.
 * MEASURED: `landed !== undefined && (...)` in place of the offender predicate
 * reddens nothing without this pair.
 *
 * AND THE SHAPE IS NOT INVENTED FOR THE ARM: it is what both handler packages
 * here declare, so the state this reads is one this workspace can actually be
 * in.
 */
test("a published subpath with NO source arm and no artifact is refused, saying it answers from nothing", async () => {
  const result = await checkWorkspace(publishingMember({}, typeChecks, artifactOnly));

  expect(result.code).not.toBe(0);
  // THE WORDING IS PART OF THE READING AND NOT DECORATION: `answers from NOTHING`
  // is what separates a subpath that resolved to the wrong file from one that
  // resolved to none, and a reader's next move differs between them.
  expect(result.stderr).toContain("@staged/producer/thing answers from NOTHING");
  // THE PAIR: the same map with the artifact present passes, so the red above is
  // the missing artifact and not the missing source arm.
  expect(await checkWorkspace(publishingMember(complete, typeChecks, artifactOnly))).toHaveProperty(
    "code",
    0,
  );
});

/**
 * THE STATE THAT SEPARATES `THE DECLARATION EXISTS` FROM `THE DECLARATION
 * ANSWERS`, and until this arm the two coincided in every state staged here --
 * so the whole compiler probe could be replaced by an `existsSync` and nothing
 * reddened. MEASURED: `subpaths.filter(({ declaration }) => !existsSync(declaration))`
 * as the entire offender rule keeps every other arm in this file.
 *
 * THEY DIVERGE WHENEVER THE MAP ANSWERS SOURCE FIRST. Conditions are matched in
 * declaration order, so a `default` arm ahead of `types` wins for every reader,
 * and the compiler reads a file the package does not ship WHILE THE ARTIFACT IS
 * COMPLETE AND ON DISK. That is the function's own stated whole reason -- the
 * trace and not an exit code is the only reading that can name the file -- and
 * it is a repair a person really makes, since reordering an `exports` map looks
 * like formatting.
 */
test("a published subpath whose map answers source BEFORE its artifact is refused, though the artifact is complete", async () => {
  const files = publishingMember(complete, typeChecks, sourceBeforeArtifact);
  const result = await checkWorkspace(files);

  expect(result.code).not.toBe(0);
  // THE DISCRIMINATION AGAINST A FILE-EXISTENCE READING, ASSERTED RATHER THAN
  // ARRANGED: the promised declaration is IN the staged tree, so the cheaper
  // question answers `yes` here and the refusal still has to fire.
  expect(Object.keys(files)).toContain(declaration);
  expect(result.stderr).toContain("@staged/producer/thing");
});

/**
 * THE STATE A BARE TYPE CHECK CANNOT SEE, which is the reason this refusal
 * exists rather than a second reading of an exit code: the module is written and
 * its declaration is not, so the compiler falls through to source and answers at
 * exit 0 with nothing printed.
 */
test("a published subpath whose module is written and whose declaration is not is refused, naming the declaration", async () => {
  const result = await checkWorkspace(publishingMember({ [module_]: "export {};\n" }));

  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain(declaration);
  // The discrimination, asserted rather than arranged: the file that IS there is
  // not what it complains about.
  expect(result.stderr).not.toContain(module_);
  // AND THE OTHER HALF OF THE MESSAGE'S OWN PROMISE, WHICH NOTHING READ. It
  // undertakes to name WHICH FILE ANSWERED beside WHICH WAS PROMISED, and every
  // arm here asserted only the promised one -- so printing the declaration in
  // both slots yields `X answers from D, where its types arm promises D` and the
  // file was kept green. The two paths must differ, and the answering one is the
  // file a reader has never heard of.
  expect(result.stderr).toContain(sourceFile);
});

/**
 * THE ONE DOCUMENTED REACHABLE CASE OF THE `unasked` PAIR, MEASURED AND FOUND
 * TO BE THE OTHER DIAGNOSIS. The enumeration's docstring said a wildcard
 * subpath is one the probe cannot resolve and that the refusal would report
 * `never reached the resolver`. Staged, the compiler ATTEMPTS the specifier,
 * substitutes nothing and finds no file, so what a reader gets is `answers from
 * NOTHING` -- pointing at the map, which is where the fault is.
 *
 * SO THE ARM EXISTS TO KEEP THE CORRECTED SENTENCE HONEST rather than to cover
 * the pair, which nothing here reaches: made vacuous, the pair costs no arm in
 * this suite, and that is recorded at its site instead of being fixed with a
 * fixture invented to have one.
 */
test("a wildcard subpath is reported as answering from no file, and never as a probe that was not asked", async () => {
  const result = await checkWorkspace(publishingMember(complete, typeChecks, wildcard));

  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("@staged/producer/* answers from NOTHING");
  expect(result.stderr).not.toContain("never reached the resolver");
});

/**
 * THE PROPERTY IS WHEN, AND THIS IS THE ARM THAT READS IT. A refusal moved below
 * the member loop changes no value and still prints -- and by then every member
 * has been graded against a file no consumer receives. So the reading is what
 * the command did NOT print: the member's own diagnostic never appears, because
 * the member was never checked.
 */
test("the refusal arrives before any member is type-checked against the artifact", async () => {
  const result = await checkWorkspace(publishingMember({}, typeError));
  const output = `${result.stdout}${result.stderr}`;

  expect(result.code).not.toBe(0);
  expect(output).toContain(declaration);
  // THE PAIR, AND IT READS THE DIAGNOSTIC RATHER THAN A COLOUR. An exit code
  // alone cannot tell `the member was reported` from `the member failed
  // silently`, so the halves below were not each other's mirror: MEASURED, with
  // the diagnostics piped this arm stayed green EVEN WITH THE REFUSAL MOVED
  // BELOW THE MEMBER LOOP, and what kept it honest was four unrelated arms
  // defending the inherited stdio.
  const reported = await checkWorkspace(publishingMember(complete, typeError));
  const printed = `${reported.stdout}${reported.stderr}`;
  expect(reported.code).toBe(1);
  expect(printed).toContain(memberSource);
  expect(printed).toContain("TS2322");
  // AND THE TWO HALVES ARE NOW EACH OTHER'S MIRROR, WHICH THEY WERE NOT: the
  // absent half looked for `broken`, a word this compiler prints in no run at
  // all, so it held for a reason unrelated to the ordering.
  expect(output).not.toContain(memberSource);
  expect(output).not.toContain("TS2322");
});
