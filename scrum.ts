// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). RAISED FROM 500 BY THE
// STAKEHOLDER, AND THE REASON THEY GAVE IS NO LONGER THE REASON IT
// HOLDS. It was raised because this dashboard carried the measured
// rulings and the reasons they were overturned. Those have LEFT for
// `.claude/skills/`, where they are delivered by the harness at the
// moment they apply instead of waiting to be remembered. What is left
// here is what only this file can hold: what is being built now, what
// was decided about it, and by whom.
//
// THE LIFETIME RULE, AND THE STAKEHOLDER HAS AMENDED IT. A decision may
// be compacted out of this file only into a home that OUTLIVES a
// context window: a permanent assertion, a comment at the site where
// the violating edit would be made, a PRODUCT BACKLOG ITEM, or a SKILL
// in `.claude/skills/`. `AN ACTIVE IMPROVEMENT` WAS ON THAT LIST AND IS
// STRUCK, and striking it is what made this compaction possible: while
// an improvement was itself a permanent home, keeping one active was a
// licence to compact something else INTO it, so nothing ever had a
// reason to leave and eighty-one accumulated across thirty-eight
// retrospectives with not one ever closed. THE STAKEHOLDER'S RULE THAT
// REPLACES IT: mechanise what will still be needed -- as a check if
// something can redden, as a SKILL if the discipline is applied while
// writing rather than while running -- and delete what can be kept
// without a mechanism, or whose breach is survivable and can be
// reconsidered when it next surfaces. WHY A SKILL COUNTS AS A
// MECHANISM, which is the half a reader will doubt: sprint 47 measured
// that attention pointed AT a class still missed an instance of it --
// but what failed there was MEMORY, a rule delivered once by having
// been discussed. A skill is delivered by the harness on description
// match. Sprint 47 refutes attention; it does not refute delivery.
//
// EVERY SPRINT RUNS THE `revise` SKILL AFTER THE DEVELOPER'S WORK, WITH
// NO PR. THE STAKEHOLDER'S STANDING INSTRUCTION, NOT A TEAM PREFERENCE,
// and it is attributed here because unattributed it reads as advice and
// is dropped in the next tidy-up. WHAT IT IS: multi-perspective review,
// then independent review, converged before acceptance. WHY IT IS
// WRITTEN HERE AND NOT IN `definition_of_done`: that field carries
// `{ name, run }` where `run` is A COMMAND LINE THE RUNNER SPAWNS
// DIRECTLY -- not a shell command, and the runner REFUSES one carrying
// shell syntax rather than misreading it -- so a skill name there would
// make this dashboard assert something no command verifies, and would
// now be refused outright. That is the exact failure this project keeps
// catching. Do
// not "fix" the gap by adding it as a check. THE LINE IT DRAWS: a
// criterion asserts a product property a perturbation can falsify;
// `revise` finds what nobody thought to assert. NO CRITERION MAY BE MET
// BY ARGUMENT AT REVIEW.
//
// THE FILING BAR FOR THAT ROUND, WHICH QUALIFIES THE INSTRUCTION ABOVE
// RATHER THAN STANDING ON ITS OWN. It is HERE and not in a skill --
// delivery by skill is the thing this project has measured failing under
// load -- and not in the round's own skill file, which lives outside this
// repository and would be invisible to this project's review of its own
// records. A FINDING RECORDED AS PRE-EXISTING NAMES BOTH COMMITS AND THE
// BYTE-IDENTITY RESULT AT THE SPRINT'S BASE, OR IT IS THIS SPRINT'S TO
// REPAIR. IT NAMES THE ITEM IT IS FILED INTO, OR IT IS NOT FILED. AND
// PREDATING IS NOT ITSELF A LICENCE: a finding inside the sprint's own
// subject is repaired here even when it predates.
//
// AND A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED. It stands
// beside the bar above and qualifies it the same way: a note reporting
// what reddened is a reading OF THE MOMENT IT WAS TAKEN and nothing
// more, so a perturbation whose result is going to be relied on later is
// written as a record THE SUITE RE-RUNS -- a weakening, a named arm and
// a required red -- or, when the weakening is a reading of something the
// arm already holds, as an assertion beside that arm. Prose may then say
// why; it may not be the whole of it.
//
// THE MEASURED FAILURE MODE IS NOT `NO PERTURBATION WAS RUN`: these
// records are full of them. It is that each was run ONCE and written up,
// in a file whose own header says a decision may be compacted only into
// a home that OUTLIVES A CONTEXT WINDOW -- and a note is not such a
// home. The compensator that was supposed to reach is the standing
// re-run, which carries its own measurement that nearly every earlier
// perturbation aimed at something that no longer existed.
//
// WHAT NOTHING CHECKS, SAID HERE SO THE BAR IS NOT MISREAD AS A GREEN: no
// check decides whether an arm HAS a record. That detector is refused by
// name -- its failure mode is a green certifying a class as watched --
// so the registry's silence about unrecorded arms is honest, and this bar
// binds the AUTHOR rather than the run. `The adjacent weaker reading` is
// a judgement nothing verifies either.
// ============================================================

const userStoryRoles = [
  "config author", // writes tsudoi.config.ts to stand up an LSP for their own language
  "editor user", // consumes that LSP from an editor (Neovim, VS Code, ...)
  "tsudoi maintainer", // maintains tsudoi itself
] as const satisfies readonly string[]; // Must have at least one role. Avoid generic roles like "user" or "admin". Remove obsolete roles freely.

