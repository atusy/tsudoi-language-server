/**
 * Dictionary hover for a config author's own `textDocument/hover` handler.
 *
 * WHAT THIS IS: a PACKAGE a config author INSTALLS, and not a line of it lives
 * in tsudoi. It is also the worked shape of a handler that has to GO SOMEWHERE
 * ELSE for its answer -- a dictionary here, a type checker or a project index in
 * a real language server. tsudoi does not care which, or how long it takes.
 *
 * WHAT A PACKAGE CHANGES ABOUT THE FILE IT WAS, and it is not merely where it
 * sits: a reader who took this as an example owned it and could edit any line,
 * where an installed copy is ours to keep working. So the surface is chosen in
 * index.ts rather than being whatever this file happens to export, and the
 * comments here address a MAINTAINER -- the reader whose questions this file
 * must answer is now the person changing it, not the person copying it.
 *
 * IT RESOLVES tsudoi THE WAY A STRANGER'S PACKAGE DOES, through the member's own
 * node_modules and tsudoi's `exports` map, with no `paths` mapping and no
 * tsconfig of the parent's reaching it -- a mapping here is refused by
 * the repository's own workspace tooling rather than merely absent.
 *
 * A PEER AND NOT A DEPENDENCY BECAUSE THE FRAMEWORK IS THE HOST'S TO CHOOSE.
 * This handler is loaded into a server the consumer's own tsudoi is running, and
 * `context.tsudoi` is built by that copy; declaring tsudoi as a dependency would
 * let this package pin a range of its own and hand the consumer a second copy
 * their CLI never runs. A peer says the version is not ours to name.
 *
 * NOT BECAUSE TWO COPIES WOULD BE INCOMPATIBLE, which is the plausible reason to
 * reach for and is FALSE: `MethodHandler` is a plain function type alias and
 * TypeScript compares it structurally. MEASURED with two copies of tsudoi's
 * dist/ installed at DIFFERENT versions -- the same version is not a
 * measurement, tsc redirects the second by package id and there is literally one
 * declaration -- a handler typed against one assigns to the other's
 * `MethodHandler` and into `TsudoiConfig.methods`, exit 0; the same probe reports
 * TS2322 naming both paths once the shapes actually diverge. So a divergent
 * version is what produces the confusing error, and identity of version is what
 * `peer` is for.
 *
 * That is why this package is not a file move with a package.json on top, and
 * the manifest's reasons are asserted in the package-shape test beside this
 * file, since package.json cannot carry them itself.
 *
 * The dictionary is `wordnet`, which ships no types. The declaration that fixes
 * that is source-only and deliberately unshipped -- the reason is written there,
 * at the file whose publication would be the mistake, and a reader of this
 * comment holds the tarball rather than the checkout it names.
 */
import { init, lookup } from "wordnet";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import { MarkupKind } from "@atusy/tsudoi-language-server/deps/types";

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
 *
 * AND THE MEMO IS DROPPED WHEN THE LOAD FAILS, which is the half the idiom is
 * usually written without. `loading ??= init()` caches the PROMISE, not the
 * resolution, so a rejected one is cached too: one transient failure -- a
 * database on a mount that was not ready -- would be handed to every hover for
 * the rest of the process's life. `await ready()` below sits OUTSIDE the try, so
 * that cached rejection escapes `define`, escapes the handler, and each of those
 * hovers is answered -32603. The user restarts their editor to fix it.
 *
 * NOT `MOVE THE AWAIT INSIDE THE TRY`, which looks like the same fix and is
 * worse: it would not un-cache anything, so every later hover would await the
 * same rejected promise, CATCH it, and answer `null`. That turns a permanent
 * loud failure into a permanent silent one -- a dictionary that says every word
 * is unknown, with nothing anywhere to say why.
 *
 * The derived promise is what is stored AND what is returned, so the rejection
 * has a handler and the retry is the caller's next call rather than a loop.
 */
let loading: Promise<void> | undefined;

