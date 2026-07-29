import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { readSnapshot, snapshotMarker, unprimedSnapshotMarker } from "./helpers/snapshot.ts";
import { fixture } from "./helpers/spawn.ts";

const snapshotConfig = fixture("snapshot-config.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";
const otherUri = "file:///workspace/b.txt";

// The stakeholder wrote the brief in Japanese, so their first real document
// will contain Japanese. Content-Length is a BYTE count while String.length is
// a UTF-16 unit count, so any layer that confuses the two truncates here and
// nowhere in an ASCII test.
const openedText = "こんにちは、世界。\n二行目も日本語です。";
// SHORTER than the text it replaces -- it is sent as a change with NO RANGE,
// which the protocol permits whatever sync kind is advertised, so a store that
// appended instead of replacing would still hold the opening text and pass any
// `toContain` assertion. Shrinking is what distinguishes replace from append.
const changedText = "さようなら。";

function didOpen(documentUri: string, text: string): unknown {
  return { textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text } };
}

/**
 * Hands the config a `RequestContext`, which is the ONLY route by which it can
 * reach the document store at all: the factory is now passed nothing.
 *
 * SENT EARLY, right after `initialize`, for two reasons. The store handed over
 * is LIVE, so a handle taken before any didOpen still reports everything that
 * arrives afterwards -- and taking it early leaves each test's `shutdown` as
 * the sole ordering barrier its comments describe, rather than quietly adding a
 * second one between the notifications and the read.
 *
 * IT IS A PRECONDITION, NOT SETUP. Delete it from any test below and that
 * test's snapshot assertion does not merely fail -- see the pair at the bottom
 * of this file for what stops it passing vacuously instead.
 */
