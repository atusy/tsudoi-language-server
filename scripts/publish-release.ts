import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { verifyProvenance } from "./verify-provenance.ts";
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

const NPM_REGISTRY = "https://registry.npmjs.org/";
const NPM_VIEW_TIMEOUT_MS = 30_000;
const SLSA_PROVENANCE = "https://slsa.dev/provenance/v1";
const RELEASE_WORKFLOW = ".github/workflows/publish.yml";

function fail(message: string): never {
  console.error(`publish-release: ${message}`);
  process.exit(1);
}

function readReleaseManifest(directory: string): {
  readonly releaseVersion: string;
  readonly packages: readonly ValidReleaseEntry[];
} {
  const manifestPath = join(directory, "release-manifest.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (cause) {
    fail(`cannot read ${manifestPath}: ${String(cause)}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    fail(`${manifestPath} is not an alpha release manifest`);
  }
  const manifest = parsed as ReleaseManifest;
  if (
    typeof manifest.releaseVersion !== "string" ||
    !/^\d+\.\d+\.\d+-alpha\.\d+$/.test(manifest.releaseVersion) ||
    !Array.isArray(manifest.packages) ||
    manifest.packages.length === 0
  ) {
    fail(`${manifestPath} is not an alpha release manifest`);
  }
  const packages = (manifest.packages as unknown[]).map((candidate) => {
    if (typeof candidate !== "object" || candidate === null) {
      fail(`${manifestPath} contains an invalid package entry`);
    }
    const entry = candidate as ReleaseEntry;
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
  const viewed = spawnSync(
    "npm",
    ["view", packageSpec, "dist.integrity", "--json", "--registry", NPM_REGISTRY],
    { encoding: "utf8", timeout: NPM_VIEW_TIMEOUT_MS },
  );
  if (viewed.error !== undefined) {
    if ((viewed.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      fail(`npm view timed out after ${String(NPM_VIEW_TIMEOUT_MS)}ms for ${packageSpec}`);
    }
    fail(`npm view could not complete for ${packageSpec}: ${viewed.error.message}`);
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

function registryAlphaVersion(packageName: string): string | null {
  const viewed = spawnSync(
    "npm",
    ["view", packageName, "dist-tags.alpha", "--json", "--registry", NPM_REGISTRY],
    { encoding: "utf8", timeout: NPM_VIEW_TIMEOUT_MS },
  );
  if (viewed.error !== undefined) {
    if ((viewed.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      fail(`npm view timed out after ${String(NPM_VIEW_TIMEOUT_MS)}ms for ${packageName}`);
    }
    fail(`npm view could not complete for ${packageName}: ${viewed.error.message}`);
  }
  if (viewed.status !== 0) {
    if (/\bE404\b/.test(viewed.stderr)) {
      return null;
    }
    fail(`npm view failed for ${packageName}: ${viewed.stderr.trim()}`);
  }
  let version: unknown;
  try {
    version = JSON.parse(viewed.stdout);
  } catch (cause) {
    fail(`npm view returned invalid JSON for ${packageName}: ${String(cause)}`);
  }
  if (typeof version !== "string") {
    fail(`npm view returned an invalid alpha dist-tag for ${packageName}: ${String(version)}`);
  }
  return version;
}

function registryAttestations(packageSpec: string): {
  readonly url: string;
  readonly provenance: { readonly predicateType: string };
} {
  const viewed = spawnSync(
    "npm",
    ["view", packageSpec, "dist.attestations", "--json", "--registry", NPM_REGISTRY],
    { encoding: "utf8", timeout: NPM_VIEW_TIMEOUT_MS },
  );
  if (viewed.error !== undefined) {
    fail(
      `npm view could not complete provenance preflight for ${packageSpec}: ${viewed.error.message}`,
    );
  }
  if (viewed.status !== 0) {
    fail(`npm view failed provenance preflight for ${packageSpec}: ${viewed.stderr.trim()}`);
  }
  let value: unknown;
  try {
    value = JSON.parse(viewed.stdout);
  } catch (cause) {
    fail(`npm view returned invalid provenance JSON for ${packageSpec}: ${String(cause)}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${packageSpec} has no provenance metadata`);
  }
  const attestations = value as Record<string, unknown>;
  const provenance = attestations.provenance;
  if (
    typeof attestations.url !== "string" ||
    !attestations.url.startsWith(`${NPM_REGISTRY}-/npm/v1/attestations/`) ||
    typeof provenance !== "object" ||
    provenance === null ||
    Array.isArray(provenance) ||
    (provenance as Record<string, unknown>).predicateType !== SLSA_PROVENANCE
  ) {
    fail(`${packageSpec} does not expose npmjs SLSA provenance`);
  }
  return attestations as {
    readonly url: string;
    readonly provenance: { readonly predicateType: string };
  };
}

function alphaVersionParts(version: string): readonly bigint[] {
  const match = /^(\d+)\.(\d+)\.(\d+)-alpha\.(\d+)$/.exec(version);
  if (match === null) {
    fail(`alpha dist-tag has an unsupported version: ${version}`);
  }
  return match.slice(1).map((part) => BigInt(part));
}

function compareAlphaVersions(left: string, right: string): number {
  const leftParts = alphaVersionParts(left);
  const rightParts = alphaVersionParts(right);
  for (const [index, leftPart] of leftParts.entries()) {
    const rightPart = rightParts[index];
    if (rightPart === undefined) {
      fail(`cannot compare alpha versions: ${left} and ${right}`);
    }
    if (leftPart < rightPart) return -1;
    if (leftPart > rightPart) return 1;
  }
  return 0;
}

function tarballIdentity(path: string): { readonly name: string; readonly version: string } {
  let source: string;
  try {
    source = execFileSync("tar", ["-xOf", path, "package/package.json"], { encoding: "utf8" });
  } catch (cause) {
    fail(`cannot read package/package.json from ${path}: ${String(cause)}`);
  }
  let manifest: unknown;
  try {
    manifest = JSON.parse(source);
  } catch (cause) {
    fail(`tarball package.json is invalid in ${path}: ${String(cause)}`);
  }
  if (typeof manifest !== "object" || manifest === null) {
    fail(`tarball package.json is not an object in ${path}`);
  }
  const { name, version } = manifest as { readonly name?: unknown; readonly version?: unknown };
  if (typeof name !== "string" || typeof version !== "string") {
    fail(`tarball package.json has no string name and version in ${path}`);
  }
  return { name, version };
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
if (
  new Set(release.packages.map(({ name, version }) => `${name}@${version}`)).size !==
    release.packages.length ||
  new Set(release.packages.map(({ filename }) => filename)).size !== release.packages.length
) {
  fail("release manifest contains duplicate identities or filenames");
}
const tarballs = release.packages.map((entry) => {
  const path = join(directory, entry.filename);
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`release tarball is missing: ${path}`);
  }
  const bytes = readFileSync(path);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== entry.sha256) {
    fail(`release tarball checksum does not match: ${path}`);
  }
  const identity = tarballIdentity(path);
  if (identity.name !== entry.name || identity.version !== entry.version) {
    fail(
      `tarball identity does not match ${entry.name}@${entry.version}: ${identity.name}@${identity.version}`,
    );
  }
  return {
    entry,
    path,
    sha512: createHash("sha512").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
  };
});

const publication = tarballs.map((tarball) => {
  const packageSpec = `${tarball.entry.name}@${tarball.entry.version}`;
  const published = registryIntegrity(packageSpec);
  const currentAlpha = registryAlphaVersion(tarball.entry.name);
  if (published !== null && published !== tarball.integrity) {
    fail(`registry integrity does not match the release tarball: ${packageSpec}`);
  }
  if (published !== null && currentAlpha !== tarball.entry.version) {
    fail(`already-published ${packageSpec} is not the current alpha dist-tag`);
  }
  if (
    published === null &&
    currentAlpha !== null &&
    compareAlphaVersions(currentAlpha, tarball.entry.version) >= 0
  ) {
    fail(
      `${packageSpec} would not advance the alpha dist-tag from its current ${currentAlpha} version`,
    );
  }
  return { ...tarball, published: published !== null };
});

if (option === "--provenance") {
  const expectedRef = process.env.GITHUB_REF;
  const expectedCommit = process.env.GITHUB_SHA;
  if (
    expectedRef !== `refs/tags/v${release.releaseVersion}` ||
    expectedCommit === undefined ||
    !/^[0-9a-f]{40}$/.test(expectedCommit)
  ) {
    fail("GITHUB_REF and GITHUB_SHA do not identify the exact release tag and commit");
  }
  const frameworkManifest = JSON.parse(
    readFileSync(join(repoRoot, "packages/tsudoi-language-server/package.json"), "utf8"),
  ) as { readonly repository?: { readonly url?: unknown } };
  const repositoryValue = frameworkManifest.repository?.url;
  if (typeof repositoryValue !== "string") fail("framework repository has no URL");
  const repository = repositoryValue.replace(/^git\+/, "").replace(/\.git$/, "");
  try {
    await Promise.all(
      publication.flatMap((tarball) => {
        if (!tarball.published) return [];
        const packageSpec = `${tarball.entry.name}@${tarball.entry.version}`;
        const attestations = registryAttestations(packageSpec);
        return [
          verifyProvenance({
            packageName: tarball.entry.name,
            version: tarball.entry.version,
            sha512: tarball.sha512,
            attestationUrl: attestations.url,
            repository,
            workflowPath: RELEASE_WORKFLOW,
            gitRef: expectedRef,
            gitCommit: expectedCommit,
          }),
        ];
      }),
    );
  } catch (cause) {
    fail(`existing package provenance preflight failed: ${String(cause)}`);
  }
}

for (const tarball of publication) {
  if (tarball.published) {
    console.log(
      `already published with matching integrity: ${tarball.entry.name}@${tarball.entry.version}`,
    );
    continue;
  }
  const args = [
    "publish",
    tarball.path,
    "--registry",
    NPM_REGISTRY,
    "--access",
    "public",
    "--tag",
    "alpha",
  ];
  if (option === "--provenance") {
    args.push("--provenance");
  }
  execFileSync("npm", args, { stdio: "inherit" });
}
