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
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { declaredMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { throwawayOnly } from "./helpers/perturbation.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE SUBPATHS THE ARTIFACT DETECTOR EXISTS FOR ARE THIS REPOSITORY'S OWN, AND
 * NOTHING ELSE IN THE SUITE BINDS IT TO THEM.
 *
 * WHAT IS MISSING WITHOUT THIS FILE, MEASURED RATHER THAN ARGUED: make
 * `publishedSubpaths` skip every manifest whose name begins with this
 * workspace's scope -- so the detector is blind to every package this repository
 * ships and reads only strangers' -- and the suite is green and the fifth check
 * exits 0. Every other arm drives the detector against a workspace this suite
 * WRITES, whose producer is named `@staged/producer`, so a detector that refused
 * to look at `@atusy/*` would keep all of them.
 *
 * SO THE FIXTURE HERE IS THIS CHECKOUT, staged as a copy and left in a state
 * this repository must never be in. The residue the detector was built for is
 * this repository's alone: tsudoi's `exports` map ends in `default: ./src/*.ts`,
 * so with the declaration missing the compiler falls through and reads SOURCE at
 * exit 0 -- the flip that lived in prose for six sprints. No `@staged/producer`
 * can stand in for it, because the flip is a property of tsudoi's own map.
 *
 * THE COPY IS NOT AN ISOLATION MEASURE, IT IS HOW THE READING IS TAKEN AT ALL.
 * The state under measurement is `this workspace's artifact does not answer`,
 * and the working tree may never be put in it -- every other file in the suite
 * is resolving through that artifact at the same moment.
 *
 * AND THE WEAKENING ABOVE CANNOT BE A PERTURBATION RECORD, WHICH IS MEASURED
 * RATHER THAN CHOSEN -- this dashboard's rule is that a perturbation recorded
 * only as prose is not recorded, so the exemption is owed a reason. The
 * instrument re-runs an arm file inside a stage of TRACKED files, and this file
 * stages a checkout of its own: in that stage `repoRoot` IS the stage, the stage
 * holds no `.git`, and `git ls-files` exits non-zero -- MEASURED, both arms fail
 * reading `git ls-files failed in /var/folders/...`, for a reason that is not
 * the weakening, which is the same class of blocker already recorded there for
 * test/published-specifier.test.ts. A SECOND AND INDEPENDENT REFUSAL STANDS
 * BEHIND IT: `reRun` refuses any arm file importing helpers/perturbation.ts, and
 * this one does, for the guard below. So the weakening is a reading taken by
 * hand and kept in the sprint dashboard, named here because the registry's
 * silence about this file would otherwise read as an oversight.
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

/**
 * The one edit that leaves the framework's artifact WITHOUT ITS DECLARATIONS,
 * applied to the stage's own build config.
 *
 * A BUILD THAT RUNS AND EMITS NOTHING THE `types` ARM NAMES is the state this
 * check owns and the fourth check cannot see: the detector runs AFTER the build,
 * so the artifact it reads is one that SURVIVED one. Removing `dist/` instead
 * would measure a state the build immediately repairs.
 *
 * AND THE HANDLERS STILL BUILD UNDER IT, which is what keeps this arm's red
 * attributable: they resolve the framework through the same fall-through the
 * detector is about, compile against its SOURCE, and the run reaches the
 * refusal instead of dying in the build with an apparatus failure.
 */
function emitNoDeclarations(root: string): void {
  const config = join(root, "packages", "tsudoi-language-server", "tsconfig.build.json");
  const build = JSON.parse(readFileSync(config, "utf8")) as {
    compilerOptions: Record<string, unknown>;
  };
  build.compilerOptions.declaration = false;
  writeFileSync(config, JSON.stringify(build, null, 2));
}

test("this repository's own published subpaths answer from the artifact its build writes", async () => {
  const result = await checkStage();

  // THE GREEN HALF, AND WITHOUT IT THE RED BELOW IS SATISFIED BY A CHECK THAT
  // REFUSES EVERY COPY OF THIS CHECKOUT: unperturbed, the same stage passes.
  expect(`${String(result.code)} ${result.stdout}${result.stderr}`).toBe("0 ");
});

test("a build of THIS repository that emits no declarations is refused, naming tsudoi's own subpath and the source that answered", async () => {
  const result = await checkStage(emitNoDeclarations);

  expect(result.code).not.toBe(0);
  // THE SPECIFIER IS THIS REPOSITORY'S OWN, WRITTEN OUT: a detector that reads
  // only strangers' manifests keeps every other arm in this suite and loses this
  // line. What the surface IS belongs to test/package-shape.test.ts; what this
  // asserts is that the detector reached it at all.
  expect(result.stderr).toContain("@atusy/tsudoi-language-server/types");
  // AND THE FLIP ITSELF, WHICH IS WHY THIS FILE'S FIXTURE CANNOT BE A STAGED
  // STRANGER: the map's last arm is source, so the compiler answers a file the
  // package does not publish -- at exit 0, with nothing printed, which is the
  // whole reason the trace and not a colour is what this check reads.
  expect(result.stderr).toContain(join("packages", "tsudoi-language-server", "src", "types.ts"));
  expect(result.stderr).toContain(join("packages", "tsudoi-language-server", "dist", "types.d.ts"));
});
