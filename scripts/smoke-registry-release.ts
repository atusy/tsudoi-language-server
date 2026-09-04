import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { initializeParams, LspSession } from "../test/helpers/lsp.ts";
import { buildOrder } from "./workspaces.ts";

const NPM_REGISTRY = "https://registry.npmjs.org/";
const INSTALL_TIMEOUT_MS = 120_000;
const LSP_REQUEST_TIMEOUT_MS = 10_000;
const FRAMEWORK = "@atusy/tsudoi-language-server";
const COMPLETION = "@atusy/tsudoi-completion-document";

interface ReleaseEntry {
  readonly name?: unknown;
  readonly version?: unknown;
}

interface ReleaseManifest {
  readonly releaseVersion?: unknown;
  readonly packages?: unknown;
}

interface InstalledManifest {
  readonly name?: unknown;
  readonly version?: unknown;
}

function fail(message: string): never {
  throw new Error(`smoke-registry-release: ${message}`);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (cause) {
    fail(`cannot read ${path}: ${String(cause)}`);
  }
}

function object(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${subject} is not an object`);
  }
  return value as Record<string, unknown>;
}

function run(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env,
    timeout: INSTALL_TIMEOUT_MS,
  });
  if (result.error !== undefined) {
    fail(`${command} ${args[0] ?? ""} could not complete: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${command} ${args[0] ?? ""} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function releaseEntries(directory: string): {
  readonly version: string;
  readonly entries: readonly { readonly name: string; readonly version: string }[];
} {
  const path = join(directory, "release-manifest.json");
  const manifest = object(readJson(path), path) as ReleaseManifest;
  if (
    typeof manifest.releaseVersion !== "string" ||
    !/^\d+\.\d+\.\d+-alpha\.\d+$/.test(manifest.releaseVersion) ||
    !Array.isArray(manifest.packages)
  ) {
    fail(`${path} is not an alpha release manifest`);
  }
  const entries = manifest.packages.map((candidate) => {
    const entry = object(candidate, `${path} package entry`) as ReleaseEntry;
    if (
      typeof entry.name !== "string" ||
      typeof entry.version !== "string" ||
      entry.version !== manifest.releaseVersion
    ) {
      fail(`${path} contains an invalid package entry`);
    }
    return { name: entry.name, version: entry.version };
  });
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  const expected = buildOrder(repoRoot).flatMap((packageDirectory) => {
    const packagePath = join(packageDirectory, "package.json");
    const packageManifest = object(readJson(packagePath), packagePath);
    if (packageManifest.private === true) return [];
    if (typeof packageManifest.name !== "string" || typeof packageManifest.version !== "string") {
      fail(`${packagePath} must declare string name and version fields`);
    }
    return [{ name: packageManifest.name, version: packageManifest.version }];
  });
  if (JSON.stringify(entries) !== JSON.stringify(expected)) {
    fail("release manifest packages do not match the workspace release order");
  }
  return { version: manifest.releaseVersion, entries };
}

function writeConsumerConfig(directory: string): void {
  writeFileSync(
    join(directory, "tsudoi.config.ts"),
    [
      `import { completeAround } from "${COMPLETION}";`,
      `import type { TsudoiConfigFactory } from "${FRAMEWORK}/types";`,
      "const config: TsudoiConfigFactory = () => Promise.resolve({",
      '  methods: { "textDocument/completion": completeAround },',
      "});",
      "export default config;",
      "",
    ].join("\n"),
  );
}

async function requestWithTimeout<T>(
  runtime: string,
  method: string,
  request: Promise<T>,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new Error(
          `smoke-registry-release: ${runtime} ${method} timed out after ${LSP_REQUEST_TIMEOUT_MS}ms`,
        ),
      );
    }, LSP_REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([request, deadline]);
  } finally {
    clearTimeout(timeout);
  }
}

