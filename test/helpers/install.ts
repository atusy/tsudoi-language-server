import { spawn } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { handlerMembers } from "../../scripts/workspaces.ts";
import { LspSession } from "./lsp.ts";
import { frameworkRoot, repoRoot } from "./spawn.ts";
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

/**
 * The stakeholder-facing example's own bytes, keyed by the path each must be
 * written to in a consumer project.
 *
 * THE INSTALLED HANDLERS ARE DELIBERATELY NOT IN IT, and that absence is a
 * different kind from a missing entry: the config imports them by PACKAGE
 * SPECIFIER and installConsumer installs each one's own tarball, so adding their
 * source here would put bytes in the consumer that criterion 1 asserts are
 * absent and every probe would still pass.
 */
export function exampleSources(): Record<string, string> {
  return {
    "tsudoi.config.ts": readFileSync(
      fileURLToPath(new URL("../../examples/tsudoi.config.ts", import.meta.url)),
      "utf8",
    ),
    "diagnostic-trailing-whitespace.ts": readFileSync(
      fileURLToPath(new URL("../../examples/diagnostic-trailing-whitespace.ts", import.meta.url)),
      "utf8",
    ),
    "formatting-trailing-whitespace.ts": readFileSync(
      fileURLToPath(new URL("../../examples/formatting-trailing-whitespace.ts", import.meta.url)),
      "utf8",
    ),
  };
}

/** What a staging directory holds, sorted, READ BACK RATHER THAN LISTED. */
export function stageEntries(stage: string): readonly string[] {
  return readdirSync(stage).sort();
}

/**
 * One package's TARBALL, packed at test time and read back -- what a registry
 * would receive, rather than what a manifest says it would.
 *
 * WHY THE TARBALL AND NOT `files`: `files` is an INSTRUCTION and the tarball is
 * its result, and the two part company the moment anything writes a file the
 * instruction happens to admit -- a `prepack` compiling into a directory it does
 * not clear leaves a renamed output on disk, and `files: ["dist"]` packs it.
 */
export interface PackedPackage {
  /** The name the manifest inside the tarball carries. */
  readonly name: string;
  /** Every path the archive holds, `package/` stripped, sorted. */
  readonly entries: readonly string[];
  /** The unpacked tree, for reading what a packed file actually says. */
  readonly dir: string;
  dispose(): void;
}

/**
 * Packs `packageRoot` and unpacks the result, so both the file list and the file
 * CONTENTS can be read off the artifact.
 *
 * PACKED FROM WHERE IT LIVES: a staged copy would be a different tree, and the
 * staleness this reader exists to see is a property of the directory that
 * persists between packs.
 */
export async function packPackage(packageRoot: string): Promise<PackedPackage> {
  const stage = mkdtempSync(join(tmpdir(), "tsudoi-tarball-"));
  const dispose = (): void => rmSync(stage, { recursive: true, force: true });
  try {
    const packed = await run("bun", ["pm", "pack", "--destination", stage], packageRoot);
    if (packed.code !== 0) {
      fail(`bun pm pack (${packageRoot})`, packed);
    }
    const tarballName = readdirSync(stage).find((entry) => entry.endsWith(".tgz"));
    if (tarballName === undefined) {
      fail(`bun pm pack (${packageRoot})`, {
        code: packed.code,
        output: `no .tgz in ${stage}\n${packed.output}`,
      });
    }
    const tarball = join(stage, tarballName);
    const listed = await run("tar", ["-tzf", tarball], stage);
    if (listed.code !== 0) {
      fail(`tar -tzf (${packageRoot})`, listed);
    }
    const extracted = await run("tar", ["-xzf", tarball], stage);
    if (extracted.code !== 0) {
      fail(`tar -xzf (${packageRoot})`, extracted);
    }
    const entries = listed.output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.endsWith("/"))
      .map((line) => {
        // THE PREFIX IS REFUSED RATHER THAN STRIPPED WHERE IT IS ABSENT, and
        // nothing reddens if it is stripped: an entry outside npm's `package/`
        // layout is a shape this reader has no account of, so reporting it as a
        // top-level file would be inventing one.
        if (!line.startsWith("package/")) {
          throw new Error(`${packageRoot} packed ${line}, which is outside the archive's package/`);
        }
        return line.slice("package/".length);
      })
      .sort();
    const dir = join(stage, "package");
    const name = (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name: string })
      .name;
    return { name, entries, dir, dispose };
  } catch (cause) {
    dispose();
    throw cause;
  }
}

/**
 * The handler packages a consumer installs BESIDE tsudoi, ENUMERATED FROM THE
 * WORKSPACE CONFIGURATION rather than named here.
 */
const handlerRoots = handlerMembers(repoRoot).map((dir) => realpathSync(dir));

