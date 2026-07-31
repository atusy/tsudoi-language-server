import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";
import { prepareWorkspace } from "../scripts/workspaces.ts";
import { runTsc } from "./helpers/typecheck.ts";

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

/** Writes `files` under a fresh directory, creating parents as needed. */
function workspace(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-workspace-"));
  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  return root;
}

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

// The one state where a package is covered by NOTHING: excluded from the root
// program by path, and outside what the workspace patterns declare. It exits
// non-zero NAMING the directory, because `some package is uncovered` sends a
// reader looking through every directory the exclusion reaches.
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
  expect(result.code).not.toBe(0);
});

// THE SAME UNCOVERED PACKAGE, BEHIND AN EXCLUSION WRITTEN AS A GLOB, which
// tsconfig permits everywhere it permits a path and which a reader reaches for
// the moment they want `packages/*` excluded but `packages` itself kept.
//
// A LITERAL READING OF THE ENTRY LOSES THIS ONE SILENTLY: `packages/*` names no
// directory on disk, so a check that joins it to the root and walks finds
// nothing, reports nothing, and exits 0 -- the uncovered package is missed by
// the one thing looking for it. The exclusion is expanded by the same enumerator
// `workspaces` is read with, so the two keys are interpreted the same way.
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
  expect(result.code).not.toBe(0);
});

// THE OTHER HALF OF READING THE ENTRY AS A PATTERN, and it only appears once
// the entry is expanded: `packages/**` matches straight INTO a member's
// installed dependencies, so a match that starts there names a package.json
// belonging to a stranger. Nothing in this repository will ever type-check it,
// which would make the report a permanent red about somebody else's file.
// MEASURED without the node_modules filter: exit 1 naming
// `packages/declared/node_modules/stranger`.
test("an exclusion reaching into node_modules reports nobody else's package", async () => {
  const result = await checkWorkspace({
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/declared"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages/**"] }),
    "packages/declared/package.json": JSON.stringify({ name: "declared" }),
    "packages/declared/tsconfig.json": memberTsconfig,
    "packages/declared/src/index.ts": typeChecks,
    "packages/declared/node_modules/stranger/package.json": JSON.stringify({ name: "stranger" }),
  });

  expect(result.stderr).toBe("");
  expect(result.code).toBe(0);
});

// `I found no members` and `I was given no way to find them` must not produce
// the same observation, since this check is the only thing looking at the paths
// the root check gave up.
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
 * WHAT THE WITHDRAWAL IS FOR, AND IT IS NOT A TYPE ERROR.
 *
 * Every pair above moves a member's own SOURCE and watches the colour follow. A
 * broken RESOLUTION is the different failure, and the only one the root check
 * could ever have answered WRONGLY rather than merely missed: a root that holds
 * a `paths` mapping resolves a member's specifier through the ROOT'S map and
 * reports success, so the greener the root the less it means.
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
 * THE LINK THE BUILDER PUTS IN A MEMBER'S node_modules IS ABSOLUTE, so a
 * checkout that is MOVED OR RENAMED leaves every member pointing at a path that
 * is no longer there.
 *
 * WHY THAT NEEDS A REPAIR RATHER THAN A DIAGNOSTIC: the failure is loud and it
 * is also PERMANENT. MEASURED on this repository with the link redirected to a
 * path that does not exist, the fifth check reports
 * `src/hover.ts(31,36): error TS2307: Cannot find module
 * '@atusy/tsudoi-language-server/types'` and every rerun reports it again --
 * a builder that skips whatever it finds cannot be the thing that fixes it. The
 * diagnostic names the member's SOURCE for a fault that lives in node_modules,
 * so a reader is sent to the one file that is not wrong.
 *
 * A LINK THAT RESOLVES IS STILL LEFT ALONE, and the asymmetry is the whole
 * decision: a real directory there is somebody's install and not this script's
 * to overwrite. Only an entry that resolves to NOTHING is replaced, because
 * nothing is what it currently provides.
 *
 * ASSERTED BY WHERE THE LINK LANDS, NOT BY ITS EXISTENCE: `lstatSync` succeeds
 * on the broken link too, which is exactly how it survived.
 */
test("a member's link to a moved checkout is replaced rather than skipped", () => {
  const root = workspace({
    "package.json": JSON.stringify({ name: "@probe/root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/late/package.json": JSON.stringify({ name: "late" }),
    "packages/late/tsconfig.json": memberTsconfig,
    "packages/late/src/index.ts": typeChecks,
  });
  try {
    const link = join(root, "packages", "late", "node_modules", "@probe", "root");
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(join(root, "nowhere"), link, "dir");

    prepareWorkspace(root);

    expect(realpathSync(link)).toBe(realpathSync(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
