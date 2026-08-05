import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  type Hover,
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixedHover } from "./fixtures/hover-fixed.ts";
import { recoveredHover as rejectsRecovered, rejectMessage } from "./fixtures/hover-rejects.ts";
import { recoveredHover as throwsRecovered, throwMessage } from "./fixtures/hover-throws.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const hoverFixed = fixture("hover-fixed.ts");
const hoverAbsent = fixture("hover-absent.ts");
const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

// Two ways for the same handler to fail: one before any promise exists, one a
// turn of the event loop later. They reach the dispatch by different paths.
const failingFixtures = [
  {
    how: "throws",
    path: fixture("hover-throws.ts"),
    message: throwMessage,
    recovered: throwsRecovered,
  },
  {
    how: "rejects",
    path: fixture("hover-rejects.ts"),
    message: rejectMessage,
    recovered: rejectsRecovered,
  },
];

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * Advertised for EVERY config, so it stands in every exact-equality pin below
 * and is not evidence about the fixture any one of them drives. Why tsudoi
 * claims it unconditionally -- it mirrors folders whatever the config supplies
 * -- is at the capabilities literal in
 * packages/tsudoi-language-server/src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
};

const uri = "file:///workspace/a.txt";

/**
 * A client that renders markdown, spelled as a real editor spells it: the
 * preference list of `textDocument.hover.contentFormat`, markdown first.
 *
 * The shared `initializeParams` declares NOTHING, which is a client entitled to
 * plaintext -- so the example answers it in plaintext, correctly. Every hover
 * test that asserts markdown is about a client that asked for it.
 */
const rendersMarkdown = {
  ...initializeParams,
  capabilities: { textDocument: { hover: { contentFormat: ["markdown", "plaintext"] } } },
};

