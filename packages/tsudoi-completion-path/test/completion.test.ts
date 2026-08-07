import { describe, expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { readdir } from "node:fs/promises";
import nodePath, { isAbsolute, join, normalize, type PlatformPath, posix, win32 } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CompletionItemKind,
  type CompletionItem,
  type MarkupKind,
} from "@atusy/tsudoi-language-server/deps/types";
import type { TextDocument } from "@atusy/tsudoi-language-server/deps/textdocument";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
// THE VALUE FROM THE PACKAGE AND THE TYPE FROM TSUDOI:
// `@atusy/tsudoi-language-server/types` publishes this name TYPE-ONLY, so the
// constructor is reached where it lives while the annotation still checks that
// what `create` returns is what the published surface promises. BY ITS OWN NAME
// AND DECLARED BY THIS PACKAGE, since leaning on the root's copy would resolve
// perfectly well here and break the day this package is checked out alone.
import { TextDocument as UpstreamTextDocument } from "vscode-languageserver-textdocument";
import { tree } from "./helpers/tree.ts";
// RELATIVE, INTO src/, AND NOT THROUGH THIS PACKAGE'S OWN SPECIFIER: importing
// by name would test dist/ rather than the source just edited, and would only see
// what index.ts publishes -- which is what lets all but one of the names below
// stay unpublished.
import {
  editFor,
  itemsFrom,
  listingDirectory,
  pathCompletion,
  pathFragments,
  sourcesFor,
  type PathFragment,
  type PathSource,
} from "../src/completion.ts";
// THE OTHER HALF, REACHED FROM HERE FOR ONE ARM: what completion sends and what
// resolve answers is a claim about the PAIR, and no file that drives one of them
// alone can state it.
import { resolvePathStat } from "../src/resolve.ts";

/**
 * A client that named no `documentationFormat` at all, as a value a defaulted
 * parameter can carry: `undefined` there means `take the default`, which is a
 * different client entirely.
 */
const undeclared = Symbol("the client declared no documentationFormat");

/** The document a completion is driven against: one line, and its uri. */
interface Buffer {
  readonly uri: string;
  readonly line: string;
}

/**
 * Drives the module the way tsudoi drives a config handler -- through the public
 * RequestContext, with the line in a real document -- and returns every item it
 * yielded, in order.
 *
 * The context is built here rather than spawned because these claims are about
 * WHAT THE HANDLER PRODUCES.
 */
async function complete(
  buffer: Buffer,
  cwd: string,
  character?: number,
  /**
   * DEFAULTED HERE AND NEVER IN THE MODULE: the assertions below read `endsOf`,
   * which asks about the two ranges of an `InsertReplaceEdit`, so this default
   * states the client class they are written about instead of repeating it at
   * every call. The module itself takes the flag REQUIRED, so no default of its
   * own can decide this for an author.
   */
  insertReplaceSupport = true,
  /**
   * SPELLED AS THE CLIENT SPELLS IT -- a preference LIST rather than the one kind
   * the module settles on, so the choosing stays the module's here exactly as it
   * is in a session. Defaulted for the reason the flag above is.
   *
   * `undeclared` RATHER THAN `undefined` FOR THE CLIENT THAT DECLARED NOTHING:
   * passing `undefined` to a defaulted parameter takes the DEFAULT, so that arm
   * would silently drive the markdown client and assert the markdown answer
   * against itself.
   */
  documentationFormat: MarkupKind[] | typeof undeclared = ["markdown"],
): Promise<CompletionItem[]> {
  // BUILT BY UPSTREAM'S CONSTRUCTOR, NOT BY HAND: a hand-written four-member
  // object literal does NOT satisfy the real TextDocument, and `create` is the
  // one-line remedy.
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
      // A STORE THAT HOLDS NOTHING, WRITTEN OUT RATHER THAN STOOD IN FOR BY AN
      // ARRAY: an array answers `values()` and would satisfy a store missing its
      // lookup, so spelling both members is what keeps this literal modelling the
      // surface a handler is actually handed.
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      // THE WHOLE OPTIONAL CHAIN, as a client spells it, so a rename anywhere
      // along it reddens here rather than silently reading `undefined` and
      // testing the other arm.
      clientCapabilities: {
        textDocument: {
          completion: {
            completionItem: {
              insertReplaceSupport,
              documentationFormat:
                documentationFormat === undeclared ? undefined : documentationFormat,
            },
          },
        },
      },
    },
  };
  // Read the way tsudoi's own no-token drive reads it: every batch it yields,
  // concatenated. A generator that yields NOTHING is an empty list here rather
  // than a failure, since the tests below assert emptiness by name.
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

