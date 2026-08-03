import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { type CliResult, repoRoot, runCommand } from "./helpers/spawn.ts";
import { workspace } from "./helpers/workspace.ts";

applySuiteDeadline();

/**
 * WHAT THE FIFTH CHECK OWES ABOUT THE ARTIFACT IT JUST BUILT, driven against
 * workspaces built here rather than against this one.
 *
 * WHY IT CANNOT BE ASSERTED AGAINST THIS REPOSITORY: the check builds every
 * package before it reads one, so on this tree the artifact is always there and
 * the refusal can never fire. An instrument whose witness cannot fail measures
 * nothing, so the witnesses are built -- a member with NO build config, whose
 * artifact is therefore exactly what the fixture wrote and whatever the check
 * does not create.
 *
 * THE REAL COMMAND IS SPAWNED AND ITS OUTPUT IS READ, never the function called
 * directly, and that is the whole of what makes the ordering assertion below
 * mean anything: the property is WHEN the reading is taken, and calling the
 * function proves only that it works when called.
 */

/** A member's own tsconfig: no `paths`, no `types`, so no install is needed. */
const memberTsconfig = JSON.stringify({
  compilerOptions: {
    target: "esnext",
    module: "esnext",
    moduleResolution: "bundler",
    noEmit: true,
    strict: true,
    types: [],
  },
  include: ["src"],
});

/** A source file that type-checks, so a member built from it cannot be the red. */
const typeChecks = "export const fine: number = 1;\n";

/** A source file that cannot type-check, and a `broken` a diagnostic can name. */
const typeError = 'export const broken: number = "not a number";\n';

/**
 * The map a package WITH SOURCE IN THE TREE publishes: the artifact first, the
 * source last, which is the shape tsudoi's own map has and the only shape under
 * which the compiler can fall through to a file the package does not ship.
 */
const artifactThenSource = {
  "./thing": {
    types: "./dist/thing.d.ts",
    import: "./dist/thing.js",
    default: "./src/thing.ts",
  },
};

/**
 * The map with NO SOURCE ARM, which is the shape BOTH handler packages in this
 * repository have -- deno refuses to type-strip under node_modules, so a handler
 * publishes dist/ and names no other route. Under it a missing artifact is not a
 * fall-through: there is nothing to fall through TO, and the subpath resolves to
 * no file at all.
 */
const artifactOnly = {
  "./thing": {
    types: "./dist/thing.d.ts",
    import: "./dist/thing.js",
  },
};

/**
 * A workspace whose one member PUBLISHES a subpath, in whichever state its
 * artifact is left in.
 *
 * THE MAP IS A PARAMETER BECAUSE THE MAP IS A STATE, and it is the axis every
 * arm here used to hold fixed: with one map in the fixture, `does this package
 * declare a source arm` was never varied, and the branch that reads a subpath
 * answering from NOTHING was reachable by no arm at all.
 *
 * NO tsconfig.build.json, DELIBERATELY: the check builds every package that has
 * one, so a member with a build config would have its artifact written by the
 * very command under test and every state below would collapse into `complete`.
 *
 * `.gitignore` NAMES dist FOR THE SAME REASON A REAL CHECKOUT DOES. The staging
 * helper commits what it writes, and a tracked artifact no program includes is
 * refused by a DIFFERENT guard -- which would make every arm here red for a
 * reason that is not the artifact.
 */
function publishingMember(
  artifact: Record<string, string>,
  source = typeChecks,
  exports: Record<string, Record<string, string>> = artifactThenSource,
): Record<string, string> {
  return {
    "package.json": JSON.stringify({ name: "root", workspaces: ["packages/*"] }),
    "tsconfig.json": JSON.stringify({ exclude: ["packages"] }),
    ".gitignore": "dist\n",
    "packages/producer/package.json": JSON.stringify({
      name: "@staged/producer",
      version: "0.0.0",
      files: ["dist"],
      exports,
    }),
    "packages/producer/tsconfig.json": memberTsconfig,
    "packages/producer/src/index.ts": source,
    "packages/producer/src/thing.ts": "export type Thing = string;\n",
    ...artifact,
  };
}

