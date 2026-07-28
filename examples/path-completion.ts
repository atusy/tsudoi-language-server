/**
 * Path completion for a config author's own `textDocument/completion` handler.
 *
 * WHAT THIS IS: an EXAMPLE, in examples/, and not a line of it lives in
 * tsudoi. Everything below is written with what a config handler is already
 * given -- the live document, the cursor, and the config author's own
 * judgement about what a path looks like in their language. tsudoi contributes
 * the streaming and nothing else.
 *
 * MEASURED, and it is why this file can exist at all: CompletionParams carries
 * `textDocument`, `position` and `context` only -- never the typed prefix --
 * and `context.triggerCharacter` is null on an invoked completion. The current
 * line read out of the document is therefore the ONLY source of what the user
 * has typed, and reading it needs no new tsudoi API.
 */

/** One candidate for the path the user is typing. */
export interface PathFragment {
  /** The whole candidate, exactly as the line carries it -- e.g. `src/fo`. */
  readonly text: string;
  /** Where `text` begins on the line, in UTF-16 code units, as LSP counts. */
  readonly start: number;
  /** Up to and including the last separator -- e.g. `src/`, or `` for none. */
  readonly directory: string;
  /** What follows it -- e.g. `fo`. The filter, and possibly empty. */
  readonly name: string;
}

/**
 * Every candidate path fragment ending at `character`, SHORTEST FIRST.
 *
 * A fragment begins at a word boundary: the start of the line, or just after
 * whitespace. More than one candidate exists because A PATH MAY CONTAIN
 * SPACES: on the line `see foo (1).png`, `foo (1).png` is a real filename and
 * `(1).png` is not, and no rule reading the line alone can tell which. The
 * choice is made against the filesystem by the caller, which takes the first
 * candidate that names something -- so the common case, a path with no space
 * in it, costs exactly one candidate.
 *
 * NOTHING is produced when the cursor sits at the start of a line or straight
 * after whitespace. A candidate must not be empty -- the empty string would
 * list every entry of every root on a keystroke that asked for nothing -- and
 * a candidate ending IN whitespace is the same keystroke with a space in front
 * of it. The cost is that `foo ` does not offer `foo bar.txt` until the `b` is
 * typed; the alternative is a completion popup on the space bar.
 *
 * `character` and JavaScript string indices both count UTF-16 code units, so
 * plain slicing is correct here; iterating code points would drift on the
 * first character outside the BMP.
 */
export function pathFragments(line: string, character: number): PathFragment[] {
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  // Also covers `character === 0`, where index -1 reads as whitespace.
  if (isBoundary(character - 1)) {
    return [];
  }
  const fragments: PathFragment[] = [];
  // Downwards from the cursor, so the list comes out shortest-first with no
  // reversal to keep in step with the caller's preference order.
  for (let start = character - 1; start >= 0; start--) {
    // A fragment never BEGINS with whitespace, whatever precedes it.
    if (isBoundary(start)) {
      continue;
    }
    if (start === 0 || isBoundary(start - 1)) {
      fragments.push(fragmentAt(line, start, character));
    }
  }
  return fragments;
}

function fragmentAt(line: string, start: number, character: number): PathFragment {
  const text = line.slice(start, character);
  // Everything after the last separator is the FILTER for ONE directory
  // listing. That split is what makes this completion per segment.
  const cut = text.lastIndexOf("/") + 1;
  return { text, start, directory: text.slice(0, cut), name: text.slice(cut) };
}
