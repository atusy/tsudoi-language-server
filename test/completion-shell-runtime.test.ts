import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

const entry = pathToFileURL(
  join(repoRoot, "packages", "tsudoi-completion-shell", "dist", "index.js"),
).href;

function probeSource(): string {
  return `
import { useShellCompletion } from ${JSON.stringify(entry)};

const root = process.argv[2];
const complete = useShellCompletion("fish", {
  cwd: root,
  env: { XDG_CONFIG_HOME: process.argv[3] },
  idleTimeoutMs: 20,
});
const line = "tsudoi-runtime al";
const answer = await complete({
  signal: new AbortController().signal,
  tsudoi: { documents: { get: () => ({ getText: () => line }) } },
}, {
  textDocument: { uri: "file:///buffer.fish" },
  position: { line: 0, character: line.length },
}).next();
process.stdout.write(JSON.stringify(answer.done ? [] : answer.value.map(({ label }) => label)));
`;
}

for (const runtime of ["bun", "deno"] as const) {
  test(`${runtime} loads the built artifact and its fish capture script`, () => {
    const root = mkdtempSync(join(tmpdir(), `tsudoi-shell-runtime-${runtime}-`));
    const configHome = join(root, "config");
    mkdirSync(join(configHome, "fish"), { recursive: true });
    writeFileSync(
      join(configHome, "fish", "config.fish"),
      "complete -c tsudoi-runtime -f -a alpha\ncomplete -c tsudoi-runtime -f -a alpine\n",
    );
    try {
      const probe = join(root, "probe.mjs");
      writeFileSync(probe, probeSource());
      const result = spawnSync(
        runtime,
        runtime === "bun"
          ? [probe, root, configHome]
          : ["run", "-A", probe, root, configHome],
        { encoding: "utf8", timeout: 10_000 },
      );

      expect(result.status).toBe(0);
      expect(result.signal).toBeNull();
      expect(result.stderr).toBe("");
      expect(JSON.parse(result.stdout)).toEqual(["alpha", "alpine"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
