import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";
import { workspace } from "./helpers/workspace.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT scripts/typecheck-workspaces.ts OWES, DRIVEN AGAINST WORKSPACES BUILT
 * HERE RATHER THAN AGAINST THIS ONE.
 *
 * THE REASON IT TAKES A ROOT AT ALL: this repository is one workspace in one
 * state, and every claim below is about a state it must never be in -- a member
 * with a type error, a package nothing declares, a manifest that enumerates
 * nothing. Asserting them against the repo would mean breaking the repo to
 * measure, which is exactly the hand-run sequence that leaves a wrong artifact
 * behind.
 *
 * AND THE CLAIM UNDER ALL OF THEM IS AN ABSENCE OF COVERAGE, which nothing
 * observes by looking: the root type check EXCLUDES these paths, so a member
 * this script fails to reach is checked by nothing and every command in the
 * Definition of Done exits 0. A green from this script means something only if
 * a red is reachable, which is what each pair below measures.
 */

/** A source file that cannot type-check, and a `broken` a diagnostic can name. */
const typeError = 'export const broken: number = "not a number";\n';

/** A source file that type-checks, so a member built from it cannot be the red. */
const typeChecks = "export const fine: number = 1;\n";

/**
 * A member's own tsconfig, carrying NO `paths` and NO `types`.
 *
 * The absence of `types` is what keeps these workspaces free of node_modules:
 * a member declaring `node` would need @types/node reachable, and the failure
 * would be an apparatus failure wearing a type error's clothes.
 */
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

/** Runs the fifth Definition-of-Done check over a throwaway workspace. */
async function checkWorkspace(files: Record<string, string>): Promise<CliResult> {
  const root = workspace(files);
  try {
    return await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * A workspace holding two members, the second of which type-checks or does not.
 *
 * THE SECOND MEMBER IS NAMED IN NO LIST ANYWHERE -- not in this script, not in
 * the root tsconfig, nowhere but the `packages/*` pattern it happens to match.
 * That is the property the check is built for, and building the workspace this
 * way is what asserts it rather than describing it.
 */
function twoMembers(second: string): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/early/package.json": JSON.stringify({ name: "early" }),
    "packages/early/tsconfig.json": memberTsconfig,
    "packages/early/src/index.ts": typeChecks,
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": second,
  };
}

test("a member's type error is reported, at a member no list names", async () => {
  const result = await checkWorkspace(twoMembers(typeError));

  expect(result.stdout).toContain("packages/late/src/index.ts");
  expect(result.stdout).toContain("TS2322");
  expect(result.code).toBe(1);
});

// THE PAIR, and it carries the load a bare `exit 1` cannot: a check that failed
// for an apparatus reason -- a compiler it cannot find, a root it cannot read --
// reddens above identically. Only the same workspace going green with the same
// two members says the red came from the source line that changed.
test("the same two members pass once the error is removed", async () => {
  const result = await checkWorkspace(twoMembers(typeChecks));

  expect(result.stdout).toBe("");
  expect(result.code).toBe(0);
});

/**
 * THE DIRECTORY IS NAMED because `some package is uncovered` sends a reader
 * looking through every directory the exclusion reaches.
 *
 * THE SHAPE OF THE SENTENCE IS ASSERTED AND NOT ONLY THE DIRECTORY: the file
 * this package holds is uncovered too, so a run answering ONE MISSING WORKSPACE
 * ENTRY with a list of its files would satisfy `names packages/forgotten` while
 * telling the reader to widen an `include` -- the wrong repair for a package
 * that should have been declared. The package sentence is a REFINEMENT over the
 * uncovered file, and this is where its precedence is pinned.
 */
test("a package the workspace patterns do not declare fails loudly", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/forgotten/package.json": JSON.stringify({ name: "forgotten" }),
    "packages/forgotten/src/index.ts": typeError,
  });

  expect(result.stderr).toContain("packages/forgotten");
  expect(result.stderr).toContain("workspaces");
  expect(result.stderr).not.toContain("packages/forgotten/src/index.ts");
  expect(result.code).not.toBe(0);
});

