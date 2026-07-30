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

  // `unknown`, and the cast is DELAYED until the guard below has run. Declaring
  // this as `TsudoiConfig` would make every check on it dead code to the type
  // checker -- `typeof config !== "object"` does not compile against a type that
  // says it is one -- so the type would be asserting exactly the thing this
  // function exists to establish.
  let returned: unknown;
  try {
    returned = await (factory as TsudoiConfigFactory)();
  } catch (cause) {
    throw new ConfigError(`the config factory in ${absolutePath} failed\n  ${String(cause)}`);
  }
  // OUTSIDE THE `try` ABOVE, and that placement is the whole of whether the
  // message is usable: raised inside it, this ConfigError would be caught by the
  // handler one line up and re-wrapped as `the config factory failed\n
  // ConfigError: ...` -- a report that the author's code threw, about a factory
  // that returned perfectly well.
  //
  // WHAT IT COSTS TO OMIT, which is not `a worse message`: nothing else looks at
  // this value before it is dereferenced, so `export default () => {};` -- the
  // arrow whose braces are a BODY and not an object literal, and its `async () =>
  // { methods: {...} }` twin where `methods:` is silently a LABEL -- reached
  // requireCompletionBesideResolve and raised a TypeError. A TypeError is not a
  // ConfigError, so src/cli.ts rethrows it and the author gets a raw stack with
  // no `tsudoi: ` prefix and no config path: the one contract every case in
  // test/cli.test.ts asserts, broken by the shortest way to write the mistake.
  //
  // AND THE PRIMITIVE ARM IS THE WORSE HALF, though it fails no assertion at
  // all: `() => 5` has no `methods` to read, so nothing threw, loadConfig
  // SUCCEEDED, and the server came up advertising no capability whatever. A
  // silently inert server is a bug report about tsudoi that the author cannot
  // begin to diagnose.
  //
  // THE TYPE IS NAMED, NEVER THE VALUE: `${returned as string}` on a symbol
  // throws, turning a diagnostic into a second failure, and a config object
  // printed whole would bury the sentence. `null` is spelled out because
  // `typeof null` is `"object"`, which is the one answer that would confuse the
  // reader it is written for.
  if (typeof returned !== "object" || returned === null) {
    throw new ConfigError(
      `the config factory in ${absolutePath} returned ${returned === null ? "null" : typeof returned} ` +
        `instead of a config object; a factory must return the config, and an arrow ` +
        `function written \`() => { ... }\` returns nothing at all`,
    );
  }
  const config = returned as TsudoiConfig;
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
