import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { buildOrder, declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

/**
 * THE ORDER PACKAGES ARE BUILT IN IS A FACT ABOUT WHAT THEY NEED, READ AS A
 * VALUE.
 *
 * WHY A RETURNED SEQUENCE AND NOT ONLY A BUILD THAT SUCCEEDS: `build everything
 * twice` and `build in any order and retry until green` both leave exactly the
 * artifacts a correct order leaves, so no reading taken AFTER the build can tell
 * them from it. They are visible in a sequence and invisible in a result, which
 * is why this file asserts a value and the artifact reading lives in the arm
 * that drives the real builder.
 */

test("the derived order is the order this repository already builds in", () => {
  // BYTE-FOR-BYTE TODAY'S CONSTRUCTED ORDER, which is what lets the derivation
  // land with no behaviour change: the builder ran the root and then looped
  // `declaredMembers`, so this equality is the whole claim that nothing moved.
  expect(buildOrder(repoRoot)).toEqual([repoRoot, ...declaredMembers(repoRoot)]);
});

test("every package the workspace declares is ordered exactly once", () => {
  const order = buildOrder(repoRoot);

  // THE NODE SET IS READ AGAINST THE WORKSPACE ITSELF, so an order that
  // returned nothing -- or that quietly dropped whatever it could not place --
  // cannot satisfy the sequence assertion by being short.
  expect([...order].sort()).toEqual([repoRoot, ...declaredMembers(repoRoot)].sort());
  expect(new Set(order).size).toBe(order.length);
});

/**
 * A WORKSPACE WHERE THE ALPHABET GETS IT WRONG: `consumer` sorts before
 * `producer` and needs it built first.
 *
 * THIS REPOSITORY CANNOT BE THE SUBJECT AND THAT IS THE WHOLE REASON THE TREE IS
 * BUILT HERE: on this checkout the derived order and the sorted one AGREE, by an
 * accident of what the packages are called. A file asserting only the repository
 * would be satisfied by `sort()` forever, and would go on being satisfied by it
 * on the day a name changes and the accident stops holding.
 *
 * THE ARMS BELOW MAY NEVER BE RETARGETED AT A TREE WHERE THE TWO ORDERS AGREE.
 * They are the only thing in this repository forbidding `the sort is the order`
 * as a reading of the tie-break.
 */
function producerSortingLast(consumerNeeds: Record<string, unknown>): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "@scope/root", workspaces: ["packages/*"] }),
    "packages/consumer/package.json": JSON.stringify({
      name: "@scope/consumer",
      ...consumerNeeds,
    }),
    "packages/producer/package.json": JSON.stringify({ name: "@scope/producer" }),
  };
}

test("a producer that sorts last is still built first", () => {
  const root = workspace(producerSortingLast({ dependencies: { "@scope/producer": "*" } }));
  try {
    const order = buildOrder(root);

    expect(order).toEqual([
      root,
      join(root, "packages", "producer"),
      join(root, "packages", "consumer"),
    ]);
    // WHAT THE ALPHABET WOULD HAVE ANSWERED, asserted rather than left to a
    // reader's sense of how `c` and `p` sort: without this line the arm above
    // is a sequence nobody can tell from a sorted one at a glance.
    expect([...order].sort()).not.toEqual(order);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// THE CONTROL IS THE SAME TREE WITH ONE DECLARATION DELETED, and it is stronger
// than a hand-written sorted rival would be: a rival only shows that some other
// function behaves differently, where this shows the order came from THE
// DECLARATION and from nothing else about the tree. Every path, every name and
// every file is what it was above.
test("the same two packages order by the tie-break once the declaration is gone", () => {
  const root = workspace(producerSortingLast({}));
  try {
    const order = buildOrder(root);

    expect(order).toEqual([
      root,
      join(root, "packages", "consumer"),
      join(root, "packages", "producer"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
