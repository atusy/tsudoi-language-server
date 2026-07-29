import { describe, expect, test } from "bun:test";
import {
  type CompletionItem,
  type InitializeResult,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { detailPrefix } from "./fixtures/resolve-detail.ts";

const resolveDetail = fixture("resolve-detail.ts");
/**
 * Supplies completion and NOT resolve, and THAT PAIRING IS THE POINT. The other
 * four methods take their capability negative control from a hover-only config,
 * which cannot work here: `resolveProvider` lives INSIDE `completionProvider`,
 * so a config with no completion at all would leave the whole key absent and
 * would be satisfied by a tsudoi that contributed `resolveProvider` whenever
 * completion existed. Only a config that HAS completion and lacks resolve shows
 * the flag tracking the resolve handler.
 *
 * A resolve-only config is not the alternative: it does not load at all, which
 * is asserted in test/cli.test.ts among the other config-failure cases.
 */
const resolveAbsent = fixture("completion-chunks.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * AN ITEM TSUDOI'S OWN COMPLETION NEVER PRODUCED, which is the case the ruling
 * is about: `completionItem/resolve` asks about an item THE CLIENT HOLDS, and a
 * client may send whatever it is holding.
 *
 * `data` CARRIES A NESTED OBJECT and there is a member the protocol does not
 * declare at all. Both are here because a flat string would survive a tsudoi
 * that re-encoded the item through a shape of its own, and neither of these
 * would.
 */
const unrecognisedItem = {
  label: "クライアントが持っている項目",
  data: { source: "some other server", position: { line: 3, character: 12 } },
  aMemberTheProtocolDoesNotDeclare: "kept",
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * EXACT EQUALITY ON THE WHOLE OBJECT, AND IT IS WHAT MAKES THE ORDERING
     * CONSTRAINT CHECKABLE FOR THE FIRST TIME.
     *
     * Capability contributors MUTATE, and this is the first one that writes
     * into a key another method owns -- so `textDocument/completion`'s entry
     * must be declared ABOVE `completionItem/resolve`'s in src/methods.ts, since
     * completion's contributor ASSIGNS a fresh object over whatever is there.
     * Declared the other way round, resolveProvider is written and then thrown
     * away, and the client is told about a completion provider that resolves
     * nothing.
     *
     * NOTHING IN THE LANGUAGE CHECKS THE DECLARATION ORDER, AND THIS ASSERTION
     * CHECKS WHAT THE ORDER IS FOR: not that resolve's entry sits below
     * completion's, but that what the client is told survives both contributors
     * running. MEASURED: swapping the two entries reddens this.
     */
    test("a config supplying a resolve handler advertises resolveProvider inside the completion provider", async () => {
      const session = LspSession.start(runtime, resolveDetail);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          completionProvider: { resolveProvider: true },
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE NEGATIVE CONTROL, and it is not optional: a client is entitled to
     * send whatever it was told about, so a capability claimed where the config
     * cannot answer it makes the server lie about itself. The completion
     * provider is still advertised here -- this config can answer completion --
     * and it carries nothing inside it.
     *
     * IT IS BYTE-IDENTICAL TO AN ASSERTION IN test/completion.test.ts, SAME
     * FIXTURE AND ALL, AND IT IS KEPT ON THE SPRINT-31 GROUND RATHER THAN BY
     * OVERSIGHT. That one's TITLE names completionProvider's PRESENCE; this
     * one's names resolveProvider's ABSENCE, and they are the two different
     * properties one object happens to carry. A duplicate detection that
     * arrives without naming its cause is the half of S9 this project has
     * already been caught by.
     *
     * WHAT IT IS MEASURED TO CATCH: naming this method inside
     * contributeCapabilities' shared condition -- so resolveProvider is
     * contributed whether or not a handler exists -- reddens this assertion by
     * name, together with every other capability negative control in the suite
     * and the demo config's pinned capabilities. TWENTY ASSERTIONS ACROSS FIVE
     * FILES, both runtimes, with the number of tests RUN unchanged. So the
     * `ONLY when a handler exists` half is MEASURED and is NOT isolated, which
     * is the same shape Sprint 31 recorded and is not a defect.
     */
    test("a config supplying completion and no resolve handler advertises a completion provider with nothing inside it", async () => {
      const session = LspSession.start(runtime, resolveAbsent);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, completionProvider: {} });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE RULING ON AN UNRECOGNISED ITEM, ASSERTED RATHER THAN LEFT TO THE
     * IMPLEMENTATION. tsudoi keeps no record of what a completion handler
     * produced, so it cannot recognise an item and does not try: what the client
     * sent reaches the handler verbatim, and what the handler returned goes back
     * verbatim.
     *
     * THE EXPECTED VALUE IS DERIVED, WHICH IS WHAT MAKES THIS DISCRIMINATE. A
     * fixture answering with its argument unchanged would be satisfied by a
     * tsudoi that echoed the request's params and never called a handler at all
     * -- the two produce the same bytes. `detail` is computed from the incoming
     * label, so only a real call to the config author's handler produces it.
     *
     * AND THE ITEM CARRIES MEMBERS TSUDOI HAS NO REASON TO UNDERSTAND: `data`
     * with an object inside it, and a member the protocol does not declare.
     * Deep equality over the whole answer is what says they came back, since a
     * tsudoi that rebuilt the item from the fields it knows would produce
     * something that still looks like a completion item.
     */
    test("an item tsudoi never produced reaches the handler and returns carrying what the handler derived", async () => {
      const session = LspSession.start(runtime, resolveDetail);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const resolved = await session.request<CompletionItem>(
          "completionItem/resolve",
          unrecognisedItem,
        );

        expect(resolved).toEqual({
          ...unrecognisedItem,
          detail: `${detailPrefix}${unrecognisedItem.label}`,
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * A CONFORMING CLIENT NEVER SENDS THIS, because `resolveProvider` was not
     * advertised. The server answers it anyway, because a server that fails when
     * a client misbehaves is a server that takes the editor down with it.
     *
     * `null` IS THE ANSWER, AND THIS REQUEST'S RESULT TYPE DECLARES NO NULL ARM
     * -- the same position `textDocument/diagnostic` is in. ASSERTED RATHER THAN
     * QUIETLY TRUE: it is the router's shared no-handler answer and not this
     * method's, and giving one method its own would be the per-method convention
     * the request table exists to retire.
     *
     * BORN GREEN, DECLARED RATHER THAN LEFT TO BE INFERRED. It rides the
     * awaited-once drive's `?? null`, which hover, formatting and diagnostic
     * already ride, so NOTHING RESOLVE-SPECIFIC DEFENDS IT and no perturbation
     * reddens it without reddening those three together. It is here on the same
     * footing formatting's and diagnostic's twins are: it says what the wire
     * answer IS for a method whose result type declares no null arm.
     */
    test("a resolve request with no handler configured is answered null, twice over", async () => {
      const session = LspSession.start(runtime, resolveAbsent);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(
          await session.request<CompletionItem | null>("completionItem/resolve", unrecognisedItem),
        ).toBe(null);
        // The second one is the point: null must be an answer the session
        // survives, not an error the connection happens to have absorbed once.
        expect(
          await session.request<CompletionItem | null>("completionItem/resolve", unrecognisedItem),
        ).toBe(null);
        expect(await session.request<null>("shutdown", null)).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        // The answers went out as JSON-RPC responses and nothing besides:
        // stdout carries the protocol and not one byte more.
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
