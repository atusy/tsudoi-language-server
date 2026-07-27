import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const snapshotConfig = fixture("snapshot-config.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/** One entry of what the config author's own `tsudoi.documents` held at exit. */
interface SnapshotDocument {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

const marker = "TSUDOI_SNAPSHOT ";

function readSnapshot(stderr: string): SnapshotDocument[] {
  const line = stderr.split("\n").find((candidate) => candidate.startsWith(marker));
  if (line === undefined) {
    throw new Error(`no ${marker.trim()} line on stderr; stderr was: ${JSON.stringify(stderr)}`);
  }
  return JSON.parse(line.slice(marker.length)) as SnapshotDocument[];
}

const uri = "file:///workspace/a.txt";
const otherUri = "file:///workspace/b.txt";

// The stakeholder wrote the brief in Japanese, so their first real document
// will contain Japanese. Content-Length is a BYTE count while String.length is
// a UTF-16 unit count, so any layer that confuses the two truncates here and
// nowhere in an ASCII test.
const openedText = "こんにちは、世界。\n二行目も日本語です。";
// SHORTER than the text it replaces -- under full sync the client resends the
// whole buffer, so a store that appended instead of replacing would still hold
// the opening text and pass any `toContain` assertion. Shrinking is what
// distinguishes replace from append.
const changedText = "さようなら。";

function didOpen(documentUri: string, text: string): unknown {
  return { textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("didOpen then didChange leaves the config's store holding the latest text", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

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

        // Notifications produce no response, so exactly two messages should
        // ever have crossed stdout: the initialize and shutdown responses.
        expect(session.messagesReceived).toBe(2);
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
        session.notify("textDocument/didOpen", didOpen(uri, openedText));
        session.notify("textDocument/didClose", { textDocument: { uri } });

        await session.request<null>("shutdown", null);
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);

        expect(readSnapshot(session.stderr)).toEqual([]);
        expect(session.messagesReceived).toBe(2);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("didChange and didClose for a uri never opened are survivable, not fatal", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

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
          return line !== "" && !line.startsWith(marker);
        });
        expect(noise).toEqual([]);
        expect(session.messagesReceived).toBe(2);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("closing one of two open documents leaves values() holding exactly the other", async () => {
      const session = LspSession.start(runtime, snapshotConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
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
        expect(session.messagesReceived).toBe(2);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
