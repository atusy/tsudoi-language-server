import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * A probe project's source, with `body` spliced in under the published names and
 * two bound values.
 *
 * NOTHING HERE RUNS, which is the point: the claim is about what tsc accepts, so
 * `null as unknown as` is enough and a probe that had to build a real session
 * would be measuring the construction too. The same shape and the same reason as
 * test/client-capabilities.test.ts's.
 *
 * EVERY NAME IS IMPORTED INTO EVERY PROBE, unused ones included, so that a probe
 * asserting a FAILURE cannot pass because a name it never imported was missing:
 * that failure would read TS2304 and this file asserts the diagnostic code of
 * each refusal rather than the exit alone.
 */
function typesProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      "import type {",
      "  BaseRequestContext,",
      "  ConfigMethod,",
      "  Method,",
      "  MethodHandler,",
      "  RequestContext,",
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

/** The handler every probe below writes when it needs a compiling one. */
const initializeHandler = [
  'const initialize: MethodHandler<"initialize"> = (context) => {',
  "  return Promise.resolve(context.preparedResult);",
  "};",
].join("\n");

/**
 * ONE TYPE PARAMETER, AND THE SECOND ONE IS REFUSED RATHER THAN DEFAULTED. A
 * defaulted context parameter would let an author write
 * `MethodHandler<"textDocument/hover", MyCtx>` and be told nothing: tsudoi
 * supplies the context and cannot be made to supply theirs, so the surface would
 * type-check a handler that can only fail at run time.
 *
 * TS2314 IS THE CODE FOR `generic type requires N type argument(s)` AND NOTHING
 * ELSE, which is what separates this from a probe that failed to resolve its
 * import. MEASURED and not guessed: at a TYPE REFERENCE tsc says TS2314, where
 * TS2558 is what a generic CALL with too many arguments reads.
 */
test("MethodHandler takes one type parameter, so a second is refused", async () => {
  const result = await typeCheckProbe(
    typesProbe('export type Wrong = MethodHandler<"textDocument/hover", RequestContext>;'),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2314");
  expect(result.output).toContain("requires 1 type argument");
});

/**
 * THE CONTEXT IS DERIVED FROM THE METHOD AND NEVER CHOSEN, and this is the arm
 * that says so: `preparedResult` exists for exactly one key, and a hover handler
 * reading it is refused in the author's own file rather than answered
 * `undefined` at run time.
 */
test("preparedResult is not reachable from a hover handler's context", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        'const hover: MethodHandler<"textDocument/hover"> = (context) => {',
        "  void context.preparedResult;",
        "  return Promise.resolve(null);",
        "};",
        "void hover;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2339");
  expect(result.output).toContain("preparedResult");
});

/**
 * THE CONTROL FOR THE TWO REFUSALS ABOVE, and without it neither means anything:
 * a probe harness that refused everything would satisfy both. This one says the
 * parameter is refused rather than the apparatus -- and it is also the arm
 * carrying `a handler may return exactly what it was handed`, which the mutable
 * spelling of the row's result would have refused.
 */
test("preparedResult is reachable from the initialize handler's context, and may be returned as it stands", async () => {
  const result = await typeCheckProbe(typesProbe(`${initializeHandler}\nvoid initialize;`));

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE DEFAULT WAS NOT DROPPED. `RequestContext` is published, and sites outside
 * src/ write it BARE -- including the hand-built object literals in both handler
 * packages, which Definition of Done check 5 compiles -- so a generic without a
 * default breaks every one of them by arity.
 *
 * WHAT THIS ARM DOES NOT SAY, MEASURED RATHER THAN ASSUMED: it does not pin
 * WHICH default. Under `= ConfigMethod` the conditional distributes to
 * `BaseRequestContext | InitializeRequestContext`, and this literal is assignable
 * to one arm and therefore to the union, so this probe is exit 0 under both
 * spellings. What the value of the default decides is what a bare
 * `RequestContext` MEANS, which is asserted one arm down.
 */
test("a bare RequestContext still takes the two members it takes today", async () => {
  const result = await typeCheckProbe(
    typesProbe("const context: RequestContext = { signal, tsudoi };\nvoid context;"),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * WHAT THE DEFAULT'S VALUE DECIDES, AND THE ARM THE PROBE ABOVE CANNOT BE. With
 * `= Method` the conditional distributes over the five, every arm answers
 * `BaseRequestContext`, and a bare `RequestContext` IS that type. With
 * `= ConfigMethod` it is `BaseRequestContext | InitializeRequestContext`.
 *
 * WHY IT TAKES A TYPE-IDENTITY TEST AND NOT AN ASSIGNMENT, MEASURED BEFORE BEING
 * WRITTEN THIS WAY: the union and the base are mutually ASSIGNABLE -- the
 * initialize context extends the base -- so every readable probe is exit 0 under
 * both spellings, and reading `preparedResult` off a bare context is TS2339
 * under both as well. The first spelling of this arm read the field through a
 * cast and was measured VACUOUS: the whole file stayed green with the default
 * widened.
 *
 * THE IDIOM IS TSC'S OWN INTERNAL IDENTITY CHECK: two generic signatures are
 * mutually assignable only when their conditional types are IDENTICAL, which
 * distinguishes `A` from `A | B` where assignability cannot.
 */
test("a bare RequestContext IS the base context, and not a union with the initialize one", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends",
        "  (<T>() => T extends B ? 1 : 2) ? true : false;",
        "const bareIsBase: Identical<RequestContext, BaseRequestContext> = true;",
        "void bareIsBase;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE CONFIG-FACING KEY DOMAIN, BOTH DIRECTIONS IN ONE PAIR. `initialize` is a
 * key a config may declare, and it is NOT a key of the request table -- and
 * neither half says anything alone: the compiling half is satisfied by a
 * `TsudoiConfig` that widened `Method` itself, and the refusal is satisfied by a
 * key that exists nowhere at all.
 */
test("an initialize handler is a legal member of TsudoiConfig.methods", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      `${initializeHandler}\nconst config: TsudoiConfig = { methods: { initialize } };\nvoid config;`,
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

test("`initialize` is not a Method, though it is a ConfigMethod", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        'const configMethod: ConfigMethod = "initialize";',
        "void configMethod;",
        'const method: Method = "initialize";',
        "void method;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2322");
  // THE TARGET TYPE IS NAMED AND THE COUNT IS ONE, so that a red arriving from
  // the ConfigMethod control above -- the half that must stay green -- cannot be
  // read as this refusal firing. `keyof MethodMap` and not `Method`: tsc prints
  // through the alias, so this is the compiler's spelling of the same type.
  expect(result.output).toContain("is not assignable to type 'keyof MethodMap'");
  expect(result.output.split("error TS").length - 1).toBe(1);
});
