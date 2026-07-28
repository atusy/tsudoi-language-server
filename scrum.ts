// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 500 lines (overrides the
// scrum-dashboard skill's default of 300).
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
        metric: "PoC-scope LSP methods respond per the specification",
        target: "10 of 10 methods",
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
      id: "PBI-21",
      story: {
        role: "editor user",
        capability: "complete a spaced filename mid-path without the tail being mangled",
        benefit:
          "their own insert-versus-replace setting does what they set it to, instead of producing a line neither mode would have written",
      },
      acceptance_criteria: [
        {
          criterion:
            "A replace range covers the whole filename WHEN THE LINE ALREADY CARRIES IT VERBATIM",
          verification:
            "Complete `spaced (1).txt` from `spa` on a line that already reads `spaced (1).txt`, and apply the item as a client set to REPLACE would; assert the resulting line is the filename ALONE. NEGATIVE CONTROL: today's whitespace-delimited end produces `spaced (1).txt (1).txt` -- the tail left behind. THE BOUNDARY IS IN THE CRITERION, for the fourth time on this principle: a PARTIALLY-TYPED tail (`spa|ced (1).tx`) and a tail belonging to a DIFFERENT candidate stay at the whitespace end and are DECLINED rather than missed",
        },
        {
          criterion: "The rule can never be WORSE than today",
          verification:
            "A line that does NOT carry the candidate verbatim from the fragment start produces exactly today's range. THE CASE IS `spa|ced (1).txt` COMPLETING TO `spaced (2).txt` -- what a prefix match would mangle into `spaced (2).txt1).txt`, worse than the bug. NEGATIVE CONTROL: relaxing the comparison to a PREFIX match reddens it, so the declined generalisation owns a test rather than being defended incidentally",
        },
        {
          criterion: "The `insert` arm is unchanged",
          verification:
            "Its range still ends at the cursor, asserted rather than assumed. NEGATIVE CONTROL: extending `insert` too reddens it. THE REASON IS STRONGER THAN A REGRESSION: extending insert's end PAST THE CURSOR stops it being an insert at all, so the two arms CONVERGE -- which is precisely what Sprint 13's InsertReplaceEdit ruling exists to prevent. Extending both would UNDO that ruling, not merely inconvenience one setting",
        },
      ],
      status: "ready",
      notes: [
        "THE QUESTION THAT COULD HAVE KILLED THIS ANSWERED IN ITS FAVOUR, measured from ddc-source-lsp's source: createSelectText's stop characters truncate the WORD, which drives display and filtering, while CONFIRM takes before/after straight from textEdit[confirmBehavior] and linePatch deletes forward by exactly OUR replace end. TWO PATHS, and the harm is governed entirely by ours. The arithmetic reproduces the report: end at 6, before 3, after 3, [0,6) deleted, ` (1).txt` left behind -- a mechanism rather than a plausible explanation. THE REMEDY IS DECIDABLE AND DISK-FREE: extend the replace end only when `line.slice(fragmentStart, fragmentStart + candidate.length) === candidate`. Per candidate, which LSP permits since each item carries its own textEdit -- the structural point that makes the rule possible. CHECKING THE TEMPTING GENERALISATION IS WHAT MAKES IT SAFE: longest-common-prefix turns `spa|ced (1).txt` completing to `spaced (2).txt` into `spaced (2).txt1).txt`, ACTIVELY HARMFUL rather than merely unnecessary -- so exact match is not a choice among options, it is the only safe rule.",
        "PROBING IS DECLINED, and the reason is recorded so it is not revisited by accident: one stat per extension step, on the same path where per-candidate listing already makes a huge directory the pathological case, and it cannot terminate honestly -- `a b c` requires probing three prefixes and the answer differs per machine. MEASURED SEPARATELY AND NOT TOGETHER, so nobody reads it as bounded: ddc's own createSelectText truncates the word at space, tab, brackets and quotes anyway, so a longer range would be cut back by THAT client regardless. The two measurements are of ddc's stop characters and of our heuristic; their INTERACTION is unmeasured.",
        "PRESENT-TENSE HARM, in the feature the stakeholder actively uses, and REACHABLE WITH THEIR OWN SETTING: their confirmBehavior is `replace`. Recorded at examples/completion-path.ts since Sprint 13 as A DEFECT WE HAVE NOT FIXED rather than a chosen limit, because a mangled insertion is the exact harm the range criterion exists to prevent. WHY IT WAS DEFERRED AND WHAT THAT COSTS: a smarter word end needs FORWARD DISK PROBING and is undecidable in general -- the same fragment can be one filename on one machine and two words on another. Refinement decides whether the answer is probing, a narrower rule, or accepting the limit and saying so; the PBI does NOT presuppose one.",
      ],
    },
    {
      id: "PBI-22",
      story: {
        role: "tsudoi maintainer",
        capability: "register a notification without being able to sidestep the router entirely",
        benefit: "the gate cannot be avoided by not using the thing that applies it",
      },
      acceptance_criteria: [
        {
          criterion: "A call to connection.onNotification outside the router does not lint",
          verification:
            "A rule of the shape .oxlintrc.json already carries, asserted by the same probe mechanism the Bun-global and bun:* guards use. NEGATIVE CONTROL: a direct call added to src/server.ts must fail lint, and the router's own call must NOT",
        },
      ],
      status: "draft",
      notes: [
        "A GAP IN WORK THE PO ACCEPTED, found by asking what comes next rather than by anything reddening: PBI-18 forecloses bypass WITHIN the router -- an entry that decides no gate does not type-check -- but NOT bypass OF it. A future edit calling connection.onNotification directly answers to nothing. The foreclosure endorsed at Sprint 16 is partial, and src/notifications.ts says so at its own site. NO TYPE CAN DO THIS, which is why it is a lint rule rather than more of what PBI-18 built. It is PBI-6's shape, and PBI-6 is the precedent that the codebase itself rejects the changes that would quietly break a promise.",
        "CONDITIONALLY ORDERED: after PBI-21 because that harm is present-tense while this needs future notification work that is not scheduled -- but BEFORE any new notification work, whenever that arrives.",
      ],
    },
  ],

  completed: [
    {
      number: 19,
      pbi_id: "PBI-20",
      goal: "Remove a folder as many times as the client removed it -- so the list keeps saying exactly what the client said, on remove as it already does on add.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "CARRIED FORWARD FROM SPRINT 10 THROUGH EVERY COMPACTION SINCE, because it is the one open decision no sprint can close. The stated route's FIRST line -- how a user obtains the package -- is verified from a local tarball, not from npm. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package that has never been published, and publishing needs an account and is irreversible.",
          impact:
            "PBI-13's criteria are met for everything after the install: the same artifact, the same install command shape and the same entry point serve both runtimes. What is NOT verified is that the registry hands a user this tarball -- the metric says `from an installed package`, and installed-from-a-tarball is the closest a developer can get without a human decision.",
          request:
            "Decide whether to publish 0.0.x to npm so the obtain half can be verified, and provide the account if so. Until then nothing in this repo may claim the registry route works; test/installed-runtime.test.ts marks it NOT VERIFIED in the same comment that states it.",
          status: "waiting_human",
          notes: [],
        },
      ],
      decisions: [
        "SPRINT 16'S RECORD DROPPED AT SPRINT 19, homes checked: the baseline measurement that two of three gate copies were pure convention is at src/notifications.ts, the only place it survives; the exit carve-out is asserted as a value in test/notifications.test.ts; and the disarmed-control finding became the re-run improvement's second rationale. Sprint 10's npm impediment rides here, still open and still the only unverified step in the product goal. Shipped in 9def17f, 87db56c, 2a90e78, aba57c9, 0ef93a9 and 9cadcad. 323 tests green from 317, each DoD command run separately with its exit read directly.",
        "THE TWO-TEST RULING MEASURED, and the GREEN cells are the load-bearing half: the pre-sprint remove-all filter reddens the SEQUENTIAL test and leaves the BATCHED one green; a dedupe of the removed array does the exact reverse. NEITHER CONTROL COVERS BOTH. The granularity rule's first real application, arriving on its own terms one sprint after being filed. BORN-GREEN REPORTING DONE AS A MEASUREMENT RATHER THAN A LABEL, and it is the first time anyone here sequenced COMMITS to make a claim checkable: the batched test was written and run against UNCHANGED src/ where it passed, and committed FIRST -- both tests share a file, so a born-green claim made after the fix landed would have been unmeasurable.",
        "THIS SPRINT DISARMED A CONTROL OF PBI-17'S, and repairing it is the subtraction rule applying BY EFFECT: trailing-slash normalisation used to redden the exact-match test and afterwards reddened NOTHING across 321 tests -- behaviour unchanged, defence gone. Re-armed before the tag by naming the NON-FIRST spelling in the removal, since with the first named one-copy-per-entry lands on the intended target either way. A PRE-EXISTING GAP REVEALED AND CLOSED OPPORTUNISTICALLY, named that way so it does not read as scope creep: nothing has EVER defended removed-before-added -- applying `added` first reddened nothing across 321 tests, nor across the 317 predating this sprint. Pinned because the PO ruled it ONE REQUIRED OUTCOME at Sprint 17 and a one-test PBI is disproportionate. THE FIRST ATTEMPT AT THAT TEST DID NOT DISCRIMINATE: pre-adding the folder makes the two orders AGREE under one-copy-per-entry, so the test starts from an EMPTY list.",
        "UNPINNED AND MEASURED RATHER THAN ASSUMED: findLastIndex instead of findIndex reddens NOTHING in 321, so WHICH copy an entry takes is not pinned. The client said remove one and did not say which; two defensible outcomes, recorded rather than fixed.",
      ],
    },
    {
      number: 18,
      pbi_id: "PBI-19",
      goal: "Let a config author see the root the editor named, whichever field that client's LSP version used to name it.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in c4432d0, 88b376a, b1967ba, 9286da6 and 01e3fbf. 317 tests green from 293, each DoD command run separately with its exit read directly. The chain is workspaceFolders > rootUri > rootPath, computed ONCE at initialize and stored -- never at read time.",
        "PINNED AT REVIEW BECAUSE NOTHING DEFENDED IT: making `[]` or null stop the chain reddened NOTHING across 315 tests. Correct behaviour with zero defence is what the first-to-fail rule was sharpened to catch, and a stronger case than the exit carve-out -- there the detection was real but unnamed, here there was none. THE REASON WAS ALSO CORRECTED: fall-through holds on HARM ASYMMETRY, not on a config author being unable to see which spelling arrived, which is observability. The spec-precedence counter is recorded at the site as considered. TWO DECISIONS UNPINNED BY CHOICE, a THIRD CATEGORY beside NOT CONSTRUCTED and FORECLOSED, each recorded with what was chosen and what was rejected. A non-file rootUri: `initialize is still answered` admits ONE outcome and is pinned, while what the list holds admits more than one and is not -- the rejected alternative would have introduced a THIRD naming convention.",
        "A RULE OF OURS BLINDING A CONTROL OF OURS: under the cwd-fallback perturbation the example-level absence test stayed GREEN, because PBI-14's dedup-by-inserted-text collapses the identical item a cwd root produces. Annotated at the site rather than deleted, so nobody reads two tests as two defences; the context-level test carries that criterion alone. THE COMMENT PERTURBATION IS A NEW TECHNIQUE and it found three site comments asserting what nothing checked. Distinct from the standing prose item, which catches prose that BECAME false: this catches prose that was NEVER checked. The enabling measurement is at test/workspace.test.ts -- every URI in the suite round-tripped through the URL parser unchanged, so `we kept the client's bytes` and `we reparsed and got lucky` were indistinguishable until `%6A`, an unreserved character, made the round trip lossy.",
        "CRITERION 1 IS VERIFIED SYNTHETICALLY, restated at acceptance as the checklist required: MEASURED across all three capability declarations, nvim sends rootUri and workspaceFolders TOGETHER OR NEITHER, so no measured client produces this case. Nothing here shows the fix working for a client anyone has seen. THE READ-TIME TRAP IS THE SPRINT'S CENTRAL CONTROL, and it broke TWO WAYS from one perturbation: `folders.length > 0 ? folders : synthesise(rootUri)` passes criterion 1 PERFECTLY, then loses the root to the first `added` and makes it REAPPEAR when a later `removed` empties the list -- a folder the client explicitly removed coming back. The Scrum Master rebuilt it INDEPENDENTLY at a different site, reaching 4 tests per runtime where the executor reached 3, and labelled it an independent construction rather than a reproduction. A THIRD GENUINE RED THE PLAN DID NOT PREDICT, named by the executor as their own split rather than a surprise: the chain has two COMPARISONS but three SITES, and the rootPath-alone test is the only thing pinning the second synthesis site's convention. Without it that convention ships unasserted.",
      ],
    },
    {
      number: 17,
      pbi_id: "PBI-17",
      goal: "Answer from the workspace as it is now -- a folder the user adds mid-session changes what they are offered, and one they remove stops answering.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 5c3588d, 5bb6239, 4d3bc75, a4adbcd, 8fa78e3 and bd6e33a. 293 tests green (up from 284), each DoD command run separately with its exit read directly. src/workspace.ts is a HANDLE in the shape of DocumentStoreHandle -- the codebase's own answer to state that notifications write and requests read.",
        "THE DESIGNED-FOR RED WAS OBSERVED, NOT ASSUMED, which the PO's checklist required precisely because a designed-for RED arriving green is a finding: with `added` handled and `removed` deliberately not, the removal test failed on BOTH runtimes with the folder still present.",
        "THE PO'S OWN CRITERION MEASURED RATHER THAN REASONED, and re-run by the Scrum Master: a URI-comparing dedupe guard on `added` reddens `a URI added twice is held twice` on both runtimes and NOTHING ELSE. That is the exact hazard the Developer predicted -- the guard passes every OTHER criterion, which is why the rule was pinned rather than noted.",
        "THE PO OVERTURNED AN UNPINNED RULING OF THE DEVELOPER'S, and the method was right while the input was wrong. A URI held twice and removed once loses BOTH copies; that was recorded as `equally defensible` under the Sprint 7 one-outcome rule. But REMOVE-ALL DISCARDS WHAT THE EVENT CARRIED -- N `removed` entries should remove N copies, an exact mirror, and this list honours multiplicity on ADD. One outcome IS required. The site comment was corrected BEFORE THE TAG; the behaviour change is an INCREMENT, because forcing src/ changes at Review is the retroactive-scope line held since Sprint 1.",
        "REMOVED-BEFORE-ADDED STOPPED BEING DEFENSIBLE BY ACCIDENT: it is decided by the visible-over-silent principle, since a rename spelled as one event ends HOLDING the folder -- a phantom, visible if wrong -- where the other order ends holding nothing, which is silent.",
        "NOT CONSTRUCTED, with the residual named: criterion 5's before-initialize and after-shutdown halves are NOT observable end to end -- initialize REPLACES the list so an ungated write leaves no trace, and after shutdown every request is refused so no handler remains to read it back. The test sits at the router with the stub registrar, so `the real stdio connection drops this outside the serving window` is proven THERE ONLY. Criteria 1-3 carry the inside-the-window wiring, which is what makes the gap narrow rather than open.",
        "SINGLE-OBSERVER EXCEPT TWO, disclosed rather than presented as five: the executor wrote and ran all five perturbations. The Scrum Master re-ran the dedupe guard, and the wrong-params probe is a REPRODUCTION of Sprint 16's -- landing on the FIRST entry added since defineNotifications, which is the case most likely to have lost the contextual typing that extraction cost last sprint. That is also this Review's cross-sprint re-run.",
      ],
    },
  ],

  definition_of_done: {
    checks: [
      { name: "Tests pass", run: "bun test" },
      { name: "Lint passes", run: "oxlint" },
      { name: "Format check passes", run: "oxfmt --check ." },
      { name: "Type check passes", run: "tsc --noEmit" },
    ],
  },

  sprint: {
    number: 20,
    pbi_id: "PBI-21",
    goal: "Stop mangling a spaced filename when a user completes over one -- so their own replace setting does what they set it to.",
    status: "in_progress",
    subtasks: [
      {
        test: "N/A (measurement, and it comes FIRST)",
        implementation:
          "Drive ONE end-to-end confirm in the stakeholder's own stack and observe that an EXTENDED replace range is honoured. This converts the analysis's only remaining inference -- ddc's confirm path DERIVED FROM SOURCE -- into OBSERVED. IT LANDS BEFORE ANY REMEDY IS BUILT ON IT: the remedy's entire value rests on it, so discovering otherwise at Review means the deliverable does not work, where discovering it first stops the sprint cheaply.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "MEASURED AND IT HOLDS. Driven end to end in the stakeholder's own nvim 0.13.0-nightly + ddc + ddc-source-lsp with THEIR confirmBehavior `replace`, under a real pty because pum.vim opens no popup without a UI. A throwaway stdio LSP server handed ddc ONE item -- newText `spaced (1).new`, insert [0,3), replace [0,14) -- so the question was asked WITHOUT the remedy existing to answer it. Typed `spa` in front of `ced (1).old`, selected the lsp item BY SOURCE NAME and confirmed: THE LINE BECAME `spaced (1).new`. The extended replace end is honoured at confirm.",
          "PAIRED CONTROL IN THE SAME HARNESS, today's whitespace end 6: `spaced (1).new (1).old` -- the reported defect reproduced end to end, and what makes the positive result evidence rather than a line that never moved. THE THREE OUTCOMES WERE MADE DISTINGUISHABLE FIRST, and the first design was not: with a candidate equal to the line's own text, `the extended range was honoured` and `ddc inserted its truncated word and did nothing else` PRODUCE THE SAME LINE. createSelectText's truncation was OBSERVED beside it -- the item's word is `spaced` while its abbr is `spaced (1).new` -- so display-and-filtering versus confirm really are the two paths the analysis derived from source.",
        ],
      },
      {
        test: "Completing over a filename already on the line replaces the whole of it",
        implementation:
          "Extend the REPLACE end only when line.slice(fragmentStart, fragmentStart + candidate.length) === candidate. Expected RED: today's end is the first whitespace after the cursor.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "9c7f5e1",
            message: "feat(example): replace the whole filename the line already carries",
            phase: "green",
          },
        ],
        notes: [
          "RED OBSERVED AT THE HEADLINE ASSERTION and at the reported string: `spaced (1).txt (1).txt`, the same line the editor measurement produced from today's end. The rule landed in itemsFrom rather than pathFragments, which HAS NO CANDIDATE to compare the line against -- carried as a new required `line` parameter, since a field on PathFragment would have reddened three toEqual assertions as pure noise. The site comment changed in the SAME commit, and it now says what is DECLINED rather than what is unfixed. PERTURBATION `return fragment.end`, the rule removed: reddens THIS TEST ALONE of the 29 in the file.",
        ],
      },
      {
        test: "The rule can never be worse than today",
        implementation:
          "Born green by construction -- the comparison fires only on an exact match. THE CASE IS THE ONE PREFIX MATCHING WOULD MANGLE.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "12775cf",
            message: "test: pin what the replace end must NOT do, before it can do anything",
            phase: "green",
          },
        ],
        notes: [
          "THREE HAZARDS, THREE TESTS, AND EACH PERTURBATION REDDENS EXACTLY ONE OF THEM. A PREFIX (longest-common-prefix) match reddens `a line carrying a DIFFERENT candidate keeps today's end` and writes `spaced (2).txt1).txt`, the PBI's predicted mangling. Matching ANYWHERE on the line reddens `a candidate the line carries ELSEWHERE keeps today's end`, which needed its OWN line `sp| spaced (1).txt`: on the first line the two comparisons agree, so that test could never have been the first thing a loosened START breaks.",
          "A THIRD HAZARD FOUND IN EXECUTION AND NOT IN THE PLAN, and it is criterion 2's own property rather than scope creep: THE RULE CAN SHRINK A RANGE. Completing `fo` to `foo` where the line reads `foo.txt` matches VERBATIM AT THE START, and an end taken from the candidate's length alone pulls it back from 7 to 3 -- leaving `.txt` standing, WORSE than today, on a line with no space in it at all. The `spaced (2).txt` case cannot catch it, since there the comparison fails and today's end is reached by the other branch. Guarded by returning today's end when the candidate stops at or before it, and ASSERTED: dropping that guard reddens `a candidate SHORTER than the word under the cursor keeps today's end` and nothing else.",
          "BORN GREEN MEASURED RATHER THAN LABELLED, by Sprint 19's own method and for its reason: all four born-green tests were written, RUN AGAINST THE UNCHANGED MODULE where they passed, and COMMITTED FIRST in 12775cf. They share a file with the red test, so the claim would have been unmeasurable once the rule they bound existed.",
          "THE DECLINED GENERALISATION OWNS THIS TEST rather than being defended incidentally -- the Sprint 18 entry applied AT AUTHORING TIME, which is where it was filed to apply. CONTROL: relax the comparison to a PREFIX match and it reddens. A SECOND CONTROL IF CHEAP: relax the comparison's START -- match anywhere on the line rather than at fragmentStart -- which is a DIFFERENT wrong implementation producing a different mangling, so by the granularity rule it is a second hazard.",
        ],
      },
      {
        test: "The insert arm still ends at the cursor",
        implementation: "Born green. Asserted rather than assumed.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "12775cf",
            message: "test: pin what the replace end must NOT do, before it can do anything",
            phase: "green",
          },
        ],
        notes: [
          "GREEN AS PREDICTED, and the control reddens TWO tests rather than one -- disclosed rather than reported as one. Extending `insert` to the same end reddens `the insert arm still ends at the cursor` AND Sprint 13's `the range starts at the filename, not after the space inside it`, which asserts the same property on a different line. Neither is redundant under the Sprint 15 sharpening: each is FIRST TO FAIL on its own line, and the new test is the one whose FIRST assertion is the insert end.",
          "CONTROL: extending `insert` too reddens it. AND THE REASON IS STRUCTURAL rather than a regression: extending insert's end past the cursor stops it being an insert AT ALL, so the two arms CONVERGE -- undoing Sprint 13's InsertReplaceEdit ruling rather than inconveniencing one setting.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE PO'S CHECKLIST: (1) the confirm-path measurement lands FIRST; (2) the can-never-be-worse property pinned with the harmful case owning the test; (3) a second control on the same property if cheap, relaxing the comparison's START; (4) the insert arm asserted unchanged.",
      "FOURTH NARROWING ON ONE PRINCIPLE -- criterion 11, 3(b), criterion 1, and now this: A CRITERION CLAIMS THE BOUNDARY IT ACTUALLY HOLDS. The exact-match condition is in the criterion's own text and the undecidable cases are recorded as DECLINED rather than missed.",
    ],
  },
  retrospectives: [
    {
      sprint: 19,
      improvements: [
        {
          action:
            "A CLAIM IN A COMMENT IS CHECKED AGAINST WHAT IT CLAIMS, not merely against whether something backs it. A justification can be BACKED AND STILL WRONG.",
          timing: "immediate",
          status: "active",
          outcome:
            "Two false comments shipped and were caught on a SECOND self-review pass, in the sprint whose whole subject was prose correctness. One justified a test's second half by a property its FIRST assertion already covered; the other justified a presence pair with an INVERTED argument -- with the initialize folder present, a session dropping EVERY notification produces exactly the expected value. THE CLAUSE FILED ONE SPRINT EARLIER WOULD NOT HAVE CAUGHT EITHER: it catches UNBACKED claims, and both of these were backed and wrongly reasoned. AND THE FIX'S SHAPE IS THE BETTER PATTERN: a comment stating what it does NOT rule out, and why that is deliberate, beats one asserting only what it covers.",
        },
      ],
    },
    {
      sprint: 18,
      improvements: [
        {
          action:
            "A HAZARD MUST OWN A TEST WHOSE FIRST ASSERTION IT IS. Two hazards sharing one test means the second can never be OBSERVED: the same perturbation flips the first and the test stops there.",
          timing: "immediate",
          status: "active",
          outcome:
            "Found at Sprint 18, where a read-time fallback broke TWO ways -- the first delta replacing the root, and a later removal making the root REAPPEAR -- and the second was visible only because it owned its own test. A PRECONDITION FOR THE PERTURBATION-DISCIPLINE RULE RATHER THAN ITS MIRROR, which is why it is an entry rather than a clause: in the bundled counterfactual the perturbation flips AT the headline rather than earlier, so `flips earlier than the headline` never fires -- and in a two-claim test `the headline` has no single referent, so that rule cannot be applied reliably at all. Different trigger, different actor, different moment: the TEST AUTHOR before any perturbation is run, not the perturbation runner interpreting a flip.",
        },
      ],
    },
    {
      sprint: 16,
      improvements: [
        {
          action:
            "DELETING A TEST THAT DEFENDS AN ACCEPTED CRITERION IS A SCOPE DECISION, NOT A FIX, and it goes to the PO before it is re-homed. Applies to ANY change, not only sprint work.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed after three stakeholder-driven increments landed between sprints with tests green and perturbations run -- the fast loop working -- while one of them silently withdrew PBI-15's legibility criterion, accepted one sprint earlier, by deleting its two tests. The signal was there (eight tests reddened); what was missing was routing it back. FILED AS ITS OWN ENTRY rather than merged into Sprint 11's classification, which covers a perturbation that could not be CONSTRUCTED -- this covers a defence deliberately REMOVED, and collapsing them would lose the same kind of distinction that kept the justification standard and the coverage rule apart.",
        },
      ],
    },
    {
      sprint: 15,
      improvements: [
        {
          action:
            "A COMMAND WHOSE EXIT CODE IS BEING REPORTED IS RUN UNPIPED, and the report carries the COMMAND AS RUN rather than only its exit.",
          timing: "immediate",
          status: "active",
          outcome:
            "THIRD OCCURRENCE OF ONE CLASS, two people, one of them persisting nine sprints, and the consequence every time is a FALSE MEASUREMENT: the reported exit belongs to the LAST command in the pipe. The Developer read tail's status instead of bun test's; the Scrum Master lost an exit to ${PIPESTATUS[0]}, which is empty in zsh; and at Sprint 15's verification the Scrum Master reported oxlint exit 1 that was GREP FINDING NO MATCH. Caught in the same turn and re-run unpiped, so nothing false was recorded. The DoD instruction covers the four DoD commands; the gap is ANY exit being reported. THE SECOND CLAUSE IS LOAD-BEARING, and is why this is not the conscientiousness-dependent kind twice refused: a habit that leaves no trace cannot be audited, and a report carrying the command shows its own defect to any reader.",
        },
      ],
    },
    {
      sprint: 14,
      improvements: [
        {
          action:
            "WHEN EXECUTION CHANGES HANDS MID-SPRINT, the facilitator says so AT THE TIME and names who will verify -- rather than the gap surfacing at Review.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed by the Scrum Master against their own conduct: the execution agent was stopped, they continued the sprint themselves without weighing the alternative, and every perturbation from that point had ONE observer who was also its author. IT PROTECTS THE PERTURBATION-LABELLING RULE'S MEANING rather than merely being uncovered by it -- `INDEPENDENT` means `I ran my own probe rather than reproducing the recorded one`, and when the verifier IS the author that label is VACUOUS WHILE STILL READING AS REASSURANCE. Silent degradation inside one of the PO's own rules. Disclosure at the time is also the only thing that makes a replacement executor or an assigned verifier possible at all; an amendment to the labelling rule could only fix the report after the fact and cannot recover the observer.",
        },
        {
          action:
            "WHEN A SPRINT CHANGES OBSERVABLE BEHAVIOUR, the Review states whether any PROSE describing that behaviour changed. Standing-list item.",
          timing: "sprint",
          status: "active",
          outcome:
            "The PO's own trigger, fired and named as partly theirs: they required Sprint 13's mid-path criterion and never asked about the prose beside it, so the example spent a sprint telling this stakeholder their deliberately-set confirmBehavior did nothing -- in the document that argues for adoption, one sprint after the ruling made that setting theirs. A REPORTING item and deliberately NOT a mechanism: a claim-extraction check over example prose is the declined criterion-citation mechanism in a different coat.",
        },
        {
          action:
            "A REVIEW RE-RUNS ONE PERTURBATION from the previous sprint, verified by whoever is verifying then.",
          timing: "sprint",
          status: "active",
          outcome:
            "A SECOND RATIONALE, found at Sprint 16 and recorded because it is the answer if the cost is ever questioned: IT ALSO DETECTS DISARMED CONTROLS. Extracting a table to satisfy one requirement silently dropped the contextual typing that made a DIFFERENT control fire, and the DoD STAYED GREEN THROUGHOUT -- caught only by re-running someone else's perturbation after one's own edit, which no check in this project performs. The remedy for a single-observer sprint, and it works because the perturbations are REPRODUCIBLE even when they were not independently observed -- the record was auditable though unaudited, which is what item-by-item reporting was built to produce. Costs almost nothing and restores a second observer retroactively for at least one claim.",
        },
      ],
    },
    {
      sprint: 13,
      improvements: [
        {
          action:
            "A claim about WHAT THE SUITE COVERS is checked against the suite before it is recorded. Recalled coverage is not coverage. SUBJECT WIDENED TWICE AT SPRINT 16, neither a new rule: a claim about WHAT THE RULE SET CONTAINS is checked against the rule set, and a claim that the suite does NOT defend something is a coverage claim too. THE RECURRING SHAPE, named because it is where all five instances live: A FACTUAL PREMISE STATED INSIDE A CRITERION IS A CLAIM REQUIRING MEASUREMENT, NOT FRAMING -- premises go unchecked because reviewers read the REQUIREMENT. The PO asserted a filed improvement existed and it never had been -- the fourth catch by their own rule, and the first where the Scrum Master caught it by applying that rule TO the PO rather than taking their word.",
          timing: "sprint",
          status: "active",
          outcome:
            "SPLIT BACK OUT at the PO's ruling one turn after being merged into the S8 justification standard, on the same live-reason test that kept the perturbation pair apart: the justification standard PERMITS `reasoned`, and this rule FORBIDS it. A coverage claim may not be labelled reasoned and left there, because checking is cheap and the failure mode was asserting a measurement nobody had done. A strengthening that removes an option the parent rule allows is not a restatement of it. The measured-or-reasoned label does not help here: the falsified note did not read as unlabelled, it read as CHECKED.",
        },
        {
          action:
            "A PLAN CARRIES PROPERTIES, NOT MECHANISMS. It states the PROPERTY to establish rather than the mechanism to use, and it may not substitute a PROXY for a criterion's property. Where a plan must name a mechanism, it says whether that mechanism was MEASURED to produce the property.",
          timing: "sprint",
          status: "active",
          outcome:
            "MERGED AT SPRINT 14 from two statements of one rule, nothing dropped. S12: the plan converts a criterion into an implementation recipe and the recipe silently becomes the real acceptance test -- one layer below checklist-versus-criterion drift, where the reviewer's thinking runs ahead of the criterion. S13: filed by the Scrum Master against their own conduct, at the PO's ruling that `the Developer will catch it` fails the Sprint 2 standard, since it makes correctness depend on someone downstream remembering to look -- and the piped-exit-code defect shows how slowly that works when they do: nine sprints. MERGED AT SPRINT 17 from the S5 shared-moment rule, which is the same rule about a different axis: a plan that hides which subtasks are ONE EDIT produces a born-green RED, and declaring it in advance is the property-not-mechanism discipline applied to sequencing.",
        },
      ],
    },
    {
      sprint: 12,
      improvements: [],
    },
    {
      sprint: 11,
      improvements: [
        {
          action:
            "When a perturbation CANNOT BE CONSTRUCTED, classify it. NOT CONSTRUCTED: the means were lacking -- the assertion is undefended, say what remains at risk.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed by the Developer against themselves: their vocabulary had three outcomes -- reddened, did not redden, could not build it -- and the third defaulted to the pessimistic reading, so they reported a DESIGN SUCCESS in the language of a coverage gap.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "THE LIFETIME RULE, three findings in one: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; one that shapes WHAT TO BUILD NEXT belongs on the PBI; one whose only home is a MACHINE-FORMATTED FILE that cannot carry comments belongs in a TEST THAT ASSERTS IT -- the file carries the decision, the test carries the reason. COMPACTION may drop a recorded decision ONLY when it has such a home, and each compaction NAMES where every dropped decision went -- in the commit message, which is the AUDIT TRAIL for the move and never itself a home. AMENDED AT SPRINT 13 on measurement, once `tighten the wording` was shown to name a lever that does not exist (oxfmt puts each string on one line, so an improvement costs the same whatever it says and the only lever is fewer objects): active improvements MAY BE MERGED when they state ONE RULE, content preserved and provenance named; none may be dropped. And what gets SURFACED to the PO rather than merely recorded is the short list that can still evaporate -- drops whose home is NOT a permanent assertion, a comment at the site it constrains, or an active improvement.",
          timing: "immediate",
          status: "active",
          outcome:
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction. Filed after the Scrum Master raised the compaction half about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record. MERGED AT SPRINT 13, nothing dropped: absorbs the route-to-a-PBI sharpening (S9) and the machine-formatted-file corollary (S10), which were three statements of one rule. MERGED AT SPRINT 17: the S2 orphan-note rule is this rule's second clause made specific -- a note addressed to ANOTHER PBI is written onto THAT PBI when created, never left to be rescued at compaction. First application found a real orphan immediately: PBI-2 said `PBI-3 and PBI-4 widen it again`, PBI-3 carried its copy, PBI-4 carried nothing.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME, written into its `verification` TEXT: name the change that would make it fail, check that the verification can DISCRIMINATE the property claimed, and check that nothing else in the record contradicts it. If no change would make it fail, the criterion is VACUOUS and must be rewritten before it binds. SHARPENED AT SPRINT 15, and it does not over-delete useful redundancy: A CONTROL THAT CAN NEVER BE THE FIRST THING TO FAIL IS NOT A CONTROL -- ask whether something else would have failed first. Two tests reddening on one bug is fine; a test that reddens only after another already has adds nothing. IT READS IN BOTH DIRECTIONS, added at Sprint 16 with the guard that stops it becoming a licence: one that WOULD be first to fail is worth ADDING when the existing detection is real but ARRIVES WITHOUT NAMING ITS CAUSE. Gating exit cleared that bar -- a genuine detection that named nothing and cost two minutes of hang; most gaps will not.",
          timing: "immediate",
          status: "active",
          outcome:
            "MERGED AT SPRINT 13 from three statements of one rule, nothing dropped. S9: the absence-pairing rule moved from assertions to criteria and from execution to refinement. S10: the verification field travels with the criterion through every compaction, where a plan evaporates at Review -- so the control lives there, not in the plan's perturbations. S10: PBI-7's criterion 1 was a runtime test for a compile-time property contradicted by its own note. S15: a test calling runTsc(repoRoot) -- which IS the DoD's own tsc --noEmit -- was DELETED before the tag, since it could not fail unless the DoD had already failed. AND THE TRIGGER FOR SOMETHING STRUCTURAL, stated rather than left to be derived: a control has now twice been found to fire for the WRONG CAUSE -- skipLibCheck at S10, a dependency-removal control at S15 -- both caught by their author BEFORE the result was recorded. Twice caught in time is the rule set composing; ONCE RECORDED would be a false proof closing a question, which is the highest-cost error in this project's economy.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. ADDED AT SPRINT 18: A COMMENT ASSERTING CURRENT BEHAVIOUR STATES WHETHER AN ASSERTION BACKS IT -- three site comments were found claiming things nothing checked, each reddening nothing on first attempt. It targets the BIRTH defect, prose that was never checked, where the standing prose item targets DRIFT, prose that became false; and it is bounded at write time rather than requiring perpetual re-perturbation, which would be claim-extraction wearing a review practice.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed at the Developer's request after they named it at second occurrence. Its S13 STRENGTHENING lives separately: a claim about what the suite covers may not take the `reasoned` option this rule allows.",
        },
      ],
    },
    {
      sprint: 7,
      improvements: [
        {
          action: "A behaviour is pinned by a test where ONE outcome is required.",
          timing: "sprint",
          status: "active",
          outcome:
            "A bounding condition on seven sprints of pin-everything pressure, whose cost is already visible: PBI-9 carries three separate instances of hardcoded-response-id brittleness -- tests that resist legitimate change without defending a requirement.",
        },
      ],
    },
    {
      sprint: 6,
      improvements: [
        {
          action:
            "Every assertion that something is ABSENT -- zero stderr, zero $/progress, a label not on stdout -- ships with a PAIRED assertion, permanent in the suite, that the same measurement observes it when present.",
          timing: "immediate",
          status: "active",
          outcome: "Generalises what the PO had been imposing by hand criterion by criterion.",
        },
        {
          action:
            "A perturbation specified by the PRODUCT OWNER names the assertion it is required to flip, not just the mutation to make.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed separately from the perturbation-LABELLING rule on purpose: that one governs how the Scrum Master REPORTS (reproduction versus independent, expected versus observed), this one governs how the PO AUTHORS.",
        },
      ],
    },
    {
      sprint: 5,
      improvements: [
        {
          action:
            "A helper that terminates a subprocess must settle every promise it owns before the process dies. Cross-test misattribution is a suite-integrity failure, not a single-test bug.",
          timing: "immediate",
          status: "active",
          outcome:
            "Fixed in Sprint 5; recorded so the shape is recognisable if PBI-9's helper work recurs it.",
        },
        {
          action:
            "Standing item 6, AMENDED at Sprint 13 (no exception carved -- exceptions rot): the stakeholder-facing example is EXECUTED by the suite -- the config is loaded and driven, and a change that breaks it must redden a named assertion. It need NOT be the config that carries every property assertion; purpose-built configs may.",
          timing: "immediate",
          status: "active",
          outcome:
            "TWO negative controls, named separately because they are different failures: breaking its IMPORT must redden (the Sprint 9 case), and breaking a HANDLER'S RETURN must redden. Supersedes the with-no-fixture-copy-in-existence wording, which forbade purpose-built fixtures rather than forbidding an unexecuted example.",
        },
      ],
    },
    {
      sprint: 4,
      improvements: [
        {
          action:
            "PERTURBATION DISCIPLINE, one rule: anything not perturbed is assumed UNPROVEN; every subtask declares expected-RED or born-green; every perturbation is named by the ASSERTION it flips, not by the subtask it belongs to. If it flips at an EARLIER assertion than the subtask's headline claim, PREFER SPLITTING OVER DOCUMENTING -- the earlier flip is a signal that the test BUNDLES independent sub-claims, and splitting DISSOLVES what a note would only describe.",
          timing: "immediate",
          status: "active",
          outcome:
            "MERGED AT SPRINT 14 from two statements of one rule, nothing dropped, and the second was always a corollary of the first's last clause. The base rule had ALREADY been amended three times, which is its own signal: a rule list nobody can hold in their head stops being applied at exactly the moment it is needed -- which is the argument for merging rather than against it.",
        },
        {
          action:
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new.",
          timing: "immediate",
          status: "active",
          outcome:
            "Nine items where three carried new information diluted the signal the item-by-item rule exists to protect. MERGED AT SPRINT 17 from the S1 timing rule, one rule about one artifact: the checklist is ISSUED AT PLANNING rather than at Review, so the plan can target it.",
        },
      ],
    },
    {
      sprint: 3,
      improvements: [
        {
          action:
            "A Review perturbation states whether it REPRODUCES the Developer's recorded perturbation or is INDEPENDENT.",
          timing: "sprint",
          status: "active",
          outcome:
            "Prompted by a Review perturbation reddening 6 tests where the Developer's reddened 2.",
        },
      ],
    },
    {
      sprint: 2,
      improvements: [
        {
          action:
            "When a planning spike produces passing code, ATTACH it for the executor to start from -- the plan then says what to change about it instead of re-deriving it in prose -- and the attachment must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask.",
          timing: "sprint",
          status: "active",
          outcome:
            "MERGED AT SPRINT 13 from the S1 attach rule and the S2 durability rule, nothing dropped.",
        },
      ],
    },
    {
      sprint: 1,
      improvements: [],
    },
  ],
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
