import { describe, expect, test } from "bun:test";
import { requestEntries } from "../src/methods.ts";
import type { Method } from "../src/types.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const allMethods = fixture("all-methods.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * LSP's ServerNotInitialized and RequestCancelled. Written out rather than
 * imported so the WIRE VALUES are pinned here: an implementation that swapped
 * either constant for another of the library's codes would still compile.
 */
const serverNotInitialized = -32002;
const requestCancelled = -32800;

const uri = "file:///workspace/a.txt";

/**
 * One params object every method in the table accepts on the wire: the
 * position the two positional methods read, the `options` formatting requires,
 * and the `label` a CompletionItem requires. Shared BECAUSE THE TESTS BELOW ARE
 * ABOUT THE PROLOGUE, which runs before any handler looks at params -- a params
 * shape per method would be a per-method copy in the tests that exist to prove
 * per-method copies are gone.
 *
 * `label` JOINED IT AT SPRINT 34 AND NOT BECAUSE ANYTHING FAILED WITHOUT IT.
 * `completionItem/resolve` takes a CompletionItem rather than a document and a
 * position, and `label` is its one required member -- nothing on the wire
 * validates that, so omitting it would have left the sentence above FALSE while
 * every test here stayed green. It is here to keep the claim true, which is the
 * only reason it needs.
 */
function paramsForAnyMethod(): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    options: { tabSize: 2, insertSpaces: true },
    label: "表",
  };
}

function tableMethods(): Method[] {
  return Object.keys(requestEntries) as Method[];
}

/**
 * THE COMPILER CANNOT DO THIS ONE, WHICH IS WHY IT IS A TEST.
 *
 * MEASURED at vscode-languageserver-protocol 3.18.2: a generator-driven entry
 * cannot pin its result -- the protocol declares `CompletionItem[] |
 * CompletionList | null` where a tsudoi generator returns `CompletionItem[] |
 * null` -- so its `type` slot is left open, and `HoverParams` is assignable to
 * `CompletionParams` because they differ only in OPTIONAL members. The upshot
 * is that `HoverRequest.type` written into completion's slot COMPILES.
 *
 * WHY THAT WOULD MATTER RATHER THAN MERELY BEING UNTIDY: the router registers
 * with the entry's `type` and looks the config author's handler up BY THE KEY.
 * Disagreeing means a client's completion request runs the hover handler, or
 * reaches nothing at all -- and every capability test would stay green, since
 * capabilities are contributed by key too.
 *
 * ONE ASSERTION, EVERY ENTRY, BY CONSTRUCTION: a fourth method joins this the
 * moment it joins the table.
 */
describe("the request table", () => {
  test("every entry's key is its own request type's method", () => {
    for (const [method, entry] of Object.entries(requestEntries)) {
      expect(entry.type.method).toBe(method);
    }
  });

  // A count would silently pass on an EMPTY table, which is the one way the
  // loop above measures nothing. It is the paired presence assertion S6 asks
  // for, applied to an iteration rather than to an absence.
  test("the table is not empty, so the loop above is iterating something", () => {
    expect(tableMethods().length).toBeGreaterThan(0);
  });
});

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE PROLOGUE'S REJECTION STEP, FOR EVERY METHOD, BY CONSTRUCTION.
     *
     * THIS IS WHAT THE READINESS GATE FOUND MISSING. Deleting formatting's
     * hand-written rejection check left all 399 tests green, and so did
     * deleting completion's: only hover's was defended. The remedy the PBI
     * chose is the router rather than two more hand-written assertions, so
     * this test iterates the TABLE -- a fourth method is covered the moment it
     * is declared, which is the property, and hand-copying an assertion per
     * method would have been the convention this work exists to retire.
     */
    test("every method in the table is refused -32002 before initialize", async () => {
      const session = LspSession.start(runtime, allMethods);
      try {
        for (const method of tableMethods()) {
          const error = await session.requestError(method, paramsForAnyMethod());

          expect(error.code).toBe(serverNotInitialized);
        }

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PROLOGUE'S CANCELLATION STEP, FOR EVERY METHOD, BY CONSTRUCTION --
     * and this is the assertion Sprint 31 recorded as owed. Its residual was
     * `a cancelled formatting request is answered -32800 through the same
     * answerUnlessCancelled and nothing asserts it`. Nothing had to be written
     * for formatting specifically; formatting is in the table, so it is here.
     *
     * `issueThenCancel` frames the request and its `$/cancelRequest` together,
     * so the handler is entered with an already-cancelled token and the
     * epilogue's post-settle abort check is what answers. That is why the
     * fixture's handlers can return immediately: what is being measured is the
     * ROUTER's epilogue, not any handler's cooperation.
     */
    test("every method in the table is answered -32800 when cancelled", async () => {
      const session = LspSession.start(runtime, allMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        for (const method of tableMethods()) {
          const inFlight = session.issueThenCancel(method, paramsForAnyMethod());
          const message = await inFlight.response;

          expect(message.error?.code).toBe(requestCancelled);
        }

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
