/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE.
 *
 * `exports` in package.json names this module alone, so what is not re-exported
 * here is unreachable by bare specifier however many names dist/ declares --
 * which makes this file the decision rather than a convenience.
 *
 * `wordsIn` AND `windowAround` STAY IN, WHICH THE OTHER HANDLER PACKAGES DO NOT
 * DO FOR THEIR INTERNALS, and the reason is what they are: the WHOLE of what
 * this package knows is `which lines` and `which words`, and an author who wants
 * the words with a different window -- the whole buffer, one function, a
 * selection -- can have them without reimplementing the filters. There is
 * nothing left over to keep private.
 */
export { aroundCompletion } from "./completion.ts";
export type { AroundCompletionOptions } from "./around.ts";
export { windowAround, wordsIn } from "./around.ts";
