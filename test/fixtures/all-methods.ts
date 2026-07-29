// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, Hover, TextEdit } from "vscode-languageserver-protocol";
import type {
  Method,
  MethodHandler,
  RequestContext,
  Tsudoi,
  TsudoiConfig,
} from "../../src/types.ts";

/**
 * A config supplying EVERY method the request table declares, with the
 * cheapest possible handler for each.
 *
 * IT EXISTS FOR THE BY-CONSTRUCTION TESTS IN test/methods-table.test.ts, which
 * iterate `requestEntries` rather than naming methods.
 *
 * WHAT OBLIGATION THAT PUTS ON THIS FILE WAS MEASURED RATHER THAN ASSUMED, AND
 * IT HAS NOW BEEN WRONG TWICE -- once by being written from expectation, and
 * once by being TRUE AND THEN OVERTAKEN. RE-MEASURED AT SPRINT 35, deleting one
 * handler at a time and reverting between, whole suite on both runtimes:
 *
 * - delete hover's, formatting's, diagnostic's or resolve's, and EVERY TEST IN
 *   THE SUITE STAYS GREEN;
 * - delete completion's ALONE and four tests redden -- for a reason that is not
 *   about the handler at all. `completionItem/resolve` without
 *   `textDocument/completion` is refused at CONFIG LOAD, so this config stops
 *   loading and the session tests fail at `initialize`;
 * - delete completion's TOGETHER WITH resolve's, which is the edit that removes
 *   that load failure, and EVERY TEST IN THE SUITE STAYS GREEN TOO.
 *
 * SO NOTHING HERE IS DEFENDED BY ANY ASSERTION ABOUT WHAT IT ANSWERS. That last
 * line reddened the `answered -32800 when cancelled` test from Sprint 32 until
 * Sprint 35, and PBI-40 is why it does not any more: the generator drive's
 * no-handler return used to sit AHEAD of the cancellation epilogue and answer
 * `null`, so removing this file's completion handler changed a cancelled
 * request's answer. That drive now answers through the epilogue like the other
 * one, both answer -32800, and the perturbation has nothing left to observe.
 *
 * A CONTROL WHOSE TARGET BEHAVIOUR AN ACCEPTED CRITERION DELIBERATELY REMOVED IS
 * NOT A DEFENCE THAT WENT MISSING, and the distinction is worth the sentence:
 * this is not a control gone quiet, and not Sprint 34's perturbation whose edit
 * grew a second half. The thing it detected was ruled a divergence and closed.
 *
 * THE HANDLERS ARE NAMED AND THE TESTS ARE NOT COUNTED, which is a correction
 * rather than a style: this block said `ALL SIX TESTS STAY GREEN` and named
 * formatting as though it were the only awaited-once handler here. Two methods
 * have joined the table since, and a count of a growing file falsifies itself
 * silently -- the exact failure the standing prose rule is about.
 *
 * WHAT THIS FIXTURE ENFORCES GREW AT SPRINT 39, AND IT IS A COMPILE-TIME
 * PROPERTY RATHER THAN AN ASSERTION: the handler literal below is checked
 * against `{ [M in Method]: MethodHandler<M> }`, so a method `MethodMap`
 * declares and this file omits IS TS2741 NAMING THE MISSING METHOD -- the same
 * error `requestEntries` produces, for the same reason and by the same
 * mechanism. THE SENTENCE THIS PARAGRAPH REPLACES IS THE ONE THAT SPRINT
 * FALSIFIED: it read `a method added to the table and not added here fails
 * NOTHING, whichever drive it uses`, which was true when written and is now
 * false by construction rather than by anyone remembering.
 *
 * MEASURED BOTH WAYS, BECAUSE `tsc` EXIT 0 PROVES NOTHING UNLESS THE SITE IS
 * REACHED: a probe method added to `MethodMap` AND to `requestEntries` -- both,
 * so the table is not itself the error -- fails TS2741 AT THIS FILE naming that
 * method; add the handler here and tsc is 0. AND THE CONTROL WAS TAKEN BEFORE
 * THE LINE EXISTED, which is what makes this a change rather than a claim: the
 * same probe against the un-annotated file left tsc at 0 WITH NO ERRORS
 * ANYWHERE. The annotation adds PRESENCE ONLY -- per-method typing was already
 * contextual through the partial and still is, measured by writing a
 * `Promise<Hover>` handler into `textDocument/completion` and watching it fail.
 *
 * WHAT IS STILL UNDEFENDED IS EVERY ANSWER, AND THAT IS NOW A RULING RATHER
 * THAN A RESIDUAL. THE PROPERTY RATHER THAN A FRACTION, because the paragraphs
 * above say why: no assertion anywhere pins what any handler in this file
 * returns -- the ones standing here today are hover, completion, formatting,
 * diagnostic and resolve -- where at Sprint 34 that could be said of the
 * awaited-once ones only.
 *
 * THE REASON THEY STAY THAT WAY IS RECORDED HERE BECAUSE OTHERWISE THE NEXT
 * PERSON MEASURES THE SAME ZERO AND FILES THE SAME PBI. Defending them means
 * one test per method asserting what a handler that exists only to be routed to
 * happens to return: FIVE NEAR-IDENTICAL TESTS that would redden on any
 * legitimate change to this file while defending no requirement of tsudoi's --
 * the pin-everything pressure S7 exists to bound. THE FIXTURE'S JOB IS TO EXIST
 * AND TO ROUTE, NOT TO ANSWER. And the risk this file actually carries was never
 * a wrong answer: it is this file SILENTLY STOPPING SHORT OF A METHOD, so tests
 * that believe they exercise five exercise four and stay green. THAT is what the
 * line below closes, which is why closing it needed no assertion at all.
 *
 * WHAT DOES NOT DEPEND ON THIS FILE AT ALL: the no-handler half of those tests,
 * which drives test/fixtures/no-methods.ts. A method joining the table joins
 * that one by construction, because it supplies no handler for anything.
 *
 * THE HANDLERS DO NO WORK ON PURPOSE. Cancellation is observed through
 * `issueThenCancel`, which frames the request and its `$/cancelRequest`
 * together, so the token is already cancelled when the handler is entered and
 * the epilogue's post-settle abort check is what answers. A parking handler per
 * method would measure the same thing and would be one more copy per method,
 * which is the shape this PBI exists to retire.
 */
