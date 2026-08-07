import { describe, expect, test } from "bun:test";
import { chmodSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { frameworkRoot } from "./helpers/spawn.ts";
import { tree, type Tree } from "./helpers/tree.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * THE CONTENT IS MULTIBYTE ON PURPOSE: `size` is BYTES, and every ASCII file
 * satisfies a byte reading and a UTF-16 reading at once. `サンプル` plus a newline
 * is THIRTEEN BYTES and FIVE UNITS -- two numbers that cannot be confused.
 */
const fileText = "サンプル\n";

/**
 * The mtime this test SETS, so the expected strings below are hand-written
 * rather than read back out of a second `stat`.
 *
 * A WHOLE SECOND, which is not fussiness: filesystems disagree about sub-second
 * precision, so a fractional stamp is a value the disk may legally hand back
 * rounded.
 */
const mtime = new Date("2001-02-03T04:05:06.000Z");

/**
 * The stat line a resolved FILE's block must carry, WRITTEN OUT RATHER THAN
 * COMPUTED: both sides calling `stat` would make a correct reading and a
 * consistently broken one produce the same observation.
 */
const fileStat = "file · 13 bytes · modified 2001-02-03T04:05:06.000Z";

/** And what a resolved DIRECTORY's must carry. */
const directoryStat = "directory · modified 2001-02-03T04:05:06.000Z";

/** What the document's one line reads: the prefix both entries share. */
const prefix = "sample";

/**
 * A tree holding one file and one directory whose names share `prefix`, so ONE
 * completion request produces both items and the two answers are about the same
 * listing at the same moment.
 *
 * THE DIRECTORY HOLDS CHILDREN: with nothing inside it, `an empty listing` and
 * `no listing at all` produce THE SAME BYTES, so an arm asserting that a
 * directory's entries reach the client would measure nothing.
 *
 * THEY ARE CREATED BEFORE THE TIMESTAMPS ARE FIXED, and the order is
 * load-bearing: writing into a directory bumps its mtime, and the expected
 * detail string below carries that stamp.
 *
 * NAMES WHOSE CREATION ORDER, FILESYSTEM ORDER AND RENDERED ORDER ALL DIFFER, so
 * an answer echoing either of the first two cannot pass the whole-value assertion
 * by coincidence. TWO ARE HIDDEN, because `hidden entries are shown, and last` is
 * a ruling with no witness unless a fixture holds one.
 *
 * EACH GROUP HOLDS AN UPPERCASE NAME AND A LOWERCASE ONE, AND THAT PAIR IS THE
 * ONLY THING HERE THAT CAN TELL THE RULED ORDER FROM THE REFUSED ONE: with every
 * name lowercase ASCII, replacing the comparator with `localeCompare` leaves
 * every ordering assertion in the tree GREEN. `Z` is 0x5A and `a` is 0x61, so
 * code units order `Zeta.txt` before `alpha` where every collator orders it
 * after -- and the two runtimes' DEFAULT LOCALES DIFFER, so the same directory
 * would read differently depending on the machine the server runs on.
 *
 * THE HIDDEN GROUP NEEDS ITS OWN PAIR: the comparator answers on the group key
 * first and reaches the name key only WITHIN a group, so a discriminating pair
 * among the ordinary entries alone leaves the hidden branch unwitnessed.
 */
function sampleTree(): Tree {
  const fixture = tree([
    "sample.txt",
    "sample-dir/beta.txt",
    "sample-dir/.hidden",
    "sample-dir/alpha/",
    "sample-dir/Zeta.txt",
    "sample-dir/.Zed",
  ]);
  writeFileSync(join(fixture.root, "sample.txt"), fileText);
  utimesSync(join(fixture.root, "sample.txt"), mtime, mtime);
  utimesSync(join(fixture.root, "sample-dir"), mtime, mtime);
  return fixture;
}

/**
 * The block EVERY item this fixture's completion produces carries, and one
 * string covers both because the completion half knows exactly one fact about
 * an item: which root offered it.
 *
 * PLAINTEXT BECAUSE THE SESSION DECLARED NOTHING: this suite's initialize params
 * carry no capabilities at all, so the client named no documentation format.
 *
 * `source: document` AND NOT `cwd`, though both roots are this fixture: items
 * dedup by inserted text and the document's own directory is asked first.
 *
 * IT NO LONGER TELLS THE TWO ITEMS APART, which is why the arms that need them
 * separated read `detail`: the file and the directory come out of one listing
 * under one root, so their blocks are the SAME BYTES until resolve is asked.
 */
const completedBlock = "source: document";

/** What a FILE's block grows into once resolve has stat-ed it. */
function fileBlock(): string {
  return `${completedBlock}\n\n${fileStat}`;
}

/**
 * And a DIRECTORY's: the same two facts, plus what is inside it.
 *
 * `alpha` IS A DIRECTORY, which is what makes `names alone` a decision rather
 * than an accident: dotfiles, files and a directory all come back spelled the
 * same way.
 *
 * WITHIN EACH GROUP THE UPPERCASE NAME COMES FIRST, and that is the whole value
 * this string carries that a locale-ordered answer cannot produce: a collator
 * would read back `alpha, beta.txt, Zeta.txt` and `.hidden, .Zed`. Written out
 * rather than sorted here, or a mistake in the comparator would be reproduced by
 * the expectation.
 */
function directoryBlock(): string {
  return `${completedBlock}\n\n${directoryStat}\n\n5 entries\n\nZeta.txt\nalpha\nbeta.txt\n.Zed\n.hidden`;
}

/**
 * A tree whose one directory holds far more entries than any answer renders,
 * with the names ZERO-PADDED so that creation order, expected order and a
 * code-unit sort are the same list.
 */
const crowd = Array.from({ length: 30 }, (_, index) => `c${String(index).padStart(3, "0")}.txt`);

function crowdedTree(): Tree {
  const fixture = tree(crowd.map((name) => `sample-crowd/${name}`));
  // STAMPED FOR THE SAME REASON sampleTree's ENTRIES ARE, and after its children
  // for the same reason: the block this fixture's arm compares WHOLE now carries
  // a modification time.
  utimesSync(join(fixture.root, "sample-crowd"), mtime, mtime);
  return fixture;
}

/**
 * A tree holding one directory this process may stat and may not list, beside
 * one it may do both to.
 *
 * THE MODE IS RESTORED BEFORE THE TREE IS REMOVED, or the removal fails on the
 * directory it cannot descend into and leaves the temp tree behind.
 */
function lockedTree(): Tree {
  const fixture = tree(["sample-locked/inside.txt", "sample-open/visible.txt"]);
  const locked = join(fixture.root, "sample-locked");
  utimesSync(locked, mtime, mtime);
  // THE LISTABLE ONE IS STAMPED TOO, and it was not while the stat lived in
  // `detail`: its block is compared whole and now carries a modification time.
  utimesSync(join(fixture.root, "sample-open"), mtime, mtime);
  chmodSync(locked, 0o000);
  return {
    root: fixture.root,
    dispose: (): void => {
      chmodSync(locked, 0o700);
      fixture.dispose();
    },
  };
}

/** The block an item carries, as text, or "" when it carries none. */
function blockOf(item: CompletionItem): string {
  const documentation = item.documentation;
  return typeof documentation === "string" ? documentation : (documentation?.value ?? "");
}

/**
 * The stat part of a block: the part that says what the path IS.
 *
 * FOUND BY WHAT IT SAYS AND NOT BY WHICH PART IT IS, for the reason the reader
 * below is: every part of this block is optional, so a fixed index is right only
 * for the shape the arm that wrote it happened to produce. A directory arm that
 * had started reporting a size is still FOUND here, which is what lets the arm
 * about it refuse one.
 */
function statSection(block: string): string {
  return block.split("\n\n").find((part) => /^(?:file|directory) · /u.test(part)) ?? "";
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
 * DUPLICATED IN THE MEMBER'S OWN SUITE, because a member reaching into the root's
 * helpers stops being checkable on its own. WHAT THE TWO MUST NOT DO IS DISAGREE:
 * an absent names part is NO names here, not one empty name, which is how the
 * empty-directory answer reads -- a case asserted there rather than here. THE
 * INPUT THAT SEPARATES THIS READER FROM THE INDEX IT REPLACED IS STAGED THERE
 * AND CANNOT BE STAGED HERE: it needs a FORGED source, and every item this file
 * resolves came out of a real server.
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

/** The demo config, started with its working directory INSIDE the fixture. */
function startDemo(runtime: (typeof runtimes)[number], cwd: string): LspSession {
  // startCommand rather than start: the route `start` runs names the CLI relative
  // to the repo, and the whole point of this fixture is a cwd that is not it.
  return LspSession.startCommand(
    `${runtime.command} ${runtime.runArgs.join(" ")} ${join(frameworkRoot, "src", "cli.ts")} --config ${demoConfig}`,
    cwd,
  );
}

/**
 * Every item the demo config's own completion produced for `prefix` in `root`.
 *
 * THE ITEMS COME FROM THE SERVER RATHER THAN FROM A LITERAL: an item assembled
 * here would test the handler against a shape this example might no longer
 * produce.
 */
async function completedItems(session: LspSession, root: string): Promise<CompletionItem[]> {
  await session.request<InitializeResult>("initialize", initializeParams);
  session.notify("initialized", {});
  const uri = pathToFileURL(join(root, "doc.txt")).href;
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text: prefix },
  });
  // No partialResultToken, so every batch is aggregated and the response IS the
  // whole list.
  const answer = await session.request<CompletionItem[] | null>("textDocument/completion", {
    textDocument: { uri },
    position: { line: 0, character: prefix.length },
  });
  return answer ?? [];
}

