import { expect, test } from "bun:test";
import type { CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  makeShellCompletion,
  type ShellCompletionRuntime,
  type UseShellCompletionOptions,
} from "../src/shell.ts";

function request(line: string): { context: RequestContext; params: CompletionParams } {
  const uri = "file:///buffer.sh";
  return {
    context: {
      signal: new AbortController().signal,
      tsudoi: { documents: { get: () => ({ getText: () => line }) } },
    } as unknown as RequestContext,
    params: {
      textDocument: { uri },
      position: { line: 0, character: line.length },
    },
  };
}

test("uses the shell line and replaces its last token with native candidates", async () => {
  let invocation: { shell: string; input: string; options: UseShellCompletionOptions } | undefined;
  const runtime: ShellCompletionRuntime = {
    complete: (shell, input, options) => {
      invocation = { shell, input, options };
      return Promise.resolve([
        "checkout\tCheckout and switch to a branch",
        "cherry",
        "checkout\tduplicate",
        "",
      ]);
    },
  };
  const handler = makeShellCompletion("fish", { cwd: "/project" }, runtime);
  const { context, params } = request("  git che");

  const answer = await handler(context, params, { maxItems: 1 }).next();

  expect(invocation).toMatchObject({
    shell: "fish",
    input: "git che",
    options: { cwd: "/project" },
  });
  expect(answer.done).toBe(false);
  expect(answer.value).toEqual([
    {
      label: "checkout",
      detail: "Checkout and switch to a branch",
      filterText: "checkout",
      kind: 1,
      textEdit: {
        range: {
          start: { line: 0, character: 6 },
          end: { line: 0, character: 9 },
        },
        newText: "checkout",
      },
    },
  ]);
});

test("cancellation while the shell is completing yields no answer", async () => {
  const controller = new AbortController();
  const runtime: ShellCompletionRuntime = {
    complete: (_shell, _input, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            const error = new Error("cancelled");
            error.name = "AbortError";
            reject(error);
          },
          { once: true },
        );
      }),
  };
  const handler = makeShellCompletion("fish", {}, runtime);
  const requested = request("git che");
  requested.context = { ...requested.context, signal: controller.signal };

  const answer = handler(requested.context, requested.params).next();
  controller.abort();

  expect(await answer).toEqual({ done: true, value: undefined });
});

test("a zero candidate bound does not invoke the shell", async () => {
  let invoked = false;
  const runtime: ShellCompletionRuntime = {
    complete: () => {
      invoked = true;
      return Promise.resolve(["alpha"]);
    },
  };
  const handler = makeShellCompletion("fish", {}, runtime);
  const { context, params } = request("echo a");

  expect(await handler(context, params, { maxItems: 0 }).next()).toEqual({
    done: true,
    value: undefined,
  });
  expect(invoked).toBe(false);
});

test.each([
  [{ timeoutMs: Number.POSITIVE_INFINITY }, "timeoutMs"],
  [{ idleTimeoutMs: -1 }, "idleTimeoutMs"],
] as const)("rejects an invalid numeric option", (options, name) => {
  expect(() =>
    makeShellCompletion("fish", options, { complete: () => Promise.resolve([]) }),
  ).toThrow(name);
});

test.each([-1, 1.5])("rejects an invalid per-request candidate bound", async (maxItems) => {
  const handler = makeShellCompletion("fish", {}, { complete: () => Promise.resolve([]) });
  const { context, params } = request("echo a");

  expect(handler(context, params, { maxItems }).next()).rejects.toThrow("maxItems");
});
