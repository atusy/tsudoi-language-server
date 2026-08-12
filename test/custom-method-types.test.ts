import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * NOTHING HERE RUNS, for the reason test/initialize-handler-types.test.ts states
 * at its own probe: the claim is about what tsc accepts, and a probe that had to
 * build a real session would be measuring the construction too.
 *
 * WHAT THIS FILE IS AND WHAT test/published-artifacts.test.ts IS, since both
 * grade this surface and neither is the other's second opinion: this one resolves
 * `./src/types.ts` through a symlink and asks what the two handler types RESOLVE
 * TO, by identity, which is the reading a perturbation record can re-run cheaply.
 * That one installs a tarball and asks what a STRANGER may write against what
 * ships, which is where the refusals an author meets are graded.
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
      "  CustomMethodMap,",
      "  CustomNotificationHandler,",
      "  CustomRequestHandler,",
      "  NotificationContext,",
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
 * WHAT MAKES THIS SURFACE'S KNOWN MISTAKES SILENT. The notification context is
 * the SUPERTYPE of the request one, so an arm written as an assignment passes
 * with the two contexts unified -- which is one of the three collapses this
 * surface was chosen over.
 */
const identical = [
  "type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends",
  "  (<T>() => T extends B ? 1 : 2) ? true : false;",
].join("\n");

/**
 * THE REQUEST ARM, BOTH HALVES IN ONE PROBE BECAUSE THEY ARE ONE FAULT: the
 * context and the return are what tell the two handler names apart, and a
 * collapse of either makes a handler of one kind satisfy the other.
 */
