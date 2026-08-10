import { describe, expect, test } from "bun:test";
import { compileFormats, EfmFormatError, violationsIn } from "../src/errorformat.ts";

function read(formats: readonly string[], output: string) {
  return violationsIn(output, compileFormats(formats));
}

describe("single-line errorformats", () => {
  /**
   * THE FORM EFM'S OWN README USES MOST, and the fixture carries a path with TWO
   * separators on purpose: `%f` is non-greedy, so a path of one segment cannot
   * tell that from a greedy `%f` that stops at the last colon. This one can.
   */
  test("`%f:%l:%c: %m` reads the file, the line, the column and the rest", () => {
    expect(read(["%f:%l:%c: %m"], "src/deep/a.py:12:5: undefined name 'x'")).toEqual([
      {
        file: "src/deep/a.py",
        line: 12,
        column: 5,
        type: undefined,
        message: "undefined name 'x'",
      },
    ]);
  });

  /**
   * `%t` IS ONE CHARACTER AND THE MESSAGE IS THE REST, which is the whole of why
   * `%trror` works: vim reads the letter and the literal `rror` that follows it.
   */
  test("`%t` takes one character and the literal after it is matched as text", () => {
    expect(read(["%f:%l:%c:%trror - %m"], "a.php:3:9:error - Undefined variable")).toEqual([
      { file: "a.php", line: 3, column: 9, type: "e", message: "Undefined variable" },
    ]);
  });

  /**
   * THE FIRST MATCHING FORMAT WINS PER LINE, which is vim's rule -- a list is
   * ALTERNATIVES in priority order and not a sequence to apply. THE FIXTURE
   * DRIVES BOTH ARMS in one output, so a reader that applied only the first or
   * only the last is told apart from one that chooses per line.
   */
  test("a list is alternatives, and the first that matches a line is the one used", () => {
    const formats = ["%f:%l:%c %m", "%f:%l %m"];

    expect(read(formats, "a.md:3:1 no-hard-tabs\nb.md:7 line-length").map((v) => v.column)).toEqual(
      [1, undefined],
    );
  });

  /** `%*[ ]` skips padding and captures nothing, which is what eslint's format needs. */
  test("a `%*[...]` repeat skips text without capturing it", () => {
    expect(read(["%*[ ]%l:%c%*[ ]%m"], "   14:22   Missing semicolon")).toEqual([
      { file: undefined, line: 14, column: 22, type: undefined, message: "Missing semicolon" },
    ]);
  });

  /**
   * A LINE MATCHING NOTHING IS DROPPED, and it is the one silence kept on
   * purpose: linters print headers, totals and blank lines, and a reader whose
   * format matches only violations is doing the ordinary thing.
   */
  test("a line no format matches is dropped rather than reported", () => {
    expect(read(["%f:%l:%c: %m"], "checking 3 files\na.py:1:1: bad\n\n3 problems")).toHaveLength(1);
  });

  /**
   * THE REFUSAL THIS NARROWING RESTS ON. A multi-line format returning NO MATCH
   * would hand back a clean file, and an author cannot tell that from a linter
   * that found nothing -- so the format is refused where they are looking, with
   * its own text in the message.
   */
  test("a multi-line errorformat is refused by name rather than silently matching nothing", () => {
    expect(() => compileFormats(["%+P%f"])).toThrow(EfmFormatError);
    expect(() => compileFormats(["%+P%f"])).toThrow("%+P%f");
    expect(() => compileFormats(["%-O"])).toThrow("multi-line");
    // THE PAIR: a format this reader DOES implement is not refused, so the
    // refusal is a function of the format rather than one that refuses all.
    expect(() => compileFormats(["%f:%l:%c: %m"])).not.toThrow();
  });

  test("a conversion this reader does not implement is refused, naming it", () => {
    expect(() => compileFormats(["%f:%l:%q"])).toThrow("`%q`");
  });

  /**
   * THE LITERAL HALF IS ESCAPED, which is what keeps a reader's own text from
   * being read as a pattern. `.` and `(` are ordinary in a linter's output.
   */
  test("literal text in a format is matched literally", () => {
    expect(read(["%f (%l) %m"], "a.rb (4) bad")).toEqual([
      { file: "a.rb", line: 4, column: undefined, type: undefined, message: "bad" },
    ]);
    // A regex-flavoured reading of `(%l)` would match this too; a literal one
    // does not, which is the discrimination.
    expect(read(["%f (%l) %m"], "a.rb 4 bad")).toEqual([]);
  });
});
