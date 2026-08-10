import { describe, expect, test } from "bun:test";
import { requestEntries } from "../packages/tsudoi-language-server/src/methods.ts";
import type { Method } from "../packages/tsudoi-language-server/src/types.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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
/** JSON-RPC's InvalidParams, pinned as a WIRE VALUE for the same reason. */
const invalidParams = -32602;

const uri = "file:///workspace/a.txt";

/**
 * One params object carrying every REQUIRED member of every row's params type,
 * so that no row is driven with something incomplete by omission: the position
 * the two positional methods read, the `options` formatting requires, the
 * `label` a CompletionItem requires, the `command` an executeCommand requires
 * and the `range` and `context` a codeAction requires.
 * Shared BECAUSE THE TESTS BELOW ARE ABOUT THE PROLOGUE, which runs
 * before any handler looks at params -- a params shape per method would be a
 * per-method copy in the tests that exist to prove per-method copies are gone.
 *
 * COMPLETENESS IS ALL IT CLAIMS, AND FOR `completionItem/resolve` IT IS NOT A
 * VALID PARAMS AT ALL. `CompletionItem.command` is a `Command` object where
 * `ExecuteCommandParams.command` is a required string, so no one object can be
 * both: MEASURED, annotating this return as the intersection is TS2322, `Type
 * 'string' is not assignable to type 'Command & string'`. UNINHABITABLE, SO
 * THERE IS NOTHING TO REPAIR -- what is chosen instead is to say so. UNSHARING
 * THE OBJECT FOR THAT ONE ROW IS THE REFUSED ALTERNATIVE: it would put a
 * per-method params shape back into the file whose subject is that per-method
 * copies are gone, and buy nothing, no arm here reading params at all.
 *
 * NOTHING ON THE WIRE VALIDATES `label` OR `command`, WHICH IS WHY NEITHER HAS
 * A COLOUR -- AND THE SAME IS TRUE OF `range` AND `context` BY THE SAME ROUTE,
 * SAID SEPARATELY BECAUSE THE MEASUREMENT BELOW WAS NEVER TAKEN ON THEM. What
 * covers those two is the argument and not a reading: no arm in this file looks
 * at params at all.
 * MEASURED for `command` rather than reasoned from `label`'s paragraph,
 * since that one was itself written from a reading: with it deleted this whole
 * file is GREEN, every arm, both runtimes, while `workspace/executeCommand` is
 * driven with its one required member missing.
 *
 * WHERE THAT ILL-FORMED `Command` ENDS UP IS NOWHERE, TODAY. No arm here
 * reaches a resolve handler with it: of the three driving
 * test/fixtures/all-methods.ts, one is refused before initialize, one is
 * cancelled in the prologue without the handler being entered, and one sends
 * params that are not an object at all. An arm that DID reach it would get the
 * member straight back -- that fixture answers resolve with what it was handed
 * -- into a response read by nothing and asserted by nothing.
 */
