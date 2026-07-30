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
