---
name: recording-a-measurement
description: Use when taking a measurement, reporting an exit code or a test result, writing an acceptance criterion or a sprint plan, or stating a count, a coverage claim, or a fact about how something in this repository behaves. Carries the measured ways a stated fact here turned out to be unmeasured.
---

# Recording a measurement, and authoring what binds on one

**WHY THIS SKILL EXISTS, MEASURED RATHER THAN ASSUMED** _(sprint 41)_: criteria
here are authored FASTER THAN THEIR PREMISES ARE CHECKED. That is the answer to
a question this project asked itself twice — whether unbuilt probes meant
honesty or over-authoring — and it is neither. The premise inside a criterion is
the part that goes unmeasured, and the criterion still reads as binding.

**A CRITERION THAT WENT UNMET IS RECORDED AS UNMET.** _(sprint 45)_ The value of
writing criteria at all is that `THIS ONE FAILED` can be said, so a withdrawal
never rewrites a result: record both, and if the premise was withdrawn, say that
separately from the outcome. MEASURED on a criterion whose failing case actually
happened — the stakeholder removed the thing it named, and the executor recorded
`unmet` beside the withdrawal rather than relabelling it `met differently`.
THE DISCRIMINATOR IS WHETHER CONCEALMENT WAS AVAILABLE: there it was, and
refusing it is the only reason the acceptance could be given.

## Taking the reading

**A command whose exit code is being reported is run UNPIPED, and the report
carries the COMMAND AS RUN, not only its exit.** _(sprint 15)_ THIRD OCCURRENCE
OF ONE CLASS across two people, one of them persisting nine sprints, and the
consequence every time is a FALSE MEASUREMENT: `$?` belongs to the LAST command
in the pipe. `tail`'s status was read as `bun test`'s; an exit was lost to
`${PIPESTATUS[0]}`, which is empty in zsh; and an "oxlint exit 1" was GREP
FINDING NO MATCH. The second clause is load-bearing: a habit that leaves no
trace cannot be audited, and a report carrying the command shows its own defect
to any reader.

**Run a verification command exactly as `scrum.ts`'s `definition_of_done` spells
it, and trust a wrapper only after you have seen it redden once.** _(sprint 50)_
MEASURED: formatting was checked through `oxfmt --check . | grep -c ...`, whose
output ON FAILURE IS `0` — read at a glance as an exit code — and a red was
committed and amended away within the minute. This is distinct from a matcher
carrying the defect it hunts: it is AN INSTRUMENT WHOSE SUCCESS AND FAILURE PRINT
THE SAME SHAPE.

**A probe whose result will be recorded runs on BOTH runtimes, or its record
names the one it ran on.** _(sprint 45)_ The suite runs both runtimes precisely
because they differ; a hand-run probe does not. MEASURED: `import { type
MethodHandler }` is ELIDED BY BUN and LOADED BY DENO, so deleting
`dist/types.js` gives bun exit 0 and deno exit 1 naming that file. Every prior
hand-run "MEASURED, EXIT 0" in this project's record is narrower than its
wording for the same reason.

**Predict the diff AND its counterfactual before the work, in writing.**
_(sprints 39, 40)_ A 0/0/0 reading with counts unchanged reads as CONFIRMATION
rather than as a fitted report only because it was written down first. Its second
rationale, and the answer if the cost is questioned: IT IS WHAT CATCHES A
POISONED MEASUREMENT. _(sprint 44)_ MEASURED: `tsc` WRITES `dist/` AND THEN EXITS
NON-ZERO, so a failed build leaves an artifact that is new, freshly written and
WRONG — "rebuild before believing it" is the remedy for staleness and is useless
here, because the rebuild is what produced it. A probe read against it returned
exit 0 where 1 was predicted, and the mismatch was visible only because the
prediction existed. Every automated route in this repository is covered; what
remains exposed is HAND-RUN PROBE SEQUENCES — break source, run something,
revert, read `dist/`.

## Labelling it

**Say whether a claim was MEASURED or REASONED, and never state a consequence
without checking it against the remedy it justifies.** _(sprint 8)_ **A measured
claim records what would let it be RE-RUN, not only its conclusion**: for a
DEPENDENCY that means VERSION AND PATH; inside this repository it means an anchor
that SURVIVES EDITS, since a line number moves when prose is added above it. The
asymmetry is why this matters when you are pressed: a path WITHOUT a version
MISLEADS — it looks precise, points at the wrong lines after a bump, and reads as
re-checkable when it is not — where a version without a path merely costs a
search. Filed after this project's first false MEASURED label, whose correction
(`vscode-jsonrpc 9.0.1, connection.js:646-648`) could be re-checked where the
original could not, AND THAT DIFFERENCE IS WHY THE ERROR SURVIVED A SPRINT.

**A labelled claim is measured while it is still cheap.** _(sprint 44)_ MEASURED:
"the `default` exports arm now has no consumer in this repository" was reasoned
from three comments, LABELLED REASONED-NOT-MEASURED, and routed rather than acted
on. Measured within the hour: removing every `default` arm leaves `tsc` at exit 0
— so the dependence really was gone — AND REDDENS FOUR TESTS, so the arm is still
taken. The reasoning was half right and the action it would have justified was
wrong. A routed question with a one-command answer becomes a standing uncertainty
the moment nobody runs the command.