/**
 * WHAT THE PACKAGE SENTENCE REPLACES IS THE FILES IT SPEAKS FOR, and that
 * is the whole of it: `tools/elsewhere.ts` is in no package any `workspaces`
 * entry would have covered, so declaring the member repairs nothing about it. A
 * run printing the package sentence ALONE sends a reader to fix the package and
 * meet the other file on the following run.
 *
 * AND IT IS NOT REPAIRED BY DEMANDING THAT EVERY OFFENDER BE IN A PACKAGE: that
 * would answer ONE missing entry with a wall of file sentences the moment
 * anything else were uncovered too, which is the regression the package sentence
 * was kept for. The arm above is the other half and still passes -- there the
 * only offender is inside the package, and only the package sentence prints.
 */
test("an offender outside the undeclared package is named beside the package sentence", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages", "tools"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/forgotten/package.json": JSON.stringify({ name: "forgotten" }),
    "packages/forgotten/src/index.ts": typeChecks,
    "tools/elsewhere.ts": typeChecks,
  });

  expect(result.stderr).toContain("tools/elsewhere.ts");
  expect(result.stderr).toContain("packages/forgotten");
  expect(result.stderr).toContain("workspaces");
  expect(result.stderr).not.toContain("packages/forgotten/src/index.ts");
  expect(result.code).not.toBe(0);
});

/**
 * THE NARROWING THE ONE-DECIDER RULING COSTS, PINNED SO THAT IT IS A DECISION
 * AND NOT A LOSS: this package is excluded and declared by no pattern, exactly
 * like the ones above, and it holds NO TypeScript -- so there is nothing here
 * that nothing type-checks.
 *
 * TWO READERS ANSWERING ONE QUESTION CAN DISAGREE WITH EVERY CHECK GREEN, which
 * is why the package sentence is a refinement of a fault the compilers' own file
 * lists found: where they find none there is nothing to refine.
 */
test("a package the workspace does not declare and that holds no TypeScript is left alone", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/forgotten/package.json": JSON.stringify({ name: "forgotten" }),
    "packages/forgotten/README.md": "# forgotten\n",
  });

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

