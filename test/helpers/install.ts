import { spawn } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { repoRoot } from "./spawn.ts";
import {
  consumerCompilerOptions,
  type PackageEdit,
  runTsc,
  type TypeCheckResult,
} from "./typecheck.ts";

function run(command: string, args: readonly string[], cwd: string): Promise<TypeCheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, output });
    });
  });
}

/** A throwaway project with tsudoi installed from a tarball, as a stranger has it. */
export interface InstalledConsumer {
  /**
   * The consumer project's root -- where a config author's own tsudoi.config.ts
   * sits, and the cwd every command in the stated route is run from.
   */
  readonly dir: string;
  /** Where the tarball was unpacked to, for asserting what did and did not ship. */
  readonly packageDir: string;
  /** Writes a file into the consumer project, e.g. the config a route names. */
  write(path: string, contents: string): void;
  /** Type-checks probe sources, keyed by path relative to the consumer root. */
  typeCheck(files: Record<string, string>): Promise<TypeCheckResult>;
  dispose(): void;
}

/** How one throwaway consumer differs from the one a stranger would get. */
export interface InstallOptions {
  /** Perturbs the package.json that gets PACKED, never the installed copy. */
  readonly editPackage?: PackageEdit;
  /**
   * Perturbs the STAGED COPY of src/ before the build runs, so a change to the
   * sources reaches the tarball with no rebuild step of anyone's -- which is
   * what makes `the artifact is produced from current source at test time`
   * observable rather than merely intended.
   */
  readonly editSource?: (srcDir: string) => void;
}

function fail(step: string, result: TypeCheckResult): never {
  throw new Error(
    [
      `${step} failed with exit code ${String(result.code)} while building the installed consumer.`,
      "PBI-13 accepts `a deno user obtains and runs tsudoi` only from a packed-and-installed copy,",
      "so this fails the suite instead of falling back to the checkout -- everything passes from",
      "inside the repo while a stranger still cannot resolve, or run, what they were sent.",
      "`bun pm pack` runs prepack, so a build failure in tsconfig.build.json surfaces here too.",
      "A cold bun cache needs network for vscode-languageserver-protocol; that is the one",
      "environmental dependency this probe adds.",
      result.output,
    ].join("\n"),
  );
}

/**
 * Packs this package and installs the tarball into a fresh project, so the
 * specifier is exercised from OUTSIDE the repo rather than by self-reference.
 *
 * `editPackage` is applied to the copy that gets PACKED, which is what makes a
 * perturbation meaningful here: editing the installed copy afterwards would
 * prove something about a directory, not about what this repo publishes.
 *
 * src/ is copied, never symlinked -- `bun pm pack` follows the `files` field
 * and a symlinked directory is not what the registry would receive.
 *
 * THE TARBALL IS BUILT HERE, NOT FOUND: the stage carries src/ and
 * tsconfig.build.json, and `bun pm pack` runs the `prepack` script before it
 * collects files (MEASURED -- `bun pm pack` and `npm pack` both fire prepack
 * and both include what it emitted). So dist/ inside the tarball is compiled
 * from the src/ copied one line above, at test time, and a stale artifact
 * cannot be what a test observed. node_modules is symlinked in only because
 * the build needs to resolve vscode-languageserver-protocol's types; `files`
 * keeps it out of the tarball, which
 * test/installed-runtime.test.ts asserts rather than assumes.
 */
export async function installConsumer(options: InstallOptions = {}): Promise<InstalledConsumer> {
  const stage = mkdtempSync(join(tmpdir(), "tsudoi-pack-"));
  const consumer = mkdtempSync(join(tmpdir(), "tsudoi-consumer-"));
  const dispose = (): void => {
    rmSync(stage, { recursive: true, force: true });
    rmSync(consumer, { recursive: true, force: true });
  };
  try {
    const packageJson: Record<string, unknown> = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as Record<string, unknown>;
    options.editPackage?.(packageJson);
    writeFileSync(join(stage, "package.json"), JSON.stringify(packageJson, null, 2));
    cpSync(join(repoRoot, "src"), join(stage, "src"), { recursive: true });
    options.editSource?.(join(stage, "src"));
    cpSync(join(repoRoot, "tsconfig.build.json"), join(stage, "tsconfig.build.json"));
    symlinkSync(join(repoRoot, "node_modules"), join(stage, "node_modules"), "dir");

    const packed = await run("bun", ["pm", "pack", "--destination", stage], stage);
    if (packed.code !== 0) {
      fail("bun pm pack", packed);
    }
    // Found rather than spelled out: bun derives the filename from name and
    // version, so hardcoding it would turn a version bump into a puzzling
    // ENOENT three sprints from now.
    const tarballName = readdirSync(stage).find((entry) => entry.endsWith(".tgz"));
    if (tarballName === undefined) {
      fail("bun pm pack", { code: packed.code, output: `no .tgz in ${stage}\n${packed.output}` });
    }
    const tarball = join(stage, tarballName);

    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ name: "tsudoi-consumer", version: "1.0.0", type: "module", private: true }),
    );
    const installed = await run("bun", ["install", tarball], consumer);
    if (installed.code !== 0) {
      fail("bun install", installed);
    }

    return {
      dir: consumer,
      packageDir: join(consumer, "node_modules", "@atusy", "tsudoi"),
      write: (path: string, contents: string): void => {
        const target = join(consumer, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, contents);
      },
      typeCheck: async (files: Record<string, string>): Promise<TypeCheckResult> => {
        writeFileSync(
          join(consumer, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: consumerCompilerOptions,
            files: Object.keys(files),
          }),
        );
        for (const [path, source] of Object.entries(files)) {
          const target = join(consumer, path);
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, source);
        }
        return await runTsc(consumer);
      },
      dispose,
    };
  } catch (cause) {
    dispose();
    throw cause;
  }
}
