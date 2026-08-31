import { resolve } from "node:path";
import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/types";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import {
  applyDictionaryFilters,
  defaultDictionaryFilters,
  dictionaryPrefixFilter,
  type DictionaryFilter,
} from "./filters.ts";
import {
  mergeDictionaryFiles,
  queryEntries,
  type DictionaryFileSnapshot,
  type DictionaryFileVersion,
  type RefreshResult,
} from "./memory.ts";

export interface UseDictionaryCompletionOptions {
  readonly files: readonly string[];
  readonly filters?: readonly DictionaryFilter[];
  readonly refreshIntervalMs?: number;
  readonly onError?: (error: unknown) => void;
}

export interface CompleteDictionaryOptions {
  readonly maxItems?: number;
  readonly minPrefixLength?: number;
}

export type DictionaryCompletion = (
  context: Parameters<MethodHandler<"textDocument/completion">>[0],
  params: Parameters<MethodHandler<"textDocument/completion">>[1],
  options?: CompleteDictionaryOptions,
) => ReturnType<MethodHandler<"textDocument/completion">>;

export interface RefreshRuntime {
  refresh(
    files: readonly string[],
    versions: readonly DictionaryFileVersion[],
  ): Promise<RefreshResult>;
}

interface DoneMessage extends RefreshResult {
  readonly type: "done";
}

function workerUrl(): URL {
  return new URL(import.meta.url.endsWith(".ts") ? "./worker.ts" : "./worker.js", import.meta.url);
}

const workerRuntime: RefreshRuntime = {
  refresh: (files, versions) =>
    new Promise<RefreshResult>((resolveRefresh, rejectRefresh) => {
      const worker = new Worker(workerUrl(), { type: "module" });
      worker.addEventListener("message", (event: MessageEvent<DoneMessage>) => {
        worker.terminate();
        resolveRefresh(event.data);
      });
      worker.addEventListener("error", (event) => {
        event.preventDefault();
        worker.terminate();
        rejectRefresh(event.error ?? new Error(event.message));
      });
      worker.postMessage({ files, versions });
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
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return value;
}

export async function makeCompleteDictionary(
  options: UseDictionaryCompletionOptions,
  runtime: RefreshRuntime = workerRuntime,
): Promise<DictionaryCompletion> {
  if ("minPrefixLength" in options) {
    throw new TypeError("minPrefixLength moved to the completion handler's third argument");
  }
  const files = [...new Set(options.files.map((path) => resolve(path)))];
  const configuredFiles = new Set(files);
  const filters = options.filters ?? defaultDictionaryFilters;
  const refreshIntervalMs = finiteNonNegative(
    options.refreshIntervalMs ?? 1_000,
    "refreshIntervalMs",
  );
  let snapshots = new Map<string, DictionaryFileSnapshot>();
  let snapshotEntries: readonly string[] = [];

  const publish = (result: RefreshResult): void => {
    if (result.files.length === 0) {
      return;
    }
    const merged = mergeDictionaryFiles(snapshots, result.files, configuredFiles);
    snapshots = merged.snapshots;
    snapshotEntries = merged.entries;
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
      .refresh(
        files,
        [...snapshots.values()].map(({ path, contentHash }) => ({ path, contentHash })),
      )
      .then((result) => {
        publish(result);
        if (result.errors.length > 0) {
          throw new AggregateError(
            result.errors.map(
              ({ path, message }) =>
                new Error(`failed to read dictionary ${JSON.stringify(path)}: ${message}`),
            ),
            "one or more dictionaries could not be read",
          );
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
    const maxItems = nonNegativeInteger(
      completionOptions.maxItems === undefined ? 500 : completionOptions.maxItems,
      "maxItems",
    );
    const minPrefixLength = nonNegativeInteger(
      completionOptions.minPrefixLength === undefined ? 2 : completionOptions.minPrefixLength,
      "minPrefixLength",
    );
    if (context.signal.aborted || maxItems === 0) {
      return;
    }
    requestRefresh();
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
    const entries = queryEntries(snapshotEntries, prefixRunsFirst ? prefix : "", queryLimit);
    const filtered = applyDictionaryFilters(entries, filters, { typed: prefix }, maxItems);
    if (filtered.length === 0) {
      return;
    }
    // COMPLETENESS RULING: this is the complete bounded answer from the active
    // immutable snapshot. A background refresh is a future dictionary snapshot,
    // not an omitted chunk of this response.
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
  options: UseDictionaryCompletionOptions,
): Promise<DictionaryCompletion> {
  return makeCompleteDictionary(options);
}
