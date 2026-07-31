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
            "Read the ENTRY and follow it to its target, because `lstat` succeeds on a dangling link and `something is there` is the wrong question -- and because in a state where NOTHING HAS BEEN BUILT a compile-based reading answers `src` legitimately, through the `default` arm, so a green compile here would bank a reading that means nothing. THE FALSIFIER FILED HERE WAS MEASURED VACUOUS (probe 5c): with the depending package's declaration removed but the ROOT's dependency on tsudoi still present, that package's type check EXITS 0 -- the root node_modules entry answers it, and the same entry disarmed a control stated in advance in cell 4. So the falsifier runs only with EVERY OTHER ROUTE ENUMERATED AND STASHED FIRST -- the root entry, any member-local copy, any `paths` mapping -- and in that state, and only there, removing the declaration fails at TS2307 naming the depending package's own source and the tsudoi subpath (5d), with restoring it going green. WHICH ROUTE ANSWERED IS READ AND NOT INFERRED FROM A COLOUR: a member-local copy WINS over the root's (5b). TWO THINGS TO RECORD RATHER THAN DISCOVER: bun's link is RELATIVE where `linkRootPackage`'s is ABSOLUTE, so the dangle-on-moving-the-checkout failure mode INVERTS rather than disappears; and the pre-move discriminator stands -- no such entry exists today, which is the whole reason `linkRootPackage` exists.",
        },
        {
          criterion:
            "With dist/ present and built from the PREVIOUS source, a type error introduced in tsudoi's own source reddens the Definition of Done, and the failure names that source file.",
          verification:
            "Introduce the error, run the checks AS THE DEFINITION OF DONE SPELLS THEM AND NOT A MODEL OF THEM, read WHICH check reports it and WHAT the failing output names; remove it and confirm green, so it is not a permanent red. THE CRUX IS SETTLED AND CHECK 4 IS NOT THE OWNER: with dist built from the previous source, root `tsc --noEmit` EXITS 0 (4c) because it reads dist/types.d.ts, while the fifth check reports it naming packages/tsudoi-language-server/src/types.ts (4d). AND CHECKS 1 AND 5 BOTH OWN IT THROUGH ONE `execFileSync`, which the probe could not see because it ran the fifth check alone: `prepareWorkspace` is ALSO the `bun test` preload, so the same failed build aborts `bun test` before a single test file loads. WHAT `NAMES THAT SOURCE FILE` MUST MEAN, NARROWED BECAUSE THE REAL SCRIPT WAS READ AND THE MODEL FLATTERED IT: `build` runs tsc with `cwd` INSIDE the member and `execFileSync` throws on a nonzero exit, so the crux arrives as the BUILD failure alone, before `typeCheckMember` runs, printing a member-relative `src/types.ts(3,14)` -- and after the move this repository has THREE `src/` directories, so that string identifies none of them. THE CRITERION IS MET ONLY IF THE FAILING RUN'S OWN OUTPUT NAMES THE MEMBER AND THE FILE TOGETHER, readable without consulting a second source, in BOTH readers. `typeCheckMember` already carries the reason for its own half -- run from the root, which is what puts the member's name in tsc's own diagnostics -- and the build half now needs the same property. A run that exits 1 printing only `src/types.ts` FAILS THIS CRITERION.",
        },
        {
          criterion:
            "The edit that permits tsudoi to be published is still the edit that reddens both members' optional-peer premise.",
          verification:
            "Make that edit and watch both members redden naming what each says -- BUT `THAT EDIT` IS NOW A DIFFERENT FILE'S, AND THE VERIFICATION AS FILED WAS PERFORMABLE AND GREEN, which is the same false-pass shape as AC1's disarmed falsifier and AC3's false control and is repaired here rather than filed as a gap. Sprint 49 pinned the premise to `private: true` on the ROOT manifest, measured on the ground that `bun publish` refuses a private package before `prepack` is run. After the move the root is a pure workspace root that keeps that key FOREVER, so test/optional-peer-premise.test.ts's `tsudoiIsUnpublished`, which reads repoRoot/package.json, answers TRUE BY CONSTRUCTION: deleting `private` from packages/tsudoi-language-server/package.json -- the edit that actually permits publication -- leaves both members GREEN. THE CRITERION IS MET ONLY IF THE PREMISE'S READING TAKES AS ITS SUBJECT THE MANIFEST WHOSE EDIT PERMITS PUBLICATION, and the root's permanent flag cannot satisfy it. THE DIFFERENTIAL THAT PROVES THE SUBJECT MOVED, and it waits on nothing unmeasured: deleting `private` from the MEMBER's manifest reddens both members AND deleting it from the ROOT's alone does NOT -- today's implementation produces exactly the opposite pair, which is what makes this a control rather than a restatement. SPRINT-INTERNAL AND NOT A GATE ON READINESS: whether `bun publish` run inside a member consults anything but that member's own manifest, measured once before the pin is rewritten onto it. This is Sprint 38's DISARMED outcome and the defect Sprint 49 filed one sprint ago, arriving in the criterion written to prevent it.",
        },
        {
          criterion:
            "The CLI starts and the fixtures answer under Bun and Deno, from a checkout and from an installed tarball.",
          verification:
            "The suite's existing shape, named here because the move is not accepted on the root's checks alone: this is the product goal's third success metric verbatim. Its own falsifier is that the `exports` map's arms are relative to the manifest carrying them and the move relocates that manifest; a broken arm reddens the deno route first.",
        },
      ],
      status: "ready",
      notes: [
        "PO RULING 1, NO README FOR packages/tsudoi-language-server THIS SPRINT, AND THE ENUMERATION NARROWS TO HANDLER PACKAGES. The `memberFacts` loop is written for a reader who has ONLY that document, and tsudoi's reader does not arrive that way by construction: the sole documented route to the tarball IS the root README's quickstart, so the reader has already read it. Two of the four member facts (the peer on tsudoi, the link `bun install` does not create) are unstatable by tsudoi about itself, so the enumeration would have to narrow anyway. WHAT IS NOT CLOSED AND IS FILED RATHER THAN DISCOVERED: after the move `bun pm pack` in the member produces a tarball with NO README, where today's root pack ships one -- a registry-page gap that binds only the day tsudoi publishes, which `private: true` travelling to the member manifest (AC4) forecloses until a publishing decision reopens it. The honest close today is moving quickstart step 1 into a member README, which cascades into the ~15 `facts` entries hung off that quickstart; that cascade is the reason to defer, not tidiness. A prose-only pointer README is REFUSED: a document nobody executes is the one that goes stale, which is this repository's own doctrine.",
        "PO RULING 2, THE ROOT TAKES A DISTINCT PRIVATE NAME AND THE COLLISION IS NOT KEPT-AND-MEASURED. Two packages claiming one name is `one package spelled two ways` in the one place sprint 51's guard cannot see -- it iterates members and the root is not one -- and its failure mode is silence: last-write-wins in `dirsByName`, no throw, no reorder, and which package a member's specifier then resolves to unmeasured. Measuring it green would license a state whose defect is that nothing reports it. DROPPING `name` IS ALSO REFUSED, and for the same reason rather than a different one: a nameless root is missed by `dirsByName` silently. THE EXACT STRING IS THE PO'S AND NOT THE STAKEHOLDER'S -- it appears in no registry, no consumer's manifest and no executed command block -- and it MUST NOT BE A PREFIX-EXTENSION of the published name, which the `registry route is intended and unverified` fact's right boundary was written (MEASURED) to refuse; `@atusy/tsudoi-workspace` satisfies that. CONSTRAINTS: the root keeps `private: true` PERMANENTLY, and the rename must not become a second manifest the optional-peer premise reads -- AC4 already retargets it onto the member's. MEASURED BEFORE IT IS BUILT ON: after `bun install`, follow the member's node_modules entry to its target and read WHICH package answered, positively rather than from an exit code.",
        "PO RULING 3, THE PACK COMMAND'S TEXT DOES NOT CHANGE AND ITS DIRECTORY DOES. `bun pm pack --filename tsudoi.tgz` runs in the member; the tarball still lands at the WORKSPACE ROOT, so quickstart step 2's `bun install ../tsudoi-language-server/tsudoi.tgz` is UNCHANGED -- and that non-change is load-bearing PROSE a human is owed, exactly as each handler README already owes `the tarball does not land in that directory`. RE-MEASURED FOR TSUDOI-AS-MEMBER: the writes-to-the-root reading is the handlers' and is not this package's. THE MARKER COLLISION IS RULED AS A PROPERTY AND NOT A SPELLING, because the two marker families use different vocabularies -- `handler-pack in=` is repoRoot-relative while `quickstart in=` names a SIBLING resolved through `basename(repoRoot)` in a staged parent that copies the root's package.json, tsconfig.build.json and src/. The requirement: no quickstart token may denote two directories, and the directory a reader is SHOWN is the directory the marker obeys. WHAT MUST KEEP WORKING FROM THE CHECKOUT ROOT: the five Definition-of-Done checks, for bunfig.toml's recorded reason. FIRST-DAY MEASUREMENT, NOT A GATE: what `bun pm pack` at the root does after the move, which is the muscle-memory route and the same mechanism AC4's premise rests on. NAMED SO THEY ARE NOT FOUND BY A RED: CLAUDE.md's tarball line (BOTH halves -- the directory, and `the prepack script compiles src/`, which the root will not have), and the pack invocation's cwd in test/helpers/install.ts and test/installed-runtime.test.ts.",
        "A BLOCKER THE PO'S READING FOUND, IN THE MARKER COLLISION'S CLASS -- A TEST WHOSE SUBJECT RELOCATES WITH THE MANIFEST. test/readme.test.ts builds `publishedExports` from `join(repoRoot, \"package.json\").exports`; after the move the root has no `exports`, so that is `Object.keys(undefined)` -- A THROW AT MODULE LOAD rather than a failed assertion, taking the exports comparison and its permanent pair with it. A named subtask, not a first-run discovery.",
        "WHAT SPRINT 51 CHANGED HERE, AND THE FIRST IS A REFUSAL IN SPRINT 50'S WORDING. test/build-order.test.ts asserts `buildOrder(repoRoot)` equals the root followed by the sorted members BYTE FOR BYTE, and THE MOVE REDDENS THAT ARM BY CONSTRUCTION -- after it, tsudoi sorts last among the members and both handlers declare it, so the derived order contradicts the sorted one. THAT REDNESS IS THE DERIVATION EARNING ITS KEEP. THE SPRINT IS REFUSED, EVERY CHECK GREEN, IF THAT ARM IS GENERALISED TO A SET COMPARISON, RETARGETED AT A TREE WHERE THE TWO ORDERS AGREE, OR DELETED. It is rewritten to the new derived order, in the same commit as the move.",
        "AND THAT ARM CARRIES A COUPLING NOBODY HAD NAMED: the cycle refusal is safe to land in the `bun test` PRELOAD only because it is reachable from no state this repository can be in, and what establishes that is the dev-edge ruling TOGETHER WITH the byte-for-byte arm -- the very arm the move reddens. So there is a window in which a preload-level throw has nothing establishing it cannot fire, and a wrong answer there means NOTHING LOADS. THE GATE: the post-move graph's acyclicity is verified BEFORE the move lands.",
        "THE GATE IS ANSWERABLE WITHOUT MOVING ANYTHING, MEASURED. `buildOrder` reads only names and declared dependency fields out of package.json files -- no src/, no dist/, no node_modules, no install, no build -- so the post-move MANIFEST GRAPH is the entire subject, and it is constructible as four manifests in a throwaway tree DERIVED PROGRAMMATICALLY FROM TODAY'S REAL ONES rather than hand-copied, which is what gives the gate a live subject: drop a handler's optional peer tomorrow and the mirror's edges change and the assertion reddens. MEASURED across the cells: acyclic under BOTH spellings of the root's declaration (so the gate does not wait on the field question below); the control, both optional peers dropped, degenerates to the alphabet -- without it `acyclic` is satisfied by a mirror that quietly lost its edges, which is this sprint's own for-want-of-a-subject shape; and the falsifier, the member declaring the root back, throws naming both packages, both manifests and the field.",
        "THE ROOT'S DECLARATION MUST NAME ITS FIELD, and that was free before sprint 51 and is not free now: `devDependencies` creates NO edge and the root is ordered first, while `dependencies` creates one and packages/tsudoi-language-server is ordered BEFORE the root. Name it rather than discover it. AND WRITE DOWN WHY THE DEV-EDGE RULING'S ACCEPTED PRICE IS BENIGN HERE: the post-move root carries no build config, so the builder skips it and its position decides no artifact -- a sentence that should exist before someone gives the root a build config rather than after.",
        "WHAT SPRINT 51 DID NOT CHANGE, STATED SO IT IS NOT ASSUMED. AC2's filed gap stands: the builder still runs tsc with cwd INSIDE the member and inherits stdio, and execFileSync still throws first, so the crux still arrives as a member-relative `src/types.ts(n,m)` naming the file but NOT the member -- the rewire looks like it might have touched this and did not. AC1's likewise: the harness closure removed ONE of the two routes that made its falsifier vacuous; the other, the root's own declared dependency, remains BY RULING. `every route enumerated and stashed first` stands as written -- the closure narrows the work, it does not retire the requirement.",
        "ADDED TO SCOPE BY THE PO'S REVIEW READING: three wholesale node_modules symlinks live OUTSIDE the harness this sprint closed -- in the readme, checkout and install helpers. None is a route-perturbation probe today, so none was a shortfall against sprint 51; each will hand its tree a RESOLVING entry for tsudoi pointing into the real checkout the day the move lands. The readme helper needs attention regardless, because it copies a root src/ that will no longer exist -- which belongs beside the already-filed spawn-helper `repoRoot` ambiguity and the lint override globs.",
        "A RESIDUE NAMED AND DELIBERATELY NOT MADE WORK: a root that keeps the published name while the member also takes it neither throws nor changes the order, because the name-to-directory map is last-write-wins and the member is written second -- and the root is not a member, so the name guard does not cover it. Different fault from the one the gate was asked about.",
        "STAKEHOLDER RULING: the directory is packages/tsudoi-language-server, and the root keeps no src/ -- it becomes a pure workspace root. THE COLLISION THAT COMES WITH IT AND MUST BE CLOSED BY THIS PBI: README quickstart markers spell `in=tsudoi-language-server` to mean the CHECKOUT ROOT, resolved through `basename(repoRoot)`, so after the move one token denotes two directories AND EVERY ASSERTION STAYS GREEN while the prose misleads a human. The marker's spelling is what changes.",
        "WHY THE MOVE IS WORTH ITS COST: `linkRootPackage` exists SOLELY because the main package is the workspace root, which the `workspaces` globs never match -- the one route where this repository's resolution differs from a stranger's, the exact class this project has spent sprints proving it cannot trust. MEASURED in a throwaway workspace on bun 1.3.13: member->member `workspace:*` resolves natively, writing the symlink into the depending member's node_modules. THAT MEASUREMENT WAS TAKEN ELSEWHERE AND IS NOT THIS TREE'S -- it must be re-measured here before it is built on.",
        "OPEN, AND REFINEMENT'S JOB TO MEASURE BEFORE ANY CANDIDATE IS NAMED (no citation exists, so measure before building to the colour). Four candidates for tsudoi's develop-time self-resolution once the root `paths` mapping goes: C1 no mapping anywhere -- and then the root check's subject SILENTLY FLIPS with the state of a gitignored directory, via the `default: ./src/*.ts` fall-through; C2 a custom export condition, DISQUALIFIED if bun needs a per-invocation flag, since that flag would leak into README command blocks the suite executes; C3 the root takes the mapping over, pointed into the member -- NOT refused on the recorded reason without adjudication, because tsudoi-as-member has no tsudoi dependency for the root to shadow, and the recorded constraint may be about a root mapping answering a HANDLER member's specifier; C4 = C1 plus a ruling that examples/ SHOULD read dist/ because a consumer does. THAT LAST SENTENCE IS THE FRAMING THE PO RULING BELOW DECLINES TO ACCEPT UNCONDITIONALLY -- this note records what was open at the time and is left standing as that record, not as the decision.",
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
        "PO RULING, C4 ACCEPTED -- AND NOT IN THE SENTENCE IT WAS PROPOSED IN. C2 and C3 are dead on measurement and the only alternative left to C4 is keeping a `paths` mapping, which is the apparatus this story exists to remove. WHAT IS NOT ACCEPTED IS `ROOT-LEVEL IMPORTERS READ dist` AS AN UNCONDITIONAL CLAIM: it is measured TRUE in the PRESENT and POISONED states and FALSE in ABSENT and PARTIAL, where tsc alone probes for existence, falls through the `default: ./src/*.ts` arm, reads a DIFFERENT FILE and EXITS 0 -- and PARTIAL is a state this suite ENTERS CONCURRENTLY every time a pack test runs. THE RULING IS THEREFORE: root importers read dist WHEN dist IS PRESENT, and the ABSENT/PARTIAL subject flip is a NAMED, ACCEPTED RESIDUE THAT NOTHING DETECTS. Accepted rather than fixed because the one fix measured has costs the probe does not model; NAMED rather than left implicit because an undetected subject flip nobody wrote down is how this record's worst defects started. The move must not be reviewed as though the flip were closed.",
        "THE `default: ./src/*.ts` ARM IS ITS OWN ITEM, WITH A RIDER THAT DECIDES WHAT ITS RECORDED COSTS ARE WORTH. E2 measures what deleting it BUYS: every silent green becomes a diagnostic naming a file -- TS2307 with dist absent, TS7016 naming dist/types.js in the PARTIAL window. Its recorded COSTS (four tests in test/package-shape.test.ts redden; repointing the subpaths at dist breaks examples/tsudoi.config.ts and test/fixtures/published-specifier.ts at TS2307) were MEASURED UNDER THE LAYOUT THIS MOVE DESTROYS -- both of those files reach tsudoi through the root `paths` mapping today and through node_modules afterwards. SO THOSE COSTS ARE RE-MEASURED AFTER THE MOVE AND NOT CARRIED ACROSS, and the item is filed against the post-move tree or not at all. Nothing here weakens the residue above: until that item lands, the flip stands undetected and said so.",
        "PO RULING, THE ROOT DECLARES THE DEPENDENCY, AND ITS PRICE IS PAID EXPLICITLY RATHER THAN AVOIDED. Three readings, strongest first: (i) the root manifest ALREADY declares devDependencies on both members, so tsudoi-as-member is a third entry in a list this repository has already chosen, not a new concession; (ii) cell 1 phase A -- without a root declaration a root-level importer resolves in NO tool in NO dist state; (iii) test/fixtures/published-specifier.ts is SPAWNED AS A REAL SERVER, so no compiler-only route could substitute for it, and examples/tsudoi.config.ts is the documented route a config author copies. WHAT THE RULING COSTS, WRITTEN DOWN SO IT IS NOT DISCOVERED: that entry hands every member a SECOND route and it silently disarmed BOTH of the probe's stated controls (4f, 5c). The cost is not paid by remembering it -- every control this move writes that perturbs a MEMBER'S OWN route to tsudoi states in advance what a degenerate implementation prints and is run once against a deliberately broken control, which is sprint 50's retro entry applied to a class of controls rather than to one. THE ESCAPE HATCH IF THAT PROVES UNAFFORDABLE IS UNMEASURED AND MAY NOT BE ASSUMED: examples/ and the consumer-shaped fixtures becoming packages that declare tsudoi themselves would put the entry in their own node_modules, which depends on whether bun hoists a REGULAR workspace dependency into the root node_modules -- 5f measured that only for an OPTIONAL PEER.",
        "PO RULING ON SIZE: IT SPLITS, AND THE BOUNDARY IS A SPRINT BOUNDARY AND NOT A COMMIT BOUNDARY -- sprint 50's retro filed exactly that ambiguity as an order nothing could satisfy. FIRST HALF, and it can go in green because today's constructed order already equals the derived one: the build order derived from declared dependencies (AC3), demonstrated in throwaway package sets where its subject is real, PLUS the second-route hazard closed at the place that SPREADS it -- test/helpers/typecheck.ts symlinks the whole root node_modules into every probe, and root node_modules/@atusy/tsudoi-hover-wordnet RESOLVES TODAY (read, not assumed), so that hazard has a subject BEFORE the move and its remedy can be demonstrated before the move disarms anything. SECOND HALF, one full sprint with nothing beside it: the move itself, AC1, AC2, AC4, AC5, the README marker collision, and the rewritten-not-deleted measurements. AC4 CANNOT TRAIL -- the premise goes green measuring nothing at the moment the manifest moves, which is the defect it was filed for.",
        "WHAT IS STILL WITHOUT A CITATION, NAMED RATHER THAN LEFT FOR THE EXECUTOR -- AND EACH IS A FIRST-DAY MEASUREMENT INSIDE THE SPRINT, NOT A GATE ON READINESS, because none of them decides a criterion's shape. (1) AC4's mechanism is cited (test/optional-peer-premise.test.ts measures the refusal before `prepack`) and its SCOPE is not: whether `bun publish` run inside a member consults anything but that member's own manifest. The SUBJECT question that reading raised was not a gap and is repaired in AC4's verification above. (2) bun's hoisting of a regular workspace dependency, above. (3) AC5 is uncited by this probe entirely -- the `exports` map's arms are relative to the manifest carrying them and the move relocates that manifest, and no cell touched the CLI or the tarball route.",
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
      number: 51,
      pbi_id: "PBI-59",
      goal: "The build order comes from what each package declares it needs -- proven in a set where the alphabet gets it wrong -- and no probe of a member's own route to tsudoi can be answered by a route the harness handed it.",
      status: "done",
      subtasks: [
        {
          test: "None -- extraction only; the file it comes out of stays green with no behaviour change.",
          implementation:
            "Extract the throwaway-workspace builder out of test/workspace-members.test.ts into a helper and import it back, so the new file can drive the same tree. Kept separate from the path-shape helper beside it, with a comment saying which is which so the next reader does not merge them.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "c3d2bce",
              message: "refactor(test): lift the throwaway-workspace builder into a helper",
              phase: "refactoring",
            },
          ],
          notes: [
            "LANDED AS test/helpers/workspace.ts, and the `which is which` comment names test/helpers/tree.ts by its SUBJECT rather than by its age: tree.ts writes EMPTY entries because it asks what a PATH resolves to, this one writes bytes because it asks what a package DECLARES. MEASURED, no behaviour change: test/workspace-members.test.ts ran 20 pass / 0 fail before and after, and the full suite 741 pass / 0 fail.",
          ],
        },
        {
          test: "`buildOrder(repoRoot)` equals today's constructed order EXACTLY -- root, then the two members -- and contains each node exactly once. Paired with a reading of the node set against the root plus `declaredMembers`, so an empty answer cannot pass.",
          implementation:
            "`buildOrder` exported from scripts/workspaces.ts: nodes are the root plus `declaredMembers`, keys are manifest names, edges are the declared dependency fields intersected with the node names, Kahn with a sorted-path tie-break. `prepareWorkspace` is not touched yet.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "b4d6624",
              message: "feat(workspaces): derive the build order from what each package declares",
              phase: "green",
            },
          ],
          notes: [
            "MEASURED, THE ORDER IS A VALUE AND IT IS TODAY'S: buildOrder(repoRoot) returns the checkout root, then packages/tsudoi-completion-path, then packages/tsudoi-hover-wordnet -- byte for byte `[repoRoot, ...declaredMembers(repoRoot)]`, which is what the builder constructed. So the derivation went in with nothing changing colour, exactly as the sprint decision required.",
            "IT RETURNS DIRECTORIES AND NOT NAMES, decided while writing it: names are the keys the edges are computed with, but the callers build directories and the tie-break is over paths. A nameless package therefore still has a position.",
            "THE ROOT IS A NODE BECAUSE IT IS A BUILDABLE PACKAGE, NOT BECAUSE IT IS THE ROOT -- it carries a build config. That phrasing is what makes the move a no-op here: tsudoi becomes a member and stops being special with no edit to this function.",
            "EXACTLY ONCE IS ASSERTED BECAUSE THE VALUE READING CANNOT SEE IT: `build everything twice` and `build in any order and retry until green` both produce the same artifact the correct order does. That is why the order is a RETURNED VALUE and not only an execution -- the two degenerates are visible in the sequence and invisible in the result.",
          ],
        },
        {
          test: "A throwaway where the producer sorts LAST: the derived order contradicts the alphabet. Control: the SAME tree with the consumer's declaration removed orders by the tie-break instead.",
          implementation: "None -- this is the arm that forbids `sort()` as the implementation.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "db7696e",
              message:
                "test(build-order): forbid the sort by ordering a tree the alphabet gets wrong",
              phase: "green",
            },
          ],
          notes: [
            "RUN AGAINST THE DEGENERATE IMPLEMENTATION RATHER THAN ARGUED, which is sprint 50's retro entry applied here: with buildOrder's body replaced by `[root, ...declaredMembers(root)]`, THIS ARM ALONE REDDENS -- the diff transposes packages/producer and packages/consumer -- and the other three arms stay green. So the arms in this file are not all satisfied by the sort, and exactly one of them is why.",
            "THE CONTROL IS THE REAL IMPLEMENTATION WITH ONE DECLARATION DELETED, AND THAT IS A SUBSTITUTION MADE ON PURPOSE for the criterion's `one run against a deliberately broken control`. It is strictly stronger: it shows the order came from THE DECLARATION rather than from anything else in the tree, where a hand-written sorted rival only shows that some other function behaves differently.",
          ],
        },
        {
          test: "An OPTIONAL peer still orders the producer first. devDependencies create NO edge -- A devDepending on B while B depends on A builds rather than being called a cycle. A nameless member, and a nameless root, are ordered rather than refused.",
          implementation:
            "Whatever the orderer needs to satisfy these, with each ruling's reason written at the site.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "f0283f7",
              message: "test(build-order): pin the three rulings an edge is read by",
              phase: "green",
            },
          ],
          notes: [
            "THE OPTIONAL-PEER RULING IS NOW MEASURED AND NOT ONLY REASONED, and the measurement is worse than the note predicted. With peers marked optional skipped, the optional-peer arm reddens AND THIS REPOSITORY'S OWN ORDER DOES NOT MOVE -- still root, completion-path, hover-wordnet. The graph loses every edge it has and the answer degenerates to the tie-break while looking exactly as it does now, so no arm asserted against this checkout could ever have seen it.",
            "THE devDependency RULING, MEASURED WITH THE FIELD COUNTED: buildOrder(repoRoot) comes back EMPTY -- the root devDepends on both handlers and both depend back on it, so every node is inside a cycle. Three arms redden, one of them the node-set reading that exists precisely so an empty answer cannot pass. That is the state the preload would have been in.",
            "RULING, AND IT IS THE LANDMINE THAT WOULD HAVE MADE THE WHOLE ITEM VACUOUS: `peerDependenciesMeta.optional` DOES NOT DROP THE EDGE. The flag buys installability while tsudoi is unpublished and says nothing about compilation -- and dropping optional peers leaves THIS repository's graph with ZERO EDGES, so the order degenerates to the tie-break and the alphabet comes back wearing a topological sort's clothes.",
            "RULING, DECIDED FROM WHAT IS ON DISK: devDependencies create no edge. The root devDepends on both handlers and both handlers peer-depend on the root, so INCLUDING them makes today's graph hold two 2-cycles, the orderer throws, and the throw lands in the `bun test` PRELOAD -- the exact inverse of `it goes in green`. Substantively: the root's published artifact is not compiled against either handler, so a devDep edge would order a build against a dependency the build does not have. THE COST IS ACCEPTED AND NAMED: a member devDepending on another member for its TESTS gets no ordering guarantee.",
            "A NAMELESS NODE IS TOLERATED RATHER THAN REFUSED, and the reason is a test that would otherwise go green-looking while measuring a different function: the name guard runs in the FIFTH CHECK, after the preload, so an orderer that threw on a nameless node would abort `bun test` before that guard could speak -- and the existing arm for it would stay red, still containing the word `name`, now reddened by the wrong function.",
          ],
        },
        {
          test: "A cycle fails, and the message names BOTH packages and the declaration that closes it; the same tree with one declaration removed builds.",
          implementation: "The cycle refusal, landing only after the acyclic arms above hold.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "ce7ed5b",
              message: "feat(workspaces): refuse a cycle instead of picking one of its packages",
              phase: "green",
            },
          ],
          notes: [
            "THE RED BEFORE THE REFUSAL EXISTED IS RECORDED, because it is the reason the fallback could not be left: the orderer returned an array holding the ROOT ALONE and no error at all -- two packages silently dropped from a sequence a caller was about to build from.",
            "WHAT THE MESSAGE SAYS, MEASURED BY READING IT: `@scope/left and @scope/right need each other, so no order builds either one against something that exists: packages/left/package.json names `@scope/right` in `dependencies`; packages/right/package.json names `@scope/left` in `dependencies`. Delete one of those declarations, or move it to `devDependencies`, which is deliberately not a build edge.` The walk is trimmed to the cycle, so a package merely BLOCKED by one is not named as though it were at fault.",
            "A CYCLE THROWS RATHER THAN FALLING BACK TO SORTED: a cycle is unbuildable, and the alternative is silently picking one and letting a package compile against an absent or stale artifact -- the class this story exists to end. SIZED DELIBERATELY BECAUSE THE THROW LANDS IN THE PRELOAD: it must be reachable only from a state this repository can never be in, which the byte-identical-order arm is what establishes.",
          ],
        },
        {
          test: "The value instrument: build the throwaway through the real entry point, then read the CONSUMER'S OWN EMITTED DECLARATION -- it says `dist` when it compiled against the built artifact. Control: the same tree minus the declaration says `src`.",
          implementation:
            "Rewire `prepareWorkspace` to loop the derived order, linking only for non-root nodes. Rewrite the `THE ROOT IS BUILT FIRST` comment in the same commit, because the conclusion survives and THE MECHANISM INVERTS.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "d57c329",
              message:
                "feat(workspaces): build in the derived order and read which file a consumer got",
              phase: "green",
            },
          ],
          notes: [
            'THE RED AND THE GREEN ARE BOTH VALUES OUT OF THE CONSUMER\'S OWN .d.ts. Against the un-rewired builder the arm reported `export declare const SAW: "src";` -- the consumer, built first because it sorts first, compiled against the producer\'s SOURCE through the `default` arm AND EXITED 0, with the builder raising nothing and a dist/ left behind. With the order derived, the same tree emits `"dist"`. THE CONTROL IS THE SAME TREE MINUS THE DECLARATION and it emits `"src"` at exit 0, which is the whole demonstration that no exit code answers this question.',
            "THE PRODUCER'S TWO FILES ARE THE INSTRUMENT: its build config compiles a directory declaring the literal type `dist` while its `default` arm points at a source declaring `src`, so the compiler NAMES the arm that answered. The node_modules entry joining consumer to producer is written by the fixture in BOTH arms, so resolution is identical and the declaration is the only difference.",
            "AN EXIT CODE CANNOT ANSWER THIS AND THAT IS MEASURED, NOT FEARED: the probe read EXIT 0 under both member configs from a consumer compiled against the producer's SOURCE, through the `default: ./src/*.ts` arm. So the reading is WHICH FILE, taken as a value out of an artifact. It works because the consumer's build is itself a step inside the loop, so the reading is taken DURING the ordering rather than after everything is built. The dist ABSENT state is the subject and PARTIAL is not: in PARTIAL the compiler reads source LEGITIMATELY, and a source marker there indicts nothing.",
          ],
        },
        {
          test: "RED TODAY: no entry reachable from a throwaway probe's node_modules resolves into this checkout outside its node_modules. Paired with: the compiler and the type packages ARE still reachable.",
          implementation:
            "Replace the wholesale symlink in test/helpers/typecheck.ts with a per-package mirror whose exclusion predicate is read off `realpath`, so the entry the move will create is dropped WITH NO EDIT.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "1519aa2",
              message: "refactor(test): name the harness step that decides what a probe can reach",
              phase: "refactoring",
            },
            {
              hash: "80517a3",
              message: "fix(test): stop handing every probe a route into this checkout",
              phase: "green",
            },
          ],
          notes: [
            "THE RED, MEASURED AND NAMING BOTH ROUTES: a probe's node_modules reached /packages/tsudoi-hover-wordnet and /packages/tsudoi-completion-path. The green half of the pair -- the compiler and the type packages still reachable -- passed BEFORE the change too, which is what makes it a control on the mirror rather than a restatement of it.",
            "THE PREDICATE READS `realpath` AND THE BOUNDARY IS node_modules RATHER THAN THE CHECKOUT, decided from what is on disk: every installed package resolves into node_modules/.bun, which IS inside the checkout, so `outside the checkout` would have dropped the entire install. Only a workspace link leaves node_modules.",
            "A DEFECT THE FIRST VERSION SHIPPED WITH, CAUGHT IN REVIEW AND MEASURED RATHER THAN REASONED ABOUT: reading `realpath` means the mirror TOUCHES every entry, and the wholesale symlink it replaced touched none -- so a DANGLING entry, which could not have mattered before, crashes it. Staged by pointing a `node_modules/@atusy` entry at a path that does not exist: without the guard, test/probe-routes.test.ts goes 0 pass / 3 fail with ENOENT raised inside the mirror, so the FIRST failure of every probe-using test in the suite would be an error about node_modules rather than about the probe; with it, 3 pass / 0 fail. THE STATE IS ROUTINE HERE -- the root's workspace links are RELATIVE and dangle the moment a member directory moves, which is sprint 50's recorded finding and the next sprint's whole subject. Dropped rather than reported, on this repository's existing ruling that an entry resolving to nothing PROVIDES nothing.",
            "`linkRootPackage`'s MEASURED BLOCK WAS REWRITTEN IN THIS COMMIT AND NOT IN THE LAST SUBTASK, WHICH IS WHERE THE PLAN PUT IT. The subject dies HERE -- this is the commit that closes the wholesale symlink -- and a comment asserting a mechanism the code denies may not survive even one commit. What replaced it keeps the finding as history and states what still makes a root entry dangerous: everything walking up out of this checkout finds it, and only one of those things has been closed.",
            "THE HAZARD HAS A SUBJECT TODAY, READ AND NOT ASSUMED: the root's entries for both handler packages RESOLVE, so every throwaway probe silently holds a working route to a package it never installed. AND A SECOND DEFECT IN THE SAME LINE: because the probe's only node_modules IS THE REPOSITORY'S, shared and concurrent, A PROBE CANNOT STASH A ROUTE AT ALL without damaging the checkout for every other test -- which is the mechanical reason this cannot be closed by letting the probe delete an entry.",
            "BOTH HALVES OF THE PAIR ARE REQUIRED: without the green half, a mirror that accidentally dropped a declared dependency reddens for an apparatus reason and looks identical to the finding.",
          ],
        },
        {
          test: "Per consumer class: the perturbed probe is RED naming the specifier, and the unperturbed probe is GREEN. A probe importing a package the throwaway never installed is now unresolved where it resolved before.",
          implementation:
            "None beyond the mirror; the sweep records, PER FILE, whether that consumer's perturbation had a second route and why.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "29848de",
              message:
                "test(probe-routes): read the closure through the compiler, and close the second site the sweep found",
              phase: "green",
            },
          ],
          notes: [
            "THE SWEEP NEEDED TWO PERTURBATIONS AND NOT ONE, WHICH THE FIRST RUN IS WHAT TAUGHT IT. P1 = `exports` deleted from the manifest the probe copies; P2 = the src/ symlink not created. MOST PROBES NAME A RELATIVE PATH RATHER THAN THE PACKAGE, so under P1 alone they are GREEN FOR WANT OF A SUBJECT -- which is the reading that would have been written up as `no second route` if only P1 had been run. Every consumer below is reported under the perturbation that has a subject for it.",
            "PER CONSUMER, EACH WITH ITS PAIR. (1) test/published-specifier.test.ts -- P1: 2 arms red, TS2307 naming `@atusy/tsudoi-language-server/types`; P2: red at the same specifier; unperturbed green. (2) test/published-artifacts.test.ts -- its one typeCheckProbe arm, `the in-repo arm cannot observe what the published arm checks`, asserts EXIT 0 and reddens under P1 and under P2 at Expected 0 / Received 1; unperturbed green. (3) test/notifications.test.ts -- P1 has no subject; P2: 12 red, TS2307 naming './src/lifecycle.ts' and './src/notifications.ts'; unperturbed green. (4) test/documents.test.ts -- P2: 2 red, TS2307 './src/types.ts'. (5) test/store-mutation.test.ts -- P2: 3 red, same specifier. (6) test/client-capabilities.test.ts -- P2: 4 red, same specifier. (7) test/workspace-folder-store.test.ts -- P2: 3 red, same specifier. (8) test/document-mutation.test.ts -- P2: 2 red, same specifier. Each of (4)-(8) green unperturbed.",
            "AND THE THREE `runTsc` CONSUMERS, WHICH TAKE NO node_modules FROM THE HARNESS AT ALL -- the helper only spawns a compiler at a directory. (9) test/workspace-members.test.ts drives throwaway roots that have no node_modules, so nothing is supplied to answer anything. (10) test/member-resolution.test.ts runs the compiler in the REAL members and CARRIES ITS OWN PERTURBATION -- `withRouteBroken` stashes the member's own link and asserts TS2307 with the subpath, then green once restored; that pair is in the file and green today. (11) test/package-shape.test.ts IS THE ONE THE SWEEP CAUGHT.",
            "THE SECOND SITE, AND READING ALONE WOULD NOT HAVE FOUND IT: test/package-shape.test.ts built its OWN throwaway node_modules, symlinking the repository's whole directory, TWICE -- so the closure at the harness did not reach it. One of those two probes has this package's route as its very SUBJECT (`with no mapping the same subpaths answer from the built artifact`), which is where a second route lies rather than merely sits, and after the move an installed entry for tsudoi would answer the specifier the probe's own manifest is supposed to. Both now take the mirror. PERTURBED by removing that probe manifest's `exports`: that arm alone reddens. UNPERTURBED: the file is green.",
            "THE COMPILER-LEVEL PAIR THAT SAYS WHAT THE CLOSURE BOUGHT: a probe importing `@atusy/tsudoi-hover-wordnet` -- a package the throwaway never installed -- USED TO RESOLVE, measured with the wholesale symlink restored, at EXIT 0 with EMPTY OUTPUT. It is now TS2307 naming that specifier, beside an installed dependency that still resolves; no apparatus failure produces that combination.",
            "THE PO WILL REFUSE A SWEEP REPORTED AS `CONSUMERS REVIEWED` OR AS A COUNT. Each consumer is named with its pair. AND THE HONEST STATEMENT ABOUT THE ONE THAT MATTERS MOST: the exports-deletion control is NOT answerable by a second route today, because no root entry for tsudoi exists -- it becomes answerable THE DAY THE MOVE LANDS, by construction of the ruling that the root declares the dependency. That is why this closure precedes the move.",
          ],
        },
        {
          test: "None -- the suite is the pair.",
          implementation:
            "Rewrite the measured block that cited the wholesale symlink as its reason, record the decision about the second construction of the node set, and write the tie-break-is-not-the-order reason at BOTH sites.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "9b723f3",
              message: "docs(workspaces): say at both sorting sites which one is the build order",
              phase: "refactoring",
            },
          ],
          notes: [
            "ONE ITEM WAS DELIVERED EARLIER THAN THIS SUBTASK AND SAYS SO: the `linkRootPackage` measured block was rewritten in the commit that closed the wholesale symlink, because a comment asserting a mechanism the code denies may not survive even one commit. Filing it here would have shipped that state deliberately.",
            "WHAT THE TWO SITES NOW SAY. `declaredMembers` keeps its sort with the reason that its callers -- the fifth check and the guards it runs -- want the same sequence twice running so `the first offender` means something, and ask nothing about what needs what. `buildOrder` says the tie-break is the FALLBACK and names the arm that forbids reading it as the answer. Neither site can be read without meeting the other's reason.",
            "THE SECOND CONSTRUCTION OF THE NODE SET IS A DECISION AND IS RECORDED AT THE ASSERTION: the order's own test rebuilds `[repoRoot, ...declaredMembers(repoRoot)]`, which looks like a tautology and is not one. What is asserted is the SEQUENCE; WHO THE MEMBERS ARE is a question `declaredMembers` already owns, and a hand-written list would answer it a second time, go stale at the next package, and redden this file for a reason that has nothing to do with an order.",
            "THE TIE-BREAK IS WHAT LETS A FUTURE READER CONCLUDE `THE SORT IS THE ORDER`, and the contradicting-sort arm is the only thing forbidding it -- so that arm may never be retargeted at a tree where the two orders agree. The member list keeps its own sort: its callers want a stable LIST, and a stable list and a build order are different questions.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE SPRINT GOES IN GREEN BY DESIGN, so the sprint's own tests are the only thing that can fail -- and the PO accepts on READINGS rather than colours. Today's constructed order already equals the derived one, which is what lets the ordering land with no behaviour change and stops the move from being the thing that first exercises it.",
        "THE PO'S REFUSAL, EVERY CHECK GREEN: the second-route hazard closed PER PROBE instead of AT THE HARNESS. Each enumerated consumer producing its predicted failure while the helper still hands the NEXT probe a second route is exactly the outcome that is green today and walks into the move intact, where it becomes the reason a control lies.",
        "THE THIRD CHECK'S TOOL WAS LOST AND REBUILT MID-SPRINT, DISCLOSED BECAUSE A REVIEWER CANNOT SEE IT AND IT IS NOT THE REPOSITORY'S. This session reaches `oxfmt` through a shim running `bunx oxfmt`, whose cached install went PARTIAL -- tinypool present, the file its manifest names absent -- and every invocation died in node's resolver rather than reporting a format. Clearing the cache made it worse: the re-download never completed, so the check was unrunnable for a while. REBUILT from bun's own package cache (oxfmt 0.61.0, its darwin-arm64 binding, tinypool 2.1.0) with the shim repointed at that install, and the check is still run BARE, as the Definition of Done spells it. Nothing in the repository was edited for this. WHY THE VERDICT DID NOT MOVE WITH THE INSTRUMENT, which is the question the swap raises and the cache held a second version to make sharper: the rebuilt one's FIRST run reported every matched file correctly formatted on a tree the pre-breakage tool had formatted and re-checked. Two versions disagreeing about this codebase would have shown up as issues in exactly that run.",
        "THE ONE RED THAT WAS NOT THE INCREMENT, AND IT IS THE FLAKE SPRINT 50 FILED: `a completion handler that throws after yielding keeps the chunk it already sent` failed once under deno in a full run and passed alone moments later, and the next full run was clean. Recorded rather than diagnosed -- this sprint touches no code that test runs.",
        "TWO SUBSTITUTIONS THE DEVELOPER MADE AGAINST THE CRITERIA, STATED AS DECISIONS RATHER THAN LEFT AS MISSES: the criterion's `deliberately broken control` is served by the same tree with one declaration deleted, which is stronger because it shows the order came from THE DECLARATION; and `read as a value` is served by the dependent's own emitted declaration, because the builder inherits stdio and no diagnostic is capturable through it.",
      ],
    },
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
  sprint: {
    number: 52,
    pbi_id: "PBI-56",
    goal: "tsudoi is acquired by `bun install` the same way a stranger's project acquires it, and the CLI still starts and answers under Bun and Deno, from a checkout and from an installed tarball.",
    status: "in_progress",
    subtasks: [
      {
        test: "A member whose source carries a type error is built through the real entry point in a SPAWNED child with piped stdio, and the failing run's own output names the member and the file TOGETHER. Arms: the same tree without the error writes the same artifact at the same path with the same bytes, so the invocation change is not an artifact change; and the degenerate control -- the old invocation on the same tree -- prints a bare `src/x.ts` and names no member.",
        implementation:
          "The builder runs the compiler from the ROOT with the member's config named relatively, so the compiler's OWN diagnostic carries the member. Not a wrapper that prints the member on another line: the criterion asks for them together, and with three src/ directories a wrapper leaves the joining to the reader.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "e16dfba",
            message:
              "feat(workspaces): build from the root so a failing build names whose source it was",
            phase: "green",
          },
        ],
        notes: [
          "ONE CALL SITE CLOSES BOTH READERS, which is why this is an invocation change and not a report: check 1's preload and check 5 own the crux through the SAME `execFileSync`, and it throws before the per-member type check can speak. Verifiably not an artifact change -- no member config uses `extends`, so its rootDir/outDir/include resolve against the config file and not the cwd.",
          "THE RED WAS TAKEN BEFORE THE CHANGE AND IT IS THE CRUX'S OWN TEXT. Through the REAL fifth check spawned with piped stdio, over a throwaway member holding a type error, stdout was exactly `src/index.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.` -- the file and no member. After the change the same run prints `packages/emitter/src/index.ts(1,14)`. AC2 IS THEREFORE MET AT ITS NARROWED READING, and the gap sprint 51 filed as still standing is closed.",
          "THE OTHER TWO ARMS WERE GREEN BEFORE AND AFTER, which is what makes them arms rather than restatements: the degenerate control -- the OLD invocation, spelled in the test rather than kept in production -- prints `src/index.ts` and does NOT contain the member's name; and the same tree without the error emits byte-identical dist/ either way, so the invocation change is measured not to be an artifact change instead of argued from `extends` being absent.",
          "NO `extends` ANYWHERE, READ RATHER THAN ASSUMED: grepped across both members' tsconfig.json and tsconfig.build.json and the root's two configs -- not one occurrence.",
        ],
      },
      {
        test: "The handler enumeration equals the member enumeration BYTE FOR BYTE TODAY, and in a throwaway three-member tree the member declaring no peer on tsudoi is excluded while the two that do are returned in order. Plus the non-empty pair, plus the falsifier that a tsudoi-shaped member is not returned.",
        implementation:
          "A `handlerMembers` enumerator beside `declaredMembers`, then a PER-SITE re-read of every caller -- each repointed or left with a written reason. Never applied wholesale.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "fa13f56",
            message:
              "feat(workspaces): tell the handlers from the members before the framework becomes one",
            phase: "green",
          },
        ],
        notes: [
          "THE LARGEST RISK IN THE SPRINT AND IT IS CLOSED BEFORE ANYTHING MOVES: ten test files would silently gain tsudoi as a third HANDLER. One of them asserts every member declares a peer on tsudoi, WHICH TSUDOI CANNOT DO FOR ITSELF; another demands a pack-and-install route and a root-README link for a package that is not a handler; another scans a member's src/ for the completion method and would begin scanning tsudoi's own.",
          "THE ENUMERATION'S NARROWING IS FORCED RATHER THAN CHOSEN, which is the PO's ratification: two of the four facts a member README must state are unstatable by tsudoi about itself.",
          "THE PREDICATE SPELLS NO PACKAGE NAME, decided while writing it and it is what makes the answer survive the move: a handler is a member that NAMES ANOTHER PACKAGE OF THIS WORKSPACE in one of the fields `buildOrder` reads an edge out of, with the ROOT counted as such a package. Today the members declare the root; tomorrow they declare a sibling; the answer is the same two either way. A filter naming the framework would have been a second home for the published name AND would answer `there are no handlers` -- every loop green and empty -- the day that name changed.",
          "MEASURED AGAINST THE DEGENERATE IMPLEMENTATION rather than argued: with `handlerMembers` returning every member, 2 pass / 3 fail -- the three throwaway-tree arms redden and the two arms reading THIS repository stay green, correctly, because today the two enumerations are equal by construction. So the file is not satisfied by an author's intention.",
          "THE SITE COUNT AND THE SPLIT, RECORDED AS A DISPOSITION PER SITE RATHER THAN A NUMBER MOVED. Narrowed to handlers: test/packed-members.test.ts, test/completeness-ruling.test.ts, test/member-resolution.test.ts, test/readme.test.ts, test/optional-peer-premise.test.ts, test/helpers/install.ts. Kept over every member WITH THE REASON AT THE CALL: scripts/typecheck-workspaces.ts (the only thing type-checking an excluded package -- this enumeration may never narrow), buildOrder (a package left out is a package never built), test/build-order.test.ts, test/published-artifacts.test.ts (`no package FROM THIS WORKSPACE` -- the framework is one of them), and BOTH package-shape sites.",
          "ONE KEPT SITE IS DOING MORE WORK THAN IT LOOKS: test/package-shape.test.ts's `the repo depends on every member package ... at the version each member carries` also asserts the member is NOT one field up. Left over every member, that is where the ruling `the root declares tsudoi in devDependencies and creates no build edge` becomes executable. Narrowing it to handlers would have deleted the assertion.",
        ],
      },
      {
        test: "A quickstart marker whose token equals a declared member's basename is REFUSED, naming the marker and both directories it would denote; the unperturbed README stays green with its existing arms.",
        implementation:
          "The marker's vocabulary changes so that no quickstart token can denote two directories, and the directory a reader is SHOWN is the directory the marker OBEYS.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "bc11c8c",
            message: "test(readme): refuse a quickstart token that denotes two directories",
            phase: "green",
          },
        ],
        notes: [
          "RULED AS A PROPERTY AND NOT AS A SPELLING, because the two marker families use different vocabularies: one is checkout-relative, the other names a SIBLING resolved through the checkout's own basename inside a staged parent. The PO declined to hand over a string they could not verify resolves.",
          "THE REFUSAL LANDS NOW AND THE VOCABULARY CHANGES IN THE MOVE, AND THAT ORDER IS SATISFIABLE AS A COMMIT ORDER -- which is the distinction sprint 50's retro filed. No member basename collides today, so the guard goes in green; the move CREATES the colliding member, so it must change the marker in the same commit or redden. `guard first` here constrains the commit boundary and can.",
          "THE COLLIDING MEMBER IS ENUMERATED AND NOT NAMED, so the refusal keeps its subject through every rename; the perturbation rewrites a real marker's token to a real member's basename rather than to a hand-written string.",
          "AND THE EXISTING MARKER-ONLY REFUSAL GAINED A READING OF WHICH REFUSAL FIRED. Both arms perturb the same attribute, and both messages echo the substituted token -- so `toThrow(token)` alone is satisfied by either. Each now asserts its own message.",
          "WHAT THE VOCABULARY BECOMES, DECIDED HERE AND EXECUTED IN THE MOVE: quickstart step 1's directory becomes the member inside the checkout, `tsudoi-language-server/packages/tsudoi-language-server`, which is a token no member's basename equals. The reader is SHOWN that directory and the marker OBEYS it. Step 2's `bun install ../tsudoi-language-server/tsudoi.tgz` is untouched, because `bun pm pack` inside a member writes the tarball to the WORKSPACE ROOT.",
        ],
      },
      {
        test: "Today green and byte-identical. Falsifier in a throwaway where the sentinel is deleted from the LOCATED manifest: both members are reported. Control: a different manifest losing it does not move the reading.",
        implementation:
          "The premise locates tsudoi's manifest by WHICH PACKAGE DECLARES THE PUBLISHED NAME rather than by the checkout root.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "0fc7159",
            message:
              "test(premise): read the sentinel off the manifest whose edit permits publication",
            phase: "green",
          },
        ],
        notes: [
          "PRE-MOVE HALF ONLY. The differential the criterion actually asks for -- deleting the sentinel from the MEMBER's manifest reddens both members AND deleting it from the ROOT's alone does not -- is post-move, and today's implementation produces exactly the opposite pair.",
          "THE DIFFERENTIAL DID NOT HAVE TO WAIT FOR THE MOVE, and building it in a throwaway is what let the pre-move half be more than a rename: the locator reads a ROOT ARGUMENT, so a workspace shaped like the one this repository is becoming -- published name on a MEMBER, private workspace root -- is constructible today. Both halves of the criterion's pair are asserted there, before the move exists to disarm them.",
          "MEASURED AGAINST THE DEGENERATE -- `publishingManifest` returning join(root, 'package.json'), which is exactly the reading being replaced: 4 pass / 3 fail. The three new arms ALL redden and the four live ones stay green, and the reddening is the opposite pair the PBI predicted (falsifier silent, control firing).",
          "A COUNT OTHER THAN ONE IS REFUSED RATHER THAN RESOLVED, added while writing it: a locator that quietly fell back to the root when it found no match would be the old reading wearing the new one's name, and no arm could tell them apart. Its own arm asserts the throw names the published name.",
        ],
      },
      {
        test: "Measurement only, recorded in the dashboard, no production edit.",
        implementation:
          "Five uncited facts, measured before anything is built on them: whether bun links a workspace member for the PLAIN range the handlers actually spell (sprint 51 measured `workspace:*`, which is not what is on disk); what `bun install` does when two packages in one workspace claim one name; whether publishing from inside a member consults anything but that member's manifest; whether bun hoists a REGULAR workspace dependency into the root; and a re-measurement IN THIS TREE that member-to-member resolution works natively, since that reading was taken elsewhere.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "ALL FIVE MEASURED IN THROWAWAY WORKSPACES ON THIS MACHINE, bun 1.3.13, NO PRODUCTION EDIT. Every reading below is an installer's or a publisher's own output, not an exit code read as a colour.",
          '(1) THE PLAIN RANGE THE HANDLERS ACTUALLY SPELL WORKS, which sprint 51 had measured only for `workspace:*`. A member declaring another member under `peerDependencies: {"@probe/framework": "*"}` with `optional: true` installs at exit 0 with NO warning, and the entry is written INTO THE DEPENDING MEMBER\'S OWN node_modules: `packages/handler/node_modules/@probe/framework -> ../../../framework`. RELATIVE, where `linkRootPackage`\'s is ABSOLUTE -- the dangle-on-moving-the-checkout mode INVERTS rather than disappears, re-measured here rather than carried across.',
          '(2) TWO PACKAGES CLAIMING ONE NAME HAS TWO ANSWERS AND ONLY ONE OF THEM IS LOUD, which is what settles PO Ruling 2 on measurement rather than on reasoning. TWO MEMBERS: bun REFUSES -- `error: Workspace name "@probe/dup" already exists`, naming both manifests with file and line, nothing installed. THE ROOT AND A MEMBER: bun says NOTHING AT ALL -- install exit 0, no warning -- and a third member\'s specifier resolves SILENTLY TO THE MEMBER. So the state the name guard cannot see is also the state the INSTALLER cannot see, and the ruling that the root takes a distinct private name is confirmed as refusing a state whose whole defect is that nothing reports it.',
          "(3) `bun publish` RUN INSIDE A MEMBER CONSULTS THAT MEMBER'S OWN MANIFEST AND NOTHING ELSE, which is the citation AC4's mechanism was missing. Member `private: true`, root `private: true`: `error: attempted to publish a private package`, exit 1, before anything is packed. Member's `private` DELETED, root STILL `private: true`: it PACKS (`packed 40B package.json`) and gets as far as `error: missing authentication`. The root's flag does not gate a member publish, so the sentinel had to move onto the member's manifest and a reading keyed on the root would have measured nothing.",
          "(4) BUN DOES NOT HOIST A REGULAR WORKSPACE DEPENDENCY INTO THE ROOT. A member declaring another member under plain `dependencies` gets the entry in its OWN node_modules and the root's holds only `.bun`. Same for the optional peer in (1). SO THE SECOND ROUTE IS A CONSEQUENCE OF THE ROOT'S OWN DECLARATION AND NEVER OF THE INSTALLER -- note 103's correction is confirmed, and the escape hatch the PO left unmeasured (examples/ becoming a package that declares tsudoi itself) WOULD work, since its entry would land in its own node_modules and not in the root's.",
          "(5) MEMBER-TO-MEMBER RESOLUTION WORKS NATIVELY, RE-MEASURED ON THIS MACHINE rather than carried from the reading taken elsewhere: (1) and (4) above are that re-measurement, and both entries were FOLLOWED TO THEIR TARGET rather than read as present.",
        ],
      },
      {
        test: "None new -- its pair is the whole Definition of Done plus every arm landed above. THE FIRST READING IS TAKEN IN THE MOVED-BUT-NOT-YET-INSTALLED TREE and recorded as failure text, with the shapes stated in advance, because that is the state the checkout is IN between two commits and sprint 51 measured that state CRASHING a helper rather than reddening a test.",
        implementation:
          "The move, one atomic commit: record the four existing node_modules entries FIRST so the post-install reading can say which route answered; move src/ and the build config into packages/tsudoi-language-server and write its manifest and tsconfig; strip the root to a private workspace root under its new name with tsudoi in devDependencies; DELETE each handler's hand-written entry explicitly and retire the linker; read the pre-install tree; install; follow every entry to its target; rewrite in the same commit everything the move falsifies; then the full Definition of Done.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "e8ddbcc",
            message:
              "refactor(workspace): make tsudoi a workspace member acquired by `bun install`",
            phase: "green",
          },
        ],
        notes: [
          "EACH HANDLER'S ENTRY MUST BE DELETED BY HAND AND THAT IS THE SILENT HAZARD OF THIS MOVE: those links are ABSOLUTE and point at the checkout root, so after the move they still RESOLVE -- to a directory that is no longer the tsudoi package -- and the linker's own `a directory that resolves is somebody's install` early-return makes it structurally unable to repair them.",
          "THE ROOT DECLARES TSUDOI IN devDependencies, RULED AND NOT DISCOVERED: the root ships nothing, is private forever, carries no build config after the move so the builder skips it, and already devDepends on both handlers. No production-install route exists anywhere in this repository, so devDependencies are always installed here -- the one fact that would have flipped it. CONSEQUENCE, and it is the redness filed as the derivation earning its keep: the derived order becomes root, tsudoi, then the two handlers, contradicting the sorted order, and the byte-for-byte arm is rewritten to EXACTLY THAT SEQUENCE, never to a set comparison.",
          "READING A, THE STATE THE NOTE ABOVE PREDICTED, MEASURED BEFORE ANYTHING WAS DELETED: manifests moved, entries untouched. Both handler entries STILL RESOLVED and their target's manifest read `@atusy/tsudoi-workspace` -- a directory that is no longer the tsudoi package. The fifth check exited 1 at the BUILD of packages/tsudoi-completion-path with TS2307 on all three subpaths, and thanks to subtask 1 the diagnostic named `packages/tsudoi-completion-path/src/completion.ts` rather than a bare `src/`. AND THE LINKER PROVED THE OTHER HALF BY ACTING: it early-returned on the stale entry exactly as its own comment says it must, and WROTE A NEW USELESS ONE beside it -- packages/tsudoi-completion-path/node_modules/@atusy/tsudoi-workspace -- because it links whatever the root manifest happens to be called.",
          "READING B, MOVED AND NOT YET INSTALLED, AND ITS FINDING IS THAT IT IS INDISTINGUISHABLE FROM READING A. No entry at all in either handler; the root's node_modules still holding only the two handlers, RELATIVE and resolving; and the fifth check printing THE SAME SIX LINES as reading A. `an entry that resolves to the wrong package` and `no entry at all` are ONE RED, which is precisely why the criterion asks that the entry be READ AND FOLLOWED rather than counted.",
          "AND `bun test` IN THAT STATE DID NOT DO WHAT SPRINT 51 PREDICTED, WHICH REFINES THAT PREDICTION RATHER THAN CONFIRMING IT. The preload's throw did NOT stop the run: bun reported `# Unhandled error between tests` and carried on, giving 105 pass / 340 fail / 12 errors across 53 files in 94s. So the state is worse than `nothing loads` -- one cause arrives under a wall of 340 symptoms, and the tsc diagnostic that names it scrolls past at the top.",
          "READING C, AFTER `bun install`, EVERY ENTRY FOLLOWED TO ITS TARGET AND ITS MANIFEST READ. packages/tsudoi-completion-path/node_modules/@atusy/tsudoi-language-server -> ../../../tsudoi-language-server; the same for hover-wordnet; and node_modules/@atusy/tsudoi-language-server -> ../../packages/tsudoi-language-server at the root, from the root's own devDependency. All three resolve to packages/tsudoi-language-server, whose manifest declares @atusy/tsudoi-language-server. RELATIVE where the retired linker's were ABSOLUTE -- the recorded inversion, confirmed in this tree rather than carried across. AC1 IS SATISFIED BY `bun install` ALONE and `linkRootPackage` is gone.",
          "THE DERIVED ORDER IS root, packages/tsudoi-language-server, packages/tsudoi-completion-path, packages/tsudoi-hover-wordnet, AND IT NOW CONTRADICTS THE ALPHABET ON THIS REPOSITORY -- read as a value before the arm was rewritten to it. The byte-for-byte arm was rewritten to exactly that sequence, never to a set, and gained `sorted !== derived` on the real tree, which the throwaway arms alone used to carry. It is also where the devDependencies ruling is checked: `dependencies` would order the framework before the root and redden this line, so no separate test asserts the field.",
          "WHAT `bun pm pack` DOES AFTER THE MOVE, THE FIRST-DAY MEASUREMENT PO RULING 3 ASKED FOR. In the member: exit 0, and THE TARBALL LANDS AT THE WORKSPACE ROOT, which is what keeps the README's `bun install ../tsudoi-language-server/tsudoi.tgz` true with no edit. At the CHECKOUT ROOT -- the muscle-memory route -- exit 0 as well, packing 169 files including this suite and scrum.ts, because the root manifest declares no `files`. Harmless (the root is private for ever) and recorded because it is silent, and because it is why step 1's directory change is load-bearing rather than cosmetic.",
          "THE SPAWN HELPER'S AMBIGUITY IS CLOSED BY SPLITTING THE NAME RATHER THAN BY REPOINTING IT: `repoRoot` is THE CHECKOUT (where a command runs, whose node_modules is borrowed, which workspace is enumerated) and a new `frameworkRoot` is THE PACKAGE (its manifest, src/, build config, dist/). Six helpers and test files were assigned one or the other by hand. AND ONE STAGED SHAPE IS DELIBERATELY NOT THE CHECKOUT'S: test/helpers/checkout.ts stages the PACKAGE ALONE with its manifest at the copy's root, because the examples there reach tsudoi by SELF-REFERENCE and need no node_modules -- which is exactly what lets those probes hold node_modules away. So the CLI's relative path became a parameter with two named spellings instead of one constant.",
          "THE GUARD'S `src/` SHAPES ARE A DECISION AND NOT A GLOB REPAIR. .oxlintrc.json's factory exemption now names packages/tsudoi-language-server/src/notifications.ts, and it is NOT widened to `packages/*/src/notifications.ts`: that would hand the same permission to every handler, which ships to strangers who cannot fix it. guard.test.ts's two framework shapes name the package; its `packages/probe/src/index.ts` shape still names none, because that one is about a class. So `a file under packages/ lints exactly as src/ did` now has EXACTLY ONE ASSERTED EXCEPTION.",
          "ATOMIC BECAUSE THE STATE IS REAL AND IS ENTERED ON PURPOSE: between the first edit and the install, every handler's specifier is answered by the wrong package or by nothing. `never leaves the tree in a state where nothing loads` is achievable at COMMIT granularity only; the bad state is entered once, deliberately, and READ.",
          "STEP 0, THE PRE-IMAGE, TAKEN BEFORE ANYTHING WAS TOUCHED, so the post-install reading can say WHICH ROUTE ANSWERED rather than report a colour. Four entries, each followed to its target and its package.json read. The ROOT's two are bun's and are RELATIVE: node_modules/@atusy/tsudoi-completion-path -> ../../packages/tsudoi-completion-path and node_modules/@atusy/tsudoi-hover-wordnet -> ../../packages/tsudoi-hover-wordnet, each resolving to the member declaring that name. Each HANDLER's one is `linkRootPackage`'s and is ABSOLUTE: packages/<handler>/node_modules/@atusy/tsudoi-language-server -> /Users/atusy/ghq/github.com/atusy/tsudoi-language-server/ (trailing slash), resolving to the checkout root, whose manifest declares @atusy/tsudoi-language-server. THAT LAST FACT IS THE HAZARD IN ONE LINE: the target is the CHECKOUT ROOT, which after the move is a different package under the same path, so the link goes on resolving and stops being right.",
        ],
      },
      {
        test: "Deleting the publish sentinel from the MEMBER's manifest reddens both members; deleting it from the ROOT's alone does not.",
        implementation:
          "None if the premise was already retargeted; if an edit is needed here, it was located wrongly.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "NO EDIT WAS NEEDED, which is the outcome that says the premise was located rightly a subtask early. MEASURED ON THE REAL TREE, both halves, each restored afterwards. Deleting `private` from packages/tsudoi-language-server/package.json: 5 pass / 2 fail, the offender list naming packages/tsudoi-completion-path AND packages/tsudoi-hover-wordnet by directory, plus the README-agreement arm reddening because the document still says unpublished. Deleting `private` from the ROOT's manifest alone: 7 pass / 0 fail, the reading unmoved. That is exactly the pair the criterion asks for and exactly the opposite of what the pre-move implementation produced.",
          "AND THE MECHANISM BEHIND IT WAS CITED FIRST RATHER THAN ASSUMED (subtask 5): `bun publish` inside a member consults that member's own manifest and nothing else -- private there refuses before packing, private only at the root does not.",
        ],
      },
      {
        test: "The entry is READ AND FOLLOWED, not merely present. Then, with the root entry and any member-local copy STASHED, removing a handler's declaration gives the unresolved-module failure naming that handler's own source and the tsudoi subpath; restoring it goes green.",
        implementation:
          "The vacuity sweep across the three wholesale node_modules symlinks outside the harness closed last sprint, each of which now hands its tree a RESOLVING tsudoi entry: per site, the mirror treatment or a written reason why the second route cannot answer that site's question.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "5834203",
            message:
              "docs(test): say per site why the new route into this checkout answers nothing",
            phase: "green",
          },
        ],
        notes: [
          "EVERY CONTROL THAT PERTURBS A MEMBER'S OWN ROUTE STATES IN ADVANCE WHAT A DEGENERATE IMPLEMENTATION PRINTS AND IS RUN ONCE AGAINST A DELIBERATELY BROKEN CONTROL. This is the sprint's second standing refusal and it is not the byte-for-byte one: that protects an EXISTING assertion from being weakened to fit the move; this protects the NEW ones from being unable to fail.",
          "THE STANDING REFUSAL BOUND SOMETHING REAL, AND IT WAS THE FIRST THING THE MOVE BROKE. test/member-resolution.test.ts's positive arm perturbs a member's own link and expects TS2307; after the move it read `packages/tsudoi-completion-path: ` -- EXIT 0, EMPTY OUTPUT -- because the ROOT's entry answered. The arm was rewritten to ENUMERATE both routes and stash both, and the disarmed reading is KEPT AS ITS OWN ARM rather than as a comment: if the root ever stops declaring tsudoi, that arm reddens and says so, where a comment would go on describing a hazard nobody has.",
          "AC1'S FALSIFIER RUN AT FULL STRENGTH, BY HAND, AND IT FOUND ONE THING NOBODY HAD PREDICTED. Removing packages/tsudoi-completion-path's peer declaration and re-installing DOES NOT REMOVE THE MEMBER-LOCAL ENTRY -- bun leaves the stale link in place, so the handler's own check still exits 0 with the declaration gone AND with the root entry stashed. Only with the member-local copy stashed TOO does it fail: exit 1, TS2307 naming packages/tsudoi-completion-path/src/completion.ts and each of the three subpaths. Restoring the declaration and re-installing: the relative entry is rewritten and the check exits 0. So `any member-local copy` in the criterion's stash list is not belt-and-braces -- it is the route that answers.",
          "THE THREE WHOLESALE SYMLINKS, DISPOSITIONED PER SITE. test/helpers/checkout.ts is the only one where the new entry could have answered, and it was MEASURED rather than reasoned about: inside the staged copy `import.meta.resolve` answers THE COPY'S OWN dist/deps/types.js, because package self-reference beats the borrowed entry -- and the discriminating arm runs with no node_modules at all, where there is nothing to disarm it with. test/helpers/install.ts's pack stage: the borrow answers nothing because no file in the package names the package by specifier, and the CONSUMER beside it borrows only @types, which is the one that would have mattered. test/helpers/readme.ts: the borrow goes to the checkout and never to the reader's project, where every step after the pack runs.",
        ],
      },
      {
        test: "The existing cross-runtime and tarball arms, read as the pair -- the exports arms are relative to the manifest that just moved, and a broken arm reddens the deno route first.",
        implementation:
          "The documented pack command's TEXT does not change and its DIRECTORY does; the tarball still lands at the workspace root, so the install line a human follows stays true -- and that non-change is load-bearing prose a reader is owed rather than a coincidence.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "THE FIVE DEFINITION-OF-DONE CHECKS MUST KEEP WORKING FROM THE CHECKOUT ROOT, for the reason bunfig.toml records. What `bun pm pack` at the checkout root does after the move is a first-day measurement rather than a gate: it is the muscle-memory route, and it is the same mechanism the publish sentinel rests on.",
          "LANDED IN THE MOVE'S OWN COMMIT, because the README is executed and a marker the move falsified would have reddened there rather than later. The command's TEXT is unchanged -- `bun pm pack --filename tsudoi.tgz` -- and its DIRECTORY is now the member; the reader is SHOWN `tsudoi-language-server/packages/tsudoi-language-server/` and the marker obeys that token, which no member's basename equals. Step 2's `bun install ../tsudoi-language-server/tsudoi.tgz` is untouched.",
          "AND THE NON-CHANGE IS WRITTEN DOWN AS PROSE A READER IS OWED rather than left as a coincidence: the README now says the tarball does NOT land in that directory, that a member pack writes to the workspace root, and what the same command at the checkout root does instead. That is the handler READMEs' own sentence, re-measured for tsudoi-as-member.",
          "THE STAGE HAD TO BECOME A WORKSPACE, which the tarball's landing place forces rather than tidiness: the quickstart helper now stages the workspace root's manifest plus packages/tsudoi-language-server/{package.json,tsconfig.build.json,src}, because `bun install ../tsudoi-language-server/tsudoi.tgz` is only true of a tree where the framework really is a member. Staging its three files at the checkout root would have put the tarball in the same place BY ACCIDENT and stopped testing the arrangement the document describes. The `no step runs in the checkout` guard widened from equality to containment, and is still a refusal rather than a later pack failure.",
          "THE CROSS-RUNTIME AND TARBALL ARMS (AC5) ARE GREEN, which is the reading that says the exports map's arms survived relocating the manifest that carries them -- a broken arm reddens the deno route first, and the deno route is green from a checkout and from an installed tarball alike.",
        ],
      },
      {
        test: "A named subtask rather than a first-run discovery: the README test builds its expectation from the ROOT manifest's `exports`, which the move deletes -- so it would throw AT MODULE LOAD, taking the comparison and its permanent pair down with it rather than failing an assertion.",
        implementation: "Repoint it at the manifest that carries the published surface.",
        type: "behavioral",
        status: "completed",
        commits: [],
        notes: [
          "IT THREW EXACTLY AS FILED, WHICH IS WHY IT WAS A SUBTASK: `TypeError: undefined is not an object (evaluating Object.keys(...).exports)` at module load, 0 pass / 1 fail / 1 error for the whole file -- one error where two tests should have spoken. Repointed at the framework's manifest and the file went back to 98 pass.",
          "AND A SECOND FILE HAD THE SAME SHAPE AND WAS NOT NAMED ANYWHERE: test/package-shape.test.ts reads the root manifest ONCE at module scope and uses it at seventeen sites, some about the PUBLISHED SURFACE and some about the WORKSPACE. Repointing that reader wholesale onto the member -- the obvious fix -- would have carried `workspaces`, the root's devDependency on every member, and the licence pair onto the wrong manifest, silently and green either way. It was SPLIT into two consts and every site assigned by hand, which is subtask 2's per-site discipline applied to a file no refusal names.",
        ],
      },
      {
        test: "None -- the suite is the pair.",
        implementation:
          "The rewritten-not-deleted sweep, each measurement dispositioned rather than swept: the linker's failed-spelling record moves to this dashboard as history because its function is deleted; the absolute-link reading is RE-MEASURED, because bun's link is relative and the dangle mode inverts; bunfig's causal clause and first-failure shape are RE-MEASURED; the two package-shape records lose their subject and are rewritten with the weakening DECLARED; the redundant-covers reading is retired with its reason; the lint override globs and the spawn helper's root ambiguity are DEFECTS and are rewritten; the published-surface note moves with the exports map; CLAUDE.md's build model is rewritten after re-measurement, because whether a fresh checkout's root type check still fails is now an open question.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "THE C4 RESIDUE IS CARRIED AS A COMMENT AND DELIBERATELY NOT AS A TEST. Root importers read dist when dist is PRESENT; in the ABSENT and PARTIAL states the compiler alone falls through to source and exits 0, and PARTIAL is entered CONCURRENTLY by this suite's own pack tests. A TEST THAT PINNED THE FLIP WOULD BLESS IT -- it would pass while the residue persists, specifying rather than detecting it, and would make the later fix look like a regression. The choosing test the PO gave: does the form FAIL when someone closes the residue? If yes, it is blessing a defect.",
          "EVERY MEASUREMENT DISPOSITIONED, ONE LINE EACH. `linkRootPackage`'s whole record: MOVED HERE as history, because its function is deleted -- see the readings above, and the note it left behind in test/workspace-members.test.ts where its test used to be. The absolute-link reading: RE-MEASURED and INVERTED -- bun's links are relative, so the failure mode is now `a member directory moves inside the checkout` rather than `the checkout moves`. bunfig.toml's causal clause: RE-MEASURED and REPLACED, because the mechanism it named (a `paths` mapping intercepting a self-reference) no longer exists; its first-failure shape RE-MEASURED and unchanged, with the reason it holds now different. The two package-shape records: REWRITTEN WITH THE WEAKENING DECLARED. member-resolution's `name and paths are redundant covers`: RETIRED IN PLACE with the reason, and replaced by the stronger footing the move gives the same conclusion. The lint override globs and the spawn helper's root ambiguity: DEFECTS, rewritten. The published-surface note: MOVED with the exports map, and joined by two new keys carrying the sentinel's reason and the no-README ruling.",
          "THE WEAKENING, STATED AS A WEAKENING AND NOT AS A CHANGE OF SUBJECT: `the repo\'s type check resolves the published subpaths to source` is gone and NOTHING REPLACES IT. The root check now reads dist, like a consumer. That was Dev\'s ~70% estimate arriving as fact -- an honest target REMOVED, which is what the move buys and what it costs, and the test that carried it says so in its own docstring rather than quietly asserting the new reading.",
          "AND ITS NEIGHBOUR WENT VACUOUS RATHER THAN RED, WHICH IS THE HARDER ONE TO CATCH: `every specifier mapping this config declares is one the check really matches` compares two empty sets once there are no mappings -- green, permanently, measuring nothing. It was RETIRED AND REPLACED by `no specifier the root check resolves is answered by a mapping`, read off tsc\'s own trace so a mapping arriving through `extends` is covered, which makes the C4 ruling executable and gives the ROOT the refusal `refuseMemberMappings` already gives every member.",
          "THE C4 RESIDUE, MEASURED AND WRITTEN IN FOUR PLACES AND PINNED IN NONE. With every dist/ removed, `tsc --noEmit` exits 1 with EXACTLY TWO errors, both at examples/tsudoi.config.ts and both naming HANDLER packages -- and `--traceResolution` shows `@atusy/tsudoi-language-server/types` resolving to packages/tsudoi-language-server/src/types.ts through the `default` arm, silently. With dist PRESENT, bun and deno both answer packages/tsudoi-language-server/dist/deps/types.js, read off `import.meta.resolve`, and tsc answers dist too. So C4\'s positive reading holds in this tree and the flip is real, undetected, and named in bunfig.toml, test/helpers/build.ts, CLAUDE.md and README.md.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "TSUDOI GETS NO README AS A MEMBER AND THE MEMBER ENUMERATION NARROWS TO HANDLER PACKAGES. A prose-only pointer is REFUSED on this repository's own doctrine -- the document nobody executes is the one that goes stale, and it would be a new liability rather than a closure. WHAT THAT COSTS, FILED RATHER THAN DISCOVERED: a member pack ships a tarball with NO README where today's root pack ships one. It binds only the day tsudoi publishes, and the sentinel travelling to the member manifest forecloses that until a publishing decision reopens it.",
      "THE ROOT TAKES A DISTINCT PRIVATE NAME, `@atusy/tsudoi-workspace`, AND THE COLLISION IS NOT KEPT-AND-MEASURED. Two packages claiming one name is `one package spelled two ways` in the ONE PLACE the name guard cannot see -- it iterates members and the root is not one -- and its failure mode is SILENCE: last-write-wins, no throw, no reorder. Measuring that green would license a state whose whole defect is that nothing reports it. Dropping `name` is refused for the SAME reason rather than a different one. The string must not be a prefix-extension of the published name, because a recorded boundary exists to refuse exactly that string class.",
      "THE EXACT STRING IS THE PO'S AND NOT THE STAKEHOLDER'S, stated so the boundary is on the record: it appears in no registry, no consumer's manifest and no executed command block. The stakeholder's ruling -- the directory, and a root with no src/ -- is what all three of this sprint's decisions sit inside.",
      "IF THE SPRINT MUST SHRINK, THE NAMING REPAIR IS WHAT DROPS AND THE PUBLISH SENTINEL IS WHAT NEVER DOES. The crux itself is already answered, so what remains of the first is a repair whose absence leaves a failure that is LOUD BUT AMBIGUOUS -- the only one of the five whose absence produces nothing green-but-wrong. The sentinel goes green MEASURING NOTHING the moment the manifest moves, so a sprint that ships the move without it ships a test certifying a premise it can no longer see.",
      "THE `default: ./src/*.ts` ARM'S FATE IS A FOLLOW-UP'S AND NOT THIS SPRINT'S: its recorded costs were measured under the layout this move destroys, and deleting it here would put TWO subject flips in one sprint and make the move's own readings unattributable. UNTIL IT LANDS THE FLIP STANDS UNDETECTED AND THIS SPRINT MUST NOT BE REVIEWED AS THOUGH IT WERE CLOSED.",
    ],
  },
  retrospectives: [
    {
      sprint: 51,
      improvements: [
        {
          action:
            "A SWEEP RUNS EVERY PERTURBATION ITS SUBJECTS HAVE SUBJECTS FOR, BECAUSE `GREEN` AND `GREEN FOR WANT OF A SUBJECT` LOOK IDENTICAL IN A REPORT. MEASURED, and the sweep's own second run is what taught it: under the exports-deletion perturbation alone most probes are green because they name a RELATIVE PATH rather than the package, so nothing in them could have been answered by the route being removed -- and a sweep that had stopped there would have produced a CLEAN, FALSE report. The second perturbation, withholding the source symlink, is what gives those probes a subject. Same failure shape as the unfalsifiable-perturbation entry two sprints back, caught this time inside the sprint.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A MID-SPRINT INSTRUMENT REPLACEMENT INVALIDATES THE CHECK ONLY WHEN THE NEW INSTRUMENT'S READINGS CANNOT BE TIED TO THE OLD ONE'S BY A SHARED SUBJECT WITH A KNOWN PRIOR READING. The formatter's cache went partial mid-sprint and the tool became unrunnable; it was rebuilt from the package cache at a disclosed version and the check was still run BARE. What ties the two is a measurement rather than an assertion -- the rebuilt tool's FIRST run read a tree the old one had formatted and re-checked, so a disagreement would have surfaced exactly there. WHAT WOULD INVALIDATE IT: a rebuilt instrument whose first reading is on a tree the old one never read, or one acquired at an unpinned version with no continuity reading. AND THE HALF THAT IS NOT ABOUT THE VERDICT: the tool was UNRUNNABLE FOR A WINDOW in a project that commits on green, so `I could not run this check for these commits` is the kind of thing this record exists to hold.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A HELPER REWRITTEN TO RESOLVE WHAT IT PREVIOUSLY ONLY REFERENCED INHERITS EVERY STATE THE OLD IMPLEMENTATION WAS STRUCTURALLY IMMUNE TO, AND THAT INHERITANCE IS THE AUTHOR'S TO ENUMERATE. MEASURED: the harness closure's first version crashed on a DANGLING entry, because the wholesale symlink it replaced resolved nothing and so nothing could dangle -- a state that is routine here, since a relative workspace link dangles the moment a member directory moves. It escaped its own author and was caught at review. THE FIRST READING OF THE MOVE SPRINT IS THEREFORE TAKEN IN THE MOVED-BUT-NOT-YET-INSTALLED TREE, because that is the state the checkout is IN between two commits, and this sprint measured that state CRASHING a helper rather than reddening a test.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
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
