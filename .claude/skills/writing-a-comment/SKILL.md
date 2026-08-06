---
name: writing-a-comment
description: Use when writing or editing a comment, a README, CLAUDE.md, or any prose in this repository that states a reason, cites a file or a test, quotes a number, or describes how something works. Carries the measured ways prose here has been false, and decides where a reason belongs when its own file cannot carry one.
---

# Writing prose in this repository

Comments here state **why** and **why not** — refusals, foreclosed alternatives,
measured findings — never mechanics. Everything below was filed after prose in
this tree was found to be false.

## Checking a claim before it lands

**A claim a comment makes about ITS OWN FILE is checked against that file before
the edit lands.** _(sprint 22)_ Editing a file FEELS LIKE verifying what its prose
says about itself, and is not — which is why these survive a first self-review.
MEASURED: three false sentences in one sprint, all found on a SECOND pass, and
they shared no subject — one a coverage claim, one structural, one a which-claim.
What they shared was being ABOUT THE FILE THEY LIVED IN.

**A claim is checked against WHAT IT CLAIMS, not merely against whether something
backs it — a justification can be BACKED AND STILL WRONG.** _(sprint 19)_ MEASURED
in the sprint whose whole subject was prose correctness: one comment justified a
test's second half by a property its FIRST assertion already covered; another
justified a presence pair with an INVERTED argument. The better pattern is the
fix's shape: **a comment stating what it does NOT rule out, and why that is
deliberate, beats one asserting only what it covers.**

**A comment asserting current behaviour states whether an ASSERTION backs it.**
_(sprint 8)_ Three site comments were found claiming things nothing checked, each
reddening nothing on first attempt.

**PREFER NAMING TO COUNTING.** _(sprint 22)_ A count silently falsifies when the
thing counted grows. Where a number IS a measurement result it carries provenance
and is not edited without re-measuring; where it is a description it is replaced
by naming. _(sprint 36)_ And a count can live in a FILENAME or a TEST NAME, which
no content grep sees — MEASURED: seven sites said "the eight" against a nine-name
list, one in a test name and two in probe filenames.

## Two ways prose rots, and only one is a stale value

**A comment that licenses a present-day decision by a MECHANISM THE INCREMENT
REMOVED is worse than a stale value, because it reads as CURRENT.** _(sprint 52,
fifth instance of the class)_ MEASURED THEN: the staged-path pin explained itself
by a compiler mapping the move had deleted, so the tree's narrative account of
how it resolves its own subpaths was false and a contributor learned the pre-move
story from the file that pins what is published. **That site was repaired in the
move commit itself, so the finding has no subject today** — and this paragraph
went on asserting it in the PRESENT TENSE through every sprint since, including
the one whose sweep named `git ls-files` as its universe, matched two of its
thirteen keys in this file, and did not open it. _The class describing itself is
the reason the example is kept rather than deleted._ Distinct from a stale COUNT:
a value went out of date, a reason stopped being true. **Nothing detects this
class.**

**A comment contradicting ANOTHER comment in the same repository is a detectable
condition nobody detects.** _(sprint 46)_ MEASURED: four found in one revise pass
— one assigning root `tsc`'s resolution to the exports map while another file
correctly said the map is never consulted, three naming the wrong subpath for
values, one calling two acquisition routes "the same route" against the README's
correct statement that they differ. Each justifies a live control, so a wrong
witness misdirects whoever maintains it next.

**Grep for the CLAIM'S WORDS, not for the places comments live.** _(sprint 29)_ A
falsified premise was carried by a TEST NAME — a home nobody thinks to check and
invisible to any search for comment syntax. Corollary: **a `git diff` answers
"did this change?", never "is this list complete?"** — they look like the same
check at review and are not.

## Citations: what is inspected here, and what is not

`test/packed-members.test.ts`'s `unreachableClaims` reads path-shaped tokens out
of every file in each PACKED HANDLER PACKAGE's `dist/` and requires each to
resolve inside that tarball. That is the whole of it. **Not inspected today:**

