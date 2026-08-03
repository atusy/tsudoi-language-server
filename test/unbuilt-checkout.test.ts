import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { buildOrder, declaredMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
// THE GUARD COMES FROM THERE BECAUSE THIS FILE STAGES AND DELETES, and the
// import costs the same thing it costs test/unbuilt-artifact.test.ts: `reRun`
// refuses any arm file whose TEXT mentions helpers/perturbation.ts, so a
// perturbation record naming an arm here would be refused with a message about
// recursion that does not describe it. Nothing here re-runs a perturbation.
import { type ThrowawayPath, throwawayOnly } from "./helpers/perturbation.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { runTsc } from "./helpers/typecheck.ts";

applySuiteDeadline();

/**
 * A CHECKOUT NOBODY HAS BUILT, STAGED AND READ -- AND IT IS DECLARED NOT TO MEET
 * THE CRITERION IT COMES FROM, WHICH IS WHY IT MAY SHIP AT ALL.
 *
 * The criterion asks that a bare `tsc --noEmit` on an unbuilt checkout not
 * answer THE FRAMEWORK'S own published subpaths from source at exit 0, or that
 * the fact it does be carried by something that stops holding the day it stops
 * being true. THIS ARM SATISFIES NEITHER DISJUNCT, and the disclaimers below say
 * so one by one. What it mechanises is one sentence that would otherwise be
 * prose: that this repository's fresh-checkout loudness is bought by two import
 * lines in examples/, and a fact still needed is mechanised if something can
 * redden. It is offered as that and as nothing else.
 *
 * WHAT IT ASSERTS, AND THE SECOND HALF IS WHY THE FIRST IS NOT ENOUGH: the
 * unbuilt stage is NON-ZERO, and at least one TS2307 in it names a specifier
 * READ FROM THE STAGE'S OWN MANIFESTS. No package is named here, and no claim is
 * made about WHICH one failed -- the property is `some workspace package did not
 * resolve`, which is why the enumeration is `declaredMembers` rather than the
 * handler split: the framework is a member like any other and the day it is the
 * one that fails, this arm is still reading its own subject.
 *
 * NON-ZERO ALONE WOULD MEASURE THE APPARATUS, MEASURED RATHER THAN FEARED. A
 * stage carrying the tracked files and NO node_modules at all is exit 1 with SIX
 * LINES -- TS2688 for the type libraries `bun` and `node` -- and ZERO TS2307
 * naming any workspace package. That is a red whose subject is the staging, and
 * an arm that accepted it would go on passing after the thing it watches was
 * gone.
 *
 * AND THE BORROW ROUTE DECIDES EVERYTHING, WHICH IS WHY THIS FILE STAGES ITS OWN
 * TREE INSTEAD OF CALLING `stageCheckout`. That helper borrows node_modules BY
 * ONE SYMLINK, so the stage's `@atusy` entries realpath into the REAL checkout
 * and an unbuilt stage reads the REAL, BUILT artifacts: MEASURED at this base
 * with the helper itself, EXIT 0 AND ZERO BYTES OF OUTPUT over a stage whose own
 * packages hold no dist/ at all. An arm built on it measures nothing and passes.
 * Borrowed per entry, with `@atusy` a real directory pointing into the stage's
 * OWN packages/, the same tree reads TS2307. THAT DIFFERENCE IS ASSERTED IN THE
 * ARM rather than trusted: every `@atusy` entry is required to realpath INSIDE
 * the stage, and every declared output directory to be absent, beside the
 * reading they explain.
 *
 * READ IN BOTH DIRECTIONS -- AND THE RECORDED ORDER IS TRUE OF ONE SPELLING OF
 * THE DEGENERATION AND NOT OF THE MINIMAL ONE, WHICH IS WHY THE EARLIER THROW IS
 * NAMED HERE RATHER THAN LEFT FOR WHOEVER FIRST MEETS IT. As it stands, this file
 * alone is 1 pass / 0 fail. With the `@atusy` entries made to resolve out of the
 * stage while the scope directory inside it stays a real directory, it is 0 pass
 * / 1 fail and THE FIRST LINE TO FAIL IS THE STAGE-FAITHFULNESS GUARD, naming all
 * three entries, before the exit code is ever read. SPELT MINIMALLY INSTEAD --
 * node_modules replaced by ONE SYMLINK and the member-link loop left alone --
 * NOTHING IN THE ARM RUNS AT ALL: MEASURED at sprint 61's review,
 * `stageUnbuiltCheckout` throws at the scope-directory guard naming
 * `<checkout>/node_modules/@atusy` as outside the stage, and the arm reports 0
 * expect() calls. THE TWO ORDERS AGREE ON THE HALF THAT MATTERS: in a degenerate
 * stage the compiler reads exit 0 with zero bytes of output, so anything reaching
 * that exit code first would report a green apparatus failure, and neither route
 * gets there.
 *
 * AND THE WALL CLOCK WAS RE-TAKEN UNDER A FULL RUN rather than by hand, because
 * this project has a measured instance of a 0.046 s hand reading becoming 80
 * TimeoutErrors under the suite's concurrency: 0.6 s for this file alone, and a
 * whole-suite total unmoved from the same run without it -- 121.26 s against
 * 121.30 s, 0 fail either way.
 */

/**
 * WHAT THIS ARM DOES NOT WATCH, four disclaimers, because sprint 9's rule
 * deletes a control that cannot say what it is blind to -- and every one of
 * these is a thing a reader would otherwise assume from a green.
 *
 * (1) IT DOES NOT WATCH THE FRAMEWORK'S SILENCE. The red it asserts is bought by
 * two import lines in examples/tsudoi.config.ts, which name the two HANDLER
 * packages; inside the very run this arm calls red, the framework's own subpaths
 * answer from packages/tsudoi-language-server/src/*.ts and raise nothing. That
 * is the residue, and it is untouched here.
 *
 * (2) IT STAGES THE ALL-ABSENT CELL AND NEVER THE SILENT ONE. MEASURED at this
 * base: with the framework's dist/ ALONE absent and both handlers built, the
 * same root check is EXIT 0 and silent. This arm never enters that state, so a
 * green here says nothing about it.
 *
 * (3) IT SAYS NOTHING ABOUT THE REAL FOURTH CHECK. That command is `tsc
 * --noEmit` at the checkout root; what runs here is a staged copy, and a staged
 * copy is a claim about a stage. AND `NOTHING OWNS ITS INVOCATION` IS TOO WIDE,
 * QUALIFIED RATHER THAN DROPPED: scripts/definition-of-done.ts spawns exactly
 * that command from the dashboard's own list -- but only AFTER the first check
 * has built every artifact, which is the ordering that runner's own one-step
 * reading leans on. What nothing here owns is the BARE, PRE-BUILD invocation,
 * and that is the one this arm's subject is about.
 *
 * (4) IT IS NOT THE PIN THE CRITERION REFUSES, AND THE DIRECTION IS NAMED. The
 * refused arm is one asserting that the framework IS SILENT on an unbuilt stage:
 * it would pin the residue, pass for exactly as long as the residue persists,
 * and make fixing it a test-breaking change. This one survives that fix and
 * therefore specifies nothing about it -- with the framework's source arms
 * deleted the stage is still non-zero and merely names framework specifiers too.
 * THAT LAST CLAUSE SHIPPED AS AN UNLABELLED PREDICTION AND IS NOW MEASURED, and
 * the reading is the SPRINT 61 REVIEW'S rather than this file's: on increment
 * 11e249a, with the four source arms deleted and every dist/ MOVED ASIDE, the
 * root check is exit 1 naming `@atusy/tsudoi-language-server/types` four times,
 * `/deps/types` and `/deps/textdocument`, with both handler packages beside them.
 * Non-zero still, and now naming the framework too, which is exactly what
 * `survives the fix` has to mean. NOTHING HERE RE-TOOK IT: the reading costs
 * deleting four arms and moving every artifact, and its provenance is named so
 * it is not read as this arm's own.
 */

/** The stage, with the two facts the reading rests on read off it rather than assumed. */
interface UnbuiltCheckout {
  readonly root: ThrowawayPath;
  /**
   * The same stage, RESOLVED, which is the only spelling a containment test may
   * use: on macOS the temporary directory is itself behind a symlink, so the
   * path `mkdtemp` hands back and the path `realpath` reports differ by a prefix
   * and by nothing that matters -- and a prefix test between the two spellings
   * reports every entry as escaping.
   */
  readonly realRoot: string;
  /** Each `@atusy` entry, as the path it actually resolves to. */
  readonly entries: readonly { readonly name: string; readonly resolved: string }[];
  /** Each member's declared output directory, read from its own build config. */
  readonly outputs: readonly { readonly member: string; readonly path: string }[];
  dispose(): void;
}

/**
 * The path a write is about to touch, refused unless it is inside the throwaway
 * this function made -- the same shape test/helpers/perturbation.ts uses at
 * every mutating end, re-asked here because a `ThrowawayPath` can be cast and
 * this repository lost a working tree to a value that was merely the right type.
 *
 * LEXICAL, because every destination below is a path that does not exist yet.
 */
function inStage(stage: ThrowawayPath, target: string): string {
  const root = realpathSync(throwawayOnly(stage));
  const path = resolve(root, target);
  if (path !== root && !path.startsWith(root + sep)) {
    throw new Error(`${path} is outside the throwaway ${root}, so nothing here will write to it`);
  }
  return path;
}

/** The name a member declares, which is the only name this file ever matches on. */
function nameOf(dir: string): string {
  return (
    (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name?: string }).name ?? ""
  );
}

