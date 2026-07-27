import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { japaneseFailure } from "./fixtures/factory-rejects-japanese.ts";
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

    // The eighth case, and the one the other seven cannot make: every message
    // above is ASCII, so a reader that decodes each pipe chunk on its own gets
    // them all right. EXACT EQUALITY over the whole stream, not toContain: a
    // decode that mangles a split character produces U+FFFD in the middle of a
    // message that still contains every substring one might think to look for.
    test("a config failure message in Japanese survives the pipe byte-exact", async () => {
      const path = fixture("factory-rejects-japanese.ts");

      const result = await runCli(runtime, ["--config", path]);

      expect(result.code).toBe(1);
      expect(result.stderr).toBe(
        `tsudoi: the config factory in ${path} failed\n  Error: ${japaneseFailure}\n`,
      );
      expect(result.stdout).toBe("");
      // The equality above is only evidence if a character REALLY WAS split
      // across two chunks on this run, and that was MEASURED to vary: at 360KB
      // the same payload straddled under bun every time and under deno most
      // times, so a test that merely hoped would have been intermittently
      // vacuous rather than wrong. This says the run just performed was the
      // hard case -- decoding these very chunks one at a time would have
      // produced something else -- and it fails loudly if the payload is ever
      // shrunk below a pipe chunk.
      expect(result.stderrPerChunk).not.toBe(result.stderr);
    });
  });
}
