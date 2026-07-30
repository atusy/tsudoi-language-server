// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, Hover, TextEdit } from "vscode-languageserver-protocol";
import type { Method, MethodHandler, RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * A config supplying EVERY method the request table declares, with the
 * cheapest possible handler for each.
 *
 * IT EXISTS FOR THE BY-CONSTRUCTION TESTS IN test/methods-table.test.ts, which
 * iterate `requestEntries` rather than naming methods.
 *
 * WHAT OBLIGATION THAT PUTS ON THIS FILE IS MEASURED RATHER THAN ASSUMED, and
 * writing it from expectation is how it comes out wrong. MEASURED by deleting
 * one handler at a time and reverting between, whole suite on both runtimes:
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
 * THOSE DELETIONS DO NOT TYPE-CHECK, AND THE MEASUREMENT ABOVE HOLDS ANYWAY --
 * said here rather than left for whoever tries to repeat it, because the two
 * are easy to confuse. RE-RUN on the two bullets that carry information rather
 * than on all four: hover's handler deleted leaves the suite at 444 GREEN, and
 * completion's deleted ALONE still reddens FOUR on both runtimes -- the second
 * is the one worth spending a run on, being the only bullet whose recorded
 * result is not `green`. The other two follow from the first, which establishes
 * the mechanism: NEITHER RUNTIME TYPE-CHECKS, so a compile error changes
 * nothing a test can see.
 *
 * THE PRICE IS WHAT THE ANNOTATION MOVES, NOT THE RESULT. `tsc --noEmit` fails
 * TS2741 on each of those trees, so the perturbation costs a DoD check. IT IS
 * STILL PERFECTLY WRITABLE AND ITS RESULT STILL STANDS -- this is neither a
 * measurement gone stale nor a perturbation gone unconstructible, and it is not
 * one of the four outcomes either, since those answer why a standing re-run
 * goes GREEN and these go exactly as recorded. It is the point of the line at
 * the bottom of this file arriving as a side effect.
 *
 * SO NOTHING HERE IS DEFENDED BY ANY ASSERTION ABOUT WHAT IT ANSWERS, AND THE
 * `answered -32800 when cancelled` TEST IS NOT AN EXCEPTION: both drives answer
 * a cancelled request through the cancellation epilogue, so both answer -32800
 * whether or not this file supplies a completion handler. Deleting that handler
 * leaves that test nothing to observe.
 *
 * A CONTROL WITH NO TARGET BEHAVIOUR LEFT TO DETECT IS NOT A DEFENCE THAT WENT
 * MISSING, and the distinction is worth the sentence: the behaviour that
 * perturbation would catch is DELIBERATELY ABSENT under an accepted criterion,
 * so this is not a control gone quiet and not a perturbation whose edit needs a
 * second half.
 *
 * THE HANDLERS ARE NAMED AND THE TESTS ARE NOT COUNTED, which is a rule rather
 * than a style: the request table grows, and a count of a growing file
 * falsifies itself silently -- the exact failure the standing prose rule is
 * about.
 *
 * WHAT THIS FIXTURE ENFORCES IS A COMPILE-TIME PROPERTY RATHER THAN AN
 * ASSERTION: the handler literal below is checked against
 * `{ [M in Method]: MethodHandler<M> }`, so a method `MethodMap` declares and
 * this file omits IS TS2741 NAMING THE MISSING METHOD -- the same error
 * `requestEntries` produces, for the same reason and by the same mechanism. A
 * METHOD ADDED TO THE TABLE AND NOT ADDED HERE THEREFORE FAILS SOMETHING,
 * whichever drive it uses, and it fails BY CONSTRUCTION rather than by anyone
 * remembering to check.
 *
 * MEASURED BOTH WAYS, BECAUSE `tsc` EXIT 0 PROVES NOTHING UNLESS THE SITE IS
 * REACHED: a probe method added to `MethodMap` AND to `requestEntries` -- both,
 * so the table is not itself the error -- fails TS2741 AT THIS FILE naming that
 * method; add the handler here and tsc is 0. AND THE ANNOTATION IS WHAT DOES
 * IT, which is what makes this a property of this line rather than of the
 * table: strip the `satisfies` clause and the same probe leaves tsc at 0 WITH
 * NO ERRORS ANYWHERE. The annotation adds PRESENCE ONLY -- per-method typing is
 * contextual through the partial with or without it, measured by writing a
 * `Promise<Hover>` handler into `textDocument/completion` and watching it fail.
 *
 * WHAT IS UNDEFENDED IS EVERY ANSWER, AND THAT IS A RULING RATHER THAN A
 * RESIDUAL. THE PROPERTY RATHER THAN A FRACTION, because the paragraphs above
 * say why: no assertion anywhere pins what any handler in this file returns --
 * hover's, completion's, formatting's, diagnostic's and resolve's alike.
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
 * method would measure the same thing and would be one more copy per method --
 * THE PER-METHOD COPY, which is the shape the five-tests paragraph above
 * refuses and refuses here for the same reason.
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

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": (): Promise<Hover> => Promise.resolve(hoverAnswer),
      // COMPLETENESS RULING: COMPLETE, and said deliberately rather than left
      // to the default. The specification treats a supplied `CompletionItem[]`
      // as identical to `{ isIncomplete: false, items }`, so aggregating this
      // handler asserts that the candidate set is final whether or not anyone
      // chooses it. IT IS TRUE HERE: `completionAnswer` is a module constant and
      // THIS HANDLER TAKES NO PARAMETERS AT ALL, so no prefix, position or
      // document can reach it. A re-query on the next keystroke would produce
      // the identical single item, which is exactly what `do not re-query`
      // means.
      "textDocument/completion": async function* () {
        yield completionAnswer;
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