export const hoverAnswer: Hover = {
  contents: { kind: "markdown", value: "表からの応答" },
};

export const completionAnswer: CompletionItem[] = [{ label: "表", detail: "from the table" }];

export const formattingAnswer: TextEdit[] = [];

/**
 * AN EMPTY FULL REPORT, NOT `null`, and the difference is the protocol's:
 * `textDocument/diagnostic` declares no null arm, so `nothing to say` is a
 * report saying the file is clean.
 */
export const diagnosticAnswer = { kind: "full" as const, items: [] };

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (): Promise<Hover> => Promise.resolve(hoverAnswer),
      "textDocument/completion": async function* (): AsyncGenerator<
        CompletionItem[],
        CompletionItem[] | null,
        void
      > {
        yield completionAnswer;
        return null;
      },
      "textDocument/formatting": (): Promise<TextEdit[]> => Promise.resolve(formattingAnswer),
      "textDocument/diagnostic": () => Promise.resolve(diagnosticAnswer),
      // Answers with what it was handed. The by-construction tests drive every
      // method with ONE shared params object, so what arrives here is not a
      // CompletionItem at all -- returning it unchanged is the only answer that
      // neither inspects it nor invents one.
      "completionItem/resolve": (_context: RequestContext, item: CompletionItem) =>
        Promise.resolve(item),
      // THE LINE THAT MAKES THIS FILE COMPLETE BY CONSTRUCTION. `TsudoiConfig`
      // declares `methods` PARTIAL, correctly -- a config author supplies the
      // methods they serve. This fixture is the one config that must serve them
      // ALL, and says so to the compiler instead of to a reader.
    } satisfies { [M in Method]: MethodHandler<M> },
  });
};
