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
      id: "PBI-15",
      story: {
        role: "config author",
        capability: "answer from the workspace the editor actually opened",
        benefit:
          "paths they offer match the project the user is in, not wherever the editor happened to start",
      },
      acceptance_criteria: [
        {
          criterion: "A config author can read the workspace folders the client sent",
          verification:
            "Drive initialize with workspaceFolders and assert a config handler observes them. NEGATIVE CONTROL: driving initialize WITHOUT them must leave the same handler observing an empty list, never a fabricated root",
        },
        {
          criterion: "Absence is distinguishable from a workspace at /",
          verification:
            "The client sends no folders; assert the config observes an EMPTY ARRAY. MEASURED: the protocol has TWO absent states, undefined and null, and no config author should have to know that -- nor should absence be able to look like a present value. PROMOTED FROM HYGIENE TO LOAD-BEARING at Sprint 14 refinement: measurement made absence the LIKELY state for this stakeholder, whose only comparable server calls bare on_dir(), so this is the criterion carrying the PBI's honesty rather than a tidy edge case",
        },
        {
          criterion:
            "A config author is told once when no workspace is known, never left with silence",
          verification:
            "With no folders sent, assert the example REPORTS once -- and ONCE PER SESSION, not per request -- rather than silently producing nothing. NEGATIVE CONTROL: a source that yields no items when no root is known satisfies every content assertion while being indistinguishable from a working source in an empty project. This mirrors PBI-10's normalise-and-report exactly, and it is config-author code at ZERO LINES in src/",
        },
        {
          criterion: "The completion example gains its workspace-relative source",
          verification:
            "With a workspace folder set and cwd elsewhere, a relative-prefix completion carries workspace-rooted items resolving against that folder",
        },
      ],
      status: "ready",
      notes: [
        "THIS IS A PUBLIC-API ADDITION, never a convenience: package.json maps @atusy/tsudoi/types at src/types.ts, and that file states every exported name is public API because renaming one breaks configs we cannot see. Additive, so not breaking -- but permanent. First addition to the type surface in twelve sprints.",
        "MEASURED: rootPath and rootUri are BOTH DEPRECATED in vscode-languageserver-protocol@3.18.2; workspaceFolders is the only current source, optional and nullable. A criterion written against rootUri would be written against a deprecated field on arrival.",
        "MEASURED: cwd is NOT a substitute. nvim spawns the server with cwd = root_dir when a root is found and its OWN cwd when not, so cwd-as-workspace-root is exactly right when tested and silently wrong when it matters, with no signal from inside the config.",
        "Smallest honest shape (REASONED): readonly workspaceFolders: readonly WorkspaceFolder[], reusing the protocol's own type so the surface grows by one name. Plural is not hypothetical -- the field is an array on the wire, so any singular shape lies about it.",
        "STALENESS IS NOT FORECLOSABLE, and measurement killed the comfortable option: vim.lsp.buf.add_workspace_folder() produces workspace/didChangeWorkspaceFolders AND IT ARRIVES EVEN WHEN THE SERVER ADVERTISES capabilities: {} -- measured both ways. We cannot decline to receive it by declining to advertise, so `accepted documented limit` would document tsudoi ignoring a notification it is actually RECEIVING. Not hypothetical for this stakeholder, who already binds list_workspace_folders(). Handling it is PBI-17, filed rather than left as a note that would evaporate when this PBI closes.",
        "THE NAME IS NOT MORTGAGED: keep `workspaceFolders` and document the SNAPSHOT SEMANTICS at the type in src/types.ts -- it reflects initialize and does not track changes. `initialWorkspaceFolders` would be accurate today and WRONG the moment tracking lands, in a file whose own header says renaming an export breaks configs we cannot see. Documented-at-the-type is read by exactly the person who would be misled.",
        "MEASURED AT SPRINT 14 REFINEMENT, and it is why this refines to ready rather than waiting on the stakeholder: their nvim tree has ZERO tsudoi configuration today, and their only comparable custom server calls bare on_dir(), which a probe confirmed yields root_dir=nil, workspace_folders=nil and a server cwd that is NVIM'S OWN -- neither the document's directory nor any project root. When root_dir IS set, nvim sends workspaceFolders populated and correct. INFERENCE BOUNDARY, the Developer's own: that tsudoi WOULD be configured that way is REASONED from it being the only analogue, not measured; their denols and ts_ls set real roots.",
        "THE HARM CLASS IS SILENT ABSENCE, which is why the legibility criterion exists and why blocking was refused. Unlike the hoverProvider case this is not dead because WE failed to advertise -- the same code is live the moment root_dir is set. What is new versus PBI-8's registry route and PBI-14's typing-/ is that the config choice making it silent CAN BE NAMED IN ADVANCE. The surface is identical whichever way they configure, so their answer changes nothing about what gets built.",
        "SECOND DATA POINT for the same shape, from Sprint 13: src/server.ts's InitializeRequest handler takes NO params, so InsertReplaceEdit ships UNCONDITIONALLY -- LSP 3.16's completion.completionItem.insertReplaceSupport capability is unreadable from a config, exactly as workspaceFolders is. Two independent needs for the same discarded argument; whatever shape this PBI gives InitializeParams should be able to carry both, and the conformance gap is a KNOWN one, not an oversight.",
      ],
    },
    {
      id: "PBI-16",
      story: {
        role: "config author",
        capability: "copy the README's config snippet and have it type-check",
        benefit:
          "the first thing they copy does not greet them with an error, in a document whose selling point is that handlers are typed",
      },
      acceptance_criteria: [
        {
          criterion: "The README's config snippet type-checks in an installed consumer",
          verification:
            "Extract the snippet from README.md, place it in the installed-consumer project and run tsc. NEGATIVE CONTROL: introducing a type error in the snippet reddens it, which EXECUTION ALONE DOES NOT, since type stripping runs it regardless",
        },
      ],
      status: "draft",
      notes: [
        "FILED AT SPRINT 13 BY THE Q2 FILTER, on its first firing and for exactly what it was built to catch: a decision whose home was neither executable nor sited. It had lived as prose in Sprint 12's decisions since the sprint that found it, and the next compaction would have met it again.",
        "THE PO REVERSING THEIR OWN CLOSE-OUT REFUSAL, with the condition named: they declined a PBI then on the grounds that inventory nobody reaches is dishonest -- true of an EMPTY BACKLOG, false now that PBI-14 and PBI-15 are live. The means exists (installConsumer.typeCheck); the alternative to filing is evaporation.",
        "Ordered AFTER PBI-15: capability before verification-hardening, the same reasoning that put PBI-9 last.",
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
      ],
      status: "draft",
      notes: [
        "FILED AT SPRINT 14 REFINEMENT rather than left as a note on PBI-15, which would evaporate when PBI-15 closes -- the orphan trap the lifetime rule exists to prevent. Ordered LAST: PBI-15 delivers the capability, this hardens it.",
        "MEASURED: the notification arrives whether or not the server advertises workspace.workspaceFolders.changeNotifications -- tested against capabilities: {} and against full advertisement, both received. So this is not a feature we opt into; it is one we currently ignore.",
        "MEASURED, and it bounds the urgency: an unhandled notification is SILENT and INERT -- zero stderr bytes on both runtimes, session functional afterwards, exit 0. Nobody is being harmed by noise today. Recorded at src/server.ts's logger, because the natural inference from Sprint 4 -- the logger surfaces notification problems -- is FALSE for a notification with no handler, which never reaches the logger at all.",
      ],
    },
  ],

  completed: [
    {
      number: 13,
      pbi_id: "PBI-14",
      goal: "Give a config author a path completion that knows which root it is answering from -- so the item they pick inserts the path they meant, from the root they meant.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 3222fb0, 94e46c0, c0db79e, 771b319, 4a1bdfa, 258f726, 7c97fe7, f18159e, 43fca61, 8932b45, b78fd74, af48333, fbdf474, 55fa0d9, 1d214aa, plus structural 4fe716c. 258 tests green under both runtimes, ZERO LINES IN src/ across the whole sprint. Per-subtask records and 14 perturbation notes compacted here; git retains them.",
        "COMPACTED AT CLOSE under the PO's Q2 filter, which surfaces only drops whose home is NOT a permanent assertion, a comment at the site it constrains, or an active improvement. Fifteen decisions dropped, every one of them sited, and the four I was least sure of were CHECKED BY READING THE CODE rather than recalled: the opendir cross-runtime difference at examples/path-completion.ts:358, the detail-versus-label carrier at :269 with the enableMatchLabel tension at :277, per-segment foreclosure at :118, and the dedup attribution weakness at :440. The unruled-behaviour list is at test/path-completion.test.ts:29 and :204. PBI-14 leaves the backlog done, and each criterion's ruling lives in the test that verifies it. THE TWO NOTES I HAD KEPT FOR WANT OF A HOME BOTH HAD ONE, found by checking the two places the PO named rather than by my recalling that they did not: reachability is disclaimed in the example's own prose at examples/tsudoi.config.ts:56 -- `nothing here should be read as a promise that it does` -- and the narrow deno flag set is the README's historical claim pinned by readme.test.ts's permissionsFact, extended in the same commit to say the flags served a real path COMPLETION and not only the handshake, which is what Sprint 13 measured. A completed sprint's record is not a durable home; it is what the next compaction meets, which is how the type-check gap became PBI-16.",
        "SCOPE, from the stakeholder directly: parity with ddc-source-file is NOT a criterion -- `置き換える予定だけど、いったん要求したものができてればいい`. The replacement intent is context, and it is why the document-relative and absolute sources are load-bearing rather than decorative; increments come later.",
        "FOR THE STAKEHOLDER, not work for us: their ddc file source carries forceCompletionPattern \\S/\\S* and their lsp source does not include /, so THE THING THAT FORCE-OPENS THE POPUP ON A PATH FRAGMENT TODAY IS THE SOURCE THEY PLAN TO REMOVE. A config change on their side, reported rather than planned around.",
        'WHAT IS DELIBERATELY NOT BUILT, so nobody reads its absence as an oversight: no trailing `/` on a directory item (the user types it); `~` is not expanded; a quoted path such as `"./ba` does not complete, because a quote is not a fragment boundary; and hidden entries and ./ ../ are UNRULED and remain so -- the fixtures contain none, and no test pins either way.',
        "ACCEPTED WITH FOUR RULINGS, two of which NARROWED criteria to what was verified rather than adding to delivered work -- the PO drew that line explicitly: narrowing to what holds is the criterion-verification rule, widening is goalpost-moving. Criterion 3(b) had described a state per-segment completion makes IMPOSSIBLE, which the PO called worse than a vacuous criterion since it cannot even be exercised. Criterion 11's replace-range shortfall is recorded as a DEFECT DEFERRED, never a limit, because a mangled insertion is the exact harm the range criterion prevents.",
      ],
    },
    {
      number: 12,
      pbi_id: "PBI-8",
      goal: "Make eleven sprints reachable by someone who was not here -- a README whose own bytes are what the suite runs, so the instructions cannot drift from the product.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in f6cb1aa, 7b8b15e, 95fd3dd, 3397dda, b62d295, 01963af, 6bc5229, plus d4cb846 across 7 subtasks. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "COMPACTED AT SPRINT 13, every dropped decision named with the durable home it went to, per the Sprint 9 rule. The three conjunction/zero-match vacuity records -- the planned removal control that cannot fail, statesFact is a conjunction, an extractor that finds nothing passes -- are generalised in the negative-control-at-refinement improvement (a criterion no change can redden is VACUOUS), and CHECKED AGAINST THE SUITE rather than recalled: test/readme.test.ts:252 asserts each fact has exactly one home section, and extractQuickstart THROWS on a zero or short match with its count asserted at :31, so the extractor cannot pass by finding nothing. An earlier draft of this record credited Sprint 11's NOT-CONSTRUCTED classification, which is about UNBUILDABLE PERTURBATIONS and does not cover conjunction vacuity. The -A flag hedge and the unnamed cold-cache prerequisite are README facts pinned by that same suite. The installConsumer deviation carries its reason at its site. The one-runtime sweep's licence is Sprint 10's measured route-identity, recorded there.",
        "THE BARENESS REFRAME, kept because nothing else carries it: the sweep's function is not NECESSITY (no documented step is useless) but proving THE ENVIRONMENT IS BARE. Criterion 1 delivers sufficiency -- nothing undocumented is required -- ONLY if the staged environment supplies nothing the README asks the reader to do; otherwise it is a test of the harness.",
        "COST OBJECTION OVERRULED ON AN ASYMMETRY: a README that omits a required step is WORSE THAN NO README -- a reader follows it, fails, and concludes the product is broken. Omission arrives at birth where staleness needs time. Extraction catches stale; only the sweep catches incomplete.",
        "NOT CONSTRUCTED, not foreclosed, and still open: the README's config snippet is EXECUTED but never TYPE-CHECKED -- a type error runs fine under type stripping and would greet a reader running tsc. installConsumer.typeCheck would do it; this was scope.",
      ],
    },
    {
      number: 10,
      pbi_id: "PBI-13",
      goal: "Make the cross-runtime promise survive distribution: a Deno user obtains tsudoi the stated way and it starts, without Bun losing the route it already has.",
      status: "done",
      subtasks: [],
      impediments: [
        {
          description:
            "The stated route's FIRST line -- how a user obtains the package -- is verified from a local tarball, not from npm. `bun add @atusy/tsudoi` and `deno add npm:@atusy/tsudoi` cannot be run against a package that has never been published, and publishing needs an account and is irreversible.",
          impact:
            "PBI-13's criteria are met for everything after the install: the same artifact, the same install command shape and the same entry point serve both runtimes. What is NOT verified is that the registry hands a user this tarball -- the metric says `from an installed package`, and installed-from-a-tarball is the closest a developer can get without a human decision.",
          request:
            "Decide whether to publish 0.0.x to npm so the obtain half can be verified, and provide the account if so. Until then nothing in this repo may claim the registry route works; test/installed-runtime.test.ts marks it NOT VERIFIED in the same comment that states it.",
          status: "waiting_human",
          notes: [
            "Not raised as an impediment during the sprint because it blocked nothing: the remedy, the build and both runtimes were all verifiable without it. It is recorded now so the PO sees the one edge of the route the suite does not reach.",
          ],
        },
      ],
      decisions: [],
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
            "A PLAN INSTRUCTION STATES THE PROPERTY TO ESTABLISH, NOT THE MECHANISM TO USE. Where it must name a mechanism, it says whether the mechanism was MEASURED to produce the property.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed by the Scrum Master against their own conduct, at the PO's ruling that `the Developer will catch it` fails the Sprint 2 standard -- it makes correctness depend on someone downstream remembering to look, and the piped-exit-code defect shows how slowly that works when they do not: nine sprints.",
        },
      ],
    },
    {
      sprint: 12,
      improvements: [
        {
          action: "A PLAN MAY NOT SUBSTITUTE A PROXY FOR A CRITERION'S PROPERTY.",
          timing: "immediate",
          status: "active",
          outcome:
            "One layer below the checklist-versus-criterion drift: there the reviewer's thinking runs ahead of the criterion; here the plan converts a criterion into an implementation recipe and the recipe silently becomes the real acceptance test.",
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
        {
          action:
            "PREFER SPLITTING OVER DOCUMENTING: when a perturbation would flip at an earlier assertion than the sub-claim it targets, that is a signal the test BUNDLES independent sub-claims.",
          timing: "immediate",
          status: "active",
          outcome:
            "Better than covered -- it DISSOLVES what the earlier-assertion clause only documents.",
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
            "CONSOLIDATED, replacing the manufactured-RED rule and its three amendments: anything not perturbed is assumed unproven; every subtask declares expected-RED or born-green; every perturbation is named by the ASSERTION it flips, not by the subtask it belongs to -- and if it flips at an EARLIER assertion than the subtask's headline claim, that headline claim is still undefended and needs its own perturbation.",
          timing: "immediate",
          status: "active",
          outcome:
            "Amended three times already, which is its own signal: a rule list nobody can hold in their head stops being applied at exactly the moment it is needed.",
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
