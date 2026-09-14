import { describe, expect, test } from "bun:test";
import {
  bunRuntime,
  denoRuntime,
  initializeParams,
  LspSession,
  type Runtime,
} from "../helpers/lsp.ts";
import { requireRuntime } from "../helpers/preflight.ts";
import { fixture } from "../helpers/spawn.ts";
import { report, partial, parked, released } from "../fixtures/diagnostic-stream.ts";
import { applySuiteDeadline } from "../helpers/deadline.ts";

applySuiteDeadline();
const runtimes = [bunRuntime, denoRuntime];
await Promise.all(runtimes.map(requireRuntime));

async function start(runtime: Runtime): Promise<LspSession> {
  const session = LspSession.start(runtime, fixture("diagnostic-stream.ts"));
  try {
    await session.request("initialize", {
      ...initializeParams,
      capabilities: { textDocument: { diagnostic: { relatedDocumentSupport: true } } },
    });
    session.notify("initialized", {});
    return session;
  } catch (error) {
    session.dispose();
    throw error;
  }
}

function params(mode: string, token?: unknown) {
  return {
    textDocument: { uri: `file:///workspace/${mode}` },
    ...(token === undefined ? {} : { partialResultToken: token }),
  };
}

for (const runtime of runtimes) {
  describe(runtime.name, () => {
    for (const token of ["diagnostic", 0, "", undefined, false]) {
      for (const mode of ["full", "unchanged", "return"]) {
        test(`${mode} diagnostics with token ${JSON.stringify(token)}`, async () => {
          const session = await start(runtime);
          try {
            const initial =
              mode === "unchanged" ? { kind: "unchanged", resultId: "current-1" } : report;
            const streaming = typeof token === "string" || typeof token === "number";
            const result = await session.request<unknown>(
              "textDocument/diagnostic",
              params(mode, token),
            );
            expect(result).toEqual(
              mode === "return" ? report : streaming ? null : { ...initial, ...partial },
            );
            expect(session.progress).toEqual(
              mode === "return" || !streaming
                ? []
                : [
                    { token, value: initial },
                    { token, value: partial },
                  ],
            );
          } finally {
            session.dispose();
          }
        });
      }
    }
    for (const token of [undefined, "errors"]) {
      for (const mode of [
        "empty",
        "null",
        "partial-first",
        "double-report",
        "yield-return",
        "throw",
      ]) {
        test(`rejects ${mode} with token ${token ?? "absent"} and keeps serving`, async () => {
          const session = await start(runtime);
          try {
            expect(
              (await session.requestError("textDocument/diagnostic", params(mode, token))).code,
            ).toBe(-32603);
            const sentInitial = ["double-report", "yield-return", "throw"].includes(mode);
            expect(session.progress).toEqual(
              token !== undefined && sentInitial ? [{ token, value: report }] : [],
            );
            expect(
              await session.request<unknown>("textDocument/diagnostic", params("return")),
            ).toEqual(report);
          } finally {
            session.dispose();
          }
        });
      }
      for (const mode of ["cancel", "ignore-cancel"]) {
        test(`cancels ${mode}: a pending diagnostic pull and discards cleanup output with token ${token ?? "absent"}`, async () => {
          const session = await start(runtime);
          try {
            const request = session.issue("textDocument/diagnostic", params(mode, token));
            await session.waitForStderr(parked);
            session.cancel(request.id);
            expect((await request.response).error?.code).toBe(-32800);
            session.notify("diagnostic/release", {});
            await session.waitForStderr(released);
            expect(session.progress).toEqual(token === undefined ? [] : [{ token, value: report }]);
            expect(
              await session.request<unknown>("textDocument/diagnostic", params("return")),
            ).toEqual(report);
          } finally {
            session.dispose();
          }
        });
      }
    }
    test("delivers the initial report before related computation finishes", async () => {
      const session = await start(runtime);
      try {
        const request = session.issue("textDocument/diagnostic", params("gate", "incremental"));
        await session.waitForStderr(parked);
        await session.waitForProgress(1);
        expect(session.progress).toEqual([{ token: "incremental", value: report }]);
        session.notify("diagnostic/release", {});
        expect((await request.response).result).toBeNull();
        expect(session.progress).toEqual([
          { token: "incremental", value: report },
          { token: "incremental", value: partial },
        ]);
      } finally {
        session.dispose();
      }
    });
  });
}
