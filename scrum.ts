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
      id: "PBI-52",
      story: {
        role: "config author",
        capability:
          "get path completion the same way -- installed rather than copied -- with the item-resolution half inside the same package, so highlighting an item still fills in its size and date",
        benefit:
          "the handler I am most likely to want and least likely to be able to write myself stops being a file I fork on the day I take it, and its two halves cannot arrive out of step",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "`@atusy/tsudoi-completion-path` CARRIES BOTH HALVES, RULED: completion-path.ts and resolve-path-stat.ts travel together. PBI-51's criteria apply here unchanged against this package, AND THEY ARE NAMED RATHER THAN NUMBERED because a positional reference falsifies itself the next time a criterion is inserted above it: `a consumer obtains the handler without receiving its source`, `the package resolves tsudoi through package resolution`, `the three root-level DoD checks reach inside the package`, `the fifth check covers this member too` (it is enumerated from the workspace configuration, so a package added here must be picked up with no list edited), `no exemption from the deno guard` (PBI-51 pins the shape over MEMBERS AS A CLASS, so this package should need NO new shape -- and if it does, PBI-51's prediction was wrong and that is reported), `every prose site this falsifies is repaired`, and `the published main package depends on no handler package`. The wordnet criterion has NO ANALOGUE -- this package's imports are `node:` builtins, which leave the main package's dependencies untouched.",
          verification:
            "As in PBI-51, against this package, WITH ONE INHERITED MECHANISM CORRECTED RATHER THAN COPIED. The end-to-end probe answers BOTH `textDocument/completion` AND `completionItem/resolve` in one installed consumer, since either alone is half the artifact. THE CORRECTION, and it is the PO's defect being repaired at the only place it can still do harm: PBI-51's resolution criterion said perturbation (a), removing the root `paths` mapping, would make THE ROOT CHECK REDDEN ON examples/. IT DOES NOT, AND THIS REPOSITORY HAD ALREADY MEASURED THAT -- PBI-54 records `name` and `paths` as redundant covers, so examples/ resolve by self-reference into dist/ and root tsc EXITS 0 SILENT. THE PROPERTY NEVER NEEDED THAT ARM. WHAT REPLACES IT, and it reads only the member so no root observation is involved at all: the POSITIVE arm is the member's own check with ITS OWN route broken -- remove the member's peer entry on tsudoi, or the apparatus symlink that satisfies it -- which must give TS2307 NAMING THE SUBPATH. Paired with the negative arm (the root mapping removed, the member's check UNCHANGED) and with the reach arm (a name broken in src/types.ts giving TS2305 and ZERO TS2307), the three together establish that the member resolves, resolves WITHOUT the parent, and reaches a REAL DECLARATION rather than `any`.",
        },
        {
          criterion:
            "`completedPath` STAYS INTERNAL. It is the mark the completion attaches and the resolve reads back, and the ruling's whole reason is that publishing it would make every future change to how an item is marked a compatibility question with a stranger. So it is NOT in the package's published surface.",
          verification:
            "Read from the PACKED TARBALL's type surface, in both directions per Sprint 6: the names the package DOES publish are found there, and `completedPath` is not. An empty or failed read cannot distinguish `internal` from `nothing was published at all`.",
        },
        {
          criterion:
            "THE PACKAGE'S PUBLISHED SURFACE IS CHOSEN RATHER THAN INHERITED, and this is the criterion that carries the cost this PBI exists to pay. completion-path.ts exports THIRTEEN names today -- incidental, because an example is copied and edited. Each becomes published API or becomes internal, DECIDED ONE BY ONE AND NOT AS A BATCH, which is Sprint 45's per-item rule applied to exports instead of to tests.",
          verification:
            "Every export classified individually in the plan with a reason, and the packed tarball's surface compared against that classification in both directions. A BATCH `everything stays exported` FAILS THIS CRITERION even if it is the right answer, because the point is that thirteen promises were made deliberately.",
        },
        {
          criterion:
            "EACH PUBLISHED HANDLER CARRIES ITS OWN README, AND THIS BECOMES STRUCTURAL AT THE SECOND PACKAGE RATHER THAN THE FIRST. Sprint 47 shipped a member with no README, and the PO ruled that a DECISION rather than a defect BECAUSE NOTHING IS PUBLISHED AND NO REGISTRY PAGE CAN BE SEEN. What it cannot survive is two members: tsudoi's own README cannot be the place where every handler explains its constraints, and the constraints are real -- Sprint 47's handler decided WHITESPACE IS ITS WORD RULE, which bounds the languages it serves, and that fact lives today in a maintainer's source file where no installing stranger reads it. THE MEMBERS' READMEs ARE ADDED FOR BOTH PACKAGES IN THIS PBI, not just the new one.",
          verification:
            "Each member's README is IN THE PACKED TARBALL, read off the artifact rather than the tree, and names three things a stranger cannot get elsewhere: what the handler answers, that it REQUIRES tsudoi at run time, and the constraint that bounds it. AND THE ROOT README STOPS CARRYING PER-HANDLER INSTALL PROSE for anything that has its own -- the duplication is what silently diverges.",
        },
        {
          criterion:
            "`peerDependenciesMeta.optional: true` IS A FALSEHOOD KEPT FOR AN APPARATUS REASON, AND IT MUST BE OWNED BY SOMETHING THAT FIRES WHEN ITS PREMISE DIES. It reads `this package works without tsudoi`; the handler imports a value from tsudoi, so it does not. MEASURED IN SPRINT 47: a project given the handler tarball alone installs WITH NO WARNING AT ALL and then fails at config load. WHAT IT BUYS IS REAL -- without it `bun install` exits 1 on a 404 while tsudoi is unpublished -- so it is ACCEPTABLE TO CARRY AND NOT ACCEPTABLE TO CARRY SILENTLY. The premise is `tsudoi is unpublished`, and the day that stops being true the field becomes a plain lie with no compensation.",
          verification:
            "NOT a dashboard entry saying it `should` change: this dashboard COMPACTS, and nobody re-reads a closed sprint's decisions on publication day. Something must REDDEN when the premise dies. The one durable statement of that premise I can see is README's `The package is not published` section, WHICH THE SUITE ALREADY EXECUTES -- tying the two is a candidate and NOT A REQUIREMENT, since naming the instrument is Planning's job and mine to leave open. WHAT IS REQUIRED IS THE PROPERTY: the reversal is pinned at a site the publishing edit passes through, over BOTH members, since two packages now repeat one falsehood.",
        },
      ],
      notes: [
        "RULED BY THE STAKEHOLDER, ON THE PO'S RECOMMENDATION AND ITS STATED REASON: resolve-path-stat TRAVELS. The cost of the alternative decided it -- leaving resolve behind as an example forces an internal marker onto the package's PUBLISHED surface. The accepted cost is cosmetic: THE PACKAGE NAME DOES NOT SAY IT ANSWERS TWO METHODS, and a reader of the module list will not learn that from the name. WRITE IT WHERE THEY MEET IT -- in the package's own README and at its exports -- since the name cannot carry it.",
        "THE COUPLING, MEASURED RATHER THAN RECALLED, because it is the ruling's evidence and outlives the ruling. examples/resolve-path-stat.ts imports `completedPath` from examples/completion-path.ts -- A VALUE IMPORT, not a type -- since tsudoi keeps no record of what a completion handler produced and a resolve handler can only key off the mark the completion module wrote onto the item. AND loadConfig REFUSES a config supplying `completionItem/resolve` without `textDocument/completion`, which test/fixtures/resolve-without-completion.ts pins.",
        "A THIRD OPTION WAS AVAILABLE AND WAS NOT TAKEN, recorded so nobody re-opens it as though it were unconsidered: resolve-path-stat as its OWN package depending on the completion one. It publishes the same marker across the same boundary as leaving it an example AND adds a third package to maintain, so it cost strictly more than either.",
        "A README HAZARD SPRINT 47 CREATED AND THIS PBI WILL DOUBLE, CARRIED HERE SO IT IS MET AT PLANNING. The root README's whole credibility rests on `the commands below are extracted from this README and executed, so an instruction here that no longer works fails the suite`. Sprint 47 added a handler pack/install block that WAS NOT EXECUTED AND DID NOT WORK -- it named an install path for a file never created, because `bun pm pack` inside a member writes to the workspace root. A NON-EXECUTED BLOCK IS INDISTINGUISHABLE FROM AN EXECUTED ONE TO A READER, so one such block silently withdraws the guarantee for the whole document. Either every command block is executed, or the ones that are not SAY SO WHERE THEY ARE.",
        "SEQUENCED THIRD, AND `ready` DESCRIBES THE PBI RATHER THAN THE ORDER. PBI-53 re-spells the name every criterion here uses and PBI-51 builds the two-tarball consumer, the workspace, the root exclusion and the fifth DoD check that this PBI's criteria 1 and 3 reuse wholesale. Pulled first, this PBI would have to build all of it against the larger of the two export surfaces.",
      ],
    },
  ],
  completed: [
    {
      number: 48,
      pbi_id: "PBI-54",
      status: "done",
      goal: "A misspelled paths mapping is caught rather than falling through to dist/ at exit 0, so the stale-artifact hazard is foreclosed rather than foreclosed-plus-an-unwatched-precondition.",
      impediments: [],
      decisions: [
        "SPRINT 47'S RETROSPECTIVE BINDS THIS SPRINT'S CRITERIA: a criterion naming a colour must CITE THE MEASUREMENT THAT PRODUCED IT, so an uncited colour is visibly a guess. This PBI's own discriminating perturbation is THE MISSPELLING, NOT THE DELETION -- deletion is already covered and covers nothing new, which is precisely the distinction Sprint 47's criterion 2 got wrong.",
        "THE CLASS IS NAMED RATHER THAN THE INSTANCE. An outcome recorded as FORECLOSED that is really FORECLOSURE PLUS AN UNWATCHED PRECONDITION is what this PBI corrects: Sprint 42 recorded the stale-dist hazard as foreclosed, and it is foreclosed only while `paths` is spelled correctly.",
        "THE ASSERTION WAS FIXED, NOT THE CLAIM. The test name states the property the type check BUYS; renaming it to `the mapping is spelled thus` would leave nobody holding that property. The literal toEqual on the mapping key went, since a deleted key and a misspelled one land in the same dist/ and it spelled today's key twice.",
        "THE INSTRUMENT WAS CHOSEN BY MEASUREMENT: an exit code cannot tell src from dist -- both are 0 and silent -- and `--listFiles` does not say WHICH specifier reached a file. `--traceResolution` makes the compiler NAME the file that answered each subpath. BOTH SIDES OF THE COMPARISON ARE DERIVED FROM DECLARATIONS, so an added exports arm or a second mapping key is covered with no edit to the test.",
        "A PREDICTION WAS REFUTED AND THE REFUTATION DECIDED THE FIX. Building the literal resolution probe the criterion asked for against tsconfig.build.json resolves every published subpath to ./src/*.ts, NOT dist/ -- `rootDir` with `outDir` makes tsc read a declaration file back to the input that generates it, and it happens with no dist/ on disk at all. SO THE PROBE REFUTES THE TEST NAME RATHER THAN BACKING IT, and the rename is the honest outcome.",
        "AN EXECUTOR CLAIM WAS SPLIT AND HALF-REFUTED by the independent reviewer. `the fifth check is exit 0 and silent on a wrong peerDependencies key` HOLDS; `nothing in test/ reads that key` IS FALSE -- packages/hover-wordnet/test/package-shape.test.ts asserts the exact key, so the described disagreement reddens the suite.",
      ],
      subtasks: [
        {
          test: "A misspelled paths key is caught, and the catch names the misspelling rather than a downstream symptom.",
          implementation:
            "Close the fall-through: with `paths` misspelled to any name that does not match, resolution reaches the exports map and lands in dist/ at exit 0, so the type check reads a built artifact instead of the source just edited.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "2c44942",
              message: "tidy(test): one home for the two configs' settings and the manifest",
              phase: "refactoring",
            },
            {
              hash: "ac11856",
              message:
                "test(package-shape): read which file answered, not how the mapping is spelled",
              phase: "green",
            },
            {
              hash: "6016f2d",
              message: "docs(test): name the tree the misspelling readings were taken on",
              phase: "refactoring",
            },
          ],
          notes: [
            "Measured at Sprint 47: `name` and `paths` are REDUNDANT COVERS, so deleting either alone leaves tsc green. The misspelling is the discriminating edit.",
            "The test named `the repo's type check resolves the published subpaths to source` claims more than its assertion verifies -- it defends the mapping's PRESENCE and SPELLING, not the resolution. Fix the claim or the assertion, and say which.",
            "THE ASSERTION WAS FIXED AND NOT THE CLAIM, and the reason is which of the two the Definition of Done is buying: the name states the property the type check exists for, so renaming it to `the mapping is spelled thus` would have left that property owned by nothing while every check stayed green. THE LITERAL EQUALITY IS GONE RATHER THAN KEPT BESIDE THE NEW READING, on two grounds measured rather than argued: it is SUBSUMED, since a deleted key sends the same subpaths to the same artifact as a misspelled one, and it SPELLED TODAY'S KEY A SECOND TIME, which subtask 2 forbids.",
            "THE INSTRUMENT IS `--traceResolution` AND THE TWO CHEAPER ONES WERE TRIED FIRST. An exit code cannot separate source from artifact -- both answer 0 with nothing printed -- and `--listFiles` names files without saying which specifier reached them, which matters because src/ is in the program by glob whether or not anything resolved there. The trace names the file each specifier reached, so the green is a positive reading rather than the absence of a red.",
            "CRITERION 1'S VERIFICATION NAMES A MECHANISM THIS SPRINT DID NOT BUILD, AND THE SUBSTITUTION IS DECLARED HERE RATHER THAN ARGUED AT REVIEW. It asks for a probe where src/ and dist/ DISAGREE, so that which one answered can be read off a difference between them; the hermetic tree here holds the same empty module at both paths, and they differ in PATH alone. WHAT REPLACES IT IS STRICTLY STRONGER ON THE PROPERTY THE CRITERION STATES -- distinguishing `resolved to src/` from `resolved to dist/` POSITIVELY -- because the compiler NAMES the file it reached, so nothing has to be inferred from a disagreement between two contents. Sprint 41's entry is the precedent: the constraint survived the replacement of the mechanism it was derived from, which is evidence it was a constraint on the property.",
            "PREDICTION WRITTEN FIRST AND IT HELD, on the tree at 38b8709 with the key misspelled to a name nothing answers to: `tsc --noEmit` EXITS 0 AND PRINTS ZERO BYTES while all four published subpaths are answered by dist/*.d.ts, and `bun test` gives 685 pass / 2 fail of 687. The failure that names the KEY prints the misspelling against an EMPTY matched set; the failure that names the EFFECT prints the four dist/*.d.ts against the four src/*.ts. Reverted, and the tree verified identical to HEAD.",
            "A POISONED MEASUREMENT WAS CAUGHT BY THE PREDICTION AND IS REPORTED RATHER THAN DROPPED: a first attempt at the deletion arm left tsconfig.json UNEDITED -- the substitution failed -- and returned 687 pass / 0 fail against a prediction of one failure. The mismatch is what exposed it; the reading was discarded and retaken.",
            "THE INHERITED REDUNDANCY IS RE-MEASURED ON BOTH HALVES AND NOT ONE, at 38b8709, and the second half is a POSITIVE reading rather than a colour: with `name` alone repointed and `paths` untouched, `tsc --noEmit` EXITS 0 AT ZERO BYTES and the trace shows all four subpaths still answered by src/*.ts -- the mapping intercepts before the exports map is consulted, so the check never reaches the renamed manifest. With `paths` alone deleted, the same check is EXIT 0 AT ZERO BYTES too. Both halves confirmed; neither key is pinned by the type check's COLOUR alone.",
            "AND THE GUARD IS NOT BLIND WHERE THE COLOUR IS, WHICH NARROWS PBI-54'S OWN NOTE: `neither key is pinned by the type check alone` holds of the exit code and NOT of this reading. MEASURED, both arms, one key each: with `name` alone repointed the resolution reading REDDENS, since the specifier a consumer writes is derived from the manifest and nothing in the program asks for it; with `paths` alone deleted it reddens naming dist/. So the two keys are now pinned to AGREE, by the one assertion, without either being spelled in it.",
            "NONE WEAKENED IS DIFFED RATHER THAN ASSERTED, per Sprint 36 as amended by Sprint 43, because the note above claims a removal is subsumed and a coverage claim may not be recalled. Across this sprint's commits over src/ and test/: THREE `expect(` lines added, ONE removed, and the removed one is named -- the literal equality on the mapping's content. ZERO are quoted in comments, so the count is not inflated by its own commentary: the new prose DESCRIBES assertions.",
            "SPRINT 14'S STANDING RE-RUN, WITH SPRINT 43'S QUESTION ASKED FIRST -- which of Sprint 47's perturbations still HAS a target here. Arm (a), the root mapping removed, does: re-run on this tree it gives the fifth Definition-of-Done check UNCHANGED AT EXIT 0, the same colour Sprint 47 recorded, while `bun test` gives 686 pass / 1 fail. So the member's route survives the parent's mapping going away, re-measured rather than inherited.",
            "WHAT SHIPS WAS READ OFF THE ARTIFACT RATHER THAN ARGUED FROM `files`: `bun pm pack --dry-run` packs TWENTY-NINE entries -- package.json, LICENSE, README.md and dist/** -- and this sprint's diff is scrum.ts, test/package-shape.test.ts and test/helpers/typecheck.ts, which INTERSECTS NONE OF THEM. So no comment written here reaches a stranger, and the named negative is the instrument's rather than an inference from the manifest.",
          ],
        },
        {
          test: "The guard is written over the property, not over this one spelling.",
          implementation:
            "Whatever catches the misspelling must also catch the next mapping key that stops matching, without naming today's key twice.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "ac11856",
              message:
                "test(package-shape): read which file answered, not how the mapping is spelled",
              phase: "green",
            },
          ],
          notes: [
            "A guard naming one key leaves the next unpinned and nothing says so -- the same shape as the deno-guard shape over members as a class.",
            "NO COMMIT OF ITS OWN, AND THAT IS THIS SUBTASK'S OWN REQUIREMENT RATHER THAN AN OMISSION: an intermediate guard spelling today's key is exactly what `without naming today's key twice` forbids, so the guard was written over the class in the same edit and this subtask cites that commit. What it can be checked against: the key is now the subject of NO assertion anywhere but tsconfig.json itself, and the remaining occurrences in the tree are prose describing it.",
            "EVERY SIDE OF EVERY COMPARISON COMES FROM A DECLARATION AND NONE FROM THE MAPPING IT GRADES -- specifiers from package.json's `name` and `exports` keys, expected files from each subpath's own `default` arm, declared patterns from the config itself. A FIFTH EXPORTS ARM OR A SECOND MAPPING KEY IS COVERED WITH NOTHING EDITED, and an expectation derived from the mapping would have followed the fault instead: a key that has stopped matching still names ./src/*.ts.",
            "TWO FAILURES, AND NEITHER COVERS THE OTHER. The resolution reading names the FILE THAT ANSWERED; the matched-pattern reading names the KEY THAT REACHED NOTHING. MEASURED, prediction first and held: with `paths` DELETED, `bun test` gives 686 pass / 1 fail -- the resolution reading reddens naming dist/, the matched-pattern reading stays green because an empty set matches an empty set. So the pair's division of labour is measured rather than claimed, and the failure a reader meets first is the one that names their edit.",
            "THE SWEEP IS BOUNDED AND ITS INSTRUMENT IS NAMED, per Sprint 47, since a sweep for a defect that is a property of MATCHING is itself an instance of that class. THE INSTRUMENT IS NOT A NAME GREP: it is the enumeration of every tracked configuration file -- `git ls-files` filtered to json/toml/yaml plus bunfig, which is EIGHT -- and then, within each, every key whose value must MATCH something to have any effect. RESULT: the root `paths` was the only silent one. MEASURED LOUD, one command each: a misspelled `types` entry gives TS2688 at exit 1; a misspelled oxlint rule name gives `Rule 'extensionz' not found in plugin 'import'` at exit 1; a misspelled `preload` path gives `preload not found` at exit 1. PINNED BY AN EFFECT PROBE RATHER THAN BY SPELLING, which is the standard this sprint brings `paths` up to: tsconfig's `exclude` (the dist pair in the same file), .oxlintrc's override globs (guard.test.ts lints a probe at every shape, so an override that stops matching reddens the shape it stopped covering), `workspaces` (refuseUncoveredPackages), and a MEMBER's `paths` (refuseMemberMappings, over the effective configuration).",
            "A SECOND POISONED MEASUREMENT, SAME MECHANISM AND SAME CATCH, REPORTED BECAUSE THE RATE IS THE FINDING: an in-place substitution that did not apply returned the UNPERTURBED colour against a prediction of two failures. Twice in one sprint the perturbation silently failed to land, and both times what exposed it was the prediction written first plus a check that the edit was really there. A probe sequence therefore reads back the file it just edited before it believes the run.",
            "THE PARSER'S OWN NON-VACUITY, since the readings rest on a compiler's diagnostic TEXT: if that text ever changes, no resolution and no matched pattern is seen at all, so both readings go RED against non-empty expectations. There is no spelling of the trace that turns this green by accident.",
            "ONE MORE INSTANCE OF THE CLASS FOUND AND DELIBERATELY NOT FIXED, ON SPRINT 45'S PRECEDENT: the member's `peerDependencies` key names tsudoi in a spelling of its own, while the apparatus symlink that actually satisfies it is DERIVED from the root manifest's `name`. MEASURED: repointing that key at a package that does not exist -- leaving `peerDependenciesMeta` still naming the real one, so the two disagree with each other as well -- leaves the fifth Definition-of-Done check at EXIT 0 AND SILENT, and nothing in test/ or scripts/ reads the key at all. It is PBI-51's territory rather than this sprint's, and a separate property does not ride along merely because it is the same class.",
          ],
        },
        {
          test: "Sprint 42's recorded foreclosure is corrected in place rather than left standing beside its own counterexample.",
          implementation:
            "Repair the record: the hazard is foreclosed only while the precondition holds, and the precondition is now watched.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "7f2b786",
              message: "docs(test): a mapping forecloses the artifact only while it matches",
              phase: "refactoring",
            },
            {
              hash: "e236bb8",
              message: "docs(scrum): the stale-dist foreclosure names the precondition it rests on",
              phase: "refactoring",
            },
          ],
          notes: [
            "Sprint 47's retrospective: a record contradicting a measurement is the same class as a comment contradicting a comment.",
            "Correct it where a reader meets it, and do not narrate the change.",
            "TWO SITES, NOT ONE, AND THE SECOND IS THE ONE A READER ACTUALLY MEETS: the retrospective outcome states the precondition and what watches it, and the same unconditional sentence stood in test/package-shape.test.ts's own prose -- `a stale dist/ cannot reach it at all` -- three paragraphs above the assertions that now watch it. A correction made only in the dashboard would have left the comment contradicting the test beneath it.",
            "ONE RECORD IN THIS FILE STILL CONTRADICTS THE TREE AND IS LEFT FOR ITS AUTHOR: PBI-54's second note says NOTHING DETECTS A MISSPELLING, which held when it was written and is now false at the same commit as this entry. The Developer does not rewrite a Product Backlog Item mid-sprint -- that is the acceptance's business -- so it is REPORTED rather than edited, and named exactly so Review acts on it instead of inheriting a comment-contradicts-comment inside one file.",
            "THE ACTION TEXT IS UNTOUCHED, as it says of itself, and so is the old package name inside that entry: Sprint 47's census classes a name quoted in a recorded measurement as EVIDENCE, and re-spelling it would edit what was measured. THE COMMITS SEPARATE BECAUSE THE DASHBOARD COMMITS ALONE -- a hook refuses scrum.ts beside anything else, which is a constraint worth knowing before staging.",
          ],
        },
        {
          test: "Review does not open until revise has converged.",
          implementation: "Run the revise skill without a PR.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "The stakeholder's standing instruction. Two sprints of evidence that it finds what the gate and the criteria both miss.",
          ],
        },
      ],
    },
    {
      number: 47,
      pbi_id: "PBI-51",
      status: "done",
      goal: "A config author installs the wordnet hover handler as @atusy/tsudoi-hover-wordnet instead of copying two files, and the package resolves tsudoi through package resolution rather than through the parent's route.",
      impediments: [],
      decisions: [
        "THE ORDER OF THE FIRST TWO SUBTASKS IS THE SPRINT'S ONE REAL RISK. Criterion 4 WITHDRAWS root tsc's coverage of members, and criterion 3 depends on the other three root checks still reaching in. Building the member BEFORE the withdrawal leaves a window in which root tsc answers for it THROUGH THE PARENT'S `paths` AND REPORTS SUCCESS -- measured at Sprint 46's planning, where a planted member's `@atusy/tsudoi/types` import produced no error and deleting `paths` turned the same line into TS2307. Foreclose first, then build, so the hazard is never constructible rather than merely unobserved.",
        "SPRINT 46'S RETROSPECTIVE BINDS THIS SPRINT'S VERIFICATION: a sweep for a defect that is a property of matching is itself an instance of that class. Any grep over package names here is bounded on the right BEFORE it is trusted, and a negative result names the instrument that produced it.",
        "THE DEFINITION OF DONE, EACH COMMAND RUN UNPIPED, AS RUN: `bun test` 655 pass / 0 fail across 44 files; `bunx tsc --noEmit` EXIT 0; `bunx oxlint` EXIT 0 with the one pre-existing require-yield warning at test/fixtures/throws-on-cancel.ts:51; `bunx oxfmt --check .` EXIT 0; `bun run scripts/typecheck-workspaces.ts` EXIT 0. BASELINE AT THE SPRINT'S START, re-measured rather than taken from the brief: 635 pass / 1923 expect() calls, and the brief's number matched.",
        "A COST THIS SPRINT ADDS, AND IT IS THE ONE PLACE THE DoD GOT WEAKER: `bunx tsc --noEmit` ON A CHECKOUT NOTHING HAS BUILT now reports TS2307 at examples/tsudoi.config.ts naming the member. A member ships dist/ and not src/, its `exports` names no source arm, and the root tsconfig deliberately holds no `paths` mapping standing in for one -- because a mapping added to spare this build would pull member SOURCE into the root program through module resolution, which `exclude` does not stop, and that is precisely the hazard criterion 4 forecloses. SO THE FAILURE IS LOUD AND NAMES ITS OWN REMEDY, and any other Definition-of-Done command clears it, since both the test preload and the fifth check run the same builder. IT IS NOT A SILENT DEGRADATION AND IT IS NOT NOTHING; it is written at test/helpers/build.ts where the next reader meets it.",
        "TWO RESIDUALS IN THE MEMBER'S MANIFEST, NAMED RATHER THAN LEFT TO BE DISCOVERED. `peerDependenciesMeta.optional` READS AS `THIS PACKAGE WORKS WITHOUT TSUDOI`, WHICH IS FALSE -- the handler imports a value from it. What it actually buys is that no installer goes looking in a registry for a package nothing has published, which is the state this whole backlog insists on; without it `bun install` EXITS 1 on a 404, measured. It should become a plain peer the day tsudoi is published. AND THE ROOT'S DEVDEPENDENCY ON THE MEMBER IS AN EXACT VERSION RATHER THAN `workspace:*`, because `workspace:*` breaks every DETACHED COPY of the manifest -- the pack stage and the README checkout both write package.json into a temp directory and `bun pm pack` there refuses with `Failed to resolve workspace version`. A real pack at the repo root rewrites it to that same exact string, so the two publish identically and only one survives being copied; what it costs is two versions kept equal by hand, asserted in test/package-shape.test.ts.",
        "THREE DEFECTS THIS SPRINT SHIPPED AND THEN CAUGHT, ALL ON A SECOND PASS AND NONE VISIBLE TO THE GATE. (1) A FALSE COMMENT, AND IT REACHED CONSUMERS: src/hover.ts said this package resolves tsudoi through its own `dependencies` entry -- it is a PEER -- and cited a test/package-shape.test.ts beside it that DID NOT EXIST. The build keeps comments, so dist/hover.js carried it into every installed copy. Sprint 19, Sprint 22 and Sprint 46's comment-contradiction entry in one sentence, written while editing the very file it described. (2) THE MEMBER'S package.json HAD NO TEST CARRYING ITS REASONS, so four decisions -- the two-armed exports map, `files`, the peer plus its `meta.optional` residual, and the dictionary -- lived only in this dashboard, which compacts. The Lifetime Rule names exactly that case and it was not applied to the new manifest. (3) CRITERION 1'S ABSENCE WAS MEASURED BY FILENAME WHERE THE CLAIM IS ABOUT BYTES; a copy under another name passed it.",
        "AND THE INSTRUMENT THAT FIXED (3) WAS ITSELF WRONG ON ITS FIRST NEEDLE, CAUGHT BY RUNNING IT: `preferredFormat` is not unique to the handler -- examples/completion-path.ts makes the same choice about a declared capability and named its function the same way -- so the content check reddened immediately on a file that is copied ON PURPOSE. `wordAt` appears nowhere in examples/ or src/ and is unpublished. A uniqueness claim about a needle is a coverage claim, and this one was measured rather than recalled.",
        "CRITERION 1'S DENO HALF IS COVERED BY A TEST THIS SPRINT DID NOT WRITE, NAMED RATHER THAN ASSUMED. test/installed-handler.test.ts runs BUN ONLY. `deno serves the example's dictionary hover from the installed copy` in test/installed-runtime.test.ts drives the SAME consumer layout and the SAME config -- which now reaches the handler by package specifier -- under deno. That matters more than usual: the member ships dist/ with no source arm PRECISELY BECAUSE deno refuses to type-strip under node_modules, so the design's own premise is exercised there and nowhere else in this sprint's own work.",
        "A PRE-EXISTING SHAPE THIS SPRINT GAVE A SUBJECT TO, REPORTED AND NOT FIXED HERE. test/published-artifacts.test.ts records the declaration-emit divergence as a hazard with NO SUBJECT, because nothing published carried a relative re-export. The member's src/index.ts is one, so dist/index.d.ts now reads `export { hoverWordnet } from \"./hover.ts\"` beside dist/index.js's correct `./hover.js` -- a specifier naming a file the tarball does not ship. MEASURED HARMLESS FOR A CONSUMER: with `types: []` and no allowImportingTsExtensions the full `MethodHandler<\"textDocument/hover\">` is reached, read off TS2322. AND THE SAME SPELLING IS ALREADY THROUGHOUT THIS PACKAGE'S OWN dist/*.d.ts, so it is the build config's behaviour repo-wide and not something the member introduced. WHAT IS WORTH A PBI: deleting dist/hover.d.ts leaves that consumer at EXIT 0, so a missing re-export target is not reported at all and the export would silently be `any`.",
        "ACCEPTED BY AN INDEPENDENT PRODUCT OWNER, all eight criteria met. THREE ARE MET BETTER THAN ASKED and the difference is between a green and a proof: criterion 1's hover was read off a DELIBERATE MISMATCH, since a toContain that passes is equally what `undefined` produces; criterion 4 was built BEFORE THE MEMBER EXISTED, so the hazard was never constructible rather than merely unobserved; and criterion 5's control reddens on exactly the new shape where BEFORE THIS SPRINT THAT SAME EDIT REDDENED NOTHING AT ALL -- which is what shows a control was created rather than a shape restated.",
        "CRITERION 2 IS MET ON ITS PROPERTY AND ITS MECHANISM WAS WRONG, THE DEFECT FILED AGAINST THE PRODUCT OWNER. The criterion asked root tsc to redden on examples/ when the root mapping is removed. Measured: EXIT 0 AND SILENT -- because `name` and `paths` are redundant covers, WHICH PBI-54 ALREADY RECORDS. A criterion contradicted a record by the same author, one item below it. THE EXECUTOR REPLACED THE LOST CONTRAST WITH A STRONGER READING rather than losing it: part (b) run with (a) STILL IN FORCE gives TS2305 naming MethodHandler and ZERO TS2307 counted, establishing in one measurement that resolution succeeded, succeeded WITHOUT the parent, and reached a real declaration rather than `any`.",
        "TWO REFUTATIONS ACCEPTED, BOTH NARROWING A HAZARD RATHER THAN DISMISSING IT. The `.ts` specifier in emitted declarations does NOT fail open to `any`: the EXIT 0 appears only under `skipLibCheck: true`, which suppresses .d.ts errors for every package on npm, and hand-editing the specifier to `./hover.js` gives byte-identical behaviour in all six cells. AND `an ambient declaration shipped reaches every consumer's global type space` IS FALSE AS STATED -- measured three ways, including one that is syntactically unconstructible -- because tsc reads only files in the program. THE HAZARD IS REAL BUT CONDITIONAL, which is the more useful statement.",
      ],
      subtasks: [
        {
          test: "Root tsc answers for no member at all, and the fifth check answers for every member the workspace declares.",
          implementation:
            "Foreclose first: exclude members from the root tsconfig and add the fifth DoD check, which enumerates members FROM THE WORKSPACE CONFIGURATION and never from a hand-written list.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "b262af1",
              message:
                "feat(dod): withdraw root tsc from the members and hand them a check of their own",
              phase: "green",
            },
          ],
          notes: [
            "Neither half works alone: without the exclusion the fifth check is shadowed by a root green; without the check, excluding members means nothing checks them.",
            "A member the list forgot would be checked by NOTHING and every command would exit 0. That is why enumeration comes from the workspace configuration.",
            "This lands BEFORE the member exists, so the hazard is unconstructible rather than watched.",
            "SPRINT 46'S MEASUREMENT RE-TAKEN ON THIS TREE RATHER THAN INHERITED, and it held at the renamed specifier: a planted member at packages/probe/ carrying BOTH a `@atusy/tsudoi-language-server/types` import and a type error gave root tsc EXIT 1 reporting ONLY the type error -- the subpath import produced NO diagnostic. Deleting `paths` turned that exact line into TS2307 while examples/ stayed silent, which is PBI-54's recorded redundancy showing itself in the same run.",
            "THE PAIR THAT PROVES THE TRANSFER, taken in one measurement with the planted member still present: root `tsc --noEmit` EXIT 0 AND SILENT, `bun run scripts/typecheck-workspaces.ts` EXIT 1 naming packages/probe/src/index.ts on both lines. The responsibility moved rather than two greens showing nothing.",
            "THE CHECK CLOSES THE GAP ITS OWN ENUMERATION COULD OPEN, which the criterion's `never from a hand-written list` does not by itself reach: `workspaces` IS a list, merely one in another file, so the script also reads the root tsconfig's `exclude` and REFUSES any package.json sitting under an excluded path that the patterns do not declare. Narrowing `workspaces` while leaving `packages` excluded is the one edit that would leave a package covered by nothing, and it now fails loudly naming the directory.",
            "FIVE ASSERTIONS IN test/workspace-members.test.ts, driven against THROWAWAY WORKSPACES rather than this one, because every state they describe is a state this repository must never be in. All five predicted before running and all five held: a member's type error reported at a member no list names; the same two members green once the error is removed (the pair, since an apparatus failure reddens identically); an undeclared package refused by name; a manifest with no `workspaces` refused rather than reporting nothing to do; a member with no tsconfig.json refused rather than skipped.",
            "PREDICTED AND OBSERVED: 635 -> 641 tests, 1923 -> 1936 expect() calls, exactly. Root tsc, oxlint, oxfmt and the new fifth check all EXIT 0 unpiped.",
          ],
        },
        {
          test: "A consumer obtains the handler without receiving its source, and answers a real textDocument/hover over the wire.",
          implementation:
            "Extract examples/hover-wordnet.ts and its ambient wordnet.d.ts into packages/ as @atusy/tsudoi-hover-wordnet, with wordnet as its runtime dependency.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "3b04fdd",
              message: "feat(hover): the wordnet handler is a package a config author installs",
              phase: "green",
            },
          ],
          notes: [
            'examples/wordnet.d.ts is an ambient `declare module "wordnet"`. Shipped inside a published package it lands in every consumer\'s global type space -- decide and state what happens to it.',
            "hover-wordnet.ts exports three names. An example's exports are incidental; a package's are a promise. Classify each one by one.",
            "The negative control is that NO BYTE of the handler's source is written into the consumer project.",
            "CRITERION 1 MET, BOTH DIRECTIONS IN ONE MEASUREMENT. The consumer installs two tarballs, writes a config whose only hover mention is the package specifier, and the hover answers `apple\\n\\nnoun — fruit with red or yellow or green skin and sweet to tart crisp whitish flesh` over the wire -- READ OFF A DELIBERATE MISMATCH rather than trusted, since a `toContain` that passes is equally what an `undefined` produces. Its own directory holds no path matching `hover-wordnet` while holding tsudoi.config.ts, so the empty list is not a walk that found nothing. NEGATIVE CONTROL: omit the handler tarball and the same config cannot load, stderr naming `@atusy/tsudoi-hover-wordnet`.",
            'THE AMBIENT DECLARATION IS KEPT INSIDE THE PACKAGE AND DELIBERATELY NOT PUBLISHED, which is the decision Planning left open. `declare module "wordnet"` in a shipped package declares a third party\'s module for everyone who installs it -- including a project with its own declaration, or a future @types/wordnet it would collide with. `files: ["dist"]` keeps it out and declaration emit does not copy a `.d.ts` INPUT. WHAT MAKES IT AFFORDABLE IS A CONSTRAINT ON THE SURFACE, not on the file: nothing published names a `wordnet` type. MEASURED ON THE ARTIFACT -- neither dist file carries `wordnet` or `declare module`, and a consumer with `types: []` and NO allowImportingTsExtensions resolves `hoverWordnet` to the full `MethodHandler<"textDocument/hover">`, read off TS2322 from assigning it to a number because a green there is equally what `any` gives.',
            "THE THREE EXPORTS, CLASSIFIED ONE BY ONE AND NOT AS A BATCH. `hoverWordnet` IS PUBLISHED -- it is the artifact, and src/index.ts names it alone. `define` IS INTERNAL: only this package's own test reads it, by relative import, so keeping it in costs no coverage and publishing it would promise a dictionary-lookup signature to strangers. `wordAt` IS INTERNAL AND IT IS THE ONE THAT COSTS SOMETHING: its own comment calls it the function an author replaces with their language's notion of a word, which is TRUE OF A FILE YOU COPY AND FALSE OF A PACKAGE YOU INSTALL. Publishing it would not restore that -- an author cannot make this handler call their version by importing ours -- and the thing that would, an option on the handler, is the `an author might want it` purchase this backlog refuses by name. So whitespace is this package's word rule, the loss is real, and it is written at src/index.ts rather than bought off.",
            "WHERE THE PACKAGE'S TESTS LIVE, which criterion 3 required the plan to say: INSIDE THE MEMBER, at packages/hover-wordnet/test/hover.test.ts. That makes `bun test` reaching the member a standing fact rather than a one-off probe, and it is what lets `define` stay unpublished -- a test outside the package could only reach it through the exports map.",
            "THE MEMBER'S OWN DEPENDENCIES ARE ITS OWN, and one was found by measurement rather than by design: the moved test needs the TextDocument CONSTRUCTOR, and tsudoi publishes that type deliberately type-only, MEASURED as TS1362 at the member's check. So `vscode-languageserver-textdocument` is a devDependency of the member rather than borrowed from the workspace root.",
            "BUN CANNOT LINK A WORKSPACE ROOT AS A MEMBER'S DEPENDENCY, MEASURED IN SIX SPELLINGS, and this is the sprint's one structural surprise. `workspace:*` and `workspace:.` report `Workspace dependency not found`; a plain range and `link:` reach the registry and 404; `file:../..` and a root `override` of `file:.` HARDLINK THE WHOLE CHECKOUT into node_modules/.bun -- same inodes, so the next `tsc` write silently strands the copy. THE ANSWER: `peerDependencies` plus `peerDependenciesMeta.optional`, which is the honest shape for a handler anyway -- the config and the handler must share ONE tsudoi -- plus an APPARATUS SYMLINK created by scripts/workspaces.ts. Recorded as apparatus, not design, and the layout that would remove the need for it -- the main package under packages/ rather than at the root -- is named as the alternative nobody chose.",
            "THE APPARATUS SYMLINK BELONGS IN THE MEMBER'S node_modules AND NOT THE ROOT'S, FOUND BY A RED RATHER THAN BY THOUGHT. Placed at the root it DISARMED AN EXISTING CONTROL: test/helpers/typecheck.ts symlinks the repo's whole node_modules into every probe, so the entry handed each probe a second route to this package's real package.json, and `the same config fails with TS2307 once the exports entry is removed` went EXIT 0 with its own copy's `exports` deleted. A member's own node_modules is reached by nothing but that member.",
          ],
        },
        {
          test: "The handler package resolves tsudoi through package resolution, not through the parent's route.",
          implementation: "Prove criterion 2 with the two opposed perturbations it names.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "THE LOAD-BEARING CRITERION and the whole reason this is not a file move with a package.json on top: nothing in this repository resolves tsudoi from another PACKAGE today. Both existing routes are consumed by loose files.",
            "Sprint 46 measured the discriminating control for the parent's route: deleting tsconfig's `paths` turns a member's subpath import into TS2307.",
            "NO COMMIT OF ITS OWN, because this subtask is a MEASUREMENT of what subtask 2 built rather than an edit. Both perturbations were applied and reverted, and the tree was verified identical to HEAD afterwards.",
            "(a) THE ROOT MAPPING REMOVED: the member's own check is UNCHANGED at EXIT 0, which is the load-bearing half and it held. THE CRITERION'S OWN PREDICTION MISSED AND IT IS REPORTED RATHER THAN SMOOTHED: it says `the ROOT check reddens on examples/`, and root `tsc --noEmit` EXITED 0 AND SILENT. The reason is already in this backlog -- PBI-54 records that `name` and `paths` are REDUNDANT COVERS, since deleting the mapping alone lets examples/ resolve by self-reference through the exports map into dist/. So the criterion asked for a colour its own repository had already measured to be impossible from that one edit.",
            "(b) THE NAME BROKEN, AND TAKEN WITH (a) STILL IN FORCE, which is strictly stronger than the criterion asks: with NO `paths` mapping anywhere, renaming `MethodHandler` in src/types.ts gives the member's own check `packages/hover-wordnet/src/hover.ts(27,15): error TS2305: Module '\"@atusy/tsudoi-language-server/types\"' has no exported member 'MethodHandler'` and ZERO TS2307 -- counted, not eyeballed. So the member reaches a REAL DECLARATION through package resolution alone, and the parent's mapping is not on its route at all.",
            "THE PERTURBATION WAS CHOSEN SO THE BUILD SURVIVES IT: `MethodHandler` is referenced in exactly one place inside src/ (the MethodMap mapped type), so renaming both leaves src/ compiling and dist/ emitted -- otherwise the member would have been type-checked against a poisoned artifact, which is the Sprint-44 class rather than a measurement.",
          ],
        },
        {
          test: "bun test, oxlint and oxfmt --check . each reach inside the member, proven by planted defects rather than by argument.",
          implementation: "Verify criterion 3 with one planted defect per check.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "Measured at Sprint 46's planning against a planted member: all three reach. Re-measure rather than inherit -- this is the sprint that makes the member real.",
            "The fourth check is deliberately outside this criterion because subtask 1 withdraws it.",
            "NO COMMIT OF ITS OWN: three defects planted in the REAL member, each measured and reverted. All three predictions written before running and all three held.",
            "`bun test` REACHES IT AS A STANDING FACT rather than by a probe, because the member's tests live inside it: a planted failing assertion in packages/hover-wordnet/test/hover.test.ts gave 644 pass / 1 fail, the failure named.",
            "`bunx oxlint` FROM THE ROOT WITH NO ARGUMENTS EXITED 1 naming packages/hover-wordnet/src/planted.ts TWICE, and the double reading is the strong one because the two rules fire for DIFFERENT REASONS: `import(extensions)`, which is repo-wide, and `no-restricted-imports` on `bun:sqlite`, which fires only because nothing exempts the member. One violation would not have separated `oxlint reaches the member` from `oxlint reaches it under a relaxed configuration`.",
            "`bunx oxfmt --check .` EXITED 1 naming packages/hover-wordnet/src/planted.ts. THE DEFECT WENT IN THE MEMBER'S src/ AND NOT ITS TESTS, deliberately: the config's overrides switch `no-restricted-imports` off at every test-file path, so a defect planted in the member's test would have measured the relaxed configuration for the lint arm.",
          ],
        },
        {
          test: "The member gets no deno-guard exemption, and the absence is pinned rather than defaulted.",
          implementation:
            "Criterion 5: state the reason at .oxlintrc.json where the widening edit would be made, and add the member path to guard.test.ts's list AS A SHAPE OVER MEMBERS AS A CLASS.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "f8e997b",
              message:
                "test(guard): the deno ban over workspace members is pinned, not merely defaulted",
              phase: "green",
            },
          ],
          notes: [
            "The ban reaches a member BY DEFAULT AND NOT BY ASSERTION today: an override widened to reach packages/ reddens nothing, because guard.test.ts pins only the shapes it carries.",
            "A shape naming one package leaves the second unpinned and nothing says so. PBI-52 should therefore add no shape -- a prediction this sprint makes about a later one.",
            "THE SHAPE IS `packages/probe/src/index.ts`, WHICH NAMES NO PACKAGE. No package by that name exists and the config holds nothing keyed to one, so what it pins is that a file under packages/ lints exactly as src/ does. It is the member's src/ and not its tests, because the test-file override switches the rule off and a member shape spelled as a test path would assert the RELAXED configuration while reading as the strict one.",
            "THE CONTROL FIRED ON EXACTLY THE NEW SHAPE, as the comment at .oxlintrc.json promises for the shapes already there: widening the first override's `files` to include `packages/**/*.ts` reddens ONE test -- `a bun:sqlite import is flagged in packages/probe/src/index.ts` -- with the other forty green. Before this sprint that same edit reddened nothing at all.",
            "TWO COUNTS THE NEW SHAPE FALSIFIES WERE REPLACED BY NAMING RATHER THAN BY A BIGGER NUMBER, per the standing prefer-naming rule: `THE SIX SHAPES` in guard.test.ts and `The five path shapes` / `A SIXTH SHAPE` in .oxlintrc.json.",
            "PREDICTED AND OBSERVED: the list drives three rules, so 644 -> 649 tests exactly.",
          ],
        },
        {
          test: "wordnet appears in neither dependencies nor devDependencies of the root package.json, and the suite passes.",
          implementation:
            "Criterion 6, including re-homing the symlink test/helpers/install.ts borrows.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "3b04fdd",
              message: "feat(hover): the wordnet handler is a package a config author installs",
              phase: "green",
            },
            {
              hash: "e874c4c",
              message: "test(package): pin what the dictionary and the workspace may not reach",
              phase: "green",
            },
          ],
          notes: [
            "It is a devDependency today used by one example; extracted it is a runtime dependency of the handler package and nothing the main package knows about.",
            "THE SYMLINK GOES RATHER THAN MOVES, which is the second of the two outcomes the criterion allows, and the premise died rather than being restated: it stood in for an install a README told a reader to perform BY HAND. No reader is told that now -- the handler declares the dictionary -- so the consumer's own `bun install` fetches it for real. FOUND BY A RED, NOT BY READING: the symlink threw EEXIST because the directory was already there.",
            "WHAT IT COSTS AND WHY IT IS WORTH IT: a cold bun cache now fetches 27MB once for the whole suite where before it fetched none. What it buys is that the dependency arrives BY THE ROUTE UNDER TEST, so a handler package that FORGOT to declare `wordnet` reddens instead of being propped up by a symlink the harness puts in reach of it.",
            "THE ABSENCE IS ASSERTED IN BOTH FIELDS AND THE ARGUMENT DIFFERS BY FIELD: in `dependencies` an entry would ship a 27MB dictionary to every consumer of a framework that reads none; in `devDependencies` it would ship nothing and still be a second, silently divergent declaration of one dependency. The suite drives a real hover, so reaching for that entry is the obvious well-meaning edit.",
          ],
        },
        {
          test: "Every prose site this falsifies is repaired, and the enumeration is committed before the sites are found.",
          implementation:
            "Criteria 7 and 8: repair the named README sites, and read the packed tarball's dependencies.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "3b04fdd",
              message: "feat(hover): the wordnet handler is a package a config author installs",
              phase: "green",
            },
            {
              hash: "e874c4c",
              message: "test(package): pin what the dictionary and the workspace may not reach",
              phase: "green",
            },
          ],
          notes: [
            "The examples stop being one kind of thing -- two are copied and one is installed -- while README says the set is copied WHOLE.",
            'Criterion 8 is scoped to `dependencies` deliberately: a workspace member in devDependencies never reaches a consumer, and files:["dist"] keeps examples/ out of the tarball anyway.',
            "The enumeration is a PREDICTION, worthless if not committed first. Its SUFFICIENCY belongs to revise's reviewer, working without sight of the list.",
            "EVERY ENUMERATED SITE REPAIRED, one by one against the list as committed: README's `Copy the whole set, or the imports fail`, which now says what IS copied and then that the handler is not; its two table rows for hover-wordnet.ts and wordnet.d.ts, REMOVED with the files; its `<!-- examples-install -->` block, which installs the handler's tarball instead of `bun install wordnet`; `exampleSources()`'s doc and its two wordnet entries in test/helpers/install.ts; and the borrowed-wordnet comment, which now records why the loan ended.",
            "THREE SITES THE LIST DID NOT NAME, REPORTED AS DRIFT RATHER THAN FOLDED INTO IT. test/readme.test.ts x2 -- the `stands in by SYMLINKING wordnet` asymmetry note, and a test whose name and premise both said the block names `the package the examples do need`, which is now the HANDLER and not the dictionary. test/helpers/readme.ts's matching `borrowing wordnet` sentence. examples/completion-path.ts's justification for not sharing `preferredFormat`, which rested on `each example is copied on its own` -- now half false, since the other one is installed. AND test/published-artifacts.test.ts's withheld-wordnet test, whose whole premise was that the ambient declaration sits in the CONSUMER'S tree; it reddened rather than drifting quietly, because the file it deleted is now a real directory.",
            "THE SWEEP THAT FOUND THEM IS BOUNDED AND ITS INSTRUMENT IS NAMED, per Sprint 46: the hazard is that `@atusy/tsudoi-` is now a SHARED PREFIX of two package names, so a matcher meant for one could silently take the other. THE INSTRUMENT: `grep -rhoE '@atusy/tsudoi.{0,22}'` reduced to the full name-character class and grouped, which SEES a longer name instead of matching it. RESULT: six distinct tokens across the tree -- `-language-server` 109, `-hover-wordnet` 21, the BARE `@atusy/tsudoi` 13, `-language-server-wrong` 2, `-language-server.` 1, `-completion-path` 1 -- and every bare and `-wrong` occurrence is inside scrum.ts, quoting the pre-rename name or Sprint 46's own record. A SECOND INSTRUMENT for the matcher class rather than the name class: every `startsWith(` and `.includes(` in src/, test/, scripts/ and packages/, unbounded on the needle. Thirteen and eleven sites, read one by one; none takes a package name as its needle except the two README token regexes, which already carry `(?![A-Za-z0-9._-])`, and package-shape's directory prefix, which this sprint bounded by realpathing BOTH sides after a workspace install made node_modules/typescript itself a link.",
            "CRITERION 8 IS ASSERTED OVER MEMBERS AS A CLASS, read off the unpacked tarball's package.json, with two vacuity guards. AND WHAT IT CANNOT CURRENTLY BE THE FIRST THING TO CATCH IS MEASURED: moving the handler into `dependencies` never reaches the assertion, because `bun install` 404s on an unpublished name and the consumer is never built. The property is FORECLOSED BY THE REGISTRY for exactly as long as both packages stay unpublished, and the assertion becomes load-bearing the moment either is published. Recorded at the test, not argued away.",
          ],
        },
        {
          test: "Review does not open until revise has converged.",
          implementation: "Run the revise skill without a PR.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "The stakeholder's standing instruction. A criterion asserts a property a perturbation can falsify; revise finds what nobody thought to assert.",
            "Sprint 46 is the evidence it earns its keep: four green checks, a balanced census and a record claiming completeness all concealed two disarmed controls.",
          ],
        },
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
    number: 49,
    pbi_id: "PBI-52",
    status: "in_progress",
    goal: "A config author installs path completion and its item resolution as @atusy/tsudoi-completion-path, completing the three-module composition the stakeholder asked for.",
    impediments: [],
    decisions: [
      "THE RESOLVE HALF TRAVELS WITH THE COMPLETION HALF, ruled by the stakeholder. Leaving resolve-path-stat behind would promote `completedPath` -- the internal marker the completion attaches to its items -- into a package's PUBLIC API, and every change to how the marker is attached would become a compatibility question. The accepted cost is that the package name does not say it answers two methods, and it is paid where a reader meets it rather than in the name.",
      "THIS SPRINT ADDS NO SHAPE TO test/guard.test.ts, A PREDICTION SPRINT 47 MADE ABOUT THIS ONE. Its deno-guard shape was written over MEMBERS AS A CLASS rather than naming a package, so a second member needs no second shape. IF A SHAPE IS ADDED HERE, SPRINT 47'S CLASS-LEVEL CLAIM WAS FALSE and that is the finding.",
      "SPRINT 47'S CRITERION 2 CARRIED A REFUTED MECHANISM AND THIS PBI INHERITS THE CORRECTED ONE: break the MEMBER'S OWN route -- its peer entry or the apparatus symlink -- and require TS2307 naming the subpath. It reads only the member, so no root observation is involved.",
      "SPRINT 47'S CLASS-LEVEL CLAIM HELD AND THE PREDICTION IS DISCHARGED: test/guard.test.ts NEEDED NO NEW SHAPE. Its deno-guard shape is `packages/probe/src/index.ts`, a path no package occupies, so a second member is covered by the shape that was already there -- and the suite was green on that file at every gate this sprint with nothing added to it.",
      "THE APPARATUS MOSTLY SUFFICED AND WHAT IT DID NOT IS REPORTED. The symlink builder, the fifth check, the packed-tarball reader and the deno guard all took a second member with no edit. THREE THINGS DID NOT: the member's tsconfig.build.json needs `types: [\"node\"]` where hover-wordnet's needs none, because this handler imports `node:` builtins and `types: []` gives TS2591 on every one of them; test/helpers/install.ts named ONE handler package and had to be enumerated from `workspaces`; and its `omitHandler` flag had to become a NAME, since a flag over two members withholds both and the config then fails on whichever import the loader reached first.",
    ],
    subtasks: [
      {
        test: "A consumer installs the package and gets both completion and item resolution, with no byte of either source in their project.",
        implementation:
          "Extract examples/completion-path.ts and examples/resolve-path-stat.ts into packages/completion-path as @atusy/tsudoi-completion-path.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "fb435bb",
            message: "tidy(test): a consumer installs every declared member, not one named package",
            phase: "refactoring",
          },
          {
            hash: "b446c20",
            message:
              "feat(completion-path): path completion and its item resolution are installed, not copied",
            phase: "green",
          },
          {
            hash: "dd72677",
            message:
              "test(published): the path package's promise is read off the installed copy, both ways",
            phase: "green",
          },
        ],
        notes: [
          "completion-path.ts exports THIRTEEN names against hover-wordnet's three. An example's exports are incidental; a package's are a promise. CLASSIFY EACH ONE INDIVIDUALLY -- the PO named this the largest single cost in the whole request.",
          "`completedPath` stays internal: it is the marker the completion attaches and the resolution reads, so publishing it would make the marker a compatibility surface.",
          "loadConfig refuses a config supplying completionItem/resolve without textDocument/completion, so the two halves must arrive together.",
          "CLASSIFIED: TWO PUBLISHED, ELEVEN INTERNAL, ONE INTERNAL FURTHER IN. `pathCompletion` and `resolvePathStat` are index.ts's whole surface. `batchSize` is not exported by its own module at all, since what it decides is the SIZE OF EACH $/progress and a test importing the number would agree with itself. The other eleven are module-exported so the member's own tests reach them and index.ts omits them.",
          "THE MARK IS IN THE TARBALL AND STILL UNPUBLISHED, which is the distinction the probe had to be built for: dist/completion.d.ts DECLARES `completedPath` -- one module must export it for the other to import it -- so what makes it internal is the `exports` map naming `.` alone. Both routes are refused, and the deep-path arm is not redundant: drop the map and the entry-point arm stays red while the deep one goes GREEN.",
          "THE OPTION BAG COST WAS MEASURED BEFORE IT WAS ACCEPTED. A consumer passes `{ cwd }` through `Parameters<typeof pathCompletion>[2]` at exit 0, a misspelled member is refused naming it, and `import type { PathCompletionOptions }` fails. So withholding the name costs the annotation and nothing else -- and the excess-property arm is what separates that green from the one `any` produces.",
          "TWO APPARATUS FACTS THIS PACKAGE FORCED, neither of which hover-wordnet had exercised. (1) tsconfig.build.json's `types: []` gives TS2591 on every `node:` specifier, so this member's build config carries `types: [\"node\"]` and its manifest a devDependency; hover-wordnet imports no builtin and never met it. (2) The member resolves THREE tsudoi subpaths -- `/types`, `/deps/protocol`, `/deps/types` -- where hover-wordnet resolves two; the symlink apparatus covered all three with no change.",
          "AND ONE ROOT-PROGRAM ARM LOST ITS ONLY IMPORTER. `deps/textdocument` was asked for by test/completion-path.test.ts alone, which moved into the member, and test/package-shape.test.ts's resolution probe REDDENED naming the empty answer -- the colour its own doc block predicts for an arm nothing imports. Repaired by annotating the document store's read in test/documents.test.ts with the PUBLISHED type, which is the pair a config author writes anyway.",
        ],
      },
      {
        test: "The member resolves tsudoi through its own route, proven by breaking that route and nothing else.",
        implementation:
          "Apply the corrected perturbation: break the member's peer entry or the apparatus symlink and require TS2307 naming the subpath.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "b270197",
            message:
              "test(members): each member reaches tsudoi by its own route, broken one arm at a time",
            phase: "green",
          },
        ],
        notes: [
          "The mechanism Sprint 47's criterion asked for was refuted by this repository's own record -- root tsc stays green because `name` and `paths` are redundant covers. This reads ONLY the member.",
          "Sprint 48 measured that a wrong peerDependencies key leaves the fifth check exit 0 and silent, while packages/hover-wordnet's own package-shape test DOES redden on it. Know which instrument you are relying on.",
          "RE-MEASURED ON THIS MEMBER AND SPRINT 48 HOLDS, WIDER THAN IT WAS WRITTEN: with `peerDependencies` DELETED from packages/completion-path/package.json, the member's own `tsc --noEmit` is exit 0 AND the fifth check is exit 0, both silent -- so the load-bearing route is the apparatus SYMLINK and the manifest entry is a declaration nothing resolves through. What refuses it is the member's own package-shape test, watched failing at `+ undefined`.",
          "THE THIRD ARM'S MECHANISM WAS SUBSTITUTED ON A MEASUREMENT OF THE CLAIM ITSELF, not on an inference from a neighbouring one. `break a name in src/types.ts` DOES NOT REACH A MEMBER: renamed `MethodHandler` to `MethodHandlerRenamed` at both its occurrences in src/types.ts and ran each member's own `tsc -p tsconfig.json` with NO rebuild -- BOTH EXIT 0, because a member resolves through the `exports` map into dist/ and nothing it reads had changed. Rebuilding to make it visible is the Sprint-44 class, since a failed rebuild leaves dist/ fresh and wrong. The probe asks the subpath for a name it does not export instead: TS2305 with ZERO TS2307 separates `a real declaration` from `unresolved` and from `any`, with no build of anyone's.",
          "WHAT THE NEGATIVE ARM PERTURBS IS THE REPOSITORY'S OWN tsconfig.json, RESTORED IN A `finally` AND REPAIRED BY NOTHING ELSE -- unlike the symlink, which the shared builder rewrites. BOUNDED RATHER THAN WAVED AWAY: bun runs test files sequentially in one process and tests within a file sequentially, so the window is one test's own await chain; and no root file resolves a tsudoi subpath LAZILY -- the suite's two dynamic imports take an external package and an absolute file URL, neither of which a `paths` mapping answers. The residual is a future test that spawns during that window.",
        ],
      },
      {
        test: "Both members carry a README a stranger can act on, verified off the packed tarball.",
        implementation:
          "Per-member READMEs over BOTH packages, naming what it answers, that it requires tsudoi at run time, and the constraint that bounds it.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "68c4ee4",
            message:
              "docs(packages): each handler package carries the README a registry page shows",
            phase: "green",
          },
        ],
        notes: [
          "hover-wordnet's bounding constraint is that whitespace is its word rule. completion-path's must be found and stated, not invented.",
          "Nothing is published yet, so no registry page is blank today -- but tsudoi's README cannot be where every handler explains its own constraints.",
          "FOUND IN THE SOURCE, NOT INVENTED, AND THE REJECTED CANDIDATE IS NAMED: completion-path's bound is WHITESPACE ENDS A PATH -- `pathFragments` scans back from the cursor to the nearest whitespace, so a document that QUOTES, ESCAPES or COMMA-SEPARATES its paths is served by a handler of its own. The candidate declined as the headline is `nothing recurses; one directory listing per fragment`: it is true and it is stated, but it bounds WHAT IT COSTS rather than WHICH DOCUMENTS IT SERVES, and the criterion asks for the second. The two packages arriving at the same whitespace rule independently is a coincidence worth reading, not a shared implementation.",
          'MEASURED BEFORE THE TABLE WAS EDITED: `files: ["dist"]` names no README.md and `bun pm pack` COLLECTS IT ANYWAY, so a reading taken from the manifest would have concluded the registry page is blank. Both members\' READMEs are read out of the ARCHIVE, and the three subjects are pinned per member -- the bounding sentence differs by package, so a shared needle would be satisfied by whichever member carried it.',
          "THE ROUTE MOVED RATHER THAN BEING DUPLICATED. The `handler-pack` and `examples-install` markers are gone from the root README and live in each member's, extracted and executed PER MEMBER; a root test refuses either marker's return. The root document's own promise is narrowed to `every block HERE is executed`, and the read-only exception now sits in the documents that carry the read-only command.",
        ],
      },
      {
        test: "Something reddens the day tsudoi is published, so the optional-peer premise cannot die unnoticed.",
        implementation:
          "Pin the optional-peer reversal where the publishing edit passes, over BOTH members.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "dd15221",
            message:
              "test(premise): the optional-peer falsehood cannot outlive the reason it is carried",
            phase: "green",
          },
        ],
        notes: [
          "`peerDependenciesMeta.optional: true` says `works without tsudoi`, which is false; it buys silence on a 404 while tsudoi is unpublished. Measured: a project given the handler tarball alone installs with NO warning at all, then fails at load.",
          "The property is required; the instrument is Planning's to choose. README's `The package is not published` section is executed by the suite and is a candidate, not a requirement.",
          "THE INSTRUMENT CHOSEN, AND THE SHAPE MATTERS MORE THAN THE SITE: the premise is READ and never ASSERTED. An assertion that the README still says `not published` would demand the document keep lying after publication, which is the opposite of the property; what may not happen is the manifest and the document DISAGREEING, in either direction -- a member that dropped the flag early is named too, because installing it then 404s.",
          "WATCHED FAILING RATHER THAN ARGUED: with that section rewritten to say tsudoi is published, the reading names `packages/completion-path` and `packages/hover-wordnet` and what each of them says. The fact itself is shared with test/readme.test.ts as one exported constant, so the two cannot disagree about which section states the premise, and that file already requires it to have exactly ONE home.",
          "WHAT IT CANNOT SEE, BOUNDED HONESTLY: a publisher who publishes and never touches the README. Nothing in a suite observes a registry, and a probe that did would make this repository's green depend on somebody else's uptime. What is bought is that the one edit needed to stop the document lying is the edit that reddens this.",
        ],
      },
      {
        test: "Every prose site this falsifies is repaired, and the enumeration is committed before the sites are found.",
        implementation:
          "README and comment repair. The examples set shrinks again: what remains copied, what is installed.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "fa2d766",
            message: "fix(test): the route perturbation refuses an entry it did not put there",
            phase: "refactoring",
          },
          {
            hash: "4e5304b",
            message:
              "docs(comments): the path handlers are named as a package, not as a file that moved",
            phase: "refactoring",
          },
          {
            hash: "4b65698",
            message: "docs(build): the preload's reason is re-measured, not reworded",
            phase: "refactoring",
          },
          {
            hash: "2435df1",
            message: "test(packed): a shipped comment may not name a file the reader does not have",
            phase: "green",
          },
          {
            hash: "485060f",
            message:
              "docs(readme): the capability chain's reader is named as the package it is now",
            phase: "refactoring",
          },
        ],
        notes: [
          "A NON-EXECUTED README BLOCK IS INDISTINGUISHABLE FROM AN EXECUTED ONE TO A READER, so one such block silently withdraws the guarantee for the whole document. Sprint 47 found two defects behind one unexecuted block, including an install path naming a file that is never created -- `bun pm pack` inside a member writes to the WORKSPACE ROOT.",
          "The enumeration is a PREDICTION. Its SUFFICIENCY belongs to revise's reviewer, working without sight of the list.",
          "THE ENUMERATION, COMMITTED BEFORE THE SITES ARE REPAIRED. Twenty-one predicted sites in fourteen files, in three classes. CLASS ONE, A PATH THAT NO LONGER EXISTS: bunfig.toml's measured diagnosis naming `examples/completion-path.ts`; test/helpers/build.ts's `SYNCHRONOUS ON PURPOSE` reason, which rests on that example being STATICALLY imported by a root test; test/completion.test.ts x3; test/client-capabilities.test.ts; test/workspace.test.ts; test/package-shape.test.ts; test/helpers/checkout.ts; test/fixtures/capabilities-mutation.ts; test/resolve-path-stat.test.ts; packages/hover-wordnet/test/hover.test.ts; and src/types.ts x3, src/server.ts, src/tsudoi.ts -- the last five being tsudoi's OWN source citing an example that is now a package.",
          "CLASS TWO, A CLAIM WHOSE PREMISE THIS SPRINT REMOVED rather than a path that moved: test/helpers/build.ts's account of WHICH ARM NEEDS dist/, and the README's `examples/ import ...` sentence, both written when the path handlers were files in examples/.",
          "CLASS THREE, AND IT IS SPRINT 47'S OPEN ITEM MEASURED ON THE ARTIFACT: packages/hover-wordnet/dist/hover.js SHIPS three repository-path claims -- `scripts/workspaces.ts`, `test/package-shape.test.ts`, `src/wordnet.d.ts` -- read off the packed tarball. completion-path's packed files carry NONE by the same instrument. THE INSTRUMENT IS A MATCHER AND THEREFORE SUSPECT, so the sweep is turned into a test with a proven-positive control rather than left as a grep.",
          "ONE SITE THE ENUMERATION MISSED, REPORTED AS DRIFT RATHER THAN FOLDED INTO IT: README.md's handler-context paragraph, which names the reader of `clientCapabilities.textDocument.completion.completionItem.insertReplaceSupport`. It survived the section rewrite because it sits in prose about a handler's CONTEXT rather than in the install prose that moved, so the edit that fixed the rest never passed through it.",
          "CLASS TWO CAME BACK LARGER THAN PREDICTED, AND THE SURPLUS IS THE FINDING. test/helpers/build.ts's `SYNCHRONOUS ON PURPOSE` reason was not merely citing a moved file: it was ALREADY FALSE FOR BUN, and the same file said so two paragraphs down -- `paths` intercepts a self-referencing subpath before the exports map. MEASURED, from the repository root, with a probe in each place: under test/ that subpath resolves to ./src/deps/types.ts and inside a member's test directory to ./dist/deps/types.js, because bun applies the tsconfig NEAREST THE IMPORTING FILE and a member's carries no mapping. So the synchronicity now has a true reason it did not have before -- the members' own tests are the static importers that need the build finished.",
          "AND TWO MEASURED CLAIMS WERE RE-RUN RATHER THAN REWORDED. With dist/ removed from the root AND both members and bunfig.toml absent: 87 fail / 603 pass / 2 errors, 690 of 729 tests even RUN, and the first failure names the demo config failing on `@atusy/tsudoi-completion-path`. AND `cd test && bun test` NO LONGER RUNS THE SUITE AT ALL -- measured with a filter matching nothing, 45 files and 680 tests from test/ against 49 and 731 from the root -- because bun discovers test FILES relative to the working directory too and the members' tests are outside it. A count of how many others fail under a narrowed dist/ was DROPPED rather than re-measured: it is a size that moves whenever the suite grows, and what earns the comparison its keep is which failure names the cause.",
        ],
      },
      {
        test: "Review does not open until revise has converged.",
        implementation: "Run the revise skill without a PR.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [
          "Three sprints of evidence that it finds what the gate and the criteria both miss.",
          "THE PACKED TARBALL'S SHIPPED COMMENTS ARE NEVER INSPECTED -- Sprint 47's open item. A claim in a shipped comment naming a repository path or test is the shape that has escaped three times.",
        ],
      },
    ],
  },
  retrospectives: [
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
            "A DoD CHECK CAN READ A STALE ARTIFACT, AND THIS ONE DOES. `tsc --noEmit` type-checks examples/ against `dist/types.d.ts` rather than src/, because package.json maps `@atusy/tsudoi/types` to the BUILT file; `bun test`'s preload rebuilds dist/ and TSC DOES NOT. So the two disagree exactly when the published surface has moved, which is the only time it matters. MEASURED TWICE IN ONE SPRINT, in both directions: tsc EXIT 0 beside 43 test failures on one tree, and tsc EXIT 1 on a CLEAN src/ against a leftover dist/. FILED AS A FOURTH INSTANCE OF THE SPRINT-35 STALENESS CLASS AND THE FIRST WHERE THE STALE ARTIFACT IS READ BY AN INSTRUMENT RATHER THAN BY A TEST -- the three before it were tests reading a stale dist/, which the preload now covers. THE PRACTICE UNTIL IT HAS A HOME: after any change to the published types, run `tsc -p tsconfig.build.json` BEFORE believing `tsc --noEmit`. It has no home and that is the gap: nothing protects the type check the way bunfig protects the suite.",
          timing: "immediate",
          status: "completed",
          outcome:
            "THE HOME EXISTS AND IS NAMED: `paths` in tsconfig.json at ac35327, mapping `@atusy/tsudoi/*` to ./src/*.ts, with its reason asserted in test/package-shape.test.ts because JSON cannot carry one. THE FORECLOSURE HOLDS ONLY WHILE THAT KEY MATCHES, WHICH IS THE PRECONDITION THIS OUTCOME OWES ITS READER. With a mapping that matches, `tsc --noEmit` does not read dist/ at all, measured on all four exports arms in both directions. With the same key MISSPELLED it reads dist/ on every one of them, AT EXIT 0 AND ZERO BYTES, measured at 38b8709, because the specifier falls through to the exports map -- so what is here is foreclosure PLUS A WATCHED PRECONDITION, and the watch is test/package-shape.test.ts reading which file answered each published subpath and refusing a declared mapping that matches nothing. THE ACTION TEXT IS LEFT VERBATIM because it is what was true then; this outcome is what changed. AND THE PRACTICE IS SUPERSEDED RATHER THAN FALSE, which is a distinction worth the sentence: its stated purpose -- `before BELIEVING tsc --noEmit` -- is gone, since that check no longer reads the artifact the build produces. What running `tsc -p tsconfig.build.json` STILL answers is a different question, `does src/ compile under the BUILD config`, whose types and module settings differ from the DoD's; that question is owned by bunfig.toml's preload, which builds before any test loads, and by prepack, which builds before any tarball is collected. MEASURED THIS SPRINT rather than argued: src/ carrying a `Bun` global passes `tsc --noEmit` and fails the build, and the suite reddens at test/published-specifier.test.ts naming the offending line.",
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
