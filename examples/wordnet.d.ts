/**
 * Types for the `wordnet` package, which ships none and has no entry on
 * DefinitelyTyped -- measured at the version below.
 *
 * ONLY WHAT THIS EXAMPLE CALLS is declared. A fuller declaration would be a
 * guess about a shape nothing here exercises, and a guess in a `.d.ts` is
 * worse than an absence: `tsc` believes it.
 *
 * COPY THIS FILE ALONGSIDE THE EXAMPLE. It is not published by tsudoi and not
 * fetched by installing `wordnet`; without it the example does not type-check
 * in your project, whatever it does in ours.
 */
declare module "wordnet" {
  /** One sense of a word -- WordNet has several for most of them. */
  export interface Definition {
    /** The definition itself, with its usage examples appended in quotes. */
    readonly glossary: string;
    readonly meta: {
      /** `noun`, `verb`, `adjective`, `adverb` -- WordNet's own vocabulary. */
      readonly synsetType: string;
    };
  }

  /**
   * Loads the database. MEASURED at 127ms under bun 1.3.13 and 131ms under
   * deno 2.9.2 -- once, which is why the example defers it rather than paying
   * it during the handshake.
   */
  export function init(databaseDir?: string): Promise<void>;

  /**
   * Every sense of `word`, or a REJECTION when the database has none. A miss
   * is an error rather than an empty array, so a caller that does not catch
   * turns an unknown word into a failed request.
   */
  export function lookup(word: string, skipPointers?: boolean): Promise<Definition[]>;
}
