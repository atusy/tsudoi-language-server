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

// AN OPTIONAL PEER IS AN EDGE, and this is the arm that keeps the whole
// derivation from being vacuous on this repository: both handler packages reach
// tsudoi through a peer they declare OPTIONAL, so a reading that dropped
// optional peers would leave this graph with no edges at all and hand the order
// back to the alphabet under a topological sort's name. The flag buys
// installability while the peer is unpublished; it says nothing about what a
// compiler needs, and each of those packages imports values from it.
test("a peer declared optional still orders its producer first", () => {
  const root = workspace(
    producerSortingLast({
      peerDependencies: { "@scope/producer": "*" },
      peerDependenciesMeta: { "@scope/producer": { optional: true } },
    }),
  );
  try {
    expect(buildOrder(root)).toEqual([
      root,
      join(root, "packages", "producer"),
      join(root, "packages", "consumer"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A DEPENDENCY THAT ONLY THE TESTS NEED IS NOT A BUILD EDGE, shown on the tree
 * where the difference is visible from the outside: `early` needs `late` to
 * BUILD, and `late` devDepends back on `early`.
 *
 * TWO READINGS AT ONCE, which is why the arrows point opposite ways rather than
 * along the alphabet. If the dev edge were taken this pair would be a CYCLE and
 * the answer could not be an order at all; if the real edge were not taken the
 * answer would be the alphabet's. Only one sequence satisfies both.
 *
 * IT IS THIS REPOSITORY'S OWN SHAPE AND NOT A HYPOTHETICAL: the root devDepends
 * on both handler packages and both of them depend back on the root, so a reader
 * counting dev edges finds two cycles here -- inside the `bun test` preload,
 * where a refusal means nothing loads.
 */
test("a package that only devDepends on another is neither ordered by it nor a cycle", () => {
  const root = workspace({
    "package.json": JSON.stringify({ name: "@scope/root", workspaces: ["packages/*"] }),
    "packages/early/package.json": JSON.stringify({
      name: "@scope/early",
      dependencies: { "@scope/late": "*" },
    }),
    "packages/late/package.json": JSON.stringify({
      name: "@scope/late",
      devDependencies: { "@scope/early": "*" },
    }),
  });
  try {
    expect(buildOrder(root)).toEqual([
      root,
      join(root, "packages", "late"),
      join(root, "packages", "early"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A PACKAGE THAT DECLARES NO `name` IS ORDERED RATHER THAN REFUSED, AT THE ROOT
 * AND AT A MEMBER, and the reason is an ordering between two guards rather than
 * a view about the state.
 *
 * `refuseMemberDirectoriesUnlikeTheUnscopedName` is what refuses a nameless
 * member, and it runs in the FIFTH CHECK. This runs in the `bun test` PRELOAD, so
 * a refusal here would abort the suite before that guard could speak -- and the
 * arm in test/workspace-members.test.ts that pins it would go red still
 * containing the word `name`, reddened by the wrong function, which is a red
 * that sends its reader to the wrong file.
 */
test("a nameless root and a nameless member are ordered rather than refused", () => {
  const root = workspace({
    "package.json": JSON.stringify({ workspaces: ["packages/*"] }),
    "packages/anonymous/package.json": JSON.stringify({ version: "0.0.0" }),
    "packages/named/package.json": JSON.stringify({ name: "@scope/named" }),
  });
  try {
    expect(buildOrder(root)).toEqual([
      root,
      join(root, "packages", "anonymous"),
      join(root, "packages", "named"),
    ]);
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
