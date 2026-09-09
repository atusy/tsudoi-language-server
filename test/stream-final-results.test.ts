import { describe, expect, test } from "bun:test";
import { bunRuntime, denoRuntime, initializeParams, LspSession } from "./helpers/lsp.ts";
import { requireRuntime } from "./helpers/preflight.ts";
import { fixture } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import {
  actionFinal,
  actionPartial,
  completionFinal,
  completionPartial,
} from "./fixtures/stream-final-results.ts";

applySuiteDeadline();

const runtimes = [bunRuntime, denoRuntime];
await Promise.all(runtimes.map(requireRuntime));

const methods = [
  { method: "textDocument/completion", partial: completionPartial, final: completionFinal },
  { method: "textDocument/codeAction", partial: actionPartial, final: actionFinal },
];

function params(token?: string, mode = "yield-array"): unknown {
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
      test(`${entry.method} appends returned items after yielded items without a token`, async () => {
        const session = LspSession.start(runtime, fixture("stream-final-results.ts"));
        try {
          await session.request("initialize", initializeParams);
          session.notify("initialized", {});
          const result = await session.request(entry.method, params());
          expect(result).toEqual([...entry.partial, ...entry.final]);
          expect(session.progress).toEqual([]);
        } finally {
          session.dispose();
        }
      });
    }
  });
}
