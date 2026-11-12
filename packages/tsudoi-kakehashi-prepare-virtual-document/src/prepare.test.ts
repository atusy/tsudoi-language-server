import { describe, expect, test } from "bun:test";
import {
  continuesALine,
  type PrepareOptions,
  prepareSegments,
  standsFor,
  type VirtualDocumentPrepareParams,
  type VirtualDocumentPrepareResult,
} from "./prepare.ts";

type Piece = string | { gap: string };

/** A request for `pieces`: a string is content, `{ gap }` is host text. */
function request(
  pieces: readonly Piece[],
  languageId = "python",
  hostLanguageId = "nix",
): VirtualDocumentPrepareParams {
  return {
    textDocument: { uri: "file:///w/virtual.py", languageId, version: 1 },
    hostTextDocument: { uri: "file:///w/host.nix", languageId: hostLanguageId },
    segments: pieces.map((piece) =>
      typeof piece === "string"
        ? { type: "content", content: piece }
        : { type: "gap", content: piece.gap },
    ),
  };
}

function remove(line: number, from: number, toLine: number, to: number) {
  return {
    range: { start: { line, character: from }, end: { line: toLine, character: to } },
    newText: "",
  };
}

/** Deletes `width` columns of indentation at the start of each of `lines`. */
function dedent(width: number, ...lines: number[]) {
  return lines.map((line) => remove(line, 0, line, width));
}

function prepare(pieces: readonly Piece[], options?: PrepareOptions): VirtualDocumentPrepareResult {
  return prepareSegments(request(pieces), options);
}

/**
 * A gap no rule fills, as the protocol spells it in the virtual document,
 * written out here apart from the package's own `standsFor`: spaces as wide
 * as the host text up to its first line break when content precedes the gap
 * on its line, nothing for that text otherwise, then nothing but its line
 * breaks.
 */
function kept(pieces: readonly Piece[], index: number): string {
  const piece = pieces[index];
  if (piece === undefined || typeof piece === "string") return "";
  const before = pieces[index - 1];
  const continues = typeof before === "string" && !/[\r\n]$/.test(before);
  const [opening = "", ...lines] = piece.gap.split(/(\r\n|\r|\n)/);
  const breaks = lines.filter((_, at) => at % 2 === 0).join("");
  return (continues ? " ".repeat(opening.length) : "") + breaks;
}

/**
 * The text a downstream server would receive: the answer applied the way the
 * protocol describes it. Reading the outcome as text keeps each test about
 * what a server sees; the wire shape is pinned separately.
 */
function prepared(pieces: readonly Piece[], options?: PrepareOptions): string {
  const answer = prepare(pieces, options);
  return pieces
    .map((piece, index) => {
      const segment = answer?.segments[index];
      if (typeof piece !== "string") {
        const filled = segment?.type === "gap" ? segment.content : undefined;
        return filled ?? kept(pieces, index);
      }
      const changes = segment?.type === "content" ? (segment.changes ?? []) : [];
      const starts = [0];
      for (const match of piece.matchAll(/\r\n|\r|\n/g)) starts.push(match.index + match[0].length);
      const offset = (position: { line: number; character: number }): number =>
        (starts[position.line] ?? Number.NaN) + position.character;
      let text = piece;
      for (const change of [...changes].sort(
        (a, b) => offset(b.range.start) - offset(a.range.start),
      )) {
        text = text.slice(0, offset(change.range.start)) + text.slice(offset(change.range.end));
      }
      return text;
    })
    .join("");
}

