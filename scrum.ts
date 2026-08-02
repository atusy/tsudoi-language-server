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
// `{ name, run }` where `run` is an EXECUTABLE SHELL COMMAND, so a
// skill name there would make this dashboard assert something no
// command verifies -- the exact failure this project keeps catching. Do
// not "fix" the gap by adding it as a check. THE LINE IT DRAWS: a
// criterion asserts a product property a perturbation can falsify;
// `revise` finds what nobody thought to assert. NO CRITERION MAY BE MET
// BY ARGUMENT AT REVIEW.
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
      ],
    },
    {
      id: "PBI-69",
      story: {
        role: "tsudoi maintainer",
        capability: "read the whole Definition of Done from one run rather than from five",
        benefit:
          "a check that failed cannot be missed by reading the part of the output that happened to be on screen",
      },
      acceptance_criteria: [
        {
          criterion:
            "Running the Definition of Done reports every check's own exit status and fails when any one of them fails.",
          verification:
            "Stage each check failing in turn and require the run to fail naming that check, paired with the unstaged tree passing. THE PAIR IS NOT OPTIONAL HERE: a runner that always fails satisfies the first half.",
        },
      ],
      status: "draft",
      notes: [
        "FILED AGAINST A DEFECT WITH FOUR RECORDED OCCURRENCES ACROSS TWO PEOPLE, ONE OF WHICH PERSISTED NINE SPRINTS, AND A FIFTH IN SPRINT 54: four commits were taken while one check was red, because its reader grepped the HEAD of a wrapper's output rather than every exit code. THE SKILL THAT FORBIDS EXACTLY THIS EXISTS, is specific, is measured, carries its own recidivism count, and matched on description -- and the defect happened anyway.",
        "WHAT THAT TAUGHT, AND IT IS THE ARGUMENT FOR MECHANISING RATHER THAN RE-STATING: the same rule FIRED in the same session when it was attached to the ACTIVITY being executed (the review round's own procedure prints the exits because the round says so) and did NOT fire when it sat in a skill matched on a description the actor did not construe themselves as doing -- at commit time you are committing, not reporting an exit code. A SKILL BUYS VOCABULARY AND RECALL, NOT COMPLIANCE UNDER LOAD.",
        "IT IS WORTH MORE THAN THE DEFECT THAT PROMPTED IT, which is what earns it a slot: warnings do not move the linter's exit code, so five exit codes is not even the full reading -- the warning count is part of it, and a warning nobody introduced on purpose is one a later reader has to decide about.",
        "IT CHANGES TRACKED FILES AND INHERITS THIS PROJECT'S OWN SYNC OBLIGATION between the dashboard's list of checks and the documentation's Commands section. That obligation is written into the work rather than left to be discovered.",
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
      ],
    },
    {
      id: "PBI-67",
      story: {
        role: "editor user",
        capability:
          "have the directory I highlighted read in the shape that is actually fastest on the runtime my editor is running",
        benefit: "the answer arrives sooner on the runtime I am on, not on the other one",
      },
      acceptance_criteria: [
        {
          criterion:
            "The shape one resolved directory is read in is chosen against a reading taken on BOTH runtimes at the sizes this package calls ordinary, and no runtime pays a regression at those sizes for a benefit that appears only on the other.",
          verification:
            "The readings exist and are recorded; the criterion is met by a shape whose cost at the ordinary size does not exceed the previous shape's on either runtime, or by a recorded ruling naming which runtime pays and why. STARTING EVIDENCE, MEASURED IN SPRINT 53 AFTER THE SHAPE WAS ALREADY CHOSEN: streaming is slower on deno at every size read -- 45 to 127 ms at five thousand entries, 1289 to 1977 at a hundred thousand -- while bun improves at both. The module's own premise is that a few thousand entries is ORDINARY, so the regression lands squarely on the ordinary case.",
        },
      ],
      status: "draft",
      notes: [
        "THE DECISION IS NOT WRONG AND ITS JUSTIFICATION IS THINNER THAN WHEN IT WAS MADE, which is why this is a re-decision rather than a defect. Streaming was adopted to bound a working set, on a measurement that had not yet established what each runtime holds; the reading afterwards showed deno's allocation at the open is transient, so on that runtime the shape buys less than it was adopted for and costs time at the size that matters most.",
        "IT SITS INSIDE THE ENVELOPE THE ORIGINAL RULING WAS MADE ON and is recorded in the module, so nothing is broken and no criterion is unmet. What is owed is a decision taken with the complete reading rather than a comment that reads as settled.",
      ],
    },
    {
      id: "PBI-61",
      story: {
        role: "tsudoi maintainer",
        capability: "add a file without discovering later that nothing type-checks it",
        benefit: "a green run means what it says for every file in the tree, not for most of them",
      },
      acceptance_criteria: [
        {
          criterion:
            "A TypeScript file in the checkout that no compiler program includes is refused, over files as a class.",
          verification:
            "The standing pair, and its shape is already measured: a file planted outside any program's reach runs under `bun test` AND IS TYPE-CHECKED BY NOTHING, with all five checks exit 0 -- planted and removed to establish it. The faithful reader is likely the compiler's own file list, because tsc's directory expansion and default excludes decide membership rather than the JSON globs a reader sees.",
        },
      ],
      status: "draft",
      notes: [
        "A WIDENING OF A REFUSAL THAT ALREADY EXISTS AND NOT A SECOND COVERAGE GUARD: the existing one reasons about DIRECTORIES HOLDING A MANIFEST that the root excludes and the workspace does not declare, so it is blind one level in -- IT RAN OVER THE PLANTED PROBE AND PASSED.",
        "THE MOVE CREATED THE ASYMMETRY THAT MAKES IT LIVE: the framework member is the only member whose config includes just its source, because it is the only one with no tests of its own, so anything added to it outside that directory is run by the suite and graded by nobody.",
      ],
    },

    {
      id: "PBI-64",
      story: {
        role: "tsudoi maintainer",
        capability:
          "read the guarantee this repository makes about its own documentation and find it true of the whole document",
        benefit:
          "a reader following a command block in this README is following one that something ran",
      },
      acceptance_criteria: [
        {
          criterion:
            "A fenced command block in a tracked README that the extraction executing those commands does not reach is refused, naming the document and the block, over READMEs as a class rather than over the documents that exist today.",
          verification:
            "Staged in a throwaway copy, because every block in this tree today is either reached or declared and an instrument whose witness cannot fail measures nothing: plant a fenced command block that no extraction reaches into the root README and into a member's, and require each to be reported naming the document and enough of the block's own text to find it. Pair each with the same tree unplanted going green. AND THE DEGENERATE ARM, RUN BEFORE THE ARMS ARE BELIEVED: an implementation that reports nothing must redden the planted arms while leaving the unplanted ones green, measured rather than argued -- the extractors this repository already has are MARKER-KEYED and each throws only when ITS OWN marker is missing, so an implementation built from them is satisfied by an author's intention. STARTING EVIDENCE, MEASURED: an unmarked block added to README.md leaves every check exit 0 while the project's own documentation tells a reader every command block in that file is extracted and executed.",
        },
      ],
      status: "draft",
      notes: [
        "THE FIRST THING THE EXECUTOR MEETS IS NOT A BUG: one extractor in test/helpers/readme.ts says of itself `NOT EXECUTED BY ANYTHING, stated here because the neighbouring extractors all are and a reader would otherwise assume it`, and gives its reason. A property that forces EVERY block to be executed would delete a considered decision. WHAT THE CRITERION REFUSES IS A BLOCK THAT IS UNREACHED AND UNACCOUNTED FOR; how an account is expressed is this item's work and is deliberately not named here.",
        "THE PROSE CLAIM IS PART OF THE SUBJECT: claimed in the project's own documentation and asserted by nothing is a COVERAGE CLAIM TAKEN ON RECOLLECTION, which is what makes this a defect rather than a gap.",
        "FOUND BY TRIAGING THE RETROSPECTIVE RECORD RATHER THAN BY A RED, and that is worth recording: the improvement being retired claimed this remedy existed, and reading for its mechanism before marking it done is what found that it does not.",
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
        "WIDENED BY SPRINT 54: THE UNCOVERED CLASS LIVES IN ARMS AND NOT ONLY IN COMMENTS, and in arms it is worse. This item's own text says the ordering-and-causality class stays uncovered and reasons about COMMENTS asserting a mechanism the code denies. Sprint 54 produced FOUR ARMS THAT WERE GREEN WHILE THE ORDERING THEY DEFENDED WAS VIOLATED -- a spy reading the value handed over and not its ordinal among the registrations, a sweep reading a call's COLUMN where the property was its POSITION relative to the first registration, an environment read whose TIME nobody had written down, and a pin reading the exported constant rather than the value the runtime received. That is the disarmed-control shape one level above what this item was filed against, and it is a different statement from the comment half -- folding them blunts both.",
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
            "Named sites, each READ rather than grepped for. The staged-path pin licenses itself with `that mapping is safe only because it cannot reach the packing stage` -- and there is NO MAPPING ANYWHERE NOW, so the tree's one narrative statement of how this repository resolves its own subpaths is false, and a contributor learns the pre-move story from the file that pins what we publish. The root config still excludes a directory the root no longer produces, matching nothing, with a test pinning the literal. A CANDIDATE SIXTH INSTANCE IS NAMED AND NOT RULED: test/package-shape.test.ts explains the members' exclusion by `the mapping asserted above resolves the framework's subpaths for EVERY file in the root program`, and the root config has no mapping -- read it and decide whether it is one of these or another.",
        },
      ],
      status: "draft",
      notes: [
        "THE COUNT SITE THIS PBI WAS FILED WITH IS ALREADY CLOSED, and how it closed is the argument for the rest: adding four skill files moved the documented number, and it was repaired BY NAMING rather than by writing the new number -- which is the convention this project holds and the reason the count was a defect rather than a typo.",
        "SEPARATED FROM STALE-VALUE REPAIRS BY WHAT MAKES THEM WRONG: an excluded directory that matches nothing is a VALUE that went stale, while the pin's licence is a MECHANISM CLAIM that is now false -- which is the class this project has filed five instances of and has no check for.",
        "THE GENERALISATION IS REFUSED IN ADVANCE: no guard that every exclude entry matches something on disk. An unmatched pattern is legitimate configuration, such a guard would redden correct files, and this instance was caught by the layer meant to catch it -- filed by its executor rather than shipped.",
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
      id: "PBI-60",
      story: {
        role: "tsudoi maintainer",
        capability:
          "learn from a diagnostic, rather than from a green run, that the artifact a check read was not there",
        benefit:
          "the file a check graded is the file I think it graded, in every state the build passes through",
      },
      acceptance_criteria: [
        {
          criterion:
            "With a package's published artifact ABSENT, and with it PARTIAL, what reads it says so by naming a file rather than exiting 0 against a different one.",
          verification:
            "Both states staged -- absent, and the partial window the pack step passes through -- and the reading taken on both runtimes AND the compiler, because it is the compiler alone that probes for existence and falls through. STARTING EVIDENCE, MEASURED AFTER THE MOVE AND NOT CARRIED ACROSS FROM BEFORE IT: with every dist/ removed the root check exits 1 with exactly two errors, both at examples/tsudoi.config.ts and both naming HANDLER packages, while the trace shows tsudoi's own subpath falling SILENTLY through the `default: ./src/*.ts` arm. THE RECORDED COSTS OF DELETING THAT ARM WERE MEASURED UNDER THE LAYOUT THE MOVE DESTROYED and must be re-measured rather than quoted: the two importers that broke reached tsudoi through a mapping that no longer exists and now reach it through node_modules, so the cost may simply have evaporated.",
        },
      ],
      status: "draft",
      notes: [
        "THIS IS THE RESIDUE SPRINT 52 SHIPPED OPEN AND SAID SO. It was accepted rather than fixed, on the ground that deleting the arm in the move would have put two subject flips in one sprint and made the move's own readings unattributable. IT IS CARRIED AS PROSE IN FOUR PLACES AND PINNED BY NOTHING, DELIBERATELY: a test that pinned the flip would PASS WHILE THE RESIDUE PERSISTS, specifying rather than detecting it, and would make this PBI look like a regression.",
        "THE DECIDING MEASUREMENT, so this does not become a deletion looking for a justification: it lands if it converts the residue into a named diagnostic WITHOUT any test needing its REASON retargeted. Otherwise the residue stays named.",
      ],
    },
  ],
  completed: [
    {
      number: 54,
      pbi_id: "PBI-58",
      goal: "A red in the first Definition-of-Done check means tsudoi is wrong, because the suite's time limit is a number this project chose and can be read -- with the tests that still set their own deadlines named as a measured remainder rather than left to be found.",
      status: "done",
      subtasks: [
        {
          test: "None -- a READING, and it is first because its own instrument dies in the next subtask.",
          implementation:
            "Run the suite from the root with the flag that still works today, unpiped, and record the load average, the per-test durations of the tests carrying NO explicit deadline, and the durations of the gated tests in the files that set their own. This reading decides the number below and decides whether the re-derivation subtask exists at all.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE FLAG IS THE ONLY WAY TO GET HONEST DURATIONS FOR SLOW TESTS TODAY, and the moment the preload lands it does nothing -- so this reading cannot be taken later.",
            "THE READING, AND WHAT IT WAS TAKEN ON. `bun test --timeout 30000` from the repository root, unpiped (redirected to a file, so the exit belongs to bun), on bun 1.3.13 / macOS 25.5.0: 792 pass / 0 fail / 2320 expect() calls across 54 files, exit 0, 82.54s wall at load average 3.74 rising to 4.42. RE-RUN with `--reporter=junit` for the per-test durations -- the same 792 / 0 / exit 0, 38.17s at load 2.95 -- because THE NON-TTY REPORTER PRINTS A PER-TEST LINE ONLY FOR FAILURES, so the durations below come from a SECOND instrument, tied to the first by the same whole-suite reading on the same tree.",
            "WHOSE COST, AT WHAT SIZE, ON WHICH RUNTIME, AND WHAT THE INSTRUMENT CANNOT SEPARATE. The cost is the SUITE'S, at its present size of 792 tests, under bun 1.3.13 only -- the deno arms are child processes inside bun's own tests, so no duration here is deno's. A bun test duration is WALL TIME ON A SHARED MACHINE: it cannot separate contention from work, which is this sprint's entire subject, so every number below is a FLOOR and not a property of the code. AND THE LOAD IT WAS TAKEN AT IS NOT THE LOAD THE PROBLEM APPEARS AT: 3-9 here, against the 100-160 sprint 50 read at.",
            "THE ENVIRONMENT HAD TO BE REPAIRED BEFORE THE READING MEANT ANYTHING, and the failed first attempt is recorded because it is a shape a later reader will hit. `tsc` and `oxfmt` are not on this machine's PATH and `test/helpers/typecheck.ts` spawns a BARE `tsc`: the first run read 607 pass / 132 fail / 1 error at exit 1, every failure `spawn tsc ENOENT` -- AND IT RAN 739 TESTS, NOT 792. An unshimmed run is not a smaller green, it is a DIFFERENT SUITE, so the two cannot be compared. Repaired with a scratchpad directory holding a symlink to node_modules/.bin/tsc (7.0.2) and a one-line oxfmt shim (0.61.0).",
            "SLOWEST TEST IN THE SUITE: 1562ms, `the server SURVIVES its editor's death when a third party holds its stdin open` (test/editor-death.test.ts:279, deno arm; 1560ms bun) -- WHICH CARRIES ITS OWN 20_000. SLOWEST TEST CARRYING NO EXPLICIT DEADLINE: 490ms, `under the non-hoisting layout the examples type-check, and a bare protocol import does not` (test/published-artifacts.test.ts). Next after it, 445, 438, 400ms. So at this load the ungated worst case sits at about a TENTH of bun's own 5000ms default, and the number below is NOT decided by contention headroom -- it is decided by the floor.",
            "THE GATED TESTS AGAINST THE DEADLINES THEIR OWN FILES SET, which is the reading the conditional subtask turns on -- max duration in the file, then the file's constant, then the ratio: protocol 185ms / 4000 = 21x; session 44ms / 4000 = 90x; completion 95ms / 4000 = 42x; cleanup-drain 49ms / 6000 = 122x; cancel-parked-pull 349ms / 6000 = 17x; cancellation 350ms / 6000 = 17x; cleanup 72ms / 6000 = 83x; editor-death 1562ms / 20_000 = 12.8x. EVERY ONE IS PAST THE `THREE TIMES THE HEADROOM OR MORE` BRANCH, so the re-derivation subtask does not exist and collapses into the comment repair, exactly as the condition stated in advance.",
            "AND THIS READING DOES NOT LICENCE `THE SEVEN ARE SAFE`, WHICH IS THE SENTENCE IT WOULD BE EASIEST TO WRITE. Sprint 50 witnessed two arms in test/protocol.test.ts failing at 4008ms against `hangTimeoutMs = 4000` at load 100-160 -- the same file whose slowest arm reads 185ms here, so the inflation that consumed 21x of headroom is a MEASURED event on this tree, not a worry. What the branch above decides is the SPRINT'S SCOPE; the exposure itself is the named remainder's subject.",
          ],
        },
        {
          test: "In a throwaway tree of THREE files that all call THIS REPOSITORY'S REAL module with a small override in the child env, EVERY file's over-arm dies naming the override and every under-arm passes -- under EACH of the four invocation forms the contract names. Both arms set the variable explicitly, because an arm that relies on its ABSENCE silently agrees with a developer who left it set in their shell.",
          implementation:
            "A module of its own exporting the number and a function that sets the default; one call at the top of each root test file; a sweep that reddens when a file lacks it.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "2035fb8",
              message:
                "feat(test): let every root test file choose the suite's deadline, not the machine",
              phase: "green",
            },
          ],
          notes: [
            "ITS OWN FILE AND NOT THE BUILD PRELOAD, for a reason stronger than tidiness: the build preload THROWS on a failed compile, so the timeout policy would die with a build failure -- and this subtask's arms must preload the REAL module at an unambiguous value in a throwaway tree, which is impossible if the call is welded to a module that compiles the whole workspace on import.",
            "TWO DEGENERATES, STATED IN ADVANCE: a module that exports the constant and sets nothing (the over arms pass under bun's own default and must redden), and a module that sets the default but ignores the override (the same arms redden, and this is the one that catches a misspelt variable name).",
            "MEASURED PREMISE THAT WIDENS THE ONE IN THE PBI: the record measured that a preload beats the command-line flag. It is now also measured that A PER-TEST THIRD ARGUMENT BEATS THE PRELOAD -- so every file that sets its own deadline survives a raised default untouched, which is what the item's own exclusion rests on.",
            "STOPPED HERE, AND THE REASON IS A MEASURED PROPERTY OF bun THAT DEFEATS THE MECHANISM THIS ITEM RULED ON. `setDefaultTimeout` CALLED FROM A PRELOAD APPLIES TO THE FIRST TEST FILE ONLY; every file after it runs at bun's built-in 5000ms. MEASURED on bun 1.3.13 / macOS in a throwaway tree of THREE files, each holding one test that sleeps 6000ms, with a preload setting 20_000 and NOTHING ELSE in the tree: 1 pass / 2 fail, the first file passing and the other two failing at 5002ms with `this test timed out after 5000ms`. It is not the third-argument interaction the note above describes -- no file in that tree carries a third argument -- and adding one only moves which files are affected.",
            "THE THREE REPAIRS THAT WERE TRIED AND FAILED, so the next attempt does not spend the readings again: `beforeAll`, `beforeEach` and `afterAll` registered IN THE PRELOAD, each calling `setDefaultTimeout` again, all read 1 pass / 2 fail unchanged. A hook cannot reach it because a test captures its deadline when it is REGISTERED, which is module-evaluation time for its file.",
            "AND THE FLAG THIS SPRINT SET OUT TO RETIRE IS THE ONE MECHANISM THAT SURVIVES, which inverts the item's premise rather than qualifying it. MEASURED in the same tree: `bun test --timeout 9000` reads 3 pass / 0 fail, INCLUDING with a fourth file carrying a per-test third argument -- so the reset restores the COMMAND-LINE value when one was given and bun's 5000ms when none was. `[test] timeout` in bunfig.toml was RE-MEASURED and is still ignored, and `bun test --help` on 1.3.13 documents no environment variable for it. The record's `a preload BEATS --timeout` is TRUE AND NARROWER THAN IT READS: measured again here at preload 3000 against flag 9000, the preload wins -- IN THE FIRST FILE.",
            "WHY NOTHING WAS LANDED, WHICH IS THE HALF THAT MATTERS MOST: the arms written for this subtask ALL PASSED IN ISOLATION AND ONE OF THEM DIED IN THE SUITE. They spawn a throwaway suite of ONE file, which is exactly the case the defect spares, so `bun test test/suite-deadline.test.ts` read 5 pass -- while the whole suite read 796 pass / 1 fail, the failure being the one arm that waits past bun's default in a file the runner does not reach first. A green built on the single-file reading would have certified a policy that does not reach the suite it is for. THE STATUS IS `pending` AND NOT `red` BECAUSE NO TEST IS IN THE TREE: the module, its five arms and the bunfig patch are preserved outside the repository, the working tree is back at the subtask-1 commit, and the Definition of Done is green there.",
            "THE DEGENERATES WERE RUN BEFORE ANY OF THIS WAS BELIEVED, and both behaved as stated in advance: a module exporting the constant and calling nothing read 0 pass / 5 fail -- every form arm on the missing failure, and the straddling arm reporting `timed out after 5000ms`, bun's own number; a module setting the default from a MISSPELT variable read 1 pass / 4 fail. So the arms do discriminate what they were written for; what they cannot see is the file boundary, because a throwaway tree has only one file.",
            "THE PO RULED ROUTE 3 AND THE GATE WAS TAKEN BEFORE ANY OF THE 49 FILES WAS TOUCHED. THE GATE: a tree of three files, each with the top-level import-and-call and one 6000ms sleep, plus a fourth WITHOUT the call -- 3 pass / 1 fail, the three calling files passing wherever bun evaluated them and the control dying at 5001ms naming 5000ms. So a calling file does NOT leak its value into the next one, which is what makes the sweep load-bearing rather than tidy.",
            "AND THE SECOND THING THE PO REFUSED TO INHERIT WAS MEASURED IN BOTH DIRECTIONS RATHER THAN BY ANALOGY: a file's own call BEATS `--timeout`. With the call at 20_000 and `--timeout 3000`, the calling files pass a 6000ms test while the non-calling control dies at 3000ms; with the call LOWERED to 2000 and `--timeout 30000`, the calling file dies at 2002ms. The flag is inert for every swept file, in both directions, and the non-calling control tracks it -- which is also how the suite now pins that the flag was really applied to something.",
            "THE READING THAT COST AN HOUR AND CHANGES HOW EVERY ARM IN THIS SPRINT IS WRITTEN: bun evaluates test files IN THE DIRECTORY'S OWN ORDER, NOT IN NAME ORDER. Five files written a-x, b-x, a-fast, b-slow, c-zzz evaluated as b-x, a-fast, a-x, c-zzz, b-slow, stable across runs. TWO THROWAWAY TREES DIFFERING IN NOTHING BUT FILENAMES read 2 pass and 1 pass / 1 fail against the same module, and the second reading was nearly recorded as evidence that the preload sometimes reaches the second file. It does not: it reaches the file bun evaluates FIRST, and which file that is is not a thing a name decides. `PUT THE ARM IN A NON-FIRST FILE` IS THEREFORE NOT SATISFIABLE BY NAMING, and the arms instead put the SAME DISCRIMINATING PAIR IN EVERY FILE of the tree.",
            "A THIRD DEGENERATE WAS ADDED FOR THE NEW VECTOR AND IT IS THE ONE THIS SPRINT EARNED: the call moved OUT of the function back to module scope -- the preload defect wearing different clothes, since the registry evaluates a module once. Under the FINAL arms it reads 3 pass / 5 fail, AND THE ONE FORM THAT STAYS GREEN IS THE FILE-PATH FORM, which runs a single file so every file in it is the first. Under the FIRST draft of the arms it read 7 pass / 0 fail -- caught only because the arms were rewritten to stop nominating a file.",
            "ALL FOUR DEGENERATES, WITH WHAT THEY READ: empty body 2 pass / 6 fail; misspelt variable 4 pass / 4 fail; call at module scope 3 pass / 5 fail; and the SWEEP'S own -- one root test file losing its call -- 7 pass / 1 fail naming the file. The fourth then happened for real: reverting test/hover.test.ts after its degenerate also undid its rollout edit, the Definition of Done read 799 pass / 1 fail, and the sweep named `hover.test.ts` on the assertion line.",
            "THE COST, NAMED RATHER THAN AVERAGED AWAY: the first check goes from 41.55s to 55.72s on a quiet machine. About 4.5s of that is the arm that proves the call beats `--timeout` at three files, and 5.5s is the one arm with no flag in the child, which must straddle bun's own 5000ms or its pass says nothing.",
            "REVISE STAGE 1 FOUND THREE THINGS AGAINST THIS SUBTASK'S SWEEP AND EVERY ONE OF THEM WAS A GREEN THAT MEASURED LESS THAN IT READ. (1) BOTH ENUMERATIONS WERE ONE DIRECTORY DEEP WHILE bun DISCOVERS RECURSIVELY, so a `.test.ts` under test/fixtures/, under scripts/ or beside a package's src/ was RUN BY THE SUITE at 5000ms and named by nobody -- the very class the item exists to remove, reachable by dropping a file. RE-MEASURED HERE rather than inherited: a probe in `sub/deep/` runs beside one at the root; probes under `node_modules/` and under a DOT-DIRECTORY do not run, and probes under `dist/` and `__ignored/` DO. The walk now prunes exactly what bun prunes, and matches all five naming forms bun runs (`a.test.ts`, `b.spec.ts`, `c_test.ts`, `d_spec.ts`, `e.test.js`; `f.testx.ts` is not run). DEGENERATE RE-RUN, `bun test test/suite-deadline.test.ts`: a fixture-directory test file carrying no call now reddens the sweep NAMING IT, 17 pass / 1 fail, where the same tree under the old enumeration read 18 pass / 0 fail. Commit d98a95f.",
            "(2) THE SWEEP'S PAIR WAS `length > 0` WHILE ITS COMMENT CLAIMED THE COUNT WAS ASSERTED AGAINST THE DIRECTORY LISTING THAT PRODUCED IT -- an assertion that cannot exist, since it is `list.length === list.length`. The reviewer's degenerate narrowed the filter to ONE filename and read 17 pass / 0 fail, one file of the tree enumerated and success reported, with a real escapee on top leaving the whole Definition of Done green. The subject list must now equal one built by `globSync`, the two prunes spelled separately so a single edit cannot narrow both; `node:fs` and not `Bun.Glob`, because the Bun global is banned with no exemption. DEGENERATE RE-RUN: the walk narrowed to `hover.test.ts` reddens the cross-check, 18 pass / 1 fail. Commit 80051d4.",
            "(3) A COMMENTED-OUT CALL PASSED, with the import left in place and nothing flagging it -- MEASURED at 17 pass / 0 fail and exit 0 on all five checks, that file silently back at bun's 5000ms, and NEITHER DISCLOSED BLIND SPOT COVERED IT. The call is now matched as a whole line, which also refuses an INDENTED call and so narrows one of the two blind spots rather than widening anything, and the needle carries its own pair. DEGENERATE RE-RUN: the call commented out in test/hover.test.ts reddens naming the file, 19 pass / 1 fail. Commit f7f735c.",
            "REVISE STAGE 2 ROUND 2 (codex), FINDING 1, AND ITS STATED DEGENERATE WAS ALREADY CAUGHT -- RECORDED AS SUCH BECAUSE THE OTHER HALF OF THE SAME FINDING WAS NOT. `setDefaultTimeout(5000)` added to each child of the spy arm AFTER its registration reads 0 pass / 3 fail in the child, the offender list printing 5000 in every file: `no recorded call carried anything else` DOES see a stray carrying a different value, wherever it lands. What it cannot see is the ONE call moved BELOW the registration -- every recorded value is still the constant while the test registered above it captured bun's own 5000ms -- MEASURED at 1 pass / 0 fail, green. The arm now reads ORDER: the call count taken at registration time must equal the count when the body runs, and the last recorded call must be the constant. THE ORDER IS READABLE BECAUSE bun INTERLEAVES, measured in the same tree rather than inferred from the accumulation already recorded here: a file is evaluated, ITS TESTS RUN, and only then is the next evaluated -- with a stray after each registration the three files read one, two and three strays rather than three each. THE LAST-CALL HALF IS IMPLIED BY THE FILTER on today's assertion set and is labelled so rather than sold as new coverage; the COUNT is what moved the reading. DEGENERATES RE-RUN: the stray and the late call each read 0 pass / 1 fail. Commit a188c68.",
            "FINDING 2, AND ITS PREMISE DID NOT SURVIVE MEASUREMENT, WHICH IS WHY THE INSTRUCTION SAID TO MEASURE. `applySuiteDeadline()` does NOT read the environment at call time: `raw` and the resolved value are both module-scope constants, so there is ONE read, at import, per process. MEASURED in a three-file tree spawned with the override at 300, each file assigning `process.env` 777 AFTER its imports and then calling -- bun is handed 300 in all three. WHAT SURVIVES THE CORRECTION IS A REAL HOLE: that freeze was documented nowhere and asserted by nothing, because every arm in the file pins the variable in the CHILD'S ENVIRONMENT before that process starts, where an import-time and a call-time read are the same reading. With the read moved INSIDE the function the same tree hands bun 777 in all three and `bun test test/suite-deadline.test.ts` read 22 pass / 0 fail -- a behaviour change nothing in the Definition of Done could see. THE FREEZE IS KEPT AND NOW ARGUED: the malformed-value refusal runs once at module scope, so a per-call read would accept anything assigned after load and the silent-disable class would re-enter by the one route its own subtask cannot cover. DEGENERATE RE-RUN: 22 pass / 1 fail, the child printing 777 in all three files. Commit 1a16439.",
            "FINDING 3, THE TWIN OF THE FIRST AND THIS SWEEP'S OWN. `the call is at column 0 on its own line` is typography where the property is ORDER: the call moved from the top of test/hover.test.ts to the BOTTOM -- own line, column 0, top level -- read 22 pass / 0 fail while every test that file registered above it kept bun's 5000ms. The sweep now asks where the call sits RELATIVE TO the first `test(` or `describe(`. THE COLUMN-0 ANCHOR IS KEPT UNDER THE NEW RULE RATHER THAN REPLACED BY IT, WHICH DEPARTS FROM THE FINDING'S WORDING AND IS DISCLOSED AS A DEPARTURE: dropping it re-opens the commented-out call measured at 17 pass / 0 fail one entry above, and a call inside a function body, both of which precede a first registration perfectly well. What the anchor still costs -- a WRAPPED call reported as missing -- is named rather than denied, and no file wraps it. TWO THINGS THE REGISTRATION NEEDLE COST A READING TO GET RIGHT: a form allowing a following `.` matched THE ENGLISH WORD ENDING A SENTENCE in test/protocol.test.ts and test/sync.test.ts, and `regex.test(source)` occurs in the sweeping file itself, so it matches calls only. AND A FILE WITH NO REGISTRATION IS AN OFFENDER RATHER THAN A VACUOUS PASS -- the disarmed-control shape this sprint has already shipped three times -- while the needle itself carries NO column anchor, because twenty of the fifty root files register through an INDENTED `describe(runtime.name, ...)`. THE DISCLOSED RESIDUE IS RE-MEASURED FOR THE NEW RULE RATHER THAN INHERITED: with line 19 of test/suite-deadline.test.ts commented out the sweep is STILL green, the first generated call sitting at column 0 above the first generated `test(` in the same template literal, and the file still announces itself at 22 pass / 1 fail with `the deadline is raised past bun's own default` dying at 5002ms. DEGENERATE RE-RUN: hover's late call reddens naming the file, 22 pass / 1 fail. Commit fd53dde.",
          ],
        },
        {
          test: "A malformed override does not run the suite: it exits non-zero naming the variable, paired with a well-formed value running normally.",
          implementation: "The module refuses anything that is not a positive integer.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "52e6ed6",
              message:
                "test(deadline): make a malformed override refuse the run instead of disabling it",
              phase: "green",
            },
          ],
          notes: [
            'THIS IS LOAD-BEARING RATHER THAN DEFENSIVE, AND THE MEASUREMENT IS WHY: setting the default to NaN or to zero DISABLES THE DEADLINE ENTIRELY rather than falling back -- measured with a sleep that bun\'s own default would fail, both `abc` and an EMPTY STRING gave a pass at exit 0. `Number("") === 0`, so a set-but-empty variable switches every deadline in the suite off WHILE THE RUN REPORTS GREEN. That is the silent-key class this project has met before.',
            "THE SHAPES WERE RE-MEASURED HERE RATHER THAN INHERITED, and the list came back WIDER THAN THE PLAN'S. Against a 6000ms sleep -- one bun's own 5000ms default fails -- the empty string, a BLANK, `abc`, `0` and `-5` each ran 1 pass at exit 0: a NaN or non-positive default disables the deadline outright. `1.5` is the shape nobody anticipated and it fails the OTHER way, truncating to 1ms so that everything dies. One rule -- a positive integer -- covers both directions, which is why the arms are one loop and not two.",
            "THE REFUSAL IS WRITTEN TO stderr AND exit 1 RATHER THAN THROWN, measured: a throw from a module a test file imports is reported as `Unhandled error between tests` and COUNTED AS A FAILING TEST, so the one thing a reader needs -- that no test ran, and why -- arrives dressed as a test result. The shape used instead is tsudoi's own failure contract.",
            "THE ARMS RUN IN A TREE WHOSE THREE TESTS EACH SLEEP 6000ms, so the degenerate does not merely fail, it PRINTS THE SILENT GREEN: with the validation deleted, five of the six values read `3 pass / 0 fail` at exit 0 on tests bun's own default could not have passed, and `1.5` read `0 pass / 3 fail` at 1ms. Every arm reddens, 9 pass / 6 fail in that file.",
            "AND EACH ARM ASSERTS THAT NO TEST RAN, which is the half a `refuses` assertion is usually missing: an exit 1 is also what a suite that ran and failed produces. Its pair is a well-formed value running the same tree normally, permanent, because every refusal arm alone is satisfied by a module that refuses EVERYTHING.",
          ],
        },
        {
          test: "The number is greater than the largest deadline a helper sets that is reachable from a test carrying no explicit deadline, paired with a reading that the enumeration behind that floor found something rather than nothing.",
          implementation:
            "Set the number from the first subtask's reading, inside the bounds below.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "954664c",
              message:
                "test(deadline): pin the number as a relation to the floor it was chosen above",
              phase: "green",
            },
          ],
          notes: [
            "WHAT MAKES IT A DECISION RATHER THAN A GUESS IS A FLOOR AND A CEILING BOTH READ FROM THIS TREE. THE FLOOR IS NOT `THE QUICKSTART NEEDS TWENTY SECONDS`: it is that a helper's own handshake deadline is UNREACHABLE TODAY -- the test dies at the default first and names nothing -- so which deadline arrives first decides whether the failure names its cause. THE CEILING is what a genuine hang costs at the proposed value times the tests that would park, which nobody has computed; without it the number is half-argued.",
            "THE PIN IS A RELATION AND NOT A LITERAL, and the degenerate says why: an equality against the chosen number is green against any tree, including one where a helper's deadline was later raised past it. Importing the constant is right HERE and wrong elsewhere in this project -- the alternative is asserting a duration, which is asserting a property OF THE MACHINE, the exact defect this item removes.",
            "THE NUMBER IS 25_000 AND BOTH BOUNDS ARE NAMED. FLOOR 20_000: `handshakeTimeoutMs` in test/helpers/readme.ts, the largest deadline a HELPER sets that a test carrying no explicit one can reach -- `the README's quickstart brings up a server under bun|deno`. Under bun's 5000ms that helper deadline was unreachable, so a broken documented command reported `this test timed out` instead of naming the command that never answered. THE MARGIN OVER IT IS DERIVED RATHER THAN ROUNDED: the same test packs and installs before reaching that handshake, 142ms (bun) and 160ms (deno) whole at load 3, and this tree has WITNESSED 21x inflation, so about 3.4s sits in front of the handshake at the worst load recorded here and anything below about 23_500 would still kill the test before its helper spoke.",
            "AND IT IS DELIBERATELY NOT 30_000, the number the retired flag carried and the one easiest to inherit: 30_000 is test/helpers/fake-editor.ts's own self-exit, so the two deadlines would coincide. That timer is reachable only from the two rig tests in test/editor-death.test.ts, which set 20_000 for themselves and fire first -- but a coincidence nobody chose is how 5000ms got here.",
            "CEILING, COMPUTED RATHER THAN LEFT HALF-ARGUED: bun runs this suite in ONE process, file after file, so a hung subject parks every test waiting on it for the full default. The largest single-subject park is test/workspace.test.ts -- 44 tests, every one driving a live server, none carrying its own deadline -- 18m20s at this value against 3m40s under bun's. The whole-suite bound is 809 x the default. THE MULTIPLIER IS THE THING TO WEIGH AND IT IS 5x; it is accepted because the alternative is a value below the floor, which leaves the whole class the item exists to remove.",
            "TWO ARMS AND TWO DEGENERATES, EACH STATED IN ADVANCE AND RUN. The pin: raising `handshakeTimeoutMs` to 30_000 with nothing else touched reddens it, `Expected: > 30000, Received: 25000` -- where an equality against 25_000 would have stayed green. Its pair reads every deadline the helpers hold and requires the pinned one to be the largest: adding a 26_000 default to test/helpers/lsp.ts reddens THAT arm naming the file while the pin stays green, which is exactly the split the two exist for.",
            "REVISE STAGE 1, AND ITS FIRST FINDING NULLIFIES THE WHOLE SPRINT IN ONE TOKEN WITH THE ENTIRE DEFINITION OF DONE SILENT. THE PIN READ THE EXPORTED CONSTANT AND NOTHING READ THE APPLIED ONE: with the module's no-override branch changed to a literal `10_000` and `suiteDeadlineMs` left exported at 25_000, `bun test` read 809 pass / 0 fail and all four other checks exited 0 -- while an ungated test ran at 10_000 against the 20_000 helper deadline it can reach, which is the property the pin exists to defend, ACTUALLY VIOLATED. The branch was executed by nothing, because every arm pins the override ON PURPOSE and the file says so. The reviewer's pair bounds the old coverage exactly: the same edit with `5000` reddens one arm, so the arms saw values BELOW an arm's own duration and nothing above.",
            "AND NO EXPRESSION BESIDE THE CALL COULD HAVE CLOSED IT -- a returned value, a recorded copy, an exported resolution are each a SECOND expression the one-token edit leaves alone. The argument is now read AT THE CALLEE, through `spyOn` on the `bun:test` namespace, and two things were measured before it was believed: the spy REACHES another module's already-bound import (`spy.mock.calls` reads `[[25000]]`) and CALLS THROUGH (a 6000ms test, one bun's own default fails, passes under it), so the arm reads the argument without disabling the effect. In the three-file tree bun hands back THE SAME SPY, so calls ACCUMULATE -- one, two, three across the files -- and the assertion is `no recorded call carried anything else` with the non-empty pair beside it, which also reddens if the interception ever stops working. The child's environment has the key DELETED rather than merely unset, which is stronger than the absence the file's own rule refuses. DEGENERATE RE-RUN: the literal `10_000` now reads 17 pass / 1 fail on `bun test test/suite-deadline.test.ts`, the child printing 10000 in all three files. Commit 2fd7673.",
            "THE HELPER SCAN WAS NOTATION-BOUND AND ITS ARM'S SUBJECT WAS OVERSTATED: it matches 4+-digit NUMERALS, not deadlines. MEASURED against `bun test test/suite-deadline.test.ts -t \"largest deadline\"` with test/helpers/lsp.ts as subject -- `26_000` reddens it 0 pass / 1 fail; THE SAME DEADLINE WRITTEN `26 * 1000` DOES NOT, 1 pass / 0 fail; and a 4+-digit numeral in a helper's PROSE reddens it, 0 pass / 1 fail, in a project that writes measured numbers into comments. Both limits are stated where the arm's subject is stated and the name is narrowed to what the instrument reads; narrowing the scan to non-comment text was REFUSED, because it trades a named blind spot for a heuristic with unmeasured ones and the false positive fails loud. Commit 9947798.",
            "THE NAMED EXCEPTION'S NUMBER WAS UNPINNED AND THE EXCLUSION'S WHOLE ARGUMENT TURNS ON IT. MEASURED: the fake editor's self-exit changed from 30_000 to 3_000 read 20 pass / 0 fail -- the exclusion still standing with its premise inverted, the rig now firing FIRST and killing the two tests that watch it with a message about a child process. It is pinned against `suiteDeadlineMs` first, the relation that survives test/editor-death.test.ts dropping its own deadline, and against the reaching file's largest numeral second, NAMED AS THE PROXY IT IS. The exclusion's other half -- only one file reaches that rig -- is its own arm, and it went red on THIS FILE'S OWN SOURCE first, because the file that spells the needle contains it. DEGENERATE RE-RUN: 3_000 now reads 21 pass / 1 fail, `Expected: > 25000, Received: 3000`. Commit 44ab7ef.",
            "THE CEILING PARAGRAPH CARRIED A COUNT THAT WENT STALE INSIDE THE COMMIT THAT WROTE IT: `the whole-suite bound is 792 x the default` was the PRE-SPRINT reading and the tree it landed on already ran more. Repaired BY NAMING and not by writing today's number, which is this project's own convention and the same repair sprint 53 made twice; the product it fed goes with it and the 5x multiplier, which is the sentence's point, stands. The one count left there is a single file's arms, re-read this round and labelled perishable. Commit eb51a3a.",
          ],
        },
        {
          test: "CONDITIONAL, and the condition is stated in advance: if the first subtask's reading shows any gated test running within about twice its own deadline, the values in those files are re-derived here. If it shows three times the headroom or more, THIS SUBTASK DOES NOT EXIST and collapses into the comment repair.",
          implementation: "One constant per file, never a third argument per test.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE PBI NAMES TWO FILES THAT SET THEIR OWN DEADLINES AND THERE ARE SEVEN. That is the PO's ruling in scope: the sprint delivers the suite default only, and the residual is recorded as a NAMED, MEASURED REMAINDER -- the files, the values, and why each is not covered -- BEFORE Review rather than discovered at it. A green that seven files contradict is the shape this project keeps catching.",
            "AND THE REMAINDER HAS A HISTORY: the run this project cites as `739 of 741` was taken with those seven still load-killable, and ITS TWO RESIDUAL FAILURES WERE NEVER IDENTIFIED. Identifying them is a precondition, not a nicety -- if they are self-timed tests, this criterion cannot honestly read green without the remainder written down.",
            "THE TWO ARE IDENTIFIED, AND THEY ARE SELF-TIMED, so the precondition is met and it resolves the pessimistic way. The record already carried it, unread: commit f4825bf's review note says the two remaining `fail at 4008ms against hangTimeoutMs = 4000, a deadline test/protocol.test.ts sets for ITSELF and which the CLI flag does not override`. WHICH TWO OF THAT FILE'S SEVEN GATED ARMS is NOT recoverable from the record and was not reproducible here -- at load 3-9 the file's slowest arm reads 185ms -- so what is identified is the file, the constant and the shape, and the arm names are recorded as UNAVAILABLE rather than guessed.",
            "THE BRANCH IS DECIDED AND IT IS `THIS SUBTASK DOES NOT EXIST`: subtask 1's reading puts every gated test at 12.8x its own deadline or better, where the condition asks for three. The re-derivation collapses into the comment repair, as stated in advance.",
            "THE NAMED, MEASURED REMAINDER, WRITTEN AGAINST THE TREE AS IT STANDS AFTER THE LANDING AND NOT AS IT WAS PLANNED. TWELVE files set their own deadlines, enumerated by reading call sites rather than name-grepping, because a call site can spell its deadline on its own line. EIGHT ARE BELOW 25_000 AND ARE THEREFORE STILL LOAD-KILLABLE, which is what the sprint did NOT deliver: test/protocol.test.ts 4000, test/session.test.ts 4000, test/completion.test.ts 4000, test/cancel-parked-pull.test.ts 6000, test/cancellation.test.ts 6000, test/cleanup-drain.test.ts 6000, test/cleanup.test.ts 6000 AND a second constant of 18000 in the same file, and test/editor-death.test.ts 20_000 at two call sites. THE EIGHTH IS NEW TO THE CLASS AS OF THIS SPRINT -- 20_000 was above bun's 5000 and is below the number chosen here -- and its 1562ms arm has the LEAST headroom of any gated test in the tree, 12.8x at load 3.",
            "WHY NONE OF THE EIGHT IS COVERED, WHICH IS A PROPERTY AND NOT AN OVERSIGHT: every one is a HANG-CATCHER SET DELIBERATELY BELOW THE AMBIENT DEADLINE so that a park fails BY NAME in the file that owns it rather than stalling the suite with no diagnostic. Raising them to the suite's number would trade a named failure for an anonymous one, which is the opposite of this item's goal. WHAT REMAINS EXPOSED IS EXACTLY WHAT THE PBI MEASURED: a busy machine can still kill them, and it has -- two arms in test/protocol.test.ts died at 4008ms against that file's own 4000 at load 100-160, in the run this project cites as `739 of 741`.",
            "THE FOUR ABOVE THE DEFAULT ARE A DIFFERENT CLASS AND ARE NOT AT RISK FROM THE AMBIENT DEADLINE AT ALL: test/readme.test.ts 120_000, test/member-resolution.test.ts 120_000, test/workspace-members.test.ts 120_000, test/build-order.test.ts 120_000 and test/installed-handler.test.ts 60_000 -- allowances for tests that spawn compilers and package managers, all of which now sit above 25_000 rather than above 5000.",
            "AND THE TIGHTEST MARGIN IN THE TREE IS NOW THIS SPRINT'S OWN, NAMED SO IT IS NOT DISCOVERED: test/suite-deadline.test.ts sets no per-test deadline, and its slowest arm waits 5.5s on a child suite that must straddle bun's own 5000ms. Against 25_000 that is about 4.5x, tighter than test/editor-death.test.ts's 12.8x. It is accepted rather than given its own allowance, because an allowance here would exempt the file that measures the deadline from the deadline.",
          ],
        },
        {
          test: "None -- prose.",
          implementation:
            "The comments whose reason this change kills: the refusal in the workspace-member suite that declined to fix twenty tests' exposure BECAUSE a suite-wide default was not an option; the comments claiming a value is below the runtime's default; and the two sites asserting that bun's 5000ms is what applies. The bunfig `this path` half was STRUCK by the PO under route 3, since the preload array stays at one entry.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "2c9f634",
              message: "docs(test): retire the comments whose reason this sprint spent",
              phase: "green",
            },
          ],
          notes: [
            "A COMMENT THAT BECOMES ACCIDENTALLY TRUE IS NOT THE SAME AS ONE THAT WAS WRITTEN CORRECTLY, so the six are re-read and repaired either way.",
            "THE PLAN SAYS SIX AND THE TREE HOLDS SEVEN, enumerated before any of them was edited: test/protocol.test.ts:21, test/session.test.ts:22, test/completion.test.ts:76, test/cancel-parked-pull.test.ts:70, test/cleanup-drain.test.ts:71, test/cleanup.test.ts:84 and test/cancellation.test.ts:86. THREE ARE TRUE TODAY (the 4000s) AND FOUR ARE ALREADY FALSE (the 6000s, against bun's 5000ms), which is a repair this sprint owes whatever mechanism it lands on -- the four are false NOW, not merely about to be.",
            "AND TWO MORE SITES ARE IN THE SAME CLASS WITHOUT USING THE SAME WORDS, so they are named rather than folded in silently: test/build-order.test.ts's allowance says `bun's default gives the whole test 5000ms`, and test/workspace-members.test.ts's says `bun's default is 5000ms, which is not a meaningful bound on a tsc invocation at all`. Both assert what applies to THOSE tests, and both stop being true the day any suite-wide default lands.",
            "ALL NINE SITES WERE REPAIRED AND THE TWO CLASSES ARE KEPT APART, because only one of them is a stale value. Seven said `below bun test's default`; the four 6000ms ones were FALSE ALREADY -- above bun's 5000, so a park died at the ambient deadline and the file's own constant never fired -- and the words never changed, which is why nothing caught it. They now name the deadline their own file sets. The two remaining sites keep their allowance, because 120_000 was never chosen against 5000 in particular.",
            "THE REFUSAL IS RECORDED AS SPENT RATHER THAN DELETED, which is the difference between a reader learning what it bought and a reader finding nothing. It declined twenty tests' exposure on two grounds and the SECOND is gone: a suite-wide default is available, chosen rather than inherited. The twenty call sites were never edited and never need to be, which is the outcome the refusal was holding out for.",
            "THE STAKEHOLDER-ROUTED ITEM LANDED IN TWO PLACES A READER ACTUALLY MEETS: test/helpers/deadline.ts, where the number is, and bunfig.toml, which is where someone looks for how this suite runs and where they would otherwise find no mention that the limit is set elsewhere. Both record that `--timeout` is INERT for every swept file, with the both-directions reading rather than the assertion alone.",
            "REVISE STAGE 1: ONE OF THOSE TWO OVERSTATED ITSELF AND CONTRADICTED ITS OWN NARROW FORM THREE LINES DOWN. bunfig.toml said `bun test --timeout N` NO LONGER DOES ANYTHING and then said `INERT FOR EVERY SWEPT FILE`. The flag still binds the workspace members' own suites, which the root `bun test` runs and which call nothing. RE-MEASURED HERE rather than copied from the finding, and it came back DIFFERENT: `bun test packages/tsudoi-completion-path/test/resolve.test.ts --timeout 1` exits 1 with 9 pass / 5 fail and FIVE arms reporting `this test timed out after 1ms`, where the reviewer reported four. The sentence is scoped to the files that retired it and names what the flag still binds. Commit a5b3fdb.",
            "REVISE STAGE 2 ROUND 2, FINDING 4: THE NARROWED SENTENCE WAS TRUE AND STILL LET A READER CONCLUDE THAT ONE NUMBER GOVERNS `bun test`. It now says plainly that the root run also executes the members' own suites, that NOT ONE of them calls the function, and that every one of them therefore runs at bun's built-in 5000ms -- or at whatever `--timeout` says, when one is given. `UNLESS THEY OPT IN` IS WRITTEN AS WHAT A MEMBER WOULD HAVE TO DO RATHER THAN AS A ROUTE THAT EXISTS: a member test importing a root helper would spend the containment the root tsconfig's `exclude` maintains and which the sweeping file already refuses to spend, so what is promised instead is that the exclusion has to be argued again the day one calls -- which the arm `no member's own test spawns` is there to force. RE-MEASURED THIS ROUND rather than carried from the last: `bun test packages/tsudoi-completion-path/test/resolve.test.ts --timeout 1` exits 1, 9 pass / 5 fail, FIVE arms at `this test timed out after 1ms`. That is the executor's own reading taken twice now, against the four both review rounds reported. Commit cda6a30.",
          ],
        },
      ],
      impediments: [
        {
          description:
            "THE MECHANISM THIS SPRINT RULED ON DOES NOT REACH THE SUITE IT IS FOR. `setDefaultTimeout` called from a preload applies to the FIRST TEST FILE ONLY; every file after it runs at bun's built-in 5000ms. MEASURED on bun 1.3.13 / macOS in a throwaway tree of THREE files, one test each sleeping 6000ms, preload setting 20_000, nothing else in the tree: 1 pass / 2 fail, the two later files failing at 5002ms with `this test timed out after 5000ms`. This is NOT the third-argument interaction the plan already knew about -- no file in that tree carries a third argument.",
          impact:
            "The Sprint Goal is unreachable as ruled. `bun test` from the root runs 55 files, so 54 of them would keep bun's 5000ms while every check reported green -- and the arms written for subtask 2 ALL PASSED, because they spawn a throwaway suite of ONE file, which is exactly the case the defect spares. Landing it would have shipped a control certifying a policy it cannot see.",
          request:
            "Choose the mechanism, and the fourth is the one that keeps this sprint's design. (1) `bun test --isolate` BECOMES THE FIRST CHECK AND EVERYTHING ELSE PLANNED HERE STANDS -- under isolation the preload is EVALUATED ONCE PER TEST FILE, so its `setDefaultTimeout` reaches every file. MEASURED ON THIS REPOSITORY WITH THE REAL MODULE IN THE PRELOAD ARRAY, not inferred from the throwaway tree: the pair is one arm, `the override raises the deadline past bun's own default`, which spawns a child suite and waits 5.5s on it, in a file that is not the first the runner reaches. Plain `bun test` reads 796 pass / 1 fail with THAT arm dying at `timed out after 5000ms`; `bun test --isolate` on the same tree reads 797 pass / 0 fail, 59.33s against 46.85s. The number stays IN the repository, readable and overridable, and only the execution model moves to the command line. (2) `bun test --timeout 25000` AS THE FIRST CHECK: durable, but the number leaves the repository, the flag this sprint set out to retire becomes the mechanism, and the value is then unreadable from any file. (3) THE POLICY BECOMES A CALL EVERY TEST FILE MAKES -- one exported function, one line at the top of each test file, enforced by a sweep that reddens when a file lacks it. No flag at all; it is the shape the PO refused ONE SIZE DOWN (a third argument on twenty test calls inside one file), and whether that refusal reaches a one-line-per-FILE version is the PO's call. (4) NONE, and PBI-58 returns to the backlog with the bun behaviour recorded.",
          status: "resolved",
          notes: [
            "RESOLVED BY THE PO AS ROUTE 3, AND THE GATE THEY MADE IT CONDITIONAL ON READ GREEN: three calling files plus one control without the call, 3 pass / 1 fail at 5000ms. Their reasoning is recorded in the sprint's decisions rather than here. ONE CLAIM ABOVE IS SHARPENED BY WHAT THE ROLLOUT MEASURED AND IS LEFT STANDING RATHER THAN EDITED: `the first test file` means THE FIRST FILE EVALUATED, and bun evaluates test files in the directory's order rather than in name order -- so a reader reproducing the 1 pass / 2 fail must not assume the passing file is the alphabetically first one.",
            "IT IS A STATE RESET AND NOT AN EXECUTION MODEL, WHICH IS THE READING THAT SEPARATES ROUTE 1 FROM THE REST. MEASURED with the preload appending a line to a marker file: under a plain `bun test` the preload runs ONCE for three files (one line, one pid) and the two later files fail; under `--isolate` it runs THREE TIMES in the SAME pid -- a fresh global object per file -- and all three pass. `--parallel=1` reads the same three lines and the same 3 pass, since it implies `--isolate`. THE COST OF ROUTE 1 IS THAT THE BUILD PRELOAD ALSO RUNS ONCE PER FILE, and what the whole-suite reading CANNOT SEPARATE is that build cost from the cost of creating a fresh context per file -- only their sum was measured, +12.5s with both preload entries present and +11.2s with only the build, at load 2-3 on a quiet machine.",
            "AND THE FLAG CANNOT BE MOVED INTO bunfig.toml, which is the first thing anyone will try: `isolate = true` under `[test]` is IGNORED -- the marker file holds one line and the run reads 1 pass / 2 fail, exactly as with no key at all. This is the same silent-key shape `[test] timeout` already has.",
            "THREE REPAIRS TRIED AND FAILED, so the next attempt does not spend the readings again: `beforeAll`, `beforeEach` and `afterAll` registered IN THE PRELOAD, each calling `setDefaultTimeout` again, all read 1 pass / 2 fail unchanged. A hook cannot reach it because a test captures its deadline when it is REGISTERED, which is module-evaluation time for its file.",
            "NO KEY AND NO VARIABLE EXISTS ON 1.3.13, checked rather than assumed: `[test] timeout` in bunfig.toml was RE-MEASURED and is still ignored (1 pass / 1 fail at 5000ms with the key set to 20_000), and `bun test --help` documents no environment variable for the default.",
            "WHAT THE PER-FILE RESET RESTORES, MEASURED AT TWO VALUES RATHER THAN ONE, because route 2 rests on it: with a preload setting 20_000 and a file carrying a per-test third argument, `--timeout 5500` leaves the later files failing at 5502ms naming `5500ms`, and `--timeout 9000` leaves them passing. The reset restores THE COMMAND-LINE VALUE when one was given and bun's built-in 5000ms when none was.",
            "THE RECORD'S `A PRELOAD BEATS --timeout` IS TRUE AND NARROWER THAN IT READS, re-measured here rather than inherited: preload 3000 against flag 9000, the preload wins -- IN THE FIRST FILE. Every sentence this project has written about that precedence needs the file scope added to it.",
            "ROUTE 2'S COST IS NOT ONE FILE. CLAUDE.md's Commands section is required by the project's own instructions to mirror `definition_of_done.checks`, so the flag would land in scrum.ts AND there; README.md names `bun test` in prose in several places, though NOT inside any marked block -- checked, the three markers are quickstart, examples-install and handler-pack, and none of their commands is `bun test`, so no executed block moves. Route 1 carries the same two-file obligation.",
            "NOTHING WAS LANDED AND THE WORK IS NOT LOST. The module, its five arms and the bunfig patch are preserved outside the repository; the working tree is back at the subtask-1 commit and the whole Definition of Done is green there. Under route 1 all three files land as written.",
          ],
        },
      ],
      decisions: [
        "THE ORDER PUTS THIS SECOND OF THE REMAINING NINE, AND THE REASON IS THIS SESSION'S OWN COST: five separate runs have been spent by hand deciding whether a red belonged to the machine or to the code, and every later sprint's readings inherit that ambiguity.",
        "THE POLICY IS THE PO'S AND THE VALUE IS THE DEVELOPER'S: this ceiling is a HANG-CATCHER, NOT A PERFORMANCE BUDGET, and it may not become somewhere slow code hides. The number is accepted when both bounds are named.",
        "WHAT REPLACES THE FLAG MUST BE RUNNABLE WITHOUT EDITING A TRACKED FILE, and `the machine is quieter now` is not a mechanism. The environment override is not a knob for its own sake -- IT IS THE SEAM THAT MAKES THE CRITERION VERIFIABLE, since without it the throwaway tree must either preload a re-implementation (no shared subject, so deleting the real call would redden nothing) or preload the real module at half a minute per arm.",
        "THE OBJECTION TO ENV KNOBS IS ANSWERED RATHER THAN IGNORED: a key that stops matching stops applying, silently. Here a typo in the variable's spelling INSIDE THE MODULE makes the over arms pass, so the suite exercises the spelling on every run; what remains is the malformed VALUE, which its own subtask closes and which is measured to be real.",
        "THE PO REFUSES, EVERY CHECK GREEN, A NUMBER LARGE ENOUGH THAT THE SUITE CAN NO LONGER FAIL FAST ON A REAL HANG -- a regression green runs cannot detect, because it only appears the day something deadlocks. Also refused in the same breath: a third argument on twenty test calls, which one file already weighed and declined, and which recreates the unchosen-number problem twenty times over.",
        "ONE THING IS THE STAKEHOLDER'S AND IS ROUTED RATHER THAN DECIDED: recording, where a reader meets it, that the command-line flag does nothing once the preload sets the default. That retires the idiom this session used through four sprints to tell a machine's red from the code's.",
        "THE PO CHOSE ROUTE 3 OVER THE TWO COMMAND-LINE ROUTES ON THE CRITERION'S OWN WORDS: routes 1 and 2 are both flags, so under either of them A BARE `bun test` STILL LEAVES EVERY FILE BUT ONE AT 5000ms, and the criterion says `for every invocation form the contract names`. bunfig's own paragraph enumerates four forms precisely because they ARE the contract, so a flag satisfies the criterion only by narrowing it to the form written in the first Definition-of-Done check. Route 3 is the only one under which the bare form, a path, a filter and `-t` are all honest.",
        "AND ROUTE 1 WAS REFUSED ON ITS OWN NUMBERS RATHER THAN ON PREFERENCE: if the preload re-runs per file, `prepareWorkspace` re-spawns tsc per package, unguarded and non-incremental, and fifty-odd files times those spawns cannot be +12.5s. THE MEASUREMENT DOES NOT RECONCILE, and a route whose own measurement does not reconcile is not the route to hang the first check on. Either the preload does not re-run on this repository the way the marker file showed in a throwaway tree, or the 797 pass has a cause nobody has named -- LEFT OPEN AND NOT BUILT ON.",
        "THE SHAPE THE PO REFUSED ONE SIZE DOWN IS DISTINGUISHED FROM THIS ONE, so the refusal is not read as overruled: that was TWENTY UNCHOSEN NUMBERS AT TWENTY CALL SITES INSIDE ONE FILE. This is ONE number in ONE module with its floor and ceiling beside it, invoked mechanically, and the per-file line CARRIES NO VALUE AND MAKES NO CHOICE. The hole it opens -- a new file silently omitting the call -- is closed by a sweep, which is the refusal shape scripts/workspaces.ts already builds twice over.",
        "AND A STANDING RULE CAME OUT OF THE STOP: every arm in this sprint runs in a tree of AT LEAST THREE FILES. A single-file throwaway is exactly the case the preload defect spares, and it is what produced a false 5 pass that was nearly committed.",
        "DISCLOSED RATHER THAN AMENDED AWAY, AND IT IS THE CLASS THIS RECORD HAS FILED FOUR TIMES: d98a95f SHIPPED A COMMENT ASSERTING A MECHANISM THE CODE DENIED, FOR ONE COMMIT. It says the sweep's pair `IS NOT THE LIST IS NON-EMPTY ALONE` while the assertion at that commit was exactly that; 80051d4, the next commit, is what made it true. The cause is the instruction's own shape -- one commit per finding, with the enumeration fix (F3) ordered before the pair fix (F2) because writing the cross-check against the final enumeration is cheaper -- and the alternative was folding two findings into one commit. It was seen when written, not found afterwards, which is why it is here rather than in a later reviewer's list.",
        "A TENTH THING WAS FOUND WHILE CHECKING THE FOURTH FIX'S OWN CLAIM, AND IT IS THE ONE FILE THE SWEEP CANNOT READ: test/suite-deadline.test.ts generates child sources whose call sits at column 0 INSIDE TEMPLATE LITERALS, and the module path satisfies the import needle too, so both halves of the predicate match text that is not that file's own call. MEASURED with its line 19 commented out -- the sweep stays green. NAMED RATHER THAN PATCHED, on the reading taken in the same run: 21 pass / 1 fail, `the deadline is raised past bun's own default` dying at 5002ms, because that arm waits 5.5s on a child. The one file whose call the sweep cannot verify is the one file that fails loudly without it. Commit 7f4ae83.",
        "THIS DASHBOARD WAS ITSELF ONE OF THE NINE FINDINGS, AND IT IS THE ONE NO EXIT CODE COULD HAVE CAUGHT: `oxlint` reported fifteen `no-useless-escape` warnings, every one of them in this file, from prose written into these notes. WARNINGS DO NOT MOVE THAT CHECK'S EXIT CODE -- the run that carried all fifteen exited 0 -- so the Definition of Done as spelled cannot detect a regression of this class, and the reading that replaces the exit code is the warning count: sixteen before, one after, the survivor a deliberate `require-yield` in test/fixtures/throws-on-cancel.ts that predates this sprint. NAMED RATHER THAN GUARDED: turning warnings into errors is a rule-set decision this sprint has no mandate for, and a count nobody reads is what this project has just spent a round repairing.",
        "AND THE REVISE ROUND'S OWN INSTRUMENT RULE WAS FOLLOWED THIS TIME, WHICH IS WHY IT IS WORTH WRITING: every one of the nine fixes was taken on a full Definition of Done with ALL FIVE EXIT CODES READ AND PRINTED -- `bun test=0 oxlint=0 oxfmt=0 tsc=0 workspaces=0` -- rather than on the head of a wrapper's output, which is the defect the last round disclosed one entry below. The suite went 809 -> 814 across the nine commits and no check was ever red at a commit.",
        "THE SECOND REVISE ROUND'S FOUR FINDINGS SHARE ONE SUBJECT AND IT IS NOT THE ONE THEY WERE FILED UNDER: THREE OF THEM ARE ABOUT *WHEN*, WHERE EVERY ARM THIS SPRINT BUILT ASKS *WHAT*. The spy arm read the value handed to bun and not the moment it was handed; the sweep read the call's column and not its position among the registrations; the module's read of the environment had a time nobody had written down. Each was green while the property it defends was violated, and the violation is the same one every time -- a deadline set after a test is registered reaches that test not at all. THE STANDING RULE THIS LEAVES, worth more than the three fixes: an arm over a value that takes effect at a MOMENT must assert the moment, because the value alone is satisfied by a call nobody's test ever saw.",
        "AND THE ROUND'S OWN INSTRUMENT RULE HELD AGAIN: each of the four fixes was taken on a full Definition of Done with ALL FIVE EXIT CODES READ AND PRINTED, and one of them was caught red -- `oxfmt --check` exited 1 on the third fix's own prose, which was fixed and the whole run repeated before the commit. The suite went 814 -> 815 across the four, and the one surviving lint warning is the pre-existing `require-yield` in test/fixtures/throws-on-cancel.ts.",
        "DISCLOSED RATHER THAN QUIETLY FIXED: FOUR COMMITS WENT IN WHILE THE FOURTH CHECK WAS RED. c3e46de, 52e6ed6, 954664c and 2c9f634 were each taken after a full Definition-of-Done run in which `tsc --noEmit` exited 1, and the executor read only the head of that run's output and saw the first three checks green. THE CAUSE WAS ONE LINE OF THIS FILE and nothing in the deliverable: a subtask's `commits` was written as `[\"2035fb8\"]` where the schema wants a `Commit` object, so `TS2322` at scrum.ts. Every other check was green on every one of those runs, and the suite passed at 800, 807 and 809. IT IS RECORDED BECAUSE THE RULE IS `COMMIT ONLY ON GREEN` AND NOT `COMMIT ONLY WHEN THE INTERESTING CHECKS ARE GREEN` -- and because the instrument that hid it was a habit, grepping the head of a wrapper's output, which is the same shape as reading `$?` from the last command in a pipe.",
      ],
    },
    {
      number: 53,
      pbi_id: "PBI-65",
      goal: "Highlighting a directory in the path completion shows what is inside it, bounded, without costing the detail a failed listing would have thrown away.",
      status: "done",
      subtasks: [
        {
          test: "The item records the source it was produced under, asserted PER SOURCE across all three the package offers, not once.",
          implementation:
            "The mark gains the source name, written at the item where it is already in hand and costing nothing at popup time.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "dcd503e",
              message: "feat(completion-path): mark each item with the source that produced it",
              phase: "green",
            },
          ],
          notes: [
            "THE PREREQUISITE THE REBUILD CREATES: the block carries the absolute path AND the source attribution, and only the first is on the item today -- the source is NOT derivable from the path, since the same file is reachable from the document's directory, the cwd, a workspace folder or an absolute fragment.",
            "THE PLAN SAID THREE SOURCES AND THE CLOSED SET HOLDS FOUR, MEASURED off `PathSourceName` rather than counted from the fixture: `sourcesFor` answers an ABSOLUTE fragment with the absolute source ALONE, so three is what one relative fragment can drive and four is what the package offers. The arm covers all four and the fourth needed a fragment of its own; the enumeration is asserted as a VALUE so a source that stops being offered reddens rather than quietly narrowing the claim.",
            "THE RED WAS TAKEN BEFORE THE WIDENING AND IT IS THE MISSING KEY: 0 pass / 1 fail, the diff naming `source` as the one member the item's `data` lacked. Then 40 pass / 0 fail.",
            "MEASURED AGAINST THE DEGENERATE THE NOTE ABOVE NAMES -- one hardcoded source name (`cwd`) on every item: 39 pass / 1 fail, the new arm alone reddening and every other assertion in the file unmoved. So the arm is not satisfied by an author's intention.",
            "AND THE FULL SUITE FOUND SOMETHING THE TARGETED RUN COULD NOT: the first Definition-of-Done run came back 767 pass / 1 fail, the failure being the packed-members citation guard -- `@atusy/tsudoi-completion-path: dist/completion.d.ts names test/resolve.test.ts` -- because the new comment cited the root fixture BY PATH and a shipped module may not name a repository file its reader does not have. The citation was rewritten to name the fixture without a path; the guard is live, and this is a second reading of it firing for its own reason.",
            "THE DEGENERATE IS `HARDCODE ONE SOURCE NAME`, which passes against any single-source test -- which is why the arm is per source.",
            "MEASURED, AND IT IS A REASON TO WRITE THE TEST RATHER THAN TO SKIP IT: widening the mark reddens NOTHING today. Nothing asserts the mark an item of ours carries, and the only whole-item equality compares a server-produced item against itself, so both sides move together.",
            "A NEAR-MISS WORTH CARRYING INTO THE COMMENT: `source` is a key another server in this repository's own fixtures already uses under the same field. The gate stays the existing mark -- read first, the source read only after it validates.",
          ],
        },
        {
          test: "A directory item's block carries the names inside it, whole-value; a file item's block comes back byte-identical to what completion wrote, asserted in a session where the directory's demonstrably changed; and AN ITEM WHOSE BLOCK WAS TAMPERED WITH is answered with our rebuilt block and none of the tampered text.",
          implementation:
            "Rebuild the block for BOTH kinds, sharing completion's composer the way the two modules already share the mark -- exported from that module, absent from the package's published surface. Names sorted by code unit. Format re-read from the session the handler is handed, so the context parameter stops being discarded.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "14fed16",
              message:
                "feat(completion-path): answer a highlighted directory with what is inside it",
              phase: "green",
            },
          ],
          notes: [
            "THE RED WAS TAKEN ON THE UNIT ARMS FIRST -- 0 pass / 2 fail, the answer carrying no block at all -- and the wire arms followed the implementation to 12 pass / 0 fail across both runtimes.",
            "BOTH DEGENERATES WRITTEN AND RUN, AND THE FIRST ONE CONFIRMS THE NOTE BELOW RATHER THAN MERELY REDDENING. `append to every item`: 10 pass / 4 fail -- the tampering arm reddens on BOTH runtimes and both unit arms redden, while `a directory's block carries what is inside it` STAYS GREEN, because appending to an UNTAMPERED block produces byte-for-byte what rebuilding produces. So the tampering arm is not a belt-and-braces extra; it is the only thing that tells the two implementations apart. `set the block TO the listing`: 8 pass / 6 fail -- the listing arm reddens too, on the whole-value equality, which is what a containment spelling would have missed.",
            "THE COMPOSER'S OWN SHAPE, DECIDED WHILE WRITING IT AND WORTH THE LINE: a markdown client gets the names as BULLETS and a plaintext client as bare lines, because markdown JOINS consecutive lines into one paragraph -- a column of names sent as bare lines reaches a markdown client as one wrapped run of words. Nothing in a name is escaped, exactly as nothing in the path above it is; that trade is the block's own and is not widened here.",
            "A SECOND FORGERY ROUTE WAS FOUND WHILE REBUILDING AND IT OWNS ITS OWN ARM: the SOURCE NAME also arrives on the item, so a rebuild that echoed it would put client text back in the block one field over from the one just closed. It is checked against the closed set and DROPPED when it names none -- the path is still taken as sent, deliberately, so this moves no boundary.",
            "THE TAMPERING ARM IS THE DISCRIMINATOR THAT MAKES THE RULING MEASURABLE RATHER THAN A PREFERENCE: under the rejected append proposal that test cannot pass. AND IT CLOSES A GAP THAT WAS FILED AS UNCOVERABLE -- under append, `a client that strips the block before sending it back` was unobservable, because the fake editor returns what it got; under rebuild the client's copy is never read, so stripped and tampered are both ordinary cases.",
            "THE SORT IS TESTABILITY BEFORE IT IS TASTE: directory order is the filesystem's own bookkeeping, promised by nothing, so an unsorted block makes the same directory read differently on two machines and NEITHER a whole-value assertion NOR `the first N are these` can be written against it. BY CODE UNIT AND NEVER BY LOCALE, for the reason the module already gives about ISO dates.",
            "TWO DEGENERATES, WRITTEN AND RUN BEFORE THE ARMS ARE BELIEVED: `append to every item` passes the directory arm and fails the file arm; `set the block TO the listing` passes any containment spelling and fails whole-value equality -- and that second one IS the replace hazard, which is why the assertion is whole-value and the existing wire equality is EXTENDED rather than loosened to a partial match.",
            "REVISE STAGE 2 (codex): `BY CODE UNIT AND NEVER BY LOCALE` HAD NO WITNESS, and the note above stating it was the whole of its defence. MEASURED by that reviewer and REPRODUCED before anything was changed -- with the comparator's name key replaced by `localeCompare`, the wire file and the member file read 27 pass / 0 fail, because every name within a group was compatible lowercase ASCII and the two orders agree on those. The shared fixture gains a case pair in EACH group (`Zeta.txt` beside `alpha` and `beta.txt`, `.Zed` beside `.hidden`): code units render the uppercase name first and every collator renders it last. THE HIDDEN GROUP NEEDS ITS OWN PAIR because the comparator answers on the group key first and reaches the name key only within a group. BOTH RUNTIMES READ RATHER THAN ASSUMED FROM ICU, since a runtime built without it would fall back to code units and make the refused implementation indistinguishable: `Z`.localeCompare(`a`) is 1 under bun 1.3.13 and deno 2.8.3 -- whose DEFAULT LOCALES DIFFER, en-US and ja-JP, which is the ruling's own argument standing in front of it. The same degenerate now reddens 4 arms, two on each runtime. Commit acd8bd5.",
            "THE FIXTURE DEFECT IS FIXED HERE OR THE ARM MEASURES NOTHING: the shared fixture's directory is created EMPTY, so `an empty listing` and `no listing at all` produce the same bytes. Children are added BEFORE the fixture's timestamp fixing, because writing into a directory bumps its mtime and the expected detail string carries that timestamp. One child is HIDDEN, because the ruling that hidden entries are shown has no witness otherwise -- and the helper's blanket refusal of dotfiles NARROWS rather than stands, since it exists because this behaviour was undecided.",
          ],
        },
        {
          test: "A directory far past the bound returns a bounded number of names AND the exact total; one under the bound shows every entry and announces no truncation; a directory of exactly the bound announces none either; and an empty directory is answered rather than left unhandled.",
          implementation:
            "The whole directory is read; the bound is on what is rendered. The count goes IN THE BLOCK and never on the one-line detail.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "4234be0",
              message: "feat(completion-path): bound the names one resolved directory renders",
              phase: "green",
            },
          ],
          notes: [
            "THE NUMBER IS TWENTY AND IT IS THE EXECUTOR'S, NOT A RULING BEING FOLLOWED: nothing in this record named one -- the PBI measured that twenty names are three hundred characters where five thousand are eighty-five thousand, which is a RATIO illustrating the payload argument rather than a value. Chosen as the judgement the criterion asks for, and spelled in no test.",
            "THE RED, AND WHAT IT SAYS ABOUT THE SECOND ARM: 3 pass / 1 fail before the bound existed -- the overflow arm reddening with 25 names rendered where fewer were required. The at-or-under arm was GREEN before, correctly and vacuously: its edge fixture is staged from the count just read, so with no bound it staged and compared forty. It becomes load-bearing only once a bound exists, which is why the overflow arm is the one this subtask's red is taken on.",
            "TWO DEGENERATES, EACH RUN AND EACH 15 pass / 3 fail. (1) The total reporting what was RENDERED -- the bound moved onto the READ, which is the implementation the ruling refuses: both wire arms and the overflow arm redden. (2) A truncation announcement carrying a HARDCODED total (`25 entries, first 20 shown`): the 25-entry fixture passes it and the 47-entry one does not, which is exactly what one fixture could not have measured.",
            "THE EARLY-EXIT MEASUREMENT HAS NO SUBJECT AND THAT IS THE FINDING, not an omission: the ruling that the whole directory is read leaves nothing to exit early FROM. `readdir` is used rather than `opendir` -- names only, no per-entry kind -- so no handle is iterated at all. PROBED ANYWAY ON BOTH RUNTIMES rather than argued: 2000 bounded listings of a 200-entry directory leave the process's open descriptor count unmoved, bun 1.3.13 5 -> 5 and deno 2.8.3 21 -> 21.",
            "TWO FIXTURES WITH DIFFERENT OVERFLOW COUNTS IN ONE MEASUREMENT, because `a hardcoded more` passes with one.",
            "THE BOUND IS PINNED BY READING THE WIRE AND NEVER BY IMPORTING THE CONSTANT, for the reason already written at the batch size beside it: a test that imports the number agrees only with itself.",
            "THE COUNT GOES WHERE THE LISTING IS SO EXACTLY ONE NUMBER ABOUT A DIRECTORY EXISTS AND TWO CANNOT DISAGREE. That is also what keeps the size-refusal pin unmoved, and it is not a reversal of it: a count of children is what the directory ENTRY's byte size failed to be.",
            "FIRST EARLY EXIT FROM A DIRECTORY ITERATION IN THIS TREE, so whether the handle is released is READ ON BOTH RUNTIMES rather than trusted to compatibility. UNMEASURED.",
            "REVISE STAGE 2 (codex), AND THE TWO NOTES ABOVE ABOUT `readdir` AND ABOUT THE COST ARE RETIRED BY IT RATHER THAN LEFT STANDING: the rendered bound bounded the PAYLOAD and not the WORKING SET -- every name was read into one array and SORTED to keep twenty -- and the sentence at that code calling the cost LINEAR was false, since a sort is N log N. MEASURED before choosing between streaming and keeping the array, at the size where it shows (100k entries, macOS/APFS, mean of 5, machine under load): the array shape 888 ms on bun 1.3.13 and 1289 ms on deno 2.8.3, OF WHICH THE SORT ALONE 515 ms and 386 ms, against 315 ms and 1977 ms for streaming the handle and retaining only the best twenty. The listing now streams through `opendir`, so what it holds is twenty names and one dirent whatever the directory holds. THE deno COST IS ACCEPTED WITH ITS SHAPE WRITTEN DOWN: at five thousand entries streaming drains in about 127 ms where the array took about 45 ms (bun about 24 against about 18, and at two hundred entries neither runtime tells them apart) -- the same order as the 135 ms this sprint's whole-directory ruling was made on. The descriptor probe was RE-RUN for the new shape rather than inherited: 2000 resolves leave the count unmoved, bun 7 -> 7 and deno 21 -> 21. Commit c3a1a7b.",
            "AND THE EARLY-EXIT MEASUREMENT HAS A SUBJECT NOW -- the cancellation check of commit a1b77eb would have been it -- AND ITS ANSWER IS A REFUSAL: on deno a directory that has been READ FROM and not drained NEVER gives its descriptor back, 500 listings abandoned after one entry taking the process from 21 open descriptors to 521, whether the loop is left by `return`, by `break`, or by `break` followed by an awaited `close()`. Opening and closing without reading leaks nothing and a full drain leaks nothing, so it is the PARTIAL READ alone; bun releases in every one of those shapes, 5 -> 5. One descriptor per cancelled highlight is a session that dies at the ulimit, which is worse than the drain it would save, so the abort is read at the seam BEFORE the handle is opened and the drain once begun runs to exhaustion. WHAT RETIRES THE REFUSAL IS NAMED at the code: deno releasing that descriptor.",
            "REVISE STAGE 2 ROUND 2 (codex): THE RETAIN GATE -- `is this name better than the worst one I kept` -- WAS DECIDED BY NOTHING ANYWHERE, and the case pairs this sprint added witness the RENDER order rather than the RETENTION rule. That fixture holds five entries, so the kept list is never full while it is read and `worstKept` is `undefined` throughout. REPRODUCED BEFORE THE ARM WAS WRITTEN: with ONLY the retain comparison changed to `localeCompare`, leaving the group key and the render order alone, the member file and the wire file read 28 pass / 0 fail. THE NEW ARM IS AN OVER-BOUND DIRECTORY WHOSE ARRIVAL ORDER IS NOT ITS RENDERED ORDER -- twenty-five `Z` names, which belong in the answer, and twenty `a` names, which do not -- so a name arriving at a full list must REPLACE the worst kept and a locale gate rejects it. ITS PREMISE IS ASSERTED OFF THE DIRECTORY'S OWN ARRIVAL ORDER, read with the same call the module reads it with, and it is TWO conditions because either alone measures nothing: a lowercase name among the first `shown` arrivals, which is what makes the worst kept lowercase when the list fills, and an uppercase name arriving after them. A filesystem handing entries back in NAME order satisfies neither and reddens rather than passing vacuously, which is the honest shape for an arm that relies on an order promised by nothing. DEGENERATE RE-RUN: the same locale gate now reads 12 pass / 1 fail, four `a` names standing where `Z008`, `Z009`, `Z018` and `Z019` belong. Commit 3b224fa.",
            "REVISE STAGE 2 ROUND 2 (codex), AND IT RETIRES THE `twenty names and one dirent` SENTENCE IN THE NOTE ABOVE AND IN THIS SPRINT'S DECISION LOG: a handle does not hand entries out one syscall at a time, so that claimed for the PROCESS what is only true of this function. WHAT WAS READ IN THE RUNTIMES' OWN `Dir` IMPLEMENTATIONS AND THEN MEASURED at 100k entries (macOS/APFS, resident set, warmed) IS A DIFFERENT FACT FROM THE 32-ENTRY BUFFER THE FINDING NAMED, and the number should not be repaired with it: BOTH runtimes materialise the whole directory behind the handle, by different routes. Bun's `Dir` is a facade over `readdir` with file types and materialises on the FIRST read -- 30 MB at the open, 61 MB once one entry has been taken. Deno reads the whole directory SYNCHRONOUSLY inside `opendir`, to fail early on a path that is not a directory, and only then streams entries from an op one at a time -- 57 MB before, 119 MB at the open, unmoved by the first entry. `bufferSize` is not the seam it looks like either: deno's `opendir` defaults it to 32 and validates it, and its `Dir` never uses it. Resident set is recorded as where the ALLOCATION happens rather than as what is retained, which it cannot separate from a collector's timing. THE CONCLUSION SURVIVES, NARROWED TO WHAT HOLDS IT UP: what the streaming shape retired is THIS FUNCTION'S array and the superlinear sort over it, and the bound is on the payload and on what this function holds. Three neighbouring sentences carried the same overstatement and are narrowed where they stand, AND A FOURTH IN THE MODULE HEADER FELL TO THE SAME MEASUREMENT rather than being left for a third round: `one opendir is the same order as one stat` -- on five thousand entries deno pays 37 ms for the OPEN ALONE against 0.088 ms for a stat, where bun's lazy open costs 0.004 ms against 0.053 ms. Commit 17aa5d6.",
            "THE BOUND IS NOW SPELLED IN ONE ARM, WHICH RETIRES THE FIRST NOTE OF THIS SUBTASK (`spelled in no test`) ON A MEASUREMENT: codex changed `entriesShown` from 20 to 19 and the member arms, the edge arms, the hidden-entry arm and the wire arm were ALL GREEN, because each reads the count off an over-bound answer and compares everything else against that. Reading the wire means asserting how many names an over-bound directory RENDERS, which no arm did. RE-MEASURED after the arm was added: at 19 it alone reddens, 26 pass / 1 fail across the member file and the wire file on both runtimes. The constant is still imported by nothing, and the other arms are deliberately not rewritten to spell it. Commit 04e832c.",
            "REVISE STAGE 2 ROUND 3 (codex), AND IT RETIRES THE ROUND 2 RETAIN ARM RATHER THAN AMENDING IT: that arm reached the gate only if the filesystem happened to hand lowercase names back before uppercase ones, and the premise it asserted to say so was read with a SECOND `opendir` of the same directory. A provider whose order varies between opens satisfies the staging read and lets the mutant through on the measuring one; a provider returning names in code-unit order fails the premise and reddens an arm that is about something else. THE DRAIN BECOMES A FUNCTION TAKING THE SEQUENCE AS A PARAMETER (`listingFrom`, exported for this arm alone and listed at the package index beside the other internal names), so the arm feeds twenty-five lowercase names then twenty-five uppercase ones with no filesystem in it at all. THE ONE PREMISE THAT REMAINS IS READ OFF THE DRAIN ITSELF -- the lowercase run alone comes back SHORTER than it went in, which is what says the kept list is full before the first uppercase name arrives, and `overfilled` rather than `filled` because `exactly full` and `not yet full` are one reading from outside. STILL NO NUMBER SPELLED. THIS FILE'S OWN RULE -- the subject is the handler's answer and never an internal helper -- IS BROKEN HERE AND THE EXCEPTION IS ARGUED AT THE ARM rather than taken quietly. DEGENERATE RE-RUN: the gate changed to `localeCompare`, 13 pass / 1 fail with the new arm alone reddening, and the wire file 16 pass / 0 fail, which is what says this rule is not visible from there. Commit 8d3ba90.",
            "REVISE STAGE 2 ROUND 3 (codex), AND IT RETIRES THE `BOTH RUNTIMES MATERIALISE THE WHOLE DIRECTORY BEHIND THE HANDLE` SENTENCE IN THE NOTE ABOVE: that was read off a resident set, and the same reading's own parenthesis says a resident set cannot separate allocation from retention. READ IN DENO'S OWN SOURCE, extracted from the binary rather than taken on the reviewer's word since that reviewer was already wrong once about a buffer: `opendir` calls `Deno.readDirSync(path)` and DISCARDS THE RESULT -- the comment on the line is `Throws if path is invalid` -- then constructs `new Dir(path)` with the path alone, and the entries arrive later from a SEPARATE async op the first `read()` starts. MEASURED TWO WAYS AFTERWARDS at a hundred thousand entries: sixteen UNREAD handles leave `heapUsed` unmoved at 6 MB across a forced collection, and their resident set plateaus at 206 MB where sixteen retained copies would be near 600. SO THE NUMBERS STAND AND THE SUBJECT NARROWS -- deno pays an O(N) read at the open and throws it away, and retention behind the handle is BUN'S SHAPE ALONE (30 MB at the open, 61 MB once one entry is taken). Two neighbouring sentences that inherited the wider claim moved with it. Commit f7a5e85.",
            "REVISE STAGE 2 ROUND 3 (codex): `WHAT THE STREAMING SHAPE RETIRED IS THIS FUNCTION'S ARRAY AND THE SORT OVER IT -- THE SUPERLINEAR TERM, AND THE PAYLOAD` NAMES ONE THING STREAMING DID NOT DO. The array shape already rendered the first twenty names and no more: the bound on what is SHOWN landed in commit 4234be0 and the streaming in c3a1a7b, whose own subject line says it bounds what a resolved directory HOLDS, `not only what it shows`. The payload was never the thing that moved. Written down because the two are separately revisable and this paragraph had them competing for one credit. Commit 8b30988.",
            "REVISE STAGE 2 ROUND 3 (the Product Owner's own reading, and sharper than the reviewer's): THE DENO HALF OF THE STREAMING TRADE WAS RECORDED AND NEVER SUMMARISED. The paragraph stating what streaming costs went on to say what it buys with no runtime qualifier -- `this function's own working set plus the disappearance of a superlinear term at the tail` -- while the numbers three paragraphs above it say deno is SLOWER AT EVERY SIZE MEASURED, 45 -> 127 ms at five thousand entries and 1289 -> 1977 ms at a hundred thousand. The tail is where deno loses most, so naming it as the second half of the purchase read the measurement backwards. Bun buys both halves; deno buys THE WORKING SET ALONE and pays at the tail for it. Nothing measured moved and no ruling reopened. Commit 4b389e5.",
          ],
        },
        {
          test: "A path that can be stat-ed and not listed is answered WITH its one-line detail and WITHOUT a listing, stderr empty, paired in the same session with a listable directory whose block does appear. THE ARM ESTABLISHES ITS OWN PREMISE FIRST -- it asserts the listing really rejects in that staged tree, so a runner where the permission does not bite reddens rather than passes vacuously.",
          implementation:
            "The failure handling splits: a failed listing must not throw away a detail that was already in hand.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "fa5e5d7",
              message:
                "fix(completion-path): keep the detail a stat produced when the listing fails",
              phase: "green",
            },
          ],
          notes: [
            "THE PREMISE IS MEASURED AND IT BITES, on both runtimes and before the arm was written: uid 501, the directory at mode 0, `stat` RESOLVING and reporting a directory while `readdir` REJECTS EACCES -- bun 1.3.13 and deno 2.8.3, identical readings. So the staging did not have to change and the property is asserted as written.",
            "THE RED IS THE DEGENERATE ITSELF, WHICH IS WHY NO SEPARATE DEGENERATE RUN WAS NEEDED: the implementation standing before this subtask WAS one try around both reads, and against it the new arm read 14 pass / 2 fail on the file -- the answer carrying no `detail` at all, on both runtimes. After the split, 64 pass / 0 fail across this package's suite and the wire file.",
            "THE ARM RE-ASSERTS THE REJECTION IN ITS OWN TREE, so a runner as root reddens instead of measuring the ordinary directory case; and the mode is restored before the fixture is removed, or the removal fails on the directory it cannot descend into.",
            "ENOTDIR IS NOT CONSTRUCTED AND IS SAID SO AT THE CATCH: `a path that was a directory at the stat and is not one at the listing` needs a RACE between two calls made back to back, and this handler offers no seam to open between them. It lands in the same catch as the permission case, which IS exercised.",
            "THE STANDING RE-RUN, TAKEN AFTER THIS SUBTASK RESTRUCTURED THE HANDLER BODY: subtask 2's `append to every item` degenerate still reddens the tampering arms on both runtimes -- no control was disarmed by the split. It now reddens FAR MORE than the 4 it did when it was first run, and the MECHANISM was read rather than the prediction widened: subtask 3's arms drive items carrying NO incoming block, so an appending implementation composes a block with no path and no attribution in it. More arms, not a different failure.",
            "THE DEGENERATE IS THE OBVIOUS IMPLEMENTATION: one try around both reads, which answers with the bare item and loses the detail the successful stat produced. That is the red this subtask exists for.",
            "THE EXISTING DELETION TEST DOES NOT COVER THIS AND ITS NAME SUGGESTS IT DOES: it stages a FILE, so it exercises the stat rejection alone.",
            "REVISE STAGE 2 (codex): THE SEAM THIS SUBTASK OPENED BETWEEN THE TWO READS IS WHERE THE REQUEST'S ABORT IS NOW READ, and it was read nowhere before -- a highlight cancelled while the stat was pending went on to open the directory and drain it, and a user arrowing through a popup supersedes their own highlight by the keystroke. WHAT THE CHECK BUYS WAS ESTABLISHED BEFORE IT WAS WRITTEN, off tsudoi's own `answerUnlessCancelled` rather than assumed: it re-reads the abort AFTER a handler settles and answers -32800 whatever the handler produced, so the ANSWER is discarded either way and what the check buys is that THE WORK IS NOT DONE. The comment says which, and the arm says so too rather than posing as an assertion about what a user sees. THE ARM'S CANCELLATION LANDS INSIDE THE STAT WITH NO TIMER -- the handler runs synchronously to its first await, so aborting before the returned promise is awaited is deterministic under any load, which a `setTimeout` would not be on this machine. DEGENERATE STATED IN ADVANCE AND RUN: with the check deleted the handler answers with a `detail` and a block carrying the entries -- 9 pass / 1 fail, the new arm alone reddening -- and it is paired in the same test with the uncancelled answer, or `the listing was skipped` and `this fixture has nothing to show` would be one observation. Commit a1b77eb.",
            "UNMEASURED AND THE FIRST TASK MEASURES IT: that a directory can be stat-able and unlistable is standard posix and has not been read on these two runtimes. If the staging cannot be made to bite, THE STAGING CHANGES AND THE PROPERTY DOES NOT.",
            "REVISE STAGE 2 ROUND 2 (codex): THE REFUSAL ABOVE WAS TOO WIDE AND A SECOND CHECKPOINT IS NOW TAKEN INSIDE THE LISTING. The refused seam is a cancellation arriving MID-DRAIN; the seam between the handler's own check and the FIRST ENTRY -- the handle open, nothing read off it -- is a different one, and the same measurement that refuses the first permits it. RE-MEASURED FOR THIS SHAPE rather than inherited: open, no read, explicit close, 500 rounds, bun 1.3.13 7 -> 7 and deno 2.8.3 21 -> 21, against 22 -> 522 for the same rounds with ONE entry read. THE MECHANISM IS NOW READ OFF DENO'S OWN `Dir` INSTEAD OF INFERRED: the descriptor is opened lazily by the first `read()`, `Dir.close()` only marks the facade closed (its own comment says directories need no closing), and the inner iterator holding the descriptor is dropped unfinished -- which is exactly what would retire the refusal. WHAT THE CHECKPOINT BUYS DIFFERS BY RUNTIME AND THE SMALLER HALF IS WRITTEN DOWN: on bun the whole read, since its `Dir` materialises the directory on the first read; on deno the async drain only, because `opendir` there has ALREADY read the directory synchronously to fail early on a non-directory. TWO DEGENERATES STATED IN ADVANCE AND RUN, both 11 pass / 1 fail with the new arm alone reddening and the answer carrying `2 entries` and the names: the check DELETED, and the check MOVED to before the open -- the second is what the arm's queued abort is for, since a cancellation taken synchronously in the first read would be in place before `opendir` was called and could not tell the two placements apart. Commit b316342.",
            "REVISE STAGE 2 ROUND 3 (the Product Owner's own reading), AND IT RETIRES THE `ENOTDIR IS NOT CONSTRUCTED` NOTE OF THIS SUBTASK ON ITS OWN REASON: that note said the case needs a race between two calls made back to back and that this handler offers no seam between them. THIS SPRINT BUILT THE SEAM. The abort is READ between the stat and the open, the signal is the CALLER'S OBJECT, and a getter is arbitrary synchronous code running at exactly that point -- so a getter that swaps the directory for a file needs no race, no timer and no second thread, and the earlier stat snapshot still saying `directory` is what makes the open land on a file. RUN BEFORE IT WAS BELIEVED, and it constructs on both runtimes. WHERE THE REJECTION SURFACES DIFFERS AND BOTH WERE MEASURED, since the member file runs under bun alone: deno 2.8.3 rejects AT THE OPEN (`not a directory, opendir`), bun 1.3.13's lazy open resolves and the FIRST READ rejects (`not a directory, scandir`). One catch covers both. BOTH PREMISES ASSERTED so the arm cannot pass vacuously -- the answer's own `detail` places the stat before the swap, a fresh `statSync` says the swap happened. DEGENERATE: ENOTDIR rethrown out of that catch, 13 pass / 1 fail with the new arm alone reddening and the rejection escaping the handler, which is what says the arm reaches the catch. Commit 838c453.",
            "REVISE STAGE 2 ROUND 3 (codex), AND IT NARROWS THE ARM COMMIT b316342 ADDED RATHER THAN RETIRING IT: that arm was named `a resolve cancelled while its directory is opening` and `await opendir` opens no such window. MEASURED at a hundred thousand entries, where a lazy open and an eager one differ by most of a second: the call yields exactly ONE MICROTASK turn and NO macrotask turn on either runtime -- deno spends 777-859 ms INSIDE it and a `setTimeout(0)` queued beforehand has still not fired when the continuation runs; bun spends 0-5 ms and reads the same. So the promise is ALREADY FULFILLED when it is awaited, the arm's queued abort lands after the handle exists and before the first read, and A CANCELLATION THE EVENT LOOP DELIVERS CANNOT REACH THAT SEAM AT ALL. NARROWED RATHER THAN YIELDED, and the alternative is priced rather than dismissed: a macrotask yield would buy skipping the DRAIN alone -- on deno the directory is already read by then -- at a loop turn of latency on every resolved directory, resting on internals neither runtime promises. What the checkpoint covers and what it does not is now written at the code and at the arm, and the check is KEPT with its worth stated. BOTH ROUND 2 DEGENERATES RE-RUN AND STILL REDDEN IT ALONE, 12 pass / 1 fail each: the check deleted, and the check moved to before the open. Commit 59ec428.",
            "REVISE STAGE 2 ROUND 3 (codex), AND IT RETIRES THE `IT RE-READS THE ABORT AFTER A HANDLER SETTLES` CLAUSE IN THE NOTE ABOVE AND AT TWO PROSE SITES: tsudoi does not wait for the handler. `driveAwaitedOnce` RACES the handler against the abort and `answerUnlessCancelled` re-reads the abort once THAT RACE settles, which is why a handler that never settles at all is still answered -32800. Read off methods.ts rather than inferred. THE CONCLUSION THIS PACKAGE RESTS ON SURVIVES UNTOUCHED -- a cancelled resolve's answer is discarded whatever the handler composed, so what the check buys is that the work is not done -- and what was wrong is the mechanism, which as stated made the guarantee sound like something a handler could postpone by not returning. Commit d6ad290.",
            "REVISE STAGE 2 ROUND 3 (codex): `THE UNTOUCHED ITEM IS WHAT A CANCELLED RESOLVE ANSWERS` WAS WRITTEN WHEN THERE WAS ONE SEAM AND LEFT STANDING WHEN ROUND 2 ADDED A SECOND, where it is false: by then the stat is SPENT, so the answer carries the directory's own `detail` line and a rebuilt block and lacks the listing alone. Two live arms already asserted exactly that shape, so the sentence contradicted the suite. Narrowed to the post-stat checkpoint, and the second seam is named for what it really is -- the same answer a directory that could not be LISTED gets, which is what the split between the two reads exists to produce. Commit 195a299.",
          ],
        },
        {
          test: "None -- prose, and the suite is the pair for the command blocks it does not touch.",
          implementation:
            "The reasons this change makes false, rewritten where they live: the module's arithmetic paragraph (it is no longer one syscall, and the listing is information the completion never had), its harmlessness paragraph (a forged mark now costs a directory listing, one step nearer `answered with its contents` than a stat was, and the line this handler will not cross is READING A FILE'S BYTES), the package index's count of internal names, the member README's method row and its `no entry's detail is read here`, and the example config's two mentions of the size and date.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "ec2eec1",
              message: "docs(completion-path): rewrite the reasons a directory listing makes false",
              phase: "green",
            },
          ],
          notes: [
            "EVERY NAMED SITE REWRITTEN, AND ONE MORE FOUND BY READING RATHER THAN BY THE LIST: the package index's SECOND paragraph also described the resolve half as fetching `the size and date`, which is the same falsehood one paragraph above the count that was named. Found by reading the file the count lives in.",
            "THE COUNT WAS REPAIRED BY NAMING AND NOT BY WRITING THE NEW NUMBER, which is this project's own convention and is worth the line here because the count moved TWICE inside one sprint -- the mark's reader in subtask 1, the composer and the listing type in subtask 2. A number that moves twice in one sprint is a number that will be wrong again.",
            "THE MEMBER README GAINED A PARAGRAPH RATHER THAN ONLY LOSING A FALSE ONE: what resolving one item now costs is a fact an installing stranger reads nowhere else -- the full listing, the bound on what is rendered, the total, hidden entries shown, and that nothing recurses here either.",
            "THE FIFTH CRITERION'S OWN FALSIFIER WAS RUN RATHER THAN ARGUED, since that criterion is a PIN and a pin nobody perturbs is a pin nobody has read: with the directory ENTRY's byte size put on the detail line -- the mistake the comment refuses -- 10 pass / 6 fail across both runtimes, the pin test named first in each. Restored, and the tree read clean afterwards.",
            "THE SIZE REFUSAL SURVIVES AND STRENGTHENS, and saying so is the point: the listing is the honest answer to the question a directory's byte size answered badly. That is the constraint that outlived the mechanism change.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "THE COMPOSITION IS A REBUILD AND NOT AN APPEND, AND THE DEVELOPER WITHDREW THEIR OWN PROPOSAL ON THE REASON RATHER THAN ON AUTHORITY: they weighed line count and composer drift, the PO weighed PROVENANCE, and a string the client can put anything in is not a smaller trust surface than the mark -- it is the same surface, one field away. The duplication objection dissolved on reading: the two modules already share the mark by a relative import, and the package's published surface names only its entry point, so one composer serves both callers without publishing anything.",
        "THE REBUILD FIRES FOR BOTH KINDS. Rebuilding for directories alone would leave a FILE answered with the client's own text, which is the thing the ruling refuses.",
        "AN EARLIER PO RULING IS RETIRED BY MEASUREMENT AND THE RETIREMENT IS RECORDED RATHER THAN QUIETLY REPLACED: `no total, because a total is the walk`. MEASURED on one directory of five thousand entries, names only -- the whole drain is 51 ms on bun and 135 ms on deno, against one stat at 0.225 / 0.298 ms, and against the ~1.1 s per KEYSTROKE that this module exists to refuse. And the completion half beside it ALREADY drains the entire directory on every keystroke to filter by prefix, so a full drain once per HIGHLIGHT cannot be the expensive thing in this package. WHAT DOES NOT SHRINK IS THE PAYLOAD: those names are eighty-five thousand characters where the first twenty are three hundred, which is what the bound is actually about.",
        "THE ACCEPTANCE OF AN UNBOUNDED DIRECTORY RESTED ON A SENTENCE THAT WAS FALSE, AND THE SECOND INDEPENDENT REVIEWER IS WHAT CAUGHT IT: `the cost is linear` -- while the shape read every name into an array and SORTED it. MEASURED at a hundred thousand entries, the size the original reading never took: 888 ms on bun and 1289 ms on deno, the sort alone 515 and 386. WHAT THIS PACKAGE RETAINS IS NOW BOUNDED INSTEAD OF THE ACCEPTANCE BEING KEPT: entries are streamed and only the best twenty kept, so the whole directory is still read -- which is what lets the answer state an exact total -- and no array of its size is built or sorted here. THE SENTENCE THAT REPLACED THE FIRST FALSE ONE WAS FALSE TOO, and this record is the third place on this subject to need repair: comparisons remain LINEAR, and NEITHER RUNTIME STREAMS FROM THE KERNEL -- but the fourth reading narrowed even that. `retained behind the handle` is BUN'S SHAPE ALONE (30 MB at the open, 61 MB after one entry). DENO'S O(N) AT THE OPEN IS TRANSIENT: its open takes a synchronous full read only to fail early and THROWS THE RESULT AWAY, storing the path and reading again lazily -- sixteen unread handles at a hundred thousand entries leave the heap unmoved across a forced collection, where sixteen retained copies would be near three times the plateau. TWO REVIEWERS WERE WRONG ABOUT THE MECHANISM ON THE WAY: one attributed the residue to a thirty-two entry buffer neither runtime uses, and the correction after it kept a retention claim only one runtime supports. WHAT THIS COSTS AND IT IS WRITTEN DOWN: streaming is SLOWER ON DENO AT EVERY SIZE MEASURED -- 45 to 127 ms at five thousand AND 1289 to 1977 ms at a hundred thousand -- so on that runtime it buys the working set and not the tail, and it buys both only on bun.",
        "HIDDEN ENTRIES ARE SHOWN, RULED NOW BECAUSE IT WAS UNRULED RATHER THAN DECIDED. The deciding fact is inside this package: the completion half already offers dotfiles, so a block that hid them would make the two halves of ONE package disagree about ONE directory -- the popup offering a hidden file while the block describing its parent says it is not there.",
        "AND THEY ARE SHOWN LAST, WHICH SHARPENS THAT RULING RATHER THAN AMENDING IT -- MEASURED, AND WHAT IT MEASURES IS THAT TODAY'S ORDER SHIPS BY ACCIDENT: the bound renders the first twenty names in code-unit order and `.` sorts before every alphanumeric, so a directory of twenty or more dotfiles renders TWENTY DOTFILES AND ZERO ORDINARY ENTRIES -- 21 dotfiles beside `index.ts`, `package.json`, `README.md`, `src`, `tsconfig.json` read back as `26 entries, first 20 shown` and then nothing but dotfiles. THE DECIDING FACT IS THAT THE RULING ABOVE IS ABOUT MEMBERSHIP AND NOT ABOUT ORDER: it exists so the two halves of one package cannot disagree about whether `.env` is IN a directory, and `itemsFrom` SORTS NOTHING -- it yields in the filesystem's own order and the client orders the popup -- so the completion half makes no ordering claim a grouped block could contradict. What is new this sprint is the BOUND, whose slice is order-dependent, and the order front-loads what the user is least likely to want in the directory they are likeliest to highlight: a project root, which lists as all noise. RAISING THE BOUND IS REFUSED -- it starves at 25 dotfiles instead of 20, and it is paid for out of the payload argument the bound exists for. HIDDEN IS A LEADING `.` AND NOTHING ELSE, decidable from the name with no syscall: reading Windows' hidden attribute is a stat per entry, which is the cost this package exists to refuse. THE KEY BECOMES (hidden, name) AND THE LOCALE REFUSAL IS UNTOUCHED -- still code units, still machine-independent, still whole-value assertable. THE TOTAL STILL COUNTS HIDDEN ENTRIES and the header does not move; membership is exactly where it was. PINNED BY one fixture holding more dotfiles than the bound beside a handful of ordinary entries, whole-value equality on the rendered names: a plain sort cannot pass it, and filtering dotfiles out reddens it too, on the names AND on `first N shown`. THE COST IS THE MIRROR OF THE DEFECT AND IS ACCEPTED WITH ITS SHAPE WRITTEN DOWN: dotfiles become the systematically truncated class where ordinary entries were, so a directory of 25 ordinary entries and 5 dotfiles now renders twenty ordinary names and no dotfile at all. A user asking what is in a directory is asking about the ordinary entries first; the total still says the rest are there. THREE CONSEQUENCES ARE DELIBERATE RATHER THAN COLLATERAL: the existing three-entry expectation flips to `alpha`, `beta.txt`, `.hidden` and stays the MEMBERSHIP witness; the MEMBER copy of the fixture helper -- the root copy already narrowed and serves a caller that names its own dotfiles -- narrows to bulk staging in the same edit that is already fixing its stale sentence; and the member README paragraph already in flight must read `shown, after the ordinary ones`. IT IS THE ONLY BEHAVIORAL ONE OF THE TEN FINDINGS: it moves what goes on the wire, so it is a red-first subtask of its own and the Definition of Done is re-run whole -- the sprint's 780/0 no longer covers the tree, and folded into a prose commit this change would skip its red.",
        "THE IDENTITY GATE STAYS `completedPath` ALONE, AND THE WIDENED COST IS RECORDED RATHER THAN GUARDED. What this sprint changed is the BLAST RADIUS of a false positive and not its likelihood: a foreign item whose `data` happens to carry our key used to lose its one-line `detail` and now has its multi-line block REPLACED, so another server's user is shown documentation about a path nobody's completion offered them. That belongs in the forged-mark paragraph beside the rest of what a false mark costs, and it is not there yet. GATING ALSO ON THE SOURCE CHECK IS REFUSED, ON THIS REPOSITORY'S OWN EVIDENCE: `pathCompletion` is the identity and collides with nothing observed anywhere, while `source` is the key a fixture in this suite already shows another server writing under `data` -- so requiring both adds a second coincidence on the ONE key demonstrably shared, which is the weaker half of the conjunction. AND IT WOULD COST A LIVE WITNESS: the arm `a source name no completion of ours produced is left out of the answer` drives an item with a valid path and an invalid source, and under the wider gate that item comes back untouched -- the drop-rather-than-echo rule would survive as a call on the composer and never as a thing the HANDLER does. THE SOURCE CHECK IS A COMPOSITION RULE AND NOT AN IDENTITY CHECK, which is what the module already promises where it says that check is not a repair of the forgery boundary. IT PINS NOTHING NEW because it changes no code: every existing arm stands and the fix is the paragraph -- WHICH MAY NOT NAME THE FIXTURE BY PATH, since the paragraph lives in a shipped module and the packed-members citation guard already fired for exactly that once this sprint.",
        "THE BLOCK'S LINE GRAMMAR IS NOW LOAD-BEARING, and it is the one constraint I add to a finding I am not taking back: a line reading `source: <name>` is a statement the SERVER makes, so no filename may render as a line the grammar assigns meaning to. The trade the module states -- nothing in a name is escaped, exactly as nothing in the path above it is -- was ruled when a name was only RENDERED, and it does not cover a name that FORGES the attribution the closed-set check just refused. What such a name renders as instead (dropped, escaped, control characters replaced) is the executor's choice.",
        "THE STAKEHOLDER'S `kind` NAMES THE CASE AND IS NOT A DIRECTIVE TO READ THE ITEM'S OWN `kind` FIELD: that field is client-supplied, forgeable, and stale by resolve time. The branch stays on a FRESH stat, which is where the detail line takes it today.",
        "THE FIRST CHECK REDDENED ONCE AT THE END OF THIS SPRINT AND IT WAS THE MACHINE, MEASURED RATHER THAN ASSUMED -- recorded because the next PBI in this backlog exists for exactly this ambiguity and a reviewer will otherwise read the red as the increment's. `bun test` at load average 58-61 gave 779 pass / 1 fail / 1 error in 321s, the failure being `the same two members pass once the error is removed` with the text `this test timed out after 5000ms` and a spawned check reporting exit code `null`. THE SAME FILE ALONE: 19 pass / 0 fail at the DEFAULT timeout, and 19 pass / 0 fail at `--timeout 30000`. THE WHOLE SUITE RE-RUN AS THE DEFINITION OF DONE SPELLS IT, load average 46: 780 pass / 0 fail, exit 0, with `timed out after` occurring ZERO times in the output. Nothing was changed between the two runs.",
        "THE `revise` SKILL RUNS AFTER THE DEVELOPER'S WORK AND BEFORE SPRINT REVIEW, WITH NO PR -- the stakeholder's standing instruction, now recorded at the head of this dashboard rather than as a retrospective improvement.",
      ],
    },
    {
      number: 52,
      pbi_id: "PBI-56",
      goal: "tsudoi is acquired by `bun install` the same way a stranger's project acquires it, and the CLI still starts and answers under Bun and Deno, from a checkout and from an installed tarball.",
      status: "done",
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
            "THE WEAKENING, STATED AS A WEAKENING AND NOT AS A CHANGE OF SUBJECT: `the repo's type check resolves the published subpaths to source` is gone and NOTHING REPLACES IT. The root check now reads dist, like a consumer. That was Dev's ~70% estimate arriving as fact -- an honest target REMOVED, which is what the move buys and what it costs, and the test that carried it says so in its own docstring rather than quietly asserting the new reading.",
            "AND ITS NEIGHBOUR WENT VACUOUS RATHER THAN RED, WHICH IS THE HARDER ONE TO CATCH: `every specifier mapping this config declares is one the check really matches` compares two empty sets once there are no mappings -- green, permanently, measuring nothing. It was RETIRED AND REPLACED by `no specifier the root check resolves is answered by a mapping`, read off tsc's own trace so a mapping arriving through `extends` is covered, which makes the C4 ruling executable and gives the ROOT the refusal `refuseMemberMappings` already gives every member.",
            "THE C4 RESIDUE, MEASURED AND WRITTEN IN FOUR PLACES AND PINNED IN NONE. With every dist/ removed, `tsc --noEmit` exits 1 with EXACTLY TWO errors, both at examples/tsudoi.config.ts and both naming HANDLER packages -- and `--traceResolution` shows `@atusy/tsudoi-language-server/types` resolving to packages/tsudoi-language-server/src/types.ts through the `default` arm, silently. With dist PRESENT, bun and deno both answer packages/tsudoi-language-server/dist/deps/types.js, read off `import.meta.resolve`, and tsc answers dist too. So C4's positive reading holds in this tree and the flip is real, undetected, and named in bunfig.toml, test/helpers/build.ts, CLAUDE.md and README.md.",
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
    number: 55,
    pbi_id: "PBI-61",
    goal: "Every TypeScript file this checkout owns is in some compiler's program, decided by reading the compilers' own file lists -- so the planted file that runs under `bun test` and is graded by nobody comes back red.",
    status: "in_progress",
    subtasks: [
      {
        test: "The existing arms of the five files that build throwaway workspaces, unchanged.",
        implementation:
          "The throwaway-workspace helper initialises a repository in the tree it makes AND STAGES IT, because the guard's subject is a CHECKOUT and two kinds of throwaway is what rots.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "29e98e5",
            message: "test(workspace): make every throwaway a checkout, staged",
            phase: "green",
          },
        ],
        notes: [
          "ITS OWN INCREMENT SO THE HELPER EDIT IS NOT DISCOVERED MID-RED. Nineteen call sites across five files need no edit; TWO of those files spawn the fifth check over these trees, not one. Blast radius read rather than assumed: a repository directory is a dot directory, which no default include reaches, and the package walker skips it for want of a manifest.",
          "THE PLAN WAS WRONG ABOUT `add` AND THE CORRECTION INVERTS EVERY PAIR: it recorded that `--others` needs only an initialised repository, which is true of the CANDIDATES and false of the PROGRAMS -- those are enumerated from TRACKED files, and a repository with nothing staged tracks nothing. Unstaged, every throwaway would have had zero programs, every file in it uncovered, and the unplanted half of every pair red. Staging is also as far as this goes without an identity, which a commit would need.",
          "MEASURED AFTER THE EDIT, THE WHOLE DEFINITION OF DONE: 815 pass / 0 fail across 55 FILES -- the same count as the baseline and not only the same colour -- and 0/0/0/0/0 across the five checks.",
          "WHAT IT BUYS THE ARMS, AND IT IS NOT ONLY THE GUARD BEING RUNNABLE: a test that wants the story's own moment -- a file JUST ADDED, which is untracked -- now writes it AFTER this helper returns. Staged through the helper, such an arm would measure the `--cached` half only.",
        ],
      },
      {
        test: "Eight arms, each a spawn of the fifth check over a throwaway tree, each paired with the same tree unplanted going green: a file beside a member whose config includes only its source; a file at a root whose config declares no include; a file reached only by an import; a member split across a check config and a build config, which stays GREEN and which a literal-name reader reports; this repository itself, offenders empty beside a non-empty candidate set; a personal ignore file not shrinking the subject; a root that is not a checkout, refused for want of an enumerator; a program whose include matches nothing contributing zero rather than aborting; and an emitted declaration not reported.",
        implementation:
          "A refusal in the workspace script, called LAST among the refusals in the fifth check and before any member is checked -- never from the shared preparation, which the test preload also runs.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE READER IS THE COMPILER'S OWN FILE LIST WITH RESOLUTION OFF -- the program's ROOT files, what the includes matched, and not the import closure. MEASURED, and it is why the JSON globs are not the reader: a default include does NOT reach a dot directory or a dot file, so a reimplementation of the glob says the opposite of what the compiler does. Cross-validated with a second instrument, and the first spelling of that second instrument CARRIED THE DEFECT IT WAS HUNTING -- a prefix match that missed `default` and reported every file in the program.",
          "THE CANDIDATE SET IS TRACKED AND UNTRACKED BUT NOT IGNORED, because the moment this item is about is a file just ADDED: reading tracked files alone leaves the guard reddening one run AFTER the bad commit. The two standing exclusions come free and are read rather than restated -- the ignore file already names the installed strangers and every built artifact, for its own reasons, in a file edited elsewhere.",
          "A PERSONAL IGNORE FILE MUST NOT SHRINK THE SUBJECT, measured on this machine: the global ignore here hides a file that is tracked-and-visible elsewhere, so a candidate set honouring it differs per developer. RESIDUE, named: a per-checkout exclude file cannot be neutralised the same way.",
          "PROGRAMS ARE ENUMERATED FROM TRACKED FILES ALONE AND THE ASYMMETRY IS DELIBERATE: a program is part of the declared verification surface and must be COMMITTED to count, while a candidate is a hazard the moment it exists. A stray uncommitted config claiming the whole tree would otherwise mark everything covered -- a silent permanent green. The other direction fails loudly and self-corrects.",
          "TWO SUBTRACTIONS, EACH FORCED BY A MEASUREMENT AND EACH OWNING AN ARM: anything under a program's own output directory, read per program from the effective configuration -- without it the guard is RED ON EVERY EXISTING THROWAWAY THAT BUILDS, since a throwaway carries no ignore file and its emitted declaration is untracked and in no program's roots; and anything under an installed-dependency directory, for the reason already recorded beside the package walker.",
          "A PROGRAM WHOSE INCLUDE MATCHES NOTHING MUST CONTRIBUTE ZERO RATHER THAN ABORT: measured, the compiler prints TS18003 and EXITS 1 on that shape, and both spawner files stage exactly it -- so without this arm about twenty existing arms break. The second half of the same arm is the opposite fault: a tracked config the compiler cannot read at all must be refused BY NAME, staged at a third config so neither existing refusal owns the red first.",
          "THE DEGENERATE THAT MATTERS IS NOT `REPORTS NOTHING`: it is `finds programs by the literal name`, which is green on this repository AND on every other planted arm, because no tracked file here is covered only by a build config. The split-member arm exists to give that degenerate a subject.",
        ],
      },
      {
        test: "Two plant sites uncovered by DIFFERENT mechanisms, so no single configuration edit can reach both: one inside the framework member outside its source directory, one under a dot directory. Both red planted, both green removed, and the report-everything degenerate refuted by the unplanted run.",
        implementation: "None -- this is the close the PO will accept and nothing else.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE OUTCOME THIS FORECLOSES, REFUSED EVEN WITH EVERY CHECK GREEN: the witness turned green by widening a config's include until it reaches the plant, with no refusal that reddens the NEXT file planted elsewhere. That satisfies the criterion in letter and leaves the property unenforced.",
          "THE SECOND SITE IS A PREDICTION AND NOT A FACT: the wildcard expansion is believed to skip names beginning with a dot, and it must be ESTABLISHED by planting and reading the file list. If it turns out covered, a second mechanism is found before the pair is believed.",
        ],
      },
      {
        test: "The existing package-shaped arms stay red for the same states and with the same sentence.",
        implementation:
          "The JSON-glob reader stops DECIDING coverage and becomes a diagnostic refinement over a fault the faithful reader already found: given an uncovered file whose directory holds a manifest the root excludes and the workspace does not declare, say the package sentence instead of many file sentences.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [
          "THE RULING AND ITS REASON: that reader is the UNFAITHFUL one this item was filed against -- it is why the planted probe ran under it and it said nothing. Leaving it deciding alongside the compiler's file list gives this repository TWO ANSWERS TO ONE QUESTION that can disagree with everything green, which is the disarmed-control shape this record keeps catching. ONE DECIDER.",
          "THE CONDITION THE PO WILL READ FOR: a run that answers one missing workspace entry with a wall of file sentences is a REGRESSION they refuse. The package-shaped fault keeps the package-shaped message and the repair it names.",
        ],
      },
      {
        test: "None new -- the citation guard and the README extraction are the pair.",
        implementation:
          "The reasons this change makes false or narrower: the package refusal's own superlative, which was ALREADY narrower than it read; the same sentence repeated in its test; the fifth check's header, which enumerates what that check owes and must name a fourth refusal without copying the ordering reasons of the other three; and the documentation, which gains an external tool among the prerequisites.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "THE SUBJECT IS NON-IGNORED, NON-DECLARATION TYPESCRIPT, AND THE SECOND HALF IS THE ONE EXCLUSION -- ruled as a property that can be READ rather than as a name. Declaration files are in a program's file list and checked by NOTHING, because every config here skips library checking; membership is therefore the WRONG predicate for them. THE EXCLUSION MUST BE READ FROM THE PROGRAM'S OWN REPORTED SETTING, so that flipping that setting off makes declaration files RE-ENTER the subject. A guard that stays quiet there has a NAME in it, not a property.",
      "OVER EVERYTHING ELSE THE EXCLUSION SET IS EMPTY TODAY AND SHIPS EMPTY. MEASURED: every candidate in this checkout is matched by an include of at least one program. NO EXEMPTION FACILITY IS BUILT -- a facility with no user is where a name gets appended later with no review. If a file genuinely needs one, that comes back to the PO before the sprint closes; and if a facility ships anyway, AN EXCLUSION EXCUSING ZERO FILES MUST ITSELF REDDEN.",
      "PRICED NOW RATHER THAN DISCOVERED AS A FLAKE: a stray non-ignored source file left behind by a test reddens this check, and two tests describe leaving untracked files behind. THAT COLOUR IS CORRECT -- a stray file nothing type-checks IS the fault this item names -- and it is ruled rather than tolerated.",
      "EVERY READING IS TAKEN IN THE STATE THE DEFINITION OF DONE ESTABLISHES, artifacts present. With them absent the root program falls through its source arm and its file list holds MEMBER SOURCE, so the same guard reads a different tree and the measurement does not reproduce.",
      "WHAT THE INSTRUMENT CANNOT SEPARATE, AND THE GUARD IS NAMED FOR THE HALF IT HAS: `included in a program` is not `type-checked`. Measured -- a declaration file carrying two errors exits 0 with library checking skipped and exits 1 naming both without it.",
      "A SECOND RESIDUE, MEASURED AND NAMED RATHER THAN FIXED: the test runner DISCOVERS a test file under an ignored directory, so a source file there runs, is type-checked by nothing, and this guard will not see it. Widening the subject to ignored files brings back every installed stranger and every built artifact -- and that directory exists to hold what this repository does not account for.",
      "A FILE COVERED BY TWO PROGRAMS STAYS GREEN WHEN ONE STOPS COVERING IT. Disclosed: the framework's source is in both its check and its build configuration, so narrowing one alone reddens nothing. The guard defends `some program includes it`, not per-program coverage.",
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