function paramsForAnyMethod(): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    options: { tabSize: 2, insertSpaces: true },
    label: "表",
    command: "tsudoi.表",
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    context: { diagnostics: [] },
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
 * THE COMPILER CANNOT DO THIS ONE, AND THIS TEST IS AGAIN WHAT CATCHES A
 * MIS-KEYED STREAM-DRIVEN ENTRY. A stream-driven entry cannot pin its
 * result: the protocol declares `CompletionItem[] | CompletionList | null`
 * where a tsudoi completion handler yields `CompletionItem[]`, so the slot is
 * left OPEN -- and `HoverParams` is assignable to `CompletionParams`, they
 * differing only in OPTIONAL members, so `HoverRequest.type` written into
 * completion's slot COMPILES. That is the defect this test was built for.
 *
 * AND THE COMPILER CANNOT CLOSE IT HERE, said plainly so the next reader does
 * not re-derive the pin and find out the hard way. A tsudoi completion handler
 * yields `CompletionItem[]` and nothing else, so it cannot say
 * `CompletionList`, where `CompletionRequest.type` carries the protocol's own
 * result type. MEASURED ON THIS TREE at typescript 7.0.2 / protocol 3.18.2
 * rather than taken on trust: pinning the entry gives TS2322 AT THE TABLE,
 * `Type 'CompletionList' is missing the following properties from type
 * 'CompletionItem[]'`. `StreamDrivenEntry` in
 * packages/tsudoi-language-server/src/methods.ts leaves the result open for
 * exactly that reason.
 *
 * WHAT THIS TEST SAYS THAT NO PIN EVER COULD, and it is why it would be kept
 * even if the pin came back: `type.method` IS A RUNTIME STRING, and nothing in
 * the type system reads it. A dependency that changed the method name a request
 * constant carries while leaving its types alone would pass every compile check
 * and register completion's entry under another method's name -- it reads the
 * wire name, which the type system does not.
 *
 * WHY EITHER WOULD MATTER RATHER THAN MERELY BEING UNTIDY: the router registers
 * with the entry's `type` and looks the config author's handler up BY THE KEY.
 * Disagreeing means a client's completion request runs the hover handler, or
 * reaches nothing at all -- and every capability test would stay green, since
 * capabilities are contributed by key too.
 *
 * ONE ASSERTION, EVERY ENTRY, BY CONSTRUCTION: a method joins this the moment it
 * joins the table, and no roster here has to be kept in step with one.
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
   * NOT A COUNT AND NOT AN INDEX: it says the kind is REPRESENTED, so a method
   * joining or `textDocument/completion` moving does not touch it.
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
     * hand-written rejection check left THE WHOLE SUITE green, and so did
     * deleting completion's: only hover's was defended. The remedy the PBI
     * chose is the router rather than two more hand-written assertions, so
     * this test iterates the TABLE -- a method is covered the moment it is
     * declared, which is the property, and hand-copying an assertion per
     * method would have been the convention this work exists to retire.
     *
     * WHAT IT NO LONGER SAYS ON ITS OWN, because two different answers are now
     * one answer on the wire: the fallback in
     * packages/tsudoi-language-server/src/server.ts refuses an UNREGISTERED
     * method -32002 in this phase as well, so a table entry that reached no
     * registration at all would satisfy every assertion here.
     *
     * THE HALF THAT STILL DISCRIMINATES IS THE -32800 TEST BELOW, which drives
     * the SAME table inside the serving window -- where an unregistered method
     * reads -32601 and a registered one reads -32800. Neither test measures
     * registration by itself, and deleting either leaves the other passing over
     * a method nothing serves.
     */
    test("every method in the table is refused -32002 before initialize", async () => {
      const session = LspSession.start(runtime, allMethods);
      try {
        for (const method of tableMethods()) {
          const error = await session.requestError(method, paramsForAnyMethod());

          expect(error.code).toBe(serverNotInitialized);

          // THE STEPS ARE ORDERED AND THIS IS WHAT SAYS SO. The prologue refuses
          // an unservable request BEFORE it looks at params, because a server
          // outside its serving window has no client state to answer FROM --
          // including no answer about the shape of what it was sent. Swap the
          // two guards and this reads -32602.
          const malformed = await session.requestError(method, null);

          expect(malformed.code).toBe(serverNotInitialized);
        }

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * THE PROLOGUE'S CANCELLATION STEP, FOR EVERY METHOD, BY CONSTRUCTION --
     * which is what makes a per-method residual unnecessary. `a cancelled
     * formatting request is answered -32800 through the same
     * answerUnlessCancelled` needs nothing written for formatting
     * specifically: formatting is in the table, so it is here.
     *
     * `issueThenCancel` frames the request and its `$/cancelRequest` together,
     * so the token is already cancelled when the request reaches a drive and
     * the prologue's abort read answers WITHOUT ENTERING the config's handler.
     * That is why the fixture's handlers can return immediately, and why they
     * could equally park: what is being measured is the ROUTER's decision, not
     * any handler's cooperation.
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
     * IT IS NOT A SECOND COPY OF THE TEST ABOVE. That one runs against a config
     * supplying a handler for every entry; this one supplies NO handler at all,
     * which is exactly where the two drives can disagree: a
     * stream drive returning `null` AHEAD of the epilogue answers differently
     * from an awaited-once drive that builds its context either way and answers
     * -32800. MEASURED ON THIS TREE by restoring that early return: this test
     * reddens at EVERY STREAM-DRIVEN ROW -- `textDocument/completion` and
     * `textDocument/codeAction`, both answering `undefined` where -32800 is
     * required -- and at no awaited-once one. THE READING WAS TAKEN AGAIN WHEN
     * THE SECOND STREAM ROW LANDED, having been true of completion alone and
     * silently narrower than the property it is written under.
     *
     * LSP 3.17 PERMITS EITHER ANSWER, so this pins a CHOICE rather than a
     * requirement -- the same choice `requestCancelled` in
     * packages/tsudoi-language-server/src/methods.ts is written for, made once
     * and now made for every entry.
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
        // BECAUSE WHICH METHOD DIVERGES IS THE WHOLE SUBJECT HERE: the two
        // drives disagreed about
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
     * IT IS ALSO WHAT BOUNDS PBI-40 TO ONE ANSWER AND NOT TWO. Making the
     * cancelled answer agree across the drives must leave the UNCANCELLED
     * no-handler answer where it is -- `null`, on both drives -- and answering
     * `[]` for the stream-driven rows instead reddens here.
     *
     * BORN GREEN, DECLARED. It is not a red-driven claim, and it is kept
     * because it is the only assertion that names this property for every entry
     * at once; each awaited-once row's own file carries a twin naming it for
     * that row alone.
     *
     * WHAT `null` DOES NOT ATTRIBUTE, RECORDED RATHER THAN REPAIRED. It says the
     * ROUTE answered only because this fixture
     * declares no handler for anything; against a config that DID declare one it
     * would not tell the drive's `?? null` from a handler that returned null,
     * for any row whose result type admits null. `textDocument/hover` and
     * `textDocument/formatting` have declared theirs from the start, and
     * `workspace/executeCommand` joins them through `Promise<unknown>` -- with
     * test/fixtures/all-methods.ts's handler for it answering literally
     * `Promise.resolve(null)`. THE ATTRIBUTION THAT NEEDS A HANDLER IS DONE PER
     * ROW, by an echo arm paired against its own no-handler `null` in
     * test/execute-command.test.ts, and narrowing a published result type to
     * make this arm read better is refused.
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

    /**
     * THE PROLOGUE'S PARAMS STEP, FOR EVERY METHOD, BY CONSTRUCTION.
     *
     * `"params": null` IS THE ONE MALFORMED SHAPE THAT REACHES TSUDOI AT ALL,
     * and the other two were measured rather than assumed: params OMITTED is
     * answered `defines 1 params but received none` and params BY POSITION
     * `defines parameters by name but received parameters by position`, both
     * -32602, both by vscode-jsonrpc before any handler is consulted. A
     * PRIMITIVE joins `null` in slipping through -- reading a member off `5`
     * yields `undefined` rather than throwing -- so this asserts both.
     *
     * THE MESSAGE IS ASSERTED AND NOT ONLY THE CODE, because -32602 alone is
     * satisfied by all THREE of those causes: a test reading the code would
     * stay green with tsudoi's own refusal deleted, on the strength of a
     * library check for a shape it was not sent. The text is tsudoi's, and it
     * NAMES THE METHOD, so this also says the refusal is the ROUTER'S rather
     * than one drive's -- a guard written into `driveStream` alone passes for
     * the STREAM-DRIVEN rows and reddens for every awaited-once one. Spelled by
     * the drive rather than by naming completion, which was the whole set of
     * them until this table grew a second.
     *
     * WHAT SAYS THE REFUSAL IS NOT OVER-BROAD is the rest of the suite: every
     * other session test sends a params OBJECT and expects an answer, so a
     * guard that refused those reddens in every row's own file at once. No
     * control is written here for a property every other session assertion in
     * the suite already holds.
     */
    test("every method in the table refuses params that are not an object", async () => {
      const session = LspSession.start(runtime, allMethods);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const answered: Record<string, unknown> = {};
        for (const method of tableMethods()) {
          for (const params of [null, 5]) {
            const error = await session.requestError(method, params);
            answered[`${method} ${JSON.stringify(params)}`] =
              `${String(error.code)} ${error.message}`;
          }
        }

        expect(answered).toEqual(
          Object.fromEntries(
            tableMethods().flatMap((method) =>
              [null, 5].map((params) => [
                `${method} ${JSON.stringify(params)}`,
                `${String(invalidParams)} ${method} params must be an object; received ${JSON.stringify(params)}`,
              ]),
            ),
          ),
        );

        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