// A LITERAL READING OF THE ENTRY LOSES THE PACKAGE SENTENCE, WHICH IS WHY THE
// LAST TWO ASSERTIONS ARE HERE. `packages/*` names no directory on disk, so a
// check that joins it to the root and walks finds nothing; the run is not
// silent, because the compilers' file lists still find the uncovered file, but
// it prints the FILE sentence and sends the reader to widen an `include` that
// was never the fault. Without these assertions the arm above is what reddens
// when the refinement goes.
test("a glob-form exclusion still names the package nothing declares", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages/*"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/forgotten/package.json": JSON.stringify({ name: "forgotten" }),
    "packages/forgotten/src/index.ts": typeError,
  });

  expect(result.stderr).toContain("packages/forgotten");
  expect(result.stderr).toContain("workspaces");
  expect(result.stderr).not.toContain("packages/forgotten/src/index.ts");
  expect(result.code).not.toBe(0);
});

// THE OTHER HALF OF READING THE ENTRY AS A PATTERN, and it only appears once
// the entry is expanded: `packages/**` matches straight INTO a member's
// installed dependencies, so a match that starts there names a package.json
// belonging to a stranger. Nothing in this repository will ever type-check it,
// which would make the report a permanent red about somebody else's file.
//
// THE STRANGER SHIPS A SOURCE FILE, AND THAT IS WHAT KEEPS THIS ARM ABLE TO
// FAIL. With the coverage decided by the compilers' file lists, a package
// holding no TypeScript reddens nothing whatever the exclusion says -- so a
// stranger with only a manifest would leave this green for a reason that has
// nothing to do with node_modules.
test("an exclusion reaching into node_modules reports nobody else's package", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages/**"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/declared/node_modules/stranger/package.json": JSON.stringify({ name: "stranger" }),
    "packages/declared/node_modules/stranger/index.ts": typeError,
  });

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

// `I found no members` and `I was given no way to find them` must not produce
// the same observation, since this check is what looks at the paths the root
// check gave up.
test("a manifest declaring no workspaces fails rather than reporting nothing to do", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root" }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
  });

  expect(result.stderr).toContain("workspaces");
  expect(result.code).not.toBe(0);
});

// A member with no tsconfig.json cannot be type-checked, and SKIPPING it is the
// silent version of the same gap: it would leave the member green in a run that
// never looked at it.
test("a member with no tsconfig.json fails loudly rather than being skipped", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/untyped/package.json": JSON.stringify({ name: "untyped" }),
    "packages/untyped/src/index.ts": typeError,
  });

  expect(result.stderr).toContain("packages/untyped");
  expect(result.code).not.toBe(0);
});

/**
 * A workspace holding one member, WITH THE DIRECTORY NAME AND THE DECLARED NAME
 * SUPPLIED SEPARATELY.
 *
 * That separation is the whole apparatus: everywhere else in this repository the
 * two are the same fact, so the only way to observe what happens when they
 * disagree is to build a tree where they can. The member type-checks and carries
 * its own tsconfig, so a red from one of these is the name guard's and not
 * `typeCheckMember` reporting a member it has nothing to check with.
 */
function memberNamed(directory: string, declared: string): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    [`packages/${directory}/package.json`]: JSON.stringify({ name: declared }),
    [`packages/${directory}/tsconfig.json`]: memberTsconfig,
    [`packages/${directory}/src/index.ts`]: typeChecks,
  };
}

/**
 * A MEMBER'S DIRECTORY IS ITS DECLARED NAME WITH THE SCOPE DROPPED, refused in
 * both directions and over members as a class.
 *
 * WHAT THE TWO DIRECTIONS ARE AND WHY THEY ARE ONE PREDICATE: on disk there is
 * no such thing as `the side that moved`. `packages/late` declaring `elsewhere`
 * and `packages/elsewhere` declaring `late` are the same disagreement wearing
 * different clothes, and the pair below is written so the message is shown
 * naming THE SIDE THAT WAS NOT TOUCHED in each -- which is what distinguishes a
 * diagnostic from an echo of the argument it was handed.
 */
test("a member whose manifest declares a name other than its directory fails loudly", async () => {
  const result = await checkWorkspace(memberNamed("late", "elsewhere"));

  expect(result.stderr).toContain("packages/late");
  expect(result.stderr).toContain("`elsewhere`");
  expect(result.stderr).toContain("unscoped");
  expect(result.code).not.toBe(0);
});

// THE SAME STATE STAGED FROM THE OTHER SIDE, and the assertion is on the
// spelling that was NOT moved: a guard that merely repeated the directory it was
// iterating would pass the arm above and fail here.
test("the same disagreement staged from the directory side names the manifest's spelling", async () => {
  const result = await checkWorkspace(memberNamed("elsewhere", "late"));

  expect(result.stderr).toContain("packages/elsewhere");
  expect(result.stderr).toContain("`late`");
  expect(result.stderr).toContain("unscoped");
  expect(result.code).not.toBe(0);
});

