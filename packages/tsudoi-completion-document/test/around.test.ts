import { describe, expect, test } from "bun:test";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/protocol";
import { completeAround, windowAround } from "../src/around.ts";
import { fakeDocuments } from "./helpers/documents.ts";

const uri = "file:///workspace/a.txt";

/**
 * Every item the handler yielded, flattened, for a cursor on `line` of a document
 * holding `text` AND NOTHING ELSE OPEN.
 *
 * ONE DOCUMENT IS THE WHOLE FIXTURE HERE, which is what tells these arms apart
 * from the corpus ones: this handler is meant to answer from the buffer it was
 * given, so a second open document would make an arm about the WINDOW pass or
 * fail for a reason the window did not decide.
 */
async function offered(
  text: string,
  line: number,
  options: Parameters<typeof completeAround>[2] = {},
): Promise<CompletionItem[]> {
  const documents = fakeDocuments();
  documents.open(uri, text);
  const items: CompletionItem[] = [];
  for await (const batch of completeAround(
    documents.context,
    { textDocument: { uri }, position: { line, character: 0 } },
    options,
  )) {
    items.push(...batch);
  }
  return items;
}

/** A context holding exactly one open document at `uri`. */
function contextFor(text: string) {
  const documents = fakeDocuments();
  documents.open(uri, text);
  return documents.context;
}

describe("completing from around the cursor", () => {
  /**
   * THE WINDOW EXCLUDES SOMETHING, WHICH IS THE WHOLE OF THIS ARM. A document
   * short enough for the window to cover would give the same answer for a
   * handler that read the WHOLE buffer, so the fixture is built taller than the
   * window on purpose: with the cursor in the middle and `maxLines: 1`, `near` is
   * in and `far` is out on BOTH sides.
   *
   * BOTH DIRECTIONS, because an off-by-one at one end alone is a real defect and
   * a one-sided fixture cannot see it.
   */
  test("a word outside the window is not offered, and one inside it is", async () => {
    const text = ["farAbove", "nearAbove", "cursorLine", "nearBelow", "farBelow"].join("\n");

    const words = (await offered(text, 2, { maxLines: 1 })).map((item) => item.label);

    expect(words).toEqual(["nearAbove", "cursorLine", "nearBelow"]);
  });

  /**
   * THE CURSOR'S OWN LINE IS IN THE WINDOW, asserted separately because a window
   * that dropped it would still pass the arm above for `nearAbove` and
   * `nearBelow`.
   */
  test("the cursor's own line contributes its words", async () => {
    expect((await offered("alpha", 0, { maxLines: 0 })).map((item) => item.label)).toEqual([
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

  test("a zero item bound returns before scanning", async () => {
    let scans = 0;
    const scanner = () => {
      scans += 1;
      return ["alpha"];
    };

    expect(await offered("alpha", 0, { maxItems: 0, scanner })).toEqual([]);
    expect(scans).toBe(0);
  });

  test("an invalid item bound is rejected before scanning", async () => {
    let scans = 0;
    const scanner = () => {
      scans += 1;
      return ["alpha"];
    };

    expect(offered("alpha", 0, { maxItems: 1.5, scanner })).rejects.toThrow("maxItems");
    expect(scans).toBe(0);
  });

  test("a short typed prefix returns before scanning the window", async () => {
    const scanned: string[] = [];
    const scanner = (line: string) => {
      scanned.push(line);
      return line.match(/[a-z]+/gu) ?? [];
    };
    const batches: CompletionItem[][] = [];

    for await (const batch of completeAround(
      contextFor("al alpha"),
      { textDocument: { uri }, position: { line: 0, character: 2 } },
      { minPrefixLength: 3, scanner },
    )) {
      batches.push(batch);
    }

    expect(batches).toEqual([]);
    expect(scanned).toEqual(["al"]);
  });
});

describe("the window a cursor sees", () => {
  /**
   * `maxLines` EITHER SIDE AND THE CURSOR'S OWN LINE, which is three bounds in
   * one arm because they are one arithmetic: the cursor at line 10 with a window
   * of 2 sees 8 through 12, and the half-open end is 13.
   */
  test("the cursor's line and maxLines either side", () => {
    expect(windowAround(10, 100, 2)).toEqual({ from: 8, to: 13 });
  });

  /**
   * CLAMPED AT BOTH ENDS, and the two are separate mistakes: a negative `from`
   * makes `slice` count from the END of the buffer -- a window at the top of the
   * file silently reading the bottom of it -- where a `to` past the end is
   * merely harmless.
   */
  test("a window wider than the buffer is clamped to it", () => {
    expect(windowAround(0, 5, 200)).toEqual({ from: 0, to: 5 });
    expect(windowAround(4, 5, 200)).toEqual({ from: 0, to: 5 });
  });
});
