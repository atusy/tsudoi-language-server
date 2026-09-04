import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import process from "node:process";
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

test("the publisher resumes only past a registry artifact with the same integrity", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-resume-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  const publishLog = join(parent, "published.jsonl");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(destination, "release-manifest.json"), "utf8"),
    ) as ReleaseManifest;
    const [alreadyPublished, ...unpublished] = manifest.packages ?? [];
    expect(alreadyPublished).toBeDefined();
    const tarball = readFileSync(join(destination, String(alreadyPublished?.filename)));
    const integrity = `sha512-${createHash("sha512").update(tarball).digest("base64")}`;

    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
if (args[0] === "view") {
  if (args[1] === process.env.EXISTING_SPEC) {
    process.stdout.write(JSON.stringify(process.env.EXISTING_INTEGRITY));
    process.exit(0);
  }
  if (args[1] === process.env.EXISTING_NAME && args[2] === "dist-tags.alpha") {
    process.stdout.write(JSON.stringify(process.env.EXISTING_VERSION));
    process.exit(0);
  }
  console.error("npm error code E404");
  process.exit(1);
}
if (args[0] === "publish") {
  appendFileSync(process.env.PUBLISH_LOG, JSON.stringify(args) + "\\n");
  process.exit(0);
}
process.exit(2);
`,
    );
    chmodSync(fakeNpm, 0o755);

    const published = spawnSync("bun", ["run", "scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
        EXISTING_SPEC: `${String(alreadyPublished?.name)}@${String(alreadyPublished?.version)}`,
        EXISTING_NAME: String(alreadyPublished?.name),
        EXISTING_VERSION: String(alreadyPublished?.version),
        EXISTING_INTEGRITY: integrity,
        PUBLISH_LOG: publishLog,
      },
    });
    expect(`${String(published.status)} ${published.stderr}`).toBe("0 ");
    const calls = readFileSync(publishLog, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    expect(calls).toEqual(
      unpublished.map((entry) => [
        "publish",
        join(destination, String(entry.filename)),
        "--registry",
        "https://registry.npmjs.org/",
        "--access",
        "public",
        "--tag",
        "alpha",
      ]),
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher refuses a checksummed tarball carrying another package identity", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-identity-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);
    const manifestPath = join(destination, "release-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ReleaseManifest;
    const [first, second] = manifest.packages ?? [];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    const wrongTarball = readFileSync(join(destination, String(first?.filename)));
    writeFileSync(join(destination, String(second?.filename)), wrongTarball);
    const tampered = {
      ...manifest,
      packages: (manifest.packages ?? []).map((entry) =>
        entry === second
          ? { ...entry, sha256: createHash("sha256").update(wrongTarball).digest("hex") }
          : entry,
      ),
    };
    writeFileSync(manifestPath, `${JSON.stringify(tampered, null, 2)}\n`);

    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(fakeNpm, "#!/bin/sh\nexit 2\n");
    chmodSync(fakeNpm, 0o755);
    const published = spawnSync("bun", ["run", "scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
    });
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("tarball identity does not match");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher refuses to roll an alpha dist-tag back", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-rollback-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  const publishLog = join(parent, "published.jsonl");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(packed.status).toBe(0);
    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
if (args[0] === "view" && args[2] === "dist.integrity") {
  console.error("npm error code E404");
  process.exit(1);
}
if (args[0] === "view" && args[2] === "dist-tags.alpha") {
  process.stdout.write(JSON.stringify("0.1.0-alpha.1"));
  process.exit(0);
}
if (args[0] === "publish") {
  appendFileSync(process.env.PUBLISH_LOG, JSON.stringify(args) + "\\n");
  process.exit(0);
}
process.exit(2);
`,
    );
    chmodSync(fakeNpm, 0o755);
    const published = spawnSync("bun", ["run", "scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
        PUBLISH_LOG: publishLog,
      },
    });
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("would not advance the alpha dist-tag");
    expect(existsSync(publishLog)).toBeFalse();
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
