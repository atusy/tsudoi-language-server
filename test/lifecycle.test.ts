import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  ErrorCodes,
  type InitializeResult,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

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
    // the protocol's, and what it costs tsudoi -- an ordering constraint between
    // two contributors -- is asserted where it belongs, in test/resolve.test.ts,
    // rather than restated here.
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
          hoverProvider: true,
          completionProvider: { resolveProvider: true },
          diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: false },
          documentFormattingProvider: true,
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
