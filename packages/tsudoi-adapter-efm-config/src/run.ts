/**
 * RUNNING ONE OF A READER'S OWN COMMANDS, and interpolating what efm documents
 * into it before it runs.
 *
 * THE COMMAND GOES THROUGH A SHELL, WHICH IS EFM'S OWN CHOICE AND NOT A
 * CONVENIENCE. A reader's `lint-command` is routinely a PIPELINE -- efm's own
 * README ships `erb -x -T - | ruby -c` and `mypy --show-column-numbers` beside
 * each other -- so a direct spawn would refuse half the documented examples.
 * WHAT THAT MEANS FOR TRUST IS STATED RATHER THAN GLOSSED: this package executes
 * shell text out of a YAML file, which is exactly what efm does, and the file is
 * the reader's own. It is no safer and no more dangerous than running efm.
 */
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import process from "node:process";

/** What one run produced, with the exit code kept rather than thrown on. */
export interface CommandResult {
  readonly stdout: string;
  readonly stderr: string;
  /** `null` where a signal killed it, which is not an exit code and is not zero. */
  readonly code: number | null;
}

/**
 * What a `${...}` may be filled from: efm's `FormattingOptions` keys plus its
 * own range keys. A key with no value is ABSENT, and an absent key makes its
 * whole `${...}` expand to nothing -- which is efm's documented behaviour and is
 * how a formatter that takes no range flag is driven by a config that names one.
 */
export type Interpolations = Readonly<Record<string, string | number | boolean | undefined>>;

/**
 * A `${...}` this adapter does not implement, refused BY NAME rather than passed
 * through.
 *
 * WHY REFUSING BEATS PASSING THROUGH, and it is the whole reason this class
 * exists: a `${--tab-width:tabWidth}` handed to the shell verbatim is a LITERAL
 * ARGUMENT. The formatter runs, exits 0, and returns a document formatted by its
 * defaults -- so the author sees their settings ignored with nothing anywhere
 * saying why. A refusal costs them one error and tells them which token.
 */
export class EfmInterpolationError extends Error {
  constructor(
    readonly token: string,
    readonly command: string,
  ) {
    super(`${command}: this adapter does not implement \`${token}\``);
    this.name = "EfmInterpolationError";
  }
}

/** `${INPUT}`, and the three flag forms efm documents. */
const placeholder = /\$\{([^}]*)\}/g;

/**
 * Fills a command's `${...}` tokens.
 *
 * THE FOUR FORMS ARE EFM'S, READ FROM ITS SCHEMA: `${INPUT}` is the file, and a
 * flag is `${--flag:key}` (flag then value), `${--flag=key}` (joined by `=`) or
 * `${--flag:!key}` (the flag alone, when the value is FALSY). Anything else is
 * refused.
 *
 * THE VALUE IS SHELL-QUOTED AND THE FLAG IS NOT. A path holding a space is the
 * ordinary case on two of the three platforms this runs on, and the flag is
 * config text the author wrote rather than data -- quoting it would break
 * `${--flag=key}`, whose whole point is that the two halves join.
 */
export function interpolate(command: string, input: string, values: Interpolations = {}): string {
  return command.replace(placeholder, (whole, body: string) => {
    if (body === "INPUT") {
      return shellQuote(input);
    }
    const separator = body.search(/[:=]/);
    if (separator > 0 && body.startsWith("-")) {
      const flag = body.slice(0, separator);
      const joiner = body.charAt(separator);
      const key = body.slice(separator + 1);
      if (joiner === ":" && key.startsWith("!")) {
        const value = values[key.slice(1)];
        return value === undefined || value === false || value === 0 || value === "" ? flag : "";
      }
      const value = values[key];
      if (value === undefined) {
        return "";
      }
      return joiner === "="
        ? `${flag}=${shellQuote(String(value))}`
        : `${flag} ${shellQuote(String(value))}`;
    }
    throw new EfmInterpolationError(whole, command);
  });
}

/**
 * One value, safe inside single quotes for the shell this spawns.
 *
 * SINGLE QUOTES AND NOT DOUBLE, because a double-quoted string still expands
 * `$`, a backtick and `\` -- so a filename holding `$(...)` would RUN. The one
 * character single quotes cannot carry is the single quote itself, and the
 * `'\''` dance is how every shell spells it.
 */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * Runs one command, feeding `stdin` when there is any, and resolving whatever it
 * produced.
 *
 * IT RESOLVES ON A NON-ZERO EXIT RATHER THAN REJECTING, which is forced by what
 * a LINTER is: a linter that found something exits non-zero and its output is
 * the answer. Deciding what an exit code MEANS belongs to the caller, which is
 * the only place that knows whether `lint-ignore-exit-code` was set.
 *
 * THE SIGNAL IS HONOURED, AND IT IS THE HALF A CALLER WILL FORGET: `context
 * .signal` aborting kills the child, so a superseded request stops a compiler
 * rather than leaving it to finish into an answer nobody reads.
 */
export function runCommand(run: {
  readonly command: string;
  readonly cwd?: string;
  readonly stdin?: string;
  readonly env?: readonly string[];
  readonly signal?: AbortSignal;
}): Promise<CommandResult> {
  return new Promise<CommandResult>((resolve, reject) => {
    const shell = process.platform === "win32" ? "cmd" : "sh";
    const flag = process.platform === "win32" ? "/c" : "-c";
    const extra: Record<string, string> = {};
    for (const entry of run.env ?? []) {
      const at = entry.indexOf("=");
      if (at > 0) {
        extra[entry.slice(0, at)] = entry.slice(at + 1);
      }
    }
    const child = spawn(shell, [flag, run.command], {
      cwd: run.cwd,
      env: { ...process.env, ...extra },
      signal: run.signal,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      resolve({ stdout, stderr, code });
    });
    if (run.stdin !== undefined) {
      // THE WRITE IS GUARDED BECAUSE THE CHILD MAY HAVE GONE: a command that
      // ignores its input closes the pipe, and an unguarded write then raises
      // EPIPE as an unhandled error rather than as this request's failure.
      child.stdin.on("error", () => undefined);
      child.stdin.end(run.stdin);
    } else {
      child.stdin.end();
    }
  });
}
