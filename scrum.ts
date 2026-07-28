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
      id: "PBI-22",
      story: {
        role: "tsudoi maintainer",
        capability: "register a notification without being able to sidestep the router entirely",
        benefit: "the gate cannot be avoided by not using the thing that applies it",
      },
      acceptance_criteria: [
        {
          criterion:
            "A call to onNotification outside the router is a COMPILE ERROR, whatever the variable is called",
          verification:
            'startServer holds `Omit<ProtocolConnection, "onNotification">`; a probe binding that type and calling onNotification FAILS tsc while one calling onRequest PASSES -- both halves, since a firing-half-only probe would pass a type that forbids everything. AND RENAME-INDEPENDENCE ASSERTED RATHER THAN INFERRED: a probe binding the narrowed type under a DIFFERENT variable name still fails. That is the property that DECIDED the route, so without it the route\'s whole justification sits unpinned and nothing distinguishes it from the name-based rule rejected below',
        },
      ],
      status: "ready",
      notes: [
        "THE LINT ROUTE IS DECLINED WITH ITS MEASUREMENT, so nobody re-proposes it from this PBI's original wording: oxlint 1.73.0 does not merely fail to MATCH on `no-restricted-syntax`, it FAILS TO PARSE THE CONFIG -- the instrument the criterion originally named does not exist. `no-restricted-properties` works with PBI-6's override shape but matches the IDENTIFIER `connection`, so `const conn = connection` walks straight past it.",
        "AND THE ROUTE WAS CHOSEN ON VALUE, NOT PREFERENCE: this PBI exists because PBI-18 forecloses bypass WITHIN the router and not OF it, and a guard a rename evades forecloses NOTHING -- it notices some bypasses. Choosing it would ship a criterion claiming less than the story above it. THE PO NAMED THE GENERALISATION: a route whose criterion must DISCLAIM MOST OF ITS OWN VALUE is a route the disclaimer is telling you about, which makes the claim-the-actual-boundary rule a ROUTE-SELECTION signal and not only a wording discipline.",
        "THE COST, MEASURED NOT TO CONTORT: foreclosure needs src/server.ts never to BIND the wide type, since narrowing afterwards leaves the wide value in scope -- so connection creation moves into the module that owns the notification table. tsc exits 0 with onRequest, sendProgress and listen intact. CONFIRM THE Omit REMAINDER against what src/server.ts actually uses: a missing method would surface as a CONTORTION rather than a clean narrowing, and that is the signal to stop.",
        "A RESIDUAL NAMED RATHER THAN GUARDED: the type forecloses the call only while NO WIDE VALUE IS IN SCOPE -- importing createProtocolConnection directly in src/server.ts restores it. THIS IS A SECOND GAP, NOT A SECOND GUARD ON THE SAME ONE, so the PBI-18 argument against two guards does not forbid closing it later. What would close it: A LINT ON THE IMPORT SPECIFIER, which cannot be renamed away the way a variable can -- the lint route reappearing at a target where it actually works.",
        "A GAP IN WORK THE PO ACCEPTED, found by asking what comes next rather than by anything reddening: PBI-18 forecloses bypass WITHIN the router -- an entry that decides no gate does not type-check -- but NOT bypass OF it. A future edit calling connection.onNotification directly answers to nothing. The foreclosure endorsed at Sprint 16 is partial, and src/notifications.ts says so at its own site. NO TYPE CAN DO THIS, which is why it is a lint rule rather than more of what PBI-18 built. It is PBI-6's shape, and PBI-6 is the precedent that the codebase itself rejects the changes that would quietly break a promise. CONDITIONALLY ORDERED: after PBI-21 because that harm is present-tense while this needs future notification work that is not scheduled -- but BEFORE any new notification work, whenever that arrives.",
      ],
    },
  ],

  completed: [
    {
      number: 20,
      pbi_id: "PBI-21",
      goal: "Stop mangling a spaced filename when a user completes over one -- so their own replace setting does what they set it to.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "328 tests green from 323, each DoD command run separately with its exit read directly. The rule: extend the REPLACE end only when the line already carries this candidate verbatim from the fragment start, and only UPWARDS.",
        "THE MEASUREMENT THE PO MADE EXECUTION'S FIRST STEP HELD, DRIVEN IN THE STAKEHOLDER'S OWN STACK -- their nvim, their config, their confirmBehavior: replace, with a throwaway server handing ddc ONE hand-built item so the question was asked with no remedy in existence. Extended end 14 turns `spaced (1).old` into `spaced (1).new`; today's end 6 turns it into `spaced (1).new (1).old`, reproducing the report END TO END, which is what makes the positive result evidence rather than a line that never moved. createSelectText's truncation was observed BESIDE it in the same run -- word `spaced`, abbr the full name -- so the two paths are confirmed by observation rather than by reading source.",
        "THE PROBE'S FIRST DESIGN WAS REJECTED BEFORE IT RECORDED ANYTHING, and this is the degeneracy check applied to a MEASUREMENT'S DESIGN rather than to a test: with a candidate equal to the line's own text, `the extended range was honoured` and `ddc inserted its truncated word and did nothing else` produce THE SAME LINE. `(1).old` to `(1).new` gives three outcomes and three distinct lines.",
        "A HAZARD THE PLAN DID NOT CARRY, and it FALSIFIES the can-never-be-worse criterion if unhandled: fragment.start + candidate.length can land BELOW fragment.end, so completing `fo` to `foo` on a line reading `foo.txt` pulls the end from 7 back to 3 and leaves `.txt` behind -- WORSE THAN TODAY, ON A LINE WITH NO SPACE AT ALL, which is the opposite of where anyone was looking. THE PO'S SPECIFIED CASE COULD NOT CATCH IT: `spaced (2).txt` exercises the DECLINE branch and the hazard lives in the EXTEND branch. They named it as their own rule pointing at its author -- a mechanism stated where the rule says state a property.",
        "FORECLOSED, and the PO ruled why their own Sprint 16 precedent does NOT transfer: an end-to-end confirm of the real example's item cannot discriminate, because the rule fires only when the deleted span EQUALS newText, so honoured and not-honoured produce the same line. At Sprint 16 the gate choice was genuinely UNVERIFIED -- write it wrong and it would BE wrong, unseen. Here there is nothing to be wrong about, so NOT CONSTRUCTED would mislead in the opposite direction: the design forecloses the HARM, not merely the observation. NOT CONSTRUCTED separately: the truncation-plus-long-range INTERACTION, both halves seen in one run, residual named as a client whose truncation feeds its own confirm.",
        "BORN GREEN MEASURED AT AUTHORING TIME FOR FOUR TESTS -- written, run against the UNCHANGED module where they passed, and committed FIRST because they share a file with the red one. Sprint 19's method generalising from one test to a practice.",
        "A CLAIM OF THEIR OWN THAT WAS BACKED AND STILL UNCHECKED, the exact shape carried to the last Retrospective and acted on inside one sprint: the site comment named three lines the relaxed comparisons would write, while the tests behind it assert range ENDS. Strings dressed as record. Each relaxation was then driven and the line read; all three held.",
        "PINNED THAT THE UNFIXED CASE IS UNFIXED: `spaced (2).txt` STILL MANGLES and a test says so. That is what makes the narrowed criterion honest rather than merely narrower -- it records the boundary instead of leaving it to whoever hits it.",
      ],
    },
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
        "THE TWO-TEST RULING MEASURED, and the GREEN cells are the load-bearing half: the pre-sprint remove-all filter reddens the SEQUENTIAL test and leaves the BATCHED one green; a dedupe of the removed array does the exact reverse. NEITHER CONTROL COVERS BOTH. The granularity rule's first real application, arriving on its own terms one sprint after being filed. BORN-GREEN REPORTING DONE AS A MEASUREMENT RATHER THAN A LABEL, and it is the first time anyone here sequenced COMMITS to make a claim checkable: the batched test was written and run against UNCHANGED src/ where it passed, and committed FIRST -- both tests share a file, so a born-green claim made after the fix landed would have been unmeasurable.",
        "THIS SPRINT DISARMED A CONTROL OF PBI-17'S, and repairing it is the subtraction rule applying BY EFFECT: trailing-slash normalisation used to redden the exact-match test and afterwards reddened NOTHING across 321 tests -- behaviour unchanged, defence gone. Re-armed before the tag by naming the NON-FIRST spelling in the removal, since with the first named one-copy-per-entry lands on the intended target either way. A PRE-EXISTING GAP REVEALED AND CLOSED OPPORTUNISTICALLY, named that way so it does not read as scope creep: nothing has EVER defended removed-before-added -- applying `added` first reddened nothing across 321 tests, nor across the 317 predating this sprint. Pinned because the PO ruled it ONE REQUIRED OUTCOME at Sprint 17 and a one-test PBI is disproportionate. THE FIRST ATTEMPT AT THAT TEST DID NOT DISCRIMINATE: pre-adding the folder makes the two orders AGREE under one-copy-per-entry, so the test starts from an EMPTY list.",
        "UNPINNED AND MEASURED RATHER THAN ASSUMED: findLastIndex instead of findIndex reddens NOTHING in 321, so WHICH copy an entry takes is not pinned. The client said remove one and did not say which; two defensible outcomes, recorded rather than fixed. SPRINT 17'S RECORD DROPPED AT SPRINT 20, homes checked: the mirror-don't-normalise principle and its nvim measurement are at src/workspace.ts, the per-request capture ruling is at src/types.ts, and the remove-all deviation became PBI-20 which is now done. SPRINT 16'S RECORD DROPPED AT SPRINT 19, homes checked: the baseline measurement that two of three gate copies were pure convention is at src/notifications.ts, the only place it survives; the exit carve-out is asserted as a value in test/notifications.test.ts; and the disarmed-control finding became the re-run improvement's second rationale. Sprint 10's npm impediment rides here, still open and still the only unverified step in the product goal. Shipped in 9def17f, 87db56c, 2a90e78, aba57c9, 0ef93a9 and 9cadcad. 323 tests green from 317, each DoD command run separately with its exit read directly.",
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
    number: 21,
    pbi_id: "PBI-22",
    goal: "Make a notification handler unregisterable outside the router -- so the gate cannot be avoided by not using the thing that applies it.",
    status: "in_progress",
    subtasks: [
      {
        test: "N/A (structural, and it comes first)",
        implementation:
          'createGatedConnection(reader, writer, logger, lifecycle, entries): RequestOnlyConnection in src/notifications.ts -- creates the connection, registers the notification table, and hands back `Omit<ProtocolConnection, "onNotification">`. startServer never binds the wide type. CONFIRM THE REMAINDER against what src/server.ts actually uses BEFORE building: a missing method is a CONTORTION rather than a clean narrowing, and that is the signal to STOP and hand back.',
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "c771080",
            message: "refactor: hand back a connection that has no onNotification to call",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE MODULE THAT OWNS THE GATE OWNS THE THING BEING GATED -- better structure on its own terms, which is why this is tidy-first rather than a cost paid for the type.",
          'THE STOP CONDITION WAS RUN AS A MEASUREMENT BEFORE ANY src/ EDIT, not as reasoning about how Omit treats a mapped type: a throwaway source binding `Omit<ProtocolConnection, "onNotification">` and calling onRequest WITH params, onRequest WITHOUT params, sendProgress and listen compiles at tsc exit 0 with NO cast and NO helper. The control on the probe itself: adding an onNotification call to that same source exits 1 with TS2551. NO CONTORTION, so no handback. Worth measuring rather than reasoning: onRequest carries five overloads.',
          "registerMethods NARROWED TOO, and the judgement that this is propagation rather than a workaround is REASONED from the PO's own measurement: sendProgress appears nowhere in src/server.ts -- it is at src/methods.ts:376 -- so the trio measured reachable already spans both files, which is only true if the remainder was measured with methods.ts narrowed. Its own reason stands without that: methods.ts registers REQUESTS, so an onNotification on its parameter would be a second door out of the router in the one other file handed the connection.",
          "A CLAIM OF OURS THAT THIS SPRINT MADE FALSE, rewritten in the commit that falsified it: src/notifications.ts said a direct onNotification bypass needs a lint rule and that NO TYPE CAN DO IT. THE SAME PHRASE IS STILL LIVE ON PBI-22's NOTE 5 and is the Scrum Master's field, not this one.",
        ],
      },
      {
        test: "A source binding the narrowed type and calling onNotification fails tsc; one calling onRequest passes",
        implementation: "typeCheckProbe, BOTH HALVES in one run.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "8c391db",
            message: "test: assert the narrowing forbids one member and only that one",
            phase: "green",
          },
          {
            hash: "04fa547",
            message: "test: assert what the FACTORY hands back, not only what the type means",
            phase: "green",
          },
        ],
        notes: [
          "A FIRING-HALF-ONLY PROBE WOULD PASS A TYPE THAT FORBIDS EVERYTHING, which is the same shape as a lint probe that only checks the file where the rule must fire.",
          "AND THAT HAZARD WAS DRIVEN RATHER THAN ARGUED: `Omit<ProtocolConnection, keyof ProtocolConnection>` leaves the FIRST assertion passing -- onNotification is still absent -- and flips the SECOND, which is the permitted half. So the hazard is reached instead of being hidden behind an earlier flip, which is what the one-hazard-one-test rule exists to secure.",
          "THE PRE-SPRINT RUN IS THE REAL NEGATIVE CONTROL AND IT CAUGHT A WRONG CAUSE BEFORE ANYTHING WAS RECORDED: against unchanged src/ all three probes fail with TS2305, `no exported member RequestOnlyConnection`, EXIT 1. A probe asserting only a non-zero exit would have gone GREEN there, against a module with no narrowing at all. The regex binds the diagnostic to its FILE on one line, which is why it refused. Third instance in this project of a control firing for a cause it did not name, and the first prevented by the assertion's design rather than caught at review.",
          "BORN GREEN WITH RESPECT TO src/ AT c771080, stated with its boundary because unqualified it would read as a claim against pre-sprint src/, which the paragraph above shows is false.",
          "SINGLE OBSERVER, DISCLOSED AT THE TIME RATHER THAN LEFT FOR REVIEW TO INFER: every perturbation in this sprint was authored and run by the same agent. Sprint 14's entry is explicit that `INDEPENDENT` goes vacuous in exactly this situation while still reading as reassurance, so nothing here is labelled that way. All five perturbations are reproducible from the notes.",
          "A WEAKNESS NOBODY ASKED ABOUT, and it is the S15 shape: THE PERMITTED HALF CANNOT BE THE FIRST THING TO FAIL IN ISOLATION. Every perturbation that flips it removes a member src/server.ts or src/methods.ts actually calls, so the DoD's own `tsc --noEmit` fails too and names the same cause -- MEASURED under the forbids-everything perturbation, which reddens src/methods.ts and src/server.ts by name. It survives on two grounds and NEITHER IS `it feels useful`: bun test runs BEFORE tsc in the DoD, so in the sequence as run it IS first; and the coverage it duplicates is INCIDENTAL, holding only while src/ happens to call onRequest. NOT DELETED, because the PO required both halves and withdrawing a defence of an accepted criterion is a scope decision.",
        ],
      },
      {
        test: "The same failure under a DIFFERENT variable name",
        implementation: "Born green by construction -- the type matches on the type, not the name.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "8c391db",
            message: "test: assert the narrowing forbids one member and only that one",
            phase: "green",
          },
        ],
        notes: [
          "THIS IS THE PROPERTY THAT DECIDED THE ROUTE, so it is asserted rather than inferred: without it the route's whole justification sits unpinned and nothing distinguishes it from the name-based lint rule that was rejected.",
          "THE ALIAS IS NOT AN ARBITRARY RENAME. The probe drives `const conn = connection` and calls through `conn` -- the EXACT shape measured at refinement to walk straight past no-restricted-properties. So the assertion is aimed at the recorded evasion rather than at a different name chosen for the sake of being different.",
          "FORECLOSED, not NOT CONSTRUCTED, and the distinction is Sprint 20's: no perturbation reddens this probe while leaving the same-shaped `connection`-named probe green, because a type cannot read an identifier -- there is nothing here to be wrong about, so NOT CONSTRUCTED would report a design success in the language of a coverage gap. WHAT WOULD UN-FORECLOSE IT: adopting a guard that matches identifiers, which is the rejected no-restricted-properties route. AND THE PAIR IS NOT REDUNDANT UNDER THE FIRST-TO-FAIL RULE even though both flip together: they name DIFFERENT CAUSES -- `the narrowing works` and `the narrowing is name-blind` -- which is the S16 clause that keeps a control naming its own cause.",
        ],
      },
      {
        test: "N/A (prose, same commit)",
        implementation:
          "Name the residual at the site: the type forecloses only while no wide value is in scope, and importing createProtocolConnection directly restores it. Record that A LINT ON THE IMPORT SPECIFIER would close it -- the lint route at a target where it works, since a specifier cannot be renamed away.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "c771080",
            message: "refactor: hand back a connection that has no onNotification to call",
            phase: "refactoring",
          },
          {
            hash: "c81327a",
            message: "docs: put a number on the residual instead of an adjective",
            phase: "refactoring",
          },
          {
            hash: "04fa547",
            message: "test: assert what the FACTORY hands back, not only what the type means",
            phase: "green",
          },
        ],
        notes: [
          "THE RESIDUAL IS MEASURED RATHER THAN REASONED, and the number is what makes it a record instead of an adjective: src/server.ts was rewritten to import createProtocolConnection, register the table on the WIDE value, call an UNGATED onNotification beside it and narrow only afterwards. 331 tests green, tsc 0, oxlint 0. NOTHING DETECTS IT.",
          "A NOT-CONSTRUCTED LABEL OF MINE THAT WAS FALSE, corrected before the sprint closed and worth more than the thing it mislabelled: I wrote that `startServer holds the narrowed type` was carried by nothing executable. That bundled TWO seams. Only the IMPORT is beyond a type. THE OTHER WAS A REAL HOLE: widening createGatedConnection's RETURN ANNOTATION while leaving the alias untouched left all three probes green, tsc 0, 331 passing -- and an ungated `connection.onNotification` added to src/server.ts COMPILED. Foreclosure entirely gone, nothing saying so. Sprint 11's rule running in REVERSE, reporting a closable gap as unclosable, and Sprint 13's coverage-claim rule is what catches it: a claim that the suite does not defend something is a coverage claim and gets checked.",
          "CLOSED in 04fa547 by a fourth probe that takes its connection FROM THE FACTORY. It has a perturbation of its own -- the return annotation reddens it and ONLY it, 1 of 332 -- which is what earns it a place beside the three that flip together. THE REVERSE DIRECTION, recorded rather than left for Review: widening the alias reddens all four, so this probe STRICTLY DOMINATES the other three. They are not deleted, because the accepted criterion names `a probe binding that type` and withdrawing a defence of an accepted criterion is a scope decision.",
          "A THIRD GAP FOUND WHILE CONFIRMING THE REMAINDER AND DELIBERATELY LEFT OPEN: `onUnhandledNotification` SURVIVES the Omit and is an ungated way to see notification traffic -- weaker, since it fires only for messages nothing registered and carries no per-method dispatch, but real. Not added to the Omit: the accepted criterion is scoped to onNotification, and widening it mid-sprint trades a reviewed boundary for an unreviewed one. NO ASSERTION BACKS THAT SENTENCE and it says so in place, so what is at risk if it rots is its own accuracy and nothing else. `sendNotification` survives too and is NOT a gap -- that is sending, not installing a handler.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE PO'S CHECKLIST: (1) both halves of the type probe; (2) rename-independence asserted rather than inferred; (3) the residual named at the site with the import-specifier lint recorded as its future closure.",
      "FOUR MEASUREMENTS BEFORE ANY CODE, and the criterion changed as a result rather than the implementation bending to fit it: the named instrument DOES NOT PARSE, a working alternative exists, its boundary is a rename, and a better route was measured NOT to contort.",
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
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME, written into its `verification` TEXT: name the change that would make it fail, check that the verification can DISCRIMINATE the property claimed, and check that nothing else in the record contradicts it. If no change would make it fail, the criterion is VACUOUS and must be rewritten before it binds. WIDENED AT SPRINT 20 rather than filed as a new entry, because it is a COVERAGE GAP IN THIS RULE'S SUBJECT and not a precondition for it -- the distinction that made the granularity finding its own entry: THIS REACHES ANY OBSERVATION INTENDED TO DISTINGUISH STATES, INCLUDING A PROBE DESIGNED BEFORE THE CODE EXISTS. IF TWO OUTCOMES PRODUCE THE SAME OBSERVATION, THE MEASUREMENT RECORDS NOTHING. Found when a probe's first design was rejected before it recorded anything: with a candidate equal to the line's own text, `the extended range was honoured` and `ddc inserted its truncated word and did nothing else` produce THE SAME LINE. SHARPENED AT SPRINT 15, and it does not over-delete useful redundancy: A CONTROL THAT CAN NEVER BE THE FIRST THING TO FAIL IS NOT A CONTROL -- ask whether something else would have failed first. Two tests reddening on one bug is fine; a test that reddens only after another already has adds nothing. IT READS IN BOTH DIRECTIONS, added at Sprint 16 with the guard that stops it becoming a licence: one that WOULD be first to fail is worth ADDING when the existing detection is real but ARRIVES WITHOUT NAMING ITS CAUSE. Gating exit cleared that bar -- a genuine detection that named nothing and cost two minutes of hang; most gaps will not.",
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
