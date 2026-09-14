import { expect, test } from "bun:test";
import { DiagnosticResults } from "./diagnostic-results.ts";

// Frozen reports and maps make accidental mutation fail where it occurs.
test("aggregation preserves current diagnostics and replaces related reports without mutation", () => {
  const current = {
    kind: "full" as const,
    resultId: "current",
    items: [
      {
        message: "current warning",
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      },
    ],
    relatedDocuments: Object.freeze({
      "file:///a": Object.freeze({ kind: "full" as const, items: [], resultId: "a1" }),
      "file:///keep": Object.freeze({ kind: "unchanged" as const, resultId: "keep" }),
    }),
  };
  Object.freeze(current.items);
  Object.freeze(current);
  const update = Object.freeze({
    relatedDocuments: Object.freeze({
      "file:///a": Object.freeze({ kind: "unchanged" as const, resultId: "a2" }),
      ["__proto__"]: Object.freeze({ kind: "full" as const, items: [] }),
    }),
  });
  const results = new DiagnosticResults(false);
  results.accept(current);
  results.accept(update);
  expect(results.finish(undefined)).toEqual({
    ...current,
    relatedDocuments: {
      ...current.relatedDocuments,
      ...update.relatedDocuments,
    },
  });
  expect(current.relatedDocuments["file:///a"].resultId).toBe("a1");
});

for (const streaming of [false, true]) {
  test(`rejects malformed diagnostic envelopes when streaming=${streaming}`, () => {
    for (const value of [
      null,
      [],
      {},
      { kind: "full" },
      { kind: "unchanged" },
      { kind: "full", items: [], resultId: 7 },
      { kind: "full", items: [], relatedDocuments: [] },
    ]) {
      expect(() => new DiagnosticResults(streaming).accept(value)).toThrow("report first");
      expect(() => new DiagnosticResults(streaming).finish(value)).toThrow(
        "return a document report",
      );
    }
    for (const value of [
      null,
      [],
      {},
      { relatedDocuments: [] },
      { relatedDocuments: { "file:///a": { kind: "unchanged" } } },
    ]) {
      const results = new DiagnosticResults(streaming);
      results.accept({ kind: "full", items: [] });
      expect(() => results.accept(value)).toThrow("related-document partials");
    }
  });
}
