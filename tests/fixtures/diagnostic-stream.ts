import process from "node:process";
import type { TsudoiConfig } from "../../packages/tsudoi-language-server/src/types.ts";
import type { DocumentDiagnosticReport } from "../../packages/tsudoi-language-server/src/deps/protocol.ts";

export const report = { kind: "full" as const, resultId: "current-1", items: [] };
export const partial = {
  relatedDocuments: { "file:///related.ts": { kind: "full" as const, items: [] } },
};
export const parked = "diagnostic-stream: parked";
export const released = "diagnostic-stream: released";

export default (): TsudoiConfig => {
  let release: (() => void) | undefined;
  return {
    customMethods: {
      "diagnostic/release": async () => {
        release?.();
      },
    },
    methods: {
      "textDocument/diagnostic": async function* (context, params) {
        const mode = params.textDocument.uri.split("/").at(-1);
        if (mode === "return") return report;
        if (mode === "empty") return;
        if (mode === "null") return null as unknown as DocumentDiagnosticReport;
        if (mode === "partial-first") {
          yield partial;
          return;
        }
        if (mode === "unchanged") {
          yield { kind: "unchanged", resultId: "current-1" };
        } else {
          yield report;
        }
        if (mode === "gate") {
          await new Promise<void>((resolve) => {
            release = resolve;
            process.stderr.write(`${parked}\n`);
          });
        }
        if (mode === "double-report") {
          yield report;
          return;
        }
        if (mode === "yield-return") return report;
        if (mode === "throw") throw new Error("diagnostic failure");
        if (mode === "cancel" || mode === "ignore-cancel") {
          try {
            await new Promise<void>((resolve) => {
              release = resolve;
              process.stderr.write(`${parked}\n`);
              if (mode === "ignore-cancel") return;
              if (context.signal.aborted) resolve();
              else context.signal.addEventListener("abort", () => resolve(), { once: true });
            });
            yield partial;
            return report;
          } finally {
            yield partial;
            process.stderr.write(`${released}\n`);
            // eslint-disable-next-line no-unsafe-finally -- Probe that cleanup return values are discarded.
            return report;
          }
        }
        yield partial;
      },
    },
  };
};
