import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CompletionItem } from "vscode-languageserver-protocol";
import type { RequestContext, TextDocument } from "@atusy/tsudoi/types";
import { pathCompletion, pathFragments } from "../examples/path-completion.ts";

/**
 * A throwaway directory tree, WITH NO DOTFILES IN IT.
 *
 * Hidden-entry behaviour is UNRULED -- the stakeholder did not ask -- and a
 * fixture that happened to contain one would pin a decision nobody made. The
 * same rule is why nothing here is named `./x` or `../x`.
 *
 * realpathSync is not cosmetic: on macOS the system temp directory lives under
 * /var, which IS a symlink to /private/var, and a child process started with
 * cwd there reports the resolved path. Comparing the two spellings is a
 * failure that looks like a logic error and is not one.
 */
interface Tree {
  readonly root: string;
  dispose(): void;
}

function tree(entries: readonly string[]): Tree {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-paths-")));
  for (const entry of entries) {
    if (entry.endsWith("/")) {
      mkdirSync(join(root, entry), { recursive: true });
    } else {
      mkdirSync(join(root, entry, ".."), { recursive: true });
      writeFileSync(join(root, entry), "");
    }
  }
  return { root, dispose: (): void => rmSync(root, { recursive: true, force: true }) };
}

/** The document a completion is driven against: one line, and its uri. */
interface Buffer {
  readonly uri: string;
  readonly line: string;
}

/**
 * Drives the module the way tsudoi drives a config handler -- through the
 * public RequestContext, with the line in a real document -- and returns every
 * item it yielded, in order.
 *
 * The context is built here rather than spawned because these claims are about
 * WHAT THE HANDLER PRODUCES. The claims about what reaches a client over the
 * wire are driven through a real server further down this file.
 */
async function complete(
  buffer: Buffer,
  cwd: string,
  character?: number,
): Promise<CompletionItem[]> {
  const document: TextDocument = {
    uri: buffer.uri,
    languageId: "plaintext",
    version: 1,
    getText: () => buffer.line,
  };
  const context: RequestContext = {
    signal: new AbortController().signal,
    tsudoi: {
      documents: { get: () => document, values: () => [document] },
    },
  };
  const items: CompletionItem[] = [];
  const chunks = pathCompletion(
    context,
    {
      textDocument: { uri: buffer.uri },
      position: { line: 0, character: character ?? buffer.line.length },
    },
    { cwd },
  );
  for (;;) {
    const next = await chunks.next();
    if (next.done === true) {
      return items;
    }
    items.push(...next.value);
  }
}

/** What an item puts in the buffer, which is also the key dedup collapses on. */
function inserted(items: readonly CompletionItem[]): string[] {
  return items.map((item) => item.insertText ?? "").sort();
}

/** A document that does not exist, so only cwd answers a relative fragment. */
const elsewhere = { uri: "file:///workspace/a.txt" } as const;

// WHAT THIS FILE DRIVES: examples/path-completion.ts itself, the artifact a
// config author reads, with no fixture copy of it in existence. The rule is
// Sprint 5's, and it is why the assertions below import the example directly
// rather than a duplicate that would drift away from it.
describe("path fragments", () => {
  // The candidates are shortest-first: a fragment widens across a space ONLY
  // when the narrower one names nothing, which is a property of
  // pathCompletion, not of this function. Here only the LIST is asserted.
  test("the fragment under the cursor carries its directory part and its filter", () => {
    expect(pathFragments("foo/ba", 6)).toEqual([
      { text: "foo/ba", start: 0, directory: "foo/", name: "ba" },
    ]);
    expect(pathFragments("/usr/lo", 7)).toEqual([
      { text: "/usr/lo", start: 0, directory: "/usr/", name: "lo" },
    ]);
  });

  // A lone "/" is a fragment with an EMPTY filter, not an absent fragment:
  // typing it is what asks for the filesystem root's children.
  test("a trailing separator is a directory part with an empty filter", () => {
    expect(pathFragments("/", 1)).toEqual([{ text: "/", start: 0, directory: "/", name: "" }]);
  });

  // ABSENCE, with its permanent pair one test above and one below: the same
  // function observes a fragment when there is one, so `no candidates` is
  // evidence rather than a measurement that never measures anything.
  test("a cursor with no path characters before it yields no fragment at all", () => {
    expect(pathFragments("", 0)).toEqual([]);
    expect(pathFragments("こんにちは", 0)).toEqual([]);
    // Immediately after whitespace: everything to the left belongs to another
    // word, and an EMPTY fragment would list every entry of every root.
    expect(pathFragments("see ", 4)).toEqual([]);
  });

  // The spaced-filename case, at the extraction layer: `foo (1).png` must be
  // REACHABLE as a candidate, which a whitespace split forecloses. Which
  // candidate wins is decided against the filesystem, not here.
  test("a word boundary to the left of a space is a candidate, so a spaced filename is reachable", () => {
    expect(pathFragments("see foo (1).png", 13)).toEqual([
      { text: "(1).p", start: 8, directory: "", name: "(1).p" },
      { text: "foo (1).p", start: 4, directory: "", name: "foo (1).p" },
      { text: "see foo (1).p", start: 0, directory: "", name: "see foo (1).p" },
    ]);
  });
});

describe("the typed prefix selects the source class", () => {
  test("a relative fragment is answered by the relative sources", async () => {
    const fixture = tree(["src/foo.ts", "src/bar.ts", "notes/"]);
    try {
      const items = await complete({ ...elsewhere, line: "src/" }, fixture.root);

      expect(inserted(items)).toEqual(["src/bar.ts", "src/foo.ts"]);
    } finally {
      fixture.dispose();
    }
  });

  // THE NEGATIVE HALF IS THE DISCRIMINATOR. cwd here HAS CHILDREN OF ITS OWN,
  // so an implementation where every source answers every keystroke would
  // still pass the positive half above and fail here.
  //
  // This is the stakeholder's own example -- typing `/` completes the
  // filesystem root -- with cwd deliberately not being it.
  test("a /-prefixed fragment is answered by the absolute source ALONE", async () => {
    const fixture = tree(["src/foo.ts", "notes/", "doc.txt"]);
    try {
      const items = await complete({ ...elsewhere, line: "/" }, fixture.root);

      // Every one of them, not merely the presence of a root entry: a
      // cwd-relative item is exactly one whose inserted text is NOT anchored.
      expect(items.length).toBeGreaterThan(0);
      expect(items.filter((item) => !(item.insertText ?? "").startsWith("/"))).toEqual([]);
      // And nothing extra. Compared against a listing this test performs
      // ITSELF, so the oracle is the filesystem rather than the module.
      //
      // Hidden entries are dropped from BOTH sides on purpose: whether a
      // completion offers them is UNRULED, and a set equality including them
      // would decide it here by accident.
      const visible = (name: string): boolean => !name.startsWith(".");
      const rootEntries = (await readdir("/")).filter(visible);
      expect(
        inserted(items)
          .map((text) => text.slice(1))
          .filter(visible)
          .sort(),
      ).toEqual(rootEntries.sort());
    } finally {
      fixture.dispose();
    }
  });
});
