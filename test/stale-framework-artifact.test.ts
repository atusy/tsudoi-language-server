import { expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handlerMembers } from "../scripts/workspaces.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";
// THE GUARD IS TAKEN FROM THERE BECAUSE A MUTATING END NEEDS IT, and the import
// costs this file the same thing it costs test/unbuilt-artifact.test.ts: `reRun`
// refuses any arm file whose TEXT mentions helpers/perturbation.ts, on the
// reasoning that such a file re-runs perturbations itself and would spawn
// without bound. That is false about this one -- it stages a package tree and
// re-runs nothing -- so a record naming an arm here is refused with a message
// about recursion that does not describe it.
import { type ThrowawayPath, throwawayOnly } from "./helpers/perturbation.ts";
import { type CliResult, frameworkRoot, repoRoot, runCommand } from "./helpers/spawn.ts";
import { mirrorInstalledDependencies } from "./helpers/typecheck.ts";

applySuiteDeadline();

/**
 * A FRAMEWORK ARTIFACT THAT ANSWERS WHILE STALE, STAGED -- because the state
 * exists nowhere this suite can otherwise stand in.
 *
 * WHAT IS BEING MEASURED, AT THE WIDTH IT WAS MEASURED AND NO WIDER: with the
 * handler type's RETURN NARROWED in the framework's src/ ALONE and its NAME
 * kept, a handler's own build reads one exit code against the framework artifact
 * BUILT BEFORE THAT EDIT and a different one against the artifact REBUILT AFTER
 * it. One perturbation shape in one direction. A widened return, a changed
 * parameter type, a renamed property inside an object type and a changed generic
 * constraint are UNMEASURED here, so what this holds is a narrowed return type
 * and not `a changed shape`.
 *
 * THE ASSERTION IS THAT THE TWO EXITS DISAGREE, and never that either is 0 or 2.
 * That spelling is what makes this redden the day they agree -- which is the day
 * the hazard stops existing, or the day this stage stops reaching the artifact it
 * thinks it does.
 *
 * AND A THIRD STATE PRINTS THE SAME WORDS AS THE FIRST, WHICH IS SAID HERE
 * BECAUSE THE READER'S NEXT MOVE DIFFERS AND NOTHING ELSE TELLS THEM WHICH:
 * THE PERTURBATION CEASING TO LAND ON WHAT THE CONSUMER WRITES. MEASURED, as
 * this arm's third degenerate -- a staged consumer annotated with a type the
 * narrowing does not reach reads exit 0 in BOTH cells, agreeing, and this
 * fails with text BYTE-IDENTICAL to `the hazard is over`. The two are
 * separable by hand and not by the message: the hazard being over means the
 * arm should go, while a perturbation that stopped landing means the arm
 * should be RE-AIMED. The mis-staged state above does not collide -- it
 * arrives as TS2307 in the cells' own output where these two arrive silent. IT IS ALSO WHAT MAKES A MIS-STAGED TREE LOUD RATHER THAN
 * GREEN: a handler answering `@atusy/tsudoi-language-server/types` from the REAL
 * checkout instead of from the copy below reads the same code in both cells, and
 * this fails. No resolution trace is taken here, deliberately -- the disagreement
 * is the discriminator, and a trace would claim a reading this sprint left
 * UNREAD.
 *
 * WHY NEITHER NEIGHBOURING ARM WOULD DO, so this is not read as a third spelling
 * of one of them. An arm asserting that the framework's src/ and dist/ AGREE is
 * green forever under `bun test`: the preload rebuilds every package before any
 * test module loads, so staleness cannot be observed from inside a run that just
 * eliminated it. An arm comparing two builds OF THE REAL TREE pays a second build
 * to re-derive what that preload already forces. This pays a STAGED build to
 * CREATE a disagreement that exists nowhere else.
 *
 * AND WHAT NO ARM CAN DELIVER, said plainly rather than left for a reviewer:
 * this cannot NAME THE STATE THE DAY IT ARISES on the pack route. `bun pm pack`
 * in a handler runs that member's own `prepack`, which freshens ITS OWN artifact
 * and never the framework's, and nothing in this suite runs before that pack. So
 * this pins that the state is PRODUCIBLE and what it looks like, and the
 * foreclosure that meets a maintainer is in each handler's own
 * test/package-shape.test.ts.
 *
 * WHAT IT DOES NOT SEPARATE. (1) `exit 0` says the build did not object, not
 * WHAT IT EMITTED: whether the declarations a green cell writes carry the stale
 * shape in a form a consumer trips on is UNREAD here, and so is any consumer-side
 * compile. (2) ONE HANDLER, DELIBERATELY: both handlers declare tsudoi the same
 * way and consume the same handler type, so a second cell would be one
 * observation taken twice rather than breadth.
 */

