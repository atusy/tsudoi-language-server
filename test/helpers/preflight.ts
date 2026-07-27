import { spawn } from "node:child_process";
import type { Runtime } from "./lsp.ts";

function missingRuntimeMessage(runtime: Runtime): string {
  return [
    `The ${runtime.name} runtime is required but \`${runtime.command} --version\` could not be run.`,
    'PBI-1 accepts "The CLI starts under both bun and deno" only by spawning the real',
    "runtime, so a missing runtime fails this suite instead of skipping it.",
    `Install ${runtime.name}: ${runtime.installUrl}`,
  ].join("\n");
}

/**
 * Resolves when the runtime can be executed, and otherwise rejects with a
 * message the reader can act on rather than a raw ENOENT from spawn.
 */
export function requireRuntime(runtime: Runtime): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(runtime.command, ["--version"], { stdio: "ignore" });
    child.on("error", () => {
      reject(new Error(missingRuntimeMessage(runtime)));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(missingRuntimeMessage(runtime)));
    });
  });
}
