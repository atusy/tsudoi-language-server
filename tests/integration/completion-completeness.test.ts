import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

import { expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CompletionItem, CompletionList } from "@atusy/tsudoi-language-server/deps/protocol";
import { completeAround } from "../../packages/tsudoi-completion-document/src/around.ts";
import { completeCorpus } from "../../packages/tsudoi-completion-document/src/corpus.ts";
import { prefixFilter } from "../../packages/tsudoi-completion-document/src/filters.ts";
import { segmentScanner } from "../../packages/tsudoi-completion-document/src/scanners.ts";
import { fakeDocuments } from "../../packages/tsudoi-completion-document/tests/helpers/documents.ts";
import { makeCompleteDictionary } from "../../packages/tsudoi-completion-dictionary/src/dictionary.ts";
import { dictionaryPrefixFilter } from "../../packages/tsudoi-completion-dictionary/src/filters.ts";
import { completePath } from "../../packages/tsudoi-completion-path/src/completion.ts";
import { makeShellCompletion } from "../../packages/tsudoi-completion-shell/src/shell.ts";

async function collect(
  iterator: AsyncGenerator<CompletionItem[], CompletionList | CompletionItem[] | null | void, void>,
) {
  const items: CompletionItem[] = [];
  for (;;) {
    const next = await iterator.next();
    if (next.done) return { items, result: next.value };
    items.push(...next.value);
  }
}

const uri = "file:///buffer.txt";
const params = { textDocument: { uri }, position: { line: 1, character: 2 } };

for (const complete of [completeAround, completeCorpus]) {
  test.each([
    [undefined, false, ["alpha", "alpine"]],
    [1, true, ["alpha"]],
    [2, false, ["alpha", "alpine"]],
    [3, false, ["alpha", "alpine"]],
    [0, false, []],
    [Number.MAX_SAFE_INTEGER, false, ["alpha", "alpine"]],
  ] as const)(
    `${complete.name}: bound %p distinguishes truncation from an exact fit`,
    async (maxItems, isIncomplete, labels) => {
      const documents = fakeDocuments();
      documents.open(uri, "alpha alpha alpine beta\nal");
      const answer = await collect(complete(documents.context, params, { maxItems }));
      expect(answer.items.map(({ label }) => label)).toEqual([...labels]);
      expect(answer.result).toEqual({ isIncomplete, items: [] });
    },
  );

  test(`${complete.name}: query gate is incomplete but exhausted prefix search is complete`, async () => {
    const documents = fakeDocuments();
    documents.open(uri, "alpha\nzz");
    expect(
      (await collect(complete(documents.context, params, { minQueryLength: 3 }))).result,
    ).toEqual({ isIncomplete: true, items: [] });
    expect((await collect(complete(documents.context, params))).result).toEqual({
      isIncomplete: false,
      items: [],
    });
  });

  test(`${complete.name}: only known filters and the default scanner establish completeness`, async () => {
    const documents = fakeDocuments();
    documents.open(uri, "alpha\nal");
    for (const filters of [[], [prefixFilter]]) {
      expect((await collect(complete(documents.context, params, { filters }))).result).toEqual({
        isIncomplete: false,
        items: [],
      });
    }
    for (const options of [
      { filters: [(words: Iterable<string>) => words] },
      { scanner: segmentScanner("ja") },
    ]) {
      expect((await collect(complete(documents.context, params, options))).result).toEqual({
        isIncomplete: true,
        items: [],
      });
    }
  });
}

