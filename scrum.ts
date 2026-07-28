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
      id: "PBI-16",
      story: {
        role: "config author",
        capability:
          "copy an artifact this repository publishes and have it type-check against what actually ships",
        benefit: "the first thing they copy does not fail in their project while passing in ours",
      },
      acceptance_criteria: [
        {
          criterion:
            "The README's snippet AND examples/tsudoi.config.ts type-check in an installed consumer, resolving through the PUBLISHED arm",
          verification:
            "Extract the snippet from README.md's OWN BYTES and place it, and the example, in the installed-consumer project; run tsc there. TWO NEGATIVE CONTROLS: a type error in the README reddens it, which EXECUTION ALONE DOES NOT since type stripping runs it regardless; and pointing the check at IN-REPO sources satisfies nothing, because that is exactly what tsc --noEmit already does",
        },
      ],
      status: "ready",
      notes: [
        "RESIZED AT SPRINT 15 REFINEMENT BY A MEASUREMENT NOBODY ASKED FOR, and the hole is not the one this was filed for: PBI-9's installed-consumer check calls typeCheckProbe from ONE test and passes SYNTHETIC probe sources only, so examples/ is checked solely by the repo's own tsc --noEmit -- which resolves @atusy/tsudoi/types through the IN-REPO `default` arm and NEVER through the published dist/types.d.ts. Sprint 9's failure class exactly: resolves in-repo, not through what ships, everything green. The snippet was the smaller half, and the example costs ONE more probe source in a mechanism that already exists.",
        "MEASURED, so the compile half is not the gap: the README's snippet type-checks CLEAN against the current surface, with the checker shown capable of failing -- perturbing context.tsudoi.documents to notAThing yields TS2339. Sprint 14's additions were additive and landed where the snippet does not look.",
        "THE RESEMBLANCE GAP IS DESIGN, NOT DEFECT, and gets no item: the snippet is a minimal starter, the example is the fuller one, and the README says so. What may be STALE is the README's own DESCRIPTION of the example -- `streaming completion, hover, and a finally that documents when it runs`, written before path completion existed and NOT VERIFIED. Check it as part of this PBI rather than asserting it is fine.",
        "THE PO NAMING THEIR OWN INSTRUMENT'S WEAKNESS rather than glossing it: a note is exactly what let the Sprint 13 prose defect ship for a sprint. Chosen anyway, because documentation accuracy is not testable without the claim-extraction mechanism declined twice, and the standing prose-reporting item is the backstop. IF IT FAILS AGAIN the trigger has fired twice and the mechanism gets reconsidered rather than the note.",
        "FILED AT SPRINT 13 BY THE Q2 FILTER, on its first firing and for exactly what it was built to catch: a decision whose home was neither executable nor sited. It had lived as prose in Sprint 12's decisions since the sprint that found it, and the next compaction would have met it again.",
        "THE PO REVERSING THEIR OWN CLOSE-OUT REFUSAL, with the condition named: they declined a PBI then on the grounds that inventory nobody reaches is dishonest -- true of an EMPTY BACKLOG, false now that PBI-14 and PBI-15 are live. The means exists (installConsumer.typeCheck); the alternative to filing is evaporation.",
        "ORDER HELD AT SPRINT 15 REFINEMENT ON EVIDENCE RATHER THAN SIZE: PBI-17's value is CONTINGENT on a config choice Sprint 14 measured the stakeholder has not made -- with the bare on_dir() their only comparable server uses, no folders are sent and the workspace source is inactive for them. This one helps any reader unconditionally.",
        "CHECKED, NOT REASONED, because the PBI was filed before Sprint 14 touched the example it points at: README.md:77-90 is HOVER-ONLY -- context.tsudoi.documents and nothing else -- so the workspace source and the once-per-session report, which live in examples/, did not drift into it. This PBI is the CHECK, not the check plus a rewrite.",
        "A NOTE AND DELIBERATELY NOT A CRITERION, put here so whoever is in that file sees it: README.md:97 says `@atusy/tsudoi/types is the only import a config needs`, which is true read as `the only import FROM TSUDOI` and false read as `the only import at all` -- install.ts:168-174 records that the example imports node: modules to read the filesystem. Ambiguous rather than plainly wrong, so it does not bind a sprint.",
      ],
    },
    {
      id: "PBI-17",
      story: {
        role: "config author",
        capability: "answer from the workspace as it is now, not as it was at startup",
        benefit:
          "adding a folder mid-session changes what they are offered, instead of leaving them with a root the editor no longer considers current",
      },
      acceptance_criteria: [
        {
          criterion: "A folder added after initialize is observable by a config handler",
          verification:
            "Drive initialize with one folder, send workspace/didChangeWorkspaceFolders adding a second, and assert a handler observes BOTH. NEGATIVE CONTROL: a snapshot captured at initialize observes only the first",
        },
        {
          criterion: "A folder removed after initialize stops being observable",
          verification:
            "Remove one of two and assert the handler observes the survivor ALONE. Named separately because an implementation that only appends passes the added case and fails this one",
        },
        {
          criterion:
            "A folder change arriving before initialize or after shutdown does not mutate the folder list",
          verification:
            "Send the notification outside the initialized window and assert the list is unchanged, then assert a normal change still applies. NEGATIVE CONTROL: a handler that mutates WITHOUT consulting the gate passes a test that only sends the notification in the normal window -- which is every test anyone would write first",
        },
      ],
      status: "draft",
      notes: [
        "THE CARRIER STAYS RequestContext, and the Sprint 14 foreclosure was NEVER ABOUT STALENESS -- recorded so nobody infers it was snapshot-specific and reopens it. It was that a FACTORY-TIME READ IS EMPTY because the factory runs before initialize, which tracking does not change. A live object on Tsudoi would buy only what RequestContext already gives per request, at the cost of reopening the trap.",
        "THE GATE IS OPT-IN PER HANDLER, which is why the lifecycle criterion exists: src/server.ts records that it is consulted by the handlers tsudoi REGISTERED, so a new mutating handler can simply not consult it and pass every test that sends the notification in the normal window. This is the FIRST notification with state to mutate, and the first place that opt-in can bite. THE src/types.ts COMMENT IS PART OF THIS DELIVERABLE, not a follow-up: it currently PROMISES no tracking and names who must edit it. Landing tracking without updating it in the same commit puts a FALSE STATEMENT IN A DURABLE HOME -- the Sprint 13 prose defect, one sprint after the standing item against exactly that.",
        "FILED AT SPRINT 14 REFINEMENT rather than left as a note on PBI-15, which would evaporate when PBI-15 closes -- the orphan trap the lifetime rule exists to prevent. Ordered LAST: PBI-15 delivers the capability, this hardens it.",
        "MEASURED: the notification arrives whether or not the server advertises workspace.workspaceFolders.changeNotifications -- tested against capabilities: {} and against full advertisement, both received. So this is not a feature we opt into; it is one we currently ignore.",
        "MEASURED, and it bounds the urgency: an unhandled notification is SILENT and INERT -- zero stderr bytes on both runtimes, session functional afterwards, exit 0. Nobody is being harmed by noise today. Recorded at src/server.ts's logger, because the natural inference from Sprint 4 -- the logger surfaces notification problems -- is FALSE for a notification with no handler, which never reaches the logger at all.",
      ],
    },
    {
      id: "PBI-18",
      story: {
        role: "tsudoi maintainer",
        capability: "add a notification handler without being able to forget the lifecycle gate",
        benefit:
          "a handler that mutates state after shutdown becomes unwritable rather than merely untested",
      },
      acceptance_criteria: [
        {
          criterion: "A notification refused by the lifecycle reaches no handler, whoever wrote it",
          verification:
            "Gate notifications in ONE place and assert a handler that does NOT consult the gate itself is still refused outside the initialized window. NEGATIVE CONTROL: today's shape passes this only because each handler remembers -- delete the check from any one handler body and nothing reddens",
        },
        {
          criterion: "exit survives the gate, in EVERY state rather than the one already tested",
          verification:
            "exit before initialize AND exit after shutdown both still exit, with the codes PBI-10 and Sprint 3 pinned. THE PO CORRECTING THEIR OWN REASONING: PBI-10 covers exit BEFORE initialize only, so a blanket gate could get the carve-out wrong in ways that test never reaches -- this criterion exists because inheriting someone else's coverage is what would hide it",
        },
      ],
      status: "draft",
      notes: [
        "MEASURED, and it is the argument rather than a motivation: acceptsNotification() is called INSIDE each handler body -- three hand-written copies of the same two lines -- while requests are gated STRUCTURALLY in one place, at registerMethods. One side enforced, the other convention. WHAT MAKES IT URGENT RATHER THAN TIDY: PBI-17 introduces THE FIRST STATE WITH TWO WRITERS ON TWO GATING PATHS -- workspaceFolders is written by the initialize REQUEST handler and would be written again by a NOTIFICATION handler. Every notification today is inert or delegates to the document store, which no request handler writes.",
        "WHY THREE IS THE NUMBER, and why this is NOT the framework class the PO twice refused: PBI-3's capability derivation and PBI-10's validation seam were frameworks justified by ONE call site. There are three here and PBI-17 makes a fourth. Three is where convention stops being cheaper than structure. DECLINED AS A BUNDLE, NOT ON MERIT: PBI-17 needs only its own handler to consult the gate, so this is strictly more than PBI-17 requires -- which is the definition of separate scope. Writing a fourth hand-written copy that this item then removes is a real if small waste, and two lines of waste beats a shared-surface change landing inside a PBI about workspace folders.",
      ],
    },
  ],

  completed: [
    {
      number: 14,
      pbi_id: "PBI-15",
      goal: "Let a config author answer from the workspace the editor actually opened -- and, when the editor opened none, say so once instead of going quiet.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in daff31a, 7a89e1d, ecdcd05, b72ba2c, f689b94, 905ef7c, 8a5bd06, 7ed3483, plus 587adfb after acceptance. 272 tests green under both runtimes; each DoD command run separately with its exit read directly.",
        "SINGLE-OBSERVER SPRINT, disclosed by the Scrum Master before the verdict and weighed by the PO rather than smoothed over: the execution agent was stopped mid-subtask-4 and the facilitator continued the work themselves, so every perturbation from that point has one observer who is also its author -- weaker than fourteen sprints of standard. ACCEPTED because the perturbations are REPRODUCIBLE: auditable though unaudited. The remedy is an active improvement, not a note. THE PO VERIFIED THE STRUCTURAL CLAIMS THEMSELVES against the artifacts -- Tsudoi unchanged with documents alone, RequestContext carrying workspaceFolders -- and separated what they could confirm from what they could not. They then caught their OWN coverage-rule failure in the same read: they concluded from a grep they KNEW was truncated that the ordering constraint was missing from src/cli.ts, where it has been since e80b930. Asserting absence from a knowingly-limited search, named as a worse shape than misremembering.",
        "COMPACTED AT SPRINT 15. SPRINT 13'S RECORD DROPPED, every decision of it sited and named there before it went -- criteria and tests for the rulings, examples/path-completion.ts:358 :269 :277 :118 :440 for the measurements, test/path-completion.test.ts:29 :204 for the unruled list, and the example's own prose at tsudoi.config.ts:56 for reachability. THIS SPRINT'S stale-textEdit-prose record is superseded by the fix and by the standing prose-reporting improvement it produced. TWO INCREMENT CANDIDATES survive because one is still open, and the second came FROM THE STAKEHOLDER'S OWN READING of the sprint's output. (a) A workspace folder whose URI names no local path is skipped SILENTLY -- the same silent-absence harm this sprint answers elsewhere, with the once-per-session machinery already there to use; recorded at the skip site. (b) Sweep for other free-`string` fields whose values the code branches on, after PathSource.name became a closed union: type-level foreclosure for a class that was held together by care.",
        "NOT CONSTRUCTED, and what remains at risk: the once-per-session flag is module state, so a config importing the module twice would report twice. No route to a double import exists today and nothing asserts it.",
        "REPORTED AT REVIEW AND NOT SOFTENED: criterion 1 is verified SYNTHETICALLY -- no real editor was driven. The config choice that makes it live is a real root_dir/root_markers; with the bare on_dir() this stakeholder's only comparable server uses, their client declares workspace-folder support and sends none, so the workspace source will be INACTIVE for them and the once-per-session report is what they will actually see.",
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
    number: 15,
    pbi_id: "PBI-16",
    goal: "Make what this repository publishes type-check as a stranger receives it -- so an artifact that passes here cannot fail in their project.",
    status: "in_progress",
    subtasks: [
      {
        test: "The README's snippet, extracted from its own bytes, type-checks in an installed consumer",
        implementation:
          "One typeCheck(files) call through the PUBLISHED arm. Assert a NON-ZERO extraction count FIRST: an extractor that finds nothing passes everything after it, which is the vacuity mode Sprint 12 met twice.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "BORN GREEN, declared rather than dressed with a fictional RED: every artifact already compiles, measured twice -- the snippet in-repo and the example in a real consumer -- so what is missing is the CHECK, not a fix, and ALL the value is in the controls below. A verification PBI like PBI-9. SHARED IMPLEMENTATION MOMENT with subtask 2, also declared at planning: two probe sources into one typeCheck(files) call is ONE change wearing two names.",
        ],
      },
      {
        test: "examples/tsudoi.config.ts and path-completion.ts type-check the same way",
        implementation:
          "The same call, two more probe sources. Born green, same moment as subtask 1.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "Each artifact can redden ALONE",
        implementation:
          "A type error in the snippet must not be maskable by the example, or the reverse.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE HAZARD IS BAKED IN BY THE SHARED MOMENT: one call over several sources means a single failure may not identify its source. That is why this is a subtask rather than a hope.",
        ],
      },
      {
        test: "The PUBLISHED arm is what is exercised, not the in-repo one again",
        implementation:
          "THE CONTROL THAT PROVES THE PBI DID ITS JOB, and the PAIR is the whole point: perturbing the published types must REDDEN the probe WHILE `tsc --noEmit` STAYS GREEN. Also assert the converse -- pointing the check at in-repo sources satisfies nothing, since that is exactly what tsc --noEmit already does.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "Without the stays-green half this is `checked again` wearing the words `checked through the published arm`.",
        ],
      },
      {
        test: "The hoisting precondition is ASSERTED, and its blast radius reported",
        implementation:
          "THE MECHANISM IS THE NESTED LAYOUT, corrected before anything was built because the blunt version FIRES FOR THE WRONG CAUSE: removing node_modules/vscode-languageserver-protocol outright fails even a BARE config, since it also removes TSUDOI'S OWN DECLARED DEPENDENCY -- a control that reddens by breaking the package and would have been recorded as proof the precondition was asserted. Keep it reachable FROM TSUDOI (nested under node_modules/@atusy/tsudoi/node_modules/) and unreachable from the consumer root, which is what pnpm default and npm-strict produce; the example probe must redden and a bare config must not. REMEDY RULED A: the README instructs installing the package, so the POSITIVE case is the documented setup and the nested layout WITHOUT it is the deliberate NEGATIVE one. Not C -- a peerDependency would declare MANDATORY what measurement shows is CONDITIONAL, since a bare config exits 0 and the artifact a reader meets first needs nothing from that package; overstating a requirement is the same class of error as understating it. Not B -- inlining 19/17 for CompletionItemKind contradicts the stakeholder's own closed-union request one sprint earlier. A IS ADEQUATE HERE FOR A NAMED REASON, refining the prose-is-weak rule rather than excepting it: DOCUMENTATION SUFFICES WHEN THE FAILURE IT GUARDS ANNOUNCES ITSELF AND NAMES ITS OWN REMEDY -- TS2307 naming the module at a named line, and at runtime PBI-1's own config-load taxonomy. THE TRIGGER FOR REVISITING C is this failure ever presenting silently or misleadingly. VERSION SKEW is the real peer-dependency argument and is UNMEASURED: a consumer on a different major could produce structurally incompatible CompletionItem types across the boundary, which neither A nor B addresses -- recorded so it reads as declined rather than unconsidered. REPORT WHAT ELSE REDDENS: the example imports it as a BARE SPECIFIER THE CONSUMER NEVER DECLARES, and it resolves today only because bun HOISTS it as a transitive dependency of @atusy/tsudoi. Under pnpm's default or npm with strict resolution it fails, LOOKING LIKE A TYPE ERROR.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "IN SCOPE BECAUSE IT FALSIFIES THIS PBI'S OWN STORY: `type-check against what actually ships` is what a criterion passing only under a hoisting installer would be green about and wrong about. Second widening in two turns, and the PO named it as such -- the first found the real hole, this names the condition under which even that check lies.",
          "MEASURED, ANSWERING THE PO'S QUESTION: CompletionItemKind IS a value import -- examples/path-completion.ts:22 takes it without `type` and uses it at four sites -- so the example needs the package AT RUNTIME. RADIUS BOUNDED IN BOTH DIRECTIONS: tsudoi itself is NOT at risk, because vlp is a DECLARED dependency of @atusy/tsudoi that every correct installer resolves, so PBI-13's CLI-starts claim survives; but PBI-13's EXAMPLE-RUNNING assertions rest on the assumption. Under the nested layout both runtimes exit 1 with TS2307, and the runtime failure surfaces as `tsudoi: failed to load config` -- diagnosed through PBI-1's taxonomy rather than crashing.",
        ],
      },
      {
        test: "N/A (prose, in the same commit as the criterion it belongs to)",
        implementation:
          "The README gains the install instruction a copying reader needs, and its drift sentence -- `The test suite runs those files themselves, so they cannot drift from what tsudoi does` -- gains its TYPE-CHECKING half. Literally true about running, and adjacent to the very claim this PBI exists to make true.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [
          "THE PBI-13 CONSEQUENCE IS ACTIONABLE HERE AND MUST NOT BECOME A NOTE: if the README documents installing the package, the INSTALLED-CONSUMER PROBES INSTALL IT TOO, so the documented route and the verified route converge again and test/installed-runtime.test.ts stops resting on a hoisting assumption. SAME TREATMENT AS PBI-17'S TYPE COMMENT: a claim that becomes true BECAUSE OF THIS WORK is part of this work, never a follow-up. Found by the Developer reading the file, one sentence past where the PO's note pointed -- the standing prose item working one sprint after it was filed.",
        ],
      },
    ],
    impediments: [
      {
        description:
          "CARRIED FORWARD FROM SPRINT 10 rather than evaporating with its record, and LIVE FOR THIS SPRINT: PBI-16 type-checks against a PACKED TARBALL, which is `what ships` in every sense except the one a stranger uses. The stated route's FIRST line -- how a user obtains the package -- is verified from a local tarball, not from npm. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package that has never been published, and publishing needs an account and is irreversible.",
        impact:
          "PBI-13's criteria are met for everything after the install: the same artifact, the same install command shape and the same entry point serve both runtimes. What is NOT verified is that the registry hands a user this tarball -- the metric says `from an installed package`, and installed-from-a-tarball is the closest a developer can get without a human decision.",
        request:
          "Decide whether to publish 0.0.x to npm so the obtain half can be verified, and provide the account if so. Until then nothing in this repo may claim the registry route works; test/installed-runtime.test.ts marks it NOT VERIFIED in the same comment that states it.",
        status: "waiting_human",
        notes: [],
      },
    ],
    decisions: [
      "THE RE-RUN IMPROVEMENT FIRED ON ITS FIRST OUTING AND CORRECTED THE FACILITATOR. The Developer independently reproduced Sprint 14's keep-only-the-first-folder perturbation -- baseline 14 pass, perturbed 12 pass 2 fail at test/workspace.test.ts:287 under both runtimes, restored clean -- and corrected `2 assertions` to 2 FAILING TESTS. Same magnitude in a unit that SOUNDS STRONGER, which is the direction least likely to be questioned. Flagged because inheriting the first observer's phrasing would defeat the point of a second observer. BORN GREEN IS A REPORTING EXPECTATION HERE, not an omission: the Review states it so the absence of expected-REDs reads as honesty.",
    ],
  },
  retrospectives: [
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
            "The remedy for a single-observer sprint, and it works because the perturbations are REPRODUCIBLE even when they were not independently observed -- the record was auditable though unaudited, which is what item-by-item reporting was built to produce. Costs almost nothing and restores a second observer retroactively for at least one claim.",
        },
      ],
    },
    {
      sprint: 13,
      improvements: [
        {
          action:
            "A claim about WHAT THE SUITE COVERS is checked against the suite before it is recorded. Recalled coverage is not coverage.",
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
            "MERGED AT SPRINT 14 from two statements of one rule, nothing dropped. S12: the plan converts a criterion into an implementation recipe and the recipe silently becomes the real acceptance test -- one layer below checklist-versus-criterion drift, where the reviewer's thinking runs ahead of the criterion. S13: filed by the Scrum Master against their own conduct, at the PO's ruling that `the Developer will catch it` fails the Sprint 2 standard, since it makes correctness depend on someone downstream remembering to look -- and the piped-exit-code defect shows how slowly that works when they do: nine sprints.",
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
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction. Filed after the Scrum Master raised the compaction half about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record. MERGED AT SPRINT 13, nothing dropped: absorbs the route-to-a-PBI sharpening (S9) and the machine-formatted-file corollary (S10), which were three statements of one rule.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME, written into its `verification` TEXT: name the change that would make it fail, check that the verification can DISCRIMINATE the property claimed, and check that nothing else in the record contradicts it. If no change would make it fail, the criterion is VACUOUS and must be rewritten before it binds.",
          timing: "immediate",
          status: "active",
          outcome:
            "MERGED AT SPRINT 13 from three statements of one rule, nothing dropped. S9: the absence-pairing rule moved from assertions to criteria and from execution to refinement. S10: the verification field travels with the criterion through every compaction, where a plan evaporates at Review -- so the control lives there, not in the plan's perturbations. S10: PBI-7's criterion 1 was a runtime test for a compile-time property contradicted by its own note, and criterion 3's verification was contradicted by the PO's own planning instruction.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies.",
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
          action: "A plan must declare which subtasks share ONE IMPLEMENTATION MOMENT.",
          timing: "immediate",
          status: "active",
          outcome:
            "Sprint 5's subtasks 5-7 were planned expected-RED and came out born green: one async generator cannot be dispatched twice.",
        },
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
            "Nine items where three carried new information diluted the signal the item-by-item rule exists to protect.",
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
            "A note addressed to a PBI other than the one it sits on must be written onto THAT PBI when the note is created, not left to be rescued at compaction.",
          timing: "sprint",
          status: "active",
          outcome:
            "First application found a real orphan immediately: PBI-2 said 'PBI-3 and PBI-4 widen it again', PBI-3 carried its copy, PBI-4 carried nothing.",
        },
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
      improvements: [
        {
          action:
            "The PO's acceptance checklist is issued at Sprint PLANNING, not at Review, so the plan can target it.",
          timing: "sprint",
          status: "active",
          outcome: null,
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
