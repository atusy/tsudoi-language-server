import { describe, expect, test } from "bun:test";
import {
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import type { CommandEcho } from "./fixtures/execute-command-echo.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const executeCommandEcho = fixture("execute-command-echo.ts");
/**
 * A config that can answer something and NOT this, which is what the absence
 * half needs: a config answering nothing at all would satisfy an absence check
 * from a tsudoi that failed to load it.
 */
const executeCommandAbsent = fixture("hover-fixed.ts");
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

/**
 * A COMMAND NAME NO CONFIG IN THIS REPOSITORY ADVERTISES, and the echo fixture
 * advertises none at all -- so a tsudoi that filtered requests against the
 * advertised list would refuse exactly this.
 */
const unadvertisedCommand = "tsudoi.試験.どこにも広告されていないコマンド";

/**
 * ARGUMENTS CARRYING A NESTED OBJECT rather than a flat string, for the reason
 * test/resolve.test.ts's unrecognised item carries one: a string survives a
 * tsudoi that re-encoded the params through a shape of its own, and this does
 * not. `LSPAny[]` is what the protocol declares, so a mixed list is legal.
 */
const commandArguments = [{ uri: "file:///workspace/a.txt", at: { line: 3, character: 12 } }, 5];

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE ADVERTISED LIST IS EMPTY AND TSUDOI INVENTED NOTHING.
     * `ExecuteCommandOptions.commands` is REQUIRED, so the contributor must
     * write something; it writes `[]`, because the list is the AUTHOR'S -- set
     * through a `config.methods.initialize` handler -- and any name tsudoi put
     * there would be a claim to a client that no config made.
     *
     * EXACT EQUALITY ON THE WHOLE OBJECT rather than a read of the one key: an
     * implementation synthesising names from the handler, from the method or
     * from anywhere else reddens on the list, and one that also claimed a
     * capability nothing here can answer reddens on the object.
     *
     * WHAT ITS GREEN DOES NOT MEAN, said plainly so nobody reads it as
     * `commands work`: this config's handler is UNREACHABLE from a conforming
     * client, which will send no command it was not told about. That is the
     * ruling and not an oversight -- the list is the author's -- and the arm
     * below drives the request anyway, because tsudoi filters on nothing.
     */
    test("a config supplying an executeCommand handler advertises an empty command list", async () => {
      const session = LspSession.start(runtime, executeCommandEcho);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({
          textDocumentSync,
          workspace,
          executeCommandProvider: { commands: [] },
        });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE OTHER DIRECTION, AND THE KEY IS ABSENT ENTIRELY RATHER THAN EMPTY.
     * `contributeCapabilities` is presence-driven, so a config that declares no
     * handler must leave the client with nothing to send: an
     * `executeCommandProvider: { commands: [] }` contributed unconditionally
     * would satisfy no assertion here and would tell every client this server
     * executes commands.
     *
     * IT ADDS NO DISCRIMINATION AND IS KEPT ANYWAY, said plainly rather than
     * dressed up as a second subject. test/hover.test.ts drives the same
     * fixture to the same whole-object equality, so every weakening that
     * reddens one reddens the other -- contributing `executeCommandProvider`
     * unconditionally reddens BOTH -- and there is no perturbation this arm
     * catches alone. WHAT KEEPS IT IS WHERE IT IS READ: the criterion asks for
     * both directions of the capability, and a reader looking for the absence
     * half should find it in the file about commands rather than under hover.
     */
    test("a config supplying no executeCommand handler advertises no command support at all", async () => {
      const session = LspSession.start(runtime, executeCommandAbsent);
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

    /**
     * CAPABILITY AND HANDLER ARE NOT TIED, AND AN UNKNOWN COMMAND IS THE
     * AUTHOR'S BUSINESS. The name below appears in no advertised list -- this
     * config's list is empty, asserted above -- and it still reaches the
     * handler.
     *
     * THE ECHO IS WHAT SAYS THE HANDLER RAN. tsudoi keeps no record of a command
     * name and could not have written this answer: an error tsudoi decided on,
     * an empty result, or a filter over the advertised list all redden here.
     *
     * MEASURED, THE FILTER ADDED TO THE ROUTER'S PROLOGUE -- an `InvalidRequest`
     * for any command not in a list that is empty -- and the reading is WIDER
     * THAN THE ONE ARM, which is why it is written out: this arm reddens AND SO
     * DOES THE `null` ARM BELOW, on both runtimes, because the refusal is decided
     * before either the handler or its absence is reached. BOTH CAPABILITY ARMS
     * STAY GREEN, which is the half that says capability and handler are untied
     * rather than merely that something broke.
     *
     * THE ARGUMENTS TRAVEL UNREAD, which is the same ruling
     * `completionItem/resolve` carries: tsudoi does not know what a command
     * means, so it neither validates nor reshapes what the client sent with it.
     */
    test("a command the config never advertised is answered by the handler, arguments and all", async () => {
      const session = LspSession.start(runtime, executeCommandEcho);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered = await session.request<CommandEcho>("workspace/executeCommand", {
          command: unadvertisedCommand,
          arguments: commandArguments,
        });

        expect(answered).toEqual({ command: unadvertisedCommand, arguments: commandArguments });
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIRED DIRECTION, and without it the echo above is a claim about a
     * ROUTE that might answer that way for anybody: the SAME request against a
     * config with no handler is answered `null`, so what came back up there is
     * attributable to the handler rather than to the registration.
     *
     * ITS TWIN OVER THE WHOLE TABLE IS IN test/methods-table.test.ts, which this
     * row joins by existing. That one drives one shared params object across
     * every method; this one drives THIS request, which is what the attribution
     * needs.
     *
     * IT IS ALSO THE SECOND RED OF THE FILTER PERTURBATION recorded above, and
     * that is not a duplicate reading: a filter refuses BEFORE the route reaches
     * the absent handler, so the two arms move together and only the capability
     * arms stay behind to discriminate.
     */
    test("the same command against a config with no handler is answered null", async () => {
      const session = LspSession.start(runtime, noMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered = await session.request<unknown>("workspace/executeCommand", {
          command: unadvertisedCommand,
          arguments: commandArguments,
        });

        expect(answered).toBeNull();
      } finally {
        session.dispose();
      }
    });
  });
}