**A claim about what the suite COVERS is checked against the suite, and it may
NOT take the "reasoned" option the label rule allows.** _(sprint 13)_ Widened
twice: a claim about what a RULE SET contains, and a claim that the suite does
NOT defend something, are both coverage claims. The recurring shape: A FACTUAL
PREMISE STATED INSIDE A CRITERION IS A CLAIM REQUIRING MEASUREMENT, NOT FRAMING —
premises go unchecked because reviewers read the REQUIREMENT.

**A premise about an artifact is not stated until that artifact has been read in
the same session.** _(sprint 25)_ Three instances in one refinement; two of them
were claims about a test in this repository, made while invoking that same test's
authority.

**Count the CLAIM'S SUBJECT, not one mechanism's call sites.** _(sprint 44)_
MEASURED: `cpSync` calls in `test/helpers/install.ts` were counted for a claim
whose subject was "what the stage receives", and the fourth staged path arrived
by `symlinkSync`. Reading the artifact is not enough when the thing counted can
arrive by more than one mechanism.

**Re-measure a number you were handed rather than copying it.** _(sprint 27)_ This
has caught a handed-down count in two consecutive sprints, and it works BECAUSE
our records carry version and path. A brief is the one artifact with no permanent
home, so an error in it is caught by the recipient re-measuring or not at all.

**A handoff carries its provenance at both ends.** _(sprint 30)_ One rule, three
payloads — wants, inherited measurements, counts. The bringer labels a want ASKED
FOR or MENTIONED and a handed measurement with WHO TOOK IT; the receiver DOES NOT
RULE ON AN UNLABELLED ONE.

## Four ways a measurement goes stale

_(sprints 38, 41)_ An edit to the measurement; an edit to the file it describes; a
LATER INCREMENT CHANGING THE WORLD IT MEASURED — no grep finds this, because the
words are unchanged and still name real things, and only re-running the control
does; and AN UNCOMMITTED EDIT NOBODY CLAIMS. MEASURED for the fourth: a config
count of 31/29 was taken while an uncommitted edit had already stripped a file so
that it did not match its own pattern, and the number moved to 32/30 when the
edit was reverted. The cheap remedy, already proven: PRESERVE THE CONTENT OUTSIDE
THE REPOSITORY BEFORE REVERTING — an edit can teach something and still not be a
deliverable.

**A mid-stream instrument replacement invalidates the reading only when the new
instrument's readings cannot be tied to the old one's by a SHARED SUBJECT WITH A
KNOWN PRIOR READING.** _(sprint 51)_ And the half that is not about the verdict:
if a check was UNRUNNABLE for a window of commits in a project that commits on
green, "I could not run this check for these commits" is disclosed.

## Authoring a criterion

**A criterion states a PROPERTY a perturbation can falsify — never a mechanism,
and never its own fix.** _(sprints 13, 26, 46)_ MEASURED: a criterion whose
property was "no control is left disarmed" also carried the remedy "tighten to
the full new name", AND THE REMEDY NAMED THE WRONG OPERATION — a longer needle
still prefix-matches, and the fix for a prefix matcher is a BOUNDARY. The
executor followed the remedy and the property went unmet, with the record then
claiming it met.

**A factual premise inside a criterion is measured BEFORE the criterion binds, by
whoever has the shell; a count inside one is marked UNMEASURED by its author.**
_(sprints 41, 43)_ MEASURED: a control was written as "the two NOT COMPLETE
verdicts" where the tree held THREE. Criteria are being authored faster than
their premises are checked, and a downstream catch rate has been standing in for
the check.

**When no citation exists, MEASURE BEFORE BUILDING TO THE COLOUR; a criterion
naming a colour cites the measurement that produced it, so an uncited colour is
visibly a guess.** _(sprints 47, 48)_ MEASURED: a literal resolution probe against
the build config resolved to `./src` and not `dist/`, because `rootDir` with
`outDir` makes `tsc` read a declaration back to its generating input — THE
CRITERION'S NAME WAS THE THING THAT WAS WRONG.

**Check a criterion against what an implementation COULD actually satisfy. When a
guard cannot be a barrier, rule it a ROT DETECTOR rather than writing an
unmeetable criterion.** _(sprint 40)_ "Staleness must be impossible" was
unreachable because the working-directory set is unbounded; the achievable
property is IMPOSSIBLE ON EVERY DOCUMENTED ROUTE, DETECTED ON THE REST.

**At a mechanism change, ask which constraints SURVIVE it.** _(sprint 41)_ Those
were constraints on the property all along; the ones that do not survive were
about the mechanism and should never have been criteria.

**Record both the unmet result and the withdrawal — never let the second rewrite
the first.** _(sprint 45)_ The value of writing criteria at all is that "this one
failed" can be said. "Unmet BY A RULING THAT REMOVED THE SUBJECT" is not unmet by
shortfall; the test is whether concealment was available.

## Config keys in this tree, measured

_(sprint 48)_ A key that fails to MATCH stops applying. Eight tracked
configuration files were enumerated and searched for keys whose effect depends on
matching; the loud ones were measured, not assumed:

- a misspelled `types` in a tsconfig → **`TS5023`, exit 2**
- an unknown rule name in `.oxlintrc.json` → **`Rule not found`, exit 1**
- a `preload` path in `bunfig.toml` that does not exist → **exit 1**

The one SILENT key was the root tsconfig's `paths` mapping — **which no longer
exists anywhere in this repository**, so that finding has no subject today.
`exclude`, the oxlint override globs, `workspaces` and the member `paths` are
pinned BY EFFECT in `test/package-shape.test.ts` and `test/guard.test.ts`.
