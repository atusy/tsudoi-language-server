import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { buildOrder } from "../scripts/workspaces.ts";

applySuiteDeadline();

const SPAWN_TIMEOUT_MS = 30_000;

function releasePackages(): readonly { readonly name: string; readonly version: string }[] {
  return buildOrder(repoRoot).flatMap((directory) => {
    const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as {
      readonly name: string;
      readonly version: string;
      readonly private?: boolean;
    };
    return manifest.private === true ? [] : [{ name: manifest.name, version: manifest.version }];
  });
}

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
        error: "release manifest packages do not match the workspace release order",
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

test("the registry smoke refuses a package set missing a workspace member before installing", () => {
  const release = mkdtempSync(join(tmpdir(), "tsudoi-registry-smoke-incomplete-"));
  try {
    const packages = releasePackages().slice(0, -1);
    writeFileSync(
      join(release, "release-manifest.json"),
      `${JSON.stringify({ releaseVersion: "0.1.0-alpha.0", packages })}\n`,
    );
    const result = spawnSync(process.execPath, ["scripts/smoke-registry-release.ts", release], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: "" },
      timeout: SPAWN_TIMEOUT_MS,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "release manifest packages do not match the workspace release order",
    );
    expect(result.stderr).not.toContain("could not complete");
  } finally {
    rmSync(release, { recursive: true, force: true });
  }
});
