/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE.
 *
 * `exports` in package.json names this module alone, so what is not re-exported
 * here is unreachable by bare specifier however many names dist/ declares --
 * which makes this file the decision rather than a convenience.
 *
 * WHAT IS IN: `loadEfmConfig`, the one call an author makes, and the error types
 * they may want to CATCH -- a config author who wants to fall back to their own
 * handlers when no efm config exists needs to tell that case from a broken file.
 * WHAT IS OUT: the errorformat reader, the command runner and the handler
 * builders. They are this package's to change, and an author who could reach
 * them would be depending on decisions no README here promises.
 */
export { EfmConfigError, findConfig } from "./config.ts";
export type { EfmCommand, EfmConfig, EfmTool } from "./config.ts";
export { EfmFormatError } from "./errorformat.ts";
export { EfmInterpolationError } from "./run.ts";
export { loadEfmConfig } from "./load.ts";
export type { LoadEfmConfigOptions, LoadedEfmConfig } from "./load.ts";
