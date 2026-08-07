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
            'bun test -t "a directory item comes back saying it is a directory, and carrying no size" re-sited onto the stat line inside `documentation`, THEN perturbed: `detailFor`\'s directory arm made to report `stats.size` must redden it. A green taken without that perturbation does not meet this criterion.',
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
        "TWO HELPERS ARE MIS-INDEXED BY THIS CHANGE AND BOTH GO GREEN WHEN THEY ARE WRONG. `listingSection` exists twice -- in the member suite and in test/resolve-path-stat.test.ts, duplicated deliberately with a docblock saying the two MUST NOT DISAGREE -- and both locate the listing as part index 2, derived from `path, source, listing`. Under `source, stat, listing` the index is right BY ACCIDENT. Re-deriving them to locate the listing by its own header, against TODAY's composition and before any behaviour moves, is the first subtask for that reason: without it a re-index defect and a composition defect are indistinguishable in every red that follows.",
        'WHAT THE MEMBER SUITE\'S FIXTURE MUST GAIN, AND IT IS THE LARGEST PIECE OF WORK NOBODY WOULD PREDICT. Nearly every member arm compares WHOLE `MarkupContent` values and its own docblocks refuse weakening them. They are stable today only because the volatile part -- `modified <iso>` -- lives in `detail` and is read through `.split(" · ")[0]`, never whole-value. Put the stat in the block and every one depends on an mtime `test/helpers/tree.ts` does not control. The root suite is already immune: it fixes the stamp with `utimesSync`. SO THE FIXTURE CHANGES AND THE ASSERTIONS DO NOT -- children written FIRST and stamps set after, because writing into a directory bumps its mtime, and a whole second because filesystems disagree about sub-second precision.',
        "ONE ARM'S SUBJECT DOES NOT SURVIVE AT COMPLETION TIME AND IS MIGRATED RATHER THAN REPAIRED. `the documentation format follows what the client declared, both ways` turns on a `---` rule appearing in markdown and not in plaintext; with the completion block reduced to ONE part there is no join to perform, so the two formats produce IDENTICAL value bytes and only `kind` discriminates. The claim moves to the resolve suite, where two or three parts remain. Recorded because the arm will otherwise be read as merely needing new expected strings.",
        "`completedSource` STAYS, DECIDED BY AN EXISTING ARM RATHER THAN BY PREFERENCE. The source is not derivable from the path -- one file is reachable from the document's directory, the cwd, a workspace folder and an absolute fragment at once -- and the only way to drop it is to APPEND to the documentation the client sent back, which the tamper arm forbids for both kinds. The mark stays the sole key: READING THE PATH OFF `item.detail` NOW THAT IT IS THERE IS THE EDIT TO REFUSE, `detail` being a display field a client may rewrite.",
        "`documentationFor`'s BYTE-FOR-BYTE CLAUSE IS DISSOLVED, NOT PATCHED. It says the two halves must agree byte for byte about an item nothing was learned about; under this change resolve ALWAYS learns the stat -- a failed stat returns the item untouched -- so there is no such item and the sentence has no referent. What replaces it is criterion 2 plus criterion 4, and the composer stays shared for the source line and the markup rules. The same claim is restated in `itemsFrom`'s comment and in the completion suite's mark docblock; all three move together.",
        "THE ARGUMENT FOR, AT ITS STRONGEST: the free fact arrives late and the expensive one arrives early. Which of four roots offered a candidate, and which file it actually is, are known when the item is built and cost no syscall -- and are legible today only in a window the completion suite's own comment flags as optional. The stat is the only thing here costing a syscall. This puts the free fact in the eagerly-rendered field and the expensive one in the lazy one.",
        "THE SECOND ARGUMENT IS REASONED AND ITS PREMISE WAS MEASURED. `textDocument.completion.completionItem.resolveSupport.properties` lists which properties a client honours when they arrive from resolve, so a client naming `documentation` alone silently drops a `detail` first appearing at resolve -- today's stat line. MEASURED, ripgrep over the whole checkout: `resolveSupport` has ZERO matches, so nothing here reads it and NO CRITERION MAY LEAN ON IT. Criterion 2 delivers the same robustness by asserting our own answer's shape instead.",
        "THE STRONGEST RISK, AND IT IS NOT DECIDABLE FROM INSIDE THIS REPOSITORY, SO IT IS RECORDED RATHER THAN RESOLVED. `detail` renders INLINE, and inline is where clients truncate. An absolute path's discriminating part is its TAIL -- exactly what truncation eats -- so this can fail to deliver the disambiguation it is motivated by while giving up a stat line that fits inline well. THE PRODUCT OWNER HELD THE ITEM AT `refining` FOR THIS; the facilitator ruled it `ready` because the stakeholder stated the design as an instruction rather than as a question, and because the criteria's SHAPE does not depend on the answer. A SHORTENED path -- relative to the source's root -- is the alternative and is deliberately NOT drafted: it would make `detail` say something `data.pathCompletion` does not, and this item keeps the two identical. Reopen as a new item if the trade turns out badly in a real editor.",
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
  sprint: null,
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