function ready(): Promise<void> {
  loading ??= init().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

/**
 * The run of non-whitespace characters containing `character`, or "" when the
 * cursor sits on whitespace.
 *
 * WHITESPACE IS THIS PACKAGE'S WORD RULE, FULL STOP, and it is a decision rather
 * than a placeholder. A word rule is exactly the line a reader of an EXAMPLE
 * edits, and an installed package offers no such line: nothing here is
 * published, and importing this function could not make `hoverWordnet` call
 * another. What would is an option on the handler, which is a purchase this
 * package refuses -- so a language that does not delimit its words with spaces
 * wants a handler of its own rather than a setting on this one.
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
 * Which markup this handler will send, out of what the client said it can
 * render: the FIRST format the client named that this module can produce, and
 * plaintext when it named none this module knows.
 *
 * THE ORDER IS THE CLIENT'S AND THE FILTER IS OURS. LSP defines
 * `textDocument.hover.contentFormat` as the client's PREFERENCE ORDER, so
 * scanning that list and stopping at the first producible entry honours a client
 * that would rather have plaintext, and skips a kind nothing here can build.
 *
 * PLAINTEXT IS THE FALLBACK BECAUSE IT IS THE ONE FORMAT A CLIENT CANNOT REFUSE.
 * A client that declares nothing has declared no markdown support, and markdown
 * sent there is shown as its own syntax -- a dictionary entry fenced in
 * asterisks the reader has to look past. The reverse mistake costs emphasis.
 *
 * READ THROUGH A GUARD RATHER THAN TRUSTED: the declared type describes a
 * CONFORMING client, and one that sends something else must be answered rather
 * than crashed at. A non-array declares nothing, and an unknown kind inside the
 * array is skipped by the same filter that skips one this module cannot build.
 */
function preferredFormat(declared: readonly MarkupKind[] | undefined): MarkupKind {
  const preference = Array.isArray(declared) ? declared : [];
  return preference.find((kind) => producible.includes(kind)) ?? MarkupKind.PlainText;
}

/** Every markup kind this module knows how to build. */
const producible: readonly MarkupKind[] = [MarkupKind.Markdown, MarkupKind.PlainText];

/**
 * Every sense WordNet has for `word` in the format the client can render, or
 * null when it has none.
 *
 * THE FORMAT IS TAKEN, NEVER DEFAULTED, because both defaults are wrong in the
 * way a caller cannot see: markdown emphasises a part of speech for a client
 * that renders none, and plaintext drops it for every client that would.
 *
 * A MISS IS A REJECTION from this package rather than an empty array, so the
 * catch is what turns `not in the dictionary` into `nothing to say` instead of
 * into a failed request. WordNet is English, so every non-English word takes
 * that path.
 */
export async function define(word: string, format: MarkupKind): Promise<string | null> {
  await ready();
  try {
    const senses = await lookup(word);
    return senses
      .map((sense) =>
        format === MarkupKind.Markdown
          ? `*${sense.meta.synsetType}* — ${sense.glossary}`
          : `${sense.meta.synsetType} — ${sense.glossary}`,
      )
      .join("\n\n");
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
 *
 * WHAT IT SENDS IS THE CLIENT'S TO DECIDE, and that decision is made ONCE at the
 * top, before anything is awaited: every part of this answer -- the heading, the
 * rule, each sense -- is built for one format, and a handler that read the
 * session again further down could compose two.
 */
export const hoverWordnet: MethodHandler<"textDocument/hover"> = async (context, params) => {
  const format = preferredFormat(
    context.tsudoi.clientCapabilities.textDocument?.hover?.contentFormat,
  );
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
  const definitions = await define(word.toLowerCase(), format);
  if (definitions === null) {
    return null;
  }
  return {
    contents: {
      kind: format,
      // THE HEADING IS THE WORD THE USER POINTED AT, repeated because a hover
      // window carries no other title. Its emphasis and the rule under it are
      // markdown's alone: sent to a plaintext client they arrive as asterisks
      // and three hyphens, so that client gets the word on its own line and the
      // blank line already separating it from the senses below.
      value:
        format === MarkupKind.Markdown
          ? `**${word}**\n\n---\n\n${definitions}`
          : `${word}\n\n${definitions}`,
    },
    range: undefined,
  };
};
