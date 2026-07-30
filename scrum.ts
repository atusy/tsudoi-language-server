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
  product_backlog: [],
  completed: [
    {
      number: 44,
      pbi_id: "PBI-48",
      status: "done",
      goal: "A DEFINITION-OF-DONE CHECK STOPS READING A BUILT ARTIFACT. `tsc --noEmit` resolves `@atusy/tsudoi/*` to `./src/*.ts`, so this repository's own type check reads SOURCE and a stale `dist/` cannot reach it AT ALL -- FORECLOSED RATHER THAN DETECTED, which is why no rot detector is proposed. THE HAZARD IS MEASURED THREE TIMES ACROSS THREE SPRINTS AND IN BOTH DIRECTIONS: a false GREEN at Sprint 42, where tsc exited 0 beside 43 test failures, and a false RED at Sprint 43, where it reported TS2322 against a tuple type the tree no longer contained. WHAT MUST NOT HAPPEN IS THE REMEDY BEING INDISTINGUISHABLE FROM A TYPE CHECK THAT STOPPED READING THE EXAMPLES -- `resolves to source`, `resolves to nothing` and `examples are not in the program` produce THE SAME OBSERVATION, so criterion 1 has two arms and the second is the load-bearing one. NOTHING IS LOST, AND THAT IS A COVERAGE CLAIM RATHER THAN A CONVICTION: the installed-consumer tests own the published-surface verification and BUILD THEIR OWN TARBALL, and criterion 2 requires a CONSTRUCTED defect rather than a read premise. THE DIVISION STOPS BEING ACCIDENTAL: `tsc --noEmit` answers `does this source type-check`, and the packing tests answer `does what we publish work` -- and their overlap today is exactly what produced both false signals.",
      subtasks: [],
      impediments: [],
      decisions: [
        "BASELINE b629d23, resolved once at Planning. Planning ran as inline role-play; REVIEW WILL NOT -- the replacement Product Owner refined this PBI and will take the acceptance, as they did for Sprint 43.",
        "THE DISCRIMINATOR FOR `IS THIS A PBI OR A RETROSPECTIVE AMENDMENT`, ruled at refinement and recorded because the next borderline case should read a precedent rather than re-derive one. THREE QUESTIONS: does the remedy change a file the repository SHIPS OR BUILDS BY, or is it a practice; does it ALREADY HAVE A HOME THAT OWNS IT; can it be PERTURBED WITH A CONTROL. WHEN THEY DISAGREE THE SECOND DECIDES -- a finding with an owning home is not homeless whatever else is true of it. Sprint 36's entry CREATED the `expect(` instrument and therefore owns its bounds, which is why that defect was an amendment; this hazard's only mention DISCLAIMS BEING ITS HOME IN ITS OWN WORDS.",
        "THE VALUE FRAMING THE SCRUM MASTER DID NOT CLAIM AND COULD HAVE: the direct role is `tsudoi maintainer`, but WHAT THE BROKEN INSTRUMENT ENDANGERS IS THE CONFIG AUTHOR'S DOCUMENTED ROUTE. `examples/` IS that route. A maintainer misled by a green ships a broken documented route to an author who never runs `tsc --noEmit` at all.",
        "THE SCRUM MASTER'S PROBE HAD ONE ARM AND IT IS THE FIFTH DEGENERATE PROBE OF THIS THREAD. It established that staleness cannot REACH the check and NOT that the check still reaches the EXAMPLES -- a tsconfig that stopped type-checking examples/ passes it perfectly, because `resolves to source`, `resolves to nothing` and `examples are not in the program` produce THE SAME OBSERVATION. ARM (b) IS NOW MEASURED: with the mapping on, breaking the same name in src/types.ts exits 1 with the output naming examples/tsudoi.config.ts.",
        "A VERIFICATION WAS REFUSED AT REFINEMENT FOR BEING UNFAILABLE: a byte-diff of `dist/` across the change. tsconfig.json is not read by tsconfig.build.json, so dist/ is byte-identical BY CONSTRUCTION and nothing could violate it. Sprint 40's unmeetable-criterion entry firing in the direction nobody checks -- a criterion that CANNOT FAIL rather than one that cannot be satisfied.",
        "THE PREDICTED expect( DIFF, COMMITTED BEFORE ANY FILE IS TOUCHED, and the baseline is RE-MEASURED rather than inherited per Sprint 27: at 6a41afe the tree is clean, `bun test` is 455 pass / 0 fail with 1294 runtime expect() calls, `tsc --noEmit` is EXIT 0 and `grep -rn 'expect(' test/ src/` is 708 SOURCE LINES. THE MAPPING ITSELF IS +0/0/0 -- it changes no behaviour and no assertion. THE TWO ASSERTION SUBTASKS ADD FOUR LINES AND REMOVE AND CHANGE NONE. test/package-shape.test.ts 14 -> 16: ONE test, TWO assertions -- tsconfig.json CARRIES the `@atusy/tsudoi/*` mapping and tsconfig.build.json CARRIES NO `paths`, which is Sprint 6's absent-plus-present pair taken by ONE measurement rather than two. test/installed-specifier.test.ts 19 -> 21: TWO tests, ONE assertion each -- the stage's entries equal the pinned set, and the SAME READER returns that set PLUS `tsconfig.json` by name when a fifth path is there. So 708 -> 712 source, 1294 -> 1298 runtime, 455 -> 458 tests, all three source-scan tests running ONCE rather than per runtime. COUNTERFACTUAL, per Sprint 40: a CHANGED or REMOVED line in test/published-specifier.test.ts, test/installed-specifier.test.ts's existing tests or test/helpers/typecheck.ts would mean the mapping ESCAPED this repository's own type check into the probe and consumer routes, which criterion 3 forbids; a CHANGED line in test/package-shape.test.ts's dist-exclusion pair would mean the repo tsconfig now resolves somewhere it did not in a throwaway tree; and a ZERO diff in test/installed-specifier.test.ts would mean the stage was never pinned at all.",
        "CRITERION 3'S PREMISE IS OFF BY ONE AND THE PIN IS TAKEN OVER THE MEASURED SET, NOT THE STATED ONE. The criterion says the stage carries EXACTLY package.json, src/ and tsconfig.build.json; test/helpers/install.ts ALSO symlinks node_modules into it, at the line whose own comment says why the build needs it. MEASURED, not read. THE CRITERION IS NOT AMENDED: its property -- the stage cannot inherit tsconfig.json or a `paths` mapping -- is untouched, and the count was the mechanism, which is exactly the Sprint-43 entry's `3 versus 2` shape and its ruling that a criterion rewritten to fit the result is a fitted criterion however much stronger it reads.",
        "CRITERION 2 IS CONSTRUCTED IN THREE PIECES BECAUSE THE MAPPING ENDS TWO OVERLAPS AND THE CRITERION NAMES ONE. C1, THE NAMED CLASS AS A GENUINE DEFECT: a name added to src/types.ts BESIDE a `Bun` global, which tsconfig.json's `types` accepts and tsconfig.build.json's does not, so the build fails and the built dist/ CANNOT carry the name -- src that cannot be published. C2, THE NAMED CLASS AS PURE STALENESS: the same name with NO build-breaking half, so dist merely lags. C3, THE OVERLAP THE CRITERION DOES NOT NAME AND THE MAPPING ALSO ENDS: with `paths` present tsc NEVER CONSULTS package.json's exports map, so deleting the `./types` arm no longer reddens the DoD. All three are measured before and after, and the mapping is gated on them.",
        "THE OBSERVED DIFF AGAINST THE PREDICTION, WHICH HELD TO EVERY COLUMN: 708 -> 712 source `expect(` lines, 1294 -> 1298 runtime, 455 -> 458 tests, FOUR ADDED, NONE REMOVED, NONE CHANGED -- test/package-shape.test.ts 14 -> 16 and test/installed-specifier.test.ts 19 -> 21, exactly the two files predicted and no others. EVERY COUNTERFACTUAL STAYED SILENT AS IT SHOULD: no changed or removed line in test/published-specifier.test.ts, test/helpers/typecheck.ts or the existing installed-consumer tests, so the mapping did not escape this repository's own type check; and test/package-shape.test.ts's dist-exclusion pair, which copies the repo tsconfig into a throwaway tree and now copies the mapping with it, is unchanged in both directions.",
        "THE STANDING SPRINT-14 RE-RUN, WITH TARGET SURVIVAL STATED BEFORE COLOUR, per Sprint 43's operative half and this sprint's checklist item 4. CHOSEN: Sprint 43's P1 -- buffer the first batch, pull again, and answer with it if the stream is done. TARGET EXISTS AND THE MAPPING CANNOT REACH IT: the per-yield `$/progress` send under a token is still at src/methods.ts, the look-ahead is still refused there in the drive's own comment, and this sprint edits no source file at all. COLOUR: 436 pass / 22 fail, REPRODUCING SPRINT 43'S RECORDED 22 EXACTLY, hitting the named target at test/completion.test.ts:295 with progress count Expected 1 / Received 0, and the other eighteen carrying the 2000ms parking timeouts that are the design's own stated cost. INDEPENDENT in Sprint 14's sense: run by an executor who did not author PBI-46's increment.",
        "TWO PROSE SITES ARE FALSIFIED BY THIS INCREMENT AND ARE SURFACED RATHER THAN FIXED, per the Sprint-42 precedent that correcting prose outside the criteria is how scope grows, and reported per Sprint 14's standing item. (1) test/package-shape.test.ts's exports-map block says the `default` arm `is reached only because tsc falls through a condition whose target file is missing` and that this `is what lets tsc --noEmit stay green in a checkout that has never run a build` -- the mapping now does that job, and the TS2307 measurement in the same paragraph is no longer reproducible on this tree. The arm still serves RUNTIME resolution, so the correction is narrow rather than a deletion. (2) test/fixtures/published-specifier.ts's header says `the DoD's type check is what holds @atusy/tsudoi/types open` -- it now holds the mapping open, and what holds the exports map open is test/published-specifier.test.ts, measured at C3. Both are the Scrum Master's to rule on; neither blocks anything.",
        "PER-SPRINT REVIEW CHECKLIST. (1) CRITERION 1's ARM (b) IS THE ONE TO READ FIRST; arm (a) alone cannot tell the remedy from a check that stopped reading the examples. (2) CRITERION 2 HAS TWO ACCEPTABLE OUTCOMES and a report finding no surviving detector is a PASS that changes what ships, not a failure. (3) THE DoD IS GREEN BEFORE AND AFTER, so FOUR GREEN IS NOT EVIDENCE FOR ANY CRITERION HERE -- every one is defended by a control or an assertion, never by the suite. (4) `tsc --noEmit` BEHAVIOUR CHANGES IN THIS SPRINT, so the standing Sprint-14 re-run must state whether its target survives the mapping BEFORE stating its colour.",
        "ACCEPTED WITH FIXES BY AN INDEPENDENT PRODUCT OWNER, all four criteria met and criterion 2 on OUTCOME (i) with THREE constructions rather than one. THE FIXES ARE APPLIED: the two prose sites this sprint falsified are repaired in their own commit, the poisoned-artifact finding is homed at test/helpers/build.ts, criterion 3 stays unamended with the measured four pinned, and the `default` exports arm was routed as an open question AND THEN MEASURED.",
        "THE PO'S OWN CRITERION HAD A DEFECT AND THE EXECUTOR REPAIRED IT BEFORE RUNNING IT, which the PO recorded in the stronger form rather than as a wording refinement. Arm (b) as written -- EXIT 1 WITH THE OUTPUT NAMING examples/tsudoi.config.ts -- IS SATISFIED BY TS2307, which is the exact failure the arm exists to exclude, so the control could have passed on a tree where the mapping resolved to NOTHING. The replacement is TS2305 AT THE IN-REPO IMPORTER PLUS ZERO TS2307 ANYWHERE, with dist intact so any error at all proves resolution did not go there, measured on ALL FOUR exports arms each naming a different importer. THIRD DEFECT IN A PO-AUTHORED CRITERION IN THREE SPRINTS, ALL CAUGHT DOWNSTREAM.",
        "THE THIRD CONSTRUCTION IS THE SHARPEST RESULT AND THE CRITERION'S AUTHOR DID NOT NAME IT. With `paths`, tsc never consults the exports map -- so DELETING THE `./types` ARM is a change to the PUBLISHED SURFACE that the DoD type check is now blind to. Measured: 45 tests redden, including the criterion's own named candidate. THE MAPPING MAKES tsc BLIND TO THE EXPORTS MAP, AND THE SUITE COVERS EXACTLY THAT -- a negative control finding something its author did not anticipate.",
        "THE `default` EXPORTS ARM: THE PO'S REASONING WAS REFUTED BY MEASUREMENT, WHICH IS WHY THEY LABELLED IT UNMEASURED. They reasoned from three comments plus the mapping that the arm now has NO consumer in this repository, and routed it as an open question rather than acting on it. MEASURED BY THE SCRUM MASTER: removing every `default` arm leaves `tsc --noEmit` at EXIT 0 -- so tsc's dependence is genuinely gone -- and REDDENS FOUR TESTS, so the arm is still taken, just not by tsc. THE ARM STAYS. Recorded because a reasoned claim labelled as reasoned, routed rather than acted on, and then refuted, is the labelling rule working end to end.",
        "THE POISONED ARTIFACT, HOMED IN THREE PLACES FOR THREE DIFFERENT VIOLATING EDITS rather than scattered. THE FACT goes at test/helpers/build.ts beside the claim it corrects, in Sprint 19's preferred shape -- state what the guard does NOT rule out: TSC WRITES dist/ AND THEN EXITS NON-ZERO, so a failed build leaves dist/ BUILT FROM BROKEN SOURCE, and the throw protects the SUITE while saying nothing about what is left on disk. THE PRACTICE LESSON goes as a SECOND RATIONALE on the predict-the-diff entry, because it was caught ONLY because the prediction came first. THE MECHANISM goes to the retrospective. REMOVING dist/ BEFORE RETHROWING IS AUTHORISED AND DECLINED, with the reason stated per Sprint 40: every AUTOMATED route is covered and what stays exposed is HAND-RUN PROBE SEQUENCES -- break src, run something, revert, read dist/ -- which is what this team does all day and what it bit.",
        "CRITERION 3'S COUNT WAS OFF BY ONE AND THE CRITERION IS NOT AMENDED, the same ruling the PO gave at Sprint 43 and deliberately not made to depend on whose count was wrong. The stage receives FOUR things, not three: test/helpers/install.ts also SYMLINKS node_modules. The property -- the mapping does not reach the packing stage -- is untouched, `files` keeps node_modules out of the tarball, and the count was the mechanism. THE PO'S SELF-LESSON IS SHARPER THAN SPRINT 43'S AND IS THEIRS: their Sprint-43 remedy was to mark counts in criteria UNMEASURED, AND IT DID NOT FIRE BECAUSE THEY BELIEVED THEY HAD MEASURED IT -- they read install.ts and counted `cpSync` calls, and the fourth arrived by `symlinkSync`. READING THE ARTIFACT IS NOT ENOUGH WHEN THE THING COUNTED CAN ARRIVE BY MORE THAN ONE MECHANISM: COUNT THE CLAIM'S SUBJECT, NOT ONE MECHANISM'S CALL SITES.",
        "THE STANDING SPRINT-14 RE-RUN WAS THE FIRST TAKEN UNDER THE RULE FILED AT SPRINT 43, and it worked as intended rather than as ceremony discharged: TARGET STATED FIRST -- Sprint 43's P1 survives because the per-yield send and the refused look-ahead are still in src/methods.ts and this sprint edits no source -- THEN THE COLOUR, 22 reddened, reproducing Sprint 43's 22 exactly at the named assertion.",
        "A SIXTH WEAK PROBE, THE SCRUM MASTER'S, SELF-REPORTED. My first independent take on arm (b) renamed `Tsudoi`, which only reached fixtures importing RELATIVELY and therefore said nothing about subpath resolution; re-run with a name imported THROUGH the subpath it gives TS2305 at examples/tsudoi.config.ts with zero TS2307. THE PO PUTS THE RATE TO THE RETROSPECTIVE AS A QUESTION RATHER THAN A FINDING, and the question is the right one: SIX IN ONE THREAD MAY BE A RISING RATE OR A RISING DETECTION RATE, and the last three were each caught by the person who ran them.",
      ],
    },
    {
      number: 43,
      pbi_id: "PBI-46",
      status: "done",
      goal: "ONE SLOT, ONE MEANING. A completion handler becomes `AsyncGenerator<CompletionItem[], void, void>`: every yield is content, the return carries nothing, and NOTHING THE AUTHOR WRITES SELECTS A DELIVERY CHANNEL. The tuple is withdrawn and `CompletionResponse` and `EmptyCompletionResponse` go with it. THE CHANNEL IS THE TOKEN'S ALONE -- present means every yield leaves as `$/progress` and the response is `null`, ALWAYS, including for a stream that produced one batch; absent means aggregate and answer. THE COST IS ACCEPTED KNOWINGLY rather than discovered: a single-batch answer under a token spends a `$/progress` and a null response where one response would have done, and the look-ahead that would have saved it was considered and dropped because it makes the FIRST batch wait on the SECOND pull -- a delay that lands exactly when the first chunk is slow and streaming matters most. `isIncomplete` BECOMES UNEXPRESSIBLE AGAIN AND THAT IS THE PRICE, NOT AN OVERSIGHT: the completeness rulings written at every config stay, and the two ruled NOT COMPLETE keep saying the claim is wrong and now say why it cannot be fixed here. A SPRINT THAT REMOVED THE CAPABILITY AND THEN RELABELLED THE CONFIGS THAT NEEDED IT WOULD LEAVE NOTHING RECORDING THE LOSS.",
      subtasks: [],
      impediments: [],
      decisions: [
        "BASELINE f94bef0, resolved once at Planning. PLANNING AND REVIEW RUN AS INLINE ROLE-PLAY per the scrum-conversation fallback: the Product Owner agent was stopped by the stakeholder and cannot be resumed. RECORDED RATHER THAN GLOSSED, because a goal and an acceptance the facilitator role-played are weaker evidence than ones an independent role gave, and Sprint 42 closed the same way.",
        "FORWARD WORK RATHER THAN A RESET OF `main`, and the pre-change state is preserved on the branch `tuple-generator-shape` at 2e1c3f7. The stakeholder asked for a reset; the Scrum Master proposed this instead and it is open to reversal. THE REASON IS WHAT A RESET WOULD SINK: the commits it would discard carry measurements INDEPENDENT OF THE CODE THEY ARRIVED BESIDE -- nvim's partial-result behaviour with its control, the seventeen completeness rulings, and the finding that `tsc --noEmit` reads a stale `dist/`. All three outlive this design and the first is exactly what a future `isIncomplete` attempt starts from.",
        "PER-SPRINT REVIEW CHECKLIST. (1) THIS SPRINT REMOVES A CAPABILITY, so Review asks what records the loss rather than only what passes -- the two NOT COMPLETE verdicts unchanged and the future path present at the type. FOUR GREEN IS COMPATIBLE WITH HAVING QUIETLY RELABELLED THEM. (2) CRITERION 2'S NEGATIVE CONTROL IS THE ONE THAT MATTERS: without P1, `the token decides` is satisfied by a drive that agrees by accident. (3) `tsc --noEmit` READS `dist/`, NOT `src/`, for the examples -- run `tsc -p tsconfig.build.json` FIRST or the type check reports on yesterday's surface. Sprint 42 measured this in both directions. (4) THE PROGRESS COUNT IS PART OF EVERY ARM'S ASSERTION; a test reading only the response cannot tell the arms apart.",
        "THE BASELINE IS RE-MEASURED RATHER THAN INHERITED, per Sprint 27, and it agrees with Sprint 42's closing record: at 7bd435f the tree is clean, `bun test` is 459 pass / 0 fail with 1302 runtime expect() calls, and `grep -rn 'expect(' test/ src/` is 712 SOURCE LINES. The published surface of dist/types.d.ts is TEN NAMES -- CompletionResponse, DocumentStore, EmptyCompletionResponse, Method, MethodHandler, MethodMap, RequestContext, Tsudoi, TsudoiConfig, TsudoiConfigFactory.",
        "THE PREDICTED expect( DIFF, PER FILE AND BY THE ASSERTIONS THAT MOVE, committed before any source is touched. ONLY ONE FILE MOVES: test/completion.test.ts, 40 -> 36. REMOVED 5 -- the two assertions of `isIncomplete survives a merge untouched`, the two of `a generator's return updates isIncomplete after the stream ended` (both tests DIE, TARGET DELIBERATELY REMOVED per Sprint 38: their capability is withdrawn by construction, not undefended), and the example test's `expect(result?.isIncomplete).toBe(true)`, which asserts a claim no shape can now make. ADDED 1 -- `expect(afterYield.progressCount).toBe(1)` FIRST in the token-present-one-batch arm, which is what makes P1 redden NAMING THE PROGRESS COUNT rather than the response. CHANGED 1 -- the example test's items assertion reads off a bare array instead of `.items`. So 712 -> 708 source, 1302 -> 1294 runtime, 459 -> 455 tests (two tests times two runtimes). WHICH OF SPRINT 42'S ADDED ASSERTIONS SURVIVE: the four arms and `a client that appends sees each item exactly once` (Sprint 18 gives it the double-delivery hazard as its FIRST assertion and this sprint does not touch it). WHICH GO: the two isIncomplete tests and both list fixtures. ZERO PREDICTED IN test/cancellation.test.ts, test/cleanup.test.ts, test/protocol.test.ts, test/completion-path.test.ts, test/methods-table.test.ts, test/workspace.test.ts, test/resolve-path-stat.test.ts, test/published-artifacts.test.ts, test/readme.test.ts and test/completeness-ruling.test.ts -- every fixture yields the SAME payloads in the SAME order it used to send as answer-plus-chunks, so the wire is unchanged and only helpers, prose and one token list move. COUNTERFACTUAL, per Sprint 40: a NON-ZERO diff in test/cancellation.test.ts or test/cleanup.test.ts means the withdrawal changed what reaches the wire rather than only what the author writes; a ZERO diff in test/completion.test.ts would mean the two isIncomplete tests were kept alive by something still able to express a CompletionList, which is the withdrawal not having happened. AND THE COUNT CANNOT SEE THE SUBTASK-2 FAILURE AT ALL: quietly re-ruling the two NOT COMPLETE configs COMPLETE leaves all three completeness-scan assertions green and every number above unchanged, which is why that control is a GREP and not the suite.",
        "ZERO YIELDS WITH NO TOKEN ANSWERS `null`, NOT `[]`, AND IT IS A DECISION RATHER THAN AN INHERITANCE -- flagged for the Scrum Master to overturn rather than absorbed. Criterion 2 governs WHICH CHANNEL, and this governs WHAT VALUE, so `emitted ? collected : null` decides nothing the token decides and needs no look-ahead. THREE THINGS IN THE TREE ALREADY REQUIRE IT: the example test's second call asserts `toBeNull()` for a position the example has nothing for, and its own comment says that half is the ONLY carrier of amended standing item 6's `breaking a handler's return must redden` control -- which Sprint 42 ruled is never a PBI's to retire; test/fixtures/completion-null-only.ts is RULED `NO CLAIM IS MADE`, and `[]` is `{ isIncomplete: false, items: [] }` by the specification's own equivalence, so it would falsify a ruling subtask 2 is charged with preserving AND which the completeness scan explicitly cannot detect as wrong; and it is what the pre-tuple drive did. IT IS DEFENDED AT EXACTLY ONE SITE, MEASURED AT EXECUTION RATHER THAN REASONED FROM THE PAIR PLANNING NAMED, and the Planning text claiming a two-site pair was WRONG: dropping the request-local `yielded` flag reddens `the example config is driven end to end ...` at `expect(nothing).toBeNull()` with `Received: []` AND NOTHING ELSE -- 453 pass / 2 fail, one per runtime. The other half Planning cited cannot see the flag at all: under a TOKEN the response is `null` whatever it says, and every other helper that reads a completion spells `result ?? []`, which erases the distinction. ONE SITE IS NOT UNDEFENDED and it is not a gap to paper over with a test written for its own sake -- that site is amended standing item 6's carrier -- but `defended at one site, named` is what the record should say, and the drive says so where the deleting edit would be made.",
        "SHARED MOMENT, DECLARED PER SPRINT 5 AS MERGED AT SPRINT 13, AND IT IS WIDER THAN THE SUBTASK TEXT SAYS. The published type, the drive AND THE DRIVE'S TYPE DERIVATIONS, the fixtures and the two examples are ONE EDIT. The derivations are in it because `SlotOf<T> = T extends readonly [unknown, (infer S)?] ? S : never` collapses to `never` for a generator, so `DriveKind` would route completion AWAITED-ONCE with nothing objecting -- which is the failure src/methods.ts's own doc block describes in the opposite direction. AND ONE CONSEQUENCE IS EXPECTED AND MUST BE MEASURED RATHER THAN ASSUMED: `WireResult<'textDocument/completion'>` becomes `CompletionItem[] | null`, NARROWER than the protocol's `CompletionItem[] | CompletionList | null`, which Sprint 42 measured as TS2322 refusing the real request type. If it refuses, the stream-driven entry's `type` returns to OPEN and Sprint 42's criterion 4 -- the mis-keying hazard closed BY THE COMPILER -- reverts to NOT CONSTRUCTED per Sprint 11, reported as a SECOND capability this withdrawal costs. WIDENING THE DECLARED WIRE RESULT TO KEEP THE PIN GREEN IS REFUSED IN ADVANCE: it would declare a shape nothing can produce, which is this PBI's own defect in a different coat.",
        "TWO CAPABILITIES WERE LOST BESIDE `isIncomplete`, AND THE SECOND WAS PREDICTED AT PLANNING AND CONFIRMED BY MEASUREMENT. THE STREAM-DRIVEN ENTRY'S `type` RETURNS TO OPEN: a handler that yields `CompletionItem[]` cannot say `CompletionList`, so `WireResult` is NARROWER than the protocol's declared result and pinning refuses the real request type -- MEASURED ON THIS TREE, TS2322 at src/methods.ts naming `Type 'CompletionList' is missing the following properties from type 'CompletionItem[]'`. Sprint 42's criterion 4, the mis-keying hazard CLOSED BY THE COMPILER, therefore reverts to NOT CONSTRUCTED per Sprint 11: `HoverRequest.type` in completion's slot compiles again, and what stands between the table and a mis-keying is once more test/methods-table.test.ts's runtime `type.method` comparison. WIDENING THE DECLARED RESULT TO KEEP THE PIN WAS REFUSED AT PLANNING and stayed refused -- it would declare a shape nothing can produce. THE COMPILER CLOSED THAT HAZARD FOR EXACTLY ONE SPRINT, which is recorded at both sites so the next reader does not re-derive the pin and discover why it fails.",
        "ONE PRE-EXISTING FALSE NAME WAS SURFACED RATHER THAN FIXED, per the Sprint-42 precedent that correcting prose outside the criteria is how scope grows. `returnedItems` in six completion fixtures names a value that is NOT returned -- a completion generator's return has carried no content since Sprint 42, when these became last CHUNKS, and carries none now by construction. The rename was started and REVERTED: it touches six fixtures and five test files, it went stale one sprint before this one, and no criterion reaches it. The site says so; the decision is the Scrum Master's.",
        "P1'S BLAST RADIUS PREDICTED BEFORE IT IS RUN, per Sprint 3, because a perturbation reported only at the assertion it was aimed at hides what else it reached. P1 buffers the first batch and pulls again, answering with it when the stream is done -- so it reddens exactly the arms driving a stream of EXACTLY ONE batch UNDER A TOKEN. PREDICTED: `with a token a stream that yields once ...` (progressCount 1 -> 0, which is the assertion it must name) and `a completion handler that throws after yielding keeps the chunk it already sent` (its held first batch is never sent, and its second request's one batch becomes the response) -- FOUR tests, two per runtime. PREDICTED UNREACHED: every cancellation and cleanup fixture yields three, completion-chunks yields three, the path example batches, and completion-null-only yields NONE. NON-DEGENERACY CHECK PER SPRINT 42'S RETRO: the arm-1 fixture must yield EXACTLY ONE batch or P1 is not reached and its green records nothing.",
        "ACCEPTED BY AN INDEPENDENT PRODUCT OWNER, WHICH IS THE FIRST IN THREE SPRINTS. Sprints 41 and 42 and this sprint's Planning ran as inline role-play after the previous PO agent was stopped; a replacement was spawned at the stakeholder's authorisation and ruled on evidence they read themselves. THEY ALSO DISCLOSED THAT THE `scrum-team-product-owner` SKILL IS NOT PRESENT IN THIS ENVIRONMENT and that they ruled without it, which is worth recording beside three sprints of role-play rather than left implicit.",
        "THE SCRUM MASTER'S OWN REPORT COMMITTED THE FAILURE CRITERION 3 EXISTS TO PREVENT, and the PO caught it. I wrote `both NOT COMPLETE verdicts are still present in the two example files`, which reads `the two` as the two that remain. MEASURED: `git grep -l` at 7bd435f returns THREE -- examples/completion-path.ts, examples/tsudoi.config.ts AND test/fixtures/completion-list.ts -- and HEAD returns TWO. THE OBSERVABLE IS 3 TO 2 WITH THE THIRD ACCOUNTED FOR BY FILE: completion-list.ts was a tuple-era fixture deleted by this sprint. A shrinking list reported as a count is exactly the shape a quiet relabelling produces. The executor recorded it BY FILE and got it right; the facilitator's summary did not.",
        "THE TWO BASELINE NAMES RECONCILE, MEASURED RATHER THAN ASSUMED. This sprint's record names f94bef0 at one place and 7bd435f at another, and criterion 4's control is anchored to `the sprint's baseline`. `git diff --stat f94bef0 7bd435f -- . ':(exclude)scrum.ts'` is EMPTY, so the two names describe ONE TREE outside the dashboard and every before-grep means the same thing. Sprints 41 and 42 each closed this hole explicitly and this one did not until the PO required it.",
        "THE SPRINT-14 STANDING RE-RUN, WITH ITS TARGET STATED BEFORE ITS COLOUR, which is the discipline the PO required and is what stops a default choice from recording nothing. MOST OF SPRINT 42'S PERTURBATIONS AIMED AT THE TUPLE AND WOULD RETURN TARGET DELIBERATELY REMOVED. The one whose target SURVIVED the shape change is the cancellation check between pulling a batch and sending it -- src/methods.ts still carries it and still carries `AND IT COVERS THE FIRST BATCH TOO`, the defect Sprint 42 found by measurement. TARGET EXISTS. COLOUR: disabling that check reddens TEN tests across both runtimes -- the cleanup trio and the -32800 delay. Taken by the Scrum Master, who did not author the increment, which is the second observer Sprint 14 exists to restore.",
        "PROMOTED FROM SUBTASK 1'S NOTES: P1'S BLAST RADIUS IS THIS SPRINT'S BEST RESULT AND THE SUITE PROVED THE DESIGN'S OWN STATED REASON. Making the drive skip `$/progress` when only one batch was produced hit its target exactly -- `expect(afterYield.progressCount).toBe(1)` observed 0 -- AND REDDENED 22 RATHER THAN THE 4 PREDICTED. The mechanism was READ, NOT ASSUMED: `timed out after 2000ms waiting for 1 $/progress; saw 0`. Holding the first batch means every PARKING fixture waits on a pull behind a gate the test has not opened. THAT IS PRECISELY THE COST THE GOAL CITES FOR REFUSING THE LOOK-AHEAD, so the suite DEMONSTRATED it where the goal only ASSERTED it. The prediction reasoned about which arms the rule changes and never about when a held batch is released.",
        "PROMOTED FROM SUBTASK 1'S NOTES: THE FOURTH DEGENERATE PROBE OF THIS THREAD, self-reported. The executor's first standing-item-6 re-run perturbed the `if (!document)` arm and went GREEN because that request never reaches it; re-probed at the real site. FOUR IN ONE THREAD, EACH PRODUCING A CLEAN GREEN -- an excess object member excess-property checking could not reach, an import that failed to resolve so every name was `any`, a perturbation of a symbol nothing imported, and now an arm the request never enters. THE QUESTION THAT CATCHES THE CLASS: before reading a green, ask whether what you perturbed is REACHED by what you measured.",
        "PROMOTED FROM SUBTASK 1'S NOTES: A DEFECT IN THIS PROJECT'S OWN MEASURING INSTRUMENT. A comment QUOTING a dead assertion is counted by `grep \"expect(\"`, so the first diff read 709 where the truth was 708. THIS PROJECT MEASURES `NONE WEAKENED` WITH EXACTLY THAT GREP -- Sprint 36's improvement -- SO ANY SPRINT WHOSE COMMENTARY QUOTES AN ASSERTION INFLATES ITS OWN DIFF. The PO ruled it NOT a PBI but an amendment to that entry, since a PBI is product capability and this is our instrument. The remedy is already demonstrated in the tree: DESCRIBE AN ASSERTION, DO NOT QUOTE IT.",
        "THE MIS-KEYING HAZARD STAYS GIVEN UP, RULED. Sprint 42 closed criterion 4 BY THE COMPILER; `StreamDrivenEntry.type` reverts to open, so `HoverRequest.type` in completion's slot compiles again and the defence is once more test/methods-table.test.ts's runtime `type.method` comparison. IT HELD FOR EXACTLY ONE SPRINT. The only route back is widening the declared wire result to a shape nothing can produce, which is PBI-46's own defect in a different coat and whose removal is what PBI-46 was paid for. NAMED AT BOTH SITES so the next reader does not re-derive the pin and rediscover why it fails. PBI-47 carries an OPEN QUESTION rather than a claim: widening the yield to `CompletionItem[] | CompletionList` APPEARS to restore the wire result to the protocol's declared one, and if it holds ONE REMEDY BUYS BOTH LOSSES -- unmeasured, and refinement measures it rather than inheriting it.",
        "THE ZERO-YIELD NO-TOKEN ANSWER IS `null` AND IT IS NOW A PO RULING RATHER THAN AN UNCLAIMED INHERITANCE, with its honest label: DEFENDED AT EXACTLY ONE SITE. The argument is the specification's own equivalence -- `[]` is `{ isIncomplete: false, items: [] }`, so `[]` says THERE ARE NO CANDIDATES where `null` says THIS SERVER HAS NO ANSWER FOR THAT POSITION -- and `[]` would falsify completion-null-only.ts's `NO CLAIM IS MADE` ruling that criterion 3 charges this sprint with preserving, which the completeness scan CANNOT DETECT as wrong. NO FIFTH CRITERION WAS ADDED FOR IT: a criterion authored after the result is known cannot fail. RESIDUAL: the one site is amended standing item 6's carrier, so IF THAT CONTROL IS EVER RE-HOMED THIS DISTINCTION MUST TRAVEL WITH IT IN THE SAME COMMIT, or it is silently unhomed by an edit that looks like custody being preserved.",
        "THE EXECUTOR'S PLANNING CLAIMED A TWO-SITE DEFENCE AND MEASURED ONE, correcting scrum.ts AND the site where the deleting edit would be made. AND THEY LABELLED THEIR OWN STANDING-ITEM-6 RE-RUN WEAK on their own initiative, because they authored the edit and observed it, which Sprint 14 says makes INDEPENDENT vacuous. Both are recorded because a report that only ever confirms is not being audited.",
        "`returnedItems` IS TIDYING, RULED, AND NOT TO BE SURFACED A THIRD TIME. The name is false in six fixtures -- nothing is returned -- and it went stale at Sprint 42; the site comment carries that provenance so it does not read as always-having-been-wrong. It rides as a structural subtask in the next sprint that touches completion fixtures, or as standalone tidying between sprints. SURFACING WAS RIGHT TWICE; A THIRD SURFACING WITHOUT DOING IT WOULD BE THE RECORD SUBSTITUTING FOR THE WORK.",
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
  sprint: null,
  retrospectives: [
    {
      sprint: 44,
      improvements: [
        {
          action:
            "A FRESHLY BUILT ARTIFACT CAN BE WRONG, WHICH IS A DIFFERENT CLASS FROM A STALE ONE AND HAS THE OPPOSITE REMEDY. FIFTH INSTANCE OF THE SPRINT-35 STALENESS CLASS AND THE FIRST WHERE THE ARTIFACT IS NOT STALE BUT POISONED. MEASURED: tsc WRITES dist/ AND THEN EXITS NON-ZERO, so a failed build leaves dist/ built from broken source -- new, newly written, and wrong. `REBUILD BEFORE BELIEVING IT` IS THE REMEDY FOR STALENESS AND IS USELESS HERE, BECAUSE THE REBUILD IS WHAT PRODUCED IT, and that inversion is what earns this its own entry rather than a line on the staleness one. WHERE THE EXPOSURE ACTUALLY IS, bounded honestly so the remedy is weighted right: every AUTOMATED route is covered -- the preload throws before any test loads, `tsc --noEmit` reads source since PBI-48, `bun pm pack` builds in its own stage, and the checkout helper copies a dist/ the preload just rebuilt. WHAT REMAINS EXPOSED IS HAND-RUN PROBE SEQUENCES: break src, run something, revert, read dist/. That is what this team does all day and it is what it bit.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "READING THE ARTIFACT IS NOT ENOUGH WHEN THE THING COUNTED CAN ARRIVE BY MORE THAN ONE MECHANISM: COUNT THE CLAIM'S SUBJECT, NOT ONE MECHANISM'S CALL SITES. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN CONDUCT and it is the second miscounted premise in two sprints, both theirs. Sprint 43's remedy was to mark counts inside criteria UNMEASURED so the shell-holder knows to measure them; THAT REMEDY DID NOT FIRE HERE BECAUSE THEY BELIEVED THEY HAD MEASURED IT -- they read test/helpers/install.ts and counted `cpSync` calls, and the fourth staged path arrived by `symlinkSync`. EXTENDS SPRINT 29'S `grep the claim's words, not the places comments live` FROM PROSE TO COUNTING: the claim's subject was `what the stage receives`, and one mechanism's call sites are not that subject.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "AN OPEN QUESTION MEASURED IS WORTH MORE THAN AN OPEN QUESTION CARRIED, AND THE LABEL IS WHAT MAKES IT SAFE TO ACT ON. The PO reasoned from three comments plus the mapping that the `default` exports arm now had NO consumer in this repository, LABELLED IT REASONED-NOT-MEASURED, and routed it rather than acting on it. Measured within the hour: removing every `default` arm leaves tsc at EXIT 0 -- so the tsc dependence really is gone -- and REDDENS FOUR TESTS, so the arm is still taken. THE REASONING WAS HALF RIGHT AND THE ACTION IT WOULD HAVE JUSTIFIED WAS WRONG. THE ENTRY IS NOT `label your claims`, which this project already has: it is that A LABELLED CLAIM SHOULD BE MEASURED WHILE IT IS STILL CHEAP, because a routed question with a one-command answer becomes a standing uncertainty the moment nobody runs the command.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "ASK AT THE NEXT RETROSPECTIVE WHETHER THE WEAK-PROBE RATE IS RISING OR THE DETECTION RATE IS. SIX PROBES IN ONE THREAD HAVE BEEN WEAKER THAN THEY LOOKED, each producing A CLEAN GREEN: an excess object member excess-property checking could not reach; an import that failed to resolve so every name was `any`; a perturbation of a symbol nothing imported; an arm the request never enters; a control that could not tell `resolves to source` from `examples are not in the program`; and a rename reaching only relative importers. RAISED BY THE PRODUCT OWNER AS A QUESTION RATHER THAN A FINDING, and that framing is the point: THE LAST THREE WERE EACH CAUGHT BY THE PERSON WHO RAN THEM, which is what a rising detection rate looks like and is indistinguishable from a rising defect rate on the count alone. ASKED OUT LOUD RATHER THAN RULED, exactly as Sprint 26's over-authoring question was.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 43,
      improvements: [
        {
          action:
            "A COUNT INSIDE A CRITERION IS MARKED UNMEASURED BY WHOEVER AUTHORS IT, so the shell-holder knows it is theirs to measure BEFORE IT BINDS. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN ROLE and it is the missing half of Sprint 41's entry, which established that a factual premise inside a criterion is a claim requiring measurement but left the PO -- who has no shell -- no way to discharge it. MEASURED THIS SPRINT: criterion 3's control was written as `the two NOT COMPLETE verdicts` when the tree held THREE, and the Scrum Master's Review summary repeated the count rather than the observable. THE OBSERVABLE WAS 3 TO 2 WITH THE THIRD ACCOUNTED FOR BY FILE, which is precisely the shape a quiet relabelling produces -- so the summary of a control read like the thing that control forbids. AND THE CRITERION WAS NOT AMENDED AT REVIEW TO A FORM THE RESULT SATISFIES: its PROPERTY was met and the count was the mechanism, and rewriting it would have been a fitted criterion however much stronger it read.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A PERTURBATION RE-RUN STATES WHETHER ITS TARGET STILL EXISTS BEFORE IT STATES ITS COLOUR. Filed as the operative half of Sprint 14's standing re-run, which says to re-run ONE perturbation from the previous sprint and does not say WHICH -- and after a shape change most of them have no target left, so the default choice returns TARGET DELIBERATELY REMOVED and its green records NOTHING about the increment under review. MEASURED THIS SPRINT: nearly every Sprint-42 perturbation aimed at the tuple; the one whose target survived is the cancellation check between pulling a batch and sending it, and disabling it reddens TEN tests across both runtimes. THE DISCRIMINATING QUESTION IS `which perturbation still has a target in THIS tree`, and asking it is what turns the standing item from ceremony into a second observer.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            'BOUNDS THE SPRINT-36 `NONE WEAKENED IS DIFFED, NOT ASSERTED` ENTRY, WHICH CREATED THE INSTRUMENT THIS AMENDS RATHER THAN A SECOND ENTRY BESIDE IT. `grep "expect("` COUNTS AN ASSERTION QUOTED IN A COMMENT, so a sprint whose commentary quotes an assertion INFLATES ITS OWN DIFF -- measured here as 709 against a true 708, found and fixed twice by the executor. THE REMEDY IS ALREADY DEMONSTRATED IN THE TREE: DESCRIBE AN ASSERTION, DO NOT QUOTE IT. Filed as an amendment because a PBI is product capability and this is a defect in OUR OWN MEASUREMENT, and because the project\'s precedent at Sprints 35 and 39 is to extend the entry that owns the subject rather than scatter a second one.',
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A DESIGN WHOSE STATED REASON IS REPRODUCED BY ITS OWN TEST SUITE IS A STRONGER RECORD THAN ANY PROSE, AND THE SIGNAL ARRIVES AS AN UNPREDICTED BLAST RADIUS. MEASURED: P1 hit its named target exactly and reddened 22 where 4 were predicted, and the eighteen shared ONE mechanism READ FROM A FAILURE MESSAGE rather than assumed -- holding the first batch parks every fixture waiting behind a gate the test has not opened. THAT IS VERBATIM THE COST THE SPRINT GOAL CITES FOR REFUSING THE LOOK-AHEAD. THE GENERAL SHAPE, worth more than the instance: WHEN A PERTURBATION REDDENS FAR MORE THAN PREDICTED, READ THE MECHANISM BEFORE WIDENING THE PREDICTION -- the surplus is either the design's own rationale demonstrating itself or a coupling nobody had named, and both are findings where a corrected number is not.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 42,
      improvements: [
        {
          action:
            "A DoD CHECK CAN READ A STALE ARTIFACT, AND THIS ONE DOES. `tsc --noEmit` type-checks examples/ against `dist/types.d.ts` rather than src/, because package.json maps `@atusy/tsudoi/types` to the BUILT file; `bun test`'s preload rebuilds dist/ and TSC DOES NOT. So the two disagree exactly when the published surface has moved, which is the only time it matters. MEASURED TWICE IN ONE SPRINT, in both directions: tsc EXIT 0 beside 43 test failures on one tree, and tsc EXIT 1 on a CLEAN src/ against a leftover dist/. FILED AS A FOURTH INSTANCE OF THE SPRINT-35 STALENESS CLASS AND THE FIRST WHERE THE STALE ARTIFACT IS READ BY AN INSTRUMENT RATHER THAN BY A TEST -- the three before it were tests reading a stale dist/, which the preload now covers. THE PRACTICE UNTIL IT HAS A HOME: after any change to the published types, run `tsc -p tsconfig.build.json` BEFORE believing `tsc --noEmit`. It has no home and that is the gap: nothing protects the type check the way bunfig protects the suite.",
          timing: "immediate",
          status: "completed",
          outcome:
            "THE HOME EXISTS AND IS NAMED: `paths` in tsconfig.json at ac35327, mapping `@atusy/tsudoi/*` to ./src/*.ts, with its reason asserted in test/package-shape.test.ts because JSON cannot carry one. The hazard is FORECLOSED rather than detected -- `tsc --noEmit` no longer reads dist/ at all, measured on all four exports arms in both directions. THE ACTION TEXT IS LEFT VERBATIM because it is what was true then; this outcome is what changed. AND THE PRACTICE IS SUPERSEDED RATHER THAN FALSE, which is a distinction worth the sentence: its stated purpose -- `before BELIEVING tsc --noEmit` -- is gone, since that check no longer reads the artifact the build produces. What running `tsc -p tsconfig.build.json` STILL answers is a different question, `does src/ compile under the BUILD config`, whose types and module settings differ from the DoD's; that question is owned by bunfig.toml's preload, which builds before any test loads, and by prepack, which builds before any tarball is collected. MEASURED THIS SPRINT rather than argued: src/ carrying a `Bun` global passes `tsc --noEmit` and fails the build, and the suite reddens at test/published-specifier.test.ts naming the offending line.",
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
            "PREDICT THE DIFF *AND ITS COUNTERFACTUAL* IN THE COMMITTED PLAN. Recording `had the authorisation held: -1 source line, -4 tests` beside an observed 0/0/0 is what makes A CLEAN READING LEGIBLE RATHER THAN LUCKY, and a named falsifier firing as predicted is the check that the prediction was OF THE RIGHT THING. A SECOND RATIONALE, found at Sprint 44 and recorded because it is the answer if this practice's cost is ever questioned: IT IS WHAT CATCHES A POISONED MEASUREMENT. tsc writes dist/ and THEN exits non-zero, so a failed build leaves a FRESH, WRONG artifact -- and a probe read against it returned EXIT 0 where 1 was predicted. The mismatch was visible only because the prediction existed; without it the reading would have been taken as the remedy working.",
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
