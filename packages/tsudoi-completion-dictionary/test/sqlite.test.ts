import { expect, test } from "bun:test";
import { openSqlite } from "../src/sqlite.ts";

test("opens the runtime SQLite and executes parameterized statements", async () => {
  const database = await openSqlite(":memory:");
  try {
    database.exec("CREATE TABLE entry (value TEXT NOT NULL)");
    database.prepare("INSERT INTO entry VALUES (?)").run("alpha");

    expect(database.prepare("SELECT value FROM entry WHERE value = ?").get("alpha")).toEqual({
      value: "alpha",
    });
  } finally {
    database.close();
  }
});
