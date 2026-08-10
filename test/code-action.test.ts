import { describe, expect, test } from "bun:test";
import {
  type CodeAction,
  type Command,
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { codeActionAnswer } from "./fixtures/code-action.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const codeActionFixture = fixture("code-action.ts");
/**
 * A config that can answer something and NOT this, which is what the absence
 * half needs: a config answering nothing at all would satisfy an absence check
 * from a tsudoi that failed to load it.
 */
const codeActionAbsent = fixture("hover-fixed.ts");
/** Supplies no handler for anything, for the answer the ROUTE gives on its own. */
const noMethods = fixture("no-methods.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * Advertised for EVERY config, so it stands in the exact-equality pins below and
 * is not evidence about the fixture either of them drives. Why tsudoi claims it
 * unconditionally is at the capabilities literal in
 * packages/tsudoi-language-server/src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
};

const uri = "file:///workspace/a.txt";

/**
 * A RANGE AND A CONTEXT, BOTH REQUIRED BY `CodeActionParams` AND VALIDATED BY
 * NOTHING ON THE WIRE. They are written out because the request is what a client
 * would send, not because anything here would notice their absence -- the same
 * reading test/methods-table.test.ts MEASURED for its own shared params object.
 */
function codeActionParams(): unknown {
  return {
    textDocument: { uri },
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
    context: { diagnostics: [] },
  };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * WHAT THE AUTHOR WROTE IS WHAT THE CLIENT RECEIVES, ASSERTED WHOLE AND OVER
     * BOTH MEMBERS OF THE UNION. tsudoi neither validates a code action nor
     * reshapes one, so a `Command` -- which shares no field with a `CodeAction`
     * beyond `title` -- is what a tsudoi rebuilding the list out of the members
     * it recognised would drop.
     *
     * EXACT EQUALITY ON THE WHOLE LIST rather than a read of one title: an
     * implementation that reordered, deduplicated, or filled in a `kind` for the
     * command reddens here, and none of those would move a length or a title.
     */
    test("a config's code actions reach the client as the author wrote them", async () => {
      const session = LspSession.start(runtime, codeActionFixture);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered = await session.request<(Command | CodeAction)[] | null>(
          "textDocument/codeAction",
          codeActionParams(),
        );

        expect(answered).toEqual(codeActionAnswer);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIRED DIRECTION, and without it the arm above is a claim about a
     * ROUTE that might answer that way for anybody: the SAME request against a
     * config with no handler is answered `null`, so what came back up there is
     * attributable to the handler rather than to the registration.
     */
    test("the same request against a config with no handler is answered null", async () => {
      const session = LspSession.start(runtime, noMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered = await session.request<unknown>(
          "textDocument/codeAction",
          codeActionParams(),
        );

        expect(answered).toBeNull();
      } finally {
        session.dispose();
      }
    });

    /**
     * `codeActionProvider: true` AND NOT AN OPTIONS OBJECT, WHICH IS THIS ROW'S
     * CONTRAST WITH THE ONE BEFORE IT. `ExecuteCommandOptions.commands` is
     * REQUIRED, so that contributor had to write a list and could only write an
     * empty one; `CodeActionOptions.codeActionKinds` is OPTIONAL, so handler
     * presence can decline to name kinds instead of naming wrong ones. Claiming
     * a kind would be a promise to a client that no config made -- the identical
     * failure, avoidable here where it was not there.
     *
     * EXACT EQUALITY ON THE WHOLE OBJECT rather than a read of the one key: an
     * implementation writing `{ codeActionKinds: [] }` -- which reads like a
     * harmless spelling of `true` and tells a conforming client this server
     * produces NO kinds at all -- reddens here and would satisfy any read of the
     * key alone.
     */
    test("a config supplying a codeAction handler advertises the provider and no kinds", async () => {
      const session = LspSession.start(runtime, codeActionFixture);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          codeActionProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE OTHER DIRECTION, AND THE KEY IS ABSENT ENTIRELY RATHER THAN `false`.
     * `contributeCapabilities` is presence-driven, so a config declaring no
     * handler must leave the client with nothing to send.
     *
     * IT ADDS NO DISCRIMINATION AND IS KEPT ANYWAY, for the reason
     * test/execute-command.test.ts writes at its own absence arm: other files
     * drive this same fixture to the same whole-object equality, so every
     * weakening reddening this reddens those too. WHAT KEEPS IT IS WHERE IT IS
     * READ -- a reader looking for the absence half should find it in the file
     * about code actions.
     */
    test("a config supplying no codeAction handler advertises no code-action support", async () => {
      const session = LspSession.start(runtime, codeActionAbsent);
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
  });
}
