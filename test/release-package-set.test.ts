import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { declaredMembers, handlerMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

const RELEASE_VERSION = "0.1.0-alpha.0";
const FRAMEWORK = "@atusy/tsudoi-language-server";

interface Manifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly private?: unknown;
  readonly publishConfig?: unknown;
  readonly repository?: unknown;
  readonly peerDependencies?: Record<string, unknown>;
  readonly peerDependenciesMeta?: Record<string, unknown>;
}

function manifestAt(dir: string): Manifest {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Manifest;
}

test("every public package belongs to the same npm alpha release", () => {
  const mismatches = declaredMembers(repoRoot).flatMap((dir) => {
    const manifest = manifestAt(dir);
    const expected = {
      version: RELEASE_VERSION,
      private: undefined,
      publishConfig: { access: "public", tag: "alpha" },
      repository: {
        type: "git",
        url: "git+https://github.com/atusy/tsudoi-language-server.git",
        directory: relative(repoRoot, dir),
      },
    };
    const actual = {
      version: manifest.version,
      private: manifest.private,
      publishConfig: manifest.publishConfig,
      repository: manifest.repository,
    };
    return JSON.stringify(actual) === JSON.stringify(expected)
      ? []
      : [`${String(manifest.name ?? basename(dir))}: ${JSON.stringify(actual)}`];
  });

  expect(mismatches).toEqual([]);
});

test("every handler requires the framework version from its release set", () => {
  const mismatches = handlerMembers(repoRoot).flatMap((dir) => {
    const manifest = manifestAt(dir);
    const version = manifest.peerDependencies?.[FRAMEWORK];
    const metadata = manifest.peerDependenciesMeta?.[FRAMEWORK];
    return version === RELEASE_VERSION && metadata === undefined
      ? []
      : [
          `${String(manifest.name ?? basename(dir))}: peer=${String(version)}, metadata=${JSON.stringify(metadata)}`,
        ];
  });

  expect(mismatches).toEqual([]);
});

test("the workspace root stays outside the public release", () => {
  const workspace = manifestAt(repoRoot);

  expect(workspace.private).toBe(true);
  expect(workspace.publishConfig).toBeUndefined();
});
