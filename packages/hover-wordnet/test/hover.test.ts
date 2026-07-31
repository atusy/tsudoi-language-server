import { expect, mock, test } from "bun:test";
import { TextDocument as UpstreamTextDocument } from "vscode-languageserver-textdocument";
import type { MarkupKind } from "@atusy/tsudoi-language-server/deps/types";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";

/**
 * EVERY SPECIFIER HERE IS ONE THIS PACKAGE DECLARES, and the two are declared
 * differently on purpose. `MarkupKind` comes through tsudoi's `deps/` subpath,
 * which is the route this package's documentation gives a config author and
 * therefore the one worth exercising. `vscode-languageserver-textdocument` comes
 * by its own name and is a devDependency of this package, because the thing this
 * file needs is the CONSTRUCTOR: tsudoi publishes that type deliberately
 * type-only -- an author receives documents and never builds them -- so
 * `deps/textdocument` cannot supply a value, MEASURED as TS1362 rather than
 * assumed. Leaning on the workspace root's copy without declaring it would
 * resolve perfectly well here and break the day this package is checked out
 * alone.
 *
 * THE FAILURE ARM OF THE LAZY-INIT IDIOM, which is the one thing about
 * src/hover.ts that no session test can reach.
 *
 * Every other test that reaches this handler drives the demo config through a
 * real server under BOTH runtimes, and a real `init()` succeeds -- so the whole
 * suite observes the arm where nothing goes wrong. What is defended here is what
 * happens when the FIRST load fails: the promise is memoised, not the
 * resolution, so a single transient failure would be handed back to every later
 * hover for the life of the process. `await ready()` sits outside `define`'s own
 * try, so that rejection escapes `define`, escapes the handler, and each of
 * those hovers is answered -32603. A user restarts their editor to fix it,
 * having been told nothing.
 *
 * ONE RUNTIME, AND THE REASON IS THE APPARATUS RATHER THAN THE CLAIM: making
 * `init` fail exactly once requires replacing the `wordnet` module, and
 * `mock.module` is bun's. What is under test is arithmetic on a module-level
 * variable, with no runtime-specific behaviour in it, and this package is loaded
 * and driven under deno by the session tests over examples/tsudoi.config.ts,
 * which reaches it by package specifier out of node_modules.
 *
 * THE MOCK IS INSTALLED BEFORE THE MODULE IS IMPORTED, and the import below is
 * dynamic for exactly that reason: a static import is hoisted above this call,
 * and the handler would bind the real `init` -- which would then take ~130ms and
 * SUCCEED, making every assertion here a statement about the happy path.
 */
const transientFailure = "tsudoi test: the database is not there yet";

let initCalls = 0;

mock.module("wordnet", () => ({
  init: (): Promise<void> => {
    initCalls += 1;
    // FAILS ONCE, THEN WORKS: a database that is briefly unreadable -- a slow
    // network mount, a file still being written -- is the case this defends,
    // and it is a case that RECOVERS. An `init` that always failed would leave
    // the second call's rejection ambiguous between `retried and failed again`
    // and `never retried`.
    return initCalls === 1 ? Promise.reject(new Error(transientFailure)) : Promise.resolve();
  },
  lookup: (word: string): Promise<{ glossary: string; meta: { synsetType: string } }[]> =>
    Promise.resolve([{ glossary: `${word} is a word`, meta: { synsetType: "noun" } }]),
}));

// RELATIVE, INTO src/, AND NOT THROUGH THIS PACKAGE'S OWN SPECIFIER, which is
// what lets the two names below stay unpublished: `define` is not on the
// `exports` map and nothing outside this directory can reach it. Importing the
// package by name here would test dist/ -- the built artifact rather than the
// source just edited -- and would only see the one name index.ts publishes.
const { define, hoverWordnet } = await import("../src/hover.ts");

