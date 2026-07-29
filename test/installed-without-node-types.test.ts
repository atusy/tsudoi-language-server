import { afterAll, beforeAll, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type InstalledConsumer, installConsumer } from "./helpers/install.ts";
import { importsAndUses, publicProtocolNames } from "./helpers/published-names.ts";

/**
 * THE ONE THING THAT DEFENDS src/types.ts's BARE SPECIFIER. Before this file,
 * that choice was held by a paragraph which honestly said nothing held it.
 *
 * THE PROPERTY: a config author who has never installed @types/node can
 * type-check against `@atusy/tsudoi/types`. src/types.ts re-exports the eight
 * protocol names from the BARE `vscode-languageserver-protocol` rather than from
 * `/node`, and `/node` drags Node stream typings into a consumer that has none.
 *
 * THE MEASURED TABLE, and it is the whole design -- ONLY THE PAIR
 * DISCRIMINATES. Rows are the consumer's own tsconfig, columns are the
 * specifier src/types.ts re-exports from:
 *
 *   skipLibCheck | types    | bare   | /node
 *   -------------+----------+--------+-------
 *   false        | []       | exit 0 | EXIT 1
 *   true         | []       | exit 0 | exit 0
 *   false        | ["node"] | exit 0 | exit 0
 *   true         | ["node"] | exit 0 | exit 0
 *
 * So neither half alone sees anything. `skipLibCheck: false` is tsc's DEFAULT,
 * which is why the top row is the row a config author who writes no tsconfig of
 * their own actually lives in -- and it is the row this repository could not
 * reach: tsconfig.json sets `skipLibCheck: true`, and so does
 * test/helpers/typecheck.ts's `consumerCompilerOptions`, so THE PROBE HARNESS
 * ITSELF WAS BLIND, not merely the build.
 *
 * THROUGH installConsumer, NOT typeCheckProbe, and the two are not
 * interchangeable: the in-repo arm resolves the exports map's `default` straight
 * at src/types.ts, so it observes a file rather than what ships.
 * test/published-artifacts.test.ts measures that difference directly.
 *
 * EVERYTHING HERE IS BORN GREEN, stated plainly rather than dressed up: the
 * specifier already behaves this way, and what was missing is the CHECK. So the
 * headline test proves nothing on the day it was written, and the evidence is in
 * the three tests that follow it: one shows tsc really read the probe, and the
 * two at the bottom observe a tree where the difference was actually made.
 *
 * WHAT IT DOES NOT COVER. It is the TYPE arm only -- nothing here runs. And it
 * is a claim about the INSTALLED dependency: package.json asks for `^3.17.5`,
 * and this reads whatever the lockfile put in node_modules.
 *
 * ---------------------------------------------------------------------------
 * THIS PROBE'S OWN FRAGILITY, disclosed for the same reason
 * `ProtocolConnectionHasTheseMembers` discloses that its diagnostic is a TS2344
 * naming no member: a probe whose failure mode is unrecorded is one somebody
 * eventually disables.
 *
 * `skipLibCheck: false` type-checks the WHOLE `.d.ts` graph the published
 * surface pulls in, so this file is coupled to the DEPENDENCY'S DECLARATION
 * QUALITY and not only to tsudoi's specifier. A future
 * vscode-languageserver-protocol release carrying one imperfect declaration
 * reddens the first test below for a reason that has nothing to do with this
 * project.
 *
 * IT IS CLEAN TODAY, MEASURED: exit 0 with EMPTY OUTPUT at
 * vscode-languageserver-protocol 3.18.2, which the lockfile pins beside
 * vscode-jsonrpc 9.0.1 and vscode-languageserver-types 3.18.0.
 *
 * TRIAGE WHEN IT FIRES -- what a maintainer does, and it turns on READING THE
 * DIAGNOSTIC rather than on the exit code:
 *
 *   TS2591 for `child_process`, `net` or `worker_threads`, or TS2503 for
 *   namespace `NodeJS`, reported under a `lib/node/` path -- in
 *   vscode-jsonrpc/lib/node/main.d.ts and
 *   vscode-languageserver-protocol/lib/node/main.d.ts, which is where every one
 *   of them was measured -- means THE PROBE FIRED FOR ITS REAL CAUSE. Somebody
 *   moved src/types.ts off the bare specifier. The fix is the specifier.
 *
 *   ANYTHING ELSE is the dependency's declaration graph, and the fix is not in
 *   this repository. The response is to NARROW THE ASSERTION -- from `output is
 *   empty` to `output names no node-typing diagnostic` -- and record the version
 *   it changed at, keeping the discrimination while dropping the part that was
 *   never this project's to promise.
 *
 *   WHAT MUST NOT HAPPEN IS `skipLibCheck: true` HERE. That single edit makes
 *   every assertion in this file pass while it measures nothing -- the exact
 *   state this file was written to leave, and the third recorded time that
 *   option has defeated a probe in this project.
 */

/**
 * THE CONSUMER'S OWN TSCONFIG, and it belongs to the probe rather than to the
 * shared helper: `skipLibCheck` is this file's SUBJECT, so taking it from a
 * constant every other probe shares would make it somebody else's to change.
 *
 * `types: []` is the other half of the pair and does its work by SUBTRACTION:
 * installConsumer symlinks the repo's `@types` into every consumer, so
 * @types/node is present on disk and this is what stops tsc reaching it. With
 * `types: ["node"]` both specifiers exit 0 and there is nothing to see.
 */
