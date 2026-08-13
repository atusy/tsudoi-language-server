import { openSqlite } from "./sqlite.ts";
import { indexFile, initializeDatabase } from "./storage.ts";

interface RefreshMessage {
  readonly databasePath: string;
  readonly files: readonly string[];
}

interface WorkerScope {
  addEventListener(type: "message", listener: (event: MessageEvent<RefreshMessage>) => void): void;
  close(): void;
  postMessage(message: unknown): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.addEventListener("message", (event) => {
  void refresh(event.data);
});

async function refresh(message: RefreshMessage): Promise<void> {
  const errors: Array<{ path: string; message: string }> = [];
  const database = await openSqlite(message.databasePath);
  try {
    initializeDatabase(database);
    for (const path of message.files) {
      try {
        await indexFile(database, path);
      } catch (error) {
        errors.push({ path, message: String(error) });
      }
    }
  } finally {
    database.close();
  }
  scope.postMessage({ type: "done", errors });
  scope.close();
}