// THE PAIR, and it is the arm the fixtures in this file could not already
// supply: every throwaway member here is UNSCOPED while every real member is
// SCOPED, so nothing else exercises the stripping. Without it a guard that
// refused every scoped name would pass both reds above and surface only as a
// repository-wide failure that reads like the rename's fault.
test("a member whose scoped name ends in its own directory is left alone", async () => {
  const result = await checkWorkspace(memberNamed("late", "@scope/late"));

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

// AND THE OTHER HALF OF THE STRIPPING, WHICH IS THE ONE THAT STOPS THE GUARD
// GOING VACUOUS ON THIS REPOSITORY. `pass anything holding a scope` satisfies
// the two reds above and the green above, AND leaves both real members -- both
// scoped -- refused by nothing. This is the only arm of the four that reddens
// that predicate.
test("a member whose scoped name ends in something else is refused, scope and all", async () => {
  const result = await checkWorkspace(memberNamed("late", "@scope/elsewhere"));

  expect(result.stderr).toContain("packages/late");
  expect(result.stderr).toContain("@scope/elsewhere");
  expect(result.stderr).toContain("`elsewhere`");
  expect(result.code).not.toBe(0);
});

// `THERE IS NOTHING TO DISAGREE WITH` IS A DEFENSIBLE READING OF A MEMBER THAT
// DECLARES NO NAME, and it is the reading that makes `delete the name` the edit
// which silences this guard rather than tripping it. Refused instead, and pinned
// here so the choice is a decision rather than an untaken branch.
test("a member declaring no name is refused rather than passed over", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ version: "0.0.0" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": typeChecks,
  });

  expect(result.stderr).toContain("packages/late");
  expect(result.stderr).toContain("name");
  expect(result.code).not.toBe(0);
});

/**
 * The allowance the two arms below need, because they build and type-check
 * THREE members where every other test in this file builds two.
 *
 * A CONTROL THAT REPORTS THE MACHINE IS WORSE THAN A SLOW ONE, because its pair
 * then reads as `the guard refused a workspace it should have passed` -- the one
 * conclusion this file exists to make unavailable. Every other arm here takes
 * the suite's own ambient bound from the `applySuiteDeadline()` call at the top.
 */
const threeMembersBuildOneMore = 120_000;

/**
 * A workspace holding THREE members, all scoped, the last of which agrees with
 * its directory or does not.
 *
 * A THIRD PACKAGE AND NOT A SECOND, because two is the number this repository
 * happens to have: a guard written per instance passes every arm above and stops
 * at the members its author had in mind. THREE is the smallest count that is not
 * the one on disk.
 *
 * IN A THROWAWAY ROOT, AND THAT IS A REQUIREMENT RATHER THAN A PREFERENCE. bun
 * runs this suite in ONE PROCESS, so a third package created under the real
 * packages/ -- even for the length of one test -- would be seen by every later
 * caller of `declaredMembers(repoRoot)`, and their subjects would become
 * order-dependent on this file.
 */
function threeMembers(third: string): Record<string, string> {
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
  };
  for (const [directory, declared] of [
    ["first", "@scope/first"],
    ["second", "@scope/second"],
    ["third", third],
  ]) {
    files[`packages/${directory}/package.json`] = JSON.stringify({ name: declared });
    files[`packages/${directory}/tsconfig.json`] = memberTsconfig;
    files[`packages/${directory}/src/index.ts`] = typeChecks;
  }
  return files;
}

/**
 * `THE GUARD` MEANS EVERYTHING THAT WOULD HAVE TO CHANGE FOR A FURTHER PACKAGE
 * TO BE COVERED -- a fixture list, an allowlist, an exclude entry keyed to a
 * name.
 *
 * THE FIRST TWO ARE ASSERTED ABSENT FROM THE MESSAGE, which is the half that
 * makes this about the third package rather than about the workspace: a guard
 * reporting every member it looked at would satisfy `names the third` while
 * telling a reader to inspect three directories, two of which are correct.
 */
test(
  "a third member the guard was never written for is refused, by name",
  async () => {
    const result = await checkWorkspace(threeMembers("@scope/elsewhere"));

    expect(result.stderr).toContain("packages/third");
    expect(result.stderr).toContain("@scope/elsewhere");
    expect(result.stderr).not.toContain("packages/first");
    expect(result.stderr).not.toContain("packages/second");
    expect(result.code).not.toBe(0);
  },
  threeMembersBuildOneMore,
);

