import { expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildOrder, declaredMembers, prepareWorkspace } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

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

test("the derived order is the order this repository must be built in", () => {
  // BYTE FOR BYTE, AND THIS SEQUENCE IS THE DERIVATION EARNING ITS KEEP. Until
  // the framework moved under packages/ it read `[repoRoot,
  // ...declaredMembers(repoRoot)]` -- the order the builder used to construct by
  // hand -- and the move REDDENED THAT ARM BY CONSTRUCTION, which is why it was
  // rewritten to the new derived sequence rather than generalised to a set,
  // retargeted at a tree where the two orders agree, or deleted.
  //
  // WHAT DECIDES IT IS TWO DECLARATIONS AND NOTHING ABOUT THE LAYOUT: both
  // handlers name the framework in a peer they call optional, and the ROOT names
  // it in `devDependencies`, which is deliberately NOT a build edge. Move that
  // one declaration up a field and the framework is ordered BEFORE the root and
  // this line reddens -- so this arm is also where the field ruling is checked,
  // and no separate test asserts it.
  expect(buildOrder(repoRoot)).toEqual([
    repoRoot,
    join(repoRoot, "packages", "tsudoi-language-server"),
    join(repoRoot, "packages", "tsudoi-completion-path"),
    join(repoRoot, "packages", "tsudoi-hover-wordnet"),
  ]);
  // AND THE ALPHABET NOW GETS THIS REPOSITORY WRONG, asserted here because it
  // stopped being true of the throwaway trees alone. The arms below were built
  // to forbid `sort()` on trees this repository could not supply; it supplies
  // one now.
  expect([...buildOrder(repoRoot)].sort()).not.toEqual(buildOrder(repoRoot));
});

test("every package the workspace declares is ordered exactly once", () => {
  const order = buildOrder(repoRoot);

  // THE NODE SET IS READ AGAINST THE WORKSPACE ITSELF, so an order that
  // returned nothing -- or that quietly dropped whatever it could not place --
  // cannot satisfy the sequence assertion by being short.
  //
  // BUILT A SECOND TIME FROM THE SAME ENUMERATOR, DELIBERATELY, and the choice
  // is worth stating because it looks like a tautology and is not one: what is
  // asserted here is the SEQUENCE, and `declaredMembers` is the repository's
  // one answer to WHO THE MEMBERS ARE. A hand-written list would assert
  // membership as well -- a second answer to a question already owned
  // elsewhere, going stale at the next package, and reddening this file for a
  // reason that has nothing to do with an order.
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
 * TWO PACKAGES THAT EACH NEED THE OTHER, with the second's declaration supplied
 * separately so the pair differs by that declaration and by nothing else.
 */
function needingEachOther(rightNeeds: Record<string, unknown>): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "@scope/root", workspaces: ["packages/*"] }),
    "packages/left/package.json": JSON.stringify({
      name: "@scope/left",
      dependencies: { "@scope/right": "*" },
    }),
    "packages/right/package.json": JSON.stringify({ name: "@scope/right", ...rightNeeds }),
  };
}

/**
 * A CYCLE IS REFUSED RATHER THAN BROKEN ARBITRARILY. The alternative is picking
 * one of the two and letting the other compile against an artifact that is
 * absent or stale -- which exits 0 through the source fall-through and is the
 * exact class the derivation exists to end.
 *
 * THE MESSAGE MUST NAME THE DECLARATIONS AND NOT ONLY THE PACKAGES, because
 * `these two form a cycle` leaves a reader opening both manifests to find out
 * which line to delete, and on a graph larger than this one, which two of the
 * many they hold.
 */
