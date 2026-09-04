import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

interface WorkflowStep {
  if?: unknown;
  "continue-on-error"?: unknown;
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
}

interface WorkflowJob {
  environment?: unknown;
  if?: unknown;
  "continue-on-error"?: unknown;
  needs?: unknown;
  outputs?: Record<string, string>;
  permissions?: { contents?: string; "id-token"?: string };
  "runs-on"?: string;
  "timeout-minutes"?: number;
  steps?: WorkflowStep[];
}

interface Workflow {
  on?: {
    pull_request?: unknown;
    push?: { branches?: string[]; tags?: string[] };
    schedule?: Array<{ cron?: string }>;
    workflow_dispatch?: {
      inputs?: Record<string, { required?: boolean; type?: string }>;
    };
  };
  permissions?: { contents?: string; "id-token"?: string };
  concurrency?: { group?: string; "cancel-in-progress"?: boolean };
  jobs?: { checks?: WorkflowJob; prepare?: WorkflowJob; publish?: WorkflowJob };
}

const workflowPath = join(repoRoot, ".github", "workflows", "ci.yml");
const publishWorkflowPath = join(repoRoot, ".github", "workflows", "publish.yml");
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

function readWorkflow(): string {
  return readFileSync(workflowPath, "utf8");
}

function parseWorkflow(source: string): Workflow {
  return parse(source) as Workflow;
}

function commandLinesOf(steps: WorkflowStep[]): string[] {
  return steps.flatMap((step) =>
    typeof step.run === "string"
      ? step.run
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [],
  );
}

