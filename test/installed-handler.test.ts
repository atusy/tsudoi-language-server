import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Hover, InitializeResult, MarkupContent } from "vscode-languageserver-protocol";
import { exampleSources, installConsumer } from "./helpers/install.ts";
import { initializeParams, LspSession } from "./helpers/lsp.ts";
import { runCommand } from "./helpers/spawn.ts";

/**
 * A CONFIG AUTHOR GETS THE HOVER HANDLER BY INSTALLING IT, NOT BY COPYING IT.
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
async function consumerRunningTheExample(omitHandler = false): Promise<{
  dir: string;
  files: readonly string[];
  dispose: () => void;
}> {
  const consumer = await installConsumer(omitHandler ? { omitHandler: true } : {});
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
    // `preferredFormat` reddened this immediately, on examples/completion-path.ts
    // -- the two files make the same choice about a declared capability and
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
 * THE NEGATIVE CONTROL, AND IT IS WHAT STOPS THE GREEN ABOVE MEANING `SOMETHING
 * ELSE ANSWERED`.
 *
 * WHAT IT MUST PRODUCE IS A FAILURE NAMING THE SPECIFIER. An empty hover would
 * mean the probe above is measuring something other than the handler; a hover
 * that STILL ANSWERED would mean a copied file or a hoisted stray is supplying
 * it. The dictionary is deliberately left in place, so the one thing withdrawn
 * is the package itself.
 */
test("without the handler package installed, the same config cannot load, naming the specifier", async () => {
  const consumer = await consumerRunningTheExample(true);
  try {
    const started = await runCommand(
      "bun run node_modules/@atusy/tsudoi-language-server/dist/cli.js --config ./tsudoi.config.ts",
      consumer.dir,
    );

    expect(started.code).not.toBe(0);
    expect(started.stderr).toContain("@atusy/tsudoi-hover-wordnet");
  } finally {
    consumer.dispose();
  }
}, 60_000);
