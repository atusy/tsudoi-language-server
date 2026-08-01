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
fifth instance of the class)_ MEASURED: the staged-path pin still explains itself
by a compiler mapping that NO LONGER EXISTS ANYWHERE IN THIS REPOSITORY, so the
tree's one narrative account of how it resolves its own subpaths is false and a
contributor learns the pre-move story from the file that pins what is published.
Distinct from a stale COUNT: a value went out of date, a reason stopped being
true. **Nothing detects this class.**

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
`bun pm pack` inside a workspace member writes the tarball to the WORKSPACE ROOT.
Two defects behind one unexecuted block.

**Extraction here is MARKER-DRIVEN and nothing sweeps for what it missed.**
`test/helpers/readme.ts` matches exactly three markers (`quickstart`,
`examples-install`, `handler-pack`); a fenced block you add without one is not
run, and the document's own promise about itself goes false at that moment. If
you add a command to a README, add its marker or state in the document that the
command is never run.

## Where a reason belongs — the Lifetime Rule

_(sprints 9, 40)_ A decision whose violation would be a CODE EDIT belongs in a
comment AT THE SITE where that edit would be made. One that shapes WHAT TO BUILD
NEXT belongs on the backlog item. One whose only home is a MACHINE-FORMATTED FILE
that cannot carry comments belongs in a TEST THAT ASSERTS IT — the file carries
the decision, the test carries the reason.

In this tree, concretely:

- `tsconfig.json` and `packages/tsudoi-language-server/tsconfig.build.json`
  **may not carry comments**: `test/package-shape.test.ts` reads both with
  `JSON.parse`, and that file is where their reasons live.
- `package.json` cannot carry comments; `test/package-shape.test.ts` holds the
  reasons for the published surface.
- `bunfig.toml` **can**, so a comment satisfies the rule there — and declining a
  test is a DECISION rather than an oversight **provided the comment says plainly
  that nothing asserts it** and names the measured reason.
