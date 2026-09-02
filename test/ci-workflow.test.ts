import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const workflowPath = join(repoRoot, ".github", "workflows", "ci.yml");

test("the CI workflow is a hardened reading of the Definition of Done", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const uses = workflow.match(/^\s*- uses: (.+)$/gm) ?? [];

  expect(workflow).toContain("pull_request:");
  expect(workflow).toMatch(/push:\n\s+branches:\n\s+- main/);
  expect(workflow).toMatch(/permissions:\n\s+contents: read/);
  expect(workflow).toContain("cancel-in-progress: true");
  expect(workflow).toContain("timeout-minutes: 45");

  expect(uses.length).toBeGreaterThan(0);
  expect(uses.every((line) => /@[0-9a-f]{40}(?:\s+#.*)?$/.test(line))).toBeTrue();
  expect(workflow).toContain("oven-sh/setup-bun@");
  expect(workflow).toContain("denoland/setup-deno@");
  expect(workflow).toContain("bun-version: 1.3.13");
  expect(workflow).toContain("deno-version: v2.9.4");

  expect(workflow).toContain("bun install --frozen-lockfile");
  expect(workflow).toContain("bun add --global oxlint@latest oxfmt@latest");
  expect(workflow).toContain("oxlint --version");
  expect(workflow).toContain("oxfmt --version");
  expect(workflow).toContain("bun run scripts/definition-of-done.ts");

  const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    devDependencies: Record<string, string>;
  };
  expect(manifest.devDependencies).not.toHaveProperty("oxlint");
  expect(manifest.devDependencies).not.toHaveProperty("oxfmt");
});
