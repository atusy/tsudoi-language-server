import { describe, expect, test } from "bun:test";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "../helpers/lsp.ts";
import { requireRuntime } from "../helpers/preflight.ts";
import { fixture } from "../helpers/spawn.ts";
import { type Ask, asking } from "../fixtures/request.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

const requesting = fixture("request.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * LSP's RequestCancelled, written out rather than imported for the reason
 * tests/e2e/cancellation.test.ts gives: the wire value is the claim.
 */
const requestCancelled = -32800;

async function started(runtime: (typeof runtimes)[number]): Promise<LspSession> {
  const session = LspSession.start(runtime, requesting);
  await session.request("initialize", initializeParams);
  session.notify("initialized", {});
  return session;
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * WHAT THE AUTHOR SENT REACHES THE CLIENT, METHOD AND PARAMS WHOLE, AND WHAT
     * THE CLIENT ANSWERED REACHES THE AUTHOR WHOLE: tsudoi reshapes neither, so
     * a translation through a shape of its own reddens here.
     */
    test(`a handler's request reaches the client, and the answer reaches the handler (${runtime.name})`, async () => {
      const session = await started(runtime);
      try {
        const params = { items: [{ section: "tsudoi" }], nested: { list: [1, "two", null] } };
        session.answerServerRequest = () => ({ result: [{ answer: 42 }] });

        const outcome = await session.request<unknown>(asking, {
          method: "client/ask",
          params,
        } satisfies Ask);

        expect(session.serverRequests.map(({ method, params }) => ({ method, params }))).toEqual([
          { method: "client/ask", params },
        ]);
        expect(outcome).toEqual({ answered: [{ answer: 42 }] });
      } finally {
        session.dispose();
      }
    });

    /**
     * OMITTED PARAMS ARE ABSENT FROM THE FRAME, NOT `null` AND NOT `[null]`,
     * which is the one spelling JSON-RPC permits for "no params" -- and the one
     * upstream's connection does not produce if the argument is passed at all.
     */
    test(`a request without params carries no params member (${runtime.name})`, async () => {
      const session = await started(runtime);
      try {
        session.answerServerRequest = () => ({ result: null });

        const outcome = await session.request<unknown>(asking, {
          method: "client/ask",
        } satisfies Ask);

        expect(session.serverRequests).toHaveLength(1);
        expect(Object.hasOwn(session.serverRequests[0]!, "params")).toBe(false);
        expect(outcome).toEqual({ answered: null });
      } finally {
        session.dispose();
      }
    });

    /**
     * THE CLIENT'S ERROR IS WHAT THE HANDLER CATCHES, AS THE TYPE THE
     * DOCUMENTATION NAMES, with the code and data the client chose -- what an
     * author branches on, and what a rejection re-worded by tsudoi would lose.
     */
    test(`a client's error reaches the handler as a ResponseError (${runtime.name})`, async () => {
      const session = await started(runtime);
      try {
        const error = {
          code: -32803,
          message: "declined",
          data: { reason: "declined by the client" },
        };
        session.answerServerRequest = () => ({ error });

        const outcome = await session.request<unknown>(asking, {
          method: "client/ask",
          params: {},
        } satisfies Ask);

        expect(outcome).toEqual({ rejected: error });
      } finally {
        session.dispose();
      }
    });

    /**
     * CANCELLING THE OUTER REQUEST WITHDRAWS THE INNER ONE BY ITS OWN ID, AND
     * THE OUTER ONE IS ANSWERED WITHOUT THE CLIENT EVER ANSWERING THE INNER.
     *
     * THE SECOND HALF IS THE DISCRIMINATING ONE: the inner request is left
     * unanswered for good, so a `request` that waited for the client to confirm
     * the cancellation would park the handler, and the outer -32800 would never
     * arrive.
     */
    test(`cancelling the handler's request cancels the client request it is waiting on (${runtime.name})`, async () => {
      const session = await started(runtime);
      try {
        const outer = session.issue(asking, { method: "client/ask", params: {} } satisfies Ask);
        await session.waitForServerRequests(1);
        const inner = session.serverRequests[0]!;

        session.cancel(outer.id);
        const response = await outer.response;

        expect(response.error?.code).toBe(requestCancelled);
        expect(session.notifications).toContainEqual({
          method: "$/cancelRequest",
          params: { id: inner.id },
        });
      } finally {
        session.dispose();
      }
    });
  });
}
