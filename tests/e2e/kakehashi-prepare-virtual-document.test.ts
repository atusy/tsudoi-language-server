import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import {
  prepareMethod,
  pythonPlaceholder,
} from "../fixtures/kakehashi-prepare-virtual-document.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "../helpers/lsp.ts";
import { requireRuntime } from "../helpers/preflight.ts";
import { fixture } from "../helpers/spawn.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

// Every claim here is about what kakehashi is told over the wire, so an absent
// runtime fails this file rather than quietly halving it.
await Promise.all(runtimes.map(requireRuntime));

/** A request as kakehashi sends it for one Nix indented string. */
function request(languageId: string, lines: string) {
  return {
    textDocument: { uri: `file:///w/virtual.${languageId}`, languageId, version: 1 },
    hostTextDocument: { uri: "file:///w/flake.nix", languageId: "nix" },
    segments: [
      { type: "content", content: `\n${lines}    port = ` },
      { type: "gap", content: "${toString cfg.port}" },
      { type: "content", content: "\n  " },
    ],
  };
}

const remove = (line: number, from: number, toLine: number, to: number) => ({
  range: { start: { line, character: from }, end: { line: toLine, character: to } },
  newText: "",
});

interface Prepared {
  segments: { type: string; content?: string; changes?: unknown[] }[];
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * kakehashi asks only a server that advertised the request, and a custom
     * method advertises nothing by itself: without this key the handler below
     * is registered and never called.
     */
    test("the handshake advertises the capability kakehashi looks for", async () => {
      const session = LspSession.start(runtime, fixture("kakehashi-prepare-virtual-document.ts"));
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities.experimental).toEqual({
          kakehashi: { virtualDocumentPrepare: true },
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * The whole answer, as it travels: the opening line break deleted apart
     * from the next line's indentation, every line of text dedented, the
     * closing line's indentation as a change of its own, and a gap left as
     * it is where the config has no rule for the language.
     */
    test("a prepare request is answered with the document dedented and its edges trimmed", async () => {
      const session = LspSession.start(runtime, fixture("kakehashi-prepare-virtual-document.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const answer = await session.request<Prepared>(
          prepareMethod,
          request("bash", "    #!/bin/sh\n"),
        );

        expect(answer).toEqual({
          segments: [
            {
              type: "content",
              changes: [remove(0, 0, 1, 0), remove(1, 0, 1, 4), remove(2, 0, 2, 4)],
            },
            { type: "gap" },
            { type: "content", changes: [remove(1, 0, 1, 2)] },
          ],
        });
      } finally {
        session.dispose();
      }
    });

    test("the rule is chosen by the virtual document's language", async () => {
      const session = LspSession.start(runtime, fixture("kakehashi-prepare-virtual-document.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const python = await session.request<Prepared>(prepareMethod, request("python", ""));
        const bash = await session.request<Prepared>(prepareMethod, request("bash", ""));

        expect(python.segments[1]).toEqual({ type: "gap", content: pythonPlaceholder });
        expect(bash.segments[1]).toEqual({ type: "gap" });
      } finally {
        session.dispose();
      }
    });

    /**
     * kakehashi asks again after every edit and may ask in any order. The
     * same text must get the same answer whatever was asked in between: an
     * answer remembered from another text would be mapped onto this one.
     */
    test("the answer follows the text it is asked about, whatever was asked before", async () => {
      const session = LspSession.start(runtime, fixture("kakehashi-prepare-virtual-document.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        const shallow = request("python", "    x = 1\n");
        const deeper = request("python", "        x = 1\n    y = 2\n");

        const first = await session.request<Prepared>(prepareMethod, shallow);
        const edited = await session.request<Prepared>(prepareMethod, deeper);
        const undone = await session.request<Prepared>(prepareMethod, shallow);

        expect(undone).toEqual(first);
        expect(edited).not.toEqual(first);
        expect(edited.segments[0]?.changes).toEqual([
          remove(0, 0, 1, 0),
          remove(1, 0, 1, 4),
          remove(2, 0, 2, 4),
          remove(3, 0, 3, 4),
        ]);
      } finally {
        session.dispose();
      }
    });

    /**
     * An error is what makes kakehashi hold the document back; `null` would
     * tell it to send the text as it is. And the server must outlive the
     * refusal, since the next edit asks again.
     */
    test("a request it cannot read is answered with an error, and the next one is served", async () => {
      const session = LspSession.start(runtime, fixture("kakehashi-prepare-virtual-document.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const refusal = await session.requestError(prepareMethod, { segments: "none" });
        const next = await session.request<Prepared | null>(prepareMethod, request("bash", ""));

        expect(refusal.message).toBeString();
        expect(next?.segments).toHaveLength(3);
      } finally {
        session.dispose();
      }
    });
  });
}
