/**
 * Buffer-local completion for a config author's own `textDocument/completion`
 * handler: the words already written AROUND the cursor.
 *
 * WHAT THIS IS: a PACKAGE a config author INSTALLS, and not a line of it lives in
 * tsudoi. It is also the worked shape of a handler that answers FROM THE
 * DOCUMENT IT WAS GIVEN and goes nowhere else -- no subprocess, no index, no
 * dictionary -- which is what makes it the completion a server can offer for a
 * language it understands nothing about.
 *
 * MODELLED ON ddc-source-around, AND READ FROM ITS SOURCE RATHER THAN ITS
 * README. The two disagree: the README documents `maxSize: 500` where `params()`
 * returns 200. Every default and every filter below is the code's, because a
 * default taken from the prose would be a claim nobody could check against the
 * thing this was modelled on.
 *
 * WHAT DOES NOT TRANSLATE, NAMED SO IT IS NOT MISTAKEN FOR AN OMISSION: ddc
 * NARROWS the candidates itself against what the user has typed. LSP gives that
 * job to the CLIENT, so this hands over the window's words and the editor
 * filters them -- which is also why the word under the cursor is among them
 * rather than being excluded. Excluding it would be this package deciding what
 * the editor already decides, and would be wrong for the user who is retyping a
 * word that appears elsewhere.
 */

/**
 * How the window, the filters and what counts as a word are chosen.
 *
 * NAMED FOR THE HANDLER IT BELONGS TO, matching `PathCompletionOptions` in the
 * sibling package: an author installing both reads one convention.
 */
export interface AroundCompletionOptions {
  /**
   * How many lines above AND below the cursor are read. Clamped to the buffer.
   *
   * 200 IS THE REFERENCE'S `params()` VALUE AND NOT ITS README'S 500. The window
   * is what makes this cheap enough to run on every keystroke of a file of any
   * size, so it is the option most worth an author's attention.
   */
  readonly maxSize?: number;
  /**
   * The shortest match worth offering.
   *
   * TWO IS THE REFERENCE'S DEFAULT, and the reason is what a one-character
   * candidate costs: it matches nearly everything the user has typed so far, so
   * it fills the popup while telling them nothing.
   */
  readonly minLength?: number;
  /**
   * A line AT OR OVER this many characters is skipped WHOLE -- not truncated.
   *
   * 200 IS THE REFERENCE'S `COLUMNS_MAX`, and the bound is on the LINE rather
   * than on the scan because of what a very long line is: minified output, a
   * base64 blob, a generated table. Its "words" are not words anyone will want,
   * and it is exactly the line whose scan costs the most.
   */
  readonly maxColumns?: number;
  /**
   * What counts as a word.
   *
   * THE PATTERN IS NOT THE REFERENCE'S AND THE FLAGS ARE, said this precisely
   * because `modelled on ddc-source-around` invites the opposite reading. What
   * is inherited is `gu` -- that source builds `new RegExp(pattern, "gu")`. What
   * is NOT is the pattern itself: ddc-source-around HAS no default of its own,
   * it takes ddc's `keywordPattern` SOURCE OPTION, whose documented default is
   * `\k*`, and `convertKeywordPattern` in ddc.vim rewrites `\k` into a class
   * built from the buffer's `iskeyword`.
   *
   * SO THE REFERENCE'S ANSWER IS THE EDITOR'S SETTING AND TSUDOI HAS NO SUCH
   * SETTING TO READ. Something had to be chosen here, and `[A-Za-z0-9_]+` would
   * offer nothing at all in a Japanese, Greek or Cyrillic buffer -- failing as
   * an empty popup rather than as an error. THIS DEFAULT IS THEREFORE MORE
   * PERMISSIVE THAN VIM'S OWN: `iskeyword` defaults to roughly ASCII plus
   * Latin-1, so a vim user who has not widened it would NOT get those words out
   * of the reference either.
   *
   * AND IT IS `+` WHERE THE REFERENCE'S DEFAULT IS `*`, which is why `minLength`
   * does less work here: `\k*` MATCHES THE EMPTY STRING, and that source's own
   * tests record `minLength` as what removes the empties. One-or-more cannot
   * produce one.
   *
   * SUPPLY YOUR OWN AND IT IS USED AS GIVEN: the flags are yours too, and a
   * pattern without `g` matches once per line, which is almost certainly not
   * what you meant.
   *
   * THE DEFAULTS ARE WRITTEN AT `aroundCompletion` AND NOT HERE, deliberately:
   * one place decides them, and a second copy beside the documentation is how
   * the two come to disagree.
   */
  readonly wordPattern?: RegExp;
}

/**
 * Every distinct word in `lines`, in the order each was first seen.
 *
 * EXPORTED so the arms can drive the filters directly. What the handler adds is
 * the WINDOW, and that is asserted through the handler.
 *
 * FIRST-SEEN AND NOT LAST-SEEN, which is what a `Set` gives and what the
 * reference relies on: the word nearest the top of the window wins its place,
 * and an implementation that rebuilt the list from the end would offer the same
 * SET in a different order, which an editor shows as a different popup.
 */
export function wordsIn(
  lines: readonly string[],
  options: { pattern: RegExp; minLength: number; maxColumns: number },
): string[] {
  const found = new Set<string>();
  // REBUILT PER CALL, NOT PER LINE, and never the caller's own instance: a `g`
  // regex is stateful through `lastIndex`, so reusing the object a caller handed
  // in would make this function's answer depend on what they did with it last.
  const pattern = new RegExp(options.pattern.source, options.pattern.flags);
  for (const line of lines) {
    if (line.length >= options.maxColumns) {
      continue;
    }
    for (const match of line.matchAll(pattern)) {
      const word = match[0];
      if (word.length >= options.minLength) {
        found.add(word);
      }
    }
  }
  return [...found];
}

/**
 * The lines a cursor on `line` can see, as HALF-OPEN bounds into the buffer.
 *
 * INCLUSIVE OF THE CURSOR'S OWN LINE AND `maxSize` EITHER SIDE, which is the
 * reference's arithmetic with its one-based lines translated: it clamps to
 * `[1, $]`, this clamps to `[0, lines.length]`.
 */
export function windowAround(
  line: number,
  lineCount: number,
  maxSize: number,
): { readonly from: number; readonly to: number } {
  return {
    from: Math.max(0, line - maxSize),
    to: Math.min(lineCount, line + maxSize + 1),
  };
}