/**
 * A checkout of every TRACKED file with NOTHING BUILT, reachable by package name
 * through its own packages/ and by no other route.
 *
 * THE `@atusy` SCOPE IS A REAL DIRECTORY AND EVERY OTHER ENTRY IS A LINK, which
 * is the whole of the recipe: the installed strangers are borrowed because they
 * are neither tracked nor cheap and nothing here is about them, while the
 * entries under this workspace's own scope must point at THE STAGE'S packages or
 * the reading is taken on the real checkout's artifacts.
 *
 * NO `paths` MAPPING AND NO PROJECT REFERENCE. There is none anywhere in this
 * repository, a refusal enforces it for members, and a diagnostic manufactured
 * by either would grade a resolution no stranger performs.
 *
 * WHAT THIS CANNOT RUN INSIDE, NAMED RATHER THAN LEFT TO BE DISCOVERED AT THE
 * WRONG MOMENT: A TREE WITH NO INDEX. It stages from `git ls-files`, so run
 * inside one of this suite's OWN stages -- which carry the tracked files and no
 * .git -- it throws about the index rather than reading anything. The state is
 * reachable only by a perturbation record naming an arm here as its arm, which
 * no record does; the throw above says what the failure means for this arm so
 * that whoever first meets it is not sent looking at the compiler. Staging from
 * a directory walk instead was declined: the index is what makes `every TRACKED
 * file and nothing built` a definition rather than a filter that has to know
 * about every output directory and every ignore rule.
 */
