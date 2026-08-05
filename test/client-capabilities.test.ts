import { describe, expect, test } from "bun:test";
import type { Hover, InitializeResult } from "vscode-languageserver-protocol";
import { declaredSupport, type MutationReport } from "./fixtures/capabilities-mutation.ts";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * WHAT THE CLIENT DECLARES, and the one field it declares is the one
 * `@atusy/tsudoi-completion-path` reads to choose between a `TextEdit` and an
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
 * THE FIELD `DeepReadonly` CANNOT REACH BY MAPPING, and it is exactly where a
 * client's own capability data lives. Upstream declares `experimental` as
 * `LSPAny`, which is `any`, and NO conditional or mapped type can make `any`
 * readonly -- a mapped type over it yields members that are `any` again, so the
 * assignment below type-checks however deep it goes while the run-time freeze
 * throws on it. The published type promising `readonly at every depth` was
 * false precisely at the one field a config author is most likely to write to.
 *
 * REDUCED TO `unknown` RATHER THAN OVERRIDDEN WITH A JSON VALUE TYPE, and the
 * two are not the same trade: an override would let an author READ a member
 * without a cast, at the price of tsudoi inventing a shape for data the CLIENT
 * defines -- which is the mirror this surface refuses to be everywhere else. The
 * reduction is uniform, applies to every `any` the dependency ever adds, and
 * says what is true: tsudoi does not know what is in there, and the reader
 * narrows.
 *
 * TS18046 IS THE CODE FOR `is of type 'unknown'`, and asserting it is what
 * separates this from a probe that failed to resolve its import -- and from one
 * where a misplaced `any` arm collapsed the WHOLE type to `unknown`, which the
 * TS2540 pair above is what catches.
 */
test("a handler writing into an experimental capability does not type-check", async () => {
  const result = await typeCheckProbe(
    tsudoiProbe("tsudoi.clientCapabilities.experimental.deep.value = 1;"),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS18046");
  expect(result.output).toContain("experimental");
});

/**
 * THE PAIRED CONTROL, without which the three above are satisfied by a surface
 * nobody can read at all: a `never`, a broken import, a type that resolves to
 * nothing would fail every assignment AND every read. The last line is the
 * control for the reduction specifically -- `experimental` stays READABLE, and
 * what it costs an author is the narrowing `unknown` asks for, not the field.
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

    /**
     * THE OTHER SHAPE THAT REACHES THE INGRESS, AND THE ONLY OTHER ONE: a
     * `capabilities` PRESENT and not an object is refused -32602 at the
     * handshake, so an OMITTED field -- which a non-conforming client sends
     * despite the protocol declaring it required -- and an explicit `null` are
     * what is left. src/tsudoi.ts reads both as `{}` at its `??`, and this is
     * what measures that rather than asserting it.
     *
     * THE `{}` IS FROZEN TOO, which is not a free consequence of the paragraph
     * above: the value a handler meets before the client has declared anything
     * is the same object for the rest of the session, so a handler writing into
     * it would furnish a capability out of nothing at all.
     *
     * NOTHING IS REFUSED AT THE NESTED DEPTH HERE BECAUSE THERE IS NO NESTED
     * VALUE TO WRITE TO, which is the honest reading of `false` below rather
     * than a weaker claim: the handler's guard finds no `completionItem` and
     * never attempts the write.
     */
    test("a client that declares nothing is given an empty object no handler can write into", async () => {
      const session = LspSession.start(runtime, fixture("capabilities-mutation.ts"));
      try {
        await session.request<InitializeResult>("initialize", { processId: null, rootUri: null });
        session.notify("initialized", {});

        expect(await reportFrom(session)).toEqual({
          nestedRefused: false,
          topRefused: true,
          insertReplaceSupport: undefined,
        });
      } finally {
        session.dispose();
      }
    });
  });
}
