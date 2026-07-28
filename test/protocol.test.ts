import { describe, expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import type { CompletionItem, Hover, InitializeResult } from "vscode-languageserver-protocol";
import { firstChunk, returnedItems, secondChunk } from "./fixtures/completion-chunks.ts";
import { fixedHover } from "./fixtures/hover-fixed.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { readSnapshot } from "./helpers/snapshot.ts";
import { fixture } from "./helpers/spawn.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));
const snapshotConfig = fixture("snapshot-config.ts");
const completionChunks = fixture("completion-chunks.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * Below `bun test`'s default, so a lifecycle gate that swallowed the message it
 * was supposed to let through fails THIS test by name as a timeout rather than
 * stalling the whole suite with no diagnostic.
 */
const hangTimeoutMs = 4000;

const uri = "file:///workspace/a.txt";

/** The example config answers hover from the live buffer, so it needs one. */
function didOpen(session: LspSession, text: string): void {
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text },
  });
}

function hoverParams(line: number, character: number): unknown {
  return { textDocument: { uri }, position: { line, character } };
}

/**
 * A word the example's dictionary knows, and the heading it puts above the
 * definition. Matched as a FRAGMENT: the glossary is WordNet's text and a
 * database revision may reword it, which is not what these tests are about.
 */
const knownWord = "dictionary";
const exampleHeading = `**${knownWord}**`;

/** The Hover the example answered, as markdown, or "" if it answered none. */
function markdown(hover: Hover | null): string {
  const contents = hover?.contents as { value?: string } | undefined;
  return contents?.value ?? "";
}

/**
 * What the SERVER itself said on stderr, the fixture's own snapshot line
 * excluded. `tsudoi:` is the prefix of every line the connection logger and the
 * handler-failure reporter write, so this is the one measurement that answers
 * `did tsudoi complain`.
 *
 * Used for the absence half AND the presence half of the silence claims below,
 * deliberately the same function: a `nothing was logged` assertion measured by
 * a function that can never see anything is satisfied by a broken measurement.
 */
function tsudoiLines(session: LspSession): string[] {
  return session.stderr.split("\n").filter((line) => line.startsWith("tsudoi:"));
}

/**
 * A completion request carrying `partialResultToken` EXACTLY as given --
 * including values LSP does not allow, which is the whole point here. The
 * parameter is `unknown` because the wire can carry anything; the declared
 * `ProgressToken` type describes what a conforming client sends, not what
 * arrives.
 */
function completionWithToken(token: unknown): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    partialResultToken: token,
  };
}