const scrum: ScrumDashboard = {
  product_goal: {
    statement:
      "tsudoi lets developers assemble a Language Server for any language by writing a single TypeScript config file, without implementing the LSP protocol themselves.",
    success_metrics: [
      {
        metric: "An LSP for a new language can be stood up with a config file alone",
        target: "0 lines changed in tsudoi itself",
      },
      {
        metric:
          "The five methods the stakeholder named respond per the specification: textDocument/completion, textDocument/hover, textDocument/diagnostic (pull), textDocument/formatting, completionItem/resolve",
        target:
          "5 of 5. ENUMERATED IN THE METRIC ITSELF because `10 of 10` stood for thirty sprints with NOTHING ANYWHERE ENUMERATING THE TEN -- grepped, the only match was the metric. A fraction whose denominator nobody can name cannot be met, and the PO twice reported `2 of 10` as fact. The five were set by the stakeholder, not invented to make the metric satisfiable.",
      },
      {
        metric: "The CLI starts under both Bun and Deno",
        target:
          "Smoke start succeeds on both runtimes, both from a repo checkout and from an installed package",
      },
    ],
  },
  product_backlog: [
    {
      id: "PBI-81",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a reason ONCE, at the place that reddens the day it stops holding, rather than reconciling several copies of it that cannot",
        benefit:
          "the prose a reader must trust shrinks to the prose something is grading, and the rest stops being maintained at all",
      },
      acceptance_criteria: [
        {
          criterion:
            "A reason a test or the type system ALREADY GRADES is not also stated in the source it grades. Where both exist, the source copy goes and the arm keeps it. Where nothing grades it and a plausible edit would violate it, what survives in source is the INTENT, not the analysis behind it.",
          verification:
            "THE STARTING SITE IS MEASURED AND NAMED, so the sweep does not open by hunting for one. MEASURED AT 35b1e52 by grepping the claim's words -- `silent no-op` and `MISSPELL` -- and then reading each hit: the `Omit<T, K>` hazard, that `Omit` accepts a key outside `keyof T` and hands back T unchanged so a misspelling compiles at 0, is STATED at four sites and POINTED AT from a fifth. Three of the four statements sit against something that grades them: two spawned probes in test/notifications.test.ts bound to file and symbol, and the `BoundaryIsTheObservingMembers` set difference, which reddens with TS2344 under `tsc --noEmit` rather than under bun test. The fourth, in packages/tsudoi-language-server/src/notifications.ts, grades nothing. CLAUDE.md already names tests the enforcement layer, so which copy is the keeper is not a new ruling, it is the existing one applied.\n\nAND THE OBVIOUS REPAIR IS WRONG, WHICH IS WHY THIS IS THE STARTING INSTANCE RATHER THAN A TIDY ONE. The fifth site, further down the same source file, does not restate the hazard -- it reads `the silent no-op that type already documents`, inside a different argument about rebasing the `Omit` onto `Connection`. Deleting the statement it points at leaves a dangling reference, which `writing-a-comment` names as a class a sweep for false sentences walks past because it asserts nothing. So what this instance requires is that the POINTER'S REFERENT SURVIVE, and which disposition buys that is the Developer's: a narrowing that keeps the referent needs no edit at the fifth site at all, and an item mandating a re-point would have hard-coded work its own repair can make unnecessary. THIS WAS CAUGHT ON A SECOND PASS, from a grep line rather than from the file -- the skill's own finding that reading a hit is not reading its context. A SIXTH SITE RESTATES THE SAME PREMISE AND THE RE-GREP CANNOT REACH IT, so it is named rather than left to be rediscovered: packages/tsudoi-language-server/src/notifications.ts:264-267 spells neither key word.\n\nA REPAIR IS CHECKED BY RE-GREPPING THE CLAIM'S WORDS, NOT BY READING THE DIFF -- `git diff` answers did this change, never is this list complete, and this project has measured the two looking like one check at review. The `Omit` instance was found by grepping `silent no-op` and `MISSPELL`, which is the method, not the subject.\n\nWHAT MAY NOT BE BUILT, REFUSED BY NAME so it is not proposed as the obvious first move: a check that decides whether a comment is redundant with an arm. That is a matcher over PROSE CONTENT -- the same shape refused at PBI-77, at the exempt tag list, and at the dangling-reference detector -- and its failure mode is the one this project punishes, a green certifying the class as watched. Nothing will tell anyone this sweep is complete, and the item closes on the sites it names having been decided, not on the tree being certified free of duplicates.",
        },
        {
          criterion:
            "`.claude/skills/writing-a-comment/SKILL.md` carries a disposition for a comment that is STILL TRUE and no longer earns its lines, and a rule for where a reason goes when it is not a comment: an arm if something can grade it, the commit if it is a measurement or a foreclosed alternative, a skill if the discipline is applied while writing rather than while running, CLAUDE.md if a human needs it before running a command.",
          verification:
            "WHAT THE SKILL SAYS TODAY, READ AT 35b1e52: its ordering is headed `When a fact changes: delete, narrow, or supersede`. Every arm fires on a fact having CHANGED. A comment that is still true and no longer worth its lines matches none of them, so it has no exit and the file only grows -- which the skill's own sprint-65 paragraph states as a measured outcome: supersession `only ever grows the file`, half this tree became comments, one module reached 88%.\n\nTHIS CRITERION IS TEXT-PRESENCE AND ITS EFFECT IS NOT MEASURED, SAID HERE SO A GREEN IS NOT MISREAD: a skill file cannot redden, and no check decides whether the new arm is being applied. It binds the AUTHOR rather than the run, exactly as this dashboard's header says the perturbation bar does. What makes it more than advice is that the first criterion's sweep is the first application of it, in the same item.",
        },
      ],
      status: "ready",
      notes: [
        "THE STAKEHOLDER'S POSITION, ATTRIBUTED BECAUSE UNATTRIBUTED IT READS AS THE FACILITATOR'S TIDINESS PREFERENCE AND IS DROPPED IN THE NEXT TIDY-UP: why, MEASURED and the foreclosed alternatives mostly belong in the commit; if written in source at all, minimal; if anything survives it is the WHY-NOT, and even that as intent, with the detailed analysis re-derived when someone needs it. What carries the first half is that a commit is past-tense and dated, so it CANNOT rot: the `writing-a-comment` corpus of false prose exists because reasons were stored in a mutable present-tense location. NO CLAIM IS MADE HERE ABOUT COMMIT BODIES BEING BETTER THAN COMMENTS -- an earlier form of this note said so, over a tree nobody had read, which is PBI-77's class arriving inside the item filing its successor.",
        "THE ONE PLACE THE STAKEHOLDER'S POSITION IS QUALIFIED, AND IT DOES NOT REVERSE IT: re-derivation is neither free nor reliably correct. Sprint 79 measured two readings of one weakening saying opposite things, with only the pair naming the discriminator. That argues for an ARM, not for a comment -- so a reason expensive to re-derive is mechanised rather than narrated, which is the first criterion's ordering and not an exception to it.",
        "SCOPE, MEASURED AT 35b1e52 AND STATED AS A SCALE RATHER THAN A TARGET: 17264 of 41112 lines across 171 tracked .ts files begin with `//`, `/*` or `*` -- about 42%. THE KEY COUNTS LINES AND NOT COMMENTS, which bounds it: JSDoc continuation lines and any `*` opening a line are inside it. NO RATIO IS AN ACCEPTANCE CRITERION HERE, deliberately -- a ratio is met by deleting anything, including the arms' own reasons, and this project's convention against written counts is the same objection. The criteria above are about DUPLICATION and about a missing disposition, both of which name their subjects.",
        "WHY THIS IS NOT PBI-77 ARRIVING AGAIN. PBI-77 asked whether a claim is TRUE and closed on a sweep for claim shapes. This asks whether a true claim has ONE HOME and whether it is in the home that grades it. The `Omit` instance is the discriminator: not one of its sites is false, and every one of them is still this item's work.",
        "WHAT IT MUST NOT BECOME: a standing `less prose everywhere` item. It closes when the named duplication sites are decided and the skill carries the disposition -- not when the tree is certified minimal.",
      ],
    },
  ],
  completed: [
    {
      number: 80,
      pbi_id: "PBI-77",
      goal: "The last shape of the superlative sweep is the one a test can settle -- who actually reddens -- and PBI-77 closes with its keys written down.",
      status: "done",
      subtasks: [
        {
          test: "For each sole-detection claim, DELETE OR WEAKEN THE THING IT IS ABOUT and count the arms that redden. The claim is the count.",
          implementation: "Three narrowings. One claim held.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE KEY IS `is what <detection verb>` AND IT IS DECIDABLE FROM THE MATCHED LINE, which is why it was taken and `is what a/the/this` was not: a transitive detection verb makes the sentence a claim about a SET OF ARMS, and a reader can open that set by perturbing the subject. Nineteen hits tree-wide; the rest of the family turned out to be DISCRIMINATOR claims -- what tells state A from state B -- which are local and not quantifiers.",
            "ONE HELD: deleting the empty-contentChanges early return reddens EXACTLY the arm whose comment claims to notice it.",
            "THREE DID NOT, AND ONE OF THEM FAILED IN BOTH DIRECTIONS AT ONCE. `push(...batch)` made a plain push reddens the aggregating drive across both runtimes and the installed consumer -- and the cell calling itself the noticer IS NOT AMONG THEM. It locks the guard's own behaviour and nothing about the spread. A planted `exports` subpath reddens THREE arms with three different reasons, not the one equality assertion. Dropping `openClose` reddens TWENTY-TWO, because every capability arm in that file asserts the whole value.",
            "THE COUNTS ARE KEPT WHERE THIS PROJECT USUALLY REFUSES COUNTS, and the exception has a reason: what a reader trading one of these arms for another needs is HOW MANY WERE WATCHING. A count that goes stale here reddens nothing and misleads nobody, because the sentence beside it names the perturbation that produced it.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "PBI-77 CLOSES ON ITS OWN CONDITION: the shapes are swept once, each hit backed or narrowed, and the keys are written down. `X is the only Y` and `nothing anywhere does Z` went at sprint 66 under five keys over two file sets. The definite article doing the same work went at sprint 74 under `is what`, over the production layers. The detection family went here, tree-wide. `every W is V` is RULED rather than swept -- refused at sprint 74 with its reading, because quantifier-or-narration is not decidable from the matched line and a partition a sweep cannot make from the line is the class disposition this project has measured hiding live sites twice.",
        "WHAT IS NOT SWEPT IS STATED AS A NUMBER RATHER THAN LEFT OUT, and it is the condition the closure is honest under: `is what` in the test corpus reads 262, in test/fixtures/ 40, in the member tests 29, in the READMEs and CLAUDE.md 17, in the skills 12, in scrum.ts 59 -- taken at sprint 74's plan with one instrument. This closes because the SHAPES have been swept once, which is what the item asks, and NOT because the tree is certified free of them, which the item forbids claiming.",
        "THE YIELD ARGUES AGAINST TREATING THE CLOSURE AS A CLEAN BILL: three of four opened claims were false, and one was false about itself. The rate is what a reader should carry, not the closure.",
      ],
    },
    {
      number: 79,
      pbi_id: "PBI-70b",
      goal: "The sweep over the inherited corpus is decided on a measured cost and a measured yield, not on how it feels to leave it undone.",
      status: "done",
      subtasks: [
        {
          test: "Sample by a rule declared before looking, perturb each sampled arm to the adjacent weaker reading of its subject, and record what it cost and what it found.",
          implementation: "One repair, at the arm the sample found not holding.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE RULE WAS DECLARED FIRST: the first arm of each of the first root test files in alphabetical order that neither the registry names nor imports helpers/perturbation.ts. Two were taken to a reading.",
            "ONE HELD, CHEAPLY. Collapsing buildOrder to the alphabet reddens test/build-order.test.ts's first arm AND SIX MORE in the same file -- authoring about three minutes, the run one second. A record over it would be HELD with six collateral names.",
            "ONE DID NOT HOLD, AND FINDING THAT COST FOUR PERTURBATION STATES. test/build-diagnostics.test.ts asserts the failing file is named WITH its member, by `toContain` over the joined path -- which an ABSOLUTE path contains. Running tsc with an absolute `-p` from inside the member passes the arm while printing the reader exactly the string the arm's own paragraph refuses. Anchored to the line now; both invocations redden it.",
            "AND THE SAME SAMPLE MOVED A SECOND CLAIM: perturbing the CHECK's own cwd leaves that file green in every form tried. The line the arm reads is printed by `build` in scripts/workspaces.ts, which runs first. The arm is named for typecheck-workspaces.ts and held by the builder, and scripts/typecheck-workspaces.ts now says so where it makes the claim.",
            "THE FIRST TWO READINGS WERE UNREADABLE ALONE, which is the method's cost showing up inside the method: a green under `absolute -p from the member` and a red under `member-relative from the member` say opposite things about the same weakening, and only the pair names the discriminator. A one-state sweep would have recorded the arm as holding.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "IT CLOSES AS THE RECORDED DECISION ITS OWN NOTE AUTHORISED: GOING-FORWARD-ONLY SUFFICES. The corpus is 945 arms. The sample's cheap end is minutes per arm and its expensive end took four states over one assertion, so a full sweep is not a thing anyone finishes -- and the item's own note says its value DECAYS as the going-forward rule ages.",
        "THE YIELD IS NOT CLAIMED TO BE ZERO, WHICH IS THE PART THAT MAKES THE DECISION HONEST RATHER THAN CONVENIENT: one of two sampled arms did not hold, and its defect was real enough to repair. The reason to stop is COST, and a reader should expect the corpus to hold more of these.",
        "WHAT SURVIVES THE CLOSURE IS THE CHEAP HALF, ALREADY IN PLACE: the going-forward rule, the registry that re-runs what is recorded, and the class statement saying what it cannot hold. An arm sampled by anyone who has a reason to doubt it is a few minutes of work, and this record says what that looked like twice.",
      ],
    },
    {
      number: 78,
      pbi_id: "PBI-74",
      goal: "The one documented block whose lesson is that it does not compile is refused the day it compiles, naming the block and the members it was supposed to be missing.",
      status: "done",
      subtasks: [
        {
          test: "Compile the block in a probe that resolves the framework, and require the CODE and the three member names -- with the working snippet beside it as the pair, and a red earned for another reason as the refusal.",
          implementation:
            "test/readme-snippet-types.test.ts, reading both blocks out of README.md.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE DEGENERATE THE ITEM ASKED FOR, TAKEN FIRST: with DocumentView's three members made optional -- the edit that makes the documented mock valid -- the SHIPPED accounts read 33 pass / 0 fail. The account asks that a block's imports resolve and says nothing about its types, so the README would have taught a falsehood with every check green.",
            "`IT FAILS` IS NOT THE ASSERTION, WHICH IS THE ITEM'S OWN WARNING MADE CONCRETE. TWO other states redden this block and neither is the lesson: an unresolved specifier in an unbuilt checkout, and the bare `uri` a fragment spells, which is the reader's variable. The probe declares `uri` and the arm requires TS2739 plus lineCount, positionAt and offsetAt -- the three the block's OWN COMMENT lists.",
            "MEASURED IN BOTH DIRECTIONS. The optional-members edit reads 0 pass / 1 fail. Dropping the block's import so it fails for another reason ALSO reads 0 pass / 1 fail, on TS2451 and TS2552 rather than being accepted as `it failed, as promised`.",
            "AND WHAT IT DOES NOT CLAIM IS WRITTEN AT THE SITE: today's firing edit reddens `tsc --noEmit` too, in documents.ts's arms and with a message about assignability to TextDocument. What this adds is the DOCUMENT -- that red names a test file and a reader fixes the test file. The day DocumentView stops being handed where a TextDocument is wanted, the compiler goes quiet and this does not.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE `expect=error` MARKER THE ITEM DESIGNED AND DROPPED STAYS DROPPED, and the reason it was dropped is what this sprint had to solve rather than avoid: a marker declaring `this block fails` is satisfied by the ambient failure of an unbuilt checkout. What replaces it is not a marker at all -- one arm over one block, requiring the diagnostic the prose itself describes, in a probe where the ambient failure cannot occur.",
        "THE SCOPE THE ITEM FORBADE IS NOT TAKEN: no general snippet-compilation harness. Two blocks carry the marker, the arm knows which is which, and a THIRD reddens it rather than being graded by ordinal in silence.",
      ],
    },
    {
      number: 77,
      pbi_id: "PBI-72",
      goal: "The shapes the perturbation registry cannot hold are stated where the registry is, as a class, instead of once per file by whoever remembered.",
      status: "done",
      subtasks: [
        {
          test: "None -- four sites carrying one class, consolidated into the registry's own text.",
          implementation:
            "THREE MECHANISMS NAMED TOGETHER: the import `reRun` refuses, what the stage LACKS, what the stage GAINS -- with the disclosure that only the first is decidable from an arm file.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE OBVIOUS PREDICATE IS FALSE AND THE STATEMENT SAYS SO. `the arm file stages a tree of its own` holds of SEVENTEEN root test files, and test/definition-of-done.test.ts is one of them while its records re-run and report HELD. A class keyed on staging would refuse eleven files the instrument handles.",
            "AND THE THREE ARE NOT ONE MECHANISM WEARING THREE COATS, WHICH IS WHY THE STATEMENT DISCLOSES RATHER THAN RULES: the import is readable off the arm file and `reRun` throws on it; the other two are properties of the STAGE -- no `.git`, no build output, a directory name that is not this repository's, and a second resolution route the real node_modules hands back -- and neither can be decided by reading the file a record names.",
            "THE FOUR SITES KEEP ONLY WHAT IS LOCAL. own-subpaths says it is in the class on two mechanisms and points; readme-coverage names the one decidable mechanism; readme-layout keeps the split's own reason and points for the stage's properties.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "IT CLOSED ON THE CRITERION'S SECOND BRANCH RATHER THAN THE DISPOSITION ITS NOTES EXPECTED. The notes said it might close on `the exemption-at-the-site is the answer`; what the sprint did is the other thing, and the criterion's own words are met -- the class is stated in the registry's text and the sites point at it.",
        "THE STATEMENT'S FIRST CATCH IS ONE SPRINT OLD AND IT IS MINE. Sprint 75's new arm in test/suite-deadline.test.ts claimed that staging a tree of its own put it in the class. Measured false in this sprint's own first step, and narrowed at the site to what a reader can decide there: it does not import the instrument, and whether a record over it survives a stage is UNREAD.",
        "THE RESIDUE IS NAMED AND IS NOT SMALL: two of the three mechanisms remain undecidable from an arm file, so a future exemption still needs a person to measure which one applies. What the class buys is that they now know there are three and where to look, instead of finding out one file at a time.",
      ],
    },
    {
      number: 76,
      pbi_id: "PBI-80",
      goal: "The stakeholder's resolve request is a graded item rather than an absorbed one: what the path IS decides the answer, and a directory answers with the names it holds.",
      status: "done",
      subtasks: [
        {
          test: "Perturb the branch three ways and read WHICH ARMS redden, rather than reading a green suite as evidence the criterion is met.",
          implementation:
            "None -- the capability shipped in sprint 53. This item exists because the request had no home in this dashboard, and an ungraded delivery is indistinguishable from an unread one.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE CRITERION IS MET AND NOW HAS ITS READING. `resolvePathStat` in packages/tsudoi-completion-path/src/resolve.ts stats the path and, for a directory, renders the names it holds; packages/tsudoi-completion-path/test/resolve.test.ts holds 15 arms over it, TWO OF WHICH ARE THE STAKEHOLDER'S DISCRIMINATION BY NAME -- `a file whose item claims to be a folder is still answered as a file` and `a directory whose item claims to be a file still comes back with its listing`.",
            "NEVER LISTING READS 4 pass / 11 fail, naming the markup arms, both cancellation arms, the claims-a-file arm and all four bound arms. INVERTING THE LISTING BRANCH TO `isFile()` READS 4 pass / 11 fail, naming both discrimination arms. `2 pass / 13 fail` STOOD HERE AND WAS A DIFFERENT PERTURBATION: the replace hit `detailFor`'s own test as well, so the recorded number was of two inverted sites where the sentence names one. Caught by the second review stage. So the directory half is held from two directions and by name.",
            "AND THE THIRD PERTURBATION FOUND A CELL NOTHING HOLDS, WHICH IS THE ITEM'S ONLY DELIVERABLE IN CODE: listing UNCONDITIONALLY -- for a file as well -- reads 15 pass / 0 fail. `opendir` fails on a file, `listingOf` catches, and the answer is unchanged. THE KIND TEST IS A SAVED SYSCALL AND NOT WHAT KEEPS A FILE ANSWERING AS A FILE, and the line now says so, because no arm does.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "FILED AND CLOSED IN ONE SPRINT, DELIBERATELY, AND THE REASON IS THE GAP IT CLOSES. The capability was verified as delivered early in this session and no item was raised, so the dashboard carried no record that the stakeholder had asked for it -- and this file is the single source of truth. A request absorbed into `already done` leaves nothing anyone can re-read.",
        "WHAT IT IS NOT: a re-implementation. The one code change is a comment carrying a measurement nothing else in the tree holds.",
      ],
    },
    {
      number: 75,
      pbi_id: "PBI-71",
      goal: "A scratch file goes where this repository says to put one without joining the suite, and the runner and the sweeps cannot disagree about which directories those are.",
      status: "done",
      subtasks: [
        {
          test: "Plant a test file at each live site and read every check against it, rather than reasoning from configuration.",
          implementation:
            "None -- the measurement that decided which branch of the criterion to take.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE FILING WAS WRONG IN ONE DIRECTION: a SPAWNING `.test.ts` under a member's __ignored/ IS graded. `no member's own test spawns` reads every test file under a member AT ANY DEPTH and reddens naming it. `graded by nothing` was the premise and it is false.",
            "AND RIGHT IN THE ONE THAT DECIDES THE ITEM: the same file WITHOUT a spawn is read by nothing. Root `tsc --noEmit` exit 0, the per-member check exit 0, oxlint and oxfmt reporting no such file, the deadline sweep green -- and the root suite RAN it, 943 tests across 70 files where the tree reads 942 across 69.",
            "SO THE THIN GRADE IS NOT WHAT THE ITEM ASKED FOR, and closing on it was refused: an arm that reads one property of a scratch file is not the file being held to this suite's standards. What the story asks for is the OTHER branch -- that it not run.",
          ],
        },
        {
          test: "A staged tree with one FAILING test under each ignored segment: bun reports `0 test files matching`, and the same tree WITHOUT the key fails on both.",
          implementation:
            "bunfig's `pathIgnorePatterns`, plus the same segments pruned from both sweeps and an arm refusing a disagreement between the two spellings.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "`pathIgnorePatterns` AND NOT `path-ignore-patterns`, MEASURED IN THREE STATES because the first reading could not tell the two apart: the hyphenated form is the CLI flag's spelling and bunfig accepts it IN SILENCE, leaving the file running; the camelCase key removes it; the CLI flag is the control that the pattern itself matches. THE FIRST INSTRUMENT COUNTED MENTIONS OF THE PROBE IN A PASSING RUN and read 0 for all three -- excluded and ran-quietly are one reading there. Making the probe FAIL is what made the states separable.",
            "THE SEGMENTS ARE DECLARED ONCE AND CONSUMED TWICE, which is the shape this repository already uses for the fence reader: a TOML file holds no TypeScript and a walk takes no glob, so the spellings cannot be shared -- but an arm reads bunfig and refuses a disagreement. Removing the key reddens it; naming one segment on either side reddens it.",
            "AND THE SWEEPS HAD TO MOVE WITH IT RATHER THAN AFTER IT. `discoverTestFiles`'s docstring said probes under dist/ and __ignored/ DID run and were swept here BECAUSE they run there. The key makes that false, and a sweep left alone would demand `applySuiteDeadline()` of a scratch file bun never reaches.",
            "THE TEXT ARM ALONE IS SATISFIED FOR EVER BY A KEY BUN STOPPED HONOURING, which is why the spawning arm exists beside it. ITS NEEDLE IS bun's OWN WORDS AND WAS READ OFF A RUN RATHER THAN GUESSED: `Tests need ...` is what bun prints with no --cwd, and `0 test files matching` is what it prints with one. The arm was written on the first and repaired to the second by running it.",
            "IT STAGES A CHECKOUT OF ITS OWN, SO IT IS A FOURTH INSTANCE FOR PBI-72 and is filed there rather than left to be rediscovered: the perturbation registry cannot re-run a weakening whose arm file builds its own tree.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE CRITERION IS MET ON ITS FIRST BRANCH AND THE ITEM CLOSES. Both gitignored directories are out of discovery at any depth -- MEASURED, with a failing probe planted under a member's __ignored/ AND under a member's dist/, the root suite reads 69 files and neither runs. node_modules was already bun's own prune, so the three entries of .gitignore are covered by construction rather than by enumeration.",
        "THE ROOT __ignored/ LOSES A GRADE AND GAINS THE BRANCH THAT MATTERS. It was type-checked by the root tsconfig and swept by the deadline walk; it is now not run, and still type-checked. Nothing is worse off and the file no longer joins the suite, which is the capability the story asks for.",
        "THE CITATION ARM CAUGHT ITS FIRST LIVE CASE, one sprint after the grain moved. bunfig.toml's new paragraph cites a runtime and the file was ALREADY ACCOUNTED with one citation -- so a file-keyed list would have stayed green, and the citation-keyed one reddened naming the file. The grain move was argued from a criterion's wording; this is the reading behind it.",
      ],
    },
    {
      number: 74,
      pbi_id: "PBI-77",
      goal: "The definite article doing quantifier work is swept where sprint 66 could not see it, over a key and a file set declared before the search rather than after it.",
      status: "done",
      subtasks: [
        {
          test: "For each hit, OPEN THE SET THE SENTENCE QUANTIFIES OVER and read it against the code. Repair in the criterion's order: drop, then back by an enumeration at the site, then narrow to what was read.",
          implementation:
            "KEY `\\bis what\\b`, case-insensitive. FILE SET packages/*/src/*.ts (20), scripts/*.ts (16), test/helpers/*.ts (30) -- 66 hits, counted with `grep -icE` over `git ls-files` before any of them was read.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THIS KEY IS SPRINT 66'S OWN BLIND SPOT AND IT NAMED IT IN WRITING: that sweep's dominant repair turned `the only thing that notices it` into `what notices it`, roughly thirty times, which satisfies the criterion and is INVISIBLE to a `the only` key. The rule that these are one claim is already landed in .claude/skills/writing-a-comment/SKILL.md. So the key list was told to grow here; nothing had swept it.",
            "THE KEY WAS CHOSEN ON A READING, DISCLOSED RATHER THAN IMPLIED: 30 of the 36 hits in the first two sets were read before the key was fixed, and 20-odd were definite descriptions with an openable set. `every` was the other candidate and was REFUSED on the same reading -- 127 hits in those sets, mostly prose cadence (`every session`, `every child`), where deciding quantifier-or-narration needs the surrounding paragraph and not the matched line. A partition a sweep cannot decide FROM THE LINE is the class disposition this project already measured hiding live sites twice.",
            "THREE FALSE, AND THE DENOMINATOR IS SAID BESIDE THEM: 66 hits READ, about ten sets actually OPENED, three false. The rest fell out as identity or definitional uses -- `the derived promise is what is stored`, `WARM is what these rows are` -- and that fall-out IS decidable from the paragraph the hit sits in, which is the standard this project sets for a disposition.",
            "(1) test/helpers/build.ts said the URL form `is what every other helper uses`. FALSE OVER A SET OF TEN: `import.meta.dir` occurs in code nowhere -- spawn.ts's mention is a comment -- and TWO helpers use the URL form, while the other nine import `repoRoot` from spawn.ts and use no form at all. Repaired to the sentence spawn.ts already carries at the site making the same choice.",
            "(2) completion.ts called a size and a date per entry what `a directory of ANY SIZE cannot afford`. The instrument written to price exactly this says of itself that the refusal `stands on no figure at all`. Narrowed to `refused on no figure`, which is what was read.",
            "AND THAT REPAIR'S FIRST FORM EARNED A RED, NAMED HERE BECAUSE THE RULE WAS ALREADY IN THIS TREE AND I WALKED INTO IT: pointing at `scripts/listing-shapes.ts` from a SHIPPED module reads 941 pass / 1 fail -- `@atusy/tsudoi-completion-path: dist/completion.js names scripts/listing-shapes.ts`. A shipped module may not name a repository file its reader does not have. The form that stands names no repository file at all.",
            "(3) notifications.ts said what the gated-connection factory returns `IS THE SOLE CONNECTION-SHAPED VALUE IN startServer'S SCOPE`. FALSE: `withFallback` is a second binding inside that same function. The sufficiency argument it supports never needed it -- what would be conspicuous is a factory import nothing there needs -- so the claim is narrowed to `no WIDE connection is bound there`.",
            "SIX OPENED AND CONFIRMED, WITH THE READING RATHER THAN A TICK, because a sweep that files only its hits cannot be told from one that stopped early. Both handler index.ts files: `exports` carries one key and each package's own package-shape arm asserts the map WHOLE, so the claim reddens if a subpath is added. server.ts's `of the four fields read off this message`: capabilities, rootUri, rootPath, workspaceFolders -- `trace` is a Connection member and `processId` is a vscode-jsonrpc hazard, neither read off initialize by tsudoi. methods.ts's `the second is what excludes textDocument/diagnostic`: DocumentDiagnosticParams is WorkDoneProgressParams & PartialResultParams & ..., so the FIRST condition does not exclude it and the second does. tsudoi.ts's `a member added to Tsudoi and forgotten here does not compile`: a planted member reads TS2741 at tsudoi.ts naming it. config.ts's `nothing reddens if you hand import the bare path`: MEASURED, 942 pass / 0 fail with pathToFileURL removed -- a claim that had stood unread since it was written.",
            "test/helpers/ IS IN THE SET ON SPRINT 65'S MEASUREMENT, not for volume: in production code 8-9 of 10 comments restated what a test already held, and in the helpers it inverted -- readme.ts 24 weakenings with 9 catching nothing. The layer supporting the tests has no tests of its own, so an unbacked superlative there is held by the least.",
          ],
        },
        {
          test: "None -- the residue, measured at plan time so it cannot be assembled from what the sweep happened to reach.",
          implementation:
            "What this key does not reach, by area, on the instrument above: test/*.test.ts 262, test/fixtures/ 40, packages/*/test/ 29, READMEs and CLAUDE.md 17, .claude/skills/ 12, scrum.ts 59.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE TEST CORPUS HOLDS 262 OF THE 485 AND IS NOT SWEPT. Written as a number rather than left out, because silence over the largest area reads as coverage.",
            "SPRINT 66'S RESIDUE FIGURES ARE SUPERSEDED, NOT CONTINUED. Its `every` 276 was taken inside its own declared set with an instrument this record cannot reproduce; a tree-wide substring count today reads 901, and the two are not the same measurement. Placing them in one table would be the defect this item exists to refuse. Its five keys re-measured over its pass-1 set TODAY read `the only` 30, `nothing else` 27, `no other` 4, `nothing anywhere` 1, `always` 9 -- and that is a WORD count after that sweep, so it says nothing about how many claims remain.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE KEY DELIVERS A READER TO A PARAGRAPH, NOT TO A SENTENCE, AND THAT IS THIS SPRINT'S TRANSFERABLE FINDING. The third repair is over `SOLE CONNECTION-SHAPED VALUE`, which `\bis what\b` DOES NOT MATCH; the hit that reached it sat in the same paragraph. Sprint 66 recorded that a superlative's refutation is adjacent to it; this sprint measured that the FINDING is adjacent too. So 66 hits bought 66 PARAGRAPHS, and a future sweep's hit count means that rather than 66 sentences.",
        "A DATED PERTURBATION READING IS NOT A STALE CLAIM, ruled here rather than repaired: test/helpers/account-arms.ts carries `925 pass / 9 fail` where the suite now reads 942. It records what a named weakening produced, not what the suite is, and rewriting it to today's total would manufacture a reading nobody took -- which is sprint 73's provenance ruling applied to a number instead of a version. Read and left, named so the next sweep does not re-find it as a defect.",
        "PBI-77 DOES NOT CLOSE, on the same disposition sprint 66 took: what is discharged is one key over three declared sets, and the residue was measured AT PLAN TIME and committed before the sweep, so it cannot have been assembled from whatever the sweep happened to reach. The test corpus holds 262 of the 485 and is untouched.",
      ],
    },
    {
      number: 73,
      pbi_id: "PBI-73",
      goal: "Every runtime version this tree cites is listed in one place, so an upgrade has somewhere to read rather than a tree to grep.",
      status: "done",
      subtasks: [
        {
          test: "An unaccounted citation reddens naming it; an account with no citation reddens too; changing a cited version on the MACHINE reddens nothing.",
          implementation:
            "test/version-citations.test.ts -- a scan of the git index against a written list.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE COMPARISON BRANCH WAS REFUSED ON A PROPERTY OF THE TREE, NOT ON COST: nothing here declares a runtime version -- no `engines`, no `.tool-versions`, no `deno.json` -- so a comparison has NO SECOND SIDE that belongs to this repository and its red would be a property of whoever's laptop ran it. The compiler is the contrast and is why the asymmetry is real rather than an excuse: `tsc --version` IS compared, because the root manifest declares the version it is checked against.",
            "IT SHIPPED RED, AND THE MECHANISM IS THE ARM'S OWN INPUT. The scan reads `git ls-files`, so while the file was UNTRACKED it was invisible to itself -- and bun runs an untracked test file anyway. The Definition of Done read 942 pass / 0 fail with the file present as a TEST and absent as a SUBJECT, and it read 942 pass / 0 fail again once tracked, so no number moved to give it away. WHAT MADE IT RED was its own docstring illustrating a citation beside a false sentence, with a literal version.",
            "THE REPAIR WAS NOT AN ENTRY FOR ITSELF. An illustrative version here is a claim to the scan and to nothing else; an entry would have said this file cites a runtime when it does not. The prose spells no version now, which is FORCED rather than tidy.",
          ],
        },
        {
          test: "Plant a WRAPPED citation, and a `.json` one, in files the shipped filters could not see.",
          implementation:
            "`[\\s*]+` for prose wrapped inside JSDoc, and `.json` for the `//name`-style keys package.json carries instead of comments.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "BOTH HOLES HAD A PRESENT INSTANCE, WHICH IS WHY THEY ARE FIXES AND NOT WIDENINGS: `on bun\\n * 1.3.13` at test/readme-coverage.test.ts, and MEASURED on bun at both package.json files. A `\\s+` reader and a `ts|md|toml` reader were each green over a citation sitting in the tree.",
            "THE FORWARD CONTROL IS THE ONE THAT MATTERS AND IT WAS TAKEN: a wrapped citation PLANTED in an unaccounted file reddens naming that file. Reverting the widening and watching the account go unmatched only shows the list disagrees with the scan.",
          ],
        },
        {
          test: "None -- the label was measured to assert nothing, and the boundary it names to be unstatable.",
          implementation:
            "The grain moved from the file to the citation, and the `provenance | warrant` label was dropped.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE LABEL WAS HELD BY NOTHING: relabelling EVERY warrant as provenance reads 1 pass / 0 fail. And classifying all 25 sites, the boundary would not hold on two of them -- bunfig.toml's `setDefaultTimeout` reading and wordnet.d.ts's 127ms are the same shape and either label survives an argument. A label nothing asserts, over a boundary nobody can state, is prose with a type annotation on it, so it went rather than being multiplied by 25.",
            "THE GRAIN MOVED BECAUSE THE CRITERION SAYS `WHICH CLAIMS` AND THE FILE KEY ANSWERS `WHICH FILES`. Measured: 6 of 15 accounted files carry more than one citation, and test/resolution.test.ts carries FIVE -- where review's reading and mine both said three. A second citation inside a listed file was unseen, which is a claim going unlisted inside a list of claims.",
            "THE ENTRY SHAPE WAS FORCED BY THE SCAN READING THIS FILE. Spelled as one string, every entry IS a citation this file makes; the docstring sentence explaining that fact contained one and reddened the arm as it was written. Runtime and version are separate fields for that reason alone.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "A GREEN DEGENERATE IS UNREADABLE UNTIL THE PERTURBATION IS SHOWN TO HAVE APPLIED. Editing a cited version to one this checkout does not have read GREEN, and the reading was of a perl pattern that never matched. Re-run with `git diff --stat` asserted first, it is RED and names both versions. The suite was never wrong; the instrument had not fired, and nothing in a pass/fail count says which.",
        "AND THAT IS THE SAME SHAPE AS THE SPRINT'S OWN HEADLINE FAILURE, one level up: the Definition of Done ran an instrument whose subject was absent, and reported the number it would have reported either way. TWICE IN ONE SPRINT, over an arm whose whole subject is the difference between disclosed and covered.",
        "THE `lastIndex` RESET WAS LOAD-BEARING UNDER `.test()` AND IS DEAD UNDER `matchAll`, measured rather than reasoned, and deleted. A line that was correct when written stops being correct when the call beside it changes, and nothing reddens.",
        "WHAT THIS DOES NOT DO, SAID PLAINLY BECAUSE THE ITEM IS ABOUT EXACTLY THIS CONFUSION: it compares nothing. Every citation in the list is DISCLOSED and none is COVERED. What it buys is that the set is now a list a maintainer can read, and that editing prose to a version nobody ran is loud.",
        "THE COMMIT THAT SHIPPED IT SAID `the four untouched` WHERE THERE ARE THREE (README.md, hover.ts, wordnet.d.ts). Corrected here rather than amended away, because the message is the record of what was believed at the time.",
      ],
    },
    {
      number: 72,
      pbi_id: "PBI-63",
      goal: "What answers a member's specifier is read from the package that answered, and two documented pack routes landing on one path is refused rather than merely absent.",
      status: "done",
      subtasks: [
        {
          test: "Force each entry state against the shipped assertion and read what it prints -- the premise being re-measured is the item's own, taken at the move and never re-read.",
          implementation:
            "An arm following the entry with realpath and reading the target manifest's declared name.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE PREMISE WAS WORSE THAN FILED, NOT STALE. The move recorded `resolves to the wrong package` and `no entry at all` as BYTE-IDENTICAL; measured on a staged clone they are NOT SYMMETRIC -- a removed entry reddens three tests, and an entry pointing at THE SIBLING HANDLER reddens NOTHING, 5 pass / 0 fail. One of the two says nothing whatever.",
            "NEGATIVE CONTROL IN BOTH DIRECTIONS, because an arm never run against the no-entry degenerate reproduces the failure it exists to split: the wrong package fails naming what it resolved to, and a removed entry reddens it too.",
            "AND THE ARM'S OWN CLAIM ABOUT ITSELF WAS TOO WIDE, CAUGHT AT REVIEW. It said the target name tells tsudoi apart from `something shaped like it`. A directory holding ONLY a manifest with that name passes the whole file, and with a member's entry pointing at such a stub NOTHING reddens, because the root's route answers for tsc. It reads the NAME. It also does not subsume the isSymbolicLink arm and is not subsumed: a real COPY passes this and reddens that one.",
          ],
        },
        {
          test: "Resolve the documented pack routes to absolute paths from the same extractors the neighbouring arms use, and refuse two landing on one.",
          implementation: "An arm over the routes rather than a sentence about them.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE ITEM'S FIRST MEASUREMENT WAS DEAD AND IS QUOTED WITH ITS CAUSE. `a member pack and a root pack write THE SAME FILENAME TO THE SAME PATH` was killed by the rename of the checkout root to @atusy/tsudoi-workspace, made for an unrelated purpose.",
            "AND THE COLLISION IS STILL REACHABLE FROM ONE SIDE: the documented member form is `--filename tsudoi.tgz`, WHICH LANDS AT THE WORKSPACE ROOT and is what makes the READMEs install line one directory up resolve; the same flag at the CHECKOUT ROOT overwrites it with the workspace tarball -- every tracked file, and ZERO dist/ entries, which is what makes it fatal rather than merely wrong. The root form with the flag is documented nowhere, which is the whole of why the criterion reads met.",
            "THE ARM'S RESIDUE IS NAMED RATHER THAN LEFT: a route spelling ANOTHER package's default filename, beside a bare route in that package's own directory, both land on one path and this stays green. Review constructed it. What the arm does see is two bare routes in one directory, and any two --filename routes agreeing.",
          ],
        },
        {
          test: "None -- five documents stating a behaviour conditional on a flag none of them named.",
          implementation:
            "`bun pm pack` inside a member writes INTO the member; only --filename sends it to the workspace root. Narrowed at every site.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE SENTENCE WAS NOT CLAUDE.md's, WHICH IS WHY LOOKING THERE FIRST WAS THE WRONG MOVE. It is TRACKED at README.md, both handler READMEs, test/helpers/readme.ts and -- the site review found and the repair had missed -- .claude/skills/writing-a-comment/SKILL.md, the file about prose going false. Repairing the untracked copy alone would have reached one machine and left the document a stranger reads standing.",
            "AND THE HALF NOBODY GRADED NOW HAS AN ASSERTION: the arms checked the tarball IS at the root and never that it is ABSENT from the member, which is the clause every one of those documents states. Review measured that the new assertion has no reachable positive control -- bun refuses --filename with --destination -- so it is a forward guard against a runtime change rather than against a document edit, and it is recorded as that.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "A GREP THAT FINDS NO EQUALITY ASSERTION HAS NOT FOUND AN ABSENCE OF CONSTRAINT. I wrote that the root manifest's name is asserted nowhere and that renaming it back restores the collision with every check green. Both false: the bare packs share a filename and differ by DIRECTORY -- which my own re-measurement had named one sentence earlier and then dropped -- and the publish sentinel refuses two manifests declaring one name, 939 pass / 2 fail. The name is constrained as a NON-DUPLICATE rather than as a value.",
        "TWO OF THIS ITEM'S THREE RECORDED MEASUREMENTS WERE FALSE OF THE TREE, taken at the move and never re-read against what changed since. That is the third item in a row where the filing's evidence had been overtaken, and the shared shape is that each quoted a named code site whose behaviour moved while the prose kept pointing at the old one.",
      ],
    },
    {
      number: 71,
      pbi_id: "PBI-68",
      goal: "The two waits a test can park on with no message of their own say what did not happen, so a red in those files names the wait rather than a wall-clock number.",
      status: "done",
      subtasks: [
        {
          test: "Force each park by replacing the underlying promise with one that never settles, and read what the failure says. Then measure the headroom the new deadline leaves, quiet and under load, because a deadline that trades an anonymous park for a real flake is worse than what it replaced.",
          implementation:
            "waitForExit() and issue().response race a named rejection at 3000ms, inside the tightest per-test constant in the tree.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "WHAT THEY SAID BEFORE AND SAY NOW. waitForExit was `return this.#exited` -- no deadline, no message -- and issue().response only ever resolves, so a park in either failed as bun's anonymous `timed out after Nms`, naming neither the wait nor the request. FORCED: `the server did not exit within 3000ms`, and `no response to textDocument/completion (id 2) within 3000ms`, which gives a reader the method and the id.",
            "THE HEADROOM, MEASURED RATHER THAN ASSUMED, because this is the direction that would make the change worse than the defect. 202 waits observed across the whole suite on a quiet machine: SLOWEST RESPONSE 69ms, SLOWEST EXIT 95ms. Re-taken with eight spinners running at load 7: 67ms and 143ms. That is about twenty times the margin at the tail, against a 3000ms bound.",
            "THE ITEM'S OWN EVIDENCE WAS PARKED IN THE FIRST OF THE TWO: the arms that died at 4008ms against a 4000 test constant were `await session.waitForExit()`.",
            "AND THE OTHER WAITS WERE ALREADY BOUGHT, WHICH IS WHY THIS IS TWO SITES AND NOT EIGHT. The stderr wait throws quoting both what it waited for and what stderr did say; the write-failure, progress and pid waits do the same. Where an inner wait is 1000-2000 against a 6000 test constant, the inner one fires first and the constant is a backstop that normally never speaks.",
          ],
        },
        {
          test: "None -- a close attempt refused, and the reason it was wrong.",
          implementation:
            "The criterion's subject corrected from `a file that sets its own deadline` to `a test that sets its own deadline`, and the residue narrowed to the two unnamed parks.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "I GREPPED A WORD WHERE THE ITEM SAID IT HAD READ CALL SITES. `applySuiteDeadline()` takes no argument and sets one file-level default, so I concluded the eight per-file deadlines were gone and the item could close. THEY LIVE IN `test(name, fn, ms)`'S THIRD ARGUMENT AND ALWAYS DID -- the item's own note says it enumerated them by reading call sites RATHER THAN BY GREPPING A WORD, which is exactly the mistake it was warning against.",
            "AND SPRINT 54 STRENGTHENED THE PREMISE RATHER THAN REMOVING IT, which is the opposite of what the close attempt concluded. Before it the ambient was bun's 5000, so 6000, 18000 and 20_000 RAISED a ceiling; with the ambient at 25_000 all eight UNDERCUT it. The files record their own correction -- one says `BELOW bun test's DEFAULT` was false when written and is true again only because the suite now sets 25_000.",
            "THE PRODUCT OWNER REFUSED THE CLOSE ON A MEASUREMENT RATHER THAN ON A READING, and named what a green would have certified: nothing was edited, so all five checks would have passed while `hangTimeoutMs = 4000` sat at protocol.test.ts and the arms that died at 4008ms were still guarded by it.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THIS IS THE FIRST CODE CHANGE IN ELEVEN SPRINTS AND IT WAS MEASURED IN THE DIRECTION THAT WOULD MAKE IT HARMFUL. A deadline added to remove an anonymous park buys nothing if a legitimate wait can reach it; the reading that licenses it is the tail under load, not the mean when quiet.",
        "A REVIEW WAS CUT OFF BY AN API ERROR WITH ITS FIRST TASK -- the headroom -- UNFINISHED, AND THAT TASK WAS TAKEN RATHER THAN SKIPPED. An unrun check on the one axis that decides whether a change is harmful is not a check that can be deferred to the record.",
      ],
    },
    {
      number: 70,
      pbi_id: "PBI-66",
      goal: "The MEASURED label means the sentence is no wider than its reading -- rewritten where it is law, applied over a declared set, and with the item's own record swept for the class it is about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "A CRITERION IS CHECKED AGAINST THE POPULATION IT GOVERNS BEFORE THE SWEEP, NOT AFTER. This one was written from a sprint where all four parts were exactly right and would have greened three of the four failures it was filed on. What made that visible was measuring the population first -- 8 of 318 -- rather than starting to repair.",
        "RE-MEASUREMENT IS REFUSED AS THE REPAIR FOR THIS CLASS, and the reason is the class's definition: a subject error survives confirmation. Take the reading again, at any size, on either runtime, and the sentence is still false.",
      ],
    },
    {
      number: 69,
      pbi_id: "PBI-57",
      goal: "A citation in this tree names a file that exists, and the arm that cannot be mechanised is shown not to be rather than said not to be.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "USE VERSUS MENTION DECIDED FOUR SITES AND WAS GOT WRONG IN BOTH DIRECTIONS. Three sentences are ABOUT the bare spelling -- what tsc prints from inside a member, what a lint message must not say -- and qualifying them would make them describe something else, so they stay bare. Two in README.md sit inside backticks and were read as mentions on that ground alone; they say WHERE a thing is written, which is use, and they were qualified.",
        "THE BASELINE DID NOT REPRODUCE IN THE REVIEWER'S SANDBOX -- 13 failures at base and the identical 13 at head, all network-dependent pack and install arms. A delta against a red baseline is still a delta, and saying which failures are the environment's is what makes it readable.",
      ],
    },
    {
      number: 68,
      pbi_id: "PBI-71",
      goal: "The evidence PBI-71 was filed on is re-taken in the checkout it is about, and what the item still owes is stated at the sites that owe it -- rather than closed on a reading from a tree that is not this one.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE SPRINT'S DELIVERABLE IS THAT THE ITEM DID NOT CLOSE. Its filed evidence is corrected, its two live sites are named, and what it may close on is narrowed to a choice: narrow the criterion to the ROOT __ignored/, which the re-measurement satisfies more thoroughly than the filing knew, or keep the class as written with the two member-level sites as its subject. Neither is chosen here.",
        "A RE-MEASUREMENT THAT CONTRADICTS A FILING IS NOT A CLOSE. Both readings were taken in good faith and in different trees, and the second was narrower than it knew. What settles an item is the measurement that covers the criterion's own words -- `the directory this repository ignores` is a pattern, not a path, and reading it as a path is what made the close wrong.",
      ],
    },
    {
      number: 67,
      pbi_id: "PBI-78",
      goal: "A licence in this tree -- `X is done this way BECAUSE Y` -- has had its Y read against the code, and the ones that were never true are gone rather than softened.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "A REVIEWER'S FIRST PROBE CONFIRMED A FALSE SENTENCE AND THEIR SECOND REVERSED IT, which is the method working rather than a slip: the first measured `spawnSync` where the helper calls the async `spawn`. A PERTURBED INPUT THAT IS NOT IN THE PROGRAM YOUR ASSERTION READS CANNOT MAKE IT FAIL -- this record's own rule, arriving as a probe aimed at the wrong call.",
        "THE DISCRIMINATOR AGAINST PBI-62'S CLASS HELD UNDER USE. Two of the five were TRUE AT BIRTH and belong to the aged class rather than this one; three had no innocent story at all. The two repairs differ -- a stale reason is superseded, a never-true one is measured or deleted -- and knowing which was in hand decided each edit.",
      ],
    },
    {
      number: 66,
      pbi_id: "PBI-77",
      goal: "The superlatives this repository can reach by a declared key list are dropped, held or narrowed -- and what the key list cannot reach is measured and written down rather than left as the impression that the tree was swept.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "A REVIEW FINDING POINTED AT A SENTENCE AND THE TREE WAS WHAT HAD MOVED. test/definition-of-done.test.ts says this repository carries one deliberate warning and the run reported four; the cheap reading is that the record went stale. THREE OF THE FOUR WERE ESCAPES INTRODUCED AN HOUR EARLIER, IN THIS ITEM'S OWN PLANNING COMMIT. Repairing the sentence would have fixed the record into agreement with damage. WHICH SIDE MOVED IS THE FIRST QUESTION, not the last -- and the lint warnings do not gate, so that sentence was what detected it.",
      ],
    },
    {
      number: 65,
      pbi_id: "PBI-79",
      goal: "A reader opens any file here and reaches the code; what comments remain were kept because a measurement said no test holds them, not because someone thought they read well.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "TWO HOLES FOUND WHILE CUTTING, NEITHER THIS ITEM'S SUBJECT. The arm asserting that writeInThrowaway REFUSES the real checkout leaves planted.md in the real checkout when the guard fails -- a test guarding against writing into this repository writes into it on failure, and nothing cleans up. And a concurrent tarball install replaced node_modules/@atusy/tsudoi-language-server with an unpacked copy, breaking the workspace link and reddening resolution arms; `bun install` restores it, and the lesson is that tarball-handling work does not parallelise.",
        "COMMENTS CROSS-REFERENCE EACH OTHER, WHICH IS WHAT MAKES A CUT EXPENSIVE. Deleting a target dangles its pointer, and several were found already dangling before this work -- one cited a sentence absent from the tree at any point. Each cut swept for inbound pointers and repaired or deleted them.",
      ],
    },
    {
      number: 64,
      pbi_id: "PBI-76",
      goal: "A handler packed against a framework artifact that no longer matches the framework's source is a state this repository has MEASURED, BOUNDED and NAMED where the next maintainer meets it -- rather than one it can produce with two green commands and say nothing about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE DECIDING MEASUREMENT WAS TAKEN BEFORE PLANNING AND THE PRODUCT OWNER THEN FOUND ITS CONTROL WAS THE WRONG ONE -- from the METHOD PARAGRAPH rather than from any number, which is the reading this project's records say is worth more than a re-run. The corrected pair is stronger than the original, so the correction cost the sprint nothing and bought it the claim it can actually write.",
        "THE ENUMERATION THE PLAN ORDERED FIRST REFUTED THE PLAN'S OWN NOTE, AND THE REFUTATION IS KEPT WHERE THE NOTE WAS: `the handler packs in this tree are` named two sites and there are three, the missing one being `installConsumer`, which packs every handler root it is not asked to withhold, from where it lives, and is reached from the test files enumerated in that subtask's note. IT COST THE BRANCH NOTHING -- all three run after the `bun test` preload -- and it is recorded because an exhaustive claim written while filing an enumeration subtask is this backlog's own PBI-77 class arriving inside the sprint that ordered the enumeration.",
        "THE DECIDING QUESTION WAS ANSWERED AT A PRECISION NEITHER BRANCH OF THE PLAN OFFERED, AND THE PRECISION IS THE FINDING: a documented handler-pack route DOES exist, its prerequisite forecloses the UNBUILT case by name, and it says nothing at all about CURRENCY. So the document neither instructs the hazard nor forbids it, and rounding that to either of the plan's two branches would have bought a cheaper design on a false premise.",
        "TWO STRUCTURAL PROBES IN THREE SPRINTS TURNED OUT TO HAVE NO SUBJECT, AND THE PATTERN IS FILED RATHER THAN THE INSTANCES: an optional member added to a type nobody reads, and a required parameter added to a function type consumers may ignore. BOTH ARE `CHANGED THE TYPE` MISTAKEN FOR `CHANGED SOMETHING THE CONSUMER'S OWN CODE MUST SATISFY`. A structural probe is aimed at what the consumer WRITES, or it measures nothing.",
      ],
    },
    {
      number: 63,
      pbi_id: "PBI-62",
      goal: "Every reference in this tree to a mechanism the move took away is followed to its site and either repaired or shown to have none left -- from an enumeration of the removed mechanisms written before the search, with this item's own record ending the sprint saying what the tree says.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE PRODUCT OWNER GATED ARCHIVAL RATHER THAN ACCEPTANCE, AND THE GATE IS DISCHARGED. The transferable finding -- A CLASS DISPOSITION IS NOT A DISPOSITION, IT IS AN UNREAD SET WITH A REASON ATTACHED -- existed only in this sprint's own notes, which is the location this dashboard's header says compaction takes first, while the facilitator's report claimed it had landed where the next sweep's author would meet it. THAT SENTENCE WAS FALSE AT THE FILE AND IS THIS SPRINT'S OWN CLASS ARRIVING A THIRD TIME, in the report about the sprint. It now lives in .claude/skills/writing-a-test/SKILL.md's `## Sweeps` section, beside sprint 46's rule that a sweep for a matching-defect is an instance of its own class.",
        "THE RULE FORBIDS NOTHING, WHICH IS WHY IT WILL BE KEPT: a sweep of a hundred-odd hits that opens all of them is a tax rather than a discipline. A class may bound EFFORT and may not stand in for READING; a hit inside one is DEFERRED. THE ADMISSIBILITY TEST IS THE CHECKABLE HALF -- a class warrant holds only if the property defining the class is decidable FROM THE MATCHED LINE -- and it dissolves both of this sprint's failed warrants before either could hide anything, because both were properties of a site's MEANING and invisible in a grep hit. A SAMPLE PER CLASS WAS CONSIDERED AND REFUSED: it adds mechanism to a rule whose strength is that it forbids nothing, and an approximation that reads as coverage is the shape this project keeps refusing.",
        "PBI-62 STAYS RETIRED THOUGH THE SWEEP WAS MEASURED INCOMPLETE AFTER IT CLOSED, and the reason is that the criterion is a property of THE TREE and not of the process that reached it: all three later sites were reached by keys this sprint swept and all three are repaired here. THE KEY LIST WAS INDEPENDENTLY MEASURED ADEQUATE -- a reviewer re-derived it from the move's diff before opening this one's, had all thirteen plus five more, and all five found ZERO live sites. AND REOPENING WOULD REBUILD THE DROP BOX the split was paid to dismantle, on a finding whose actual subject is SWEEP METHOD rather than this item.",
        "THE CLOSURE CONDITION'S OWN WORDING WAS TOO WEAK AND THE PRODUCT OWNER OWNED IT: `each key swept` was written where the binding thing was `each enumerated mechanism swept`, as if one covered the other. The sprint executed those words faithfully and then noticed they permitted a gap. WHAT DISCHARGED THE CLAUSE WAS THE REVIEWER'S INDEPENDENT SWEEP AT ZERO LIVE SITES, NOT THE RECORDING OF THE GAP -- recording a gap discharges nothing, and the record is only how a later reader checks the sweep.",
        "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: the tree repaired and the record left stale. A sprint that supersedes the excluded directory, exits green on all five checks, and leaves this item's verification field still naming the staged-path pin as open would have certified the exact defect the item exists for, IN THE ITEM'S OWN FILE.",
        "`NOTHING ELSE FOUND` IS ACCEPTED ONLY WITH THE SWEPT KEYS WRITTEN DOWN. A coverage claim from a re-read is the shape this project has measured itself failing at repeatedly, and the keys are what make the claim checkable by someone who was not there.",
        "IN EXECUTION -- THE ONE REFUSED OUTCOME WAS THE FIRST THING PAID FOR, and the ORDER is the reason it did not happen: the record was followed before the tree was touched, so the sprint learned in its first hour that its own verification field named a site the move itself had repaired. Had the excluded directory been superseded first, the sprint would have exited green having certified the defect in the item's own file.",
        "IN EXECUTION -- KEYING THE SWEEP TO THE NAME IS VINDICATED BY FOUR SITES AND NOT BY AN ARGUMENT. Sprint 61's sweep was keyed to an EFFECT and missed two named sites; this one, keyed to the removed mechanism's NAME, turned up four more the record had never heard of, one of them a THIRD COPY of a sentence already superseded in two files. THE COROLLARY IS UNCOMFORTABLE AND IS RECORDED AS SUCH: a sentence repaired in two places was still shipping in a third, so `superseded in place` has been an incomplete repair in this tree twice now -- sprint 62 caught the same shape at review. The discipline that answers it is `supersede, do not amend` PLUS a sweep for the phrase, not either alone.",
        "IN EXECUTION -- THE SCOPE IS DERIVED AND THAT CHANGED WHAT THE ITEM COULD CLAIM. The closure condition allowed `the mechanisms already named` if the move's diff could not be recovered. It could: e8ddbcc. So the enumeration is what one commit deleted at the checkout root, and six of the thirteen sweep keys are lines from that diff rather than guesses -- which is also why the keys are auditable by someone who was not here.",
        "IN EXECUTION -- THE DEGENERATE PRODUCED THREE RESULTS AND THE SECOND RED IS WORTH MORE THAN THE ENTRY IT WAS AIMED AT. The type check is UNCHANGED, evidenced by sorted-identical `--listFiles` output rather than by an absent red; the literal pin reddens and measures nothing; and `the repo's tsconfig keeps dist out of the program` ALSO reddens, over a dist/ ITS OWN FIXTURE MANUFACTURES, in a repository where nothing writes a root one. Two arms that read like this decision's verification, neither of them observing it.",
        "WHAT THIS EXECUTOR DOES NOT DO, ON THIS DASHBOARD'S OWN PRECEDENT: the sprint is left `in_progress` rather than `review` or `done`, and it is not archived into `completed`. Execution finished; the `revise` round has not been run here and the executor is not the one who can say a review happened. PBI-62'S RETIREMENT IS THE EXCEPTION AND THE REASON IS IN THE PLAN: the close was subtask five's deliverable against a condition written before the work, not a reviewer's verdict.",
      ],
    },
    {
      number: 62,
      pbi_id: "PBI-75",
      goal: "The pack route stops carrying a harm nobody measured -- the item's premise is tested and retired, the three sentences in the tree that carry its implicature are superseded, and the ONE structural fact the retirement rests on gets something that reddens the day it stops holding.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "TWO READINGS OF `THE SAME` PERTURBATION DISAGREED AND THE DISAGREEMENT SURVIVES UNRECONCILED ON PURPOSE. A reviewer and the executor each rewrote a handler's emitted declarations away from the framework's specifier and each produced a FIVE-ARM LIST, and the lists are not the same five: the executor's includes THE ARM UNDER TEST and two manifest-string arms, the reviewer's includes two `to their real types rather than any` arms that stayed GREEN for the executor and omits the arm. ONLY ONE OF THE TWO HAS ITS SPELLING WRITTEN DOWN. IT WAS NOT RE-RUN, deliberately: a third number taken against a reconstructed spelling would be attributed to whoever did not take it, which is manufacturing evidence. AND THE EXECUTOR'S REFUSAL TO WRITE THE LIST THEY WERE HANDED IS ENDORSED BY NAME -- they were given the reviewer's five as an instruction, measured something else, and wrote what they measured. The opposite is what politeness produces. The general rule is in .claude/skills/recording-a-measurement/SKILL.md, because it binds the author at the moment of writing and a dashboard note would be compacted.",
        "THE DECIDING MEASUREMENT WAS TAKEN BEFORE THE SPRINT WAS PLANNED, deliberately, because the item made its design wait on it and planning ahead of it would have been discarded. It inverted the premise, so the sprint that was filed is not the sprint that would have been filed.",
        "THE PRODUCT OWNER NARROWED THE FACILITATOR'S OWN CONCLUSION AND THE NARROWING IS KEPT: the evidence supports CURRENCY, not strictness. It is recorded because it is the conclusion-wider-than-its-enumeration class arriving in a ruling's headline, which is the position where this project has measured it hardest to see.",
        "IN EXECUTION: THE ARM'S FIRST DEGENERATE NUMBERS WENT STALE INSIDE THIS SPRINT, and how they went is the finding rather than the correction. They were taken on the two-arm file, and the third arm -- the one that stops the degenerate being prose -- landed after them, so a paragraph in the tree described a run nobody could reproduce from it. Re-taken and SUPERSEDED, not set beside; this is the sprint whose whole subject is what an amended paragraph leaves behind.",
        "IN EXECUTION: ONE CLAIM IN THE FORECLOSURES WAS NEW AND WAS MEASURED HERE RATHER THAN INHERITED -- that a member's manifest reaches a registry with its `scripts`. Every other reading written into the tree this sprint is the deciding measurement's, carried across without being re-derived, which is what the plan asked for.",
        "IN EXECUTION: A UNIQUENESS CLAIM SHIPPED FOR THREE COMMITS INSIDE THE SPRINT WHOSE SUBJECT IS PROSE THAT OUTRAN ITS MEASUREMENT. The arm's header said the day an inlining transform lands `nothing else would say so` -- a coverage claim, which this project's rule says is measured or not written, and what else in the tree moves under such a transform was never read. Withdrawn IN PLACE at the arm, with the withdrawal visible, because a reader meeting only the narrower sentence cannot tell it from a claim nobody made. AND THE WITHDRAWAL WAS INCOMPLETE, WHICH IS THE PART WORTH MORE THAN THE ORIGINAL DEFECT: the same claim had been written into TWO FURTHER SITES in the same sprint -- this record's own arm note, and the retirement's home at `prepareWorkspace` -- and the withdrawal touched only the test file, so this very note asserted a repair the tree did not carry. Both survivors are now withdrawn in the same words. CAUGHT AT REVIEW AND NOT BY ITS AUTHOR, twice, which is the discriminator this project uses on this class.",
        "AT REVIEW: THE ARM'S PROVENANCE WAS FALSE AND ONLY RUNNING IT SHOWED SO, WHICH IS THIS SPRINT'S OWN CLASS ARRIVING IN ITS CENTRAL DELIVERABLE. The arm was believed on degenerates that pointed its READER somewhere else and never on a perturbation of its SUBJECT. Perturbed for real, it fires from a handler's `prepack` and stays green for the identical transform in the shared build path, because a top-level pack replaces both handlers' dist/ during module load. The cost claim was true; the provenance beside it was not, and no degenerate could have separated them.",
        "AT REVIEW: A COVERAGE CLAIM WITHDRAWN FOR BEING UNREAD WAS THEN READ, AND THE READING IS STRONGER THAN THE WITHDRAWAL IN BOTH DIRECTIONS. This closes a loop the sprint opened twice -- the claim shipped, was withdrawn incompletely, was withdrawn again -- and the lesson is that WITHDRAWING AN UNMEASURED CLAIM IS NOT THE SAME REPAIR AS MEASURING IT. The tree now carries which arms say so, which are disqualified as witnesses and why, and the spelling the list belongs to.",
        "AT REVIEW: TWO OF THE FOUR FINDINGS WERE PROSE THAT SURVIVED BECAUSE NOBODY RAN THE THING IT DESCRIBED -- the trailer's ground and the residual's addressee. Both are refuted by a single direct call or a single manifest edit, neither costing more than a minute, and both had been reasoned about instead. THE DISCRIMINATOR THIS PROJECT SHOULD TAKE FROM IT: a sentence whose subject is a function's behaviour is measured by calling the function, and a sentence about who reddens an arm is measured by reddening it.",
        "IN EXECUTION: A LINT WARNING WAS INTRODUCED AND REPAIRED IN THE SAME SPRINT rather than carried to review -- a refusal written inside a `finally`, which would have overwritten whatever the arm was already reporting. The Definition of Done reports warnings without gating on them, so the only thing that catches this is reading the run.",
      ],
    },
    {
      number: 61,
      pbi_id: "PBI-60",
      goal: "The unbuilt fourth check stops being a fact this dashboard remembers -- the state has a NAMED PRODUCER reached by two documented commands, the cover that hides it can redden, and the reason a handler builds against source is the reason the code actually has.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "The `revise` pipeline's second stage -- the codex MCP server -- has failed identically for a fifth consecutive sprint: `Failed to load Codex configuration from overrides: No such file or directory`.",
          impact:
            "Every sprint since it broke has been reviewed by stage one alone. That is not nothing -- stage one found this project's last several real defects, including sprint 60's central one -- but the second stage exists because a reviewer sharing none of the executor's context reads differently, and five sprints of single-stage review is a standing reduction in what review can catch.",
          request:
            "Repair or remove the codex MCP configuration. If it is not coming back, say so and the pipeline's second stage should be re-specified around something that runs here, rather than left as a step that is skipped every sprint.",
          status: "resolved",
          notes: [
            "RESOLVED AT SPRINT 80 BY RUNNING IT, NOT BY A CONFIGURATION CHANGE ANYONE HERE MADE. The server answers a minimal prompt with its reply, on both configured instances. NOTHING IN THIS TREE CHANGED, so what this records is that the failure was OUTSIDE the repository the whole time and that nobody re-tested it for several sprints -- the standing lesson being that a `waiting_human` impediment is owed a re-test each sprint, not only an escalation.",
            "Retried once per sprint with the same error text each time; nothing in this repository configures it, so there is no workaround from inside the tree.",
          ],
        },
      ],
      decisions: [
        "THE DEFINITION OF DONE AT THE END OF EXECUTION, TAKEN IN ONE COMMAND: PASSED, 935 pass / 0 fail across 66 files [121.75s], five [PASSED] at exit 0 each, warnings 1 -- the deliberate fixture warning, unmoved. The base reading was 934 / 0 across 65 files, five [PASSED], warnings 1, so the one added file is the arm and nothing else moved.",
        "THE SPRINT'S OWN STATUS IS `in_progress` AND NOT `review`, WHICH IS A SMALL FIELD WITH THIS DASHBOARD'S OWN PRECEDENT BEHIND IT: the previous sprint had to be repaired for closing under a status that described a state nobody was in. Execution finished; a review has not happened, and the executor is not the one who can say it did.",
        "A SITE THIS SPRINT WAS TOLD TO WRITE TO IS NOT IN THE REPOSITORY, AND THE RULING GENERALISES: `CLAUDE.md` is matched by a GLOBAL gitignore on this machine, so it is untracked here and prose landing only there reaches one checkout -- the same failure this sprint's first subtask names for this dashboard, one directory over. Where a durable home is required, the test is `git ls-files`, not `the file is in the working tree`.",
        "THE FACILITATOR OPENED A PRESSURE VALVE IN SPRINT 60 THAT WAS NOT THE ONE THE PRODUCT OWNER AUTHORISED, and the ruling is kept here because the distinction is the useful part: dropping the `expect=error` mechanism was a SCOPE CALL, which is the facilitator's to make, and it was ruled after the fact to have met no condition unmet -- the ruling it referred to was a ruling ON A MECHANISM, and when the mechanism left the ruling lost its referent. What would have made it a quiet narrowing is if the narrower account had not been disclosed to the reader. It was.",
        "FILING-ADJACENCY IS NOT A RANKING SIGNAL, stated as a standing rule because this dashboard just produced the instance. A condition filed at acceptance inherited the position of the item it came from and sat at rank two above nine live items. Rank is derived from consequence, and a low rank is written with the FIRING CONDITION that would raise it, so it is a decision with a trigger rather than a silence.",
        "A RANK MAY NOT BE DERIVED FROM A DEPENDENCY THAT CAN NEVER LAND. The tempting derivation here was `below the item that removes the ambient failure` -- and no such item will ever exist, since the ambient failure IS the source arm answering and deleting it is foreclosed with measurement. That derivation makes an item unrankable rather than low.",
      ],
    },
    {
      number: 60,
      pbi_id: "PBI-64",
      goal: "A reader of this repository's promise about its own documentation finds it true of every fenced block in every tracked README -- because a block nothing consumes is refused by name, and a block that is read rather than run says which part of itself the reading can fail on.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE PRODUCT OWNER NARROWED BOTH NEW CONSUMERS BEFORE EITHER WAS BUILT, AND OPENED THEIR OWN PRESSURE VALVE UP FRONT RATHER THAN AFTER THE SPRINT RAN LONG. The valve is the WIDTH OF AN ASSERTION and never an exemption, and under the narrowing no tag skips: the layout account's `holds` keeps one direction (the converse it says it drops is enforced anyway, by the mutation arm rather than by the row -- see the subtask note), the snippet account checks that each import specifier RESOLVES and does not compile the block, and `expect=error` semantics are out of this sprint entirely. The deciding evidence is in this dashboard: PBI-60 records an arm asserting `not.toContain(TS2307)` RECEIVING TS2307 beside the TS2322 it wanted, so a green that depends on `fails with code X and not TS2307` reddens for environmental reasons in this tree.",
        "THE PRODUCT OWNER SETTLED THE SUBJECT ON THE CRITERION'S OWN WORD -- `command block` -- AND THEN OVERTURNED THEMSELVES WHEN THE DEVELOPER SHOWED IT COLLIDED WITH TWO OF THEIR OWN RULINGS. Recorded because the reversal is the decision: a tag-exempt list cannot coexist with an arm requiring a ```text command block to be refused, and the exemption is what their own veto forbids. The widening is what is left once the word is read honestly.",
        "THE DEVELOPER'S FIRST DESIGN -- an account as reader-visible prose adjacent to the block -- WAS REFUSED AND THE DEVELOPER AGREED AFTER VERIFYING THE DECIDING FACT BY READING RATHER THAN RECOLLECTION. Kept here because the refused shape is the one a later executor will re-propose: it is satisfied by an author's intention, which is the defect the item names.",
        "WHAT SURVIVED FROM BOTH PLANS INDEPENDENTLY, which is why it is not argued below: the class is tracked READMEs read from git and not the member enumerations. Two routes reached it for the same reason.",
      ],
    },
    {
      number: 59,
      pbi_id: "PBI-67",
      goal: "A user highlighting a directory waits no longer for its detail than under the shape this package replaced -- on whichever runtime their editor runs -- or the wait they now pay is written down with its number and the runtime that bears it.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "REVISE ROUND TWO, NINE FINDINGS, ALL FIXED AT THIS BASE, AND THE COUNTS MOVED FOR ONE REASON. Baseline before the first edit, unpiped `bun run scripts/definition-of-done.ts`: 897 pass / 0 fail / 2725 expect() across 61 files, five [PASSED], warnings 1. At the last commit below: 898 pass / 0 fail / 2742 expect() across 62 files, five [PASSED], warnings 1. THE FILE AND THE TEST ARE test/instrument-copy.test.ts and the 17 further expect() calls are its 15 plus the two the gate arms gained; nothing else moved. Environment: bun 1.3.13, deno 2.8.3, tsc 7.0.2, darwin arm64.",
        "FOUR OF THE NINE WERE THE SPRINT'S OWN PROSE FAILING THE RULE THE SPRINT EXISTS TO APPLY, which is worth naming as a pattern rather than leaving as four repairs: a superlative the sprint's own null cell refutes and which propagated from the dashboard into the module; a perception claim retired in one paragraph and re-made in the declarative in another; a generalisation about guards that swallowed the two cells it was least true of; and a degenerate's recorded output that the tracked instrument cannot produce. THE COMMON SHAPE IS THAT EACH READS AS A DISCLOSURE. A sentence that says `no claim is made here`, `filed as suspect`, `a shape that read nothing cannot report a fast row` or `written before the run` buys the reader's trust in the same breath it spends it, and this sprint's own reviewers read past all four. What separates them from the ordinary error is that RE-MEASURING DOES NOT CATCH ANY OF THEM: the numbers were right every time.",
        "A RECORDED RULING IS A LEGITIMATE CLOSE HERE -- the criterion licenses it -- AND IT NEEDS SIX THINGS OR IT IS A SHRUG: a number per runtime at the ordinary size for both shapes, taken at this base by ONE instrument in ONE session; who pays and how much as a SIGNED DELTA rather than a direction word; what the shape still buys after the transient-allocation reading, per runtime, in the terms it was adopted for; A FIRING CONDITION, the observation that would reopen it, since a ruling that cannot age is folklore; landing AT THE SITE and not only in the dashboard; and SUPERSEDING rather than layering.",
        "`THE DIFFERENCE IS IMPERCEPTIBLE TO A USER` IS REFUSED AS WRITTEN, AND THIS IS THE ITEM WHERE IT MUST BE. It names no quantity, no threshold and no observer, so no measurement can contradict it -- the superlative class. And it is the subject-error class exactly: a number would be taken in milliseconds while the sentence's subject is PERCEPTION, which the number does not measure. Shipping it in the sprint whose whole business is a measured claim would be the class arriving inside its own repair, which this backlog has recorded happening twice.",
        "TWO HONEST NEIGHBOURS ARE ADMISSIBLE INSTEAD: the delta placed against a NAMED BUDGET WITH ITS OWN PROVENANCE -- this runs once per HIGHLIGHT on an idle moment, never per keystroke -- or a perception claim made the way this package has already made one, naming the editor, the plugin chain and the setting it was measured in AND disclosing that the measurement is not in this suite and no red here catches its regression. A claim naming an editor, a harness and what it cannot catch is admissible; one naming none of the three is not. IF NEITHER IS OBTAINABLE HONESTLY, THE RULING DROPS THE PERCEPTION CLAIM and stands on the working set -- declining to claim what was not measured is a close; claiming it anyway is the shrug.",
        "A PER-RUNTIME BRANCH IS REFUSED OUTRIGHT, EVEN WITH EVERY CHECK GREEN, and the story sentence invites it. THE SAME INSTALLED ARTIFACT RUNS UNDER BOTH RUNTIMES, and every platform decision in this package is ASKED rather than branched on -- a runtime sniff is that defect in another coordinate. AND THE TWO SHAPES DO NOT SHARE A CANCELLATION STORY: two shapes means two seam analyses, two leak stories and two abort placements, OF WHICH ONLY ONE IS EXERCISED ON ANY MACHINE ON ANY RUN, so half the shipped code is graded by nothing in any given Definition of Done.",
        "A RUNNER-UP IS NAMED SO IT IS NOT REACHED FOR: keeping the current shape by DELETING THE PARAGRAPH THAT RECORDS WHAT IT COSTS. The cost paragraph is the evidence, and a green suite over a shorter docstring is a shrug that reads as a close.",
        "THE SPRINT RUNS SINGLE-STAGE AGAIN. The reviewer that failed twice is still `waiting_human` and is NOT re-escalated here; no claim about finding density may rest on the count of readers.",
        "PO ACCEPTANCE: ACCEPTED WITH CONDITIONS, AND PBI-67 CLOSES WHEN THEY LAND -- in this sprint, as docstring edits, with no re-decision and no new reading. THE CRITERION FIRST: `the shape is chosen against a reading taken on BOTH runtimes at the sizes this package calls ordinary, and no runtime pays a regression at those sizes for a benefit that appears only on the other`, whose verification licenses `a recorded ruling naming which runtime pays and why`. The reading exists, was taken on both runtimes in one session by a tracked instrument, and an INDEPENDENT RE-RUN reproduced it -- deno -3.366 against -3.261, bun +0.471 against +0.460, open-alone 2.438 against 2.402, all three inside this instrument's own null. That reproduction is worth more here than one more digit: the ruling's third firing clause IS a re-run, so a reading nobody else can take could not have aged.",
        "THE SIX CONTENTS I SET FOR A RECORDED RULING, JUDGED ONE AT A TIME. (1) A NUMBER PER RUNTIME AT THE ORDINARY SIZE FOR BOTH SHAPES, ONE INSTRUMENT ONE SESSION -- MET: 2.080/2.528 on bun, 9.619/6.374 on deno, with a null cell establishing what the instrument itself cannot separate, which is more than I asked for and is what makes the other five readable. (2) WHO PAYS, SIGNED -- MET: deno +3.261 and +4.157, bun -0.460 and +0.601, each against a named alternative rather than a direction word. (3) WHAT IT STILL BUYS, PER RUNTIME, AFTER THE TRANSIENT-ALLOCATION READING -- MET IN FORM AND CARRYING C1: the sentence that decides it is stated of the whole scan and measured at the open. (4) A FIRING CONDITION -- MET IN FORM AND CARRYING C2: three clauses, and the observation most likely to fire is not among them. (5) AT THE SITE -- MET, in the module's own docstring. (6) SUPERSEDING RATHER THAN LAYERING -- MET, the paragraph is rewritten and the stack of three corrections is gone. THE CONDITIONS ARE ON (3) AND (4), PLUS TWO REPAIRS TO THIS RECORD'S OWN PROSE, AND ALL FOUR WERE WRITTEN INTO PBI-67 AND NOWHERE ELSE, WHICH HELD UNTIL THE ITEM CLOSED ON THEM -- they landed, the item left the backlog, and the closing decision below is where they are now. Neither blocks acceptance; both block a clean close, because a ruling whose basis is stated wider than its evidence is the class this sprint spent nine findings on. THIS JUDGEMENT IS THE ONE TAKEN AT ACCEPTANCE AND IS LEFT AS IT WAS READ THEN: (3) and (4) have since been narrowed and extended, which is what the conditions asked for, so the sentences it grades are no longer the sentences in the module.",
        "THE THIRD SHAPE WAS FASTEST AND WAS NOT TAKEN, AND ON MY OWN CRITERION THAT IS RIGHT -- BUT NOT BECAUSE THE CRITERION SELECTED IT. My words refuse ONE CONFIGURATION: a runtime paying a regression at the ordinary sizes for a benefit that appears only on the other. The third shape trips nothing in it -- it is faster on both at five thousand and at the tail -- and the shipped shape trips it only if the inversion fails, since the bound it buys lands hardest on DENO, the runtime that pays. So the criterion is SILENT BETWEEN THE TWO, and the tiebreak that decided -- working set, plus a second cancellation seam that shape deletes -- lives outside it. The call I endorse is the one the branch rule fixed IN ADVANCE and the sprint honoured: decide on what is held, not on the clock, and route rather than delete an arm defending an accepted criterion. WHAT I WILL NOT LET STAND IS `the criterion selected this shape`. It did not, and the honest consequence is C1: a shape faster on both runtimes may not be refused on a premise stated more strongly than the reading behind it.",
        "A TENTH FINDING, FOUND AT ACCEPTANCE AND OF THE SPRINT'S OWN CATALOGUED CLASS -- IT IS IN THIS DASHBOARD AND NOT IN THE MODULE, WHICH IS WHY THE ROUND OF NINE MISSED IT. The predictions note says ALL EIGHT HELD, and one did not hold as stated: `the ranking on bun FLIPPING WITH SIZE (readdir+sort faster at 200, slower at 5000 and at the tail)`, repeated in the repair subtask as `the ranking on the faster runtime FLIPS WITH SIZE`. At two hundred on bun that row is -0.021 inside a null of +0.001 (-0.036..+0.016), and TWO OTHER NOTES IN THIS SAME RECORD SAY SO. It is the superlative finding again, read off a median sign across a null the record itself draws -- and it is load-bearing where it appears, since it is offered as the reason one number per runtime could never have settled this. NARROW BOTH SENTENCES AND THE `ALL EIGHT HELD`: what the reading establishes is that bun does not separate the shapes at two hundred and prefers streaming at five thousand and the tail, while deno prefers the array at every size -- the runtimes DISAGREE WITH EACH OTHER, which carries the same conclusion without a flip. THE PREDICTION LIST IS THE ONE CLAIM HERE A READER CANNOT CHECK, by its own admission, so its accounting of which predictions held is the whole of its warrant. IT WAS CARRIED AS C4 IN PBI-67 AND THIS ENTRY IS ITS PROVENANCE, NOT ITS INSTRUCTION -- what gated the close was written in one place, and that place has closed with the item. WHAT C4 BECAME is the repaired accounting in the predictions note above and the narrowed sentence in the repair subtask, both at 7a86eb0.",
        "WHAT THIS SPRINT OWES THE BACKLOG, ROUTED RATHER THAN LISTED. FILED AS PBI-73: a ruling whose firing condition nothing detects, plus a tracked instrument nothing runs -- with the non-timing smoke run named there as the move that does NOT reopen this sprint's wall-clock refusal, and with the honest alternative (nothing should watch this) in the item. FILED INTO PBI-66: the sprint's own fourth-term instance, correct numbers under a wrong subject, self-caught and recorded as a contradiction. CARRIED INTO THIS RECORD ON THE CLOSE, HAVING READ `INSIDE PBI-67 RATHER THAN OUT` UNTIL THE ITEM LEFT: the retired sprint-53 starting evidence, and the note that a reopened re-decision needs a RETENTION criterion, since this instrument reads wall-clock only and `what is held` was argued from a signature and from INHERITED readings on both sides. Both are in the closing decision below. `Inside the item` STOPPED BEING A HOME THE MOMENT THE ITEM CLOSED, which is this dashboard's own lifetime rule catching a routing that named a container rather than a permanent home. STILL OPEN AND NOT FILED, BECAUSE THE MODULE NOW SAYS IT AT ITS SITE: the 777-859 ms abort-seam durations and the turn count the seam's argument actually rests on, neither re-taken. NOT ROUTED AS AN ITEM AND WORTH THE RETROSPECTIVE: four of nine, plus this tenth, were sentences that READ AS DISCLOSURES -- and re-measuring catches none of them.",
        "PBI-67 IS DONE AND HAS LEFT THE PRODUCT BACKLOG, THE FOUR CONDITIONS HAVING LANDED. C1 and C2 at the module and here, f4e20af and 7a86eb0; C3 -- the criterion's silence between the two shapes -- beside the ruling at 7a86eb0; C4 -- the flip claim and the `all eight held` that counted it -- at both its sites in the same commit; and the sprint-53 numbers retired at 36e2799. THE CRITERION IS MET BY THE ROUTE IT LICENSED, a recorded ruling naming which runtime pays and why, and NOT by a shape that costs neither runtime at the ordinary size: deno pays 3.261 ms per highlight at five thousand entries, signed, at the site. Definition of Done at the close, unpiped `bun run scripts/definition-of-done.ts`: 898 pass / 0 fail across 62 files, five [PASSED], warnings 1 -- unchanged from the baseline these edits started at, which was predicted before them, the named counterfactual being a directory-qualified path in the shipped docstring reddening test/packed-members.test.ts.",
        "TWO THINGS CLOSE WITH THE ITEM RATHER THAN BEING FILED OUT OF IT, BECAUSE THEY BELONG TO THIS DECISION AND TO NO OTHER. FIRST, THE ITEM'S OWN ACCEPTANCE CRITERION CITED STARTING EVIDENCE THIS SPRINT FALSIFIED: `45 to 127 ms at five thousand entries` and `1289 to 1977 at a hundred thousand`, taken in sprint 53 AFTER the shape was already chosen, from the session whose every re-taken figure this base contradicts. The same nominal sizes and the same two runtime versions read 6.374/9.619 and 138.507/204.036 on the tracked instrument. THEY MAY NOT BE CITED AGAIN. What survives re-taken is the DIRECTION and not the magnitude -- streaming is slower on deno at every size read, and the regression lands on the size this module's own premise calls ORDINARY -- and what does NOT survive is `bun improves at both` as a reading of the small size, where bun does not separate the shapes at all. A criterion carrying numbers its own sprint retires is the fourth-term failure read at the place it is authored rather than at the place it is measured.",
        "SECOND, AND IT IS THE INSTRUCTION FOR WHOEVER REOPENS THIS: A REOPENED RE-DECISION NEEDS A RETENTION CRITERION WITH A MEASUREMENT BEHIND IT, NOT A SECOND TIME CRITERION. This sprint's instrument reads WALL-CLOCK ONLY, so `what is held` -- the tiebreak that actually decided -- was argued from a SIGNATURE and from INHERITED memory readings on both sides. That is why the likeliest of the ruling's firing clauses, deno's `Dir` materialising once iteration starts, is one nothing in this sprint can answer: it is a retention question put to an instrument that measures time. A re-decision taken on a re-run of the same instrument would settle the cost and leave the reason untouched.",
      ],
    },
    {
      number: 58,
      pbi_id: "PBI-60",
      goal: "The unbuilt-artifact flip stops living in prose: either the compiler NAMES THE FILE IT COULD NOT READ, or the cost that prevents that is a check which reddens the day the cost is gone.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "codex could not be run, so this sprint has had ONE review stage. The same configuration error, two sprints running.",
          impact:
            "Every finding this sprint acted on came from one reviewer. A second stage is what has historically found the class the first misses, and its absence is a gap in the evidence rather than a claim that none remain -- so the sprint's greens say what one reading of them says and no more.",
          request:
            "Repair the codex configuration, or rule that one review stage is the standard for this repository so the expectation stops being restated per sprint.",
          status: "resolved",
          notes: [
            "RESOLVED AT SPRINT 80 BY RUNNING IT, NOT BY A CONFIGURATION CHANGE ANYONE HERE MADE. The server answers a minimal prompt with its reply, on both configured instances. NOTHING IN THIS TREE CHANGED, so what this records is that the failure was OUTSIDE the repository the whole time and that nobody re-tested it for several sprints -- the standing lesson being that a `waiting_human` impediment is owed a re-test each sprint, not only an escalation.",
            "FILED AT THE MOMENT AND NOT AT CLOSE, which is what the product owner required last sprint: recorded as a decision after the fact it reads as a choice this sprint made, and it is neither a choice nor this sprint's to make.",
            "NO COMPENSATION WAS ATTEMPTED. Inventing findings to stand in for the missing stage would put unmeasured work beside measured work with nothing separating them, which is worse than the gap.",
          ],
        },
      ],
      decisions: [
        "THE CITATION IS LEFT UNASSERTED RATHER THAN PROPAGATED: the facilitator's tasking called this the residue one sprint shipped open and the item's own note names a different one. Neither is asserted here -- it is THE RESIDUE THE MOVE SHIPPED OPEN -- because this record has a case of a number standing unchallenged for thirty sprints, and a wrong one repeated is the failure it punishes.",
        "BRANCH TWO IS AN ACCEPTABLE CLOSE ONLY WITH ALL FOUR: the deletion was TAKEN and not reasoned about; the blocker is NAMED TO A FILE -- which specifier, in which file, read by which reader, failing with what text, in which state -- because `something would break` is not a cost and neither is a count; the blocker is recorded AS A RE-RUN and not as a note, since this dashboard's header says a perturbation recorded only as prose is not recorded; and the residue's prose does not multiply, every surviving copy carrying the POST-move measurement.",
        "AND IT IS NOT THE TEST THE ITEM REFUSES -- SAY SO AT THE SITE OR A REVIEWER WILL FILE IT AS ONE. The refused test asserts THE RESIDUE and would pass for as long as the residue persists, specifying it. The permitted record asserts THE BLOCKER and stops holding the moment the blocker does. Opposite failure directions, and that asymmetry IS the terminating mechanism: branch two ends with the decision reopening itself, unattended.",
        "FAILURE TO DELIVER REGARDLESS OF TREE COLOUR: the arm kept and the output is better paragraphs; or the cost quoted from the pre-move layout; or the deletion never attempted. AT REVIEW THE PO ASKS ONE QUESTION -- what did the deletion produce, byte for byte -- and no answer is a failure.",
        "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: the arm deleted, the absent state staged and diagnosing, THE PARTIAL STATE NEVER STAGED, and the prose warnings deleted as fixed. The criterion names both states because the pack window is the one a person actually stands in, and absent-only is the shortcut a green tree cannot catch -- removing the warnings on evidence covering one state converts a NAMED residue into an UNNAMED one, which is strictly worse than shipping it open again. The same refusal covers a diagnostic MANUFACTURED by a mapping or a project reference: there is none anywhere now, a refusal enforces it, and an error produced that way grades a resolution no stranger performs.",
        "PBI-60 DOES NOT CLOSE, AND THE PRODUCT OWNER CALLED THAT THE HONEST OUTCOME RATHER THAN A SHORTFALL. The SPRINT GOAL'S second disjunct is met -- the cost that prevents the diagnostic is now a check that reddens the day the cost is gone -- while the ITEM'S criterion, which asks what reads the artifact to NAME A FILE, is not: a bare `tsc --noEmit` on an unbuilt checkout still answers the framework's own subpaths from source at exit 0. The item is RE-NARROWED to exactly that, carrying the five cells verbatim and BOTH foreclosures, rather than closed on the disjunct or left whole.",
        "BOTH ACCEPTANCE CONDITIONS WERE FOUND BY THE PRODUCT OWNER READING THE SOURCE, WITH NO SHELL, AFTER THE ONE REVIEW STAGE HAD CLOSED -- which is the SECOND SPRINT RUNNING that the reader after the last one found what the stage did not. That is evidence for the impediment above rather than a comment on it: `two stages are better than one` is an argument, and `the reader after the stage found the sprint's own false sentence, twice` is a measurement.",
        "AND ONE THING THE PRODUCT OWNER NAMED AND DELIBERATELY DID NOT ASK FOR, recorded so a later reader does not file its absence as a miss: the fifth check's header still licenses withdrawing the root check by a mapping that exists nowhere. LEFT STANDING ON PURPOSE -- its subject is member resolution rather than the exports arm, it is already filed into PBI-62 with byte-identity evidence at its own base, and re-filing it buys nothing.",
      ],
    },
    {
      number: 57,
      pbi_id: "PBI-70",
      goal: "A recorded perturbation is something the suite RE-RUNS, so an arm that has stopped noticing its own predicate being weakened reddens on the next run instead of at the next review.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "THE SECOND REVIEWER OF THE FIRST REVISE ROUND FAILED WITH A CONFIGURATION ERROR BEFORE READING ANYTHING, so that round's adversarial reading is one reader's. FILED LATE AND LABELLED AS SUCH: it was recorded at the time as a DECISION, which is a sentence about coverage rather than a thing with a request attached, and the error text was never captured -- so what this entry can carry is the failure and not its diagnosis. THAT LOSS IS THE EVIDENCE FOR THE RULE the decisions now hold: a reviewer that fails is an impediment at the moment it happens, with its error.",
          impact:
            "MEASURED RATHER THAN FEARED, WHICH IS WHY THIS IS NOT A GENERAL WORRY ABOUT REVIEW: the round closed at seven findings, and the EIGHTH of the same class -- the guard covering the deletes and not the two writes beside them -- was then found by the product owner reading the source. So the single stage was not saturating, and the cost of the failed reviewer is one round of repairs that had to be paid for a second time, in a sprint whose own accident had already destroyed a working tree.",
          request:
            "Nothing is asked of the human for THIS sprint -- the eighth finding is repaired and its degenerates are re-run in both directions. What is asked is for the next sprint that loses a reviewer: file it here, at the time, with the error, so the next round can decide whether to re-run the stage rather than learning at acceptance that it was thin.",
          status: "resolved",
          notes: [
            "RESOLVED MEANS THE FINDING THE MISSING READER WOULD HAVE CAUGHT IS REPAIRED, AND NOT THAT THE REVIEWER RAN. The distinction is kept because the opposite reading is how a gap becomes a green: nobody re-ran the second stage, and no claim is made here about what a second reader would have found beyond the one instance that did reach us.",
          ],
        },
      ],
      decisions: [
        "THE MACHINE CANNOT DECIDE COVERAGE AND CAN DECIDE FIDELITY, EXACTLY. A check deciding whether an arm HAS a perturbation is an approximate detector, and this project has refused that shape by name -- its failure mode is a GREEN CERTIFYING THE CLASS AS WATCHED. That half stays unmechanised AND THE SPRINT SAYS SO IN ITS OWN TEXT. What is exact is that a perturbation, once recorded, is a mutation, a named arm and a required red.",
        "REFUSED IN ADVANCE SO NO SPRINT IS SPENT ON THEM: any coverage detector in any spelling, including one scanning a diff for touched arms and cross-referencing a registry -- it reddens on a formatting-only touch and its matching is lexical over free text; a mutation-testing framework or any mutation SCORE, since generated mutants are not `the adjacent weaker reading of THIS predicate` and a survival percentage is the coverage number arriving through arithmetic; a backfill sweep of the existing corpus, which is the tail item by the back door; a skill as the deliverable; a sixth Definition-of-Done check; and any aggregate word in the report.",
        "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: a green that can be read as a statement about arms NOT in the registry. Falsifiable form -- the report NAMES the arms it weakened, any count is computed at run time and written down nowhere, and no tracked prose claims the registry is complete.",
        "DISCLOSED AT PLANNING RATHER THAN LEFT FOR REVIEW: the machine executes fidelity, but `the ADJACENT weaker reading` is a semantic judgement nothing verifies -- no check stops a record whose mutation is arbitrary or trivially detectable rather than genuinely one step weaker. A residue named before close is disclosure; the same thing found at review is a defect.",
        "STAKEHOLDER RULING, ASKED FOR AS A GATE AND ANSWERED AS A DELEGATION: SO LONG AS THE ITEM'S ACCEPTANCE CRITERIA ARE HONOURED, HOW SUBTASKS ARE HANDLED IS THE DEVELOPER'S. The record MAY be made mandatory if it is needed -- AND IT MUST NOT BECOME A SHACKLE. So the developer's second design, which would make the schema refuse a completed subtask carrying no perturbation record, is THEIRS TO TAKE OR LEAVE rather than something waiting on a ruling; the type section's `request human review` was read as a gate over the mechanism when the gate is only over the SCHEMA'S SHAPE.",
        "AND THE SHACKLE TEST IS WHAT DECIDES IT, applied to the design's own named costs: a field required of every completed subtask would force a perturbation record TO BE INVENTED AT PLANNING TIME, which installs theatre by construction; and it reddens every historical completed subtask on day one, which is the tail item's sweep arriving through the type system as unplanned work. Both are the shackle the stakeholder named. WHAT PASSES THE TEST IS AN OBLIGATION THAT ATTACHES WHERE THE CLAIM IS MADE -- to an arm that says it defends a predicate -- and never to the act of closing a subtask.",
        "A RED DEFINITION OF DONE WAS TAKEN DURING THIS SPRINT AND IS RECORDED AS ONE RATHER THAN AS A RE-RUN: `bun test` exit 1, 873 pass / 1 fail, on the run before the last two commits, with the other four checks green. The failing arm is in a file this sprint did not touch and the finding is filed by name into PBI-68, with what is and is not claimed about the base. Nothing was committed on it.",
        "THIS SPRINT HAS HAD ONE REVIEW STAGE AND NOT TWO, RECORDED AS A FACT ABOUT THE COVERAGE RATHER THAN AS AN EXCUSE: the second reviewer failed with a configuration error before reading anything, so the adversarial reading behind the seven repairs above is one reader's. Nothing was invented to compensate -- the count of findings is the count that was filed -- and what this buys is that the sprint's evidence is thinner than the last three, which is the sentence a later reader needs.",
        "AND THAT STAGE WAS DEMONSTRABLY NOT SATURATING, WHICH IS A MEASUREMENT AND NOT AN INFERENCE FROM READER COUNTS: the EIGHTH finding of this round's own class -- a guard standing in front of the deletes and not in front of the two writes beside them -- reached the product owner, who found it by reading the source with no shell, after seven had been filed and repaired. `Two readers are better than one` is an argument; `the ninth reader found the eighth instance` is evidence, and it is the better sentence for the same reason this project prefers a red to a rule.",
        "AND THE REQUIREMENT FOR THE NEXT SPRINT WITH THIS GAP, WHICH IS WHERE THE FAILURE IS RECORDED AND NOT WHETHER: A REVIEWER THAT FAILS IS AN IMPEDIMENT FILED AT THE MOMENT IT HAPPENS, CARRYING ITS OWN ERROR -- never a decision written at close. A decision at close is a sentence about coverage; an impediment is a thing with a request attached, and it is the only form in which the next sprint can act on it. This sprint's own is filed below AS THE LATE ONE IT IS: the error text was never captured, and that loss is itself the evidence for the rule.",
        "A FINDING SURFACED AT PLANNING AND IS FILED UNDER THE BAR RATHER THAN REPAIRED HERE: the Definition-of-Done runner's header says a type error in the dashboard stops the run. MEASURED -- the runtime strips types without checking them, so a dashboard holding a type error RUNS and exits 0, and the checks are read normally. It belongs to the stale-mechanism item, it predates this sprint's base, and it is outside this sprint's subject.",
      ],
    },
  ],
  // THIS LIST IS DATA, AND `bun run scripts/definition-of-done.ts` IS THE ONE
  // FORM FOR TAKING IT. That runner EXECUTES this file and reads the checks
  // below out of the JSON it prints, so an entry added here runs with no edit
  // anywhere else -- which is the whole point, and the reason a copy of this
  // list may not be written into the runner. WHAT THIS FIELD MUST STAY: `run`
  // is A COMMAND LINE THE RUNNER SPAWNS -- a program and its space-separated
  // arguments -- so nothing a command cannot verify belongs in it, and the
  // runner is NOT added here as a sixth entry: a check that runs every check
  // would run itself, unbounded.
  //
  // AND IT IS NOT A SHELL COMMAND, WHICH THIS COMMENT CALLED IT UNTIL A
  // REVIEWER MEASURED THE DIFFERENCE: `run: "true && false"` spawned `true`
  // with the arguments `&&` and `false` and REPORTED PASSED. No shell is
  // involved, deliberately -- through one, a missing binary arrives as exit 127
  // and cannot be told from a check that ran and said no -- so a `run` carrying
  // a pipe, a redirection, a quoted argument, a glob or an operator is now
  // REFUSED and reported non-green rather than misread. A check needing any of
  // those goes in a script, and the script is what is named here.
  definition_of_done: {
    checks: [
      {
        name: "Tests pass",
        run: "bun test",
      },
      {
        name: "Lint passes",
        run: "oxlint",
      },
      {
        name: "Format check passes",
        run: "oxfmt --check .",
      },
      {
        name: "Type check passes",
        run: "tsc --noEmit",
      },
      {
        name: "Workspace members type-check under their own configs",
        run: "bun run scripts/typecheck-workspaces.ts",
      },
    ],
  },
  sprint: {
    number: 81,
    pbi_id: "PBI-81",
    goal: "The `Omit` hazard is decided site by site on a reading of who actually reddens -- the arms keep the analysis, the source keeps only the decision nothing can grade -- and the skill gains the exit a still-true comment has never had.",
    status: "review",
    subtasks: [
      {
        test: "MISSPELL ONE KEY INSIDE THE `Omit` and read WHICH ARMS REDDEN AND IN WHICH CHECK, at base and again after the edit, requiring the same arms by name. The item's `three of the four are graded` is a READING until this runs, and the before/after pair is what makes `the arm keeps it` a measurement rather than an argument at review.",
        implementation:
          "The narrowing at packages/tsudoi-language-server/src/notifications.ts:113-120. WHAT GOES: the consequence walk-through, which the pins and the probes grade. WHAT SURVIVES: the asymmetry clause, the `Pick` preference, the churn reasoning and the reversal condition -- a code-edit decision whose only legitimate home under the Lifetime Rule is that site -- with the two pins NAMED at :117. Zero edits at :176, at :264-267 and in test/notifications.test.ts.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "72f93b9",
            message: "refactor(notifications): the Omit hazard's analysis lives where it reddens",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE READING BEAT THE PREDICTION AND THE READING WINS, WHICH IS WHY THE SUBTASK ASKED FOR ONE. Predicted at planning: two bun arms plus TS2344 under `tsc --noEmit`. MEASURED, `onUnhandledNotification` misspelled as `onUnhandledNotifcation` inside the `Omit`, at base ae35bb9 and again on the narrowed text -- IDENTICAL BOTH TIMES, 942 pass / 3 fail against a clean 945 / 0: `the narrowed connection rejects onUnhandledNotification and accepts onRequest, in one type-check` and `the same two outcomes hold for onUnhandledNotification through an alias under a different name`, both test/notifications.test.ts, AND A THIRD NOBODY NAMED -- `an unbuilt checkout's root type check is non-zero and names a workspace package it could not resolve`, test/unbuilt-checkout.test.ts, which stages a checkout and runs tsc inside it and so REPORTS THE TS2344 THROUGH bun test. `tsc --noEmit` separately: exit 1, TS2344 at test/notifications.test.ts(550,3), `BoundaryIsTheObservingMembers`.",
          "THAT THIRD ARM QUALIFIES A PLANNING PREMISE WITHOUT REOPENING ITS DECISION. The reason given for building no perturbation record was that a record holds the bun half and not the TS2344 half; the TS2344 half turns out to be inside bun test already, through a second file. NO RECORD WAS BUILT ANYWAY and none is proposed -- the re-runner runs an arm file, and the arm that would carry this one is in test/unbuilt-checkout.test.ts, whose subject is the unbuilt checkout and not this boundary.",
          "READING 2, THE RE-GREP OF `silent no-op` AND `MISSPELL` READ AS A LIST. F5: `unchanged in MEMBERSHIP` STOOD HERE UNQUALIFIED AND IS TRUE ONLY OF THE INSTRUMENT AND THE FILE SET IT WAS TAKEN OVER. MEASURED, ae35bb9 against HEAD: over tracked files EXCLUDING scrum.ts, that instrument returns the SAME members both times -- src/notifications.ts:113 and :176, test/notifications.test.ts:506, :507, :535, :663, :664, test/package-shape.test.ts:60. WIDEN EITHER AXIS AND IT MOVES. Case-insensitive `misspell` LOSES A MEMBER, and it is the deleted walk-through itself, base src/notifications.ts:114 `so the misspelling compiles at 0`. Including scrum.ts, `silent no-op` GAINS this note and decision 5's restatement. So the honest claim is that the SOURCE-AND-TEST HAZARD SITES are unchanged, which is what the narrowing was answerable for.",
          "F5's SECOND HALF, PARTLY REFUTED ON A MEASUREMENT. The enumeration was said to omit members present at both ends. ONE CITATION HOLDS: scrum.ts:131 carries the literal `silent no-op` at both ends and this note's list left it out. THE OTHER FOUR DO NOT MATCH THE INSTRUMENT THIS NOTE DESCRIBES -- .claude/skills/recording-a-measurement/SKILL.md:253, test/guard.test.ts:97 and the five in test/published-artifacts.test.ts all spell `misspell` in LOWER CASE, and the instrument is `MISSPELL` upper-case or `silent no-op`. They are members of a case-insensitive sweep and of no list taken here. Recorded because a finding measured against a different instrument than the note it corrects is the same confusion in the other direction.",
          "READING 3, THE SIXTH SITE AT src/notifications.ts:264-267, DECIDED EXPLICITLY BECAUSE THE RE-GREP PROVABLY CANNOT REACH IT: it RESTATES the premise -- `Pick` forecloses by what is LISTED rather than by what the base type happens to contain -- and does NOT dangle, since it points at nothing. Left untouched, and its existence is EVIDENCE THE NARROWING HAD TO KEEP THE ASYMMETRY CLAUSE: two live decisions, the `Pick` preference at :113-120 and the refusal to serve on `Connection` at :256-267, now both explain themselves by it.",
          "FILED AND NOT REPAIRED, WHICH DECISION 6 RULED IN ADVANCE, AND NAMING THE PINS MADE IT SHARPER RATHER THAN NEUTRAL. `IF EITHER PIN IS REMOVED OR WEAKENED` is true, but the site now hands a reader two SYMBOLS and invites the check that planning refused to run: perturb `ProtocolConnectionHasTheseMembers` and, ON DECISION 2'S READING AND NOT ON ONE TAKEN HERE -- IT WAS FORBIDDEN AND WAS NOT RUN -- nothing about the misspelling hazard moves, so a reader checking that way reads the sentence as false. What THIS sprint measured is consistent with it and does not establish it: pin 2 is silent under the misspelling in every arm listed above. F8 NOW MEASURES BOTH PINS AND NARROWS THIS NOTE'S OWN FIRST ACCOUNT OF THEM, which said pin 1 moves when the `Omit` moves. THAT IS TOO WIDE. MEASURED HERE, pin 1 deleted: with `trace` misspelled the two `trace` probes STILL REDDEN and `tsc --noEmit` is silent, so for the misspelling hazard THIS PARAGRAPH OPENS WITH, pin 1 is REDUNDANT WITH THE PROBES. With a SURPLUS key `sendNotification` added instead, nothing reddens at all -- 22 pass / 0 fail in test/notifications.test.ts and `tsc --noEmit` silent -- while the same surplus key against pin 1 PRESENT names TS2344 at test/notifications.test.ts(550,3). SO PIN 1'S SOLE CONTRIBUTION IS THE SURPLUS-KEY DIRECTION, WHICH :113-120 NEVER NAMES. `IF EITHER PIN IS REMOVED OR WEAKENED` stays TRUE -- a surplus key is a real hazard only pin 1 catches -- but the paragraph opens on the misspelling and so points a reader at the one hazard the condition does not hold for. FILED AND NOT REPAIRED, which decision 6 ruled in advance. The pin 2 direction WAS run by a reviewer this round and is theirs, not taken here: pin 1 alone, `onBrandNewTrafficObserver` added to `ProtocolConnection` by declaration merging, exit 0 -- the member lands silently on `RequestOnlyConnection`, confirming pin 2 sole in the DEPENDENCY direction. The complementarity argument still lives only at test/notifications.test.ts:565-570.",
          "THE SITE DID NOT GET SHORTER, AGAINST DECISION 3'S PREDICTION: eight comment lines before and eight after. The walk-through's removal paid for the two pin names almost exactly. Recorded because the prediction is in the record, and decision 3 now carries the same reading rather than still asserting the prediction as fact.",
          "F7. A FORECLOSED-ALTERNATIVE PARAGRAPH IN 72f93b9's AND 1e88941's COMMIT BODIES IS FALSE, RECORDED HERE AND NOT AMENDED. It says `Pick needs neither of them` stops parsing the moment `K extends keyof T` goes. MEASURED: `K extends keyof T` has ZERO hits anywhere in the tree at ae35bb9 -- 72f93b9 INTRODUCED IT. At base the sentence read `IF EITHER PIN IS REMOVED OR WEAKENED, CONVERSION BECOMES REQUIRED. Pick needs neither of them`, where `them` is the two pins named in the preceding clause, which decision 1 independently settles. So the over-deletion trap was real as a warning about the ASYMMETRY CLAUSE and false as stated about that sentence, and it was carried into a commit body as measured. NOT AMENDED, under sprint 73's ruling that a commit message records what was believed when it was written; the record is the correction's home. The SKILL.md version says `the clause you took` and names nothing, so it is generic and stays.",
          "F1. THE FORMAT RED WAS MISFILED AND THE MISFILING IS WHAT THIS NOTE IS FOR NOW. It read ENVIRONMENT FINDING, PRE-EXISTING, a toolchain-version disagreement about where a long string wraps. BOTH HALVES FALSE. MEASURED with one binary across worktrees: 2799300 green, 027d6cc green, ae35bb9 RED. ae35bb9 IS THIS SPRINT'S OWN PLAN COMMIT -- three long strings its sprint entry broke after the key, repaired at c4b3ba6, nothing to do with oxfmt 0.62.0. THE FILING BAR WAS FAILED TWICE OVER: it asks for BOTH commits and the byte-identity result AT THE SPRINT'S BASE, and this named one commit and took it from INSIDE the sprint, so `pre-existing` was measured against the very change that caused it and byte-identity against that same change was guaranteed to hold. ONE WORKTREE AT A COMMIT OUTSIDE THE SPRINT WOULD HAVE REFUTED IT, and the version story was never tested against one. WHY THE BAR EXISTS is this exactly: a red filed as pre-existing that is not is a defect handed forward as somebody else's.",
        ],
      },
      {
        test: "None, and the item discloses why: a skill file cannot redden and no check decides whether its new arm is applied. WHAT STANDS IN ITS PLACE IS AN ORDERING CONSTRAINT, not an assertion -- the arm is written AFTER subtask 1, from the case subtask 1 executed, and if subtask 1's disposition cannot be spelled in the arm's own words the ARM is wrong and gets rewritten rather than the case reinterpreted.",
        implementation:
          "`.claude/skills/writing-a-comment/SKILL.md`: a disposition for a comment STILL TRUE and no longer earning its lines, and the four-home rule for a reason that is not a comment.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "1e88941",
            message:
              "docs(skills): a still-true comment gains an exit, and a reason gains its homes",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE ORDERING CONSTRAINT HELD AND IT CAUGHT SOMETHING. Written after subtask 1, from the case subtask 1 executed, and subtask 1's disposition spells in the arm's own words: the claim held, three arms already reddened the perturbation it described, so the copy at the site went and they keep it. Keyed on WHO GRADES IT and not on length, because the executed case did not turn on length.",
          "THE FIRST DRAFT OF THE ARM WAS FALSE ABOUT THE FILE IT WAS BEING ADDED TO, caught before it landed and rewritten rather than defended. It said DELETE, NARROW and SUPERSEDE all fire on a fact having CHANGED; DELETE's own text gives its reason as `a reader at that line never needed it`, which is WITHDRAW's reason too. What is actually missing from that section is the TRIGGER, not the argument -- its heading and every arm's wording enter through a CORRECTION. This is the file's own sprint-22 rule arriving inside the file that carries it, and the shipped arm says so.",
          "WHAT THE ARM CARRIES BEYOND THE DISPOSITION, both from this sprint's own near-misses: a withdrawal is a MEASUREMENT and not a reading of an arm's name -- the prediction here named fewer arms than the reading returned -- and OVER-DELETION IS INVISIBLE TO THE INSTRUMENT THAT CERTIFIES THE WITHDRAWAL, because the re-grep's words are the ones being kept.",
          "THE FOUR-HOME RULE WENT UNDER THE LIFETIME RULE AND NOT BESIDE IT: that section already states the backlog-item home, and a list restating its own section is this item's defect. The arm, the commit, a skill and CLAUDE.md are added; the arm is marked as outranking the rest because it is the only home that reddens.",
          "NO ASSERTION EXISTS AND NONE WAS INVENTED, which the item discloses. A skill file cannot redden and nothing decides whether the arm is applied; what stands in its place is that this sprint is its first application, in the same item.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE DEVELOPER FILED A TRUTH DEFECT AT THE SITE IT WAS SENT TO NARROW AND THE PRODUCT OWNER REFUTED IT, so the reading is recorded rather than the repair. `:117-119` says the `Omit` is defended by TWO PINS and that removing EITHER makes conversion required; the Developer read `pins` as the spawned probes and concluded only one defends the misspelling hazard. MEASURED: `\\bpins?\\b` occurs in test/notifications.test.ts at exactly :541 and :595, both inside the `Assert<Exact<...>>` docblocks, and the spawned ones are called `the two probes` and `the four probes` and never pins. THE CLAUSE THAT SETTLES IT is the last one -- `Pick needs neither of them` -- which is FALSE under the probes reading, because a `Pick` leaves those probes unchanged. The two pins are COMPLEMENTARY, one per blind spot of `Omit`, and the test file says so at :565-570. So `EITHER` is true, this is not PBI-77's class, and note 4 stands.",
      "AND THE DISCRIMINATOR THE DEVELOPER PROPOSED WAS CONFOUNDED, WHICH IS THE HALF THAT MATTERS INDEPENDENTLY OF WHO WAS RIGHT. `Delete ProtocolConnectionHasTheseMembers and read whether anything about the misspelling hazard changes` returns NOTHING CHANGES under both hypotheses -- pin 2 was never the misspelling defender and its own docblock says so. Run as planned it yields a green that reads as proof, and the sprint narrows a true sentence into a false one on a measurement that could not have said otherwise. Sprint 73's class, arriving at plan time instead of at review. The direction that separates them is the DEPENDENCY side: pin 2 deleted, a member planted on `ProtocolConnection`, read whether it lands silently on `RequestOnlyConnection`.",
      "WHAT THE REFUTED FINDING LEFT BEHIND IS IN SCOPE AND IS NOT A TRUTH REPAIR. `two pins` names neither pin, and the phrase was resolved wrong twice in two days -- once by criterion 1 itself, corrected at refinement, and once by the Developer reading the source directly. Prose two careful readers get wrong is under-specified, which is this item's subject; naming the two symbols at :117 is subtask 1's work, in the same commit. THE PREDICTION THAT CAME WITH IT -- `and the site still gets shorter` -- WAS EXECUTED AND FAILED, F9, AND IS KEPT AS A FAILED PREDICTION RATHER THAN QUIETLY DROPPED: eight docblock lines before and eight after, the commit 8 insertions / 8 deletions. The walk-through's removal paid for the two pin names almost exactly. THE FAILURE IS THE USEFUL HALF -- naming a symbol costs about what a consequence sentence costs, so `it will also be shorter` is not free when the same edit is asked to make prose more specific. Repaired here because the refutation was filed in a note while this line went on asserting the prediction as fact, and a reader picks whichever they reach first.",
      "NO PERTURBATION RECORD IS BUILT FOR SUBTASK 1, AND THE RESIDUE NAMED IS THE REGISTRY'S REACH RATHER THAN THE PERTURBATION'S. `alsoReddens` is same-file and the re-runner runs an ARM FILE, never `tsc --noEmit` -- so a record would hold the two bun arms and NOT the TS2344 half, which is the half licensing removal of the analysis from source. The header's second branch applies instead: the weakening is a reading of something an arm already holds, and `BoundaryIsTheObservingMembers` re-runs under the fourth check by existing.",
      "THREE READINGS AND NOT ONE, BECAUSE THE ITEM'S OWN INSTRUMENT CANNOT REACH ITS OWN SIXTH SITE: the misspell perturbation at base and after; the re-grep of `silent no-op` and `MISSPELL` read as a LIST and not as a diff; and a separately named read of :264-267, which spells neither key word. The product owner added that site knowing the re-grep misses it, so the third reading is the honest consequence of the addition.",
      "THE RISK ON THE RECORD IS THE DEVELOPER'S REPLACEMENT FOR THE ONE IT WITHDREW: the surviving text at :115-120 states a decision whose terms are resolved by reading two other files, and the narrowing makes it shorter without making it more self-contained. Naming the pins fixes the referent, not the fact that the reversal condition's truth rests on a complementarity argument living only at test/notifications.test.ts:565-570. IF THE EXECUTED NARROWING LEAVES A READER UNABLE TO CHECK `EITHER` FROM THE SITE, THAT IS FILED AND NOT REPAIRED HERE.",
    ],
  },
  retrospectives: [],
};

