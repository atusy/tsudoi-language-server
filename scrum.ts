// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). Raised from 500 by the
// stakeholder: this dashboard carries measured rulings and the reasons
// they were overturned, which is content git history cannot substitute
// for while the decision is still live.
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
      id: "PBI-35",
      story: {
        role: "tsudoi maintainer",
        capability: "clone this repository, run bun install, and have bun test pass",
        benefit: "a first run is green rather than red-with-a-remedy",
      },
      acceptance_criteria: [
        {
          criterion:
            "STALENESS MUST BE IMPOSSIBLE, NOT MERELY HANDLED: edit src/, run the suite with NO EXPLICIT BUILD, and assert the tests SEE THE NEW SOURCE.",
          verification:
            "THE REAL GATE, AND IT CAN WITHDRAW THE AUTHORISATION BELOW. If the build is SKIPPABLE -- a pretest hook a single-file run bypasses -- staleness is STILL REACHABLE and THE DETECTOR WAS LOAD-BEARING, in which case the deletion is withdrawn and the PBI RETURNS TO THE PO. That is the discriminating check that makes the authorisation SAFE RATHER THAN OPTIMISTIC.",
        },
        {
          criterion:
            "AUTHORISED IN ADVANCE BY THE PO: DELETE THE STALE-DIST DETECTOR, classified TARGET DELIBERATELY REMOVED.",
          verification:
            "under an automatic build the staleness it watches CANNOT ARISE, so this is not lost coverage. NO READINESS GATE IS NEEDED because NO MEASUREMENT WOULD CHANGE THE PBI'S SHAPE -- the table's gate existed because its JUSTIFICATION was unmeasured, whereas here the justification was MEASURED at Sprint 25 (30 fail on a fresh clone) and the fourth way was REFUTED by measurement. What was unsettled is A SCOPE DECISION, which S16 routes to the PO -- so it is RULED rather than deferred into the PBI, which is exactly what Sprint 25 refused to let a fix do.",
        },
        {
          criterion: "@atusy/tsudoi/types resolves in-repo without a manual build.",
          verification:
            "MEASURED at Sprint 25: with dist/ absent, bun test gives 30 fail / 299 pass, the first failure naming dist/types.js imported from examples/completion-path.ts.",
        },
      ],
      status: "ready",
      notes: [
        "ELIGIBLE BECAUSE NOTHING BETTER EXISTS, per the Sprint-29 ruling that its three triggers govern URGENCY, NOT PERMISSION. None has fired.",
        "LAST OF THE THREE: largest surface (build, detector, README), and THE ONLY ONE CARRYING AN AUTHORISATION THAT CAN BE WITHDRAWN BY ITS OWN GATE.",
        "THE GATE FIRED AND WITHDREW THE AUTHORISATION AT SPRINT 40, AND THIS NOTE IS THE HANDBACK RATHER THAN AN ACCEPTANCE. MEASURED: every `bun test` form run FROM THE REPOSITORY ROOT preloads the build exactly once, so the single-file bypass the criterion named does not exist -- but bun resolves bunfig.toml against the CURRENT WORKING DIRECTORY and never searches upward, so `cd test && bun test` RUNS all 444 tests with no build and 442 of them PASS. CRITERION 3 IS MET AND SHIPPED (a dist/-less tree goes from 47 fail / 362 pass to 444 pass with no build command anywhere); CRITERION 2'S DELETION IS NOT DONE, because criterion 1 says a skippable build means the detector was load-bearing. WHAT THE PO OWNS NOW: whether the cwd route is acceptable, whether the detector is permanent, or whether this wants a mechanism that does not exist here -- a second bunfig.toml under test/ covers one directory out of an unbounded set, so more of the same does not close it.",
      ],
    },
  ],

  completed: [
    {
      number: 39,
      pbi_id: "PBI-42",
      goal: "THE FIXTURE'S COVERAGE BECOMES A COMPILE-TIME PROPERTY, AND THE ANSWERS STAY UNDEFENDED ON PURPOSE. test/fixtures/all-methods.ts annotates its handler literal over `Method` so a method `MethodMap` declares and this fixture omits IS TS2741 -- the same error `requestEntries` already produces, no assertions, growing with the table by construction. THE TITLE IS NOT THE CRITERION: `defend every handler` would be FIVE NEAR-IDENTICAL TESTS that resist legitimate fixture changes without defending a requirement, and the PO ruled it out; the risk is not a wrong answer but THE FIXTURE SILENTLY STOPPING SHORT OF A METHOD while tests that believe they exercise five exercise four and stay green. So criterion 2 is A RULING TO RECORD RATHER THAN WORK TO DO, and it goes at the fixture BECAUSE OTHERWISE THE NEXT PERSON MEASURES THE SAME ZERO AND FILES THE SAME PBI.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE WHOLE INCREMENT IS ONE CLAUSE -- `satisfies { [M in Method]: MethodHandler<M> }` -- plus two names on an existing import and prose. 444 green and 1266 expect() calls UNCHANGED, which is what this criterion's correct answer looks like: the property is one THE COMPILER checks.",
        "THE ROOT CAUSE IS THE MOST DURABLE THING HERE: src/types.ts declares `methods?: Partial<...>`, WHICH IS CORRECT FOR A CONFIG AUTHOR -- and that is exactly why THE ONE CONFIG THAT MUST SERVE EVERY METHOD WAS ENFORCING NOTHING. A DEFECT THAT FOLLOWS FROM A CORRECT DECISION ELSEWHERE IS THE HARDEST KIND TO FIND BY READING, and recording it is what stops someone `fixing` the published type later.",
        "BOTH HALVES RE-RUN AGAINST THE SHIPPED FORM, PLUS A PRE-EDIT CONTROL: a probe method in MethodMap AND requestEntries with no fixture handler gives TS2741 REPORTED AT THE FIXTURE AND NAMING THE METHOD; adding the handler gives exit 0; and the same probe against the UN-ANNOTATED fixture left tsc at 0 WITH NO ERRORS ANYWHERE -- THE PROPERTY GENUINELY DID NOT EXIST. The control is what makes half 1 mean something.",
        "A FIFTH DEGENERACY LOCATION, FOUND UNPROMPTED: THE TYPE ANNOTATION ITSELF. Record<Method, MethodHandler<Method>> would deliver exhaustiveness WHILE ACCEPTING HOVER'S HANDLER IN COMPLETION'S SLOT -- presence without per-method typing, which is Sprint 32's mis-keyed-entry hazard RE-INTRODUCED THROUGH THE BACK DOOR. Caught by applying the Sprint-38 serialiser standard TO A TYPE RATHER THAN TO DATA. The locations are now assertion, control, probe, serialiser, ANNOTATION.",
        "NOT A FIFTH OUTCOME, and the executor's reading is confirmed: the annotation makes Sprint 35's recorded perturbations FAIL TO COMPILE, but those re-runs went AS RECORDED because neither runtime type-checks. THE FOUR-OUTCOME VOCABULARY ANSWERS ONE QUESTION -- why did a standing re-run go GREEN -- and that question is never triggered here. ONLY THE PRICE MOVED: an edit that cost nothing now costs a DoD check. THE PRINCIPLE, worth stating because it will be needed again: A VOCABULARY ANSWERS ONE QUESTION, AND AN OBSERVATION THAT DOES NOT ANSWER THAT QUESTION DOES NOT JOIN IT, HOWEVER ADJACENT. RE-MEASURING BEFORE WRITING IT DOWN is what made the ruling available at all.",
        "THE FORM WAS CHOSEN BY MEASUREMENT WITH THE CRITERION AS TIEBREAK: a hoisted const and the inline satisfies produce THE IDENTICAL TS2741 AT THE IDENTICAL SITE, so `one line` decided it. THE CORRECT USE OF A CRITERION -- to break a tie that measurement declared even, NOT to substitute for measuring.",
        "TWO LAPSES, BOTH SELF-CAUGHT. The edit removed the PBI-42 mention and left a paragraph saying `the shape this PBI exists to retire` WITH NO ANTECEDENT; their own grep returned zero hits and they READ ZERO AS CLEAN rather than as THE REFERENT WAS JUST DELETED. And a staleness note first GENERALISED FOUR BULLETS FROM ONE RUN -- the tsc half follows from the mapped type, but `unchanged` is a RUNTIME claim, so the only bullet whose recorded result is not green was RE-RUN rather than reasoned.",
        "DECLINED WITH THE COST NAMED: no five-keys test, because A COUNT-AS-DESCRIPTION WOULD PASS ON A TABLE SHRUNK TO FIVE WRONG METHODS -- the Sprint-36 distinction applied BY SOMEONE ELSE to reject a test the PO might have accepted. Four exported answer constants that nothing imports were REPORTED RATHER THAN TIDIED: tidying while reporting is how scope quietly grows.",
        "THE PBI WAS SMALLER THAN ITS TITLE AND IS REPORTED THAT WAY RATHER THAN PADDED. A one-clause increment that establishes a COMPILE-TIME property is a good outcome, not a thin one.",
      ],
    },
    {
      number: 38,
      pbi_id: "PBI-43",
      goal: "THE HAZARD STOPS EXISTING RATHER THAN STAYING OBSERVABLE: `textDocument/completion`'s contributor MERGES into `completionProvider` instead of ASSIGNING a fresh object over it, so a contributor writing into a key another method owns no longer depends on being declared below that method's entry. CRITERION 1 IS THE PREMISE AND WAS MEASURED BEFORE ANY LINE WAS WRITTEN, with its own negative control. THE DELIVERABLE IS THAT SPRINT 34'S P1 GOES GREEN, classified in advance as TARGET DELIBERATELY REMOVED. NO NEW TEST SHIPS AND NO EXPECTED VALUE MOVES, so the increment is defended by perturbation rather than by an added assertion, and the prose that goes false is corrected WHEREVER THE CLAIM'S WORDS LIVE.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "444 green, 1266 expect() calls, unchanged. The ordering hazard is REMOVED rather than asserted about.",
        "CRITERION 3 WAS UNMEETABLE AND THE PO OWNS IT: they had ALREADY RECORDED at Sprint 34, IN THEIR OWN VERDICT, that P2 leaves the suite green BECAUSE COMPLETION CONTRIBUTES {} SO PRESERVING AND REPLACING ARE INDISTINGUISHABLE -- and then wrote a criterion requiring the merge to retire that debit. THE DEFENSIVE HALF CLOSED; THE UNDEFENDED HALF IS NOT CLOSABLE while completion contributes no key of its own, AND NEVER WAS. NO DEFECT IN THE INCREMENT; A DEFECT IN THE CRITERION. The executor met what was achievable, stated precisely what was not, and PREDICTED THE IMPOSSIBILITY IN THE COMMITTED PLAN so the report could not be fitted afterwards.",
        "RESIDUAL GIVEN AN EVIDENCE-SHAPED TRIGGER: the day completion contributes a key OF ITS OWN, P2 becomes constructible and the preservation becomes defended. Until then it is named at the type, and THE INDEX COMPARISON STAYS REFUSED -- now on stronger ground, since a merge makes ordering irrelevant and an index check would RESTATE A MECHANISM THAT NO LONGER MATTERS.",
        "`TARGET DELIBERATELY REMOVED` IS NOT `UNCONSTRUCTIBLE`, and the executor's refusal to write the latter SHARPENS THE SPRINT-35 VOCABULARY: THE EDIT REMAINS PERFECTLY WRITABLE AND COMPILES -- WHAT WAS REMOVED IS THE HAZARD, NOT THE PERTURBATION. The four outcomes were about WHY A STANDING RE-RUN GOES GREEN, and conflating `the hazard is gone` with `I could not build the probe` is exactly the confusion S11 was filed to prevent.",
        "P1-CONTROL IS WHAT MAKES P1'S GREEN MEAN ANYTHING: the same swap with the assignment restored reddens 4 on both runtimes. A GREEN WITH NO PAIRED OBSERVATION IS NOT A RESULT.",
        "CRITERION 1 -- THE PO'S HEDGE -- EARNED ITS PLACE, AND THE NEGATIVE CONTROL IS WHY. Measured over ALL 32 CONFIGS the five methods can form and ALL 120 ORDERS the contributors can run in: 0 of 32 disagree. THAT MEANS NOTHING WITHOUT the control taken BEFORE the merge existed -- 8 OF 32 DISAGREE, EXACTLY THE CONFIGS SUPPLYING BOTH. Taken before, not reconstructed after.",
        "THE DEGENERACY WAS IN THE INSTRUMENT, NOT THE RESULT, and was caught BEFORE IT RECORDED ANYTHING: JSON.stringify with a KEY ARRAY filters nested keys, so {resolveProvider: true} and {} SERIALISED IDENTICALLY -- the probe would have reported agreement across 120 orders WHILE MEASURING NOTHING. S20 has been applied to assertions, to controls and to probes; THIS IS THE FIRST TIME IT HAS HAD TO BE APPLIED TO A SERIALISER.",
        "A MEASUREMENT CAN GO STALE WITH NOBODY EDITING IT OR THE FILE IT DESCRIBES: `reddens ALONE` was TRUE at Sprint 34 and became false when SPRINT 37 GAVE THE DEMO CONFIG A RESOLVE HANDLER -- a later sprint changed the world the measurement described. NO GREP FINDS THIS. Only re-running the control does. Fifth distinct way the standing re-run has earned its keep, and THE FIRST WHERE THE TARGET WAS A MEASUREMENT RATHER THAN A CONTROL. Re-measured at four tests on both runtimes.",
        "THE SHARED HELPER WAS REFUSED WITH THE COST MEASURED RATHER THAN ARGUED: dropping its own spread leaves the suite green, SO IT BUYS A PHRASING RATHER THAN A PROPERTY.",
        "expect( DIFF: 0 ADDED, 0 REMOVED, 0 CHANGED, count unchanged at 1266 -- the cleanest possible reading of the Sprint-36 standard. Prose corrected WHERE THE CLAIM'S WORDS LIVE, including two TEST files falsified by a src EDIT TOUCHING NO LINE IN THEM; titles and filenames searched. Sprints 34 and 37's decisions LEFT ALONE, because those are past-tense measurements carrying provenance.",
        "A LAPSE DISCLOSED RATHER THAN QUIETLY UNDONE: the executor first CLOSED THE SPRINT ITSELF and deleted PBI-43 from the backlog. Reverted in its own commit and recorded as a decision. THE HARM THE EXECUTOR NAMED IS SHARPER THAN THE ROLE VIOLATION: deleting the PBI would have left WHAT EXECUTION STILL OWED only in git history -- the Lifetime Rule again, and THE THIRD TIME IN THIS THREAD IT HAS CAUGHT SOMETHING ON ITS OWN AUTHOR'S SIDE.",
      ],
    },
    {
      number: 37,
      pbi_id: "PBI-46",
      goal: "THE METHOD'S CANONICAL USE, SHOWN RATHER THAN LISTED: the demo config answers completionItem/resolve for a path item IT PRODUCED, with the detail that would have cost a stat per entry to fetch during completion -- size, mtime, dir-or-file. THE PAIRING THE HANDLER RESTS ON IS READ, NOT ASSUMED: src/types.ts rules that tsudoi keeps NO record of what a completion handler produced, so an unrecognised item MUST BE RETURNED UNCHANGED and the handler can only key off WHAT THE EXAMPLE ITSELF PUT ON THE ITEM -- which makes the marker a shared decision between the completion module and the resolve one, carried the way the trailing-whitespace pair carries its scanner: ONE definition imported, not two agreed by assertion. The pin in test/lifecycle.test.ts moves A SECOND TIME, deliberately and by criterion.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "444 green from 436, 31 files from 30. The resolve example enriches a path item with stat metadata, and THE SHIPPED TEST ASSERTS THE DEFERRAL DIRECTLY: detail is UNDEFINED on the completion answer and enriched after resolve.",
        "A STAKEHOLDER PROPOSAL WAS RULED AGAINST -- THE FIRST OF THREE -- and the ruling rests on a distinction the Scrum Master identified before the PO did: THE FIRST TWO MOVES CHANGED WHAT THE HANDLER COMPUTED (a trailing-whitespace formatter still formats), THIS ONE CHANGES WHETHER THE METHOD IS DOING ANY WORK AT ALL. MEASURED, not reasoned: itemsFrom builds its item literal with NO SYSCALL, so `detail: String(insertText.length)` is ONE EXPRESSION IN A LOOP THAT ALREADY RUNS -- while stat is A REAL SYSCALL PER ENTRY the completion module CANNOT pre-compute.",
        "AND THERE WAS NO SIMPLICITY TO GAIN, which is what made it easy rather than close: stat is ONE CALL, NO NEW DEPENDENCY, already measured on both runtimes. A character count is not smaller in lines, in dependencies, or in what a reader must install or understand. THE PREVIOUS TWO MOVES TRADED A PACKAGE AND A VERSION-FRAGILE CONTROL FOR GENUINE SIMPLICITY; THIS ONE TRADED MOTIVATION FOR NOTHING.",
        "THE FINDING THAT OUTRANKED THE PO'S OWN ARGUMENT: they said the second control would become UNCONSTRUCTIBLE, and measured it is worse -- THE PROPERTY DOES NOT EXIST. A count derives from `label`, which returns by protocol, so the module would import NOTHING from the completion module and criterion 3's `key off what IT PUT ON THE ITEM` would have NO REFERENT. Every item, foreign or not, gets a count. `Returned unchanged` IS NOT A PROPERTY THAT VERSION HAS. P3 is the evidence: removing the mark reddens the resolve assertions on both runtimes, and under a count THERE WOULD BE NOTHING FOR A P3 TO REMOVE.",
        "THE VACUITY FINDING, which the PO calls the most valuable thing in the report: `came back unchanged` is equally satisfied by the handler DECLINING it, by tsudoi ECHOING PARAMS, and by NO HANDLER BEING CALLED AT ALL -- so it measures nothing alone, only as the second half of a paired observation with enrichment first in the same session. S20 caught BEFORE it recorded anything, and P4 reddening ONLY the unrecognised-item test confirms the pairing is non-vacuous AND isolated.",
        "P2 AND P3 ARE INDISTINGUISHABLE -- RECORDED AS A RESIDUAL, NOT FIXED. The suite detects both and NAMES NEITHER: detection arriving without naming its cause. THE OBVIOUS REMEDY IS DECLINED, and consistently: an assertion naming the mark WOULD RESTATE THE MECHANISM, the same check refused for contributor ordering at Sprint 34. Accepted with the cost stated.",
        "THE NAMES RULE REFINED BY MEASUREMENT RATHER THAN BY THE PO: an extracted resolve handler demanded ZERO new published names, because params AND result are both CompletionItem. So `extraction demands names` is A PROPERTY OF THE SIGNATURE, not of extraction as such -- and `Stats` from node:fs is NODE'S TO PUBLISH, NOT TSUDOI'S. A better statement of the rule than the one written.",
        "A NEW PROSE-STALENESS CLASS: `the last two are a matched pair` is POSITIONAL, so it FALSIFIES ON APPEND with no edit to its own file. Distinct from Sprint 35's falsified-by-an-edit-elsewhere, and NEITHER IS REACHABLE BY READING THE FILE THAT CONTAINS THE CLAIM.",
        "THE HOLD ARRIVED AFTER THE INCREMENT WAS COMMITTED, reported plainly rather than softened. WHY IT WAS SURVIVABLE: THE INCREMENT WAS REVERTIBLE AS ONE UNIT -- plan and work in two commits that revert together -- which turned a missed hold into A DECISION RATHER THAN A MESS. AND THE ASYMMETRY IS RECORDED SO NOBODY CONCLUDES LATE HOLDS ARE CHEAP: the ruling cost nothing BECAUSE IT HAPPENED TO AGREE WITH WHAT SHIPPED. Had it gone the other way the cost would have been real, and paid for a preference the measurements then contradicted.",
        "FOUR PERTURBATIONS, 444 RAN IN ALL FOUR: P1 (import broken) 64 fail, DEFENDED EXPLICITLY NOT ISOLATED; P2 (unenriched return) 8 fail, exactly the four new assertions across two runtimes; P3 (mark removed) THE IDENTICAL SET; P4 (unmarked item enriched anyway) 2 FAIL, ONLY the unrecognised-item test.",
      ],
    },
    {
      number: 36,
      pbi_id: "PBI-44",
      goal: "THE MATCHED PAIR SHIPS AS ONE LOOP: the demo config reports per-line trailing whitespace and removes it, and the property that makes it a pair rather than two features is RANGE-FOR-RANGE CORRESPONDENCE, asserted over the wire. The sprint also pays a debt the hold exposed -- src/types.ts's published surface cannot express an EXTRACTED handler for either method, so the README's `module per method` is a pattern tsudoi's own surface does not support. The names are published MEASURED FROM WRITTEN HANDLERS rather than from the candidate list, and the two `IMPORTED AND NOT RE-EXPORTED` paragraphs that go false are corrected beside the export they describe.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "436 green from a RE-MEASURED 428, 30 files from 29 -- EIGHT ADDED. examples/ gains diagnostic-trailing-whitespace.ts and formatting-trailing-whitespace.ts, and THE FORMATTER IMPORTS THE DIAGNOSTIC MODULE'S SCANNER, so the pair CANNOT DRIFT -- one scanner, not two implementations asserted to agree. A structural guarantee the PO did not ask for and says they would not have thought to.",
        "THE EXECUTOR OVERRODE ITS OWN COMMITTED PLAN, AND PUT IT FIRST IN THE REPORT. The plan declared two commits; criterion 6 says the pin moves ONCE FOR THE PAIR, and two commits would have left an intermediate tree ADVERTISING HALF AN EXAMPLE -- the exact state the value coupling was cut to rule out. WHEN A PLAN AND AN ACCEPTED CRITERION CONFLICT, THE CRITERION GOVERNS. NO NEW ENTRY: what this project would file about is a plan overridden SILENTLY, and this was disclosed in the commit body AND the sprint record with the reason.",
        "THE NAMES MEASUREMENT CAME OUT BETWEEN THE CANDIDATES, WHICH IS WHY A PREDICTED SET WAS REFUSED: FOUR OF FIVE published, and `Diagnostic` WAS NEVER DEMANDED because the array literal is contextually typed by the declared result. A PREDICTED SET WOULD HAVE PUBLISHED ALL FIVE AND BEEN WRONG IN THE DIRECTION NOBODY CHECKS -- an unused published name is PERMANENT, UNAUDITED AND INVISIBLE. The PO records that as a better argument for measuring-not-predicting than the one they made.",
        "AND THE SHARPER RULE, WHICH IS NOT WHAT THE CRITERION SAID, BELONGS AT src/types.ts: PUBLICATION IS ABOUT EXTRACTION, NOT ABOUT THE METHOD. An inline handler needs NONE of these names, which is why both offset fixtures stay unannotated and are now the ONLY evidence behind it.",
        "SECOND EVIDENCE-SHAPED REVERSAL CONDITION TO FIRE, AND BOTH WERE THE PO'S. Sprint 33's `an example that must NAME one of them` is met by the example that names them. TWO CLEAN FIRINGS IS ENOUGH TO SAY THE FORM WORKS: a reversal stated as EVIDENCE rather than PREDICTION can be recognised when it arrives, and neither required re-litigating the original ruling.",
        "THE CORRESPONDENCE ASSERTION'S ISOLATING PERTURBATION IS LOGICALLY IMPOSSIBLE, not merely unbuilt: both handlers are pinned by exact equality to the SAME hand-written ranges, so the two shape assertions ENTAIL correspondence. A DESIGN OUTCOME, NOT MEANS LACKING -- and the precision matters, because it is entailed BY THE TEST STRUCTURE rather than by logic, so it CAN fail if that structure changes. THIRD ASSERTION OF ITS KIND, with C1's presence check and the capability control: kept because it is the ONLY ONE THAT NAMES THE PROPERTY, unable to be first to fail, and saying so at the site. THREE INSTANCES IS NOW A SETTLED DISPOSITION rather than three judgements. RESIDUAL: nothing about today's code; A FUTURE THIRD METHOD'S PAIRING is what it would not reach.",
        "NINE PERTURBATIONS, FULL SUITE EACH, 436 RAN IN ALL NINE. P1/P2 (broken import) redden 56 tests including all four named assertions BY NAME -- DEFENDED, EXPLICITLY NOT ISOLATED. P5/P6 (one side aggregated) redden the correspondence criterion ITSELF on both runtimes. P10 (every line flagged) reddens the clean-line test WHILE CORRESPONDENCE STAYS GREEN -- the fixture requirement doing exactly what it was made a criterion for.",
        "CRITERION 10'S FAILURE MODE WAS OBSERVED IN ITS NATURAL HABITAT rather than perturbed after the fact: with the modules wired but exampleSources() not yet updated, TEN PROBES FAILED AND EVERY MESSAGE READ `Module not found` / TS2307. The criterion existed because that failure LOOKS LIKE A RESOLUTION BUG; seeing it look exactly like one validates the REASON and not merely the requirement.",
        "A COUNT CAN LIVE IN A FILENAME. Seven sites across four files said `the eight` against a NINE-name list -- ONE IN A TEST NAME, TWO IN PROBE FILENAMES, one in a variable. A CONTENT GREP FOR THE CLAIM'S WORDS DOES NOT SEE A FILENAME. And the executor's OWN false README sentence, written earlier in the same sprint, was caught BY THE GREP RATHER THAN BY RE-READING -- which is exactly the gap that entry exists to fill, since re-reading had already failed to catch it.",
        "DECLINED WITH THE COST NAMED, and it forces a distinction the PO wanted stated so their own clause is not over-applied: A COUNT THAT IS A MEASUREMENT RESULT CARRIES PROVENANCE AND MUST NOT BE EDITED WITHOUT RE-MEASURING; A COUNT THAT IS A DESCRIPTION SHOULD BE REPLACED BY NAMING. Those are DIFFERENT OBJECTS THAT LOOK IDENTICAL IN PROSE. Editing `twenty assertions across five files` without re-running the Sprint-34 perturbation would have SWAPPED A MEASUREMENT FOR A GUESS.",
      ],
    },
    {
      number: 35,
      pbi_id: "PBI-40",
      goal: "DESIGN COHERENCE, NOT A DEFECT, and the ground is that THE CLAIM IS THE ASSET: answerUnlessCancelled exists precisely so cancellation is decided in ONE PLACE, and a cancelled request to a generator-driven method with NO handler is answered `null` because that drive's no-handler early return sits AHEAD of it. LSP permits either answer, so no requirement is breached -- what is at stake is a stated principle being weakened to accommodate AN ORDERING NOBODY CHOSE. The divergence closes at -32800 FOR BOTH DRIVES, and CRITERION 2 IS THE POINT RATHER THAN A SIDE EFFECT: the qualifier `THAT REACHES THIS FUNCTION` stops being true, so it comes out, and it comes out EVERYWHERE THE CLAIM LIVES rather than only where this sprint edits -- found by grepping the claim's words (`REACHES THIS FUNCTION`, `no-handler`, `early return`, `AHEAD OF`, `epilogue`, `nowhere else`, `one place`, `-32800`, `qualifier`, `divergence`) rather than the places comments live, because a git diff answers `did this change?` and never `is this list complete?`.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "428 green from a RE-MEASURED 423 -- FIVE ADDED, NONE REMOVED, NONE WEAKENED, NO EXPECTED VALUE MOVED. The no-handler return moved INSIDE answerUnlessCancelled, so -32800 is now the answer for both drives and the claim in that block is TRUE rather than qualified.",
        "CRITERION 2 WAS PROSE AND WAS TREATED AS THE POINT. There is no executable defence for a prose criterion, so the discharge was TEN SEARCH TERMS OVER src, test, examples AND README, with EVERY SURVIVOR READ -- past-tense history or still true. The Scrum Master verified independently that `REACHES THIS FUNCTION` appears ZERO times in src/methods.ts.",
        "AND THE GREP EXTENDED ITSELF BY ITS OWN CATCH: a pre-existing false comment in test/cancellation.test.ts claimed a cancelled formatting request is -32800 `AND NOTHING HERE OR ANYWHERE ELSE ASSERTS THAT` -- FALSE SINCE SPRINT 32'S TABLE TEST, and FALSIFIED BY A TEST IN ANOTHER FILE, so NO DIFF ON ITS OWN FILE COULD EVER HAVE POINTED AT IT. That generalises the Sprint-29 entry into: A COMMENT CAN BE FALSIFIED BY AN EDIT IN A FILE IT DOES NOT NAME, AND NOTHING LOCAL WILL SHOW IT. The correction is BOUNDED rather than deleted -- table tests cancel BEFORE DISPATCH; a PARKED handler is still asserted for hover and completion only.",
        "THREE PRESERVATIONS RULED SCOPE DISCIPLINE RATHER THAN TIMIDITY, and the PO stated the distinguishing test for next time: TIMIDITY DECLINES WITHOUT NAMING WHAT THE CHANGE WOULD COST; DISCIPLINE DECLINES WITH THE COST NAMED. All three name it -- moving the partialResultToken read into the epilogue turns a bare -32603 into a TypeError MISLABELLED AS A HANDLER FAILURE, corrupting the one diagnostic a config author has; moving it above the handler check loses the report for a config that cannot answer completion; and hoisting the no-handler case into registerMethods makes it A THIRD AXIS no criterion asks for. AN EXECUTOR EXCEEDING THE CRITERIA IS SCOPE CREEP EVEN WHEN THE CODE IS BETTER.",
        "A FOURTH KIND OF STANDING-RE-RUN OUTCOME, CLASSIFIED AND CONFIRMED: S14-b' now leaves all 428 green because AN ACCEPTED CRITERION DELIBERATELY REMOVED ITS TARGET BEHAVIOUR. The three exclusions are what make the classification right -- NOT a control gone quiet, NOT a disarmed control, NOT Sprint 34's edit-that-grew-a-second-half. A CONTROL GONE QUIET AND A DISARMED CONTROL ARE DEFECTS; THE OTHER TWO ARE NOT. All four produce the same observation and ARE INDISTINGUISHABLE FROM THAT OBSERVATION ALONE, which is why the vocabulary must exist.",
        "THE RESIDUAL MOVED AND IS RECORDED AS A PROPERTY, NOT A FRACTION: EVERY handler in all-methods.ts is now defended by nothing about what it answers, where Sprint 34 measured three of four. Prefer-naming-to-counting reaching A RESIDUAL, a surface it had not been applied to.",
        "P1 CLAIMS `ALONE` LEGITIMATELY under the Sprint-33 wording standard, because 428 RAN. P2 declared BORN GREEN AND MEASURED NON-VACUOUS. And a PRESENCE ASSERTION was added so the loop cannot go green across five awaited-once methods while measuring nothing -- the S6 pairing rule applied to A LOOP, where a uniformly-passing iteration is exactly where a vacuous test hides.",
        "THE SCRUM MASTER DISCLOSED A MISS RATHER THAN QUIETLY REORDERING: the PO had asked for PBI-41 to be refined DURING this sprint and it was not. THE PO'S RULING: A DISCLOSED MISS COSTS ONE SPRINT OF ORDERING; A QUIET REORDER COSTS THE BACKLOG ITS MEANING, and the second is unrecoverable because nobody knows it happened. Fourth time in this thread someone surfaced their own lapse rather than absorbing it, and the PO records it as THE SINGLE PRACTICE THEY WOULD KEEP IF THEY COULD KEEP ONLY ONE.",
      ],
    },
    {
      number: 34,
      pbi_id: "PBI-39",
      goal: "THE LAST OF THE STAKEHOLDER'S FIVE METHODS, AND THE ONE THAT MAKES THREE DORMANT THINGS REAL. completionItem/resolve is served awaited-once -- RE-MEASURED, not carried: protocol.d.ts:2301 declares ProtocolRequestType<CompletionItem, CompletionItem, never, void, void> with NO partialResult member. Its capability is contributed into completionProvider.resolveProvider, A KEY textDocument/completion OWNS, which is the first time the per-method-correctness rule reaches inside another method's capability and the first time Sprint 32's contributor-ordering constraint is anything but dormant. THE ORDERING IS CHECKED BY THE PROPERTY IT PROTECTS RATHER THAN BY AN INDEX COMPARISON: an exact-equality capability test on a config supplying BOTH handlers reddens if resolve's entry is declared above completion's, because completion's contributor ASSIGNS rather than merges. A config supplying resolve WITHOUT completion is REJECTED AT CONFIG LOAD on the PO's ruling, landing on machinery that already exists -- config failure precedes startServer, so stdout purity is preserved and the reason goes to stderr under the tsudoi: prefix. And what resolve does with an item it does not recognise is RULED: tsudoi keeps NO record of what its completion handler produced, so it cannot recognise one at all -- the item reaches the handler verbatim and the handler's answer is sent verbatim.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "FIFTH OF FIVE. 423 green from a RE-MEASURED 413, 29 files from 28 -- TEN ADDED, NONE REMOVED, NONE WEAKENED. Each DoD command run separately and unpiped, re-run independently by the Scrum Master.",
        "THE PRODUCT-GOAL METRIC IS RULED MET, WITH THE READING RECORDED BESIDE IT: `per the specification` means CONFORMANT, NOT COMPLETE, and that distinction is load-bearing because the diagnostic simplifications would otherwise read as gaps. Each was MEASURED conformant rather than assumed -- unchanged reports are unreachable without resultId BY THE PROTOCOL'S OWN CONSTRUCTION, workspaceDiagnostics: false IS the exclusion switch, and ignoring previousResultId conforms. CONFORMANT PARTIALITY, NOT DEVIATION.",
        "A BOUNDARY NAMED AT THE SAME MOMENT, BECAUSE A MET METRIC INVITES BEING FORGOTTEN: metric 1 (`0 lines changed in tsudoi itself`) holds WITHIN THE SUPPORTED METHOD SET, and that set is now five. A config author wanting a SIXTH still needs tsudoi changed. The two metrics are COUPLED, and stating it now is honest where discovering it later would not be.",
        "THE ORDERING CONSTRAINT IS CHECKED BY THE PROPERTY, NOT BY AN INDEX COMPARISON -- and the PO endorsed the refusal on the sharper of the two grounds: an index check would RESTATE THE MECHANISM, and it WOULD PASS A TABLE WHOSE ITERATION STOPPED BEING ORDERED. What checks it is the exact-equality capability assertion for a config supplying BOTH handlers: declare the entries the other way round and completion's contributor assigns {} over what resolve wrote, and that assertion reddens ALONE.",
        "THE PO DISAGREED ON ONE POINT AND RULED AGAINST THE EXECUTOR: declining to tidy completion's clobbering assignment into a MERGE was justified as `it would dissolve the constraint rather than check it`, but A MERGE MAKES ORDERING IRRELEVANT, SO P1 BECOMES UNCONSTRUCTIBLE BECAUSE THE HAZARD IS GONE -- and MAKING A HAZARD IMPOSSIBLE OUTRANKS KEEPING IT OBSERVABLE. It also closes the P2 debit: preservation is defensive-and-undefended only because completion contributes {}, and under a merge it stops being defensive and becomes intrinsic. TWO UNDEFENDED DEFENSIVE BEHAVIOURS DISSOLVE INTO ONE ORDER-INDEPENDENT MERGE. HEDGED by the PO, who did not have the code in front of them: conditional on measuring that a merge yields the same capability object for EVERY config, including one supplying only one of the pair. Filed as its own draft rather than bolted onto PBI-40.",
        "A DEBIT BOOKED RATHER THAN HIDDEN: P2 -- writing resolve's contributor WITHOUT preserving completionProvider -- leaves ALL 423 GREEN. Predicted in the plan as probably unprovable and confirmed.",
        "S14-b IS A VARIANT WORTH NAMING: not a control going quiet and not a disarmed control, but A PERTURBATION WHOSE EDIT GREW A SECOND HALF. Sprint 33's named perturbation still reddens, but no longer for its own reason -- with resolve present, deleting completion STOPS THE CONFIG LOADING, so four tests fail instead of one. Confirmed by S14-b' reproducing Sprint 33's result exactly. SUBTLER THAN THE FAILURE THE STANDING RE-RUN WAS FILED TO CATCH, AND IT CAUGHT IT ANYWAY.",
        "P-CAP CAUGHT BEFORE REPORTING RATHER THAN AT REVIEW: criterion 1's `advertised ONLY when a handler exists` half was ASSERTED, NOT MEASURED. Closed by a perturbation reddening 20 assertions across 5 files -- DEFENDED, EXPLICITLY NOT ISOLATED, which is the wording standard ruled at Sprint 33 keeping `defended` meaningful.",
        "THE RESIDUAL BECAME A THIRD, and the rule of three has fired: P5 measures that THREE OF FOUR awaited-once handlers in all-methods.ts are defended by nothing -- formatting, diagnostic, resolve. Given custody as draft PBI-42 rather than fixed inside a sprint no criterion of which asked for it.",
        "ONE EDIT TO A SHARED INPUT, DECLARED IN THE VOCABULARY BECAUSE `EDITED` AND `WEAKENED` READ THE SAME AT REVIEW: paramsForAnyMethod gained `label`, since resolve takes a CompletionItem and the comment above claims every table method accepts that object. NO expected value moved, NO matcher loosened. That distinction only exists because someone states it WHILE THEY STILL KNOW WHICH IT WAS.",
        "A MID-SPRINT HOLD BY THE SCRUM MASTER, RETRACTED, AND NO NEW RULE NEEDED -- S16 ALREADY COVERS IT, since a hold on an accepted criterion IS a scope decision and those route to the PO. The Scrum Master misread the stakeholder's `statically` as compile-time when they meant INSPECTING THE FACTORY'S RETURN VALUE, which is what the ruling already did. The hold and its retraction LEFT NO TRACE in any commit or in scrum.ts; the four comments that had picked up `unruled` language were restored before the final commit. Reported because it happened rather than because it left damage.",
      ],
    },
    {
      number: 33,
      pbi_id: "PBI-38",
      goal: "MEASURE THE FOUR SIMPLIFICATIONS BEFORE THEY BECOME CRITERIA, and only then serve textDocument/diagnostic as ONE ENTRY in Sprint 32's request table rather than a fourth hand-written registration. THE MEASUREMENT RAN FIRST AND IT STOPPED THE SPRINT ONCE ALREADY, which is what ordering it first was for: two simplifications survived, a FOURTH reading falsified the DRIVE the sprint was planned around, and the capability contributor could not be written at all until the Product Owner ruled interFileDependencies. RESUMED ON THAT RULING -- `true`, chosen by tsudoi on HARM ASYMMETRY -- with the widened error position gated behind a probe that runs FIRST and can send the approach back rather than be patched.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "STOPPED AND ESCALATED BEFORE IT SHIPPED ANYTHING, then resumed on the PO's ruling. 413 green from 405, 28 files from 27 -- EIGHT ADDED, NONE REMOVED OR WEAKENED. Fourth of the five, and THE FIRST ADDED THROUGH THE TABLE rather than by hand.",
        "THE ESCAPE THE EXECUTOR FOUND AND REFUSED: `capability: () => {}` compiles and would have unblocked everything BY SILENTLY WITHDRAWING AN ACCEPTED CRITERION. Refusing it and stopping instead is S16 applied by someone who had every incentive not to.",
        "THE PROBE MADE FIRST SUBTASK PASSED, AND ITS OWN NEGATIVE CONTROL WAS RUN -- because A GREEN tsc PROVES NOTHING UNLESS THE CALL SITE IS REACHED AT ALL. Substituting ProgressType<unknown> fails TS2769 AT THE onRequest LINE ITSELF. Both probes recorded as NOT RE-RUNNABLE FROM THE TREE rather than left implied.",
        "THE PO'S RULING IS DEFENDED VALUE BY VALUE, which no criterion required: P1 (interFileDependencies -> false) and P2 (workspaceDiagnostics -> true) EACH redden the capability test ALONE on both runtimes, despite living in ONE object literal. `false` marked FORCED and `true` marked CHOSEN keeps the two halves from being read as one kind of decision.",
        "THE BY-CONSTRUCTION EXPECTATION HELD AND IS MEASURED RATHER THAN INFERRED. NO LINE WAS WRITTEN for this method's rejection or cancellation; P3a/P3b name the method INSIDE the router's shared conditions and each reddens exactly one by-construction test. Sprint 32's `no longer constructible` was about isolating ONE COPY OF A CONDITION -- naming a method inside the shared condition is A DIFFERENT INSTRUMENT, so this is a real distinction and not a walk-back, and Sprint 31's residual closes BY MEASUREMENT.",
        'THE EXPECTED RED ARRIVED AS A COMPILE ERROR THAT PRINTED THE SPRINT\'S OWN FALSIFIED PREMISE BACK: TS2741 named the missing key as AwaitedOnceEntry<"textDocument/diagnostic">. A compile error stating the CORRECTED fact is the best possible place for that correction to surface.',
        "P6 CONFIRMS THE PO'S DELETION BY MEASUREMENT RATHER THAN BY AGREEMENT: deleting the fixture's awaited-once diagnostic handler leaves ALL 413 GREEN, while deleting its generator-driven completion handler reddens the -32800 test. The note ordered removed would have promised A RED THAT CANNOT COME.",
        "THE NINTH PUBLISHED NAME, and the first exercise of src/types.ts's rule for a ninth since it was written: DiagnosticSeverity is an ENUM, i.e. A VALUE, so a config author CANNOT NAME IT AT ALL without the re-export -- the same ground as CompletionItemKind, and NOT `an author might want it`. That the rule's first exercise landed on a VALUE rather than a type is evidence it discriminates.",
        "A WORDING STANDARD RULED, not a defect: P5 (DiagnosticSeverity -> export type) reddens the named assertion AND stops test/diagnostic.test.ts loading, so 406 RAN RATHER THAN 413. A PERTURBATION THAT CHANGES HOW MANY TESTS RAN CANNOT CLAIM `ALONE`, because the tests that did not run were NOT OBSERVED EITHER WAY. Distinct from the Sprint-27 opaque-harness defect, where the diagnostic naming the cause was NEVER PRINTED; here the named assertion fires and prints it.",
        "`identifier` WAS NEARLY SHIPPED AS AN OMISSION, and it does NOT want the interFileDependencies treatment -- the two differ EXACTLY WHERE THAT ONE WAS HARD. interFileDependencies is REQUIRED, so there was no decline-to-claim option and tsudoi had to assert something about a language it cannot know. `identifier` is OPTIONAL, so declining is available, and declining is tsudoi's STANDING PRACTICE for a detail the config has no surface to name (the trigger-characters precedent). PRECEDENT-FOLLOWING, NOT A NEW RULING. Its reasoning had been recorded ONLY IN A TEST COMMENT, which the Lifetime Rule does not recognise for a decision whose violation is a CODE EDIT; moved to the contributor.",
        "`NONE WEAKENED` IS A COVERAGE CLAIM AND ONE ASSERTION WAS EDITED: the published surface's exact-equality list gained a name. Only the expected value moved, no matcher loosened, and P5 measures it still fires -- S16 NOT engaged. Said explicitly BECAUSE `EDITED` AND `WEAKENED` READ IDENTICALLY AT REVIEW, and only the person who made the edit knows which it was.",
        "RESIDUAL, NOW A PAIR: nothing defends the all-methods fixture's diagnostic handler, exactly as nothing defends its formatting one. Recorded, no action -- A THIRD MAKES IT A PATTERN worth addressing rather than two one-offs. Rule of three applied to residuals, consistent with the table, the resolve check and the notify fork.",
      ],
    },
    {
      number: 32,
      pbi_id: "PBI-37",
      goal: "THE READINESS GATE RAN FIRST AND IT COULD HAVE WITHDRAWN THIS PBI. It did not, and it did not vindicate the PO either: THE PRECEDENT TRANSFERS TO EXACTLY ONE OF THE TWO HALVES. Six deletions, one at a time, reverted between. The capability `if`s are DEFENDED, three of three, each by a test whose TITLE names per-method capability correctness. The rejection checks are DEFENDED ONE OF THREE -- hover's reddens four tests by name, and formatting's and completion's redden NOTHING AT ALL, which is the notifications.ts precedent arriving with the SAME ARITHMETIC (two of three copies pure convention). So the table is built where it was measured to be needed, and the capability half is carried on COLOCATION AND REQUIREDNESS rather than on a defencelessness that is not there.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in b0e1b75..01813c4 plus the Review-owed prose correction 1a380e4. 405 green from 399, 27 files from 26 -- SIX ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped, re-run independently by the Scrum Master.",
        "THE READINESS GATE DID NOT WITHDRAW THE PBI; IT CORRECTED THE REASON FOR IT, and that is the outcome worth recording. Six deletions, one at a time, reverted between, WITH THE VERDICT RULE FIXED IN WRITING BEFORE THE FIRST PERTURBATION RAN -- a rule written after the numbers is a rule fitted to them -- and the fixture inventory taken first so a zero would be INTERPRETABLE.",
        "CAPABILITY ifs: 3 OF 3 DEFENDED. Each deletion reddens a test whose TITLE names per-method capability correctness (hover 6, completion 10, formatting 12, the last re-measuring and confirming Sprint 31's handed number). THE NOTIFICATION PRECEDENT DOES NOT TRANSFER THERE, AND THE PO CITED IT TWICE AS THOUGH IT DID. That half now stands on REQUIREDNESS FOR FUTURE METHODS -- three more are coming and none can be added without deciding its capability -- and NOT on undefendedness, and never on brevity.",
        "REJECTION CHECKS: 2 OF 3 PURE CONVENTION -- the same arithmetic as src/notifications.ts. formatting and completion each left 399 pass / 0 fail. The zeros are correctly attributed to cause (a) rather than to unobservability: the fixtures exist and are driven, and protocol.test.ts already sends a pre-initialize request through the same helper.",
        "src/methods.ts SAYS SO AT THE TABLE rather than citing a defencelessness that is not there.",
        "P-D FALSIFIED A CLAIM THE EXECUTOR HAD WRITTEN THEMSELVES AND EXPOSED A PRE-EXISTING DIVERGENCE: the generator drive's no-handler early return sits AHEAD of the cancellation epilogue, so a cancelled request to a generator-driven method with no handler is answered `null` while awaited-once answers -32800. THE PO'S CRITERION 3 WARNED A TABLE MIGHT DESTROY A DIFFERENCE HAND-WRITING MADE VISIBLE; THIS TABLE MADE VISIBLE ONE THAT THREE HAND-WRITTEN COPIES HAD HIDDEN. Prose corrected in this sprint per the standing rule; the behaviour is PBI-40, ruled at -32800 for both because THE CLAIM IS THE ASSET.",
        "P-A IS A DEBIT AGAINST THE TABLE AND IS BOOKED AS ONE: an entry keyed to the wrong request type leaves tsc at 0 -- the params differ only in optional members and a generator entry cannot pin its result. NOT closable at compile time; closed by a runtime assertion naming the cause. A TABLE PBI RECORDING ONLY WHAT IT REMOVED IS THE ADVOCACY DOCUMENT REFUSED AT PBI-33.",
        "CONSEQUENCE 1 DISSOLVED AS PREDICTED, premises HELD rather than assumed: exhaustiveness compile-checked at TS2741, prologue-reaches-every-entry held by P-B and P-C, and the bound stated honestly. Sprint 31's residual closes WITHOUT ONE LINE MENTIONING FORMATTING -- which is what `covered by construction rather than by copy` was supposed to mean.",
        "CONSEQUENCE 2 DID NOT DISSOLVE AND BECAME MORE STRUCTURAL: the isolating perturbation is NO LONGER CONSTRUCTIBLE, since one condition now serves every method. Correctly classified, with NO exact-equality assertion weakened to manufacture a firing.",
        "diagnosticProvider IS A FOURTH VALUE SHAPE -- DiagnosticOptions carries TWO REQUIRED BOOLEANS, so neither `true` nor `{}` type-checks. IT BROKE THE ENUMERATION PRECISELY WHERE THE PO PREDICTED, which is why the count came OUT rather than being corrected to three. Filed on PBI-38 with provenance, with the interFileDependencies-has-no-config-surface question; PBI-39 carries the dormant contributor-ordering constraint, since resolveProvider cannot land before completionProvider exists.",
        "A SELF-CATCH BEFORE REVIEW: `the increment changes no observable behaviour at all` was refuted by THIS SPRINT'S OWN GATE, since the suite could not observe two of the three rejection paths. A claim refuted by the measurement sitting in the same report is the easiest kind to ship and one of the harder kinds to notice.",
      ],
    },
    {
      number: 31,
      pbi_id: "PBI-36",
      goal: "THE FIRST OF THE FIVE NAMED METHODS SHIPS, AND IT ADDS NO NEW KIND OF ANYTHING: textDocument/formatting is served awaited-once like hover, documentFormattingProvider is advertised ONLY where the config can answer it, and the affordability claim -- a handler emits Positions from whatever offsets its analysis produced, because positionAt exists -- is MEASURED OVER THE WIRE rather than asserted for the remaining four. It also makes the THIRD HAND-WRITTEN COPY in registerMethods, so PBI-37's table is built against three measured shapes rather than predictions.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 3866dc3..2860739. 399 green from 389, 26 files from 25 -- TEN ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped, re-run independently by the Scrum Master. Third of the stakeholder's five methods.",
        "THE AFFORDABILITY CLAIM WAS TESTED RATHER THAN ASSERTED, and it is what ordering formatting first was for. P1 -- the fixture's positionAt replaced by a hardcoded Position -- reddens THE AFFORDABILITY TEST ALONE out of 399, on both runtimes. The PO records this as exactly what they could NOT promise when they wrote the criterion.",
        "THE EXECUTOR READ ONE DECLARATION MORE THAN THEY WERE GIVEN, converting a labelled gap into a MEASURED ABSENCE: DocumentFormattingParams is {textDocument, options} with NO POSITION AT ALL, so `nothing is claimed about incoming positions` HAS NOTHING TO CLAIM rather than something unmeasured -- and it closes by measurement the PO's earlier claim that offsetAt is exercised by none of the three.",
        "THE THIRD COPY WAS WRITTEN DELIBERATELY, NOT DEDUPLICATED. PBI-37's premise now stands at THREE REAL COPIES instead of two plus a prediction, which is what ordering formatting first was for.",
        "A COUNT IN PBI-37 WAS WRONG WHEN WRITTEN -- `four different shapes` -- and the PO ruled it REMOVED RATHER THAN CORRECTED: any enumeration invites the same failure again, and diagnosticProvider's value shape is STILL UNMEASURED so even `three` may not survive the fourth method. Measured: documentFormattingProvider is `true` at top level, IDENTICAL to hoverProvider. FOURTH WRONG COUNT IN THIS THREAD. The executor FLAGGED it rather than editing the PO's criterion.",
        "THE CAPABILITY NEGATIVE CONTROL IS BORN GREEN AND CAN NEVER FIRE ALONE -- P4 and P5 redden TWELVE exact-equality assertions each, because hover's and completion's see the same extra key. KEPT AND RELABELLED, but ON A DIFFERENT GROUND FROM C1's presence assertion, and the PO insisted the difference be recorded or the two will be read as one rule: C1 is kept because A LEGITIMATE FUTURE EDIT ACTIVATES IT; this one CANNOT BE ACTIVATED BY ANY PERMITTED EDIT, its subsumption being STRUCTURAL rather than incidental. It is kept because IT IS THE ONLY ASSERTION THAT NAMES THE PROPERTY -- twelve exact-equality diffs are real detection that ARRIVES WITHOUT NAMING ITS CAUSE, the Sprint-16 half of S9 -- and that property is the one PBI-37 is about to move into a table.",
        "A PLANNED PERTURBATION FAILED ON THE EXECUTOR'S OWN FALSE PREMISE, DISCLOSED RATHER THAN DROPPED: `the deprecated twin has no positionAt` is WRONG -- it declares SEVEN members and lacks only update, so repointing types.ts at it left tsc at 0. THAT MAKES IT A NEAR-PERFECT SHADOW, WHICH IS WHY identity-not-assignability WAS NECESSARY AT PBI-31 and is the sharpest evidence that ruling has yet received. Replaced by P2b, which fails naming positionAt with TS2339.",
        "NO examples/ FILE, and the reason is not laziness: standing item 6 requires an EXECUTED example with two negative controls, and lifecycle.test.ts pins the demo config's capabilities BY EXACT EQUALITY AND BY NAME IN A TEST TITLE, so adding a method to it is a deliberate change to a pinned artifact. `Costs little` is FALSE. Reversal condition is EVIDENCE-SHAPED rather than predictive: a real formatter to delegate to. PO NOTE, NOT A BLOCKER: when the five are done, revisit whether the demo config should demonstrate more than two -- four methods with no example is a drift worth deciding about rather than discovering.",
        "DocumentFormattingParams and TextEdit are imported type-only and NOT re-exported, ON A PRINCIPLE RATHER THAN ON ABSENCE OF DEMAND: VALUES must be re-exported -- CompletionItemKind is an enum read at RUN TIME and `export type` there ships a .d.ts compiling beside a .js that exports nothing -- while TYPES are needed only if an author NAMES them, and a returned TextEdit[] is STRUCTURALLY CONSTRUCTIBLE FROM A LITERAL. Same reasoning that kept Range off the surface at PBI-31, which makes it a STANDARD rather than a case-by-case judgement.",
        "RESIDUAL RECORDED, AND NO PER-METHOD CANCELLATION TEST ADDED: a cancelled formatting request is answered -32800 through the same answerUnlessCancelled and nothing asserts it. The shared path is already asserted twice and S7 bounds pin-everything pressure. IT IS EXPECTED TO DISSOLVE AT PBI-37, written onto that PBI so its ABSENCE is a signal about the table rather than a surprise.",
        "P7, the standing re-run of PBI-30's un-unref'd interval, still reddens exactly the two intended tests on both runtimes -- and it FALSIFIED PROSE RATHER THAN CODE: src/server.ts said `FOUR tests out of 389`, and this sprint's growth made the denominator false. Fixed by NAMING the two tests.",
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
    number: 40,
    pbi_id: "PBI-35",
    goal: "THE GATE RAN FIRST AND IT WITHDREW THE AUTHORISATION. `bun test` acquires an automatic develop-time build -- bunfig.toml's `[test] preload` runs tsc -p tsconfig.build.json before any test file is loaded -- so criterion 3 is met and a fresh clone is green with no build step. BUT THE BUILD IS SKIPPABLE, MEASURED: bun discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and does not search upward, so `cd test && bun test` RUNS all 444 tests with no build at all and 442 of them PASS -- `runs 444` is not `444 green`, and the two reds are the point. Criterion 1's discriminator is `is the build skippable`, not `is the documented route safe`, so STALENESS REMAINS REACHABLE, THE DETECTOR WAS LOAD-BEARING, THE DELETION IN CRITERION 2 IS WITHDRAWN BY ITS OWN TERMS, AND PBI-35 RETURNS TO THE PRODUCT OWNER. What still ships is the build, because criterion 3 stands alone and NOT DELETING SOMETHING REQUIRES NO RULING. The prose that goes false is corrected wherever the claim's words live -- including a clause in the test being KEPT, which no diff on the deleted-line side would reach.",
    status: "review",
    subtasks: [
      {
        test: "THE GATE, RUN BEFORE ANY LINE OF THE INCREMENT WAS PLANNED, with its own control taken first. Edit src/types.ts to add a value re-export, run NO build, and ask a probe importing `@atusy/tsudoi/types` whether it sees the new name. CONTROL FIRST, because this tree ships with dist/ ALREADY BUILT and a positive alone would be satisfied by a dist/ that happened to be current: with bunfig.toml moved aside the probe FAILS, printing the stale key list. Then the mechanism, then every invocation form, RE-STALING BETWEEN EACH so no run inherits the previous one's build.",
        implementation:
          "bunfig.toml `[test] preload` -> test/helpers/build.ts, which runs the repo's own node_modules/.bin/tsc SYNCHRONOUSLY via execFileSync. Synchronous is not a style choice: test/completion-path.test.ts STATICALLY imports an example that resolves the subpath to dist/types.js, so a build unfinished at module-graph resolution is no build. `[test]` and not the top-level `preload` because several tests spawn `bun` to run the CLI, and a top-level preload would put the compiler in every one of those processes.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "e8b849a",
            message: "feat(build): `bun test` builds dist/ itself, so a first clone is green",
            phase: "green",
          },
        ],
        notes: [
          "PREDICTED BEFORE THE DIFF, per the Sprint-39 standing item, AND THE PREDICTION IS 0/0/0 BECAUSE THE GATE WITHDREW THE ONLY DELETION: `expect(` source lines 0 ADDED, 0 REMOVED, 0 CHANGED; 444 tests, 1266 expect() calls and 31 files ALL UNCHANGED. The prediction I would have made had the authorisation held is recorded so the difference is legible rather than lucky: -1 source line and -1 test for the detector, plus -3 tests and -3 runtime calls but ZERO source lines for the README fact, since that file's assertions live in a LOOP BODY over a facts array. WHAT WOULD FALSIFY THE PREDICTION WITHOUT MOVING A COUNT: retargeting the README fact changes its NAME, and that name is interpolated into three test titles -- three titles move while every number stands still.",
          "AND THE COUNTS THEMSELVES ARE RE-MEASURED RATHER THAN CARRIED: 444/1266/31 was re-run on this tree with the preload present before anything was predicted about it.",
        ],
      },
      {
        test: "CRITERION 3, RE-MEASURED RATHER THAN COPIED, because the number the PBI carries was taken at 9501c68 and the suite has grown by a hundred tests since. rm -rf dist, no mechanism, full suite; then rm -rf dist, mechanism, full suite.",
        implementation:
          "No code. The measurement is the deliverable, and it replaces `30 fail / 299 pass` with what this tree actually does.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "EXPECTED RED on the first half and EXPECTED GREEN on the second. The first half is the fresh-clone shape a `bun install` produces; the second is the same tree with the preload in it.",
          "OBSERVED: 47 fail / 362 pass / 2 errors with 409 of 444 tests even RUNNING, then 444 pass. The PBI's `30 fail / 299 pass` was NOT reproduced and is not a defect in it -- it was taken at 9501c68 and the suite has grown by more than a hundred tests since. The DIAGNOSIS held exactly: the first failure still names dist/types.js imported from examples/completion-path.ts. Written into bunfig.toml with both provenances rather than corrected in place.",
        ],
      },
      {
        test: "THE PROSE THAT GOES FALSE, GREPPED FOR THE CLAIM'S WORDS AND NOT FOR THE PLACES COMMENTS LIVE -- `prepack`, `precondition`, `not committed`, `stale`, `load-bearing`, `built by nothing`, `DETECTS AND DOES NOT BUILD`, `thirty`, `299`, `self-consistent` -- across README.md, src/, test/, examples/, plus FILENAMES and TEST NAMES. A ZERO IS READ AS AMBIGUOUS: clean, or a referent just deleted.",
        implementation:
          "README's artifact-precondition paragraph rewritten to say the build is automatic AND to name the one route that skips it. test/readme.test.ts's fact RETARGETED IN PLACE rather than removed -- `dist/` and `not committed` are both STILL TRUE, only `bun run prepack` stops being the remedy -- which is why no test disappears. test/package-shape.test.ts: the KEPT prepack test's note says dist/ is `built by nothing the suite runs`, FALSE the moment bunfig.toml lands, and the detector's own block claims a precondition, a two-shape failure and an OPEN QUESTION about acquiring a build step that this sprint closes. The detector is kept and its guarded route RESTATED NARROWLY: a `bun test` whose cwd is not the repository root.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "419b1a3",
            message:
              "docs(build): correct the prose the build falsified, including in the test it spared",
            phase: "green",
          },
        ],
        notes: [
          "THE SPRINT-38 SHAPE, AND IT IS WHY THE GREP IS NOT OPTIONAL: the falsified clause lives in a test this sprint KEEPS AND DOES NOT OTHERWISE TOUCH, falsified by a file that does not name it. No diff on the changed lines could point at it.",
          "CONVENTION 8 APPLIED TO THE DETECTOR'S OWN BLOCK: the `SyntaxError: Export named CompletionItemKind` shape and `test/hover.test.ts: 12 pass, 2 fail` are MEASUREMENTS WITH PROVENANCE from a tree that no longer behaves that way from the root. They are marked historical to Sprint 25 rather than silently kept present-tense or silently deleted.",
        ],
      },
    ],
    impediments: [
      {
        description:
          "The agentic-scrum command and its skills (scrum-event-sprint-execution, scrum-team-developer, scrum-dashboard) are not installed in this environment.",
        impact:
          "None on the increment. The events are conducted from this dashboard's own record and the standing improvements instead, which is what has happened for every sprint in this thread.",
        request:
          "Install the agentic-scrum plugin, or confirm that running these events from scrum.ts alone is the intended arrangement.",
        status: "waiting_human",
        notes: [
          "Carried forward unchanged. No workaround attempted -- there is nothing to work around.",
        ],
      },
    ],
    decisions: [
      "THE GATE'S RESULT, AND IT IS THE HEADLINE RATHER THAN A FOOTNOTE. The build is NOT bypassed by the route the PBI feared: `bun test`, `bun test <path>`, `bun test <filter>` and `bun test -t <name>` from the repository root each preload the build EXACTLY ONCE -- measured with a marker-appending preload, counting firings, one run per form. But bun discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and does not search upward, so `cd test && bun test` RUNS ALL 444 TESTS with no build and 442 OF THEM PASS. THE DISCRIMINATOR CRITERION 1 WROTE IS `IS THE BUILD SKIPPABLE`, NOT `IS THE DOCUMENTED ROUTE SAFE`, so the answer is yes: staleness is still reachable, the detector was load-bearing, and the pre-authorised deletion is WITHDRAWN BY THE GATE ITS OWN AUTHOR ATTACHED. PBI-35 returns to the Product Owner.",
      "THE GATE PROPER, AND ITS CONTROL WAS TAKEN FIRST BECAUSE THE POSITIVE ALONE WOULD HAVE BEEN NEARLY VACUOUS: this tree ships with dist/ ALREADY BUILT, so `the tests saw the new source` is satisfied by a dist/ that happened to be current. With bunfig.toml moved aside, a value re-export added to src/types.ts and no build, the probe FAILED and printed the stale key list. With bunfig.toml present and the same edit, it PASSED. Re-staled between every subsequent form so no run inherited the previous one's build.",
      "444 green, 1266 expect() calls, 31 files -- ALL UNCHANGED, and the `expect(` diff is 0 ADDED / 0 REMOVED / 0 CHANGED with the source-line total standing at 693. PREDICTED IN THE COMMITTED PLAN and confirmed, WITH THE COUNTERFACTUAL PREDICTION RECORDED BESIDE IT so the clean reading is legible rather than lucky: had the authorisation held it would have been -1 source line and -4 tests. THE NAMED FALSIFIER FIRED EXACTLY AS PREDICTED -- retargeting the README fact moved THREE TEST TITLES while every number stood still, which is what a loop-bodied assertion does and why the prediction had to say so in advance.",
      "TWO EDITS DISCLOSED THAT `NONE WEAKENED` WOULD OTHERWISE HIDE, because EDITED and WEAKENED read identically at Review. The detector's `remedy` string changed from `run bun run prepack` to `run bun test from the repository root` -- it is interpolated into BOTH sides of the equality, so it cannot change what the assertion discriminates, and the change is because anyone reading that failure is BY CONSTRUCTION standing where the build did not run. And the README fact's TOKEN LIST went from three to four: `bun run prepack` out, `automatic` and `repository root` in, with `dist/` and `not committed` untouched because both are STILL TRUE. The fourth token is not decoration -- it pins the boundary, so the README cannot quietly drop the one instruction that now matters.",
      "AN ATTRIBUTION CONTROL IS WHAT STOPPED A FALSE `THE DETECTOR IS REDUNDANT`. On the bypass route with a stale dist/, TWO tests fail, and the second -- published-artifacts.test.ts's exact runtime-key list -- looked like a second staleness detector. It is not: re-running the same src/ edit with the build DOING its work reddens it identically, so it detects A NEW PUBLISHED NAME, not staleness. Had the pair been reported without the control, the detector would have been argued redundant on evidence that says nothing about staleness at all.",
      "TWO PERTURBATIONS ON THE MECHANISM ITSELF, because a build that fails OPEN is worse than no build. Preload pointed at a nonexistent path: `bun test` dies with `preload not found` and runs NOTHING -- no silent skip. src/ made not to compile with a good dist/ present: the run aborts, tsc's own TS2322 prints by name, and the suite does NOT proceed on the previous dist/. That second one is why the helper throws rather than warns.",
      "CRITERION 3'S NUMBER WAS RE-MEASURED AND DID NOT REPRODUCE, WHICH IS THE S27 ENTRY PAYING OUT ON A NUMBER THE PBI ITSELF CARRIED. `30 fail / 299 pass` at 9501c68 is now 47 fail / 362 pass with 35 tests not running at all -- NOT AN ERROR IN THE RECORD but a measurement whose world grew by a hundred tests underneath it. THE DIAGNOSIS SURVIVED WHERE THE COUNT DID NOT: the first failure still names dist/types.js imported from examples/completion-path.ts. Moved to bunfig.toml carrying BOTH provenances rather than corrected in place, per the count-as-measurement rule.",
      "THE FALSIFIED CLAUSE NO DIFF WOULD HAVE FOUND: test/package-shape.test.ts's note above the prepack test said this repo's dist/ is `built by nothing the suite runs`. That test is not about the develop-time build, was not otherwise changed, and was falsified by a FILE THAT DOES NOT MENTION IT. Third occurrence of the Sprint-35/38 shape and the first where the falsifying file is new rather than edited.",
      "A ZERO WAS READ AS AMBIGUOUS AND CHECKED, PER SPRINT 39: `the note above` and `one paragraph above` both return zero now, and in both cases that is BECAUSE THIS SPRINT DELETED THE REFERENT -- confirmed by reading the rewritten blocks, not by trusting the zero. test/installed-runtime.test.ts's `a stale build is unrepresentable` survived the same sweep and was READ rather than assumed: it is about the TARBALL's dist/, produced by prepack during pack, and is untouched by anything here.",
      "THE STANDING RE-RUN REPRODUCES SPRINT 39 EXACTLY: hover's handler deleted from test/fixtures/all-methods.ts gives TS2741 AT THE FIXTURE NAMING `textDocument/hover`, and the suite stays at 444 green because neither runtime type-checks. NOT A FOUR-OUTCOME EVENT and deliberately not classified as one -- that vocabulary answers why a re-run went GREEN, and this one went as recorded.",
      "THE INCREMENT SHIPPED THOUGH A CRITERION'S GATE FAILED, AND THE REASON IS THAT THE CRITERIA ARE SEPARABLE: criterion 3 is met by measurement and stands alone, and criterion 2's deliverable is a DELETION, which needs no ruling to decline. What returns to the PO is the scope question the gate exposed -- whether the cwd hole is acceptable, whether the detector should stay permanently, or whether the PBI wants a mechanism this project does not have. THE HOLE IS NOT CLOSABLE BY MORE OF THE SAME: a second bunfig.toml under test/ would cover one directory out of an unbounded set.",
      "WHAT WOULD NOT REDDEN, AND IT IS THE PRICE OF THE REFUSAL ABOVE RATHER THAN A SURPRISE: DELETE THE `preload` LINE FROM bunfig.toml AND ALL 444 STAY GREEN. MEASURED, not reasoned -- on a tree whose dist/ is already built, which is every tree a developer works in after their first run. Nothing in the suite asserts the mechanism exists, by choice, so the mechanism's removal is invisible until someone clones. The comment in bunfig.toml is the whole defence, and TOML carrying comments is the only reason that is acceptable.",
      "A DEGENERACY CHECK ON A FILE THIS SPRINT NEVER TOUCHED, prompted by the new preload rather than by any diff: test/installed-without-node-types.test.ts proves the build works WITHOUT @types/node, and a preload that builds with @types/node present at suite start could have made it pass on an artifact it did not produce. READ RATHER THAN ASSUMED: installConsumer stages a FRESH TEMP DIRECTORY, copies src/ and tsconfig.build.json into it and lets `bun pm pack` run prepack THERE, so it never reads the repo's dist/ at all. Untouched, and the S25 rule is why it was opened instead of reasoned about.",
      "NOT REVISITED, AND SAID SO RATHER THAN LEFT SILENT: committing dist/ (Sprint 25 measured it makes a stale build REPRESENTABLE where it currently is not) and exports-map surgery (measured to risk a product-goal metric). Both were ruled against and nothing this sprint measured disturbs either ruling.",
      "DECLINED WITH THE COST NAMED, per the timidity-versus-discipline test: no test asserts that bunfig.toml declares the preload. It would RESTATE THE MECHANISM -- the refusal Sprint 34 and Sprint 38 both made -- and the property it would proxy for is exactly what the gate measured directly. THE COST: someone deleting the preload line loses the automatic build and the suite says nothing until they land on a fresh clone. That is paid for by TOML CARRYING ITS OWN COMMENTS, so the Lifetime Rule's first clause is satisfied at the site the violating edit would be made, which package.json could not have offered.",
    ],
  },
  retrospectives: [
    {
      sprint: 39,
      improvements: [
        {
          action:
            "A ZERO-RESULT GREP IS AMBIGUOUS, AND THIS BOUNDS THE GREP ENTRY RATHER THAN EXTENDING IT. Zero means EITHER clean OR THE REFERENT WAS JUST DELETED AND LEFT A DANGLER. Measured this sprint: zero was read as clean and it was the second, and the grep run for SOMEONE ELSE'S staleness caught what this sprint had just broken. Filed beside the entry it qualifies, because `grep returned nothing` currently reads as reassurance.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "PREDICT THE expect( DIFF IN THE COMMITTED PLAN. 0/0/0 with the counts unchanged reads as CONFIRMATION rather than as a fitted report ONLY BECAUSE IT WAS WRITTEN DOWN FIRST. A one-line upgrade to the diff-not-assert standard.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A VOCABULARY ANSWERS ONE QUESTION, AND AN OBSERVATION THAT DOES NOT ANSWER THAT QUESTION DOES NOT JOIN IT, HOWEVER ADJACENT. The four standing-re-run outcomes answer WHY A RE-RUN WENT GREEN; a re-run that went as recorded but now costs a type check answers a different question and gets A NOTE AT THE SITE instead -- the S19 pattern, a comment stating what it does NOT rule out.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 38,
      improvements: [
        {
          action:
            "AMENDMENT TO THE FOUR-OUTCOME VOCABULARY: `TARGET DELIBERATELY REMOVED` IS NOT `UNCONSTRUCTIBLE`. The edit may remain perfectly writable and compile -- what was removed is THE HAZARD, not the perturbation. The four outcomes answer WHY A STANDING RE-RUN GOES GREEN, and conflating `the hazard is gone` with `I could not build the probe` is the confusion S11 exists to prevent.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PROBE'S SERIALISER IS AN INSTRUMENT AND CAN BE DEGENERATE. MEASURED: JSON.stringify with a KEY ARRAY filters NESTED keys, so two different capability objects serialised identically and a 120-order agreement probe would have reported success WHILE MEASURING NOTHING. S20 has been applied to assertions, controls and probes; extend it to the COMPARISON MECHANISM ITSELF -- and pair every such probe with a control proving it can see the thing it compares.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MEASUREMENT CAN GO STALE WITH NOBODY EDITING IT OR THE FILE IT DESCRIBES, BECAUSE A LATER SPRINT CHANGED THE WORLD IT MEASURED. NO GREP FINDS THIS -- the words are unchanged and still name real things. ONLY RE-RUNNING THE CONTROL DOES. Distinct from falsified-by-an-edit-elsewhere and from positional-falsifies-on-append, both of which a search can reach.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 36,
      improvements: [
        {
          action:
            "A COUNT CAN LIVE IN A FILENAME, AND A CONTENT GREP DOES NOT SEE ONE. Extension of the grep-the-claim's-words entry: search FILENAMES and TEST NAMES as well as file contents. Measured this sprint -- seven sites said `the eight` against a nine-name list, one in a test name and TWO IN PROBE FILENAMES.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "`NONE WEAKENED` IS DIFFED, NOT ASSERTED. It is a COVERAGE CLAIM and S13 forbids recalling one; diffing every `expect(` line across test/ and src/ is cheap and gives a direction, not an impression. MEASURED this sprint: seven added, zero removed, zero changed, and the pin's toEqual unchanged with only the object literal grown. The PO records having accepted that claim ON ASSERTION FOR A DOZEN SPRINTS.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COUNT THAT IS A MEASUREMENT RESULT CARRIES PROVENANCE AND IS NOT EDITED WITHOUT RE-MEASURING; A COUNT THAT IS A DESCRIPTION IS REPLACED BY NAMING. DIFFERENT OBJECTS THAT LOOK IDENTICAL IN PROSE, and the distinction bounds prefer-naming-to-counting so it is not over-applied to numbers that are evidence.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 35,
      improvements: [
        {
          action:
            "A STANDING RE-RUN THAT GOES GREEN MUST BE CLASSIFIED, NOT MERELY NOTED -- gone quiet, disarmed, edit-grew-a-second-half, or target-deliberately-removed. FOUR OUTCOMES, and the first two are DEFECTS while the other two are NOT. All four produce THE SAME OBSERVATION and are indistinguishable from it alone, which is the whole reason the vocabulary exists. FILED AS AN EXTENSION OF THE SPRINT-14 STANDING-RE-RUN ENTRY rather than as its own: that entry creates the practice and already carries its second rationale, and FOUR OUTCOMES ANSWERING ONE QUESTION ARE A VOCABULARY -- scattering a vocabulary defeats its purpose. Deliberately NOT filed under the cannot-be-constructed entry, which has a different trigger, actor and moment.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 30,
      improvements: [
        {
          action:
            "A HANDOFF CARRIES ITS PROVENANCE, AT BOTH ENDS. ONE RULE, THREE PAYLOADS -- wants, inherited measurements, counts. The bringer labels a want ASKED FOR or MENTIONED and a handed measurement with WHO TOOK IT, the same way a fact carries MEASURED or REASONED; the receiver DOES NOT RULE ON AN UNLABELLED ONE. Filed at both ends deliberately: the Scrum Master's first draft was a private habit, and S15 already records that A HABIT THAT LEAVES NO TRACE CANNOT BE AUDITED. The PO's half is symmetric -- they spent this whole thread demanding provenance for FACTS and never once for WANTS, and ruled on `10 of 10` and on a push fork without asking where either came from. The Sprint-25 entry does not reach this: `read the artifact` has NO REFERENT for a measurement someone else took.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 29,
      improvements: [
        {
          action:
            "GREP FOR THE CLAIM'S WORDS, NOT FOR THE PLACES COMMENTS LIVE. A falsified premise was carried by a TEST NAME -- a home nobody thinks to check and invisible to any search for comment syntax. Corollary, because it is the specific way the error survived Review: A git diff ANSWERS `did this change?`, NEVER `is this list complete?`. Those look like the same check at Review and are not.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 27,
      improvements: [
        {
          action:
            "AN EXECUTOR RE-MEASURES A NUMBER THEY WERE HANDED RATHER THAN COPYING IT. This has now caught a handed-down count in TWO CONSECUTIVE SPRINTS -- nine-not-eleven, then eleven-not-six -- and it works BECAUSE OUR RECORDS CARRY VERSION AND PATH, the S8 Sprint-24 amendment paying out. It generalises to a handback from anyone including the PO, and it reaches something no rule about the author can: A BRIEF IS THE ONE ARTIFACT WITH NO PERMANENT HOME, so an error in it is caught by the recipient re-measuring or not at all.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 26,
      improvements: [
        {
          action:
            "ASK, AT EACH RETROSPECTIVE, WHETHER THE RATE OF `NOT CONSTRUCTED` IS HONESTY OR OVER-AUTHORING. Two more this sprint -- the same-commit clause and the machine-checkable orphan rule -- and BOTH TRACE TO CLAUSES THE PO WROTE. Two readings compete: the team is being honest about what cannot be defended, or CRITERIA ARE BEING AUTHORED BEYOND WHAT CAN BE DEFENDED. The PO raised this against their own authoring and asked for it out loud rather than ruled.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CRITERION THAT NAMES A COMMIT SHAPE, A FILE LAYOUT OR ANY OTHER MECHANISM IS RESTATED AS THE PROPERTY IT PROTECTS. S13 applied to ACCEPTANCE CRITERIA rather than to plans: `same commit` was unconstructible against a git hook, while the property it meant -- no window in which a decision is deleted from custody but not yet written to its home -- was satisfiable, and was satisfied MORE VISIBLY by two commits than one would have been.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 25,
      improvements: [
        {
          action:
            "A PREMISE ABOUT AN ARTIFACT IS NOT STATED UNTIL THAT ARTIFACT HAS BEEN READ IN THE SAME SESSION. Three instances this refinement, all the PO's: the dependency graph (a hoisting that does not occur), the README extraction harness (which extracts nothing at line 180), and package-shape.test.ts's assertion strength (loosened at PBI-9 for exactly the case being ruled on). TWO OF THE THREE ARE CLAIMS ABOUT A TEST IN THIS REPOSITORY, MADE WHILE INVOKING THAT SAME TEST'S AUTHORITY. Distinct from the S13 entry, which covers premises about coverage and rule SETS; this one is about opening the file.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 22,
      improvements: [
        {
          action:
            "A CLAIM A COMMENT MAKES ABOUT ITS OWN FILE IS CHECKED AGAINST THAT FILE BEFORE THE EDIT LANDS. Editing a file FEELS LIKE verifying what its prose says about itself, and is not -- which is why these survive a first self-review. PREFER NAMING TO COUNTING: a count silently falsifies when the thing counted grows.",
          timing: "sprint",
          status: "active",
          outcome:
            "Three false sentences in one sprint, all found on a SECOND pass: `every rule below is exercised at this path`, `ONE list drives all three rules`, and a header filing a file under an argument it does not come from. FILED AS ITS OWN ENTRY ON THE PO'S OWN SPLIT TEST, against their lean and decided by measurement: the standing prose item is STRUCTURALLY BLIND here, because a Review reporting `yes, the guard prose was updated` satisfies it completely while all three stay false -- it catches prose that went stale by NOT being edited, and these were edited and left wrong. AND THE SUBJECT IS LOCATION, NOT TOPIC: the three share no subject -- one is a coverage claim, one structural, one a which-claim -- so no widening of the coverage rule reaches them. What they share is that each is a claim ABOUT THE FILE IT LIVES IN, which is why the coverage rule did not fire even on the one that WAS a coverage claim.",
        },
      ],
    },
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
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. ADDED AT SPRINT 24: A MEASURED CLAIM RECORDS WHAT WOULD LET IT BE RE-RUN, NOT ONLY ITS CONCLUSION. For a DEPENDENCY that means VERSION AND PATH; for THIS REPOSITORY it means an anchor that SURVIVES EDITS, since a line number moves when prose is added above it. THE ASYMMETRY IS NAMED because it tells a writer where to be careful when pressed: a path WITHOUT a version MISLEADS -- it looks precise, points at the wrong lines after a bump, and READS AS RE-CHECKABLE WHEN IT IS NOT -- where a version without a path merely COSTS A SEARCH. Filed after THE PROJECT'S FIRST FALSE `MEASURED` LABEL: `traceReceivedNotification fires at three sites whether or not a handler exists` could not be re-checked, while its correction -- vscode-jsonrpc 9.0.1, connection.js:646-648 -- could, AND THAT DIFFERENCE IS WHY THE ERROR SURVIVED A SPRINT. The internal case belongs here too: a record cited TWO different line numbers for the SAME assertion, because prose added between runs moved it. ADDED AT SPRINT 18: A COMMENT ASSERTING CURRENT BEHAVIOUR STATES WHETHER AN ASSERTION BACKS IT -- three site comments were found claiming things nothing checked, each reddening nothing on first attempt. It targets the BIRTH defect, prose that was never checked, where the standing prose item targets DRIFT, prose that became false; and it is bounded at write time rather than requiring perpetual re-perturbation, which would be claim-extraction wearing a review practice.",
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