describe("dedent", () => {
  test("removes the indentation every line of text shares", () => {
    expect(prepare(["    a\n      b\n    c\n"], { trimEdges: false })).toEqual({
      segments: [{ type: "content", changes: dedent(4, 0, 1, 2) }],
    });
  });

  test("answers null when there is nothing to change", () => {
    expect(prepare(["a\n  b\n"])).toBeNull();
  });

  test("whitespace-only lines lose what they share of it, and never decide it", () => {
    expect(prepared(["    a\n  \n        \n    b\n"], { trimEdges: false })).toBe("a\n\n    \nb\n");
  });

  test("the indentation is a common prefix, so tabs and spaces are never traded", () => {
    expect(prepared(["\t  a\n\t\tb\n"], { trimEdges: false })).toBe("  a\n\tb\n");
    expect(prepare(["\ta\n    b\n"], { trimEdges: false })).toBeNull();
  });

  test("only spaces and tabs are indentation", () => {
    expect(prepare(["\u00a0 a\n\u00a0 b\n"], { trimEdges: false })).toBeNull();
  });

  test("CRLF and lone CR end lines as LF does", () => {
    expect(prepare(["  a\r\n  b\r  c"], { trimEdges: false })).toEqual({
      segments: [{ type: "content", changes: dedent(2, 0, 1, 2) }],
    });
  });

  test("a whitespace-only line between a lone CR and an LF keeps its whitespace", () => {
    // Emptying it would make the CR and the LF one line break: the prepared
    // text would have a line fewer than the virtual one, which kakehashi refuses.
    expect(prepared(["  a\r  \n  b"], { trimEdges: false })).toBe("a\r  \nb");
  });

  test("columns before text outside ASCII are untouched", () => {
    expect(prepare(["  é = '𝒳'\n  ü\n"], { trimEdges: false })).toEqual({
      segments: [{ type: "content", changes: dedent(2, 0, 1) }],
    });
  });

  test("the rest of a line after a gap is not indentation", () => {
    expect(
      prepare(["  a = ", { gap: "${x}" }, "  + 1\n  b\n"], { trimEdges: false, gap: "0" }),
    ).toEqual({
      segments: [
        { type: "content", changes: dedent(2, 0) },
        { type: "gap", content: "0" },
        { type: "content", changes: dedent(2, 1) },
      ],
    });
  });

  test("a line opening with a gap counts with the indentation before the gap", () => {
    expect(
      prepared(["      deep\n    ", { gap: "${pkgs.hello}" }, "/bin/hello\n"], {
        trimEdges: false,
      }),
    ).toBe(`  deep\n${" ".repeat("${pkgs.hello}".length)}/bin/hello\n`);
  });

  test("the indentation before a closing delimiter does not count", () => {
    // `''` closes the string two columns in; the gap is kept, so the line is
    // blank in the prepared text, as it is in the host string's value.
    expect(
      prepared(["\n    x = 1\n  ", { gap: "'';\n  b = ''" }, "\n    y = 2\n  "], {
        trimEdges: false,
      }),
    ).toBe("\nx = 1\n   \n\ny = 2\n");
  });

  test("content apart from each other by host lines is dedented apart", () => {
    // Two host strings at different depths combined into one document: each
    // loses its own indentation, as each host string does.
    expect(
      prepared(["\n  x = 1\n", { gap: "'';\n  nested.b = ''" }, "\n      y = 2\n    "], {
        trimEdges: false,
      }),
    ).toBe("\nx = 1\n\n\ny = 2\n");
  });

  test("content joined by a filled gap is dedented as one text", () => {
    expect(
      prepared(["  if x:\n      y = ", { gap: "${\n  a\n}" }, "\n      z = 1\n"], {
        trimEdges: false,
        gap: "None",
      }),
    ).toBe("if x:\n    y = None\n    z = 1\n");
  });

  test("content after a gap that ends a line starts one", () => {
    expect(
      prepared(["<div>\n", { gap: "text\n" }, "  </div>\n"], { trimEdges: false, gap: "" }),
    ).toBe("<div>\n  </div>\n");
    // The gap opens its line: its text is stripped, its line break stays.
    expect(prepared(["<div>\n", { gap: "text\n" }, "  </div>\n"], { trimEdges: false })).toBe(
      "<div>\n\n</div>\n",
    );
  });

  test("content after a kept gap of several lines starts a line, whatever the gap ends with", () => {
    // kakehashi strips the host text that opens a line of content, so the
    // `b = "` after the gap's line break is not in the virtual document.
    expect(prepare(["a = 1\n", { gap: "'';\n  b = \"" }, "  z = 1"], { trimEdges: false })).toEqual(
      {
        segments: [
          { type: "content" },
          { type: "gap" },
          { type: "content", changes: dedent(2, 0) },
        ],
      },
    );
  });

  test("content after a filled gap of several lines is the rest of the placeholder's line", () => {
    expect(
      prepare(["  a = ", { gap: "${\n  x\n}" }, "  + 1\n  b\n"], { trimEdges: false, gap: "0" }),
    ).toEqual({
      segments: [
        { type: "content", changes: dedent(2, 0) },
        { type: "gap", content: "0" },
        { type: "content", changes: dedent(2, 1) },
      ],
    });
  });

  test("can be turned off", () => {
    expect(prepare(["  a\n  b\n"], { dedent: false })).toBeNull();
  });
});