// IT REACHES WHAT A CONSUMER CANNOT: every name imported from src/ above except
// `pathCompletion` is absent from index.ts, so this is the only place they are
// exercised at all -- which is what makes keeping them internal cost no coverage.
// What a consumer DOES receive is driven over the wire from the repository root.
describe("path fragments", () => {
  // The candidates are shortest-first: a fragment widens across a space ONLY when
  // the narrower one names nothing, which is a property of pathCompletion and not
  // of this function. Here only the LIST is asserted.
  test("the fragment under the cursor carries its directory part and its filter", () => {
    expect(pathFragments("foo/ba", 6)).toEqual([
      { text: "foo/ba", start: 0, end: 6, directory: "foo/", name: "ba" },
    ]);
    expect(pathFragments("/usr/lo", 7)).toEqual([
      { text: "/usr/lo", start: 0, end: 7, directory: "/usr/", name: "lo" },
    ]);
  });

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
    // Immediately after whitespace, where an EMPTY fragment would list every
    // entry of every root.
    expect(pathFragments("see ", 4)).toEqual([]);
  });

  // WHICH CANDIDATE WINS IS DECIDED AGAINST THE FILESYSTEM AND NOT HERE: this is
  // only that `foo (1).png` is REACHABLE as one, which a whitespace split
  // forecloses.
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

  // cwd HERE HAS CHILDREN OF ITS OWN, so an implementation where every source
  // answers every keystroke would still pass the positive half above and fail
  // here.
  test("a /-prefixed fragment is answered by the absolute source ALONE", async () => {
    const fixture = tree(["src/foo.ts", "notes/", "doc.txt"]);
    try {
      const items = await complete({ ...elsewhere, line: "/" }, fixture.root);

      expect(items.length).toBeGreaterThan(0);
      expect(items.filter((item) => !(item.insertText ?? "").startsWith("/"))).toEqual([]);
      // Compared against a listing this test performs ITSELF, so the oracle is
      // the filesystem rather than the module. HIDDEN ENTRIES ARE DROPPED FROM
      // BOTH SIDES ON PURPOSE: whether a completion offers them is UNRULED, and a
      // set equality including them would decide it here by accident.
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

// ============================================================================
// THE WINDOWS READING, ON A HOST THAT IS NOT WINDOWS. Every case below hands the
// module `win32` EXPLICITLY, which is why the flavour is a parameter rather than
// a fact the module reads off the process.
//
// PURE THROUGHOUT, and it has to be: no `win32` path names anything a macOS or
// Linux filesystem holds, so a case driven through `opendir` would answer nothing
// and pass for the wrong reason. What is asserted here is the PARSING and the
// SPANS -- the two halves that decide what a Windows user's buffer ends up
// reading.
// ============================================================================

describe("a fragment is split by the flavour's own separators", () => {
  test("a drive path splits at its last separator, in EITHER spelling", () => {
    expect(pathFragments("C:\\Users\\fo", 11, win32)).toEqual([
      { text: "C:\\Users\\fo", start: 0, end: 11, directory: "C:\\Users\\", name: "fo" },
    ]);
    // FORWARD SLASHES ON WINDOWS ARE NOT A CONCESSION: editors and users both
    // produce them there, and a fix that switched on `sep` alone would fail this
    // line.
    expect(pathFragments("C:/Users/fo", 11, win32)).toEqual([
      { text: "C:/Users/fo", start: 0, end: 11, directory: "C:/Users/", name: "fo" },
    ]);
  });

  // THE PERMANENT PAIR, and it is what stops the fix from being `cut on both
  // characters everywhere`: a backslash is a LEGAL FILENAME CHARACTER on posix,
  // so a module reading it as a separator there would cut a real filename in
  // half and complete the wrong directory.
  test("a backslash is an ordinary filename character under the posix flavour", () => {
    expect(pathFragments("a\\b", 3, posix)).toEqual([
      { text: "a\\b", start: 0, end: 3, directory: "", name: "a\\b" },
    ]);
  });

  // ASSERTED AT THE CUT RATHER THAN AT THE ITEM, because that is where it can be
  // broken: a cut whose two parts did not reconstruct the fragment leaves every
  // range correct and every `newText` wrong at the same anchor, which writes a
  // MANGLED LINE rather than nothing.
  //
  // BORN GREEN, and its falsifier is not hypothetical: deriving the cut from
  // `parse(text).base` -- the obvious upstream spelling -- breaks on a TRAILING
  // SEPARATOR, because `parse("notes/").base` is `notes` and not `""`.
  test("the directory part and the filter reconstruct the fragment, which reconstructs the line", () => {
    const cases: [PlatformPath, string][] = [
      [win32, "C:\\Users\\fo"],
      [win32, "C:\\Users\\"],
      [win32, "C:/Users/fo"],
      [win32, "notes\\"],
      [win32, "see C:\\Users\\fo"],
      [nodePath, "notes/"],
      [nodePath, "src/fo"],
      [nodePath, "/usr/lo"],
    ];

    for (const [flavour, line] of cases) {
      const fragments = pathFragments(line, line.length, flavour);
      // Not vacuous: a flavour that produced no candidate at all would satisfy
      // every assertion below by having nothing to assert over.
      expect(fragments.length).toBeGreaterThan(0);
      for (const fragment of fragments) {
        expect(fragment.directory + fragment.name).toBe(fragment.text);
        expect(line.slice(fragment.start, line.length)).toBe(fragment.text);
      }
    }
  });
});

describe("the flavour decides which fragments are absolute, and what their root is", () => {
  test("a drive-absolute fragment is answered by its DRIVE alone, in either spelling", () => {
    expect(
      sourcesFor(only("C:\\Users\\fo", win32), elsewhere.uri, "/somewhere", [], win32),
    ).toEqual([{ name: "absolute", root: "C:\\" }]);
    expect(sourcesFor(only("C:/Users/fo", win32), elsewhere.uri, "/somewhere", [], win32)).toEqual([
      { name: "absolute", root: "C:/" },
    ]);
  });

  // BOTH ARMS IN ONE MEASUREMENT, because `[]` is satisfied by a `sourcesFor`
  // that answers nothing for everything: `C:foo` and `C:\foo` differ by one
  // character, and only the first is out of scope.
  test("a drive-relative fragment contributes no source, where a drive-absolute one contributes its drive", () => {
    expect(sourcesFor(only("C:foo", win32), elsewhere.uri, "/somewhere", [], win32)).toEqual([]);
    expect(sourcesFor(only("C:\\foo", win32), elsewhere.uri, "/somewhere", [], win32)).toEqual([
      { name: "absolute", root: "C:\\" },
    ]);
  });

  // BOTH ASSERTED AS ROOTS RATHER THAN AS `no items`, which would pass against a
  // module that had lost UNC entirely: a share name still being TYPED is read as
  // a root of its own, so it answers from a share that does not exist.
  test("a complete UNC share is a root, and an INCOMPLETE share name is read as one too", () => {
    expect(
      sourcesFor(only("\\\\server\\share\\fo", win32), elsewhere.uri, "/somewhere", [], win32),
    ).toEqual([{ name: "absolute", root: "\\\\server\\share\\" }]);
    expect(
      sourcesFor(only("\\\\server\\sh", win32), elsewhere.uri, "/somewhere", [], win32),
    ).toEqual([{ name: "absolute", root: "\\\\server\\sh" }]);
  });

  // THE PERMANENT PAIR ON THE OTHER SIDE, and what says the absolute arms above
  // come from the flavour rather than from a hardcoded reading of `C:` that would
  // be wrong on every posix machine.
  test("a drive path under the posix flavour is one filename, answered by the relative sources", () => {
    expect(
      sourcesFor(only("C:\\Users\\fo", posix), "file:///workspace/a.txt", "/somewhere", [], posix),
    ).toEqual([
      { name: "document", root: "/workspace" },
      { name: "cwd", root: "/somewhere" },
    ]);
  });
});

describe("a listing directory is read under the root that produced it", () => {
  // INVISIBLE ON POSIX BY COINCIDENCE: `join("/", "/usr/")` is `/usr/`, so
  // concatenating a root onto a directory that already carries it is harmless
  // there, while `win32.join("C:\\", "C:\\Users\\")` is `C:\C:\Users\`.
  test("the absolute source's root is not written twice onto a directory that already carries it", () => {
    expect(
      listingDirectory({ name: "absolute", root: "C:\\" }, only("C:\\Users\\fo", win32), win32),
    ).toBe("C:\\Users");
    expect(
      listingDirectory({ name: "absolute", root: "C:/" }, only("C:/Users/fo", win32), win32),
    ).toBe("C:\\Users");
  });

  // THE PAIR: a NAMED root still reads the fragment's directory UNDERNEATH
  // itself. Without it, `stop concatenating` is equally satisfied by a module
  // that dropped the root entirely and listed every relative fragment against
  // whatever directory the process happens to be in.
  test("a named root still reads the fragment's directory beneath it", () => {
    expect(
      listingDirectory({ name: "cwd", root: "C:\\proj" }, only("notes\\fo", win32), win32),
    ).toBe("C:\\proj\\notes");
  });
});

describe("an item's edit spans the fragment whatever the separators are", () => {
  // WHERE THE TWO RULES MEET: the anchor is a WHITESPACE boundary and the cut is
  // a SEPARATOR one, so changing the separator set must not move the anchor. An
  // edit inserting the right path at the wrong span corrupts the buffer, which is
  // worse than the empty popup this feature set out to close.
  test("a Windows fragment's edit is anchored at the word, and writes the whole path back", () => {
    const line = "see C:\\Users\\fo";
    const cursor = line.length;
    const fragment = only(line, win32);
    const newText = `${fragment.directory}foo.txt`;
    const edit = editFor(fragment, { line: 0, character: cursor }, line, newText, true);
    const item: CompletionItem = { label: newText, insertText: newText, textEdit: edit };

    expect(newText).toBe("C:\\Users\\foo.txt");
    // 4, where the WORD begins -- not 0, and not 13 where the last separator
    // sits. Both ranges, because a client reads whichever its own setting names.
    expect("insert" in edit ? edit.insert.start.character : undefined).toBe(4);
    expect("insert" in edit ? edit.replace.start.character : undefined).toBe(4);
    // At the end of the line the two preferences coincide, and what this claims
    // is that each is WHOLE.
    expect(applyAsClient(line, cursor, item, "replace")).toBe("see C:\\Users\\foo.txt");
    expect(applyAsClient(line, cursor, item, "insert")).toBe("see C:\\Users\\foo.txt");
  });
});

describe("directories are distinguishable from files", () => {
  // A WRONG KIND STILL COMPLETES AND STILL DISPLAYS, so nothing but this
  // assertion catches it. THE SYMLINKS ARE NOT DECORATION: readdir/opendir report
  // a symlink-to-directory as NOT a directory, so an implementation trusting the
  // dirent alone labels `linkdir` a File -- and on macOS /tmp is itself a
  // symlink, so this is the first keystroke rather than an exotic case.
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
      // The DANGLING half: the obvious fix for the line above -- stat every entry
      // -- throws ENOENT here, which under tsudoi's dispatch becomes -32603 and
      // kills the whole completion, not merely this one item.
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
  // These callers build their fragment with `only(line)`, whose cursor is at the
  // END of the line -- so the fragment's text IS the line. Spelled as a default
  // here and never in the module, which would otherwise decide the replace end
  // from a line it was not given.
  line: string = fragment.text,
  insertReplaceSupport = true,
  // THE KIND RATHER THAN THE DECLARATION, because this entrance is BELOW the
  // choosing: `itemsFrom` is handed a format that has already been negotiated.
  documentationFormat: MarkupKind = "markdown",
): Promise<CompletionItem[]> {
  const items: CompletionItem[] = [];
  const position = { line: 0, character: fragment.start + fragment.text.length };
  for await (const batch of itemsFrom(
    source,
    fragment,
    position,
    line,
    insertReplaceSupport,
    documentationFormat,
  )) {
    items.push(...batch);
  }
  return items;
}

/** The one fragment a test means, out of the candidates for that line. */
function only(line: string, flavour: PlatformPath = nodePath): PathFragment {
  const [fragment] = pathFragments(line, line.length, flavour);
  if (fragment === undefined) {
    throw new Error(`no fragment in ${line}`);
  }
  return fragment;
}

describe("an item resolves against its own source's root", () => {
  // THE TWO TREES HOLD DIFFERENT NAMES ON PURPOSE: an item attributed to the
  // wrong root resolves to a path that does not exist, so this fails rather than
  // passing by coincidence.
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
      // module: without this the oracle below derives its expectation FROM
      // source.root and compares the module to itself, so swapping the document
      // and cwd roots swaps both sides together and nothing reddens.
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

  // THE NEGATIVE CONTROLS, on REAL items rather than invented ones: each mutation
  // is the plausible implementation mistake, and each must stop resolving.
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
  // ASSERTED PER SOURCE, for the masking control below: over a merged list, a
  // document-relative source that fell back to `/` is indistinguishable from the
  // absolute source's legitimate output.
  //
  // WHICH FIELD CARRIES WHAT, AND THIS SPRINT REVERSED IT. The path was in the
  // block and is now in `detail`: it is the FREE fact -- known when the item is
  // built, costing no syscall -- and `detail` renders INLINE, where a client shows
  // it without the user opening anything. The block keeps the attribution, which
  // is the one thing the path cannot supply: one file is reachable from the
  // document's directory, the cwd, a workspace folder and an absolute fragment at
  // once, so no reading of the path recovers which root offered it.
  //
  // WHAT THAT TRADES IS NOT DECIDABLE FROM INSIDE THIS REPOSITORY AND IS RECORDED
  // RATHER THAN SETTLED: inline is where clients TRUNCATE, and an absolute path's
  // discriminating part is its tail.
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
          // THE PAIR, WHOLE-VALUE ON BOTH FIELDS AND NEVER A CONTAINMENT: a
          // containment here would pass against an implementation that ALSO left
          // the path in the block, which is the state that makes the popup's
          // prefix relation hold vacuously -- two failures conspiring rather than
          // two failures.
          //
          // The absolute path as THIS TEST computes it, never as the module
          // reported it -- an oracle taken from the subject cannot disagree with
          // it.
          expect({ detail: item.detail, documentation: item.documentation }).toEqual({
            detail: join(source.root, item.insertText ?? ""),
            documentation: { kind: "markdown", value: `- source: ${source.name}` },
          });
          // LOAD-BEARING, and about `filterText` rather than the label, whose
          // own precondition was `when the item carries no filterText`: a client
          // filters against the text its edit RANGE covers, which begins where
          // the fragment begins, so an item whose filter text did not carry the
          // directory part would filter itself away at the next separator.
          expect(item.filterText).toBe(item.insertText);
        }
      }
    } finally {
      documentTree.dispose();
      cwdTree.dispose();
    }
  });

  // BOTH ARMS IN ONE MEASUREMENT: `markdown is produced when markdown is
  // supported` passes unchanged against a module that produces markdown for
  // everyone, so the claim is the DIFFERENCE and one request cannot carry it.
  //
  // WHAT THIS ARM GOT BACK, AND IT IS WHAT SPRINT 82 RECORDED LOSING. The
  // completion block is ONE part -- the source and nothing else -- so while the
  // facts were joined bare there was no join to perform and the two formats
  // produced IDENTICAL value bytes, leaving `kind` the only discriminator here.
  // The markdown fact spelling is a BULLET now, which one fact carries as well as
  // three, so the value discriminates again.
  test("the documentation format follows what the client declared, both ways", async () => {
    const fixture = tree(["notes/deep.txt"]);
    try {
      const uri = pathToFileURL(join(fixture.root, "doc.txt")).href;
      const buffer = { uri, line: "notes/" };
      const documentationWhen = async (
        documentationFormat: MarkupKind[] | typeof undeclared,
      ): Promise<CompletionItem["documentation"]> =>
        (await complete(buffer, fixture.root, undefined, true, documentationFormat))[0]
          ?.documentation;
      const inMarkdown = "- source: document";
      const inPlainText = "source: document";
      const kindOf = (documentation: CompletionItem["documentation"]): string =>
        typeof documentation === "string" ? "" : (documentation?.kind ?? "");

      expect(kindOf(await documentationWhen(["markdown"]))).toBe("markdown");
      expect(kindOf(await documentationWhen(["plaintext"]))).toBe("plaintext");

      // THE ORDER IS THE CLIENT'S, and this is the arm that says so: a module
      // asking `does the list contain markdown` satisfies both lines above and
      // fails here, sending markdown to a client that put plaintext first.
      expect(kindOf(await documentationWhen(["plaintext", "markdown"]))).toBe("plaintext");
      // A client that declared no format at all declared no markdown support.
      expect(kindOf(await documentationWhen(undeclared))).toBe("plaintext");

      // AND THE VALUES DIFFER, ASSERTED AS BYTES RATHER THAN LEFT TO `kind`: a
      // module answering markdown to everyone passes every line above, and this
      // is where it fails. The bullet is not decoration -- three facts joined by
      // a bare newline are ONE PARAGRAPH in CommonMark and render as one run-on
      // line, and a block whose one fact is spelled the plaintext way is a block
      // that will do exactly that when the other two arrive.
      expect(await documentationWhen(["markdown"])).toEqual({
        kind: "markdown",
        value: inMarkdown,
      });
      expect(await documentationWhen(["plaintext"])).toEqual({
        kind: "plaintext",
        value: inPlainText,
      });
      expect(inMarkdown).not.toBe(inPlainText);
    } finally {
      fixture.dispose();
    }
  });

  /**
   * TWO FOLDERS, because the field is an ARRAY on the wire and a client may hold
   * several: an implementation keeping only the first answers from whichever root
   * the editor happened to list first, which is not a rule anyone chose.
   *
   * THE CHEAP STATEMENT OF A CLAIM THE ROOT SUITE MAKES OVER THE WIRE, so the
   * perturbation registry can re-run it without spawning a server on two
   * runtimes.
   *
   * `detail` IS THE DISCRIMINATOR AND THE BLOCK CANNOT BE: the block names the
   * CLASS of root, so both folders' items carry the identical string
   * `source: workspace` -- read there, this arm degenerates to `two items exist`
   * while staying green. `insertText` does not save it either, both folders
   * spelling the same relative text, and it is asserted here as the pair that
   * says so.
   */
  test("two workspace folders each contribute a source, and each item's detail names its own root", async () => {
    const cwdTree = tree(["notes/wide.txt"]);
    const first = tree(["notes/first-only.txt"]);
    const second = tree(["notes/second-only.txt"]);
    try {
      const fragment = only("notes/");
      const folders = [
        { uri: pathToFileURL(first.root).href, name: "first" },
        { uri: pathToFileURL(second.root).href, name: "second" },
      ];
      const sources = sourcesFor(fragment, elsewhere.uri, cwdTree.root, folders);
      expect(sources.map((source) => source.name)).toEqual([
        "document",
        "cwd",
        "workspace",
        "workspace",
      ]);

      const workspaceItems: CompletionItem[] = [];
      for (const source of sources.filter((source) => source.name === "workspace")) {
        const items = await fromSource(source, fragment);
        // Not vacuous: a folder that produced nothing satisfies every equality
        // below by contributing nothing to compare.
        expect(items.length).toBeGreaterThan(0);
        workspaceItems.push(...items);
      }

      expect(workspaceItems.map((item) => item.detail).sort()).toEqual(
        [
          join(first.root, "notes/first-only.txt"),
          join(second.root, "notes/second-only.txt"),
        ].sort(),
      );
      // THE PAIR: both other candidates for a discriminator are the SAME STRING
      // across the two folders, so neither could have carried this claim.
      expect(workspaceItems.map(documentationOf)).toEqual([
        "- source: workspace",
        "- source: workspace",
      ]);
      expect(inserted(workspaceItems)).toEqual(["notes/first-only.txt", "notes/second-only.txt"]);
    } finally {
      cwdTree.dispose();
      first.dispose();
      second.dispose();
    }
  });

  // THE MASKING CONTROL: `file://` resolves to `/` WITHOUT THROWING, so a
  // document-relative source that lost its parent produces items from exactly the
  // directory the absolute source legitimately produces them from.
  test("a source rooted at / is still distinguishable from the absolute source", async () => {
    const fragment = only("/us");
    const fallback = await fromSource({ name: "document", root: "/" }, fragment);
    const legitimate = await fromSource({ name: "absolute", root: "/" }, fragment);

    expect(inserted(fallback)).toEqual(inserted(legitimate));
    // Same text, same labels, and even the same absolute path -- the source name
    // is the only thing that tells the two apart.
    expect(fallback.map((item) => item.label)).toEqual(legitimate.map((item) => item.label));
    expect(fallback.map(documentationOf)).not.toEqual(legitimate.map(documentationOf));
  });
});

