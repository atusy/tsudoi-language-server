import { expect, test } from "bun:test";
import { mergeDictionaryFiles, queryEntries, type DictionaryFileSnapshot } from "./memory.ts";

test("merging snapshots deduplicates configured files into searchable order", () => {
  const first: DictionaryFileSnapshot = {
    path: "/first",
    contentHash: "first",
    entries: ["  Alpha", "beta", "shared"],
  };
  const second: DictionaryFileSnapshot = {
    path: "/second",
    contentHash: "second",
    entries: ["alpine", "shared"],
  };
  const ignored: DictionaryFileSnapshot = {
    path: "/ignored",
    contentHash: "ignored",
    entries: ["also-ignored"],
  };

  const merged = mergeDictionaryFiles(
    new Map(),
    [first, second, ignored],
    new Set([first.path, second.path]),
  );

  expect(queryEntries(merged.entries, "al")).toEqual(["  Alpha", "alpine"]);
  expect(queryEntries(merged.entries, "", 3)).toEqual(["  Alpha", "alpine", "beta"]);
  expect(merged.entries).not.toContain("also-ignored");
  expect(merged.entries.filter((entry) => entry === "shared")).toHaveLength(1);
});

test("a replacement changes one file without mutating the previous snapshot", () => {
  const oldFile: DictionaryFileSnapshot = {
    path: "/words",
    contentHash: "old",
    entries: ["old-entry"],
  };
  const before = mergeDictionaryFiles(new Map(), [oldFile], new Set([oldFile.path]));
  const newFile: DictionaryFileSnapshot = {
    path: oldFile.path,
    contentHash: "new",
    entries: ["new-entry"],
  };

  const after = mergeDictionaryFiles(before.snapshots, [newFile], new Set([oldFile.path]));

  expect(before.entries).toEqual(["old-entry"]);
  expect(after.entries).toEqual(["new-entry"]);
});
