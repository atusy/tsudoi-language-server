import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { declaredMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { throwawayOnly } from "./helpers/perturbation.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * The post-build artifact detector over a staged copy of this repository. The
 * generic negative cases live in test/artifact-detector.test.ts; this file binds
 * the positive route to the actual packages and manifests we ship.
 */

/** This workspace's own scope, which is the directory its members are linked under. */
const scope = "@atusy";

/**
 * The path one write is about to take, refused unless it stays inside the stage.
 *
 * EVERY DESTINATION AND NOT THE COPIED FILES ALONE. `git ls-files` cannot emit a
 * `..`, so guarding only that loop would be guarding the one input that needs it
 * least -- while A MANIFEST'S OWN `name` reaches this function too, and a name
 * carrying a separator would put a link outside the stage. The rule this
 * repository lost a working tree to is that no write takes its path from
 * configuration unchecked, not that some configuration is trustworthy.
 *
 * LEXICAL AND NOT `realpathSync`: every destination here is a path that does not
 * exist yet, and a guard requiring existence could not stand in front of one at
 * all.
 */
function inside(root: string, part: string): string {
  const path = join(root, part);
  if (path !== root && !path.startsWith(root + sep)) {
    throw new Error(`${path} is outside the throwaway ${root}, so nothing here will write to it`);
  }
  return path;
}

/**
 * A staged copy of this checkout, with a node_modules of its OWN.
 *
 * THE BORROWED node_modules THE PERTURBATION STAGE USES IS WRONG HERE, AND IT IS
 * WRONG SILENTLY -- MEASURED, which is why it is written down.
 * Symlinking the real node_modules gives every member a SECOND ROUTE to the real
 * framework, and the resolution trace this check reads is last-writer-wins per
 * specifier: the staged handler's own declarations import
 * `@atusy/tsudoi-language-server/types`, that import resolves out of the
 * borrowed directory into the REAL checkout, and the framework's subpaths are
 * then reported answering from the real `dist/` no matter what the stage holds.
 * The unperturbed stage FAILED that way -- a refusal naming files outside
 * itself -- which is a reading about this machine's install and not about the
 * stage.
 *
 * SO THE SCOPE IS RELINKED AND THE REST IS BORROWED: every member of this
 * workspace points at the STAGE's copy of itself, under the name that member
 * declares, and everything else -- the upstream protocol packages, `@types/node`
 * -- is symlinked out of the real tree, where it is neither tracked nor cheap.
 * That is what `bun install` would have written in the stage, and nothing here
 * can then answer a workspace specifier from outside the stage.
 *
 * EVERY MEMBER AND NOT THE HANDLERS ALONE: the framework is a member too, and it
 * is the one whose route this file is about.
 */
function stageThisCheckout(): { readonly root: string; dispose: () => void } {
  const root = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-own-subpaths-")));
  const listed = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  if (listed.status !== 0) {
    throw new Error(`git ls-files failed in ${repoRoot}, so no stage could be built`);
  }
  for (const tracked of listed.stdout.split("\0").filter((entry) => entry !== "")) {
    const destination = inside(root, tracked);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(repoRoot, tracked), destination);
  }
  // THE FIFTH CHECK ASKS git WHICH FILES THE TREE OWNS, so a stage that is not a
  // staged repository has no programs at all and is refused before the detector
  // is reached -- the same reason test/helpers/workspace.ts stages what it writes.
  spawnSync("git", ["init", "-q"], { cwd: root, stdio: "pipe" });
  spawnSync("git", ["-c", "core.excludesFile=/dev/null", "add", "-A"], {
    cwd: root,
    stdio: "pipe",
  });
  const modules = inside(root, "node_modules");
  mkdirSync(modules);
  for (const entry of readdirSync(join(repoRoot, "node_modules"))) {
    if (entry !== scope) {
      symlinkSync(join(repoRoot, "node_modules", entry), inside(modules, entry), "dir");
    }
  }
  mkdirSync(inside(modules, scope));
  for (const member of declaredMembers(root)) {
    const declared = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      name: string;
    };
    symlinkSync(member, inside(modules, declared.name), "dir");
  }
  return {
    root,
    dispose: (): void => {
      rmSync(throwawayOnly(root), { recursive: true, force: true });
    },
  };
}

/** Runs the fifth Definition-of-Done check over a staged copy of this checkout. */
async function checkStage(perturb: (root: string) => void = (): void => {}): Promise<CliResult> {
  const stage = stageThisCheckout();
  try {
    perturb(stage.root);
    return await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [stage.root]);
  } finally {
    stage.dispose();
  }
}

test("this repository's own published subpaths answer from the artifact its build writes", async () => {
  const result = await checkStage();

  // THE GREEN HALF, AND WITHOUT IT THE RED BELOW IS SATISFIED BY A CHECK THAT
  // REFUSES EVERY COPY OF THIS CHECKOUT: unperturbed, the same stage passes.
  expect(`${String(result.code)} ${result.stdout}${result.stderr}`).toBe("0 ");
});