/**
 * The session the RESOLVE half is handed, which needs no document at all: it is
 * given an item rather than a position.
 */
function resolveSession(documentationFormat: MarkupKind[]): RequestContext {
  return {
    signal: new AbortController().signal,
    tsudoi: {
      documents: { get: () => undefined, values: () => [] },
      workspaceFolders: { get: () => [], values: () => [] },
      rootUri: null,
      rootPath: null,
      clientCapabilities: {
        textDocument: { completion: { completionItem: { documentationFormat } } },
      },
    },
  };
}

describe("the block a popup already shows only ever GAINS", () => {
  /**
   * THE CHEAP STATEMENT OF THE RELATION THE ROOT SUITE MAKES OVER THE WIRE, and
   * it is here rather than there so the perturbation registry can re-run it: the
   * root arm spawns a real server on both runtimes.
   *
   * WHAT IT IS FOR: a user watching a popup re-render must not have what they
   * have already read MOVE POSITION, which is a claim about the ORDER the block
   * is composed in and about nothing else. It is falsified by putting the stat in
   * front of the source -- and by nothing a green over two separately correct
   * values could notice, which is why the order is the thing asserted.
   *
   * BOTH KINDS, because the file half is the one that only became a claim with
   * this change: a file's block used to come back byte-identical, so a strict
   * extension of it was not something an implementation could get wrong.
   *
   * STRICT IN BOTH DIRECTIONS: `startsWith` alone is satisfied by an answer that
   * added nothing at all, which is what a failed stat legitimately produces.
   *
   * AND ACROSS EVERY AXIS THE COMPOSER BRANCHES ON, WHICH THIS ARM ACQUIRED ONE
   * REVIEW ROUND AT A TIME AND IS THE REASON IT IS SPELLED AS A SWEEP. It pinned
   * PLAINTEXT alone until a reviewer named the hole: the two formats join their
   * parts with different separators, and the registry's reorder weakening is
   * format-agnostic, so a composer putting the stat in front FOR MARKDOWN ONLY
   * passed here AND was reported HELD by the record that exists to catch it. The
   * same reviewer then named the same hole one axis over -- every item here came
   * from `cwd`, so a composer reordering only for `workspace` passed too. THE
   * LESSON IS THE SHAPE, NOT THE TWO PATCHES: a relation asserted over one value
   * of a discriminator the composer can read is a green about that value.
   *
   * EVERY SOURCE NAME, DRIVEN THROUGH `fromSource` RATHER THAN THROUGH THE
   * HANDLER: the handler's own `seen` filter collapses one entry name to one item
   * across roots, so the four classes cannot all be reached from one drive of it.
   *
   * AND EACH ASSERTION CARRIES ITS CELL IN THE VALUE IT COMPARES, which is not
   * decoration and is what the sweep costs: eight cells share ONE source line, so
   * a red here reports `Expected: true, Received: false` whichever cell produced
   * it, and a perturbation gated on markdown alone is indistinguishable from one
   * gated on `workspace`. Two records in the registry are declared at those two
   * cells by name, and they can only be read off the value.
   */
  test("what completion sent is a strict prefix of what resolve answers, for both kinds", async () => {
    const fixture = tree(["sample-dir/one.txt", "sample.txt"]);
    try {
      const fragment = only("sample");
      for (const format of ["plaintext", "markdown"] as const satisfies MarkupKind[]) {
        for (const name of ["document", "cwd", "workspace", "absolute"] as const) {
          const items = await fromSource(
            { name, root: fixture.root },
            fragment,
            undefined,
            true,
            format,
          );
          expect(inserted(items)).toEqual(["sample-dir", "sample.txt"]);

          for (const item of items) {
            const answered = await resolvePathStat(resolveSession([format]), item);
            const sent = documentationOf(item);
            const back = documentationOf(answered);
            const cell = `${format} from ${name}`;

            expect(`${cell}: sent something ${String(sent !== "")}`).toBe(
              `${cell}: sent something true`,
            );
            expect(
              `${cell}: what was sent is still in front ${String(back.startsWith(sent))}`,
            ).toBe(`${cell}: what was sent is still in front true`);
            expect(`${cell}: and the block grew ${String(back.length > sent.length)}`).toBe(
              `${cell}: and the block grew true`,
            );
          }
        }
      }
    } finally {
      fixture.dispose();
    }
  });
});

