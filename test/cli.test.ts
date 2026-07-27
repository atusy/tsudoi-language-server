import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bunRuntime, denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture, runCli } from "./helpers/spawn.ts";

const runtimes = [bunRuntime, denoRuntime];

// The failure contract is claimed for both runtimes, so an absent one fails
// this file rather than quietly halving what it checks.
await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("omitting --config exits 1 with a stderr message and no stdout", async () => {
      const result = await runCli(runtime, []);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("--config");
      expect(result.stdout).toBe("");
    });

    test("a --config path that does not exist exits 1 naming the path, with no stdout", async () => {
      const missing = join(tmpdir(), "tsudoi-does-not-exist.config.ts");

      const result = await runCli(runtime, ["--config", missing]);

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

      const result = await runCli(runtime, ["--config", broken]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(broken);
      expect(result.stdout).toBe("");
    });

    test("a config that throws while being imported exits 1 naming the path, with no stdout", async () => {
      const throwing = fixture("throws-on-import.ts");

      const result = await runCli(runtime, ["--config", throwing]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(throwing);
      expect(result.stdout).toBe("");
    });

    test("a config with no default export exits 1 saying so, with no stdout", async () => {
      const path = fixture("no-default-export.ts");

      const result = await runCli(runtime, ["--config", path]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("no default export");
      expect(result.stdout).toBe("");
    });

    test("a config whose default export is not a function exits 1 saying so, with no stdout", async () => {
      const path = fixture("default-not-a-function.ts");

      const result = await runCli(runtime, ["--config", path]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("not a function");
      expect(result.stdout).toBe("");
    });

    test("a config whose factory rejects exits 1 reporting the reason, with no stdout", async () => {
      const path = fixture("factory-rejects.ts");

      const result = await runCli(runtime, ["--config", path]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("the factory rejects");
      expect(result.stdout).toBe("");
    });
  });
}
