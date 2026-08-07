import { describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
// `CompletionItemKind` IS A VALUE and the rest are types: the arm that hands the
// handler a kind it must ignore spells that kind by the protocol's own name
// rather than by its number.
import {
  type CompletionItem,
  CompletionItemKind,
  type MarkupKind,
} from "@atusy/tsudoi-language-server/deps/types";
import { fixtureStamp, tree } from "./helpers/tree.ts";
// RELATIVE, INTO src/, for the reason the completion suite beside this file
// gives: the package publishes two names and everything else these arms reach
// is deliberately absent from that surface.
import { listingFrom, resolvePathStat } from "../src/resolve.ts";

/**
 * WHAT THIS FILE DRIVES AND WHAT IT DELIBERATELY DOES NOT. The subject is the
 * HANDLER's own answer, read off what it returns -- never off an internal
 * composer, because the protocol's answer REPLACES the item in the client's
 * list, so what a helper computed is not what the user is left holding.
 *
 * WHAT REACHES A CLIENT OVER THE WIRE is driven from the repository root
 * instead, through a real server and the example config.
 */

/** The session a handler is handed, with the one knob these arms turn. */
function contextDeclaring(
  documentationFormat: MarkupKind[] | undefined,
  signal: AbortSignal = new AbortController().signal,
): RequestContext {
  return {
    signal,
    tsudoi: {
      // A STORE THAT HOLDS NOTHING, SPELLED OUT: this handler is given an item
      // rather than a position, so no document is involved in its answer at all.
      documents: { get: () => undefined, values: () => [] },
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      // THE WHOLE OPTIONAL CHAIN, as a client spells it, so a rename anywhere
      // along it reddens here rather than silently reading `undefined` and
      // measuring the client that declared nothing.
      clientCapabilities: {
        textDocument: { completion: { completionItem: { documentationFormat } } },
      },
    },
  };
}

/**
 * An item carrying THIS PACKAGE'S MARK AND NOTHING ELSE THAT MATTERS -- a label,
 * the `data` the completion half writes, and a block when an arm supplies one.
 *
 * WHAT IT DELIBERATELY OMITS, AND THE OMISSION IS THE POINT: a real completed
 * item also carries `kind`, `insertText` and `textEdit`, and none of them may
 * decide anything this handler answers. An arm that cares what `kind` says SETS
 * IT ITSELF, which is what makes the disagreement between the claim and the path
 * deliberate instead of incidental.
 */
function markedItem(path: string, source: string, documentation?: unknown): CompletionItem {
  return {
    label: path,
    data: { pathCompletion: path, source },
    ...(documentation === undefined ? {} : { documentation }),
  } as CompletionItem;
}

/** The block an answer carries, as text, or "" when it carries none. */
function blockOf(item: CompletionItem): string {
  const documentation = item.documentation;
  return typeof documentation === "string" ? documentation : (documentation?.value ?? "");
}

/**
 * The stat line every DIRECTORY of a fixture renders, and every FILE of one.
 *
 * COMPOSED FROM THE STAMP THE FIXTURE DECLARES rather than from a second `stat`,
 * which is the difference that matters: the stamp is this suite's INPUT, so
 * reading it back is an oracle, where a `stat` taken beside the handler's would
 * make a correct answer and a consistently broken one look the same. Every file
 * a fixture writes is EMPTY, which is where the zero comes from.
 */
const directoryStat = `directory · modified ${fixtureStamp.toISOString()}`;
const fileStat = `file · 0 bytes · modified ${fixtureStamp.toISOString()}`;

/**
 * THE PREMISE EVERY WHOLE-VALUE ASSERTION IN THIS FILE WILL REST ON once a
 * modification time is rendered anywhere the arms compare whole: that the
 * fixture's stamps come from a constant and not from the clock.
 *
 * IT IS ITS OWN ARM BECAUSE THE WAY IT BREAKS IS SILENT. A stamp set as each
 * entry is created is correct for every FILE and wrong for every DIRECTORY --
 * writing a sibling bumps the parent -- so a suite that read only a file's stat
 * would go on passing while every directory in it carried the wall clock.
 */
describe("the fixture's stamps come from a constant, not from the clock", () => {
  test("a directory built twice carries the same fixed stamp both times", () => {
    // TWO CHILDREN AND NOT ONE, WHICH IS WHAT MAKES THE ARM DISCRIMINATING AT
    // ALL: with a single child, an implementation stamping each entry as it is
    // created leaves the directory correct too, and this arm passes against the
    // very thing it exists to refuse. It takes a SIBLING to bump a parent that
    // was already stamped.
    const first = tree(["listed/one.txt", "listed/two.txt"]);
    const second = tree(["listed/one.txt", "listed/two.txt"]);
    try {
      // THE DIRECTORY IS THE DISCRIMINATING ONE and the file beside it is the
      // pair: with the stamping done at creation the file below still passes.
      const directory = statSync(join(first.root, "listed")).mtime;
      expect(directory).toEqual(fixtureStamp);
      expect(statSync(join(first.root, "listed", "one.txt")).mtime).toEqual(fixtureStamp);
      // AND EQUAL TO THE SECOND BUILD'S, which is what `not the clock` means:
      // equality to the constant alone would also hold of a fixture built at
      // exactly that instant.
      expect(statSync(join(second.root, "listed")).mtime).toEqual(directory);
    } finally {
      first.dispose();
      second.dispose();
    }
  });
});

describe("the block is rebuilt out of what the handler read", () => {
  /**
   * THE ITEM IS GIVEN A BLOCK IN THE OTHER FORMAT, so the two answers cannot both
   * be `whatever came back`.
   *
   * BOTH DIRECTIONS IN ONE MEASUREMENT: `markdown is produced when markdown is
   * declared` passes unchanged against a handler that produces markdown for
   * everyone, and the claim is the DIFFERENCE.
   *
   * THE WHOLE MarkupContent IS COMPARED, kind AND value: a kind of `plaintext`
   * on a value still carrying `---` is the same defect wearing the right label.
   */
  test("the markup a directory's block is built in follows the session, not the item", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    const path = join(fixture.root, "listed");
    try {
      const asMarkdown = await resolvePathStat(
        contextDeclaring(["markdown"]),
        markedItem(path, "cwd", { kind: "plaintext", value: `${path}\n\nsource: cwd` }),
      );
      const asPlainText = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(path, "cwd", {
          kind: "markdown",
          value: `${path}\n\n---\n\nsource: cwd`,
        }),
      );

      expect(asMarkdown.documentation).toEqual({
        kind: "markdown",
        value: `source: cwd\n\n---\n\n${directoryStat}\n\n---\n\n2 entries\n\n- one.txt\n- two.txt`,
      });
      // NO MARKDOWN SYNTAX AT ALL for the client that named none: the names are
      // bare lines rather than bullets, since a client that renders no markdown
      // reads `- ` as punctuation.
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `source: cwd\n\n${directoryStat}\n\n2 entries\n\none.txt\ntwo.txt`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE FIXTURE'S NAME IS THE WHOLE HAZARD: a file called
   * `x\n\nsource: workspace` renders a line BYTE-IDENTICAL to the attribution the
   * composer emits, naming a source the closed-set check would have REFUSED.
   *
   * BOTH MARKUP ARMS, because they fail differently and only one is obvious: the
   * plaintext block joins its parts with blank lines, and the markdown one puts
   * each name in a BULLET -- which a line break breaks out of just as completely.
   *
   * SEPARATE TESTS FOR THE TWO INJECTION SITES, because a repair at the names
   * alone leaves the path wide open and would share this one's first failure.
   *
   * WHAT THIS DOES NOT CLOSE, said plainly because the shape invites the reading:
   * markdown syntax inside a name still renders as syntax -- a name holding `**`
   * still emboldens. What may not survive is a LINE BREAK, because the line
   * grammar is what carries meaning.
   */
  test("a name that would forge an attribution line renders as one that cannot", async () => {
    const forged = "x\n\nsource: workspace";
    const flattened = "x��source: workspace";
    const fixture = tree([`listed/${forged}`, "listed/one.txt"]);
    const path = join(fixture.root, "listed");
    try {
      const asPlainText = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(path, "cwd"),
      );
      const asMarkdown = await resolvePathStat(
        contextDeclaring(["markdown"]),
        markedItem(path, "cwd"),
      );

      // In the grammar's own terms: no LINE of either answer may be an
      // attribution the handler did not decide to make.
      expect(blockOf(asPlainText).split("\n")).not.toContain("source: workspace");
      expect(blockOf(asMarkdown).split("\n")).not.toContain("source: workspace");
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `source: cwd\n\n${directoryStat}\n\n2 entries\n\none.txt\n${flattened}`,
      });
      expect(asMarkdown.documentation).toEqual({
        kind: "markdown",
        value: `source: cwd\n\n---\n\n${directoryStat}\n\n---\n\n2 entries\n\n- one.txt\n- ${flattened}`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * ITS SUBJECT MOVED WITH THE PATH AND THE ARM IS KEPT RATHER THAN DELETED. The
   * path came off the MARK, which arrives from the client, and this arm existed
   * because the composer RENDERED it. It does not any more.
   *
   * WHAT IT REFUSES NOW: an implementation that left the path in the block after
   * all. That is not a hypothetical -- it is the state that makes the popup's
   * prefix relation hold vacuously, and this fixture's name is exactly the input
   * under which leaving it there forges an attribution line.
   *
   * AND `detail` IS READ BESIDE THE BLOCK, WHICH IS WHERE THE PATH WENT. The
   * item is handed the field as the completion half writes it -- FLATTENED, since
   * that half is where the flattening now happens, and the pair for this arm is
   * in that half's own suite -- and what is asserted here is that the answer
   * hands it back BYTE-IDENTICAL. A handler that rebuilt `detail` from the mark
   * would put the raw name back in front of the user, having none of the
   * completion's context to know it had been sanitised.
   *
   * IT IS A REAL DIRECTORY AND NOT A FORGED PATH, because a path nothing can be
   * stat-ed at is answered with the untouched item and would measure the
   * gone-path case instead.
   */
  test("a path whose own name would forge an attribution line renders as one that cannot", async () => {
    const forged = "x\n\nsource: workspace";
    const flattened = "x��source: workspace";
    const fixture = tree([`${forged}/child.txt`]);
    const path = join(fixture.root, forged);
    const rendered = join(fixture.root, flattened);
    const sent = { ...markedItem(path, "cwd"), detail: rendered };
    try {
      const asPlainText = await resolvePathStat(contextDeclaring(["plaintext"]), sent);
      const asMarkdown = await resolvePathStat(contextDeclaring(["markdown"]), sent);

      expect(blockOf(asPlainText).split("\n")).not.toContain("source: workspace");
      expect(blockOf(asMarkdown).split("\n")).not.toContain("source: workspace");
      expect([asPlainText.detail, asMarkdown.detail]).toEqual([rendered, rendered]);
      expect((asPlainText.detail ?? "").split("\n")).not.toContain("source: workspace");
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `source: cwd\n\n${directoryStat}\n\n1 entry\n\nchild.txt`,
      });
      expect(asMarkdown.documentation).toEqual({
        kind: "markdown",
        value: `source: cwd\n\n---\n\n${directoryStat}\n\n---\n\n1 entry\n\n- child.txt`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * ITS OWN ARM, because the block arm above cannot fail on it: rebuilding from
   * the mark closes the block and leaves `data` exactly as forgeable as it was.
   *
   * NOT A CHANGE OF POSITION ABOUT FORGERY, which the shape invites: the PATH is
   * still taken as sent, deliberately.
   */
  test("a source name no completion of ours produced is left out of the answer", async () => {
    const fixture = tree(["listed/one.txt"]);
    const path = join(fixture.root, "listed");
    try {
      const answered = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(path, "<script>alert(1)</script>"),
      );

      expect(blockOf(answered)).toBe(`${directoryStat}\n\n1 entry\n\none.txt`);
      // THE MARK ITSELF COMES BACK UNTOUCHED AND THAT IS NOT AN OVERSIGHT: the
      // answer REPLACES the item the client holds, so stripping `data` would
      // leave that item unresolvable ever again.
      expect(blockOf(answered)).not.toContain("<script>");
      expect(answered.detail ?? "").not.toContain("<script>");
      expect(answered.data).toEqual({ pathCompletion: path, source: "<script>alert(1)</script>" });
    } finally {
      fixture.dispose();
    }
  });
});

describe("a cancelled highlight does not go on reading the directory", () => {
  /**
   * WHAT THIS ARM CAN AND CANNOT OBSERVE, SAID FIRST BECAUSE IT DECIDES WHETHER
   * IT MEASURES ANYTHING: tsudoi answers a cancelled request -32800 whatever the
   * handler returned, so the ANSWER is discarded either way and no client-visible
   * difference exists to assert. The returned value is the only handle a test has
   * on whether the listing RAN, so the arm is a PROXY for the work, stated as one
   * rather than dressed up as an assertion about what a user sees.
   *
   * THE CANCELLATION LANDS WHILE THE STAT IS PENDING, WITH NO TIMER: the handler
   * runs synchronously up to its first `await`, so aborting immediately after the
   * call puts the abort inside the stat every time. A `setTimeout` would make
   * this arm's meaning depend on how busy the machine is.
   *
   * WHAT IT DOES NOT COVER: a cancellation landing once the drain has STARTED is
   * not honoured at all, because abandoning a half-read directory leaks its
   * descriptor on one of the two runtimes.
   */
  test("a resolve cancelled while its stat is pending answers without listing the directory", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    const path = join(fixture.root, "listed");
    const item = markedItem(path, "cwd");
    try {
      const controller = new AbortController();
      const pending = resolvePathStat(contextDeclaring(["plaintext"], controller.signal), item);
      controller.abort();
      const cancelled = await pending;

      expect(cancelled).toEqual(item);
      expect(cancelled.detail).toBeUndefined();

      // THE PAIR THAT SEPARATES `THE LISTING WAS SKIPPED` FROM `THIS FIXTURE HAS
      // NOTHING TO SHOW`: the same item, the same directory, uncancelled.
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), item);
      expect(blockOf(answered)).toBe(
        `source: cwd\n\n${directoryStat}\n\n2 entries\n\none.txt\ntwo.txt`,
      );
    } finally {
      fixture.dispose();
    }
  });

  /**
   * A SEAM THE ARM ABOVE CANNOT REACH, because that one's cancellation is already
   * there when the handler asks.
   *
   * WHAT IS NOT COVERED, AND IT IS THE HONEST HALF: `await opendir` yields exactly
   * ONE MICROTASK turn and NO macrotask turn on either runtime, so the promise it
   * hands back is ALREADY FULFILLED and a cancellation the EVENT LOOP delivers
   * cannot land in this window at all. What the checkpoint skips is the drain,
   * for an abort that becomes true within those microtasks.
   *
   * THE SIGNAL IS ANSWERED `false` ONCE AND ABORTED IN THE MICROTASK THAT READ
   * IT, WHICH IS THE WHOLE OF WHAT MAKES THIS ARM DISCRIMINATING: aborting
   * SYNCHRONOUSLY inside that first read would leave the cancellation in place
   * before `opendir` is even called, so an implementation checking the signal one
   * line EARLIER would pass this arm unchanged. Queued, it needs no timer.
   *
   * THE PREMISE IS ASSERTED OUT OF THE ANSWER'S OWN STAT LINE: the stat is spent
   * and its line is in the block, which is what says the cancellation landed
   * AFTER the handler's first check rather than in front of it -- otherwise this
   * arm would be a second reading of the arm above. A cancellation landing
   * EARLIER answers the item untouched, and this item carries no block at all.
   */
  test("a resolve cancelled between the open and the first entry answers without reading it", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    const path = join(fixture.root, "listed");
    const item = markedItem(path, "cwd");
    try {
      const signal = signalAbortingWhereItIsFirstRead();
      const cancelled = await resolvePathStat(contextDeclaring(["plaintext"], signal), item);

      expect(signal.aborted).toBe(true);
      expect(blockOf(cancelled)).toBe(`source: cwd\n\n${directoryStat}`);

      // THE SAME PAIR THE ARM ABOVE CARRIES: without it, `the directory was not
      // read` and `this fixture has nothing in it` are one observation.
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), item);
      expect(blockOf(answered)).toBe(
        `source: cwd\n\n${directoryStat}\n\n2 entries\n\none.txt\ntwo.txt`,
      );
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * A REAL `AbortController` WHOSE SIGNAL ANSWERS ITS FIRST READER BEFORE IT IS
 * CANCELLED. Nothing here fakes `aborted` into being true; what the proxy decides
 * is only WHEN the cancellation happens -- in the microtask queued by the first
 * read, which is NOT the same as `while that await is pending`.
 *
 * A PROXY RATHER THAN AN OBJECT SHAPED LIKE A SIGNAL, so everything a handler
 * might do with a signal other than read this one property still reaches the real
 * one -- methods bound to it, since an `AbortSignal` method called on anything
 * else throws.
 */
function signalAbortingWhereItIsFirstRead(): AbortSignal {
  const controller = new AbortController();
  let reads = 0;
  return new Proxy(controller.signal, {
    get(target, property): unknown {
      if (property === "aborted" && reads++ === 0) {
        queueMicrotask(() => {
          controller.abort();
        });
        return false;
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === "function" ? (value as () => unknown).bind(target) : value;
    },
  });
}

describe("a path that stops being a directory between the two reads", () => {
  /**
   * CONSTRUCTED RATHER THAN RACED: the abort is READ between the stat and the
   * open, the signal is the CALLER'S, and a getter is arbitrary synchronous code
   * running at exactly that point -- so the swap needs no race, no timer and no
   * second thread, and lands identically on every run.
   *
   * BOTH PREMISES ARE ASSERTED, because either alone would let this pass
   * vacuously: the block's stat line says the snapshot predates the swap, and a
   * fresh `statSync` says the swap really happened.
   *
   * WHERE THE REJECTION SURFACES DIFFERS BY RUNTIME, and this file runs under bun
   * alone: bun's `opendir` RESOLVES on a regular file and the first read rejects,
   * while deno's rejects AT THE CALL. One catch covers both.
   *
   * A SEPARATE PROXY FROM THE CANCELLATION ONE, deliberately: sharing one would
   * tie what this arm constructs to whatever the cancellation seam is later ruled
   * to be, and the two use the same getter for opposite purposes.
   */
  test("a directory replaced by a file after the stat keeps the stat it took and renders no listing", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    const path = join(fixture.root, "listed");
    try {
      const answered = await resolvePathStat(
        contextDeclaring(["plaintext"], signalReplacingTheDirectoryWhereItIsFirstRead(path)),
        markedItem(path, "cwd"),
      );

      // Read off the filesystem rather than off the getter's intention.
      expect(statSync(path).isFile()).toBe(true);
      // The block still says DIRECTORY, which is the snapshot the handler took
      // before the swap, and it carries no listing.
      expect(blockOf(answered)).toBe(`source: cwd\n\n${directoryStat}`);
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * A LIVE SIGNAL, NEVER CANCELLED, WHOSE FIRST READER PAYS FOR THE READ by having
 * the directory swapped for a file underneath it. Nothing here fakes `aborted`:
 * the controller is real and is left alone, so the handler sees exactly the
 * `false` it would have seen.
 *
 * THE FIRST READ IS THE ONE BETWEEN THE STAT AND THE OPEN, which is what puts the
 * swap in the window the catch is about.
 */
function signalReplacingTheDirectoryWhereItIsFirstRead(path: string): AbortSignal {
  const controller = new AbortController();
  let reads = 0;
  return new Proxy(controller.signal, {
    get(target, property): unknown {
      if (property === "aborted" && reads++ === 0) {
        rmSync(path, { recursive: true });
        writeFileSync(path, "");
        return false;
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === "function" ? (value as () => unknown).bind(target) : value;
    },
  });
}

describe("what the path is decides the answer, and never what the item claims", () => {
  /**
   * EVERY OTHER ARM HANDS THE HANDLER AN ITEM WITH NO `kind` AT ALL, so nothing
   * anywhere can tell a stat-driven implementation from a `kind`-driven one --
   * which is why these two set it themselves.
   *
   * WHY AN ITEM'S OWN `kind` MAY NEVER DECIDE THIS: it is the client's copy of a
   * classification made when the popup opened, so it is forgeable like the rest
   * of the item and stale besides -- the path may have been replaced by one of
   * the other kind in between.
   *
   * TWO TESTS AND NOT TWO ASSERTIONS, AND THE REASON THAT SAID SO IS GONE: the
   * two defects used to land in DIFFERENT FIELDS, one on `detail` and one on the
   * block, and now both land in the block. What survives is the reason that never
   * depended on that -- the two directions are different observations, and
   * sharing one test would mean the second could never be the first thing to
   * fail. A `kind`-driven answer asked to list a FILE gets a rejection and
   * quietly drops the listing, so its block looks correct except for the stat
   * line; the DIRECTORY direction's defect is the listing going missing.
   */
  test("a file whose item claims to be a folder is still answered as a file", async () => {
    const fixture = tree(["plain.txt"]);
    const file = join(fixture.root, "plain.txt");
    try {
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), {
        ...markedItem(file, "cwd"),
        kind: CompletionItemKind.Folder,
      });

      // The stat line is where this direction shows: everything else a
      // `kind`-driven answer produces here looks correct, because listing a file
      // rejects and the listing is dropped.
      expect(blockOf(answered)).toBe(`source: cwd\n\n${fileStat}`);
      // The claim itself comes back untouched: the answer REPLACES the item the
      // client holds, so correcting its `kind` is not this handler's business.
      expect(answered.kind).toBe(CompletionItemKind.Folder);
    } finally {
      fixture.dispose();
    }
  });

  test("a directory whose item claims to be a file still comes back with its listing", async () => {
    const fixture = tree(["dir/one.txt"]);
    const directory = join(fixture.root, "dir");
    try {
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), {
        ...markedItem(directory, "cwd"),
        kind: CompletionItemKind.File,
      });

      // THE LISTING, because it is what this direction costs the user: a
      // `kind`-driven answer never asks what is inside.
      expect(blockOf(answered)).toBe(`source: cwd\n\n${directoryStat}\n\n1 entry\n\none.txt`);
      expect(answered.kind).toBe(CompletionItemKind.File);
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * `count` entry names under `prefix`, ZERO-PADDED so that the order they are
 * written in, the order they are expected back in and the order a code-unit sort
 * produces are the same list -- which is what lets an expectation be sliced
 * rather than re-sorted.
 */
function entryNames(prefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${String(index).padStart(3, "0")}.txt`,
  );
}

/**
 * The listing part of a block: its header line, and the names under it.
 *
 * FOUND BY WHAT THE HEADER SAYS AND NOT BY WHICH PART IT IS, because the block
 * is composed of parts that are each OPTIONAL -- so a fixed index is right only
 * for the shape the arm that wrote it happened to produce, and silently returns
 * a neighbouring part for every other. ANCHORED AND FIRST-MATCH: an entry NAMED
 * `3 entries` would otherwise let the names part answer as the header, and the
 * real header is always the earlier of the two.
 *
 * DUPLICATED AT THE REPOSITORY ROOT, and the two MUST NOT DISAGREE -- an absent
 * names part is NO names here, not one empty name.
 */
function listingSection(block: string): { header: string; names: string[] } {
  const parts = block.split("\n\n");
  const at = parts.findIndex((part) => /^\d+ (?:entry|entries)(?:, first \d+ shown)?$/u.test(part));
  if (at === -1) {
    return { header: "", names: [] };
  }
  const names = parts[at + 1];
  return { header: parts[at] ?? "", names: names === undefined ? [] : names.split("\n") };
}

describe("the listing is found by its own header, not by where it happens to sit", () => {
  /**
   * THE READER ABOVE IS WHAT THIS ARM IS ABOUT, and it is the one thing in this
   * file whose defect every other arm is blind to: the arms that use it all
   * supply a source the closed set accepts, so the listing lands where a fixed
   * index expects it and a WRONG reader agrees with a right one everywhere they
   * are exercised.
   *
   * THE INPUT IS NOT INVENTED FOR THE OCCASION: the composer pushes the source
   * part only when the name is one it recognises, so a FORGED source makes the
   * block one part shorter and everything after it moves. The arm beside this
   * one already produces exactly that block and asserts it whole -- what it
   * cannot do is notice that the reader misreads it.
   *
   * THE HEADER AND THE NAMES ARE ASSERTED TOGETHER, because a reader returning
   * the names AS the header and no names at all satisfies either half alone.
   */
  test("a block whose source was forged still reads back as its header and its names", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    try {
      const answered = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(join(fixture.root, "listed"), "<script>alert(1)</script>"),
      );

      expect(listingSection(blockOf(answered))).toEqual({
        header: "2 entries",
        names: ["one.txt", "two.txt"],
      });
    } finally {
      fixture.dispose();
    }
  });
});

describe("what one directory renders does not grow with what it holds", () => {
  /**
   * THE BOUND AS A VALUE, AND THIS IS THE ONLY ARM THAT SPELLS IT: every other
   * one reads the count off an over-bound answer and compares everything else
   * against that, so moving the bound from twenty to nineteen leaves all of them
   * GREEN.
   *
   * THE OTHER ARMS ARE NOT REWRITTEN TO SPELL IT, deliberately: they assert
   * relations -- two directories agreeing, the edge announcing no truncation --
   * that are worth stating independently of the value, and pinning one number in
   * six places is how a legitimate change to it becomes a six-file edit.
   */
  test("a directory far past the bound renders twenty names and no more", async () => {
    const many = entryNames("f", 25);
    const fixture = tree(many.map((name) => `many/${name}`));
    try {
      const section = listingSection(
        blockOf(
          await resolvePathStat(
            contextDeclaring(["plaintext"]),
            markedItem(join(fixture.root, "many"), "cwd"),
          ),
        ),
      );

      expect(section.names.length).toBe(20);
      // The number the USER is told is the same number, so a bound that moved
      // without the announcement moving reddens here too.
      expect(section.header).toBe("25 entries, first 20 shown");
    } finally {
      fixture.dispose();
    }
  });

  /**
   * TWO DIRECTORIES WITH DIFFERENT OVERFLOWS IN ONE MEASUREMENT, because a
   * hardcoded `more` passes against one: the claim is that the SAME count of
   * names comes back from two directories holding different numbers of entries,
   * which one fixture cannot state.
   *
   * 25 AND 47 CANNOT BOTH BE SATISFIED BY ONE CONSTANT, which is what makes the
   * truncated answer more than a shape.
   *
   * THE NAMES ARE COMPARED WHOLE, so an answer that took a bounded but ARBITRARY
   * slice fails here rather than looking right on the machine it was written on.
   */
  test("two directories past the bound render the same number of names, each stating its own total", async () => {
    const many = entryNames("f", 25);
    const more = entryNames("e", 47);
    const fixture = tree([
      ...many.map((name) => `many/${name}`),
      ...more.map((name) => `more/${name}`),
    ]);
    try {
      const context = contextDeclaring(["plaintext"]);
      const manySection = listingSection(
        blockOf(await resolvePathStat(context, markedItem(join(fixture.root, "many"), "cwd"))),
      );
      const moreSection = listingSection(
        blockOf(await resolvePathStat(context, markedItem(join(fixture.root, "more"), "cwd"))),
      );

      const shown = manySection.names.length;
      // The pair for the bound: a listing that rendered NOTHING would satisfy
      // every equality below, and one that rendered everything is the state this
      // test exists to refuse.
      expect(shown).toBeGreaterThan(0);
      expect(shown).toBeLessThan(many.length);
      expect(moreSection.names.length).toBe(shown);

      expect(manySection.names).toEqual(many.slice(0, shown));
      expect(moreSection.names).toEqual(more.slice(0, shown));
      expect(manySection.header).toBe(`25 entries, first ${String(shown)} shown`);
      expect(moreSection.header).toBe(`47 entries, first ${String(shown)} shown`);
    } finally {
      fixture.dispose();
    }
  });

  /**
   * `.` SORTS BEFORE EVERY ALPHANUMERIC, so under a plain sort a directory
   * holding more dotfiles than the bound renders NOTHING BUT DOTFILES -- a
   * project root, the directory a user is likeliest to highlight, reads back as
   * all noise.
   *
   * THE BOUND IS READ OFF A DIFFERENT DIRECTORY, one holding no dotfile at all:
   * taken from this one's own answer, an implementation that FILTERED dotfiles
   * out would satisfy every equality below with a shorter list, since the
   * expectation would shrink with it.
   *
   * THE FIXTURE'S OWN PREMISE IS ASSERTED FIRST -- more dotfiles than the bound,
   * and fewer ordinary entries than it -- so a bound moved past 25 reddens saying
   * the fixture no longer starves it, rather than passing while measuring an
   * ordinary directory.
   */
  test("a directory whose dotfiles outnumber the bound still renders its ordinary entries", async () => {
    const crowd = entryNames("c", 40);
    const ordinary = entryNames("o", 5);
    const dotfiles = entryNames(".d", 25);
    const fixture = tree([
      ...crowd.map((name) => `crowd/${name}`),
      ...ordinary.map((name) => `mixed/${name}`),
      ...dotfiles.map((name) => `mixed/${name}`),
    ]);
    try {
      const context = contextDeclaring(["plaintext"]);
      const sectionOf = async (name: string): Promise<{ header: string; names: string[] }> =>
        listingSection(
          blockOf(await resolvePathStat(context, markedItem(join(fixture.root, name), "cwd"))),
        );
      const shown = (await sectionOf("crowd")).names.length;
      expect(dotfiles.length).toBeGreaterThan(shown);
      expect(shown).toBeGreaterThan(ordinary.length);

      expect(await sectionOf("mixed")).toEqual({
        header: `${String(ordinary.length + dotfiles.length)} entries, first ${String(shown)} shown`,
        names: [...ordinary, ...dotfiles.slice(0, shown - ordinary.length)],
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE EDGE ITSELF, staged by reading the bound off an over-bound answer first
   * so no number is spelled: a directory holding EXACTLY the bound must announce
   * no truncation, which is the off-by-one an implementation writing `<=` where
   * it meant `<` gets wrong.
   *
   * AND AN EMPTY DIRECTORY IS ANSWERED RATHER THAN LEFT TO LOOK LIKE A FILE: with
   * names alone, `this directory holds nothing` and `nothing was listed` produce
   * THE SAME BYTES. The file beside it is the pair that makes that mean something.
   */
  test("a directory at or under the bound shows every entry, and an empty one says so", async () => {
    const overflow = entryNames("h", 40);
    const fixture = tree([
      ...overflow.map((name) => `over/${name}`),
      "under/one.txt",
      "under/two.txt",
      "empty/",
      "plain.txt",
    ]);
    try {
      const context = contextDeclaring(["plaintext"]);
      const sectionOf = async (name: string): Promise<{ header: string; names: string[] }> =>
        listingSection(
          blockOf(await resolvePathStat(context, markedItem(join(fixture.root, name), "cwd"))),
        );
      const shown = (await sectionOf("over")).names.length;
      // Staged from what was just read, so the edge is the module's own bound
      // rather than a number this file believes it to be.
      const edge = entryNames("i", shown);
      mkdirSync(join(fixture.root, "edge"));
      for (const name of edge) {
        writeFileSync(join(fixture.root, "edge", name), "");
      }

      expect(await sectionOf("edge")).toEqual({ header: `${String(shown)} entries`, names: edge });
      expect(await sectionOf("under")).toEqual({
        header: "2 entries",
        names: ["one.txt", "two.txt"],
      });
      expect(await sectionOf("empty")).toEqual({ header: "0 entries", names: [] });

      // The pair: a FILE's answer carries no listing section at all, so `0
      // entries` is a statement about a directory rather than the shape every
      // answer happens to have.
      const file = await resolvePathStat(
        context,
        markedItem(join(fixture.root, "plain.txt"), "cwd"),
      );
      expect(blockOf(file)).toBe(`source: cwd\n\n${fileStat}`);
    } finally {
      fixture.dispose();
    }
  });
});

/** The names as a sequence, in the order written, shaped as entries. */
async function* arriving(names: string[]): AsyncGenerator<{ name: string }> {
  for (const name of names) {
    yield { name };
  }
}

/**
 * THE ONE THING IN THIS PACKAGE DRIVEN BELOW THE HANDLER, AND THE EXCEPTION IS
 * ARGUED RATHER THAN TAKEN. This file's rule is that the subject is the HANDLER's
 * answer, and the retain gate cannot be reached that way and be sure of it: `is
 * this name better than the worst one I kept` fires only once the kept list is
 * FULL, so what it decides depends on the order the filesystem hands names back
 * in -- that filesystem's own bookkeeping, promised by nothing. A handler arm
 * staging names in an order it cannot control reddens for a reason that is not
 * the one it exists to report.
 *
 * SO THE SEQUENCE IS A PARAMETER, and nothing about the handler's own answer is
 * asserted here; the arms above own that.
 */
describe("what the drain keeps when the names arrive out of rendered order", () => {
  /**
   * `Z` IS 0x5A AND `a` IS 0x61, so code units render the uppercase names first
   * and EVERY collator renders them last. Arriving lowercase-first, each uppercase
   * name meets a full list of lowercase ones and must REPLACE the worst kept; a
   * locale-ordered gate rejects every one of them.
   *
   * THE TOTAL IS ASSERTED BESIDE THE NAMES because the two claims are separable:
   * a drain that stopped counting once the list was full would satisfy the names
   * and lie about the directory.
   */
  test("a name arriving after the kept list is full replaces the worst kept by code unit", async () => {
    const lower = entryNames("a", 25);
    const upper = entryNames("Z", 25);

    // THE PREMISE, READ OFF THE DRAIN ITSELF: the lowercase run alone OVERFILLS
    // the kept list, so every uppercase name below arrives at a FULL one and the
    // gate is what decides it. Overfilled and not merely filled, because `exactly
    // full` and `not yet full` are the same reading from out here.
    //
    // AND NOT EMPTY, WHICH `fewer than went in` ALONE ADMITS: with the gate
    // keeping NOTHING, every list assertion below degenerates to
    // empty-equals-empty and the total is counted somewhere else.
    const lowerOnly = await listingFrom(arriving(lower));
    expect(lowerOnly.names.length).toBeGreaterThan(0);
    expect(lowerOnly.names.length).toBeLessThan(lower.length);

    const listing = await listingFrom(arriving([...lower, ...upper]));

    expect(listing.names).toEqual(upper.slice(0, lowerOnly.names.length));
    expect(listing.total).toBe(lower.length + upper.length);
  });

  /**
   * A SECOND HAZARD AND SO A SECOND ARM: the one above owns the comparison
   * BETWEEN two names, this one owns the GROUP they are compared in. `.` is 0x2E
   * and every ordinary letter is above it, so under ONE FLAT code-unit order the
   * hidden names arriving first are the twenty that render, and every ordinary
   * name arriving after them is refused by the gate as worse than the worst kept.
   *
   * WHY THE HANDLER ARM THAT ALREADY STAGES DOTFILES DOES NOT COVER IT: that arm
   * reaches the gate through a real directory, so WHICH names are in the kept
   * list when an ordinary one arrives is the filesystem's bookkeeping rather than
   * the arm's choice. The case where a hidden name is ALREADY KEPT and must be
   * DISPLACED cannot be staged from out there at all.
   *
   * MEMBERSHIP IS ASSERTED BY THE PREMISE AND NOT ONLY THE ORDER: the hidden run
   * alone comes back as hidden names, so this arm cannot be satisfied by an
   * implementation that FILTERED them -- a different decision from the one the
   * module took, and one the total would still hide.
   */
  test("a hidden name already kept is displaced by an ordinary name arriving after it", async () => {
    const hidden = entryNames(".h", 25);
    const ordinary = entryNames("o", 25);

    // THE PREMISE, as the arm above reads its own: the hidden run ALONE overfills
    // the kept list, so every ordinary name below arrives at a FULL list holding
    // nothing but hidden names.
    const hiddenOnly = await listingFrom(arriving(hidden));
    expect(hiddenOnly.names.length).toBeGreaterThan(0);
    expect(hiddenOnly.names.length).toBeLessThan(hidden.length);
    expect(hiddenOnly.names).toEqual(hidden.slice(0, hiddenOnly.names.length));

    const listing = await listingFrom(arriving([...hidden, ...ordinary]));

    expect(listing.names).toEqual(ordinary.slice(0, hiddenOnly.names.length));
    expect(listing.total).toBe(hidden.length + ordinary.length);
  });
});