test("the CI workflow is a hardened reading of the Definition of Done", () => {
  const workflow = parseWorkflow(readWorkflow());
  const checks = workflow.jobs?.checks;
  const steps = checks?.steps ?? [];
  const uses = steps.flatMap((step) => (typeof step.uses === "string" ? [step.uses] : []));
  const commands = commandLinesOf(steps);
  const definitionOfDoneSteps = steps.filter(
    (step) => step.run?.trim() === "bun run scripts/definition-of-done.ts",
  );

  expect(workflow.on).toHaveProperty("pull_request");
  expect(workflow.on?.push?.branches).toEqual(["main"]);
  expect(workflow.on?.push?.tags).toEqual(["v*-alpha*"]);
  expect(workflow.on?.schedule).toEqual([{ cron: "17 2 * * *" }]);
  expect(workflow.permissions).toEqual({ contents: "read" });
  expect(workflow.concurrency?.["cancel-in-progress"]).toBeTrue();
  expect(checks?.["runs-on"]).toBe("ubuntu-latest");
  expect(checks?.["timeout-minutes"]).toBe(45);
  expect(checks?.if).toBeUndefined();
  expect(checks?.["continue-on-error"]).toBeUndefined();

  expect(uses.length).toBeGreaterThan(0);
  expect(uses.every((value) => /^[^@\s]+@[0-9a-f]{40}$/.test(value))).toBeTrue();
  const bunSetup = steps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"));
  const denoSetup = steps.find((step) => step.uses?.startsWith("denoland/setup-deno@"));
  expect(bunSetup?.with?.["bun-version"]).toBe("1.3.13");
  expect(denoSetup?.with?.["deno-version"]).toBe("v2.9.4");

  expect(commands).toContain("sudo apt-get install --yes fish xonsh zsh");
  expect(commands).toContain("bun install --frozen-lockfile");
  expect(commands).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(commands).toContain("oxlint --version");
  expect(commands).toContain("oxfmt --version");
  expect(definitionOfDoneSteps).toHaveLength(1);
  expect(definitionOfDoneSteps[0]?.if).toBeUndefined();
  expect(definitionOfDoneSteps[0]?.["continue-on-error"]).toBeUndefined();

  const pinnedOxDeclarations = [repoRoot, ...declaredMembers(repoRoot)].flatMap((dir) => {
    const manifestPath = join(dir, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    return dependencyFields.flatMap((field) => {
      const dependencies = manifest[field];
      if (typeof dependencies !== "object" || dependencies === null) {
        return [];
      }
      return ["oxlint", "oxfmt"].flatMap((tool) =>
        Object.hasOwn(dependencies, tool)
          ? [`${join(relative(repoRoot, dir), "package.json")}:${field}.${tool}`]
          : [],
      );
    });
  });
  expect(pinnedOxDeclarations).toEqual([]);
});

test("the release lint command rejects warnings and stale suppressions", () => {
  const result = spawnSync("bun", ["run", "scrum.ts"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(`${String(result.status)} ${result.stderr}`).toBe("0 ");

  const dashboard = JSON.parse(result.stdout) as {
    definition_of_done?: { checks?: Array<{ name?: unknown; run?: unknown }> };
  };
  const lintChecks = (dashboard.definition_of_done?.checks ?? []).filter(
    (check) => check.name === "Lint passes",
  );
  expect(lintChecks).toEqual([
    {
      name: "Lint passes",
      run: "oxlint --format unix --deny-warnings --report-unused-disable-directives-severity error",
    },
  ]);
});

test("a commented Definition of Done command does not satisfy the workflow contract", () => {
  const source = readWorkflow();
  const commented = source.replace(
    "        run: bun run scripts/definition-of-done.ts",
    "        # run: bun run scripts/definition-of-done.ts",
  );
  expect(commented).not.toBe(source);

  const commands = commandLinesOf(parseWorkflow(commented).jobs?.checks?.steps ?? []);
  expect(commands).not.toContain("bun run scripts/definition-of-done.ts");
});

test("publishing is a manually approved OIDC job for one exact alpha tag", () => {
  const source = readFileSync(publishWorkflowPath, "utf8");
  const workflow = parseWorkflow(source);
  const prepare = workflow.jobs?.prepare;
  const publish = workflow.jobs?.publish;
  const prepareSteps = prepare?.steps ?? [];
  const publishSteps = publish?.steps ?? [];
  const prepareCommands = commandLinesOf(prepareSteps);
  const publishCommands = commandLinesOf(publishSteps);
  const uses = [...prepareSteps, ...publishSteps].flatMap((step) =>
    typeof step.uses === "string" ? [step.uses] : [],
  );

  expect(workflow.on).toEqual({
    workflow_dispatch: {
      inputs: {
        "release-tag": { required: true, type: "string" },
      },
    },
  });
  expect(workflow.permissions).toEqual({ contents: "read" });
  expect(workflow.concurrency).toEqual({
    group: "npm-alpha-publish",
    "cancel-in-progress": false,
  });
  expect(prepare?.permissions?.["id-token"]).toBeUndefined();
  expect(prepare?.environment).toBeUndefined();
  expect(prepare?.["runs-on"]).toBe("ubuntu-latest");
  expect(prepare?.if).toBeUndefined();
  expect(prepare?.["continue-on-error"]).toBeUndefined();
  expect(publish?.environment).toBe("npm");
  expect(publish?.needs).toBe("prepare");
  expect(publish?.permissions).toEqual({ contents: "read", "id-token": "write" });
  expect(publish?.["runs-on"]).toBe("ubuntu-latest");
  expect(publish?.if).toBeUndefined();
  expect(publish?.["continue-on-error"]).toBeUndefined();
  expect(
    [...prepareSteps, ...publishSteps].every(
      (step) => step.if === undefined && step["continue-on-error"] === undefined,
    ),
  ).toBeTrue();
  expect(uses.every((value) => /^[^@\s]+@[0-9a-f]{40}$/.test(value))).toBeTrue();
  expect(prepareSteps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.ref).toBe(
    "${{ inputs.release-tag }}",
  );
  expect(prepareSteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.10.0",
    "registry-url": "https://registry.npmjs.org",
  });
  expect(publishSteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.10.0",
    "registry-url": "https://registry.npmjs.org",
  });
  expect(
    prepareSteps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"))?.with?.["bun-version"],
  ).toBe("1.3.13");
  expect(
    prepareSteps.find((step) => step.uses?.startsWith("denoland/setup-deno@"))?.with?.[
      "deno-version"
    ],
  ).toBe("v2.9.4");

  expect(prepareCommands).toContain("sudo apt-get install --yes fish xonsh zsh");
  expect(prepareCommands).toContain("bun install --frozen-lockfile");
  expect(prepareCommands).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(prepareCommands).toContain('test "$(npm --version)" = "11.6.0"');
  expect(publishCommands).toContain('test "$(npm --version)" = "11.6.0"');
  expect(source).not.toContain("npm@latest");
  expect(prepareCommands).toContain("bun run scripts/definition-of-done.ts");
  expect(prepareCommands).toContain('bun run scripts/pack-release.ts "$RUNNER_TEMP/npm-release"');
  expect(prepareCommands).toContain(
    "find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS",
  );
  expect(publishCommands).toContain(
    'cd "$RUNNER_TEMP/npm-release-bundle" && sha256sum --check SHA256SUMS',
  );
  expect(publishCommands).toContain(
    'node scripts/publish-release.ts "$RUNNER_TEMP/npm-release-bundle/release" --provenance',
  );
  expect(publishCommands).not.toContain("bun install --frozen-lockfile");
  expect(publishCommands.some((command) => command.startsWith("bun "))).toBeFalse();
  expect(source).toContain("refs/tags/$RELEASE_TAG");
  expect(source).toContain("v${release_version}");
  expect(source).toContain('test "$GITHUB_REF" = "refs/tags/$RELEASE_TAG"');
  expect(source).toContain('test "$GITHUB_SHA" = "$tag_commit"');
  expect(prepareCommands).toContain("git fetch --no-tags origin main");
  expect(prepareCommands).toContain(
    'git merge-base --is-ancestor "$tag_commit" refs/remotes/origin/main',
  );
  expect(source).not.toMatch(/NODE_AUTH_TOKEN|NPM_TOKEN|secrets\./);

  const definitionIndex = prepareCommands.indexOf("bun run scripts/definition-of-done.ts");
  const packIndex = prepareCommands.indexOf(
    'bun run scripts/pack-release.ts "$RUNNER_TEMP/npm-release"',
  );
  const validationIndex = prepareSteps.findIndex(
    (step) => step.name === "Validate the release tag",
  );
  const definitionStepIndex = prepareSteps.findIndex(
    (step) => step.run?.trim() === "bun run scripts/definition-of-done.ts",
  );
  const packStepIndex = prepareSteps.findIndex(
    (step) => step.run?.trim() === 'bun run scripts/pack-release.ts "$RUNNER_TEMP/npm-release"',
  );
  expect(validationIndex).toBeGreaterThanOrEqual(0);
  expect(definitionStepIndex).toBeGreaterThan(validationIndex);
  expect(packStepIndex).toBeGreaterThan(definitionStepIndex);
  expect(definitionIndex).toBeGreaterThanOrEqual(0);
  expect(packIndex).toBeGreaterThan(definitionIndex);
});
