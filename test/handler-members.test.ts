import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { declaredMembers, handlerMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

/**
 * WHICH MEMBERS ARE HANDLERS, WHICH IS A DIFFERENT QUESTION FROM WHICH
 * DIRECTORIES ARE MEMBERS.
 *
 * THE SPLIT EXISTS FOR THE CALLERS WHOSE QUESTION THE FRAMEWORK CANNOT ANSWER
 * ABOUT ITSELF -- that it declares a peer on tsudoi, that its README tells a
 * stranger it needs tsudoi at run time, that a consumer installs it BESIDE
 * tsudoi. Handed the framework, each of those goes green over a package the
 * question does not apply to.
 *
 * SO THE FALSIFIER IS THE WHOLE FILE and the green arms are its pair: an
 * enumerator that simply returned every member would satisfy the first two arms
 * here, and only the tree holding a framework-shaped member tells them apart.
 */

test("the framework is a member of this workspace and is not one of its handlers", () => {
  // THIS ARM READ `byte for byte equal to the member enumeration` UNTIL THE
  // FRAMEWORK MOVED UNDER packages/, which is what the split was written a
  // sprint ahead of. It is rewritten to the new reading rather than relaxed: the
  // whole value of the enumerator is that these two answers DIFFER here, and an
  // arm that had been widened to a subset relation would be green on a
  // `handlerMembers` that had quietly gone back to returning everything.
  const members = declaredMembers(repoRoot);
  const framework = join(repoRoot, "packages", "tsudoi-language-server");

  expect(members).toContain(framework);
  expect(handlerMembers(repoRoot)).toEqual(members.filter((member) => member !== framework));
});

// The pair, and without it every arm in every file that reads this enumerator is
// satisfied by an empty answer.
test("there are handlers here to make that claim about", () => {
  expect(handlerMembers(repoRoot).length).toBeGreaterThan(0);
});

/**
 * A workspace shaped like the one this repository is becoming: a framework
 * member that declares nothing of this workspace, and two members that declare
 * it.
 *
 * THE FRAMEWORK SORTS IN THE MIDDLE ON PURPOSE, so an implementation that
 * dropped the first or the last entry rather than the one that declares nothing
 * would still be reddened by the sequence below.
 */
function frameworkAmongHandlers(): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "@scope/workspace", workspaces: ["packages/*"] }),
    "packages/alpha/package.json": JSON.stringify({
      name: "@scope/alpha",
      peerDependencies: { "@scope/framework": "*" },
      peerDependenciesMeta: { "@scope/framework": { optional: true } },
    }),
    "packages/framework/package.json": JSON.stringify({
      name: "@scope/framework",
      dependencies: { "some-upstream-package": "^1.0.0" },
    }),
    "packages/zeta/package.json": JSON.stringify({
      name: "@scope/zeta",
      peerDependencies: { "@scope/framework": "*" },
      peerDependenciesMeta: { "@scope/framework": { optional: true } },
    }),
  };
}

test("the member that declares nothing of this workspace is left out, in order", () => {
  const root = workspace(frameworkAmongHandlers());
  try {
    expect(handlerMembers(root)).toEqual([
      join(root, "packages", "alpha"),
      join(root, "packages", "zeta"),
    ]);
    // THE CONTRAST READ RATHER THAN IMPLIED: the framework is a member, so the
    // arm above is a narrowing and not a walk that failed to find it.
    expect(declaredMembers(root)).toContain(join(root, "packages", "framework"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A DEPENDENCY ON SOMETHING OUTSIDE THIS WORKSPACE IS NOT WHAT MAKES A HANDLER,
 * which the tree above already carries on its framework and which is asserted
 * here so that reading is not an accident of that tree: `some-upstream-package`
 * is declared and installed, never built here, and constrains nothing.
 */
test("a member needing only outside packages is not a handler", () => {
  const root = workspace({
    "package.json": JSON.stringify({ name: "@scope/workspace", workspaces: ["packages/*"] }),
    "packages/solo/package.json": JSON.stringify({
      name: "@scope/solo",
      dependencies: { "some-upstream-package": "^1.0.0" },
    }),
  });
  try {
    expect(handlerMembers(root)).toEqual([]);
    expect(declaredMembers(root).length).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * THE ROOT IS A PACKAGE OF THIS WORKSPACE THOUGH IT IS NOT A MEMBER, and this is
 * the arm that makes the answer survive the framework's move: today the members
 * declare the ROOT, tomorrow they declare a SIBLING, and the enumerator must
 * return the same two either way.
 */
test("a member declaring the root is a handler as much as one declaring a sibling", () => {
  const root = workspace({
    "package.json": JSON.stringify({ name: "@scope/framework", workspaces: ["packages/*"] }),
    "packages/alpha/package.json": JSON.stringify({
      name: "@scope/alpha",
      peerDependencies: { "@scope/framework": "*" },
    }),
    "packages/lonely/package.json": JSON.stringify({ name: "@scope/lonely" }),
  });
  try {
    expect(handlerMembers(root)).toEqual([join(root, "packages", "alpha")]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
