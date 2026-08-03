import { expect, test } from "bun:test";
import { armReadAccounts } from "./helpers/account-arms.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { readAccounts } from "./helpers/readme.ts";
import { repoRoot } from "./helpers/spawn.ts";

applySuiteDeadline();

/**
 * THE ACCOUNTS THAT NEED SOMETHING BESIDES THE DOCUMENT -- this checkout's own
 * directory name, or a tree with the packages built into it.
 *
 * THE SPLIT IS THE TABLE'S, and test/readme-layout.test.ts carries the other
 * half with the measurement that decided where the line falls. Nothing here is
 * weaker than what is over there; what is different is only where its arms can
 * be RUN, and the perturbation registry is the caller that cares.
 *
 * WHAT NEITHER FILE CAN SAY, NAMED SO A GREEN IS NOT OVER-READ: an account is a
 * claim about the part of a block it NAMES. The snippet row's subject is the
 * specifiers, so a snippet whose imports all resolve and whose body is wrong is
 * accounted for and unchecked. That is the account rule working as designed --
 * the alternative is a rule admitting `it is read` wholesale, which certifies
 * the rubber stamp, or one demanding that corrupting any byte reddens
 * something, which would refuse the very blocks this item forbids refusing.
 */
const accounts = readAccounts(repoRoot).filter(
  (account) => account.form.needs !== "the document alone",
);

// The pair for the loop below, and the other half of the split: an edit that
// moved every row into one file would leave one of these two claiming nothing.
test("the table pairs at least one block with an account that needs more than the document", () => {
  expect(accounts.map((account) => `${account.consumer.name} ${account.at}`)).not.toEqual([]);
});

armReadAccounts(accounts);
