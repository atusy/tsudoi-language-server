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
      id: "PBI-10",
      story: {
        role: "editor user",
        capability:
          "get a spec-correct response instead of a plausible but wrong one when their client sends something the specification does not allow",
        benefit:
          "a client bug surfaces as an error or a correct fallback, never as silently missing information",
      },
      acceptance_criteria: [
        {
          criterion: "A request arriving before initialize is answered -32002 ServerNotInitialized",
          verification:
            "Test sends hover before initialize and asserts the code, then asserts initialize still succeeds afterwards, and that exit sent before any initialize still exits 1 rather than hanging",
        },
        {
          criterion:
            "After shutdown a request is answered -32600 InvalidRequest and a notification is ignored",
          verification:
            "Test sends hover after shutdown asserting the code, sends didOpen after shutdown asserting zero stderr and that the document never appears, then asserts exit still returns 0; the zero-stderr half counts only if a perturbation that logs there demonstrably produces stderr",
        },
        {
          criterion:
            "A partialResultToken that is not a valid ProgressToken is treated as absent, with a diagnosable trace",
          verification:
            'A request sends partialResultToken as null; assert the client receives every item the handler produced in one aggregated response and that stderr names the invalid token, while the valid falsy tokens 0 and "" still stream',
        },
        {
          criterion:
            "An unknown method after initialize still receives -32601 MethodNotFound, not -32002",
          verification:
            "Test sends an unregistered method after initialize and asserts -32601; a gate answering -32002 for everything unregistered reddens it",
        },
      ],
      status: "ready",
      notes: [
        "ORGANISING PRINCIPLE: diagnosability is proportional to harm. An invalid token loses user items, so it reports; a post-shutdown notification changes nothing observable, so it stays silent like PBI-2's unopened URI. The two rulings are not exceptions to each other.",
        "Remedy chosen at refinement: normalise-and-report. -32602 would cost an editor user every completion for their client's serialisation quirk; normalising silently is the invisible-client-bug failure mode. The trace must NOT be per request -- once per session is enough, and flooding an LSP log makes it useless for everything else.",
        "Validate partialResultToken ONLY. A seam with one call site is a framework justified by one user, which PBI-3 rejected and PBI-1 withdrew. The STORY is protocol-violation handling; the IMPLEMENTATION is three concrete cases and no framework.",
        'The falsy-valid-token guard is a CRITERION, not a note: ProgressToken is integer | string, so 0 and "" are valid and falsy, and `if (!token)` fixes the null case while breaking legitimate clients. Only an assertion catches that.',
        "If the empty string does not survive connection.sendProgress, the binding half of criterion 3 is 0 alone, which still defeats a truthiness fix. DISTINGUISH THE FAILURE MODE: throwing is covered by the handler-failure path, but silently DROPPING is the same silent-item-loss defect as the null token and takes the same normalise-and-report remedy.",
        "The pre-initialize gate must not swallow -32601: an unknown method after initialize must still get MethodNotFound, not ServerNotInitialized. Nothing currently asserts -32601, so a green suite would not show that regression.",
        "Boundary closed by decision, not omission: unknown methods already get -32601 from vscode-jsonrpc, and malformed positions belong to the config author's handler, which owns the position math.",
        'CONFIRM EMPIRICALLY before treating the criteria as binding: that `exit` is the correct notification carve-out before initialize in the LSP version targeted, and that 0 and "" survive connection.sendProgress. Both are cheap probes and both would ship a wrong criterion if assumed.',
      ],
    },
    {
      id: "PBI-11",
      story: {
        role: "config author",
        capability: "have their handler's cleanup run when a request is abandoned",
        benefit:
          "resources a streaming handler holds are released instead of leaking on every superseded keystroke",
      },
      acceptance_criteria: [
        {
          criterion:
            "A cancelled completion closes the generator, so a finally block in the handler runs",
          verification:
            "A fixture generator records in its finally block; cancel mid-stream and assert the record appears, and that it does not appear when the generator is left suspended",
        },
      ],
      status: "draft",
      notes: [
        "src/methods.ts returns out of the driving loop on abort without calling chunks.return(), so the generator stays suspended at its yield. A manual next() loop does not close an iterator the way for await...of does.",
        "Completion is the MOST-CANCELLED request in LSP -- every keystroke supersedes the previous one -- so an unclosed generator leaks on the hottest path in the protocol, and the config author most likely to hit it is exactly the one streaming was built for, holding a database handle or HTTP stream across yields.",
        "This is when examples/tsudoi.config.ts should gain cancellation coverage: a try/finally in its generator is exemplary code a config author should see, unlike making the example artificially slow, which would be changing the artifact for test convenience.",
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
      number: 6,
      pbi_id: "PBI-5",
      goal: "Make slow sources safe as well as first-class -- when the client cancels, context.signal aborts and a config author's handler can stop -- so the streaming API built last sprint never leaves abandoned work running.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 7b6e133, 5cba2c2, 7481a22, 26e12a9, 81983b0, 7327cf7, 5913ad9, 25302fc across 8 subtasks, plus a85ba96 and 71afcbb closing gaps. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "SHIPPING-GRADE HOLE the plan could not have known about, found by READING THE LIBRARY rather than by timing: vscode-jsonrpc's handleRequest calls cancellationSource.cancel() BEFORE ever reading .token. With _token unmaterialised, cancel() installs CancellationToken.Cancelled, whose onCancellationRequested is Event.None -- returns a disposable and NEVER invokes the callback. A subscribe-only bridge therefore never aborts for a client that cancels before dispatch, and the settle-time check then reads aborted === false and puts the handler result on the wire. Fixed by reading isCancellationRequested BEFORE subscribing. A source-ordering argument, not a timeout, which could not distinguish never-fires from fires-late.",
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
    number: 7,
    pbi_id: "PBI-10",
    goal: "Make tsudoi safe to hand to a stranger -- when a client sends what the specification forbids, it gets an error or a correct fallback with a trace, never silently fewer items than the handler produced.",
    status: "in_progress",
    subtasks: [
      {
        test: "BORN GREEN. `exit` as the very first message, no initialize: exits 1 with zero stdout bytes, both runtimes, within an explicit timeout so a hang fails as a timeout rather than stalling. PERTURBATION: add a pre-initialize gate that drops ALL notifications including exit; this MUST redden as a timeout. It exists solely to be the thing that objects when the gate lands -- without it the gate can hang the process with a fully green suite.",
        implementation: "None -- measured working today on both runtimes.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "adcff14",
            message: "test(protocol): pin that exit before initialize exits 1 rather than hanging",
            phase: "green",
          },
        ],
        notes: [
          "Born green as planned. PERTURBATION (gate dropping all pre-initialize notifications, exit included) flipped `waitForExit() === 1` on BOTH runtimes as a 4000ms timeout -- the named target, and the first assertion in the test.",
        ],
      },
      {
        test: "BORN GREEN. After a successful initialize, an unregistered method is answered -32601 and a subsequent hover is answered normally. PERTURBATION: make the gate answer -32002 for any method tsudoi did not register; this MUST redden to -32002 while the pre-initialize subtask stays green. Nothing asserts -32601 today, so this regression is currently invisible.",
        implementation: "None -- vscode-jsonrpc already does this.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "8e71fcc",
            message: "test(protocol): pin -32601 for an unregistered method after initialize",
            phase: "green",
          },
        ],
        notes: [
          "Born green as planned. PERTURBATION (star request handler throwing ServerNotInitialized) flipped `error.code === -32601` to -32002 on both runtimes and NOTHING ELSE in the 105-test suite -- so every registered handler still wins over the star handler, which is the follow-on-hover half.",
        ],
      },
      {
        test: "EXPECTED RED. hover before initialize answers -32002; initialize then still succeeds and hover works.",
        implementation:
          "Gate ONLY the handlers tsudoi registered, not the dispatch as a whole -- that is what leaves unknown methods falling through to -32601, satisfying the guard by construction rather than by care. Use ErrorCodes.ServerNotInitialized, never a literal.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "eb616dd",
            message: "feat(lifecycle): answer -32002 for a request arriving before initialize",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned, and for the RIGHT reason: pre-fix the server answered hover `null` -- the plausible lie, not an error.",
          "PERTURBATION (gate applied to initialize too, carve-out removed) flipped `serverInfo.name === 'tsudoi'` while the EARLIER `-32002` assertion stayed green -- the target, not an earlier one. Collateral: 72 of 107 suite failures, everything that initializes. The exit-first guard stayed green.",
        ],
      },
      {
        test: "EXPECTED RED. hover after shutdown answers -32600; exit afterwards still returns 0.",
        implementation:
          "Second branch on the same lifecycle state. Shares the SEAM with the previous subtask but not the implementation moment: two states, two codes, two branches.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "e50ecc2",
            message: "feat(lifecycle): answer -32600 for a request arriving after shutdown",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned: pre-fix, hover after shutdown answered a REAL Hover, the document still being open.",
          "THREE perturbations, each at its own target. (a) not-initialized branch deleted -> flips subtask 3's -32002 ONLY, -32600 stays green. (b) the shutdown branch's CODE swapped to ServerNotInitialized -> flips -32600 ONLY, subtask 3's -32002 stays green; a code swap rather than a branch deletion, so it defends `two codes` and not merely error-versus-success. (c) exit dropped once hasShutdown -> flips `waitForExit() === 0` as a 4000ms timeout on both runtimes, with the earlier -32600 assertion still green.",
        ],
      },
      {
        test: "MIXED -- `the document never appears` EXPECTED RED (didOpen after shutdown is processed today); `zero stderr` BORN GREEN. didOpen after shutdown leaves the document absent and produces zero stderr; exit still returns 0. PAIRED POSITIVE CONTROL, permanent in the suite: the same stderr measurement, in a session where a notification handler does throw, observes a non-empty `tsudoi:` line. PERTURBATION for the zero-stderr half: log the dropped notification; that assertion MUST redden while `the document never appears` stays green.",
        implementation:
          "Drop notifications once shut down, silently -- the same principle as PBI-2's unopened URI, which changes nothing observable and so stays silent.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "63a87e4",
            message: "refactor(test): share the snapshot reader between test files",
            phase: "refactoring",
          },
          {
            hash: "adc95ef",
            message: "feat(lifecycle): drop a notification that arrives outside the serving window",
            phase: "green",
          },
        ],
        notes: [
          "SPLIT INTO TWO TESTS rather than the planned one, so each perturbation flips exactly one sub-claim: bundled, whichever assertion ran first would mask the other. `zero stderr` came out BORN GREEN as planned; the absence half is measured by tsudoiLines(), the SAME function the paired positive control uses on a session whose didOpen handler really throws.",
          "PERTURBATIONS. (a) post-shutdown drop removed -> flips the document-absent test ONLY; the silence test stayed green. (b) the dropped notification logged -> flips `tsudoiLines(quiet) === []` while document-absent stayed GREEN, so the zero-stderr half counts. (c) pre-initialize drop removed -> flips the pre-initialize test ONLY.",
          "SEVENTH NAMED TARGET, beyond the PO's six: pre-initialize notification dropping is LSP behaviour with no acceptance criterion, so it got its own permanent test and its own perturbation (c) rather than shipping unproven. It is also what makes subtask 1's exit carve-out load-bearing.",
        ],
      },
      {
        test: "EXPECTED RED. A completion with partialResultToken: null produces ONE aggregated response containing every yielded item plus the returned items, and ZERO $/progress -- with the paired positive control that the same counter records progress in a valid-token session.",
        implementation:
          "Validate partialResultToken ONLY: one call site, no framework. Treat an invalid value as absent and take the existing aggregation path. Trace per request for now; the next subtask fixes the frequency.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "4b70591",
            message: "feat(completion): treat an invalid partialResultToken as absent, and say so",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned, at the aggregation assertion. The response is asserted with toEqual against the full three-item array -- every field of every item, in order -- so the right NUMBER of wrong items cannot pass; no length-only assertion exists on this path.",
          "NON-ASCII (standing item 3): the trace is asserted to name a `{ id: 'トークン' }` token verbatim. PERTURBATION (JSON.stringify -> String) flipped that test on both runtimes -- `[object Object]` names nothing a config author could act on. The zero-$/progress absence carries its permanent pair: the same progressCount on a valid-token session, asserted to be 2.",
        ],
      },
      {
        test: "EXPECTED RED. Two completion requests with null tokens in one session produce EXACTLY ONE stderr trace naming the invalid token; both responses still aggregate. Assert the prefix and the COUNT, not the message body.",
        implementation:
          "Evolve the per-request write to a session-scoped flag. Kept separate from the previous subtask deliberately -- folding it in would have made this born green and the RED claim fiction.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "0c804b9",
            message:
              "feat(completion): report an invalid token once per session, not once per request",
            phase: "green",
          },
        ],
        notes: [
          "HONESTLY RED, which the fake-it-then-evolve split is what bought: 2 traces observed where 1 was required. Subtask 6 asserts the trace with toContain and never a count, so this claim was genuinely unmet before this commit.",
          "PERTURBATION (the once-per-session guard removed, so the trace is emitted per request) flipped `traces.toHaveLength(1)` on both runtimes, with BOTH aggregation assertions -- which run first -- still green. The frequency is the only requirement in this sprint stated as a value constraint rather than a mechanism.",
        ],
      },
      {
        test: "BORN GREEN. Completion with partialResultToken 0 and with the empty string each produce $/progress per yield and the streaming response shape. PERTURBATION -- THE WHOLE POINT OF THE CRITERION: rewrite the validation as `if (!token)`. BOTH cases MUST redden while the null case stays green. Measured: both values survive sendProgress on both runtimes, so this asserts something achievable.",
        implementation: "None expected, if the validation is a real ProgressToken type check.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "581a422",
            message: 'test(completion): pin that the falsy but valid tokens 0 and "" still stream',
            phase: "green",
          },
        ],
        notes: [
          'Born green as planned. THE PAIR, run as one perturbation (`if (isProgressToken(requested))` rewritten to `if (requested)`): the 0 test RED and the "" test RED on both runtimes, while the null test and the once-per-session trace test BOTH stayed GREEN. Either half alone would prove nothing.',
          "Collateral worth recording: the same perturbation also reddened the non-ASCII object-token test, since a truthiness test admits `{ id: ... }` as a token and streams under it. Further evidence that truthiness is the wrong question.",
        ],
      },
      {
        test: "N/A (structural) -- suite stays green.",
        implementation:
          "hasShutdown is a loose flag in src/server.ts and this sprint adds an initialized flag and two guards. Consolidate into one named lifecycle state, with explicit === undefined comparisons throughout and no truthiness tests anywhere near tokens or ids -- the bug this PBI exists to fix must not be reintroduced by the fix.",
        type: "structural",
        status: "pending",
        commits: [],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "PROBE 2 SHARPENS THE HARM MODEL: 0, the empty string AND null all survive connection.sendProgress on both runtimes. So today's pre-fix behaviour is not `streaming fails` -- it is SILENT MISDELIVERY, items emitted to a `$/progress` addressed to null that no client can correlate. Measured, not assumed, and it makes criterion 3 genuinely RED today.",
      "PROBE 1 with its limit stated: vscode-languageserver-protocol@3.18.2 (LSP 3.17); ErrorCodes.ServerNotInitialized is a real constant. Bare `exit` with no initialize already exits 1 with empty stdout on both runtimes, and NO test sends it -- so the carve-out is confirmed NECESSARY, since a gate dropping all pre-initialize notifications turns a measured exit=1 into a hang with nothing objecting. The Developer verified the version, the constant and the behaviour, but NOT the specification prose -- no spec text ships in the package. That sentence is a human-side check.",
      "The two opening subtasks are born-green REGRESSION GUARDS that exist to object when the gate lands. Ordering them first is the point: they must exist before the change they guard against.",
      "PO checklist, per-sprint additions: (1) ONE PERTURBATION PER SUB-CLAIM, each naming its target assertion -- criteria 1 and 2 bundle three claims each, and a single gate-widening perturbation flips whichever assertion runs first and leaves the rest undefended, which is precisely the Sprint 6 failure; six named targets, not two; (2) the zero-stderr half counts only if a perturbation that logs there demonstrably produces stderr; (3) the falsy-token discriminator as a PAIR -- implement as `if (!token)` and confirm the 0 test reddens WHILE the null test stays green, since either half alone proves nothing; (4) the once-per-session trace pinned, perturbed by emitting per request -- the only item guarding a requirement stated as a value constraint rather than a mechanism; (5) the normalised response asserted ITEM BY ITEM, not by count, since a count passes if the right number of wrong items arrives.",
    ],
  },
  retrospectives: [
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
