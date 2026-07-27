import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createTsudoi } from "./tsudoi.ts";
import type { TsudoiConfig, TsudoiConfigFactory } from "./types.ts";

// Setting exitCode rather than calling process.exit lets the stderr pipe drain;
// process.exit can truncate it. Nothing holds the event loop open yet.
function fail(message: string): void {
  process.stderr.write(`tsudoi: ${message}\n`);
  process.exitCode = 1;
}

const args = process.argv.slice(2);
const flagIndex = args.indexOf("--config");
const configPath = flagIndex === -1 ? undefined : args[flagIndex + 1];

if (configPath === undefined) {
  fail("--config <path> is required");
} else {
  const absolutePath = resolve(process.cwd(), configPath);
  let module: { default?: unknown } | undefined;
  try {
    // pathToFileURL is what makes this resolve identically under bun and deno.
    module = (await import(pathToFileURL(absolutePath).href)) as { default?: unknown };
  } catch (cause) {
    fail(`failed to load config ${absolutePath}\n  ${String(cause)}`);
  }

  let config: TsudoiConfig | undefined;
  if (module !== undefined) {
    const factory = module.default;
    if (factory === undefined) {
      fail(`config ${absolutePath} has no default export`);
    } else if (typeof factory !== "function") {
      fail(`the default export of config ${absolutePath} is not a function`);
    } else {
      try {
        config = await (factory as TsudoiConfigFactory)(createTsudoi());
      } catch (cause) {
        fail(`the config factory in ${absolutePath} failed\n  ${String(cause)}`);
      }
    }
  }
}
