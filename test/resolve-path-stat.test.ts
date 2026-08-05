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
 * What the example must put on a FILE item, WRITTEN OUT RATHER THAN COMPUTED:
 * both sides calling `stat` would make a correct reading and a consistently
 * broken one produce the same observation.
 */
const fileDetail = "file · 13 bytes · modified 2001-02-03T04:05:06.000Z";

/** And what it must put on a DIRECTORY item. */
const directoryDetail = "directory · modified 2001-02-03T04:05:06.000Z";

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
 * The multi-line block the answer must carry for the FILE item, WRITTEN OUT
 * rather than composed from the module's own parts.
 *
 * PLAINTEXT BECAUSE THE SESSION DECLARED NOTHING: this suite's initialize params
 * carry no capabilities at all, so the client named no documentation format.
 *
 * `source: document` AND NOT `cwd`, though both roots are this fixture: items
 * dedup by inserted text and the document's own directory is asked first.
 */
function fileBlock(root: string): string {
  return `${join(root, "sample.txt")}\n\nsource: document`;
}

/**
 * And for the DIRECTORY item: the same two facts, plus what is inside it.
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
function directoryBlock(root: string): string {
  return `${join(root, "sample-dir")}\n\nsource: document\n\n5 entries\n\nZeta.txt\nalpha\nbeta.txt\n.Zed\n.hidden`;
}

/**
 * A tree whose one directory holds far more entries than any answer renders,
 * with the names ZERO-PADDED so that creation order, expected order and a
 * code-unit sort are the same list.
 */
const crowd = Array.from({ length: 30 }, (_, index) => `c${String(index).padStart(3, "0")}.txt`);

function crowdedTree(): Tree {
  return tree(crowd.map((name) => `sample-crowd/${name}`));
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
  chmodSync(locked, 0o000);
  return {
    root: fixture.root,
    dispose: (): void => {
      chmodSync(locked, 0o700);
      fixture.dispose();
    },
  };
}

/**
 * The listing part of a block: its header line, and the names under it.
 *
 * DUPLICATED IN THE MEMBER'S OWN SUITE, because a member reaching into the root's
 * helpers stops being checkable on its own. WHAT THE TWO MUST NOT DO IS DISAGREE:
 * an absent names part is NO names here, not one empty name, which is how the
 * empty-directory answer reads -- a case asserted there rather than here.
 */
