import { expect, test } from "bun:test";
import { armReadAccounts } from "./helpers/account-arms.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { readAccounts } from "./helpers/readme.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE ACCOUNTS THAT READ NOTHING BUT THE DOCUMENT, AND THAT IS WHY THEY ARE IN A
 * FILE OF THEIR OWN.
 *
 * THE SPLIT IS THE TABLE'S AND NOT A LIST HERE: each `read` row declares what
 * its assertion needs besides the block, and this file takes the rows that need
 * nothing else. A row added tomorrow lands in the right file by saying so.
 *
 * WHAT THE SEPARATION BUYS, MEASURED RATHER THAN TIDY: the perturbation registry
 * re-runs a recorded weakening by staging a checkout of every TRACKED file --
 * with no build outputs, and under a temporary directory whose NAME is not this
 * repository's. Every other `read` row here reads one or the other: the install
 * row compares against `basename(repoRoot)`, which is the stage's own temporary
 * name there, and the snippet row resolves specifiers that answer out of `dist/`.
 * Their arms are legitimately red in such a stage, and a registry row over them
 * would fail at the baseline rather than at its weakening. These arms are not,
 * so a weakening of the layout account can be recorded as something the suite
 * RE-RUNS instead of as prose.
 */
const accounts = readAccounts(repoRoot).filter(
  (account) => account.form.needs === "the document alone",
);

// The pair for the loop below: no accounts would make every claim in this file a
// claim about nothing, asserted rather than left to a green empty loop.
test("the table pairs at least one block with an account that needs only the document", () => {
  expect(accounts.map((account) => `${account.consumer.name} ${account.at}`)).not.toEqual([]);
});

armReadAccounts(accounts);
