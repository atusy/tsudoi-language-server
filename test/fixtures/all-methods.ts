// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, Hover, TextEdit } from "vscode-languageserver-protocol";
import type {
  Method,
  MethodHandler,
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

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
 * - delete hover's, formatting's, diagnostic's, resolve's or executeCommand's,
 *   and NO ASSERTION ABOUT WHAT THIS CONFIG SERVES MOVES;
 * - delete completion's ALONE and the session arms redden -- for a reason that
 *   is not about the handler at all. `completionItem/resolve` without
 *   `textDocument/completion` is refused at CONFIG LOAD, so this config stops
 *   loading and the session tests fail at `initialize`;
 * - delete completion's TOGETHER WITH resolve's, which is the edit that removes
 *   that load failure, and nothing about what this config serves moves either.
 *
 * ONE ARM READS THE COMPILE ERROR, WHICH IS WHY NO BULLET ABOVE SAYS `THE WHOLE
 * SUITE STAYS GREEN`. MEASURED TWICE at 4a44404, whole suite, both
 * runtimes, once with executeCommand's handler deleted and once with hover's:
 * THE SAME SINGLE ARM RED EACH TIME -- `an unbuilt
 * checkout's root type check is non-zero and names a workspace package it could
 * not resolve` in test/unbuilt-checkout.test.ts, which runs `tsc` over a staged
 * copy of this tree and reports the TS2741 AT THIS FILE. ONE ARM AND NOTHING
 * ELSE, both times. So the deletion costs an arm whose message names this file,
 * which is not the property it was reaching for and cannot be mistaken for it.
 *
 * THE PRICE IS WHAT THE ANNOTATION MOVES, NOT THE RESULT. `tsc --noEmit` fails
 * TS2741 on each of those trees, so the perturbation costs a DoD check. It is
 * the point of the line at the bottom of this file arriving as a side effect.
 *
 * SO NOTHING HERE IS DEFENDED BY ANY ASSERTION ABOUT WHAT IT ANSWERS, AND THE
 * `answered -32800 when cancelled` TEST IS NOT AN EXCEPTION: both drives answer
 * a cancelled request through the cancellation epilogue, so both answer -32800
 * whether or not this file supplies a completion handler. Deleting that handler
 * leaves that test nothing to observe.
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
 * THE REASON THEY STAY THAT WAY IS RECORDED HERE BECAUSE OTHERWISE THE NEXT
 * PERSON MEASURES THE SAME ZERO AND FILES THE SAME PBI. Defending them means
 * one test per method asserting what a handler that exists only to be routed to
 * happens to return: ONE NEAR-IDENTICAL TEST PER METHOD, a set that grows with
 * the table, each of which would redden on any legitimate change to this file
 * while defending no requirement of tsudoi's -- the pin-everything pressure S7
 * exists to bound. THE FIXTURE'S JOB IS TO EXIST AND TO ROUTE, NOT TO ANSWER.
 * And the risk this file actually carries was never a wrong answer: it is this
 * file SILENTLY STOPPING SHORT OF A METHOD, so tests that believe they exercise
 * the whole table exercise all but one of it and stay green. THAT is what the
 * line below closes, which is why closing it needed no assertion at all.
 *
 * WHAT DOES NOT DEPEND ON THIS FILE AT ALL: the no-handler half of those tests,
 * which drives test/fixtures/no-methods.ts. A method joining the table joins
 * that one by construction, because it supplies no handler for anything.
 *
 * THE HANDLERS DO NO WORK ON PURPOSE. Cancellation is observed through
 * `issueThenCancel`, which frames the request and its `$/cancelRequest`
 * together, so the token is already cancelled when the request reaches a drive
 * and the answer is decided WITHOUT ENTERING these handlers at all. A parking
 * handler per method would measure the same thing and would be one more copy of
 * the per-method shape the paragraph above refuses.
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
      // DOES NOT LOOK AT ITS PARAMS EITHER, and for the sibling reason: the
      // by-construction tests drive every method with ONE shared params object,
      // so the command name that arrives here names nothing this file could
      // recognise. What a command MEANS is asserted against
      // test/fixtures/execute-command-echo.ts instead, which is where an author
      // deciding it belongs.
      "workspace/executeCommand": () => Promise.resolve(null),
      // YIELDS NOTHING, WHICH IS THIS DRIVE'S SPELLING OF THE `null` EVERY ROW
      // ABOVE ANSWERS: this file's job is to EXIST and to ROUTE. What a code
      // action MEANS is asserted against test/fixtures/code-action.ts instead,
      // which is the file an author deciding it belongs in.
      //
      // AND IT COSTS NO `require-yield` WARNING, MEASURED RATHER THAN ASSUMED,
      // because the claim at test/fixtures/throws-on-cancel.ts depends on it:
      // that file says its warning is the suite's ONLY one, so a second yieldless
      // generator here would have falsified it. oxlint's rule wants a generator
      // whose BODY DOES SOMETHING without yielding, and this body does nothing.
      "textDocument/codeAction": async function* () {},
      // THE LINE THAT MAKES THIS FILE COMPLETE BY CONSTRUCTION. `TsudoiConfig`
      // declares `methods` PARTIAL, correctly -- a config author supplies the
      // methods they serve. This fixture is the one config that must serve them
      // ALL, and says so to the compiler instead of to a reader.
    } satisfies { [M in Method]: MethodHandler<M> },
  });
};
