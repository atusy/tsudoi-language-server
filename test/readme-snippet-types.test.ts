import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applySuiteDeadline } from "./helpers/deadline.ts";
import { markedBlocks } from "./helpers/readme.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { typeCheckProbe } from "./helpers/typecheck.ts";

applySuiteDeadline();

/**
 * THE ONE DOCUMENTED BLOCK WHOSE LESSON IS THAT IT DOES NOT COMPILE.
 *
 * The snippet account beside every other block asks that a block's IMPORTS
 * resolve, which is the right question for a fragment of a reader's file and
 * says nothing about its types. Under it, the day `DocumentView` gained
 * defaults that made this literal valid, README.md would teach a falsehood with
 * every check green.
 *
 * `IT FAILS` IS NOT THE ASSERTION, AND THAT IS THE WHOLE DESIGN. Two other
 * states produce a red here and neither is the lesson: an unresolved specifier
 * in a checkout nobody built, and the bare `uri` these fragments spell, which is
 * the reader's own variable. So the arm requires the CODE and the three member
 * names the prose itself lists -- `positionAt, offsetAt and lineCount are
 * missing` is the comment inside the block, and TS2739 is what names them back.
 *
 * THE PREAMBLE IS DISCLOSED RATHER THAN HIDDEN: `uri` is declared for the probe,
 * because a fragment is not a program and the document says so. Nothing else is
 * added, so what compiles here is the block a reader copies.
 *
 * WHAT THIS DOES NOT CLAIM, MEASURED: the edit that fires it today -- the three
 * members becoming optional -- reddens `tsc --noEmit` too, in src/documents.ts's
 * arms and with a message about assignability to `TextDocument`. What this adds
 * is the DOCUMENT: that red names a test file, and a reader fixes the test file.
 * The day `DocumentView` stops being handed where a `TextDocument` is wanted,
 * the compiler goes quiet here and this arm does not.
 */
const preamble = "declare const uri: string;\n";

function snippetBlocks(): readonly string[] {
  const markdown = readFileSync(join(repoRoot, "README.md"), "utf8");
  return markedBlocks(markdown, "snippet").map((marked) => marked.block.body);
}

test("the mock the README says satisfies nothing is refused, and it names the three members", async () => {
  const blocks = snippetBlocks();
  // A BLOCK ARRIVING REDDENS HERE RATHER THAN BEING GRADED BY ORDINAL IN
  // SILENCE: this arm knows which of the first two is which, and the count is
  // what forces whoever adds a third to say what happens to it. WHAT HAPPENED TO
  // THE THIRD: it is the custom-method config, and it is COMPILED below beside
  // the second rather than left to the specifiers row alone -- a documented
  // config that does not type-check is the failure this whole file exists for.
  expect(blocks.length).toBe(3);

  const refused = await typeCheckProbe({ "snippet.ts": preamble + (blocks[0] ?? "") });
  expect(refused.code).toBe(1);

  // ONE DIAGNOSTIC, AND NOT `the output somewhere contains TS2739`. The second
  // review stage made the documented literal VALID and supplied the code and all
  // three names from a decoy declaration beside it; every line below passed over
  // a block that compiled. The count is what ties the diagnostic to the block.
  const diagnostics = refused.output.trim().split("\n");
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]).toContain("TS2739");
  expect(diagnostics[0]).toContain("DocumentView");
  for (const member of ["lineCount", "positionAt", "offsetAt"]) {
    expect(diagnostics[0]).toContain(member);
  }

  // THE PAIR, AND IT IS NOT DECORATION: a probe that refuses everything -- a
  // broken tsconfig, an unmirrored dependency -- passes every line above. Each
  // failure NAMES ITS BLOCK by that block's first line, since two blocks through
  // one loop otherwise fail as `expected \"\"`.
  for (const compiles of [blocks[1], blocks[2]]) {
    const built = await typeCheckProbe({ "snippet.ts": preamble + (compiles ?? "") });
    expect(`${(compiles ?? "").split("\n")[0] ?? ""}\n${built.output}`).toBe(
      `${(compiles ?? "").split("\n")[0] ?? ""}\n`,
    );
    expect(built.code).toBe(0);
  }
});
