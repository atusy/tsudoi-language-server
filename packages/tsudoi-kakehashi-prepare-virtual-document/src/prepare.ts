/**
 * The rule behind `kakehashi/virtualDocument/prepare`: how one virtual document
 * should be presented to the language servers kakehashi bridges it to.
 *
 * kakehashi sends the document as ordered segments -- `content` (injected text)
 * and `gap` (host text between the pieces of a combined injection, such as a
 * Nix interpolation) -- and keeps every coordinate itself. The answer may only
 * do what kakehashi can map back:
 *
 * - delete leading spaces and tabs of a content line (the dedent);
 * - delete whole blank lines at the document's edges, with the indentation of
 *   an indentation-only last line as a change of its own;
 * - replace a gap with any text.
 *
 * Everything else is refused by kakehashi, and a refused answer leaves the
 * document unsent. So this module never emits a change it is not sure of: where
 * a rule cannot be applied within the contract, the text is left as it is.
 *
 * It is a pure function of the request and the options. Nothing is remembered
 * between requests, because the right answer for a document changes with every
 * edit to it.
 */
import type { TextEdit } from "@atusy/tsudoi-language-server/deps/types";

export interface VirtualDocumentSegment {
  readonly type: "content" | "gap";
  /** The injected text of a content segment; the original host text of a gap. */
  readonly content: string;
}

export interface VirtualDocumentPrepareParams {
  readonly textDocument: {
    readonly uri: string;
    readonly languageId: string;
    readonly version: number;
  };
  readonly hostTextDocument: { readonly uri: string; readonly languageId: string };
  readonly segments: readonly VirtualDocumentSegment[];
}

export type PreparedSegment =
  | { type: "content"; changes?: TextEdit[] }
  | { type: "gap"; content?: string };

/** `null` keeps every segment as kakehashi built it. */
export type VirtualDocumentPrepareResult = { segments: PreparedSegment[] } | null;

/** A gap as a fill function sees it. */
export interface Gap {
  /** The host text the gap stands for, on as many lines as it has. */
  readonly content: string;
  /** The language of the virtual document the gap is in. */
  readonly languageId: string;
  /** The language of the document the injection was found in. */
  readonly hostLanguageId: string;
}

/**
 * What a gap becomes: the same text for every gap, or a function of the gap.
 * `undefined` keeps the gap as kakehashi presents it -- whitespace as wide as
 * the host text, its line breaks kept.
 */
export type GapFill = string | ((gap: Gap) => string | undefined);

export interface PrepareRule {
  /** Remove the indentation every line of text shares. Default `true`. */
  readonly dedent?: boolean;
  /** Drop the blank lines opening and ending the document. Default `true`. */
  readonly trimEdges?: boolean;
  /** What fills a gap. Default: nothing, every gap is kept. */
  readonly gap?: GapFill;
}

export interface PrepareOptions extends PrepareRule {
  /**
   * Rules by the virtual document's `languageId`, each overriding the shared
   * rule field by field.
   */
  readonly languages?: Readonly<Record<string, PrepareRule>>;
}

interface Position {
  readonly line: number;
  readonly character: number;
}

/** One line of a content segment, in offsets into that segment. */
interface Line {
  /** Where the line starts. */
  readonly start: number;
  /** Where its text ends, before its line break. */
  readonly end: number;
  /** Where its leading spaces and tabs end. */
  readonly indentEnd: number;
  /** Whether a line break ends it inside this segment. */
  readonly terminated: boolean;
}

const lineBreak = /\r\n|\r|\n/g;

function linesOf(text: string): Line[] {
  const lines: Line[] = [];
  const push = (start: number, end: number, terminated: boolean): void => {
    let indentEnd = start;
    while (indentEnd < end && (text[indentEnd] === " " || text[indentEnd] === "\t")) indentEnd++;
    lines.push({ start, end, indentEnd, terminated });
  };
  let start = 0;
  for (const match of text.matchAll(lineBreak)) {
    push(start, match.index, true);
    start = match.index + match[0].length;
  }
  push(start, text.length, false);
  return lines;
}

