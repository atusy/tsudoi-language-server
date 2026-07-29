import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { TsudoiConfig, TsudoiConfigFactory } from "./types.ts";

/** A config problem the user can act on. The CLI maps it to stderr plus exit 1. */
export class ConfigError extends Error {}

/**
 * Resolves --config from argv, imports it, and calls its default-exported
 * factory. Every failure along the way surfaces as a ConfigError.
 */
export async function loadConfig(argv: readonly string[]): Promise<TsudoiConfig> {
  const flagIndex = argv.indexOf("--config");
  const configPath = flagIndex === -1 ? undefined : argv[flagIndex + 1];
  if (configPath === undefined) {
    throw new ConfigError("--config <path> is required");
  }

  const absolutePath = resolve(process.cwd(), configPath);
  let module: { default?: unknown };
  try {
    // pathToFileURL is what makes this resolve identically under bun and deno.
    module = (await import(pathToFileURL(absolutePath).href)) as { default?: unknown };
  } catch (cause) {
    throw new ConfigError(`failed to load config ${absolutePath}\n  ${String(cause)}`);
  }

  const factory = module.default;
  if (factory === undefined) {
    throw new ConfigError(`config ${absolutePath} has no default export`);
  }
  if (typeof factory !== "function") {
    throw new ConfigError(`the default export of config ${absolutePath} is not a function`);
  }

  let config: TsudoiConfig;
  try {
    config = await (factory as TsudoiConfigFactory)();
  } catch (cause) {
    throw new ConfigError(`the config factory in ${absolutePath} failed\n  ${String(cause)}`);
  }
  requireCompletionBesideResolve(config, absolutePath);
  return config;
}

/**
 * Refuses a config that resolves completion items without producing any.
 *
 * WHAT IS PROTECTED: tsudoi never tells a client it can complete when no handler
 * can. `completionItem/resolve` contributes `completionProvider.resolveProvider`
 * -- a key INSIDE the capability `textDocument/completion` owns -- so a config
 * supplying resolve alone would bring a completion provider into being and
 * invite requests tsudoi can only answer `null`.
 *
 * AT CONFIG LOAD RATHER THAN IN THE TYPE, deliberately: expressing it in
 * `TsudoiConfig` would put a conditional constraint on the PUBLISHED surface,
 * where the reader is a stranger with one file, and a conditional-type
 * diagnostic reads as noise about tsudoi's internals rather than a sentence
 * naming what they must add. src/cli.ts calls this before `startServer`, so no
 * protocol byte has been written when it throws.
 *
 * NOT A GENERAL `requires` MECHANISM: there is exactly one instance. It
 * generalises when a second arrives.
 */
function requireCompletionBesideResolve(config: TsudoiConfig, absolutePath: string): void {
  const methods = config.methods;
  if (methods?.["completionItem/resolve"] === undefined) {
    return;
  }
  if (methods["textDocument/completion"] !== undefined) {
    return;
  }
  // Both method names spelled out: the reader holds their own config and nothing
  // else, so the message names what they wrote and what they must add.
  throw new ConfigError(
    `config ${absolutePath} supplies a completionItem/resolve handler with no ` +
      `textDocument/completion handler; completionItem/resolve resolves items that ` +
      `textDocument/completion produced, so tsudoi will not advertise one without the other`,
  );
}
