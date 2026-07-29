import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { Tsudoi, TsudoiConfig, TsudoiConfigFactory } from "./types.ts";

/** A config problem the user can act on. The CLI maps it to stderr plus exit 1. */
export class ConfigError extends Error {}

/**
 * Resolves --config from argv, imports it, and calls its default-exported
 * factory. Every failure along the way surfaces as a ConfigError.
 */
export async function loadConfig(argv: readonly string[], tsudoi: Tsudoi): Promise<TsudoiConfig> {
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
    config = await (factory as TsudoiConfigFactory)(tsudoi);
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
 * supplying resolve alone would either hang a resolveProvider off a completion
 * provider that does not exist, or worse BRING ONE INTO BEING and invite
 * completion requests tsudoi can only answer `null`. It is also incoherent on
 * its own terms: resolve fills in an item, and nothing in such a config can
 * produce one.
 *
 * AT CONFIG LOAD RATHER THAN AT COMPILE TIME, and that is a ruling rather than
 * the easy path. Expressing it in `TsudoiConfig` would put a conditional
 * constraint ON THE PUBLISHED SURFACE, where the reader is a stranger with one
 * file and no context, and a conditional-type diagnostic reads to them as noise
 * about tsudoi's internals rather than as a sentence naming what they must add.
 * The `gate` field on src/notifications.ts's table is a compile error precisely
 * because that table is TSUDOI'S OWN, authored by maintainers; `TsudoiConfig` is
 * authored by people this project cannot see, and PUBLISHED-SURFACE LEGIBILITY
 * OUTRANKS CATCHING IT ONE STAGE EARLIER. Second reason: a type-level guard's
 * negative control is itself a type-level probe, and this repository has twice
 * measured that class defeated -- by skipLibCheck, and by `Omit`'s silent no-op
 * on a key that is not there.
 *
 * IT COSTS NOTHING ON THE STDOUT SIDE, which is the property a runtime refusal
 * has to be checked against: src/cli.ts calls this before `startServer`, so no
 * protocol byte has been written when it throws, and the reason leaves on stderr
 * under the `tsudoi:` prefix like every other config failure.
 *
 * NOT A DEPENDENCY MECHANISM, and deliberately not: there is EXACTLY ONE
 * instance in the table. A general `requires` field would be a shape invented
 * for a set of size one. It generalises when a second arrives.
 */
function requireCompletionBesideResolve(config: TsudoiConfig, absolutePath: string): void {
  const methods = config.methods;
  if (methods?.["completionItem/resolve"] === undefined) {
    return;
  }
  if (methods["textDocument/completion"] !== undefined) {
    return;
  }
  // BOTH METHOD NAMES, SPELLED OUT: the message is read by someone holding
  // their own config and nothing else, so it has to name the handler they wrote
  // and the handler they must add, in the spelling their file uses.
  throw new ConfigError(
    `config ${absolutePath} supplies a completionItem/resolve handler with no ` +
      `textDocument/completion handler; completionItem/resolve resolves items that ` +
      `textDocument/completion produced, so tsudoi will not advertise one without the other`,
  );
}
