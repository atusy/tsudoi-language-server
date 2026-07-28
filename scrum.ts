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
        benefit:
          "they can rely on it as their path completion, not merely read it -- the item they pick inserts the path they meant",
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
            "TWO cases, because they catch DIFFERENT wrong implementations. (a) cwd is a SYMLINK to the document's parent: a naive resolved-path dedup that joins without realpath keeps both, where inserted-text dedup collapses them to one. (b) NESTED roots -- the document's parent inside cwd, so one file yields `foo.ts` and `b/foo.ts`: different strings, same file, and BOTH MUST SURVIVE, which is what a realpath-based dedup would wrongly collapse. Dedup is by INSERTED TEXT, never by resolved file, which would force an arbitrary choice of which root to label it with",
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
        {
          criterion: "Applying the item yields the path it names",
          verification:
            "Apply the item to the document as a client would and compare the resulting line to the path the item names, for a MULTI-SEGMENT fragment. The PROPERTY, not a mechanism: whether an explicit textEdit is needed is for measurement to decide -- LSP clients compute the replace range from THEIR OWN word boundaries when an item carries only insertText, and neither / nor . is a word character in most, so a multi-segment path can get its last segment replaced and the rest left behind. DISCRIMINATOR: single-segment fragments cannot distinguish the cases, so the test must use multi-segment",
        },
        {
          criterion: "A path containing a space or a parenthesis is emitted complete",
          verification:
            "A fixture directory holds `spaced (1).txt`; assert the item's label, inserted text and textEdit range each cover the whole filename. NEGATIVE CONTROL: detecting the fragment by splitting on whitespace truncates it at `spaced`, which is the most natural wrong implementation of fragment detection",
        },
      ],
      status: "ready",
      notes: [
        "MEASURED FROM THE STAKEHOLDER'S OWN ddc CONFIG -- branch 1: ddc drives queries off autoCompleteEvents (TextChangedI) and the lsp source's volatilePattern [\\p{P}\\p{S}], which / matches, NOT off advertised triggerCharacters. So the trigger-character config surface we were one measurement from building WOULD HAVE FIXED NOTHING. QUALIFICATION, unsoftened: measured for THIS user's editor; it does NOT establish reachability for built-in completion or another plugin, and no prose may claim general reachability. Their lsp forceCompletionPattern covers . :: -> but NOT /, so / REFRESHES an active completion rather than necessarily opening the popup from nothing -- a real difference from their literal example.",
        "RETRACTED, and the reasoning with it: an earlier note framed sources 1 and 4 as teaching-only because ddc already covers them. That framing rested on judging tsudoi's example by ONE user's plugin configuration -- the very thing refused one turn earlier when the scope cut was declined. The surviving halves are re-homed: the non-LSP-source-cannot-know-workspace-folders argument to PBI-15, and the overlap warning to the example's prose, generalised.",
        "The example must SAY, generically rather than about ddc: a user who KEEPS a filesystem completion source will see items from both, DEDUPLICATED BY NEITHER, and anyone REPLACING one should check their plugin still opens the popup on /. tsudoi cannot fix it -- cross-source dedup is the completion plugin's job and tsudoi cannot know what other sources exist -- so saying so beats letting a user find doubles and blame us.",
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

  sprint: {
    number: 13,
    pbi_id: "PBI-14",
    goal: "Give a config author a path completion that knows which root it is answering from -- so the item they pick inserts the path they meant, from the root they meant.",
    status: "in_progress",
    subtasks: [],
    impediments: [],
    decisions: [
      "Shipped in 3222fb0, 94e46c0, c0db79e, 771b319, 4a1bdfa, 258f726, 7c97fe7, f18159e, 43fca61, 8932b45, b78fd74, plus structural 4fe716c. Per-subtask records and 14 perturbation notes compacted here; git retains them.",
      "A TEST CONVENIENCE REACHED THE PUBLIC SURFACE: itemsFrom defaulted position, which could only assume line 0 -- dead for every real call and silently wrong elsewhere, producing exactly the off-cursor-line range MEASURED to make items VANISH in the client. Undefended: no test drives a line above the first. Fixed structurally.",
      "A SELF-REFERENTIAL ORACLE, found by perturbing: the resolution test derived its expectation from source.root, so swapping the document and cwd roots swapped BOTH SIDES and reddened nothing. Roots are now stated by the test.",
      "THE PLANNED DEDUP COLLISION CANNOT DISCRIMINATE ITS OWN RULE: document-parent-equals-cwd is ONE directory reached by ONE path, so dedup-by-resolved-file passes it unchanged. A third case -- cwd a symlink to the document parent -- supplies the discriminator.",
      "CROSS-RUNTIME DIFFERENCE nobody had: deno REJECTS opendir for a missing directory; bun RESOLVES it and defers the scandir to the first iteration. A catch correct under one runtime lets ENOENT escape under the other.",
      "WEAKNESS recorded at the site: dedup collapses TWO DIFFERENT FILES when doc-parent is not cwd and both hold src/foo.ts -- one item, attributed to whichever source ran first. The edit is identical; the attribution is one truth of two.",
      "UNRESOLVABLE TENSION, recorded not managed: a visible root in label and enableMatchLabel safety cannot both hold -- that option requires the word to CONTAIN the label, and src/foo.ts does not contain `src/foo.ts (cwd)`, so a decorated label would be DROPPED ENTIRELY. No other carrier is measured to display; labelDetails is unmeasured in ddc.",
      "NOT CONSTRUCTED, property named: nothing asserts a real editor reaches the handler by typing /. No prose claims it. And unruled-by-design, with fixtures containing no dotfiles so nothing pins them: hidden entries, ./ and ../ handling, trailing / on directories, ~ and quoted paths.",
      "HANDED BACK, not folded in privately: criterion 9 was restated as the PROPERTY `applying the item yields the path it names`, with the mechanism left to measurement. MEASURED FROM ddc-source-lsp's SOURCE, via the Scrum Master: the word comes from `insertText` and `textEdit` is consulted ONLY to move the offset, which is the sole way an item can replace characters to the LEFT of the client's word boundary. So an explicit textEdit IS required, the withdrawn mechanism is the answer, and the criterion should keep saying the property while the module records the measurement. Constraints measured with it: a multi-line range, a range whose start is not the cursor's line, or an empty label make the item VANISH silently.",
      "THE SPACED-FILENAME CRITERION IS NOT IN THIS FILE AND NEEDS THE PO'S HAND. It arrived as prose -- `for a filename containing a space or a parenthesis, tsudoi emits the complete path: label, inserted text and range all covering it` -- and is built and tested as subtask 11. Criterion 1 now carries five negative controls; per the PO's advance agreement they are SPLIT across tests rather than documented, since one perturbation flips whichever assertion runs first and leaves the rest undefended.",
      "CARRIER MEASURED, and it changes criterion 8's shape: the target client displays `detail` only when an option that DEFAULTS OFF is set, and this user does not set it. A root named in `detail` would satisfy the criterion at the protocol level and show the user nothing -- the green-suite-dead-feature shape. The root goes in `label`, which is displayed unconditionally.",
      "THE SYMLINK HAZARD IS FORECLOSED BY DESIGN, not measured: path completion is PER SEGMENT -- resolve the prefix's directory part, list THAT ONE DIRECTORY, filter by the trailing fragment. No criterion requires recursion, so recursion depth, unbounded walks and symlink CYCLES are all unrepresentable: a cycle requires traversal and one readdir cannot traverse. The Developer had flagged cycles as needing measurement and instead removed the need.",
      "A CRITERION ERROR THE DEVELOPER HANDED BACK RATHER THAN WORKING AROUND: criterion 3's verification cited cwd-and-workspaceFolder coinciding, but workspaceFolders is PBI-15's deferred API and is NOT a source in this PBI. Replaced with document-parent-equals-cwd, which constructs the same collision from sources this PBI actually has.",
      "FIXTURES MUST CONTAIN NO DOTFILES. Hidden-entry behaviour is UNRULED -- the stakeholder did not ask -- and an incidental fixture would pin it silently. Unruled behaviour pinned by accident is how a decision gets made by nobody.",
      "SCOPE, from the stakeholder directly: `置き換える予定だけど、いったん要求したものができてればいい`. Parity with ddc-source-file is NOT a criterion. The replacement intent is context -- it is why sources 1 and 4 are load-bearing rather than decorative -- and increments come later.",
      "FOR THE STAKEHOLDER, not work for us: their ddc file source carries forceCompletionPattern \\\\S/\\\\S* and their lsp source does not include /, so THE THING THAT FORCE-OPENS THE POPUP ON A PATH FRAGMENT TODAY IS THE SOURCE THEY PLAN TO REMOVE. A config change on their side, reported rather than planned around.",
      'WHAT IS DELIBERATELY NOT BUILT, so nobody reads its absence as an oversight: no trailing `/` on a directory item (the user types it); `~` is not expanded; a quoted path such as `"./ba` does not complete, because a quote is not a fragment boundary; and hidden entries and ./ ../ are UNRULED and remain so -- the fixtures contain none, and no test pins either way.',
      "NOT CONSTRUCTED, and the property named: nothing asserts that a REAL editor reaches this handler by typing /. Reachability is not a criterion here and the example claims none. The suite's evidence stops at the protocol boundary, exactly as PBI-8's registry route did.",
      "A DEFECT IN THE DELIVERABLE'S OWN PUBLIC SURFACE, found after every subtask was green and fixed as a separate structural commit: itemsFrom defaulted its `position` parameter, purely so one test helper need not construct one. The default could only assume line 0 -- dead for every call the module makes and silently wrong for a cursor anywhere else, since it would build a range on a line other than the cursor's, which is MEASURED to make the item VANISH from the target client with no error. Nothing defended it: no test drives a line above the first. A test convenience reached the artifact a config author reads.",
      "THE README NAMED ONE FILE and the example is now two. All three TEST helpers that copy it were repaired during subtask 9; the line a HUMAN follows was not, and readme.test.ts cannot catch it because it extracts fenced commands and this is prose. Fixed, after checking that no pinned fact has a home in that section.",
      "MEASURED ONCE, NOT PINNED, and the difference is stated rather than blurred: `deno run --allow-read --allow-env` -- the narrow flag set Sprint 12 pinned FOR THE HANDSHAKE -- serves a real path completion, with empty stderr, under deno 2.9.2. Making cwd lazy kept the handshake clean and left the COMPLETION path under those flags unverified; it is now measured, by hand, and no test asserts it. Nothing in the repo claims otherwise.",
      "A COST OF THE EXAMPLE'S SHAPE, reported rather than fixed: the example yields its HelloWorld demo item before delegating, so every path completion carries one item that is not a path. Changing it would edit an assertion in completion.test.ts that predates this sprint, and the demo item is what the rest of the file exists to teach.",
    ],
  },
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
      sprint: 10,
      improvements: [
        {
          action:
            "A criterion's NEGATIVE CONTROL belongs in its `verification` TEXT, not in the plan's perturbations.",
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
            "A criterion's VERIFICATION must be able to DISCRIMINATE the property it claims, and must not be contradicted by anything else in the record.",
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
            "SHARPENED ON LIFETIME, replacing the route-to-a-PBI rule: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; a decision that shapes WHAT TO BUILD NEXT belongs on the PBI.",
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
            "COMPACTION may not drop a recorded decision unless it has a DURABLE HOME elsewhere -- a comment at the code site it constrains, an acceptance criterion, or a note on an OPEN PBI -- and each compaction NAMES where every dropped decision went.",
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
            "PREFER SPLITTING OVER DOCUMENTING: when a perturbation would flip at an earlier assertion than the sub-claim it targets, that is a signal the test BUNDLES independent sub-claims.",
          timing: "immediate",
          status: "active",
          outcome:
            "Better than covered -- it DISSOLVES what the earlier-assertion clause only documents.",
        },
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies.",
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
            "Standing-list amendment (item 6 above): the stakeholder-facing example is the artifact under test with no fixture copy in existence.",
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
            "An attached spike must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask.",
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
            "The PO's acceptance checklist is issued at Sprint PLANNING, not at Review, so the plan can target it.",
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
