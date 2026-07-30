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
 * STARTS WITH rather than contains, measured under both runtimes on EVERY case
 * in this file: the reason is the FIRST thing on stderr, so nothing the config
 * author did not ask for precedes it.
 *
 * `EVERY CASE IN THIS FILE` RATHER THAN A NUMBER, corrected at Sprint 34 when a
 * case was added and `all seven` silently became false. A count of a growing
 * file falsifies itself with nothing to show for it; every case calls this
 * helper, so the scope is legible from the helper's call sites.
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

    /**
     * WHAT THE FACTORY RETURNED, refused before anything dereferences it.
     *
     * THREE ARMS AND NOT ONE, because they failed in three different ways and
     * any one of them alone leaves the other two green:
     *
     * `() => {}` -- the arrow whose braces are a BODY -- reached
     * requireCompletionBesideResolve and raised a TYPEERROR. A TypeError is not
     * a ConfigError, so src/cli.ts RETHROWS it: the author got a raw stack, and
     * the `tsudoi: ` prefix that `expectFailureContract` asserts for every other
     * case in this file was simply absent.
     *
     * `Promise.resolve(null)` is the arm a guard written `typeof returned !==
     * "object"` still admits, since `typeof null` is `"object"`.
     *
     * `() => 5` IS THE ONE WORTH THE FIXTURE. It broke NO assertion: a number
     * has no `methods` to read, so nothing threw, loadConfig SUCCEEDED, and the
     * server started advertising no capability at all. This test is the only
     * thing standing between a config author and a server that answers every
     * request with silence -- and it is why the arms are asserted for exit 1
     * rather than merely for a good message.
     *
     * WHAT ARRIVED IS NAMED, not just that something was wrong: `undefined` and
     * `null` and `number` are three different mistakes with three different
     * fixes, and a message saying only `invalid config` sends all three authors
     * to the same wrong place.
     */
    for (const [name, arrival] of [
      ["factory-returns-nothing.ts", "undefined"],
      ["factory-returns-null.ts", "null"],
      ["factory-returns-primitive.ts", "number"],
    ] as const) {
      test(`a factory returning ${arrival} exits 1 naming the path and what arrived, with no stdout`, async () => {
        const path = fixture(name);

        const result = await runCli(runtime, ["--config", path]);

        expectFailureContract(result);
        expect(result.stderr).toContain(path);
        expect(result.stderr).toContain(`returned ${arrival}`);
      });
    }

    /**
     * THE ONE CASE THAT IS NOT ABOUT REACHING THE CONFIG AT ALL: this file
     * loads, exports a factory, and the factory returns -- and what it returned
     * is REFUSED. Every case above fails on the way to the config author's
     * object; this one inspects the object itself.
     *
     * IT BELONGS HERE RATHER THAN IN test/resolve.test.ts because what it
     * asserts is the FAILURE CONTRACT -- exit 1, `tsudoi: ` first on stderr,
     * ZERO BYTES ON STDOUT -- and stdout purity is what makes rejecting at
     * config load cost nothing: this runs before startServer, so no protocol
     * byte has been written when it fires.
     *
     * BOTH METHOD NAMES ARE ASSERTED, because a message naming only the one the
     * author wrote would tell them they are wrong without telling them what to
     * add.
     */
    test("a config resolving completion items it cannot produce exits 1 naming both methods, with no stdout", async () => {
      const path = fixture("resolve-without-completion.ts");

      const result = await runCli(runtime, ["--config", path]);

      expectFailureContract(result);
      expect(result.stderr).toContain(path);
      expect(result.stderr).toContain("completionItem/resolve");
      expect(result.stderr).toContain("textDocument/completion");
    });

    // THE CASE NO OTHER ONE HERE CAN MAKE: every message above is ASCII, so a
    // reader that decodes each pipe chunk on its own gets them all right.
    // (It read `the eighth case, and the one the other seven cannot make` until
    // Sprint 34 added one above it -- the count was load-bearing for nothing and
    // false the moment the file grew.)
    // EXACT EQUALITY over the whole stream, not toContain: a
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
