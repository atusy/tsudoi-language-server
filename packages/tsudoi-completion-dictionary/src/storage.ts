import { readFile } from "node:fs/promises";
import type { SqliteDatabase } from "./sqlite.ts";

interface FileRecord {
  readonly contentHash: string;
  readonly generation: number;
}

interface FileSnapshot {
  readonly contentHash: string;
  readonly entries: readonly string[];
}

export function initializeDatabase(database: SqliteDatabase): void {
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA synchronous = NORMAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 250");
  database.exec(`
    CREATE TABLE IF NOT EXISTS dictionary_file (
      path TEXT PRIMARY KEY,
      content_hash TEXT NOT NULL,
      active_generation INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS dictionary_entry (
      path TEXT NOT NULL,
      generation INTEGER NOT NULL,
      ordinal INTEGER NOT NULL,
      value TEXT NOT NULL,
      search_key TEXT NOT NULL,
      PRIMARY KEY (path, generation, ordinal),
      FOREIGN KEY (path) REFERENCES dictionary_file(path) ON DELETE CASCADE
    ) STRICT;
    CREATE INDEX IF NOT EXISTS dictionary_entry_prefix_v2
      ON dictionary_entry(path, generation, search_key, value);
  `);
}

function fileRecord(database: SqliteDatabase, path: string): FileRecord | undefined {
  const row = database
    .prepare(
      "SELECT content_hash AS contentHash, active_generation AS generation " +
        "FROM dictionary_file WHERE path = ?",
    )
    .get(path);
  if (row === undefined) {
    return undefined;
  }
  if (typeof row.contentHash !== "string" || typeof row.generation !== "number") {
    throw new TypeError(`dictionary metadata for ${JSON.stringify(path)} has an invalid shape`);
  }
  return { contentHash: row.contentHash, generation: row.generation };
}

async function snapshot(path: string): Promise<FileSnapshot> {
  const bytes = await readFile(path);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const contentHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const entries = text.split(/\r?\n/u).filter((line) => line !== "");
  return { contentHash, entries };
}

export async function indexFile(database: SqliteDatabase, path: string): Promise<boolean> {
  const next = await snapshot(path);
  if (fileRecord(database, path)?.contentHash === next.contentHash) {
    return false;
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    // Another process may have published the same bytes while this process was
    // hashing them, so the authority is read again after taking the write lock.
    const current = fileRecord(database, path);
    if (current?.contentHash === next.contentHash) {
      database.exec("ROLLBACK");
      return false;
    }
    const generation = (current?.generation ?? 0) + 1;
    if (current === undefined) {
      database
        .prepare(
          "INSERT INTO dictionary_file (path, content_hash, active_generation) VALUES (?, ?, ?)",
        )
        .run(path, next.contentHash, generation);
    }

    const insert = database.prepare(
      "INSERT INTO dictionary_entry (path, generation, ordinal, value, search_key) " +
        "VALUES (?, ?, ?, ?, ?)",
    );
    for (const [ordinal, value] of next.entries.entries()) {
      insert.run(path, generation, ordinal, value, value.toLowerCase());
    }
    if (current !== undefined) {
      database
        .prepare(
          "UPDATE dictionary_file SET content_hash = ?, active_generation = ? WHERE path = ?",
        )
        .run(next.contentHash, generation, path);
    }
    database
      .prepare("DELETE FROM dictionary_entry WHERE path = ? AND generation <> ?")
      .run(path, generation);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // Preserve the operation that failed; a rollback failure only describes
      // cleanup of that failure and the connection will not be reused blindly.
    }
    throw error;
  }
}

export function queryEntries(
  database: SqliteDatabase,
  paths: readonly string[],
  prefix: string,
  maxItems: number,
): string[] {
  if (paths.length === 0 || maxItems <= 0) {
    return [];
  }
  const placeholders = paths.map(() => "?").join(", ");
  const searchKey = prefix.toLowerCase();
  const upperBound = `${searchKey}${String.fromCodePoint(0x10ffff)}`;
  const rows = database
    .prepare(
      `SELECT DISTINCT entry.value AS value, entry.search_key AS searchKey
       FROM dictionary_entry AS entry
       JOIN dictionary_file AS file
         ON file.path = entry.path
        AND file.active_generation = entry.generation
       WHERE entry.path IN (${placeholders})
         AND entry.search_key >= ?
         AND entry.search_key < ?
         AND substr(entry.search_key, 1, length(?)) = ?
       ORDER BY entry.search_key, entry.value
       LIMIT ?`,
    )
    .all(...paths, searchKey, upperBound, searchKey, searchKey, maxItems);
  return rows.map((row) => {
    if (typeof row.value !== "string") {
      throw new TypeError("a dictionary entry has an invalid shape");
    }
    return row.value;
  });
}
