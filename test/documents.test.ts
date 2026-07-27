import { expect, test } from "bun:test";
import type { DidOpenTextDocumentParams } from "vscode-languageserver-protocol";
import { createDocumentStore } from "../src/documents.ts";

const uri = "file:///workspace/a.txt";
const otherUri = "file:///workspace/b.txt";

function opened(documentUri: string, text: string): DidOpenTextDocumentParams {
  return { textDocument: { uri: documentUri, languageId: "plaintext", version: 1, text } };
}

test("open registers a document whose uri, languageId, version and text all match", () => {
  const store = createDocumentStore();

  store.open({
    textDocument: { uri, languageId: "plaintext", version: 1, text: "hello" },
  });

  const document = store.documents.get(uri);
  if (document === undefined) {
    throw new Error("open registered nothing under the uri it was given");
  }
  expect(document.uri).toBe(uri);
  expect(document.languageId).toBe("plaintext");
  expect(document.version).toBe(1);
  expect(document.getText()).toBe("hello");
  const all = [...store.documents.values()];
  expect(all).toHaveLength(1);
  expect(all[0]).toBe(document);
});

test("successive changes leave getText() and version matching the last one sent", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));

  store.change({
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: "hello world" }],
  });
  store.change({
    textDocument: { uri, version: 7 },
    contentChanges: [{ text: "bye" }],
  });

  // Exact equality, and the last text is SHORTER than the one before it: under
  // full sync a store that concatenated instead of replacing would still
  // contain "bye", so only shrinking distinguishes replace from append.
  expect(store.documents.get(uri)?.getText()).toBe("bye");
  // The version is the client's, not a counter: two changes, but version 7.
  expect(store.documents.get(uri)?.version).toBe(7);
  expect(store.documents.get(uri)?.languageId).toBe("plaintext");
});

test("close removes the document, leaving get() undefined and values() empty", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "hello"));

  store.close({ textDocument: { uri } });

  expect(store.documents.get(uri)).toBeUndefined();
  expect([...store.documents.values()]).toEqual([]);
});

test("closing one of two open documents leaves exactly the other one", () => {
  const store = createDocumentStore();
  store.open(opened(uri, "first"));
  store.open(opened(otherUri, "second"));

  store.close({ textDocument: { uri } });

  const remaining = [...store.documents.values()];
  expect(remaining).toHaveLength(1);
  expect(remaining[0]?.uri).toBe(otherUri);
  expect(remaining[0]?.getText()).toBe("second");
  expect(store.documents.get(uri)).toBeUndefined();
});
