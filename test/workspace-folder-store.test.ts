import { expect, test } from "bun:test";
import type { WorkspaceFolder } from "vscode-languageserver-protocol";
import { createWorkspaceFolders } from "../src/workspace.ts";

/**
 * The store as a config author meets it, built from what a client sent at
 * `initialize`.
 *
 * THROUGH THE HANDLE AND NOT AROUND IT: the mirror's rules -- what an omitted
 * list means, that nothing is normalised, that a duplicate is held twice -- live
 * in `initialize`, and a store built from a bare array here would answer about a
 * list this module assembled for itself.
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
 * One lookup: the mirror a client left, the uri asked about, and the NAME of the
 * folder that must answer -- `undefined` for `no folder covers this`.
 *
 * THE NAME AND NOT THE URI IS THE EXPECTATION, and it is what several rows below
 * turn on: two entries may carry the SAME uri, and two spellings of one
 * directory are two folders, so an assertion made on the uri would be satisfied
 * by the wrong entry in exactly the cases written to tell them apart.
 */
interface Lookup {
  readonly name: string;
  readonly folders: readonly WorkspaceFolder[];
  readonly uri: string;
  readonly expected: string | undefined;
}

const lookups: readonly Lookup[] = [
  {
    // THE WALK STARTS AT THE URI ITSELF. An implementation opening with `dirname`
    // answers a folder's own uri with its PARENT's folder, or with nothing.
    name: "a folder's own uri answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project",
    expected: "project",
  },
  {
    // MORE THAN ONE LEVEL UP, so a walk that takes a single step passes nothing
    // here.
    name: "a document deep under a folder answers with that folder",
    folders: [project, notes],
    uri: "file:///home/me/project/src/deep/a.ts",
    expected: "project",
  },
  {
    // THE PREFIX PAIR, AND IT IS THE ROW THAT REFUSES `startsWith`:
    // `file:///home/me/proj` IS a string prefix of `file:///home/me/project/a.ts`
    // and is NOT a folder of it. The walk cannot make that mistake because the
    // ancestor it produces is `…/project`, and `…/proj` is not equal to it.
    name: "a folder that is a string prefix of the document's folder does not answer for it",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/project/a.ts",
    expected: "project",
  },
  {
    // THE SAME PAIR THE OTHER WAY, so the row above cannot be passed by an
    // implementation that simply prefers the LAST match: `…/proj` still answers
    // for its own documents.
    name: "the shorter folder of a prefix pair still answers for its own documents",
    folders: [folder("file:///home/me/proj", "proj"), project],
    uri: "file:///home/me/proj/a.ts",
    expected: "proj",
  },
  {
    // NESTED FOLDERS RESOLVE INNERMOST-FIRST, and that falls out of the walk
    // going inward-out rather than from any rule about specificity.
    name: "a document in a nested folder answers with the innermost one",
    folders: [folder("file:///w", "outer"), folder("file:///w/inner", "inner")],
    uri: "file:///w/inner/a.ts",
    expected: "inner",
  },
  {
    // THE SAME NESTING IN THE OTHER MIRROR ORDER. Mirror order decides between
    // folders AT ONE LEVEL and nothing else -- an implementation that scanned
    // the mirror first and walked second would answer `outer` here.
    name: "nesting is resolved by the walk and not by mirror order",
    folders: [folder("file:///w/inner", "inner"), folder("file:///w", "outer")],
    uri: "file:///w/inner/a.ts",
    expected: "inner",
  },
  {
    // THE LAST ANCESTOR IS `<scheme>://<authority>/`, AND THIS IS THE ROW THAT
    // SAYS SO: a walk that stops one level short answers `undefined` for every
    // document in a session whose folder is the filesystem root.
    name: "the filesystem root answers as a folder, since the walk reaches it",
    folders: [folder("file:///", "root")],
    uri: "file:///home/me/a.ts",
    expected: "root",
  },
  {
    // A FOLDER HELD WITH A TRAILING SLASH IS FOUND WITHOUT ONE BEING INVENTED
    // FOR IT: the ancestor is `…/plain`, the held uri is `…/plain/`, and the
    // probe of both forms is what closes the gap. Normalising either side would
    // rewrite what the client sent.
    name: "a folder held with a trailing slash answers for the documents under it",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: "slashed",
  },
  {
    // AND AT THE FIRST LEVEL TOO, where the ancestor IS the uri asked about.
    name: "a folder held with a trailing slash answers for its own bare uri",
    folders: [folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain",
    expected: "slashed",
  },
  {
    // THE URI ASKED ABOUT CARRIES THE SLASH INSTEAD. The match is at the SECOND
    // level here -- the first level probes `…/plain/` and `…/plain//`, neither of
    // which is held -- so a walk that stopped as soon as it had probed the uri
    // itself would answer nothing.
    name: "a trailing slash on the uri asked about does not hide the folder",
    folders: [project],
    uri: "file:///home/me/project/",
    expected: "project",
  },
  {
    // BOTH SPELLINGS HELD AT ONCE, WHICH nvim ACCEPTS AS TWO FOLDERS. They are
    // equally specific, so the tie is decided by the rule the mirror already has
    // -- FIRST IN MIRROR ORDER -- and not by a preference for either spelling.
    name: "with both spellings of one directory held, the first in mirror order answers",
    folders: [folder("file:///home/me/plain", "bare"), folder("file:///home/me/plain/", "slashed")],
    uri: "file:///home/me/plain/a.ts",
    expected: "bare",
  },
  {
    // THE SAME PAIR IN THE OTHER ORDER, AND IT IS THE ROW THAT REFUSES AN INDEX
    // PROBED IN A FIXED ORDER: a lookup asking for the bare form before the
    // slashed one answers `bare` here, which is the entry the client listed
    // SECOND.
    name: "with both spellings held, the slashed one answers when the client listed it first",
    folders: [folder("file:///home/me/plain/", "slashed"), folder("file:///home/me/plain", "bare")],
    uri: "file:///home/me/plain/a.ts",
    expected: "slashed",
  },
  {
    // THE DUPLICATE THE MIRROR DELIBERATELY KEEPS. Two entries, one uri: the
    // first answers, for the same reason it does above.
    name: "a uri held twice answers with the entry the client listed first",
    folders: [
      folder("file:///home/me/project", "first"),
      folder("file:///home/me/project", "second"),
    ],
    uri: "file:///home/me/project/a.ts",
    expected: "first",
  },
  {
    // NO FOLDER COVERS IT, and `undefined` is the answer rather than a guess at
    // the nearest one. This is the row an implementation returning the first
    // folder unconditionally fails.
    name: "a document under no folder answers with nothing",
    folders: [project, notes],
    uri: "file:///elsewhere/a.ts",
    expected: undefined,
  },
  {
    // AN EMPTY MIRROR, which is what a client that named no workspace leaves.
    name: "a client that named no folders answers with nothing",
    folders: [],
    uri: "file:///home/me/project/a.ts",
    expected: undefined,
  },
  {
    // THE UNSAVED BUFFER, which every editor sends: `untitled:` names no
    // authority, so there is nothing to walk and the uri is its own only
    // candidate. A CONFIG AUTHOR MUST NOT HAVE TO DEFEND THE CALL, so this
    // answers `undefined` rather than throwing.
    name: "a non-hierarchical uri answers with nothing rather than throwing",
    folders: [project],
    uri: "untitled:Untitled-1",
    expected: undefined,
  },
  {
    // AND IF A CLIENT HOLDS ONE AS A FOLDER, it is still found -- the walk starts
    // at the uri itself, so the answer does not depend on the scheme being
    // hierarchical.
    name: "a non-hierarchical uri held as a folder answers with itself",
    folders: [folder("untitled:Untitled-1", "unsaved")],
    uri: "untitled:Untitled-1",
    expected: "unsaved",
  },
  {
    // THE EMPTY STRING. Nothing in the protocol forbids a client sending one,
    // and a `get` that threw would make every call site defend itself.
    name: "the empty string answers with nothing",
    folders: [project],
    uri: "",
    expected: undefined,
  },
  {
    // AND A STRING THAT IS NOT A URI AT ALL, which `new URL` would have thrown
    // on.
    name: "a malformed uri answers with nothing",
    folders: [project],
    uri: "not a uri",
    expected: undefined,
  },
  {
    // A QUERY IS PART OF THE BYTES AND IS NOT STRIPPED, and this row proves the
    // walk survives one CONTAINING A SLASH: the first ancestors it produces are
    // cut inside the query and match nothing, and the walk goes on to reach the
    // real folder.
    name: "a query containing a slash does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts?path=/etc/hosts",
    expected: "project",
  },
  {
    // THE SAME FOR A FRAGMENT.
    name: "a fragment does not hide the document's folder",
    folders: [project],
    uri: "file:///home/me/project/a.ts#L10",
    expected: "project",
  },
  {
    // A NON-EMPTY AUTHORITY, so the boundary is derived from where the authority
    // ENDS rather than from a fixed offset that only suits `file:///`.
    name: "a uri with a non-empty authority walks up to that authority's root",
    folders: [folder("file://host/", "host root")],
    uri: "file://host/a/b.ts",
    expected: "host root",
  },
  {
    // THE WALK NEVER REACHES A SCHEME-ONLY ANCESTOR, and this row is what says
    // so: cutting at the last slash without a boundary produces `file://` and
    // then `file:/`, so an unbounded walk answers `single` for a document that
    // has nothing to do with it -- and, before that, spins on a uri that is all
    // slashes.
    name: "a walk stops at the authority and never produces a scheme-only ancestor",
    folders: [folder("file:/", "single")],
    uri: "file:///a.ts",
    expected: undefined,
  },
  {
    // A URI WITH NO `//` AT ALL IS ITS OWN ONLY CANDIDATE, and the cost is
    // stated: a client holding `file:/home` as a folder is not found for
    // `file:/home/a.ts`, because locating a root in a path with no authority
    // marker would mean interpreting the scheme, which is the mirror's own
    // refusal.
    name: "a uri with no authority marker is not walked",
    folders: [folder("file:/home", "single")],
    uri: "file:/home/a.ts",
    expected: undefined,
  },
  {
    // `file://` IS THE AUTHORITY-EMPTY SPELLING OF THE ROOT, and probing both
    // forms answers it with the root folder without a special case for either.
    name: "the authority-empty spelling of the root finds the root folder",
    folders: [folder("file:///", "root")],
    uri: "file://",
    expected: "root",
  },
  {
    // TERMINATION, PINNED. Every ancestor here is junk and none matches, so the
    // only thing this row can measure is that the walk ENDS -- a walk that fails
    // to would hang the suite rather than fail it, which is the failure a green
    // run cannot show.
    name: "a uri that is nothing but slashes terminates",
    folders: [project],
    uri: "file://///////",
    expected: undefined,
  },
];

for (const lookup of lookups) {
  test(`get: ${lookup.name}`, () => {
    const handle = storeOf(lookup.folders);

    expect(handle.folders.get(lookup.uri)?.name).toBe(lookup.expected);
  });
}

/**
 * THE ENTRY ITSELF AND NOT A FOLDER BUILT TO DESCRIBE IT. The table above
 * asserts on `name`, which a synthesised `{ uri, name }` would satisfy; this
 * says the object handed over is the one the client sent, so `name` is the
 * client's label rather than something tsudoi wrote.
 */
test("get hands back the client's own entry", () => {
  const handle = storeOf([project]);

  expect(handle.folders.get("file:///home/me/project/a.ts")).toBe(project);
});

/**
 * THE LIVE HALF OF `get`, paired with the one `values()` has: the store is one
 * object for the session, so a folder added mid-session answers from the same
 * store a handler is already holding.
 */
test("get answers from the mirror as of the call", () => {
  const handle = storeOf([]);

  expect(handle.folders.get("file:///home/me/project/a.ts")).toBeUndefined();
  handle.change({ added: [project], removed: [] });

  expect(handle.folders.get("file:///home/me/project/a.ts")).toBe(project);
});

test("values() hands back what the client sent, in mirror order", () => {
  const handle = storeOf([project, notes]);

  expect([...handle.folders.values()]).toEqual([project, notes]);
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
