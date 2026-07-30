import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  ErrorCodes,
  type Hover,
  type InitializeResult,
  TextDocumentSyncKind,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

/**
 * The config that reports the folder mirror AND the document store from ONE
 * request, which is what the serving-phase refusal below is measured with. The
 * example config can report neither.
 */
const handshakeState = fixture("handshake-state.ts");

/**
 * The two handshakes that session sends, DISJOINT IN BOTH FIELDS THEY MOVE.
 *
 * Disjoint folder lists so `replaced` cannot be read as `appended`, and a root
 * that moves WITH the list so a mirror that rewrote one and not the other is a
 * visibly different failure rather than a passing one. Neither path need exist:
 * what a folder means is the config author's business.
 */
const firstFolders: WorkspaceFolder[] = [{ uri: "file:///home/me/alpha", name: "alpha" }];
const secondFolders: WorkspaceFolder[] = [{ uri: "file:///home/me/beta", name: "beta" }];
const firstRootUri = "file:///home/me/alpha";
const secondRootUri = "file:///home/me/beta";

/** The one document that session opens, between the two handshakes. */
const openedUri = "file:///workspace/a.txt";

/**
 * What the handshake-state fixture reports of the session AS IT NOW STANDS --
 * mirror and store together, from one request, because the claim is about the
 * two halves disagreeing.
 */
async function sessionState(session: LspSession): Promise<unknown> {
  const hover = await session.request<Hover>("textDocument/hover", {
    textDocument: { uri: openedUri },
    position: { line: 0, character: 0 },
  });
  const contents = hover.contents as { value?: string };
  return JSON.parse(contents.value ?? "{}") as unknown;
}

const runtimes = [bunRuntime, denoRuntime];

