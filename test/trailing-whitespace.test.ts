import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import type {
  DocumentDiagnosticReport,
  InitializeResult,
  TextEdit,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { warning } from "../examples/diagnostic-trailing-whitespace.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * THE FIXTURE DOCUMENT IS A REQUIREMENT AND NOT AN OBSERVATION, so every
 * property the pair claims is TRUE BY CONSTRUCTION of this string rather than
 * true of whatever text a test happened to reach for.
 *
 * TWO OFFENDING LINES SEPARATED BY A CLEAN ONE. Both halves of that matter and
 * they are different claims: the SEPARATION is what an implementation
 * aggregating into one document-spanning answer cannot fake, and the CLEAN LINE
 * is what an implementation flagging every line cannot. A document with two
 * ADJACENT offending lines would satisfy the first and leave the second
 * untested.
 *
 * JAPANESE, for the reason the offset fixtures are: every ASCII buffer
 * satisfies a byte reading and a UTF-16 reading at once, so a handler counting
 * BYTES is invisible unless the text is multibyte. `第一行に余分な空白がある`
 * is 12 UTF-16 units and 36 UTF-8 bytes, so the first range alone separates
 * them.
 *
 * COUNTED HERE ONCE, IN UTF-16 UNITS, because the expected ranges below are
 * read off these numbers BY HAND and are never computed by calling
 * `positionAt`. Both sides would otherwise run one function, and a correct
 * conversion and a consistently broken one would produce THE SAME OBSERVATION.
 *
 *   line 0  `第一行に余分な空白がある`  12 units, then THREE SPACES  -> 12..15
 *   line 1  `第二行はきれいです`         9 units, nothing after it   -> none
 *   line 2  `第三行にはタブがある`       10 units, then ONE TAB       -> 10..11
 *
 * A SPACE RUN AND A TAB, not two space runs: `trailing whitespace` that means
 * `trailing spaces` passes every assertion here if the tab line is spaces too.
 */
const messyText = "第一行に余分な空白がある   \n第二行はきれいです\n第三行にはタブがある\t";

/** The clean line's index, named once so the assertions about it say why. */
const cleanLine = 1;

/** The two ranges, written out by hand. Both handlers must emit exactly these. */
const expectedRanges = [
  { start: { line: 0, character: 12 }, end: { line: 0, character: 15 } },
  { start: { line: 2, character: 10 }, end: { line: 2, character: 11 } },
];

/**
 * What a client sends for formatting. `options` is REQUIRED by
 * `DocumentFormattingParams`, so it is here because the params are not
 * well-formed without it, and NOT because anything below reads it.
 */
function formattingParams(): unknown {
  return { textDocument: { uri }, options: { tabSize: 2, insertSpaces: true } };
}

/** A session with the messy document already open. */
async function openMessy(runtime: (typeof runtimes)[number]): Promise<LspSession> {
  const session = LspSession.start(runtime, demoConfig);
  await session.request<InitializeResult>("initialize", initializeParams);
  session.notify("initialized", {});
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text: messyText },
  });
  return session;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * DEEP EQUALITY ON THE WHOLE REPORT, `kind` included: the example's report
     * is the answer, and anything tsudoi rewrote on the way out -- a dropped
     * severity, an added resultId, a re-encoded message -- shows up here rather
     * than as a response that merely looks reasonable.
     *
     * TWO ITEMS WITH DISTINCT RANGES IS THE POINT AND NOT A DETAIL. A single
     * finding spanning the document is a LEGAL diagnostic report and would
     * teach a reader the wrong thing: `Diagnostic[]` is an array precisely
     * because a real analysis has several complaints in several places, and an
     * example that never produces two never shows it.
     */
    test("the example reports one warning per line with trailing whitespace, at ranges the client receives", async () => {
      const session = await openMessy(runtime);
      try {
        const report = await session.request<DocumentDiagnosticReport>("textDocument/diagnostic", {
          textDocument: { uri },
        });

        expect(report).toEqual({
          kind: "full",
          items: expectedRanges.map((range) => ({
            range,
            severity: 2,
            message: warning,
          })),
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * A single whole-document edit is the `FULL SYNC` OF FORMATTING -- legal,
     * cheap, and the reason `TextEdit[]` is an array is invisible under it. So
     * this asserts the SHAPE as strictly as the report above.
     *
     * `newText: ""` FOR BOTH, which is what makes a removal a removal rather
     * than a rewrite: the range covers the run and the replacement is nothing.
     */
    test("the example removes each run of trailing whitespace as its own edit", async () => {
      const session = await openMessy(runtime);
      try {
        const edits = await session.request<TextEdit[] | null>(
          "textDocument/formatting",
          formattingParams(),
        );

        expect(edits).toEqual(expectedRanges.map((range) => ({ range, newText: "" })));
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIR'S ENTIRE PEDAGOGICAL CONTENT, AND IT OWNS ITS OWN TEST BECAUSE
     * NOTHING ELSE HERE CAN OBSERVE IT. Both halves above can be individually
     * correct while the pair teaches nothing -- a diagnostic reporting per line
     * beside a formatter emitting one whole-document edit passes neither of
     * them together and is exactly the drift this catches.
     *
     * RANGE FOR RANGE AND IN ORDER, from ONE session on ONE document, so the
     * two answers are about the same buffer at the same version. Comparing two
     * separately-opened documents would compare two analyses instead.
     *
     * A READER RUNS THE DEMO, SEES THE WARNINGS, FORMATS, AND WATCHES THEM
     * CLEAR, and that loop is true only if these two lists are the same list.
     */
    test("every range the diagnostic reports is a range the formatter edits, and there are no others", async () => {
      const session = await openMessy(runtime);
      try {
        const report = await session.request<DocumentDiagnosticReport>("textDocument/diagnostic", {
          textDocument: { uri },
        });
        const edits = await session.request<TextEdit[] | null>(
          "textDocument/formatting",
          formattingParams(),
        );

        const reported = (report as { items: { range: unknown }[] }).items.map(
          (item) => item.range,
        );
        expect(reported).toEqual((edits ?? []).map((edit) => edit.range));
        // The pairing is worth nothing if both sides are empty, which is the
        // state a broken pair most easily reaches: two handlers that answer
        // nothing agree perfectly.
        expect(reported.length).toBeGreaterThan(1);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE CLEAN LINE OWNS THIS TEST AND IS ITS FIRST ASSERTION, because a
     * property sharing a test with another can never be OBSERVED: the same
     * perturbation flips the first assertion and the test stops there.
     *
     * WHAT IT RULES OUT that nothing above does: a handler flagging or
     * rewriting EVERY line -- one whose range happens to be empty on the clean
     * line -- satisfies `two items` and `range for range` and is wrong.
     */
    test("the line with no trailing whitespace is touched by neither half", async () => {
      const session = await openMessy(runtime);
      try {
        const report = await session.request<DocumentDiagnosticReport>("textDocument/diagnostic", {
          textDocument: { uri },
        });
        const items = (report as { items: { range: { start: { line: number } } }[] }).items;
        expect(items.map((item) => item.range.start.line)).not.toContain(cleanLine);

        const edits = await session.request<TextEdit[] | null>(
          "textDocument/formatting",
          formattingParams(),
        );
        expect((edits ?? []).map((edit) => edit.range.start.line)).not.toContain(cleanLine);

        // And the pair is silent on the way through: a handler diagnosing its
        // own confusion onto stderr looks identical to one with nothing to say.
        expect(session.stderr).toBe("");
      } finally {
        session.dispose();
      }
    });
  });
}
