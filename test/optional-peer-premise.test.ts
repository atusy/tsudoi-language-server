import { expect, test } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { declaredMembers, handlerMembers } from "../scripts/workspaces.ts";
import { readReadme, statesFact, UNPUBLISHED } from "./helpers/readme.ts";

import { repoRoot } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * A FALSEHOOD CARRIED FOR A REASON MUST FAIL WHEN ITS REASON DIES, AND THIS IS
 * WHAT MAKES THAT HAPPEN.
 *
 * WHAT THE FALSEHOOD IS. Every handler package declares
 * `@atusy/tsudoi-language-server` a peer and marks it
 * `peerDependenciesMeta.optional`. That flag reads as `this package works
 * without tsudoi`, and it does not: each handler imports a value from tsudoi, so
 * a project that installed only a handler fails at config load. MEASURED: such a
 * project installs with NO WARNING AT ALL and then fails at load.
 *
 * WHAT IT BUYS, AND WHY IT IS ACCEPTABLE TO CARRY. Without it `bun install`
 * exits 1 on a 404 for a package NOTHING HAS PUBLISHED -- in this workspace and
 * in a consumer's project alike. So it is acceptable to carry and not acceptable
 * to carry SILENTLY.
 *
 * WHY A DASHBOARD ENTRY WOULD NOT DO, and this file exists instead of one: the
 * project's dashboard COMPACTS, and nobody re-reads a closed sprint's decisions
 * on publication day. Something has to REDDEN.
 *
 * WHERE THE PUBLISHING EDIT PASSES, AND IT IS A MACHINE GATE RATHER THAN PROSE.
 * tsudoi's manifest carries `private: true`, and `bun publish` REFUSES a private
 * package outright -- MEASURED on this manifest: `error: attempted to publish a
 * private package`, raised before `prepack` is even run. So a publisher cannot
 * reach a registry without first deleting that key, and deleting it is what
 * reddens every member still carrying the flag.
 *
 * WHY NOT `prepublishOnly`: a guard script fires at publish time, which
 * is precisely when nobody is running this suite. It could not be exercised
 * without publishing, so its own correctness would go unmeasured -- and a guard
 * that has never been observed to fire is a guard on paper. `private` is read by
 * the tool AND readable here, which is what lets both halves be checked in the
 * gate that runs every day.
 *
 * NO REGISTRY IS EVER CONSULTED. A probe that asked one would make this
 * repository's green depend on somebody else's uptime, and would redden for a
 * network fault as loudly as for a broken premise.
 *
 * HANDLERS AND NOT MEMBERS, enumerated from the workspace configuration so the
 * next package repeating the falsehood is covered without an edit here. The
 * difference is not cosmetic: the falsehood is `tsudoi is optional to me`, which
 * tsudoi cannot say about itself -- a member-wide enumeration would report the
 * framework as an offender for declaring no peer on the package it IS.
 *
 * WHAT THIS CATCHES is any route to publication that goes through THIS manifest,
 * which is every route a publisher standing in this repository can take. WHAT IT
 * CANNOT SEE: it reads a file, not the world -- a publish from a FORK, or under a
 * DIFFERENT NAME, or from a tree whose manifest was rewritten in flight, leaves
 * this green because the package it describes is no longer the one being
 * published. It also cannot know whether tsudoi is published -- only whether this
 * repository still forbids it.
 */

const PUBLISHED_NAME = "@atusy/tsudoi-language-server";

/**
 * The manifest whose edit permits publication: the package DECLARING the
 * published name, found among the packages this workspace holds.
 *
 * NOT THE CHECKOUT ROOT, and the failure that reading produces is silent rather
 * than loud: a private workspace root keeps its flag for ever, so the premise
 * would read TRUE by construction and the whole file would go green measuring
 * nothing, on the day the framework becomes a member.
 *
 * A COUNT OTHER THAN ONE IS REFUSED RATHER THAN RESOLVED. Zero means the name
 * this file keys everything on is declared by nothing here -- a state in which
 * falling back to the root would produce exactly the vacuous green above, with
 * nobody able to see it. Two means one package spelled twice, and picking either
 * would be picking which of them a publisher is about to edit.
 */
function publishingManifest(root: string): string {
  const declaring = [root, ...declaredMembers(root)].filter((dir) => {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
      name?: unknown;
    };
    return manifest.name === PUBLISHED_NAME;
  });
  if (declaring.length !== 1) {
    throw new Error(
      `${declaring.length} packages under ${root} declare \`${PUBLISHED_NAME}\`, so nothing here can say which manifest a publisher would have to edit: ${declaring.map((dir) => relative(root, dir)).join(", ")}`,
    );
  }
  return join(declaring[0] as string, "package.json");
}

/**
 * Whether this repository still forbids publishing tsudoi, which is the premise
 * the flag is carried under.
 *
 * THE MANIFEST AND NOT THE DOCUMENT, because this is the copy `bun publish`
 * reads. `private` absent and `private: false` are the same answer -- publication
 * is permitted -- so the reading is for the key being TRUE rather than for its
 * presence.
 */
