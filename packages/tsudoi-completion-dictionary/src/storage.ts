import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import type { SqliteDatabase } from "./sqlite.ts";

interface FileRecord {
  readonly contentHash: string;
  readonly generation: number;
}

const indexFormat = "2";
const schemaVersion = 1;

export function initializeDatabase(database: SqliteDatabase): void {
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA synchronous = NORMAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 250");
  const version = database.prepare("PRAGMA user_version").get()?.user_version;
  if (typeof version !== "number" || version > schemaVersion) {
    throw new Error(`unsupported dictionary database schema version ${String(version)}`);
  }
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
    DROP INDEX IF EXISTS dictionary_entry_prefix;
    PRAGMA user_version = ${schemaVersion};
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

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function insertEntries(
  database: SqliteDatabase,
  path: string,
  generation: number,
  expectedHash: string,
): Promise<void> {
  const insert = database.prepare(
    "INSERT INTO dictionary_entry (path, generation, ordinal, value, search_key) " +
      "VALUES (?, ?, ?, ?, ?)",
  );
  const hash = createHash("sha256");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "";
  let ordinal = 0;
  const insertCompleteLines = (): void => {
    let newline = pending.indexOf("\n");
    while (newline !== -1) {
      let value = pending.slice(0, newline);
      if (value.endsWith("\r")) {
        value = value.slice(0, -1);
      }
      if (value !== "") {
        insert.run(path, generation, ordinal, value, value.trimStart().toLowerCase());
        ordinal += 1;
      }
      pending = pending.slice(newline + 1);
      newline = pending.indexOf("\n");
    }
  };

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    pending += decoder.decode(chunk, { stream: true });
    insertCompleteLines();
  }
  pending += decoder.decode();
  insertCompleteLines();
  if (pending !== "") {
    insert.run(path, generation, ordinal, pending, pending.trimStart().toLowerCase());
  }
  if (hash.digest("hex") !== expectedHash) {
    throw new Error(`dictionary ${JSON.stringify(path)} changed while it was being indexed`);
  }
}

export async function indexFile(database: SqliteDatabase, path: string): Promise<boolean> {
  database.exec("BEGIN IMMEDIATE");
  try {
    // Snapshot only after taking the shared database's write lock. Otherwise a
    // slower process can read old bytes, wait behind a newer publisher, and
    // then replace that newer generation with its stale snapshot.
    const contentHash = await hashFile(path);
    const indexedHash = `${indexFormat}:${contentHash}`;
    const current = fileRecord(database, path);
    if (current?.contentHash === indexedHash) {
      database.exec("COMMIT");
      return false;
    }
    const generation = (current?.generation ?? 0) + 1;
    if (current === undefined) {
      database
        .prepare(
          "INSERT INTO dictionary_file (path, content_hash, active_generation) VALUES (?, ?, ?)",
        )
        .run(path, indexedHash, generation);
    }

    await insertEntries(database, path, generation, contentHash);
    if (current !== undefined) {
      database
        .prepare(
          "UPDATE dictionary_file SET content_hash = ?, active_generation = ? WHERE path = ?",
        )
        .run(indexedHash, generation, path);
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
  const points = Array.from(searchKey);
  let upperBound: string | undefined;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index]?.codePointAt(0);
    if (point !== undefined && point < 0x10ffff) {
      upperBound = `${points.slice(0, index).join("")}${String.fromCodePoint(point + 1)}`;
      break;
    }
  }
  const upperClause = upperBound === undefined ? "" : "AND entry.search_key < ?";
  const rows = database
    .prepare(
      `SELECT DISTINCT entry.value AS value, entry.search_key AS searchKey
       FROM dictionary_entry AS entry
       JOIN dictionary_file AS file
         ON file.path = entry.path
        AND file.active_generation = entry.generation
       WHERE entry.path IN (${placeholders})
         AND entry.search_key >= ?
         ${upperClause}
       ORDER BY entry.search_key, entry.value
       LIMIT ?`,
    )
    .all(...paths, searchKey, ...(upperBound === undefined ? [] : [upperBound]), maxItems);
  return rows.map((row) => {
    if (typeof row.value !== "string") {
      throw new TypeError("a dictionary entry has an invalid shape");
    }
    return row.value;
  });
}
