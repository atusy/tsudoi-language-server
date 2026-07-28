import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CompletionItemKind,
  type CompletionItem,
  type InitializeResult,
} from "vscode-languageserver-protocol";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { repoRoot } from "./helpers/spawn.ts";
import type { RequestContext, TextDocument } from "@atusy/tsudoi/types";
import {
  batchSize,
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

describe("an item names the root that produced it", () => {
  // ASSERTED PER SOURCE, and the reason is the masking control below rather
  // than tidiness: over a merged list, a document-relative source that fell
  // back to `/` is indistinguishable from the absolute source's legitimate
  // output, so a merged assertion cannot tell a broken source from a working
  // one.
  //
  // The carrier is the LABEL. `detail` was measured against the target client
  // and is displayed only when an option that DEFAULTS OFF is set -- a root
  // named there would satisfy this criterion at the protocol level and show
  // the user nothing.
  test("each item's label carries its source and its root", async () => {
    const documentTree = tree(["notes/deep.txt"]);
    const cwdTree = tree(["notes/wide.txt"]);
    try {
      const uri = pathToFileURL(join(documentTree.root, "doc.txt")).href;
      const fragment = only("notes/");
      const roots: Record<string, string> = {
        document: documentTree.root,
        cwd: cwdTree.root,
      };

      for (const source of sourcesFor(fragment, uri, cwdTree.root)) {
        const items = await fromSource(source, fragment);
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          // The root as this test knows it, not as the module reported it.
          expect(item.label).toContain(roots[source.name] ?? "");
          expect(item.label).toContain(source.name);
          // LOAD-BEARING ORDER, not formatting: a client filters on the label
          // when the item carries no filterText, so a label that did not BEGIN
          // with the text being typed would filter our own items away.
          expect(item.label.startsWith(item.insertText ?? "")).toBe(true);
        }
      }
    } finally {
      documentTree.dispose();
      cwdTree.dispose();
    }
  });

  // THE MASKING CONTROL, constructed rather than argued: `file://` resolves to
  // `/` WITHOUT THROWING (measured), so a document-relative source that lost
  // its parent produces items from exactly the directory the absolute source
  // legitimately produces them from. Attribution is the only thing that tells
  // the two apart.
  test("a source rooted at / is still distinguishable from the absolute source", async () => {
    const fragment = only("/us");
    const fallback = await fromSource({ name: "document", root: "/" }, fragment);
    const legitimate = await fromSource({ name: "absolute", root: "/" }, fragment);

    expect(inserted(fallback)).toEqual(inserted(legitimate));
    expect(fallback.map((item) => item.label)).not.toEqual(legitimate.map((item) => item.label));
  });
});

describe("items with identical inserted text collapse to one", () => {
  // The collision built from sources this PBI actually has: the document's
  // parent IS cwd, so two sources list the same directory and produce the same
  // string. Dedup is by INSERTED TEXT and never by resolved file -- resolving
  // first would force an arbitrary choice of which root to attribute the
  // survivor to, which is the criterion above.
  test("the document's parent being cwd yields ONE item, not two", async () => {
    const fixture = tree(["notes/deep.txt"]);
    try {
      const uri = pathToFileURL(join(fixture.root, "doc.txt")).href;
      const items = await complete({ uri, line: "notes/" }, fixture.root);

      expect(inserted(items)).toEqual(["notes/deep.txt"]);
      // WHICH root the survivor names is decided by SOURCE ORDER, and it is
      // pinned so it cannot drift silently: the document is asked first.
      expect(items[0]?.label).toContain(`(document: ${fixture.root})`);
    } finally {
      fixture.dispose();
    }
  });

  // THE DISCRIMINATOR between the two dedup rules, which the collision above
  // cannot supply: there both rules collapse, because one directory reached
  // twice has one path. Here the SAME directory is reached by two DIFFERENT
  // absolute paths -- cwd is a symlink to the document's parent -- so the
  // inserted text is one string while the roots are two.
  //
  // Dedup by resolved file would keep both and then have to pick a root to
  // label the pair with, which is the arbitrary choice the criterion refuses.
  test("two roots reaching one directory by different paths still collapse", async () => {
    const fixture = tree(["notes/deep.txt"], [["mirror", "."]]);
    try {
      const uri = pathToFileURL(join(fixture.root, "doc.txt")).href;
      const items = await complete({ uri, line: "notes/" }, join(fixture.root, "mirror"));

      expect(inserted(items)).toEqual(["notes/deep.txt"]);
    } finally {
      fixture.dispose();
    }
  });

  // THE PERMANENT PAIR for the collapse above: the same measurement over two
  // roots holding DIFFERENT names keeps both. Without it, `exactly one item`
  // is equally satisfied by a module that drops everything but the first.
  test("two roots holding different names keep both items", async () => {
    const documentTree = tree(["notes/deep.txt"]);
    const cwdTree = tree(["notes/wide.txt"]);
    try {
      const uri = pathToFileURL(join(documentTree.root, "doc.txt")).href;
      const items = await complete({ uri, line: "notes/" }, cwdTree.root);

      expect(inserted(items)).toEqual(["notes/deep.txt", "notes/wide.txt"]);
    } finally {
      documentTree.dispose();
      cwdTree.dispose();
    }
  });
});

