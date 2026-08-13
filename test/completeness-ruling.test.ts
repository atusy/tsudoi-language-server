import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { handlerMembers } from "../scripts/workspaces.ts";
import { repoRoot } from "./helpers/spawn.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

/**
 * EVERY COMPLETION HANDLER IN THIS REPOSITORY HAS RULED ON WHETHER ITS ANSWER IS
 * COMPLETE, AND THIS IS WHAT KEEPS THAT TRUE.
 *
 * WHY IT NEEDS DEFENDING AT ALL. The specification says a supplied
 * `CompletionItem[]` is identical to `{ isIncomplete: false, items }`, so a bare
 * array is a POSITIVE CLAIM that the candidate set is final and the client need
 * not ask again. Every handler here makes that claim whether or not anybody
 * chose it. The remedy is a RE-READ and not a re-type: rewriting each return as
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
 * EVERY COMPLETION HANDLER, NAMED. Not counted -- two counts over this
 * directory answer two DIFFERENT questions, `files naming the method` and
 * `files serving it`, and a bare number says which of them it came from to
 * nobody.
 *
 * NO CONFIG IN IT ANSWERS A `CompletionList`, AND NONE CAN, said here because a
 * short enumeration reads exactly like a ruling that was dropped: a completion
 * handler yields `CompletionItem[]` and nothing else, so a config demonstrating
 * that answer is UNWRITABLE rather than merely absent. THE TWO RULINGS THAT SAY
 * `NOT COMPLETE` ARE AT packages/tsudoi-completion-path/src/completion.ts AND
 * examples/tsudoi.config.ts, which is where that limitation is recorded.
 */
const ruled = [
  "examples/tsudoi.config.ts",
  "packages/tsudoi-completion-document/src/around.ts",
  "packages/tsudoi-completion-document/src/corpus.ts",
  "packages/tsudoi-completion-dictionary/src/dictionary.ts",
  "packages/tsudoi-completion-path/src/completion.ts",
  "packages/tsudoi-completion-shell/src/shell.ts",
  "test/fixtures/all-methods.ts",
  "test/fixtures/completion-cancel.ts",
  "test/fixtures/completion-chunks.ts",
  "test/fixtures/completion-cleanup-hangs.ts",
  "test/fixtures/completion-cleanup-throws.ts",
  "test/fixtures/completion-cleanup-yields-forever.ts",
  "test/fixtures/completion-cleanup-yields-then-throws.ts",
  "test/fixtures/completion-cleanup-yields.ts",
  "test/fixtures/completion-cleanup.ts",
  "test/fixtures/completion-counts-pulls.ts",
  "test/fixtures/completion-gate.ts",
  "test/fixtures/completion-ignores-signal-rejects.ts",
  "test/fixtures/completion-ignores-signal.ts",
  "test/fixtures/completion-null-after-yield.ts",
  "test/fixtures/completion-null-only.ts",
  "test/fixtures/completion-throws.ts",
  "test/fixtures/completion-unhandled-rejection.ts",
  "test/fixtures/completion-workspace-gate.ts",
  "test/fixtures/completion-yields-bare-item.ts",
  "test/fixtures/completion-yields-bare-number.ts",
  "test/fixtures/completion-yields-non-array.ts",
  "test/fixtures/initialize-absent.ts",
  "test/fixtures/resolve-detail.ts",
  "test/fixtures/throws-on-cancel.ts",
];

/**
 * THE FILES THAT NAME THE METHOD AND SUPPLY NO HANDLER FOR IT, excluded BY NAME
 * so each exclusion is a decision rather than a gap in a regex.
 *
 * THIS IS ALSO WHY A SCAN FOR THE METHOD NAME AND A COUNT OF HANDLERS DISAGREE.
 * The entry below mentions `textDocument/completion` only in PROSE, and a ruling
 * in it would be a sentence about a return value that does not exist there: the
 * fixture says it deliberately HAS no completion handler, and that absence is its
 * subject.
 */
const namesTheMethodWithoutServingIt = ["test/fixtures/resolve-without-completion.ts"];

/**
 * Every directory a completion handler can live in, WITH THE WORKSPACE MEMBERS
 * ENUMERATED RATHER THAN LISTED.
 *
 * A HANDLER THAT MOVED INTO A PACKAGE WOULD OTHERWISE LEAVE THIS SCAN SILENTLY,
 * and the ruling it carries would stop being defended by anything: the scan
 * would find one fewer file, the enumeration below would be edited to match, and
 * both tests would go green over a handler nothing looks at. Members come from
 * `workspaces`, so a package added under packages/ is covered here with no list
 * edited -- the same reasoning the fifth Definition-of-Done check reads that key
 * for.
 *
 * ONE LEVEL AND NOT A WALK, matching how the two directories beside it are read:
 * every handler in this repository sits directly under one of these.
 */
function handlerDirectories(): string[] {
  return [
    "examples",
    join("test", "fixtures"),
    // HANDLERS AND NOT MEMBERS. This scan asks of every file whether it declares
    // a completeness ruling for the completion handler it holds -- a question
    // about a package that WRITES a handler. The framework's own src/ names the
    // method because it ROUTES it, and a member-wide enumeration would begin
    // demanding a handler's ruling from the module that dispatches to handlers.
    ...handlerMembers(repoRoot).map((member) => join(relative(repoRoot, member), "src")),
  ];
}

/**
 * Every file under the config directories that NAMES the completion method.
 *
 * NAMING IS NOT SERVING IN BOTH DIRECTIONS NOW, AND ONLY ONE OF THEM HAS AN
 * EXCLUSION. A per-file grep is fooled the other way too, and this repository
 * grew its first instance with the handshake handler: three `initialize-*`
 * fixtures SPREAD another fixture's exported `methods` object, so they SERVE
 * completion while containing zero occurrences of the string. The class of
 * configs serving it grew and the class this scan can see did not move.
 *
 * THE RULING IS NOT LOST AND THIS IS NOT REPAIRED HERE: it lives at the
 * definition site those three import from, which is where the return value that
 * would violate it is written. What nothing notices is a config spreading a
 * handler out of a file that carries NO ruling -- so a new shared `methods`
 * export owes one at its own site, and this paragraph is the only thing asking.
 */
function scanned(): string[] {
  return handlerDirectories()
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
  const probe = "packages/tsudoi-completion-path/src/completion.ts";

  expect(unruled(new Map([[probe, sourceOf(probe).replace(rulingMarker, "once said:")]]))).toEqual([
    probe,
  ]);
});