// THE POSITIVE CONTROL, and it is what separates `refused` from `the throwaway
// is malformed` -- a workspace that could not be read, a compiler that is not
// there, a member with no manifest all exit non-zero above and look identical.
// THE SAME THREE MEMBERS, with the third's name changed and nothing else, so
// what the pair measures is the disagreement rather than the tree.
test(
  "the same three members pass once the third agrees with its directory",
  async () => {
    const result = await checkWorkspace(threeMembers("@scope/third"));

    expect(result.stderr).toBe("");
    expect(result.code).toBe(0);
  },
  threeMembersBuildOneMore,
);

/** The specifier the root maps through `paths` and the member cannot reach. */
const sharedModule = "shared/thing";

/**
 * A workspace where the ROOT can answer a specifier the MEMBER cannot, which is
 * the exact shape the members' exclusion from the root type check forecloses.
 *
 * The root maps `shared/*` through `paths` and USES it from its own src/, so the
 * mapping is live rather than decorative. The member imports the same specifier
 * with no mapping of its own and no node_modules to walk to, so its resolution
 * is broken in the one way a root's `paths` would paper over.
 */
function memberReachingPastItsOwnResolution(): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        noEmit: true,
        strict: true,
        types: [],
        paths: { "shared/*": ["./shared/*.ts"] },
      },
      exclude: ["packages"],
    }),
    "shared/thing.ts": "export const thing = 1;\n",
    "src/root.ts": `import { thing } from "${sharedModule}";\nexport const atRoot: number = thing;\n`,
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": `import { thing } from "${sharedModule}";\nexport const inMember: number = thing;\n`,
  };
}

/**
 * A BROKEN RESOLUTION IS THE ONE FAILURE THE ROOT CHECK COULD ANSWER WRONGLY
 * rather than merely miss -- a root that holds a `paths` mapping resolves a
 * member's specifier through the ROOT'S map and reports success, so the greener
 * the root the less it means. Every other pair here moves a member's own SOURCE
 * and watches the colour follow.
 *
 * ONE TREE AND TWO COMMANDS, which is what makes this a measurement of the
 * responsibility MOVING rather than two unrelated readings. The root check is
 * silent on this workspace -- it excludes the member and has nothing to say --
 * and the fifth check names the member's own file. A tree where both were red,
 * or both silent, would leave `the coverage moved` unobserved.
 *
 * THE ROOT'S SILENCE IS ASSERTED AS A GREEN AND NOT AS AN ABSENCE OF THE
 * MEMBER'S NAME: a root that failed to compile at all would also fail to name
 * it, and would look identical here.
 */
test("a member whose own resolution is broken reddens the fifth check while the root check stays green", async () => {
  const root = workspace(memberReachingPastItsOwnResolution());
  try {
    const atRoot = await runTsc(root);
    const fifth = await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);

    expect(atRoot.output).toBe("");
    expect(atRoot.code).toBe(0);
    expect(fifth.stdout).toContain("packages/late/src/index.ts");
    expect(fifth.stdout).toContain("TS2307");
    expect(fifth.code).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A member's tsconfig carrying the mapping the ROOT's is forbidden to carry.
 *
 * THE MAPPING IS LIVE RATHER THAN DECORATIVE: the member imports the specifier
 * and the mapping is what answers it, so a workspace built this way type-checks
 * GREEN under every other check here. That is the whole hazard -- the false
 * green the members' exclusion from the root program exists to foreclose is
 * reconstructible from inside the member, and nothing about it looks broken.
 */
function memberMappingItsOwnResolution(mapping: Record<string, unknown>): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    ...mapping,
    "packages/late/shared/thing.ts": "export const thing = 1;\n",
    "packages/late/src/index.ts": `import { thing } from "${sharedModule}";\nexport const inMember: number = thing;\n`,
  };
}

