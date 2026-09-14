import { applySuiteDeadline } from "../../helpers/deadline.ts";

applySuiteDeadline();

import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readDictionaryFile } from "../../../packages/tsudoi-completion-dictionary/src/memory.ts";

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
