import { expect, test } from "bun:test";
import type { InitializeResult } from "@atusy/tsudoi-language-server/deps/protocol";
import type { DeepReadonly, RequestContext } from "@atusy/tsudoi-language-server/types";
import { advertiseVirtualDocumentPrepare, prepareVirtualDocument } from "./handler.ts";

// The handler reads nothing from its context: the answer is the request's.
const context = {} as RequestContext;

const params = {
  textDocument: { uri: "file:///w/virtual.sh", languageId: "bash", version: 3 },
  hostTextDocument: { uri: "file:///w/flake.nix", languageId: "nix" },
  segments: [
    { type: "content", content: "\n    echo " },
    { type: "gap", content: "${toString cfg.port}" },
    { type: "content", content: "\n  " },
  ],
};

test("the answer is wrapped as a custom request's result", async () => {
  expect(await prepareVirtualDocument(context, params, { gap: "0" })).toEqual({
    result: {
      segments: [
        {
          type: "content",
          changes: [
            {
              range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } },
              newText: "",
            },
            {
              range: { start: { line: 1, character: 0 }, end: { line: 1, character: 4 } },
              newText: "",
            },
          ],
        },
        { type: "gap", content: "0" },
        {
          type: "content",
          changes: [
            {
              range: { start: { line: 1, character: 0 }, end: { line: 1, character: 2 } },
              newText: "",
            },
          ],
        },
      ],
    },
  });
});

test("without options the default rule applies, and an unchanged document answers null", async () => {
  const unchanged = { ...params, segments: [{ type: "content", content: "x = 1\n" }] };

  expect(await prepareVirtualDocument(context, unchanged)).toEqual({ result: null });
});

// kakehashi reads an error as the peer failing and does not send the document:
// a request this handler cannot read must not be answered as if it were.
for (const [name, malformed] of [
  ["no params", undefined],
  ["params that are not an object", "text"],
  ["no segments", { ...params, segments: undefined }],
  ["a segment of an unknown type", { ...params, segments: [{ type: "hole", content: "" }] }],
  ["a segment without text", { ...params, segments: [{ type: "content" }] }],
  ["no virtual document language", { ...params, textDocument: { uri: "file:///w/a" } }],
  ["no host document", { ...params, hostTextDocument: undefined }],
] as const) {
  test(`a request with ${name} is refused, not answered`, async () => {
    const answer = prepareVirtualDocument(context, malformed);

    await expect(answer).rejects.toThrow(/kakehashi\/virtualDocument\/prepare/);
  });
}

test("a throwing gap rule fails the request", async () => {
  const answer = prepareVirtualDocument(context, params, {
    gap: () => {
      throw new Error("no placeholder for this");
    },
  });

  await expect(answer).rejects.toThrow("no placeholder for this");
});

test("advertising adds the capability kakehashi looks for and keeps everything else", () => {
  const prepared: DeepReadonly<InitializeResult> = Object.freeze({
    capabilities: Object.freeze({
      hoverProvider: true,
      experimental: Object.freeze({
        other: 1,
        kakehashi: Object.freeze({ somethingElse: true }),
      }),
    }),
    serverInfo: Object.freeze({ name: "tsudoi" }),
  });

  expect(advertiseVirtualDocumentPrepare(prepared)).toEqual({
    capabilities: {
      hoverProvider: true,
      experimental: {
        other: 1,
        kakehashi: { somethingElse: true, virtualDocumentPrepare: true },
      },
    },
    serverInfo: { name: "tsudoi" },
  });
  expect(prepared.capabilities.experimental).toEqual({
    other: 1,
    kakehashi: { somethingElse: true },
  });
});

test("advertising works on a result with no experimental capabilities", () => {
  expect(advertiseVirtualDocumentPrepare({ capabilities: {} })).toEqual({
    capabilities: { experimental: { kakehashi: { virtualDocumentPrepare: true } } },
  });
});
