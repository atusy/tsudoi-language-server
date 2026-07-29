import { describe, expect, test } from "bun:test";
import { rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  CompletionItem,
  CompletionList,
  InitializeResult,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { repoRoot } from "./helpers/spawn.ts";
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
 */
function sampleTree(): Tree {
  const fixture = tree(["sample.txt", "sample-dir/"]);
  writeFileSync(join(fixture.root, "sample.txt"), fileText);
  // Access time as well, because `utimes` takes both and there is no arm that
  // sets one; nothing here reads atime.
  utimesSync(join(fixture.root, "sample.txt"), mtime, mtime);
  utimesSync(join(fixture.root, "sample-dir"), mtime, mtime);
  return fixture;
}

/** The demo config, started with its working directory INSIDE the fixture. */
function startDemo(runtime: (typeof runtimes)[number], cwd: string): LspSession {
  // startCommand rather than start, for completion-path.test.ts's reason: the
  // route `start` runs names the CLI relative to the repo, and the whole point
  // of this fixture is a cwd that is not the repo.
  return LspSession.startCommand(
    `${runtime.command} ${runtime.runArgs.join(" ")} ${join(repoRoot, "src", "cli.ts")} --config ${demoConfig}`,
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
  // No partialResultToken: the answer and every chunk are merged into the
  // response, which is the shape a client without partial-result support
  // receives. Since Sprint 42 that response is a `CompletionList`, so the items
  // come off `.items`.
  const answer = await session.request<CompletionList | null>("textDocument/completion", {
    textDocument: { uri },
    position: { line: 0, character: prefix.length },
  });
  return answer?.items ?? [];
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
     * that means nothing about the files inside.
     */
    test("a directory item comes back saying it is a directory, and carrying no size", async () => {
      const fixture = sampleTree();
      const session = startDemo(runtime, fixture.root);
      try {
        const item = itemFor(await completedItems(session, fixture.root), "sample-dir");
        expect(item.detail).toBeUndefined();

        const resolved = await session.request<CompletionItem>("completionItem/resolve", item);

        expect(resolved).toEqual({ ...item, detail: directoryDetail });
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
