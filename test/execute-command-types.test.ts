import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * NOTHING HERE RUNS, which is the point: the claim is about what tsc accepts, so
 * `declare const` is enough and a probe that had to build a real session would be
 * measuring the construction too. The same shape and the same reason as
 * test/initialize-handler-types.test.ts's.
 *
 * THE UPSTREAM NAMES ARRIVE THROUGH TSUDOI'S OWN PUBLISHED SUBPATH AND NOT OFF
 * THE BARE PACKAGE, which is the property this repository's `deps/` exists for:
 * a consumer never names a protocol package directly, and a probe that did would
 * say nothing about whether the name is reachable the way a consumer reaches it.
 * typeCheckProbe stages the manifest and dist/, so the package subpath resolves
 * through the same built declaration a consumer receives. src/ is present only
 * because this file imports it explicitly for the construction under test.
 *
 * `UpstreamResult` IS DERIVED AND NEVER WRITTEN OUT, which is what pins the
 * premise the arm below rests on -- see there.
 */
function typesProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      "import type { MethodHandler, RequestContext } from './src/types.ts';",
      "import type {",
      "  ExecuteCommandParams,",
      "  ExecuteCommandRequest,",
      "  ProtocolRequestType,",
      "} from '@atusy/tsudoi-language-server/deps/protocol';",
      "type Handler = MethodHandler<'workspace/executeCommand'>;",
      "type UpstreamResult = typeof ExecuteCommandRequest.type extends",
      "  ProtocolRequestType<any, infer R, any, any, any> ? R : never;",
      "declare const context: RequestContext;",
      "declare const params: ExecuteCommandParams;",
      "void context;",
      "void params;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * THE PUBLISHED RESULT IS `unknown`, AND THIS IS THE ARM THAT SAYS SO. Upstream
 * declares this request's result `any`, and `any` reaching
 * packages/tsudoi-language-server/src/types.ts DISABLES CHECKING IN THE AUTHOR'S
 * OWN FILE, silently: a stranger who assigns a command's answer to a `string`
 * gets no diagnostic and a run-time surprise. `DeepReadonly`'s first arm exists
 * one type earlier for exactly this.
 *
 * THE ERROR COUNT IS PART OF THE ASSERTION, AND WITHOUT IT THIS PROBE IS
 * VACUOUS. Before the row existed at all, this same source failed TS2344 --
 * `'workspace/executeCommand'` not assignable to `ConfigMethod` -- so `exit 1`
 * alone is satisfied by a method tsudoi does not serve. MEASURED.
 *
 * AND MEASURED THE OTHER WAY, which is what says the row's narrowing is where
 * this red comes from: the published result declared `Promise<any>` instead,
 * this arm alone reddens -- exit 0 where it expects one error -- while the two
 * arms below stay green, the control included: that one is derived from
 * UPSTREAM's declaration and reads nothing this repository writes.
 */
test("what an executeCommand handler answers is not assignable to a string", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "declare const answered: Awaited<ReturnType<Handler>>;",
        "const asString: string = answered;",
        "void asString;",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2322");
  expect(result.output).toContain("Type 'unknown' is not assignable to type 'string'");
  expect(result.output.split("error TS").length - 1).toBe(1);
});

/**
 * THE HALF THAT SAYS THE CRITERION IS WORTH MEETING, and the refusal above is
 * worth nothing without it: the same probe, over the handler a developer gets by
 * writing this row's types out of upstream's own declaration, COMPILES CLEAN. So
 * what the arm above catches is the narrowing, and not a probe harness that
 * refuses everything.
 *
 * THE RESULT IS READ OUT OF `ExecuteCommandRequest.type` AND NOT HAND-WRITTEN,
 * which is the whole reason this arm is shaped the way it is. Upstream declares
 * that slot `any` TODAY; a literal `Promise<any>` here would go on compiling
 * after upstream narrowed it, leaving criterion 4's entire reason for existing
 * silently false with this arm, the refusal above and the suite all green.
 * Derived, the day upstream says `unknown` is the day this reddens -- MEASURED
 * by substituting `ProtocolRequestType<ExecuteCommandParams, unknown, never,
 * void, unknown>` for the subject of the extraction: exit 1, TS2322, `Type
 * 'unknown' is not assignable to type 'string'`.
 *
 * THE INWARD ASSIGNMENT IS WHAT KEEPS THE DERIVATION HONEST, and without it this
 * arm is vacuous in a new way the literal never was: an extraction that stopped
 * matching yields `never`, and `never` is assignable to `string` too. Only `any`
 * passes both directions -- `unknown` fails the outward one, `never` the inward.
 *
 * `any` IS WRITTEN INSIDE THE PROBE STRING and never in this repository's own
 * source, which is what keeps the lint guard out of it. It is a WILDCARD in the
 * extraction rather than the control's result, so it stands for upstream's
 * declaration nowhere.
 */
test("the same probe against upstream's own declared result compiles, which is what the narrowing buys", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "type UpstreamShaped = (context: RequestContext, params: ExecuteCommandParams) =>",
        "  Promise<UpstreamResult>;",
        "declare const upstreamAnswered: Awaited<ReturnType<UpstreamShaped>>;",
        "const asString: string = upstreamAnswered;",
        "const intoUpstream: UpstreamResult = 1;",
        "void asString;",
        "void intoUpstream;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE CONTROL FOR THE APPARATUS ITSELF: the handler type RESOLVES and is
 * writable, so the refusal above is about the result and not about a name the
 * probe failed to import. A handler answering anything at all satisfies
 * `Promise<unknown>`, which is the other half of what `unknown` means here.
 */
test("an executeCommand handler is writable, and may answer anything", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "const executeCommand: Handler = (_context, received) =>",
        "  Promise.resolve({ ran: received.command });",
        "void executeCommand;",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});
