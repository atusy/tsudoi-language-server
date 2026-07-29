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
      id: "PBI-38",
      story: {
        role: "editor user",
        capability: "see diagnostics for my language when my editor asks for them",
        benefit: "problems in my file surface without the config author wiring a notification path",
      },
      acceptance_criteria: [
        {
          criterion:
            "FIRST SUBTASK, THE WAY THE READINESS GATE WAS: probe whether connection.onRequest STILL ACCEPTS the erased type. If it does not, THE APPROACH NEEDS RETHINKING RATHER THAN PATCHING, and the PO would rather know before subtasks run than after.",
          verification:
            "MEASURED at Sprint 33: DocumentDiagnosticRequest.type fits NONE of the three entry interfaces -- all pin RequestType's error position to `void`, all three shipped methods declare `void`, and diagnostic declares DiagnosticServerCancellationData. TS2322 at position 2 of the phantom tuple; `unknown` accepts it. RULED: widen to unknown, CONDITIONAL ON THIS PROBE. Booked as THE TABLE'S SECOND STRUCTURAL DEBIT beside P-A, so the ledger keeps carrying costs and not only gains.",
        },
        {
          criterion:
            "PULL ONLY, AWAITED-ONCE. Push is out of scope; the drive is NOT generator-driven.",
          verification:
            "MEASURED at Sprint 33, falsifying a premise the PO had labelled MEASURED: `DocumentDiagnosticRequest.partialResult` is ProgressType<DocumentDiagnosticReportProgress>, and that is a union of TWO OBJECT TYPES, so `Chunk extends readonly unknown[]` resolves FALSE and the concatenating drive cannot carry it. What WAS measured is that partialResult EXISTS; generator-shaped was INFERRED from it -- THE PROJECT'S SECOND FALSE `MEASURED` LABEL, AND THE PO'S OWN. The semantic half is stronger: the partial channel carries RELATED DOCUMENTS, not more diagnostics for the requested one.",
        },
        {
          criterion:
            "FOUR SIMPLIFICATIONS, ALL NOW MEASURED -- and TWO OF THEM TURNED OUT FORCED BY THE PROTOCOL RATHER THAN CHOSEN.",
          verification:
            '(1) FULL REPORTS ONLY: UnchangedDocumentDiagnosticReport.resultId is REQUIRED and its own comment says a server can only return `unchanged` if result ids are provided -- so no-resultId makes unchanged UNREACHABLE BY CONSTRUCTION, not by tsudoi declining it, and the two halves are ONE decision. Ignoring previousResultId is conforming. (2) workspace/diagnostic EXCLUDED: its capability is CM<"workspace.diagnostics", "diagnosticProvider.workspaceDiagnostics">, so `workspaceDiagnostics: false` IS the switch, costing exactly one un-added entry. (3) relatedDocuments OUT OF SCOPE -- and that is WHY the partial channel would carry nothing, so (3) and the awaited-once drive are ONE decision too. (4) NO method-specific error type; MethodMap gains nothing, DiagnosticServerCancellationData foreclosed with its reason.',
        },
        {
          criterion:
            "interFileDependencies: true, CHOSEN BY TSUDOI -- not a config surface, not a config-supplied contribution.",
          verification:
            "CHOSEN ON HARM ASYMMETRY, A PROPERTY OF THE TWO ERRORS RATHER THAN OF THE AUDIENCE, and explicitly NOT because it is typical: `true` on a language with no inter-file dependencies costs REDUNDANT PULLS -- visible, a performance cost, borne by the client. `false` on a language that has them leaves A STALE DIAGNOSTIC IN ANOTHER FILE THAT NEVER CLEARS -- SILENT, AND WRONG. Same preference that refuses to synthesise a workspace root from cwd. NOT A PUBLISHED SURFACE: the rule for a ninth needs EVIDENCE not prediction, and the reversibility runs one way -- tsudoi picks now and adding a surface later is ADDITIVE, a surface now and removing it is BREAKING. NOT a config-supplied contribution: that generalises a mechanism for ONE case and would turn methods entries from functions into objects, breaking every existing config. COST NAMED RATHER THAN HIDDEN: tsudoi's likely audience is linter-shaped, so most configs will pay redundant pulls they do not need. REVERSAL, evidence-shaped: a config author who reports redundant pulls, or asks for false.",
        },
        {
          criterion: "diagnosticProvider is advertised ONLY when the config supplies a handler.",
          verification:
            "the per-method rule, with its negative control. diagnosticProvider is A FOURTH VALUE SHAPE -- DiagnosticOptions carries two REQUIRED booleans, so neither `true` nor `{}` type-checks, and NEITHER WOULD COPYING COMPLETION'S.",
        },
        {
          criterion:
            "The weakness is stated rather than discovered: a client that does not support pull gets NOTHING.",
          verification:
            "LSP 3.17+. For the first increment tsudoi does NOTHING when such a client connects -- it advertises correctly, the client's capability is legitimate, and a line per session is the noise that makes the one stderr channel useless. `nvim and VS Code both support it` is REASONED -- A DECISION NOT TO MEASURE, NOT AN INABILITY.",
        },
      ],
      status: "ready",
      notes: [
        "THE ESCAPE THE EXECUTOR FOUND AND REFUSED, recorded because they had every incentive not to: `capability: () => {}` compiles and would have unblocked everything BY SILENTLY WITHDRAWING AN ACCEPTED CRITERION (criterion 4's `it advertises correctly`). They also declined to read the protocol's own `uncommon for linters` comment as permission to pick false -- THAT IS DECIDING ALONE WITH EXTRA STEPS, and the comment describes LANGUAGES, the one thing only a config author knows.",
        "THE BLOCKER WAS STRUCTURAL, NOT PROCEDURAL: requestEntries is a mapped type over Method, so adding the method forces an entry (TS2741) -> a capability contributor -> diagnosticProvider -> BOTH required booleans. THERE IS NO COMPILING PARTIAL INCREMENT.",
        "THE GENERATOR-DRIVE NOTE IS DELETED, NOT FLAGGED. It told the next executor to expect a red that CANNOT COME, which is worse than an absent note.",
        "TWICE THIS SPRINT A SIMPLIFICATION THE PO WROTE AS A CHOICE TURNED OUT TO BE FORCED BY THE PROTOCOL'S OWN CONSTRUCTION -- resultId/unchanged, and relatedDocuments/awaited-once. The PO records that pairing as the sprint's cleanest finding.",
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
    number: 33,
    pbi_id: "PBI-38",
    goal: "MEASURE THE FOUR SIMPLIFICATIONS BEFORE THEY BECOME CRITERIA, and only then serve textDocument/diagnostic as ONE ENTRY in Sprint 32's request table rather than a fourth hand-written registration. THE MEASUREMENT RAN FIRST AND IT STOPPED THE SPRINT ONCE ALREADY, which is what ordering it first was for: two simplifications survived, a FOURTH reading falsified the DRIVE the sprint was planned around, and the capability contributor could not be written at all until the Product Owner ruled interFileDependencies. RESUMED ON THAT RULING -- `true`, chosen by tsudoi on HARM ASYMMETRY -- with the widened error position gated behind a probe that runs FIRST and can send the approach back rather than be patched.",
    status: "in_progress",
    subtasks: [
      {
        test: "THE GATING PROBE, RUN FIRST THE WAY THE READINESS GATE WAS, and it could have sent the approach back: does `connection.onRequest` still accept the erased type once the error position is `unknown`? MEASURED -- `tsc --noEmit` exit 0, zero diagnostics. AND ITS NEGATIVE CONTROL WAS RUN rather than named, because a green tsc proves nothing unless the call site is checked at all: substituting `ProgressType<unknown>` for `ErasedEntry.type` fails TS2769 `No overload matches this call` AT src/methods.ts:548, which is the `connection.onRequest(` line itself. So the registration call IS type-checked against the erased type and the green is real.",
        implementation:
          "THE PROPERTY: an entry may name a request type whose ERROR payload is the protocol's own, without tsudoi naming that payload anywhere. The three entry interfaces pinned RequestType's error position to `void`, and diagnostic is the FIRST of the five whose protocol type does not. MethodMap gains nothing, so the no-method-specific-error criterion holds; what widens is TSUDOI'S OWN TABLE, and the widening removes a constraint NO ENTRY HAS EVER EXERCISED.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "BOOKED AS THE TABLE'S SECOND STRUCTURAL DEBIT, beside P-A, at the PO's instruction that the ledger keep carrying costs and not only gains: after this, an entry may name a request type whose error payload disagrees with every other entry's and nothing objects. Nothing exercises that today and nothing checks it.",
        ],
      },
      {
        test: "EXPECTED RED, and it is a compile error rather than an assertion: adding the method to MethodMap without a table entry fails TS2741 naming the missing key, which is the mapped type doing what PBI-37 built it to do.",
        implementation:
          "THE PROPERTY: a config author's diagnostic handler is reached, and its answer is the protocol's own report shape. Awaited-once -- MEASURED, not inherited -- with the result pinned to `DocumentDiagnosticReport` exactly, so an author MUST return a report and cannot return the `null` the protocol does not declare.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "UNBLOCKED BY THE RULING. The contributor writes `{ interFileDependencies: true, workspaceDiagnostics: false }`, and BOTH VALUES CARRY THEIR REASON AT THE SITE: false is FORCED by the workspace/diagnostic exclusion, true is CHOSEN on harm asymmetry with the cost named.",
        ],
      },
      {
        test: "EXPECTED RED over the wire, both runtimes: a client that asks textDocument/diagnostic of a config supplying the handler receives the handler's full report, and a config supplying none is not advertised diagnosticProvider at all.",
        implementation:
          "THE PROPERTY: advertisement and answering agree per method, which is the rule the table exists to make unforgettable. The affordability claim gets its second wire measurement -- MEASURED at vscode-languageserver-types 3.18.0, main.d.ts:509, `Diagnostic` declares `range: Range` REQUIRED at :513 and `severity?: DiagnosticSeverity` optional at :519, so a handler emits Positions from whatever OFFSETS its analysis produced, via document.positionAt, which did not exist before Sprint 28.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "test/fixtures/all-methods.ts gains a diagnostic handler. THE OBLIGATION PBI-38 RECORDED DOES NOT APPLY: that note warned a GENERATOR-DRIVEN method added without a handler there reddens the -32800 assertion, and the drive is measured awaited-once -- so the fixture's own doc block says all six stay green. A NOTE THAT WOULD HAVE SENT THE NEXT EXECUTOR HUNTING A RED THAT NEVER COMES.",
        ],
      },
      {
        test: "EXPECTED RED: the published surface names DiagnosticSeverity as a RUNTIME VALUE, defended the way CompletionItemKind's is -- delete the value re-export and the runtime-value assertion reddens alone.",
        implementation:
          "THE PROPERTY, and it is Sprint 31's standard rather than a fresh judgement: VALUES must be re-exported because a handler reads them at run time; TYPES only when an author must NAME one. MEASURED at vscode-languageserver-types 3.18.0 -- `DiagnosticSeverity` is a namespace of const members plus a type alias, the SAME construct as `CompletionItemKind`, so it is a value. `Diagnostic` itself is structurally constructible from a literal and stays off the surface until an example must name it.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [
      {
        description:
          "`interFileDependencies` has NO CONFIG-AUTHOR SURFACE, and tsudoi must supply a value for a REQUIRED field the config cannot express an opinion about. None of PBI-38's four criteria says what value or on whose authority. The PBI's own note says so in its own words -- `a refinement question this PBI now owns rather than meets at implementation time` -- so this is refinement returning unfinished rather than execution meeting a surprise.",
        impact:
          'IT BLOCKS THE WHOLE INCREMENT, AND STRUCTURALLY RATHER THAN PROCEDURALLY. `requestEntries` is a mapped type over `Method`, so adding the method to MethodMap FORCES a table entry (TS2741, measured at Sprint 32 and recorded at the table), which forces a `capability` contributor, which forces `diagnosticProvider`, which forces BOTH booleans. THERE IS NO COMPILING PARTIAL INCREMENT. `workspaceDiagnostics` IS answered -- criterion 3\'s exclusion of workspace/diagnostic forces `false`, and the protocol confirms the switch is exactly this one: `WorkspaceDiagnosticRequest.capabilities` is `CM<"workspace.diagnostics", "diagnosticProvider.workspaceDiagnostics">`. Only `interFileDependencies` is unowned.',
        request:
          "Rule the value AND the authority. Three shapes are visible and the choice is the PO's: (a) tsudoi fixes it, with the reason at the contributor; (b) TsudoiConfig grows a surface so the config author answers it, which is a published-surface change; (c) the field is derived from something a config already states. WHAT MUST NOT HAPPEN IS (d): reading the protocol's own comment -- `common for most programming languages and typically uncommon for linters` -- as permission to pick `false`. That is deciding alone with extra steps, and the comment describes LANGUAGES, which is precisely the thing only a config author knows.",
        status: "resolved",
        notes: [
          "RESOLVED AT 0f6e3ed: `interFileDependencies: true`, CHOSEN BY TSUDOI on harm asymmetry -- a property of the two ERRORS rather than of the audience. `true` on a language without inter-file dependencies costs redundant pulls, which are VISIBLE and borne by the client; `false` on a language that has them leaves a stale diagnostic in another file that NEVER CLEARS, which is SILENT AND WRONG. Not a published surface, on one-way reversibility: tsudoi picking now makes a later surface ADDITIVE, where a surface now would make removal BREAKING. The cost is named rather than hidden -- tsudoi's likely audience is linter-shaped, so most configs will pay pulls they do not need.",
          "CONSIDERED AND REFUSED, named so Review sees it was seen: `capability: () => {}` COMPILES and would have unblocked every other subtask. It silently withdraws criterion 4's `it advertises correctly` -- a served method advertised to nobody -- and criterion 4 is an ACCEPTED criterion, so weakening it is a scope decision and not a workaround.",
          "NO WORKAROUND WAS ATTEMPTED IN THE TREE. The measurement subtasks that do not touch the entry were completed instead, which is why criterion 3 is met while the increment is not.",
        ],
      },
    ],
    decisions: [
      "CRITERION 3 IS MET AND IT IS THE ONLY CRITERION THIS SPRINT COULD MEET. All three simplifications measured at vscode-languageserver-protocol 3.18.2 / vscode-languageserver-types 3.18.0, by this sprint's executor, against node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.d.ts read WHOLE in this session.",
      "SIMPLIFICATION 1 SURVIVES -- full reports only, no resultId / unchanged-report caching. `FullDocumentDiagnosticReport` declares `resultId?: string` OPTIONAL, so omitting it type-checks; `UnchangedDocumentDiagnosticReport` declares `resultId: string` REQUIRED and its own comment says a server `can only return unchanged if result ids are provided`. So the two halves are ONE decision rather than two: no resultId means unchanged is unreachable BY THE PROTOCOL'S OWN CONSTRUCTION, not by tsudoi declining it. `previousResultId` arrives in the params and is simply ignored, which is conforming.",
      'SIMPLIFICATION 2 SURVIVES -- workspace/diagnostic is a SEPARATE REQUEST, not a variant. `WorkspaceDiagnosticRequest` is its own `ProtocolRequestType` with its own method string, its own params carrying `previousResultIds`, and its own result. Excluding it costs exactly one thing: not adding a second table entry. AND THE EXCLUSION HAS A DECLARED SWITCH, which is the part that was reasoned and is now measured: its `capabilities` is `CM<"workspace.diagnostics", "diagnosticProvider.workspaceDiagnostics">`, so `workspaceDiagnostics: false` IS the exclusion rather than merely accompanying it.',
      "SIMPLIFICATION 3 RE-VERIFIED RATHER THAN TRUSTED, per the standing re-measure rule, and Sprint 32's handed numbers HOLD: ServerCapabilities line 1106 is `diagnosticProvider?: DiagnosticOptions | DiagnosticRegistrationOptions`; DiagnosticOptions opens at protocol.diagnostic.d.ts:50 with `interFileDependencies: boolean` at :62 and `workspaceDiagnostics: boolean` at :66. NEITHER `true` NOR `{}` TYPE-CHECKS. THE HANDED NUMBERS HOLD, and the first draft of this line ranked that as a first -- FALSE, and caught against scrum.ts's own Sprint 32 record read in the same session, which says formatting's twelve re-measured and confirmed Sprint 31's handed number. A ranking is a count, in a project whose standing item is prefer-naming-to-counting; the load-bearing content is that they hold.",
      "A FOURTH READING NOBODY ASKED FOR FALSIFIED THE DRIVE THIS SPRINT WAS PLANNED AROUND, AND THE PBI PREDICTED EXACTLY WHERE. The handed premise was `it declares partialResult, so it is generator-driven like completion -- the second use of that drive`. HALF OF IT IS TRUE: `DocumentDiagnosticParams` does declare `PartialResultParams`, so the drive's FIRST requirement holds. THE SECOND FAILS. MEASURED with a type-level probe: `DocumentDiagnosticRequest.partialResult` is `ProgressType<DocumentDiagnosticReportProgress>`, and `DocumentDiagnosticReportProgress` is `DocumentDiagnosticReport | DocumentDiagnosticReportPartialResult` -- A UNION OF TWO OBJECT TYPES, NOT AN ARRAY -- so `Chunk extends readonly unknown[]` resolves `false`. The generator drive concatenates chunks and therefore CANNOT DRIVE THIS METHOD. The PBI's own note flagged `DocumentDiagnosticReportProgress HAS NOT BEEN READ against that second requirement`; reading it is what produced this.",
      "AND THE SEMANTIC HALF IS STRONGER THAN THE TYPE HALF: the protocol's own comment at `DocumentDiagnosticReportProgress` says the stream carries the FIRST report followed by n partial literals FOR RELATED DOCUMENTS -- not more diagnostics for the requested document, as completion's chunks are more items of one list. With `relatedDocuments` out of scope (nobody has asked for it and no criterion names it), THE PARTIAL CHANNEL WOULD CARRY NOTHING AT ALL. So awaited-once is not a fallback; it is the only shape that describes this method.",
      "THE DRIVE REQUIREMENT PAID OUT BY EXCLUDING THE METHOD IT WAS WRITTEN FOR. It was written at Sprint 32 as `invisible until PBI-38 arrives`, expecting to be MET. It was not met, and it caught that before an entry existed to be wrong. A requirement whose first exercise is a refusal is the strongest evidence it was worth writing down.",
      "PROBE C'S NEGATIVE CONTROL WAS RUN, not merely named: `const c: IsArray = true` fails TS2322 `Type 'true' is not assignable to type 'false'`, so the probe discriminates rather than compiling whatever it is handed.",
      "A SECOND MEASUREMENT THE CRITERIA DID NOT PREDICT, AND IT IS THE TABLE'S FIRST STRUCTURAL DEBIT SINCE IT LANDED: `DocumentDiagnosticRequest.type` DOES NOT FIT ANY OF THE THREE ENTRY INTERFACES AS THEY STAND. All three pin RequestType's ERROR position to `void`, all three shipped methods declare `void` there, and diagnostic declares `DiagnosticServerCancellationData`. MEASURED: TS2322, `Type 'DiagnosticServerCancellationData' is not assignable to type 'void'` at position 2 of the phantom tuple. `unknown` in that position accepts it, MEASURED at 0 errors. CRITERION 2 STILL HOLDS -- MethodMap gains nothing and `unknown` names no method's payload -- but the criterion's `reversible at one token` described MethodMap and NOT the table, and the table is where the token has to move.",
      "THE NO-HANDLER ANSWER IS A CONSEQUENCE OF SHIPPED POLICY, NOT A NEW SCOPE QUESTION, and it is recorded because diagnostic is the FIRST of the five where it is visible: the protocol declares this result NON-NULLABLE, unlike hover's `Hover | null` and formatting's `TextEdit[] | null` (MEASURED: `null` is not assignable to `DocumentDiagnosticReport`, TS2322). tsudoi registers every method whether or not a config answers it, so an unadvertised diagnostic request is answered `null`. Resolution: pin MethodMap's result to `DocumentDiagnosticReport` EXACTLY, so a config author must return a report; the only `null` on the wire is the no-handler case, which a conforming client never reaches because tsudoi never advertised the capability.",
      "THE BY-CONSTRUCTION CANCELLATION EXPECTATION IS ANSWERED ANALYTICALLY AND NOT EMPIRICALLY, SAID PLAINLY RATHER THAN CLAIMED: the entry does not exist, so nothing was run. Sprint 32's expectation was that the router's prologue covers a new method's cancellation by construction, and test/methods-table.test.ts iterates `Object.keys(requestEntries)` -- so it would. THE DIVERGENCE PBI-40 OWNS DOES NOT REACH THIS METHOD ONCE THE DRIVE IS MEASURED AWAITED-ONCE: the -32800 answer comes from the epilogue the awaited-once drive always reaches, with or without a handler.",
      "ONE PROSE CORRECTION SHIPPED, AND THE DISCRIMINATOR FOR SHIPPING IT ACROSS A STOP IS THAT IT DOES NOT DEPEND ON THE PO'S ANSWER: `DriveKind`'s doc block carried `MEASURED that two kinds cover all five ... textDocument/diagnostic declares partialResult, so it is generator-shaped like completion`. The headline stays TRUE -- two kinds still cover all five -- and the INFERENCE is false: declaring partialResult is necessary and not sufficient. A MEASURED-labelled false claim left in the tree across an escalation is exactly the Sprint-22 standing item, so it was corrected where it stood. `driveGenerator`'s forward-looking sentence was NOT rewritten to a prediction; it records the measurement instead. AND THE CORRECTION ITSELF NEEDED CORRECTING, recorded because a false claim fixed with no trace is indistinguishable from one that was always right: the first edit wrote `and so is completionItem/resolve` INSIDE the new MEASURED label, on a shape handed over from PBI-39's criterion text and unread. Attaching an unfounded MEASURED label while removing one is the self-refuting shape Sprint 32 caught in its own report. Closed by reading it -- CompletionResolveRequest at protocol.d.ts:2301 declares NO partialResult member and pins `never` in the progress position -- so `two kinds cover all five` is now as strong as its headline claims.",
      "GREPPED FOR THE CLAIM'S WORDS RATHER THAN FOR THE PLACES COMMENTS LIVE, per the Sprint-29 item, across src/, test/, examples/, README.md and scrum.ts: the falsified inference has TWO homes in code -- `DriveKind` and `driveGenerator` in src/methods.ts -- and NO test name, NO fixture doc block and NO example carries it. test/fixtures/all-methods.ts speaks of DRIVES generically and never of diagnostic, so it goes stale in NO respect.",
      "PBI-38'S OWN TEXT NOW CONTAINS TWO STATEMENTS THIS SPRINT ANSWERED -- criterion 3's `DocumentDiagnosticReport's declaration has NOT been read` and the note's `DocumentDiagnosticReportProgress HAS NOT BEEN READ`. FLAGGED, NOT EDITED, on the Sprint-26 precedent: rewriting a PO-authored criterion mid-execution is not the executor's, and the PBI is going back for refinement anyway. Whoever refines it owns both sentences and the generator-drive note the measurement retired.",
      "THE GATING PROBE PASSED AND IS REPORTED WITH ITS CONTROL, because the criterion made it the thing that could send the approach back: with the error position widened to `unknown` on all three entry interfaces, `tsc --noEmit` is exit 0 with ZERO diagnostics -- `connection.onRequest` still accepts the erased type, resolving the `onRequest<P, R, E>(type: RequestType<P, R, E>, ...)` overload at connection.d.ts:314 with all three parameters `unknown`. THE CONTROL IS WHAT MAKES THAT GREEN MEAN ANYTHING: substituting `ProgressType<unknown>` for `ErasedEntry.type` fails TS2769 AT src/methods.ts:548, the `connection.onRequest(` line itself. So the call site is genuinely checked and the approach did NOT need rethinking.",
      "PERTURBATIONS BELOW ARE THE PRE-RESUMPTION SET AND ARE SUPERSEDED BY THE EXECUTED ONES; the classification is kept because it is the honest record of the sprint's first half.",
      "PERTURBATIONS: NOT CONSTRUCTED, classified under the Sprint-11 rule so a design outcome is not reported in the language of a coverage gap AND the inverse is not read either -- five type-level probes are not five perturbations. THE CAUSE IS THAT NO INCREMENT EXISTS TO PERTURB: probes A, B, D and E measure declarations and mutate nothing, so none of them could redden anything. THE ONE EXCEPTION IS PROBE C'S NEGATIVE CONTROL, which does have perturbation shape and fired. WHAT REMAINS AT RISK, stated rather than left to be inferred: every property in subtasks 1 through 4 is UNPROVEN, including the widened error slot's effect on `connection.onRequest`.",
      "THE SPRINT-14 STANDING RE-RUN IS DISCHARGED THE CHEAP WAY AND THE REASON IS RECORDED, since leaving it unaddressed is what was flagged at Sprint 29: the only src/ edit this sprint is COMMENT-ONLY, so no control could have been disarmed by it. `bun test` at final head is 405 pass across 27 files, identical to 2bfa2bf.",
      "BASELINE RE-MEASURED RATHER THAN COPIED, per the standing re-measure rule, and the handed numbers HOLD at 2bfa2bf: `bun test` exit 0, 405 pass / 0 fail / 27 files; `oxlint` exit 0 with the two pre-existing require-yield warnings in test/fixtures/ and no errors; `oxfmt --check .` exit 0 over 89 files; `tsc --noEmit` exit 0. Each run separately and UNPIPED with its exit read directly -- the first `bun test` was piped into `tail`, caught in the same turn and re-run before anything was recorded, which is the FIFTH occurrence of that class and is said out loud because the Sprint-15 entry rules this remedy DETECTION, NOT PREVENTION.",
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
