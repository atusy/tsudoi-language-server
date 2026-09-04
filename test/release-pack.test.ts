import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildOrder } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

interface ReleaseEntry {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly filename?: unknown;
  readonly sha256?: unknown;
}

interface ReleaseManifest {
  readonly releaseVersion?: unknown;
  readonly packages?: ReleaseEntry[];
}

function packageManifest(dir: string): { name?: unknown; version?: unknown; private?: unknown } {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    name?: unknown;
    version?: unknown;
    private?: unknown;
  };
}

test("the release packer writes ordered, checksummed tarballs for every public package", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-pack-"));
  const destination = join(parent, "release");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);

    const manifest = JSON.parse(
      readFileSync(join(destination, "release-manifest.json"), "utf8"),
    ) as ReleaseManifest;
    const expected = buildOrder(repoRoot)
      .map(packageManifest)
      .filter((entry) => entry.private !== true);

    expect(manifest.releaseVersion).toBe("0.1.0-alpha.0");
    expect(manifest.packages?.map(({ name, version }) => ({ name, version }))).toEqual(
      expected.map(({ name, version }) => ({ name, version })),
    );
    expect(readdirSync(destination).sort()).toEqual(
      [
        ...(manifest.packages ?? []).map((entry) => String(entry.filename)),
        "release-manifest.json",
      ].sort(),
    );

    for (const entry of manifest.packages ?? []) {
      expect(typeof entry.filename).toBe("string");
      const tarball = readFileSync(join(destination, String(entry.filename)));
      expect(entry.sha256).toBe(createHash("sha256").update(tarball).digest("hex"));
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the release packer refuses a non-empty destination", () => {
  const destination = mkdtempSync(join(tmpdir(), "tsudoi-release-pack-nonempty-"));
  try {
    writeFileSync(join(destination, "keep.txt"), "do not overwrite\n");
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(packed.status).not.toBe(0);
    expect(packed.stderr).toContain("destination must be empty");
    expect(readFileSync(join(destination, "keep.txt"), "utf8")).toBe("do not overwrite\n");
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
