import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CompletionItemKind,
  type CompletionItem,
  type Hover,
  type InitializeResult,
  type MarkupContent,
} from "vscode-languageserver-protocol";
import { exampleSources, installConsumer } from "./helpers/install.ts";
import { initializeParams, LspSession } from "./helpers/lsp.ts";
import { runCommand } from "./helpers/spawn.ts";

/**
 * A CONFIG AUTHOR GETS THE HANDLER PACKAGES BY INSTALLING THEM, NOT BY COPYING
 * THEM.
 *
 * WHAT MAKES THIS DIFFERENT FROM EVERY OTHER CONSUMER PROBE IN THIS SUITE, and
 * it is the whole reason the file exists: the others write the example's own
 * BYTES into a throwaway project and then ask whether they work there. That
 * measures a copy. Here the config's only mention of the handler is a PACKAGE
 * SPECIFIER, the package arrives as its own tarball packed out of this checkout,
 * and the project receives none of its source at all.
 *
 * BOTH DIRECTIONS IN ONE MEASUREMENT, per the standing rule for an absence: the
 * hover ANSWERS WITH A DEFINITION and the project HOLDS NO HANDLER SOURCE. Either
 * alone is satisfied by the wrong tree -- a project with the file copied in
 * answers too, and a project where nothing works holds no source either.
 *
 * BUN ONLY, AND THE DENO HALF IS NAMED RATHER THAN ASSUMED, because a one-runtime
 * measurement in a two-runtime project is narrower than its wording. What is
 * runtime-specific about this claim is already covered:
 * `deno serves the example's dictionary hover from the installed copy` in
 * test/installed-runtime.test.ts drives the SAME consumer layout and the SAME
 * config, which reaches this handler by package specifier, under deno. That
 * matters more than usual here -- this package ships dist/ and no source arm
 * PRECISELY BECAUSE deno refuses to type-strip under node_modules -- so the
 * design's own premise is exercised there and not here. What this file adds is
 * the two things that are not about a runtime at all: the absence of source, and
 * the negative control.
 */

/** The word the probe points at, and the buffer holding it at line 0, column 0. */
const word = "apple";

/**
 * What a consumer's own directory holds, node_modules aside, at any depth.
 *
 * node_modules IS EXCLUDED AND THAT IS THE POINT RATHER THAN A CONVENIENCE: the
 * handler package is INSTALLED, so of course it is under there -- as compiled
 * dist/, which its own `files` field limits it to. The claim is about the
 * author's own tree, which is where a copied example would land and where this
 * one must not.
 */
function authorsOwnFiles(dir: string): readonly string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") {
      continue;
    }
    if (entry.isDirectory()) {
      found.push(...authorsOwnFiles(join(dir, entry.name)));
    } else {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

/** The consumer's config, its own files written, ready to be driven. */
async function consumerRunningTheExample(omitHandler?: string): Promise<{
  dir: string;
  files: readonly string[];
  dispose: () => void;
}> {
  const consumer = await installConsumer(omitHandler === undefined ? {} : { omitHandler });
  for (const [path, source] of Object.entries(exampleSources())) {
    consumer.write(path, source);
  }
  return {
    dir: consumer.dir,
    files: authorsOwnFiles(consumer.dir),
    dispose: consumer.dispose,
  };
}

test("an installed consumer answers a real hover, from a project holding no handler source", async () => {
  const consumer = await consumerRunningTheExample();
  try {
    // THE ABSENCE, TAKEN FIRST so a failure below cannot be read as having
    // cleared it. NAMED rather than counted: a violating file appears in the
    // failure text, where `0 files` would only say a number moved.
    expect(consumer.files.filter((path) => path.includes("hover-wordnet"))).toEqual([]);
    // AND BY CONTENT, because the claim is `no byte of the handler's source` and
    // the line above only measures `no file called that`. A copy under another
    // name is exactly what a reader who half-followed the README would produce,
    // and it passes a name check while failing the property.
    //
    // `wordAt` IS THE NEEDLE AND THE FIRST CHOICE WAS WRONG, which is worth the
    // sentence because the instrument has to be unique to be worth anything:
    // `preferredFormat` reddened this immediately, on the path completion --
    // the two handlers make the same choice about a declared capability and
    // named the function the same way. `wordAt` appears nowhere in examples/ or
    // src/, and it is unpublished, so it reaches a consumer's own tree only by
    // being copied there.
    expect(consumer.files.filter((path) => readFileSync(path, "utf8").includes("wordAt"))).toEqual(
      [],
    );
    // The pair for the pair: the reader IS looking at a populated tree, so `[]`
    // above cannot be a walk that found nothing at all.
    expect(consumer.files.filter((path) => path.endsWith("tsudoi.config.ts")).length).toBe(1);

    const documentUri = pathToFileURL(join(consumer.dir, "probe.txt")).href;
    const running = LspSession.startCommand(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
      consumer.dir,
    );
    try {
      await running.request<InitializeResult>("initialize", initializeParams);
      running.notify("textDocument/didOpen", {
        textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: word },
      });

      const hover = await running.request<Hover | null>("textDocument/hover", {
        textDocument: { uri: documentUri },
        position: { line: 0, character: 0 },
      });

      // A DEFINITION, not merely a non-null answer: `null` is what the handler
      // returns for a word the dictionary does not have, and an empty string is
      // what a handler reaching a broken database would produce.
      const contents = hover?.contents as MarkupContent | undefined;
      expect(`${String(contents?.value)} | stderr: ${running.stderr}`).toContain(word);
      expect((contents?.value ?? "").length).toBeGreaterThan(word.length);
    } finally {
      running.dispose();
    }
  } finally {
    consumer.dispose();
  }
}, 60_000);

