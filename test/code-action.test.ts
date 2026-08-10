import { describe, expect, test } from "bun:test";
import {
  type CodeAction,
  type Command,
  type InitializeResult,
  type ServerCapabilities,
  type TextDocumentSyncOptions,
  TextDocumentSyncKind,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { codeActionAnswer } from "./fixtures/code-action.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const codeActionFixture = fixture("code-action.ts");
/**
 * A config that can answer something and NOT this, which is what the absence
 * half needs: a config answering nothing at all would satisfy an absence check
 * from a tsudoi that failed to load it.
 */
const codeActionAbsent = fixture("hover-fixed.ts");
/** Supplies no handler for anything, for the answer the ROUTE gives on its own. */
const noMethods = fixture("no-methods.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const textDocumentSync: TextDocumentSyncOptions = {
  openClose: true,
  change: TextDocumentSyncKind.Incremental,
};

/**
 * Advertised for EVERY config, so it stands in the exact-equality pins below and
 * is not evidence about the fixture either of them drives. Why tsudoi claims it
 * unconditionally is at the capabilities literal in
 * packages/tsudoi-language-server/src/server.ts.
 */
const workspace: ServerCapabilities["workspace"] = {
  workspaceFolders: { supported: true, changeNotifications: true },
};

const uri = "file:///workspace/a.txt";

/**
 * EVERY ARM HERE CARRIES ITS RUNTIME IN ITS OWN NAME, WHICH NO SIBLING FILE DOES
 * AND WHICH IS NOT A STYLE. MEASURED at bun 1.3.13: a `<testcase>` in bun's
 * JUnit report carries the `describe` in `classname` and ONLY the `test()` string
 * in `name` -- and the perturbation registry's reader builds a run into a Map
 * KEYED BY `name`. So two arms differing only by their describe collapse to ONE
 * result, last write winning, and a record naming such an arm reports whichever
 * runtime bun wrote last while saying nothing about the other.
 *
 * THIS IS THE FIRST PER-RUNTIME ARM FILE THE REGISTRY POINTS AT, which is why it
 * is closed here and not everywhere: every other file in this shape is graded by
 * no record, so the collapse costs them nothing today. The day one of them gains
 * a record is the day it needs this line too.
 *
 * AND NOTHING IN THIS FILE MAY SPELL THAT HELPER'S PATH, PROSE INCLUDED. The
 * refusal keeping a record from re-running a file that itself re-runs
 * perturbations -- which would spawn without bound -- is a SUBSTRING TEST over
 * the arm file's whole text. MEASURED: an earlier spelling of the paragraph
 * above named the path in a comment, and this file's record was refused with
 * `re-runs perturbations itself`. The over-refusal is the safe direction and is
 * not a defect to repair here; it is a trap to write down.
 */
function named(runtime: { name: string }, what: string): string {
  return `${what} (${runtime.name})`;
}

/**
 * A RANGE AND A CONTEXT, BOTH REQUIRED BY `CodeActionParams` AND GRADED BY
 * NOTHING HERE. They are written out because the request is what a client would
 * send, not because anything would notice their absence: the only params check
 * on this route is `typeof params === "object"`, and the fixture's handler reads
 * no params at all. NOT INHERITED FROM test/methods-table.test.ts's OWN
 * MEASUREMENT, which was taken by deleting a DIFFERENT member in a DIFFERENT
 * file -- the reason here is the one above and it is this file's.
 */
function codeActionParams(token?: string): unknown {
  const params = {
    textDocument: { uri },
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } },
    context: { diagnostics: [] },
  };
  return token === undefined ? params : { ...params, partialResultToken: token };
}

/** A client that wants partial results names a token; one that does not omits it. */
const partialResultToken = "code-action-partial-1";