test("a request handler is handed the request context and owes a result wrapper", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        "const context: Identical<Parameters<CustomRequestHandler>[0], BaseRequestContext> = true;",
        "const answer: Identical<ReturnType<CustomRequestHandler>, Promise<{ result: unknown }>> = true;",
        "void context;",
        "void answer;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE NOTIFICATION ARM. `{ readonly tsudoi: Tsudoi }` IS WRITTEN OUT RATHER THAN
 * NAMED, though `NotificationContext` is now a name a probe could use: spelling
 * the members is what makes a member ADDED to the published context redden here,
 * where naming the type would say only that the handler still takes whatever that
 * type became.
 */
test("a notification handler is handed the session alone and owes nothing back", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        "const context: Identical<Parameters<CustomNotificationHandler>[0], { readonly tsudoi: Tsudoi }> = true;",
        "const answer: Identical<ReturnType<CustomNotificationHandler>, Promise<void>> = true;",
        "void context;",
        "void answer;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE ARM THE TWO ABOVE CANNOT BE, and the one the whole surface rests on: the
 * two contexts are MUTUALLY ASSIGNABLE -- the request one merely adds `signal` --
 * so a surface that handed BOTH kinds the same context would satisfy every
 * assignment anyone could write. This says the two are told apart.
 */
test("the two kinds are handed different contexts, where assignability cannot tell", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        identical,
        "const distinct: Identical<Parameters<CustomNotificationHandler>[0], Parameters<CustomRequestHandler>[0]> = false;",
        "void distinct;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * WHAT THE SPLIT CONTEXT COSTS AN AUTHOR AT RUN TIME, said by the compiler
 * instead: a notification is not a request, so there is no cancellation to
 * observe and reading one is refused in the author's own file rather than
 * answered `undefined`.
 */
test("cancellation is not reachable from a notification handler's context", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const handler: CustomNotificationHandler = (context: NotificationContext) => {",
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
 * THE FORM AN AUTHOR WRITES, AND THE ANNOTATION IS THE DECLARATION: a custom
 * method's name says nothing about whether a client sends it as a request or as a
 * notification, so what the author annotates is what says which one they meant.
 *
 * IT READS BOTH CONTEXTS AND BOTH PARAMS, so a resolution that handed over
 * `unknown` or `never` would be refused here rather than passing for want of a
 * use.
 */
test("a handler of either kind compiles in the map, with the author annotating the context", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const config: TsudoiConfig = {",
        "  customMethod: {",
        '    "textDocument/didFocus": (context: BaseRequestContext, params: unknown) => {',
        "      void context.signal;",
        "      void params;",
        "      return Promise.resolve({ result: context.tsudoi.rootUri });",
        "    },",
        '    "textDocument/didBlur": (context: NotificationContext, params: unknown) => {',
        "      void params;",
        "      void context.tsudoi.documents;",
        "      return Promise.resolve();",
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
 * THE COST THE ANNOTATION IS PAID FOR, PINNED RATHER THAN LEFT TO BE DISCOVERED
 * BY WHOEVER WRITES THE FIRST BARE ARROW: TypeScript will not infer a parameter
 * from a union of signatures whose parameters disagree, so an unannotated handler
 * is TS7006 and not a handler tsudoi typed for you.
 *
 * WHAT IT WOULD TAKE TO MAKE THIS GREEN, which is what the arm is really about:
 * one context for both kinds, which restores inference and loses the axis that
 * keeps `signal` out of a notification handler. This arm going red is that trade
 * having been made.
 */
test("a bare arrow in the map is refused, the parameter having no type to infer from", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const config: TsudoiConfig = {",
        '  customMethod: { "textDocument/didFocus": (context, params) => Promise.resolve({ result: [context, params] }) },',
        "};",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS7006");
});

/**
 * THE COLLISION, GRADED ON THE COMPILER'S TEXT AND NOT ON ITS EXIT CODE, which is
 * the whole distance this arm travels. The spelling a reader reaches for first --
 * an optional `never` sentinel -- IS refused and reads `not assignable to type
 * 'undefined'`: it names neither the method it is about nor where the handler
 * belongs, so an author reads it as a mistake inside their own handler. A
 * sentinel that is a SENTENCE prints in full.
 *
 * BOTH FRAGMENTS ARE ASSERTED. Being told they are wrong without being told where
 * the handler goes leaves an author exactly where the `never` spelling left them.
 */
test("a name tsudoi already serves is refused by a message naming the method and where it belongs", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const config: TsudoiConfig = {",
        "  customMethod: {",
        '    "textDocument/hover": (_context: BaseRequestContext, _params: unknown) =>',
        "      Promise.resolve({ result: null }),",
        "  },",
        "};",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("textDocument/hover");
  expect(result.output).toContain("declare its handler under methods, not customMethod");
});

/**
 * THE HALF THAT KEEPS THE REFUSAL ABOVE FROM BEING A BAN ON EVERYTHING, and it is
 * ROOM DELIBERATELY LEFT OPEN rather than an oversight: `ConfigMethod` is the
 * request table plus `initialize`, and a built-in NOTIFICATION is in neither, so
 * `textDocument/didOpen` is accepted exactly as a name tsudoi never heard of is.
 *
 * WHAT IT DOES NOT CLAIM: that the two handlers are composed in the promised
 * order. That runtime contract is measured at the notification router; this arm
 * owns only whether a config author may write the name.
 */
test("a name tsudoi never enumerated compiles, and so does a built-in notification's", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const handler: CustomNotificationHandler = (_context: NotificationContext, _params: unknown) =>",
        "  Promise.resolve();",
        "const config: TsudoiConfig = {",
        '  customMethod: { "textDocument/didFocus": handler, "textDocument/didOpen": handler },',
        "};",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

test("exit is refused as a custom hook because its built-in never returns", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const handler: CustomNotificationHandler = () => Promise.resolve();",
        "const config: TsudoiConfig = { customMethod: { exit: handler } };",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("exit is a terminal notification");
});

/**
 * THE MAP AND BOTH HANDLER NAMES ARE NAMES AN AUTHOR MAY WRITE, which is the half
 * the in-place probes above cannot say: an author who factors a handler out into
 * its own FILE has no contextual type to lean on, and that case is exactly why
 * the notification context is published at all.
 */
test("the map and both handler names are writable, and a map of handlers is a config's customMethod", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const answers: CustomRequestHandler = (_context: BaseRequestContext, _params: unknown) =>",
        "  Promise.resolve({ result: null });",
        "const notes: CustomNotificationHandler = (_context: NotificationContext, _params: unknown) =>",
        "  Promise.resolve();",
        'const map: CustomMethodMap = { "textDocument/didFocus": answers, "textDocument/didBlur": notes };',
        "const config: TsudoiConfig = { customMethod: map };",
        "void config;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});
