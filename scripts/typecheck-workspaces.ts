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
  refuseSubpathsAnsweringFromSource,
  refuseUncoveredFiles,
} from "./workspaces.ts";

/**
 * THE FIFTH DEFINITION-OF-DONE CHECK: every workspace member type-checks under
 * ITS OWN tsconfig, because the root check must not and now cannot.
 *
 * WHY THE ROOT CHECK IS WITHDRAWN RATHER THAN KEPT AS A SECOND OPINION. THE
 * REASON WRITTEN HERE THROUGH SPRINT 61 DESCRIBED A LAYOUT THAT IS GONE and is
 * superseded rather than amended: it said the root answered a member's
 * `@atusy/tsudoi-language-server/*` import through the root's own `paths`
 * MAPPING and reported success. THERE IS NO MAPPING ANYWHERE IN THIS
 * REPOSITORY -- `refuseMemberMappings` below enforces the absence for members,
 * and the root's own tsconfig carries none -- so a finding taken against the
 * mapped layout cannot be inherited by this one.
 *
 * WHAT IS TRUE OF THE LAYOUT THAT EXISTS, MEASURED at base 954cc62 with
 * `tsc --noEmit --listFiles` and `--traceResolution` over a built tree rather
 * than read off this file: the root's `exclude` stops a member's files being
 * swept in, so NO handler source file is in the root program at all -- the
 * check does not answer for those members, it never opens them. What of a
 * member DOES arrive comes by two routes that are not the member's own, and
 * neither is a route a stranger takes: the framework's own `src/` enters
 * through RELATIVE imports from this suite's own `test/*.test.ts`, and each
 * package's `dist/*.d.ts` enters BY PACKAGE NAME from `examples/`. So the root
 * green is still not a second opinion on a member -- not because it answers
 * wrongly, but because for two of three members it is silent, and for the third
 * it grades files reached by a path no consumer writes.
 *
 * tsconfig.json therefore excludes the members and this script takes the
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
 * AND NEITHER HALF SAYS ANYTHING ABOUT A FILE NO PROGRAM READS. Between them
 * they cover every file some config INCLUDES and are silent about the rest, so a
 * file dropped beside a member's source -- or under a directory whose name
 * begins with a dot, where no default include reaches -- is run by whatever runs
 * it and graded by nobody, with all five commands exit 0. `refuseUncoveredFiles`
 * refuses that, deciding membership by reading THE COMPILERS' OWN FILE LISTS
 * rather than the globs in the JSON, and keeping the package-shaped sentence for
 * the package-shaped case.
 *
 * IT NEEDS `git` THE WAY THE REST OF THIS NEEDS `tsc`, and for one reason: git is
 * what can tell a source somebody wrote from an installed stranger or a built
 * artifact. A root it cannot enumerate is refused rather than read as owning
 * nothing.
 *
 * ENUMERATED FROM `workspaces` by scripts/workspaces.ts, which the build shares,
 * so adding a package under `packages/` costs no edit here.
 * test/workspace-members.test.ts drives that by construction, and
 * test/uncovered-files.test.ts drives the file refusal the same way.
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
// A MEMBER IS TYPE-CHECKED AGAINST WHAT IT ACTUALLY RESOLVES, so this builds
// before it reads, on the preload's own reasoning: a check run against a dist/
// nobody rebuilt reports on a tree that no longer exists.
//
// WHAT THE ORDER SPARES IS NOT A RED, AND THIS IS A CORRECTION CARRYING ITS OWN
// PROVENANCE BECAUSE IT IS ITSELF A MEASUREMENT. This used to license the order
// with an INVENTED failure -- `TS2307 for a subpath that resolves perfectly
// well`, exactly the one this check exists to distinguish. MEASURED FALSE at
// sprint 61, base 6d1c85d, tsc 7.0.2, on a staged tree with no dist/ anywhere: a
// member's own `tsc -p tsconfig.build.json` EXITS 0 AND EMITS, its
// `@atusy/tsudoi-language-server/*` subpaths TRACED to
// packages/tsudoi-language-server/src/*.ts, because the framework's map ends in
// a source arm the compiler falls through to. There is no red to spare. WHAT THE
// ORDER ACTUALLY BUYS IS WHICH FILE THE GRADE IS TAKEN AGAINST: unbuilt, this
// check greens a member whose declarations were read against a file no consumer
// receives, and it greens it silently. That silence is why
// `refuseSubpathsAnsweringFromSource` below reads what the build WROTE instead
// of trusting the exit codes underneath it. The same correction is at
// `prepareWorkspace` in scripts/workspaces.ts.
prepareWorkspace(root);
// EVERY MEMBER AND NOT ONLY THE HANDLERS: `buildOrder` reads this same list, so
// narrowing it drops that member from the test-time build too. MEASURED, and it
// refutes what stood here: dropping a handler from `workspaces` reddens 11 arms
// with dist/ intact, so the narrowing is loud rather than silent. The guards
// below read the same list for the same reason.
const members = declaredMembers(root);
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
// LAST AMONG THE REFUSALS, AND ITS REASON IS NOT THE OTHERS'. The two above are
// questions about the workspace's own DECLARATIONS -- what each member is
// called, how each resolves -- and this one is a question about the TREE, which
// is only worth asking once those answers are believed. It is also the widest:
// those two name one manifest each, where this one can name many files, and a
// run that printed the list first would bury a one-line fault about a
// declaration underneath it.
//
// AND IT IS WHERE THE UNCOVERED-PACKAGE REFUSAL WENT. That guard used to stand
// above, deciding coverage by walking directories that hold a manifest -- the
// reading that ran over the file this one was built for. It is now a REFINEMENT
// inside this call: the same sentence, printed in place of the files it SPEAKS
// FOR -- the ones inside a package nobody declared -- and beside the file list
// for any offender it does not speak for, whose repair the package sentence
// would not have been.
//
// THE MOVE COST A STATE AND NOT ONLY A CALL, WHICH BELONGS HERE RATHER THAN
// ONLY IN THE FUNCTION IT MADE PRIVATE: what is refused NARROWED. An undeclared
// package holding NO TypeScript used to be reported by the walker and is now
// left alone, because the file lists find nothing there to refine and this
// check is not allowed a second opinion about coverage. The narrowing is a
// ruling -- nothing about such a package is unchecked -- and it is pinned as
// one in test/workspace-members.test.ts, but a reader meets the ordering story
// here and would otherwise read `the same sentence` as `the same states`.
//
// STILL NOT IN `prepareWorkspace`, for the reason already recorded beside the
// name guard: that function is what the `bun test` preload runs, so a refusal
// wired into it would abort every test run before a file loaded -- and the reds
// this one must be watched producing would become unobservable.
//
// AND BEFORE ANY MEMBER IS CHECKED, because a member that type-checks green
// says nothing about the files its config never looked at: printing that green
// first would leave a reader disbelieving the refusal that follows it.
refuseUncoveredFiles(root, members);
// AFTER THE BUILD AND BEFORE ANYTHING GRADES WHAT IT WROTE, which is a
// requirement about WHEN and not about what: moving this call below the loop
// changes no value, leaves this file's own bytes almost identical, and turns the
// refusal into a report printed after every member has already been checked
// against a file no consumer receives. test/artifact-detector.test.ts asserts
// the position by driving THIS command and reading what it did NOT print.
//
// LAST AMONG THE REFUSALS AND NOT FIRST. The three above are questions about
// DECLARATIONS and about the TREE -- answerable whether or not a build wrote
// anything -- and this one is a question about what the build LEFT. A reader
// told their artifact does not answer, before being told the package it belongs
// to is not even declared, would repair the wrong thing.
refuseSubpathsAnsweringFromSource(root, members);
let failed = false;
for (const member of members) {
  if (!typeCheckMember(root, member)) {
    failed = true;
  }
}
if (failed) {
  process.exitCode = 1;
}
