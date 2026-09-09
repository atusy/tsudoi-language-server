import { expect, test } from "bun:test";
import { typeCheckProbe } from "./helpers/typecheck.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

test("published stream handlers accept final arrays, null, and void", async () => {
  const result = await typeCheckProbe({
    "probe.ts": `
      import type { MethodHandler } from '@atusy/tsudoi-language-server/types';
      const completion: MethodHandler<'textDocument/completion'> = async function* () {
        yield [{ label: 'partial' }];
        return [{ label: 'final' }];
      };
      const action: MethodHandler<'textDocument/codeAction'> = async function* () {
        yield [{ title: 'partial', command: 'test.partial' }];
        return [{ title: 'final', edit: { changes: {} } }];
      };
      const empty: MethodHandler<'textDocument/completion'> = async function* () { return null; };
      const legacy: MethodHandler<'textDocument/codeAction'> = async function* () { yield []; };
      const wrapped: MethodHandler<'textDocument/completion'> = async function* (context, params) {
        return yield* completion(context, params);
      };
      void [completion, action, empty, legacy, wrapped];
    `,
  });
  expect(result).toEqual({ code: 0, output: "" });
});

test("published stream handlers reject scalar returns and bare item yields", async () => {
  const result = await typeCheckProbe({
    "probe.ts": `
      import type { MethodHandler } from '@atusy/tsudoi-language-server/types';
      // @ts-expect-error completion results are arrays or null, not a scalar
      const completion: MethodHandler<'textDocument/completion'> = async function* () { return 42; };
      // @ts-expect-error code action results must be arrays, not one command
      const action: MethodHandler<'textDocument/codeAction'> = async function* () {
        return { title: 'final', command: 'test.final' };
      };
      // @ts-expect-error yields remain arrays
      const malformed: MethodHandler<'textDocument/completion'> = async function* () { yield { label: 'partial' }; };
      void [completion, action, malformed];
    `,
  });
  expect(result).toEqual({ code: 0, output: "" });
});