function stageUnbuiltCheckout(): UnbuiltCheckout {
  const root = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-unbuilt-checkout-")));
  const listed = spawnSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" });
  if (listed.status !== 0) {
    throw new Error(
      `git ls-files failed in ${repoRoot}, so nothing here could say what a checkout contains -- this arm stages FROM THE INDEX, and a tree with no .git cannot answer it.`,
    );
  }
  for (const tracked of listed.stdout.split("\0").filter((entry) => entry !== "")) {
    const destination = inStage(root, tracked);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(repoRoot, tracked), destination);
  }

  // THE SCOPES ARE READ OFF THE MEMBERS THEMSELVES AND NOT OFF THE ROOT'S NAME,
  // WHICH IS THE DIFFERENCE BETWEEN A GUARD AND A COINCIDENCE. `dirname` of the
  // root's name answers `@atusy` here and `.` for an unscoped root -- and with
  // `.` nothing matches, the workspace's own scope directory is BORROWED BY
  // SYMLINK like any stranger, and the member link below then lands through it
  // INSIDE THE REAL CHECKOUT'S node_modules, which is lexically inside the stage
  // and physically not. An unscoped member is refused outright for the same
  // reason: there would be no directory to own.
  //
  // MEASURED RATHER THAN ARGUED, in a copy: with this set left EMPTY -- which is
  // exactly what `dirname` of an unscoped root name produces -- nothing keeps the
  // borrow out of this workspace's own scope, the member links would land inside
  // the REAL checkout's node_modules, and the arm reads 0 pass / 1 fail with
  // nothing written anywhere. As it stands the same file is 1 pass / 0 fail. THAT
  // REFUSAL IS NOW THE THROW BELOW AND NO LONGER THE PARENT RESOLUTION IN THE
  // LINKING LOOP, which is a correction and not a move: the two refused with the
  // SAME BYTES, and two states printing one message are one state a reader cannot
  // act on.
  const memberDirs = declaredMembers(root);
  const scopes = new Set<string>();
  for (const member of memberDirs) {
    const name = nameOf(member);
    if (!name.startsWith("@") || !name.includes("/")) {
      throw new Error(
        `${member} declares \`${name}\`, which carries no scope -- this stage tells its own packages from installed strangers by the scope directory, and with none there is nothing to keep the borrow out of.`,
      );
    }
    scopes.add(dirname(name));
  }
  // THE EMPTY SET SAYS WHAT IS TRUE OF ITSELF, and it is reachable only with the
  // derivation above perturbed -- the loop refuses an unscoped member outright,
  // so an empty set means THE SCOPES CAME OUT WRONG rather than that a member did.
  // It used to arrive fifteen lines down wearing the borrow degeneration's own
  // message, which sent a reader to the wrong half of this function.
  if (scopes.size === 0) {
    throw new Error(
      `no member of ${root} contributed a scope directory, so nothing would keep the borrow below out of this workspace's own scope and every member link would land in the real checkout's node_modules.`,
    );
  }
  const nodeModules = inStage(root, "node_modules");
  mkdirSync(nodeModules, { recursive: true });
  for (const entry of readdirSync(join(repoRoot, "node_modules"))) {
    if (scopes.has(entry)) {
      continue;
    }
    symlinkSync(join(repoRoot, "node_modules", entry), join(nodeModules, entry));
  }
  for (const scope of scopes) {
    mkdirSync(inStage(root, join("node_modules", scope)), { recursive: true });
  }

  const realRoot = realpathSync(root);
  const entries: { name: string; resolved: string }[] = [];
  const outputs: { member: string; path: string }[] = [];
  for (const member of memberDirs) {
    const name = nameOf(member);
    const entry = inStage(root, join("node_modules", name));
    // THE PARENT IS RESOLVED AND NOT ONLY JOINED, which is the one place this
    // file needs more than the lexical guard: a scope directory that were a
    // symlink would make this write land in the real checkout while passing
    // every prefix test. `inStage` cannot ask that -- its targets do not exist
    // yet -- and here the parent does.
    const scopeDir = realpathSync(dirname(entry));
    if (scopeDir !== realRoot && !scopeDir.startsWith(realRoot + sep)) {
      throw new Error(
        `${scopeDir} is outside the stage ${realRoot}, so nothing here will link a package into it -- the borrow above degenerated to a link, and this stage's node_modules or its scope directory is the real checkout's rather than a directory of its own.`,
      );
    }
    symlinkSync(member, entry);
    entries.push({ name, resolved: realpathSync(entry) });
    // THE OUTPUT DIRECTORY IS READ FROM THE MEMBER'S OWN BUILD CONFIG and never
    // spelled here: `dist` is this workspace's habit and not its promise, and a
    // member that renamed it would leave a literal asserting the absence of a
    // directory nothing was ever going to write.
    const config = join(member, "tsconfig.build.json");
    if (!existsSync(config)) {
      continue;
    }
    const outDir = (
      JSON.parse(readFileSync(config, "utf8")) as { compilerOptions?: { outDir?: string } }
    ).compilerOptions?.outDir;
    if (typeof outDir === "string") {
      outputs.push({ member, path: join(member, outDir) });
    }
  }

  return {
    root,
    realRoot: realpathSync(root),
    entries,
    outputs,
    dispose: (): void => rmSync(throwawayOnly(root), { recursive: true, force: true }),
  };
}

