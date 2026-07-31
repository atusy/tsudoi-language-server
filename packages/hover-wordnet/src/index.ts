/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE, AND IT IS ONE NAME.
 *
 * `exports` in package.json names this module alone, so nothing else in dist/ is
 * reachable by bare specifier however many names it declares -- which is what
 * makes this file the decision rather than a convenience re-export. An example's
 * exports are incidental, because a reader copies the file and edits it; a
 * package's are a promise to a stranger who cannot.
 *
 * THE TWO THAT STAY IN, NAMED SO THE OMISSION READS AS A CHOICE. `define` is the
 * dictionary lookup and `wordAt` is the word rule, and both are tested through a
 * relative import in this package's own test, which is why keeping them internal
 * costs no coverage.
 *
 * `wordAt` IS THE ONE THAT COSTS SOMETHING, and the cost is stated rather than
 * bought off. Its own comment calls it the function a config author replaces
 * with their own language's notion of a word -- true of a file you copy, and
 * FALSE OF A PACKAGE YOU INSTALL. Publishing it would not restore that: an
 * author cannot make this handler call their version by importing ours. What
 * would is an option on the handler, and inventing one here to keep an
 * affordance nobody has asked for is a purchase this backlog refuses by name. So
 * whitespace is this package's word rule, full stop, and an author who needs
 * another writes a handler rather than configuring this one.
 */
export { hoverWordnet } from "./hover.ts";
