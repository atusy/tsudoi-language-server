import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { prepareWorkspace } from "../scripts/workspaces.ts";
import { repoRoot, runCommand } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

/**
 * WHAT A FAILING BUILD SAYS, WHICH IS A DIFFERENT QUESTION FROM WHETHER IT
 * FAILED.
 *
 * THE BUILD IS THE FIRST READER OF A MEMBER'S SOURCE AND IT SPEAKS BEFORE THE
 * TYPE CHECK CAN. `prepareWorkspace` compiles every package through
 * `execFileSync`, which throws on a non-zero exit, so a type error in a member's
 * own source arrives as the BUILD's diagnostic and the per-member check never
 * runs. That same call is reached by TWO Definition-of-Done checks -- it is the
 * `bun test` preload as well as the fifth check -- so one invocation decides
 * what both of them print.
 *
 * AND A BARE `src/index.ts` IDENTIFIES NOTHING IN A REPOSITORY HOLDING MORE THAN
 * ONE `src/`. The reader must be able to act on the failing run's OWN output
 * without opening a second source to find out whose file it was.
 */

/** A source file that cannot type-check, and a `broken` a diagnostic can name. */
const typeError = 'export const broken: number = "not a number";\n';

/** A source file that type-checks, so a build from it cannot be the red. */
const typeChecks = "export const fine: number = 1;\n";

/**
 * The member's own check config, carrying NO `paths` and NO `types` -- the
 * absence of `types` is what keeps these workspaces free of node_modules.
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

/**
 * The member's BUILD config, and it carries no `extends` deliberately: that is
 * what makes `rootDir`, `outDir` and `include` resolve against this file rather
 * than against whatever directory the compiler was started in, which is the
 * property the byte-comparison arm below measures instead of assuming.
 */
const memberBuildTsconfig = JSON.stringify({
  compilerOptions: {
    target: "esnext",
    module: "esnext",
    moduleResolution: "bundler",
    declaration: true,
    outDir: "dist",
    rootDir: "src",
    noEmit: false,
    strict: true,
    types: [],
  },
  include: ["src"],
});

/** A workspace whose one member publishes an artifact, from the given source. */
function memberBuilding(source: string): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    "packages/emitter/package.json": JSON.stringify({ name: "emitter" }),
    "packages/emitter/tsconfig.json": memberTsconfig,
    "packages/emitter/tsconfig.build.json": memberBuildTsconfig,
    "packages/emitter/src/index.ts": source,
  };
}

/** The compiler this repository declares, reached the way the scripts reach it. */
const tsc = join(repoRoot, "node_modules", ".bin", "tsc");

/**
 * THE INVOCATION THIS REPLACED, spelled here rather than kept in production so
 * the pair below is a measurement and not an argument: the compiler started
 * INSIDE the member with its config named by bare filename.
 */
function builtFromInsideTheMember(member: string): ReturnType<typeof spawnSync> {
  return spawnSync(tsc, ["-p", "tsconfig.build.json"], { cwd: member, encoding: "utf8" });
}

/** Every file the member's build emitted, as bytes, keyed by name. */
function emitted(root: string): Record<string, string> {
  const dist = join(root, "packages", "emitter", "dist");
  const files: Record<string, string> = {};
  for (const entry of readdirSync(dist).sort()) {
    files[entry] = readFileSync(join(dist, entry), "utf8");
  }
  return files;
}

/**
 * THE REAL ENTRY POINT IN A SPAWNED CHILD WITH PIPED STDIO, which is the only
 * reading that answers the question asked: the builder inherits stdio, so what a
 * reader sees is whatever the child's streams carried, and a test calling
 * `prepareWorkspace` in-process would be reading its own terminal.
 */
test("a member whose source cannot compile is named beside the file", async () => {
  const root = workspace(memberBuilding(typeError));
  try {
    const result = await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);

    // TOGETHER IN ONE PATH AND NOT ON TWO LINES: the criterion is that the
    // reader can act on this string alone, and a member printed elsewhere in the
    // output leaves them joining two facts by hand.
    expect(result.stdout).toContain(join("packages", "emitter", "src", "index.ts"));
    expect(result.stdout).toContain("TS2322");
    expect(result.code).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE DEGENERATE CONTROL, RUN RATHER THAN DESCRIBED. Without it the arm above is
 * satisfied by any implementation that happens to print an absolute path, and
 * nothing here would say the invocation is what put the member in the message.
 */
test("the invocation this replaced names the file and no member at all", () => {
  const root = workspace(memberBuilding(typeError));
  try {
    const old = builtFromInsideTheMember(join(root, "packages", "emitter"));

    expect(old.stdout).toContain(join("src", "index.ts"));
    expect(old.stdout).not.toContain("emitter");
    expect(old.status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE INVOCATION CHANGED AND THE ARTIFACT DID NOT, measured on the bytes rather
 * than argued from `extends` being absent -- a config that gained one would
 * start resolving `outDir` against the working directory, and the two runs would
 * write to two different places with every check still green.
 */
test("the same tree emits the same artifact whichever directory the build ran from", () => {
  const fromRoot = workspace(memberBuilding(typeChecks));
  const fromMember = workspace(memberBuilding(typeChecks));
  try {
    prepareWorkspace(fromRoot);
    const old = builtFromInsideTheMember(join(fromMember, "packages", "emitter"));

    expect(old.status).toBe(0);
    expect(emitted(fromRoot)).toEqual(emitted(fromMember));
  } finally {
    rmSync(fromRoot, { recursive: true, force: true });
    rmSync(fromMember, { recursive: true, force: true });
  }
});
