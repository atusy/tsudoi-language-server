import { expect, test } from "bun:test";
import { buildOrder, declaredMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";

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
