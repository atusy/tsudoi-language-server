import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { declaredMembers } from "../../scripts/workspaces.ts";
import { repoRoot } from "../helpers/spawn.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

interface WorkflowStep {
  env?: Record<string, string>;
  if?: unknown;
  "continue-on-error"?: unknown;
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
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
    release?: { types?: string[] };
  };
  permissions?: { contents?: string; "id-token"?: string };
  concurrency?: { group?: string; queue?: string; "cancel-in-progress"?: boolean };
  jobs?: {
    checks?: WorkflowJob;
    quality?: WorkflowJob;
    prepare?: WorkflowJob;
    publish?: WorkflowJob;
    verify?: WorkflowJob;
  };
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

test("the CI workflow is configured to run all checks", () => {
  const workflow = parseWorkflow(readWorkflow());
  const checks = workflow.jobs?.checks;
  const steps = checks?.steps ?? [];
  const uses = steps.flatMap((step) => (typeof step.uses === "string" ? [step.uses] : []));
  const commands = commandLinesOf(steps);
  const checkSteps = steps.filter((step) => step.run?.trim() === "bun run check");

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
  const nodeSetup = steps.find((step) => step.uses?.startsWith("actions/setup-node@"));
  const bunSetup = steps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"));
  const denoSetup = steps.find((step) => step.uses?.startsWith("denoland/setup-deno@"));
  expect(nodeSetup?.with).toEqual({
    "node-version": "24.20.0",
    "package-manager-cache": false,
  });
  expect(bunSetup?.with?.["bun-version"]).toBe("1.3.13");
  expect(denoSetup?.with?.["deno-version"]).toBe("v2.9.4");

  expect(commands).toContain("sudo apt-get install --yes fish xonsh zsh");
  expect(commands).toContain("bun install --frozen-lockfile");
  expect(commands).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(commands).toContain("oxlint --version");
  expect(commands).toContain("oxfmt --version");
  expect(checkSteps).toHaveLength(1);
  expect(checkSteps[0]?.if).toBeUndefined();
  expect(checkSteps[0]?.["continue-on-error"]).toBeUndefined();

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
  const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  expect(manifest.scripts.lint).toBe(
    "oxlint --format unix --deny-warnings --report-unused-disable-directives-severity error",
  );
});

test("a commented check command does not satisfy the workflow contract", () => {
  const source = readWorkflow();
  const commented = source.replace("        run: bun run check", "        # run: bun run check");
  expect(commented).not.toBe(source);

  const commands = commandLinesOf(parseWorkflow(commented).jobs?.checks?.steps ?? []);
  expect(commands).not.toContain("bun run check");
});

