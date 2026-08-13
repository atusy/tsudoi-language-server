import process from "node:process";

export type SqliteValue = bigint | number | string | null | Uint8Array;

export interface SqliteStatement {
  all(...params: SqliteValue[]): Record<string, unknown>[];
  get(...params: SqliteValue[]): Record<string, unknown> | undefined;
  run(...params: SqliteValue[]): unknown;
}

export interface SqliteDatabase {
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

export async function openSqlite(path: string): Promise<SqliteDatabase> {
  if (typeof process.versions.bun === "string") {
    const { openBunSqlite } = await import("./sqlite-bun.ts");
    return openBunSqlite(path);
  }
  const { openNodeSqlite } = await import("./sqlite-node.ts");
  return openNodeSqlite(path);
}
