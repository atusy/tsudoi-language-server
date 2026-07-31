// THE README IS THE ARTIFACT UNDER TEST, AND EVERY CRITERION HERE IS VACUOUS
// UNLESS THE TESTS READ ITS OWN BYTES.
//
// This file is where someone will one day `simplify` a test by inlining the
// command, the flag, the exit code or the prefix it expects. That edit costs
// nothing and destroys everything: a plausible-but-wrong README -- right shape,
// stale command, wrong flag, wrong exit code -- passes every test holding its
// own copy, and fails one that EXTRACTS. It is the same property that keeps
// examples/tsudoi.config.ts from rotting, applied to prose.
// If you need a constant here, ask first whether a README that contradicted it
// would still be green.
//
// SECOND, AND THE SUBTLER ONE: AN EXTRACTOR THAT FINDS NOTHING PASSES. Move the
// markers, rename an attribute, reformat a table, and extraction yields no
// commands at all -- `every extracted command succeeds` is then VACUOUSLY TRUE,
// and the README rots exactly as if the tests held their own copy. Mechanism
// satisfied, property false. So every extractor in this file THROWS on an
// unexpected count before it returns anything, the count is a constant the
// tests hold rather than one read out of the document, and test/readme.test.ts
// keeps a permanent probe -- this README with its markers deleted -- that
// asserts the throw happens. Those guards are not one-time perturbations and
// must not be relaxed into `return []`.
//
// The same shape twice more, recorded because it is not obvious both times:
// invocationOf throws rather than reporting an empty flag list, and a fact
// asserted by token-conjunction can only be defended by UNIQUENESS -- deleting
// a token always falsifies a conjunction, so that control cannot fail and is
// deliberately not offered.
import { Buffer } from "node:buffer";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { initializeParams, LspSession } from "./lsp.ts";
import { repoRoot, runCommand } from "./spawn.ts";

/** README.md itself -- the artifact under test, read at call time. */
export function readReadme(): string {
  return readFileSync(fileURLToPath(new URL("../../README.md", import.meta.url)), "utf8");
}

/**
 * How many marked steps the quickstart has. A CONSTANT the test holds, and it
 * has to be: a count read out of the README would be satisfied by a README
 * carrying no steps at all.
 *
 * Documenting a new step therefore fails here until this number is raised,
 * which is what keeps the omission sweep covering every step there is.
 */
export const QUICKSTART_STEPS = 5;

/** A step a reader RUNS, as one command line in one directory. */
export interface RunStep {
  readonly kind: "run";
  /** Directory, relative to the parent of both, the command is run in. */
  readonly dir: string;
  readonly command: string;
  /** Set on the step that starts the server, naming the runtime it starts under. */
  readonly starts: "bun" | "deno" | undefined;
}

/** A step a reader WRITES: a file, with the contents the README shows. */
export interface WriteStep {
  readonly kind: "write";
  readonly dir: string;
  /** Path of the file, relative to `dir`. */
  readonly path: string;
  readonly contents: string;
}

export type QuickstartStep = RunStep | WriteStep;

/** Everything a READER sees: markers and code blocks removed. */
function visibleProse(markdown: string): string {
  return markdown.replaceAll(/<!--[\s\S]*?-->/g, "").replaceAll(/```[\s\S]*?```/g, "");
}

function attributes(text: string): Map<string, string> {
  return new Map(
    [...text.matchAll(/([a-z]+)=(\S+)/g)].map(([, key, value]) => [key ?? "", value ?? ""]),
  );
}

/**
 * The quickstart's steps, in document order, read out of the README's own bytes.
 *
 * THROWS unless it finds exactly `expected` of them, and throws before anything
 * here looks at what it found. An extractor that quietly returns an empty list
 * satisfies every downstream assertion vacuously -- `each extracted command
 * succeeds` is true of no commands -- so the count is the first thing checked
 * and the caller is given no way to skip it.
 */