describe("trimEdges", () => {
  test("blank lines opening the document go, apart from the next line's indentation", () => {
    expect(prepare(["\n  \n  a\n"])).toEqual({
      segments: [{ type: "content", changes: [remove(0, 0, 2, 0), ...dedent(2, 2)] }],
    });
  });

  test("blank lines ending the document go, with the closing line's indentation as its own change", () => {
    expect(prepare(["a\n\n  \n    "])).toEqual({
      segments: [{ type: "content", changes: [remove(1, 0, 3, 0), remove(3, 0, 3, 4)] }],
    });
  });

  test("a closing line's indentation goes even with no blank line before it", () => {
    expect(prepared(["\n    a\n  "])).toBe("a\n");
  });

  test("blank lines ending a document that ends with a line break go", () => {
    expect(prepare(["a\n\n\n"])).toEqual({
      segments: [{ type: "content", changes: [remove(1, 0, 3, 0)] }],
    });
  });

  test("a last line with text keeps the blank lines before it", () => {
    expect(prepare(["a\n\nb"])).toBeNull();
  });

  test("a document of whitespace alone is left as it is", () => {
    // Its lines are where the user is about to type; with them deleted, no
    // request made there would have a position in the prepared text.
    expect(prepare(["\n  \n"])).toBeNull();
    expect(prepare(["\n    ", { gap: "${x}" }, "\n  "])).toBeNull();
  });

  test("blank lines beside a gap stay", () => {
    expect(prepare(["\n\n", { gap: "<!-- -->\n" }, "a\n"])).toBeNull();
    expect(prepare(["a\n", { gap: "<!-- -->\n" }, "\n\n"])).toBeNull();
  });

  test("the line break opening the document goes even when a gap opens the next line", () => {
    expect(prepare(["\n    ", { gap: "${x}" }, "/bin\n"])).toEqual({
      segments: [
        { type: "content", changes: [remove(0, 0, 1, 0), ...dedent(4, 1)] },
        { type: "gap" },
        { type: "content" },
      ],
    });
  });

  test("blank lines after a gap of several lines are beside it, not at the document's end", () => {
    // The gap's last line break ends a line of the virtual document, so the
    // blank lines after it reach back to the gap. Only the closing line's
    // indentation goes.
    expect(prepare(["a ", { gap: "${\n  x\n}" }, "\n\n  "], { gap: "0" })).toEqual({
      segments: [
        { type: "content" },
        { type: "gap", content: "0" },
        { type: "content", changes: [remove(2, 0, 2, 2)] },
      ],
    });
    expect(prepare(["a\n", { gap: "'';\n  b = ''" }, "\n    \n  "])).toEqual({
      segments: [
        { type: "content" },
        { type: "gap" },
        { type: "content", changes: [remove(2, 0, 2, 2)] },
      ],
    });
  });

  test("the rest of a line after a gap is not a blank line of the document's end", () => {
    expect(prepare(["a ", { gap: "${x}" }, "\n\n  "])).toEqual({
      segments: [
        { type: "content" },
        { type: "gap" },
        { type: "content", changes: [remove(1, 0, 2, 0), remove(2, 0, 2, 2)] },
      ],
    });
  });

  test("a shebang after the opening line break becomes the first line", () => {
    expect(
      prepared(["\n    #!/bin/sh\n    echo ", { gap: "${toString cfg.port}" }, "\n  "], {
        gap: "0",
      }),
    ).toBe("#!/bin/sh\necho 0\n");
  });

  test("can be turned off", () => {
    expect(prepared(["\n  a\n\n  "], { trimEdges: false })).toBe("\na\n\n");
  });
});

describe("the virtual document, as the segments spell it", () => {
  const segments = (pieces: readonly Piece[]) => request(pieces).segments;

  test("a gap continuing a line of content stands as spaces up to its first line break", () => {
    expect(standsFor("${x}", true)).toBe("    ");
    expect(standsFor("${\n  x\n}", true)).toBe("  \n\n");
  });

  test("a space stands for each UTF-16 code unit, so a character outside the BMP takes two", () => {
    expect(standsFor("é𝒳", true)).toBe("   ");
  });

  test("a gap opening a line stands as its line breaks alone", () => {
    expect(standsFor("text\n", false)).toBe("\n");
    expect(standsFor("'';\r\n  b = \"", false)).toBe("\r\n");
    expect(standsFor("${x}", false)).toBe("");
  });

  test("line breaks stay as the host has them", () => {
    expect(standsFor("a\rb\r\nc\nd", true)).toBe(" \r\r\n\n");
  });

  test("a gap continues a line after content that does not end in a line break", () => {
    expect(continuesALine(segments(["a = ", { gap: "${x}" }, "\n"]), 1)).toBe(true);
    expect(continuesALine(segments(["a\n", { gap: "${x}" }, "b\n"]), 1)).toBe(false);
    expect(continuesALine(segments(["a\r", { gap: "${x}" }, "b\n"]), 1)).toBe(false);
    expect(continuesALine(segments([{ gap: "${x}" }, "b\n"]), 0)).toBe(false);
  });
});

