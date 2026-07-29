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
      id: "PBI-37",
      story: {
        role: "tsudoi maintainer",
        capability:
          "add a method without re-writing the rejection check, the cancellation bridge and the capability contribution by hand",
        benefit:
          "a method that decides nothing does not compile, instead of joining a convention whoever writes it must remember",
      },
      acceptance_criteria: [
        {
          criterion:
            "READINESS GATE, AND THE FIRST SUBTASK: delete ONE method's capability `if` and ONE method's rejection check, and RECORD WHAT REDDENS. IF EVERYTHING REDDENS, THE CONVENTION IS DEFENDED AND THIS PBI IS WITHDRAWN.",
          verification:
            "the same probe src/notifications.ts ran, where deleting didChange's and didClose's checks reddened NOTHING and two of three copies proved to be pure convention. THE PO HAS NOW TWICE ARGUED THIS TABLE FROM THAT PRECEDENT WITHOUT CHECKING THAT THE PRECEDENT TRANSFERS. It is measurable in one subtask and must be measured before the table is built rather than cited again.",
        },
        {
          criterion:
            "Each entry carries a REQUIRED capability CONTRIBUTOR -- a function, not a key/value pair.",
          verification:
            "THE PROPERTY, NOT AN ENUMERATION, and the PO ruled the count REMOVED rather than corrected: no mechanical `methods[k] !== undefined -> capabilities[flag] = true` can express the five, because AT LEAST ONE contributes an OBJECT (completionProvider: {}) and AT LEAST ONE is NESTED INSIDE A KEY ANOTHER METHOD OWNS (completionProvider.resolveProvider). Immune to a fifth shape arriving -- and diagnosticProvider's value shape is STILL UNMEASURED, so even a corrected count may not survive contact with it. The criterion once read `four different shapes`; MEASURED at Sprint 31, documentFormattingProvider is `true` at top level, IDENTICAL to hoverProvider -- three value shapes, two placements. FOURTH WRONG COUNT IN THIS THREAD, and prefer-naming-to-counting applied to THE CRITERION CARRYING THE COUNT rather than to the count. THE GAIN IS COLOCATION AND REQUIREDNESS, NOT BREVITY -- roughly the same lines, in a place where forgetting them is a type error. ANYONE SELLING THIS AS A SMALLER src/server.ts IS SELLING THE WRONG THING.",
        },
        {
          criterion:
            "Every per-method REASON moves to its entry, and the PBI NAMES EACH PARAGRAPH MOVED AND WHERE IT WENT.",
          verification:
            "S9's audit-trail clause applied to PROSE. The precedent is exact and load-bearing: exit's carve-out reason lives AT ITS ENTRY, `so there is no second place to get it wrong`. Hand-writing also made the VALUE-SHAPE DIFFERENCES visible -- true, {}, and a nested key are three kinds of contribution, and reading them side by side is how anyone notices; a table flattening them to booleans would destroy that SILENTLY.",
        },
        {
          criterion:
            "src/server.ts's `spelled out, NOT DERIVED FROM THE SHAPE OF methods` clause is REWRITTEN, not deleted, recording WHY it goes.",
          verification:
            "its REASON -- a client is entitled to send whatever it was told about, so each capability is claimed only where the config can answer it -- IS THE STAKEHOLDER'S POLICY VERBATIM AND SURVIVES UNCHANGED. What is superseded is a MECHANISM stated as though it FOLLOWED from that reason. It does not follow. The rewrite says so, so the next reader does not reconstruct it as a policy reversal.",
        },
      ],
      status: "ready",
      notes: [
        "EXPECTED CONSEQUENCE, WRITTEN SO ITS ABSENCE IS A SIGNAL: once the rejection -> requestContext -> answerUnlessCancelled prologue is table-driven, ONE cancellation assertion covers EVERY method BY CONSTRUCTION rather than by copy -- which dissolves Sprint 31's recorded residual, a cancelled formatting request answered -32800 with nothing asserting it. IF IT DOES NOT DISSOLVE, THAT IS A SIGNAL ABOUT THE TABLE rather than a surprise.",
        "RE-CHECK WHETHER SPRINT 31'S CAPABILITY NEGATIVE CONTROL FIRES ALONE once the table lands. It cannot today, and the subsumption is STRUCTURAL rather than incidental -- it can never be first to fail while ANY exact-equality assertion exists on a config lacking formatting, and those cannot be weakened. If the table changes that, the note at its site goes; if not, it carries forward WITH A MEASUREMENT BEHIND IT rather than an assumption.",
        "MethodHandler accommodates a third promise-shaped entry with NO structural change; the seams are DOWNSTREAM, in registerMethods and in capability advertisement.",
        "THE THREE SHAPES ARE NOW MEASURED, TAKEN BY SPRINT 31'S EXECUTOR OFF THE SHIPPED TREE (provenance stated because this is a handed measurement): the readiness gate and the table are built against these rather than against predictions. Capability contribution: `hoverProvider = true`, `completionProvider = {}`, `documentFormattingProvider = true`. AND A SECOND AXIS NOBODY HAD NAMED, which any table must also carry or silently flatten: THE NO-HANDLER CASE HAS TWO SHAPES -- hover and formatting call `handler?.(...) ?? null` and build a RequestContext whether or not a handler exists, while completion returns EARLY, ahead of the context, because driving a generator needs one. The drive is awaited-once twice and generator-driven once, as predicted.",
        "AND CRITERION 2'S ENUMERATION IS IMPRECISE, SURFACED RATHER THAN EDITED because the criterion is the PO's and carries a readiness gate: `four different shapes` counts `documentFormattingProvider at top level` as distinct, but its VALUE SHAPE IS `true`, IDENTICAL TO hoverProvider'S -- and hover is top-level too, so placement separates them from nothing. What is measured is THREE value shapes across the five (`true`, `{}`, and a key nested inside another method's) and TWO placements. THE CRITERION'S CONCLUSION IS UNTOUCHED and if anything cleaner: a mechanical `flag = true` still cannot express `{}` or a nested key. Raised because a factual premise inside a criterion is a claim requiring measurement, not framing.",
        "THE RECORDED DECISION OPPOSING A TABLE SURVIVES INTACT: src/methods.ts's `there is no shape both fit into that is not an invention` is about THE DRIVE, and is correct. A table carries the type (giving params contextual typing exactly as defineNotifications does), a DRIVE KIND -- awaited-once or generator-driven, TWO, NAMED -- and the router applies the prologue and epilogue. No single shape is invented; a method picks one of two. MEASURED that two kinds cover all five: diagnostic declares partialResult, so it is generator-shaped like completion.",
      ],
    },
    {
      id: "PBI-38",
      story: {
        role: "editor user",
        capability: "see diagnostics for my language when my editor asks for them",
        benefit: "problems in my file surface without the config author wiring a notification path",
      },
      acceptance_criteria: [
        {
          criterion:
            "PULL ONLY. textDocument/diagnostic is served; push (textDocument/publishDiagnostics) is OUT OF SCOPE.",
          verification:
            "MEASURED: DocumentDiagnosticRequest declares ProtocolRequestType with HandlerSignature = RequestHandler, so IT IS A REQUEST -- RequestOnlyConnection is untouched and registerMethods already takes the narrowed handle. Push is deferred by the stakeholder, NOT filed, and the reason not to lose lives at src/notifications.ts.",
        },
        {
          criterion: "NO method-specific error type. MethodMap gains nothing.",
          verification:
            "diagnostic declares DiagnosticServerCancellationData where hover and completion have void. FORECLOSED, reversible at one token, with the reason: retriggerRequest is a server telling a client its analysis is TRANSIENTLY unavailable, and that needs a config author who can know that -- none has asked to be.",
        },
        {
          criterion: "Three simplifications are MEASURED BEFORE THEY BECOME CRITERIA, not assumed.",
          verification:
            "REASONED, all three, and the PO flagged them as such BEFORE rather than after: full reports only, no resultId / unchanged-report caching, and workspace/diagnostic excluded as a SEPARATE REQUEST rather than a variant. DocumentDiagnosticReport's declaration has NOT been read.",
        },
        {
          criterion: "The weakness is stated in the PBI rather than discovered.",
          verification:
            "a client that does not support pull gets NOTHING, where push would reach it. LSP 3.17+. `nvim and VS Code both support it` is REASONED -- A DECISION NOT TO MEASURE, NOT AN INABILITY: this repo has measured a real client before (the workspace-folder trailing-slash finding, MEASURED against nvim) and that harness still exists. Ruling for the first increment: tsudoi does NOTHING when a client that cannot pull connects -- it advertises correctly, the client's capability is legitimate, and a line per session is the noise that makes the one stderr channel useless.",
        },
      ],
      status: "ready",
      notes: [
        "Second use of the generator drive. Ordered after PBI-37 so the table is built against three measured shapes first, and the table LANDED at Sprint 32 -- so this method adds an ENTRY rather than a fourth hand-written registration.",
        "ITS CAPABILITY SHAPE IS MEASURED NOW AND IT IS THE HARDEST OF THE FIVE, taken at Sprint 32 by that sprint's executor off protocol 3.18.2 (provenance stated because this is a handed measurement): ServerCapabilities:1106 declares `diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions`, and DiagnosticOptions at protocol.diagnostic.d.ts:50-67 has TWO REQUIRED MEMBERS -- `interFileDependencies: boolean` and `workspaceDiagnostics: boolean` -- plus an optional `identifier`. SO NEITHER `true` NOR `{}` TYPE-CHECKS, and this entry's contributor must DECIDE BOTH BOOLEANS. `workspaceDiagnostics` is forced false by criterion 3's own exclusion of workspace/diagnostic; `interFileDependencies` IS A REAL QUESTION FOR A CONFIG AUTHOR and has no surface to answer it on, which is a refinement question this PBI now owns rather than meets at implementation time.",
        "THE GENERATOR DRIVE REQUIRES TWO THINGS OF A METHOD THAT PICKS IT, written at driveGenerator in src/methods.ts and repeated here because this is the method that will meet them: its params must carry a partialResultToken (DocumentDiagnosticParams declares PartialResultParams, so this holds) and its chunks must be ARRAYS, since aggregation concatenates them. DocumentDiagnosticReportProgress HAS NOT BEEN READ against that second requirement.",
        "AND IT INHERITS AN OBLIGATION TO test/fixtures/all-methods.ts: the by-construction prologue tests iterate the table, and a GENERATOR-DRIVEN method added without a handler there reddens the -32800 assertion. That is deliberate and is the fixture's whole point; it is written here so it arrives as a known step rather than as a surprise red.",
      ],
    },
    {
      id: "PBI-39",
      story: {
        role: "config author",
        capability:
          "fill in a completion item's detail and documentation only when the editor asks for it",
        benefit:
          "a completion list stays cheap to produce, and the expensive part runs once for the item the user actually looks at",
      },
      acceptance_criteria: [
        {
          criterion:
            "completionItem/resolve is served, and resolveProvider is advertised ONLY when a resolve handler exists.",
          verification:
            "MEASURED: ProtocolRequestType<CompletionItem, CompletionItem, never, void, void>, capability completionProvider.resolveProvider -- NESTED INSIDE A KEY ANOTHER METHOD OWNS. The first time the per-method-correctness rule has had to reach INSIDE another capability. It is also the only one of the five whose params are not a textDocument-plus-position shape: it takes an item and returns one, and NEVER TOUCHES THE DOCUMENT STORE.",
        },
        {
          criterion:
            "A config supplying completionItem/resolve WITHOUT textDocument/completion is REJECTED AT CONFIG LOAD, with a message naming the requirement.",
          verification:
            "the incoherent state -- resolveProvider on a completionProvider that does not exist, or worse bringing one into being and advertising completion tsudoi cannot answer -- is reachable FOR THE FIRST TIME by this method, and is exactly what src/server.ts's rule exists to prevent. RUNTIME REJECTION, NOT A COMPILE ERROR: expressing it in types would change TsudoiConfigFactory's signature ON THE PUBLISHED SURFACE, and conditional-type diagnostics read as noise to a stranger with one file and no context. gate is a compile error because it sits on TSUDOI'S INTERNAL table authored by maintainers; TsudoiConfig is authored by people this project cannot see, and PUBLISHED-SURFACE LEGIBILITY OUTRANKS CATCHING IT ONE STAGE EARLIER. Second reason: a type-level guard's negative control is a type-level probe, and this repo has measured THAT CLASS DEFEATED TWICE -- skipLibCheck, and Omit's silent no-op on an absent key.",
        },
        {
          criterion:
            "What resolve does with an item it does not recognise is RULED, not left as an implementation detail.",
          verification: "a client may send ANY item, not only one tsudoi's completion produced.",
        },
      ],
      status: "ready",
      notes: [
        "SHIPS AS ITS OWN PBI, argued on independent shipping: completion is already shipped and is UNCHANGED by resolve -- a config supplies a resolve handler or not, and completion behaves identically either way. THE COUPLING IS OF MEANING, NOT OF SHIPPING, and this project's test is what ships independently.",
        "PBI-31/32 BOUGHT THIS ONE NOTHING -- it never touches the document store. The affordability claim holds for TWO of the three new methods, IN ONE DIRECTION ONLY.",
        "NO GENERAL DEPENDENCY MECHANISM for the config-load check: there is exactly ONE instance. Write the one check with its reason beside it; generalise when a second arrives.",
        "THIS IS THE METHOD THAT ACTIVATES A DORMANT CONSTRAINT IN SPRINT 32'S TABLE, written here so it is a known step rather than a bug: capability contributors MUTATE, so one that writes into a key ANOTHER method owns must RUN AFTER that method's, and the table is iterated in DECLARATION ORDER. `completionItem/resolve` contributes `completionProvider.resolveProvider`, so ITS ENTRY MUST BE DECLARED BELOW `textDocument/completion`'s. Nothing checks this -- it is recorded at `CapabilityContributor` in src/methods.ts and here, and whether it deserves a check is a question for this PBI's refinement rather than an answer.",
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
    {
      number: 30,
      pbi_id: "PBI-30",
      goal: "TWO PBIs, ONE READING. PBI-30: the exit that ALREADY works when an editor dies stops being held by nobody -- two rigs pointing in OPPOSITE directions, plus the record at the line an added handle would be written on. PBI-29: the exit code of a REFUSED shutdown is ruled against the specification and asserted. The LSP sentence both turn on is read ONCE and recorded at src/lifecycle.ts's exitCode(); every other site POINTS at that block rather than restating it, because two copies read months apart can disagree.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "TWO PBIs SHIPPED UNDER THIS RECORD -- PBI-30 AND PBI-29. sprint.pbi_id names one because the SCHEMA CARRIES ONE, a type the team does not own; the arrangement was the PO's. Recorded here rather than fudging the field, and the schema is NOT changed for it.",
        "389 green from 381, 25 files from 24 -- EIGHT ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped, re-run independently by the Scrum Master.",
        "THE SPECIFICATION ARGUMENT IS BETTER THAN THE BEHAVIOUR IT CONFIRMS, and PBI-29's exit 1 was RULED rather than read off what runs: A REQUEST ANSWERED -32002 HAS SHUT NOTHING DOWN. Reading `received` as bare wire arrival makes a conforming server say `I am not initialized, I did not do this` and then `success` about the same request. Read at microsoft/language-server-protocol, branch gh-pages (the main path 404s), and recorded in EXACTLY ONE PLACE -- lifecycle.ts's exitCode() block, which already carried a paraphrase, FOUND BY GREPPING THE CLAIM'S WORDS.",
        "THE REFERENCE IMPLEMENTATION CONFIRMS THE MECHANISM RATHER THAN THE ANSWER: vscode-languageserver 10.1.0 exits 0 there and reaches it BY NEVER REFUSING -- ServerNotInitialized and 32002 appear NOWHERE in that package, grepped whole. So its 0 is not a competing reading of the specification; it is a server that never refuses. That dissolves BY MEASUREMENT a concern the PO had raised from recollection.",
        "C4'S PREMISE WAS FALSE AND THE PO OWNS IT: `it is 1 today by accident` -- IT IS 0, both runtimes, and not a harness difference. THE SEVENTH INSTANCE IN THIS THREAD of a premise the PO stated without checking. AND IT EXPOSED A GAP IN THEIR OWN SPRINT-25 ENTRY: `a premise about an artifact is not stated until that artifact has been read` works when the artifact is a file, and DOES NOT REACH A MEASUREMENT SOMEONE HANDED YOU -- `~11 registrars` and `exit 1 by accident` were both inherited, and `read it` has no referent.",
        "THE EXIT-0 ASSERTION IS A CHANGE DETECTOR, NOT A REQUIREMENT PIN, and must say so at the site: the specification's 0/1 sentence governs the exit NOTIFICATION and rules NO CODE for the EOF path. 0 is UNRULED, not required. What the assertion buys is that the value changes only DELIBERATELY -- and the rationale is STRONGER at 0, because routing this path through lifecycle.exitCode() would flip 0 to 1 VISIBLY where at 1 the same edit would have been invisible. Leaving the behaviour untouched was right: there is no requirement to satisfy, so changing it would have pinned an arbitrary preference.",
        "THE C1 PRESENCE ASSERTION'S RATIONALE DID NOT SURVIVE MEASUREMENT, and the PO ruled the correction matters more than the disposition: they wrote it was non-optional BECAUSE a deno run had failed to launch and logged nothing, and THAT FAILURE IS CAUGHT EARLIER, AT THE HANDSHAKE. KEPT BUT RELABELLED -- under S9 it is NOT A CONTROL, since it cannot be first to fail on either constructible failure and S15 deleted a test for exactly that. It is a GUARD AGAINST ONE FUTURE SIMPLIFICATION: a rig reporting a pid without waiting for the handshake. The comment must say PLAINLY that it cannot currently fire and when it would -- the S19 pattern, and the reason two of four boundary probes were found measuring nothing at Sprint 28.",
        "TEN PERTURBATIONS. P1 (un-unref'd setInterval) reddens C1 AND the EOF cells with the FIFO rig GREEN; P5 (unref'd parent-pid poll) reddens the FIFO rig ALONE with C1 green. THE PO'S TWO-RIGS-OPPOSITE-DIRECTIONS RULING WAS REASONED WHEN MADE AND IS MEASURED NOW.",
        "P6 (reader.onClose) IS INERT ON DENO -- fires on bun only. It would have recorded `defended` for a cell it could not flip on half the runtimes: A CROSS-RUNTIME BLINDNESS IN A PERTURBATION, which is a place nobody thinks to look.",
        "A NEAR-MISS THAT WOULD HAVE BEEN A FALSE REPORT OF A DISARMED CONTROL: the first Sprint 29 re-run reddened NOTHING because TextDocument.update MUTATES ITS ARGUMENT, so the obvious perturbation perturbs nothing. Caught before recording. The Sprint 14 standing re-run producing its value and nearly producing its own false negative in the same act.",
        "THE PLAN'S `DROP THE FIFO` WAS REFUTED BY MEASUREMENT: handing the server the editor's own fd 0 shares the socket endpoint, but child_process DESTROYS a dead child's stdin stream, so the test's own runtime closes the write end and the rig SILENTLY DUPLICATES C1 -- two tests measuring one thing, both green.",
        "THE STAKEHOLDER ASKED WHETHER AN UNUSED sendNotification SHOULD BE DELETED. THE PREMISE WAS CORRECTED RATHER THAN ACTED ON, and the distinction recurs for every unused member of a borrowed type: THIS IS NOT DEAD CODE, IT IS AN UNUSED CAPABILITY ON A TYPE TSUDOI DOES NOT OWN. Nothing to delete. NO PBI: a coherent principle exists -- an outbound message must be part of answering a request, which includes sendNotification and correctly excludes sendProgress -- but it has ONE INSTANCE to generalise from and would foreclose a capability the stakeholder DEFERRED RATHER THAN CANCELLED. Applying the rule-of-three inconsistently BECAUSE A STAKEHOLDER ASKED would be the worst available outcome.",
        "AND THE GREP FOUND THE THING WORTH RECORDING: src/ contains EXACTLY ONE outbound call, sendProgress at methods.ts:382, and IT IS BOUNDED ONLY BY PLACEMENT -- it sits inside a completion handler already behind the request rejection, so it cannot run outside the serving window, but NOTHING SAYS SO. Not `there is no outbound gate` but `THERE IS AN UNGATED OUTBOUND PATH ALREADY, HELD BY WHERE A CALL HAPPENS TO SIT`. THIRD INSTANCE OF THE SHAPE, after PBI-30's exit held by an empty event loop and the empty-contentChanges guard held by a comment nothing backed.",
      ],
    },
    {
      number: 29,
      pbi_id: "PBI-32",
      goal: "An editor sends only the part of the buffer that changed: tsudoi advertises Incremental and applies ranged changes AT THE RIGHT OFFSET -- and the two properties that could rot silently underneath that change, correct offset application and the live-reference semantics Sprint 28 introduced, are each held by a test rather than by a paragraph.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 68a15f4..fc998d8. 381 green from 375 -- SIX ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped, re-run independently by the Scrum Master. src/server.ts now advertises {openClose: true, change: Incremental}. scrum.ts committed ALONE four times; the hook was never bypassed.",
        "THE ALIASING GATE WAS A REAL HOLE, WHICH VINDICATES REQUIRING IT RATHER THAN TRUSTING THE DISCLOSURE. P1 -- returning a new instance from TextDocument.create -- reddens THE GATE'S FIRST ASSERTION AND NOTHING ELSE IN 376. The silent reversal the PO warned of at Sprint 28 would have been exactly silent.",
        "P6 IS THE PART NOBODY ASKED FOR AND THE PART THE PO SAYS THEY WOULD HAVE MISSED: re-running the gate AT FINAL HEAD, because the rewrite of the update call IS THE CRITERION'S OWN PREMISE. A born-green gate measured only BEFORE its premise moved would have proved nothing about the shipped tree.",
        "IDENTITY (before === get(uri)) IS DELIBERATELY NOT ASSERTED, and the PO records this as S13 applied by the person it constrains: identity is the MECHANISM, and the property assertion reddens on every route the mechanism could change.",
        "A STANDING RE-RUN OF SPRINT 28'S P3 against the file THIS sprint edited -- showing the doc-block additions did not disarm the control. That discharges the Sprint 14 item's SECOND rationale (it also detects disarmed controls), recorded in case the cost was ever questioned, and paying out here for the first time.",
        "GREP BEAT READING, AND IT BEAT THE SCRUM MASTER'S VERIFICATION TOO. The PO's `prose list is now three items` was written ONE PARAGRAPH AFTER they wrote `grep, do not recall`, and listed from memory. The category is wider: src/server.ts carried a SECOND full-sync claim away from the capability line, test/sync.test.ts carried the same under-full-sync premise, and A TEST NAME carried it. TWO GENERALISATIONS: PROSE LIVES IN TEST NAMES, a home invisible to any search for comment syntax -- so GREP FOR THE CLAIM'S WORDS, NOT FOR THE PLACES COMMENTS LIVE. And A git diff ANSWERS `DID THIS CHANGE?`, NEVER `IS THIS LIST COMPLETE?` -- they look like the same check at Review and are not, which is the specific way the error survived verification.",
        "CRITERION 3'S HEADLINE `Two` WAS A CRITERIA EDIT, NOT A SCOPE CHANGE: the criterion's PROPERTY was always `the falsified full-sync claim does not survive anywhere`, and the word was an ENUMERATION OF WHERE THE PO BELIEVED IT LIVED. Sprint 22 governs -- a factual premise stated inside a criterion is a claim requiring measurement, not framing. Correcting an enumeration to the category it stood for is the criterion being MET, not widened; and repairing a headline that contradicted its own verification text is never a scope decision.",
        "A DECISION KEPT DELIBERATELY WAS HELD BY NOBODY: deleting the empty-contentChanges guard left ALL 380 GREEN while the comment beside it asserted the version does not move. THE PO RECLASSIFIED THE SHAPE, because a shape determines which remedy applies: this is NOT the PBI-30 shape (a property held by an ABSENCE, breaking by ADDITION, remedied by unref) but the S8 SPRINT-18 ADDITION firing -- a comment asserting current behaviour states whether an assertion backs it. Correct handling, correct rule, wrong parent. Now asserted, with MEASURED carrying version 1.0.12 and the declaring file.",
        "textDocumentSync WAS CHECKED BEFORE IT COULD SURPRISE ANYONE: three test files assert it exactly, plus lifecycle.test.ts said `full-sync` IN ITS TEST NAME. Ten assertions across two runtimes reddened on the expected value alone. NO toEqual WAS LOOSENED -- only the expected value moved -- so S16 is correctly NOT engaged, a distinction easy to misread at a glance and worth stating explicitly.",
        "RE-MEASURING AFTER A SIXTH TEST ARRIVED, rather than incrementing a recorded 380, is prefer-naming-to-counting applied PROSPECTIVELY -- the first time in this thread that clause PREVENTED an error instead of catching one.",
        "src/documents.ts's last-entry read WITHDRAWN AT THE SITE AS A DECISION rather than deleted in passing. Ranged changes exercised OVER THE WIRE on both runtimes, not only as a unit test.",
        "PBI-35'S TRIGGERS CONFIRMED BY THE SCRUM MASTER RATHER THAN BY THE PO'S REASONING, which the PO insisted on: git diff shows test/package-shape.test.ts BYTE-IDENTICAL since sprint-27 (trigger 2 unmet), and this sprint touched no install path and added no second artifact precondition (trigger 1 unmet).",
      ],
    },
    {
      number: 28,
      pbi_id: "PBI-31",
      goal: "The document a config author receives IS upstream's TextDocument -- IDENTITY, not resemblance -- so getText(range), positionAt, offsetAt and lineCount come from a package other people maintain; and the published surface DEFENDS the new name rather than letting it ride on the eight names' coverage.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in a3e81ae..db7e768. 375 green from 367, 24 files from 23 -- EIGHT ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped, re-run independently by the Scrum Master. package.json now declares vscode-languageserver-textdocument alongside the protocol package. scrum.ts was committed ALONE four times and the hook was never bypassed.",
        "THE IDENTITY-NOT-ASSIGNABILITY CRITERION EARNED ITS PLACE ON THE FIRST NAME IT WAS WRITTEN FOR, AND THE SHADOW WAS NOT HYPOTHETICAL: vscode-languageserver-protocol re-exports vscode-languageserver-types WHOLE, and that package STILL CARRIES A TextDocument -- same seven members, no update, its own comment reading `@deprecated Use the text document from the new vscode-languageserver-textdocument package`. THE WRONG ANSWER IS ONE LINE, ADDS NO DEPENDENCY, AND IS EXACTLY WHAT A FUTURE `SIMPLIFICATION` WOULD WRITE.",
        "P3 IS THE PAYOUT: pointing src/types.ts at the deprecated twin leaves tsc --noEmit at 0, the reachability probe at 0, the value probe unchanged and the eight-name probe green -- AND THE IDENTITY PROBE IS THE ONLY FAILING TEST IN THE WHOLE SUITE. A structural or assignability criterion would have observed NOTHING. S20 exactly: if two outcomes produce the same observation, the measurement records nothing.",
        "P1 IS WHAT MAKES THE TYPE-ONLY FORECLOSURE DEFENDED RATHER THAN MERELY STATED: a value re-export reddens the CompletionItemKind runtime-value test ALONE. A foreclosure nothing would notice being reversed is not a foreclosure.",
        "THE BREAK LANDED WHERE CRITERION 5 PREDICTED -- test/completion-path.test.ts's hand-written mock, the only one in the tree. Implementors, not consumers; one TextDocument.create fixed it.",
        "CRITERION 5'S STATEMENT IS NOW FALSE AS WRITTEN, AND THE PO RECORDS THE CORRECTION RATHER THAN REPLACING IT SILENTLY: `the break is on implementors, not on consumers` REACHES ANY CONSUMER HOLDING A DOCUMENT REFERENCE ACROSS AN await, because TextDocument.update RETURNS THE SAME INSTANCE. The condition the PO imposed on the Scrum Master last sprint -- a false claim corrected in place with no record that it was made is indistinguishable from one that was always right -- applied to themselves.",
        "THE ALIASING CHANGE IS ACCEPTED AS DEFENSIBLE, CHECKED AGAINST TSUDOI'S SNAPSHOT DOCTRINE BEFORE RULING: RequestContext.workspaceFolders is a SNAPSHOT OF REQUEST START, but THE STORE WAS ALWAYS LIVE -- documents.get(uri) has always returned current state -- so what changed is only whether a PREVIOUSLY OBTAINED reference tracks updates. Under the old semantics an author holding a document across an await saw SILENTLY STALE text and computed against a buffer the user had already changed. MOVING IS THE LESS SURPRISING HAZARD, and it is what upstream does, which is the point of adopting upstream. MINOR FIX was considered and rejected on the PO's own test: Sprint 25 was withheld because the SHIPPED STATE CONTAINED A DEFECT; here it is correct, disclosed at the site, and withholding would push toward restoring snapshot semantics by hand -- the machinery this PBI exists to retire.",
        "THE ASSERTION IS OWED AND GOES TO PBI-32 AS A CRITERION, NOT AS A GOOD INTENTION, because PBI-32 changes how update is CALLED and could silently flip it back to new-instance semantics.",
        "FOUR SELF-CAUGHT ERRORS, ALL BEFORE REVIEW, THREE OF THEM INSTANCES OF ENTRIES FILED BY OR AGAINST THE PO. `the only one of 372 tests` was TRUE WHEN MEASURED AND FALSE THREE TESTS LATER, IN THE SAME SPRINT -- prefer-naming-to-counting demonstrated inside the sprint that violated it. `THREE SITES carry the falsified claim` was counted BY READING and grep found three more never opened; the remedy is the generalisable half, GREP DO NOT RECALL, and the replacement prose naming `tsudoi's own declared dependencies` rather than listing packages is that lesson applied constructively -- NAME THE CATEGORY, NOT THE MEMBERS. `the same document implementation the reference LSP server uses` was REASONED, NOT MEASURED, and replaced with what was actually read.",
        "THE PRE-PLAN SPIKE FOUND ITS OWN DEFECT FIRST: without an anchoring import the augmentation fails TS2664 `module cannot be found` instead of naming the marker, which reads as a missing dependency. Fixed before anything was recorded.",
        "Range was NOT added to the published surface -- structural {start, end} needs no import, and `an author might want it` is precisely what src/types.ts's rule for a ninth refuses. Type-only keeps the PO's lean, and execution surfaced the counterexample class they had not: an author unit-testing a handler must BUILD a document. The reversal condition is written as EVIDENCE THAT AUTHORS ARE WRITING IT, not the prediction that they might.",
        "test/sync.test.ts, test/documents.test.ts and src/server.ts are BYTE-IDENTICAL to a908f63, verified by git diff rather than by assertion -- closing the honest gap the PO left when they declined to claim anything about sync.test.ts. PBI-32 therefore still owns both of its prose corrections.",
      ],
    },
    {
      number: 27,
      pbi_id: "PBI-34",
      goal: "The bare-specifier choice at src/types.ts stops being defended by a paragraph saying nothing defends it: a probe stands up its OWN skipLibCheck:false / types:[] tsconfig against the INSTALLED package, and the probe's own ability to go blind is itself defended.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 3394fc5..a2eb1f7. 367 green from 363 -- FOUR ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately with its exit read directly and re-run independently by the Scrum Master. tsconfig.json and consumerCompilerOptions were NOT touched; the probe carries its OWN tsconfig at skipLibCheck:false and types:[].",
        "FOUR PERTURBATIONS IN A PLAN THAT ASKED FOR THREE. P3 -- making the perturbation a NO-OP (compute the replacement, never write it) -- showed control 1 failing ALONE while CONTROL 2 PASSED: a measured demonstration that control 2's green is satisfiable BY A PERTURBATION THAT NEVER HAPPENED. The S20 degeneracy found BEFORE it could record anything, and answered STRUCTURALLY (one shared consumer) rather than by a note.",
        "P4 WAS RUN BECAUSE THE EXECUTOR'S OWN DOC BLOCK CLAIMED CONTROL 2 `CAN BE THE FIRST THING TO FAIL` WHILE P1-P3 HAD ONLY SHOWN THE OPPOSITE DIRECTION -- a sentence that was REASONED AND READ AS MEASURED. Closed by measuring rather than by softening the wording. Nobody asked for it; the PO records it as the one they would have missed.",
        "TIDY-FIRST IN ITS CORRECT ORDER: the eight-name list was extracted to a shared helper BEFORE the second probe was written, so NO DUPLICATE EVER EXISTED. The structural change ahead of the behavioural one, leaving no moment in which two copies could drift.",
        "THE COUNT THE SCRUM MASTER HANDED OVER WAS WRONG FOR THE SECOND SPRINT RUNNING. Briefed as `six errors, all inside vscode-jsonrpc`; re-measured at protocol 3.18.2 / jsonrpc 9.0.1 / types 3.18.0 it is ELEVEN ACROSS TWO FILES -- and src/types.ts HAD SAID ELEVEN ALL ALONG. The PO ruled this NOT a distinct retrospective instance but THEIR OWN SPRINT-25 ENTRY'S FIRST CATCH OF SOMEONE OTHER THAN THEMSELVES: a premise about an artifact stated without opening the artifact, which was right there with the correct number in it. A third rule about counting would be the same rule in a different coat.",
        "WHAT MADE IT COST NOTHING: PBI-34'S CRITERIA CARRY NO COUNT -- criterion 2 says `naming NodeJS or child_process`. The wrong number lived ONLY IN PROSE IN FLIGHT and never reached a binding artifact. Prefer-naming-to-counting applied at AUTHORING time rather than as a catch, which is the strongest form of a rule working.",
        'A PLANNING CLAIM MEASURED FALSE, and the PO ruled recording it REQUIRED RATHER THAN CUSTOMARY: `repo-wide skipLibCheck:false surfaces the eleven diagnostics through src/\'s /node imports` is FALSE -- tsconfig.json carries types:["node","bun"] so those resolve, and tsc instead exits 1 with FOUR diagnostics INSIDE @types/bun\'s own declarations. A FALSE CLAIM CORRECTED IN PLACE WITH NO RECORD THAT IT WAS MADE IS INDISTINGUISHABLE FROM A CLAIM THAT WAS ALWAYS RIGHT. The conclusion stands on BETTER ground: the same fragility the new probe discloses about itself, demonstrated on this repo\'s own dependency.',
        'skipLibCheck:false in consumerCompilerOptions REDDENS NOTHING AND WOULD SEE NOTHING, because types:["node"] cancels it. Recorded at the constant per the Lifetime Rule\'s site clause, and it is the argument for the probe carrying its own tsconfig.',
        "P1 INITIALLY FLIPPED AT A beforeAll HELPER GUARD, killing the file so the suite went red naming a helper while the diagnostic naming the cause was never printed. NOT the S4 split case -- nothing was bundled; the defect was a harness failing OPAQUELY. Fixed by memoised build-on-first-use: the PROPERTY (both controls observe one tree, which is what makes P3's finding meaningful) is preserved and only the MECHANISM moved. S13 applied unprompted, by the person it constrains.",
        "FOURTH OCCURRENCE OF THE PIPED-EXIT CLASS (${PIPESTATUS[0]} empty in zsh), caught in the same turn and re-run unpiped before anything was recorded. NO NEW ENTRY: the S15 entry is working and its load-bearing half fired -- a report carrying the command as run shows its own defect to any reader. But four occurrences means this remedy is DETECTION, NOT PREVENTION, which the PO ruled acceptable for a habit of this kind PROVIDED IT IS SAID OUT LOUD rather than assumed.",
        "PBI-35'S TRIGGERS CHECKED, NONE FIRED, and the check itself is recorded because A TRIGGER NOBODY CHECKS IS A TRIGGER THAT DOES NOT EXIST. The new probe needs dist/, so a fresh clone now fails a few more tests -- the SAME artifact precondition, not a second one, so trigger 1 is unmet; the detector is untouched, so trigger 2 is unmet. The PO DELIBERATELY DECLINED to add a magnitude trigger: the steady-state argument never rested on the count, only on the failure being loud, self-service and naming its own remedy, and inventing a threshold with no principle behind it would be worse than the state it guards.",
      ],
    },
    {
      number: 26,
      pbi_id: "PBI-33",
      goal: "Why tsudoi does not serve on vscode-languageserver's Connection is readable AT THE LINE THAT WOULD CHANGE IT, in BOTH directions and re-runnable; the two smaller homes are written; and the two withdrawn PBIs stop being custody.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in bc408ca..88fe17f. 363 tests green from 360 -- THREE ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately with its exit read directly, and re-run independently by the Scrum Master. ACCEPTED at Review; the PO made the contrast with Sprint 25 explicit: there the DoD's first check was FALSE OF MAIN AS CLONED, a defect in the shipped state, whereas here the tree is clean and both open items are about THE PO'S OWN AUTHORING rather than the increment.",
        "THE EXECUTOR RE-RAN THE MEASUREMENT RATHER THAN COPYING IT, and it caught an error in the criterion. vscode-languageserver is not a dependency, so they installed 10.1.0 OUT OF TREE and enumerated Connection with the compiler API. Confirmed 58 members, onUnhandledNotification and trace absent, tracer present. CORRECTED: the criterion's `~11 ungated top-level notification registrars` IS NINE -- the eleven counted onNotification (which the Omit DOES remove) and onShutdown (a REQUEST registrar). The record names all nine. THE PO'S OWN SPRINT-22 CLAUSE, PREFER NAMING TO COUNTING, violated in the criterion that carried it and caught by the executor rather than by its author. FOURTH INSTANCE of a premise inherited from a handback and stated flat.",
        "THE TWO WIRE MEASUREMENTS WERE DELIBERATELY NOT RE-RUN -- fillServerCapabilities adds nothing, onShutdown coexists with -32600 -- because they need a spawned server. The record carries issue #1's attribution and paths rather than claiming a fresh measurement, and SAYS SO IN ITS OWN TEXT. S8 exactly: a measured claim records what would let it be re-run, and a RE-USED measurement says whose it is.",
        "A WITHDRAWN PBI IS NOT A HOME, and this is the durable principle the sprint delivered. The Lifetime Rule names three homes -- a permanent assertion, a comment at the site it constrains, an active improvement -- and a withdrawn PBI's criteria are NONE of them. PBI-27 and PBI-28 were kept as CUSTODY ONLY and deleted here, in a commit naming where each decision went: the why-not record at createGatedConnection, the always-arm scope-decision sentence at notifications.test.ts, and the Pick-not-Omit instrument preference with its reversal condition at RequestOnlyConnection.",
        "CRITERION 2'S `SAME COMMIT` CLAUSE IS UNCONSTRUCTIBLE, and the PO ruled the fault their own: a git hook refuses any commit whose staged set includes scrum.ts beside another file, and it reads the WORKING TREE, so scrum.ts cannot even be dirty while something else is committed. Delivered as two commits, homes FIRST then deletion, and NOT BYPASSED -- declining to evade a hook is correct in a project that names deliberate evasion as its own class. THE DEEPER POINT, S13 fired against a clause the PO wrote: THE CLAUSE NAMED A MECHANISM WHERE A PROPERTY WAS MEANT. What it protected is that no window exists in which a decision is deleted from custody but not yet written to its home -- and the delivered order preserves that AND MAKES IT VISIBLE IN HISTORY, which one commit would have hidden.",
        "A MACHINE-CHECKABLE ORPHAN RULE WAS DECLINED, NOT OMITTED, and accepted as NOT CONSTRUCTED in both halves: the general rule cannot be written without an exception, because PBI-33's own criterion names PBI-27 and PBI-28 AND MUST -- and AN EXCEPTION ROTS, which this repository has already said about its own lint exemptions. The weaker pin (`backlog contains no PBI-27/28`) was refused as vacuous under S9 and S7. RESIDUAL ACCEPTED AS STATED: a future note citing a deleted PBI is caught by NOTHING BUT A READER.",
        "THE TOKEN ASSERTION'S BOUNDARY, stated so nobody later reads it as stronger: it defends that the FOR-ADOPTION FACTS ARE PRESENT -- delete the paragraph and the tokens vanish and it reddens -- but NOT their FRAMING. Nothing asserts they are presented as the case for adoption rather than buried. That is the right boundary: pinning placement over-fits under S7, and the immediacy control already binds the block to the anchor. The advocacy-document requirement is defended IN SUBSTANCE AND NOT IN FORM.",
        "THE SPRINT-25 RETROSPECTIVE ENTRY FIRED ON ITS FIRST SPRINT IN FORCE, AND BY SELF-REVIEW. The record grouped workspace.onDidChangeWorkspaceFolders with three NotificationHandler-taking members; it is an Event property. THE EXECUTOR'S OWN MEASUREMENT DISTINGUISHED THEM AND THEIR PROSE DID NOT -- caught on a second pass by its author, fixed in 88fe17f. The same pass upgraded the languages claim from ASSERTED to MEASURED across all nine nested namespaces, which is the same discipline in its constructive direction.",
        "RESTRAINT RECORDED TWICE AS CORRECT: the executor flagged PBI-33's own note (which had gone stale the moment the deletion landed) rather than rewriting a PO-authored note mid-execution, and declined to bypass the git hook. Both are `not mine to decide, so I surfaced it` -- which is what makes this record trustworthy rather than tidy.",
      ],
    },
    {
      number: 25,
      pbi_id: "PBI-26",
      goal: "A config author installs ONE package: the examples get every protocol name they use from @atusy/tsudoi/types, and a consumer that never declares vscode-languageserver-protocol can both TYPE-CHECK and RUN them.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 1811f78..9501c68 plus the Review fix bb7a37d. 360 tests green from 347, each DoD command run separately with its exit read directly. EVERY PLANNED PERTURBATION FIRED, including the two that were mandated: adding DefinitionParams reddens the ninth-name test ALONE, and disabling renameSync reddens the negative control AND ONLY IT.",
        "REVIEW RETURNED MINOR FIX, and the increment did NOT ship on its first presentation. `bun test` on a fresh clone failed -- MEASURED by the Scrum Master rather than taken on report, 30 fail / 299 pass with dist/ absent. INTRODUCED, NOT REVEALED: examples/ already imported @atusy/tsudoi/types but TYPE-ONLY, erased at runtime, so the exports map's import arm was never resolved; B4 converted a type edge into a VALUE edge, which is the whole of PBI-26.",
        "THE PO DECLINED TO SHIP IT ON THIS PROJECT'S OWN RULE -- Sprint 24's `a correct number attached to the wrong thing is still a false report`. 357 pass was a correct number attached to a tree holding an untracked artifact main does not have, so the DoD's first check was FALSE OF MAIN AS CLONED. They also declined to reverse at Review when the fix turned out expensive: `that is the cost driving the verdict, which is exactly backwards`.",
        "THE FIX IS DOCUMENTATION, AND THE PO'S OWN CRITERION WAS WITHDRAWN TO GET THERE. They wrote `bun test on a fresh clone passes` and then found it STRICTER THAN THIS REPOSITORY'S SETTLED STANDARD, which they had not checked either: README.md already documents a loud precondition for bun test (deno on PATH, failing rather than skipping ON PURPOSE). The replacement criterion is that the precondition is DOCUMENTED and the failure NAMES ITS OWN REMEDY. The difference they insisted on recording rather than smoothing over: deno-on-PATH is an ENVIRONMENT precondition, this is an ARTIFACT one -- the source tree is not self-consistent until a build runs.",
        "WAY 1 WAS RULED AGAINST ON A COST THE FIX COULD NOT CARRY: an automatic develop-time build makes package-shape.test.ts's stale-dist detector UNABLE TO FAIL, and S15 already deleted a test for exactly that -- so it OBLIGES deleting a test written three days earlier, inside the sprint that wrote it. Adopted verbatim from the Developer: `retiring a test written three days ago, inside the sprint that wrote it, is a PBI-sized decision, not a fix`.",
        "A PREMISE OF THE PO'S VERDICT WAS ITSELF FALSE, and the S16 withdrawal it produced was RETRACTED. They withdrew package-shape.test.ts's publish-time-build decision believing the fix falsified it. Measured: it asserts only that prepack is PRESENT WITH THAT VALUE -- deliberately loosened at PBI-9 for precisely this case -- so adding a script reddens nothing, and this sprint had ALREADY amended the prose. An S16 scope decision recorded against a decision that did not need one is itself a FALSE RECORD.",
        'A FOURTH WAY WAS SOUGHT AND REFUTED BY MEASUREMENT: an exports array fallback ["./src/types.ts", "./dist/types.js"] does NOT fall through on a missing file -- bun 1.3.13 and deno 2.9.2 both take the first entry, matching Node\'s semantics where array fallback covers INVALID targets rather than ABSENT ones. A `development` export condition works on both runtimes but must reach bun test, every LspSession spawn and the README\'s executed commands. CONCLUSION: there is no free fourth way -- @atusy/tsudoi/types must resolve to a FILE, and the only files present in both the repo and a consumer are the built ones.',
        "THREE PO-AUTHORED PREMISES MEASURED FALSE and corrected in place. (1) Criterion 3's mechanism: `the existing extraction harness executes it` -- NOTHING extracts README.md:180 at all; delivered via a separate examples-install marker, deliberately NOT a sixth quickstart step because folding it in would make the omission sweep assert something false. (2) B4's second control: `withhold wordnet and the examples must still fail` is FALSE at the type arm -- examples/wordnet.d.ts declares the module ambiently -- and survives only at the RUNTIME arm, which the PO had not named. (3) THE ONE THAT MATTERS: the bare-vs-/node measurement holds ONLY with skipLibCheck OFF, and this suite sets it ON, so NO PROBE IN THIS REPO COULD REDDEN IF src/types.ts MOVED TO /node.",
        'SKIPLIBCHECK DEFEATED A PROBE FOR THE THIRD RECORDED TIME in this project (S9 already names it once). The four-cell table settles the design: skipLibCheck:false with types:["node"] does NOT discriminate, skipLibCheck:true with types:[] does NOT discriminate -- ONLY THE PAIR reddens. The Developer reached that design independently of the PO\'s specification, which is what makes it trustworthy.',
      ],
    },
    {
      number: 24,
      pbi_id: "PBI-25",
      goal: "Judge the completeness of the notification gate against the protocol rather than against memory.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 9c18681, a62dccd and 54d3b4a. 347 tests green from 343, each DoD command run separately with its exit read directly -- and an earlier TRUE green was DISCARDED because it was taken against the wrong tree state and re-run at HEAD. Nobody asked for that: a correct number attached to the wrong thing is still a false report.",
        "THE MECHANISM THE PO NAMED WAS INSUFFICIENT FOR HALF ITS OWN PROPERTY, measured both ways: a member the DEPENDENCY adds lands on BOTH sides of the set difference and CANCELS OUT. Following the named mechanism literally would have shipped a green suite against the criterion's own headline case. Delivered by TWO pins instead. THE PO'S SECOND MECHANISM FAILURE, and the first against a clause THEY authored -- not filed, because the rule caught it and the implementer caught it inside the sprint, which would be filing for a success.",
        "THE PROJECT'S FIRST FALSE `MEASURED` LABEL, and the PO insisted on attributing it correctly rather than conveniently: `fires whether or not a handler exists` came from Sprint 23 CARRYING THE TAG, so deriving from it was legitimate -- RELYING ON A MEASURED LABEL IS WHAT THE LABEL IS FOR. Their own part was amplifying a COMPARATIVE without marking it DERIVED. MEASURED AT 9.0.1: the third site sits INSIDE `if (notificationHandler || starNotificationHandler)`, so a Tracer sees every notification THAT HAS A HANDLER plus the two cancel sites -- COMPLEMENTARY, not broader. Scope unchanged, and THE CORRECTED READING IS THE STRONGER JUSTIFICATION: what puts trace in the Omit is ORDER, not breadth -- the trace call precedes the handler and the gate lives inside it.",
        "THE ENUMERATION IS DONE BY tsc, NOT BY PROSE: keyof ProtocolConnection asserted equal to a fifteen-name union whose left side the COMPILER reads out of the installed .d.ts, so the two cannot quietly agree. A PROSE LIST IS EXACTLY WHAT LET onProgress AND trace SIT UNNOTICED. Weakness stated: the diagnostic is TS2344 on a boolean -- it names file and line, NOT which member moved.",
        "THE HEADLINE CASE WAS CONSTRUCTED RATHER THAN ARGUED: a member added to the dependency's OWN .d.ts reddens the enumeration pin alone, skipLibCheck was shown NOT to blind it, and the tree was reverted from a byte-verified copy. And a star-handler OVERLOAD added to the dependency exits 0, which converts `the pin sees NAMES, not BEHAVIOUR` from reasoned to measured.",
        "A THIRD LIMIT NEARLY SHIPPED UNNAMED: createProtocolConnection returns createMessageConnection's result UNCHANGED, and MessageConnection declares inspect and onUnhandledProgress which ProtocolConnection does not -- so THE PIN COVERS THE TYPE WHILE THE VALUE IS WIDER. Off the type, off the pin, reachable only by a cast: the deliberate-evasion class, fourth of its kind. It is why the headline sentence is bounded to `on its type`.",
        "THE SELF-REFERENTIAL RULE FIRED SIX TIMES on prose written this sprint, all caught on a second pass -- including two TRUE counts replaced by names, and a type NAME, BoundaryIsExactlyTwoMembers, whose count was true when written and false one widening later.",
      ],
    },
    {
      number: 23,
      pbi_id: "PBI-24",
      goal: "Close the most reachable residual -- notification traffic cannot be watched around the gate on the handle startServer holds.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 9c25a44 and 1a6c2d5. 343 tests green from 341, each DoD command run separately with its exit read directly.",
        "THE CRITERION IS MET AND THE GOAL IS NOT, and the PO ruled the asking wrong rather than the delivery: they wrote `notification traffic cannot be watched around the gate` on A CLAIM MADE FROM RECALL. The executor ENUMERATED ProtocolConnection's fifteen members instead of recalling them and found TWO MORE on the handle -- onProgress installs a $/progress handler, and trace() hands EVERY RECEIVED notification to a caller-supplied Tracer, firing at three sites WHETHER OR NOT A HANDLER EXISTS. Same reachability class as the member just closed, which was the PO's whole argument for filing this over the Scrum Master's objection.",
        "THEY RECORDED BOTH AND DECLINED TO CLOSE THEM -- the no-retroactive-scope discipline applied to themselves for the second time, and what makes the shortfall VISIBLE rather than absorbed. Verified that nothing in src/ calls either, so the site prose makes no false claim about present behaviour.",
        "`THE LAST ITEM OF ITS KIND` WAS A MISTAKE AND NO NEW RULE FOLLOWS: the coverage rule reaches it, enumeration was cheap and available, and this is its FIFTH catch of the PO. ONE MECHANISM RECORDED AS OBSERVATION RATHER THAN RULE: they hedged with `the last such item I can see`, and ASKING FOR IT TO BE STATED PLAINLY STRIPPED THE HEDGE -- which explains why hedging felt sufficient and was not.",
        "THE SELF-REFERENTIAL-PROSE RULE CAUGHT FOUR, THE FOURTH WRITTEN IN THIS SPRINT'S OWN COMMIT: `the two members through which a holder could see notification traffic without the gate` was FALSE WHEN WRITTEN, in the commit that closed the second member. And `nothing in this file's defence rests on an exit code` was written this sprint and wrong when written -- both probes DO assert result.code -- corrected to `no probe may DISCRIMINATE on it`. The count `three` silently falsified when the fourth arrived, which is the naming-over-counting clause demonstrated inside the sprint that filed it.",
        "TWO PERTURBATIONS EARNED THEIR KEEP. Keeping ONLY the new key reddens the three onNotification probes while BOTH NEW PROBES STAY GREEN -- so the two keys are INDEPENDENTLY defended, neither passing off the other. And appending `sendNotification` reddens THE BOUNDARY PIN ALONE while all 343 tests pass, which is what justifies pinning the set difference: without it a third key silently falsifies the boundary sentence with the suite green.",
      ],
    },
    {
      number: 22,
      pbi_id: "PBI-23",
      goal: "Close the one route left around the notification gate -- make obtaining an ungated connection fail early rather than silently.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "SPRINT 21'S RECORD DROPPED AT SPRINT 24, homes checked: the type narrowing and its residuals are src/notifications.ts's own code and comments, and the control-designed-not-to-lie is the diagnostic-bound assertion those probes still carry. SPRINT 20'S RECORD DROPPED EARLIER, homes checked: the exact-match rule and its extension-only guard are examples/completion-path.ts's own code and comments, the declined generalisation owns a test that still runs, and the still-mangles boundary is pinned. SPRINT 19'S RECORD DROPPED EARLIER, homes checked: one-copy-per-entry and its symmetry reasoning are at src/workspace.ts, the re-armed trailing-slash control and the ordering pin are tests that still run, and the two-tests-two-controls finding became the granularity entry. Shipped in cbd7dab, 39dc7c4, 1996c24, 7409422, 84309eb, ef69ca1 and 95156c1. 341 tests green from 332, each DoD command run separately with its exit read directly.",
        "A PREMISE INSIDE THE CRITERION WAS MEASURED FALSE, and the ROUTE IN is what the PO named: they did not invent `server.ts, methods.ts and the fixtures` -- they INHERITED it from a handback and PROMOTED IT INTO A CRITERION AS FACT. An unlabelled claim in a handback reads as REASONED under their own default, and putting it in a criterion converted it to ESTABLISHED without measurement. MEASURED: no fixture and no example imports that subpath at all -- all 24 of their protocol imports are the BARE specifier. The Scrum Master's independent re-run reddened FIVE where the executor's reddened three, because guard.test.ts carries two bare-specifier assertions a module-wide ban breaks -- the same finding from the other direction, which is what makes the correction trustworthy rather than one unmeasured list swapped for another.",
        "THE MOST VALUABLE FINDING WAS NOT ON THE PLAN: spelling the exemption `off` rather than REDECLARING reddens exactly one test -- the bun:sqlite assertion at src/notifications.ts -- because an override REPLACES options rather than merging them. A SILENT DISABLING OF A DIFFERENT GUARD, in the file whose whole purpose is guarding, found by measurement rather than by reading.",
        "TWO DEGENERACY CATCHES BEFORE ANYTHING FALSE WAS RECORDED, the Sprint 20 widening applied at authoring time TWICE in one sprint: an assertion reading its target path out of THE RULE'S OWN HELP TEXT, so a clean file and a flagged file produced the SAME observation; and a comment claiming half 3 was the only one a module-wide ban fails, which perturbation says is false of all three -- BACKED AND STILL WRONG. Corrected to what it actually buys: the only half that NAMES THE CAUSE, since the others fail on an absent WORDING indistinguishable from a message-format change.",
        "THE LAUNDERING HAZARD MEASURED RATHER THAN ARGUED: adding the re-export reddens the export test at its FIRST assertion, nothing else in 341, and oxlint STAYS 0. The exemption really is a hole the ban cannot see -- which is the precondition the criterion rested on.",
        "DECLINING TO ASSERT THE TEST-FILE EXEMPTIONS IS THE HARDER CALL AND THE PO NAMED IT AS SUCH: those branches would be bare exit-0 assertions carrying exactly the defect the widening names, and an assertion that cannot discriminate is WORSE than none because it reads as coverage.",
        "NOT CONSTRUCTED, correctly labelled and correctly homed: the PBI-22 SUFFICIENCY ARGUMENT. The probes redden if createGatedConnection's return annotation is widened, so THE FACT is defended; the claim that a mere detector SUFFICES is an argument, and arguments have no assertion. At risk: startServer re-binding a wide connection while the lint keeps passing AND KEEPS READING LIKE A GUARD. Also measured: `await import(...)` walks past, in a run where a static import of the same name in a sibling file was flagged.",
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
    number: 32,
    pbi_id: "PBI-37",
    goal: "THE READINESS GATE RAN FIRST AND IT COULD HAVE WITHDRAWN THIS PBI. It did not, and it did not vindicate the PO either: THE PRECEDENT TRANSFERS TO EXACTLY ONE OF THE TWO HALVES. Six deletions, one at a time, reverted between. The capability `if`s are DEFENDED, three of three, each by a test whose TITLE names per-method capability correctness. The rejection checks are DEFENDED ONE OF THREE -- hover's reddens four tests by name, and formatting's and completion's redden NOTHING AT ALL, which is the notifications.ts precedent arriving with the SAME ARITHMETIC (two of three copies pure convention). So the table is built where it was measured to be needed, and the capability half is carried on COLOCATION AND REQUIREDNESS rather than on a defencelessness that is not there.",
    status: "review",
    subtasks: [
      {
        test: "THE GATE ITSELF, AND IT IS A MEASUREMENT RATHER THAN AN ASSERTION: delete ONE method's capability `if` and ONE method's rejection check and record what reddens. Taken for ALL THREE of each, because the precedent it is being checked against measured all three notification copies and a one-of-three sample cannot see the split that is actually there.",
        implementation:
          "Six perturbations against HEAD b0e1b75 (399 pass / 26 files), each applied ALONE and reverted with `git checkout --` before the next. All three rejection checks deleted together would leave `requestRejection` unused and put a tsc/oxlint signal on top of the test signal, which is a different measurement.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "THE VERDICT RULE WAS FIXED IN WRITING BEFORE THE FIRST PERTURBATION RAN, because a rule chosen after seeing twelve reds is chosen under exactly the pressure the gate exists to remove. THREE BUCKETS, NOT TWO, taken from the precedent's own shape: UNDEFENDED (nothing reddens), INCIDENTAL (something reddens but no failing assertion NAMES the property -- didOpen's `four tests that never mention it`, and Sprint 31's twelve exact-equality diffs that `ARRIVE WITHOUT NAMING THEIR CAUSE`), DEFENDED (a failing assertion names the property). `EVERYTHING REDDENS` was read as EVERY deletion landing in DEFENDED.",
          "CAPABILITY HALF, THREE OF THREE DEFENDED, and this is the half the PO's argument does NOT survive. hover's `if` deleted: SIX fail, including `a config supplying no hover handler advertises exactly textDocumentSync` on both runtimes. completion's: TEN, including `a config supplying no completion handler advertises exactly what it can answer`. formatting's: TWELVE, including `a config supplying no formatting handler advertises exactly what it can answer` -- and TWELVE RE-MEASURES SPRINT 31'S HANDED NUMBER AND CONFIRMS IT. In each case the failing set CONTAINS a test whose title names the property, so none of the three is the incidental bucket the twelve alone would have suggested.",
          "REJECTION HALF, ONE OF THREE DEFENDED, and this is where the precedent transfers. hover's check deleted: FOUR fail, `hover before initialize is answered -32002, and initialize then still succeeds` and `hover after shutdown is answered -32600, and exit still returns 0`, both runtimes -- DEFENDED, by name. formatting's check deleted: 399 pass, 0 fail, `tsc --noEmit` 0, `oxlint` 0 errors. completion's check deleted: 399 pass, 0 fail, `tsc --noEmit` 0. TWO OF THREE ARE PURE CONVENTION.",
          "BOTH ZEROS ARE INTERPRETABLE BECAUSE THE FIXTURE INVENTORY WAS TAKEN BEFORE THE PERTURBATIONS, WHICH IS S20 APPLIED TO A NULL RESULT: `reddened nothing` has two causes -- the convention is convention, or NO FIXTURE CAN OBSERVE IT -- and they are not the same finding. MEASURED: test/fixtures/formatting-fixed.ts and formatting-offsets.ts supply formatting and are driven by test/formatting.test.ts, ELEVEN fixtures supply completion, and test/protocol.test.ts already sends a pre-initialize request through `session.requestError` for HOVER. The means to observe exist and nothing uses them. So both zeros are PURE CONVENTION and neither is an unobservability artefact.",
          "WHAT THE GATE COSTS THE PBI, RECORDED BECAUSE A GATE THAT ONLY EVER CONFIRMS ITS AUTHOR IS NOT A GATE: criterion 2's capability contributor may NO LONGER be argued from `the convention is undefended`. It is defended, three times, by name. What survives is the criterion's OWN stated ground -- COLOCATION AND REQUIREDNESS -- plus the one thing the perturbation cannot reach, stated as REASONED and not measured: every one of those six tests is about a method THAT EXISTS, and no test can redden for a FOURTH method whose capability contribution was never written. The gate measures the copies that are there; the story is about the copy nobody wrote yet.",
        ],
      },
      {
        test: "BORN GREEN AND DECLARED SO: the 399 tests already in the suite ARE the test for this subtask, because it changes no observable behaviour. What it must not do is change any answer tsudoi gives, and the whole suite passing unchanged is what says it did not.",
        implementation:
          "The request table in src/methods.ts as a MAPPED TYPE over `Method`; the drive kind DERIVED from `MethodMap`'s declared result; a required capability CONTRIBUTOR per entry; a router applying the rejection -> requestContext -> answerUnlessCancelled prologue and epilogue; src/server.ts's three `if`s replaced by `contributeCapabilities` and its superseded clause rewritten.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "0b0beb6",
            message:
              "refactor(methods): the request table, built where the gate measured it was needed",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE MAPPED TYPE IS WHAT MAKES THE USER STORY TRUE, and it is the part no amount of prose could have delivered: `{ [M in Method]: RequestEntry<M> }` means a method `MethodMap` declares and the table omits is a COMPILE ERROR NAMING THE MISSING KEY (measured TS2741). `A method that decides nothing does not compile` is now a fact about the compiler rather than an aspiration.",
          "THE DRIVE KIND IS DERIVED RATHER THAN DECLARED FREEHAND, which was not asked for and is strictly stronger: `DriveKind<M>` reads `MethodMap[M][\"result\"] extends AsyncGenerator<...>`, so writing `generator-driven` on hover's entry fails TS2322. The two kinds are still NAMED at each entry -- legibility was the point -- but they can no longer disagree with the handler's actual shape.",
          "THE SECOND AXIS SPRINT 31 NAMED TURNED OUT NOT TO BE AN AXIS. It recorded the no-handler case as having TWO SHAPES that any table `must also carry or silently flatten` -- optional-call versus early-return. They are NOT independent of the drive: each drive has exactly one of them, so choosing the drive chooses it. Nothing third was invented, and nothing was flattened.",
          "THE RECORDED DECISION OPPOSING A TABLE WAS HONOURED AT ITS OWN SITE RATHER THAN DELETED. `there is no shape both fit into that is not an invention` still stands at reportHandlerFailure, with a paragraph saying WHY IT SURVIVED: the calls are still two, at driveAwaitedOnce and driveGenerator, and a method picks one BY NAME.",
        ],
      },
      {
        test: "test/methods-table.test.ts: every entry's key equals its own `type.method`; every method in the table is refused -32002 before initialize; every method in the table is answered -32800 when cancelled. SIX tests, all BORN GREEN, and every one of them perturbed rather than trusted.",
        implementation:
          "Assertions that ITERATE `requestEntries` instead of naming methods, plus test/fixtures/all-methods.ts -- one config supplying every method in the table.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "890bbd6",
            message: "test(methods): the prologue asserted over the table, not once per method",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE GATE'S FINDING IS WHAT THESE ANSWER, AND THE REMEDY DELIBERATELY IS NOT TWO MORE HAND-WRITTEN ASSERTIONS: the gate measured formatting's and completion's rejection checks defended by nothing, and writing an assertion per method would have reproduced -- inside the test suite -- exactly the convention this PBI exists to retire. The tests iterate the table, so a fourth method is covered THE MOMENT IT IS DECLARED.",
          "P-A, THE ONE THAT PROVES THE DISCLOSURE IS REAL: `HoverRequest.type` written into completion's slot leaves `tsc --noEmit` AT 0. Their params differ only in OPTIONAL members so each is assignable to the other, and a generator entry cannot pin its result because the protocol declares one WIDER than a tsudoi generator returns (measured TS2322 when tried). The key-equals-type.method assertion reddens AND NAMES THE CAUSE; the two wire tests redden after it. So the compile-time claim is bounded honestly at the type, and a test carries the rest.",
          "P-B: the router's rejection throw deleted reddens SIX -- the four hover ones that already existed AND the two new by-construction ones, both runtimes. P-C: the epilogue's post-settle abort check deleted reddens TWENTY-FOUR including the new -32800 test on both runtimes.",
          "A CLAIM THE EXECUTOR WROTE INTO THE NEW FIXTURE WAS MEASURED FALSE IN THE SAME SESSION AND CORRECTED IN PLACE WITH THE CORRECTION RECORDED, which is the standard the PO imposed on themselves at Sprint 28. The doc block said a method added to the table and not added to the fixture makes these tests fail. P-D: delete the AWAITED-ONCE handler (formatting) and ALL SIX STAY GREEN. P-E: delete the GENERATOR-DRIVEN handler (completion) and the -32800 test REDDENS on both runtimes.",
          "AND THAT FALSE CLAIM PAID FOR ITSELF, because the cause is a REAL DIVERGENCE NOBODY HAD NAMED: the generator drive's no-handler EARLY RETURN sits AHEAD of the cancellation epilogue, so a cancelled request to a generator-driven method with no handler is answered NULL, while the awaited-once drive reaches the epilogue either way and answers -32800. PRE-EXISTING -- completion has always returned early -- and INVISIBLE UNTIL THE TWO DRIVES SAT SIDE BY SIDE. NOT CHANGED: LSP 3.17 permits answering a cancelled request normally, so neither answer violates anything, and making them agree is a behaviour change no criterion asked for. Recorded at the line that causes it. THE IRONY IS WORTH THE LINE: criterion 3 warned that a table might destroy a difference hand-writing had made visible, and the table MADE ONE VISIBLE that three hand-written copies had hidden.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE GATE PASSED WITHOUT VINDICATING THE PO, AND THE SPLIT IS THE RESULT RATHER THAN A DETAIL OF IT. The withdrawal condition -- EVERYTHING REDDENS -- is NOT met, so the PBI stands. But four of the six deletions redden a test that names the property, and the PO's precedent reaches only the rejection half. Reported as a split rather than narrowed to the surviving half, which would be a PO call and not an executor's.",
      "SHIPPED IN 59158fe..6595871. 405 green from 399, 27 files from 26 -- SIX ADDED, NONE REMOVED OR WEAKENED -- each DoD command run separately and unpiped with its exit read directly. scrum.ts committed ALONE twice; the hook was never bypassed.",
      "THE INCREMENT CHANGES NO OBSERVABLE BEHAVIOUR AT ALL, and that is worth stating rather than leaving to be inferred: every one of the 399 pre-existing tests passed unchanged at every step. What changed is WHERE a decision is written and WHETHER omitting it compiles.",
      "EXPECTED CONSEQUENCE 1 DISSOLVED, AND IT DISSOLVED FOR THE REASON PREDICTED. Sprint 31's residual -- a cancelled formatting request answered -32800 with nothing asserting it -- is closed WITHOUT ONE LINE MENTIONING FORMATTING: the assertion iterates the table, and formatting is in the table. THE ARGUMENT HAS TWO PREMISES AND BOTH ARE HELD RATHER THAN ASSUMED -- exhaustiveness is compile-checked (TS2741), and `the router applies the prologue to every entry` is held by P-B and P-C, which redden the new assertions when the prologue and the epilogue are removed. WITH ONE BOUND, MEASURED AND NOT GUESSED: it reaches a generator-driven method only if a handler exists for it, per P-D/P-E above.",
      "EXPECTED CONSEQUENCE 2 DID NOT DISSOLVE, AND THE TABLE MADE IT MORE STRUCTURAL RATHER THAN LESS. Sprint 31's capability negative control still cannot fire alone. MEASURED: with the loop's per-method guard removed, FOURTEEN tests redden and the control is among them, never first. AND THE PERTURBATION THAT WOULD HAVE ISOLATED IT IS NO LONGER CONSTRUCTIBLE AT ALL -- there is no per-method capability `if` left to delete, because ONE condition in the router now serves every method. So the note at its site CARRIES FORWARD WITH A MEASUREMENT BEHIND IT, which is exactly what the PBI asked for in the branch where it does not dissolve.",
      "diagnosticProvider's VALUE SHAPE IS NO LONGER UNMEASURED, and it is a FOURTH shape that breaks the enumeration exactly where the PO predicted it might. MEASURED at protocol 3.18.2: ServerCapabilities:1106 declares `diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions`, and DiagnosticOptions (protocol.diagnostic.d.ts:50-67) carries TWO REQUIRED BOOLEANS, interFileDependencies and workspaceDiagnostics. `true` would not type-check and NEITHER WOULD `{}`. The contributor-as-a-function criterion is now measured against the method that was expected to break it rather than argued from the three already written, and the PO's ruling to REMOVE the count rather than correct it is vindicated by measurement.",
      "CRITERION 3 DISCHARGED BY GREPPING THE CLAIM'S WORDS RATHER THAN BY READING THE DIFF, per S29. THREE PARAGRAPHS MOVED AND EACH IS NAMED WITH ITS DESTINATION: completion's EMPTY-OPTIONS-NOT-triggerCharacters paragraph went from src/server.ts to the completion entry's contributor; formatting's `true`-NOT-`{}`/DocumentFormattingOptions paragraph went from src/server.ts to the formatting entry's contributor; and completionProgress's `a single instance because ProgressType carries no state` went from a module-level constant to the generator entry's `progress` field. GREPPED: `triggerCharacters` and `DocumentFormattingOptions` now appear in src/methods.ts AND NOWHERE ELSE in the tree. Sprint 31's `THE THIRD COPY ... NOT DEDUPLICATED` block is gone from src/ -- correctly, since it argued for a restraint this sprint was authorised to end -- and survives only in Sprint 31's own completed record, which is history rather than a live claim.",
      "CRITERION 4 IS PROSE SURGERY AND WAS DONE AS SURGERY. The REASON -- a client is entitled to send whatever it was told about, so each capability is claimed only where the config can answer it -- IS VERBATIM AND UNCHANGED, and the block now says out loud that reading what follows as a reversal of it would be exactly wrong. What the rewrite records is that the MECHANISM was stated AS THOUGH IT FOLLOWED from that reason and DOES NOT: the policy constrains WHICH capabilities are claimed and says nothing about WHERE the per-method answer is written. GREPPED for the clause's own words across every .ts, .md and .json in the tree: it survives in exactly two places, the PBI criterion that commissioned the rewrite and the rewrite itself, which quotes it as superseded.",
      "THE STANDING S14 RE-RUN, AGAINST THE FILE THIS SPRINT REWROTE: Sprint 31's P1 -- formatting-offsets.ts's positionAt replaced by a hardcoded Position -- still reddens `a handler that knows only offsets emits the Positions the client receives` ALONE, both runtimes, out of 405. That discharges the item's SECOND rationale, detecting disarmed controls, against a sprint that rewrote the entire request path underneath it.",
      "THE ORDERING CONSTRAINT THE CONTRIBUTOR DESIGN INTRODUCES IS WRITTEN AT THE TYPE AND NOTHING CHECKS IT, disclosed rather than discovered at PBI-39: a contributor writing into a key ANOTHER method owns must run AFTER that method's, and the table is iterated in declaration order. Dormant today because no entry depends on another; real the moment completionItem/resolve arrives.",
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
