import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { verifyProvenance } from "./verify-provenance.ts";
import { buildOrder } from "./workspaces.ts";

const NPM_REGISTRY = "https://registry.npmjs.org/";
const NPM_TIMEOUT_MS = 30_000;
const NPM_INSTALL_TIMEOUT_MS = 120_000;
const FRAMEWORK = "@atusy/tsudoi-language-server";
const SLSA_PROVENANCE = "https://slsa.dev/provenance/v1";
const RELEASE_WORKFLOW = ".github/workflows/publish.yml";

interface PackageManifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly private?: unknown;
  readonly repository?: unknown;
  readonly peerDependencies?: unknown;
  readonly peerDependenciesMeta?: unknown;
}

interface ReleaseEntry {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly filename?: unknown;
}

function fail(message: string): never {
  console.error(`verify-registry-release: ${message}`);
  process.exit(1);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (cause) {
    fail(`cannot read ${path}: ${String(cause)}`);
  }
}

function npmJson(args: readonly string[], subject: string): unknown {
  const result = spawnSync("npm", [...args, "--json", "--registry", NPM_REGISTRY], {
    encoding: "utf8",
    timeout: NPM_TIMEOUT_MS,
  });
  if (result.error !== undefined) {
    if ((result.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      fail(`npm ${args[0] ?? "command"} timed out for ${subject}`);
    }
    fail(`npm ${args[0] ?? "command"} could not complete for ${subject}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`npm ${args[0] ?? "command"} failed for ${subject}: ${result.stderr.trim()}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (cause) {
    fail(`npm ${args[0] ?? "command"} returned invalid JSON for ${subject}: ${String(cause)}`);
  }
}

function npmRun(
  args: readonly string[],
  subject: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): void {
  const result = spawnSync("npm", [...args, "--registry", NPM_REGISTRY], {
    cwd,
    encoding: "utf8",
    env,
    timeout: NPM_INSTALL_TIMEOUT_MS,
  });
  if (result.error !== undefined) {
    fail(`npm ${args[0] ?? "command"} could not complete for ${subject}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`npm ${args[0] ?? "command"} failed for ${subject}: ${result.stderr.trim()}`);
  }
}

function object(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${subject} is not an object`);
  }
  return value as Record<string, unknown>;
}

const [directoryArgument, provenanceArgument, ...unexpected] = process.argv.slice(2);
if (
  directoryArgument === undefined ||
  (provenanceArgument !== undefined && provenanceArgument !== "--require-provenance") ||
  unexpected.length !== 0
) {
  fail("usage: node scripts/verify-registry-release.ts <release-directory> [--require-provenance]");
}
const requireProvenance = provenanceArgument === "--require-provenance";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const directory = resolve(directoryArgument);
const manifestPath = join(directory, "release-manifest.json");
const release = object(readJson(manifestPath), manifestPath);
if (
  typeof release.releaseVersion !== "string" ||
  !/^\d+\.\d+\.\d+-alpha\.\d+$/.test(release.releaseVersion) ||
  !Array.isArray(release.packages)
) {
  fail(`${manifestPath} is not an alpha release manifest`);
}

const expected = buildOrder(repoRoot).flatMap((dir) => {
  const manifestPath = join(dir, "package.json");
  const manifest = object(readJson(manifestPath), manifestPath) as PackageManifest;
  if (manifest.private === true) return [];
  if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    fail(`${manifestPath} must declare string name and version fields`);
  }
  return [{ dir, manifest: manifest as PackageManifest & { name: string; version: string } }];
});

const expectedRef = process.env.GITHUB_REF;
const expectedCommit = process.env.GITHUB_SHA;
if (
  requireProvenance &&
  (expectedRef !== `refs/tags/v${release.releaseVersion}` ||
    expectedCommit === undefined ||
    !/^[0-9a-f]{40}$/.test(expectedCommit))
) {
  fail("GITHUB_REF and GITHUB_SHA do not identify the exact release tag and commit");
}
const framework = expected.find(({ manifest }) => manifest.name === FRAMEWORK)?.manifest;
const repository = object(framework?.repository, `${FRAMEWORK} repository`);
if (typeof repository.url !== "string") fail(`${FRAMEWORK} repository has no URL`);
const repositoryUrl = repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
if (!repositoryUrl.startsWith("https://github.com/")) {
  fail(`${FRAMEWORK} repository is not a public GitHub URL`);
}

const entries = release.packages.map((candidate) => {
  const entry = object(candidate, `${manifestPath} package entry`) as ReleaseEntry;
  if (
    typeof entry.name !== "string" ||
    typeof entry.version !== "string" ||
    entry.version !== release.releaseVersion ||
    typeof entry.filename !== "string" ||
    entry.filename !== basename(entry.filename)
  ) {
    fail(`${manifestPath} contains an invalid package entry`);
  }
  return entry as { readonly name: string; readonly version: string; readonly filename: string };
});

if (
  JSON.stringify(entries.map(({ name, version }) => ({ name, version }))) !==
  JSON.stringify(
    expected.map(({ manifest }) => ({ name: manifest.name, version: manifest.version })),
  )
) {
  fail("release manifest packages do not match the workspace release order");
}

const provenancePolicies: Array<{
  readonly packageName: string;
  readonly version: string;
  readonly sha512: string;
  readonly attestationUrl: string;
}> = [];

for (const [index, entry] of entries.entries()) {
  const local = expected[index]?.manifest;
  if (local === undefined) fail(`no local manifest for ${entry.name}`);
  const tarball = readFileSync(join(directory, entry.filename));
  const sha512 = createHash("sha512").update(tarball).digest("hex");
  const integrity = `sha512-${Buffer.from(sha512, "hex").toString("base64")}`;
  const packageSpec = `${entry.name}@${entry.version}`;
  const metadata = object(
    npmJson(
      [
        "view",
        packageSpec,
        "name",
        "version",
        "dist.integrity",
        "dist.attestations",
        "dist-tags",
        "repository",
        "peerDependencies",
        "peerDependenciesMeta",
      ],
      packageSpec,
    ),
    `registry metadata for ${packageSpec}`,
  );
  const tags = object(metadata["dist-tags"], `registry dist-tags for ${packageSpec}`);
  if (
    metadata.name !== entry.name ||
    metadata.version !== entry.version ||
    metadata["dist.integrity"] !== integrity
  ) {
    fail(`registry identity or integrity does not match ${packageSpec}`);
  }
  if (requireProvenance) {
    const attestations = object(
      metadata["dist.attestations"],
      `registry attestations for ${packageSpec}`,
    );
    const provenance = object(attestations.provenance, `registry provenance for ${packageSpec}`);
    if (
      typeof attestations.url !== "string" ||
      !attestations.url.startsWith(`${NPM_REGISTRY}-/npm/v1/attestations/`) ||
      provenance.predicateType !== SLSA_PROVENANCE
    ) {
      fail(`${packageSpec} does not expose npmjs SLSA provenance`);
    }
    provenancePolicies.push({
      packageName: entry.name,
      version: entry.version,
      sha512,
      attestationUrl: attestations.url,
    });
  }
  if (tags.alpha !== entry.version || Object.hasOwn(tags, "latest")) {
    fail(`${entry.name} must expose only the intended alpha channel, not latest`);
  }
  if (JSON.stringify(metadata.repository) !== JSON.stringify(local.repository)) {
    fail(`registry repository metadata does not match ${packageSpec}`);
  }
  if (entry.name === FRAMEWORK) {
    if (metadata.peerDependencies !== undefined || metadata.peerDependenciesMeta !== undefined) {
      fail(`${packageSpec} unexpectedly declares peer metadata`);
    }
  } else if (
    JSON.stringify(metadata.peerDependencies) !==
      JSON.stringify({ [FRAMEWORK]: release.releaseVersion }) ||
    metadata.peerDependenciesMeta !== undefined
  ) {
    fail(`${packageSpec} does not expose the exact required framework peer`);
  }
  const access = object(
    npmJson(["access", "get", "status", entry.name], entry.name),
    `registry access for ${entry.name}`,
  );
  if (access[entry.name] !== "public") {
    fail(`${entry.name} is not public`);
  }
}

if (requireProvenance) {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-provenance-verify-"));
  try {
    const consumer = join(root, "consumer");
    mkdirSync(consumer);
    writeFileSync(
      join(consumer, "package.json"),
      `${JSON.stringify({ name: "tsudoi-provenance-verifier", private: true })}\n`,
    );
    const env = { ...process.env, NPM_CONFIG_CACHE: join(root, "npm-cache") };
    npmRun(
      [
        "install",
        "--ignore-scripts",
        "--save-exact",
        ...entries.map(({ name, version }) => `${name}@${version}`),
      ],
      "the exact release set",
      consumer,
      env,
    );
    npmRun(["audit", "signatures"], "the exact installed release set", consumer, env);
    try {
      await Promise.all(
        provenancePolicies.map((policy) =>
          verifyProvenance({
            ...policy,
            repository: repositoryUrl,
            workflowPath: RELEASE_WORKFLOW,
            gitRef: expectedRef as string,
            gitCommit: expectedCommit as string,
          }),
        ),
      );
    } catch (cause) {
      fail(`provenance policy verification failed: ${String(cause)}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(
  `verified ${entries.length} public registry packages at ${release.releaseVersion}${requireProvenance ? " with provenance" : ""}`,
);
