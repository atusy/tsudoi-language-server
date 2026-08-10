import { describe, expect, test } from "bun:test";
import { requestEntries } from "../packages/tsudoi-language-server/src/methods.ts";
import type { CompletionItem } from "vscode-languageserver-protocol";
import { firstChunk, returnedItems, secondChunk } from "./fixtures/completion-chunks.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession, noParams } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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
          // Once per METHOD per session, so the later refusals are silent by
          // design and the trace above is a claim about the first one only.
          // Every refusal in this arm is a completion's; that the count is per
          // METHOD rather than per session is the arm at the end of this file.
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

        expect(await session.request<null>("shutdown", noParams)).toBeNull();
        session.notify("exit", null);
        expect(await session.waitForExit()).toBe(0);
        expect(session.unframedStdoutBytes).toBe(0);
      } finally {
        session.dispose();
      }
    });

    /**
     * ONE SESSION, EVERY STREAM-DRIVEN ROW, AND THE DIAGNOSTIC BELONGS TO
     * WHICHEVER ROW EARNED IT. This is the arm the sprint that made a SECOND
     * stream-driven row owed and did not write: both defects it guards shipped,
     * were found by review rather than by anything here, and the suite was green
     * across both.
     *
     * WHAT IT REFUSES, AND NEITHER IS VISIBLE FROM ONE ROW ALONE. A single
     * session-wide flag: the first refusal silences the OTHER rows for the rest
     * of the session, so an author who saw the line for completion never learns
     * their code actions were aggregated too. And a hard-coded method in the
     * sentence: tsudoi refuses the token and writes to stderr, which is the
     * CONFIG AUTHOR's channel and not the client's, so the line then tells the
     * author that a COMPLETION was aggregated when it was their code action.
     *
     * THE ROWS ARE DERIVED FROM THE TABLE AND NEVER NAMED HERE, which is what
     * keeps the claim honest as the table grows: a third stream-driven row joins
     * this arm the moment it is declared, where a written pair would leave the
     * arm green and its own name false. It is also why ONE params object serves
     * them all -- nothing on this route reads params past `typeof params ===
     * "object"`, and the token is read off whatever arrives.
     *
     * THE SECOND REQUEST PER ROW IS WHAT KEEPS `once per method` FROM MEANING
     * `once per request`: without it, a tsudoi that reported EVERY refusal
     * satisfies every assertion below.
     */
    // THE ONLY ARM IN THIS FILE WHOSE NAME CARRIES ITS RUNTIME, and the reason
    // is that it is the only one the perturbation registry points at. bun's
    // report keys an arm by its `test()` string alone -- the `describe` goes to
    // `classname` -- so two runtimes sharing a name collapse to one result and a
    // record would grade whichever was written last. What stands above it here
    // is graded by no record, so the collapse costs it nothing.
    test(`a refused token is reported once for each stream-driven row, naming that row (${runtime.name})`, async () => {
      const session = LspSession.start(runtime, fixture("all-methods.ts"));
      try {
        await session.request("initialize", initializeParams);
        session.notify("initialized", {});

        const refused = { bad: "not a ProgressToken" };
        const streamRows = Object.entries(requestEntries)
          .filter(([, entry]) => entry.drive === "stream-driven")
          .map(([method]) => method);
        // The pair every derived loop owes: a table with no stream-driven row
        // would satisfy every assertion below while measuring nothing.
        expect(streamRows.length).toBeGreaterThan(0);

        for (const _attempt of [0, 1]) {
          for (const method of streamRows) {
            await session.request<unknown>(method, {
              textDocument: { uri },
              position: { line: 0, character: 0 },
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
              context: { diagnostics: [] },
              partialResultToken: refused,
            });
          }
        }

        const lines = session.stderr
          .split("\n")
          .filter((line) => line.startsWith(invalidTokenTrace));

        expect(lines).toHaveLength(streamRows.length);
        expect(
          lines.map((line) => streamRows.find((method) => line.includes(`this ${method} `))),
        ).toEqual(streamRows);
        expect(session.progressCount).toBe(0);
      } finally {
        session.dispose();
      }
    });
  });
}
