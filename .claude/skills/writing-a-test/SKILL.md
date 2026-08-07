---
name: writing-a-test
description: Use when writing, changing, or reading the result of a test, guard, probe, sweep, enumeration, or negative control in this repository — including any check whose green will be reported. Carries the measured ways a check in this tree has passed while measuring nothing.
---

# Writing a test in this repository

Every rule below was filed after an instrument here produced a clean green and
measured nothing. The measurement is carried with the rule: a rule without one
is advice, and this project has thirty sprints of evidence that advice does not
hold.

## An instrument that cannot fail measures nothing

**Before reading a green, ask whether what you perturbed is REACHED by what you
measured.** Not whether the control fired — whether it COULD have. _(sprint 42)_
MEASURED: renaming `Method` in `dist/types.d.ts` left `tsc` at exit 0 and was
nearly read as "tsc does not consult dist/". It meant only that no example
imports `Method`. Re-probed with a name the examples do import: `TS2305` at the
example.

**Write the degenerate implementation and run your arms against it.** If they all
pass, the arms describe an author's intention rather than a property.
_(sprint 50, amending sprint 42)_ MEASURED: three planned arms were all satisfied
by a guard that passes any name holding a scope — which, on a repository whose
every member is scoped, refuses NOTHING: three arms green, the fifth check exit 0
and silent on a still-mismatching tree. The fourth arm was written from that
measurement. Second reading _(sprint 52)_: with `handlerMembers` returning every
member, 2 pass / 3 fail — the three throwaway-tree arms reddened and the two arms
reading this repository stayed green, correctly.

**A perturbed input that is not in the program your assertion reads cannot make
it fail.** _(sprint 49)_ MEASURED: a test rewrote the tracked root
`tsconfig.json` to show that a member ignores it, but `tsc -p <member>
--showConfig` proves the root config is never in that member's program. The test
could not fail — and it was mutating a version-controlled file in order to not
fail. The detector is cheap and should be routine.

**Two states that produce byte-identical failure text are ONE red.** _(sprint 52)_
MEASURED at the move: "the entry resolves to the WRONG package" and "there is no
entry at all" printed the same six lines. The reading that discriminates them is
following the entry and reading the TARGET'S DECLARED NAME — not that a symlink
exists.

**A guard that fires for a reason other than the one it was built for is not
evidence that it guards.** Ask WHY it fired, not WHETHER. _(sprint 41)_ MEASURED:
an unwrapped expression-bodied `satisfies` errors in BOTH arities, so it never
passes silently — the check was verifying the wrong subject and failing anyway,
because a Promise can never satisfy a function type.

**The comparison mechanism is an instrument too.** _(sprint 38)_ MEASURED:
`JSON.stringify` with a KEY ARRAY filters NESTED keys, so two different
capability objects serialised identically and a 120-order agreement probe would
have reported success while measuring nothing. Pair every such probe with a
control proving it can see the thing it compares.

## Sweeps

**A CLASS DISPOSITION IS NOT A DISPOSITION — it is an unread set with a reason
attached.** _(sprint 63)_ A class may bound EFFORT; it may not stand in for
READING, and a hit inside one is DEFERRED rather than dispositioned. **The
admissibility test, which costs nothing and is the whole rule: a class warrant
holds only if the property defining the class is decidable FROM THE MATCHED
LINE.** MEASURED, two for two — both class dispositions written in one sweep hid
a live site, and both warrants were properties of a site's MEANING rather than
of its text:

- "package-relative pointers under a convention the project states" hid a
  MACHINE-OUTPUT site: a lint rule's violation message named `src/notifications.ts`
  while the same file's exemption glob spelled the member path in full, because
  a refactor updated the glob and not the message. Nothing in the suite asserts
  that message, so a message the linter dropped would have left every check
  green.
- "prose rather than machine output" hid a docstring licensing a NAMED REFUSAL
  six lines below it, whose claim — that the root type check reads source rather
  than the artifact — was false: four artifact declarations are in that program,
  a syntax error in one reddens the check, and a type error does not. The
  conclusion survived on `skipLibCheck`, a mechanism nobody had written down.

**A DEFERRAL IS STATED WITH ITS COUNT AND THE SWEEP'S CLAIM NARROWS TO MATCH.**
"Nothing else found" becomes "nothing else found outside N hits in these
classes, unread" — checkable by someone who was not there, which is what writing
the keys down is for. A SAMPLE OF EACH CLASS WAS CONSIDERED AND REFUSED: a
sample reported as a sample is honest, but it adds mechanism to a rule whose
strength is that it forbids nothing, and an approximation that reads as coverage
is the shape this project keeps refusing.

