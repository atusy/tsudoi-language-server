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
 * is said here and in the README. `pathCompletion` offers a directory's entries
 * and reads the DETAIL of none of them -- an ordinary file or directory is
 * classified from the listing alone, and only a symlink costs a stat, to report
 * the kind of what it points at; `resolvePathStat` fetches the size and
 * date for the ONE item the user highlights. They travel together because the
 * second reads a mark the first writes onto its items, and tsudoi keeps no
 * record of what a completion handler produced -- so publishing the resolve half
 * separately would make that mark a compatibility surface between two packages.
 *
 * THEY ARE ALSO NOT OPTIONAL FOR EACH OTHER IN THE OTHER DIRECTION: tsudoi
 * REFUSES a config that supplies `completionItem/resolve` with no completion
 * handler beside it, so a package shipping only the resolve half could not be
 * used alone at all.
 *
 * TWELVE NAMES STAY IN, AND THE OMISSION IS A CHOICE RATHER THAN AN OVERSIGHT.
 * The line-scanner (`pathFragments`, `PathFragment`), the root chooser
 * (`sourcesFor`, `PathSource`, `PathSourceName`), the edit builder (`editFor`),
 * the listing (`listingDirectory`, `itemsFrom`), the option bag
 * (`PathCompletionOptions`) and the item mark (`PathItemData`, `completedPath`)
 * are all reachable from this package's own tests by relative import, so keeping
 * them internal costs no coverage and buys the freedom to change them. The
 * batch size goes one further and is not exported by its own module at all --
 * what it decides is visible on the wire, which is where it is asserted.
 *
 * THE MARK IS THE ONE WORTH NAMING. `completedPath` and `PathItemData` describe
 * how an item says `I came from here`, and the two handlers below agree about it
 * by importing one definition. Published, every change to that agreement would
 * be a compatibility question with a stranger who never needed to know there was
 * a mark at all.
 */
export { pathCompletion } from "./completion.ts";
export { resolvePathStat } from "./resolve.ts";