/** The name in a member's own manifest, for saying which package was withheld. */
function packageNameOf(dir: string): string {
  return (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name: string }).name;
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
  /**
   * What the staging directory held at the moment `bun pm pack` ran -- the real
   * stage this consumer was built from, captured before the tarball lands in it.
   */
  readonly stagedEntries: readonly string[];
  /** Writes a file into the consumer project, e.g. the config a route names. */
  write(path: string, contents: string): void;
  /**
   * Type-checks probe sources, keyed by path relative to the consumer root.
   *
   * `overrides` are MERGED OVER `consumerCompilerOptions`, NOT SUBSTITUTED FOR
   * IT, AND NOTHING REDDENS EITHER WAY: substitution turns off every option it
   * did not restate, and the thing it turns off can be the guard in the very
   * file whose purpose is guarding.
   *
   * A key spelled wrong, or a merge that stopped applying, leaves the probe
   * running under the shared defaults AND STILL GREEN. Nothing in this helper
   * can detect that; it is detected by a probe whose perturbation only reddens
   * when its override is in force.
   */
  typeCheck(
    files: Record<string, string>,
    overrides?: Record<string, unknown>,
  ): Promise<TypeCheckResult>;
  /**
   * Starts a server by running a documented command line VERBATIM in the
   * consumer's own directory.
   */
  start(command: string): LspSession;
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
  /**
   * Leaves ONE NAMED handler package out of the install, which is criterion 1's
   * negative control.
   *
   * A NAME AND NOT A FLAG, because with two members a flag withholds both and
   * the config then fails on whichever import the loader reached first -- so the
   * specifier in stderr would name a package the caller did not choose. AN
   * UNRECOGNISED NAME IS REFUSED RATHER THAN IGNORED, AND NOTHING REDDENS IF THE
   * REFUSAL GOES: a typo would leave every member installed and the negative
   * control passing on the positive tree.
   */
  readonly omitHandler?: string;
}

function fail(step: string, result: TypeCheckResult): never {
  throw new Error(
    [
      `${step} failed with exit code ${String(result.code)} while building the installed consumer.`,
      "PBI-13 accepts `a deno user obtains and runs tsudoi` only from a packed-and-installed copy,",
      "so this fails the suite instead of falling back to the checkout -- everything passes from",
      "inside the repo while a stranger still cannot resolve, or run, what they were sent.",
      "`bun pm pack` runs prepack, so a build failure in tsconfig.build.json surfaces here too.",
      "A cold bun cache needs network for tsudoi's declared dependencies --",
      "vscode-languageserver-protocol and vscode-languageserver-textdocument, plus what the",
      "first of those pulls in; that is the one environmental dependency this probe adds.",
      result.output,
    ].join("\n"),
  );
}

/**
 * Packs this package and installs the tarball into a fresh project, so the
 * specifier is exercised from OUTSIDE the repo rather than by self-reference.
 *
 * `editPackage` is applied to the copy that gets PACKED: editing the installed
 * copy afterwards would prove something about a directory, not about what this
 * repo publishes.
 *
 * THE TARBALL IS BUILT HERE, NOT FOUND: `bun pm pack` runs `prepack` before it
 * collects files, so dist/ inside the tarball is compiled from the src/ copied
 * one line above, at test time, and a stale artifact cannot be what a test
 * observed.
 */
