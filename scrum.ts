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
            "No statement in the tree explains a present-day fact by a mechanism the move removed, and no document hard-codes a count.",
          verification:
            "Three named sites, each read rather than grepped for. The staged-path pin licenses itself with `that mapping is safe only because it cannot reach the packing stage` -- and there is NO MAPPING ANYWHERE NOW, so the tree's one narrative statement of how this repository resolves its own subpaths is false, and a contributor learns the pre-move story from the file that pins what we publish. The root config still excludes a directory the root no longer produces, matching nothing, with a test pinning the literal. And two documents hard-code a file count in a repository whose own convention refuses counts because they go stale -- the same defect its success metric carried for thirty sprints.",
        },
      ],
      status: "draft",
      notes: [
        "SEPARATED FROM THE OTHER STALE-VALUE REPAIRS BY WHAT MAKES THEM WRONG: the count and the excluded directory are VALUES that went stale, while the pin's licence is a MECHANISM CLAIM that is now false -- which is the class this project has filed four instances of and has no check for.",
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
  sprint: null,
  retrospectives: [
    {
      sprint: 52,
      improvements: [
        {
          action:
            "TWO STATES THAT PRODUCE BYTE-IDENTICAL FAILURE TEXT ARE ONE RED, AND A CONTROL THAT MEANT TO DISTINGUISH THEM MEASURES NOTHING. MEASURED AT THE MOVE: `the entry resolves to the WRONG package` and `there is no entry at all` printed the same thing, so the reading that discriminates them is FOLLOWING THE ENTRY AND READING THE TARGET'S DECLARED NAME -- not that a symlink exists. Filed with the companion finding, also unpredicted: the installer WRITES, IT DOES NOT RECONCILE, so removing a declaration and re-installing leaves the stale link answering, which is why a falsifier had to stash BOTH routes rather than the one it named.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A REFUSAL WRITTEN OVER PACKAGES IS BLIND ONE LEVEL IN, AND IT PASSED OVER THE PROBE THAT PROVED IT. MEASURED: a TypeScript file planted where no compiler program reaches RUNS UNDER THE SUITE AND IS TYPE-CHECKED BY NOTHING, with all five checks exit 0 -- and the guard whose subject is `a package nothing covers` ran and said nothing, because its subject is DIRECTORIES HOLDING A MANIFEST. The move is what made it live: the framework member is now the only member whose config includes just its source.",
          timing: "product",
          status: "active",
          outcome: null,
        },
        {
          action:
            "A COMMENT THAT LICENSES A PRESENT-DAY DECISION BY A MECHANISM THE INCREMENT REMOVED IS WORSE THAN A STALE VALUE, BECAUSE IT READS AS CURRENT. The staged-path pin still explains itself by a compiler mapping that NO LONGER EXISTS ANYWHERE IN THIS REPOSITORY -- so the tree's one narrative account of how it resolves its own subpaths is false, and a contributor learns the pre-move story from the file that pins what is published. Distinct from the two stale COUNTS filed beside it: those are values that went out of date, this is a reason that stopped being true. Fifth instance of the class the mechanism-claim item was filed for.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
      ],
    },
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