test("two packages that need each other are refused, by name and by declaration", () => {
  const root = workspace(needingEachOther({ dependencies: { "@scope/left": "*" } }));
  try {
    expect(() => buildOrder(root)).toThrow(/@scope\/left/);
    expect(() => buildOrder(root)).toThrow(/@scope\/right/);
    // The two manifests holding the lines to delete, and the field they sit in.
    expect(() => buildOrder(root)).toThrow(/packages\/left\/package\.json/);
    expect(() => buildOrder(root)).toThrow(/packages\/right\/package\.json/);
    expect(() => buildOrder(root)).toThrow(/dependencies/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// THE PAIR, and without it the refusal above is satisfied by a function that
// refuses every workspace it is handed. The same two packages, one declaration
// lighter, order fine -- and against the ALPHABET, so this green is not the
// trivial one either.
test("the same two packages build once one of the two declarations is gone", () => {
  const root = workspace(needingEachOther({}));
  try {
    expect(buildOrder(root)).toEqual([
      root,
      join(root, "packages", "right"),
      join(root, "packages", "left"),
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

/**
 * WHICH FILE THE CONSUMER COMPILED AGAINST, TAKEN AS A VALUE OUT OF ITS OWN
 * EMITTED DECLARATION.
 *
 * AN EXIT CODE CANNOT ANSWER THIS AND THAT IS MEASURED RATHER THAN FEARED: a
 * consumer whose producer has not been built resolves through the producer's
 * `default` arm, reads its SOURCE, and EXITS 0. Both orders build, both leave a
 * dist/ behind, and nothing about either run says which file was read.
 *
 * SO THE PRODUCER DECLARES A DIFFERENT LITERAL TYPE IN EACH: its published
 * artifact is compiled from a directory that says `dist`, its source arm says
 * `src`, and the consumer re-exports whichever it found. The compiler then
 * writes the answer into the consumer's own .d.ts, where it is read as a value.
 *
 * THE READING IS TAKEN DURING THE ORDERING RATHER THAN AFTER IT, which is what
 * makes it about the order at all: the consumer's build is itself a step in the
 * loop, so what it saw is decided by what had been built when its turn came.
 */
function consumerReadingItsProducer(
  consumerNeeds: Record<string, unknown>,
): Record<string, string> {
  const emitting = (from: string, declarationsOnly: boolean): string =>
    JSON.stringify({
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "bundler",
        declaration: true,
        emitDeclarationOnly: declarationsOnly,
        outDir: "dist",
        rootDir: from,
        strict: true,
        skipLibCheck: true,
        types: [],
      },
      include: [from],
    });
  return {
    "package.json": JSON.stringify({ name: "@scope/root", workspaces: ["packages/*"] }),
    "packages/producer/package.json": JSON.stringify({
      name: "@scope/producer",
      type: "module",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
          default: "./src/index.ts",
        },
      },
    }),
    // THE TWO FILES THE ARMS DISCRIMINATE ON. `built/` is what the producer's
    // build config compiles, so the artifact and the source arm can disagree --
    // which is the only way a reader downstream can say which of them answered.
    "packages/producer/built/index.ts": 'export const MARK: "dist" = "dist";\n',
    "packages/producer/src/index.ts": 'export const MARK: "src" = "src";\n',
    "packages/producer/tsconfig.build.json": emitting("built", false),
    "packages/consumer/package.json": JSON.stringify({
      name: "@scope/consumer",
      type: "module",
      ...consumerNeeds,
    }),
    "packages/consumer/src/index.ts":
      'import { MARK } from "@scope/producer";\nexport const SAW = MARK;\n',
    "packages/consumer/tsconfig.build.json": emitting("src", true),
  };
}

/**
 * Builds the tree through the REAL entry point, with the consumer able to
 * resolve the producer before either arm runs.
 *
 * THE ROUTE IS IDENTICAL IN BOTH ARMS AND THAT IS WHAT MAKES THE PAIR EXACT: the
 * node_modules entry is written here rather than by anything under test, so the
 * only difference between the two runs is the DECLARATION -- and therefore the
 * order, and therefore which file existed when the consumer was compiled.
 */
function whatTheConsumerSaw(files: Record<string, string>): string {
  const root = workspace(files);
  try {
    const link = join(root, "packages", "consumer", "node_modules", "@scope", "producer");
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(join(root, "packages", "producer"), link, "dir");

    prepareWorkspace(root);

    return readFileSync(join(root, "packages", "consumer", "dist", "index.d.ts"), "utf8");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * The allowance these two arms need: each spawns the compiler once per package,
 * where the suite's own deadline gives the whole test 25_000ms -- a bound that
 * is about the machine rather than about the order. A control that reports the
 * machine is worse than a slow one, since its pair then reads as `the consumer
 * compiled against the wrong file`, which is the one conclusion these arms exist
 * to make available.
 *
 * IT SAID 5000ms UNTIL THE SUITE CHOSE ITS OWN NUMBER, and the allowance stays
 * because the argument for it never depended on which ambient default was in
 * force: what it answers is that a compiler spawn's duration is a property of
 * the hardware, and five times more headroom does not make it one of the build
 * order.
 */
const eachArmSpawnsACompilerPerPackage = 120_000;

test(
  "the consumer compiles against its producer's built artifact",
  () => {
    const emitted = whatTheConsumerSaw(
      consumerReadingItsProducer({ dependencies: { "@scope/producer": "*" } }),
    );

    expect(emitted).toContain('"dist"');
  },
  eachArmSpawnsACompilerPerPackage,
);

// THE CONTROL, AND IT IS THE SAME TREE MINUS THE DECLARATION. It EXITS 0 like
// the arm above -- the builder raises nothing, the consumer emits a declaration,
// the workspace ends up fully built -- and it read the producer's SOURCE, which
// is the whole reason this file reads a value instead of a colour.
test(
  "the same consumer reads source when nothing declares the producer first",
  () => {
    const emitted = whatTheConsumerSaw(consumerReadingItsProducer({}));

    expect(emitted).toContain('"src"');
  },
  eachArmSpawnsACompilerPerPackage,
);
