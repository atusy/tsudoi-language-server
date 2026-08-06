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
 * WHAT THE SEPARATION BUYS, MEASURED RATHER THAN TIDY: it is what puts a
 * weakening of the layout account inside the perturbation registry instead of in
 * prose. Every other `read` row reads something the STAGE LACKS -- the install
 * row compares against `basename(repoRoot)`, the snippet row resolves specifiers
 * answering out of `dist/` -- which is the second of the three mechanisms
 * test/perturbations.test.ts names, and their arms would be red at the baseline
 * rather than at any weakening. These arms read neither.
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
