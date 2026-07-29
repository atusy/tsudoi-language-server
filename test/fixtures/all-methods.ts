// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, Hover, TextEdit } from "vscode-languageserver-protocol";
import type { Tsudoi, TsudoiConfig } from "../../src/types.ts";

/**
 * A config supplying EVERY method the request table declares, with the
 * cheapest possible handler for each.
 *
 * IT EXISTS FOR THE BY-CONSTRUCTION TESTS IN test/methods-table.test.ts, which
 * iterate `requestEntries` rather than naming methods.
 *
 * WHAT OBLIGATION THAT PUTS ON THIS FILE WAS MEASURED RATHER THAN ASSUMED, AND
 * THE FIRST ANSWER WRITTEN HERE WAS WRONG. It said a method added to the table
 * and not added here makes those tests fail. THAT IS TRUE OF ONE DRIVE ONLY.
 * Measured, by deleting one handler at a time and running the file:
 *
 * - delete the GENERATOR-DRIVEN handler (completion) and the -32800 test
 *   REDDENS on both runtimes;
 * - delete an AWAITED-ONCE handler (formatting) and ALL SIX TESTS STAY GREEN.
 *
 * THE CAUSE IS A REAL DIVERGENCE BETWEEN THE TWO DRIVES, and it is recorded at
 * `driveGenerator` in src/methods.ts rather than only here: the generator
 * drive's no-handler early return sits AHEAD of the cancellation epilogue, so a
 * cancelled request to a generator-driven method with no handler is answered
 * NULL, while the awaited-once drive reaches the epilogue either way and
 * answers -32800.
 *
 * SO THE HONEST STATEMENT OF WHAT THIS FIXTURE ENFORCES: a GENERATOR-DRIVEN
 * method added to the table and not added here fails the suite loudly. An
 * awaited-once one does not, and a reader assuming otherwise would credit these
 * tests with a completeness they do not have.
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
    },
  });
};
