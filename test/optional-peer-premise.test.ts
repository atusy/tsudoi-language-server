import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { declaredMembers } from "../scripts/workspaces.ts";
import { readReadme, statesFact, UNPUBLISHED } from "./helpers/readme.ts";
import { repoRoot } from "./helpers/spawn.ts";

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
 * WHERE THE PUBLISHING EDIT PASSES. The README's `The package is not published`
 * section is the one durable statement of the premise, and the suite already
 * executes that document -- test/readme.test.ts requires that fact to have
 * exactly ONE home, so the section a publisher rewrites is the section this
 * reads. The moment it stops saying so, every member carrying the flag is named
 * here.
 *
 * OVER MEMBERS AS A CLASS, ENUMERATED FROM THE WORKSPACE CONFIGURATION, because
 * two packages now repeat one falsehood and a third would repeat it again.
 *
 * WHAT THIS CANNOT SEE, said rather than left to be discovered: a publisher who
 * publishes and does not touch the README. Nothing in a test suite observes a
 * registry, and a probe that did would make this repository's green depend on
 * somebody else's uptime. What is bought instead is that the ONE edit a
 * publisher must make to stop the document lying is also the edit that reddens
 * this.
 */

/** Whether the README still states the premise the flag is carried under. */
function tsudoiIsUnpublished(): boolean {
  return statesFact(readReadme(), UNPUBLISHED);
}

/**
 * The members whose manifest disagrees with `unpublished`, BY NAME.
 *
 * ONE FUNCTION FOR BOTH THE LIVE READING AND ITS CONTROL, which is what makes
 * the control worth anything: a second implementation for the perturbed case
 * would agree with this one only until it did not.
 */
function disagreeing(unpublished: boolean): string[] {
  const offenders: string[] = [];
  for (const member of declaredMembers(repoRoot)) {
    const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    const optional =
      manifest.peerDependenciesMeta?.["@atusy/tsudoi-language-server"]?.optional === true;
    if (optional !== unpublished) {
      offenders.push(
        `${relative(repoRoot, member)} marks the peer optional=${String(optional)} while the README says unpublished=${String(unpublished)}`,
      );
    }
  }
  return offenders;
}

/**
 * THE LIVE READING, AND IT IS WRITTEN SO THAT PUBLICATION DAY GETS A FAILURE
 * NAMING THE FILES TO EDIT rather than one saying the README moved.
 *
 * THE PREMISE IS READ, NEVER ASSERTED. `the README says unpublished` is TRUE
 * today and must be allowed to become false -- an assertion on it would demand
 * the document keep lying, which is the opposite of what this file is for. What
 * may not happen is the two DISAGREEING.
 *
 * BOTH DIRECTIONS, and the second is the one nobody thinks about: a member that
 * quietly dropped the flag while tsudoi is still unpublished is named here too,
 * because installing that package then 404s.
 */
test("no member's optional-peer flag disagrees with what the README says about publication", () => {
  // The pair: with no members this reading is empty for a reason that has
  // nothing to do with the premise.
  expect(declaredMembers(repoRoot).length).toBeGreaterThan(0);
  expect(disagreeing(tsudoiIsUnpublished())).toEqual([]);
});

/**
 * THE CONTROL, AND IT IS THE WHOLE POINT OF THE FILE: the day the premise dies,
 * this reading names every member still carrying the flag.
 *
 * PERTURBING THE ANSWER RATHER THAN THE DOCUMENT, deliberately. Editing a copy
 * of the README and re-reading it would measure the fact extractor, which
 * test/readme.test.ts already owns; what is under test here is that a FALSE
 * premise produces a red against the manifests as they stand today.
 *
 * BOTH MEMBERS NAMED, not merely a non-empty list: a control that fired on one
 * package would leave the second repeating the falsehood with nothing saying so,
 * which is exactly what a claim naming one package does.
 */
test("the same reading names every member the moment the README stops saying so", () => {
  const offenders = disagreeing(false);

  expect(offenders.length).toBe(declaredMembers(repoRoot).length);
  for (const member of declaredMembers(repoRoot)) {
    expect(offenders.join("\n")).toContain(relative(repoRoot, member));
  }
});

/**
 * THE OTHER HALF OF `where the publishing edit passes`: each member's OWN README
 * states the premise too, in the document a stranger who installed it reads.
 *
 * IT IS NOT A SECOND INSTRUMENT. The reading above is keyed on the root
 * document, which is where a publisher works; this asserts that the correction
 * a consumer meets carries the same premise, so the two cannot say different
 * things about when the flag is a lie. test/packed-members.test.ts reads the
 * same word off the TARBALL, which is where a registry reader meets it.
 */
test("every member's own README states the premise the flag is carried under", () => {
  const members = declaredMembers(repoRoot);

  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    const readme = readFileSync(join(member, "README.md"), "utf8");

    expect(`${relative(repoRoot, member)}: ${readme}`).toContain("unpublished");
  }
});
