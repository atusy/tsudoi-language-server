import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  makeCompleteDictionary,
  type DictionaryCompletionOptions,
  type DictionaryFilter,
  type RefreshRuntime,
} from "../src/dictionary.ts";

const noChanges = { files: [], errors: [] } as const;

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture(contents: string): { root: string; path: string } {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-handler-"));
  roots.push(root);
  const path = join(root, "words.txt");
  writeFileSync(path, contents);
  return { root, path };
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
  options?: DictionaryCompletionOptions,
): Promise<string[]> {
  const { context, params } = request(prefix);
  const answer = await handler(context, params, options).next();
  return answer.done === true ? [] : answer.value.map((item) => item.label);
}

test("completion publishes the immutable snapshot returned by a refresh", async () => {
  const { path } = fixture("alpha\nbeta\n");
  const runtime = {
    refresh: () =>
      Promise.resolve({
        files: [{ path, contentHash: "hash", entries: ["alpha", "beta"] }],
        errors: [],
      }),
  } satisfies RefreshRuntime;
  const handler = await makeCompleteDictionary({ files: [path], refreshIntervalMs: 0 }, runtime);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  expect(await labels(handler, "al")).toEqual(["alpha"]);
});

test("completion reads the published snapshot without waiting for refresh", async () => {
  const { path } = fixture("old-entry\n");
  const pending = Promise.withResolvers<typeof noChanges>();
  let refreshCount = 0;
  const runtime: RefreshRuntime = {
    refresh: () => {
      refreshCount += 1;
      return refreshCount === 1
        ? Promise.resolve({
            files: [{ path, contentHash: "old", entries: ["old-entry"] }],
            errors: [],
          })
        : pending.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], minPrefixLength: 0, refreshIntervalMs: 0 },
    runtime,
  );

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(await labels(handler, "")).toEqual(["old-entry"]);
  pending.resolve(noChanges);
});

test("the real worker eventually publishes the file without blocking factory creation", async () => {
  const { root, path } = fixture("alpha\nalpine\nbeta\n");
  const handler = await makeCompleteDictionary({
    files: [path],
    refreshIntervalMs: 0,
  });

  const deadline = Date.now() + 5_000;
  let actual: string[] = [];
  while (actual.length === 0 && Date.now() < deadline) {
    actual = await labels(handler, "al");
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  expect(actual).toEqual(["alpha", "alpine"]);
  expect(readdirSync(root)).toEqual(["words.txt"]);
});

test("custom filters run before the per-request candidate bound", async () => {
  const { path } = fixture("alpha\nbeta\ngamma\nzeta\n");
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
      filters: [suffixFilter],
      minPrefixLength: 0,
    },
    {
      refresh: () =>
        Promise.resolve({
          files: [
            {
              path,
              contentHash: "hash",
              entries: ["alpha", "beta", "gamma", "zeta"],
            },
          ],
          errors: [],
        }),
    },
  );

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(await labels(handler, "anything", { maxItems: 1 })).toEqual(["beta"]);
});

test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, null])(
  "per-request candidate counts reject invalid bounds",
  async (maxItems) => {
    const { path } = fixture("alpha\n");
    const handler = await makeCompleteDictionary(
      { files: [path] },
      { refresh: () => new Promise<never>(() => {}) },
    );
    const { context, params } = request("al");

    expect(handler(context, params, { maxItems: maxItems as number }).next()).rejects.toThrow(
      "maxItems must be a non-negative safe integer",
    );
  },
);

test("a zero per-request bound does no refresh or filtering work", async () => {
  const { path } = fixture("alpha\n");
  let refreshes = 0;
  let filtered = false;
  const runtime: RefreshRuntime = {
    refresh: () => {
      refreshes += 1;
      return Promise.resolve({
        files: [{ path, contentHash: "hash", entries: ["alpha"] }],
        errors: [],
      });
    },
  };
  const handler = await makeCompleteDictionary(
    {
      files: [path],
      filters: [
        function* (words) {
          filtered = true;
          yield* words;
        },
      ],
      minPrefixLength: 0,
      refreshIntervalMs: 0,
    },
    runtime,
  );
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  const refreshesBeforeRequest = refreshes;

  expect(await labels(handler, "", { maxItems: 0 })).toEqual([]);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  expect(refreshes).toBe(refreshesBeforeRequest);
  expect(filtered).toBe(false);
});

test("an invalid per-request bound does not request a refresh", async () => {
  const { path } = fixture("alpha\n");
  let refreshes = 0;
  const runtime: RefreshRuntime = {
    refresh: () => {
      refreshes += 1;
      return Promise.resolve(noChanges);
    },
  };
  const handler = await makeCompleteDictionary({ files: [path], refreshIntervalMs: 0 }, runtime);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  const refreshesBeforeRequest = refreshes;
  const { context, params } = request("alpha");

  expect(handler(context, params, { maxItems: 1.5 }).next()).rejects.toThrow("maxItems");
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  expect(refreshes).toBe(refreshesBeforeRequest);
});

test("an onError callback that throws creates no unhandled background rejection", async () => {
  const { path } = fixture("alpha\n");
  const observed = Promise.withResolvers<void>();
  const runtime: RefreshRuntime = {
    refresh: () => Promise.reject(new Error("index failed")),
  };
  await makeCompleteDictionary(
    {
      files: [path],
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
  const { path } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<typeof noChanges>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<typeof noChanges>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], minPrefixLength: 0, refreshIntervalMs: 0 },
    runtime,
  );
  expect(refreshes).toHaveLength(1);

  await labels(handler, "");
  await labels(handler, "");
  await labels(handler, "");
  expect(refreshes).toHaveLength(1);

  refreshes[0]?.resolve(noChanges);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(refreshes).toHaveLength(2);
  refreshes[1]?.resolve(noChanges);
});

test("a queued follow-up respects the refresh interval", async () => {
  const { path } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<typeof noChanges>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<typeof noChanges>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], minPrefixLength: 0, refreshIntervalMs: 50 },
    runtime,
  );

  await labels(handler, "");
  refreshes[0]?.resolve(noChanges);
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(1);

  await new Promise<void>((resolve) => setTimeout(resolve, 60));
  expect(refreshes).toHaveLength(2);
  await labels(handler, "");
  refreshes[1]?.resolve(noChanges);
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(2);
  await new Promise<void>((resolve) => setTimeout(resolve, 60));
  expect(refreshes).toHaveLength(3);
  refreshes[2]?.resolve(noChanges);
});

test("a slow refresh still waits an interval after it settles", async () => {
  const { path } = fixture("alpha\n");
  const refreshes: Array<ReturnType<typeof Promise.withResolvers<typeof noChanges>>> = [];
  const runtime: RefreshRuntime = {
    refresh: () => {
      const refresh = Promise.withResolvers<typeof noChanges>();
      refreshes.push(refresh);
      return refresh.promise;
    },
  };
  const handler = await makeCompleteDictionary(
    { files: [path], minPrefixLength: 0, refreshIntervalMs: 30 },
    runtime,
  );

  await labels(handler, "");
  await new Promise<void>((resolve) => setTimeout(resolve, 40));
  refreshes[0]?.resolve(noChanges);
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  expect(refreshes).toHaveLength(1);
  await new Promise<void>((resolve) => setTimeout(resolve, 30));
  expect(refreshes).toHaveLength(2);
  refreshes[1]?.resolve(noChanges);
});