**AND A HIT IS A LINE WHERE A DISPOSITION IS A CLAUSE.** _(sprint 63)_ Same
failure at line granularity: reading only the clause the key matched is how a
false sentence survived in a file the sweep had opened. MEASURED — a skill file
inside the sweep's own declared universe, reached by two of its keys, carrying
three present-tense claims false since the refactor, was never opened at all.

**WHEN A SUBTASK MOVES WHAT A FIELD CARRIES, THE FIELD'S NAME IS SWEPT AND EVERY
HIT DISPOSITIONED IN THAT SUBTASK — BEFORE THE COMMIT, NOT AT REVIEW.**
_(sprint 82)_ Three dispositions and no fourth: re-sited, deleted, or LEFT GREEN
WITH THE REASON IT STILL READS SOMETHING. A hit with no disposition is
unfinished work, not a finding to weigh later. The trigger is mechanical — a
field stops carrying X and starts carrying Y — so this is a rule and not an
intention to be careful. MEASURED: three assertions read a field whose meaning
had moved and went on passing; two were caught by reading, and the third was
NAMED IN THE ITEM'S OWN ACCEPTANCE CRITERIA at refinement and still re-sited
only four subtasks later, after four full green runs had been read as passing.
It was a grep hit at the subtask that moved the field. It needed
dispositioning, not discovering.

**WHAT THE SWEEP CANNOT SEE, so its completion is not read as coverage:** an
assertion naming no field. A whole-value `toEqual` over the answer is invisible
to a grep on the field's name — and those are usually the arms carrying the
real claim. It also fires only on a field LOSING a meaning; one quietly
GAINING a second produces no hit at all.

**A SWEEP'S KEY LIST IS DERIVED FROM THE ENUMERATION AND THE DERIVATION IS
SHOWN.** _(sprint 63)_ Otherwise the two are different claims and "each key
swept" says nothing about the enumeration. MEASURED: one enumerated mechanism
had no key — found after the item closed, swept independently at zero live
sites, so nothing was at risk and the closure condition had still claimed a
correspondence that did not hold. A key with no enumerated parent, or a
mechanism with no key, is named as such.

**When the defect class you are sweeping for is a property of MATCHING, your
sweep is an instance of that class.** Bound the instrument first. _(sprint 46)_
MEASURED: a sweep concluded "no other prefix matcher exists" using greps that
were themselves prefix-matching, and said so in the same report without
connecting the two. The boundary-aware re-sweep reached the same answer — so the
conclusion was right and the evidence did not support it.

**A sweep runs every perturbation its subjects have subjects for**, because
"green" and "green for want of a subject" look identical in a report.
_(sprint 51)_ MEASURED: under the exports-deletion perturbation alone most probes
were green because they name a RELATIVE PATH, so nothing in them could have been
answered by the route being removed. A sweep that stopped there would have
produced a CLEAN, FALSE report; the second perturbation is what gave those probes
a subject.

**Enumerate files and keys — never name-grep — when what you are hunting is
itself a property of matching.** _(sprint 48)_

## Assertions

**CAN THE PROPERTY BE VIOLATED BY MOVING CODE WITHOUT CHANGING ANY VALUE? If it
can, and your arm does not redden on the move, YOUR ARM ASSERTS `WHAT` WHERE THE
PROPERTY IS `WHEN`.** _(sprint 54)_ Apply it in seconds, before the arm is
believed. MEASURED, four instances in one sprint, each green while the property
it defended was violated:

- A spy read the VALUE handed to the runtime and not its ordinal among the
  registrations, so a file that applied the right value and then re-applied the
  old one passed.
- A sweep read the call's COLUMN — typography — where the property was its
  POSITION relative to the first registration, so a call moved BELOW the tests it
  was supposed to govern passed.
- A module's environment read had a time (import, not call) that nobody had
  written down and nothing asserted, because every arm set the variable before
  the process started, where the two times are one reading.
- And the sprint's own worst: a pin read the EXPORTED constant rather than the
  value the runtime actually received. A one-token edit to the shipped branch
  left the whole suite green — 809 pass, all five checks — while an ungated test
  ran at a deadline lower than the helper deadline it could reach.

The last one generalises the rest: **a second expression standing beside the
call is not the call.** If the arm reads anything other than what the code under
test HANDS OVER, name what could differ between them and check that too.

