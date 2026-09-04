import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildOrder } from "./workspaces.ts";

interface PackageManifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly private?: unknown;
}

interface ReleasePackage {
  readonly dir: string;
  readonly name: string;
  readonly version: string;
}

interface PackedPackage {
  readonly name: string;
  readonly version: string;
  readonly filename: string;
  readonly sha256: string;
}

function fail(message: string): never {
  console.error(`pack-release: ${message}`);
  process.exit(1);
}

function readPackage(dir: string): PackageManifest {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as PackageManifest;
}

function publicPackages(root: string): readonly ReleasePackage[] {
  return buildOrder(root).flatMap((dir) => {
    const manifest = readPackage(dir);
    if (manifest.private === true) {
      return [];
    }
    if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
      fail(`${join(dir, "package.json")} must declare string name and version fields`);
    }
    return [{ dir, name: manifest.name, version: manifest.version }];
  });
}

function prepareDestination(argument: string): string {
  const destination = resolve(argument);
  if (existsSync(destination)) {
    if (!statSync(destination).isDirectory()) {
      fail(`destination is not a directory: ${destination}`);
    }
    if (readdirSync(destination).length !== 0) {
      fail(`destination must be empty: ${destination}`);
    }
  } else {
    mkdirSync(destination, { recursive: true });
  }
  return destination;
}

function packedFilename(output: string, expected: ReleasePackage): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch (cause) {
    fail(`npm pack for ${expected.name} returned invalid JSON: ${String(cause)}`);
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 1 ||
    typeof parsed[0] !== "object" ||
    parsed[0] === null
  ) {
    fail(`npm pack for ${expected.name} returned an invalid result`);
  }
  const result = parsed[0] as { filename?: unknown; name?: unknown; version?: unknown };
  if (result?.name !== expected.name || result.version !== expected.version) {
    fail(
      `npm pack identity does not match ${expected.name}@${expected.version}: ${String(result?.name)}@${String(result?.version)}`,
    );
  }
  const filename = result.filename;
  if (typeof filename !== "string" || filename !== basename(filename)) {
    fail(`npm pack for ${expected.name} returned an unsafe filename: ${String(filename)}`);
  }
  return filename;
}

const [destinationArgument, ...unexpected] = process.argv.slice(2);
if (destinationArgument === undefined || unexpected.length !== 0) {
  fail("usage: bun run scripts/pack-release.ts <empty-destination>");
}

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const packages = publicPackages(repoRoot);
if (packages.length === 0) {
  fail("the workspace has no public packages");
}
const versions = new Set(packages.map(({ version }) => version));
if (versions.size !== 1) {
  fail(
    `public package versions must match: ${packages.map(({ name, version }) => `${name}@${version}`).join(", ")}`,
  );
}
const releaseVersion = packages[0]?.version;
if (releaseVersion === undefined || !/^\d+\.\d+\.\d+-alpha\.\d+$/.test(releaseVersion)) {
  fail(`release version must be an alpha prerelease: ${String(releaseVersion)}`);
}

const destination = prepareDestination(destinationArgument);
const packed: PackedPackage[] = [];
const filenames = new Set<string>();
const identities = new Set<string>();
for (const packageToPack of packages) {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", destination], {
    cwd: packageToPack.dir,
    encoding: "utf8",
  });
  const filename = packedFilename(output, packageToPack);
  const identity = `${packageToPack.name}@${packageToPack.version}`;
  if (filenames.has(filename) || identities.has(identity)) {
    fail(`npm pack returned a duplicate release entry: ${identity} in ${filename}`);
  }
  filenames.add(filename);
  identities.add(identity);
  const tarball = readFileSync(join(destination, filename));
  packed.push({
    name: packageToPack.name,
    version: packageToPack.version,
    filename,
    sha256: createHash("sha256").update(tarball).digest("hex"),
  });
}

writeFileSync(
  join(destination, "release-manifest.json"),
  `${JSON.stringify({ releaseVersion, packages: packed }, null, 2)}\n`,
);
console.log(`packed ${packed.length} packages at ${destination}`);
