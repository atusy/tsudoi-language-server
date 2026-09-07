// THE README IS THE ARTIFACT UNDER TEST, AND EVERY CRITERION HERE IS VACUOUS
// UNLESS THE TESTS READ ITS OWN BYTES. Inlining the command, the flag, the exit
// code or the prefix a test expects costs nothing and destroys everything: a
// plausible-but-wrong README -- right shape, stale command, wrong flag -- passes
// every test holding its own copy and fails one that EXTRACTS. If you need a
// constant here, ask first whether a README that contradicted it would still be
// green.
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
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { declaredMembers, handlerMembers, trackedReadmes } from "../../scripts/workspaces.ts";
import { initializeParams, LspSession } from "./lsp.ts";
import { frameworkRoot, repoRoot, runCommand } from "./spawn.ts";

/** The complete guide -- the executable documentation, read at call time. */
export function readReadme(): string {
  return readFileSync(fileURLToPath(new URL("../../docs/README.md", import.meta.url)), "utf8");
}

/**
 * One workspace member's README -- the document a registry page would show.
 */
export function readMemberReadme(member: string): string {
  return readFileSync(join(member, "README.md"), "utf8");
}

/**
 * How many marked steps the quickstart has. A CONSTANT the test holds, and it
 * has to be: a count read out of the README is satisfied by a README carrying no
 * steps at all, and nothing reddens when it is read that way.
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

/**
 * Everything a READER sees: markers and code blocks removed.
 *
 * THE BLOCKS COME OUT BY OFFSET, THROUGH THE ONE READER BELOW, and not by a
 * second expression matching backticks: two spellings of `what a fenced block
 * is` is what this join exists to kill, and the second one was wrong in the
 * PERMITTING direction -- three backticks match nothing tilde-fenced, so a
 * directory named ONLY inside a `~~~` block counted as prose a reader sees.
 *
 * BACK TO FRONT, so removing one block does not move the next one's offset, and
 * nothing reddens if you go the other way.
 */
function visibleProse(markdown: string): string {
  let prose = markdown.replaceAll(/<!--[\s\S]*?-->/g, "");
  for (const block of [...fencedBlocks(prose)].reverse()) {
    prose = `${prose.slice(0, block.offset)}${prose.slice(block.end)}`;
  }
  return prose;
}

function attributes(text: string): Map<string, string> {
  return new Map(
    [...text.matchAll(/([a-z]+)=(\S+)/g)].map(([, key, value]) => [key ?? "", value ?? ""]),
  );
}

/** One fenced block, LOCATED so that two readers of this document can join on it. */
export interface FencedBlock {
  /**
   * Where the opening fence starts, as an index into the markdown.
   *
   * IT IS THE IDENTITY AND NOT A CONVENIENCE. A sweep over `the document's
   * blocks` and an extractor over `the blocks something consumes` are only
   * comparable if both name a block the same way, and every other candidate --
   * the body, the info string, the line -- can repeat within one document.
   */
  readonly offset: number;
  /**
   * Where the block stops, as an index just past its CLOSING fence.
   *
   * IT IS HERE SO THAT `visibleProse` CAN CUT A BLOCK OUT BY OFFSET rather than
   * match one again: a caller given only the opening offset would have to find
   * the end itself, which is the second matcher arriving by the back door.
   */
  readonly end: number;
  /** 1-based line of the opening fence, for a message a reader can walk to. */
  readonly line: number;
  /** The info string, trimmed. `""` when the fence carries none. */
  readonly info: string;
  /** The bytes between the fences, with no trailing newline. */
  readonly body: string;
}

/**
 * EVERY FENCED BLOCK IN A MARKDOWN DOCUMENT, AND THE ONLY MATCHER IN THIS FILE
 * THAT FINDS ONE.
 *
 * THE READER READS FENCES AND INFO STRINGS, NEVER BODIES. Deciding `is this text
 * a command` by looking at what is written inside a block is a matcher for a
 * defect that is a property of matching, and this repository refuses that shape
 * by name.
 *
 * WHAT IT CANNOT SEE, NAMED RATHER THAN FIXED: a four-space indented code block,
 * which has no fence and therefore no info string and no marker position. A
 * document that wrote its commands that way is invisible here.
 *
 * AN UNCLOSED FENCE THROWS, and nothing reddens if it stops: the alternative is
 * to treat the rest of the document as one enormous block, which silently
 * swallows every block after it -- a sweep whose input quietly shrank, which is
 * the vacuity this file exists against.
 */