async function smokeLsp(
  runtime: string,
  command: string,
  directory: string,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  const session = LspSession.startCommand(command, directory, env);
  try {
    const initialized = await requestWithTimeout(
      runtime,
      "initialize",
      session.request<{
        serverInfo?: { name?: unknown };
        capabilities?: { completionProvider?: unknown };
      }>("initialize", initializeParams),
    );
    if (
      initialized.serverInfo?.name !== "tsudoi" ||
      initialized.capabilities?.completionProvider === undefined
    ) {
      fail(`${runtime} initialize did not advertise the expected server and completion capability`);
    }
    session.notify("initialized", {});
    const uri = "file:///registry-smoke.txt";
    session.notify("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId: "plaintext",
        version: 1,
        text: "registry reg",
      },
    });
    const completion = await requestWithTimeout(
      runtime,
      "textDocument/completion",
      session.request<unknown>("textDocument/completion", {
        textDocument: { uri },
        position: { line: 0, character: 12 },
      }),
    );
    if (
      !Array.isArray(completion) ||
      !completion.some(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          (item as Record<string, unknown>).label === "registry" &&
          (item as Record<string, unknown>).detail === "around",
      )
    ) {
      fail(`${runtime} completion did not return the installed handler's registry item`);
    }
    const shutdown = await requestWithTimeout(
      runtime,
      "shutdown",
      session.request<unknown>("shutdown", undefined),
    );
    if (shutdown !== null) fail(`${runtime} shutdown did not return null`);
    session.notify("exit", undefined);
    const exit = await session.waitForExit(10_000);
    if (exit !== 0) fail(`${runtime} server exited with ${String(exit)}: ${session.stderr}`);
    if (session.unframedStdoutBytes !== 0 || session.stderr !== "") {
      fail(`${runtime} server wrote outside the LSP stream: ${session.stderr}`);
    }
  } finally {
    session.dispose();
  }
}

async function smokeBun(
  root: string,
  entries: readonly { readonly name: string; readonly version: string }[],
): Promise<void> {
  const directory = join(root, "bun-consumer");
  mkdirSync(directory);
  writeFileSync(
    join(directory, "package.json"),
    `${JSON.stringify({ name: "tsudoi-registry-smoke-bun", private: true, type: "module" })}\n`,
  );
  const env = {
    ...process.env,
    BUN_INSTALL_CACHE_DIR: join(root, "bun-cache"),
    NPM_CONFIG_REGISTRY: NPM_REGISTRY,
  };
  run("bun", ["add", "--exact", ...entries.map(({ name }) => `${name}@alpha`)], directory, env);
  for (const entry of entries) {
    const manifest = object(
      readJson(join(directory, "node_modules", ...entry.name.split("/"), "package.json")),
      `${entry.name} installed manifest`,
    ) as InstalledManifest;
    if (manifest.name !== entry.name || manifest.version !== entry.version) {
      fail(
        `Bun installed ${String(manifest.name)}@${String(manifest.version)}, expected ${entry.name}@${entry.version}`,
      );
    }
  }
  writeConsumerConfig(directory);
  await smokeLsp(
    "Bun",
    `bun run node_modules/${FRAMEWORK}/dist/cli.js --config ./tsudoi.config.ts`,
    directory,
  );
}

async function smokeDeno(
  root: string,
  entries: readonly { readonly name: string; readonly version: string }[],
): Promise<void> {
  const directory = join(root, "deno-consumer");
  mkdirSync(directory);
  const env = {
    ...process.env,
    DENO_DIR: join(root, "deno-cache"),
    NPM_CONFIG_REGISTRY: NPM_REGISTRY,
  };
  run(
    "deno",
    ["add", "--save-exact", ...entries.map(({ name }) => `npm:${name}@alpha`)],
    directory,
    env,
  );
  if (existsSync(join(directory, "package.json")) || existsSync(join(directory, "node_modules"))) {
    fail("Deno smoke unexpectedly created a package.json or node_modules directory");
  }
  for (const entry of entries) {
    const info = object(
      JSON.parse(
        run(
          "deno",
          ["info", "--json", "--frozen", "--node-modules-dir=none", entry.name],
          directory,
          env,
        ),
      ),
      `deno info for ${entry.name}`,
    );
    const packages = object(info.npmPackages, `deno npm packages for ${entry.name}`);
    const installed = object(packages[`${entry.name}@${entry.version}`], entry.name);
    if (
      installed.name !== entry.name ||
      installed.version !== entry.version ||
      installed.registryUrl !== NPM_REGISTRY
    ) {
      fail(`Deno did not resolve ${entry.name}@${entry.version} from npmjs`);
    }
  }
  writeConsumerConfig(directory);
  run("deno", ["check", "--frozen", "--node-modules-dir=none", "tsudoi.config.ts"], directory, env);
  await smokeLsp(
    "Deno",
    `deno run -A --frozen --node-modules-dir=none ${FRAMEWORK}/cli --config ./tsudoi.config.ts`,
    directory,
    env,
  );
}

const [directoryArgument, ...unexpected] = process.argv.slice(2);
if (directoryArgument === undefined || unexpected.length !== 0) {
  fail("usage: node scripts/smoke-registry-release.ts <release-directory>");
}

const directory = resolve(directoryArgument);
const { version, entries } = releaseEntries(directory);
const root = mkdtempSync(join(tmpdir(), "tsudoi-registry-smoke-"));
try {
  await smokeBun(root, entries);
  await smokeDeno(root, entries);
  console.log(`smoked ${entries.length} registry packages at ${version} with Bun and Deno`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
