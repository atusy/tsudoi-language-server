import { DatabaseSync, type StatementSync } from "node:sqlite";
import type { SqliteDatabase, SqliteStatement, SqliteValue } from "./sqlite.ts";

function statementOf(statement: StatementSync): SqliteStatement {
  return {
    all: (...params: SqliteValue[]) => statement.all(...params) as Record<string, unknown>[],
    get: (...params: SqliteValue[]) =>
      statement.get(...params) as Record<string, unknown> | undefined,
    run: (...params: SqliteValue[]) => statement.run(...params),
  };
}

export function openNodeSqlite(path: string): SqliteDatabase {
  const database = new DatabaseSync(path);
  return {
    close: () => database.close(),
    exec: (sql) => database.exec(sql),
    prepare: (sql) => statementOf(database.prepare(sql)),
  };
}
