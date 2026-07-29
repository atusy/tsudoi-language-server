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
      id: "PBI-33",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read why tsudoi does not serve on vscode-languageserver, at the line that would change it",
        benefit:
          "the next person to ask is answered by the repository instead of re-running the whole investigation",
      },
      acceptance_criteria: [
        {
          criterion:
            "createGatedConnection in src/notifications.ts records why the framework's connection is not taken, with version and path so it can be RE-RUN.",
          verification:
            "S8 as amended at Sprint 24. It must carry BOTH directions: 58 members with onUnhandledNotification and trace absent so Omit silently no-ops on two of four keys; ~11 ungated top-level registrars plus three registering namespaces; overriding InitializeRequest skips remote.initialize; no logger argument exists. AND what was measured FOR adoption -- fillServerCapabilities adds nothing, onShutdown coexists with -32600 -- because A RECORD THAT ONLY CARRIES THE CASE AGAINST IS AN ADVOCACY DOCUMENT, NOT A DECISION RECORD.",
        },
        {
          criterion:
            "The two other homes ruled at Refinement are written, and PBI-27 and PBI-28 are DELETED in the same commit, which names where each decision went.",
          verification:
            "test/notifications.test.ts:260 gains one sentence -- removing the last `always` entry is a SCOPE DECISION, not a cleanup. RequestOnlyConnection gains the Pick-not-Omit instrument preference, with its reversal condition: if the enumeration pin is ever removed or weakened, Omit loses its only defence and conversion becomes REQUIRED. S9's audit-trail clause governs the deletion commit.",
        },
      ],
      status: "ready",
      notes: [
        "CLOSES GitHub issue #1. A WITHDRAWN PBI IS NOT A HOME -- the Lifetime Rule names three (a permanent assertion, a comment at the site it constrains, an active improvement) and a withdrawn PBI's criteria are none of them. THIS PBI IS THE RE-HOMING; until it ships, PBI-27 and PBI-28 are kept solely as custody.",
        "NOT A MANDATE TO CONVERT the existing Omit: ProtocolConnectionHasTheseMembers and BoundaryIsTheObservingMembers both redden if the base type's member set moves, so today's Omit is defended, and a change with no defect to fix is churn.",
      ],
    },
    {
      id: "PBI-34",
      story: {
        role: "config author",
        capability:
          "have @atusy/tsudoi/types type-check in my project even though I have no Node typings",
        benefit: "the specifier choice that makes that true cannot silently regress",
      },
      acceptance_criteria: [
        {
          criterion:
            "A probe stands up ITS OWN tsconfig with skipLibCheck: false AND types: [], installs the package, and imports the eight names.",
          verification:
            'MEASURED four-cell table -- ONLY THE PAIR DISCRIMINATES. skipLibCheck:false with types:["node"] exits 0 on both sources; skipLibCheck:true with types:[] exits 0 on both. The repo cannot see this today: tsconfig.json sets skipLibCheck true AND test/helpers/typecheck.ts:45 sets it in consumerCompilerOptions, so THE PROBE HARNESS ITSELF IS BLIND, not merely the build. Must go through installConsumer -- the in-repo arm resolves `default` straight at src/types.ts and cannot observe what ships.',
        },
        {
          criterion: "TWO controls, and the second is the one that matters.",
          verification:
            "(1) DISCRIMINATION: pointing src/types.ts at vscode-languageserver-protocol/node reddens it, naming NodeJS or child_process; record the diagnostic. (2) THAT THE PROBE RAN WITH skipLibCheck OFF: flipping the probe's own skipLibCheck back to true must STOP the first perturbation reddening. Without it the probe can SILENTLY REVERT TO BLIND -- the S20 failure, an observation that reads as coverage while recording nothing.",
        },
        {
          criterion: "The doc block discloses the probe's own fragility and what to do about it.",
          verification:
            "skipLibCheck:false type-checks the dependency's WHOLE .d.ts graph, so a future release with an imperfect declaration reddens this for a reason unrelated to tsudoi. Record the VERSION it was measured clean at (S8/Sprint 24), and the TRIAGE -- what a maintainer does when it fires for the wrong cause. A probe that fires wrongly with no recorded response is one someone eventually disables, and disabling it silently restores the blindness it exists to remove. Same disclosure ProtocolConnectionHasTheseMembers makes about TS2344.",
        },
      ],
      status: "ready",
      notes: [
        "THIRD RECORDED TIME skipLibCheck has defeated a probe here; S9 already names it once. Until this ships, src/types.ts's comment saying NOTHING BACKS IT is the only true thing between that line and a silent regression -- leave it exactly as written.",
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
            "a fixture config that CALLS the new members and is DRIVEN by the suite (S5), with existing documents.test.ts and sync.test.ts assertions unchanged and green.",
        },
        {
          criterion:
            "Exactly ONE TextDocument is reachable from @atusy/tsudoi/types, and it is the upstream one.",
          verification:
            "THE TRAP THE SUPERSET MEASUREMENT CANNOT COVER: a strict-superset or assignability result CANNOT DISCRIMINATE ADOPTED FROM SHADOWED -- tsudoi's own interface kept ALONGSIDE a re-export is structurally satisfied by the same value and compiles identically. The criterion is on IDENTITY, not assignability. S20 in its purest form.",
        },
        {
          criterion:
            "The breaking change to @atusy/tsudoi/types is stated, and README's document prose updated.",
          verification: "the installed-consumer type-check plus the README extraction harness.",
        },
      ],
      status: "refining",
      notes: [
        "THE MAINTENANCE HEADLINE. MEASURED on tsudoi's actual shape -- createProtocolConnection, tsudoi's own gate and lifecycle, TextDocument added, NO vscode-languageserver import: gate holds (-32002 / -32600), incremental sync works, positionAt/offsetAt/lineCount work, exit 0 from tsudoi's OWN lifecycle.exitCode(). bun and deno identical.",
        "WHY THE WIN EXCEEDS THE ~15 LINES IT RETIRES: getText() with NO ARGUMENTS pushes offset arithmetic downstream into configs tsudoi CANNOT SEE. Wheel reinvention happening RIGHT NOW, uncontrolled, in code this project will never be able to fix.",
        "Adds vscode-languageserver-textdocument (zero dependencies). Does NOT contradict single-source-of-truth for the PROTOCOL: it is upstream's own package split and vscode-languageserver does not re-export it.",
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
            "NEGATIVE CONTROL, load-bearing: a range applied at the WRONG OFFSET diverges. That discriminates `applied correctly` from merely `applied`, which a single-edit test cannot.",
        },
        {
          criterion:
            "src/server.ts:151 no longer claims full sync is chosen so that no position/offset machinery is needed.",
          verification:
            "a MEASURED prose contract this PBI falsifies, corrected in the same commit. Today it reads `Full, not Incremental: the client resends the whole buffer, so no position/offset machinery is needed` -- WHEEL-AVOIDANCE BY SCOPE REDUCTION, and adoption removes the reason for the reduction.",
        },
        {
          criterion:
            "A full-buffer change arriving under Incremental -- which the protocol permits -- is still handled.",
          verification: "a test sending a change with no range while Incremental is advertised.",
        },
      ],
      status: "refining",
      notes: [
        "S16 RULED HERE, not left to the executor: src/documents.ts:49's deliberate `taking the last rather than the first is the defensive read of the same contract` DIES with full sync. Withdrawn deliberately, not dropped in passing.",
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
            "test/helpers/lsp.ts:575 sends processId: null, so the suite is STRUCTURALLY BLIND today -- a test that does not send a real pid can observe neither the defect nor its fix. FORCING THE SUITE OFF processId: null IS PART OF THE DELIVERABLE.",
        },
        {
          criterion: "The mechanism is measured on BOTH runtimes.",
          verification:
            "process.kill(pid, 0) and an interval under deno's node compatibility are unverified.",
        },
      ],
      status: "draft",
      notes: [
        "LSP's processId exists for exactly this and says the server SHOULD exit when the parent dies, so tsudoi is currently NON-CONFORMANT WITH A SHOULD, and a crashed editor leaks the server forever.",
        "NOBODY BUT TSUDOI BUILDS THIS. With the framework declined there is no watchDog to inherit, which puts it squarely inside `keep the core implementation in-house`.",
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
            "MEASURED: tsudoi exits 1 -- the shutdown is refused -32002, lifecycle.shutDown() never runs, phase stays uninitialized -- and NO assertion says so. protocol.test.ts's `exit as the very first message exits 1` is a DIFFERENT case that agrees, which is how this one hid behind it.",
        },
      ],
      status: "draft",
      notes: [
        "A coverage hole in tsudoi's OWN lifecycle, found by an investigation into something else.",
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
    {
      id: "PBI-27",
      story: {
        role: "tsudoi maintainer",
        capability: "WITHDRAWN -- declare vscode-languageserver as the single dependency",
        benefit: "WITHDRAWN",
      },
      acceptance_criteria: [
        {
          criterion:
            "WITHDRAWN. Kept ONLY as custody until PBI-33 re-homes what it carries; deleted in that same commit.",
          verification:
            "the stakeholder declined the package. Its surviving content is enumerated in PBI-33's criteria.",
        },
      ],
      status: "draft",
      notes: [
        "WITHDRAWN. A withdrawn PBI is NOT a home -- this entry exists to be deleted by PBI-33, not to store anything.",
      ],
    },
    {
      id: "PBI-28",
      story: {
        role: "tsudoi maintainer",
        capability: "WITHDRAWN -- serve on createConnection and take onInitialize",
        benefit: "WITHDRAWN",
      },
      acceptance_criteria: [
        {
          criterion:
            "WITHDRAWN. Kept ONLY as custody until PBI-33 re-homes what it carries; deleted in that same commit.",
          verification:
            "the stakeholder declined the package. Its surviving content is enumerated in PBI-33's criteria.",
        },
      ],
      status: "draft",
      notes: ["WITHDRAWN. Reversal condition (b) never needs measuring."],
    },
  ],

  completed: [
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

  sprint: null,
  retrospectives: [
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
