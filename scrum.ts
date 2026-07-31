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
      id: "PBI-53",
      story: {
        role: "config author",
        capability:
          "name tsudoi by ONE name -- in package.json, in every import specifier, and in the docs",
        benefit:
          "one name to learn and to type, rather than a package whose name and whose repository disagree",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "`@atusy/tsudoi` IS GONE AS A PACKAGE NAME AND AS A SPECIFIER, AND `@atusy/tsudoi-language-server` RESOLVES ON EVERY ROUTE THE OLD NAME RESOLVED ON. Three routes, and all three are the criterion rather than one standing for the others: tsc through the `paths` mapping in tsconfig.json, the in-repo runtime through the exports map into dist/, and an installed consumer through the tarball.",
          verification:
            "THE POSITIVE DIRECTION IS MEASURED AGAINST A CENSUS TAKEN AND COMMITTED BEFORE ANY FILE IS TOUCHED, and this is the whole of the verification rather than a refinement of it. A ZERO-RESULT GREP FOR THE OLD NAME IS EQUALLY TRUE OF A REPO WHERE THE SWEEP WORKED AND ONE WHERE SOMEONE DELETED THE FILES -- Sprint 39's ambiguity in its most literal form, and `absence` is not a thing a rename should ever be judged by alone. SO: BEFORE, a PER-FILE census, committed. TWO PATTERNS AND NOT ONE, because the Developer MEASURED that the name is spelled in five forms no literal specifier search can see -- split across function arguments, in tarball form sharing no substring with the specifier, and inside regexes with escaped slashes. THE NARROW PATTERN IS BOUNDARY-AWARE so the old name does not match inside the new one, and THE WIDE PATTERN IS THE SCOPE INSTRUMENT whose surplus over the narrow one is examined site by site. LICENSE's `Copyright (c) 2026 atusy` IS A NAMED NON-TARGET, recorded because a naive wide sweep corrupts it and nothing else would say so. COUNTED PER OCCURRENCE AND NEVER PER LINE, since README carries three on one line. ENUMERATED FROM `git ls-files` AND NEVER FROM A HAND LIST, for the reason the fifth DoD check is enumerated from the workspace configuration. AFTER, EACH FILE IN THAT CENSUS STILL EXISTS and carries the SAME COUNT of the new name that it carried of the old. PER FILE AND NEVER IN TOTAL, because a total is met by one file gaining two while another loses two. A CENSUS FILE THAT NO LONGER EXISTS FAILS THIS CRITERION rather than counting as zero. The old-name grep is then the cheap confirmation it was always meant to be, WITH EVERY REMAINING HIT ASSIGNED TO ONE OF THREE CLASSES AND NONE LEFT OVER. THE CLASSES, AND THE PROPERTY IS THE ASSIGNMENT RATHER THAN ANY COUNT. (1) USE: a live specifier, path segment, key or command that must RESOLVE. These change, and they are the sweep. (2) MENTION: text naming the old name AS ITS SUBJECT -- this PBI's own criteria say the old name must go, and a sweep that re-spelled them would leave `@atusy/tsudoi-language-server IS GONE AS A PACKAGE NAME`, which is false and self-defeating. UNCHANGED. (3) EVIDENCE: a recorded measurement true when taken, including PBI-51's probe readings and everything under `completed` and `retrospectives`. UNCHANGED AND VERBATIM, on the third criterion's reason. NO COUNT IS FROZEN HERE, per Sprint 43 and my own remedy for it: scrum.ts is a LIVING file whose hit count moves with every dashboard edit, so a number written into this criterion is stale before the sprint ends. THE COUNT IS MEASURED AT CENSUS TIME AND RECORDED IN sprint.decisions WITH ITS PROVENANCE. The four DoD checks pass, which is what exercises all three routes.",
        },
        {
          criterion:
            "THE README'S EXECUTED BYTES ARE THE SUBJECT AND NOT A DOCUMENT UPDATED ALONGSIDE. The quickstart's install command, both start command lines and the config's import line are extracted from this README and run, so the rename lands in them or the suite fails.",
          verification:
            "THE SUITE PASSES WITH THE EXTRACTION MACHINERY UNCHANGED *IN THE RENAME COMMIT*, and the added clause is a correction of MY OWN WORDING rather than a concession. `no change` full stop was unsatisfiable beside the first criterion, which requires test/helpers/readme.ts's one doc-comment occurrence to move like every other -- the Developer found the collision at Planning and it was mine. WHAT THE CRITERION ALWAYS MEANT is that an instrument edited in the same commit as its subject cannot testify about it. SO THE RESOLUTION IS STRUCTURAL AND ACCEPTED: the rename commit provably does not touch the instrument, the suite passes with the instrument as it stood BEFORE the rename, and the instrument's own comment is repaired in the NEXT commit -- reported, which is what this criterion asks for, rather than absorbed into the commit it would have compromised.",
        },
        {
          criterion:
            "THE RECORD IS NOT REWRITTEN. scrum.ts's `completed` sprints and `retrospectives` name `@atusy/tsudoi` throughout and were TRUE WHEN WRITTEN. They are left VERBATIM -- the same treatment Sprint 42's improvement outcome gave its own superseded action text.",
          verification:
            "THE INSTRUMENT IS THE EXTRACTED RECORD AND NOT THE git diff, which is a correction the Developer earned by measurement rather than by argument. `bun scrum.ts` prints the record as JSON; reformatting the FILE re-indents entries under `completed` and `retrospectives` while that JSON stays BYTE-IDENTICAL, so a diff-based reading fails on a pure whitespace commit. A CRITERION THAT CAN BE FAILED BY FORMATTING IS NOT MEASURING THE RECORD -- the record is the extracted value and the file is one serialisation of it. SO: `completed` and `retrospectives`, SLICED OUT OF THAT JSON AND COMPARED BYTE FOR BYTE across the sprint. SLICED, NOT WHOLE, and that is load-bearing: the whole document necessarily moves, since this sprint writes its own census and decisions into it. ONE note records that the old name is what those entries meant. A sweep that 'helpfully' updates them fails this criterion.",
        },
        {
          criterion:
            "NO CONTROL THE SWEEP TOUCHES IS LEFT DISARMED, AND THIS IS A SEPARATE PROPERTY FROM THE CENSUS BALANCING. A rename is the ARCHETYPAL DISARMING EDIT: it changes what a matcher matches without changing whether it passes, so a control can stay green while measuring nothing and the census will balance anyway. THE WORKED EXAMPLE IS ALREADY FOUND, by the Developer asking Sprint 45's question rather than by any sweep: test/readme.test.ts:368's `/bun add @atusy\\/tsudoi/` STILL MATCHES THE NEW NAME BY PREFIX, so after the rename it asserts the old name's absence not at all -- while its sibling at :450 reddens honestly. MY CENSUS CRITERION WOULD NOT HAVE CAUGHT IT.",
          verification:
            "SPRINT 45'S QUESTION ASKED OF EVERY CONTROL THE SWEEP TOUCHES -- `WHAT WOULD MAKE THIS RED, NOW?` -- ONE AT A TIME AND NEVER AS A BATCH, which is the standing retrospective item applied to the edit class that most reliably defeats it. A PREFIX-MATCHING PATTERN IS TIGHTENED TO THE FULL NEW NAME OR ITS GREEN IS RECORDED AS MEASURING NOTHING. The five forms the Developer measured -- split across function arguments, tarball form sharing no substring with the specifier, and regexes with escaped slashes -- are why this cannot be delegated to any single grep: THE NAME IS NOT ONE STRING IN THIS REPOSITORY, so the census is the completeness instrument and this is the non-vacuity one. Each control's answer recorded individually in sprint.decisions.",
        },
      ],
      notes: [
        "RULED BY THE STAKEHOLDER: the rename is intended and is not a directory-name slip. The routed question this PBI existed to ask is DISCHARGED, and what remains is work.",
        "ORDERED FIRST, AND THE ORDERING IS THE PO'S CALL RATHER THAN THE RULING'S. Doing it after the extractions is the same pass PLUS every extracted package's dependency line and every specifier inside them. AND THE SHARPER REASON, which is about evidence rather than effort: PBI-51 REWRITES test/helpers/install.ts, whose hardcoded consumer path spells the old name, and PBI-51's criterion 2 perturbs the `paths` key that this PBI re-spells. Two PBIs rewriting one helper and one mapping in either order is fine; interleaved they make each other's controls unreadable.",
        "VERSION STAYS 0.0.0 AND NOTHING IS PUBLISHED. The rename is free precisely because no consumer holds the old name -- which is what makes it cheap NOW rather than what makes it a detail.",
        "SMALL, AND SAYING SO IS PART OF THE PROPOSAL. If this cannot be done in a sprint well short of the usual size, that is itself a finding about how many places the name is written, and it should be reported rather than absorbed.",
        "NO `packages/`, NO WORKSPACES KEY, NO MEMBER OF ANY KIND IN THIS SPRINT -- THE DEVELOPER'S REFUSAL IS UPHELD AND THEIR REASON IS BETTER THAN A SCOPE ARGUMENT. They checked it against my own text: criterion 1 ends `the four DoD checks pass, which is what exercises all three routes`, AND ADDING A MEMBER MAKES THAT SENTENCE FALSE ON THE DAY IT IS WRITTEN, because a member is answered by root tsc THROUGH THE VERY `paths` KEY THIS PBI RE-SPELLS and reports success. Building the workspace here would ship the hazard PBI-51 exists to foreclose, inside the sprint that re-spells its mechanism, and would destroy PBI-51's criterion-2 contrast before it could be taken. THE WORKSPACE ARRIVES IN PBI-51, WITH THE FORECLOSURE AND THE FIFTH CHECK THAT OWN IT, and never before.",
        "WHAT THE GATE BEING RED AT HEAD COST, RECORDED BECAUSE IT IS EVIDENCE ABOUT THIS TEAM RATHER THAN ABOUT THIS PBI. Criterion 1 requires the four DoD checks to pass, and they did not at the commit the sprint would have opened on -- the dashboard had been written back through a JSON serialiser, leaving `oxfmt --check .` at exit 1. SO A CRITERION OF MINE WAS UNSATISFIABLE FOR A REASON HAVING NOTHING TO DO WITH ITS SUBJECT, and it was found by the Developer at Planning rather than by the PO or the Scrum Master. The remedy shipped with a control rather than an assurance: `bun scrum.ts` emits byte-identical JSON across the reformat, which is what proves the repair touched no record. THAT CONTROL IS NOW CRITERION 3'S INSTRUMENT, so the incident produced the measurement that fixed the criterion it broke.",
      ],
    },
    {
      id: "PBI-51",
      story: {
        role: "config author",
        capability:
          "get the wordnet hover handler by INSTALLING a package, instead of copying two files into my project and installing its dependency myself",
        benefit:
          "the handler is maintained where it lives rather than forked into my tree the moment I take it, so a fix to it reaches me by reinstalling instead of by diffing my copy against an example I have already edited",
      },
      status: "ready",
      acceptance_criteria: [
        {
          criterion:
            "A CONSUMER OBTAINS THE HOVER HANDLER WITHOUT RECEIVING ITS SOURCE. A throwaway project that has installed `@atusy/tsudoi-language-server` and `@atusy/tsudoi-hover-wordnet` -- both by the README's own route, a tarball packed out of this checkout -- writes a config whose only hover import is the PACKAGE SPECIFIER, and answers a real `textDocument/hover` over the wire. NO BYTE OF THE HANDLER'S SOURCE IS WRITTEN INTO THAT PROJECT, which is what distinguishes this from what test/helpers/install.ts does today.",
          verification:
            "THE LIFT IS NAMED RATHER THAN IMPLIED, because it is the largest implementation change in this PBI: test/helpers/install.ts today packs ONE tarball from repoRoot/package.json + src/ + tsconfig.build.json and HARDCODES the consumer path at node_modules/@atusy/tsudoi -- which PBI-53 re-spells before this PBI rewrites it. It must pack and install TWO, and the consumer's config must load with the handler resolved out of node_modules. THE PROBE THEN ASSERTS BOTH DIRECTIONS IN ONE MEASUREMENT, per Sprint 6: the hover answers with a definition, AND the consumer's own directory holds no hover-wordnet source. NEGATIVE CONTROL, and it is what stops a green meaning `some other route answered`: omit the handler package from the install and the same test must redden NAMING THE SPECIFIER -- an empty hover, or a hover that still answers, both mean the probe measured the wrong thing.",
        },
        {
          criterion:
            "THE HANDLER PACKAGE RESOLVES TSUDOI THROUGH PACKAGE RESOLUTION, AND NOT THROUGH THE PARENT'S ROUTE. This is the load-bearing criterion and the whole reason this is not a file move with a package.json on top: NOTHING IN THIS REPOSITORY RESOLVES TSUDOI FROM ANOTHER PACKAGE TODAY. Two routes exist and both are consumed by LOOSE FILES -- tsc through `paths` in tsconfig.json into src/, and the installed consumer through the exports map into dist/, where the examples arrive as files with RELATIVE imports between them. The extracted package must take a third route: its own `dependencies` entry, the main package's `exports` map, and NOTHING OF THE PARENT'S -- no `paths` mapping reaching tsudoi from any tsconfig at any level, and no `extends` of one that carries it.",
          verification:
            "TWO PERTURBATIONS IN OPPOSITE DIRECTIONS, because either alone is degenerate. (a) REMOVE the `@atusy/tsudoi-language-server/*` entry from the ROOT tsconfig.json: the ROOT check reddens on examples/ AND THE MEMBER'S OWN CHECK IS UNCHANGED. That contrast is the discrimination, and IT IS ALREADY MEASURED TO BE CONSTRUCTIBLE -- the coordinator planted a member at packages/probe/, and with the mapping in place its `@atusy/tsudoi/types` import produced NO ERROR, while deleting the mapping turned that exact line into TS2307. A member check that reddens under (a) means the member is resolving through the parent's mapping and this criterion is unbacked however green it was. (b) BREAK A NAME in src/types.ts that the handler imports: the package's own check MUST redden NAMING THE SUBPATH, with ZERO TS2307 anywhere -- Sprint 44's recorded shape, which is what shows the resolution reaches a real declaration rather than `any`, and which (a)'s own TS2307 is the contrast for.",
        },
        {
          criterion:
            "THREE OF THE FOUR DoD CHECKS REACH INSIDE THE EXTRACTED PACKAGE: `bun test`, `oxlint` and `oxfmt --check .`. All are ROOT-LEVEL commands and a workspace member can fall outside every one of them silently. THE FOURTH IS DELIBERATELY EXCLUDED FROM THIS CRITERION AND THE EXCLUSION IS NOT A GAP: the next criterion WITHDRAWS root `tsc --noEmit`'s coverage of members on purpose, because root tsc does not merely miss them -- it answers their imports through the parent's `paths` and reports success. Writing `all four` here would make this criterion and the next demand OPPOSITE OBSERVATIONS FROM ONE PERTURBATION, which is Sprint 40's rule failing at authoring time: a criterion is checked against what an implementation could actually satisfy. The plan must also SAY where the package's tests live -- test/hover-wordnet.test.ts travels or it does not -- and this criterion holds either way.",
          verification:
            "THREE PLANTED DEFECTS, ONE PER CHECK, EACH INSIDE THE PACKAGE: a failing test, a lint violation and a format violation, with each command run FROM THE REPO ROOT EXACTLY AS SPELLED IN definition_of_done. ALL THREE ARE MEASURED ON A PLANTED MEMBER at packages/probe/ AND ALL THREE REACH IT: `bun test` ran the member's failing test among 636; `oxfmt --check .` reached it; and `bunx oxlint` from the root with no arguments EXITED 1 naming packages/probe/src/index.ts twice. THE oxlint READING IS THE STRONGER ONE BECAUSE TWO RULES FIRED FOR DIFFERENT REASONS -- `import/extensions`, which is repo-wide, AND `no-restricted-imports` on `bun:sqlite`, which fires only because nothing exempts the member. ONE VIOLATION WOULD HAVE BEEN AMBIGUOUS between `oxlint reaches the member` and `oxlint reaches it under a relaxed configuration`; two, of which one is the default-deny ban, separate those. GREEN FROM THE ROOT IS NOT EVIDENCE A CHECK REACHED THE MEMBER; only the reddening is. A check that cannot be made to redden is reported as a gap rather than worked around.",
        },
        {
          criterion:
            "THE DoD GROWS A FIFTH CHECK, AND ROOT tsc STOPS ANSWERING FOR MEMBERS AT ALL. THIS CRITERION OWNS THE WITHDRAWAL THE PREVIOUS ONE POINTS AT, so the fourth check's coverage of members is transferred rather than dropped -- the shape Sprint 45's naming rule requires, since the DoD cannot see a guard that merely went away. THE MEASUREMENT IS WHY, and it is worse than `root tsc fails to cover the member`: root tsc ANSWERS THE MEMBER'S IMPORT THROUGH THE PARENT'S `paths` AND REPORTS SUCCESS, so a member whose own resolution is broken type-checks GREEN at the root. THE FORM, decided here rather than left to Planning, and it is FORECLOSURE PLUS A CHECK rather than either alone. (i) The root tsconfig EXCLUDES the members, so it cannot answer for them by any route -- the hazard becomes unconstructible rather than watched, which is the shape Sprint 42's `paths` outcome took. (ii) A FIFTH DoD CHECK type-checks EACH MEMBER UNDER ITS OWN tsconfig. NEITHER HALF WORKS ALONE: without (i) the fifth check is shadowed by a root green, and without (ii) excluding the members means NOTHING checks them.",
          verification:
            "THE FIFTH CHECK ENUMERATES MEMBERS FROM THE WORKSPACE CONFIGURATION, NEVER FROM A HAND-WRITTEN LIST, and that is the load-bearing half rather than a nicety: with the members excluded from root tsc, a member the list forgot is checked by NOTHING AT ALL and every command exits 0. VERIFIED BY CONSTRUCTION -- add a member carrying a type error and named in no list anywhere, and the fifth check must catch it or fail loudly at an unenumerated member. AND THE PAIR THAT PROVES (i): with the exclusion in place, a type error in a member must NOT be reported by root `tsc --noEmit`, while the fifth check reports it -- one measurement showing the responsibility moved rather than two greens showing nothing.",
        },
        {
          criterion:
            "THE EXTRACTED PACKAGE GETS NO EXEMPTION FROM THE DENO GUARD, AND THE ABSENCE IS PINNED RATHER THAN DEFAULTED. THE DECISION, AND ITS REASON IS SUBSTANTIVE RATHER THAN INERTIAL: `.oxlintrc.json` bans `bun` and `bun:*` because these files RUN UNDER DENO, and its own recorded argument is that scoping the ban to src/ `would leave the highest-risk files unguarded` since examples/ holds a config deno runs. AN EXTRACTED HANDLER RUNS UNDER BOTH RUNTIMES FOR THE SAME REASON AND WITH MORE FORCE -- an example is copied by one reader who can fix it, a package is SHIPPED TO STRANGERS WHO CANNOT. So `packages/` is deliberately not a sixth exempt shape, and the reason is written at `.oxlintrc.json` where the widening edit would be made.",
          verification:
            "THE READING THAT MOTIVATES THIS IS CORRECTED AT ITS MECHANISM, because the mechanism decides what must be built. IT IS NOT THAT `packages/` IS MISSING FROM AN EXEMPTION LIST: the overrides array holds TWO entries -- test files plus test/helpers/ switched off, and src/notifications.ts redeclared narrower -- so src/, examples/ and test/fixtures/ are NOT exempt either. THE FIVE SHAPES ARE guard.test.ts's PINNED MATRIX, NOT EXEMPTIONS. THE REAL GAP FOLLOWS AND IS SHARPER: the ban reaches a member BY DEFAULT AND NOT BY ASSERTION, so an override later widened to reach `packages/` REDDENS NOTHING -- guard.test.ts pins the shapes it carries and `packages/` is not one. SO THE MEMBER'S PATH JOINS THAT ONE LIST as its own shape, and the control is the project's own: widen an override to cover it and the new shape must redden, exactly as the comment promises for the shapes already there. THE SHAPE COVERS MEMBERS AS A CLASS RATHER THAN THIS ONE PACKAGE, on the same reasoning as the fifth check enumerating from the workspace configuration: a shape naming one package leaves the second one unpinned and nothing says so. PBI-52 then adds no shape, which is a prediction this criterion makes about a later sprint and can be read against it.",
        },
        {
          criterion:
            "`wordnet` LEAVES THE MAIN PACKAGE ENTIRELY. It is a devDependency today used by one example; extracted, it is a runtime dependency of the handler package and nothing the main package knows about.",
          verification:
            "It appears in NEITHER `dependencies` NOR `devDependencies` of the root package.json, and the suite passes. AND THE BORROWED SYMLINK IS RE-HOMED RATHER THAN LEFT: test/helpers/install.ts symlinks `wordnet` into the consumer with the recorded reason `the README tells a reader to install it, and this stands in for that install`. THAT PREMISE BECOMES FALSE -- the reader installs the handler package, which declares wordnet itself -- so the symlink either moves to standing in for the handler package's own dependency, with the new reason written where it stands, or it goes.",
        },
        {
          criterion:
            "EVERY PROSE SITE THIS FALSIFIES IS REPAIRED RATHER THAN SURFACED, per Sprint 44, AND THEY ARE ENUMERATED BEFORE THEY ARE FOUND. The examples stop being one kind of thing: two are copied and one is installed, and README currently says the set is copied WHOLE. NAMED: README's `Copy the whole set, or the imports fail`; its example table rows for hover-wordnet.ts and wordnet.d.ts; its `<!-- examples-install -->` block, WHICH THE SUITE EXECUTES AS `bun install wordnet` and which becomes wrong; `exampleSources()`'s `THE WHOLE SET, NEVER THE CONFIG ALONE` doc and its two wordnet entries in test/helpers/install.ts; and the borrowed-wordnet comment at the symlink.",
          verification:
            "Each named site repaired and the README's executed blocks still passing. THE LIST'S SUFFICIENCY IS NOT THE EXECUTOR'S TO JUDGE AND IT IS EXPLICITLY HANDED TO `revise`: its independent reviewer sweeps for prose this increment falsified WITHOUT SIGHT OF THIS LIST, and the two are compared afterwards. A SELF-REPORTED `I found nothing else` IS THE ONE READING THIS CRITERION WILL NOT ACCEPT -- Sprint 45's own record has a sprint writing a false claim about its own suite while editing that suite, which is exactly the shape a first self-review survives. THE ENUMERATION STAYS HERE BECAUSE IT IS A PREDICTION, committed before the work per Sprint 39, and a prediction handed to review is not one.",
        },
        {
          criterion:
            'THE PUBLISHED MAIN PACKAGE DEPENDS ON NO HANDLER PACKAGE. Scoped to `dependencies` DELIBERATELY: a workspace member in devDependencies is normal, never reaches a consumer, and `files: ["dist"]` keeps examples/ out of the tarball anyway -- a criterion written over devDependencies too would force the demo config out of the main package as a side effect nobody asked for.',
          verification:
            "Read from the PACKED TARBALL's package.json, not from the repository's, since those are different files the moment a pack stage edits one.",
        },
      ],
      notes: [
        "WHY HOVER FIRST -- THE ORIGINAL REASON IS DISCHARGED AND THE ORDER SURVIVES IT, which is Sprint 41's test applied to a premise rather than to a mechanism. THE REASON THAT DIED: hover was the only extraction sizeable without a stakeholder answer, since completion-path could not be scoped until the resolve question was ruled. IT IS RULED, so that reason is gone and is left here rather than quietly replaced. THE REASON THAT SURVIVES, AND IT WAS THE STRONGER ONE ALL ALONG: PBI-51 BUILDS THE MACHINERY -- the workspace, the two-tarball consumer, the root exclusion, the fifth DoD check -- and that machinery is where the risk is. Building it against a THREE-name surface with no intra-example coupling is a different task from building it while also deciding THIRTEEN API promises. A constraint that survives the withdrawal of the premise it was derived from was a constraint on the property all along.",
        "AND THE SECOND REASON, WHICH IS ABOUT COST RATHER THAN ORDER. AN EXAMPLE'S EXPORTS ARE INCIDENTAL AND A PACKAGE'S ARE A PROMISE. hover-wordnet.ts exports THREE names -- wordAt, define, hoverWordnet. completion-path.ts exports THIRTEEN -- pathFragments, sourcesFor, editFor, listingDirectory, itemsFrom, pathCompletion, batchSize, completedPath, PathFragment, PathItemData, PathSource, PathSourceName, PathCompletionOptions -- and every one of them either becomes published API or must be made internal. THAT IS THE LARGEST SINGLE COST IN THIS WHOLE REQUEST, and it is PBI-52's criterion 3 rather than this PBI's. BOTH COUNTS ARE MEASURED off `^export` in the two files and carry provenance per Sprint 36; do not edit either without re-counting.",
        "NO REGISTRY IS CLAIMED ANYWHERE, and this is the one thing the criteria must not drift on. The main package is unpublished and so is every package this creates. WHAT MAKES THE VALUE REAL ANYWAY: the README's documented working route is ALREADY a local tarball -- pack out of a checkout, `bun install ../tsudoi-language-server/tsudoi.tgz` -- and a second package travels that same route with nothing new invented. So `install rather than copy` is deliverable today. `npm install` is not, no criterion here says it, and the README must not grow a sentence promising one.",
        "THE UNMEASURED PREMISE IS NOW MEASURED, AND THE HYPOTHESIS WAS CONFIRMED SHARPER THAN IT WAS STATED. I predicted root tsc would pull a member's files into the root program under the root's `paths` and go green. MEASURED on a planted member at packages/probe/: `import type { Tsudoi } from \"@atusy/tsudoi/types\"` produced NO ERROR with the mapping in place, and deleting the mapping produced TS2307 on that exact line. SO ROOT tsc DOES NOT MERELY FAIL TO COVER THE MEMBER -- IT ANSWERS THE MEMBER'S QUESTION THROUGH THE PARENT'S ROUTE AND REPORTS SUCCESS. ALL FOUR ROOT CHECKS ARE NOW MEASURED AGAINST A PLANTED MEMBER and all four reach it; NOTHING IN THIS BACKLOG IS LEFT UNMEASURED. THE ONE THAT REACHES IT AND MUST STOP IS tsc, which is why its coverage is transferred to the fifth check rather than relied on.",
        "A COST THAT BELONGS AT PLANNING RATHER THAN AT EXECUTION, AND IT IS NOT DECIDED HERE. examples/wordnet.d.ts is an ambient `declare module \"wordnet\"`, which exists because the package ships no types and has no DefinitelyTyped entry. SHIPPED INSIDE A PUBLISHED PACKAGE AN AMBIENT DECLARATION LANDS IN EVERY CONSUMER'S GLOBAL TYPE SPACE -- a package declaring someone else's module for everyone who installs it. The alternatives are to ship it and own that, or to expose only the handler's own typed surface so no consumer ever names `wordnet` and the declaration stays internal to the package's build. Named so it is a decision at Planning rather than a discovery mid-sprint.",
        "SEQUENCED AFTER PBI-53, AND THE REASON CHANGED WITH THE RULING. While the rename was an open question this PBI was deliberately written to run under either name. Now that it is ruled, running it first is cheaper AND cleaner: this PBI rewrites test/helpers/install.ts and criterion 2 perturbs the very `paths` key PBI-53 re-spells, so interleaving them makes each other's controls unreadable.",
        "THE DEMO CONFIG IS THE HINGE AND IT KEEPS ITS JOB. examples/tsudoi.config.ts is driven end to end by the suite, so the extracted package is consumed BY IT, through the package specifier, and that is what keeps those tests meaning what they meant. A config that imported the member by relative path would leave every criterion above green and measure nothing.",
        "WHAT `revise` OWNS AND WHAT THE CRITERIA OWN, decided rather than left to collide. The stakeholder has ruled that every sprint runs `revise` -- multi-perspective plus independent review, converged, with no PR -- after the developer's work. THE DIVISION: A CRITERION ASSERTS A PROPERTY OF THE PRODUCT THAT A PERTURBATION CAN FALSIFY; `revise` FINDS WHAT NOBODY THOUGHT TO ASSERT. One criterion here was on the wrong side of that line and has been moved: criterion 5 used to ask the executor to report prose sites its own list missed, which is a reviewer's job asked of the author, and the completeness judgement now belongs to revise's independent reviewer working WITHOUT SIGHT OF THE LIST. NO CRITERION MAY BE MET BY ARGUMENT AT REVIEW -- if its only failure mode is `a reviewer would have said so`, it is not a criterion and revise will find it better.",
        "AND THE STANDING INSTRUCTION NEEDS A HOME OUTSIDE THIS PBI, WHICH THE PO CANNOT GIVE IT FROM HERE. `every sprint runs revise` is a stakeholder ruling about the PROCESS, and a ruling that lives in one PBI's notes dies when that PBI closes. definition_of_done cannot honestly carry it either: its checks are `{ name, run }` where `run` is a SHELL COMMAND, and writing a skill name there would put a string in that field which nobody can execute. FLAGGED RATHER THAN FORCED INTO A SHAPE IT DOES NOT FIT -- the DoD should grow it once the invocation has a form that field can carry truthfully.",
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
            "As in PBI-51, against this package. The end-to-end probe answers BOTH `textDocument/completion` AND `completionItem/resolve` in one installed consumer, since either alone is half the artifact.",
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
      ],
      notes: [
        "RULED BY THE STAKEHOLDER, ON THE PO'S RECOMMENDATION AND ITS STATED REASON: resolve-path-stat TRAVELS. The cost of the alternative decided it -- leaving resolve behind as an example forces an internal marker onto the package's PUBLISHED surface. The accepted cost is cosmetic: THE PACKAGE NAME DOES NOT SAY IT ANSWERS TWO METHODS, and a reader of the module list will not learn that from the name. WRITE IT WHERE THEY MEET IT -- in the package's own README and at its exports -- since the name cannot carry it.",
        "THE COUPLING, MEASURED RATHER THAN RECALLED, because it is the ruling's evidence and outlives the ruling. examples/resolve-path-stat.ts imports `completedPath` from examples/completion-path.ts -- A VALUE IMPORT, not a type -- since tsudoi keeps no record of what a completion handler produced and a resolve handler can only key off the mark the completion module wrote onto the item. AND loadConfig REFUSES a config supplying `completionItem/resolve` without `textDocument/completion`, which test/fixtures/resolve-without-completion.ts pins.",
        "A THIRD OPTION WAS AVAILABLE AND WAS NOT TAKEN, recorded so nobody re-opens it as though it were unconsidered: resolve-path-stat as its OWN package depending on the completion one. It publishes the same marker across the same boundary as leaving it an example AND adds a third package to maintain, so it cost strictly more than either.",
        "SEQUENCED THIRD, AND `ready` DESCRIBES THE PBI RATHER THAN THE ORDER. PBI-53 re-spells the name every criterion here uses and PBI-51 builds the two-tarball consumer, the workspace, the root exclusion and the fifth DoD check that this PBI's criteria 1 and 3 reuse wholesale. Pulled first, this PBI would have to build all of it against the larger of the two export surfaces.",
      ],
    },
  ],
  completed: [
    {
      number: 45,
      pbi_id: "PBI-49",
      status: "done",
      goal: 'TSUDOI STOPS INVENTING A NAME IT CANNOT KNOW. The protocol defines `WorkspaceFolder.name` as A UI LABEL -- `used to refer to this workspace folder in the user interface` -- so it belongs to the client, and tsudoi invents one every time it builds a folder from `rootUri` or `rootPath`. NOTHING IS SYNTHESISED ANY MORE: `workspaceFolders` carries what the client sent and nothing else, and `rootUri` and `rootPath` are exposed AS THE CLIENT SAID THEM. THE MIRROR STOPS BEING PARTLY OURS. WHAT THE SYNTHESIS PREVENTED IS SOLVED MORE HONESTLY THAN IT WAS: an author reading only the newest field used to get an empty list and conclude the editor opened nothing, and an empty `workspaceFolders` BESIDE A POPULATED `rootUri` is a VISIBLE absence where the old failure was an invisible one. WHAT THIS SPRINT MUST NOT DO IS LEAVE THE CREATED HAZARD UNOWNED: the author now meets the protocol\'s precedence over TWO DEPRECATED FIELDS, and a guard nobody was watching dies with the rung -- `rootPath` is refused unless absolute because `pathToFileURL` RESOLVES A RELATIVE PATH AGAINST cwd, so `""` or `"."` would manufacture a root out of the launch directory. THE REMOVAL PREDICATE IS PINNED UNCHANGED: it matches BY URI ALONE, deliberately, and the argument that motivated this PBI was CIRCULAR -- it cited a hazard that only exists once identity moves to (uri, name), which is not in this sprint.',
      subtasks: [],
      impediments: [],
      decisions: [
        "BASELINE 1c27c77, resolved once at Planning. Planning ran as inline role-play; the Product Owner refined this PBI and will take the acceptance.",
        "THE SCRUM MASTER'S ARGUMENT FOR THIS PBI WAS CIRCULAR AND THE PO CAUGHT IT. I claimed a synthesised folder becomes UNREMOVABLE once a client sends its own name in `removed`. VERIFIED: the predicate is `held.uri === folder.uri` -- URI ALONE -- so that hazard CANNOT OCCUR TODAY. It occurs only once identity moves to (uri, name), which is the change the hazard was being used to motivate. WHAT THE NVIM MEASUREMENT ACTUALLY SHOWS is that such a change would be HARMLESS AGAINST NVIM, since nvim builds uri and name from ONE input and therefore cannot exhibit the counter-case the code's own comment describes. A CLIENT ACCIDENT IS NOT A PROTOCOL GUARANTEE. Identity-on-both is sequenced rather than refused, and its first obligation is to REFUTE src/workspace.ts's recorded reason rather than overwrite it.",
        "DEDUPE-ON-ADD IS DEFERRED ON A STRONGER GROUND THAN THE ONE THE SCRUM MASTER GAVE. I said it was a separate property and should not ride along merely because it touches one file. THE PO SAYS ITS MOTIVATION IS REFUTED: the comment justifies the absent guard with `a client that adds a URI it already holds holds it twice`, and nvim's `_add_workspace_folder` RETURNS WITHOUT NOTIFYING when `folder.name == dir` already. A GUARD AGAINST A CLIENT NOBODY HAS OBSERVED IS `an author might want it` IN DIFFERENT CLOTHING, which this project has refused by name. It becomes ready when someone names a client that sends the duplicate, or shows what holding it costs an author.",
        "THE REDUCTION HELPER SHIPS, AND NOT ON THE ARGUMENT THE SCRUM MASTER OFFERED. `the stakeholder approved it` is not a reason the PO can hold, and `an author might want it` is one they have refused. IT SHIPS BECAUSE IT OWNS THE HAZARD THIS PBI CREATES -- withdrawing a behaviour every config silently relied on, and handing the author a precedence rule over two DEPRECATED fields, is a strictly worse deal unless something owns the gap. The same shape as PBI-46 owing the record when it withdrew `isIncomplete`.",
        "THREE FRAMEWORKS COMPARED, AND TSUDOI IS THE OUTLIER FOR A REASON IT BOUGHT ON PURPOSE. vscode-languageserver-node's WorkspaceFoldersFeature holds NO list -- it fires an Emitter and answers `getWorkspaceFolders()` BY SENDING A REQUEST TO THE CLIENT. tower-lsp-server's default `did_change_workspace_folders` is `let _ = params;` plus a warning. NEITHER FOLDS `added`/`removed` INTO ANYTHING, so neither has a duplicate question, a normalisation question, a removal-predicate question or a synthesis question. tsudoi holds a list to make `RequestContext.workspaceFolders` SYNCHRONOUS. NOT PROPOSED HERE, recorded so the option is visible: dropping the list would retire all four questions at the cost of that synchrony.",
        "THE PREDICTED expect( DIFF, COMMITTED BEFORE ANY FILE IS TOUCHED, AND THE BASELINE RE-MEASURED RATHER THAN INHERITED per Sprint 27. THE HANDED BASELINE SAYS 1c27c77 AND HEAD IS 8cc10ab, the sprint-opening commit one ahead of it; measured there: tree clean, `bun test` 458 pass / 0 fail with 1298 runtime expect() calls, `tsc --noEmit`, `oxlint` and `oxfmt --check .` all EXIT 0, and `grep 'expect(' test/ src/` is 712 SOURCE LINES of which test/workspace.test.ts holds 32. PREDICTION, PER FILE. test/workspace.test.ts 32 -> 33: FIVE REMOVED (the rootUri-only-reaches-a-folder test, the removal-finds-the-synthesised-folder test, the added-joins-the-root test, the synthesised-folder-is-removed test, the added-naming-the-synthesised-URI test), SIX CHANGED IN PLACE (the empty/null fall-through becomes empty/null BESIDE a mirrored rootUri; folders-win becomes criterion 1's presence arm; rootUri-over-rootPath and rootPath-only and the percent-encoded convention each move one layer down onto the reduction; the non-absolute rootPath test becomes the cwd guard read through the reduction), SIX ADDED across FIVE tests (the rootUri-only mirror pair, the relative-rootPath mirror, a remote rootUri yielding NO folder, the client's own folders passing through the reduction untouched, and the example completing from a rootUri-only root, which carries two). EVERY OTHER FILE 0/0/0. Runtime 1298 -> 1304: -5 per runtime removed, +7 added since the relative-rootPath mirror loops two spellings from one line, +1 for the cwd guard now looping two, doubled across runtimes. TESTS 458 -> 458, five dying and five born on each runtime.",
        "THE COUNTERFACTUALS, per Sprint 40, and the first is criterion 4's. A NON-ZERO expect( DIFF IN THE FOLDER-CHANGE TESTS OF EITHER FILE means identity-on-(uri, name) crept in: predicted ZERO in test/workspace.test.ts's six change tests plus the in-flight one, AND ZERO in test/notifications.test.ts's outside-the-window test, whose three assertions read the handle directly and would move if `current()`'s type did -- which is why `current()` keeps its signature and a second reader is added beside it. A CHANGED expect( in test/completion-path.test.ts would mean the example's behaviour moved for a session that sent folders, which this PBI does not do; that file changes in ONE non-assertion place, the repository's ONLY RequestContext literal, grepped rather than recalled. AND A ZERO DIFF IN test/workspace.test.ts WOULD MEAN THE SYNTHESIS WAS NEVER DEFENDED.",
        "SUBTASKS 1, 2 AND 3 ARE ONE EDIT AND ONE COMMIT, DECLARED IN ADVANCE per the merged Sprint-13/17 rule, because a plan that hides which subtasks are one edit produces a born-green RED: removing the synthesis, mirroring the three fields and publishing the owner cannot land separately without a window in which the example loses its roots. SUBTASK 4 LANDS FIRST AND ALONE, structural, and carries the false-sentence correction. THE RE-HOMED PROPERTIES MOVE IN THE SAME COMMIT AS THE REMOVAL, so no window exists in which they are out of custody.",
        "SEVEN PROSE SITES THIS INCREMENT FALSIFIES, ENUMERATED BEFORE THEY ARE FOUND rather than after, and fixed per Sprint 44 rather than surfaced: src/workspace.ts's dedupe sentence (nvim refutes it) and its rootUri-throws-inside-the-initialize-handler reason, WHICH CHANGES MECHANISM AND NOT MERELY ADDRESS -- initialize no longer calls fileURLToPath at all, so the throw would land in the AUTHOR'S OWN HANDLER and fail one request per keystroke, and writing the inherited reason at the new site would be a justification that is backed and still wrong; src/server.ts's initialize block, which says the list is SYNTHESISED ONCE HERE; examples/tsudoi.config.ts's `THE WORKSPACE SOURCE IS LIVE ONLY IF YOUR EDITOR SENDS FOLDERS`; examples/completion-path.ts's `NEVER guessed from cwd` at sourcesFor and its `WHEN THE CLIENT SENT NO FOLDERS THIS SAYS NOTHING`; test/package-shape.test.ts's `the subpath carries no runtime value at all`; and test/installed-runtime.test.ts's `the subpath is type-only`.",
        "THE OBSERVED DIFF AGAINST THE PREDICTION, WHICH HELD ON EVERY TOTAL AND MOVED ONE ENTRY BETWEEN COLUMNS. PREDICTED test/workspace.test.ts 32 -> 33 and MEASURED 33; predicted 1298 runtime expect() calls -> 1304 and MEASURED 1304; predicted 458 tests -> 458 and MEASURED 458; predicted 712 -> 713 source lines and MEASURED 713. EVERY OTHER FILE 0/0/0, INCLUDING test/completion-path.test.ts, whose ONLY change is the repository's one RequestContext literal gaining the two fields. WHERE IT MOVED, reported rather than smoothed: the prediction said FIVE removed / SIX changed / SIX added, and the tree carries FOUR removed / SEVEN changed / FIVE added. The one that moved is the rootUri-only test -- planned as a deletion plus a new test, written as an in-place rewrite of the same test -- and no other line differs from the plan. TWELVE assertion lines added and ELEVEN removed, counted from the git diff.",
        "THE NINE ARE TWELVE, THE CRITERION IS NOT AMENDED, AND ALL TWELVE ARE CLASSIFIED ONE BY ONE. THE DISCRIMINATOR the count reads on: NINE tests EXPECT A FOLDER TSUDOI SYNTHESISED, and THREE more in the same block read the deprecated fields WITHOUT expecting one. The property -- every test pinning the synthesis is accounted for -- is untouched, and the count was the mechanism, which is the Sprint-43 and Sprint-44 ruling applied to a count that was the PO's. THE NINE. (1) rootUri-reaches-a-folder: TARGET DELIBERATELY REMOVED, and its test is REWRITTEN IN PLACE into criterion 1's pair -- the same session now asserts an empty list beside the exact bytes. (2) empty/null falls through to rootUri: REMOVED and RE-HOMED in place; the three spellings still meet one state, and the fall-through itself survives in the reduction. (3) rootUri wins over rootPath: SURVIVES IN ANOTHER FORM, one layer down, as `the reduction prefers a rootUri to a conflicting rootPath`. (4) rootPath-only names its folder verbatim: SURVIVES, as the reduction's rootPath rung. (5) percent-encoded rootUri: SURVIVES TWICE -- the mirror half in criterion 1's pair, the uri/name convention in the reduction's own test. (6) a removal spelling the rootUri finds the synthesised folder: REMOVED, no re-home, because there is no synthesised folder for a `removed` to find; exact-string matching is still defended by the plain/plain-slash test, untouched. (7) an added folder joins the synthesised root: REMOVED; the read-time-fallback hazard it existed against is unrepresentable now, and `an added folder joins the initial list` is defended by the PBI-17 test, untouched. (8) the synthesised folder is removed and does not come back: REMOVED, same reason, and it is the sharper one -- the reappearance it named needs a read-time synthesis to reappear from. (9) an added folder naming the synthesised URI is held beside it: REMOVED; no-dedupe survives in `a URI added twice is held twice`, untouched. THE THREE ADJACENT. (10) folders win over a conflicting rootUri: it would have gone GREEN AND SILENT -- with no precedence left, it asserted only that folders equal folders -- so it is REWRITTEN into criterion 1's presence arm, which is a disarmed control caught rather than a test kept. (11) the handshake survives a rootUri naming no local path: KEPT UNCHANGED, and its hazard RE-HOMED beside it: initialize interprets nothing now, so the throw it feared can only land in the author's own handler, which the new reduction test owns. It is not deleted, because retiring a defence of an accepted criterion is a scope decision. (12) a relative rootPath is not a root: SPLIT IN TWO -- the mirror arm and the cwd guard arm -- because after the change the original would have passed VACUOUSLY, reading an empty list that is empty for a reason that has nothing to do with the guard. THREE OF THE TWELVE WOULD HAVE STAYED GREEN WHILE MEASURING NOTHING (6, 10, 12), which is the half a batch classification hides.",
        "THE TWO HAZARDS THIS SHAPE CREATES, TRACED TO THE CRITERIA THAT OWN THEM, and the Sprint-44 question asked of the NEW shape as well. (a) AN AUTHOR READING `workspaceFolders` ALONE GETS `[]` WHERE A ROOT EXISTS -> criterion 3, owned by `foldersWithRootFallback` and DRIVEN by examples/completion-path.ts, whose rootUri-only session is a permanent test. (b) THE cwd GUARD -> criterion 2, owned by the reduction and by a test whose only assertion it is. AND THE NEW SHAPE'S OWN ANALOGOUS HAZARD, which is the question Sprint 44 obliges: THE REDUCTION IS NOW THE EXAMPLE'S ONLY ROUTE TO ITS FOLDERS, so a defect in it reaches sessions that sent folders and never touched a deprecated field. MEASURED at C3 rather than reasoned -- making the reduction return `[]` reddens TWELVE tests including `every workspace folder is answered from`, which sends real folders and no root at all. That is the coupling the owner buys, and what owns IT is that same test, which predates this sprint.",
        'THE CONTROLS, EACH BY WHAT IT DISCRIMINATES, EXPECTED AND OBSERVED. C1, CRITERION 1: re-introduce the rootUri rung in the handle. EXPECTED the rootUri-only arm to redden NAMING THE FOLDER COUNT rather than the rootUri; OBSERVED exactly that -- `workspaceFolders` from `[]` to one folder with the rootUri line unchanged as context, 4 of 50 failing, both runtimes, and the `with no workspace sent` tests untouched. It discriminates `nothing is synthesised` from `two fields were added beside a list that still synthesises`. C2, CRITERION 2 AND THE LOAD-BEARING ONE: strip the absolute check. EXPECTED the guard test to redden NAMING A FOLDER WHOSE URI CONTAINS THE LAUNCH DIRECTORY; OBSERVED a received value of one folder at `file:///private/var/folders/.../T/tsudoi-paths-mYNSkT`, the temp root the session was started in, 2 of 50 failing -- AND THE MIRROR TEST STAYED GREEN, which is the discrimination itself: a criterion asserting only the mirrored `"."` is met by a shape that hands every author a cwd root. C3, CRITERION 3: make the reduction return `[]`. EXPECTED the example completion to redden NAMING THE MISSING CANDIDATE; OBSERVED its FIRST assertion failing with `notes/root-only.txt` expected and `[]` received. C4, THE PUBLISHED ADDITION: rename the exported name. EXPECTED the in-repo importer to fail through the subpath with no TS2307; OBSERVED tsc EXIT 1 with TS2724 at examples/completion-path.ts(10,10) and ZERO TS2307 anywhere -- and, through the tarball, `the example type-checks against what ships` reddening with the same message, which is the two-direction ADDITION measured on the artifact a stranger receives.',
        "MY OWN INSTRUMENT WAS DEGENERATE AND IT IS THE SEVENTH OF THIS THREAD, SELF-REPORTED BEFORE IT WAS READ. Criterion 1 asks for a TWO-DIRECTION set difference over dist/types.d.ts; I took it as a grep for exported NAMES, and it returned EMPTY IN BOTH DIRECTIONS on a rebuild that had just added `rootUri`, `rootPath` and `foldersWithRootFallback`. TWO INDEPENDENT BLINDNESSES IN ONE PROBE: the two fields are MEMBERS of RequestContext and no name-set can see them, and the new export arrives as a re-export line the pattern did not match. WHAT REPLACED IT: a full two-direction text diff of the file across the rebuild -- which shows the two members and the re-export added and NOTHING exported removed -- plus C4, which perturbs the name and watches the tarball consumer redden. `EXIT 0 WITH NOTHING IN EITHER DIRECTION` IS THE SHAPE THAT HIDES THIS, and the prediction is what made it visible: I had written down that an addition was expected.",
        "THE STANDING SPRINT-14 RE-RUN, TARGET SURVIVAL STATED BEFORE COLOUR. CHOSEN: Sprint 44's arm (b) -- break a name in src/types.ts that the examples import THROUGH the published subpath and read the type check. TARGET SURVIVES: this sprint does not touch tsconfig.json, the `paths` mapping is intact, and examples/completion-path.ts still imports through `@atusy/tsudoi/types` -- for a VALUE now, which is strictly more than the recorded run had. COLOUR: EXIT 1, the error at examples/completion-path.ts naming the subpath, ZERO TS2307 anywhere, which is Sprint 44's recorded shape. ONE DIFFERENCE, stated rather than smoothed: TS2724 rather than TS2305, because renaming leaves a near-miss for the compiler to suggest where deleting does not. INDEPENDENT in Sprint 14's sense only in part -- I authored this increment, and the arm is a reproduction of the Scrum Master's recorded perturbation rather than a probe of my own.",
        "ONE CLAUSE OF THE ENTRY ABOVE IS STALE AND ITS CONCLUSION IS NOT, appended rather than rewritten. It says the example imports through `@atusy/tsudoi/types` FOR A VALUE NOW, `strictly more than the recorded run had`; the stakeholder's ruling withdrew that value, so the example imports `type RequestContext` alone and the clause is false. THE TARGET STILL SURVIVES -- breaking a name in src/types.ts that the examples import through the subpath still reddens the type check through the type import -- so the re-run's colour stands. NO GREP WOULD HAVE FOUND THIS: the sentence does not name the withdrawn function, which is Sprint 29's `grep the claim's words` failing in the direction where the claim's words are `a VALUE`.",
        "PROSE: SEVEN SITES PREDICTED, SEVEN REPAIRED, NONE SURFACED, and the standing Sprint-14 prose item is discharged with the list rather than with an assurance. src/workspace.ts x2 (the dedupe sentence, in its own structural commit; and the no-local-path reason, WHOSE MECHANISM CHANGED -- the throw now lands in the author's handler, once per keystroke, not on the handshake); src/server.ts's initialize block; examples/tsudoi.config.ts's `LIVE ONLY IF YOUR EDITOR SENDS FOLDERS`, now naming all three fields and the reduction; examples/completion-path.ts x2 (`NEVER guessed from cwd`, which now depends on its caller, and `WHEN THE CLIENT SENT NO FOLDERS THIS SAYS NOTHING`, which is narrower than it was); test/package-shape.test.ts's runtime-value premise; test/installed-runtime.test.ts's type-only premise. NOTHING NOT CONSTRUCTED, per Sprint 11: every control this sprint named was built and fired.",
        "THE STAKEHOLDER OVERTURNS SUBTASK 3'S OWNER AFTER IT LANDED, AND THE PREDICTION IS COMMITTED BEFORE ANY FILE IS TOUCHED. THE RULING, in their words: `types.tsがfoldersWithRootFallbackをexportするのはおかしい。exampleではworkspaceFoldersだけ見ればいいから、この関数をそもそも消しちゃおう`. src/types.ts is tsudoi's TYPES and the reduction was its ONLY runtime export; the example needs `workspaceFolders` alone; so the function GOES and the subpath is TYPE-ONLY AGAIN. THE BASELINE IS RE-MEASURED RATHER THAN INHERITED per Sprint 27, and the tree I was handed is 991ea3a PLUS UNCOMMITTED EDITS, so the baseline is taken at the COMMIT: clean at 991ea3a, `bun test` is 458 pass / 0 fail with 1304 runtime expect() calls and `grep 'expect(' test/ src/` is 713 SOURCE LINES, of which test/workspace.test.ts holds 33 and test/published-artifacts.test.ts 44. PREDICTION AGAINST THAT BASELINE, PER FILE. test/workspace.test.ts 33 -> 27: SIX REMOVED, one per test reading the fixture's `fallback` key, and TWO CHANGED IN PLACE where the example's rootUri-only completion is INVERTED into its own absence. test/published-artifacts.test.ts 44 -> 44, AND THE ZERO IS NOT A NON-EVENT: the handed tree carries an UNCOMMITTED consumer test with TWO assertions that this ruling kills, so the file loses a test against the tree I was given while netting zero against the commit. EVERY OTHER FILE 0/0/0. Runtime 1304 -> 1290: FOURTEEN lost, since five of the six removed run once per runtime and the cwd one loops two spellings. TESTS 458 -> 446. NOTHING IS ADDED ANYWHERE.",
        "THE COUNTERFACTUALS, per Sprint 40. A NON-ZERO `expect(` DIFF IN THE FOLDER-CHANGE TESTS of test/workspace.test.ts or in test/notifications.test.ts means identity-on-(uri, name) crept in on a second pass over the same file, which is criterion 4's drift arriving a sprint late. A CHANGED OR REMOVED `expect(` IN test/package-shape.test.ts OR test/installed-runtime.test.ts means the EXPORTS MAP moved: this ruling changes what the `./types` arm CARRIES and not which arms exist, so both files change in PROSE ONLY. A NON-ZERO DIFF IN test/completion-path.test.ts means the example's own behaviour moved, where all that changes is which argument its caller passes. AN ADDED `expect(` ANYWHERE means I built a new defence while retiring one, and no exception is reserved in advance. AND A ZERO DIFF IN test/workspace.test.ts WOULD MEAN THE REDUCTION WAS NEVER DEFENDED.",
        "ONE BEHAVIOURAL COMMIT, DECLARED AT PLANNING per the merged Sprint-13/17 rule, and it is wider than the deletion: test/fixtures/workspace-folders.ts IMPORTS the function, so the function, `ClientRoots`, the fixture's `fallback` key, the six tests that read it, the handed-in published-artifacts consumer test and the INVERTED example test cannot land apart without a red tree between them. PROSE FOLLOWS STRUCTURALLY. RIDING ALONG AND UNRELATED, named so it is not read as this ruling's: the Scrum Master's uncommitted JSONC paragraph in test/package-shape.test.ts records why neither tsconfig may carry a comment, which no part of this change touches.",
        "THE SHAPE MOVED MID-EXECUTION AND THE PREDICTION ABOVE IS SUPERSEDED RATHER THAN INHERITED, per Sprint 42, and it is written down BEFORE the new assertion is built rather than after. THE MOVE: the stakeholder asked that `the ./types subpath is type-only` become an ASSERTION rather than the one-time confirmation the brief specified, so `NOTHING IS ADDED ANYWHERE` is now false BY DIRECTION. WHAT IS ADDED, and it is one test in test/published-artifacts.test.ts: an ES module namespace carries EXACTLY the runtime exports, so `Object.keys` of the imported subpath is the instrument -- the one that file already uses for the dependency's value surface, extended to a second subpath rather than duplicated with a second mechanism. THE SPRINT-6 PAIR IS IN THE SAME MEASUREMENT because the claim is an ABSENCE: `[]` alone cannot tell `type-only` from `the module failed to load` from `I read the wrong module`, so the SAME reader takes `@atusy/tsudoi/deps/types` in the same call and must see keys there. THE EXPECTATION IS PER SUBPATH: `./deps/types` exporting the dependency's whole value set is CORRECT, and a claim phrased over the package would be false. REVISED PREDICTION: test/workspace.test.ts 33 -> 27 unchanged, test/published-artifacts.test.ts 44 -> 47 (+3 source: two in the test, one in the shared reader that asserts the probe LOADED), every other file 0/0/0, source 713 -> 710, runtime 1304 -> 1294, tests 458 -> 447. THE NEGATIVE CONTROL IS THE CHANGE ITSELF and both readings are recorded: `[\"foldersWithRootFallback\"]` before, `[]` after.",
        "THE SIX TESTS THAT READ THE FIXTURE'S `fallback` KEY, CLASSIFIED ONE BY ONE per Sprint 43, plus the two the ruling reaches outside that block. (1) `the reduction hands back the folders the client sent, with no root joined to them`: TARGET DELIBERATELY REMOVED, and its property SURVIVES ONE LAYER UP -- the mirror test sends the same conflicting rootUri beside the same folders and asserts neither is folded into the other. (2) `the reduction prefers a rootUri to a conflicting rootPath`: REMOVED, NO RE-HOME, because nothing applies precedence any more; the protocol's rule is now prose at `rootPath`. (3) `the reduction answers a rootPath-only session with a folder named by that path verbatim`: REMOVED, NO RE-HOME, same reason -- no folder is derived from that field anywhere. (4) `the reduction holds a percent-encoded rootUri as spelled, named by the path it decodes to`: SPLIT IN OUTCOME -- the BYTES half SURVIVES in criterion 1's mirror pair, which asserts `file:///home/me/pro%6Aect` exactly, and the DERIVED-NAME half is REMOVED; its second job, being the presence pair for the `no folder` assertions, dies with the assertions it paired. (5) `a rootUri naming no local path yields no folder from the reduction`: REMOVED, and the throw it held off is RE-HOMED AS PROSE at `rootUri`. (6) `the reduction refuses a relative rootPath, and never answers with the launch directory`: REMOVED, AND IT IS THE ONE THAT COSTS -- see the hazard entry below. OUTSIDE THE BLOCK: the published-artifacts test `a consumer's own config calls the reduction with its context, naming no parameter type`, which the Scrum Master had written and not yet committed, is TARGET DELIBERATELY REMOVED per Sprint 38 rather than UNCONSTRUCTIBLE -- it could still be written, and its subject, an unnameable parameter type on a published function, no longer exists. And the example test `a rootUri-only session still completes paths from that root` is REMOVED AND INVERTED IN THE SAME COMMIT into `a rootUri-only session gets no workspace source`, because the example's own comment now claims that in prose and Sprint 14's standing item forbids leaving such a claim unasserted.",
        'WHAT WOULD MAKE EACH SURVIVOR RED NOW, asked test by test because a batch answer cannot catch a disarmed control even in principle. THE MIRROR PAIR AND THE ENCODED SPELLING: measured, not reasoned -- C1 reddens both by name. THE RELATIVE-rootPath MIRROR: an implementation reading these fields with `||` rather than `??` reddens on the `""` spelling, which is the door the whole hazard travels through. THE INVERTED EXAMPLE TEST: C1 reddens it too, which is what shows the inversion is not a green written to match the tree. AND ONE IS DISARMED, REPORTED RATHER THAN FOUND AT REVIEW: `a rootUri naming no local path still completes the handshake` can no longer be the first thing to fail, since nothing interprets that field and any handshake failure reddens most of the file first. IT IS KEPT, because deleting a defence of an accepted criterion is a scope decision per Sprint 16 and this ruling did not make one, and the finding is written at the test so nobody reads its green as coverage. SPRINT 44\'S QUESTION OF THE NEW SHAPE: the analogous hazard is that the config author who writes the reduction themselves meets BOTH traps with nothing driving either, which is the entry below.',
        "THE HAZARD CRITERION 3 EXISTS FOR IS NOW UNOWNED BY ANYTHING THE SUITE DRIVES, AND THAT IS REPORTED RATHER THAN PAPERED OVER. Criterion 3 says `nothing owns it` is the one outcome that fails it; the stakeholder withdrew the owner, so hazard (a) -- an author reading `workspaceFolders` alone gets `[]` where a root exists -- and hazard (b), the cwd guard, are both PROSE at `rootUri` and `rootPath` in src/types.ts. NOT CONSTRUCTED, per Sprint 11, AND WHAT REMAINS AT RISK NAMED: no artifact in this repository can manufacture a root out of a relative `rootPath` any more, so THE HAZARD IS FORECLOSED FOR tsudoi AND LIVE FOR THE AUTHOR, and nothing reddens if the prose that warns them goes wrong. NO SUBSTITUTE OWNER WAS SOUGHT and that is deliberate: `an author might want it` is refused by name in this backlog, and a second published function invented to keep a criterion green would be the same purchase the stakeholder just refused. WHAT DID NOT DIE WITH IT: the second protection, `fileURLToPath` throwing on a URI naming no local path, which the brief did not name and criterion 3 does -- it is re-homed at `rootUri` in the same shape, mechanism first.",
        "THE CONTROLS, AND THREE OF THIS SPRINT'S OWN NO LONGER HAVE TARGETS, which is the Sprint-38 vocabulary applied to the sprint's own instruments. C2 (strip the absolute check), C3 (make the reduction return `[]`) and C4 (rename the exported name) are ALL TARGET DELIBERATELY REMOVED -- there is no reduction and no exported name -- so the recorded evidence for criteria 2 and 3 is now evidence about a tree that no longer exists, and this entry is what stops it being read as current. WHAT WAS RUN INSTEAD. C1 RE-RUN, target stated first per Sprint 43: the mirror in `initialize` is untouched, so the rung can still be re-introduced. OBSERVED, both runtimes: SIX tests redden, the criterion-1 test naming `workspaceFolders` going from `[]` to one folder with the rootUri line unchanged, and the INVERTED example test among them -- which is what shows that inversion asserts something. C5, THE NEW ASSERTION'S OWN CONTROL, and the stakeholder asked for it in this shape: append a value export to src/types.ts, rebuild, and the type-only test reddens naming `probeMarker` in ITS FIRST ASSERTION, 17 pass / 1 fail in that file, so nothing else in the suite was standing in for it.",
        'THE PUBLISHED SURFACE, MEASURED ON THE ARTIFACT IN BOTH DIRECTIONS AND NOT GREPPED OVER SOURCE, which is the instrument the seventh degenerate probe of this thread got wrong. BEFORE, at 991ea3a with a clean rebuild: `Object.keys` of dist/types.js is `["foldersWithRootFallback"]`. AFTER: `[]`, with dist/types.js ELEVEN BYTES, beside `@atusy/tsudoi/deps/types` at 85 keys through the same reader -- which is the Sprint-6 pair, since `[]` alone cannot tell type-only from a module that failed to load. AND TWO OF THE THREE LOOSE ENDS SPRINT 45 RECORDED ARE MEASURED DEAD RATHER THAN REASONED DEAD: dist/types.js no longer carries `./workspace.js` and dist/types.d.ts no longer carries `./workspace.ts`, so the declaration-emit divergence has no subject; and the unnameable parameter type went with the function it belonged to. THE THIRD, the CommonJS residual, is retired in the same stroke -- a `require` reaching the unshipped `default` arm now misses NOTHING rather than a real function.',
        "THE OBSERVED DIFF AGAINST THE PREDICTION, WHICH HELD ON TWO TOTALS AND MISSED ONE BY A LINE I CHOSE TO MOVE AFTER PREDICTING IT. MEASURED: `bun test` 447 pass / 0 fail with 1294 runtime expect() calls -- both EXACTLY as revised -- and 709 SOURCE LINES against 710 predicted. WHERE IT MOVED, reported rather than smoothed: test/published-artifacts.test.ts went 44 -> 46 where 47 was predicted, because the shared reader ABSORBED the value-arm test's own load check instead of duplicating it, which is what `do not invent a second instrument` actually costs and which I decided after the prediction was committed. test/workspace.test.ts 33 -> 27 exactly, SIX REMOVED and TWO CHANGED IN PLACE as predicted. EVERY COUNTERFACTUAL STAYED SILENT: test/notifications.test.ts, test/completion-path.test.ts, test/package-shape.test.ts and test/installed-runtime.test.ts are 49, 74, 16 and 25, each unchanged from baseline, so no identity change crept in, the example's own behaviour did not move, and the exports map's assertions are untouched while their PROSE was repaired. THE FOUR DoD CHECKS, unpiped, with the commands as run: `bun test` 447/0, `bunx oxlint` EXIT 0 with the one pre-existing require-yield warning, `bunx oxfmt --check .` EXIT 0, `bunx tsc --noEmit` EXIT 0.",
        "PROSE: EVERY SITE RE-MEASURED RATHER THAN TAKEN FROM THE HANDED LIST, and one of them measured rather than reasoned as the ruling required. REPAIRED: src/types.ts x3 (the reduction's mention at `workspaceFolders`, and both hazards written at the fields where an author meets them); src/server.ts's initialize block; src/methods.ts's `RequestRoots` naming justification, WHICH THE HANDED LIST DID NOT CARRY -- it justified the name by a collision with `ClientRoots`, a type this change deletes; examples/completion-path.ts x2; examples/tsudoi.config.ts's three-fields paragraph; test/package-shape.test.ts's CommonJS premise, reversed for the SECOND time inside one sprint and now pointing at the test that holds it; test/installed-runtime.test.ts's middle-arm probe; test/published-artifacts.test.ts's declaration-emit divergence, whose subject is gone; and test/workspace.test.ts throughout. MEASURED, NOT REASONED: test/helpers/checkout.ts's dist/ justification. Staging no dist/ reddens TWO tests in test/resolution.test.ts; staging dist/ WITHOUT dist/types.js leaves the checkout starting at EXIT 0 and silent; deleting dist/deps/types.js reproduces the failure, naming `@atusy/tsudoi/deps/types` from examples/diagnostic-trailing-whitespace.ts. SO THE CONCLUSION SURVIVES AND THE WITNESS WAS WRONG ALL ALONG -- a dependency value on a SIBLING subpath, which is what the sentence named before Sprint 45 briefly made its shape true.",
        'A CLAIM THIS SPRINT WROTE ABOUT ITS OWN SUITE WAS FALSE, AND ITS COUNTEREXAMPLE WAS THE TEST THE SAME COMMIT ADDED. Repairing test/installed-runtime.test.ts I wrote that the bare-import probe is THE ONLY THING THAT WOULD NOTICE THE `import` ARM\'S LOSS, reasoning from `a type-only consumer never runs`. MEASURED BY CONSTRUCTION -- delete `"import": "./dist/types.js"` from the `./types` arm and run: FIVE tests redden, including the type-only surface assertion I had just written, which resolves that subpath at run time in the installed consumer. Sprint 13 in its plainest form: a claim about what the suite covers is checked against the suite, and RECALLED COVERAGE IS NOT COVERAGE. Sprint 22 is the other half -- it is a claim a comment makes about its own file, written while editing that file, which is the shape that survives a first self-review. CAUGHT BEFORE THE REPORT rather than at Review, and only because a reviewer asked for the perturbation instead of reading the sentence.',
        "THE TWO RUNTIMES DISAGREE ABOUT WHAT A TYPE-ONLY IMPORT COSTS, AND A ONE-RUNTIME MEASUREMENT REPORTED THE WRONG ANSWER FIRST. Measuring the checkout's dist/ dependence I found that deleting dist/types.js leaves the server starting at EXIT 0, and wrote that tsudoi's own subpath is not what the staging is for. UNDER DENO THE SAME TREE EXITS 1 with ERR_MODULE_NOT_FOUND naming dist/types.js, imported from examples/diagnostic-trailing-whitespace.ts:17. THE MECHANISM IS IMPORT ELISION, NOT RESOLUTION: that line is `import { type MethodHandler } from \"@atusy/tsudoi/types\"`, whose bindings are ALL type-only, and bun DROPS the statement while deno KEEPS AND LOADS IT. So a source line that reads as type-only is a real runtime dependency on one of the two runtimes this project verifies -- and it is invisible to every bun-only probe. The finding is written at test/helpers/checkout.ts beside the staging it justifies; NO TEST IS PROPOSED, because the installed-runtime and resolution suites already run both runtimes and reddened on exactly this.",
        'A SECOND STAKEHOLDER RULING, AND ITS DIFF IS PREDICTED BEFORE ANY FILE IS TOUCHED. THEIR WORDS: `相対パスはURIじゃないからそもそもリジェクトしていい` -- a relative path is not a URI, so rejecting it outright is fine. `rootPath` IS REFUSED AT THE BOUNDARY: `roots()` reports `null` for a non-absolute value, `isAbsolute` is the check, and truthiness is not since `"."` passes it. WHY IT IS NOT A BREACH OF THE MIRROR, which is the reasoning and not the instruction: the mirror refuses to NORMALISE a value the client meant -- two spellings of one directory are two folders -- and that does not oblige us to FORWARD a value the author cannot correctly use. A relative `rootPath` resolves only against a working directory THE CLIENT DOES NOT SHARE, so passing it through hands the author something that means one thing to the editor and another to this process. AND THE RECORDED INVARIANT SURVIVES INTACT: `absence must never become a root` bounds the dangerous direction, and this moves the other way -- a root becomes absence, never the reverse. NOT EXTENDED TO `rootUri`: a non-file URI is a VALID URI naming no local path, refusing it would hide a legitimate value from an author who handles a non-file scheme, and the stakeholder ruled on relative PATHS. PREDICTION: test/workspace.test.ts 27 -> 27 with ONE LINE CHANGED IN PLACE -- the relative-rootPath mirror test becomes a THREE-CASE table over one reader, `""` and `"."` arriving as null and an ABSOLUTE path arriving verbatim, which is Sprint 6\'s pair taken by one measurement. EVERY OTHER FILE 0/0/0. Source 709 -> 709, runtime 1294 -> 1296 (that test loops three cases per runtime rather than two), tests 447 -> 447. COUNTERFACTUALS: an ADDED `expect(` means the presence arm was built as a SECOND test rather than through the same measurement; a CHANGED one in the three other mirror tests means the boundary reached something other than `rootPath`, since each sends none and asserts null already; any diff in test/completion-path.test.ts or test/notifications.test.ts means the check escaped the boundary; and a ZERO diff in test/workspace.test.ts would mean the rejection is not asserted at all.',
        'THE SECOND RULING\'S OBSERVED DIFF AND ITS CONTROL, AND THE PREDICTION HELD ON EVERY COLUMN THIS TIME. MEASURED: source 709 -> 709 with test/workspace.test.ts at 27 and ONE LINE CHANGED IN PLACE; runtime 1294 -> 1296; tests 447 -> 447. EVERY COUNTERFACTUAL SILENT -- no ADDED `expect(` anywhere, so the presence arm really is in the same measurement; test/completion-path.test.ts 74, test/notifications.test.ts 49, test/published-artifacts.test.ts 46 and test/installed-runtime.test.ts 25, each unchanged, so the check did not escape the boundary. THE NEGATIVE CONTROL, and it is the one that decides whether the guard is real: replace `isAbsolute` with a truthiness test and the `"."` ROW REDDENS ON BOTH RUNTIMES, reporting `rootPath: "."` where null was expected, WHILE `""` AND THE ABSOLUTE ROW STAY GREEN -- so a guard written the obvious way passes two thirds of this table, which is exactly why the check is named rather than implied. ONE OF THE SIX CLASSIFIED LAST ROUND COMES BACK: (6), the cwd guard, RE-HOMED AND NOT RESURRECTED. Its property -- a relative `rootPath` never becomes a root made of the launch directory -- is now asserted ONE LAYER UP at the mirror, and it is STRICTLY STRONGER than the test that died: that one watched a reduction refuse to build the folder, where this one denies the value to every reader, so the cwd root is UNCONSTRUCTIBLE rather than guarded. The old failure message, naming a folder whose uri contains the launch directory, is not reproducible for the same reason.',
        "WHICH HAZARD MOVED AND WHICH DID NOT, because this changes what criterion 3 is short of rather than meeting it. HAZARD (a) -- `pathToFileURL` on a non-absolute `rootPath` yielding the launch directory -- IS OWNED BY CODE AGAIN, at the boundary, driven by a table with a negative control. HAZARD (b) -- `fileURLToPath` THROWING on a `rootUri` that names no local path -- IS STILL OWNED BY PROSE ALONE, and deliberately: a `vscode-remote://` root is a VALID URI that merely names no LOCAL path, refusing it would hide a legitimate value from an author handling a non-file scheme, and the stakeholder ruled on relative PATHS. So criterion 3 is CLOSER AND NOT MET. AND THE COST IS WEIGHED RATHER THAN GLOSSED, since it is the one thing this ruling buys with: AN AUTHOR CANNOT TELL `the client sent no rootPath` FROM `the client sent one we refused`. I DO NOT THINK IT SHOULD BE DISTINGUISHABLE and did not stop, and the reason is that the argument cuts against the PBI-49 trade only if the refused value carried information: it does not. A relative `rootPath` names a directory RELATIVE TO A cwd THE CLIENT DOES NOT SHARE, so `the client named a project we cannot locate` is nearer to `no project` than to `a project`, where PBI-49's visible-absence trade was about a value that WAS usable and was being hidden. Making it distinguishable costs a third state on a published field, and that is the PO's to want rather than mine to build. STATED AT THREE SITES so a future reader meets the cost where the value is: src/workspace.ts's `roots` doc, its `initialize` body, and `rootPath` in src/types.ts.",
        "PER-SPRINT REVIEW CHECKLIST. (1) CRITERION 1'S ABSENCE MUST BE PAIRED IN ONE TEST -- an empty list alone cannot tell `nothing was synthesised` from `the field was dropped`. (2) CRITERION 2'S NEGATIVE CONTROL IS THE LOAD-BEARING ONE and must redden NAMING a folder whose uri contains the launch directory; a weaker assertion is met by a shape that hands every author a cwd root. (3) CRITERION 3 PASSES IF ANYTHING THE SUITE DRIVES OWNS THE HAZARD, so a report proposing a different owner is a PASS, and only `nothing owns it` fails. (4) A NON-ZERO `expect(` DIFF IN THE FOLDER-CHANGE TESTS MEANS THE IDENTITY CHANGE CREPT IN. (5) THE NINE SYNTHESIS TESTS ARE CLASSIFIED ONE BY ONE; a batch classification is the shape that hides a coverage loss.",
        "CRITERION 3 IS RECORDED UNMET AS WRITTEN, AND BOTH OF ITS PREMISES WERE SUBSEQUENTLY WITHDRAWN. BOTH FACTS, NOT ONE REPLACING THE OTHER. The criterion said `an author reading workspaceFolders alone gets [] where a root exists` must be owned by something the suite drives, and that `nothing owns it` is the ONE outcome that fails. THAT OUTCOME OCCURRED when the stakeholder deleted the reduction. THE PO REFUSED TO SOFTEN THE LABEL, in their words: a criterion whose failing case happens has failed, and THE VALUE OF WRITING CRITERIA AT ALL IS THAT THIS SENTENCE CAN BE SAID. It is not `met differently` and not `waived`.",
        "THE SPRINT CLOSES ANYWAY, ON A STATED DISCRIMINATOR RATHER THAN ON LENIENCE: the criterion was unmet by a RULING THAT REMOVED ITS SUBJECT, not by execution shortfall -- Sprint 43's precedent, where a measured capability was withdrawn on a ruling and shipped with the loss on the record. THE TEST THE PO APPLIED IS WHETHER CONCEALMENT WAS AVAILABLE, AND IT WAS: the executor could have invented a second owner and reported four green. They refused, and their reason is the one the PO adopted -- A SECOND PUBLISHED FUNCTION INVENTED TO KEEP A CRITERION GREEN IS EXACTLY THE PURCHASE THE STAKEHOLDER JUST REFUSED. Putting it in the headline rather than in a note is what made this acceptance possible at all.",
        'THE TWO HAZARDS THE CRITERION NAMED ENDED IN DIFFERENT PLACES, AND NEITHER IS WHERE THE CRITERION EXPECTED. (a) A RELATIVE `rootPath` IS REFUSED AT THE BOUNDARY, so it is owned by CODE with its own negative control -- and the control is what makes the check real rather than decorative: replacing `isAbsolute` with a truthiness test reddens the `"."` row on both runtimes while `""` and the absolute row stay green, so A GUARD WRITTEN THE OBVIOUS WAY PASSES TWO THIRDS OF THE TABLE. (b) `fileURLToPath` THROWING ON A NON-FILE `rootUri` IS NOT TSUDOI\'S AT ALL, ruled by the stakeholder and MEASURED before acting: src/ never calls that function -- the only mention was the paragraph naming it -- and the one caller is examples/completion-path.ts, which already records the same trap and handles it. A WARNING ABOUT WHAT AN AUTHOR MIGHT DO, SITTING IN THE FILE THAT DEFINES THE PUBLISHED TYPES, whose violation could not be an edit to tsudoi.',
        "AND THE PREMISE UNDER THE WHOLE CRITERION WAS WITHDRAWN LAST: the stakeholder ruled that a client sending only `rootUri` HAS NO `workspaceFolders` BY ITS OWN CHOICE, so the empty list is not a gap tsudoi opened -- `workspaceFolders` is capability-gated, a client that lacks the capability sends none, and reporting `[]` beside a populated `rootUri` is accurate rather than lossy. THAT IS THE CLIENT'S RESPONSIBILITY AND NOT THE SERVER'S. Recorded rather than used to retro-fit the criterion, because a criterion rewritten at Review into a form the result satisfies is a fitted criterion however much stronger it reads.",
        "C2'S cwd OBSERVATION IS RE-LABELLED BEFORE COMPACTION, WHICH THE PO REQUIRED AND WHICH THE COMPACTION WOULD OTHERWISE HAVE CORRECTLY DESTROYED. Filed as `criterion 2's control` it became dead the moment that criterion went NOT CONSTRUCTED. IT IS NOT EVIDENCE ABOUT CODE -- it is evidence about the WORLD, and it is the only empirical backing the `rootPath` refusal has: `pathToFileURL(\".\")` produced `file:///private/var/.../T/tsudoi-paths-mYNSkT`, THE DIRECTORY THE SESSION WAS LAUNCHED IN. THE DISCRIMINATOR THE PO GAVE, worth more than this instance: EVIDENCE ABOUT THE CODE DIES WITH THE CODE, EVIDENCE ABOUT THE WORLD SURVIVES IT.",
        "C3 IS MARKED SUPERSEDED AND DEAD, IN PLACE RATHER THAN DELETED. It measured that the reduction returning `[]` reddened the example's completion, and its coupling finding -- that the owner would have become the example's ONLY route to its folders -- is now moot, AND ITS MOOTNESS IS ITSELF PART OF THE STAKEHOLDER'S CASE. Deleting it would lose knowledge that outlives the code; leaving it unmarked would leave a `MEASURED` label reading as current, which is a false proof closing a question and the highest-cost error in this project's economy.",
        'THE STAKEHOLDER\'S GUARANTEE, ASKED FOR AND BUILT: `@atusy/tsudoi/types` EXPORTS NOTHING AT RUN TIME, asserted on the PUBLISHED artifact rather than on source. `Object.keys(dist/types.js)` is `[]` beside `deps/types` at 85 THROUGH THE SAME READER, which is the Sprint-6 pair an absence assertion requires -- an empty list alone cannot distinguish `type-only` from `the module failed to load` from `we measured the wrong module`. ITS NEGATIVE CONTROL IS THE DELETION ITSELF: the observation moved from `["foldersWithRootFallback"]` to `[]`. The reader is SHARED with the existing value-arm test rather than duplicated, which is what stops one subject growing two instruments that can disagree.',
        "A ONE-RUNTIME MEASUREMENT WAS REPORTED AS THE ANSWER, SELF-DISCLOSED. `import { type MethodHandler }` is ELIDED BY BUN AND LOADED BY DENO, so deleting `dist/types.js` gives bun EXIT 0 and deno EXIT 1 naming that file. The executor's first checkout measurement ran on one runtime. THE SUITE RUNS BOTH PRECISELY BECAUSE THEY DIFFER; A HAND-RUN PROBE DOES NOT, and that asymmetry has now bitten.",
        "A UNIQUENESS CLAIM THIS SPRINT WROTE ABOUT ITS OWN SUITE WAS FALSE, and a perturbation found it rather than a reading. The sentence said its probe was the only thing that would notice the `import` arm's loss; deleting the arm reddens FIVE tests, INCLUDING THE TYPE-ONLY ASSERTION THE SAME COMMIT ADDED. Sprint 13 forbids taking a coverage claim on recollection, and a uniqueness claim is a coverage claim.",
        "PBI-50 IS DELETED WITH ITS SUBJECT. The PO drafted it so the withdrawn hazard would be routed rather than dropped -- a config in this repository doing the reduction inline, driven by the suite, with declining written in as a complete answer. THE STAKEHOLDER'S RULING RETIRED THE HAZARD ITSELF rather than declining to own it, so the PBI has nothing left to decide. Filing it was right on the evidence available: it put the choice in front of the stakeholder with its cost named, and the answer came back that there was no choice to make.",
        "A FOURTH UNROUTED EDIT IN THIS THREAD, and the executor handled it the way the precedent asks. Their `git add scrum.ts` swept up PBI-50, which the PO had left uncommitted while they worked. They did not author or edit it; they SPLIT IT BACK OUT into its own commit attributing it, content untouched, rather than let it be buried in a message describing something else.",
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
    number: 46,
    pbi_id: "PBI-53",
    status: "in_progress",
    goal: "The published package is named @atusy/tsudoi-language-server on all three routes, and the sweep's own controls are proven still armed.",
    subtasks: [
      {
        test: "The census is committed before any file is touched, so it is a prediction rather than a report.",
        implementation:
          "Take a two-pattern census. P1 is boundary-aware so the old name is not counted inside the new one; P2 widens to `atusy`, and P2-minus-P1 is enumerated BY NAME.",
        type: "structural",
        status: "completed",
        commits: [],
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
        status: "pending",
        commits: [],
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
        status: "pending",
        commits: [],
        notes: [
          "Criteria 1 and 2 collide on this one file. The separation is structural rather than argued.",
        ],
      },
      {
        test: "Each control names what it measured, and a green that measures nothing is recorded as such.",
        implementation:
          "Run the five controls: C1 revert name alone; C2 delete the paths key; C3 revert one README start line; C4 the standing Sprint-14 re-run; C5 criterion 3's sliced-JSON comparison.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [
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
        status: "pending",
        commits: [],
        notes: [
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
        status: "pending",
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
      "TWO DRIFTS FROM THE HANDED PLAN, RE-MEASURED RATHER THAN COPIED per Sprint 27, and both are findings rather than corrections. FIRST, the plan's baseline was taken where `oxfmt --check .` was RED; at bee94c5 ALL FOUR CHECKS ARE GREEN and the reformat the plan reserved as its own first step is already landed, so it is not this sprint's to run and criterion 1's premise is satisfiable as written. SECOND, scrum.ts carries FOURTEEN P1 hits and not the plan's fifteen: product_backlog FIVE rather than six, completed seven, retrospectives two. The missing one is criterion 1's verification, rewritten between the plan and the sprint. SPRINT 43'S LIVING-FILE POINT DEMONSTRATING ITSELF ON THE EXACT COUNT THAT ENTRY EXISTS TO KEEP UNFROZEN -- which is why the criterion freezes no number and this one carries the commit it was taken at. THE THREE-CLASS ASSIGNMENT OF THE REMAINING HITS IS DELIBERATELY NOT TAKEN HERE: committing this census adds old-name occurrences to scrum.ts, so an assignment made now would be stale on the next commit and must be measured at acceptance instead.",
    ],
  },
  retrospectives: [
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
