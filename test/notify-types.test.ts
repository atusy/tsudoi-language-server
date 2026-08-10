import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * NOTHING HERE RUNS, and it does not need to: what `Tsudoi.notify` buys an
 * author is entirely a COMPILE-TIME fact, so a probe that stood a session up
 * would be measuring the construction as well. The same shape and the same
 * reason as test/execute-command-types.test.ts's.
 *
 * THE UPSTREAM NAMES ARRIVE THROUGH TSUDOI'S OWN PUBLISHED SUBPATH, which is
 * what `deps/` exists for: a consumer never names a protocol package directly,
 * and a probe that did would say nothing about whether the shape is reachable
 * the way a consumer reaches it. What this never reaches is the ARTIFACT -- the
 * probe stages no `dist/`, so the exports map's source arm answers; that half
 * belongs to test/package-shape.test.ts.
 */
function notifyProbe(body: string): Record<string, string> {
  return {
    "probe.ts": [
      "import type { Tsudoi } from './src/types.ts';",
      "import type { ShowMessageParams } from '@atusy/tsudoi-language-server/deps/protocol';",
      "declare const tsudoi: Tsudoi;",
      "declare const showMessage: ShowMessageParams;",
      "void showMessage;",
      body,
      "",
    ].join("\n"),
  };
}

/**
 * THE METHOD IS OPEN, WHICH IS THE HALF A TYPED MAP MOST EASILY DESTROYS. A
 * closed union over the notifications tsudoi knows would turn a CUSTOM
 * EXTENSION -- a method an author's own client understands and no specification
 * mentions -- into a cast, and the whole point of a config framework is that the
 * author's client is not tsudoi's business.
 *
 * BOTH SENDS IN ONE PROBE, so a run that accepted the known method and refused
 * the custom one is told apart from one that accepted both.
 */
test("a method the protocol never named is sendable, and its params are unconstrained", async () => {
  const result = await typeCheckProbe(
    notifyProbe(
      [
        "void tsudoi.notify('window/showMessage', showMessage);",
        "void tsudoi.notify('my-editor/somethingCustom', { anything: [1, 'two'] });",
        "void tsudoi.notify('my-editor/noParamsAtAll');",
      ].join("\n"),
    ),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * THE SPELLING FROM THE DOCUMENTATION COMPILES, WHICH IS WHAT THE MAP IS FOR AND
 * IS NOT OBVIOUS FROM THE MAP ALONE. `ShowMessageParams.type` is `MessageType`,
 * a union of numeric literals, so a bare `1` would WIDEN to `number` anywhere it
 * was inferred on its own -- and does not here, because an argument written
 * INLINE is contextually typed by the parameter it is passed to.
 *
 * SO THE ERGONOMIC CASE AND THE STRICT ONE ARE THE SAME ARM'S SUBJECT, and the
 * next arm is the other half: the moment the value stops being inline, the
 * widening is real and the compiler says so.
 */
test("the documented spelling compiles, a literal argument being contextually typed", async () => {
  const result = await typeCheckProbe(
    notifyProbe("void tsudoi.notify('window/showMessage', { type: 1, message: 'hi' });"),
  );

  expect(`exit ${String(result.code)}\n${result.output}`).toBe("exit 0\n");
});

/**
 * AND THE SAME VALUE DECLARED SEPARATELY IS REFUSED, which is the case a reusable
 * constant is in and the one test/fixtures/notify.ts actually met: `const shown =
 * { type: 1, ... }` infers `number` for a member the protocol declares as
 * `MessageType`. THE ANSWER IS THE ANNOTATION the docblock sends an author to,
 * and not a cast.
 *
 * THE ERROR COUNT IS PART OF THE ASSERTION: without it a probe that failed to
 * RESOLVE `Tsudoi` at all would satisfy `exit 1` and the substring, and would be
 * reporting the staging rather than the type.
 */
test("a params value declared without the protocol's type is refused, naming the member", async () => {
  const result = await typeCheckProbe(
    notifyProbe(
      [
        "const widened = { type: 1, message: 'hi' };",
        "void tsudoi.notify('window/showMessage', widened);",
      ].join("\n"),
    ),
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("TS2345");
  expect(result.output).toContain("MessageType");
  expect(result.output.split("error TS").length - 1).toBe(1);
});

/**
 * AND A SHAPE THE PROTOCOL DOES NOT DECLARE IS REFUSED EVEN INLINE, which is
 * what says the contextual typing above is CHECKING rather than merely accepting:
 * a literal that satisfies nothing still fails.
 */
test("a known method's params are checked against the protocol's own shape", async () => {
  const result = await typeCheckProbe(
    notifyProbe("void tsudoi.notify('window/showMessage', { type: 1, msg: 'typo' });"),
  );

  expect(result.code).toBe(1);
  expect(result.output.split("error TS").length - 1).toBe(1);
});

/**
 * A KNOWN METHOD MAY NOT GO WITHOUT ITS PARAMS, and this is the arm that says
 * the two arities are decided by the METHOD rather than being loose everywhere:
 * the custom method above compiles with no params at all, and this one does not.
 */
test("a known method's params are required, where a custom method's are not", async () => {
  const result = await typeCheckProbe(notifyProbe("void tsudoi.notify('window/showMessage');"));

  expect(result.code).toBe(1);
  expect(result.output.split("error TS").length - 1).toBe(1);
});
