import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface DictionaryFileSnapshot {
  readonly path: string;
  readonly contentHash: string;
  readonly entries: readonly string[];
}

export interface DictionaryFileVersion {
  readonly path: string;
  readonly contentHash: string;
}

export interface RefreshResult {
  readonly files: readonly DictionaryFileSnapshot[];
  readonly errors: ReadonlyArray<{ readonly path: string; readonly message: string }>;
}

export async function readDictionaryFile(
  path: string,
  previousHash?: string,
): Promise<DictionaryFileSnapshot | undefined> {
  const bytes = await readFile(path);
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  if (contentHash === previousHash) {
    return undefined;
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const entries = text.split("\n").flatMap((line) => {
    const value = line.endsWith("\r") ? line.slice(0, -1) : line;
    return value === "" ? [] : [value];
  });
  return { path, contentHash, entries: sortedEntries(entries) };
}

function searchKey(value: string): string {
  return value.trimStart().toLowerCase();
}

function sortedEntries(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((left, right) => {
    const leftKey = searchKey(left);
    const rightKey = searchKey(right);
    if (leftKey !== rightKey) {
      return leftKey < rightKey ? -1 : 1;
    }
    return left < right ? -1 : left === right ? 0 : 1;
  });
}

export function mergeDictionaryFiles(
  snapshots: ReadonlyMap<string, DictionaryFileSnapshot>,
  updates: readonly DictionaryFileSnapshot[],
  configuredFiles: ReadonlySet<string>,
): { snapshots: Map<string, DictionaryFileSnapshot>; entries: readonly string[] } {
  const next = new Map(snapshots);
  for (const file of updates) {
    if (configuredFiles.has(file.path)) {
      next.set(file.path, file);
    }
  }
  const only = next.size === 1 ? next.values().next().value : undefined;
  const entries =
    only === undefined
      ? sortedEntries([...next.values()].flatMap((file) => file.entries))
      : only.entries;
  return { snapshots: next, entries };
}

function lowerBound(entries: readonly string[], key: string): number {
  let low = 0;
  let high = entries.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    const value = entries[middle];
    if (value !== undefined && searchKey(value) < key) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

export function queryEntries(
  entries: readonly string[],
  prefix: string,
  maxItems?: number,
): string[] {
  if (maxItems !== undefined && maxItems <= 0) {
    return [];
  }
  const key = prefix.toLowerCase();
  const matches: string[] = [];
  for (let index = lowerBound(entries, key); index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry === undefined || !searchKey(entry).startsWith(key)) {
      break;
    }
    matches.push(entry);
    if (maxItems !== undefined && matches.length >= maxItems) {
      break;
    }
  }
  return matches;
}
