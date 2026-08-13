import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSqlite } from "../src/sqlite.ts";
import type { SqliteDatabase, SqliteValue } from "../src/sqlite.ts";
import { indexFile, initializeDatabase, queryEntries } from "../src/storage.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function temporaryDictionary(contents: string): { path: string; databasePath: string } {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-"));
  roots.push(root);
  const path = join(root, "words.txt");
  writeFileSync(path, contents);
  return { path, databasePath: join(root, "dictionary.sqlite3") };
}

test("indexes one whole UTF-8 line per entry and searches by prefix", async () => {
  const { path, databasePath } = temporaryDictionary("alpha beta\r\nalpine\n\nアルファ\nlast line");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    expect(await indexFile(database, path)).toBe(true);

    expect(queryEntries(database, [path], "al", 10)).toEqual(["alpha beta", "alpine"]);
    expect(queryEntries(database, [path], "アル", 10)).toEqual(["アルファ"]);
    expect(queryEntries(database, [path], "last", 10)).toEqual(["last line"]);
  } finally {
    database.close();
  }
});

test("the content hash skips unchanged bytes and replaces changed bytes", async () => {
  const { path, databasePath } = temporaryDictionary("before\n");
  const fixedTime = new Date(1_700_000_000_000);
  utimesSync(path, fixedTime, fixedTime);
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    expect(await indexFile(database, path)).toBe(true);
    expect(await indexFile(database, path)).toBe(false);

    const before = statSync(path);
    writeFileSync(path, "after!\n");
    utimesSync(path, fixedTime, fixedTime);
    const after = statSync(path);
    expect(after.size).toBe(before.size);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(await indexFile(database, path)).toBe(true);
    expect(queryEntries(database, [path], "", 10)).toEqual(["after!"]);
  } finally {
    database.close();
  }
});

test("the write lock is acquired before the source snapshot is read", async () => {
  const { path, databasePath } = temporaryDictionary("stale\n");
  const database = await openSqlite(databasePath);
  initializeDatabase(database);
  const lockingDatabase = {
    ...database,
    exec: (sql: string) => {
      database.exec(sql);
      if (sql === "BEGIN IMMEDIATE") {
        unlinkSync(path);
      }
    },
  } satisfies SqliteDatabase;
  try {
    expect(indexFile(lockingDatabase, path)).rejects.toThrow();
    expect(queryEntries(database, [path], "", 10)).toEqual([]);
  } finally {
    database.close();
  }
});

test("a failed replacement rolls back and leaves the old generation active", async () => {
  const { path, databasePath } = temporaryDictionary("old\n");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);
    database.exec(`
      CREATE TRIGGER reject_bad_entry
      BEFORE INSERT ON dictionary_entry
      WHEN NEW.value = 'bad'
      BEGIN
        SELECT RAISE(ABORT, 'rejected by test');
      END;
    `);
    writeFileSync(path, "bad\n");

    expect(indexFile(database, path)).rejects.toThrow("rejected by test");
    expect(queryEntries(database, [path], "", 10)).toEqual(["old"]);
  } finally {
    database.close();
  }
});

test("a reader sees only the active generation while a replacement transaction is open", async () => {
  const { path, databasePath } = temporaryDictionary("old\n");
  const writer = await openSqlite(databasePath);
  initializeDatabase(writer);
  await indexFile(writer, path);
  const reader = await openSqlite(databasePath);
  initializeDatabase(reader);
  try {
    writer.exec("BEGIN IMMEDIATE");
    writer
      .prepare(
        "INSERT INTO dictionary_entry (path, generation, ordinal, value, search_key) " +
          "VALUES (?, ?, ?, ?, ?)",
      )
      .run(path, 2, 0, "new", "new");
    writer
      .prepare("UPDATE dictionary_file SET content_hash = ?, active_generation = ? WHERE path = ?")
      .run("replacement", 2, path);

    expect(queryEntries(reader, [path], "", 10)).toEqual(["old"]);
    writer.exec("COMMIT");
    expect(queryEntries(reader, [path], "", 10)).toEqual(["new"]);
  } finally {
    try {
      writer.exec("ROLLBACK");
    } catch {
      // The successful path has already committed.
    }
    reader.close();
    writer.close();
  }
});

test("invalid UTF-8 leaves the last committed generation active", async () => {
  const { path, databasePath } = temporaryDictionary("old\n");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);
    writeFileSync(path, new Uint8Array([0xff]));

    expect(indexFile(database, path)).rejects.toThrow();
    expect(queryEntries(database, [path], "", 10)).toEqual(["old"]);
  } finally {
    database.close();
  }
});

test("queries deduplicate entries and include only the configured files", async () => {
  const first = temporaryDictionary("alpha\nalpha\nbeta\n");
  const second = temporaryDictionary("another\n");
  const database = await openSqlite(first.databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, first.path);
    await indexFile(database, second.path);

    expect(queryEntries(database, [first.path], "a", 10)).toEqual(["alpha"]);
    expect(queryEntries(database, [first.path, second.path], "a", 1)).toEqual(["alpha"]);
  } finally {
    database.close();
  }
});

test("a prefix query carries an exclusive upper bound into SQLite", () => {
  let sql = "";
  let params: SqliteValue[] = [];
  const database = {
    prepare: (prepared: string) => {
      sql = prepared;
      return {
        all: (...values: SqliteValue[]) => {
          params = values;
          return [];
        },
      };
    },
  } as unknown as SqliteDatabase;

  queryEntries(database, ["/dictionary"], "Ab", 10);

  expect(sql).toContain("entry.search_key < ?");
  expect(params).toEqual([
    "/dictionary",
    "ab",
    `ab${String.fromCodePoint(0x10ffff)}`,
    "ab",
    "ab",
    10,
  ]);
});