function listingSection(block: string): { header: string; names: string[] } {
  const [header = "", names] = block.split("\n\n").slice(2);
  return { header, names: names === undefined ? [] : names.split("\n") };
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
     * THE PAIR: completion answered WITHOUT the detail, so an example whose
     * completion already carried it would demonstrate nothing about resolve.
     *
     * DEEP EQUALITY AGAINST THE ITEM AS IT WAS SENT, so `detail` is the ONLY
     * difference: a handler that rebuilt the item, dropped its `textEdit` or
     * re-encoded its documentation fails here rather than looking plausible.
     */
    test("a file item the example produced comes back from resolve carrying its size, its mtime and its kind", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample.txt");
        expect(item.detail).toBeUndefined();

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        expect(resolved).toEqual({ ...item, detail: fileDetail });
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
        expect(item.detail).toBeUndefined();

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        expect(resolved.detail).toBe(directoryDetail);
        // A directory's `size` is its directory ENTRY's -- 64 on one machine and
        // 4096 on the next for the same children -- so reporting it would put a
        // number in front of a user that means nothing about the files inside.
        expect(resolved.detail).not.toContain("bytes");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * BOTH KINDS IN ONE SESSION, AND WHAT THE PAIRING DOES AND DOES NOT ESTABLISH
     * IS WRITTEN OUT BECAUSE THE OBVIOUS READING OF IT IS FALSE. The directory's
     * block is observed CHANGING first, and what that buys is liveness: `the file
     * came back with the block it went out with` is otherwise satisfied by a
     * server that writes no block at all, and by one that was never asked.
     *
     * IT DOES NOT ESTABLISH THAT A REBUILD RAN FOR THE FILE: an implementation
     * that rebuilt for directories alone and PASSED A FILE'S BLOCK THROUGH stays
     * green here, because a passthrough is byte-identical too. What establishes
     * the rebuild is the tampering arm below.
     *
     * WHOLE-VALUE ON THE NAMES, never a containment: a containment spelling would
     * pass against an answer that had REPLACED the block with the listing --
     * losing the path and the attribution the user still needs.
     *
     * THIS ARM IS THE MEMBERSHIP WITNESS FOR HIDDEN ENTRIES AND NOT THE ORDER
     * ONE: the starvation the order exists to refuse needs a directory holding
     * more dotfiles than the bound, which this three-entry one is too small to be.
     */
    test("a directory item's block carries what is inside it, while a file item's block is unmoved", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const items = await completedItems(session, fixture.root);
        const directory = itemFor(items, "sample-dir");
        const file = itemFor(items, "sample.txt");
        expect(file.documentation).toEqual({ kind: "plaintext", value: fileBlock(fixture.root) });

        const resolvedDirectory = await session.request<CompletionItem>(
          "completionItem/resolve",
          directory,
        );
        const resolvedFile = await session.request<CompletionItem>("completionItem/resolve", file);

        expect(resolvedDirectory).toEqual({
          ...directory,
          detail: directoryDetail,
          documentation: { kind: "plaintext", value: directoryBlock(fixture.root) },
        });
        expect(resolvedFile).toEqual({ ...file, detail: fileDetail });
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

        const section = listingSection(
          typeof resolved.documentation === "string" ? "" : (resolved.documentation?.value ?? ""),
        );
        // The pair for the bound: an answer carrying no names at all satisfies
        // every equality below.
        expect(section.names.length).toBeGreaterThan(0);
        expect(section.names.length).toBeLessThan(crowd.length);
        expect(section.header).toBe(`30 entries, first ${String(section.names.length)} shown`);
        expect(section.names).toEqual(crowd.slice(0, section.names.length));
        // And the two facts the block carried before are still in front of the
        // listing rather than displaced by it.
        expect(resolved.documentation).toEqual({
          kind: "plaintext",
          value: `${join(fixture.root, "sample-crowd")}\n\nsource: document\n\n${section.header}\n\n${section.names.join("\n")}`,
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
          value: directoryBlock(fixture.root),
        });
        expect(answeredFile.documentation).toEqual({
          kind: "plaintext",
          value: fileBlock(fixture.root),
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
     * THE FIRST ASSERTION IS DELIBERATELY WEAKER THAN THE PIN ABOVE: it says a
     * detail appeared, not which, so this test's subject stays the item it
     * declines rather than the string it composes.
     */
    test("an item the example never produced is returned untouched, in a session where enrichment is happening", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const own = itemFor(await completedItems(session, fixture.root), "sample.txt");
        const enriched = await session.request<CompletionItem>("completionItem/resolve", own);
        expect(typeof enriched.detail).toBe("string");

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
    test("a directory that cannot be listed keeps the detail its stat produced", async () => {
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
          value: `${join(fixture.root, "sample-open")}\n\nsource: document\n\n1 entry\n\nvisible.txt`,
        });
        expect(answeredLocked).toEqual({
          ...lockedItem,
          detail: directoryDetail,
          documentation: { kind: "plaintext", value: `${locked}\n\nsource: document` },
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
     * between the two answers is that the file stopped existing. The first
     * assertion is the liveness half: without it this passes against a server
     * whose handler was never called.
     */
    test("an item whose file is deleted between completion and resolve comes back unenriched rather than failing", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample.txt");
        const enriched = await session.request<CompletionItem>("completionItem/resolve", item);
        expect(enriched.detail).toBe(fileDetail);

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
