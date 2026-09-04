import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
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
import { pathToFileURL } from "node:url";
import { buildOrder } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { exampleSources } from "./helpers/install.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

await requireRuntime(denoRuntime);

const SPAWN_TIMEOUT_MS = 30_000;

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
      timeout: SPAWN_TIMEOUT_MS,
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
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(packed.status).not.toBe(0);
    expect(packed.stderr).toContain("destination must be empty");
    expect(readFileSync(join(destination, "keep.txt"), "utf8")).toBe("do not overwrite\n");
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test("the release packer reports malformed npm output with package context", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-pack-output-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  try {
    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(fakeNpm, "#!/bin/sh\nprintf 'null\\n'\n");
    chmodSync(fakeNpm, 0o755);
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
    });
    expect(packed.status).not.toBe(0);
    expect(packed.stderr).toContain(
      "npm pack for @atusy/tsudoi-language-server returned an invalid result",
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher reports null manifest structures before contacting npm", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-null-manifest-"));
  const bin = join(parent, "bin");
  const npmLog = join(parent, "npm-called");
  try {
    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(fakeNpm, `#!/bin/sh\nprintf called > "${npmLog}"\nexit 2\n`);
    chmodSync(fakeNpm, 0o755);
    const cases = [
      { source: "null\n", error: "is not an alpha release manifest" },
      {
        source: '{"releaseVersion":"0.1.0-alpha.0","packages":[null]}\n',
        error: "contains an invalid package entry",
      },
    ];
    for (const [index, invalid] of cases.entries()) {
      const destination = join(parent, `release-${String(index)}`);
      mkdirSync(destination);
      writeFileSync(join(destination, "release-manifest.json"), invalid.source);
      const published = spawnSync("node", ["scripts/publish-release.ts", destination], {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
      });
      expect(published.status).not.toBe(0);
      expect(published.stderr).toContain(invalid.error);
    }
    expect(existsSync(npmLog)).toBeFalse();
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher verifies existing provenance before resuming a matching release", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-resume-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  const publishLog = join(parent, "published.jsonl");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
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
  if (args[1] === process.env.EXISTING_SPEC && args[2] === "dist.integrity") {
    process.stdout.write(JSON.stringify(process.env.EXISTING_INTEGRITY));
    process.exit(0);
  }
  if (args[1] === process.env.EXISTING_SPEC && args[2] === "dist.attestations") {
    process.stdout.write(JSON.stringify({
      url: "https://registry.npmjs.org/-/npm/v1/attestations/" + args[1],
      provenance: { predicateType: "https://slsa.dev/provenance/v1" },
    }));
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

    const published = spawnSync(
      "node",
      ["scripts/publish-release.ts", destination, "--provenance"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
        env: {
          ...process.env,
          PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
          EXISTING_SPEC: `${String(alreadyPublished?.name)}@${String(alreadyPublished?.version)}`,
          EXISTING_NAME: String(alreadyPublished?.name),
          EXISTING_VERSION: String(alreadyPublished?.version),
          EXISTING_INTEGRITY: integrity,
          PUBLISH_LOG: publishLog,
          RELEASE_DIR: destination,
          REPO_ROOT: repoRoot,
          NODE_OPTIONS: `--import=${pathToFileURL(join(repoRoot, "test/helpers/fake-attestation-fetch.ts")).href}`,
          GITHUB_REF: "refs/tags/v0.1.0-alpha.0",
          GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
        },
      },
    );
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("existing package provenance preflight failed");
    expect(existsSync(publishLog)).toBeFalse();

    const resumed = spawnSync("node", ["scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
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
    expect(`${String(resumed.status)} ${resumed.stderr}`).toBe("0 ");
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
      timeout: SPAWN_TIMEOUT_MS,
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
      timeout: SPAWN_TIMEOUT_MS,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ""}` },
    });
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("tarball identity does not match");
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher checks every local tarball before contacting npm", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-local-preflight-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  const npmLog = join(parent, "npm.jsonl");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(packed.status).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(destination, "release-manifest.json"), "utf8"),
    ) as ReleaseManifest;
    const last = manifest.packages?.at(-1);
    expect(last).toBeDefined();
    writeFileSync(join(destination, String(last?.filename)), "tampered\n");

    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
appendFileSync(process.env.NPM_LOG, JSON.stringify(process.argv.slice(2)) + "\\n");
process.exit(2);
`,
    );
    chmodSync(fakeNpm, 0o755);
    const published = spawnSync("bun", ["run", "scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
        NPM_LOG: npmLog,
      },
    });
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("release tarball checksum does not match");
    expect(existsSync(npmLog)).toBeFalse();
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the publisher completes registry preflight before publishing anything", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-registry-preflight-"));
  const destination = join(parent, "release");
  const bin = join(parent, "bin");
  const npmLog = join(parent, "npm.jsonl");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(packed.status).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(destination, "release-manifest.json"), "utf8"),
    ) as ReleaseManifest;
    const mismatch = manifest.packages?.at(-1);
    expect(mismatch).toBeDefined();

    mkdirSync(bin);
    const fakeNpm = join(bin, "npm");
    writeFileSync(
      fakeNpm,
      `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.NPM_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "view" && args[1] === process.env.MISMATCH_SPEC && args[2] === "dist.integrity") {
  process.stdout.write(JSON.stringify("sha512-AAAAAAAA"));
  process.exit(0);
}
if (args[0] === "view") {
  console.error("npm error code E404");
  process.exit(1);
}
process.exit(args[0] === "publish" ? 0 : 2);
`,
    );
    chmodSync(fakeNpm, 0o755);
    const published = spawnSync("bun", ["run", "scripts/publish-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
        MISMATCH_SPEC: `${String(mismatch?.name)}@${String(mismatch?.version)}`,
        NPM_LOG: npmLog,
      },
    });
    expect(published.status).not.toBe(0);
    expect(published.stderr).toContain("registry integrity does not match");
    const calls = readFileSync(npmLog, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    expect(calls.some(([command]) => command === "publish")).toBeFalse();
    expect(calls.at(-2)?.[1]).toBe(`${String(mismatch?.name)}@${String(mismatch?.version)}`);
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
      timeout: SPAWN_TIMEOUT_MS,
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
      timeout: SPAWN_TIMEOUT_MS,
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

test("the release tarballs install together and execute under Bun and Deno", async () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-release-consumer-"));
  const destination = join(parent, "release");
  const consumer = join(parent, "consumer");
  try {
    const packed = spawnSync("bun", ["run", "scripts/pack-release.ts", destination], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(packed.status).toBe(0);
    const manifest = JSON.parse(
      readFileSync(join(destination, "release-manifest.json"), "utf8"),
    ) as ReleaseManifest;
    const artifacts = (manifest.packages ?? []).map((entry) => ({
      name: String(entry.name),
      path: join(destination, String(entry.filename)),
    }));
    const framework = artifacts.find(({ name }) => name === "@atusy/tsudoi-language-server");
    expect(framework).toBeDefined();
    const handlers = artifacts.filter(({ name }) => name !== framework?.name);

    mkdirSync(consumer);
    writeFileSync(
      join(consumer, "package.json"),
      `${JSON.stringify(
        {
          name: "release-artifact-consumer",
          private: true,
          type: "module",
          overrides: { "@atusy/tsudoi-language-server": framework?.path },
        },
        null,
        2,
      )}\n`,
    );
    const installedFramework = spawnSync("bun", ["install", String(framework?.path)], {
      cwd: consumer,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(installedFramework.status).toBe(0);
    const installedHandlers = spawnSync("bun", ["install", ...handlers.map(({ path }) => path)], {
      cwd: consumer,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(installedHandlers.status).toBe(0);
    writeFileSync(
      join(consumer, "type-probe.ts"),
      'import { completePath } from "@atusy/tsudoi-completion-path";\nvoid completePath;\n',
    );
    writeFileSync(
      join(consumer, "tsconfig.json"),
      `${JSON.stringify({
        compilerOptions: {
          module: "nodenext",
          moduleResolution: "nodenext",
          skipLibCheck: false,
          strict: true,
          target: "esnext",
          types: [],
        },
        files: ["type-probe.ts"],
      })}\n`,
    );
    const typeChecked = spawnSync(
      join(repoRoot, "node_modules", ".bin", "tsc"),
      ["--noEmit", "-p", "tsconfig.json"],
      {
        cwd: consumer,
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
      },
    );
    expect(`${String(typeChecked.status)} ${typeChecked.stdout}${typeChecked.stderr}`).toBe("0 ");
    for (const [path, source] of Object.entries(exampleSources())) {
      writeFileSync(join(consumer, path), source);
    }

    for (const runtime of [bunRuntime, denoRuntime]) {
      const command = `${runtime.command} ${runtime.runArgs.join(" ")} node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts`;
      const session = LspSession.startCommand(command, consumer);
      try {
        const initialized = await session.request<InitializeResult>("initialize", initializeParams);
        expect(initialized).toHaveProperty("serverInfo.name", "tsudoi");
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri: "file:///release-artifact.txt",
            languageId: "plaintext",
            version: 1,
            text: "dictionary",
          },
        });
        const hover = await session.request<Hover | null>("textDocument/hover", {
          textDocument: { uri: "file:///release-artifact.txt" },
          position: { line: 0, character: 2 },
        });
        expect(hover).toHaveProperty("contents.value");
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
