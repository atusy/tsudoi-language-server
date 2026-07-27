// ============================================================
// Dashboard Data (AI edits this section)
//
// Compaction target for this project: 500 lines (overrides the
// scrum-dashboard skill's default of 300).
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
        metric: "PoC-scope LSP methods respond per the specification",
        target: "10 of 10 methods",
      },
      {
        metric: "The CLI starts under both Bun and Deno",
        target: "Smoke start succeeds on both runtimes",
      },
    ],
  },

  product_backlog: [
    {
      id: "PBI-7",
      story: {
        role: "config author",
        capability:
          "import tsudoi's types by the published package specifier from their own project",
        benefit: "their config type-checks without relative paths into tsudoi's source tree",
      },
      acceptance_criteria: [
        {
          criterion:
            "The published specifier @atusy/tsudoi/types resolves for TYPE CHECKING, both inside this repo and from an installed copy",
          verification:
            "tsc --noEmit passes over a config importing by the published specifier, in-repo and in a packed-and-installed consumer project; PAIRED CONTROL: removing the exports entry makes the same check fail with TS2307",
        },
        {
          criterion: "The example config imports its types by the published specifier",
          verification:
            "examples/tsudoi.config.ts imports from @atusy/tsudoi/types, and the cross-runtime lifecycle tests that drive it stay green under bun and deno",
        },
        {
          criterion: "Adding the package identity does not regress cross-runtime loading",
          verification:
            "The full suite stays green under both runtimes and no deno.json exists in the repo",
        },
      ],
      status: "ready",
      notes: [
        "THE ORIGINAL RUNTIME CRITERION WAS MEASURABLY VACUOUS AND IS DROPPED: `a config importing @atusy/tsudoi/types loads under both bun and deno` passes with NO exports, NO name change, nothing implemented -- import type is erased before either runtime resolves anything, and only tsc discriminates. This PBI's own third note stated that mechanism and the criterion was written as a runtime test anyway.",
        "./types is the WHOLE surface for this PBI. No main, no bin -- those belong to the runnable-distribution PBI the Deno finding forces, and entangling them here would import that defect into this sprint.",
        "The example switching to the published specifier is THE POINT, not a hazard: the brief's example imports it, ours imports a relative path into src/, and a config author copies the example. Unlike the two changes declined before, this one is the user-visible deliverable rather than test convenience.",
        "Honest limit: the example proves SELF-REFERENCE, not installed resolution. The external case is proven separately by pack-and-install, and only for the type import.",
        "The no-deno.json guard is stated as REASONED, not measured -- Sprint 1's argument about npm resolution flipping to the global cache was never tested. This sprint measures it, and if adding a deno.json does NOT redden the suite, that must be recorded honestly rather than dressed up.",
      ],
    },
    {
      id: "PBI-8",
      story: {
        role: "config author",
        capability: "learn how to start tsudoi against their own config without reading its source",
        benefit:
          "they can stand up a server without reverse-engineering the CLI or its runtime flags",
      },
      acceptance_criteria: [
        {
          criterion: "The documented quickstart runs as written",
          verification:
            "Copy the README's quickstart command verbatim and run it from a clean checkout under both bun and deno; each returns an InitializeResult naming tsudoi",
        },
        {
          criterion: "The deno permission set is documented and matches what the suite spawns",
          verification:
            "The README names the permissions deno actually requires and why; test/helpers/lsp.ts spawns that same set, so docs and suite cannot drift",
        },
        {
          criterion: "The contract a reader cannot guess is stated",
          verification:
            "README states that --config has no default, that the config default-exports a factory, and that deno must be on PATH or `bun test` fails",
        },
        {
          criterion: "The documented failure behaviour happens as written",
          verification:
            "Break the documented quickstart config and run it under both runtimes; assert exit code 1, a tsudoi:-prefixed reason on stderr and zero bytes on stdout, matching what the README states will happen",
        },
      ],
      status: "draft",
      notes: [
        "PBI-10 AND PBI-11 must both complete first: PBI-10 fixes a defect that silently loses user items, PBI-11 stops a streaming handler leaking on every superseded keystroke, and these two PBIs are what make the package installable. Both are named here because each is dropped on completion.",
        "Documents the failure CONTRACT -- exit 1, a tsudoi:-prefixed reason on stderr, zero bytes on stdout -- NOT the seven-case taxonomy. The contract is stable and unguessable; the catalogue is neither, and all three contract facts are already pinned by PBI-1's criteria in ASCII, so no PBI-9 work is a prerequisite. The fourth criterion breaks THE DOCUMENTED CONFIG ITSELF rather than shipping a second broken example that could drift.",
        "Deliberately does NOT claim a config author's own error message passes through verbatim. It does today -- the CLI writes stderr directly and nothing in src/ decodes it -- but it cannot be asserted for non-ASCII until PBI-9 fixes spawn.ts. Documenting a claim we cannot pin is the thing refused all project, applied here against a claim the PO would like to make.",
        "Ordered after PBI-7 so the documented import is @atusy/tsudoi/types, not a relative path -- writing it earlier guarantees a rewrite.",
        "The permission criterion says 'the permissions deno actually requires' rather than promising to beat -A: vscode-jsonrpc may pull in more than --allow-env --allow-read, and a docs deliverable must not be held hostage by an open investigation. The anti-drift mechanism is the part that matters.",
      ],
    },
    {
      id: "PBI-9",
      story: {
        role: "tsudoi maintainer",
        capability: "keep the lifecycle and config-failure guarantees pinned by automated tests",
        benefit: "behaviour verified only by hand at Sprint 1 Review cannot regress unnoticed",
      },
      acceptance_criteria: [
        {
          criterion: "The shutdown response is pinned for spec-compliant pacing",
          verification:
            "Test awaits the shutdown response, asserts it arrives, then sends exit and asserts code 0",
        },
        {
          criterion: "The config-failure cases run under both runtimes",
          verification:
            "The seven cases are parameterised over bun and deno; each asserts exit 1, non-empty stderr and 0-byte stdout",
        },
        {
          criterion: "Every guard rule is pinned at every path shape a .ts file takes in this repo",
          verification:
            "One shared path-shape list covering src/, **/*.test.ts, test/helpers/, test/fixtures/ and examples/ drives the Bun-global, bun:* and import/extensions tests alike; each rule is asserted flagged or exempt at every shape",
        },
      ],
      status: "draft",
      notes: [
        "Both behaviours already pass, so each test must be proven to fail before it is trusted -- perturb the exit path and the deno args, confirm red, restore.",
        "spawn.ts's decode is what would let PBI-8 claim verbatim passthrough of a config author's own error message. THE DEPENDENCY RUNS THAT WAY ROUND: PBI-9 UNLOCKS a future README claim, it does not block the current one -- do not reorder on it.",
        "A further instance of debt item (d), added knowingly in Sprint 6: the mid-stream arrivals assertion hardcodes response ids.",
        "Added in Sprint 8, debt item (e): test/helpers/lsp.ts gained two behaviours that NO green test asserts -- a request issued after the child has already closed settles at once with the dead-server shape (previously it waited forever), and stdin write errors are swallowed so a test driving a dead session fails on its assertion rather than on an uncaught EPIPE. Both were found by running a perturbation and are exercised only under one; the helper's own behaviour is unpinned.",
        "Accumulated test-fidelity debt, four items: (a) test/helpers/spawn.ts keeps the per-chunk decode bug fixed in lsp.ts, so no test can assert a non-ASCII config-failure message -- narrow, since the CLI writes stderr directly and nothing in src/ decodes it; (b) the 360KB Japanese test depends on OS pipe buffer sizes and would degrade to passing trivially on a platform with larger ones; (c) the example config's `if (!document) return null` branch is untested; (d) the completion arrivals assertion hardcodes response ids and demands the whole array, so a vscode-jsonrpc bump emitting window/logMessage breaks it at the array shape rather than the ordering claim it defends.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
    {
      id: "PBI-12",
      story: {
        role: "config author",
        capability: "be told when their cleanup did not finish",
        benefit: "a finally that never completes is visible instead of silently skipped",
      },
      acceptance_criteria: [
        {
          criterion: "A close that leaves the generator suspended is reported once",
          verification:
            "A fixture whose finally yields; assert chunks.return resolves done === false, that stderr names it once per session, and that a later completion answers normally",
        },
      ],
      status: "draft",
      notes: [
        "Ordered LAST: unlike the null token or a plain try/finally, YIELDING FROM CLEANUP is pathological rather than a plausible mistake. Same silent-cleanup harm, far lower probability -- it may reasonably never be reached, and saying so beats pretending otherwise.",
        "Remedy follows normalise-and-report and report-and-survive: report on done !== true, do NOT rethrow and do NOT keep calling next(), which a finally yielding in a loop would make unbounded.",
        "MEASURED on both runtimes: chunks.return(null) resolves {value, done:false}, leaving the generator suspended INSIDE its own finally. Unlike the parked-in-await limit this is INVISIBLE rather than documented, and unlike that one tsudoi CAN detect it -- done === false is in the result currently discarded.",
      ],
    },
  ],

  completed: [
    {
      number: 8,
      pbi_id: "PBI-11",
      goal: "Keep a promise JavaScript already makes -- a config author's finally runs when their completion is abandoned -- so cleanup they can never watch succeed is not silently skipped on every keystroke, and the last gate on releasing this thing comes down.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 24b70a7, 7e37784, a88d3a6, cd08905, f61846a, 138ccba, ca0535e across 7 subtasks, plus 01e36d8 fixing a helper defect found while perturbing. Per-subtask records and 6 perturbation notes compacted here; git retains them.",
        "P5 IS THE EMPIRICAL ARGUMENT FOR THE PO'S OWN NON-LAUNDERABLE CLAUSE: rethrowing inside the cleanup handler flips report, survival AND exit-code tests on deno, but on BUN only the exit code flips -- the session survived long enough to answer a later completion AND to print its tsudoi: line. Every survival-shaped and stderr-shaped assertion passed; only the session's own exit code caught it.",
        "MEASURED, AND IT EXPOSES A CONFLICT INSIDE THE RULING: a throwing finally REJECTS chunks.return(); a hanging finally means it NEVER SETTLES; an unhandled rejection KILLS the child with exit 1 on both runtimes. So `await chunks.return()` in the response path cannot satisfy both halves of criterion 2 -- a hanging finally would mean -32800 is never sent. Resolution, read as what the ruling MEANS rather than a departure from it: fire return() with an ATTACHED REJECTION HANDLER and never await it in the response path. That single handler does two jobs -- it is how a throwing finally gets reported, and it is what stops that same rejection becoming fatal. Drop it and both halves fail together.",
      ],
    },
    {
      number: 7,
      pbi_id: "PBI-10",
      goal: "Make tsudoi safe to hand to a stranger -- when a client sends what the specification forbids, it gets an error or a correct fallback with a trace, never silently fewer items than the handler produced.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in adcff14, 8e71fcc, eb616dd, e50ecc2, 63a87e4, adc95ef, 4b70591, 0c804b9, 581a422, 1b0b2d1 across 9 subtasks. Per-subtask records and 12 perturbation notes compacted here; git retains them.",
        "ACCEPTED with its justification CORRECTED by the PO, because a note carrying a false premise is worse than no note: isProgressToken admits integers outside LSP's int32 (Number.isInteger(2**40) is true). Rejecting would NOT lose the client's items -- under normalise-and-report an invalid token aggregates, so every item still arrives in the response body. The real reason to honour it is that the CLIENT chose that token and can correlate it, so honouring delivers the streaming they asked for, whereas rejecting silently downgrades a working client to aggregation plus a stderr line it did not need.",
        "PROBE 2 SHARPENS THE HARM MODEL: 0, the empty string AND null all survive connection.sendProgress on both runtimes. So today's pre-fix behaviour is not `streaming fails` -- it is SILENT MISDELIVERY, items emitted to a `$/progress` addressed to null that no client can correlate. Measured, not assumed, and it makes criterion 3 genuinely RED today.",
        "TWO WEAKNESSES FOUND BY READING THE CODE, neither built, both for the PO to rule on. (1) The lifecycle gate is consulted ONCE, at dispatch: a completion already streaming when `shutdown` arrives keeps calling sendProgress, so $/progress and then its response land AFTER the shutdown response. No test sends that sequence, so it is unproven in either direction; arguably correct, since LSP forbids accepting NEW requests, but this sprint closed the door only at dispatch. (2) isProgressToken accepts any JS integer, while LSP's `integer` is int32 -- a token of 2^40 passes. Rejecting it would LOSE the client's items, contrary to the harm-proportionality ruling, so accepting is probably right, but it is an undocumented deviation from the type the doc comment cites.",
      ],
    },
    {
      number: 6,
      pbi_id: "PBI-5",
      goal: "Make slow sources safe as well as first-class -- when the client cancels, context.signal aborts and a config author's handler can stop -- so the streaming API built last sprint never leaves abandoned work running.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 7b6e133, 5cba2c2, 7481a22, 26e12a9, 81983b0, 7327cf7, 5913ad9, 25302fc across 8 subtasks, plus a85ba96 and 71afcbb closing gaps. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "MEASURED at HEAD, after the extraction: removing the settle-time check reddens the four -32800 tests but NOT the cancelled-throw test, which the catch-side branch answers. The two branches of answerUnlessCancelled are independently defended.",
      ],
    },
    {
      number: 5,
      pbi_id: "PBI-4",
      goal: "Make yield and return the whole of a config author's streaming API -- tsudoi decides whether that reaches the client as $/progress chunks or one aggregated response -- so the most precisely specified thing in the brief is the thing they never have to think about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 12fda1b, 2c4294b, e82e7ae, 1d0c0f2, 1a72d93, 38fe70b, e8af57a, 095cdf3 across 8 subtasks. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
      ],
    },
    {
      number: 4,
      pbi_id: "PBI-3",
      goal: "Complete the chain from a config author's file to a human's screen: the hover text they write is what an editor shows, with zero lines changed in tsudoi.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in d0f172a, 4a49499, 31f169f, 0cecfec, e5c49cc, fe8f153, f5c612f across 7 subtasks. Per-subtask records compacted here; git retains them.",
      ],
    },
    {
      number: 3,
      pbi_id: "PBI-2",
      goal: "Turn documents.get(uri) from a stub into the editor's live buffer -- the first line of the stakeholder's own example config, and the substrate every method after this one answers from.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 81ac35e, aa5b588, 1e434c5, 73b2677, e49cbb6, cc44ffe, 6c9b910, 5ce2823 across 7 subtasks. Per-subtask records compacted here; git retains them.",
        'The Japanese test found a latent defect in the TEST helper, not the server: per-chunk chunk.toString("utf8") turns any multi-byte character the pipe splits into U+FFFD. Silent at small payloads, deterministic RED at 360KB under both runtimes.',
      ],
    },
    {
      number: 2,
      pbi_id: "PBI-6",
      goal: "Make Deno support stop depending on anyone remembering it -- the codebase itself rejects the changes that would quietly break the second runtime, before the sprints that write most of the source.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 706c0d0, 1cd4137, 3ee8eed, e05e45d, d1687f1 across 4 subtasks. Per-subtask records compacted here; git retains them.",
        "PO invariant, settled at planning rather than Review: the guard's tests must be automated AND all four DoD checks must still exit 0 at HEAD with them present. Committed violation fixtures would make oxlint exit 1; the temp-dir probe harness is what reconciles this.",
      ],
    },
    {
      number: 1,
      pbi_id: "PBI-1",
      goal: "One config file brings up a real language server process under whichever runtime the user already has, with nothing repo-specific making it work and no failure mode that leaves them guessing.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in eb92147..f5f76a0 across 15 TDD subtasks, plus 4d553af (Review-driven fix) and 45c00ba (retrospective action). Per-subtask records compacted here; git retains them.",
        "No deno.json, deliberately -- Deno 2 auto-detects package.json + node_modules, and adding one can flip npm resolution to the global cache and silently break the cross-runtime criterion.",
      ],
    },
  ],

  definition_of_done: {
    checks: [
      { name: "Tests pass", run: "bun test" },
      { name: "Lint passes", run: "oxlint" },
      { name: "Format check passes", run: "oxfmt --check ." },
      { name: "Type check passes", run: "tsc --noEmit" },
    ],
  },

  sprint: {
    number: 9,
    pbi_id: "PBI-7",
    goal: "Make the stakeholder's own example importable -- @atusy/tsudoi/types rather than a relative path into our source -- from outside this repo and under both runtimes.",
    status: "in_progress",
    subtasks: [
      {
        test: "EXPECTED RED, measured: add test/fixtures/published-specifier.ts importing Tsudoi and TsudoiConfig from @atusy/tsudoi/types; the DoD's tsc --noEmit goes red with TS2307.",
        implementation: "None -- the fixture IS the RED.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "EXPECTED GREEN, closing the previous subtask: tsc --noEmit passes with the fixture in place.",
        implementation:
          'name: "@atusy/tsudoi", exports: { "./types": "./src/types.ts" }, files: ["src"]. Comment AT THE EXPORTS SITE recording why it is types-only -- the durable copy, per this sprint\'s lifetime rule.',
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "BORN GREEN after the identity lands. Spawn tsc against a generated temp project -- the test/helpers/lint.ts pattern -- asserting TS2307 WITHOUT the exports entry and clean WITH it, COPYING the repo's real package.json rather than re-declaring it. This is the permanent pair the absence rule requires, replacing a one-time probe with a standing one. PERTURBATION: delete the exports entry from the real package.json; this MUST redden on the with-exports half WHILE the runtime tests stay green -- which is precisely the vacuity this sprint discovered.",
        implementation: "New helper alongside lint.ts.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: 'BORN GREEN, measured passing. Pack the package, install it into a temp consumer project, assert tsc --noEmit passes there over a config importing the published specifier. PERTURBATION: drop "./types" from exports; must redden. SCOPE: type resolution ONLY -- do NOT assert the installed CLI runs, which is measured broken under Deno and belongs to the new PBI.',
        implementation: "None expected.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "BORN GREEN, measured: self-reference resolves at runtime and the import is erased anyway. The existing cross-runtime lifecycle tests driving examples/tsudoi.config.ts stay green under bun and deno after the switch. PERTURBATION: point the example at a specifier exports does not expose, e.g. @atusy/tsudoi/nope; both runtimes' lifecycle tests MUST redden AT CONFIG LOAD. Naming both halves: that flip defends `the example still loads`, NOT `the specifier resolves for types`, which the two preceding subtasks defend -- it lands earlier than this subtask's headline.",
        implementation:
          "Change the example's type import from the relative path to @atusy/tsudoi/types. Remove the `PBI-7 until then, relative` comment it has carried since Sprint 1.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "BORN GREEN. Assert no deno.json or deno.jsonc exists at the repo root. PERTURBATION, AND THIS ONE MUST BE MEASURED RATHER THAN ASSUMED: add a deno.json with an npm import map and run the cross-runtime suite. If it reddens, record that as the measured justification for the guard. IF IT DOES NOT REDDEN, SAY SO -- then this file-absence assertion is the only thing carrying a constraint whose harm is unproven, and that must be recorded honestly rather than dressed up.",
        implementation: "None.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "MEASURED, and it dropped a criterion: import type is erased before either runtime resolves, so a RUNTIME test of a type-only specifier is vacuous -- the original criterion passed with nothing implemented. Only tsc discriminates.",
      "MEASURED, and NOT this sprint's to fix: an INSTALLED copy cannot run under Deno at all -- ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING, from a packed-and-installed consumer under deno 2.9.2, while bun runs it fine. Success metric #3 holds for a repo checkout and FAILS for an installed copy. Raised to the PO as a new PBI ordered before PBI-8 rather than smuggled in as retroactive scope.",
      "PO checklist, per-sprint additions: (1) the resolution mechanism proven by perturbation -- rename node_modules and require the deno handshake to FAIL; do NOT assert deno.json is absent as the requirement, since by the Sprint 8 bounding condition a deno.json preserving node_modules resolution would be equally acceptable -- pin the property, not the file; (2) if a deno.json is introduced it is a DISCLOSED DECISION carrying its reasoning, not a fix, and (1) must still hold; (3) the specifier exercised from OUTSIDE the repo, not only via self-reference -- self-reference satisfies the criterion entirely from inside while a stranger still cannot resolve it, which is green-suite-story-undelivered; (4) THE EXAMPLE ITSELF switches, or the story is not delivered.",
      "PLANNED FOR RATHER THAN DISCOVERED: adding exports to package.json is a BREAKING CHANGE to every resolution path in the repo -- once exports exists, anything not listed becomes unreachable, potentially including src/cli.ts. A green in-repo suite BEFORE exports lands proves nothing about after.",
    ],
  },
  retrospectives: [
    {
      sprint: 9,
      improvements: [
        {
          action:
            "SHARPENED ON LIFETIME, replacing the route-to-a-PBI rule: a decision whose violation would be a CODE EDIT belongs in a comment at the site where that edit would be made; a decision that shapes WHAT TO BUILD NEXT belongs on the PBI. When it does both it goes in both -- and the SOURCE COMMENT IS THE DURABLE COPY, because a dashboard note has the lifetime of a PBI and every PBI eventually compacts. When in doubt, put it in the source.",
          timing: "immediate",
          status: "active",
          outcome:
            "Shuffling a note between PBIs postpones the orphan; a comment at the edit site outlives every compaction. Evidence: the Sprint 7 shutdown ruling survives in src/methods.ts with its reasoning intact while the PBI carrying it compacted away.",
        },
        {
          action:
            "EVERY CRITERION GETS A NEGATIVE CONTROL AT REFINEMENT TIME: name the change that would make it fail. If nothing would, the criterion is VACUOUS and must be rewritten before it binds.",
          timing: "immediate",
          status: "active",
          outcome:
            "The absence-pairing rule moved from assertions to criteria and from execution to refinement. PBI-7's runtime criterion would have consumed a sprint and produced a green test proving nothing -- and the fact that made it vacuous was already written in its own PBI's notes. It was caught only because the probe was ordered first.",
        },
      ],
    },
    {
      sprint: 9,
      improvements: [
        {
          action:
            "COMPACTION may not drop a recorded decision unless it has a DURABLE HOME elsewhere -- a comment at the code site it constrains, an acceptance criterion, or a note on an OPEN PBI -- and each compaction NAMES where every dropped decision went. A commit message is NOT a durable home. Improvements with status active are never compacted.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed after the Scrum Master raised it about their own conduct: five mid-Review compactions, each deciding which of the PO's recorded decisions survive, at speed and with no check, while the PO read the compacted result as the record. Nobody greps commit messages before editing a line; a comment at the site is read by whoever changes it. Naming the destination makes the editorial judgement auditable rather than trusted. AUDIT RUN AT FILING: 15 active improvements present, and every earlier drop traced to a named successor (three consolidated into the Sprint 4 rule) or a route to PBI-9. No unexplained losses.",
        },
      ],
    },
    {
      sprint: 8,
      improvements: [
        {
          action:
            "PREFER SPLITTING OVER DOCUMENTING: when a perturbation would flip at an earlier assertion than the sub-claim it targets, that is a signal the test BUNDLES independent sub-claims. Split the test so each sub-claim can fail alone, rather than recording that the headline claim is undefended.",
          timing: "immediate",
          status: "active",
          outcome:
            "Better than covered -- it DISSOLVES what the earlier-assertion clause only documents. Sprint 7's subtask 5 needed exactly this and it was discovered during execution rather than declared at planning; as a planning-time rule the fix moves earlier and the retro carries less.",
        },
        {
          action:
            "A JUSTIFICATION recorded in a note is held to the assertion standard: say whether it was MEASURED or REASONED, and never state a consequence without checking it against the remedy it justifies.",
          timing: "immediate",
          status: "active",
          outcome:
            "Filed at the Developer's request after they named it at second occurrence. Sprint 2: a perturbation claimed to defend node: specifiers defended only the npm half. Sprint 7: rejecting an out-of-range token was said to lose the client's items when normalise-and-report delivers every one of them. Both times the DECISION was right and the stated REASON false -- the more dangerous failure, because a false premise is what someone acts on two sprints later. The consolidated rule disciplines assertions and perturbations; it said nothing about prose.",
        },
      ],
    },
    {
      sprint: 7,
      improvements: [
        {
          action:
            "A behaviour is pinned by a test where ONE outcome is required. Where TWO outcomes would both be acceptable, record the decision and leave it unpinned -- and the burden is to NAME THE ALTERNATIVE that would also be acceptable.",
          timing: "sprint",
          status: "active",
          outcome:
            "A bounding condition on seven sprints of pin-everything pressure, whose cost is already visible: PBI-9 carries three separate instances of hardcoded-response-id brittleness -- tests that resist legitimate change without defending a requirement. The name-the-alternative clause is what stops it becoming an escape hatch: `there is nothing to preserve` is easy to assert, `cancelling in-flight requests at shutdown would be equally acceptable` is falsifiable.",
        },
      ],
    },
    {
      sprint: 6,
      improvements: [
        {
          action:
            "Every assertion that something is ABSENT -- zero stderr, zero $/progress, a label not on stdout -- ships with a PAIRED assertion, permanent in the suite, that the same measurement observes it when present. A perturbation proves the apparatus once, on the day it was run; the pair proves it on every run, including after someone refactors the accumulator two sprints later.",
          timing: "immediate",
          status: "active",
          outcome:
            "Generalises what the PO had been imposing by hand criterion by criterion. Absence assertions are the ones least often perturbed, because `nothing happened` feels self-evident.",
        },
        {
          action:
            "A perturbation specified by the PRODUCT OWNER names the assertion it is required to flip, not just the mutation to make. If it flips an earlier assertion instead, it has not defended the claim it was written for and a different perturbation is required.",
          timing: "sprint",
          status: "active",
          outcome:
            "Filed separately from the perturbation-LABELLING rule on purpose: that one governs how the Scrum Master REPORTS (reproduction versus independent, expected versus observed), this one governs how the PO AUTHORS. Different owners, different phases; merging them would lose what makes each actionable.",
        },
      ],
    },
    {
      sprint: 5,
      improvements: [
        {
          action:
            "A plan must declare which subtasks share ONE IMPLEMENTATION MOMENT. Within such a group only the first can claim expected-RED; the rest are born-green-by-construction and carry perturbations, however distinct their criteria are.",
          timing: "immediate",
          status: "active",
          outcome:
            "Sprint 5's subtasks 5-7 were planned expected-RED and came out born green: one async generator cannot be dispatched twice. `Do not split a single dispatch` is the WRONG lesson -- the split is what produced six independently perturbable criteria. The plan simply bought sequencing it could not have.",
        },
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
            "Standing-list amendment (item 6 above): the stakeholder-facing example is the artifact under test with no fixture copy in existence. It is why the example cannot rot without the suite going red, and why Sprint 4's hover demo could be the stakeholder's own file, unmodified.",
          timing: "immediate",
          status: "active",
          outcome:
            "Today it survives only because test/lifecycle.test.ts happens to load that file; nothing stops a duplicate fixture appearing. Sprint 5 covered it by the Developer's initiative, not by structure.",
        },
      ],
    },
    {
      sprint: 4,
      improvements: [
        {
          action:
            "CONSOLIDATED, replacing the manufactured-RED rule and its three amendments: anything not perturbed is assumed unproven; every subtask declares expected-RED or born-green; every perturbation is named by the ASSERTION it flips, not by the subtask it belongs to -- and if it flips at an EARLIER assertion than the subtask's headline claim, that headline claim is still undefended and needs its own perturbation.",
          timing: "immediate",
          status: "active",
          outcome:
            "Amended three times already, which is its own signal: a rule list nobody can hold in their head stops being applied at exactly the moment it is needed. Prompted by Sprint 4's subtask-4 perturbation, which flipped the test entirely but at 'hover is answered at all', never reaching the null-versus-Hover claim its name promised.",
        },
        {
          action:
            "The PO's Review checklist splits into a STANDING list, recorded here once and reported against at EVERY Review, plus a short per-sprint list of what is genuinely new. Standing list: (1) driven over stdio through the real server, not against directly-constructed internals; (2) stdout carries only protocol, with non-protocol bytes COUNTED rather than eyeballed; (3) non-ASCII payloads on any new user-visible path, permanent in the suite; (4) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (5) both runtimes, and the Definition of Done at HEAD; (6) the stakeholder-facing example examples/tsudoi.config.ts is the ARTIFACT UNDER TEST, with no fixture copy of it in existence -- a PRODUCT property rather than a test property, which is why it belongs here rather than being rediscovered. Moving an item to the standing list removes it from the PO's authoring, NEVER from the Scrum Master's reporting -- if a standing item stops being reported, we have traded verification for convenience.",
          timing: "immediate",
          status: "active",
          outcome:
            "Nine items where three carried new information diluted the signal the item-by-item rule exists to protect. Counter-evidence weighed: Sprint 3's stdout-purity item LOOKED standing and found that sprint's largest defect, hence the still-reported clause.",
        },
      ],
    },
    {
      sprint: 3,
      improvements: [
        {
          action:
            "A Review perturbation states whether it REPRODUCES the Developer's recorded perturbation or is INDEPENDENT. Reproductions report expected versus observed failure counts, so a divergence surfaces when it occurs rather than at write-up.",
          timing: "sprint",
          status: "active",
          outcome:
            "Prompted by a Review perturbation reddening 6 tests where the Developer's reddened 2. The divergence was information; not noticing it until write-up was the defect. Mandating sameness would have cost Sprint 2's ignorePackages finding, which came from an independent probe.",
        },
      ],
    },
    {
      sprint: 2,
      improvements: [
        {
          action:
            "A note addressed to a PBI other than the one it sits on must be written onto THAT PBI when the note is created, not left to be rescued at compaction. This removes the compaction-time check rather than adding a second thing to remember.",
          timing: "sprint",
          status: "active",
          outcome:
            "First application found a real orphan immediately: PBI-2 said 'PBI-3 and PBI-4 widen it again', PBI-3 carried its copy, PBI-4 carried nothing. Written onto PBI-4.",
        },
        {
          action:
            "An attached spike must be DURABLE: inlined verbatim in the subtask text, or committed into the repo by the first subtask. A scratchpad path is a pointer, not an attachment -- it dies with the session, and a fresh executor would re-derive or guess.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
      ],
    },
    {
      sprint: 1,
      improvements: [
        {
          action:
            "The PO's acceptance checklist is issued at Sprint PLANNING, not at Review, so the plan can target it. Review measurements are then reported item by item against it, in the checklist's own numbering, including items that pass trivially -- so an omission is visible as an omission.",
          timing: "sprint",
          status: "active",
          outcome: null,
        },
        {
          action:
            "When a planning spike produces passing code, attach the code for the executor to start from; the plan then says what to change about it instead of re-deriving it in prose.",
          timing: "sprint",
          status: "active",
          outcome: null,
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