// ============================================================
// Type Definitions (DO NOT MODIFY - request human review for schema changes)
// ============================================================

// PBI lifecycle: draft (idea) -> refining (gathering info) -> ready (can start) -> done
type PBIStatus = "draft" | "refining" | "ready" | "done";

// Sprint lifecycle
type SprintStatus = "planning" | "in_progress" | "review" | "done" | "cancelled";

// TDD cycle: pending -> red (test written) -> green (impl done) -> refactoring -> completed
type SubtaskStatus = "pending" | "red" | "green" | "refactoring" | "completed";

// behavioral = changes observable behavior, structural = refactoring only
type SubtaskType = "behavioral" | "structural";

// Commits happen only after tests pass (green/refactoring), never on red
type CommitPhase = "green" | "refactoring";

// When to execute retrospective actions:
//   immediate: Apply within Retrospective (non-production code, single logical change)
//   sprint: Add as subtask to next sprint (process improvements)
//   product: Add as new PBI to Product Backlog (feature additions)
type ImprovementTiming = "immediate" | "sprint" | "product";

type ImprovementStatus = "active" | "completed" | "abandoned";

// An impediment is a blocker ONLY a human can resolve (credentials, external
// accounts, irreversible decisions, denied permissions). Agent-solvable
// obstacles are just work; PBI gaps go back to refinement instead.
type ImpedimentStatus = "waiting_human" | "resolved";

