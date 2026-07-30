// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 1000 lines (overrides the
// scrum-dashboard skill's default of 300). Raised from 500 by the
// stakeholder: this dashboard carries measured rulings and the reasons
// they were overturned, which is content git history cannot substitute
// for while the decision is still live.
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
      id: "PBI-46",
      story: {
        role: "config author",
        capability:
          "yield batches of completion items and never decide whether they travel as a partial result or as the response",
        benefit:
          "the shape I write says WHAT I found, and tsudoi decides HOW it reaches the client -- so no slot in my return value means one thing in one call and another thing in the next",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "A completion handler is `AsyncGenerator<CompletionItem[], void, void>` -- ONE SLOT WITH ONE MEANING. Every yield is content; the return carries nothing; nothing the author writes selects a delivery channel. THE TUPLE IS WITHDRAWN, and with it `CompletionResponse`, `EmptyCompletionResponse` and the `void` arm of the old result: a handler with nothing to say yields nothing. `void` RATHER THAN `null` FOR THE RETURN IS MEASURED, NOT STYLISTIC: with `null` a generator that falls off its own end is TS2355 at compile time and `{done: true}` with an UNDEFINED value at run time, so every handler would carry a ceremonial `return null;`.",
          verification:
            "The published surface loses exactly those names and gains none. NEGATIVE CONTROL, because a set comparison against a stale or empty list passes regardless: add a throwaway export to src/types.ts and confirm the comparison REPORTS it, then remove it. AND THE DIRECTION THAT MATTERS IS REMOVAL here, the opposite of PBI-44's, so a check that only looks for additions cannot discriminate this.",
        },
        {
          criterion:
            "THE CHANNEL IS DECIDED BY THE PARTIAL-RESULT TOKEN ALONE, and by nothing else. A token present means EVERY yield leaves as `$/progress` and the response is `null` -- ALWAYS, with no look-ahead and no special case for a stream that happens to produce one batch. A token absent means every yield is aggregated and the whole list is the response. THE SIMPLICITY IS THE POINT AND ITS COST IS ACCEPTED KNOWINGLY: a single-batch answer under a token costs one `$/progress` and a null response where one response would have done.",
          verification:
            "Four sessions: token present with one batch, token present with several, token absent with one, token absent with several -- each asserting BOTH the response AND the progress count, because a test reading only the response cannot tell the arms apart. THE PAIRED CONTROL per Sprint 6, since two arms assert an ABSENCE of progress: an arm observing progress PRESENT through the same measurement must pass beside them. NEGATIVE CONTROL FOR THE RULE ITSELF: make the drive decide on anything other than the token -- the simplest is to skip progress when only one batch was produced -- and confirm the token-present-one-batch arm reddens NAMING the progress count. Without that, `the token decides` is satisfied by any drive that happens to agree today.",
        },
        {
          criterion:
            "`isIncomplete` BECOMES UNEXPRESSIBLE AGAIN, AND THAT IS RECORDED AS A KNOWN GAP RATHER THAN ALLOWED TO GO SILENT. The specification treats a supplied `CompletionItem[]` as `{ isIncomplete: false, items }`, so every completion tsudoi answers claims completeness -- which Sprint 42 measured to be FALSE for path completion. The completeness rulings written at each config in Sprint 42 STAY, and the two ruled NOT COMPLETE say at their site that the claim is still wrong and why it cannot be fixed here.",
          verification:
            "The completeness-ruling scan from Sprint 42 must still pass, with its count guard and its negative control. NEGATIVE CONTROL for the gap itself: the two NOT COMPLETE configs must NOT be quietly re-ruled to COMPLETE to make the file consistent -- grep their rulings before and after and confirm the verdicts are unchanged. A sprint that removes the capability AND relabels the configs that needed it would leave nothing recording that anything was lost.",
        },
        {
          criterion:
            "THE FUTURE PATH IS RECORDED AT THE TYPE, evidence-shaped rather than aspirational: widening the yield to `CompletionItem[] | CompletionList` and NORMALISING a mid-stream `CompletionList` into items is what restores `isIncomplete` without reintroducing a slot whose meaning depends on its neighbour. It is not built now.",
          verification:
            "Met by DOING NOTHING beyond writing it, which is what makes it meetable; it fails one way, by the note being absent. Grep for it after; the before-grep against the sprint's baseline returns nothing, which is the control that the grep can tell present from absent.",
        },
      ],
      notes: [
        "THE DISCOMFORT THIS PBI ANSWERS, in the stakeholder's own words: with the tuple, WHETHER THE FIRST RETURN VALUE IS A PROGRESS OR A RESPONSE DEPENDS ON WHETHER A GENERATOR IS PRESENT. One slot, two meanings, decided by a sibling. That is the defect; the lost capability is the price.",
        "`isIncomplete` SUPPORT IS DEFERRED BY STAKEHOLDER RULING, not dropped as unwanted. Sprint 42 built it, measured it working against nvim (3 re-queries against the paired negative's 1, corroborated at completion.lua:1086), and it is being withdrawn because the shape that carried it was uncomfortable rather than because the capability was wrong. THE MEASUREMENTS STAY IN SPRINT 42'S RECORD and are what a future attempt starts from.",
        "THE SEMANTICS OF `one batch means respond` ARE THE SCRUM MASTER'S READING OF THE STAKEHOLDER'S TWO MESSAGES AND ARE FLAGGED AS SUCH: to know a stream yielded exactly once you must pull twice, so the drive holds the first batch until the second pull settles. If the intent was instead `decide on the first pull alone`, the one-batch case cannot be detected at all and this criterion is wrong rather than merely imprecise.",
        "WHY THIS IS FORWARD WORK AND NOT A RESET OF `main`, decided by the Scrum Master and open to reversal: the commits this would discard carry measurements INDEPENDENT OF THE CODE -- nvim's partial-result behaviour, the seventeen completeness rulings, and the finding that `tsc --noEmit` reads a stale `dist/`. A reset reaches the same code state and sinks those into history. The pre-change state is preserved on the branch `tuple-generator-shape` at 2e1c3f7.",
        "THE LOOK-AHEAD WAS CONSIDERED AND DROPPED BY THE STAKEHOLDER IN FAVOUR OF SIMPLICITY, and recording that is what stops it being re-proposed as an oversight. It would have answered a single-batch stream with the batch itself and sent no `$/progress`, saving a round trip on the common case. It costs a chunk of buffering -- to know a stream yielded exactly once you must pull twice, so the FIRST batch is held until the SECOND pull settles, which delays delivery exactly when the first chunk is slow and streaming matters most. THE STAKEHOLDER CHOSE `the token decides, always`. The saving is real and the door is open; it is not worth a conditional in the drive.",
        "`return` NO LONGER CARRIES CONTENT, which the pre-tuple type allowed (`AsyncGenerator<CompletionItem[], CompletionItem[] | null, void>`). MEASURED, and it is why the alternative was declined: with a content-bearing return, `done: true` arrives WITH A VALUE on the first pull, so a single-batch answer is detectable in ONE pull and needs no buffering. What it costs is TWO ENTRANCES FOR CONTENT -- `yield` and `return` -- and the author choosing between them per call, which is the weaker form of the very defect this PBI exists to remove.",
      ],
    },
  ],
  completed: [
    {
      number: 42,
      pbi_id: "PBI-45",
      goal: "TSUDOI STOPS CLAIMING EVERY COMPLETION IS COMPLETE. A handler may answer with a `CompletionList`, the drive merges streamed chunks into its `items` and NEVER TOUCHES `isIncomplete` -- CONFORMANCE RATHER THAN A TSUDOI RULING, so it needs no argument from this team and its verification cites the specification line. THE SHAPE IS THE SPECIFIED ONE AND NOT AN INTERMEDIATE: the first `$/progress` literal carries the full result type and subsequent ones carry items, which NO `AsyncGenerator` CAN EXPRESS -- one yield type for every yield, measured in both directions -- so the tuple is what the requirement forces rather than a preference. THE ABORT-CLEANUP RESTRUCTURE COMES FIRST AND STRUCTURALLY, while the type still guarantees `.return()` exists; it is TIDY-FIRST FOR THIS SPRINT'S OWN SECOND HALF, and it does not ship without it. THE REAL WORK IS THE SEMANTIC RE-READ, NOT THE TYPE CHANGE: the specification treats a supplied array as `{ isIncomplete: false, items }`, so every config in this repository has been ASSERTING COMPLETENESS AND NONE OF THEM CHOSE IT -- each is RULED ON rather than re-typed, and a bare array that survives says at its site why completeness is true there. NOTHING PROVISIONAL SHIPS: the intermediate response-only shape was considered and dropped, because it would have forced a protocol decision the citation had already retired. COUNTS STAY OUT OF THIS GOAL -- this sprint edits every file they would count. WHAT THIS DOES NOT DO: no client available exercises the first-literal channel end to end, which is a CLIENT GAP AND NOT A TSUDOI ONE, and the stakeholder has ruled that support status must not weigh because support may expand.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "BASELINE e3897d9, resolved at Planning and verified rather than assumed: `git diff --stat e3897d9 HEAD -- . ':(exclude)scrum.ts'` is EMPTY, so nothing any before-grep reads has moved even though HEAD is ab2a095.",
        "THE SCRUM MASTER BROKE ONE DEADLOCK, and both parties' actual concerns are met rather than one being overruled. THE PO RULED `A AND C SHIP TOGETHER OR NEITHER`, because the reason for not shipping the cleanup restructure alone -- that it is tidy-first for work that is not happening -- does not expire when that work is merely LATE. THE DEVELOPER RULED TWO SPRINTS ON ATTRIBUTION: src/methods.ts carries FOUR recorded cleanup measurements, and if the restructure and the tuple land together and a cleanup property moves, it cannot be attributed. RULING: ONE SPRINT, with the restructure in its OWN COMMITS and ITS PERTURBATIONS RUN AND REPORTED BEFORE ANY TUPLE EDIT BEGINS. The PO's condition holds because nothing ships without the tuple; the Developer's holds because attribution is taken at the boundary where the cleanup measurements still describe the tree they were taken against.",
        "THE PREDICTED expect( DIFF FOR THE FIRST TWO SUBTASKS, recorded before any line is written. Base at e3897d9: 699 source `expect(` lines, 1279 runtime expect(), 452 tests. Subtask 1 is +0/0/0. Subtask 2 is +3 ADDED, 0 REMOVED, 0 CHANGED -- the count guard, the ruling-present assertion and its negative control, all source-scan tests that run ONCE rather than per runtime. So 699 -> 702, runtime 1279 -> 1282, tests 452 -> 455. COUNTERFACTUAL per Sprint 40: had the restructure not been behaviour-preserving we would see CHANGED lines in test/cleanup.test.ts or test/cancellation.test.ts, and V3 compiling with 452 green is what predicts zero -- so ANY changed or removed line there means the restructure changed behaviour. THE TUPLE SUBTASK'S DIFF IS NOT PREDICTED HERE: the executor predicts it in the committed plan before touching it, because 222 assertions across six files cannot be forecast from outside the work.",
        "PER-SPRINT REVIEW CHECKLIST, issued at Planning per Sprint 4 as merged at Sprint 17. (1) THE SEMANTIC RE-READ HAS NO DoD SIGNAL AND IS NOT MECHANICAL. Every config still returning a bare array is ASSERTING COMPLETENESS, which may be right or may be an oversight. FOUR GREEN IS NOT EVIDENCE. Review must see each one RULED ON, and a ruling that every one of them is correct is the answer MOST LIKELY TO MEAN NOBODY LOOKED. (2) THE MERGE IS CONFORMANCE, so its verification CITES THE SPECIFICATION LINE and offers no tsudoi argument; the assertion is that `isIncomplete` SURVIVES A MERGE UNTOUCHED. (3) CRITERION 1 NO LONGER GATES AND MEASURES VALUE RATHER THAN VALIDITY. Review must NOT read its unbuildable arm as a failure -- NOT CONSTRUCTED per Sprint 11, established two ways. AND THE LIKELIEST REVIEW ERROR, sharpened: `NOT CONSTRUCTED AGAINST nvim` IS NOT `UNEXERCISED`. nvim sends no token so the client-honours-it observation cannot be built, but the suite drives raw JSON-RPC and already sends partialResultTokens, so tsudoi's own first-literal path is exercisable AT FULL STRENGTH IN-SUITE. (4) THE FALSIFIED PROSE THIS SPRINT MUST CORRECT is the drive discriminator and the narrowness disclosure, both already named in the criteria.",
        "THE nvim MEASUREMENT, homed here because PBI notes evaporate at close and no test can assert a client's behaviour. nvim 0.13.0-nightly+6ecf226, node v24.18.0, repo clean at e3897d9. POSITION (a), THE RESPONSE: control `{isIncomplete:true, items:[2]}` -> 3 requests, kinds 2/3/3; PAIRED NEGATIVE `{isIncomplete:false, items:[2]}` -> 1 request, kind 2; `{isIncomplete:true, items:[]}` -> 3 requests. SO THE CONTROL FIRES AT 3-VERSUS-1 AND AN EMPTY `items` DOES NOT SUPPRESS `isIncomplete`. Corroborated in nvim's own source: completion.lua:1086 sets isIncomplete unconditionally and item conversion at :1087 is guarded on a non-empty list. POSITION (b), THE FIRST `$/progress` LITERAL: a CompletionList then an array, response null -> 1 request, kind 2 only, no re-query AND NO ERROR, with 2 progress notifications received and logged verbatim. RECEIVED AND IGNORED -- not refused, not lost in transport. ITS CONTROL IS NOT CONSTRUCTED per Sprint 11: no configuration makes nvim honour a first literal. WHY: nvim SENDS NO partialResultToken -- the wire capture shows completion params of {position, textDocument, context}, and `grep -F partialResultToken $VIMRUNTIME/lua/vim/lsp` returns ONE hit in generated type defs and ZERO in client code, with handlers.lua:55 reading value.kind and firing LspProgress with no partial-result routing at all. THE HARNESS IS NOT KEPT, said plainly per Sprint 39 rather than committed as a file nothing runs.",
        "THE SPECIFICATION LINES THIS SPRINT CITES, fetched from _specifications/lsp/3.18/language/completion.md in microsoft/language-server-protocol on gh-pages. :978 -- partial result is `CompletionItem[]` or `CompletionList` followed by `CompletionItem[]`, and if the first provided result item is a CompletionList, subsequent partial results of `CompletionItem[]` ADD TO THE `items` PROPERTY. :381 -- a supplied `CompletionItem[]` response is the same as `{ isIncomplete: false, items }`. THE SECOND IS WHAT MAKES THIS SPRINT A CORRECTION RATHER THAN AN ADDITION: all 17 completion configs return a bare array or null, so tsudoi ASSERTS COMPLETENESS on every completion it answers and nobody chose that.",
        "TWO SEARCH FAILURES ARE RECORDED BECAUSE THE MECHANISM WILL RECUR. The positional rule was missed TWICE by the Scrum Master, both times because it lives in the METHOD's own section rather than in the general Partial Result Progress section, and both fetches of the rendered specification page TRUNCATED before reaching it AND SAID SO -- `not found` was read as `not there` rather than as `not reached`. That is Sprint 39's zero-result entry firing on a FETCH, a home nobody had thought to check. AND THE PO'S OBJECTION WAS SOUND ON THE EVIDENCE AND IS RECONCILED RATHER THAN OVERTURNED: protocol.d.ts really does declare ONE partial-result slot, and it does so BECAUSE TYPESCRIPT CANNOT EXPRESS A POSITIONAL UNION EITHER -- the reference types are WEAKER THAN THE SPECIFICATION, so their silence was never evidence. THE GENERAL LESSON: a reference implementation's types can be weaker than the specification it implements.",
        "THREE TESTS ROUTED UNDER SPRINT 16 AND DECIDED ON PROPERTY SURVIVAL RATHER THAN ON FIXTURE-VERSUS-TEST. The executor framed it as `the record accepts rewriting fixtures and never tests`, and THAT AXIS WOULD DECIDE THE NEXT CASE WRONGLY. THE RULE, because it will be needed again: a property REMOVED BY CONSTRUCTION lets its test die as TARGET DELIBERATELY REMOVED per Sprint 38 -- AND THE SPRINT MUST THEN ASK WHETHER THE NEW SHAPE CREATES AN ANALOGOUS HAZARD, which is the question a deletion silently skips; a property that SURVIVES IN ANOTHER FORM is re-homed IN THE SAME COMMIT; and a property belonging to a STANDING ITEM is never a PBI's to retire. (1) `the response carries the returned array alone` guarded DOUBLE DELIVERY, foreclosed by construction once the response is null -- it dies, AND THE POSITIONAL SPLIT CREATES THE SAME DEFECT THROUGH A NEW MECHANISM, so `a client that appends sees each item exactly once` OWNS A TEST whose FIRST assertion it is, per Sprint 18. (2) the three-mode rule loses its referent with the generator's return -- it dies, but ITS COMMENT'S ENUMERATION IS THE DURABLE PART and the tuple's own mode table replaces it: `[null]`, `[items]` with no token, `[items, stream]` with a token, `[items, stream]` without. (3) RE-HOMED, NOT DROPPED: it carries standing item 6's `breaking a handler's return must redden` control, a Sprint-5 improvement as amended at Sprint 13 and NOT THIS PBI'S TO RETIRE; the re-homing lands in the deletion's own commit so no window exists in which the control is out of custody. THE COMMENT SAYING `DO NOT DROP THIS HALF` DID ITS JOB, on someone with every incentive to read past it.",
        "AN UNEXPLAINED SUITE FAILURE, RECORDED WITH ITS REFUTED HYPOTHESIS RATHER THAN AS `COULD NOT REPRODUCE`. OBSERVED ONCE by the Scrum Master at HEAD d4082fe: `bun test` redirected to a file, EXIT 1, in a shell that had just run `git status --short` and `git log --oneline`. NOT REPRODUCED in three consecutive runs immediately after, each 455 pass / 0 fail. THE REASONED CAUSE WAS TESTED AND FAILED: bunfig.toml's preload rebuilds dist/ before any test loads, so two runs racing would mean one process writing dist/ while another reads it -- probed as TWO CONCURRENT `bun test` RUNS, TWICE, and ALL FOUR EXITED 0 WITH 0 FAIL. So the concurrency hypothesis is REFUTED, not merely unconfirmed, and the failure remains UNEXPLAINED. IT DOES NOT BLOCK THE SPRINT AND IT IS NOT NOTHING: every `MEASURED, exit 0` in this project's record assumes a deterministic suite, so this is a claim on the evidentiary basis rather than a nuisance. Written down so THE NEXT OCCURRENCE IS A SECOND DATA POINT rather than another first.",
        "`tsc --noEmit` GREEN IS NOT EVIDENCE THAT THE EXAMPLES COMPILE, WHENEVER THE PUBLISHED TYPES MOVE -- found by the executor and REPRODUCED BY THE SCRUM MASTER WITH A CONTROL. examples/ import through `@atusy/tsudoi/types`, which package.json maps to `./dist/types.d.ts`, THE BUILT ARTIFACT. So tsc checks them against whatever dist/ currently holds, while `bun test`'s preload REBUILDS dist/ first -- and the two therefore disagree exactly when the surface has changed. MEASURED: the executor saw `tsc --noEmit` EXIT 0 against a stale dist/ while the rebuilt tree gave 43 test failures. THE SCRUM MASTER'S FIRST PROBE OF THIS WAS DEGENERATE AND IS RECORDED AS SUCH: renaming `Method` in dist/types.d.ts left tsc at exit 0 with ZERO errors, which reads as `tsc does not see dist/` and means only that NO EXAMPLE IMPORTS `Method`. Re-probed with a name they DO import: removing `TsudoiConfigFactory` from dist/types.d.ts gives EXIT 1 and TS2305 AT examples/tsudoi.config.ts, so tsc does resolve through dist/. FOURTH INSTANCE OF THE SPRINT-35 STALENESS CLASS, and the first where the stale artifact is READ BY A DoD CHECK ITSELF rather than by a test. IT HAS NO HOME YET: bunfig.toml's preload protects `bun test` and NOTHING protects `tsc --noEmit`, so a developer running only tsc after a types change is told green by an instrument reading yesterday's surface.",
        "ACCEPTED. All six criteria met, and the increment landed with its prediction holding to EVERY PER-FILE COLUMN -- 702 to 712 source `expect(` lines, 1282 to 1302 runtime, 455 to 459 tests, with cancellation +2/-1, cleanup +4/-2, completion-path +1/-1, protocol +2/-2 and completion +14/-7 -- the re-prediction committed BEFORE any source was touched. THE REVIEW RAN AS INLINE ROLE-PLAY per the scrum-conversation fallback: the Product Owner agent had been stopped and could not be resumed, and that is recorded rather than glossed, because an acceptance the facilitator role-played is weaker evidence than one an independent role gave.",
        "THE EXECUTOR DEPARTED FROM A PO RULING IN THE SAFE DIRECTION AND SAID SO. `a null return is [] after a partial result and null when there was none` was ruled MAY DIE; they RETARGETED it instead -- the `[]` value dies with its mechanism while the two-session discrimination survives, now guarding the replacement hazard. Their sentence is the one worth keeping: MAY DIE IS PERMISSION, AND THE DEPARTURE IS RECORDED. Accepted, and better than compliance would have been.",
        "TWO PROBES REPORTED AS MEASURING NOTHING, which is the behaviour checklist item 1 was written to reward rather than a shortfall. Re-introducing the `Array.isArray(final)` early return leaves the suite ENTIRELY GREEN -- predicted at the site BEFORE it was measured, classified NOT CONSTRUCTED with the residual risk named in the comment. And NO MUTATION WAS FOUND THAT ONLY `a client that appends sees each item exactly once` CATCHES: one reddens 20 tests, another 16, a third is unreachable. The test is KEPT on Sprint 16's bar -- it NAMES the duplicated item where the others report a count -- and recorded as NARROWLY CLEARED RATHER THAN PROVEN. The test the PO required exists; its uniqueness does not.",
        "TWO DEFECTS WERE FOUND IN HANDED-OVER WORK BY MEASUREMENT RATHER THAN BY READING, and the second is the sharper one. The answer was emitted with NO CANCELLATION CHECK, so a completion cancelled before dispatch streamed one message -- `progressCount` observed 1 where 0 was asserted, on both runtimes. AND `applyFinal` READ A RETURNED `[]` AS `nothing to add`, contradicting the very specification line this sprint cites: a supplied `CompletionItem[]` IS `{ isIncomplete: false, items }`. Under a token that same `[]` goes out AS the response, so ONE HANDLER WOULD HAVE MADE OPPOSITE COMPLETENESS CLAIMS DEPENDING ON WHETHER THE CLIENT SENT A TOKEN. Both fixed; the second is why re-measuring inherited work is not ceremony.",
        "CRITERION 4 IS CLOSED BY THE COMPILER ON BOTH PROPERTIES, which is PBI-45 note 3's evidence-shaped trigger firing on its `if` branch. `HoverRequest.type` in completion's slot now fails TS2322, and a probe method omitted from the table gives TS2741 NAMING THE KEY. Re-run rather than inherited, because the criterion forbids assuming the discriminator rewrite improved it. The hazard that stood since the table was written -- closed by a test rather than by the compiler -- is now closed by the compiler.",
        "A FALSE SENTENCE IN THE STAKEHOLDER-FACING EXAMPLE WAS SURFACED RATHER THAN FIXED MID-SPRINT, AND FIXED AFTER. examples/tsudoi.config.ts promised `HOW YOU WILL KNOW: this handler says so once on stderr per session` for a line the stakeholder had removed as noise -- so the document that argues for adoption told an author they would get a diagnostic they will not. Pre-existing and outside every criterion. THE EXECUTOR WAS RIGHT NOT TO FIX IT IN-SPRINT: correcting prose outside the criteria is how scope grows. Corrected at ec86fc3 as documentation work outside the loop.",
      ],
    },
    {
      number: 41,
      pbi_id: "PBI-44",
      goal: "THE CONFIG FACTORY TAKES NOTHING. `TsudoiConfigFactory` becomes `() => Promise<TsudoiConfig>`, every config in test/fixtures and examples/ WHOSE DEFAULT EXPORT IS A FUNCTION stops declaring a parameter, and NO NEW EXPORTED NAME STANDS WHERE IT WAS -- the empty-context design is refused, because an empty name in the published surface is itself an `あるもの` that is hard to remove, and `Configuration` collides with LSP's own term for client settings. THE COUNTS ARE DELIBERATELY NOT IN THIS GOAL: they are a measurement with provenance, they live in the notes beside the before-grep that checks them, and this sprint edits every file they count. ALL BUT TWO OF THOSE CONFIGS NEVER USED THE PARAMETER -- they write it underscore-prefixed, which is this repository's own near-universal convention for its own configs, and THAT is the user-value argument rather than any aesthetic one. THE TWO THAT DID USE IT MOVE TO `RequestContext.tsudoi`, captured during a request and read at exit; MEASURED WITH ITS NEGATIVE CONTROL TAKEN FIRST rather than promised, and it preserves every absence assertion AT FULL STRENGTH INCLUDING THE TWO NO REQUEST CAN REACH -- post-shutdown and pre-initialize -- because CAPTURE AND READ ARE DIFFERENT MOMENTS, which is the premise the brief handed the team and the Developer refuted. THE SPRINT ALSO CLOSES TWO HAZARDS IT CREATES, WHICH IS THE PRINCIPLE THAT DECIDED BOTH: primedness becomes a precondition those two fixtures do not have today, so an UNPRIMED instrument must never be reportable as a store that was read and found empty; and an author writing the OLD shape from memory would get `undefined` with no diagnostic, so THE DOCUMENTED ROUTE CARRIES `satisfies TsudoiConfigFactory` -- at the stakeholder's direction, adding NOTHING to the published surface because that type is already exported and already reachable. THE LABEL FOR IT IS DELIBERATELY WEAK: DEFENDED ON THE DOCUMENTED ROUTE, UNDEFENDED ON THE REST, and NOT Sprint 40's `detected on the rest`, because that ruling's bypass route carried a rot detector and this one carries nothing. AND ONE CRITERION IS DEFENDED BY GREP RATHER THAN BY THE SUITE, measured: all four DoD checks pass on a half-stripped tree, so FOUR GREEN IS NOT EVIDENCE FOR IT. The hazard src/cli.ts records -- that a factory-time read captures a pre-initialize value forever -- stops being DEFERRED and becomes FORECLOSED, which is that file's own stated preference; deleting its fourteen lines is authorised, not required, and the hazard keeps a home either way. THE WINDOW IS OPEN ONLY BECAUSE THE PACKAGE IS UNPUBLISHED.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "BASELINE RESOLVED ONCE AT PLANNING AND RECORDED HERE: bbf06f4. Every `before the edit` grep in criteria 1, 4, 5 and 6 means that commit. It moved from c6cdc1a during Planning and NO RE-MEASUREMENT WAS NEEDED, verified rather than assumed: `git diff --stat c6cdc1a HEAD -- . ':(exclude)scrum.ts'` is EMPTY, so nothing the greps read changed.",
        "THE PREDICTED expect( DIFF, RESTATED BEFORE ANY LINE WAS WRITTEN because the earlier figure pre-dated criterion 7 and the `satisfies` work. SOURCE `expect(` LINES: 693 -> 697, that is +4 ADDED, 0 REMOVED, 7 CHANGED -- the seven being `messagesReceived).toBe(2)` to `toBe(3)`, six in sync.test.ts and one in document-members.test.ts, and the four being criterion 7's discrimination as TWO tests per Sprint 18 with two assertions each. ZERO ADDED FROM THE `satisfies` WORK: the example's clause is a type annotation, and the new ReadmeFact is a DATA ENTRY in an existing array whose loop already carries its three expect( lines. RUNTIME expect() CALLS: 1266 -> 1277, given as ARITHMETIC so Review can check the parts -- seven changed values contribute +0, criterion 7 is 2 tests x 2 runtimes x 2 assertions = +8, the README fact is 3 tests x 1 expect = +3. TESTS 444 -> 451. TOLERANCE STATED SO IT CANNOT BE FITTED AFTERWARDS: +2 rather than +4 is acceptable ONLY if the executor records why the exit-code assertion could never be first to fail. ANY REMOVAL AT ALL, or any changed count other than the seven, MEANS SOMETHING OTHER THAN THIS PLAN HAPPENED.",
        "COUNTERFACTUAL, per Sprint 40, recorded beside the prediction so a clean reading is LEGIBLE RATHER THAN LUCKY. Had the capture route failed: -2 source lines, the two `readSnapshot(...).toEqual([])` in protocol.test.ts, and CRITERION 7 WOULD BE UNCONSTRUCTIBLE -- with no priming route there is no primed-and-empty arm to discriminate against -- leaving only the `satisfies` half. Had `satisfies` been decorative: the TS1360 control would not fire. BOTH ARE ALREADY FALSIFIED BY MEASUREMENT, which is what makes them counterfactuals rather than open risks.",
        "PER-SPRINT REVIEW CHECKLIST, ISSUED AT PLANNING per Sprint 4 as merged at Sprint 17 so the plan can target it. (1) CRITERION 5 IS DEFENDED BY GREP AND NOT BY THE SUITE, measured: a stripped parameter beside a dead `Tsudoi` import gives tsc exit 0 (no noUnusedLocals) and oxlint exit 0 (warning only), so REVIEW MAY NOT READ FOUR GREEN AS EVIDENCE FOR IT and the greps with their before-controls must be SEEN RUN, unpiped, with the commands as run. (2) CRITERION 2'S TWO DIRECTIONS HAVE OPPOSITE EXPECTED RESULTS AND ARE EASY TO TRANSPOSE: A expects a RED, B expects ALL FOUR GREEN and that green IS the result -- a green for A or a red for B is a DEFECT, and B's paired control must have run. (3) CRITERION 6 IS MET BY DOING NOTHING and Review must not flag the surviving cli.ts comment as unfinished; a careful reviewer is MORE likely to misread this than a careless one. (4) CRITERION 7'S DISCRIMINATION MUST BE PERMANENT IN THE SUITE, and the question to ask is whether an unprimed fixture and a primed-but-empty one still SERIALISE DIFFERENTLY -- Sprint 38's rule applied to an instrument. (5) COMPARE AGAINST THE RESTATED PREDICTION ABOVE, not the superseded 0/0/7.",
        "THE `satisfies` CLAUSE HAS A SYNTAX TRAP, FOUND BY THE DEVELOPER AND MEASURED IN FOUR FORMS, and it is why the README teaches a NAMED CONST. The unwrapped block-bodied form is a TS1005 SYNTAX ERROR. The unwrapped EXPRESSION-bodied form PARSES AND SILENTLY RETARGETS THE CLAUSE TO THE RETURNED PROMISE rather than to the factory -- it errored only because a Promise can never satisfy a function type, which is LOUD BY LUCK RATHER THAN BY CONSTRUCTION. Only the WRAPPED form and the NAMED-CONST form carry TS1360 as intended, and the named const has no parenthesis to drop. A QUICKSTART TEACHING THE EXPRESSION-BODIED FORM WOULD HAVE SHIPPED A CLAUSE THAT DEFENDS NOTHING.",
        "EXECUTION RESULT, MEASURED AGAINST THE COMMITTED PREDICTION WITH NO DEVIATION AT ALL. SOURCE `expect(` LINES 693 -> 697; the raw diff shows 11 added and 7 removed lines, which resolves to +4 ADDED, 0 REMOVED, 7 CHANGED once the seven `messagesReceived).toBe(2)` -> `toBe(3)` pairs are read as changes rather than as an add and a delete. RUNTIME expect() CALLS 1266 -> 1277, the arithmetic checking out part by part exactly as the plan asked Review to verify: 0 from the changed values, +8 from criterion 7 (2 tests x 2 runtimes x 2 assertions), +3 from the README fact (3 loop tests x 1 expect). TESTS 444 -> 451. THE TOLERANCE WAS NOT NEEDED -- the +4 landed rather than +2, so no exit-code-assertion excuse had to be written.",
        "THE FOUR DoD CHECKS AT HEAD, EACH RUN UNPIPED WITH THE COMMAND AS RUN, and `bun test` REDIRECTED TO A FILE rather than piped so the exit belongs to bun and not to a pager: `bun test` EXIT 0 at 451 pass / 0 fail / 1277 expect() across 31 files; `tsc --noEmit` EXIT 0; `oxlint` EXIT 0; `oxfmt --check .` EXIT 0.",
        "THE PLAN'S ORDERING TRAP DISSOLVED RATHER THAN FIRED, and this is recorded because the sprint was organised around it. S4 was constrained to follow S2 because `satisfies` on a zero-argument config against a one-parameter type is TS1360. The stakeholder replaced `satisfies` with an ANNOTATED CONST mid-sprint, and the SAME constraint holds for the SAME reason under the new form -- an annotated zero-argument const against a one-parameter type is TS2322 -- so the ordering was obeyed and would have been correct either way. A CONSTRAINT THAT SURVIVES THE REPLACEMENT OF THE MECHANISM IT WAS DERIVED FROM WAS A CONSTRAINT ON THE PROPERTY ALL ALONG, which is the Sprint-26 rule showing its value in the direction nobody usually looks.",
        "CRITERION 5's `tsudoi: Tsudoi` ENUMERATION WAS UNDER-INCLUSIVE AT BOTH ENDS, REPORTED RATHER THAN SMOOTHED, AND IT IS NOT A DEFECT IN THE INCREMENT. The criterion said the after-grep must return `only tsudoi's own internals (src/server.ts, src/methods.ts, src/tsudoi.ts)`. OBSERVED after: those three PLUS src/types.ts twice. src/types.ts:474 is `RequestContext.tsudoi` -- WHICH CRITERION 4 EXPLICITLY REQUIRES TO SURVIVE -- and it was present at the baseline too, so the enumeration omitted a site that was always there and that another criterion protects. The second is a line of prose this sprint added. THE ARITHMETIC RECONCILES: 11 sites at bbf06f4, 8 now, the four removals being src/config.ts:13, src/types.ts:530 and the two capture fixtures, plus one added comment line.",
        "EVERY BEFORE-GREP WAS RUN AGAINST THE BASELINE COMMIT ITSELF RATHER THAN AGAINST A WORKING TREE BELIEVED TO EQUAL IT, and the instrument change that forced this made the measurement stricter. `rg -w` HUNG PAST 120 SECONDS on this tree, so `git grep -w <pattern> bbf06f4` was used throughout. That is not a workaround: the sprint notes warn at length that a run-time `HEAD` drifts with the sprint's own commits, and naming the commit in the command forecloses that instead of documenting it. THE ZERO-RESULT AMBIGUITY IS CLOSED FOR ALL THREE OF CRITERION 5's INSTRUMENTS: `_tsudoi` returns 33 at bbf06f4 and 0 now; `tsudoi: Tsudoi` returns 11 and 8; and every file still importing `Tsudoi` still NAMES it, the two capture fixtures included -- they keep the import because `let captured: Tsudoi | undefined` names it, which is exactly the case criterion 5 refused to let a `drop the import` order reach.",
        "CRITERION 1 MEASURED ON THE PUBLISHED ARTIFACT RATHER THAN ON ITS SOURCE, WHICH IS STRICTER THAN THE CRITERION ASKED FOR. package.json maps `./types` to dist/types.d.ts, so THAT FILE IS the surface; the set was extracted from it before and after a `tsc -p tsconfig.build.json` build. 22 NAMES BEFORE, 22 AFTER, and the comparison is a TWO-DIRECTION set difference rather than a containment check -- a one-direction test would have passed with a name ADDED, which is the direction the criterion says matters most. ITS NEGATIVE CONTROL WAS TAKEN FIRST AND FIRED: `export type Probe = never;` appended to src/types.ts is REPORTED, by name, in the ADDED column. THE COMPILER-API INSTRUMENT WAS ABANDONED FOR A MEASURED REASON: typescript 7.0.2 is the native compiler and ships no JS API -- `ts.ScriptTarget` is undefined -- so `getExportsOfModule` was unavailable.",
        "CRITERION 3'S OWN VERIFICATION WAS RUN AND IS MEASURED RATHER THAN REASONED, AND IT WAS VERY NEARLY REPORTED AS COVERED BY P1/P2, WHICH WOULD HAVE BEEN WRONG. P1 and P2 perturb THIS SPRINT'S priming; criterion 3 asks whether each named test's PRE-EXISTING perturbation STILL REDDENS IT -- a different property, and Sprint 13 forbids answering a coverage question by argument. FOUR PERTURBATIONS, each named by the assertion it flips. PC1, `DocumentStore.values()` returns nothing -- THE MEMBER BOTH FIXTURES CALL, so this is the one that discriminates `the store the config obtained` from a server-side hook: REDDENS 10, being sync.test.ts's four presence tests and document-members.test.ts's positional members, on both runtimes. PC2, `close()` becomes a no-op: REDDENS 4 -- `didOpen then didClose leaves the config's store empty` and `closing one of two open documents...`. PC3, the lifecycle notification gate stops dropping: REDDENS EXACTLY 4, being the two protocol.test.ts lifecycle tests and nothing else -- which is the post-shutdown and pre-initialize pair the brief claimed no request-based route could preserve. PC4, `change()` implicitly creates a document for a uri never opened: REDDENS 2, `didChange and didClose for a uri never opened are survivable, not fatal`. ALL FOUR ARE INDEPENDENT rather than reproductions -- no recorded perturbation existed for them.",
        "TWO OF CRITERION 3'S NAMED TESTS ARE NOT REACHED BY ANY STORE PERTURBATION, AND THAT IS CLASSIFIED PER SPRINT 11 RATHER THAN LEFT AS A GAP OR PADDED INTO THE COUNT ABOVE. `a malformed didOpen is reported on stderr naming the method` and `the dropped didOpen is not reported on stderr, in a run where a failing one is` have STDERR claims as their first assertions, not store claims -- the first asserts the vscode-jsonrpc wrapper text, the second asserts `tsudoiLines` in both directions. NOT CONSTRUCTED, AND THE REASON IS THAT THE PROPERTY IS NOT A STORE PROPERTY: a malformed didOpen carries no textDocument, so there is nothing a store could record for it either way. WHAT COVERS THEIR SECONDARY `toEqual([])` IS THIS SPRINT'S OWN ADDITION: before criterion 7 those empties could not be told from an unprimed instrument, and now they can -- which is a STRENGTHENING of exactly the two assertions no perturbation reaches.",
        "THE SPIKE, ATTACHED HERE PER SPRINT 2 BECAUSE A SCRATCHPAD DOES NOT SURVIVE: the re-homed fixture declares `let captured: Tsudoi | undefined` at module scope, its exit handler writes `TSUDOI_SNAPSHOT_UNPRIMED` when `captured` is undefined and the usual `TSUDOI_SNAPSHOT ${JSON.stringify(documents)}` otherwise, and its single `textDocument/hover` handler assigns `captured = context.tsudoi` and returns `Promise.resolve(null)`. document-members-config.ts takes the same shape under its own marker. MEASURED AT 26 pass / 0 fail on protocol.test.ts with the UNPRIMED negative control taken FIRST at 4 fail.",
        "PROMOTED FROM S2'S NOTES BECAUSE SUBTASK NOTES EVAPORATE AT CLOSE AND THIS EXISTS NOWHERE ELSE. P1 WAS RECORDED AS `MEASURED 4 fail` AND OBSERVED 2, AND THE DEVIATION WAS RECONCILED RATHER THAN SMOOTHED: P1 alone reddens 2 (the one test, once per runtime), P2 alone reddens 2, P1 AND P2 TOGETHER redden 4 -- so the recorded 4 belonged to THE SPIKE'S CONTROL, which removed BOTH priming requests, and was attached to P1 ALONE when the plan was written. RIGHT ABOUT THE WORLD, WRONG ABOUT WHICH PERTURBATION OWNED IT. Sprint 27 firing on a number that reached the executor THROUGH THE SCRUM MASTER FROM THE DEVELOPER -- the brief being the one artifact with no permanent home, which is that entry's own stated reason for existing. Both perturbations flip the named assertion and both REPORT THE UNPRIMED STATE BY NAME.",
        "PROMOTED FROM S3'S NOTES, AND IT IS CRITERION 7'S ENTIRE JUSTIFICATION -- OBSERVED RATHER THAN ARGUED. The defending perturbation was run in BOTH directions: degrade snapshot-config.ts so an unprimed run prints `[]` instead of naming itself, and (a) the new pair REDDENS 2, while (b) WITH A PRIMING REQUEST ALSO REMOVED, test/protocol.test.ts GOES TO 26 pass / 0 fail. SO WITHOUT THE SENTINEL, DELETING A PRIMING REQUEST MAKES THE SUITE GREEN -- the exact vacuous pass criterion 7 was written to forbid, demonstrated rather than predicted. Independently reproduced at Review by the Scrum Master with A DIFFERENT EDIT (degrading the branch rather than deleting it, which targets the failure the criterion actually forbids): exactly 2 red, the pair, nothing else.",
        "PROMOTED FROM S5'S NOTES: AN ENUMERATION HANDED TO A SUBTASK WAS INCOMPLETE, AND THE MISSING SITE WAS FOUND BY GREPPING THE CLAIM'S WORDS RATHER THAN THE LISTED LINES. src/workspace.ts:21 explained WHEN workspace folders are read by saying they are not handed to the config factory. THE TIMING CLAIM SURVIVED AND ITS REASON WENT FALSE -- Sprint 29 firing on a list nobody doubted, and the reason a diff on the changed lines would never have reached it.",
        "PROMOTED FROM S5'S NOTES AND THE MOST DURABLE THING IN THIS SPRINT: A JUSTIFICATION CAN GO FALSE WITHOUT THE CONCLUSION IT SUPPORTS GOING FALSE, AND ONLY RE-READING THE REASON CATCHES IT. `Tsudoi` was published because AN EXAMPLE COULD NOT BE WRITTEN WITHOUT IT; this sprint made that false, since no example and no README snippet names it now -- while the CONCLUSION, that it stays exported, is more firmly true than before. THE TWO JUSTIFICATIONS ARE DIFFERENT IN KIND, which is the general shape: `could the example be written without it` is about CONVENIENCE and can go false as the examples change, while `is it reachable from a published type` is about COHERENCE and cannot.",
        "PROMOTED FROM S4'S NOTES: THE ANNOTATION-REMOVAL WIN IS THIS PBI'S USER STORY ACTUALLY LANDING, AND NOTHING OUTSIDE A SUBTASK NOTE SAID SO. The README quickstart now imports ONE name instead of two, declares NO parameter and NO return type -- the annotation on the const supplies the return type AND the inline handler's `context` and `params`. THE QUICKSTART GOT SHORTER, which is what `the smallest config contains nothing I cannot explain` means in practice, and it was measured before it was written.",
        "PROMOTED FROM S4'S NOTES, UNPLANNED AND IT STRENGTHENS CRITERION 2'S B3: THE TWO CONFIG SOURCE STRINGS BECAME A SECOND AND THIRD DEFENDED ROUTE. test/installed-specifier.test.ts and test/published-specifier.test.ts type-check their consumer config against the SHIPPED and the INSTALLED package, so teaching them the documented shape means THE DOCUMENTED ROUTE IS COMPILED IN THREE PLACES RATHER THAN ONE.",
        "THE PRODUCT OWNER'S OWN FALSE PREMISE, RECORDED IN THEIR WORDS RATHER THAN THE SCRUM MASTER'S: an earlier draft of criterion 2's verification claimed that under an unwrapped expression-bodied `satisfies` A WRONG-ARITY FACTORY WOULD PASS. MEASUREMENT REFUTED IT IN BOTH ARITIES -- EXIT 1 and TS1360 whether the factory takes zero arguments or one, because the clause binds to the returned Promise and A PROMISE CAN NEVER SATISFY A FUNCTION TYPE. Caught before execution ran anything against it. A CRITERION CARRYING A FALSE EXPECTED RESULT IS WORSE THAN ONE CARRYING NONE: the executor would have expected a green, observed a red, and had NO WAY TO TELL A DEFECT FROM A PREMISE THAT WAS NEVER TRUE.",
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
    ],
  },
  sprint: {
    number: 43,
    pbi_id: "PBI-46",
    status: "in_progress",
    goal: "ONE SLOT, ONE MEANING. A completion handler becomes `AsyncGenerator<CompletionItem[], void, void>`: every yield is content, the return carries nothing, and NOTHING THE AUTHOR WRITES SELECTS A DELIVERY CHANNEL. The tuple is withdrawn and `CompletionResponse` and `EmptyCompletionResponse` go with it. THE CHANNEL IS THE TOKEN'S ALONE -- present means every yield leaves as `$/progress` and the response is `null`, ALWAYS, including for a stream that produced one batch; absent means aggregate and answer. THE COST IS ACCEPTED KNOWINGLY rather than discovered: a single-batch answer under a token spends a `$/progress` and a null response where one response would have done, and the look-ahead that would have saved it was considered and dropped because it makes the FIRST batch wait on the SECOND pull -- a delay that lands exactly when the first chunk is slow and streaming matters most. `isIncomplete` BECOMES UNEXPRESSIBLE AGAIN AND THAT IS THE PRICE, NOT AN OVERSIGHT: the completeness rulings written at every config stay, and the two ruled NOT COMPLETE keep saying the claim is wrong and now say why it cannot be fixed here. A SPRINT THAT REMOVED THE CAPABILITY AND THEN RELABELLED THE CONFIGS THAT NEEDED IT WOULD LEAVE NOTHING RECORDING THE LOSS.",
    subtasks: [
      {
        test: "EXPECTED-RED, and the three parts are ONE EDIT -- SHARED-MOMENT DECLARED: the published type, the drive and the fixtures cannot land separately because a tuple-shaped fixture does not compile against a generator-shaped type and the reverse. PERTURBATIONS, each named by the assertion it flips: P1 make the drive skip `$/progress` when only one batch was produced -- the token-present-one-batch arm must redden NAMING THE PROGRESS COUNT, which is what stops `the token decides` from being satisfied by any drive that happens to agree today. P2 make the drive aggregate under a token -- the token-present-many arm reddens. P3 make it stream with no token -- the token-absent arm reddens. THE SPRINT-6 PAIRING is required because two arms assert an ABSENCE of progress: an arm observing progress PRESENT through the same measurement ships beside them.",
        implementation:
          "`MethodMap['textDocument/completion'].result` becomes `AsyncGenerator<CompletionItem[], void, void>`; `CompletionResponse` and `EmptyCompletionResponse` are removed from src/types.ts; the drive decides on the token alone with no look-ahead and no special case; every completion fixture and example yields arrays again. `void` FOR THE RETURN IS MEASURED AND NOT STYLISTIC: with `null` a generator falling off its own end is TS2355 and `{done:true}` with an undefined value, so every handler would carry a ceremonial `return null;`.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "BORN-GREEN. The completeness-ruling scan from Sprint 42 must still pass WITH its count guard and its negative control. AND THE GAP'S OWN CONTROL, which is the one this subtask exists for: grep the two NOT COMPLETE verdicts before and after and confirm they are UNCHANGED. A sprint that removes the capability and then quietly re-rules those configs COMPLETE to make the tree consistent would leave nothing recording that anything was lost.",
        implementation:
          "The completeness rulings STAY at every config. The two ruled NOT COMPLETE gain a sentence saying the claim is still wrong AND WHY IT CANNOT BE FIXED HERE. The future path is recorded at the type, evidence-shaped: widening the yield to `CompletionItem[] | CompletionList` and NORMALISING a mid-stream CompletionList into items restores `isIncomplete` without a slot whose meaning depends on its neighbour.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "BASELINE f94bef0, resolved once at Planning. PLANNING AND REVIEW RUN AS INLINE ROLE-PLAY per the scrum-conversation fallback: the Product Owner agent was stopped by the stakeholder and cannot be resumed. RECORDED RATHER THAN GLOSSED, because a goal and an acceptance the facilitator role-played are weaker evidence than ones an independent role gave, and Sprint 42 closed the same way.",
      "FORWARD WORK RATHER THAN A RESET OF `main`, and the pre-change state is preserved on the branch `tuple-generator-shape` at 2e1c3f7. The stakeholder asked for a reset; the Scrum Master proposed this instead and it is open to reversal. THE REASON IS WHAT A RESET WOULD SINK: the commits it would discard carry measurements INDEPENDENT OF THE CODE THEY ARRIVED BESIDE -- nvim's partial-result behaviour with its control, the seventeen completeness rulings, and the finding that `tsc --noEmit` reads a stale `dist/`. All three outlive this design and the first is exactly what a future `isIncomplete` attempt starts from.",
      "PER-SPRINT REVIEW CHECKLIST. (1) THIS SPRINT REMOVES A CAPABILITY, so Review asks what records the loss rather than only what passes -- the two NOT COMPLETE verdicts unchanged and the future path present at the type. FOUR GREEN IS COMPATIBLE WITH HAVING QUIETLY RELABELLED THEM. (2) CRITERION 2'S NEGATIVE CONTROL IS THE ONE THAT MATTERS: without P1, `the token decides` is satisfied by a drive that agrees by accident. (3) `tsc --noEmit` READS `dist/`, NOT `src/`, for the examples -- run `tsc -p tsconfig.build.json` FIRST or the type check reports on yesterday's surface. Sprint 42 measured this in both directions. (4) THE PROGRESS COUNT IS PART OF EVERY ARM'S ASSERTION; a test reading only the response cannot tell the arms apart.",
    ],
  },
  retrospectives: [
    {
      sprint: 42,
      improvements: [
        {
          action:
            "A DoD CHECK CAN READ A STALE ARTIFACT, AND THIS ONE DOES. `tsc --noEmit` type-checks examples/ against `dist/types.d.ts` rather than src/, because package.json maps `@atusy/tsudoi/types` to the BUILT file; `bun test`'s preload rebuilds dist/ and TSC DOES NOT. So the two disagree exactly when the published surface has moved, which is the only time it matters. MEASURED TWICE IN ONE SPRINT, in both directions: tsc EXIT 0 beside 43 test failures on one tree, and tsc EXIT 1 on a CLEAN src/ against a leftover dist/. FILED AS A FOURTH INSTANCE OF THE SPRINT-35 STALENESS CLASS AND THE FIRST WHERE THE STALE ARTIFACT IS READ BY AN INSTRUMENT RATHER THAN BY A TEST -- the three before it were tests reading a stale dist/, which the preload now covers. THE PRACTICE UNTIL IT HAS A HOME: after any change to the published types, run `tsc -p tsconfig.build.json` BEFORE believing `tsc --noEmit`. It has no home and that is the gap: nothing protects the type check the way bunfig protects the suite.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PROBE IS DEGENERATE WHEN ITS SUBJECT IS NOT REACHED BY WHAT IT PERTURBS, AND `EXIT 0 WITH ZERO ERRORS` IS THE SHAPE THAT HIDES IT. MEASURED, BY THE SCRUM MASTER, AGAINST THEMSELVES: renaming `Method` in dist/types.d.ts left tsc at exit 0 and was nearly read as `tsc does not consult dist/` -- when it meant only that NO EXAMPLE IMPORTS `Method`. The re-probe used a name they DO import and gave TS2305 at the example. THIS IS THE THIRD DEGENERATE PROBE THIS THREAD -- an excess object member that excess-property checking could not reach, an import that failed to resolve so every name was `any`, and now a perturbation of an unimported symbol -- AND ALL THREE PRODUCED A CLEAN GREEN. EXTENDS the Sprint-9 non-vacuity entry with the specific question that catches this class: BEFORE READING A GREEN, ASK WHETHER WHAT YOU PERTURBED IS REACHED BY WHAT YOU MEASURED. Not whether the control fired -- whether it COULD have.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A SHAPE THAT MOVES UNDER AN EXECUTOR COSTS MORE THAN THE EDITS IT INVALIDATES, AND THE COST IS PAID IN MISATTRIBUTED EVIDENCE. This sprint's completion type changed FOUR TIMES mid-execution -- AsyncIterable, then a tuple with a third element, then a generator returning a response, then that return narrowed by type -- and each move was individually right and stakeholder-directed. WHAT IT PRODUCED: a committed diff prediction describing a shape that no longer existed, superseded twice; an executor's `criterion 2 is dead` headline that was true of a superseded shape and had to be withdrawn; a preserved patch built across two of the shapes whose terminal handling could not be trusted; and a subtask whose premise a later ruling removed entirely. NONE OF THAT IS A REASON TO REFUSE A MID-SPRINT CHANGE -- the fourth shape is better than the first and the stakeholder was right each time. THE ACTIONABLE HALF: WHEN THE SHAPE MOVES, EVERY PREDICTION AND EVERY FINDING TAKEN AGAINST THE OLD ONE IS SUPERSEDED RATHER THAN INHERITED, AND SAYING SO IS THE FACILITATOR'S JOB AT THE MOMENT OF THE MOVE -- not the executor's when they trip over it. Both times it was caught, the executor caught it.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 41,
      improvements: [
        {
          action:
            "SPRINT 26'S QUESTION HAS AN ANSWER FOR THIS SPRINT AND IT IS NEITHER OF THE TWO IT OFFERED. That entry asks whether the rate of `not constructed` is honesty or over-authoring. THE MEASURED ANSWER HERE IS A THIRD THING: FOUR DEFECTS IN PO-AUTHORED CRITERIA, NONE CAUGHT BY THEIR AUTHOR -- three mechanisms sitting where a property belonged (`satisfies` in criterion 2, `rg -w` in criterion 5, and TS1360 before it was moved to the verification) and TWO FALSE FACTUAL PREMISES (criterion 5's `tsudoi: Tsudoi` list, which contradicted what criterion 4 required to survive, and the claim that a wrong-arity factory would pass an unwrapped `satisfies`). EVERY ONE WAS CAUGHT DOWNSTREAM -- by the Scrum Master, by the executor routing around it, or by measurement. SO THE RATE IS NOT OVER-AUTHORING AND NOT DISCIPLINED HONESTY: IT IS THAT CRITERIA ARE BEING AUTHORED FASTER THAN THEIR PREMISES ARE BEING CHECKED, and the downstream catch rate is what has been standing in for the check. THE ACTIONABLE HALF, because a rate is not a remedy: A FACTUAL PREMISE INSIDE A CRITERION IS MEASURED BEFORE THE CRITERION BINDS, BY WHOEVER HAS THE SHELL -- the PO has none, which is not an excuse but the mechanism, and it means the Scrum Master transcribing a criterion OWNS measuring its premises rather than transcribing them faithfully.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MEASUREMENT CAN GO STALE BECAUSE OF AN UNCOMMITTED EDIT NOBODY CLAIMS, AND NO EXISTING ENTRY REACHES THAT MECHANISM. Filed as a fourth way beside Sprint 38's three -- not an edit to the measurement, not an edit to the file it describes, not a later sprint changing the world it measured. MEASURED THIS SPRINT: a config count of 31/29 was taken while an uncommitted edit had already stripped examples/tsudoi.config.ts, SO THE FILE DID NOT MATCH ITS OWN PATTERN, and the number moved to 32/30 when the edit was reverted. IT WAS ONE STEP FROM ENTERING A SPRINT GOAL, and what stopped it was the PO refusing counts in a goal on the general Sprint-22 ground -- a generic rule catching a specific mechanism nobody had named. TWO UNROUTED EDITS APPEARED IN THIS SESSION AND NOBODY CLAIMS EITHER, which is a pattern rather than an incident. THE REMEDY IS THE CHEAP HALF AND IT IS ALREADY PROVEN: PRESERVE THE CONTENT OUTSIDE THE REPOSITORY BEFORE REVERTING. The second stray edit was backed up and then reverted, and it is what found the orphaned-import gap that criterion 5 now covers -- AN EDIT CAN TEACH SOMETHING AND STILL NOT BE A DELIVERABLE, and keeping both halves is more useful than resolving them.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "`LOUD BY LUCK` IS A DISTINCT CLASS FROM A DEGENERATE INSTRUMENT, AND FILING IT AS ONE WOULD HAVE BEEN A FALSE PROOF CLOSING A QUESTION. The PO proposed the `satisfies` subject-binding trap as a SIXTH degeneracy location under the Sprint-9 entry; MEASUREMENT REFUTED THE PREMISE -- an unwrapped expression-bodied `satisfies` errors in BOTH arities, so it never passes silently and is not degenerate at all. WHAT IT ACTUALLY IS: a check that VERIFIES THE WRONG SUBJECT while appearing to verify the right one, and that fails ANYWAY for an unrelated reason -- here, that a Promise can never satisfy a function type. THE DIAGNOSIS IS RIGHT AND THE MECHANISM IS WRONG, and a rule filed on the wrong mechanism generalises wrongly. THE GENERAL FORM, which is what earns the entry: A GUARD THAT FIRES FOR A REASON OTHER THAN THE ONE IT WAS BUILT FOR IS NOT EVIDENCE THAT IT GUARDS -- ask WHY it fired, not WHETHER. Recorded although the stakeholder ruled the trap itself out of scope, because the CLASS outlives the instance and the instance was proposed twice in one session, the second time by the stakeholder.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CONSTRAINT THAT SURVIVES THE REPLACEMENT OF THE MECHANISM IT WAS DERIVED FROM WAS A CONSTRAINT ON THE PROPERTY ALL ALONG -- SPRINT 26 SHOWING ITS VALUE IN THE DIRECTION NOBODY LOOKS. That entry is normally read as a rule about how to WRITE a criterion. MEASURED HERE IN THE OTHER DIRECTION: the requirement that the README say IN ONE CLAUSE what the binding buys was derived while the mechanism was `satisfies`, and it survived the stakeholder replacing that mechanism with an annotated const WITHOUT ONE WORD CHANGING. That survival is EVIDENCE about the requirement rather than a coincidence about the sprint, and it gives a cheap test available at any mechanism change: ASK WHICH CONSTRAINTS SURVIVE IT. The ones that do were about the property; the ones that do not were about the mechanism and should never have been criteria.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 40,
      improvements: [
        {
          action:
            "PREDICT THE DIFF *AND ITS COUNTERFACTUAL* IN THE COMMITTED PLAN. Recording `had the authorisation held: -1 source line, -4 tests` beside an observed 0/0/0 is what makes A CLEAN READING LEGIBLE RATHER THAN LUCKY, and a named falsifier firing as predicted is the check that the prediction was OF THE RIGHT THING.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN A GUARD CANNOT BE A BARRIER, RULE IT A ROT DETECTOR RATHER THAN WRITING AN UNMEETABLE CRITERION. `Staleness must be impossible` was unreachable because the working-directory set is unbounded; the achievable property is IMPOSSIBLE ON EVERY DOCUMENTED ROUTE, DETECTED ON THE REST. SECOND UNMEETABLE CRITERION IN THIS THREAD, BOTH THE PO'S: check a criterion against what an implementation COULD ACTUALLY SATISFY before accepting it.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHERE A DECISION LIVES DEPENDS ON WHETHER ITS FILE CAN CARRY COMMENTS. package.json cannot, which is why a TEST holds its reasons; bunfig.toml can, so a COMMENT satisfies the Lifetime Rule at the site the violating edit would be made -- and declining a test there is a DECISION rather than an oversight PROVIDED the comment says plainly that nothing asserts it and names the measured reason.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 39,
      improvements: [
        {
          action:
            "A ZERO-RESULT GREP IS AMBIGUOUS, AND THIS BOUNDS THE GREP ENTRY RATHER THAN EXTENDING IT. Zero means EITHER clean OR THE REFERENT WAS JUST DELETED AND LEFT A DANGLER. Measured this sprint: zero was read as clean and it was the second, and the grep run for SOMEONE ELSE'S staleness caught what this sprint had just broken. Filed beside the entry it qualifies, because `grep returned nothing` currently reads as reassurance.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "PREDICT THE expect( DIFF IN THE COMMITTED PLAN. 0/0/0 with the counts unchanged reads as CONFIRMATION rather than as a fitted report ONLY BECAUSE IT WAS WRITTEN DOWN FIRST. A one-line upgrade to the diff-not-assert standard.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A VOCABULARY ANSWERS ONE QUESTION, AND AN OBSERVATION THAT DOES NOT ANSWER THAT QUESTION DOES NOT JOIN IT, HOWEVER ADJACENT. The four standing-re-run outcomes answer WHY A RE-RUN WENT GREEN; a re-run that went as recorded but now costs a type check answers a different question and gets A NOTE AT THE SITE instead -- the S19 pattern, a comment stating what it does NOT rule out.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 38,
      improvements: [
        {
          action:
            "AMENDMENT TO THE FOUR-OUTCOME VOCABULARY: `TARGET DELIBERATELY REMOVED` IS NOT `UNCONSTRUCTIBLE`. The edit may remain perfectly writable and compile -- what was removed is THE HAZARD, not the perturbation. The four outcomes answer WHY A STANDING RE-RUN GOES GREEN, and conflating `the hazard is gone` with `I could not build the probe` is the confusion S11 exists to prevent.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PROBE'S SERIALISER IS AN INSTRUMENT AND CAN BE DEGENERATE. MEASURED: JSON.stringify with a KEY ARRAY filters NESTED keys, so two different capability objects serialised identically and a 120-order agreement probe would have reported success WHILE MEASURING NOTHING. S20 has been applied to assertions, controls and probes; extend it to the COMPARISON MECHANISM ITSELF -- and pair every such probe with a control proving it can see the thing it compares.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MEASUREMENT CAN GO STALE WITH NOBODY EDITING IT OR THE FILE IT DESCRIBES, BECAUSE A LATER SPRINT CHANGED THE WORLD IT MEASURED. NO GREP FINDS THIS -- the words are unchanged and still name real things. ONLY RE-RUNNING THE CONTROL DOES. Distinct from falsified-by-an-edit-elsewhere and from positional-falsifies-on-append, both of which a search can reach.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 36,
      improvements: [
        {
          action:
            "A COUNT CAN LIVE IN A FILENAME, AND A CONTENT GREP DOES NOT SEE ONE. Extension of the grep-the-claim's-words entry: search FILENAMES and TEST NAMES as well as file contents. Measured this sprint -- seven sites said `the eight` against a nine-name list, one in a test name and TWO IN PROBE FILENAMES.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "`NONE WEAKENED` IS DIFFED, NOT ASSERTED. It is a COVERAGE CLAIM and S13 forbids recalling one; diffing every `expect(` line across test/ and src/ is cheap and gives a direction, not an impression. MEASURED this sprint: seven added, zero removed, zero changed, and the pin's toEqual unchanged with only the object literal grown. The PO records having accepted that claim ON ASSERTION FOR A DOZEN SPRINTS.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COUNT THAT IS A MEASUREMENT RESULT CARRIES PROVENANCE AND IS NOT EDITED WITHOUT RE-MEASURING; A COUNT THAT IS A DESCRIPTION IS REPLACED BY NAMING. DIFFERENT OBJECTS THAT LOOK IDENTICAL IN PROSE, and the distinction bounds prefer-naming-to-counting so it is not over-applied to numbers that are evidence.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 35,
      improvements: [
        {
          action:
            "A STANDING RE-RUN THAT GOES GREEN MUST BE CLASSIFIED, NOT MERELY NOTED -- gone quiet, disarmed, edit-grew-a-second-half, or target-deliberately-removed. FOUR OUTCOMES, and the first two are DEFECTS while the other two are NOT. All four produce THE SAME OBSERVATION and are indistinguishable from it alone, which is the whole reason the vocabulary exists. FILED AS AN EXTENSION OF THE SPRINT-14 STANDING-RE-RUN ENTRY rather than as its own: that entry creates the practice and already carries its second rationale, and FOUR OUTCOMES ANSWERING ONE QUESTION ARE A VOCABULARY -- scattering a vocabulary defeats its purpose. Deliberately NOT filed under the cannot-be-constructed entry, which has a different trigger, actor and moment.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 30,
      improvements: [
        {
          action:
            "A HANDOFF CARRIES ITS PROVENANCE, AT BOTH ENDS. ONE RULE, THREE PAYLOADS -- wants, inherited measurements, counts. The bringer labels a want ASKED FOR or MENTIONED and a handed measurement with WHO TOOK IT, the same way a fact carries MEASURED or REASONED; the receiver DOES NOT RULE ON AN UNLABELLED ONE. Filed at both ends deliberately: the Scrum Master's first draft was a private habit, and S15 already records that A HABIT THAT LEAVES NO TRACE CANNOT BE AUDITED. The PO's half is symmetric -- they spent this whole thread demanding provenance for FACTS and never once for WANTS, and ruled on `10 of 10` and on a push fork without asking where either came from. The Sprint-25 entry does not reach this: `read the artifact` has NO REFERENT for a measurement someone else took.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 29,
      improvements: [
        {
          action:
            "GREP FOR THE CLAIM'S WORDS, NOT FOR THE PLACES COMMENTS LIVE. A falsified premise was carried by a TEST NAME -- a home nobody thinks to check and invisible to any search for comment syntax. Corollary, because it is the specific way the error survived Review: A git diff ANSWERS `did this change?`, NEVER `is this list complete?`. Those look like the same check at Review and are not.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 27,
      improvements: [
        {
          action:
            "AN EXECUTOR RE-MEASURES A NUMBER THEY WERE HANDED RATHER THAN COPYING IT. This has now caught a handed-down count in TWO CONSECUTIVE SPRINTS -- nine-not-eleven, then eleven-not-six -- and it works BECAUSE OUR RECORDS CARRY VERSION AND PATH, the S8 Sprint-24 amendment paying out. It generalises to a handback from anyone including the PO, and it reaches something no rule about the author can: A BRIEF IS THE ONE ARTIFACT WITH NO PERMANENT HOME, so an error in it is caught by the recipient re-measuring or not at all.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 26,
      improvements: [
        {
          action:
            "ASK, AT EACH RETROSPECTIVE, WHETHER THE RATE OF `NOT CONSTRUCTED` IS HONESTY OR OVER-AUTHORING. Two more this sprint -- the same-commit clause and the machine-checkable orphan rule -- and BOTH TRACE TO CLAUSES THE PO WROTE. Two readings compete: the team is being honest about what cannot be defended, or CRITERIA ARE BEING AUTHORED BEYOND WHAT CAN BE DEFENDED. The PO raised this against their own authoring and asked for it out loud rather than ruled.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CRITERION THAT NAMES A COMMIT SHAPE, A FILE LAYOUT OR ANY OTHER MECHANISM IS RESTATED AS THE PROPERTY IT PROTECTS. S13 applied to ACCEPTANCE CRITERIA rather than to plans: `same commit` was unconstructible against a git hook, while the property it meant -- no window in which a decision is deleted from custody but not yet written to its home -- was satisfiable, and was satisfied MORE VISIBLY by two commits than one would have been.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 25,
      improvements: [
        {
          action:
            "A PREMISE ABOUT AN ARTIFACT IS NOT STATED UNTIL THAT ARTIFACT HAS BEEN READ IN THE SAME SESSION. Three instances this refinement, all the PO's: the dependency graph (a hoisting that does not occur), the README extraction harness (which extracts nothing at line 180), and package-shape.test.ts's assertion strength (loosened at PBI-9 for exactly the case being ruled on). TWO OF THE THREE ARE CLAIMS ABOUT A TEST IN THIS REPOSITORY, MADE WHILE INVOKING THAT SAME TEST'S AUTHORITY. Distinct from the S13 entry, which covers premises about coverage and rule SETS; this one is about opening the file.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
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
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies. ADDED AT SPRINT 24: A MEASURED CLAIM RECORDS WHAT WOULD LET IT BE RE-RUN, NOT ONLY ITS CONCLUSION. For a DEPENDENCY that means VERSION AND PATH; for THIS REPOSITORY it means an anchor that SURVIVES EDITS, since a line number moves when prose is added above it. THE ASYMMETRY IS NAMED because it tells a writer where to be careful when pressed: a path WITHOUT a version MISLEADS -- it looks precise, points at the wrong lines after a bump, and READS AS RE-CHECKABLE WHEN IT IS NOT -- where a version without a path merely COSTS A SEARCH. Filed after THE PROJECT'S FIRST FALSE `MEASURED` LABEL: `traceReceivedNotification fires at three sites whether or not a handler exists` could not be re-checked, while its correction -- vscode-jsonrpc 9.0.1, connection.js:646-648 -- could, AND THAT DIFFERENCE IS WHY THE ERROR SURVIVED A SPRINT. The internal case belongs here too: a record cited TWO different line numbers for the SAME assertion, because prose added between runs moved it. ADDED AT SPRINT 18: A COMMENT ASSERTING CURRENT BEHAVIOUR STATES WHETHER AN ASSERTION BACKS IT -- three site comments were found claiming things nothing checked, each reddening nothing on first attempt. It targets the BIRTH defect, prose that was never checked, where the standing prose item targets DRIFT, prose that became false; and it is bounded at write time rather than requiring perpetual re-perturbation, which would be claim-extraction wearing a review practice.",
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