export function extractQuickstart(markdown: string, expected: number): QuickstartStep[] {
  const blocks = [
    ...markdown.matchAll(/<!--\s*quickstart\b([^>]*?)-->\s*\n```[a-z]*\n([\s\S]*?)\n```/g),
  ];
  if (blocks.length !== expected) {
    throw new Error(
      `README quickstart: expected ${String(expected)} marked blocks, found ${String(blocks.length)}`,
    );
  }

  const prose = visibleProse(markdown);
  const steps = blocks.map(([, marker = "", body = ""]) => {
    const attrs = attributes(marker);
    const dir = attrs.get("in");
    if (dir === undefined) {
      throw new Error(`README quickstart: a marked block does not say which directory: ${marker}`);
    }
    // The directory is stated twice -- in the marker this test obeys and in the
    // prose the reader obeys -- so the two are required to be the same string.
    // Without this, a marker could name the directory that works while the
    // README told the reader to stand somewhere else, and everything here would
    // still pass.
    if (!prose.includes(dir)) {
      throw new Error(
        `README quickstart: the marker says in=${dir}, but no prose a reader sees names ${dir}`,
      );
    }

    const path = attrs.get("write");
    if (path !== undefined) {
      return { kind: "write", dir, path, contents: `${body}\n` } as const;
    }

    const lines = body.split("\n").filter((line) => line.trim() !== "");
    const [command] = lines;
    if (lines.length !== 1 || command === undefined) {
      throw new Error(
        `README quickstart: a step must be ONE command a reader can run verbatim; got ${String(lines.length)} lines`,
      );
    }
    const starts = attrs.get("start");
    if (starts !== undefined && starts !== "bun" && starts !== "deno") {
      throw new Error(`README quickstart: unknown runtime start=${starts}`);
    }
    return { kind: "run", dir, command, starts } as const;
  });

  for (const runtime of ["bun", "deno"] as const) {
    const starting = steps.filter((step) => step.kind === "run" && step.starts === runtime);
    if (starting.length !== 1) {
      throw new Error(
        `README quickstart: expected exactly one start=${runtime} step, found ${String(starting.length)}`,
      );
    }
  }
  return steps;
}

/**
 * The install command the README gives a reader who copies examples/, read out
 * of the document's own bytes.
 *
 * A MARKER OF ITS OWN rather than a sixth `quickstart` step, and the reason is
 * the omission sweep: that sweep asserts that dropping any quickstart step
 * leaves a reader with no server, and dropping this one leaves the quickstart
 * config working perfectly -- it imports `@atusy/tsudoi-language-server/types`
 * and nothing else. Folding this in would have made the sweep assert something
 * false about it.
 *
 * NOT EXECUTED BY ANYTHING, stated here because the neighbouring extractors all
 * are and a reader would otherwise assume it. What consumes this is a
 * SOURCE-TEXT assertion in test/readme.test.ts; the property that the config
 * works once the handler package is installed is carried by
 * test/published-artifacts.test.ts, whose consumer installs that package's own
 * tarball rather than standing in for the install.
 *
 * THROWS unless it finds exactly one block, and this guard is load-bearing in a
 * way the quickstart's is not: the assertion downstream is NEGATIVE -- the
 * command names no protocol package -- and a negative assertion over a command
 * nobody found is satisfied by every document ever written, including one that
 * still tells a reader to install it.
 */
