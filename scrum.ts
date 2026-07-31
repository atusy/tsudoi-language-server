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
      id: "PBI-54",
      story: {
        role: "tsudoi maintainer",
        capability:
          "trust that `tsc --noEmit` is reading the source I just edited and not a built artifact from an earlier state",
        benefit:
          "the DoD's type check keeps meaning what Sprint 42 bought it for, instead of silently degrading to a check against dist/ that passes while src/ is broken",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "A `paths` MAPPING THAT NO LONGER REACHES tsudoi IS DETECTED, NOT SILENTLY SURVIVED. MEASURED IN SPRINT 46 AND THIS IS THE WHOLE MOTIVATION: deleting the key reddens test/package-shape.test.ts, but MISSPELLING it leaves `tsc --noEmit` AT EXIT 0, because self-reference through the exports map resolves into the built dist/*.d.ts instead. So the two spellings of one defect have opposite colours, and the dangerous one is the quiet one.",
          verification:
            "THE PERTURBATION IS THE MISSPELLING AND NOT THE DELETION, because deletion is already covered and covers nothing new: point the key at a name nothing answers to and the suite must redden NAMING THE MAPPING. AND THE PAIR PER SPRINT 6, since the claim is about WHICH FILE ANSWERED: a probe must distinguish `resolved to src/` from `resolved to dist/` positively, not by the absence of an error -- a stale-or-absent dist/ makes both readings look alike, so the discriminating probe is one where src/ and dist/ DISAGREE.",
        },
        {
          criterion:
            "test/package-shape.test.ts's `the repo's type check resolves the published subpaths to source` EITHER VERIFIES WHAT ITS NAME CLAIMS OR IS RENAMED TO WHAT IT VERIFIES. Today its assertion is a `toEqual` on the mapping's literal content, which is a real property and a NARROWER one than resolution-to-source. A NAME THAT OVERCLAIMS IS THE SAME DEFECT CLASS AS A FALSE COMMENT, and this project treats those as repairs rather than as taste.",
          verification:
            "Whichever is chosen, the discriminating perturbation above must redden it or the name must stop saying `to source`. Both outcomes are acceptable; leaving the name as it is with nothing behind it is the one that is not.",
        },
      ],
      notes: [
        "FOUND BY SPRINT 46 AND DELIBERATELY NOT FIXED THERE, which is the right call and is recorded so it is not read as an oversight. It is PRE-EXISTING rather than sprint-introduced, and Sprint 45's precedent governs: a separate property does not ride along merely because it touches a file the sprint touched. What Sprint 46 owed was to REPORT it, and it did.",
        "WHY THIS IS NOT COSMETIC. Sprint 42's retrospective records the stale-dist/ hazard as FORECLOSED by the `paths` mapping -- `tsc --noEmit` no longer reads dist/ at all. THIS MEASUREMENT NARROWS THAT CLAIM: it is foreclosed only while the mapping is spelled correctly, and NOTHING DETECTS A MISSPELLING. An `outcome` recorded as foreclosure that is really a foreclosure-plus-an-unwatched-precondition is exactly the shape this project calls a false proof closing a question.",
        "THE SPRINT-46 EVIDENCE, so whoever plans this does not re-derive it: `name` and `paths` are REDUNDANT COVERS OF ONE ROUTE. Reverting package.json's `name` alone leaves tsc at EXIT 0; deleting `paths` alone leaves tsc at EXIT 0; only the conjunction reddens, with fourteen TS2307. Neither key is pinned by the type check alone.",
        "SEQUENCED AFTER PBI-51 AND THE OVERLAP IS NAMED RATHER THAN LEFT TO COLLIDE: PBI-51 adds a root exclusion and a fifth check over the same tsconfig, so whoever plans PBI-51 should say explicitly whether this folds into it or stays separate. THE DEFAULT IS SEPARATE, on the precedent above.",
      ],
    },
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
    {
      number: 46,
      pbi_id: "PBI-53",
      status: "done",
      goal: "The published package is named @atusy/tsudoi-language-server on all three routes, and the sweep's own controls are proven still armed.",
      subtasks: [
        {
          test: "The census is committed before any file is touched, so it is a prediction rather than a report.",
          implementation:
            "Take a two-pattern census. P1 is boundary-aware so the old name is not counted inside the new one; P2 widens to `atusy`, and P2-minus-P1 is enumerated BY NAME.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "46f2281",
              message:
                "docs(scrum): the census before the sweep, and two controls refuted in advance",
              phase: "refactoring",
            },
          ],
          notes: [
            "Counts are OCCURRENCES (grep -o | wc -l), never lines: one README line holds three.",
            "The file list comes from git ls-files, never by hand.",
            "LICENSE's copyright line is the DELIBERATE NON-TARGET, named in the census so a wide sweep corrupting the author's name is a caught error rather than a silent one.",
            "Writing the census adds old-name occurrences to the file holding it. Harmless only because scrum.ts is excluded from the subject by construction.",
          ],
        },
        {
          test: "The four DoD checks pass at the end of the commit, which is what exercises all three routes.",
          implementation:
            "One atomic rename: package.json name, tsconfig paths key, every live specifier and split spelling and regex, the README's EXECUTED bytes, then bun install for bun.lock.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "116644c",
              message: "feat(pkg): the package answers to @atusy/tsudoi-language-server",
              phase: "green",
            },
          ],
          notes: [
            "NOT test/helpers/readme.ts. It is criterion 2's instrument and must testify about this commit while unmodified.",
            "The red window lives inside this commit's working tree and NEVER at a commit boundary. A dual-name shim is refused: paths is only the tsc route, and neither the runtime self-reference nor the tarball layout can be dual-named.",
            "README's --filename tsudoi.tgz is an arbitrary local filename, not the package name, and stays.",
          ],
        },
        {
          test: "The suite passes with the instrument unchanged in the rename commit, and the edit to it is reported rather than absorbed.",
          implementation:
            "Repair test/helpers/readme.ts's single doc comment, alone, in its own commit after its subject has moved.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "b09b49b",
              message: "docs(test): the extractor's comment names the package it describes",
              phase: "refactoring",
            },
          ],
          notes: [
            "Criteria 1 and 2 collide on this one file. The separation is structural rather than argued.",
            "Reported rather than absorbed: the rename commit's --stat does not list this file, which is criterion 2's evidence mechanically rather than by assurance. The edit is the one doc comment, reflowed because the longer name crosses the width.",
          ],
        },
        {
          test: "Each control names what it measured, and a green that measures nothing is recorded as such.",
          implementation:
            "Run the five controls: C1 revert name alone; C2 delete the paths key; C3 revert one README start line; C4 the standing Sprint-14 re-run; C5 criterion 3's sliced-JSON comparison.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "No commit of its own: the controls change no product file, and their output IS the record in decisions.",
            "C4 states TARGET SURVIVAL BEFORE COLOUR: the examples still import through the subpath, now new-spelled, so the re-run is available. Predict exit 1 naming the subpath and ZERO TS2307.",
            "C5 compares completed and retrospectives SLICED OUT of the JSON. Whole-document comparison fails by construction, since this sprint writes its own census into it.",
            "Any hand-run probe runs on both runtimes or its record names the one it ran on.",
          ],
        },
        {
          test: "No control the sweep touched is left disarmed.",
          implementation:
            "Ask Sprint 45's question -- what would make this red, now? -- of every control the sweep touched, individually.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "The tightening landed inside the rename commit, so this subtask adds no commit: it is the ASKING and the three-arm measurement that are its output.",
            "A rename is the ARCHETYPAL DISARMING EDIT: it changes what a matcher matches without changing whether it passes.",
            "test/readme.test.ts:368's /bun add @atusy\\/tsudoi/ still matches the renamed command BY PREFIX. Tighten to the full new name, or record the green as measuring nothing.",
            "That is the known instance. Find the rest rather than fixing only it.",
          ],
        },
        {
          test: "Review does not open until revise has converged.",
          implementation:
            "Run the revise skill without a PR: multi-perspective review, then independent review, fixing findings at each stage until no actionable ones remain.",
          type: "structural",
          status: "completed",
          commits: [],
          notes: [
            "The stakeholder's standing instruction, carried as an active retrospective improvement.",
            "A criterion asserts a property a perturbation can falsify; revise finds what nobody thought to assert. No criterion may be met by argument at Review.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "SCOPE RULED BEFORE EXECUTION: NO `packages/` IN THIS SPRINT. The Developer checked the objection against the PBI's own sentence, which is the strongest form it could take -- criterion 1 ends `the four DoD checks pass, which is what exercises all three routes`, and a member is answered by root tsc THROUGH THE VERY `paths` KEY THIS PBI RE-SPELLS, reporting success. Building the workspace here would ship the hazard PBI-51 exists to foreclose, inside the sprint that re-spells its mechanism, and destroy PBI-51's criterion-2 contrast before it could be taken.",
        "THE GATE WAS RED AT THE COMMIT THIS SPRINT WOULD HAVE OPENED ON, AND THE SCRUM MASTER PUT IT THERE. Writing the dashboard back through a JSON serialiser left scrum.ts unformatted and `oxfmt --check .` at exit 1, so criterion 1 was unsatisfiable for a reason having nothing to do with its subject. THE DEVELOPER FOUND IT AT PLANNING -- not the PO, not the Scrum Master. Repaired in e060f01 with a control rather than an assurance, and THAT CONTROL BECAME CRITERION 3'S INSTRUMENT: scrum.ts prints its record as JSON and that output is byte-identical across the reformat, so the record is the extracted value and the file is one serialisation of it.",
        "THE NAME IS SPELLED IN FIVE FORMS THIS REPOSITORY CANNOT GREP FOR AS ONE STRING, measured at Planning: split across function arguments at test/helpers/install.ts and test/published-artifacts.test.ts, in TARBALL form `atusy-tsudoi-0.0.0.tgz` which shares no substring with the specifier, and inside regexes with escaped slashes at test/readme.test.ts. This is why the census takes two patterns rather than one.",
        "THE CENSUS, TAKEN AND COMMITTED BEFORE ANY FILE IS TOUCHED, WITH ITS PROVENANCE ATTACHED RATHER THAN ASSUMED. The file list is `git ls-files`, 140 tracked files, AND NEVER A HAND LIST. Counts are OCCURRENCES from `grep -o | wc -l` AND NEVER LINES, since one README line carries three. P1, the specifier pattern, is `@atusy/tsudoi([^A-Za-z0-9._-]|$)`: THE NEGATIVE CLASS IS THE WHOLE POINT, because the old name is a prefix of the new one and an unbounded pattern would count every success as a survivor. P2, the scope instrument, is `atusy`. MEASURED AT bee94c5 WITH ALL FOUR DoD CHECKS GREEN, each command run unpiped. P1 IS 109 OCCURRENCES ACROSS 27 FILES, beside 14 inside scrum.ts, which is excluded from the subject by construction because writing this census into it moves its own count. PER FILE: README.md 18; test/published-artifacts.test.ts 17; test/installed-runtime.test.ts 9; test/installed-specifier.test.ts 5; test/helpers/checkout.ts 5; src/types.ts 5; test/readme.test.ts 4; test/published-specifier.test.ts 4; test/package-shape.test.ts 3; test/completion-path.test.ts 3; examples/completion-path.ts 3; test/installed-without-node-types.test.ts 2; examples/hover-wordnet.ts 2; examples/diagnostic-trailing-whitespace.ts 2; and ONE EACH in tsconfig.json, test/hover-wordnet.test.ts, test/helpers/typecheck.ts, test/helpers/readme.ts, test/helpers/install.ts, test/helpers/build.ts, test/fixtures/published-specifier.ts, package.json, examples/tsudoi.config.ts, examples/resolve-path-stat.ts, examples/formatting-trailing-whitespace.ts, bunfig.toml and bun.lock. THE NEW NAME STANDS AT ZERO IN ALL 27, so the after-reading is not inflated by anything already present. AFTER, EACH OF THESE FILES STILL EXISTS AND CARRIES THAT SAME COUNT OF THE NEW NAME, PER FILE AND NEVER IN TOTAL, and a census file that no longer exists FAILS rather than counting as zero.",
        "P2-MINUS-P1 ENUMERATED BY NAME AND CLOSING TO ZERO, WHICH IS THE CENSUS'S OWN COMPLETENESS CONTROL RATHER THAN A FOOTNOTE TO IT. A surplus that merely had a plausible size would prove nothing; one where every occurrence is named is what makes the wide pattern an instrument. THE SURPLUS IS 19: seven outside scrum.ts and twelve within. OUTSIDE, SIX ARE THE OLD NAME IN A FORM NO SPECIFIER SEARCH CAN SEE -- test/helpers/install.ts:303 and test/published-artifacts.test.ts:540 SPLIT ACROSS FUNCTION ARGUMENTS as join(..., `@atusy`, `tsudoi`, ...); test/installed-runtime.test.ts:20 in TARBALL FORM `atusy-tsudoi-0.0.0.tgz`; and THREE INSIDE REGEXES WITH ESCAPED SLASHES, two on test/readme.test.ts:368 and one on :450. THE SEVENTH IS LICENSE:3 `Copyright (c) 2026 atusy`, THE DELIBERATE NON-TARGET: a naive wide sweep corrupts the author's name, and naming it here is what makes that a caught error rather than a silent one. THE TWELVE WITHIN are five occurrences of the new name, two future member names, two prose quotations of the escaped-slash regex, the LICENSE non-target quoted in criterion 1, the tarball form quoted above, and P2's own pattern named in a subtask. NOTHING IS LEFT OVER, AND THE ASSIGNMENT IS THE PROPERTY RATHER THAN THE COUNT.",
        "C1 AND C2 AS PLANNED ARE EACH MASKED BY THE OTHER MECHANISM, MEASURED BEFORE THE SWEEP SO THE COLOURS ARE PREDICTED HONESTLY RATHER THAN RESCORED AFTERWARDS. The plan predicts root tsc TS2307 from reverting package.json `name` alone, and tsc red from deleting the tsconfig `paths` key alone. BOTH ARE REFUTED AT bee94c5, each probe unpiped and the tree restored after: mutating `name` with `paths` intact gives tsc EXIT 0, because `paths` answers the subpath before self-name resolution is ever consulted; deleting `paths` with `name` intact ALSO gives EXIT 0, because self-reference through the exports map resolves into the built dist/*.d.ts. ONLY THE CONJUNCTION REDDENS -- both together give EXIT 1 with FOURTEEN TS2307 naming the three subpaths from examples/ and test/. THE TWO KEYS ARE REDUNDANT COVERS OF ONE ROUTE AND NEITHER IS PINNED ALONE, which is Sprint 42's degenerate shape exactly: `EXIT 0 WITH ZERO ERRORS` is what hides a probe whose subject is reached by something else. C1'S SURVIVING ARM IS THE RUNTIME ONE, and it pays Sprint 45's two-runtime rule out inside a control: mutating `name` reddens test/completion-path.test.ts ON DENO AND NOT ON BUN, because bun elides the type-only import that deno loads. C2'S DEGENERACY IS CONDITIONAL ON dist/ BEING BUILT, which is the only reason the exports arm can stand in for paths at all.",
        "THE PREDICTIONS, COMMITTED BEFORE ANY FILE IS TOUCHED, WITH THEIR COUNTERFACTUALS BESIDE THEM per Sprint 40 -- a 0/0/0 reads as confirmation only next to what a non-zero would have meant. PREDICTED: per-file `expect(` diff ZERO EVERYWHERE; 635 tests to 635; 1923 expect() calls to 1923; NO NEW TEST FILE; bun.lock diff EXACTLY ONE LINE; the DoD stays at FOUR checks; no packages/ directory and no workspaces key. THE COUNTERFACTUALS. A NON-ZERO `expect(` DIFF ANYWHERE means the sweep changed behaviour while claiming to change only a name -- AND THE ONE EXCEPTION IS RESERVED IN ADVANCE RATHER THAN CLAIMED LATER: tightening a prefix-matching matcher in place is a zero-delta edit, so if re-arming any control turns out to require ADDING an assertion, THAT IS A MISSED PREDICTION AND IS REPORTED AS ONE. A bun.lock diff wider than one line means the rename moved a dependency and not only this package's own name. A CHANGED TEST COUNT means a specifier edit renamed a test into or out of existence.",
        "C1, TARGET SURVIVING FIRST: package.json carries a `name` field spelling the new name, so reverting it is constructible. IT MEASURES IN TWO ARMS THAT DISAGREE, AND THE DISAGREEMENT IS THE RESULT. THE tsc ARM IS DEGENERATE AND IS RECORDED AS MEASURING NOTHING -- EXIT 0, zero errors, because `paths` answers the subpath before self-name resolution is ever consulted. THE RUNTIME AND TARBALL ARM IS THE REAL ONE: 83 of 635 tests redden, across every installed-* file, the published-artifact checks, and the deno arm of the in-repo examples. NOTHING ASSERTS THE `name` FIELD DIRECTLY AND NOTHING NEEDS TO -- what pins it is the tarball the suite packs and installs from it, which is a stronger owner than an equality on a string would be.",
        "C2, TARGET SURVIVING FIRST: the `paths` key exists, new-spelled. DELETING IT LEAVES tsc AT EXIT 0 WITH ZERO ERRORS, degenerate for a reason worth keeping -- self-reference through the exports map resolves into the built dist/*.d.ts, so `name` and `paths` are REDUNDANT COVERS OF ONE ROUTE and neither is pinned by the type check alone. ONLY THE CONJUNCTION REDDENS tsc: name reverted AND paths deleted gives EXIT 1 with FOURTEEN TS2307 naming the three new subpaths from examples/ and test/, which doubles as the positive proof that the tsc route resolves the NEW name. AND WHAT ACTUALLY PINS `paths` IS THE SUITE: deleting the key reddens test/package-shape.test.ts's `the repo's type check resolves the published subpaths to source`, whose toEqual carries the mapping literally. C2 IS RE-AIMED AT THAT ASSERTION rather than at the type check the plan named, because that is where the property is defended.",
        "C3, TARGET SURVIVING FIRST: the README's two start-command lines carry the new name inside blocks the suite extracts and runs. Reverting THE BUN LINE ALONE reddens EXACTLY TWO tests -- `the README's quickstart brings up a server under bun` and `the documented failure behaviour is what happens under bun` -- while the deno pair stays green, which is the blast radius a one-line perturbation ought to have and evidence that the two runtimes are separately defended. THE README'S EXECUTED BYTES ARE THE SUBJECT, MEASURED RATHER THAN ASSERTED.",
        "C4, THE STANDING SPRINT-14 RE-RUN, TARGET SURVIVAL STATED BEFORE COLOUR: tsconfig's `paths` maps the new name to ./src/*.ts and all six examples/ still import through that subpath, so the arm is available and now runs against the new spelling -- strictly more than the recorded run had. COLOUR: EXIT 1, errors at examples/ naming the subpath, ZERO TS2307, which is the recorded shape. ONE MISSED PREDICTION, STATED RATHER THAN SMOOTHED: TS2305 and not the TS2724 the previous run recorded, because the compiler offers no near-miss for this name where it offered one before. A TYPE CHECK AND NOT A RUNTIME PROBE, so the two-runtime rule does not bite here and is not claimed.",
        "C5, CRITERION 3'S INSTRUMENT: `completed` and `retrospectives` sliced out of `bun scrum.ts`'s JSON are BYTE-IDENTICAL across the whole sprint at sha256 2df1838a, WHILE THE WHOLE DOCUMENT'S HASH MOVES. That the two readings disagree is exactly what shows the slicing is load-bearing rather than a convenience. The record still carries NINE old-name occurrences, SEVEN under completed and TWO under retrospectives, VERBATIM.",
        "S5 ASKED ONE AT A TIME OF EVERY NAME-BEARING MATCHER THE SWEEP TOUCHED, NEVER AS A BATCH. THE CLASS IS SEVEN: three `toContain` on the types subpath in installed-specifier, published-specifier and published-artifacts; package-shape's `toEqual` on the paths mapping; the two token regexes at test/readme.test.ts; and the subpath-collecting regex beside them. THE KNOWN INSTANCE IS MEASURED IN THREE ARMS RATHER THAN ARGUED. Tightened pattern with the old name restored in the README: RED, three tests. Loosened pattern with the CORRECT README: GREEN. Loosened pattern with the old name restored: ALSO GREEN. THE SECOND AND THIRD SHARING A COLOUR IS THE WHOLE PROOF -- a prefix-matching pattern cannot distinguish the two names at all, so its green measured nothing, and tightening it is what created a control where there had only been a shape. ITS SIBLING REDDENS HONESTLY, VERIFIED RATHER THAN INHERITED FROM THE CRITERION THAT ASSERTED IT: reverting ONE README subpath mention reddens the set-equality against the exports map. RE-SPELLING A PREFIX PATTERN WITH THE FULL NEW NAME IS NOT BOUNDING IT, AND THAT IS WHERE THIS ENTRY READ FALSE: the two README token regexes stayed RIGHT-UNBOUNDED after being re-spelled, so the class carried THREE prefix matchers and not one. MEASURED: a README naming `@atusy/tsudoi-language-server-wrong` throughout satisfies all three tokens of `the registry route is intended and unverified`, and those two commands are the only ones in the document the suite never executes, so that fact is their sole spelling control. Both tokens now carry `(?![A-Za-z0-9._-])`, and with it the same perturbation reddens all three of the fact's tests. A BOUNDARY-AWARE RE-SWEEP OF THE CLASS FINDS NO OTHER UNBOUNDED MEMBER, measured rather than argued: the three `toContain` and package-shape's `toEqual` spell the specifier through `/types`, which a longer name fails, and the subpath-collecting regex is bounded by the slash it requires -- it reddens under that same perturbation. C1's 83 reddening tests reach all three toContain sites.",
        "`NONE WEAKENED` IS DIFFED AND NOT ASSERTED, WHICH READS STRICTLY MORE THAN THE PER-FILE COUNT DID. The predicted per-file `expect(` diff is ZERO EVERYWHERE and it held -- but a count cannot see an assertion SWAPPED for another, so the line diff is taken as well. ACROSS THE WHOLE SPRINT test/, src/ AND examples/ CARRY EIGHT `expect(` LINES OF DIFF, WHICH ARE FOUR PAIRS: three `toContain` on the types subpath and package-shape's `toEqual` on the paths mapping, EACH THE SAME ASSERTION WITH THE NAME MOVED. NONE ADDED, NONE REMOVED, NONE WEAKENED, and the four are exactly the members of S5's matcher class that live on an `expect(` line -- the other three are bare regexes and do not appear in this instrument at all, which is itself the reason the class was swept by hand rather than by this diff.",
        "THE PAIRED GUARD BESIDE THE SUBPATH EXTRACTOR IS MEASURED RATHER THAN REASONED, because inferring a control's colour is the move this project keeps catching. Breaking the extractor's regex so it matches NOTHING reddens `the published subpaths the README names are exactly the ones package.json exports` ALONE, ONE test, while its permanent pair stays GREEN -- which is what that pair's own comment predicts, since a `not.toEqual` against an empty list is satisfied by a dead extractor. THE PAIR DOES NOT GUARD THE DEAD-EXTRACTOR CASE AND DOES NOT CLAIM TO; the equality above it does, and the two together are what make Sprint 6's absence rule hold here.",
        "A GAP FOUND BY ASKING, AND IT IS AN ABSENT CONTROL RATHER THAN A DISARMED ONE: NOTHING PINS THE TARBALL FILENAME TO THE PACKAGE NAME. test/helpers/install.ts finds the packed artifact by `.endsWith('.tgz')`, name-agnostic BY DESIGN, and that is precisely why the installed route survived the rename without a single edit to the helper. The name reaches that route only through package.json, which C1 covers. RECORDED AS A GAP RATHER THAN REPAIRED, because building an assertion here would add an `expect(` this sprint predicted it would not add, and quietly widening a prediction to fit the work is the failure this record exists to prevent.",
        "A MISSED PREDICTION, REPORTED RATHER THAN ABSORBED. `bun install` DOES NOT REWRITE THE ROOT WORKSPACE NAME IN bun.lock, AND NEITHER DOES `bun install --force`: the lockfile is regenerated from the dependency graph, and the root's own name is not part of what bun considers stale. The plan's `then bun install for bun.lock` would have left the lockfile spelling the old name and the census one file short, with all four checks still green -- a silent shortfall of exactly the kind the per-file census exists to catch, and the census is what caught it. The line was edited by hand and `bun install` re-run to prove it stable: EXIT 0, diff still EXACTLY ONE LINE, not reverted.",
        "THE CENSUS BALANCES, PER FILE AND NEVER IN TOTAL. ALL 27 CENSUS FILES STILL EXIST and each carries EXACTLY the count of the new name it carried of the old -- 18 in README.md, 17 in test/published-artifacts.test.ts, 9 in test/installed-runtime.test.ts, and so down to the singletons, compared file by file rather than summed. LICENSE IS UNTOUCHED and its copyright line still reads `atusy`, the named non-target intact. THE OLD-NAME GREP IS THEN THE CHEAP CONFIRMATION IT WAS MEANT TO BE: FIFTEEN HITS REMAIN AND ALL FIFTEEN ARE IN scrum.ts, none anywhere else in the tree. THE THREE CLASSES, WITH NONE LEFT OVER. USE IS EMPTY -- not one live specifier, path segment, key or command spells the old name, which is the sweep's actual result and the only class whose emptiness is the point. MENTION IS THREE: criterion 1 and criterion 3, which name the old name AS THEIR SUBJECT and would be self-defeating if re-spelled, and this sprint's own census entry quoting the P1 pattern. EVIDENCE IS TWELVE: PBI-51's three recorded probe readings, seven under `completed` and two under `retrospectives`, all VERBATIM. THE COUNT IS MEASURED IMMEDIATELY BEFORE THIS ENTRY IS WRITTEN AND WRITING IT MOVES THE COUNT, which is why the criterion freezes no number and the ASSIGNMENT rather than the total is the property.",
        "TWO DRIFTS FROM THE HANDED PLAN, RE-MEASURED RATHER THAN COPIED per Sprint 27, and both are findings rather than corrections. FIRST, the plan's baseline was taken where `oxfmt --check .` was RED; at bee94c5 ALL FOUR CHECKS ARE GREEN and the reformat the plan reserved as its own first step is already landed, so it is not this sprint's to run and criterion 1's premise is satisfiable as written. SECOND, scrum.ts carries FOURTEEN P1 hits and not the plan's fifteen: product_backlog FIVE rather than six, completed seven, retrospectives two. The missing one is criterion 1's verification, rewritten between the plan and the sprint. SPRINT 43'S LIVING-FILE POINT DEMONSTRATING ITSELF ON THE EXACT COUNT THAT ENTRY EXISTS TO KEEP UNFROZEN -- which is why the criterion freezes no number and this one carries the commit it was taken at. THE THREE-CLASS ASSIGNMENT OF THE REMAINING HITS IS DELIBERATELY NOT TAKEN HERE: committing this census adds old-name occurrences to scrum.ts, so an assignment made now would be stale on the next commit and must be measured at acceptance instead.",
        "ACCEPTED BY AN INDEPENDENT PRODUCT OWNER. CRITERION 4 IS MET ON THE SECOND PASS AND THE FIRST-PASS MISS STAYS BESIDE IT -- the fix does not rewrite the miss. The increment was incomplete and is now complete, fixed by code; THE RECORD ASSERTED THE OPPOSITE OF WHAT WAS TRUE, and that is the more serious of the two because a false proof closing a question is the highest-cost error in this economy.",
        "CONCEALMENT WAS NOT MERELY AVAILABLE, IT WAS ACHIEVED. Four green DoD checks, a per-file census that balanced, and a sprint record stating no prefix matcher remained -- and two right-unbounded matchers survived in test/readme.test.ts, where `@atusy/tsudoi-language-server-wrong` satisfied all three fact tokens. NOTHING IN THE GATE COULD SEE IT. `revise` broke it, running for the first time under the stakeholder's standing instruction, and earned its keep in its first sprint.",
        "THE TARBALL FILENAME QUESTION IS MEASURED AND THE RECORD STANDS. test/installed-runtime.test.ts's install line carries NO filename -- it reads `bun install ./<the packed tarball>` -- while the two lines below it ARE `route`'s own bytes and fail by running if their spelling goes stale. So nothing anywhere pins the filename, and that asymmetry is stated at the site: bun derives the filename from name AND version, so a literal would go stale at the next release with every check green.",
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
    number: 48,
    pbi_id: "PBI-54",
    status: "in_progress",
    goal: "A misspelled paths mapping is caught rather than falling through to dist/ at exit 0, so the stale-artifact hazard is foreclosed rather than foreclosed-plus-an-unwatched-precondition.",
    impediments: [],
    decisions: [
      "SPRINT 47'S RETROSPECTIVE BINDS THIS SPRINT'S CRITERIA: a criterion naming a colour must CITE THE MEASUREMENT THAT PRODUCED IT, so an uncited colour is visibly a guess. This PBI's own discriminating perturbation is THE MISSPELLING, NOT THE DELETION -- deletion is already covered and covers nothing new, which is precisely the distinction Sprint 47's criterion 2 got wrong.",
      "THE CLASS IS NAMED RATHER THAN THE INSTANCE. An outcome recorded as FORECLOSED that is really FORECLOSURE PLUS AN UNWATCHED PRECONDITION is what this PBI corrects: Sprint 42 recorded the stale-dist hazard as foreclosed, and it is foreclosed only while `paths` is spelled correctly.",
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
          "PREDICTION WRITTEN FIRST AND IT HELD, on the tree at 38b8709 with the key misspelled to a name nothing answers to: `tsc --noEmit` EXITS 0 AND PRINTS ZERO BYTES while all four published subpaths are answered by dist/*.d.ts, and `bun test` gives 685 pass / 2 fail of 687. The failure that names the KEY prints the misspelling against an EMPTY matched set; the failure that names the EFFECT prints the four dist/*.d.ts against the four src/*.ts. Reverted, and the tree verified identical to HEAD.",
          "A POISONED MEASUREMENT WAS CAUGHT BY THE PREDICTION AND IS REPORTED RATHER THAN DROPPED: a first attempt at the deletion arm left tsconfig.json UNEDITED -- the substitution failed -- and returned 687 pass / 0 fail against a prediction of one failure. The mismatch is what exposed it; the reading was discarded and retaken.",
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
          "THE ACTION TEXT IS UNTOUCHED, as it says of itself, and so is the old package name inside that entry: Sprint 47's census classes a name quoted in a recorded measurement as EVIDENCE, and re-spelling it would edit what was measured. THE COMMITS SEPARATE BECAUSE THE DASHBOARD COMMITS ALONE -- a hook refuses scrum.ts beside anything else, which is a constraint worth knowing before staging.",
        ],
      },
      {
        test: "Review does not open until revise has converged.",
        implementation: "Run the revise skill without a PR.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [
          "The stakeholder's standing instruction. Two sprints of evidence that it finds what the gate and the criteria both miss.",
        ],
      },
    ],
  },
  retrospectives: [
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
            "THE HOME EXISTS AND IS NAMED: `paths` in tsconfig.json at ac35327, mapping `@atusy/tsudoi/*` to ./src/*.ts, with its reason asserted in test/package-shape.test.ts because JSON cannot carry one. THE FORECLOSURE HOLDS ONLY WHILE THAT KEY MATCHES, WHICH IS THE PRECONDITION THIS OUTCOME OWES ITS READER. With a mapping that matches, `tsc --noEmit` does not read dist/ at all, measured on all four exports arms in both directions. With the same key MISSPELLED it reads dist/ on every one of them, AT EXIT 0 AND SILENT, because the specifier falls through to the exports map -- so what is here is foreclosure PLUS A WATCHED PRECONDITION, and the watch is test/package-shape.test.ts reading which file answered each published subpath and refusing a declared mapping that matches nothing. THE ACTION TEXT IS LEFT VERBATIM because it is what was true then; this outcome is what changed. AND THE PRACTICE IS SUPERSEDED RATHER THAN FALSE, which is a distinction worth the sentence: its stated purpose -- `before BELIEVING tsc --noEmit` -- is gone, since that check no longer reads the artifact the build produces. What running `tsc -p tsconfig.build.json` STILL answers is a different question, `does src/ compile under the BUILD config`, whose types and module settings differ from the DoD's; that question is owned by bunfig.toml's preload, which builds before any test loads, and by prepack, which builds before any tarball is collected. MEASURED THIS SPRINT rather than argued: src/ carrying a `Bun` global passes `tsc --noEmit` and fails the build, and the suite reddens at test/published-specifier.test.ts naming the offending line.",
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
