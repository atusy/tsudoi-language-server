// The prepare peer the verification runs: tsudoi with this repository's
// package, as a user would configure it, plus two things only a test needs.
//
// - Every request and its answer is appended to the file PREPARE_PEER_LOG
//   names, so the harness can read what kakehashi asked and what it was told.
// - The file PREPARE_PEER_CONTROL names, re-read on every request, can make
//   the peer misbehave (answer late, with an error, or outside the contract),
//   so failure modes are driven without restarting anything.
//
// Imported from source by relative path so the harness needs no build step.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import process from "node:process";
import type { RequestContext, TsudoiConfigFactory } from "@atusy/tsudoi-language-server/types";
import {
  advertiseVirtualDocumentPrepare,
  type PrepareOptions,
  prepareVirtualDocument,
} from "../../../packages/tsudoi-kakehashi-prepare-virtual-document/src/index.ts";
import { isLabelGap, labelGap } from "./placeholders.ts";

/** How the peer answers, read from the control file on every request. */
interface Control {
  /**
   * - `package`: the package's answer (the default)
   * - `null`: `null`, keeping every segment
   * - `error`: an error response
   * - `insert`: an answer that inserts text into content, which the contract forbids
   * - `count`: an answer with one segment too few
   * - `crash`: the peer process exits without answering
   */
  readonly mode?: "package" | "null" | "error" | "insert" | "count" | "crash";
  /** Milliseconds to wait before answering. */
  readonly delayMs?: number;
  /** Only requests whose content includes this text misbehave; others take `package`. */
  readonly onlyWhenContentIncludes?: string;
}

// What fills a gap, by the language of the virtual document. Only an
// interpolation is filled: the host code between two combined strings is a gap
// too, and keeping it leaves the line break that separates them.
const interpolation = (placeholder: string) => (gap: { content: string }) =>
  isLabelGap(gap.content) ? labelGap.code : gap.content.startsWith("${") ? placeholder : undefined;

const options: PrepareOptions = {
  gap: interpolation("0"),
  languages: {
    lua: { gap: interpolation("nil") },
    python: { gap: interpolation("None") },
  },
};

const logPath = process.env.PREPARE_PEER_LOG;
const controlPath = process.env.PREPARE_PEER_CONTROL;

function log(entry: Record<string, unknown>): void {
  if (logPath !== undefined && logPath !== "") {
    appendFileSync(logPath, `${JSON.stringify({ at: Date.now(), pid: process.pid, ...entry })}\n`);
  }
}

function control(): Control {
  if (controlPath === undefined || controlPath === "" || !existsSync(controlPath)) return {};
  try {
    return JSON.parse(readFileSync(controlPath, "utf8")) as Control;
  } catch {
    return {};
  }
}

interface Segment {
  readonly type: string;
  readonly content: string;
}

const segmentsOf = (params: unknown): readonly Segment[] =>
  (params as { segments?: readonly Segment[] } | null)?.segments ?? [];

log({ event: "start" });

const config: TsudoiConfigFactory = () =>
  Promise.resolve({
    methods: {
      initialize: (context) =>
        Promise.resolve(advertiseVirtualDocumentPrepare(context.preparedResult)),
    },
    customMethods: {
      "kakehashi/virtualDocument/prepare": async (context: RequestContext, params: unknown) => {
        const current = control();
        const applies =
          current.onlyWhenContentIncludes === undefined ||
          segmentsOf(params).some((segment) =>
            segment.content.includes(current.onlyWhenContentIncludes ?? ""),
          );
        const mode = applies ? (current.mode ?? "package") : "package";
        if (applies && current.delayMs !== undefined) {
          await new Promise((resolve) => {
            setTimeout(resolve, current.delayMs);
          });
        }
        if (mode === "crash") {
          log({ event: "crash", params });
          process.exit(1);
        }
        if (mode === "error") {
          log({ event: "prepare", mode, params, error: "refusing to prepare" });
          throw new Error("refusing to prepare");
        }
        let answer: { result: unknown };
        if (mode === "null") {
          answer = { result: null };
        } else if (mode === "insert") {
          answer = {
            result: {
              segments: segmentsOf(params).map((segment) =>
                segment.type === "gap"
                  ? { type: "gap" }
                  : {
                      type: "content",
                      changes: [
                        {
                          range: {
                            start: { line: 0, character: 0 },
                            end: { line: 0, character: 0 },
                          },
                          newText: "# not allowed\n",
                        },
                      ],
                    },
              ),
            },
          };
        } else if (mode === "count") {
          answer = {
            result: {
              segments: segmentsOf(params)
                .slice(1)
                .map(({ type }) => ({ type })),
            },
          };
        } else {
          answer = await prepareVirtualDocument(context, params, options);
        }
        log({ event: "prepare", mode, params, result: answer.result });
        return answer;
      },
    },
  });

export default config;
