/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE, AND IT IS ONE NAME.
 *
 * `exports` in package.json names this module alone, so nothing else in dist/ is
 * reachable by bare specifier however many names it declares -- which is what
 * makes this file the decision rather than a convenience re-export. An example's
 * exports are incidental, because a reader copies the file and edits it; a
 * package's are a promise to a stranger who cannot.
 *
 * `define` AND `wordAt` STAY IN, AND `wordAt` IS THE OMISSION THAT COSTS
 * SOMETHING. A crude word rule is the line a reader of an EXAMPLE edits, and
 * publishing it would not give that line back: an author cannot make this
 * handler call their version by importing ours. What would is an option on the
 * handler, refused at `wordAt` itself. Keeping them internal costs no coverage:
 * this package's own test reaches `define` by relative import into src/, and
 * `wordAt` through the handler it drives.
 */
export { hoverWordnet } from "./hover.ts";