/** Builds the stage the way this repository builds itself, with its output kept. */
function buildStage(stage: UnbuiltCheckout): void {
  for (const dir of buildOrder(stage.root)) {
    const config = join(dir, "tsconfig.build.json");
    if (!existsSync(config)) {
      continue;
    }
    // CAPTURED AND NOT INHERITED: a build that failed here must arrive as this
    // assertion rather than as chatter in the suite's output that a reader then
    // has to tell apart from the reading below.
    const run = spawnSync("tsc", ["-p", config], { cwd: stage.root, encoding: "utf8" });
    expect(`${dir}: exit ${String(run.status)}\n${run.stdout ?? ""}${run.stderr ?? ""}`).toBe(
      `${dir}: exit 0\n`,
    );
  }
}

/**
 * The specifiers the compiler could not resolve THAT THIS WORKSPACE DECLARES,
 * matched against names read from the stage's own manifests.
 *
 * A SUBPATH COUNTS FOR ITS PACKAGE, which is what keeps the property free of any
 * claim about which member fails: a handler fails on its bare name and the
 * framework would fail on `<name>/types`, and both are `a workspace package did
 * not resolve`.
 */
function unresolvedWorkspaceSpecifiers(output: string, names: readonly string[]): string[] {
  const specifiers = [...output.matchAll(/error TS2307: Cannot find module '(.+?)'/g)].map(
    ([, specifier]) => specifier ?? "",
  );
  return [
    ...new Set(
      specifiers.filter((specifier) =>
        names.some((name) => specifier === name || specifier.startsWith(`${name}/`)),
      ),
    ),
  ];
}

