import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

const SPAWN_TIMEOUT_MS = 30_000;

test("the registry smoke refuses malformed release metadata before installing", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-registry-smoke-invalid-"));
  try {
    const cases = [
      { source: "null\n", error: "is not an object" },
      {
        source: '{"releaseVersion":"0.1.0-alpha.0","packages":[null]}\n',
        error: "package entry is not an object",
      },
      {
        source:
          '{"releaseVersion":"0.1.0-alpha.0","packages":[{"name":"@atusy/other","version":"0.1.0-alpha.0"}]}\n',
        error: "does not contain the framework and completion smoke packages",
      },
    ];
    for (const [index, invalid] of cases.entries()) {
      const release = join(parent, String(index));
      mkdirSync(release);
      writeFileSync(join(release, "release-manifest.json"), invalid.source);
      const result = spawnSync("node", ["scripts/smoke-registry-release.ts", release], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(invalid.error);
      expect(result.stderr).not.toContain("could not complete");
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
