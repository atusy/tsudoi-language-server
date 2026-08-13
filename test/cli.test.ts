import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { japaneseFailure } from "./fixtures/factory-rejects-japanese.ts";
import { getterFailure } from "./fixtures/handler-getter-throws.ts";
import { initializeGetterFailure } from "./fixtures/initialize-getter-throws.ts";
import { bunRuntime, denoRuntime } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { type CliResult, fixture, runCli } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];

// The failure contract is claimed for both runtimes, so an absent one fails
// this file rather than quietly halving what it checks.
await Promise.all(runtimes.map(requireRuntime));

/**
 * THE FAILURE CONTRACT, one assertion for every case: exit 1, a tsudoi:-
 * prefixed reason on stderr, and nothing at all on stdout.
 *
 * The PREFIX half is named by criteria all over this project and PINNED HERE
 * ALONE. MEASURED: deleting `tsudoi: ` from
 * packages/tsudoi-language-server/src/cli.ts leaves every ASCII case green
 * without this assertion, because each asserts only the substring it cares
 * about. It is the one thing here a config author greps for -- every line
 * tsudoi writes carries it, and a message without it is indistinguishable from
 * whatever the runtime printed.
 *
 * STARTS WITH rather than contains, measured under both runtimes on EVERY case
 * in this file: the reason is the FIRST thing on stderr, so nothing the config
 * author did not ask for precedes it.
 *
 * `EVERY CASE IN THIS FILE` RATHER THAN A NUMBER: a count of a growing file
 * falsifies itself with nothing to show for it, where every case calls this
 * helper, so the scope stays legible from the helper's call sites.
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
     * a ConfigError, so packages/tsudoi-language-server/src/cli.ts RETHROWS it:
     * the author got a raw stack, and the `tsudoi: ` prefix that
     * `expectFailureContract` asserts for every other case in this file was
     * simply absent.
     *
     * `Promise.resolve(null)` is the arm a guard written `typeof returned !==
     * "object"` still admits, since `typeof null` is `"object"`.
     *
     * `() => 5` IS THE ONE WORTH THE FIXTURE. It broke NO assertion: a number
     * has no `methods` to read, so nothing threw, loadConfig SUCCEEDED, and the
     * server started advertising no capability at all. This test is what stands
     * between a config author and a server that answers every request with
     * silence -- and it is why the arms are asserted for exit 1 rather than
     * merely for a good message.
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
     * WHAT `methods` HOLDS, read and refused AT LOAD -- one level inside the
     * arms above, and refused for the same reason they are.
     *
     * THREE ARMS AND NOT ONE, because they fail in three different ways:
     *
     * `{ methods: 5 }` IS `() => 5` ONE LEVEL IN. Nothing dereferences a
     * primitive -- `contributeCapabilities` asks `config.methods?.[method] !==
     * undefined`, and a method name read off `5` is `undefined` -- so the server
     * came up advertising no capability at all.
     *
     * A NON-FUNCTION HANDLER IS WORSE THAN INERT. That same read claims a
     * capability on `!== undefined`, so tsudoi ADVERTISED hoverProvider and then
     * answered -32603 to every hover the client was thereby entitled to send.
     *
     * THE GETTER IS THE SHARP ONE AND IT BROKE NOTHING. It type-checks, and the
     * first thing to read it was capability assembly INSIDE the `initialize`
     * handler -- which runs after the lifecycle has already moved to `serving`.
     * The handshake was answered -32603 with ZERO BYTES on stderr, and the
     * session then treated every later request as initialized out of a handshake
     * that had failed. MEASURED with the guard reverted: exit 0, the same silent
     * success `() => 5` produced, which is why this arm asserts exit 1 rather
     * than merely a good message.
     *
     * THE THIRD ARM ASSERTS THE AUTHOR'S OWN WORDS, not just that something
     * failed: what a lazily-built handler threw is what locates the line in
     * their file.
     *
     * REJECTED RATHER THAN DIAGNOSED, for all three, on the ground this whole
     * file asserts: config load runs before startServer, so refusing here costs
     * NOTHING -- no protocol byte has been written -- while a warning leaves the
     * author with the broken server they would have had anyway.
     */
    for (const [name, expected] of [
      ["methods-not-an-object.ts", ["methods", "number"]],
      // `advertises a capability` IS ON THIS ROW ALONE, and it is the ANCHOR for
      // the negative one loop down: that absence is live only while some message
      // is known to CARRY the phrase, and without this a reword of src/config.ts
      // makes it permanently vacuous with nothing reddening anywhere. Per-row and
      // not loop-wide -- `handler-getter-throws.ts` fails inside `readOrRefuse`
      // and carries no such clause.
      ["handler-not-a-function.ts", ["textDocument/hover", "number", "advertises a capability"]],
      ["handler-getter-throws.ts", ["textDocument/hover", getterFailure]],
    ] as const) {
      test(`${name} exits 1 naming the path and what is wrong, with no stdout`, async () => {
        const path = fixture(name);

        const result = await runCli(runtime, ["--config", path]);

        expectFailureContract(result);
        expect(result.stderr).toContain(path);
        for (const fragment of expected) {
          expect(result.stderr).toContain(fragment);
        }
      });
    }

    /**
     * `methods.initialize` IS REFUSED THE SAME WAY AND FOR A DIFFERENT REASON,
     * which is the whole of why it is a loop of its own rather than two more rows
     * above. The keys up there are refused because tsudoi ADVERTISES a capability
     * for each key the config declares; this key contributes none, so that
     * sentence is false of it. What it costs instead is THE HANDSHAKE -- tsudoi
     * answers `initialize` with whatever this handler returns -- and the negative
     * assertion below is what keeps the two messages from being merged into one
     * that is wrong for whichever key it was not written for.
     *
     * BEFORE THIS THE FAILURE HAD NO COLOUR ANYWHERE: `validatedMethods` builds a
     * fresh object out of `Object.keys(requestEntries)`, so a key of
     * `config.methods` that is not a row of that table was copied nowhere and
     * refused nowhere -- the handler loaded without complaint and never ran.
     *
     * THE GETTER TWIN IS WHAT SAYS THE READ GOES THROUGH `readOrRefuse`: with a
     * bare property access the author's own Error leaves loadConfig as something
     * src/cli.ts rethrows, so the failure contract is lost rather than the
     * message.
     */
    // NEITHER FRAGMENT IS THE BARE KEY NAME, AND THAT IS THE WHOLE OF WHY THEY
    // ARE SPELLED THIS WAY. Both fixture paths END in `initialize-*.ts` and the
    // assertion below already reads the path out of stderr, so `"initialize"`
    // ALONE could not fail: a message that stopped naming the key entirely stayed
    // green. The contrast that proves it is one loop up, where
    // `"textDocument/hover"` appears nowhere in `handler-not-a-function.ts` and
    // the identical construction IS load-bearing.
    for (const [name, expected] of [
      ["initialize-not-a-function.ts", ["initialize instead of a function", "number"]],
      ["initialize-getter-throws.ts", ["reading initialize from config", initializeGetterFailure]],
    ] as const) {
      test(`${name} exits 1 naming the path and what is wrong, with no stdout`, async () => {
        const path = fixture(name);

        const result = await runCli(runtime, ["--config", path]);

        expectFailureContract(result);
        expect(result.stderr).toContain(path);
        for (const fragment of expected) {
          expect(result.stderr).toContain(fragment);
        }
        expect(result.stderr).not.toContain("advertises a capability");
      });
    }

    /**
     * `customMethods` IS READ AND REFUSED IN A BLOCK OF ITS OWN, and these are its
     * arms. WHY IT CANNOT JOIN THE LOOP TWO UP: those keys are refused because
     * tsudoi ADVERTISES a capability for each, and a custom method advertises
     * nothing at all -- no `initialize` has a capability to claim for
     * `textDocument/didFocus`, so no client sends one unless it already knew to.
     *
     * TWO ARMS AND TWO DIFFERENT FIXES, which is why they are rows rather than
     * one `invalid customMethods` -- and there are two rather than four because a
     * handler declaring a KIND and a GATE was what sprint 96 was cancelled for:
     * a bare function has neither to get wrong, so those refusals have no subject
     * left to refuse.
     *
     * THE COLLISION IS THE ONE WITH A GOOD HANDLER IN IT. Nothing about that
     * handler is malformed; the NAME is not the author's to take, because upstream
     * registers by MAP SET rather than by chaining, so whichever registration ran
     * second would silently evict the other. `methods` IS NAMED IN THE MESSAGE
     * and asserted here: an author told only that they are wrong is not told
     * where the handler goes.
     *
     * THE UNCALLABLE HANDLER IS THE ARM THE COMPILER ALREADY COVERS, kept because
     * src/config.ts reaches an author's config through a CAST FROM `unknown`:
     * nothing type-checks a config that was never annotated, so this is the only
     * refusal an unannotated author ever receives.
     */
    for (const [name, expected] of [
      ["custom-method-collides.ts", ["textDocument/hover", "customMethods", "methods"]],
      ["custom-method-exit.ts", ["exit", "customMethods", "terminates"]],
      ["custom-method-shutdown.ts", ["shutdown", "customMethods", "lifecycle"]],
      ["custom-method-not-a-function.ts", ["textDocument/didFocus", "number", "function"]],
    ] as const) {
      test(`${name} exits 1 naming the method and the rule, with no stdout`, async () => {
        const path = fixture(name);

        const result = await runCli(runtime, ["--config", path]);

        expectFailureContract(result);
        expect(result.stderr).toContain(path);
        for (const fragment of expected) {
          expect(result.stderr).toContain(fragment);
        }
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
