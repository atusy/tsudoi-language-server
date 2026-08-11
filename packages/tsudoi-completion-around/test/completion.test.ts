import { describe, expect, test } from "bun:test";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { completeAround } from "../src/completion.ts";

const uri = "file:///workspace/a.txt";

/**
 * THE CONTEXT A HANDLER IS HANDED, BUILT BY HAND. tsudoi publishes the type, so
 * this is the shape a stranger's own tests take -- and building it here rather
 * than spawning a server keeps these arms about THIS PACKAGE. That the handler
 * routes at all is tsudoi's claim, asserted in tsudoi's own suite.
 */
function contextFor(text: string): RequestContext {
  const document = {
    uri,
    languageId: "plaintext",
    version: 1,
    lineCount: text.split("\n").length,
    getText: () => text,
    positionAt: () => ({ line: 0, character: 0 }),
    offsetAt: () => 0,
  };
  return {
    signal: new AbortController().signal,
    tsudoi: {
      documents: {
        get: (asked: string) => (asked === uri ? document : undefined),
        values: () => [],
      },
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      clientCapabilities: {},
      // PRESENT AND REFUSING, which is what a hand-built context owes a member
      // this package never exercises: nothing here notifies, and a stub that
      // RESOLVED would let it start doing so silently.
      notify: () => Promise.reject(new Error("this context sends no notifications")),
    },
  };
}

/** Every item the handler yielded, flattened, for a cursor on `line`. */
async function offered(
  text: string,
  line: number,
  options: Parameters<typeof completeAround>[2] = {},
): Promise<CompletionItem[]> {
  const items: CompletionItem[] = [];
  for await (const batch of completeAround(
    contextFor(text),
    { textDocument: { uri }, position: { line, character: 0 } },
    options,
  )) {
    items.push(...batch);
  }
  return items;
}

describe("completing from around the cursor", () => {
  /**
   * THE WINDOW EXCLUDES SOMETHING, WHICH IS THE WHOLE OF THIS ARM. A document
   * short enough for the window to cover would give the same answer for a
   * handler that read the WHOLE buffer, so the fixture is built taller than the
   * window on purpose: with the cursor in the middle and `maxSize: 1`, `near` is
   * in and `far` is out on BOTH sides.
   *
   * BOTH DIRECTIONS, because an off-by-one at one end alone is a real defect and
   * a one-sided fixture cannot see it.
   */
  test("a word outside the window is not offered, and one inside it is", async () => {
    const text = ["farAbove", "nearAbove", "cursorLine", "nearBelow", "farBelow"].join("\n");

    const words = (await offered(text, 2, { maxSize: 1 })).map((item) => item.label);

    expect(words).toEqual(["nearAbove", "cursorLine", "nearBelow"]);
  });

  /**
   * THE CURSOR'S OWN LINE IS IN THE WINDOW, asserted separately because a window
   * that dropped it would still pass the arm above for `nearAbove` and
   * `nearBelow`.
   */
  test("the cursor's own line contributes its words", async () => {
    expect((await offered("alpha", 0, { maxSize: 0 })).map((item) => item.label)).toEqual([
      "alpha",
    ]);
  });

  /**
   * EVERY ITEM SAYS WHERE IT CAME FROM AND CLAIMS NO LANGUAGE, and the pair is
   * one claim: a user whose popup is fed by several sources needs this one's
   * guesses distinguishable from a real analysis's answers, and a `kind` narrower
   * than Text would be an icon asserting something nobody checked.
   */
  test("an item is Text, and names this source", async () => {
    const [item] = await offered("alpha", 0);

    expect(item).toEqual({ label: "alpha", kind: 1, detail: "around" });
  });

  /**
   * A DOCUMENT THE STORE DOES NOT HOLD YIELDS NOTHING, AND NOT AN EMPTY BATCH.
   * The difference reaches the client: yielding nothing is answered `null` --
   * `no answer here` -- where an empty batch says `there are no candidates`,
   * which is a stronger claim than this package can make about a buffer it was
   * never sent.
   */
  test("a document the store does not hold yields no batch at all", async () => {
    const batches: CompletionItem[][] = [];
    for await (const batch of completeAround(contextFor("alpha"), {
      textDocument: { uri: "file:///workspace/never-opened.txt" },
      position: { line: 0, character: 0 },
    })) {
      batches.push(batch);
    }

    expect(batches).toEqual([]);
  });

  /**
   * AND A WINDOW HOLDING NO WORD YIELDS NOTHING EITHER, for the same reason one
   * door along: the document IS open, and there is still nothing to say. Without
   * this the arm above is a claim about a missing document rather than about the
   * empty answer.
   */
  test("a window whose words are all too short yields no batch", async () => {
    const batches: CompletionItem[][] = [];
    for await (const batch of completeAround(
      contextFor("a b c"),
      { textDocument: { uri }, position: { line: 0, character: 0 } },
      { minLength: 5 },
    )) {
      batches.push(batch);
    }

    expect(batches).toEqual([]);
  });

  /**
   * ONE BATCH AND NOT ONE PER LINE, which is the ruling at `completeAround`
   * made checkable: this answer is read out of a buffer already in memory, so
   * there is no moment at which a partial list is more useful than none, and a
   * yield per line would spend a `$/progress` per line to say the same thing.
   */
  test("the whole answer arrives in one batch", async () => {
    const batches: CompletionItem[][] = [];
    for await (const batch of completeAround(contextFor("alpha beta\ngamma delta"), {
      textDocument: { uri },
      position: { line: 0, character: 0 },
    })) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(4);
  });
});
