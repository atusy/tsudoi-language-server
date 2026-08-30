import type { CompletionItem } from "@atusy/tsudoi-language-server/deps/types";
import type { MethodHandler } from "@atusy/tsudoi-language-server/types";
import { NativeShellRuntime } from "./session.ts";

export type NativeShell = "fish" | "xonsh" | "zsh";

export interface UseShellCompletionOptions {
  readonly command?: string;
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly idleTimeoutMs?: number;
  readonly timeoutMs?: number;
}

export interface CompleteShellOptions {
  readonly maxItems?: number;
}

export type ShellCompletion = (
  context: Parameters<MethodHandler<"textDocument/completion">>[0],
  params: Parameters<MethodHandler<"textDocument/completion">>[1],
  options?: CompleteShellOptions,
) => ReturnType<MethodHandler<"textDocument/completion">>;

export interface ShellCompletionRuntime {
  complete(
    shell: NativeShell,
    input: string,
    options: UseShellCompletionOptions & { readonly signal: AbortSignal },
  ): Promise<readonly string[]>;
}

function validateOptions(options: UseShellCompletionOptions): void {
  if ("maxItems" in options) {
    throw new TypeError("maxItems moved to the completion handler's third argument");
  }
  for (const name of ["idleTimeoutMs", "timeoutMs"] as const) {
    const value = options[name];
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new RangeError(`${name} must be a non-negative finite number`);
    }
  }
}

export function makeShellCompletion(
  shell: NativeShell,
  options: UseShellCompletionOptions = {},
  runtime: ShellCompletionRuntime = new NativeShellRuntime(shell, options),
): ShellCompletion {
  validateOptions(options);
  return async function* completeShell(
    context,
    params,
    completionOptions = {},
  ): AsyncGenerator<CompletionItem[], void, void> {
    const maxItems = completionOptions.maxItems === undefined ? 500 : completionOptions.maxItems;
    if (!Number.isSafeInteger(maxItems) || maxItems < 0) {
      throw new RangeError("maxItems must be a non-negative safe integer");
    }
    if (context.signal.aborted || maxItems === 0) {
      return;
    }
    const document = context.tsudoi.documents.get(params.textDocument.uri);
    if (document === undefined) {
      return;
    }
    const line = document.getText({
      start: { line: params.position.line, character: 0 },
      end: params.position,
    });
    const input = line.trimStart();
    if (input === "") {
      return;
    }
    const target = /\S*$/u.exec(line)?.[0] ?? "";
    const start = params.position.character - target.length;
    let candidates: readonly string[];
    try {
      candidates = await runtime.complete(shell, input, { ...options, signal: context.signal });
    } catch (error) {
      if (context.signal.aborted) {
        return;
      }
      throw error;
    }
    if (context.signal.aborted) {
      return;
    }
    const seen = new Set<string>();
    const items: CompletionItem[] = [];
    for (const raw of candidates) {
      const tab = raw.indexOf("\t");
      const word = (tab === -1 ? raw : raw.slice(0, tab)).replace(/\/\/$/u, "/");
      if (word === "" || seen.has(word)) {
        continue;
      }
      seen.add(word);
      const detail = tab === -1 ? undefined : raw.slice(tab + 1);
      items.push({
        label: word,
        ...(detail === "" || detail === undefined ? {} : { detail }),
        filterText: word,
        kind: 1,
        textEdit: {
          range: {
            start: { line: params.position.line, character: start },
            end: params.position,
          },
          newText: word,
        },
      });
      if (items.length >= maxItems) {
        break;
      }
    }
    if (items.length > 0) {
      // COMPLETENESS RULING: the native shell process returns its complete
      // candidate set for this exact line. A later edit triggers a new request.
      yield items;
    }
  };
}

export function useShellCompletion(
  shell: NativeShell,
  options: UseShellCompletionOptions = {},
): ShellCompletion {
  return makeShellCompletion(shell, options);
}
