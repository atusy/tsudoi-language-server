import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  makeCompleteDictionary,
  type DictionaryFilter,
  type RefreshRuntime,
} from "../src/dictionary.ts";
import { openSqlite } from "../src/sqlite.ts";
import { indexFile, initializeDatabase } from "../src/storage.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture(contents: string): { path: string; databasePath: string } {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-handler-"));
  roots.push(root);
  const path = join(root, "words.txt");
  writeFileSync(path, contents);
  return { path, databasePath: join(root, "dictionary.sqlite3") };
}

function request(prefix: string): { context: RequestContext; params: CompletionParams } {
  const uri = "file:///buffer.txt";
  const document = {
    getText: () => prefix,
  };
  return {
    context: {
      signal: new AbortController().signal,
      tsudoi: {
        documents: {
          get: (asked: string) => (asked === uri ? document : undefined),
        },
      },
    } as RequestContext,
    params: {
      textDocument: { uri },
      position: { line: 0, character: prefix.length },
    },
  };
}

async function labels(
  handler: Awaited<ReturnType<typeof makeCompleteDictionary>>,
  prefix: string,
): Promise<string[]> {
  const { context, params } = request(prefix);
  const answer = await handler(context, params).next();
  return answer.done === true ? [] : answer.value.map((item) => item.label);
}

test("completion reads the committed snapshot without waiting for refresh", async () => {
  const { path, databasePath } = fixture("old-entry\n");
  const database = await openSqlite(databasePath);
  initializeDatabase(database);
  await indexFile(database, path);
  database.close();
  writeFileSync(path, "new-entry\n");

  let release: (() => void) | undefined;
  const refresh = new Promise<void>((resolve) => {
    release = resolve;
  });
  const runtime: RefreshRuntime = { refresh: () => refresh };
  const handler = await makeCompleteDictionary(
    { files: [path], databasePath, minPrefixLength: 0, refreshIntervalMs: 0 },
    runtime,
  );

  expect(await labels(handler, "")).toEqual(["old-entry"]);
  release?.();
});

test("the real worker eventually publishes the file without blocking factory creation", async () => {
  const { path, databasePath } = fixture("alpha\nalpine\nbeta\n");
  const handler = await makeCompleteDictionary({
    files: [path],
    databasePath,
    refreshIntervalMs: 0,
  });

  const deadline = Date.now() + 5_000;
  let actual: string[] = [];
  while (actual.length === 0 && Date.now() < deadline) {
    actual = await labels(handler, "al");
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  expect(actual).toEqual(["alpha", "alpine"]);
});

test("custom filters run before the candidate bound", async () => {
  const { path, databasePath } = fixture("alpha\nbeta\ngamma\n");
  const database = await openSqlite(databasePath);
  initializeDatabase(database);
  await indexFile(database, path);
  database.close();
  const suffixFilter: DictionaryFilter = function* (words) {
    for (const word of words) {
      if (word.endsWith("ta")) {
        yield word;
      }
    }
  };
  const handler = await makeCompleteDictionary(
    {
      files: [path],
      databasePath,
      filters: [suffixFilter],
      maxItems: 1,
      minPrefixLength: 0,
    },
    { refresh: () => new Promise<void>(() => {}) },
  );

  expect(await labels(handler, "anything")).toEqual(["beta"]);
});

test("candidate counts reject fractions before opening the database", async () => {
  const { path, databasePath } = fixture("alpha\n");

  expect(makeCompleteDictionary({ files: [path], databasePath, maxItems: 1.5 })).rejects.toThrow(
    "maxItems must be a non-negative integer",
  );
});

test("an onError callback that throws creates no unhandled background rejection", async () => {
  const { path, databasePath } = fixture("alpha\n");
  const observed = Promise.withResolvers<void>();
  const runtime: RefreshRuntime = {
    refresh: () => Promise.reject(new Error("index failed")),
  };
  await makeCompleteDictionary(
    {
      files: [path],
      databasePath,
      onError: () => {
        observed.resolve();
        throw new Error("observer failed");
      },
    },
    runtime,
  );

  await observed.promise;
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
});

test("requests during one refresh coalesce into one follow-up refresh", async () => {
  const { path, databasePath } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<void>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<void>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], databasePath, minPrefixLength: 0, refreshIntervalMs: 0 },
    runtime,
  );
  expect(refreshes).toHaveLength(1);

  await labels(handler, "");
  await labels(handler, "");
  await labels(handler, "");
  expect(refreshes).toHaveLength(1);

  refreshes[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(refreshes).toHaveLength(2);
  refreshes[1]?.resolve();
});

test("a queued follow-up respects the refresh interval", async () => {
  const { path, databasePath } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<void>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<void>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], databasePath, minPrefixLength: 0, refreshIntervalMs: 50 },
    runtime,
  );

  await labels(handler, "");
  refreshes[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(1);

  await new Promise<void>((resolve) => setTimeout(resolve, 60));
  expect(refreshes).toHaveLength(2);
  await labels(handler, "");
  refreshes[1]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(2);
  await new Promise<void>((resolve) => setTimeout(resolve, 60));
  expect(refreshes).toHaveLength(3);
  refreshes[2]?.resolve();
});

test("a slow refresh still waits an interval after it settles", async () => {
  const { path, databasePath } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<void>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<void>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], databasePath, minPrefixLength: 0, refreshIntervalMs: 30 },
    runtime,
  );

  await labels(handler, "");
  await new Promise<void>((resolve) => setTimeout(resolve, 40));
  refreshes[0]?.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(1);
  await new Promise<void>((resolve) => setTimeout(resolve, 30));
  expect(refreshes).toHaveLength(2);
  refreshes[1]?.resolve();
});
