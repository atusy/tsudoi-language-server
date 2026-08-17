import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/types";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import {
  applyDictionaryFilters,
  defaultDictionaryFilters,
  dictionaryPrefixFilter,
  type DictionaryFilter,
} from "./filters.ts";
import { openSqlite } from "./sqlite.ts";
import { initializeDatabase, queryEntries } from "./storage.ts";

export interface CompleteDictionaryOptions {
  readonly files: readonly string[];
  readonly databasePath?: string;
  readonly filters?: readonly DictionaryFilter[];
  readonly minPrefixLength?: number;
  readonly refreshIntervalMs?: number;
  readonly onError?: (error: unknown) => void;
}

export interface DictionaryCompletionOptions {
  readonly maxItems?: number;
}

export type DictionaryCompletion = (
  context: Parameters<MethodHandler<"textDocument/completion">>[0],
  params: Parameters<MethodHandler<"textDocument/completion">>[1],
  options?: DictionaryCompletionOptions,
) => ReturnType<MethodHandler<"textDocument/completion">>;

export interface RefreshRuntime {
  refresh(
    databasePath: string,
    files: readonly string[],
  ): Promise<RefreshResult | void>;
}

export interface DictionaryFileSnapshot {
  readonly path: string;
  readonly contentHash: string;
  readonly entries: readonly string[];
}

export interface RefreshResult {
  readonly files: readonly DictionaryFileSnapshot[];
  readonly errors: ReadonlyArray<{ readonly path: string; readonly message: string }>;
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
): Promise<DictionaryCompletion> {
  const files = [...new Set(options.files.map((path) => resolve(path)))];
  const databasePath = resolve(options.databasePath ?? defaultDatabasePath());
  const minPrefixLength = nonNegativeInteger(options.minPrefixLength ?? 2, "minPrefixLength");
  const filters = options.filters ?? defaultDictionaryFilters;
  const refreshIntervalMs = finiteNonNegative(
    options.refreshIntervalMs ?? 1_000,
    "refreshIntervalMs",
  );
  await mkdir(dirname(databasePath), { recursive: true });
  const database = await openSqlite(databasePath);
  initializeDatabase(database);
  const snapshots = new Map<string, DictionaryFileSnapshot>();
  let snapshotEntries: readonly string[] | undefined;

  const publish = (result: RefreshResult): void => {
    for (const file of result.files) {
      if (files.includes(file.path)) {
        snapshots.set(file.path, file);
      }
    }
    const values = [...snapshots.values()].flatMap((file) => file.entries);
    snapshotEntries = [...new Set(values)].sort((left, right) => {
      const leftKey = left.trimStart().toLowerCase();
      const rightKey = right.trimStart().toLowerCase();
      if (leftKey !== rightKey) {
        return leftKey < rightKey ? -1 : 1;
      }
      return left < right ? -1 : left === right ? 0 : 1;
    });
  };

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
      .then((result) => {
        if (result !== undefined) {
          publish(result);
        }
      })
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

  return async function* completeDictionary(context, params, completionOptions = {}) {
    requestRefresh();
    const maxItems = nonNegativeInteger(completionOptions.maxItems ?? 500, "maxItems");
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
    const prefixRunsFirst = filters[0] === dictionaryPrefixFilter;
    const queryLimit =
      filters.length === 0 || (prefixRunsFirst && filters.length === 1) ? maxItems : undefined;
    const entries =
      snapshotEntries === undefined
        ? queryEntries(database, files, prefixRunsFirst ? prefix : "", queryLimit)
        : snapshotEntries
            .filter(
              prefixRunsFirst
                ? (entry) => entry.trimStart().toLowerCase().startsWith(prefix.toLowerCase())
                : () => true,
            )
            .slice(0, queryLimit);
    const filtered = applyDictionaryFilters(entries, filters, { typed: prefix }, maxItems);
    if (filtered.length === 0) {
      return;
    }
    // COMPLETENESS RULING: this is the complete bounded answer from the active
    // committed generations. A background generation is a future dictionary
    // snapshot, not an omitted chunk of this response.
    yield filtered.map(
      (label) =>
        ({
          label,
          kind: 1,
          detail: "dictionary",
        }) satisfies CompletionItem,
    );
  };
}

export type { DictionaryFilter } from "./filters.ts";

export function useDictionaryCompletion(
  options: CompleteDictionaryOptions,
): Promise<DictionaryCompletion> {
  return makeCompleteDictionary(options);
}
