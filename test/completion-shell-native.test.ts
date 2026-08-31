import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { RequestContext } from "@atusy/tsudoi-language-server/types";
import { useShellCompletion } from "../packages/tsudoi-completion-shell/src/index.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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

test("fish returns its configured native candidates", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-shell-fish-"));
  const configHome = join(root, "config");
  mkdirSync(join(configHome, "fish"), { recursive: true });
  writeFileSync(
    join(configHome, "fish", "config.fish"),
    "complete -c tsudoi-probe -f -a alpha -d 'first candidate'\n" +
      "complete -c tsudoi-probe -f -a alpine -d 'second candidate'\n",
  );
  try {
    const handler = useShellCompletion("fish", {
      cwd: root,
      env: { XDG_CONFIG_HOME: configHome },
      idleTimeoutMs: 20,
    });
    const first = request("tsudoi-probe al");
    const second = request("tsudoi-probe alp");

    const [answer, concurrent] = await Promise.all([
      handler(first.context, first.params).next(),
      handler(second.context, second.params).next(),
    ]);

    expect(answer.done).toBe(false);
    expect(answer.value?.map(({ label, detail }) => ({ label, detail }))).toEqual([
      { label: "alpha", detail: "first candidate" },
      { label: "alpine", detail: "second candidate" },
    ]);
    expect(concurrent.value?.map(({ label }) => label)).toEqual(["alpha", "alpine"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fish returns command candidates for an empty prefix", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-shell-fish-empty-"));
  const configHome = join(root, "config");
  mkdirSync(join(configHome, "fish"), { recursive: true });
  writeFileSync(join(configHome, "fish", "config.fish"), "function tsudoi-empty-probe\nend\n");
  try {
    const handler = useShellCompletion("fish", {
      cwd: root,
      env: { XDG_CONFIG_HOME: configHome },
      idleTimeoutMs: 20,
    });
    const { context, params } = request("");

    const answer = await handler(context, params, {
      maxItems: 10_000,
      minQueryLength: 0,
    }).next();

    expect(answer.done).toBe(false);
    expect(answer.value?.map(({ label }) => label)).toContain("tsudoi-empty-probe");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("zsh returns native command candidates", async () => {
  const root = mkdtempSync(join(tmpdir(), "tsudoi-shell-zsh-"));
  try {
    const handler = useShellCompletion("zsh", {
      cwd: root,
      env: { XDG_CACHE_HOME: join(root, "cache") },
      idleTimeoutMs: 20,
      timeoutMs: 5_000,
    });
    const { context, params } = request("git che");

    const answer = await handler(context, params).next();

    expect(answer.done).toBe(false);
    expect(answer.value?.map((item) => item.label)).toContain("checkout");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
