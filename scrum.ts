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
      id: "PBI-43",
      story: {
        role: "tsudoi maintainer",
        capability: "have a capability contributor be order-independent instead of order-dependent",
        benefit:
          "the ordering hazard stops existing rather than staying observable, and two undefended defensive behaviours dissolve into one",
      },
      acceptance_criteria: [
        {
          criterion:
            "completion's contributor MERGES rather than assigns, and the same capability object results for EVERY config -- INCLUDING one supplying only ONE of the pair.",
          verification:
            "THE PO'S OWN HEDGE, stated because they did not have the code in front of them and have been wrong on shapes repeatedly. This measurement is the PBI's premise, not its epilogue.",
        },
        {
          criterion: "P1 becoming unconstructible is the DELIVERABLE, not a loss.",
          verification:
            "S11: a vocabulary with three outcomes defaulted to the pessimistic reading and reported A DESIGN SUCCESS IN THE LANGUAGE OF A COVERAGE GAP. MAKING A HAZARD IMPOSSIBLE OUTRANKS KEEPING IT OBSERVABLE. The executor declined this tidy on the ground that it would dissolve the constraint rather than check it; THE PO RULED THE REASONING INVERTED.",
        },
        {
          criterion: "The P2 debit closes as a consequence rather than being addressed separately.",
          verification:
            "preservation is defensive-and-undefended ONLY BECAUSE completion contributes {}; under a merge it stops being defensive and becomes INTRINSIC. That two-for-one is a stronger argument than either half alone.",
        },
      ],
      status: "draft",
      notes: [
        "FILED AS ITS OWN DRAFT RATHER THAN BOLTED ONTO PBI-40, which is ready and has its own criteria.",
      ],
    },
    {
      id: "PBI-42",
      story: {
        role: "tsudoi maintainer",
        capability:
          "learn from the suite, rather than from a comment, that a method joined the request table and its by-construction fixture did not",
        benefit:
          "the tests that iterate the table keep covering every method in it, instead of silently covering fewer of them each sprint",
      },
      acceptance_criteria: [
        {
          criterion: "DECIDE AT REFINEMENT whether this is worth a check at all.",
          verification:
            "the cost is real and is not zero: test/fixtures/all-methods.ts's doc block currently states what it enforces AND what it does not, honestly and by measurement, and a check would make half of that block describe something that can no longer happen.",
        },
        {
          criterion:
            "IF a check lands, it is BY CONSTRUCTION -- one assertion covering every method the table declares -- and never a per-method copy.",
          verification:
            "a per-method assertion is the convention Sprint 32's table exists to retire, and adding one here would reintroduce it in the very tests that prove it is gone.",
        },
      ],
      status: "draft",
      notes: [
        "MEASURED AT SPRINT 34, AND IT IS THE THIRD RATHER THAN A NEW ONE: deleting test/fixtures/all-methods.ts's resolve handler leaves ALL 423 TESTS GREEN, exactly as deleting its formatting handler (Sprint 32) and its diagnostic handler (Sprint 33) do. THREE OF THE FOUR AWAITED-ONCE HANDLERS IN THAT FIXTURE ARE DEFENDED BY NOTHING.",
        "FILED BECAUSE THE TRIGGER THE PO SET HAS FIRED. Sprint 33 recorded the pair with `A THIRD MAKES IT A PATTERN worth addressing rather than two one-offs`, which is the rule of three this project already applies to the table, the resolve check and the notify fork. THE THIRD ARRIVED; addressing it is a decision, and this PBI is where that decision has a home rather than in a sprint record that compacts.",
        "NOT FIXED IN THE SPRINT THAT FOUND IT, on the Sprint-33 precedent the PO recorded as correct: NO PBI-39 CRITERION ASKS FOR IT, and a check smuggled in beside a method would be the executor deciding scope.",
        "THE ASYMMETRY IS GONE AND THE RESIDUAL IS NOW EVERY HANDLER IN THE FIXTURE, stated as a property because a fraction of a set that grows with the table falsifies itself in silence. This note said the generator-driven handler was out of scope BECAUSE deleting completion's DID redden; PBI-40 removed the reason it did. RE-MEASURED AT SPRINT 35 by the executor, one deletion at a time and reverted between: deleting completion's ALONE reddens four tests because `completionItem/resolve` without `textDocument/completion` stops the config LOADING, and deleting completion's TOGETHER WITH resolve's -- the edit that removes that load failure -- leaves ALL 428 GREEN, where it reddened the -32800 test from Sprint 32 until Sprint 35. So NO handler in that fixture is defended by any assertion about what it answers, and this PBI's story now covers BOTH drives rather than four awaited-once handlers.",
      ],
    },
    {
      id: "PBI-41",
      story: {
        role: "config author",
        capability: "read an example that demonstrates more than two of the five methods",
        benefit:
          "the shape worth copying covers what tsudoi actually answers, not the two it answered first",
      },
      acceptance_criteria: [
        {
          criterion: "DECIDE AT REFINEMENT, AFTER THE LAST METHOD LANDS -- not before.",
          verification:
            "answering `what should the stakeholder-facing example demonstrate` before the set is complete DECIDES ABOUT AN INCOMPLETE SET.",
        },
        {
          criterion:
            "THE CRITERION IS UNCHANGED FROM SPRINT 31: an example exists for a method WHEN THERE IS SOMETHING REAL TO DELEGATE TO.",
          verification:
            "that was the reversal condition and NOTHING HAS MET IT YET. Whether `diagnostic` does is EXACTLY WHAT THE REFINEMENT SHOULD MEASURE rather than assume. Standing item 6 requires an EXECUTED example with two negative controls, and lifecycle.test.ts pins the demo config's capabilities BY EXACT EQUALITY AND BY NAME IN A TEST TITLE, so adding to it is a deliberate change to a pinned artifact.",
        },
      ],
      status: "draft",
      notes: [
        "FILED AS A PBI BECAUSE THE PO'S NOTE LIVED ONLY IN A REVIEW VERDICT AND SPRINT DECISIONS, BOTH OF WHICH COMPACT. The Lifetime Rule says it needs a home, and a draft PBI is one. Four methods with no example is a drift worth deciding about rather than discovering.",
      ],
    },
    {
      id: "PBI-40",
      story: {
        role: "config author",
        capability: "get -32800 for a cancelled request whichever drive its method uses",
        benefit:
          "the one place cancellation is decided actually decides it, so the claim at that place is true",
      },
      acceptance_criteria: [
        {
          criterion:
            "A cancelled request to a GENERATOR-DRIVEN method with NO handler is answered -32800, as an awaited-once one already is.",
          verification:
            "MEASURED at Sprint 32 by P-D, run expecting the opposite: deleting the fixture's awaited-once handler reddened NOTHING while deleting its generator-driven handler reddened the -32800 test. The generator drive's no-handler early return sits AHEAD of answerUnlessCancelled, so such a request is answered `null`.",
        },
        {
          criterion:
            "The qualifier added to answerUnlessCancelled's doc block at Sprint 32 is REMOVED, because it stops being true.",
          verification:
            "THE CLAIM IS THE ASSET, and that is the PO's whole ground for ruling the direction rather than leaving it open: answerUnlessCancelled exists PRECISELY so cancellation is decided in one place, and preserving the divergence means WEAKENING A STATED PRINCIPLE TO ACCOMMODATE AN ORDERING NOBODY CHOSE. A prose qualifier that no longer describes the code is the point of this PBI, not a side effect.",
        },
      ],
      status: "ready",
      notes: [
        "REVEALED, NOT INTRODUCED. Invisible while three hand-written copies stood in for the table, and visible the moment the two drives sat side by side. LSP permits either answer, so NO REQUIREMENT IS BREACHED and this is a design-coherence item rather than a defect.",
        "THE FINDING RECORDED IN THE PO'S OWN TERMS: criterion 3 of PBI-37 warned that a table might DESTROY a difference hand-writing made visible. THIS TABLE MADE VISIBLE ONE THAT THREE HAND-WRITTEN COPIES HAD HIDDEN.",
        "OVERTURN CONDITION, evidence-shaped rather than predictive: a client shown to depend on `null` from a cancelled completion.",
      ],
    },
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
            "@atusy/tsudoi/types resolves in-repo without a manual build, AND the fate of the stale-dist detector is decided IN THIS PBI.",
          verification:
            "package-shape.test.ts:230 becomes UNABLE TO FAIL under an automatic build, and S15 already deleted a test for exactly that -- so whoever picks this up is deciding to delete it. That decision belongs in the criteria, which is the part a minor fix would have got silently wrong.",
        },
      ],
      status: "draft",
      notes: [
        "ACCEPTED AS A STEADY STATE, NOT PARKED. Its entire benefit is turning a red-with-a-named-remedy first run into a green one, and there is NO FREE FOURTH WAY -- array fallback does not fall through on either runtime, and a development condition spreads a flag across the documented surface. Not worth doing before TextDocument.",
        "THREE TRIGGERS MAKE IT URGENT: (1) a SECOND artifact precondition appears -- one is self-service, two compound and the argument stops holding; (2) the stale-dist detector is weakened or removed -- it is the single thing converting a red clone into a self-service one; (3) an external contributor hits it and the README does not resolve them.",
      ],
    },
  ],

  completed: [
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
    number: 35,
    pbi_id: "PBI-40",
    goal: "DESIGN COHERENCE, NOT A DEFECT, and the ground is that THE CLAIM IS THE ASSET: answerUnlessCancelled exists precisely so cancellation is decided in ONE PLACE, and a cancelled request to a generator-driven method with NO handler is answered `null` because that drive's no-handler early return sits AHEAD of it. LSP permits either answer, so no requirement is breached -- what is at stake is a stated principle being weakened to accommodate AN ORDERING NOBODY CHOSE. The divergence closes at -32800 FOR BOTH DRIVES, and CRITERION 2 IS THE POINT RATHER THAN A SIDE EFFECT: the qualifier `THAT REACHES THIS FUNCTION` stops being true, so it comes out, and it comes out EVERYWHERE THE CLAIM LIVES rather than only where this sprint edits -- found by grepping the claim's words (`REACHES THIS FUNCTION`, `no-handler`, `early return`, `AHEAD OF`, `epilogue`, `nowhere else`, `one place`, `-32800`, `qualifier`, `divergence`) rather than the places comments live, because a git diff answers `did this change?` and never `is this list complete?`.",
    status: "review",
    subtasks: [
      {
        test: "A BY-CONSTRUCTION TEST, in test/methods-table.test.ts, over a config supplying NO handler for anything: every method the table declares is cancelled and required to answer -32800. It states criterion 1's PROPERTY -- whichever drive a method uses, a cancelled request with no handler is answered -32800 -- rather than the mechanism, and one assertion covers every entry, which is the convention that table exists to keep. PAIRED WITH A PRESENCE ASSERTION on the file's own precedent (`the table is not empty, so the loop above is iterating something`): the table declares AT LEAST ONE generator-driven entry, WITHOUT WHICH the loop could go green on five awaited-once methods and measure nothing about the drive this PBI is about. PLUS THE CONTROL that makes the -32800 attributable to cancellation rather than to a broken fixture: the same handler-less config answers every method `null` when NOT cancelled.",
        implementation:
          "The generator drive's no-handler answer is produced INSIDE answerUnlessCancelled instead of ahead of it, so every request reaching a drive is answered under the cancellation epilogue. TWO ORDERING CHOICES ARE DELIBERATE AND BOTH PRESERVE BEHAVIOUR NO CRITERION ASKS TO CHANGE: the handler check moves AFTER the context is built but the partialResultToken read stays OUTSIDE the produce callback, so a `params: null` TypeError keeps its current attribution (-32603 with no `tsudoi:` line) rather than being mislabelled `handler failed`; and the handler check precedes the token read, so a no-handler request carrying an invalid token still emits no stderr line. NOT HOISTED INTO registerMethods: src/methods.ts records the no-handler case as coming WITH the drive rather than being a second axis, and making it a shared third thing is a scope decision no criterion asks for.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "9fb8d8c",
            message:
              "feat(methods): decide cancellation in one place by answering the no-handler generator case there too",
            phase: "green",
          },
        ],
        notes: [
          "EXPECTED RED, and at a named method: the loop reddens at textDocument/completion, the table's only generator-driven entry, and stays green through the four awaited-once ones.",
          "THE CONTROL IS BORN GREEN AND IS DECLARED SO. It is not vacuous -- answering `[]` rather than `null` for a handler-less generator-driven method reddens it -- but nothing about it can fail before the implementation lands.",
          "THE RED ARRIVED NAMING ITS OWN CAUSE, and the assertion was written that way on purpose: a per-iteration `toBe` stops at the first divergence and prints -32800 against undefined without saying WHICH method diverged. Comparing one object for the whole run prints `textDocument/completion: undefined` beside four methods at -32800, which is the brief\'s handed measurement RE-MEASURED rather than copied.",
        ],
      },
      {
        test: "NO EXECUTABLE DEFENCE, AND THAT IS DECLARED RATHER THAN DRESSED UP: criterion 2 is about PROSE, and what defends it is the grep whose terms are named in the goal above. The measurement is that no term returns a surviving statement of the qualifier.",
        implementation:
          "The qualifier and every restatement of it are removed: answerUnlessCancelled's doc block loses `THAT REACHES THIS FUNCTION` and the paragraph explaining why it was load-bearing, requestCancelled's block loses the same qualifier it forwards, the router's drive comment stops saying completion returns EARLY ahead of the context, driveGenerator's block stops calling the early return this drive's no-handler shape, and test/fixtures/all-methods.ts's block is RE-MEASURED rather than edited -- its measurements are about exactly the behaviour this sprint changes.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "8c840be",
            message:
              "docs(methods): delete a qualifier that stopped being true, at every site that carried it",
            phase: "refactoring",
          },
          {
            hash: "796ad1a",
            message:
              "docs(test): re-measure what the all-methods fixture enforces, now that this sprint removed it",
            phase: "refactoring",
          },
        ],
        notes: [
          "WHAT REPLACES IT MUST NOT BE A SECOND FALSE CLAIM. The sentence becomes unqualified only if every request reaching either drive reaches this function -- which is what subtask 1 measures.",
        ],
      },
      {
        test: "None. A PRE-EXISTING FALSE COMMENT found by grepping the claim's words, falsified by SPRINT 32's own test rather than by this sprint: test/cancellation.test.ts says a cancelled formatting request is -32800 `AND NOTHING HERE OR ANYWHERE ELSE ASSERTS THAT`, while test/methods-table.test.ts:127 has asserted exactly that for every method in the table since Sprint 32.",
        implementation:
          "The comment names the assertion that covers it -- the Sprint-31 P7 precedent, where prose rather than code was falsified and the fix was NAMING the test. Its second staleness is fixed in the same edit: it names formatting as the newcomer, and diagnostic and resolve have arrived since. ITS OWN COMMIT, separate from criterion 2's, because it is not this PBI's claim.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "d2f3023",
            message:
              "docs(test): name the test that covers a gap this comment still reported as open",
            phase: "refactoring",
          },
        ],
        notes: [
          "NO TEST IS WITHDRAWN OR WEAKENED, so S16 is not engaged. Reported as pre-existing.",
        ],
      },
      {
        test: "PERTURBATIONS, NAMED BY THE ASSERTION EACH IS REQUIRED TO FLIP. P1: restore the early return ahead of the epilogue -- the new -32800 test must redden, and `alone` is claimed only after confirming no test file stopped loading. P2: answer `[]` rather than `null` for the handler-less generator-driven case -- the born-green control must redden.",
        implementation:
          "THE STANDING RE-RUN, WITH A KNOWN COMPLICATION AND AN EXPECTED MOVE. S14-b (delete all-methods' completion handler) and S14-b' (delete completion AND resolve) probe the very behaviour this sprint removes, so their results are RE-MEASURED and reported precisely rather than carried. All five handlers in that fixture are deleted one at a time, reverted between, because the residual PBI-42 carries -- three of four awaited-once handlers defended by nothing -- may move, and a sprint that changed whether a residual is still true says so.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "A PERTURBATION WHOSE TARGET BEHAVIOUR AN ACCEPTED CRITERION DELIBERATELY REMOVED IS ITS OWN KIND, distinct from a control going quiet (S16) and from Sprint 34's perturbation-whose-edit-grew-a-second-half. Naming it is what keeps `a defence went missing` from being the reading.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "SHIPPED IN 9fb8d8c..d2f3023. 428 green from a RE-MEASURED 423, 29 files from 29 -- FIVE TESTS ADDED, NONE REMOVED, NONE WEAKENED, NO EXPECTED VALUE MOVED. Each DoD command run separately and unpiped with its exit read directly: bun test 0, oxlint 0 (the two pre-existing require-yield warnings unchanged), oxfmt --check . 0, tsc --noEmit 0.",
      "CRITERION 1 IS DEFENDED AND THE DEFENCE NAMES ITS OWN CAUSE. The new test compares ONE OBJECT for the whole run rather than asserting per iteration, because a per-iteration `toBe` stops at the first divergence and prints -32800 against undefined WITHOUT SAYING WHICH METHOD DIVERGED -- the Sprint-16 half of S9, that a real detection arriving without naming its cause is worth replacing. Its red printed `textDocument/completion: undefined` beside four methods at -32800, on both runtimes, which RE-MEASURES the handed Sprint-32 result instead of copying it.",
      "P1 REDDENS ALONE AND `ALONE` WAS CHECKED RATHER THAN ASSUMED: restoring the early return ahead of the epilogue leaves 428 tests RAN across 29 FILES, so nothing stopped loading, and exactly the named test fails on both runtimes. P2 (the handler-less generator answer changed from `null` to `[]`) reddens the born-green control alone on the same terms -- so that control is declared born green AND measured non-vacuous.",
      "TWO ORDERING CHOICES INSIDE THE DRIVE ARE DELIBERATE AND NEITHER IS A TIDY. The partialResultToken read stays OUTSIDE answerUnlessCancelled, so a client sending `params: null` keeps its bare -32603 instead of having a TypeError reported as a `tsudoi:` handler failure for a handler never called; and it stays BELOW the no-handler return, so a config that cannot answer completion still reports no token. Both preserve behaviour no criterion asked to change, and both are written at the line rather than only here.",
      "CRITERION 2 HAS NO EXECUTABLE DEFENCE AND THAT IS DECLARED RATHER THAN DRESSED UP. What defends it is a grep for THE CLAIM'S WORDS -- REACHES THIS FUNCTION, qualifier, early return, ahead of, epilogue, no-handler, nowhere else, one place, divergence, -32800 -- run across src, test, examples and README, not a diff of the file that was edited. It found the claim in FIVE places in src/methods.ts, in test/fixtures/all-methods.ts, and in a test comment; every survivor is past-tense history and was read to confirm it.",
      "THE STANDING RE-RUN MOVED, AND THIS IS A FOURTH KIND OF PERTURBATION OUTCOME: A CONTROL WHOSE TARGET BEHAVIOUR AN ACCEPTED CRITERION DELIBERATELY REMOVED. S14-b (delete all-methods' completion handler) still reddens four tests and still for the config-load reason Sprint 34 found. S14-b', the variant that reproduced the original, now leaves ALL 428 GREEN -- it detected the divergence, and the divergence is what this sprint closed. Not a control gone quiet, not a disarmed one, not Sprint 34's edit-that-grew-a-second-half.",
      "THE RESIDUAL MOVED FROM SPRINT 34'S THREE-OF-FOUR TO EVERY HANDLER IN THE FIXTURE, measured this sprint by deleting each handler in test/fixtures/all-methods.ts one at a time and reverting between: hover, formatting, diagnostic and resolve each leave 428 green, and completion's leaves 428 green as soon as the resolve handler that made its absence a LOAD failure goes with it. NO handler in that fixture is defended by any assertion about what it answers. Written onto PBI-42, whose own note predicted this sprint would change it, rather than left in a sprint record that compacts.",
      "A PRE-EXISTING FALSE COMMENT WAS FOUND BY THE SAME GREP AND FIXED IN ITS OWN COMMIT. test/cancellation.test.ts claimed a cancelled formatting request is -32800 `AND NOTHING HERE OR ANYWHERE ELSE ASSERTS THAT`; Sprint 32's by-construction table test had asserted it for three sprints. FALSIFIED BY A TEST RATHER THAN BY THE FILE, which is why no diff pointed at it. Its second staleness -- naming formatting as the newcomer when diagnostic and resolve arrived after -- went in the same edit, because a half-corrected count is worse than a stale one, and the correction is BOUNDED: the table tests cancel before dispatch, and cancelling a PARKED handler is still asserted for hover and completion only.",
      "ONE PERTURBATION EXPECTED TO REDDEN DID NOT, AND IT IS S14-b' -- THE FOURTH-KIND OUTCOME ABOVE, not a defence that went missing. Every other one behaved: P1 and P2 each reddened their named assertion alone, and the four awaited-once methods stayed at -32800 through the expected red, which is what makes the divergence attributable to the DRIVE rather than to the fixture or the harness.",
      "A NEW FIXTURE RATHER THAN A REUSED ONE, on naming: test/fixtures/hover-absent.ts is already `{ methods: {} }`, and driving every entry in the table through a file called `hover-absent` would make both its name and its hover-specific block lie, while renaming it would edit a test no criterion here reaches. test/fixtures/no-methods.ts states the property it carries instead of counting the methods it omits -- and it is the half of these tests a method joins BY CONSTRUCTION, which all-methods.ts no longer is.",
      "NOT DONE, AND NAMED SO IT IS NOT MISTAKEN FOR AN OVERSIGHT: the no-handler case was NOT hoisted out of the two drives into the router. src/methods.ts records it as coming WITH the drive rather than being a second axis; making it a shared third thing is a scope decision no criterion asks for, and criterion 1 says the request is ANSWERED -32800, not that the return is deleted.",
    ],
  },
  retrospectives: [
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
