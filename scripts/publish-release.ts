import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildOrder } from "./workspaces.ts";

interface ReleaseEntry {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly filename?: unknown;
  readonly sha256?: unknown;
}

interface ReleaseManifest {
  readonly releaseVersion?: unknown;
  readonly packages?: unknown;
}

interface ValidReleaseEntry {
  readonly name: string;
  readonly version: string;
  readonly filename: string;
  readonly sha256: string;
}

function fail(message: string): never {
  console.error(`publish-release: ${message}`);
  process.exit(1);
}

function readReleaseManifest(directory: string): {
  readonly releaseVersion: string;
  readonly packages: readonly ValidReleaseEntry[];
} {
  const manifestPath = join(directory, "release-manifest.json");
  let manifest: ReleaseManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ReleaseManifest;
  } catch (cause) {
    fail(`cannot read ${manifestPath}: ${String(cause)}`);
  }
  if (
    typeof manifest.releaseVersion !== "string" ||
    !/^\d+\.\d+\.\d+-alpha\.\d+$/.test(manifest.releaseVersion) ||
    !Array.isArray(manifest.packages) ||
    manifest.packages.length === 0
  ) {
    fail(`${manifestPath} is not an alpha release manifest`);
  }
  const packages = (manifest.packages as ReleaseEntry[]).map((entry) => {
    if (
      typeof entry.name !== "string" ||
      typeof entry.version !== "string" ||
      entry.version !== manifest.releaseVersion ||
      typeof entry.filename !== "string" ||
      entry.filename !== basename(entry.filename) ||
      typeof entry.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(entry.sha256)
    ) {
      fail(`${manifestPath} contains an invalid package entry`);
    }
    return entry as ValidReleaseEntry;
  });
  return { releaseVersion: manifest.releaseVersion, packages };
}

function expectedPackages(
  root: string,
): readonly { readonly name: string; readonly version: string }[] {
  return buildOrder(root).flatMap((dir) => {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      readonly name?: unknown;
      readonly version?: unknown;
      readonly private?: unknown;
    };
    if (manifest.private === true) {
      return [];
    }
    if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
      fail(`${join(dir, "package.json")} must declare string name and version fields`);
    }
    return [{ name: manifest.name, version: manifest.version }];
  });
}

function registryIntegrity(packageSpec: string): string | null {
  const viewed = spawnSync("npm", ["view", packageSpec, "dist.integrity", "--json"], {
    encoding: "utf8",
  });
  if (viewed.error !== undefined) {
    fail(`npm view could not start for ${packageSpec}: ${viewed.error.message}`);
  }
  if (viewed.status !== 0) {
    if (/\bE404\b/.test(viewed.stderr)) {
      return null;
    }
    fail(`npm view failed for ${packageSpec}: ${viewed.stderr.trim()}`);
  }
  let integrity: unknown;
  try {
    integrity = JSON.parse(viewed.stdout);
  } catch (cause) {
    fail(`npm view returned invalid JSON for ${packageSpec}: ${String(cause)}`);
  }
  if (typeof integrity !== "string" || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(integrity)) {
    fail(`npm view returned an invalid integrity for ${packageSpec}: ${String(integrity)}`);
  }
  return integrity;
}

const [directoryArgument, option, ...unexpected] = process.argv.slice(2);
if (
  directoryArgument === undefined ||
  (option !== undefined && option !== "--provenance") ||
  unexpected.length !== 0
) {
  fail("usage: bun run scripts/publish-release.ts <release-directory> [--provenance]");
}

const directory = resolve(directoryArgument);
const release = readReleaseManifest(directory);
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const expected = expectedPackages(repoRoot);
const actual = release.packages.map(({ name, version }) => ({ name, version }));
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  fail("release manifest packages do not match the workspace release order");
}
const tarballs = release.packages.map((entry) => {
  const path = join(directory, entry.filename);
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`release tarball is missing: ${path}`);
  }
  const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actual !== entry.sha256) {
    fail(`release tarball checksum does not match: ${path}`);
  }
  return {
    entry,
    path,
    integrity: `sha512-${createHash("sha512").update(readFileSync(path)).digest("base64")}`,
  };
});

const publication = tarballs.map((tarball) => {
  const packageSpec = `${tarball.entry.name}@${tarball.entry.version}`;
  const published = registryIntegrity(packageSpec);
  if (published !== null && published !== tarball.integrity) {
    fail(`registry integrity does not match the release tarball: ${packageSpec}`);
  }
  return { ...tarball, published: published !== null };
});

for (const tarball of publication) {
  if (tarball.published) {
    console.log(
      `already published with matching integrity: ${tarball.entry.name}@${tarball.entry.version}`,
    );
    continue;
  }
  const args = ["publish", tarball.path, "--access", "public", "--tag", "alpha"];
  if (option === "--provenance") {
    args.push("--provenance");
  }
  execFileSync("npm", args, { stdio: "inherit" });
}
