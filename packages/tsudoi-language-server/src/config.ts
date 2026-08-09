import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
// THE ENUMERATION OF WHAT TSUDOI SERVES, taken from the TABLE rather than
// restated here, so a method added there joins this check by existing. Only the
// keys are read. NOT A CYCLE: src/methods.ts imports src/types.ts and
// src/notifications.ts FOR TYPES ONLY and nothing in src/ imports this file back.
//
// `BY EXISTING` IS TRUE OF A TABLE ROW AND OF NOTHING ELSE. A key of
// `ConfigMethodMap` that is NOT a row joins nothing here, because this is the
// only enumeration read: it needs a read written for it by hand, as
// `initialize`'s is below, and until one exists the key is copied nowhere and
// refused nowhere.
import { requestEntries } from "./methods.ts";
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
    // pathToFileURL is what makes this resolve identically under bun and deno,
    // and nothing reddens if you hand `import` the bare path: both runtimes take
    // a POSIX absolute path, and a Windows one is where the two spellings part.
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

  // `unknown`, and nothing reddens if you annotate it `TsudoiConfig`: that would
  // make every check below dead code to the type checker -- `typeof config !==
  // "object"` does not compile against a type that says it is one -- so the
  // annotation would assert exactly what this function exists to establish.
  let returned: unknown;
  try {
    returned = await (factory as TsudoiConfigFactory)();
  } catch (cause) {
    throw new ConfigError(`the config factory in ${absolutePath} failed\n  ${String(cause)}`);
  }
  // OUTSIDE THE `try` ABOVE, and nothing reddens if you move it inside: raised
  // in there, this ConfigError is caught by the handler one line up and
  // re-wrapped as `the config factory failed\n  ConfigError: ...` -- a report
  // that the author's code threw, about a factory that returned perfectly well.
  // Every assertion on this path matches a substring, so the wrapping is
  // invisible to all of them.
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
  const config: TsudoiConfig = { methods: validatedMethods(returned, absolutePath) };
  requireCompletionBesideResolve(config, absolutePath);
  return config;
}

/**
 * EVERY HANDLER TSUDOI WILL SERVE, READ ONCE AND MATERIALISED AS PLAIN DATA --
 * or a ConfigError naming what the author must fix.
 */
function validatedMethods(returned: object, absolutePath: string): TsudoiConfig["methods"] {
  const methods = readOrRefuse(absolutePath, "methods", () => {
    return (returned as { methods?: unknown }).methods;
  });
  if (methods === undefined) {
    return undefined;
  }
  // The neighbouring shape, spelled the same way ON PURPOSE: two reads of `is
  // this an object` in one file that disagreed about `null` would be a bug
  // nobody could see by reading either one.
  if (typeof methods !== "object" || methods === null) {
    throw new ConfigError(
      `config ${absolutePath} declares methods as ${methods === null ? "null" : typeof methods} ` +
        `instead of an object of handlers; tsudoi reads no method off it, so this server would ` +
        `come up answering nothing. A config that answers nothing omits methods entirely`,
    );
  }
  // A `Record<string, unknown>` FILLED AND CAST ONCE: every value here has come
  // off `unknown` and passed `typeof === "function"`, which is the whole of what
  // is knowable about it. That a handler's SIGNATURE matches its method is
  // checked where an author annotates their own config with `TsudoiConfig`, and
  // cannot be checked here.
  const validated: Record<string, unknown> = {};
  for (const method of Object.keys(requestEntries)) {
    const handler = readOrRefuse(absolutePath, method, () => {
      return (methods as Record<string, unknown>)[method];
    });
    if (handler === undefined) {
      continue;
    }
    if (typeof handler !== "function") {
      throw new ConfigError(
        `config ${absolutePath} supplies ${handler === null ? "null" : typeof handler} for ` +
          `${method} instead of a function; tsudoi advertises a capability for every method the ` +
          `config declares, so this would invite requests nothing can answer`,
      );
    }
    validated[method] = handler;
  }
  // BESIDE THE LOOP AND NEVER INSIDE IT, because `initialize` is a key of
  // `config.methods` and NOT a row of the request table: it contributes no
  // capability and routes through no registration, so a row for it would make
  // contributeCapabilities claim one and the refusal above say something false.
  //
  // AND WITHOUT THIS READ THE KEY HAD NO COLOUR AT ALL: this function builds a
  // FRESH object out of the table's keys, so a key that is not one of them was
  // copied nowhere and refused nowhere -- MEASURED, a config supplying `5` here
  // exited 0 with empty stderr, an author's handler silently dropped and never
  // run.
  const initialize = readOrRefuse(absolutePath, "initialize", () => {
    return (methods as Record<string, unknown>)["initialize"];
  });
  if (initialize !== undefined) {
    // A SIBLING SENTENCE AND NOT THE ONE ABOVE, and generalising the two into
    // one is the edit to refuse: that message's `advertises a capability for
    // every method the config declares` is what makes it useful for a row of the
    // table and is false of this key, while what goes wrong HERE is the handshake, which
    // is true of no other key.
    if (typeof initialize !== "function") {
      throw new ConfigError(
        `config ${absolutePath} supplies ${initialize === null ? "null" : typeof initialize} for ` +
          `initialize instead of a function; tsudoi calls it with the InitializeResult it would ` +
          `otherwise have sent and answers the handshake with what it returns, so this would fail ` +
          `the handshake itself`,
      );
    }
    validated["initialize"] = initialize;
  }
  return validated as TsudoiConfig["methods"];
}

/**
 * One property read, with an access that THROWS reported as the config problem
 * it is. A thunk rather than an object and a key, so each caller names what it
 * is reading in the words the author will recognise.
 */
function readOrRefuse(absolutePath: string, what: string, read: () => unknown): unknown {
  try {
    return read();
  } catch (cause) {
    throw new ConfigError(`reading ${what} from config ${absolutePath} failed\n  ${String(cause)}`);
  }
}

/**
 * Refuses a config that resolves completion items without producing any.
 *
 * AT CONFIG LOAD RATHER THAN IN THE TYPE, deliberately: expressing it in
 * `TsudoiConfig` would put a conditional constraint on the PUBLISHED surface,
 * where the reader is a stranger with one file, and a conditional-type
 * diagnostic reads as noise about tsudoi's internals rather than a sentence
 * naming what they must add.
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
  throw new ConfigError(
    `config ${absolutePath} supplies a completionItem/resolve handler with no ` +
      `textDocument/completion handler; completionItem/resolve resolves items that ` +
      `textDocument/completion produced, so tsudoi will not advertise one without the other`,
  );
}
