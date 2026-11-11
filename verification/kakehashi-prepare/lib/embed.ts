// Ways to place one piece of code inside a host document, each knowing where
// every character of the code ended up -- so a result in host coordinates can
// be read back in the code's own, and compared across embeddings.

export interface Position {
  readonly line: number;
  readonly character: number;
}

export interface Range {
  readonly start: Position;
  readonly end: Position;
}

/** Offsets where the lines of `text` start (LF, CRLF and lone CR end a line). */
export function lineStarts(text: string): number[] {
  const starts = [0];
  for (const match of text.matchAll(/\r\n|\r|\n/g)) starts.push(match.index + match[0].length);
  return starts;
}

export function offsetAt(text: string, position: Position): number {
  const starts = lineStarts(text);
  const start = starts[position.line];
  if (start === undefined) return text.length;
  const next = starts[position.line + 1] ?? text.length;
  const content = text.slice(start, next).replace(/\r\n$|\r$|\n$/, "");
  return start + Math.min(position.character, content.length);
}

export function positionAt(text: string, offset: number): Position {
  const starts = lineStarts(text);
  let line = 0;
  while (line + 1 < starts.length && (starts[line + 1] ?? Infinity) <= offset) line++;
  return { line, character: offset - (starts[line] ?? 0) };
}

export interface TextEditLike {
  readonly range: Range;
  readonly newText: string;
}

/** Applies LSP text edits to `text` (all ranges refer to the original). */
export function applyEdits(text: string, edits: readonly TextEditLike[]): string {
  const ordered = edits
    .map((edit, index) => ({
      index,
      start: offsetAt(text, edit.range.start),
      end: offsetAt(text, edit.range.end),
      newText: edit.newText,
    }))
    .sort((a, b) => b.start - a.start || b.index - a.index);
  let result = text;
  for (const edit of ordered) {
    result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end);
  }
  return result;
}

/** A stretch of the host document and the stretch of code it stands for. */
interface Chunk {
  readonly hostStart: number;
  readonly hostEnd: number;
  readonly codeStart: number;
  readonly codeEnd: number;
  /** `same`: identical text. `gap`: host text the code shows as something else. `host`: host only. */
  readonly kind: "same" | "gap" | "host";
}

export interface Embedded {
  readonly name: string;
  readonly hostLanguage: string;
  /** File extension of the host document. */
  readonly extension: string;
  readonly hostText: string;
  /** The code as a downstream server should receive it, in the host's line endings. */
  readonly code: string;
  /** Host position of a code position, or `undefined` where the host has none. */
  toHost(position: Position): Position | undefined;
  /** Code position of a host position, or `undefined` outside the code. */
  toCode(position: Position): Position | undefined;
  /** The same embedding of other code. */
  rebuild(code: string): Embedded;
  /**
   * The code a changed host document holds, read back the way it was put in
   * and with LF line endings. Throws when the host around the code, or a
   * line's prefix, was damaged.
   */
  extract(hostText: string): string;
}

class Builder {
  host = "";
  code = "";
  readonly chunks: Chunk[] = [];

  #push(host: string, code: string, kind: Chunk["kind"]): this {
    this.chunks.push({
      hostStart: this.host.length,
      hostEnd: this.host.length + host.length,
      codeStart: this.code.length,
      codeEnd: this.code.length + code.length,
      kind,
    });
    this.host += host;
    this.code += code;
    return this;
  }

  /** Host-only text: a fence, a prefix, a delimiter. */
  hostOnly(text: string): this {
    return text === "" ? this : this.#push(text, "", "host");
  }

  /** Text the host and the code share. */
  shared(text: string): this {
    return text === "" ? this : this.#push(text, text, "same");
  }

  /** Host text the code shows as `code` (a filled gap). */
  gap(host: string, code: string): this {
    return this.#push(host, code, "gap");
  }
}

/** A piece of code the host writes as something else: an interpolation. */
export interface GapSpec {
  /** The code right before it on its line, which makes the place unique. */
  readonly after: string;
  /** What the code holds there (what the peer fills the gap with). */
  readonly code: string;
  /** What the host holds there. */
  readonly host: string;
}

interface Layout {
  readonly name: string;
  readonly hostLanguage: string;
  readonly extension: string;
  /** Host text before the code's first line, and after its last. */
  readonly head: string;
  readonly tail: string;
  /** What every code line is prefixed with in the host. */
  readonly prefix: string;
  /** Line ending of the host document. */
  readonly eol: "\n" | "\r\n";
  /** Blank lines the host adds before and after the code (dropped by the peer). */
  readonly blankEdges?: number;
  /** Code text the host writes as a gap. */
  readonly gaps?: readonly GapSpec[];
  /** Whether a blank code line carries the prefix (trailing whitespace trimmed). */
  readonly blankKeepsPrefix: boolean;
}

