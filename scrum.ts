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
      id: "PBI-75",
      story: {
        role: "tsudoi maintainer",
        capability:
          "pack a handler package and know the declarations inside the tarball were graded against the artifact a consumer receives",
        benefit:
          "what a stranger installs was checked against what they get, not against a file that is never shipped",
      },
      acceptance_criteria: [
        {
          criterion:
            "A handler package's build does not grade its declarations against the framework's source when the framework's artifact is absent -- either it cannot run in that state, or the state cannot arise, and whichever it is, something reddens the day that stops being true.",
          verification:
            "THE FIRST SUBTASK IS A BOUNDED MEASUREMENT AND THE DESIGN WAITS ON IT: do the `.d.ts` a handler emits differ between a build against the framework's `dist/` and a build against its `src/`? Byte-compare the emitted declarations from both states of one member, at a named base. IF THEY DO NOT DIFFER, a hard refusal would be added to a documented command for a cost nobody has shown. IF THEY DO, the refusal is obvious and its message can name what differed. Only then is the shape chosen.",
        },
      ],
      status: "draft",
      notes: [
        "MEASURED IN SPRINT 61, AND THIS ITEM CLAIMS ONLY WHAT WAS MEASURED. On a staged fresh checkout nobody has built, `bun pm pack` in each handler EXITS 0 and produces a tarball, because its `prepack` compiler answers `@atusy/tsudoi-language-server/{types,deps/types,deps/protocol}` from `packages/tsudoi-language-server/src/*.ts` -- TRACED with the compiler's own resolver, not inferred. WHAT WAS MEASURED IS WHAT THE PACK READ AND THAT IT EXITED 0. IT IS NOT CLAIMED THAT THE TARBALLS ARE WRONG; that is the first subtask's question.",
        "IT INHERITS THE SENTENCE OF PBI-60 -- CLOSED IN SPRINT 61, WHOSE RECORD CARRIES THE MEASUREMENTS -- AT A DIFFERENT CHECK AND WITH A WORSE CONSEQUENCE, which is why it outranks everything: the same source arm answers, but where that item's cell ends in a quiet root type check, this one ends in an artifact a stranger installs.",
        "WHY NOTHING CAUGHT IT, AND IT IS A REASON RATHER THAN A GAP: the suite runs this route only in the state where it is safe. The README arm packs in a REAL member directory for the handlers, but under `bun test` the preload has already built the framework, so the route is exercised exclusively after the artifact exists. `refuseSubpathsAnsweringFromSource` cannot see it either -- scripts/typecheck-workspaces.ts builds before it reads, so the pack route passes under it entirely.",
        "REFUSAL IS NOT THE ONLY SHAPE, NAMED SO THE NEXT EXECUTOR MEETS THE FORK RATHER THAN TREATING REFUSAL AS DECIDED: `prepack` may instead BUILD THE FRAMEWORK FIRST. A precondition that refuses edits the publish sentinel and changes a documented command whose blocks this suite extracts and executes, so the ripple reaches the documentation layer.",
        "FORECLOSED HERE AS EVERYWHERE: deleting the framework's source arms, and a `paths` mapping or project reference. Both are refused with measurement -- the record is PBI-60's, closed in sprint 61, and the refusals themselves are IN THE TREE: the exports equality pin in test/package-shape.test.ts and the blocker pair in test/unbuilt-artifact.test.ts for the arms, `refuseMemberMappings` for the mapping. Neither becomes available because the subject moved to the pack.",
      ],
    },

    {
      id: "PBI-62",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a comment or a documented number and find it describes the repository I am in",
        benefit:
          "the reasons this project writes down keep being evidence rather than becoming folklore",
      },
      acceptance_criteria: [
        {
          criterion:
            "No statement in the tree explains a present-day fact by a mechanism the move removed.",
          verification:
            "Named sites, each READ rather than grepped for. The staged-path pin licenses itself with `that mapping is safe only because it cannot reach the packing stage` -- and there is NO MAPPING ANYWHERE NOW, so the tree's one narrative statement of how this repository resolves its own subpaths is false, and a contributor learns the pre-move story from the file that pins what we publish. The root config still excludes a directory the root no longer produces, matching nothing, with a test pinning the literal. A CANDIDATE SIXTH INSTANCE IS NAMED AND NOT RULED: test/package-shape.test.ts explains the members' exclusion by `the mapping asserted above resolves the framework's subpaths for EVERY file in the root program`, and the root config has no mapping -- read it and decide whether it is one of these or another. AND A SEVENTH, FOUND BY SPRINT 55'S REVIEW AND VERIFIED TO PREDATE IT (byte-identical at that sprint's own base): the fifth check's header licenses withdrawing the root check by `the root check answers a member's import THROUGH THE ROOT'S OWN paths MAPPING and reports success` -- and no tracked configuration in this repository contains such a mapping. The withdrawal is right; the reason given for it stopped being true when the mapping went.",
        },
      ],
      status: "draft",
      notes: [
        "THE COUNT SITE THIS PBI WAS FILED WITH IS ALREADY CLOSED, and how it closed is the argument for the rest: adding four skill files moved the documented number, and it was repaired BY NAMING rather than by writing the new number -- which is the convention this project holds and the reason the count was a defect rather than a typo.",
        "SEPARATED FROM STALE-VALUE REPAIRS BY WHAT MAKES THEM WRONG: an excluded directory that matches nothing is a VALUE that went stale, while the pin's licence is a MECHANISM CLAIM that is now false -- which is the class this project has filed five instances of and has no check for.",
        "SAME-SPRINT FALSITY IS A NAMED SUBCASE AND IT IS THE HARDER ONE. Every instance filed here so far has an innocent story -- the mechanism was removed AFTER the sentence was written -- and that story licenses reading the prose as once-true. SPRINT 55 PRODUCED ONE WITH NO SUCH STORY: a function's docstring said `NO EXEMPTION LIST, AND SHIPPING WITHOUT ONE IS A DECISION` while the function shipped one, and the sentence and the code it misdescribes were written BY THE SAME AUTHOR IN THE SAME SPRINT. The prose was never read against the implementation even once.",
        "A SECOND INSTANCE OF THAT SUBCASE, FILED INTO PBI-62 BECAUSE THE SUBCASE ABOVE HAS COUNTED EXACTLY ONE AND `THE HARDER ONE` IS A CLAIM ABOUT A CLASS WITH ONE MEMBER. From sprint 57: the report reader in `test/helpers/perturbation.ts` licensed its chunking by `bun does not escape `>` inside an attribute value`. MEASURED on bun 1.3.13 -- THE VERSION THAT SAME DOCSTRING ALREADY CITES, so nothing about the environment had to be discovered to falsify it -- an arm name carrying `<`, `>`, `&`, `\"` and `'` comes back through `--reporter=junit` with all five WRITTEN AS ENTITIES. The sentence and the code it misdescribes were written in ONE SPRINT and the licence was falsified in that SAME sprint, by its own author, while arming the thing it licensed. IT HAS NO INNOCENT STORY EITHER: nothing was removed after the sentence was written, so there is no reading in which it was once true -- the prose was never read against the runtime it names, which is exactly what separates this subcase from a reason that aged.",
        "AND THE CLASS RECURRED INSIDE ITS OWN REPAIR, which is what makes it structural rather than a lapse. The corrected subtraction reads `not in the index AND under a declared output directory`, and the sound direction is the one the code takes: in the index implies not compiler-written. THE DOCSTRING ABOVE IT ASSERTS THE CONVERSE AS AN IDENTITY -- `an untracked path under a program's own output directory IS a file the compiler WROTE`. It is not: an untracked file a person dropped there is excused, and nothing in the tree names that. It does not bite in this checkout because every build output is ignored and never reaches candidacy; in a throwaway with no ignore file it would.",
        "WHAT THIS SAYS ABOUT WHERE THIS PROJECT'S PROSE SITS RELATIVE TO ITS CODE, and it is the reason this item matters more than tidiness: THE SUPERLATIVES ARE THE STRONGEST CLAIMS IN THE TREE AND THE ONLY ONES WITH NO ENFORCEMENT AT ALL. A false superlative is not a documentation defect -- it is a specification with no compiler, read by the next contributor as settled. AND READING THEM DOES NOT FIND THEM: every finding that mattered this sprint came from applying a degenerate to shipped code, not from a careful re-read.",
        "THE GENERALISATION IS REFUSED IN ADVANCE: no guard that every exclude entry matches something on disk. An unmatched pattern is legitimate configuration, such a guard would redden correct files, and this instance was caught by the layer meant to catch it -- filed by its executor rather than shipped.",
        "AN INSTANCE MOVED INTO PBI-62 OUT OF SPRINT 57'S DECISIONS, WHICH IS NOT A HOME THAT OUTLIVES A CONTEXT WINDOW -- this dashboard's own header rule, applied to a finding that was sitting in the one place compaction takes first. THE SITE IS `scripts/definition-of-done.ts`'s header, which states its own cost as `a type error in scrum.ts stops the run instead of failing one check -- which is the trade taken`. MEASURED on bun 1.3.13, in a throwaway tree whose dashboard's only unusual property is a type error: `tsc --noEmit` there is exit 1 with `TS2322`, while `bun run scrum.ts` is exit 0 and prints its JSON, and the shipped runner pointed at that tree reads the checks, runs them and prints `Definition of Done: PASSED` at exit 0. THE RUNTIME STRIPS TYPES WITHOUT CHECKING THEM, so the sentence explains a present-day decision by a mechanism this project does not have -- and the trade it says was taken was never available to take, which makes it this item's class rather than a stale value. PRE-EXISTING: `scripts/definition-of-done.ts` is byte-identical between dd4fbd9, sprint 57's base, and this commit.",
      ],
    },

    {
      id: "PBI-71",
      story: {
        role: "tsudoi maintainer",
        capability:
          "put a scratch file where this repository says to put scratch files without it running in the suite ungraded",
        benefit:
          "the one directory kept for what is not accounted for stops being a hole in the accounting",
      },
      acceptance_criteria: [
        {
          criterion:
            "A TypeScript file under the directory this repository ignores is either not run by the suite, or is graded by something.",
          verification:
            "STARTING EVIDENCE, MEASURED: the test runner DISCOVERS a test file under an ignored directory -- a throwaway checkout ignoring one, holding one file inside it and one outside, ran BOTH. So such a file runs, is type-checked by nothing, and the refusal that closed this class everywhere else cannot see it.",
        },
      ],
      status: "draft",
      notes: [
        "WIDENING THE SUBJECT TO IGNORED FILES IS REFUSED IN ADVANCE, and the refusal is the point of filing this separately rather than as a gap in the guard: it would bring back every installed stranger and every built artifact, which the ignore file excludes for its own good reasons. WHAT IS OWED IS A DIFFERENT DISCRIMINATOR, NOT A LOOSER RULE.",
        "AND THE ITEM IS FILED BECAUSE DISCLOSED AND COVERED ARE DIFFERENT STATES. The residue was named as a decision before its sprint closed rather than discovered at review, which is the standard; it is filed so the naming does not come to be read as the covering.",
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
        "AN INSTANCE FROM SPRINT 57, FILED INTO PBI-57 BECAUSE THIS ITEM COUNTS INSTANCES AS ITS EVIDENCE AND THIS ONE IS THE COMMENT HALF, NOT THE ARM HALF: the recursion refusal in `test/helpers/perturbation.ts` shipped with BOTH its new comment and the inherited one asserting that deleting the detection starts a spawn tree with no bottom -- a mechanism the code denies. MEASURED with the detection deleted rather than feared: `repoRoot` is module-relative, so inside the stage it IS the stage, the stage carries no `.git` and no parent of a temporary directory does either, `git ls-files` exits 128 and the stager throws -- the chain STOPS AT DEPTH 2 in 264 ms, and the whole degenerate reads 15 pass / 1 fail, that arm alone. Corrected in caaf376, which also took the full degenerate the fear had withheld. WHY IT BELONGS HERE AND NOT IN THE CITATION HALF: every path and every test name in that comment resolved, so nothing this item's criterion checks would have found it -- it is the ordering-and-causality class the item's own text says REMAINS UNCOVERED, arriving in the commit that repaired six of its siblings.",
        "WIDENED BY SPRINT 54: THE UNCOVERED CLASS LIVES IN ARMS AND NOT ONLY IN COMMENTS, and in arms it is worse. This item's own text says the ordering-and-causality class stays uncovered and reasons about COMMENTS asserting a mechanism the code denies. Sprint 54 produced FOUR ARMS THAT WERE GREEN WHILE THE ORDERING THEY DEFENDED WAS VIOLATED -- a spy reading the value handed over and not its ordinal among the registrations, a sweep reading a call's COLUMN where the property was its POSITION relative to the first registration, an environment read whose TIME nobody had written down, and a pin reading the exported constant rather than the value the runtime received. That is the disarmed-control shape one level above what this item was filed against, and it is a different statement from the comment half -- folding them blunts both.",
      ],
    },

    {
      id: "PBI-66",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a claim labelled MEASURED and know what it was measured ABOUT, not only that a number was taken",
        benefit:
          "the label keeps meaning that the sentence was checked, instead of meaning that some number was",
      },
      acceptance_criteria: [
        {
          criterion:
            "A claim carrying the MEASURED label states whose cost it is, at what size, on which runtime, and what its instrument cannot separate.",
          verification:
            "STAGED, because every such claim in the tree will have been repaired by the time this is written and an instrument whose witness cannot fail measures nothing: plant a labelled claim missing each of the four in turn and require each to be reported naming the claim. Pair with the same tree unplanted going green.",
        },
      ],
      status: "draft",
      notes: [
        "FILED OUT OF SPRINT 53, WHERE ONE PARAGRAPH NEEDED THREE CORRECTIONS AND EACH CORRECTION INTRODUCED THE NEXT ERROR. Four sentences in sequence: `the cost is linear` (true of the per-entry comparison, false of the sort beside it); `nothing of the directory's size is held or compared` (true of one function, false of the process); a reviewer's `a thirty-two entry buffer` (a real API default attributed to a code path that never reads it); and `what it buys is the disappearance of a superlinear term` (true on bun, and on deno the tail got slower).",
        "THE NUMBERS WERE NEVER WRONG AND THE SUBJECT OF THE SENTENCE WAS WRONG FOUR TIMES, which is what makes this its own item: A SUBJECT ERROR IS INVISIBLE TO RE-MEASUREMENT. Take the reading again, at any size, on either runtime, confirm it, and the sentence stays false. THREE OF THE FOUR CARRIED THE `MEASURED` LABEL -- so in this codebase that label currently warrants the NUMBER and reads as a warrant for the SENTENCE.",
        "THE FORM THIS ASKS FOR ALREADY EXISTS IN THE TREE, produced by the last of those repairs, and it is the exemplar rather than an invention: a reading that says where the allocation happens and never what stays, and that names what it cannot separate.",
        "DELIBERATELY NOT FOLDED INTO THE CITATION CHECK: that item's own text warns that being read as coverage of a class it was not filed for is how it becomes worse than nothing, and `the subject of this sentence exceeds its measurement` is not a referent that resolves or fails to.",
        "TWO INSTANCES FROM SPRINT 59, IN THE SAME PARAGRAPH-PAIR AND FOUND BY DIFFERENT READERS, WHICH IS THE EVIDENCE THIS ITEM COUNTS. SELF-CAUGHT: the ruling commit replaced a `51/135 ms` bare-`readdir` pair with two rows of its own session and called them the same subject -- but that instrument timed WHOLE SHAPES, so its nearest row still carries the gate running over the array. Retired with the reason rather than renumbered, which is this item's exemplar form arriving unprompted. FOUND AT ACCEPTANCE: `the ranking on bun FLIPS WITH SIZE`, offered as the reason one number per runtime could never settle the shape, rests on a -0.021 that the SAME RECORD twice says is inside its own null of +0.001 (-0.036..+0.016). BOTH ARE SUBJECT ERRORS AND NEITHER IS A WRONG NUMBER -- and the second one propagated no further than the dashboard, so a check reading only SHIPPED comments would not have seen it.",
      ],
    },

    {
      id: "PBI-68",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read a park in a file that sets its own deadline as a wait that never completed, rather than as a number a busy machine tripped",
        benefit:
          "the eight files the suite deadline deliberately does not cover stop being the place a red still means the machine",
      },
      acceptance_criteria: [
        {
          criterion:
            "A park in a file that sets its own deadline fails naming the wait that never completed, without a wall-clock number a busy machine can trip.",
          verification:
            "NO MECHANISM IS NAMED HERE, deliberately: naming one is how a criterion gets satisfied in letter. Both branches have measured evidence already and refinement decides between them -- two arms of one file died at 4008ms against that file's own 4000 at load 100-160, while every gated test in the tree read 12.8x headroom or better at load 3-9.",
        },
      ],
      status: "draft",
      notes: [
        "THE HONEST ALTERNATIVE IS IN THE ITEM RATHER THAN OUTSIDE IT, because it may be the right outcome: ACCEPT THE EXPOSURE PERMANENTLY AND RECORD IT AS A DECISION. Each of the eight sets a deadline BELOW the ambient one on purpose, so that a park fails BY NAME in the file that owns it -- that is a property worth keeping, and a wall-clock number is how it is currently bought.",
        "THE EIGHT, ENUMERATED BY READING CALL SITES RATHER THAN BY GREPPING A WORD: protocol 4000, session 4000, completion 4000, cancel-parked-pull 6000, cancellation 6000, cleanup-drain 6000, cleanup 6000 and a second constant at 18000, and editor-death 20_000 -- THE LAST JOINED THIS CLASS BY SPRINT 54'S OWN CHOICE OF NUMBER, and its slowest arm has the least headroom in the tree.",
        "AND THE TIGHTEST MARGIN IN THE TREE IS NOW THE FILE THAT MEASURES THE DEADLINE, at about four and a half times, refused its own allowance ON A PO RULING: an allowance there would exempt the file that measures the deadline from the deadline.",
        "A SECOND MECHANISM IN THE SAME EIGHT FILES, FILED HERE UNDER THE BAR AND NOT REPAIRED IN SPRINT 57, WHOSE SUBJECT IT IS OUTSIDE OF. It is NOT a park and not a wall-clock number: `a completion handler that throws after yielding keeps the chunk it already sent` failed once in one Definition-of-Done run -- `expect(session.stderr).toContain(...)` against an EMPTY string -- and the arm awaits only THIS REQUEST'S RESPONSE before reading stderr, which arrives on a different pipe. So `the diagnostic was never written` and `the diagnostic has not been delivered yet` are one observation, which is this project's own two-states-one-red shape rather than a timing allowance. THE COMMITS AND THE BYTE-IDENTITY RESULT: `test/completion.test.ts`, `test/helpers/lsp.ts`, `test/helpers/fake-editor.ts` and the runtime's `methods.ts` are byte-identical between dd4fbd9 and 9258c02, so nothing this sprint wrote is in the program that assertion reads. WHAT IS NOT CLAIMED: it was not REPRODUCED at the base -- the file alone reads 58 pass / 0 fail on 10 of 10 runs there, and the whole suite was taken only twice at the base, both green, which cannot see an event this rare. The commit was not taken on the red; the next run read 874 pass / 0 fail.",
      ],
    },

    {
      id: "PBI-63",
      story: {
        role: "tsudoi maintainer",
        capability:
          "trust that the tarball at the path the documentation names is the one it means",
        benefit:
          "the route a human follows by hand produces what the route the suite runs produces",
      },
      acceptance_criteria: [
        {
          criterion:
            "The documented pack routes cannot leave one route's artifact standing where another route's install reads.",
          verification:
            "FIRST TASK IS THE MEASUREMENT AND NO FIX IS NAMED IN ADVANCE, because the obvious one is chosen by the answer: does installing the workspace tarball fail loudly, or install the private root quietly and leave a config's specifiers unresolved? MEASURED ALREADY: a member pack and a root pack write THE SAME FILENAME TO THE SAME PATH -- the workspace root is the checkout root -- and the documentation tells a reader the root command packs the workspace without telling them it OVERWRITES the artifact the other step produced, at the path the install reads by name. Harmless inside the suite, which packs and installs in sequence; for a human an interrupted or reordered sequence leaves a poisoned artifact that looks exactly right.",
        },
        {
          criterion:
            "What answers a member's specifier is read from the package that answered, not from the presence of an entry.",
          verification:
            "Promote to a test arm what sprint 52 could only run by hand: follow the entry to its target and read the target manifest's declared name. TODAY ONLY THAT IT IS A SYMLINK IS ASSERTED -- and the move measured why that is not enough, since `resolves to the wrong package` and `no entry at all` produced BYTE-IDENTICAL failure text.",
        },
      ],
      status: "draft",
      notes: [
        "RANKED LOW ON THE FIRST CRITERION AND NOT ON THE SECOND: the root is private for ever and the artifact is local, but the entry-name reading is the discrimination the move showed missing.",
      ],
    },

    {
      id: "PBI-73",
      story: {
        role: "tsudoi maintainer",
        capability:
          "learn from a check that a claim in this tree was measured on a runtime this checkout no longer has",
        benefit:
          "a ruling written so it can age ages when the ground moves, instead of when somebody happens to look",
      },
      acceptance_criteria: [
        {
          criterion:
            "A tracked claim whose warrant is a named runtime version is compared against the runtime present, and the comparison fails naming the claim and both versions -- or the tree records, in ONE place rather than once per site, which claims it cannot see age.",
          verification:
            "NO MECHANISM IS NAMED HERE, deliberately, since naming one is how this gets satisfied in letter -- and a check that reddens on every upgrade for every prose label is a plausible WRONG answer that refinement must weigh against the disclosure arm. STARTING EVIDENCE, MEASURED: `Bun.version`, `Deno.version` and `process.versions` appear in this whole tree ONCE, in `runtimeVersion` inside scripts/listing-shapes.ts -- the instrument nothing runs; every other version in the tree is a literal token in prose, compared with nothing. Staged, because every such token is true today: rewrite one to a version this checkout does not have and require it reported naming the file; pair with the same tree unrewritten going green.",
        },
      ],
      status: "draft",
      notes: [
        "FILED OUT OF SPRINT 59, WHOSE RULING SAYS THIS OF ITSELF AT ITS OWN SITE: EVERY clause that would reopen it is a property of the RUNTIMES, no check reads what an `opendir` allocates or retains, no check re-runs the instrument, and the versions every number was taken on are read off a running binary only inside that instrument. So a runtime upgrade reddens nothing. THE RULING WAS ACCEPTED WITH THAT WRITTEN AT THE SITE -- which is the honest state and not the covered one, and disclosed and covered are different states.",
        "AND `A PERSON RUNNING TWO LINES` IS NOT THE WHOLE OF WHAT MEETS IT, WHICH THIS NOTE SAID UNTIL SPRINT 59'S ACCEPTANCE ADDED A CLAUSE OF ANOTHER KIND. The timing clauses are met that way; the clause added at acceptance -- deno's `Dir` materialising the directory once iteration starts -- is a RETENTION question, and the instrument this item is about reads WALL-CLOCK ONLY, so re-running it answers that clause not at all. IT ALSO DIFFERS IN TENSE: the others are runtime changes that have not happened, and that one may be true TODAY. SO THIS ITEM'S SUBJECT DOES NOT COVER IT -- a version comparison would say the ground moved, and nothing here would say the ruling's basis was never read. Written in so refinement does not size this item against a condition it cannot see.",
        "THE SECOND HALF IS THE INSTRUMENT ITSELF AND IT IS NOT THE SAME QUESTION: scripts/listing-shapes.ts is TRACKED and run by NOTHING, so it can stop executing without any red -- its imports, its guards and its pinned copy of the package's gate all rot in silence. A NON-TIMING SMOKE RUN IS THE MOVE THAT DOES NOT REOPEN THE REFUSAL: sprint 59 refused a WALL-CLOCK ASSERTION inside `bun test`, by name, and asserting that the instrument exits 0 and emits its rows at a tiny size asserts no duration. Whether that belongs here or in the ignored-and-ungraded item PBI-71 is refinement's call; it is written here because sprint 59 is where the file arrived.",
        "IT MAY CLOSE AS A RECORDED DECISION THAT NOTHING SHOULD WATCH THIS, and that is a legitimate outcome: a version comparison that reddens the day a maintainer upgrades bun would trade a silent staleness for a red that means the machine, which is the shape PBI-68 is already about.",
      ],
    },

    {
      id: "PBI-72",
      story: {
        role: "tsudoi maintainer",
        capability:
          "record a perturbation over an arm file that stages a checkout of its own, instead of finding out that the instrument cannot re-run it",
        benefit:
          "the registry's silence keeps meaning `nobody recorded this` rather than `nothing here could`",
      },
      acceptance_criteria: [
        {
          criterion:
            "A weakening whose arm file stages a checkout of its own is re-run by something -- or the registry states IN ITS OWN TEXT which shapes it cannot hold, as a class, rather than each such file naming its own exemption at its own site.",
          verification:
            "THREE MEASURED INSTANCES ALREADY EXIST AND ARE THE STARTING EVIDENCE; no fourth needs finding. (1) THE PUBLISHED-SPECIFIER ARMS: in a staged checkout `mirrorInstalledDependencies` treats the real framework as an INSTALLED dependency -- its realpath is outside the stage -- and hands the probe a SECOND ROUTE, so `the same config fails with TS2307 once the exports entry is removed` is DISARMED there and the baseline refuses the file. The same route is why sprint 58's blocker arm had to LEAVE test/artifact-detector.test.ts, which IS a registry arm file. (2) THIS SPRINT'S OWN-SUBPATHS ARM: test/own-subpaths.test.ts stages a copy of this checkout, and in that stage `repoRoot` IS the stage, which holds no `.git` -- MEASURED, both arms fail reading `git ls-files failed in /var/folders/...`, for a reason that is not the weakening. A SECOND AND INDEPENDENT REFUSAL stands behind it: `reRun` refuses any arm file importing helpers/perturbation.ts, which that file does for its write guard. (3) FOUND AT SPRINT 58'S ACCEPTANCE, WHILE REPAIRING THE BASELINE KEY'S OWN DISCLOSURE: the keyless-baseline degenerate is a source mutation in test/perturbations.test.ts itself, which `reRun` refuses outright for the same import -- so the registry cannot hold the perturbation over its OWN correctness either, and that reading is prose beside the code it measures.",
        },
      ],
      status: "draft",
      notes: [
        "W1'S WEAKENING IS THE CONCRETE PERTURBATION THE REGISTRY CANNOT HOLD, which is what makes this an item rather than an observation: `publishedSubpaths` skipping any manifest whose name begins with this workspace's scope makes the detector blind to every package this repository ships, and it reads 5 pass / 1 fail over two files, the refusal arm ALONE. That is a real weakening, over shipped source, with a measured red -- and there is nowhere in the registry to put it.",
        "AND THIS REPOSITORY KEEPS WRITING MORE OF THAT SHAPE, which is the argument for filing rather than accepting: the residue the detector exists for is a property of THIS workspace's own map, so the arms that measure it must stage THIS checkout -- and every one of them lands outside the instrument by construction, not by accident.",
        "ONE FORECLOSURE, NAMED BECAUSE IT IS THE CHEAP MOVE AND THIS REPOSITORY HAS ALREADY PAID FOR IT: making the stage carry a `.git`, or pointing the stage at the real checkout, is refused. A staging function that returned the checkout root reached a recursive delete that validated nothing and the working tree went with it; `ThrowawayPath` and `throwawayOnly` exist because of that day, and a fix that widens what the stage may be is the same shape again.",
        "IT MAY CLOSE AS A RECORDED DECISION THAT THE EXEMPTION-AT-THE-SITE IS THE ANSWER, and that is a legitimate outcome rather than a failure -- what the criterion refuses is the exemption being written once per file by whoever remembered, since the class is then discoverable only by reading every file that has one.",
        "NOT RANKED AGAINST THE ITEMS ABOVE IT. It is placed here because the item below carries its own reason for staying last, and no other ordering claim is made.",
      ],
    },

    {
      id: "PBI-70b",
      story: {
        role: "tsudoi maintainer",
        capability:
          "know which of the arms already in this suite would notice their own predicate being weakened",
        benefit: "the greens inherited from before the rule are worth what the new ones are worth",
      },
      acceptance_criteria: [
        {
          criterion:
            "Each arm in the existing corpus either carries a recorded perturbation to the adjacent weaker reading of its predicate, or is recorded as one that does not.",
          verification:
            "The same procedure as the going-forward item, applied to what was already there. THE SCALE IS THE POINT AND IS WHY THIS IS SEPARATE: this suite holds hundreds of arms, and the value of the sweep DECAYS as the going-forward rule ages.",
        },
      ],
      status: "draft",
      notes: [
        "RANKED LAST AND CARRYING ITS OWN CLOSURE CONDITION, WHICH IS THE POINT OF FILING IT RATHER THAN LEAVING IT IMPLIED: IT MAY CLOSE AS A RECORDED DECISION THAT GOING-FORWARD-ONLY SUFFICES. A backlog item that can only be closed by doing it is how a programme becomes unbounded.",
        "NO RISK-RANKED COHORT IS PROMISED HERE, because nothing in the tree specifies one and inventing a ranking at filing time is the shape where a criterion gets satisfied by whichever subset was chosen.",
        "ONE SEED FOR THIS ITEM WITH ITS COLLATERAL ALREADY MEASURED, FILED INTO PBI-70b BECAUSE WHAT ITS CLOSURE CONDITION NEEDS IS THE SWEEP BEING CHEAP ENOUGH TO DECIDE AGAINST. Sprint 57's standing re-run took the PREVIOUS increment's summary-word perturbation -- `scripts/definition-of-done.ts`'s verdict word hardwired to `PASSED` -- through this sprint's own instrument, against `test/definition-of-done.test.ts`. IT REDDENS THREE ARMS AND NOT ONE, and which three is the part a sweep would otherwise pay to rediscover: `the VERDICT WORD is the run's own, in BOTH directions`, which is the arm named for it, plus `a check that never started GATES the run, with every other check green` and `a `run` this runner cannot execute FAITHFULLY is refused, never misread`. THE REASON THE SECOND AND THIRD GO WITH IT is one mechanism and not a coincidence: each asserts the whole string `Definition of Done: FAILED` in its own failing report, so hardwiring the word reddens them for exactly the reason it reddens the first. Recorded with no second name the instrument reads DISARMED and says which reds it cannot account for; with the two measured in, HELD. WHAT THE SPRINT THAT FILED IT RECORDED INSTEAD was `12 pass / 0 fail` -- a size, taken before the arm existed, naming nothing and checkable against no tree -- which is the difference between a perturbation kept and a perturbation written up.",
      ],
    },

    {
      id: "PBI-74",
      story: {
        role: "tsudoi maintainer",
        capability: "trust that a documented example which teaches by FAILING still fails",
        benefit:
          "the one block whose whole lesson is that it does not compile cannot start compiling in silence",
      },
      acceptance_criteria: [
        {
          criterion:
            "A documented block whose didactic content is its own failure is refused the day it stops failing, naming the block and what it was supposed to fail with.",
          verification:
            "The block at README.md's `snippet` marker under the type-shape section is the subject: it annotates an object literal as the framework's document view and omits three members, and the prose beside it says so. Perturb the TYPE rather than the block -- give the omitted members defaults, or widen the annotation -- and require a named red. THE DEGENERATE FIRST: an implementation that only resolves the block's imports must leave that perturbation green, which is the state shipped today.",
        },
      ],
      status: "draft",
      notes: [
        "FILED AS A PRODUCT OWNER'S CONDITION ON ACCEPTING SPRINT 60, WHICH IS WHY IT IS NARROW: the sprint narrowed the snippet account from compiling the block to resolving its import specifiers, and that narrowing is disclosed to the reader in the document. DISCLOSED AND COVERED ARE DIFFERENT STATES and this block is currently neither -- if the view type ever gained defaults making that literal valid, the README would teach a falsehood with every check green.",
        "THE OBVIOUS FIX IS NAMED SO IT IS NOT REDISCOVERED, AND SO IS ITS PRICE. `expect=error` -- a marker declaring the block fails and naming the diagnostic code it must fail with -- was designed and dropped in sprint 60. THE CODE IS NOT DECORATION: this tree's ambient failure is unresolved specifiers, so `it fails as promised` is otherwise satisfied by a checkout where the framework did not build, which is two states behind one red. PBI-60's record carries the instance -- an assertion demanding TS2322 RECEIVED TS2307 BESIDE IT under a staged state -- so a compile-based account here sits directly in front of the unbuilt-artifact residue and is not free.",
        "RANKED LAST BY THE PRODUCT OWNER, ON CONSEQUENCE AND NOT ON AGE, WITH THE TRIGGER THAT MOVES IT. Against a route that publishes declarations graded against a file no consumer receives, this is a README block that would teach a falsehood only IF the view type gained defaults. FILING-ADJACENCY IS NOT A RANKING SIGNAL -- it arrived at rank two purely because it was filed beside the item it came from, and the order IS the priority, so an accident of filing had become a claim about value. FIRING CONDITION THAT RE-RANKS IT UP: the view type gaining an optional member, or the snippet's prose being edited. Written here so a low rank is a decision with a trigger rather than a silence. IT DOES NOT WAIT ON THE AMBIENT FAILURE DISAPPEARING: no item will ever remove it -- the ambient failure IS the source arm answering, and deleting that is foreclosed with measurement -- and a rank derived from a dependency that can never land is how an item becomes unrankable.",
        "SCOPE THIS CANNOT QUIETLY BECOME: a general snippet-compilation harness over every marked block. One block is the subject; the criterion is about a block that teaches by failing, and the other marked snippets teach by working.",
      ],
    },
  ],
  completed: [
    {
      number: 60,
      pbi_id: "PBI-64",
      goal: "A reader of this repository's promise about its own documentation finds it true of every fenced block in every tracked README -- because a block nothing consumes is refused by name, and a block that is read rather than run says which part of itself the reading can fail on.",
      status: "done",
      subtasks: [
        {
          test: "None -- structural. Pinned by the existing arms in test/readme.test.ts staying green (the marker-deleted probes, the count throws, the moved-marker throw) and by the whole Definition of Done. Born-green, no behaviour claim.",
          implementation:
            "ONE FENCE READER, and the markers select from it. `fencedBlocks(markdown)` in test/helpers/readme.ts returns each block's OPENING-FENCE OFFSET, info string, body and line; `markedBlocks(markdown, marker)` is the blocks whose opening fence the marker immediately precedes -- the adjacency the three current regexes already require, kept rather than loosened. The three extractors are rebuilt on it; their count guards and QUICKSTART_STEPS are untouched.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "599407e",
              message:
                "refactor(readme): one fence reader, so `reached` and `extracted` cannot drift",
              phase: "refactoring",
            },
          ],
          notes: [
            "IT IS FIRST BECAUSE IT IS WHAT SATISFIES `NO SECOND PARSER`, not because it is tidy. The guard joins `the document's blocks` to `the blocks something consumes` on the opening-fence offset, so after this there is ONE matcher and the guard's notion of reached cannot drift from the extraction's. A second expression standing beside the call is not the call, applied to matching.",
            "THE READER READS FENCES AND INFO STRINGS, NEVER BODIES. Three-or-more backticks OR TILDES at up to three spaces of indent, closing on the same character at at least the same run length -- tildes included because a reader that misses `~~~sh` fails toward PERMITTING, the one direction this item cannot accept. WHAT IT CANNOT SEE, named rather than fixed: a four-space indented code block, which has no fence and no info string. Deciding `is this text a command` by reading the body is a matcher for a defect that is a property of matching, and this repository refuses that shape by name.",
            "THE SECOND MATCHER WAS ALREADY IN THE FILE AND THE FIRST DRAFT OF THIS SUBTASK SHIPPED WITH IT, WHICH IS THIS RECORD'S OWN SAME-SPRINT SUBCASE CAUGHT BEFORE THE COMMIT RATHER THAN AFTER: `visibleProse` cut blocks with its own three-backtick expression while `fencedBlocks`'s docstring, twenty lines below, said it was the only matcher in the file. It is not a tidiness point -- three backticks see nothing tilde-fenced, so a directory named ONLY inside a `~~~` block satisfied `the prose a reader sees names it` in BOTH extractors that ask, which is the permitting direction this item refuses. Repaired in the same commit by cutting on the block's own offsets, which is why `FencedBlock` carries an `end`.",
          ],
        },
        {
          test: "test/readme-coverage.test.ts. Every arm stages a throwaway with stageCheckout() -- ThrowawayPath-branded, tracked files, borrowed node_modules -- plus `git init -q` and an add, plants INTO THE STAGE, and calls the guard with that root. NOTHING HERE EVER EDITS A TRACKED README: a test mutating a version-controlled file in order to fire is this record's own measured failure, and readReadme()'s hardcoded path is exactly how this sprint would fall into it.",
          implementation:
            "THE DEGENERATE FIRST, READ BEFORE ANY ARM IS BELIEVED. Ship the guard returning the empty list and take the reading: the planted arms must redden and the unplanted ones stay green, recorded with the numbers rather than argued. AND THE SECOND DEGENERATE, because no arm above catches over-refusal: refuse-everything must redden the unplanted-tree arm.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "THE TWO DEGENERATE READINGS, TAKEN BEFORE ANY ARM WAS BELIEVED AND RECORDED AS NUMBERS RATHER THAN ARGUED. (1a) THE SWEEP REPORTS NOTHING, counts real -- 3 pass / 5 fail over 8 arms. RED: both planted-block arms, the unpaired-document arm, the well-formed-marker arm, and the untracked/tracked pair. GREEN: the unplanted-tree arm, the not-a-checkout arm, AND `every fenced block in every tracked README of this checkout is reached or accounted for` -- which is the arm the shipped sweep is red on, so the degenerate bought its green by reporting nothing. (1b) THE SWEEP ALSO OPENS NOTHING -- documentsRead and blocksRead zeroed as well -- 0 pass / 8 fail: the presence pairs fire, which is what they are for and what 1a alone cannot show. (2) THE SWEEP REFUSES EVERY BLOCK -- 5 pass / 3 fail, and the four planted arms are GREEN under it. What catches it is the unplanted-tree arm, exactly as the plan required, and with it the untracked half of the tracked/untracked pair.",
            "THE UNPLANTED-TREE ARM SHIPS WITH ITS PRESENCE PAIR -- documents read above zero AND blocks read above zero. An empty offender list and a reader that opened nothing are the same observation without it.",
            "THIS SPRINT'S EVIDENCE IS NOT ONE PLANTED WITNESS. The criterion asked for a staged plant BECAUSE it assumed every block in this tree today is reached or declared, and that premise was MEASURED FALSE while planning: five blocks have zero consumers, so the shipped guard is red at five real sites on this repository before anything is staged.",
          ],
        },
        {
          test: "A throwaway gains packages/tsudoi-nowhere/README.md and is refused NAMING THAT PATH with no enumeration edited. Three pairs: the same file left UNTRACKED is not swept; the enumeration run against a directory that is not a checkout THROWS rather than returning empty; and -- the arm that matters -- a new README carrying a KNOWN, WELL-FORMED MARKER that no test opens is REFUSED, not cleared.",
          implementation:
            "`trackedReadmes(root)` -- `git ls-files -z` filtered to basename README.md, inheriting checkoutPaths's two rules verbatim: a failed enumeration is not an empty one, and NUL separators, because git quotes odd paths and a quoted path matches no file.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "THE ADJACENT WEAKER READING IS RECORDED BESIDE THE ARM AND NOT AS A REGISTRY ROW, AND THE REFUSAL IS STRUCTURAL RATHER THAN A CHOICE: `reRun` refuses any arm file that imports helpers/perturbation.ts, and every arm over this sweep must import it -- they stage. So the readdirSync weakening is carried where the dashboard header already permits it, as the untracked-file arm's own two assertions: `trackedReadmes` does NOT hold the planted file before `git add`, and DOES the moment after, in one arm over one tree. That pair is also the absence/presence pair the item owes.",
            "NOT declaredMembers AND NOT handlerMembers. The criterion says TRACKED README; those two answer `which packages`, and a README under examples/ or docs/ is neither. Joining them would give the guard the same blind spot the documents have, which is the guard over `the documents that exist today` the criterion refuses in its own words.",
            "THE MARKER ARM IS THE ONE THAT ENFORCES `THE GUARD MAY NOT BE ITS OWN CALLER`. A guard that ran the extractors over each tracked README and cleared whatever matched would certify a document nobody opens -- the author's-intention failure with the marker swapped for the guard's own run. THE ADJACENT WEAKER READING, in the perturbation registry: a readdirSync walk for README.md, whose required red is the untracked-file arm.",
          ],
        },
        {
          test: "Arms built FROM the table, so the guard consumes a pairing that exists for the arms rather than performing one. A tracked README in no pairing is refused, naming the document, before a single block is looked at.",
          implementation:
            "`consumers` in test/helpers/readme.ts: the document set expressed as the enumerations the tests already use (the checkout's own README; handlerMembers), the marker, and the form -- `executed` (the block's bytes are run) or `read` with a `subject` projection and its reason.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "THE ARMS ARE BUILT FROM THE TABLE BY `readAccounts`, WHICH IS ALSO WHAT SPLIT THEM ACROSS TWO FILES -- and the split is read out of a field on the row rather than out of a list. Each `read` row declares what its assertion NEEDS besides the document; test/readme-layout.test.ts takes the rows needing nothing else and test/readme-accounts.test.ts the rest. It is not tidiness: a perturbation stage carries no build outputs and its directory NAME is not this repository's, so the install row (which compares against basename(repoRoot)) and the snippet row (which resolves through dist/) are legitimately red there, and a registry row over their arms would fail at the baseline instead of at its weakening. MEASURED: every arm in test/readme-layout.test.ts passes in that stage.",
            "WHY AN ACCOUNT IS A CONSUMPTION AND NEVER A DECLARATION, decided on a measurement rather than on principle. `declared and read` is already not `checked`, and this tree has the instance: the install block's three consumers are a negative match that survives any corruption, a contains of the tarball name, and a split taking the LAST TOKEN. So the path is checked and THE VERB IS NOT -- `bun frobnicate ../<checkout>/x.tgz` satisfies all three and leaves every check green. A rule admitting `it is read` wholesale would certify that; a rule demanding `corrupting any byte reddens something` would refuse the very block the item forbids refusing.",
            "A HUMAN WRITES THE MARKER AND MUST -- every extractor here is marker-keyed and the marker is what routes a block to its consumer. A HUMAN NEVER WRITES THE ACCOUNT. A marker cannot make a block accounted for, because the guard does not read markers to decide.",
            "REFUSED, EACH WITH ITS REASON: an allow-list of documents, blocks, lines or hashes, which is the approximate detector whose failure mode is a green certifying a class as watched, and which as a hash list is the rubber stamp with one extra step; an exemption written in the document whose only consumer is the guard; and a sixth Definition-of-Done check, since the guard belongs where the extraction already lives.",
            "THE RESIDUE, NAMED AT THE TABLE AND NOT GIVEN A DETECTOR: nothing notices a pairing entry whose consuming arm was deleted -- the table would go on claiming a consumer. A check deciding whether an arm REALLY consumes is the shape refused above.",
            "AND THE MITIGATION THIS NOTE SHIPPED WITH WAS FALSE, FOUND AT REVIEW AND REPAIRED IN THE TREE RATHER THAN ONLY HERE: it said `what keeps the claim honest even so is the mutation arm below`, and the mutation arms are DELETED BY THE SAME EDIT as two of the rows they stand over. MEASURED by emptying each consuming file to a placeholder that still registers something, against 934 pass / 0 fail across 65 files: test/readme.test.ts (both `executed` rows) reads 837 pass / 0 fail and test/readme-accounts.test.ts (the snippet and install rows, and their mutation arms) 916 pass / 0 fail -- FOUR OF THE FIVE ROWS, uncaught. The fifth reads 929 pass / 2 fail and is caught INCIDENTALLY: both reds are perturbation records naming its arms by exact `test()` string, and `armReadAccounts` names an arm by ORDINAL, so a marked block added ahead of that one turns the catch into a REFUSED. The size now sits at the table and in the skill; no detector was added, for the reason above.",
          ],
        },
        {
          test: "THE MUTATION ARM, which is where the teeth are: corrupt the block INSIDE its subject and the consuming predicate must go false; corrupt it OUTSIDE and it must stay true. The account's boundary asserted rather than assumed -- and the unverified verb written down at last.",
          implementation:
            "The subject is never inspected as prose. It is the projection the consuming assertion is HANDED, and the assertion receives ONLY its output, so it cannot fail on anything the account does not name -- by construction rather than by inspection. For the install block that projection is test/readme.test.ts's own last-token expression MOVED INTO THE HELPER so that there is one of it. The guard additionally requires the projection to return a non-empty string the block's own bytes include, so a projection cannot be a constant.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "EVERY MEMBER OF THE PROJECTION, ONE AT A TIME, AND NOT THE FIRST -- which is what forced the layout row's subject to exclude the drawing's ROOT line. A subject carrying one load-bearing member and four decorative ones satisfies a reading that corrupts whichever comes first, and `parent/` is decorative by construction: no marker names it and its spelling changes no path below it. It is outside the subject, which is what the OUTSIDE-corruption arm then probes.",
            "WHAT THE INSIDE ARM DOES NOT SAY, FOUND AT REVIEW AND RECORDED AT THE ARM RATHER THAN REPAIRED: IT IS SATISFIED BY A PROJECTION THAT IS A CONSTANT. `block.body.replace(part, ...)` is a no-op when `part` is not in the body, so a constant subject leaves `holds` false over the UNTOUCHED block, and false is what the arm asks for. MEASURED with the layout row's subject replaced by a constant the block does not contain: 925 pass / 9 fail, and THE INSIDE ARM IS GREEN in that run. What caught it instead is named beside it -- the sweep's own fourth refusal firing four times, the OUTSIDE arm, the `holds` arm, and the registry's three -- so `the account's boundary asserted rather than assumed` holds for the increment and not for that arm alone.",
            "IT NEEDS THE LAST-TOKEN PREDICATE LIFTED OUT of the expensive pack test into a pure function both the arm and the guard call -- a structural step inside this subtask, taken for the same reason as the fence reader: two spellings of one premise is what the join exists to kill.",
          ],
        },
        {
          test: "The guard is written first and is RED ON THIS TREE at five sites; each consumer greens named blocks. That ordering IS the increment and not a follow-up.",
          implementation:
            "THE INFO STRING DECIDES NOTHING -- every fenced block in a paired document is reached or accounted, the tag recorded for the refusal message alone. Two new consumers pay for it: a SNIPPET consumer compiling every marked `ts` block against the installed framework, and a LAYOUT consumer holding the drawn tree against the directories the quickstart markers name.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "THE FIVE SITES CONFIRMED BY RUNNING THE SHIPPED SWEEP AND NOT BY THE PLANNING GREP, and they are the five the grep named, each with its line: README.md:95 (a ```text drawing), README.md:267 and README.md:275 (both ```ts), packages/tsudoi-completion-path/README.md:15 and packages/tsudoi-hover-wordnet/README.md:11. The reading beside them is documentsRead=3, blocksRead=14, offenders=5. Each of the five is greened by the consumer it was written for: the layout row takes the first, the ts-snippet row the other four.",
            "BOTH NEW CONSUMERS SHIP AT THE NARROWEST WIDTH THAT IS STILL A CONSUMPTION, AND THE `expect=error` MECHANISM IS DROPPED FROM THIS SPRINT -- the product owner's own pressure valve, opened up front rather than after the sprint ran long, and it is the WIDTH OF AN ASSERTION and never an exemption: no tag skips, the info string still decides nothing, and every fenced block in a paired document is still reached or accounted for. LAYOUT: subject is the drawn directory lines, assertion is that every directory a quickstart marker names is drawn -- ONE DIRECTION IN `holds`, and see the note below for what the mutation arm enforces on top of it. SNIPPET: subject is the import specifiers, assertion is that each resolves; THE BLOCKS ARE NOT COMPILED. WHY, and it is not speed: a consumer whose green depends on `fails with code X and not TS2307` reddens for environmental reasons in this tree, and PBI-60 already records the instance -- an arm asserting not.toContain(TS2307) RECEIVED TS2307 beside the TS2322 it wanted. A compilation harness with expect=error semantics is its own item.",
            "WHAT THE NARROWED SUBJECTS THEREFORE CANNOT SEE, NAMED RATHER THAN HIDDEN, because this is the account rule working as designed: a ```ts block whose imports all resolve and whose BODY is wrong is accounted for and unchecked. AND A SECOND ONE, which is where a later reader will reach for an exemption: a marked ```ts block carrying NO import at all cannot be accounted for by the snippet row -- its projection would be empty and the sweep refuses that. The move is to give the snippet the import it was already implying, which is what README.md's mock block got: it now names the type it fails to satisfy, which the prose beside it (`an object literal carrying the four obvious members satisfies nothing`) had left unstated.",
            "WHY THE EXEMPT TAG LIST DIED, AND THE PRODUCT OWNER OVERTURNED THEIR OWN SETTLEMENT TO SAY IT. `command block` names a class NOTHING IN THIS TREE CAN COMPUTE: the info string is refuted by the quickstart's `write=tsudoi.config.ts` step, which is a ```ts block and IS reached, and a matcher over block content is a matcher for a defect that is a property of matching. An exempt list makes the defect reintroducible by typing three characters -- green, witness red, defect reachable, which is the one outcome refused with every check green. The widening SATISFIES the criterion by refusing a superset; no acceptance criterion is loosened.",
            "MEASURED WHILE PLANNING, and it is what sets this sprint's size: grep finds NO consumer of the root layout block, of either root `ts` block, or of each member's `ts` config -- and it could not be otherwise, because visibleProse strips fenced blocks before any ReadmeFact sees them, so no prose assertion can reach a block's bytes.",
            "IF `expect=error` EVER SHIPS, A BLOCK DECLARED TO FAIL NAMES ITS DIAGNOSTIC CODE, and must fail with THAT code and not with TS2307. This tree's ambient failure is unresolved specifiers -- another item's whole subject -- so without the code, `the broken mock fails as promised` is satisfied by a checkout where the framework did not build: two states, one red. The code is the subject clause; `must fail` alone is a stamp. THE MECHANISM DID NOT SHIP -- this stands as the foreclosure record for the design that was dropped, so the next executor reaching for it meets the condition rather than rediscovering it.",
            "THE LAYOUT CONSUMER IS NOT A SECOND MECHANISM. test/helpers/readme.ts twice requires a directory to be stated twice and be the same string; this is that idiom a third time, over the drawing instead of the sentence, and it catches a README picturing one layout while staging another -- which nothing today would see.",
            "THE PRESSURE VALVE WAS OPENED, AND UP FRONT RATHER THAN AFTER THE SPRINT RAN LONG -- so this is what happened and not what might. The layout consumer ships with `holds` NARROWED to one direction: every marker directory appears in the drawn tree. It is the width of an assertion and never an exemption. A tag may not start skipping. Vetoes get traded under schedule pressure, so the trade is priced in advance.",
            "AND `THE CONVERSE IS DROPPED` WAS FALSE OF THE SHIPPED INCREMENT, WHICH IS THIS RECORD'S OWN SUBJECT-ERROR CLASS ABOUT AN INCREMENT RATHER THAN A NUMBER: the narrowing is real of `holds` and of nothing else, because `armReadAccounts` requires EVERY member of a projection to be load-bearing. So the layout DOES enforce the converse over its subject -- every INDENTED `foo/` line must be a directory a quickstart marker names or a proper ANCESTOR of one -- and the un-indented root line is the single exception, made one by the subject regex demanding leading whitespace and not by any decision about drawings. MEASURED with two decorative indented lines added to the drawing: 25 pass / 3 fail over test/readme-layout.test.ts and test/perturbations.test.ts -- the INSIDE arm, the registry row over it reading DISARMED, and their shared baseline. The repair is at the row, where the next drawing gets edited.",
            "THE RULING SHIPPED ARMED AT ONE TAG, WHICH IS THIS ITEM'S OWN DEFECT CLASS PRODUCED BY ITS OWN FIX. `THE INFO STRING DECIDES NOTHING` was written in the table's docstring, in this record and in the skill, and both planted arms planted ```sh -- while `text` and `ts` are the tags of the five real blocks the sweep was written against. MEASURED at review, with `if (block.info === \"text\" || block.info === \"ts\") { continue; }` in the sweep's UNREACHED branch alone: 934 pass / 0 fail across 65 files and every check exit 0, the unweakened reading. With the plant driven from `fenceForms` -- sh, ts, text, a tilde fence and no info string at all, each entry carrying why it is there -- the same weakening reads 932 pass / 2 fail, the two planted arms alone. NO REGISTRY ROW CAN CARRY IT: `reRun` refuses any arm file importing helpers/perturbation.ts, and every arm over this sweep stages, so the weakening is recorded beside the arms as the untracked-file arm's already is.",
          ],
        },
        {
          test: "None new -- the subject of each sentence is the guard this sprint ships. Byte-identity at the base recorded before the first edit; offered as READINGS, not as MEASURED.",
          implementation:
            "The four sentences this increment makes false, repaired IN THE COMMIT THAT SHIPS THE GUARD: the skill's `nothing sweeps for what it missed`; README.md's `every block in this file is extracted and executed`, which the widening falsifies in a NEW way by giving the document blocks that are read but not run; test/readme.test.ts's MEASURED coverage claim, DERIVED FROM THE TABLE or deleted; and CLAUDE.md, local only.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "57529b6",
              message:
                "feat(readme): refuse a fenced block nothing consumes, over READMEs as a class",
              phase: "green",
            },
          ],
          notes: [
            "BYTE-IDENTITY AT THE BASE, RECORDED BEFORE THE FIRST EDIT AND OFFERED AS A READING RATHER THAN AS MEASURED. Base 0f0382d, blob hashes: README.md e68aef3, .claude/skills/writing-a-comment/SKILL.md 6e7f3ab, test/readme.test.ts 091790c, test/helpers/readme.ts c8c2d13, packages/tsudoi-completion-path/README.md 7d2aab8, packages/tsudoi-hover-wordnet/README.md 2a0b20a. CLAUDE.md is UNTRACKED in this repository -- globally gitignored -- so no such reading exists for it and its repair is local only. None of these is filed as pre-existing-and-therefore-not-ours: every one is inside this sprint's own subject, which the dashboard header says is repaired here even when it predates.",
            "THE ROOT DOCUMENT NOW OWES THE EXCEPTION SHAPE THE MEMBERS ALREADY DID, and the fact entry gained `never run` as a fourth token to hold it there. The two constraints below both held: `extracted from this README`, `executed` and the member-README path pattern still meet in ONE section, and each member's `executed` AND `never run` are untouched.",
            "TWO CONSTRAINTS THAT REDDEN MID-SPRINT IF THE REWRITE IGNORES THEM: one arm requires `extracted from this README`, `executed` and a member-README path pattern together in one section; and each member's facts require `executed` AND `never run` together, its comment naming the second load-bearing because `these are executed` is the sentence that was false once already. Under the widening the ROOT document now owes that same exception shape.",
            "THE CHEAP FORM FOR THE MEASURED COMMENT IS NAMED SO IT IS NOT RE-LITIGATED: delete the enumeration, keep the asymmetry sentence, point it at the table. Restating it in new words rebuilds the second spelling the file objects to a few hundred lines below.",
            "WHY IT IS ONE COMMIT WITH THE GUARD: when fix A's comment describes the state fix B creates, A and B are one commit. Shipping the sweep while the skill still says nothing sweeps would be this item's own class, produced by its fix.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE PRODUCT OWNER NARROWED BOTH NEW CONSUMERS BEFORE EITHER WAS BUILT, AND OPENED THEIR OWN PRESSURE VALVE UP FRONT RATHER THAN AFTER THE SPRINT RAN LONG. The valve is the WIDTH OF AN ASSERTION and never an exemption, and under the narrowing no tag skips: the layout account's `holds` keeps one direction (the converse it says it drops is enforced anyway, by the mutation arm rather than by the row -- see the subtask note), the snippet account checks that each import specifier RESOLVES and does not compile the block, and `expect=error` semantics are out of this sprint entirely. The deciding evidence is in this dashboard: PBI-60 records an arm asserting `not.toContain(TS2307)` RECEIVING TS2307 beside the TS2322 it wanted, so a green that depends on `fails with code X and not TS2307` reddens for environmental reasons in this tree.",
        "THE PRODUCT OWNER SETTLED THE SUBJECT ON THE CRITERION'S OWN WORD -- `command block` -- AND THEN OVERTURNED THEMSELVES WHEN THE DEVELOPER SHOWED IT COLLIDED WITH TWO OF THEIR OWN RULINGS. Recorded because the reversal is the decision: a tag-exempt list cannot coexist with an arm requiring a ```text command block to be refused, and the exemption is what their own veto forbids. The widening is what is left once the word is read honestly.",
        "THE DEVELOPER'S FIRST DESIGN -- an account as reader-visible prose adjacent to the block -- WAS REFUSED AND THE DEVELOPER AGREED AFTER VERIFYING THE DECIDING FACT BY READING RATHER THAN RECOLLECTION. Kept here because the refused shape is the one a later executor will re-propose: it is satisfied by an author's intention, which is the defect the item names.",
        "WHAT SURVIVED FROM BOTH PLANS INDEPENDENTLY, which is why it is not argued below: the class is tracked READMEs read from git and not the member enumerations. Two routes reached it for the same reason.",
      ],
    },
    {
      number: 59,
      pbi_id: "PBI-67",
      goal: "A user highlighting a directory waits no longer for its detail than under the shape this package replaced -- on whichever runtime their editor runs -- or the wait they now pay is written down with its number and the runtime that bears it.",
      status: "done",
      subtasks: [
        {
          test: "None -- a READING, with a TRACKED instrument, predictions and their counterfactuals written down before the run.",
          implementation:
            "Both shapes on both runtimes at a calibration size, the ordinary size and one tail size; INTERLEAVED IN ONE PROCESS so machine drift hits both; median, min and spread over a stated repetition count; versions read off the binaries; load reported per reading; warm-up stated; and THE ENTRY MIX STATED -- how many hidden entries, what the names look like, and in what arrival order.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "426a58c",
              message:
                "feat(scripts): read the listing's shape with a null cell, so the noise is measured",
              phase: "green",
            },
            {
              hash: "a56666e",
              message:
                "test(scripts): give the open-and-stat cell a guard, since it asserted nothing",
              phase: "green",
            },
            {
              hash: "e1ada09",
              message:
                "test(instrument): pin the timing instrument's copy of the gate to the shipped one",
              phase: "green",
            },
          ],
          notes: [
            "TAKEN, AND THE INSTRUMENT IS scripts/listing-shapes.ts. Commands as run, unpiped, one after the other with nothing else running on the machine: `bun run scripts/listing-shapes.ts` exit 0 and `deno run -A scripts/listing-shapes.ts` exit 0. bun 1.3.13 and deno 2.8.3, both READ OFF THE RUNNING BINARY by the instrument rather than off a note; darwin arm64, macOS 26.5.1, APFS, one volume; warm -- the process writes the fixture and discards one whole round per cell; 15 rounds at 200 and 5000, 7 at 100000; load average 1.29/1.27/1.39 through the bun run and 1.67/1.35/1.42 through the deno run, reported per cell by the instrument itself. ENTRY MIX: names of twelve characters, `NNNNNN-entry`, one in 37 carrying a leading dot, written in a seeded shuffle.",
            "THE ORDINARY SIZE, 5000 ENTRIES, MEDIAN (MIN-MAX) IN MS. bun -- streaming 2.080 (2.042-2.205), the same shape under a second label 2.106 (2.029-2.256), readdir+sort 2.528 (2.489-2.754), readdir+retain 1.476 (1.444-1.622). deno -- streaming 9.619 (9.506-10.957), second label 9.586 (9.421-10.001), readdir+sort 6.374 (6.244-7.642), readdir+retain 5.511 (5.424-5.759). PAIRED PER ROUND AGAINST STREAMING, which is how drift is kept out of the difference: bun null +0.030 (-0.031..+0.159), readdir+sort +0.460 (+0.356..+0.659), readdir+retain -0.601 (-0.732..-0.475); deno null -0.069 (-1.392..+0.227), readdir+sort -3.261 (-4.532..-2.266), readdir+retain -4.157 (-5.421..-3.859).",
            "THE CALIBRATION CELL IS THE SAME SHAPE UNDER TWO LABELS, rotating with the others, so its paired difference has a TRUE VALUE OF ZERO and its spread is the instrument's own noise. At 200 and 5000 that noise is a tenth of a millisecond on bun and under 1.4 ms on deno; AT THE TAIL IT IS WIDE -- deno's null reads -4.456 (-14.636..+0.178) at 100000 -- so the tail rows separate only because their deltas are four to six times that, and no ruling here rests on the tail.",
            "THE OTHER TWO SIZES. 200, paired: bun null +0.001 (-0.036..+0.016), readdir+sort -0.021 (-0.054..+0.100), readdir+retain -0.031 (-0.071..+0.008) -- INSIDE the noise on bun, so at that size this instrument does not separate the shapes there; deno null -0.002 (-0.057..+0.030), readdir+sort -0.195 (-0.300..-0.112), readdir+retain -0.200 (-0.277..-0.162) -- OUTSIDE it, so deno tells them apart at two hundred entries. 100000, medians: bun streaming 42.616, readdir+sort 61.302, readdir+retain 30.215; deno streaming 204.036, readdir+sort 138.507, readdir+retain 115.213.",
            "THE OPEN ALONE AGAINST THE STAT ALONE, 5000 entries, same session, 15 rounds: bun open 0.001 (0.001-0.003) and stat 0.011 (0.010-0.016); deno open 2.402 (2.387-2.612) and stat 0.032 (0.023-0.124). THE MODULE'S 37 ms FOR DENO'S OPEN ALONE IS FALSIFIED BY ITS OWN NEIGHBOUR AND BY THIS CELL: a whole open-plus-drain-plus-retain at that size is 9.619 ms. THE MECHANISM SURVIVES UNTOUCHED -- deno's open costs a thousand times bun's and dominates its own stat, where on bun the stat dominates the open -- and only the numbers move.",
            "THE ARRIVAL ORDER IS READ RATHER THAN INFERRED, AND THAT READING CONTRADICTED THE PLAN. On this filesystem the enumeration follows neither the creation order nor the names: two directories holding the SAME names, one written ascending and one shuffled, enumerate IDENTICALLY. So a second creation order buys a second cell and NOT a second arrival order, and the instrument was cut to one creation order with the probe kept as the evidence for saying so. `arrivalIsRenderOrder` is false in every cell, which is what keeps a gate weakened to `keep the first twenty` from answering correctly on these fixtures. THE ARRIVAL ORDER THAT CAN BE CHOSEN IS THE PARAMETER `listingFrom` ALREADY TAKES, which is where the arm drives it.",
            "PREDICTIONS AND COUNTERFACTUALS WERE WRITTEN BEFORE THE RUN, AND NOTHING IN THIS REPOSITORY PREDATES THE RUN TO SHOW IT -- said first, because it is the one claim here a reader cannot check. The list lands in this dashboard in the SAME COMMIT as the results, and the only file this sprint added is the instrument, so what follows is the executor's word in the one place this project's own skill says the writing is what catches a poisoned measurement. THE REMEDY IS CHEAP AND WAS NOT TAKEN: commit the predictions before running anything, so the timestamps carry what the sentence asserts. Claimed and unverifiable is what it is; recorded as such rather than dropped or dressed. WHAT WAS CLAIMED, AND THE ACCOUNTING IS REPAIRED RATHER THAN RENUMBERED: `all eight held` stood here and was false of one, which is recorded as UNMET beside its own entry rather than dropped from the list or counted away. HELD: the null narrower than the shape deltas at the ordinary size; deno outside the null there; on bun readdir+sort SLOWER and readdir+retain FASTER than streaming at 5000; deno's open alone between 1 and 5 ms; no cell arriving in render order; the tail's ordering; and the Definition of Done unmoved by the instrument. UNMET AS STATED: `the ranking on bun FLIPPING WITH SIZE (readdir+sort faster at 200, slower at 5000 and at the tail)`. At two hundred on bun that row is -0.021 INSIDE a null of +0.001 (-0.036..+0.016), which two other notes in this same record already say, so the flip is a median SIGN read across the instrument's own null -- the superlative class, in the one claim here a reader cannot check. WHAT THE READING DOES ESTABLISH, CARRYING THE SAME LOAD WITHOUT A FLIP: bun does not separate the shapes at two hundred and prefers streaming at five thousand and at the tail, while deno prefers the array at EVERY size -- so THE RUNTIMES DISAGREE WITH EACH OTHER, which is why one number per runtime could never have settled this. The clause the flip was offered for stands on a disagreement the rows show instead of on a sign inside a null. NOTHING WAS FITTED AFTERWARDS -- the one thing the run contradicted is the plan's two arrival orders, above, and it is recorded as a contradiction rather than dropped.",
            "WHAT THIS INSTRUMENT CANNOT SEPARATE, and it is the fourth term a MEASURED label owes: one machine, one volume, a warm cache and empty files. It cannot tell a runtime's cost from this filesystem's, and it says nothing about a cold cache, a network mount or non-empty entries. It also carries a COPY of the package's gate and comparator, AND THE COPY IS WHY EVERY SHAPE'S OWN GUARD IS CIRCULAR: each shape is validated against a rendering the COPY computed, so the guard binds the three shapes to one answer and never to the package's. MEASURED, with the hidden-group branch dropped from the copy alone: exit 0, 9874 bytes of complete publishable reading, rendered names DOTFILES FIRST -- the inverse of what the package renders -- and the shape rows moved too, arraySort +0.142 at five thousand where the tracked copy reads +0.444. The instrument's docstring conceded this and a concession is not a control; the copy is PINNED TEXTUALLY now, in test/instrument-copy.test.ts, which reddens on exactly that weakening in a staged checkout and was green before it. The stated foreclosure only ever covered an IMPORT, and this tree pins copied content textually without importing it.",
            "THE INSTRUMENT IS TRACKED, and that is the honest middle between a benchmark inside the suite -- REFUSED BY NAME, because a wall-clock number a busy machine can trip is another item's whole subject and this sprint may not open it -- and prose, which this dashboard says is not a record. A reading taken by hand once and written up is this record's named failure mode.",
            "WHAT IS REFUSED: any reading taken while the machine is doing anything else; SEQUENTIAL A-then-B, which confounds drift with the shape; one number per cell or a mean with no spread; an unstated cache state; new numbers for one runtime and carried-forward numbers for the other; a ruling from the tail alone, since the module's own premise is that a few thousand entries is ORDINARY and the tail is where the shapes differ most and the user is least; and A READING WITH NO CALIBRATION CELL -- if the new instrument separates the shapes where the old one could not, it is measuring itself.",
            "AND THE ARRIVAL ORDER IS PART OF THE SUBJECT, not a detail: the sort's cost is DOMINATED by it -- sorted arrival is nearly free and shuffled is many times that -- so a directory of identical short names in creation order is not the ordinary one and flatters one shape.",
          ],
        },
        {
          test: "None -- a repair, with byte-identity at the base recorded.",
          implementation:
            "Settle the ordinary-size number for the faster runtime, which the module states in two places that contradict each other: a parenthesis whose two numbers, read with the sentence they qualify, say the streaming shape is SLOWER there, and a sentence nine lines below saying that runtime gains on both counts.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "a025889",
              message:
                "docs(resolve): settle which half of the bun contradiction was true, by re-taking it",
              phase: "green",
            },
          ],
          notes: [
            "BYTE-IDENTITY AT THE BASE, RECORDED BEFORE THE FIRST EDIT: at 82164c5 the module is blob 7dad06faffd9c8075f6e3e7df2462ca0f3ac24cc, sha256 f116795b014fc2e44220a94cf2753f175d808150416f83ff3cccf933b7baf3e9, 34409 bytes.",
            "SETTLED, AND IT IS THE PARENTHESIS THAT GOES. `bun: about 24 ms against about 18 ms` reads STREAMING SLOWER at the ordinary size; re-taken at this base it is 2.080 ms against 2.528 ms, so streaming is FASTER there by 0.460 ms paired (0.356-0.659, noise 0.030) and the sentence nine lines below is the half that survives. Deno's half of the same parenthesis was re-taken in the same session rather than carried forward -- 9.619 against 6.374 -- because one runtime re-measured beside another inherited is how that pair came to disagree.",
            "AND THE CLAUSE BESIDE IT WAS HALF WRONG RATHER THAN WRONG: `at two hundred entries neither runtime tells the two apart` is true of BUN, where the difference is inside the instrument's noise, and false of deno, where 0.195 ms sits well outside a noise of 0.002. Narrowed to the runtime it holds for rather than deleted.",
            "A RED THE REPAIR EARNED, AND IT IS RECORDED BECAUSE IT IS A RULE NOBODY HAD MET IN THIS MODULE BEFORE: the first version of this comment cited the instrument BY ITS DIRECTORY-QUALIFIED PATH, and test/packed-members.test.ts reddened -- 893 pass / 1 fail -- naming `dist/resolve.js names scripts/listing-shapes.ts`. A shipped module may not name a repository file its reader does not have. The instrument is named by its bare filename now, with the disclosure that a consumer holding the installed artifact cannot re-run it.",
            "IF THE PARENTHESIS IS READ AGAINST ITS OWN SENTENCE, THE CRITERION FAILS ON BOTH RUNTIMES RATHER THAN ONE -- and that is a subject error of the known class living in the paragraph this sprint exists to re-decide. It PREDATES and is repaired here rather than filed, because the filing bar repairs what is inside the sprint's own subject. NO NUMBER FROM THAT PARAGRAPH MAY BE CITED AGAIN until the reading settles which of the two it was.",
            "AND THE PLANNING READING ALREADY CONTRADICTS THE PARAGRAPH THREE WAYS, at the same nominal sizes and the same two runtime versions it cites: every magnitude in it is many times larger than this machine reads; one number is falsified by its own neighbour, since a whole open-plus-drain measures less than the figure the paragraph gives for the OPEN ALONE; and THE TWO RUNTIMES RANK THE SHAPES DIFFERENTLY -- bun does not separate them at two hundred and prefers streaming at five thousand, where deno prefers the array at every size -- which is why one number per runtime could never have settled this. WHAT STOOD HERE WAS `the ranking on the faster runtime FLIPS WITH SIZE`, and that flip is a median sign read across this instrument's own null cell; narrowed at acceptance, with the unmet entry recorded in the predictions note above.",
          ],
        },
        {
          test: "The listing driven with an arrival order that is NOT the render order, over a sequence with hidden entries and more entries than the bound, asserting the rendered names AND the total -- plus the degenerates, run before the arms are believed.",
          implementation:
            "ONE BRANCH, the rule fixed in advance. If the ordinary-size delta on both runtimes is inside the instrument's own noise -- which the calibration cell establishes -- the shape STAYS and the item closes on a recorded ruling. If either runtime pays outside noise, the decision is taken against the WORKING-SET reading and one shape is taken, never two.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "3442cec",
              message:
                "test(resolve): drive the grouping at the gate, where a directory cannot stage it",
              phase: "green",
            },
            {
              hash: "fc4b37f",
              message:
                "test(perturbations): let the suite re-run this sprint's perturbation, not a scratchpad",
              phase: "refactoring",
            },
            {
              hash: "aa6bce0",
              message: "test(resolve): close the empty list both gate arms were satisfied by",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE BRANCH THE RULE SELECTED IS THE SECOND ONE, AND THIS RECORD MAY NOT READ AS THE FIRST. At the ordinary size the delta is OUTSIDE the instrument's own noise on BOTH runtimes -- deno -3.261 ms against a null of -0.069 (-1.392..+0.227), bun +0.460 against a null of +0.030 (-0.031..+0.159) -- so nothing here closes on `the shapes are indistinguishable`. The decision was taken against the WORKING-SET reading, as the rule fixed in advance requires when either runtime pays outside noise, and ONE shape was taken: the streaming shape STAYS, and deno pays 3.261 ms per highlight at five thousand entries for it.",
            "THE INVERSION WAS READ AND IT HOLDS IN THE HALF THAT DECIDES, WITH THE OTHER HALF NARROWED RATHER THAN ASSERTED. What needs no instrument is the signature: `readdir` hands back N strings and this function would hold them for the whole scan, where the handle shape holds twenty and one dirent. What the INHERITED readings add is that bun's `Dir` materialises the directory on the first read -- 30 MB at the open and 61 MB after one entry at a hundred thousand -- so on bun an array is a SECOND copy of something the process holds anyway, while on deno the open ALLOCATES AND DISCARDS and sixteen unread handles leave `heapUsed` unmoved after a forced collection, so an array there is a retention the process does not have AT THE OPEN. AND `AT THE OPEN` IS THE REPAIR ACCEPTANCE ASKED FOR: this note read `a retention the process does not have today`, which is the whole scan, with the narrowing that follows standing BESIDE the claim instead of inside it -- the same defect, in the same words, as the module sentence C1 names. NARROWED, BECAUSE NEITHER INSTRUMENT SEPARATES IT: what deno's LAZY READ materialises once iteration starts was not measured by that reading and is not measured by this one, so beyond the open it is UNMEASURED rather than answered no. THE HALF THAT DECIDES SURVIVES THE NARROWING -- the runtime paying the time is the runtime where this function's bound is the only one available FOR AS FAR AS THE READING REACHES, and the reading reaches the open.",
            "THE THIRD SHAPE WAS NOT SELECTED, AND THE HEADLINE THAT READ `FASTEST EVERYWHERE` IS NARROWED HERE RATHER THAN LEFT TO CARRY THE REASON. readdir+retain is quicker than the shipped shape at five thousand and at the tail on both runtimes and at two hundred on deno -- bun -0.031 / -0.601 / -12.277, deno -0.200 / -4.157 / -88.167 -- BUT AT TWO HUNDRED ON BUN THAT -0.031 IS INSIDE THIS INSTRUMENT'S OWN NULL, +0.001 (-0.036..+0.016), which is exactly the narrowing the note above applies to the other pair at that size and this note did not apply to itself. NOR IS IT TOLD APART FROM readdir+sort AT TWO HUNDRED ON EITHER RUNTIME: -0.031 against -0.021 on bun and -0.200 against -0.195 on deno, inside null spreads of 0.052 and 0.087. The superlative propagated from here into the module and both are narrowed. The rule for this branch selects against the WORKING SET, not against the clock. It loses there for the reason above, and it would also delete the second cancellation seam. NO ARM WAS DELETED AND NO ROUTING WAS TRIGGERED: the routing binds when the reading SELECTS that shape, and the rule did not select it.",
            "THE DEGENERATES WERE RUN BEFORE THE ARM WAS BELIEVED, in a staged checkout rather than the working tree, each predicted first and all three as predicted. The gate weakened to `keep the first twenty` reddens nine arms, the new one among them. The hidden/ordinary key dropped from the comparator reddened exactly ONE arm before this sprint -- the handler arm over a directory whose dotfiles outnumber the bound -- and reddens two now. And the gate's early return comparing FLAT while its insertion point stays GROUPED, two spellings of one order, reddens THE NEW ARM ALONE, which is the measurement that says the arm is not a second reading of something already covered.",
            "AND THE NEW ARM PASSED UNDER AN IMPLEMENTATION KEEPING NOTHING, WHICH ITS OWN COMMENT CLAIMED IT COULD NOT. Every assertion in it is sliced by a length read off its premise's own result, so with the gate keeping nothing all three degenerate to empty-equals-empty and the total is counted separately: MEASURED in a staged checkout, 11 of the file's 15 arms reddened and BOTH gate arms passed. The comment said membership was asserted by the premise `so this arm cannot be satisfied by an implementation that FILTERED them` -- true of a filter, false of the empty list, and a comment CLAIMING a hole is closed is worse than the hole. THE IDIOM WAS INHERITED FROM THE ARM DIRECTLY ABOVE, which survives the same degenerate, so this reproduced an existing hole rather than inventing one -- AND BOTH ARE FIXED, in one commit, because fixing the newer one alone would leave the record saying the older one is defended. With the premise excluding the empty case the same weakening reddens 13 of 15, both gate arms among them.",
            "WHY A DIRECTORY COULD NOT STAGE IT, which is the same reason the sequence is a parameter, applied to the other key: through a real directory the arm cannot choose WHICH names are in the kept list when an ordinary one arrives, so `a hidden name already kept, displaced by an ordinary name arriving later` is unreachable from out there. The fixture makes first, last, bound and total four different readings: fifty entries against a bound of twenty, hidden ones arriving FIRST and displaced entirely, and an arrival order that is neither the render order nor its reverse.",
            "THE INVERSION NOBODY HAS RULED, AND IT MAY BE THE RULING RATHER THAN THE TIMING: the faster runtime retains the whole directory behind its handle ANYWAY, so an array shape's array is a SECOND copy there; the slower one discards, so this function's array would be THE ONLY whole-directory retention. IF THAT HOLDS, THE RUNTIME PAYING THE TIME IS THE RUNTIME WHERE THE BOUND IS WORTH THE MOST. Read it, do not assert it -- and if the reading refutes it, the reading is the ruling.",
            "A THIRD SHAPE IS ON THE TABLE AND CARRIES A ROUTING RATHER THAN A COST: reading all names without a handle and keeping only the best twenty measured fastest on BOTH runtimes at every size -- but it DELETES THE SECOND CANCELLATION SEAM, because without a handle there is no between-open-and-first-entry, and the arm defending that seam becomes TARGET DELIBERATELY REMOVED. Deleting an arm that defends an accepted criterion is a scope decision and is ROUTED BEFORE it is taken.",
            "THE AGGREGATE HAZARD IS NAMED IN ADVANCE because this area already has it: first, last, bound and total collapse into one value on the easiest fixtures, so every arm uses a directory where all four differ.",
            "DEGENERATES, IN ADVANCE: a shape that reads nothing is the fastest shape there is, so the instrument asserts the total and the rendered names per timed call; the retention gate weakened to `keep the first twenty` goes green on any fixture whose arrival order IS the render order -- measured, not feared, since the planning reading's own directories rendered in arrival order; and the comparator swapped for a locale collator is the one perturbation here whose target survives every branch.",
          ],
        },
        {
          test: "None -- the ruling and the prose.",
          implementation:
            "The ruling lands AT THE SITE and supersedes rather than layers; the dashboard carries it too. Every sentence in that module whose subject is this shape is re-taken, retired by name, or narrowed -- and same-session numbers belonging to a DIFFERENT ruling are filed as suspect-by-association rather than silently renumbered.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "9e77f36",
              message:
                "docs(resolve): rule the shape on today's reading, and supersede the stack of corrections",
              phase: "green",
            },
            {
              hash: "89735c1",
              message:
                "docs(resolve): retire the readdir pair rather than renumber it, the subject differs",
              phase: "refactoring",
            },
            {
              hash: "634e30e",
              message:
                "docs(resolve): put the seam the fastest shape deletes where that edit would be made",
              phase: "refactoring",
            },
            {
              hash: "c82c563",
              message: "docs(resolve): narrow the superlative the sprint's own null cell refutes",
              phase: "refactoring",
            },
            {
              hash: "1c9c23b",
              message:
                "docs(resolve): take the perception claim out of the declarative, and say what the budget rests on",
              phase: "refactoring",
            },
            {
              hash: "eb05491",
              message:
                "feat(scripts): price the stat per entry, and retire the figure that was left suspect",
              phase: "green",
            },
            {
              hash: "e8a67d9",
              message:
                "docs(resolve): say that nothing detects the firing condition, beside the condition",
              phase: "refactoring",
            },
            {
              hash: "f4e20af",
              message:
                "docs(resolve): end the retention claim where its reading ends, and name what that opens",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE RULING, AS IT LANDED AT THE SITE, AND ITS SIX CONTENTS CHECKED ONE AT A TIME. (1) A NUMBER PER RUNTIME AT THE ORDINARY SIZE FOR BOTH SHAPES, one instrument, one session: bun 2.080 streaming against 2.528 array, deno 9.619 against 6.374. (2) WHO PAYS, SIGNED: deno +3.261 ms per highlight against the array shape it replaced and +4.157 against an array under this same gate; bun -0.460 against the first and +0.601 against the second. (3) WHAT IT STILL BUYS, PER RUNTIME, AFTER THE TRANSIENT-ALLOCATION READING: on bun this function's own working set beside a copy the process holds anyway, plus a tail of 42.616 against 61.302; on deno the only whole-directory retention there is to avoid AT THE OPEN -- AT THE OPEN AND NO FURTHER, because that is where the reading stops, and this note said `the only whole-directory retention there is to avoid` with no such limit until acceptance narrowed it. What deno's LAZY read materialises once iteration has started is separated by no instrument in this sprint, so on that runtime `the process holds no whole directory` is established at the open and UNMEASURED afterwards rather than answered no. (4) A FIRING CONDITION: deno's `opendir` ceasing to discard, bun's `Dir` ceasing to materialise on the first read, the ordinary-size delta on deno falling inside the null cell on a re-run, AND -- ADDED AT ACCEPTANCE AND THE LIKELIEST OF THEM TO FIRE -- deno's `Dir` materialising the directory ONCE ITERATION STARTS, which is the unknown (3)'s narrowing leaves standing. That last clause is not the same kind of thing as the others: they are runtime CHANGES, it may be true TODAY, and if it holds deno pays 3.261 ms for a bound the process already has, which is the configuration the item's own criterion refuses. It guards the ruling's BASIS and not its size. AND NOTHING DETECTS ANY OF THEM, which is written AT THE CONDITION and not only here, and not only about the instrument's re-run: every clause is a property of the RUNTIMES, no check in this repository reads what an `opendir` allocates or retains, no check re-runs the instrument, and the versions every number was taken on are read off the running binary INSIDE that instrument alone. So a runtime upgrade reddens nothing, the cited versions go stale in silence, and the timing clause fires only when a person runs the two lines -- while the retention clause needs a reading nobody has taken, since every number in this sprint is wall-clock. A ruling written to age against a suite that cannot see it age is the folklore it was written against, one step later. (5) AT THE SITE, in the module's own docstring and not only here. (6) SUPERSEDING: the paragraph that stood there is replaced whole rather than corrected line by line. BOTH (3) AND (4) WERE AMENDED UNDER THE REVIEW'S CONDITIONS AT f4e20af, at the module and here, since the wide sentence lived in both places.",
            "THE PERCEPTION CLAIM WAS DROPPED AND THEN CAME BACK IN THE DECLARATIVE, WHICH IS RECORDED AS THE FAILURE IT WAS RATHER THAN AS A SECOND DROP. The paragraph opened `NO CLAIM IS MADE HERE ABOUT WHAT A PERSON CAN PERCEIVE` and closed `None of it blocks the popup` -- unqualified, about an editor's popup, four sentences after saying the licensing measurement was not taken. The budget it rested on carried two more of the same: `a moment the user is already waiting through a popup`, and a user arrowing superseding each highlight. NO EDITOR WAS IN THE LOOP FOR ANY NUMBER IN THAT FILE. AND THE DISCLAIMER AGGRAVATED RATHER THAN MITIGATED -- a sentence saying `no claim is made here` licenses a reader to stop scrutinising the sentences after it, which is how three of them survived a whole sprint about measured claims. What stands now is the half that is the package's own and readable from the file -- once per resolve request, never on the keystroke path -- with the two perception sentences retired by name and the arrowing amplifier CONDITIONAL on a client behaviour the protocol permits and nothing here observed. It is still a MACHINE cost at the per-highlight number, and no product of that number with a keystroke count is manufactured.",
            "EVERY SENTENCE WHOSE SUBJECT IS THIS SHAPE WAS RULED, ONE AT A TIME. RE-TAKEN: the open-alone and stat-alone pair in the header (the 37 ms retired by name, since a whole open-plus-drain measures 9.619 ms at that size); the 51/135 ms readdir pair, whose subject THIS session's own rows have, corrected in place with the new provenance; the tail pair; the deno drain figure quoted at the abort seam. RETIRED: the bufferSize timing comparison, because deno's `Dir` never reads that option, so it timed nothing it named -- the compatibility refusal beside it stands on its own reading. NOT RE-TAKEN AND SAID SO: the split naming the SORT ALONE, since this session timed whole shapes.",
            "AND THE SPRINT'S OWN DEFECT WAS THIS CLASS, CAUGHT ON A SECOND PASS OVER THE FILE AND RECORDED RATHER THAN QUIETLY AMENDED: the ruling commit replaced the 51/135 pair with two rows of this session's own and called them the same subject. They are not -- this instrument timed WHOLE SHAPES, so its nearest row to a bare `readdir` still carries the gate running over the array. The pair is RETIRED with that reason instead of renumbered. It is the fourth-term failure the MEASURED rule names: correct numbers under a wrong subject, which re-measuring cannot catch.",
            "ONE FIGURE WAS FILED AS SUSPECT BY ASSOCIATION AND HAS SINCE BEEN RE-TAKEN, WHICH IS THE HONEST END OF THAT LABEL: `~1.1 s` of per-entry stats. The label was honest about the doubt and dishonest about the AVAILABILITY -- its subject was one command away, and this project's own rule is that a routed question with a one-command answer becomes a standing uncertainty the moment nobody runs the command. TAKEN HERE, BY THE TRACKED INSTRUMENT RATHER THAN BY HAND, so a stranger can take it again: a new cell at five thousand entries, warm, medians of fifteen interleaved rounds, names read BEFORE the timing window so the subject is the stats alone, guarded like the shape cells. SEQUENTIAL -- each stat awaited before the next is issued -- 47.573 ms (42.845-50.278) on bun 1.3.13 and 75.523 ms (73.392-78.658) on deno 2.8.3; CONCURRENT, all issued and awaited together, 3.356 ms (3.196-4.317) and 40.575 ms (38.288-42.861). BOTH PATTERNS BECAUSE THE RETIRED FIGURE RECORDED NEITHER and they differ by fourteen times on bun; the old number is fourteen to three hundred and thirty times these, the same inflation this base reads in every other figure of that session. WHAT THE REFUSAL RESTS ON IS NOT WHAT THESE ROWS MEASURE, and the site says so: they are the stats ALONE at one size, and no product of them with a keystroke count is manufactured. STILL SUSPECT BY ASSOCIATION, and nothing here re-takes it: the 777-859 ms durations at the abort seam, taken at a hundred thousand entries where this session re-took the open only at five thousand. The seam's argument rests on the TURN COUNT rather than on those durations, and that count was not re-taken either, which the site now says.",
            "THE MEMORY READINGS ARE LABELLED INHERITED AT THE SITE and are not evidence produced by this sprint: bun's 30 -> 61 MB, deno's unmoved `heapUsed` after a forced collection and the 206 MB plateau. What no instrument here separates is named beside them -- what deno's LAZY read materialises once iteration has started, as against the transient allocation at the OPEN.",
            "THAT DOCSTRING ALREADY CARRIES THREE STACKED CORRECTIONS. A fourth pasted on top is not a close: the paragraph is REWRITTEN so the reading a maintainer meets first is the current one.",
            "AND THE CRITERION IS SILENT BETWEEN THE TWO SHAPES, WRITTEN BESIDE THE RULING SO A LATER READER DOES NOT READ THE BRANCH RULE AS THE CRITERION HAVING SELECTED. The words refuse ONE CONFIGURATION -- a runtime paying a regression at the ordinary sizes for a benefit that appears only on the other -- and they are not a maximiser. THE THIRD SHAPE TRIPS NOTHING IN THEM: it is faster on both runtimes at five thousand and at the tail, so nothing in the criterion refuses it. THE SHIPPED SHAPE TRIPS THEM ONLY IF THE INVERSION FAILS, since the bound it buys lands hardest on DENO, the runtime that pays. So the criterion selected NEITHER, and the tiebreak that actually decided -- the WORKING SET, plus the second cancellation seam the third shape deletes -- LIVES OUTSIDE IT. What selected is the branch rule fixed IN ADVANCE, on what is held rather than on the clock, with the arm defending an accepted criterion routed rather than deleted. `THE CRITERION CHOSE THIS SHAPE` IS THE SENTENCE THIS NOTE EXISTS TO PREVENT, and it is the one a reader meeting a green ruling and a stated criterion would write.",
          ],
        },
        {
          test: "The standing re-run -- the comparator degenerate against whichever shape lands, reds NAMED rather than counted.",
          implementation: "Run after the shape decision; record the outcome with the arms named.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "AND THE SUITE RE-RUNS ONE OF THIS SPRINT'S OWN NOW, which is what keeps a hand-run perturbation from being one nobody runs again: the split-comparator weakening is a record in test/perturbations.test.ts, the FIRST over a workspace member, and it needs no second instrument -- the stage is built from `git ls-files`, so a member's arm file and a member's source are tracked paths like any other. It reports `[HELD] a hidden name already kept is displaced by an ordinary name arriving after it`, and its collateral list is empty AS A MEASUREMENT: one arm in a file of fifteen. THE ONE THAT IS NOT RE-RUN BY THE SUITE IS THE INSTRUMENT'S OWN, and the reason is the sprint's own refusal: it would put a wall-clock reading inside `bun test`. It was run by hand instead and is recorded above.",
            "THE INSTRUMENT'S OWN DEGENERATE WAS RUN BEFORE ITS ROWS WERE BELIEVED, and it is the one the plan named: a shape returning `{ names: [], total: 0 }` under a fourth label. IT IS RE-RUN AND RE-RECORDED HERE BECAUSE WHAT WAS WRITTEN DOWN WAS NOT REPRODUCIBLE FROM THE TRACKED INSTRUMENT: this note read `readsNothing counted 0 of 40` and named no runtime, and no size in that file has ever been 40. Re-run on both, unpiped, `bun run` and `deno run -A` over a copy carrying that fourth label: EXIT 1 and ZERO BYTES on stdout on bun 1.3.13 and deno 2.8.3, with `readsNothing counted 0 of 200` -- the first size, which is what a shape reading nothing fails at first. The exit-and-zero-bytes half held; the number did not, and the missing runtime is this project's own rule broken in its own record.so a shape that read nothing cannot report the fast row it would otherwise have earned. THAT GENERALISATION SWALLOWED ITS OWN EXCEPTION, AND THE EXCEPTION IS THE PAIR OF CELLS WHOSE NUMBERS RETIRE THE MODULE'S FIGURE FOR THE OPEN ALONE: the open-and-stat calls render nothing and, when those rows were taken, asserted nothing -- the instrument's docstring said so and stopped there. MEASURED with the open replaced by a no-op handing back an empty handle: that cell reported 0.001 ms (0.001-0.002) on BOTH runtimes, where deno's real open is 2.442, and the process exited 0 with a complete publishable reading. GUARDED at a56666e -- the handle drained outside the timing window and counted, the stat required to read the ino this process read off its own fixture -- and the same degenerate now exits 1 with `openAlone drained 0 of 5000` and zero bytes on stdout, bun 1.3.13 and deno 2.8.3. THE CITED ROWS PREDATE THE GUARD AND ARE NOT RETRO-VALIDATED BY IT; what the guarded cell's own re-run says is only that they reproduce -- deno's open alone 2.442 (2.385-2.551) and 2.436 (2.382-2.472) on two runs against the cited 2.402, bun's 0.001 on both.",
            "HELD. The gate's comparison swapped for a locale collator, applied in a STAGED checkout rather than the working tree, reddens three arms and they are NAMED rather than counted: `a directory whose dotfiles outnumber the bound still renders its ordinary entries`, `a name arriving after the kept list is full replaces the worst kept by code unit`, and `a hidden name already kept is displaced by an ordinary name arriving after it`. Before the weakening the same file reads 15 arms and none failing. RE-RUN AFTER THIS ROUND'S EDIT TO TWO OF THOSE THREE ARMS, and the count is unchanged -- 15 arms, the same 3 red, none failing at the baseline. THE RE-RUN ALSO SAYS WHICH SPELLING THE THREE BELONG TO, WHICH THIS RECORD DID NOT: `the gate's comparison swapped for a locale collator` has two readings, and they do not measure the same thing. THE WHOLE COMPARATOR replaced by `localeCompare` -- hidden grouping gone with it -- is the one that reddens three. Swapping only the within-group tail, leaving the grouping branch standing, reddens ONE: the arm about the comparison between two names, which is the only claim that spelling touches.",
            "ITS TARGET SURVIVED BECAUSE THE SHAPE DID, which is what made it the right re-run to pick: the branch taken keeps the handle, so the gate and its comparator are where they were. Had the array shape landed the comparator would still have had a target -- it is the one perturbation in this area that does -- and this record would read the same.",
            "AND IT GAINED A THIRD RED THIS SPRINT, which is the half worth recording: the arm added here is one of the three, so the standing re-run is now reporting on a control that did not exist when the perturbation was first recorded.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "REVISE ROUND TWO, NINE FINDINGS, ALL FIXED AT THIS BASE, AND THE COUNTS MOVED FOR ONE REASON. Baseline before the first edit, unpiped `bun run scripts/definition-of-done.ts`: 897 pass / 0 fail / 2725 expect() across 61 files, five [PASSED], warnings 1. At the last commit below: 898 pass / 0 fail / 2742 expect() across 62 files, five [PASSED], warnings 1. THE FILE AND THE TEST ARE test/instrument-copy.test.ts and the 17 further expect() calls are its 15 plus the two the gate arms gained; nothing else moved. Environment: bun 1.3.13, deno 2.8.3, tsc 7.0.2, darwin arm64.",
        "FOUR OF THE NINE WERE THE SPRINT'S OWN PROSE FAILING THE RULE THE SPRINT EXISTS TO APPLY, which is worth naming as a pattern rather than leaving as four repairs: a superlative the sprint's own null cell refutes and which propagated from the dashboard into the module; a perception claim retired in one paragraph and re-made in the declarative in another; a generalisation about guards that swallowed the two cells it was least true of; and a degenerate's recorded output that the tracked instrument cannot produce. THE COMMON SHAPE IS THAT EACH READS AS A DISCLOSURE. A sentence that says `no claim is made here`, `filed as suspect`, `a shape that read nothing cannot report a fast row` or `written before the run` buys the reader's trust in the same breath it spends it, and this sprint's own reviewers read past all four. What separates them from the ordinary error is that RE-MEASURING DOES NOT CATCH ANY OF THEM: the numbers were right every time.",
        "A RECORDED RULING IS A LEGITIMATE CLOSE HERE -- the criterion licenses it -- AND IT NEEDS SIX THINGS OR IT IS A SHRUG: a number per runtime at the ordinary size for both shapes, taken at this base by ONE instrument in ONE session; who pays and how much as a SIGNED DELTA rather than a direction word; what the shape still buys after the transient-allocation reading, per runtime, in the terms it was adopted for; A FIRING CONDITION, the observation that would reopen it, since a ruling that cannot age is folklore; landing AT THE SITE and not only in the dashboard; and SUPERSEDING rather than layering.",
        "`THE DIFFERENCE IS IMPERCEPTIBLE TO A USER` IS REFUSED AS WRITTEN, AND THIS IS THE ITEM WHERE IT MUST BE. It names no quantity, no threshold and no observer, so no measurement can contradict it -- the superlative class. And it is the subject-error class exactly: a number would be taken in milliseconds while the sentence's subject is PERCEPTION, which the number does not measure. Shipping it in the sprint whose whole business is a measured claim would be the class arriving inside its own repair, which this backlog has recorded happening twice.",
        "TWO HONEST NEIGHBOURS ARE ADMISSIBLE INSTEAD: the delta placed against a NAMED BUDGET WITH ITS OWN PROVENANCE -- this runs once per HIGHLIGHT on an idle moment, never per keystroke -- or a perception claim made the way this package has already made one, naming the editor, the plugin chain and the setting it was measured in AND disclosing that the measurement is not in this suite and no red here catches its regression. A claim naming an editor, a harness and what it cannot catch is admissible; one naming none of the three is not. IF NEITHER IS OBTAINABLE HONESTLY, THE RULING DROPS THE PERCEPTION CLAIM and stands on the working set -- declining to claim what was not measured is a close; claiming it anyway is the shrug.",
        "A PER-RUNTIME BRANCH IS REFUSED OUTRIGHT, EVEN WITH EVERY CHECK GREEN, and the story sentence invites it. THE SAME INSTALLED ARTIFACT RUNS UNDER BOTH RUNTIMES, and every platform decision in this package is ASKED rather than branched on -- a runtime sniff is that defect in another coordinate. AND THE TWO SHAPES DO NOT SHARE A CANCELLATION STORY: two shapes means two seam analyses, two leak stories and two abort placements, OF WHICH ONLY ONE IS EXERCISED ON ANY MACHINE ON ANY RUN, so half the shipped code is graded by nothing in any given Definition of Done.",
        "A RUNNER-UP IS NAMED SO IT IS NOT REACHED FOR: keeping the current shape by DELETING THE PARAGRAPH THAT RECORDS WHAT IT COSTS. The cost paragraph is the evidence, and a green suite over a shorter docstring is a shrug that reads as a close.",
        "THE SPRINT RUNS SINGLE-STAGE AGAIN. The reviewer that failed twice is still `waiting_human` and is NOT re-escalated here; no claim about finding density may rest on the count of readers.",
        "PO ACCEPTANCE: ACCEPTED WITH CONDITIONS, AND PBI-67 CLOSES WHEN THEY LAND -- in this sprint, as docstring edits, with no re-decision and no new reading. THE CRITERION FIRST: `the shape is chosen against a reading taken on BOTH runtimes at the sizes this package calls ordinary, and no runtime pays a regression at those sizes for a benefit that appears only on the other`, whose verification licenses `a recorded ruling naming which runtime pays and why`. The reading exists, was taken on both runtimes in one session by a tracked instrument, and an INDEPENDENT RE-RUN reproduced it -- deno -3.366 against -3.261, bun +0.471 against +0.460, open-alone 2.438 against 2.402, all three inside this instrument's own null. That reproduction is worth more here than one more digit: the ruling's third firing clause IS a re-run, so a reading nobody else can take could not have aged.",
        "THE SIX CONTENTS I SET FOR A RECORDED RULING, JUDGED ONE AT A TIME. (1) A NUMBER PER RUNTIME AT THE ORDINARY SIZE FOR BOTH SHAPES, ONE INSTRUMENT ONE SESSION -- MET: 2.080/2.528 on bun, 9.619/6.374 on deno, with a null cell establishing what the instrument itself cannot separate, which is more than I asked for and is what makes the other five readable. (2) WHO PAYS, SIGNED -- MET: deno +3.261 and +4.157, bun -0.460 and +0.601, each against a named alternative rather than a direction word. (3) WHAT IT STILL BUYS, PER RUNTIME, AFTER THE TRANSIENT-ALLOCATION READING -- MET IN FORM AND CARRYING C1: the sentence that decides it is stated of the whole scan and measured at the open. (4) A FIRING CONDITION -- MET IN FORM AND CARRYING C2: three clauses, and the observation most likely to fire is not among them. (5) AT THE SITE -- MET, in the module's own docstring. (6) SUPERSEDING RATHER THAN LAYERING -- MET, the paragraph is rewritten and the stack of three corrections is gone. THE CONDITIONS ARE ON (3) AND (4), PLUS TWO REPAIRS TO THIS RECORD'S OWN PROSE, AND ALL FOUR WERE WRITTEN INTO PBI-67 AND NOWHERE ELSE, WHICH HELD UNTIL THE ITEM CLOSED ON THEM -- they landed, the item left the backlog, and the closing decision below is where they are now. Neither blocks acceptance; both block a clean close, because a ruling whose basis is stated wider than its evidence is the class this sprint spent nine findings on. THIS JUDGEMENT IS THE ONE TAKEN AT ACCEPTANCE AND IS LEFT AS IT WAS READ THEN: (3) and (4) have since been narrowed and extended, which is what the conditions asked for, so the sentences it grades are no longer the sentences in the module.",
        "THE THIRD SHAPE WAS FASTEST AND WAS NOT TAKEN, AND ON MY OWN CRITERION THAT IS RIGHT -- BUT NOT BECAUSE THE CRITERION SELECTED IT. My words refuse ONE CONFIGURATION: a runtime paying a regression at the ordinary sizes for a benefit that appears only on the other. The third shape trips nothing in it -- it is faster on both at five thousand and at the tail -- and the shipped shape trips it only if the inversion fails, since the bound it buys lands hardest on DENO, the runtime that pays. So the criterion is SILENT BETWEEN THE TWO, and the tiebreak that decided -- working set, plus a second cancellation seam that shape deletes -- lives outside it. The call I endorse is the one the branch rule fixed IN ADVANCE and the sprint honoured: decide on what is held, not on the clock, and route rather than delete an arm defending an accepted criterion. WHAT I WILL NOT LET STAND IS `the criterion selected this shape`. It did not, and the honest consequence is C1: a shape faster on both runtimes may not be refused on a premise stated more strongly than the reading behind it.",
        "A TENTH FINDING, FOUND AT ACCEPTANCE AND OF THE SPRINT'S OWN CATALOGUED CLASS -- IT IS IN THIS DASHBOARD AND NOT IN THE MODULE, WHICH IS WHY THE ROUND OF NINE MISSED IT. The predictions note says ALL EIGHT HELD, and one did not hold as stated: `the ranking on bun FLIPPING WITH SIZE (readdir+sort faster at 200, slower at 5000 and at the tail)`, repeated in the repair subtask as `the ranking on the faster runtime FLIPS WITH SIZE`. At two hundred on bun that row is -0.021 inside a null of +0.001 (-0.036..+0.016), and TWO OTHER NOTES IN THIS SAME RECORD SAY SO. It is the superlative finding again, read off a median sign across a null the record itself draws -- and it is load-bearing where it appears, since it is offered as the reason one number per runtime could never have settled this. NARROW BOTH SENTENCES AND THE `ALL EIGHT HELD`: what the reading establishes is that bun does not separate the shapes at two hundred and prefers streaming at five thousand and the tail, while deno prefers the array at every size -- the runtimes DISAGREE WITH EACH OTHER, which carries the same conclusion without a flip. THE PREDICTION LIST IS THE ONE CLAIM HERE A READER CANNOT CHECK, by its own admission, so its accounting of which predictions held is the whole of its warrant. IT WAS CARRIED AS C4 IN PBI-67 AND THIS ENTRY IS ITS PROVENANCE, NOT ITS INSTRUCTION -- what gated the close was written in one place, and that place has closed with the item. WHAT C4 BECAME is the repaired accounting in the predictions note above and the narrowed sentence in the repair subtask, both at 7a86eb0.",
        "WHAT THIS SPRINT OWES THE BACKLOG, ROUTED RATHER THAN LISTED. FILED AS PBI-73: a ruling whose firing condition nothing detects, plus a tracked instrument nothing runs -- with the non-timing smoke run named there as the move that does NOT reopen this sprint's wall-clock refusal, and with the honest alternative (nothing should watch this) in the item. FILED INTO PBI-66: the sprint's own fourth-term instance, correct numbers under a wrong subject, self-caught and recorded as a contradiction. CARRIED INTO THIS RECORD ON THE CLOSE, HAVING READ `INSIDE PBI-67 RATHER THAN OUT` UNTIL THE ITEM LEFT: the retired sprint-53 starting evidence, and the note that a reopened re-decision needs a RETENTION criterion, since this instrument reads wall-clock only and `what is held` was argued from a signature and from INHERITED readings on both sides. Both are in the closing decision below. `Inside the item` STOPPED BEING A HOME THE MOMENT THE ITEM CLOSED, which is this dashboard's own lifetime rule catching a routing that named a container rather than a permanent home. STILL OPEN AND NOT FILED, BECAUSE THE MODULE NOW SAYS IT AT ITS SITE: the 777-859 ms abort-seam durations and the turn count the seam's argument actually rests on, neither re-taken. NOT ROUTED AS AN ITEM AND WORTH THE RETROSPECTIVE: four of nine, plus this tenth, were sentences that READ AS DISCLOSURES -- and re-measuring catches none of them.",
        "PBI-67 IS DONE AND HAS LEFT THE PRODUCT BACKLOG, THE FOUR CONDITIONS HAVING LANDED. C1 and C2 at the module and here, f4e20af and 7a86eb0; C3 -- the criterion's silence between the two shapes -- beside the ruling at 7a86eb0; C4 -- the flip claim and the `all eight held` that counted it -- at both its sites in the same commit; and the sprint-53 numbers retired at 36e2799. THE CRITERION IS MET BY THE ROUTE IT LICENSED, a recorded ruling naming which runtime pays and why, and NOT by a shape that costs neither runtime at the ordinary size: deno pays 3.261 ms per highlight at five thousand entries, signed, at the site. Definition of Done at the close, unpiped `bun run scripts/definition-of-done.ts`: 898 pass / 0 fail across 62 files, five [PASSED], warnings 1 -- unchanged from the baseline these edits started at, which was predicted before them, the named counterfactual being a directory-qualified path in the shipped docstring reddening test/packed-members.test.ts.",
        "TWO THINGS CLOSE WITH THE ITEM RATHER THAN BEING FILED OUT OF IT, BECAUSE THEY BELONG TO THIS DECISION AND TO NO OTHER. FIRST, THE ITEM'S OWN ACCEPTANCE CRITERION CITED STARTING EVIDENCE THIS SPRINT FALSIFIED: `45 to 127 ms at five thousand entries` and `1289 to 1977 at a hundred thousand`, taken in sprint 53 AFTER the shape was already chosen, from the session whose every re-taken figure this base contradicts. The same nominal sizes and the same two runtime versions read 6.374/9.619 and 138.507/204.036 on the tracked instrument. THEY MAY NOT BE CITED AGAIN. What survives re-taken is the DIRECTION and not the magnitude -- streaming is slower on deno at every size read, and the regression lands on the size this module's own premise calls ORDINARY -- and what does NOT survive is `bun improves at both` as a reading of the small size, where bun does not separate the shapes at all. A criterion carrying numbers its own sprint retires is the fourth-term failure read at the place it is authored rather than at the place it is measured.",
        "SECOND, AND IT IS THE INSTRUCTION FOR WHOEVER REOPENS THIS: A REOPENED RE-DECISION NEEDS A RETENTION CRITERION WITH A MEASUREMENT BEHIND IT, NOT A SECOND TIME CRITERION. This sprint's instrument reads WALL-CLOCK ONLY, so `what is held` -- the tiebreak that actually decided -- was argued from a SIGNATURE and from INHERITED memory readings on both sides. That is why the likeliest of the ruling's firing clauses, deno's `Dir` materialising once iteration starts, is one nothing in this sprint can answer: it is a retention question put to an instrument that measures time. A re-decision taken on a re-run of the same instrument would settle the cost and leave the reason untouched.",
      ],
    },
    {
      number: 58,
      pbi_id: "PBI-60",
      goal: "The unbuilt-artifact flip stops living in prose: either the compiler NAMES THE FILE IT COULD NOT READ, or the cost that prevents that is a check which reddens the day the cost is gone.",
      status: "done",
      subtasks: [
        {
          test: "None -- a READING, its predictions and their counterfactuals written down before the run.",
          implementation:
            "Delete the source arms from the framework's exports map and read EVERY reader, in the artifact PRESENT and ABSENT states, on both runtimes and the compiler. Readers enumerated rather than sampled -- the root program, each member's own, the build config, the consumer probes, both runtimes at the root and inside each member, the spawned CLI and fixtures and examples, and the installed and packed arms.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "885165e",
              message:
                "docs(scrum): the deletion is measured, and one enumerated reader is what refuses it",
              phase: "green",
            },
          ],
          notes: [
            "THE READING WAS TAKEN AND IT REFUSES THE DELETION. Environment, so it can be re-run: bun 1.3.13, deno 2.8.3 (the tree's comments cite 2.9.2 -- this machine is one minor behind and the readings below are this machine's), tsc 7.0.2, base b226ecf. Baseline before any edit, command as run unpiped `bun run scripts/definition-of-done.ts`: five [PASSED], warnings 1, 879 pass / 0 fail / 2617 expect() across 58 files, no skips reported.",
            "BOTH ROUTES ARE ONE DIRECTORY HERE, MEASURED RATHER THAN STASHED TWICE. `node_modules/@atusy/tsudoi-language-server`, `packages/tsudoi-hover-wordnet/node_modules/@atusy/...` and `packages/tsudoi-completion-path/node_modules/@atusy/...` all realpath to packages/tsudoi-language-server, and the two dist/ paths share an inode. So one manifest edit and one dist/ move perturb every route, and the `stash one route and measure nothing` failure mode has no subject on this install. It would return the day an install copied instead of linked.",
            "THE FOUR CELLS, EACH READING WHICH FILE ANSWERED. (A) arms present, dist present: every subpath answers from packages/tsudoi-language-server/dist/*.d.ts for tsc at the root and in BOTH members, and from dist/*.js for bun and deno at the root and in both members. tsconfig.build.json ATTEMPTS NO SUBPATH AT ALL -- src/ never writes the bare specifier -- which the instrument reports as `attempted: false` rather than as an empty answer, because those two are byte-identical without the pair. (C) arms deleted, dist present: THE SWEEP OUTPUT IS BYTE-IDENTICAL TO (A) FROM THE FIRST READER ONWARD, diffed, the only differing line being the cell's own label.",
            "(B) arms present, dist absent, FRAMEWORK ONLY: tsc at the root and in both members EXITS 0 WITH NO ERROR AT ALL and every framework subpath answers from packages/tsudoi-language-server/src/*.ts. That is the residue isolated from the handlers for the first time -- the recorded starting evidence removed every dist/, where the two handler errors are what makes tsudoi's silence visible. THE RUNTIMES ARE LOUD AND THEY DISAGREE IN SHAPE: deno's `import.meta.resolve` still hands back the dist URL and the import fails ERR_MODULE_NOT_FOUND NAMING packages/tsudoi-language-server/dist/types.js, while bun's resolve THROWS and its message names only the SPECIFIER, never a file. Neither falls through to `default`.",
            "(B') THE RECORDED STARTING EVIDENCE, RE-TAKEN AT THIS BASE AND REPRODUCED EXACTLY. Every dist/ moved aside, `tsc --noEmit` at the root, unpiped: exit 1 with exactly two errors, `examples/tsudoi.config.ts(1,49): error TS2307` for @atusy/tsudoi-completion-path and `(2,30)` for @atusy/tsudoi-hover-wordnet -- both HANDLER packages, tsudoi silent.",
            "(D) arms deleted, dist absent -- CONDITION (2) HOLDS AND IT IS THE HALF THAT WORKS. Root tsc exits 1 with TS2307 NAMING THE FRAMEWORK'S OWN SUBPATHS at examples/tsudoi.config.ts, examples/diagnostic-trailing-whitespace.ts, examples/formatting-trailing-whitespace.ts, test/documents.test.ts and test/fixtures/published-specifier.ts; each member's own check exits 1 naming them in its src/ and its tests. The framework fails exactly the way a handler already does. Carried with it, so nobody reads the diagnostic as clean: each unresolved handler signature also produces TS7006 noise, which is consequential and not a second fault.",
            "CONDITION (1) FAILS, AND THE READER IT FAILS ON IS ONE THE ENUMERATION CAUGHT ONLY BECAUSE IT WAS ENUMERATED: `typeCheckProbe` in test/helpers/typecheck.ts stages the framework's manifest with src/ SYMLINKED AND NO dist/, so the subpath resolves by package self-reference, finds ./dist/types.d.ts absent and TAKES THE `default` ARM. Its answer today is packages/tsudoi-language-server/src/types.ts; with the arms deleted it is TS2307 and no file. The `dist present` state does not save it, because the probe's own tree has no dist/ in either state.",
            "SO THE DELETION PRODUCES, BYTE FOR BYTE, 875 pass / 4 fail across the same 58 files and 879 arms, no skips, with `tsc --noEmit` and the fifth check both still exit 0. The four: test/package-shape.test.ts `the published surface is tsudoi's types beside the dependency subpaths, and nothing else` (the equality pin, a literal that moves); test/published-artifacts.test.ts `the in-repo arm cannot observe what the published arm checks` (expected 0, received 1); test/published-specifier.test.ts `a config importing @atusy/tsudoi-language-server/types type-checks against the shipped package.json` (`tsudoi.config.ts(1,42): error TS2307`); and its neighbour `a deliberate type error in the probe is reported, so the probe is really checked`, which asserts `not.toContain(\"TS2307\")` and now receives TS2307 BESIDE the TS2322 it wanted. Sprint 44's superseded `reddens FOUR tests` is re-taken at four, and the identity of the four is what matters: only the first is a pin.",
            "THE TWO RECORDED IMPORTERS ARE BOTH STILL HERE AND BOTH STILL COST SOMETHING, so neither is `gone`: examples/tsudoi.config.ts(3,42) and test/fixtures/published-specifier.ts(7,35) are among the TS2307 sites in cell (D). They no longer break in cell (C) the way the pre-move measurement said -- with the artifact present they resolve to dist/ unchanged -- so the cost did not evaporate, IT MOVED: from `breaks whenever the arm is repointed` to `breaks only when the artifact is absent`, which is the state this sprint wanted them to break in.",
            "A GREEN SUITE WAS TREATED AS ZERO EVIDENCE THROUGHOUT: every cell above was taken by hand outside `bun test`, with dist/ MOVED ASIDE (never deleted) after the preload would have run and moved back, and each removal named a literal absolute path typed out rather than read from a manifest or a glob. Labelled DEBUGGING per this project's rule for a check run by hand.",
            "A GREEN SUITE IS ZERO EVIDENCE HERE AND NOT WEAK EVIDENCE, WHICH IS WHY THE READING IS TAKEN OUTSIDE THE SUITE: the preload builds every package before any test file loads, so THE STATE UNDER MEASUREMENT NEVER EXISTS DURING A RUN. The reading is taken on a tree with the artifact removed AFTER the preload would have run, or it is not the reading.",
            "AND BOTH ROUTES ARE STASHED. The root declares the framework in devDependencies, so every member has a second path through the root's installed packages, and this repository has already measured that perturbing only a member's own route measures NOTHING. A cost reading that stashes one route reports `no cost` for a reason unrelated to the arm.",
            "EVERY READING RECORDS WHICH FILE ANSWERED -- a traced path, never an exit code. `The cost evaporated` is sayable only as: THESE specifiers, in THESE files, resolve to THESE paths with the arm removed. The instrument already exists in this suite.",
            "THE RECORDED COSTS ARE SUPERSEDED AND ARE QUOTED ONLY AS THE THING BEING RE-TAKEN: they were measured under a mapping that no longer exists anywhere, and the two importers they name now reach the framework through installed packages instead. Locate those two by their paths in today's tree, or declare them gone and name what replaced them.",
            "AND A RUN OFFERED AS EVIDENCE ACCOUNTS FOR SKIPS, per the previous sprint's own measurement: a file whose arms are ALL SKIPPED satisfies `every arm passed`.",
          ],
        },
        {
          test: "None -- a READING taken before any edit, and its output is what the deciding measurement is applied to.",
          implementation:
            "Enumerate every site whose REASON is about this arm, by reading each rather than counting them, and rule each REWRITE or RETARGET against a discriminator fixed BEFORE the enumeration: a rewrite is a sentence whose subject is deleted; a RETARGET is an assertion kept alive by substituting a different justifying fact, and the item's deciding measurement disqualifies it.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "001339e",
              message:
                "docs(scrum): rule the sites against a red, and the one with a red is a retarget",
              phase: "green",
            },
          ],
          notes: [
            "THE DISCRIMINATOR, FIXED BEFORE THE ENUMERATION AND APPLIED TO A RED RATHER THAN TO A SENTENCE: does any ARM'S REQUIRED RED change cause? A rewrite is a sentence whose subject is deleted and whose arm, if it has one, keeps the red it always had. A retarget is an assertion that survives only by substituting a different justifying fact. Under that rule a false sentence with no arm behind it is a REWRITE however completely its mechanism changed -- which is what makes the one site that DOES have an arm the decider.",
            "THE ENUMERATION IS WIDER THAN THE TWELVE PLANNING NAMED, and the surplus is named rather than counted: every site below was READ. Beyond the planned set it holds bunfig.toml's residue paragraph, README.md's `it does not name tsudoi itself` paragraph, BOTH handler packages' own package-shape docstrings (each says tsudoi's map `carries a third arm, default`), test/package-shape.test.ts's prepack comment, and the skills file that quotes sprint 44's reading.",
            "ONE RETARGET, MEASURED, AND IT IS THE DECIDER. test/published-artifacts.test.ts's pair is `perturbing the published types reddens the probe WHILE tsc --noEmit stays green`. With the arms deleted the NAMED arm still passes -- `bun test test/published-artifacts.test.ts -t \"perturbing the published types reddens the probe while tsc --noEmit stays green\"` reads 1 pass / 0 fail / 25 filtered out. ITS CONVERSE HALF DOES NOT: `the in-repo arm cannot observe what the published arm checks` expects exit 0 and receives 1, on an UNPERTURBED manifest. The asymmetry the docstring credits to `default` -> ./src/types.ts is real and the arm is what manufactures it -- typeCheckProbe's tree has the manifest and a symlinked src/ and NO dist/, so with the arm gone the in-repo check loses the types exactly as the consumer does. THE PAIR COLLAPSES INTO `FAILS FOR EVERYONE`, which is the collapse the item named in advance. Keeping it alive means staging a dist/ into the probe so the in-repo arm reads the repository's ARTIFACT where it now reads its SOURCE -- a different justifying fact. RETARGET.",
            "EVERY OTHER SITE IS A REWRITE, AND TWO OF THEM ARE THE CLASS NO RED POINTS AT. `publishedArm`'s docstring says the map's arms are source-for-`default` and built-for-`types` and the function THROWS where an arm is missing -- it is called with `types` alone, so under the deletion nothing reddens and the sentence goes quietly false. test/installed-without-node-types.test.ts says the in-repo arm `resolves the exports map's default straight at src/types.ts`, which is MEASURED TRUE TODAY and would become false with no arm anywhere to say so.",
            "ONE SITE IS SETTLED RATHER THAN DELETED AND THE SETTLEMENT IS NOT THE ONE IT PREDICTED. test/package-shape.test.ts's root-check docstring names the residue, forbids any test here from pinning it, and predicts `the later fix -- deleting the default arm`. The prediction arrived, was measured, and the deletion was REFUSED; the paragraph now owes that outcome rather than the prediction.",
            "SITES WHOSE SUBJECT SURVIVES AND WHICH ARE THEREFORE UNTOUCHED, named so their silence is not read as an oversight: test/build-order.test.ts's source fall-through sentences are about the THROWAWAY PRODUCER'S OWN map, which this sprint does not touch; test/installed-handler.test.ts and scripts/workspaces.ts's prepareWorkspace paragraph are about a HANDLER having no source arm; and .claude/skills/recording-a-measurement/SKILL.md's `removing every default arm ... reddens FOUR tests` is a sprint-44-labelled historical reading whose conclusion -- the arm is still taken -- this sprint's re-take CONFIRMS, so it is left as history rather than edited.",
            "AND ONE MEASURED NUMBER IN THE ENUMERATION HAS GONE STALE, FOUND BY RE-TAKING IT RATHER THAN BY READING IT. test/installed-runtime.test.ts's middle-arm docstring says `dropping import from the ./types arm reddens FIVE tests` and names them. Re-taken at this base, unpiped `bun test`: 873 pass / 6 fail across 58 files, SIX. The sixth is `a change to src/ reaches the installed copy with no rebuild step`, in that same file, which the sentence does not name. The reds are test/published-artifacts.test.ts's runtime-key surface assertion, test/package-shape.test.ts's exports equality pin, and FOUR in test/installed-runtime.test.ts -- the deno handshake, the deno dictionary hover, the subpath-resolves arm itself, and the no-rebuild arm.",
            "THE DECIDER AMONG THE SITES IS THE ONE WHOSE PROPERTY IS A PAIR: an arm requiring that perturbing an installed consumer's published types reddens the probe WHILE the root check stays green. The asymmetry that produces the pair -- the consumer loses the types where this repository, which has source, does not -- IS MANUFACTURED BY THE ARM UNDER DELETION. So the measurement is not `is it still red`: it is whether BOTH HALVES survive. If the pair collapses into `fails for everyone`, the arm has been retargeted.",
            "ONE SITE IS THE CLASS THAT IS MISSED PRECISELY BECAUSE NO RED POINTS AT IT: a helper whose docstring says the map's arms are source-for-`default` and built-for-`types`, and which THROWS when a subpath carries no arm for the condition asked. It is called with one condition today, so under the deletion NOTHING REDDENS and the sentence quietly becomes false.",
            "AND ONE SITE IS SETTLED RATHER THAN DELETED: the paragraph that names this residue, says no test here may pin it, and PREDICTS `the later fix -- deleting the default arm`. This sprint is that prediction arriving.",
          ],
        },
        {
          test: "In one staged package where one subpath is ARTIFACT-ONLY, another is WHOLLY ABSENT and the rest are complete: each reader's own output NAMES the missing file or the specifier for both, and in the complete tree every subpath answers from the artifact. Taken for the compiler and both runtimes.",
          implementation:
            "A staging helper writing the tree FROM THE MANIFEST'S OWN ARMS -- empty files created or omitted, no compiler -- under the guard whose type is the only route to a mutating end.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "951d50f",
              message:
                "test(unbuilt-artifact): stage the partial window as a written state, and read which file answered",
              phase: "green",
            },
          ],
          notes: [
            "BOTH STATES ARE STAGED AND NEITHER IS THE SHORTCUT: test/unbuilt-artifact.test.ts writes one tree carrying `./deps/protocol` ARTIFACT-ONLY (its module present, its declaration withheld), `./deps/textdocument` WHOLLY ABSENT from the artifact and the other two COMPLETE, and a second tree with no artifact at all. Written FROM THE MANIFEST'S OWN ARMS, every file empty, no compiler -- so the pack window is a written state rather than a window anybody has to hit.",
            "WHAT THE READERS ANSWER, WITH THE DISAGREEMENT ASSERTED RATHER THAN ARRANGED. On the artifact-only subpath the compiler falls through to the staged src/ while BOTH runtimes load the module that is there -- one tree, one subpath, two files -- and the arm asserts the two answers DIFFER, so the day they agree it reddens. On the absent subpath deno names the FILE it could not read, bun names the SPECIFIER, and the compiler names NEITHER because it answered. In both trees tsc exits 0.",
            "THE DEGENERATE IS MEASURED IN THE FILE RATHER THAN RUN ONCE AND WRITTEN UP: `exit 0` is asserted in all three staged states, so a reading asserting only the compiler's colour separates none of them. The two stager degenerates were RUN before the arms were believed -- a stager that writes the declaration anyway, and one that puts every subpath in the same state -- and each leaves 2 pass / 1 fail, the partial-vector arm alone.",
            "THE ITEM'S CONCURRENCY PREMISE IS RECORDED FALSE-AS-WRITTEN RATHER THAN INHERITED: nothing in this suite writes the FRAMEWORK'S OWN dist/ while another arm reads it. The installer packs a staged copy, the README arm packs in a real member directory but for the HANDLERS, and this file's own stager writes only into a throwaway. So the race is answered by construction and no writer was found.",
            "PARTIAL IS A PER-SUBPATH STATE VECTOR AND NOT A TREE-WIDE COLOUR, and the item's two definitions of it are not the same set: the compiler emits file by file, so mid-build the map ALSO holds some subpaths complete and others entirely missing. A uniform artifact-only tree would measure a state the build never passes through.",
            "SO PARTIAL IS A WRITTEN STATE RATHER THAN A WINDOW ANYBODY HAS TO HIT, and the race question is answered by construction. THE ITEM'S OWN PREMISE THAT THIS SUITE ENTERS IT CONCURRENTLY IS RE-MEASURED RATHER THAN INHERITED: counter-evidence is already in hand -- the installer packs a STAGED copy, and the arm that packs in a real directory does so for the HANDLER packages, not the framework. If a writer is found that is a live finding; if not, the premise is recorded false-as-written.",
            "THE FIXTURE-DISCRIMINATION PAIR IS ASSERTED AND NOT ARRANGED: each arm asserts the staged tree's own state beside the reading, and the compiler-versus-runtime split is asserted as the two readings DISAGREEING IN ONE TREE -- so the day they agree the arm reddens instead of quietly measuring one of them.",
            "THE PROPERTY IS WHICH FILE ANSWERED, and the failure mode is a SECOND EXPRESSION STANDING BESIDE THE CALL -- computing the expected path from the manifest and comparing it with itself. The arm reads what the reader HANDS OVER: the compiler's own trace, the runtime's own resolution.",
          ],
        },
        {
          test: "The branch that lands, with its condition stated in advance and ONE branch taken.",
          implementation:
            "AFFORDABLE iff all three hold: with the arms deleted and the artifact present, every check is green AND every reader answers from the same file it answers from today; with the artifact absent, the new failures are all NAMED DIAGNOSTICS naming the framework's own subpath, so the framework fails the way a handler already does; and every affected site was ruled a rewrite with none retargeted. THEN the answer is the deletion. NOT AFFORDABLE otherwise, and then the deliverable is a detector on the route the checks already take -- after the build, the published subpaths are resolved and the file that answered is read, and a subpath answering from source is REFUSED naming the file.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "543d28b",
              message:
                "feat(workspaces): refuse a published subpath that answers from anywhere but the artifact",
              phase: "green",
            },
          ],
          notes: [
            "THE CONDITION WAS APPLIED AND IT SELECTED BRANCH TWO, WITH TWO OF ITS THREE CLAUSES FAILING RATHER THAN ONE. (i) FAILS: with the arms deleted and the artifact present the suite reads 875 pass / 4 fail, and three of the four are not pin updates -- `typeCheckProbe`'s answer moves from packages/tsudoi-language-server/src/types.ts to nothing at all, and that probe's tree has no dist/ in either state, so no build repairs it. (ii) HOLDS, completely: with the artifact absent the new failures are TS2307 naming the framework's own subpaths at examples/*.ts, test/documents.test.ts and test/fixtures/published-specifier.ts, and in each member's own check -- the framework failing the way a handler already does. (iii) FAILS: the decider retargets.",
            "SO THE DELETION IS REFUSED WITH MEASUREMENT AND THE DETECTOR LANDED. `refuseSubpathsAnsweringFromSource` in scripts/workspaces.ts resolves every published subpath the workspace declares -- through node_modules and the exports map, by a link under each package's own declared name, with no mapping and no project reference -- and reads WHICH FILE ANSWERED off the compiler's own trace. A subpath answering from anywhere but the file its `types` arm names is refused, naming the specifier, the file that answered and the file promised.",
            "ITS SCOPE IS SMALLER THAN THE RESIDUE AND IS WRITTEN AT ITS OWN SITE. It runs on the FIFTH check, after the build, so what it catches is an artifact that SURVIVED one -- a partial emit, a package with no build config, a dist/ removed by hand between the build and the check. It does nothing for a bare `tsc --noEmit` on an unbuilt checkout: that is the fourth check, and nothing in this repository owns its invocation. Reaching it would take a mapping or a project reference, which decision 5 refuses by name.",
            "THE PROPERTY IS WHEN AND THE ARM READS WHAT THE COMMAND DID NOT PRINT. test/artifact-detector.test.ts spawns the REAL fifth check against staged workspaces whose member has no build config, so the artifact is exactly what the fixture wrote. THE MOVE DEGENERATE WAS RUN: the call relocated below the member loop, no value changed, leaves 3 pass / 1 fail -- the ordering arm alone. Two more degenerates were run before the arms were believed, each leaving 1 pass / 3 fail: a detector reading only THAT the subpath resolved, and one comparing the manifest's own path with itself.",
            "IF THE FIRST TWO HOLD AND THE THIRD DOES NOT -- affordable but retargeting -- THE DELETION IS REFUSED WITH MEASUREMENT AND THE DETECTOR BRANCH RUNS. The sprint never takes both.",
            "A THIRD OPTION SURFACED AT PLANNING AND IS REFUSED HERE: a condition-gated arm nothing matches without a flag. That is a SECOND SUBJECT FLIP ON THREE RESOLVERS, and one subject flip per sprint is the rule whose breach created this residue.",
            "FOR THE DETECTOR THE PROPERTY IS WHEN -- the reading is taken after the build and before any check reads the artifact -- and that is violated by MOVING code without changing a value, so its arms run the real check command against staged trees and read its output rather than calling the function.",
          ],
        },
        {
          test: "None for the prose; what grades it is where the words land.",
          implementation:
            "Settle the sites the enumeration ruled, and REPAIR RATHER THAN FILE the one inside this sprint's own subject: a docstring licensing the arm by a mapping that intercepts the subpath before the exports map is consulted, when no tracked configuration in this repository contains such a mapping.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "7af5396",
              message:
                "docs: settle the residue's prose on the post-move reading, and repair three false mechanisms",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE NAMED SITE WAS REPAIRED AND TWO MORE OF ITS CLASS WERE FOUND BESIDE IT, ALL INSIDE THIS SPRINT'S SUBJECT. (1) test/package-shape.test.ts's `default` bullet licensed the arm by `a paths mapping intercepts the subpath before the exports map is consulted, so tsc never reaches this arm`. (2) The prepack note in the same file said `Bun never reaches the map: the paths mapping above intercepts the subpath into ./src/deps/types.ts`, contradicting test/helpers/build.ts's own corrected paragraph. (3) BOTH handler packages' package-shape docstrings explained the root exclusion by `its paths mapping cannot answer for a member`. There is no mapping anywhere; the arm two tests above (1) asserts that no specifier the root check resolves is answered by one.",
            "EACH REPAIR CARRIES THE POST-MOVE READING RATHER THAN A DELETION: bun and deno both answer `deps/types` from packages/tsudoi-language-server/dist/deps/types.js, measured off `import.meta.resolve` at the root and inside each member, and tsc answers its declaration beside it -- so the dependence on this repository's dist/ WIDENED where the old prose said it was split.",
            "THE SETTLED PARAGRAPH NOW OWES ITS OUTCOME AND NOT ITS PREDICTION, in all three places it lived -- test/package-shape.test.ts, bunfig.toml and test/helpers/build.ts -- and every copy says the same thing: the deletion was taken, both halves of what the item asked for were measured, and it is refused by a cost named to a file. The residue's prose does not multiply.",
            "AND ONE STALE MEASURED NUMBER WAS REPAIRED BY NAMING, WHICH IS THIS PROJECT'S OWN CONVENTION: test/installed-runtime.test.ts said dropping `import` reddens FIVE tests. Re-taken, unpiped: 873 pass / 6 fail. The sixth is `a change to src/ reaches the installed copy with no rebuild step`, in that same file, which the sentence never named.",
            "IT PREDATES THIS SPRINT AND IS STILL THIS SPRINT'S, because the filing bar says a finding inside the sprint's own subject is repaired here even when it predates -- with byte-identity against the base verified and recorded, or it is this sprint's to own.",
          ],
        },
        {
          test: "The branch that lands carries its perturbation as something the suite RE-RUNS: a registry row when it needs a source mutation, an assertion beside the arm when the weakening is a reading of a result the arm already holds.",
          implementation: "Ask first which perturbation still HAS a target here.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "acba6e6",
              message:
                "test(perturbation): record this branch's own weakening, and the blocker beside the states it explains",
              phase: "green",
            },
            {
              hash: "f10f6e9",
              message: "docs(unbuilt-artifact): name the mechanism that terminates the disposition",
              phase: "refactoring",
            },
            {
              hash: "82c1956",
              message:
                "docs(perturbations): the baseline key's firing condition arrived, so measure it",
              phase: "refactoring",
            },
          ],
          notes: [
            "TWO SHAPES, SORTED BY THE RULE THIS SUBTASK STATES AND NOT BY CONVENIENCE. THE REGISTRY ROW is the detector's own weakening -- read THAT the subpath resolved instead of WHICH FILE answered -- because it needs a source mutation in scripts/workspaces.ts. It reads HELD, and its two collateral names are MEASURED: the complete-tree arm stays green under it and every arm requiring a refusal goes red, the ordering arm included, since it cannot observe a refusal that never happened.",
            "THE BLOCKER IS AN ASSERTION BECAUSE ONE ARM CAN HOLD BOTH READINGS: `typeCheckProbe` resolves the framework's subpath today, and the SAME probe with the source arm deleted from its own copy of the manifest cannot resolve it at all. That pair is tree-independent, which the first spelling was not -- an `existsSync(dist)` pair was RED IN THE PERTURBATION STAGE, where nothing is built, for a reason that was not its weakening.",
            "AND THE STAGE REFUSED TWO CANDIDATE ARM FILES, WHICH IS A FINDING ABOUT THE INSTRUMENT RATHER THAN ABOUT THIS SPRINT. test/published-specifier.test.ts cannot be a registry arm file: in a staged checkout `mirrorInstalledDependencies` treats the real framework as an INSTALLED dependency -- its realpath is outside the stage -- and hands the probe a second route, so `the same config fails with TS2307 once the exports entry is removed` is DISARMED there and the baseline refuses the file. The same route is why the blocker's arm had to leave test/artifact-detector.test.ts, which is a registry arm file.",
            "THE BASELINE NOW COVERS EVERY FILE THE REGISTRY NAMES rather than one spelled in the test's own name: a second arm file entering without a baseline would have its records read against no unweakened run at all.",
            "PO ACCEPTANCE, CONDITION 1 -- A FALSE CITATION INSIDE THIS SPRINT'S OWN DELIVERABLE, FOUND BY THE PRODUCT OWNER READING THE SOURCE. The blocker's docstring said the disposition terminates because `the recorded weakening in test/perturbations.test.ts goes GONE QUIET`. THERE IS NO SUCH RECORD: the registry holds three entries over two arm files, neither of them this one, and the note above carries the cause -- the blocker's arm had to LEAVE the file that is a registry arm file, and the sentence was not re-read after the move. SAME-SPRINT FALSITY, which the filing bar repairs here rather than files. Repaired in f10f6e9 with the mechanism that IS in place.",
            "AND THE REPLACEMENT IS MEASURED IN BOTH DIRECTIONS RATHER THAN TRACED, over test/unbuilt-artifact.test.ts alone against 4 pass / 0 fail; `typeCheckProbe` has other callers and they were not re-run. THE HARNESS GAINS A ROUTE THAT DOES NOT END IN SOURCE -- the probe symlinking the built dist/ beside the src/ it already links -- 3 pass / 1 fail, THAT ARM ALONE: half one still exits 0 while half two resolves through the `types` arm and hands back 0 where it demands 1. THE SOURCE ARMS ARE DELETED FROM THE PACKAGE: half one receives `consumer.ts(1,42): error TS2307: Cannot find module '@atusy/tsudoi-language-server/types'` where it requires no output at all. That direction is 0 pass / 4 fail rather than 1, and THE COLLATERAL IS READ RATHER THAN ASSUMED -- the first draft of the comment said all three staged arms die at `stage` with ENOENT, and re-running it found ONE does (the absent-artifact arm, nothing written for its package.json to sit beside) while the other two fail on expectations about which file answered. So the pair reddens on both directions the cost can vanish, and the disposition terminates unattended without depending on a record that does not exist.",
            "PO ACCEPTANCE, CONDITION 2 -- A DISCLOSED FIRING CONDITION ARRIVED IN THIS SPRINT AND WAS ENGINEERED AWAY IN THE SAME COMMIT. The baseline key's docstring licensed leaving itself unwitnessed by `every record today names ONE arm file` and named its firing condition as a FUTURE event: `the day a SECOND arm file enters the registry ... the run is red on the first pass`. THAT DAY WAS acba6e6, which put the second arm file in AND generalised the loop over the files the registry names -- so the paragraph went on describing a state that can no longer occur, which is the conversion of a disclosed hole into an undisclosed one that this sprint's own fifth decision refuses.",
            "SO THE CHEAPER HONEST FORM WAS AVAILABLE AND WAS TAKEN: with two arm files the keyless baseline is a REAL degenerate, and it was RUN rather than predicted. Spelled as the docstring's own alternative -- one baseline for the whole file, `baselines.get(\"\")` -- against 19 pass / 0 fail: 18 pass / 1 fail, THE SECOND FILE'S RECORD ALONE, reading `[REFUSED] ... no arm named <it> ran in test/artifact-detector.test.ts`, while the two records over the first file are untouched because the run they get is the one they wanted. AND THE HALF WORTH MORE THAN THE RED IS THE GREEN BESIDE IT: `every arm in test/artifact-detector.test.ts passes before any weakening` PASSED under the degenerate, having read the OTHER FILE'S run -- an arm named for one file certifying another. The key is what makes that arm's green mean its own file. Repaired in 82c1956.",
            "AND THAT READING IS PROSE BESIDE ITS CODE AND SAYS SO, WHICH IS THE INSTRUMENT'S BLIND SPOT AND NOT AN OMISSION: the weakening is a source mutation in test/perturbations.test.ts, and `reRun` refuses any arm file importing helpers/perturbation.ts -- which that file does. Filed as PBI-72 rather than left as the registry's silence.",
          ],
        },
        {
          test: "Per finding, the weakening it names applied to the SHIPPED source and re-run: the reading that was missing reddens, and the arms the finding is not about stay green.",
          implementation:
            "Close the ONE STRUCTURAL GAP review stage 1 named -- every arm exercising the detector drove it against a fixture that ALWAYS carried a source arm, ALWAYS resolved, and was NEVER this repository's own package, so one point of a three-way state space was pinned and every branch outside it was unasserted. Move each axis, plus the one caught degenerate in the ordering pair.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "7f1a81e",
              message:
                "test(own-subpaths): drive the artifact refusal against the repository it is for",
              phase: "green",
            },
            {
              hash: "8d0e1d6",
              message: "test(artifact-detector): read a subpath that answers from no file at all",
              phase: "green",
            },
            {
              hash: "3c5f8b0",
              message:
                "test(artifact-detector): separate the declaration existing from the declaration answering",
              phase: "green",
            },
            {
              hash: "d1118b2",
              message:
                "docs(workspaces): the wildcard case the `unasked` pair claimed is the other diagnosis",
              phase: "refactoring",
            },
            {
              hash: "53bcbc0",
              message:
                "test(artifact-detector): read the file that answered, not only the file promised",
              phase: "green",
            },
            {
              hash: "751f2ba",
              message:
                "test(artifact-detector): make the ordering pair read the diagnostic, not a colour",
              phase: "green",
            },
            {
              hash: "b77926b",
              message: "docs(workspaces): give the `unasked` pair a firing condition, measured",
              phase: "refactoring",
            },
          ],
          notes: [
            "BASELINE AND CLOSE, BOTH UNPIPED `bun run scripts/definition-of-done.ts`: 889 pass / 0 fail across 60 files, five [PASSED], warnings 1, at 1efc02f -- and 894 pass / 0 fail across 61 files, five [PASSED], warnings 1, at the last commit below. Environment as the sprint's first item recorded it: bun 1.3.13, tsc 7.0.2.",
            "W1 -- THE DETECTOR COULD BE MADE BLIND TO EVERY PACKAGE THIS REPOSITORY SHIPS. test/own-subpaths.test.ts stages a copy of THIS checkout, edits the framework's own build config to emit no declarations, and reads the refusal for tsudoi's own specifier and the SOURCE file that answered in the artifact's place. DEGENERATE RE-RUN, `publishedSubpaths` skipping any manifest whose name begins with this workspace's scope: 5 pass / 1 fail over test/own-subpaths.test.ts and test/artifact-detector.test.ts -- the new refusal arm ALONE, every synthetic arm green, which is the finding restated as a reading.",
            "AND W1's STAGE CANNOT BORROW node_modules, MEASURED THE WAY THE ARM ALMOST SHIPPED WRONG: with the perturbation stage's symlink the UNPERTURBED copy REFUSED, naming files inside the real checkout. The staged handlers' own declarations import the framework specifier, that import resolves out of the borrowed directory into the real tree, and the trace this check reads is last-writer-wins per specifier. So the stage relinks this workspace's scope at its own members and borrows the rest -- what `bun install` would have written there.",
            "W2 -- `NO ANSWER` WAS READ BY NOTHING. Every fixture carried a source arm, so every specifier resolved to something. DEGENERATE RE-RUN with the registry row's `from` honestly updated, `landed !== undefined && (...)`: 4 pass / 1 fail, the new arm ALONE. Its shape is not invented -- a `types` arm and NO source arm is what both handler packages here declare -- and its pair is the same map with the artifact present, which passes.",
            "W3 -- THE WHOLE COMPILER PROBE COULD BE REPLACED BY `existsSync` AND NOTHING REDDENED, because `the declaration exists` and `it answers` coincided in every staged state. They diverge when the map answers SOURCE FIRST: conditions match in declaration order, so a complete artifact sits on disk while every reader is handed src/thing.ts. DEGENERATE RE-RUN, `subpaths.filter(({ declaration }) => !existsSync(declaration))` as the entire offender rule: 5 pass / 1 fail, the new arm alone. The registry row gained the arm BY NAME and still reads HELD.",
            "W4 -- THE `unasked` PAIR'S ONE DOCUMENTED REACHABLE CASE IS MEASURABLY FALSE, AND THE PAIR REMAINS UNWITNESSED. Staged, a wildcard subpath whose arms carry the star reports `@staged/producer/* answers from NOTHING` -- the compiler DOES attempt the specifier -- and never `never reached the resolver`. The prose is replaced by that measurement and pinned by an arm. THE VACUITY IS NOT REPAIRED AND IS DISCLOSED AT ITS SITE: `subpaths.filter(() => false)` re-run leaves 9 pass / 0 fail. Under the shipped rule the pair is redundant with the no-answer branch -- a specifier never reached has no answer, so it is already an offender -- and what it buys is which way a reader is sent. Kept, named unwitnessed, rather than deleted for want of a red.",
            "W5 -- THE MESSAGE PROMISED TWO FILES AND ONLY ONE WAS READ. DEGENERATE RE-RUN, the promised declaration printed in the `answers from` slot: 7 pass / 2 fail -- the module-written arm and W1's own arm, which reads the same property about this repository. The received text is the finding verbatim: `X answers from D, where its `types` arm promises D`.",
            "W6 -- THE ORDERING PAIR NOW READS THE DIAGNOSTIC. Its positive half asserted an exit code alone, and its mirror looked for `broken` -- MEASURED, a word this compiler prints in NO run: it reports `packages/producer/src/index.ts(1,14): error TS2322` and never the identifier. Both halves now read the member's own file path. DEGENERATE RE-RUN with the refusal moved below the member loop: 6 pass / 1 fail, the ordering arm, failing on the half that could not speak before.",
            "W1's WEAKENING IS A SOURCE MUTATION AND IS STILL NOT IN THE REGISTRY, WHICH IS MEASURED AND OWED A REASON, since a perturbation recorded only as prose is not recorded. The instrument re-runs an arm file inside a stage of TRACKED files; test/own-subpaths.test.ts stages a checkout of its own, and in that stage `repoRoot` IS the stage, which holds no `.git` -- both arms fail reading `git ls-files failed in /var/folders/...`, for a reason that is not the weakening. Same class as the blocker already recorded for test/published-specifier.test.ts. A SECOND AND INDEPENDENT REFUSAL stands behind it: `reRun` refuses any arm file importing helpers/perturbation.ts, which this one does for its write guard. Named at the site rather than left as the registry's silence.",
            "AND EVERY WRITE THE NEW STAGE MAKES IS GUARDED, WHICH THE FIRST SPELLING HAD BACKWARDS: the copy loop was checked -- its input is `git ls-files`, which cannot emit a `..` -- while the node_modules directory, each borrowed entry and THE LINK NAMED BY A MEMBER'S OWN MANIFEST were not. That last one takes its path from configuration, which is the rule this repository lost a working tree to.",
            'AND ONE REVIEW CLAIM DID NOT REPRODUCE, RECORDED RATHER THAN QUIETLY ADOPTED. W6 was reported as staying green under the move `even with diagnostics piped`. Re-taken on the arm AS IT STOOD, with the call relocated: 6 pass / 1 fail -- it reddened, on `not.toContain("TS2322")`. What is true and what the repair is for is the rest of the finding: the pair could not tell `the member was reported` from `the member failed silently`, and half of it was vacuous.',
            "PO ACCEPTANCE, NON-BLOCKING -- W4's DISCLOSURE NAMED NO FIRING CONDITION, AND THE PRODUCT OWNER ASKED FOR ONE BECAUSE ITS PRECEDENT IS WHAT JUST WENT STALE: without one a later reader cannot tell whether the state ever became reachable, and infers it from silence. THE SENTENCE THAT STOOD THERE WAS ALSO STRONGER THAN THE MEASUREMENT -- `every state anything here can stage is one the compiler ATTEMPTS` -- and it is measurably false.",
            "MEASURED BY HAND, ONE STAGED MEMBER DECLARING ONE SUBPATH KEY AT A TIME, THREE OF THEM FIRING THE PAIR: `./a\"b`, `./a\\b` and a key carrying a NEWLINE each report `@staged/producer/... never reached the resolver`, while `./a` is refused by nothing. THE MECHANISM IS THE PROBE'S OWN SOURCE and it is two different faults under one heading: the probe writes each specifier into a DOUBLE-QUOTED `import`, so the quote makes that source stop parsing while the backslash is read as an ESCAPE and a DIFFERENT specifier is attempted -- in both the specifier AS DECLARED never reaches the resolver, and the pair sends the reader to the probe, which is where the fault is. No map in this workspace has such a key; that is now a statement with a shape behind it rather than a silence. Named in b77926b, and NOT armed -- the vacuity reading is unchanged and the site still says so.",
          ],
        },
      ],
      impediments: [
        {
          description:
            "codex could not be run, so this sprint has had ONE review stage. The same configuration error, two sprints running.",
          impact:
            "Every finding this sprint acted on came from one reviewer. A second stage is what has historically found the class the first misses, and its absence is a gap in the evidence rather than a claim that none remain -- so the sprint's greens say what one reading of them says and no more.",
          request:
            "Repair the codex configuration, or rule that one review stage is the standard for this repository so the expectation stops being restated per sprint.",
          status: "waiting_human",
          notes: [
            "FILED AT THE MOMENT AND NOT AT CLOSE, which is what the product owner required last sprint: recorded as a decision after the fact it reads as a choice this sprint made, and it is neither a choice nor this sprint's to make.",
            "NO COMPENSATION WAS ATTEMPTED. Inventing findings to stand in for the missing stage would put unmeasured work beside measured work with nothing separating them, which is worse than the gap.",
          ],
        },
      ],
      decisions: [
        "THE CITATION IS LEFT UNASSERTED RATHER THAN PROPAGATED: the facilitator's tasking called this the residue one sprint shipped open and the item's own note names a different one. Neither is asserted here -- it is THE RESIDUE THE MOVE SHIPPED OPEN -- because this record has a case of a number standing unchallenged for thirty sprints, and a wrong one repeated is the failure it punishes.",
        "BRANCH TWO IS AN ACCEPTABLE CLOSE ONLY WITH ALL FOUR: the deletion was TAKEN and not reasoned about; the blocker is NAMED TO A FILE -- which specifier, in which file, read by which reader, failing with what text, in which state -- because `something would break` is not a cost and neither is a count; the blocker is recorded AS A RE-RUN and not as a note, since this dashboard's header says a perturbation recorded only as prose is not recorded; and the residue's prose does not multiply, every surviving copy carrying the POST-move measurement.",
        "AND IT IS NOT THE TEST THE ITEM REFUSES -- SAY SO AT THE SITE OR A REVIEWER WILL FILE IT AS ONE. The refused test asserts THE RESIDUE and would pass for as long as the residue persists, specifying it. The permitted record asserts THE BLOCKER and stops holding the moment the blocker does. Opposite failure directions, and that asymmetry IS the terminating mechanism: branch two ends with the decision reopening itself, unattended.",
        "FAILURE TO DELIVER REGARDLESS OF TREE COLOUR: the arm kept and the output is better paragraphs; or the cost quoted from the pre-move layout; or the deletion never attempted. AT REVIEW THE PO ASKS ONE QUESTION -- what did the deletion produce, byte for byte -- and no answer is a failure.",
        "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: the arm deleted, the absent state staged and diagnosing, THE PARTIAL STATE NEVER STAGED, and the prose warnings deleted as fixed. The criterion names both states because the pack window is the one a person actually stands in, and absent-only is the shortcut a green tree cannot catch -- removing the warnings on evidence covering one state converts a NAMED residue into an UNNAMED one, which is strictly worse than shipping it open again. The same refusal covers a diagnostic MANUFACTURED by a mapping or a project reference: there is none anywhere now, a refusal enforces it, and an error produced that way grades a resolution no stranger performs.",
        "PBI-60 DOES NOT CLOSE, AND THE PRODUCT OWNER CALLED THAT THE HONEST OUTCOME RATHER THAN A SHORTFALL. The SPRINT GOAL'S second disjunct is met -- the cost that prevents the diagnostic is now a check that reddens the day the cost is gone -- while the ITEM'S criterion, which asks what reads the artifact to NAME A FILE, is not: a bare `tsc --noEmit` on an unbuilt checkout still answers the framework's own subpaths from source at exit 0. The item is RE-NARROWED to exactly that, carrying the five cells verbatim and BOTH foreclosures, rather than closed on the disjunct or left whole.",
        "BOTH ACCEPTANCE CONDITIONS WERE FOUND BY THE PRODUCT OWNER READING THE SOURCE, WITH NO SHELL, AFTER THE ONE REVIEW STAGE HAD CLOSED -- which is the SECOND SPRINT RUNNING that the reader after the last one found what the stage did not. That is evidence for the impediment above rather than a comment on it: `two stages are better than one` is an argument, and `the reader after the stage found the sprint's own false sentence, twice` is a measurement.",
        "AND ONE THING THE PRODUCT OWNER NAMED AND DELIBERATELY DID NOT ASK FOR, recorded so a later reader does not file its absence as a miss: the fifth check's header still licenses withdrawing the root check by a mapping that exists nowhere. LEFT STANDING ON PURPOSE -- its subject is member resolution rather than the exports arm, it is already filed into PBI-62 with byte-identity evidence at its own base, and re-filing it buys nothing.",
      ],
    },
    {
      number: 57,
      pbi_id: "PBI-70",
      goal: "A recorded perturbation is something the suite RE-RUNS, so an arm that has stopped noticing its own predicate being weakened reddens on the next run instead of at the next review.",
      status: "done",
      subtasks: [
        {
          test: "None -- a READING, and it decides how much machinery the rest of the sprint needs.",
          implementation:
            "Take each weakening this sprint would record and sort it into two piles: those expressible as DATA THE ARM ALREADY READS -- an options object handed to two programs, a declared output directory's value, an index entry -- and those that need a SOURCE MUTATION. A data-expressible weakening is an ordinary arm asserting that the fixture discriminates: no tree copy, no inner build, no suite inside the suite.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "9089e64",
              message: "docs(scrum): sort the weakenings, so only the second pile is built",
              phase: "green",
            },
          ],
          notes: [
            "MEASURE THE FORK BEFORE BUILDING THE MACHINERY. Several of the filed instances are data-expressible, and if most are, this sprint is small -- only source mutations need an executor at all. This moves the cost by an order of magnitude and moves no ruling.",
            "THE SORT, AND IT IS FOUR TO TWO. DATA-EXPRESSIBLE, all four of them arms over the executor this sprint builds, because each one's adjacent weaker reading is a reading of a RESULT THE ARM ALREADY HOLDS: (1) the GONE QUIET arm, whose weaker reading is `THE RUN reddened` where the property is `THE NAMED ARM reddened`; (2) the DISARMED arm, whose weaker reading is `the named arm is red under the weakening` with no baseline taken; (3) the attribution arm, whose weaker reading is the process exit code and which shares the first's fixture property; (4) the reporting arm, whose weaker reading is a pass obtained by running no record at all. SOURCE-MUTATION: the seeds standing over real arms elsewhere, which are source edits to `scripts/definition-of-done.ts` re-run against `test/definition-of-done.test.ts`. So the executor is built for the second pile only, which is the pile the PO made mandatory -- the fork does not gut the sprint, it bounds it.",
            "AND A DATA-EXPRESSIBLE RECORD IS AN EXPECT AND NOT AN ARRANGEMENT, which is the half that makes the sort honest rather than a way of counting four things as free. A throwaway in which the named arm stays green while another reddens DISCRIMINATES the exit-code reading -- but only while it does, and nothing announces the day an edit makes every arm in it redden. So each of the four carries the discrimination as its own assertion beside its subject: the run's exit is non-zero AND the named arm's own result is a pass. Without that pair the perturbation is recorded as the author's arrangement, which is this sprint's own diagnosis in a different font.",
            "MEASURED, AND IT IS WHY THE EXECUTOR RUNS THE ARM'S FILE UNFILTERED: `bun test <file> -t <name>` matching exactly one arm reads `1 pass / 0 fail`, so the RUN'S AGGREGATE and THE ARM'S OWN RESULT are extensionally equal under it -- this item's own class, arriving in the cheapest possible implementation of it. `--reporter=junit` emits a `<testcase>` per arm INCLUDING the passing ones, so one unfiltered run carries the named arm's result and every other arm's, and the attribution control costs nothing extra.",
            "THE COST OF THE SECOND PILE, MEASURED ON THIS MACHINE UNDER BUN 1.3.13 SO THE FORK IS A NUMBER AND NOT A FEELING: staging every tracked file is 181 files and 45 ms, and the staged `test/definition-of-done.test.ts` runs at 7.1-7.5 s with node_modules symlinked and bunfig.toml removed -- 15 pass / 0 fail, no inner build, no dist copied. What the instrument cannot separate: that reading is one file's, and a record whose arm needed a freshly built dist/ would fail in this stage for a reason that is not its weakening.",
            'THE TWO SEEDS MEASURED BEFORE ANYTHING WAS WRITTEN, because a record whose required red was never observed is the prose this sprint exists to retire. The gate weakening -- `result.outcome !== "passed"` to `result.outcome === "failed"` -- reddens the gate arm AND the refusal arm beside it, so that record carries a second name rather than a claim that one arm is all of it. The warning-total weakening -- the reduce replaced by the first element -- reddens exactly one arm and nothing else, which is why it is the one to point at when the instrument\'s attribution is described.',
          ],
        },
        {
          test: "A recorded perturbation whose NAMED ARM no longer reddens fails, and the same registry over the unmutated tree passes. THE REQUIRED DEGENERATE, run before the arms are believed: a runner that reads the MUTATED RUN'S PROCESS EXIT CODE instead of the named arm's own result.",
          implementation:
            "The executor rides the first check. Each record carries a mutation, a named arm, and a required red; applying it and reading THAT ARM'S OWN RESULT needs no heuristic.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "e9cd265",
              message:
                "test(perturbation): re-run a recorded perturbation, and read the ARM's own result",
              phase: "green",
            },
          ],
          notes: [
            "ATTRIBUTION IS THE ACCEPTANCE CONDITION AND IT IS THIS ITEM'S OWN RULE TURNED ON THE INSTRUMENT BUILT TO ENFORCE IT: a mutation that breaks compilation reddens everything, and `the named arm reddened` is then satisfied for the wrong reason. AN ARM OVER A GATE STANDS WHERE NOTHING ELSE IS RED. Two states producing one red is this tree's recorded defect.",
            "IT RIDES THE FIRST CHECK AND IS NOT A SIXTH ONE, and not a script a person invokes: a runner that must be remembered is the failure the previous sprint named.",
            "WHAT REDDENS IS EXACTLY THE TWO OUTCOMES THIS PROJECT'S OWN VOCABULARY CALLS DEFECTS -- GONE QUIET and DISARMED. It is SILENT about arms with no record, and that silence is honest rather than a green.",
            "THE REQUIRED DEGENERATE, RUN BEFORE THE ARMS WERE BELIEVED AND MEASURED TWICE -- once on the file as first written and once on the file as committed, because a guard and an arm were added between them. The reading is unmoved: a runner returning `held` the moment the mutated run's exit is non-zero leaves 3 pass / 6 fail. The three survivors are the two arms that never call the reader -- the `from` arity refusal and the throwaway-path refusal -- and the stage arm, and that is the honest boundary of what the degenerate reaches.",
            "THE OTHER FIVE DEGENERATES, EACH REDDENING EXACTLY THE ARM NAMED FOR IT, 8 pass / 1 fail every time: the baseline dropped, so an arm already red reads held; the recorded red set compared by CONTAINMENT rather than equality; an absent arm defaulted to `passed`, so a deleted arm reads GONE QUIET instead of refused; the report line replaced by a constant; and the guard's own two directions -- refusing nothing takes the guard arm alone, refusing everything takes all nine. AND ONE MORE, AIMED AT THE STAGE: `applyWeakening` made a no-op reads 3 pass / 6 fail, which is the arm this sprint could not perturb the obvious way.",
            "A DEGENERATE THAT MISSED, RECORDED BECAUSE IT IS THE RULE ITSELF ARRIVING IN MY OWN HAND: the first aim at the absent-arm refusal defaulted only the MUTATED run's lookup to `passed` and left the baseline's alone, so the refusal still fired on the baseline and the file read 9 pass / 0 fail. A perturbed input that is not in the program the assertion reads cannot make it fail. Re-aimed at both lookups, it reddens its arm and nothing else.",
            "WHAT THE SPRINT PAID TO LEARN, AND IT IS INSIDE THIS ITEM'S OWN SUBJECT RATHER THAN BESIDE IT: A HAND-RUN DEGENERATE DELETED THE WORKING TREE. The perturbation made `stageCheckout` hand back the CHECKOUT ROOT -- which is the honest weakening of `the stage is a throwaway` -- and the arms' `afterEach` then ran `rmSync(root, { recursive: true, force: true })` on it, taking the worktree and `.git` with it. THE TRACKED HISTORY CAME BACK IN FULL from `origin/main` at dd4fbd9, which had every commit; the Definition of Done was re-taken on the restored checkout and read 862 pass / 0 fail across 57 files, five [PASSED], warnings 1 -- byte for byte this sprint's base. WHAT DID NOT COME BACK IS THE UNTRACKED HALF, AND IT IS NAMED FIRST BECAUSE IT IS THE ONLY IRREVERSIBLE LOSS: a top-level `__ignored/` directory, present at the sprint's first listing, gone -- `git ls-files` never staged it, so no copy of it exists anywhere. CLAUDE.md, globally gitignored, was rewritten from this session's own copy and is NOT verifiable against history. Anything else untracked cannot be enumerated after the fact, which is itself part of the loss. LOST AND RE-MADE: one scrum.ts-only commit, its content unchanged.",
            "AND THE DIAGNOSIS IS NOT `THAT DEGENERATE WAS TOO DANGEROUS`, WHICH IS THE READING THAT WOULD LET THE CLASS THROUGH AGAIN. The destructive end read the RIGHT QUANTITY -- a path -- against a subject that could not discriminate a throwaway from the repository, because nothing asked; the value's producer was doing its job. That is this item's class exactly, arriving in the machine built to retire it, which is the third time this project has recorded that shape. THE REPAIR IS ON THE DELETE: `throwawayOnly` refuses any path outside the system temporary directory, both in the stager's own dispose and in the arms' sweep, and it has an arm with both directions. A note saying `do not point a stager at the checkout` forecloses nothing -- a TMPDIR that resolves oddly or an early return added later reaches the same rmSync with the same silence.",
            "THE TWO ARMS THAT DO NOT GO THROUGH THE READER GOT THEIR OWN DEGENERATES, because D9 reddened one of them for the wrong reason -- a guard refusing everything is not evidence that a guard guards. The arity refusal narrowed from `not exactly one` to `none`, which is the reading that lets a `from` occurring TWICE through: 11 pass / 1 fail, its own arm alone. And the report parsed into an EMPTY MAP rather than from bun's bytes, which is the state the baseline arm's absent-half pair exists for -- an empty failure list and a reader that opened nothing are one observation without it: 4 pass / 8 fail, the baseline arm among them.",
            "THE STAGE ARM'S DEGENERATE IS THE SAFE HALF OF THAT PAIR, DELIBERATELY, AND THE COST IS STATED: `the weakening never reaches the working tree` is now witnessed by the refusal firing on the checkout root rather than by pointing a live stager at it. The measured reading from the unsafe direction stands as taken -- the arm reddened, 7 pass / 1 fail -- and is NOT reproduced.",
            "REVISE STAGE 1: SEVEN FINDINGS OVER THIS INSTRUMENT'S OWN ARMS, EACH REPAIRED AND EACH RE-RUN AFTER THE FIX, one commit per finding. FOUR WERE ARMS GREEN UNDER A WEAKENING OF THE THING THEY ARE NAMED FOR. (1) THE SAFETY GUARD THIS TREE PAID FOR IN ITS OWN HISTORY sampled two checkout paths and one throwaway, over which `not under the checkout` and `under the throwaway` are one predicate -- narrowed to the first, message unchanged, the file stayed 12 pass / 0 fail while a home directory became a legal argument to the recursive delete. A third sample under NEITHER lands; degenerate re-run 11 pass / 1 fail, that arm alone. Commit c4a312f. (2) THE COLLATERAL SET was witnessed in one direction only, and two comments called it compared for equality `and never for containment`: relaxed to `every observed name is required`, 12 pass / 0 fail. A stale recorded name -- what a rename leaves -- now reads DISARMED where the relaxation reads HELD; degenerate 12 pass / 1 fail. Commit b1389a3. (3) THE REPORT'S LABEL: the arm read two of four, so REFUSED and DISARMED printed alike under a constant non-held word, 12 pass / 0 fail -- and those two are the pair whose repairs are opposite. All four labels are read now; degenerate 12 pass / 1 fail. Commit 038b3dc. (4) `THE STAGE IS THE TRACKED TREE` was asserted by nothing -- a copied file, an unchanged working tree, an absent config and a present directory are all true of a stager that copies everything. The stage's files now equal the ARM'S OWN `git ls-files` minus bunfig.toml, spelled a second time deliberately because an arm reading the stager's enumeration moves with it; degenerate, the stager widened with `--others` and one untracked file planted, 13 pass / 1 fail. The registry's claim that an untracked arm file fails LOUDLY is now a probe too. Commit 6e4de2c.",
            "THE THREE GUARDS NO ARM CLAIMED WERE DECIDED ONE BY ONE AND NOT ARMED REFLEXIVELY. ARMED: the recursion refusal, kept with its substring shape and both wrong directions named at the site -- degenerate, the DETECTION deleted, 15 pass / 1 fail, that arm alone. Commit 24ebdef, corrected by caaf376. ARMED: the XML unescaping, because this suite's arm names are English sentences and the state is one apostrophe away, and what an unescaped key costs is a REFUSED that sends the author to edit a record that is right -- degenerate, the unescaping made the identity, 15 pass / 1 fail. Commit f6d1dfc. LEFT: the per-arm-file baseline key, because over one arm file `by file` and `by nothing` are one function and the probe separating them would be a record invented to exercise a Map -- what makes it fire is written at the site, and it fires LOUDLY on the first run after a second arm file lands. Commit 1334c42. AND ONE EXPRESSION DELETED RATHER THAN ARMED: a chunk split on the delimiter it came from, equal to its input on every report bun can write, taken as its own structural commit at 878 pass / 0 fail either side. Commit 85885f7.",
            "A SHIPPED REASON MEASURED FALSE WHILE ARMING THE THING IT LICENSED, WHICH IS THIS PROJECT'S OWN RECORDED CLASS ARRIVING AGAIN: the report reader's chunking was justified by `bun does not escape > inside an attribute value`. MEASURED on bun 1.3.13 -- the version that same docstring already cites -- a name carrying `<`, `>`, `&`, `\"` and `'` comes back with all five written as entities, so an element regex would find the tag's end today. The chunking is KEPT for the reason it actually has (it never asks where a tag ends, which is the reporter's property and pinned by nothing) and that reason is labelled unwitnessed, since a bun that escapes cannot produce the state it is for.",
            "A DEGENERATE WAS WITHHELD ON A HAZARD THIS TREE DOES NOT HAVE, AND THE CORRECTION IS THE ROUND'S OWN SUBJECT ARRIVING IN MY HAND. The recursion refusal was armed with only its safe half run -- the throw downgraded to a returned verdict, 14 pass / 1 fail -- and BOTH the new comment and the inherited one said the other half starts a spawn tree with no bottom. That is a mechanism the code denies, which is this dashboard's most-filed class, and it shipped in the commit that repaired six of its siblings. MEASURED: `repoRoot` is module-relative, so at the second level it is the STAGE, the stage carries no `.git` and no parent of a temporary directory does either, `git ls-files` exits 128 and the stager throws -- the chain stops at depth 2 in 264 ms. The full degenerate was then taken: 15 pass / 1 fail, that arm alone. THE REFUSAL STAYS ON ITS HONEST GROUND: the bottom is an accident of how the stage is built, and what arrives without the refusal is a red naming neither the record nor the recursion. WHAT THE ORIGINAL RULING STILL COVERS, UNAMENDED: a perturbation whose subject is a RECURSIVE DELETE is reasoned about and not run -- that is the stage arm's disposition and this sprint's own history, and no reading here weakens it. Commit caaf376.",
            "AND HOW THAT ENTRY IS TO BE READ, ON THE PRODUCT OWNER'S RULING, BECAUSE ITS OWN WORDING INVITES THE WRONG ONE: IT IS THE BEST THING IN THIS PROCESS RECORD AND NOT A LINE IN AN ERROR RATE. A comment was written, the measurement that falsified it was taken IN THE SAME ROUND BY THE AUTHOR, the withheld degenerate was then run, and the correction shipped before anyone else read the file. This project already has the discriminator and applies it everywhere else: WHO CAUGHT IT -- author-caught is DETECTION, and what would refute the practice is an instance found by someone other than its runner or after the increment closed. Counting self-corrections as defects is the incentive that stops them being written down at all, and a record whose corrections are invisible is the one this dashboard exists to prevent.",
            "WHAT THE ROUND COST THE SUITE AND WHAT IT DID NOT MOVE: the Definition of Done was taken with `bun run scripts/definition-of-done.ts` before every commit of the round and read five [PASSED] and warnings 1 every time; the suite went 874 -> 878 pass / 0 fail across 58 files, and no check was red at any commit.",
            "REVISE STAGE 2, ONE FINDING, AND IT IS THIS ROUND'S OWN CLASS FOR THE EIGHTH TIME: THE GUARD COVERED THE DELETE AND NOT THE WRITE ONE LINE IN FRONT OF IT. `throwawayOnly` stood on `stageCheckout`'s creation-time value and inside `dispose` and nowhere else, so `applyWeakening` and `runArmFile` -- two of the FOUR filesystem-mutating ends in that module -- asked nothing at all. It was found by the product owner READING THE SOURCE, with no shell.",
            "REPLAYED SAFELY IN A COPY OF THIS CHECKOUT RATHER THAN REASONED ABOUT, and what makes the copy exact is the same property the recursion measurement used: `repoRoot` is module-relative, so inside a copy it IS the copy and the accident's own degenerate has the copy as its target. TWO SPELLINGS, AND THEY DO NOT BEHAVE ALIKE. THE PO'S -- creation-time guard left intact, only what the function RETURNS degenerated to the checkout root -- reaches every step they described: `applyWeakening` WROTE THE WEAKENED SOURCE INTO THE WORKING TREE, `runArmFile` ran there and left `perturbation-report.xml` at the root, `dispose` then correctly refused to delete, and nothing restored the file. THE OTHER -- the temporary directory replaced by the checkout root where it is MADE -- never returns at all, and is worse: MEASURED on bun 1.3.13, `cpSync(src, src)` is a silent no-op at 105 KB and DESTROYS the file at 270 KB, so the stager's copy loop deleted `scrum.ts`, the 202 KB dashboard, and threw `ENOENT ... copyfile` before the return. THE PO'S READING IS CONFIRMED AND THE CHEAPER SPELLING IS WORSE THAN EITHER OF US SAID.",
            "THE DELIVERABLE IS THE PROPERTY AND NOT THE TWO SITES: every filesystem-mutating end in that module now asks whether its path is inside a throwaway IT MADE, before acting. BOTH MECHANISMS, WITH THE REASON IN ONE COMMENT AT THE TYPE: a nominal `ThrowawayPath` produced only by the guard and demanded by every mutating signature is delivered BY THE COMPILER at the moment the violating line is written, and a guard call at each site is what survives a hand-written degenerate, WHICH CAN CAST -- and a hand-written degenerate is what this repository lost a tree to. MEASURED IN BOTH DIRECTIONS IN THE COPY: the accident's own degenerate no longer compiles (`TS2322` at `stageCheckout`'s return) and neither does a probe stager handing back an unguarded string (`TS2322` at its return); with the guard CALL deleted from `applyWeakening`, 16 pass / 1 fail, and from `runArmFile`, 16 pass / 1 fail, the stage arm alone each time.",
            'AND THE ARM STANDING OVER THE DESTRUCTIVE SIDE WITNESSED ITS SECOND CLAUSE FOR EXACTLY ONE RECORD\'S DATA, which is this item\'s class arriving in the arm over the destructive side in the sprint whose accident WAS a destructive side: over the whole fixture, `no write can leave the stage` and `this record\'s file happens to be relative and clean` had identical truth values. It now asserts the refusal for the checkout root, for `""` and for `"."` -- the last two because every join under them goes relative and this project MANDATES the checkout root as the working directory, which is what makes them the cheapest spelling of the accident. IT IS SAFE UNDER ITS OWN DEGENERATE BY CONSTRUCTION, DESIGNED RATHER THAN LUCKY: its `from` occurs in no file, so with the guard deleted `applyWeakening` reads, counts zero and refuses on the ARITY -- no ordering reaches a `writeFileSync` -- and what separates the readings is therefore the MESSAGE and not the throw.',
            "THE PREDICATE RODE THE SAME COMMIT AND IS THE SAME DEFECT ONE STEP OVER: `throwawayOnly` tested `under the temporary directory` ALONE while its own docstring named `a TMPDIR that resolves oddly` as the motivating scenario -- and one resolving INTO the checkout passed it and licensed the delete. The checkout is conjoined now, with its OWN message, because two states printing one word are one state and the repairs are opposite. THE CONJUNCTION NEEDED ITS OWN ARM, AND THE FIRST DRAFT PUT IT IN THE GUARD ARM WHERE IT COULD NEVER BE THE FIRST THING TO FAIL -- measured, with the clause deleted that arm reddens on its own first line and the reading is never taken. Split out, the clause-deleted degenerate reads 14 pass / 3 fail with that arm among them. Over every path on an ordinary machine the two clauses are ONE predicate, so the witness MOVES `TMPDIR` -- measured, bun re-reads it per call -- and it BORROWS AN EXISTING TRACKED DIRECTORY as the temporary root, so the arm's own setup writes nowhere.",
            "WHICH OF THE FOUR ENDS HAVE ARMS OVER THEIR GUARD CALLS, SAID PLAINLY SO THE PROPERTY IS NOT READ AS FOUR ARMS: three do -- the two writes and the delete. `stageCheckout`'s OWN writes are covered by the type and by the creation-time guard standing immediately above them WITH NO ARM, and deliberately: no caller can hand that function a different root, so there is no route from which a probe could reach those three calls. The second half of the guard -- a path refused for where it LANDS rather than for which root it was joined onto -- is armed, over a record whose file climbs out of a genuine throwaway.",
            "TWO RESIDUES NAMED AT THE SITE RATHER THAN FIXED. The stage borrows `node_modules` BY SYMLINK into the real checkout, so a target under it is lexically inside the stage and physically inside the repository -- the lexical guard passes it; nothing a record weakens lives there, since a record names a TRACKED file. And the report-file guard is NOT safe by construction the way the three write guards are: with it deleted the arm spawns one run over a file the checkout does not have, which is why that degenerate was taken in a copy -- measured, that run left no report at the root, and nothing makes that a guarantee.",
            "WHAT STAGE 2 COST THE SUITE: 878 -> 879 pass / 0 fail across 58 files, the one new arm being the TMPDIR clause's; the Definition of Done was taken with `bun run scripts/definition-of-done.ts` before each commit and read five [PASSED] and warnings 1 every time.",
          ],
        },
        {
          test: "The seeds: every arm THIS SPRINT touches, plus AT LEAST ONE record standing over a real arm elsewhere in the suite.",
          implementation: "None beyond writing the records.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "83464a9",
              message: "test(perturbation): seed two perturbations this tree had only written up",
              phase: "green",
            },
          ],
          notes: [
            "THE SECOND SEED IS MANDATORY OR THE INSTRUMENT'S ONLY EVIDENCE IS SELF-REFERENTIAL, which is why the previous sprint staged the five real checks. HISTORICAL SEEDS ARE OPPORTUNISTIC AND BUDGETED AT NONE; where a target is gone, record TARGET DELIBERATELY REMOVED rather than dropping it.",
            "EVERY SEED STANDS OVER A REAL ARM ELSEWHERE AND NONE OVER THIS SPRINT'S OWN, so the mandatory half is met with room rather than exactly. The gate narrowed by a word, and the warning total taken from the first element -- each was run ONCE in the sprint that found it and written up in the comment beside its arm, which is the exact shape this item calls not-recorded. Each reads HELD on the tree as committed, and the report names them.",
            "THE ARMS THIS SPRINT TOUCHED CARRY THEIR PERTURBATION AS AN ASSERTION AND NOT AS A ROW, which is subtask 1's sort arriving at its consequence rather than a shortfall: their weakenings are readings of a result the arm already holds, so the pair that separates the readings sits beside the subject and re-runs with the suite. A row in the registry for any of them would stage a tree and spawn a run to re-derive a line already there.",
            "THREE DEGENERATES OVER THE REGISTRY'S OWN DATA, EACH REDDENING EXACTLY ITS OWN RECORD'S ARM, 11 pass / 1 fail every time -- and the third is the one worth the cost, because it is the reading a subset test would lose. A `from` edited so it no longer occurs: REFUSED, and the run is 42 ms because nothing is spawned. A weakening replaced by an edit that changes no behaviour: GONE QUIET, the arm reporting that it no longer reddens on what is recorded against it. And the gate record's second name DROPPED: DISARMED, naming the refusal arm as the red the record does not account for.",
            "HISTORICAL SEEDS TAKEN: NONE, as budgeted. The three instances this item's criterion cites as starting evidence were each REPAIRED IN THE SPRINT THAT FOUND THEM, per that sprint's own record -- the output-directory comparison folded, the reference message's second repair named, the arm whose name said `tracked` narrowed. THAT IS READ OFF THE RECORD AND NOT OFF THE ARMS, which were not re-read here, so it is filed as the reason none was seeded rather than as a claim about what those arms defend today.",
            "WHAT THE SEEDS COST THE SUITE, MEASURED RATHER THAN ESTIMATED: 874 pass / 0 fail across 58 files at 102.44 s, against this sprint's base of 862 across 57 at 80.92 s. Three staged runs buy it -- one shared baseline and one per record -- and the stage itself is 45 ms of the 7 s. What the reading cannot separate: this machine, one file, and a suite that runs its files in sequence.",
            "THE STANDING RE-RUN, TAKEN THROUGH THIS SPRINT'S OWN INSTRUMENT, AND ITS TARGET SURVIVES: the previous increment's summary-word perturbation -- the verdict hardwired to `PASSED` -- run against the arm named for it. IT REDDENS THREE ARMS AND NOT ONE: the verdict arm, the gate arm and the refusal arm, the last two because each asserts `Definition of Done: FAILED` in its own report. Stated with no second name the instrument reads DISARMED and says which red it cannot account for; with the two names measured in, HELD. THAT IS THE READING THE PROSE COULD NOT CARRY -- the sprint that filed it recorded `12 pass / 0 fail`, a size, taken before the arm existed, which names nothing and cannot be checked against this tree.",
            "AND IT IS LEFT AS A READING RATHER THAN A THIRD ROW, DELIBERATELY: historical seeds are budgeted at NONE and the mandatory half is already met twice, so adding one after the fact would be scope arriving through a finding. It is a one-line seed for whoever wants it, with its collateral already measured above.",
          ],
        },
        {
          test: "None -- the ruling.",
          implementation:
            "A perturbation recorded ONLY AS PROSE IS NOT RECORDED, filed in this dashboard's header beside the filing bar and the review round's standing instruction.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "6b48e0d",
              message:
                "docs(scrum): rule that a perturbation written up is not a perturbation kept",
              phase: "green",
            },
          ],
          notes: [
            "WITHOUT THIS HALF THE SPRINT IS THE FIFTH RESTATEMENT WITH AN EXIT CODE, and the PO will not accept it as this item's work. The alternate spelling here is PROSE IN A SPRINT NOTE, and this header is the established home for exactly that shape -- it is there because skill delivery is what fails under load.",
            "THE RULING AS FILED CARRIES A SECOND ARM THE PLAN DID NOT NAME, and it is subtask 1's sort arriving in the ruling itself: a record the suite re-runs is a weakening, a named arm and a required red WHEN the weakening needs a source edit, and an ASSERTION BESIDE THE ARM when it is a reading of something the arm already holds. Without that clause the bar reads as `every perturbation becomes a registry row`, which would have this sprint's own nine arms staging trees and spawning runs to re-derive lines already written down.",
            "AND IT SAYS WHAT NOTHING CHECKS, IN THE SAME BREATH, because a bar stated alone is read as a green: no check decides whether an arm HAS a record, that detector is refused by name, and `the adjacent weaker reading` is a judgement nothing verifies. The registry's silence is honest and the bar binds the author.",
            "THE MEASURED FAILURE MODE IS NOT `NO PERTURBATION WAS RUN`: these records are full of perturbations. It is that each was run ONCE and recorded as PROSE, in a dashboard whose own header says a decision may only be compacted into a home that OUTLIVES A CONTEXT WINDOW -- and a note is not such a home. The manual compensator is known not to reach: the standing re-run carries its own measurement that nearly every earlier perturbation aimed at something that no longer existed.",
          ],
        },
      ],
      impediments: [
        {
          description:
            "THE SECOND REVIEWER OF THE FIRST REVISE ROUND FAILED WITH A CONFIGURATION ERROR BEFORE READING ANYTHING, so that round's adversarial reading is one reader's. FILED LATE AND LABELLED AS SUCH: it was recorded at the time as a DECISION, which is a sentence about coverage rather than a thing with a request attached, and the error text was never captured -- so what this entry can carry is the failure and not its diagnosis. THAT LOSS IS THE EVIDENCE FOR THE RULE the decisions now hold: a reviewer that fails is an impediment at the moment it happens, with its error.",
          impact:
            "MEASURED RATHER THAN FEARED, WHICH IS WHY THIS IS NOT A GENERAL WORRY ABOUT REVIEW: the round closed at seven findings, and the EIGHTH of the same class -- the guard covering the deletes and not the two writes beside them -- was then found by the product owner reading the source. So the single stage was not saturating, and the cost of the failed reviewer is one round of repairs that had to be paid for a second time, in a sprint whose own accident had already destroyed a working tree.",
          request:
            "Nothing is asked of the human for THIS sprint -- the eighth finding is repaired and its degenerates are re-run in both directions. What is asked is for the next sprint that loses a reviewer: file it here, at the time, with the error, so the next round can decide whether to re-run the stage rather than learning at acceptance that it was thin.",
          status: "resolved",
          notes: [
            "RESOLVED MEANS THE FINDING THE MISSING READER WOULD HAVE CAUGHT IS REPAIRED, AND NOT THAT THE REVIEWER RAN. The distinction is kept because the opposite reading is how a gap becomes a green: nobody re-ran the second stage, and no claim is made here about what a second reader would have found beyond the one instance that did reach us.",
          ],
        },
      ],
      decisions: [
        "THE MACHINE CANNOT DECIDE COVERAGE AND CAN DECIDE FIDELITY, EXACTLY. A check deciding whether an arm HAS a perturbation is an approximate detector, and this project has refused that shape by name -- its failure mode is a GREEN CERTIFYING THE CLASS AS WATCHED. That half stays unmechanised AND THE SPRINT SAYS SO IN ITS OWN TEXT. What is exact is that a perturbation, once recorded, is a mutation, a named arm and a required red.",
        "REFUSED IN ADVANCE SO NO SPRINT IS SPENT ON THEM: any coverage detector in any spelling, including one scanning a diff for touched arms and cross-referencing a registry -- it reddens on a formatting-only touch and its matching is lexical over free text; a mutation-testing framework or any mutation SCORE, since generated mutants are not `the adjacent weaker reading of THIS predicate` and a survival percentage is the coverage number arriving through arithmetic; a backfill sweep of the existing corpus, which is the tail item by the back door; a skill as the deliverable; a sixth Definition-of-Done check; and any aggregate word in the report.",
        "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: a green that can be read as a statement about arms NOT in the registry. Falsifiable form -- the report NAMES the arms it weakened, any count is computed at run time and written down nowhere, and no tracked prose claims the registry is complete.",
        "DISCLOSED AT PLANNING RATHER THAN LEFT FOR REVIEW: the machine executes fidelity, but `the ADJACENT weaker reading` is a semantic judgement nothing verifies -- no check stops a record whose mutation is arbitrary or trivially detectable rather than genuinely one step weaker. A residue named before close is disclosure; the same thing found at review is a defect.",
        "STAKEHOLDER RULING, ASKED FOR AS A GATE AND ANSWERED AS A DELEGATION: SO LONG AS THE ITEM'S ACCEPTANCE CRITERIA ARE HONOURED, HOW SUBTASKS ARE HANDLED IS THE DEVELOPER'S. The record MAY be made mandatory if it is needed -- AND IT MUST NOT BECOME A SHACKLE. So the developer's second design, which would make the schema refuse a completed subtask carrying no perturbation record, is THEIRS TO TAKE OR LEAVE rather than something waiting on a ruling; the type section's `request human review` was read as a gate over the mechanism when the gate is only over the SCHEMA'S SHAPE.",
        "AND THE SHACKLE TEST IS WHAT DECIDES IT, applied to the design's own named costs: a field required of every completed subtask would force a perturbation record TO BE INVENTED AT PLANNING TIME, which installs theatre by construction; and it reddens every historical completed subtask on day one, which is the tail item's sweep arriving through the type system as unplanned work. Both are the shackle the stakeholder named. WHAT PASSES THE TEST IS AN OBLIGATION THAT ATTACHES WHERE THE CLAIM IS MADE -- to an arm that says it defends a predicate -- and never to the act of closing a subtask.",
        "A RED DEFINITION OF DONE WAS TAKEN DURING THIS SPRINT AND IS RECORDED AS ONE RATHER THAN AS A RE-RUN: `bun test` exit 1, 873 pass / 1 fail, on the run before the last two commits, with the other four checks green. The failing arm is in a file this sprint did not touch and the finding is filed by name into PBI-68, with what is and is not claimed about the base. Nothing was committed on it.",
        "THIS SPRINT HAS HAD ONE REVIEW STAGE AND NOT TWO, RECORDED AS A FACT ABOUT THE COVERAGE RATHER THAN AS AN EXCUSE: the second reviewer failed with a configuration error before reading anything, so the adversarial reading behind the seven repairs above is one reader's. Nothing was invented to compensate -- the count of findings is the count that was filed -- and what this buys is that the sprint's evidence is thinner than the last three, which is the sentence a later reader needs.",
        "AND THAT STAGE WAS DEMONSTRABLY NOT SATURATING, WHICH IS A MEASUREMENT AND NOT AN INFERENCE FROM READER COUNTS: the EIGHTH finding of this round's own class -- a guard standing in front of the deletes and not in front of the two writes beside them -- reached the product owner, who found it by reading the source with no shell, after seven had been filed and repaired. `Two readers are better than one` is an argument; `the ninth reader found the eighth instance` is evidence, and it is the better sentence for the same reason this project prefers a red to a rule.",
        "AND THE REQUIREMENT FOR THE NEXT SPRINT WITH THIS GAP, WHICH IS WHERE THE FAILURE IS RECORDED AND NOT WHETHER: A REVIEWER THAT FAILS IS AN IMPEDIMENT FILED AT THE MOMENT IT HAPPENS, CARRYING ITS OWN ERROR -- never a decision written at close. A decision at close is a sentence about coverage; an impediment is a thing with a request attached, and it is the only form in which the next sprint can act on it. This sprint's own is filed below AS THE LATE ONE IT IS: the error text was never captured, and that loss is itself the evidence for the rule.",
        "A FINDING SURFACED AT PLANNING AND IS FILED UNDER THE BAR RATHER THAN REPAIRED HERE: the Definition-of-Done runner's header says a type error in the dashboard stops the run. MEASURED -- the runtime strips types without checking them, so a dashboard holding a type error RUNS and exits 0, and the checks are read normally. It belongs to the stale-mechanism item, it predates this sprint's base, and it is outside this sprint's subject.",
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
  sprint: {
    number: 61,
    pbi_id: "PBI-60",
    goal: "The unbuilt fourth check stops being a fact this dashboard remembers -- the state has a NAMED PRODUCER reached by two documented commands, the cover that hides it can redden, and the reason a handler builds against source is the reason the code actually has.",
    status: "planning",
    subtasks: [
      {
        test: "None -- READINGS, taken by hand outside `bun test` because the preload builds and the state never exists during a run. `dist/` MOVED ASIDE AND NEVER DELETED, tree restored and verified after each cell. Environment recorded: bun 1.3.13, deno 2.8.3, tsc 7.0.2 -- the checkout's own node_modules/.bin/tsc, which is what a package script gets -- base a0a22b2.",
        implementation:
          "Record the five cells, the enumeration of what writes `dist/` and what removes it, and the two-command route, at the sites where the next executor would make the refused edit: scripts/workspaces.ts, test/helpers/build.ts, bunfig.toml, test/package-shape.test.ts and CLAUDE.md. PROSE THAT LANDS ONLY IN THIS DASHBOARD IS A TIDY-UP, because this file is compacted on a schedule.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "fe8e6f6",
            message:
              "docs: the quiet fourth check has a producer, recorded where the edit would be made",
            phase: "green",
          },
        ],
        notes: [
          "EXECUTED: EVERY READING WRITTEN INTO THE TREE WAS RE-TAKEN AT THIS BASE (6d1c85d, tsc 7.0.2) RATHER THAN QUOTED, and one inherited reading did not survive it. `REMOVERS: NONE` is wrong in the detail a reader would act on: BOTH handler packages' `prepack` is `rm -rf dist && tsc -p tsconfig.build.json`, so two of the three members DO delete -- their own, rewritten on the same line -- while the framework's prepack removes nothing. What is true and is what landed: nothing removes a dist/ it does not rewrite on the same line.",
          "THE SITE LIST CHANGED FOR A MEASURED REASON: `CLAUDE.md` IS GLOBALLY GITIGNORED IN THIS CHECKOUT (`git check-ignore` names ~/.config/git/ignore), so it is untracked and prose landing only there is local to one machine -- the same failure the subtask's own rule names for the dashboard, one directory over. The decision procedure therefore landed in `scripts/definition-of-done.ts`, at the runner that prints the green a reader is holding; CLAUDE.md carries it too, and is not where it is kept.",
          "THE PLANNING HYPOTHESIS WAS THAT THE EXIT-0 CELL IS HAND-MADE, AND THE READING FALSIFIED IT. Bare `tsc --noEmit` at the root: both artifacts present, exit 0 silent. Both absent -- a fresh checkout -- exit 1 naming EXACTLY examples/tsudoi.config.ts(1,49) and (2,30), TS2307, both handlers, the framework silent. Framework present and handlers absent, which is what an interrupted build order leaves, exit 1 with the same two. FRAMEWORK ABSENT AND HANDLERS PRESENT: EXIT 0, SILENT, with the framework's `/types` answered from packages/tsudoi-language-server/src/types.ts, TRACED.",
          "THE PRODUCER, MEASURED END TO END RATHER THAN ARGUED. `bun pm pack` in one handler and then the other, on a tree nobody has built: each pack EXITS 0 and produces a tarball, its `prepack` compiler exiting 0 because the framework's subpaths answer from src/. After the first pack the root check is exit 1 with ONE error; after the second it is exit 0 and silent. WRITERS OF `dist/`, ENUMERATED AND NOT SAMPLED: `build()` and each member's `prepack`. REMOVERS: NONE -- every recursive delete in tracked code targets a throwaway behind the nominal guard.",
          "CONSTRAINED AS IT MUST BE WRITTEN, because the honest claim is narrower than the alarming one: NO SINGLE INVOCATION THIS REPOSITORY OWNS PRODUCES THE CELL -- the preload and the fifth check both build the framework first. What produces it is TWO DOCUMENTED COMMANDS IN AN ORDER NOTHING FORBIDS. So the close is not `the state we wrote down does not occur`; it is that the cell no longer needs a targeted delete, and nothing runs that route today.",
          "WHAT THE FRESH-CHECKOUT LOUDNESS RESTS ON, READ WITH THE COMPILER'S OWN RESOLVER AND NOT A NAME-GREP, because what is hunted is itself a property of matching. Attempts naming a handler package in the root program: TWO, BOTH FROM examples/tsudoi.config.ts, identical in the built and unbuilt states, with ZERO resolution-cache lines so no importer hides behind a cached resolution. WITNESS: that one file removed from a staged fresh checkout leaves the root check exit 0 and silent. AND THE INSTRUMENT THAT WAS REFUSED IS PART OF THE READING: `Bun.Transpiler` was measured to drop `import type` and `export type` entirely, which would have missed line 3 of the very file under examination.",
        ],
      },
      {
        test: "The unbuilt stage is non-zero AND raises at least one TS2307 whose specifier is a name read from THE STAGE'S OWN MANIFESTS, never hardcoded -- with NO claim about which package. Beside it: every `@atusy` entry realpaths INSIDE the stage, and every declared `dist` is absent. THE PAIR, and its subject is STAGE FAITHFULNESS rather than the tree's type health: the same stage BUILT reads exit 0 and empty output.",
        implementation:
          "A local stager -- per-entry node_modules links with `@atusy` pointing into the stage's own packages/. `stageCheckout` CANNOT BE REUSED AS WRITTEN: its single symlink borrow IS the degenerate.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "a3f3e88",
            message: "test: the fresh-checkout loudness this repository leans on can now redden",
            phase: "green",
          },
        ],
        notes: [
          "EXECUTED AS test/unbuilt-checkout.test.ts, WITH THE DEGENERATE REPRODUCED FIRST AND WITH THE REAL FUNCTION rather than an imitation: `stageCheckout()` on this built tree hands back a stage whose own packages hold NO dist/ and whose three `@atusy` entries realpath into the REAL checkout, and its root check is EXIT 0 WITH ZERO BYTES. Both feasibility hazards were re-taken too -- no node_modules at all is exit 1 with SIX TS2688 lines and ZERO TS2307 naming a workspace package. THE ARM IN BOTH DIRECTIONS: 1 pass / 0 fail as it stands; with the borrow degenerated to the single symlink, 0 pass / 1 fail, FAILING ON THE STAGE-FAITHFULNESS GUARD FIRST and naming all three entries, before any exit code is read.",
          "THE UNNAMED HAZARD WAS PAID OFF RATHER THAN CARRIED: the wall clock was re-taken UNDER A FULL RUN, not by hand. This file alone is 0.6 s, and the whole suite is 121.26 s at 935 pass / 0 fail across 66 files against 121.30 s at 934 across 65 -- no TimeoutError anywhere, so the concurrency risk this project has a recorded instance of did not materialise.",
          "IT IS DECLARED NOT TO MEET THE CRITERION, AND THAT IS WHY IT MAY SHIP. Under the answering-reading it satisfies neither disjunct -- the framework stays silently source-answered INSIDE the red run, and `some workspace specifier failed to resolve` survives the refused fix, so it does not carry the fact. It ships because the closing record's load-bearing sentence is that two import lines keep this check loud, and a fact still needed is MECHANISED IF SOMETHING CAN REDDEN. This is that mechanisation and it is offered as nothing else.",
          "BOTH FEASIBILITY HAZARDS WERE MEASURED RATHER THAN PREDICTED, AND ONE OF THEM IS WHY THE ARM MAY NOT ASSERT `NON-ZERO` ALONE. A stage with no node_modules is exit 1 with SIX TS2688 LINES for `bun` and `node` and ZERO TS2307 naming any workspace package -- red for a reason that is not its subject. And the borrow route decides everything: borrowed by ONE SYMLINK, the stage's entries realpath into the real checkout and the unbuilt stage reads the real BUILT artifacts, giving EXIT 0 AND ZERO OUTPUT -- an arm measuring nothing. Borrowed per-entry, they realpath inside the stage and the reading is the two TS2307.",
          "WHAT THE DOCSTRING MUST SAY IT DOES NOT WATCH, or sprint 9's rule deletes it: it does NOT watch the framework's silence -- its green is bought by two import lines in examples/, and the framework's own subpaths answer from source at exit 0 in the very stage this arm calls red; it stages the ALL-ABSENT cell and never the silent one; it says nothing about the real fourth check, since nothing in this repository owns that invocation; and it is NOT the refused pin, in a named direction -- with the source arms deleted the stage is still non-zero and now names framework specifiers too, so it survives the fix and specifies nothing.",
          "FORECLOSURE THREE, REFUSED AND WRITTEN DOWN SO IT IS MET RATHER THAN REDISCOVERED: an arm asserting the framework IS SILENT on an unbuilt stage. It pins the residue, passes for as long as the residue persists, and makes fixing it a test-breaking change.",
          "`declaredMembers` CARRIES ITS REASON AT THE CALL: every member, because the property is `some workspace package failed to resolve` and not `a handler did`. Neither enumeration is applied wholesale.",
          "AN UNNAMED HAZARD CARRIED FORWARD RATHER THAN ASSUMED AWAY: the stage's wall clock was taken BY HAND. This project has a measured instance of a 0.046 s hand reading becoming 80 TimeoutErrors under the suite's concurrency, so the number is re-taken with the arm in place under a full run, or the cheaper recipe is taken from the start.",
        ],
      },
      {
        test: "None -- a repair of a false mechanism claim, superseding rather than layering, with byte-identity at the base recorded first.",
        implementation:
          "`prepareWorkspace`'s docstring in scripts/workspaces.ts says a handler compiled against an unbuilt framework `fails at TS2307 -- an apparatus failure wearing a resolution failure's clothes`. MEASURED FALSE at base a0a22b2: it exits 0 and emits, through the same source arm. KEEP THE BUILD ORDER AND REPLACE ONLY THE REASON -- the runtimes need `dist/`, the compiler does not -- and the replacement carries ITS OWN PROVENANCE, because the correction is itself a measurement. Beside it, the disclosure at `refuseSubpathsAnsweringFromSource`, whose stated scope is now incomplete in a newly measured way: scripts/typecheck-workspaces.ts builds before it reads, so the pack route passes under it entirely.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "9808c24",
            message: "docs: the build order is the runtimes' requirement, not the compiler's",
            phase: "green",
          },
        ],
        notes: [
          "EXECUTED, AND THE FALSITY WAS RE-TAKEN AT THIS BASE BEFORE IT WAS REPAIRED rather than inherited from the planning record: a handler's own `tsc -p tsconfig.build.json`, on a staged tree with no dist/ anywhere, EXITS 0 AND EMITS, with `@atusy/tsudoi-language-server/types` and `/deps/types` traced to packages/tsudoi-language-server/src/*.ts. BYTE-IDENTITY AT THE BASE, RECORDED FIRST: scripts/workspaces.ts was `0aa3fae` in the worktree and at 6d1c85d alike, so the sentence repaired is the one the base shipped.",
          "IT IS THIS SPRINT'S REPAIR AND NOT A FILING, because it is squarely inside this sprint's own subject -- a handler's build answering from the framework's source is the route this sprint measured. The filing bar routes it here.",
        ],
      },
      {
        test: "None -- the close. Its own bar: a record that lets a reader DO something they cannot do today, not a narrative.",
        implementation:
          "PBI-60 closes AS A RECORDED DECISION, on the licence its own sixth note gives it, carrying: the producer; the three foreclosures WITH THE ASYMMETRY STATED; the decision procedure keyed to observable state; and the `exit 0` correction with its timing.",
        type: "structural",
        status: "completed",
        commits: [],
        notes: [
          "PBI-60 IS CLOSED AS A RECORDED DECISION AND THE CRITERION IS NOT PRESENTED AS MET -- it is not even reached. Its words are `a bare tsc --noEmit on a checkout NOBODY HAS BUILT`, and the cell this sprint measured is a tree that HAS been built, partially, by two `prepack` runs; the fourth check's silence there is the same silence the criterion names, arrived at from outside its wording. WHAT IS DELIVERED INSTEAD, and it is what the item's own last note licensed: the state has a NAMED PRODUCER reached by two documented commands, the residue is written at the sites where the refused edit would be made rather than only here, what a stranger receives is graded by the fifth check, and the one sentence the last closing record leaned on -- that fresh-checkout loudness is bought by two import lines in examples/ -- now has an arm. THE ITEM IS REMOVED FROM THE RANKED BACKLOG, which is this dashboard's convention for a closed item and the defect the previous sprint had to repair.",
          "THE PRODUCER, STATED AT THE WIDTH IT WAS MEASURED AND NO WIDER. `bun pm pack` in one handler and then the other, on a tree nobody has built: each EXITS 0 and produces its tarball, its prepack compiler answering the framework's subpaths from src/; after the first the root check is exit 1 with one error, after the second EXIT 0 AND SILENT. NO SINGLE INVOCATION THIS REPOSITORY OWNS PRODUCES THAT STATE -- the preload and the fifth check both build first -- so the close is NOT `the state we wrote down does not occur`, it is that the cell no longer needs a hand-made deletion and nothing runs that route today.",
          "THE THREE FORECLOSURES ARE NOT EQUALLY ENFORCED, AND THE ASYMMETRY IS STATED BECAUSE THREE IN A ROW READS AS THREE THAT REDDEN. ONE REDDENS: deleting the framework's source arms is measured, the exports equality pin in test/package-shape.test.ts is what fails first and by name, and the blocker pair in test/unbuilt-artifact.test.ts fires in both directions the cost can vanish. ONE IS ENFORCED: a `paths` mapping or project reference, by `refuseMemberMappings` on the fifth check. THE THIRD HAS NO MECHANISM AND CANNOT HAVE ONE -- an arm that PINS THE RESIDUE is refused, and no check decides whether a test pins a residue; building one would be the approximate detector this project refuses by name. That third is carried by prose at its sites and by nothing else, deliberately.",
          "THE DECISION PROCEDURE THE RECORD OWED IS DISCHARGED IN THE TREE AND NOT HERE, because a procedure kept in a file that is compacted on a schedule is the very failure the item's own subtask names. IT LIVES AT `scripts/definition-of-done.ts`, the runner that prints the green a reader is holding, with a copy in CLAUDE.md. IN ONE STEP: a green printed by that runner was READ FROM dist/, since the first check builds every artifact before the fourth reads and the fifth then refuses any published subpath answering from anywhere but its `types` artifact; a green from a BARE `tsc --noEmit` says nothing about which file answered, and if it was src/ that is THE HALF NOTHING COVERS -- as against an artifact that survived a build, which is the fifth check's half.",
          "THE ARM THAT SHIPPED IS NOT THE CLOSE AND IS NOT OFFERED AS ONE. test/unbuilt-checkout.test.ts declares in its own docstring that it meets neither disjunct of the criterion, and names four things it does not watch -- the framework's silence first among them, since inside the very run it calls red the framework's subpaths answer from src/ at no diagnostic at all.",
          "AND NOTHING WAS DELETED AS SETTLED. The residue's prose warnings at bunfig.toml, test/helpers/build.ts, test/package-shape.test.ts and scripts/workspaces.ts all still stand and were added to rather than trimmed, with every check green -- a green Definition of Done is exactly the state in which that deletion would look justified.",
          "THE `exit 0` READING WAS RESOLVED IN ADVANCE BY THE PRODUCT OWNER, THEN WITHDRAWN BY THEM ON PRIMARY SOURCE, AND THE WITHDRAWAL IS THE RECORD RATHER THAN AN EMBARRASSMENT. They fixed it as attaching to THE RUN; sprint 58's own closing decision says the criterion is unmet because a bare check `still answers the framework's own subpaths from source at exit 0`, while cell (B') records that same state as EXIT 1. Under the run-reading that sentence is false of the state it names; under the ANSWERING-reading -- no diagnostic is raised about those specifiers -- it is exactly true and it agrees with the story's own word, `diagnostic`. WHAT MAKES THE CORRECTION TRUSTWORTHY IS ITS DIRECTION: under the withdrawn reading PBI-60 closed this sprint as a FIX; under the correct one it does not. A resolution that costs the ruler the cleaner close is the one shape a retrofit never takes.",
          "THE THREE FORECLOSURES ARE NOT EQUALLY ENFORCED AND THE RECORD MUST SAY SO, because a reader who sees three in a row infers from the pattern that all three redden. ONE REDDENS: deleting the framework's source arms is measured, and the blocker pair in test/unbuilt-artifact.test.ts fires in both directions the cost can vanish. ONE IS ENFORCED: a `paths` mapping, by `refuseMemberMappings`. THE THIRD HAS NO MECHANISM AND CANNOT HAVE ONE: no check decides whether a test pins a residue, and building one would be the approximate detector this project refuses by name.",
          "TWO BINDINGS ON THE CLOSE OR IT IS A SHRUG. The record states plainly that THE CRITERION'S WORDS DO NOT REACH THE NEWLY MEASURED CELL -- a tree packed twice HAS been built, partially, by `prepack` -- and it does not present the close as the criterion having been satisfied. And the pack route leaves as its own item, ranked first.",
          "THE DECISION PROCEDURE THE RECORD OWES, stated as what a reader must be able to DO: given a green Definition of Done and `the fourth check passed`, decide IN ONE STEP whether the framework's own subpaths were read from `dist/` or from `src/` in that run -- and if from src/, whether that is the half the fifth check covers, an artifact that survived a build, or the half nothing covers, a bare fourth check on an unbuilt tree. Today that takes re-deriving four cells from a file that gets compacted.",
        ],
      },
    ],
    impediments: [
      {
        description:
          "The `revise` pipeline's second stage -- the codex MCP server -- has failed identically for a fifth consecutive sprint: `Failed to load Codex configuration from overrides: No such file or directory`.",
        impact:
          "Every sprint since it broke has been reviewed by stage one alone. That is not nothing -- stage one found this project's last several real defects, including sprint 60's central one -- but the second stage exists because a reviewer sharing none of the executor's context reads differently, and five sprints of single-stage review is a standing reduction in what review can catch.",
        request:
          "Repair or remove the codex MCP configuration. If it is not coming back, say so and the pipeline's second stage should be re-specified around something that runs here, rather than left as a step that is skipped every sprint.",
        status: "waiting_human",
        notes: [
          "Retried once per sprint with the same error text each time; nothing in this repository configures it, so there is no workaround from inside the tree.",
        ],
      },
    ],
    decisions: [
      "THE FACILITATOR OPENED A PRESSURE VALVE IN SPRINT 60 THAT WAS NOT THE ONE THE PRODUCT OWNER AUTHORISED, and the ruling is kept here because the distinction is the useful part: dropping the `expect=error` mechanism was a SCOPE CALL, which is the facilitator's to make, and it was ruled after the fact to have met no condition unmet -- the ruling it referred to was a ruling ON A MECHANISM, and when the mechanism left the ruling lost its referent. What would have made it a quiet narrowing is if the narrower account had not been disclosed to the reader. It was.",
      "FILING-ADJACENCY IS NOT A RANKING SIGNAL, stated as a standing rule because this dashboard just produced the instance. A condition filed at acceptance inherited the position of the item it came from and sat at rank two above nine live items. Rank is derived from consequence, and a low rank is written with the FIRING CONDITION that would raise it, so it is a decision with a trigger rather than a silence.",
      "A RANK MAY NOT BE DERIVED FROM A DEPENDENCY THAT CAN NEVER LAND. The tempting derivation here was `below the item that removes the ambient failure` -- and no such item will ever exist, since the ambient failure IS the source arm answering and deleting it is foreclosed with measurement. That derivation makes an item unrankable rather than low.",
    ],
  },
  retrospectives: [],
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
