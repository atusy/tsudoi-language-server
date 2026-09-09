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
      // @ts-expect-error a scalar is not a completion result
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

test("published completion handlers return lists but still yield only arrays", async () => {
  const result = await typeCheckProbe({
    "probe.ts": `
      import type { MethodHandler } from '@atusy/tsudoi-language-server/types';
      import type { CompletionList } from '@atusy/tsudoi-language-server/deps/protocol';
      const list: CompletionList = { isIncomplete: true, items: [], itemDefaults: { data: 'source' } };
      const completion: MethodHandler<'textDocument/completion'> = async function* () {
        yield [{ label: 'partial' }];
        return list;
      };
      const wrapped: MethodHandler<'textDocument/completion'> = async function* (context, params) {
        return yield* completion(context, params);
      };
      // @ts-expect-error completion lists belong in the return slot
      const yieldedList: MethodHandler<'textDocument/completion'> = async function* () { yield list; };
      // @ts-expect-error a completion list is not a code-action result
      const action: MethodHandler<'textDocument/codeAction'> = async function* () { return list; };
      // @ts-expect-error a completion list must declare completeness
      const missingFlag: MethodHandler<'textDocument/completion'> = async function* () { return { items: [] }; };
      void [completion, wrapped, yieldedList, action, missingFlag];
    `,
  });
  expect(result).toEqual({ code: 0, output: "" });
});
