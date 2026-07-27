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
      id: "PBI-5",
      story: {
        role: "config author",
        capability: "abandon work for a request the client has cancelled",
        benefit: "their handlers stop burning time on results nobody will read",
      },
      acceptance_criteria: [
        {
          criterion:
            "$/cancelRequest aborts context.signal for the targeted request and for no other in flight",
          verification:
            "Two concurrent requests with distinguishable fixtures; cancel one. The targeted fixture reports abort on stderr; the other reports it was never aborted and is answered normally",
        },
        {
          criterion:
            "A cancelled request is answered -32800 RequestCancelled, for hover and completion alike",
          verification:
            "Cancel each; assert error.code === -32800 and that a subsequent request of the same method is answered normally",
        },
        {
          criterion: "A handler that never reads its signal still has its result suppressed",
          verification:
            "A fixture that never references context.signal and runs to completion; assert the response is -32800 and the handler's value appears nowhere on stdout",
        },
        {
          criterion:
            "Cancelling a streaming completion leaves already-sent $/progress on stdout and sends none after the abort",
          verification:
            "Gate the handler after one chunk, cancel, release; assert exactly one $/progress, then -32800, and zero non-protocol bytes on stdout",
        },
        {
          criterion: "A cancelled handler's throw is not reported as a handler failure",
          verification:
            "A fixture that throws once aborted; assert -32800 and NO `tsudoi: <method> handler failed:` line on stderr, while a non-cancelled throwing handler still produces one",
        },
        {
          criterion: "$/cancelRequest for an unknown or already-settled id is ignored",
          verification:
            "Cancel an id never issued and an id already answered; assert no error response, no stderr failure line, and a subsequent request answered normally",
        },
      ],
      status: "ready",
      notes: [
        "MEASURED on both runtimes: vscode-jsonrpc already plumbs $/cancelRequest to a CancellationToken on onRequest handlers, so tsudoi BRIDGES rather than tracking the notification itself -- tracking it would mean racing a handler the library already consumes. But the library synthesises NO -32800 and does not suppress an ignoring handler's result; both are tsudoi's to build.",
        "A cancelled request answers -32800, discarding whatever the handler produced. LSP 3.17 permits both this and a normal result, so it is a CHOICE: the client has already discarded the request's context, and delivering a stale result invites the desync PBI-4's criterion 6 exists to prevent.",
        "A cancelled handler's throw is NOT reported: an aborted fetch rejects by design, and writing a failure line plus a stack for every cancellation would train config authors to ignore the one stderr channel that means something.",
        "Observability seam: the fixture registers signal.addEventListener('abort', ...) and writes a marker to stderr -- a standard Web API, Bun-free and Deno-safe.",
        "ESCALATED, not decided: letting a config author DECLINE cancellation (LSP allows returning a normal result anyway) needs a TsudoiConfig surface to declare it -- a config-schema change, the same reasoning that kept triggerCharacters out of PBI-4. Its own PBI if anyone wants it.",
      ],
    },
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
            "Test sends hover before initialize; assert the error code and that the server still initializes afterwards",
        },
        {
          criterion: "A request arriving after shutdown is answered -32600 InvalidRequest",
          verification:
            "Test sends hover after shutdown; assert the error code and that exit still returns 0",
        },
        {
          criterion:
            "A partialResultToken that is not a valid ProgressToken does not cause silent item loss",
          verification:
            "A request sends partialResultToken as null; assert the client receives every item the handler produced, none stranded under an uncorrelatable token",
        },
      ],
      status: "draft",
      notes: [
        "Ordered after PBI-5: no conforming client triggers these, so they rank below the remaining PoC methods, but they are squarely inside success metric #2 -- answering a hover before initialize is not responding per the specification.",
        "MEASURED in Sprint 5: partialResultToken sent as null takes the streaming path (src/methods.ts branches on token === undefined), so items are streamed under an uncorrelatable token and the response carries only the return value. No error, no stderr, two items silently gone -- the worst failure class in this project.",
        "PO overruled the Developer's protocol reasoning while endorsing their process: ProgressToken is integer | string, so null is a MALFORMED value in a field that exists, not a token that is present. Normalising it is input validation, not the second aggregation trigger PBI-4 collapsed -- that trigger was a client capability with NO wire representation at all, which is why it collapsed.",
        'The third criterion is worded around VALIDITY, not around null, deliberately: 0 and "" are valid ProgressTokens while being falsy, so a fix written as `if (!token)` would break legitimate clients while fixing the null case. Refinement must not produce a truthiness check.',
        "The criterion states the value requirement, not the mechanism. Refinement settles normalise-to-absent versus -32602 versus normalise-plus-stderr.",
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
        "PBI-10 must complete first: it fixes a defect that silently loses user items, and these two are what make the package installable.",
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
        "PBI-10 must complete first: it fixes a defect that silently loses user items, and these two are what make the package installable.",
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
        "Accumulated test-fidelity debt, four items: (a) test/helpers/spawn.ts keeps the per-chunk decode bug fixed in lsp.ts, so no test can assert a non-ASCII config-failure message -- narrow, since the CLI writes stderr directly and nothing in src/ decodes it; (b) the 360KB Japanese test depends on OS pipe buffer sizes and would degrade to passing trivially on a platform with larger ones; (c) the example config's `if (!document) return null` branch is untested; (d) the completion arrivals assertion hardcodes response ids and demands the whole array, so a vscode-jsonrpc bump emitting window/logMessage breaks it at the array shape rather than the ordering claim it defends.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
    {
      number: 5,
      pbi_id: "PBI-4",
      goal: "Make yield and return the whole of a config author's streaming API -- tsudoi decides whether that reaches the client as $/progress chunks or one aggregated response -- so the most precisely specified thing in the brief is the thing they never have to think about.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 12fda1b, 2c4294b, e82e7ae, 1d0c0f2, 1a72d93, 38fe70b, e8af57a, 095cdf3 across 8 subtasks. Per-subtask records and 10 perturbation notes compacted here; git retains them.",
        "MEASURED, outside the six criteria and deliberately NOT fixed: a client sending `partialResultToken: null` instead of omitting it is streamed to under token null and then receives only the returned array, silently losing every yielded item. Both runtimes; the server does not fail and stdout stays clean. The remedy is one operator, but `null` is a token PRESENT, so treating it as absent invents the second aggregation trigger PBI-4's notes exist to collapse -- and shipping it untested would be an unperturbed branch. PO's call, not the executor's.",
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
    number: 6,
    pbi_id: "PBI-5",
    goal: "Make slow sources safe as well as first-class -- when the client cancels, context.signal aborts and a config author's handler can stop -- so the streaming API built last sprint never leaves abandoned work running.",
    status: "review",
    subtasks: [
      {
        test: "N/A (structural) -- BORN GREEN by construction. Perturbation: make cancel(id) send nothing; subtask 2 MUST fail. Without it every cancellation assertion this sprint is measuring an unsent notification.",
        implementation:
          "LspSession: expose an in-flight request's id and add cancel(id). Settle every pending promise on teardown -- Sprint 5's killed-child hazard applies directly here.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "7b6e133",
            message: "test(lsp): let a session cancel a request and read raw stdout",
            phase: "green",
          },
        ],
        notes: [
          "Also added, both needed by later subtasks: waitForStderr (rejects quoting stderr, never hangs) and a raw `stdout` getter decoded once over the whole buffer, which is the only way to assert a suppressed value never left.",
          "MEASURED, and it forced a helper nobody planned: vscode-jsonrpc cancels the token source BEFORE the handler runs when the cancel is already queued, and CancellationTokenSource.cancel() on an unmaterialised token installs CancellationToken.Cancelled, whose onCancellationRequested is Event.None -- it NEVER fires. A subscribe-only bridge sees nothing on that path. issueThenCancel writes both frames in ONE stdin write so the path is reachable deterministically.",
          "PERTURBATION result recorded on subtask 2, where the test it defends lives.",
        ],
      },
      {
        test: "EXPECTED RED. Two concurrent requests; cancelling one flips only its fixture's abort marker on stderr, and the other completes normally.",
        implementation:
          "Call controller.abort() from the CancellationToken vscode-jsonrpc already supplies. Bridge, do not track -- our own handler would race one the library consumes.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "5cba2c2",
            message: "feat(cancel): abort a request's signal when the client cancels it",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned, both runtimes. A second test came with it: a cancel arriving BEFORE dispatch, which a subscribe-only bridge cannot see at all.",
          "PERTURBATION `unwire the subscription` (cancellation.onCancellationRequested removed): reddens `aborted line-1 appears` on both runtimes; the pre-dispatch test STAYS GREEN, because the seed alone answers that path.",
          "PERTURBATION `remove the seed` (the isCancellationRequested read): reddens `entered line-3 aborted=true` on both runtimes; isolation stays green. The two halves of the bridge are independently defended.",
          "PERTURBATION `abort every signal unconditionally`: reddens EARLIER than the isolation claim, at `entered line-1 aborted=false` -- so it defends the transition's false half and NOT isolation.",
          "PERTURBATION `one shared AbortController`, added because of that: reddens exactly at `aborted line-2 absent`, the isolation headline. This is the shape the PO caught before refinement.",
          "The pre-dispatch path is pinned for COMPLETION too (71afcbb), where a chunk is at stake: -32800 with zero $/progress. Removing the seed reddens it at `error.code` on both runtimes, alongside the hover one.",
          "PERTURBATION for subtask 1 (`cancel(id) sends nothing`): reddens `aborted line-1 appears` on both runtimes -- every cancellation assertion this sprint would otherwise be measuring an unsent notification.",
        ],
      },
      {
        test: "EXPECTED RED. A cancelled hover and a cancelled completion each answer error.code === -32800; a subsequent request of the same method is answered normally.",
        implementation:
          "Respond ErrorCodes.RequestCancelled (the constant, never a literal) instead of the handler's value when the signal is aborted at settle time.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "7481a22",
            message: "feat(cancel): answer a cancelled request -32800 RequestCancelled",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned, at `error.code === -32800` for hover and completion alike on both runtimes. Src uses LSPErrorCodes.RequestCancelled; the TEST spells -32800 out, so swapping the constant for another of the library's codes still reddens.",
          "PERTURBATION `remove the settle-time abort check` (both call sites): reddens both -32800 tests at `error.code`, all four runtime combinations. This is the SHARED moment subtask 4 declares.",
          "Thrown, not returned: vscode-jsonrpc replies a thrown ResponseError verbatim, so no error shape enters a handler's return type.",
        ],
      },
      {
        test: "BORN GREEN -- SHARES ONE IMPLEMENTATION MOMENT with the previous subtask. A fixture never referencing context.signal, cancelled mid-flight, answers -32800 and its returned label appears nowhere on stdout.",
        implementation:
          "None expected -- same suppression branch. The only perturbation that reddens this also reddens the previous subtask, so it defends the SHARED claim, not this headline. The headline is defended STRUCTURALLY: the fixture never mentions context.signal, so suppressing by asking the handler could not pass.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "26e12a9",
            message: "test(cancel): pin that an ignoring handler's result never reaches stdout",
            phase: "green",
          },
        ],
        notes: [
          "BORN GREEN as declared: no src change. The shared perturbation reddens it at `error.code === -32800`, which is subtask 3's headline and EARLIER than `nowhere on stdout` -- exactly what the plan predicted.",
          "`nowhere on stdout` gets a POSITIVE CONTROL instead of a perturbation: a second session runs the same fixture uncancelled and asserts the label IS on stdout, so an absence cannot pass because the accumulator is broken.",
          "The label is mixed script (`破棄される候補 / discarded-candidate`) because a raw-substring search for Japanese alone would be defeated by \\uXXXX escaping. MEASURED: the control's stdout carries the Japanese unescaped on both runtimes, so both halves are real checks.",
        ],
      },
      {
        test: "MIXED -- `no further chunks` and -32800 EXPECTED RED; `the already-sent chunk remains` BORN GREEN (measured: nothing retracts it). Gate after one chunk, cancel, release; assert exactly one $/progress, then -32800, and unframedStdoutBytes === 0.",
        implementation:
          "Check the signal before each sendProgress and stop driving the generator once aborted. PERTURBATION: remove that check; exactly-one-$/progress MUST redden while -32800 stays green.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "81983b0",
            message: "feat(cancel): stop streaming a completion the client cancelled",
            phase: "green",
          },
        ],
        notes: [
          "MIXED as declared: -32800 passed on first run, the arrivals assertion reddened with the second chunk (取消後) present.",
          "PERTURBATION `remove the pre-send check`: reddens ONLY this test, at the arrivals assertion, both runtimes; -32800 and every other cancellation test stay green.",
          "The check sits BETWEEN pulling a chunk and sending it, not at the top of the loop: the abort lands while next() is parked, so a top-of-loop check has already passed and that chunk still goes out. Placement is load-bearing, and the test is what proves it.",
          "CONSEQUENCE, accepted and not built: an abandoned generator is never resumed, so a config author's `finally` does not run on cancellation. Outside PBI-5's criteria; needs its own decision.",
        ],
      },
      {
        test: "EXPECTED RED. A fixture throwing once aborted answers -32800 with NO `tsudoi: <method> handler failed:` line on stderr, while the existing non-cancelled throwing fixture still produces one.",
        implementation:
          "Skip reportHandlerFailure when the signal is aborted; unchanged otherwise. Assert the stderr PREFIX, never the stack body.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "7327cf7",
            message: "feat(cancel): stop reporting a cancelled handler's throw as a failure",
            phase: "green",
          },
        ],
        notes: [
          "RED as planned, at -32800 for a cancelled hover that threw (it answered -32603, the reported path). One fixture supplies BOTH methods, so the streaming path -- where the throw comes out of a generator -- is asserted too rather than assumed to follow.",
          "PERTURBATION `remove the abort branch from the hover catch`: reddens at the EARLIER -32800 assertion, so it does not defend the headline.",
          "PERTURBATION `write a failure line anyway while still answering -32800`, added for that reason: reddens exactly at `stderr has no handler failed:`, both runtimes. The headline is defended on its own.",
          "The contrast lives in the SAME test against a second session: a server that reported nothing at all would satisfy the absence and fail `an uncancelled throw still reports`.",
        ],
      },
      {
        test: "BORN GREEN. Cancel an id never issued and an id already answered; assert no error response, no stderr failure line, and a subsequent request answered normally. Perturbation: add a tsudoi-side registry that looks the id up and throws on a miss; this MUST redden while the bridge and -32800 subtasks stay green. It is also what would catch a regression if anyone later decides to track cancellation ourselves.",
        implementation: "Expected none -- the library consumes $/cancelRequest itself.",
        type: "behavioral",
        status: "completed",
        commits: [
          {
            hash: "5913ad9",
            message: "test(cancel): pin that an unknown or already-answered id is ignored",
            phase: "green",
          },
        ],
        notes: [
          "BORN GREEN as planned. Ids come from the session rather than being hardcoded, so a shifted response id cannot break this at the wrong claim.",
          "The PLANNED perturbation is UNBUILDABLE, which is a finding rather than an excuse: vscode-jsonrpc's handleNotification returns early for $/cancelRequest before consulting any registered handler, AND a request handler is never passed its own id. A tsudoi-side registry has nothing to hook and nothing to key on. That is the empirical reason `bridge, do not track` is the only option, not a preference.",
          "SUBSTITUTE perturbation `cancel a LIVE id instead of a settled one`: reddens exactly at `no further message arrived`, both runtimes. It proves the assertion can fail and that cancel(id) reaches the server; it does NOT prove tsudoi preserves the ignore path, because tsudoi has no code on that path.",
        ],
      },
      {
        test: "N/A (structural) -- suite stays green, unchanged.",
        implementation:
          "Extract the per-request cancellation concern into one named place. Keep the hover and completion CALLS separate -- a generator cannot share the call.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "25302fc",
            message: "refactor(methods): put the whole cancellation concern in one named place",
            phase: "refactoring",
          },
        ],
        notes: [
          "Suite unchanged and green, 99 tests. answerUnlessCancelled(method, signal, produce) holds BOTH halves -- suppression and non-reporting -- so they cannot drift apart between the two methods; the calls stay separate, as `produce`.",
          "It also let the completion loop go back to returning instead of assigning-and-breaking, which subtask 5 had forced.",
        ],
      },
    ],
    impediments: [],
    decisions: [
      "MEASURED before deciding, and it overturned an option: vscode-jsonrpc plumbs $/cancelRequest to a CancellationToken on both runtimes, so tsudoi bridges rather than tracks. But it synthesises no -32800 and lets an ignoring handler's result reach the wire -- both are tsudoi's to build.",
      "PO caught a green-but-broken shape BEFORE refinement: the original single criterion is satisfied completely by one SHARED AbortController, as long as only one request is in flight. Signal isolation under concurrency and settlement despite an ignoring handler were added as requirements, not suggestions.",
      "Explicit === undefined comparisons throughout: 0 and the empty string are falsy but valid, so a check written as `if (!requestId)` would mishandle id 0. PBI-10 exists to fix that class; this sprint must not add new instances of it.",
      "MEASURED at HEAD, after the extraction: removing the settle-time check reddens the four -32800 tests but NOT the cancelled-throw test, which the catch-side branch answers. The two branches of answerUnlessCancelled are independently defended.",
      "PO checklist, per-sprint additions (standing list applies unchanged): (1) abort proven by TRANSITION not state -- aborted === false while running, then cancel, then true; asserting only the final state passes if the signal aborted for any unrelated reason; (2) signal isolation under concurrency, the discriminator a shared controller fails; (3) cancellation mid-stream stops further $/progress, which is where the value actually lands since it is PBI-4's work cancellation exists to bound; (4) the response shape a cancelled request produces is PINNED by a test -- the PO does not choose the mechanism, only that it cannot be left implicit and drift; (5) two labelled perturbations -- unwire the cancel registration and name the test that reddens, and abort every signal unconditionally and confirm the isolation test reddens.",
    ],
  },
  retrospectives: [
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