function tsudoiIsUnpublished(root: string): boolean {
  const manifest = JSON.parse(readFileSync(publishingManifest(root), "utf8")) as {
    private?: unknown;
  };
  return manifest.private === true;
}

/**
 * The members whose manifest disagrees with `unpublished`, BY NAME.
 *
 * ONE FUNCTION FOR BOTH THE LIVE READING AND ITS CONTROL, which is what makes
 * the control worth anything: a second implementation for the perturbed case
 * would agree with this one only until it did not.
 */
function disagreeing(root: string, unpublished: boolean): string[] {
  const offenders: string[] = [];
  for (const member of handlerMembers(root)) {
    const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    const optional = manifest.peerDependenciesMeta?.[PUBLISHED_NAME]?.optional === true;
    if (optional !== unpublished) {
      offenders.push(
        `${relative(root, member)} marks the peer optional=${String(optional)} while tsudoi's own manifest forbids publication=${String(unpublished)}`,
      );
    }
  }
  return offenders;
}

/**
 * THE LIVE READING, AND IT IS WRITTEN SO THAT PUBLICATION DAY GETS A FAILURE
 * NAMING THE FILES TO EDIT rather than one saying the manifest moved.
 *
 * THE PREMISE IS READ, NEVER ASSERTED. `publication is forbidden` is TRUE today
 * and must be allowed to become false -- an assertion on it would demand the
 * repository stay unpublishable for ever, which is the opposite of what this
 * file is for. What may not happen is the two DISAGREEING.
 *
 * BOTH DIRECTIONS, and the second is the one nobody thinks about: a member that
 * quietly dropped the flag while tsudoi is still unpublished is named here too,
 * because installing that package then 404s.
 *
 * THE RESIDUAL, WHICH IS THE PUBLISHING READER'S AND NOT THE ONE WHO REDDENED
 * THIS ARM BY DROPPING A FLAG -- deleting `private` is its precondition. A
 * handler's build reads the framework's SOURCE when the
 * framework's artifact is absent, and a consumer receives the framework's
 * `dist/`. The declarations that ship are the same either way -- measured, and
 * the reading is at `prepareWorkspace` in scripts/workspaces.ts -- so what is
 * left is narrow: it bites only if the framework's OWN published dist/ disagreed
 * with its src/ at publish time -- a publish that skipped `prepack`, OR one
 * whose dist/ carried a file `prepack` did not rewrite. THE SECOND DISJUNCT IS
 * NOT A HEDGE: unlike both handlers, the framework's `prepack` is `tsc -p
 * tsconfig.build.json` with NO `rm -rf dist` in front of it, so it clears
 * nothing and an artifact surviving from an earlier shape of src/ ships beside
 * the freshly emitted ones.
 *
 * WHAT HAPPENS THEN IS OFFERED AS AN INFERENCE FROM THE MEASURED MECHANISM AND
 * IS LABELLED ONE RATHER THAN MEASURED: since a handler's emitted declaration
 * names the framework BY SPECIFIER -- which is measured, and armed at
 * test/handler-declaration-specifier.test.ts -- a consumer's compiler re-resolves
 * that specifier against the framework THEY installed, so a disagreement should
 * surface in THEIR compile as a named error. INFERRED, NOT OBSERVED: no
 * consumer-side compile against a skipped-prepack publish has been run here. If
 * it holds, the residual degrades WHO meets the error and not whether anyone
 * does. THE ANSWER A PUBLISHER OWES IS THEREFORE ABOUT THEIR OWN ROUTE, AND
 * `PREPACK RAN` IS NOT THE WHOLE OF IT for the reason above: that the publish
 * they are about to make did not skip `prepack`, AND that nothing in the
 * framework's dist/ predates the source it is shipped beside.
 */
test("no member's optional-peer flag disagrees with what tsudoi's manifest says about publication", () => {
  // The pair: with no members this reading is empty for a reason that has
  // nothing to do with the premise.
  expect(handlerMembers(repoRoot).length).toBeGreaterThan(0);
  expect(disagreeing(repoRoot, tsudoiIsUnpublished(repoRoot))).toEqual([]);
});

/**
 * THE CONTROL: the day the premise dies, this reading names every member still
 * carrying the flag.
 *
 * PERTURBING THE ANSWER RATHER THAN THE MANIFEST, deliberately. Rewriting a copy
 * of package.json and re-reading it would measure the JSON parser; what is under
 * test here is that a FALSE premise produces a red against the members'
 * manifests as they stand today.
 *
 * BOTH MEMBERS NAMED, not merely a non-empty list: a control that fired on one
 * package would leave the second repeating the falsehood with nothing saying so,
 * which is exactly what a claim naming one package does.
 */
test("the same reading names every member the moment the manifest permits publication", () => {
  const offenders = disagreeing(repoRoot, false);

  expect(offenders.length).toBe(handlerMembers(repoRoot).length);
  for (const member of handlerMembers(repoRoot)) {
    expect(offenders.join("\n")).toContain(relative(repoRoot, member));
  }
});

