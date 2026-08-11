/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE.
 *
 * `exports` in package.json names this module alone, so what is not re-exported
 * here is unreachable by bare specifier however many names dist/ declares --
 * which makes this file the decision rather than a convenience.
 *
 * WHAT THIS PACKAGE IS: a package a config author INSTALLS, and not a line of it
 * lives in tsudoi. Both handlers answer FROM THE DOCUMENTS THEY WERE GIVEN and go
 * nowhere else -- no subprocess, no dictionary, nothing on disk -- which is what
 * makes this the completion a server can offer for a language it understands
 * nothing about.
 *
 * TWO HANDLERS OVER ONE SOURCE, which is why they ship together: the documents the
 * client has opened are the source, and `completeAround` and `completeCorpus`
 * differ only in HOW MUCH of it each reads. An author installing the package for
 * one of them has the other for free, and the two are called the same way.
 *
 * `wordsIn` AND `windowAround` STAY IN, WHICH THE OTHER HANDLER PACKAGES DO NOT
 * DO FOR THEIR INTERNALS, and the reason is what they are: the WHOLE of what this
 * package knows is `which lines` and `which words`, and an author who wants the
 * words over lines neither handler would choose -- one function, a selection, a
 * file nobody has opened -- can have them without reimplementing the filters.
 * There is nothing left over to keep private.
 */
export { completeAround, windowAround } from "./around.ts";
export type { CompleteAroundOptions } from "./around.ts";
export { completeCorpus } from "./corpus.ts";
export type { CompleteCorpusOptions } from "./corpus.ts";
export type { Scanner } from "./scanners.ts";
export { defaultScanner, defaultWordPattern, regexScanner, segmentScanner } from "./scanners.ts";
export type { WordOptions } from "./words.ts";
export { wordsIn } from "./words.ts";
