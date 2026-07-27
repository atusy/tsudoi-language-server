import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { japaneseFailure } from "./fixtures/factory-rejects-japanese.ts";
import { bunRuntime, denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { type CliResult, fixture, runCli } from "./helpers/spawn.ts";

const runtimes = [bunRuntime, denoRuntime];

// The failure contract is claimed for both runtimes, so an absent one fails
// this file rather than quietly halving what it checks.
await Promise.all(runtimes.map(requireRuntime));

/**
 * THE FAILURE CONTRACT, one assertion for every case: exit 1, a tsudoi:-
 * prefixed reason on stderr, and nothing at all on stdout.
 *
 * The PREFIX half was named by three sprints of criteria and pinned by
 * NOTHING. Measured before writing this: deleting `tsudoi: ` from src/cli.ts
 * left every ASCII case green, because each asserted only the substring it
 * cared about. It is the one thing here a config author greps for -- every
 * line tsudoi writes carries it, and a message without it is indistinguishable
 * from whatever the runtime printed.
 *
 * STARTS WITH rather than contains, measured across all seven cases under both
 * runtimes: the reason is the FIRST thing on stderr, so nothing the config
 * author did not ask for precedes it.
 */
function expectFailureContract(result: CliResult): void {
  expect(result.code).toBe(1);
  expect(result.stderr.startsWith("tsudoi: ")).toBe(true);
  expect(result.stdout).toBe("");
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    test("omitting --config exits 1 with a stderr message and no stdout", async () => {
      const result = await runCli(runtime, []);

      expectFailureContract(result);
      expect(result.stderr).toContain("--config");
      // THE PAIR for the Japanese case's `stderrPerChunk differs`, permanent
      // and carried here because this message is short and ASCII: the same
      // measurement observes AGREEMENT when nothing was split. Without it, a
      // per-chunk accumulator that quietly stopped collecting would satisfy
      // `the two decodings differ` and take the straddle precondition with it.
      expect(result.stderrPerChunk).toBe(result.stderr);
    });

    test("a --config path that does not exist exits 1 naming the path, with no stdout", async () => {
      const missing = join(tmpdir(), "tsudoi-does-not-exist.config.ts");

      const result = await runCli(runtime, ["--config", missing]);

      expectFailureContract(result);
      expect(result.stderr).toContain(missing);
    });

    test("a config with a TypeScript syntax error exits 1 naming the path, with no stdout", async () => {
      // Written at runtime, never committed: an unparseable .ts in the repo would
      // break both `oxfmt --check .` and `tsc --noEmit`.
      const dir = mkdtempSync(join(tmpdir(), "tsudoi-"));
      const broken = join(dir, "syntax-error.config.ts");
      writeFileSync(broken, "export default (=> {\n");

      const result = await runCli(runtime, ["--config", broken]);

      expectFailureContract(result);
      expect(result.stderr).toContain(broken);
    });

    test("a config that throws while being imported exits 1 naming the path, with no stdout", async () => {
      const throwing = fixture("throws-on-import.ts");

      const result = await runCli(runtime, ["--config", throwing]);

      expectFailureContract(result);
      expect(result.stderr).toContain(throwing);
    });

    test("a config with no default export exits 1 saying so, with no stdout", async () => {
      const path = fixture("no-default-export.ts");

      const result = await runCli(runtime, ["--config", path]);

      expectFailureContract(result);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("no default export");
    });

    test("a config whose default export is not a function exits 1 saying so, with no stdout", async () => {
      const path = fixture("default-not-a-function.ts");

      const result = await runCli(runtime, ["--config", path]);

      expectFailureContract(result);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("not a function");
    });

    test("a config whose factory rejects exits 1 reporting the reason, with no stdout", async () => {
      const path = fixture("factory-rejects.ts");

      const result = await runCli(runtime, ["--config", path]);

      expectFailureContract(result);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("the factory rejects");
    });

    // The eighth case, and the one the other seven cannot make: every message
    // above is ASCII, so a reader that decodes each pipe chunk on its own gets
    // them all right. EXACT EQUALITY over the whole stream, not toContain: a
    // decode that mangles a split character produces U+FFFD in the middle of a
    // message that still contains every substring one might think to look for.
    test("a config failure message in Japanese survives the pipe byte-exact", async () => {
      const path = fixture("factory-rejects-japanese.ts");

      const result = await runCli(runtime, ["--config", path]);

      expectFailureContract(result);
      expect(result.stderr).toBe(
        `tsudoi: the config factory in ${path} failed\n  Error: ${japaneseFailure}\n`,
      );
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
