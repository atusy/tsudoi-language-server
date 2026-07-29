/**
 * Dictionary hover for a config author's own `textDocument/hover` handler.
 *
 * WHAT THIS IS: an EXAMPLE, in examples/, and not a line of it lives in
 * tsudoi. It is here to show the shape of a handler that has to GO SOMEWHERE
 * ELSE for its answer -- a dictionary here, a type checker or a project index
 * in a real language server. tsudoi does not care which, or how long it takes.
 *
 * The dictionary is `wordnet`, which ships no types; the declaration this file
 * needs is examples/wordnet.d.ts, and a reader copying this must copy that too.
 */
import { init, lookup } from "wordnet";
import type { Hover, HoverParams, RequestContext } from "@atusy/tsudoi/types";

/**
 * The WordNet database, loaded ON FIRST USE and never twice.
 *
 * NOT at module load and NOT in the config factory, both of which run BEFORE
 * `initialize`: the database costs ~130ms to read (measured under bun 1.3.13
 * and deno 2.9.2), and paying it there delays the handshake of every session,
 * including the ones that never hover.
 *
 * The PROMISE is memoised rather than a `loaded` flag, because two hovers can
 * arrive before the first `init` settles: a flag lets the second start a
 * concurrent load, whereas awaiting the same promise makes it wait.
 */
let loading: Promise<void> | undefined;

function ready(): Promise<void> {
  loading ??= init();
  return loading;
}

/**
 * The run of non-whitespace characters containing `character`, or "" when the
 * cursor sits on whitespace.
 *
 * Whitespace is the crudest word rule there is, and that is the point: this is
 * the one function a real config author replaces with their own language's
 * notion of a word.
 *
 * Both LSP `character` and JavaScript string indices count UTF-16 code units,
 * so plain slicing is correct -- iterating code points would drift on the
 * first character outside the BMP.
 */
export function wordAt(line: string, character: number): string {
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  let start = character;
  while (start > 0 && !isBoundary(start - 1)) {
    start -= 1;
  }
  let end = character;
  while (end < line.length && !isBoundary(end)) {
    end += 1;
  }
  return line.slice(start, end);
}

/**
 * Every sense WordNet has for `word` as markdown, or null when it has none.
 *
 * A MISS IS A REJECTION from this package rather than an empty array, so the
 * catch is what turns `not in the dictionary` into `nothing to say` instead of
 * into a failed request. WordNet is English, so every non-English word takes
 * that path.
 */
export async function define(word: string): Promise<string | null> {
  await ready();
  try {
    const senses = await lookup(word);
    return senses.map((sense) => `*${sense.meta.synsetType}* — ${sense.glossary}`).join("\n\n");
  } catch {
    return null;
  }
}

/**
 * A `textDocument/hover` handler that answers with a word's definition.
 *
 * Position math is the config author's job: tsudoi hands over the live buffer
 * and the cursor, and what counts as a `word` in this language is exactly what
 * only this file knows.
 */
export async function hoverWordnet(
  context: RequestContext,
  params: HoverParams,
): Promise<Hover | null> {
  const document = context.tsudoi.documents.get(params.textDocument.uri);
  if (document === undefined) {
    return null;
  }
  const line = document.getText().split(/\r?\n/)[params.position.line];
  if (line === undefined) {
    return null;
  }
  const word = wordAt(line, params.position.character);
  if (word === "") {
    return null;
  }
  const definitions = await define(word.toLowerCase());
  if (definitions === null) {
    return null;
  }
  return {
    contents: { kind: "markdown", value: `**${word}**\n\n---\n\n${definitions}` },
    range: undefined,
  };
}