const endsWithLineBreak = (text: string): boolean => text.endsWith("\n") || text.endsWith("\r");
const holdsLineBreak = (text: string): boolean => text.includes("\n") || text.includes("\r");
const isBlank = (text: string): boolean => /^[ \t\r\n]*$/.test(text);

/**
 * A gap as downstream servers see it when no rule fills it: whitespace as
 * wide as the host text up to its first line break, then only its line
 * breaks. What follows the last one opens the line the next content is on,
 * and kakehashi strips the host text that opens a line of content.
 */
function kept(hostText: string): string {
  const firstBreak = hostText.search(/[\r\n]/);
  if (firstBreak < 0) return hostText.replace(/[^]/g, " ");
  return (
    hostText.slice(0, firstBreak).replace(/[^]/g, " ") +
    hostText.slice(firstBreak).replace(/[^\r\n]/g, "")
  );
}

function commonPrefix(a: string, b: string): string {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length++;
  return a.slice(0, length);
}

interface ResolvedRule {
  readonly dedent: boolean;
  readonly trimEdges: boolean;
  readonly gap: GapFill | undefined;
}

function ruleFor(languageId: string, options: PrepareOptions): ResolvedRule {
  const own = Object.hasOwn(options.languages ?? {}, languageId)
    ? options.languages?.[languageId]
    : undefined;
  return {
    dedent: own?.dedent ?? options.dedent ?? true,
    trimEdges: own?.trimEdges ?? options.trimEdges ?? true,
    gap: own && Object.hasOwn(own, "gap") ? own.gap : options.gap,
  };
}

/**
 * The gaps' fills, `undefined` for one that is kept.
 *
 * A fill is dropped when it would put a lone CR right before an LF: the two
 * would read as one line break downstream while kakehashi counts two, and it
 * refuses such an answer whole. Keeping the gap is always within the contract.
 */
function fillsFor(
  params: VirtualDocumentPrepareParams,
  fill: GapFill | undefined,
): (string | undefined)[] {
  const { segments } = params;
  const fills = segments.map((segment) => {
    if (segment.type !== "gap" || fill === undefined) return undefined;
    if (typeof fill === "string") return fill;
    const filled = fill({
      content: segment.content,
      languageId: params.textDocument.languageId,
      hostLanguageId: params.hostTextDocument.languageId,
    });
    return typeof filled === "string" ? filled : undefined;
  });
  const shown = (index: number): string => {
    const segment = segments[index];
    if (segment === undefined) return "";
    return segment.type === "gap" ? (fills[index] ?? kept(segment.content)) : segment.content;
  };
  for (const [index, filled] of fills.entries()) {
    if (filled === undefined) continue;
    let before = "";
    for (let at = index - 1; at >= 0 && before === ""; at--) before = shown(at);
    let after = "";
    for (let at = index + 1; at < segments.length && after === ""; at++) after = shown(at);
    const joins =
      filled === ""
        ? before.endsWith("\r") && after.startsWith("\n")
        : (before.endsWith("\r") && filled.startsWith("\n")) ||
          (filled.endsWith("\r") && after.startsWith("\n"));
    if (joins) fills[index] = undefined;
  }
  return fills;
}

/**
 * One request as downstream servers will read it -- content as it is, each
 * gap as its fill or as the whitespace kakehashi keeps for it -- because that
 * is where a line is blank or not, and where an indentation is shared.
 */
class Presentation {
  readonly segments: readonly VirtualDocumentSegment[];
  readonly fills: readonly (string | undefined)[];
  /** The whole text as shown, and where each segment starts in it. */
  readonly text: string;
  readonly #offsets: readonly number[];
  /** The lines of each content segment; none for a gap. */
  readonly lines: readonly (readonly Line[])[];
  /** The changes collected for each segment. */
  readonly changes: TextEdit[][];
  /** Lines a whole-line deletion or the closing indentation already took. */
  readonly #taken: readonly Set<number>[];

