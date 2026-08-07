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
      id: "PBI-85",
      story: {
        role: "editor user",
        capability:
          "read a path completion popup whose rows name the ENTRY, with the directory part already on the line appearing in none of them",
        benefit:
          "the bytes that tell two candidates apart start at the left edge of every row instead of behind a prefix every row repeats -- and the deeper the directory, the more of the popup that prefix was taking",
      },
      acceptance_criteria: [
        {
          criterion:
            "AN ITEM'S `label` IS THE ENTRY'S OWN NAME AND CARRIES NO PART OF THE FRAGMENT'S DIRECTORY. A MULTI-SEGMENT FRAGMENT IS THE ONLY THING THAT GRADES THIS: where the fragment names no directory, the entry name and the inserted text are the SAME STRING, so an arm written on one passes against the source this item exists to change.",
          verification:
            "An arm in packages/tsudoi-completion-path/test/completion.test.ts over a fragment carrying TWO directory segments, comparing the labels WHOLE against the entry names -- never `not.toContain`, which the empty label also satisfies. TWO AND NOT ONE, WHICH THE REVIEW ROUND SUPPLIED AND THIS CLAUSE HAD WRONG: over one separator a label cut at the FIRST rather than the LAST is the same string, so every label assertion in the tree was green against a popup still repeating a segment the user had typed. PERTURBATION: `label: insertText` restored reddens it, and the single-segment arm beside it STAYS GREEN, which is what says the arm grades the directory part rather than the field.",
        },
        {
          criterion:
            "EVERY ITEM CARRIES `filterText`, BYTE FOR BYTE WHAT IT INSERTS. A client filters against the text its edit RANGE covers, and that range begins where the FRAGMENT begins -- so with the directory part gone from the label, an item filters itself away at the keystroke that types a separator. THE STAKEHOLDER'S OWN CLIENT IS NOT WHAT THIS BUYS, which is recorded rather than assumed: ddc-source-lsp reads `insertText` and passes `filterText` over with a comment saying why, so this criterion is what keeps the change from being a regression on the clients that do read it.",
          verification:
            "`filterText` and `insertText` each compared WHOLE against the same value on a multi-segment fragment, beside `textEdit.newText`, AND ON A NAME WORTH READING THEM ON: the review round found both readers driving an ordinary name, where flattening is a no-op, so `filterText: flattened(insertText)` was green across the suite. PERTURBATION: `filterText` NARROWED TO THE ENTRY NAME -- red, with the single-segment arm green. THE CRITERION SAID DROPPED AND THE RECORD DOES NOT, and both were measured: an absent field is absent for every fragment shape, so dropping it reddens the control too and grades nothing about the directory part. The instrument is amended to the reading that discriminates, not the increment to the one that passes.",
        },
        {
          criterion:
            "WHAT THE ITEM INSERTS IS THE TYPED DIRECTORY AND THE LABEL, which is what forecloses the edit this change makes look free. FIRST WRITTEN AS A CONTAINMENT AND CORRECTED BY THE REVIEW ROUND: every string contains the empty one, so the containment was green for `label: \"\"` -- the one label value the client discards outright. `flattened()` is applied to `detail` and to the block and to NEITHER `label` NOR `insertText`; the recorded reason for the label half -- that a client filters on it -- stops holding the moment `filterText` exists, and what replaces it is the client's: READ FROM ddc-source-lsp's SOURCE AND MEASURED NOWHERE HERE, an item whose label the client cannot find in the word it reconstructs from the edit range is DROPPED, under an option that defaults off. WHAT IS ASSERTED IS A PROXY AND IS NARROWER: that word is a TAIL of the inserted text, so the relation is necessary for the client's rule and not sufficient for it, and the sufficient one would mean modelling that client's cut here.",
          verification:
            "An arm over a name holding a line break, under two directory segments, asserting that what is inserted IS the typed directory and the label -- and reading `filterText` on that same name, which nothing else does. PERTURBATION: the label flattened -- red there AT THE RELATION, while the forgery arm on `detail` stays green, which is what tells the two fields apart.",
        },
        {
          criterion:
            "WHAT IS WRITTEN INTO THE BUFFER DOES NOT MOVE: `insertText`, `textEdit.newText` and BOTH ranges are what they were, so no client's insertion changes and the widening-fragment reading of a filename holding a space is untouched.",
          verification:
            'The three arms under `describe("applying the item yields the path it names")` -- a describe and not a test, which a reader grepping for the name would otherwise not find -- stay GREEN across every commit of this item, and they are NAMED because a criterion asking only for a red asks for nothing. THE HELPER THOSE ARMS CALL IS `applyAsClient`, whose last resort is `insertText ?? label` and which no arm reaches, since every item this package builds carries `insertText` -- so the arms and not the helper are what is named. THIS CLAUSE FIRST NAMED `inserted()` AND WAS FALSE OF IT: that helper reads `insertText ?? ""` and holds no label at all. Corrected during the sprint rather than read past, the criterion being what the product owner grades against.',
        },
        {
          criterion:
            "THE PROSE THIS FALSIFIES IS REPAIRED WHERE IT STANDS. The docblock over the forgery arm says `label` and `insertText` carry the name RAW because one is written into the buffer and THE OTHER IS WHAT A CLIENT FILTERS ON -- the second half is what this item deletes. The member README's `Which field carries what` paragraph names which field is read at which moment and now has a third field to name.",
          verification:
            "Read, CASE-INSENSITIVELY, this tree writing its reasons in capitals: no sentence anywhere gives filtering as the LABEL's PRESENT reason, sprint 82's own record in this file being narrowed to the past tense rather than left standing ahead of its amendment. And the README paragraph names `label`, `filterText` AND `insertText` -- the third being the one the first spelling dropped while keeping the reason that belongs to it. No fenced block moves, so `readmeCoverage` needs no new marker and no new `consumers` row.",
        },
      ],
      status: "ready",
      notes: [
        "THE REPORT, IN THE STAKEHOLDER'S OWN TERMS: `/Users/` typed into a buffer, and every row of the popup reading `/Users/.localized`, `/Users/Shared`, `/Users/atusy`. Their words were that this had been fixed before.",
        "WHAT THE EARLIER FIX ACTUALLY DID, READ AND NOT INFERRED, because naming the wrong commit is a failure this project has already recorded. 4a1bdfa made the label `${insertText} (${source.name}: ${source.root})`; 9f35af2 took the decoration back off, its commit body naming the stakeholder as having removed the decorated label. The label was `insertText` before the first and after the second, so the DIRECTORY PART was never in either edit's scope -- what those two commits added and removed was the source and the root.",
        "WHAT THE CLIENT DOES WITH EACH FIELD, READ FROM ITS SOURCE AND MEASURED NOWHERE: nothing in this repository spawns an editor, and no check here can. In ddc-source-lsp's denops/@ddc-sources/lsp/completion_item.ts the popup renders `abbr`, which is the item's `label`; what is inserted is `word`, taken from `insertText ?? label` and re-cut at the edit range; `filterText` is passed over deliberately, with the reason in a comment. So on the stakeholder's editor the label alone is what they saw, and moving it changes the display and nothing else.",
        "WHY `filterText` RATHER THAN A NARROWER EDIT RANGE. Beginning the edit after the last separator would make the entry name the whole item and need no `filterText` at all -- REFUSED: it moves what is written into the buffer, which criterion 4 forbids, and the widening-fragment machinery that reaches a filename holding a space is built on the range beginning where the FRAGMENT begins.",
        "WHAT IS NOT IN THIS ITEM. `CompletionItemLabelDetails.description`, which sprint 82's records weighed and deliberately left off the backlog -- it renders in the same inline region and would not escape the truncation that kept it off. And the completion's `isIncomplete` ruling, which is tsudoi's published type and not this package's.",
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
        "THE MECHANISM, AND THE PART THAT MAKES IT MORE THAN A MISSING CHECK. `itemsFrom` never reads `context.signal`; cancellation closes the OUTER generator, and a generator's `return()` cannot take effect while an outstanding `next()` is still running. A batch is yielded only when it FILLS, so a fragment matching nothing in a huge directory reaches no yield point at all: the scan runs to EOF, holding the handle, after the client has already been answered -32800 through tsudoi's own race. The user sees a prompt cancellation and the process goes on working.",
        "WHY IT IS NOT A ONE-LINE FIX, WHICH IS WHY THIS IS A DRAFT RATHER THAN A TASK -- and it said `REFINED` in an item whose own criterion says it is not. Abandoning a half-read directory LEAKS ITS DESCRIPTOR ON ONE OF THE TWO RUNTIMES -- the resolve half already carries that finding at its own cancellation seam and declines to honour a late cancellation for it. So the release strategy is the item, not the signal read: a signal-aware drain that stops classifying and batching while still exhausting or explicitly closing the iterator.",
        "AND ONE CHEAP HALF THAT MAY BE WORTH SPLITTING OUT: `entryKind` stats every entry a listing reports as neither file nor directory, so a directory of symlinks costs one syscall per entry per keystroke. That is disclosed at the site and is a separate trade from cancellation, but the same scan is where it is paid.",
      ],
    },
  ],
  completed: [
    {
      number: 83,
      pbi_id: "PBI-83",
      goal: "The popup becomes labelled facts and a headed list -- `source:`, `size:` for a file alone, `lastModified:` truncated in the COMPOSER, then `Entries (n)` -- IN TWO SPELLINGS, because the stakeholder's quoted block is the PLAINTEXT one: three lines joined by a bare newline are one CommonMark paragraph and would render as a run-on line, so markdown bullets its facts and a FILE's two formats stay different bytes rather than collapsing into the vacuity sprint 82 migrated an arm to escape. The words `file` and `directory` leave the block by the stakeholder's ruling, and the two kind-discriminating arms are re-sited onto `size:` present-against-absent with their present cases. Sprint 82's two `sprint`-timing improvements land as mechanism FIRST: `redAt` before any composer moves, so every perturbation this item asks for reports WHERE its red fell.",
      status: "done",
      subtasks: [
        {
          test: "THE MECHANISM IS EXERCISED IN ITS OWN COMMIT OR IT SHIPS UNRUN, so the red is taken on the registry itself: `redAt` declared on the stat-size record at its byte-count assertion must report HELD, and the SAME fragment declared on the workspace-folder record must report the record REFUSED -- because that record's red lands at the four-source-names premise, which its own comment already confesses and which nothing grades today. The pair is the whole point: one record where the red is at the subject, one where it demonstrably is not. What ships is the second declared at the premise it actually reddens at, which is the truth about that record rather than a claim about it.",
          implementation:
            "`PerturbationRecord` in test/helpers/perturbation.ts gains an optional `redAt`; the reader keeps the failure's TEXT beside the pass/fail it already derives, so an arm's result carries what fell rather than only that something did; `read()` gains the arm that refuses a HELD whose named arm reddened somewhere other than `redAt`, and the reported line names the fragment it wanted beside the one it got. A FRAGMENT OF THE FAILURE TEXT AND NEVER A LINE NUMBER: this repository has measured line numbers going stale inside the sprint that wrote them, and a record pinned to one would report a moved assertion as a moved subject. FIRST, BEFORE ANY COMPOSER CHANGE, because every criterion below states where its red must land and today's instrument cannot answer that question at all. Sprint 82 retrospective improvement, and the dashboard header records eighty-one improvements across thirty-eight retrospectives with none closed -- this is instance one.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "6853136",
              message:
                "test(perturbations): a record can say WHERE its arm reddened, not only that it did",
              phase: "green",
            },
          ],
          notes: [
            "THE PLAN'S INSTRUMENT COULD NOT BE BUILT AS WRITTEN, AND THE CORRECTION IS THE FIRST MEASUREMENT OF THIS SUBTASK. It said the reader keeps the failure's TEXT beside the pass/fail it already derives -- but the pass/fail comes from bun's JUnit report, and MEASURED at bun 1.3.13 a failed `<testcase>` there carries `<failure type=AssertionError />` and NO message at all. So the text is read off the CONSOLE instead, and `runArmFile` pipes stderr where it ignored it. TWO SPELLINGS HAD TO BE RECONCILED, both measured: the console labels an arm by its describe path (`outer group > its own name`) where the report names it bare, and the duration suffix is printed for some arms and omitted for others -- so a block is attributed to the reported name its label ENDS WITH.",
            "AND `redAt` IS MATCHED AGAINST THE CARET-MARKED LINE RATHER THAN THE WHOLE BLOCK, WHICH IS NOT TIDINESS: bun's code frame prints the two lines before the failing one and the one after, and the first record this was declared on has FOUR CONSECUTIVE assertion lines -- two about a directory, two about a file. Matched against the frame, a record naming the FILE assertion would have been held by a red at the DIRECTORY one, certifying the opposite of what criterion 1 asks the instrument to discriminate. A block with no caret answers with the whole of itself, so a throw or a timeout is still nameable.",
            "THE PAIR WAS READ AS A MEASUREMENT AND NOT LEFT AS THE PLAN'S PREDICTION. MEASURED at base 7d06517 with the mechanism landed and the workspace record declared at its DISCRIMINATOR (`expect(workspaceItems.map((item) => item.detail).sort()).toEqual(`), `bun test test/perturbations.test.ts`: 28 pass / 1 fail over 29 arms. The fail is `the recorded weakening still reddens: two workspace folders each contribute a source, and each item's detail names its own root`, and the reported line reads that the arm reddened at `expect(sources.map((source) => source.name)).toEqual([` -- the four-source-names premise, which that record's own comment has confessed in prose since sprint 82 and which nothing graded. In the SAME run the stat-size record, declared at its DIRECTORY value `expect(directory).toBe(directoryStat);`, read HELD. One record where the red is at the subject, one where it demonstrably is not.",
            "WHAT SHIPS IS THE SECOND DECLARED AT THE PREMISE IT ACTUALLY REDDENS AT, and the reason it is not the REFUSED reading is the registry arm itself: it asserts `held`, so shipping REFUSED ships a red and this project takes none. MEASURED with the premise fragment in place: 29 pass / 0 fail, NINE registry arms HELD. The REFUSED reading is not left as prose either -- the probe arm `a red that fell at another assertion of the named arm is refused, never held` re-runs it every suite run, over a two-assertion probe whose two lines are ADJACENT, which is the shape a frame-matching reader survives and a caret-matching one does not.",
            "GREEN AFTER, FULL DEFINITION OF DONE at 7d06517 with the mechanism landed: PASSED, all five checks exit 0, 956 pass / 0 fail over 70 files, 2988 expect() calls, 163.62s, nine registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. The delta over the sprint base's 955/2982 is the one new probe arm and its six assertions, which is the whole of it.",
            "ONE RED NOBODY PREDICTED, AND IT IS A DISCLOSURE RULE RATHER THAN A DEFECT: `every runtime version this tree cites is accounted for, and every account is cited` reddened naming test/helpers/perturbation.ts, because the new comment records the JUnit finding as MEASURED AT bun 1.3.13 and test/version-citations.test.ts requires every citation in the tree to have an account. The account was added rather than the citation removed -- a measurement whose runtime is unstated is the thing that file exists to refuse.",
          ],
        },
        {
          test: "BOTH NARROWED RECORDS MUST REPORT HELD AGAINST TODAY'S ARM AND THAT IS THE MEASUREMENT: the prefix arm now sweeps four source names across two formats, so a reorder gated on markdown alone and a reorder gated on the `workspace` source alone must each redden it -- and each declares `redAt` at the cell it falls in, so a red arriving from the other format or another source is refused rather than read as proof. THE FALSIFIER IS THE STATE THE ARM WAS IN TWO ROUNDS AGO: narrow the sweep back to plaintext, or back to `cwd`, and each record goes red saying the arm no longer reddens -- which is exactly what ten perspectives missed twice and one reviewer found twice.",
          implementation:
            "Two records in test/perturbations.test.ts beside the uniform reorder record naming `what completion sent is a strict prefix of what resolve answers, for both kinds`: one whose replacement pushes the stat before the source only when the composer's own markdown flag is true, one only when the source is `workspace`. Both weaken packages/tsudoi-completion-path/src/completion.ts at the two conditional pushes. THEIR `from` IS THE TEXT THE BLOCK SUBTASK REWRITES, so they are re-taken there -- and cannot rot unnoticed, since the weakener throws when its `from` is not found exactly once. Sprint 82 retrospective improvement, instance two.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "8857536",
              message:
                "test(perturbations): a reorder gated on ONE format, and one gated on ONE source",
              phase: "green",
            },
          ],
          notes: [
            "THE SUBTASK COULD NOT BE DONE AS WRITTEN AND THE CORRECTION IS PART OF IT, WHICH SUBTASK 1'S INSTRUMENT MADE VISIBLE ONLY HERE. It requires each record to declare `redAt` AT THE CELL ITS RED FALLS IN -- but the prefix arm sweeps two formats across four source names inside ONE loop, so all eight cells share one source line, and a red reports `Expected: true, Received: false` whichever cell produced it. TWO THINGS MOVED: `siteOf` now keeps the matcher's own report beside the caret line (cutting the stack trace, so no record can be written against the `file.ts:4:21` at the end of it), and the arm's three assertions put the cell INTO the value they compare -- the shape test/installed-handler.test.ts and test/unbuilt-checkout.test.ts already use. Neither alone is enough: a line without values cannot name a cell, and values without the caret restore the frame bleed subtask 1 was built to avoid.",
            "BOTH NARROWED RECORDS REPORT HELD AGAINST TODAY'S ARM, AND SO DOES THE UNGATED ONE, EACH AT A DIFFERENT CELL. MEASURED at 6853136, `bun test test/perturbations.test.ts`: 31 pass / 0 fail, ELEVEN registry arms HELD. The three reorder records read `... @ plaintext from document`, `... @ markdown from document` and `... @ plaintext from workspace` -- the ungated reorder, the one gated on the composer's markdown flag, and the one gated on the `workspace` source. The ungated record gained a `redAt` too, or an unconditional reorder and a conditional one stay ONE observation.",
            'THE FALSIFIER IS THE STATE THE ARM WAS IN TWO ROUNDS AGO, AND IT WAS TAKEN RATHER THAN ARGUED. MEASURED at 6853136, the sweep narrowed to `["plaintext"]` alone: `bun test test/perturbations.test.ts -t "strict prefix"` reports 2 pass / 1 fail, the fail being the MARKDOWN-GATED record reading GONE QUIET -- the arm no longer reddens on the weakening recorded against it -- with the other two HELD. Narrowed instead to `["cwd"]` alone: 0 pass / 3 fail, the workspace-gated record GONE QUIET and the other two REFUSED, their cells `plaintext from document` and `markdown from document` no longer being reached at all. Both edits reverted; the arm file is byte-identical to the committed text but for this subtask\'s own reshape.',
            "ONE THING THE PLAN DID NOT PREDICT AND THE REPORT FORCED: three records now weaken ONE arm, so the registry's generated arm titles and its printed lines were THREE IDENTICAL STRINGS. A reader could not tell which held, and neither could a `-t` filter. Both now carry the record's site -- `<arm name> @ <redAt>` -- which is why this is a naming change in the instrument and not only two new rows.",
            "GREEN AFTER, FULL DEFINITION OF DONE at 6853136 with both records landed: PASSED, all five checks exit 0, 958 pass / 0 fail over 70 files, 2992 expect() calls, 158.71s, ELEVEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning. The delta over subtask 1's 956/2988 is the two new registry arms with one assertion each and the two the `redAt` probe arm gained -- the frame exclusion and the matcher's report, which are what this subtask widened `siteOf` to keep.",
            "THEIR `from` IS THE TEXT SUBTASK 4 REWRITES, AND THE WEAKENER IS WHAT STOPS THAT ROTTING UNNOTICED: `applyWeakening` throws when its `from` is not found exactly once, so all three reorder records fail LOUDLY rather than going quiet the moment the composer moves. They are re-taken there.",
          ],
        },
        {
          test: "BYTE-IDENTICAL OUTPUT IN ALL FOUR CELLS AND NOTHING TOUCHED IN ANY SUITE -- the whole-value block arms and the prefix arm are the check that a parameter changed shape and a block did not. THE STEP IS TAKEN NOW BECAUSE THE JOIN IS ABOUT TO BECOME TWO JOINS: today one separator is chosen by format for every part alike, and the ruling splits that into a fact join that differs by format and a part join that no longer does. A refactor that moved one byte reddens in the member resolve suite before any criterion below is attempted.",
          implementation:
            "`documentationFor` in packages/tsudoi-completion-path/src/completion.ts takes the stat as a LIST of fact lines rather than one pre-joined string, and the rendering of that list becomes its own format-taking step beside `listingText` -- returning today's bytes, since one fact joined any way is that fact. `statLine` hands it a single-element list and keeps its bytes. WHY ITS OWN COMMIT: the behavioural change is then about WHAT THE FACTS SAY and WHICH JOIN EACH FORMAT GETS, and not additionally about the shape of the parameter carrying them -- the one thing that would make the next subtask unreadable, on the product owner's sprint-82 ruling about the fixture.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "BYTE-IDENTICAL IN ALL FOUR CELLS AND NOT ONE EXPECTED STRING TOUCHED, WHICH IS THE WHOLE OF THE EVIDENCE THAT IT WAS STRUCTURAL. MEASURED, full Definition of Done at 8857536 with the parameter reshaped: PASSED, all five checks exit 0, 958 pass / 0 fail over 70 files, 2992 expect() calls, 158.59s, eleven registry arms HELD, ONE non-gating `eslint(require-yield)` warning -- counts byte-identical to the reading taken before the reshape. The whole-value block arms in the member's resolve suite and the prefix arm are the check the subtask named, and they are among the greens.",
            "THE RENDERING STEP TAKES NO FORMAT YET, AND THAT IS A CORRECTION TO THE PLAN RATHER THAN A HALF-DONE STEP. The subtask asked for a FORMAT-TAKING step returning today's bytes; with ONE fact those two requirements are contradictory -- every join of a one-element list is that element, so a format parameter here today would be a branch whose two arms produce the same string, which is a claim that this step reads the format made where nothing can falsify it. The parameter SHAPE moved, which is what the subtask exists to keep out of the next commit; the format arrives there, where a second fact makes it a claim.",
            "THE THREE REORDER RECORDS FAILED LOUDLY AND WERE RE-TAKEN, WHICH IS THE PROPERTY SUBTASK 2 RECORDED AND THIS IS THE FIRST READING OF IT. MEASURED at 8857536 with the composer reshaped and the records untouched: 955 pass / 3 fail, all three being `the recorded weakening still reddens: what completion sent is a strict prefix of what resolve answers, for both kinds` at its three cells, each throwing from `applyWeakening` because the file holds 0 occurrences of its `from`. Not a colour and not a silent green -- the arity guard is what makes a record following the composer a repair rather than a discovery.",
            "AND THE STAT-SIZE RECORD'S `from` MOVED WITH `statLine`'s RETURN TYPE: `? \\`directory · ${modified}\\`` became `? [\\`directory · ${modified}\\`]`. Its `redAt` did not -- the assertion it names is untouched -- which is the field behaving as intended: a record's site survives a change to the source it weakens.",
          ],
        },
        {
          test: "THE REDS, EACH NAMED WITH THE CELL IT FALLS IN, BECAUSE THIS FILE COMPARES BLOCKS WHOLE AND NEARLY ANY EDIT REDDENS NEARLY EVERYTHING. THE FOUR WHOLE-VALUE ARMS -- {file, directory} x {markdown, plaintext} -- rewritten to labelled facts: `source:`, then `size: <n> bytes` FOR A FILE ONLY, then `lastModified:`, bare lines joined by one newline in PLAINTEXT and BULLETED in MARKDOWN, with the dot-separated sentence and the thematic rule gone from both. THE FILE HALF OF `the markup a block is built in follows the session, not the item` IS A DIFFERENCE AND NOT AN IDENTITY, and that is the correction this subtask exists to carry: the facts are the only part a file has, so the fact join is the whole of what discriminates its two formats, and a red at the directory half alone meets nothing -- that half is discriminated by bullets it already had. A NEW ARM CARRIES THE TRUNCATION AND ASSERTS ITS OWN PREMISE FIRST: a file stamped at a FRACTIONAL mtime, the stamp read back before anything is asserted -- a filesystem that truncates sub-second precision itself must make the arm SAY SO rather than pass -- and the rendered `lastModified` must carry no fractional part. It is red against today's composer and stays red against a truncation placed in a fixture, which is the point: every stamp constant here is a whole second by design, so truncating them is a no-op and no existing arm can grade this. THE HEADING arms: `a directory at or under the bound shows every entry, and an empty one says so` re-sited onto the untruncated and empty spellings and still staging its edge from the count it just read, the over-bound arms onto the truncated spelling, the FILE pair kept in the same arm since a heading is a statement about a directory only while something carries none. BOTH `listingSection` HELPERS LOCATE THE HEADING IN BOTH FORMAT SPELLINGS, anchored and first-match, AND EVERY ARM READING NAMES ASSERTS THE SECTION WAS FOUND -- without that assertion a markdown-only pattern returns an empty header and no names, green and silent, for every plaintext arm in both suites. The imitating-entry anchor is re-taken in its new form: a directory holding an entry named like the heading, where an unanchored or last-match lookup answers with the names. The prefix arm and its root twin re-run over both kinds, both formats and all four source names, staying as widely swept as sprint 82 left them. THE SWEEP THIS SUBTASK OWES, under sprint 82's skill arm, is taken HERE and over these names: `modified `, the middle dot, `entries`, `entry`, `first `, the thematic rule, `statLine`, `listingSection`, `bytes`, across test/, packages/tsudoi-completion-path/test/ and both READMEs -- every hit re-sited, deleted, or left green with the reason it still reads something written beside it.",
          implementation:
            "`statLine` in packages/tsudoi-completion-path/src/completion.ts becomes the labelled facts and loses the words `file` and `directory`; `lastModified` is truncated to the second HERE and in no fixture, since the ISO rendering always emits milliseconds and a fixture-side truncation leaves every real popup carrying them. The fact-rendering step from the subtask above bullets in markdown and joins bare in plaintext -- CHOSEN OVER A TRAILING-DOUBLE-SPACE HARD BREAK, which is invisible in the source and in a diff so that one stripped space silently restores the run-on line this ruling exists to prevent, in a repository that formats the whole tree, and over bold labels, which do not break a line at all. `documentationFor`'s part join loses the rule in both formats and becomes the blank line the stakeholder's block shows. `listingText`'s sentence becomes the heading in its three spellings, level-one in markdown and the same words bare in plaintext, because a label is content and not syntax. Both copies of `listingSection` -- packages/tsudoi-completion-path/test/resolve.test.ts and test/resolve-path-stat.test.ts, under the docblock saying they MUST NOT DISAGREE -- move in this same commit as each other; the witness stays in the member half, since the root half resolves only items a real server produced and its sessions declare no capabilities at all. The whole-value expectations in the member resolve suite, test/resolve-path-stat.test.ts's block constants, test/workspace.test.ts and test/installed-handler.test.ts move with them, and the root arm titled `a directory item comes back saying it is a directory, and carrying no size` is RENAMED, its title being what this ruling falsifies. THE TWO NARROWED RECORDS ARE RE-TAKEN HERE, their `from` following the composer -- and any record naming an arm renamed above is re-measured rather than assumed, a rename leaving a record DISARMED.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "217a106",
              message: "feat(completion-path): the block becomes labelled facts and a headed list",
              phase: "green",
            },
            {
              hash: "3fd2ee7",
              message:
                "fix(completion-path): a modification time renders no fractional part at all",
              phase: "green",
            },
          ],
          notes: [
            "THE FLOOR WAS SHIPPED FIRST AND WAS SENT BACK, AND BOTH HALVES ARE KEPT BECAUSE THE MEASUREMENT IS WORTH MORE THAN THE OUTCOME. WHAT WAS FOUND, AND IT STANDS: criterion 3's PROSE (`renders no fractional part`) and its VERIFICATION (`AND NO OTHER`) cannot both be met, because they are about DIFFERENT EDITS -- MEASURED, `2001-02-03T04:05:06.000Z` FLOORED to the second renders byte-identically, where CUTTING the fraction renders `...06Z` and moves every expected block in both suites. Nobody had noticed the two readings were different, and the sprint decision that truncating a whole second is a no-op is written in the value reading. WHAT WAS DECIDED WRONGLY: the floor was shipped, because it made the `AND NO OTHER` perturbation cheap. THE STAKEHOLDER HAD BEEN SHOWN BOTH RENDERINGS AND DECLINED THE ONE THAT KEEPS THE MILLISECONDS, so `...06.000Z` is the declined option wearing a constant, and repairing the PRODUCT to fit the INSTRUMENT is backwards. WHAT SHIPPED IN THE END: the cut. Criterion 3's `AND NO OTHER` clause and the sprint decision are amended above rather than left contradicting the increment.",
            "THE FRACTIONAL ARM ASSERTS ITS OWN PREMISE OFF THE DISK BEFORE IT ASSERTS ANYTHING ELSE, and it must SAY SO rather than pass: `a directory holding an entry named like its own heading` aside, the new arm `a file stamped with milliseconds renders the second it fell in, not the milliseconds` stages 2001-02-03T04:05:06.789 through `utimesSync` AFTER `tree` has stamped everything whole-second, reads the mtime BACK, and requires `the disk kept a sub-second part: true`. On a filesystem that truncates sub-second precision itself that line reddens naming the premise instead of measuring the composer. Both directions then: the second IS rendered, and what the disk kept is NOT.",
            "THE FORGED-SOURCE ANCHOR LOST ITS SEPARATING INPUT AND THE ARM WAS RE-POINTED RATHER THAN DELETED, WHICH IS THE RECORD OF WHY. Sprint 82's anchor rested on the composer pushing `source` as its own PART, so an unrecognised name made the block one part shorter and everything after it moved. `source` is a FACT now and shares a part with the rest, so a forged one leaves the part COUNT unchanged and separates nothing. What replaces it is the collision an index never had: a directory holding EXACTLY ONE entry named `Entries (1)`, byte-identical to its own heading, where an unanchored or last-match lookup answers with the names. Exactly one, because the names are ONE part and the pattern is anchored at both ends -- with a sibling beside it no names part could ever match.",
            "THE FILE HALF OF THE FORMAT ARM IS ASSERTED FIRST, AND THE ORDER IS THE CLAIM. A runner stops at the first failing assertion, so with the directory pair in front the file half is unreachable in exactly the run criterion 4 asks to report -- and a red at the directory half alone meets nothing, that half being discriminated by bullets it already had.",
            "SUBTASK 5's WORK LANDED IN THIS COMMIT AND COULD NOT LAND ANYWHERE ELSE: those two arms compare blocks WHOLE, so leaving them for a later commit would ship a RED across a commit boundary, which this project forbids outright. Its own entry below records what was done and points at this hash.",
            "GREEN AFTER, FULL DEFINITION OF DONE at b5799bf with the whole reshape landed: PASSED, all five checks exit 0, 959 pass / 0 fail over 70 files, 3002 expect() calls, 159.15s, ELEVEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning. The delta over subtask 3's 958/2992 is the one new fractional-mtime arm and its four assertions, plus six assertions the existing arms gained -- the two kind arms' present/absent pairs, the format arm's `inMarkdown !== inPlainText`, the empty-listing read on a FILE, the imitator premise, and the root arm's file pair.",
            "THE FOUR REORDER-AND-SIZE RECORDS WERE RE-TAKEN AGAINST THE LANDED TEXT AND READ HELD, NOT ASSUMED: the stat-size record's `from` is now the whole `return stats.isDirectory() ? [lastModified] : [` line and its `redAt` moved with the arm's renamed constant, and the three prefix records' `from` is the single `const facts = [...]` line the two conditional pushes collapsed into. MEASURED, `bun test test/perturbations.test.ts`: 31 pass / 0 fail, eleven HELD.",
            "THE SWEEP, TAKEN LAST AND DISPOSITIONED IN FULL over `modified `, the middle dot, `entries`, `entry`, `first `, the thematic rule, `statLine`, `listingSection` and `bytes` across test/, packages/tsudoi-completion-path/test/ and both READMEs. THE MIDDLE DOT AND `modified ` RETURN NOTHING AT ALL -- the old stat spelling is gone from the tree. `statLine` survives at test/published-artifacts.test.ts, which names it as an EXPORTED symbol and still reads something true. Both `listingSection` hits are the two helpers and their callers, moved together. The two remaining thematic rules were the format arm's forged INPUT blocks and were re-spelled to what the composer now produces, so nothing in this tree renders a rule the composer cannot. Every `first ` hit is the new boundary spelling or unrelated. The README prose hits are subtask 7's and are left standing THERE rather than half-edited here.",
          ],
        },
        {
          test: "TWO ARMS AND TWO PLACES, WHICH IS THE WHOLE REASON THEY STAY TWO: `a file whose item claims to be a folder is still answered as a file` reddens AT ITS `size:` PRESENT ASSERTION, and `a directory whose item claims to be a file still comes back with its listing` reddens AT ITS HEADING. EACH CARRIES ITS PRESENT-CASE PAIR, and that is the half a reader will be tempted to drop: an arm resting on `no size: line` alone is satisfied by a handler that emitted nothing at all. THE PERTURBATION SAYS SO RATHER THAN THE COMMENT: a composer emitting NEITHER a size line NOR a heading must redden the file arm at its present assertion, and an absence-only arm stays green under it -- so that reading is what certifies the pair, with `redAt` refusing a red that landed on a collateral whole-value arm instead.",
          implementation:
            "The two arms under `what the path is decides the answer, and never what the item claims` in packages/tsudoi-completion-path/test/resolve.test.ts. Their recorded reason for being two arms -- the two defects landing in different FIELDS -- was already rewritten once in sprint 82 and is rewritten again here to the reason that now holds: the file direction shows at `size:`, the directory direction at the heading, and a stat-driven answer is separable from a `kind`-driven one by nothing else once the words `file` and `directory` have left the block. THE OBJECTION IS RECORDED AND NOT RE-RAISED: the ruling is the stakeholder's and this subtask is the consequence being paid.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "217a106",
              message: "feat(completion-path): the block becomes labelled facts and a headed list",
              phase: "green",
            },
          ],
          notes: [
            "IT LANDED IN SUBTASK 4'S COMMIT AND COULD NOT LAND IN ITS OWN, WHICH IS FORCED RATHER THAN CONVENIENT: both arms compare a block WHOLE, so the reshape reddens them the moment it lands and a separate commit here would put a RED across a commit boundary. Same reason subtask 4 gives for taking the block and its arms together.",
            "THE TWO ARMS' RECORDED REASON IS REWRITTEN AGAIN, TO THE ONE THAT NOW HOLDS. It said the two defects land in DIFFERENT FIELDS (sprint 82 rewrote that to `both land in the block`); with the words `file` and `directory` gone, what separates a stat-driven answer from a `kind`-driven one is exactly two things in two places -- the FILE direction shows at `size:`, the DIRECTORY direction at the entries heading. EACH CARRIES ITS PRESENT CASE IN THE SAME ARM: the file arm compares its block WHOLE and then reads `size: ` present, the directory arm compares its block WHOLE and then reads `size: ` ABSENT.",
            'THE PERTURBATION SAYS SO RATHER THAN THE COMMENT, AND IT WAS TAKEN BY HAND because it is TWO textual replacements and no record can express it. MEASURED at 217a106 with `statLine` returning `[lastModified]` for every kind AND the listing part never pushed: `bun test packages/tsudoi-completion-path/test/resolve.test.ts -t "what the path is decides the answer"` reports 0 pass / 2 fail. The FILE arm fails at `expect(blockOf(answered)).toBe(fileFacts);` -- its PRESENT assertion, the received value being `source: cwd / lastModified: ...` with the size line gone. THE HALF THAT CERTIFIES THE PAIR is in those received values: the directory\'s answer under the same weakening carries NO `size:` line and NO heading, so an arm resting on `not.toContain("size: ")` ALONE is satisfied by it and stays green. Reverted; the composer is byte-identical to the committed text.',
            "THE OBJECTION IS RECORDED AND NOT RE-RAISED: that these two arms read the word `file`/`directory` was put to the stakeholder and OVERRULED. This subtask is the consequence being paid, and the sentence saying so is at the site rather than only here.",
          ],
        },
        {
          test: "EVERY PERTURBATION THE CRITERIA NAME, TAKEN AGAINST THE LANDED TEXT WITH `redAt` SO EACH RED IS ATTRIBUTABLE, AND EACH CARRYING WHAT MUST STAY GREEN -- in a file comparing blocks whole, a criterion that asks only for a red asks for nothing. A SIZE LINE EMITTED FOR A DIRECTORY must redden `a directory's stat line carries no byte count, where a file's carries one` AT ITS DIRECTORY VALUE and must also redden its renamed root twin; THE SIZE LINE WITHHELD FROM A FILE must redden that same arm AT ITS FILE VALUE -- a red at only one of the two meets neither half. THE TRUNCATION REMOVED must redden THE FRACTIONAL-MTIME ARM AND NO OTHER, the whole-second fixtures staying green being the evidence that the arm and not the fixture grades the composer. THE MARKDOWN FACT JOIN REPLACED BY THE PLAINTEXT ONE must redden the format arm's FILE half; a reading whose only red is the directory half is a reading of bullets that half already had. THE BOUNDARY SPELLING COLLAPSED TO ONE FORM must redden `a directory at or under the bound shows every entry, and an empty one says so` AT ITS EDGE AND ITS EMPTY ASSERTIONS and must leave `a directory far past the bound renders twenty names and no more` GREEN -- one that reddens the truncated case too is grading the parenthetical rather than the boundary. EACH `listingSection` PATTERN NARROWED TO THE MARKDOWN SPELLING must redden that suite's PLAINTEXT listing arms BY NAME -- the member's bound arms, and the root's bounded-prefix arm, whose sessions declare no capabilities and so are plaintext throughout; a narrowing either helper survives green is that criterion unmet and is the sprint-82 anchor one level over. AND THE REGISTRY'S REORDER WEAKENING IS RE-MEASURED RATHER THAN ASSUMED HELD, together with the two narrowed records, since re-siting or renaming any arm they name leaves the record DISARMED -- the direction sprint 82 measured a rename producing.",
          implementation:
            "Records in test/perturbations.test.ts for every weakening expressible as one textual replacement in packages/tsudoi-completion-path/src/completion.ts, each declaring `redAt` and each naming its arm in packages/tsudoi-completion-path/test/resolve.test.ts, so no record spawns a server -- the wire claims are stated at the root on two runtimes and the member arm is the cheap statement of each. THE TWO HELPER NARROWINGS ARE NOT ORDINARY RECORDS AND THE REASON IS THE INSTRUMENT'S: the member's `listingSection` lives inside the arm file the record would run, and the root's arm file spawns both runtimes, which the registry deliberately holds no record for. Each is taken by hand, reverted, and its reading written into this subtask's notes at the shape this project records a measurement in -- base, exact edit, pass/fail with the arms named -- as is any other weakening one replacement cannot express.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "a2d682d",
              message:
                "test(perturbations): the five weakenings PBI-83 names, each sited at its red",
              phase: "green",
            },
          ],
          notes: [
            "FIVE NEW RECORDS, EACH DECLARING WHERE ITS RED MUST FALL, AND EVERY ONE MEASURED HELD AGAINST THE LANDED TEXT. MEASURED at 217a106, `bun test test/perturbations.test.ts`: 36 pass / 0 fail, SIXTEEN registry arms HELD. (1) THE SIZE LINE WITHHELD FROM A FILE, red at `expect(file).toBe(fileFacts);` -- the other half of the ruling and the half it makes cheap to lose, a directory being legible only by that absence now. (2) THE TRUNCATION REMOVED, red at the fractional-mtime arm -- ITS `alsoReddens` WAS EMPTY WHILE THE COMPOSER FLOORED THE VALUE AND IS ELEVEN ARMS LONG NOW THAT IT CUTS THE STRING, MEASURED, every one of them comparing a block whole. That list is the correction rather than a regression: what makes this record grade the ruling is `redAt` naming the fractional arm's own assertion, that arm being the only one here staging a sub-second stamp and so the only one whose red is about a FILE'S OWN milliseconds rather than about four constant bytes. (3) THE MARKDOWN FACT JOIN REPLACED BY THE PLAINTEXT ONE, red at `expect(fileAsMarkdown.documentation).toEqual({` -- the FILE half. (4) THE BOUNDARY SPELLING COLLAPSED TO THE TRUNCATED FORM, red at the EDGE assertion. (5) THE EMPTY DIRECTORY'S HEADING SUPPRESSED, red at the EMPTY assertion.",
            "THE EMPTY HALF NEEDED A WEAKENING OF ITS OWN AND THAT IS A CORRECTION TO THE CRITERION'S WORDING. Criterion 5 asks one perturbation to redden the arm AT ITS EDGE AND ITS EMPTY ASSERTIONS; a runner stops at the FIRST failing assertion, so under the collapse the edge fails and the empty assertion is never reached. Two records over one arm, at two sites, is what actually grades both -- and the second weakening is one criterion 5 itself lists (`by no heading for the empty directory`).",
            "AND `a directory far past the bound renders twenty names and no more` IS NOT IN THE COLLAPSE RECORD'S `alsoReddens`, MEASURED. Its absence is the half criterion 5 turns on: a weakening reddening the truncated case as well would be grading the parenthetical rather than the boundary.",
            "THREE RECORDS WERE READ DISARMED BEFORE THEY WERE READ HELD, and the collateral lists below them are those readings rather than predictions -- the instrument named every arm, and each list was written from what it said. That is the shape this project asks for and the reason `alsoReddens` is not filtered: nearly every arm in that file compares a block WHOLE.",
            "THE TWO `listingSection` NARROWINGS WERE TAKEN BY HAND, AND THE REASON IS THE INSTRUMENT'S: the member's helper lives INSIDE the arm file a record would run, and the root's arm file spawns both runtimes, which the registry deliberately holds no record for. MEASURED at 217a106, the member's pattern narrowed to `/^# Entries .../`: `bun test packages/tsudoi-completion-path/test/resolve.test.ts` reports 14 pass / 5 fail, by name -- `a directory holding an entry named like its own heading still reads back as both`, `a directory far past the bound renders twenty names and no more`, `two directories past the bound render the same number of names, each stating its own total`, `a directory whose dotfiles outnumber the bound still renders its ordinary entries`, and `a directory at or under the bound shows every entry, and an empty one says so`. The same narrowing in test/resolve-path-stat.test.ts, whose sessions declare no capabilities and are plaintext throughout: 14 pass / 2 fail, `a directory holding far more entries than fit renders a bounded prefix and states its total` on BOTH runtimes. Neither survived green, which is what criterion 6 asks. Both reverted.",
            "AND THE ROOT TWIN OF THE SIZE RULING WAS RE-MEASURED RATHER THAN ASSUMED, also by hand because it spawns servers. MEASURED at 217a106 with a size line emitted for a directory: `bun test test/resolve-path-stat.test.ts` reports 6 pass / 10 fail, and the RENAMED arm `a directory item's facts carry no size, where a file's carry one` is among them on BOTH runtimes -- which is what says the rename left it armed rather than DISARMED, the direction sprint 82 measured a rename producing.",
            "AND THE ROOT TWIN WAS TAKEN OVER THE SECOND PERTURBATION TOO, so criterion 1's `a red at only one of the two does not meet this` is satisfied at the root as well as in the member. MEASURED at b88dd10 with the size line WITHHELD FROM A FILE: `bun test test/resolve-path-stat.test.ts` reports 8 pass / 8 fail, and `a directory item's facts carry no size, where a file's carry one` is among them on BOTH runtimes -- which is what the file pair added to that arm bought, and without which the withheld direction would have been graded in the member alone. Reverted.",
            "GREEN AFTER, FULL DEFINITION OF DONE at 217a106: PASSED, all five checks exit 0, 964 pass / 0 fail over 70 files, 3007 expect() calls, 156.90s, SIXTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning. The delta over subtask 4's 959/3002 is the five new registry arms and their one assertion each.",
          ],
        },
        {
          test: "NOTHING REDDENS AND THE ITEM SAYS WHY: the member README's prose about which field carries what is graded by nothing -- `readmeCoverage` accounts for FENCED BLOCKS and this claim sits in none -- so it is in scope as WORK and out of scope as a CRITERION. What stands in for a red is that no sentence is written here that the arms above do not already carry, and the sweep from the block subtask is re-read to confirm every hit it dispositioned as `left green` still names what makes it read something.",
          implementation:
            "The member README's `Which field carries what` paragraph and any block it pictures; the root README's sentence about what the resolution answers; `statLine`'s docblock, whose A DIRECTORY IS TOLD APART BY WHAT IT IS ruling survives while the bytes it cites do not, and which gains the stakeholder ruling that took the words out; `documentationFor`'s docblock on the two joins; both `listingSection` docblocks on the heading they now anchor to. LAST, because it describes what landed rather than what was intended.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "b88dd10",
              message: "docs(completion-path): the README stops saying the block names the kind",
              phase: "refactoring",
            },
          ],
          notes: [
            "NOTHING REDDENED, AS THE SUBTASK REQUIRED, AND THE COUNTS SAY SO RATHER THAN THE COLOUR. MEASURED, full Definition of Done at a2d682d with the prose landed: PASSED, all five checks exit 0, 964 pass / 0 fail over 70 files, 3007 expect() calls, sixteen registry arms HELD, ONE non-gating `eslint(require-yield)` warning -- byte-identical counts to the reading taken before it. `readmeCoverage` accounts for FENCED BLOCKS and the member README's four are a config and three commands, none of which pictures a popup, so no marker and no `consumers` row moved.",
            "WHAT WAS FALSE AND IS REPAIRED, EACH BECAUSE THE RULING FALSIFIED IT. The member README said a directory's stat line SAYS IT IS A DIRECTORY -- the words are gone, so the missing `size:` is what says it now, and the sentence says that instead. It said the block says HOW MANY ENTRIES THERE REALLY ARE WHEN IT SHOWS YOU FEWER, which was silent about the case where it shows you all of them; the heading's three spellings are written out, `(0)` included, with the reason it is not decoration. And the modification time being reported TO THE SECOND is stated, because nothing else a reader can see says so.",
            "AND THE `Which field carries what` PARAGRAPH GAINED ONE CLAUSE AND NOT A REWRITE: it is about which FIELD is read at which moment, and that is untouched -- what moved is that every fact in the block is now LABELLED, which is the whole of what a user gets out of this sprint and belongs in the paragraph a user reads to find out what the block holds.",
            "WHAT WAS LEFT STANDING, WITH THE REASON, RATHER THAN SWEPT: the root README's sentence about the two methods describes WHAT IS READ -- a size, a modification time, the names inside -- and never how any of it is spelled, so the ruling does not reach it. test/published-artifacts.test.ts's docblock naming `statLine` names an EXPORTED symbol that still exists and is still exported, and its sentence about `how many entries there really are` is still true of the heading.",
            "NO SENTENCE HERE IS A CLAIM THE ARMS DO NOT ALREADY CARRY, which is what stands in for a red: the heading's three spellings are the boundary arm's, the missing `size:` is the two kind arms', the labels are the whole-value arms', and `to the second` is the fractional-mtime arm's. THE PROSE IS GRADED BY NOTHING AND THAT IS DISCLOSED RATHER THAN IMPLIED -- `readmeCoverage` accounts for fenced blocks and this claim sits in none, which is why it was in scope as WORK and out of scope as a CRITERION.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE BASE, MEASURED BEFORE ANYTHING MOVED: HEAD 29fc609, Definition of Done PASSED, all five checks exit 0, 955 pass / 0 fail over 70 files, 2982 expect() calls, nine registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. Any red from here is this sprint's until measured otherwise against that.",
        "THE MECHANISM GOES FIRST AND THE ARGUMENT FOR IT IS STRONGER THAN `IT IS PURE`. Every criterion in this item states WHERE its red must land, and in the member resolve suite the block is compared whole almost everywhere -- the existing stat-size record already lists EIGHT collateral arms by name. Without `redAt` each of those criteria would be graded by an instrument that cannot tell the arm's red from the collateral. THE DEVELOPER'S CORRECTION TO THAT ORDERING WAS TAKEN: a mechanism declared nowhere ships unexercised, so it is declared on two existing records in its own commit -- HELD at the stat-size record where the red is at the subject, REFUSED at the workspace record where it demonstrably is not, which turns that record's own confession from prose into something the instrument grades.",
        "THE STAKEHOLDER'S BLOCK IS THE PLAINTEXT SPELLING, RULED BY THE PRODUCT OWNER AND REASONED FROM COMMONMARK RATHER THAN MEASURED. Three lines joined by a bare newline are ONE PARAGRAPH and render as one run-on line, so a markdown client shown that block would display the three facts on one line -- which fails the item's own benefit. Markdown therefore needs a break of its own. THE FIRST RULING WENT THE OTHER WAY and was reversed on this: it had accepted a FILE's two formats going byte-identical, which is the vacuity sprint 82 migrated an arm out of the completion half to escape, arriving one sprint later one level up. Nothing here renders markdown, so the reasoning is labelled as reasoning.",
        "THE MARKDOWN BREAK IS A BULLET LIST, THE DEVELOPER'S CHOICE UNDER A PROPERTY THE ITEM BINDS AND A SPELLING IT DOES NOT. REFUSED WITH REASONS: a trailing-double-space hard break is invisible in the source AND in a diff, so one space stripped by any tool silently restores the run-on line the ruling exists to prevent -- in a repository that formats the whole tree; a backslash break is the same invisibility inverted, reading as punctuation; bold labels do not break a line at all, so the run-on survives wearing emphasis. AND BULLETS BUY SOMETHING BACK: the ONE-FACT completion block stops being byte-identical across formats, which sprint 82 recorded as a loss.",
        "TRUNCATING WHOLE SECONDS IS A NO-OP -- AMENDED, BECAUSE IT IS TRUE OF THE VALUE AND FALSE OF THE STRING, AND CONFLATING THE TWO IS WHAT SENT AN INCREMENT BACK. Flooring `2001-02-03T04:05:06.000Z` to the second renders those same bytes; CUTTING the fraction renders `...06Z` and moves every expected block in both suites. THE STAKEHOLDER CHOSE THE CUT, having been shown both and DECLINED the one that keeps the milliseconds, so `...06.000Z` is the declined option wearing a constant. What survives of the original reason is the half that still holds: both stamp constants here are whole seconds BY DESIGN -- filesystems disagree about sub-second precision -- so no fixture here can say anything about a FILE'S OWN milliseconds, and the new arm stages a FRACTIONAL mtime, asserts its own premise off the disk first, and requires NOTHING FRACTIONAL in the rendered value. A filesystem that truncates sub-second precision itself makes that arm SAY SO rather than pass.",
        "AND THE TWO IMPROVEMENTS ARE SUBTASKS RATHER THAN INTENTIONS, WHICH IS THE HEADER'S RULE ARRIVING AT THE FIRST BOUNDARY IT COULD. Eighty-one improvements accumulated across thirty-eight retrospectives with not one closed, because an active improvement was itself a permanent home. These two are instances one and two of the replacement rule: mechanised in the sprint after the one that proposed them, or deleted.",
      ],
    },
    {
      number: 82,
      pbi_id: "PBI-82",
      goal: "The free fact goes to the eagerly-rendered field and the expensive one to the lazy field: `detail` names WHICH FILE from the completion list itself, `documentation` is the only property a late answer touches, and the block only ever GAINS -- with the claims this change turns SILENTLY GREEN re-sited. THIS SAID `THE TWO` AND `BEFORE ANY RUN CAN BE READ AS PASSING`, AND THE INCREMENT REFUTED BOTH HALVES: there were THREE, the third named in PBI-82's own criterion 7 at refinement, and it was re-sited only at subtask 8 -- after four full Definition-of-Done greens had already been read. The goal described the intention; the record below describes what happened.",
      status: "done",
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
            "WHAT IS STILL NOT CLOSED IS WRITTEN AT THE SITE RATHER THAN LEFT TO BE DISCOVERED, and one half of it is wider than the arms that predate this sprint said: markdown syntax inside a name still renders as syntax, AND `label` and `insertText` still carry the name RAW. That second half is not a gap this sprint opened and cannot be closed -- `insertText` is what is written into the buffer, so flattening it would insert a file name that names no file, and `label` WAS, UNTIL SPRINT 84, what a client filters on. NARROWED IN PLACE AND NOT AMENDED BELOW, which was the first spelling and which a reviewer took: a correction several lines after the sentence it corrects is read second or not at all. What sprint 84 falsified is the label's REASON and not the refusal -- `filterText` carries the filtering now, and the label's rawness rests on a client dropping an item whose label it cannot find in the word it completes.",
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
        "THE CLOSING READING, TAKEN ON THE TREE THAT CLOSES RATHER THAN CARRIED FORWARD -- AND THE REASON IT IS SPELLED OUT IS THAT THE REVIEW MESSAGE DID CARRY ONE FORWARD. Definition of Done PASSED, all five checks exit 0: 955 pass / 0 fail over 70 files, 2982 expect() calls, 159.34s, NINE registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. Against base 65ecc06's 945 / 2884, the increment is ten arms and ninety-eight assertions. THE FIGURE PUT TO THE PRODUCT OWNER AT REVIEW WAS `2940+`, which was the reading BEFORE the second independent round's source-class widening and was hedged with a `+` precisely because it had not been taken -- the last full run before it had been read through a `tail` that cut the pass/fail lines off. The arm count was right and the assertion count was not. Recorded rather than quietly replaced, because a number carried between trees is this sprint's most-repaired defect and it recurred in the message announcing that.",
        "THE BASE IS MEASURED AND NOT ASSUMED, WHICH THIS DASHBOARD'S FILING BAR REQUIRES BEFORE ANY RED CAN BE CALLED PRE-EXISTING. At 65ecc06, with `tsc` and `oxfmt` shimmed onto PATH from real binaries: Definition of Done PASSED, all five checks exit 0, 945 pass / 0 fail over 70 files and 2884 expect() calls in 179.59s, six registry arms HELD. ONE WARNING, reported and not gating: `eslint(require-yield)` at test/fixtures/throws-on-cancel.ts. ANY RED THIS SPRINT IS THIS SPRINT'S UNTIL MEASURED OTHERWISE AGAINST THAT.",
        "THE THREE QUESTIONS THE DEVELOPER SAID BLOCKED WRITING THE RED TESTS WERE RULED AT REFINEMENT, TWO OF THEM BY THE STAKEHOLDER'S OWN INSTRUCTION. Order `source, stat, listing`; the path NOT also left in the block; `detail` flattened. Only the third was open, and it is taken as the conservative answer: the path leaves the composer that owns `flattened`, so the line-break injection the forgery arm exists to refuse reopens in a field nothing sanitises.",
        "SUBTASK 4 IS ACCEPTED UNSPLIT, AND THE PRODUCT OWNER PRICED THE ALTERNATIVE RATHER THAN WAIVING IT. A split costs either a temporary second spelling of the composer -- dead code shipped then removed, graded by nothing -- or a RED test/perturbations.test.ts across a commit boundary, which this project forbids outright. THE CONDITION IS THAT ITS `test` FIELD NAMES WHICH ARMS MUST BE RED BEFORE THE SOURCE EDIT, so one big green commit is readable afterwards.",
        "THE FLATTENING SPLIT IS RULED IN, AND WITH IT A DISCLOSED REGRESSION THAT NEEDED AN OWNER. Between subtask 4 and subtask 5 the shipped source writes an unflattened path into `detail`, and at base that path IS flattened in the block -- so this is a regression, not an absence. Folding it into subtask 4 recreates the exact entanglement subtask 1 exists to prevent, on the largest subtask in the sprint, and risks criterion 5 being met BY INHERITANCE rather than by a red anyone saw. Accepted because it is bounded and named, on an unpublished package nobody consumes per commit, under two conditions: subtask 4's commit body names the state it leaves and the subtask that closes it, and CRITERION 5 UNMET BLOCKS ACCEPTANCE -- a sprint cut short must not leave the last green commit carrying a disclosed regression with no owner.",
        "A SUBTASK THAT SHIPS NOTHING IS ACCEPTED, AND THE PRODUCT OWNER'S CONDITION ON IT RESOLVED A CONFLICT THE DEVELOPER HAD LEFT OPEN. Three closed sprints ended on a subtask whose commits are empty and whose deliverable is a recorded reading. But the header says A PERTURBATION RECORDED ONLY AS PROSE IS NOT RECORDED, and the developer had proposed exactly a note, giving the instrument's reason: the registry re-runs an ARM FILE and two of these arms spawn real servers on both runtimes. THE RESOLUTION IS NEITHER SIDE'S -- each record names an arm in a NON-SPAWNING file, and where none exists the subtask ADDS one in the member suite carrying the same claim, so the cheap arm is what the registry grades and the spawning arm stays as the wire-level statement.",
        "A THIRD PERTURBATION WAS ADDED BY THE PRODUCT OWNER'S CHECKLIST AND NOT BY THE PLAN. The prefix criterion is satisfied by ANY implementation whose two values are both correct today, so without a reorder perturbation -- the stat emitted before the source -- its green says nothing. The same checklist caught that the completion-half equality must be WHOLE-VALUE on both fields: a containment lets an implementation that also left the path in the block pass criterion 1 and make criterion 4 hold vacuously, which is two failures conspiring rather than two failures.",
        "FILED AND NOT REPAIRED, AND IT MEETS THE HEADER'S BAR RATHER THAN INVOKING IT. `statLine` is composed OUTSIDE the `try` that wraps the stat, and `stats.mtime.toISOString()` throws `RangeError: Invalid Date` on an out-of-range mtime -- which would answer -32603 and take away the popup the user is reading, the exact outcome this package states it refuses. IT IS PRE-EXISTING: at base 2ed9d43 the same expression stood in the same position, inside `detailFor`, called from the same return outside the same try; this sprint moved the symbol and not the exposure. AND IT IS NOT DEMONSTRATED REACHABLE: MEASURED on darwin/APFS, `utimes` at 8.64e12, 1e13, 1e15 and 6.7768e16 seconds all SATURATE at 2^63 nanoseconds and negative extremes clamp to now, so no local write produces one. The throw shape itself is confirmed against a `Stats`-shaped value carrying `new Date(NaN)`. Not repaired because a guard for an input nothing on a supported platform can produce is the unreachable-safety-net shape this project also refuses; recorded so the next reader has the measurement instead of the question.",
        "AND ONE THE SPECIFICATION OFFERS THAT THIS ITEM DID NOT CONSIDER, WHICH IS A BACKLOG QUESTION AND NOT A DEFECT. `CompletionItemLabelDetails.description` is the field the LSP's own doc comment nominates for a fully qualified name or a FILE PATH, while `detail` is nominated for type or symbol information -- so the arrangement this sprint landed is a spec-PREFERENCE deviation, and legal either way. IT IS NOT A DROP-IN: `labelDetails` is 3.17.0 and gated on `labelDetailsSupport`, which nothing here reads, so it is an addition with `detail` as fallback. AND IT DOES NOT ANSWER THE ITEM'S STANDING DISSENT -- `labelDetails.description` renders in the same inline label region, so moving the path there would not escape the truncation the product owner held the item over. That is what keeps this off the backlog for now rather than on it.",
        "THE `revise` ROUND'S YIELD, WITH THE DENOMINATOR THIS PROJECT REQUIRES. Ten independent reviewers over one increment, and EVERY actionable finding was in the increment rather than in a previous round's wake -- which is what a first round should look like and is the reading sprint 81's eight-round measurement makes worth taking. TWO were reported independently by two reviewers each: `NO STAT IS TAKEN HERE`, false at the very line it stood on, and the `detail` rationale naming a state the dedup forecloses. THREE arms had stopped reading anything. TWO perturbation-record reasons were false while the records themselves held. FIVE records in this file were refuted by this sprint's own commits, including a count that was the figure AFTER the probe it was reporting on and a decomposition with its constituents swapped. THE SOURCE'S BEHAVIOUR SURVIVED UNTOUCHED: not one finding required a code change, and the increment's two invariants were confirmed by reading rather than repaired.",
        "AND THE INDEPENDENT STAGE FOUND WHAT TEN PERSPECTIVES DID NOT, TWICE, IN THE SAME SHAPE. The prefix arm was pinned in PLAINTEXT alone -- and the registry's reorder weakening is format-agnostic, so a composer reordering FOR MARKDOWN ONLY passed the arm AND was reported HELD by the record written to catch exactly that. Repaired; then the same reviewer named the identical hole one axis over, every item having come from `cwd`, so a composer reordering only for `workspace` passed the repair. BOTH WERE MEASURED AS PAIRS rather than argued: 1 pass / 0 fail before each widening under the implementation that discriminates it, 0 pass / 1 fail after. THE GENERAL FORM IS AT THE SITE and is what this sprint actually learned: a relation asserted over ONE value of a discriminator the composer can read is a green about that value, and a format-agnostic perturbation cannot see the difference.",
        "THE ROUNDS WERE STOPPED ON THE MEASURED RATIO AND NOT ON A FEELING OF DONE, which is sprint 81's finding applied to its successor. Findings caused by the PREVIOUS ROUND'S OWN REPAIRS: 0 of about twenty in the multi-perspective stage, 0 of 2 in the first independent round, 2 of 3 in the second -- PBI-84's overstated MEASURED sentence and a README phrase, both written by the round before. THE SHARE GREW, WHICH WAS THE DECLARED STOP CONDITION, so the third round was not run. It is recorded as a ratio because a round count says nothing: eight rounds with a flat share would have been worth running and three with a rising one were not.",
        "WHAT IS RULED OUT, EACH POINTING AT THE NOTE THAT ALREADY REFUSED IT: reading the path off `item.detail` in the resolve half; leaving the path in `documentation` as well; a shortened or root-relative `detail`, deferred to a new item; the root README's prose. The member README's field statement is IN as work and OUT as a criterion, since nothing grades it.",
      ],
    },
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
    number: 84,
    pbi_id: "PBI-85",
    goal: "The popup names the ENTRY. `label` becomes the entry's own name, `filterText` takes over the filtering the label was doing for the clients that read it, and what is written into the buffer does not move a byte. The label stays RAW and keeps its refusal while LOSING its reason -- what replaces it is the client's containment check, asserted as an arm rather than argued in a docblock.",
    status: "review",
    subtasks: [
      {
        test: "A DESCRIBE OF TWO ARMS IN packages/tsudoi-completion-path/test/completion.test.ts, AND THE SECOND IS WHAT MAKES THE FIRST MEAN ANYTHING. The multi-segment arm drives a fragment carrying a directory part and compares the labels WHOLE against the entry names, then the pair `{ filterText, insertText }` and `textEdit.newText` whole -- three fields in one arm because a client reads whichever its own class names and a drift between them breaks one of them silently. The single-segment arm drives a fragment naming no directory and asserts the label and the inserted text are the SAME string, which is not a duplicate: it is the control that must stay GREEN under the perturbation that reddens the first, and without it `label: insertText` restored reddens an arm that was never about the directory part. AND THE INVARIANT AT `each item names the file it resolves to and the source that produced it` MIGRATES RATHER THAN BEING DELETED: `label.startsWith(insertText)` stands under a comment whose own precondition is `when the item carries no filterText`, which this subtask removes, so the assertion becomes `filterText === insertText` at the same site and the comment says which field the client now reads.",
        implementation:
          "`itemsFrom` in packages/tsudoi-completion-path/src/completion.ts writes `label: entry.name` and `filterText: insertText`, and `insertText`, `textEdit` and `detail` are untouched. THE COMMENT AT THE SITE CARRIES THE TWO REFUSALS AND NOT THE MECHANICS: not the whole inserted text in the label, which is the prefix every row of the popup was repeating; and not a narrower edit range, which would make the label the whole item and need no `filterText` at all -- refused because it moves what is written into the buffer and because the widening-fragment reading of a filename holding a space is built on the range beginning where the FRAGMENT begins.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "930ceb2",
            message: "feat(completion-path): the popup names the entry, the filter keeps the path",
            phase: "green",
          },
        ],
        notes: [
          "THE RED, MEASURED AND NOT PREDICTED. With both arms written and `src/` untouched, `bun test packages/tsudoi-completion-path/test/completion.test.ts`: 43 pass / 2 fail. The two are the multi-segment arm AT ITS LABEL ASSERTION (`Expected [deep.txt] / Received [notes/deep.txt]`) and the migrated invariant at `expect(item.filterText).toBe(item.insertText)`, receiving `undefined`. THE SINGLE-SEGMENT ARM WAS GREEN IN THAT SAME RUN, which is the reading that makes it a control rather than a duplicate -- it is green before the change and after it, and its job is the perturbation subtask 3 takes.",
          "GREEN AFTER, OVER THE WHOLE SUITE AND NOT THE ONE FILE: 966 pass / 0 fail over 70 files, 3014 expect() calls, 240.74s, sixteen registry arms HELD. Against the sprint base's 964 / 3008 the delta is the two new arms and their six assertions exactly -- the migrated invariant is a replacement and adds none, which is what says nothing else moved.",
        ],
      },
      {
        test: "THE ARM THAT FORECLOSES THE NEXT EDIT, over the fixture the forgery arm already builds -- a name holding a line break: the inserted text CONTAINS the label. It is green the moment it is written, which is why it is a subtask of its own rather than a line in the one above: what grades it is its perturbation, and a green arm shipped without one asserts nothing about the day someone flattens the label.",
        implementation:
          "Nothing in `src/`. The arm is the deliverable, and its reason is the client's: READ FROM ddc-source-lsp AND MEASURED NOWHERE HERE, an item whose inserted word does not contain its label is DROPPED rather than shown wrong, under an option that defaults off. The docblock over the forgery arm is where the reason goes, and it is the same docblock subtask 4 repairs -- so this arm is written and that sentence is left standing until then, deliberately, rather than half-edited twice.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "90bf97c",
            message: "test(completion-path): the label stays raw for a reason the client owns",
            phase: "green",
          },
        ],
        notes: [
          "THE ARM IS MULTI-SEGMENT AND THE PLAN DID NOT SAY SO, which is the one thing that would have made it worthless: for a fragment naming no directory the label and the inserted text are the SAME string, and `contains` over one string and itself grades nothing. The fixture is the forgery arm's name under a directory.",
          "THE RELATION IS ASSERTED BEFORE THE TWO WHOLE VALUES, on the ordering rule the forgery arm beside it already records: a runner stops at the first failing assertion, so with the values in front the relation could never BE the failure a reader is shown -- and the relation is what the client checks. MEASURED to matter, at subtask 3: under the flattening the red falls at the relation, and under the restored label it falls at the whole value.",
        ],
      },
      {
        test: "TWO RECORDS IN test/perturbations.test.ts, EACH WITH `redAt`, and each measured against the landed source rather than predicted. ONE: `label: insertText` restored, which must redden the multi-segment arm AT ITS LABEL ASSERTION -- a red at the `filterText` pair beside it would mean the record grades the field's presence and not the directory part -- and must leave the single-segment arm GREEN. TWO: the label flattened, which must redden the containment arm and leave the forgery arm on `detail` green, that pair being the whole of what tells the two fields apart. `alsoReddens` is MEASURED for both, never predicted.",
        implementation:
          "Records only. THE `from` OF EACH NAMES A LINE OF `itemsFrom` THAT THIS SPRINT JUST WROTE, which is the arity guard's whole value here: reshape the item construction again and the record throws with 0 occurrences rather than reporting a silent HELD.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "df03638",
            message: "test(perturbations): the two weakenings this sprint's arms are worth",
            phase: "green",
          },
        ],
        notes: [
          "BOTH MEASURED BY HAND FIRST, THE FILE RESTORED FROM A COPY AFTER EACH, and each red read at the assertion it fell on rather than at the arm. The restored label reddens the treatment arm at its LABEL assertion and the containment arm at a WHOLE VALUE, with the single-segment control green; the flattening reddens the containment arm alone, at its RELATION. So the two weakenings redden ONE SHARED ARM AT DIFFERENT ASSERTIONS -- and only the flattening's site is machine-checked, `redAt` reading the NAMED arm's failure while `alsoReddens` carries names with no site. THE FIRST SPELLING OF THIS SENTENCE SAID `THE SAME ARM`, which was false of the arms the records name.",
          "`alsoReddens` IS ASYMMETRIC AND THAT IS THE MEASUREMENT RATHER THAN AN OVERSIGHT. THE REASON FIRST GIVEN FOR THE FLATTENING'S EMPTY SET WAS FALSE AND A REVIEWER TOOK IT AT THE ARM ABOVE ITS OWN: it said no other fixture in that file holds a control character, and the forgery arm builds the SAME name -- the flattening moves that arm's label too, and it stays green because it reads `detail` alone. What is true is narrower: no other arm in that file reads a LABEL on a name the flattening rewrites.",
          "EVERY RECORD REPORTED HELD ON THE FIRST RUN OF THE REGISTRY AFTER LANDING, and the registry is nineteen arms where the sprint base had sixteen -- the third being the `filterText` record the review round found criterion 2 had asked for and this subtask had not shipped.",
        ],
      },
      {
        test: "THE SWEEP, under the skill arm sprint 82 left: `label`, `filterText` and `insertText` grepped across test/, packages/tsudoi-completion-path/test/, both READMEs and src/, every hit re-sited, deleted, or left green WITH the reason it still reads something. The known ones: the docblock over the forgery arm, whose `what a client filters on` half this sprint deletes; `test/installed-handler.test.ts`, which reads a label only for identity and stays as it is; and the helper whose last resort is `insertText ?? label` -- `applyAsClient`, NOT `inserted()`, which this plan named and which holds no label at all -- left as it is, since every item this package builds carries `insertText` and no arm reaches the fallback.",
        implementation:
          "The member README's `Which field carries what` paragraph gains the third field: the label names the entry, `filterText` carries what is typed so the item survives its own filter, and `detail` keeps the absolute path. LAST, because it describes what landed rather than what was intended, and because the docblock's replacement reason is the arm subtask 2 shipped rather than a claim.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "c2688e0",
            message: "docs(completion-path): the label's reason changed, and the prose says which",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE SWEEP WAS RUN TWICE AND THE FIRST RUN COULD NOT SEE THIS TREE. Case-sensitive, over `filters on|filter on|filtered on`, it returned EMPTY and would have carried `no sentence in the tree gives filtering as the LABEL's reason` -- while the comment written minutes earlier at the `filterText` site reads `WHAT A CLIENT FILTERS ON, WHICH THE LABEL STOPPED BEING`. This repository writes its reasons in capitals, so a case-sensitive sweep of its prose is blind by construction. Re-run with `-i` and widened to `filtering`, over packages/, test/, examples/, README.md AND scrum.ts.",
          "WHAT THE SECOND SWEEP FOUND, EACH DISPOSITIONED AND NO TALLY WRITTEN -- a count here was taken against a tree that has since moved, and a reviewer re-took it and got a different one. This sprint's own repaired prose, at the composer, the docblock, the registry records and the README: left. The word in another sense entirely, in test/published-artifacts.test.ts, test/helpers/snapshot.ts and test/helpers/lsp.ts: left. This file's own hits are QUOTATIONS of the sentence being deleted, except sprint 82's note, which was a standing assertion and was FALSE -- narrowed in place, since a correction several lines below the sentence it corrects is read second or not at all.",
          "AND TWO CLAUSES OF THIS SPRINT'S OWN PLANNING NAMED THE WRONG HELPER, corrected in the criterion and in the subtask above: the `insertText ?? label` fallback is `applyAsClient`'s, where `inserted()` reads `insertText ?? \"\"` and holds no label at all. Nothing was graded on it -- the fallback is unreachable, every item this package builds carrying `insertText` -- which is exactly why it could stand unnoticed in the field the product owner grades against.",
        ],
      },
      {
        test: "THE REVIEW ROUND'S REPAIRS, AND THEY ARE ALL IN THE INSTRUMENT AND THE PROSE: not one finding required a change to what the handler produces. THE THREE THAT MATTER, each measured before and after. A label cut at the FIRST separator rather than the last passed every label assertion in the tree, every fixture holding at most one separator -- the treatment fixture becomes `a/b/deep.txt` and that implementation reddens two arms. `insertText contains label` was satisfied by the EMPTY label, the one value the client discards outright -- the relation becomes an equality against the typed directory. And nothing read `filterText` on a name worth reading it on, both readers driving an ordinary name where flattening is a no-op, so `filterText: flattened(insertText)` was green everywhere -- the forged-name arm reads it now. Beside them: the per-source sweep gets its label reading back, the single-segment control reads the same four fields as its twin, and both new arms assert their premise.",
        implementation:
          "The third perturbation record, and the prose repairs. THE RECORD IS CRITERION 2'S, which subtask 3 did not ship: `filterText` narrowed to the entry name, red at the treatment arm with the control green. THE PROSE: the README sentence attaching `one is written into your buffer` to two fields that are not, found INDEPENDENTLY BY THREE REVIEWERS; the client claims hedged to what was read, including that the client matches against the word it reconstructs from the edit range rather than against the inserted text, so the arm's relation is a PROXY and narrower than the rule; the popup reading attributed at the source site; and this file's own false clauses -- the `SAME ARM` sentence, the flattening's `no other fixture holds a control character`, and a tally taken against a tree that had moved.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "41bd5ab",
            message: "test(completion-path): three ways the label arms were green about nothing",
            phase: "green",
          },
          {
            hash: "59babeb",
            message: "docs(completion-path): the reason was attached to the wrong pair of fields",
            phase: "refactoring",
          },
        ],
        notes: [
          "THE ROUND'S YIELD, WITH THE DENOMINATOR THIS PROJECT REQUIRES. Ten independent reviewers over one increment, and EVERY actionable finding was in the increment rather than in a previous round's wake, which is what a first round should look like. THREE reviewers reported the README sentence independently. NOT ONE FINDING REQUIRED A CHANGE TO THE SOURCE'S BEHAVIOUR -- the two-line increment survived untouched, and everything repaired was an arm that graded less than it claimed or a sentence that said more than was read.",
          "AND THE STRONGEST FINDING IS THE ONE THE SPRINT COULD NOT HAVE FOUND FOR ITSELF, because it is a property of the FIXTURES rather than of any assertion: every path in the member suite carried at most one separator, so the whole file was blind to the difference between the first separator and the last. The arms all said `the label is the entry's own name` and none of them could tell that from `the label is everything after the first slash`.",
          "ONE FINDING IS RECORDED AND NOT REPAIRED, AND IT IS THE AXIS ON WHICH THIS CHANGE CAN ONLY BE WORSE: a client that ignores `filterText`, filters on the LABEL, and derives the typed word from the edit range now drops every item of a multi-segment fragment, where before it matched. No such client was found -- the one whose source was read filters on the word it builds from `insertText` -- so this is a shape rather than a report, and it is written here because criterion 2 is true of the clients that READ `filterText` and silent about the others.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE BASE, MEASURED BEFORE ANYTHING MOVED: HEAD c355132, Definition of Done PASSED, all five checks exit 0, 964 pass / 0 fail over 70 files, 3008 expect() calls, 263.60s, SIXTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. Any red from here is this sprint's until measured otherwise against that.",
      "NO CHECK IN THIS REPOSITORY CAN SEE THE THING THE STAKEHOLDER REPORTED, AND THE PLAN SAYS SO RATHER THAN PRETENDING OTHERWISE. What they saw is a popup, and what an editor renders from an item is the editor's. Every criterion here is graded over the WIRE-LEVEL item, and the reading that connects the two -- the popup renders `label` -- is READ FROM ddc-source-lsp's source and is not a measurement. The stakeholder's own confirmation in their editor is the acceptance evidence for the popup itself, and it is asked for at review rather than assumed here.",
      "THE ORDER IS BEHAVIOUR, THEN THE ARM THAT FORECLOSES, THEN THE RECORDS, THEN THE PROSE. The prose repair is last because its replacement reason IS subtask 2's arm: written earlier it would be a claim about an arm that does not exist yet, which is the shape this project keeps catching.",
      "THE CLOSING READING, RE-TAKEN AFTER THE REVIEW ROUND ON THE TREE THAT CLOSES. Definition of Done PASSED at 59babeb, all five checks exit 0: 970 pass / 0 fail over 70 files, 3028 expect() calls, 135.07s, NINETEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. THE ARM DELTA IS DECOMPOSED AND THE ASSERTION DELTA IS NOT, which is a limit of the count rather than a gap in the reading: the one new arm is the third perturbation record, and the eight new assertions land partly inside a sweep that runs once per source and per item, so `expect() calls` is a RUNTIME count and no source-side decomposition of it would be checkable.",
      "THE READING BEFORE THE REVIEW ROUND, KEPT BECAUSE ITS DECOMPOSITION IS THE ONE THAT CHECKS. Definition of Done PASSED at c2688e0, all five checks exit 0: 969 pass / 0 fail over 70 files, 3020 expect() calls, 242.63s, EIGHTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AND THE DELTA IS READ AGAINST THE ARITHMETIC RATHER THAN AGAINST THE COLOUR, which is this project's own rule about a green: base 964 / 3008 / sixteen, plus two arms and six assertions from subtask 1, one arm and four from subtask 2, two arms and two from subtask 3. That is 969 / 3020 / eighteen exactly, and nothing else moved.",
      "AND THE POPUP WAS CONFIRMED BY THE STAKEHOLDER IN THEIR OWN EDITOR, which is the only evidence that exists for the thing they reported: they ran the rebuilt server and said it works. It is recorded as their reading and not as a measurement of this repository -- nothing here can take it, and the sentence below says why.",
      "WHAT NO CHECK HERE HAS SEEN: the popup itself. Every criterion above is graded over the wire-level item, and the sprint's own planning decision says the stakeholder's confirmation in their editor is the acceptance evidence for what they reported. It was asked for, and the decision above records the answer.",
    ],
  },
  retrospectives: [
    {
      sprint: 83,
      improvements: [
        {
          action:
            "AN ARM IN `.claude/skills/recording-a-measurement/SKILL.md`, under `Authoring a criterion`: when a criterion's PROPERTY and its VERIFICATION disagree they are about two different edits -- find which two, and repair the INSTRUMENT, never the product. IT WOULD HAVE CAUGHT THIS SPRINT'S ONE SEND-BACK, which is its whole warrant: the developer found the disagreement correctly and then shipped the cheaper-to-measure half, which was the rendering the stakeholder had been shown and DECLINED. THE DIRECTION IS THE RULE and it is what separates an honest amendment from a criterion met by argument -- amended so a failing increment passes is argument, amended AFTER the increment was rebuilt to the stricter reading is a repaired instrument, same edit and opposite orders. WHAT IT DOES NOT COVER: it fires only where the two halves visibly disagree, and says nothing about a criterion whose property and verification agree and are both wrong.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective, being a skill arm on non-production text. NOTHING ELSE IS PROPOSED AND THE REFUSALS ARE THE OTHER HALF: not a mechanism for `redAt` cannot tell a right assertion reddening for the wrong reason, which is a judgement no matcher makes; and not one for the residues the product owner named -- the two helper narrowings, the present-case pair and both root-twin readings are re-run by nothing, and each is re-run by nothing for the instrument's own reason, which is recorded at each site rather than made into an intention nobody closes.",
        },
      ],
    },
    {
      sprint: 82,
      improvements: [
        {
          action:
            "TWO NARROWED WEAKENINGS BESIDE THE UNIFORM ONE in test/perturbations.test.ts, both naming `what completion sent is a strict prefix of what resolve answers, for both kinds`: the source/stat reorder applied ONLY when the format is markdown, and ONLY when the source name is `workspace`. THE CLASS IS THE SPRINT'S LARGEST FINDING -- a relation asserted over ONE value of a discriminator the composer can read is a green about that value, and the UNIFORM record reported HELD both times because it was blind to the same axis the arm was. It would have caught both of the independent reviewer's findings at the round the arm was written rather than two rounds later, and it KEEPS the fix: narrow the sweep back to one format or one source in a year and the record reddens, where today the sweep is held by a docblock. WHAT IT DOES NOT COVER, so its green is not over-read: only the axes somebody enumerated -- `insertReplaceSupport`, an item's kind, listing-present-against-absent are equally readable by the composer and would have no record -- and nothing at all about arms carrying no record, the registry being a list rather than a class.",
          timing: "sprint",
          status: "completed",
          outcome:
            "CLOSED IN SPRINT 83 AT 8857536, both records HELD at DISTINCT CELLS, and the falsifier taken in BOTH directions: narrow the prefix arm's sweep back to plaintext and the markdown-gated record goes quiet, back to `cwd` and the workspace-gated one does. AND THE `from` COUPLING PAID OFF ON ITS FIRST REAL OCCASION -- when the composer was reshaped all three reorder records THREW from the weakener rather than passing silently. WHAT IT STILL DOES NOT COVER, carried into this outcome rather than dropped with the action: only the axes somebody enumerated -- `insertReplaceSupport`, an item's kind, listing present-against-absent have no record -- and nothing at all about arms carrying no record, the registry being a list rather than a class.",
        },
        {
          action:
            "`PerturbationRecord` GAINS AN OPTIONAL `redAt` in test/helpers/perturbation.ts: a fragment of the FAILURE TEXT -- never a line number, which this repository has measured going stale inside the sprint that wrote it -- and `read()` refuses a HELD whose red landed anywhere else. The reader already chunks bun's JUnit output per testcase and asks only whether a failure is present. IT WOULD HAVE CAUGHT THE WORKSPACE RECORD, whose own comment now confesses it: the arm asserts four source names before it reads any item, so the weakening reddens THERE and the discriminator criterion 6 is about is graded by nothing while the record says HELD. WHAT IT DOES NOT COVER: a red landing at the right assertion for the wrong reason, and it creates no weakening -- where the isolating state needs rewriting the write, `redAt` cannot conjure a record.",
          timing: "sprint",
          status: "completed",
          outcome:
            "CLOSED IN SPRINT 83 AT 6853136, exercised as the HELD/REFUSED PAIR the plan required rather than declared nowhere -- and the REFUSED direction is kept live by a probe arm that re-runs every suite run, not by a note. THE INSTRUMENT COULD NOT BE BUILT AS WRITTEN: MEASURED at bun 1.3.13 a failed testcase carries no message in the JUnit report, so the failure text is read off the console, and the fragment matches THE CARET-MARKED LINE and never the code frame -- the frame prints neighbours, and the first record it was declared on has four consecutive assertions, two about a directory and two about a file. A frame-matching reader would have certified the opposite. IT THEN DID THE JOB IT WAS BUILT FIRST FOR: criterion 3's whole discriminating power now rests on it, among eleven collateral reds. WHAT IT DOES NOT COVER: a red landing at the RIGHT assertion for the WRONG reason, and it creates no weakening where none is expressible.",
        },
        {
          action:
            "AN ARM IN `.claude/skills/writing-a-test/SKILL.md`: when a subtask moves what a FIELD carries, grep that field's name across every test tree and write each hit's disposition into the subtask -- re-sited, deleted, or left green WITH the reason it still reads something -- before the commit. A hit with no disposition is unfinished work rather than a finding to weigh. IT WOULD HAVE CAUGHT THE THIRD SILENTLY-GREEN CLAIM, named in PBI-82's own criterion 7 at refinement and re-sited only at subtask 8, after four Definition-of-Done greens had been read as passing: it is a grep hit at subtask 4 and needed dispositioning, not re-discovering. WHAT IT DOES NOT COVER: any assertion naming no field -- the whole-value `toEqual` shapes this sprint's real strength ended up in are invisible to it -- and it fires only on a field LOSING a meaning, never on one quietly gaining a second.",
          timing: "immediate",
          status: "completed",
          outcome:
            "Applied within the retrospective, which is what `immediate` is for. The developer's reason for proposing nothing about the refuted records or the carried assertion count is recorded with it and is the retrospective's other half: `.claude/skills/recording-a-measurement/SKILL.md` already owns the base-plus-command rule, and a sixth restatement of a rule that exists is the ACTIVE INTENTION this dashboard's header strikes by name.",
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
