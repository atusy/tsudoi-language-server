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
          "5 of 5. ENUMERATED IN THE METRIC ITSELF because `10 of 10` stood for thirty sprints with NOTHING ANYWHERE ENUMERATING THE TEN -- grepped, the only match was the metric. A fraction whose denominator nobody can name cannot be met, and the PO twice reported `2 of 10` as fact. The five were set by the stakeholder, not invented to make the metric satisfiable. AND TSUDOI NOW SERVES MORE THAN FIVE -- `workspace/executeCommand` since sprint 86, and `initialize` is a sixth key a config may declare though it is not a row of the request table. THE DENOMINATOR DOES NOT MOVE FOR THEM, deliberately: this metric asks whether what the STAKEHOLDER ASKED FOR responds, and a denominator that grew every time the product did would be a fraction nobody could fail. What the code serves is counted by the request table and by nothing here.",
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
        "THE MECHANISM, AND THE PART THAT MAKES IT MORE THAN A MISSING CHECK. `itemsFrom` never reads `context.signal`; cancellation closes the OUTER generator, and a generator's `return()` cannot take effect while an outstanding `next()` is still running. A batch is yielded only when it FILLS, so a fragment matching nothing in a huge directory reaches no yield point at all: the scan runs to EOF, holding the handle, after the client has already been answered -32800 through tsudoi's own race. The user sees a prompt cancellation and the process goes on working.",
        "WHY IT IS NOT A ONE-LINE FIX, WHICH IS WHY THIS IS A DRAFT RATHER THAN A TASK -- and it said `REFINED` in an item whose own criterion says it is not. Abandoning a half-read directory LEAKS ITS DESCRIPTOR ON ONE OF THE TWO RUNTIMES -- the resolve half already carries that finding at its own cancellation seam and declines to honour a late cancellation for it. So the release strategy is the item, not the signal read: a signal-aware drain that stops classifying and batching while still exhausting or explicitly closing the iterator.",
        "AND ONE CHEAP HALF THAT MAY BE WORTH SPLITTING OUT: `entryKind` stats every entry a listing reports as neither file nor directory, so a directory of symlinks costs one syscall per entry per keystroke. That is disclosed at the site and is a separate trade from cancellation, but the same scan is where it is paid.",
      ],
    },
  ],
  completed: [
    {
      number: 86,
      pbi_id: "PBI-88",
      goal: "`workspace/executeCommand` becomes a SIXTH ROW of the request table the other five are rows of, so a command reaches a handler the author wrote with the same lifecycle gate, the same cancellation and the same params refusal every other method already gets -- and none of it written a sixth time.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "ACCEPTED BY THE PRODUCT OWNER WITH TWO CONDITIONS ON THE RECORD AND NONE ON THE INCREMENT.",
        "CONDITION ONE, AND THE PRODUCT OWNER RULED IT RATHER THAN ASKED FOR IT: the success metric STAYS AT FIVE and the sentence at the site says why the five is not a denominator. The five are the ones the STAKEHOLDER NAMED; a sixth served method does not make the metric `5 of 6`, and adding one would be the Product Owner inventing a target nobody set. The annotation is required rather than optional because of this file's own history -- `10 of 10` stood for thirty sprints with nothing anywhere enumerating the ten, and the Product Owner twice reported `2 of 10` as fact.",
        "CONDITION TWO, AND IT IS A RULING AGAINST THE OBVIOUS ANSWER. A truncated capture destroyed a verdict for the SECOND consecutive sprint, and this instance was worse than the first in a specific way: the mechanism existed, the actor had written it, and it was in the very commit being closed -- a red `oxfmt --check` shipped as this sprint's baseline because the run was read through `tail` and the verdict prints ABOVE the summary. THAT IS EVIDENCE ABOUT DELIVERY AND NOT ABOUT ATTENTION, which is the distinction this file's header rests on when it argues a skill counts as a mechanism. SO IT IS NOT ANSWERED WITH A THIRD SKILL. The runner already reports whole; running a bare check by hand and piping it is the unsanctioned route, so the fix is runner-shaped -- make the sanctioned route cover the case that drove people off it.",
        "THE PRODUCT OWNER REFUSED A FINDING OF ITS OWN, WITH THE REASON, RATHER THAN FILING IT: the `unknown` ruling closed the RESULT and left `any` reaching authors through `ExecuteCommandParams.arguments`. Narrowing params would mean tsudoi declaring its own shape for a type upstream owns and publishing a second name for it -- which is what the `deps/` split exists to prevent. Pre-existing through `CompletionItem.data`, refused here, reason stated.",
        "WHAT REVIEW FOUND WAS NEVER BROKEN BEHAVIOUR, AND THAT IS THE READING TO CARRY. Three reviewers, thirteen findings, every one GREEN-PASSING: a params field that made the shared object invalid for a DIFFERENT row (`CompletionItem.command` is a Command OBJECT, so the intersection is uninhabitable and there was no make-it-compile fix); a FALSE why-not in the new row's own comment claiming an author's handler needs tsudoi's key to write into, which it does not; a README fact whose token was satisfied by prose asserting its own INVERSE; and a control faithful today with nothing keeping it faithful. The suite was green before review and green after.",
        "THE DEVELOPER CORRECTED TWO OF ITS OWN CLAIMS AND ONE OF A REVIEWER'S, WHICH IS WORTH MORE THAN THE RESIDUES COST. It wrote that an ill-formed `Command` reaches the fake editor, traced the arms, found it reaches no handler at all, and repaired the note. It claimed a probe answers from `dist/`, ran `--traceResolution`, found it falls through to `src/` ALWAYS because a probe stages no `dist/`, and repaired that. And a reviewer's premise -- that the five original rows prove `null` is the router's because their results declare no null arm -- is simply false: `hover` and `formatting` are `Promise<... | null>` and were already in that position.",
        "WHAT THE ACCEPTANCE DOES NOT CERTIFY. That any INDIVIDUAL COMMIT here is green -- four combined runs, then a split by file path, so a bisect across this sprint can land on a tree never claimed green. That `null` still tells the router from the handler for this row; it does not, and nothing replaces that control. That `any` is off the author's surface; it is off the RESULT. That the README's prose is compiled by anything. That the type probe reads what SHIPS. That a command reaches anything in a REAL EDITOR -- an author must set `commands` through the initialize handler and NO ARM DOES BOTH HALVES IN ONE SESSION, which is the seam between PBI-87 and PBI-88 and is unwitnessed.",
        "THAT LAST ONE IS A REFINEMENT CANDIDATE AND NOT A DEFECT, ruled by the Product Owner: an example config where the two increments are shown working together in a file a stranger reads.",
        "THE CLOSING READING, TAKEN BY THE SCRUM MASTER ON THE TREE THAT CLOSES: Definition of Done PASSED, all five checks exit 0, 1019 pass / 0 fail over 74 files. The base was 1005 / 72.",
      ],
    },
    {
      number: 85,
      pbi_id: "PBI-87",
      goal: "A config author decides what their server advertises: `config.methods.initialize` receives the InitializeResult tsudoi was about to send -- deep-frozen -- and whatever that handler returns is what the editor is told, including a capability tsudoi would have claimed and the author withdrew.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "ACCEPTED BY THE PRODUCT OWNER WITH THREE CONDITIONS ON THE RECORD AND NONE ON THE INCREMENT. All three are discharged below or at the code site named.",
        "THE STAKEHOLDER'S RULING WAS OVERTURNED IN FLIGHT AND THIS IS WHERE A VETO LANDS. The design brief ruled `no rollback, no fourth phase, no break of the three-states-in-order invariant`. There is now a fourth phase, `initializing`, and a backwards edge out of it. WHAT FORCED IT, MEASURED: with the handshake awaiting an author's handler, a second `initialize` arriving in that window read `uninitialized` and was ACCEPTED -- both handshakes served, `handshake()` run twice from concurrent flows, the author's handler run twice, nothing on stderr. A no-handler session never yields, which is why nothing before this sprint could show it. THE RULING'S PREMISE WAS INCOMPLETE RATHER THAN ITS CONCLUSION WRONG: it reasoned about the THROW path, and the defect was CONCURRENCY. If the stakeholder vetoes, the answer is not three phases again -- it is serialising the handshake another way, and that is a new item.",
        "THE ARM THAT NOW CATCHES A TRANSPOSED TRANSITION IS NAMED, because criterion 3's own discriminator died with the repair and a criterion met by argument is forbidden here. MEASURED, three perturbations against the landed source: deleting `beginInitialize()` reddens the concurrency arm on both runtimes with the served entry count reading 2; deleting `abandonInitialize()` reddens the retry line of the throwing-handler arm; replacing `beginInitialize()` with `initialize()` -- the transposition criterion 3 used to catch -- reddens the concurrency arm on the refusal's MESSAGE, on both runtimes, while the throwing-handler arm stays ENTIRELY GREEN. So the property is pinned, and it is pinned somewhere other than where the criterion says to look; the criterion was amended in place rather than corrected below.",
        "THE DEFECT WAS FORESEEABLE FROM A RESIDUE ALREADY WRITTEN DOWN, WHICH IS THE FINDING WORTH CARRYING. The brief's own accepted-residue paragraph was about a window opened by the very `await` that opened this one -- a second `initialize` arriving in it is one door away. Review caught it, which is the system working; that nobody reached it from the residue they had already written is not.",
        "WHAT THE ACCEPTANCE DOES NOT CERTIFY, IN THE PRODUCT OWNER'S WORDS. That an author's initialize handler ever RUNS -- a TOP-LEVEL `initialize` key is read by nothing and refused by nothing, documented and not caught, the placement ruling having moved that risk rather than removed it. Anything about an unserializable return. That the notification drop window is closed -- it is wider now by the handler's duration. That the capability trap is guarded -- nothing detects an author withdrawing `resolveProvider`, `textDocumentSync` or `workspace.workspaceFolders`. That `executeCommandProvider.commands` reaches anything, which is PBI-88. That `CLAUDE.md` is true; it still opens `handlers for five LSP methods` and is not committable here.",
        "AND IT DOES NOT CERTIFY SUITE DETERMINISM. One run reported `Tests pass -- exit 1` on content byte-identical to trees green immediately before and twice after, and the diagnostic was destroyed by piping through `tail`. NOT CALLED A FLAKE, because no test was named. It was one of the slow runs, as was a separate `test/completion.test.ts` red that cleared three ways and IS the known pre-existing stderr-flush race. THE CHEAP RULE THAT FALLS OUT: a Definition-of-Done run is captured WHOLE, never piped through anything that discards the head.",
        "THE CLOSING READING, TAKEN BY THE SCRUM MASTER ON THE TREE THAT CLOSES: Definition of Done PASSED, all five checks exit 0, 1005 pass / 0 fail over 72 files, one non-gating `require-yield` warning unchanged from base. The base was 970 / 70.",
      ],
    },
    {
      number: 84,
      pbi_id: "PBI-85",
      goal: "The popup names the ENTRY. `label` becomes the entry's own name, `filterText` takes over the filtering the label was doing for the clients that read it, and what is written into the buffer does not move a byte. The label stays RAW and keeps its refusal while LOSING its reason -- what replaces it is the client's containment check, asserted as an arm rather than argued in a docblock.",
      status: "done",
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
              message:
                "feat(completion-path): the popup names the entry, the filter keeps the path",
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
              message:
                "docs(completion-path): the label's reason changed, and the prose says which",
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
            "AND THE STRONGEST FINDING IS THE ONE THE SPRINT COULD NOT HAVE FOUND FOR ITSELF, because it is a property of the FIXTURES rather than of any assertion: every fixture that PRODUCES AN ITEM carried at most one separator, so every label assertion was blind to the difference between the first separator and the last. The arms all said `the label is the entry's own name` and none of them could tell that from `the label is everything after the first slash`. NOT `EVERY PATH IN THE SUITE`, WHICH WAS THE FIRST SPELLING AND WHICH THE SECOND REVIEW STAGE REFUTED: the win32 arms carry `C:\\Users\\fo` and a UNC path, and they drive the fragment reader rather than item construction.",
            "THE ROUND ALSO SURVEYED ELEVEN EDITOR CLIENTS, AND WHAT IT FOUND THERE IS DELIBERATELY NOT RECORDED. THE STAKEHOLDER RULED IT: a defect in a client is the client's, and this dashboard is not where another project's bugs are tracked. What survives from that survey is only what is true of THIS package's own prose -- the range-derived filtering rule is a client's convention and not the specification's, which is why criteria 2 and 4 are qualified above.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE BASE, MEASURED BEFORE ANYTHING MOVED: HEAD c355132, Definition of Done PASSED, all five checks exit 0, 964 pass / 0 fail over 70 files, 3008 expect() calls, 263.60s, SIXTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts. Any red from here is this sprint's until measured otherwise against that.",
        "NO CHECK IN THIS REPOSITORY CAN SEE THE THING THE STAKEHOLDER REPORTED, AND THE PLAN SAYS SO RATHER THAN PRETENDING OTHERWISE. What they saw is a popup, and what an editor renders from an item is the editor's. Every criterion here is graded over the WIRE-LEVEL item, and the reading that connects the two -- the popup renders `label` -- is READ FROM ddc-source-lsp's source and is not a measurement. The stakeholder's own confirmation in their editor is the acceptance evidence for the popup itself, and it is asked for at review rather than assumed here.",
        "THE ORDER IS BEHAVIOUR, THEN THE ARM THAT FORECLOSES, THEN THE RECORDS, THEN THE PROSE. The prose repair is last because its replacement reason IS subtask 2's arm: written earlier it would be a claim about an arm that does not exist yet, which is the shape this project keeps catching.",
        "THE CLOSING READING, RE-TAKEN AT THE END OF THE REVIEW STAGES ON THE TREE THAT CLOSES -- 28a2cc2, and the ONLY commit after it is the one carrying this sentence, which no check but test/definition-of-done.test.ts reads. Definition of Done PASSED, all five checks exit 0: 970 pass / 0 fail over 70 files, 3036 expect() calls, 322.53s, NINETEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AN EARLIER SPELLING OF THIS DECISION NAMED A COMMIT THAT THREE MORE HAD OVERTAKEN, WHICH THE FRESH REVIEW SESSION CAUGHT: a closing reading is only a closing reading while it names HEAD, or names what stands between and why nothing there can move it. THE ARM DELTA IS DECOMPOSED AND THE ASSERTION DELTA IS NOT, which is a limit of the count rather than a gap in the reading: the arms over the sprint base are the two of subtask 1, the one of subtask 2 and the three registry records, and the assertions land partly inside sweeps that run once per source and per item -- so `expect() calls` is a RUNTIME count and no source-side decomposition of it would be checkable.",
        "THE READING BEFORE THE REVIEW ROUND, KEPT BECAUSE ITS DECOMPOSITION IS THE ONE THAT CHECKS. Definition of Done PASSED at c2688e0, all five checks exit 0: 969 pass / 0 fail over 70 files, 3020 expect() calls, 242.63s, EIGHTEEN registry arms HELD, ONE non-gating `eslint(require-yield)` warning at test/fixtures/throws-on-cancel.ts -- the same warning as at base. AND THE DELTA IS READ AGAINST THE ARITHMETIC RATHER THAN AGAINST THE COLOUR, which is this project's own rule about a green: base 964 / 3008 / sixteen, plus two arms and six assertions from subtask 1, one arm and four from subtask 2, two arms and two from subtask 3. That is 969 / 3020 / eighteen exactly, and nothing else moved.",
        "AND THE POPUP WAS CONFIRMED BY THE STAKEHOLDER IN THEIR OWN EDITOR, which is the only evidence that exists for the thing they reported: they ran the rebuilt server and said it works. It is recorded as their reading and not as a measurement of this repository -- nothing here can take it, and the sentence below says why.",
        "THE REVIEW STAGES WERE STOPPED ON THE MEASURED SHARE AND NOT ON A COLOUR, which is this project's own recorded stop condition rather than a shortcut. Findings caused by the PREVIOUS ROUND'S OWN REPAIRS: none of the multi-perspective stage's, since it read the increment; then two of the independent thread's last two; then the fresh session's stale-count finding, which was about a decision the round before it had written. THE SHARE ROSE, so a fourth session would mostly grade the wording of the third's repairs. The skill's convergence condition -- a FRESH session answering `no comments` first -- is therefore NOT met, and that is recorded rather than smoothed: what stopped the stages is the ratio.",
        "ACCEPTED, ALL FIVE CRITERIA MET, WITH NO FIX SUBTASKS. Criterion 1 by the label arm over two directory segments, red under the restored label with the single-segment control green; criterion 2 by the `filterText` pair and its own record, the narrowing rather than the drop and the reason written at both; criterion 3 by the equality over the forged name, red under the flattening at the relation; criterion 4 by the three arms under the apply describe, green at every commit, and by the narrowing the criterion itself needed; criterion 5 by a case-insensitive sweep with every hit dispositioned. THE ONE THING NO CRITERION COULD REACH -- the popup -- is the stakeholder's own confirmation, recorded above as theirs.",
        "WHAT NO CHECK HERE HAS SEEN: the popup itself. Every criterion above is graded over the wire-level item, and the sprint's own planning decision says the stakeholder's confirmation in their editor is the acceptance evidence for what they reported. It was asked for, and the decision above records the answer.",
      ],
    },
    {
      number: 83,
      pbi_id: "PBI-83",
      goal: "The popup becomes labelled facts and a headed list, IN TWO SPELLINGS -- the stakeholder's quoted block being the PLAINTEXT one, since three lines joined by a bare newline are one CommonMark paragraph and would render as a run-on.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "COMPACTED AFTER SPRINT 85, AND WHAT LEFT IS NAMED SO THE GAP IS NOT MISREAD AS `NOTHING HAPPENED`: the subtask records and their MEASURED counts went, being readings of moments this file's own header says a note cannot be a home for. What they measured lives in the tree -- the two spellings in the composer, the arms in both resolve suites, the member README's repaired sentences. Only rulings are kept below.",
        "THE MARKDOWN BREAK IS A BULLET LIST, AND THE ALTERNATIVES ARE REFUSED WITH REASONS THAT STILL BIND. A trailing-double-space hard break is invisible in the source AND in a diff, so one space stripped by any tool silently restores the run-on the ruling exists to prevent -- in a repository that formats its whole tree. A backslash break is the same invisibility inverted. Bold labels do not break a line at all. AND BULLETS BUY BACK what sprint 82 recorded as a loss: the one-fact completion block stops being byte-identical across formats.",
        "TRUNCATING WHOLE SECONDS IS A NO-OP OF THE VALUE AND NOT OF THE STRING, and conflating the two is what sent an increment back. The stakeholder was shown both and DECLINED the one that keeps the milliseconds.",
      ],
    },
    {
      number: 82,
      pbi_id: "PBI-82",
      goal: "The free fact goes to the eagerly-rendered field and the expensive one to the lazy field: `detail` names WHICH FILE from the completion list itself, `documentation` is the only property a late answer touches, and the block only ever GAINS.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "COMPACTED AFTER SPRINT 85 on the same terms as sprint 83 above.",
        "THE GOAL SAID `THE TWO` AND `BEFORE ANY RUN CAN BE READ AS PASSING`, AND THE INCREMENT REFUTED BOTH HALVES -- there were THREE claims turning silently green, the third named in the item's own criterion at refinement, and it was re-sited only after four full Definition-of-Done greens had been read. KEPT BECAUSE IT IS THE FAILURE MODE AND NOT THE FEATURE: a sprint goal describes an intention, and reading one back as a record of what happened is the mistake this line exists to make expensive.",
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
  retrospectives: [
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
