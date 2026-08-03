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
  ],
  completed: [
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
    {
      number: 56,
      pbi_id: "PBI-69",
      goal: "No commit is taken on a Definition of Done whose red was off screen: verifying a change is ONE command, it names every check's own result, and it is the only form this project documents.",
      status: "done",
      subtasks: [
        {
          test: "In a throwaway tree carrying its own dashboard whose checks log their own names: all pass -> exit 0; THE FIRST FAILS AND THE LAST PASSES -> non-zero, naming the failing check, with the last check's own pass still reported; two fail -> both named; an EMPTY list of checks -> refused rather than green.",
          implementation:
            "A script beside the workspace one, reading the checks by EXECUTING the dashboard and parsing the JSON it already prints, looping all of them without stopping at the first failure.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "7f0324a",
              message: "feat(scripts): one command that takes every check and reports each one",
              phase: "green",
            },
            {
              hash: "e3d6685",
              message: "test(dod): make the throwaway dashboard compute what it prints",
              phase: "green",
            },
            {
              hash: "ed797e2",
              message: "test(dod): make the summary word a function of the run, both directions",
              phase: "green",
            },
            {
              hash: "be27ff9",
              message: "feat(scripts): refuse a `run` this runner cannot execute faithfully",
              phase: "green",
            },
          ],
          notes: [
            "THE FIRST-FAILS-LAST-PASSES ARM IS THE RECORDED DEFECT VERBATIM: a runner reading the last command's status passes an arm that fails the LAST check, and this project's five occurrences are all that shape.",
            "IT CANNOT BE A SIXTH CHECK -- a check that runs every check would run itself, unbounded -- AND IT CANNOT REPLACE THE FIVE, because the five are the list it reads. AMENDED IN THE REVIEW ROUND RATHER THAN LEFT STANDING, because it is a present-tense design claim and it became false: this said `the dashboard's run stays an executable shell command`, and the runner never ran one. It is a COMMAND LINE the runner spawns, and one it cannot execute faithfully is refused; the property this sentence was reaching for -- every `run` is still a line a maintainer can type at a prompt -- survives the correction intact.",
            "THE INPUT CONTRACT WAS MEASURED BEFORE A LINE WAS WRITTEN, because every arm here rests on it: `bun run scrum.ts` at this sprint's base exits 0, writes ZERO BYTES to stderr, and its stdout parses as JSON whose `definition_of_done.checks` is the five pairs. A runner built on an unmeasured premise about the file it reads would have been this project's own recorded shape.",
            "RED THEN GREEN, AND THE RED IS THE HALF WORTH RECORDING: with no runner in the tree, 0 pass / 4 fail -- and the EMPTY-LIST arm failed on its TEXT rather than on its colour, which is the only reason it measures anything. Everything that goes wrong here exits non-zero, a runner that does not exist included, so an arm reading the colour alone would have been born green. After the implementation, 4 pass / 0 fail, and the whole suite 851 pass / 0 fail across 57 files against a base of 847 across 56.",
            "TWO DEGENERATES, PREDICTED IN WRITING BEFORE EACH RUN AND BOTH BEHAVING AS PREDICTED. THE RECORDED DEFECT ITSELF -- verdict and report taken from the LAST result alone -- gives 2 pass / 2 fail: the two positional arms red, the all-pass arm green, which is exactly why an all-pass arm certifies nothing here. AND AN EMPTY LIST RUN AS WRITTEN rather than refused gives 3 pass / 1 fail. Neither degenerate is reachable from the other's arms, which is what earns them both.",
            "REVIEW ROUND, FINDING 1, AND IT IS THIS PROJECT'S OWN DEFECT ARRIVING INSIDE THE INSTRUMENT BUILT TO RETIRE IT: THE SUMMARY HEADLINE COULD LIE WITH EVERY ARM GREEN. MEASURED -- the verdict word hardwired to `PASSED`, per-check lines and exit code untouched -- 12 pass / 0 fail, because `Definition of Done: FAILED` was asserted NOWHERE IN THE FILE. The only summary arm asserted one direction, which a constant satisfies. The header of that very runner says the five recorded occurrences were a reader taking a grep for the run's status, and the summary line is the line a reader greps. One arm now runs two trees and asserts both directions with the WHOLE string, never the bare word, since a failing report carries `[FAILED] alpha` whatever the summary says. DEGENERATES RE-RUN: hardwired PASSED, 12 pass / 1 fail, this arm alone; hardwired FAILED, 10 pass / 3 fail. Commit ed797e2.",
            "FINDING 6, A FIXTURE-DESIGN WEAKNESS AGAINST THIS FILE'S OWN LOAD-BEARING CLAIM: the runner's header calls EXECUTING the dashboard the decision everything rests on, and the fixture could not hold it. The throwaway dashboard wrote its object INLINED, so its text WAS its output and any means of obtaining the JSON passed -- MEASURED, a runner slicing the file from its first brace to its last, never running it, left 12 pass / 0 fail. Severity is bounded and stated: against the real dashboard, a TypeScript program, that runner exits 1, so nothing shipped wrong; the arm simply did not hold the claim. The fixture now declares its pairs FLAT and assembles the shape at run time, so no substring of it is the JSON it prints. DEGENERATE RE-RUN: 0 pass / 12 fail. Commit e3d6685.",
            'FINDING 4, FROM CODEX, THE ONLY ONE OF THE SIX THAT MOVED THE PRODUCT: `run` WAS DOCUMENTED AS A SHELL COMMAND AND WAS NEVER RUN AS ONE. MEASURED here as filed -- `run: "true && false"` split on spaces spawns `true` with the arguments `&&` and `false`, exits 0, and printed `[PASSED] conjunction -- exit 0 -- $ true && false`, where a shell runs `false` and fails; redirections, quoted arguments and globs misread the same way, in silence. The direct spawn was taken deliberately and the reasoning holds -- through a shell a missing binary arrives as exit 127 and cannot be told from a check that ran and said no -- but the price was being paid where no reader met it, least of all at the dashboard field calling it a shell command. OF THE THREE ANSWERS, refusing is the only one that gives up neither reading, and a misread command has no colour at all. `REFUSED` is its own verdict beside `UNRUNNABLE` because the reader\'s next move differs: rewrite the entry, not install a tool. THE ARM CARRIES A POSITIVE CONTROL, without which an over-broad predicate ships green -- no other `run` in that file carries a flag or a `.` argument, so a predicate refusing those would redden `oxfmt --check .` in the real Definition of Done and NOTHING in the suite. DEGENERATE RE-RUN, the predicate never firing: 14 pass / 1 fail. Commit be27ff9.',
            "DISCLOSED IN ADVANCE RATHER THAN LEFT FOR THE NEXT REVIEWER, AND IT IS THE CLASS THIS RECORD HAS NOW FILED FIVE TIMES: be27ff9 SHIPPED WITH THIS DASHBOARD'S OWN FIELD COMMENT STILL CALLING `run` A SHELL COMMAND, FOR EXACTLY ONE COMMIT. The cause is the standing rule that scrum.ts moves alone in its own commits, which cannot be met in the same breath as a code change that falsifies a comment living here; the alternative was folding the dashboard into the feature commit. It was seen when written, not found afterwards, and the very next commit is the correction.",
          ],
        },
        {
          test: "Whole-value equality on the invocation log against the dashboard's declared ORDER and arity; the per-check report of a FAILING run carries each check's name, its command as run, and its own exit; and a dashboard with a different set of checks changes what runs WITH NO EDIT TO THE RUNNER.",
          implementation: "Per-check report lines; output captured and echoed.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "5231fbe",
              message:
                "test(dod): read the invocation log as a sequence, and require a sixth check to run",
              phase: "green",
            },
            {
              hash: "c64fcc3",
              message: "test(dod): require each check's own diagnostic to reach the reader",
              phase: "green",
            },
            {
              hash: "50d5664",
              message: "test(dod): pause the first check, so the order arm reads order",
              phase: "green",
            },
          ],
          notes: [
            "BORN GREEN, DECLARED AS SUCH BEFORE THE RUN AND NOT DISCOVERED AFTERWARDS: the per-check report lines landed in the first subtask, because its own arms needed the words `[FAILED] alpha` and `[PASSED] gamma` to exist. 7 pass / 0 fail on the first execution, which is worth nothing by itself -- ALL THE EVIDENCE FOR THESE THREE ARMS COMES FROM THE DEGENERATES, and that is the reason they were run before the arms were believed.",
            "THREE DEGENERATES, EACH PREDICTED IN WRITING AND EACH REDDENING EXACTLY WHAT WAS PREDICTED. Checks SORTED by name before running -- a move that changes no value -- 5 pass / 2 fail, the sequence arm and the six-check arm; the runner EXITING INSIDE ITS LOOP at the first red, 4 pass / 3 fail, every one of them an arm about what is reported AFTER a failure; and the runner ASSUMING THE LIST IS FIVE LONG, 6 pass / 1 fail, the six-check arm alone. The third is the product owner's refusal in its cheapest form and no other arm in the file can see it.",
            "THE SUITE AFTER THIS SUBTASK: 854 pass / 0 fail across 57 files, all five checks read individually and each exit 0.",
            "`CAPTURED AND ECHOED` WAS HALF ASSERTED AND THE MISSING HALF WAS FOUND BY REVIEW, NOT BY A RED. Twelve arms proved CAPTURED -- the warning count is a parse of the captured bytes -- and NOT ONE proved ECHOED: they all read what the RUNNER writes, so a runner swallowing every check's own output satisfied all of them, including the two-run report equality, which holds when both runs echo nothing. MEASURED as a fourth degenerate for this subtask: deleting the two writes that tee a child's streams leaves 11 pass / 1 fail once the arm exists, and left 12 pass / 0 fail before it. The arm lives in the error-lint tree because the subject was already there, and what it reads is the linter's own diagnostic line rather than anything this runner composes.",
            "THE LAST ARM IS THE PO'S REFUSAL MADE MEASURABLE: a green run that did not execute a check the dashboard lists, because the runner held its own copy, is green and silent and lets the Definition of Done shrink unnoticed -- the disarmed-control shape promoted into the instrument that certifies everything else.",
            "ORDER IS LOAD-BEARING AND NOT COSMETIC: the first check builds every artifact the fourth reads. Sequential, in the declared order, no parallelism. AND `ALL FIVE RAN` IS MEMBERSHIP WHERE THE PROPERTY IS ORDER -- reordering changes no value -- so the arm reads the log as a SEQUENCE.",
            "`REPORTS EVERY CHECK'S STATUS` IS SATISFIED AT THE EXIT-CODE LEVEL BY A RUNNER THAT EXITS INSIDE THE LOOP: moving the exit earlier changes no value, so the arm reads the REPORT TEXT of a failing run and requires the later checks' own statuses present.",
            "REVIEW ROUND, THE OBSERVATION THAT CAME WITH THE SIX AND WAS ROUTED FOR A DECISION RATHER THAN FILED AS A HOLE -- TAKEN, BECAUSE THE RATE IS ITSELF THE EVIDENCE. Three commands that each take milliseconds tend to finish in the order they were STARTED even when nothing sequenced them, so this arm's log could not separate order from coincidence: MEASURED against a runner starting every check at once, the arm NAMED for the property reddened on 3 of 5 runs for the reviewer and on 4 of 5 re-run here, while the FILE reddened 5 of 5 both times -- its detection carried by the first-fails-last-passes arm and the six-check arm, neither of which is about order. A PAUSE ON THE FIRST CHECK puts that entry LAST under any parallel execution: same degenerate, same five runs, 5 of 5. AN ARM THAT USUALLY REDDENS IS A FLAKE IN THE OTHER DIRECTION, and the order it defends is not cosmetic -- the first real check builds every artifact the fourth reads. Commit 50d5664.",
          ],
        },
        {
          test: "A check naming a binary that does not exist is NON-GREEN and distinguishable in the report from one that ran and failed; and the runner invoked FROM A SUBDIRECTORY produces the same reading as from the root.",
          implementation:
            "Spawn-error handling; the root taken from the argument or from the script's own location, never from the working directory.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "996dfcc",
              message:
                "test(dod): separate a check that never started from one that ran and said no",
              phase: "green",
            },
            {
              hash: "1212c4a",
              message: "test(dod): put one missing binary in a tree of passes, so it gates alone",
              phase: "green",
            },
          ],
          notes: [
            "BOTH ARMS BORN GREEN AND DECLARED SO BEFORE THE RUN -- 9 pass / 0 fail -- because the spawn-error handling and the location-derived root were written in the first subtask. FOUR DEGENERATES CARRY THE EVIDENCE INSTEAD, each predicted and each reddening one arm and no other: a spawn error COUNTED AS A PASS, 8 pass / 1 fail; a check that never started PRINTED AS ONE THAT RAN AND FAILED -- byte-identical text, the state this project has already been caught reading as one red -- 8 pass / 1 fail; the root taken FROM THE WORKING DIRECTORY, 8 pass / 1 fail; and the checks handed the WORKING DIRECTORY INSTEAD OF THE ROOT, 8 pass / 1 fail.",
            "THE FOURTH DEGENERATE IS THE ONE THAT SHAPED THE ARM, and it is invisible to every exit code in the file: handing the checks a subdirectory changes no status and no report line. It is separated only by a check that RECORDS THE DIRECTORY IT RAN IN, compared whole between the run from the root and the run from below it -- which is why one check in that tree records where it ran rather than its name.",
            "THE SUBDIRECTORY ARM RUNS A BYTE COPY OF THE RUNNER INSIDE THE THROWAWAY, and the reason is worth keeping: with no argument the shipped runner takes THIS repository's Definition of Done, so the arm measuring the argument-free route cannot use the shipped path without running `bun test` inside `bun test`.",
            "THE SUITE AFTER THIS SUBTASK: 856 pass / 0 fail across 57 files, five exits read individually, all 0.",
            "UNRUNNABLE IS NOT PASSED, AND TODAY THIS MACHINE IS THE WITNESS: two of the five tools are absent from PATH here, so a runner treating a spawn error as anything but non-green would ship green over two checks that never ran.",
            "THE WORKING DIRECTORY IS A HAZARD AND NOT A DETAIL: the first check finds its configuration only in the current directory, so a runner inheriting a subdirectory would report five greens over a suite that built nothing.",
            "REVIEW ROUND, FINDING 2, AND THIS MACHINE IS THE LIVE WITNESS FOR IT: AN UNRUNNABLE CHECK DID NOT HAVE TO GATE THE RUN. MEASURED -- the gate narrowed from `the outcome is not passed` to `the outcome is failed`, with outcome, reason and every byte of the report unchanged -- 12 pass / 0 fail in the file AND 859 pass / 0 fail across the whole suite. The arm named for it carried its non-green half on a DIFFERENT check in the same tree, one that ran and said no, so it measured the DISTINGUISHABILITY half and never the gating half: two hazards in one test, one of them unmeasured. IT IS NOT THE DEGENERATE ALREADY RECORDED ONE ENTRY ABOVE -- a spawn error counted as a pass flips the outcome and reddens the report text; this one moves the exit code alone. `oxfmt` and `tsc` are absent from this machine's own PATH, so under that narrowing the runner would ship exit 0 today over two checks that never ran. The repair is a tree whose SOLE non-pass is the missing binary, with every other check's pass asserted so the colour is attributable. DEGENERATE RE-RUN: 13 pass / 1 fail, the new arm alone. Commit 1212c4a.",
          ],
        },
        {
          test: "A planted warning -> count one, exit 0, the count present in the verdict; an error-only tree -> zero warnings beside a failure; a clean tree -> zero.",
          implementation:
            "The warning count read from the same invocation whose exit was read, printed in the same summary as the exits.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "ea63b6a",
              message:
                "test(dod): read the warning count off the real linter, and require it not to gate",
              phase: "green",
            },
            {
              hash: "97d5665",
              message: "test(dod): sandwich the linter, so the warning count is read as a sum",
              phase: "green",
            },
            {
              hash: "d30f5c1",
              message: "test(dod): give the linter's run an identity, so two readings are one run",
              phase: "green",
            },
          ],
          notes: [
            "THE ARMS RUN THE LINTER RATHER THAN ECHOING THE SHAPE THE PARSE LOOKS FOR, and that is a choice with a cost: an arm printing `path:line:col: warning ...` itself would assert the runner against its own regular expression and would stay green the day oxlint changes how a diagnostic is printed -- which is the day this must fail. What is planted instead is SOURCE: a generator with no `yield` for the warning, a missing file extension for the error, both measured before the arms were authored (warning tree exit 0 with one line, error tree exit 1 with one line, clean tree silent).",
            "MEASURED IN THE STAGED TREE AND NOT ONLY IN THIS REPOSITORY: the count over a tree carrying the planted file, a dashboard, two shell probes and a copy of the runner is exactly 1 -- nothing else in a throwaway contributes a diagnostic -- and 0 in the error tree. The reading over this repository's own five checks at the sprint's base was 1, the deliberate fixture warning.",
            "BORN GREEN, DECLARED IN ADVANCE -- 12 pass / 0 fail -- WITH THREE DEGENERATES, each predicted and each reddening one arm: the count HARDWIRED TO ZERO, 11 pass / 1 fail; EVERY DIAGNOSTIC COUNTED with severity ignored, 11 pass / 1 fail on the error tree alone, which is the arm that reads severity rather than volume; and WARNINGS GATING THE RUN, 11 pass / 1 fail, the ruling made falsifiable.",
            "THE SUITE AFTER THIS SUBTASK: 859 pass / 0 fail across 57 files, five exits read individually, all 0.",
            "A SECOND CRITERION AND NOT A CLAUSE OF THE FIRST, on this project's own rule that a hazard owns a test whose FIRST assertion it is: folded in, the exit-code assertions fire first and the warning reading could never be the thing that fails. The perturbation differs too -- planting a warning moves no exit code.",
            "REPORTED AND NOT GATING, RULED: this tree carries ONE deliberate warning whose fixture records a refusal to silence it, so failing on warnings would overturn a decision by way of a tooling change -- and an instrument red on every green tree retires itself.",
            "THE COUNT IS A PARSE, SO IT SHIPS WITH ITS PAIR. MEASURED on the installed linter, in a pipe and under a terminal alike: one line per diagnostic, no summary line -- so the count comes from lines, and re-measuring on a version bump is the maintenance this buys.",
            "REVIEW ROUND, FINDING 3 -- THE COUNT COULD COME FROM THE FIRST CHECK ALONE AND EVERY ARM STAYED GREEN, because the linted tree declared the linter ALONE. With one check the first result, the last result and the total are extensionally equal, so every weaker reading of the aggregate is satisfied: MEASURED, the sum replaced by the FIRST result's count, 12 pass / 0 fail. IN THE REAL DASHBOARD THE LINTER IS THE SECOND OF FIVE, so that runner ships `warnings: 0` over a linter that emitted one, and this record's own claim that the count aggregates over all five had no arm behind it. One silent check before the linter and one after, the count still one. THE LAST READING WAS BOUGHT IN THE SAME MOVE and is worth its half -- five recorded occurrences here are the LAST command's status read as the run's. DEGENERATES RE-RUN: first-only, 13 pass / 1 fail; last-only, 13 pass / 1 fail. Commit 97d5665.",
            "FINDING 5, FROM CODEX, AND IT IS AN IDENTITY PROBLEM RATHER THAN A VALUE ONE: the arm read an EXIT CODE and a WARNING COUNT off the linter and could not say they came from the same invocation of it. A runner spawning each check twice, taking the exit from the first run and the warnings from the second, prints exactly what was asserted -- the fixture is deterministic, so the second run's bytes are the first run's bytes. MEASURED with the bare `oxlint`: that runner left ALL THREE linted arms green, 9 pass / 5 fail with every red elsewhere in the file. The linter now runs through a wrapper that records its invocation and then `exec`s it, so the exit code and every parsed byte stay the real program's, and the log is asserted WHOLE. ARITY IS WHAT CARRIES IT: one entry is one invocation, so two readings cannot be two runs -- no nonce is needed and none was built. DEGENERATE RE-RUN: 7 pass / 7 fail, the two linted arms joining. Commit d30f5c1.",
          ],
        },
        {
          test: "The five real checks staged failing IN TURN, with predictions written before each run, and the paired unstaged green.",
          implementation:
            "Whatever repair a staging reveals; predicted none. Stagings are ADDED UNTRACKED FILES so nothing tracked is edited and cleanliness is verifiable.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "NO COMMIT OF ITS OWN AND THAT IS THE RESULT, NOT AN OMISSION: the predicted repair was none, and none was revealed. What this subtask produced is seven readings, each with its prediction written in a file before the run.",
            "THE FIVE STAGINGS, EACH AN ADDED UNTRACKED FILE, EACH READ THROUGH THE RUNNER ITSELF. A failing test file -> `[FAILED] Tests pass -- exit 1` with the other four `[PASSED]`, which is THE RECORDED DEFECT'S OWN SHAPE now printed: the red is first and the last check passes. `Bun.file(...)` at the root -> `[FAILED] Lint passes -- exit 1`, error severity because the linter's exit code does not move on warnings. Extra spaces around an `=` -> `[FAILED] Format check passes -- exit 1`. A root-level `const wrong: number = \"no\"` -> `[FAILED] Type check passes`. And the unstaged pair, run before all of them: exit 0, five `[PASSED]`, `warnings: 1`.",
            "PREDICTION MISSED, RECORDED RATHER THAN QUIETLY CORRECTED: the type-check staging was predicted to report `exit 2` and reported `exit 1`. The number was wrong, the property was not -- the report carries the check's OWN status rather than a normalised one -- and the miss was visible only because the prediction was written down first.",
            "AND THE PLAN'S OWN CLAIM ABOUT THE FIFTH STAGING IS FALSE ON THIS TREE, MEASURED: an untracked file under a dot directory was planned as the CLEAN single-check staging, and it reddens TWO checks -- `[FAILED] Tests pass` beside `[FAILED] Workspace members type-check`, 858 pass / 1 fail, the failing arm being `this repository holds no TypeScript file that no program includes` in test/uncovered-files.test.ts, which SPAWNS THE FIFTH CHECK OVER THIS CHECKOUT and requires its stderr empty. THE STRONGER STATEMENT THAT REPLACES IT: the fifth check cannot be staged alone at all here, whatever the staging, because an arm of the first check IS the fifth check over this repository. Both checks are named in one report, which is the property under test.",
            "THE STANDING RE-RUN CAME FOR FREE AND IS REPORTED AS ONE, because the question `which perturbation still has a target here` has an answer this sprint rather than the usual none: the dot-directory staging IS sprint 55's own perturbation -- a TypeScript file in this checkout that no program includes -- re-run against this sprint's tree. It reddened as recorded, and the two checks it reddens are named in one report, which is this increment's subject. REPRODUCED AND NOT INDEPENDENT: the verifier is the author.",
            "THE SIXTH STAGING EXISTS TO MOVE NO EXIT CODE, and it did not: a generator with no `yield` gives exit 0, verdict PASSED, `warnings: 2`. That is the whole reason the count is reported beside the exits rather than folded into them.",
            "ONE OF THE FIVE DOES NOT ISOLATE AND THE RECORD MUST SAY WHY: a type error inside a member breaks the preparation the first check runs, so the first check dies with the fifth. The clean single-check staging is an untracked source file under a directory no configuration includes -- which fires the guard whose own stated reason is that without it all five commands exit 0.",
            "THE LINTER'S STAGING MUST BE ERROR-LEVEL, because its exit code does not move on warnings; a second warning-shaped staging exists precisely to move NO exit code.",
          ],
        },
        {
          test: "None -- prose and the round's own procedure.",
          implementation:
            "The documentation's Commands section names the one form, with running a single check labelled DEBUGGING so it cannot be read as verification; and the filing bar lands in this dashboard's header where the round's standing instruction already lives.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "c4ba6f4",
              message:
                "docs(scrum): file the review round's bar in the header, and say at the site that the checks are data",
              phase: "green",
            },
          ],
          notes: [
            "README.md IS DELIBERATELY UNTOUCHED AND THE READING IS RECORDED RATHER THAN LEFT TO BE RE-DERIVED AT REVIEW: it names three of the five checks in prose and tells a reader to run `bun test` or the fifth check FIRST, which is build-model guidance about what makes `tsc --noEmit` readable on a fresh checkout -- not a second spelling of how to verify a change. The ruling forbids a fenced block there anyway, since that document's blocks are extracted and executed and the runner runs the suite.",
            "NO ARM, THEREFORE NO DEGENERATE, SAID RATHER THAN INVENTED: this subtask is prose, and a degenerate run against prose would be theatre. What it can be held to instead is where the words landed and what grades them.",
            "THE COMMANDS SECTION NOW OPENS WITH THE ONE FORM and carries the five under a DEBUGGING heading that says in its own words that running them by hand is not verifying a change. THE SYNC OBLIGATION IS NAMED AT THE OTHER END TOO, and it MOVED rather than disappearing: the runner reads `definition_of_done.checks` at run time, so a check added there costs no edit anywhere; what still has to be kept by hand is the DEBUGGING list, which nothing executes and which sits in a file this repository does not track.",
            "THE FILING BAR LANDED VERBATIM IN THE HEADER BESIDE THE ROUND'S STANDING INSTRUCTION, and the dashboard's `definition_of_done` now carries a comment AT THE SITE saying the list is the runner's data and that the runner is not added here as a sixth entry -- which is where that edit would be made, and the only place a reader meets the five without meeting the runner.",
            "READ AGAINST THIS PROJECT'S OWN CONVENTION BEFORE IT LANDED: no fenced block was added to README.md, whose blocks are extracted and executed; the two blocks added are in the untracked guidance file, which the extraction does not read -- checked, nothing under test/ or scripts/ names that file at all.",
            "NO FENCED BLOCK IS ADDED TO THE README: its command blocks are extracted and executed by the suite, and the runner runs the suite -- it would run itself. The commands appear there as prose today, which is what makes prose the safe carrier.",
            "THE DOCUMENTATION ENDPOINT IS DELIVERY AND NOT THE MECHANISM, and the record says so rather than letting a later reader find it: that file is untracked in this repository, so one end of the sync obligation is a file no fresh checkout has and no check can grade.",
          ],
        },
      ],
      impediments: [],
      decisions: [
        "EXISTENCE IS NOT ENOUGH AND THE ITEM'S OWN FILING SAYS WHY: the skill forbidding this defect exists, is specific, is measured, carries its own recidivism count, and matched on description -- and the defect happened anyway. A RUNNER THAT MUST BE REMEMBERED IS THAT SKILL WITH AN EXIT CODE. What must become unavailable is the alternate SPELLING: after this sprint, `run the Definition of Done` has ONE form everywhere this project says how to verify a change, the five survive as the runner's DATA in one tracked enumeration, and running a single check by hand is labelled DEBUGGING where it appears.",
        "A COMMIT HOOK IS REFUSED AS THE UNAVAILABILITY: untracked, per-clone, and undone by a flag -- and the whole Definition of Done at every commit is slow enough that the flag would be used. UNAVAILABILITY A FLAG UNDOES IS A RESTATEMENT IN A MECHANISM'S CLOTHES.",
        "THE RESIDUE IS NAMED IN ADVANCE RATHER THAN DISCOVERED: an actor who types the five commands out of habit is NOT COVERED, and the runner cannot make that route unavailable. FILING IT ON RECURRENCE WAS ITSELF A REFUSAL TO FILE, so it is ruled here instead: NOT FILED, DELIBERATELY. A route that requires a person to choose the longer way is not closable by anything this repository can build short of a commit hook, and the hook is refused above for reasons that have not changed. What CAN be closed was: the alternate spelling of the LIST, which is now structurally unavailable. If a sixth occurrence arrives by the habit route, the item it justifies is about the commit moment and not about this runner.",
        "THE DUPLICATED ENUMERATION IS REFUSED EVEN ON AN ALL-GREEN RUN, and the developer's design discharges it structurally rather than by assertion: the runner obtains its list by EXECUTING the dashboard, so there is no second list to drift. The alternative -- the runner holds the list and a test asserts equality -- satisfies the property equally, and whichever is taken, the choice and its cost are stated.",
        "MEASURED AT PLANNING SO IT IS NOT MET AT RED: running the checks through one script does NOT change what any of them sees. The wrapper does not prepend the local binary directory to a child's path, so tool resolution is identical bare and wrapped; and the linter's output format is identical through a pipe and under a terminal.",
        "THE REVIEW ROUND'S SIX FINDINGS SHARE ONE SUBJECT AND IT IS THE INSTRUMENT ITSELF: THREE OF THEM ARE THIS PROJECT'S RECORDED DEFECT LIVING INSIDE THE MACHINE BUILT TO ELIMINATE IT -- a summary headline that could read PASSED over a failing run, an unrunnable check that did not have to gate, and a warning count taken from ONE check and printed over five. Every one of them was green while the property it defends was violated, and none was findable by reading. THE STANDING RULE THIS LEAVES IS MECHANICAL AND APPLIES TO ANY ARM OVER A REPORT: an arm over a SUMMARY asserts BOTH DIRECTIONS, since one direction is satisfied by a constant; an arm over a GATE stands in a tree where NOTHING ELSE IS RED, or the colour it reads belongs to something else; an arm over an AGGREGATE stands where the aggregate DIFFERS FROM EVERY ELEMENT, or first, last and total are one value. That is the previous round's `test data that cannot discriminate` specialised to the three shapes a report has.",
        "AND THE ROUND WAS TAKEN WITH THE THING THIS SPRINT BUILT, WHICH IS THE POINT OF HAVING BUILT IT: every fix was taken on `bun run scripts/definition-of-done.ts`, and TWICE it printed `[FAILED] Format check passes -- exit 1` beside four `[PASSED]` lines: once over a type declaration the formatter wanted on one line, once over a quotation mark inside one of these notes. Under the habit this sprint exists to retire -- five commands typed by hand, the last one read -- both of those commits go in red, and the second is this dashboard itself, which is where four of the five recorded occurrences came from. Each was fixed and the whole run repeated before committing. THE SUITE WENT 859 -> 862 ACROSS THE SIX FIXES and no check was red at any commit.",
        "THE FILING BAR FOR THE REVIEW ROUND LANDS THIS SPRINT, in this dashboard's header beside the round's standing instruction -- NOT in a skill, which is the delivery that failed, and NOT in the round's own skill file, which lives outside this repository and would be invisible to this project's review of its own records. A finding recorded as PRE-EXISTING names both commits and the byte-identity result at the sprint's base, or it is this sprint's to repair; it names the item it is filed into, or it is not filed; and PREDATING IS NOT ITSELF A LICENCE -- a finding inside the sprint's own subject is repaired here even when it predates.",
      ],
    },
    {
      number: 55,
      pbi_id: "PBI-61",
      goal: "Every TypeScript file this checkout owns is in some compiler's program, decided by reading the compilers' own file lists -- so the planted file that runs under `bun test` and is graded by nobody comes back red.",
      status: "done",
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
            "REVISE STAGE 1: THE HELPER STAGED WITHOUT THE OVERRIDE THE CHECK ITSELF USES. `refuseUncoveredFiles` neutralises the personal ignore file for one reason -- a candidate set honouring one differs per developer -- and the helper that builds every tree it is measured on honoured it. That is the same defect one layer down and worse: PROGRAMS come from tracked files, so a global ignore matching a fixture path deletes a program and reddens arms per machine. MEASURED here, whose global ignore names `node_modules`: a tree holding `packages/declared/node_modules/stranger/{package.json,index.ts}` staged NEITHER file, and both with `-c core.excludesFile=/dev/null`. The shipped arm passes today only because the installed-dependency subtraction removes those paths anyway -- a second mechanism covering for this one. `--force` REFUSED rather than unconsidered: a fixture plants a `.gitignore` of its own so an emitted artifact is ignored the way a real checkout has it, and MEASURED, the override leaves that in effect. NO ARM: the state is this machine's global ignore, so any arm would be green elsewhere for want of a subject. Commit 340fc68.",
          ],
        },
        {
          test: "Eight arms, each a spawn of the fifth check over a throwaway tree, each paired with the same tree unplanted going green: a file beside a member whose config includes only its source; a file at a root whose config declares no include; a file reached only by an import; a member split across a check config and a build config, which stays GREEN and which a literal-name reader reports; this repository itself, offenders empty beside a non-empty candidate set; a personal ignore file not shrinking the subject; a root that is not a checkout, refused for want of an enumerator; a program whose include matches nothing contributing zero rather than aborting; and an emitted declaration not reported.",
          implementation:
            "A refusal in the workspace script, called LAST among the refusals in the fifth check and before any member is checked -- never from the shared preparation, which the test preload also runs.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "7447665",
              message: "feat(workspaces): refuse a TypeScript file no compiler's program includes",
              phase: "green",
            },
          ],
          notes: [
            "SEVENTEEN ARMS LANDED IN ONE NEW FILE, RED BEFORE GREEN AND THE COLOURS PREDICTED IN WRITING: 9 fail / 8 pass with no implementation, exactly the arms predicted, then 17 pass. The whole Definition of Done afterwards: 832 pass / 0 fail across 56 FILES against a baseline of 815 across 55, and 0/0/0/0/0.",
            "TEN DEGENERATE IMPLEMENTATIONS RUN RATHER THAN ARGUED, each applied to the shipped function with a guard refusing to read a perturbation that did not apply. Reports-nothing: 7 planted arms red. Candidate set empty: the same 7. Program set empty: 18. THE DANGEROUS ONE, programs found by the literal name `tsconfig.json`: 2 -- the split member and the emitted declaration, which is the only degenerate the split-member arm was built for. Import closure instead of roots: 1, the import arm alone. Default include expanded by hand: 7, including the dot-directory arm. No output-directory subtraction: 1, naming `packages/emitter/dist/index.d.ts`. Swallowing a compiler failure: 1. Declarations excluded by NAME: 1. Aborting on a non-zero exit: 20 -- the plan's `about twenty` measured.",
            "THE EXIT CODE IS NOT THE DISCRIMINATOR AND THE PLAN'S TS18003 RULE WAS TOO NARROW, found by measuring: an unresolvable `extends` ALSO exits 1 (TS5083) while still listing the program's own roots, and refusing on it would have taken the red away from the type check that names TS5083 -- a division of labour pinned by an existing arm. What decides is whether the config could be READ, asked of `--showConfig`, which exits 1 with TS5058 for a config it cannot open. MEASURED AND SURPRISING: `--showConfig` exits 0 on MALFORMED JSON, recovering it as an empty configuration, so it is not a syntax oracle. The unreadable-config arm is therefore staged as a config that is tracked and gone from the worktree.",
            "THE ARM THE PLAN DID NOT HAVE, AND THIS SPRINT'S OWN CHANGE CREATED THE NEED: with the helper staging everything it writes, `--others` and the personal-ignore override had NO SUBJECT anywhere in the suite -- delete either and nothing reddens. Two arms now plant AFTER the tree is staged. The ignore arm also carries a control proving the ignore file was in effect on the run that just happened, without which it passes whether or not the override exists.",
            "A HELPER DEFECT MEASURED WHILE BUILDING THAT ARM: on bun 1.3.13 a child spawned after `process.env.X` is written DOES NOT SEE `X`, where the same call with `env` passed does. An arm relying on inheritance would have asserted against an environment the check never received. The command runner now takes an environment explicitly.",
            "THE READER IS THE COMPILER'S OWN FILE LIST WITH RESOLUTION OFF -- the program's ROOT files, what the includes matched, and not the import closure. MEASURED, and it is why the JSON globs are not the reader: a default include does NOT reach a dot directory or a dot file, so a reimplementation of the glob says the opposite of what the compiler does. Cross-validated with a second instrument, and the first spelling of that second instrument CARRIED THE DEFECT IT WAS HUNTING -- a prefix match that missed `default` and reported every file in the program.",
            "THE CANDIDATE SET IS TRACKED AND UNTRACKED BUT NOT IGNORED, because the moment this item is about is a file just ADDED: reading tracked files alone leaves the guard reddening one run AFTER the bad commit. The two standing exclusions come free and are read rather than restated -- the ignore file already names the installed strangers and every built artifact, for its own reasons, in a file edited elsewhere.",
            "A PERSONAL IGNORE FILE MUST NOT SHRINK THE SUBJECT, measured on this machine: the global ignore here hides a file that is tracked-and-visible elsewhere, so a candidate set honouring it differs per developer. RESIDUE, named: a per-checkout exclude file cannot be neutralised the same way.",
            "PROGRAMS ARE ENUMERATED FROM TRACKED FILES ALONE AND THE ASYMMETRY IS DELIBERATE: a program is part of the declared verification surface and must be COMMITTED to count, while a candidate is a hazard the moment it exists. A stray uncommitted config claiming the whole tree would otherwise mark everything covered -- a silent permanent green. The other direction fails loudly and self-corrects.",
            "TWO SUBTRACTIONS, EACH FORCED BY A MEASUREMENT AND EACH OWNING AN ARM: anything under a program's own output directory, read per program from the effective configuration -- without it the guard is RED ON EVERY EXISTING THROWAWAY THAT BUILDS, since a throwaway carries no ignore file and its emitted declaration is untracked and in no program's roots; and anything under an installed-dependency directory, for the reason already recorded beside the package walker.",
            "A PROGRAM WHOSE INCLUDE MATCHES NOTHING MUST CONTRIBUTE ZERO RATHER THAN ABORT: measured, the compiler prints TS18003 and EXITS 1 on that shape, and both spawner files stage exactly it -- so without this arm about twenty existing arms break. The second half of the same arm is the opposite fault: a tracked config the compiler cannot read at all must be refused BY NAME, staged at a third config so neither existing refusal owns the red first.",
            "THE DEGENERATE THAT MATTERS IS NOT `REPORTS NOTHING`: it is `finds programs by the literal name`, which is green on this repository AND on every other planted arm, because no tracked file here is covered only by a build config. The split-member arm exists to give that degenerate a subject.",
            "REVISE STAGE 1, AND THE SHAPE OF EIGHT OF THE ELEVEN FINDINGS IS ONE SHAPE: an arm or a reason claiming more than any tree in the suite could measure. Every fix below was taken against a reading of my own before it landed, and the whole Definition of Done was run per commit with all five exit codes read separately.",
            'THE ONE THAT MADE A SHIPPED SENTENCE FALSE: the output-directory subtraction was AN EXEMPTION LIST, in a refusal whose own message says there is deliberately none. Any path under any DECLARED `outDir` was excused -- whether or not that program emits, whether or not a compiler wrote the file. REPRODUCED before the fix, with a member check config carrying `noEmit: true` beside `outDir: "../../vendor"` and a COMMITTED `vendor/probe.ts` in no program\'s list: exit 0 and ZERO BYTES on both streams, and exit 1 naming it the moment the `outDir` was deleted -- one config key, one silenced directory. The index is what separates the two claims, since a compiler-written artifact is never in it, and the emitter arm stays green because `prepareWorkspace` writes the declaration after the helper stages. DEGENERATE: the exemption back to any path, 19 pass / 1 fail. Commit abed9a7.',
            "AND THAT SUBTRACTION'S ARM COULD NOT TELL THE REPORTED SETTING FROM THE STRING. Every fixture that emitted anything spelled its `outDir` `dist` and no tree held a `dist` that no program wrote: MEASURED, with the prefix test replaced by `any path segment equal to dist`, 20 pass / 0 fail in the file and 836 pass / 0 fail in the suite. The build config's output is now `out`, a name nothing in the check knows, and a new arm plants under a directory merely CALLED `dist` -- UNTRACKED, because a committed file there is already refused for the index and would measure nothing new. DEGENERATE: the segment comparison, 18 pass / 3 fail. Commit 812e484.",
            "BOTH SUBTRACTIONS ARE PATH MATCHES AND BOTH WERE ONE TOKEN FROM SWALLOWING A FILE THIS CHECKOUT OWNS, with neither boundary defended: MEASURED with the installed filter widened to a substring test AND the output prefix stripped of its separator AT ONCE, 21 pass / 0 fail in the file and 837 pass / 0 fail in the suite. Two arms, one per boundary, so a red names which widening happened: `packages/late/node_modules_local/x.ts` is nobody's dependency and `packages/emitter/outbox/y.ts` shares five characters with a program's reported `out`. DEGENERATES RUN SEPARATELY AS WELL AS TOGETHER, because a pair that only reddens jointly leaves either half unpinned: together 21 pass / 2 fail, each alone 22 pass / 1 fail. Commit 2e1b048.",
            "THE DECLARATION EXCLUSION'S ARM COULD NOT TELL `every` FROM `some`, and its own name says `once A program stops skipping` -- singular. Its fixture fed ONE options object to both configs, so every tree it built was all-on or all-off, where the two readings coincide: MEASURED, with the condition weakened to `some`, 19 pass / 0 fail in the file and 835 pass / 0 fail in the suite. The reported pair is now MIXED -- the ROOT stops skipping, the member does not -- so the two runs differ by one flag on one config, which is also a better pair than the one it replaces. PREMISE MEASURED rather than assumed, since that root config matches no file: `--showConfig` exits 0 and reports `skipLibCheck` for it all the same. DEGENERATE: 18 pass / 1 fail. Commit e6ae65a.",
            "TWO CLAIMS WITH NO SUBJECT ANYWHERE, and both are now planted. The ORDERING claim -- `before any member is checked` -- survived the call being moved BELOW the type-check loop; the arm pairs an uncovered file with a member TYPE ERROR, which is the harder half, since the exit is 1 either way and only the streams separate them: the refusal is thrown to stderr, tsc prints to stdout through the inherited handles, and the pair is the same tree unplanted whose stdout DOES carry TS2322. Commit 47ef289. And the TRACKED-ONLY PROGRAM ENUMERATION named its hazard exactly -- a stray uncommitted config claiming the whole tree, a silent permanent green -- with nothing planting one; the arm runs the same tree twice, the config unstaged and then STAGED with nothing else moved, so the green second run is what says the first refusal was about the commit and not the contents. Commit ef21342.",
            "A CORRECTION TO TWO OF THIS ROUND'S OWN COMMIT MESSAGES, RECORDED RATHER THAN LEFT: 47ef289 and ef21342 each report a `MEASURED before this arm` pair of counts that was NOT taken -- the file count described the tree WITH the new arm and the suite count was the reviewer's baseline reading rather than a run of mine. The reading was then taken properly, by removing each arm from the current tree and running the whole suite under its degenerate: BOTH left 839 pass / 0 fail, so the substance of both claims holds and only the numbers were unearned. This is the class the measurement skill files first, caught here by the author on a second pass.",
            "A FALSE MEASURED CLAUSE IN `readProgram`, WHOSE BEHAVIOURAL CONSEQUENCE IS NIL AND WHICH IS EXACTLY WHY IT SURVIVED A SPRINT GREEN: a config whose include matches nothing was said to exit 1 WHILE STILL REPORTING THE DEFAULT LIBRARY. RE-MEASURED on tsc 7.0.2 in the fixture shape the paragraph names -- exit 1 with ONE line on stdout, the TS18003 diagnostic and no file of any kind. The `extends` half re-measured and STANDS: TS5083, exit 1, the default library and its own roots still listed -- so that is the failure where keying on the exit throws real roots away, and the two halves print different things. Commit 6cda867.",
            "AN ARM'S NAME SAID `TRACKED` AND NOTHING MEASURED IT: it unlinks the config from the worktree and leaves the entry in the index, so an unreadable TRACKED config and an unreadable untracked one are one observation. THE REPAIR IS THE NAME, which the skill allows where the alternative is a wider matcher that still misses; adding an untracked unreadable config as a second subject was refused because it would duplicate the stray-config arm one increment old. Commit fd8fb40.",
            "THE STANDING RE-RUN AFTER ALL OF IT: the literal-name degenerate now reddens SIX arms where it reddened two, and nothing that reddened before went quiet -- the new detection is the emitter's arms, both boundary arms and the stray-config control, whose second run cannot be satisfied by a reader that never finds `tsconfig.stray.json`.",
            "THREE REPAIRS TAKEN AGAINST A READING OF THIS ROUND'S OWN WORK, EACH OF THEM THE CLASS THIS SPRINT EXISTS TO CLOSE ARRIVING INSIDE THE FIXES FOR IT. (1) THE SUBMODULE MESSAGE SHIPPED AN ASSERTION: `Nothing named above is inside it` is a claim about what git does at a gitlink, made from ONE measured state. The unmeasured one was then measured -- a DEINITIALISED submodule, its working directory emptied and holding a freshly written `probe.ts`: `--others` does not descend into that either, so the claim held. It is DERIVED off the offenders all the same, because a sentence that is true on the git nobody has upgraded past is the same-sprint falsity subcase already filed. Commit a156b0a. (2) THE REFERENCE MESSAGE STATED A TWO-HALVED RULE AND NAMED ONE REPAIR: a reference to an UNTRACKED `lib/tsconfig.json` fires the same sentence, and a reader told to RENAME it would be renaming a file whose name is already right. Both repairs are named now and the arm asserts both words. Commit c27534e. (3) THE CASE FIX'S OWN SCOPING REASON SPOKE FOR THE WRONG SUBTRACTION -- it justified leaving the INSTALLED filter spelling-exact and said nothing about the OUTPUT-DIRECTORY prefix, which is the other comparison here taking its two strings from two producers. MEASURED, not disclosed as residue: a build config carrying `outDir: \"Out\"` over a directory already on disk as `out` emits into `out`, and its declaration was reported as covered by nothing -- the same false red one subtraction over. THE LINE IS NOW STATED AS THE PROPERTY IT IS: fold every comparison with TWO producers, leave every comparison against a literal written here, since a literal cannot be spelled twice. The new arm is a control rather than a discriminator on a case-sensitive machine, which is said at the arm. DEGENERATE: the fold taken back off that one comparison, 29 pass / 1 fail. Commit fd54c3a. Whole Definition of Done after each: 846, 846 and 847 pass / 0 fail across 56 files, 0/0/0/0/0 every time.",
            "THE STANDING RE-RUN AFTER REVISE STAGE 2, AND ITS READING IS UNMOVED: the literal-name degenerate reddens the SAME SIX arms it reddened at the end of stage 1, so nothing landed this round disarmed anything. The six new arms are silent under it BY CONSTRUCTION rather than by accident -- a deletion, a case fold, a project reference, a submodule boundary and a member's `skipLibCheck` are all properties a reader finding programs by the literal name still gets right.",
            "REVISE STAGE 2, THE HIGH ONE, AND IT IS RULED ON A MEASUREMENT OF THE ENUMERATOR RATHER THAN ON A PREFERENCE: A SUBMODULE'S TYPESCRIPT WAS NEVER A CANDIDATE AND NOTHING SAID SO. MEASURED on a throwaway mounting a real submodule at `vendor/pkg` holding `vendor/pkg/probe.ts`: `git ls-files -z` and the `--cached --others --exclude-standard` call BOTH report the GITLINK PATH ALONE, `--others` does not descend either -- an untracked file written inside the submodule is invisible too -- and the fifth check exits 0 over the whole tree. THE RULING IS NO, THE SUBMODULE IS NOT THIS CHECKOUT'S TO GRADE, and what decides it is what git will do: `git ls-files --recurse-submodules` WORKS and the same flag WITH `--others` IS REFUSED, exit 128, `fatal: ls-files --recurse-submodules unsupported mode`. So recursing could only ever reach a submodule's TRACKED files, leaving ONE SUBJECT WITH TWO RULES -- tracked-and-untracked outside, tracked only inside -- and the half it would lose is a file JUST ADDED, which is the moment this whole refusal exists for and which two arms in this file already defend. SUBSTANTIVELY: a submodule is somebody else's history at a commit this tree pins, so no `include` here can be widened to reach it and no commit here can move it; the report would be a permanent red on a file no edit in this tree repairs, which is the reason already recorded beside the installed strangers arriving for a second class of file. Its own checkout grades it. AND THE SILENCE IS WHAT MADE IT A FINDING, so the boundary is stated where the SUBJECT is defined AND the refusal names the submodule whenever it speaks at all -- read out of the index MODE (160000), asked only after the early return so a green run pays no spawn. THE ARM IS TWO RUNS OVER ONE TREE with the same file content inside the submodule and then one directory up outside it, mounted INSIDE the excluded member because the first spelling put it at the tree's top where the ROOT program's default include already covered the control -- a silence that had nothing to do with submodules, found by the arm failing rather than by reading. AN APPARATUS FACT WORTH THE LINE: `git submodule add` REFUSES an absolute mount path containing a symbolic link, and this machine's temporary directory is reached through `/var`, so the mount point is passed RELATIVE. TWO DEGENERATES, ONE PER DIRECTION, and the arm is the only red under each: the OPPOSITE RULING implemented -- recursed tracked paths folded into the candidate set, which is the only shape git permits -- 49 pass / 1 fail; and the boundary sentence removed, 49 pass / 1 fail. THE LINKED-WORKTREE READING IS TAKEN FROM THE REVIEWER AND NOT RE-MEASURED, and nothing found here contradicts it. Whole Definition of Done: 846 pass / 0 fail across 56 files, 0/0/0/0/0. Commit 059d527.",
            "REVISE STAGE 2, AND IT IS RULED RATHER THAN PATCHED: PROJECT REFERENCES DO NOT PROPAGATE COVERAGE. Programs are read one at a time and never as a build graph, so a tracked root config referencing `lib/project.json` leaves `lib/x.ts` in nobody's list -- REPRODUCED, exit 1 naming it -- and that config's own name fails the `tsconfig*.json` filter, so nothing enumerates it either. `--showConfig` DOES echo `references`, measured, so the same reader that answers every other question here can answer this one. THE RULING IS NOT TO FOLLOW, AND WHAT DECIDES IT IS WHO CHECKS THE FILE: MEASURED on tsc 7.0.2, `tsc -p` on the PARENT -- the form the root check and every member check take -- reports NOTHING about a type error planted in `lib/x.ts`, while `-p` on the referenced config and `tsc -b` on the parent each name it. Following the reference would therefore mark covered a file NO COMMAND IN THE DEFINITION OF DONE READS, which is a false green about the exact state this refusal exists for; and it would admit as a coverage source a config that need not be TRACKED, which is the stray-config hazard arriving by another door. SO A REFERENCED CONFIG MUST BE ENUMERATED IN ITS OWN RIGHT, tracked and named -- one already named `tsconfig.json` was covered by LUCK and that is now the rule, with the rename as the pair arm. AND THE REFUSAL SAYS IT WHERE IT WOULD MISLEAD: every other sentence this check prints tells a reader to widen an `include`, which is the wrong edit for a file another project already holds, so a run naming files while an enumerated program declares a reference nothing here reaches names that reference and the RENAME too. TWO DEGENERATES RUN, one per direction, and the arm reddens under both: the reference sentence removed, 48 pass / 1 fail; and the OPPOSITE RULING implemented -- the referenced program's roots folded into the covered set -- also 48 pass / 1 fail, this time because the file goes unreported, which is the false green measured rather than argued. Whole Definition of Done: 845 pass / 0 fail across 56 files, 0/0/0/0/0. Commit ddf6cfe.",
            "REVISE STAGE 2, THE SECOND FALSE RED, AND THE MACHINE WAS MEASURED BEFORE THE FIX WAS CHOSEN: path comparison is string equality between the spelling THE COMPILER'S CONFIG used and the spelling THE INDEX holds. This machine's checkout AND its temporary directory both FOLD CASE -- probed, `touch CaseProbe.tmp` is found as `caseprobe.tmp` in both -- so the gap is reachable here rather than hypothetical. REPRODUCED: a tracked `src/Foo.ts` under a root config whose `files` names `src/foo.ts` is COMPILED, tsc exiting 0 and listing `src/foo.ts`, while the check named `src/Foo.ts` as covered by nothing and told its reader to widen an `include` that already reaches it. `forceConsistentCasingInFileNames` DOES NOT REFUSE IT, measured on tsc 7.0.2 -- exit 0 on both the listing and the plain check -- so nothing upstream makes the state unreachable. FOLDING UNCONDITIONALLY IS THE FIX THAT BREAKS THE OTHER FILESYSTEM, where those two spellings are TWO FILES and one really is uncovered: a fold there turns a CORRECT red green, silently and only where it matters. So the fold is gated on a READ-ONLY probe of the tree being graded -- the root's `package.json` asked for in a spelling no repository ships -- and it writes nothing into the tree it grades. BOTH SIDES GO THROUGH ONE FUNCTION, which is the half a fix here gets wrong: the two agree today only because both are built from the same root string, so canonicalising the candidate alone would move every prefix and redden the file wholesale. SCOPED TO THE COVERAGE COMPARISON and not to the two subtractions, which match paths for their own reasons. THE ARM ASSERTS THE MACHINE FIRST AND THE COLOUR SECOND and BRANCHES, which is honest rather than convenient: hard-coding the green would demand the defect on every case-sensitive machine and skipping there would be vacuous on most of CI. ITS CONTROL is the same tree spelled consistently, green on either filesystem. THE CASE-SENSITIVE MACHINE'S OUTCOME IS READ OFF THE DEGENERATE rather than asserted: with the fold removed -- which is exactly what such a machine executes -- 46 pass / 1 fail, the ONLY red being the case arm, whose other branch is the one that would run there. RESIDUE NAMED: a case-sensitive checkout really holding a file called `PACKAGE.JSON` beside its manifest reads as folding. DEGENERATE RE-RUN: 46 pass / 1 fail, the new arm alone. Whole Definition of Done: 843 pass / 0 fail across 56 files, 0/0/0/0/0. Commit f8301e3.",
            "REVISE STAGE 2, AND IT IS THIS CHECK'S FIRST FALSE RED RATHER THAN A MISSED ONE: a path deleted from the worktree keeps its index entry, so `--cached` still reports it while every compiler's list drops it -- nothing can include a file that is not there -- and the deletion ALONE made an offender. REPRODUCED before the fix on a staged throwaway: exit 1 naming `packages/late/src/extra.ts` with nothing at that path, telling its reader to widen an `include` for a file they cannot open. The candidate set now asks the disk. ITS OWN ARM AND NOT THE DELETED-CONFIG ONE, which is the neighbouring state and the OPPOSITE answer: a tracked config gone from the worktree is refused BY NAME, because a program nobody can read turns every file it covered into an offender -- there the absence is the fault and here it is the repair. THE FILTER IS ON THE CANDIDATE SIDE AND NEVER ON `tracked`, which is what keeps that neighbour's red alive: programs are enumerated from the index, so filtering there would flip `refused by name` into `silently not a program`. THE ARM IS TWO RUNS OVER ONE TREE with the index entry asserted to survive the deletion, since a green over a tree with the file gone is otherwise satisfied by a check that never looked at that path. DEGENERATE RE-RUN, the fix removed: 45 pass / 1 fail, the new arm alone. Whole Definition of Done: 842 pass / 0 fail across 56 files, 0/0/0/0/0. Commit e39c869.",
            "REVISE STAGE 2, AND IT IS THE R3 FIX STILL WIDER THAN ITS ARM: the declaration exclusion says it lapses when ANY program stops skipping library checks, and BOTH arms flipped the ROOT -- so a reader consulting ONLY THE ROOT's setting, the one config every tree here is guaranteed to have, passed the pair that was written last round to sharpen exactly this. MEASURED with that reader in place: 44 pass / 0 fail across the two spawner files. The third arm flips the MEMBER instead and nothing else, and it is the only one that reddens. DEGENERATE RE-RUN: 44 pass / 1 fail, the new arm alone. AND THE SECOND HALF IS THIS FILE'S CLAIM ABOUT ITSELF -- the header says every arm here is a MOVE with no value changed, while these three flip `skipLibCheck`. They can be nothing else, since whether a `.d.ts` is in the subject is READ from what the programs report, so the setting IS their subject; the sentence is narrowed to what is true rather than the arms reshaped to fit it. Whole Definition of Done: 841 pass / 0 fail across 56 files, 0/0/0/0/0. Commit 4287e36.",
            "REVISE STAGE 2, THE OUTPUT-DIRECTORY FIX'S OWN PROSE, AND THE PRODUCT OWNER FOUND IT INDEPENDENTLY: the repair shipped saying that an UNTRACKED path under a program's output directory IS a file the compiler wrote. The arm separates tracked from untracked and nothing anywhere separates compiler-written from hand-written, so an untracked file somebody typed there is subtracted with the artifacts. The sound direction is the one the code takes -- no artifact is ever committed, so being IN THE INDEX rules that reading out -- and the docstring asserted the converse as an identity, which is the same overclaim, one sentence smaller, that this sprint's repair was written to retire. WHAT THE SUBTRACTION BUYS IS NOW SAID: no COMMITTED file is ever excused by an `outDir`, and the residue is a file somebody wrote there and has not committed, which self-corrects the moment they do. THREE SITES AND NOT ONE, because the converse was repeated down the file: the docstring paragraph, the comment inside the filter, and the arm that pins it in test/uncovered-files.test.ts -- whose wording was the strongest of the three. NO DEGENERATE IS REPORTABLE AND THAT IS STATED RATHER THAN LEFT BLANK: this finding changes no behaviour, so there is no perturbation whose colour could witness it; the whole Definition of Done was re-run to establish exactly that -- 840 pass / 0 fail across 56 files and 0/0/0/0/0, unmoved from the baseline. Commit ae41952.",
          ],
        },
        {
          test: "Two plant sites uncovered by DIFFERENT mechanisms, so no single configuration edit can reach both: one inside the framework member outside its source directory, one under a dot directory. Both red planted, both green removed, and the report-everything degenerate refuted by the unplanted run.",
          implementation: "None -- this is the close the PO will accept and nothing else.",
          type: "behavioral",
          status: "completed",
          commits: [],
          notes: [
            "THE OUTCOME THIS FORECLOSES, REFUSED EVEN WITH EVERY CHECK GREEN: the witness turned green by widening a config's include until it reaches the plant, with no refusal that reddens the NEXT file planted elsewhere. That satisfies the criterion in letter and leaves the property unenforced.",
            "THE SECOND SITE IS A PREDICTION AND NOT A FACT: the wildcard expansion is believed to skip names beginning with a dot, and it must be ESTABLISHED by planting and reading the file list. If it turns out covered, a second mechanism is found before the pair is believed.",
            "THE PREDICTION HELD, ESTABLISHED BY PLANTING AND NOT BY READING THE GLOB. Five runs of the fifth check, every colour and every sentence predicted in writing beforehand and every prediction met. UNPLANTED: exit 0, ZERO BYTES of output -- which is what refutes the report-everything implementation, since 151 candidates were examined to produce it. SITE 1 ALONE (`packages/tsudoi-language-server/probe-uncovered.ts`, inside the framework member and outside its source): exit 1, naming that file and nothing else. SITE 2 ALONE (`.claude/probe-uncovered.ts`, under a dot directory): exit 1, naming that file and nothing else. BOTH: exit 1, naming exactly the two. REMOVED: exit 0, zero bytes, and `git status --porcelain` empty.",
            "THE TWO MECHANISMS ARE INDEPENDENT, MEASURED RATHER THAN ARGUED: with the ROOT config's include widened to `[**/*, .claude/**/*]` and both files planted, site 2 became covered and SITE 1 WAS STILL REPORTED -- one configuration edit cannot reach both. The reason each is out of the other's reach: the root excludes `packages`, so no root include can name a file inside a member; and site 2 sits above every member directory, which a member's include cannot name without escaping the member. The tracked config was preserved outside the repository before the edit and restored byte for byte.",
            "WHAT THE PAIR DOES NOT ESTABLISH, SAID HERE SO NOBODY READS IT AS MORE: both readings are of one machine's checkout with the artifacts present, which is the state the Definition of Done establishes and the state the sprint ruled every reading is taken in. With them absent the root program falls through its source arm and reads a different tree.",
          ],
        },
        {
          test: "The existing package-shaped arms stay red for the same states and with the same sentence.",
          implementation:
            "The JSON-glob reader stops DECIDING coverage and becomes a diagnostic refinement over a fault the faithful reader already found: given an uncovered file whose directory holds a manifest the root excludes and the workspace does not declare, say the package sentence instead of many file sentences.",
          type: "behavioral",
          status: "completed",
          commits: [
            {
              hash: "109d1e3",
              message:
                "refactor(workspaces): leave one decider, and keep the package-shaped sentence",
              phase: "green",
            },
          ],
          notes: [
            "THE RED THIS WAS WRITTEN AGAINST IS THE NARROWING ITSELF, and pinning it is what makes it a decision: an undeclared package holding NO TypeScript is no longer refused, because nothing about it is unchecked. One arm red before, green after; the whole Definition of Done after: 833 pass / 0 fail across 56 files, 0/0/0/0/0.",
            "TWO EXISTING ARMS COULD NOT TELL THE TWO SENTENCES APART, and only one of them was found by reading. The glob-form arm was found VACUOUS BY THE PERTURBATION: with the refinement disabled it stayed GREEN while the run printed the wrong repair, because it asserted only the directory name -- which the file sentence contains too. The prediction said both would redden and one did, which is the whole reason the perturbation was run before the arms were believed.",
            "THE NODE_MODULES ARM HAD LOST ITS SUBJECT IN THE SAME MOVE: a stranger package holding only a manifest reddens nothing once coverage is decided by file lists, so that arm was green for a reason unrelated to its hazard. It now ships a source file, and the perturbation reproduces: with the installed-dependency subtraction removed, exit 1 naming `packages/declared/node_modules/stranger/index.ts`.",
            "THE STANDING RE-RUN, AFTER THE DEMOTION: the literal-name degenerate still reddens exactly the two arms it reddened before, so nothing was disarmed by the move.",
            "THE RULING AND ITS REASON: that reader is the UNFAITHFUL one this item was filed against -- it is why the planted probe ran under it and it said nothing. Leaving it deciding alongside the compiler's file list gives this repository TWO ANSWERS TO ONE QUESTION that can disagree with everything green, which is the disarmed-control shape this record keeps catching. ONE DECIDER.",
            "THE CONDITION THE PO WILL READ FOR: a run that answers one missing workspace entry with a wall of file sentences is a REGRESSION they refuse. The package-shaped fault keeps the package-shaped message and the repair it names.",
            "REVISE STAGE 1: THE REFINEMENT SWALLOWED OFFENDERS IT DOES NOT SPEAK FOR. It returned as soon as ONE offender sat inside an undeclared excluded package and the caller discarded the whole file list -- MEASURED on the tree the new arm builds, `packages/forgotten/src/index.ts` beside `tools/elsewhere.ts`: the package sentence ALONE, the second file never named. That is the outcome the file list's own comment refuses one line below. It now reports WHICH offenders it accounted for, every undeclared package holding one gets its sentence, and the leftovers are named in the same run. GATING ON EVERY OFFENDER BEING IN-PACKAGE IS REFUSED at both sites: it re-creates the wall of file sentences the moment anything else is uncovered, which is the regression the sentence was kept for. DEGENERATE: with the leftovers discarded once any package sentence exists, 43 pass / 1 fail across the two spawner files. Commit ed34670.",
            "AND THE TWO COMMENTS THAT DISAGREED ABOUT WHAT THE DEMOTION COST: the call site called it a refinement giving `the same sentence for the same state` while the state is strictly NARROWER, and the disclosure lived only in a function this change made PRIVATE. The call site is where a reader meets the ordering narrative, so the narrowing -- an undeclared package holding no TypeScript is no longer refused -- is named there, with its ruling and the arm that pins it. Commit cdb2923.",
            "THE ONE FINDING RETURNED RATHER THAN FIXED, AND IT IS NOT THIS SPRINT'S: the fifth check's header still licenses withdrawing the ROOT check by a `paths` mapping that exists nowhere in this repository. VERIFIED as predating this work -- that paragraph is byte-identical between c7c96ec, the sprint's planning commit, and 30f7cdc -- which is the fifth instance of the class a comment licensing a decision by a removed mechanism, and it is filed by the reviewer rather than repaired here.",
          ],
        },
        {
          test: "None new -- the citation guard and the README extraction are the pair.",
          implementation:
            "The reasons this change makes false or narrower: the package refusal's own superlative, which was ALREADY narrower than it read; the same sentence repeated in its test; the fifth check's header, which enumerates what that check owes and must name a fourth refusal without copying the ordering reasons of the other three; and the documentation, which gains an external tool among the prerequisites.",
          type: "structural",
          status: "completed",
          commits: [
            {
              hash: "55fa622",
              message:
                "docs(workspaces): name what the fifth check now owes, and the tool it needs",
              phase: "refactoring",
            },
          ],
          notes: [
            "THE FIRST TWO REPAIRS LANDED IN SUBTASK 4 AND NOT HERE, BY THE COMMIT-BOUNDARY RULE: the package refusal's superlative and the sentence repeated in its test both describe the state the demotion creates, and a commit whose comment claims a mechanism the next commit introduces is the shape that rule was filed against. What was left for this subtask is the check's header and the documentation.",
            "IT IS A THIRD REFUSAL AND NOT A FOURTH, which is what the demotion cost the plan's own sentence: the package refusal stopped being a separate call and became a refinement inside the new one.",
            "A REASON THIS SPRINT MADE FALSE, FOUND ON THE SECOND PASS AND NOT THE FIRST: the exclusion reader dropped matches beginning inside node_modules because REPORTING such a package would be a permanent red about somebody else's file. After the demotion it reports nothing at all, so the filter's effect became unobservable and its stated consequence untrue -- the fifth instance of a comment licensed by a mechanism the increment removed. The filter went with the reason, and the subtraction that keeps the property true sits beside the candidates where an arm measures it.",
            "THE DOCUMENTATION HALF IS UNMET ON THIS MACHINE, RECORDED AS UNMET RATHER THAN AS MET DIFFERENTLY: `CLAUDE.md` is NOT TRACKED in this repository and is hidden by this machine's own global ignore (`git ls-files CLAUDE.md` empty; `git check-ignore -v` names `~/.config/git/ignore:31`), so the prerequisite paragraph was written to the working tree and CANNOT BE COMMITTED from here. The same facts have a trackable carrier and it is committed: the fifth check's own header now says it needs git and why, which is where a reader of the code meets it.",
            "THE ONE READING THE PLAN LEFT REASONED IS NOW MEASURED: the file lists do not depend on the built artifacts. With every `dist/` removed, all seven programs' non-library file lists are BYTE-IDENTICAL to the same lists with the artifacts present, and the whole fifth check exits 0 silently -- which it would, since it builds before it reads.",
          ],
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
    number: 58,
    pbi_id: "PBI-60",
    goal: "The unbuilt-artifact flip stops living in prose: either the compiler NAMES THE FILE IT COULD NOT READ, or the cost that prevents that is a check which reddens the day the cost is gone.",
    status: "in_progress",
    subtasks: [
      {
        test: "None -- a READING, its predictions and their counterfactuals written down before the run.",
        implementation:
          "Delete the source arms from the framework's exports map and read EVERY reader, in the artifact PRESENT and ABSENT states, on both runtimes and the compiler. Readers enumerated rather than sampled -- the root program, each member's own, the build config, the consumer probes, both runtimes at the root and inside each member, the spawned CLI and fixtures and examples, and the installed and packed arms.",
        type: "behavioral",
        status: "completed",
        commits: [],
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
        status: "pending",
        commits: [],
        notes: [
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
        status: "pending",
        commits: [],
        notes: [
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
        status: "pending",
        commits: [],
        notes: [
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
        status: "pending",
        commits: [],
        notes: [
          "IT PREDATES THIS SPRINT AND IS STILL THIS SPRINT'S, because the filing bar says a finding inside the sprint's own subject is repaired here even when it predates -- with byte-identity against the base verified and recorded, or it is this sprint's to own.",
        ],
      },
      {
        test: "The branch that lands carries its perturbation as something the suite RE-RUNS: a registry row when it needs a source mutation, an assertion beside the arm when the weakening is a reading of a result the arm already holds.",
        implementation: "Ask first which perturbation still HAS a target here.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "THE CITATION IS LEFT UNASSERTED RATHER THAN PROPAGATED: the facilitator's tasking called this the residue one sprint shipped open and the item's own note names a different one. Neither is asserted here -- it is THE RESIDUE THE MOVE SHIPPED OPEN -- because this record has a case of a number standing unchallenged for thirty sprints, and a wrong one repeated is the failure it punishes.",
      "BRANCH TWO IS AN ACCEPTABLE CLOSE ONLY WITH ALL FOUR: the deletion was TAKEN and not reasoned about; the blocker is NAMED TO A FILE -- which specifier, in which file, read by which reader, failing with what text, in which state -- because `something would break` is not a cost and neither is a count; the blocker is recorded AS A RE-RUN and not as a note, since this dashboard's header says a perturbation recorded only as prose is not recorded; and the residue's prose does not multiply, every surviving copy carrying the POST-move measurement.",
      "AND IT IS NOT THE TEST THE ITEM REFUSES -- SAY SO AT THE SITE OR A REVIEWER WILL FILE IT AS ONE. The refused test asserts THE RESIDUE and would pass for as long as the residue persists, specifying it. The permitted record asserts THE BLOCKER and stops holding the moment the blocker does. Opposite failure directions, and that asymmetry IS the terminating mechanism: branch two ends with the decision reopening itself, unattended.",
      "FAILURE TO DELIVER REGARDLESS OF TREE COLOUR: the arm kept and the output is better paragraphs; or the cost quoted from the pre-move layout; or the deletion never attempted. AT REVIEW THE PO ASKS ONE QUESTION -- what did the deletion produce, byte for byte -- and no answer is a failure.",
      "THE ONE OUTCOME REFUSED WITH EVERY CHECK GREEN: the arm deleted, the absent state staged and diagnosing, THE PARTIAL STATE NEVER STAGED, and the prose warnings deleted as fixed. The criterion names both states because the pack window is the one a person actually stands in, and absent-only is the shortcut a green tree cannot catch -- removing the warnings on evidence covering one state converts a NAMED residue into an UNNAMED one, which is strictly worse than shipping it open again. The same refusal covers a diagnostic MANUFACTURED by a mapping or a project reference: there is none anywhere now, a refusal enforces it, and an error produced that way grades a resolution no stranger performs.",
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
