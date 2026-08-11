/**
 * THE PACKAGE'S WHOLE PUBLISHED SURFACE, AND IT IS TWO NAMES FOR TWO METHODS.
 *
 * `exports` in package.json names this module alone, so nothing else in dist/ is
 * reachable by bare specifier however many names it declares -- which is what
 * makes this file the decision rather than a convenience re-export. An example's
 * exports are incidental, because a reader copies the file and edits it; a
 * package's are a promise to a stranger who cannot.
 *
 * TWO HANDLERS AND NOT ONE, AND THE PACKAGE NAME CANNOT SAY SO, which is why it
 * is said here and in the README. `completePath` offers a directory's entries
 * and reads NO SIZE AND NO DATE for any of them -- an ordinary file or directory
 * is classified from the listing alone, and only a symlink costs a stat, to
 * report the kind of what it points at. `resolvePathStat` answers for the ONE
 * item the user highlights -- a file's size and date, and for a directory the
 * names inside it, which is a question the completion never asked at all. They
 * travel together because the second reads a mark the first writes onto its
 * items, and tsudoi keeps no record of what a completion handler produced -- so
 * publishing the resolve half separately would make that mark a compatibility
 * surface between two packages.
 *
 * THEY ARE ALSO NOT OPTIONAL FOR EACH OTHER IN THE OTHER DIRECTION: tsudoi
 * REFUSES a config that supplies `completionItem/resolve` with no completion
 * handler beside it, so a package shipping only the resolve half could not be
 * used alone at all.
 *
 * EVERY OTHER NAME STAYS IN, AND THE OMISSION IS A CHOICE RATHER THAN AN
 * OVERSIGHT. The line-scanner, the root chooser, the edit builder, the listing,
 * the option bag, the item mark, the block the two halves share and the resolve
 * half's drain are all reachable from this package's own tests by relative
 * import, so keeping them internal costs no coverage and buys the freedom to
 * change them. NEITHER SPELLED OUT NOR COUNTED HERE: both falsify themselves the
 * day a name is added, and this list has grown twice already. The batch size and
 * the listing bound go one further and are not exported by their own modules at
 * all -- what they decide is visible on the wire, which is where they are
 * asserted.
 *
 * THE MARK IS THE ONE WORTH NAMING. `completedPath` and `PathItemData` describe
 * how an item says `I came from here`, and the two handlers below agree about it
 * by importing one definition. Published, every change to that agreement would
 * be a compatibility question with a stranger who never needed to know there was
 * a mark at all.
 */
export { completePath } from "./completion.ts";
export { resolvePathStat } from "./resolve.ts";