/**
 * THE DOCUMENT IS HELD TO THE GATE, which is what keeps the prose from drifting
 * once the machine reading above stopped depending on it.
 *
 * THE MANIFEST IS THE SUBJECT AND THE README IS THE PREDICATE, in that order: a
 * publisher deletes `private` because the tool forced them to, and this is what
 * says the document must catch up. Without it the root README could go on
 * calling tsudoi unpublished for as long as nobody noticed -- true of the flag's
 * premise and false of the world.
 */
test("the root README agrees with the manifest about whether publication is forbidden", () => {
  expect(`README says unpublished: ${String(statesFact(readReadme(), UNPUBLISHED))}`).toBe(
    `README says unpublished: ${String(tsudoiIsUnpublished(repoRoot))}`,
  );
});

/**
 * A WORKSPACE SHAPED LIKE THE ONE THIS REPOSITORY IS BECOMING: the published
 * name is declared by a MEMBER, and the root is a private workspace root that
 * publishes nothing and keeps its flag for ever.
 *
 * BUILT HERE BECAUSE THIS REPOSITORY CANNOT BE THE SUBJECT: today the two
 * manifests are the same file, so no reading taken on this checkout can tell a
 * locator from a hard-coded root. The differential below is the whole reason the
 * locator exists, and it is available before the move rather than after it.
 */
function frameworkAsAMember(
  rootPrivate: boolean,
  frameworkPrivate: boolean,
): Record<string, string> {
  const handler = JSON.stringify({
    name: "@scope/handler",
    peerDependencies: { [PUBLISHED_NAME]: "*" },
    peerDependenciesMeta: { [PUBLISHED_NAME]: { optional: true } },
  });
  return {
    "package.json": JSON.stringify({
      name: "@scope/workspace",
      private: rootPrivate,
      workspaces: ["packages/*"],
    }),
    "packages/framework/package.json": JSON.stringify({
      name: PUBLISHED_NAME,
      private: frameworkPrivate,
    }),
    "packages/first/package.json": handler,
    "packages/second/package.json": handler,
  };
}

/** Reads the premise over a throwaway workspace and disposes of it. */
function offendersIn(files: Record<string, string>): string[] {
  const root = workspace(files);
  try {
    return disagreeing(root, tsudoiIsUnpublished(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * THE FALSIFIER, AND IT IS THE DIFFERENTIAL THE CRITERION ASKS FOR: the sentinel
 * leaves the LOCATED manifest and every handler is reported.
 */
test("deleting the sentinel from the manifest that declares the published name reports every handler", () => {
  const offenders = offendersIn(frameworkAsAMember(true, false));

  expect(offenders.length).toBe(2);
  expect(offenders.join("\n")).toContain(join("packages", "first"));
  expect(offenders.join("\n")).toContain(join("packages", "second"));
});

/**
 * THE CONTROL, AND IT IS THE HALF A LOCATOR GETS BACKWARDS BY FALLING BACK. A
 * DIFFERENT manifest losing the sentinel must not move the reading -- and the
 * root's is the one that will lose it in practice, because a workspace root
 * nobody publishes is where a maintainer's eye lands first.
 *
 * WITHOUT THIS PAIR the arm above is satisfied by a reading that simply ORs the
 * two manifests together, which would be green on the falsifier and green on
 * nothing being wrong at all.
 */
test("a different manifest losing the sentinel does not move the reading", () => {
  expect(offendersIn(frameworkAsAMember(false, true))).toEqual([]);
});

/**
 * NOTHING DECLARING THE NAME IS REFUSED RATHER THAN FALLING BACK, because the
 * fallback is the exact green this relocation exists to remove: a locator that
 * quietly answered `the root` when it found no match would be the old reading
 * wearing the new one's name, and no test could tell them apart.
 */
test("a workspace where nothing declares the published name is refused, naming it", () => {
  const root = workspace({
    "package.json": JSON.stringify({ name: "@scope/workspace", workspaces: ["packages/*"] }),
    "packages/first/package.json": JSON.stringify({ name: "@scope/first" }),
  });
  try {
    expect(() => tsudoiIsUnpublished(root)).toThrow(PUBLISHED_NAME);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE OTHER HALF OF `where the publishing edit passes`: each member's OWN README
 * states the premise too, in the document a stranger who installed it reads. NOT
 * A SECOND INSTRUMENT -- the machine reading is keyed on the manifest, and this
 * only holds the correction a consumer meets to the same premise.
 * test/packed-members.test.ts reads the same premise off the TARBALL -- as `peer`
 * and `optional`, never this word -- which is where a registry reader meets it.
 */
test("every member's own README states the premise the flag is carried under", () => {
  const members = handlerMembers(repoRoot);

  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    const readme = readFileSync(join(member, "README.md"), "utf8");

    expect(`${relative(repoRoot, member)}: ${readme}`).toContain("unpublished");
  }
});