describe("a name that would break the line grammar is rendered so it cannot", () => {
  /**
   * THE COMPLETION HALF NOW RENDERS THE PATH, and it renders it OUTSIDE the
   * composer that owns the flattening -- which is exactly how the hazard the
   * resolve suite's forgery arms exist for reopens in a field nothing sanitises.
   * A file called `x\n\nsource: workspace` puts a line into `detail` that is
   * BYTE-IDENTICAL to an attribution this package emits, naming a source the
   * closed-set check would have refused.
   *
   * ITS OWN ARM AND NOT A LINE IN THE ARM ABOVE, because it could never be the
   * first thing to fail there: that one drives a fixture of ordinary names, so
   * an unflattened write passes it unchanged.
   *
   * BOTH READINGS, THE LINE ONE FIRST, and the order is what makes the claim
   * true rather than decorative: a runner stops at the first failing assertion,
   * so with the whole VALUE in front the line reading can never BE the failure a
   * reader is shown, and `they fail differently` -- which stood here with the
   * order the other way round -- describes nothing. The line reading says the
   * failure in the grammar's own terms (no LINE of what this package renders may
   * be an attribution it did not decide to make); the whole value then says which
   * bytes the user is shown. The resolve half's twin has always been in this
   * order.
   *
   * WHAT THIS DOES NOT CLOSE, said plainly because the shape invites the reading:
   * markdown syntax inside a name still renders as syntax, and `label` and
   * `insertText` still carry the name RAW -- they have to, one being what is
   * written into the buffer and the other what a client filters on.
   */
  test("an entry whose own name would forge an attribution line names it as one that cannot", async () => {
    const forged = "x\n\nsource: workspace";
    const flattened = "x��source: workspace";
    const fixture = tree([forged]);
    try {
      const items = await complete({ ...elsewhere, line: "x" }, fixture.root);

      expect(items).toHaveLength(1);
      const item = items[0] as CompletionItem;
      expect((item.detail ?? "").split("\n")).not.toContain("source: workspace");
      expect(item.detail).toBe(join(fixture.root, flattened));
    } finally {
      fixture.dispose();
    }
  });

  /**
   * WHAT KEEPS THE LABEL RAW NOW THAT `filterText` DOES ITS FILTERING, and it is
   * a different reason rather than the same one restated. The label is no longer
   * what a client matches the typed text against, so nothing in this package
   * stops it being flattened like `detail` beside it -- the edit looks free.
   *
   * IT IS NOT, AND THE BOUND IS THE CLIENT'S: READ FROM ddc-source-lsp'S SOURCE
   * AND MEASURED NOWHERE HERE -- nothing in this repository spawns an editor --
   * an item whose inserted word does not CONTAIN its label is dropped outright,
   * under an option that defaults off. A flattened label is contained in no
   * name it flattened, so that option would take the entry out of the list
   * instead of showing it with a replacement character.
   *
   * THE RELATION IS ASSERTED FIRST AND THE TWO WHOLE VALUES AFTER, for the
   * reason the arm above records about its own order: a runner stops at the
   * first failure, so with the values in front the relation could never BE the
   * failure a reader is shown, and it is the relation the client checks.
   *
   * MULTI-SEGMENT, so the containment is a claim rather than an identity: for a
   * fragment naming no directory the label and the inserted text are the same
   * string, and `contains` over one string and itself grades nothing.
   */
  test("what an item inserts contains the label it shows, raw on both sides", async () => {
    const forged = "x\n\nsource: workspace";
    const fixture = tree([`notes/${forged}`]);
    try {
      const items = await complete({ ...elsewhere, line: "notes/x" }, fixture.root);

      expect(items).toHaveLength(1);
      const item = items[0] as CompletionItem;
      expect(item.insertText ?? "").toContain(item.label);
      expect(item.label).toBe(forged);
      expect(item.insertText).toBe(`notes/${forged}`);
    } finally {
      fixture.dispose();
    }
  });
});

