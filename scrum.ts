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
      id: "PBI-26",
      story: {
        role: "config author",
        capability:
          "get the protocol names my config uses from @atusy/tsudoi/types rather than from tsudoi's own dependency",
        benefit:
          "standing up a server needs one package, and my config never names a package I did not install",
      },
      acceptance_criteria: [
        {
          criterion:
            "Under the non-hoisting layout the four example files type-check AND the example server answers a completion.",
          verification:
            "published-artifacts.test.ts's useNonHoistingLayout probe, inverted -- it is MEASURED today to FAIL naming vscode-languageserver-protocol, so the criterion has a live opposite. NEGATIVE CONTROL, load-bearing: in the same run a probe importing vscode-languageserver-protocol by bare specifier must STILL fail. Without the pair, code===0 is equally produced by a harness that stopped applying the layout -- the S20 degeneracy, a real risk because the layout is built by renameSync.",
        },
        {
          criterion:
            "Exactly eight names are re-exported from src/types.ts -- CompletionItem, CompletionItemKind (as a VALUE), CompletionParams, MarkupContent, Position, WorkspaceFolder, Hover, HoverParams -- and no more.",
          verification:
            "src/types.ts states every exported name is public API, so the set is the minimum the examples need rather than a convenience dump. A ninth name is a deliberate act with a reason, not a default.",
        },
        {
          criterion: "The README's install command names no protocol package.",
          verification:
            "the existing extraction harness executes it, then type-checks the examples in that project. ASYMMETRY STATED RATHER THAN HIDDEN: the harness catches UNDER-installation and cannot catch OVER-installation.",
        },
      ],
      status: "ready",
      notes: [
        "RULED BY THE PO, not left to the executor: published-artifacts.test.ts's hoisting precondition defends an accepted criterion, so it is REPLACED, not deleted. Its premise -- the example imports a bare specifier the consumer never declares -- is withdrawn DELIBERATELY here. What survives is the harness's ability to detect a genuinely missing package. Ordering vs PBI-27 is LOW-STAKES: measured, nothing consumer-visible breaks if 27 lands first, so Planning may reorder.",
      ],
    },
    {
      id: "PBI-27",
      story: {
        role: "tsudoi maintainer",
        capability:
          "declare vscode-languageserver as the single dependency and take every protocol name from it, while keeping createProtocolConnection as the factory",
        benefit:
          "one package pins the protocol version so the two cannot drift, and what tsudoi deliberately does NOT take from the framework is written down instead of merely absent",
      },
      acceptance_criteria: [
        {
          criterion:
            "No file but src/notifications.ts can import a connection factory, AT EVERY SPECIFIER THAT EXPORTS ONE. The specifier list is DERIVED BY MEASUREMENT in the sprint, not written from memory -- createProtocolConnection will be reachable from vscode-languageserver, vscode-languageserver/node AND the still-hoisted vscode-languageserver-protocol/node.",
          verification:
            "a guard.test.ts probe per exporting specifier, each in a run where a sibling's import of a DIFFERENT export from the SAME specifier is unflagged. The diagnostic must NAME THE IMPORT, not the module -- the existing factoryBanAt regex already discriminates that. createConnection and TextDocuments get the same treatment: they become importable for the first time, a hazard THIS PBI CREATES and must pay for.",
        },
        {
          criterion:
            "package.json declares no vscode-languageserver-protocol, and nothing imports it: not src/, not **/*.test.ts, not test/helpers/, not test/fixtures/, not examples/, not the deno import map in resolution.test.ts.",
          verification:
            "the specifier becomes a banned MODULE in the deno-compat guard, with a probe per path shape, each in a run where a framework import at the same shape is unflagged. `tsc --noEmit` IS NOT VERIFICATION -- a stale import that still resolves compiles fine; the lint is what discriminates.",
        },
        {
          criterion:
            "Startup cost is MEASURED on both runtimes, not assumed. src/ imports CompletionItemKind, ResponseError, ProgressType, StreamMessageReader, StreamMessageWriter and createProtocolConnection as VALUES; re-pointing them loads the framework's server module into a process that uses none of it.",
          verification:
            "if the delta is material, THIS PBI RETURNS TO REFINEMENT rather than being resolved in-sprint. Importing from the transitive vscode-languageserver-protocol/node while declaring only the framework is NOT an acceptable escape -- that is an undeclared-dependency import, which is exactly what published-artifacts.test.ts exists to catch.",
        },
        {
          criterion:
            "The eight names PBI-26 re-exports are unchanged in spelling and in type; only their source specifier moves.",
          verification:
            "the installed-consumer type-check; a renamed or dropped name reddens it. THIS IS WHAT MAKES EITHER ORDERING SAFE.",
        },
        {
          criterion:
            "The deno import map names the framework package; deno start still succeeds from a checkout and from an installed package.",
          verification:
            "the existing `deno says where it looked` assertion is retargeted -- it is the presence pair for the map actually being consulted. MEASURE rather than predict which specifier deno names: a DECLARED missing dep says `but found it in a package.json` (contains node_modules), a PHANTOM one says `not a dependency` (does not), and resolution.test.ts:78 asserts the former.",
        },
      ],
      status: "draft",
      notes: [
        "WITHDRAWN BY THE PO AT SPRINT 25, relayed mid-execution: the stakeholder declined `vscode-languageserver` entirely. tsudoi KEEPS vscode-languageserver-protocol, which pins vscode-jsonrpc 9.0.1 and vscode-languageserver-types 3.18.0 exactly, and will later add vscode-languageserver-textdocument. Kept here rather than deleted because its criteria and notes are the HOME of rulings nothing else carries -- the Omit-fails-open instrument ruling among them -- and dropping a record with no home is the one thing the lifetime rule forbids. RE-HOMING THEM IS A REFINEMENT JOB THIS SPRINT DID NOT DO.",
        "ONE OF ITS CARRIED ITEMS WAS RE-HOMED HERE AND NOW, on the PO's ruling: the bare-versus-/node specifier measurement is a comment at the re-export line in src/types.ts, since that is where the undoing edit would be made. Shipping a specifier choice whose reason lived only in a withdrawn PBI would have repeated the founding defect this work came out of.",
        "THE FRAMEWORK'S SERVER LAYER IS NOT TAKEN. THE FRAMEWORK'S PACKAGE IS. tsudoi MUST override InitializeRequest and ShutdownRequest -- the -32600 rejection lives in the latter -- and the framework's benefits sit downstream of them. Measurements, mechanism, and the two objections later refuted: GitHub issue #1.",
        "THE ~40 TYPED REGISTRATIONS WERE NEVER A BENEFIT. tsudoi's surface is MethodMap -- two methods, config-driven, already typed. The 40 include the 11 that BYPASS THE GATE and onCompletion, whose attachPartialResult deletes partialResultToken and destroys src/methods.ts's validation. Negative value, not foregone value.",
        "INSTRUMENT RULING, moot here and binding at PBI-28: a boundary on Connection must be a Pick, never an Omit -- Omit FAILS OPEN. MEASURED: Connection has 58 members and lacks onUnhandledNotification and trace, so the four-name Omit would silently reduce the boundary to nothing while two of its four defending probes went green measuring nothing. ALSO PAID HERE: src/notifications.ts names protocol 3.18.2 BECAUSE package.json asks ^3.17.5; after this PBI it asks for neither, and nothing reddens. Alongside README.md:33.",
      ],
    },
    {
      id: "PBI-31",
      story: {
        role: "config author",
        capability: "call positionAt, offsetAt and getText(range) on the documents tsudoi hands me",
        benefit:
          "the offset arithmetic my handlers need comes from a package other people maintain, instead of being rewritten in every config",
      },
      acceptance_criteria: [
        {
          criterion:
            "getText(range?), positionAt, offsetAt and lineCount are reachable from a config, and uri/languageId/version/getText() behave as today.",
          verification:
            "a fixture config that CALLS the new members and is DRIVEN by the suite (S5 standing item), with the existing documents.test.ts and sync.test.ts assertions unchanged and still green.",
        },
        {
          criterion:
            "Exactly ONE TextDocument is reachable from @atusy/tsudoi/types, and it is the upstream one.",
          verification:
            "THE TRAP, and the one thing the superset measurement CANNOT COVER: a strict-superset or assignability result cannot discriminate ADOPTED from SHADOWED -- tsudoi's own interface kept ALONGSIDE a re-export is structurally satisfied by the same value and compiles identically. The criterion is on IDENTITY, not assignability. S20: if two outcomes produce the same observation, the measurement records nothing.",
        },
        {
          criterion:
            "The breaking change to @atusy/tsudoi/types is stated, and README's document prose is updated.",
          verification: "the installed-consumer type-check plus the README extraction harness.",
        },
      ],
      status: "ready",
      notes: [
        "THE MAINTENANCE HEADLINE, and the PO concedes they MISFILED IT as `a capability PBI with its own value story` -- a misfiling that happened because they were sorting by capability without knowing it. This is the one place upstream can take over code tsudoi actually wrote.",
        "WHY THE WIN IS LARGER THAN THE ~15 LINES IT RETIRES: getText() with NO ARGUMENTS pushes offset arithmetic downstream into configs tsudoi cannot see. That is wheel reinvention happening RIGHT NOW, uncontrolled, in code this project will never be able to fix. On the stakeholder's own reasoning -- others fix the bugs -- this is the strongest item on the table.",
        "NEEDS vscode-languageserver-textdocument AND NO FRAMEWORK CONNECTION AT ALL, which is why it is not part of PBI-28: coupling the largest maintenance win to the riskiest change would make it hostage to a question it has nothing to do with. The second declared dependency does not contradict PBI-27 -- it is upstream's own package split, and vscode-languageserver does not re-export it, so single-source-of-truth for the PROTOCOL is untouched.",
      ],
    },
    {
      id: "PBI-32",
      story: {
        role: "editor user",
        capability: "have my editor send only the part of the buffer that changed",
        benefit: "typing in a large file does not put the whole buffer on stdio at every keystroke",
      },
      acceptance_criteria: [
        {
          criterion:
            "The same edit sequence sent as RANGED changes and as FULL replacements produces byte-identical getText().",
          verification:
            "NEGATIVE CONTROL, load-bearing: a range applied at the WRONG OFFSET diverges. That is what discriminates `applied correctly` from merely `applied`, which a single-edit test cannot.",
        },
        {
          criterion:
            "src/server.ts:151 no longer claims full sync is chosen so that no position/offset machinery is needed.",
          verification:
            "a MEASURED prose contract this PBI falsifies, corrected in the same commit. It reads today: `Full, not Incremental: the client resends the whole buffer, so no position/offset machinery is needed` -- wheel-avoidance BY SCOPE REDUCTION, and adoption removes the reason for the reduction.",
        },
        {
          criterion:
            "A full-buffer change arriving under Incremental -- which the protocol permits -- is still handled.",
          verification: "a test sending a change with no range while Incremental is advertised.",
        },
      ],
      status: "ready",
      notes: [
        "S16 ITEM RULED HERE RATHER THAN LEFT TO THE EXECUTOR: src/documents.ts:49's deliberate `taking the last rather than the first is the defensive read of the same contract` decision DIES with full sync. Withdrawn deliberately by this PBI, not dropped in passing.",
        "An editor-user cost paid TODAY for a maintenance reason, on a server whose flagship example is completion.",
      ],
    },
    {
      id: "PBI-30",
      story: {
        role: "editor user",
        capability: "have the server exit when the editor that spawned it dies",
        benefit: "a crashed editor does not leave a language server running forever",
      },
      acceptance_criteria: [
        {
          criterion:
            "When the client named a numeric processId at initialize and that process is gone, the server exits.",
          verification:
            "test/helpers/lsp.ts:575 sends processId: null, so the suite is STRUCTURALLY BLIND today -- a test that does not send a real pid can observe neither the defect nor its fix. Forcing the suite off processId: null IS part of the deliverable.",
        },
      ],
      status: "draft",
      notes: [
        "STAYS INDEPENDENT AND GOES BEFORE PBI-28, argued on maintenance and NOT surviving as a reason to adopt: the maintenance axis asks who maintains the code that is ALREADY THERE, and here THERE IS NO CODE -- it is ~10 lines not yet written. The choice is ten lines tsudoi owns and tests, versus ten lines arriving bundled with a 58-member Pick, a mixin, and an un-unref'd 3s interval the suite cannot see. Taking a wheel you have not built as a rider on your largest change is not the same as retiring one you maintain.",
        "THE CONSTRUCTIVE HALF: building it first RETIRES PBI-28's blocker (c). It forces the suite off processId: null and gives it assertions about a real pid, so the framework's watchDog can later be measured AGAINST A KNOWN BASELINE instead of arriving invisible -- and if PBI-28 proceeds, tsudoi's version is deleted in favour of upstream's, which is the maintenance axis working exactly as the stakeholder describes it.",
      ],
    },
    {
      id: "PBI-29",
      story: {
        role: "tsudoi maintainer",
        capability: "know what exit code a shutdown-before-initialize session ends with",
        benefit:
          "a lifecycle path that ships today is defended by an assertion rather than by nobody having sent it",
      },
      acceptance_criteria: [
        {
          criterion: "shutdown BEFORE initialize, then exit, has a test.",
          verification:
            "MEASURED today: tsudoi exits 1 -- the shutdown is refused -32002, lifecycle.shutDown() never runs, phase stays uninitialized -- and NO assertion says so. protocol.test.ts's `exit as the very first message exits 1` is a DIFFERENT case that agrees, which is how this one hid behind it.",
        },
      ],
      status: "draft",
      notes: [
        "A coverage hole in tsudoi's OWN lifecycle, found by an investigation into something else. Independent of the framework question.",
      ],
    },
    {
      id: "PBI-28",
      story: {
        role: "tsudoi maintainer",
        capability:
          "serve on createConnection and take onInitialize, so the framework's remotes are live",
        benefit:
          "dynamic registration and editor-facing messages become reachable rather than overridden into inertness",
      },
      acceptance_criteria: [
        {
          criterion:
            "PARKED ON ABSENCE OF DEMAND, NOT ABSENCE OF INFORMATION. Three conditions reverse it, none requiring anyone to trust the PO's judgement.",
          verification:
            "(a) A NAMED WANT -- window/showMessage to the editor user, or client.register for dynamic registration. Either makes this arm the cheapest route and this PBI ready almost immediately. THE STAKEHOLDER SAYING THEY MEANT `let's ride on it` AS AN INSTRUCTION RATHER THAN A PROPOSAL SATISFIES (a) BY ITSELF; the PO has undertaken to re-rule to refining on that alone. (b) UNMEASURED, and the PO would rather it were measured than argued: can client/workspace be taken while their REGISTERING members are narrowed away at the namespace type -- is a per-namespace Pick cheap? If yes the refusal weakens a lot. (c) The un-unref'd 3s interval, with a REAL pid, on both runtimes.",
        },
      ],
      status: "draft",
      notes: [
        "WITHDRAWN BY THE PO AT SPRINT 25, together with PBI-27 and for the same reason: the stakeholder declined the framework. Kept rather than deleted on the lifetime rule -- its provisional AC is the only home of the Pick-not-Omit instrument ruling and of the measurement that Connection has 58 members lacking onUnhandledNotification and trace. PBI-30's notes still argue against it by name and are now prose about a withdrawn item; correcting them is Refinement's, not this sprint's.",
        "MOVED TO refining BECAUSE THE PO KEPT THEIR WORD, not because the maintenance case carried it. They undertook to re-rule on reversal condition (a) -- the stakeholder reading `let's ride on it` as an instruction -- and the stakeholder did, naming MAINTAINABILITY: a popular framework has fewer bugs and others fix them, and it reduces wheel reinvention.",
        "RE-EVALUATED ON THE MAINTENANCE AXIS, AND createConnection SPECIFICALLY IS WEAK. stderrLogger (6 lines) is not retired -- it is REPLACED BY MORE MACHINERY, a Features.console mixin over a third-party base, to reach identical behaviour. lifecycle.exitCode() is kept under D1, so nothing is retired. Capability assembly was MEASURED TO SURVIVE INTACT, and surviving is the opposite of being retired -- the measurement that refuted the PO's objection also removed this from the maintenance ledger.",
        "THE ~40 TYPED REGISTRATIONS ARE REFUTED ON THE STAKEHOLDER'S OWN AXIS, not the PO's: onHover(h) replaces onRequest(HoverRequest.type, h), which is ONE TOKEN PER METHOD. What tsudoi actually hand-writes per method is the rejection check, the requestContext cancellation bridge, answerUnlessCancelled, the failure reporting and the streaming loop -- and the onX sugar touches NONE of it. tsudoi's per-method cost is not registration; it is the contract around it. There is no wheel here for upstream to take over.",
        "ONE QUESTION DECIDES ready VERSUS WITHDRAWN: reversal condition (b) -- does a per-namespace Pick keep the gate AND the namespaces? MEASURED BEFORE PLANNING, not in-sprint, on the S13 rule: a plan carries properties, and where it must name a mechanism it says whether that mechanism was measured to produce the property. Measuring (b) inside the sprint makes the sprint's shape unknown at Planning. Once PBI-27 lands the dependency it is an afternoon. If (b) fails, the PO brings this back as a PRICED REFUSAL rather than letting it ship as an unargued yes.",
        "PROVISIONAL AC, firming once (b) is measured. AC1: the handle createGatedConnection returns has NO member, AT ANY DEPTH INCLUDING NAMESPACE MEMBERS, through which a notification handler can be installed; the boundary is a Pick derived from keyof Connection read off the installed .d.ts. The two probes that currently go green measuring nothing are REBUILT FIRST, demonstrated by reddening them against Connection before anything else lands. Negative control: connection.workspace.onDidChangeWorkspaceFolders reachable from the handle reddens a named assertion. AC2: every invariant keeps a named assertion that still reddens, none deleted or weakened (S16). AC3: D1 holds -- the exit entry stays and NotificationGate keeps two representable values. AC4: the wire InitializeResult is asserted for the hover-only and neither cases (D3). AC5: the interval is measured WITH A REAL PID on both runtimes, which is free if PBI-30 ships first.",
      ],
    },
  ],

  completed: [
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
    number: 25,
    pbi_id: "PBI-26",
    goal: "A config author installs ONE package: the examples get every protocol name they use from @atusy/tsudoi/types, and a consumer that never declares vscode-languageserver-protocol can both TYPE-CHECK and RUN them.",
    status: "in_progress",
    subtasks: [
      {
        test: "none -- BORN GREEN and honestly so; a pure capability move with no assertion of its own. Suite must stay at 347 pass.",
        implementation:
          "installConsumer() returns a fourth capability: start an LspSession in the consumer's own directory. test/helpers/lsp.ts:217 already has the command-plus-cwd form; this exposes it through InstalledConsumer rather than inventing a second spawner.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "039d4bc",
            message: "test: let an installed consumer start a server, not only type-check one",
            phase: "green",
          },
        ],
        notes: [
          "NO PERTURBATION AVAILABLE, and that is why it is structural. It earns its place by being USED IN B5 -- if B5 is dropped, this must be REVERTED rather than left.",
          "KEPT, because B5 SHIPPED and uses it. Deliberately NOT used by B1, whose Object.keys probe takes runCommand instead: had B1 leaned on this too, `revert it if B5 is dropped` would have stopped being an executable instruction.",
        ],
      },
      {
        test: 'B1: the runtime VALUE surface of the PUBLISHED module -- Object.keys of @atusy/tsudoi/types through the consumer harness, toEqual(["CompletionItemKind"]). Reddens today on an empty array: dist/types.js is `export {}` at 11 bytes.',
        implementation:
          "src/types.ts re-exports eight names. Only CompletionItemKind, MarkupContent and Position are new imports; CompletionItem, CompletionParams, Hover, HoverParams and WorkspaceFolder are already imported for MethodMap/RequestContext and merely gain an export.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "ab12568",
            message: "feat: publish the protocol names the examples use, and record why bare",
            phase: "green",
          },
        ],
        notes: [
          "PERTURBATION, both halves: dropping the re-export reddens naming the symbol, AND re-exporting it `as type` ALSO reddens -- that half is the one that matters, because a type-only re-export compiles and emits nothing.",
          "BOTH RAN. `export type` reddens the value probe ALONE, with the eight-name type probe still green -- the half that matters, measured. Dropping the re-export entirely reddens BOTH, the type probe naming the symbol. RED observed as predicted: an empty array from a dist/types.js of `export {}`.",
          "THE SPECIFIER MEASUREMENT DID NOT REPRODUCE AS HANDED OVER, and the correction ships in the comment: `/node produces 6+ errors out of vscode-jsonrpc\'s node main.d.ts` holds ONLY with skipLibCheck OFF, and the errors come out of TWO files -- vscode-jsonrpc/lib/node/main.d.ts AND vscode-languageserver-protocol/lib/node/main.d.ts. With skipLibCheck ON, which is what test/helpers/typecheck.ts sets, BOTH specifiers exit 0 and the difference vanishes. So NO PROBE IN THIS SUITE COULD REDDEN if the line moved to /node, and the comment says so rather than implying cover it does not have.",
          "SOURCE SPECIFIER IS BARE vscode-languageserver-protocol, MEASURED not assumed: at `types: []` with no @types/node at all, bare exits 0 while /node produces 6+ errors (TS2591 child_process, net, worker_threads; TS2503 NodeJS) out of vscode-jsonrpc's node main.d.ts.",
          "DOC OBLIGATION: src/types.ts states every exported name is public API, so the block must say WHY THESE EIGHT -- measured, they are exactly what the examples use: six in completion-path.ts, two in hover-wordnet.ts, none added by tsudoi.config.ts -- and what the rule is for a ninth.",
        ],
      },
      {
        test: "B2: a consumer.typeCheck() probe importing all eight from @atusy/tsudoi/types and USING each. Fails today with seven TS2305.",
        implementation:
          "no new implementation; B1 satisfies it. This is the type-arm control B1's value-arm cannot give.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "ab12568",
            message: "feat: publish the protocol names the examples use, and record why bare",
            phase: "green",
          },
        ],
        notes: [
          "RED OBSERVED, and the plan\'s `seven TS2305` is wrong in both code and count: EIGHT names are named, as FIVE TS2459 (`declares it locally, but it is not exported` -- src/types.ts already imported those five for MethodMap) and THREE TS2305. The diagnostic is better than planned, not worse: TS2459 says the name is present and unexported, which points at the fix.",
          "PERTURBATION RAN: dropping MarkupContent from the re-export reddens this probe naming MarkupContent, with the value probe still green.",
          "MUST GO THROUGH installConsumer, NOT typeCheckProbe: the in-repo arm resolves the exports map's `default` straight at src/types.ts and, as published-artifacts.test.ts:131 already records, CANNOT OBSERVE WHAT SHIPS.",
          "Perturbation: remove any one name from src/types.ts and the probe names that symbol.",
        ],
      },
      {
        test: "B3: a probe importing a NINTH name (DefinitionParams) from @atusy/tsudoi/types must FAIL. BORN GREEN and flagged -- it fails today because NOTHING is exported, and must still fail afterwards.",
        implementation: "none. This is the `and no more` half of criterion 2.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "28f0809",
            message:
              "test: hold the published surface to eight names, and prove the probe can see a ninth",
            phase: "green",
          },
        ],
        notes: [
          "THE MANDATORY PERTURBATION RAN AND IS RECORDED IN THE TEST\'S DOC BLOCK: with DefinitionParams added to the re-export list the probe type-checks, the exit comes back 0, and THIS assertion is what fails -- alone, with the value and eight-name probes green. Born green and now non-vacuous, measured rather than argued.",
          "A SECOND DEGENERACY WAS FOUND AT AUTHORING TIME and given its OWN test rather than an extra assertion: a probe naming a symbol the DEPENDENCY does not export fails identically to one naming a symbol tsudoi declines to re-export. Two outcomes, one observation. The paired test asserts DefinitionParams really is exported by vscode-languageserver-protocol.",
          "THE ONE FLAGGED SUBTASK WHERE BORN-GREEN IS A JUDGEMENT RATHER THAN A DEFINITION, and the Developer pushed hardest on it: AS WRITTEN THIS ASSERTION IS SATISFIED PERFECTLY BY A MODULE THAT EXPORTS NOTHING AT ALL -- which is exactly the state it is written in. RUN THE PERTURBATION ONCE AND RECORD IT: adding DefinitionParams to the re-export list makes the probe go green and this test redden. Recorded in the test's doc block, as BoundaryIsTheObservingMembers records its four controls.",
        ],
      },
      {
        test: "B4: published-artifacts.test.ts:195 REPLACED BY ITS INVERSE -- under useNonHoistingLayout, consumer.typeCheck(exampleSources()) must be code === 0. Measured to FAIL today naming vscode-languageserver-protocol, so the criterion has a live opposite.",
        implementation:
          "rewrite the protocol imports in examples/completion-path.ts, examples/hover-wordnet.ts and examples/tsudoi.config.ts to @atusy/tsudoi/types. examples/wordnet.d.ts has no protocol import.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "ae3437b",
            message:
              "feat: the examples name one package, and the withdrawn premise is recorded where it stood",
            phase: "green",
          },
        ],
        notes: [
          "RED OBSERVED AT THE TRANSITION: with the examples repointed and nothing else changed, exactly three tests failed -- the withdrawn hoisting test, and TWO in resolution.test.ts. The latter pair is the blast radius the plan did not name; see the sprint decision on dist/.",
          "MANDATED PERTURBATION RAN: disabling the renameSync inside useNonHoistingLayout reddens THE NEGATIVE CONTROL AND ONLY IT -- the bare protocol import type-checks, the assertion that it would not is what fails, and the examples\' own exit-0 half stays green. That is the S20 degeneracy the PO named, caught by the pair rather than by argument.",
          'THE SECOND SURVIVING CONTROL WAS MEASURED FALSE AT THE ARM THE PLAN NAMED, and rebuilt at the arm that works. `withhold wordnet and the examples must still fail` does NOT hold for the TYPE CHECK: measured, exit 0 with EMPTY OUTPUT, because examples/wordnet.d.ts carries `declare module "wordnet"` and that file is part of what a reader copies. tsc needs nothing on disk once a module is declared. The detection survives at the RUNTIME arm -- exit 1, stderr naming the package -- and the test asserts BOTH halves so the non-discriminating one cannot quietly become folklore. Taken on trust, the last genuinely-missing-package case would have been asserted at the one arm that cannot see it.',
          "NEGATIVE CONTROL IN THE SAME RUN, LOAD-BEARING: a probe importing vscode-languageserver-protocol by bare specifier must STILL fail. PERTURBATION: comment out the renameSync in useNonHoistingLayout and the negative control goes green, AND ONLY IT -- which is the failure the PO named, a harness that stopped applying the layout producing code === 0 for the wrong reason.",
          "SECOND SURVIVING CONTROL: withhold `wordnet` and the examples must still fail. That is the PO's `what survives is the harness's ability to detect a genuinely missing package`, and it becomes the ONLY remaining genuinely-missing-package case.",
        ],
      },
      {
        test: "B5: start a session in the non-hoisting consumer via S1; initialize, didOpen, completion; assert a NON-EMPTY CompletionItem[]. Fails today -- the example cannot even load.",
        implementation:
          "none beyond S1 and B1; this is the runtime half type-checking cannot cover.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "ae3437b",
            message:
              "feat: the examples name one package, and the withdrawn premise is recorded where it stood",
            phase: "green",
          },
        ],
        notes: [
          "THE PLANNED PERTURBATION DOES NOT DISCRIMINATE THIS TEST, measured: `export type` reddens SIX tests, and the example\'s own TYPE CHECK is among them -- because the example imports CompletionItemKind as a VALUE, so tsc rejects it before anything runs. The plan predicted `B1 and B2 stay green and this reddens at runtime`; B1 reddens too, and this is NOT the first thing to fail. On the S9 rule a control that can never be first to fail is not one, so a second was run.",
          "INDEPENDENT PERTURBATION THAT DOES DISCRIMINATE IT: dropping the exports map\'s `import` arm from the PACKED copy this test installs reddens this test, and it is a RUNTIME-ONLY fault -- tsc resolves through the untouched `types` arm, so no type check in the file could have seen it. That is what earns this test its place, and it is the same shape installed-runtime.test.ts already uses for the same arm.",
          "WHY IT EXISTS, and this belongs in its doc block: CompletionItemKind is a VALUE, so a resolution failure is a RUNTIME failure. A type-check-only criterion would go GREEN against a dist/types.d.ts whose dist/types.js re-exports nothing. PERTURBATION: change the re-export to `export type` -- B1 and B2 stay green and this reddens at runtime.",
        ],
      },
      {
        test: "B6: a source-text assertion over the extracted quickstart install step -- the command matches no /vscode-languageserver-protocol/. Reddens today on README.md:180.",
        implementation:
          "README.md:180 `bun install vscode-languageserver-protocol wordnet` becomes `bun install wordnet`.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "ae3437b",
            message:
              "feat: the examples name one package, and the withdrawn premise is recorded where it stood",
            phase: "green",
          },
        ],
        notes: [
          "THE PLAN\'S MECHANISM IS MEASURED FALSE AND ITS PROPERTY IS NOT. There is no `extracted quickstart install step` carrying this command: extractQuickstart finds FIVE marked blocks and README.md:180 is none of them, so NOTHING extracts or executes it -- which also falsifies criterion 3\'s `the existing extraction harness executes it`. Delivered by adding an `examples-install` marker and its own extractor, throw-on-count, DELIBERATELY SEPARATE from `quickstart` so QUICKSTART_STEPS stays 5: folding it in would have made the omission sweep assert that dropping this step leaves no server, which is false -- the quickstart config imports only @atusy/tsudoi/types.",
          "RED OBSERVED on the command\'s own bytes, then green on the edit. TWO TESTS, NOT ONE, because two different hazards: naming a package the examples do not need, and naming NONE of the ones they do. Either could hide the other behind a first failure.",
          "RESEQUENCED TO LAST, against the plan\'s `could ship first for an early green`: measured, it is NOT independent. README.md:177-190 makes claims about what examples/ import, so changing the install line before B4 lands would ship a commit whose README is FALSE. The prose around the command was corrected in the same commit for the same reason.",
          "THE ASYMMETRY GOES IN THE TEST RATHER THAN BEING HIDDEN: the extraction harness EXECUTES the command then type-checks, so it catches UNDER-installation and CANNOT catch OVER-installation -- leaving the old command in place would keep every existing assertion green. This text assertion is the ONLY cover for the over-installation direction.",
          "EXPLICITLY NOT IN SCOPE: test/readme.test.ts:217's tokens [/network/i, /cache/i, /vscode-languageserver-protocol/] is a prose claim about TSUDOI'S OWN cold-cache dependency, not about the consumer's install. It stays TRUE and GREEN here and moves at PBI-27. Do not sweep it into this sprint.",
        ],
      },
      {
        test: "none -- structural and BORN GREEN, and it must be: it is prose about a test that no longer exists.",
        implementation:
          "the replacement test from B4 carries, in its own doc block, the record that published-artifacts.test.ts:195's premise was WITHDRAWN DELIBERATELY at PBI-26, that `without the documented install the example reddens` is therefore UNCONSTRUCTIBLE rather than broken (no undeclared specifier is left to withhold), and that what survives is the wordnet case.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "ae3437b",
            message:
              "feat: the examples name one package, and the withdrawn premise is recorded where it stood",
            phase: "green",
          },
        ],
        notes: [
          "SHIPS IN THE SAME COMMIT AS B4 so the record and the withdrawal are never separated.",
          "DONE, and it says UNCONSTRUCTIBLE rather than removed: no undeclared specifier is left in the examples to withhold, which is a different thing from a control that could be built and was not. It also carries what survives -- the wordnet case -- and points at the test that asserts it.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "ORDERING CONSTRAINTS: B1 -> B2 -> B4 is HARD, since the examples cannot import names that do not exist yet. S1 must precede B5. B3 may sit anywhere after B1. B6 is independent and could ship first for an early green.",
      "A RISK OUTSIDE THE CRITERIA, recorded because descoping would hide it: dist/types.d.ts now re-exports from vscode-languageserver-protocol, so a consumer's tsc must follow into node_modules/@atusy/tsudoi/node_modules/ under the non-hoisting layout. B4 measures exactly that -- but if B4 is descoped, B1 and B2 alone would ship a published surface nobody checked through the nested layout.",
      "CARRIED ONTO PBI-27 AS A LIVE REGRESSION RISK, not left in this sprint: issue #1's E1 says unify on vscode-languageserver/node. If src/types.ts moves there, criterion 2 silently regresses for every consumer without @types/node. MEASURED LOOKAHEAD: bare vscode-languageserver ALSO type-checks at types: [], exit 0. So PBI-27 must aim src/types.ts at BARE vscode-languageserver while src/server.ts and src/notifications.ts use /node. That split is written down nowhere else.",
      "ALSO FOR PBI-27: useNonHoistingLayout renames node_modules/vscode-languageserver-protocol. PBI-26 KEEPS the dependency so the rename still finds its target; at PBI-27 it ENOENTs, measured. MOOT AS OF THE SPRINT-25 RULING: PBI-27 is withdrawn and the dependency is permanent, so the rename always finds its target and criterion 1's harness is never re-based.",
      "THE PLAN'S LARGEST GAP, MEASURED BEFORE ANY SUBTASK RAN: it reaches the examples' runtime resolution and never names which arm it lands on. From INSIDE this repo, package self-reference resolves `@atusy/tsudoi/types` to the exports map's `import` arm -- ./dist/types.js -- under BOTH bun 1.3.13 and deno 2.9.2. DISCRIMINATED rather than inferred: a marker export written into dist/types.js appears in Object.keys under both, so the observation is not equally explained by the `default` arm landing on src/types.ts, which exports no value either. So the moment an example takes a VALUE from the subpath, THE REPO'S OWN dist/ becomes load-bearing for `bun test` -- and it is gitignored, built only by prepack, and built by nothing the suite runs.",
      "THE SCOPE QUESTION THAT FOLLOWS, RAISED RATHER THAN DECIDED, and it is one sentence: after this sprint, `bun test` requires `bun run prepack` to have been run since the last change to src/types.ts, and NOTHING ENFORCES IT. Measured both ways -- dist/ ABSENT gives ERR_MODULE_NOT_FOUND at config load; dist/ STALE gives `SyntaxError: Export named 'CompletionItemKind' not found`, at a STATIC import, before any preflight in the affected file could run. `tsc --noEmit` is unaffected either way: it falls through to src/types.ts when dist/ is missing. Three candidate resolutions, none picked: a develop-time build step, committing dist/, or changing the exports map. EACH falsifies test/package-shape.test.ts's `the build is a PUBLISH-TIME step, not a develop-time one`, which is why the executor would not pick one.",
      "WHAT WAS DONE INSTEAD, and it is the minimum that does not decide the question: a test DETECTS the stale and absent cases and names `bun run prepack` on its own assertion line. It does not build -- a helper quietly running tsc would settle the ruling by default. Perturbed both ways and it fires both ways. The publish-time prose was corrected in the same commit rather than left reading as a promise. isolatedCheckout now carries dist/ on the same reasoning its own comment already gave: it is part of what a runtime needs to START, and it is NOT the dependency those tests hold away -- leaving it out made two resolution tests fail for a staging reason inside tests whose whole subject is where a DEPENDENCY resolved from, which is two causes producing one observation.",
      "THREE PO-AUTHORED FACTUAL PREMISES MEASURED FALSE IN ONE SPRINT, all inside criteria or subtask notes, none fatal and all corrected in place: criterion 3's `the existing extraction harness executes it` (nothing extracts README.md:180 at all); B4's `withhold wordnet and the examples must still fail` (true at the RUNTIME arm, false at the type arm, because the example ships its own ambient `declare module`); and B1's specifier measurement, which holds only with skipLibCheck OFF. THE SHAPE IS THE ONE SPRINT 13 ALREADY NAMED -- a factual premise stated inside a criterion is a claim requiring measurement, not framing -- and it fired three times here because this sprint's criteria lean unusually hard on how a resolver behaves, which is exactly the class nobody can recall correctly.",
      "B6 IS NOT INDEPENDENT, contrary to the ordering note, and it was resequenced to LAST rather than shipped first for an early green: README.md:177-190 makes claims about what examples/ import, so changing the install command before B4 lands ships a commit whose README is false. An early green bought at the price of a false document is not a green this project accepts.",
    ],
  },
  retrospectives: [
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
