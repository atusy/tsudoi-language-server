import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import type { CompletionItem, MarkupKind } from "@atusy/tsudoi-language-server/deps/types";
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

/** An item marked the way this package's completion half marks its own. */
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