/**
 * THE SECOND HANDLER PACKAGE, AND BOTH ITS METHODS IN ONE INSTALLED CONSUMER --
 * because either alone is half the artifact.
 *
 * WHY BOTH IN ONE TEST AND NOT TWO: the resolve handler recognises an item by a
 * mark the completion handler wrote onto it, and that mark is unpublished. A
 * resolve driven against an item this suite BUILT would answer from a mark this
 * suite spelled, which is the agreement under test spelled twice. So the item
 * resolved below is one the completion in the same session produced.
 *
 * AND FROM A PROJECT HOLDING NO SOURCE, exactly as the hover above: the config's
 * only mention of either handler is a package specifier.
 *
 * `separatorsOf` IS THE NEEDLE AND ITS UNIQUENESS IS MEASURED RATHER THAN
 * ASSUMED, which is what the hover's own needle had to learn: it appears in
 * NOTHING under src/, examples/, test/ or scripts/, and it is unpublished, so it
 * reaches a consumer's own tree only by being copied there. It is also a name a
 * reader would not invent -- the point of asking the flavour which characters
 * cut is that the two spellings must not be merged.
 *
 * A `detail` THAT NAMES A SIZE, not merely a non-empty one: the handler returns
 * the item UNCHANGED both for an item it did not produce and for a path that has
 * gone, so `an answer arrived` is satisfied by a handler that recognised
 * nothing.
 */
test("an installed consumer answers a completion and then resolves one of its own items", async () => {
  const consumer = await consumerRunningTheExample();
  try {
    expect(consumer.files.filter((path) => path.includes("completion-path"))).toEqual([]);
    expect(
      consumer.files.filter((path) => readFileSync(path, "utf8").includes("separatorsOf")),
    ).toEqual([]);
    expect(consumer.files.filter((path) => path.endsWith("tsudoi.config.ts")).length).toBe(1);

    const documentUri = pathToFileURL(join(consumer.dir, "probe.txt")).href;
    const running = LspSession.startCommand(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
      consumer.dir,
    );
    try {
      await running.request<InitializeResult>("initialize", initializeParams);
      running.notify("textDocument/didOpen", {
        // `./` completes the consumer's own directory, which the install and the
        // config it was handed have both put files in.
        textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text: "./" },
      });

      const items = await running.request<CompletionItem[]>("textDocument/completion", {
        textDocument: { uri: documentUri },
        position: { line: 0, character: 2 },
      });
      expect(`${String(items.length)} items, stderr: ${running.stderr}`).toBe(
        `${String(items.length)} items, stderr: `,
      );
      expect(items.length).toBeGreaterThan(0);

      // A FILE AND NOT A DIRECTORY, because the resolve handler deliberately
      // shows no size for a directory -- a directory's `size` is its own entry's
      // and says nothing about what is inside -- so a directory would satisfy
      // this test's weaker half and not its assertion.
      const file = items.find((item) => item.kind === CompletionItemKind.File);
      // Narrowed by a throw rather than by an assertion, so the resolve below
      // reads a real item: `expect(...).toBeDefined()` leaves the type wide and
      // the request would go out carrying `undefined`.
      if (file === undefined) {
        throw new Error(
          `the completion produced no file item among ${String(items.length)} candidates`,
        );
      }

      const resolved = await running.request<CompletionItem>("completionItem/resolve", file);

      expect(`${String(resolved.detail)} | stderr: ${running.stderr}`).toContain("bytes");
      expect(resolved.detail).toContain("modified ");
      // The item came back, rather than being replaced by something else: an
      // answer that dropped the label would take the entry out of the user's
      // list.
      expect(resolved.label).toBe(file.label);
    } finally {
      running.dispose();
    }
  } finally {
    consumer.dispose();
  }
}, 60_000);

/**
 * THE NEGATIVE CONTROL, AND IT IS WHAT STOPS THE GREEN ABOVE MEANING `SOMETHING
 * ELSE ANSWERED`.
 *
 * WHAT IT MUST PRODUCE IS A FAILURE NAMING THE SPECIFIER. An empty hover would
 * mean the probe above is measuring something other than the handler; a hover
 * that STILL ANSWERED would mean a copied file or a hoisted stray is supplying
 * it.
 *
 * THE DICTIONARY GOES WITH IT, AND THAT IS WHY THE SPECIFIER IN stderr IS THE
 * ASSERTION RATHER THAN THE EXIT CODE. `wordnet` reaches a consumer only as this
 * package's declared dependency -- no probe symlinks one in, deliberately -- so
 * withdrawing the handler withdraws two modules, and TWO different failures can
 * exit non-zero here. The absence below is asserted so the reader can see which
 * one is being observed, and the name in stderr is what distinguishes them.
 */
test("without the handler package installed, the same config cannot load, naming the specifier", async () => {
  const consumer = await consumerRunningTheExample("@atusy/tsudoi-hover-wordnet");
  try {
    const started = await runCommand(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
      consumer.dir,
    );

    expect(started.code).not.toBe(0);
    expect(started.stderr).toContain("@atusy/tsudoi-hover-wordnet");
    // The second absence, MEASURED rather than reasoned about, because a
    // dictionary still sitting there would mean some other route installed it
    // and the withdrawal above was not the whole of what changed.
    expect(existsSync(join(consumer.dir, "node_modules", "wordnet"))).toBe(false);
  } finally {
    consumer.dispose();
  }
}, 60_000);
