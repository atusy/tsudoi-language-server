import { describe, expect, test } from "bun:test";
import {
  ErrorCodes,
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { echoMark } from "./fixtures/custom-method-echo.ts";
import { answersNothing } from "./fixtures/custom-method-answers-nothing.ts";
import { nullAnswering } from "./fixtures/custom-method-answers-null.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * Advertised for EVERY config, so it stands in the exact-equality pin below and
 * is not evidence about the fixture driving it. Why tsudoi claims it
 * unconditionally is at the capabilities literal in
 * packages/tsudoi-language-server/src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE HANDLER RAN AND ITS OWN ANSWER REACHED THE CLIENT. tsudoi keeps no
     * record of a custom method and could not have written this: the mark comes
     * out of the config author's file, and the params come back out of the
     * message the editor sent, so a registration that dropped either reddens
     * here.
     *
     * THE PARAMS ARE ASSERTED AND NOT ONLY THE MARK, because upstream hands a
     * handler registered BY NAME a variable argument list -- there is no
     * `RequestType` to say how many params the method takes -- and an
     * implementation reading the wrong argument answers with the CANCELLATION
     * TOKEN in the params slot and still carries the mark.
     */
    test("a custom request reaches its handler, with the params the editor sent", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-echo.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const answer = await session.request<{ mark: string; params: unknown }>(
          "textDocument/didFocus",
          { textDocument: { uri: "file:///w/a.txt" } },
        );

        expect(answer.mark).toBe(echoMark);
        expect(answer.params).toEqual({ textDocument: { uri: "file:///w/a.txt" } });
      } finally {
        session.dispose();
      }
    });

    /**
     * A REQUEST CARRYING NO PARAMS AT ALL, and this is the branch that fails
     * SILENTLY AND WRONGLY rather than loudly: upstream calls a handler
     * registered BY NAME with the CANCELLATION TOKEN as its only argument when
     * the message carries no params -- there being no request type to say how
     * many it takes -- so a reading that took the first argument unconditionally
     * hands a config author the token in the params slot. It has a `_type` and an
     * `isCancellationRequested`, so it is object-shaped and survives every guard
     * a handler is likely to write.
     *
     * THE MARK IS ASSERTED BESIDE THE ABSENCE, because an answer that failed to
     * arrive at all has no `params` either.
     */
    test("a custom request carrying no params hands its handler none, and not the token", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-echo.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const answer = await session.request<{ mark: string; params: unknown }>(
          "textDocument/didFocus",
          noParams,
        );

        expect(answer.mark).toBe(echoMark);
        expect(answer.params).toBeUndefined();
      } finally {
        session.dispose();
      }
    });

    /**
     * AND A CUSTOM REQUEST IS UNDER THE LIFECYCLE LIKE EVERY OTHER ONE. Deleting
     * the refusal from the registration reddens this and NOTHING else in the
     * suite: every other arm here holds the handshake first, so the branch would
     * ship uncovered and a client's pre-handshake request would reach a config
     * author's handler against a session whose documents are empty and whose
     * roots are null.
     *
     * THE CODE IS ASSERTED AND NOT MERELY A FAILURE: a name registered nowhere is
     * refused too, with MethodNotFound, so an arm reading `it failed` cannot tell
     * the lifecycle from a registration that never happened.
     */
    test("a custom request arriving before the handshake is refused by the lifecycle", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-answers-null.ts"));
      try {
        const refusal = await session.requestError(nullAnswering, {});

        expect(refusal.code).toBe(ErrorCodes.ServerNotInitialized);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE RAW RESPONSE AND NOT A HELPER'S READING OF IT, which is what makes this
     * pair mean anything: `request` rejects on an error and `requestError`
     * rejects on a result, so either one alone would turn the distinction under
     * test into the helper's own verdict. What is asserted is the MESSAGE.
     *
     * `result: null` WITH NO `error` AT ALL. Both halves: a response carrying a
     * null result and an error is not what a handler that answered null earns.
     */
    test("a handler answering { result: null } yields a null result and no error", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-answers-null.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const { response } = session.issue(nullAnswering, {});
        const message = await response;

        expect(message.result).toBeNull();
        expect(message.error).toBeUndefined();
      } finally {
        session.dispose();
      }
    });

    /**
     * AND THE ARM THE ONE ABOVE CANNOT BE. Falling off the end is a HANDLER
     * FAILURE, taking the route a throwing handler already takes: the method is
     * named on stderr and the client is answered an error.
     *
     * MEASURED, THE IMPLEMENTATION THAT SENDS THE HANDLER'S RETURN BARE -- no
     * wrapper, the answer passed straight through: upstream turns an `undefined`
     * return into a null result, so THIS ARM AND THE ONE ABOVE BECOME THE SAME
     * TWO MESSAGES ON THE WIRE and this pair is the whole of what tells them
     * apart.
     *
     * THE METHOD NAME IS ASSERTED ON STDERR rather than merely a failure: an
     * author with several custom methods is told which of them answered nothing.
     */
    test("a handler answering nothing is a failure, named on stderr and answered as an error", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-answers-nothing.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const { response } = session.issue(answersNothing, {});
        const message = await response;

        expect(message.error).toBeDefined();
        expect(message.result).toBeUndefined();
        await session.waitForStderr(`tsudoi: ${answersNothing}`);
      } finally {
        session.dispose();
      }
    });

    /**
     * REGISTERING A CUSTOM METHOD ADVERTISES NOTHING, which is the first thing an
     * author will file as a bug and is therefore worth an arm rather than a
     * sentence: `initialize` has no capability to claim for
     * `textDocument/didFocus`, so no client sends one unless it already knew to.
     *
     * EXACT EQUALITY ON THE WHOLE OBJECT rather than an absence check on one key:
     * an implementation that synthesised a capability from the custom name --
     * `experimental`, a provider flag, anything -- reddens on the object, where a
     * read of one key it did not invent would not.
     *
     * THE FIXTURE DECLARES NOTHING ELSE, so what is left is exactly what tsudoi
     * advertises for a config that answers nothing at all.
     */
    test("a config whose only handler is a custom method advertises nothing for it", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-answers-null.ts"));
      try {
        const result = await session.request<InitializeResult>("initialize", initializeParams);

        expect(result.capabilities).toEqual({ textDocumentSync, workspace });
      } finally {
        session.dispose();
      }
    });
  });
}