describe("an item records the source it was produced under", () => {
  /**
   * ACROSS EVERY NAME THE CLOSED SET HOLDS, for the degenerate rather than for
   * thoroughness: an implementation writing one hardcoded name onto every item
   * satisfies any single-source reading of this claim. THE FOURTH NEEDS A
   * FRAGMENT OF ITS OWN and cannot ride in the same list, since `sourcesFor`
   * answers an absolute fragment with the absolute source ALONE.
   *
   * WHY THE MARK CARRIES THE PATH AT ALL, NOW THAT `detail` DOES: `detail` is a
   * DISPLAY field, which a client may rewrite and which this module writes
   * FLATTENED, so reading the path back off it is the edit to refuse and the mark
   * stays the sole key.
   *
   * AND WHY IT CARRIES THE SOURCE: the resolve half REBUILDS the block rather than
   * appending to it, so the attribution has to arrive somewhere the answer is
   * allowed to be built out of -- and it is NOT derivable from the path, since one
   * file is reachable from the document's directory, the cwd, a workspace folder
   * and an absolute fragment at once.
   *
   * WHOLE-VALUE ON `data`, never a containment: a test asserting only that the
   * source appeared would stay green through the day the path stopped.
   */
  test("each item's mark names the source that produced it, for every source there is", async () => {
    const documentTree = tree(["notes/deep.txt"]);
    const cwdTree = tree(["notes/wide.txt"]);
    const workspaceTree = tree(["notes/far.txt"]);
    try {
      const uri = pathToFileURL(join(documentTree.root, "doc.txt")).href;
      const relative = only("notes/");
      const absolute = only("/us");
      const folders = [{ uri: pathToFileURL(workspaceTree.root).href, name: "ws" }];
      const sources = [
        ...sourcesFor(relative, uri, cwdTree.root, folders),
        ...sourcesFor(absolute, uri, cwdTree.root, folders),
      ];
      // Asserted as a VALUE, so a source that stopped being offered reddens here
      // instead of quietly leaving this claim covering three names while its own
      // name says every one.
      expect(sources.map((source) => source.name)).toEqual([
        "document",
        "cwd",
        "workspace",
        "absolute",
      ]);

      for (const source of sources) {
        const fragment = source.name === "absolute" ? absolute : relative;
        const items = await fromSource(source, fragment);
        // Not vacuous: a source that produced nothing satisfies the loop below
        // without a single mark being read.
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          expect(item.data).toEqual({
            // As THIS TEST computes it from the root and the inserted text, never
            // as the module reported it.
            pathCompletion: resolvesTo(source.root, item.insertText ?? ""),
            source: source.name,
          });
        }
      }
    } finally {
      documentTree.dispose();
      cwdTree.dispose();
      workspaceTree.dispose();
    }
  });
});