test.each([0, 1, 2, 3])(
  "dictionary: bound %i detects truncation in the indexed prefix search",
  async (maxItems) => {
    const path = "/dictionary.txt";
    const handler = await makeCompleteDictionary(
      { files: [path] },
      {
        refresh: () =>
          Promise.resolve({
            files: [{ path, contentHash: "hash", entries: ["alpha", "alpine", "beta"] }],
            errors: [],
          }),
      },
    );
    const documents = fakeDocuments();
    documents.open(uri, "al");
    const answer = await collect(
      handler(documents.context, { ...params, position: { line: 0, character: 2 } }, { maxItems }),
    );
    expect(answer.items.map(({ label }) => label)).toEqual(["alpha", "alpine"].slice(0, maxItems));
    expect(answer.result).toEqual({ isIncomplete: maxItems === 1, items: [] });
    if (maxItems === 1) {
      documents.change(uri, "alpi", 2);
      const narrowed = await collect(
        handler(
          documents.context,
          { ...params, position: { line: 0, character: 4 } },
          { maxItems },
        ),
      );
      expect(narrowed.items.map(({ label }) => label)).toEqual(["alpine"]);
      expect(narrowed.result).toEqual({ isIncomplete: false, items: [] });
    }
  },
);

test.each(
  [[], [dictionaryPrefixFilter], [(words: Iterable<string>) => words]].map((filters) => ({
    filters,
  })),
)(
  "dictionary: filters %p determine whether future queries can reveal new candidates",
  async ({ filters }) => {
    const path = "/dictionary.txt";
    const handler = await makeCompleteDictionary(
      { files: [path], filters },
      {
        refresh: () =>
          Promise.resolve({
            files: [{ path, contentHash: "hash", entries: ["alpha"] }],
            errors: [],
          }),
      },
    );
    const documents = fakeDocuments();
    documents.open(uri, "al");
    const answer = await collect(
      handler(documents.context, { ...params, position: { line: 0, character: 2 } }),
    );
    expect(answer.result).toEqual({
      isIncomplete: filters.some((filter) => filter !== dictionaryPrefixFilter),
      items: [],
    });
  },
);

test("dictionary: gated empty answer requests another query", async () => {
  const handler = await makeCompleteDictionary(
    { files: [] },
    {
      refresh: () => Promise.resolve({ files: [], errors: [] }),
    },
  );
  const documents = fakeDocuments();
  documents.open(uri, "a");
  expect(
    (await collect(handler(documents.context, { ...params, position: { line: 0, character: 1 } })))
      .result,
  ).toEqual({ isIncomplete: true, items: [] });
  documents.change(uri, "zz", 2);
  expect(
    (await collect(handler(documents.context, { ...params, position: { line: 0, character: 2 } })))
      .result,
  ).toEqual({ isIncomplete: false, items: [] });
});

test("path: directory transitions and empty queries retain incomplete metadata", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-incomplete-"));
  try {
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "index.ts"), "");
    const documentUri = pathToFileURL(join(root, "buffer.txt")).href;
    const documents = fakeDocuments();
    for (const text of ["s", "src/", "missing", ""]) {
      documents.open(documentUri, text);
      const answer = await collect(
        completePath(
          documents.context,
          {
            textDocument: { uri: documentUri },
            position: { line: 0, character: text.length },
          },
          { cwd: root },
        ),
      );
      expect(answer.result).toEqual({ isIncomplete: true, items: [] });
      if (text === "src/") expect(answer.items.map(({ label }) => label)).toContain("index.ts");
    }
    documents.close(documentUri);
    expect(
      (
        await collect(
          completePath(documents.context, {
            textDocument: { uri: documentUri },
            position: { line: 0, character: 0 },
          }),
        )
      ).result,
    ).toBeUndefined();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test.each([[], ["alpha"]].map((candidates) => ({ candidates })))(
  "shell: native answer %p remains incomplete",
  async ({ candidates }) => {
    const handler = makeShellCompletion(
      "fish",
      {},
      { complete: () => Promise.resolve(candidates) },
    );
    const documents = fakeDocuments();
    documents.open(uri, "a");
    expect(
      (
        await collect(
          handler(documents.context, { ...params, position: { line: 0, character: 1 } }),
        )
      ).result,
    ).toEqual({ isIncomplete: true, items: [] });
  },
);
