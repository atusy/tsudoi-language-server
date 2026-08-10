/**
 * THE ONE CALL AN AUTHOR MAKES.
 *
 * IT RETURNS THE HANDLERS AND ALSO WHERE THEY CAME FROM, which is not
 * decoration: this package's whole premise is that the config was found
 * SOMEWHERE THE AUTHOR DID NOT NAME, so a session behaving oddly is a question
 * about which file answered. An author who wants to log it has it; one who does
 * not spreads `methods` and ignores the rest.
 */
import { findConfig, parseConfig } from "./config.ts";
import type { EfmConfig } from "./config.ts";
import { handlersFor } from "./handlers.ts";
import type { EfmHandlerOptions, EfmMethods } from "./handlers.ts";

export interface LoadEfmConfigOptions extends EfmHandlerOptions {
  /**
   * The config to read, INSTEAD of searching. An explicit path is never
   * searched past: an author who names a file and silently gets another one has
   * no way to tell.
   */
  readonly path?: string;
}

export interface LoadedEfmConfig {
  /**
   * Spread into your own `methods`, or use as it stands.
   *
   * A KEY IS PRESENT ONLY WHERE THE CONFIG DESCRIBES IT, and that is what an
   * editor is told: tsudoi contributes a capability from handler PRESENCE, so a
   * formatting key here for a config with no `format-command` would advertise a
   * formatter that answers nothing.
   */
  readonly methods: EfmMethods;
  /** Which file answered, or `undefined` where none was found. */
  readonly path: string | undefined;
  /** What was parsed -- empty where no config was found. */
  readonly config: EfmConfig;
}

/**
 * Finds an efm-langserver `config.yaml`, reads it, and hands back the tsudoi
 * handlers it describes.
 *
 * NO CONFIG IS NOT AN ERROR, and it is the case an author must be able to
 * handle: a machine that has never run efm has no such file, and this call
 * answers with NO handlers rather than throwing. What IS an error is a file that
 * exists and cannot be read -- silence there would leave an author with a server
 * that starts and does nothing, which is the state hardest to diagnose.
 *
 * A BROKEN `lint-formats` THROWS HERE RATHER THAN AT THE FIRST REQUEST, which is
 * where the author is looking: this runs inside their config factory, so tsudoi
 * reports it as a config failure -- exit 1, `tsudoi: ` on stderr, nothing on
 * stdout. Deferred, it would be an editor opening onto a server that is silently
 * useless for one filetype.
 */
export function loadEfmConfig(options: LoadEfmConfigOptions = {}): LoadedEfmConfig {
  const path = options.path ?? findConfig();
  if (path === undefined) {
    return { methods: {}, path: undefined, config: {} };
  }
  const config = parseConfig(path);
  return { methods: handlersFor(config, options), path, config };
}
