import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
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
import { appendFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
appendFileSync(process.env.NPM_LOG, JSON.stringify(args) + "\\n");
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
    ...(process.env.ADD_ATTESTATIONS === "1" ? {
      "dist.attestations": {
        url: process.env.BAD_ATTESTATION_URL === "1"
          ? "https://example.invalid/attestations/" + name + "@" + version
          : "https://registry.npmjs.org/-/npm/v1/attestations/" + name + "@" + version,
        provenance: {
          predicateType: process.env.BAD_PREDICATE === "1"
            ? "https://example.invalid/provenance"
            : "https://slsa.dev/provenance/v1",
        },
      },
    } : {}),
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
if (args[0] === "install") process.exit(0);
if (args[0] === "audit" && args[1] === "signatures") {
  if (process.env.FAIL_AUDIT === "1") {
    process.stderr.write("signature verification failed\\n");
    process.exit(1);
  }
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
      NPM_LOG: join(parent, "npm.log"),
      NODE_OPTIONS: `--import=${pathToFileURL(join(repoRoot, "test/helpers/fake-attestation-fetch.ts")).href}`,
      GITHUB_REF: "refs/tags/v0.1.0-alpha.0",
      GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
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

    const missingProvenance = spawnSync(
      "node",
      ["scripts/verify-registry-release.ts", release, "--require-provenance"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env,
      },
    );
    expect(missingProvenance.status).not.toBe(0);
    expect(missingProvenance.stderr).toContain("registry attestations");

    for (const invalid of [
      { BAD_ATTESTATION_URL: "1", error: "does not expose npmjs SLSA provenance" },
      { BAD_PREDICATE: "1", error: "does not expose npmjs SLSA provenance" },
    ]) {
      const result = spawnSync(
        "node",
        ["scripts/verify-registry-release.ts", release, "--require-provenance"],
        {
          cwd: repoRoot,
          encoding: "utf8",
          timeout: SPAWN_TIMEOUT_MS,
          env: { ...env, ADD_ATTESTATIONS: "1", ...invalid },
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(invalid.error);
    }
    const preflightCalls = readFileSync(join(parent, "npm.log"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    expect(preflightCalls.some((args) => args[0] === "install" || args[0] === "audit")).toBeFalse();

    const provenance = spawnSync(
      "node",
      ["scripts/verify-registry-release.ts", release, "--require-provenance"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: { ...env, ADD_ATTESTATIONS: "1" },
      },
    );
    expect(`${String(provenance.status)} ${provenance.stderr}`).toBe("0 ");
    expect(provenance.stdout).toContain(
      "verified 7 public registry packages at 0.1.0-alpha.0 with provenance",
    );
    const calls = readFileSync(join(parent, "npm.log"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    const install = calls.find((args) => args[0] === "install");
    expect(install?.slice(0, 3)).toEqual(["install", "--ignore-scripts", "--save-exact"]);
    expect(install?.filter((arg) => arg.endsWith("@0.1.0-alpha.0"))).toHaveLength(7);
    expect(calls.some((args) => args[0] === "audit" && args[1] === "signatures")).toBeTrue();

    const wrongSource = spawnSync(
      "node",
      ["scripts/verify-registry-release.ts", release, "--require-provenance"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: { ...env, ADD_ATTESTATIONS: "1", BAD_SOURCE_REF: "1" },
      },
    );
    expect(wrongSource.status).not.toBe(0);
    expect(wrongSource.stderr).toContain("provenance workflow does not match");

    const failedAudit = spawnSync(
      "node",
      ["scripts/verify-registry-release.ts", release, "--require-provenance"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: { ...env, ADD_ATTESTATIONS: "1", FAIL_AUDIT: "1" },
      },
    );
    expect(failedAudit.status).not.toBe(0);
    expect(failedAudit.stderr).toContain("signature verification failed");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