describe("items with identical inserted text collapse to one", () => {
  // THE FIXTURE IS THE COLLISION: the document's parent IS cwd, so two sources
  // list the same directory and produce the same string.
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
  // cannot supply: there both rules collapse, because one directory reached twice
  // has one path. Here cwd is a SYMLINK to the document's parent, so the inserted
  // text is one string while the roots are two.
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
  // symlink case above catches a resolved-path dedup that joins without realpath
  // and CANNOT catch one that calls realpath. Only a case where one file has two
  // DIFFERENT inserted texts separates them, and both texts must survive: they
  // are two different edits, and the user picked the one they can read.
  //
  // ONE FILE UNDER TWO NAMES RATHER THAN `foo.ts` AND `b/foo.ts`, WHICH CANNOT
  // OCCUR: completion is per segment, so the typed fragment supplies ONE
  // directory part to every source, and no single request asks one root for
  // `foo.ts` while asking another for `b/foo.ts`.
  test("one file under two names in nested roots keeps BOTH items", async () => {
    const fixture = tree(["b/foo.ts"], [["foo-link.ts", "b/foo.ts"]]);
    try {
      // The document's parent is `b`; cwd is the tree above it, which is what
      // lets both roots see one file at all.
      const uri = pathToFileURL(join(fixture.root, "b", "doc.txt")).href;
      const items = await complete({ uri, line: "foo" }, fixture.root);

      expect(realpathSync(join(fixture.root, "b", "foo.ts"))).toBe(
        realpathSync(join(fixture.root, "foo-link.ts")),
      );
      expect(inserted(items)).toEqual(["foo-link.ts", "foo.ts"]);
    } finally {
      fixture.dispose();
    }
  });

  // THE PERMANENT PAIR for the collapse above: without it, `exactly one item` is
  // equally satisfied by a module that drops everything but the first.
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
  // THE TWO DEGENERATE URIS FAIL IN OPPOSITE DIRECTIONS: `file://` resolves to
  // `/` silently and `untitled:` throws, so one needs a value check and the other
  // a catch, and neither implies the other.
  //
  // THE FRAGMENT IS CHOSEN SO THAT `/` REALLY HAS MATCHES FOR IT: with one `/`
  // cannot match, `no document-relative items` would be satisfied by a module
  // with no guard at all.
  test("file:// and untitled: yield no document-relative items, and still answer", async () => {
    const fixture = tree(["usable.txt"]);
    try {
      for (const uri of ["file://", "untitled:Untitled-1"]) {
        const items = await complete({ uri, line: "us" }, fixture.root);

        // ANSWERED, not merely quiet: cwd's own match is the evidence that the
        // request survived, and `/usr` is what would arrive if the document
        // source had fallen back to the filesystem root.
        expect(inserted(items)).toEqual(["usable.txt"]);
        expect(documentationOf(items[0])).toContain("source: cwd");
      }
    } finally {
      fixture.dispose();
    }
  });

  // THE PERMANENT PAIR, and the reason the guard is `an unnamed document has no
  // parent` rather than `reject / as a root`: one spelled the second way passes
  // the test above and deletes this.
  test("a document that really sits at the filesystem root keeps / as its root", () => {
    expect(sourcesFor(only("us"), "file:///a.txt", "/somewhere")).toEqual([
      { name: "document", root: "/" },
      { name: "cwd", root: "/somewhere" },
    ]);
  });
});

