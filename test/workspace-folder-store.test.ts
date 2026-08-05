import { expect, test } from "bun:test";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import { createWorkspaceFolders } from "../packages/tsudoi-language-server/src/workspace.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * The store as a config author meets it, built from what a client sent at
 * `initialize`.
 *
 * THROUGH THE HANDLE AND NOT AROUND IT: the mirror's rules -- what an omitted
 * list means, that nothing is dropped, that a duplicate is held twice -- live in
 * `initialize`, and a store built from a bare array here would answer about a
 * list this module assembled for itself. It is also `initialize` that builds the
 * lookup's index, so a row reaching past it would not exercise the build at all.
 */
function storeOf(folders: readonly WorkspaceFolder[]) {
  const handle = createWorkspaceFolders();
  handle.initialize({ workspaceFolders: [...folders], rootUri: null, rootPath: null });
  return handle;
}

const project: WorkspaceFolder = { uri: "file:///home/me/project", name: "project" };
const notes: WorkspaceFolder = { uri: "file:///home/me/notes", name: "notes" };

/** A folder written where the row needs one, named so the answer identifies it. */
function folder(uri: string, name: string): WorkspaceFolder {
  return { uri, name };
}

/**
 * One lookup: the mirror a client left, the uri asked about, and the NAMES of
 * every folder that must answer -- `[]` for `no folder covers this`.
 *
 * NAMES AND NOT URIS ARE THE EXPECTATION, and it is what several rows below turn
 * on: two entries may carry the SAME uri, and two spellings of one directory
 * name one location, so an assertion made on the uri would be satisfied by the
 * wrong entry in exactly the cases written to tell them apart.
 *
 * A LIST AND NOT A SET, ORDERED: where a row expects more than one folder, the
 * order is the client's own, and a row asserting membership alone would not say
 * that.
 */
interface Lookup {
  readonly name: string;
  readonly folders: readonly WorkspaceFolder[];
  readonly uri: string;
  readonly expected: readonly string[];
}

