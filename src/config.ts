import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
// THE ENUMERATION OF WHAT TSUDOI SERVES, taken from the TABLE rather than
// restated here, so a method added there joins this check by existing. Only the
// keys are read. NOT A CYCLE: src/methods.ts imports src/types.ts and
// src/notifications.ts FOR TYPES ONLY and nothing in src/ imports this file back.
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
  // BEFORE THE CAST AND BEFORE THE RULE BELOW, and the ORDER IS LOAD-BEARING:
  // requireCompletionBesideResolve dereferences `methods` and then a method name
  // off it, so an accessor reached THERE raises a bare TypeError -- which is not
  // a ConfigError, so src/cli.ts rethrows it and the author gets a raw stack with
  // no `tsudoi: ` prefix and no config path. That is the exact defect the
  // returned-shape guard above exists to close, one level in.
  requireCallableMethods(returned, absolutePath);
  const config = returned as TsudoiConfig;
  requireCompletionBesideResolve(config, absolutePath);
  return config;
}

/**
 * Refuses a `methods` tsudoi cannot serve, BY READING EVERY HANDLER IT WILL
 * LATER READ.
 *
 * THE READING IS THE POINT AND NOT A SIDE EFFECT. A method key may be an
 * ACCESSOR -- a legal spelling, and the natural one for a handler built lazily
 * from a file, a dictionary or a compiled grammar -- and nothing here validated
 * it, so the first dereference was `contributeCapabilities` INSIDE the
 * `initialize` handler, which runs once the lifecycle is already `serving`. A
 * throwing getter therefore answered the HANDSHAKE -32603 with ZERO BYTES on
 * stderr, and left the session treating every later request as initialized out
 * of a handshake that had failed. Read here, it is a ConfigError before
 * startServer, so the author gets the sentence and no protocol byte is written.
 *
 * REJECTED RATHER THAN DIAGNOSED, on what a warning would leave behind: this
 * runs before startServer, so refusing costs nothing, while a warning hands the
 * author the broken server anyway. Same stage and same grounds as the rule below.
 *
 * A CONFIG THAT DECLARES NO METHODS IS LEGAL. An absent `methods`, an empty one
 * and an absent key are three spellings of `answers nothing`, which is a server
 * a config author is entitled to write -- so ABSENCE IS SKIPPED and only a
 * PRESENT non-function is refused. `{ methods: 5 }` is not absence: it is
 * `() => 5` one level in, dereferenced by nobody and inert in exactly the same
 * silence.
 *
 * DRIVEN BY THE TABLE'S KEYS AND NOT THE AUTHOR'S, which is what makes the set
 * read here EXACTLY the set read later. A key tsudoi does not serve is neither
 * read nor refused: nothing dereferences it, so it cannot fail, and refusing it
 * would forbid an author keeping a handler for a method tsudoi has yet to gain.
 *
 * WHAT ONE READ CANNOT PROVE, named rather than glossed: registerMethods
 * re-reads `config.methods?.[method]` on EVERY request for the life of the
 * session. An accessor that answers a function now and throws later is NOT
 * defended, and would fail as that method's own request rather than as the
 * handshake.
 */
function requireCallableMethods(returned: object, absolutePath: string): void {
  const methods = readOrRefuse(absolutePath, "methods", () => {
    return (returned as { methods?: unknown }).methods;
  });
  if (methods === undefined) {
    return;
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
  for (const method of Object.keys(requestEntries)) {
    const handler = readOrRefuse(absolutePath, method, () => {
      return (methods as Record<string, unknown>)[method];
    });
    if (handler === undefined) {
      continue;
    }
    if (typeof handler !== "function") {
      // WHY PRESENCE ALONE IS NOT ENOUGH, and why this is worse than the inert
      // case above: contributeCapabilities claims a method's capability on
      // `!== undefined`, so a present non-function makes tsudoi ADVERTISE what it
      // cannot answer -- and a conforming client is entitled to send exactly the
      // requests that then fail. That is the state the rule below exists to
      // prevent, arrived at by a different route.
      throw new ConfigError(
        `config ${absolutePath} supplies ${handler === null ? "null" : typeof handler} for ` +
          `${method} instead of a function; tsudoi advertises a capability for every method the ` +
          `config declares, so this would invite requests nothing can answer`,
      );
    }
  }
}

/**
 * One property read, with an access that THROWS reported as the config problem
 * it is.
 *
 * A THUNK RATHER THAN AN OBJECT AND A KEY, so the two callers below name what
 * they are reading in the words the author will recognise -- `methods`, or the
 * method name itself -- instead of this function inferring it.
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
