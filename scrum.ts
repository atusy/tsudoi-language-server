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
      id: "PBI-44",
      story: {
        role: "config author",
        capability:
          "write the smallest working tsudoi.config.ts with NO parameter I must name and then ignore",
        benefit:
          "the first thing I copy out of the quickstart contains nothing I cannot explain, and tsudoi stops handing me a handle it has nowhere for me to send anything from",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "`TsudoiConfigFactory` is `() => Promise<TsudoiConfig>`, and src/types.ts gains NO new exported name to stand where the parameter was -- no `ConfigurationContext`, empty or otherwise. The published exported-name set changes by ZERO names in BOTH directions.",
          verification:
            "Compare the exported-name set of the published surface before and after; the difference must be empty. NEGATIVE CONTROL, because a set comparison against a list that is stale or empty passes no matter what: add a throwaway `export type Probe = never;` to src/types.ts and confirm the comparison REPORTS it, then remove it before commit. Without that control this criterion is satisfied by an instrument that sees nothing. The direction that matters most is ADDITION -- the empty-context design was floated and is refused here, so a check that only looks for removals cannot discriminate the thing being ruled out.",
        },
        {
          criterion:
            "Each DIRECTION of factory-arity agreement is MEASURED and then labelled at `TsudoiConfigFactory` per the Sprint-11 classification. The two directions are NOT the same question: (A) the type's arity against the arity tsudoi actually calls with, and (B) a config author's own default export against the type. DIRECTION B'S PROPERTY, STATED WITHOUT A MECHANISM BECAUSE SPRINT 26 REQUIRES IT AND THE FIRST DRAFT OF THIS CRITERION DID NOT -- it named a form the stakeholder has since replaced, while the obligation never moved: THE DOCUMENTED ROUTE BINDS THE AUTHOR'S FACTORY TO THE DECLARED FACTORY TYPE, so a shape change is a COMPILE ERROR IN THE AUTHOR'S OWN FILE. TWO CLAUSES, and the first is the one a plausible implementation gets wrong. FIRST, IT COSTS THE AUTHOR NO ANNOTATION THEY DID NOT ALREADY NEED: the factory's return type and the inline handler's `context` and `params` stay contextually typed, because src/types.ts:296-309 and README:111-112 BOTH PROMISE THAT IN WRITING and both would go quietly false while every check stayed green. SECOND, THE ROUTE-DEPENDENCE IS BY DESIGN: an author following the documented route IS caught; one who omits the binding is NOT, AND CANNOT BE, because their file is theirs and this project never sees it. THE LABEL IS `DEFENDED ON THE DOCUMENTED ROUTE, UNDEFENDED ON THE REST`, AND IT IS DELIBERATELY NOT SPRINT 40'S `IMPOSSIBLE ON EVERY DOCUMENTED ROUTE, DETECTED ON THE REST`: that ruling's bypass route still carried A ROT DETECTOR, and this one carries NOTHING. AND THE README SAYS WHAT THE BINDING BUYS rather than only showing it -- one clause, that it makes tsudoi tell you when the config shape changes -- because an unexplained token in the quickstart is the defect this PBI exists to remove, and swapping `_tsudoi` for a second inexplicable token would be a lateral move.",
          verification:
            "DIRECTION A: restore a parameter to `TsudoiConfigFactory` ALONE and run `tsc --noEmit` unpiped. Expected TS2554 at src/config.ts:39, which passes zero arguments -- a RED here is the PASS. DIRECTION B, FOUR PARTS, AND B1 AND B2 HAVE OPPOSITE EXPECTED RESULTS. THE MECHANISM IS NAMED HERE RATHER THAN IN THE CRITERION, AND WAS MEASURED TO PRODUCE THE PROPERTY: an ANNOTATED CONST, `const config: TsudoiConfigFactory = () => {...}; export default config;`. B1, THE OPT-IN HALF, MEASURED BY THE SCRUM MASTER UNPIPED IN AN ISOLATED DIRECTORY OUTSIDE THE REPOSITORY: the OLD one-parameter shape against the annotated const gives EXIT 1 and TS2322 carrying `Target signature provides too few arguments. Expected 1 or more, but got 0.` ITS POSITIVE PAIRING, TAKEN IN THE SAME SESSION so the probe is not one-directional: a zero-argument config gives EXIT 0. SUPERSEDING A MEASUREMENT RATHER THAN OVERWRITING IT, per Sprint 36: the `satisfies TsudoiConfigFactory` form was measured first and gave EXIT 1 TS1360 with THE SAME CLAUSE. That figure was CORRECT AND IS SUPERSEDED BECAUSE THE MECHANISM CHANGED, not because it was wrong -- ONLY THE DIAGNOSTIC CODE MOVED. B2, THE OPT-OUT HALF, AND ITS GREEN IS THE RESULT RATHER THAN A NON-FINDING: give ONE fixture's default export a `(tsudoi: Tsudoi)` parameter with NO binding, and all four DoD checks must be GREEN -- src/config.ts:39 reaches the type only through a CAST from `unknown`. ITS NEGATIVE CONTROL, without which that green reports nothing: perturb the SAME fixture to a shape that IS caught -- export the config OBJECT instead of a function -- and confirm it is refused with the named ConfigError, proving the loader can see the file at all. B3, THE DOCUMENTED ROUTE IS PROVEN AND NOT MERELY TAUGHT, which is what makes B1 a PERMANENT pairing under Sprint 6 rather than a probe taken once: examples/tsudoi.config.ts carries the binding and is compiled by the DoD's `tsc --noEmit` on EVERY run, per standing item 6. ITS CONTROL, because a decorative binding would compile forever and defend nothing: perturb THAT EXAMPLE to the old one-parameter shape while KEEPING the binding, and tsc must redden TS2322. B4, THE ANNOTATION COST: measured EXIT 0 with NO return-type annotation and NO `context`/`params` annotations. ITS CONTROL, because contextual typing that accepts anything is not contextual typing: a handler carrying a deliberately wrong member must still redden. THE `satisfies` SUBJECT-BINDING TRAP IS DELIBERATELY NOT CARRIED HERE, AT THE STAKEHOLDER'S RULING AND ON A MEASUREMENT THAT SUPPORTS IT: it was detected the first time and would be detected again. MEASURED IN BOTH ARITIES, unpiped -- an unwrapped expression-bodied `satisfies` gives EXIT 1 AND TS1360 whether the factory takes zero arguments or one, because the clause binds to the returned Promise and a Promise can never satisfy a function type. AN EARLIER DRAFT OF THIS VERIFICATION CLAIMED A WRONG-ARITY FACTORY WOULD PASS; THAT WAS FALSE AND IS RECORDED RATHER THAN QUIETLY DROPPED, because a criterion carrying a false expected result would have had Review comparing against a red that cannot happen. THE FORM NEVER PASSES SILENTLY, so there is nothing here that needs a permanent guard.",
        },
        {
          criterion:
            "Every property today asserted through a store THE CONFIG OBTAINED is still asserted through a store the config obtained, never through a server-side hook. Named individually because a coverage claim may not be recalled: sync.test.ts's seven tests; protocol.test.ts's post-shutdown didOpen leaves the store empty; its pre-initialize didOpen leaves the store empty; its dropped-didOpen-is-silent pair; and document-members.test.ts's positional members computed off the handed document.",
          verification:
            "For each named test, its PRE-EXISTING perturbation must still redden it. DELIBERATELY NOT `the coverage must not weaken`: that is a diffed claim under Sprint 36, and the diff here will legitimately show CHANGED lines -- `messagesReceived).toBe(2)` becomes a different number wherever a capture request is added -- so nothing could be read off it, which is the unmeetable shape this PBI was warned about. POSITIVE CONTROL, required because most of these assert `toEqual([])` and Sprint 6 forbids an unpaired absence: at least one test must show the fixture reporting a NON-EMPTY store through whatever route replaces the factory parameter. THE HANDOFF'S CLAIM THAT NO REQUEST-BASED REPLACEMENT EXISTS IS CORRECTED HERE AND IS NOT A CONSTRAINT ON THIS CRITERION: capture and read are DIFFERENT MOMENTS -- `RequestContext.tsudoi` is captured during a PRE-shutdown request and the store is read from the exit handler, so post-shutdown refusal never enters. Whatever route is chosen must be STDERR-SILENT, and protocol.test.ts's `tsudoiLines(quiet)).toEqual([])` is the existing assertion that catches a violation. IF THE ROUTE REQUIRES THESE TWO FIXTURES TO DECLARE A HANDLER, they will advertise a provider they do not advertise today -- CHECKED RATHER THAN LEFT AS A PREMISE: no test asserts anything about either fixture's capabilities, `InitializeResult` appears in sync.test.ts, protocol.test.ts and document-members.test.ts ONLY as a type parameter, and those three files are the complete set of users of the two fixtures. So the route is open; re-measure before relying on it.",
        },
        {
          criterion:
            "`Tsudoi` stays exported -- it types `RequestContext.tsudoi` -- but its JUSTIFICATION under src/types.ts's own `rule for a new name` is restated at the name, because the old one stops being true: after this change NO example and NO README snippet names `Tsudoi`, so `an example could not be written without it` is replaced by `structurally required by RequestContext`.",
          verification:
            "Grep for `Tsudoi` outside src/ and confirm no example module and no README snippet names it. NEGATIVE CONTROL, because Sprint 39 records that a zero result means EITHER clean OR the referent was just deleted: run the SAME grep BEFORE the edit and confirm it returns examples/tsudoi.config.ts:5 and README.md:93. A zero that was never shown to be non-zero is not a measurement.",
        },
        {
          criterion:
            "THE STRIP REACHES EVERY PLACE ITS ABSENCE WOULD BE INVISIBLE, and the clauses are ONE PROPERTY RATHER THAN THREE because NOT ONE OF THEM IS DETECTABLE BY ANY DEFINITION OF DONE CHECK: (a) every in-repo config declaring a factory parameter declares none; (b) NO `Tsudoi` IMPORT SURVIVES IN A FILE THAT NO LONGER NAMES THE TYPE -- stated as a property and NEVER as `drop the import`, because the two observation fixtures may LEGITIMATELY KEEP IT if the capture route declares a `Tsudoi`-typed binding to stash `context.tsudoi` in, and a criterion ordering the removal would be WRONG FOR EXACTLY THE TWO FILES THIS PBI IS HARDEST ON; and (c) every prose claim that tsudoi calls the factory WITH something is corrected wherever the claim's words live, including files no diff on a changed line reaches.",
          verification:
            "NOT CONSTRUCTED, CLASSIFIED PER SPRINT 11 BY THE DEVELOPER AND RELAYED RATHER THAN RE-DERIVED: NO PERTURBATION CAN FLIP A DoD CHECK HERE. MEASURED -- a stripped parameter leaving a dead `Tsudoi` import gives `tsc --noEmit` EXIT 0, because tsconfig.json sets `strict` and NOT `noUnusedLocals`, and `oxlint` reports `no-unused-vars` AS A WARNING AND EXITS 0. SO ALL FOUR DoD CHECKS PASS ON A HALF-STRIPPED TREE, and WHAT STAYS AT RISK is exactly that: 31 stripped parameters beside 31 orphaned imports, green. THIS CRITERION IS DEFENDED BY GREP AND NOT BY THE SUITE, and saying so is the point of the classification. THE INSTRUMENT, word-bounded because `_tsudoi` matches the UNRELATED `__tsudoiUpstreamMarker` in test/published-artifacts.test.ts and `rg -w` was VERIFIED not to match it: `rg -w` for the parameter names must return zero; `rg -w 'tsudoi: Tsudoi'` must return only tsudoi's own internals (src/server.ts, src/methods.ts, src/tsudoi.ts); and every file importing `Tsudoi` must still NAME it. NEGATIVE CONTROL FOR ALL THREE ZEROES, per Sprint 39, because a zero means EITHER clean OR the referent was never there: the SAME commands against the sprint's recorded baseline must return the sites enumerated here -- 32 config default exports THAT ARE FUNCTIONS (30 writing `_tsudoi`; snapshot-config.ts and document-members-config.ts writing `tsudoi` and USING it), the enumeration and its bound stated in full in the notes; examples/tsudoi.config.ts:5 and :14; README.md:93, :95 and :109, the last saying in words `a function tsudoi calls with a `Tsudoi``; and THREE files carrying config SOURCE STRINGS that teach the old shape and COMPILE EITHER WAY so nothing reddens -- test/installed-specifier.test.ts:17-18, test/published-specifier.test.ts:6-7, test/fixtures/published-specifier.ts:6 and :8. LEAVE test/published-specifier.test.ts:37 ALONE: it exercises the bare-specifier arm and names `Tsudoi` for a reason this change does not touch.",
        },
        {
          criterion:
            "The hazard recorded at src/cli.ts:12-24 -- that a factory-time read captures a pre-initialize value forever -- keeps a home at the site where the edit that RE-CREATES it would be made, namely `TsudoiConfigFactory`. Deleting those fourteen lines is AUTHORISED, not required.",
          verification:
            "This criterion is met by DOING NOTHING, which is what makes it meetable: not deleting requires no ruling. It can fail exactly one way -- the comment is deleted and the hazard is homeless. Grep the hazard's words across src/ after the edit; with cli.ts:12-24 gone, a zero result is the FAILURE. NEGATIVE CONTROL: the same grep before the edit returns cli.ts, proving it can see the thing whose absence it is being used to detect. THE POINT IS THE RE-ADD PATH: a parameter restored here would be read strictly before `initialize`, so the trap this project foreclosed returns with it -- and cli.ts:24's own sentence, `this project prefers foreclosing a failure to detecting it`, is the argument for the removal rather than a casualty of it.",
        },
        {
          criterion:
            "An UNPRIMED observation fixture is never reportable as a store that was read and found empty. The two fixtures acquire a PRECONDITION they do not have today -- they must serve one request before exit -- and a future edit removing that priming request must not be able to turn any `toEqual([])` assertion into a vacuous pass. THIS HAZARD IS CREATED BY THIS PBI: today's factory-time capture is unconditional and cannot fail to be primed.",
          verification:
            "A DIFFERENT AXIS FROM CRITERION 3'S POSITIVE CONTROL AND NOT COVERED BY IT, which is why it is its own criterion: that control pairs EMPTY STORE against NON-EMPTY STORE, while this one pairs UNPRIMED INSTRUMENT against PRIMED-AND-FOUND-NOTHING. A non-empty report in one test says nothing about whether the fixture was primed in the tests asserting absence. NEGATIVE CONTROL, MEASURED BY THE DEVELOPER BEFORE THIS CRITERION WAS WRITTEN rather than predicted by the PO: the same fixture with the priming request removed fails 4 and REPORTS THE UNPRIMED STATE BY NAME -- so the two outcomes do not serialise alike, which is the Sprint-9 widening applied to an instrument. The discrimination must be PERMANENT IN THE SUITE per Sprint 6, not a probe taken once at review. MECHANISM IS THE EXECUTOR'S: a sentinel value, a throw, or `readMarkedLine`'s existing absent-line throw all satisfy this, and the criterion names none of them.",
        },
      ],
      notes: [
        "EVERY `BEFORE THE EDIT` GREP IN THIS PBI MEANS THE COMMIT HEAD POINTS AT WHEN THE SPRINT STARTS, RESOLVED ONCE AT PLANNING AND WRITTEN INTO THE SPRINT RECORD -- NOT A HASH FIXED AT AUTHORING TIME AND NOT `HEAD` RESOLVED WHENEVER A CONTROL HAPPENS TO RUN. BOTH OF THOSE FAIL, IN OPPOSITE DIRECTIONS: a hash fixed at authoring goes stale (measured -- HEAD moved 9df9064 to 8992f46 to 5cf62e2 across three rounds of this one refinement), while a run-time HEAD DRIFTS WITH THE SPRINT'S OWN COMMITS, so a mid-sprint control would compare the edit against itself -- a QUIETER failure than the stale one. Sprint 8's amendment applied to a commit: a hash resolved at authoring is a version that has already moved, and `HEAD` is no version at all. AND IT REACHES FEWER CRITERIA THAN THIS NOTE FIRST CLAIMED. The PO originally wrote 5f7abdd, taken from a session-start git status and NEVER MEASURED, which is the Sprint-25 rule -- do not state a premise about an artifact until it has been read in the same session -- applied to a COMMIT rather than to a file. THE FAILURE IT WOULD HAVE CAUSED IS THE SHARPER HALF, and it is Sprint 39's entry firing on the entry that created it: 5f7abdd IS an ancestor of HEAD, so it looked safe, but 56 files moved between them and test/document-members.test.ts, test/fixtures/document-members-config.ts and some twenty other files DID NOT EXIST THERE. A before-grep run against it returns a zero meaning THE FILE WAS NOT BORN YET, which reads as THE REFERENT WAS JUST DELETED -- the exact ambiguity criterion 4 cites Sprint 39 to close. A BASELINE COMMIT IS ITSELF A CLAIM REQUIRING MEASUREMENT, not framing. WHICH CRITERIA IT BINDS, corrected because the first draft over-generalised to `six negative controls`: ONLY 1, 4, 5 AND 6 carry before-greps and need this commit. CRITERIA 2 AND 3 ARE PERTURBATIONS OF THE FINISHED INCREMENT, so their baseline is the post-implementation tree and no commit can flip them -- the PO's warning that criterion 2 direction A's expected TS2554 would invert against a different baseline WAS THEIR OWN CONFUSION and is withdrawn: that control is run after the type is already zero-parameter, so restoring a parameter to it while src/config.ts:39 passes none gives TS2554 against any tree that satisfies criterion 1.",
        "THE WORKING TREE WAS OBSERVED CHANGING MID-REFINEMENT, AND THE OBSERVATION WAS CORRECT WHILE ITS CONCLUSION IS NOW FALSE -- BOTH HALVES ARE KEPT, IN THE PAST TENSE, BECAUSE THE DETECTION IS THE DURABLE PART. MEASURED THEN, across three reads in temporal order: src/types.ts:530 read `(tsudoi: Tsudoi) => Promise<TsudoiConfig>` and later `() => Promise<TsudoiConfig>`; src/config.ts:39 read `(factory as TsudoiConfigFactory)(tsudoi)` and later `(factory as TsudoiConfigFactory)()`. A stale cache does not produce a FORWARD PROGRESSION ACROSS TWO FILES, and the PO had no shell with which to check git. RESOLVED, MEASURED BY THE SCRUM MASTER: those were the Developer's TRANSIENT PROBES, run in the same session and reverted by them before reporting. `git status --short` shows only scrum.ts modified; src/config.ts:39 passes `tsudoi`; src/types.ts:530 declares the parameter; and `bun test` RUN UNPIPED exits 0 at 444 pass / 0 fail / 1266 expect(). THE STANDING LESSON IS NOT `THE PO WAS WRONG`: a probe indistinguishable from an abandoned half-edit was detected from file reads alone, and the thing that made it detectable was RE-READING RATHER THAN TRUSTING THE FIRST READ.",
        'THE SUITE-RED CONCLUSION DRAWN FROM THAT OBSERVATION WAS FALSE OF THE COMMITTED TREE, AND IT WAS LABELLED REASONED RATHER THAN MEASURED AT THE TIME, WHICH IS THE ONLY REASON IT COULD BE RETRACTED CLEANLY. The reasoning was sound on its premise -- test/fixtures/snapshot-config.ts:14 declaring `(tsudoi: Tsudoi)` against a `factory()` call makes the parameter undefined, and the throw lands in the `process.on("exit")` handler rather than the factory, so it is NOT wrapped as a ConfigError, no TSUDOI_SNAPSHOT line is written and readMarkedLine throws by design. THE PREMISE WAS TRANSIENT; THE INFERENCE WAS NOT WRONG. Measured now at 444 pass / 0 fail. THE SECOND PROOF WAS ATTEMPTED AND DID NOT HOLD, kept because a rule that only ever confirms is not being applied: an unused `tsudoi` in loadConfig would have been a second independent red, but tsconfig.json sets only `strict` and NOT `noUnusedParameters`, so tsc does not redden on it.',
        "THE PO'S RULING ON AN OUT-OF-LOOP EDIT STANDS AS PRECEDENT THOUGH ITS OCCASION DISSOLVED, AND IT IS KEPT FOR THE NEXT TIME RATHER THAN AS A LIVE BLOCKER. Under the Sprint-16 improvement, which says in its own words that it applies to ANY change and not only sprint work: A PARTIAL, RED, UNROUTED EDIT IS NOT AN INCREMENT. It is EITHER committed and green -- the Sprint-2 attachable spike, where the plan says what to CHANGE about it rather than re-deriving it -- OR reverted so the sprint starts from a recorded state. What it may NOT be is left uncommitted while criteria are authored against it, because then a negative control names a state nobody wrote down. SATISFIED HERE BY THE REVERT BRANCH, taken by the Developer of their own accord before reporting. SPRINT START IS NO LONGER BLOCKED BY THIS.",
        "THE STAKEHOLDER'S THREE RULINGS, THEIR OWN WORDS, HANDED WITH PROVENANCE PER SPRINT 30: not released so backward compatibility does not weigh; do not be pulled around by test fixtures, what matters is value to the USER; and adding what is not there later is easy while removing what exists is hard. THE THIRD ONE DOES NOT DECIDE THIS BY ITSELF and is the one most easily misread: it is a caution about FUTURE removal cost, so combined with the second it says the window for this removal is OPEN NOW AND CLOSES AT RELEASE. It was invoked against introducing an empty context, and criterion 1 carries that refusal.",
        "THE USER-VALUE CASE IS STRONGER THAN THE HANDOFF CARRIED, AND IT IS ONE NUMBER: the handoff named TWO user-facing documents writing `_tsudoi`. MEASURED HERE: 30 of the 32 configs in this repository never use the parameter -- 29 fixtures plus examples/tsudoi.config.ts and the README quickstart write it underscore-prefixed -- and EXACTLY TWO use it, both of them observation fixtures with no user behind them. The underscore is not a documentation quirk; it is this repository's near-universal convention for its own configs.",
        "WHAT THE REMOVAL COSTS A CONFIG AUTHOR, recorded because it is the strongest case against and would otherwise be rediscovered: after this change an author who writes `(tsudoi: Tsudoi) => ...` from memory gets a parameter that is silently `undefined` AND NO DIAGNOSTIC AT ALL, because nothing type-checks their file against `TsudoiConfigFactory`. That is criterion 2's direction B, and it is why criterion 5's README correction is load-bearing rather than tidying: the quickstart is the only thing teaching the shape.",
        "THE RE-ADD TRIGGER, EVIDENCE-SHAPED SO IT IS CHECKED RATHER THAN RE-ARGUED: src/types.ts:238 says a subscribe/unsubscribe API `will expose` -- i.e. does not exist -- and a config subscribes ONCE AT LOAD rather than per request, so the factory is exactly where that handle would go. The day that API lands, a parameter here is warranted. Until then out-of-request store access is OBSERVABLE BUT INACTIONABLE: tsudoi hands the config no connection, no diagnostics push, no `window/showMessage`, and stderr is the only outlet -- which is what the two observation fixtures use. Adding a parameter to a callback type is NON-BREAKING, so this door is deferred rather than welded.",
        "`ConfigurationContext` WAS REFUSED ON TWO GROUNDS, the second of which is independent of the first: an empty exported name in src/types.ts is itself an `あるもの` that is hard to remove and delivers nothing, AND `Configuration` COLLIDES WITH LSP'S OWN TERM for client settings (`workspace/configuration`). If a context type is ever warranted, it may not carry that name.",
        "LINE NUMBERS IN THE HANDOFF WERE WRONG AND WERE RE-MEASURED PER SPRINT 27, which is the entry working rather than a complaint: `src/types.ts:107` for the factory type is actually :530, `src/types.ts:56` for `RequestContext.tsudoi` is actually :453, and `sync.test.ts:34` is a COMMENT above the test at :40 whose title differs from the one quoted. The handoff also presented the fixture dependency as TWO sites and ONE fixture; it is twelve session sites across TWO fixtures, which is what criterion 3 had to be sized against.",
        "THE PREDICTED expect( DIFF MOVES WITH CRITERION 7 AND MUST BE RESTATED IN THE PLAN, per the Sprint-39 and Sprint-40 improvements requiring the diff AND ITS COUNTERFACTUAL to be written down FIRST. The Developer predicted 0 ADDED / 0 REMOVED / 7 CHANGED, every change a `toBe(2)` becoming `toBe(3)` as a priming request joins each session -- measured against a criterion set that did NOT yet contain criterion 7. That criterion requires a PERMANENT discrimination in the suite, so the added count is no longer expected to be zero. THE COUNTERFACTUAL TO RECORD BESIDE IT: had criterion 7 not been added, 0/0/7 -- which is what makes the new added lines legible as THIS CRITERION'S COST rather than as scope drift.",
        "`noUnusedLocals` WAS CONSIDERED AS THE DETECTOR AND DECLINED INSIDE THIS PBI, recorded so the next reader does not re-derive it. It WOULD make criterion 5's clause (b) visible to the Definition of Done, which is a real gain over a grep. IT IS DECLINED BECAUSE ITS BLAST RADIUS ACROSS 31 FIXTURES, src/ AND test/ IS UNMEASURED -- and adopting an unmeasured compiler flag inside a PBI about a type signature is precisely how scope grows. THE TRIGGER FOR REVISITING IS EVIDENCE-SHAPED so it is checked rather than re-argued: someone measures the flag against the tree and reports what it reddens. Until then clause (b) is defended by grep, which the classification in criterion 5 states plainly.",
        "MEASURED AT BASELINE c6cdc1a: 33 files in test/fixtures and examples/ default-export something; 32 of those default-export a FUNCTION TAKING THE PARAMETER, of which 30 write it `_tsudoi` and never use it and exactly TWO -- snapshot-config.ts and document-members-config.ts -- write it `tsudoi` and USE it. README.md:95 carries a 33rd instance IN PROSE. THE ONE NON-MATCHER IS NOT AN EXCEPTION BUT THE BOUND ITSELF: test/fixtures/default-not-a-function.ts default-exports an OBJECT deliberately, because it is the fixture proving a non-function default export is refused by name, so THE PROPERTY IS `every config whose default export is a function`, and a strip that reached `every config` would DESTROY THE THING THAT FIXTURE EXISTS TO TEST. AN EARLIER COUNT OF 31/29 IS RECORDED AS SUPERSEDED RATHER THAN QUIETLY REPLACED: it was taken while an uncommitted edit by nobody had already stripped examples/tsudoi.config.ts, so THE FILE DID NOT MATCH ITS OWN PATTERN and the number moved when the edit was reverted.",
        "THE STAKEHOLDER'S `satisfies` DIRECTIVE ENTERED AS AN AMENDMENT RATHER THAN A FOLLOW-ON PBI, ON THE SAME PRINCIPLE THAT PUT PRIMEDNESS IN CRITERION 7: A HAZARD A PBI CREATES IS CLOSED INSIDE THAT PBI. `satisfies TsudoiConfigFactory` CATCHES NOTHING TODAY -- the type takes a parameter and the configs supply one, so it is a no-op on every current config, and TS1360 fires ONLY on the old shape against the new zero-argument type. So this is the mitigation for the defect note 7 already records as having NO DIAGNOSTIC AT ALL, not new scope arriving late. THE EFFICIENCY ARGUMENT -- the README lines are being rewritten anyway -- IS TRUE AND WAS NOT THE REASON, because `we are in there anyway` is how scope grows. NOTHING IS ADDED TO THE PUBLISHED SURFACE AND CRITERION 1 IS UNTHREATENED: `TsudoiConfigFactory` is already exported at src/types.ts:530 and already reachable at `@atusy/tsudoi/types`, the module the README and examples already import from, so the directive AS LITERALLY WORDED WAS ALREADY SATISFIED and the valuable half was that NOTHING TAUGHT IT. THE COST ACCEPTED WITH EYES OPEN: the quickstart gains a token, against a PBI whose whole user story is that the smallest config contains nothing unexplainable. It is worth it because `satisfies` IS EXPLAINABLE IN ONE CLAUSE while `_tsudoi` was not -- an underscore meaning `we hand you this, ignore it` -- so one token that earns its place replaces one that never did.",
        "THE PO REQUIRED THE `satisfies`-VERSUS-CONTEXTUAL-TYPING INTERACTION TO BE MEASURED BEFORE THE EXAMPLE LANDS, AND IT IS NOW MEASURED BY THE SCRUM MASTER AT BASELINE c6cdc1a, ALL RUNS UNPIPED. THE RISK WAS REAL AND NAMED BY THEM WITHOUT A SHELL: src/types.ts:296-309 and README:111-112 both promise an INLINE handler needs no annotations, with test/fixtures/formatting-offsets.ts as DELIBERATELY UNANNOTATED standing evidence, so a `satisfies` that changed the inference would have made two documents false while every check stayed green. RESULT: IT DOES NOT. That fixture converted to a zero-argument default export carrying `satisfies TsudoiConfigFactory`, handler still unannotated, type-checks with NO ERROR AT THE FIXTURE, and the whole tree gives `tsc --noEmit` EXIT 0 once src/config.ts:39 stops passing an argument. THE FIRST CONTROL WAS DEGENERATE AND IS RECORDED RATHER THAN QUIETLY REPLACED, because it is the Sprint-9 widening firing on a control this session built: an EXCESS member added to the returned literal reddened NOTHING -- excess-property checking does not reach an object literal returned from a `.map` callback -- so a green there would have `proved` contextual typing intact while measuring nothing at all. THE REDESIGNED CONTROL USES A WRONG-TYPED MEMBER AND WAS RUN IN BOTH DIRECTIONS: with `satisfies` and without it, tsc gives THE IDENTICAL TS2322 AT THE IDENTICAL LINE, and the error text ITSELF NAMES `(context: RequestContext, params: DocumentFormattingParams)` -- the handler's parameters got their contextual types in BOTH cases, which is the promise stated positively rather than merely not-falsified. THE PAIR IS WHAT MAKES IT A MEASUREMENT: the with-satisfies run alone could not distinguish `inference preserved` from `control cannot fire`.",
      ],
    },
  ],

  completed: [
    {
      number: 40,
      pbi_id: "PBI-35",
      goal: "THE GATE RAN FIRST AND IT WITHDREW THE AUTHORISATION. `bun test` acquires an automatic develop-time build -- bunfig.toml's `[test] preload` runs tsc -p tsconfig.build.json before any test file is loaded -- so criterion 3 is met and a fresh clone is green with no build step. BUT THE BUILD IS SKIPPABLE, MEASURED: bun discovers bunfig.toml relative to the CURRENT WORKING DIRECTORY and does not search upward, so `cd test && bun test` RUNS all 444 tests with no build at all and 442 of them PASS -- `runs 444` is not `444 green`, and the two reds are the point. Criterion 1's discriminator is `is the build skippable`, not `is the documented route safe`, so STALENESS REMAINS REACHABLE, THE DETECTOR WAS LOAD-BEARING, THE DELETION IN CRITERION 2 IS WITHDRAWN BY ITS OWN TERMS, AND PBI-35 RETURNS TO THE PRODUCT OWNER. What still ships is the build, because criterion 3 stands alone and NOT DELETING SOMETHING REQUIRES NO RULING. The prose that goes false is corrected wherever the claim's words live -- including a clause in the test being KEPT, which no diff on the deleted-line side would reach.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "A dist/-LESS TREE NOW GOES FROM 47 fail / 362 pass TO 444 PASS WITH NO BUILD COMMAND ANYWHERE, via bunfig.toml's [test] preload. Criterion 3 met on measurement.",
        "THE GATE WITHDREW THE PO'S OWN AUTHORISATION AND THE DETECTOR WAS NOT DELETED. MEASURED: `bun test`, `bun test <path>`, `bun test <filter>` and `bun test -t <name>` ALL preload ONCE, so THE SINGLE-FILE BYPASS THE PBI NAMED DOES NOT EXIST -- but bun resolves bunfig.toml against THE CURRENT WORKING DIRECTORY AND NEVER SEARCHES UPWARD, so `cd test && bun test` RUNS ALL 444 TESTS WITH NO BUILD. Reproduced independently by the Scrum Master. The condition was `is it SKIPPABLE`, not `is the documented route safe`.",
        "CRITERION 1 WAS UNMEETABLE AND THE PO OWNS IT -- THE SECOND SUCH IN THIS THREAD, BOTH THEIRS. `Staleness must be impossible` is UNREACHABLE because the working-directory set is UNBOUNDED. RE-RULED TO THE ACHIEVABLE PROPERTY THE INCREMENT ACTUALLY DELIVERS: STALENESS IS IMPOSSIBLE ON EVERY DOCUMENTED ROUTE, AND DETECTED ON THE REST -- this repository's own idiom, already load-bearing at the oxlint factory ban and the Bun guard, NEITHER OF WHICH PRETENDS TO BE A BARRIER.",
        "SO THE DETECTOR IS NOT DELETED, IT IS PROMOTED: the authorisation is PERMANENTLY WITHDRAWN and the detector becomes THE PERMANENT COMPLEMENT TO THE BUILD. PBI-35 IS THEREFORE COMPLETE, NOT RETURNED: its criterion said the detector's fate is DECIDED IN THIS PBI, and THE GATE DECIDED IT -- satisfied by the withdrawal, not violated by it.",
        "THE ATTRIBUTION CONTROL IS THE BEST THING IN THE REPORT, and the PO says they would not have thought to ask for it: on the bypass route a stale dist/ gives 442/2, and ONE OF THOSE TWO REDDENS IDENTICALLY WITH THE BUILD WORKING because it detects A NEW PUBLISHED NAME rather than staleness. So the detector is THE ONLY STALENESS-SPECIFIC FAILURE ON THAT ROUTE. WITHOUT IT THE PAIR WOULD HAVE BEEN REPORTED AS REDUNDANT ON EVIDENCE THAT SAYS NOTHING ABOUT STALENESS, and the deletion would have looked safe.",
        "THE GATE'S CONTROL WAS TAKEN FIRST, which is what stops a positive being satisfied by a dist/ that MERELY HAPPENED TO BE CURRENT: bunfig aside, same edit, probe FAILS; bunfig present, same edit, probe PASSES; re-staled between every form.",
        "THE PRELOAD ASSERTION WAS DECLINED, UPHELD ON A BETTER ARGUMENT THAN `it restates the mechanism`: package.json CANNOT CARRY COMMENTS, which is why package-shape.test.ts exists and holds reasons; bunfig.toml CAN, so the Lifetime Rule is satisfiable AT THE SITE THE VIOLATING EDIT WOULD BE MADE. SAME RULE, DIFFERENT FILE CAPABILITY, OPPOSITE REMEDY. Conditions: the comment says plainly NOTHING ASSERTS IT, and names the measured reason -- deleting the preload leaves 444 GREEN on any tree already built once, WHICH IS EVERY TREE AFTER A DEVELOPER'S FIRST RUN.",
        "SECOND INSTANCE OF THE SPRINT-38 CLASS: 30 fail / 299 pass became 47 fail / 362 pass with 35 TESTS NOT RUNNING AT ALL -- a measurement whose world GREW BY A HUNDRED TESTS underneath it. CARRYING BOTH PROVENANCES RATHER THAN CORRECTING IN PLACE IS BETTER THAN EITHER, because THE CHANGE IN THE NUMBER IS ITSELF THE INFORMATION.",
        "THIRD INSTANCE OF THE SPRINT-35 CLASS: package-shape.test.ts's `built by nothing the suite runs` FALSIFIED BY A FILE THAT DOES NOT MENTION IT. Three instances now, ALL found by grepping the claim's words and NONE by any diff.",
        "THE expect( DIFF WAS PREDICTED WITH ITS COUNTERFACTUAL BESIDE IT -- 0/0/0 observed, and `had the authorisation held: -1 source line, -4 tests` recorded -- WHICH MAKES A CLEAN READING LEGIBLE RATHER THAN LUCKY.",
      ],
    },
    {
      number: 39,
      pbi_id: "PBI-42",
      goal: "THE FIXTURE'S COVERAGE BECOMES A COMPILE-TIME PROPERTY, AND THE ANSWERS STAY UNDEFENDED ON PURPOSE. test/fixtures/all-methods.ts annotates its handler literal over `Method` so a method `MethodMap` declares and this fixture omits IS TS2741 -- the same error `requestEntries` already produces, no assertions, growing with the table by construction. THE TITLE IS NOT THE CRITERION: `defend every handler` would be FIVE NEAR-IDENTICAL TESTS that resist legitimate fixture changes without defending a requirement, and the PO ruled it out; the risk is not a wrong answer but THE FIXTURE SILENTLY STOPPING SHORT OF A METHOD while tests that believe they exercise five exercise four and stay green. So criterion 2 is A RULING TO RECORD RATHER THAN WORK TO DO, and it goes at the fixture BECAUSE OTHERWISE THE NEXT PERSON MEASURES THE SAME ZERO AND FILES THE SAME PBI.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE WHOLE INCREMENT IS ONE CLAUSE -- `satisfies { [M in Method]: MethodHandler<M> }` -- plus two names on an existing import and prose. 444 green and 1266 expect() calls UNCHANGED, which is what this criterion's correct answer looks like: the property is one THE COMPILER checks.",
        "THE ROOT CAUSE IS THE MOST DURABLE THING HERE: src/types.ts declares `methods?: Partial<...>`, WHICH IS CORRECT FOR A CONFIG AUTHOR -- and that is exactly why THE ONE CONFIG THAT MUST SERVE EVERY METHOD WAS ENFORCING NOTHING. A DEFECT THAT FOLLOWS FROM A CORRECT DECISION ELSEWHERE IS THE HARDEST KIND TO FIND BY READING, and recording it is what stops someone `fixing` the published type later.",
        "BOTH HALVES RE-RUN AGAINST THE SHIPPED FORM, PLUS A PRE-EDIT CONTROL: a probe method in MethodMap AND requestEntries with no fixture handler gives TS2741 REPORTED AT THE FIXTURE AND NAMING THE METHOD; adding the handler gives exit 0; and the same probe against the UN-ANNOTATED fixture left tsc at 0 WITH NO ERRORS ANYWHERE -- THE PROPERTY GENUINELY DID NOT EXIST. The control is what makes half 1 mean something.",
        "A FIFTH DEGENERACY LOCATION, FOUND UNPROMPTED: THE TYPE ANNOTATION ITSELF. Record<Method, MethodHandler<Method>> would deliver exhaustiveness WHILE ACCEPTING HOVER'S HANDLER IN COMPLETION'S SLOT -- presence without per-method typing, which is Sprint 32's mis-keyed-entry hazard RE-INTRODUCED THROUGH THE BACK DOOR. Caught by applying the Sprint-38 serialiser standard TO A TYPE RATHER THAN TO DATA. The locations are now assertion, control, probe, serialiser, ANNOTATION.",
        "NOT A FIFTH OUTCOME, and the executor's reading is confirmed: the annotation makes Sprint 35's recorded perturbations FAIL TO COMPILE, but those re-runs went AS RECORDED because neither runtime type-checks. THE FOUR-OUTCOME VOCABULARY ANSWERS ONE QUESTION -- why did a standing re-run go GREEN -- and that question is never triggered here. ONLY THE PRICE MOVED: an edit that cost nothing now costs a DoD check. THE PRINCIPLE, worth stating because it will be needed again: A VOCABULARY ANSWERS ONE QUESTION, AND AN OBSERVATION THAT DOES NOT ANSWER THAT QUESTION DOES NOT JOIN IT, HOWEVER ADJACENT. RE-MEASURING BEFORE WRITING IT DOWN is what made the ruling available at all.",
        "THE FORM WAS CHOSEN BY MEASUREMENT WITH THE CRITERION AS TIEBREAK: a hoisted const and the inline satisfies produce THE IDENTICAL TS2741 AT THE IDENTICAL SITE, so `one line` decided it. THE CORRECT USE OF A CRITERION -- to break a tie that measurement declared even, NOT to substitute for measuring.",
        "TWO LAPSES, BOTH SELF-CAUGHT. The edit removed the PBI-42 mention and left a paragraph saying `the shape this PBI exists to retire` WITH NO ANTECEDENT; their own grep returned zero hits and they READ ZERO AS CLEAN rather than as THE REFERENT WAS JUST DELETED. And a staleness note first GENERALISED FOUR BULLETS FROM ONE RUN -- the tsc half follows from the mapped type, but `unchanged` is a RUNTIME claim, so the only bullet whose recorded result is not green was RE-RUN rather than reasoned.",
        "DECLINED WITH THE COST NAMED: no five-keys test, because A COUNT-AS-DESCRIPTION WOULD PASS ON A TABLE SHRUNK TO FIVE WRONG METHODS -- the Sprint-36 distinction applied BY SOMEONE ELSE to reject a test the PO might have accepted. Four exported answer constants that nothing imports were REPORTED RATHER THAN TIDIED: tidying while reporting is how scope quietly grows.",
        "THE PBI WAS SMALLER THAN ITS TITLE AND IS REPORTED THAT WAY RATHER THAN PADDED. A one-clause increment that establishes a COMPILE-TIME property is a good outcome, not a thin one.",
      ],
    },
    {
      number: 38,
      pbi_id: "PBI-43",
      goal: "THE HAZARD STOPS EXISTING RATHER THAN STAYING OBSERVABLE: `textDocument/completion`'s contributor MERGES into `completionProvider` instead of ASSIGNING a fresh object over it, so a contributor writing into a key another method owns no longer depends on being declared below that method's entry. CRITERION 1 IS THE PREMISE AND WAS MEASURED BEFORE ANY LINE WAS WRITTEN, with its own negative control. THE DELIVERABLE IS THAT SPRINT 34'S P1 GOES GREEN, classified in advance as TARGET DELIBERATELY REMOVED. NO NEW TEST SHIPS AND NO EXPECTED VALUE MOVES, so the increment is defended by perturbation rather than by an added assertion, and the prose that goes false is corrected WHEREVER THE CLAIM'S WORDS LIVE.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "444 green, 1266 expect() calls, unchanged. The ordering hazard is REMOVED rather than asserted about.",
        "CRITERION 3 WAS UNMEETABLE AND THE PO OWNS IT: they had ALREADY RECORDED at Sprint 34, IN THEIR OWN VERDICT, that P2 leaves the suite green BECAUSE COMPLETION CONTRIBUTES {} SO PRESERVING AND REPLACING ARE INDISTINGUISHABLE -- and then wrote a criterion requiring the merge to retire that debit. THE DEFENSIVE HALF CLOSED; THE UNDEFENDED HALF IS NOT CLOSABLE while completion contributes no key of its own, AND NEVER WAS. NO DEFECT IN THE INCREMENT; A DEFECT IN THE CRITERION. The executor met what was achievable, stated precisely what was not, and PREDICTED THE IMPOSSIBILITY IN THE COMMITTED PLAN so the report could not be fitted afterwards.",
        "RESIDUAL GIVEN AN EVIDENCE-SHAPED TRIGGER: the day completion contributes a key OF ITS OWN, P2 becomes constructible and the preservation becomes defended. Until then it is named at the type, and THE INDEX COMPARISON STAYS REFUSED -- now on stronger ground, since a merge makes ordering irrelevant and an index check would RESTATE A MECHANISM THAT NO LONGER MATTERS.",
        "`TARGET DELIBERATELY REMOVED` IS NOT `UNCONSTRUCTIBLE`, and the executor's refusal to write the latter SHARPENS THE SPRINT-35 VOCABULARY: THE EDIT REMAINS PERFECTLY WRITABLE AND COMPILES -- WHAT WAS REMOVED IS THE HAZARD, NOT THE PERTURBATION. The four outcomes were about WHY A STANDING RE-RUN GOES GREEN, and conflating `the hazard is gone` with `I could not build the probe` is exactly the confusion S11 was filed to prevent.",
        "P1-CONTROL IS WHAT MAKES P1'S GREEN MEAN ANYTHING: the same swap with the assignment restored reddens 4 on both runtimes. A GREEN WITH NO PAIRED OBSERVATION IS NOT A RESULT.",
        "CRITERION 1 -- THE PO'S HEDGE -- EARNED ITS PLACE, AND THE NEGATIVE CONTROL IS WHY. Measured over ALL 32 CONFIGS the five methods can form and ALL 120 ORDERS the contributors can run in: 0 of 32 disagree. THAT MEANS NOTHING WITHOUT the control taken BEFORE the merge existed -- 8 OF 32 DISAGREE, EXACTLY THE CONFIGS SUPPLYING BOTH. Taken before, not reconstructed after.",
        "THE DEGENERACY WAS IN THE INSTRUMENT, NOT THE RESULT, and was caught BEFORE IT RECORDED ANYTHING: JSON.stringify with a KEY ARRAY filters nested keys, so {resolveProvider: true} and {} SERIALISED IDENTICALLY -- the probe would have reported agreement across 120 orders WHILE MEASURING NOTHING. S20 has been applied to assertions, to controls and to probes; THIS IS THE FIRST TIME IT HAS HAD TO BE APPLIED TO A SERIALISER.",
        "A MEASUREMENT CAN GO STALE WITH NOBODY EDITING IT OR THE FILE IT DESCRIBES: `reddens ALONE` was TRUE at Sprint 34 and became false when SPRINT 37 GAVE THE DEMO CONFIG A RESOLVE HANDLER -- a later sprint changed the world the measurement described. NO GREP FINDS THIS. Only re-running the control does. Fifth distinct way the standing re-run has earned its keep, and THE FIRST WHERE THE TARGET WAS A MEASUREMENT RATHER THAN A CONTROL. Re-measured at four tests on both runtimes.",
        "THE SHARED HELPER WAS REFUSED WITH THE COST MEASURED RATHER THAN ARGUED: dropping its own spread leaves the suite green, SO IT BUYS A PHRASING RATHER THAN A PROPERTY.",
        "expect( DIFF: 0 ADDED, 0 REMOVED, 0 CHANGED, count unchanged at 1266 -- the cleanest possible reading of the Sprint-36 standard. Prose corrected WHERE THE CLAIM'S WORDS LIVE, including two TEST files falsified by a src EDIT TOUCHING NO LINE IN THEM; titles and filenames searched. Sprints 34 and 37's decisions LEFT ALONE, because those are past-tense measurements carrying provenance.",
        "A LAPSE DISCLOSED RATHER THAN QUIETLY UNDONE: the executor first CLOSED THE SPRINT ITSELF and deleted PBI-43 from the backlog. Reverted in its own commit and recorded as a decision. THE HARM THE EXECUTOR NAMED IS SHARPER THAN THE ROLE VIOLATION: deleting the PBI would have left WHAT EXECUTION STILL OWED only in git history -- the Lifetime Rule again, and THE THIRD TIME IN THIS THREAD IT HAS CAUGHT SOMETHING ON ITS OWN AUTHOR'S SIDE.",
      ],
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
    number: 41,
    pbi_id: "PBI-44",
    goal: "THE CONFIG FACTORY TAKES NOTHING. `TsudoiConfigFactory` becomes `() => Promise<TsudoiConfig>`, every config in test/fixtures and examples/ WHOSE DEFAULT EXPORT IS A FUNCTION stops declaring a parameter, and NO NEW EXPORTED NAME STANDS WHERE IT WAS -- the empty-context design is refused, because an empty name in the published surface is itself an `あるもの` that is hard to remove, and `Configuration` collides with LSP's own term for client settings. THE COUNTS ARE DELIBERATELY NOT IN THIS GOAL: they are a measurement with provenance, they live in the notes beside the before-grep that checks them, and this sprint edits every file they count. ALL BUT TWO OF THOSE CONFIGS NEVER USED THE PARAMETER -- they write it underscore-prefixed, which is this repository's own near-universal convention for its own configs, and THAT is the user-value argument rather than any aesthetic one. THE TWO THAT DID USE IT MOVE TO `RequestContext.tsudoi`, captured during a request and read at exit; MEASURED WITH ITS NEGATIVE CONTROL TAKEN FIRST rather than promised, and it preserves every absence assertion AT FULL STRENGTH INCLUDING THE TWO NO REQUEST CAN REACH -- post-shutdown and pre-initialize -- because CAPTURE AND READ ARE DIFFERENT MOMENTS, which is the premise the brief handed the team and the Developer refuted. THE SPRINT ALSO CLOSES TWO HAZARDS IT CREATES, WHICH IS THE PRINCIPLE THAT DECIDED BOTH: primedness becomes a precondition those two fixtures do not have today, so an UNPRIMED instrument must never be reportable as a store that was read and found empty; and an author writing the OLD shape from memory would get `undefined` with no diagnostic, so THE DOCUMENTED ROUTE CARRIES `satisfies TsudoiConfigFactory` -- at the stakeholder's direction, adding NOTHING to the published surface because that type is already exported and already reachable. THE LABEL FOR IT IS DELIBERATELY WEAK: DEFENDED ON THE DOCUMENTED ROUTE, UNDEFENDED ON THE REST, and NOT Sprint 40's `detected on the rest`, because that ruling's bypass route carried a rot detector and this one carries nothing. AND ONE CRITERION IS DEFENDED BY GREP RATHER THAN BY THE SUITE, measured: all four DoD checks pass on a half-stripped tree, so FOUR GREEN IS NOT EVIDENCE FOR IT. The hazard src/cli.ts records -- that a factory-time read captures a pre-initialize value forever -- stops being DEFERRED and becomes FORECLOSED, which is that file's own stated preference; deleting its fourteen lines is authorised, not required, and the hazard keeps a home either way. THE WINDOW IS OPEN ONLY BECAUSE THE PACKAGE IS UNPUBLISHED.",
    status: "in_progress",
    subtasks: [
      {
        test: "NO NEW TEST. BORN-GREEN, DECLARED IN ADVANCE AND MEASURED RATHER THAN REASONED: nothing annotates a config against `TsudoiConfigFactory` -- src/config.ts:39 reaches the type through a CAST from `unknown` -- and `() => R` is assignable where `(t: T) => R` is expected, so a stripped config compiles and runs UNDER THE UNCHANGED TYPE. PERTURBATION: NOT CONSTRUCTED, classified per Sprint 11 rather than defaulted to the pessimistic reading. oxlint EXITS 0 on a leftover import, so completeness here is UNDEFENDED BY THE DoD and what stays at risk is a half-stripped tree that is green. Mitigation is a word-bounded `rg -w '_tsudoi'` returning zero WITH the before-grep against baseline bbf06f4 as its negative control, because a zero means EITHER clean OR the referent was never there.",
        implementation:
          "Strip the parameter from the 30 configs that never used it, AND the `Tsudoi` import at each site that thereby stops naming the type. THE PROPERTY IS `no Tsudoi import survives in a file that no longer NAMES the type`, NEVER `drop the import`. THE BOUND IS `every config whose default export is a FUNCTION`: test/fixtures/default-not-a-function.ts exports an OBJECT deliberately and is DEFENDED rather than merely excluded -- test/cli.test.ts:98 asserts stderr contains `not a function`, so a strip that turned it into a function reddens BY NAME. The two capture fixtures are NOT in this subtask; they move in S2 and KEEP the import, because `let captured: Tsudoi | undefined` names it.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "79d230e",
            message: "refactor(configs): stop naming a parameter 30 configs never used",
            phase: "green",
          },
        ],
        notes: [
          "BORN-GREEN AS DECLARED: 444 pass / 0 fail / 1266 expect() calls, UNCHANGED from baseline, `bun test` run unpiped and redirected to a file so the exit belongs to bun. The born-green prediction was of the RIGHT THING -- not one number moved.",
          "THE BASELINE ENUMERATION WAS RE-MEASURED RATHER THAN COPIED, per Sprint 27, and IT REPRODUCED EXACTLY: 33 files in test/fixtures and examples/ default-export something; 32 of those are FUNCTIONS; 30 write `_tsudoi` (29 fixtures plus examples/tsudoi.config.ts); 2 write `tsudoi` and use it; and test/fixtures/default-not-a-function.ts exports an OBJECT, which is the BOUND rather than an exception. `git grep -w -n '_tsudoi' bbf06f4 -- ':(exclude)scrum.ts'` returned 33 sites -- the 30 configs plus README.md:95 and two config SOURCE STRINGS.",
          "THE INSTRUMENT WAS CHANGED FOR A MEASURED REASON AND THE SUBSTITUTE IS STRICTLY BETTER: `rg -w` HUNG PAST 120s on this tree, so every grep in this sprint was run as `git grep -w` AGAINST THE BASELINE COMMIT ITSELF rather than against a working tree that merely happens to equal it. That closes the drift the sprint notes warn about by construction. THE WORD-BOUNDING PROPERTY WAS RE-VERIFIED rather than inherited: `_tsudoi` word-bounded does NOT match `__tsudoiUpstreamMarker`, because the `_` before and the `U` after are both word characters.",
          "CRITERION 5's CLASSIFICATION HELD ON MEASUREMENT: no perturbation flips a DoD check here. The strip left oxfmt wanting two files reflowed -- test/fixtures/all-methods.ts and factory-rejects-japanese.ts, whose imports now fit on one line -- which is FORMATTING RATHER THAN DETECTION and would not have caught a half-stripped tree.",
        ],
      },
      {
        test: "EXPECTED-RED. SHARED-MOMENT DECLARATION, per Sprint 13/17 so the red is not born green: S2 AND S3 ARE ONE EDIT. Re-homing the fixtures while src/config.ts:39 still passes `tsudoi` leaves them green FOR THE WRONG REASON -- they would read the parameter, not the context -- so a separate red is unobtainable. THE UNPRIMED SENTINEL BELONGS TO THIS EDIT: without it an unprimed session reports `[]`, indistinguishable from primed-and-empty, and P1 silently stops discriminating. PERTURBATIONS, each named by the assertion it flips: P1 remove the priming request from `didOpen after shutdown leaves the document absent, and exit still returns 0`, flipping `expect(readSnapshot(session.stderr)).toEqual([])` -- MEASURED 4 fail on both runtimes. P2 the same at `didOpen before initialize is dropped`, owning its own test per Sprint 18. P3 the Sprint-6 positive control, a NON-EMPTY store through the new route, MEASURED green. DIRECTION A of criterion 2: restore the parameter to the type ALONE, MEASURED `src/config.ts(39,20): TS2554: Expected 1 arguments, but got 0`, exit 1.",
        implementation:
          "Re-home snapshot-config.ts and document-members-config.ts onto `RequestContext.tsudoi` -- a handler stashes `context.tsudoi` during a PRE-shutdown request and the exit handler reads the store, so lifecycle refusal never enters -- and drop the parameter from src/types.ts:530, src/config.ts:39, loadConfig's signature and src/cli.ts:25. PRIME WITH `textDocument/hover`, NOT `completionItem/resolve`, which requireCompletionBesideResolve refuses at load. The spike measured at 26 pass / 0 fail is attached in the sprint decisions rather than left in a scratchpad that does not survive.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "3225cf5",
            message: "feat(config): the factory takes nothing, and the store arrives on a request",
            phase: "green",
          },
        ],
        notes: [
          "ONE COMMIT, AS DECLARED AT PLANNING. No contrived red was staged between S2 and S3, and the reason is the one the plan gave: re-homing the fixtures while the loader still passed an argument leaves them green FOR THE WRONG REASON. 448 pass / 0 fail / 1274 expect() at this point -- exactly +4 tests and +8 calls, criterion 7's contribution and nothing else.",
          "P1 DEVIATES FROM ITS RECORDED COUNT AND THE DEVIATION IS RECONCILED RATHER THAN SMOOTHED. RECORDED: `MEASURED 4 fail on both runtimes`. OBSERVED: P1 ALONE reddens 2 -- the one test, once per runtime. P2 ALONE also reddens 2. P1 AND P2 TOGETHER redden 4. So the recorded 4 was the SPIKE'S negative control, which removed BOTH priming requests at once, and it was attached to P1 alone in the plan. THE FIGURE WAS RIGHT ABOUT THE WORLD AND WRONG ABOUT WHICH PERTURBATION IT BELONGED TO. Baseline for all three: `bun test test/protocol.test.ts` gives 26 pass / 0 fail, which matches the attached spike exactly.",
          'P1 AND P2 BOTH FLIP THE NAMED ASSERTION AND BOTH REPORT THE UNPRIMED STATE BY NAME, which is the half that makes them evidence rather than noise: `error: no TSUDOI_SNAPSHOT line on stderr; stderr was: "TSUDOI_SNAPSHOT_UNPRIMED\\n"`. REPRODUCES the recorded perturbation in kind; the count is corrected above.',
          "CRITERION 2 DIRECTION A REPRODUCES THE RECORDED MEASUREMENT TO THE COLUMN. Restoring a parameter to `TsudoiConfigFactory` ALONE gives `src/config.ts(39,20): error TS2554: Expected 1 arguments, but got 0.` and EXIT 1, from `tsc --noEmit` run unpiped. A RED HERE IS THE PASS, and it landed at the predicted file, line AND column.",
          "CRITERION 2 DIRECTION B2 -- THE OPT-OUT HALF, WHERE GREEN IS THE RESULT. test/fixtures/hover-absent.ts given a `(tsudoi: Tsudoi)` parameter with no annotation: `tsc --noEmit` EXIT 0, `oxlint` EXIT 0, `oxfmt --check .` EXIT 0, `bun test` EXIT 0 at 448 pass / 0 fail. ALL FOUR GREEN, as predicted -- nothing type-checks an author's own file against the factory type. ITS NEGATIVE CONTROL FIRED, which is what stops that green reporting nothing: the SAME fixture exporting the config OBJECT is refused by name -- `tsudoi: the default export of config .../hover-absent.ts is not a function` -- reddening 4 in test/hover.test.ts. So the loader can see the file; the green is a finding, not a blind instrument.",
          "P3, THE SPRINT-6 POSITIVE CONTROL, IS PERMANENT IN THE SUITE RATHER THAN A PROBE: five sync.test.ts tests report a NON-EMPTY store through the new route and pin its contents by deep equality. No new assertion was needed for it.",
          "THE ROUTE'S PREMISE WAS RE-CHECKED BEFORE IT WAS RELIED ON, per criterion 3's own instruction: no test asserts capabilities on either fixture, and sync.test.ts, protocol.test.ts and document-members.test.ts are the complete set of their users. Both fixtures now advertise `hoverProvider`, and nothing observes it.",
          "TWO SESSIONS ARE DELIBERATELY LEFT UNPRIMED and the decision is recorded at the site: the `noisy`/`quiet` pair in protocol.test.ts reads NO store -- both its assertions are about what TSUDOI said -- and `tsudoiLines` filters on the `tsudoi:` prefix, which the uppercase sentinel cannot match. Priming them would add a request to a measurement about stderr and buy nothing.",
        ],
      },
      {
        test: "BORN-GREEN, DECLARED HONESTLY RATHER THAN STAGED INTO A CONTRIVED RED: the sentinel must ship in S2 for P1 to discriminate at all, so this test is green the moment it is written. DEFENDED BY PERTURBATION: delete the UNPRIMED branch and this test reddens AND S2's P1 stops discriminating. TWO TESTS, NOT ONE, per Sprint 18 -- each arm owns a test whose first assertion it is.",
        implementation:
          "Criterion 7's PERMANENT discrimination between an UNPRIMED instrument and a PRIMED-AND-EMPTY one, in the suite rather than as a probe taken once. MECHANISM IS THE EXECUTOR'S -- a sentinel value, a throw, or readMarkedLine's existing absent-line throw all satisfy it.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "3225cf5",
            message: "feat(config): the factory takes nothing, and the store arrives on a request",
            phase: "green",
          },
        ],
        notes: [
          "SHIPS IN S2'S COMMIT, as the shared-moment declaration required. Born green and declared so, not staged into a contrived red.",
          "THE MECHANISM CHOSEN, the executor's per the plan: a module-scope `let captured: Tsudoi | undefined`, a `textDocument/hover` handler assigning `context.tsudoi`, and an exit handler writing `TSUDOI_SNAPSHOT_UNPRIMED` when it is still undefined. It composes with `readMarkedLine`'s EXISTING absent-line throw rather than replacing it, so the sentinel appears IN THE FAILURE MESSAGE of every test that asks for a store and finds none.",
          "THE TWO ARMS ARE TWO TESTS PER SPRINT 18, each the FIRST assertion of its own: `a session that primes nothing reports the unprimed state, not an empty store` and `a primed session that stored nothing reports an empty store, not the unprimed state`. Two assertions each, four tests across two runtimes, +4 source `expect(` lines and +8 runtime calls -- the predicted figure exactly. NO EXIT-CODE ASSERTION WAS ADDED: `waitForExit` is awaited without `expect`, because it could never be the first thing to fail here and Sprint 9 says a control that cannot be first to fail is not one.",
          "THE DEFENDING PERTURBATION IS THE STRONGEST RESULT IN THIS SPRINT, and it was run in BOTH directions rather than one. Degrade snapshot-config.ts so an unprimed run prints `[]` instead of naming itself: (a) the new pair REDDENS 2 -- `a session that primes nothing...` on both runtimes -- and (b) WITH P1 ALSO APPLIED, test/protocol.test.ts goes to 26 pass / 0 FAIL. So without the sentinel, deleting a priming request makes the suite GREEN: the exact vacuous pass criterion 7 exists to forbid, OBSERVED rather than argued. With the sentinel, the same deletion reddens 2. THE TWO OUTCOMES DO NOT SERIALISE ALIKE -- Sprint 38's serialiser standard applied to an instrument, and measured on both sides of it.",
          "THE DISCRIMINATION IS DELIBERATELY NOT DUPLICATED ONTO document-members-config.ts, and the asymmetry is a ruling with its reason at the site rather than an omission: every `toEqual([])` in this suite belongs to snapshot-config.ts, while document-members.test.ts asserts a NON-EMPTY report that an unprimed run cannot satisfy under any spelling. That fixture carries the same sentinel anyway -- diagnostic only -- and its comment says plainly that NOTHING ASSERTS IT and why, per the Sprint-40 condition on declining a test.",
        ],
      },
      {
        test: "BORN-GREEN, DEFENDED BY PERTURBATION, and the ordering constraint is a TRAP rather than a preference: `satisfies TsudoiConfigFactory` on a zero-argument config against the STILL-ONE-PARAMETER type is TS1360, so this clause CANNOT LAND IN S1 and MUST FOLLOW S2. PERTURBATION: revert the example to the one-parameter shape while KEEPING the clause -- MEASURED TS1360 -- because a decorative `satisfies` would compile forever and defend nothing. THE EXAMPLE IS B1'S PERMANENT POSITIVE PAIRING under Sprint 6, not a one-off probe: standing item 6 makes it suite-executed and the DoD's `tsc --noEmit` compiles it on EVERY run.",
        implementation:
          "Teach `satisfies TsudoiConfigFactory` on examples/tsudoi.config.ts and in the README quickstart, WHICH MUST SAY IN ONE CLAUSE WHAT IT BUYS or it merely replaces one unexplained token with another. TEACH THE NAMED-CONST FORM, on a measured syntax trap: `export default (): P => expr satisfies F` PARSES AND SILENTLY BINDS THE CLAUSE TO THE RETURNED PROMISE rather than to the factory, and the block-bodied unwrapped form is a TS1005 syntax error; only the wrapped form and the named-const form work, and the named const has no parenthesis to drop. CONSTRAINT ON THE NEW ReadmeFact: the loop asserts sectionsStating(...) has EXACTLY ONE home, so the explanation lives in exactly one section.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "1d3d222",
            message:
              "docs(quickstart): bind the documented config to the factory type, and say why",
            phase: "green",
          },
        ],
        notes: [
          "BUILT TO THE STAKEHOLDER'S FORM B, WHICH ARRIVED MID-SUBTASK AND SUPERSEDED THIS SUBTASK'S OWN TEXT: an ANNOTATED CONST, `const config: TsudoiConfigFactory = () => ...` with `export default config;`, and NO `satisfies` anywhere. The subtask's `satisfies` wording above is left standing as the plan of record; this note is what changed and why.",
          "THE PERTURBATION'S EXPECTED DIAGNOSTIC MOVED WITH THE FORM AND WAS REPORTED AGAINST THE NEW FIGURE, NOT THE OLD ONE. Reverting examples/tsudoi.config.ts to the one-parameter shape while KEEPING the annotation gives EXIT 1 and `examples/tsudoi.config.ts(24,7): error TS2322: ... is not assignable to type 'TsudoiConfigFactory'. Target signature provides too few arguments. Expected 1 or more, but got 0.` EXPECTED TS2322, OBSERVED TS2322. An observed TS1360 would have meant a `satisfies` survived somewhere it should not have. REPRODUCES the Scrum Master's probe 4.",
          "SO THE ANNOTATION IS NOT DECORATIVE, which was the whole worry the perturbation existed to settle: it is the FIRST thing to fail on a shape change, and examples/tsudoi.config.ts is compiled by the DoD's `tsc --noEmit` on every run, so this is a PERMANENT pairing under Sprint 6 rather than a probe taken once.",
          "THE ANNOTATION-REMOVAL WIN IS REAL AND WAS MEASURED BEFORE IT WAS WRITTEN: the README quickstart now imports ONE name instead of two, declares no parameter, and declares no return type -- the annotation supplies the return type AND the inline handler's `context` and `params`. Probed against a zero-annotation handler doing `context.tsudoi.documents.get(params.textDocument.uri)`: EXIT 0. So the quickstart got SHORTER, which is the substantive answer to this PBI's own user story rather than a token swap.",
          "THE TWO CONFIG SOURCE STRINGS BECAME A SECOND DEFENDED ROUTE, unplanned and worth naming: test/installed-specifier.test.ts and test/published-specifier.test.ts type-check their consumer config against the SHIPPED and the INSTALLED package, so teaching them the documented shape means the documented route is now compiled in three places rather than one. Those edits landed in S5's commit with the rest of the source strings.",
          "THE NEW ReadmeFact IS `annotating the factory const is what reports a config shape change`, tokens `/TsudoiConfigFactory/`, `/annotat/i`, `/shape changes/i`. Its three loop tests pass, INCLUDING the exactly-one-home test -- which was the live risk, since `/factory/i` also matches inside `TsudoiConfigFactory` and could have given the pre-existing default-export fact a second home. It did not: both live in the same quickstart section.",
        ],
      },
      {
        test: "BORN-GREEN. No assertion moves. README.md:109 IS NOT TEST-ENFORCED and that is why this subtask is not tidying: readme.test.ts token-matches the fact on `/default export/i` and `/factory/i` only, so `a function tsudoi calls with a Tsudoi` GOES FALSE SILENTLY and Sprint 29's grep-the-claim's-words rule is the only thing that reaches it.",
        implementation:
          "Correct every prose claim that tsudoi calls the factory WITH something, wherever the claim's words live: src/cli.ts:11-24 (the hazard KEEPS A HOME -- deleting is AUTHORISED, NOT REQUIRED, and not deleting requires no ruling), src/tsudoi.ts:5 and :11-13, README.md:109, and the three files carrying config SOURCE STRINGS that teach the old shape and COMPILE EITHER WAY so nothing reddens -- test/installed-specifier.test.ts:17-18, test/published-specifier.test.ts:6-7, test/fixtures/published-specifier.ts:6 and :8. LEAVE test/published-specifier.test.ts:37 ALONE: re-measured, it names `Tsudoi` for the bare-specifier arm and this change does not touch it.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "616affd",
            message:
              "docs(prose): correct every claim that tsudoi calls the factory with something",
            phase: "green",
          },
        ],
        notes: [
          "THE ENUMERATION HANDED TO THIS SUBTASK WAS INCOMPLETE, AND THE MISSING SITE WAS FOUND BY GREPPING THE CLAIM'S WORDS RATHER THAN THE LISTED LINES -- Sprint 29 firing on a list nobody doubted. src/workspace.ts:21 explained WHEN workspace folders are read by saying they are not `handed to the config factory, which has already run by then`. The timing claim survives; its REASON went false, because the factory is now handed nothing at all. NOT ON THE PLAN'S LIST, and no diff on a changed line reaches it.",
          "TWO CLAIMS THAT LOOK STALE AND ARE NOT, checked rather than edited on sight: src/methods.ts:525 cites `the same ordering trap src/cli.ts records for the config factory` -- cli.ts still records it, so the citation holds -- and examples/hover-wordnet.ts:18 says the database is loaded NOT in the config factory because that runs before `initialize`, which is a timing claim unaffected by what the factory receives. Sprint 22's rule applied in the direction that PREVENTS an edit.",
          "README.md:109 WAS CORRECTED IN S4'S COMMIT RATHER THAN THIS ONE, disclosed rather than left for Review to notice: the bullet list around it was rewritten wholesale to add the annotation clause, and splitting one list across two commits would have left the intermediate tree stating a shape the code beside it did not use. `a function tsudoi calls with a Tsudoi` now reads `a function tsudoi calls with no arguments`.",
          "CRITERION 6 IS MET, AND MET TWICE. The hazard keeps its home at src/cli.ts:17 -- `git grep -n 'pre-initialize value forever' -- 'src/**'` returns it AFTER the edit, and the same grep at bbf06f4 returns it BEFORE, so the instrument is proven able to see the thing whose absence it detects. A ZERO WOULD HAVE BEEN THE FAILURE. The authorised deletion of those lines is DECLINED: not deleting requires no ruling. AND THE CRITERION'S OTHER HALF IS NOW SATISFIED SEPARATELY -- the hazard also has a home AT `TsudoiConfigFactory`, which is the site the RE-CREATING edit would be made, since re-creating the trap now means giving that TYPE a parameter rather than adding a field to `Tsudoi`.",
          "TWO SITE ATTRIBUTIONS IN THIS SUBTASK'S PLAN ARE CORRECTED, NEITHER AFFECTING WHAT SHIPPED. test/fixtures/published-specifier.ts was listed here among `three files carrying config SOURCE STRINGS`; it is a REAL FIXTURE rather than a string, so it was stripped in S1 with the other 29 -- covered, in a different subtask than the plan expected. AND test/published-specifier.test.ts:37, which the criterion says to LEAVE ALONE, is now at :45: it was left alone, but the doc block above it grew, so anyone re-running the criterion's grep against the recorded number reads the wrong line. Recorded per Sprint 8's rule that a line number is an anchor that moves when prose is added above it.",
          "CRITERION 4'S RESTATEMENT WAS THE SUBTLEST WORK IN THE SPRINT AND IT IS RECORDED AS A GENERAL SHAPE RATHER THAN AN INSTANCE: `Tsudoi` was published because AN EXAMPLE COULD NOT BE WRITTEN WITHOUT IT, and this sprint made that false -- no example and no README snippet names it now. The old justification would therefore have argued for UNPUBLISHING it. It stays because `RequestContext` STRUCTURALLY REQUIRES it. THE DISTINCTION IS THE DURABLE PART: `could the example be written without it` is a question about CONVENIENCE and can go false when an example changes, as it just did, while `is it reachable from a published type` is about COHERENCE and cannot. A JUSTIFICATION CAN GO FALSE WITHOUT THE CONCLUSION IT SUPPORTS GOING FALSE, and only re-reading the reason catches that.",
        ],
      },
    ],
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
    ],
  },
  retrospectives: [
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