export function extractExamplesInstall(markdown: string): string {
  const blocks = [
    ...markdown.matchAll(/<!--\s*examples-install\s*-->\s*\n\s*```[a-z]*\n([\s\S]*?)\n\s*```/g),
  ];
  if (blocks.length !== 1) {
    throw new Error(
      `README examples install: expected 1 marked block, found ${String(blocks.length)}`,
    );
  }
  const lines = (blocks[0]?.[1] ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const [command] = lines;
  if (lines.length !== 1 || command === undefined) {
    throw new Error(
      `README examples install: expected ONE command a reader can run verbatim; got ${String(lines.length)} lines`,
    );
  }
  return command;
}

/**
 * The command the README tells a reader to PACK the handler package with, and
 * the directory it says to run it in.
 *
 * EXECUTED, unlike the install command beside it, and that asymmetry is the
 * whole reason this is a separate extractor rather than a second use of the one
 * above. The pack runs inside this repository, needs nothing a reader owns, and
 * COMPILES the package -- so a wrong directory, a wrong command, or a build that
 * cannot resolve reddens by running. MEASURED, and it is why this exists: on a
 * checkout where only `bun install` had run, the documented command failed at
 * TS2307 and the document said nothing about it.
 *
 * THE DIRECTORY IS STATED TWICE -- in the marker this test obeys and in the prose
 * the reader obeys -- and required to be the same string, for the reason the
 * quickstart extractor gives: a marker could otherwise name the directory that
 * works while the README sent the reader somewhere else.
 *
 * THROWS unless it finds exactly one block, and the guard is what makes the
 * execution mean anything: a command nobody found runs vacuously green.
 */
export function extractHandlerPack(markdown: string): { dir: string; command: string } {
  const blocks = [
    ...markdown.matchAll(/<!--\s*handler-pack\b([^>]*?)-->\s*\n\s*```[a-z]*\n([\s\S]*?)\n\s*```/g),
  ];
  if (blocks.length !== 1) {
    throw new Error(`README handler pack: expected 1 marked block, found ${String(blocks.length)}`);
  }
  const dir = attributes(blocks[0]?.[1] ?? "").get("in");
  if (dir === undefined) {
    throw new Error("README handler pack: the marked block does not say which directory");
  }
  if (!visibleProse(markdown).includes(dir)) {
    throw new Error(
      `README handler pack: the marker says in=${dir}, but no prose a reader sees names ${dir}`,
    );
  }
  const lines = (blocks[0]?.[2] ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const [command] = lines;
  if (lines.length !== 1 || command === undefined) {
    throw new Error(
      `README handler pack: expected ONE command a reader can run verbatim; got ${String(lines.length)} lines`,
    );
  }
  return { dir, command };
}

/** The steps ONE runtime's reader follows: the shared ones, plus its own start. */
export function sequenceFor(
  steps: readonly QuickstartStep[],
  runtime: "bun" | "deno",
): QuickstartStep[] {
  return steps.filter(
    (step) => step.kind !== "run" || step.starts === undefined || step.starts === runtime,
  );
}

/** What running a documented sequence produced, and why when it produced nothing. */
export interface QuickstartOutcome {
  /** `serverInfo.name` from the handshake, or undefined if there was none. */
  readonly serverName: string | undefined;
  /**
   * Bytes on stdout no framed message accounts for -- UNDEFINED when no server
   * was started, so `zero stray bytes` cannot pass for a run that never
   * produced any bytes at all.
   */
  readonly unframedStdoutBytes: number | undefined;
  /** Every step, with what it exited with; the failure's own account of itself. */
  readonly diagnosis: string;
}

/**
 * A parent directory holding the layout the README draws, with the checkout
 * populated and the reader's own project EMPTY.
 *
 * THE ENVIRONMENT IS BARE, and that is the point rather than a detail: no
 * tarball, no node_modules, no config file, nothing dist/. Criterion 1 asks
 * whether the documented steps are SUFFICIENT, and a stage that supplied any of
 * them would make the quickstart's pass a test of this function instead.
 *
 * The staging here duplicates a few lines of installConsumer deliberately.
 * installConsumer PERFORMS the pack and the install -- two of the documented
 * steps -- so reusing it would supply exactly what the reader is asked to do.
 * What the two share is `what a checkout with its dependencies installed
 * contains`, and if that ever drifts the build fails loudly here rather than
 * passing quietly.
 *
 * The checkout's directory name is not chosen: it is this repository's own
 * directory name, which is what `git clone` creates. A README that renamed it
 * in the marker would be staged with no checkout, and the pack step would say so.
 */
function stageQuickstart(dirs: readonly string[]): { readonly root: string; dispose: () => void } {
  const checkoutName = basename(repoRoot);
  const distinct = [...new Set(dirs)];
  if (!distinct.includes(checkoutName)) {
    throw new Error(
      `README quickstart: no step runs in ${checkoutName}, so nothing stages the checkout the tarball is built from`,
    );
  }
  if (distinct.length < 2) {
    throw new Error("README quickstart: every step runs in the checkout; nothing is the reader's");
  }

  const root = mkdtempSync(join(tmpdir(), "tsudoi-readme-"));
  try {
    for (const dir of distinct) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    const checkout = join(root, checkoutName);
    cpSync(join(repoRoot, "package.json"), join(checkout, "package.json"));
    cpSync(join(repoRoot, "tsconfig.build.json"), join(checkout, "tsconfig.build.json"));
    cpSync(join(repoRoot, "src"), join(checkout, "src"), { recursive: true });
    // `bun install` already run, which the README names as a prerequisite: the
    // prepack build needs vscode-languageserver-protocol's types to compile.
    symlinkSync(join(repoRoot, "node_modules"), join(checkout, "node_modules"), "dir");
    return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
  } catch (cause) {
    rmSync(root, { recursive: true, force: true });
    throw cause;
  }
}

/** Long enough that a slow machine is not a failure, short enough to fail rather than hang. */
const handshakeTimeoutMs = 20_000;

async function shakeHands(
  command: string,
  cwd: string,
): Promise<{ name: string | undefined; bytes: number; note: string }> {
  const session = LspSession.startCommand(command, cwd);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const settled = await Promise.race([
      session.request<InitializeResult>("initialize", initializeParams).then(
        (value) => value,
        (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause))),
      ),
      new Promise<Error>((resolve) => {
        timer = setTimeout(
          () => resolve(new Error(`no answer to initialize in ${String(handshakeTimeoutMs)}ms`)),
          handshakeTimeoutMs,
        );
      }),
    ]);
    if (settled instanceof Error) {
      return { name: undefined, bytes: session.unframedStdoutBytes, note: settled.message };
    }
    return {
      name: settled.serverInfo?.name,
      bytes: session.unframedStdoutBytes,
      note: `initialize answered by ${settled.serverInfo?.name ?? "a server naming nothing"}`,
    };
  } finally {
    clearTimeout(timer);
    session.dispose();
  }
}

