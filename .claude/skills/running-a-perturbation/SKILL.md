---
name: running-a-perturbation
description: Use when perturbing something to see what reddens — breaking a symbol, deleting a file or an entry, disabling a branch, re-running an earlier perturbation, or explaining why one went green. Carries the four-outcome vocabulary this project uses and the measured ways a green here has meant nothing.
---

# Running and labelling a perturbation

## Discipline, one rule

**Anything not perturbed is assumed UNPROVEN. Every step declares expected-RED
or born-green. Every perturbation is named by THE ASSERTION IT FLIPS, not by the
step it belongs to.** If it flips at an EARLIER assertion than the step's
headline claim, PREFER SPLITTING OVER DOCUMENTING — the earlier flip is a signal
that the test BUNDLES independent sub-claims, and splitting dissolves what a
note would only describe.

**A perturbation you specify for someone else names the assertion it is required
to flip, not just the mutation to make.**

**Say whether you REPRODUCED a recorded perturbation or ran an INDEPENDENT one.**
Prompted by a reviewer's perturbation reddening 6 tests where the author's
reddened 2. **That label is VACUOUS when the verifier is also the author** — it
still reads as reassurance, which is silent degradation inside the rule.

**So `INDEPENDENT` may be written only when the verifier is not the author — and
when execution changes hands mid-change, SAY SO AT THE TIME.** The disclosure is
only possible then: an after-the-fact amendment records the fact but CANNOT
RECOVER THE OBSERVER, because by then the same context has both written and
verified. This is the condition the label rests on, not courtesy.

## The standing re-run

**Re-run one perturbation from the previous change.** Its second rationale, and
the answer if the cost is ever questioned: IT ALSO DETECTS DISARMED CONTROLS.
MEASURED: extracting a table to satisfy one requirement silently dropped the
contextual typing that made a DIFFERENT control fire, and the Definition of Done
STAYED GREEN THROUGHOUT — caught only by re-running someone else's perturbation
after one's own edit, which nothing performed then.
`test/perturbations.test.ts` now re-runs every RECORDED weakening on each suite
run, over the arm files it can stage. It costs almost nothing and restores a
second observer retroactively.

**Ask FIRST which perturbation still HAS A TARGET in this tree.** After a shape
change most have none left, so the default choice returns TARGET DELIBERATELY
REMOVED and its green records NOTHING about the change under review. MEASURED:
nearly every previous perturbation aimed at a tuple that no longer existed; the
one whose target survived — the cancellation check between pulling a batch and
sending it — reddened TEN tests across both runtimes.

## Why a re-run went green: four outcomes, and they are a vocabulary

All four produce THE SAME OBSERVATION and are indistinguishable from it alone,
which is the whole reason the vocabulary exists. The first two are DEFECTS; the
other two are not.

1. **GONE QUIET** — the assertion no longer detects what it used to.
2. **DISARMED** — something else removed the control's ability to fire.
3. **EDIT GREW A SECOND HALF** — the change made the perturbation insufficient.
4. **TARGET DELIBERATELY REMOVED** — the hazard is gone.

**TARGET DELIBERATELY REMOVED is not UNCONSTRUCTIBLE.** The edit may remain
perfectly writable and compile; what was removed is THE HAZARD, not the
perturbation.

**NOT CONSTRUCTED is a fifth thing and belongs to a different question**: the
means were lacking, the assertion is undefended, and you say what remains at
risk. Filed because a vocabulary of three defaulted the third to the pessimistic
reading, and a DESIGN SUCCESS was reported in the language of a coverage gap.

**An observation that does not answer "why did this re-run go green?" does not
join this vocabulary, however adjacent.** A re-run that went as recorded but now
costs a type check answers a different question and gets a NOTE AT THE SITE — a
comment stating what it does NOT rule out.

## Reading the result

**When a perturbation reddens FAR MORE than predicted, read the MECHANISM before
widening the prediction.** MEASURED: one perturbation hit its named target
exactly and reddened 22 where 4 were predicted, and the eighteen shared ONE
mechanism READ FROM A FAILURE MESSAGE rather than assumed — holding the first
batch parks every fixture waiting behind a gate the test has not opened, which
is verbatim the cost this design cites for refusing the look-ahead. The surplus
is either the design's own rationale demonstrating itself or a coupling nobody
had named, and both are findings where a corrected number is not.

**A zero-result grep is ambiguous**: it means EITHER clean OR the referent was
just deleted and left a dangler. Measured once as the second, where a grep run
for someone else's staleness caught what that change had just broken.

**When the shape moves under you, every prediction and every finding taken
against the old shape is SUPERSEDED rather than inherited, and saying so is the
maintainer's job at the moment of the move** — not the author's when they trip
over it. MEASURED across one change whose subject type changed
four times: a committed diff prediction describing a shape that no longer
existed, an author's headline that was true of a superseded shape and had to be
withdrawn, and a preserved patch whose terminal handling could not be trusted.
None of that is a reason to refuse a change of shape mid-work.

**Deleting a test that defends a requirement is a SCOPE DECISION, not a fix, and
it is routed before it is re-homed.** Applies to any change, not only planned
work. MEASURED: three changes landed with tests green and perturbations run —
the fast loop working — while one of them silently withdrew a requirement by
deleting its two tests. The signal was there: eight tests
reddened. What was missing was routing it back.
