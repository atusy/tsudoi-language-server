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
      id: "PBI-56",
      story: {
        role: "tsudoi maintainer",
        capability:
          "acquire tsudoi by the same mechanism a stranger's project uses, with no hand-written apparatus standing in for `bun install`",
        benefit:
          "the resolution this repository's own checks exercise is the resolution a consumer gets",
      },
      acceptance_criteria: [
        {
          criterion:
            "In a fresh copy of the checkout where only `bun install` has run -- no repository script, no build -- every package depending on tsudoi has a RESOLVING node_modules entry for it.",
          verification:
            "Read the entry in that copy. Falsifier that stops a directory present for some other reason satisfying this: remove the depending package's dependency on tsudoi, re-run `bun install`, and that package's own type check fails at TS2307 naming a tsudoi subpath. The pre-move reading is the discriminator -- no such entry exists today, which is the whole reason `linkRootPackage` exists.",
        },
        {
          criterion:
            "With dist/ present and built from the PREVIOUS source, a type error introduced in tsudoi's own source reddens the Definition of Done, and the failure names that source file.",
          verification:
            "Introduce the error, run the DoD as written, read WHICH check reports it and what it names; remove it and confirm green, so it is not a permanent red. UNMEASURED AND THE CRUX: check 4 owns this today through the root `paths` mapping this PBI removes; check 5 is the candidate successor. IF NO CHECK OWNS IT, THIS CRITERION IS UNMET and the move fails on a stated criterion rather than being argued past at review.",
        },
        {
          criterion:
            "The order packages are built in is derived from what they depend on, not from the order their directory names sort in.",
          verification:
            "Arrange a package set where a dependent sorts before tsudoi, remove every dist/, run the build, require success. Control: the same perturbation against an order-by-sort implementation fails naming the dependent's source. MEASURED BY READING: `prepareWorkspace` builds the root and then loops `declaredMembers`, which returns `[...members].sort()`; with the stakeholder's `packages/tsudoi-language-server`, tsudoi sorts AFTER both handler members. UNMEASURED: what an unbuilt tsudoi actually produces -- TS2307 (loud) or, because tsudoi unlike the members carries a `default: ./src/*.ts` arm, a GREEN build against tsudoi's source (quiet and wrong).",
        },
        {
          criterion:
            "The edit that permits tsudoi to be published is still the edit that reddens both members' optional-peer premise.",
          verification:
            "Make that edit, watch both members redden naming what each says. WHY IT IS A CRITERION: Sprint 49 pinned that premise to `private: true` on the ROOT manifest, measured on the ground that `bun publish` stops before `prepack`. After the move, publishing edits the MEMBER's manifest and the root flag is never touched -- so the pin goes green while measuring nothing, which is Sprint 38's DISARMED outcome and the very defect Sprint 49 filed one sprint ago.",
        },
        {
          criterion:
            "The CLI starts and the fixtures answer under Bun and Deno, from a checkout and from an installed tarball.",
          verification:
            "The suite's existing shape, named here because the move is not accepted on the root's checks alone: this is the product goal's third success metric verbatim. Its own falsifier is that the `exports` map's arms are relative to the manifest carrying them and the move relocates that manifest; a broken arm reddens the deno route first.",
        },
      ],
      status: "refining",
      notes: [
        "STAKEHOLDER RULING: the directory is packages/tsudoi-language-server, and the root keeps no src/ -- it becomes a pure workspace root. THE COLLISION THAT COMES WITH IT AND MUST BE CLOSED BY THIS PBI: README quickstart markers spell `in=tsudoi-language-server` to mean the CHECKOUT ROOT, resolved through `basename(repoRoot)`, so after the move one token denotes two directories AND EVERY ASSERTION STAYS GREEN while the prose misleads a human. The marker's spelling is what changes.",
        "WHY THE MOVE IS WORTH ITS COST: `linkRootPackage` exists SOLELY because the main package is the workspace root, which the `workspaces` globs never match -- the one route where this repository's resolution differs from a stranger's, the exact class this project has spent sprints proving it cannot trust. MEASURED in a throwaway workspace on bun 1.3.13: member->member `workspace:*` resolves natively, writing the symlink into the depending member's node_modules. THAT MEASUREMENT WAS TAKEN ELSEWHERE AND IS NOT THIS TREE'S -- it must be re-measured here before it is built on.",
        "OPEN, AND REFINEMENT'S JOB TO MEASURE BEFORE ANY CANDIDATE IS NAMED (no citation exists, so measure before building to the colour). Four candidates for tsudoi's develop-time self-resolution once the root `paths` mapping goes: C1 no mapping anywhere -- and then the root check's subject SILENTLY FLIPS with the state of a gitignored directory, via the `default: ./src/*.ts` fall-through; C2 a custom export condition, DISQUALIFIED if bun needs a per-invocation flag, since that flag would leak into README command blocks the suite executes; C3 the root takes the mapping over, pointed into the member -- NOT refused on the recorded reason without adjudication, because tsudoi-as-member has no tsudoi dependency for the root to shadow, and the recorded constraint may be about a root mapping answering a HANDLER member's specifier; C4 = C1 plus a ruling that examples/ SHOULD read dist/ because a consumer does.",
        'THE PROBE, DESIGNED AND NOT YET RUN: a throwaway workspace mirroring the target layout, discriminating on a VALUE rather than an exit code -- src/types.ts exports MARK="src" and a hand-written, deliberately POISONED dist/ exports MARK="dist", so `resolved to dist` is read positively. Six cells, each on bun AND deno AND tsc --traceResolution: (1) root importer, no mapping, dist present/absent/poisoned; (2) importer INSIDE the member (self-reference), same three; (3) does bun select a custom condition with NO flag, does deno, does tsc under moduleResolution bundler; (4) C3 -- does root `tsc --noEmit` then compile member source, and does check 5 still redden on a member whose own route is broken; (5) an optional peer satisfied by hoisting, with tsudoi only in the ROOT node_modules -- does `workspace:*` even apply to a peer; (6) build order with tsudoi unbuilt. A ONE-RUNTIME RESULT IS NOT THE ANSWER IN A TWO-RUNTIME PROJECT (Sprint 45).',
        "THE RISK THAT IS GREEN WHILE MEASURING NOTHING, AND IT IS THE ONE NOBODY HAD SEEN: `linkRootPackage`'s comment records, MEASURED, that an entry for this package in the ROOT node_modules hands every throwaway probe a SECOND route to it, because test/helpers/typecheck.ts symlinks the whole root node_modules into each probe -- a probe that DELETES `exports` from its own copy then resolves anyway and reports exit 0. AFTER THE MOVE, `bun install` CREATES EXACTLY THAT ENTRY, BY CONSTRUCTION. Every consumer of typecheck.ts must be enumerated and re-read for vacuity, whichever candidate wins.",
        "WHAT MUST BE REWRITTEN RATHER THAN DELETED, because the measurement stays true of a different subject: `linkRootPackage`'s whole MEASURED block (it is the EVIDENCE the move is worth doing, and survives as history even when the function does not); bunfig.toml's and package-shape's `bun reaches src, deno reaches dist` -- RE-MEASURED, not reworded; member-resolution's `name and paths are redundant covers`, which has no subject under C1/C4. Also newly false as DEFECTS and not prose: .oxlintrc.json's `src/notifications.ts` and `test/helpers/**` override globs stop matching, and test/helpers/spawn.ts's `repoRoot` becomes ambiguous once repo root and package root are different directories.",
        "DEV'S ESTIMATES, recorded so acceptance is not argued later: ~100% that some recorded reason needs rewriting (repair, not weakening); ~70% under C1/C4 (~25% C2, ~10% C3) that `this repository's own check reads source` LOSES ITS SUBJECT with no replacement -- an honest TARGET DELIBERATELY REMOVED, but a weakening, and it must be called one; ~50% that a control goes vacuous through the root node_modules entry; ~60% that build order forces new machinery, which is added coverage.",
        "NOT ONE SPRINT. Dev's sequence: (1) PBI-55 alone; (2) run the six-cell probe and RECORD IT, with no edits; (3) adjudicate C1-C4 with the probe in hand; (4) the move, with build order, the private-flag travel, and the typecheck.ts vacuity sweep as NAMED subtasks rather than incidental repairs.",
        'THE PROBE WAS RUN. C2 IS DEAD, C3 IS DEAD, C1 IS WOUNDED, C4 SURVIVES -- and the readings are in the scratchpad\'s probe/FINDINGS.txt with the raw log beside it. Toolchain bun 1.3.13, deno 2.8.3, tsc 7.0.2, load 88-112 on every reading and NOT ONE READING A TIMEOUT: every result is a compiler or runtime exit. The discriminator was a VALUE and not an exit code -- src exports MARK="src", a hand-written poisoned dist exports "dist", a custom-condition arm "cond", a member-local copy "member-nm" -- and tsc was made to read the value too, through `export const SEEN: "src" = MARK`, so TS2322 NAMES THE ARM THAT ANSWERED.',
        "THE STATE NOBODY HAD NAMED, AND IT IS THE PROBE'S BEST FINDING: there are FOUR dist states, not three. PRESENT and POISONED are one state by construction; the fourth is PARTIAL -- types.js present, types.d.ts absent -- which is precisely the window `rm -rf dist && tsc` passes through, and which this suite ENTERS CONCURRENTLY every time a pack test runs. MEASURED IN THAT WINDOW: the COMPILER READS SOURCE WHILE THE RUNTIME READS DIST. Two files, two values, both exit 0.",
        "C2 DIED ON ITS RECORDED DISQUALIFIER RATHER THAN ON THE STORY: bun selects a custom export condition ONLY from a per-invocation CLI flag. MEASURED, every route -- `BUN_CONDITIONS` in the environment IGNORED, and `conditions` under [run], [test], [install], at top level, and `exportConditions`, ALL FIVE SPELLINGS IGNORED. deno takes `DENO_CONDITIONS` from the environment and tsc takes `customConditions` from tsconfig; bun is the only one of the three with no config and no env route, and a flag leaks into the README blocks the suite executes.",
        "C3 DIED ON WHAT IT BUYS. Its only virtue is real -- MEASURED, a root mapping pointed into the member makes the ROOT check exit 1 on a type error in tsudoi's own source, naming packages/tsudoi-language-server/src/types.ts -- but it buys that by grading tsudoi's SOURCE from the root, which is the inversion the story exists to end. And it is unnecessary: see the next note. E5 also settled the adjudication the notes above asked for -- with a handler's published d.ts carrying a tsudoi specifier and every node_modules route gone, the root mapping ANSWERS THAT HANDLER'S SPECIFIER (exit 0 with, TS2307 without), so the recorded refusal's exact shape does apply.",
        "AC2'S CRUX IS ANSWERED AND THE ANSWER IS `CHECK 5, ALREADY, UNDER EVERY CANDIDATE`. MEASURED with a type error in the member's own source and dist built from the PREVIOUS source: the fifth-check model exits 1 TWICE, at BUILD FAILED and CHECK FAILED, both naming packages/tsudoi-language-server/src/types.ts; with the error removed, both green. THE GAP THE EXECUTOR MUST CLOSE, measured against the REAL script rather than the model: `prepareWorkspace` uses execFileSync, which throws on a nonzero build, so the crux arrives as the BUILD failure alone and prints a MEMBER-RELATIVE `src/types.ts(3,14)` -- naming the file but NOT THE MEMBER. AC2 asks that the failure name that source file; a bare `src/types.ts` in a repository with three of them does not.",
        "AC1 IS SATISFIED BY `bun install` ALONE ONCE TSUDOI IS A MEMBER, AND `linkRootPackage` RETIRES. MEASURED: an optional peer gets an entry written into the handler's OWN node_modules even with no root dependency at all (a stranger's shape), `workspace:*` DOES apply to a peerDependency (install exit 0, no warning, entry written), and a member-local copy WINS over the root's. One inversion to carry into the rewrite: the link bun writes is RELATIVE where `linkRootPackage`'s is ABSOLUTE, so the dangle-on-moving-the-checkout failure mode inverts rather than disappears.",
        "AC1'S OWN FALSIFIER IS VACUOUS AS FILED, MEASURED, AND THE CRITERION MUST BE REPAIRED BEFORE IT BINDS ANYONE. It says: remove the depending package's dependency on tsudoi, re-install, and that package's type check fails at TS2307. MEASURED: with the peer removed but a ROOT devDependency still present, the handler's check EXITS 0 -- the root entry answers it. Only removing BOTH produces the TS2307 naming the handler's source. Same shape as the disarmed control in cell 4: the stated control did not fail, and the cause was that same root entry.",
        "AND THE ROOT devDependency IS THE DECISION THE MOVE CANNOT AVOID: it is what makes examples/ resolve tsudoi by name, AND it is what disarms every member-route control. IT CANNOT BE BOTH. Note 87's `bun install CREATES EXACTLY THAT ENTRY, BY CONSTRUCTION` is therefore HALF RIGHT and is corrected here: measured, with no root dependency declared, NO ROOT ENTRY APPEARS. The second route is a consequence of a choice the move makes, not of the installer.",
        "TWO RECORDED MEASUREMENTS STOP HOLDING AFTER THE MOVE, NAMED WITH THEIR SITES. (1) test/package-shape.test.ts's `the default arm does NOT serve tsc --noEmit, because a paths mapping intercepts the subpath before the exports map` -- true of today's layout; with the mapping gone, MEASURED, tsc reaches exactly that arm. (2) test/package-shape.test.ts's `the repo's type check resolves the published subpaths to source`, which builds its expectation from the default arm: under C4 the root check reads DIST. That is the concrete site whose subject dies, and it retires the ~70% estimate above as MEASURED rather than guessed. bunfig.toml's comment, by contrast, is CONFIRMED with its causal clause: paths present -> bun src / deno dist, paths absent -> both dist.",
        "WHAT KILLED C1 IS THE COMPILER AND NOT THE RUNTIMES. Both runtimes match the `import` arm and FAIL LOUDLY when dist is absent; only tsc probes for existence and falls through to `default: ./src/*.ts`, reading a DIFFERENT FILE and EXITING 0 in both the ABSENT and PARTIAL states. C4 survives because its positive reading holds -- with a declared dependency and a present dist, root bun, root deno and root tsc ALL READ DIST, which is what a consumer gets -- and C4 differs from C1 only in making that a RULING instead of an accident.",
        "MEASURED AND DELIBERATELY NOT PROPOSED: deleting the `default: ./src/*.ts` arm converts every silent green above into a diagnostic naming a file (TS2307 with dist absent, TS7016 naming dist/types.js in the PARTIAL window). THE PROBE MODELS NONE OF ITS COST -- test/package-shape.test.ts records, measured, that removing the arms reddens four tests, and that repointing at dist breaks examples/tsudoi.config.ts and test/fixtures/published-specifier.ts at TS2307. It says what deletion BUYS, not that it is affordable, and it is a subtask with its own measurement rather than part of the candidate.",
        "WHAT SPRINT 50 CHANGED HERE, AND THE FIRST ITEM IS AN ORDERING CONSTRAINT OF EXACTLY THE SHAPE THAT BROKE `GUARD FIRST`. (1) The fifth check now THROWS AT THE FIRST offender, so while the moved directory and its manifest disagree it ABORTS BEFORE TYPE-CHECKING ANYTHING -- and this PBI's crux criterion, which asks which check owns a type error in tsudoi's own source, would be reading a refusal rather than a type error. (2) C1/C4 gained a measured argument against them: `bun pm pack` runs `rm -rf dist && tsc`, so a member's dist is TRANSIENTLY ABSENT during ordinary suite operation, and under those candidates the `default: ./src/*.ts` arm turns that window into a silent source fall-through instead of a failure. (3) Probe cells 4 and 5 read EXIT CODES, which is this sprint's silent-exit-0 shape -- each must state in advance what a degenerate implementation would produce and run once against a deliberately broken control. (4) Every cell's reading carries the machine's load, because a spawned-compiler reading under bun's 5000ms default is hardware and not resolution. (5) The measured `each member's link to the root package is ABSOLUTE` loses its subject when the root stops being a package, and belongs on the rewritten-not-deleted list above. (6) C2's recorded disqualifier should be re-checked against a preload-installed resolver: if that works, C2 dies on the STORY -- hand-written apparatus standing in for `bun install` -- which is a different and stronger refusal.",
      ],
    },
    {
      id: "PBI-57",
      story: {
        role: "tsudoi maintainer",
        capability: "trust that a citation inside a comment still refers to something that exists",
        benefit:
          "a reader sent to a file or a test by a comment arrives somewhere, instead of learning that the comment aged",
      },
      acceptance_criteria: [
        {
          criterion:
            "A path-shaped token in a TRACKED file resolves against the checkout, and a comment naming a test resolves to a test the suite actually declares.",
          verification:
            "Both arms staged in a throwaway directory, because the tokens in this repository all resolve TODAY and an instrument whose witness cannot fail measures nothing: inject a token naming a file that does not exist, and a comment citing a test name the suite does not declare, and require each to be reported naming the citing file. Pair each with the same tree uninjected going green.",
        },
      ],
      status: "draft",
      notes: [
        "WHY IT IS NARROWED TO REFERENTS AND THE NAME SAYS SO. This came out of sprint 50, where a shipped comment claimed the guard ran BEFORE THE COMPILER IS SPAWNED FOR ANYTHING while `prepareWorkspace` two lines above spawns tsc to build every member -- the FOURTH instance of a comment asserting a mechanism the code denies. NO CHECK DECIDES THAT CLASS: `before X happens` is an ordering claim, and an approximate detector's failure mode is a GREEN CERTIFYING THE CLASS AS WATCHED, which is this record's own disarmed-control defect. So the PBI must state IN ITS OWN TEXT that the ordering and causality class REMAINS UNCOVERED -- filed only on that condition, because the way it becomes worse than nothing is being read as coverage of the class it was filed for.",
        "WHY IT IS NOT A FIFTH `POINT ATTENTION AT THE CLASS` ENTRY: sprint 47's remedy reads SHIPPED comments, and this instance was in scripts/, which ships nothing. The gap is mechanical rather than attentional, and sprint 47's own record already shows attention was pointed and an instance still escaped.",
        "THE INSTRUMENT EXISTS: `unreachableClaims` in test/packed-members.test.ts already reads citations out of comments. This extends its reach to tracked source rather than building a second reader.",
      ],
    },
    {
      id: "PBI-58",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read the first Definition-of-Done check as a statement about the code rather than about the machine it ran on",
        benefit:
          "a red means something is wrong with tsudoi, which is the only thing that makes running it worth the time",
      },
      acceptance_criteria: [
        {
          criterion:
            "A test that would pass is not failed by how busy the machine is, for every invocation form the contract names.",
          verification:
            "Both directions in a throwaway spawn, at values small enough to be unambiguous: a test that sleeps past the limit fails, and the same test under the limit passes. The number is a policy choice and is pinned by reading the constant, not by asserting a duration.",
        },
      ],
      status: "draft",
      notes: [
        "THE PROPERTY, MEASURED AT SPRINT 50'S REVIEW AND NOT PREDICTED: the suite spawns compilers, servers and package managers, and bun's default gives each test 5000ms. On a machine at load 100-160 the first check read 700 pass / 17 fail with EVERY FAILURE A TIMEOUT AND NONE AN ASSERTION; the same suite at `--timeout 30000` read 739 of 741. Nobody chose 5000ms for a suite of this shape; it is a default nobody edited.",
        "NO REMEDY IS NAMED IN THE CRITERION, deliberately, because a criterion that names its own fix hands the executor a way to satisfy the letter. Recorded as measured rather than as the fix: `[test] timeout` in bunfig.toml is IGNORED on bun 1.3.13, and `--timeout` does not override a deadline a test sets for itself.",
        "TWO THINGS THE EXECUTOR MUST BE TOLD RATHER THAN LEFT TO DISCOVER. MEASURED on bun 1.3.13: `setDefaultTimeout` called from a preload BEATS `--timeout` on the command line -- so whatever lands here RETIRES the `--timeout 30000` idiom this project used all through sprint 50 to tell a machine's red from a code's, and the replacement must be named when it does. And `hangTimeoutMs = 4000` in test/protocol.test.ts and test/session.test.ts is a deadline those files set for THEMSELVES, explicitly outside this item.",
      ],
    },
  ],
  completed: [
    {
      number: 50,
      pbi_id: "PBI-55",
      goal: "Every member the workspace declares has one name, not two: its directory is its package name with the scope dropped, and the repository refuses the day they differ -- for members as a class, not for the ones that exist today.",
      status: "done",
      subtasks: [
        {
          test: "Point each of the three hardcoded member paths (test/completeness-ruling.test.ts twice, test/packed-members.test.ts once) at a nonexistent basename, run each file alone, and record the colour.",
          implementation:
            "Expected none: reading says all three are loud. Any site that stays green gets a vacuity pair BEFORE the rename touches it.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "FIRST BECAUSE `git mv` CAN GUT A REASON SILENTLY: a site that matches nothing after the rename stays green, and the reason it was written for is gone with nothing saying so. Prediction is not measurement and this is cheap.",
            'ONE OF THE THREE IS A SITE NO GREP FOUND -- a split `join(repoRoot, "packages", "hover-wordnet", ...)`. That miss is the same defect class this PBI is about, which is why it is recorded rather than quietly corrected.',
            "MEASURED, ALL THREE LOUD, SO NO VACUITY PAIR IS OWED. Each was pointed at a nonexistent basename and its file run alone from the repo root. (1) `ruled`'s entry -> `packages/completion-path-nonexistent/src/completion.ts`: `bun test test/completeness-ruling.test.ts` = 1 pass / 2 fail; `the enumerated completion handlers are exactly the files that name the method` fails on the diff between the enumeration and the scan, AND `every completion handler carries a completeness ruling at its own site` fails at ENOENT inside `sourcesOf`. (2) the control's `probe` string, same perturbation: 2 pass / 1 fail, `a completion handler whose ruling was removed is reported by name` at ENOENT inside `sourceOf`. (3) test/packed-members.test.ts's split join -> `packages/hover-wordnet-nonexistent`: `bun test test/packed-members.test.ts` = 11 pass / 1 fail, `the pattern that found nothing in the tarballs finds the declaration in source` at ENOENT.",
            "WHY LOUDNESS WAS NOT A FOREGONE CONCLUSION AND THE MEASUREMENT IS WORTH ITS COST: two of the three are loud only because they READ the file. The first is loud for a second, independent reason -- the scan finds the real path and the enumeration does not -- and that is the one arm that would still fire if the read were ever removed. A site that merely PASSED the path to a matcher would have gone green, and that is the shape this subtask was looking for.",
          ],
        },
        {
          test: "In test/workspace-members.test.ts, via the existing throwaway-workspace runner: (a) a member directory whose manifest name mismatches is refused, the message naming that directory and both spellings; (b) the mismatch staged from the OTHER side is refused, the message naming the other side; (c) a SCOPED name whose unscoped segment matches goes exit 0 with empty stderr.",
          implementation:
            "`refuseMemberDirectoriesUnlikeTheUnscopedName(root, members)` in scripts/workspaces.ts, called from scripts/typecheck-workspaces.ts beside the two refusals already there. One symmetric predicate, not two branches. PLANNED AS `refuseMemberNames` AND RENAMED BEFORE IT WAS WRITTEN, by this record's own next note: that spelling states `the names agree`, which is a class the function cannot check.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "083eec5",
              message: "feat(workspaces): refuse a member directory that is not its unscoped name",
              phase: "green",
            },
          ],
          notes: [
            "BUILT BEFORE THE RENAME AND COMMITTED AFTER IT -- see the sprint decision. THE EVIDENCE `GUARD FIRST` EXISTS FOR, MEASURED ON THE MISMATCHING CHECKOUT: `bun run scripts/typecheck-workspaces.ts` exited 1 with `packages/completion-path is declared `@atusy/tsudoi-completion-path`, whose unscoped name is `tsudoi-completion-path` -- one package spelled two ways. Rename the directory to `tsudoi-completion-path`, or change the `name` in packages/completion-path/package.json to match the directory.` It names ONE member and not both, because it throws at the first, and completion-path sorts first. After the rename the same command exited 0 with the guard still wired in, which is the other half: the rename is what made it green, not the guard's removal.",
            "A FOURTH ARM WAS ADDED TO THE THREE THIS SUBTASK NAMED, AND IT IS THE ONLY ONE THAT DEFENDS AGAINST THE VACUITY THE OTHER THREE ADMIT. The three as written are all satisfied by `pass anything holding a scope` -- (a) and (b) stage unscoped names so they still refuse, and (c) is exactly what that implementation passes. MEASURED with that predicate in place: the three arms stayed green AND the fifth check on the still-mismatching checkout exited 0 in silence, which is a guard with no subject on the one repository it is for. The fourth arm is a SCOPED member whose unscoped segment mismatches; it is the only one of the four that reddens under that implementation. A FIFTH pins the manifest that declares no `name` at all, since `nothing to disagree with` is the reading that would make deleting a name the edit which silences the guard.",
            "ARM (c) IS NOT DECORATION AND IT IS THE ONE THE FIXTURES CANNOT ALREADY DO: every throwaway member in that file is UNSCOPED while every real member is SCOPED, and the stakeholder's ruling makes scope-stripping load-bearing. Without it, a guard that refuses every scoped name passes (a) and (b) and surfaces only as a repo red that reads like the rename's fault.",
            "WHY NOT REDUNDANT WITH THE README TEST: arm (b) is incidentally caught there today, but as `install command does not name the member's own tarball` -- a diagnostic that sends the reader to the README rather than to the mismatch. ARM (a) IS CAUGHT BY NOTHING AT ALL. The incidental redness is to be measured during the sprint, not asserted from reading.",
            "AND IT WAS MEASURED, IN S3'S PRE-REPAIR RUN, WHICH IS THE SAME PERTURBATION AS ARM (b): the directory moved and the manifest left alone. The readme suite reported `each member's install command names that member's own tarball` -- `Expected to contain: \"tsudoi-completion-path.tgz\"` -- exactly the diagnostic this note predicted, pointing at a document rather than at the two spellings. So the prediction held and the incidental cover is real but MISDIRECTING, which is the case for the guard rather than against it.",
            "THE CALL HANGS OFF THE CHECK PATH AND NOT THE SHARED ONE, and this is not tidiness: scripts/workspaces.ts is read by the `bun test` PRELOAD too, through `prepareWorkspace`. A refusal wired in there aborts every test run at preload while the repository is mid-rename -- and the reds this sprint is required to observe would become unobservable because nothing would load. It goes beside the other two refusals in scripts/typecheck-workspaces.ts.",
            "THE GUARD'S NAME AND MESSAGE MUST SAY `UNSCOPED`. The relation is not `directory equals package name` -- `packages/tsudoi-hover-wordnet` against `@atusy/tsudoi-hover-wordnet` are not the same string -- and Sprint 49's remedy for a guard whose stated class is wider than its implementation is to narrow the NAME.",
          ],
        },
        {
          test: "A three-member throwaway workspace whose THIRD package mismatches is refused with the diagnostic naming that third package, paired with the same three all matching going exit 0 and stderr empty.",
          implementation:
            "None, if the guard was written over the enumerated members. If an edit is needed here, the guard was written per-instance and this arm is what caught it.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "1d295ad",
              message:
                "test(members): a third package the guard was never written for is refused too",
              phase: "green",
            },
          ],
          notes: [
            "NO EDIT WAS NEEDED, AND IT WAS READ RATHER THAN ASSERTED: `git diff --stat` between the guard's commit and this one names ONE FILE, the test. Nothing under scripts/ moved. Both arms use SCOPED names for all three members, which is what the real repository has and what the existing throwaway fixtures did not.",
            "AND THE MESSAGE'S SILENCE ABOUT THE OTHER TWO IS ASSERTED, which the subtask did not ask for: a guard that reported every member it inspected would satisfy `names the third package` while sending a reader to three directories, two of which are correct.",
            "THE THROWAWAY ROOT IS A REQUIREMENT AND NOT A PREFERENCE: bun runs the suite in one process, so a third package created inside the real packages/, even transiently, would make any later caller of `declaredMembers(repoRoot)` see three members and its own subject become order-dependent.",
            "THE POSITIVE CONTROL IS WHAT DISTINGUISHES `refused` FROM `the throwaway is malformed, tsc absent, no package.json` -- ask why it fired, not whether.",
            "`NO EDIT TO THE GUARD` IS A PROPERTY OF THE HISTORY: this subtask's commit follows the guard's, and `the guard` means every file that would have to change for a third package to be covered -- a fixture list, an allowlist, an exclude entry keyed to the new name.",
          ],
        },
        {
          test: "No new test. Its reds are the fifth check on this checkout, the three hardcoded sites, and test/readme.test.ts's basename-derived tarball and member-README assertions -- which is AC2 satisfied with no new test.",
          implementation:
            "`git mv` both directories to their unscoped names, edit the 23 lines across 9 files (including both members' three tarball spellings and their `in=` markers), `bun install`, verify each member's own node_modules link to the root package survived, then the full Definition of Done.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "344bf10",
              message: "refactor(packages): a member's directory is its unscoped package name",
              phase: "refactoring",
            },
          ],
          notes: [
            'THE PRE-REPAIR RED, MEASURED AND REPRODUCIBLE BY PERTURBATION. State: both directories moved, `bun install` run so the root\'s relative links resolve again, BOTH MEMBER READMEs UNEDITED. Command, from the repository root: `bun test test/readme.test.ts`. Result: 94 pass / 3 fail across 97 tests. (1) `the root README states no handler pack or install command of its own` -- `Expected to contain: "packages/tsudoi-completion-path/README.md"`, against the root README\'s whole text. (2) `each member\'s install command names that member\'s own tarball` -- `Expected to contain: "tsudoi-completion-path.tgz" / Received: "tsudoi-completion-path: bun install ../tsudoi-language-server/completion-path.tgz"`. (3) `each member\'s pack command runs, and writes the file its own install names` -- `ENOENT: no such file or directory, posix_spawn \'bun\'`, with `spawnargs: [ "pm", "pack", "--filename", "completion-path.tgz" ]`. To reproduce: restore either member README\'s three tarball spellings and its `in=` marker to the pre-rename names and run that command again.',
            "AND THE THIRD RED MISDIRECTS, WHICH IS WORTH MORE THAN THE COLOUR IT REPORTS. The pack marker's `in=` is the spawn's WORKING DIRECTORY, and a working directory that does not exist makes posix_spawn report ENOENT AGAINST THE PROGRAM -- so the loudest of the three failures says `bun is missing` about a machine where bun is on PATH and 94 other assertions in the same file just used it. Only `spawnargs` names the member at all. A reader hitting this alone would go looking for their toolchain. It is recorded rather than repaired because the repair belongs to whoever owns that helper, not to a rename.",
            "EACH RED NAMES ONE MEMBER AND NOT BOTH, and that is the loop rather than the assertion: all three iterate `memberReadmes` and fail at the first, which is `tsudoi-completion-path` by sort order. hover-wordnet's three identical reds were never printed. Anyone reading this evidence as `the rename reddens two members' worth of assertions` is reading more than the run said.",
            'test/installed-handler.test.ts NEEDED NO EDIT AND WAS NOT GIVEN ONE. Its two absences filter installed files by `path.includes("hover-wordnet")` and `path.includes("completion-path")`, and the new directory names still contain both as substrings -- but the reason it is left alone is that its subject is the installed PACKAGE, whose name never moved. Tightening it to the new spelling would have been a change of subject dressed as a repair.',
            "ATOMIC BECAUSE THE ROOT'S node_modules LINKS ARE RELATIVE: they dangle the instant the directory moves and are repaired only by `bun install`, so a commit between the two leaves the suite broken for a reason that has nothing to do with this sprint. Each MEMBER's own link to the root package is absolute and should survive -- verified by reading it, not assumed, because if it did not the failure is the TS2307 the member READMEs describe and the reader is sent to the one file that is not wrong.",
            "THE PRE-REPAIR RED IS MEASURED AND RECORDED, NOT COMMITTED -- see the sprint decision. Rename the directories, leave the member READMEs unedited, run the readme suite, record the failure text naming the member; then repair, then commit once. THE RECORD MUST CARRY THE EXACT COMMAND AND THE ASSERTION NAMES, because the PO's objection is that a squashed commit makes the observation unobtainable AFTERWARDS -- and a record reproducible by perturbation (revert the README spelling, re-run) answers that objection where a bare colour does not.",
            "APPLIED BY FILE, NEVER BY TREE. scrum.ts's references are records of measurements taken against directories that existed at the time, and rewriting them falsifies the measurement. Same for the MEASURED note in test/readme.test.ts about an install that pointed at a tarball the pack had never written: THAT PATH IS THE FINDING.",
            "A SIDE EFFECT WORTH RECORDING: after the rename the derived tarball name EQUALS the package's unscoped name, so the packed artifact and the registry name stop being two spellings.",
            "THE LINKS, READ RATHER THAN ASSUMED, AT THREE MOMENTS. Before the move both root entries pointed at `../../packages/<old name>`. AFTER the move and BEFORE `bun install` they still did, and no longer resolved -- the dangle this subtask's atomicity is for, observed rather than predicted. After `bun install` both resolve to the new directories. Each MEMBER's own `node_modules/@atusy/tsudoi-language-server` is an ABSOLUTE link to the checkout root and resolved at all three readings, which is why moving the member could not break the member's own build.",
            "WHAT THE REPAIR ACTUALLY TOUCHED, since the estimate was `23 lines across 9 files`: both member READMEs (three tarball spellings and one `in=` marker each), README.md twice, CLAUDE.md, scripts/workspaces.ts's comment, test/completeness-ruling.test.ts three times, test/completion.test.ts, test/packed-members.test.ts twice. test/readme.test.ts was edited to STATE WHY ITS PATH STAYS OLD rather than to change it. Two paragraphs were re-wrapped because the longer names pushed them past the documents' own margin, which is why the diff is wider than the count.",
          ],
        },
        {
          test: "None -- dashboard and documentation.",
          implementation:
            "The sprint record in scrum.ts, and the CLAUDE.md line naming the two members (which is inside the rename's 23).",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "df1191f",
              message:
                "docs(scrum): the three hardcoded member paths are loud, measured before the rename",
              phase: "refactoring",
            },
            {
              hash: "ca4c3b1",
              message:
                "docs(scrum): the pre-repair red, recorded where a squashed commit cannot show it",
              phase: "refactoring",
            },
          ],
          notes: [
            "CLAUDE.md WAS SPLIT ACROSS TWO COMMITS ON PURPOSE, though this subtask reads it as one edit: the member DIRECTORY names went with the rename, and the sentence describing the guard went with the guard. A rename commit that already documented a function it does not contain would be a forward reference in the one document a reader consults before anything else.",
            "A SECOND FLAKE WAS CHASED TO ITS CAUSE, AND THE FIRST GUESS AT IT WAS WRONG. `the same two members pass once the error is removed` failed once in a full-suite run with `Expected: 0 / Received: null`, and this record first guessed that the seven tests this sprint added to that file had raised the concurrent-process load. THE MEASUREMENT SAYS OTHERWISE AND SUPERSEDES THE GUESS: bun's per-test default is 5000ms, the machine picked up an EXTERNAL load of 60-110 late in the sprint, and every test in test/workspace-members.test.ts spawns a compiler. At load ~59 the two two-member arms both failed at ~5002ms with `this test timed out after 5000ms`; at ~66 a third joined them; each passed alone moments later. The null exit code is the killed child the timeout leaves behind.",
            "SO THE EXPOSURE IS THE FILE'S AND PREDATES THIS SPRINT, and only the part this sprint created was fixed. The two THREE-member arms build one member more than anything else there, were measured crossing the limit at load ~76, and now carry an explicit allowance. The remaining tests are left alone WITH THE MEASUREMENT WRITTEN BESIDE THEM: the remedy for the file is a third argument on twenty `test` calls, which pushes every one past the formatter width and re-indents twenty unrelated bodies, and the cheap alternative does not exist -- MEASURED on bun 1.3.13, a `timeout` key under `[test]` in bunfig.toml is ignored. That is a call for the team, not for a rename sprint.",
            "AND IT CHANGES WHAT THE FINAL `bun test` MEANS, SAID PLAINLY RATHER THAN AVERAGED AWAY. On a quiet machine this tree ran 741 pass / 0 fail, twice. Under the external load at the end of the session the same tree reports pre-existing tests timing out. NEITHER NUMBER IS THE HONEST ONE ON ITS OWN: the sprint's own subjects are green in both, and what moves is a set of tests whose only fault is that a spawned process took longer than five seconds.",
            "THE CLASS IS THE SUITE'S AND NOT ONE FILE'S, WHICH THE LAST RUN MADE PLAIN AND WHICH IS THE ONE ITEM HERE WORTH A BACKLOG ENTRY. At load ~108 the failures were EIGHT, EVERY ONE OF THEM `this test timed out after 5000ms`, and they were spread across the suite rather than gathered: `hover before initialize is answered -32002`, `bun serves the example's dictionary hover from the installed copy`, `the preflight resolves for a runtime that is installed`, and five in test/workspace-members.test.ts. THE SET CHANGES BETWEEN RUNS, which is what a timeout under contention looks like and what an assertion failure never does. NONE of them is a test this sprint wrote. bun's 5000ms default is the binding constraint on a suite that spawns compilers, servers and package managers, and this repository has never chosen it -- it has only never been busy enough to notice.",
            "AND THE GUARD'S OWN CALL SITE SHIPPED A FALSE MECHANISM, CAUGHT IN REVIEW AND FIXED IN A COMMIT THAT NAMES IT. The comment read `BEFORE THE COMPILER IS SPAWNED FOR ANYTHING`, and `prepareWorkspace` two lines above it BUILDS every member with tsc -- both members carry a tsconfig.build.json, so the compiler had already run several times. The reason underneath was sound and only the absolute clause was wrong, so the repair was to narrow the claim to `before any member is TYPE-CHECKED` and to say in place what it is not. FOURTH SPRINT IN THIS RECORD WITH A COMMENT ASSERTING A MECHANISM THE CODE BESIDE IT CONTRADICTS, and this one was written by the same commit that added the code it describes, which is as close together as the two can possibly be.",
            "ONE RED WAS COMMITTED AND AMENDED AWAY WITHIN THE MINUTE, self-disclosed because the log cannot show it. The scrum record at ca4c3b1 was committed while `oxfmt --check .` was failing on scrum.ts: the verifying command had been written as `oxfmt --check . | grep -c 'correct format'`, whose OUTPUT WAS `0` -- the count of matching lines, read at a glance as an exit code. A checking command whose failure and whose success both print a small number is a bad instrument, and it was one this sprint built for itself.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        'STAKEHOLDER RULING, and it answered the Developer\'s NEED rather than being inferred: the directory is the UNSCOPED package name. `workspaces: ["packages/*"]` is untouched and no enumeration needs an edit. The rejected reading, packages/@atusy/<name>, would have moved the glob to `packages/*/*`.',
        "GUARD FIRST, RENAME SECOND, and it is not taste: the directories mismatch TODAY, so the guard has a real subject and the rename is what makes it green. Renaming first would leave the guard demonstrated only against probes written alongside it.",
        "THE GUARD WAS BUILT FIRST AND COMMITTED SECOND, AND THE TWO ORDERS ARE DIFFERENT THINGS. Wiring `refuseMemberDirectoriesUnlikeTheUnscopedName` into the fifth check turns that check RED on this checkout the instant it exists, because the mismatch it refuses is this repository's own -- so the guard's commit could not be green until the rename landed, and this project commits on green. WHAT DECISION `GUARD FIRST` ACTUALLY BUYS IS THE DEMONSTRATION, not the commit boundary: the guard demonstrated only against probes written beside it is the failure mode named, and that is answered by RUNNING it against the real mismatching tree and recording what it said -- which was done, before the rename, and the failure text is in the S1 notes. Only the commit order moved, on exactly the reasoning the facilitator already accepted for S3's pre-repair red: the evidence is the recorded run, and a commit boundary neither produces it nor improves it. The commits are therefore rename (structural) then guard (behavioural), which is also the direction Tidy First gives for a structural/behavioural pair. DISSENT NOTED IN ADVANCE: whoever reads the log alone sees the rename first and cannot see that the guard predates it -- that is what this decision and the S1 notes exist to supply.",
        "THE PO'S EVIDENCE REQUIREMENT AND THE DEV'S ATOMICITY REQUIREMENT COLLIDED, AND THE FACILITATOR SPLIT THEM RATHER THAN PICKING ONE. PO required the pre-repair red to survive as evidence and asked for it as a separate COMMIT; Dev required the rename not to be split across commits because the root's relative links dangle in between; and this project commits on green, never on red. RULED: the red is obtained and RECORDED AS MEASURED FAILURE TEXT in the subtask notes, and the commit stays atomic. The evidence the PO named is the failure text, which a commit boundary does not produce and cannot improve. DISSENT RECORDED: the PO holds that a commit boundary is stronger evidence than a recorded run.",
        "THE PO WILL REFUSE THE SPRINT, EVERY CHECK GREEN, IF THE RENAME IS ACHIEVED BY RETARGETING, GENERALISING OR DELETING AN ASSERTION THAT KEYS ON THE MEMBER'S DIRECTORY BASENAME. Once the two spellings are equal, `read the manifest name instead` is a locally reasonable tidy that removes the second, independent reader -- and the story's benefit is one fact rather than two kept equal by hand. Explicitly outside that refusal: the basename(repoRoot) sites, which key on the CHECKOUT root and belong to PBI-56's marker collision.",
        'THE BASELINE IS NOT WHOLLY GREEN AND THE ONE RED IS FLAKY, MEASURED BEFORE ANY SPRINT EDIT: `a completion handler that throws after yielding keeps the chunk it already sent` fails on roughly one run in three under bun, with `Expected to contain: "tsudoi: textDocument/completion handler failed:" / Received: ""` -- the server\'s stderr had not arrived when the assertion read it. IT IS RECORDED HERE RATHER THAN FIXED because a flake discovered mid-sprint is indistinguishable from a regression the sprint caused, and this sprint touches no code it runs. Anyone reading a red on that name during sprint 50 should re-run it before diagnosing.',
        "THE FOUR ARMS THE GUARD SHIPPED WITH WERE MEASURED AGAINST A WRONG IMPLEMENTATION RATHER THAN ARGUED ABOUT, AND THE MEASUREMENT CHANGED THE TEST SET. The three arms this sprint planned are ALL satisfied by a guard that simply passes any name holding a scope -- which on this repository, where both members are scoped, refuses nothing at all. Measured with exactly that predicate: three arms green, fifth check exit 0 and silent on the still-mismatching checkout. A fourth arm was added, a scoped member whose unscoped segment mismatches, and it is the only one of the four that reddens it. THE GENERAL SHAPE, and it is Sprint 45's per-test question asked of a test set rather than of a test: WRITE THE DEGENERATE IMPLEMENTATION AND RUN THE ARMS AGAINST IT -- if they all pass, the arms describe an author's intention rather than a property.",
        "THE REVIEW'S OWN DEFINITION-OF-DONE RUN WAS TAKEN ON A MACHINE AT LOAD AVERAGE ~100-160, AND WHAT SEPARATES THE MACHINE FROM THE INCREMENT WAS FIXED BEFORE THE RUN REPORTED. The four non-suite checks are green: oxlint exit 0, `oxfmt --check .` clean, `tsc --noEmit` exit 0, the fifth check exit 0. The suite as the Definition of Done spells it read 700 pass / 17 fail -- AND EVERY ONE OF THE SEVENTEEN IS A TIMEOUT, none an assertion. Re-running the failing FILES ALONE reproduced them, so it is not cross-test interference; the control that settles it is the same suite with `--timeout 30000`: 739 pass / 2 fail, and the two remaining fail at 4008ms against `hangTimeoutMs = 4000`, a deadline test/protocol.test.ts sets for ITSELF and which the CLI flag does not override. The executor measured 741 pass / 0 fail twice on a quiet machine. NOTHING HERE IS EVIDENCE ABOUT THE INCREMENT AND THAT IS THE POINT OF WRITING IT DOWN: this suite spawns compilers and servers under bun's 5000ms default, so on a loaded machine the reds are a property of the hardware, and a reviewer who read the raw 17 as the sprint's would be diagnosing the wrong thing.",
        "A TRANSIENT `Cannot find module '@atusy/tsudoi-hover-wordnet'` APPEARED TWICE AND IS NOT THE RENAME: `bun pm pack` runs a member's `prepack`, which is `rm -rf dist && tsc`, so a member's published artifact is briefly ABSENT while the pack tests run -- and anything spawning the example config in that window cannot resolve it. Pre-existing, load-widened, and it also explains a `tsc --noEmit` red observed the moment a killed suite left a member mid-rebuild. Named here because the diagnostic points at the renamed directory and would otherwise be read as the rename's fault.",
        "ENVIRONMENT, MEASURED THIS SPRINT AND NOT A REPOSITORY DEFECT: neither `tsc` nor `oxfmt` is on PATH in this session, and the suite spawns a BARE `tsc` (test/helpers/typecheck.ts), so the first baseline read 123 failures that belonged to the environment. Shimmed for the session. A baseline taken before the sprint is what stopped those reds from being read as the sprint's.",
      ],
    },
    {
      number: 49,
      pbi_id: "PBI-52",
      status: "done",
      goal: "A config author installs path completion and its item resolution as @atusy/tsudoi-completion-path, completing the three-module composition the stakeholder asked for.",
      impediments: [],
      decisions: [],
      subtasks: [],
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
      {
        name: "Workspace members type-check under their own configs",
        run: "bun run scripts/typecheck-workspaces.ts",
      },
    ],
  },
  sprint: null,
  retrospectives: [
    {
      sprint: 50,
      improvements: [
        {
          action:
            "A VERIFICATION COMMAND IS RUN AS THE DEFINITION OF DONE SPELLS IT, AND A WRAPPER IS TRUSTED ONLY AFTER IT HAS BEEN SEEN TO REDDEN ONCE. This sprint checked formatting through `oxfmt --check . | grep -c ...`, whose output ON FAILURE IS `0` -- read at a glance as an exit code -- and a red was committed and amended away within the minute. A PIPELINE DISCARDS THE SIGNAL, since `$?` belongs to the last command. Distinct from sprint 46's entry, which is about a MATCHER carrying the defect it hunts: this is an INSTRUMENT WHOSE SUCCESS AND FAILURE PRINT THE SAME SHAPE.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A DECISION NAMING AN ORDER STATES WHETHER IT CONSTRAINS THE DEMONSTRATION OR THE COMMIT BOUNDARY, BECAUSE THIS PROJECT'S RULES BIND THE SECOND. Filed by the Product Owner against their own drafting: `GUARD FIRST, RENAME SECOND` was UNSATISFIABLE as a commit order -- wiring the refusal in reddens the fifth check by construction, and this project commits on green -- so the decision handed the executor a deviation with no green path around it, and the collision surfaced in execution rather than in drafting. What the decision actually wanted was the DEMONSTRATION against a real subject, which was obtained and recorded.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "AMENDS SPRINT 42'S DEGENERATE-PROBE ENTRY FROM A PROBE TO A TEST SET, filed as an amendment rather than a fourth entry beside it because that entry owns the subject. WRITE THE DEGENERATE IMPLEMENTATION AND RUN THE ARMS AGAINST IT: if they all pass, the arms describe an author's intention rather than a property. MEASURED HERE, and it is why this is not advice: the three arms this sprint planned are all satisfied by a guard that passes any name holding a scope, which on a repository whose every member is scoped refuses NOTHING -- three arms green, fifth check exit 0 and silent on the still-mismatching tree. The fourth arm was written from the measurement.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 49,
      improvements: [
        {
          action:
            "AN UNFALSIFIABLE TEST IS WORSE THAN A MISSING ONE WHEN IT PAYS A COST TO EXIST. One rewrote the tracked root tsconfig.json to show a member ignores it; `tsc -p <member> --showConfig` proves the root config is never in the member's program, so that edit could not move the result. IT COULD NOT FAIL, AND IT WAS MUTATING A VERSION-CONTROLLED FILE TO NOT FAIL. THE DETECTOR IS CHEAP AND SHOULD BE ROUTINE: before writing a perturbation, ask whether the perturbed input is in the program the assertion reads.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "PIN A PREMISE TO SOMETHING ON THE PATH BY CONSTRUCTION, NOT TO PROSE THAT DESCRIBES IT. The optional-peer falsehood was bound to a README section, so publishing WITHOUT editing the README stayed green -- the pin sat beside the door rather than in it. `private: true` is on the publish path by construction: the one edit that permits publication is the edit that reddens. GENERALISES BEYOND THIS CASE: when a claim must die on an event, find the artifact the event CANNOT AVOID TOUCHING.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A GUARD'S STATED CLASS WAS MEASURED WIDER THAN ITS IMPLEMENTATION, AND THE HONEST FIX WAS TO NARROW THE NAME. Widening the matcher to bare filenames was measured NOT to catch the named escapee -- `.ts` reads back to `.d.ts`, which resolves -- and would add only words a consumer genuinely has. SO THE CHOICE WAS BETWEEN A TRUE NARROW NAME AND A WIDER MATCHER THAT STILL MISSES, and the name was narrowed. Pairs with the standing rule that a test name claiming more than its assertion verifies is a defect: THE REPAIR MAY BE THE NAME.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 48,
      improvements: [
        {
          action:
            "A CONFIG KEY THAT FAILS TO MATCH AND THEREFORE STOPS APPLYING IS A CLASS, AND IT WAS SWEPT RATHER THAN PATCHED. Eight tracked configuration files were enumerated, then each was searched for keys whose effect depends on MATCHING. The loud ones were measured, not assumed: a misspelled `types` gives TS5023 exit 2, an unknown oxlint rule name gives `Rule not found` exit 1, a bad `preload` path exits 1. The silent one was the root `paths` alone. `exclude`, oxlint override globs, `workspaces` and member `paths` are pinned BY EFFECT. THE INSTRUMENT WAS AN ENUMERATION OF FILES AND KEYS, NOT A NAME GREP -- which is the shape Sprint 46's retrospective requires when the defect being hunted is itself a property of matching.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "BUILDING THE PROBE A CRITERION ASKS FOR CAN REFUTE THE CRITERION, AND THAT IS THE PROBE EARNING ITS COST. The literal resolution probe against the build config resolves to ./src and not dist/, because `rootDir` with `outDir` makes tsc read a declaration back to its generating input -- with no dist/ on disk. THE CRITERION'S NAME WAS THE THING THAT WAS WRONG. Two sprints running, a criterion named a colour nobody had measured; here the executor measured it before satisfying it and the measurement changed the answer. PAIRS WITH SPRINT 47'S RULE -- a criterion naming a colour must cite the measurement that produced it -- by supplying the other half: WHEN NO CITATION EXISTS, MEASURE BEFORE BUILDING TO THE COLOUR.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 47,
      improvements: [
        {
          action:
            "THE PACKED TARBALL'S SHIPPED COMMENTS ARE NEVER INSPECTED, AND THAT IS A MECHANISM GAP RATHER THAN A DILIGENCE ONE. A commit titled `a false comment shipped` DID NOT FIX THE COMMENT ITS OWN BODY NAMED, and the build keeps comments, so it shipped TWICE -- dist/hover.js and dist/hover.d.ts, read off the packed tarball. THIRD CONSECUTIVE SPRINT WITH A FALSE-COMMENT FINDING, and this time the team's attention was pointed directly at the class and still missed an instance, so `be more careful` is refuted by the evidence. THE ARTIFACT IS WHERE IT MATTERS AND NOTHING READS IT. A check over claims in SHIPPED comments that name repository paths or tests would have caught this instance AND the earlier one citing a test that did not exist.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A CRITERION MAY NOT CONTRADICT A RECORD THE SAME AUTHOR WROTE ONE ITEM BELOW IT. SECOND SPRINT RUNNING THAT A PO CRITERION CARRIED A FALSE MECHANISM, and this one is worse than Sprint 46's: the fact that refutes the prediction is written in PBI-54, by the same author, in the same file. THIS IS COMMENT-CONTRADICTS-COMMENT AT THE LEVEL OF CRITERIA -- the class Sprint 46's retrospective already names, committed by the author of both texts. THE REMEDY IS NOT `write fewer mechanisms`: it is that a criterion naming a colour must cite the measurement that produced it, so an uncited colour is visibly a guess.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A NON-EXECUTED BLOCK IS INDISTINGUISHABLE FROM AN EXECUTED ONE TO A READER, SO ONE SUCH BLOCK SILENTLY WITHDRAWS THE GUARANTEE FOR THE WHOLE DOCUMENT. README promises its commands are extracted and run; the handler's pack/install block was outside that extraction and only regex-checked. MEASURED WHEN IT WAS FINALLY RUN: the documented sequence DID NOT WORK, and the install path named a file that is never created -- `bun pm pack` inside a workspace member writes the tarball to the WORKSPACE ROOT. Two defects behind one unexecuted block, found by comparing what pack WROTE against what the install line NAMES.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 46,
      improvements: [
        {
          action:
            "A CRITERION THAT NAMES ITS OWN FIX HANDS THE EXECUTOR A WAY TO SATISFY THE LETTER WHILE MISSING THE PROPERTY. FILED BY THE PRODUCT OWNER AGAINST THEIR OWN CONDUCT. Criterion 4's property is `no control is left disarmed`; the criterion also carried the remedy `tighten to the full new name`, AND THE REMEDY NAMED THE WRONG OPERATION -- a longer needle still prefix-matches, and the fix for a prefix matcher is a BOUNDARY. The executor followed the remedy and the property went unmet, with the record then claiming it met. THE DEEPER ERROR IS WRITING A REMEDY INTO A CRITERION AT ALL: Sprint 43's `a mechanism sitting where a property belonged`, landing on the same author again.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN THE DEFECT CLASS YOU ARE SWEEPING FOR IS A PROPERTY OF MATCHING, YOUR SWEEP IS AN INSTANCE OF THAT CLASS AND CANNOT BE TRUSTED UNTIL IT IS BOUNDED FIRST. The first sweep concluded `no other prefix matcher exists` using greps that were THEMSELVES prefix-matching, and said so in the same report without connecting the two. The boundary-aware re-sweep reached the same answer -- exactly two, both in one file -- SO THE CONCLUSION WAS RIGHT AND THE EVIDENCE DID NOT SUPPORT IT, which is the distinction worth keeping. Purest instance of the degenerate-probe class in this record: THE INSTRUMENT HAD THE EXACT DEFECT IT WAS HUNTING.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COMMENT CONTRADICTING ANOTHER COMMENT IN THE SAME REPOSITORY IS A DETECTABLE CONDITION NOBODY DETECTS. Four were found in one revise pass: one assigning root tsc's resolution to the exports map while another file correctly said the map is never consulted; three naming `/types` for values that come from `deps/types`; one calling two acquisition routes `the same route` against the README's correct statement that they are different mechanisms. EACH JUSTIFIES A LIVE CONTROL, so a wrong witness misdirects whoever maintains it next. Same class as PBI-54's finding -- an outcome recorded as foreclosure that is really foreclosure PLUS AN UNWATCHED PRECONDITION.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 45,
      improvements: [
        {
          action:
            "EVERY SPRINT RUNS THE `revise` SKILL AFTER THE DEVELOPER'S WORK, WITH NO PR. THE STAKEHOLDER'S STANDING INSTRUCTION, NOT A TEAM IMPROVEMENT, recorded here because a process rule that binds future sprints has no other honest home: `definition_of_done` carries `{ name, run }` where `run` is an executable shell command, so a skill name in that field would make the dashboard assert something no command verifies -- the exact failure this project keeps catching. WHAT `revise` IS: multi-perspective review, then independent review, converged before acceptance. THE LINE IT DRAWS, and this is worth more than the rule: A CRITERION ASSERTS A PRODUCT PROPERTY A PERTURBATION CAN FALSIFY; `revise` FINDS WHAT NOBODY THOUGHT TO ASSERT. The worked example is the PO's own: a criterion asking the executor to report prose sites ITS OWN LIST MISSED was on the wrong side of that line -- it asks the author to do a reviewer's job. The enumeration stays, because a prediction is worthless unless committed first; the LIST'S SUFFICIENCY belongs to revise's independent reviewer, working WITHOUT SIGHT OF THE LIST. NO CRITERION MAY BE MET BY ARGUMENT AT REVIEW.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "ASK OF EVERY SURVIVING TEST `WHAT WOULD MAKE THIS RED, NOW?` -- ONE TEST AT A TIME, AND NEVER AS A BATCH. THIRD SPRINT RUNNING THAT THIS FOUND SOMETHING A BATCH ANSWER CONCEALS. MEASURED HERE: of twelve tests classified individually, THREE WOULD HAVE STAYED GREEN WHILE MEASURING NOTHING, and they failed THREE DIFFERENT WAYS -- one removed with no re-home, one DISARMED (with precedence gone it asserted only that folders equal folders), one VACUOUS (reading an empty list that is empty for a reason unrelated to the guard). THE VACUOUS ONE IS WHY THE RULE MUST BE PER-TEST AND NOT PER-CLASS: a batch classification cannot catch it EVEN IN PRINCIPLE, because a vacuous test is green, its subject still exists, and its name still describes something real. Only the question reaches it. AND THE CLASSIFICATION'S OWN SUBJECT CAN BE UNDERCOUNTED: `the nine` were twelve, because three in the same block read the deprecated fields WITHOUT expecting a synthesised folder, so a criterion keyed on `tests that pin synthesis` underdescribed itself.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A ONE-RUNTIME MEASUREMENT IS NOT `THE ANSWER` IN A TWO-RUNTIME PROJECT, AND EVERY PRIOR HAND-RUN `MEASURED, EXIT 0` IN THIS RECORD IS NARROWER THAN ITS WORDING. MEASURED THIS SPRINT: `import { type MethodHandler }` is ELIDED BY BUN AND LOADED BY DENO, so deleting `dist/types.js` gives bun exit 0 and deno exit 1 naming that file -- and a checkout measurement taken on one runtime was reported as the answer, self-disclosed. THE SUITE RUNS BOTH RUNTIMES PRECISELY BECAUSE THEY DIFFER; A HAND-RUN PROBE DOES NOT. Same shape as the name-grep surface instrument two sprints ago: true of what it measured, narrower than what it said. THE PRACTICE: a probe whose result will be recorded as a measurement runs on both runtimes, or its record names the one it ran on.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A UNIQUENESS CLAIM ABOUT A PROBE IS MEASURED OR IT IS NOT WRITTEN. Extends Sprint 13's coverage rule to a shape it did not name: `this probe is the only thing that would notice X` IS A COVERAGE CLAIM, and Sprint 13 forbids taking one on recollection. MEASURED THIS SPRINT, ON A SENTENCE THE SPRINT ITSELF WROTE: deleting the `import` arm reddens FIVE tests, including the type-only assertion the SAME COMMIT added. Sprint 42 already recorded the disciplined version of this without generalising it -- `narrowly cleared rather than proven` -- and this is that finding earning its rule.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "WHEN A CRITERION'S PREMISE IS WITHDRAWN, RECORD BOTH THE UNMET RESULT AND THE WITHDRAWAL -- NEVER LET THE SECOND REWRITE THE FIRST. MEASURED HERE ON A CRITERION WHOSE FAILING CASE ACTUALLY HAPPENED: `nothing owns it` was named as the one failing outcome, the stakeholder removed the owner, and the PO refused to relabel it `met differently` or `waived`. THE VALUE OF WRITING CRITERIA AT ALL IS THAT `THIS ONE FAILED` CAN BE SAID. And the sprint still closed, on a stated discriminator rather than lenience: unmet BY A RULING THAT REMOVED THE SUBJECT is not unmet by shortfall, and THE TEST IS WHETHER CONCEALMENT WAS AVAILABLE -- here it was, and the executor refused it, which is the only reason the acceptance could be given.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
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
