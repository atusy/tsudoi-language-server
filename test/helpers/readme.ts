import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
