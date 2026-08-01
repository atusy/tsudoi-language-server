import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
// THE ARRIVAL ORDER IS READ WITH THE SAME CALL THE MODULE READS IT WITH, so the
// premise the retain arm asserts is the order that module really meets.
import { opendir } from "node:fs/promises";
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
import { tree } from "./helpers/tree.ts";
// RELATIVE, INTO src/, for the reason the completion suite beside this file
// gives: the package publishes two names and everything else these arms reach
// is deliberately absent from that surface.
import { resolvePathStat } from "../src/resolve.ts";

/**
 * WHAT THIS FILE DRIVES AND WHAT IT DELIBERATELY DOES NOT. The subject is the
 * HANDLER's own answer, read off what it returns -- never off an internal
 * composer, because the protocol's answer REPLACES the item in the client's
 * list, so what a helper computed is not what the user is left holding.
 *
 * WHAT REACHES A CLIENT OVER THE WIRE is driven from the repository root
 * instead, through a real server and the example config, exactly as the
 * completion half's claims are split.
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
      // rather than a position, so no document is involved in its answer at all
      // -- and an empty store is what says so.
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
 * WHAT IT DELIBERATELY OMITS, AND THE OMISSION IS THE POINT RATHER THAN A
 * SHORTCUT: a real completed item also carries `kind`, `insertText` and
 * `textEdit`, and none of them may decide anything this handler answers. `kind`
 * is the one with teeth -- it is the client's copy of a classification taken at
 * popup time, so an implementation reading it would answer from a stale,
 * forgeable field. An arm that cares what `kind` says SETS IT ITSELF, which is
 * what makes the disagreement between the claim and the path deliberate instead
 * of incidental.
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

describe("the block is rebuilt out of what the handler read", () => {
  /**
   * THE FORMAT IS RE-READ FROM THE SESSION, and the item is given a block in the
   * OTHER format so the two answers cannot both be `whatever came back`.
   *
   * BOTH DIRECTIONS IN ONE MEASUREMENT, for the reason the completion half's
   * format arm is written that way: `markdown is produced when markdown is
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
        // The item arrives carrying a PLAINTEXT block -- the opposite of what
        // this session declared -- so an answer that reused it fails here.
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
        value: `${path}\n\n---\n\nsource: cwd\n\n---\n\n2 entries\n\n- one.txt\n- two.txt`,
      });
      // NO MARKDOWN SYNTAX AT ALL for the client that named none: the rule is
      // dropped rather than downgraded, and the names are bare lines rather than
      // bullets -- a client that renders no markdown reads `- ` as punctuation.
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `${path}\n\nsource: cwd\n\n2 entries\n\none.txt\ntwo.txt`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * A FILENAME IS DATA AND A LINE OF THIS BLOCK IS A STATEMENT THE SERVER MAKES,
   * and this is the arm that says a name cannot become one. `source: <name>`
   * is the attribution the composer emits, and a file called
   * `x\n\nsource: workspace` renders a line BYTE-IDENTICAL to it -- naming a
   * source the closed-set check would have REFUSED, so the answer would state a
   * source it explicitly declined to state.
   *
   * BOTH MARKUP ARMS, because they fail differently and only one of them is
   * obvious: the plaintext block joins its parts with blank lines, and the
   * markdown one puts each name in a BULLET -- which a line break breaks out of
   * just as completely.
   *
   * THE LISTING IS ONE OF TWO INJECTION SITES and the path above it is the
   * other, asserted in the test below; they are separate tests because a repair
   * at the names alone leaves the second wide open and would share this one's
   * first failure.
   *
   * WHAT THIS DOES NOT CLOSE, said plainly because the shape invites the
   * reading: markdown syntax inside a name still renders as syntax -- a name
   * holding `**` still emboldens -- which is the trade the composer has always
   * made and is untouched. What may not survive is a LINE BREAK, because the
   * line grammar is what carries meaning.
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

      // The fabrication itself, in the grammar's own terms: no LINE of either
      // answer may be an attribution the handler did not decide to make.
      expect(blockOf(asPlainText).split("\n")).not.toContain("source: workspace");
      expect(blockOf(asMarkdown).split("\n")).not.toContain("source: workspace");
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `${path}\n\nsource: cwd\n\n2 entries\n\none.txt\n${flattened}`,
      });
      expect(asMarkdown.documentation).toEqual({
        kind: "markdown",
        value: `${path}\n\n---\n\nsource: cwd\n\n---\n\n2 entries\n\n- one.txt\n- ${flattened}`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE SECOND INJECTION SITE, AND IT IS THE ONE A READER WOULD NOT PREDICT: the
   * absolute path at the TOP of the block comes off the MARK, which arrives from
   * the client, so a directory whose own name carries a line break puts those
   * lines above the attribution rather than below it.
   *
   * IT IS A REAL DIRECTORY AND NOT A FORGED PATH, because a path nothing can be
   * stat-ed at is answered with the untouched item and would measure the
   * gone-path case instead.
   *
   * BOTH MARKUP ARMS AGAIN, for the reason the listing arm gives.
   */
  test("a path whose own name would forge an attribution line renders as one that cannot", async () => {
    const forged = "x\n\nsource: workspace";
    const flattened = "x��source: workspace";
    const fixture = tree([`${forged}/child.txt`]);
    const path = join(fixture.root, forged);
    const rendered = join(fixture.root, flattened);
    try {
      const asPlainText = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(path, "cwd"),
      );
      const asMarkdown = await resolvePathStat(
        contextDeclaring(["markdown"]),
        markedItem(path, "cwd"),
      );

      expect(blockOf(asPlainText).split("\n")).not.toContain("source: workspace");
      expect(blockOf(asMarkdown).split("\n")).not.toContain("source: workspace");
      expect(asPlainText.documentation).toEqual({
        kind: "plaintext",
        value: `${rendered}\n\nsource: cwd\n\n1 entry\n\nchild.txt`,
      });
      expect(asMarkdown.documentation).toEqual({
        kind: "markdown",
        value: `${rendered}\n\n---\n\nsource: cwd\n\n---\n\n1 entry\n\n- child.txt`,
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE SOURCE NAME IS A SECOND ROUTE INTO THE REBUILT BLOCK, and it owns its own
   * arm because the block arm above cannot fail on it: rebuilding from the mark
   * closes the block and leaves `data` exactly as forgeable as it was.
   *
   * DROPPED RATHER THAN ECHOED, and the answer still carries everything that was
   * read from disk -- the path and the listing -- so a forged mark costs the user
   * the attribution and nothing else.
   *
   * NOT A CHANGE OF POSITION ABOUT FORGERY, which the shape invites: the PATH is
   * still taken as sent, deliberately, and this handler still does nothing with
   * it but read it.
   */
  test("a source name no completion of ours produced is left out of the answer", async () => {
    const fixture = tree(["listed/one.txt"]);
    const path = join(fixture.root, "listed");
    try {
      const answered = await resolvePathStat(
        contextDeclaring(["plaintext"]),
        markedItem(path, "<script>alert(1)</script>"),
      );

      expect(blockOf(answered)).toBe(`${path}\n\n1 entry\n\none.txt`);
      // THE MARK ITSELF COMES BACK UNTOUCHED AND THAT IS NOT AN OVERSIGHT: the
      // answer REPLACES the item the client holds, so stripping `data` would
      // leave that item unresolvable ever again. What may not carry the forged
      // text is what this handler STATES.
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
   * IT MEASURES ANYTHING. tsudoi answers a cancelled request -32800 whatever the
   * handler returned -- it re-reads the abort after the handler settles -- so
   * the ANSWER is discarded either way and no client-visible difference exists
   * to assert. What the check buys is that the listing is NOT RUN, and the
   * returned value is the only handle a test has on that: an implementation
   * that ignored the signal opens the directory and comes back with a `detail`
   * and a block carrying the entries, which is what the green pair below shows
   * this fixture really produces. So the arm is a PROXY for the work, stated as
   * one rather than dressed up as an assertion about what a user sees.
   *
   * THE CANCELLATION LANDS WHILE THE STAT IS PENDING, WITH NO TIMER: the handler
   * runs synchronously up to its first `await`, so aborting immediately after
   * the call -- before the returned promise is awaited -- puts the abort inside
   * the stat every time. A `setTimeout` would make this arm's meaning depend on
   * how busy the machine is, which is the defect this suite has already had to
   * explain away once.
   *
   * WHAT IT DOES NOT COVER IS NOW TWO DIFFERENT THINGS AND ONLY ONE OF THEM IS
   * REFUSED. A cancellation landing between the OPEN and the first entry is
   * covered by the arm below this one -- and that is a narrower seam than
   * `while the directory is opening`, for the measurement written there. A
   * cancellation landing once the drain has STARTED is not honoured at all, for
   * the reason written at `listingOf`: abandoning a half-read directory leaks
   * its descriptor on one of the two runtimes.
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

      // THE PAIR, AND IT IS WHAT SEPARATES `THE LISTING WAS SKIPPED` FROM `THIS
      // FIXTURE HAS NOTHING TO SHOW`: the same item, the same directory, an
      // uncancelled session.
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), item);
      expect(blockOf(answered)).toBe(`${path}\n\nsource: cwd\n\n2 entries\n\none.txt\ntwo.txt`);
    } finally {
      fixture.dispose();
    }
  });

  /**
   * A CANCELLATION THAT LANDS AFTER THE OPEN AND BEFORE THE FIRST ENTRY, which
   * is the seam the checkpoint inside `listingOf` guards -- and it is a seam the
   * arm above cannot reach, because that one's cancellation is already there
   * when the handler asks.
   *
   * THE NAME THIS ARM USED TO CARRY WAS `while its directory is opening` AND
   * THAT IS WIDER THAN WHAT IT ESTABLISHES. MEASURED on both runtimes, on a
   * directory of a hundred thousand entries so a lazy open and an eager one
   * differ by most of a second: `await opendir` yields exactly ONE MICROTASK
   * turn and NO macrotask turn -- deno takes 777-859 ms inside the call and a
   * `setTimeout(0)` queued before it has still not fired when the continuation
   * runs, bun takes 0-5 ms and reads the same. So the promise `opendir` hands
   * back is ALREADY FULFILLED, and this arm's abort lands in that one microtask
   * turn: after the open produced its handle -- after deno has already read the
   * whole directory synchronously -- and before the continuation that would take
   * an entry off it. WHAT IS THEREFORE NOT COVERED, and it is the honest half:
   * a cancellation the EVENT LOOP delivers cannot land in that window at all,
   * because the window contains no macrotask turn. What the checkpoint skips is
   * the drain, for an abort that becomes true within those microtasks.
   *
   * THE SIGNAL IS ANSWERED `false` ONCE AND ABORTED IN THE MICROTASK THAT READ
   * IT, WHICH IS THE WHOLE OF WHAT MAKES THIS ARM DISCRIMINATING. Aborting
   * SYNCHRONOUSLY inside that first read would leave the cancellation in place
   * before `opendir` is even called, so an implementation checking the signal one
   * line EARLIER -- before the open rather than after it -- would pass this arm
   * unchanged. Queued, it lands where the paragraph above says, and it needs no
   * timer, so it does not depend on how busy the machine is.
   *
   * THE PREMISE IS ASSERTED OUT OF THE ANSWER'S OWN `detail`: the stat is spent
   * and its line is in the answer, which is what says the cancellation landed
   * AFTER the handler's first check rather than in front of it -- otherwise this
   * arm would be a second reading of the arm above.
   *
   * WHAT IS ASSERTED IS AGAIN A PROXY FOR THE WORK, per the note above: the
   * answer is discarded by tsudoi either way, and the block is the only handle a
   * test has on whether the directory was read.
   */
  test("a resolve cancelled between the open and the first entry answers without reading it", async () => {
    const fixture = tree(["listed/one.txt", "listed/two.txt"]);
    const path = join(fixture.root, "listed");
    const item = markedItem(path, "cwd");
    try {
      const signal = signalAbortingWhereItIsFirstRead();
      const cancelled = await resolvePathStat(contextDeclaring(["plaintext"], signal), item);

      expect((cancelled.detail ?? "").split(" · ")[0]).toBe("directory");
      expect(signal.aborted).toBe(true);
      expect(blockOf(cancelled)).toBe(`${path}\n\nsource: cwd`);

      // THE SAME PAIR THE ARM ABOVE CARRIES, and for the same reason: without it,
      // `the directory was not read` and `this fixture has nothing in it` are one
      // observation.
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), item);
      expect(blockOf(answered)).toBe(`${path}\n\nsource: cwd\n\n2 entries\n\none.txt\ntwo.txt`);
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * A REAL `AbortController` WHOSE SIGNAL ANSWERS ITS FIRST READER BEFORE IT IS
 * CANCELLED. The cancellation itself is the controller's own -- nothing here
 * fakes `aborted` into being true -- and what the proxy decides is only WHEN it
 * happens: in the microtask queued by the first read, so it lands after the
 * reader has gone on and before the continuation of the next `await`. WHICH IS
 * NOT THE SAME AS `while that await is pending`, and the arm above measures the
 * difference: `await opendir` yields one microtask turn and no macrotask turn on
 * either runtime, so what this proxy reaches is a window the event loop never
 * gets into.
 *
 * A PROXY RATHER THAN AN OBJECT SHAPED LIKE A SIGNAL, so everything a handler
 * might do with a signal other than read this one property still reaches the
 * real one -- methods bound to it, since an `AbortSignal` method called on
 * anything else throws.
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

describe("what the path is decides the answer, and never what the item claims", () => {
  /**
   * THE RULING HAD NO WITNESS, WHICH IS WHY THIS ARM EXISTS. `the branch is
   * taken from a FRESH stat` is written at the handler and was asserted by
   * nothing: MEASURED, replacing that branch with `item.kind === 19` left this
   * file green on both runtimes, and a sharpened hybrid -- the item's `kind`
   * when it has one, the stat when it does not -- was green ACROSS THE WHOLE
   * TREE. Every other arm hands the handler an item with no `kind` at all, so
   * nothing anywhere could tell the two implementations apart.
   *
   * WHY AN ITEM'S OWN `kind` MAY NEVER DECIDE THIS: it is the client's copy of a
   * classification made when the popup opened, so it is forgeable like the rest
   * of the item and stale besides -- the path may have been replaced by one of
   * the other kind in between, which is the same window the deletion arm is
   * about.
   *
   * TWO TESTS AND NOT TWO ASSERTIONS, because the two directions FAIL IN
   * DIFFERENT FIELDS and the wrong implementation trips the first one first: a
   * `kind`-driven answer asked to list a FILE gets a rejection and quietly drops
   * the listing, so that arm's whole visible defect is on `detail`, while the
   * DIRECTORY arm's is the listing going missing. Sharing one test would mean
   * the second could never be observed.
   */
  test("a file whose item claims to be a folder is still answered as a file", async () => {
    const fixture = tree(["plain.txt"]);
    const file = join(fixture.root, "plain.txt");
    try {
      const answered = await resolvePathStat(contextDeclaring(["plaintext"]), {
        ...markedItem(file, "cwd"),
        kind: CompletionItemKind.Folder,
      });

      // The classifying word off the detail line, which is where this direction
      // shows: the block a `kind`-driven answer produces here looks correct,
      // because listing a file rejects and the listing is dropped.
      expect((answered.detail ?? "").split(" · ")[0]).toBe("file");
      expect(blockOf(answered)).toBe(`${file}\n\nsource: cwd`);
      // The claim itself comes back untouched: the answer REPLACES the item the
      // client holds, so correcting its `kind` is not this handler's business --
      // refusing to be decided by it is.
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

      // THE LISTING FIRST, because it is what this direction costs the user: a
      // `kind`-driven answer never asks what is inside, which is the whole
      // reason the listing exists.
      expect(blockOf(answered)).toBe(`${directory}\n\nsource: cwd\n\n1 entry\n\none.txt`);
      expect((answered.detail ?? "").split(" · ")[0]).toBe("directory");
      expect(answered.kind).toBe(CompletionItemKind.File);
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * `count` entry names under `prefix`, ZERO-PADDED so that the order this test
 * writes them in, the order it expects them back in and the order a code-unit
 * sort produces are the same list -- which is what lets an expectation be
 * sliced rather than re-sorted.
 */
function entryNames(prefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${String(index).padStart(3, "0")}.txt`,
  );
}

/** The listing part of a block: its header line, and the names under it. */
function listingSection(block: string): { header: string; names: string[] } {
  const parts = block.split("\n\n");
  const [header = "", names] = parts.slice(2);
  return { header, names: names === undefined ? [] : names.split("\n") };
}

describe("what one directory renders does not grow with what it holds", () => {
  /**
   * THE BOUND AS A VALUE, AND IT IS THE ONE THING EVERY OTHER ARM IN THIS FILE
   * TAKES FROM THE IMPLEMENTATION INSTEAD OF STATING. MEASURED by the sprint's
   * second reviewer: moving the bound from twenty to nineteen left the arms
   * below, the hidden-entry arm and the wire arm ALL GREEN, because each of them
   * reads the count off an over-bound answer and compares everything else
   * against that. A suite that infers the number from the implementation agrees
   * with the implementation whatever it says, which is this project's own
   * definition of measuring nothing.
   *
   * READ OFF THE ANSWER AND IMPORTED FROM NOWHERE, which is the whole of the
   * standing ruling and is not loosened by spelling the number here: what
   * `entriesShown` decides is visible as the number of names one resolved
   * directory carries, so THIS is the wire reading, and a test importing the
   * constant would be the thing refused -- it would agree with itself after any
   * edit. AN EARLIER DECISION IS RETIRED BY MEASUREMENT RATHER THAN QUIETLY
   * DROPPED: the number was deliberately `spelled in no test`, and that is
   * exactly what left it pinned by nothing.
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
      // And the number the USER is told is the same number, so a bound that
      // moved without the announcement moving reddens here too.
      expect(section.header).toBe("25 entries, first 20 shown");
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE BOUND IS READ OFF THE ANSWER AND NEVER IMPORTED, for the reason written
   * at the batch size in the completion half: a test that imports the number
   * agrees only with itself, where one reading what was rendered disagrees
   * loudly the day the number moves. Nothing below spells it.
   *
   * TWO DIRECTORIES WITH DIFFERENT OVERFLOWS IN ONE MEASUREMENT, because
   * `a hardcoded more` passes against one: the claim is that the SAME count of
   * names comes back from two directories holding different numbers of entries,
   * which one fixture cannot state.
   *
   * THE EXACT TOTAL IS ASSERTED AS A VALUE, which is what makes the truncated
   * answer more than a shape -- the user is told how many entries the directory
   * really holds, and 25 and 47 cannot both be satisfied by one constant.
   *
   * THE NAMES ARE COMPARED WHOLE, so an answer that took a bounded but ARBITRARY
   * slice -- whatever order the filesystem handed back -- fails here rather than
   * looking right on the machine it was written on.
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
   * WHAT THE BOUND RENDERS WHEN THE DIRECTORY IS MOSTLY DOTFILES, AND IT IS THE
   * ARM THE ORDER RULING EXISTS FOR. `.` sorts before every alphanumeric, so
   * under a plain sort a directory holding more dotfiles than the bound renders
   * NOTHING BUT DOTFILES -- a project root, the directory a user is likeliest to
   * highlight, reads back as all noise.
   *
   * THE BOUND IS READ OFF A DIRECTORY HOLDING NO DOTFILE AT ALL and never
   * spelled, and it is read off a DIFFERENT directory on purpose: taken from
   * this one's own answer, an implementation that FILTERED dotfiles out would
   * satisfy every equality below with a shorter list, since the expectation
   * would shrink with it.
   *
   * THE FIXTURE'S OWN PREMISE IS ASSERTED FIRST -- more dotfiles than the bound,
   * and fewer ordinary entries than it -- so a bound moved past 25 reddens here
   * saying the fixture no longer starves it, rather than passing while measuring
   * an ordinary directory.
   *
   * TWO REDS AND NOT ONE: a plain sort fails on the NAMES, and filtering the
   * dotfiles out fails on the HEADER as well, because the total still counts
   * them -- membership is exactly where the ruling left it and only the order
   * moved.
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
   * THE COMPARISON THE RETAIN PATH MAKES WHEN THE LIST IS ALREADY FULL -- `is
   * this name better than the worst one I kept` -- AND NOTHING ELSE IN THIS TREE
   * REACHED IT WITH NAMES THAT CAN TELL CODE UNITS FROM A COLLATOR. MEASURED by
   * the sprint's second reviewer and REPRODUCED before this arm was written: with
   * ONLY that comparison changed to `localeCompare`, this file and the wire file
   * read 28 pass / 0 fail. The ordering fixture that gained its case pair earlier
   * in this sprint holds FIVE entries, so the list is never full while it is read
   * and the gate's `worst kept` is `undefined` throughout -- the pair witnesses
   * the RENDER order and reaches the RETENTION rule not at all.
   *
   * WHAT THIS FIXTURE ADDS IS AN OVER-BOUND DIRECTORY WHOSE ARRIVAL ORDER IS NOT
   * ITS RENDERED ORDER. The uppercase names belong in the answer and the
   * lowercase ones do not -- `Z` is 0x5A and `a` is 0x61 -- while every collator
   * orders them the other way round, so an uppercase name arriving once the list
   * is full is one the ruled order must let REPLACE the worst kept and a
   * locale-ordered gate REJECTS.
   *
   * THE PREMISE IS READ OFF THE DIRECTORY'S OWN ARRIVAL ORDER RATHER THAN
   * ASSUMED, and it is two conditions because either alone measures nothing: a
   * lowercase name inside the first `shown` arrivals -- which is what makes the
   * worst kept a lowercase name at the moment the list fills -- and an uppercase
   * name arriving after them, which is the one the gate then decides about. A
   * FILESYSTEM HANDING ENTRIES BACK IN NAME ORDER WOULD SATISFY NEITHER and would
   * make this arm vacuous, so it reddens saying so instead. Directory order is
   * the filesystem's own bookkeeping and is promised by nothing, which is the
   * reason this suite sorts at all; here it is the thing being relied on, so it
   * is asserted where it is relied on.
   *
   * MORE UPPERCASE NAMES THAN THE BOUND, so the premise cannot hold while the
   * gate stays unreached: with the bound's worth of them already kept, every
   * further one still arrives at a full list.
   */
  test("a name arriving after the bound is full replaces the worst kept by code unit", async () => {
    const ordinary = entryNames("f", 25);
    const upper = entryNames("Z", 25);
    const lower = entryNames("a", 20);
    const fixture = tree([
      ...ordinary.map((name) => `plain/${name}`),
      // Written lowercase-first, which is what a filesystem MAY hand back and
      // never what it must -- hence the premise assertion below.
      ...lower.map((name) => `mixed/${name}`),
      ...upper.map((name) => `mixed/${name}`),
    ]);
    try {
      const context = contextDeclaring(["plaintext"]);
      const sectionOf = async (name: string): Promise<{ header: string; names: string[] }> =>
        listingSection(
          blockOf(await resolvePathStat(context, markedItem(join(fixture.root, name), "cwd"))),
        );
      // Off a directory of ordinary names, as every other arm here reads it.
      const shown = (await sectionOf("plain")).names.length;

      const arrival: string[] = [];
      for await (const entry of await opendir(join(fixture.root, "mixed"))) {
        arrival.push(entry.name);
      }
      expect(arrival.slice(0, shown).some((name) => name.startsWith("a"))).toBe(true);
      expect(arrival.slice(shown).some((name) => name.startsWith("Z"))).toBe(true);

      expect(await sectionOf("mixed")).toEqual({
        header: `${String(upper.length + lower.length)} entries, first ${String(shown)} shown`,
        names: upper.slice(0, shown),
      });
    } finally {
      fixture.dispose();
    }
  });

  /**
   * THE OTHER SIDE OF THE BOUND, AND THE EDGE ITSELF. A directory holding
   * EXACTLY the bound must announce no truncation, which is the off-by-one an
   * implementation writing `<=` where it meant `<` gets wrong -- and it is
   * staged by reading the bound off an over-bound answer first, so no number is
   * spelled here either.
   *
   * AND AN EMPTY DIRECTORY IS ANSWERED RATHER THAN LEFT TO LOOK LIKE A FILE: with
   * names alone, `this directory holds nothing` and `nothing was listed` produce
   * THE SAME BYTES, so the count line is what tells the user which they are
   * reading. The file beside it is the pair that makes that assertion mean
   * something.
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
      expect(blockOf(file)).toBe(`${join(fixture.root, "plain.txt")}\n\nsource: cwd`);
    } finally {
      fixture.dispose();
    }
  });
});