  constructor(segments: readonly VirtualDocumentSegment[], fills: readonly (string | undefined)[]) {
    this.segments = segments;
    this.fills = fills;
    const shown = segments.map((segment, index) =>
      segment.type === "gap" ? (fills[index] ?? kept(segment.content)) : segment.content,
    );
    this.text = shown.join("");
    const offsets: number[] = [];
    let length = 0;
    for (const piece of shown) {
      offsets.push(length);
      length += piece.length;
    }
    this.#offsets = offsets;
    this.lines = segments.map((segment) =>
      segment.type === "content" ? linesOf(segment.content) : [],
    );
    this.changes = segments.map(() => []);
    this.#taken = segments.map(() => new Set<number>());
  }

  /** Where a line of a segment starts in the text as shown. */
  offsetOf(index: number, line: Line): number {
    return (this.#offsets[index] ?? 0) + line.start;
  }

  /**
   * Whether a content segment's first line starts a line of the virtual
   * document, which is where kakehashi checks that a deletion is of LEADING
   * whitespace or of WHOLE lines, and whether blank lines reach back to a gap.
   * The request carries a gap's host text, not its virtual text, so this is
   * read off how kakehashi builds one: a gap holding a line break ends a line
   * there whatever follows its last line break (see `kept`), and a gap on one
   * line never does.
   */
  startsVirtualLine(index: number): boolean {
    const previous = this.segments[index - 1];
    return index === 0 || (previous !== undefined && holdsLineBreak(previous.content));
  }

  /**
   * ...and whether it also starts one in the text as shown, where its leading
   * whitespace is indentation at all: a fill may end on the line a gap ended.
   */
  startsLine(index: number): boolean {
    const offset = this.#offsets[index] ?? 0;
    return (
      this.startsVirtualLine(index) &&
      (offset === 0 || endsWithLineBreak(this.text.slice(0, offset)))
    );
  }

  /**
   * Whether a line holds nothing but whitespace as shown, up to its line
   * break: a segment's last line runs on into what follows it.
   */
  isBlankLine(index: number, line: Line): boolean {
    if (line.terminated) return line.indentEnd === line.end;
    const rest = this.text.slice((this.#offsets[index] ?? 0) + line.indentEnd);
    const end = rest.search(/[\r\n]/);
    return isBlank(end < 0 ? rest : rest.slice(0, end));
  }

  delete(index: number, start: Position, end: Position): void {
    this.changes[index]?.push({ range: { start, end }, newText: "" });
  }

  /** Marks whole lines as deleted, so the dedent leaves them alone. */
  take(index: number, from: number, to: number): void {
    for (let line = from; line < to; line++) this.#taken[index]?.add(line);
  }

  isTaken(index: number, line: number): boolean {
    return this.#taken[index]?.has(line) === true;
  }
}

const isWhitespaceOnly = (line: Line | undefined): boolean =>
  line !== undefined && line.indentEnd === line.end;

/**
 * Deletes the blank lines opening the document: whole lines of its first
 * segment, when that segment is content.
 */
function trimLeadingLines(shown: Presentation): number {
  if (shown.segments[0]?.type !== "content") return 0;
  const lines = shown.lines[0] ?? [];
  let count = 0;
  while (lines[count]?.terminated === true && isWhitespaceOnly(lines[count])) count++;
  const rest = lines[count];
  // Blank lines up to a gap that starts a line are beside that gap, not at
  // the document's edge.
  const besideGap = shown.segments.length > 1 && rest !== undefined && rest.start === rest.end;
  if (count === 0 || besideGap) return 0;
  shown.delete(0, { line: 0, character: 0 }, { line: count, character: 0 });
  shown.take(0, 0, count);
  return count;
}

/**
 * Deletes the blank lines ending the document, and the indentation of an
 * indentation-only last line as a change of its own: whole lines of its last
 * segment, when that segment is content.
 */
function trimTrailingLines(shown: Presentation, leading: number): void {
  const last = shown.segments.length - 1;
  if (shown.segments[last]?.type !== "content") return;
  const lines = shown.lines[last] ?? [];
  const closing = lines.length - 1;
  const closingLine = lines[closing];
  if (closingLine === undefined || !isWhitespaceOnly(closingLine)) return;
  const ownsFirstLine = shown.startsVirtualLine(last);
  // The lines the opening already took, or the rest of a line a gap is on.
  const floor = last === 0 ? leading : ownsFirstLine ? 0 : 1;
  let from = closing;
  while (from - 1 >= floor && isWhitespaceOnly(lines[from - 1])) from--;
  // Reaching back to a gap that ends a line, they are beside that gap.
  const besideGap = last !== 0 && ownsFirstLine && from === 0;
  if (from < closing && !besideGap) {
    shown.delete(last, { line: from, character: 0 }, { line: closing, character: 0 });
    shown.take(last, from, closing);
  }
  if (closingLine.end > closingLine.start && (closing > 0 || ownsFirstLine)) {
    shown.delete(
      last,
      { line: closing, character: 0 },
      { line: closing, character: closingLine.end - closingLine.start },
    );
    shown.take(last, closing, closing + 1);
  }
}

/**
 * Content apart from each other by host lines -- a gap that is kept and holds
 * a line break, such as the code between two host strings -- is dedented
 * apart, as each host string is. A filled gap joins what is around it.
 */
function blocksOf(shown: Presentation): number[][] {
  const blocks: number[][] = [[]];
  for (const [index, segment] of shown.segments.entries()) {
    if (segment.type === "content") blocks.at(-1)?.push(index);
    else if (shown.fills[index] === undefined && holdsLineBreak(segment.content)) blocks.push([]);
  }
  return blocks;
}

/** Removes from each block the indentation every line of text in it shares. */
function dedent(shown: Presentation): void {
  for (const block of blocksOf(shown)) {
    const candidates = block.flatMap((index) => {
      const source = shown.segments[index]?.content ?? "";
      return (shown.lines[index] ?? []).flatMap((at, line) =>
        shown.isTaken(index, line) || (line === 0 && !shown.startsLine(index))
          ? []
          : [{ index, line, at, indent: source.slice(at.start, at.indentEnd) }],
      );
    });
    let shared: string | undefined;
    for (const candidate of candidates) {
      if (shown.isBlankLine(candidate.index, candidate.at)) continue;
      shared = shared === undefined ? candidate.indent : commonPrefix(shared, candidate.indent);
    }
    if (shared === undefined || shared === "") continue;
    for (const candidate of candidates) {
      // A whitespace-only line loses what it shares of the indentation.
      const removed = commonPrefix(shared, candidate.indent);
      if (removed === "") continue;
      // Emptying a line between a lone CR and an LF would join them.
      const start = shown.offsetOf(candidate.index, candidate.at);
      if (shown.text[start - 1] === "\r" && shown.text[start + removed.length] === "\n") continue;
      shown.delete(
        candidate.index,
        { line: candidate.line, character: 0 },
        { line: candidate.line, character: removed.length },
      );
    }
  }
}

/** Answers one prepare request under `options`. */
export function prepareSegments(
  params: VirtualDocumentPrepareParams,
  options: PrepareOptions = {},
): VirtualDocumentPrepareResult {
  const { segments } = params;
  const rule = ruleFor(params.textDocument.languageId, options);
  const shown = new Presentation(segments, fillsFor(params, rule.gap));

  // A document of whitespace alone keeps its lines: they are where the user is
  // about to type, and a deleted line has no position downstream.
  const hasText = segments.some(
    (segment) => segment.type === "content" && !isBlank(segment.content),
  );
  if (rule.trimEdges && hasText) trimTrailingLines(shown, trimLeadingLines(shown));
  if (rule.dedent && hasText) dedent(shown);

  const changed =
    shown.changes.some((own) => own.length > 0) || shown.fills.some((fill) => fill !== undefined);
  if (!changed) return null;
  return {
    segments: segments.map((segment, index): PreparedSegment => {
      if (segment.type === "gap") {
        const filled = shown.fills[index];
        return filled === undefined ? { type: "gap" } : { type: "gap", content: filled };
      }
      const own = (shown.changes[index] ?? []).toSorted(
        (a, b) =>
          a.range.start.line - b.range.start.line ||
          a.range.start.character - b.range.start.character,
      );
      return own.length === 0 ? { type: "content" } : { type: "content", changes: own };
    }),
  };
}