/** The one item that inserts `insertText`, or a failure naming what was there. */
function itemFor(items: readonly CompletionItem[], insertText: string): CompletionItem {
  const found = items.filter((item) => item.insertText === insertText);
  if (found.length !== 1 || found[0] === undefined) {
    throw new Error(
      `expected exactly one item inserting ${insertText}, saw ${JSON.stringify(
        items.map((item) => item.insertText),
      )}`,
    );
  }
  return found[0];
}

/**
 * AN ITEM THIS EXAMPLE DID NOT PRODUCE, and it is a whole item rather than a
 * bare label because the claim is that NOTHING on it is touched.
 *
 * `data` IS PRESENT AND IS SOMEBODY ELSE'S, which is the case that separates
 * `the handler recognises its own marker` from `the handler enriches anything
 * carrying data at all`. A member the protocol does not declare rides along
 * because an item rebuilt from the fields tsudoi knows would still look like a
 * completion item.
 */
const foreignItem = {
  label: "別のサーバーが持っている項目",
  data: { server: "some other language server", id: 7 },
  aMemberTheProtocolDoesNotDeclare: "kept",
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE PAIR: completion answered WITHOUT the stat, so an example whose
     * completion already carried it would demonstrate nothing about resolve.
     *
     * AND THE COMPLETION'S OWN `detail` IS ASSERTED AS A VALUE, not as `absent`
     * and not as `a string`: it is the path the user is entitled to read before
     * anything is resolved at all, and it is the FILE this session names.
     *
     * DEEP EQUALITY AGAINST THE ITEM AS IT WAS SENT, so `documentation` is the
     * ONLY difference -- `detail` BYTE-IDENTICAL INCLUDED, which is the shape any
     * `detail` written at resolve reddens. A handler that rebuilt the item,
     * dropped its `textEdit` or re-encoded its block fails here rather than
     * looking plausible.
     */
    test("a file item the example produced comes back from resolve carrying its size, its mtime and its kind", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample.txt");
        expect(item.detail).toBe(join(fixture.root, "sample.txt"));

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        expect(resolved).toEqual({
          ...item,
          documentation: { kind: "plaintext", value: fileBlock() },
        });
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * ITS OWN TEST, because a handler that says `file` about everything satisfies
     * the test above completely.
     *
     * THE LINE ALONE IS THIS TEST'S SUBJECT, and the whole answer is compared in
     * the listing test below rather than here: two tests asserting one deep
     * equality would mean the second could never be the first thing to fail.
     */
    test("a directory item comes back saying it is a directory, and carrying no size", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample-dir");
        expect(item.detail).toBe(join(fixture.root, "sample-dir"));

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        // READ OFF THE STAT LINE INSIDE THE BLOCK, WHICH IS WHERE THE CLAIM NOW
        // LIVES: left on `detail`, the refusal below would be reading an absolute
        // PATH and would be true on every machine whatever the stat said.
        const stat = statSection(blockOf(resolved));
        expect(stat).toBe(directoryStat);
        // A directory's `size` is its directory ENTRY's -- 64 on one machine and
        // 4096 on the next for the same children -- so reporting it would put a
        // number in front of a user that means nothing about the files inside.
        expect(stat).not.toContain("bytes");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * BOTH KINDS IN ONE SESSION, AND THE CLAIM INVERTED WITH THE CHANGE: a file's
     * block is no longer unmoved, because resolve now learns a stat about EVERY
     * kind. What replaces `unmoved` is the relation that matters to a reader
     * watching a popup re-render -- THE BLOCK ONLY EVER GAINS. What they have
     * already read does not move position.
     *
     * AND IT RETIRES AN ADMITTED WEAKNESS OF THE ARM IT REPLACES, which said in
     * so many words that it could not establish a rebuild ran for the FILE: a
     * passthrough was byte-identical there. It is not any more -- a file's block
     * grows too -- so the file half is a claim rather than a shape.
     *
     * WHOLE-VALUE ON BOTH ANSWERS, never a containment: a containment spelling
     * would pass against an answer that had REPLACED the block with the listing,
     * losing the attribution the user still needs. AND `{ ...item, documentation }`
     * RATHER THAN A READ OF ONE FIELD, which is what makes it say that `detail`
     * came back BYTE-IDENTICAL: any `detail` written at resolve reddens here.
     *
     * THE TWO ITEMS' BLOCKS ARE THE SAME BYTES AT COMPLETION TIME, so `detail` is
     * asserted for both -- without it this arm stops telling a file from a
     * directory before either is resolved, and the prefix relation below would
     * hold of two items nobody could distinguish.
     *
     * THIS ARM IS THE MEMBERSHIP WITNESS FOR HIDDEN ENTRIES AND NOT THE ORDER
     * ONE: the starvation the order exists to refuse needs a directory holding
     * more dotfiles than the bound, which this five-entry one is too small to be.
     */
    test("each kind's block only GAINS: what completion sent is a strict prefix of what resolve answers", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const items = await completedItems(session, fixture.root);
        const directory = itemFor(items, "sample-dir");
        const file = itemFor(items, "sample.txt");
        expect(file.documentation).toEqual({ kind: "plaintext", value: completedBlock });
        expect(directory.documentation).toEqual({ kind: "plaintext", value: completedBlock });
        expect([file.detail, directory.detail]).toEqual([
          join(fixture.root, "sample.txt"),
          join(fixture.root, "sample-dir"),
        ]);

        const resolvedDirectory = await session.request<CompletionItem>(
          "completionItem/resolve",
          directory,
        );
        const resolvedFile = await session.request<CompletionItem>("completionItem/resolve", file);

        expect(resolvedDirectory).toEqual({
          ...directory,
          documentation: { kind: "plaintext", value: directoryBlock() },
        });
        expect(resolvedFile).toEqual({
          ...file,
          documentation: { kind: "plaintext", value: fileBlock() },
        });

        // THE RELATION ITSELF, over the four values this session already holds,
        // and STRICT in both directions: `startsWith` alone is satisfied by an
        // answer that changed nothing, which is what the deleted-file arm's
        // subject looks like.
        for (const [sent, answered] of [
          [file, resolvedFile],
          [directory, resolvedDirectory],
        ] as const) {
          expect(blockOf(answered).startsWith(blockOf(sent))).toBe(true);
          expect(blockOf(answered).length).toBeGreaterThan(blockOf(sent).length);
        }
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * THE BOUND IS NOT SPELLED HERE: it counts the names that reached the client
     * and requires them to be fewer than the directory holds, because a test that
     * imported the number would agree only with itself.
     *
     * THE OTHER SIDE OF THE BOUND -- exactly the bound, under it, and empty -- is
     * asserted in this package's own suite, where the edge can be STAGED from the
     * count just read.
     */
    test("a directory holding far more entries than fit renders a bounded prefix and states its total", async () => {
      const fixture = crowdedTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample-crowd");

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        const section = listingSection(blockOf(resolved));
        // The pair for the bound: an answer carrying no names at all satisfies
        // every equality below.
        expect(section.names.length).toBeGreaterThan(0);
        expect(section.names.length).toBeLessThan(crowd.length);
        expect(section.header).toBe(`30 entries, first ${String(section.names.length)} shown`);
        expect(section.names).toEqual(crowd.slice(0, section.names.length));
        // And the facts the block carried before are still in front of the
        // listing rather than displaced by it.
        expect(resolved.documentation).toEqual({
          kind: "plaintext",
          value: `${completedBlock}\n\n${directoryStat}\n\n${section.header}\n\n${section.names.join("\n")}`,
        });
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * BOTH KINDS ARE ARMS, and the file is the one that matters: a rebuild firing
     * only for directories would answer a FILE with the client's own text. The
     * two forgeries differ so neither arm can be satisfied by the other's
     * expectation.
     *
     * WHAT IT DOES NOT CLOSE, said plainly because the shape invites the reading:
     * the mark stays forgeable and unvalidated. What is fixed is narrower -- the
     * ANSWER is built from what the handler read, not from what it was sent.
     */
    test("an item whose block was tampered with is answered with a rebuilt one, for either kind", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const items = await completedItems(session, fixture.root);
        const forgedDirectory = {
          ...itemFor(items, "sample-dir"),
          documentation: { kind: "plaintext", value: "偽の説明 forged-directory-text" },
        };
        // A DIFFERENT SHAPE ON THIS ONE: `documentation` may be a bare string, so
        // what arrives is not even guaranteed to be an object.
        const forgedFile = { ...itemFor(items, "sample.txt"), documentation: "forged-file-text" };

        const answeredDirectory = await session.request<CompletionItem>(
          "completionItem/resolve",
          forgedDirectory,
        );
        const answeredFile = await session.request<CompletionItem>(
          "completionItem/resolve",
          forgedFile,
        );

        expect(answeredDirectory.documentation).toEqual({
          kind: "plaintext",
          value: directoryBlock(),
        });
        expect(answeredFile.documentation).toEqual({
          kind: "plaintext",
          value: fileBlock(),
        });
        expect(JSON.stringify([answeredDirectory, answeredFile])).not.toContain("forged");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * THE PAIRING IS WHAT MAKES THIS MEASURE ANYTHING AT ALL: `it came back
     * unchanged` is satisfied by three worlds -- the handler doing the right
     * thing, tsudoi echoing the request's params, and no handler being called in
     * this process at all -- and the three produce THE SAME BYTES. So the
     * enrichment is observed FIRST, IN THIS SESSION.
     *
     * THE LIVENESS HALF IS A `documentation` DELTA, AND IT HAD TO MOVE FIELDS OR
     * IT WOULD HAVE STOPPED MEASURING ANYTHING WITHOUT SAYING SO. It read `a
     * detail appeared, not which` -- and completion now writes the path there, so
     * that line is satisfied UNCONDITIONALLY, by a server whose resolve handler
     * enriches nothing at all. MEASURED: with the handler answering every
     * unaborted request untouched, this arm was one of two in this file that
     * stayed green.
     *
     * DELIBERATELY WEAKER THAN THE PIN ABOVE AND NOT AN EQUALITY: it says the
     * block GREW, not which bytes it grew by, so this test's subject stays the
     * item it declines rather than the string the handler composes.
     *
     * STRICT, WHICH IS THE HALF THAT MAKES IT A MEASUREMENT: `startsWith` alone
     * is satisfied by an empty delta, which is exactly the state above.
     */
    test("an item the example never produced is returned untouched, in a session where enrichment is happening", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const own = itemFor(await completedItems(session, fixture.root), "sample.txt");
        const enriched = await session.request<CompletionItem>("completionItem/resolve", own);
        expect(blockOf(enriched).startsWith(blockOf(own))).toBe(true);
        expect(blockOf(enriched).length).toBeGreaterThan(blockOf(own).length);

        const answered = await session.request<CompletionItem>(
          "completionItem/resolve",
          foreignItem,
        );

        expect(answered).toEqual(foreignItem);
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * THE DEGENERATE IS THE OBVIOUS IMPLEMENTATION: one `try` around both reads
     * answers with the bare item and throws away a `stat` that succeeded.
     *
     * THE ARM ESTABLISHES ITS OWN PREMISE BEFORE IT ASSERTS ANYTHING, because on
     * a runner where the permission does not bite -- one running as root -- every
     * assertion below passes while measuring the ordinary directory case.
     *
     * PAIRED IN ONE SESSION WITH A LISTABLE DIRECTORY, because `no listing in the
     * block` is also what a server that never listed anything produces.
     */
    test("a directory that cannot be listed keeps the stat line its stat produced", async () => {
      const fixture = lockedTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const locked = join(fixture.root, "sample-locked");
        let listingRejected = false;
        try {
          await readdir(locked);
        } catch {
          listingRejected = true;
        }
        expect(listingRejected).toBe(true);

        const items = await completedItems(session, fixture.root);
        const lockedItem = itemFor(items, "sample-locked");
        const openItem = itemFor(items, "sample-open");

        const answeredOpen = await session.request<CompletionItem>(
          "completionItem/resolve",
          openItem,
        );
        const answeredLocked = await session.request<CompletionItem>(
          "completionItem/resolve",
          lockedItem,
        );

        // The listable one first: it says a listing is reaching the block in this
        // session at all.
        expect(answeredOpen.documentation).toEqual({
          kind: "plaintext",
          value: `${completedBlock}\n\n${directoryStat}\n\n1 entry\n\nvisible.txt`,
        });
        expect(answeredLocked).toEqual({
          ...lockedItem,
          documentation: {
            kind: "plaintext",
            value: `${completedBlock}\n\n${directoryStat}`,
          },
        });
        // Nor was the failure narrated: a handler logging every unreadable
        // directory would put a line in the editor's log for each one a user
        // scrolls past.
        expect(session.stderr).toBe("");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * ONE ITEM, ONE SESSION, READ BEFORE AND AFTER, so the only thing that changed
     * between the two answers is that the file stopped existing. The first two
     * assertions are the liveness half: without them this passes against a server
     * whose handler was never called.
     *
     * A `documentation` DELTA AND DELIBERATELY NOT AN EQUALITY, for the reason the
     * arm above gives: this test's subject is the answer for a path that has GONE,
     * and pinning the bytes of the answer for the path that had not would make a
     * change to the block's spelling redden here as well as where it belongs.
     * What the delta needs is a state where it is EMPTY, and that state is this
     * arm's own second half -- which is why the two are read the same way.
     */
    test("an item whose file is deleted between completion and resolve comes back unenriched rather than failing", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample.txt");
        const enriched = await session.request<CompletionItem>("completionItem/resolve", item);
        expect(blockOf(enriched).startsWith(blockOf(item))).toBe(true);
        expect(blockOf(enriched).length).toBeGreaterThan(blockOf(item).length);

        rmSync(join(fixture.root, "sample.txt"));
        const answered = await session.request<CompletionItem>("completionItem/resolve", item);

        expect(answered).toEqual(item);
        expect(session.stderr).toBe("");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });
  });
}