test("a define whose first database load failed retries, instead of failing forever", async () => {
  // The failure is REPORTED rather than swallowed, and this assertion is the
  // pair that keeps the one below honest: an example that answered `null` on a
  // load failure would pass a `the hover works` test while telling every user
  // their word is not in the dictionary.
  await expect(define("apple", "markdown")).rejects.toThrow(transientFailure);
  expect(initCalls).toBe(1);

  // THE HEADLINE: the same process, the next hover, and the dictionary works.
  expect(await define("apple", "markdown")).toBe("*noun* — apple is a word");
  expect(initCalls).toBe(2);

  // AND THE MEMO STILL HOLDS on the success it did reach, which is the property
  // the retry must not cost: a fix that simply stopped caching would reload a
  // ~130ms database on every keystroke, and nothing else here would notice.
  expect(await define("pear", "markdown")).toBe("*noun* — pear is a word");
  expect(initCalls).toBe(2);
});

/** The buffer every hover below is asked about: one word, at its first column. */
const uri = "file:///workspace/a.txt";

/**
 * The handler driven the way tsudoi drives it -- through the public
 * RequestContext -- for a client that declared `contentFormat` as given.
 *
 * The context is built here rather than spawned for the reason
 * the sibling handler package's own tests build one: this claim is about WHAT
 * THE HANDLER
 * PRODUCES, and a session would additionally require the real database.
 */
async function hoverWhen(contentFormat: MarkupKind[] | undefined): Promise<unknown> {
  const document = UpstreamTextDocument.create(uri, "plaintext", 1, "apple");
  const context: RequestContext = {
    signal: new AbortController().signal,
    tsudoi: {
      documents: { get: () => document, values: () => [document] },
      // A SESSION THAT NAMED NO PROJECT, spelled out because a `Tsudoi` missing
      // any of these is not one a handler can be given -- so this literal fails
      // to compile rather than modelling an impossible session.
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      // WHAT THE CLIENT DECLARED, SPELLED AS A CLIENT SPELLS IT -- the whole
      // chain, so a rename anywhere along it reddens here rather than silently
      // reading `undefined` and testing the fallback arm four times.
      clientCapabilities: { textDocument: { hover: { contentFormat } } },
    },
  };
  const hover = await hoverWordnet(context, {
    textDocument: { uri },
    position: { line: 0, character: 0 },
  });
  return hover?.contents;
}

/**
 * BOTH ARMS IN ONE MEASUREMENT. `markdown is produced when markdown is
 * supported` passes unchanged against a handler that produces markdown for
 * everyone, which is the defect -- so the claim is the DIFFERENCE, and one hover
 * cannot carry it.
 *
 * THE WHOLE MarkupContent IS COMPARED, kind AND value: a `plaintext` label on a
 * value still fenced in asterisks is the same defect wearing the right name, and
 * only the value says the markdown is gone -- from the heading, from the rule
 * under it, and from every sense below it.
 *
 * RUNS AFTER THE TEST ABOVE HAS LOADED THE DATABASE, which is the memo's doing
 * rather than an arrangement: `ready()` is settled by then, so nothing here
 * depends on the failing first `init`. A regression that broke the load would
 * reach these assertions as a rejection, not as a pass.
 */
test("the hover format follows the client's contentFormat, both ways", async () => {
  expect(await hoverWhen(["markdown"])).toEqual({
    kind: "markdown",
    value: "**apple**\n\n---\n\n*noun* — apple is a word",
  });
  // No emphasis on the word, no rule under it, and no asterisks around the part
  // of speech: what a plaintext client shows IS the string sent.
  expect(await hoverWhen(["plaintext"])).toEqual({
    kind: "plaintext",
    value: "apple\n\nnoun — apple is a word",
  });

  // THE ORDER IS THE CLIENT'S: a handler asking `does the list contain
  // markdown` satisfies both lines above and fails here.
  expect(await hoverWhen(["plaintext", "markdown"])).toEqual({
    kind: "plaintext",
    value: "apple\n\nnoun — apple is a word",
  });
  // A client that declared no format at all declared no markdown support.
  expect(await hoverWhen(undefined)).toEqual({
    kind: "plaintext",
    value: "apple\n\nnoun — apple is a word",
  });
});
