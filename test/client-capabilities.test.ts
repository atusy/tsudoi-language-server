import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import { declaredSupport, type MutationReport } from "./fixtures/capabilities-mutation.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

/**
 * WHAT THE CLIENT DECLARES, and the one field it declares is the one
 * examples/completion-path.ts reads to choose between a `TextEdit` and an
 * `InsertReplaceEdit`. `false` rather than absent on purpose: a handler that
 * forged it would be claiming a capability whose ABSENCE the client stated,
 * which is the sharper half of the lie.
 */
const capabilities = {
  textDocument: { completion: { completionItem: { insertReplaceSupport: declaredSupport } } },
};

const hoverParams = {
  textDocument: { uri: "file:///workspace/a.txt" },
  position: { line: 0, character: 0 },
};

/** The one report every handler in this file must produce, at every request. */
const untouched: MutationReport = {
  nestedRefused: true,
  topRefused: true,
  insertReplaceSupport: declaredSupport,
};

async function reportFrom(session: LspSession): Promise<MutationReport> {
  const hover = await session.request<Hover>("textDocument/hover", hoverParams);
  const contents = hover.contents as { value?: string };
  return JSON.parse(contents.value ?? "{}") as MutationReport;
}

/**
 * A probe project's source, with `body` spliced in under a bound `Tsudoi`.
 *
 * The binding is `null as unknown as` because nothing here RUNS -- the claim is
 * about what tsc accepts, and a probe that had to build a real session would be
 * measuring the construction as well.
 */
function tsudoiProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      'import type { Tsudoi } from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * THE COMPILE-TIME HALF, WHICH IS HALF AND SAYS SO. `readonly` is erased at run
 * time, so this pair speaks only about a config that is type-checked -- the
 * runtime tests below are what hold for the JavaScript an author ships, and
 * neither half substitutes for the other.
 *
 * THE DIAGNOSTIC IS ASSERTED AND NOT MERELY THE EXIT CODE. A probe that failed
 * to resolve its import would also exit 1, and an assignment probe is the exact
 * shape that passes for the wrong reason -- an EXCESS PROPERTY on an object
 * literal, say, which tsc checks in some positions and not in others. TS2540 is
 * the code for `assigned to a read-only property` and nothing else.
 */
test("a handler assigning to a client capability does not type-check", async () => {
  const result = await typeCheckProbe(tsudoiProbe("tsudoi.clientCapabilities.textDocument = {};"));

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("textDocument");
});

/**
 * THE NESTED ARM, and it is not the same claim: a field declared `readonly`
 * protects the BINDING alone, so a type with one-level readonly members accepts
 * every assignment below the first. This is also the field a real config reads.
 */
test("a handler assigning to a NESTED client capability does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      [
        "const completion = tsudoi.clientCapabilities.textDocument?.completion;",
        "if (completion?.completionItem !== undefined) {",
        "  completion.completionItem.insertReplaceSupport = true;",
        "}",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2540");
  expect(result.output).toContain("insertReplaceSupport");
});

/**
 * THE PAIRED CONTROL, without which the two above are satisfied by a surface
 * nobody can read at all: a `never`, a broken import, a type that resolves to
 * nothing would fail every assignment AND every read.
 */
test("reading the same capabilities type-checks", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe(
      [
        "export const supported =",
        "  tsudoi.clientCapabilities.textDocument?.completion?.completionItem",
        "    ?.insertReplaceSupport ?? false;",
        "export const experimental = tsudoi.clientCapabilities.experimental;",
      ].join("\n"),
    ),
  );

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

const runtimes = [bunRuntime, denoRuntime];

await Promise.all(runtimes.map(requireRuntime));

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    /**
     * THE RUNTIME HALF, AND THE ONE THAT HOLDS FOR SHIPPED JAVASCRIPT. A config
     * author writes JavaScript, or casts, or reaches the object through a helper
     * tsc never saw -- and `readonly` is gone by then.
     *
     * TWO REQUESTS, BECAUSE THE FINDING IS ABOUT THE SECOND ONE. What a handler
     * can do to its own view is nobody's business; what it may not do is leave
     * the NEXT handler reading a capability the client never declared, and only a
     * later request can measure that.
     *
     * THE REFUSAL IS ASSERTED BESIDE THE VALUE, and the pair is the whole claim:
     * an unchanged value alone is equally true of a handler that never reached
     * the object, and a throw alone says nothing about what survived it.
     */
    test("a handler cannot rewrite the client's capabilities, and the next one reads what the client declared", async () => {
      const session = LspSession.start(runtime, fixture("capabilities-mutation.ts"));
      try {
        await session.request<InitializeResult>("initialize", {
          ...initializeParams,
          capabilities,
        });
        session.notify("initialized", {});

        expect(await reportFrom(session)).toEqual(untouched);
        expect(await reportFrom(session)).toEqual(untouched);
      } finally {
        session.dispose();
      }
    });
  });
}
