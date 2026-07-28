import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { CompletionItemKind, type CompletionItem } from "vscode-languageserver-protocol";
import type { RequestContext, TextDocument } from "@atusy/tsudoi/types";
import {
  itemsFrom,
  pathCompletion,
  pathFragments,
  sourcesFor,
  type PathFragment,
  type PathSource,
} from "../examples/path-completion.ts";

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

function tree(
  entries: readonly string[],
  links: readonly (readonly [string, string])[] = [],
): Tree {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "tsudoi-paths-")));
  for (const entry of entries) {
    if (entry.endsWith("/")) {
      mkdirSync(join(root, entry), { recursive: true });
    } else {
      mkdirSync(join(root, entry, ".."), { recursive: true });
      writeFileSync(join(root, entry), "");
    }
  }
  for (const [name, target] of links) {
    symlinkSync(target, join(root, name));
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

/** The kind each item carries, keyed by what it inserts. */
function kinds(items: readonly CompletionItem[]): Record<string, CompletionItemKind | undefined> {
  return Object.fromEntries(items.map((item) => [item.insertText ?? "", item.kind]));
}

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

describe("directories are distinguishable from files", () => {
  // A WRONG KIND STILL COMPLETES AND STILL DISPLAYS, so nothing but this
  // assertion catches it.
  //
  // The symlinks are not decoration. MEASURED on bun 1.3.13 and deno 2.9.2:
  // readdir/opendir report a symlink-to-directory as NOT a directory, so an
  // implementation trusting the dirent alone labels `linkdir` a File -- and on
  // macOS /tmp is itself a symlink, so this is the first keystroke rather than
  // an exotic case.
  test("a symlink is the kind of what it points AT, and a dangling one still lists", async () => {
    const fixture = tree(
      ["realdir/", "realfile.txt"],
      [
        ["linkdir", "realdir"],
        ["linkfile", "realfile.txt"],
        ["dangling", "nowhere-at-all"],
      ],
    );
    try {
      const items = await complete({ ...elsewhere, line: "real" }, fixture.root);
      const links = await complete({ ...elsewhere, line: "link" }, fixture.root);
      // The DANGLING half: the entry is offered and the request still answers.
      // MEASURED: the obvious fix for the line above -- stat every entry --
      // throws ENOENT here, which under tsudoi's dispatch becomes -32603 plus
      // a stack and kills the whole completion, not merely this one item.
      const dangling = await complete({ ...elsewhere, line: "dang" }, fixture.root);

      expect(kinds(items)).toEqual({
        realdir: CompletionItemKind.Folder,
        "realfile.txt": CompletionItemKind.File,
      });
      expect(kinds(links)).toEqual({
        linkdir: CompletionItemKind.Folder,
        linkfile: CompletionItemKind.File,
      });
      // Degraded to File rather than dropped: there is nothing to resolve, and
      // a user who typed the name is entitled to see it exists.
      expect(kinds(dangling)).toEqual({ dangling: CompletionItemKind.File });
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * Where `insertedText` points when it is read the way its root says to read
 * it, or undefined when the two do not go together at all.
 *
 * JOIN, NEVER `resolve`: path.resolve DISCARDS the root the moment the text is
 * absolute, so an item carrying `/a/b/c` under the root `/a/b` would be called
 * correct for naming the same file by accident. And under the FILESYSTEM root
 * join is the identity, which makes relative and absolute text
 * indistinguishable by it -- so there the text has to be absolute in its own
 * right, which is the only thing that makes it readable from anywhere.
 */
function resolvesTo(root: string, insertedText: string): string | undefined {
  if (root === "/") {
    return isAbsolute(insertedText) ? normalize(insertedText) : undefined;
  }
  return isAbsolute(insertedText) ? undefined : join(root, insertedText);
}

/** Every item one source produced, in order. */
async function fromSource(source: PathSource, fragment: PathFragment): Promise<CompletionItem[]> {
  const items: CompletionItem[] = [];
  for await (const batch of itemsFrom(source, fragment)) {
    items.push(...batch);
  }
  return items;
}

/** The one fragment a test means, out of the candidates for that line. */
function only(line: string): PathFragment {
  const [fragment] = pathFragments(line, line.length);
  if (fragment === undefined) {
    throw new Error(`no fragment in ${line}`);
  }
  return fragment;
}

describe("an item resolves against its own source's root", () => {
  // ASSERTED PER SOURCE, never over the merged list. The two trees hold
  // DIFFERENT names on purpose: an item attributed to the wrong root resolves
  // to a path that does not exist, so this fails rather than passing by
  // coincidence.
  test("each source's items resolve, under that source's root, to the files it holds", async () => {
    const documentTree = tree(["notes/deep.txt"]);
    const cwdTree = tree(["notes/wide.txt"]);
    try {
      const uri = pathToFileURL(join(documentTree.root, "doc.txt")).href;
      const relative = only("notes/");
      const absolute = only("/us");
      const sources = [
        ...sourcesFor(relative, uri, cwdTree.root),
        ...sourcesFor(absolute, uri, cwdTree.root),
      ];
      expect(sources.map((source) => source.name)).toEqual(["document", "cwd", "absolute"]);

      // WHAT THE ROOT MUST BE, stated by the test rather than read off the
      // module. Without this the oracle below derives its expectation FROM
      // source.root and compares the module to itself: swapping the document
      // and cwd roots swaps both sides together and nothing reddens. Measured
      // -- the swap perturbation passed until this assertion existed.
      const expectedRoot: Record<string, string> = {
        document: documentTree.root,
        cwd: cwdTree.root,
        absolute: "/",
      };

      for (const source of sources) {
        expect(source.root).toBe(expectedRoot[source.name] ?? "");
        const fragment = source.name === "absolute" ? absolute : relative;
        const items = await fromSource(source, fragment);
        // Not vacuous: a source that produced nothing would satisfy every
        // `for` below without resolving anything.
        expect(items.length).toBeGreaterThan(0);

        const directory = join(source.root, fragment.directory);
        const real = (await readdir(directory))
          .filter((name) => name.startsWith(fragment.name))
          .map((name) => join(directory, name))
          .sort();
        expect(items.map((item) => resolvesTo(source.root, item.insertText ?? "")).sort()).toEqual(
          real,
        );
      }
    } finally {
      documentTree.dispose();
      cwdTree.dispose();
    }
  });

  // THE NEGATIVE CONTROLS the criterion names, on REAL items rather than on
  // invented ones: each mutation is the plausible implementation mistake, and
  // each must stop resolving.
  test("an absolute text under a named root, or a relative one under /, fails to resolve", async () => {
    const fixture = tree(["notes/deep.txt"]);
    try {
      const named = { name: "cwd", root: fixture.root };
      const [item] = await fromSource(named, only("notes/"));
      const insertText = item?.insertText ?? "";
      expect(resolvesTo(named.root, insertText)).toBe(join(fixture.root, "notes/deep.txt"));
      // The item carries an ABSOLUTE path while its source is a NAMED root.
      expect(resolvesTo(named.root, join(fixture.root, insertText))).toBeUndefined();

      const [rootItem] = await fromSource({ name: "absolute", root: "/" }, only("/us"));
      const absoluteText = rootItem?.insertText ?? "";
      expect(resolvesTo("/", absoluteText)).toBe(absoluteText);
      // The item carries a RELATIVE path while its source IS the filesystem
      // root -- which reads against whatever directory happens to be current.
      expect(resolvesTo("/", absoluteText.slice(1))).toBeUndefined();
    } finally {
      fixture.dispose();
    }
  });
});
