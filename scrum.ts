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
      id: "PBI-3",
      story: {
        role: "editor user",
        capability: "receive hover information for the symbol under the cursor",
        benefit: "they can read documentation without leaving the editor",
      },
      acceptance_criteria: [
        {
          criterion:
            "hoverProvider is advertised when the config supplies a hover handler, and not when it does not",
          verification:
            "Two configs, one with the handler and one without; assert InitializeResult advertises hoverProvider for the first and omits it for the second",
        },
        {
          criterion: "The hover handler's return value reaches the client unchanged",
          verification: "A test config returns a fixed Hover; assert the response equals it",
        },
        {
          criterion: "A hover request with no handler configured answers null rather than an error",
          verification:
            "A config omitting the handler is driven with a hover request anyway; assert the result is null and a subsequent request is answered normally",
        },
        {
          criterion: "A handler that throws or rejects does not take the server down",
          verification:
            "A config whose handler throws, and one whose handler rejects; each yields an error response to that request, a diagnosable message on stderr, stdout carrying only the JSON-RPC response, and a subsequent hover answered normally",
        },
      ],
      status: "ready",
      notes: [
        "Conditional advertisement is per-method, not a generic derivation framework -- PBI-4 makes the same call for completionProvider. This is the decision PBI-1 deferred, landing where round 1 said it would.",
        "The third criterion covers non-conforming clients only: a conforming client never sends hover when hoverProvider is unadvertised. It survives because a server must not fail because a client misbehaves.",
        "Position math stays the config author's job -- params.position plus getText(). This is the PBI that decides whether TextDocument needs positionAt/offsetAt (PBI-2 note 3).",
        "Widen test/lifecycle.test.ts's capabilities assertion again, do not delete it.",
        "Measured in Sprint 3, addressed to the fourth criterion: createProtocolConnection is passed no logger, so vscode-jsonrpc defaults to NullLogger and a throwing handler is swallowed with no stderr and no effect on the exit path. The `diagnosable message on stderr` therefore needs a logger passed in (stderr only -- stdout purity), and that logger is also what would let Sprint 3's unopened-URI live test tell `ignored` from `threw`.",
        "That finding cannot be closed by assumption: vscode-jsonrpc turns a REQUEST-handler throw into an error response, while a NOTIFICATION-handler throw falls to the logger and is swallowed. Satisfying criterion 4 through the request path alone would leave the notification path exactly as swallowed as today. Rule explicitly on whether a notification handler's throw is surfaced, and pin it with a live test that tells ignore-by-design from throw-and-swallow. (PO states the asymmetry as the believed mechanism, not a measured one -- confirm it first.)",
      ],
    },
    {
      id: "PBI-4",
      story: {
        role: "editor user",
        capability: "receive completion candidates incrementally",
        benefit: "slow sources do not block the first candidates from appearing",
      },
      acceptance_criteria: [
        {
          criterion:
            "completionProvider is advertised when the config supplies a completion handler, and not when it does not",
          verification:
            "Two configs, one with the handler and one without; assert InitializeResult advertises completionProvider for the first and omits it for the second",
        },
        {
          criterion:
            "Each yield reaches the client as exactly one $/progress, in order, while the handler is still running",
          verification:
            "A handler yields a distinguishable chunk, blocks on a gate the test releases, then yields a second; assert the first $/progress arrives while the handler is still blocked, then the second after release, one per yield, matching content and order",
        },
        {
          criterion:
            "With a partialResultToken the response result is the returned array alone, not a repeat of the yields",
          verification:
            "A handler yields two chunks and returns a third; assert the response result equals the third only, so a client concatenating progress plus response sees each item exactly once",
        },
        {
          criterion:
            "Without a partialResultToken the yields and the return are aggregated into one response, and no $/progress is sent",
          verification:
            "The same handler driven without the token; assert a single response containing every yielded item plus the returned items, and zero $/progress notifications",
        },
        {
          criterion:
            "A null return yields [] when partial results were already sent, and null when none were",
          verification:
            "Two configs, one yielding then returning null and one returning null immediately; assert [] and null respectively",
        },
        {
          criterion: "A handler that throws after yielding does not take the server down",
          verification:
            "A handler yields once then throws; assert the already-sent $/progress remains on stdout and is followed by an error response, a diagnosable message on stderr, no non-protocol bytes on stdout, and a subsequent completion answered normally",
        },
      ],
      status: "ready",
      notes: [
        "Aggregation has ONE observable trigger, not two: LSP has no client capability declaring partial-result support -- a client lacking it simply omits partialResultToken -- so the brief's second trigger collapses into the first by protocol design. window.workDoneProgress is not a proxy. This closes the gap flagged at init by decision, not by dropping it.",
        "In streaming mode the response result is the RETURNED array alone, not a concatenation: the yields already went as $/progress. The brief's own rule that a null return after partials produces [] has no reason to exist under the concatenation reading, so this is the reading under which the brief is coherent.",
        "completionProvider is advertised as an empty object. No triggerCharacters: the brief does not ask for them and TsudoiConfig has no surface to declare them; that is a config-schema change and its own PBI.",
        "Widen test/lifecycle.test.ts's capabilities assertion again for completionProvider, do not delete it.",
        "PO: six criteria is deliberate and each closes a distinct green-but-broken path. Do not cut one to make room.",
      ],
    },
    {
      id: "PBI-5",
      story: {
        role: "config author",
        capability: "abandon work for a request the client has cancelled",
        benefit: "their handlers stop burning time on results nobody will read",
      },
      acceptance_criteria: [
        {
          criterion: "$/cancelRequest aborts context.signal for the targeted request",
          verification:
            "A test config awaits the signal; send $/cancelRequest and assert signal.aborted becomes true and the request settles",
        },
      ],
      status: "draft",
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
        "Sprint 2 left the three guard rules pinned across three DIFFERENT incomplete path sets. import/extensions is pinned only at src/ and the two probe paths -- not at test/fixtures/ or examples/, which are exactly the files the cross-runtime suite executes under deno, and extensionless relative imports are the failure that bites there. Correct today by default-deny, and lifecycle.test.ts running examples/ under deno is a live backstop, so this is a missing pin rather than a hole.",
        "test/helpers/spawn.ts has the same per-chunk decode bug fixed in lsp.ts during Sprint 3. Consequence is narrow and was overstated on first reading: the CLI writes stderr directly and nothing in src/ decodes it, so a Japanese config author's error message is NOT mojibake -- what we cannot currently do is write a test asserting a non-ASCII config-failure message.",
        "The 360KB Japanese test's failure mode depends on OS pipe buffer sizes. Deterministic here (3/3 under both runtimes), but on a platform with much larger buffers it degrades to passing trivially rather than failing.",
        "ignorePackages defends npm subpath specifiers ONLY. node:url is unflagged with or without it, so the round-2 perturbation defends the npm half alone and the node: half of PBI-6's criterion was trivially true rather than guarded.",
        "PO calls this the lowest-value item in the backlog and ordered it last, honestly: it pins behaviour already verified by hand and already ruled non-blocking.",
      ],
    },
  ],

  completed: [
    {
      number: 3,
      pbi_id: "PBI-2",
      goal: "Turn documents.get(uri) from a stub into the editor's live buffer -- the first line of the stakeholder's own example config, and the substrate every method after this one answers from.",
      status: "done",
      subtasks: [],
      impediments: [],
      decisions: [
        "Shipped in 81ac35e, aa5b588, 1e434c5, 73b2677, e49cbb6, cc44ffe, 6c9b910, 5ce2823 across 7 subtasks. Per-subtask records compacted here; git retains them.",
        "The mandated perturbation FAILED to work and the cause was measured, not guessed: createProtocolConnection gets no logger, so vscode-jsonrpc falls back to NullLogger and CATCHES a notification-handler throw -- no stderr, no exit-code effect. No live test here distinguishes ignore-by-design from throw-and-swallow. Routed to PBI-3 rather than fixed in place, because a stderr logger belongs to PBI-3 criterion 4.",
        "stdout purity was BROKEN and only a perturbation found it: a stray write from didOpen failed ZERO tests, because an unanchored Content-Length search reads past stray bytes and frames the next message correctly anyway. Now counted by unframedStdoutBytes; the same perturbation fails 6 tests.",
        'The Japanese test found a latent defect in the TEST helper, not the server: per-chunk chunk.toString("utf8") turns any multi-byte character the pipe splits into U+FFFD. Silent at small payloads, deterministic RED at 360KB under both runtimes.',
        "STANDING, endorsed by the PO from inside the work: anything not perturbed in a sprint is assumed unproven. Two of three new assertion mechanisms here asserted nothing until perturbed.",
        "The mutation API stays off DocumentStore: createDocumentStore() returns { documents, open, change, close }, so `documents` keeps exactly the get/values shape the config sees and the Tsudoi interface is unchanged BY CONSTRUCTION rather than by discipline.",
        "Advertise-versus-respond is split across subtasks 1 and 6 -- the split the Developer committed to after the PBI-3 capabilities near-miss. Here it is load-bearing rather than ceremonial: subtask 6 passes without subtask 1, and that combination is the dead-product shape.",
        "PO Review checklist, issued at planning rather than Review so the plan can target it: (1) driven over stdio through the real server, not a directly-constructed store; (2) a document containing Japanese text, end to end, kept permanently -- no test in this suite has ever contained a non-ASCII byte, and the layer expected to break is deliberately not named; (3) didChange proven to REPLACE by a replacement that makes the document SHORTER, asserted by exact equality -- a concatenating store passes any toContain assertion; (4) values() does not leak closed documents -- open two, close one, assert exactly one member; (5) textDocumentSync shown literally, plus a perturbation removing openClose that must name a test going red; (6) the unopened-URI case live; (7) stdout purity across the notification sequence; (8) the capabilities assertion widened, not deleted, and still exact; (9) document behaviour under both runtimes or an explicit statement of why not.",
        "This sprint adds test/fixtures/snapshot-config.ts to a path import/extensions does not currently pin -- the exact gap PBI-9 closes. Known and deliberately not widened here.",
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
    number: 4,
    pbi_id: "PBI-3",
    goal: "Complete the chain from a config author's file to a human's screen: the hover text they write is what an editor shows, with zero lines changed in tsudoi.",
    status: "in_progress",
    subtasks: [
      {
        test: "EXPECTED RED. A live session sends a notification whose handler throws; stderr carries a diagnosable message naming the method, stdout carries no unframed bytes, and shutdown/exit still completes with code 0.",
        implementation:
          "Pass a logger as the third argument to createProtocolConnection in src/server.ts. All four methods write to stderr ONLY -- process.stderr.write, never console.log, which would corrupt the protocol stream. Also closes Sprint 3's leftover: the unopened-URI live test can then tell ignore-by-design from throw-and-swallow.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "d0f172a", message: "feat(server): report failures to stderr", phase: "green" },
        ],
        notes: [],
      },
      {
        test: "EXPECTED RED. A config with a hover handler yields capabilities equal to { textDocumentSync: {...}, hoverProvider: true }; a config without it yields exactly { textDocumentSync: {...} } -- the narrower shape asserted EXACTLY, not merely 'hoverProvider is absent'.",
        implementation:
          "Build capabilities in startServer from config.methods?.['textDocument/hover'] !== undefined. Per-method and explicit, NOT a derivation framework. Widen test/lifecycle.test.ts's assertion a third time rather than deleting it: it drives examples/tsudoi.config.ts, which HAS a hover handler, so it moves to the wider shape while the new no-hover fixture carries the narrower one.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "4a49499", message: "feat(server): advertise hoverProvider", phase: "green" },
        ],
        notes: [],
      },
      {
        test: "EXPECTED RED. A fixture returning a fixed Hover produces a response deep-equal to it, with no transformation of contents or range.",
        implementation:
          "Register HoverRequest UNCONDITIONALLY -- registration and advertisement are independent, and criterion 3 needs the handler present even when unadvertised. Invoke the config handler with a RequestContext of { signal, tsudoi }. For signal, construct a per-request AbortController that is never aborted; wiring it to the connection's CancellationToken is PBI-5 and must not be smuggled in.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "31f169f", message: "feat(server): answer hover requests", phase: "green" },
        ],
        notes: [],
      },
      {
        test: "BORN GREEN. A config omitting the hover handler, driven with a hover request anyway, answers null; a subsequent hover is answered normally.",
        implementation:
          "Expected to need no change if the dispatch reads (await handler?.(context, params)) ?? null. PERTURBATION: gate HoverRequest registration on the handler existing. This subtask MUST fail with a -32601 MethodNotFound instead of null, while the advertisement and pass-through subtasks stay green. This is the exact class that bit Sprint 3's subtask 4 -- a tolerance property whose satisfying path an earlier subtask already wrote.",
        type: "behavioral",
        status: "completed",
        commits: [{ hash: "0cecfec", message: "test(hover): pin the null answer", phase: "green" }],
        notes: [
          "PERTURBATION RUN. Gating HoverRequest registration on the handler existing reddens exactly `a hover request with no handler configured is answered null, twice over` (bun and deno, 2 tests). It flips at the awaited request itself, which rejects with -32601 MethodNotFound before its toBe(null) is reached -- so what is defended is that hover is ANSWERED, and the null-versus-Hover distinction is defended by subtask 3 instead. Advertisement and pass-through stayed green, confirming registration and advertisement are independent. Restored.",
        ],
      },
      {
        test: "MIXED -- error-response and stderr assertions EXPECTED RED, stdout-purity assertion BORN GREEN. One fixture throwing synchronously and one rejecting: each yields an error response, stderr names textDocument/hover, unframedStdoutBytes is 0 across the session, and a subsequent hover is answered normally.",
        implementation:
          "MEASURED: the subtask-1 logger is NOT consulted for request handlers, so it cannot satisfy this. Wrap the config handler invocation in try/catch inside tsudoi's own dispatch: write the diagnosable line to process.stderr, then RETHROW so vscode-jsonrpc emits its -32603. Catching without rethrowing would turn a broken handler into a silent null, which is the failure this criterion exists to prevent. PERTURBATION for the purity half: add console.log('noise') inside the hover dispatch; unframedStdoutBytes === 0 must fail while the other assertions stay green.",
        type: "behavioral",
        status: "completed",
        commits: [
          { hash: "e5c49cc", message: "feat(server): report a failing handler", phase: "green" },
        ],
        notes: [
          'PERTURBATION RUN. console.log("noise") in the hover dispatch reddens `expect(session.unframedStdoutBytes).toBe(0)` in exactly three named tests, bun and deno both (6): `...answered null, twice over`, `a hover handler that throws...`, `a hover handler that rejects...`. The -32603 and stderr assertions stayed green, so purity is what this defends and nothing else. UNDEFENDED: `the hover handler\'s return value reaches the client unchanged` carries no purity assertion and stayed green. Restored. Also measured live before the fix: -32603 arrived with stderr EMPTY, confirming the logger is not consulted for request handlers.',
        ],
      },
      {
        test: "N/A (structural) -- the whole suite stays green, unchanged.",
        implementation:
          "Extract the try/catch-rethrow plus stderr reporting out of the hover registration into a small named helper taking method name, context and handler. PBI-4's completion dispatch needs exactly this. Extracting at one caller is justified only because criterion 4 already fixes the shape -- do not generalise: no method registry, no derivation framework.",
        type: "structural",
        status: "completed",
        commits: [
          {
            hash: "fe8f153",
            message: "refactor(server): name the failure path",
            phase: "refactoring",
          },
        ],
        notes: [],
      },
      {
        test: "EXPECTED RED. The hover response for a known cursor position in a known buffer names the word under that position.",
        implementation:
          "Change examples/tsudoi.config.ts's hover handler to use params.position plus document.getText() -- split on newlines, index the line, extract the word around the character offset. Bun-free (Deno runs it), .ts extensions on relative imports. Existing lifecycle tests keep driving this file and must stay green. This exists to decide positionAt/offsetAt on evidence at PBI-4 rather than on opinion now.",
        type: "behavioral",
        status: "completed",
        commits: [{ hash: "f5c612f", message: "feat(examples): hover the word", phase: "green" }],
        notes: [],
      },
    ],
    impediments: [],
    decisions: [
      "MEASURED, and it overturns what the plan would otherwise have assumed: a logger surfaces NOTIFICATION-handler throws only. A request-handler throw becomes a -32603 response with stderr EMPTY whether or not a logger is passed. Since hover is a request, criterion 4's `diagnosable message on stderr` CANNOT be satisfied by passing a logger -- tsudoi must catch, write its own stderr line, and rethrow.",
      "PO checklist item 1 (a real editor attaching) is FEASIBLE and settled at planning: nvim 0.13 attaches headlessly to `bun run src/cli.ts --config examples/tsudoi.config.ts`, reporting serverInfo tsudoi and capabilities { textDocumentSync: { openClose: true, change: 1 } }. It is therefore a live demonstration item this sprint, not a dropped one.",
      "positionAt/offsetAt deliberately NOT added and not taken to the PO yet: PBI-3 gives exactly one call site, and deciding an API from one call site is deciding from noise. Subtask 7 makes that call site real so PBI-4 inherits evidence -- if completion's author writes the same line-splitting again, that is two independent call sites converging and it becomes its own PBI with a measured justification.",
      "PO checklist, issued at planning: (1) a real editor attaching and displaying hover; (2) driven over stdio with examples/tsudoi.config.ts as the artifact under test, unmodified -- its handler has returned a fixed Hover into a void since Sprint 1 and now answers; (3) hover contents in Japanese, permanent; (4) perturb advertisement to unconditional and name the test that reddens -- the negative half is satisfiable by advertising nothing, which is what the code does today; (5) name the test that reddens when the undefined-handler path stops answering null; (6) criterion 4 on the request path; (7) criterion 4 on the NOTIFICATION path, accepted ONLY if perturbing the store to throw demonstrably produces stderr -- otherwise a zero-stderr assertion passes vacuously; (8) every new assertion mechanism named with the perturbation that flipped it, anything unperturbed reported as unproven; (9) both runtimes and the DoD at HEAD.",
    ],
  },
  retrospectives: [
    {
      sprint: 3,
      improvements: [
        {
          action:
            "Every subtask in a plan must state explicitly whether its test is expected-RED or born-green; silence is not permitted, and born-green subtasks carry their perturbation. Enumerating born-green PATTERNS keeps losing the race -- Sprint 3's subtask 4 was a different pattern (a tolerance property whose satisfying path an earlier subtask already wrote) from the one being scanned for.",
          timing: "immediate",
          status: "active",
          outcome: null,
        },
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
        {
          action:
            "Amendment to the manufactured-RED rule: the perturbation must be confirmed to flip a SPECIFIC NAMED assertion, and if it flips only part of what it was claimed to defend, the undefended part must be stated.",
          timing: "immediate",
          status: "active",
          outcome:
            "Prompted by the round-2 perturbation claiming to defend `node: and npm specifiers stay unflagged` when ignorePackages moves the npm half only -- a defence asserted without being measured.",
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