describe("a document with no parent directory contributes nothing", () => {
  // THE GUARD IS `an unnamed document has no parent`, NEVER `reject / as a
  // root`. The two degenerate URIs fail in OPPOSITE directions, measured on
  // both runtimes: `file://` resolves to `/` silently, `untitled:` throws. So
  // one of them needs a value check and the other needs a catch, and neither
  // implies the other.
  //
  // The fragment is chosen so that `/` REALLY HAS matches for it. With a
  // fragment `/` cannot match, `no document-relative items` would be satisfied
  // by a module with no guard at all.
  test("file:// and untitled: yield no document-relative items, and still answer", async () => {
    const fixture = tree(["usable.txt"]);
    try {
      for (const uri of ["file://", "untitled:Untitled-1"]) {
        const items = await complete({ uri, line: "us" }, fixture.root);

        // ANSWERED, not merely quiet: cwd's own match is the evidence that the
        // request survived, and `/usr` on this machine is what would arrive if
        // the document source had fallen back to the filesystem root.
        expect(inserted(items)).toEqual(["usable.txt"]);
        expect(items[0]?.label).toContain(`(cwd: ${fixture.root})`);
      }
    } finally {
      fixture.dispose();
    }
  });

  // THE PERMANENT PAIR, and the reason the guard is worded as it is: a
  // document that really does sit at the filesystem root HAS a parent, and it
  // is `/`. A guard spelled `reject /` passes the test above and deletes this.
  test("a document that really sits at the filesystem root keeps / as its root", () => {
    expect(sourcesFor(only("us"), "file:///a.txt", "/somewhere")).toEqual([
      { name: "document", root: "/" },
      { name: "cwd", root: "/somewhere" },
    ]);
  });
});

describe("a filename containing a space is completed whole", () => {
  // THE PO'S RULING, and it lands in OUR code rather than the client's: the
  // natural way to find a path fragment is to split on whitespace, and that
  // cuts `foo (1).png` at the space -- so the range would start after it and
  // the item would insert half a name over the other half.
  //
  // The fixture holds NOTHING matching the narrower candidate `(1).p`. With
  // one, the test would pass at the wrong candidate and never exercise the
  // widening at all.
  test("the range starts at the filename, not after the space inside it", async () => {
    const fixture = tree(["foo (1).png"]);
    try {
      const line = "see foo (1).png";
      const cursor = "see foo (1).p".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);

      expect(items).toHaveLength(1);
      const item = items[0] as CompletionItem;
      expect(item.insertText).toBe("foo (1).png");
      expect(item.label).toContain("foo (1).png");
      const edit = item.textEdit;
      const range = edit !== undefined && "range" in edit ? edit.range : undefined;
      // 4, where `foo` begins -- NOT 8, where `(1).p` does.
      expect(range?.start.character).toBe(4);
      // APPLIED against what the user has actually TYPED, which is the line
      // above without its tail. The item's range ends at the CURSOR and never
      // past it, so on the line above -- where `ng` sits to the right of the
      // cursor already -- applying it yields `see foo (1).pngng`. That is
      // insert semantics, and it is a CHOICE recorded at the module: the
      // alternative deletes whatever the user has to the right of the cursor.
      const typed = "see foo (1).p";
      expect(applyAsClient(typed, cursor, item)).toBe("see foo (1).png");
    } finally {
      fixture.dispose();
    }
  });

  // THE OTHER HALF OF THE RULE: a fragment widens across a space ONLY when the
  // narrower one names nothing. Without this, a line whose words BOTH match
  // produces items replacing different spans of it in one response, and which
  // one the user picks decides how much of their line disappears.
  test("a fragment widens only when the narrower one names nothing", async () => {
    const fixture = tree(["foo.txt", "see foo.txt"]);
    try {
      const items = await complete({ ...elsewhere, line: "see foo" }, fixture.root);

      expect(inserted(items)).toEqual(["foo.txt"]);
    } finally {
      fixture.dispose();
    }
  });
});

/**
 * The line after a client applies `item`, with the cursor at `character`.
 *
 * TWO CLIENT CLASSES, both modelled here because an item has to be right for
 * both: one honours the item's own textEdit range; one has only `insertText`
 * and computes the range it replaces from ITS OWN word boundaries. Neither `/`
 * nor `.` is a word character in most, which is the entire hazard -- a
 * multi-segment path gets its last segment replaced and the rest left standing
 * in front of it.
 */
