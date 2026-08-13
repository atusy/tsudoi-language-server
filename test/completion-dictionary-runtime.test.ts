import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

const entry = pathToFileURL(
  join(repoRoot, "packages", "tsudoi-completion-dictionary", "dist", "index.js"),
).href;

function probeSource(): string {
  return `
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { completeDictionaryFactory } from ${JSON.stringify(entry)};

const root = process.argv[2];
const dictionary = join(root, "words.txt");
writeFileSync(dictionary, "old-entry\\n");
const complete = await completeDictionaryFactory({
  files: [dictionary],
  databasePath: join(root, "dictionary.sqlite3"),
  minPrefixLength: 0,
  refreshIntervalMs: 0,
});
const context = {
  signal: new AbortController().signal,
  tsudoi: { documents: { get: () => ({ getText: () => "" }) } },
};
const params = {
  textDocument: { uri: "file:///buffer.txt" },
  position: { line: 0, character: 0 },
};
async function labels() {
  const answer = await complete(context, params).next();
  return answer.done ? [] : answer.value.map((item) => item.label);
}
async function waitFor(expected) {
  const deadline = Date.now() + 5_000;
  let actual = [];
  while (JSON.stringify(actual) !== JSON.stringify(expected) && Date.now() < deadline) {
    actual = await labels();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
  }
}
await waitFor(["old-entry"]);
writeFileSync(dictionary, "new-entry\\n");
const during = await labels();
await waitFor(["new-entry"]);
process.stdout.write(JSON.stringify({ during, after: await labels() }));
`;
}

for (const runtime of ["bun", "deno"] as const) {
  test(`${runtime} loads its native SQLite adapter and swaps Worker snapshots`, () => {
    const root = mkdtempSync(join(tmpdir(), `tsudoi-dictionary-${runtime}-`));
    try {
      const probe = join(root, "probe.mjs");
      writeFileSync(probe, probeSource());
      const result = spawnSync(
        runtime,
        runtime === "bun" ? [probe, root] : ["run", "-A", probe, root],
        {
          encoding: "utf8",
          timeout: 10_000,
        },
      );

      expect(result.status).toBe(0);
      expect(result.signal).toBeNull();
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual({
        during: ["old-entry"],
        after: ["new-entry"],
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