const lookups: readonly Lookup[] = [
  {
    name: "a folder's own uri answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project",
    expected: ["project"],
  },
  {
    // MORE THAN ONE LEVEL UP, so a lookup reaching only the directory a document
    // sits in fails this row.
    name: "a document deep under a folder answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project/src/deep/a.ts",
    expected: ["project"],
  },
  {
    name: "a folder that is a string prefix of the document's folder does not answer for it",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // THE PAIR, without which the row above is passed by an implementation that
    // simply prefers the LAST match.
    name: "the shorter folder of a prefix pair still answers for its own documents",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/proj/a.ts",
    expected: ["proj"],
  },
  {
    name: "a document in a nested folder answers with the innermost one alone",
    folders: [folder("file:///w", "outer"), folder("file:///w/inner", "inner")],
    uri: "file:///w/inner/a.ts",
    expected: ["inner"],
  },
  {
    // MIRROR ORDER IS THE PRESENTATION ORDER AMONG FOLDERS AT ONE LEVEL and
    // decides nothing between levels, which is why this is the row above with
    // the two entries swapped and the same answer.
    name: "nesting is resolved by depth and not by mirror order",
    folders: [folder("file:///w/inner", "inner"), folder("file:///w", "outer")],
    uri: "file:///w/inner/a.ts",
    expected: ["inner"],
  },
  {
    name: "the filesystem root answers as a folder, being a location above the document",
    folders: [folder("file:///", "root")],
    uri: "file:///home/me/a.ts",
    expected: ["root"],
  },
  {
    // WHAT THIS ROW DOES NOT DISCRIMINATE: put only ONE side in the
    // trailing-slash form and it still passes. The row below and the
    // cross-spelling rows further down are the ones that tell the two apart.
    name: "a folder held with a trailing slash answers for the documents under it",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["slashed"],
  },
  {
    // THE ANCESTORS ARE NO HELP HERE -- the directory above `…/plain` is
    // `…/me/` -- so this row is carried entirely by the uri ASKED ABOUT being
    // put in the trailing-slash form too, at the level where it is its own
    // location.
    name: "a folder held with a trailing slash answers for its own bare uri",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain",
    expected: ["slashed"],
  },
  {
    name: "a trailing slash on the uri asked about does not hide the folder",
    folders: [project],
    uri: "file:///home/me/project/",
    expected: ["project"],
  },
  {
    // nvim ACCEPTS THESE AS TWO FOLDERS. They name ONE location, so both answer:
    // choosing between them would be tsudoi deciding on its own authority which
    // of two things the client said it did not mean.
    name: "with both spellings of one directory held, both answer, in mirror order",
    folders: [folder("file:///home/me/plain", "bare"), folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["bare", "slashed"],
  },
  {
    // THE SAME PAIR IN THE OTHER ORDER, which is what the row above cannot say:
    // an index that appended in any order of its own -- by spelling, by
    // insertion into a keyed bucket it sorted -- satisfies that one too.
    name: "the client's order is the order both spellings are presented in",
    folders: [folder("file:///home/me/plain/", "slashed"), folder("file:///home/me/plain", "bare")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["slashed", "bare"],
  },
  {
    // THE ONE SHAPE WHERE THE TWO SPELLINGS CAN BE TOLD APART WITHOUT AN
    // ANCESTOR: it is answered at the level where the uri is its own location.
    // Compare the uri raw there and only the entry spelled the same way answers
    // -- one folder out of two, chosen by a spelling rather than by the client.
    name: "both spellings answer for the bare folder uri, not the one spelled the same way",
    folders: [folder("file:///home/me/plain", "bare"), folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain",
    expected: ["bare", "slashed"],
  },
  {
    name: "a uri held twice answers with both entries, in the order the client sent them",
    folders: [
      folder("file:///home/me/project", "first"),
      folder("file:///home/me/project", "second"),
    ],
    uri: "file:///home/me/project/a.ts",
    expected: ["first", "second"],
  },
  {
    // MULTIPLICITY COMES FROM SPELLINGS AND NEVER FROM NESTING: the two entries
    // here look nothing alike as strings and name ONE location, so both answer
    // at ONE level -- which is what separates this from the nesting rows above.
    name: "two unlike spellings of one location both answer, in mirror order",
    folders: [folder("file://LOCALHOST/a", "localhost"), folder("file:///a", "empty authority")],
    uri: "file:///a/x.ts",
    expected: ["localhost", "empty authority"],
  },
  {
    name: "a document under no folder answers with nothing",
    folders: [project, notes],
    uri: "file:///elsewhere/a.ts",
    expected: [],
  },
  {
    name: "a client that named no folders answers with nothing",
    folders: [],
    uri: "file:///home/me/project/a.ts",
    expected: [],
  },
  {
    // THE UNSAVED BUFFER, which every editor sends: A CONFIG AUTHOR MUST NOT
    // HAVE TO DEFEND THE CALL.
    name: "a non-hierarchical uri answers with nothing rather than throwing",
    folders: [project],
    uri: "untitled:Untitled-1",
    expected: [],
  },
  {
    name: "a non-hierarchical uri held as a folder answers with itself",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-1",
    expected: ["unsaved"],
  },
  {
    name: "one unsaved buffer does not answer for another",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-2",
    expected: [],
  },
  {
    // AN OPAQUE PATH IS A STRING AND NOT A LIST OF SEGMENTS, so a `/` at its end
    // is a byte of the name rather than directory syntax. Normalising by
    // appending to the bytes files both under one key, which attributes a
    // document to a folder the client never put it in -- worse than not finding
    // the folder, since the wrong answer is acted on.
    name: "an unsaved buffer whose name ends in a slash is a different buffer",
    folders: [folder("untitled:Untitled-1/", "slashed buffer")],
    uri: "untitled:Untitled-1",
    expected: [],
  },
  {
    // THE SAME PAIR THE OTHER WAY, so neither side may be the one rewritten.
    name: "an unsaved buffer does not answer for one whose name ends in a slash",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-1/",
    expected: [],
  },
  {
    // AND THE POSITIVE CONTROL FOR BOTH: the slashed buffer is still KEYED, so
    // the two rows above say `two locations` rather than `no location`, which
    // an implementation dropping every opaque uri from the index satisfies.
    name: "an unsaved buffer whose name ends in a slash answers for itself",
    folders: [folder("untitled:Untitled-1/", "slashed buffer")],
    uri: "untitled:Untitled-1/",
    expected: ["slashed buffer"],
  },
  {
    // A SLASH INSIDE A QUERY IS QUERY BYTES, which is how the same false
    // positive reaches a HIERARCHICAL uri: appending to the bytes lands the
    // slash in the query and makes one key of two uris.
    name: "a folder whose query ends in a slash does not answer for the same path without it",
    folders: [folder("file:///a?x/", "query slash")],
    uri: "file:///a?x",
    expected: [],
  },
  {
    // ITS POSITIVE CONTROL, and it is what says the row above is about the
    // QUERY rather than about a query-bearing folder being unreachable at all.
    name: "a folder carrying a query answers for its own uri",
    folders: [folder("file:///a?x", "query")],
    uri: "file:///a?x",
    expected: ["query"],
  },
  {
    // AND THE FRAGMENT, which is the third place the appended byte can land.
    name: "a folder whose fragment ends in a slash does not answer for the same path without it",
    folders: [folder("file:///a#f/", "fragment slash")],
    uri: "file:///a#f",
    expected: [],
  },
  {
    name: "the empty string answers with nothing",
    folders: [project],
    uri: "",
    expected: [],
  },
  {
    name: "a malformed uri answers with nothing",
    folders: [project],
    uri: "not a uri",
    expected: [],
  },
  {
    // THIS TABLE ONLY SEES `get`, so what it does NOT say is that `values()`
    // still hands the unparseable entry over; that is asserted below.
    name: "a folder whose uri no parser accepts does not cost the other folders their answers",
    folders: [folder("not a uri", "junk"), project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // BOTH SPELLINGS, BECAUSE THEY FAIL DIFFERENTLY: reading a property off `5`
    // yields `undefined`, and reading one off `null` throws. The build runs
    // inside `initialize`, whose handler answers the whole handshake -32603 on a
    // throw and leaves the author an editor with no server and an LSP log with
    // no reason.
    name: "an entry that is not a folder at all does not cost the other folders their answers",
    folders: [5 as unknown as WorkspaceFolder, null as unknown as WorkspaceFolder, project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // THE SLASH INSIDE THE QUERY IS THE WHOLE FIXTURE: a lookup cutting the
    // bytes at the last slash would take the query for a directory.
    name: "a query containing a slash does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts?path=/etc/hosts",
    expected: ["project"],
  },
  {
    name: "a fragment does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts#L10",
    expected: ["project"],
  },
  {
    name: "a uri with a non-empty authority reaches that authority's root",
    folders: [folder("file://host/", "host root")],
    uri: "file://host/a/b.ts",
    expected: ["host root"],
  },
  {
    name: "the range does not extend past the authority the document is in",
    folders: [folder("file:///", "local root")],
    uri: "file://host/a/b.ts",
    expected: [],
  },
  {
    // A NON-SPECIAL SCHEME IS THE WHOLE FIXTURE, and it is the row `file:///`
    // above cannot make: `vscode-remote:/` is its own canonical spelling, where
    // `file:/` is rewritten to `file:///`, so it IS a string prefix of
    // `vscode-remote://ssh-remote/a/` while naming a different place entirely.
    name: "an authority-less root of a non-special scheme is not a folder of that scheme's hosts",
    folders: [folder("vscode-remote:/", "pathless")],
    uri: "vscode-remote://ssh-remote%2Bexample/home/me/a.ts",
    expected: [],
  },
  {
    // ITS POSITIVE CONTROL, so the row above says `not this authority` rather
    // than `this spelling is unreachable`.
    name: "an authority-less root of a non-special scheme answers for the documents under it",
    folders: [folder("vscode-remote:/", "pathless")],
    uri: "vscode-remote:/home/me/a.ts",
    expected: ["pathless"],
  },
  {
    name: "the single-slash spelling of the root answers for a document under it",
    folders: [folder("file:/", "root")],
    uri: "file:///a.ts",
    expected: ["root"],
  },
  {
    name: "the authority-empty spelling of the root finds the root folder",
    folders: [folder("file:///", "root")],
    uri: "file://",
    expected: ["root"],
  },
  {
    // NO SIDE OF THIS COMPARISON KEEPS A CLIENT'S BYTES, and therefore no
    // spelling has to be matched exactly: `file:/home` is the legal RFC 3986
    // spelling of `file:///home`.
    name: "a single-slash file uri and its three-slash spelling are one location",
    folders: [folder("file:/home", "home")],
    uri: "file:///home/a.ts",
    expected: ["home"],
  },
  {
    // THE TWO RUNTIMES DO NOT PARSE THIS ALIKE -- bun reads `file://///////` as
    // its own directory, deno collapses it to `file:///` -- AND NOTHING HERE
    // READS THE DIFFERENCE. The answer is the same either way, so all this pins
    // is that a uri no client constructs still produces a RANGE.
    name: "a uri that is nothing but slashes is answered rather than thrown on",
    folders: [project],
    uri: "file://///////",
    expected: [],
  },
];

/**
 * THE CROSS-SPELLING ROWS, KEPT TOGETHER BECAUSE THEY MAKE ONE CLAIM: a folder
 * and a document that name ONE location meet, however differently the client
 * spelled them. Each is a mismatch a real client produces, and each is a row that
 * an implementation normalising the DOCUMENT's side alone -- and comparing the
 * result against the folder's bytes -- fails, since the bytes on the left of each
 * pair are exactly what the parse rewrites.
 */
const spellings: readonly Lookup[] = [
  {
    // `localhost` IS THE EMPTY AUTHORITY for `file:`, per the URL Standard, and
    // clients differ on which they send.
    name: "a folder at file://LOCALHOST answers for a document spelled with the empty authority",
    folders: [folder("file://LOCALHOST/a/b", "localhost")],
    uri: "file:///a/b/c.ts",
    expected: ["localhost"],
  },
  {
    name: "an upper-case scheme answers for a document under it",
    folders: [folder("FILE:///Home/proj", "upper")],
    uri: "file:///Home/proj/a.ts",
    expected: ["upper"],
  },
  {
    name: "a folder uri carrying dot segments answers for the documents under where it resolves",
    folders: [folder("file:///a/../a/b", "dots")],
    uri: "file:///a/b/c.ts",
    expected: ["dots"],
  },
  {
    name: "a percent-encoded folder uri answers for a document spelled with the literal character",
    folders: [folder("file:///p%20q", "encoded")],
    uri: "file:///p q/a.ts",
    expected: ["encoded"],
  },
  {
    // STATED BECAUSE THE ROWS ABOVE COULD BE READ AS `SPELLING NEVER MATTERS`:
    // the parse lowercases the scheme and the host and leaves the path alone.
    name: "two folder uris differing in the case of their path are two locations",
    folders: [folder("file:///Home/proj", "upper H")],
    uri: "file:///home/proj/a.ts",
    expected: [],
  },
];

for (const lookup of [...lookups, ...spellings]) {
  test(`get: ${lookup.name}`, () => {
    const handle = storeOf(lookup.folders);

    expect(handle.folders.get(lookup.uri).map((held) => held.name)).toEqual([...lookup.expected]);
  });
}

/**
 * How many uris `read` PARSES, counted by standing a subclass in front of the
 * global constructor for the length of the call.
 *
 * COUNTED WORK AND NOT ELAPSED TIME, which is the only form this claim can take
 * without being flaky: a millisecond bound on shared CI measures the machine,
 * and a bound loose enough never to trip on a busy runner is loose enough to
 * pass over the quadratic it exists to catch.
 *
 * COUNTED AFTER `super`, so a uri the parse REJECTS is not counted -- the count
 * is parses that produced a url, which is the work the lookup can be held to.
 *
 * RESTORED IN A `finally`, because a thrown expectation that left the counting
 * subclass installed would make every later test in this file measure something
 * else while reporting nothing about it.
 */
function parsesDuring(read: () => unknown): number {
  const parser = globalThis.URL;
  let parses = 0;
  class Counting extends parser {
    constructor(url: string | URL, base?: string | URL) {
      super(url, base);
      parses += 1;
    }
  }
  globalThis.URL = Counting;
  try {
    read();
  } finally {
    globalThis.URL = parser;
  }
  return parses;
}

/**
 * URI LENGTH AND URI DEPTH ARE THE CLIENT'S TO CHOOSE, and a lookup that
 * reparsed a shrinking uri once per path segment does that work SYNCHRONOUSLY,
 * so a cancellation and every unrelated request wait behind one document's name.
 *
 * THREE PARSES, SPELLED AS A NUMBER RATHER THAN AS `the shallow one equals the
 * deep one`: the two counts are equal at ZERO as well, which is what a `URL`
 * that could not be stood in front of would report, and the equality would then
 * be green for a reason unrelated to this claim.
 *
 * A MISS AND NOT A HIT, because a hit at the uri's own location returns before
 * the ancestors are derived at all and would report a number that says nothing
 * about the half this claim is about.
 */
test("a lookup parses a fixed number of uris however deep the one asked about is", () => {
  const handle = storeOf([project]);
  const deep = `file:///${Array.from({ length: 20_000 }, () => "a").join("/")}/x.ts`;

  expect(handle.folders.get(deep)).toEqual([]);
  expect(parsesDuring(() => handle.folders.get("file:///elsewhere/a.ts"))).toBe(3);
  expect(parsesDuring(() => handle.folders.get(deep))).toBe(3);
});

/**
 * THE ENTRY ITSELF AND NOT A FOLDER BUILT TO DESCRIBE IT. The table above
 * asserts on `name`, which a synthesised `{ uri, name }` would satisfy; this says
 * the objects handed over are the ones the client sent, so `name` is the client's
 * label rather than something tsudoi wrote.
 */
test("get hands back the client's own entries", () => {
  const handle = storeOf([project]);

  expect(handle.folders.get("file:///home/me/project/a.ts")[0]).toBe(project);
});

/** So `for (const folder of store.get(uri))` needs no guard in front of it. */
test("get answers a uri no folder covers with an empty list rather than undefined", () => {
  const handle = storeOf([project]);

  expect(handle.folders.get("file:///elsewhere/a.ts")).toEqual([]);
  expect([...handle.folders.get("file:///elsewhere/a.ts")]).toEqual([]);
});

/**
 * THE LOOKUP'S INDEX IS BUILT WHERE THE MIRROR IS WRITTEN, and this is the row
 * that says the two are written together.
 */
test("get answers from the mirror as of the call", () => {
  const handle = storeOf([]);

  expect(handle.folders.get("file:///home/me/project/a.ts")).toEqual([]);
  handle.change({ added: [project], removed: [] });

  expect(handle.folders.get("file:///home/me/project/a.ts")).toEqual([project]);
});

/**
 * THE DIRECTION AN INDEX BUILT ONCE AND NEVER REBUILT GOES ON ANSWERING IN, and
 * the row above stays green under it.
 */
test("a folder the client removed stops answering", () => {
  const handle = storeOf([project]);

  handle.change({ added: [], removed: [project] });

  expect(handle.folders.get("file:///home/me/project/a.ts")).toEqual([]);
});

test("values() hands back what the client sent, in mirror order", () => {
  const handle = storeOf([project, notes]);

  expect([...handle.folders.values()]).toEqual([project, notes]);
});

/**
 * THE SKIP IS A LIMIT ON `get` ALONE: the mirror reports what the client sent,
 * and dropping an entry from it would be tsudoi deciding the client did not send
 * it.
 */
test("values() still hands over a folder the lookup cannot reach", () => {
  const junk = folder("not a uri", "junk");
  const handle = storeOf([junk, project]);

  expect([...handle.folders.values()]).toEqual([junk, project]);
});

test("values() answers from the mirror as of the call, not as of the handshake", () => {
  const handle = storeOf([project]);

  handle.change({ added: [notes], removed: [] });

  expect([...handle.folders.values()]).toEqual([project, notes]);
});

/**
 * WHAT A HANDLER'S ONE DEFENCE IS WORTH: taking `values()` before the first
 * `await` is only a defence if what was taken stays as it was. Make `change()`
 * `push` into the old array rather than build a new one and this reddens while
 * the test above goes on passing.
 */
test("an iterable taken before a change still answers the folders it was taken with", () => {
  const handle = storeOf([project]);
  const taken = handle.folders.values();

  handle.change({ added: [notes], removed: [] });

  expect([...taken]).toEqual([project]);
});

/**
 * AND THE SAME PROMISE FOR `get`, which hands back a list rather than an
 * iterable: the index is REBUILT where the mirror is replaced, never written
 * into.
 */
test("a list taken from get before a change still answers the folders it was taken with", () => {
  const handle = storeOf([project]);
  const taken = handle.folders.get("file:///home/me/project/a.ts");

  handle.change({ added: [folder("file:///home/me/project/", "slashed")], removed: [] });

  expect(taken).toEqual([project]);
});

/**
 * WHY THE ENTRIES AND NOT ONLY THE LISTS ARE SEALED: the index is keyed by the
 * location a folder's uri named WHEN IT WAS BUILT, so a write to `uri` leaves
 * the old key answering for a folder that no longer claims it and the new one
 * answering nothing. Nothing rebuilds, nothing is logged, and neither the client
 * nor the author is told -- for the rest of the session.
 *
 * BOTH LOOKUPS ARE ASSERTED AND NOT ONLY THE THROW. A test that stopped at
 * `toThrow` would go on passing under an implementation that froze the entries
 * and then let some other path rebuild the mirror out of step, which is the
 * state this row is actually about.
 *
 * THE CAST IS THE POINT AND NOT A NUISANCE: the published element is
 * `Readonly<WorkspaceFolder>`, so reaching this write requires leaving the type
 * system -- which is exactly what the JavaScript a config author ships does by
 * default. The type-checked route is refused at compile time by the probe below.
 */
test("a folder the lookup handed back cannot be renamed out from under the index", () => {
  const handle = storeOf([folder("file:///old", "renamed")]);
  const held = handle.folders.get("file:///old/a.ts")[0] as WorkspaceFolder;

  expect(() => {
    held.uri = "file:///new";
  }).toThrow(TypeError);

  expect(handle.folders.get("file:///old/a.ts").map((each) => each.name)).toEqual(["renamed"]);
  expect(handle.folders.get("file:///new/a.ts")).toEqual([]);
});

/**
 * AND THE LISTS THEMSELVES, ALL THREE SURFACES THAT LEAVE. A handler that
 * appended to what it was handed would be writing into the store's own state --
 * `get` returns the index's list and `values()` the mirror, both deliberately,
 * so that a list taken before an `await` answers about the moment it was taken.
 * That decision is exactly what makes an unfrozen list a write to the store.
 *
 * THE MISS PATH IS ONE OF THE THREE, since a lookup that found nothing hands
 * back a list too, and an empty one built fresh per call would be the one
 * surface a handler could append to without anyone noticing.
 */
test("no list the store hands back can be written into", () => {
  const handle = storeOf([project]);

  expect(() =>
    (handle.folders.get("file:///home/me/project/a.ts") as WorkspaceFolder[]).push(notes),
  ).toThrow(TypeError);
  expect(() =>
    (handle.folders.get("file:///elsewhere/a.ts") as WorkspaceFolder[]).push(notes),
  ).toThrow(TypeError);
  expect(() => (handle.folders.values() as WorkspaceFolder[]).push(notes)).toThrow(TypeError);

  expect([...handle.folders.values()]).toEqual([project]);
});

/**
 * A probe project's source, with `body` spliced in under a bound `Tsudoi`.
 *
 * The binding is `null as unknown as` because nothing here RUNS -- the claim is
 * about what tsc accepts, and a probe that had to build a real session would be
 * measuring the construction as well.
 */
function tsudoiProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * NOT ONE CLAIM WITH THE FREEZE ABOVE: `readonly` is erased at run time and the
 * freeze arrives with no warning before it, so a type-checked config was told
 * nothing until the request that threw.
 *
 * TS2540 AND NOT THE EXIT CODE, which a probe that failed to resolve its import
 * would earn just as well; the code names `assigned to a read-only property` and
 * nothing else.
 *
 * SHALLOW `Readonly<>` IS THE WHOLE OF WHAT THIS NEEDS, and it is the
 * declaration that says so rather than a habit: the protocol gives
 * `WorkspaceFolder` two members, `uri` and `name`, both strings. There is no
 * depth for a deep wrapper to reach.
 */
test("a handler renaming a folder the lookup handed back does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      'for (const folder of tsudoi.workspaceFolders.get("file:///a.ts")) {\n  folder.name = "new";\n}',
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("name");
});

/**
 * THE OTHER SURFACE, and it is not the same claim: `get` hands back the index's
 * list and `values()` the mirror, so a type applied to one leaves the other
 * open. The member differs too -- `uri` is what the index is KEYED BY, so this
 * is the write whose run-time cost is a folder answering under a key nobody
 * holds any more.
 */
test("a handler rewriting the uri of a folder from values() does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      'for (const folder of tsudoi.workspaceFolders.values()) {\n  folder.uri = "file:///z";\n}',
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("uri");
});

/**
 * THE PAIRED CONTROL, and it reads the MEMBERS rather than merely calling the
 * operations: a folder type that had become unreadable -- mapped to `{}`, or
 * resolving to nothing -- would refuse both writes above for a reason that has
 * nothing to do with `readonly`, and a control that stopped at iterating would
 * not see it.
 */
test("reading those same members type-checks", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      [
        'export const covering = tsudoi.workspaceFolders.get("file:///a.ts").map((f) => `${f.name} ${f.uri}`);',
        "export const all = [...tsudoi.workspaceFolders.values()].map((f) => `${f.name} ${f.uri}`);",
      ].join("\n"),
    ),
  );

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});
