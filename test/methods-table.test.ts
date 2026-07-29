import { describe, expect, test } from "bun:test";
import { requestEntries } from "../src/methods.ts";
import type { Method } from "../src/types.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const allMethods = fixture("all-methods.ts");
const noMethods = fixture("no-methods.ts");

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
 * What EVERY method in the table is expected to answer, as one object to
 * compare a whole run against. Built from the table for the same reason the
 * loops are: a method joining it joins this the moment it is declared.
 */
function codeForEveryMethod(answer: unknown): Record<string, unknown> {
  return Object.fromEntries(tableMethods().map((method) => [method, answer]));
}

/**
 * THE COMPILER CANNOT DO THIS ONE, WHICH IS WHY IT IS A TEST.
 *
 * MEASURED at vscode-languageserver-protocol 3.18.2: a stream-driven entry
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

  /**
   * THE SAME PRESENCE ASSERTION, FOR THE OTHER LOOP THAT COULD GO GREEN ON
   * NOTHING. The no-handler tests below iterate the table and say what a
   * cancelled request is answered WHICHEVER DRIVE the method uses -- and every
   * one of them would pass on a table with no stream-driven entry in it,
   * while measuring nothing at all about the drive whose answer this is about.
   *
   * NOT A COUNT AND NOT AN INDEX: it says the kind is REPRESENTED, so a sixth
   * method joining or `textDocument/completion` moving does not touch it.
   */
  test("the table declares a stream-driven entry, so the drives below are both exercised", () => {
    const drives = Object.values(requestEntries).map((entry) => entry.drive);

    expect(drives).toContain("stream-driven");
    expect(drives).toContain("awaited-once");
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

    /**
     * THE SAME STEP FOR A CONFIG THAT SUPPLIES NOTHING, and it is the whole of
     * PBI-40: a cancelled request is answered -32800 WHICHEVER DRIVE its method
     * uses, whether or not the config can answer it.
     *
     * IT IS NOT A SECOND COPY OF THE TEST ABOVE. That one drives handlers and
     * measures the epilogue's post-settle abort check; this one drives NO
     * handler at all, which is the case the two drives used to disagree about
     * -- the stream drive returned `null` ahead of the epilogue where the
     * awaited-once drive built its context either way and answered -32800.
     * MEASURED at Sprint 32 by P-D, RE-MEASURED at Sprint 35 by restoring that
     * early return: this test reddens at `textDocument/completion` and at no
     * other method.
     *
     * LSP 3.17 PERMITS EITHER ANSWER, so this pins a CHOICE rather than a
     * requirement -- the same choice `requestCancelled` in src/methods.ts is
     * written for, made once and now made for every entry.
     */
    test("every method in the table is answered -32800 when cancelled with no handler", async () => {
      const session = LspSession.start(runtime, noMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered: Record<string, unknown> = {};
        for (const method of tableMethods()) {
          const inFlight = session.issueThenCancel(method, paramsForAnyMethod());
          const message = await inFlight.response;
          answered[method] = message.error?.code;
        }

        // EVERY METHOD IS COMPARED AT ONCE, NOT ONE ASSERTION PER ITERATION,
        // AND THAT IS THIS TEST'S NEED RATHER THAN A RULE FOR THE FILE -- the
        // test above keeps the per-iteration form and is right to. WHICH METHOD
        // DIVERGES IS THE WHOLE SUBJECT HERE: the two drives disagreed about
        // exactly this answer, so a failure that printed -32800 against
        // undefined without naming the method would report the divergence
        // without saying where it is. The expected side is built from the
        // table, so this stays one assertion covering every entry.
        expect(answered).toEqual(codeForEveryMethod(requestCancelled));

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE CONTROL FOR THE TEST ABOVE, and without it that -32800 is a claim
     * about a config nobody checked was loading: the same handler-less config,
     * the same params, NOT cancelled, answers `null` for every entry. So the
     * error code up there is attributable to CANCELLATION rather than to a
     * fixture that failed to load or a method that refused.
     *
     * IT IS ALSO WHAT SAYS PBI-40 CHANGED ONE ANSWER AND NOT TWO. Making the
     * cancelled answer agree across the drives must leave the UNCANCELLED
     * no-handler answer exactly where it was -- `null`, on both drives -- and
     * answering `[]` for the stream-driven one instead reddens here.
     *
     * BORN GREEN, DECLARED. Nothing about it could fail before the change that
     * made the test above pass, and it is kept because it is the only assertion
     * that names this property for every entry at once; the per-method twins in
     * hover, formatting, diagnostic and resolve's files each name one.
     */
    test("every method in the table is answered null with no handler and no cancellation", async () => {
      const session = LspSession.start(runtime, noMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered: Record<string, unknown> = {};
        for (const method of tableMethods()) {
          answered[method] = await session.request<unknown>(method, paramsForAnyMethod());
        }

        expect(answered).toEqual(codeForEveryMethod(null));

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
