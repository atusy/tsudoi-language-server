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
      id: "PBI-14",
      story: {
        role: "config author",
        capability: "complete a path from the roots that make sense where their cursor is",
        benefit: "they type a path fragment and get the file they meant, not a file listing",
      },
      acceptance_criteria: [
        {
          criterion:
            "An item's inserted text, resolved against its source's root, yields the file the item names",
          verification:
            "For each source -- document-relative, cwd-relative, absolute -- resolve the item's inserted text against that source's root and compare to the real path. NEGATIVE CONTROL: an item carrying an absolute path where its source is a named root, or a relative path where the source IS the filesystem root, fails to resolve",
        },
        {
          criterion: "The typed prefix selects the source class",
          verification:
            "A prefix beginning with / is answered by the ABSOLUTE source alone; everything else by the relative sources. With cwd set to a directory that HAS CHILDREN OF ITS OWN, typing / yields filesystem-root items AND NO cwd-relative items -- the negative half is the discriminator, since without it an implementation where every source answers every keystroke passes",
        },
        {
          criterion: "Items with identical inserted text collapse to one",
          verification:
            "Drive a case where two sources resolve to the same directory -- MEASURED: nvim spawns the server with cwd = root_dir, so cwd and workspaceFolder coincide -- and assert one item, not two. Dedup is by INSERTED TEXT, not by resolved file, which would force an arbitrary choice of which root to label it with",
        },
        {
          criterion: "Each item is attributable to the source that produced it",
          verification:
            "Assert per source rather than over the merged list. NEGATIVE CONTROL: source 4 MASKS source 1's degenerate case -- an unnamed document sends uri file://, which fileURLToPath turns into / without throwing, so a broken source 1 falling back to / is indistinguishable from source 4's legitimate output unless attribution is asserted",
        },
        {
          criterion:
            "A document with no parent directory contributes nothing from the document-relative source",
          verification:
            "Drive completion for uri file:// and for untitled:; assert no document-relative items and that the request still answers. The guard is `an unnamed document has no parent`, NEVER `reject / as a root` -- / is the LEGITIMATE root for the absolute source, and the two degenerate URIs fail in OPPOSITE directions: file:// silently resolves, untitled: throws",
        },
        {
          criterion: "The walk yields rather than collecting",
          verification:
            "Assert one $/progress per yielded batch with a partialResultToken present. NEGATIVE CONTROL: a module that collects the whole tree then returns passes every content assertion while discarding the streaming property four sprints were spent on",
        },
        {
          criterion: "Directories are distinguishable from files",
          verification:
            "Assert CompletionItemKind.Folder versus .File. NEGATIVE CONTROL: a wrong kind still completes and still displays, so nothing but the assertion catches it",
        },
        {
          criterion: "A user can tell which root produced an item without resolving it themselves",
          verification:
            "Assert the item names its source root. Dedup-by-inserted-text leaves distinct strings, but src/foo.ts from cwd and ../src/foo.ts from the document's parent look unrelated, so four-source completion is incomprehensible without it",
        },
      ],
      status: "ready",
      notes: [
        "MEASURED FROM THE STAKEHOLDER'S OWN ddc CONFIG -- branch 1: ddc drives queries off autoCompleteEvents (TextChangedI) and the lsp source's volatilePattern [\\p{P}\\p{S}], which / matches, NOT off advertised triggerCharacters. So the trigger-character config surface we were one measurement from building WOULD HAVE FIXED NOTHING. QUALIFICATION, unsoftened: measured for THIS user's editor; it does NOT establish reachability for built-in completion or another plugin, and no prose may claim general reachability. Their lsp forceCompletionPattern covers . :: -> but NOT /, so / REFRESHES an active completion rather than necessarily opening the popup from nothing -- a real difference from their literal example.",
        "THE ddc file SOURCE ALREADY COVERS PART OF THIS, found by reading their config: forceCompletionPattern \\S/\\S* -- the same shape this feature targets. So sources 1 and 4 are TEACHING-ONLY for such a user, duplicating capability they have; sources 2 and 3 are STRUCTURALLY tsudoi-only, since ddc file is not LSP-aware and can know neither. NO SCOPE CUT: dropping 1 and 4 would design tsudoi's teaching example around one user's plugin, and 4 is what makes prefix-selects-source-class necessary at all.",
        "The example must SAY that running alongside an existing filesystem source produces items from both, DEDUPLICATED BY NEITHER. tsudoi cannot fix it -- cross-source dedup is the completion plugin's job and tsudoi cannot know what other sources exist -- so saying so beats letting a user find doubles and blame us.",
        "ZERO LINES IN src/. The module reads the current line out of the document itself -- documents.get(uri).getText() split at params.position -- because MEASURED: CompletionParams carries textDocument, position and context only, NOT the typed prefix, and on an invoked completion triggerCharacter is null.",
        "REACHABILITY IS NOT A CRITERION HERE and must not appear as one. Whether a real user TYPING / reaches the handler is unmeasured -- see the open impediment. Criteria are protocol-level, as all 232 existing tests are; the PBI-8 precedent is exact, where the tarball route was verified and the registry route shipped explicitly labelled unverified.",
        "The stakeholder's example is the right SPECIFICATION and the wrong TARGET: it specifies precisely what the handler must do with a /-prefixed request, and specifies nothing tsudoi controls about whether that request is sent.",
        "OPEN for refinement, not assumed: hidden entries, walk depth, symlink cycles (UNMEASURED -- if recursion ships, cycle behaviour needs measuring before a criterion is written), and whether ./ selects the document-relative source alone. The stakeholder did not ask and it is not invented here.",
      ],
    },
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
            "The client sends no folders; assert the config observes an EMPTY ARRAY. MEASURED: the protocol has TWO absent states, undefined and null, and no config author should have to know that -- nor should absence be able to look like a present value",
        },
        {
          criterion: "The completion example gains its workspace-relative source",
          verification:
            "With a workspace folder set and cwd elsewhere, a relative-prefix completion carries workspace-rooted items resolving against that folder",
        },
      ],
      status: "draft",
      notes: [
        "THIS IS A PUBLIC-API ADDITION, never a convenience: package.json maps @atusy/tsudoi/types at src/types.ts, and that file states every exported name is public API because renaming one breaks configs we cannot see. Additive, so not breaking -- but permanent. First addition to the type surface in twelve sprints.",
        "MEASURED: rootPath and rootUri are BOTH DEPRECATED in vscode-languageserver-protocol@3.18.2; workspaceFolders is the only current source, optional and nullable. A criterion written against rootUri would be written against a deprecated field on arrival.",
        "MEASURED: cwd is NOT a substitute. nvim spawns the server with cwd = root_dir when a root is found and its OWN cwd when not, so cwd-as-workspace-root is exactly right when tested and silently wrong when it matters, with no signal from inside the config.",
        "Smallest honest shape (REASONED): readonly workspaceFolders: readonly WorkspaceFolder[], reusing the protocol's own type so the surface grows by one name. Plural is not hypothetical -- the field is an array on the wire, so any singular shape lies about it.",
        "STALENESS, which must not be silent: LSP has workspace/didChangeWorkspaceFolders and tsudoi does not implement it, so an array captured at initialize is correct only until the user adds a folder. Either an accepted documented limit or a separate PBI.",
      ],
    },
  ],

  completed: [
    {
      number: 12,
      pbi_id: "PBI-8",
      goal: "Make eleven sprints reachable by someone who was not here -- a README whose own bytes are what the suite runs, so the instructions cannot drift from the product.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in f6cb1aa, 7b8b15e, 95fd3dd, 3397dda, b62d295, 01963af, 6bc5229, plus d4cb846 (post-review prose fix) across 7 subtasks. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "A DEFECT INSIDE THE DEVELOPER'S OWN REMEDY, AGAIN, and caught by writing it: the planned permanent removal control for the contract criterion -- delete a token, assert the fact is gone -- CANNOT FAIL, because the assertion is a CONJUNCTION and therefore holds for every document including an empty one. Replaced with UNIQUENESS (each fact has exactly one home section), which can fail and DID: it exposed a real collision where a failure section restated the factory contract in the same tokens. Fixed in the prose, not by weakening the tokens.",
        "A PROSE DEFECT FOUND AT REVIEW, and the fix is the standard applied to prose: the -A section HEDGED (`a narrower set may well be enough`) over an UNRUN measurement while quoting an error naming the missing flag. Measured: deno run --allow-read --allow-env COMPLETES the handshake under deno 2.9.2. Now stated as a historical claim pinned to that version -- UNTESTED means untested, not unmeasured.",
        "AN UNNAMED PREREQUISITE, which the stipulated-reader rule exists to catch: the install fetches vscode-languageserver-protocol on a cold cache. install.ts had recorded it since Sprint 10 and the README had not inherited it. Now named and defended by its own fact.",
        "DEVIATION from the plan's `reuse installConsumer()`: it PERFORMS the pack and the install -- two DOCUMENTED steps -- which the PO's bareness reframe forbids, since a harness supplying a documented step makes the intact run a test of the harness. The checkout staging is duplicated instead, with the reason at the site.",
        "NOT CONSTRUCTED, not foreclosed: the README's config snippet is EXECUTED but never TYPE-CHECKED -- a type error runs fine under type stripping and would greet a reader running tsc. installConsumer.typeCheck would do it; this was scope.",
        "THE DEVELOPER FOUND A VACUITY MODE INSIDE THE PO'S OWN REMEDY, before building it: AN EXTRACTOR THAT FINDS NOTHING PASSES. If the fence markers move, extraction yields zero commands, `every extracted command succeeds` is VACUOUSLY TRUE, and the README rots exactly as if the tests held their own copy. Mechanism satisfied, property false -- the mod-3 residue shape, in a fourth place. Every extraction therefore asserts an expected non-zero count FIRST, permanently.",
        "THE PO REFRAMED THE COMPLETENESS AMENDMENT AND THE REFRAME IS THE POINT: the Developer proposed it as defending NECESSITY (no documented step is useless). SUFFICIENCY -- nothing undocumented is required -- is what criterion 1 delivers, but ONLY if the staged environment supplies nothing the README asks the reader to do. The sweep's real function is to PROVE THE ENVIRONMENT IS BARE; without it criterion 1 is a test of the harness.",
        "The one-runtime sweep is licensed by Sprint 10's MEASURED route-identity, not by cost, and that is recorded so the basis can be revisited if the route ever diverges.",
        "The PO applied the property-not-mechanism rule TO THEMSELVES one turn after handing it over: the property is `omitting any documented step makes the quickstart fail, from an environment supplying nothing documented`. N pack-and-install cycles is one mechanism, and a cheaper one is the Developer's to take unseen.",
        "EXECUTION FOUND A SECOND VACUITY MODE, this time inside the Developer's own planned control: the removal half of criterion 3 as planned -- delete a discriminating token, assert the fact is gone -- CANNOT FAIL for any document, because statesFact is a conjunction. It was replaced by a control that can: each fact must have EXACTLY ONE home section. Same shape as the extractor's zero-match mode, in a fifth place, and it survived planning, refinement and one Review-grade rule about vacuous criteria.",
        "WHAT THE SUITE STILL DOES NOT DEFEND, stated rather than left to be discovered: the README's config snippet is EXECUTED but never TYPE-CHECKED. A snippet with a type error runs fine under type stripping and would greet a reader running tsc with errors. NOT CONSTRUCTED rather than foreclosed -- installConsumer.typeCheck exists and would do it, and this was scope, not impossibility.",
        "COST OBJECTION OVERRULED ON AN ASYMMETRY: a README that omits a required step is WORSE THAN NO README -- a reader follows it, fails, and concludes the product is broken. It is the most likely defect in a document written by people who have internalised every step, and omission arrives at birth where staleness needs time. Extraction catches stale; only the sweep catches incomplete.",
      ],
    },
    {
      number: 11,
      pbi_id: "PBI-9",
      goal: "Make a green run mean exactly what we claim -- no less, by pinning what only hands have checked; no more, by unpinning what nobody promised.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [],
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
            "The measured-or-reasoned label does not help here: the falsified note did not read as unlabelled, it read as CHECKED.",
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
          action:
            "A PLAN MAY NOT SUBSTITUTE A PROXY FOR A CRITERION'S PROPERTY. Where a subtask offers a RECIPE, it must NAME the property that recipe is meant to achieve and REQUIRE THAT PROPERTY BE MEASURED -- so the executor can detect the recipe failing to deliver it.",
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
            "When a perturbation CANNOT BE CONSTRUCTED, classify it. NOT CONSTRUCTED: the means were lacking -- the assertion is undefended, say what remains at risk. FORECLOSED: the design makes the failure UNREPRESENTABLE -- name the design property that forecloses it. These are OPPOSITE findings and must never share wording. Corollary, and the more useful half: FORECLOSING A FAILURE BEATS DETECTING IT -- a test that cannot be written because the bug cannot exist is a better outcome than a test that catches the bug.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed by the Developer against themselves: their vocabulary had three outcomes -- reddened, did not redden, could not build it -- and the third defaulted to the pessimistic reading, so they reported a DESIGN SUCCESS in the language of a coverage gap.",
        },
      ],
    },
    {
      sprint: 10,
      improvements: [
        {
          action:
            "A criterion's NEGATIVE CONTROL belongs in its `verification` TEXT, not in the plan's perturbations. When refinement or planning discovers the discriminating change, hand back amended verification wording rather than recording a perturbation privately.",
          timing: "immediate",
          status: "active",
          outcome:
            "The lifetime argument applied to criteria: the verification field travels with the criterion through every compaction, a plan evaporates at Review.",
        },
        {
          action:
            "When a decision must live in a MACHINE-FORMATTED FILE that cannot carry comments, its durable home is a TEST THAT ASSERTS IT. The file carries the decision; the test carries the reason.",
          timing: "immediate",
          status: "active",
          outcome: "Closes the hole in the lifetime rule rather than patching it.",
        },
      ],
    },
    {
      sprint: 10,
      improvements: [
        {
          action:
            "A criterion's VERIFICATION must be able to DISCRIMINATE the property it claims, and must not be contradicted by anything else in the record. When a note or a planning-time checklist item supersedes a criterion's verification, THE CRITERION IS AMENDED IN THAT TURN -- a checklist governs one Review; a criterion governs the work.",
          timing: "sprint",
          status: "active",
          outcome:
            "One rule, not two, because both instances share a root: PBI-7's criterion 1 was a runtime test for a compile-time property contradicted by its own note, and criterion 3's verification was contradicted by the PO's own planning instruction.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "SHARPENED ON LIFETIME, replacing the route-to-a-PBI rule: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; a decision that shapes WHAT TO BUILD NEXT belongs on the PBI. When it does both it goes in both -- and the SOURCE COMMENT IS THE DURABLE COPY, because a dashboard note has the lifetime of a PBI and every PBI eventually compacts. When in doubt, put it in the source.",
          timing: "immediate",
          status: "active",
          outcome:
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME: name the change that would make it fail. If nothing would, the criterion is VACUOUS and must be rewritten before it binds.",
          timing: "immediate",
          status: "active",
          outcome:
            "The absence-pairing rule moved from assertions to criteria and from execution to refinement.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "COMPACTION may not drop a recorded decision unless it has a DURABLE HOME elsewhere -- a comment at the code site it constrains, an acceptance criterion, or a note on an OPEN PBI -- and each compaction NAMES where every dropped decision went. A commit message is NOT a durable home. Improvements with status active are never compacted.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed after the Scrum Master raised it about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "PREFER SPLITTING OVER DOCUMENTING: when a perturbation would flip at an earlier assertion than the sub-claim it targets, that is a signal the test BUNDLES independent sub-claims. Split the test so each sub-claim can fail alone, rather than recording that the headline claim is undefended.",
          timing: "immediate",
          status: "active",
          outcome:
            "Better than covered -- it DISSOLVES what the earlier-assertion clause only documents.",
        },
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. DEFAULT for everything written before this rule: an UNLABELLED note is read as REASONED, not measured, until someone measures it.",
          timing: "immediate",
          status: "active",
          outcome: "Filed at the Developer's request after they named it at second occurrence.",
        },
      ],
    },
    {
      sprint: 7,
      improvements: [
        {
          action:
            "A behaviour is pinned by a test where ONE outcome is required. Where TWO outcomes would both be acceptable, record the decision and leave it unpinned -- and the burden is to NAME THE ALTERNATIVE that would also be acceptable.",
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
            "Every assertion that something is ABSENT -- zero stderr, zero $/progress, a label not on stdout -- ships with a PAIRED assertion, permanent in the suite, that the same measurement observes it when present. A perturbation proves the apparatus once, on the day it was run; the pair proves it on every run, including after someone refactors the accumulator two sprints later.",
          timing: "immediate",
          status: "active",
          outcome: "Generalises what the PO had been imposing by hand criterion by criterion.",
        },
        {
          action:
            "A perturbation specified by the PRODUCT OWNER names the assertion it is required to flip, not just the mutation to make. If it flips an earlier assertion instead, it has not defended the claim it was written for and a different perturbation is required.",
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
            "A plan must declare which subtasks share ONE IMPLEMENTATION MOMENT. Within such a group only the first can claim expected-RED; the rest are born-green-by-construction and carry perturbations, however distinct their criteria are.",
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
            "Standing-list amendment (item 6 above): the stakeholder-facing example is the artifact under test with no fixture copy in existence. It is why the example cannot rot without the suite going red, and why Sprint 4's hover demo could be the stakeholder's own file, unmodified.",
          timing: "immediate",
          status: "active",
          outcome:
            "Today it survives only because test/lifecycle.test.ts happens to load that file; nothing stops a duplicate fixture appearing.",
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
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new. Standing list: (1) driven over stdio through the real server, not against directly-constructed internals; (2) stdout carries only protocol, with non-protocol bytes COUNTED rather than eyeballed; (3) non-ASCII payloads on any new user-visible path, permanent in the suite; (4) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (5) both runtimes, and the Definition of Done at HEAD; (6) the stakeholder-facing example examples/tsudoi.config.ts is the ARTIFACT UNDER TEST, with no fixture copy of it in existence -- a PRODUCT property rather than a test property, which is why it belongs here rather than being rediscovered. Moving an item to the standing list removes it from the PO's authoring, NEVER from the Scrum Master's reporting -- if a standing item stops being reported, we have traded verification for convenience.",
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
            "A Review perturbation states whether it REPRODUCES the Developer's recorded perturbation or is INDEPENDENT. Reproductions report expected versus observed failure counts, so a divergence surfaces when it occurs rather than at write-up.",
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
            "A note addressed to a PBI other than the one it sits on must be written onto THAT PBI when the note is created, not left to be rescued at compaction. This removes the compaction-time check rather than adding a second thing to remember.",
          timing: "sprint",
          status: "active",
          outcome:
            "First application found a real orphan immediately: PBI-2 said 'PBI-3 and PBI-4 widen it again', PBI-3 carried its copy, PBI-4 carried nothing.",
        },
        {
          action:
            "An attached spike must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask. A scratchpad path is a pointer, not an attachment -- it dies with the session, and a fresh executor would re-derive or guess.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 1,
      improvements: [
        {
          action:
            "The PO's acceptance checklist is issued at Sprint PLANNING, not at Review, so the plan can target it. Review measurements are then reported item by item against it, in the checklist's own numbering, including items that pass trivially -- so an omission is visible as an omission.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "When a planning spike produces passing code, attach the code for the executor to start from; the plan then says what to change about it instead of re-deriving it in prose.",
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