- the framework package — `packed` enumerates `handlerMembers`, so every comment
  under `packages/tsudoi-language-server/src/` is read by nothing;
- tracked source generally, including `scripts/`;
- a comment citing a TEST NAME rather than a path.

_(sprint 47)_ This is a MECHANISM gap, not a diligence one: a commit titled "a
false comment shipped" DID NOT FIX the comment its own body named, and because
the build keeps comments it shipped TWICE — in `.js` and in `.d.ts`, read off the
packed tarball. Third consecutive sprint with a false-comment finding, with the
team's attention pointed directly at the class. "Be more careful" is refuted by
the evidence.

## README blocks

_(sprint 47)_ **A non-executed block is indistinguishable from an executed one to
a reader, so one such block silently withdraws the guarantee for the whole
document.** MEASURED when an unexecuted block was finally run: the documented
sequence DID NOT WORK, and the install path named a file that is never created —
`bun pm pack --filename` inside a workspace member writes the tarball to the
WORKSPACE ROOT -- _(sprint 72)_ WITHOUT the flag it writes into the member, so
the unconditional form this line carried was itself an instance of the class
this file is about.
Two defects behind one unexecuted block.

**Extraction here is MARKER-DRIVEN, and since sprint 60 something DOES sweep for
what it missed.** `consumers` in `test/helpers/readme.ts` pairs each tracked
README with the markers something consumes, and `readmeCoverage` refuses BY NAME
any fenced block in a paired document that no consumer reaches — and any tracked
README the table does not name. So a block added without a marker is red rather
than silently unrun, and the info string decides nothing — a fence tagged `text`
owes an account exactly as one tagged `sh` does. An exempt tag list was settled
on and then overturned: it makes the defect reintroducible by typing three
characters.

