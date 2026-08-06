import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  ErrorCodes,
  type Hover,
  type InitializeResult,
  TextDocumentSyncKind,
  type WorkspaceFolder,
} from "vscode-languageserver-protocol";
import { hoverText } from "./fixtures/handler-proxy-throws-on-second-read.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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
    // EXACT EQUALITY, DELIBERATELY, however wide the value grows: openClose is
    // what entitles a conforming client to send didOpen/didClose at all, so an
    // equality assertion refuses its loss. NOT ALONE, AND THE OLD `is what
    // catches` WAS MEASURED FALSE: dropping openClose reddens twenty-two arms
    // over both runtimes -- every capability arm in this file asserts the whole
    // value. The capabilities are here because this file drives
    // examples/tsudoi.config.ts, and it advertises ONE FOR EACH METHOD THAT
    // CONFIG SUPPLIES -- so this value moves whenever the example gains or
    // loses a method, which is a DELIBERATE CHANGE TO A PINNED ARTIFACT rather
    // than maintenance. It is THE ONLY EXACT-EQUALITY PIN ON THE DEMO CONFIG:
    // the other capability equality sites in this suite drive purpose-built
    // fixtures, verified by reading the start argument at each.
    //
    // ONE PER METHOD, NOT ONE TOP-LEVEL KEY PER METHOD:
    // `completionItem/resolve` contributes `resolveProvider` INSIDE the object
    // `textDocument/completion` owns, which is why the value below has five
    // methods behind four keys. That nesting is the protocol's, AND IT COSTS
    // TSUDOI NO ORDERING CONSTRAINT BETWEEN THE TWO CONTRIBUTORS: both MERGE
    // into that key, so neither has to run after the other, and the declaration
    // order decides nothing here or in test/resolve.test.ts. What is asserted
    // there rather than restated here is the property both of them serve --
    // that a config supplying both handlers is told about resolve INSIDE the
    // completion provider.
    //
    // THE SYNC KIND IS WHAT AN EDITOR READS TO DECIDE WHAT TO SEND, so this
    // value is the whole of the editor-user-facing half of incremental sync:
    // announce Full and a conforming client keeps putting the whole buffer on
    // stdio at every keystroke however well the store applies ranges.
    //
    // diagnosticProvider's TWO BOOLEANS are asserted here as values rather than
    // as presence, and their reasons live at the contributor in
    // packages/tsudoi-language-server/src/methods.ts: workspaceDiagnostics is
    // FORCED by tsudoi not serving workspace/diagnostic, while
    // interFileDependencies is CHOSEN on harm asymmetry.
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
    // nothing else; only a string or `true` yields a registration id, and only
    // an id reaches its register() -- the SOLE subscriber to
    // onDidChangeWorkspaceFolders and the sole route to the notification.
    // Without this key a conforming client never sends
    // `didChangeWorkspaceFolders` at all, so the entire delta path in
    // packages/tsudoi-language-server/src/workspace.ts is dead code under a
    // real editor and Tsudoi.workspaceFolders is frozen for the session at
    // whatever `initialize` stated.
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
      //   <runtime> packages/tsudoi-language-server/src/cli.ts --config examples/tsudoi.config.ts
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
        const shutdownResult = await session.request<null>("shutdown", noParams);
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
        await session.request<null>("shutdown", noParams);

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

    // A shutdown tsudoi REFUSED is not a shutdown, and this is where that
    // reading is defended. WHY IT IS NOT THE TEST ABOVE: there the client never
    // asked to shut down; here it asked and was told no, which is a different
    // session and the one LSP's wording leaves open -- `if the shutdown request
    // has been RECEIVED before` reads as bare arrival on the wire until the
    // pre-initialize rule is read beside it. THE READING AND ITS GROUNDS ARE AT
    // exitCode() IN packages/tsudoi-language-server/src/lifecycle.ts and are
    // deliberately not repeated here: two copies of one reading is how a
    // project ends up with two rulings that disagree.
    //
    // THE -32002 ASSERTION IS NOT DECORATION AND MAY NOT BE DROPPED: without it
    // `exited 1` is satisfied by a session whose shutdown never arrived at all --
    // a write that failed, a frame that was never read -- which is precisely the
    // case the refusal is supposed to distinguish this test from.
    test("shutdown REFUSED before initialize, then exit, exits 1 -- a refused shutdown is not a shutdown", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const refusal = await session.requestError("shutdown", noParams);
        expect(refusal.code).toBe(ErrorCodes.ServerNotInitialized);

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
      } finally {
        session.dispose();
      }
    });

    /**
     * `shutdown` TAKES NO PARAMS, so every one of these is a message no reading
     * of LSP makes sense of. `null` and the primitives are not Structured values
     * at all; an object and a non-empty array are Structured and still carry
     * arguments to a signature that declares none.
     *
     * THE EXIT CODE IS THE HALF THAT MAKES THE REFUSALS MEAN SOMETHING, and it
     * is not decoration: -32602 measured alone is satisfied by a server that
     * moved to the shutdown phase and THEN refused, which is the failure this
     * exists to catch. A phase that moved reads 0 here. Five refusals in one
     * session also say the damage does not accumulate -- the first malformed
     * shutdown does not poison the ones after it.
     */
    test("shutdown carrying params is refused -32602 in every spelling, and the phase does not move", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        for (const params of [null, {}, 7, "x", [1, 2]]) {
          const refusal = await session.requestError("shutdown", params);
          expect(refusal.code).toBe(ErrorCodes.InvalidParams);
        }

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
      } finally {
        session.dispose();
      }
    });

    /**
     * WHAT A REFUSED `shutdown` COSTS IS THE MESSAGE AND NOT THE SESSION, and
     * this is the pair to the test above rather than a repetition of it: there
     * the client never corrected itself, so `the phase did not move` is all that
     * could be read. Here it corrects itself and the session shuts down cleanly,
     * which is the property a client actually depends on.
     *
     * THE ORDER INSIDE THE HANDLER IS WHAT THIS PINS. A refusal answered from
     * AFTER the transition would leave this session unable to shut down at all:
     * the corrected `shutdown` would meet the shutdown phase and be answered
     * -32600, and the client would hold a shutdown it may not repeat.
     */
    test("a shutdown refused for its params still accepts the corrected one, and exit reads 0", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const refusal = await session.requestError("shutdown", null);
        expect(refusal.code).toBe(ErrorCodes.InvalidParams);

        expect(await session.request<null>("shutdown", noParams)).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE ONE PRESENT `params` THAT PROCEEDS, AND IT IS A RULING RATHER THAN A
     * GAP LEFT OPEN. An EMPTY by-position array is the by-position spelling of
     * `no arguments`, and `shutdown` declares none -- so it says exactly what
     * omission says, and is answered the same way.
     *
     * IT IS ALSO THE ONE SHAPE THE REFUSAL ABOVE CANNOT SEE, which is why it is
     * asserted here rather than left to be inferred: vscode-jsonrpc SPREADS a
     * by-position array across the handler's arguments, so `[]` and an omitted
     * `params` reach a handler as the same single argument. The shape that
     * could tell them apart is named at the handler in
     * packages/tsudoi-language-server/src/server.ts, along with why it was
     * declined.
     */
    test("shutdown with an empty by-position params proceeds, exactly as an omitted one does", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        expect(await session.request<null>("shutdown", [])).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * TWO THINGS ARE WRONG WITH THIS MESSAGE AND THE PHASE ANSWERS FIRST, which
     * is the same order the request router in
     * packages/tsudoi-language-server/src/methods.ts and the `initialize`
     * boundary both use. A server that has not been initialized has no shutdown
     * to refuse the params of, and -32002 is the diagnosis a client can act on:
     * it says send `initialize` first, where -32602 would send the client
     * hunting a params field that was never the reason.
     */
    test("shutdown carrying params BEFORE initialize is answered -32002, not -32602", async () => {
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

    /**
     * THE HANDSHAKE IS THE ONE REQUEST WHOSE REFUSAL MUST LEAVE THE SESSION
     * USABLE, which is why this asserts the retry and not merely the code.
     *
     * `"params": null` IS WHAT ARRIVES, and it is not conforming: JSON-RPC 2.0
     * says params is `A Structured value` that `MAY be omitted`, and its
     * Parameter Structures section says `If present, parameters for the rpc call
     * MUST be provided as a Structured value. Either by-position through an Array
     * or by-name through an Object`. `null` is neither, and LSP requires an
     * `InitializeParams` object besides. MEASURED, both runtimes: the library
     * answers -32602 ITSELF for params OMITTED and for params BY POSITION, so
     * `null` and the primitives are the whole of what reaches the handler.
     *
     * WHAT ACCEPTING IT COSTS IS NOT THE MALFORMED SESSION, which mirrors
     * nothing and would be survivable, but THE NEXT ONE: the phase moves on the
     * accepted handshake, so the client's corrected `initialize` is refused
     * InvalidRequest and the session it was owed is unreachable.
     */
    test("initialize with null params is REFUSED with InvalidParams, and the handshake that follows completes", async () => {
      const session = LspSession.start(runtime, demoConfig);
      try {
        const refusal = await session.requestError("initialize", null);
        expect(refusal.code).toBe(ErrorCodes.InvalidParams);

        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.serverInfo?.name).toBe("tsudoi");
      } finally {
        session.dispose();
      }
    });

    /**
     * THE FIELDS TSUDOI PUBLISHES, CHECKED WHERE THEY ENTER. `Tsudoi.rootUri`
     * promises `string | null` and `Tsudoi.clientCapabilities` promises an
     * object, and neither promise is kept by anything downstream: the mirror
     * stores `rootUri` as the client's own bytes and the capabilities are
     * mirrored whole, both deliberately. So a config author reading either one
     * gets a value its published type says cannot arrive, and finds out inside
     * their own handler.
     *
     * REFUSED RATHER THAN COERCED, and the asymmetry with `rootPath` beside it is
     * the reason: that field is REDUCED to `null` when it is not an absolute
     * path, because `null` is a state it already has and already means `the
     * client named none`. `rootUri` has that state too -- but a client that sent
     * a NUMBER did not name none, it sent something no reading of this protocol
     * makes sense of, and -32602 is the answer that tells it so.
     *
     * NOT A GATE ON EVERY FIELD OF `InitializeParams`: tsudoi reads four and
     * publishes what it reads. A field nothing reads is a field nothing can be
     * wrong about here.
     */
    for (const [name, params] of [
      ["a non-string rootUri", { ...initializeParams, rootUri: 5 }],
      ["a primitive capabilities", { ...initializeParams, capabilities: 5 }],
      ["an array capabilities", { ...initializeParams, capabilities: [] }],
    ] as const) {
      test(`initialize with ${name} is REFUSED with InvalidParams, naming the field`, async () => {
        const session = LspSession.start(runtime, demoConfig);
        try {
          const refusal = await session.requestError("initialize", params);

          expect(refusal.code).toBe(ErrorCodes.InvalidParams);
          // THE FIELD, not merely the code: a message naming only `params` sends
          // the author back to a message they cannot see, and this suite has
          // caught a refusal firing for the wrong field before.
          expect(refusal.message).toContain(name.endsWith("rootUri") ? "rootUri" : "capabilities");
        } finally {
          session.dispose();
        }
      });
    }

    /**
     * THE HANDSHAKE IS ANSWERED OUT OF WHAT CONFIG LOAD KEPT, AND NEVER OUT OF A
     * SECOND READ OF THE AUTHOR'S OBJECT -- which is the whole of why this drives
     * a `Proxy` rather than a plain config.
     *
     * WHAT A SECOND READ COSTS, and why it lands on the handshake specifically:
     * capability assembly runs INSIDE the `initialize` handler, so a `methods`
     * that answers a function once and throws afterwards fails there -- the
     * handshake is answered -32603 with the author's own words nowhere on the
     * wire, and a second `initialize` is refused, so the session cannot even be
     * retried. A defect one dispatch later is answerable as THAT request; this
     * one takes the session.
     *
     * THE ASSERTION IS THE SERVED HOVER AND NOT MERELY THE RESULT, because a
     * capability claimed from a stale snapshot would satisfy the first half
     * alone. The text is the author's, so it can only have come from the handler
     * the load-time read kept.
     */
    test("a methods object that answers a handler once serves the handshake and the request", async () => {
      const session = LspSession.start(runtime, fixture("handler-proxy-throws-on-second-read.ts"));
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities.hoverProvider).toBe(true);

        session.notify("initialized", {});
        const hover = await session.request<Hover>("textDocument/hover", {
          textDocument: { uri: openedUri },
          position: { line: 0, character: 0 },
        });

        expect(hover.contents).toBe(hoverText);
      } finally {
        session.dispose();
      }
    });
  });
}