/**
 * Runs a documented sequence in a FRESH bare environment and reports what it
 * produced.
 *
 * The stage is created in here, per call, with no way for a caller to hand one
 * in. The omission sweep runs this many times, and a stage shared between runs
 * would carry the previous run's tarball into the iteration that omits the pack
 * step -- an omitted step passing because the environment kept its output is
 * the exact failure the sweep exists to detect.
 *
 * The layout comes from the WHOLE quickstart rather than from the sequence being
 * run, so omitting a step changes what is EXECUTED and never what exists.
 */
export async function runQuickstart(
  sequence: readonly QuickstartStep[],
): Promise<QuickstartOutcome> {
  const layout = extractQuickstart(readReadme(), QUICKSTART_STEPS);
  const stage = stageQuickstart(layout.map((step) => step.dir));
  const notes: string[] = [];
  let serverName: string | undefined;
  let unframedStdoutBytes: number | undefined;
  try {
    for (const step of sequence) {
      const cwd = join(stage.root, step.dir);
      if (step.kind === "write") {
        mkdirSync(dirname(join(cwd, step.path)), { recursive: true });
        writeFileSync(join(cwd, step.path), step.contents);
        notes.push(`wrote ${step.path}`);
        continue;
      }
      if (step.starts === undefined) {
        // Not aborted on failure: a reader who fumbled step 2 still has step 3
        // in front of them, and `the rest ran anyway and still produced no
        // server` is the stronger claim.
        const result = await runCommand(step.command, cwd);
        notes.push(`${step.command} -> exit ${String(result.code)} ${result.stderr.trim()}`);
        continue;
      }
      const handshake = await shakeHands(step.command, cwd);
      serverName = handshake.name;
      unframedStdoutBytes = handshake.bytes;
      notes.push(`${step.command} -> ${handshake.note}`);
    }
  } finally {
    stage.dispose();
  }
  if (serverName === undefined) {
    notes.push("no step started a server");
  }
  return { serverName, unframedStdoutBytes, diagnosis: notes.join("\n") };
}

