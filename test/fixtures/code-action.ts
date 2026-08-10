// Relative with .ts, and Bun-free: deno executes this file too.
import type { CodeAction, Command } from "vscode-languageserver-protocol";
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * ONE OF EACH MEMBER OF THE RESULT'S UNION, WHICH IS THE WHOLE REASON THIS
 * FIXTURE IS NOT A ONE-ITEM ONE. `(Command | CodeAction)[]` is two shapes
 * sharing a `title` and nothing else that matters, so a list of CodeActions
 * alone cannot tell tsudoi handing an author's answer through from tsudoi
 * rebuilding it out of the members it recognises -- and the `Command` member is
 * the one a rebuild would drop, since it carries no field the other has.
 *
 * THE CodeAction CARRIES A WORKSPACE EDIT AND THE Command CARRIES ARGUMENTS,
 * for the reason test/fixtures/execute-command-echo.ts gives at its own: a flat
 * string survives a tsudoi that re-encoded the answer through a shape of its
 * own, and a nested object does not.
 *
 * EXPORTED so the arm reading it and the handler answering it cannot drift into
 * two shapes.
 */
export const codeActionAnswer: (Command | CodeAction)[] = [
  {
    title: "表に書き換える",
    kind: "quickfix",
    edit: {
      changes: {
        "file:///workspace/a.txt": [
          {
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
            newText: "表",
          },
        ],
      },
    },
  },
  { title: "コマンドを実行する", command: "tsudoi.試験.コマンド", arguments: [{ at: 3 }, 5] },
];

/**
 * A CONFIG THAT SERVES `textDocument/codeAction` AND NOTHING ELSE, which is what
 * makes it the fixture for both halves of this row: with no other handler
 * declared, the capability arm reads a handshake in which every key but this
 * row's is whatever tsudoi claims for everybody.
 *
 * THE HANDLER READS NO PARAMS, DELIBERATELY. What the arms driving it are about
 * is the ROUTE and the answer's fidelity, and a handler that decided its actions
 * from a range would put a second thing in front of the assertion -- the same
 * ruling test/fixtures/all-methods.ts writes over the whole table.
 */
export default (): Promise<TsudoiConfig> => {
  const codeAction: MethodHandler<"textDocument/codeAction"> = () =>
    Promise.resolve(codeActionAnswer);
  return Promise.resolve({ methods: { "textDocument/codeAction": codeAction } });
};