describe("gap", () => {
  test("is kept as kakehashi presents it unless a rule fills it", () => {
    expect(prepare(["a = ", { gap: "${x}" }, "\n"])).toBeNull();
  });

  test("a string fills every gap", () => {
    expect(prepare(["a = ", { gap: "${x}" }, " + ", { gap: "${y}" }, "\n"], { gap: "0" })).toEqual({
      segments: [
        { type: "content" },
        { type: "gap", content: "0" },
        { type: "content" },
        { type: "gap", content: "0" },
        { type: "content" },
      ],
    });
  });

  test("a function sees the host text and both languages, and keeps a gap by answering undefined", () => {
    const seen: unknown[] = [];
    const answer = prepare(["a = ", { gap: "${x}" }, "\n", { gap: "'';\n  b = ''" }, "c\n"], {
      gap: (gap) => {
        seen.push(gap);
        return gap.content.startsWith("${") ? "None" : undefined;
      },
    });

    expect(seen).toEqual([
      { content: "${x}", languageId: "python", hostLanguageId: "nix" },
      { content: "'';\n  b = ''", languageId: "python", hostLanguageId: "nix" },
    ]);
    expect(answer?.segments[1]).toEqual({ type: "gap", content: "None" });
    expect(answer?.segments[3]).toEqual({ type: "gap" });
  });

  test("a gap of several lines takes whatever text the rule gives, on as many lines as it likes", () => {
    const pieces: Piece[] = ["x = ", { gap: "${\n  toString\n    cfg.port\n}" }, "\ny = 1\n"];

    expect(prepared(pieces, { gap: "0" })).toBe("x = 0\ny = 1\n");
    expect(prepared(pieces, { gap: (gap) => `(0${gap.content.replace(/[^\n]/g, "")})` })).toBe(
      "x = (0\n\n\n)\ny = 1\n",
    );
  });

  test("a fill that would join a lone CR and an LF into one line break is not used", () => {
    expect(prepare(["a\r", { gap: "${x}" }, "\nb"], { gap: "" })).toBeNull();
    expect(prepare(["a", { gap: "${x}" }, "\nb"], { gap: "0\r" })).toBeNull();
    expect(prepare(["a\r", { gap: "${x}" }, "b"], { gap: "\n0" })).toBeNull();
  });
});

describe("languages", () => {
  const options: PrepareOptions = {
    gap: "0",
    languages: {
      python: { gap: "None" },
      markdown: { dedent: false, trimEdges: false, gap: (gap) => gap.content },
    },
  };
  const pieces: Piece[] = ["\n  a = ", { gap: "${x}" }, "\n"];
  const answerFor = (languageId: string) => prepareSegments(request(pieces, languageId), options);

  test("a language's rule is chosen by the virtual document's language", () => {
    expect(answerFor("python")?.segments[1]).toEqual({ type: "gap", content: "None" });
  });

  test("a language without a rule of its own takes the shared one", () => {
    expect(answerFor("json")?.segments[1]).toEqual({ type: "gap", content: "0" });
  });

  test("a language's rule overrides the shared one field by field", () => {
    expect(answerFor("markdown")).toEqual({
      segments: [{ type: "content" }, { type: "gap", content: "${x}" }, { type: "content" }],
    });
    expect(
      prepareSegments(request(["\n  a\n"], "sql"), { languages: { sql: { trimEdges: false } } }),
    ).toEqual({ segments: [{ type: "content", changes: dedent(2, 1) }] });
  });
});

describe("the answer", () => {
  const pieces: Piece[] = [
    "\n    #!/bin/sh\n    echo ",
    { gap: "${toString cfg.port}" },
    "\n    ",
    { gap: "${pkgs.hello}" },
    "/bin/hello\n  ",
  ];

  test("has the request's segments, in its order", () => {
    const answer = prepare(pieces, { gap: "0" });

    expect(answer?.segments.map((segment) => segment.type)).toEqual(
      request(pieces).segments.map((segment) => segment.type),
    );
  });

  test("is a function of the request alone: asked again, it is the same, and the request is not written to", () => {
    const frozen = structuredClone(request(pieces));
    Object.freeze(frozen.segments);
    for (const segment of frozen.segments) Object.freeze(segment);
    const before = JSON.stringify(frozen);

    const first = prepareSegments(frozen, { gap: "0" });
    const second = prepareSegments(frozen, { gap: "0" });

    expect(first).toEqual(second);
    expect(JSON.stringify(frozen)).toBe(before);
  });

  test("changes with the text: an indentation added moves the dedent", () => {
    expect(prepared(["\n    a\n    b\n  "])).toBe("a\nb\n");
    expect(prepared(["\n    a\n  b\n  "])).toBe("  a\nb\n");
  });
});