export function fencedBlocks(markdown: string): readonly FencedBlock[] {
  const blocks: FencedBlock[] = [];
  let open: { run: string; offset: number; line: number; info: string; body: string[] } | undefined;
  let offset = 0;
  for (const [index, line] of markdown.split("\n").entries()) {
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    const run = fence?.[1] ?? "";
    if (open === undefined) {
      if (fence !== null) {
        open = {
          run,
          offset: offset + line.indexOf(run),
          line: index + 1,
          info: (fence[2] ?? "").trim(),
          body: [],
        };
      }
    } else if (
      run[0] === open.run[0] &&
      run.length >= open.run.length &&
      (fence?.[2] ?? "") === ""
    ) {
      blocks.push({
        offset: open.offset,
        end: offset + line.length,
        line: open.line,
        info: open.info,
        body: open.body.join("\n"),
      });
      open = undefined;
    } else {
      open.body.push(line);
    }
    offset += line.length + 1;
  }
  if (open !== undefined) {
    throw new Error(
      `a fence opened at line ${String(open.line)} is never closed, so every block after it would be read as part of it`,
    );
  }
  return blocks;
}

/** A block a marker routes somewhere, with the marker's own attribute text. */
export interface MarkedBlock {
  /** Everything the marker said after its name -- what `attributes` reads. */
  readonly marker: string;
  readonly block: FencedBlock;
}

/**
 * The blocks ONE marker names, selected out of `fencedBlocks` rather than found
 * by a second expression.
 *
 * THIS IS WHAT MAKES `NO SECOND PARSER` TRUE. The sweep asks which blocks a
 * consumer reaches and gets OFFSETS out of the same reader the extractors take
 * their bodies from, so the two cannot drift apart into a document where a block
 * is extracted and swept as unreached, or the reverse. A regex standing beside
 * this call would be the drift, spelled once.
 *
 * ADJACENCY, AND NOTHING REDDENS IF YOU LOOSEN IT: a marker that may sit
 * anywhere above a block stops saying WHICH block it is about.
 */
export function markedBlocks(markdown: string, marker: string): readonly MarkedBlock[] {
  const blocks = fencedBlocks(markdown);
  const marked: MarkedBlock[] = [];
  for (const comment of markdown.matchAll(/<!--\s*([a-z-]+)\b([^>]*?)-->/g)) {
    if (comment[1] !== marker) {
      continue;
    }
    const after = comment.index + comment[0].length;
    const block = blocks.find((candidate) => candidate.offset >= after);
    const between = block === undefined ? "" : markdown.slice(after, block.offset);
    if (block !== undefined && between.trim() === "" && between.includes("\n")) {
      marked.push({ marker: comment[2] ?? "", block });
    }
  }
  return marked;
}

