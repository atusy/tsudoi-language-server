import { describe, expect, test } from "bun:test";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "../helpers/lsp.ts";
import { requireRuntime } from "../helpers/preflight.ts";
import { fixture } from "../helpers/spawn.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";
import {
  actionFinal,
  actionPartial,
  completionFinal,
  completionList,
  completionPartial,
  parkedMarker,
  cleanupMarker,
} from "../fixtures/stream-final-results.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];
await Promise.all(runtimes.map(requireRuntime));

const completionInitialize = {
  ...initializeParams,
  capabilities: {
    textDocument: {
      completion: { completionList: { itemDefaults: ["data", "insertTextFormat"] } },
    },
  },
};

const methods = [
  { method: "textDocument/completion", partial: completionPartial, final: completionFinal },
  { method: "textDocument/codeAction", partial: actionPartial, final: actionFinal },
];

function params(token?: unknown, mode = "yield-array"): unknown {
  return {
    textDocument: { uri: `file:///workspace/${mode}` },
    position: { line: 0, character: 0 },
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    context: { diagnostics: [] },
    ...(token === undefined ? {} : { partialResultToken: token }),
  };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    for (const token of [undefined, "final-list", false]) {
      for (const mode of [
        "list",
        "yield-list",
        "empty-list",
        "yield-empty-list",
        "yield-complete-list",
      ]) {
        test(`completion ${mode} with token ${token ?? "absent"}`, async () => {
          const session = LspSession.start(runtime, fixture("stream-final-results.ts"));
          try {
            await session.request("initialize", completionInitialize);
            session.notify("initialized", {});
            const result = await session.request("textDocument/completion", params(token, mode));
            const streaming = typeof token === "string";
            const partial = mode.startsWith("yield-") ? completionPartial : [];
            const final = mode.includes("empty") ? [] : completionFinal;
            expect(result).toEqual({
              ...completionList,
              isIncomplete: !mode.includes("complete"),
              items: streaming ? final : [...partial, ...final],
            });
            expect(session.progress).toEqual(
              streaming && partial.length > 0 ? [{ token, value: partial }] : [],
            );
          } finally {
            session.dispose();
          }
        });
      }
    }
    for (const entry of methods) {
      for (const token of [undefined, "final-results"]) {
        for (const mode of [
          "yield-array",
          "array",
          "yield-null",
          "null",
          "yield-void",
          "void",
          "empty",
          "yield-empty",
        ]) {
          test(`${entry.method} ${mode} with token ${token ?? "absent"}`, async () => {
            const session = LspSession.start(runtime, fixture("stream-final-results.ts"));
            try {
              await session.request("initialize", initializeParams);
              session.notify("initialized", {});
              const result = await session.request(entry.method, params(token, mode));
              const yielded = mode.startsWith("yield-");
              const partial = mode === "yield-empty" ? [] : entry.partial;
              const returned = mode.endsWith("array") ? entry.final : mode === "empty" ? [] : null;
              expect(result).toEqual(
                token === undefined && yielded ? [...partial, ...(returned ?? [])] : returned,
              );
              expect(session.progress).toEqual(
                token !== undefined && yielded ? [{ token, value: partial }] : [],
              );
            } finally {
              session.dispose();
            }
          });
        }
      }
      for (const token of [undefined, "cancel-final"]) {
        test(`${entry.method} discards a final return after cancellation with token ${token ?? "absent"}`, async () => {
          const session = LspSession.start(runtime, fixture("stream-final-results.ts"));
          try {
            await session.request("initialize", initializeParams);
            session.notify("initialized", {});
            const request = session.issue(entry.method, params(token, "yield-cancel"));
            await session.waitForStderr(parkedMarker);
            session.cancel(request.id);
            expect((await request.response).error?.code).toBe(-32800);
            await session.waitForStderr(cleanupMarker);
            expect(session.progress).toEqual(
              token === undefined ? [] : [{ token, value: entry.partial }],
            );
            expect(
              await session.request<unknown>(entry.method, params(undefined, "array")),
            ).toEqual(entry.final);
          } finally {
            session.dispose();
          }
        });
        for (const mode of [
          "yield-invalid",
          entry.method === "textDocument/completion" ? "yield-invalid-list" : "yield-wrong-list",
        ]) {
          test(`${entry.method} rejects ${mode} with token ${token ?? "absent"}`, async () => {
            const session = LspSession.start(runtime, fixture("stream-final-results.ts"));
            try {
              await session.request("initialize", initializeParams);
              session.notify("initialized", {});
              expect((await session.requestError(entry.method, params(token, mode))).code).toBe(
                -32603,
              );
              await session.waitForStderr("handler returned an invalid result");
              expect(session.progress).toEqual(
                token === undefined ? [] : [{ token, value: entry.partial }],
              );
              expect(
                await session.request<unknown>(entry.method, params(undefined, "array")),
              ).toEqual(entry.final);
            } finally {
              session.dispose();
            }
          });
        }
      }
    }
  });
}