/**
 * THE CONSUMER THIS STAGES, NAMED AND THEN LOOKED FOR RATHER THAN SPELLED AS A
 * PATH: it is picked because src/resolve.ts annotates a const with
 * `MethodHandler<"completionItem/resolve">` and writes an async arrow into it,
 * which is the site a narrowed RETURN lands on -- what the consumer WRITES, and
 * not merely a type it mentions. A name that stops being a handler member of this
 * workspace fails here, naming itself, instead of staging a tree with no subject.
 */
const consumerName = "@atusy/tsudoi-completion-path";

function packageNameOf(dir: string): string {
  return (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { name: string }).name;
}

function consumerRoot(): string {
  const found = handlerMembers(repoRoot).find((dir) => packageNameOf(dir) === consumerName);
  if (found === undefined) {
    throw new Error(
      `${consumerName} is not a handler member of this workspace, so this probe has no consumer to build: ${handlerMembers(repoRoot).map(packageNameOf).join(", ")}`,
    );
  }
  return found;
}

/** The marker property the narrowing adds, and the string a reading looks for. */
const marker = "staleFrameworkProbe";
const currentReturn = `) => MethodMap[M]["result"];`;
const narrowedReturn = `) => MethodMap[M]["result"] & { readonly ${marker}: true };`;

interface Stage {
  /** The handler package's copy -- where its own build config is run. */
  readonly handler: string;
  /** The framework's copy, reachable from the handler ONLY by its declared name. */
  readonly framework: string;
  dispose(): void;
}

/**
 * A two-package tree where the framework is reachable from the handler exactly
 * as a stranger's install makes it: through node_modules, under its own declared
 * name, with no mapping and no project reference anywhere.
 *
 * COPIED AND NEVER SYMLINKED, WHICH IS THE ONE MISTAKE THAT WOULD MAKE THIS
 * MEASURE THE WRONG TREE: `nodenext` resolves realpaths, so a symlinked src/
 * resolves from the real member, walks up to THE CHECKOUT'S node_modules and
 * answers from the real framework in both cells -- the arm's subject silently
 * replaced by a package nothing here perturbs.
 *
 * THIRD-PARTY DEPENDENCIES ARE MIRRORED RATHER THAN BORROWED WHOLE, for the
 * reason that helper carries: the checkout's node_modules holds entries leading
 * back to the very packages staged here, and handing the directory over would
 * give the handler a second route to the framework it is supposed to reach only
 * one way. MIRRORED ONCE, AT THE STAGE ROOT, and both packages reach it by
 * WALKING UP -- not per package, which is what a reader would otherwise assume
 * from two copied trees.
 *
 * THE FRAMEWORK'S DESTINATION IS SPELLED AS A PATH RATHER THAN READ OFF ITS
 * MANIFEST, which is a place this file does not practise its own principle and
 * says so instead of hiding it. WHAT MAKES IT TOLERABLE IS THE ARM'S SHAPE: a
 * renamed package leaves the copy where nothing resolves it, both cells answer
 * TS2307, they AGREE, and the disagreement assertion reddens -- MEASURED as this
 * arm's second degenerate rather than predicted.
 */
function stage(): Stage {
  const root: ThrowawayPath = throwawayOnly(mkdtempSync(join(tmpdir(), "tsudoi-stale-")));
  mirrorInstalledDependencies(root);
  const handler = join(root, "handler");
  const framework = join(handler, "node_modules", "@atusy", "tsudoi-language-server");
  for (const [from, into] of [
    [consumerRoot(), handler],
    [frameworkRoot, framework],
  ] as const) {
    mkdirSync(into, { recursive: true });
    // The three files a build is made of, and nothing else: no dist/ is copied
    // from this checkout, because a probe that read one would report on whatever
    // the last compiler run left there.
    for (const file of ["package.json", "tsconfig.build.json"]) {
      cpSync(join(from, file), join(into, file));
    }
    cpSync(join(from, "src"), join(into, "src"), { recursive: true });
  }
  return {
    handler,
    framework,
    dispose: (): void => rmSync(throwawayOnly(root), { recursive: true, force: true }),
  };
}

