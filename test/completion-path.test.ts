import { describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { readdir } from "node:fs/promises";
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
import { tree } from "./helpers/tree.ts";
import type { TextDocument } from "@atusy/tsudoi/deps/textdocument";
import type { RequestContext } from "@atusy/tsudoi/types";
// THE VALUE COMES FROM THE PACKAGE AND THE TYPE FROM TSUDOI, and the pair is
// deliberate rather than clumsy. `@atusy/tsudoi/types` publishes this name
// TYPE-ONLY -- ruled at src/types.ts -- so the constructor is reached where it
// lives, while the annotation still checks that what `create` returns is what
// the published surface promises. It is also the exact shape a config author
// ends up writing, which is why it is worth seeing here.
import { TextDocument as UpstreamTextDocument } from "vscode-languageserver-textdocument";
import {
  batchSize,
  itemsFrom,
  pathCompletion,
  pathFragments,
  sourcesFor,
  type PathFragment,
  type PathSource,
} from "../examples/completion-path.ts";

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
  /**
   * What the client declared about `insertReplaceSupport`, and the ONE knob
   * every other test in this file leaves alone.
   *
   * DEFAULTED TO `true` HERE AND NEVER IN THE MODULE, which is the same split
   * `fromSource` makes for `line`: the assertions below read `endsOf`, which
   * asks about the two ranges of an `InsertReplaceEdit`, so this default states
   * the client class they are written about instead of repeating it at every
   * call. The module itself takes the flag REQUIRED, so no default of its own
   * can decide this for an author.
   */
  insertReplaceSupport = true,
): Promise<CompletionItem[]> {
  // BUILT BY UPSTREAM'S CONSTRUCTOR, NOT BY HAND, and this line is the whole of
  // PBI-31's break demonstrated on the only mock in this repository. The object
  // literal that stood here satisfied tsudoi's former four-member interface and
  // does not satisfy the real one -- which is the break falling exactly where
  // README says it falls: on an IMPLEMENTOR, in their own tests, and not on a
  // handler that merely receives a document. `create` is the one-line remedy.
  const document: TextDocument = UpstreamTextDocument.create(
    buffer.uri,
    "plaintext",
    1,
    buffer.line,
  );
  const context: RequestContext = {
    signal: new AbortController().signal,
    tsudoi: {
      documents: { get: () => document, values: () => [document] },
      // THE THREE ROOT FIELDS AS A CLIENT THAT NAMED NO PROJECT SENDS THEM, and
      // on `tsudoi` because they are the SESSION'S rather than this request's.
      // The module reads them itself, so a `Tsudoi` missing any of the three is
      // not one a handler can be given -- which is what makes this literal fail
      // to compile rather than silently model an impossible session.
      workspaceFolders: [],
      rootUri: null,
      rootPath: null,
      // WHAT THE CLIENT DECLARED, SPELLED AS A CLIENT SPELLS IT -- the whole
      // optional chain, so a rename anywhere along it reddens here rather than
      // silently reading `undefined` and testing the other arm.
      clientCapabilities: {
        textDocument: { completion: { completionItem: { insertReplaceSupport } } },
      },
    },
  };
  // EVERY ITEM THIS MODULE HAS FOR ONE REQUEST, in the order it produces them,
  // read the way tsudoi's own no-token drive reads it: every batch it yields,
  // concatenated. A generator that yields NOTHING is an empty list here rather
  // than a failure -- the tests below assert emptiness by name, and tsudoi
  // itself distinguishes it from `[]` on the wire by answering `null`.
  const items: CompletionItem[] = [];
  for await (const batch of pathCompletion(
    context,
    {
      textDocument: { uri: buffer.uri },
      position: { line: 0, character: character ?? buffer.line.length },
    },
    { cwd },
  )) {
    items.push(...batch);
  }
  return items;
}