const noNodeTypings = { skipLibCheck: false, types: [] };

const eightNames = { "eight-names.ts": importsAndUses(publicProtocolNames, "@atusy/tsudoi/types") };

let consumer: InstalledConsumer;
let perturbed: InstalledConsumer | undefined;

beforeAll(async () => {
  consumer = await installConsumer();
});

afterAll(() => {
  consumer.dispose();
  perturbed?.dispose();
});

/**
 * A consumer holding a package packed with the specifier MOVED to `/node`,
 * built ON FIRST USE and MEMOISED so both controls below observe ONE tree.
 *
 * DELIBERATELY NOT IN beforeAll, and the reason was MEASURED rather than
 * guessed. With src/types.ts already at `/node` -- the very regression this file
 * exists to catch -- the replacement finds nothing to move and throws. Raised
 * from beforeAll that takes the WHOLE FILE down before any test runs, so the
 * headline test never reports and the suite blames a helper instead of naming
 * the specifier. Raised from here, the headline test reddens FIRST and with the
 * node-typing diagnostics, and the two controls fail beside it under their own
 * names. MEASURED both ways.
 *
 * The perturbation reaches the published artifact with no rebuild step of
 * anyone's: `bun pm pack` runs prepack over this staged copy, so dist/types.d.ts
 * is compiled from the line edited here. tsconfig.build.json sets
 * `skipLibCheck: true` and `types: ["node"]`, so the BUILD is unaffected by the
 * move -- were it not, installConsumer would fail on its own pack and there
 * would be no diagnostic to read at all.
 */
async function specifierMovedToNode(): Promise<InstalledConsumer> {
  perturbed ??= await installConsumer({
    editSource: (srcDir) => {
      const types = join(srcDir, "types.ts");
      const source = readFileSync(types, "utf8");
      // The QUOTED specifier, because that file's doc block discusses `/node` in
      // prose too and a looser match would rewrite the comment as well as the
      // code -- leaving it unclear which of the two a diagnostic came from.
      const moved = source.replaceAll(
        '"vscode-languageserver-protocol"',
        '"vscode-languageserver-protocol/node"',
      );
      if (moved === source) {
        // NAMED rather than asserted: a replace that matched nothing would leave
        // both controls measuring the UNPERTURBED package, and a reader needs to
        // know which of those two things went wrong.
        throw new Error(
          'src/types.ts holds no `"vscode-languageserver-protocol"` to move: either the specifier is ALREADY at /node, or the import was respelled. Both controls below would otherwise measure an unperturbed package.',
        );
      }
      writeFileSync(types, moved);
    },
  });
  return perturbed;
}

/** THE STORY: a config author with no Node typings reachable type-checks. */
test("the eight published names type-check for a consumer with no Node typings", async () => {
  const result = await consumer.typeCheck(eightNames, noNodeTypings);

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});

/**
 * Proves the check above ran over the probe at all. Its own test rather than a
 * second assertion, because it is a different hazard: a tsc that compiled
 * nothing and a tsc that resolved everything both exit 0, and that failure would
 * be a harness defect rather than a specifier one.
 */
test("a deliberate type error is reported under the same tsconfig", async () => {
  const result = await consumer.typeCheck(
    { "broken.ts": 'const wrong: number = "not a number";\nexport default wrong;\n' },
    noNodeTypings,
  );

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2322");
});

/**
 * CONTROL 1, DISCRIMINATION: the specifier this whole file defends, moved.
 *
 * It asserts the DIAGNOSTIC and not merely a non-zero exit, because a consumer
 * that failed to install and a consumer whose surface pulled in Node typings
 * both exit 1 -- and only one of them is what this file is about.
 */
test("moving the published specifier to /node reddens the probe, naming the Node typings", async () => {
  const result = await (await specifierMovedToNode()).typeCheck(eightNames, noNodeTypings);

  expect(result.code).toBe(1);
  expect(result.output).toContain("error TS2591");
  expect(result.output).toContain("child_process");
  expect(result.output).toContain("error TS2503");
  expect(result.output).toContain("NodeJS");
  expect(result.output).toContain("vscode-jsonrpc/lib/node/main.d.ts");
});

/**
 * CONTROL 2, AND IT IS THE ONE THAT MATTERS MOST: proof that the probe really
 * ran with `skipLibCheck` OFF.
 *
 * Without it this file can SILENTLY REVERT TO BLIND -- an override that stops
 * being applied, a key renamed upstream, a merge that turns into a replace --
 * and every assertion here would keep passing while recording nothing. That is
 * not a hypothetical failure mode: it is the state this repository was in until
 * this file existed.
 *
 * THE SAME PERTURBED CONSUMER as control 1, deliberately, because ON ITS OWN
 * THIS GREEN IS SATISFIED PERFECTLY BY A PERTURBATION THAT NEVER HAPPENED.
 * Control 1's red on this same tree is what proves the edit landed; this then
 * shows the red is ATTRIBUTABLE TO skipLibCheck rather than to anything else
 * about a perturbed build.
 *
 * It can be the first thing to fail, which is what makes it a control rather
 * than a restatement: if control 1 ever reddens for some other reason, control 1
 * stays green and THIS one fails.
 */
test("the same perturbation is invisible once skipLibCheck is back on", async () => {
  const result = await (
    await specifierMovedToNode()
  ).typeCheck(eightNames, {
    ...noNodeTypings,
    skipLibCheck: true,
  });

  expect(result.output).toBe("");
  expect(result.code).toBe(0);
});
