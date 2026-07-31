/**
 * Types for the `wordnet` package, which ships none and has no entry on
 * DefinitelyTyped -- measured at the version below.
 *
 * ONLY WHAT THIS PACKAGE CALLS is declared. A fuller declaration would be a
 * guess about a shape nothing here exercises, and a guess in a `.d.ts` is
 * worse than an absence: `tsc` believes it.
 *
 * THIS FILE IS NOT PUBLISHED, AND THAT IS THE WHOLE REASON IT MAY EXIST HERE AT
 * ALL. `declare module "wordnet"` is AMBIENT: it is a statement about a name in
 * the GLOBAL type space, not about this package's own types, so shipping it
 * would declare a third party's module on behalf of everyone who installs this
 * one -- including a project that has its own, better declaration, or a future
 * `@types/wordnet` this would then collide with. `files: ["dist"]` keeps it out
 * of the tarball, and declaration emit does not copy a `.d.ts` INPUT into the
 * output, so nothing carries it there by accident.
 *
 * WHAT MAKES THAT AFFORDABLE RATHER THAN MERELY DESIRABLE, and it is a
 * constraint on the published surface rather than on this file: no name declared
 * here appears in what this package publishes. `hoverWordnet` is a
 * `MethodHandler<"textDocument/hover">` and `Definition` is reached only inside
 * `define`, which stays internal -- so dist/index.d.ts never names `wordnet` and
 * a consumer never needs this declaration to type-check against us. PUBLISH ONE
 * NAME FROM HERE AND THE ARGUMENT INVERTS: the emitted declaration would
 * reference a module the consumer has no declaration for, and the choice would
 * be between shipping this file and breaking them.
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