/** The member's own options, plus whatever the mapping arrives by. */
const mappedMemberOptions = {
  target: "esnext",
  module: "esnext",
  moduleResolution: "bundler",
  noEmit: true,
  strict: true,
  types: [],
};

/** Where the mapping points, from a member's own directory. */
const memberPaths = { [`${sharedModule.split("/")[0] ?? ""}/*`]: ["./shared/*.ts"] };

/**
 * WHAT IT FORECLOSES is the false green rebuilt one directory down: a mapping in
 * the MEMBER'S OWN tsconfig answers a specifier without the member's
 * node_modules and without the framework's `exports` map, so every check in this
 * suite stays green while the resolution nobody checks is the one a stranger
 * will actually take.
 */
test("a member that maps a specifier to a file fails loudly", async () => {
  const result = await checkWorkspace(
    memberMappingItsOwnResolution({
      "packages/late/package.json": JSON.stringify({ name: "late" }),
      "packages/late/tsconfig.json": JSON.stringify({
        compilerOptions: { ...mappedMemberOptions, paths: memberPaths },
        include: ["src"],
      }),
    }),
  );

  expect(result.stderr).toContain("packages/late");
  expect(result.stderr).toContain("paths");
  expect(result.code).not.toBe(0);
});

// THE SNEAKIER HALF, and the reason the guard resolves the chain instead of
// reading the member's own file: `extends` puts the mapping in a document whose
// name nobody greps for, and a member whose tsconfig holds no `paths` key at all
// still compiles with one. Upstream flattens the chain -- `tsc --showConfig` --
// so what is inspected is the EFFECTIVE configuration rather than the bytes of
// one file in it.
test("a member that inherits the mapping through `extends` fails just as loudly", async () => {
  const result = await checkWorkspace(
    memberMappingItsOwnResolution({
      "packages/late/package.json": JSON.stringify({ name: "late" }),
      "packages/late/mapping.json": JSON.stringify({ compilerOptions: { paths: memberPaths } }),
      "packages/late/tsconfig.json": JSON.stringify({
        extends: "./mapping.json",
        compilerOptions: mappedMemberOptions,
        include: ["src"],
      }),
    }),
  );

  expect(result.stderr).toContain("packages/late");
  expect(result.stderr).toContain("paths");
  expect(result.code).not.toBe(0);
});

// THE ONE INPUT THE MAPPING GUARD PASSES AND SOMETHING ELSE MUST CATCH.
// `tsc --showConfig` on an unresolvable `extends` EXITS 0 and omits what it
// could not read, so the guard sees a configuration with no `paths` and has
// nothing to say -- which is `no mapping found` reported for a file nobody
// read. What refuses it is the type check immediately after, and this is where
// that division of labour is pinned: move either half and this reddens.
test("a member extending a file that is not there fails, at the check that reads it", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": JSON.stringify({
      extends: "./nope.json",
      compilerOptions: mappedMemberOptions,
      include: ["src"],
    }),
    "packages/late/src/index.ts": typeChecks,
  });

  expect(result.stdout).toContain("TS5083");
  expect(result.stdout).toContain("nope.json");
  expect(result.code).toBe(1);
});

// THE PAIR, and without it the two reds above are satisfied by a guard that
// refuses every member there is. `extends` IS KEPT rather than dropped, so what
// distinguishes this workspace from the one above is the MAPPING and not the
// inheritance -- a guard that refused `extends` itself would redden here too and
// would be forbidding a shape tsconfig exists to offer.
test("a member that extends a base carrying no mapping is left alone", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/mapping.json": JSON.stringify({ compilerOptions: { strict: true } }),
    "packages/late/tsconfig.json": JSON.stringify({
      extends: "./mapping.json",
      compilerOptions: mappedMemberOptions,
      include: ["src"],
    }),
    "packages/late/src/index.ts": typeChecks,
  });

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});
