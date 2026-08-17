import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  mergeDictionaryFiles,
  queryEntries,
  readDictionaryFile,
  type DictionaryFileSnapshot,
} from "../src/memory.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function dictionary(contents: string | Uint8Array): string {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-memory-"));
  roots.push(root);
  const path = join(root, "words.txt");
  writeFileSync(path, contents);
  return path;
}

test("reads non-empty UTF-8 lines while preserving their values", async () => {
  const path = dictionary("  alpha  \r\n\nアルファ\nlast line");

  const file = await readDictionaryFile(path);

  expect(file?.entries).toEqual(["  alpha  ", "last line", "アルファ"]);
});

test("a content hash skips unchanged bytes and detects changed bytes", async () => {
  const path = dictionary("before\n");
  const before = await readDictionaryFile(path);
  expect(before).toBeDefined();

  expect(await readDictionaryFile(path, before?.contentHash)).toBeUndefined();
  writeFileSync(path, "after\n");
  expect((await readDictionaryFile(path, before?.contentHash))?.entries).toEqual(["after"]);
});

test("invalid UTF-8 does not produce a replacement snapshot", async () => {
  const path = dictionary(new Uint8Array([0xc3, 0x28]));

  expect(readDictionaryFile(path)).rejects.toThrow();
});

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