test("an unbuilt checkout's root type check is non-zero and names a workspace package it could not resolve", async () => {
  const stage = stageUnbuiltCheckout();
  try {
    // THE STAGE'S OWN STATE, ASSERTED BESIDE THE READING AND NOT ASSUMED. These
    // two lines are what separate this arm from the degenerate: with the entries
    // resolving outside the stage, the reading below is taken on the real
    // checkout's artifacts and is exit 0 with nothing printed.
    const outside = stage.entries.filter(({ resolved }) => !resolved.startsWith(stage.realRoot));
    expect(
      `entries resolving outside the stage: ${outside.map(({ name }) => name).join(", ")}`,
    ).toBe("entries resolving outside the stage: ");
    const present = stage.outputs.filter(({ path }) => existsSync(path));
    expect(`declared outputs present: ${present.map(({ path }) => path).join(", ")}`).toBe(
      "declared outputs present: ",
    );
    expect(stage.entries.length).toBeGreaterThan(0);
    expect(stage.outputs.length).toBeGreaterThan(0);

    const names = declaredMembers(stage.root).map(nameOf);
    const unbuilt = await runTsc(stage.root);
    const named = unresolvedWorkspaceSpecifiers(unbuilt.output, names);
    // BOTH HALVES CARRY THE COMPILER'S OWN OUTPUT, so a failure prints what was
    // read rather than a boolean: a red for the wrong reason -- the TS2688 flood
    // a stage without node_modules produces -- is diagnosable from the message.
    expect(`non-zero: ${String(unbuilt.code !== 0)}\n${unbuilt.output}`).toBe(
      `non-zero: true\n${unbuilt.output}`,
    );
    expect(`unresolved workspace specifiers: ${named.length > 0}\n${unbuilt.output}`).toBe(
      `unresolved workspace specifiers: true\n${unbuilt.output}`,
    );

    // THE PAIR, AND `IT CAN ONLY REDDEN FOR A BROKEN STAGING` IS WHAT STOOD HERE
    // AND IS MEASURED FALSE. Appending `const deliberateTypeError: number = "not
    // a number";` to examples/tsudoi.config.ts -- tracked, in the root program,
    // outside packages/ -- leaves the unbuilt half and `buildStage` passing and
    // reddens THIS line with `examples/tsudoi.config.ts(...): error TS2322`, the
    // staging entirely intact. So the honest name for this is DUPLICATED SIGNAL
    // WITH A MISLEADING FAILURE STORY, and not a state nothing else sees: ANY
    // tracked type error reddens both the fourth Definition-of-Done check and
    // this line, and this line reports it under a test name about unresolved
    // workspace packages. Measured on the other half too, by the sprint 61
    // review: `tsc --noEmit --listFiles` over the tree and over the stage read
    // IDENTICAL file sets, 160 against 160, so there is no state here that the
    // fourth check misses.
    //
    // IT IS KEPT FOR THE ORDER AND THE STORY, WHICH IS THE WHOLE OF WHAT IT BUYS
    // and is worth more than it sounds. Alone, the red above says `non-zero` and
    // nothing says WHY it was non-zero -- a stage missing a type library, a route
    // out of the stage, or an artifact left over from before the build is
    // non-zero too. A green here attributes that red to THE ABSENT ARTIFACTS
    // rather than to the apparatus, in the same run and on the same tree.
    //
    // SO A READER WHO MEETS THIS LINE RED SHOULD READ THE DIAGNOSTIC BEFORE
    // TOUCHING THE STAGER: if it names a tracked file, the fourth check is
    // already saying the same thing and the staging is not the fault.
    buildStage(stage);
    const built = await runTsc(stage.root);
    expect(`exit ${String(built.code)}\n${built.output}`).toBe("exit 0\n");
  } finally {
    stage.dispose();
  }
});
