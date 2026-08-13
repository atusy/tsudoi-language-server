import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/types";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import { openSqlite } from "./sqlite.ts";
import { initializeDatabase, queryEntries } from "./storage.ts";

export interface CompleteDictionaryOptions {
  readonly files: readonly string[];
  readonly databasePath?: string;
  readonly minPrefixLength?: number;
  readonly maxItems?: number;
  readonly refreshIntervalMs?: number;
  readonly onError?: (error: unknown) => void;
}

export interface RefreshRuntime {
  refresh(databasePath: string, files: readonly string[]): Promise<void>;
}

interface DoneMessage {
  readonly type: "done";
  readonly errors: ReadonlyArray<{ readonly path: string; readonly message: string }>;
}

function defaultDatabasePath(): string {
  const cache =
    process.env.XDG_CACHE_HOME ??
    (process.platform === "darwin"
      ? join(homedir(), "Library", "Caches")
      : process.platform === "win32"
        ? (process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"))
        : join(homedir(), ".cache"));
  return join(cache, "tsudoi-language-server", "dictionary.sqlite3");
}

function workerUrl(): URL {
  return new URL(import.meta.url.endsWith(".ts") ? "./worker.ts" : "./worker.js", import.meta.url);
}

const workerRuntime: RefreshRuntime = {
  refresh: (databasePath, files) =>
    new Promise<void>((resolveRefresh, rejectRefresh) => {
      const worker = new Worker(workerUrl(), { type: "module" });
      worker.addEventListener("message", (event: MessageEvent<DoneMessage>) => {
        worker.terminate();
        if (event.data.errors.length === 0) {
          resolveRefresh();
          return;
        }
        rejectRefresh(
          new AggregateError(
            event.data.errors.map(
              ({ path, message }) =>
                new Error(`failed to index dictionary ${JSON.stringify(path)}: ${message}`),
            ),
            "one or more dictionaries could not be indexed",
          ),
        );
      });
      worker.addEventListener("error", (event) => {
        event.preventDefault();
        worker.terminate();
        rejectRefresh(event.error ?? new Error(event.message));
      });
      worker.postMessage({ databasePath, files });
    }),
};

function finiteNonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number`);
  }
  return value;
}

function nonNegativeInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
  return value;
}

export async function makeCompleteDictionary(
  options: CompleteDictionaryOptions,
  runtime: RefreshRuntime = workerRuntime,
): Promise<MethodHandler<"textDocument/completion">> {
  const files = [...new Set(options.files.map((path) => resolve(path)))];
  const databasePath = resolve(options.databasePath ?? defaultDatabasePath());
  const minPrefixLength = nonNegativeInteger(options.minPrefixLength ?? 2, "minPrefixLength");
  const maxItems = nonNegativeInteger(options.maxItems ?? 500, "maxItems");
  const refreshIntervalMs = finiteNonNegative(
    options.refreshIntervalMs ?? 1_000,
    "refreshIntervalMs",
  );
  await mkdir(dirname(databasePath), { recursive: true });
  const database = await openSqlite(databasePath);
  initializeDatabase(database);

  let refreshing = false;
  let queued = false;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let lastRefreshFinished = Number.NEGATIVE_INFINITY;
  const startRefresh = (): void => {
    if (refreshing) {
      queued = true;
      return;
    }
    refreshing = true;
    void runtime
      .refresh(databasePath, files)
      .catch((error: unknown) => {
        try {
          options.onError?.(error);
        } catch {
          // Error observation is best-effort background work. A callback must
          // not turn a handled indexing failure into an unhandled rejection.
        }
      })
      .finally(() => {
        refreshing = false;
        lastRefreshFinished = Date.now();
        if (queued) {
          queued = false;
          requestRefresh();
        }
      });
  };
  const requestRefresh = (): void => {
    if (refreshing) {
      queued = true;
      return;
    }
    if (refreshTimer !== undefined) {
      return;
    }
    const delayMs = Math.max(0, lastRefreshFinished + refreshIntervalMs - Date.now());
    if (delayMs === 0) {
      startRefresh();
      return;
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      startRefresh();
    }, delayMs);
    if (typeof refreshTimer === "object") {
      refreshTimer.unref();
    }
  };
  startRefresh();

  return async function* completeDictionary(context, params) {
    requestRefresh();
    if (context.signal.aborted) {
      return;
    }
    const document = context.tsudoi.documents.get(params.textDocument.uri);
    if (document === undefined) {
      return;
    }
    const before = document.getText({
      start: { line: params.position.line, character: 0 },
      end: params.position,
    });
    const prefix = /\S+$/u.exec(before)?.[0] ?? "";
    if (prefix.length < minPrefixLength) {
      return;
    }
    const entries = queryEntries(database, files, prefix, maxItems);
    if (entries.length === 0) {
      return;
    }
    // COMPLETENESS RULING: this is the complete bounded answer from the active
    // committed generations. A background generation is a future dictionary
    // snapshot, not an omitted chunk of this response.
    yield entries.map(
      (label) =>
        ({
          label,
          kind: 1,
          detail: "dictionary",
        }) satisfies CompletionItem,
    );
  };
}

export function completeDictionaryFactory(
  options: CompleteDictionaryOptions,
): Promise<MethodHandler<"textDocument/completion">> {
  return makeCompleteDictionary(options);
}
