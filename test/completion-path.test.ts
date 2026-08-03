import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CompletionItem, InitializeResult } from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { frameworkRoot } from "./helpers/spawn.ts";
import { tree } from "./helpers/tree.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT A CLIENT RECEIVES FROM AN INSTALLED PATH COMPLETION, which is the only
 * place the streaming property is observable at all.
 *
 * THE HANDLER'S OWN CLAIMS ARE NOT HERE AND THAT IS THE SPLIT WORTH KNOWING:
 * `@atusy/tsudoi-completion-path` is a workspace member, and what its modules
 * produce is asserted inside that package against ITS OWN SOURCE. Nothing at the
 * repository root may import a member's source, and THE REASON THIS SENTENCE
 * GAVE IS THE THIRD COPY OF ONE SUPERSEDED IN SPRINT 61 -- it said the root type
 * check excludes the members precisely so it cannot answer their imports through
 * its own `paths` mapping. There is no mapping anywhere in this repository, so
 * that is not what the exclusion buys.
 *
 * WHAT IT BUYS INSTEAD, and the reason the rule here is unchanged: `exclude`
 * stops a member's files being SWEPT IN, and without it every member's source is
 * graded under the ROOT'S options and the ROOT'S resolution -- a grade no
 * consumer's build ever takes, read as one because it is green. A relative
 * import from here reaches that same grade by the door `exclude` does not close,
 * MODULE RESOLUTION, which is why the rule is about imports and not about the
 * config. test/package-shape.test.ts is where the exclusion's own reason lives.
 *
 * WHAT IS LEFT HERE IS THE PART THAT IS NOT ABOUT THE MODULE AT ALL: batches
 * leaving the process as `$/progress`, under BOTH runtimes, from a config that
 * reaches the handler by PACKAGE SPECIFIER out of node_modules.
 */

/**
 * The batch size the package streams at, WRITTEN DOWN HERE because it is
 * unpublished and this side of the boundary cannot import it.
 *
 * A DISAGREEMENT IS LOUD RATHER THAN SILENT, which is what makes the duplication
 * acceptable: change the number inside the package and the batch-shape assertion
 * below fails naming both, where a derived expectation would agree with any
 * number the package chose -- including one that had stopped batching.
 */
const batchSize = 100;

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));
const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const partialResultToken = "path-completion-partial-1";

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // THE STREAMING PROPERTY, and nothing else can catch its loss: a module
    // that collected the whole listing and returned it satisfies every content
    // assertion in this file while discarding the streaming altogether.
    //
    // ONE directory with more entries than one batch holds. That is why
    // batching survives the per-segment foreclosure -- no walk is needed for a
    // directory to be too big to hand over in one message.
    test("each batch of a large directory reaches the client as its own $/progress", async () => {
      const count = batchSize * 2 + 1;
      const names = Array.from({ length: count }, (_, index) => `entry-${String(index)}.txt`);
      const fixture = tree(names);
      // startCommand, not start: `start` runs the acceptance criterion's own
      // command form, whose CLI path is relative to the repo -- and the whole
      // point here is a cwd that is NOT the repo. The route is otherwise
      // identical, spelled absolutely.
      const session = LspSession.startCommand(
        `${runtime.command} ${runtime.runArgs.join(" ")} ${join(frameworkRoot, "src", "cli.ts")} --config ${demoConfig}`,
        fixture.root,
      );
      try {
        await session.request<InitializeResult>("initialize", initializeParams);
        session.notify("initialized", {});
        // The document sits IN cwd, so both relative sources list the same
        // directory and the second one's items are all deduplicated away --
        // which is why the batch count below is the listing's and not twice it.
        const uri = pathToFileURL(join(fixture.root, "doc.txt")).href;
        session.notify("textDocument/didOpen", {
          textDocument: { uri, languageId: "plaintext", version: 1, text: "entry-" },
        });

        const result = await session.request<null>("textDocument/completion", {
          textDocument: { uri },
          position: { line: 0, character: "entry-".length },
          partialResultToken,
        });

        // THE CONTENT FIRST, and the order is the point: a module that
        // collected the whole listing and handed it over in one message passes
        // everything in this block and fails the next one. Asserting the
        // batching first would flip here and leave `and it is all there`
        // undefended, so the two are in the order that separates them.
        //
        // Every entry exactly once across every batch: a count alone would be
        // satisfied by a module that streamed the same batch three times.
        //
        // EVERY LITERAL IS A BATCH OF ITEMS AND THEY ARE ALL THE SAME SHAPE, so
        // reading one takes no case analysis on the position it arrived in. THE
        // BATCHING CLAIM BELOW DOES NOT DEPEND ON THAT EITHER WAY: it reads
        // every literal alike, which is why a change to the shape moves no
        // assertion here.
        const streamed = session.progress.flatMap((progress) => progress.value as CompletionItem[]);
        expect(streamed.map((item) => item.insertText).sort()).toEqual([...names].sort());

        // SIZES, not membership: nothing sorts the listing -- sorting would
        // require collecting it, which is the property under test -- so which
        // entry lands in which batch is the filesystem's business.
        const batches = session.progress.map(
          (progress) => (progress.value as CompletionItem[]).length,
        );
        expect(batches).toEqual([batchSize, batchSize, 1]);
        expect(session.progress.map((progress) => progress.token)).toEqual(
          batches.map(() => partialResultToken),
        );
        // The batches have already left; the response adds nothing to them, and
        // `null` is what `empty in terms of result values` is spelled as here.
        expect(result).toBeNull();
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });
  });
}
