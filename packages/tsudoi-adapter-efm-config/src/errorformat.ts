/**
 * VIM ERRORFORMATS, FOR THE SINGLE-LINE FORMS AND NO OTHERS.
 *
 * WHAT IS IMPLEMENTED AND WHY THE LINE IS THERE: efm delegates this to
 * reviewdog/errorformat, a Go implementation of the whole of vim's
 * `:h errorformat` -- including the MULTI-LINE machinery (`%E`, `%C`, `%+P`,
 * `%-O`, `%A`) that stitches a compiler's several lines into one diagnostic. Its
 * own README uses that for eslint. Reimplementing it is a package of its own.
 *
 * SO A FORMAT THIS CANNOT READ IS REFUSED BY NAME AND NEVER SILENTLY SKIPPED,
 * which is the whole of what makes the narrowing safe. A parser that returned no
 * match for `%+P%f` would hand back a clean file: the author sees their linter
 * reporting nothing and has no way to tell that from a linter that found
 * nothing. `unsupportedFormat` is what they get instead.
 *
 * THE CONVERSIONS ARE VIM'S, AND ARE READ FROM `:h errorformat` RATHER THAN
 * MEASURED: `%f` file, `%l` line, `%c` column, `%t` a single type character,
 * `%m` the message, `%n` a number, `%%` a literal percent, `%*[...]` and `%*\\d`
 * a `scanf` repeat. Everything else in a format is LITERAL TEXT.
 */

/** One diagnostic a format matched, in efm's own vocabulary rather than LSP's. */
export interface EfmViolation {
  readonly file?: string;
  readonly line: number;
  readonly column?: number;
  /** The single character `%t` captured -- `e`, `w`, `i`, `n`, `h` and so on. */
  readonly type?: string;
  readonly message: string;
}

/**
 * A `lint-formats` entry this reader cannot compile, refused when the handlers
 * are BUILT rather than when a diagnostic is asked for.
 *
 * AT BUILD TIME BECAUSE THAT IS WHEN AN AUTHOR IS LOOKING: `loadEfmConfig()` is
 * called from their config factory, so a refusal there is a server that will not
 * start with a message naming the format. Deferring it to the first request
 * would make an editor open onto a language server that is silently useless for
 * one filetype.
 */
export class EfmFormatError extends Error {
  constructor(
    readonly format: string,
    reason: string,
  ) {
    super(`lint-format \`${format}\`: ${reason}`);
    this.name = "EfmFormatError";
  }
}

/** What vim calls the multi-line prefixes, none of which this reader implements. */
const multiLinePrefix = /^%[EWICZAGOPQ+-]/;

interface Compiled {
  readonly pattern: RegExp;
  /** Which capture group each conversion landed in, by its letter. */
  readonly groups: readonly string[];
}

/**
 * Turns one errorformat into a regular expression over ONE line.
 *
 * THE LITERAL HALF IS ESCAPED AND THE CONVERSIONS ARE NOT, which is the only
 * thing that makes a format like `%f:%l:%c: %m` safe: everything between the
 * conversions is a reader's own text and may hold a `.` or a `(`.
 *
 * `%f` IS NON-GREEDY AND `%m` IS GREEDY, deliberately and not by accident of
 * writing: a path and a message are separated by a literal the format names, and
 * a greedy path swallows it on `a/b.c:1: msg` where a non-greedy one stops at
 * the first. The message is last in every documented format and takes the rest.
 */
function compile(format: string): Compiled {
  if (multiLinePrefix.test(format)) {
    throw new EfmFormatError(
      format,
      "is a multi-line errorformat, which this adapter does not implement -- it reads single-line formats only, so a linter needing this one must be given a `lint-command` that emits one line per violation",
    );
  }
  const groups: string[] = [];
  let pattern = "";
  for (let at = 0; at < format.length; at += 1) {
    const character = format.charAt(at);
    if (character !== "%") {
      pattern += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      continue;
    }
    const next = format.charAt(at + 1);
    at += 1;
    if (next === "%") {
      pattern += "%";
    } else if (next === "f") {
      groups.push("f");
      pattern += "(.+?)";
    } else if (next === "l") {
      groups.push("l");
      pattern += String.raw`(\d+)`;
    } else if (next === "c") {
      groups.push("c");
      pattern += String.raw`(\d+)`;
    } else if (next === "n") {
      groups.push("n");
      pattern += String.raw`(\d+)`;
    } else if (next === "t") {
      groups.push("t");
      pattern += "(.)";
    } else if (next === "m") {
      groups.push("m");
      pattern += "(.+)";
    } else if (next === "*") {
      // A `scanf` repeat: `%*[ ]` is a character class, `%*\d` a digit run. It
      // captures NOTHING -- it exists to skip padding a format does not care
      // about, which is why the group list does not grow here.
      const after = format.charAt(at + 1);
      if (after === "[") {
        const close = format.indexOf("]", at + 2);
        if (close === -1) {
          throw new EfmFormatError(format, "has a `%*[` with no closing `]`");
        }
        pattern += `[${format.slice(at + 2, close).replace(/[\\\]^]/g, "\\$&")}]*`;
        at = close;
      } else if (after === "\\") {
        pattern += format.charAt(at + 2) === "d" ? String.raw`\d*` : ".*";
        at += 2;
      } else {
        throw new EfmFormatError(format, "has a `%*` this adapter does not implement");
      }
    } else {
      throw new EfmFormatError(
        format,
        `has a conversion \`%${next}\` this adapter does not implement`,
      );
    }
  }
  return { pattern: new RegExp(`^${pattern}$`), groups };
}

/** Compiles every format, so a bad one is refused before any linter runs. */
export function compileFormats(formats: readonly string[]): readonly Compiled[] {
  return formats.map(compile);
}

/**
 * Every violation a linter's output holds, read through the first format that
 * matches each line.
 *
 * FIRST MATCH WINS PER LINE, which is vim's own rule and efm's: a `lint-formats`
 * list is alternatives in priority order, not a sequence to apply.
 *
 * A LINE MATCHING NOTHING IS DROPPED, and this is the one silence kept
 * deliberately: linters print headers, summaries and blank lines, and a reader
 * whose format matches only the violations is doing the normal thing. What is
 * NOT silent is a FORMAT that cannot be read, refused at build.
 */
export function violationsIn(
  output: string,
  compiled: readonly Compiled[],
): readonly EfmViolation[] {
  const found: EfmViolation[] = [];
  for (const text of output.split(/\r?\n/)) {
    if (text === "") {
      continue;
    }
    for (const { pattern, groups } of compiled) {
      const match = pattern.exec(text);
      if (match === null) {
        continue;
      }
      const captured: Record<string, string> = {};
      groups.forEach((letter, index) => {
        captured[letter] = match[index + 1] ?? "";
      });
      // `%l` ABSENT MEANS THE WHOLE FILE, WHICH LSP CANNOT SAY, so it lands on
      // the first line -- and that is a CHOICE rather than a reading of the
      // format: a diagnostic with no position is not a thing the protocol has.
      found.push({
        file: captured.f,
        line: captured.l === undefined ? 1 : Number(captured.l),
        column: captured.c === undefined ? undefined : Number(captured.c),
        type: captured.t,
        message: captured.m ?? text,
      });
      break;
    }
  }
  return found;
}
