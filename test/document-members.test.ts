import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { membersMarker, readMarkedLine } from "./helpers/snapshot.ts";
import { fixture } from "./helpers/spawn.ts";

const membersConfig = fixture("document-members-config.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

// Japanese for the reason test/sync.test.ts uses it -- the stakeholder's first
// real document will contain it -- and TWO lines so that a line index exists to
// be wrong about at all.
const openedText = "こんにちは、世界。\n二行目も日本語です。";
// THREE lines, so lineCount must MOVE rather than merely be reported. Every
// character below is a single UTF-16 unit, which is what lets the offsets in
// this file be stated as plain counts of characters.
//
// "さようなら。" is 6, so its newline sits at offset 6 and line 1 opens at 7;
// "第二行。" is 4, so its newline sits at 11 and line 2 opens at 12.
const changedText = "さようなら。\n第二行。\n第三行。";

interface MembersReport {
  version: number;
  lineCount: number;
  offsetAt: number;
  positionAt: { line: number; character: number };
  rangeText: string;
  wholeText: string;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * ONE `toEqual` OVER THE WHOLE REPORT, and it is not laziness: a wrong
     * `lineCount` and a wrong `offsetAt` are separate defects, and separate
     * `expect` calls would stop at the first so the second could never be
     * SEEN in the same run. A single deep comparison prints every field that
     * moved, which is what a reader needs to tell "the members are absent"
     * from "one member is off by one".
     *
     * ABSOLUTE VALUES, NOT A ROUND TRIP. `positionAt(offsetAt(p)) === p` holds
     * for a consistently broken pair; the two expectations below are read off
     * the text this test put on the wire, so each is wrong if its member is.
     *
     * ON A CHANGED DOCUMENT rather than a freshly opened one, because that is
     * where a line index has to be REBUILT. A store that computed positions
     * once at open would answer every question here from the opening text and
     * pass a version-only check.
     */
    test("a config author reads lineCount, offsets, positions and a ranged getText off a changed document", async () => {
      const session = LspSession.start(runtime, membersConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: openedText },
        });
        session.notify("textDocument/didChange", {
          textDocument: { uri, version: 4 },
          contentChanges: [{ text: changedText }],
        });

        // Awaiting a REQUEST after the notifications is the ordering barrier:
        // its response cannot arrive before the notifications ahead of it on
        // the same connection have been handled.
        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        const report = readMarkedLine(session.stderr, membersMarker) as MembersReport | null;

        expect(report).toEqual({
          version: 4,
          lineCount: 3,
          offsetAt: 12,
          positionAt: { line: 2, character: 0 },
          rangeText: "第二",
          wholeText: changedText,
        });
        expect(session.messagesReceived).toBe(2);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
