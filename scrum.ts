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
      id: "PBI-25",
      story: {
        role: "tsudoi maintainer",
        capability:
          "judge the completeness of the gate against the protocol rather than against memory",
        benefit:
          "the claim `these are all the ungated views` becomes a judgement made against an enumerated set, and a new one cannot arrive silently",
      },
      acceptance_criteria: [
        {
          criterion: "onProgress and trace are unreachable on the handle startServer holds",
          verification:
            "Extend the same Omit. BOTH-HALVES typeCheckProbe per member, plus the rename-independent form. NEGATIVE CONTROL per member, since P2 showed keys can pass each other off: dropping ONE key must redden ITS probes while the others stay green",
        },
        {
          criterion:
            "ProtocolConnection's member set is ENUMERATED AND PINNED against the primary source",
          verification:
            "Pin the set difference so a member added by the dependency, or a key added to the Omit, REDDENS. MEASURED PRECEDENT: appending `sendNotification` to the Omit reddens the existing pin ALONE while all 343 tests pass. AND THE PIN'S LIMIT IS CLAIMED: it asserts THE SET, never that no other member exposes traffic -- the completeness claim stays a JUDGEMENT, and what changes is what it is made against",
        },
      ],
      status: "ready",
      notes: [
        "FILED AFTER `THE LAST ITEM OF ITS KIND` WAS FALSIFIED IN THE SPRINT THAT SHIPPED IT. Closing two members is the SMALL part; the real deliverable is MAKING THE COMPLETENESS CLAIM ASSERTABLE, since the mechanism that would have caught that false claim already exists -- P4 demonstrated it.",
        "trace IS THE WORST OF THE THREE, not the questionable one, and the Scrum Master's ranking was backwards. The objection was that a config author might legitimately want it: A CONFIG AUTHOR CANNOT REACH IT -- RequestOnlyConnection is internal to src/, and config authors get Tsudoi and RequestContext. The only party that could want it is src/ ITSELF, and SPRINT 15 ALREADY RULED AGAINST TRACING by leaving $/setTrace deliberately silent. Same answer, same source. And traceReceivedNotification fires at THREE SITES whether or not a handler exists, so it sees EVERY received notification -- broader than either member closed so far.",
        "onProgress: yes by the PBI-24 reasoning exactly -- on the handle, no deliberate act, one-token reversible, and nothing receives $/progress.",
        "A LIMIT OF THE PIN, NAMED AT FILING: it is a claim about a PINNED DEPENDENCY at a stated version. Nothing reddens if a future release adds an observing member -- the same silent-falsification shape one layer out, and the honest boundary of what this PBI buys.",
      ],
    },
  ],

  completed: [
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
        "SPRINT 20'S RECORD DROPPED AT SPRINT 23, homes checked: the exact-match rule and its extension-only guard are examples/completion-path.ts's own code and comments, the declined generalisation owns a test that still runs, and the still-mangles boundary is pinned. SPRINT 19'S RECORD DROPPED EARLIER, homes checked: one-copy-per-entry and its symmetry reasoning are at src/workspace.ts, the re-armed trailing-slash control and the ordering pin are tests that still run, and the two-tests-two-controls finding became the granularity entry. Shipped in cbd7dab, 39dc7c4, 1996c24, 7409422, 84309eb, ef69ca1 and 95156c1. 341 tests green from 332, each DoD command run separately with its exit read directly.",
        "A PREMISE INSIDE THE CRITERION WAS MEASURED FALSE, and the ROUTE IN is what the PO named: they did not invent `server.ts, methods.ts and the fixtures` -- they INHERITED it from a handback and PROMOTED IT INTO A CRITERION AS FACT. An unlabelled claim in a handback reads as REASONED under their own default, and putting it in a criterion converted it to ESTABLISHED without measurement. MEASURED: no fixture and no example imports that subpath at all -- all 24 of their protocol imports are the BARE specifier. The Scrum Master's independent re-run reddened FIVE where the executor's reddened three, because guard.test.ts carries two bare-specifier assertions a module-wide ban breaks -- the same finding from the other direction, which is what makes the correction trustworthy rather than one unmeasured list swapped for another.",
        "THE MOST VALUABLE FINDING WAS NOT ON THE PLAN: spelling the exemption `off` rather than REDECLARING reddens exactly one test -- the bun:sqlite assertion at src/notifications.ts -- because an override REPLACES options rather than merging them. A SILENT DISABLING OF A DIFFERENT GUARD, in the file whose whole purpose is guarding, found by measurement rather than by reading.",
        "TWO DEGENERACY CATCHES BEFORE ANYTHING FALSE WAS RECORDED, the Sprint 20 widening applied at authoring time TWICE in one sprint: an assertion reading its target path out of THE RULE'S OWN HELP TEXT, so a clean file and a flagged file produced the SAME observation; and a comment claiming half 3 was the only one a module-wide ban fails, which perturbation says is false of all three -- BACKED AND STILL WRONG. Corrected to what it actually buys: the only half that NAMES THE CAUSE, since the others fail on an absent WORDING indistinguishable from a message-format change.",
        "THE LAUNDERING HAZARD MEASURED RATHER THAN ARGUED: adding the re-export reddens the export test at its FIRST assertion, nothing else in 341, and oxlint STAYS 0. The exemption really is a hole the ban cannot see -- which is the precondition the criterion rested on.",
        "DECLINING TO ASSERT THE TEST-FILE EXEMPTIONS IS THE HARDER CALL AND THE PO NAMED IT AS SUCH: those branches would be bare exit-0 assertions carrying exactly the defect the widening names, and an assertion that cannot discriminate is WORSE than none because it reads as coverage.",
        "NOT CONSTRUCTED, correctly labelled and correctly homed: the PBI-22 SUFFICIENCY ARGUMENT. The probes redden if createGatedConnection's return annotation is widened, so THE FACT is defended; the claim that a mere detector SUFFICES is an argument, and arguments have no assertion. At risk: startServer re-binding a wide connection while the lint keeps passing AND KEEPS READING LIKE A GUARD. Also measured: `await import(...)` walks past, in a run where a static import of the same name in a sibling file was flagged.",
      ],
    },
    {
      number: 21,
      pbi_id: "PBI-22",
      goal: "Make a notification handler unregisterable outside the router -- so the gate cannot be avoided by not using the thing that applies it.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "SPRINT 18'S RECORD DROPPED HERE, homes checked: the chain and its precedence are src/workspace.ts's own code and comments, the harm-asymmetry reasoning and the spec-precedence counter sit beside them, and the read-time trap is pinned by tests that still run. Shipped in c771080, 8c391db, c81327a, 04fa547 and 17522f6. 332 tests green, each DoD command run separately with its exit read directly. startServer never binds the wide type: createGatedConnection creates, registers the table, and hands back Omit<ProtocolConnection, `onNotification`>.",
        "A CONTROL DESIGNED NOT TO LIE, RATHER THAN CAUGHT LYING -- the sprint's most durable output. Against UNCHANGED src/, all three probes fail with TS2305 `no exported member`, so AN EXIT-CODE-ONLY ASSERTION WOULD HAVE GONE GREEN AGAINST A MODULE WITH NO NARROWING WHATSOEVER. A file-bound diagnostic regex refuses that. Third instance of this class here and THE FIRST PREVENTED AT AUTHORING rather than caught at review. The born-green claim carries its boundary accordingly: green with respect to src/ AT THE STRUCTURAL COMMIT, not pre-sprint.",
        "THE REMAINDER CHECK RAN BEFORE ANY src/ EDIT, with its own control, because five overloads through a mapped type made `it will be fine` unavailable: onRequest with and without params, sendProgress and listen all type-check, while appending onNotification exits 1 naming TS2551. No contortion, so no handback.",
        "A SEAM NEARLY MISLABELLED AND CLOSED: widening the FACTORY'S RETURN ANNOTATION while leaving the alias untouched left all three probes GREEN, tsc 0, and an ungated onNotification in src/server.ts COMPILING -- foreclosure entirely gone with nothing saying so. A fourth probe takes its connection from the factory; the same perturbation now reddens it and only it.",
        "A FALSE NOT-CONSTRUCTED OF THEIR OWN, self-caught by the coverage-claim rule: they first recorded that `startServer holds the narrowed type` was carried by nothing executable, which BUNDLED TWO SEAMS -- only the import is beyond a type's reach. Sprint 11's classification running in reverse.",
        "THE PERMITTED HALF STAYS, and NOT for the reason first offered. `Survives on sequence` is weak, since DoD order is no guarantee. What holds is that the repo's tsc catches it only INCIDENTALLY, as a side effect of src/ currently exercising onRequest on the narrowed type -- if src/ stopped, that coverage would evaporate SILENTLY. So `can never be first to fail` means never FOR A STABLE REASON, and incidental coverage is not coverage. Second time this rule has needed that reading.",
        "NOTE 5 OF PBI-22 SAID `NO TYPE CAN DO THIS` AND THIS SPRINT FALSIFIED IT. The executor FLAGGED rather than edited a field that is not theirs -- the standing prose item working across the who-may-edit-what boundary -- and it was CORRECTED rather than deleted, because that sentence is exactly what a future reader would cite to re-propose the evadable route.",
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
    number: 24,
    pbi_id: "PBI-25",
    goal: "Judge the completeness of the notification gate AGAINST THE PROTOCOL rather than against memory: close onProgress and trace, and make `these are all the ungated views` a judgement against an ENUMERATED, MACHINE-PINNED member set rather than a recollection.",
    status: "in_progress",
    subtasks: [
      {
        test: "BOTH-HALVES typeCheckProbe per member and per form -- onProgress direct, onProgress aliased, trace direct, trace aliased -- each asserting the diagnostic BOUND TO FILE AND SYMBOL and that no diagnostic names permits.ts",
        implementation:
          "Extend RequestOnlyConnection's Omit with `onProgress` and `trace`, and update the set-difference pin's union in THE SAME EDIT -- declared in advance as ONE EDIT, because the pin goes red the instant the Omit changes, so a separate subtask for it would be a born-green RED.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "9c18681",
            message: "feat: judge the gate's completeness against an enumerated protocol",
            phase: "green",
          },
        ],
        notes: [
          "EXPECTED-RED: both members exist on the handle today, so all four probes compile clean and the regex finds nothing.",
          'RED OBSERVED AS PREDICTED AND FOR THE PREDICTED REASON: all four failed with `Received: ""` -- tsc emitted NO diagnostic at all, which is what a member that IS present looks like. A red carrying some OTHER diagnostic would have been a probe failing for a reason unrelated to the narrowing.',
          "GREEN in the declared one edit. 15 pass / 4 fail became 19 pass / 0 fail in test/notifications.test.ts.",
        ],
      },
      {
        test: "A type-level pin asserting `keyof ProtocolConnection` is EXACTLY the fifteen names read off vscode-languageserver-protocol 3.18.2's connection.d.ts, checked by the repo's own tsc --noEmit",
        implementation:
          "The enumeration is performed BY tsc against node_modules rather than by a human reading -- the union literal is the only recalled half, and any disagreement with the primary source is a TS2344 at that line.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "9c18681",
            message: "feat: judge the gate's completeness against an enumerated protocol",
            phase: "green",
          },
          {
            hash: "a62dccd",
            message: "docs: claim the pin's third limit -- it pins the type, not the value",
            phase: "refactoring",
          },
        ],
        notes: [
          "BORN-GREEN AND DECLARED AS SUCH: it is a claim about the dependency that already holds. Writing a deliberately wrong list first would manufacture a RED that proves nothing about the delivered artifact; the wrong list is the DISCRIMINATING CONTROL, run at authoring time.",
          "ONE COMMIT WITH SUBTASKS 1 AND 4 RATHER THAN ITS OWN, and this is a PLAN CORRECTION rather than a discovery, so it is recorded as one. Subtask 4's prose at src/notifications.ts REFERS TO THIS PIN -- `pinned in test/notifications.test.ts, checked by tsc against the dependency's own connection.d.ts`. Splitting the commits would have landed that sentence in a commit where the pin did not yet exist: a claim a file makes about the repo, false in the commit that wrote it, which is the exact failure the Sprint 22 rule names. The plan should have declared them one edit; it declared only the Omit and the set-difference pin.",
          "A MECHANISM NAMED INSIDE CRITERION 2 WAS MEASURED INSUFFICIENT FOR HALF OF ITS OWN PROPERTY, which is the Sprint 22 shape and the PO's own property-not-mechanism rule firing on their own verification text. It says `PIN THE SET DIFFERENCE so a member added by the dependency, OR a key added to the Omit, REDDENS`. The set difference CANNOT produce the first half at all: a member the dependency adds lands on both sides of the Exclude and cancels. MEASURED both ways -- A3 reddens the enumeration pin and NOT the difference; B5 reddens the difference and NOT the enumeration. The property was delivered; the mechanism the criterion named could only ever have delivered half of it, and following it literally would have shipped a green suite against the criterion's headline case.",
          "TWO PINS, NOT ONE, AND NEITHER SUBSTITUTES: the set difference `Exclude<keyof ProtocolConnection, keyof RequestOnlyConnection>` cancels a member the dependency adds, since it lands on BOTH sides; the enumeration has no RequestOnlyConnection in it, so a key added to the Omit leaves it untouched. MEASURED in both directions -- B5 reddens the difference pin and not the enumeration, A3 reddens the enumeration and not the difference.",
        ],
      },
      {
        test: "The perturbation set: four drop-one controls (one per Omit key), one add-a-key control, and THREE controls on the enumeration pin including one applied to the DEPENDENCY'S OWN .d.ts",
        implementation:
          "Each named by the ASSERTION it flips. PREDICTED BEFORE RUNNING, so `reddened its probes alone` cannot be reported falsely: each drop-one reddens ITS member's probes AND the set-difference pin, and no OTHER member's probes.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "EVERY PREDICTION HELD, AND THE ONE THAT MATTERED WAS THE ONE ABOUT THE PIN. Dropping `onNotification` reddens its three probes (direct, aliased, factory); `onUnhandledNotification`, `onProgress` and `trace` redden their two each; NO OTHER MEMBER'S PROBE MOVES IN ANY OF THE FOUR. So the four keys are INDEPENDENTLY defended and none passes another off, which is what P2 showed cannot be assumed. Each ALSO reddens the set-difference pin `BoundaryIsTheObservingMembers` with TS2344 -- predicted before running, because the removed set changed, and reporting `its probes alone` would have been false.",
          "THE CRITERION'S HEADLINE DIRECTION IS CONSTRUCTED, NOT ARGUED. Adding `onEverything(handler)` to ProtocolConnection in node_modules/vscode-languageserver-protocol/lib/common/connection.d.ts reddens the ENUMERATION pin `ProtocolConnectionHasTheseMembers` and NOTHING ELSE in tsc -- so `a member added by the dependency REDDENS` is MEASURED rather than reasoned. skipLibCheck does not blind it: the declaration is still read for `keyof`. Reverted from a byte copy taken first.",
          'THE OTHER TWO ENUMERATION CONTROLS, both at `ProtocolConnectionHasTheseMembers` and nothing else: dropping `| "listen"` from the union, and adding an `| "onNothing"` that is not on the interface. So the pin discriminates in BOTH directions, not merely against a shrinking dependency.',
          "THE SURPLUS-KEY CONTROL RE-RUN AT THE NEW WIDTH, reproducing Sprint 23's rather than being independent: appending `| \"sendNotification\"` to the Omit leaves ALL 347 TESTS GREEN and reddens the set-difference pin ALONE. The misspelling control also re-run -- `onUnhandledNotifcation` reddens that member's two probes plus the pin, and `Omit` silently accepts the key.",
          "TWO LIMITS THAT WERE REASONED ARE NOW MEASURED, because the pin's own docblock stated them as fact in a file whose standard is measured-or-reasoned. `A star-handler overload would redden nothing here`: adding `onRequest(handler: (method, ...params) => any)` to the dependency's interface leaves tsc AT EXIT 0 -- the limit is real, and it is the one whose falsity would have mattered most. And `adds, REMOVES or renames` rested on the add case alone: deleting `listen(): void;` reddens `ProtocolConnectionHasTheseMembers`, and also the `connection.listen()` call in src/server.ts, which really did lose a method it calls. A rename is those two at once and was not run separately.",
          "EVERY PERTURBATION ABOVE WAS RUN BY THE SAME PERSON WHO WROTE THE CODE. Single-observer sprint; the record is reproducible but unaudited, which is exactly the condition the Sprint 14 re-run item exists to repair at Review.",
        ],
      },
      {
        test: "Prose sweep: every sentence in src/notifications.ts and test/notifications.test.ts that this sprint falsifies, checked AGAINST ITS OWN FILE before the edit lands",
        implementation:
          "Rename the count-bearing symbol, name the members rather than counting them, and correct the trace claim measured false below.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "9c18681",
            message: "feat: judge the gate's completeness against an enumerated protocol",
            phase: "green",
          },
        ],
        notes: [
          "A MEASURED CLAIM IN src/notifications.ts IS FALSE, found by reading the dependency rather than the note: `traceReceivedNotification runs on the receive path whether or not a handler exists`, so trace `hands EVERY received notification` to the Tracer. MEASURED at vscode-jsonrpc 9.0.1 connection.js -- the third site is INSIDE `if (notificationHandler || starNotificationHandler)`, and the else branch fires unhandledNotificationEmitter with NO trace call. An unhandled non-cancel notification is NOT traced, so trace is not broader than onUnhandledNotification; it is COMPLEMENTARY to it. CHANGES NO SCOPE: the criterion names both members outright.",
          "TWO PBI-25 NOTES ARE NOW FALSE AND ARE FLAGGED RATHER THAN EDITED, since the PBI is not the executor's field -- the Sprint 21 precedent. Note 2 says trace `fires at THREE SITES whether or not a handler exists, so it sees EVERY received notification -- broader than either member closed so far`: measured false above, and it is COMPLEMENTARY rather than broader. Note 4 says `Nothing reddens if a future release adds an observing member`: TRUE AT FILING AND SUPERSEDED BY THE DELIVERY -- A3 measures that the enumeration pin does redden. Neither changes what was built; both would mislead a reader who cited them later.",
          "AND THE CORRECTED READING IS STRONGER FOR THIS SPRINT THAN THE FALSE ONE WAS: what puts `trace` in the Omit is ORDER, not breadth. traceReceivedNotification runs IMMEDIATELY BEFORE the registered handler is awaited, and this module's gate lives INSIDE that handler -- so a tracer sees a gated notification whatever the gate then decides. That is watching around the gate, which is the property being denied. The breadth claim was never what justified it.",
          "FOUR MORE CLAIMS CAUGHT ON THE SECOND PASS, all written THIS SPRINT and all about their own file, so the Sprint 22 rule fired four times inside the sprint that was warned about it. (1) `tsc says WHICH NAME MOVED` -- it does not; TS2344 on a boolean names the file and line only, and reading the two lists against each other is left to whoever it stops. (2) `all ELEVEN surviving members` and `THE OTHER EIGHT` -- true counts, replaced by names on the naming-over-counting clause. (3) `the permitted half of every probe` -- the entry-gate probes have no such half; narrowed to every NARROWED-CONNECTION probe. (4) `a config author is handed Tsudoi and RequestContext` -- src/types.ts exports more than those two, and the load-bearing claim is that it does NOT export this type, which is what it now says.",
          "THE COUNT-BEARING SYMBOL IS GONE: BoundaryIsExactlyTwoMembers became BoundaryIsTheObservingMembers, and `THE BOUNDARY ... IS EXACTLY TWO MEMBERS` became `the members named in the Omit above`. That sentence was TRUE WHEN WRITTEN and false one widening later, which is the clause's own demonstration and is now recorded beside it.",
          "THE PIN'S THIRD LIMIT, AND IT IS THE ONE NEAREST THE CRITERION'S OWN WORDS -- it was not on the plan and was nearly shipped unnamed. THIS PINS THE TYPE, AND THE VALUE IS WIDER THAN THE TYPE. MEASURED at vscode-languageserver-protocol 3.18.2's connection.js: createProtocolConnection returns createMessageConnection's result UNCHANGED, and MessageConnection declares `inspect` and `onUnhandledProgress`, which ProtocolConnection does not. THE SECOND OBSERVES INBOUND TRAFFIC -- at vscode-jsonrpc 9.0.1 connection.js:1261-1268 the library's own $/progress handler fires unhandledProgressEmitter for every progress notification whose token has no handler, and tsudoi registers NONE, so that is EVERY ONE. Off the type, off the pin, reachable only by a CAST: the deliberate-evasion class this module already accepts for `await import(...)` and for a wrapper, NOT the by-accident class the Omit closes. It is why the type's headline sentence is bounded to `on its type` and stops short of `nothing can observe traffic`.",
          "THE REMAINDER MEASUREMENT THE PROSE CLAIMS WAS ACTUALLY RUN, and CHECKED FOR DISCRIMINATION rather than trusted at exit 0: every surviving member driven through the four-key narrowing in one project exits 0, and appending an onProgress call to that same project exits 1 on TS2551. WHAT THE SUITE PERMANENTLY BACKS IS LESS, and the comment now says so in three tiers -- onRequest has a standing assertion, sendProgress and listen have INCIDENTAL coverage via src/, and the remaining eight have nothing executable at all.",
        ],
      },
    ],
    impediments: [],
    decisions: [],
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