function build(layout: Layout, code: string): Embedded {
  const builder = new Builder();
  const eol = layout.eol;
  builder.hostOnly(layout.head.replaceAll("\n", eol));
  const blankPrefix = layout.blankKeepsPrefix ? layout.prefix.trimEnd() : "";
  for (let extra = 0; extra < (layout.blankEdges ?? 0); extra++) {
    builder.hostOnly(`${blankPrefix}${eol}`);
  }
  const codeLines = code.endsWith("\n") ? code.slice(0, -1).split("\n") : code.split("\n");
  for (const [index, line] of codeLines.entries()) {
    builder.hostOnly(line === "" ? blankPrefix : layout.prefix);
    // Split the line around the code texts the host writes as gaps.
    let rest = line;
    for (;;) {
      const next = (layout.gaps ?? [])
        .map((gap) => ({ gap, at: rest.indexOf(gap.after + gap.code) }))
        .filter((found) => found.at >= 0)
        .sort((a, b) => a.at - b.at)[0];
      if (next === undefined) break;
      builder.shared(rest.slice(0, next.at + next.gap.after.length));
      builder.gap(next.gap.host.replaceAll("\n", eol), next.gap.code);
      rest = rest.slice(next.at + next.gap.after.length + next.gap.code.length);
    }
    builder.shared(rest);
    const last = index === codeLines.length - 1;
    // The code takes the host's line ending: it is what servers are sent.
    if (!last || code.endsWith("\n")) builder.shared(eol);
  }
  for (let extra = 0; extra < (layout.blankEdges ?? 0); extra++) {
    builder.hostOnly(`${blankPrefix}${eol}`);
  }
  builder.hostOnly(layout.tail.replaceAll("\n", eol));
  const { host, chunks } = builder;
  const headLength = layout.head.replaceAll("\n", eol).length;
  const tailLength = layout.tail.replaceAll("\n", eol).length;

  const toHost = (position: Position): Position | undefined => {
    const offset = offsetAt(builder.code, position);
    // Where one chunk ends and the next starts, the place is the next one's:
    // the start of a code line is after its host prefix, not before it.
    let ending: Position | undefined;
    for (const chunk of chunks) {
      if (chunk.kind === "host") continue;
      if (offset < chunk.codeStart || offset > chunk.codeEnd) continue;
      if (offset === chunk.codeEnd && chunk.codeEnd > chunk.codeStart) {
        ending = positionAt(host, chunk.hostEnd);
        continue;
      }
      if (chunk.kind === "same") {
        return positionAt(host, chunk.hostStart + (offset - chunk.codeStart));
      }
      // A filled gap: only its edges exist in the host.
      return offset === chunk.codeStart ? positionAt(host, chunk.hostStart) : undefined;
    }
    return ending;
  };
  const toCode = (position: Position): Position | undefined => {
    const offset = offsetAt(host, position);
    for (const chunk of chunks) {
      if (chunk.kind === "host") continue;
      if (offset < chunk.hostStart || offset > chunk.hostEnd) continue;
      if (chunk.kind === "same") {
        return positionAt(builder.code, chunk.codeStart + (offset - chunk.hostStart));
      }
      if (offset === chunk.hostStart) return positionAt(builder.code, chunk.codeStart);
      if (offset === chunk.hostEnd) return positionAt(builder.code, chunk.codeEnd);
      return undefined;
    }
    return undefined;
  };
  const extract = (changed: string): string => {
    const head = host.slice(0, headLength);
    const tail = host.slice(host.length - tailLength);
    if (!changed.startsWith(head)) throw new Error("the host text before the region changed");
    if (!changed.endsWith(tail)) throw new Error("the host text after the region changed");
    let body = changed.slice(head.length, changed.length - tail.length);
    for (const gap of layout.gaps ?? []) {
      body = body.replaceAll(gap.host.replaceAll("\n", eol), gap.code);
    }
    if (body === "") return "";
    const endsWithBreak = body.endsWith(eol);
    const lines = (endsWithBreak ? body.slice(0, -eol.length) : body).split(eol);
    const edge = layout.blankEdges ?? 0;
    const blankLine = (line: string): boolean => line.trim() === "" || line === blankPrefix;
    for (let trimmed = 0; trimmed < edge; trimmed++) {
      if (lines[0] !== undefined && blankLine(lines[0])) lines.shift();
      const end = lines.at(-1);
      if (end !== undefined && blankLine(end)) lines.pop();
    }
    const stripped = lines.map((line, index) => {
      if (line.includes("\r") || line.includes("\n")) {
        throw new Error(`region line ${String(index)} has a foreign line ending`);
      }
      if (line.startsWith(layout.prefix)) return line.slice(layout.prefix.length);
      if (line.trimEnd() === layout.prefix.trimEnd() || line === "") {
        if (line === "" && layout.blankKeepsPrefix && layout.prefix.trimEnd() !== "") {
          throw new Error(`region line ${String(index)} lost its prefix: ${JSON.stringify(line)}`);
        }
        return "";
      }
      throw new Error(`region line ${String(index)} lost its prefix: ${JSON.stringify(line)}`);
    });
    return stripped.join("\n") + (endsWithBreak ? "\n" : "");
  };

  return {
    name: layout.name,
    hostLanguage: layout.hostLanguage,
    extension: layout.extension,
    hostText: host,
    code: builder.code,
    toHost,
    toCode,
    extract,
    // `builder.code` holds the host's line endings; the layout takes LF.
    rebuild: (other) => build(layout, other.replaceAll("\r\n", "\n")),
  };
}

