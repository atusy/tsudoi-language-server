import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { handlerMembers } from "../scripts/workspaces.ts";
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
 * WHERE THE PUBLISHING EDIT PASSES, AND IT IS A MACHINE GATE RATHER THAN PROSE.
 * The root manifest carries `private: true`, and `bun publish` REFUSES a private
 * package outright -- MEASURED on this manifest: `error: attempted to publish a
 * private package`, raised before `prepack` is even run. So a publisher cannot
 * reach a registry without first deleting that key, and deleting it is what
 * reddens every member still carrying the flag.
 *
 * WHY NOT THE README, which is the obvious instrument and the weaker one: prose
 * is not on the publication path. A publisher who runs `bun publish` without
 * opening the document succeeds, and every member's manifest goes on saying
 * tsudoi is optional with nothing anywhere having moved. The manifest cannot be
 * bypassed that way, because the tool reads it.
 *
 * WHY NOT `prepublishOnly` EITHER: a guard script fires at publish time, which
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
 * OVER HANDLER PACKAGES AS A CLASS, ENUMERATED FROM THE WORKSPACE
 * CONFIGURATION, because two packages now repeat one falsehood and a third would
 * repeat it again. HANDLERS AND NOT MEMBERS, and the difference is not cosmetic:
 * the falsehood is `tsudoi is optional to me`, which tsudoi cannot say about
 * itself -- a member-wide enumeration would report the framework as an offender
 * for declaring no peer on the package it IS.
 *
 * WHAT THIS CATCHES: any route to publication that goes through THIS manifest,
 * which is every route a publisher standing in this repository can take.
 *
 * WHAT IT CANNOT SEE, said rather than left to be discovered. It reads a file,
 * not the world: a publish from a FORK, or under a DIFFERENT NAME, or from a
 * tree whose manifest was rewritten in flight, leaves this green because the
 * package it describes is no longer the one being published. It also cannot know
 * whether tsudoi is published -- only whether this repository still forbids it.
 * The two part company for exactly as long as it takes someone to delete the key
 * and not publish, and in that window the flag is a lie this file already names.
 */

/**
 * Whether this repository still forbids publishing tsudoi, which is the premise
 * the flag is carried under.
 *
 * THE MANIFEST AND NOT THE DOCUMENT, because this is the copy `bun publish`
 * reads. `private` absent and `private: false` are the same answer -- publication
 * is permitted -- so the reading is for the key being TRUE rather than for its
 * presence.
 */
function tsudoiIsUnpublished(): boolean {
  const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
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
function disagreeing(unpublished: boolean): string[] {
  const offenders: string[] = [];
  for (const member of handlerMembers(repoRoot)) {
    const manifest = JSON.parse(readFileSync(join(member, "package.json"), "utf8")) as {
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    const optional =
      manifest.peerDependenciesMeta?.["@atusy/tsudoi-language-server"]?.optional === true;
    if (optional !== unpublished) {
      offenders.push(
        `${relative(repoRoot, member)} marks the peer optional=${String(optional)} while the root manifest forbids publication=${String(unpublished)}`,
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
 */
test("no member's optional-peer flag disagrees with what the root manifest says about publication", () => {
  // The pair: with no members this reading is empty for a reason that has
  // nothing to do with the premise.
  expect(handlerMembers(repoRoot).length).toBeGreaterThan(0);
  expect(disagreeing(tsudoiIsUnpublished())).toEqual([]);
});

/**
 * THE CONTROL, AND IT IS THE WHOLE POINT OF THE FILE: the day the premise dies,
 * this reading names every member still carrying the flag.
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
  const offenders = disagreeing(false);

  expect(offenders.length).toBe(handlerMembers(repoRoot).length);
  for (const member of handlerMembers(repoRoot)) {
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
    `README says unpublished: ${String(tsudoiIsUnpublished())}`,
  );
});

test("every member's own README states the premise the flag is carried under", () => {
  const members = handlerMembers(repoRoot);

  expect(members.length).toBeGreaterThan(0);
  for (const member of members) {
    const readme = readFileSync(join(member, "README.md"), "utf8");

    expect(`${relative(repoRoot, member)}: ${readme}`).toContain("unpublished");
  }
});
