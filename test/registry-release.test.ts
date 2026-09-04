import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

const SPAWN_TIMEOUT_MS = 30_000;

test("the registry verifier binds metadata and channels to the retained release", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-registry-release-"));
  const release = join(parent, "release");
  const bin = join(parent, "bin");
  try {
    const packed = spawnSync("node", ["scripts/pack-release.ts", release], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(packed.status).toBe(0);
    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
const release = JSON.parse(readFileSync(join(process.env.RELEASE_DIR, "release-manifest.json"), "utf8"));
const manifests = readdirSync(join(process.env.REPO_ROOT, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => JSON.parse(readFileSync(join(process.env.REPO_ROOT, "packages", entry.name, "package.json"), "utf8")));
if (args[0] === "view") {
  const separator = args[1].lastIndexOf("@");
  const name = args[1].slice(0, separator);
  const version = args[1].slice(separator + 1);
  const manifest = manifests.find((candidate) => candidate.name === name);
  const entry = release.packages.find((candidate) => candidate.name === name);
  const bytes = readFileSync(join(process.env.RELEASE_DIR, entry.filename));
  const metadata = {
    name,
    version,
    "dist.integrity": "sha512-" + createHash("sha512").update(bytes).digest("base64"),
    "dist-tags": {
      alpha: version,
      ...(process.env.ADD_LATEST === "1" ? { latest: version } : {}),
    },
    repository: manifest.repository,
    ...(manifest.peerDependencies === undefined ? {} : { peerDependencies: manifest.peerDependencies }),
    ...(manifest.peerDependenciesMeta === undefined ? {} : { peerDependenciesMeta: manifest.peerDependenciesMeta }),
  };
  process.stdout.write(JSON.stringify(metadata));
  process.exit(0);
}
if (args[0] === "access" && args[1] === "get" && args[2] === "status") {
  process.stdout.write(JSON.stringify({ [args[3]]: "public" }));
  process.exit(0);
}
process.exit(2);
`,
    );
    chmodSync(fakeNpm, 0o755);
    const env = {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
      RELEASE_DIR: release,
      REPO_ROOT: repoRoot,
    };
    const verified = spawnSync("node", ["scripts/verify-registry-release.ts", release], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
      env,
    });
    expect(`${String(verified.status)} ${verified.stderr}`).toBe("0 ");
    expect(verified.stdout).toContain("verified 7 public registry packages at 0.1.0-alpha.0");

    const latest = spawnSync("node", ["scripts/verify-registry-release.ts", release], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
      env: { ...env, ADD_LATEST: "1" },
    });
    expect(latest.status).not.toBe(0);
    expect(latest.stderr).toContain("not latest");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
