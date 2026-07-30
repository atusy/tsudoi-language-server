import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers/spawn.ts";

/**
 * EVERY COMPLETION HANDLER IN THIS REPOSITORY HAS RULED ON WHETHER ITS ANSWER IS
 * COMPLETE, AND THIS IS WHAT KEEPS THAT TRUE.
 *
 * WHY IT NEEDS DEFENDING AT ALL. The specification says a supplied
 * `CompletionItem[]` is identical to `{ isIncomplete: false, items }`, so a bare
 * array is a POSITIVE CLAIM that the candidate set is final and the client need
 * not ask again. Every handler here made that claim for years and nobody chose
 * it. The remedy is a RE-READ and not a re-type: rewriting each return as
 * `{ isIncomplete: false, items }` satisfies every compiler and leaves the same
 * unchosen assertion in place with more syntax around it -- so what is asserted
 * below is that a RULING EXISTS AT THE SITE, which is the one thing a re-type
 * cannot produce by accident.
 *
 * WHAT THIS CANNOT CHECK, said plainly rather than left to be discovered: it
 * cannot check that a ruling is CORRECT. A marker with a wrong sentence after it
 * passes here. What it converts from a Review recollection into a RED is
 * narrower and still worth having -- A NEW COMPLETION HANDLER ARRIVING WITH NO
 * RULING AT ALL, which is exactly how the unchosen default got in the first
 * time.
 *
 * THE RULINGS ARE AT THE SITES AND NOT HERE, per the Lifetime Rule: the
 * violating edit is a change to what that config returns, and it is made in that
 * file.
 */
const rulingMarker = "COMPLETENESS RULING:";

/**
 * EVERY COMPLETION HANDLER, NAMED. Not counted -- the record this list replaces
 * carried the numbers 17 and 16 for two DIFFERENT objects, and no count can say
 * which question it answered.
 */
const ruled = [
  "examples/completion-path.ts",
  "examples/tsudoi.config.ts",
  "test/fixtures/all-methods.ts",
  "test/fixtures/completion-cancel.ts",
  "test/fixtures/completion-chunks.ts",
  "test/fixtures/completion-cleanup-hangs.ts",
  "test/fixtures/completion-cleanup-throws.ts",
  "test/fixtures/completion-cleanup.ts",
  "test/fixtures/completion-gate.ts",
  // completion-list.ts and completion-list-final.ts STOOD HERE UNTIL SPRINT 43
  // and are gone with the capability they demonstrated, which is worth a line
  // because a shrinking enumeration reads exactly like a ruling that was
  // dropped. They were the only two configs that answered a `CompletionList`;
  // a completion handler now yields `CompletionItem[]` and nothing else, so
  // neither file could be written at all. TARGET DELIBERATELY REMOVED per
  // Sprint 38, not a ruling that went missing -- AND THE TWO RULINGS THAT SAY
  // `NOT COMPLETE` ARE STILL AT examples/completion-path.ts AND
  // examples/tsudoi.config.ts, which is where the loss is actually recorded.
  "test/fixtures/completion-null-after-yield.ts",
  "test/fixtures/completion-null-only.ts",
  "test/fixtures/completion-throws.ts",
  "test/fixtures/completion-unhandled-rejection.ts",
  "test/fixtures/completion-workspace-gate.ts",
  "test/fixtures/completion-yields-non-array.ts",
  "test/fixtures/resolve-detail.ts",
  "test/fixtures/throws-on-cancel.ts",
];

/**
 * THE ONE FILE THAT NAMES THE METHOD AND SUPPLIES NO HANDLER FOR IT, excluded
 * BY NAME so the exclusion is a decision rather than a gap in a regex.
 *
 * IT IS ALSO WHERE THE OLD COUNT CAME FROM. `17 completion configs` is what a
 * scan for the METHOD NAME returns, and this file is the seventeenth -- it
 * mentions `textDocument/completion` only in prose, to say it deliberately has
 * none. A ruling here would be a sentence about a return value that does not
 * exist.
 */
const namesTheMethodWithoutServingIt = ["test/fixtures/resolve-without-completion.ts"];

/** Every file under the config directories that names the completion method. */
function scanned(): string[] {
  return ["examples", join("test", "fixtures")]
    .flatMap((dir) =>
      readdirSync(join(repoRoot, dir))
        .filter((name) => name.endsWith(".ts"))
        .map((name) => `${dir.replaceAll("\\", "/")}/${name}`),
    )
    .filter((path) => sourceOf(path).includes("textDocument/completion"))
    .sort();
}

function sourceOf(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/** Which of the given sources carry NO ruling. The instrument, shared so the
 * assertion and its control cannot measure different things. */
function unruled(sources: ReadonlyMap<string, string>): string[] {
  return [...sources]
    .filter(([, text]) => !text.includes(rulingMarker))
    .map(([path]) => path)
    .sort();
}

function sourcesOf(paths: readonly string[]): Map<string, string> {
  return new Map(paths.map((path) => [path, sourceOf(path)]));
}

/**
 * THE GUARD THAT STOPS THE OTHER TWO BEING VACUOUS, and it is an ENUMERATION
 * rather than a count on purpose: `16 files` would still hold if a new streaming
 * completion fixture arrived and an old one were deleted in the same edit, and
 * the ruling that vanished is the whole thing this file exists to notice.
 */
test("the enumerated completion handlers are exactly the files that name the method", () => {
  expect(scanned()).toEqual([...ruled, ...namesTheMethodWithoutServingIt].sort());
});

/** The headline. Every handler that answers has RULED on what its answer claims. */
test("every completion handler carries a completeness ruling at its own site", () => {
  expect(unruled(sourcesOf(ruled))).toEqual([]);
});

/**
 * THE PAIRED CONTROL, permanent rather than a one-time perturbation, per the
 * absence-pairing rule: `no file is missing a ruling` and `this scan cannot see
 * a missing ruling` produce THE SAME EMPTY LIST, and without this the test above
 * records nothing.
 *
 * The probe is a REAL RULED FILE with its marker removed -- the actual way this
 * would break, someone rewriting that comment -- rather than a hand-written
 * string, which would prove only that the check fails on prose it was never
 * pointed at.
 */
test("a completion handler whose ruling was removed is reported by name", () => {
  const probe = "examples/completion-path.ts";

  expect(unruled(new Map([[probe, sourceOf(probe).replace(rulingMarker, "once said:")]]))).toEqual([
    probe,
  ]);
});
