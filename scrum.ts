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
        "FOUND BY AN INDEPENDENT REVIEWER AGAINST SPRINT 82'S INCREMENT AND PRE-EXISTING TO IT, which is why it is a backlog item rather than that sprint's repair. MEASURED: `git diff` over the sprint's whole range touches ONE line of that function's file region -- an import -- so the exposure is byte-identical to base 2ed9d43 and older than the field move.",
        "THE MECHANISM, AND THE PART THAT MAKES IT MORE THAN A MISSING CHECK. `itemsFrom` never reads `context.signal`; cancellation closes the OUTER generator, and a generator's `return()` cannot take effect while an outstanding `next()` is still running. A batch is yielded only when it FILLS, so a fragment matching nothing in a huge directory reaches no yield point at all: the scan runs to EOF, holding the handle, after the client has already been answered -32800 through tsudoi's own race. The user sees a prompt cancellation and the process goes on working.",
        "WHY IT IS NOT A ONE-LINE FIX, WHICH IS WHY THIS IS REFINED RATHER THAN DONE. Abandoning a half-read directory LEAKS ITS DESCRIPTOR ON ONE OF THE TWO RUNTIMES -- the resolve half already carries that finding at its own cancellation seam and declines to honour a late cancellation for it. So the release strategy is the item, not the signal read: a signal-aware drain that stops classifying and batching while still exhausting or explicitly closing the iterator.",
        "AND ONE CHEAP HALF THAT MAY BE WORTH SPLITTING OUT: `entryKind` stats every entry a listing reports as neither file nor directory, so a directory of symlinks costs one syscall per entry per keystroke. That is disclosed at the site and is a separate trade from cancellation, but the same scan is where it is paid.",
      ],
    },
    {
      id: "PBI-83",
      story: {
        role: "editor user",
        capability:
          "read a highlighted path item's popup as LABELLED FACTS and a headed list -- `source:`, `size:`, `lastModified:`, then the entries -- instead of a rule-separated pile whose middle line packs three facts into one dot-separated sentence",
        benefit:
          "the fact I want is found by its label rather than by counting fields, and a directory's contents are announced by a heading that says how many of how many I am being shown",
      },
      acceptance_criteria: [
        {
          criterion:
            "PLACEHOLDER -- THE SHAPE IS THE STAKEHOLDER'S AND THE CRITERIA ARE NOT WRITTEN YET. This item enters refinement with the target block quoted in note 1 and the open questions in notes 2 to 5; it may not be planned until each of those is ruled and the criteria replaced.",
          verification: "None. This criterion exists to keep the item out of Sprint Planning.",
        },
      ],
      status: "draft",
      notes: [
        "THE STAKEHOLDER'S BLOCK, QUOTED RATHER THAN PARAPHRASED, because every open question below is a question about which bytes it does not show: `source: cwd` / `size: 1062 bytes` / `lastModified: 2024-06-19T12:00:00Z` / blank / `# Entries (first 20 of 67)` / blank / `- ...`. THREE THINGS CHANGE AT ONCE -- the facts become LABELLED and are separated by ONE newline rather than by a rule, the stat's three facts stop being one dot-separated sentence, and the listing gains a HEADING carrying `first N of M` in place of a sentence carrying `M entries, first N shown`.",
        "THE ONE CONSEQUENCE THE BLOCK DOES NOT STATE, AND IT IS THE ITEM'S REAL DECISION. Today the stat line opens with the WORD `file` or `directory`, and sprint 82 landed two arms that tell a stat-driven answer from a `kind`-driven one by reading it. In the quoted block that word is GONE: a directory would carry no `size:` line, so the kind is legible only by ABSENCE, and absence is what a defect looks like. THE PROPOSAL THIS ITEM CARRIES INTO REFINEMENT is a `kind: file` / `kind: directory` line, which is the stakeholder's own label style applied to the fact their example happened not to need. IT IS NOT ASSUMED -- the alternative is to accept the weakening and say so at the arms.",
        "WHAT THE PLAINTEXT SPELLING IS, WHICH THE BLOCK CANNOT SHOW BECAUSE IT IS THE MARKDOWN ONE. `# Entries` and `- ` are markdown; this package answers PLAINTEXT to any client that did not name markdown, and sprint 82 just migrated the arm grading that difference. A format whose two spellings differ only in bytes nobody looks at makes that arm vacuous again.",
        "WHAT `lastModified` IS IN, WHICH THE EXAMPLE ANSWERS AMBIGUOUSLY. The quoted value has no fractional part; `Date.prototype.toISOString` always emits milliseconds. So either the value is truncated -- a decision, since it discards what the fixture's own stamp control relies on -- or the example is shorthand. Ruled at refinement, not guessed.",
        "AND THE HEADING WHEN NOTHING IS TRUNCATED. `first 20 of 67` reads badly at `first 67 of 67`, and today's sentence already switches spellings on that boundary. The empty directory is the same question one step further.",
        "WHAT THIS ITEM MUST NOT BREAK, EACH ONE LANDED BY SPRINT 82 AND EACH ONE CHEAP TO BREAK HERE. The PREFIX relation -- the completion block must stay a strict prefix of the resolved one, which survives a one-newline join and dies if anything is inserted before `source:`. The DIRECTORY-CARRIES-NO-BYTE-COUNT ruling, which `size:` makes easier to violate by making it uniform. And BOTH `listingSection` helpers, re-derived last sprint to locate the listing by its header -- a new heading moves that header and the helpers move with it, which is where the sprint-82 anchor showed that a wrong lookup goes GREEN.",
      ],
    },
    {
      id: "PBI-82",
      story: {
        role: "editor user",
        capability:
          "read WHICH FILE a path candidate points at from the completion list itself, and read its size, its date and -- for a directory -- what is inside it in the popup when I highlight one",
        benefit:
          "two same-named candidates offered by different roots are told apart without a documentation window, and the only property my client has to honour when it arrives late is `documentation`",
      },
      acceptance_criteria: [
        {
          criterion:
            "Every item `pathCompletion` yields carries the absolute path it completes to in `detail`, and carries the source that offered it in `documentation` AND NOTHING ELSE -- both present before any `completionItem/resolve` is sent, so a session that never resolves still names the file. Falsified by an item with no `detail`, and by one whose `documentation` still opens with the path.",
          verification:
            'bun test -t "each item names the file it resolves to and the source that produced it", whose whole-value equality widens from `documentation` to THE PAIR; plus the pre-resolve read in test/resolve-path-stat.test.ts, which asserts `detail` is absent today and must assert the path is already there.',
        },
        {
          criterion:
            "For an item this package's completion produced, the resolve answer differs from the item it was sent in `documentation` and IN NO OTHER PROPERTY -- `detail` byte-identical included. Falsified by a handler that writes any `detail` at resolve, by one that drops the `textEdit`, by one that re-encodes the mark.",
          verification:
            "bun test test/resolve-path-stat.test.ts on both runtimes: the file arm and the directory arm compare the WHOLE answer as `toEqual({ ...item, documentation })`, which is the shape a written `detail` reddens.",
        },
        {
          criterion:
            "A resolved FILE's `documentation` states its size in bytes and its modification time; a resolved DIRECTORY's states that it is a directory and its modification time, CARRIES NO BYTE COUNT, and then its listing. Falsified by a handler saying `file` about everything, and by one reporting a directory's own entry size -- 64 on one machine and 4096 on the next, which is the ruling the `not.toContain(\"bytes\")` line exists for and which goes SILENTLY GREEN if it is left reading a `detail` that is now a path.",
          verification:
            'bun test -t "a directory item comes back saying it is a directory, and carrying no size" re-sited onto the stat line inside `documentation`, THEN perturbed: the stat composer\'s directory arm made to report `stats.size` must redden it -- NAMED BY WHAT IT COMPOSES AND NOT BY ITS SYMBOL, since the sprint executing this criterion renamed `detailFor` to `statLine` and left the criterion citing a name the tree no longer has. A green taken without that perturbation does not meet this criterion.',
        },
        {
          criterion:
            "The block only ever GAINS: the `documentation` the completion sent is a strict PREFIX of the `documentation` resolve answers with, for BOTH kinds -- so nothing the user has already read moves position when the popup re-renders. Falsified by putting the stat in front of the source. It also retires an admitted weakness: a file's block is no longer byte-identical across resolve, so `a directory item's block carries what is inside it` stops being satisfiable by a passthrough.",
          verification:
            "bun test -t \"a directory item's block carries what is inside it, while a file item's block is unmoved\" -- the arm holds the completed item and the resolved answer in one session, and the prefix relation is one assertion over the two values it already has. The title inverts and is renamed with it.",
        },
        {
          criterion:
            "A filename holding a line break or a control character cannot put a raw break into ANY field this package renders, `detail` now included. Falsified by handing the path to `detail` unflattened -- which is the default outcome, since the path leaves the composer that owns `flattened()`.",
          verification:
            'bun test -t "a path whose own name would forge an attribution line renders as one that cannot", widened to read `detail`, plus its completion-half pair, since the completion half now renders the path too.',
        },
        {
          criterion:
            "Two workspace folders' items are still told apart BY THE ITEM ITSELF. Falsified by the state this change produces if nothing is re-sited: both items' `documentation` becomes the identical string `source: workspace`, and the arm degenerates to `two items exist` while staying green.",
          verification:
            'bun test -t "every workspace folder is answered from, and its items name their root" with the discriminator moved onto `detail`, THEN perturbed: `sourcesFor` keeping only the first folder must redden it.',
        },
        {
          criterion:
            'An item this package did not produce, and an item whose path has gone, still come back byte-identical to what was sent, with nothing on stderr -- and the arms saying so still WITNESS THAT ENRICHMENT WAS HAPPENING IN THAT SESSION. Falsified by a handler enriching anything carrying `data`, and equally by a liveness half left reading `typeof detail === "string"`, which completion now satisfies unconditionally.',
          verification:
            'bun test -t "an item the example never produced is returned untouched, in a session where enrichment is happening" and bun test -t "an item whose file is deleted between completion and resolve comes back unenriched rather than failing", each liveness half re-read as a `documentation` DELTA and deliberately not as an equality -- the arm\'s own docblock rules it weaker than a pin on purpose.',
        },
      ],
      status: "ready",
      notes: [
        "THE THREE QUESTIONS THE DEVELOPER SAID BLOCKED WRITING THE RED TESTS ARE RULED HERE, because two of them the stakeholder already answered and the third has only one safe answer. ONE, the post-resolve part order is `source -> stat -> listing`, which is what makes criterion 4's prefix relation true. TWO, the absolute path is NOT also left in the block -- `detailにパス` is the whole of the instruction, and a path in both fields would make criterion 4 hold vacuously. THREE, `detail` IS flattened: the path leaves the composer that owns `flattened()`, so the line-break injection the forgery arm exists to refuse reopens in a field nothing sanitises. That third is a behavioural ruling the proposal did not make and is taken as the conservative one.",
        "TWO HELPERS ARE MIS-INDEXED BY THIS CHANGE AND BOTH GO GREEN WHEN THEY ARE WRONG. `listingSection` exists twice -- in the member suite and in test/resolve-path-stat.test.ts, duplicated deliberately with a docblock saying the two MUST NOT DISAGREE -- and both locate the listing as part index 2, derived from `path, source, listing`. Under `source, stat, listing` the index is right BY ACCIDENT. AND IT IS ALREADY WRONG TODAY, WHICH IS THE ANCHOR THIS SUBTASK IS WRITTEN FROM RATHER THAN A PREDICTION ABOUT THE CHANGE: `documentationFor` pushes the source part ONLY WHEN IT IS DEFINED, so a FORGED source makes the parts `path, listing` and the listing sits at index 1. Post-change that same item is `stat, listing` -- index 1 again. Re-deriving them to locate the listing by its own header, against TODAY's composition and before any behaviour moves, is the first subtask for that reason: without it a re-index defect and a composition defect are indistinguishable in every red that follows.",
        'WHAT THE MEMBER SUITE\'S FIXTURE MUST GAIN, AND IT IS THE LARGEST PIECE OF WORK NOBODY WOULD PREDICT. Nearly every member arm compares WHOLE `MarkupContent` values and its own docblocks refuse weakening them. They are stable today only because the volatile part -- `modified <iso>` -- lives in `detail` and is read through `.split(" · ")[0]`, never whole-value. Put the stat in the block and every one depends on an mtime `test/helpers/tree.ts` does not control. The root suite is already immune: it fixes the stamp with `utimesSync`. SO THE FIXTURE CHANGES AND THE ASSERTIONS DO NOT -- children written FIRST and stamps set after, because writing into a directory bumps its mtime, and a whole second because filesystems disagree about sub-second precision.',
        "ONE ARM'S SUBJECT DOES NOT SURVIVE AT COMPLETION TIME AND IS MIGRATED RATHER THAN REPAIRED. `the documentation format follows what the client declared, both ways` turns on a `---` rule appearing in markdown and not in plaintext; with the completion block reduced to ONE part there is no join to perform, so the two formats produce IDENTICAL value bytes and only `kind` discriminates. The claim moves to the resolve suite, where two or three parts remain. Recorded because the arm will otherwise be read as merely needing new expected strings.",
        "`completedSource` STAYS, DECIDED BY AN EXISTING ARM RATHER THAN BY PREFERENCE. The source is not derivable from the path -- one file is reachable from the document's directory, the cwd, a workspace folder and an absolute fragment at once -- and the only way to drop it is to APPEND to the documentation the client sent back, which the tamper arm forbids for both kinds. The mark stays the sole key: READING THE PATH OFF `item.detail` NOW THAT IT IS THERE IS THE EDIT TO REFUSE, `detail` being a display field a client may rewrite.",
        "`documentationFor`'s BYTE-FOR-BYTE CLAUSE IS DISSOLVED, NOT PATCHED. It says the two halves must agree byte for byte about an item nothing was learned about; under this change resolve ALWAYS learns the stat -- a failed stat returns the item untouched -- so there is no such item and the sentence has no referent. What replaces it is criterion 2 plus criterion 4, and the composer stays shared for the source line and the markup rules. The same claim is restated in `itemsFrom`'s comment and in the completion suite's mark docblock; all three move together.",
        "THE ARGUMENT FOR, AT ITS STRONGEST: the free fact arrives late and the expensive one arrives early. Which of four roots offered a candidate, and which file it actually is, are known when the item is built and cost no syscall -- and are legible today only in a window the completion suite's own comment flags as optional. The stat is the only thing here costing a syscall. This puts the free fact in the eagerly-rendered field and the expensive one in the lazy one.",
        "THE SECOND ARGUMENT IS REASONED AND ITS PREMISE WAS MEASURED. `textDocument.completion.completionItem.resolveSupport.properties` lists which properties a client honours when they arrive from resolve, so a client naming `documentation` alone silently drops a `detail` first appearing at resolve -- today's stat line. MEASURED, ripgrep over the whole checkout: `resolveSupport` has ZERO matches, so nothing here reads it and NO CRITERION MAY LEAN ON IT. Criterion 2 delivers the same robustness by asserting our own answer's shape instead.",
        "THE STRONGEST RISK, AND IT IS NOT DECIDABLE FROM INSIDE THIS REPOSITORY, SO IT IS RECORDED RATHER THAN RESOLVED. `detail` renders INLINE, and inline is where clients truncate. An absolute path's discriminating part is its TAIL -- exactly what truncation eats -- so this can fail to deliver the disambiguation it is motivated by while giving up a stat line that fits inline well. THE PRODUCT OWNER HELD THE ITEM AT `refining` FOR THIS; the facilitator ruled it `ready` because the stakeholder stated the design as an instruction rather than as a question, and because the criteria's SHAPE does not depend on the answer. A SHORTENED path -- relative to the source's root -- is the alternative and is deliberately NOT drafted: it would make `detail` name a DIFFERENT FILE from the one `data.pathCompletion` names, and the resolve half stats the mark. THE IDENTITY IS NOT THE REASON AND WAS WRITTEN AS ONE UNTIL A REVIEWER TOOK IT AGAINST CRITERION 5: flattening already breaks byte-identity for any name carrying a control character, deliberately, so `the two fields are the same string` was false in this item's own text the moment it was drafted. What survives is the REFERENT -- both must name the same file -- which a relative spelling breaks and flattening does not. Reopen as a new item if the trade turns out badly in a real editor.",
        "THE PLAIN READING OF `弄らず` IS TAKEN: resolve writes NO `detail` at all, rather than rebuilding an identical one from the mark. Rebuilding buys nothing -- the path in the block was ALREADY taken from the forgeable mark, which the member suite states as a deliberate position -- and the tamper arm corrupts `documentation` only. DISSENT-WORTHY BECAUSE IT MOVES A USER-VISIBLE FIELD OUT OF `the answer is built from what the handler read`: after this, one field the user reads is the client's own copy coming back.",
        "WHAT NOTHING WILL CHECK, SAID SO THE GREENS ARE NOT OVER-READ. The member README's PROSE about which field carries what is graded by nothing -- `readmeCoverage` accounts for FENCED BLOCKS and this claim is not in one -- so it is in scope as WORK and out of scope as a CRITERION. `test/perturbations.test.ts` re-runs the member's resolve suite as a baseline, so that file may not be left red across a commit boundary.",
      ],
    },
  ],
  completed: [
    {
      number: 81,
      pbi_id: "PBI-81",
      goal: "The `Omit` hazard is decided site by site on a reading of who actually reddens -- the arms keep the CONSEQUENCE WALK-THROUGH, the source keeps the decision plus the asymmetry the decision rests on -- and the skill gains the exit a still-true comment has never had. S3: THIS GOAL SAID `the source keeps only the decision nothing can grade` AND THE INCREMENT REFUTED IT. src/notifications.ts:113 still states the hazard and the `Omit`/`Pick` asymmetry, both of which the probes and `BoundaryIsTheObservingMembers` also carry. THE ITEM'S OWN CONSTRAINT FALSIFIED THE ITEM'S OWN GOAL: criterion 1 required the referent of the pointer reading `the silent no-op that type already documents` to survive, so the hazard sentence could not go. T7: THIS SAID `:176`, WHICH 60ff308 HAD ALREADY MOVED TO :179 BEFORE THIS SENTENCE WAS WRITTEN -- so the citation was stale on arrival, and it is replaced by the pointer's own words, which a grep finds wherever it lands. Corrected on the measurement rather than left, because a goal that misdescribes its increment is read as the increment.",
      status: "done",
      subtasks: [
        {
          test: "MISSPELL ONE KEY INSIDE THE `Omit` and read WHICH ARMS REDDEN AND IN WHICH CHECK, at base and again after the edit, requiring the same arms by name. The item's `three of the four are graded` is a READING until this runs, and the before/after pair is what makes `the arm keeps it` a measurement rather than an argument at review.",
          implementation:
            "The narrowing of the `RequestOnlyConnection` docblock in packages/tsudoi-language-server/src/notifications.ts. WHAT GOES: the consequence walk-through, which the PROBES and `BoundaryIsTheObservingMembers` grade -- S2 corrected `the pins and the probes` here, because `ProtocolConnectionHasTheseMembers` is silent under a misspelling and grades none of it. WHAT SURVIVES: the asymmetry clause, the `Pick` preference, the churn reasoning and the reversal condition -- a code-edit decision whose only legitimate home under the Lifetime Rule is that site -- with the two pins NAMED at :117. Zero edits at the pointer reading `the silent no-op that type already documents`, at the `Pick` foreclosure site, and in test/notifications.test.ts. U1: THESE WERE LINE RANGES AND EVERY ONE OF THEM WENT STALE INSIDE THIS SPRINT, most of them moved by this sprint's own repairs -- they are replaced by the text each names, which a grep finds wherever it lands.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "72f93b9",
              message: "refactor(notifications): the Omit hazard's analysis lives where it reddens",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE READING BEAT THE PREDICTION AND THE READING WINS, WHICH IS WHY THE SUBTASK ASKED FOR ONE. Predicted at planning: two bun arms plus TS2344 under `tsc --noEmit`. MEASURED, `onUnhandledNotification` misspelled as `onUnhandledNotifcation` inside the `Omit`, at base ae35bb9 and again on the narrowed text -- IDENTICAL BOTH TIMES, 942 pass / 3 fail against a clean 945 / 0: `the narrowed connection rejects onUnhandledNotification and accepts onRequest, in one type-check` and `the same two outcomes hold for onUnhandledNotification through an alias under a different name`, both test/notifications.test.ts, AND A THIRD NOBODY NAMED -- `an unbuilt checkout's root type check is non-zero and names a workspace package it could not resolve`, test/unbuilt-checkout.test.ts, which stages a checkout and runs tsc inside it and so REPORTS THE TS2344 THROUGH bun test. `tsc --noEmit` separately: exit 1, TS2344 at test/notifications.test.ts(550,3), `BoundaryIsTheObservingMembers`.",
            "THAT THIRD ARM QUALIFIES A PLANNING PREMISE WITHOUT REOPENING ITS DECISION. The reason given for building no perturbation record was that a record holds the bun half and not the TS2344 half; the TS2344 half turns out to be inside bun test already, through a second file. NO RECORD WAS BUILT ANYWAY and none is proposed -- the re-runner runs an arm file, and the arm that would carry this one is in test/unbuilt-checkout.test.ts, whose subject is the unbuilt checkout and not this boundary.",
            "READING 2, THE RE-GREP OF `silent no-op` AND `MISSPELL` READ AS A LIST. F5: `unchanged in MEMBERSHIP` STOOD HERE UNQUALIFIED AND IS TRUE ONLY OF THE INSTRUMENT AND THE FILE SET IT WAS TAKEN OVER. MEASURED, ae35bb9 against HEAD: over tracked files EXCLUDING scrum.ts, that instrument returns the SAME members both times -- src/notifications.ts:113 and :176, test/notifications.test.ts:506, :507, :535, :663, :664, test/package-shape.test.ts:60. WIDEN EITHER AXIS AND IT MOVES. Case-insensitive `misspell` LOSES A MEMBER, and it is the deleted walk-through itself, base src/notifications.ts:114 `so the misspelling compiles at 0`. Including scrum.ts, `silent no-op` GAINS THIS NOTE AND THE ONE AFTER IT AND NOTHING ELSE -- T5: this said it also gained `decision 5's restatement`, and decision 5 CARRIED THE LITERAL AT BOTH ENDS, at ae35bb9:857 and now :886. A member that was always there was counted as arriving, in a note whose whole subject is reading a list at two endpoints. So the honest claim is that the SOURCE-AND-TEST HAZARD SITES are unchanged, which is what the narrowing was answerable for.",
            "F5's SECOND HALF, PARTLY REFUTED ON A MEASUREMENT. The enumeration was said to omit members present at both ends. ONE OF ITS FIVE CITATIONS HOLDS -- scrum.ts:131, which carries the literal at both ends and which the list left out. BUT THE LIST WAS SHORT BY MORE THAN THAT CITATION FOUND, T5: decision 5 is also a both-ends member and is also missing from it, and nobody cited it. So the finding was right that the enumeration was incomplete and understated by how much, which is the opposite error from the one this note was written to correct. THE OTHER FOUR DO NOT MATCH THE INSTRUMENT THIS NOTE DESCRIBES -- .claude/skills/recording-a-measurement/SKILL.md:253, test/guard.test.ts:97 and those in test/published-artifacts.test.ts all spell `misspell` in LOWER CASE, and the instrument is `MISSPELL` upper-case or `silent no-op`. They are members of a case-insensitive sweep and of no list taken here. Recorded because a finding measured against a different instrument than the note it corrects is the same confusion in the other direction.",
            "READING 3, THE `Pick` FORECLOSURE SITE IN src/notifications.ts -- T8 DROPPED `THE SIXTH SITE` HERE, an ordinal over a set the same prose says its instrument cannot enumerate -- DECIDED EXPLICITLY BECAUSE THE RE-GREP PROVABLY CANNOT REACH IT: it RESTATES the premise -- `Pick` forecloses by what is LISTED rather than by what the base type happens to contain -- and does NOT dangle, since it points at nothing. Left untouched, and its existence is EVIDENCE THE NARROWING HAD TO KEEP THE ASYMMETRY CLAUSE: two live decisions, the `Pick` preference in the `RequestOnlyConnection` docblock and the refusal to serve on `Connection` in `createGatedConnection`'s, now both explain themselves by it.",
            "FILED AND NOT REPAIRED, WHICH DECISION 6 RULED IN ADVANCE, AND NAMING THE PINS MADE IT SHARPER RATHER THAN NEUTRAL. `IF EITHER PIN IS REMOVED OR WEAKENED` is true, but the site now hands a reader two SYMBOLS and invites the check that planning refused to run: perturb `ProtocolConnectionHasTheseMembers` and, ON DECISION 2'S READING AND NOT ON ONE TAKEN HERE -- IT WAS FORBIDDEN AND WAS NOT RUN -- nothing about the misspelling hazard moves, so a reader checking that way reads the sentence as false. What THIS sprint measured is consistent with it and does not establish it: pin 2 is silent under the misspelling in every arm listed above. F8 NOW MEASURES BOTH PINS AND NARROWS THIS NOTE'S OWN FIRST ACCOUNT OF THEM, which said pin 1 moves when the `Omit` moves. THAT IS TOO WIDE. MEASURED HERE, pin 1 deleted: with `trace` misspelled the two `trace` probes STILL REDDEN and `tsc --noEmit` is silent, so for the misspelling hazard THIS PARAGRAPH OPENS WITH, pin 1 is REDUNDANT WITH THE PROBES. With a SURPLUS key `sendNotification` added instead, nothing reddens at all -- 22 pass / 0 fail in test/notifications.test.ts and `tsc --noEmit` silent -- while the same surplus key against pin 1 PRESENT names TS2344 at test/notifications.test.ts(550,3). SO PIN 1'S SOLE CONTRIBUTION IS THE SURPLUS-KEY DIRECTION. U2: THIS SAID THE DOCBLOCK `NEVER NAMES` IT, AND 60ff308 THEN PUT `a SURPLUS key` IN THAT DOCBLOCK -- a note describing the source as it stood before this sprint's own repair, which is the coupling that ended the review loop. `IF EITHER PIN IS REMOVED OR WEAKENED` stays TRUE -- a surplus key is a real hazard only pin 1 catches -- but the paragraph opens on the misspelling and so points a reader at the one hazard the condition does not hold for. FILED AND NOT REPAIRED AT THE TIME, WHICH DECISION 6 RULED IN ADVANCE -- AND S2 SUPERSEDED THAT: a fresh reviewer read the connective as an assertion about WHICH PIN DEFENDS WHAT, and as an assertion it is false, so it was repaired at 60ff308. `FILED AND NOT REPAIRED` above and `STAYS TRUE AND STAYS UNREPAIRED` in bc171fd's body are both DEAD as of that commit; the body is not amended, under the same ruling that kept 72f93b9's. WHAT MOVED IS THE ANTECEDENT ONLY -- the asymmetry, the preference, the churn reasoning and the reversal condition are the product owner's SURVIVES list and are untouched. The pin 2 direction WAS run by a reviewer this round and is theirs, not taken here: pin 1 alone, `onBrandNewTrafficObserver` added to `ProtocolConnection` by declaration merging, exit 0 -- the member lands silently on `RequestOnlyConnection`, confirming pin 2 sole in the DEPENDENCY direction. U2 AGAIN: `the complementarity argument lives ONLY at test/notifications.test.ts:565-570` stood here until 60ff308 put both directions and the reversal condition in the docblock itself, so the word ONLY was falsified by this sprint's own repair rather than by anything upstream.",
            "AND 60ff308's BODY QUOTED A BYTE FIGURE I NEVER TOOK -- `607 to 750` -- WRITTEN BEFORE THE MEASUREMENT AND NOT CORRECTED AGAINST IT. AND THE FIGURE THAT REPLACED IT WAS ALSO WRONG, T6: `818 over twelve` counted the closing `*/` line, which the earlier readings excluded, so the correction was not comparable to the thing it corrected. MEASURED NOW OVER ONE RANGE, `A MISSPELLED KEY HERE` through `Pick needs neither of them.`, at all three commits: 8 lines at ae35bb9, 8 at 72f93b9, 11 at HEAD. THE LINE COUNT CARRIES THE POINT AND THE BYTE FIGURE IS DROPPED -- it has now been written wrong twice and added nothing either time. The commit body is not amended, under the ruling that a body records what was believed. FOURTH NUMBER THIS SPRINT PUT IN PROSE WITHOUT BEING TAKEN, and this one was inside the repair of the third.",
            "THE SITE DID NOT GET SHORTER, AGAINST DECISION 3'S PREDICTION: eight comment lines before and eight after. The walk-through's removal paid for the two pin names almost exactly. Recorded because the prediction is in the record, and decision 3 now carries the same reading rather than still asserting the prediction as fact.",
            "F7. A FORECLOSED-ALTERNATIVE PARAGRAPH IN 72f93b9's AND 1e88941's COMMIT BODIES IS FALSE, RECORDED HERE AND NOT AMENDED. It says `Pick needs neither of them` stops parsing the moment `K extends keyof T` goes. MEASURED: `K extends keyof T` has ZERO hits anywhere in the tree at ae35bb9 -- 72f93b9 INTRODUCED IT. At base the sentence read `IF EITHER PIN IS REMOVED OR WEAKENED, CONVERSION BECOMES REQUIRED. Pick needs neither of them`, where `them` is the two pins named in the preceding clause, which decision 1 independently settles. So the over-deletion trap was real as a warning about the ASYMMETRY CLAUSE and false as stated about that sentence, and it was carried into a commit body as measured. NOT AMENDED, under sprint 73's ruling that a commit message records what was believed when it was written; the record is the correction's home. The SKILL.md version says `the clause you took` and names nothing, so it is generic and stays.",
            "F1. THE FORMAT RED WAS MISFILED AND THE MISFILING IS WHAT THIS NOTE IS FOR NOW. It read ENVIRONMENT FINDING, PRE-EXISTING, a toolchain-version disagreement about where a long string wraps. BOTH HALVES FALSE. MEASURED with one binary across worktrees: 2799300 green, 027d6cc green, ae35bb9 RED. ae35bb9 IS THIS SPRINT'S OWN PLAN COMMIT -- three long strings its sprint entry broke after the key, repaired at c4b3ba6, nothing to do with oxfmt 0.62.0. THE FILING BAR WAS FAILED TWICE OVER: it asks for BOTH commits and the byte-identity result AT THE SPRINT'S BASE, and this named one commit and took it from INSIDE the sprint, so `pre-existing` was measured against the very change that caused it and byte-identity against that same change was guaranteed to hold. ONE WORKTREE AT A COMMIT OUTSIDE THE SPRINT WOULD HAVE REFUTED IT, and the version story was never tested against one. WHY THE BAR EXISTS is this exactly: a red filed as pre-existing that is not is a defect handed forward as somebody else's.",
          ],
        },
        {
          test: "None, and the item discloses why: a skill file cannot redden and no check decides whether its new arm is applied. WHAT STANDS IN ITS PLACE IS AN ORDERING CONSTRAINT, not an assertion -- the arm is written AFTER subtask 1, from the case subtask 1 executed, and if subtask 1's disposition cannot be spelled in the arm's own words the ARM is wrong and gets rewritten rather than the case reinterpreted.",
          implementation:
            "`.claude/skills/writing-a-comment/SKILL.md`: a disposition for a comment STILL TRUE and no longer earning its lines, and the ordering of homes for a reason that is not a comment.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "1e88941",
              message:
                "docs(skills): a still-true comment gains an exit, and a reason gains its homes",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE ORDERING CONSTRAINT HELD AND IT CAUGHT SOMETHING. Written after subtask 1, from the case subtask 1 executed, and subtask 1's disposition spells in the arm's own words: the claim held, three arms already reddened the perturbation it described, so the copy at the site went and they keep it. Keyed on WHO GRADES IT and not on length, because the executed case did not turn on length.",
            "THE FIRST DRAFT OF THE ARM WAS FALSE ABOUT THE FILE IT WAS BEING ADDED TO, caught before it landed and rewritten rather than defended. It said DELETE, NARROW and SUPERSEDE all fire on a fact having CHANGED; DELETE's own text gives its reason as `a reader at that line never needed it`, which is WITHDRAW's reason too. What is actually missing from that section is the TRIGGER, not the argument -- its heading and every arm's wording enter through a CORRECTION. This is the file's own sprint-22 rule arriving inside the file that carries it, and the shipped arm says so.",
            "WHAT THE ARM CARRIES BEYOND THE DISPOSITION, both from this sprint's own near-misses: a withdrawal is a MEASUREMENT and not a reading of an arm's name -- the prediction here named fewer arms than the reading returned -- and OVER-DELETION IS INVISIBLE TO THE INSTRUMENT THAT CERTIFIES THE WITHDRAWAL, because the re-grep's words are the ones being kept.",
            "THE HOMES LIST WENT UNDER THE LIFETIME RULE AND NOT BESIDE IT, and F3, F4 and F10 all landed on how this note and subtask 2's implementation field first described it. BOTH SAID `four-home` -- a count, for entries that have names, in a project that refuses counts. IT SAID the section already states the backlog-item home, AS IF THAT WERE THE ONLY OVERLAP: the commit home is stated there too, so the COMMIT bullet restated its own section, which is this item's defect inside the list written to remove it. AND IT CALLED THEM ADDED: the section also names the sprint record, the site comment and a test standing in for a machine-formatted file, so a closed set of new homes both duplicated and omitted. THE F3/F4 REPAIR THEN GOT ITS OWN ACCOUNT WRONG IN BOTH DIRECTIONS, F11, and this sentence carried the same error. `An ORDERING over the homes the section already carries` is FALSE FOR A SKILL AND FOR CLAUDE.md, which are named nowhere above and are genuinely added, and it does not cure the duplication it was written to cure -- the measurement-to-commit and review-finding-to-sprint-record mappings are each still stated twice, at :248 and :270 and at :249 and :272, and relabelling the second statement an ordering renames the duplicate rather than removing it. WHAT SHIPPED after F11 says both halves: THE COMMIT and THE SPRINT RECORD restate triggers from above ON PURPOSE, because an ordering that omitted them could not rank them; AN ARM widens the machine-formatted-file case; A SKILL and CLAUDE.md are new. The sprint record is in the list because two findings this sprint filed and did not repair have no other home.",
            "THE RATE, NOT THE REPAIRS. This sprint's prose kept making claims about its own text that the text did not support -- in the sprint whose subject is that class. CAUGHT BEFORE LANDING: the arm's first draft said DELETE, NARROW and SUPERSEDE all fire on a fact having CHANGED, which DELETE's own text refutes. LANDED IN THE ARM AS SHIPPED: `Everything above in this file is what a mutable present-tense home costs`, over a corpus whose entries include prose false on arrival -- found by a reviewer, F2. LANDED IN A REPAIR: `the five in test/published-artifacts.test.ts`, a count copied rather than taken, six on measurement -- found by me re-reading my own repair. LANDED IN A REPAIR: `an ORDERING over homes this section already carries`, wrong about the entries it inherited AND about the entries it added -- found by a reviewer, F11. LANDED IN F11'S REPAIR AND THEN IN THE REPAIR OF THAT: F11's repair said `restate` of both of THE COMMIT's triggers, imprecise about one. F12 FOUND THAT IN-HOUSE AND ITS NARROWING WAS CORRECT AND WAS KEPT BY F13 -- T1: THIS NOTE SAID IT `STILL STANDS AT SKILL.md:262`, IN THE PRESENT TENSE, AND 39d323b THEN DELETED THE WHOLE PARAGRAPH IT STOOD IN, so the sentence was false by the time this round read it and :262 is now about machine-formatted files. The narrowing's correctness is a fact about a671297 and is dated; its survival was not, and was written as though it were. What was defective is the sentence F12's repair APPENDED beside it, `THE ONE ENTRY THIS PARAGRAPH CANNOT PLACE`, manufacturing a conflict between two rules the list's entry condition partitions. Refuted by a reviewer, F13. THE PARAGRAPH AT SKILL.md:259 WAS WRONG IN EVERY VERSION FROM THE F3/F4 REPAIR THROUGH F12'S AND RIGHT ONLY AT F13.\n\nAND ONE WHOSE MECHANISM IS NOT THE REST'S, WHICH IS WHY IT IS WORTH MORE THAN A TICK ON THE SAME TALLY. F13's brief characterised F12 as `not a finding, a sixth instance of the class`. IT IS FALSE -- F12 was valid and its repair survives -- and the facilitator has withdrawn it. The retraction note was written FROM THAT SENTENCE RATHER THAN FROM THE COMMITS, which I had and did not open. THE ENTRIES ABOVE ARE AN AUTHOR ASSERTING SOMETHING THEIR OWN TEXT DOES NOT SUPPORT, AND RE-READING THE TEXT CATCHES THEM; THIS ONE IS A CORRECT FINDING MISDESCRIBED BY THE PERSON RELAYING IT AND TAKEN ON TRUST, WHICH NO AMOUNT OF RE-READING MY OWN FILE WOULD HAVE CAUGHT. F14, and it is the facilitator's before it is mine. MOST OF WHAT LANDED WAS INTRODUCED BY THE REPAIR PASS ITSELF, EACH REPAIR REVIEWED AS SOUND WHEN MADE.",
            "THE UNRESOLVED-CONFLICT FILING IS RETRACTED, AND F14 CAUGHT THIS NOTE MISNAMING WHAT IT WAS A FILING OF. IT SAID `F12 WAS FILED HERE AS AN UNRESOLVED CONFLICT`. F12 WAS A VALID FINDING, FOUND IN-HOUSE: that F11's `restate` was wrong for THE COMMIT's foreclosed-alternative trigger. ITS NARROWING WAS CORRECT AND F13 KEPT IT -- T1 CORRECTED `IS IN THE FILE TODAY ... at SKILL.md:262` HERE TOO: 39d323b deleted the paragraph carrying it, so a present-tense survival claim about a line number was false within the same review round that wrote it. A LINE NUMBER PLUS A PRESENT TENSE IS THE SHAPE TO DISTRUST in this file; what is stable is which commit did what. WHAT WAS FILED HERE AS UNSETTLED, AT 0d3e917, WAS THE SENTENCE F12'S REPAIR APPENDED BESIDE THAT NARROWING: that the file gives a foreclosed alternative two competing homes. THE SCOPES PARTITION AND THERE IS NO CONFLICT -- the list is entered only WHEN THE REASON IS NOT A COMMENT, so an alternative that earns its line at the reintroduction site is a comment and never reaches the bullets, and one that does not is not a comment and goes to the commit. One condition, two branches; PBI-81's note 1 says the same in the stakeholder's words. WHAT THE FILING ACTUALLY DID was invoke the sprint-record arm to defer a question nobody had asked -- the arm running on a false premise rather than the arm working, which is why the retraction stands in place of the filing rather than deleting it.",
            "THE THREE READINGS RE-TAKEN AT HEAD FOR SPRINT REVIEW, because the source moved after they were first taken. ONE, the misspell perturbation: IDENTICAL TO BASE ae35bb9 -- 942 pass / 3 fail, `the narrowed connection rejects onUnhandledNotification and accepts onRequest, in one type-check`, `the same two outcomes hold for onUnhandledNotification through an alias under a different name`, `an unbuilt checkout's root type check is non-zero and names a workspace package it could not resolve`, plus TS2344 at test/notifications.test.ts(550,3) under `tsc --noEmit`. TWO, the re-grep as a LIST: the same eight members over tracked files excluding scrum.ts as at base, unchanged in membership though every line number moved. THREE, the `Pick` foreclosure site: untouched all sprint, still RESTATES the premise and still does not dangle.\n\nAND A FOURTH ARM APPEARED ONCE AND IS A FLAKE, RECORDED SO IT IS NOT READ AS A FOURTH GRADER: `the recorded weakening still reddens: a published subpath with no artifact at all is refused, naming the file it promised` failed at 25007ms in the first perturbed full-suite run. MEASURED: it passes clean alone twice, PERTURBED alone twice, and a second perturbed full suite returns the same three arms. A time near a round 25 seconds under full-suite load, not a consequence of the misspelling.",
            "NO ASSERTION EXISTS AND NONE WAS INVENTED, which the item discloses. A skill file cannot redden and nothing decides whether the arm is applied; what stands in its place is that this sprint is its first application, in the same item.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE SPRINT'S LARGEST FINDING IS ITS OWN REVIEW LOOP, AND IT CARRIES ITS DENOMINATOR BECAUSE A RATIO WITHOUT ONE IS THE DEFECT IT DESCRIBES. Eight `revise` rounds -- one multi-perspective stage-1 with three reviewers, four anchored, three cold sweeps. TWO findings were in the increment: which pin defends which hazard, and how wide pin 2's guarantee is. EVERY OTHER ONE WAS IN PROSE ABOUT THE INCREMENT. FIVE OF THE LAST EIGHT were the wake of this sprint's own repairs -- shifted line numbers invalidating citations, deletions invalidating the sentences describing them. FOUR NUMBERS WERE WRITTEN WITHOUT BEING MEASURED, each by the author who had just deleted someone else's. ALL OF THEM SHIPPED GREEN: none of the five checks reads prose. The paragraph introducing the homes list was written, repaired four times, deleted, rebuilt and deleted again; the bullets a reader routes by were never the problem.",
        "WHAT THAT DOES NOT LICENSE, RULED AT REVIEW BECAUSE BOTH WILL BE PROPOSED AT RETROSPECTIVE. NOT A PROSE CHECKER -- criterion 1 refuses one by name and this yield STRENGTHENS the refusal: a matcher over prose content would certify the class as watched at exactly the volume that makes a green look like coverage. NOT `BE MORE CAREFUL` -- the skill carries four prior instances against it and the four unmeasured numbers are a fifth, because deleting someone else's unmeasured number did not transfer the rule to the deleter. What it DOES license is the item's own thesis, measured by the sprint implementing it: the two deliverables were stable from the first pass, and everything that churned was prose nothing grades.",
        "TWO SUITES ON ONE CHECKOUT CORRUPT EACH OTHER, FOUND BY THE FACILITATOR DOING IT WHILE VERIFYING THIS SPRINT. Two full runs started together: one reported `bun pm pack (@atusy/tsudoi-hover-wordnet) failed with exit code 2 while building the installed consumer` with TS2307 on both published subpaths and three arms down with it, WHILE THE TWIN BESIDE IT WENT GREEN -- which is what made the red read as the tree's. Alone on the same commit: 945 pass / 0 fail in two thirds of the wall time. The preload rebuilds every dist/ in place, so a second run reads one midway through replacement. WRITTEN AT test/helpers/build.ts AND NOT ONLY HERE, because the mechanism is that preload and this file compacts. AND IT IS NOT THE DEADLINE, though an arm times out among the casualties -- raising it buys a slower version of the same corruption.",
        "THE PLANNING PREMISE ABOUT WHICH PIN DEFENDS WHICH HAZARD WAS THE PRODUCT OWNER'S AND THE MEASUREMENT CORRECTED IT, recorded this way at their own request rather than as their vindication. They ruled pin 1 defends the misspelling and pin 2 the dependency arrivals. MEASURED: with `BoundaryIsTheObservingMembers` deleted the spawned probes still redden on a misspelled key, and pin 2 is silent under one -- so pin 1's unique job is a SURPLUS key. Their conclusion held, `EITHER` is true and each pin covers a distinct hazard `Pick` forecloses, on a premise half wrong. The objection was still worth making: the discriminator the developer proposed could not have separated the hypotheses and would have narrowed a true sentence into a false one.",
        "AND `sixth` WENT WHILE `two pins` STAYED, WHICH READS AS SELF-CONTRADICTION UNTIL THE DISCRIMINATOR IS SAID: a count whose set is NAMED IN THE SAME PARAGRAPH cannot go stale silently, because a third pin falsifies the naming beside it. `sixth` counted a set the adjacent clause declared unreachable by the declared method. The developer kept the first over a reviewer's objection with the reason at the site; the product owner struck the second in their own criterion.",
        "THE DEVELOPER FILED A TRUTH DEFECT AT THE SITE IT WAS SENT TO NARROW AND THE PRODUCT OWNER REFUTED IT, so the reading is recorded rather than the repair. The clause reading `defended by two pins` says the `Omit` is defended by TWO PINS and that removing EITHER makes conversion required; the Developer read `pins` as the spawned probes and concluded only one defends the misspelling hazard. MEASURED: `\\bpins?\\b` occurs in test/notifications.test.ts at exactly :541 and :595, both inside the `Assert<Exact<...>>` docblocks, and the spawned ones are called `the two probes` and `the four probes` and never pins. THE CLAUSE THAT SETTLES IT is the last one -- `Pick needs neither of them` -- which is FALSE under the probes reading, because a `Pick` leaves those probes unchanged. The two pins are COMPLEMENTARY, one per blind spot of `Omit`, and the test file says so at :565-570. So `EITHER` is true, this is not PBI-77's class, and note 4 stands.",
        "AND THE DISCRIMINATOR THE DEVELOPER PROPOSED WAS CONFOUNDED, WHICH IS THE HALF THAT MATTERS INDEPENDENTLY OF WHO WAS RIGHT. `Delete ProtocolConnectionHasTheseMembers and read whether anything about the misspelling hazard changes` returns NOTHING CHANGES under both hypotheses -- pin 2 was never the misspelling defender and its own docblock says so. Run as planned it yields a green that reads as proof, and the sprint narrows a true sentence into a false one on a measurement that could not have said otherwise. Sprint 73's class, arriving at plan time instead of at review. The direction that separates them is the DEPENDENCY side: pin 2 deleted, a member planted on `ProtocolConnection`, read whether it lands silently on `RequestOnlyConnection`.",
        "WHAT THE REFUTED FINDING LEFT BEHIND IS IN SCOPE AND IS NOT A TRUTH REPAIR. `two pins` names neither pin, and the phrase was resolved wrong twice in two days -- once by criterion 1 itself, corrected at refinement, and once by the Developer reading the source directly. Prose two careful readers get wrong is under-specified, which is this item's subject; naming the two symbols at :117 is subtask 1's work, in the same commit. THE PREDICTION THAT CAME WITH IT -- `and the site still gets shorter` -- WAS EXECUTED AND FAILED, F9, AND IS KEPT AS A FAILED PREDICTION RATHER THAN QUIETLY DROPPED: eight docblock lines before and eight after, the commit 8 insertions / 8 deletions. The walk-through's removal paid for the two pin names almost exactly. THE FAILURE IS THE USEFUL HALF -- naming a symbol costs about what a consequence sentence costs, so `it will also be shorter` is not free when the same edit is asked to make prose more specific. Repaired here because the refutation was filed in a note while this line went on asserting the prediction as fact, and a reader picks whichever they reach first.",
        "NO PERTURBATION RECORD IS BUILT FOR SUBTASK 1, AND THE RESIDUE NAMED IS THE REGISTRY'S REACH RATHER THAN THE PERTURBATION'S. `alsoReddens` is same-file and the re-runner runs an ARM FILE, never `tsc --noEmit` -- so a record would hold the two bun arms and NOT the TS2344 half, which is the half licensing removal of the analysis from source. The header's second branch applies instead: the weakening is a reading of something an arm already holds, and `BoundaryIsTheObservingMembers` re-runs under the fourth check by existing.",
        "THREE READINGS AND NOT ONE, BECAUSE THE ITEM'S OWN INSTRUMENT CANNOT REACH THE `Pick` FORECLOSURE SITE -- T8 dropped `ITS OWN SIXTH SITE` here, since an instrument that cannot establish completeness cannot support an ordinal over what it found: the misspell perturbation at base and after; the re-grep of `silent no-op` and `MISSPELL` read as a LIST and not as a diff; and a separately named read of the `Pick` foreclosure site, which spells neither key word. The product owner added that site knowing the re-grep misses it, so the third reading is the honest consequence of the addition.",
        "THE RISK ON THE RECORD IS THE DEVELOPER'S REPLACEMENT FOR THE ONE IT WITHDREW: the surviving text of the `RequestOnlyConnection` docblock states a decision whose terms were, WHEN THIS WAS WRITTEN, resolved by reading two other files, and the narrowing DID NOT make it shorter -- S9, and this is the SECOND site to have recorded that prediction and had it fail, after decision 3. MEASURED OVER ONE RANGE AT ALL THREE COMMITS, `A MISSPELLED KEY HERE` through `Pick needs neither of them.`: eight lines at ae35bb9, eight after the narrowing, ELEVEN after S2's truth repair. It never shrank. T6 CORRECTED THIS LINE'S BYTE FIGURES, which had been taken over inconsistent ranges -- the third counted the closing `*/` and the first two did not -- and the bytes are dropped rather than re-taken, because the line count was always what carried the point. The prediction is kept as a failed one because what it teaches is not in the repair: prose asked to be BOTH more specific and shorter has now been three for three on specific. Naming the pins fixed the referent and not the fact that the reversal condition's truth then rested on a complementarity argument living elsewhere -- WHICH 60ff308 SUBSEQUENTLY ANSWERED by stating what each pin defends at the site, so this risk is discharged rather than outstanding. IF THE EXECUTED NARROWING LEAVES A READER UNABLE TO CHECK `EITHER` FROM THE SITE, THAT IS FILED AND NOT REPAIRED HERE.",
      ],
    },
    {
      number: 80,
      pbi_id: "PBI-77",
      goal: "The last shape of the superlative sweep is the one a test can settle -- who actually reddens -- and PBI-77 closes with its keys written down.",
      status: "done",
      subtasks: [
        {
          test: "For each sole-detection claim, DELETE OR WEAKEN THE THING IT IS ABOUT and count the arms that redden. The claim is the count.",
          implementation: "Three narrowings. One claim held.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE KEY IS `is what <detection verb>` AND IT IS DECIDABLE FROM THE MATCHED LINE, which is why it was taken and `is what a/the/this` was not: a transitive detection verb makes the sentence a claim about a SET OF ARMS, and a reader can open that set by perturbing the subject. Nineteen hits tree-wide; the rest of the family turned out to be DISCRIMINATOR claims -- what tells state A from state B -- which are local and not quantifiers.",
            "ONE HELD: deleting the empty-contentChanges early return reddens EXACTLY the arm whose comment claims to notice it.",
            "THREE DID NOT, AND ONE OF THEM FAILED IN BOTH DIRECTIONS AT ONCE. `push(...batch)` made a plain push reddens the aggregating drive across both runtimes and the installed consumer -- and the cell calling itself the noticer IS NOT AMONG THEM. It locks the guard's own behaviour and nothing about the spread. A planted `exports` subpath reddens THREE arms with three different reasons, not the one equality assertion. Dropping `openClose` reddens TWENTY-TWO, because every capability arm in that file asserts the whole value.",
            "THE COUNTS ARE KEPT WHERE THIS PROJECT USUALLY REFUSES COUNTS, and the exception has a reason: what a reader trading one of these arms for another needs is HOW MANY WERE WATCHING. A count that goes stale here reddens nothing and misleads nobody, because the sentence beside it names the perturbation that produced it.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "PBI-77 CLOSES ON ITS OWN CONDITION: the shapes are swept once, each hit backed or narrowed, and the keys are written down. `X is the only Y` and `nothing anywhere does Z` went at sprint 66 under five keys over two file sets. The definite article doing the same work went at sprint 74 under `is what`, over the production layers. The detection family went here, tree-wide. `every W is V` is RULED rather than swept -- refused at sprint 74 with its reading, because quantifier-or-narration is not decidable from the matched line and a partition a sweep cannot make from the line is the class disposition this project has measured hiding live sites twice.",
        "WHAT IS NOT SWEPT IS STATED AS A NUMBER RATHER THAN LEFT OUT, and it is the condition the closure is honest under: `is what` in the test corpus reads 262, in test/fixtures/ 40, in the member tests 29, in the READMEs and CLAUDE.md 17, in the skills 12, in scrum.ts 59 -- taken at sprint 74's plan with one instrument. This closes because the SHAPES have been swept once, which is what the item asks, and NOT because the tree is certified free of them, which the item forbids claiming.",
        "THE YIELD ARGUES AGAINST TREATING THE CLOSURE AS A CLEAN BILL: three of four opened claims were false, and one was false about itself. The rate is what a reader should carry, not the closure.",
      ],
    },
    {
      number: 79,
      pbi_id: "PBI-70b",
      goal: "The sweep over the inherited corpus is decided on a measured cost and a measured yield, not on how it feels to leave it undone.",
      status: "done",
      subtasks: [
        {
          test: "Sample by a rule declared before looking, perturb each sampled arm to the adjacent weaker reading of its subject, and record what it cost and what it found.",
          implementation: "One repair, at the arm the sample found not holding.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE RULE WAS DECLARED FIRST: the first arm of each of the first root test files in alphabetical order that neither the registry names nor imports helpers/perturbation.ts. Two were taken to a reading.",
            "ONE HELD, CHEAPLY. Collapsing buildOrder to the alphabet reddens test/build-order.test.ts's first arm AND SIX MORE in the same file -- authoring about three minutes, the run one second. A record over it would be HELD with six collateral names.",
            "ONE DID NOT HOLD, AND FINDING THAT COST FOUR PERTURBATION STATES. test/build-diagnostics.test.ts asserts the failing file is named WITH its member, by `toContain` over the joined path -- which an ABSOLUTE path contains. Running tsc with an absolute `-p` from inside the member passes the arm while printing the reader exactly the string the arm's own paragraph refuses. Anchored to the line now; both invocations redden it.",
            "AND THE SAME SAMPLE MOVED A SECOND CLAIM: perturbing the CHECK's own cwd leaves that file green in every form tried. The line the arm reads is printed by `build` in scripts/workspaces.ts, which runs first. The arm is named for typecheck-workspaces.ts and held by the builder, and scripts/typecheck-workspaces.ts now says so where it makes the claim.",
            "THE FIRST TWO READINGS WERE UNREADABLE ALONE, which is the method's cost showing up inside the method: a green under `absolute -p from the member` and a red under `member-relative from the member` say opposite things about the same weakening, and only the pair names the discriminator. A one-state sweep would have recorded the arm as holding.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "IT CLOSES AS THE RECORDED DECISION ITS OWN NOTE AUTHORISED: GOING-FORWARD-ONLY SUFFICES. The corpus is 945 arms. The sample's cheap end is minutes per arm and its expensive end took four states over one assertion, so a full sweep is not a thing anyone finishes -- and the item's own note says its value DECAYS as the going-forward rule ages.",
        "THE YIELD IS NOT CLAIMED TO BE ZERO, WHICH IS THE PART THAT MAKES THE DECISION HONEST RATHER THAN CONVENIENT: one of two sampled arms did not hold, and its defect was real enough to repair. The reason to stop is COST, and a reader should expect the corpus to hold more of these.",
        "WHAT SURVIVES THE CLOSURE IS THE CHEAP HALF, ALREADY IN PLACE: the going-forward rule, the registry that re-runs what is recorded, and the class statement saying what it cannot hold. An arm sampled by anyone who has a reason to doubt it is a few minutes of work, and this record says what that looked like twice.",
      ],
    },
  ],
  // THIS LIST IS DATA, AND `bun run scripts/definition-of-done.ts` IS THE ONE
  // FORM FOR TAKING IT. That runner EXECUTES this file and reads the checks
  // below out of the JSON it prints, so an entry added here runs with no edit
  // anywhere else -- which is the whole point, and the reason a copy of this
  // list may not be written into the runner. WHAT THIS FIELD MUST STAY: `run`
  // is A COMMAND LINE THE RUNNER SPAWNS -- a program and its space-separated
  // arguments -- so nothing a command cannot verify belongs in it, and the
  // runner is NOT added here as a sixth entry: a check that runs every check
  // would run itself, unbounded.
  //
  // AND IT IS NOT A SHELL COMMAND, WHICH THIS COMMENT CALLED IT UNTIL A
  // REVIEWER MEASURED THE DIFFERENCE: `run: "true && false"` spawned `true`
  // with the arguments `&&` and `false` and REPORTED PASSED. No shell is
  // involved, deliberately -- through one, a missing binary arrives as exit 127
  // and cannot be told from a check that ran and said no -- so a `run` carrying
  // a pipe, a redirection, a quoted argument, a glob or an operator is now
  // REFUSED and reported non-green rather than misread. A check needing any of
  // those goes in a script, and the script is what is named here.
  definition_of_done: {
    checks: [
      {
        name: "Tests pass",
        run: "bun test",
      },
      {
        name: "Lint passes",
        run: "oxlint",
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
  sprint: {
    number: 82,
    pbi_id: "PBI-82",
    goal: "The free fact goes to the eagerly-rendered field and the expensive one to the lazy field: `detail` names WHICH FILE from the completion list itself, `documentation` is the only property a late answer touches, and the block only ever GAINS -- with the claims this change turns SILENTLY GREEN re-sited. THIS SAID `THE TWO` AND `BEFORE ANY RUN CAN BE READ AS PASSING`, AND THE INCREMENT REFUTED BOTH HALVES: there were THREE, the third named in PBI-82's own criterion 7 at refinement, and it was re-sited only at subtask 8 -- after four full Definition-of-Done greens had already been read. The goal described the intention; the record below describes what happened.",
    status: "in_progress",
    subtasks: [
      {
        test: "GREEN BEFORE AND AFTER, WITH NO EXPECTED STRING TOUCHED -- the bound arms in both suites (`a directory holding far more entries than fit renders a bounded prefix and states its total`, and the member's edge, dotfile and two-directory arms) are the check that the new lookup finds the section `slice(2)` found. AND THE ANCHOR IS A FAILING INPUT THAT EXISTS TODAY RATHER THAN A PREDICTION ABOUT THE CHANGE: `documentationFor` pushes the source part ONLY WHEN DEFINED, so the block a FORGED source produces is `path, header, names` and `slice(2)` returns the NAMES as the header and no names at all. An arm handing today's helper that block must redden before the re-derivation and pass after -- which the part index cannot satisfy and a lookup can.",
        implementation:
          "Both copies of `listingSection` -- in packages/tsudoi-completion-path/test/resolve.test.ts and in test/resolve-path-stat.test.ts, duplicated deliberately under a docblock saying the two MUST NOT DISAGREE -- re-derived to locate the listing by its own header rather than by the part index that `path, source, listing` happens to put it at. AGAINST TODAY'S COMPOSITION AND FIRST: under `source, stat, listing` the index is right BY ACCIDENT and both helpers go GREEN when they are wrong, so without this a re-index defect and a composition defect are indistinguishable in every red that follows. The two move together or the docblock's own claim is false.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "3ddccbd",
            message:
              "test(completion-path): the listing is located by its header, not by its index",
            phase: "green",
          },
        ],
        notes: [
          'THE ANCHOR WAS READ RED BEFORE THE RE-DERIVATION AND ITS SHAPE IS THE ONE THE ITEM PREDICTED, WHICH IS WHY IT COULD BE WRITTEN FROM TODAY\'S COMPOSITION RATHER THAN FROM AN INTENTION. MEASURED at base 2ed9d43 with the new arm alone added, `bun test packages/tsudoi-completion-path/test/resolve.test.ts`: 15 pass / 1 fail, the fail being `a block whose source was forged still reads back as its header and its names` and the received value being `header: "one.txt\\ntwo.txt", names: []` -- the NAMES returned as the header and no names at all, which is the failure `slice(2)` produces on a block of `path, header, names` and which no index can be moved to fix.',
          "GREEN AFTER, WITH NO EXPECTED STRING TOUCHED. MEASURED, full suite from the root: 946 pass / 0 fail over 70 files, 2885 expect() calls, 169.88s, six registry arms HELD -- 945/2884 at the base plus this one arm and its one assertion, which is the whole of the delta. The bound arms the subtask named as the check are among them: `a directory holding far more entries than fit renders a bounded prefix and states its total`, and the member's edge, dotfile and two-directory arms.",
          "THE ROOT COPY MOVED UNWITNESSED BY A RED OF ITS OWN, AND THAT IS A LIMIT RATHER THAN AN OVERSIGHT: the separating input is a FORGED source, and every item test/resolve-path-stat.test.ts resolves came out of a real server, which cannot be made to forge one. What carries it is the docblock's MUST NOT DISAGREE rule, and the docblock now says which half of the pair the witness lives in.",
          "THE LOOKUP IS ANCHORED AND FIRST-MATCH, AND BOTH HALVES ANSWER A COLLISION THE INDEX DID NOT HAVE: a directory holding an entry NAMED `3 entries` renders a names part that matches the header pattern, so an unanchored or last-match reader would answer with the names. The real header is always the earlier of the two.",
        ],
      },
      {
        test: "NOTHING REDDENS AND NOTHING MAY: no member arm reads an mtime yet, so the whole member suite is green before and after. WHAT STANDS IN PLACE OF A RED IS THE ORDER, and it is the whole of the work -- children written FIRST and the stamp set AFTER, because writing into a directory bumps its mtime, and on a WHOLE SECOND, because filesystems disagree about sub-second precision. A probe stating the fixture's own premise goes with it: one directory stat-ed through the fixture twice reports the same stamp, which is the property every whole-value block assertion rests on from subtask 4 onward and which a stamp set before the children loses SILENTLY.",
        implementation:
          "`tree` in packages/tsudoi-completion-path/test/helpers/tree.ts gains the fixed stamp, taking the shape test/resolve-path-stat.test.ts's `sampleTree` already has -- the root suite is immune to this change for exactly that reason. ITS OWN COMMIT AND NOT INSIDE SUBTASK 4, RULED BY THE PRODUCT OWNER: green before and green after makes it tidying, and folding it in is the one thing that would make subtask 4 too large to read. STRUCTURAL, ARGUED RATHER THAN ASSUMED: it changes no assertion, no answer and nothing shipped; it removes a dependence on the clock that today's arms do not have and that tomorrow's cannot avoid.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "142bbe5",
            message:
              "test(completion-path): the member fixture's stamps stop coming from the clock",
            phase: "refactoring",
          },
        ],
        notes: [
          "NOTHING REDDENED, AS THE SUBTASK REQUIRED. MEASURED at 3ddccbd: member suite 60 pass / 0 fail over 3 files before the change -- `61` STOOD HERE AND WAS THE COUNT AFTER THIS SUBTASK'S OWN PROBE LANDED, contradicted two sentences later by this note's own `+1 arm` delta; full suite from the root after it 947 pass / 0 fail over 70 files, 2888 expect() calls, 163.67s, six registry arms HELD. The delta over subtask 1's 946/2885 is the one probe and its three assertions.",
          "THE PROBE WAS BORN GREEN AND ITS FIRST DRAFT WAS BORN VACUOUS, WHICH THE PERTURBATION CAUGHT AND NO GREEN WOULD HAVE. Drafted over `listed/one.txt`, it PASSED against the degenerate its own comment names -- entries stamped as they are created, with no final pass -- because with a SINGLE child there is no sibling left to write, so the directory's last bump is the one that stamped it. MEASURED, that same degenerate against the two-child fixture: red at the directory assertion, expected 2001-02-03T04:05:06.000Z and received the wall clock. It takes a sibling to bump a parent that has already been stamped, and that sentence is now at the site.",
          "A SYMLINK IS NEITHER STAMPED NOR DESCENDED, AND BOTH HALVES ARE FORCED BY FIXTURES CALLERS ALREADY STAGE: `utimesSync` FOLLOWS a link and would throw ENOENT on the `dangling -> nowhere-at-all` the completion suite builds, and a walk that descended one would recurse forever on its `mirror -> .`. Nothing is lost -- the handler stats THROUGH a link, and the target is stamped wherever it really lives. `readdirSync(withFileTypes)` reports a symlink-to-directory as NOT a directory, so the descent guard and the stamp guard are the same test.",
        ],
      },
      {
        test: "GREEN THROUGHOUT, AND THE ARMS THAT PROVE IT IS A MOVE ARE THE ONES LEFT UNTOUCHED: every reader that splits the stat line on the middle dot -- the two cancellation arms, the directory-replaced-by-a-file arm and the two kind-driven arms -- still reads the same bytes from the same field. A move that changed a byte reddens there before anything about composition is attempted.",
        implementation:
          "`detailFor` in packages/tsudoi-completion-path/src/resolve.ts moves beside `documentationFor` in src/completion.ts and loses the field name it is about to stop describing; resolve.ts imports it as it already imports the composer. src/index.ts's enumeration of the block the two handlers share gains the name, and so does the docblock in test/published-artifacts.test.ts naming `documentationFor` and `preferredFormat` as that surface. THE WHOLE-VALUE PUBLISHED ASSERTION STAYS GREEN PRECISELY BECAUSE THE NAME IS NOT RE-EXPORTED FROM index.ts -- publishing it would make how the two halves agree a compatibility question with a stranger, which is why the shared names are internal.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "cb6ac75",
            message:
              "refactor(completion-path): the stat line moves to the module that owns the block",
            phase: "refactoring",
          },
        ],
        notes: [
          "GREEN THROUGHOUT AND NOT ONE EXPECTED STRING TOUCHED, which is the whole of the evidence that it was structural. MEASURED, full Definition of Done at 142bbe5 with the move landed: PASSED, all five checks exit 0, 947 pass / 0 fail over 70 files, 2888 expect() calls, 162.37s -- byte-identical counts to the reading taken before the move -- and ONE non-gating warning, `eslint(require-yield)` at test/fixtures/throws-on-cancel.ts. The arms the subtask named as the proof are among the greens: the two cancellation arms, the directory-replaced-by-a-file arm and the two kind-driven arms all still split the same bytes off the same field.",
          "`Stats` STAYED IN resolve.ts RATHER THAN LEAVING WITH THE FUNCTION, and it is not a leftover: the handler declares the variable the `stat` lands in. What moved to completion.ts is the type as an IMPORT, beside `Dirent` which was already there.",
          "THE MEASURED COUNTS IN resolve.ts NAMED `detailFor` AND WERE RE-POINTED RATHER THAN LEFT DANGLING, which subtask 9 then deletes outright: they are readings taken over arms this sprint rewrites, and a count taken against arms that no longer exist cannot be re-taken. Re-pointed here so no commit ships a comment naming a symbol the tree does not have.",
        ],
      },
      {
        test: "THE REDS, NAMED BEFORE THE SOURCE EDIT SO THE ONE BIG GREEN COMMIT IS READABLE AFTERWARDS -- THE PRODUCT OWNER'S CONDITION FOR ACCEPTING IT UNSPLIT -- AND EVERY ONE OF THEM RED FOR THE COMPOSITION RATHER THAN FOR AN INDEX, WHICH IS WHAT SUBTASK 1 BOUGHT. `each item names the file it resolves to and the source that produced it` widens from `documentation` to THE PAIR, WHOLE-VALUE ON BOTH: a containment there lets an implementation that ALSO left the path in the block pass this and make the prefix criterion hold vacuously, which is two failures conspiring. The pre-resolve reads in test/resolve-path-stat.test.ts that today assert `detail` is ABSENT invert to assert the path is already there. The file arm and the directory arm are recast as `toEqual({ ...item, documentation })`, the shape ANY `detail` written at resolve reddens. `a directory item's block carries what is inside it, while a file item's block is unmoved` is renamed on the inversion -- the file's block now moves too -- and carries the PREFIX relation over the two values one session already holds, which also retires the passthrough weakness its own docblock admits. `a directory item comes back saying it is a directory, and carrying no size` is re-sited onto the stat line inside `documentation`: left where it is, `not.toContain(\"bytes\")` over an absolute path is TRUE ON EVERY MACHINE. The installed-consumer arm's two `detail` reads move to the stat line and NOT to `detail is non-empty`, which a DECLINED item now satisfies. `every workspace folder is answered from, and its items name their root` moves its discriminator onto `detail`, or the two folders' items become the identical string and the arm degenerates to `two items exist` while staying green -- and `insertText` does not save it, both folders spelling the same relative text. The kind-driven pair stays two arms, loses its recorded reason -- the two defects no longer land in DIFFERENT FIELDS -- and gains the one that survives.",
        implementation:
          "`itemsFrom` in packages/tsudoi-completion-path/src/completion.ts writes the absolute path to `detail` and hands `documentationFor` the source ALONE; `documentationFor` loses its mandatory path parameter, gains the stat line and composes `source` then `stat` then `listing`; `resolvePathStat` in src/resolve.ts answers `{ ...item, documentation }` and writes NO `detail` -- the plain reading of the instruction rather than rebuilding an identical one from the mark. The arms move in the same commit: packages/tsudoi-completion-path/test/completion.test.ts and test/resolve.test.ts, test/resolve-path-stat.test.ts's block and detail constants, test/installed-handler.test.ts, test/workspace.test.ts. WHERE THE BASELINE BINDS: test/perturbations.test.ts re-runs packages/tsudoi-completion-path/test/resolve.test.ts WHOLE and this project takes no red commit, so that file's rewritten arms and this source edit are ONE commit -- inseparable rather than convenient. THE COMMIT BODY NAMES THE STATE THIS LEAVES AND THE SUBTASK THAT CLOSES IT, which is the product owner's second condition. READING THE PATH OFF `item.detail` NOW THAT IT IS THERE IS THE EDIT TO REFUSE: `detail` is a display field a client may rewrite, and the mark stays the sole key.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "d46b9b7",
            message: "feat(completion-path): the path goes to `detail` and the stat to the block",
            phase: "green",
          },
        ],
        notes: [
          "THE REDS WERE TAKEN AS A MEASUREMENT AND NOT LEFT AS THE PLAN'S PREDICTION, which is what the product owner's condition for accepting this unsplit is worth. MEASURED at cb6ac75 with every arm moved and BOTH SOURCE FILES REVERTED to their unchanged text: 916 pass / 31 fail over 70 files, 2843 expect() calls. Every arm the `test` field names is in that list, both runtimes where the file runs both: `a file item the example produced comes back from resolve carrying its size, its mtime and its kind`, `a directory item comes back saying it is a directory, and carrying no size`, `each kind's block only GAINS: what completion sent is a strict prefix of what resolve answers`, `a directory holding far more entries than fit renders a bounded prefix and states its total`, `an item whose block was tampered with is answered with a rebuilt one, for either kind`, `a directory that cannot be listed keeps the stat line its stat produced`, `an item whose file is deleted between completion and resolve comes back unenriched rather than failing`, `every workspace folder is answered from, and its items name their root`, `an installed consumer answers a completion and then resolves one of its own items`, `each item names the file it resolves to and the source that produced it`, `the documentation format follows what the client declared, both ways`, and eight arms of the member's resolve suite.",
          "AND TWO REDS NOBODY NAMED, WHICH ARE THE REGISTRY'S AND ARE THE WHOLE REASON THIS IS ONE COMMIT: `every arm in packages/tsudoi-completion-path/test/resolve.test.ts passes before any weakening` and `the recorded weakening still reddens: a hidden name already kept is displaced by an ordinary name arriving after it`. test/perturbations.test.ts stages the tracked tree and runs that arm file inside it, so a tree where the member's arms are red reports its baseline red. A split subtask would have left that file red across a commit boundary, which this project forbids outright.",
          "GREEN AFTER, FULL DEFINITION OF DONE at cb6ac75 with the source restored: PASSED, all five checks exit 0, 947 pass / 0 fail over 70 files, 2898 expect() calls, six registry arms HELD, ONE non-gating `eslint(require-yield)` warning. The arm COUNT is unchanged from subtask 3's 947 because the inverted arm was renamed rather than added; the expect() delta of ten is the prefix relation, the two completion-time `detail` reads and the block assertions that came with them.",
          "TWO FIXTURES GAINED A STAMP THE PLAN DID NOT PREDICT, AND THE REASON IS THE ONE SUBTASK 2 GAVE FOR THE MEMBER'S: `crowdedTree` and `lockedTree`'s LISTABLE directory are now compared WHOLE and so now carry a modification time. `lockedTree` already stamped the locked one and not its pair, which was invisible while the stat lived in `detail`.",
          "THREE ARM TITLES WERE REPAIRED BECAUSE THIS CHANGE FALSIFIED THEM, and each is a truth repair rather than a rewrite: `a directory item's block carries what is inside it, while a file item's block is unmoved` INVERTS -- a file's block moves too now -- and became the prefix arm; `a directory replaced by a file after the stat keeps its detail and renders no listing` and `a directory that cannot be listed keeps the detail its stat produced` both named a field the answer no longer writes.",
          "ONE ARM LOST ITS SUBJECT AND WAS KEPT RATHER THAN DELETED, WITH WHAT IT NOW REFUSES WRITTEN AT THE SITE: `a path whose own name would forge an attribution line renders as one that cannot` existed because the composer RENDERED the path, and it does not any more. What it refuses now is an implementation that LEFT THE PATH IN THE BLOCK -- the state that makes the prefix criterion hold vacuously -- and its fixture's name is exactly the input under which that forges a line. Its docblock discloses, at this commit, that whether the path survives its trip into `detail` is asserted nowhere.",
        ],
      },
      {
        test: "A NEW COMPLETION-HALF ARM CARRIES THE RED, AND WHERE IT LIVES IS WHY THE SPLIT BUYS ANYTHING: packages/tsudoi-completion-path/test/completion.test.ts is re-run by no baseline, so an arm requiring that an entry whose own name holds a line break puts no raw break into the `detail` of the item completing to it can be written and READ RED before the fix. Then the member resolve arm `a path whose own name would forge an attribution line renders as one that cannot` widens to read `detail` beside the block -- that file's widening and the fix in one commit, for the reason subtask 4 gives. THE WINDOW IS DISCLOSED RATHER THAN HIDDEN: between subtask 4 and this one the shipped source writes an UNFLATTENED path into `detail`, which is a REGRESSION and not merely an absence, since the path is flattened in the block at base. WHAT IS STILL NOT CLOSED, as the arms already say: markdown syntax inside a name renders as syntax; what may not survive is a LINE BREAK, the line grammar being what carries meaning.",
        implementation:
          "`flattened` in packages/tsudoi-completion-path/src/completion.ts applied where `itemsFrom` writes `detail`. AT THE WRITE AND NOT BY ROUTING THE PATH BACK THROUGH `documentationFor`, which no longer takes it: the composer is where flattening lived only because the path passed through it, and restoring that route to keep the sanitising would undo subtask 4. NOT DEFERRABLE -- THE PRODUCT OWNER MADE CRITERION 5 UNMET A BLOCK ON ACCEPTANCE, because a sprint cut short would leave the last green commit carrying a disclosed regression with no owner.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "58b5f8d",
            message:
              "fix(completion-path): the path is flattened where it is written, not where it was",
            phase: "green",
          },
        ],
        notes: [
          'THE RED WAS READ AND NOT INHERITED, WHICH IS WHAT THE SPLIT WAS FOR. MEASURED at d46b9b7 with the new completion-half arm added and no fix: `bun test packages/tsudoi-completion-path/test/completion.test.ts -t "forge an attribution line names it as one that cannot"` reports 0 pass / 1 fail, and the received value is the path carrying a RAW break -- three lines where one was expected, the middle one empty and the last one `source: workspace`. That file is re-run by no baseline, which is why the arm could be written and seen red rather than arriving green with the fix.',
          "GREEN AFTER, FULL DEFINITION OF DONE: PASSED, all five checks exit 0, 948 pass / 0 fail over 70 files, 2903 expect() calls, 166.90s, ONE non-gating `eslint(require-yield)` warning. The delta over subtask 4's 947/2898 is the one new arm with its THREE assertions plus the TWO the resolve arm gained. THE DECOMPOSITION READ `two` AND `three` THE OTHER WAY ROUND -- a total that was measured and constituents that were predicted, which is this project's own most-caught defect arriving inside the note reporting a measurement.",
          "THE RESOLVE ARM'S WIDENING IS NOT A SECOND READING OF THE COMPLETION ARM, and it needed a construction the plan did not spell: resolve writes NO `detail`, so there is nothing there to read unless the arm SENDS one. It sends the field as the completion half writes it -- flattened -- and requires it back byte-identical from both markup arms. What that refuses is a handler rebuilding `detail` from the mark, which has none of the completion's context and would put the raw name back in front of the user.",
          "WHAT IS STILL NOT CLOSED IS WRITTEN AT THE SITE RATHER THAN LEFT TO BE DISCOVERED, and one half of it is wider than the arms that predate this sprint said: markdown syntax inside a name still renders as syntax, AND `label` and `insertText` still carry the name RAW. That second half is not a gap this sprint opened and cannot be closed -- `insertText` is what is written into the buffer and `label` is what a client filters on, so flattening either would insert a file name that names no file.",
        ],
      },
      {
        test: "THREE PERTURBATIONS, TAKEN AGAINST THE LANDED TEXT AND READ RATHER THAN PREDICTED -- a green without them does not meet criterion 3, 4 or 6, which is the item's own ruling. ONE: the stat composer's DIRECTORY arm made to report `stats.size` must redden `a directory item comes back saying it is a directory, and carrying no size`, and the arms it ALSO reddens are required by name, a red beside the arm rather than at it being the failure this instrument exists to refuse. TWO: `sourcesFor` keeping only the FIRST workspace folder must redden `every workspace folder is answered from, and its items name their root` -- the arm whose discriminator subtask 4 moved, and which stays GREEN under that perturbation if the move was not made. THREE, ADDED BY THE PRODUCT OWNER'S CHECKLIST AND NOT IN THE DEVELOPER'S PLAN: the composer emitting the stat BEFORE the source must redden the prefix arm, without which a prefix assertion over two values that are both correct today is satisfied by any implementation and the red is the whole of the evidence.",
        implementation:
          "Each edit is made, read and REVERTED. THE SUBTASK DOES NOT CLOSE ON A NOTE -- the product owner applied this dashboard's own header, A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED -- so each reading ends as a record test/perturbations.test.ts RE-RUNS. WHERE THAT COLLIDES WITH THE INSTRUMENT, RESOLVED HERE RATHER THAN LEFT AS A CONFLICT: the registry re-runs an ARM FILE, and two of these three arms live in files that spawn real servers on both runtimes, which is not a cost to put on every run. So each record NAMES AN ARM IN A NON-SPAWNING FILE, and where none exists the subtask ADDS one in the member suite whose subject is the same claim -- the cheap arm being what the record grades and the spawning arm staying as the wire-level statement. A perturbation for which neither is possible is reported as such and its reading anchored as an assertion beside the arm, which is the header's own second branch.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "06f493a",
            message: "test(completion-path): three readings become records the suite re-runs",
            phase: "green",
          },
        ],
        notes: [
          "ONE: THE STAT COMPOSER'S DIRECTORY ARM MADE TO REPORT `stats.size`. MEASURED against the landed text at 58b5f8d, the edit made and reverted: 9 pass / 9 fail in packages/tsudoi-completion-path/test/resolve.test.ts. The named arm is `a directory's stat line carries no byte count, where a file's carries one`, and the EIGHT it also reddens are recorded by name -- `the markup a block is built in follows the session, not the item`, WHICH THIS SENTENCE SPELLED WITH ITS PRE-RENAME NAME until a reviewer read it against HEAD: subtask 7, later in this same sprint, renamed that arm, and the registry was re-measured while the prose here was not, `a name that would forge an attribution line renders as one that cannot`, `a path whose own name would forge an attribution line renders as one that cannot`, `a source name no completion of ours produced is left out of the answer`, both cancellation arms, `a directory replaced by a file after the stat keeps the stat it took and renders no listing`, and `a directory whose item claims to be a file still comes back with its listing`. THE COLLATERAL IS THE CHANGE'S OWN CONSEQUENCE rather than a surprise: nearly every arm in that file compares a block WHOLE, and the stat line is now inside the block.",
          "TWO: `sourcesFor` KEEPING ONLY THE FIRST WORKSPACE FOLDER. MEASURED, the same way: 42 pass / 1 fail in packages/tsudoi-completion-path/test/completion.test.ts, the single red being the new arm `two workspace folders each contribute a source, and each item's detail names its own root`. THAT ARM READS `detail` AND THAT IS THE WHOLE POINT: the block names the CLASS of root, so both folders' items carry the identical string `source: workspace` and an arm reading there stays GREEN under this weakening.",
          "THREE: THE COMPOSER EMITTING THE STAT BEFORE THE SOURCE. MEASURED: 42 pass / 1 fail in the same file, the single red being `what completion sent is a strict prefix of what resolve answers, for both kinds`. NOTHING ABOUT EITHER BLOCK'S CONTENT CHANGES under this edit, which is why every whole-value assertion over one answer at a time stays green and why a prefix relation over two values that are both correct today says nothing until this is run.",
          "THE SUBTASK DID NOT CLOSE ON A NOTE, WHICH IS THE HEADER'S RULE AND THE PRODUCT OWNER'S CONDITION. Three records are in test/perturbations.test.ts and each NAMES AN ARM IN A NON-SPAWNING FILE. Two of the three claims are stated at the root through real servers on both runtimes; those arms stay as the wire-level statement and the cheap member arm is what the registry grades. The prefix claim had no cheap arm anywhere and gains one that drives BOTH handlers in process -- packages/tsudoi-completion-path/test/completion.test.ts imports `resolvePathStat` for that one arm, because the relation is about the PAIR and no file driving one half can state it.",
          "A NEW ARM FILE ENTERED THE REGISTRY AND ITS STAGE BASELINE WAS THE RISK, NOT THE RECORDS. packages/tsudoi-completion-path/test/completion.test.ts had never been re-run inside a staged checkout, which brings its own `every arm in <file> passes before any weakening`. MEASURED: it passes, and all NINE registry arms report HELD. The fallback if it had not -- re-homing both arms into the member's resolve suite and driving `pathCompletion` from there -- was named before the run and was not needed.",
          "FULL DEFINITION OF DONE: PASSED, all five checks exit 0, 955 pass / 0 fail over 70 files, 2925 expect() calls, 170.44s, nine registry arms HELD, ONE non-gating `eslint(require-yield)` warning. THE FIRST TAKE OF IT FAILED ON FORMAT ALONE -- oxfmt rewrapped two of the new arms -- which is the failure sprint 81 recorded and which is why `oxfmt .` is run before the reading rather than after it.",
          "THE THREE READINGS WERE FIRST TAKEN ONLY AGAINST THE CHEAP ARMS, WHICH SATISFIED THE RECORD'S OBLIGATION AND NOT THE CRITERIA'S. Criteria 3 and 6 name the ROOT arm each perturbation must redden, and criterion 3 adds `A green taken without that perturbation does not meet this criterion` -- so the wire-level readings are owed too, and `it would obviously redden` is the argument at review this dashboard refuses. TAKEN NOW at 43aa575, each edit made and reverted. ONE, the stat composer's directory arm reporting `stats.size`, over test/resolve-path-stat.test.ts: 6 pass / 10 fail, `a directory item comes back saying it is a directory, and carrying no size` red ON BOTH RUNTIMES, beside the prefix arm, the crowded arm, the tamper arm and the locked-directory arm. THREE, the stat emitted before the source, over the same file: 2 pass / 14 fail, `each kind's block only GAINS: what completion sent is a strict prefix of what resolve answers` red on both runtimes.",
          "TWO IS A FINDING AND NOT A CONFIRMATION, AND IT IS RECORDED RATHER THAN SMOOTHED. `sourcesFor` keeping only the first workspace folder DOES redden `every workspace folder is answered from, and its items name their root` on both runtimes -- 42 pass / 2 fail in test/workspace.test.ts -- BUT IT REDDENS AT THE WRONG ASSERTION: the failure is at :1025, `inserted(items)` over the three files the three roots hold, which is a MEMBERSHIP claim that predates this sprint and is read before the `detail` discriminator ever is. So that perturbation grades `the second folder was asked` and says nothing about where the two items are told apart, which is what criterion 6 is about.",
          "SO A SECOND PERTURBATION WAS RUN TO ISOLATE THE MOVED DISCRIMINATOR, AND IT IS THE ONE THAT MEETS CRITERION 6. `itemsFrom` made to write `flattened(source.name)` into `detail` instead of the path leaves every root answering, every file offered and BOTH ITEMS' BLOCKS UNTOUCHED at the identical string `source: workspace` -- which is exactly the degeneration the criterion names -- and the arm reddens AT :1046, the `detail` assertion, on both runtimes: 42 pass / 2 fail. THE ACCOUNT OF WHAT THAT PAIR SHOWS WAS BACKWARDS AND A REVIEWER INVERTED IT BACK. It said the plan's perturbation would have PASSED an un-re-sited arm; it would not -- the membership assertion at :1025 predates the re-siting entirely and reddens in both worlds. It is THIS perturbation that leaves an un-re-sited arm green, both blocks being untouched, which is what makes it the one that grades the criterion. The plan's reddens either arm at the wrong assertion; this one reddens only the re-sited one.",
          "NO RECORD WAS ADDED FOR THAT SECOND PERTURBATION, AND THE REASON IS THE INSTRUMENT'S REACH RATHER THAN A JUDGEMENT ABOUT ITS VALUE: `alsoReddens` is read over ONE arm file, and the arm it isolates lives in test/workspace.test.ts, which spawns real servers on both runtimes. Its cheap twin -- `two workspace folders each contribute a source, and each item's detail names its own root` -- is recorded, under the plan's perturbation. WHAT NOTHING RE-RUNS is the isolating reading itself, which is stated here so the registry's green is not over-read.",
        ],
      },
      {
        test: "THE CLAIM IS MIGRATED, NOT REPAIRED, AND THE ARM THAT LOSES IT SAYS SO. `the documentation format follows what the client declared, both ways` turns on a rule appearing in markdown and not in plaintext; with the completion block reduced to ONE part there is no join to perform, the two formats produce IDENTICAL value bytes and only `kind` discriminates -- so that arm narrows to `kind` with the loss written at the site rather than being handed new expected strings. What replaces it is the FILE half added to the member resolve suite's `the markup a directory's block is built in follows the session, not the item`: a resolved file's block now carries two parts, so the rule is back. BORN GREEN, AND ITS FALSIFIER IS NAMED: fixing the composer's separator to the plaintext one reddens the new file half and leaves the plaintext arms untouched.",
        implementation:
          "packages/tsudoi-completion-path/test/completion.test.ts's format arm, narrowed with its reason; packages/tsudoi-completion-path/test/resolve.test.ts's markup arm, widened to the file kind and renamed off `directory`.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "d2f80d8",
            message:
              "test(completion-path): the markup rule migrates to the half that still has parts",
            phase: "green",
          },
        ],
        notes: [
          "THE NARROWED ARM KEEPS THE IDENTITY IT NARROWED ONTO, WHICH THE PLAN DID NOT ASK FOR AND WHICH IS WHAT MAKES THE LOSS READABLE: after asserting `kind` four ways, the completion format arm asserts the two formats' VALUES are the same bytes. Without that line the narrowing reads as a weakening somebody chose; with it, it reads as a fact about a one-part block, and it is the line that stops being true the day the block gains a second part.",
          "THE NAMED FALSIFIER FIRES AND DOES NOT ISOLATE THE NEW HALF, MEASURED RATHER THAN ASSUMED. The composer's separator fixed to the plaintext one: 62 pass / 3 fail in the member suite -- the migrated arm plus `a name that would forge an attribution line renders as one that cannot` and `a path whose own name would forge an attribution line renders as one that cannot`, and every plaintext arm green, which is the half the plan predicted. BUT THE MIGRATED ARM REDDENS AT ITS DIRECTORY HALF, which predates this sprint, so that reading says nothing about the FILE half it just gained. THE FALSIFIER THAT DOES: the rule dropped for a TWO-part block only -- `markdown && parts.length > 2` -- which reddens this arm ALONE out of the whole member suite, 64 pass / 1 fail. Recorded because the plan's falsifier was named before either half existed and turns out to grade the older one.",
          "THE REGISTRY CAUGHT THE RENAME AND THAT IS THE INSTRUMENT WORKING, NOT AN ACCIDENT AVOIDED. Renaming `the markup a directory's block is built in follows the session, not the item` left record 1 naming it among its collateral, and the full run went 954 pass / 1 fail with `the recorded weakening still reddens: a directory's stat line carries no byte count, where a file's carries one` DISARMED -- the direction that fires when a recorded set is LONGER than what reddened, which is what a rename leaves behind. RE-MEASURED RATHER THAN EDITED BY EYE: the same nine arms under the same weakening, one of them renamed.",
          "FULL DEFINITION OF DONE after the repair: PASSED, all five checks exit 0, 955 pass / 0 fail over 70 files, 2929 expect() calls, 192.66s, nine registry arms HELD, ONE non-gating warning. The arm count is unchanged from subtask 6 -- both arms here were narrowed or widened in place -- and the expect() delta of four is the file half's two assertions and the identity pair.",
        ],
      },
      {
        test: 'THE HALF THAT WOULD NEVER HAVE ANNOUNCED ITSELF. `an item the example never produced is returned untouched, in a session where enrichment is happening` stays GREEN through everything above, because `typeof enriched.detail === "string"` is satisfied UNCONDITIONALLY by completion once it writes the path -- and its docblock is explicit that the line is the LIVENESS half, without which the arm is satisfied by three worlds at once, one of them being no handler called in this process at all. Re-read as a `documentation` DELTA and deliberately NOT as an equality, the docblock ruling it weaker than a pin on purpose. THE DISCRIMINATING PERTURBATION FOR BOTH LIVENESS HALVES, this one and the deleted-file arm\'s: `resolvePathStat` made to answer the item untouched must redden the delta and must LEAVE `typeof detail === "string"` green. AND THE DELTA\'S OWN DEGENERATION IS WHAT THE PRODUCT OWNER FLAGGED: it needs a state where the delta is EMPTY and the arm goes red, or it is the same defect wearing a different field\'s name.',
        implementation:
          "test/resolve-path-stat.test.ts, the foreign-item arm and the deleted-file arm. The foreign item's own claim -- byte-identical answer, nothing on stderr -- is untouched; what moves is only what witnesses that enrichment was happening in that session.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "a2ce7e4",
            message:
              "test(resolve-path-stat): the liveness halves read a delta, not a field that is always there",
            phase: "green",
          },
        ],
        notes: [
          'THE SILENT GREEN WAS DEMONSTRATED AND NOT ARGUED, WHICH IS THE WHOLE OF THIS SUBTASK. MEASURED at d2f80d8, `resolvePathStat` inverted so every UNABORTED request answers the item untouched, with the arms as they then stood: 2 pass / 14 fail in test/resolve-path-stat.test.ts, and `an item the example never produced is returned untouched, in a session where enrichment is happening` was ONE OF THE TWO THAT STAYED GREEN, on both runtimes. Its liveness half read `typeof enriched.detail === "string"`, which completion now satisfies unconditionally. AFTER the re-read, under the same perturbation: 0 pass / 16 fail. That pair is the discriminating measurement the subtask asked for -- the same weakening, the same file, green before and red after.',
          "THE PERTURBATION HAD TO BE RESHAPED TO COMPILE, AND THE SHAPE IS WORTH RECORDING BECAUSE THE OBVIOUS ONE IS NOT AVAILABLE HERE. `return item;` inserted above the composed answer is UNREACHABLE CODE, and the member's build refuses it -- `tsc -p packages/tsudoi-completion-path/tsconfig.build.json` exits 2 inside the `bun test` preload, so the arm file reports 0 pass / 1 fail / 1 error and NO arm has a result of its own. What was run instead is the abort check INVERTED, which is reachable, leaves every import used, and answers untouched for exactly the requests these arms make.",
          "THE DELETED-FILE ARM'S HALF WAS ALREADY AN EQUALITY WHEN THIS SUBTASK REACHED IT, AND THAT WAS SUBTASK 4'S DOING RATHER THAN THE BASE'S: at base it read `expect(enriched.detail).toBe(fileDetail)` and subtask 4 had to make it true in the same commit as the source, so it became a `documentation` equality. Turned into a delta here for the reason the item gives -- the arm's subject is the answer for a path that has GONE, and pinning the bytes of the answer for the path that had not makes a change to the block's spelling redden in two places.",
          "FULL DEFINITION OF DONE: PASSED, all five checks exit 0, 955 pass / 0 fail over 70 files, 2933 expect() calls, 178.23s, nine registry arms HELD, ONE non-gating warning. The expect() delta of four over subtask 7 is the two liveness halves becoming two assertions each.",
        ],
      },
      {
        test: "NOTHING REDDENS HERE AND THE ITEM SAYS WHY: the member README's prose about which field carries what is graded by NOTHING -- `readmeCoverage` accounts for FENCED BLOCKS and this claim is not in one -- so it is in scope as WORK and out of scope as a CRITERION. WHAT STANDS IN FOR A RED is that every sentence rewritten below is checked against the arms that landed above, and a sentence with no arm behind it is not written.",
        implementation:
          "`documentationFor`'s byte-for-byte clause in packages/tsudoi-completion-path/src/completion.ts -- DISSOLVED AND NOT PATCHED: it speaks of an item nothing was learned about, and under this change resolve ALWAYS learns the stat because a failed stat returns the item untouched, so the sentence has no referent; what replaces it is criteria 2 and 4, and the composer stays shared for the source line and the markup rules. `itemsFrom`'s NO DETAIL IS READ HERE, whose refusal survives and whose wording does not -- what is refused is a STAT per entry. The carrier comment in test/completion.test.ts reading THE CARRIER IS `documentation`, not the label and not `detail`, the exact ruling this sprint reverses and so where the reversal's reason belongs. The MEASURED pass/fail counts in src/resolve.ts, VOID once the arms they were taken over are rewritten -- DELETED rather than superseded, a count taken against arms that no longer exist being un-re-takeable. The member README's `What resolving one item costs` paragraph. LAST, because it describes what landed rather than what was intended.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "43aa575",
            message:
              "docs(completion-path): the prose about which field carries what follows the code",
            phase: "refactoring",
          },
        ],
        notes: [
          "EVERY SENTENCE REWRITTEN HERE HAS AN ARM BEHIND IT, WHICH IS WHAT STANDS IN FOR A RED. `the block only ever GAINS` is criterion 4's arm at the root and its cheap twin in the member's completion suite; `documentation and nothing else` is the `toEqual({ ...item, documentation })` shape in two root arms; `no byte count on a directory` is the re-sited arm plus its registry record; `detail comes back byte for byte` is the forgery arm's widening. The one claim with NO arm is the trade -- inline truncation -- and it is written as a thing this repository cannot decide rather than as a fact.",
          "THE COUNTS IN src/resolve.ts WENT AND WERE NOT RE-TAKEN, which is the disposition the item ruled: `15 pass / 0 fail` and `reddens 11` were readings over arms this sprint rewrote, so re-taking them would produce a different number over a different set and mean nothing to a reader comparing. The CLAIM they were attached to -- that the `isDirectory()` test saves a syscall and is not what keeps a file answering as a file -- survives without them.",
          "FULL DEFINITION OF DONE: PASSED, all five checks exit 0, 955 pass / 0 fail over 70 files, 2933 expect() calls, 185.39s, nine registry arms HELD, ONE non-gating `eslint(require-yield)` warning. Byte-identical arm and assertion counts to subtask 8, which is what a documentation-only subtask should read.",
          "THE README CHANGE IS GRADED BY NOTHING AND THE ITEM SAID SO IN ADVANCE: `readmeCoverage` accounts for FENCED BLOCKS, and none was added or edited -- the fenced snippet and its consumers are untouched, which is why test/readme-coverage.test.ts, test/readme-accounts.test.ts and test/readme-layout.test.ts are all green without an edit. In scope as work, out of scope as a criterion.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE BASE IS MEASURED AND NOT ASSUMED, WHICH THIS DASHBOARD'S FILING BAR REQUIRES BEFORE ANY RED CAN BE CALLED PRE-EXISTING. At 65ecc06, with `tsc` and `oxfmt` shimmed onto PATH from real binaries: Definition of Done PASSED, all five checks exit 0, 945 pass / 0 fail over 70 files and 2884 expect() calls in 179.59s, six registry arms HELD. ONE WARNING, reported and not gating: `eslint(require-yield)` at test/fixtures/throws-on-cancel.ts. ANY RED THIS SPRINT IS THIS SPRINT'S UNTIL MEASURED OTHERWISE AGAINST THAT.",
      "THE THREE QUESTIONS THE DEVELOPER SAID BLOCKED WRITING THE RED TESTS WERE RULED AT REFINEMENT, TWO OF THEM BY THE STAKEHOLDER'S OWN INSTRUCTION. Order `source, stat, listing`; the path NOT also left in the block; `detail` flattened. Only the third was open, and it is taken as the conservative answer: the path leaves the composer that owns `flattened`, so the line-break injection the forgery arm exists to refuse reopens in a field nothing sanitises.",
      "SUBTASK 4 IS ACCEPTED UNSPLIT, AND THE PRODUCT OWNER PRICED THE ALTERNATIVE RATHER THAN WAIVING IT. A split costs either a temporary second spelling of the composer -- dead code shipped then removed, graded by nothing -- or a RED test/perturbations.test.ts across a commit boundary, which this project forbids outright. THE CONDITION IS THAT ITS `test` FIELD NAMES WHICH ARMS MUST BE RED BEFORE THE SOURCE EDIT, so one big green commit is readable afterwards.",
      "THE FLATTENING SPLIT IS RULED IN, AND WITH IT A DISCLOSED REGRESSION THAT NEEDED AN OWNER. Between subtask 4 and subtask 5 the shipped source writes an unflattened path into `detail`, and at base that path IS flattened in the block -- so this is a regression, not an absence. Folding it into subtask 4 recreates the exact entanglement subtask 1 exists to prevent, on the largest subtask in the sprint, and risks criterion 5 being met BY INHERITANCE rather than by a red anyone saw. Accepted because it is bounded and named, on an unpublished package nobody consumes per commit, under two conditions: subtask 4's commit body names the state it leaves and the subtask that closes it, and CRITERION 5 UNMET BLOCKS ACCEPTANCE -- a sprint cut short must not leave the last green commit carrying a disclosed regression with no owner.",
      "A SUBTASK THAT SHIPS NOTHING IS ACCEPTED, AND THE PRODUCT OWNER'S CONDITION ON IT RESOLVED A CONFLICT THE DEVELOPER HAD LEFT OPEN. Three closed sprints ended on a subtask whose commits are empty and whose deliverable is a recorded reading. But the header says A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED, and the developer had proposed exactly a note, giving the instrument's reason: the registry re-runs an ARM FILE and two of these arms spawn real servers on both runtimes. THE RESOLUTION IS NEITHER SIDE'S -- each record names an arm in a NON-SPAWNING file, and where none exists the subtask ADDS one in the member suite carrying the same claim, so the cheap arm is what the registry grades and the spawning arm stays as the wire-level statement.",
      "A THIRD PERTURBATION WAS ADDED BY THE PRODUCT OWNER'S CHECKLIST AND NOT BY THE PLAN. The prefix criterion is satisfied by ANY implementation whose two values are both correct today, so without a reorder perturbation -- the stat emitted before the source -- its green says nothing. The same checklist caught that the completion-half equality must be WHOLE-VALUE on both fields: a containment lets an implementation that also left the path in the block pass criterion 1 and make criterion 4 hold vacuously, which is two failures conspiring rather than two failures.",
      "FILED AND NOT REPAIRED, AND IT MEETS THE HEADER'S BAR RATHER THAN INVOKING IT. `statLine` is composed OUTSIDE the `try` that wraps the stat, and `stats.mtime.toISOString()` throws `RangeError: Invalid Date` on an out-of-range mtime -- which would answer -32603 and take away the popup the user is reading, the exact outcome this package states it refuses. IT IS PRE-EXISTING: at base 2ed9d43 the same expression stood in the same position, inside `detailFor`, called from the same return outside the same try; this sprint moved the symbol and not the exposure. AND IT IS NOT DEMONSTRATED REACHABLE: MEASURED on darwin/APFS, `utimes` at 8.64e12, 1e13, 1e15 and 6.7768e16 seconds all SATURATE at 2^63 nanoseconds and negative extremes clamp to now, so no local write produces one. The throw shape itself is confirmed against a `Stats`-shaped value carrying `new Date(NaN)`. Not repaired because a guard for an input nothing on a supported platform can produce is the unreachable-safety-net shape this project also refuses; recorded so the next reader has the measurement instead of the question.",
      "AND ONE THE SPECIFICATION OFFERS THAT THIS ITEM DID NOT CONSIDER, WHICH IS A BACKLOG QUESTION AND NOT A DEFECT. `CompletionItemLabelDetails.description` is the field the LSP's own doc comment nominates for a fully qualified name or a FILE PATH, while `detail` is nominated for type or symbol information -- so the arrangement this sprint landed is a spec-PREFERENCE deviation, and legal either way. IT IS NOT A DROP-IN: `labelDetails` is 3.17.0 and gated on `labelDetailsSupport`, which nothing here reads, so it is an addition with `detail` as fallback. AND IT DOES NOT ANSWER THE ITEM'S STANDING DISSENT -- `labelDetails.description` renders in the same inline label region, so moving the path there would not escape the truncation the product owner held the item over. That is what keeps this off the backlog for now rather than on it.",
      "THE `revise` ROUND'S YIELD, WITH THE DENOMINATOR THIS PROJECT REQUIRES. Ten independent reviewers over one increment, and EVERY actionable finding was in the increment rather than in a previous round's wake -- which is what a first round should look like and is the reading sprint 81's eight-round measurement makes worth taking. TWO were reported independently by two reviewers each: `NO STAT IS TAKEN HERE`, false at the very line it stood on, and the `detail` rationale naming a state the dedup forecloses. THREE arms had stopped reading anything. TWO perturbation-record reasons were false while the records themselves held. FIVE records in this file were refuted by this sprint's own commits, including a count that was the figure AFTER the probe it was reporting on and a decomposition with its constituents swapped. THE SOURCE'S BEHAVIOUR SURVIVED UNTOUCHED: not one finding required a code change, and the increment's two invariants were confirmed by reading rather than repaired.",
      "WHAT IS RULED OUT, EACH POINTING AT THE NOTE THAT ALREADY REFUSED IT: reading the path off `item.detail` in the resolve half; leaving the path in `documentation` as well; a shortened or root-relative `detail`, deferred to a new item; the root README's prose. The member README's field statement is IN as work and OUT as a criterion, since nothing grades it.",
    ],
  },
  retrospectives: [],
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