interface SuccessMetric {
  metric: string;
  target: string;
}

interface ProductGoal {
  statement: string;
  success_metrics: SuccessMetric[];
}

interface AcceptanceCriterion {
  criterion: string;
  verification: string;
}

interface UserStory {
  role: (typeof userStoryRoles)[number];
  capability: string;
  benefit: string;
}

interface PBI {
  id: string;
  story: UserStory;
  acceptance_criteria: AcceptanceCriterion[];
  status: PBIStatus;
  notes?: string[]; // refinement decisions, dissent, open questions
}

interface Commit {
  hash: string;
  message: string;
  phase: CommitPhase;
}

interface Subtask {
  test: string;
  implementation: string;
  type: SubtaskType;
  status: SubtaskStatus;
  commits: Commit[];
  notes: string[];
}

interface Impediment {
  description: string;
  impact: string; // how it affects the Sprint Goal
  request: string; // what exactly the human should do or decide
  status: ImpedimentStatus;
  notes: string[]; // workarounds attempted, resolution outcome
}

interface Sprint {
  number: number;
  pbi_id: string;
  goal: string;
  status: SprintStatus;
  subtasks: Subtask[];
  impediments: Impediment[];
  decisions: string[]; // key decisions from event conversations, incl. dissent
}

interface DoDCheck {
  name: string;
  run: string;
}

interface DefinitionOfDone {
  checks: DoDCheck[];
}

interface Improvement {
  action: string;
  timing: ImprovementTiming;
  status: ImprovementStatus;
  outcome: string | null;
}

interface Retrospective {
  sprint: number;
  improvements: Improvement[];
}

interface ScrumDashboard {
  product_goal: ProductGoal;
  product_backlog: PBI[];
  sprint: Sprint | null;
  definition_of_done: DefinitionOfDone;
  completed: Sprint[];
  retrospectives: Retrospective[];
}

// JSON output (deno run scrum.ts | jq for queries)
console.log(JSON.stringify(scrum, null, 2));
