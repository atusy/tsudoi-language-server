import { describe, expect, test } from "bun:test";
import type { CompletionItem } from "vscode-languageserver-protocol";
import { firstChunk, returnedItems, secondChunk } from "./fixtures/completion-chunks.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";

const completionChunks = fixture("completion-chunks.ts");

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

const uri = "file:///workspace/a.txt";

/**
 * A completion request carrying `partialResultToken` EXACTLY as given, values
 * LSP does not allow included -- which is the whole subject here. `unknown`
 * because the wire can carry any number, where the declared `ProgressToken`
 * describes only what a conforming client sends.
 */
function completionWithToken(token: unknown): unknown {
  return {
    textDocument: { uri },
    position: { line: 0, character: 0 },
    partialResultToken: token,
  };
}

/** The prefix of the one line tsudoi writes about a token it refused. */
const invalidTokenTrace = "tsudoi: ignoring an invalid partialResultToken";

/** Every chunk the fixture yields, flattened -- what AGGREGATION produces. */
const aggregated: CompletionItem[] = [...firstChunk, ...secondChunk, ...returnedItems];

/**
 * The bounds of LSP's `integer`, WRITTEN OUT rather than imported from
 * `vscode-languageserver-protocol`. The source under test derives its check from
 * that package's own constants, so a test importing the same constants would
 * agree with itself whatever they became -- the wire values are pinned here
 * instead, exactly as the -32800 literal is pinned in the cancellation suite.
 */
const minInRange = -2147483648;
const maxInRange = 2147483647;

/**
 * Numbers a JavaScript integer test accepts and LSP does not. `2 ** 40` is far
 * outside rather than adjacent, and the negative arm is here because a bound
 * written with only `<=` would pass every assertion the positive arm makes.
 */
const outOfRange = [maxInRange + 1, 2 ** 40, minInRange - 1];

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * BOTH ARMS IN ONE TEST, AND THE SECOND IS WHAT MAKES THE FIRST MEAN
     * ANYTHING: a validation that refused EVERY number would satisfy the
     * aggregation arm completely, and only the bounds arm can tell that apart
     * from a validation that refuses exactly what LSP does not allow.
     *
     * The bounds are driven at the EXACT edges, not somewhere comfortably
     * inside, because an off-by-one in either direction is the whole failure
     * mode a range check has: `< MAX` rather than `<= MAX` costs a real client
     * its streaming and is invisible against a token of 42.
     */
    test("a partialResultToken outside LSP's integer range aggregates, while the range's own bounds stream", async () => {
      const session = LspSession.start(runtime, completionChunks);
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        // OUT OF RANGE FIRST, while `progressCount` is still 0 for the whole
        // session: streaming under a token the client cannot correlate is the
        // silent misdelivery this normalisation exists to prevent, and a count
        // read before anything legitimate has streamed says so with no
        // arithmetic.
        for (const token of outOfRange) {
          const result = await session.request<CompletionItem[] | null>(
            "textDocument/completion",
            completionWithToken(token),
          );
          expect(result).toEqual(aggregated);
        }
        expect(session.progressCount).toBe(0);
        // Reported, not silent: the config author's items were aggregated
        // rather than streamed, and nothing else would tell them why.
        expect(session.stderr).toContain(`${invalidTokenTrace} ${maxInRange + 1};`);

        for (const token of outOfRange.slice(1)) {
          // Once per SESSION, so the later refusals are silent by design and
          // the trace above is a claim about the first one only.
          expect(session.stderr).not.toContain(`${invalidTokenTrace} ${token};`);
        }

        for (const token of [minInRange, maxInRange]) {
          const before = session.progressCount;
          const result = await session.request<CompletionItem[] | null>(
            "textDocument/completion",
            completionWithToken(token),
          );
          // Under a token every batch leaves as `$/progress` and the response
          // is `null`, so the chunks are asserted FIRST: `null` alone is also
          // what a server that streamed nothing would answer.
          expect(session.progress.slice(before)).toEqual([
            { token, value: firstChunk },
            { token, value: secondChunk },
            { token, value: returnedItems },
          ]);
          expect(result).toBeNull();
        }

        expect(await session.request<null>("shutdown", null)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
