import { describe, expect, test } from "bun:test";
import type { InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import {
  bareItem,
  cleanupMarker as itemCleanupMarker,
} from "./fixtures/completion-yields-bare-item.ts";
import { cleanupMarker as numberCleanupMarker } from "./fixtures/completion-yields-bare-number.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * JSON-RPC's InternalError. Written out rather than imported so the wire value
 * is pinned here: an implementation that swapped the constant for another of
 * the library's would still compile.
 *
 * IT IS THE RIGHT CODE AND -32602 IS NOT, which is the ruling this whole file
 * rests on. The router answers -32602 for params that are not an object -- a
 * CLIENT fault, and something the client can fix. A batch that is not an array
 * is a CONFIG AUTHOR fault reached from a request that was perfectly well
 * formed, so telling the client its params were invalid would send the one
 * party who cannot act on it off to look at its own request.
 */
const internalError = -32603;

/** The line a config author is meant to act on -- the PREFIX, never the stack. */
const failureLine = "tsudoi: textDocument/completion handler failed:";

/**
 * The two dispatch modes, named by what the client did: a client that wants
 * partial results sends a token, one that cannot take them omits it.
 *
 * BOTH ARE DRIVEN FOR EVERY SHAPE, and that is the finding rather than
 * thoroughness for its own sake. Aggregation rejected a malformed batch only
 * INCIDENTALLY -- the spread threw -- so the two modes disagreed about the same
 * mistake, and the mode a client chooses is not something a config author can
 * see or control.
 */
const modes = [
  { name: "streaming", token: "malformed-partial-1" },
  { name: "aggregating", token: undefined },
] as const;

function completionParams(token: string | undefined): unknown {
  const params = { textDocument: { uri }, position: { line: 0, character: 0 } };
  return token === undefined ? params : { ...params, partialResultToken: token };
}

/**
 * The malformed shapes, one on each side of `Array.isArray`. Their fixtures say
 * why neither alone would do, and why a STRING is not among them.
 */
const shapes = [
  { name: "a bare item", config: "completion-yields-bare-item.ts", marker: itemCleanupMarker },
  {
    name: "a bare number",
    config: "completion-yields-bare-number.ts",
    marker: numberCleanupMarker,
  },
] as const;

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    for (const shape of shapes) {
      for (const mode of modes) {
        /**
         * WHERE THE RED IS AND WHERE IT IS NOT, recorded because the two halves
         * of this table are not equal.
         *
         * The STREAMING cell is the finding: with nothing checking the batch,
         * the value goes out verbatim as a `$/progress` whose payload is not
         * the array the protocol declares, and the request is then answered
         * `null` successfully -- a silent wire-protocol violation the client
         * has no way to report.
         *
         * The AGGREGATING cell is answered -32603 with or without the guard, by
         * `push(...batch)` throwing on something that is not iterable. It is
         * asserted anyway, as a REGRESSION LOCK rather than a red-driven claim:
         * with the guard in place the spread is not what refuses this, so
         * nothing else would notice if the spread were later replaced by a
         * plain push.
         */
        test(`${mode.name}, ${shape.name} is refused, reported, and the handler's finally runs`, async () => {
          const session = LspSession.start(runtime, fixture(shape.config));
          try {
            await session.request<InitializeResult>("initialize", initializeParams);
            session.notify("initialized", {});
            // The PAIR for the presence asserted below: nothing is reported
            // before anything has failed, so the line is evidence about THIS
            // request rather than about a server that says it on startup.
            expect(session.stderr).not.toContain(failureLine);

            const failure = await session.requestError(
              "textDocument/completion",
              completionParams(mode.token),
            );
            expect(failure.code).toBe(internalError);

            // NOTHING MALFORMED REACHED THE WIRE, which is the whole of the
            // streaming half: a `$/progress` carrying a non-array is a message
            // no client can parse against the protocol, and unlike the response
            // there is no error arm to correct it with.
            expect(session.progressCount).toBe(0);

            // Reported to the one channel a config author has. Without it the
            // client holds an internal error and the author is left with a
            // handler they cannot see fail.
            await session.waitForStderr(failureLine, 1000);
            // BOTH MODES CLOSE THE GENERATOR: the guard throws ABOVE the mode
            // split, so the author's cleanup runs whichever mode the client
            // chose. A guard applied one branch lower would leave the
            // aggregating client's handler holding whatever it opened.
            await session.waitForStderr(shape.marker, 1000);

            // The session survives what is, after all, one bad request.
            expect(await session.request<null>("shutdown", noParams)).toBeNull();
            session.notify("exit", null);
            expect(await session.waitForExit()).toBe(0);
            expect(session.unframedStdoutBytes).toBe(0);
          } finally {
            session.dispose();
          }
        });
      }
    }
    /**
     * The report NAMES THE OFFENDING VALUE, and that is the difference between
     * a diagnosis and a notification. `textDocument/completion handler failed`
     * over a stack pointing into tsudoi's own drive tells an author their
     * handler broke and nothing about which yield did it.
     *
     * THE AUTHOR'S OWN DATA IS WHAT IS ASSERTED, never tsudoi's prose: this
     * suite pins the `tsudoi:` prefix and the payload, and leaves the wording
     * between them free to be improved.
     */
    test("the report names the batch the handler actually yielded", async () => {
      const session = LspSession.start(runtime, fixture("completion-yields-bare-item.ts"));
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});

        const failure = await session.requestError(
          "textDocument/completion",
          completionParams(undefined),
        );
        expect(failure.code).toBe(internalError);
        // Serialised, not `String(...)`: `[object Object]` names nothing an
        // author could act on, and this payload is non-ASCII, so a path that
        // mangled it would say 裸の候補 in replacement characters instead.
        expect(session.stderr).toContain(JSON.stringify(bareItem));

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
