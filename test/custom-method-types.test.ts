import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * NOTHING HERE RUNS, for the reason test/initialize-handler-types.test.ts states
 * at its own probe: the claim is about what tsc accepts, and a probe that had to
 * build a real session would be measuring the construction too.
 *
 * EVERY NAME IS IMPORTED INTO EVERY PROBE, unused ones included, so that a probe
 * asserting a FAILURE cannot pass because a name it never imported was missing --
 * that failure reads TS2304, and the refusals below assert a diagnostic code.
 */
function typesProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      "import type {",
      "  BaseRequestContext,",
      "  CustomMethodEntry,",
      "  CustomMethodHandler,",
      "  CustomMethodMap,",
      "  NotificationGate,",
      "  Tsudoi,",
      "  TsudoiConfig,",
      '} from "./src/types.ts";',
      "const tsudoi = null as unknown as Tsudoi;",
      "const signal = null as unknown as AbortSignal;",
      "void tsudoi;",
      "void signal;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * TSC'S OWN INTERNAL IDENTITY CHECK, spliced from test/initialize-handler-types
 * .test.ts's copy of it and for the same reason: MUTUAL ASSIGNABILITY IS EXACTLY
 * WHAT MAKES THIS ITEM'S TWO KNOWN MISTAKES SILENT. The notification context is
 * the SUPERTYPE of the request one, so every arm below written as an assignment
 * passes with the arms swapped and with the conditional written on the context
 * type.
 */
const identical = [
  "type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends",
  "  (<T>() => T extends B ? 1 : 2) ? true : false;",
].join("\n");

/** What a handler of one kind is handed, and what it owes back. */
const resolved = [
  'type Context<K extends "request" | "notification"> = Parameters<CustomMethodHandler<K>>[0];',
  'type Answer<K extends "request" | "notification"> = ReturnType<CustomMethodHandler<K>>;',
].join("\n");

/**
 * THE REQUEST ARM, BOTH HALVES IN ONE PROBE BECAUSE THEY FAIL TOGETHER: every
 * inversion recorded against this type moved the context and the return in step,
 * so splitting them would buy two reds where the fault is one.
 */
test("a request handler is handed the request context and owes a result wrapper", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        resolved,
        'const context: Identical<Context<"request">, BaseRequestContext> = true;',
        'const answer: Identical<Answer<"request">, Promise<{ result: unknown }>> = true;',
        "void context;",
        "void answer;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE NOTIFICATION ARM. `{ readonly tsudoi: Tsudoi }` IS WRITTEN OUT RATHER THAN
 * NAMED, and that is the criterion's other half showing through: the type a
 * notification handler is handed is not exported, so a probe cannot name it and
 * has to spell its members. A member added to it reddens here, which is the
 * price of the surface staying closed.
 */
test("a notification handler is handed the session alone and owes nothing back", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        resolved,
        'const context: Identical<Context<"notification">, { readonly tsudoi: Tsudoi }> = true;',
        'const answer: Identical<Answer<"notification">, Promise<void>> = true;',
        "void context;",
        "void answer;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE ARM THE TWO ABOVE CANNOT BE, and the one the whole criterion rests on: the
 * two contexts are MUTUALLY ASSIGNABLE -- the request one merely adds `signal` --
 * so a conditional that resolved BOTH kinds to the same type would satisfy every
 * assignment anyone could write. This says the two are told apart.
 */
test("the two kinds are handed different contexts, where assignability cannot tell", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        resolved,
        'const distinct: Identical<Context<"notification">, Context<"request">> = false;',
        "void distinct;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * WHAT THE CONTEXT COSTS AN AUTHOR AT RUN TIME, said by the compiler instead: a
 * notification is not a request, so there is no cancellation to observe and
 * reading one is refused in the author's own file rather than answered
 * `undefined`.
 */
test("cancellation is not reachable from a notification handler's context", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        'const handler: CustomMethodHandler<"notification"> = (context) => {',
        "  void context.signal;",
        "  return Promise.resolve();",
        "};",
        "void handler;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2339");
  expect(result.output).toContain("signal");
});

/**
 * THE DISCIPLINE `RequestContext`'s DOCBLOCK ALREADY STATES -- nothing an author
 * writes selects the shape they are handed -- CARRIED ONTO A METHOD TSUDOI NEVER
 * ENUMERATED. Both handlers are written INLINE, naming no context type, which is
 * what the unpublished notification context makes mandatory rather than merely
 * idiomatic: there is no name to annotate with.
 *
 * IT READS BOTH CONTEXTS AND BOTH PARAMS, so a resolution that handed over
 * `unknown` or `never` would be refused here rather than passing for want of a
 * use.
 */
test("a handler of either kind compiles inline, with the author naming no context type", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const config: TsudoiConfig = {",
        "  customMethod: {",
        '    "textDocument/didFocus": {',
        '      kind: "request",',
        "      handler: async (context, params) => {",
        "        void context.signal;",
        "        void params;",
        "        return { result: context.tsudoi.rootUri };",
        "      },",
        "    },",
        '    "textDocument/didBlur": {',
        '      kind: "notification",',
        '      gate: "lifecycle",',
        "      handler: async (context, params) => {",
        "        void params;",
        "        void context.tsudoi.documents;",
        "      },",
        "    },",
        "  },",
        "};",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE ENTRY AND THE MAP ARE NAMES AN AUTHOR MAY WRITE, which is the half the
 * inline probe above cannot say: contextual typing covers a literal written in
 * place, and an author who factors their entries into a const of their own needs
 * something to annotate it with.
 */
test("the entry and the map are writable names, and a map of entries is a config's customMethod", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        'const gate: NotificationGate = "always";',
        "const entry: CustomMethodEntry = {",
        '  kind: "notification",',
        "  gate,",
        "  handler: () => Promise.resolve(),",
        "};",
        'const map: CustomMethodMap = { "textDocument/didFocus": entry };',
        "const config: TsudoiConfig = { customMethod: map };",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});
