import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
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

interface FakeRegistry {
  readonly directory: string;
  readonly release: string;
  readonly log: string;
  readonly env: NodeJS.ProcessEnv;
}

function shellWord(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function fakeRegistry(): FakeRegistry {
  const directory = mkdtempSync(join(tmpdir(), "tsudoi-registry-smoke-fake-"));
  const release = join(directory, "release");
  const bin = join(directory, "bin");
  const log = join(directory, "calls.jsonl");
  mkdirSync(release);
  mkdirSync(bin);
  const packages = releasePackages();
  const version = packages[0]?.version;
  if (version === undefined) throw new Error("the workspace has no public release package");
  writeFileSync(
    join(release, "release-manifest.json"),
    `${JSON.stringify({ releaseVersion: version, packages })}\n`,
  );
  const fixture = join(repoRoot, "test", "helpers", "fake-registry-runtime.ts");
  for (const runtime of ["bun", "deno"] as const) {
    const executable = join(bin, runtime);
    writeFileSync(
      executable,
      `#!/bin/sh\nexec ${shellWord(process.execPath)} ${shellWord(fixture)} ${runtime} "$@"\n`,
    );
    chmodSync(executable, 0o755);
  }
  return {
    directory,
    release,
    log,
    env: {
      ...process.env,
      PATH: `${bin}${delimiter}${process.env.PATH ?? ""}`,
      TSUDOI_FAKE_REGISTRY_LOG: log,
      TSUDOI_FAKE_REGISTRY_VERSION: version,
    },
  };
}

function callsOf(fake: FakeRegistry): readonly Record<string, unknown>[] {
  return readFileSync(fake.log, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
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

test("the registry smoke refuses every package-set mismatch before installing", () => {
  const parent = mkdtempSync(join(tmpdir(), "tsudoi-registry-smoke-mismatch-"));
  try {
    const packages = releasePackages();
    const version = packages[0]?.version;
    const first = packages[0];
    const second = packages[1];
    if (version === undefined || first === undefined || second === undefined) {
      throw new Error("the workspace needs at least two public release packages");
    }
    const mismatches = [
      packages.slice(0, -1),
      [...packages.slice(0, -1), { name: "@atusy/other", version }],
      [...packages.slice(0, -1), first],
      [second, first, ...packages.slice(2)],
    ];
    for (const [index, mismatch] of mismatches.entries()) {
      const release = join(parent, String(index));
      mkdirSync(release);
      writeFileSync(
        join(release, "release-manifest.json"),
        `${JSON.stringify({ releaseVersion: version, packages: mismatch })}\n`,
      );
      const result = spawnSync(process.execPath, ["scripts/smoke-registry-release.ts", release], {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, PATH: "" },
        timeout: SPAWN_TIMEOUT_MS,
      });

      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "release manifest packages do not match the workspace release order",
      );
      expect(result.stderr).not.toContain("could not complete");
    }
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("the registry smoke exercises fresh Bun and Deno consumers through a clean LSP exit", () => {
  const fake = fakeRegistry();
  try {
    const result = spawnSync("node", ["scripts/smoke-registry-release.ts", fake.release], {
      cwd: repoRoot,
      encoding: "utf8",
      env: fake.env,
      timeout: SPAWN_TIMEOUT_MS,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe(
      `smoked ${releasePackages().length} registry packages at ${releasePackages()[0]?.version} with Bun and Deno\n`,
    );
    const calls = callsOf(fake);
    expect(calls.filter((call) => call.lsp !== undefined)).toEqual(
      ["bun", "deno"].flatMap((runtime) =>
        [
          "initialize",
          "initialized",
          "textDocument/didOpen",
          "textDocument/completion",
          "shutdown",
          "exit",
        ].map((lsp) => ({ runtime, lsp })),
      ),
    );
    expect(calls.filter((call) => call.runtime === "bun" && call.args !== undefined)).toEqual([
      {
        runtime: "bun",
        args: ["add", "--exact", ...releasePackages().map(({ name }) => `${name}@alpha`)],
      },
      {
        runtime: "bun",
        args: [
          "run",
          "node_modules/@atusy/tsudoi-language-server/dist/cli.js",
          "--config",
          "./tsudoi.config.ts",
        ],
      },
    ]);
    expect(calls.filter((call) => call.runtime === "deno" && call.args !== undefined)).toEqual([
      {
        runtime: "deno",
        args: ["add", "--save-exact", ...releasePackages().map(({ name }) => `npm:${name}@alpha`)],
      },
      ...releasePackages().map(({ name }) => ({
        runtime: "deno",
        args: ["info", "--json", "--frozen", "--node-modules-dir=none", name],
      })),
      {
        runtime: "deno",
        args: ["check", "--frozen", "--node-modules-dir=none", "tsudoi.config.ts"],
      },
      {
        runtime: "deno",
        args: [
          "run",
          "-A",
          "--frozen",
          "--node-modules-dir=none",
          "@atusy/tsudoi-language-server/cli",
          "--config",
          "./tsudoi.config.ts",
        ],
      },
    ]);
  } finally {
    rmSync(fake.directory, { recursive: true, force: true });
  }
});

test("the registry smoke reports a bounded LSP request timeout", () => {
  const fake = fakeRegistry();
  try {
    const result = spawnSync("node", ["scripts/smoke-registry-release.ts", fake.release], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...fake.env, TSUDOI_FAKE_REGISTRY_HANG_METHOD: "initialize" },
      timeout: SPAWN_TIMEOUT_MS,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Bun initialize timed out after 10000ms");
    expect(callsOf(fake).some((call) => call.runtime === "deno")).toBeFalse();
  } finally {
    rmSync(fake.directory, { recursive: true, force: true });
  }
});