/** The prefix of the one line tsudoi writes about a token it refused. */
const invalidTokenTrace = "tsudoi: ignoring an invalid partialResultToken";

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // The carve-out this sprint's pre-initialize gate must keep. LSP drops
    // notifications sent before initialize -- except `exit`, which a client is
    // entitled to send at any moment and which must still terminate the
    // process. A gate written without that exception turns this measured
    // exit=1 into a hang, and nothing else in the suite sends `exit` first.
    test(
      "exit as the very first message, with no initialize, exits 1 rather than hanging",
      async () => {
        const session = LspSession.start(runtime, demoConfig);
        try {
          session.notify("exit", null);

          expect(await session.waitForExit()).toBe(1);
          // Nothing was asked, so nothing may be answered.
          expect(session.messagesReceived).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );

    // The boundary the pre-initialize gate must not swallow. `not initialized`
    // and `no such method` are different diagnoses, and a gate answering
    // ServerNotInitialized for everything tsudoi did not register would tell a
    // client its request was mistimed when it was actually unsupported.
    test("after initialize an unregistered method is answered -32601, and hover still answers", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});
        didOpen(session, knownWord);

        const error = await session.requestError("textDocument/definition", hoverParams(0, 0));
        expect(error.code).toBe(-32601);

        // The connection survives the unknown method and still serves: an
        // absence of catastrophe would be satisfied by a dead server too.
        const hover = await session.request<Hover | null>("textDocument/hover", hoverParams(0, 0));
        expect(markdown(hover)).toContain(exampleHeading);

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // Content-Length is a BYTE count; String.length counts UTF-16 units. Every
    // ASCII response in this suite satisfies both readings at once, so nothing
    // tells them apart unless a response carries Japanese.
    //
    // DRIVEN THROUGH A FIXTURE rather than the example, since the example
    // became an ENGLISH dictionary and answers null for a word WordNet has
    // never heard of -- its markdown is now ASCII. The property is tsudoi's
    // framing rather than the example's prose, so the fixture is its home: a
    // property whose only carrier is an artifact free to change its language
    // is a property that can be lost by a change unrelated to it.
    //
    // Asserted on the FRAME rather than by observing what happens: a header
    // carrying the character count is SHORT, so the reader stops mid-body, the
    // next header is never found and the symptom is a test that hangs -- how
    // long depends on what the OS pipe buffered, which is not a failure mode a
    // suite can rely on. This fails as an equality, on a payload small enough
    // to arrive in one chunk under any buffering.
    test("the Content-Length framing a Japanese response is its byte count, not its character count", async () => {
      const session = LspSession.start(runtime, fixture("hover-fixed.ts"));
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});
        didOpen(session, "こんにちは");

        // A fragment WITHOUT a newline: the frame body is JSON, where the
        // fixture's real newlines are the two characters `\n`, so the whole
        // value never appears in it literally.
        const japanese = "**識別子** の説明です。";
        const hover = await session.request<Hover | null>("textDocument/hover", hoverParams(0, 0));
        expect(hover?.contents).toEqual(fixedHover.contents);

        const carrying = session.frames.filter((frame) => frame.body.includes(japanese));
        expect(carrying).toHaveLength(1);
        const [frame] = carrying;
        if (frame === undefined) {
          throw new Error(`no frame carried the hover; saw ${session.frames.length} frames`);
        }

        expect(frame.declaredLength).toBe(Buffer.byteLength(frame.body, "utf8"));
        // The pair that makes the equality above evidence: on THIS body the two
        // readings disagree. Without it the test would pass against an ASCII
        // response, where a server counting characters is indistinguishable
        // from one counting bytes.
        expect(frame.declaredLength).not.toBe(frame.body.length);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // Before initialize the server knows nothing about the client -- not its
    // capabilities, not its root. Answering null here is a PLAUSIBLE lie: the
    // client reads `no hover available at that position` and never learns it
    // asked too early. -32002 is the diagnosis.
    test("hover before initialize is answered -32002, and initialize then still succeeds", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const error = await session.requestError("textDocument/hover", hoverParams(0, 0));
        expect(error.code).toBe(-32002);

        // The gate must REFUSE the request, not poison the session: initialize
        // is the one request it may not gate, and everything after it works.
        const result = await session.request<InitializeResult>("initialize", initializeParams);
        expect(result.serverInfo?.name).toBe("tsudoi");
        session.notify("initialized", {});
        didOpen(session, knownWord);

        const hover = await session.request<Hover | null>("textDocument/hover", hoverParams(0, 0));
        expect(markdown(hover)).toContain(exampleHeading);

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // The other end of the same lifecycle, and a DIFFERENT diagnosis: after
    // shutdown the server is not `not ready yet`, it is done. -32600 says the
    // request itself was invalid at the moment it was sent, which is exactly
    // what the client did wrong.
    test(
      "hover after shutdown is answered -32600, and exit still returns 0",
      async () => {
        const session = LspSession.start(runtime, demoConfig);
        try {
          await session.request("initialize", initializeParams);
          session.notify("initialized", {});
          didOpen(session, "こんにちは");
          // The document IS open, so a server that simply served the request
          // would answer a real Hover here -- the failure mode being refused.
          expect(await session.request<null>("shutdown", null)).toBeNull();

          const error = await session.requestError("textDocument/hover", hoverParams(0, 0));
          expect(error.code).toBe(-32600);

          // exit is the one notification the post-shutdown gate may never
          // drop: dropping it leaves the process alive forever and this
          // assertion fails as a timeout rather than as a wrong code.
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );

    // Harm-proportionality, the same ruling PBI-2 made for an unopened URI: a
    // notification produces no response, so a client cannot be told anything
    // about it, and there is nothing for it to have got wrong that it could
    // act on. Dropping it changes nothing observable, so it stays SILENT --
    // unlike the invalid token below, which loses the user items.
    // Split from the silence claim below on purpose: one test per sub-claim is
    // what lets a perturbation aimed at the drop be seen NOT to disturb the
    // silence, and vice versa. Bundled, whichever assertion ran first would
    // mask the other.
    test(
      "didOpen after shutdown leaves the document absent, and exit still returns 0",
      async () => {
        const session = LspSession.start(runtime, snapshotConfig);
        try {
          await session.request("initialize", initializeParams);
          session.notify("initialized", {});
          await session.request<null>("shutdown", null);
          // WELL-FORMED, and after shutdown: the handler would succeed if it
          // ran, so an empty store means the notification was dropped rather
          // than that it failed.
          didOpen(session, "こんにちは");
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);

          expect(readSnapshot(session.stderr)).toEqual([]);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );

    test(
      "the dropped didOpen is not reported on stderr, in a run where a failing one is",
      async () => {
        // The PAIR, permanent: the same tsudoiLines measurement in a session
        // where a notification handler really does fail. Without it, `zero
        // tsudoi: lines` would also pass against a stderr nobody ever reads.
        const noisy = LspSession.start(runtime, snapshotConfig);
        const quiet = LspSession.start(runtime, snapshotConfig);
        try {
          await noisy.request("initialize", initializeParams);
          // Malformed on purpose, BEFORE shutdown, so the handler is reached
          // and throws for real rather than by an injected fault.
          noisy.notify("textDocument/didOpen", {});
          await noisy.request<null>("shutdown", null);
          noisy.notify("exit", null);
          expect(await noisy.waitForExit()).toBe(0);
          expect(tsudoiLines(noisy).join("\n")).toContain("textDocument/didOpen");

          await quiet.request("initialize", initializeParams);
          quiet.notify("initialized", {});
          await quiet.request<null>("shutdown", null);
          didOpen(quiet, "こんにちは");
          quiet.notify("exit", null);
          expect(await quiet.waitForExit()).toBe(0);

          expect(tsudoiLines(quiet)).toEqual([]);
        } finally {
          noisy.dispose();
          quiet.dispose();
        }
      },
      hangTimeoutMs,
    );

    // The other side of the same drop, and what makes subtask 1's carve-out
    // load-bearing: LSP drops notifications sent before initialize too, with
    // `exit` the one exception. No acceptance criterion asks for this, so it
    // is pinned here rather than left to be discovered by a client.
    test(
      "didOpen before initialize is dropped, and the session still serves afterwards",
      async () => {
        const session = LspSession.start(runtime, snapshotConfig);
        try {
          didOpen(session, "こんにちは");

          await session.request("initialize", initializeParams);
          session.notify("initialized", {});
          await session.request<null>("shutdown", null);
          session.notify("exit", null);
          expect(await session.waitForExit()).toBe(0);

          expect(readSnapshot(session.stderr)).toEqual([]);
          expect(tsudoiLines(session)).toEqual([]);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
      hangTimeoutMs,
    );

    // The defect this PBI exists for, and it is NOT `streaming fails`: null
    // survives connection.sendProgress, so today's server addresses every
    // chunk to a `$/progress` with token null that no client can correlate --
    // silent misdelivery. The remedy is normalise-and-report: the token is
    // treated as absent, the items reach the client whole, and stderr says so.
    test("a null partialResultToken aggregates every item into one response and streams nothing", async () => {
      const invalid = LspSession.start(runtime, completionChunks);
      // The PAIR, permanent: the same progressCount, in a session whose token
      // IS valid. `zero $/progress` measured by a counter that never counts
      // anything is satisfied by a server streaming furiously.
      const valid = LspSession.start(runtime, completionChunks);
      try {
        await invalid.request("initialize", initializeParams);
        await valid.request("initialize", initializeParams);

        const result = await invalid.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionWithToken(null),
        );

        // Every item the handler produced, in order, compared field by field:
        // a length check passes when the right NUMBER of wrong items arrives.
        expect(result).toEqual([...firstChunk, ...secondChunk, ...returnedItems]);
        expect(invalid.progressCount).toBe(0);

        await valid.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionWithToken("valid-token-1"),
        );
        expect(valid.progressCount).toBe(2);

        // Reported, not silent: an invalid token LOSES the user items unless
        // tsudoi intervenes, so the config author gets a line naming it.
        expect(invalid.stderr).toContain(`${invalidTokenTrace} null;`);
        expect(invalid.unframedStdoutBytes).toBe(0);
      } finally {
        invalid.dispose();
        valid.dispose();
      }
    });

    // The frequency is part of the remedy, not a detail of it. A client whose
    // serialisation produces a bad token produces it on EVERY keystroke, and a
    // line per completion buries everything else in the LSP log -- the one
    // channel a config author has for a handler that failed.
    test("two invalid-token completions in one session trace exactly once, and both aggregate", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request("initialize", initializeParams);

        const aggregated = [...firstChunk, ...secondChunk, ...returnedItems];
        const first = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionWithToken(null),
        );
        const second = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionWithToken(null),
        );

        // Asserted BEFORE the count: quietening the trace must not have been
        // paid for by stopping the second request being answered properly.
        expect(first).toEqual(aggregated);
        expect(second).toEqual(aggregated);

        // The PREFIX and the COUNT, never the body: the wording is free to
        // improve, the frequency is the requirement.
        const traces = tsudoiLines(session).filter((line) => line.startsWith(invalidTokenTrace));
        expect(traces).toHaveLength(1);
        expect(session.progressCount).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // Standing checklist item 3: the trace is a new user-visible path, and a
    // token is client-supplied data that can be anything. String(value) on an
    // object yields `[object Object]` and loses this entirely.
    test("the trace names a non-ASCII token as the client sent it", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request("initialize", initializeParams);

        const result = await session.request<CompletionItem[] | null>(
          "textDocument/completion",
          completionWithToken({ id: "トークン" }),
        );

        expect(result).toEqual([...firstChunk, ...secondChunk, ...returnedItems]);
        expect(session.progressCount).toBe(0);
        expect(session.stderr).toContain(`${invalidTokenTrace} {"id":"トークン"};`);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // The reason the validation is a TYPE test. ProgressToken is `integer |
    // string`, so both of these are legal AND falsy: `if (!token)` fixes the
    // null case and silently stops streaming for every client that numbers its
    // tokens from zero or names one with the empty string.
    for (const token of [0, ""]) {
      test(`a partialResultToken of ${JSON.stringify(token)} streams per yield like any other`, async () => {
        const session = LspSession.start(runtime, completionChunks);
        try {
          await session.request("initialize", initializeParams);

          const result = await session.request<CompletionItem[] | null>(
            "textDocument/completion",
            completionWithToken(token),
          );

          // Addressed to the token the client actually sent, one per yield.
          expect(session.progress).toEqual([
            { token, value: firstChunk },
            { token, value: secondChunk },
          ]);
          // The streaming response shape: the RETURNED array alone, the yields
          // having already left as $/progress.
          expect(result).toEqual(returnedItems);
          // Nothing was refused, so nothing was traced. The paired positive
          // control for this silence is the invalid-token tests above, which
          // use this same function and DO see the line.
          expect(tsudoiLines(session)).toEqual([]);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      });
    }
  });
}
