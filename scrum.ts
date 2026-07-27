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
      id: "PBI-11",
      story: {
        role: "config author",
        capability: "have their completion handler's cleanup run when a request is abandoned",
        benefit:
          "resources a streaming handler holds are released instead of leaking on every superseded keystroke",
      },
      acceptance_criteria: [
        {
          criterion:
            "A cancelled completion closes the generator in both streaming and aggregation modes",
          verification:
            "A fixture generator records in its finally; cancel mid-stream with a partialResultToken and again without one, asserting the record appears in both runs -- closing only the streaming branch reddens the second",
        },
        {
          criterion:
            "Cleanup that throws is reported, and cleanup that hangs does not delay the response",
          verification:
            "One fixture whose finally throws: assert stderr names it, the server survives and a later completion answers. One whose finally never settles: assert -32800 still arrives, with the rejection asserted where it cannot be laundered into another test's result",
        },
      ],
      status: "ready",
      notes: [
        "Scope boundary: this PBI covers CLIENT CANCELLATION, not shutdown. An in-flight completion deliberately finishes across shutdown -- LSP constrains the client, not the server, and the window before exit is negligible. Decided at Sprint 7 Review and UNPINNED ON PURPOSE, since cancelling at shutdown would be equally acceptable; a test would pin an arbitrary choice rather than a requirement.",
        "Completion ONLY. A promise has no close operation, so a hover handler's own finally runs when its awaited work settles -- extending this to hover would mean INVENTING an abandonment mechanism rather than using one the language provides.",
        "src/methods.ts returns out of the driving loop on abort without calling chunks.return(), leaving the generator suspended at its yield. The abort check sits ABOVE the mode split, so a fix applied one branch lower would be invisible in aggregation -- that is the discriminator, and why one criterion was not enough.",
        "A generator parked inside its own await cannot be closed early: async generator requests are queued, so return() waits for the pending next() regardless. Cleanup runs when it next settles -- a limit of the language, not a defect.",
        "The example config gains a finally only if it reads as documentation. PO correcting their own Sprint 6 note: asserting it would pin it under standing item 6, and pinning requires making the example cancellable -- the artifact-for-test-convenience change already declined. Cancellation coverage stays in fixtures.",
        "Criterion 2's non-launderable clause is load-bearing: Sprint 6 showed an unhandled rejection being attributed to whichever test ran next, across runtimes, twice. A test asserting cleanliness in its own body can pass while the rejection surfaces elsewhere.",
      ],
    },
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
          criterion: 'A config importing from "@atusy/tsudoi/types" loads under both bun and deno',
          verification:
            "A fixture config imports types by the published specifier; the initialize handshake completes under `bun run` and `deno run -A`",
        },
        {
          criterion: "The published specifier resolves for type checking, not only at runtime",
          verification: "tsc --noEmit passes over that fixture config",
        },
      ],
      status: "draft",
      notes: [
        "PBI-10 AND PBI-11 must both complete first: PBI-10 fixes a defect that silently loses user items, PBI-11 stops a streaming handler leaking on every superseded keystroke, and these two PBIs are what make the package installable. Both are named here because each is dropped on completion.",
        "Deferred out of PBI-1 in round 2. Needs package self-reference (name + exports in package.json), unverified under Deno. Not an impediment: self-reference is entirely local, needing no registry, npm account or publish.",
        "Type-only imports are erased at runtime, so no PoC method behavior depends on this; ordered last for that reason.",
        "Regression risk: the obvious fix is a deno.json import map, which is exactly what Sprint 1 deliberately avoided. The cross-runtime lifecycle tests must still pass on completion.",
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
      ],
      status: "draft",
      notes: [
        "PBI-10 AND PBI-11 must both complete first: PBI-10 fixes a defect that silently loses user items, PBI-11 stops a streaming handler leaking on every superseded keystroke, and these two PBIs are what make the package installable. Both are named here because each is dropped on completion.",
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
        "A further instance of debt item (d), added knowingly in Sprint 6: the mid-stream arrivals assertion hardcodes response ids.",
        "Accumulated test-fidelity debt, four items: (a) test/helpers/spawn.ts keeps the per-chunk decode bug fixed in lsp.ts, so no test can assert a non-ASCII config-failure message -- narrow, since the CLI writes stderr directly and nothing in src/ decodes it; (b) the 360KB Japanese test depends on OS pipe buffer sizes and would degrade to passing trivially on a platform with larger ones; (c) the example config's `if (!document) return null` branch is untested; (d) the completion arrivals assertion hardcodes response ids and demands the whole array, so a vscode-jsonrpc bump emitting window/logMessage breaks it at the array shape rather than the ordering claim it defends.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
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
    number: 8,
    pbi_id: "PBI-11",
    goal: "Keep a promise JavaScript already makes -- a config author's finally runs when their completion is abandoned -- so cleanup they can never watch succeed is not silently skipped on every keystroke, and the last gate on releasing this thing comes down.",
    status: "in_progress",
    subtasks: [
      {
        test: "EXPECTED RED. A fixture generator records into stderr from its finally; cancel mid-stream WITH a partialResultToken; assert the record appears, -32800 still arrives, and the session exits 0.",
        implementation:
          "On abort call chunks.return() before returning out of the driving loop. Minimal placement -- INSIDE the streaming branch. Await it inline for now; a later subtask evolves that.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "EXPECTED RED. The same fixture cancelled mid-stream WITHOUT a partialResultToken; assert the same finally record appears.",
        implementation:
          "Lift the close ABOVE the mode split, where the abort check already sits. Deliberate fake-it-then-evolve: the previous subtask places the fix one branch lower precisely so this criterion fails first. The PO wrote a whole criterion for this discriminator, so it earns a real RED rather than a perturbation note. NOT a shared-implementation-moment group -- two moments, by construction.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "EXPECTED RED. A fixture whose finally throws; assert stderr names it with the `tsudoi:` PREFIX (never the body), the server survives, a later completion is answered normally, and the session exits 0.",
        implementation:
          "Catch the rejection from chunks.return() -- measured, a throwing finally rejects it -- and report through a cleanup-specific reporter. Do NOT rethrow: unlike a handler failure the client already has its -32800 and there is no response left to correct.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "EXPECTED RED -- measured, the awaited form never settles, so this test hangs to its timeout before the change. A fixture whose finally never settles: assert -32800 still arrives within an explicit timeout and a later completion is answered.",
        implementation:
          "Convert the inline await to the FLOATING form with the rejection handler still attached. Comment the language limit rather than testing it: a generator parked inside its own await queues return() behind the pending next(), so cleanup runs when it next settles -- a limit of async generators, not a defect.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "BORN GREEN after the two preceding subtasks. For both the throwing-cleanup and hanging-cleanup sessions assert THE SESSION'S OWN EXIT CODE IS 0 and its shutdown/exit completed. PAIRED POSITIVE CONTROL, permanent: a fixture producing a floating rejection with no handler makes the same measurement observe EXIT 1. PERTURBATION: remove the rejection handler from chunks.return(); the throwing-cleanup session MUST redden to exit 1 while the aggregation-close assertion stays green.",
        implementation:
          "None expected. Measured: an unhandled rejection KILLS the child on both runtimes, so it cannot be laundered into whichever test runs next -- it destroys the session that caused it. Assert exit codes, never diagnostic text: bun prints a source frame, deno prints `error: Uncaught (in promise)`.",
        type: "behavioral",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "N/A -- DELIBERATELY NOT ASSERTED, per the PO's correction of their own Sprint 6 note. Asserting it would require making the example cancellable, the artifact-for-test-convenience change already declined.",
        implementation:
          "Add a finally to examples/tsudoi.config.ts's completion generator with a comment explaining it runs when the client cancels. It must read as DOCUMENTATION for a config author, not as a test hook. Bun-free, .ts extensions. Existing lifecycle tests stay green.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
      {
        test: "N/A (structural) -- suite stays green.",
        implementation:
          "Place the cleanup reporter beside reportHandlerFailure, sharing the `tsudoi:` stderr convention but NOT the rethrow -- the asymmetry is the point and deserves the comment. Keep the scope boundary explicit there: client cancellation only, do not wire shutdown->cancel; an in-flight completion finishing across shutdown is correct-by-spec and deliberately unpinned, and this file is exactly where someone would assume otherwise.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "MEASURED, AND IT EXPOSES A CONFLICT INSIDE THE RULING: a throwing finally REJECTS chunks.return(); a hanging finally means it NEVER SETTLES; an unhandled rejection KILLS the child with exit 1 on both runtimes. So `await chunks.return()` in the response path cannot satisfy both halves of criterion 2 -- a hanging finally would mean -32800 is never sent. Resolution, read as what the ruling MEANS rather than a departure from it: fire return() with an ATTACHED REJECTION HANDLER and never await it in the response path. That single handler does two jobs -- it is how a throwing finally gets reported, and it is what stops that same rejection becoming fatal. Drop it and both halves fail together.",
      "The measurement hands criterion 2 a STRONGER non-launderable assertion than a stderr match: since an unhandled rejection destroys the session that caused it, assert the session's own exit code rather than searching for text that another test could have produced.",
      "PO checklist, per-sprint additions: (1) the mode-split perturbation reported as a PAIR -- aggregation red WHILE streaming green; (2) the hang case proven by ORDERING not timing -- the finally's record absent at the moment -32800 arrives, present after release, which cannot pass because of fast hardware; (3) the unhandled-rejection assertion made where it cannot be laundered; (4) cleanup that throws proven by SURVIVAL as well as stderr -- a later completion answers normally.",
    ],
  },
  retrospectives: [
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
