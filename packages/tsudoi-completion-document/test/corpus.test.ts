import { describe, expect, test } from "bun:test";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/protocol";
import { completeCorpus } from "../src/corpus.ts";
import { regexScanner, segmentScanner } from "../src/scanners.ts";
import { type FakeDocuments, fakeDocuments } from "./helpers/documents.ts";

const asked = "file:///workspace/asked.txt";

/** Every batch the handler yielded for a request against `uri`. */
async function batchesFor(
  documents: FakeDocuments,
  uri = asked,
  options: Parameters<typeof completeCorpus>[2] = {},
): Promise<CompletionItem[][]> {
  const batches: CompletionItem[][] = [];
  for await (const batch of completeCorpus(
    documents.context,
    { textDocument: { uri }, position: { line: 0, character: 0 } },
    options,
  )) {
    batches.push(batch);
  }
  return batches;
}

/** The labels offered, flattened. */
async function offered(
  documents: FakeDocuments,
  uri = asked,
  options: Parameters<typeof completeCorpus>[2] = {},
): Promise<string[]> {
  const batches = await batchesFor(documents, uri, options);
  return batches.flat().map((item) => item.label);
}

describe("completing from every open document", () => {
  /**
   * A WORD FROM A DOCUMENT THE REQUEST DID NOT NAME IS OFFERED, WHICH IS THE
   * WHOLE OF THIS HANDLER. The fixture gives the OTHER document a word the asked
   * one does not hold, so a handler reading only the buffer under the cursor --
   * which is what its sibling does -- cannot pass.
   *
   * AND THE ASKED DOCUMENT'S OWN WORD IS OFFERED TOO, asserted in the same arm
   * because it is one decision: this handler reads EVERY open document and does
   * not carve out the one it was asked about. Skipping it would make the answer
   * depend on what else the author installed.
   */
  test("a word from another open document is offered, and so is the asked one's", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "askedWord");
    documents.open("file:///workspace/other.txt", "otherWord");

    expect(await offered(documents)).toEqual(["askedWord", "otherWord"]);
  });

  /**
   * A WORD IN TWO DOCUMENTS IS OFFERED ONCE, and the popup is what makes it
   * matter: a candidate repeated per document would push everything else off the
   * list in a workspace where every file imports the same name.
   */
  test("a word two documents share is offered once", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "shared askedOnly");
    documents.open("file:///workspace/other.txt", "shared otherOnly");

    expect(await offered(documents)).toEqual(["shared", "askedOnly", "otherOnly"]);
  });

  /**
   * EVERY ITEM SAYS WHERE IT CAME FROM AND CLAIMS NO LANGUAGE. The detail is
   * `corpus` AND NOT `around`: a user whose popup is fed by both handlers of this
   * package cannot otherwise tell a word from the line above from one in a file
   * they have not looked at today.
   */
  test("an item is Text, and names this source rather than its sibling", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");

    const [item] = (await batchesFor(documents)).flat();

    expect(item).toEqual({ label: "alpha", kind: 1, detail: "corpus" });
  });

  /**
   * ONE BATCH AND NOT ONE PER DOCUMENT, which is the ruling at `completeCorpus`
   * made checkable. THE FIXTURE HOLDS THREE DOCUMENTS ON PURPOSE: with one, a
   * yield per document and a single yield are the same reading.
   */
  test("the whole answer arrives in one batch, however many documents there are", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");
    documents.open("file:///workspace/b.txt", "beta");
    documents.open("file:///workspace/c.txt", "gamma");

    const batches = await batchesFor(documents);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  /**
   * AN EMPTY STORE YIELDS NOTHING, AND NOT AN EMPTY BATCH. The difference reaches
   * the client: yielding nothing is answered `null` -- `no answer here` -- where
   * an empty batch says `there are no candidates`, which is a stronger claim than
   * this package can make about a session whose documents it was never sent.
   *
   * ITS PAIR IS THE ARM ABOVE: an empty list and a handler that never offers
   * anything are the same reading without it.
   */
  test("no open documents yield no batch at all", async () => {
    expect(await batchesFor(fakeDocuments())).toEqual([]);
  });

  /**
   * AND A CORPUS HOLDING NO WORD YIELDS NOTHING EITHER, for the same reason one
   * door along: the documents ARE open, and there is still nothing to say.
   * Without this the arm above is a claim about an empty store rather than about
   * an empty answer.
   */
  test("documents whose words are all too short yield no batch", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "a b c");

    expect(await batchesFor(documents, asked, { minLength: 5 })).toEqual([]);
  });

  /**
   * THE REQUEST NEED NOT NAME AN OPEN DOCUMENT AT ALL, which is where this
   * handler parts company with its sibling: `completeAround` has nothing to say
   * about a buffer it was never sent, and this one still has every OTHER document.
   * A handler that looked the asked uri up first and returned early would pass
   * every arm above.
   */
  test("a request naming a document the store does not hold is still answered", async () => {
    const documents = fakeDocuments();
    documents.open("file:///workspace/other.txt", "otherWord");

    expect(await offered(documents, "file:///workspace/never-opened.txt")).toEqual(["otherWord"]);
  });

  test("a zero item bound returns before scanning", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");
    let scans = 0;
    const scanner = () => {
      scans += 1;
      return ["alpha"];
    };

    expect(await offered(documents, asked, { maxItems: 0, scanner })).toEqual([]);
    expect(scans).toBe(0);
  });

  test("an invalid item bound is rejected before reading or scanning", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");
    let scans = 0;
    const scanner = () => {
      scans += 1;
      return ["alpha"];
    };

    expect(offered(documents, asked, { maxItems: 1.5, scanner })).rejects.toThrow("maxItems");
    expect(documents.reads(asked)).toBe(0);
    expect(scans).toBe(0);
  });

  test("a null minimum prefix length is rejected before reading or scanning", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");
    let scans = 0;
    const scanner = () => {
      scans += 1;
      return ["alpha"];
    };

    expect(
      offered(documents, asked, {
        minPrefixLength: null as unknown as number,
        scanner,
      }),
    ).rejects.toThrow("minPrefixLength");
    expect(documents.reads(asked)).toBe(0);
    expect(scans).toBe(0);
  });

  test("a short typed prefix returns before scanning the corpus", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "al alpha");
    documents.open("file:///workspace/other.txt", "beta");
    const scanned: string[] = [];
    const scanner = (line: string) => {
      scanned.push(line);
      return line.match(/[a-z]+/gu) ?? [];
    };
    const batches: CompletionItem[][] = [];

    for await (const batch of completeCorpus(
      documents.context,
      { textDocument: { uri: asked }, position: { line: 0, character: 2 } },
      { minPrefixLength: 3, scanner },
    )) {
      batches.push(batch);
    }

    expect(batches).toEqual([]);
    expect(scanned).toEqual(["al"]);
  });
});

