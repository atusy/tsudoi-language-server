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
      id: "PBI-44",
      story: {
        role: "config author",
        capability:
          "read an example where the server reports trailing whitespace and then removes it",
        benefit:
          "I can run the demo, see the warnings, format, and watch them clear -- a complete loop in one server",
      },
      acceptance_criteria: [
        {
          criterion:
            "THE MATCHED PAIR: textDocument/diagnostic reports PER-LINE trailing whitespace, textDocument/formatting removes it. Trailing newlines are OUT OF SCOPE for this increment.",
          verification:
            "the stakeholder said `trailing space とか trailing new lines とか` -- OR -- so choosing one is WITHIN their ruling rather than against it. PER-LINE and not the tail edit, for three reasons: only the per-line case demonstrates Diagnostic[] and TextEdit[] AS ARRAYS WITH DISTINCT RANGES; it exercises positionAt at MULTIPLE positions, which is where the example gets to SHOW the Sprint-28 investment rather than prove it; and a whole-document replacement is THE `FULL SYNC` OF FORMATTING -- the lazy implementation that returns a legal answer and teaches the wrong thing.",
        },
        {
          criterion:
            "THE DIAGNOSTIC'S RANGES AND THE FORMATTER'S EDIT RANGES CORRESPOND, AND IT IS ASSERTED.",
          verification:
            "RANGE-FOR-RANGE CORRESPONDENCE IS THE PAIRING'S ENTIRE PEDAGOGICAL CONTENT. If the diagnostic reported per-line while the formatter emitted one whole-document edit, BOTH EXAMPLES WOULD BE INDIVIDUALLY CORRECT AND THE PAIR WOULD TEACH NOTHING. Without this assertion, `matched pair` is a claim in a README that NO TEST CAN FAIL.",
        },
        {
          criterion: "THREE NEGATIVE CONTROLS, all required, MEASURED ON BOTH RUNTIMES.",
          verification:
            "(a) two separated lines with trailing whitespace produce TWO findings -- a single whole-document finding FAILS it; (b) the same for TextEdit[] -- a single whole-document edit FAILS it; (c) the correspondence assertion FAILS if either side is aggregated while the other is not. Measured on both runtimes because `what the implementation emits` IS A SHAPE PREDICTION, and shape predictions are what the PO has been wrong about most often in this thread.",
        },
        {
          criterion:
            "THE FIXTURE DOCUMENT CARRIES A LINE WITH TRAILING WHITESPACE AND A LINE WITHOUT, AND THE ASSERTION CHECKS BOTH.",
          verification:
            "MADE A REQUIREMENT RATHER THAN CONFIRMED AS A READING, so it is TRUE BY CONSTRUCTION rather than true by observation. The filesystem candidate gave this pair FREE; here it is free ONLY IF SOMEONE WRITES THE FIXTURE THAT WAY, and `someone will` is exactly the convention this project has MEASURED TO BE UNDEFENDED THREE TIMES.",
        },
        {
          criterion:
            "Both examples are EXECUTED, with BOTH negative controls each: breaking the import reddens a named assertion, breaking a handler's return reddens a named assertion.",
          verification: "standing item 6.",
        },
        {
          criterion:
            "test/lifecycle.test.ts's pin moves ONCE for the pair: THE TITLE, THE toEqual AND THE COMMENT. One source edit, TWO runtime assertions.",
          verification:
            "GREPPED, not recalled: it is THE ONLY exact-equality pin on the demo config, and ten other capability toEqual sites were verified BY READING THE START ARGUMENT to drive fixtures instead. THAT THE PIN MOVES ONCE RATHER THAN TWICE IS WHY THESE TWO SHIP TOGETHER -- the mechanical half of the original bundle's rationale, transferred intact.",
        },
        {
          criterion:
            "PUBLISH THE PROTOCOL NAMES THE MODULES ACTUALLY NAME -- MEASURED ONCE THE HANDLERS ARE WRITTEN, NOT A PREDICTED SET. Candidates: Diagnostic, DocumentDiagnosticParams, DocumentDiagnosticReport, DocumentFormattingParams, TextEdit. Publish the ones the modules name AND NO MORE, each with its own reason beside it.",
          verification:
            "src/types.ts's OWN criterion for the eight is `the protocol names the examples ACTUALLY USE`, measured against examples/. THE EIGHT EXIST PRECISELY TO MAKE EXAMPLE MODULES WRITABLE -- completion-path.ts and hover-wordnet.ts are extractable ONLY BECAUSE CompletionItem, CompletionParams, Hover and HoverParams were published. ADDING EXAMPLES ADDS NAMES: THE RULE OPERATING, NOT A WIDENING OF IT. The alternative is worse than three type names -- THE README WOULD TEACH A PATTERN TSUDOI'S OWN PUBLISHED SURFACE CANNOT SUPPORT. And the Sprint-33 refusal of TextEdit and DocumentFormattingParams is NOT OVERTURNED: its reversal condition was `an author found declaring an intermediate TextEdit[] and importing the package for it`, and THE EXAMPLE MODULE IS THAT AUTHOR -- the first evidence-shaped reversal condition in this thread to fire.",
        },
        {
          criterion:
            "THE FIXTURE STAYS UNANNOTATED, and src/types.ts's `imported and not re-exported` sentence goes FALSE and is corrected in the same commit.",
          verification:
            "publishing does NOT force annotation, so test/fixtures/diagnostic-offsets.ts keeps its contextual-typing evidence intact -- its own comment warns `Add an annotation here and that half of the evidence is gone`. THE NEED FOR ANNOTATION LIVES IN THE EXAMPLE, NOT THE FIXTURE.",
        },
        {
          criterion:
            "install.ts's exampleSources() doc block says `TWO FILES, not one` and `the artifact under test is both files` while THE FUNCTION RETURNS FOUR. Replace with a NON-COUNTING form.",
          verification:
            "ALREADY FALSE AT HEAD, found while holding, sitting in the exact function this PBI edits. COUNTS IN PROSE ARE NOW THE MOST RELIABLE DEFECT CLASS IN THIS REPOSITORY -- two in published prose, four in criteria, ALL found by grep or re-measurement and NONE by reading.",
        },
        {
          criterion:
            "README's framing is CORRECTED, not preserved: the example set now teaches TWO SHAPES -- a handler that GOES SOMEWHERE ELSE for its answer, and a handler that COMPUTES ITS ANSWER FROM THE DOCUMENT IT WAS GIVEN.",
          verification:
            "the current framing stays TRUE OF TWO MODULES and stops being TRUE AS A FRAMING, and THE FRAMING IS WHAT IS PUBLISHED -- saying only the first is a coverage claim that is no longer true. THE CORRECTED FRAMING IS ALSO THE BETTER ONE: computing from the document is THE COMMONER CASE FOR A REAL LANGUAGE SERVER -- a parser does not go anywhere else -- so the README currently TEACHES THE RARER SHAPE AS THOUGH IT WERE THE SHAPE.",
        },
        {
          criterion:
            "install.ts's exampleSources() gains the new modules -- AND THE CRITERION NAMES THE FAILURE MODE.",
          verification:
            "omitting them fails the published-artifacts probes IN A WAY THAT LOOKS LIKE A RESOLUTION BUG and would be misdiagnosed.",
        },
        {
          criterion:
            "README's file table moves, and `Copy all four` -- A NUMBER IN PROSE -- is replaced by a form that does not count.",
          verification:
            "prefer-naming-to-counting reaching the README, the cheapest instance of a clause that has caught four wrong counts.",
        },
      ],
      status: "ready",
      notes: [
        "THE PAIR IS SELF-EVIDENCING, and that is why it OUTBID the filesystem candidate rather than refuting it. Path-completion and a path-diagnostic SHARE A DOMAIN; a diagnostic reporting what the formatter removes DEMONSTRATES THE OTHER. A reader runs the demo, sees the warnings, formats, and watches them clear -- a complete loop in one server. The filesystem version HAS NO LOOP: two features standing next to each other.",
        "THE BINDING IS STRONGER THAN THE ORIGINAL BUNDLE'S EVER WAS: not a shared domain but VALUE COUPLING. EITHER HALF ALONE SHIPS HALF A DEMONSTRATION -- a problem the demo cannot fix, or a fix for a problem it never reports. SAME CONDITION AS THE ORIGINAL BUNDLE: if either half's negative control turns out unconstructible, they split.",
        "THE PO'S OWN CRITERION FAILS LITERALLY HERE AND THEY RULED ON THE PROPERTY INSTEAD: `an example exists when there is something real to DELEGATE TO`, and a trailing-whitespace stripper DELEGATES TO NOTHING -- it is a regex in the handler. But that phrasing was A PROXY for `not a toy`, and THE PROXY FAILS WHILE THE PROPERTY HOLDS. Small and complete, versus wordnet-as-spellchecker's large and wrong. Only the second is disqualifying.",
        "NO NEW DEPENDENCY, so nothing collides with install.ts's wordnet control and README's EXECUTED install command is untouched. THE DEPENDENCY SEAM THE ORIGINAL SPLIT WAS MADE ON IS DISSOLVED -- recorded so nobody later reads a seam that no longer exists.",
        "prettier RECORDED AS THE RICHER ALTERNATIVE NOT TAKEN: a package, an executed install command, and A RETURN CONTROL FRAGILE TO A VERSION BUMP for a reason having nothing to do with tsudoi -- the same fragility class accepted at PBI-34 ONLY because there was no alternative, and ACCEPTING AN AVOIDABLE INSTANCE HAVING REFUSED AVOIDABLE ONES ELSEWHERE WOULD BE INCOHERENT. REVERSAL: evidence that a config author needs to see delegation to a real external tool.",
        "oxlint's RECORD RESTATED, because it was written against a FILESYSTEM baseline that no longer exists and A COMPARISON TO SOMETHING ABSENT IS WORSE THAN NO COMPARISON, since it reads as current. The reason stands: A BINARY ON PATH, changing what a copying reader needs and teaching SUBPROCESS-SPAWNING as the delegation pattern. REVERSAL: someone wanting a real-linter example.",
        "THE ZERO-DEPENDENCY PRINCIPLE IS NOT DECLARED YET -- it stands at TWO instances (oxlint on PATH, prettier as a package), and the filesystem-to-trailing-whitespace move is NOT a dependency decline so it does not count toward a third. The PO holds their own rule of three rather than reaching for a pattern that is one short.",
      ],
    },
    {
      id: "PBI-46",
      story: {
        role: "config author",
        capability: "see the completion item I highlight enriched with real metadata",
        benefit:
          "the example shows the method's actual purpose -- expensive detail fetched only for the item the user looks at",
      },
      acceptance_criteria: [
        {
          criterion:
            "The demo config supplies completionItem/resolve, enriching a path item with stat metadata.",
          verification:
            "MEASURED: stat yields size, mtime and dir-or-file for a real path, identically on bun 1.3.13 and deno 2.9.2. The demo config ALREADY PRODUCES PATH ITEMS to hang it on.",
        },
        {
          criterion:
            "examples/tsudoi.config.ts's paragraph stating this config supplies no resolve handler becomes FALSE, and is corrected in the same commit.",
          verification:
            "the standing rule that a claim falsified by a sprint is corrected in the sprint that falsifies it.",
        },
        {
          criterion:
            "The second negative control -- an item THE EXAMPLE DID NOT PRODUCE -- is REASONED, NOT MEASURED.",
          verification:
            "whether such an item can be driven to the handler through the demo config WAS NOT TESTED. If unconstructible, CLASSIFY IT and state what remains at risk rather than reporting a design outcome in the language of a coverage gap. src/types.ts records that an unrecognised item MUST BE RETURNED UNCHANGED, because tsudoi keeps no record of what a completion handler produced -- so the handler must key off what IT PUT ON THE ITEM ITSELF.",
        },
        {
          criterion: "test/lifecycle.test.ts's pin moves A SECOND TIME.",
          verification:
            "UNAVOIDABLE AND DELIBERATE, and the reason this is its own item rather than bundled.",
        },
      ],
      status: "ready",
      notes: [
        "SEPARATED FROM PBI-44 BECAUSE THE OLD BUNDLE'S RATIONALE IS GONE: diagnostic and resolve shared the FILESYSTEM, and the diagnostic has moved to trailing whitespace. `Both are examples` IS NOT A RATIONALE. resolve stays coherent with path completion; the diagnostic no longer sits beside it.",
        "Two constraints READ rather than assumed: resolve REQUIRES textDocument/completion to be present, enforced at config load, and the demo config supplies it so the pairing holds.",
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
    number: 36,
    pbi_id: "PBI-44",
    goal: "THE MATCHED PAIR SHIPS AS ONE LOOP: the demo config reports per-line trailing whitespace and removes it, and the property that makes it a pair rather than two features is RANGE-FOR-RANGE CORRESPONDENCE, asserted over the wire. The sprint also pays a debt the hold exposed -- src/types.ts's published surface cannot express an EXTRACTED handler for either method, so the README's `module per method` is a pattern tsudoi's own surface does not support. The names are published MEASURED FROM WRITTEN HANDLERS rather than from the candidate list, and the two `IMPORTED AND NOT RE-EXPORTED` paragraphs that go false are corrected beside the export they describe.",
    status: "review",
    subtasks: [
      {
        test: "test/trailing-whitespace.test.ts drives THE DEMO CONFIG over both runtimes against a document whose line 0 and line 2 END IN TRAILING WHITESPACE and whose line 1 DOES NOT: TWO findings, DISTINCT ranges, and NOTHING on line 1.",
        implementation:
          "examples/diagnostic-trailing-whitespace.ts, wired into examples/tsudoi.config.ts. The protocol names tsc DEMANDS are published -- measured by writing the module first and reading the errors, not by adopting the candidate list -- with publicProtocolNames and src/types.ts's diagnostic `IMPORTED AND NOT RE-EXPORTED` paragraph corrected in the SAME commit.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "82b82fc",
            message:
              "feat(examples): ship the trailing-whitespace pair, and publish the names an extracted handler cannot do without",
            phase: "green",
          },
        ],
        notes: [
          "EXPECTED-RED, and THE PIN MOVE IS PART OF THIS ONE EDIT rather than a later subtask -- declared in advance under the shared-moment rule, because test/lifecycle.test.ts's toEqual reddens THE MOMENT the handler lands. Its TITLE, its toEqual and its COMMENT all move; NO MATCHER IS LOOSENED and the only change is an expected value gaining a key.",
          "THE PIN CLAIM WAS RE-MEASURED BY THE EXECUTOR, not carried: eleven capability sites exist, ten drive FIXTURES (diagnostic-offsets, hover-fixed x4, completion-chunks x2, formatting-fixed, hover-absent, resolve-detail) and one -- test/lifecycle.test.ts:37 -- drives demoConfig. test/workspace.test.ts:498 is toBeDefined, not exact equality. Read at the start argument of each, as the criterion prescribes.",
          "CAPABILITY SHAPES READ FROM src/methods.ts THIS SESSION rather than from the sprint records that state them: diagnosticProvider is `{ interFileDependencies: true, workspaceDiagnostics: false }` and documentFormattingProvider is `true`.",
        ],
      },
      {
        test: "The same document, same file: TWO TextEdits with DISTINCT ranges, each deleting a run, and the clean line untouched.",
        implementation:
          "examples/formatting-trailing-whitespace.ts, IMPORTING THE SCAN FROM THE DIAGNOSTIC MODULE so the formatter removes exactly what the diagnostic reports, wired into the config. Names published and src/types.ts's formatting paragraph corrected in the same commit; the pin gains documentFormattingProvider.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "EXPECTED-RED. THE IMPORT DIRECTION IS THE VALUE COUPLING MADE MECHANICAL, and the alternative is named with its cost rather than declined silently: a THIRD module holding the scan alone would keep the two handler modules independent, at the price of a file exporting AN ALGORITHM AND NO HANDLER -- which is the shape the PO refused in the plain-data seam, arriving by another door. Each handler still does its OWN positionAt conversion, so the LSP-shaped work stays in the handler modules.",
          "THE FIXTURE STAYS UNANNOTATED: test/fixtures/formatting-offsets.ts and test/fixtures/diagnostic-offsets.ts are NOT touched, so the contextual-typing evidence their own comments protect survives publication intact. The need for annotation lives in the EXAMPLE, which is an exported standalone function and gets no contextual typing at all.",
        ],
      },
      {
        test: "In ONE session on ONE document: the diagnostic's ranges and the formatter's edit ranges are equal, RANGE FOR RANGE AND IN ORDER.",
        implementation: "No implementation -- the assertion is the deliverable.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "BORN GREEN IF SUBTASKS 1 AND 2 ARE CORRECT, and declared so rather than discovered. Its value is not detection today: it is that `matched pair` stops being a claim in a README that NO TEST CAN FAIL. Non-vacuity is established by P7 rather than by the assertion's own colour.",
        ],
      },
      {
        test: "The published-artifacts and installed-* probes type-check and RUN the new modules.",
        implementation:
          "test/helpers/install.ts's exampleSources() gains both modules, and its doc block's `TWO FILES, not one` / `the artifact under test is both files` -- ALREADY FALSE AT HEAD against four returned entries -- is replaced by a NON-COUNTING form.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "THE FAILURE MODE IS NAMED SO IT IS NOT MISDIAGNOSED: omitting a module leaves the consumer with a config importing a file that is not there, which surfaces as a MISSING-MODULE RESOLUTION FAILURE -- indistinguishable at a glance from the dependency-resolution defect these probes exist to observe.",
        ],
      },
      {
        test: "No executable defence -- README's file table and its two framings are PROSE, and the discharge is a grep of THE CLAIM'S WORDS with every survivor read.",
        implementation:
          "README's table gains the two modules; `Copy all four` becomes a form that does not count; and the delegation framing is CORRECTED rather than preserved -- the example set now teaches TWO SHAPES, a handler that goes somewhere else for its answer and a handler that computes its answer from the document it was given.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "1210a76",
            message: "docs(examples): correct a fixture comment that two published names falsified",
            phase: "refactoring",
          },
        ],
        notes: [
          "GREPPED FOR THE CLAIM'S WORDS, NOT FOR THE PLACES COMMENTS LIVE, and across src, test, examples and README rather than over this sprint's diff -- a diff answers `did this change?` and never `is this list complete?`, AND A COMMENT CAN BE FALSIFIED BY AN EDIT IN A FILE IT DOES NOT NAME. Terms include `a ninth`, `no example formats anything`, `supplies both handlers`, `go somewhere else`, `Copy all four`, `TWO FILES`, `two of the five`, `not re-exported`, `eight`.",
        ],
      },
    ],
    impediments: [
      {
        description:
          "The agentic-scrum command and its three skills are NOT INSTALLED: /Users/atusy/.claude/plugins/data/agentic-scrum-inline is an EMPTY DIRECTORY, and no scrum-event-sprint-execution, scrum-team-developer or scrum-dashboard skill exists under ~/.claude/skills. Verified by listing both paths.",
        impact:
          "Sprint 36 is being executed from scrum.ts and the house conventions alone. Nothing is blocked, and that is the point worth recording rather than the outage: A PROCESS HELD UP BY CONVENTION ALONE LEAVES NO TRACE AND CANNOT BE AUDITED -- the same shape as a property held by an empty event loop, and the reason this is an impediment rather than a note.",
        request:
          "Install or repair the agentic-scrum plugin. NOT to be routed around by the executor: reinstalling a plugin is outside what an execution agent should decide.",
        status: "waiting_human",
        notes: [
          "RECORDED RATHER THAN ABSORBED, on the practice the PO named as the single one they would keep if they could keep only one.",
        ],
      },
    ],
    decisions: [
      "THE HOOK FORBIDS A CADENCE, SO THE PROPERTY IS SATISFIED ANOTHER WAY -- stated here at PLANNING rather than explained at Review. The pre-commit hook (read this session at ~/.config/git/hooks/pre-commit) refuses any commit staging scrum.ts beside another file, and it reads `git status --porcelain`, so scrum.ts cannot even be DIRTY while code is committed. Subtask statuses therefore CANNOT be updated as they complete. The property the mechanism protects -- NO WINDOW IN WHICH A DECISION IS OUT OF CUSTODY -- is satisfied by this plan naming every subtask, every perturbation and their predictions IN ADVANCE, and by one closing scrum.ts-alone commit.",
      "BASELINE RE-MEASURED BY THE EXECUTOR rather than copied from the brief: 428 pass, 0 fail, 29 files, 1234 expect() calls, bun 1.3.13. The handed number was right; it is now ours.",
      "PERTURBATIONS DECLARED WITH THEIR PREDICTIONS BEFORE ANY RUN, because a prediction written after the result is not a prediction. P1/P2: breaking the config's import of each module reddens a named assertion in test/trailing-whitespace.test.ts. P3: the diagnostic handler returning an EMPTY full report reddens the two-findings assertion. P4: the formatting handler returning null reddens the two-edits assertion. P5: the diagnostic AGGREGATING into one document-spanning finding reddens the two-findings assertion. P6: the formatter emitting ONE whole-document edit reddens the two-edits assertion. P7: aggregating ONE SIDE ONLY reddens the CORRESPONDENCE assertion -- the control that establishes subtask 3 is not vacuous. P8: dropping a module from exampleSources() fails the published-artifacts probes. P9 is the standing re-run of a PREVIOUS sprint's perturbation, Sprint 35's P1: deleting test/fixtures/all-methods.ts's completion handler alone reddens four tests because resolve without completion stops the config LOADING. Any of these going green is CLASSIFIED -- gone quiet, disarmed, edit-grew-a-second-half, or target-deliberately-removed -- and only the first two are defects.",
      "SHIPPED IN 82b82fc AND 1210a76. 436 green from a RE-MEASURED 428, 30 files from 29 -- EIGHT ADDED, NONE REMOVED, NONE WEAKENED. Each DoD command run SEPARATELY AND UNPIPED with the exit read directly: `bun test` 0, `oxlint` 0 (the same TWO pre-existing require-yield warnings, in the same two fixtures), `oxfmt --check .` 0, `tsc --noEmit` 0.",
      "THE PLAN'S OWN SUBTASK SPLIT WAS OVERRIDDEN BY A CRITERION, DISCLOSED RATHER THAN QUIETLY MERGED: subtasks 1 and 2 planned a commit each, and criterion 6 says the pin moves ONCE FOR THE PAIR. Two commits would have moved it TWICE and left an intermediate tree advertising half an example, which is the state the value coupling exists to rule out. The plan was wrong and the criterion was right.",
      "FOUR NAMES PUBLISHED OF FIVE CANDIDATES, AND THE FIFTH'S REFUSAL IS THE MEASUREMENT WORKING. Each module was written FIRST and `tsc --noEmit` READ: it demanded DocumentDiagnosticParams and DocumentDiagnosticReport, then DocumentFormattingParams and TextEdit, and NEVER `Diagnostic` -- the items are an array literal inside a return the declared result type contextually types. The line fell BETWEEN the candidates rather than around them, which a predicted set would have got wrong in the safe direction.",
      "AN EVIDENCE-SHAPED REVERSAL CONDITION FIRED ON ITS OWN TERMS, WHICH IS WORTH MORE THAN THE TWO NAMES IT BOUGHT. src/types.ts's formatting block read `what would reverse it is an example that must NAME one of them`, written at Sprint 33 by someone with no such example in view. examples/formatting-trailing-whitespace.ts is that example. A condition written to be CHECKABLE was checked rather than re-argued.",
      "AND THE RULING'S REAL CONTENT IS A DISTINCTION NOBODY HAD DRAWN: publication is about EXTRACTION, NOT ABOUT THE METHOD. A handler written INLINE in a config still needs none of these names. That is why test/fixtures/diagnostic-offsets.ts and formatting-offsets.ts were left UNANNOTATED -- they are now the ONLY standing evidence for the half of the rule that decided which candidates were refused.",
      "A COUNT CLUSTER FOUND BY GREP AND NONE OF IT BY READING: SEVEN SITES ACROSS FOUR FILES said `the eight` while publicProtocolNames had held NINE since DiagnosticSeverity landed -- ALREADY FALSE AT HEAD, deepened to thirteen by this sprint. ONE OF THEM WAS A TEST NAME, which is the Sprint-29 entry's exact case: a home nobody thinks to check and invisible to any search for comment syntax. Two probe FILENAMES and a VARIABLE carried the same stale number. All replaced by naming. NO MATCHER LOOSENED AND NO EXPECTED VALUE MOVED in any of them -- said explicitly because `edited` and `weakened` read identically at Review.",
      "THE ONE EXPECTED VALUE THAT MOVED IS THE PIN, AND IT GAINED RATHER THAN LOST: test/lifecycle.test.ts's toEqual took two keys, its title stopped naming two providers and now names the PROPERTY (`a provider for every method the example supplies`), and its comment moved with them. The `only exact-equality pin` claim was RE-MEASURED BY THE EXECUTOR rather than carried: eleven capability sites, TEN driving fixtures, read at the start argument of each.",
      "CRITERION 10'S FAILURE MODE WAS OBSERVED BEFORE THE FIX RATHER THAN PERTURBED AFTER IT, which is stronger and was free: with the modules wired but exampleSources() not yet updated, TEN probes failed and EVERY message read `Module not found` or `TS2307: Cannot find module`. That is the misdiagnosis the criterion names, seen in its natural habitat. P8 reproduced it deliberately: the SAME ten.",
      "NINE PERTURBATIONS RUN, FULL SUITE EACH TIME AND REVERTED BETWEEN, so every `alone` claim is checkable against how many RAN -- 436 in all nine. P1/P2 (import broken): 56 tests, including all four named assertions BY NAME -- a broken import stops the config loading, so DEFENDED AND EXPLICITLY NOT ISOLATED. P3 (diagnostic returns empty): the two-findings assertion by name. P4 (formatter returns null): the two-edits assertion by name. P10 (every line flagged): reddens THE CLEAN-LINE TEST, which is the S6 pairing for criterion 4 and the one perturbation where correspondence stays GREEN -- so that assertion is measured NON-SUBSUMED.",
      "P5 AND P6 ARE CRITERION 3(c) ITSELF, one for each side: aggregating the diagnostic alone, then the formatter alone, each reddens FOUR tests -- that side's shape assertion AND the correspondence assertion, on both runtimes. So correspondence is DEFENDED and EXPLICITLY NOT ISOLATED, the wording standard ruled at Sprint 33.",
      "AND THE ISOLATING PERTURBATION IS NOT MERELY UNBUILT, IT IS LOGICALLY IMPOSSIBLE -- CLASSIFIED, NOT REPORTED AS A GAP. Both handlers are pinned by exact equality to THE SAME hand-written `expectedRanges`, so `diagnostic == expected` and `formatter == expected` ENTAIL `diagnostic == formatter`: no edit can redden correspondence while leaving both shape tests green. That is a DESIGN OUTCOME, not means lacking, and the S11 entry exists precisely so it is not written in the language of a coverage gap. THE ASSERTION IS KEPT ON THE SPRINT-31 GROUND: it is the ONLY assertion that NAMES the property, two exact-equality diffs are detection that ARRIVES WITHOUT NAMING ITS CAUSE, and A LEGITIMATE FUTURE EDIT ACTIVATES IT -- loosen either shape test and correspondence becomes the first and only thing to fail. WHAT REMAINS AT RISK: nothing about today's code, and the pairing of a FUTURE third method, which this assertion would not reach.",
      "THE STANDING RE-RUN REPRODUCES SPRINT 35 EXACTLY: deleting all-methods.ts's completion handler alone reddens the same FOUR tests, same two titles on both runtimes. A REPRODUCTION AND NOT INDEPENDENT, run against a tree whose denominator moved from 428 to 436 while the four did not. Neither gone quiet nor disarmed -- it did not go green at all, so the four-outcome vocabulary was not needed this sprint.",
      "ONE COUNT IN PROSE DECLINED, WITH THE COST NAMED SO IT IS DISCIPLINE RATHER THAN TIMIDITY: test/resolve.test.ts says a Sprint-34 perturbation reddens `TWENTY ASSERTIONS ACROSS FIVE FILES`. This sprint added no capability equality site, so nothing here falsifies it -- and correcting the number without RE-RUNNING that perturbation would replace a measurement carrying its provenance with a guess, which is worse than a number that may be stale and says who took it.",
      "NOTHING WAS SPLIT: both negative controls are constructible for BOTH halves, so the PBI's standing condition -- `if either half's negative control turns out unconstructible, they split` -- did not fire.",
      "`NONE WEAKENED` IS A COVERAGE CLAIM AND WAS MEASURED RATHER THAN RECALLED, because S13 forbids this one the `reasoned` option the justification standard otherwise allows. Diffed 8c69225..HEAD over test/ and src/ for every line containing `expect(`: SEVEN ADDED, ZERO REMOVED, ZERO CHANGED -- all seven in the new file. The matcher inventory moved in one direction only (toBe 314->315, toEqual 145->148, toContain 128->130, toBeGreaterThan 6->7, the rest identical), so no assertion was traded down. The pin's own `expect(...).toEqual({` line is UNCHANGED and only the object literal grew.",
      "AND THE SWEEP CAUGHT ONE OF THE EXECUTOR'S OWN, WHICH IS THE ENTRY EARNING ITS KEEP RATHER THAN BEING OBEYED: README's `each file imports the ones beside it`, WRITTEN THIS SPRINT AND FALSE WHEN WRITTEN -- only the config imports the handler modules, only the formatter imports a sibling, and wordnet.d.ts is imported by nobody. A coverage claim about a file set, in published prose, by someone who had the set open. Fixed in 53cfd3d by reading every import in examples/. Third instance this sprint of a claim that READS AS CHECKED, and the second one the author made.",
    ],
  },
  retrospectives: [
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
