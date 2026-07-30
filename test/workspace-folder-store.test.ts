import { expect, test } from "bun:test";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import { createWorkspaceFolders } from "../src/workspace.ts";

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
    // THE WALK STARTS AT THE URI ITSELF. An implementation opening with the
    // parent answers a folder's own uri with its PARENT's folder, or with
    // nothing.
    name: "a folder's own uri answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project",
    expected: ["project"],
  },
  {
    // MORE THAN ONE LEVEL UP, so a walk that takes a single step passes nothing
    // here.
    name: "a document deep under a folder answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project/src/deep/a.ts",
    expected: ["project"],
  },
  {
    // THE PREFIX PAIR, AND IT IS THE ROW THAT REFUSES `startsWith`:
    // `file:///home/me/proj` IS a string prefix of `file:///home/me/project/a.ts`
    // and is NOT a folder of it. The walk cannot make that mistake because the
    // level it produces is `…/project/`, and `…/proj/` is not equal to it.
    name: "a folder that is a string prefix of the document's folder does not answer for it",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // THE SAME PAIR THE OTHER WAY, so the row above cannot be passed by an
    // implementation that simply prefers the LAST match: `…/proj` still answers
    // for its own documents.
    name: "the shorter folder of a prefix pair still answers for its own documents",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/proj/a.ts",
    expected: ["proj"],
  },
  {
    // NESTED FOLDERS RESOLVE INNERMOST-FIRST, AND ONLY THE INNERMOST ANSWERS.
    // This is the row that says the answer is ONE LEVEL'S folders and not every
    // ancestor's: an implementation collecting matches all the way up answers
    // `["inner", "outer"]` here.
    name: "a document in a nested folder answers with the innermost one alone",
    folders: [folder("file:///w", "outer"), folder("file:///w/inner", "inner")],
    uri: "file:///w/inner/a.ts",
    expected: ["inner"],
  },
  {
    // THE SAME NESTING IN THE OTHER MIRROR ORDER. Mirror order is the
    // PRESENTATION order among folders AT ONE LEVEL and decides nothing between
    // levels -- an implementation that scanned the mirror first and walked
    // second would answer `outer` here.
    name: "nesting is resolved by the walk and not by mirror order",
    folders: [folder("file:///w/inner", "inner"), folder("file:///w", "outer")],
    uri: "file:///w/inner/a.ts",
    expected: ["inner"],
  },
  {
    // THE WALK REACHES THE ROOT, AND THIS IS THE ROW THAT SAYS SO: a walk that
    // stops one level short answers nothing for every document in a session
    // whose folder is the filesystem root.
    name: "the filesystem root answers as a folder, since the walk reaches it",
    folders: [folder("file:///", "root")],
    uri: "file:///home/me/a.ts",
    expected: ["root"],
  },
  {
    // A FOLDER HELD WITH A TRAILING SLASH AND A DOCUMENT UNDER IT MEET BECAUSE
    // BOTH SIDES ARE PUT IN THE TRAILING-SLASH FORM. Put only one side in it and
    // this still passes, which is why the row below and the cross-spelling rows
    // further down are the ones that discriminate.
    name: "a folder held with a trailing slash answers for the documents under it",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["slashed"],
  },
  {
    // THE URI ASKED ABOUT IS THE FOLDER, SPELLED WITHOUT THE SLASH THE CLIENT
    // SENT. The walk is no help here -- the level above `…/plain` is `…/me/` --
    // so this row is carried entirely by the uri asked about being put in the
    // trailing-slash form too, at the level where it is its own candidate.
    name: "a folder held with a trailing slash answers for its own bare uri",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain",
    expected: ["slashed"],
  },
  {
    // AND THE MIRROR IMAGE: the slash is on the uri asked about and not on the
    // folder.
    name: "a trailing slash on the uri asked about does not hide the folder",
    folders: [project],
    uri: "file:///home/me/project/",
    expected: ["project"],
  },
  {
    // BOTH SPELLINGS OF ONE DIRECTORY HELD AT ONCE, WHICH nvim ACCEPTS AS TWO
    // FOLDERS. They name ONE location, so both answer: choosing between them
    // would be tsudoi deciding on its own authority which of two things the
    // client said it did not mean.
    name: "with both spellings of one directory held, both answer, in mirror order",
    folders: [folder("file:///home/me/plain", "bare"), folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["bare", "slashed"],
  },
  {
    // THE SAME PAIR IN THE OTHER ORDER, AND IT IS THE ROW THAT PINS MIRROR ORDER
    // AS THE PRESENTATION ORDER: an index that appended in any order of its own
    // -- by spelling, by insertion into a keyed bucket it sorted -- answers
    // `["bare", "slashed"]` here too.
    name: "the client's order is the order both spellings are presented in",
    folders: [folder("file:///home/me/plain/", "slashed"), folder("file:///home/me/plain", "bare")],
    uri: "file:///home/me/plain/a.ts",
    expected: ["slashed", "bare"],
  },
  {
    // AND THE SAME PAIR ASKED ABOUT BY THE BARE FOLDER URI ITSELF, which is the
    // one shape where the two spellings can be told apart WITHOUT the walk: it
    // is answered at the level where the uri is its own candidate, and that level
    // must put it in the same form as everything else. Compare the uri raw there
    // and only the entry spelled the same way answers -- one folder out of two,
    // chosen by a spelling rather than by the client, which is exactly the pick
    // this lookup refuses to make.
    name: "both spellings answer for the bare folder uri, not the one spelled the same way",
    folders: [folder("file:///home/me/plain", "bare"), folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain",
    expected: ["bare", "slashed"],
  },
  {
    // THE DUPLICATE THE MIRROR DELIBERATELY KEEPS. Two entries, one uri, and the
    // lookup hands back both rather than picking the one the client is presumed
    // to have meant.
    name: "a uri held twice answers with both entries, in the order the client sent them",
    folders: [
      folder("file:///home/me/project", "first"),
      folder("file:///home/me/project", "second"),
    ],
    uri: "file:///home/me/project/a.ts",
    expected: ["first", "second"],
  },
  {
    // MULTIPLICITY COMES FROM SPELLINGS AND NEVER FROM NESTING, and this row is
    // the pair to the nesting rows above: two folders that look nothing alike as
    // strings name ONE location, so both answer at ONE level.
    name: "two unlike spellings of one location both answer, in mirror order",
    folders: [folder("file://LOCALHOST/a", "localhost"), folder("file:///a", "empty authority")],
    uri: "file:///a/x.ts",
    expected: ["localhost", "empty authority"],
  },
  {
    // NO FOLDER COVERS IT, and the empty list is the answer rather than a guess
    // at the nearest one. This is the row an implementation returning the first
    // folder unconditionally fails.
    name: "a document under no folder answers with nothing",
    folders: [project, notes],
    uri: "file:///elsewhere/a.ts",
    expected: [],
  },
  {
    // AN EMPTY MIRROR, which is what a client that named no workspace leaves.
    name: "a client that named no folders answers with nothing",
    folders: [],
    uri: "file:///home/me/project/a.ts",
    expected: [],
  },
  {
    // THE UNSAVED BUFFER, which every editor sends. `untitled:` names no path to
    // climb, so the uri is its own only candidate. A CONFIG AUTHOR MUST NOT HAVE
    // TO DEFEND THE CALL, so this answers an empty list rather than throwing.
    name: "a non-hierarchical uri answers with nothing rather than throwing",
    folders: [project],
    uri: "untitled:Untitled-1",
    expected: [],
  },
  {
    // AND IF A CLIENT HOLDS ONE AS A FOLDER, it is still found -- the uri is its
    // own first candidate, so the answer does not depend on the scheme naming a
    // hierarchy.
    name: "a non-hierarchical uri held as a folder answers with itself",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-1",
    expected: ["unsaved"],
  },
  {
    // AND TWO UNSAVED BUFFERS ARE TWO LOCATIONS, which is what says the key is
    // INJECTIVE enough to tell them apart: both sides go through one
    // construction, so the only pair that can collide is a pair that already
    // named one thing.
    name: "one unsaved buffer does not answer for another",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-2",
    expected: [],
  },
  {
    // AND THE TWO THE SLASH ITSELF TELLS APART. An OPAQUE path is a string and
    // not a list of segments, so a `/` at its end is a byte of the name rather
    // than directory syntax: `untitled:Untitled-1/` is a SECOND unsaved buffer.
    // Normalising by appending to the bytes files both under one key, which
    // attributes a document to a folder the client never put it in -- worse
    // than not finding the folder, since the wrong answer is acted on.
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
    // A SLASH INSIDE A QUERY IS QUERY BYTES, and the same false positive
    // reaches a hierarchical uri through it: `?x` and `?x/` are two queries, so
    // the folder here and the uri asked about are two uris. Appending to the
    // bytes lands the slash in the query and makes one key of them.
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
    // THE EMPTY STRING. Nothing in the protocol forbids a client sending one,
    // and a `get` that threw would make every call site defend itself.
    name: "the empty string answers with nothing",
    folders: [project],
    uri: "",
    expected: [],
  },
  {
    // AND A STRING THAT IS NOT A URI AT ALL, which every parse of it throws on.
    name: "a malformed uri answers with nothing",
    folders: [project],
    uri: "not a uri",
    expected: [],
  },
  {
    // A FOLDER NO PARSER ACCEPTS IS UNREACHABLE THROUGH THE LOOKUP AND DOES NOT
    // COST THE MIRROR THE REST: it is skipped when the index is built, the
    // folders around it still answer, and `values()` still hands it over --
    // asserted below, since this table only sees `get`.
    name: "a folder whose uri no parser accepts does not cost the other folders their answers",
    folders: [folder("not a uri", "junk"), project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // THE NON-CONFORMING ENTRIES THE MIRROR PASSES THROUGH. `Array.isArray` is
    // all that guards the list, so `5` and `null` both arrive written down as
    // they were sent, and the index is built from that same list -- this row
    // says the build reads `uri` off either without throwing and without taking
    // the neighbouring folder's answer away. BOTH SPELLINGS, because they fail
    // differently: reading a property off `5` yields `undefined`, and reading one
    // off `null` throws. The build runs inside `initialize`, whose handler
    // answers the whole handshake -32603 on a throw and leaves the author an
    // editor with no server and an LSP log with no reason.
    name: "an entry that is not a folder at all does not cost the other folders their answers",
    folders: [5 as unknown as WorkspaceFolder, null as unknown as WorkspaceFolder, project],
    uri: "file:///home/me/project/a.ts",
    expected: ["project"],
  },
  {
    // A QUERY IS NOT PART OF THE LOCATION. The uri's own candidate carries it and
    // matches nothing; every level above is the parse's own directory, which the
    // query never entered. The slash INSIDE the query is what makes this a row
    // rather than a restatement -- a walk cutting the bytes at the last slash
    // would climb into it.
    name: "a query containing a slash does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts?path=/etc/hosts",
    expected: ["project"],
  },
  {
    // THE SAME FOR A FRAGMENT.
    name: "a fragment does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts#L10",
    expected: ["project"],
  },
  {
    // A NON-EMPTY AUTHORITY, and the walk ends at THAT authority's root rather
    // than at some fixed `file:///`.
    name: "a uri with a non-empty authority walks up to that authority's root",
    folders: [folder("file://host/", "host root")],
    uri: "file://host/a/b.ts",
    expected: ["host root"],
  },
  {
    // AND IT DOES NOT CLIMB OUT OF THE AUTHORITY: a folder at another authority's
    // root is not an ancestor of this document, however far the walk goes.
    name: "the walk does not climb out of the authority it started in",
    folders: [folder("file:///", "local root")],
    uri: "file://host/a/b.ts",
    expected: [],
  },
  {
    // `file:/`, `file://` AND `file:///` ARE THREE SPELLINGS OF THE ROOT, and the
    // parse says so on both sides at once. A client holding any of them is found
    // for a document under any other.
    name: "the single-slash spelling of the root answers for a document under it",
    folders: [folder("file:/", "root")],
    uri: "file:///a.ts",
    expected: ["root"],
  },
  {
    // THE AUTHORITY-EMPTY SPELLING ASKED ABOUT, answered by the folder the client
    // spelled in full.
    name: "the authority-empty spelling of the root finds the root folder",
    folders: [folder("file:///", "root")],
    uri: "file://",
    expected: ["root"],
  },
  {
    // AND THE SINGLE-SLASH SPELLING DEEPER IN. `file:/home` is the legal RFC 3986
    // spelling of `file:///home`, so a client holding one answers for a document
    // spelled the other way -- there is no side of this comparison that keeps a
    // client's bytes and therefore no spelling that has to be matched exactly.
    name: "a single-slash file uri and its three-slash spelling are one location",
    folders: [folder("file:/home", "home")],
    uri: "file:///home/a.ts",
    expected: ["home"],
  },
  {
    // TERMINATION, PINNED. Every level here is junk and none matches, so the only
    // thing this row can measure is that the walk ENDS -- a walk that failed to
    // would hang the suite rather than fail it, which is the failure a green run
    // cannot show. The two runtimes disagree on what the intermediate levels of
    // this uri even are, and nothing here reads them: the walk stops when a level
    // is its own parent, which both reach.
    name: "a uri that is nothing but slashes terminates",
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
    // THE SCHEME IS CASE-INSENSITIVE, and a client that upcased it named the same
    // folder.
    name: "an upper-case scheme answers for a document under it",
    folders: [folder("FILE:///Home/proj", "upper")],
    uri: "file:///Home/proj/a.ts",
    expected: ["upper"],
  },
  {
    // DOT SEGMENTS RESOLVE, so a folder reached through `..` is the folder it
    // resolves to.
    name: "a folder uri carrying dot segments answers for the documents under where it resolves",
    folders: [folder("file:///a/../a/b", "dots")],
    uri: "file:///a/b/c.ts",
    expected: ["dots"],
  },
  {
    // PERCENT-ENCODING IS RECONCILED, which is the mismatch clients produce most:
    // a space in a path is `%20` from one and a literal space from another.
    name: "a percent-encoded folder uri answers for a document spelled with the literal character",
    folders: [folder("file:///p%20q", "encoded")],
    uri: "file:///p q/a.ts",
    expected: ["encoded"],
  },
  {
    // AND THE CASE OF THE PATH IS NOT RECONCILED. The parse lowercases the scheme
    // and the host and leaves the path alone, so two folders differing in path
    // case stay two locations -- stated because the rows above could be read as
    // `spelling never matters`.
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
 * THE ENTRY ITSELF AND NOT A FOLDER BUILT TO DESCRIBE IT. The table above
 * asserts on `name`, which a synthesised `{ uri, name }` would satisfy; this says
 * the objects handed over are the ones the client sent, so `name` is the client's
 * label rather than something tsudoi wrote.
 */
test("get hands back the client's own entries", () => {
  const handle = storeOf([project]);

  expect(handle.folders.get("file:///home/me/project/a.ts")[0]).toBe(project);
});

/**
 * AN EMPTY LIST AND NEVER `undefined`, so `for (const folder of store.get(uri))`
 * needs no guard in front of it. `no folder covers this` and `matched nothing`
 * are one state here, and nothing is lost by spelling them the same way.
 */
test("get answers a uri no folder covers with an empty list rather than undefined", () => {
  const handle = storeOf([project]);

  expect(handle.folders.get("file:///elsewhere/a.ts")).toEqual([]);
  expect([...handle.folders.get("file:///elsewhere/a.ts")]).toEqual([]);
});

/**
 * THE LIVE HALF OF `get`, paired with the one `values()` has: the store is one
 * object for the session, so a folder added mid-session answers from the same
 * store a handler is already holding. The lookup's index is built where the
 * mirror is written, and this is the row that says the two are written together.
 */
test("get answers from the mirror as of the call", () => {
  const handle = storeOf([]);

  expect(handle.folders.get("file:///home/me/project/a.ts")).toEqual([]);
  handle.change({ added: [project], removed: [] });

  expect(handle.folders.get("file:///home/me/project/a.ts")).toEqual([project]);
});

/**
 * AND THE SAME FOR A REMOVAL, which is the direction an index that is built once
 * and never rebuilt goes on answering in: a folder the user dropped would keep
 * answering for every document under it for the rest of the session, while the
 * row above stays green.
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
 * WHAT THE LOOKUP CANNOT REACH, THE MIRROR STILL HOLDS. A folder uri no parser
 * accepts is skipped when the index is built -- there is no location to file it
 * under -- and that is a limit on `get` alone: the mirror reports what the client
 * sent, and dropping an entry from it would be tsudoi deciding the client did not
 * send it.
 */
test("values() still hands over a folder the lookup cannot reach", () => {
  const junk = folder("not a uri", "junk");
  const handle = storeOf([junk, project]);

  expect([...handle.folders.values()]).toEqual([junk, project]);
});

/**
 * THE LIVE HALF. `Tsudoi.workspaceFolders` is one object for the session, so a
 * store read before a notification and a store read after it are the same store
 * -- what moves is what `values()` answers.
 */
test("values() answers from the mirror as of the call, not as of the handshake", () => {
  const handle = storeOf([project]);

  handle.change({ added: [notes], removed: [] });

  expect([...handle.folders.values()]).toEqual([project, notes]);
});

/**
 * THE OTHER HALF, AND IT IS WHAT A HANDLER'S ONE DEFENCE IS WORTH: taking
 * `values()` before the first `await` is only a defence if what was taken stays
 * as it was. `change()` builds a new array rather than writing into the live one,
 * so the taken iterable is still the list the request began with. Make `change()`
 * `push` into the old array instead and this reddens while the test above goes on
 * passing.
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
 * into, so a list a handler took before a change still answers about the moment
 * it was taken.
 */
test("a list taken from get before a change still answers the folders it was taken with", () => {
  const handle = storeOf([project]);
  const taken = handle.folders.get("file:///home/me/project/a.ts");

  handle.change({ added: [folder("file:///home/me/project/", "slashed")], removed: [] });

  expect(taken).toEqual([project]);
});
