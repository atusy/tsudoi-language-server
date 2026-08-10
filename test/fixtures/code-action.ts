// Relative with .ts, and Bun-free: deno executes this file too.
import type { CodeAction, Command } from "vscode-languageserver-protocol";
import type {
  MethodHandler,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/**
 * BOTH MEMBERS OF THE RESULT'S UNION, WHICH IS THE WHOLE REASON THIS FIXTURE IS
 * NOT A ONE-ITEM ONE. `(Command | CodeAction)[]` is two shapes a normaliser
 * could plausibly confuse: each declares a `title` and a `command`, the
 * `Command`'s a required string where the `CodeAction`'s is an optional nested
 * `Command`. A list of CodeActions alone could not tell a tsudoi rebuilding the
 * answer onto the members it recognised from a faithful passthrough.
 *
 * THE `CodeAction` HERE CARRIES NO `command` AT ALL, deliberately: an action
 * whose whole content is an `edit` is the shape with the least in common with a
 * `Command`, so it is the one a normaliser is likeliest to mangle.
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
  // A SECOND ENTRY SHARING THE FIRST COMMAND'S TITLE, AND IT IS WHAT MAKES THE
  // WORD `collapsed` GRADEABLE. With every entry distinct, a collapse BY TITLE
  // or BY COMMAND NAME moves nothing, so an arm claiming one would redden was
  // green about nothing. NOT BY WHOLE VALUE, which these two do not grade and
  // no entry here does: they differ in their arguments, deliberately, that
  // being the realistic shape -- one action per target, offered under one name.
  { title: "コマンドを実行する", command: "tsudoi.試験.コマンド", arguments: [{ at: 9 }] },
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
 *
 * AND IT YIELDS ONCE, WHICH IS AN AUTHOR'S ORDINARY CASE AND NOT A SIMPLIFIED
 * ONE: a handler whose actions are a fixed list has one batch to give. THAT IS
 * WHAT LETS ONE FIXTURE SERVE BOTH HALVES OF THE DRIVE -- the arms drive it with
 * a `partialResultToken` and without one, and the pair is the whole claim that
 * the stream drive costs a client nothing it did not ask for: without the token
 * the aggregate is what the awaited drive would have sent, and with it the same
 * batch leaves as `$/progress`.
 */
export default (): Promise<TsudoiConfig> => {
  const codeAction: MethodHandler<"textDocument/codeAction"> = async function* () {
    yield codeActionAnswer;
  };
  return Promise.resolve({ methods: { "textDocument/codeAction": codeAction } });
};
