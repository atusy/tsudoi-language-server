// Relative with .ts, and Bun-free: deno executes this file too.
import process from "node:process";
import type { Hover, HoverParams } from "vscode-languageserver-protocol";
import type {
  RequestContext,
  TsudoiConfig,
} from "../../packages/tsudoi-language-server/src/types.ts";

/** The buffer text the test writes to let a handler past its gate. */
export const gateOpen = "release";

/** What tells two concurrent requests apart: the line each asks about. */
export function tagOf(line: number): string {
  return `line-${line}`;
}

/**
 * Written at handler ENTRY, carrying the signal's state at that moment. The
 * transition from not-aborted to aborted is what makes cancellation observable;
 * a final state alone would read the same for a signal aborted by anything.
 */
export function enteredMarker(tag: string, aborted: boolean): string {
  return `hover-cancellable: entered ${tag} aborted=${aborted}`;
}

/** Written from the signal's own abort event -- a standard Web API, so Deno-safe. */
export function abortedMarker(tag: string): string {
  return `hover-cancellable: aborted ${tag}`;
}

export function hoverFor(tag: string): Hover {
  return { contents: { kind: "markdown", value: `**${tag}** を最後まで答えました` } };
}

/**
 * Parks until the test opens the gate OR the signal aborts. Stopping on abort
 * is the whole user story: work nobody will read is abandoned.
 */
export default (): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/hover": async (
        context: RequestContext,
        params: HoverParams,
      ): Promise<Hover> => {
        const tag = tagOf(params.position.line);
        process.stderr.write(`${enteredMarker(tag, context.signal.aborted)}\n`);
        context.signal.addEventListener("abort", () => {
          process.stderr.write(`${abortedMarker(tag)}\n`);
        });

        // Awaited polling, not a busy loop: awaiting hands the event loop back
        // so the server can process the notification that opens this gate.
        while (
          context.tsudoi.documents.get(params.textDocument.uri)?.getText() !== gateOpen &&
          !context.signal.aborted
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }

        return hoverFor(tag);
      },
    },
  });
};