/** A command line split the way a runtime reads it. */
export interface Invocation {
  readonly program: string;
  /** What comes before the script path: `run`, and any permission flags. */
  readonly runArgs: string[];
  readonly script: string;
  readonly args: string[];
}

/**
 * Splits a documented command into the parts a runtime distinguishes.
 *
 * THROWS when there is no script path, and therefore no flags to speak of: a
 * command that parsed to an empty flag list would make `the documented flags
 * are the ones the suite spawns` true of nothing at all -- the same vacuity as
 * an extractor that finds no blocks, one level down.
 */
export function invocationOf(command: string): Invocation {
  const [program, ...rest] = command.split(" ");
  const scriptIndex = rest.findIndex((token) => token.includes("/"));
  if (program === undefined || scriptIndex === -1) {
    throw new Error(`README quickstart: no script path in ${command}`);
  }
  const runArgs = rest.slice(0, scriptIndex);
  if (runArgs.length === 0) {
    throw new Error(`README quickstart: nothing between the runtime and the script in ${command}`);
  }
  return {
    program,
    runArgs,
    script: rest[scriptIndex] ?? "",
    args: rest.slice(scriptIndex + 1),
  };
}

/** The one step that starts the server under `runtime`. */
export function startStep(steps: readonly QuickstartStep[], runtime: "bun" | "deno"): RunStep {
  const step = steps.find((candidate) => candidate.kind === "run" && candidate.starts === runtime);
  if (step === undefined || step.kind !== "run") {
    throw new Error(`README quickstart: no step starts the server under ${runtime}`);
  }
  return step;
}

/**
 * A fact the README owes a reader, as the TOKENS that discriminate it.
 *
 * Tokens rather than sentences, in both directions: rewording a sentence must
 * still find the fact, and deleting the fact must lose it. A test that matched
 * a sentence would fail on an improvement to the prose, which teaches the next
 * person to delete the test.
 */
export interface ReadmeFact {
  readonly name: string;
  /** All of these must appear within ONE section of the document. */
  readonly tokens: readonly RegExp[];
}

/**
 * Sections, not paragraphs: a fact and its reason routinely span two
 * paragraphs, and a paragraph-scoped match would push the author to cram them
 * into one sentence. The discrimination lost is bought back by the permanent
 * pair -- every token of every fact is deleted from a copy of the README and
 * the fact must then be ABSENT.
 */
