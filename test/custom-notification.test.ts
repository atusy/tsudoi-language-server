import { describe, expect, test } from "bun:test";
import {
  ErrorCodes,
  type Hover,
  type InitializeResult,
  LSPErrorCodes,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  bothForms,
  noted,
  pinged,
  seenReader,
  undeclared,
} from "./fixtures/custom-method-kinds.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import {
  changedText,
  documentUri,
  openedText,
  releaseLifecycle,
} from "./fixtures/document-lifecycle-request-barrier.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/** What the reader hands back: one entry per message that reached a handler. */
interface Recorded {
  readonly method: string;
  readonly params: unknown;
}

/**
 * ONE ARM HERE CARRIES ITS RUNTIME IN ITS OWN NAME AND ITS SIBLINGS DO NOT, which
 * is the condition test/custom-notification-budget.test.ts states for its own
 * copy of this line rather than a style: a record points at that arm, and
 * MEASURED at bun 1.3.13, a `<testcase>` carries the `describe` in `classname`
 * and ONLY the `test()` string in `name` -- so two arms differing by their
 * describe alone collapse to one result in the re-running registry, last write
 * winning, and a record naming one would report whichever runtime bun wrote last.
 */
function named(runtime: { name: string }, what: string): string {
  return `${what} (${runtime.name})`;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("a cancelled document request does not remain parked behind a lifecycle hook", async () => {
      const session = LspSession.start(runtime, fixture("document-lifecycle-request-barrier.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri: documentUri,
            languageId: "typescript",
            version: 1,
            text: openedText,
          },
        });

        const pending = session.issue("textDocument/hover", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: 0 },
        });
        session.cancel(pending.id);

        expect((await pending.response).error?.code).toBe(LSPErrorCodes.RequestCancelled);
      } finally {
        session.dispose();
      }
    });

    test("a document request waits for an earlier queued change on the same URI", async () => {
      const session = LspSession.start(runtime, fixture("document-lifecycle-request-barrier.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("textDocument/didOpen", {
          textDocument: {
            uri: documentUri,
            languageId: "typescript",
            version: 1,
            text: openedText,
          },
        });
        session.notify("textDocument/didChange", {
          textDocument: { uri: documentUri, version: 2 },
          contentChanges: [{ text: changedText }],
        });

        const pending = session.issue("textDocument/hover", {
          textDocument: { uri: documentUri },
          position: { line: 0, character: 0 },
        });
        session.notify(releaseLifecycle, {});
        const hover = (await pending.response).result as Hover;

        expect(hover.contents).toEqual({ kind: "plaintext", value: changedText });
      } finally {
        session.dispose();
      }
    });

    /**
     * A NOTIFICATION HAS NO RESPONSE, so its handler running is observable only
     * through a LATER message -- which is what makes the reader request part of
     * the measurement rather than scaffolding around it.
     *
     * THE PARAMS ARE READ BACK AND NOT ONLY THE NAME, for the reason the request
     * arm gives: upstream hands a handler registered BY NAME a variable argument
     * list, so a registration reading the wrong argument records the wrong thing
     * and still records something.
     */
    test("a custom notification reaches its handler, with the params the editor sent", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        session.notify(noted, { at: "b" });
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(seen).toEqual([{ method: noted, params: { at: "b" } }]);
      } finally {
        session.dispose();
      }
    });

    /**
     * A NOTIFICATION CARRYING NO PARAMS AT ALL, AND THIS IS THE ARM THE
     * `BARE STRING` RULING RESTS ON. MEASURED in upstream's own handling: with a
     * NAME, no request or notification type is consulted and the handler is
     * simply called with no argument -- while a SYNTHESIZED `NotificationType`
     * declares one param, so the same message is logged as `defines 1 params but
     * received none` through tsudoi's stderr logger before the handler runs.
     *
     * SO BOTH HALVES ARE ASSERTED: the handler is reached, AND the session wrote
     * NO `tsudoi: ` line. Either alone is satisfied by the shape the ruling
     * refuses -- upstream's complaint is a log and not a refusal, so the handler
     * still runs under it.
     */
    test("a custom notification carrying no params reaches its handler, with nothing said about it", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        session.notify(pinged, noParams);
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(seen.map((entry) => entry.method)).toEqual([pinged]);
        expect(session.stderr).not.toContain("tsudoi: ");
      } finally {
        session.dispose();
      }
    });

    /**
     * AND NOTHING IS WRITTEN BACK FOR THE NOTIFICATION ITSELF. The arm above
     * cannot say it: a handler whose answer tsudoi also replied to would satisfy
     * it exactly, and a reply to a message carrying no id is a frame a conforming
     * client cannot dispose of.
     *
     * THE WHOLE ARRIVAL LIST IS COMPARED HERE, which the helper's own docblock
     * says an ORDERING claim should not do -- and this is not an ordering claim.
     * What is asserted is that the server SPOKE ONCE, and only the whole list can
     * say so.
     */
    test("a custom notification is answered with nothing at all", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        const handshake = await session.request<InitializeResult>("initialize", initializeParams);
        void handshake;
        const before = session.arrivals.length;

        session.notify(noted, { at: "b" });
        const { id, response } = session.issue(seenReader, {});
        await response;

        expect(session.arrivals.slice(before)).toEqual([{ kind: "response", id }]);
      } finally {
        session.dispose();
      }
    });

    /**
     * ONE NAME IN BOTH FORMS, AND TSUDOI NEVER ASKS WHICH A MESSAGE IS. The name
     * is registered on each of upstream's two handler maps -- they are separate
     * maps, so one name on both collides with nothing -- and the JSON-RPC id is
     * what picks between them, at a layer beneath tsudoi.
     *
     * THE ANSWER AND THE EFFECT ARE ONE MEASUREMENT, because either half alone is
     * satisfied by a name registered on ONE side: the request half passes with no
     * notification handler anywhere, and the notification half passes with no
     * request handler anywhere. The undeclared name below is the control that says
     * a green here is not what every name does.
     *
     * AND NOTHING GOES BACK FOR THE NOTIFICATION, read on the arrival list rather
     * than inferred: a reply to a message carrying no id is a frame a conforming
     * client cannot dispose of, and the handler answering `{ result }` is exactly
     * the state in which a router that could not tell the forms apart would send
     * one.
     */
    test("one name is answered as a request and runs as a notification, with nothing written back for the notification", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const answered = await session.request<number>(bothForms, { as: "request" });
        const before = session.arrivals.length;
        session.notify(bothForms, { as: "notification" });
        const { id, response } = session.issue(seenReader, {});
        const seen = (await response).result as Recorded[];

        expect(answered).toBe(1);
        expect(seen).toEqual([
          { method: bothForms, params: { as: "request" } },
          { method: bothForms, params: { as: "notification" } },
        ]);
        expect(session.arrivals.slice(before)).toEqual([{ kind: "response", id }]);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE CONTROL THE BOTH-FORMS ARM IS READ AGAINST, and without it that arm
     * grades nothing: `both forms reached a handler` means something only beside
     * a name for which NEITHER does, since a green there is equally what a
     * registration reaching every name whatsoever would produce.
     *
     * BOTH FORMS OF THE SAME UNDECLARED NAME, because they fail differently: the
     * request is REFUSED, where the notification is dropped in a silence that
     * looks exactly like a handler that ran and did nothing.
     */
    test("a name this config declares nowhere is reached by neither form", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        const refusal = await session.requestError(undeclared, {});
        session.notify(undeclared, { at: "nowhere" });
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(refusal.code).toBe(ErrorCodes.MethodNotFound);
        expect(seen).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE AUTHOR DECLARES NO GATE AND TSUDOI APPLIES THE LIFECYCLE ITSELF, so a
     * custom notification outside the initialized window is dropped exactly as a
     * built-in one is -- SILENTLY, there being no response through which a client
     * could be told, which is why its absence from the reader is the whole of the
     * evidence.
     *
     * TWO NAMES AND NOT ONE, because the ruling is about custom notifications as a
     * CLASS: a gate reached for one name and skipped for the next is what a single
     * arm here could not see.
     *
     * WHAT THE STATE THIS PREVENTS LOOKS LIKE is the weakening recorded against
     * this arm in test/perturbations.test.ts, so it is re-run rather than
     * described: with `always` at the gate both handlers run BEFORE the handshake,
     * against a session whose documents are empty and whose roots are null.
     */
    test(
      named(runtime, "a custom notification arriving before the handshake is dropped"),
      async () => {
        const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
        try {
          session.notify(noted, { at: "too early" });
          session.notify(pinged, { at: "too early" });

          await session.request<InitializeResult>("initialize", initializeParams);
          const seen = await session.request<Recorded[]>(seenReader, {});

          expect(seen).toEqual([]);
        } finally {
          session.dispose();
        }
      },
    );
  });
}