function applyAsClient(line: string, character: number, item: CompletionItem): string {
  const edit = item.textEdit;
  if (edit !== undefined && "range" in edit) {
    return (
      line.slice(0, edit.range.start.character) +
      edit.newText +
      line.slice(edit.range.end.character)
    );
  }
  let start = character;
  while (start > 0 && /[\p{L}\p{N}_-]/u.test(line[start - 1] ?? "")) {
    start -= 1;
  }
  return line.slice(0, start) + (item.insertText ?? item.label) + line.slice(character);
}

describe("applying the item yields the path it names", () => {
  // MULTI-SEGMENT, and the discriminator is that it must be: for a fragment
  // with one segment the two client classes cannot be told apart, so a test
  // written with one proves nothing at all. Its counterpart is below.
  test("a multi-segment fragment is replaced whole", async () => {
    const fixture = tree(["src/foo.ts"]);
    try {
      const line = "see src/fo";
      const items = await complete({ ...elsewhere, line }, fixture.root);

      expect(items).toHaveLength(1);
      const item = items[0] as CompletionItem;
      expect(applyAsClient(line, line.length, item)).toBe("see src/foo.ts");

      // The two client classes read DIFFERENT fields for the same text, so a
      // drift between them breaks one of them silently.
      const edit = item.textEdit;
      expect(edit !== undefined && "range" in edit ? edit.newText : undefined).toBe(
        item.insertText,
      );
    } finally {
      fixture.dispose();
    }
  });

  // THE PAIRED SINGLE-SEGMENT CASE, permanent: it is what makes the test above
  // evidence rather than a coincidence. Both perturbations that redden the
  // multi-segment case leave this one green.
  test("a single-segment fragment is replaced whole too", async () => {
    const fixture = tree(["src/foo.ts"]);
    try {
      const line = "see sr";
      const items = await complete({ ...elsewhere, line }, fixture.root);

      expect(items).toHaveLength(1);
      expect(applyAsClient(line, line.length, items[0] as CompletionItem)).toBe("see src");
    } finally {
      fixture.dispose();
    }
  });

  // MEASURED against the target client, and this is the whole reason the range
  // is constrained rather than merely present: an item whose range spans more
  // than one line, or starts on a line other than the cursor's, or whose label
  // is empty, is DISCARDED with no error and no fallback. The item does not
  // arrive wrong -- it vanishes.
  test("the range is one line, the cursor's own, and the label is never empty", async () => {
    const fixture = tree(["src/foo.ts"]);
    try {
      const items = await complete({ ...elsewhere, line: "src/fo" }, fixture.root);
      const edit = items[0]?.textEdit;
      const range = edit !== undefined && "range" in edit ? edit.range : undefined;

      expect(range?.start.line).toBe(0);
      expect(range?.end.line).toBe(0);
      expect(range?.start.character).toBe(0);
      expect(range?.end.character).toBe("src/fo".length);
      expect(items[0]?.label).not.toBe("");
    } finally {
      fixture.dispose();
    }
  });
});

// ============================================================================
// Over the wire, under both runtimes: what a CLIENT receives, which is the
// only place the streaming property is observable at all.
// ============================================================================

const demoConfig = fileURLToPath(new URL("../examples/tsudoi.config.ts", import.meta.url));
const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

/** What the example config yields before anything path-related. */
const helloWorld = {
  label: "HelloWorld",
  kind: CompletionItemKind.Text,
  detail: "Example completion item",
  documentation: "This is a sample completion item.",
};

const partialResultToken = "path-completion-partial-1";

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    // THE STREAMING PROPERTY, and nothing else can catch its loss: a module
    // that collected the whole listing and returned it satisfies every content
    // assertion in this file while discarding what four sprints were spent on.
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
        `${runtime.command} ${runtime.runArgs.join(" ")} ${join(repoRoot, "src", "cli.ts")} --config ${demoConfig}`,
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

        const result = await session.request<CompletionItem[] | null>("textDocument/completion", {
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
        const streamed = session.progress.flatMap((progress) => progress.value as CompletionItem[]);
        expect(streamed[0]).toEqual(helloWorld);
        expect(
          streamed
            .slice(1)
            .map((item) => item.insertText)
            .sort(),
        ).toEqual([...names].sort());

        // SIZES, not membership: nothing sorts the listing -- sorting would
        // require collecting it, which is the property under test -- so which
        // entry lands in which batch is the filesystem's business.
        const batches = session.progress.map(
          (progress) => (progress.value as CompletionItem[]).length,
        );
        expect(batches).toEqual([1, batchSize, batchSize, 1]);
        expect(session.progress.map((progress) => progress.token)).toEqual(
          batches.map(() => partialResultToken),
        );
        // The yields have already left; the response adds nothing to them.
        expect(result).toEqual([]);
      } finally {
        session.dispose();
        fixture.dispose();
      }
    });
  });
}