function sections(markdown: string): string[] {
  return markdown.split(/\n(?=#{1,6} )/);
}

export function statesFact(markdown: string, fact: ReadmeFact): boolean {
  return sectionsStating(markdown, fact).length > 0;
}

/**
 * The sections that state `fact` -- normally exactly one, and the test that it
 * IS one is the removal half of criterion 3.
 *
 * NOT OFFERED, deliberately: a `withoutToken` that deletes a token and asserts
 * the fact is gone. That assertion holds for every conjunction of tokens over
 * every document, including a document that says nothing -- a test that cannot
 * fail. Uniqueness can fail, and it fails exactly when a fact is satisfied
 * INCIDENTALLY by tokens scattered somewhere that does not state it.
 */
export function sectionsStating(markdown: string, fact: ReadmeFact): string[] {
  return sections(markdown).filter((section) => fact.tokens.every((token) => token.test(section)));
}

/**
 * The document with every section's sentences REORDERED and its lines reflowed
 * onto one -- a mechanical stand-in for the edit a writer makes when they
 * improve the prose.
 *
 * A fact that stops being found here was matched on sentence structure rather
 * than on tokens, which is the half of criterion 3 that fails in the opposite
 * direction from removal.
 */
export function reword(markdown: string): string {
  return sections(markdown)
    .map((section) => section.split(". ").reverse().join(". ").replaceAll("\n", " "))
    .join("\n");
}

/** What the README says an editor sees when the config is wrong. */
export interface FailureContract {
  readonly exitCode: number;
  readonly stderrPrefix: string;
  readonly stdoutBytes: number;
}

/**
 * The failure contract, read out of the table a READER reads.
 *
 * The values live in the rendered table rather than in a marker, on purpose: a
 * value hidden in an HTML comment could drift from the sentence beside it and
 * every test here would still pass while the README lied. What is asserted has
 * to be what is read.
 *
 * THROWS unless all three rows are found, for the same reason the quickstart
 * extractor throws on a count: a contract of no values is satisfied by anything.
 */
export function extractFailureContract(markdown: string): FailureContract {
  const marker = markdown.indexOf("<!-- failure-contract -->");
  if (marker === -1) {
    throw new Error("README failure contract: no <!-- failure-contract --> marker");
  }
  const values = new Map<string, string>();
  for (const line of markdown.slice(marker).split("\n").slice(1)) {
    if (line.trim() === "") {
      continue;
    }
    if (!line.startsWith("|")) {
      break;
    }
    const row = /^\|([^|]+)\|\s*`([^`]*)`\s*\|$/.exec(line);
    if (row !== null) {
      values.set((row[1] ?? "").trim(), row[2] ?? "");
    }
  }

  const find = (what: RegExp): string => {
    const hit = [...values].find(([label]) => what.test(label));
    if (hit === undefined) {
      throw new Error(
        `README failure contract: no row for ${String(what)} among ${[...values.keys()].join(", ")}`,
      );
    }
    return hit[1];
  };
  const number = (what: RegExp): number => {
    const value = Number(find(what));
    if (!Number.isInteger(value)) {
      throw new Error(`README failure contract: ${String(what)} is not a whole number`);
    }
    return value;
  };
  return {
    exitCode: number(/exit code/i),
    stderrPrefix: find(/stderr/i),
    stdoutBytes: number(/stdout/i),
  };
}

/** What a run of the quickstart with a BROKEN config produced. */
export interface BrokenConfigOutcome {
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
  /**
   * Bytes THIS measurement saw on stdout during the setup steps -- the
   * permanent pair for `zero bytes on stdout`. An apparatus that counted
   * nothing anywhere would satisfy the absence assertion on every run.
   */
  readonly stdoutBytesSeenElsewhere: number;
}

/** A config that loads and exports the wrong thing: the reader's likeliest mistake. */
const brokenConfig = "export const notDefault = 1;\n";

/**
 * Runs the documented sequence, replaces the config the README told the reader
 * to write with one that has no default export, and runs the documented start
 * command to COMPLETION.
 *
 * The command is the README's own start line, unchanged: a failure case run
 * against some other entry point would prove nothing about the route a reader
 * takes.
 */
export async function runQuickstartWithBrokenConfig(
  sequence: readonly QuickstartStep[],
): Promise<BrokenConfigOutcome> {
  const layout = extractQuickstart(readReadme(), QUICKSTART_STEPS);
  const stage = stageQuickstart(layout.map((step) => step.dir));
  let stdoutBytesSeenElsewhere = 0;
  try {
    for (const step of sequence) {
      const cwd = join(stage.root, step.dir);
      if (step.kind === "write") {
        mkdirSync(dirname(join(cwd, step.path)), { recursive: true });
        writeFileSync(join(cwd, step.path), brokenConfig);
        continue;
      }
      if (step.starts === undefined) {
        const result = await runCommand(step.command, cwd);
        stdoutBytesSeenElsewhere += Buffer.byteLength(result.stdout, "utf8");
        continue;
      }
      const failed = await runCommand(step.command, cwd);
      return { ...failed, stdoutBytesSeenElsewhere };
    }
    throw new Error("README quickstart: nothing in this sequence starts the server");
  } finally {
    stage.dispose();
  }
}
