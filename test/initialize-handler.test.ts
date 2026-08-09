import { describe, expect, test } from "bun:test";
import { ErrorCodes, type InitializeResult } from "vscode-languageserver-protocol";
import { awaitedServerName } from "./fixtures/initialize-async.ts";
import {
  forgedResolveProvider,
  type PreparedMutationReport,
  reportKey,
} from "./fixtures/initialize-mutates-prepared-result.ts";
import { replacedTriggerCharacters } from "./fixtures/initialize-replaces-completion-provider.ts";
import { handshakeFailure } from "./fixtures/initialize-throws.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const hoverParams = {
  textDocument: { uri: "file:///workspace/a.txt" },
  position: { line: 0, character: 0 },
};

/** What one config is served for its handshake, with the session closed after. */
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
    test("a handler that replaces completionProvider withdraws the resolveProvider tsudoi had claimed", async () => {
      const replaced = await served(runtime, "initialize-replaces-completion-provider.ts");
      const untouched = await served(runtime, "initialize-absent.ts");

      expect(replaced.capabilities.completionProvider).toEqual({
        triggerCharacters: replacedTriggerCharacters,
      });
      expect(untouched.capabilities.completionProvider).toEqual({ resolveProvider: true });
      // THE SPREAD'S OTHER HALF, asserted so the arm above cannot be read as `the
      // whole answer was replaced`: what the author did not touch is still there.
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
     * A FAILED HANDSHAKE HANDLER LEAVES THE SESSION UNINITIALIZED AND THE PROCESS
     * ALIVE. The -32002 read is THE DISCRIMINATOR and not decoration: an
     * implementation calling `lifecycle.initialize()` before the handler leaves
     * every other assertion here green and reddens exactly there.
     *
     * THE RETRY IS THE SAME READING FROM THE OTHER SIDE: a phase that moved would
     * answer the second `initialize` -32600, so an error that is anything else
     * says the handshake is still available to a client that fixes its config.
     */
    test("a throwing handler is answered an error, leaves the next request -32002, and writes the failure to stderr", async () => {
      const session = LspSession.start(runtime, fixture("initialize-throws.ts"));
      try {
        const refusal = await session.requestError("initialize", initializeParams);
        expect(refusal.code).toBe(ErrorCodes.InternalError);

        const next = await session.requestError("textDocument/hover", hoverParams);
        expect(next.code).toBe(ErrorCodes.ServerNotInitialized);

        const retry = await session.requestError("initialize", initializeParams);
        expect(retry.code).not.toBe(ErrorCodes.InvalidRequest);

        await session.waitForStderr(handshakeFailure);
        expect(session.stderr).toContain("initialize handler failed");

        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(1);
        // STDOUT IS LSP'S BY NOW, which is the whole reason this failure is a
        // response rather than an exit: a byte written here desyncs a real editor
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
     * because it is the half that says the gate is still in front of the other
     * five as well.
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
  });
}