/** The quickstart's steps, in document order, read out of the README's own bytes. */
export function extractQuickstart(markdown: string, expected: number): QuickstartStep[] {
  const blocks = markedBlocks(markdown, "quickstart");
  if (blocks.length !== expected) {
    throw new Error(
      `README quickstart: expected ${String(expected)} marked blocks, found ${String(blocks.length)}`,
    );
  }

  const prose = visibleProse(markdown);
  const steps = blocks.map(({ marker, block }) => {
    const body = block.body;
    const attrs = attributes(marker);
    const dir = attrs.get("in");
    if (dir === undefined) {
      throw new Error(`README quickstart: a marked block does not say which directory: ${marker}`);
    }
    // REFUSED RATHER THAN DISAMBIGUATED: a `handler-pack` token is relative to
    // the CHECKOUT and a `quickstart` token names a directory beside the
    // reader's own project, so a name in both families is two reasonable
    // readings and nothing in a marker can say which was meant.
    const collidingMember = declaredMembers(repoRoot).find((member) => basename(member) === dir);
    if (collidingMember !== undefined) {
      throw new Error(
        `README quickstart: the marker \`in=${dir}\` denotes two directories -- the sibling of the reader's own project that this quickstart stages, and ${relative(repoRoot, collidingMember)}, a workspace member of the same name. A reader cannot tell which of them the step means, and the marker silently obeys the first.`,
      );
    }
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
 * and nothing else.
 *
 * NOT EXECUTED BY ANYTHING, stated here because the neighbouring extractors all
 * are and a reader would otherwise assume it; the `consumers` row below is what
 * says what reads it instead.
 */
export function extractExamplesInstall(markdown: string): string {
  const blocks = markedBlocks(markdown, "examples-install");
  if (blocks.length !== 1) {
    throw new Error(
      `README examples install: expected 1 marked block, found ${String(blocks.length)}`,
    );
  }
  const lines = (blocks[0]?.block.body ?? "")
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
 * above: the pack runs inside this repository, needs nothing a reader owns, and
 * COMPILES the package, so a wrong directory, a wrong command or a build that
 * cannot resolve reddens by running.
 */
export function extractHandlerPack(markdown: string): { dir: string; command: string } {
  const blocks = markedBlocks(markdown, "handler-pack");
  if (blocks.length !== 1) {
    throw new Error(`README handler pack: expected 1 marked block, found ${String(blocks.length)}`);
  }
  const dir = attributes(blocks[0]?.marker ?? "").get("in");
  if (dir === undefined) {
    throw new Error("README handler pack: the marked block does not say which directory");
  }
  if (!visibleProse(markdown).includes(dir)) {
    throw new Error(
      `README handler pack: the marker says in=${dir}, but no prose a reader sees names ${dir}`,
    );
  }
  const lines = (blocks[0]?.block.body ?? "")
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
 * THE ENVIRONMENT IS BARE: the reader's own project gets no tarball, no
 * node_modules, no config file and nothing dist/, because what is asked is
 * whether the documented steps are SUFFICIENT.
 *
 * The checkout's directory name is not chosen: it is this repository's own
 * directory name, which is what `git clone` creates. A README that renamed it
 * in the marker would be staged with no checkout, and the pack step would say so.
 *
 * WHAT IS STAGED IS A WORKSPACE AND NOT A PACKAGE, which the tarball's landing
 * place forces: `bun pm pack --filename` inside a member writes to the WORKSPACE
 * ROOT -- WITHOUT the flag it writes into the member, MEASURED, so the rule is
 * the documented command's and not the subcommand's -- so
 * the documented `bun install ../tsudoi-language-server/tsudoi.tgz` is only true
 * of a stage where the framework really is a member of a workspace rooted at the
 * checkout. Staging the framework's three files at the checkout root instead
 * would put the tarball in the same place BY ACCIDENT, stop testing the
 * arrangement the README describes, and redden nothing.
 */
function stageQuickstart(dirs: readonly string[]): { readonly root: string; dispose: () => void } {
  const checkoutName = basename(repoRoot);
  const distinct = [...new Set(dirs)];
  const insideCheckout = (dir: string): boolean =>
    dir === checkoutName || dir.startsWith(`${checkoutName}/`);
  if (!distinct.some(insideCheckout)) {
    throw new Error(
      `README quickstart: no step runs in ${checkoutName} or under it, so nothing stages the checkout the tarball is built from`,
    );
  }
  if (distinct.every(insideCheckout)) {
    throw new Error("README quickstart: every step runs in the checkout; nothing is the reader's");
  }

  const root = mkdtempSync(join(tmpdir(), "tsudoi-readme-"));
  try {
    for (const dir of distinct) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    const checkout = join(root, checkoutName);
    cpSync(join(repoRoot, "package.json"), join(checkout, "package.json"));
    const framework = join(checkout, "packages", basename(frameworkRoot));
    mkdirSync(framework, { recursive: true });
    cpSync(join(frameworkRoot, "package.json"), join(framework, "package.json"));
    cpSync(join(frameworkRoot, "tsconfig.build.json"), join(framework, "tsconfig.build.json"));
    cpSync(join(frameworkRoot, "src"), join(framework, "src"), { recursive: true });
    // THE ONE THING THE BARE STAGE IS GIVEN, and it goes to the CHECKOUT rather
    // than to the reader's project: `bun install` is a prerequisite the README
    // names, and the prepack build needs the protocol package's types to
    // compile.
    symlinkSync(join(repoRoot, "node_modules"), join(checkout, "node_modules"), "dir");
    return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
  } catch (cause) {
    rmSync(root, { recursive: true, force: true });
    throw cause;
  }
}

/**
 * Long enough that a slow machine is not a failure, short enough to fail rather
 * than hang.
 *
 * EXPORTED FOR ONE READER, AND IT IS NOT A CALLER: it is the floor the suite's
 * own deadline is pinned above, in test/suite-deadline.test.ts.
 */
export const handshakeTimeoutMs = 20_000;

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
        // Not aborted on failure, and nothing reddens if it is: a reader who
        // fumbled step 2 still has step 3 in front of them, and `the rest ran
        // anyway and still produced no server` is the stronger claim.
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
 * THROWS when there is no script path, and therefore no flags to speak of, and
 * nothing reddens if it stops: a command that parsed to an empty flag list makes
 * `the documented flags are the ones the suite spawns` true of nothing at all.
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

/** A fact the README owes a reader, as the TOKENS that discriminate it. */
export interface ReadmeFact {
  readonly name: string;
  /** All of these must appear within ONE section of the document. */
  readonly tokens: readonly RegExp[];
}

function sections(markdown: string): string[] {
  return markdown.split(/\n(?=#{1,6} )/);
}

export function statesFact(markdown: string, fact: ReadmeFact): boolean {
  return sectionsStating(markdown, fact).length > 0;
}

/** The release channel a reader must opt into while the package is pre-stable. */
export const ALPHA_RELEASE: ReadmeFact = {
  name: "the package is published under npm's alpha tag",
  tokens: [
    /bun add @atusy\/tsudoi-language-server@alpha(?![A-Za-z0-9._-])/,
    /deno add --save-exact npm:@atusy\/tsudoi-language-server@alpha(?![A-Za-z0-9._-])/,
    /deno run -A --frozen --node-modules-dir=none @atusy\/tsudoi-language-server\/cli/,
  ],
};

/**
 * The sections that state `fact` -- normally exactly one, and the test that it
 * IS one is the removal half of the token rule.
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
/**
 * THE PATH A READER'S INSTALL COMMAND NAMES, AS THE ONE EXPRESSION THAT READS
 * IT -- the `consumers` row and the pack arm join on what this returns.
 *
 * THE LAST TOKEN AND DELIBERATELY NOTHING CLEVERER: what the account claims is
 * that the PATH is checked, so THE VERB IS THE RESIDUE, and a parser that also
 * understood it would be claiming more than any assertion delivers.
 */
export function installedPath(command: string): string {
  return command.split(" ").at(-1) ?? "";
}

/** How a block reads in a refusal: enough of its own text for a reader to find it. */
function excerptOf(block: FencedBlock): string {
  const first = block.body.split("\n").find((line) => line.trim() !== "") ?? "";
  return first.trim().slice(0, 80);
}

/** The bytes of a block are RUN, and the thing that runs them is named. */
export interface ExecutedForm {
  readonly kind: "executed";
  /** What runs them -- prose, because no check decides whether an arm really does. */
  readonly by: string;
}

/**
 * The bytes of a block are READ, and the account says WHICH PART.
 *
 * THE SUBJECT IS NEVER INSPECTED AS PROSE. It is the projection the consuming
 * assertion is HANDED, and `holds` receives ONLY that and the counterpart, so
 * the assertion cannot fail on anything the account does not name -- by
 * construction rather than by inspection. What the account leaves out is
 * therefore unchecked BY DECLARATION, which is the honest half of admitting a
 * block that nothing runs.
 *
 */
export interface ReadForm {
  readonly kind: "read";
  /** Why the bytes are not run, and what stands in for running them. */
  readonly reason: string;
  /**
   * What the assertion needs BESIDES the document, which is what decides where
   * its arm can be run.
   *
   * IT IS DECLARED RATHER THAN INFERRED because it is a fact about the arm's
   * ENVIRONMENT: a recorded weakening is re-run in a staged checkout of every
   * tracked file -- no build outputs, and a temporary directory whose NAME is not
   * this repository's. An account needing either is legitimately red there, so
   * its arm cannot sit in a file a record names, and the split between the two
   * arm files is read out of this field and out of no list.
   */
  readonly needs:
    | "the document alone"
    | "this checkout's own directory name"
    | "the installed tree";
  /** The part of the block the consuming assertion is handed. */
  subject(block: FencedBlock): readonly string[];
  /** What the projection is compared against, out of everything BUT the block. */
  against(markdown: string, document: string): readonly string[];
  /** The consuming assertion. It sees the projection and the counterpart, never the block. */
  holds(subject: readonly string[], against: readonly string[]): boolean;
}

export type ConsumingForm = ExecutedForm | ReadForm;

/** One pairing: these documents, this marker, this form of consumption. */
export interface Consumer {
  readonly name: string;
  /** The documents it consumes, as paths RELATIVE to the root they are under. */
  documents(root: string): readonly string[];
  /** The marker a human writes above a block to route it here. */
  readonly marker: string;
  readonly form: ConsumingForm;
}

/** The complete guide -- the one executable document that is nobody's package. */
function theCheckoutsOwnReadme(): readonly string[] {
  return ["docs/README.md"];
}

/** The concise project landing page, whose examples use indented Markdown blocks. */
function theProjectOverview(): readonly string[] {
  return ["README.md"];
}

/**
 * Every handler package's README. Handler-only commands and facts use this
 * narrower set; the framework README is paired separately below.
 */
function everyHandlersReadme(root: string): readonly string[] {
  return handlerMembers(root).map((member) => join(relative(root, member), "README.md"));
}

/** The framework README, located from the staged workspace rather than this checkout. */
function frameworkReadme(root: string): string {
  const framework = declaredMembers(root).find((member) => {
    const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      name?: unknown;
    };
    return manifest.name === "@atusy/tsudoi-language-server";
  });
  if (framework === undefined) {
    throw new Error(`${root} has no member declaring @atusy/tsudoi-language-server`);
  }
  return join(relative(root, framework), "README.md");
}

/** The one command a block a reader RUNS carries, as the last non-empty line. */
function soleCommandIn(block: FencedBlock): string {
  const lines = block.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return lines.at(-1) ?? "";
}

/**
 * The full directory paths a drawn tree names, assembled from its own
 * indentation.
 */
function drawnPaths(drawn: readonly string[]): ReadonlySet<string> {
  const paths = new Set<string>();
  const open: { indent: number; path: string }[] = [];
  for (const line of drawn) {
    const at = /^([^\S\n]*)(\S+)\/$/.exec(line);
    if (at === null) {
      continue;
    }
    const indent = (at[1] ?? "").length;
    while (open.length > 0 && (open.at(-1)?.indent ?? 0) >= indent) {
      open.pop();
    }
    const parent = open.at(-1)?.path;
    const path = parent === undefined ? (at[2] ?? "") : `${parent}/${at[2] ?? ""}`;
    open.push({ indent, path });
    paths.add(path);
  }
  return paths;
}

/**
 * Whether a specifier resolves from a directory, ASKED OF THE RUNTIME rather
 * than of a manifest.
 *
 * WHAT IT THEREFORE ANSWERS ABOUT IS THE INSTALLED TREE AND NOT THE DOCUMENT: a
 * green here means a reader standing in that directory could load what the
 * snippet names, which is the whole of what this account claims.
 */
function resolvesFrom(specifier: string, dir: string): boolean {
  try {
    import.meta.resolve(specifier, pathToFileURL(join(dir, "readme-snippet.ts")).href);
    return true;
  } catch {
    return false;
  }
}

/**
 * THE PAIRING THE SWEEP CONSUMES, WHICH EXISTS FOR THE ARMS RATHER THAN BEING
 * PERFORMED BY THE SWEEP.
 *
 * A HUMAN WRITES THE MARKER AND MUST -- every extractor here is marker-keyed and
 * the marker is what routes a block to its consumer. A HUMAN NEVER WRITES THE
 * ACCOUNT: a marker cannot make a block accounted for, because the sweep does
 * not read markers to decide whether something consumes a block, it reads THIS
 * TABLE and then asks the marker only WHICH block.
 *
 * REFUSED, EACH WITH ITS REASON: an allow-list of documents, blocks, lines or
 * hashes, which is the approximate detector whose failure mode is a green
 * certifying a class as watched, and which as a hash list is a rubber stamp with
 * one extra step; an exemption written in the document whose only consumer is
 * the sweep; and a sixth Definition-of-Done check, since the sweep belongs where
 * the extraction already lives.
 *
 * THE INFO STRING DECIDES NOTHING, and an exempt tag list was settled on and
 * then OVERTURNED: `command block` names a class nothing in this tree can
 * compute -- the quickstart's `write=tsudoi.config.ts` step is a ```ts block and
 * IS reached -- and an exempt list makes the defect reintroducible by typing
 * three characters.
 *
 * THE RESIDUE, AND NO DETECTOR IS OWED FOR IT: nothing notices a row whose
 * consuming arm was deleted, so this table goes on claiming a consumer with no
 * assertion left behind it. The mutation arms are not the mitigation -- they
 * live in the consuming files and go in the same edit, in the same silence. A
 * check deciding whether an arm REALLY consumes is the approximate detector
 * refused above.
 */
export const consumers: readonly Consumer[] = [
  {
    // The landing page has one deliberately small code sample. Its import
    // surface is held against the downloadable starter; executable and
    // exhaustive instructions remain in docs/README.md.
    name: "the project overview",
    documents: theProjectOverview,
    marker: "overview",
    form: {
      kind: "read",
      reason: "the landing sample and downloadable starter use the same modules",
      needs: "the installed tree",
      subject: (block) =>
        [...block.body.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((at) => at[1] ?? ""),
      against: () => {
        const starter = readFileSync(join(repoRoot, "examples/github/tsudoi.config.ts"), "utf8");
        return [...starter.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((at) => at[1] ?? "");
      },
      holds: (subject, against) =>
        subject.length > 0 &&
        subject.length === against.length &&
        subject.every((specifier, index) => specifier === against[index]),
    },
  },
  {
    name: "the quickstart",
    documents: theCheckoutsOwnReadme,
    marker: "quickstart",
    form: {
      kind: "executed",
      by: "test/readme.test.ts runs the documented sequence in a bare stage, under both runtimes, and sweeps each step's omission",
    },
  },
  {
    // THE LAYOUT CONSUMER IS NOT A SECOND MECHANISM. This file twice requires a
    // directory to be stated twice and be the same string -- once for the
    // quickstart, once for the pack -- and this is that idiom a third time, over
    // the DRAWING instead of the sentence. It catches a README picturing one
    // layout while the markers stage another, which nothing today would see.
    //
    // ONE DIRECTION IS WHAT `holds` ASKS -- every directory a marker names is
    // drawn -- AND THE CONVERSE IS ENFORCED BY THE ARM AND NOT BY THIS ROW,
    // which requires every member of the projection to be load-bearing.
    name: "the layout",
    documents: theCheckoutsOwnReadme,
    marker: "layout",
    form: {
      kind: "read",
      reason:
        "a drawing is not a command; what stands in for running it is that every directory the quickstart's markers stage is a directory this tree draws",
      needs: "the document alone",
      subject: (block) => [...block.body.matchAll(/^[^\S\n]+\S+\/(?=\s|$)/gm)].map((at) => at[0]),
      against: (markdown) => [
        ...new Set(
          markedBlocks(markdown, "quickstart").flatMap(({ marker }) => {
            const dir = attributes(marker).get("in");
            return dir === undefined ? [] : [dir];
          }),
        ),
      ],
      holds: (subject, against) => {
        const drawn = drawnPaths(subject);
        return against.length > 0 && against.every((dir) => drawn.has(dir));
      },
    },
  },
  {
    // WHAT THIS ACCOUNT CANNOT SEE, NAMED SO IT IS NOT MISTAKEN FOR A COMPILE: a
    // block whose imports all resolve and whose BODY is wrong is accounted for
    // and unchecked. The subject is the specifiers, so the specifiers are what a
    // red here is about.
    //
    // AND A MARKED `ts` BLOCK CARRYING NO IMPORT AT ALL CANNOT BE ACCOUNTED FOR
    // BY THIS ROW, its projection being empty. That is where a later reader will
    // reach for an exemption; the move is to give the snippet the import it was
    // already implying.
    name: "the ts snippets",
    documents: (root) => [
      ...theProjectOverview(),
      ...theCheckoutsOwnReadme(),
      frameworkReadme(root),
      ...everyHandlersReadme(root),
    ],
    marker: "snippet",
    form: {
      kind: "read",
      reason:
        "a snippet is a fragment of a reader's file rather than a program, so what stands in for running it is that every module it tells a reader to import resolves from the directory the document sits in",
      needs: "the installed tree",
      subject: (block) => [
        ...new Set(
          [
            ...block.body.matchAll(/\bfrom\s+["']([^"']+)["']/g),
            ...block.body.matchAll(/\bimport\s+["']([^"']+)["']/g),
          ].map((at) => at[1] ?? ""),
        ),
      ],
      against: (_markdown, document) => [dirname(document)],
      holds: (subject, against) =>
        subject.length > 0 &&
        against.length === 1 &&
        subject.every((specifier) => resolvesFrom(specifier, against[0] ?? "")),
    },
  },
  {
    name: "the handler pack command",
    documents: everyHandlersReadme,
    marker: "handler-pack",
    form: {
      kind: "executed",
      by: "test/readme.test.ts runs it in the member's own directory and compares the file it wrote against the path the install line names",
    },
  },
  {
    name: "the handler install command",
    documents: everyHandlersReadme,
    marker: "examples-install",
    form: {
      kind: "read",
      reason:
        "the npm route is the supported install, while this source-checkout fallback is retained as a packaging probe; the path it names must be the one the pack beside it writes",
      needs: "this checkout's own directory name",
      subject: (block) => [installedPath(soleCommandIn(block))],
      against: (_markdown, document) => [
        `../${basename(repoRoot)}/`,
        `${basename(dirname(document))}.tgz`,
      ],
      holds: (subject, against) => {
        const [installed] = subject;
        const [prefix, tarball] = against;
        return (
          installed !== undefined &&
          prefix !== undefined &&
          tarball !== undefined &&
          installed.startsWith(prefix) &&
          installed.endsWith(tarball)
        );
      },
    },
  },
];

/** One block, or one document, this sweep refuses -- with its own account of why. */
export interface Offence {
  /** The document, relative to the root it was swept under. */
  readonly document: string;
  /** The line of the opening fence, or 0 when the refusal is about the document itself. */
  readonly line: number;
  readonly report: string;
}

/**
 * What one sweep read, WITH THE PAIR THAT KEEPS AN EMPTY OFFENDER LIST HONEST.
 *
 * An empty list and a reader that opened nothing are the same observation
 * without `documentsRead` and `blocksRead`, so the counts are returned rather
 * than logged: every arm asserting the absence asserts these above zero beside
 * it.
 */
export interface CoverageReading {
  readonly offenders: readonly Offence[];
  readonly documentsRead: number;
  readonly blocksRead: number;
}

/**
 * EVERY FENCED BLOCK IN EVERY TRACKED README, REFUSED UNLESS SOMETHING CONSUMES
 * IT.
 *
 * IT TAKES A ROOT AND READS NOTHING BY A HARDCODED PATH, which is not a
 * convenience: the arms plant into a THROWAWAY, and a sweep reaching for
 * `readReadme()` would have made them mutate a version-controlled file in order
 * to fire -- this record's own measured failure, in the file that already holds
 * the hardcoded path.
 *
 * THE SWEEP MAY NOT BE ITS OWN CALLER. It never runs an extractor over a
 * document to decide whether the document is consumed: a sweep that cleared
 * whatever its own matching found would certify a document nobody opens, which
 * is the author's-intention failure with the marker swapped for the sweep's own
 * run. What decides is the TABLE, and the marker only says which block.
 *
 * EVERY REFUSAL PRINTS DIFFERENTLY ON PURPOSE, because two states that produce
 * byte-identical text are one red and not two.
 */
export function readmeCoverage(root: string): CoverageReading {
  const paired = new Map<string, Consumer[]>();
  for (const consumer of consumers) {
    for (const document of consumer.documents(root)) {
      paired.set(document, [...(paired.get(document) ?? []), consumer]);
    }
  }

  const offenders: Offence[] = [];
  let documentsRead = 0;
  let blocksRead = 0;
  for (const document of trackedReadmes(root)) {
    documentsRead += 1;
    const pairs = paired.get(document) ?? [];
    if (pairs.length === 0) {
      offenders.push({
        document,
        line: 0,
        report: `${document} is a tracked README that no consumer is paired with, so nothing in this suite ever opens it`,
      });
      continue;
    }
    const markdown = readFileSync(join(root, document), "utf8");
    const blocks = fencedBlocks(markdown);
    blocksRead += blocks.length;
    const reached = new Map<number, Consumer>();
    for (const consumer of pairs) {
      for (const marked of markedBlocks(markdown, consumer.marker)) {
        reached.set(marked.block.offset, consumer);
      }
    }
    for (const block of blocks) {
      const consumer = reached.get(block.offset);
      if (consumer === undefined) {
        offenders.push({
          document,
          line: block.line,
          report: `${document}:${String(block.line)} opens a \`${block.info}\` block no consumer reaches -- ${excerptOf(block)}`,
        });
        continue;
      }
      if (consumer.form.kind !== "read") {
        continue;
      }
      const subject = consumer.form.subject(block);
      if (subject.length === 0) {
        offenders.push({
          document,
          line: block.line,
          report: `${document}:${String(block.line)} is accounted for by ${consumer.name}, whose projection answers nothing at all -- an account that names no part of the block cannot be about it`,
        });
        continue;
      }
      // AN EMPTY MEMBER AND A MISSING ONE ARE REPAIRED IN DIFFERENT PLACES, and
      // they differ in reach, which is why neither is dropped and why folding
      // them back together reddens nothing. THE EMPTY MEMBER IS REACHABLE FROM
      // THE TABLE AS IT STANDS: a marked install block with no command in it
      // gives `installedPath` `""`, so the projection has ONE member and this is
      // the refusal that fires. THE MISSING MEMBER IS NOT REACHABLE TODAY --
      // every shipped projection MATCHES over `block.body`, so none can answer a
      // string the block does not contain -- and it is kept rather than armed
      // with a row written to fire it, because a projection that computes a name
      // or reads one from a manifest is the obvious next kind, and a fixture row
      // invented to green it would be arming the sweep against a consumer this
      // repository does not have.
      for (const part of subject) {
        if (part === "") {
          offenders.push({
            document,
            line: block.line,
            report: `${document}:${String(block.line)} is accounted for by ${consumer.name}, whose projection answers an EMPTY member -- a member that names no bytes accounts for none, whatever the block says`,
          });
          continue;
        }
        if (!block.body.includes(part)) {
          offenders.push({
            document,
            line: block.line,
            report: `${document}:${String(block.line)} is accounted for by ${consumer.name}, whose projection answers \`${part}\` -- which the block's own bytes do not contain, so the account is a constant rather than a reading`,
          });
        }
      }
    }
  }
  return { offenders, documentsRead, blocksRead };
}

/** One block a `read` row accounts for, in one document, on one checkout. */
export interface ReadAccount {
  readonly consumer: Consumer;
  readonly form: ReadForm;
  /** The document's absolute path -- what `against` is handed. */
  readonly document: string;
  /** The same document relative to the root, which is what an arm's name says. */
  readonly at: string;
  readonly markdown: string;
  readonly block: FencedBlock;
}

/**
 * Every block the table accounts for by READING, over one checkout.
 *
 * THE ARMS ARE BUILT FROM THIS AND NOT FROM A LIST BESIDE IT: a row added to the
 * table arms itself, and a row whose marker names no block arms nothing and is
 * caught by the non-empty assertions its arm file carries.
 */
export function readAccounts(root: string): readonly ReadAccount[] {
  return consumers.flatMap((consumer) => {
    const form = consumer.form;
    if (form.kind !== "read") {
      return [];
    }
    return consumer.documents(root).flatMap((at) => {
      const document = join(root, at);
      const markdown = readFileSync(document, "utf8");
      return markedBlocks(markdown, consumer.marker).map(({ block }) => ({
        consumer,
        form,
        document,
        at,
        markdown,
        block,
      }));
    });
  });
}

/**
 * The same text with ONE LETTER changed -- the smallest corruption that is still
 * one.
 *
 * A LETTER AND NOT A DELETION, because a deletion can leave a string that is
 * still a prefix or still resolves, and this is used to require that an
 * assertion NOTICES. It throws rather than returning its input when there is no
 * letter to change, and nothing reddens if it stops: a corruption that corrupted
 * nothing makes the arm above it a reading of the untouched block.
 */
export function corruptOneLetter(text: string): string {
  const at = text.search(/[A-Za-z]/);
  const letter = text[at];
  if (at === -1 || letter === undefined) {
    throw new Error(`${text} carries no letter, so nothing here can corrupt it`);
  }
  return `${text.slice(0, at)}${letter === "z" ? "q" : "z"}${text.slice(at + 1)}`;
}

/**
 * The block's bytes with one letter changed OUTSIDE every occurrence of its
 * subject.
 *
 * THIS IS THE HALF THAT BOUNDS THE ACCOUNT FROM ABOVE. Corrupting inside the
 * subject shows the assertion is not a rubber stamp; corrupting outside it shows
 * the account is not secretly about the whole block -- which is what makes
 * `everything the subject leaves out is unchecked` a statement with a witness
 * rather than a disclaimer.
 *
 * IT THROWS WHEN THERE IS NOWHERE OUTSIDE TO CORRUPT, and nothing reddens if it
 * stops: an account whose projection covers every letter of its block has no
 * residue, and an arm claiming to have probed one would be claiming a reading it
 * never took.
 */
export function corruptOutsideSubject(body: string, subject: readonly string[]): string {
  const covered = new Set<number>();
  for (const part of subject) {
    for (let at = body.indexOf(part); at !== -1; at = body.indexOf(part, at + 1)) {
      for (let index = at; index < at + part.length; index += 1) {
        covered.add(index);
      }
    }
  }
  for (const [index, letter] of [...body].entries()) {
    if (!covered.has(index) && /[A-Za-z]/.test(letter)) {
      return `${body.slice(0, index)}${letter === "z" ? "q" : "z"}${body.slice(index + 1)}`;
    }
  }
  throw new Error(
    "this block carries no letter outside its own subject, so its account covers all of it and there is no outside to probe",
  );
}