/** An item's documentation as markdown text, or "" when it carries none. */
function documentationOf(item: CompletionItem | undefined): string {
  const documentation = item?.documentation;
  return typeof documentation === "string" ? documentation : (documentation?.value ?? "");
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

// WHAT THIS FILE DRIVES: examples/completion-path.ts itself, the artifact a
// config author reads, with no fixture copy of it in existence. The rule is
// Sprint 5's, and it is why the assertions below import the example directly
// rather than a duplicate that would drift away from it.
describe("path fragments", () => {
  // The candidates are shortest-first: a fragment widens across a space ONLY
  // when the narrower one names nothing, which is a property of
  // pathCompletion, not of this function. Here only the LIST is asserted.
  test("the fragment under the cursor carries its directory part and its filter", () => {
    expect(pathFragments("foo/ba", 6)).toEqual([
      { text: "foo/ba", start: 0, end: 6, directory: "foo/", name: "ba" },
    ]);
    expect(pathFragments("/usr/lo", 7)).toEqual([
      { text: "/usr/lo", start: 0, end: 7, directory: "/usr/", name: "lo" },
    ]);
  });

  // A lone "/" is a fragment with an EMPTY filter, not an absent fragment:
  // typing it is what asks for the filesystem root's children.
  test("a trailing separator is a directory part with an empty filter", () => {
    expect(pathFragments("/", 1)).toEqual([
      { text: "/", start: 0, end: 1, directory: "/", name: "" },
    ]);
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
      { text: "(1).p", start: 8, end: 15, directory: "", name: "(1).p" },
      { text: "foo (1).p", start: 4, end: 15, directory: "", name: "foo (1).p" },
      { text: "see foo (1).p", start: 0, end: 15, directory: "", name: "see foo (1).p" },
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
async function fromSource(
  source: PathSource,
  fragment: PathFragment,
  // These callers build their fragment with `only(line)`, whose cursor is at
  // the END of the line -- so the fragment's text IS the line. Spelled as a
  // default here and never in the module: a module-level default would decide
  // the replace end from a line it was not given.
  line: string = fragment.text,
  // As `complete` defaults it, and for the same reason: these callers ask about
  // the two ranges, which only the supporting client's edit carries.
  insertReplaceSupport = true,
): Promise<CompletionItem[]> {
  const items: CompletionItem[] = [];
  // The cursor, spelled out: itemsFrom takes it rather than defaulting it,
  // because a default can only assume line 0 and would be wrong anywhere else.
  const position = { line: 0, character: fragment.start + fragment.text.length };
  for await (const batch of itemsFrom(source, fragment, position, line, insertReplaceSupport)) {
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
      const named: PathSource = { name: "cwd", root: fixture.root };
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
  // THE CARRIER IS `documentation`, not the label and not `detail`: the label
  // is the text being inserted, and repeating the root there read as noise
  // beside the path the user is already typing. What it carries is BOTH
  // answers to the question the inserted text raises -- the ABSOLUTE PATH,
  // which says which file this actually is when two roots offer the same
  // relative one, and the source name below the rule. A client that shows no
  // documentation window shows no attribution at all, which is the cost.
  test("each item names the file it resolves to and the source that produced it", async () => {
    const documentTree = tree(["notes/deep.txt"]);
    const cwdTree = tree(["notes/wide.txt"]);
    try {
      const uri = pathToFileURL(join(documentTree.root, "doc.txt")).href;
      const fragment = only("notes/");

      for (const source of sourcesFor(fragment, uri, cwdTree.root)) {
        const items = await fromSource(source, fragment);
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          // The absolute path as THIS TEST computes it, never as the module
          // reported it -- an oracle taken from the subject cannot disagree
          // with it.
          expect(item.documentation).toEqual({
            kind: "markdown",
            value: `${join(source.root, item.insertText ?? "")}\n\n---\n\nsource: ${source.name}`,
          });
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
    // Same text, same labels, and even the same absolute path -- the source
    // name is the only thing that tells a broken document source from a
    // working absolute one.
    expect(fallback.map((item) => item.label)).toEqual(legitimate.map((item) => item.label));
    expect(fallback.map(documentationOf)).not.toEqual(legitimate.map(documentationOf));
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
      expect(documentationOf(items[0])).toContain("source: document");
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

  // THE SECOND DISCRIMINATOR, against a DIFFERENT wrong implementation: the
  // symlink case above catches a resolved-path dedup that joins without
  // realpath, and CANNOT catch one that calls realpath -- that one collapses
  // the symlink case correctly. Only a case where one file has two DIFFERENT
  // inserted texts separates them, and both texts must survive: they are two
  // different edits, and the user picked the one they can read.
  //
  // NESTED ROOTS, as the criterion asks: the document's parent is INSIDE cwd,
  // which is what lets both roots see one file at all.
  //
  // HANDED BACK, not worked around: the criterion spells this `one file yields
  // foo.ts and b/foo.ts`, and that pair CANNOT occur. Completion is per
  // segment, so the typed fragment supplies ONE directory part to every source
  // -- typing `fo` asks each root for its own `fo*`, typing `b/fo` asks each
  // for `b/fo*`, and no single request asks one root for `foo.ts` while asking
  // another for `b/foo.ts`. The property the criterion defends is reached by
  // giving one file two NAMES instead, which is the only way two roots produce
  // two strings for it.
  test("one file under two names in nested roots keeps BOTH items", async () => {
    const fixture = tree(["b/foo.ts"], [["foo-link.ts", "b/foo.ts"]]);
    try {
      // The document's parent is `b`; cwd is the tree above it.
      const uri = pathToFileURL(join(fixture.root, "b", "doc.txt")).href;
      const items = await complete({ uri, line: "foo" }, fixture.root);

      // Two strings, one file: `foo.ts` under the document's parent and
      // `foo-link.ts` under cwd resolve to the same bytes on disk.
      expect(realpathSync(join(fixture.root, "b", "foo.ts"))).toBe(
        realpathSync(join(fixture.root, "foo-link.ts")),
      );
      expect(inserted(items)).toEqual(["foo-link.ts", "foo.ts"]);
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
        expect(documentationOf(items[0])).toContain("source: cwd");
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
      const both = edit !== undefined && !("range" in edit) ? edit : undefined;
      // 4, where `foo` begins -- NOT 8, where `(1).p` does. BOTH ranges start
      // there: the criterion is about where the fragment BEGINS.
      expect(both?.insert.start.character).toBe(4);
      expect(both?.replace.start.character).toBe(4);

      // AND THE TWO ENDS DIFFER, which is the only place in this file they do.
      // The cursor sits mid-word, so `insert` stops at it and leaves the `ng`
      // standing while `replace` takes the whole word. WHICH ONE APPLIES IS
      // THE USER'S SETTING TO MAKE: carrying a single range would decide it
      // for them, and this user has already decided it.
      expect(both?.insert.end.character).toBe(cursor);
      expect(both?.replace.end.character).toBe(line.length);
      expect(applyAsClient(line, cursor, item, "replace")).toBe("see foo (1).png");
      expect(applyAsClient(line, cursor, item, "insert")).toBe("see foo (1).pngng");
      // The same item on the line as far as the user has TYPED it, where the
      // two coincide because there is nothing to the right of the cursor.
      expect(applyAsClient("see foo (1).p", cursor, item, "insert")).toBe("see foo (1).png");
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

/** Where an item's two ranges end, or undefined when it carries a single range. */
function endsOf(item: CompletionItem): { insert: number; replace: number } | undefined {
  const edit = item.textEdit;
  if (edit === undefined || "range" in edit) {
    return undefined;
  }
  return { insert: edit.insert.end.character, replace: edit.replace.end.character };
}

/** The one item a test means, out of what a completion produced. */
function itemInserting(items: readonly CompletionItem[], text: string): CompletionItem {
  const item = items.find((candidate) => candidate.insertText === text);
  if (item === undefined) {
    throw new Error(`no item inserting ${text} in ${JSON.stringify(inserted(items))}`);
  }
  return item;
}

describe("a replace range covers a filename the line already carries", () => {
  // THE HARM, in the feature the stakeholder uses with the setting they set:
  // the fragment's end stops at the first space, so `replace` used to delete
  // `spaced` alone and insert the whole filename over it -- leaving ` (1).txt`
  // standing and writing a line NEITHER mode would have produced.
  //
  // MEASURED IN THEIR OWN EDITOR before this was built, because everything
  // here rests on it: an extended replace end is honoured at confirm by nvim +
  // ddc + ddc-source-lsp, and today's end reproduces the mangled line there.
  test("completing over the filename replaces the whole of it", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (1).txt");

      // The filename ALONE: no tail, and nothing of the old line left.
      expect(applyAsClient(line, cursor, item, "replace")).toBe("spaced (1).txt");
      expect(endsOf(item)?.replace).toBe(line.length);
    } finally {
      fixture.dispose();
    }
  });

  // WHAT MAKES THE EXTENSION SAFE IS THAT IT NEVER FIRES ON A LINE THAT DOES
  // NOT ALREADY READ THE CANDIDATE, and the three tests below are the three
  // ways `already reads it` can be relaxed. Each is a DIFFERENT wrong line, so
  // each owns its own test rather than sharing one.
  //
  // BORN GREEN, and measured as such: all three were written and run against
  // the UNCHANGED module, where they pass because the whitespace end is the
  // only end there is. They are here to stay green ACROSS the change.
  test("a line carrying a DIFFERENT candidate keeps today's end", async () => {
    const fixture = tree(["spaced (2).txt"]);
    try {
      // The line reads `(1)` and the only candidate is `(2)`: same length,
      // same prefix, different file.
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (2).txt");

      expect(endsOf(item)?.replace).toBe("spaced".length);
      // DECLINED, NOT FIXED: the tail is still left behind here, and that is
      // the point. A prefix match would extend to the common prefix and write
      // `spaced (2).txt1).txt` instead -- worse than the defect, which is why
      // the comparison is exact.
      expect(applyAsClient(line, cursor, item, "replace")).toBe("spaced (2).txt (1).txt");
    } finally {
      fixture.dispose();
    }
  });

  // A SECOND HAZARD, and it needs its OWN line: on the line above, matching
  // anywhere and matching at the fragment's start give the same answer, so
  // that test cannot be the first thing a loosened START breaks.
  test("a candidate the line carries ELSEWHERE keeps today's end", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      // The user is typing a NEW `sp` in front of a filename that is already
      // there. The candidate does occur on this line -- just not where they
      // are typing.
      const line = "sp spaced (1).txt";
      const cursor = "sp".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (1).txt");

      expect(endsOf(item)?.replace).toBe(cursor);
      // Matching anywhere would end at 17 and swallow the filename beside the
      // cursor -- text the user never typed over.
      expect(applyAsClient(line, cursor, item, "replace")).toBe("spaced (1).txt spaced (1).txt");
    } finally {
      fixture.dispose();
    }
  });

  // A THIRD HAZARD, and the only one that makes the rule SHRINK a range: the
  // candidate is SHORTER than the word under the cursor. Nothing above can
  // catch it -- there the comparison fails and today's end is reached by the
  // other branch.
  test("a candidate SHORTER than the word under the cursor keeps today's end", async () => {
    const fixture = tree(["foo", "foo.txt"]);
    try {
      const line = "foo.txt";
      const cursor = "fo".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "foo");

      // 7, the whole word -- NOT 3, where `foo` stops. An end taken from the
      // candidate's length alone would pull the range BACK and leave `.txt`
      // standing behind the completion.
      expect(endsOf(item)?.replace).toBe(line.length);
      expect(applyAsClient(line, cursor, item, "replace")).toBe("foo");
    } finally {
      fixture.dispose();
    }
  });

  // THE INSERT ARM, asserted rather than assumed. Extending it past the cursor
  // would stop it being an insert at all and make the two arms one, which is
  // exactly what carrying an InsertReplaceEdit exists to prevent.
  test("the insert arm still ends at the cursor", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (1).txt");

      expect(endsOf(item)?.insert).toBe(cursor);
      // Everything right of the cursor stands, which is what the user asked
      // for by choosing `insert`.
      expect(applyAsClient(line, cursor, item, "insert")).toBe("spaced (1).txtced (1).txt");
    } finally {
      fixture.dispose();
    }
  });

  // BOTH ARMS IN ONE MEASUREMENT, AND THAT IS WHAT MAKES IT A MEASUREMENT AT
  // ALL. `an InsertReplaceEdit is produced when the client supports it` passes
  // unchanged against a module that produces one unconditionally -- which is
  // exactly the specification violation this pair exists to close -- so the
  // claim is only ever about the DIFFERENCE, and one request cannot carry it.
  // The two completions below differ in ONE input, and each perturbation that
  // collapses the module to a single shape reddens the other line.
  //
  // ASSERTED BY DISCRIMINATOR, `range` versus `insert`, because that is what a
  // client switches on: the protocol distinguishes the two edits by which key is
  // present and by nothing else, so an item carrying the wrong one is not a
  // degraded item but an unusable one.
  test("the edit shape follows the client's insertReplaceSupport, both ways", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const supported = itemInserting(
        await complete({ ...elsewhere, line }, fixture.root, cursor, true),
        line,
      );
      const plain = itemInserting(
        await complete({ ...elsewhere, line }, fixture.root, cursor, false),
        line,
      );

      const supportedEdit = supported.textEdit;
      const plainEdit = plain.textEdit;
      expect(supportedEdit !== undefined && "insert" in supportedEdit).toBe(true);
      expect(plainEdit !== undefined && "range" in plainEdit).toBe(true);

      // AND THE PLAIN EDIT IS THE INSERT RANGE RATHER THAN THE REPLACE ONE,
      // which is the half a shape check alone would miss: both are `TextEdit`s
      // and only the end tells them apart. The replace end here reaches the end
      // of the line, so a module that took it would put a number no client asked
      // for on an edit the client cannot decline.
      expect(
        plainEdit !== undefined && "range" in plainEdit ? plainEdit.range.end : undefined,
      ).toEqual({ line: 0, character: cursor });

      // WHAT EACH CLIENT ACTUALLY GETS IN ITS BUFFER, so the ruling above is
      // read as a consequence rather than as a preference: the supporting client
      // that chose `replace` gets the clean line, and the client that could not
      // choose gets the tail left standing -- visible, and deleted by typing.
      expect(applyAsClient(line, cursor, supported, "replace")).toBe(line);
      expect(applyAsClient(line, cursor, plain)).toBe("spaced (1).txtced (1).txt");
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
function applyAsClient(
  line: string,
  character: number,
  item: CompletionItem,
  prefers: "insert" | "replace" = "insert",
): string {
  const edit = item.textEdit;
  if (edit !== undefined && "range" in edit) {
    return (
      line.slice(0, edit.range.start.character) +
      edit.newText +
      line.slice(edit.range.end.character)
    );
  }
  if (edit !== undefined) {
    // The client indexes the edit BY ITS OWN SETTING, which is the whole point
    // of carrying both: `insert` leaves what is right of the cursor, `replace`
    // takes the rest of the word with it.
    const range = edit[prefers];
    return line.slice(0, range.start.character) + edit.newText + line.slice(range.end.character);
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
      // BOTH preferences: at the end of a line the two ranges coincide, and
      // what this test claims is that each of them is WHOLE.
      expect(applyAsClient(line, line.length, item, "insert")).toBe("see src/foo.ts");
      expect(applyAsClient(line, line.length, item, "replace")).toBe("see src/foo.ts");

      // The client classes read DIFFERENT fields for the same text, so a drift
      // between them breaks one of them silently.
      const edit = item.textEdit;
      expect(edit !== undefined && !("range" in edit) ? edit.newText : undefined).toBe(
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
      // BOTH ranges, never one: the client reads whichever its own setting
      // names, so a malformed half is invisible until somebody flips it.
      const ranges = edit !== undefined && !("range" in edit) ? [edit.insert, edit.replace] : [];

      expect(ranges).toHaveLength(2);
      for (const range of ranges) {
        expect(range.start.line).toBe(0);
        expect(range.end.line).toBe(0);
        expect(range.start.character).toBe(0);
        expect(range.end.character).toBe("src/fo".length);
      }
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
        // EVERY LITERAL IS A BATCH OF ITEMS AND THEY ARE ALL THE SAME SHAPE.
        // Between Sprints 42 and 43 the first carried its items inside a
        // `CompletionList` and later ones were bare arrays, so reading a batch
        // meant handling either -- the BATCHING claim below never depended on
        // which position a literal arrived in, and that is why it survived both
        // moves without an assertion changing.
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
