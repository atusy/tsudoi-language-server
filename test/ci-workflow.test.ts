import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

interface WorkflowStep {
  uses?: string;
  run?: string;
  with?: Record<string, string>;
}

interface WorkflowJob {
  "runs-on"?: string;
  "timeout-minutes"?: number;
  steps?: WorkflowStep[];
}

interface Workflow {
  on?: {
    pull_request?: unknown;
    push?: { branches?: string[] };
    schedule?: Array<{ cron?: string }>;
  };
  permissions?: { contents?: string };
  concurrency?: { group?: string; "cancel-in-progress"?: boolean };
  jobs?: { checks?: WorkflowJob };
}

const workflowPath = join(repoRoot, ".github", "workflows", "ci.yml");
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

  expect(workflow.on).toHaveProperty("pull_request");
  expect(workflow.on?.push?.branches).toEqual(["main"]);
  expect(workflow.on?.schedule).toEqual([{ cron: "17 2 * * *" }]);
  expect(workflow.permissions).toEqual({ contents: "read" });
  expect(workflow.concurrency?.["cancel-in-progress"]).toBeTrue();
  expect(checks?.["runs-on"]).toBe("ubuntu-latest");
  expect(checks?.["timeout-minutes"]).toBe(45);

  expect(uses.length).toBeGreaterThan(0);
  expect(uses.every((value) => /^[^@\s]+@[0-9a-f]{40}$/.test(value))).toBeTrue();
  const bunSetup = steps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"));
  const denoSetup = steps.find((step) => step.uses?.startsWith("denoland/setup-deno@"));
  expect(bunSetup?.with?.["bun-version"]).toBe("1.3.13");
  expect(denoSetup?.with?.["deno-version"]).toBe("v2.9.4");

  expect(commands).toContain("sudo apt-get install --yes fish zsh");
  expect(commands).toContain("bun install --frozen-lockfile");
  expect(commands).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(commands).toContain("oxlint --version");
  expect(commands).toContain("oxfmt --version");
  expect(
    commands.filter((command) => command === "bun run scripts/definition-of-done.ts"),
  ).toHaveLength(1);

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
