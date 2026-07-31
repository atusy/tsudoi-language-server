import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  declaredMembers,
  prepareWorkspace,
  refuseMemberDirectoriesUnlikeTheUnscopedName,
  refuseMemberMappings,
  refuseUncoveredPackages,
} from "./workspaces.ts";

/**
 * THE FIFTH DEFINITION-OF-DONE CHECK: every workspace member type-checks under
 * ITS OWN tsconfig, because the root check must not and now cannot.
 *
 * WHY THE ROOT CHECK IS WITHDRAWN RATHER THAN KEPT AS A SECOND OPINION, and it
 * is worse than a gap: root `tsc --noEmit` answers a member's
 * `@atusy/tsudoi-language-server/*` import THROUGH THE ROOT'S OWN `paths`
 * MAPPING and REPORTS SUCCESS -- so a member whose own dependency resolution is
 * broken type-checks green at the root, and the greener the root the less it
 * means. tsconfig.json therefore excludes the members and this script takes the
 * coverage over. NEITHER HALF WORKS ALONE: without the exclusion this check is
 * shadowed by a root green, and without this check the exclusion means nothing
 * type-checks a member at all. The exclusion's reason is asserted in
 * test/package-shape.test.ts, since a tsconfig cannot carry one.
 *
 * AND NEITHER HALF SURVIVES A MAPPING ONE DIRECTORY DOWN. Withdrawing the root's
 * answer buys nothing if a MEMBER may write the same mapping into its own
 * tsconfig: it answers the same specifier the same way, this check goes green,
 * and the resolution a stranger takes is again the one nothing looked at. So
 * `refuseMemberMappings` refuses it -- over members as a class, and over the
 * EFFECTIVE configuration, so a mapping arriving through `extends` is refused
 * too.
 *
 * ENUMERATED FROM `workspaces` by scripts/workspaces.ts, which the build shares,
 * so adding a package under `packages/` costs no edit here.
 * test/workspace-members.test.ts drives that by construction.
 *
 * WHAT IS RUN IS `tsc`, NOT A REIMPLEMENTATION OF ONE, and the binary is reached
 * through node_modules/.bin rather than by bare name: nothing here is a package
 * script and PATH is not this repo's to choose. test/package-shape.test.ts pins
 * that the binary there is the version this repo declares.
 *
 * A ROOT TO CHECK MAY BE PASSED AS THE ONE ARGUMENT, defaulting to the working
 * directory. That is what lets the assertions about this file build throwaway
 * workspaces instead of asserting against the repo it is running in -- a check
 * whose only subject is its own repository can be measured in exactly one state.
 */

/** The checkout this script ships in, which is where its compiler is found. */
const toolRoot = fileURLToPath(new URL("../", import.meta.url));

/**
 * Type-checks one member under its own tsconfig, reporting whether it passed.
 *
 * RUN FROM THE ROOT AND NOT FROM THE MEMBER, which is what puts the member's
 * name in tsc's own diagnostics: tsc prints paths relative to the working
 * directory, so a run from inside the member reports `src/index.ts` and a reader
 * of a two-member failure cannot tell whose it is.
 */
function typeCheckMember(root: string, member: string): boolean {
  const config = join(member, "tsconfig.json");
  if (!existsSync(config)) {
    throw new Error(
      `${relative(root, member)} is a workspace member with no tsconfig.json, so this check has nothing to type-check it with.`,
    );
  }
  const result = spawnSync(join(toolRoot, "node_modules", ".bin", "tsc"), ["-p", config], {
    cwd: root,
    stdio: "inherit",
  });
  return result.status === 0;
}

const root = resolve(process.argv[2] ?? process.cwd());
// A MEMBER IS TYPE-CHECKED AGAINST WHAT IT ACTUALLY RESOLVES, which is the
// dist/ its dependency publishes and not that dependency's source. So this
// builds before it reads, on the preload's own reasoning: a check run against a
// dist/ nobody rebuilt reports on a tree that no longer exists, and the failure
// it invents -- TS2307 for a subpath that resolves perfectly well -- is exactly
// the one this check exists to distinguish.
prepareWorkspace(root);
// EVERY MEMBER AND NOT ONLY THE HANDLERS, which is the one enumeration in this
// repository that may never narrow: this check is the ONLY thing type-checking a
// package the root program excludes, so a member it skipped would be covered by
// nothing at all while all five commands exit 0. The guards it runs read the
// same list for the same reason.
const members = declaredMembers(root);
refuseUncoveredPackages(root, members);
// HERE AND NOT IN `prepareWorkspace`, WHICH WOULD HAVE BEEN THE TIDIER HOME AND
// IS THE WRONG ONE: that function is also what the `bun test` preload runs, so a
// refusal wired into it aborts every test run before a single file loads. The
// reds a rename must be watched producing would then be unobservable, because
// nothing would get far enough to produce them. A refusal belongs on the check
// path, beside the two that are already here.
//
// BEFORE ANY MEMBER IS TYPE-CHECKED, AND NOT BEFORE THE COMPILER RUNS AT ALL --
// `prepareWorkspace` above has already spawned tsc to BUILD each member, so this
// cannot be and does not claim to be the first thing to touch one. What it is
// ahead of are the DIAGNOSTICS: every one of them is printed as a path under the
// directory whose name is in question, and a reader sent to
// `packages/<one spelling>` by a run that has not yet said the other spelling
// exists is being sent by whichever half of the disagreement happens to be on
// disk.
refuseMemberDirectoriesUnlikeTheUnscopedName(root, members);
// BEFORE ANY MEMBER IS CHECKED, because a mapping makes the check that follows
// answer the wrong question: a member reaching past its own resolution
// type-checks GREEN, so running the checks first and the guard afterwards would
// print a success no reader would then go back and disbelieve.
refuseMemberMappings(root, members);
let failed = false;
for (const member of members) {
  if (!typeCheckMember(root, member)) {
    failed = true;
  }
}
if (failed) {
  process.exitCode = 1;
}
