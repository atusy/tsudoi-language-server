import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture, runCli } from "./helpers/spawn.ts";

test("omitting --config exits 1 with a stderr message and no stdout", async () => {
  const result = await runCli([]);

  expect(result.code).toBe(1);
  expect(result.stderr).toContain("--config");
  expect(result.stdout).toBe("");
});

test("a --config path that does not exist exits 1 naming the path, with no stdout", async () => {
  const missing = join(tmpdir(), "tsudoi-does-not-exist.config.ts");

  const result = await runCli(["--config", missing]);

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(missing);
  expect(result.stdout).toBe("");
});

test("a config with a TypeScript syntax error exits 1 naming the path, with no stdout", async () => {
  // Written at runtime, never committed: an unparseable .ts in the repo would
  // break both `oxfmt --check .` and `tsc --noEmit`.
  const dir = mkdtempSync(join(tmpdir(), "tsudoi-"));
  const broken = join(dir, "syntax-error.config.ts");
  writeFileSync(broken, "export default (=> {\n");

  const result = await runCli(["--config", broken]);

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(broken);
  expect(result.stdout).toBe("");
});

test("a config that throws while being imported exits 1 naming the path, with no stdout", async () => {
  const throwing = fixture("throws-on-import.ts");

  const result = await runCli(["--config", throwing]);

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(throwing);
  expect(result.stdout).toBe("");
});
