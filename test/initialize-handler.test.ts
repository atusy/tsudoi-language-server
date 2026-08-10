import { describe, expect, test } from "bun:test";
import { ErrorCodes, type InitializeResult, MessageType } from "vscode-languageserver-protocol";
import { awaitedServerName } from "./fixtures/initialize-async.ts";
import { entryCountKey } from "./fixtures/initialize-counts-entries.ts";
import {
  forgedResolveProvider,
  type PreparedMutationReport,
  reportKey,
} from "./fixtures/initialize-mutates-prepared-result.ts";
import { replacedTriggerCharacters } from "./fixtures/initialize-replaces-completion-provider.ts";
import { handshakeFailure } from "./fixtures/initialize-throws.ts";
import { unserializableFailure } from "./fixtures/initialize-unserializable.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const hoverParams = {
  textDocument: { uri: "file:///workspace/a.txt" },
  position: { line: 0, character: 0 },
};

async function served(runtime: typeof bunRuntime, name: string): Promise<InitializeResult> {
  const session = LspSession.start(runtime, fixture(name));
  try {
    return await session.request<InitializeResult>("initialize", initializeParams);
  } finally {
    session.dispose();
  }
}

const runtimes = [bunRuntime, denoRuntime];

// Every claim here is about what a real client is told, so an absent runtime
// fails this file rather than quietly halving it.
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * `preparedResult` IS TSUDOI'S OWN ANSWER, and this arm is the only thing
     * that says so. The comparison is against THE SAME CONFIG WITH THE HANDLER
     * REMOVED -- both sessions declare the identical `sharedMethods` -- and never
     * against a literal written here: a literal would green whatever tsudoi
     * happens to prepare and leave the claim asserted by nobody.
     */
    test("a handler returning preparedResult unchanged is served exactly what the same config with no handler is served", async () => {
      const withHandler = await served(runtime, "initialize-identity.ts");
      const withoutHandler = await served(runtime, "initialize-absent.ts");

      expect(withHandler).toEqual(withoutHandler);
      // THE PAIR IS ONLY WORTH SOMETHING IF IT CARRIES SOMETHING: two empty
      // capability sets are equal too, and this config's contributors are what
      // make the equality a statement about a real prepared answer.
      expect(withHandler.capabilities.completionProvider).toEqual({ resolveProvider: true });
    });

    /**
     * WHAT THE AUTHOR RETURNS IS WHAT THE CLIENT IS TOLD, and the discriminator
     * is the key they did NOT write: tsudoi neither merges its prepared result
     * back over the answer nor restores `resolveProvider`. An implementation that
     * merged reads `true` on both halves of this arm, which is the measurement
     * saying it is worth asserting.
     *
     * SO THE DELETION IS ASSERTED TO HAPPEN. `completionItem/resolve` is still
     * declared in this config and the client is no longer told about it -- a live
     * author-facing trap, closed as a witnessed consequence and as a sentence in
     * the README, never as a guard.
     */
    test("what the handler returns is served as written: the key it replaced and the key it removed are both withdrawn", async () => {
      const replaced = await served(runtime, "initialize-replaces-completion-provider.ts");
      const untouched = await served(runtime, "initialize-absent.ts");

      expect(replaced.capabilities.completionProvider).toEqual({
        triggerCharacters: replacedTriggerCharacters,
      });
      expect(untouched.capabilities.completionProvider).toEqual({ resolveProvider: true });
      // AND A TOP-LEVEL WITHDRAWAL, WHICH THE ARM ABOVE CANNOT SEE. The pair
      // above is satisfied by an implementation merging the prepared
      // capabilities UNDER the author's answer -- measured green -- because that
      // merge cannot reach inside the key the author replaced. `hoverProvider`
      // is a key it CAN reach, and this config declares the handler it was
      // claimed for, so a restoration here would be tsudoi advertising something
      // the author took back.
      expect(replaced.capabilities.hoverProvider).toBeUndefined();
      expect(untouched.capabilities.hoverProvider).toBe(true);
      // THE SPREAD'S OTHER HALF, asserted so the arms above cannot be read as
      // `the whole answer was replaced`: what the author did not touch is still
      // there.
      expect(replaced.capabilities.textDocumentSync).toEqual(
        untouched.capabilities.textDocumentSync,
      );
    });

    /**
     * DEEP-FROZEN, BOTH DEPTHS, IN ONE ARM -- and the target's presence is
     * asserted before either refusal, because a nested write that was SKIPPED
     * reports exactly what a shallow freeze reports.
     */
    test("an in-place edit of preparedResult is refused at both depths, and nothing moves", async () => {
      const result = await served(runtime, "initialize-mutates-prepared-result.ts");
      const report = (result as unknown as Record<string, PreparedMutationReport>)[reportKey];

      expect(report).toEqual({
        nestedTargetPresent: true,
        nestedRefused: true,
        topRefused: true,
        resolveProviderAfter: true,
        textDocumentSyncAfter: true,
      });
      // AND WHAT WAS SERVED, not only what the handler said about it: a freeze
      // that threw while the value moved cannot pass both readings.
      expect(result.capabilities.completionProvider).toEqual({ resolveProvider: true });
      expect(forgedResolveProvider).toBe(false);

      // THE CONTROL, BESIDE THE ARM AND NOT IN A REGISTRY, because it is a
      // reading of something the arm already holds. Weakened to a SHALLOW
      // `Object.freeze`, the top-level half stays refused and the nested half
      // LANDS -- which is why a single-depth arm cannot tell the two apart, and
      // why the four assertions above are one claim.
      //
      // AND ITS SUBJECT IS THE ENGINE, NOT tsudoi: this literal is built here, so
      // NO change under src/ can redden it, and the per-runtime loop runs it
      // twice against the one engine executing this suite rather than against
      // both. That is not a gap -- the arm above discriminates on its own -- but
      // it is the reason not to read a green here as covering the freeze.
      const shallow = Object.freeze({
        capabilities: { completionProvider: { resolveProvider: true } },
      });
      expect(() => {
        (shallow as { capabilities: unknown }).capabilities = {};
      }).toThrow();
      expect(() => {
        shallow.capabilities.completionProvider.resolveProvider = forgedResolveProvider;
      }).not.toThrow();
      expect(shallow.capabilities.completionProvider.resolveProvider).toBe(forgedResolveProvider);
    });

    /**
     * A HANDSHAKE THAT DOES NOT COMPLETE KILLS THE SERVER, which is the ruling
     * this arm exists for. What stood here asserted the OPPOSITE -- the next
     * request reading -32002 and a corrected `initialize` ACCEPTED -- off a
     * backwards edge whose stated reason (`InitializeError.retry` is
     * unimplementable otherwise) was measured false; the reason it was false is
     * at `endFailedHandshake` in packages/tsudoi-language-server/src/server.ts.
     *
     * NOTHING ASKS THIS SERVER TO EXIT, and that is the discriminator no code
     * carries: `exit` is never sent, so a session that merely answered an error
     * and stayed up parks here until `waitForExit` gives up. The code 1 beside it
     * is the second half -- a server may not report a handshake it never made as
     * a clean end.
     *
     * ARRIVALS WHOLE, IN ORDER, and not two independent reads: the report has to
     * be on the wire BEFORE the death, and the answer has to survive it. A run
     * that logged after answering, or that logged twice, satisfies every looser
     * reading of this.
     */
    test("a throwing handler is logged to the client at Error level, answered, and takes the process down unasked", async () => {
      const session = LspSession.start(runtime, fixture("initialize-throws.ts"));
      try {
        const handshake = session.issue("initialize", initializeParams);
        expect(await session.waitForExit()).toBe(1);

        const answered = await handshake.response;
        expect(answered.error?.code).toBe(ErrorCodes.InternalError);
        // THE AUTHOR'S OWN WORDS REACH THE CLIENT on this path, which is what
        // says tsudoi rethrew what they raised rather than inventing a sentence
        // -- the half the serialisation failure below cannot have.
        expect(answered.error?.message).toContain(handshakeFailure);

        expect(session.arrivals).toEqual([
          { kind: "notification", method: "window/logMessage" },
          { kind: "response", id: handshake.id },
        ]);
        const [logged] = session.logMessages;
        expect(logged?.type).toBe(MessageType.Error);
        expect(logged?.message).toContain("initialize handler failed");
        expect(logged?.message).toContain(handshakeFailure);

        // AND THE SAME FAILURE ON stderr, which is where a config author reads a
        // server their editor has already given up on.
        expect(session.stderr).toContain("initialize handler failed");
        expect(session.stderr).toContain(handshakeFailure);
        // STDOUT IS LSP'S BY NOW: a byte written here desyncs a real editor
        // instead of failing loudly.
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIR, and without it the arm above is satisfied by a session that
     * refuses everything: a handler that RETURNS is served, its next request is
     * answered normally, and stderr stays empty.
     */
    test("a handler that returns is served, answers its next request, and writes nothing to stderr", async () => {
      const session = LspSession.start(runtime, fixture("initialize-identity.ts"));
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);
        expect(result.serverInfo?.name).toBe("tsudoi");

        session.notify("initialized", {});
        expect(await session.request<unknown>("textDocument/hover", hoverParams)).toBeNull();

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
        expect(session.stderr).toBe("");
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE SAME ENDING FOR THE OTHER FAILURE, which is what says the two are one
     * disposition and not two that resemble each other: the arm above and this
     * one read the same list. What this path did before the stakeholder ruled on
     * it is at the serialize check in packages/tsudoi-language-server/src/server.ts.
     *
     * ITS DISCRIMINATOR IS THE DEATH NOBODY ASKED FOR, since the answer no longer
     * is one. Remove the check and vscode-jsonrpc stringifies the value itself:
     * the client is answered -32603 all the same, and the session STAYS UP with
     * the phase already moved -- so `waitForExit` is what fails, not the code.
     *
     * 1 AND NOT MERELY `NOT 0`, which is more than the ruling asked: `not 0` is
     * satisfied by a session killed by a signal, where `waitForExit` answers
     * null.
     */
    test("a handler whose answer cannot be serialised is logged to the client at Error level, answered, and the process dies", async () => {
      const session = LspSession.start(runtime, fixture("initialize-unserializable.ts"));
      try {
        const handshake = session.issue("initialize", initializeParams);
        expect(await session.waitForExit()).toBe(1);

        const answered = await handshake.response;
        expect(answered.error?.code).toBe(ErrorCodes.InternalError);
        expect(answered.error?.message).toContain(unserializableFailure);

        expect(session.arrivals).toEqual([
          { kind: "notification", method: "window/logMessage" },
          { kind: "response", id: handshake.id },
        ]);
        const [logged] = session.logMessages;
        expect(logged?.type).toBe(MessageType.Error);
        expect(logged?.message).toContain("initialize");
        expect(logged?.message).toContain(unserializableFailure);

        expect(session.stderr).toContain(unserializableFailure);
        // THE REPORT LEAVES AS A FRAMED NOTIFICATION, so this says the report
        // itself did not desync the editor it was written for.
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIR, and it is what says the check above is a CHECK rather than a
     * refusal every handshake meets: a handler whose answer serialises is served,
     * the session ends the way LSP asks, and the client is told nothing.
     *
     * SHUTDOWN-THEN-EXIT AND NOT THE BARE `exit` ITS NEIGHBOURS SEND, because
     * that is the ending which exits 0 -- with a bare one both halves of this
     * pair exit 1 and the code discriminates nothing.
     */
    test("a handler whose answer serialises is served, ends at 0, and logs nothing to the client", async () => {
      const session = LspSession.start(runtime, fixture("initialize-identity.ts"));
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);
        expect(result.serverInfo?.name).toBe("tsudoi");

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.logMessages).toEqual([]);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /** AN AWAITING HANDLER HAS ITS RESULT SERVED, and not the prepared one. */
    test("a handler that suspends before returning is the one that is answered", async () => {
      const result = await served(runtime, "initialize-async.ts");

      expect(result.serverInfo?.name).toBe(awaitedServerName);
    });

    /**
     * AN INITIALIZE HANDLER CONTRIBUTES NO CAPABILITY KEY. A config whose ONLY
     * handler is the handshake advertises what a config with NO handlers
     * advertises -- an implementation that gave the key a table row with a
     * contributor reddens here.
     */
    test("a config whose only handler is initialize advertises what a config with no methods advertises", async () => {
      const initializeOnly = await served(runtime, "initialize-only.ts");
      const noMethods = await served(runtime, "no-methods.ts");

      expect(initializeOnly).toEqual(noMethods);
    });

    /**
     * AN INITIALIZE HANDLER DISPLACES NO LIFECYCLE REFUSAL, AND THIS IS THE
     * DISCRIMINATOR. An implementation routing the key through `registerMethods`
     * would re-register `InitializeRequest.type`, and vscode-jsonrpc's
     * `onRequest` REPLACES rather than chains -- src/notifications.ts records
     * that measurement -- so `lifecycle.initializeRejection()` would be silently
     * gone while every capability arm above stayed green.
     *
     * BOTH REFUSALS IN ONE SESSION, and the pre-handshake one is read FIRST
     * because it is the half that says the gate is still in front of the table's
     * own methods as well.
     */
    test("with an initialize handler declared, a pre-handshake request is still -32002 and a second initialize still -32600", async () => {
      const session = LspSession.start(runtime, fixture("initialize-identity.ts"));
      try {
        const early = await session.requestError("textDocument/hover", hoverParams);
        expect(early.code).toBe(ErrorCodes.ServerNotInitialized);

        await session.request<InitializeResult>("initialize", initializeParams);

        const second = await session.requestError("initialize", initializeParams);
        expect(second.code).toBe(ErrorCodes.InvalidRequest);
      } finally {
        session.dispose();
      }
    });

    /**
     * TWO HANDSHAKES IN FLIGHT AT ONCE, WHICH IS WHAT THE ARM ABOVE MEASURES NONE
     * OF: it awaits the first response before sending the second, so the phase
     * has already moved by then and the refusal it reads is the one that was
     * never in doubt. MEASURED before this was written, with the second frame
     * sent while the author's handler was still suspended: BOTH handshakes were
     * served, `handshake()` ran twice from concurrent flows and the author's
     * handler ran twice, with nothing on stderr.
     *
     * THE ENTRY COUNT IS THE HALF A CODE CANNOT CARRY. A repair that SERIALISED
     * the second handshake instead of refusing it answers -32600 as well -- late,
     * once the first has moved the phase -- so a refusal alone is satisfied by an
     * implementation that still ran an author's handler twice.
     *
     * AND THE MESSAGE IS READ RATHER THAN THE CODE ALONE, because `initializing`
     * and `serving` refuse with the same -32600: a run whose second frame arrived
     * too late to race anything would be indistinguishable from this one by code,
     * and the sentence is what says the phase this repair added is the one that
     * answered.
     */
    test("a second initialize sent while the first handler is still running is refused, and the handler runs once", async () => {
      const session = LspSession.start(runtime, fixture("initialize-counts-entries.ts"));
      try {
        // NEITHER IS AWAITED BEFORE THE OTHER IS SENT. `issue` frames its message
        // synchronously, so both are on the wire before the first suspension ends.
        const first = session.issue("initialize", initializeParams);
        const second = session.issue("initialize", initializeParams);
        const [servedFirst, answeredSecond] = await Promise.all([first.response, second.response]);

        expect(servedFirst.error).toBeUndefined();
        expect((servedFirst.result as Record<string, unknown>)[entryCountKey]).toBe(1);

        expect(answeredSecond.error?.code).toBe(ErrorCodes.InvalidRequest);
        expect(answeredSecond.error?.message).toContain("already handling an initialize");
      } finally {
        session.dispose();
      }
    });
  });
}