**Every assertion that something is ABSENT ships with a PAIRED assertion,
permanent in the suite, that the same measurement observes it when present.**
_(sprint 6)_ The shape this tree uses: `expect(offenders).toEqual([])` beside
`expect(read).toBeGreaterThan(0)` — an empty list and a reader that opened
nothing are the same observation without the pair.

**Every assertion gets a negative control: name the change that would make it
fail.** If no change would, it is VACUOUS. And **a control that can never be the
FIRST thing to fail is not a control** — ask whether something else would have
failed first. _(sprint 9)_ MEASURED: a test calling `runTsc(repoRoot)` — which IS
the Definition of Done's own `tsc --noEmit` — was deleted, because it could not
fail unless the DoD had already failed. It reads in both directions: a control
that WOULD be first to fail is worth adding when existing detection is real but
arrives WITHOUT NAMING ITS CAUSE.

**A hazard owns a test whose FIRST assertion it is.** _(sprint 18)_ Two hazards
sharing one test means the second can never be observed: the same perturbation
flips the first and the test stops there.

**Pin a behaviour only where ONE outcome is required.** _(sprint 7)_ The cost of
over-pinning is already visible in this tree as hardcoded-response-id
brittleness: tests that resist legitimate change without defending a requirement.

**Pin a premise to something on the path BY CONSTRUCTION, not to prose that
describes it.** _(sprint 49)_ MEASURED: the optional-peer falsehood was bound to a
README section, so publishing WITHOUT editing the README stayed green — the pin
sat beside the door rather than in it. `private: true` on the manifest a publish
reads is the one edit that permits publication, so it is the edit that reddens.
When a claim must die on an event, find the artifact the event CANNOT AVOID
TOUCHING.

## Names and claims about coverage

**A test name that claims more than its assertion verifies is a defect, and the
repair may be THE NAME.** _(sprint 49)_ MEASURED: widening a matcher to bare
filenames was measured NOT to catch the named escapee — `.ts` reads back to
`.d.ts`, which resolves — so the choice was between a true narrow name and a
wider matcher that still misses. The name was narrowed.

**A uniqueness claim about a probe is measured or it is not written.**
_(sprint 45)_ "This probe is the only thing that would notice X" is a coverage
claim. MEASURED on a sentence written the same sprint: deleting the `import` arm
reddens FIVE tests, including the type-only assertion the same commit added.

**Ask of every surviving test "what would make this red, NOW?" — one test at a
time, never as a batch.** _(sprint 45)_ MEASURED: of twelve tests classified
individually, THREE would have stayed green while measuring nothing, and they
failed three different ways — one removed with no re-home, one DISARMED, one
VACUOUS (reading an empty list that is empty for a reason unrelated to the
guard). A batch classification cannot catch the vacuous one even in principle: it
is green, its subject still exists, and its name still describes something real.

## Helpers and fixtures

**A helper that terminates a subprocess settles every promise it owns before the
process dies.** Cross-test misattribution is a suite-integrity failure, not a
single-test bug. _(sprint 5)_ Implemented here in `test/helpers/lsp.ts`
(`#pend` / `#deadServer`) and asserted in `test/session.test.ts`.

**A helper rewritten to RESOLVE what it previously only REFERENCED inherits every
state the old implementation was structurally immune to, and that inheritance is
the author's to enumerate.** _(sprint 51)_ MEASURED: a harness closure's first
version crashed on a DANGLING entry, because the wholesale symlink it replaced
resolved nothing and so nothing could dangle — a state that is routine here,
since a relative workspace link dangles the moment a member directory moves.

**WHY THE DEGENERATE ARM EARNS ITS COST, ANSWERED FROM THIS RECORD RATHER THAN
ASSERTED** _(sprint 44, closed sprint 52)_: the project asked whether it was
producing more weak probes or merely detecting more of them. The discriminator
is WHO CAUGHT IT, and through that close every instance READ was caught BY THE
PERSON WHO RAN IT — a sweep on its own second run, an executor measuring before
satisfying a criterion, degenerate readings taken before the arms were believed.
Author-caught is detection, not defect. WHAT WOULD REFUTE IT: an instance found
by someone other than its runner, or found after an increment closed — and this
paragraph carries no reading past that close, so a later one is outside it rather
than absent.

**The stakeholder-facing example is EXECUTED by the suite** — the config is
loaded and driven, and a change that breaks it must redden a named assertion.
Two negative controls, because they are different failures: breaking its IMPORT
must redden, and breaking a HANDLER'S RETURN must redden. _(sprint 5, amended
sprint 13)_ It need not be the config carrying every property assertion;
purpose-built configs may.
