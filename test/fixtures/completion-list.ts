// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

export const answered: CompletionItem[] = [{ label: "答え", detail: "in the answer" }];
export const firstChunk: CompletionItem[] = [{ label: "一番目", detail: "streamed first" }];
export const secondChunk: CompletionItem[] = [{ label: "二番目", detail: "streamed second" }];

/** Everything after the answer, and it says NOTHING when the stream ends. */
async function* rest(): AsyncGenerator<CompletionItem[], undefined, null> {
  yield firstChunk;
  yield secondChunk;
  // `return;` RATHER THAN `return []`, and the difference is the whole subject
  // of the test this fixture serves: `[]` is `{ isIncomplete: false, items }` by
  // the specification's own equivalence, so returning it would WITHDRAW the
  // claim the answer made. Saying nothing leaves that claim standing.
  return;
}

/** Answers a CompletionList claiming incompleteness, then streams two chunks. */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NOT COMPLETE, DELIBERATELY AND AS THE WHOLE POINT.
      // This is the only fixture in the repository that says so on the wire, and
      // it exists to defend the one rule this PBI takes from the specification
      // rather than from tsudoi: subsequent partial results ADD TO the `items`
      // property, and nothing else. `isIncomplete` must come out of the merge
      // exactly as it went in -- draining this generator proves THE STREAM
      // ended, never that THE CANDIDATE SET is final.
      //
      // THE PAYLOADS ARE MODULE CONSTANTS AND BOTH PARAMETERS ARE UNUSED, so
      // the set genuinely never changes; the `true` here is a claim this fixture
      // makes ON PURPOSE so a merge that rewrote it would be visible, not a
      // claim about the candidates.
      "textDocument/completion": (_context: RequestContext, _params: CompletionParams) =>
        Promise.resolve([{ isIncomplete: true, items: answered }, rest()] as const),
    },
  });
};
