import { describe, expect, test } from "bun:test";
import { rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { frameworkRoot } from "./helpers/spawn.ts";
import { tree, type Tree } from "./helpers/tree.ts";

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/**
 * THE FILE'S CONTENT IS MULTIBYTE ON PURPOSE, exactly as the trailing-whitespace
 * fixture is: `size` is BYTES, and every ASCII file satisfies a byte reading and
 * a UTF-16 reading at once. `サンプル` is 4 units and 12 UTF-8 bytes, so the
 * newline takes it to THIRTEEN BYTES and FIVE UNITS -- two numbers that cannot
 * be confused for each other.
 */
const fileText = "サンプル\n";

/**
 * The mtime this test SETS, so the expected strings below are hand-written
 * rather than read back out of a second `stat`.
 *
 * A WHOLE SECOND, which is not fussiness: filesystems disagree about sub-second
 * precision -- APFS keeps nanoseconds, some ext4 mounts keep none -- so a
 * fractional stamp is a value the disk may legally hand back rounded. On a whole
 * second every filesystem this suite runs on returns what was written.
 */
const mtime = new Date("2001-02-03T04:05:06.000Z");

/**
 * What the example must put on a FILE item, WRITTEN OUT RATHER THAN COMPUTED.
 * Both sides calling `stat` would make a correct reading and a consistently
 * broken one produce the same observation; 13 is counted by hand above and the
 * stamp is the one this test set.
 */
const fileDetail = "file · 13 bytes · modified 2001-02-03T04:05:06.000Z";

/**
 * And what it must put on a DIRECTORY item. NO SIZE, and that is the example's
 * decision rather than an omission here -- the reason is at the handler, and
 * this assertion is what makes it a decision the suite can see.
 */
const directoryDetail = "directory · modified 2001-02-03T04:05:06.000Z";

/** What the document's one line reads: the prefix both entries share. */
const prefix = "sample";

/**
 * A tree holding one file and one directory whose names share `prefix`, so ONE
 * completion request produces both items and the two answers are about the same
 * listing at the same moment.
 *
 * THE DIRECTORY HOLDS CHILDREN AND IT USED TO BE EMPTY, which is a defect
 * repaired rather than a fixture enriched: with nothing inside it, `an empty
 * listing` and `no listing at all` produce THE SAME BYTES, so an arm asserting
 * that a directory's entries reach the client would have measured nothing.
 *
 * THEY ARE CREATED BEFORE THE TIMESTAMPS ARE FIXED, and the order is
 * load-bearing: writing into a directory bumps its mtime, and the expected
 * detail string below carries that stamp.
 *
 * ONE OF THEM IS HIDDEN, because `hidden entries are shown` is a ruling with no
 * witness unless a fixture holds one. THREE NAMES WHOSE THREE ORDERS DIFFER --
 * created `beta.txt`, `.hidden`, `alpha`, sorted `.hidden`, `alpha`, `beta.txt`
 * -- so an answer that echoed creation order, or whatever order the filesystem
 * keeps, cannot pass the whole-value assertion by coincidence.
 */
function sampleTree(): Tree {
  const fixture = tree([
    "sample.txt",
    "sample-dir/beta.txt",
    "sample-dir/.hidden",
    "sample-dir/alpha/",
  ]);
  writeFileSync(join(fixture.root, "sample.txt"), fileText);
  // Access time as well, because `utimes` takes both and there is no arm that
  // sets one; nothing here reads atime.
  utimesSync(join(fixture.root, "sample.txt"), mtime, mtime);
  utimesSync(join(fixture.root, "sample-dir"), mtime, mtime);
  return fixture;
}

/**
 * The multi-line block the answer must carry for the FILE item, WRITTEN OUT
 * rather than composed from the module's own parts.
 *
 * PLAINTEXT BECAUSE THE SESSION DECLARED NOTHING: this suite's initialize params
 * carry no capabilities at all, so the client named no documentation format and
 * a server that sent markdown would be sending syntax nobody said they render.
 *
 * `source: document` AND NOT `cwd`, though both roots are this fixture: items
 * dedup by inserted text and the document's own directory is asked first, so the
 * survivor is the document's.
 */
function fileBlock(root: string): string {
  return `${join(root, "sample.txt")}\n\nsource: document`;
}

/**
 * And for the DIRECTORY item: the same two facts, plus what is inside it.
 *
 * THE COUNT IS IN THE BLOCK AND NOT ON `detail`, so exactly one number about
 * this directory exists and two cannot disagree.
 */
function directoryBlock(root: string): string {
  return `${join(root, "sample-dir")}\n\nsource: document\n\n3 entries\n\n.hidden\nalpha\nbeta.txt`;
}

/** The demo config, started with its working directory INSIDE the fixture. */
function startDemo(runtime: (typeof runtimes)[number], cwd: string): LspSession {
  // startCommand rather than start, for test/completion-path.test.ts's reason: the
  // route `start` runs names the CLI relative to the repo, and the whole point
  // of this fixture is a cwd that is not the repo.
  return LspSession.startCommand(
    `${runtime.command} ${runtime.runArgs.join(" ")} ${join(frameworkRoot, "src", "cli.ts")} --config ${demoConfig}`,
    cwd,
  );
}

/**
 * Every item the demo config's own completion produced for `prefix` in `root`.
 *
 * THE ITEMS COME FROM THE SERVER RATHER THAN FROM A LITERAL, which is the whole
 * claim these tests are about: `completionItem/resolve` asks about an item the
 * CLIENT holds, and the only item a client holds is one completion gave it. An
 * item assembled here would test the handler against a shape this example might
 * no longer produce.
 */
async function completedItems(session: LspSession, root: string): Promise<CompletionItem[]> {
  await session.request<InitializeResult>("initialize", initializeParams);
  session.notify("initialized", {});
  const uri = pathToFileURL(join(root, "doc.txt")).href;
  session.notify("textDocument/didOpen", {
    textDocument: { uri, languageId: "plaintext", version: 1, text: prefix },
  });
  // No partialResultToken: every batch is aggregated into the response, which
  // is the shape a client without partial-result support receives, so the
  // response IS the whole list.
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
 * carrying data at all`. A member the protocol does not declare rides along for
 * the reason test/resolve.test.ts states: a tsudoi -- or an example -- that
 * rebuilt the item from the fields it knows would produce something that still
 * looks like a completion item.
 */
const foreignItem = {
  label: "別のサーバーが持っている項目",
  data: { server: "some other language server", id: 7 },
  aMemberTheProtocolDoesNotDeclare: "kept",
};

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE METHOD'S WHOLE PURPOSE, IN THE ORDER THAT SHOWS IT. The first
     * assertion is that completion answered WITHOUT the detail: a `stat` per
     * entry is what a large directory cannot afford, and an example whose
     * completion already carried it would demonstrate nothing about resolve. The
     * second is that the detail arrives when -- and only when -- the user
     * highlights the item.
     *
     * DEEP EQUALITY AGAINST THE ITEM AS IT WAS SENT, so `detail` is the ONLY
     * difference: a handler that rebuilt the item, dropped its `textEdit` or
     * re-encoded its documentation fails here rather than merely looking
     * plausible.
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
     * DIR-OR-FILE OWNS ITS OWN TEST, because a handler that says `file` about
     * everything satisfies the test above completely. The same listing produces
     * both items, so nothing here turns on which directory was walked.
     *
     * NO SIZE ON THIS ONE, asserted rather than left to the handler's discretion:
     * a directory's `size` is the size of its directory entry, which is the
     * filesystem's business -- 64 on one machine and 4096 on the next for the
     * same two children -- and reporting it would put a number in front of a user
     * that means nothing about the files inside. THE LISTING BELOW IS WHAT MAKES
     * THAT REFUSAL AFFORDABLE and does not reverse it: a count of children is
     * what the directory ENTRY's byte size failed to be.
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
        // The mistake the refusal names, spelled out: a size on this line reddens
        // here rather than being caught by a reader.
        expect(resolved.detail).not.toContain("bytes");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });

    /**
     * WHAT THE USER HIGHLIGHTED A DIRECTORY TO FIND OUT, and the arm the whole
     * item is compared in: the answer REPLACES the item in the client's list, so
     * an answer that is not the item drops the entry they are looking at.
     *
     * BOTH KINDS IN ONE SESSION, which is what makes the file half mean
     * anything. `the file's block is unchanged` is satisfied by a server that
     * writes no block at all, and by one that was never asked -- so the
     * directory's block is observed CHANGING first, in this session, and only
     * then does the file's byte-identity say that a rebuild ran and produced
     * exactly what completion had already produced.
     *
     * WHOLE-VALUE ON THE NAMES, never a containment: sorted by code unit is the
     * only reading a `toEqual` can be written against at all, and a containment
     * spelling would pass against an answer that had REPLACED the block with the
     * listing -- losing the path and the attribution the user still needs.
     *
     * HIDDEN ENTRIES ARE IN IT, UNFILTERED: the completion half already offers
     * dotfiles, so a block that hid them would make the two halves of one package
     * disagree about one directory.
     */
    test("a directory item's block carries what is inside it, while a file item's block is unmoved", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const items = await completedItems(session, fixture.root);
        const directory = itemFor(items, "sample-dir");
        const file = itemFor(items, "sample.txt");
        // What completion put there, before anything resolves: the block the
        // file's answer must come back byte-identical to.
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
     * THE BLOCK ARRIVES FROM THE CLIENT EXACTLY AS THE MARK DOES, and this is the
     * arm that says the answer is not assembled out of it. A resolve request
     * carries whatever the client chose to send back -- an editor that rewrote
     * the block, a middleware that mangled it, a client that stripped it
     * entirely -- and the answer is decided by the path and the session instead.
     *
     * BOTH KINDS ARE ARMS, and the file is the one that matters: a rebuild firing
     * only for directories would answer a FILE with the client's own text, which
     * is exactly what this refuses. The two forgeries differ so neither arm can
     * be satisfied by the other's expectation.
     *
     * IT IS ALSO THE DISCRIMINATOR FOR THE RULING ITSELF: under an implementation
     * that APPENDED a listing to what came back, this cannot pass.
     *
     * WHAT IT DOES NOT CLOSE, said plainly because the shape invites the reading:
     * the mark stays forgeable and unvalidated, for the reason written at the
     * handler. What is fixed is narrower -- the ANSWER is built from what the
     * handler read, not from what it was sent.
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
        // A DIFFERENT SHAPE ON THIS ONE: `documentation` may be a bare string,
        // so the item that arrives is not even guaranteed to be an object.
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
     * THE ITEM THE EXAMPLE DID NOT PRODUCE, AND THE PAIRING IS WHAT MAKES THIS
     * MEASURE ANYTHING AT ALL. `it came back unchanged` is satisfied by three
     * different worlds -- the handler doing the right thing, tsudoi echoing the
     * request's params, and no handler being called in this process at all --
     * and the three produce THE SAME BYTES. So the enrichment is observed FIRST,
     * IN THIS SESSION, and only then does the absence mean the handler looked at
     * the item and declined it.
     *
     * THE FIRST ASSERTION IS DELIBERATELY WEAKER THAN THE PIN ABOVE: it says a
     * detail appeared, not which, so this test's subject stays the item it
     * declines rather than the string it composes.
     *
     * WHY THE HANDLER CAN ONLY KEY OFF ITS OWN MARK: tsudoi keeps NO record of
     * what a completion handler produced -- src/types.ts rules it -- so an
     * example cannot ask tsudoi whether an item is one of its own. What it put
     * on the item is the only thing that comes back.
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
     * THE PATH CAN BE GONE BY THE TIME THE USER HIGHLIGHTS THE ITEM, which is not
     * an edge case: a completion popup outlives a `git checkout` in another
     * window. The item comes back as it went, because a rejected `stat` that
     * escaped would be answered -32603 and would take away the popup the user is
     * reading -- the same reasoning that makes an unreadable directory contribute
     * nothing to completion instead of failing it.
     *
     * ONE ITEM, ONE SESSION, MEASURED BEFORE AND AFTER, so the only thing that
     * changed between the two answers is that the file stopped existing. The
     * first assertion is again the liveness half: without it this passes against
     * a server whose handler was never called.
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
        // And the failure was not diagnosed onto stderr on the way past: a
        // handler narrating a path that no longer exists would put a line in the
        // editor's log for every stale item a user scrolls through.
        expect(session.stderr).toBe("");
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });
  });
}
