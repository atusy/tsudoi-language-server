import { expect, mock, test } from "bun:test";

/**
 * THE FAILURE ARM OF THE LAZY-INIT IDIOM, which is the one thing about
 * examples/hover-wordnet.ts that no session test can reach.
 *
 * Every other test of the examples drives the real config through a real server
 * under BOTH runtimes, and a real `init()` succeeds -- so the whole suite
 * observes the arm where nothing goes wrong. What is defended here is what
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
 * variable, with no runtime-specific behaviour in it, and the example itself is
 * loaded and driven under deno by the session tests over examples/tsudoi.config.ts.
 *
 * THE MOCK IS INSTALLED BEFORE THE MODULE IS IMPORTED, and the import below is
 * dynamic for exactly that reason: a static import is hoisted above this call,
 * and the example would bind the real `init` -- which would then take ~130ms and
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

const { define } = await import("../examples/hover-wordnet.ts");

test("a define whose first database load failed retries, instead of failing forever", async () => {
  // The failure is REPORTED rather than swallowed, and this assertion is the
  // pair that keeps the one below honest: an example that answered `null` on a
  // load failure would pass a `the hover works` test while telling every user
  // their word is not in the dictionary.
  await expect(define("apple")).rejects.toThrow(transientFailure);
  expect(initCalls).toBe(1);

  // THE HEADLINE: the same process, the next hover, and the dictionary works.
  expect(await define("apple")).toBe("*noun* — apple is a word");
  expect(initCalls).toBe(2);

  // AND THE MEMO STILL HOLDS on the success it did reach, which is the property
  // the retry must not cost: a fix that simply stopped caching would reload a
  // ~130ms database on every keystroke, and nothing else here would notice.
  expect(await define("pear")).toBe("*noun* — pear is a word");
  expect(initCalls).toBe(2);
});