async function prime(session: LspSession): Promise<void> {
  await session.request<null>("textDocument/hover", {
    textDocument: { uri },
    position: { line: 0, character: 0 },
  });
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // A CHANGE WITH NO RANGE IS THE WHOLE BUFFER, AND INCREMENTAL SYNC STILL
    // PERMITS IT -- the protocol makes the range optional per change rather than
    // per session, so a client that advertised nothing and a client mid-undo may
    // both send this shape at any moment. Advertising Incremental is an
    // invitation to send ranges, never a promise that nothing else arrives, and
    // a store that read the advertisement as a guarantee would drop this.
    test("didOpen then a change carrying no range leaves the store holding the latest text", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        await prime(session);

        session.notify("textDocument/didOpen", didOpen(uri, openedText));
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

        const documents = readSnapshot(session.stderr);
        expect(documents).toEqual([
          { uri, languageId: "plaintext", version: 4, text: changedText },
        ]);

        // Notifications produce no response, so exactly three messages should
        // ever have crossed stdout: the initialize, priming-hover and shutdown
        // responses. The hover is here because the config reaches its store
        // only through a `RequestContext`; the count is stated as what the
        // session ASKED FOR, so a server answering a notification would still
        // be caught.
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // WHAT AN EDITOR ACTUALLY SENDS NOW THAT TSUDOI ADVERTISES INCREMENTAL, end
    // to end: the ranges cross the wire as JSON, reach the store through the
    // same handler a keystroke uses, and the config reads the result.
    //
    // TWO CHANGES IN ONE NOTIFICATION, THE SECOND ADDRESSING TEXT THE FIRST
    // MOVED. `[0,5) -> やあ` shortens the line, and only then does `[3,5)` name
    // 世界; against the opening text those same offsets name ちは. So a server
    // that applied one change per notification, or applied both against the
    // state it started from, produces something else here rather than the same
    // thing more slowly.
    //
    // THE OFFSETS ARE UTF-16 UNITS AND EVERY CHARACTER BEFORE THEM IS
    // MULTI-BYTE, which is the case an ASCII range cannot see: Content-Length
    // frames BYTES, Position.character counts UTF-16 units, and a layer that
    // confused the two would splice at character 3 of a nine-byte prefix.
    test("a change carrying ranges is applied at those ranges, over the wire", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        await prime(session);

        session.notify("textDocument/didOpen", didOpen(uri, openedText));
        session.notify("textDocument/didChange", {
          textDocument: { uri, version: 4 },
          contentChanges: [
            {
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
              text: "やあ",
            },
            {
              range: { start: { line: 0, character: 3 }, end: { line: 0, character: 5 } },
              text: "宇宙",
            },
          ],
        });

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        expect(readSnapshot(session.stderr)).toEqual([
          {
            uri,
            languageId: "plaintext",
            version: 4,
            text: "やあ、宇宙。\n二行目も日本語です。",
          },
        ]);
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // Big enough that both the wire and the snapshot line cross the pipe's
    // chunk size. A reader that decodes each chunk on its own splits a
    // three-byte character across two decodes and yields U+FFFD twice, which no
    // short document and no ASCII document of any length can expose.
    test("a Japanese document larger than one pipe chunk survives unmangled", async () => {
      const largeText = "あ".repeat(120_000);
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);
        session.notify("textDocument/didOpen", didOpen(uri, largeText));

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        const documents = readSnapshot(session.stderr);
        expect(documents).toHaveLength(1);
        expect(documents[0]?.text).toBe(largeText);
      } finally {
        session.dispose();
      }
    });

    test("didOpen then didClose leaves the config's store empty", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);
        session.notify("textDocument/didOpen", didOpen(uri, openedText));
        session.notify("textDocument/didClose", { textDocument: { uri } });

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        expect(readSnapshot(session.stderr)).toEqual([]);
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("didChange and didClose for a uri never opened are survivable, not fatal", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);

        // The change and the close name DIFFERENT unopened documents on
        // purpose: closing the one that was changed would hide a change that
        // created its document implicitly, and the snapshot is the only
        // observation point, taken once at exit.
        session.notify("textDocument/didChange", {
          textDocument: { uri, version: 2 },
          contentChanges: [{ text: "text for a document nobody opened" }],
        });
        session.notify("textDocument/didClose", { textDocument: { uri: otherUri } });

        // The server must still be alive and speaking: a notification handler
        // that threw would have been swallowed by the JSON-RPC layer, so the
        // exit code is what shows the difference.
        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        expect(readSnapshot(session.stderr)).toEqual([]);
        // Nothing on stderr but the snapshot line: no stack trace, no warning.
        const noise = session.stderr.split("\n").filter((line) => {
          return line !== "" && !line.startsWith(snapshotMarker);
        });
        expect(noise).toEqual([]);
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // The companion to the test above, and what gives its silence meaning: a
    // notification handler that DOES throw must be visible. vscode-jsonrpc
    // catches a throwing notification handler and hands it to the connection's
    // logger, so a connection built without one swallows it whole -- there is
    // then no observation that tells `ignored by design` from `threw and was
    // discarded`. Sending didOpen without a textDocument is the shape a
    // non-conforming client actually produces, and it makes the handler throw
    // for real rather than by an injected fault.
    test("a malformed didOpen is reported on stderr naming the method, and the server survives", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);
        session.notify("textDocument/didOpen", {});

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        // The wrapper text, not the thrown TypeError's text: the wording of a
        // destructuring failure differs between bun's JSC and deno's V8, while
        // this line comes from vscode-jsonrpc and names the method either way.
        expect(session.stderr).toContain("Notification handler 'textDocument/didOpen' failed");
        // Nothing was stored, so the throw happened rather than being tolerated.
        expect(readSnapshot(session.stderr)).toEqual([]);
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("closing one of two open documents leaves values() holding exactly the other", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);
        session.notify("textDocument/didOpen", didOpen(uri, "first"));
        session.notify("textDocument/didOpen", didOpen(otherUri, "second"));
        session.notify("textDocument/didClose", { textDocument: { uri } });

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        // A close that removed the entry but left an index behind would still
        // satisfy get(); only values() reports the leak.
        expect(readSnapshot(session.stderr)).toEqual([
          { uri: otherUri, languageId: "plaintext", version: 1, text: "second" },
        ]);
        expect(session.messagesReceived).toBe(3);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIR THAT KEEPS EVERY `toEqual([])` ABOVE FROM GOING VACUOUS, and it
     * measures a DIFFERENT AXIS from the empty-versus-non-empty pairing those
     * assertions already have: this one is UNPRIMED INSTRUMENT against
     * PRIMED-AND-FOUND-NOTHING. A test elsewhere reporting a non-empty store
     * says nothing about whether the fixture was primed in the tests asserting
     * absence.
     *
     * THE HAZARD IS NEW, AND IT IS THIS SPRINT'S OWN: the factory used to be
     * handed the store unconditionally, so an unprimed instrument was
     * unrepresentable and this pair would have had nothing to discriminate.
     * Now `prime` is a precondition, and deleting it from any test above must
     * not be able to turn that test's absence assertion into a pass.
     *
     * TWO TESTS RATHER THAN ONE: each arm is the FIRST assertion of its own
     * test, so neither can be masked by the other stopping the run early.
     */
    test("a session that primes nothing reports the unprimed state, not an empty store", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        // NO prime(session) HERE -- that absence IS the test.
        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        await session.waitForExit();

        // Not reportable as a store at all: readSnapshot finds no marked line
        // and throws quoting stderr, which puts the word below in the message.
        expect(() => readSnapshot(session.stderr)).toThrow();
        expect(session.stderr).toContain(unprimedSnapshotMarker);
      } finally {
        session.dispose();
      }
    });

    test("a primed session that stored nothing reports an empty store, not the unprimed state", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await prime(session);
        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        await session.waitForExit();

        expect(readSnapshot(session.stderr)).toEqual([]);
        expect(session.stderr).not.toContain(unprimedSnapshotMarker);
      } finally {
        session.dispose();
      }
    });
  });
}
