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
const workerEntry = pathToFileURL(
  join(repoRoot, "packages", "tsudoi-completion-dictionary", "dist", "worker.js"),
).href;

function probeSource(): string {
  return `
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { useDictionaryCompletion } from ${JSON.stringify(entry)};

const root = process.argv[2];
const dictionary = join(root, "words.txt");
writeFileSync(dictionary, "old-entry\\n");
const complete = await useDictionaryCompletion({
  files: [dictionary],
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
  const answer = await complete(context, params, { minPrefixLength: 0 }).next();
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

function workerFailureProbeSource(): string {
  return `
const root = process.argv[2];
const worker = new Worker(${JSON.stringify(workerEntry)}, { type: "module" });
const result = await new Promise((resolve, reject) => {
  worker.addEventListener("message", (event) => resolve(event.data));
  worker.addEventListener("error", (event) => {
    event.preventDefault();
    reject(event.error ?? new Error(event.message));
  });
  worker.postMessage({ files: [root], versions: [] });
});
process.stdout.write(JSON.stringify(result));
`;
}

for (const runtime of ["bun", "deno"] as const) {
  test(`${runtime} swaps in-memory Worker snapshots`, () => {
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
      const output = JSON.parse(result.stdout) as { during: string[]; after: string[] };
      // The Worker may commit before or after the immediate read. Atomicity,
      // not scheduling, is the cross-runtime contract; the controlled unit test
      // holds a refresh pending when it asserts the old-snapshot case.
      expect([["old-entry"], ["new-entry"]]).toContainEqual(output.during);
      expect(output.after).toEqual(["new-entry"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test("deno reports a Worker-level file failure without an unhandled child error", () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-dictionary-worker-failure-"));
  try {
    const probe = join(root, "probe.mjs");
    writeFileSync(probe, workerFailureProbeSource());
    const result = spawnSync("deno", ["run", "-A", probe, root], {
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.status).toBe(0);
    expect(result.signal).toBeNull();
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      type: "done",
      files: [],
      errors: [{ path: root, message: expect.any(String) }],
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
