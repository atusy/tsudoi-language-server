import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * A probe project's source, with `body` spliced in under the published names and
 * the one upstream name this row's params come from.
 *
 * NOTHING HERE RUNS, which is the point: the claim is about what tsc accepts, so
 * `declare const` is enough and a probe that had to build a real session would be
 * measuring the construction too. The same shape and the same reason as
 * test/initialize-handler-types.test.ts's.
 */
function typesProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      "import type { MethodHandler, RequestContext } from './src/types.ts';",
      "import type { ExecuteCommandParams } from 'vscode-languageserver-protocol';",
      "type Handler = MethodHandler<'workspace/executeCommand'>;",
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
 * alone is satisfied by a method tsudoi does not serve. MEASURED, and it is the
 * reading that decided this arm's shape.
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
 * writing this row's types out of upstream's own declaration -- whose result
 * slot is `any` -- COMPILES CLEAN. So what the arm above catches is the
 * narrowing, and not a probe harness that refuses everything.
 *
 * `any` IS WRITTEN INSIDE THE PROBE STRING and never in this repository's own
 * source, which is what keeps the lint guard out of it.
 */
test("the same probe against a result declared any compiles, which is what the narrowing buys", async () => {
  const result = await typeCheckProbe(
    typesProbe(
      [
        "type UpstreamShaped = (context: RequestContext, params: ExecuteCommandParams) =>",
        "  Promise<any>;",
        "declare const upstreamAnswered: Awaited<ReturnType<UpstreamShaped>>;",
        "const asString: string = upstreamAnswered;",
        "void asString;",
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
