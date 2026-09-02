// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). RAISED FROM 500 BY THE
// STAKEHOLDER, AND THE REASON THEY GAVE IS NO LONGER THE REASON IT
// HOLDS. It was raised because this dashboard carried the measured
// rulings and the reasons they were overturned. Those have LEFT for
// `.claude/skills/`, where they are delivered by the harness at the
// moment they apply instead of waiting to be remembered. What is left
// here is what only this file can hold: what is being built now, what
// was decided about it, and by whom.
//
// THE LIFETIME RULE, AND THE STAKEHOLDER HAS AMENDED IT. A decision may
// be compacted out of this file only into a home that OUTLIVES a
// context window: a permanent assertion, a comment at the site where
// the violating edit would be made, a PRODUCT BACKLOG ITEM, or a SKILL
// in `.claude/skills/`. `AN ACTIVE IMPROVEMENT` WAS ON THAT LIST AND IS
// STRUCK, and striking it is what made this compaction possible: while
// an improvement was itself a permanent home, keeping one active was a
// licence to compact something else INTO it, so nothing ever had a
// reason to leave and eighty-one accumulated across thirty-eight
// retrospectives with not one ever closed. THE STAKEHOLDER'S RULE THAT
// REPLACES IT: mechanise what will still be needed -- as a check if
// something can redden, as a SKILL if the discipline is applied while
// writing rather than while running -- and delete what can be kept
// without a mechanism, or whose breach is survivable and can be
// reconsidered when it next surfaces. WHY A SKILL COUNTS AS A
// MECHANISM, which is the half a reader will doubt: sprint 47 measured
// that attention pointed AT a class still missed an instance of it --
// but what failed there was MEMORY, a rule delivered once by having
// been discussed. A skill is delivered by the harness on description
// match. Sprint 47 refutes attention; it does not refute delivery.
//
// EVERY SPRINT RUNS THE `revise` SKILL AFTER THE DEVELOPER'S WORK, WITH
// NO PR. THE STAKEHOLDER'S STANDING INSTRUCTION, NOT A TEAM PREFERENCE,
// and it is attributed here because unattributed it reads as advice and
// is dropped in the next tidy-up. WHAT IT IS: multi-perspective review,
// then independent review, converged before acceptance. WHY IT IS
// WRITTEN HERE AND NOT IN `definition_of_done`: that field carries
// `{ name, run }` where `run` is A COMMAND LINE THE RUNNER SPAWNS
// DIRECTLY -- not a shell command, and the runner REFUSES one carrying
// shell syntax rather than misreading it -- so a skill name there would
// make this dashboard assert something no command verifies, and would
// now be refused outright. That is the exact failure this project keeps
// catching. Do
// not "fix" the gap by adding it as a check. THE LINE IT DRAWS: a
// criterion asserts a product property a perturbation can falsify;
// `revise` finds what nobody thought to assert. NO CRITERION MAY BE MET
// BY ARGUMENT AT REVIEW.
//
// THE FILING BAR FOR THAT ROUND, WHICH QUALIFIES THE INSTRUCTION ABOVE
// RATHER THAN STANDING ON ITS OWN. It is HERE and not in a skill --
// delivery by skill is the thing this project has measured failing under
// load -- and not in the round's own skill file, which lives outside this
// repository and would be invisible to this project's review of its own
// records. A FINDING RECORDED AS PRE-EXISTING NAMES BOTH COMMITS AND THE
// BYTE-IDENTITY RESULT AT THE SPRINT'S BASE, OR IT IS THIS SPRINT'S TO
// REPAIR. IT NAMES THE ITEM IT IS FILED INTO, OR IT IS NOT FILED. AND
// PREDATING IS NOT ITSELF A LICENCE: a finding inside the sprint's own
// subject is repaired here even when it predates.
//
// AND A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED. It stands
// beside the bar above and qualifies it the same way: a note reporting
// what reddened is a reading OF THE MOMENT IT WAS TAKEN and nothing
// more, so a perturbation whose result is going to be relied on later is
// written as a record THE SUITE RE-RUNS -- a weakening, a named arm and
// a required red -- or, when the weakening is a reading of something the
// arm already holds, as an assertion beside that arm. Prose may then say
// why; it may not be the whole of it.
//
// THE MEASURED FAILURE MODE IS NOT `NO PERTURBATION WAS RUN`: these
// records are full of them. It is that each was run ONCE and written up,
// in a file whose own header says a decision may be compacted only into
// a home that OUTLIVES A CONTEXT WINDOW -- and a note is not such a
// home. The compensator that was supposed to reach is the standing
// re-run, which carries its own measurement that nearly every earlier
// perturbation aimed at something that no longer existed.
//
// WHAT NOTHING CHECKS, SAID HERE SO THE BAR IS NOT MISREAD AS A GREEN: no
// check decides whether an arm HAS a record. That detector is refused by
// name -- its failure mode is a green certifying a class as watched --
// so the registry's silence about unrecorded arms is honest, and this bar
// binds the AUTHOR rather than the run. `The adjacent weaker reading` is
// a judgement nothing verifies either.
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
          "5 of 5. ENUMERATED IN THE METRIC ITSELF because `10 of 10` stood for thirty sprints with NOTHING ANYWHERE ENUMERATING THE TEN -- grepped, the only match was the metric. A fraction whose denominator nobody can name cannot be met, and the PO twice reported `2 of 10` as fact. The five were set by the stakeholder, not invented to make the metric satisfiable. AND TSUDOI NOW SERVES MORE THAN FIVE -- `workspace/executeCommand` since sprint 86 and `textDocument/codeAction` since sprint 87, with `initialize` a further key a config may declare though it is not a row of the request table. THE DENOMINATOR DOES NOT MOVE FOR THEM, deliberately: this metric asks whether what the STAKEHOLDER ASKED FOR responds, and a denominator that grew every time the product did would be a fraction nobody could fail. What the code serves is counted by the request table and by nothing here.",
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
      id: "PBI-91",
      story: {
        role: "editor user",
        capability:
          "see the diagnostics my efm linters already produce, under tsudoi, with the `lint-formats` errorformats from my own config.yaml doing the parsing",
        benefit:
          "the linter set is the value of efm, and an adapter that formats but does not lint has not adapted efm",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. The errorformat parser is the item and its scope is not settled.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THE COST IS THE ERRORFORMAT PARSER AND IT IS NOT SMALL. `lint-formats` is a list of VIM errorformats -- `%f:%l:%c: %m`, and also the multi-line stack forms efm's own README uses for eslint (`%+P%f`, `%-O`, `%*[ ]`). efm delegates it to reviewdog/errorformat, a Go implementation; nothing in this workspace parses one today. A slice honouring only the single-line forms is defensible and MUST REFUSE the rest rather than silently drop the lines it cannot match.",
        "AND THE SURROUNDING KEYS ARE EACH A DECISION: `lint-offset`, `lint-offset-columns`, `lint-severity`, `lint-category-map`, `lint-source`, `prefix`, `lint-ignore-exit-code`, `lint-stdin`, `lint-workspace`, `require-marker` and `root-markers`. tsudoi serves PULL diagnostics; efm's `lint-debounce`, `lint-after-open` and `lint-on-save` are about a PUSH schedule tsudoi does not have, and saying so is part of the item.",
      ],
    },
    {
      id: "PBI-92",
      story: {
        role: "editor user",
        capability: "invoke the `commands` from my efm config.yaml out of the code-action menu",
        benefit:
          "efm's commands are the half of it that DOES something, and this is also the first file in this repository where the initialize handler, the command row and the code-action row are shown working together",
      },
      acceptance_criteria: [
        {
          criterion: "PLACEHOLDER -- NOT REFINED, AND IT DEPENDS ON PBI-89 LANDING.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THIS IS THE SEAM SPRINT 86 LEFT UNWITNESSED, AND THE PRODUCT OWNER ALREADY RULED WHAT WOULD CLOSE IT: `an example config where the two increments are shown working together in a file a stranger reads`. A config declaring `initialize` (to fill `executeCommandProvider.commands`, which tsudoi advertises EMPTY), `workspace/executeCommand` (to run them) and `textDocument/codeAction` (to offer them) IS that file -- so this item discharges a refinement candidate rather than only adding a feature.",
        "THE CODE-ACTION ROW THIS NEEDS LANDED IN SPRINT 87, so what is left here is the adapter half.",
        "efm's command definition carries `command`, `arguments`, `title` and `os`, and `${INPUT}` appears in the ARGUMENTS. `os` filters by platform, and a command list that ignores it offers the user an action that cannot run.",
      ],
    },
    {
      id: "PBI-102",
      story: {
        role: "config author",
        capability:
          "run my own handler BESIDE a built-in notification like `textDocument/didOpen`, with tsudoi running both",
        benefit:
          "a hook no longer costs the author the document store by replacing the handler that fills it",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- AND THE MEASUREMENT IT WAITED FOR HAS BEEN TAKEN, so what remains is one RULING and it needs the stakeholder. MEASURED: upstream's `onNotification` does `notificationHandlers.set(method, …)` -- A MAP SET AND NOT A CHAIN -- so a second registration for a name EVICTS the first. This story's benefit is therefore a real defect and not a belief about a library, AND it forecloses the shape: a hook can never BE a second registration, so the built-in and the hook must reach the wire as ONE registered function. WHAT IS STILL OPEN: whose gate a hook takes. `textDocument/didOpen`'s built-in declares `lifecycle`; an author declaring `always` on a hook for it gets their hook firing for a document the store never opened -- the ungated-write shape src/notifications.ts exists to foreclose, arriving through the config instead of through a connection. Either a hook's gate is not the author's to declare, and the entry shape then DIFFERS between a hook and a real custom notification, or both gates apply independently and the divergence is disclosed.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THE SURFACE IS PBI-101's AND THIS ITEM ADDS NONE, which is why it is second and not parallel: the entry, its declared kind, its gate, the return shapes and the stderr cadence all ship there. What is left here is SEMANTICS -- what running two handlers for one message means -- and the type side is already open for it: MEASURED at PBI-101, the collision guard refuses `textDocument/hover` and ACCEPTS `textDocument/didOpen`, because `ConfigMethod` is the request table plus `initialize` and the built-in notifications are not in it.",
        "AND WHAT `AWAIT` BUYS IS OBSERVABILITY AND NOT ORDERING, MEASURED IN UPSTREAM RATHER THAN ASSUMED, because the name invites the opposite reading. `handleNotification` DOES `await` the handler -- so a returned promise is genuinely observed -- but the message pump does NOT wait for it: `triggerMessageQueue` calls itself UNCONDITIONALLY in its `finally`, gated only by `inFlight >= maxParallelism`, and `maxParallelism` DEFAULTS TO -1 with tsudoi passing no options to `createProtocolConnection`. So the next notification is dispatched while the previous handler is still pending, and NOTHING IN THIS STACK SERIALISES NOTIFICATIONS TODAY.",
        "WHICH DECIDES THE ORDER ON SAFETY RATHER THAN TASTE: THE BUILT-IN MUST RUN BEFORE THE HOOK, and specifically must not sit behind an awaited one. With no serialisation, a slow hook on `textDocument/didChange` does not delay the NEXT didChange -- so if tsudoi awaited hook N before applying change N, and hook N+1 resolved first, CHANGE N+1 WOULD BE APPLIED BEFORE CHANGE N. LSP document changes are ordered and incremental, so that is a corrupted store rather than a late one, and it is silent. Running the built-in first also hands the hook the more useful reading -- a store that already reflects the message it is being told about -- so the safe order and the ergonomic one agree.",
        "THE ARCHITECTURAL CONSTRAINT BINDS HARDER HERE THAN ON PBI-101 AND IT ALSO ANSWERS THE MEASUREMENT ABOVE: only src/notifications.ts may create a connection or register a notification -- `RequestOnlyConnection` removes `onNotification` from the type every other module sees, and .oxlintrc.json bans the connection factory by import name everywhere else. A hook COMPOSED INTO THE ENTRY the router already owns never registers a second handler for the name at all, so the ordering ruling is expressible and the displacement question stops being load-bearing. THAT IS A CANDIDATE SHAPE AND NOT A SUBTASK: what binds is the order and the store, and the route is the Developer's.",
        "AND THE EVICTION ABOVE NAMES THIS ITEM's WHOLE RISK OF LANDING GREEN WHILE MEASURING NOTHING, which is worth carrying separately from the criterion because it is a TEST rule and not a design one: AN ARM THAT ASSERTS ONLY THAT THE AUTHOR'S HOOK RAN IS GREEN UNDER THE BROKEN IMPLEMENTATION. Registered as a second `onNotification`, the hook runs perfectly every time with the right params while the built-in has been silently evicted -- and the REST of the suite stays green too, because no other fixture declares a hook, so no other test's registration is ever overwritten. The one config whose document store is dead is the one config whose test only checked that the hook fired. THE RULE: every hook arm asserts the BUILT-IN'S EFFECT in the SAME measurement as the hook's -- the document present in `tsudoi.documents`, the buffer's text correct -- and never `the hook was called`.",
        "THE PER-METHOD KEYING OF THE STDERR REPORTS BITES HARDEST ON THIS HALF, which is why it is named again rather than left with the item that builds it: a hook on `textDocument/didChange` runs on every keystroke, so an unconditional warning is a flooded stderr rather than a louder one.",
        "AND THE HOOK'S OWN READING OF `tsudoi.documents` IS THE THING AN AUTHOR CANNOT TELL BY LOOKING: a `didOpen` hook running before the store update sees no document and after sees one, silently different either way. The order ruling above decides it; what this item owes is an arm that FAILS if the answer ever moves, since nothing about a hook's shape reveals which side of the update it is on.",
        "AND THE EVICTION IS NO LONGER A PREDICTION: MEASURED ON THE WIRE IN SPRINT 96, on the surface that shipped there. A config declaring `textDocument/didOpen` under `customMethods` passes both refusals by design, its handler runs with the right params, and `tsudoi.documents` is EMPTY for the whole session with nothing on stderr. So this item's story is a defect a config author can reach today rather than a belief about a library, and the state is DISCLOSED in README.md and at `CustomMethodMap` rather than armed -- an arm would pin the displacement as promised behaviour.",
      ],
    },
    {
      id: "PBI-99",
      story: {
        role: "config author",
        capability:
          "have a handler package's EXPORTED NAMES graded through the route I actually take, so a rename that misses one reaches me as `has no exported member` rather than passing every check here",
        benefit: "the names a member's README tells me to import are the names its tarball carries",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether the path package's probes are generalised over members or each member owes its own file is the item.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY WALKING THROUGH IT IN SPRINT 93 AND PRE-EXISTING TO IT. `test/published-artifacts.test.ts` names `completePath` and `resolvePathStat` as literal strings and type-checks them from a staged consumer -- and NO SUCH ARM EXISTS FOR THE OTHER THREE MEMBERS. Renaming `aroundCompletion` reddened nothing on the published route; what caught the in-repo callers was `tsc` and the workspace check, which read `src/` and not a tarball.",
        'AND THE README SNIPPET IS NOT THE MISSING ARM, which is the reading a later reader will reach for. The `ts snippets` row\'s SUBJECT is the SPECIFIERS -- its own comment says a block whose imports resolve and whose body is wrong is accounted for and unchecked -- so `import { neverExported } from "@atusy/tsudoi-completion-around"` satisfies it. The row is not weak; it is about a different question.',
        "AND ITS SECOND INSTANCE ARRIVED IN SPRINT 95, MEASURED THE SAME WAY: with `export { completeCorpus }` deleted from `packages/tsudoi-completion-document/src/index.ts` and everything rebuilt, the suite read 1173 pass / 0 fail. A NEW published handler was reachable by nothing this repository runs. That member now owns an arm reddening on the deletion, which grades its `src/index.ts` and NOT its tarball -- so this item keeps its whole subject, and now has a member whose in-repo half is covered to contrast with.",
        "WHAT MAKES THIS MORE THAN SYMMETRY: a member's README is the ONLY instruction a stranger gets, and the name in its snippet is the one thing in it that must match the artifact exactly. `packed-members` already reads the tarball -- it grades the FILE LIST and the README's tokens, never a single exported name.",
      ],
    },
    {
      id: "PBI-94",
      story: {
        role: "config author",
        capability:
          "have the PARAMS my handler is handed be graded by something, so a row whose params type widened is caught before it reaches my editor",
        benefit:
          "the surface tsudoi publishes keeps saying what it says today, rather than only what any assignable type would let it say",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether one probe covers the table or each row owes its own is the item.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY THE INDEPENDENT REVIEW STAGE IN SPRINT 87 AND PRE-EXISTING TO IT: `MethodMap[M][\"params\"]` is graded by nothing for ANY row. Every fixture handler in this repository either ignores its params or is contextually typed, so a params type that widened -- `CodeActionParams` to something it is assignable to, losing `range` and `context` in a stranger's editor -- reddens no arm. NOT INTRODUCED BY THE CODE-ACTION ROW, which is why it is an item rather than that sprint's repair.",
        "THE SHAPE ALREADY EXISTS TWICE: test/execute-command-types.test.ts and test/initialize-handler-types.test.ts stage a consumer-shaped probe and read the COMPILER's own errors. What is unsettled is whether one probe reading every row from the table beats one file per row, and this repository has a rule about that -- a check whose green certifies a class as watched is refused by name here, so a probe iterating the table must fail loudly when it reaches a row it cannot construct params for.",
      ],
    },
    {
      id: "PBI-93",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a REFUSED verdict as a statement about the arm it names, rather than as the registry having run out of seconds",
        benefit:
          "a record that has genuinely stopped discriminating is told apart from a machine that was busy, instead of both arriving as the same red on alternate runs",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- NOT REFINED. Whether the answer is a larger budget, a budget derived from a measured baseline, or a REFUSED that distinguishes `timed out` from `wrote no report` is the item, and none of the three is obviously right.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND IN SPRINT 87 AND MEASURED AS PRE-EXISTING TO IT, TO THIS PROJECT'S OWN FILING BAR. Two runs of test/perturbations.test.ts with sprint 87's own record STASHED OUT, at c004410: one reported the three `dodArms` records REFUSED with `the arm file did not run to a report`, the next reported every record HELD. AND c004410 GRADES THE BASE a6e699e FOR THIS: test/perturbations.test.ts, test/definition-of-done.test.ts, scripts/definition-of-done.ts and the registry's own reader are BYTE-IDENTICAL between the two, `git diff` empty over all four.",
        "THE MECHANISM, WHICH IS WHY THIS IS NOT A FLAKE TO SHRUG AT: those records re-run test/definition-of-done.test.ts, MEASURED at 14.17s alone, against a 25s ceiling. That is not a wide margin, and the file spawns real check runs, so the margin closes whenever the machine is busy -- which is precisely when a whole-suite run is happening.",
        "WHAT MAKES IT WORSE THAN AN ORDINARY TIMEOUT IS THE VERDICT IT PRODUCES. A record that times out reads REFUSED, which is the same word this instrument uses for a record whose arm no longer exists -- a real staleness. So the one reading that should send a maintainer to repair a record is also the one a busy machine emits, and the two are told apart today by re-running and seeing whether it goes away.",
      ],
    },
    {
      id: "PBI-86",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a perturbation record as the WHOLE outcome of one weakening -- every arm it reddens, WHERE each red falls, and every arm whose GREEN is what makes those reds mean anything -- rather than as one privileged arm with a site and a list of names without one",
        benefit:
          "a record stops reporting success after the arm its discrimination rests on has been deleted, and a collateral red that moved to another assertion stops being invisible",
      },
      acceptance_criteria: [
        {
          criterion:
            "ONE RECORD PER WEAKENING, AND ITS REDS ARE A LIST OF (ARM, SITE). The `arm` / `alsoReddens` / `redAt` split goes: it privileges one arm with a site and leaves every other red carrying a name alone, which is why a collateral red landing at a DIFFERENT assertion is unnoticed today. THE SPLIT IS THE DEFECT AND NOT ITS SYMPTOM -- a weakening has one outcome, and the record's shape should be that outcome.",
          verification:
            "The type in test/helpers/perturbation.ts and every record rewritten to it. PROBE: a throwaway whose collateral arm reddens at an assertion the record did not name must read REFUSED. It is a state no record in this repository is in, so the witness is built rather than found -- the instrument's own convention.",
        },
        {
          criterion:
            "`staysGreen` NAMES THE ARMS A RECORD'S DISCRIMINATION RESTS ON, AND EACH MUST EXIST AND PASS. Absence cannot tell a control that stayed green from one that no longer exists, and today deleting the single-segment arm leaves two records reporting HELD with nothing left to discriminate.",
          verification:
            "PROBE, BOTH DIRECTIONS: the control present and passing reads HELD; the control deleted from the arm file reads REFUSED, naming it. Against today's instrument the second reads HELD, which is the measurement that says the criterion is worth meeting.",
        },
        {
          criterion:
            "EVERY RECORD THAT HOLDS TODAY HOLDS AFTER, BY NAME. This item changes the instrument and no product behaviour, so a record whose verdict moves is a migration defect -- and a record whose verdict moves to HELD from something else is the worse direction.",
          verification:
            "The full registry read before and after, arm by arm, and the two readings compared as a LIST rather than as a count.",
        },
        {
          criterion:
            "THE PROSE THE OLD SHAPE FORCED IS DELETED, NOT SUPERSEDED. `THE CONTROL IS THE ARM THIS RECORD DOES NOT NAME`, and every sentence explaining which absence means what, exist only because the shape could not say it. With the shape saying it, they are noise.",
          verification:
            "Read: no record explains a control by absence, and none carries a hand reading of where a collateral red fell -- that being a field now.",
        },
      ],
      status: "ready",
      notes: [
        "SPRINT 84's RETROSPECTIVE PROPOSED THE PATCH AND THE STAKEHOLDER REFUSED IT, WHICH IS WHY THIS ITEM IS THE SHAPE IT IS. The proposal was to add `staysGreen` beside the existing fields and leave the rest -- a field bolted onto a record whose asymmetry is the actual defect. The ruling was to pursue the shape rather than fit the existing comments.",
        "WHAT THIS DOES NOT CLOSE, so its green is not over-read: nothing decides whether an arm HAS a record. That detector is refused BY NAME in this project -- its failure mode is a green certifying a class as watched -- so the registry stays a list, and a weakening nobody wrote down is still measured by nothing. And a control that exists, passes, and grades nothing is a judgement no matcher makes, one level down from the same limit `redAt` already carries.",
        "THE MIGRATION IS THE COST AND IT IS NOT SMALL: nineteen records, each re-measured rather than transcribed, since the reds a record names are what the rewrite is for. A transcribed record is the one shape this change cannot leave behind.",
      ],
    },
    {
      id: "PBI-84",
      story: {
        role: "editor user",
        capability:
          "have a superseded completion stop reading the disk, rather than have the request that superseded it wait behind a directory scan nobody is going to see",
        benefit:
          "typing quickly through a large directory does not queue one full scan per keystroke, and a cancelled request stops holding the directory handle it opened",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- FOUND BY REVIEW, NOT YET REFINED. The observation is in note 1 and the criteria are not written; this may not be planned until the cost is measured on a real directory and the release strategy is ruled.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "FOUND BY AN INDEPENDENT REVIEWER AGAINST SPRINT 82'S INCREMENT AND PRE-EXISTING TO IT, which is why it is a backlog item rather than that sprint's repair. THE FIRST STATEMENT OF THIS WAS FALSE AND A REVIEWER TOOK IT AGAINST THE DIFF: it said the range touches ONE line of that function's file region, an import, which is what a grep for four control-flow words returned rather than what the diff says -- `itemsFrom`'s ITEM CONSTRUCTION changed on several lines, this sprint's whole subject. WHAT IS ACTUALLY UNCHANGED, AND IT IS THE PART THAT CARRIES THE CLAIM: the `opendir`, the iteration and the yield are byte-identical to base 2ed9d43, and on the input that exhibits this -- a fragment matching nothing -- the changed construction is never reached at all.",
        "AND SPRINT 91 RETRACTED THE SLOWNESS HALF OUTRIGHT: the suite ran 1146 tests in 190s, over MORE tests than either reading below, so `five times slower between two greens` was TRANSIENT LOAD and is withdrawn. THE 25s CEILING IS NOT WITHDRAWN -- it still refuses arms on a busy machine, which is what remains of this item.",
        "SPRINT 90 SHARPENED THIS AND PARTLY REFUTED IT. With the five-day orphan killed, this machine's load fell from 15.7 to about 2.0 and the registry came back with only its two long-standing refusals where it had been throwing three to eight -- SO PART OF WHAT WAS FILED HERE WAS PBI-96 ALL ALONG. What survives is worse than a budget, and is the measurement this item now carries: THE SUITE TAKES 1328s WHERE SPRINT 88'S CLOSE TOOK 270s, and neither the increment (the three files added since were timed at about 24s together) nor the orphan (alive during that 270s run too) explains it. Something made this suite five times slower between two green readings and nothing here knows what.",
        "THE MECHANISM, AND THE PART THAT MAKES IT MORE THAN A MISSING CHECK. `itemsFrom` never reads `context.signal`; cancellation closes the OUTER generator, and a generator's `return()` cannot take effect while an outstanding `next()` is still running. A batch is yielded only when it FILLS, so a fragment matching nothing in a huge directory reaches no yield point at all: the scan runs to EOF, holding the handle, after the client has already been answered -32800 through tsudoi's own race. The user sees a prompt cancellation and the process goes on working.",
        "WHY IT IS NOT A ONE-LINE FIX, WHICH IS WHY THIS IS A DRAFT RATHER THAN A TASK -- and it said `REFINED` in an item whose own criterion says it is not. Abandoning a half-read directory LEAKS ITS DESCRIPTOR ON ONE OF THE TWO RUNTIMES -- the resolve half already carries that finding at its own cancellation seam and declines to honour a late cancellation for it. So the release strategy is the item, not the signal read: a signal-aware drain that stops classifying and batching while still exhausting or explicitly closing the iterator.",
        "AND ONE CHEAP HALF THAT MAY BE WORTH SPLITTING OUT: `entryKind` stats every entry a listing reports as neither file nor directory, so a directory of symlinks costs one syscall per entry per keystroke. That is disclosed at the site and is a separate trade from cancellation, but the same scan is where it is paid.",
      ],
    },
  ],
  completed: [
    {
      number: 97,
      pbi_id: "PBI-101",
      goal: "Sprint 97",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, TAKEN BY THE SCRUM MASTER RATHER THAN QUOTED FROM THE DEVELOPER, on the clean tree `3a73e17` WITH scrum.ts's own commit ALREADY IN IT -- a tighter tree than the Developer's own `60f1e7a` reading rather than a looser one. Definition of Done PASSED, all five checks exit 0: 1264 pass / 0 fail over 92 files, 410.08s, 5 non-gating warnings. The published surface was read directly: `NotificationContext`, `CustomRequestHandler`, `CustomNotificationHandler` and `CustomMethodMap` exported, and `CustomMethodEntry`, the declared `kind` and the required `gate` ABSENT.",
        "THE ITEM SHIPPED ON ITS SECOND SPRINT AND THE FIRST WAS NEVER RED. Sprint 96 was cancelled on shape with a green increment; sprint 97 kept its config refusal, stderr budget, registration plumbing, fixtures and the `BaseMethodContext` extraction, and replaced only the surface. The sentence-typed collision guard crossed unchanged and was RE-MEASURED under the function-valued map, which sprint 96's own note had asked for and which its entry shape had made impossible.",
        "TWO DEVIATIONS DISCLOSED BY THE DEVELOPER RATHER THAN FOUND AT REVIEW, and both are accepted as forced. Subtasks 1 and 2 SHARE a commit because no ordering leaves the suite green between them -- the type refuses every entry-object fixture the moment it changes, and config refuses every bare-function fixture until it changes. And subtask 4 carries NO commit, because every arm it owned already existed and passed once rewired; what it owed was a reading, which was taken.",
        "A DEFECT THE DEVELOPER CAUGHT ON ITSELF, recorded because the mechanism is the lesson: a docblock citing a tool version tripped `test/version-citations.test.ts`, and it was found by running the FULL suite rather than by re-running the two files that had changed. A targeted re-run would have shipped it.",
        "AND A PREDICTION CORRECTED BY MEASUREMENT: the `Promise<unknown>` weakening was expected to redden the map arm as well and does not, so its `alsoReddens` is empty. Recorded because the expectation was written before the reading.",
      ],
    },
    {
      number: 96,
      pbi_id: "PBI-101",
      goal: "A config author can declare `textDocument/didFocus` in their config and have tsudoi serve it -- as a request whose `null` answer is distinguishable from no answer, or as a gated notification -- while a name tsudoi already owns is refused before the server starts instead of silently shadowing a built-in.",
      status: "cancelled",
      subtasks: [],
      impediments: [],
      decisions: [
        "CANCELLED BY THE STAKEHOLDER AT REVIEW, ON THE SURFACE AND NOT ON A RED. Thirteen of thirteen subtasks completed across fourteen commits and the Definition of Done was NEVER RUN -- deliberately, because a green says nothing about a surface that is the wrong shape. The increment requires `{ kind, gate, handler }` per entry; the stakeholder wants a BARE FUNCTION per name, with `customMethodHandler<K>` available as an OPTIONAL annotation. They read a FIXTURE and said the shape was too far from what had been discussed.",
        "THE ROOT CAUSE IS A TRUE MEASUREMENT USED TO CLOSE A QUESTION IT DID NOT COVER, and it is the Scrum Master's error rather than the team's. MEASURED CORRECTLY: upstream hands a request handler `(params, cancellation)` and no id, so the KIND cannot be read off a message once it arrives. INFERRED WRONGLY FROM IT: that the kind must therefore be DECLARED. What was never checked is whether tsudoi must register on only ONE side -- and it need not. `requestHandlers` and `notificationHandlers` ARE SEPARATE MAPS, so one name registers on BOTH and upstream's own dispatch discriminates by the presence of the id. The entry object, the declared `kind` and every criterion resting on them follow from an inference the measurement never licensed.",
        "AND THE STAKEHOLDER SAID IT FIRST AND WAS ARGUED DOWN, which is the part worth carrying: `実行時はJSON RPCのidの有無で判定する` was correct, two rounds before the design hardened. It was answered with the id measurement, which was true and beside the point. A correction that arrives as an intuition against a measurement is the shape most likely to be dismissed here.",
        "NOTHING IN THIS REPOSITORY GRADES WHETHER A SURFACE IS ONE AN AUTHOR WOULD WANT TO WRITE. Every mechanism here answers `is this prose false` or `does this green measure anything`, and both stayed green throughout: the notes were accurate, the measurements real, the criteria discriminating. The design was settled entirely through questions about correctness and type mechanics, ERGONOMICS WAS NEVER AN ACCEPTANCE CRITERION, and refinement then optimised against notes that had already baked the entry object in.",
        "WHAT SURVIVES AND WHAT DIES, so the disposition is not re-derived later. SURVIVES: config.ts's own refusal block for a key outside the requestEntries loop, the per-method-per-session stderr budget with its swallow finding, the bare-string registration on both sides, the fixtures and test infrastructure, and the `BaseMethodContext` extraction. DIES: `CustomMethodEntry`, `CustomMethodMap`, the declared `kind`, the required `gate`, and PBI-101's criteria 2 and 5 as written. THE CODE DISPOSITION IS THE STAKEHOLDER'S AND IS NOT DECIDED HERE -- the fourteen commits stand in the tree unreverted.",
        "TWO QUESTIONS THE NEW SHAPE OPENS AND THE OLD ONE ANSWERED, recorded so they are not lost with it: a bare function has nowhere to declare a GATE, and one function serving both dispatch paths can carry only ONE context type -- so a notification handler is handed a signal that never aborts, or the shapes diverge again.",
      ],
    },
    {
      number: 95,
      pbi_id: "PBI-100",
      goal: "`completeCorpus` offers the words of EVERY document the client has opened, so the name a project uses everywhere except the screen the cursor is on is reachable -- and the package is renamed `tsudoi-completion-document` for the source both its handlers read.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE CLOSING READING, ON A CLEAN TREE THE INSTRUMENT NAMED -- `tree: 8ef0080`, with only this file's own commit after it. Definition of Done PASSED, all five checks exit 0: 1175 pass / 0 fail over 85 files, 246.31s, the one long-standing non-gating `eslint(require-yield)` warning. THE DURATION IS THE FIFTH READING IN THE SERIES AND BREAKS THE RUN OF THREE AT ~190s -- it is recorded WITHOUT AN EXPLANATION, because none was measured: this session ran the full suite and several perturbation sweeps back to back on the same machine, which is a candidate and not a finding.",
        "THE PACKAGE IS NAMED FOR ITS SOURCE AND NOT FOR ONE WINDOW. `around` named it after the only handler it had, so a handler reading every open document would have had to live in a second package -- splitting one question, `which words are already written`, across two installs an author makes together for no reason either could give. The stakeholder ruled the shape: one package, two verbs.",
        "THE MEMO'S KEY IS THE VIEW OBJECT AND NOT THE URI, WHICH IS CORRECTNESS AND NOT SPEED. tsudoi's own `DocumentStore` says a reopened document numbers from whatever the client sent at `didOpen`, so `close`, a rewrite on disk, `didOpen` AT VERSION 1 AGAIN is an ordinary sequence -- and a memo keyed on uri plus version would then serve the OLD file's words for the rest of the session with nothing to notice it. The store builds one frozen view per open and mutates the buffer UNDER it on every `didChange`, so identity is exactly `the same buffer, still open`. The filters are in the key too: nothing about a document changes between two requests passing different `minLength`s.",
        "MEASURED, FIVE DEGENERATE IMPLEMENTATIONS EACH REFUSED BY THE ARM NAMED FOR IT, run before the arms were believed: keyed on uri plus version reddens the reopen arm; the filters left out of the key reddens the two filter arms; nothing stored reddens the scan-count arm; reading only the asked document, and skipping it, each redden the first arm. AND THE PATTERN'S COMPARISON IS PINNED FROM BOTH SIDES -- looser reddens the correctness arms, stricter reddens the rebuilt-pattern arm, which exists because options reach a handler through an arrow that builds a fresh `RegExp` on every keystroke.",
        "THE URI-KEYED PERTURBATION REDDENED SIX WHERE ONE WAS PREDICTED, and the mechanism was read rather than the prediction widened: the five extra were each an arm opening a document at a uri another arm had already used, so a module-level uri-keyed table leaks ACROSS TESTS where an identity-keyed one cannot. That is this design's own rationale demonstrating itself, and it is now written at the table.",
        "PBI-99 HAS ITS SECOND INSTANCE AND IT WAS FOUND THE SAME WAY AS THE FIRST -- by walking through the hole. With `export { completeCorpus }` deleted from the member's `src/index.ts` and everything rebuilt, the suite read 1173 pass / 0 fail: a handler its own README instructs a stranger to import, unreachable by that bare specifier, with every check green. The member now owns an arm that reddens on that deletion, and it grades THE DECISION rather than THE ARTIFACT -- deliberately narrower than PBI-99, which is still the item and still unrefined.",
        "WHAT THE STAKEHOLDER ASKED FOR AND IS NOT BUILT, said here because the sketch was concrete: a `didOpen`/`didChange` handler to index in, a `tsudoi.schedule`, and a `lazy` stream yielding what is indexed so far. THE FIRST TWO DO NOT EXIST TO BE USED -- notifications are not a config's to handle, and the session object's write ends are closed by construction rather than by discipline. THE THIRD CANNOT BE EXPRESSED: a partial answer needs `isIncomplete`, and the completion row cannot say it, so a client would take the partial list as final. The memo is what buys what the sketch was after without touching any of that.",
        "A CATEGORY GAINED ITS SECOND MEMBER AND THE PROSE WRITTEN FOR THE FIRST WENT FALSE, swept before the code landed rather than found at review: `words.ts` said `what the handler adds is the WINDOW` and `the word nearest the top of the window`, both using the first member's name to mean the category. The package-level paragraph living inside `around.ts` moved to `index.ts`, which is where the package's identity belongs now that one handler is not the package.",
        "AND THE `unreachableClaims` ARM CAUGHT A COMMENT THIS SPRINT WROTE, which is the class this repository files most and the first time it was caught by a check rather than a reader: the measurement above cited a repository path, comments ship in `dist/` twice, and a stranger reading the tarball cannot resolve it. The citation is gone and the reading stayed.",
        "TWO PROSE CONTRADICTIONS WERE AUTHORED BY THIS INCREMENT AND FOUND BY REVIEW, not by any check. The member README told a reader that yielding `completeAround` first puts its words at the top of their list, and told them four paragraphs later that their editor ranks the list and nothing here sorts; the true claim is narrower and is the order tsudoi SENDS. And `scanned when its version changes and not otherwise` was contradicted by its own next sentence about the filters and silent about reopening.",
        "THE STAKEHOLDER'S OWN EDITOR IS THE ONE CONSUMER AND THIS SPRINT MOVES MORE THAN A NAME UNDER IT -- sprint 93 filed that their dotfiles pin every `@atusy/tsudoi-*` specifier to raw GitHub URLs and that the pins and the config must move together. A RENAME MAKES THAT SHARPER: the import map KEY changes, the URL PATH changes and the commit changes, so a partial bump is a resolution failure rather than a missing export. Neither this repository nor any check in it can see that file.",
      ],
    },
  ],

  definition_of_done: {
    checks: [
      {
        name: "Tests pass",
        run: "bun test",
      },
      {
        name: "Lint passes",
        run: "oxlint --format default --deny-warnings --report-unused-disable-directives-severity error",
      },
      {
        name: "Format check passes",
        run: "oxfmt --check .",
      },
      {
        name: "Type check passes",
        run: "tsc --noEmit",
      },
      {
        name: "Workspace members type-check under their own configs",
        run: "bun run scripts/typecheck-workspaces.ts",
      },
    ],
  },
  sprint: null,
  retrospectives: [
    {
      sprint: 97,
      improvements: [
        {
          action:
            "SPRINT 96'S FIRST IMPROVEMENT WAS APPLIED AND IT IS WHAT PRODUCED THIS SURFACE, so it is closed rather than carried. The rule was to render the author-facing surface as a config an author would write BEFORE building it. Four spellings were rendered and measured in the order the stakeholder proposed them -- a union with split contexts, one with a unified context, `Promise<unknown>`, `Promise<LSPAny>` -- and each was decided by a reading rather than by argument. THE COST OF THE RULE IS A FEW MINUTES OF PROBES; the cost of not having it was a cancelled sprint.",
          timing: "immediate",
          status: "completed",
          outcome:
            "The surface was settled before any of it was built, and the sprint that built it passed its Definition of Done on the first reading. The rule also caught what the stakeholder could not see from the type declarations alone: their own file type-checked because it had no USE SITE, and the failure appeared only once a config was written against it.",
        },
        {
          action:
            "SPRINT 96'S SECOND IMPROVEMENT WAS ALSO APPLIED -- state what a measurement does NOT cover in the same breath as what it does. Each of the four readings above was reported with its scope: `LSPAny` collapses the return axis and says nothing about the context axis; unifying the contexts closes the annotation cost and says nothing about `signal`. THE PROOF THAT IT MATTERED is that no single negative control grades all three collapses, which the Developer measured directly: unifying the contexts reddens the `signal` directive alone.",
          timing: "immediate",
          status: "completed",
          outcome:
            "The inference that cancelled sprint 96 -- a true id measurement licensing `the kind must be declared` -- was not repeated. The stakeholder's original intuition, that the runtime can tell by the id, is what the shipped design rests on.",
        },
        {
          action:
            "RUN THE FULL SUITE BEFORE BELIEVING A TARGETED GREEN, and this sprint produced a fresh instance rather than a restatement: a docblock citing a tool version tripped `test/version-citations.test.ts`, a file the change had no obvious relation to, and it was found ONLY because the whole suite ran. A re-run of the two files that had changed would have shipped it. THE CLASS IS `a check that grades a property of the tree rather than of a module`, and this repository has several -- readme coverage, version citations, uncovered files, the guard.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "THE PROJECT'S OWN GUIDANCE FILE CANNOT CARRY WHAT THIS SPRINT LEARNED, and that is now measured rather than suspected: `CLAUDE.md` is matched by a GLOBAL gitignore on this machine, so every correction made to it this sprint -- the customMethods surface, the annotation rule, the eviction trap, and five stale counts that had gone false -- is in NO COMMIT and reaches no other checkout. A fresh clone still reads the entry-object shape. THE TRACKABLE HOME IS `.claude/skills/`, which this repository already uses for exactly this purpose. Decide whether the load-bearing half moves there or whether the file is un-ignored.",
          timing: "product",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 96,
      improvements: [
        {
          action:
            "RENDER THE AUTHOR-FACING SURFACE AS A CONFIG AN AUTHOR WOULD WRITE, AND PUT IT IN FRONT OF THE STAKEHOLDER, BEFORE ANY OF IT IS BUILT. Sprint 96 settled a surface across many rounds of real measurement and shipped thirteen subtasks before the stakeholder saw what writing against it looked like -- and they saw it in a FIXTURE, which is simply the first artifact in the whole process that rendered the surface as code an author types. WHAT THIS IS NOT: a review step, or more attention. Sprint 47 already measured that attention pointed at a class still misses an instance of it. What failed here is that every question asked during design was answerable by measurement -- can the kind be read off the wire, does the conditional discriminate, what does the refusal print -- and NONE of them was `how much ceremony does this cost the person writing it`. A sketch answers that one and nothing else does. IT COSTS ONE FILE AND IT WOULD HAVE MOVED THIS SPRINT'S ENTIRE COST.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN A MEASUREMENT CLOSES A QUESTION, STATE WHAT IT DOES NOT COVER IN THE SAME BREATH. The id measurement here was true, reproducible and recorded -- and it licensed a conclusion two steps wider than itself, because `the kind cannot be read off an arriving message` was written down as `the kind must be declared`. The gap was the unexamined premise that tsudoi registers on ONE side. THE TELL WAS PRESENT AND WAS DISMISSED: the stakeholder's own intuition contradicted the inference two rounds before the design hardened, and was answered with the measurement rather than with a check of what the measurement covered. A correction arriving as an intuition against a measurement is the shape this project is worst at hearing, precisely because measurements outrank opinions here.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 87,
      improvements: [
        {
          action:
            "THE RUNNER PRINTS THE TREE IT GRADED, AND IT IS RUNNER-SHAPED FOR SPRINT 86'S REASON. A closing reading must name the commit it graded; THAT RULE FAILED TWICE IN THIS SPRINT and a REVIEWER caught it both times, which is evidence about DELIVERY and not about attention -- the rule was written down, in this file, and the hash simply was not to hand at the moment the sentence was written, so it was written from memory. A third rule would have the same delivery. What had no answer was `what did I just grade`, and now the report says. DIRTY IS PART OF THE READING RATHER THAN A WARNING ABOUT IT: a hash alone on a tree that does not match it reads as provenance for a green belonging to a state no commit holds, which is the harder error to notice afterwards. A directory outside git gets SILENCE, because this runner grades a directory.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective. One arm over all three states, written RED first. MEASURED against the real dashboard: a clean checkout prints `tree: <hash>` alone, and this tree mid-retrospective printed the DIRTY marker. THE STAGE HAD TO BE ISOLATED FROM THE MACHINE'S OWN GIT, measured rather than foreseen -- a bare `git init` there inherits the developer's GLOBAL hooks, and this repository's own commit hook refused the stage's commit over a file the stage does not contain.",
        },
        {
          action:
            "AN ARM IN `.claude/skills/writing-a-comment/SKILL.md`: the day a category gains its SECOND member, every sentence and every session-scoped flag written while it had one is suspect. THIS SPRINT'S TWO REAL DEFECTS ARE BOTH THAT SHAPE and both SHIPPED -- a stderr line reading `so this completion is answered` reached from every stream-driven row, and a `let reported = false` scoped to the session where the count is per method. Beside them, four sentences naming completion where a KIND was meant, and a MEASURED reading that had been true and became narrower than the property it sat under. THE ARM SAYS WHAT FINDS THEM: grep the FIRST member's NAME in the module that now serves both, and sweep every once-per-session flag, counter and cache there. AND IT SAYS WHAT DOES NOT -- this sprint ran a case-insensitive arity sweep over `five|six|seven` and not one of those sentences contains a number, because they ENUMERATE WITHOUT COUNTING.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
        {
          action:
            "WHAT IS NOT MECHANISED, NAMED SO ITS ABSENCE IS NOT READ AS COVERAGE. Nothing makes an author COPY the tree line into the record, and nothing compares a recorded hash against HEAD -- a check that parsed prose for a hash would be a green certifying that a sentence has provenance, which is the detector shape this project refuses by name. What is done is the smaller honest half: the hash is now in front of the reader at the moment they write the sentence. IF IT GOES STALE A THIRD TIME the answer is still not a rule -- it is that the record should quote the runner's own line rather than restate it.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Recorded rather than built, with the reason, per the header's mechanise-or-delete rule.",
        },
      ],
    },
    {
      sprint: 86,
      improvements: [
        {
          action:
            "`--only <substring>` ON `scripts/definition-of-done.ts`, AND IT IS DELIBERATELY NOT A THIRD SKILL. Sprint 85's retrospective answered a truncated capture with a skill arm; sprint 86 broke that arm IN THE COMMIT THAT ADDED IT, shipping a red `oxfmt --check` as the next sprint's baseline. The Product Owner ruled that as evidence about DELIVERY rather than attention -- the distinction this file's header rests on -- so the answer is runner-shaped. The runner already reports whole; what it had no answer for was `I only want to re-run one check`, so the route that loses verdicts was the only route there was. It reports exactly as a whole run does, and it MUST NOT pass for one: the declared order is load-bearing, the first check building what the fourth reads, so no subset's green is this Definition of Done's green. The marker is in the SUMMARY line as well as the header, because the reader it is built for is the one who took the LAST lines -- and it breaks the bytes `Definition of Done: PASSED`, so a habit built on grepping those finds nothing rather than a subset's answer. A substring matching no check is REFUSED for the reason an empty dashboard already is.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective. Five arms, each written RED first with the red observed; one weakening entered the perturbation registry and reads HELD. MEASURED against the real dashboard: `--only format` exits 0 running that check alone with both lines marked, and `--only nosuchcheck` exits 1 naming the substring and listing every declared check. The sprint's own failure is now servable by the sanctioned route.",
        },
        {
          action:
            "WHAT IS NOT MECHANISED, NAMED SO ITS ABSENCE IS NOT READ AS COVERAGE: nothing forces the sanctioned route. `--only` removes the REASON to run a bare check by hand; it cannot stop anyone. Per this file's header the alternative was to delete the improvement rather than write a rule nobody enforces -- the breach is survivable and was caught inside the sprint both times -- and what is done instead is the smaller, honest half: the cheap route now exists and is discoverable. If a third instance arrives, the next answer is not another rule either.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Recorded rather than built, with the reason, per the header's mechanise-or-delete rule.",
        },
      ],
    },
    {
      sprint: 85,
      improvements: [
        {
          action:
            "AN ARM IN `.claude/skills/recording-a-measurement/SKILL.md`: a run piped through `tail` is not a reading you took. MEASURED THIS SPRINT AND THE COST WAS TOTAL -- a Definition-of-Done run reported `Tests pass -- exit 1` on content byte-identical to trees green immediately before and twice after, and WHICH test failed is now unknowable, because `bun test` prints its named failures ABOVE the summary and the tail kept only the summary. There was nothing left to call a flake or a defect, so it could honestly be called neither. The arm says capture whole to a file and grep the file, and gives the reason specific to this suite: the tail is exactly the half that says HOW MANY and the head is exactly the half that says WHICH.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
        {
          action:
            "AN ARM IN `.claude/skills/writing-a-comment/SKILL.md`: a residue you accept is a question about a WINDOW, not about one message. This sprint's accepted-residue paragraph was true, argued, and named the one inhabitant its author had thought of -- a dropped notification. A second `initialize` in the same window was ACCEPTED and ran the whole handshake twice; an `exit` in it kills the in-flight handler with no response and no cleanup. Neither was reached from the paragraph already written about the window they arrive in. The arm asks for the enumeration -- every request, every notification, the lifecycle's answer for each -- and gives two tells that you are writing this shape: the sentence names a DURATION rather than a message, and it argues safety from what the SPEC forbids a client to do, which bounds WHO arrives and says nothing about what happens when a non-conforming one does.",
          timing: "immediate",
          status: "completed",
          outcome: "Applied within the retrospective, being a skill arm on non-production text.",
        },
      ],
    },
    {
      sprint: 84,
      improvements: [
        {
          action:
            "TWO ARMS IN `.claude/skills/writing-a-test/SKILL.md`, both on the fixture rather than on the assertion, which is where this sprint's findings actually landed. ONE: an arm asserting a value CUT from a string at a delimiter must drive a fixture holding that delimiter at least TWICE, or a cut at the first and a cut at the last are the same string and the arm grades neither. IT WOULD HAVE CAUGHT THE SPRINT'S LARGEST FINDING at the commit that wrote the arm rather than two review stages later. TWO: the sprint-44 block asked in advance what would refute `author-caught is detection, not defect` -- an instance found by someone other than its runner -- and this sprint supplies two, so the block is amended rather than left standing having been told. WHAT NEITHER COVERS: any transformation that is not a cut, and the general case of a fixture too simple to exercise what its arm claims, which nothing here reduces to a rule.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective at 76b606f, being skill arms on non-production text.",
        },
        {
          action:
            "`PerturbationRecord` GAINS A REQUIRED GREEN in test/helpers/perturbation.ts: the arms a record's discrimination RESTS ON, which `read()` must find in the report AND find passing. Today a control is enforced only by ABSENCE from `alsoReddens`, and absence cannot tell a control that stayed green from one that no longer exists -- delete the single-segment arm and both label records still report HELD with the discrimination gone. Found by the review round, and the record's own comment currently confesses it in prose, which this dashboard's header says is not a record at all. WHAT IT WOULD NOT COVER: a control that exists, passes, and grades nothing -- the same judgement `redAt` cannot make one level down.",
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
