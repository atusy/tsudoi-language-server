import { describe, expect, test } from "bun:test";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { shown } from "./fixtures/notify.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const notifying = fixture("notify.ts");
/** A config whose handler says nothing, for the half that says the send is the config's. */
const silent = fixture("hover-fixed.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

function hoverParams(): unknown {
  return { textDocument: { uri }, position: { line: 0, character: 0 } };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * WHAT THE AUTHOR SENT REACHES THE CLIENT, METHOD AND PARAMS BOTH, and the
     * params are asserted WHOLE: tsudoi neither validates a notification nor
     * reshapes one, so an implementation that re-encoded it through a shape of
     * its own reddens here where a method-name check would not.
     *
     * AND THE ORDER IS ASSERTED BESIDE IT, which is the half a content check
     * cannot see: the notification must arrive BEFORE the response, since the
     * handler awaited the send before returning. A server that queued sends
     * until its answer had gone satisfies every assertion about content.
     */
    test(`a handler's notification reaches the client, before its own answer (${runtime.name})`, async () => {
      const session = LspSession.start(runtime, notifying);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        // TAKEN BEFORE THE REQUEST, because the handshake's own response is an
        // arrival too and a claim about `arrivals` WHOLE would be a claim about
        // the handshake as much as about this.
        const before = session.arrivals.length;
        const answered = await session.request<{ contents: unknown }>(
          "textDocument/hover",
          hoverParams(),
        );

        expect(session.notifications).toEqual([{ method: "window/showMessage", params: shown }]);
        expect(answered.contents).toEqual({ kind: "plaintext", value: "答え" });
        // THE ORDER, READ OFF THE ARRIVALS RATHER THAN INFERRED: the two lists
        // are recorded from the same stream, so a notification that arrived
        // after the response appears after it here.
        expect(session.arrivals.slice(before).map((arrival) => arrival.kind)).toEqual([
          "notification",
          "response",
        ]);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PAIRED DIRECTION, and without it the arm above is a claim about a
     * SERVER that might send that for anybody: the same request against a config
     * whose handler notifies nothing puts nothing on the notification channel,
     * so what arrived up there is attributable to the author's call.
     */
    test(`a config that notifies nothing sends nothing (${runtime.name})`, async () => {
      const session = LspSession.start(runtime, silent);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});
        await session.request("textDocument/hover", hoverParams());

        expect(session.notifications).toEqual([]);

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
