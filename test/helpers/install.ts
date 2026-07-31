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
import { declaredMembers } from "../../scripts/workspaces.ts";
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
 * THE WHOLE SET OF WHAT IS COPIED, NEVER THE CONFIG ALONE, and that is the point
 * of it being a function rather than a constant at each call site. The config
 * imports a module per method by RELATIVE specifier, so a consumer given only
 * the config fails at import with a MISSING-MODULE ERROR -- which looks exactly
 * like the dependency-resolution failure these probes exist to observe, and
 * would be misdiagnosed as one. The artifact under test is the SET, and no
 * fixture copy of any member exists.
 *
 * AND THE INSTALLED HANDLERS ARE NOT IN IT, WHICH IS A DIFFERENT KIND OF ABSENCE
 * FROM A MISSING ENTRY. They are not copied at all: the config imports
 * `@atusy/tsudoi-hover-wordnet` and `@atusy/tsudoi-completion-path` by PACKAGE
 * SPECIFIER, and installConsumer installs each package's own tarball beside
 * tsudoi's. Adding their source back here would put the bytes in the consumer
 * that criterion 1 asserts are absent, and every probe would still pass -- which
 * is why the omission is written down rather than left to be read off the list.
 *
 * STATED AS A SET RATHER THAN A NUMBER, and that is the load-bearing choice: a
 * count in prose falsifies itself the next time the thing it counts grows, and
 * nothing about editing the returned object draws the editor's eye up here. The
 * set grows; the sentence must not have to.
 */