/** One package's own build, run the way its `prepack` runs it. */
function build(dir: string): Promise<CliResult> {
  return runCommand("tsc -p tsconfig.build.json", dir);
}

/** Everything a build said, for a failure that diagnoses itself. */
function said(result: CliResult): string {
  return `exit ${String(result.code)}${result.stdout}${result.stderr}`.trim();
}

/**
 * The narrowing, applied to the STAGED framework's source alone.
 *
 * IT REFUSES RATHER THAN MISSES. A replacement that matched nothing would leave
 * the stage un-narrowed, both cells identical and the reading below asserting a
 * disagreement between two runs of the same thing -- so the count is checked and
 * the failure names the file it could not narrow.
 */
function narrowTheHandlerType(framework: string): void {
  const file = join(framework, "src", "types.ts");
  const source = readFileSync(file, "utf8");
  const occurrences = source.split(currentReturn).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `${file} carries ${String(occurrences)} spellings of the handler type's return, so this probe cannot narrow the one it is about`,
    );
  }
  writeFileSync(file, source.replace(currentReturn, narrowedReturn));
}

/** Whether the staged ARTIFACT -- not its source -- carries the narrowing. */
function artifactDeclaresTheNarrowing(framework: string): boolean {
  return readFileSync(join(framework, "dist", "types.d.ts"), "utf8").includes(marker);
}

test("a handler's build disagrees with itself across a stale and a rebuilt framework artifact", async () => {
  const staged = stage();
  try {
    // The stage's own state, asserted BESIDE every reading rather than assumed,
    // so a green cannot come from a stage that was never narrowed.
    const built = await build(staged.framework);
    expect(`framework, first build: ${said(built)}`).toBe("framework, first build: exit 0");

    narrowTheHandlerType(staged.framework);
    expect(
      `stale artifact carries the narrowing: ${String(artifactDeclaresTheNarrowing(staged.framework))}`,
    ).toBe("stale artifact carries the narrowing: false");
    const againstStale = await build(staged.handler);

    // THE REBUILD'S OWN EXIT IS PINNED AT WHAT IT WAS MEASURED TO BE AND NOT AT
    // WHAT IT OUGHT TO BE: tsc WRITES dist/ and THEN exits, so the load-bearing
    // reading is the ARTIFACT'S TEXT below and never this code. It is asserted
    // so a framework that stopped compiling under its own narrowing is reported
    // here instead of arriving as a puzzling handler diagnostic.
    const rebuilt = await build(staged.framework);
    expect(`framework, rebuilt: ${said(rebuilt)}`).toBe("framework, rebuilt: exit 0");
    expect(
      `rebuilt artifact carries the narrowing: ${String(artifactDeclaresTheNarrowing(staged.framework))}`,
    ).toBe("rebuilt artifact carries the narrowing: true");
    const againstCurrent = await build(staged.handler);

    // THE WHOLE READING RIDES THIS LINE, AND IT IS A DISAGREEMENT AND NOT A
    // PAIR OF CODES. MEASURED at base 279d7cd, bun 1.3.13 / tsc 7.0.2: against
    // the stale artifact the handler EXITS 0, and against the rebuilt one it
    // EXITS 2 with TS2322 naming its own handler function. The direction is
    // recorded here and asserted nowhere, because what must redden is the day
    // the two STOP differing -- pinning 0 and 2 would also redden on a diagnostic
    // renumbering that costs a maintainer nothing.
    expect(
      againstStale.code === againstCurrent.code
        ? `both handler builds agreed -- stale: ${said(againstStale)} -- current: ${said(againstCurrent)}`
        : "the handler's two builds disagree",
    ).toBe("the handler's two builds disagree");
  } finally {
    staged.dispose();
  }
});