describe("a filename containing a space is completed whole", () => {
  // THE FIXTURE HOLDS NOTHING MATCHING THE NARROWER CANDIDATE `(1).p`: with one,
  // this would pass at the wrong candidate and never exercise the widening at
  // all.
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

      // AND THE TWO ENDS DIFFER:
      // the cursor sits mid-word, so `insert` stops at it and leaves the `ng`
      // standing while `replace` takes the whole word. WHICH ONE APPLIES IS THE
      // USER'S SETTING TO MAKE, and carrying a single range would decide it.
      expect(both?.insert.end.character).toBe(cursor);
      expect(both?.replace.end.character).toBe(line.length);
      expect(applyAsClient(line, cursor, item, "replace")).toBe("see foo (1).png");
      expect(applyAsClient(line, cursor, item, "insert")).toBe("see foo (1).pngng");
      // The same item on the line as far as the user has TYPED it, where the two
      // coincide because there is nothing to the right of the cursor.
      expect(applyAsClient("see foo (1).p", cursor, item, "insert")).toBe("see foo (1).png");
    } finally {
      fixture.dispose();
    }
  });

  // WITHOUT THIS, a line whose words BOTH match produces items replacing
  // different spans of it in one response, and which one the user picks decides
  // how much of their line disappears.
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
  // THE HARM: a fragment's end stops at the first space, so a `replace` range
  // ending there deletes `spaced` alone and inserts the whole filename over it --
  // leaving ` (1).txt` standing and writing a line NEITHER mode would produce.
  //
  // IT TAKES A REAL EDITOR TO SEE, so no red in this suite catches a regression
  // in it: an extended replace end is honoured at confirm by nvim + ddc +
  // ddc-source-lsp, and a fragment-length end reproduces the mangled line there.
  // Everything below rests on that, and it is not reproducible here.
  test("completing over the filename replaces the whole of it", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (1).txt");

      expect(applyAsClient(line, cursor, item, "replace")).toBe("spaced (1).txt");
      expect(endsOf(item)?.replace).toBe(line.length);
    } finally {
      fixture.dispose();
    }
  });

  // WHAT MAKES THE EXTENSION SAFE IS THAT IT NEVER FIRES ON A LINE THAT DOES NOT
  // ALREADY READ THE CANDIDATE, and the three tests below are the three ways
  // `already reads it` can be relaxed. Each is a DIFFERENT wrong line, so each
  // owns its own test rather than sharing one.
  //
  // BORN GREEN: all three pass against the UNCHANGED module, because the
  // whitespace end is the only end there is. They are here to stay green ACROSS
  // the change.
  test("a line carrying a DIFFERENT candidate keeps today's end", async () => {
    const fixture = tree(["spaced (2).txt"]);
    try {
      // The line reads `(1)` and the only candidate is `(2)`: same length, same
      // prefix, different file.
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (2).txt");

      expect(endsOf(item)?.replace).toBe("spaced".length);
      // DECLINED, NOT FIXED: the tail is still left behind here, and that is the
      // point. A prefix match would extend to the common prefix and write
      // `spaced (2).txt1).txt` instead -- worse than the defect.
      expect(applyAsClient(line, cursor, item, "replace")).toBe("spaced (2).txt (1).txt");
    } finally {
      fixture.dispose();
    }
  });

  // A SECOND HAZARD, and it needs its OWN line: on the line above, matching
  // anywhere and matching at the fragment's start give the same answer, so that
  // test cannot be the first thing a loosened START breaks.
  test("a candidate the line carries ELSEWHERE keeps today's end", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      // A NEW `sp` typed in front of a filename that is already there: the
      // candidate does occur on this line, just not where they are typing.
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

  // A THIRD HAZARD, and the only one that makes the rule SHRINK a range: nothing
  // above can catch it, because there the comparison fails and today's end is
  // reached by the other branch.
  test("a candidate SHORTER than the word under the cursor keeps today's end", async () => {
    const fixture = tree(["foo", "foo.txt"]);
    try {
      const line = "foo.txt";
      const cursor = "fo".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "foo");

      // The whole word -- NOT 3, where `foo` stops. An end taken from the
      // candidate's length alone would pull the range BACK and leave `.txt`
      // standing behind the completion.
      expect(endsOf(item)?.replace).toBe(line.length);
      expect(applyAsClient(line, cursor, item, "replace")).toBe("foo");
    } finally {
      fixture.dispose();
    }
  });

  // EXTENDING IT PAST THE CURSOR would stop it being an insert at all and make
  // the two arms one, which is what carrying an InsertReplaceEdit exists to
  // prevent.
  test("the insert arm still ends at the cursor", async () => {
    const fixture = tree(["spaced (1).txt"]);
    try {
      const line = "spaced (1).txt";
      const cursor = "spa".length;
      const items = await complete({ ...elsewhere, line }, fixture.root, cursor);
      const item = itemInserting(items, "spaced (1).txt");

      expect(endsOf(item)?.insert).toBe(cursor);
      expect(applyAsClient(line, cursor, item, "insert")).toBe("spaced (1).txtced (1).txt");
    } finally {
      fixture.dispose();
    }
  });

  // BOTH ARMS IN ONE MEASUREMENT: `an InsertReplaceEdit is produced when the
  // client supports it` passes unchanged against a module that produces one
  // unconditionally, so the claim is only ever about the DIFFERENCE and one
  // request cannot carry it.
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

      // AND THE PLAIN EDIT IS THE INSERT RANGE RATHER THAN THE REPLACE ONE, which
      // is the half a shape check alone would miss: both are `TextEdit`s and only
      // the end tells them apart.
      expect(
        plainEdit !== undefined && "range" in plainEdit ? plainEdit.range.end : undefined,
      ).toEqual({ line: 0, character: cursor });

      // WHAT EACH CLIENT ACTUALLY GETS IN ITS BUFFER: the supporting client that
      // chose `replace` gets the clean line, and the client that could not choose
      // gets the tail left standing -- visible, and deleted by typing.
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
    const range = edit[prefers];
    return line.slice(0, range.start.character) + edit.newText + line.slice(range.end.character);
  }
  let start = character;
  while (start > 0 && /[\p{L}\p{N}_-]/u.test(line[start - 1] ?? "")) {
    start -= 1;
  }
  return line.slice(0, start) + (item.insertText ?? item.label) + line.slice(character);
}