test("a published GitHub prerelease drives an approved OIDC job for one exact alpha tag", () => {
  const source = readFileSync(publishWorkflowPath, "utf8");
  const workflow = parseWorkflow(source);
  const quality = workflow.jobs?.quality;
  const prepare = workflow.jobs?.prepare;
  const publish = workflow.jobs?.publish;
  const verify = workflow.jobs?.verify;
  const qualitySteps = quality?.steps ?? [];
  const prepareSteps = prepare?.steps ?? [];
  const publishSteps = publish?.steps ?? [];
  const verifySteps = verify?.steps ?? [];
  const qualityCommands = commandLinesOf(qualitySteps);
  const prepareCommands = commandLinesOf(prepareSteps);
  const publishCommands = commandLinesOf(publishSteps);
  const verifyCommands = commandLinesOf(verifySteps);
  const validationStep = prepareSteps.find((step) => step.name === "Validate the release tag");
  const validationCommands = commandLinesOf(
    validationStep === undefined ? [] : [validationStep],
  ).filter((command) => !command.startsWith("#"));
  const uses = [...qualitySteps, ...prepareSteps, ...publishSteps, ...verifySteps].flatMap(
    (step) => (typeof step.uses === "string" ? [step.uses] : []),
  );

  expect(workflow.on).toEqual({ release: { types: ["published"] } });
  expect(workflow.permissions).toEqual({ contents: "read" });
  expect(workflow.concurrency).toEqual({
    group: "npm-alpha-publish",
    queue: "max",
    "cancel-in-progress": false,
  });
  expect(quality).toMatchObject({
    "runs-on": "ubuntu-latest",
    "timeout-minutes": 60,
  });
  expect(quality?.if).toBeUndefined();
  expect(quality?.permissions?.["id-token"]).toBeUndefined();
  expect(quality?.environment).toBeUndefined();
  expect(prepare?.permissions?.["id-token"]).toBeUndefined();
  expect(prepare?.environment).toBeUndefined();
  expect(prepare?.["runs-on"]).toBe("ubuntu-latest");
  expect(prepare?.if).toBeUndefined();
  expect(prepare?.needs).toBe("quality");
  expect(prepare?.["continue-on-error"]).toBeUndefined();
  expect(publish?.environment).toBe("npm");
  expect(publish?.needs).toBe("prepare");
  expect(publish?.permissions).toEqual({ contents: "read", "id-token": "write" });
  expect(publish?.["runs-on"]).toBe("ubuntu-latest");
  expect(publish?.if).toBeUndefined();
  expect(publish?.["continue-on-error"]).toBeUndefined();
  expect(verify?.needs).toEqual(["prepare", "publish"]);
  expect(verify?.permissions).toEqual({ contents: "read" });
  expect(verify?.permissions?.["id-token"]).toBeUndefined();
  expect(verify?.environment).toBeUndefined();
  expect(verify?.["runs-on"]).toBe("ubuntu-latest");
  expect(verify?.if).toBeUndefined();
  expect(verify?.["continue-on-error"]).toBeUndefined();
  expect(
    [...qualitySteps, ...prepareSteps, ...publishSteps, ...verifySteps].every(
      (step) => step.if === undefined && step["continue-on-error"] === undefined,
    ),
  ).toBeTrue();
  expect(uses.every((value) => /^[^@\s]+@[0-9a-f]{40}$/.test(value))).toBeTrue();
  expect(verifyCommands).toContain(
    'node scripts/verify-registry-release.js "$RUNNER_TEMP/npm-release-bundle/release" --require-provenance',
  );
  expect(verifyCommands).toContain(
    'node scripts/smoke-registry-release.ts "$RUNNER_TEMP/npm-release-bundle/release"',
  );
  expect(qualitySteps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.ref).toBe(
    "${{ github.sha }}",
  );
  expect(prepareSteps.find((step) => step.uses?.startsWith("actions/checkout@"))?.with?.ref).toBe(
    "${{ github.sha }}",
  );
  expect(qualitySteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.20.0",
    "package-manager-cache": false,
  });
  expect(prepareSteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.20.0",
    "registry-url": "https://registry.npmjs.org",
    "package-manager-cache": false,
  });
  expect(publishSteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.20.0",
    "registry-url": "https://registry.npmjs.org",
    "package-manager-cache": false,
  });
  expect(verifySteps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with).toEqual({
    "node-version": "24.20.0",
    "registry-url": "https://registry.npmjs.org",
    "package-manager-cache": false,
  });
  expect(
    qualitySteps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"))?.with?.["bun-version"],
  ).toBe("1.3.13");
  expect(
    qualitySteps.find((step) => step.uses?.startsWith("denoland/setup-deno@"))?.with?.[
      "deno-version"
    ],
  ).toBe("v2.9.4");
  expect(
    verifySteps.find((step) => step.uses?.startsWith("oven-sh/setup-bun@"))?.with?.["bun-version"],
  ).toBe("1.3.13");
  expect(
    verifySteps.find((step) => step.uses?.startsWith("denoland/setup-deno@"))?.with?.[
      "deno-version"
    ],
  ).toBe("v2.9.4");

  expect(qualityCommands).toContain("sudo apt-get install --yes fish xonsh zsh");
  expect(qualityCommands).toContain("bun install --frozen-lockfile");
  expect(qualityCommands).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(qualityCommands).toContain("oxlint --version");
  expect(qualityCommands).toContain("oxfmt --version");
  expect(qualityCommands).toContain("bun run check");
  expect(prepareCommands).toContain("bun install --frozen-lockfile");
  expect(prepareCommands).not.toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(prepareCommands).toContain('test "$(npm --version)" = "11.19.0"');
  expect(publishCommands).toContain('test "$(npm --version)" = "11.19.0"');
  expect(source).not.toContain("npm@latest");
  expect(prepareCommands).toContain('bun run scripts/pack-release.ts "$RUNNER_TEMP/npm-release"');
  expect(prepareCommands).toContain(
    "find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS",
  );
  expect(publishCommands).toContain(
    'cd "$RUNNER_TEMP/npm-release-bundle" && sha256sum --check SHA256SUMS',
  );
  expect(publishCommands).toContain(
    'node scripts/publish-release.js "$RUNNER_TEMP/npm-release-bundle/release" --provenance',
  );
  expect(publishCommands).not.toContain("bun install --frozen-lockfile");
  expect(publishCommands.some((command) => command.startsWith("bun "))).toBeFalse();
  const publishSetupIndex = publishSteps.findIndex((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  const npmVersionIndex = publishSteps.findIndex(
    (step) => step.name === "Verify the publishing npm version",
  );
  const downloadIndex = publishSteps.findIndex((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  const checksumIndex = publishSteps.findIndex((step) => step.name === "Verify the release bundle");
  const publishIndex = publishSteps.findIndex(
    (step) => step.name === "Publish with npm Trusted Publishing",
  );
  expect(publishSetupIndex).toBeGreaterThanOrEqual(0);
  expect(npmVersionIndex).toBeGreaterThan(publishSetupIndex);
  expect(downloadIndex).toBeGreaterThan(npmVersionIndex);
  expect(checksumIndex).toBeGreaterThan(downloadIndex);
  expect(publishIndex).toBeGreaterThan(checksumIndex);
  expect(validationCommands).toContain('test "$RELEASE_TAG" = "v${release_version}"');
  expect(validationCommands).toContain('test "$RELEASE_PRERELEASE" = "true"');
  expect(validationStep?.env).toEqual({
    RELEASE_PRERELEASE: "${{ github.event.release.prerelease }}",
    RELEASE_TAG: "${{ github.event.release.tag_name }}",
  });
  expect(validationCommands).toContain(
    'tag_commit="$(git rev-list -n 1 "refs/tags/$RELEASE_TAG")"',
  );
  expect(validationCommands).toContain('test "$GITHUB_REF" = "refs/tags/$RELEASE_TAG"');
  expect(validationCommands).toContain('test "$GITHUB_SHA" = "$tag_commit"');
  expect(prepareCommands).toContain("git fetch --no-tags origin main");
  expect(prepareCommands).toContain(
    'git merge-base --is-ancestor "$tag_commit" refs/remotes/origin/main',
  );
  expect(source).not.toMatch(/NODE_AUTH_TOKEN|NPM_TOKEN|secrets\./);

  const validationIndex = prepareSteps.findIndex(
    (step) => step.name === "Validate the release tag",
  );
  const installIndex = prepareSteps.findIndex(
    (step) => step.run?.trim() === "bun install --frozen-lockfile",
  );
  const packStepIndex = prepareSteps.findIndex(
    (step) => step.run?.trim() === 'bun run scripts/pack-release.ts "$RUNNER_TEMP/npm-release"',
  );
  expect(validationIndex).toBeGreaterThanOrEqual(0);
  expect(installIndex).toBeGreaterThan(validationIndex);
  expect(packStepIndex).toBeGreaterThan(installIndex);

  const bundleIndex = prepareSteps.findIndex(
    (step) => step.name === "Build the immutable release bundle",
  );
  const bundle = prepareSteps[bundleIndex]?.run ?? "";
  expect(bundleIndex).toBeGreaterThan(packStepIndex);
  expect(bundle).toContain("scripts/smoke-registry-release.ts");
  expect(bundle).toContain("bun build scripts/publish-release.ts --target=node");
  expect(bundle).toContain("scripts/publish-release.js");
  expect(bundle).toContain("bun build scripts/verify-registry-release.ts --target=node");
  expect(bundle).toContain("scripts/verify-registry-release.js");
  expect(bundle).toContain("scripts/workspaces.ts");
  expect(bundle).toContain("tests/helpers/lsp.ts");
  expect(bundle).toContain("tests/helpers/spawn.ts");

  expect(verify?.["timeout-minutes"]).toBe(35);
  const verifySetupIndex = verifySteps.findIndex((step) =>
    step.uses?.startsWith("actions/setup-node@"),
  );
  const verifyDownloadIndex = verifySteps.findIndex((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  const verifyChecksumIndex = verifySteps.findIndex(
    (step) => step.name === "Verify the release bundle",
  );
  const metadataIndex = verifySteps.findIndex((step) => step.name === "Verify registry metadata");
  const smokeIndex = verifySteps.findIndex(
    (step) => step.name === "Smoke-test fresh Bun and Deno consumers",
  );
  expect(verifySetupIndex).toBeGreaterThanOrEqual(0);
  expect(verifyDownloadIndex).toBeGreaterThan(verifySetupIndex);
  expect(verifyChecksumIndex).toBeGreaterThan(verifyDownloadIndex);
  expect(metadataIndex).toBeGreaterThan(verifyChecksumIndex);
  expect(smokeIndex).toBeGreaterThan(metadataIndex);
});
