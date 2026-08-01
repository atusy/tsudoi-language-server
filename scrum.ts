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
      id: "PBI-65",
      story: {
        role: "editor user",
        capability:
          "see what is INSIDE a directory the path completion offered me, at the moment I highlight it",
        benefit:
          "I choose the next segment from what the directory actually holds, without leaving the popup to go and look",
      },
      acceptance_criteria: [
        {
          criterion:
            "A resolved item whose path is a DIRECTORY carries the names of entries inside it, reaching the client in the item's multi-line block and not on the one-line `detail`; an item whose path is a FILE carries no such listing; and neither answer loses what the completion already put on the item -- the absolute path and the source attribution.",
          verification:
            "Read from the item the handler RETURNS and never from an internal function, because the resolve answer REPLACES the item in the client's list -- an answer that is not the item drops the entry the user is looking at, which is written at `resolvePathStat` today. Four arms, each a perturbation with its green pair: a directory whose entries do not appear reddens; a file that gains a listing reddens; an answer whose block has lost the absolute path reddens; an answer whose block has lost the source attribution reddens. STARTING GROUND, MEASURED: `resolvePathStat` is exercised by NO behavioural test anywhere in the tree -- grepped, it occurs in the package README, the two src modules, examples/tsudoi.config.ts, and test/published-artifacts.test.ts, where both probes are TYPE-LEVEL (an import-and-assign pair asserting TS2322). So there is no red available for any of this until a harness exists, and building one is the first work rather than a risk.",
        },
        {
          criterion:
            "Whenever the handler answers from disk -- for a FILE as much as for a DIRECTORY -- what the answer says about the path is decided by the path and by the session, not by what the client sent back: an item arriving with its multi-line block replaced by text no completion produced is answered with a block that does not carry that text.",
          verification:
            "Forge the block on the item handed to the handler -- the item ARRIVES FROM THE CLIENT and nothing is validated, deliberately, which is written at `resolvePathStat` -- and require the answer to carry the absolute path and the attribution and NOT the forged text; BOTH KINDS ARE ARMS, since a rebuild that fired only for directories would leave a file answered with the client's own text. Paired with the unforged item green. AND THE MARKUP ARM: with the client's declared documentation formats naming plaintext only, the answer carries no markdown syntax, and with markdown declared it may; measured through the session the handler is handed rather than through anything carried on the item. THE UNTOUCHED-ITEM ANSWERS OF THE FOURTH CRITERION ARE OUTSIDE THIS ONE BY CONSTRUCTION and stay outside it: nothing was read there, so there is nothing to build an answer out of, and handing back what arrived is the behaviour that criterion requires. THIS CRITERION DOES NOT CLOSE THE FORGERY BOUNDARY AND MUST NOT BE READ AS CLOSING IT: the mark itself stays forgeable and unvalidated for the reason already written there. What it fixes is narrower -- the ANSWER is not assembled out of client-supplied text.",
        },
        {
          criterion:
            "The number of entry names one resolved directory puts on the wire does not grow with the number of entries the directory holds; an answer that shows fewer than all of them states EXACTLY how many the directory holds; and the names it shows are the same names in the same order on any machine holding the same directory.",
          verification:
            "Stage a directory holding entries far past the bound and count what the returned item carries; pair with one under the bound, which shows every entry and announces no truncation. The bound is a judgement value pinned by READING THE WIRE and never by importing the constant, for the reason written at `batchSize` in completion.ts: a test that imports the number agrees with itself. The exact total is what makes the truncated arm assertable as a VALUE rather than as a shape. The order arm is falsified by the listing order itself: entries staged so that creation order, filesystem order and sorted order differ must come back sorted, and the assertion is whole-value equality on the names -- which is unwritable at all against an unsorted block.",
        },
        {
          criterion:
            "A listing that fails does not cost the item the detail that was already read: a path that can be stat-ed but not listed is answered with its one-line detail present, and is not answered with the untouched item.",
          verification:
            "Stage a directory the process can stat and cannot read, and THE ARM MUST ESTABLISH ITS OWN PREMISE BEFORE IT ASSERTS ANYTHING -- assert that the listing really rejects in that staged tree, so a machine where the permission does not bite (a runner as root) REDDENS rather than passes vacuously. UNMEASURED, and the first task measures it: that a directory can be stat-able and unlistable is standard posix and has not been read on these two runtimes; if the staging cannot be made to bite, the STAGING changes and the property does not. The other two arms keep today's outcome and are green-before: a path that vanished between completion and resolve is answered with the untouched item, nothing thrown and nothing on stderr; and a path that was a directory at the stat and is not one at the listing does not escape either.",
        },
        {
          criterion:
            "A resolved FILE still carries its size and its modification date on one line, and a resolved DIRECTORY still carries no byte size.",
          verification:
            "A pin rather than new behaviour, and it exists because of the hole the first criterion measured -- the same grep: no behavioural test names `resolvePathStat`, so both halves of `detailFor` are defended today by a comment alone. Falsifier for the second half is the mistake the comment refuses -- an implementation that puts the directory's own `size` on the line must redden, since that number is the directory ENTRY's size, filesystem-dependent, and says nothing about what is inside.",
        },
      ],
      status: "ready",
      notes: [
        "WHERE THE LISTING GOES, RULED: the multi-line block, REBUILT rather than appended to, and `detail` keeps its one line. Two reasons, and the second is the one a reader would not re-derive. The block is where a list of names can be read at all -- `detail` is the protocol's one-line field and a client shows it inline beside the label. AND THE INCOMING BLOCK IS THE CLIENT'S TEXT, exactly as `data` is: appending would build the answer out of a string a client can put anything in. Rebuilding depends on nothing the client can mangle -- which is what the second criterion asserts.",
        "REBUILDING FORCES THE MARK TO WIDEN, AND THAT IS THIS ITEM'S ONE STRUCTURAL CHANGE. The block carries TWO facts and only one of them is in `PathItemData`: the absolute path is, the SOURCE NAME is not, and it is not derivable from the path -- the same file can be reached from the document's directory, the cwd, a workspace folder or an absolute fragment. So `PathItemData` gains the source name, written at the item where it is already in hand and costing nothing at popup time. IT COSTS NO COMPATIBILITY, which is the whole point of the mark being unpublished and the two halves shipping as one package -- both stated at `PathItemData` today. It does not move the forgery boundary either: a forged source name describes a source the answer names wrongly, in the same class as a forged path, and what decides safety remains what the handler DOES with the path -- still nothing but read it.",
        "THE REBUILD IS FOR BOTH KINDS, AND IT IS A WIDER CHANGE THAN `DIRECTORIES GET A LISTING` -- said out loud here so it does not arrive as a surprise at review. Resolve now writes the block on EVERY path item, a file's included, where today it writes `detail` and passes the block through untouched. One code path rather than two, and a file's block is simply the two facts it already carried; the alternative -- rebuilding for directories alone -- leaves a file answered with whatever text the client sent back, which is the thing the second criterion refuses.",
        "THE MARKUP FORMAT IS RE-READ FROM THE SESSION AND NOT CARRIED ON THE ITEM, for the same reason the block is rebuilt. MEASURED, by reading the type rather than assuming it: `MethodHandler` hands every handler a `RequestContext` of `{ signal, tsudoi }` (packages/tsudoi-language-server/src/types.ts), so `clientCapabilities` is reachable from the resolve handler -- which today writes its context parameter as `_context` and discards it.",
        "HOW THE TWO MODULES SHARE THE BUILDER: the way they already share the mark -- exported from completion.ts, absent from index.ts. `documentationFor` and `preferredFormat` are module-private there now. The precedent is written at `PathItemData`, and it is cited so nobody invents a second sharing scheme or, worse, publishes these.",
        "THE MODULE'S EXISTING ARITHMETIC DOES NOT JUSTIFY THIS WORK, AND AN EXECUTOR WHO READS IT WILL CONCLUDE THAT IT DOES. That argument is about SYSCALLS PER KEYSTROKE: thousands of stats at popup time against one stat on an idle moment. One `opendir` for the one highlighted item is the same order as that one stat, so the syscall argument carries and settles nothing. WHAT IS UNBOUNDED IS THE PAYLOAD -- bytes in one response and lines in one popup -- and a directory of a few thousand entries is ordinary, which is the module's own premise. That is why the third criterion bounds entries rendered rather than calls made.",
        "THE WHOLE DIRECTORY IS READ, ON PURPOSE, AND THE BOUND IS ON THE PAYLOAD ALONE. AN EARLIER RULING OF MINE IS RETIRED HERE AND SAID SO RATHER THAN QUIETLY DROPPED: I refused a total on the ground that `a total is the walk`, and the walk was then MEASURED and is not the cost I priced it at. macOS/APFS, 5000 empty files, names only, mean of 5 drains: bun 1.3.13 51.3 ms and deno 2.8.3 135.1 ms for the whole directory, against one stat at 0.225 / 0.298 ms. Two comparisons decide it. The work this module already refuses -- one stat per entry at popup time -- is ~1.1 s on bun for that same directory, a LOWER bound, so a 51 ms drain once per HIGHLIGHT is two orders off the thing the module exists to avoid. And `itemsFrom` beside it ALREADY drains the entire directory on EVERY KEYSTROKE to filter by prefix, so a full drain on one idle highlight cannot be the expensive thing in this package. WHAT DOES NOT SHRINK IS THE PAYLOAD: those 5000 names are 84,999 characters and the first 20 are 339, which is the ratio the bound is actually about.",
        "THE COST IS LINEAR AND THE DIRECTORY IS UNBOUNDED, WHICH IS THE PART THE MEASUREMENT DOES NOT COVER: 5000 entries was measured, 100k was not, and the drain scales with it. It is accepted rather than guarded, because the alternative guard would have to bound the read by TIME and a highlight that answers differently depending on how busy the machine was is the defect PBI-58 was filed for. UNMEASURED at the tail, and named so.",
        "THE LISTING IS SORTED, AND THE REASON IS TESTABILITY BEFORE IT IS TASTE. `readdir` order is the filesystem's own bookkeeping, promised by nothing, so an unsorted block makes the same directory read differently on two machines and NEITHER a whole-value assertion NOR `the first N are these` can be written against it -- a criterion nothing can falsify is the thing this project refuses to record. Under the full read the sort costs one sort on names already in memory. BY CODE UNIT AND NEVER BY LOCALE, for the reason the module already gives about ISO dates: this string is built by a server and read by a person who may be anywhere, and `localeCompare` would order it for whichever machine the server happens to run on.",
        "THE COUNT GOES WHERE THE LISTING IS AND NOT ON THE DETAIL LINE, so exactly one number about a directory exists and two cannot disagree. That keeps the fifth criterion's pin unmoved, and it is still not a reversal of the size refusal beside it: a count of children is what the directory ENTRY's byte size failed to be.",
        "WHAT A FILE GETS IS ALREADY WHAT WAS ASKED FOR. The stakeholder said `information about the file`; the handler gives size and modification date today. Nothing is invented on top -- mime type, permissions, a line count are each another read for a question nobody asked. The fifth criterion is therefore a PIN AND NOT A FEATURE, and it is worth a criterion only because of the measured hole: both branches of `detailFor` are asserted by nothing today.",
        "THE STAKEHOLDER'S `kind` NAMES THE CASE AND IS NOT A DIRECTIVE TO READ `item.kind`. That field is on the incoming item and an executor will reach for it: it is client-supplied, forgeable, and stale by the time it comes back. The branch stays on a FRESH stat, which is where `detailFor` takes it today.",
        "HIDDEN ENTRIES ARE SHOWN, UNFILTERED, AND IT IS RULED HERE BECAUSE IT WAS UNRULED RATHER THAN DECIDED. The deciding fact is inside this package: `itemsFrom` filters a listing by the fragment's trailing name ALONE and offers dotfiles already, so a resolve block that hid them would make the two halves of ONE package disagree about ONE directory -- the popup offering `.env` while the block describing its parent says it is not there. The user asked about a directory; a listing that answers about a subset of it misreports the thing they asked about. THE FIXTURE HELPER'S BLANKET REFUSAL OF DOTFILES NARROWS RATHER THAN STANDS: it exists because this behaviour was undecided, and a property that hidden entries appear has NO WITNESS unless a fixture holds one.",
        "THE SHARED FIXTURE HAS A DEFECT THAT WOULD HAVE MADE AN ARM MEASURE NOTHING, found by the Developer and recorded because the arm looks green either way: its directory is created EMPTY, so `an empty listing` and `no listing at all` produce the same bytes. It gains children, and they are created BEFORE the fixture's `utimesSync` -- writing into a directory bumps its mtime, and the expected detail string carries that timestamp.",
        "A SYMLINK LISTS ITS TARGET, because `stat` follows -- consistent with `entryKind`, which already reports what a symlink points at rather than that it is one. CYCLES DO NOT ARISE, and the argument is already in `itemsFrom` and is cited rather than restated weaker: a cycle needs traversal and one listing cannot traverse. Nothing recurses here either.",
        "`resolveSupport` IS RULED AND THE RULING IS `NOT GATED`, written down because this module gates its two other client-facing decisions on declared capabilities and calls an ungated send `a SPECIFICATION VIOLATION rather than a generosity`, so a third such decision left unruled reads as an oversight. THE FIELD IS READ RATHER THAN RECALLED: `textDocument.completion.completionItem.resolveSupport` is `{ properties: string[] }` -- `Indicates which properties a client can resolve lazily on a completion item. Before version 3.16.0 only the predefined properties documentation and details could be resolved lazily.` -- in the installed protocol package at node_modules/vscode-languageserver-protocol/lib/common/protocol.d.ts. TWO REASONS IT IS NOT A GATE HERE. The block is one of the two properties that were resolvable BEFORE the declaration existed, so unlike `InsertReplaceEdit` it is not a shape a client can fail to parse. And the completion module ALREADY sends the block eagerly, so a client that ignores what it did not list keeps exactly what it had and loses only the listing -- degraded, where the insert-replace mistake is broken. UNMEASURED, and marked so: whether any real client drops a documentation it did not name has not been read against one.",
        "THE MEMBER README GOES STALE IN TWO PLACES AND BOTH ARE NAMED, because this repository has an open item for exactly this class: the method table's row for `resolvePathStat` says it `fills in that entry's size and modification date`, and the paragraph below says the completion half leaves you `only without the size and date` and that `No entry's detail is read here`. Both are prose, both are pinned by nothing, and both become incomplete the day a directory gets a listing.",
        "FD RELEASE ON AN EARLY EXIT IS A MEASUREMENT AND NOT AN ASSUMPTION. Nothing in this tree breaks out of a directory iteration today -- `itemsFrom` runs its listing to exhaustion -- so the bound introduces the first early exit, and whether the handle is released then is read on BOTH runtimes rather than trusted to node compatibility. UNMEASURED.",
        "SCOPE: one module, one behaviour, one sprint. Out of scope and refused in advance so the sprint does not grow: gating on `resolveSupport`; anything further on the file line; and recursion of any kind, which would bring unbounded walks, depth and symlink cycles back at once.",
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
    {
      number: 51,
      pbi_id: "PBI-59",
      goal: "The build order comes from what each package declares it needs -- proven in a set where the alphabet gets it wrong -- and no probe of a member's own route to tsudoi can be answered by a route the harness handed it.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "THE SPRINT GOES IN GREEN BY DESIGN, so the sprint's own tests are the only thing that can fail -- and the PO accepts on READINGS rather than colours. Today's constructed order already equals the derived one, which is what lets the ordering land with no behaviour change and stops the move from being the thing that first exercises it.",
        "THE PO'S REFUSAL, EVERY CHECK GREEN: the second-route hazard closed PER PROBE instead of AT THE HARNESS. Each enumerated consumer producing its predicted failure while the helper still hands the NEXT probe a second route is exactly the outcome that is green today and walks into the move intact, where it becomes the reason a control lies.",
        "THE THIRD CHECK'S TOOL WAS LOST AND REBUILT MID-SPRINT, DISCLOSED BECAUSE A REVIEWER CANNOT SEE IT AND IT IS NOT THE REPOSITORY'S. This session reaches `oxfmt` through a shim running `bunx oxfmt`, whose cached install went PARTIAL -- tinypool present, the file its manifest names absent -- and every invocation died in node's resolver rather than reporting a format. Clearing the cache made it worse: the re-download never completed, so the check was unrunnable for a while. REBUILT from bun's own package cache (oxfmt 0.61.0, its darwin-arm64 binding, tinypool 2.1.0) with the shim repointed at that install, and the check is still run BARE, as the Definition of Done spells it. Nothing in the repository was edited for this. WHY THE VERDICT DID NOT MOVE WITH THE INSTRUMENT, which is the question the swap raises and the cache held a second version to make sharper: the rebuilt one's FIRST run reported every matched file correctly formatted on a tree the pre-breakage tool had formatted and re-checked. Two versions disagreeing about this codebase would have shown up as issues in exactly that run.",
        "THE ONE RED THAT WAS NOT THE INCREMENT, AND IT IS THE FLAKE SPRINT 50 FILED: `a completion handler that throws after yielding keeps the chunk it already sent` failed once under deno in a full run and passed alone moments later, and the next full run was clean. Recorded rather than diagnosed -- this sprint touches no code that test runs.",
        "TWO SUBSTITUTIONS THE DEVELOPER MADE AGAINST THE CRITERIA, STATED AS DECISIONS RATHER THAN LEFT AS MISSES: the criterion's `deliberately broken control` is served by the same tree with one declaration deleted, which is stronger because it shows the order came from THE DECLARATION; and `read as a value` is served by the dependent's own emitted declaration, because the builder inherits stdio and no diagnostic is capturable through it.",
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
    number: 53,
    pbi_id: "PBI-65",
    goal: "Highlighting a directory in the path completion shows what is inside it, bounded, without costing the detail a failed listing would have thrown away.",
    status: "in_progress",
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
            message: "feat(completion-path): answer a highlighted directory with what is inside it",
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
            message: "fix(completion-path): keep the detail a stat produced when the listing fails",
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
          "UNMEASURED AND THE FIRST TASK MEASURES IT: that a directory can be stat-able and unlistable is standard posix and has not been read on these two runtimes. If the staging cannot be made to bite, THE STAGING CHANGES AND THE PROPERTY DOES NOT.",
        ],
      },
      {
        test: "None -- prose, and the suite is the pair for the command blocks it does not touch.",
        implementation:
          "The reasons this change makes false, rewritten where they live: the module's arithmetic paragraph (it is no longer one syscall, and the listing is information the completion never had), its harmlessness paragraph (a forged mark now costs a directory listing, one step nearer `answered with its contents` than a stat was, and the line this handler will not cross is READING A FILE'S BYTES), the package index's count of internal names, the member README's method row and its `no entry's detail is read here`, and the example config's two mentions of the size and date.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [
          "THE SIZE REFUSAL SURVIVES AND STRENGTHENS, and saying so is the point: the listing is the honest answer to the question a directory's byte size answered badly. That is the constraint that outlived the mechanism change.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "THE COMPOSITION IS A REBUILD AND NOT AN APPEND, AND THE DEVELOPER WITHDREW THEIR OWN PROPOSAL ON THE REASON RATHER THAN ON AUTHORITY: they weighed line count and composer drift, the PO weighed PROVENANCE, and a string the client can put anything in is not a smaller trust surface than the mark -- it is the same surface, one field away. The duplication objection dissolved on reading: the two modules already share the mark by a relative import, and the package's published surface names only its entry point, so one composer serves both callers without publishing anything.",
      "THE REBUILD FIRES FOR BOTH KINDS. Rebuilding for directories alone would leave a FILE answered with the client's own text, which is the thing the ruling refuses.",
      "AN EARLIER PO RULING IS RETIRED BY MEASUREMENT AND THE RETIREMENT IS RECORDED RATHER THAN QUIETLY REPLACED: `no total, because a total is the walk`. MEASURED on one directory of five thousand entries, names only -- the whole drain is 51 ms on bun and 135 ms on deno, against one stat at 0.225 / 0.298 ms, and against the ~1.1 s per KEYSTROKE that this module exists to refuse. And the completion half beside it ALREADY drains the entire directory on every keystroke to filter by prefix, so a full drain once per HIGHLIGHT cannot be the expensive thing in this package. WHAT DOES NOT SHRINK IS THE PAYLOAD: those names are eighty-five thousand characters where the first twenty are three hundred, which is what the bound is actually about.",
      "THE COST IS LINEAR AND DIRECTORIES ARE UNBOUNDED, ACCEPTED RATHER THAN GUARDED: five thousand was measured and a hundred thousand was not, and the only guard available would bound the READ BY TIME -- which makes a highlight answer differently depending on how busy the machine was, the exact defect the next PBI in this backlog was filed for.",
      "HIDDEN ENTRIES ARE SHOWN, RULED NOW BECAUSE IT WAS UNRULED RATHER THAN DECIDED. The deciding fact is inside this package: the completion half already offers dotfiles, so a block that hid them would make the two halves of ONE package disagree about ONE directory -- the popup offering a hidden file while the block describing its parent says it is not there.",
      "THE STAKEHOLDER'S `kind` NAMES THE CASE AND IS NOT A DIRECTIVE TO READ THE ITEM'S OWN `kind` FIELD: that field is client-supplied, forgeable, and stale by resolve time. The branch stays on a FRESH stat, which is where the detail line takes it today.",
      "THE `revise` SKILL RUNS AFTER THE DEVELOPER'S WORK AND BEFORE SPRINT REVIEW, WITH NO PR -- the stakeholder's standing instruction, now recorded at the head of this dashboard rather than as a retrospective improvement.",
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