describe("what the memo may and may not serve again", () => {
  /**
   * AN UNCHANGED DOCUMENT IS SCANNED ONCE ACROSS TWO REQUESTS, which is the whole
   * point of memoising: a completion runs on a keystroke, and the documents a
   * user is not typing in did not move.
   *
   * IT READS WHAT THE HANDLER DID rather than what a cache says about itself --
   * `reads` counts calls to `getText`.
   */
  test("a second request does not scan a document that has not changed", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");

    await offered(documents);
    expect(documents.reads(asked)).toBe(1);

    await offered(documents);
    expect(documents.reads(asked)).toBe(1);
  });

  /**
   * AND AN EDITED ONE IS SCANNED AGAIN, which is this memo's pair: a cache that
   * never invalidated would pass the arm above and offer a word the user deleted
   * for the rest of the session.
   */
  test("an edit at a new version is scanned again, and its new word is offered", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");

    await offered(documents);
    documents.change(asked, "beta", 2);

    expect(await offered(documents)).toEqual(["beta"]);
    expect(documents.reads(asked)).toBe(2);
  });

  /**
   * A REOPENED DOCUMENT AT THE SAME VERSION NUMBER IS SCANNED AGAIN, AND THIS IS
   * THE ARM THE CACHE KEY WAS CHOSEN FOR.
   *
   * A VERSION IS NOT A SESSION-WIDE CLOCK: tsudoi's own `DocumentStore`
   * documentation says a reopened document numbers from whatever the client sent
   * at `didOpen`, so a client that closes a file, something rewrites it on disk,
   * and it is reopened AT VERSION 1 AGAIN is ordinary rather than adversarial.
   *
   * SO A MEMO KEYED ON `uri` AND VERSION SERVES THE OLD FILE'S WORDS FOR THE REST
   * OF THE SESSION, and every other arm in this file stays green while it does.
   * What refuses it is keying on the VIEW OBJECT, which tsudoi builds fresh per
   * open.
   */
  test("a document reopened at the same version offers the new text, not the old", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha", 1);

    await offered(documents);
    documents.close(asked);
    documents.open(asked, "beta", 1);

    expect(await offered(documents)).toEqual(["beta"]);
  });

  /**
   * A REQUEST UNDER DIFFERENT FILTERS IS SCANNED AGAIN, and this is the second
   * thing the version alone cannot answer for: nothing about the DOCUMENT changed
   * between these two requests, so a memo consulting only `uri` and version
   * answers the second question with the first one's answer.
   *
   * THE DIRECTION IS THE ONE THAT SHOWS: asking for a LONGER minimum after a
   * shorter one must drop the short word. The other direction could pass by
   * accident on a cache that stored the unfiltered scan.
   */
  test("a longer minimum length after a shorter one drops the short word", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "ab abcdef");

    expect(await offered(documents)).toEqual(["ab", "abcdef"]);
    expect(await offered(documents, asked, { minLength: 3 })).toEqual(["abcdef"]);
  });

  /**
   * AND A DIFFERENT SCANNER IS SCANNED AGAIN TOO, asserted apart from the length
   * because a memo could compare the numbers and not the scanner. The fixture is
   * Japanese on purpose: the default scanner refuses it by design, so a memo that
   * ignored the scanner would go on refusing it under one that can read it.
   */
  test("a segmenting scanner after the default offers what the default refused", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "こんにちは世界");

    expect(await batchesFor(documents)).toEqual([]);
    expect(await offered(documents, asked, { scanner: segmentScanner("ja") })).toEqual([
      "こんにちは",
      "世界",
    ]);
  });

  /**
   * A SCANNER REBUILT PER REQUEST IS A DIFFERENT KEY, AND THIS ARM IS WHERE THAT
   * COST IS WRITTEN DOWN RATHER THAN DISCOVERED.
   *
   * IT REPLACES ITS OWN OPPOSITE. While the option was a `RegExp` this file
   * asserted that two equivalent patterns were ONE key -- source and flags are
   * comparable, so an author's arrow rebuilding one per keystroke still hit the
   * memo. A CALLBACK IS NOT COMPARABLE: two closures doing the same thing are two
   * values, and nothing can say otherwise, so the guarantee is GONE rather than
   * merely narrowed.
   *
   * WHAT THAT COSTS AN AUTHOR WHO DOES NOT KNOW: correct answers, no memo, every
   * open document rescanned on every keystroke, and every other arm in this file
   * green. HOISTING IS THE WHOLE REMEDY -- build the scanner once, outside the
   * handler -- and the arm below is the same fixture doing that.
   */
  test("a scanner rebuilt per request misses the memo, and rescans", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");

    await offered(documents, asked, { scanner: regexScanner(/[a-z]+/gu) });
    await offered(documents, asked, { scanner: regexScanner(/[a-z]+/gu) });

    expect(documents.reads(asked)).toBe(2);
  });

  /**
   * AND ONE HOISTED SCANNER HITS IT, which is the pair without which the arm above
   * reads as a defect rather than as the reason to hoist.
   */
  test("a scanner built once and reused hits the memo", async () => {
    const documents = fakeDocuments();
    documents.open(asked, "alpha");
    const scanner = regexScanner(/[a-z]+/gu);

    expect(await offered(documents, asked, { scanner })).toEqual(["alpha"]);
    expect(documents.reads(asked)).toBe(1);

    await offered(documents, asked, { scanner });

    expect(documents.reads(asked)).toBe(1);
  });
});
