import { expect, test } from "bun:test";
import { typeCheckProbe } from "../helpers/typecheck.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();

test("published diagnostic handlers accept reports and partials with generator returns", async () => {
  const result = await typeCheckProbe({
    "probe.ts": `
      import type { MethodHandler } from '@atusy/tsudoi-language-server/types';
      const streaming: MethodHandler<'textDocument/diagnostic'> = async function* () {
        yield { kind: 'full', resultId: 'current', items: [] };
        yield { relatedDocuments: { 'file:///related': { kind: 'unchanged', resultId: 'related' } } };
      };
      const single: MethodHandler<'textDocument/diagnostic'> = async function* () {
        return { kind: 'unchanged', resultId: 'current' };
      };
      const wrapped: MethodHandler<'textDocument/diagnostic'> = async function* (context, params) {
        return yield* single(context, params);
      };
      // @ts-expect-error diagnostic handlers must now be generators
      const promise: MethodHandler<'textDocument/diagnostic'> = async () => ({ kind: 'full', items: [] });
      // @ts-expect-error a standalone report cannot be null
      const nullResult: MethodHandler<'textDocument/diagnostic'> = async function* () { return null; };
      // @ts-expect-error a partial requires relatedDocuments
      const array: MethodHandler<'textDocument/diagnostic'> = async function* () { yield []; };
      // @ts-expect-error unchanged reports require a resultId
      const missingId: MethodHandler<'textDocument/diagnostic'> = async function* () { yield { kind: 'unchanged' }; };
      // @ts-expect-error only a complete document report may be returned
      const partialReturn: MethodHandler<'textDocument/diagnostic'> = async function* () { return { relatedDocuments: {} }; };
      void [streaming, single, wrapped, promise, nullResult, array, missingId, partialReturn];
    `,
  });
  expect(result).toEqual({ code: 0, output: "" });
});