/**
 * A CLIENT THAT ANNOUNCED IT CAN READ CODE ACTION LITERALS, which the shared
 * `initializeParams` does not: it sends `capabilities: {}`, and LSP permits a
 * server to send only `Command` literals to such a client. The fixture yields a
 * `CodeAction`, so driving these arms with the bare params would make this file
 * a worked example of the one obligation the README hands the author -- a
 * demonstration of the mistake, in the suite that documents it.
 *
 * NO ARM DRIVES THE OTHER DIRECTION, and that is a statement about tsudoi rather
 * than an omission: tsudoi does not read this capability and does not narrow
 * what a handler yields, so an arm with the capability withheld would assert what
 * the FIXTURE chose to yield and nothing about tsudoi at all.
 */
const readsCodeActionLiterals = {
  ...initializeParams,
  capabilities: {
    textDocument: {
      codeAction: { codeActionLiteralSupport: { codeActionKind: { valueSet: [] } } },
    },
  },
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * WHAT THE AUTHOR WROTE IS WHAT THE CLIENT RECEIVES, ASSERTED WHOLE AND OVER
     * BOTH MEMBERS OF THE UNION. tsudoi neither validates a code action nor
     * reshapes one, and the two shapes are close enough to make a rebuild
     * plausible: each declares a `title` and a `command`, the `Command`'s a
     * required string where the `CodeAction`'s is an optional nested `Command`.
     * A tsudoi normalising the list onto the members it recognised would land on
     * one reading or the other, and the whole-value comparison refuses both.
     *
     * EXACT EQUALITY ON THE WHOLE LIST rather than a read of one title: an
     * implementation that reordered, that collapsed the two entries sharing a
     * title, or that filled in a `kind` for a command reddens here. A LENGTH
     * WOULD CATCH ONLY THE COLLAPSE, and a list of titles only the collapse and
     * the reorder; what the whole-value comparison adds is the reshaping of a
     * member that leaves both alone. THE FIXTURE IS WHAT MAKES THE COLLAPSE
     * GRADEABLE AT ALL -- it holds two entries a merge could join, and with
     * every entry distinct that clause would have been green about nothing.
     *
     * NO `partialResultToken`, SO WHAT IS COMPARED IS THE AGGREGATE. That is the
     * arm saying the stream drive costs a client NOTHING it did not ask for: the
     * response is byte-identical to what awaiting the handler once would have
     * sent, and the arm below drives the same handler with a token to show the
     * other half.
     */
    test(
      named(runtime, "a config's code actions reach the client as the author wrote them"),
      async () => {
        const session = LspSession.start(runtime, codeActionFixture);
        try {
          await session.request("initialize", readsCodeActionLiterals);
          session.notify("initialized", {});

          const answered = await session.request<(Command | CodeAction)[] | null>(
            "textDocument/codeAction",
            codeActionParams(),
          );

          expect(answered).toEqual(codeActionAnswer);
          // THE HALF THE DOCBLOCK'S CLAIM RESTS ON THAT THE AGGREGATE DOES NOT
          // SHOW: `$/progress` is FRAMED, so `unframedStdoutBytes` stays zero
          // for a tsudoi that streamed under a token it invented AND aggregated
          // the response. A client that named no token must receive nothing on
          // the progress channel at all.
          expect(session.progressCount).toBe(0);
          expect(session.unframedStdoutBytes).toBe(0);
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE SAME ACTIONS UNDER A TOKEN, WHICH IS THE WHOLE OF WHY THIS ROW IS
     * STREAM-DRIVEN. The stakeholder ruled the generator shape so partial
     * results stay reachable, and the arm above -- driving the identical handler
     * with NO token -- is what says the aggregate answer did not change to buy
     * it. Here the batch leaves as its own `$/progress` and the response is
     * `null`, ALWAYS, including for a stream that yielded once.
     *
     * THE TOKEN IS READ OFF THE NOTIFICATION rather than assumed: a drive that
     * streamed under a token of its own invention would satisfy a count and
     * leave the client unable to attribute the batch to its request.
     */
    test(
      named(runtime, "the same actions travel as progress when the client names a token"),
      async () => {
        const session = LspSession.start(runtime, codeActionFixture);
        try {
          await session.request("initialize", readsCodeActionLiterals);
          session.notify("initialized", {});

          const answered = await session.request<unknown>(
            "textDocument/codeAction",
            codeActionParams(partialResultToken),
          );

          expect(answered).toBeNull();
          expect(session.progress).toEqual([
            { token: partialResultToken, value: codeActionAnswer },
          ]);
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE PAIRED DIRECTION, and without it the FIRST arm is a claim about a
     * ROUTE that might answer that way for anybody: the same request THAT ARM
     * SENDS -- no token, so the aggregate is what comes back -- against a config
     * with no handler is answered `null`, so what came back up there is
     * attributable to the handler rather than to the registration.
     *
     * IT PAIRS WITH THE NO-TOKEN ARM AND NOT WITH THE ONE DIRECTLY ABOVE IT,
     * which sends a token; the no-handler answer under a token is the drive's
     * and is stated over the whole table in test/methods-table.test.ts.
     */
    test(
      named(runtime, "the same request against a config with no handler is answered null"),
      async () => {
        const session = LspSession.start(runtime, noMethods);
        try {
          await session.request("initialize", initializeParams);
          session.notify("initialized", {});

          const answered = await session.request<unknown>(
            "textDocument/codeAction",
            codeActionParams(),
          );

          expect(answered).toBeNull();
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE ADVERTISED CAPABILITY NAMES NO KINDS, WHICH IS THIS ROW'S CONTRAST
     * WITH THE ONE BEFORE IT. `ExecuteCommandOptions.commands` is REQUIRED, so
     * that contributor had to write a list and could only write an empty one;
     * `CodeActionOptions.codeActionKinds` is OPTIONAL, so handler presence can
     * decline to name kinds instead of naming wrong ones. Claiming a kind would
     * be a promise to a client that no config made -- the identical failure,
     * avoidable here where it was not there.
     *
     * THE VALUE PINNED IS `true` AND THE PROPERTY IS NOT ABOUT THE BOOLEAN:
     * `{}` is a legal `CodeActionOptions` saying exactly what `true` says, so an
     * implementation spelling it that way would redden this arm while breaking
     * nothing. WHAT THE ARM IS FOR is the whole-object equality, which refuses
     * `{ codeActionKinds: [] }` -- the spelling that reads harmless and tells a
     * conforming client this server produces NO kinds at all, and that would
     * satisfy any read of the key alone.
     */
    test(
      named(
        runtime,
        "a config supplying a codeAction handler advertises the provider and no kinds",
      ),
      async () => {
        const session = LspSession.start(runtime, codeActionFixture);
        try {
          const result = await session.request<InitializeResult>("initialize", initializeParams);

          expect(result.capabilities).toEqual({
            textDocumentSync,
            workspace,
            codeActionProvider: true,
          });
        } finally {
          session.dispose();
        }
      },
    );

    /**
     * THE OTHER DIRECTION, AND THE KEY IS ABSENT ENTIRELY RATHER THAN `false`.
     * `contributeCapabilities` is presence-driven, so a config declaring no
     * handler must leave the client with nothing to send.
     *
     * IT ADDS NO DISCRIMINATION AND IS KEPT ANYWAY, for the reason
     * test/execute-command.test.ts writes at its own absence arm: other files
     * drive this same fixture to the same whole-object equality, so every
     * weakening reddening this reddens those too. WHAT KEEPS IT IS WHERE IT IS
     * READ -- a reader looking for the absence half should find it in the file
     * about code actions.
     */
    test(
      named(runtime, "a config supplying no codeAction handler advertises no code-action support"),
      async () => {
        const session = LspSession.start(runtime, codeActionAbsent);
        try {
          const result = await session.request<InitializeResult>("initialize", initializeParams);

          expect(result.capabilities).toEqual({
            textDocumentSync,
            workspace,
            hoverProvider: true,
          });
        } finally {
          session.dispose();
        }
      },
    );
  });
}
