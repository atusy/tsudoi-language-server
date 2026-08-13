import { Database } from "bun:sqlite";
import type { SqliteDatabase, SqliteStatement, SqliteValue } from "./sqlite.ts";

function statementOf(statement: ReturnType<Database["prepare"]>): SqliteStatement {
  return {
    all: (...params: SqliteValue[]) => statement.all(...params) as Record<string, unknown>[],
    get: (...params: SqliteValue[]) => {
      const row = statement.get(...params) as Record<string, unknown> | null;
      return row ?? undefined;
    },
    run: (...params: SqliteValue[]) => statement.run(...params),
  };
}

export function openBunSqlite(path: string): SqliteDatabase {
  const database = new Database(path, { create: true });
  return {
    close: () => database.close(),
    exec: (sql) => {
      database.exec(sql);
    },
    prepare: (sql) => statementOf(database.prepare(sql)),
  };
}
