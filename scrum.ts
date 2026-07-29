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
            "Each DIRECTION of factory-arity agreement is MEASURED and then labelled at `TsudoiConfigFactory` per the Sprint-11 classification -- DEFENDED-by-what, or UNDEFENDED-and-here-is-what-stays-at-risk. The two directions are NOT the same question: (A) the type's arity against the arity tsudoi actually calls with, and (B) a config author's own default export against the type.",
          verification:
            "Direction A: restore a parameter to `TsudoiConfigFactory` ALONE and run `tsc --noEmit` unpiped. Expected TS2554 at src/config.ts:39, since that call site passes zero arguments -- if it reddens, A is DEFENDED and the label says so. Direction B: give ONE fixture's default export a `(tsudoi: Tsudoi)` parameter, leave the type at zero, run all four DoD checks unpiped. Expected ALL GREEN, which is what makes the UNDEFENDED label TRUE rather than merely cautious -- src/config.ts:39 reaches the type through a CAST from `unknown` (`factory as TsudoiConfigFactory`) and NOTHING in this repository annotates a config against it. NEGATIVE CONTROL FOR B, and it is the half that stops a green meaning nothing: perturb that SAME fixture to a shape that IS caught -- export the config OBJECT instead of a function -- and confirm it is refused with the named ConfigError. That proves the loader can see the fixture at all, so B's green reports undefendedness rather than a file nothing runs.",
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
            "Every in-repo config declaring a factory parameter declares none, and every PROSE claim that tsudoi calls the factory WITH something is corrected wherever the claim's words live -- including files a diff on the changed lines never reaches.",
          verification:
            "MEASURED THIS REFINEMENT, so the executor re-measures rather than trusting this list: 31 fixture default exports (29 writing `_tsudoi`, and snapshot-config.ts and document-members-config.ts writing `tsudoi` and USING it); examples/tsudoi.config.ts:5 and :14; README.md:93, :95 and :109, the last of which says in words `a function tsudoi calls with a `Tsudoi``; and THREE files carrying config SOURCE STRINGS that teach the old shape and COMPILE EITHER WAY so nothing reddens -- test/installed-specifier.test.ts:17-18, test/published-specifier.test.ts:6-7, test/fixtures/published-specifier.ts:6 and :8. LEAVE test/published-specifier.test.ts:37 ALONE: it exercises the bare-specifier arm and names `Tsudoi` for a reason this change does not touch. NEGATIVE CONTROL for the after-grep's zero: the same commands before the edit must return the sites above. AND THE FALSE POSITIVE IS NAMED so a non-zero is not misread: `_tsudoi` matches `__tsudoiUpstreamMarker` in test/published-artifacts.test.ts, which is unrelated -- the grep must be word-bounded.",
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
        "EVERY `BEFORE THE EDIT` GREP IN THIS PBI MEANS COMMIT 9df9064, WHICH IS HEAD -- AND IT REACHES FEWER CRITERIA THAN THIS NOTE FIRST CLAIMED. The PO originally wrote 5f7abdd, taken from a session-start git status and NEVER MEASURED, which is the Sprint-25 rule -- do not state a premise about an artifact until it has been read in the same session -- applied to a COMMIT rather than to a file. THE FAILURE IT WOULD HAVE CAUSED IS THE SHARPER HALF, and it is Sprint 39's entry firing on the entry that created it: 5f7abdd IS an ancestor of HEAD, so it looked safe, but 56 files moved between them and test/document-members.test.ts, test/fixtures/document-members-config.ts and some twenty other files DID NOT EXIST THERE. A before-grep run against it returns a zero meaning THE FILE WAS NOT BORN YET, which reads as THE REFERENT WAS JUST DELETED -- the exact ambiguity criterion 4 cites Sprint 39 to close. A BASELINE COMMIT IS ITSELF A CLAIM REQUIRING MEASUREMENT, not framing. WHICH CRITERIA IT BINDS, corrected because the first draft over-generalised to `six negative controls`: ONLY 1, 4, 5 AND 6 carry before-greps and need this commit. CRITERIA 2 AND 3 ARE PERTURBATIONS OF THE FINISHED INCREMENT, so their baseline is the post-implementation tree and no commit can flip them -- the PO's warning that criterion 2 direction A's expected TS2554 would invert against a different baseline WAS THEIR OWN CONFUSION and is withdrawn: that control is run after the type is already zero-parameter, so restoring a parameter to it while src/config.ts:39 passes none gives TS2554 against any tree that satisfies criterion 1.",
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

  sprint: null,
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