export function exampleSources(): Record<string, string> {
  return {
    "tsudoi.config.ts": readFileSync(
      fileURLToPath(new URL("../../examples/tsudoi.config.ts", import.meta.url)),
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
  };
}

/**
 * What a staging directory holds, sorted, READ BACK RATHER THAN LISTED.
 *
 * A list written here would agree with a staging step that had grown a fourth
 * copy, which is the one thing this reader exists to disagree with. It reports
 * BY NAME rather than by a count, so a violating entry appears in the failure
 * text instead of a number that moved.
 *
 * The set it observes is pinned by `the pack stage receives package.json, src/
 * and tsconfig.build.json, and nothing else` in
 * test/installed-specifier.test.ts, and the pair beside it shows this same
 * reader naming a fifth path when one is there.
 */
export function stageEntries(stage: string): readonly string[] {
  return readdirSync(stage).sort();
}

/**
 * One package's TARBALL, packed at test time and read back -- what a registry
 * would receive, rather than what a manifest says it would.
 *
 * WHY THE TARBALL AND NOT `files`: `files` is an INSTRUCTION and the tarball is
 * its result, and the two part company the moment anything writes a file the
 * instruction happens to admit. A `prepack` that compiles into a directory it
 * does not clear leaves a renamed or deleted output on disk, and `files:
 * ["dist"]` packs it -- so a reading taken off the manifest reports the intent
 * of an edit nobody made.
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
 * PACKED FROM WHERE IT LIVES, matching what installConsumer does with the
 * handler: a staged copy would be a different tree, and the staleness this reader
 * exists to see is a property of the directory that persists between packs.
 *
 * `tar` RATHER THAN A LIBRARY: the archive is what a package manager will read,
 * and a second implementation of tar is a second thing to be wrong about it.
 */
export async function packPackage(packageRoot: string): Promise<PackedPackage> {
  const stage = mkdtempSync(join(tmpdir(), "tsudoi-tarball-"));
  const dispose = (): void => rmSync(stage, { recursive: true, force: true });
  try {
    const packed = await run("bun", ["pm", "pack", "--destination", stage], packageRoot);
    if (packed.code !== 0) {
      fail(`bun pm pack (${packageRoot})`, packed);
    }
    // Found rather than spelled, for the reason installConsumer gives: the
    // filename is the packer's derivation, and the stage is a fresh mkdtemp
    // holding exactly one .tgz.
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
        // THE PREFIX IS REFUSED RATHER THAN STRIPPED WHERE IT IS ABSENT: npm's
        // archive layout puts everything under `package/`, and an entry outside
        // it is a shape this reader has no account of -- reporting it as a
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
 *
 * OVER MEMBERS AS A CLASS, on the same reasoning as the fifth Definition-of-Done
 * check and test/packed-members.test.ts: a name written here would go quietly
 * narrow at the second member, and a consumer missing one of the packages the
 * demo config imports fails at config load with no test saying which package was
 * never installed.
 *
 * THE DIRECTORY IS THE MEMBER'S OWN AND NOT THE WORKSPACE LINK. Both routes
 * reach the same tree, and `declaredMembers` is the enumerator every other tool
 * in this repository reads -- so taking the names from `workspaces` and the
 * directories from a node_modules walk would be two answers to one question.
 */
const handlerRoots = declaredMembers(repoRoot).map((dir) => realpathSync(dir));

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
   * IT, and the distinction is written here because the other semantics fail
   * SILENTLY: an override that REPLACES a rule's options rather than merging
   * them turns off every option it did not restate, and the thing it turns off
   * can be the guard in the very file whose purpose is guarding. Merging means
   * a probe that moves ONE option keeps the other six identical to every
   * consumer probe in the suite, so a red it produces is about the option it
   * moved.
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
  /**
   * Leaves ONE NAMED handler package out of the install, which is criterion 1's
   * negative control and nothing else's.
   *
   * WHAT IT HAS TO PRODUCE, or the green beside it records nothing: a failure
   * NAMING THE SPECIFIER. An empty answer would mean the probe is measuring
   * something other than the handler, and an answer that still ARRIVED would
   * mean some other route -- a copied file, a hoisted stray -- is supplying it.
   *
   * A NAME AND NOT A FLAG, because with two members a flag withholds both and
   * the config then fails on whichever import the loader reached first: the
   * specifier in stderr would name a package the caller did not choose, and the
   * control would silently stop being about the package under test. An
   * unrecognised name is refused rather than ignored, since a typo would leave
   * every member installed and the negative control passing on the positive tree.
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
  // ONE STAGE PER MEMBER, and it is the same reason each member is packed into a
  // directory of its own below: the tarball filename is FOUND rather than
  // spelled, and that search is sound only while a directory holds exactly one
  // .tgz.
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
    const packageJson: Record<string, unknown> = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    ) as Record<string, unknown>;
    options.editPackage?.(packageJson);
    writeFileSync(join(stage, "package.json"), JSON.stringify(packageJson, null, 2));
    cpSync(join(repoRoot, "src"), join(stage, "src"), { recursive: true });
    options.editSource?.(join(stage, "src"));
    // tsconfig.build.json AND NOT tsconfig.json, and the omission is the load-
    // bearing half: the repo's tsconfig.json carries a `paths` mapping that
    // resolves `@atusy/tsudoi-language-server/*` to src/, and a stage that inherited it would
    // type-check the thing we publish against sources we do not ship. A FOURTH
    // COPY ADDED HERE REDDENS `the pack stage receives package.json, src/ and
    // tsconfig.build.json, and nothing else` in
    // test/installed-specifier.test.ts, which names what it found.
    cpSync(join(repoRoot, "tsconfig.build.json"), join(stage, "tsconfig.build.json"));
    symlinkSync(join(repoRoot, "node_modules"), join(stage, "node_modules"), "dir");
    // Captured HERE rather than after the pack: `bun pm pack` writes the tarball
    // into this same directory, so a reading taken later would see a fifth entry
    // that no copying step put there.
    const staged = stageEntries(stage);

    const packed = await run("bun", ["pm", "pack", "--destination", stage], stage);
    if (packed.code !== 0) {
      fail("bun pm pack", packed);
    }
    // Found rather than spelled out: bun derives the filename from name and
    // version, so hardcoding it would turn the next version bump into a
    // puzzling ENOENT.
    //
    // NOT ASSERTED AGAINST package.json's `name` EITHER, which is the edit this
    // looseness invites and the reason it is refused: the filename is the
    // PACKER'S derivation, not this package's identity, so an equality here
    // would pin how bun spells a temporary file and would redden on a change
    // that costs a consumer nothing. Nor can the search pick the wrong
    // artifact -- the stage is a fresh mkdtemp holding exactly one .tgz.
    // WHAT THE NAME MUST REACH ON THIS ROUTE IS THE INSTALL LAYOUT, spelled at
    // `packageDir` below, and reverting `name` reddens the consumer suite
    // through that rather than through this line. README.md declines the
    // derived filename outright for its own reason, packing with
    // `--filename tsudoi.tgz` so the command it hands a reader cannot go stale
    // at a release.
    const tarballName = readdirSync(stage).find((entry) => entry.endsWith(".tgz"));
    if (tarballName === undefined) {
      fail("bun pm pack", { code: packed.code, output: `no .tgz in ${stage}\n${packed.output}` });
    }
    const tarball = join(stage, tarballName);

    // EVERY HANDLER PACKAGE IS PACKED FROM WHERE IT LIVES, not from a staged
    // copy, and the asymmetry with the block above is deliberate rather than an
    // oversight. The staging exists to let `editPackage` and `editSource` perturb
    // what gets packed; no probe perturbs a member, and a copy would only add
    // a second place for its build to go wrong. Each member's own `prepack`
    // compiles it in place, so every tarball is still built at test time from
    // current source.
    //
    // ONE DESTINATION DIRECTORY EACH, AND THAT IS LOAD-BEARING: the tarball
    // filename is FOUND rather than spelled, for the reason written above, and
    // that search is sound only while a stage holds exactly one .tgz. Packing
    // two members into one directory would make each search able to pick the
    // other's.
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
    // A NAME THAT MATCHED NOTHING IS A FAILED CONTROL WEARING A PASS: every
    // member would be installed, the config would load, and the caller's
    // negative assertion would be taken against the positive tree.
    if (omitted !== undefined && !withheld) {
      throw new Error(
        `installConsumer was asked to omit ${omitted}, which is not a workspace member: ${handlerRoots.map(packageNameOf).join(", ")}`,
      );
    }

    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ name: "tsudoi-consumer", version: "1.0.0", type: "module", private: true }),
    );
    // BOTH TARBALLS IN ONE COMMAND, which is the route the README states and the
    // only one that puts the two packages in the same node_modules -- the handler
    // declares tsudoi as a PEER, so it must find the consumer's copy by walking
    // up rather than carry one of its own.
    const installed = await run("bun", ["install", tarball, ...handlerTarballs], consumer);
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
    // `wordnet` IS NOT BORROWED, AND THE PREMISE THAT MADE IT A LOAN IS GONE
    // RATHER THAN RESTATED. It stood in for an install a README told a reader to
    // perform by hand, which was worth faking because it proved nothing about
    // tsudoi. NOW `@atusy/tsudoi-hover-wordnet` DECLARES IT, so the line above
    // installs it for real -- MEASURED: the consumer's node_modules/wordnet is
    // there before this point is reached, which is what turned the symlink into
    // an EEXIST rather than into a redundancy nobody would have noticed.
    //
    // WHAT THAT COSTS AND WHY IT IS WORTH IT: a cold bun cache now fetches 27MB
    // once for the whole suite, where before it fetched none. What it buys is
    // that the dependency arrives BY THE ROUTE UNDER TEST -- a consumer who
    // installs the handler gets its dependency -- so a handler package that
    // FORGOT to declare `wordnet` reddens here instead of being propped up by a
    // symlink this helper puts in reach of it.

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