const declaration = "packages/producer/dist/thing.d.ts";
const module_ = "packages/producer/dist/thing.js";

/** The complete artifact: the declaration a consumer type-checks against, and the module. */
const complete = {
  [declaration]: "export type Thing = string;\n",
  [module_]: "export {};\n",
};

/** Runs the fifth Definition-of-Done check over a throwaway workspace. */
async function checkWorkspace(files: Record<string, string>): Promise<CliResult> {
  const root = workspace(files);
  try {
    return await runCommand("bun run scripts/typecheck-workspaces.ts", repoRoot, [root]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a published subpath answering from its own artifact is not refused", async () => {
  const result = await checkWorkspace(publishingMember(complete));

  // THE GREEN HALF, AND WITHOUT IT EVERY RED BELOW IS SATISFIED BY A CHECK THAT
  // REFUSES EVERY WORKSPACE: the same fixture, complete, passes.
  expect(`${String(result.code)} ${result.stdout}${result.stderr}`).toBe("0 ");
});

test("a published subpath with no artifact at all is refused, naming the file it promised", async () => {
  const result = await checkWorkspace(publishingMember({}));

  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain("@staged/producer/thing");
  expect(result.stderr).toContain(declaration);
});

/**
 * NO ANSWER IS NOT AN ANSWER FROM THE ARTIFACT, and until this arm nothing in
 * this suite said so. Every fixture above carries a source arm, so every
 * specifier the probe asked about resolved to SOMETHING -- and a detector
 * treating an unresolved subpath as satisfactory kept the whole suite green.
 * MEASURED: `landed !== undefined && (...)` in place of the offender predicate
 * reddens nothing without this pair.
 *
 * AND THE SHAPE IS NOT INVENTED FOR THE ARM: it is what both handler packages
 * here declare, so the state this reads is one this workspace can actually be
 * in.
 */
test("a published subpath with NO source arm and no artifact is refused, saying it answers from nothing", async () => {
  const result = await checkWorkspace(publishingMember({}, typeChecks, artifactOnly));

  expect(result.code).not.toBe(0);
  // THE WORDING IS PART OF THE READING AND NOT DECORATION: `answers from NOTHING`
  // is what separates a subpath that resolved to the wrong file from one that
  // resolved to none, and a reader's next move differs between them.
  expect(result.stderr).toContain("@staged/producer/thing answers from NOTHING");
  // THE PAIR: the same map with the artifact present passes, so the red above is
  // the missing artifact and not the missing source arm.
  expect(await checkWorkspace(publishingMember(complete, typeChecks, artifactOnly))).toHaveProperty(
    "code",
    0,
  );
});

/**
 * THE STATE A BARE TYPE CHECK CANNOT SEE, which is the reason this refusal
 * exists rather than a second reading of an exit code: the module is written and
 * its declaration is not, so the compiler falls through to source and answers at
 * exit 0 with nothing printed.
 */
test("a published subpath whose module is written and whose declaration is not is refused, naming the declaration", async () => {
  const result = await checkWorkspace(publishingMember({ [module_]: "export {};\n" }));

  expect(result.code).not.toBe(0);
  expect(result.stderr).toContain(declaration);
  // The discrimination, asserted rather than arranged: the file that IS there is
  // not what it complains about.
  expect(result.stderr).not.toContain(module_);
});

/**
 * THE PROPERTY IS WHEN, AND THIS IS THE ARM THAT READS IT. A refusal moved below
 * the member loop changes no value and still prints -- and by then every member
 * has been graded against a file no consumer receives. So the reading is what
 * the command did NOT print: the member's own diagnostic never appears, because
 * the member was never checked.
 */
test("the refusal arrives before any member is type-checked against the artifact", async () => {
  const result = await checkWorkspace(publishingMember({}, typeError));
  const output = `${result.stdout}${result.stderr}`;

  expect(result.code).not.toBe(0);
  expect(output).toContain(declaration);
  // The pair: this member really would have been reported, so the absence below
  // is the ordering and not a member that had nothing to say.
  expect(await checkWorkspace(publishingMember(complete, typeError))).toHaveProperty("code", 1);
  expect(output).not.toContain("broken");
  expect(output).not.toContain("TS2322");
});
