import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSqlite } from "../packages/tsudoi-completion-dictionary/src/sqlite.ts";
import {
  indexFile,
  initializeDatabase,
  queryEntries,
} from "../packages/tsudoi-completion-dictionary/src/storage.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

test("a dictionary writer retries when another process holds the shared database lock", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-contention-"));
  const path = join(root, "words.txt");
  const databasePath = join(root, "dictionary.sqlite3");
  writeFileSync(path, "alpha\n");
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
    rmSync(root, { recursive: true, force: true });
  }
});
