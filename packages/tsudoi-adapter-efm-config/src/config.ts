/**
 * READING efm-langserver's OWN `config.yaml` -- finding it, parsing it, and
 * saying what it holds. Nothing here builds a handler; that is handlers.ts.
 *
 * THE SHAPE IS EFM'S AND NOT OURS, which decides every naming question in this
 * file: keys stay kebab-case because that is what a reader's file says, and a
 * key efm defines and this adapter does not honour is CARRIED rather than
 * dropped, so `unsupported()` can name it. A config silently missing half its
 * behaviour is the failure this whole package exists to avoid being.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { parse } from "yaml";

/** One efm tool definition, as the keys a reader's own file spells them. */
export interface EfmTool {
  readonly "format-command"?: string;
  readonly "format-stdin"?: boolean;
  readonly "hover-command"?: string;
  readonly "hover-stdin"?: boolean;
  readonly "hover-type"?: string;
  readonly "lint-command"?: string;
  readonly "lint-stdin"?: boolean;
  readonly "lint-formats"?: readonly string[];
  readonly "lint-ignore-exit-code"?: boolean;
  readonly "lint-severity"?: number;
  readonly "lint-source"?: string;
  readonly "lint-offset"?: number;
  readonly "lint-offset-columns"?: number;
  readonly prefix?: string;
  readonly env?: readonly string[];
  readonly commands?: readonly EfmCommand[];
}

export interface EfmCommand {
  readonly command?: string;
  readonly arguments?: readonly string[];
  readonly title?: string;
  readonly os?: string;
}

export interface EfmConfig {
  readonly version?: number;
  readonly languages?: Readonly<Record<string, readonly EfmTool[]>>;
  readonly commands?: readonly EfmCommand[];
  readonly "root-markers"?: readonly string[];
}

/**
 * WHERE efm ITSELF LOOKS, READ FROM ITS README AND NOT MEASURED HERE. An
 * explicit path wins and is not searched for -- an author who names a file and
 * gets a different one has no way to tell.
 *
 * `XDG_CONFIG_HOME` BEFORE `HOME`, which is the order the specification gives
 * and the one efm documents. An empty string is ABSENCE and not a root: `??`
 * would take it, so the check is on the value being non-empty, and the failure
 * that spelling avoids is a config looked for at `/efm-langserver/config.yaml`.
 */
export function configPaths(): readonly string[] {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA;
    return appData === undefined || appData === ""
      ? []
      : [join(appData, "efm-langserver", "config.yaml")];
  }
  const found: string[] = [];
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg !== undefined && xdg !== "") {
    found.push(join(xdg, "efm-langserver", "config.yaml"));
  }
  const home = process.env.HOME ?? homedir();
  if (home !== "") {
    found.push(join(home, ".config", "efm-langserver", "config.yaml"));
  }
  return found;
}

/** The first of efm's own locations that exists, or `undefined` where none does. */
export function findConfig(): string | undefined {
  return configPaths().find((path) => existsSync(path));
}

/**
 * What went wrong reading a config, as ONE type an author can catch.
 *
 * IT CARRIES THE PATH BECAUSE THE MESSAGE ALONE CANNOT: a parser's own error
 * says what is wrong with the bytes and never which file they came from, and
 * this package's whole job is that the file was found somewhere the author did
 * not name.
 */
export class EfmConfigError extends Error {
  constructor(
    readonly path: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(`${path}: ${message}`, options);
    this.name = "EfmConfigError";
  }
}

/**
 * Reads and parses one config file.
 *
 * `merge: true` IS THE LOAD-BEARING OPTION AND NOT A SETTING, MEASURED at yaml
 * 2.9.0 against efm's own documented example: at the DEFAULT options a tool
 * definition written `- <<: *some-tool` parses to `{ "<<": { ... } }` -- the
 * merge key arrives as a LITERAL KEY and not one of the merged tool's own keys
 * is present. Every anchored definition in a reader's file would then describe a
 * tool with no commands at all, and this adapter would hand back handlers for
 * nothing with no error anywhere. efm's README leads with an example built
 * entirely out of anchors, so this is the common case rather than an edge.
 */
export function parseConfig(path: string): EfmConfig {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    throw new EfmConfigError(path, "could not be read", { cause: error });
  }
  let parsed: unknown;
  try {
    parsed = parse(text, { merge: true });
  } catch (error) {
    throw new EfmConfigError(path, "is not YAML this reader accepts", { cause: error });
  }
  // `null` IS WHAT AN EMPTY FILE PARSES TO, and it is accepted as a config that
  // declares nothing rather than refused: an author who has created the file and
  // not filled it in is not in error, and every handler falls out empty.
  if (parsed === null || parsed === undefined) {
    return {};
  }
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new EfmConfigError(path, "does not hold a mapping at its top level");
  }
  return parsed as EfmConfig;
}

/**
 * Every tool a `languageId` selects, in the order the file lists them, with
 * efm's ANY-LANGUAGE key `=` appended.
 *
 * MATCHED AGAINST THE CLIENT'S `languageId` AS SENT, AND NO TRANSLATION TABLE IS
 * WRITTEN HERE. efm keys this map by VIM FILETYPE, which agrees with an LSP
 * `languageId` often and not always. A table mapping the two would be this
 * package deciding what an editor meant -- and it would be wrong for the author
 * whose editor already agrees. Where they disagree the repair is a key in the
 * author's own config, which is a file they own and can see.
 *
 * `=` LAST, so a language's own tools run before the catch-all, which is the
 * order a reader of the file expects from its position at the bottom of efm's
 * own example.
 */
export function toolsFor(config: EfmConfig, languageId: string): readonly EfmTool[] {
  const languages = config.languages ?? {};
  return [...(languages[languageId] ?? []), ...(languages["="] ?? [])];
}
