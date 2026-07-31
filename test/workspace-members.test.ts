import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";

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