// PBI-1 is accepted only by spawning both runtimes for real, so an absent one
// fails this file rather than quietly reducing its coverage.
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // Widened from `toEqual({})` by PBI-2, PBI-3 and PBI-4, deliberately still
    // exact: openClose is what entitles a conforming client to send
    // didOpen/didClose at all, so an equality assertion is the only kind that
    // catches its loss. The capabilities are here because this file drives
    // examples/tsudoi.config.ts, and it advertises ONE FOR EACH METHOD THAT
    // CONFIG SUPPLIES -- so this value moves whenever the example gains or
    // loses a method, which is a DELIBERATE CHANGE TO A PINNED ARTIFACT rather
    // than maintenance. It is THE ONLY EXACT-EQUALITY PIN ON THE DEMO CONFIG:
    // the other capability equality sites in this suite drive purpose-built
    // fixtures, verified by reading the start argument at each.
    //
    // ONE PER METHOD, NOT ONE TOP-LEVEL KEY PER METHOD, and the distinction
    // arrived with the fifth: `completionItem/resolve` contributes
    // `resolveProvider` INSIDE the object `textDocument/completion` owns, which
    // is why the value below has five methods behind four keys. That nesting is
    // the protocol's, and what it cost tsudoi -- AN ORDERING CONSTRAINT BETWEEN
    // TWO CONTRIBUTORS -- IT NO LONGER COSTS: since Sprint 38 both contributors
    // MERGE into that key, so neither has to run after the other. What is
    // asserted in test/resolve.test.ts rather than restated here is the
    // property both of them serve -- that a config supplying both handlers is
    // told about resolve INSIDE the completion provider.
    //
    // THIS PIN IS THE SECOND HALF OF THAT HISTORY AND IS WHY IT IS MENTIONED:
    // with the old assignment, swapping the two entries reddened this test as
    // well as resolve's, MEASURED at Sprint 38 -- so the note at Sprint 34 that
    // the swap reddened resolve's assertion ALONE had stopped being true here,
    // one file away from where it was written, the moment the demo config
    // gained a resolve handler.
    //
    // THE SYNC KIND IS WHAT AN EDITOR READS TO DECIDE WHAT TO SEND, so this
    // value is the whole of the editor-user-facing half of incremental sync:
    // announce Full and a conforming client keeps putting the whole buffer on
    // stdio at every keystroke however well the store applies ranges.
    //
    // diagnosticProvider's TWO BOOLEANS are asserted here as values rather than
    // as presence, and their reasons live at the contributor in src/methods.ts:
    // workspaceDiagnostics is FORCED by tsudoi not serving workspace/diagnostic,
    // while interFileDependencies is CHOSEN on harm asymmetry.
    test("initialize returns a result naming tsudoi, advertising incremental textDocumentSync and a capability for every method the example supplies", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.serverInfo?.name).toBe("tsudoi");
        expect(result.capabilities).toEqual({
          textDocumentSync: { openClose: true, change: TextDocumentSyncKind.Incremental },
          workspace: { workspaceFolders: { supported: true, changeNotifications: true } },
          hoverProvider: true,
          completionProvider: { resolveProvider: true },
          diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: false },
          documentFormattingProvider: true,
        });
      } finally {
        session.dispose();
      }
    });

    // THIS KEY IS WHAT MAKES workspace.ts REACHABLE, and it is not a courtesy
    // advertisement. vscode-languageclient's WorkspaceFoldersFeature.initialize
    // reads `capabilities.workspace.workspaceFolders.changeNotifications` and
    // nothing else; only a string or `true` yields a registration id, and only an
    // id reaches its register() -- the SOLE subscriber to
    // onDidChangeWorkspaceFolders and the sole route to the notification. Without
    // this key a conforming client never sends `didChangeWorkspaceFolders` at
    // all, so the entire delta path in src/workspace.ts is dead code under a real
    // editor and Tsudoi.workspaceFolders is frozen for the session at whatever
    // `initialize` stated.
    //
    // NARROW ON PURPOSE, and that is the point of it standing apart from the
    // exact-equality pin above: that pin moves whenever ANY capability moves, so
    // it can never say which key was lost. This one fails for one reason only.
    //
    // `supported` is asserted beside it as the honest declaration of a fact --
    // tsudoi does answer from workspace folders -- rather than as a field any
    // client is known to read; the client package never reads it.
    test("initialize advertises workspace folder support and asks for change notifications", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities.workspace).toEqual({
          workspaceFolders: { supported: true, changeNotifications: true },
        });
      } finally {
        session.dispose();
      }
    });

    test("a --config path relative to the working directory resolves", async () => {
      // Exactly the acceptance criterion's command form, run from the repo root:
      //   <runtime> src/cli.ts --config examples/tsudoi.config.ts
      const session = LspSession.start(runtime, "examples/tsudoi.config.ts");
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.serverInfo?.name).toBe("tsudoi");
      } finally {
        session.dispose();
      }
    });

    test("initialize, initialized, shutdown, exit yields a null shutdown result and exit code 0", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        // Awaiting the shutdown response before notifying exit is what keeps
        // the response from racing the server's process.exit.
        const shutdownResult = await session.request<null>("shutdown", null);
        expect(shutdownResult).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    test("exit sent after initialize with no shutdown in between exits with code 1", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
      } finally {
        session.dispose();
      }
    });

    // WHAT THIS DEFENDS IS THE EXIT CODE, and the -32600 assertion is the half
    // that makes it mean anything: `exited 0` alone is satisfied by a session
    // whose second `initialize` never arrived -- a write that failed, a frame
    // nobody read -- because a session sitting in the shutdown phase exits 0
    // either way. Asserting the refusal CODE is what distinguishes `tsudoi
    // refused it` from `it was never asked`. Same shape and same reason as the
    // refused-shutdown test below.
    //
    // AND THE ACCEPTED SECOND `initialize` IS NOT A COSMETIC WRONG ANSWER: it
    // returns the session to the serving phase, so the `exit` that follows reads
    // 1 -- this protocol's word for `error` -- out of a session that shut down
    // cleanly and did everything LSP asked of it.
    test("initialize REFUSED after shutdown with InvalidRequest, and the exit that follows still reads 0", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        await session.request<null>("shutdown", null);

        const refusal = await session.requestError("initialize", initializeParams);
        expect(refusal.code).toBe(ErrorCodes.InvalidRequest);

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    // THE SERVING PHASE'S REFUSAL, AND WHAT IT DEFENDS IS NOT AN EXIT CODE BUT
    // THE SESSION'S OWN COHERENCE. The two assertions are one claim and neither
    // half stands alone: -32600 measured by itself is satisfied by a server that
    // rewrote the mirror and THEN refused, and the state assertion by itself is
    // satisfied by a second `initialize` that never arrived.
    //
    // THE STATE IS READ MIRROR-AND-STORE TOGETHER FROM ONE REQUEST, deliberately.
    // A mirror seen to hold still says nothing on its own: a server that dropped
    // the documents alongside it would have RESET the session, which is wrong in
    // a different way. What is asserted here is that ONE HANDSHAKE'S folders,
    // root and documents are what a later request sees -- the accepted second
    // `initialize` replaced the folder list and the root while the store stayed
    // populated, so the session answered from state assembled out of two
    // different handshakes, with ZERO BYTES on stderr to say so.
    //
    // BOTH HANDSHAKES NAME REAL, DISJOINT FOLDERS, so `nothing moved` is a
    // measurement this test could have failed rather than one it cannot make.
    test("initialize REFUSED during the serving phase with InvalidRequest, leaving one handshake's folders, root and documents in place", async () => {
      const session = LspSession.start(runtime, handshakeState);
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          rootUri: firstRootUri,
          workspaceFolders: firstFolders,
        });
        session.notify("initialized", {});
        session.notify("textDocument/didOpen", {
          textDocument: { uri: openedUri, languageId: "plaintext", version: 1, text: "hello" },
        });

        const refusal = await session.requestError("initialize", {
          ...initializeParams,
          rootUri: secondRootUri,
          workspaceFolders: secondFolders,
        });
        expect(refusal.code).toBe(ErrorCodes.InvalidRequest);

        expect(await sessionState(session)).toEqual({
          workspaceFolders: firstFolders,
          rootUri: firstRootUri,
          rootPath: null,
          documents: [openedUri],
        });
      } finally {
        session.dispose();
      }
    });

    // A shutdown tsudoi REFUSED is not a shutdown, and this is where that reading
    // is defended. WHY IT IS NOT THE TEST ABOVE: there the client never asked to
    // shut down; here it asked and was told no, which is a different session and
    // the one LSP's wording leaves open -- `if the shutdown request has been
    // RECEIVED before` reads as bare arrival on the wire until the pre-initialize
    // rule is read beside it. THE READING AND ITS GROUNDS ARE AT exitCode() IN
    // src/lifecycle.ts and are deliberately not repeated here: two copies of one
    // reading is how a project ends up with two rulings that disagree.
    //
    // THE -32002 ASSERTION IS NOT DECORATION AND MAY NOT BE DROPPED: without it
    // `exited 1` is satisfied by a session whose shutdown never arrived at all --
    // a write that failed, a frame that was never read -- which is precisely the
    // case the refusal is supposed to distinguish this test from.
    test("shutdown REFUSED before initialize, then exit, exits 1 -- a refused shutdown is not a shutdown", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const refusal = await session.requestError("shutdown", null);
        expect(refusal.code).toBe(ErrorCodes.ServerNotInitialized);

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
      } finally {
        session.dispose();
      }
    });
  });
}