function hoverParams(line: number, character: number): unknown {
  return { textDocument: { uri }, position: { line, character } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("a config supplying a hover handler advertises hoverProvider", async () => {
      const session = LspSession.start(runtime, hoverFixed);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          hoverProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    // Exact equality, not `hoverProvider is absent`: a server that advertised
    // some other unasked-for capability would satisfy an absence check, and a
    // client trusts every capability it is told about.
    //
    // AND THIS IS WHERE THE TWO KINDS OF CAPABILITY SEPARATE, because it drives a
    // config that supplies NOTHING: what survives here is exactly what tsudoi
    // claims about ITSELF rather than about the config. `workspace` standing in a
    // pin this narrow is the assertion that folder support is unconditional --
    // conditioning it on any declared method would empty this object of it.
    test("a config supplying no handler advertises only what tsudoi claims about itself", async () => {
      const session = LspSession.start(runtime, hoverAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, workspace });
      } finally {
        session.dispose();
      }
    });

    // Deep equality against the literal the fixture exports, range included:
    // the config author's Hover is the answer, and anything tsudoi rewrote on
    // the way out -- a dropped range, a re-encoded string -- shows up here
    // rather than as a response that merely looks reasonable.
    test("the hover handler's return value reaches the client unchanged", async () => {
      const session = LspSession.start(runtime, hoverFixed);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const result = await session.request<Hover | null>("textDocument/hover", hoverParams(1, 3));

        expect(result).toEqual(fixedHover);
      } finally {
        session.dispose();
      }
    });

    // A conforming client never sends this: hoverProvider was not advertised.
    // The server answers it anyway, because a server that fails when a client
    // misbehaves is a server that takes the editor down with it.
    test("a hover request with no handler configured is answered null, twice over", async () => {
      const session = LspSession.start(runtime, hoverAbsent);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(await session.request<Hover | null>("textDocument/hover", hoverParams(0, 0))).toBe(
          null,
        );
        // The second one is the point: null must be an answer the session
        // survives, not an error the connection happens to have absorbed once.
        expect(await session.request<Hover | null>("textDocument/hover", hoverParams(2, 4))).toBe(
          null,
        );
        expect(await session.request<null>("shutdown", noParams)).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    for (const { how, path, message, recovered } of failingFixtures) {
      test(`a hover handler that ${how} is reported and answered, and the next one succeeds`, async () => {
        const session = LspSession.start(runtime, path);
        try {
          await session.request<InitializeResult>("initialize", initializeParams);
          session.notify("initialized", {});

          // -32603 InternalError: the client learns this request failed, which
          // a silent null would have hidden from it entirely.
          const error = await session.requestError("textDocument/hover", hoverParams(0, 0));
          expect(error.code).toBe(-32603);

          // The client's error response says nothing about WHY. Without this
          // line the config author debugs a handler they cannot see fail.
          expect(session.stderr).toContain("textDocument/hover");
          expect(session.stderr).toContain(message);

          // The handler fails once only, so this is `answered normally` as an
          // observation rather than as an absence of catastrophe.
          const second = await session.request<Hover | null>(
            "textDocument/hover",
            hoverParams(1, 1),
          );
          expect(second).toEqual(recovered);

          expect(await session.request<null>("shutdown", noParams)).toBeNull();
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);

          // The diagnosis went to stderr and stayed there: stdout carries the
          // JSON-RPC responses and not one byte besides.
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      });
    }

    // The example config is the artifact a config author copies, and this is
    // the whole chain in one test: their file reads the live buffer, does its
    // own position math, goes to a DICTIONARY for the answer, and the markdown
    // it composes is what an editor shows.
    //
    // THE CLIENT DECLARES IT RENDERS MARKDOWN, which is what makes markdown the
    // right answer below rather than the only one this example can produce. The
    // handshake is the whole of the difference between the two tests here.
    test("the example config answers with the definition of the word under the cursor", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", rendersMarkdown);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri,
            languageId: "plaintext",
            version: 1,
            text: "the hover request\nreads a dictionary",
          },
        });

        // Character 6 is inside `hover`, which starts at code unit 4 of line 0.
        const onHover = await session.request<Hover | null>(
          "textDocument/hover",
          hoverParams(0, 6),
        );
        const contents = (onHover?.contents ?? {}) as { kind?: string; value?: string };
        expect(contents.kind).toBe("markdown");
        // The WORD, then WordNet's own answer: the part of speech and the
        // glossary. Matched on discriminating fragments rather than the whole
        // string, so a database revision that rewords a definition does not
        // fail a test about the wiring.
        expect(contents.value).toContain("**hover**");
        expect(contents.value).toContain("*verb*");
        expect(contents.value).toContain("be undecided about something");

        // A different line AND a different word: a handler that ignored the
        // position, or split lines wrongly, answers the same thing twice.
        const onDictionary = await session.request<Hover | null>(
          "textDocument/hover",
          hoverParams(1, 10),
        );
        const second = (onDictionary?.contents ?? {}) as { value?: string };
        expect(second.value).toContain("**dictionary**");
        expect(second.value).toContain("*noun*");

        // THE PAIR for the two assertions above, and the reason the example
        // catches rather than propagates: WordNet is English, so a word it has
        // never heard of is `nothing to say` and NOT a failed request. Without
        // this half, an implementation answering some canned string for every
        // word passes everything above.
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri: `${uri}.jp`,
            languageId: "plaintext",
            version: 1,
            text: "さようなら 世界",
          },
        });
        const onJapanese = await session.request<Hover | null>("textDocument/hover", {
          textDocument: { uri: `${uri}.jp` },
          position: { line: 0, character: 2 },
        });
        expect(onJapanese).toBeNull();
        // And the session is still healthy afterwards, which is what
        // distinguishes a caught miss from a handler that died quietly.
        expect(session.stderr).toBe("");

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // THE OTHER ARM OF THE SAME HANDSHAKE, OVER THE WIRE. The test above passes
    // unchanged against an example that sends markdown to everyone -- which is
    // what a client entitled to plaintext would then have to read as text -- so
    // the pair is the claim and neither half is it alone. What differs between
    // them is the capabilities of the `initialize` and nothing else.
    //
    // WORTH A SECOND SESSION RATHER THAN LEFT TO THE UNIT TEST: this is the one
    // place the chain is complete -- the client's declaration crosses the wire,
    // tsudoi mirrors it onto the session, and the example reads it back off
    // `context.tsudoi` -- and a mirror that dropped the field would leave the
    // module's own tests entirely green.
    test("the example config answers a client that declared no markdown in plaintext", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        // `capabilities: {}` -- the client that declared nothing at all, which
        // has declared no markdown support.
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: "the hover request" },
        });

        const onHover = await session.request<Hover | null>(
          "textDocument/hover",
          hoverParams(0, 6),
        );
        const contents = (onHover?.contents ?? {}) as { kind?: string; value?: string };

        expect(contents.kind).toBe("plaintext");
        // The SAME dictionary answer, so this is a claim about the format and
        // not about a handler that gave up.
        expect(contents.value).toContain("hover");
        expect(contents.value).toContain("be undecided about something");
        // AND NOT ONE MARK OF THE SYNTAX IT DID NOT ASK FOR. A `plaintext` kind
        // on a value still carrying `**hover**` is the same defect wearing the
        // right label, and the emphasis is what the reader would see.
        expect(contents.value).not.toContain("*");
        expect(contents.value).not.toContain("---");

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