export async function installConsumer(options: InstallOptions = {}): Promise<InstalledConsumer> {
  const stage = mkdtempSync(join(tmpdir(), "tsudoi-pack-"));
  // ONE STAGE PER MEMBER, AND NOTHING REDDENS IF THEY SHARE ONE: the tarball
  // filename is FOUND rather than spelled, and that search is sound only while a
  // directory holds exactly one .tgz.
  const handlerStages = handlerRoots.map(() => mkdtempSync(join(tmpdir(), "tsudoi-handler-pack-")));
  const consumer = mkdtempSync(join(tmpdir(), "tsudoi-consumer-"));
  const dispose = (): void => {
    rmSync(stage, { recursive: true, force: true });
    for (const one of handlerStages) {
      rmSync(one, { recursive: true, force: true });
    }
    rmSync(consumer, { recursive: true, force: true });
  };
  try {
    // THE FRAMEWORK'S OWN MANIFEST AND NOT THE CHECKOUT ROOT'S: the workspace
    // root's carries no `exports`, no `files` and no `prepack`, so a stage built
    // from it would pack nothing and publish nothing, with every consumer
    // assertion below failing about the wrong file.
    const packageJson: Record<string, unknown> = JSON.parse(
      readFileSync(join(frameworkRoot, "package.json"), "utf8"),
    ) as Record<string, unknown>;
    options.editPackage?.(packageJson);
    writeFileSync(join(stage, "package.json"), JSON.stringify(packageJson, null, 2));
    cpSync(join(frameworkRoot, "src"), join(stage, "src"), { recursive: true });
    options.editSource?.(join(stage, "src"));
    cpSync(join(frameworkRoot, "tsconfig.build.json"), join(stage, "tsconfig.build.json"));
    // THE CONSUMER BELOW BORROWS ONLY @types AND NOT THIS, which is where a route
    // to the checkout would have mattered: it would answer the tarball's
    // specifiers from the repository, and the tarball is the whole subject there.
    symlinkSync(join(repoRoot, "node_modules"), join(stage, "node_modules"), "dir");
    const staged = stageEntries(stage);

    const packed = await run("bun", ["pm", "pack", "--destination", stage], stage);
    if (packed.code !== 0) {
      fail("bun pm pack", packed);
    }
    // Found rather than spelled out, and NOT ASSERTED AGAINST package.json's
    // `name` either -- which is the edit this looseness invites: the filename is
    // the PACKER'S derivation and not this package's identity, so an equality
    // here would pin how bun spells a temporary file.
    const tarballName = readdirSync(stage).find((entry) => entry.endsWith(".tgz"));
    if (tarballName === undefined) {
      fail("bun pm pack", { code: packed.code, output: `no .tgz in ${stage}\n${packed.output}` });
    }
    const tarball = join(stage, tarballName);

    // EVERY HANDLER PACKAGE IS PACKED FROM WHERE IT LIVES, and the asymmetry with
    // the block above is deliberate: the staging exists to let `editPackage` and
    // `editSource` perturb what gets packed, no probe perturbs a member, and a
    // copy would only add a second place for its build to go wrong.
    const handlerTarballs: string[] = [];
    const omitted = options.omitHandler;
    let withheld = false;
    for (const [index, handlerRoot] of handlerRoots.entries()) {
      const handlerPackage = packageNameOf(handlerRoot);
      if (handlerPackage === omitted) {
        withheld = true;
        continue;
      }
      const handlerStage = handlerStages[index] ?? stage;
      const packedHandler = await run(
        "bun",
        ["pm", "pack", "--destination", handlerStage],
        handlerRoot,
      );
      if (packedHandler.code !== 0) {
        fail(`bun pm pack (${handlerPackage})`, packedHandler);
      }
      const handlerTarballName = readdirSync(handlerStage).find((entry) => entry.endsWith(".tgz"));
      if (handlerTarballName === undefined) {
        fail(`bun pm pack (${handlerPackage})`, {
          code: packedHandler.code,
          output: `no .tgz in ${handlerStage}\n${packedHandler.output}`,
        });
      }
      handlerTarballs.push(join(handlerStage, handlerTarballName));
    }
    if (omitted !== undefined && !withheld) {
      throw new Error(
        `installConsumer was asked to omit ${omitted}, which is not a workspace member: ${handlerRoots.map(packageNameOf).join(", ")}`,
      );
    }

    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ name: "tsudoi-consumer", version: "1.0.0", type: "module", private: true }),
    );
    // EVERY TARBALL IN ONE `bun install`, AND IT IS NOT A ROUTE ANY README
    // STATES: the three of them carry three SEPARATE one-tarball installs, and
    // nothing here reproduces that sequence. What the one command must leave
    // standing is the PEER -- each handler declares tsudoi as a peer rather than
    // a dependency, so it finds the consumer's copy by walking up rather than
    // carrying one of its own -- and tsudoi's own tarball is in the same command.
    const installed = await run("bun", ["install", tarball, ...handlerTarballs], consumer);
    if (installed.code !== 0) {
      fail("bun install", installed);
    }
    // @types/node BORROWED and `wordnet` deliberately NOT: the handler package
    // declares wordnet, so the install above fetches it BY THE ROUTE UNDER TEST
    // and a package that forgot to declare it reddens rather than being propped
    // up from here.
    symlinkSync(join(repoRoot, "node_modules", "@types"), join(consumer, "node_modules", "@types"));

    return {
      dir: consumer,
      packageDir: join(consumer, "node_modules", "@atusy", "tsudoi-language-server"),
      stagedEntries: staged,
      write: (path: string, contents: string): void => {
        const target = join(consumer, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, contents);
      },
      typeCheck: async (
        files: Record<string, string>,
        overrides: Record<string, unknown> = {},
      ): Promise<TypeCheckResult> => {
        writeFileSync(
          join(consumer, "tsconfig.json"),
          JSON.stringify({
            compilerOptions: { ...consumerCompilerOptions, ...overrides },
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
      start: (command: string): LspSession => LspSession.startCommand(command, consumer),
      dispose,
    };
  } catch (cause) {
    dispose();
    throw cause;
  }
}
