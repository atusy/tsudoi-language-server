// Relative with .ts, and Bun-free: deno executes this file too.
import type { CompletionItem, CompletionParams } from "vscode-languageserver-protocol";
import type { RequestContext, TsudoiConfig } from "../../src/types.ts";

/**
 * The expensive half a config author fills in ONLY when the editor asks: the
 * completion below emits a bare label, and the detail is computed here.
 *
 * DERIVED FROM THE ITEM RATHER THAN FIXED, and that is the whole reason this
 * fixture is shaped this way. A handler returning its argument unchanged is
 * INDISTINGUISHABLE from a tsudoi that echoed the request's params without
 * calling any handler at all -- both produce exactly what the client sent. A
 * value computed from the incoming label separates them, because only a real
 * call can produce it.
 */
export const detailPrefix = "解決済み: ";

/** What the completion half offers, deliberately WITHOUT a detail. */
export const bareItem: CompletionItem = { label: "第一候補" };

export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      // Present because resolve REQUIRES it: a config supplying
      // completionItem/resolve without textDocument/completion is refused at
      // config load. It is also the honest shape of the story -- the list stays
      // cheap, and the expensive half arrives only for the item the user looks
      // at.
      "textDocument/completion": async function* (
        _context: RequestContext,
        _params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        yield [bareItem];
        return null;
      },
      // SPREAD FIRST, so every member the client sent survives -- `data` above
      // all, which is the field a client echoes back and the only thing linking
      // this request to the item it is about.
      //
      // TOTAL ON PURPOSE: test/methods-table.test.ts drives every method in the
      // table with one shared params object, so this handler is entered with
      // something that is not a CompletionItem at all. `String(...)` answers for
      // whatever arrives rather than throwing, which would turn a
      // by-construction test into a failure about this file.
      "completionItem/resolve": (_context: RequestContext, item: CompletionItem) => {
        return Promise.resolve({ ...item, detail: `${detailPrefix}${String(item.label)}` });
      },
    },
  });
};