**That ruling is armed at a SET of tags, and for one round it was armed at
exactly one.** _(sprint 60)_ `fenceForms` in `test/readme-coverage.test.ts` plants
`sh`, `ts`, `text`, a tilde fence and a fence carrying no info string at all into
two documents, each entry with the reason it is in the list. MEASURED before the
list existed, with `if (block.info === "text" || block.info === "ts") continue;`
in the sweep's unreached branch: 934 pass / 0 fail, every check exit 0 — both
planted arms planted ```sh, so the one tag witnessed was the one the ruling was
never in danger over. **A ruling in prose is worth the tags its arm plants.**

**What the sweep still cannot decide is whether a consumer really consumes.** A
row saying `read` names a SUBJECT — the projection its assertion is handed — and
everything the subject leaves out is unchecked BY DECLARATION. _(sprint 60)_
MEASURED on the block this rule was written from: the install line's three
consumers check a `../<checkout>/` prefix and a `<member>.tgz` suffix, so
`bun frobnicate ../<checkout>/x.tgz` satisfies every one of them and leaves every
check green -- the path is the subject and THE VERB IS THE RESIDUE. So when you
add a block: add its marker, add the row, and if what reads it reads only part of
it, that part is the subject and the rest is a residue you write down -- IN THE
DOCUMENT THE READER MEETS, not only in the helper, which is the half this sprint
shipped wrong and had to repair.

**A row whose consuming arm was deleted is a residue nothing notices, and the
mutation arms do NOT cover it — they share its fate.** _(sprint 60)_ MEASURED by
emptying each consuming file, against 934 pass / 0 fail across 65 files:
`test/readme.test.ts` (both `executed` rows) reads 837/0 and
`test/readme-accounts.test.ts` (the snippet and install rows, AND the mutation
arms over them) reads 916/0 — four of the five rows, uncaught. Only
`test/readme-layout.test.ts` reddens, at 929/2, and incidentally: the two reds
are perturbation records naming its arms by exact `test()` string. So when you
delete or retarget an arm, the table is what you fix by hand; nothing will tell
you.

## When a fact changes: delete, narrow, or supersede — in that order

_(sprint 61, scoped sprint 65)_ **Appending a correction beside the sentence it
corrects leaves a reader to pick, and they pick whichever they reach first.** So
do not amend. But the first question is whether the paragraph should survive at
all.

1. **DELETE** — the default. Most corrected sentences were recording a
   measurement or a foreclosed alternative that a reader at that line never
   needed. Deleting takes the referent away with it, which is the whole benefit.
2. **NARROW** — the claim was too wide. Rewrite it to what was read.
3. **SUPERSEDE** — only when someone still relies on the dead sentence and would
   re-derive it. Quote it, mark it dead, state what is true.

_(sprint 65)_ **Supersession was the only option here for four sprints, and it
only ever grows the file.** Half this tree became comments; one module reached
88%. Every correction landed as dead-sentence + why-dead + current-fact, three
times the length of the line it fixed.

**A supersession inherits the date of the claim it replaces, or the measurement
is re-taken.** _(sprint 63)_ Re-authoring is where a claim quietly grows —
you are writing prose, not copying a reading, and the wider present-tense
sentence sounds better. Measured three times in one sprint, each by the author
of the repair: "nothing checked X **until this file**" became "**nothing but
this file** grades X"; a byte-identity range was extended without re-measuring
and was false by 30 lines; "every finding **this sprint**" became "MEASURED
ACROSS SEVERAL SPRINTS" with neither a number nor a condition.

**`is what X` IS THE SAME CLAIM AS `is the only thing that X`, and a sweep keyed
to the words will not find it.** _(sprint 66)_ The dominant repair when
superlatives were swept was exactly that substitution -- `the only thing that
notices it` became `what notices it`, thirty times. It satisfies the rule, and a
later sweep for `the only` / `nothing else` returns none of them. **So the shape
to look for is the definite article doing quantifier work, not the word `only`.**

**The tell is the TENSE and the QUANTIFIER, and you can check both without
re-measuring anything.** `until this file` became `nothing but this file`;
`this sprint` became `across several sprints`. _(sprint 65)_ **A superlative is
the strongest thing you can write and the cheapest thing to write; when it is
the part you did not measure, DROP THE WORD rather than substitute a
comparative** -- `the only one` traded for `among the fewest` is the same defect
at a lower volume.

_(sprint 65)_ These two sentences were deleted as redundant and the deletion
was followed, in the same sprint, by a new comment claiming an edit reddens
nothing when it reddens a perturbation record that predated the work. A full
suite run would have said so. **Restored, and the instance is the argument.**

**A dangling reference asserts nothing**, so a sweep for false sentences walks
past it — "the mapping asserted above", where no mapping is asserted above.
Deleting removes the pointer; amending leaves it. No detector is proposed: a
matcher deciding whether a reference still has a referent is a matcher over
prose content.

## When nothing changed: WITHDRAW to whatever grades it

_(sprint 81)_ **The ordering above is ENTERED THROUGH A CORRECTION** — its
heading scopes it to a fact having changed, and each arm is written over a
sentence being corrected: `corrected sentences`, `the claim was too wide`, `the
dead sentence`. A comment that is STILL TRUE and no longer worth its lines has
no entry point, so it stayed. Note that DELETE's stated reason is not that the
fact moved but that **a reader at that line never needed it**, which is this
section's reason too; what was missing was the trigger, not the argument. **The
fourth disposition: WITHDRAW — the claim holds, and something else already
reddens the day it stops holding, so the copy here goes and that one keeps it.**

**THE TEST IS NOT LENGTH, IT IS WHO GRADES IT, AND THAT IS MEASURED RATHER THAN
NAMED.** _(sprint 81)_ Run the perturbation the claim describes and read which
arms redden. MEASURED at the `Omit<T, K>` misspelling hazard in
`packages/tsudoi-language-server/src/notifications.ts`, taken at the base commit
and again on the narrowed text: the prediction written at planning named its
arms and its compiler diagnostic, and the reading returned an arm nobody had
named — one that stages an unbuilt checkout and runs `tsc` inside it, carrying
the type-level half into `bun test` after all. The withdrawal was right and the
argument offered for it was wrong about its own extent. **If nothing reddens,
the sentence stays**; a withdrawal to an arm that does not exist is a deletion
wearing a justification.

**WHAT MAY NOT BE WITHDRAWN IS THE PART A CODE EDIT WOULD VIOLATE.** That site
kept its `Omit`-versus-`Pick` asymmetry, its preference and its reversal
condition — nothing grades a preference, and the Lifetime Rule puts a decision
at the line the violating edit lands on. So the split is: the CONSEQUENCE
WALK-THROUGH goes to the arm that walks it, the DECISION stays. **And
over-deletion is invisible to the instrument that checks the withdrawal.** The
re-grep of the claim's words is what answers "is this list complete" — and it
cannot see that the surviving sentence stopped parsing without the clause you
took, because the words it greps for are exactly the ones you kept. Read the
survivor whole.

## Commit boundaries a comment decides

**WHEN FIX A'S COMMENT DESCRIBES THE STATE FIX B CREATES, A AND B ARE ONE
COMMIT.** _(sprint 54)_ This is a rule about commit boundaries and not about
care, because `be more careful` has four prior instances against it. MEASURED:
one-commit-per-finding, with the fixes ordered for cheapness, shipped a comment
claiming a pair the code did not have until the next commit — the FIFTH instance
of a comment asserting a mechanism the code denies, and the first whose cause
was the commit boundary rather than the author's attention. It was seen when
written and recorded rather than left, which is the behaviour to keep; the rule
is what stops it needing to be seen.

## Where a reason belongs — the Lifetime Rule

_(sprint 65)_ **First ask whether the reason needs a home in the tree at all.**
This rule answers WHERE a reason goes and was read as saying every reason goes
somewhere. Most do not. A measurement's home is the commit that took it; a
review finding's is the sprint record; a foreclosed alternative earns a line
only where someone would otherwise reintroduce it. Half this tree became
comments under the wider reading.

_(sprints 9, 40)_ A decision whose violation would be a CODE EDIT belongs in a
comment AT THE SITE where that edit would be made. One that shapes WHAT TO BUILD
NEXT belongs on the backlog item. One whose only home is a MACHINE-FORMATTED FILE
that cannot carry comments belongs in a TEST THAT ASSERTS IT — the file carries
the decision, the test carries the reason.

**WHEN THE REASON IS NOT A COMMENT, THESE ARE THE HOMES, AND THE FIRST THAT FITS
WINS.** _(sprint 81)_ The backlog item above is one of them; the rest:

- **AN ARM**, if something can grade it. It outranks the others because it is
  the only home that reddens the day the reason stops holding, which is also why
  a reason expensive to re-derive is mechanised rather than narrated.
- **THE COMMIT**, if it is a MEASUREMENT or a FORECLOSED ALTERNATIVE. A commit
  is past-tense and dated, so it cannot rot.
- **A SKILL**, if the discipline is applied while WRITING rather than while
  RUNNING. Nothing is running at the moment a sentence is typed, so there is no
  run for an arm to hook — this file is that case.
- **CLAUDE.md**, if a human needs it BEFORE running a command: a constraint that
  makes a green meaningless or a red expected.

In this tree, concretely:

- `tsconfig.json` and `packages/tsudoi-language-server/tsconfig.build.json`
  **may not carry comments**: `test/package-shape.test.ts` reads both with
  `JSON.parse`, and that file is where their reasons live.
- `package.json` cannot carry comments; `test/package-shape.test.ts` holds the
  reasons for the published surface.
- `bunfig.toml` **can**, so a comment satisfies the rule there — and declining a
  test is a DECISION rather than an oversight **provided the comment says plainly
  that nothing asserts it** and names the measured reason.
