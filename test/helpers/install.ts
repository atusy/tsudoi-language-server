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
import { fileURLToPath } from "node:url";
import { LspSession } from "./lsp.ts";
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

/**
 * The stakeholder-facing example's own bytes, keyed by the path each must be
 * written to in a consumer project.
 *
 * THE WHOLE SET, NEVER THE CONFIG ALONE, and that is the point of it being a
 * function rather than a constant at each call site. The config imports a
 * module per method by RELATIVE specifier, so a consumer given only the config
 * fails at import with a MISSING-MODULE ERROR -- which looks exactly like the
 * dependency-resolution failure these probes exist to observe, and would be
 * misdiagnosed as one. The artifact under test is the SET, and no fixture copy
 * of any member exists.
 *
 * STATED AS A SET RATHER THAN A NUMBER, and the correction is the reason: this
 * block read `TWO FILES, not one` and `the artifact under test is both files`
 * while the function returned FOUR. A count in prose falsifies itself the next
 * time the thing it counts grows, and nothing about editing the returned object
 * draws the editor's eye up here. The set grows; the sentence must not have to.
 */
export function exampleSources(): Record<string, string> {
  return {
    "tsudoi.config.ts": readFileSync(
      fileURLToPath(new URL("../../examples/tsudoi.config.ts", import.meta.url)),
      "utf8",
    ),
    "completion-path.ts": readFileSync(
      fileURLToPath(new URL("../../examples/completion-path.ts", import.meta.url)),
      "utf8",
    ),
    // THE DECLARATION IS PART OF THE EXAMPLE, not of this harness: `wordnet`
    // ships no types and has no DefinitelyTyped entry, so a reader who copies
    // the handler modules and not this one gets TS7016 in their own project.
    // Including it here is what makes the published-artifacts check answer the
    // question a reader actually has.
    "hover-wordnet.ts": readFileSync(
      fileURLToPath(new URL("../../examples/hover-wordnet.ts", import.meta.url)),
      "utf8",
    ),
    "wordnet.d.ts": readFileSync(
      fileURLToPath(new URL("../../examples/wordnet.d.ts", import.meta.url)),
      "utf8",
    ),
    // THE PAIR, AND NEITHER TRAVELS WITHOUT THE OTHER: the formatting module
    // imports its scan from the diagnostic one, so a consumer given only the
    // formatter fails exactly as a consumer given only the config does.
    "diagnostic-trailing-whitespace.ts": readFileSync(
      fileURLToPath(new URL("../../examples/diagnostic-trailing-whitespace.ts", import.meta.url)),
      "utf8",
    ),
    "formatting-trailing-whitespace.ts": readFileSync(
      fileURLToPath(new URL("../../examples/formatting-trailing-whitespace.ts", import.meta.url)),
      "utf8",
    ),
    // A SECOND PAIRING, AND IT RUNS THE OTHER WAY: this module imports the MARK
    // and its reader from completion-path.ts, because tsudoi keeps no record of
    // what a completion handler produced and a resolve handler can only key off
    // what the completion module wrote onto the item.
    "resolve-path-stat.ts": readFileSync(
      fileURLToPath(new URL("../../examples/resolve-path-stat.ts", import.meta.url)),
      "utf8",
    ),
  };
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
  /**
   * Type-checks probe sources, keyed by path relative to the consumer root.
   *
   * `overrides` are MERGED OVER `consumerCompilerOptions`, NOT SUBSTITUTED FOR
   * IT, and the distinction is written here because this project has already
   * paid for the other semantics: at sprint 22 an oxlint override REPLACED a
   * rule's options instead of merging them and silently disabled a different
   * guard, in the file whose whole purpose was guarding. Merging means a probe
   * that moves ONE option keeps the other six identical to every consumer probe
   * in the suite, so a red it produces is about the option it moved.
   *
   * WHY THE PARAMETER EXISTS AT ALL: a probe whose SUBJECT is a compiler option
   * cannot take that option from a shared constant. `skipLibCheck` is the case
   * -- with it on, two specifiers that behave differently for a config author
   * are indistinguishable here, so a probe about the specifier has to set it
   * itself.
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
   *
   * WHY IT IS HERE AT ALL, since a caller could reach LspSession.startCommand
   * directly: the cwd is the whole point. Module resolution is a property of
   * the directory a process starts in, and a consumer's directory is the only
   * place where a config's imports resolve the way a stranger's do. Binding the
   * two together here is what stops a probe from starting a session in the repo
   * and believing it measured an install.
   *
   * The COMMAND is the caller's, unsplit and unassembled by this helper, for
   * the reason LspSession.startCommand takes one: a route stated in prose beside
   * independently built spawn arguments is two things kept equal by hand.
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
 * the build needs to resolve the types of tsudoi's own declared dependencies;
 * `files` keeps it out of the tarball, which
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
    // @types/node BORROWED, for the same reason typecheck.ts borrows the whole
    // of node_modules: the example config reads the filesystem, so it imports
    // `node:` modules, and MEASURED, tsc reports TS2591 for those without the
    // types present. A config author writing filesystem code installs them; a
    // probe fetching them over the network to prove nothing about tsudoi's
    // specifier would add a dependency and no information. It is a devDependency
    // of this package and never ships, so nothing here can reach a user.
    symlinkSync(join(repoRoot, "node_modules", "@types"), join(consumer, "node_modules", "@types"));
    // `wordnet` BORROWED for the same reason and on the same terms. The README
    // tells a reader to install it, and this stands in for that install: the
    // property under test is that the example works WHEN ITS DEPENDENCY IS
    // PRESENT, never that bun can reach the registry. It is 27MB, so fetching
    // it once per consumer would cost minutes across this suite and prove
    // nothing tsudoi is responsible for.
    symlinkSync(
      join(repoRoot, "node_modules", "wordnet"),
      join(consumer, "node_modules", "wordnet"),
    );

    return {
      dir: consumer,
      packageDir: join(consumer, "node_modules", "@atusy", "tsudoi"),
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
