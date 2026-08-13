import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
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

test("streams a line and UTF-8 scalar across input chunk boundaries", async () => {
  const long = `${"a".repeat(70_000)}é`;
  const { path, databasePath } = temporaryDictionary(`${long}\nlast`);
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);

    expect(queryEntries(database, [path], "aaaa", 10)).toEqual([long]);
    expect(queryEntries(database, [path], "last", 10)).toEqual(["last"]);
  } finally {
    database.close();
  }
});

test("leading whitespace is preserved in the value but excluded from its search key", async () => {
  const { path, databasePath } = temporaryDictionary("  alpha  \n");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);

    expect(queryEntries(database, [path], "al", 10)).toEqual(["  alpha  "]);
  } finally {
    database.close();
  }
});

test("an older search-key format is reindexed even when file bytes are unchanged", async () => {
  const { path, databasePath } = temporaryDictionary("  alpha\n");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);
    const legacyHash = createHash("sha256").update(readFileSync(path)).digest("hex");
    database
      .prepare("UPDATE dictionary_file SET content_hash = ? WHERE path = ?")
      .run(legacyHash, path);
    database.prepare("UPDATE dictionary_entry SET search_key = value").run();

    expect(await indexFile(database, path)).toBe(true);
    expect(queryEntries(database, [path], "al", 10)).toEqual(["  alpha"]);
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

test("a writer retries when another process holds the shared database lock", async () => {
  const { path, databasePath } = temporaryDictionary("alpha\n");
  const database = await openSqlite(databasePath);
  initializeDatabase(database);
  const holder = spawn(
    "bun",
    [
      "-e",
      `import { Database } from "bun:sqlite";
       const database = new Database(process.env.TSUDOI_BUSY_TEST_DATABASE);
       database.exec("BEGIN IMMEDIATE");
       process.stdout.write("locked\\n");
       setTimeout(() => { database.exec("COMMIT"); database.close(); }, 600);`,
    ],
    {
      env: { ...process.env, TSUDOI_BUSY_TEST_DATABASE: databasePath },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const holderClosed = new Promise<void>((resolve) => holder.once("close", () => resolve()));
  try {
    await new Promise<void>((resolve, reject) => {
      holder.once("error", reject);
      holder.stdout.once("data", () => resolve());
    });

    expect(await indexFile(database, path)).toBe(true);
    expect(queryEntries(database, [path], "al", 10)).toEqual(["alpha"]);
  } finally {
    database.close();
    await holderClosed;
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
  expect(params).toEqual(["/dictionary", "ab", "ac", 10]);
});

test("the exclusive bound retains suffixes after the maximum Unicode scalar", async () => {
  const maximum = String.fromCodePoint(0x10ffff);
  const { path, databasePath } = temporaryDictionary(`a${maximum}tail\nb\n`);
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);

    expect(queryEntries(database, [path], `a${maximum}`, 10)).toEqual([`a${maximum}tail`]);
  } finally {
    database.close();
  }
});

test("a NUL in an entry and prefix is matched as ordinary UTF-8 text", async () => {
  const { path, databasePath } = temporaryDictionary("a\0b\n");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    await indexFile(database, path);

    expect(queryEntries(database, [path], "a\0", 10)).toEqual(["a\0b"]);
  } finally {
    database.close();
  }
});

test("initialization migrates the known legacy prefix index", async () => {
  const { databasePath } = temporaryDictionary("");
  const database = await openSqlite(databasePath);
  try {
    initializeDatabase(database);
    database.exec(
      "CREATE INDEX dictionary_entry_prefix " + "ON dictionary_entry(path, generation, search_key)",
    );
    database.exec("PRAGMA user_version = 0");

    initializeDatabase(database);

    const indexes = database
      .prepare(
        "SELECT name FROM sqlite_schema WHERE type = 'index' AND name LIKE 'dictionary_entry_prefix%'",
      )
      .all()
      .map((row) => row.name);
    expect(indexes).toEqual(["dictionary_entry_prefix_v2"]);
    expect(database.prepare("PRAGMA user_version").get()?.user_version).toBe(1);
  } finally {
    database.close();
  }
});

test("initialization refuses an unrelated database without changing its index", async () => {
  const { databasePath } = temporaryDictionary("");
  const database = await openSqlite(databasePath);
  try {
    database.exec(`
      CREATE TABLE unrelated (value TEXT NOT NULL);
      CREATE UNIQUE INDEX dictionary_entry_prefix ON unrelated(value);
    `);

    expect(() => initializeDatabase(database)).toThrow("dictionary database must be dedicated");
    expect(
      database
        .prepare(
          "SELECT tbl_name AS tableName FROM sqlite_schema WHERE type = 'index' AND name = ?",
        )
        .get("dictionary_entry_prefix"),
    ).toEqual({ tableName: "unrelated" });
    expect(database.prepare("PRAGMA user_version").get()?.user_version).toBe(0);
  } finally {
    database.close();
  }
});