export interface EmbeddingOptions {
  /** The injection language, as a Markdown info string or a Nix comment names it. */
  readonly language: string;
  /** Code the gap embeddings write as Nix interpolations. */
  readonly gaps?: readonly GapSpec[];
}

export type Embedding = (code: string, options: EmbeddingOptions) => Embedded;

function markdown(
  name: string,
  shape: {
    before: string;
    prefix: string;
    after?: string;
    eol?: "\n" | "\r\n";
    blankEdges?: number;
    blankKeepsPrefix?: boolean;
  },
): Embedding {
  return (code, { language }) =>
    build(
      {
        name,
        hostLanguage: "markdown",
        extension: "md",
        head: `# Title\n\n${shape.before}${shape.prefix}\`\`\`${language}\n`,
        tail: `${shape.prefix}\`\`\`\n${shape.after ?? ""}\nafter\n`,
        prefix: shape.prefix,
        eol: shape.eol ?? "\n",
        blankEdges: shape.blankEdges,
        blankKeepsPrefix: shape.blankKeepsPrefix ?? false,
      },
      code,
    );
}

function nix(
  name: string,
  shape: { eol?: "\n" | "\r\n"; blankEdges?: number; nonAscii?: boolean; gaps?: boolean },
): Embedding {
  return (code, { language, gaps }) =>
    build(
      {
        name,
        hostLanguage: "nix",
        extension: "nix",
        // The injection is combined: content opens with the line break after `''`.
        // The attribute is not one the Nix queries inject by name (`script`,
        // `buildPhase`, ...): the comment alone must decide the language.
        head: `{ cfg }:\n{\n  ${shape.nonAscii === true ? '"スクリプト"' : "value"} = /* ${language} */ ''\n`,
        tail: "  '';\n}\n",
        prefix: "    ",
        eol: shape.eol ?? "\n",
        blankEdges: shape.blankEdges,
        gaps: shape.gaps === true ? gaps : undefined,
        blankKeepsPrefix: false,
      },
      code,
    );
}

/** The embedding every other one is compared against: nothing for a peer to do. */
export const plainFence: Embedding = markdown("md-fence", { before: "", prefix: "" });

export const markdownEmbeddings: readonly Embedding[] = [
  markdown("md-list-2", { before: "- item\n\n", prefix: "  " }),
  markdown("md-list-4", { before: "1.  item\n\n", prefix: "    " }),
  markdown("md-nested-list", { before: "- outer\n  - inner\n\n", prefix: "    " }),
  markdown("md-list-tab", { before: "-\titem\n\n", prefix: "\t" }),
  // A fence indented without a list: kakehashi keeps the indentation in the
  // virtual document, so the dedent is the peer's.
  markdown("md-indented-fence", { before: "", prefix: "  " }),
  markdown("md-blockquote", { before: "", prefix: "> ", blankKeepsPrefix: true }),
  markdown("md-quoted-list", { before: "> - item\n>\n", prefix: ">   ", blankKeepsPrefix: true }),
  markdown("md-blank-edges", { before: "", prefix: "", blankEdges: 2 }),
  markdown("md-fence-crlf", { before: "", prefix: "", eol: "\r\n" }),
  markdown("md-list-2-crlf", { before: "- item\n\n", prefix: "  ", eol: "\r\n" }),
];

/** A fence whose content is indented further than its opener: only the peer dedents it. */
export const overIndentedFence: Embedding = (code, { language }) =>
  build(
    {
      name: "md-over-indented",
      hostLanguage: "markdown",
      extension: "md",
      head: `# Title\n\n\`\`\`${language}\n`,
      tail: "```\n\nafter\n",
      prefix: "      ",
      eol: "\n",
      blankKeepsPrefix: false,
    },
    code,
  );

export const nixEmbeddings: readonly Embedding[] = [
  nix("nix-string", {}),
  nix("nix-string-blank-edges", { blankEdges: 1 }),
  nix("nix-string-crlf", { eol: "\r\n" }),
  nix("nix-string-non-ascii-key", { nonAscii: true }),
];

export const nixGapEmbedding: Embedding = nix("nix-string-gap", { gaps: true });

/** The same interpolation written over several lines: the gap holds line breaks. */
export const nixMultilineGapEmbedding: Embedding = (code, options) =>
  nix("nix-string-multiline-gap", { gaps: true })(code, {
    ...options,
    gaps: (options.gaps ?? []).map((gap) => ({
      ...gap,
      host: gap.host.replace("${", "${\n      ").replace(/}$/, "\n    }"),
    })),
  });
