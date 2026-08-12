import { describe, expect, test } from "bun:test";
import { ErrorCodes, type InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  flippable,
  gatedNotification,
  seenReader,
  undeclared,
  ungatedNotification,
} from "./fixtures/custom-method-kinds.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/** What the reader hands back: one entry per message that reached a handler. */
interface Recorded {
  readonly method: string;
  readonly params: unknown;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
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

        session.notify(gatedNotification, { at: "b" });
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(seen).toEqual([{ method: gatedNotification, params: { at: "b" } }]);
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

        session.notify(gatedNotification, { at: "b" });
        const { id, response } = session.issue(seenReader, {});
        await response;

        expect(session.arrivals.slice(before)).toEqual([{ kind: "response", id }]);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE KIND AN ENTRY DECLARED IS THE ONLY FORM IT ANSWERS, and this is where
     * AC1's control lands: `textDocument/didFocus` is declared a REQUEST in this
     * fixture, so the same name delivered as a notification reaches nothing.
     *
     * WHAT THE CONTROL MEASURED, flipping that one entry to `notification` and
     * reverting: this arm goes red -- the handler IS reached -- AND the request
     * form goes from `answered` to -32601, both in one edit, while the undeclared
     * name below answers -32601 and reaches nothing in BOTH states. The pair
     * moving together is what says the kind decides the registration, since the
     * request half alone is satisfied by a name registered nowhere at all.
     */
    test("a name declared as a request is reached by nothing when delivered as a notification", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);

        session.notify(flippable, { at: "wrong form" });
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(seen).toEqual([]);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE THIRD ARM AC1's CONTROL IS READ AGAINST, and without it the control
     * grades nothing: flipping a declared kind leaves the request unanswered, but
     * SO DOES A NAME REGISTERED NOWHERE -- upstream answers MethodNotFound in
     * both -- so the red the flip produces means something only beside this.
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
     * THE GATE DOES WHAT THE AUTHOR DECLARED, and both directions in ONE session
     * because that is what says the gate is read PER ENTRY: a router that dropped
     * everything, or gated nothing, satisfies one arm and not this pair.
     *
     * BOTH ARE SENT BEFORE `initialize`, which is the only moment the two gates
     * differ. A `lifecycle` message there is dropped SILENTLY -- there is no
     * response through which a client could be told -- so its absence from the
     * reader is the whole of the evidence.
     */
    test("a lifecycle-gated custom notification is dropped before the handshake, and an always-gated one is not", async () => {
      const session = LspSession.start(runtime, fixture("custom-method-kinds.ts"));
      try {
        session.notify(gatedNotification, { at: "too early" });
        session.notify(ungatedNotification, { at: "any time" });

        await session.request<InitializeResult>("initialize", initializeParams);
        const seen = await session.request<Recorded[]>(seenReader, {});

        expect(seen).toEqual([{ method: ungatedNotification, params: { at: "any time" } }]);
      } finally {
        session.dispose();
      }
    });
  });
}