describe("an item shows the entry and inserts the path", () => {
  /**
   * WHAT THE USER READS AND WHAT THE BUFFER GETS ARE DIFFERENT STRINGS, and the
   * popup is where the difference is paid: with the fragment's directory in the
   * label, every row of a listing repeats the part already on the line, and the
   * bytes that tell two candidates apart begin after it.
   *
   * A MULTI-SEGMENT FRAGMENT IS THE ONLY THING THAT SAYS SO. Where the fragment
   * names no directory, the entry name and the inserted text are the SAME string
   * -- so the arm below is a control and not a repetition: it must stay green
   * under the weakening that reddens this one.
   */
  test("the label is the entry's own name, where what is inserted carries the directory typed", async () => {
    const fixture = tree(["notes/deep.txt"]);
    try {
      const items = await complete({ ...elsewhere, line: "notes/de" }, fixture.root);

      expect(items.map((item) => item.label)).toEqual(["deep.txt"]);
      // THE THREE FIELDS IN ONE ARM, because a client reads whichever its own
      // class names and a drift between any two of them breaks one class
      // silently. `filterText` is the one the label stopped being: a client
      // filters against the text its edit RANGE covers, which begins where the
      // fragment begins and so carries `notes/`.
      expect(items.map((item) => item.insertText)).toEqual(["notes/deep.txt"]);
      expect(items.map((item) => item.filterText)).toEqual(["notes/deep.txt"]);
      const edit = items[0]?.textEdit;
      expect(edit !== undefined && !("range" in edit) ? edit.newText : undefined).toBe(
        "notes/deep.txt",
      );
    } finally {
      fixture.dispose();
    }
  });

  test("a fragment naming no directory shows what it inserts", async () => {
    const fixture = tree(["deep.txt"]);
    try {
      const items = await complete({ ...elsewhere, line: "de" }, fixture.root);

      expect(items.map((item) => item.label)).toEqual(["deep.txt"]);
      expect(inserted(items)).toEqual(["deep.txt"]);
    } finally {
      fixture.dispose();
    }
  });
});

describe("applying the item yields the path it names", () => {
  // MULTI-SEGMENT, AND IT MUST BE: for a fragment with one segment the two client
  // classes cannot be told apart, so a test written with one proves nothing.
  test("a multi-segment fragment is replaced whole", async () => {
    const fixture = tree(["src/foo.ts"]);
    try {
      const line = "see src/fo";
      const items = await complete({ ...elsewhere, line }, fixture.root);

      expect(items).toHaveLength(1);
      const item = items[0] as CompletionItem;
      // BOTH preferences: at the end of a line the two ranges coincide, and what
      // this claims is that each of them is WHOLE.
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

  // THE PAIRED SINGLE-SEGMENT CASE, permanent: both perturbations that redden the
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

  // WHY THE RANGE IS CONSTRAINED RATHER THAN MERELY PRESENT: against the target
  // client, an item whose range spans more than one line, or starts on a line
  // other than the cursor's, or whose label is empty, is DISCARDED with no error
  // and no fallback. The item does not arrive wrong -- it vanishes.
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
