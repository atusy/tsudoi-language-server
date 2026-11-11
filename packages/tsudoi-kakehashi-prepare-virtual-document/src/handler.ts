import type { InitializeResult } from "@atusy/tsudoi-language-server/deps/protocol";
import type { DeepReadonly, RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  type PrepareOptions,
  prepareSegments,
  type VirtualDocumentPrepareParams,
  type VirtualDocumentPrepareResult,
  type VirtualDocumentSegment,
} from "./prepare.ts";

const method = "kakehashi/virtualDocument/prepare";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function refuse(what: string): never {
  throw new TypeError(`${method}: ${what}`);
}

function languageOf(params: Record<string, unknown>, key: string): string {
  const document = params[key];
  if (!isObject(document) || typeof document.languageId !== "string") {
    return refuse(`params.${key}.languageId must be a string`);
  }
  return document.languageId;
}

/**
 * Reads a request off the wire, refusing one whose shape this handler does not
 * know. Refusing is the answer that keeps kakehashi honest: it leaves the
 * document unsent, where `null` would send it unprepared under the name of a
 * peer that never read it.
 */
function read(params: unknown): VirtualDocumentPrepareParams {
  if (!isObject(params)) return refuse("params must be an object");
  const languageId = languageOf(params, "textDocument");
  const hostLanguageId = languageOf(params, "hostTextDocument");
  if (!Array.isArray(params.segments)) return refuse("params.segments must be an array");
  const segments = params.segments.map((segment: unknown, index): VirtualDocumentSegment => {
    if (
      !isObject(segment) ||
      (segment.type !== "content" && segment.type !== "gap") ||
      typeof segment.content !== "string"
    ) {
      return refuse(
        `params.segments[${String(index)}] must be { type: "content" | "gap", content: string }`,
      );
    }
    return { type: segment.type, content: segment.content };
  });
  const textDocument = params.textDocument as Record<string, unknown>;
  const hostTextDocument = params.hostTextDocument as Record<string, unknown>;
  return {
    textDocument: {
      uri: typeof textDocument.uri === "string" ? textDocument.uri : "",
      languageId,
      version: typeof textDocument.version === "number" ? textDocument.version : 0,
    },
    hostTextDocument: {
      uri: typeof hostTextDocument.uri === "string" ? hostTextDocument.uri : "",
      languageId: hostLanguageId,
    },
    segments,
  };
}

/**
 * Answers `kakehashi/virtualDocument/prepare`. Register it under that name in
 * a config's `customMethods`; `options` is the third argument, so the handler
 * can be registered as it is when the defaults suit.
 *
 * The context is not read: the answer is a function of the request and the
 * options alone, which is what lets kakehashi ask again after every edit and
 * cache what it was told.
 */
export function prepareVirtualDocument(
  _context: RequestContext,
  params: unknown,
  options?: PrepareOptions,
): Promise<{ result: VirtualDocumentPrepareResult }> {
  try {
    return Promise.resolve({ result: prepareSegments(read(params), options) });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Adds `capabilities.experimental.kakehashi.virtualDocumentPrepare` to an
 * `initialize` result. kakehashi asks a configured peer to prepare documents
 * only once the peer's handshake says so; tsudoi advertises nothing for a
 * custom method on its own.
 */
export function advertiseVirtualDocumentPrepare(
  prepared: DeepReadonly<InitializeResult>,
): DeepReadonly<InitializeResult> {
  const experimental: unknown = prepared.capabilities.experimental;
  const kakehashi: unknown = isObject(experimental) ? experimental.kakehashi : undefined;
  return {
    ...prepared,
    capabilities: {
      ...prepared.capabilities,
      experimental: {
        ...(isObject(experimental) ? experimental : {}),
        kakehashi: { ...(isObject(kakehashi) ? kakehashi : {}), virtualDocumentPrepare: true },
      },
    },
  };
}
