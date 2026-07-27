import { expect, test } from "bun:test";
import { createDocumentStore } from "../src/documents.ts";

const uri = "file:///workspace/a.txt";

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
